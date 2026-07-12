// ── Standalone Seed Script (Beta Readiness) ──────────────────────────────────
// Runs the platform's existing, already-idempotent seed routines outside of
// a full server boot — useful for provisioning a brand-new environment (e.g.
// a fresh beta/staging database) without starting the HTTP server, sockets,
// cron jobs, or any other boot-time side effects.
//
// This does NOT introduce new seed logic. It calls the exact same functions
// that already run automatically on every server start:
//   - seedDatabase()        (server/routes.ts)   — admin account, core
//                                                   services, sector
//                                                   templates, pricing plans,
//                                                   extra addons
//   - seedDefaultAccounts() (server/mail-imap.ts) — default system mail
//                                                    accounts
//
// Usage:
//   npx tsx scripts/seed.ts
//
// Safe to re-run any number of times — both routines are already written to
// be idempotent (they check for existing records before creating new ones).

import mongoose from "mongoose";
import { connectToDatabase } from "../server/db";
import { seedDatabase } from "../server/routes";
import { seedDefaultAccounts } from "../server/mail-imap";

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log(" QIROX — Standalone Seed Script");
  console.log("═══════════════════════════════════════════════════════════");

  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not set. Aborting — refusing to seed without a target database.");
    process.exit(1);
  }

  console.log("→ Connecting to MongoDB...");
  await connectToDatabase();
  console.log("✅ Connected.");

  console.log("→ Seeding admin account, core services, sector templates, pricing plans, extra addons...");
  await seedDatabase();
  console.log("✅ seedDatabase() complete.");

  console.log("→ Seeding default system mail accounts...");
  await seedDefaultAccounts();
  console.log("✅ seedDefaultAccounts() complete.");

  console.log("\nAll seed routines completed successfully.");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed script failed:", err);
  process.exit(1);
});
