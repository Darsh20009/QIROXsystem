// ── Email Controller ───────────────────────────────────────────────────────────
// Request/Response handling only — no business rules, no DB queries.
//
// Purpose:
//   Translate Express Request into service inputs and service outputs
//   into Express Response, with no business logic in between.
//
// Responsibilities:
//   - Extract typed inputs from req.body / req.user.
//   - Call the correct service function.
//   - Map service result to the correct HTTP status code and JSON body.
//   - Catch unhandled errors and respond with 500.
//
// Scope (Migration 009):
//   Only the admin test-email endpoint is handled here.
//   All other email sends happen inside other domain controllers (auth,
//   orders, projects, etc.) and continue to import from server/email.ts
//   until their respective domain migrations are complete.
//
// Future migration role:
//   As each consuming domain migrates, its email calls will route through
//   this controller or the service layer directly.

import type { Request, Response } from "express";
import * as service from "./service";
import * as mapper  from "./mapper";

// ── Handlers ──────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/email/test  (future route — not yet registered)
 * Send a test email to verify the current SMTP configuration.
 * Admin only — role enforcement is handled in routes.ts.
 *
 * Body: { to: string, name?: string }
 */
export async function sendTestEmail(req: Request, res: Response): Promise<void> {
  try {
    const { to, name } = req.body as { to?: string; name?: string };
    if (!to) {
      res.status(400).json({ error: "to is required" });
      return;
    }
    const sent = await service.sendTestEmail(to, name || to.split("@")[0]);
    res.json(mapper.toSendResponse({ sent }));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/admin/email/broadcast  (future route — not yet registered)
 * Send a direct/broadcast email from the admin panel.
 * Admin only — role enforcement is handled in routes.ts.
 *
 * Body: { to: string, toName?: string, subject: string, body: string }
 */
export async function broadcastEmail(req: Request, res: Response): Promise<void> {
  try {
    const { to, toName, subject, body } = req.body as {
      to?: string; toName?: string; subject?: string; body?: string;
    };
    if (!to || !subject || !body) {
      res.status(400).json({ error: "to, subject, and body are required" });
      return;
    }
    const sent = await service.sendDirectEmail(to, toName || to, subject, body);
    res.json(mapper.toSendResponse({ sent }));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
