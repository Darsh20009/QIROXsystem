// ── Mail Domain — Controller ───────────────────────────────────────────────────
// HTTP boundary layer.
//
// Responsibilities:
//   • Extract req parameters and body.
//   • Call the service layer.
//   • Map ServiceResult to HTTP status codes and response bodies.
//   • Never contain business logic.

import type { Request, Response } from "express";
import * as service from "./service";
import type { MailUser } from "./types";

function extractUser(req: Request): MailUser {
  const u = req.user as any;
  return {
    _id:  (u._id || u.id || "").toString(),
    role: u.role || "client",
  };
}

function send<T>(res: Response, result: service.ServiceResult<T>): void {
  if (result.ok) {
    res.json(result.data);
  } else {
    res.status(result.status).json({ error: result.error });
  }
}

// ── Handlers ──────────────────────────────────────────────────────────────────

/** GET /api/mail/accounts */
export async function listAccounts(req: Request, res: Response): Promise<void> {
  try {
    const user = extractUser(req);
    send(res, await service.listAccounts(user));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/** GET /api/mail/accounts/all */
export async function listAllAccounts(req: Request, res: Response): Promise<void> {
  try {
    send(res, await service.listAllAccounts());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/** POST /api/mail/accounts */
export async function createAccount(req: Request, res: Response): Promise<void> {
  try {
    const { emailAddress, password } = req.body;
    if (!emailAddress || !password) {
      res.status(400).json({ error: "emailAddress and password required" });
      return;
    }
    send(res, await service.createAccount(req.body));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/** PUT /api/mail/accounts/:id */
export async function updateAccount(req: Request, res: Response): Promise<void> {
  try {
    send(res, await service.updateAccount(req.params.id, req.body));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/** DELETE /api/mail/accounts/:id */
export async function deleteAccount(req: Request, res: Response): Promise<void> {
  try {
    send(res, await service.deleteAccount(req.params.id));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/** GET /api/mail/inbox/:accountId */
export async function getInbox(req: Request, res: Response): Promise<void> {
  try {
    const user   = extractUser(req);
    const folder = (req.query.folder as string) || "INBOX";
    const result = await service.getInbox(req.params.accountId, folder, user);
    send(res, result);
  } catch (err: any) {
    console.error("[Mail] inbox error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

/** GET /api/mail/folders/:accountId */
export async function getFolders(req: Request, res: Response): Promise<void> {
  try {
    const user = extractUser(req);
    send(res, await service.getFolders(req.params.accountId, user));
  } catch (err: any) {
    res.json(["INBOX", "Sent", "Drafts", "Trash"]);
  }
}

/** POST /api/mail/seen/:accountId */
export async function markSeen(req: Request, res: Response): Promise<void> {
  try {
    const user = extractUser(req);
    const { uid, folder } = req.body;
    send(res, await service.markMessageSeen(
      req.params.accountId,
      folder || "INBOX",
      Number(uid),
      user
    ));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/** DELETE /api/mail/message/:accountId/:uid */
export async function deleteMessage(req: Request, res: Response): Promise<void> {
  try {
    const user   = extractUser(req);
    const folder = (req.query.folder as string) || "INBOX";
    send(res, await service.deleteMailMessage(
      req.params.accountId,
      folder,
      Number(req.params.uid),
      user
    ));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/** POST /api/mail/test-connection */
export async function testConnection(req: Request, res: Response): Promise<void> {
  try {
    const { accountId, emailAddress, password } = req.body;
    if (!accountId && (!emailAddress || !password)) {
      res.status(400).json({ error: "emailAddress and password required" });
      return;
    }
    send(res, await service.testConnection(req.body));
  } catch (err: any) {
    res.status(500).json({ imap: false, smtp: false, error: err.message });
  }
}

/** POST /api/mail/send */
export async function sendMail(req: Request, res: Response): Promise<void> {
  try {
    const user = extractUser(req);
    const { accountId, to, cc, subject, body, attachments } = req.body;
    if (!accountId || !to || !subject || !body) {
      res.status(400).json({ error: "accountId, to, subject, body required" });
      return;
    }
    const result = await service.sendAccountMail(
      {
        accountId,
        to,
        cc:          cc || undefined,
        subject,
        body,
        attachments: Array.isArray(attachments) ? attachments : [],
      },
      user
    );
    if (!result.ok) {
      console.error("[Mail] send error:", result.error);
    }
    send(res, result);
  } catch (err: any) {
    console.error("[Mail] send error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
