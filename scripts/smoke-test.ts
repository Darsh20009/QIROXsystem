// ── End-to-End Smoke Test Suite (Beta Readiness) ─────────────────────────────
// Hits the running server over HTTP and checks that the platform's critical
// paths respond as expected. Read-only / non-destructive wherever possible.
// Does not require a new test framework — plain fetch + assertions, run with
// tsx, so it works the same in this environment as any other script here.
//
// Usage:
//   npx tsx scripts/smoke-test.ts
//   BASE_URL=https://your-deployed-app.example npx tsx scripts/smoke-test.ts
//
// Exit code 0 → all checks passed (or were skipped due to missing optional
//               config, which is reported but not a failure).
// Exit code 1 → at least one required check failed.

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

interface CheckResult {
  name: string;
  status: "pass" | "fail" | "skip";
  detail: string;
  ms: number;
}

const results: CheckResult[] = [];

async function check(name: string, fn: () => Promise<{ ok: boolean; detail: string } | { skip: true; detail: string }>) {
  const start = Date.now();
  try {
    const r = await fn();
    const ms = Date.now() - start;
    if ("skip" in r) {
      results.push({ name, status: "skip", detail: r.detail, ms });
    } else {
      results.push({ name, status: r.ok ? "pass" : "fail", detail: r.detail, ms });
    }
  } catch (err: any) {
    results.push({ name, status: "fail", detail: err.message, ms: Date.now() - start });
  }
}

async function main() {
  console.log(`Running smoke tests against ${BASE_URL}\n`);

  // 1. Boot / liveness
  await check("Liveness (/health/live)", async () => {
    const r = await fetch(`${BASE_URL}/health/live`);
    return { ok: r.status === 200, detail: `HTTP ${r.status}` };
  });

  // 2. Early health check
  await check("Early health check (/api/health)", async () => {
    const r = await fetch(`${BASE_URL}/api/health`);
    const body = await r.json().catch(() => ({}));
    return { ok: r.status === 200 && body.status === "ok", detail: `HTTP ${r.status} — ${JSON.stringify(body)}` };
  });

  // 3. Database connectivity (readiness probe)
  await check("Database connectivity (/health/ready)", async () => {
    const r = await fetch(`${BASE_URL}/health/ready`);
    return { ok: r.status === 200, detail: `HTTP ${r.status} — DB ${r.status === 200 ? "connected" : "NOT connected"}` };
  });

  // 4. Feature flags surface (also proves FEATURE_PROPOSAL_V2 stayed off)
  await check("Feature flags snapshot (/api/public/feature-flags)", async () => {
    const r = await fetch(`${BASE_URL}/api/public/feature-flags`);
    const body = await r.json().catch(() => ({}));
    const proposalV2 = body?.flags?.FEATURE_PROPOSAL_V2?.enabled;
    return {
      ok: r.status === 200 && proposalV2 === false,
      detail: `HTTP ${r.status} — FEATURE_PROPOSAL_V2.enabled=${proposalV2}`,
    };
  });

  // 5. Authentication — unauthenticated /api/user must be rejected, not error
  await check("Auth guard (/api/user without session)", async () => {
    const r = await fetch(`${BASE_URL}/api/user`);
    return { ok: r.status === 401, detail: `HTTP ${r.status} (expected 401)` };
  });

  // 6. Login endpoint responds sanely to bad credentials (proves the auth
  //    pipeline itself — hashing, session store, rate limiter — is alive)
  await check("Login pipeline (/api/login with bad credentials)", async () => {
    const r = await fetch(`${BASE_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "smoke-test-nonexistent-user", password: "wrong" }),
    });
    // 401 = pipeline works and correctly rejected; 429 = rate-limited from a
    // prior run, which also proves the pipeline is alive.
    return { ok: r.status === 401 || r.status === 429, detail: `HTTP ${r.status}` };
  });

  // 7. Email delivery — connection check only, does not send a real email
  await check("Email delivery (/api/mail/test-connection)", async () => {
    const r = await fetch(`${BASE_URL}/api/mail/test-connection`, { method: "POST" });
    if (r.status === 401 || r.status === 403) {
      return { skip: true, detail: `HTTP ${r.status} — requires an authenticated admin session, skipped in unauthenticated smoke run` };
    }
    const body = await r.json().catch(() => ({}));
    return { ok: r.status === 200, detail: `HTTP ${r.status} — ${JSON.stringify(body).slice(0, 200)}` };
  });

  // 8. AI endpoint — presence + rate-limit headers (does not require a valid
  //    session; handler itself may 401, we're checking the route + limiter exist)
  await check("AI endpoint reachable (/api/ai/message)", async () => {
    const r = await fetch(`${BASE_URL}/api/ai/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "smoke test ping" }),
    });
    const hasRateLimitHeader = r.headers.has("ratelimit-limit") || r.headers.has("x-ratelimit-limit");
    return {
      ok: r.status !== 404 && r.status !== 500,
      detail: `HTTP ${r.status}, rate-limit headers present: ${hasRateLimitHeader}`,
    };
  });

  // 9. Legacy Quotation system — must be completely unaffected by Sprint D
  await check("Legacy Quotations unaffected (/api/quotations)", async () => {
    const r = await fetch(`${BASE_URL}/api/quotations`);
    return { ok: r.status === 401, detail: `HTTP ${r.status} (expected 401 — unchanged auth-gated behaviour)` };
  });

  // 10. Proposal V2 — must 401 (auth) then 404 (flag) when authenticated;
  //     unauthenticated we can only confirm it isn't a 500 and isn't live.
  await check("Proposal V2 stays inert while flag is off (/api/v2/proposals)", async () => {
    const r = await fetch(`${BASE_URL}/api/v2/proposals`);
    return { ok: r.status === 401 || r.status === 404, detail: `HTTP ${r.status}` };
  });

  // 11. OpenAPI docs reachable
  await check("API docs reachable (/api-docs.json)", async () => {
    const r = await fetch(`${BASE_URL}/api-docs.json`);
    return { ok: r.status === 200, detail: `HTTP ${r.status}` };
  });

  // ── Report ──────────────────────────────────────────────────────────────
  console.log("═══════════════════════════════════════════════════════════");
  console.log(" QIROX — Smoke Test Results");
  console.log("═══════════════════════════════════════════════════════════");
  for (const r of results) {
    const icon = r.status === "pass" ? "✅" : r.status === "skip" ? "⏭️ " : "❌";
    console.log(`${icon} ${r.name} (${r.ms}ms)\n     ${r.detail}`);
  }

  const failed = results.filter(r => r.status === "fail");
  const passed = results.filter(r => r.status === "pass");
  const skipped = results.filter(r => r.status === "skip");

  console.log("\n───────────────────────────────────────────────────────────");
  console.log(`${passed.length} passed, ${failed.length} failed, ${skipped.length} skipped (of ${results.length})`);
  console.log("───────────────────────────────────────────────────────────\n");

  process.exit(failed.length > 0 ? 1 : 0);
}

main();
