// ── Mail Domain — Routes ───────────────────────────────────────────────────────
// Express routing only — no business logic, no direct DB access.
//
// Auth guards applied here:
//   • 401 — unauthenticated
//   • 403 — authenticated but wrong role or entitlement
//
// Customer accounts are isolated to their own paid mailbox; internal accounts
// remain restricted by the mail domain access rules.
// Admin-only endpoints additionally enforce role === "admin".

import type { Express, Request, Response } from "express";
import * as controller from "./controller";
import { seedDefaultAccounts } from "../../mail-imap";
import { provisionCustomerMailbox, provisionEmployeeMailbox } from "../../mail-provisioning";

export async function registerMailRoutes(app: Express): Promise<void> {
  // Seed default corporate accounts on startup (preserves legacy behaviour)
  if (process.env.NODE_ENV !== "test") {
    seedDefaultAccounts().catch(console.error);
  }

  // ── Account management (admin only) ──────────────────────────────────────

  /** GET /api/mail/accounts — list accounts current user can access */
  app.get("/api/mail/accounts", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) { res.sendStatus(401); return; }
    controller.listAccounts(req, res);
  });

  /** POST /api/mail/customer-account — paid clients create their own mailbox */
  app.post("/api/mail/customer-account", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) { res.sendStatus(401); return; }
    const user = req.user as any;
    if ((user.role || "client") !== "client") { res.status(403).json({ error: "هذا المسار مخصص للعملاء" }); return; }
    try {
      const result = await provisionCustomerMailbox({
        userId: String(user._id || user.id),
        name: req.body?.name,
        password: req.body?.password,
      });
      if (!result.ok) { res.status(result.status).json({ error: result.error, ...(result.meta || {}) }); return; }
      res.json(result.data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "تعذر إنشاء البريد" });
    }
  });

  /** POST /api/mail/employee-account — employee creates a first mailbox */
  app.post("/api/mail/employee-account", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) { res.sendStatus(401); return; }
    const user = req.user as any;
    if ((user.role || "client") === "client") { res.status(403).json({ error: "هذا المسار مخصص للموظفين" }); return; }
    try {
      const result = await provisionEmployeeMailbox({
        userId: String(user._id || user.id),
        name: req.body?.name,
        password: req.body?.password,
      });
      if (!result.ok) { res.status(result.status).json({ error: result.error, ...(result.meta || {}) }); return; }
      res.json(result.data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "تعذر إنشاء البريد" });
    }
  });

  /** GET /api/mail/accounts/all — admin: all accounts with assigned user details */
  app.get("/api/mail/accounts/all", (req: Request, res: Response) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      res.sendStatus(403); return;
    }
    controller.listAllAccounts(req, res);
  });

  /** POST /api/mail/accounts — admin creates new account */
  app.post("/api/mail/accounts", (req: Request, res: Response) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      res.sendStatus(403); return;
    }
    controller.createAccount(req, res);
  });

  /** PUT /api/mail/accounts/:id — admin updates/assigns account */
  app.put("/api/mail/accounts/:id", (req: Request, res: Response) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      res.sendStatus(403); return;
    }
    controller.updateAccount(req, res);
  });

  /** DELETE /api/mail/accounts/:id — admin deletes account + cache */
  app.delete("/api/mail/accounts/:id", (req: Request, res: Response) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      res.sendStatus(403); return;
    }
    controller.deleteAccount(req, res);
  });

  // ── Mailbox operations (authorized employees and customer-owned accounts) ──

  /** GET /api/mail/inbox/:accountId?folder=INBOX */
  app.get("/api/mail/inbox/:accountId", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) { res.sendStatus(401); return; }
    controller.getInbox(req, res);
  });

  /** GET /api/mail/folders/:accountId */
  app.get("/api/mail/folders/:accountId", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) { res.sendStatus(401); return; }
    controller.getFolders(req, res);
  });

  /** POST /api/mail/seen/:accountId — mark message seen (fire-and-forget) */
  app.post("/api/mail/seen/:accountId", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) { res.sendStatus(401); return; }
    controller.markSeen(req, res);
  });

  /** DELETE /api/mail/message/:accountId/:uid */
  app.delete("/api/mail/message/:accountId/:uid", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) { res.sendStatus(401); return; }
    controller.deleteMessage(req, res);
  });

  /** POST /api/mail/test-connection — test IMAP+SMTP credentials (admin only) */
  app.post("/api/mail/test-connection", (req: Request, res: Response) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      res.sendStatus(403); return;
    }
    controller.testConnection(req, res);
  });

  /** POST /api/mail/send — send branded email from an account */
  app.post("/api/mail/send", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) { res.sendStatus(401); return; }
    controller.sendMail(req, res);
  });
}
