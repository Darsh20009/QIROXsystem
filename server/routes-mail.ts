import type { Express } from "express";

/**
 * Corporate Mail routes — IMAP/SMTP email account management for employees.
 * Extracted from server/routes.ts to reduce file size.
 */
export async function registerMailRoutes(app: Express): Promise<void> {
  // Import models and mail utilities
  const { MailAccountModel, MailCacheModel, UserModel } = await import("./models");
  const { fetchInbox, fetchFolders, markSeen, deleteMessage, sendMail, seedDefaultAccounts } = await import("./mail-imap");

  // Seed default accounts on startup
  seedDefaultAccounts().catch(console.error);

  function canAccessAccount(user: any, account: any): boolean {
    if (!user) return false;
    const role = user.role || "client";
    const uid = (user._id || user.id || "").toString();
    if (role === "admin") return true;
    // Legacy single-assignee
    if (account.assignedUserId && account.assignedUserId.toString() === uid) return true;
    // New multi-assignee list
    if (Array.isArray(account.assignedUserIds) && account.assignedUserIds.some((x: any) => String(x) === uid)) return true;
    if (account.isShared && account.sharedWith?.includes(role)) return true;
    // CEO/CTO can see shared inboxes
    if (["ceo","cto","manager"].includes(role) && account.isShared) return true;
    return false;
  }

  // GET /api/mail/accounts — list accounts current user can access
  app.get("/api/mail/accounts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const role = user.role || "client";
    if (role === "client") return res.sendStatus(403);
    try {
      const all = await MailAccountModel.find().lean() as any[];
      const uid = (user._id || user.id || "").toString();
      const filtered = all.filter(a => {
        if (role === "admin") return true;
        if (a.assignedUserId && a.assignedUserId.toString() === uid) return true;
        if (Array.isArray(a.assignedUserIds) && a.assignedUserIds.some((x: any) => String(x) === uid)) return true;
        if (a.isShared && a.sharedWith?.includes(role)) return true;
        if (["ceo","cto","manager"].includes(role) && a.isShared) return true;
        return false;
      });
      // Remove passwords from response
      const safe = filtered.map(a => { const { password, ...rest } = a; return { ...rest, id: a._id.toString() }; });
      res.json(safe);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/mail/accounts/all — admin only: all accounts with full info
  app.get("/api/mail/accounts/all", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    try {
      const all = await MailAccountModel.find().lean() as any[];
      // Get assigned user names (supports both legacy single + new multi list)
      const withUsers = await Promise.all(all.map(async (a) => {
        // Combine legacy assignedUserId with new assignedUserIds (deduped)
        const idSet = new Set<string>();
        if (a.assignedUserId) idSet.add(String(a.assignedUserId));
        (a.assignedUserIds || []).forEach((x: any) => idSet.add(String(x)));
        const ids = [...idSet];
        let assignedUsers: any[] = [];
        if (ids.length) {
          const users = await UserModel.find({ _id: { $in: ids } }).select("fullName username role").lean() as any[];
          assignedUsers = users.map(u => ({ id: u._id.toString(), fullName: u.fullName || u.username, role: u.role }));
        }
        // Keep `assignedUser` for backward compatibility (first user)
        const assignedUser = assignedUsers[0] || null;
        const { password, ...rest } = a;
        return { ...rest, id: a._id.toString(), assignedUserIds: ids, assignedUser, assignedUsers };
      }));
      res.json(withUsers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/mail/accounts — admin creates new account
  app.post("/api/mail/accounts", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    try {
      const { emailAddress, password, displayName, jobTitle, imapHost, imapPort, smtpHost, smtpPort, isShared, sharedWith, assignedUserIds } = req.body;
      if (!emailAddress || !password) return res.status(400).json({ error: "emailAddress and password required" });
      const account = await MailAccountModel.create({
        emailAddress, password,
        displayName: displayName || "",
        jobTitle: jobTitle || "",
        imapHost: imapHost || "server222.web-hosting.com",
        imapPort: imapPort || 993,
        smtpHost: smtpHost || "server222.web-hosting.com",
        smtpPort: smtpPort || 465,
        isShared: !!isShared,
        sharedWith: sharedWith || [],
        assignedUserIds: Array.isArray(assignedUserIds) ? assignedUserIds : [],
      });
      const { password: _pw, ...safe } = (account.toObject() as any);
      res.json({ ...safe, id: account._id.toString() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/mail/accounts/:id — admin updates/assigns account
  app.put("/api/mail/accounts/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    try {
      const { assignedUserId, assignedUserIds, displayName, jobTitle, isShared, sharedWith, password } = req.body;
      const update: any = {};
      if (assignedUserId !== undefined) update.assignedUserId = assignedUserId || null;
      if (assignedUserIds !== undefined) {
        update.assignedUserIds = Array.isArray(assignedUserIds) ? assignedUserIds : [];
        // Clear legacy field once we move to the array model so the UI is the single source of truth
        update.assignedUserId = null;
      }
      if (displayName !== undefined) update.displayName = displayName;
      if (jobTitle !== undefined) update.jobTitle = jobTitle;
      if (isShared !== undefined) update.isShared = isShared;
      if (sharedWith !== undefined) update.sharedWith = sharedWith;
      if (password) update.password = password;
      const account = await MailAccountModel.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).lean() as any;
      if (!account) return res.status(404).json({ error: "Not found" });
      const { password: _pw, ...safe } = account;
      res.json({ ...safe, id: account._id.toString() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/mail/accounts/:id — admin deletes account
  app.delete("/api/mail/accounts/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    try {
      await MailAccountModel.findByIdAndDelete(req.params.id);
      await MailCacheModel.deleteMany({ accountId: req.params.id });
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/mail/inbox/:accountId?folder=INBOX — fetch emails
  app.get("/api/mail/inbox/:accountId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if ((user.role || "") === "client") return res.sendStatus(403);
    try {
      const account = await MailAccountModel.findById(req.params.accountId).lean() as any;
      if (!account) return res.status(404).json({ error: "Account not found" });
      if (!canAccessAccount(user, account)) return res.sendStatus(403);
      const folder = (req.query.folder as string) || "INBOX";
      const messages = await fetchInbox(req.params.accountId, folder, 40);
      res.json(messages);
    } catch (err: any) {
      console.error("[Mail] inbox error:", err.message);
      // Return cached if IMAP fails
      const cached = await MailCacheModel.find({ accountId: req.params.accountId, folder: (req.query.folder as string) || "INBOX" }).sort({ date: -1 }).limit(40).lean();
      res.json(cached.map(m => ({ ...m, uid: m.uid, id: (m as any)._id?.toString() })));
    }
  });

  // GET /api/mail/folders/:accountId — fetch folder list
  app.get("/api/mail/folders/:accountId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    try {
      const account = await MailAccountModel.findById(req.params.accountId).lean() as any;
      if (!account || !canAccessAccount(user, account)) return res.sendStatus(403);
      const folders = await fetchFolders(req.params.accountId);
      res.json(folders);
    } catch (err: any) {
      res.json(["INBOX", "Sent", "Drafts", "Trash"]);
    }
  });

  // POST /api/mail/seen/:accountId — mark message as seen (fire-and-forget IMAP)
  app.post("/api/mail/seen/:accountId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    try {
      const account = await MailAccountModel.findById(req.params.accountId).lean() as any;
      if (!account || !canAccessAccount(user, account)) return res.sendStatus(403);
      const { uid, folder } = req.body;
      // Respond immediately — markSeen handles cache + async IMAP
      markSeen(req.params.accountId, folder || "INBOX", Number(uid)).catch(() => {});
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/mail/message/:accountId/:uid — delete message
  app.delete("/api/mail/message/:accountId/:uid", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    try {
      const account = await MailAccountModel.findById(req.params.accountId).lean() as any;
      if (!account || !canAccessAccount(user, account)) return res.sendStatus(403);
      const { folder } = req.query;
      await deleteMessage(req.params.accountId, (folder as string) || "INBOX", Number(req.params.uid));
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/mail/test-connection — test IMAP+SMTP for an account or supplied credentials
  app.post("/api/mail/test-connection", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    try {
      const { accountId, emailAddress, password, imapHost, imapPort, smtpHost, smtpPort } = req.body;
      let creds: { emailAddress: string; password: string; imapHost: string; imapPort: number; smtpHost: string; smtpPort: number };
      if (accountId) {
        const acc = await MailAccountModel.findById(accountId).lean() as any;
        if (!acc) return res.status(404).json({ error: "Account not found" });
        creds = {
          emailAddress: acc.emailAddress,
          password: password || acc.password,
          imapHost: imapHost || acc.imapHost,
          imapPort: imapPort || acc.imapPort,
          smtpHost: smtpHost || acc.smtpHost,
          smtpPort: smtpPort || acc.smtpPort,
        };
      } else {
        if (!emailAddress || !password) return res.status(400).json({ error: "emailAddress and password required" });
        creds = {
          emailAddress,
          password,
          imapHost: imapHost || "server222.web-hosting.com",
          imapPort: imapPort || 993,
          smtpHost: smtpHost || "server222.web-hosting.com",
          smtpPort: smtpPort || 465,
        };
      }
      const { testMailConnection } = await import("./mail-imap");
      const result = await testMailConnection(creds);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ imap: false, smtp: false, error: err.message });
    }
  });

  // POST /api/mail/send — send branded email
  app.post("/api/mail/send", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if ((user.role || "") === "client") return res.sendStatus(403);
    try {
      const { accountId, to, cc, subject, body, attachments } = req.body;
      if (!accountId || !to || !subject || !body) return res.status(400).json({ error: "accountId, to, subject, body required" });
      const account = await MailAccountModel.findById(accountId).lean() as any;
      if (!account || !canAccessAccount(user, account)) return res.sendStatus(403);
      await sendMail({ accountId, to, cc: cc || undefined, subject, body, attachments: Array.isArray(attachments) ? attachments : [] });
      res.json({ ok: true });
    } catch (err: any) {
      console.error("[Mail] send error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });
}
