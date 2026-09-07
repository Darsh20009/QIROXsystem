// ── Environment Validation Checklist (CLI) ───────────────────────────────────
// Beta Readiness — standalone environment/config validator.
// Runs the exact same ConfigModule validation the server runs on boot, but
// without starting Express, connecting to MongoDB, or booting any workflow.
// Safe to run repeatedly and in CI before a deploy.
//
// Usage:
//   npx tsx scripts/check-env.ts
//
// Exit code 0  → all required config present (warnings are allowed).
// Exit code 1  → at least one required config value is missing/invalid.

import { loadAllConfigs } from "../server/infrastructure/config-loader";

function main() {
  const result = loadAllConfigs(process.env);

  console.log("═══════════════════════════════════════════════════════════");
  console.log(" QIROX — Environment Validation Checklist");
  console.log("═══════════════════════════════════════════════════════════");

  if (result.errors.length === 0) {
    console.log("✅ No required configuration is missing.");
  } else {
    console.log(`❌ ${result.errors.length} required configuration value(s) missing:`);
    for (const e of result.errors) {
      console.log(`   [${e.module}] ${e.field} — ${e.message}`);
    }
  }

  if (result.warnings.length > 0) {
    console.log(`\n⚠️  ${result.warnings.length} optional configuration warning(s):`);
    for (const w of result.warnings) {
      console.log(`   [${w.module}] ${w.field} — ${w.message}`);
    }
  } else {
    console.log("\n✅ No optional configuration warnings.");
  }

  console.log("\n───────────────────────────────────────────────────────────");
  console.log(result.ok ? "RESULT: OK — safe to boot." : "RESULT: FAILING — server will refuse to boot as-is.");
  console.log("───────────────────────────────────────────────────────────\n");

  process.exit(result.ok ? 0 : 1);
}

main();
