// ── Email Domain Routes ────────────────────────────────────────────────────────
// Express routing only — no business rules, no DB queries, no response logic.
//
// Purpose:
//   Register email-domain HTTP routes on the Express application.
//   This file is the single entry point for HTTP surface of the email domain.
//
// Current state (Migration 009):
//   No new routes are registered in this migration.
//
//   The existing email-related HTTP routes in server/routes.ts remain
//   untouched and fully operational:
//     - POST /api/admin/connection-settings/email  (SMTP config + test send)
//     - POST /api/admin/email/broadcast            (direct broadcast)
//     - POST /api/auth/verify-email
//     - POST /api/auth/verify-otp
//     - POST /api/auth/reset-password
//     - POST /api/auth/verify-login-otp
//
//   registerEmailDomainRoutes() is a deliberate no-op in this migration.
//   Switching those routes to use this controller requires:
//     1. Verification that the service layer produces identical responses.
//     2. QA approval per the Zero Downtime Policy.
//
// Future migration role:
//   Once validation middleware is available (Migration 010+), routes will
//   be migrated from server/routes.ts to this file one by one:
//
//     app.post("/api/admin/email/test",
//       requireAdmin, validate.body(sendTestEmailSchema), controller.sendTestEmail);
//
//     app.post("/api/admin/email/broadcast",
//       requireAdmin, validate.body(broadcastEmailSchema), controller.broadcastEmail);
//
// Zero Downtime guarantee:
//   This file can be imported and called without any side effects.
//   Rollback is possible by removing the import — no routes will break.

import type { Express } from "express";

/**
 * Register email domain HTTP routes on the Express app.
 *
 * Currently a no-op — see file header for migration plan.
 * Safe to call at any time; has no observable side effects.
 */
export function registerEmailDomainRoutes(_app: Express): void {
  // No routes registered in Migration 009.
  // Routes will be added here as each consuming domain is verified.
}
