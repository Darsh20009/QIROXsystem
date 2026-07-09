import type { Express } from "express";

/**
 * PWA utility routes + Lead Data CRM routes.
 * Extracted from server/routes.ts to reduce file size.
 */
export async function registerPwaRoutes(app: Express): Promise<void> {
  // ─── PWA: Share Target ─────────────────────────────────
  app.post("/share-target", async (req, res) => {
    const { title, text, url } = req.body || {};
    const params = new URLSearchParams();
    if (title) params.set("title", title);
    if (text) params.set("text", text);
    if (url) params.set("url", url);
    const query = params.toString() ? `?${params.toString()}` : "";
    res.redirect(303, `/order${query}&source=share`);
  });

  // ─── PWA: File Handler ─────────────────────────────────
  app.get("/open-file", (req, res) => {
    res.redirect(302, "/dashboard?source=file-handler");
  });

  // ─── PWA: Protocol Handler ─────────────────────────────
  app.get("/handle", (req, res) => {
    const protocol = String(req.query.protocol || "");
    if (protocol.startsWith("mailto:")) {
      const email = protocol.replace("mailto:", "");
      return res.redirect(302, `/contact?email=${encodeURIComponent(email)}&source=protocol`);
    }
    if (protocol.startsWith("web+qirox://")) {
      const path = protocol.replace("web+qirox://", "/");
      return res.redirect(302, `${path}?source=protocol`);
    }
    res.redirect(302, "/?source=protocol");
  });

  // ─── PWA: Widget Stats API ─────────────────────────────
  app.get("/api/widget/stats", async (req, res) => {
    try {
      const { OrderModel, UserModel } = await import("./models");
      const [totalOrders, activeUsers] = await Promise.all([
        OrderModel.countDocuments(),
        UserModel.countDocuments({ role: "client" }),
      ]);
      res.json({
        totalOrders,
        activeUsers,
        lastUpdated: new Date().toISOString(),
        appName: "QIROX Studio",
        tagline: "مصنع الأنظمة الرقمية",
      });
    } catch (_) {
      res.json({ totalOrders: 0, activeUsers: 0, lastUpdated: new Date().toISOString() });
    }
  });

  // ─── PWA: Notifications Unread Count ──────────────────
  app.get("/api/notifications/unread-count", async (req, res) => {
    if (!req.isAuthenticated()) return res.json({ count: 0 });
    try {
      const { NotificationModel } = await import("./models");
      const count = await NotificationModel.countDocuments({
        userId: (req.user as any)._id,
        read: false,
      });
      res.json({ count });
    } catch (_) {
      res.json({ count: 0 });
    }
  });

  // ─── Lead Data (داتا العملاء المحتملين) ─────────────────────────────────────
  const LEAD_DATA_ROLES = ["admin", "manager", "sales_manager", "sales", "marketing", "support"];
  function canAccessLeads(req: any) {
    if (!req.isAuthenticated()) return false;
    const role = (req.user as any).role;
    return LEAD_DATA_ROLES.includes(role);
  }

  app.get("/api/leads-data", async (req, res) => {
    if (!canAccessLeads(req)) return res.status(401).json({ error: "غير مصرح" });
    try {
      const { LeadDataModel } = await import("./models");
      const { status, search, page = "1", limit = "50" } = req.query as any;
      const query: any = {};
      if (status && status !== "all") query.status = status;
      if (search) {
        query.$or = [
          { companyName: { $regex: search, $options: "i" } },
          { contactName: { $regex: search, $options: "i" } },
          { phone:       { $regex: search, $options: "i" } },
          { email:       { $regex: search, $options: "i" } },
        ];
      }
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [leads, total] = await Promise.all([
        LeadDataModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
        LeadDataModel.countDocuments(query),
      ]);
      // Stats per status
      const stats = await LeadDataModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);
      const statsMap: Record<string, number> = {};
      stats.forEach((s: any) => { statsMap[s._id] = s.count; });
      res.json({ leads, total, stats: statsMap });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/leads-data", async (req, res) => {
    if (!canAccessLeads(req)) return res.status(401).json({ error: "غير مصرح" });
    try {
      const { LeadDataModel, MarketingEmailModel } = await import("./models");
      const user = req.user as any;
      const { companyName, contactName, phone, email, sector, source, notes } = req.body;
      if (!companyName) return res.status(400).json({ error: "اسم المؤسسة مطلوب" });
      const lead = await LeadDataModel.create({
        companyName, contactName, phone, email, sector, source: source || "manual", notes,
        assignedTo: String(user._id),
        assignedToName: user.fullName || user.username,
        statusHistory: [{ status: "new", changedBy: user.username, note: "تم الإضافة" }],
      });
      // Auto-add email to marketing list
      if (email) {
        await MarketingEmailModel.updateOne(
          { email: email.toLowerCase().trim() },
          { $setOnInsert: { email: email.toLowerCase().trim(), name: contactName || companyName, source: "leads_data" } },
          { upsert: true }
        );
        await LeadDataModel.findByIdAndUpdate(lead._id, { addedToMarketing: true });
      }
      res.json({ lead });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/leads-data/:id", async (req, res) => {
    if (!canAccessLeads(req)) return res.status(401).json({ error: "غير مصرح" });
    try {
      const { LeadDataModel, MarketingEmailModel } = await import("./models");
      const { sendCallRatingEmail } = await import("./email");
      const { randomBytes } = await import("crypto");
      const user = req.user as any;
      const { status, notes, reminderAt, contactName, phone, email, sector, companyName } = req.body;
      const lead = await LeadDataModel.findById(req.params.id);
      if (!lead) return res.status(404).json({ error: "العميل غير موجود" });

      const update: any = {};
      if (companyName !== undefined) update.companyName = companyName;
      if (contactName  !== undefined) update.contactName  = contactName;
      if (phone        !== undefined) update.phone        = phone;
      if (email        !== undefined) update.email        = email;
      if (sector       !== undefined) update.sector       = sector;
      if (notes        !== undefined) update.notes        = notes;
      if (reminderAt   !== undefined) update.reminderAt   = reminderAt;

      const prevStatus = (lead as any).status;
      if (status && status !== prevStatus) {
        update.status = status;
        update.lastContactedAt = new Date();
        if (status === "converted") update.convertedAt = new Date();
        await LeadDataModel.findByIdAndUpdate(lead._id, {
          $push: { statusHistory: { status, changedBy: user.username, note: notes || "" } }
        });

        // Send call rating email when status changes TO "contacted" and lead has email
        const leadEmail = email || (lead as any).email;
        if (status === "contacted" && leadEmail && !(lead as any).callRatingSentAt) {
          try {
            const token = randomBytes(24).toString("hex");
            const siteUrl = process.env.EMAIL_SITE_URL || "https://qiroxstudio.online";
            const ratingUrl = `${siteUrl}/rate-call/${token}`;
            update.callRatingToken = token;
            update.callRatingSentAt = new Date();
            const leadName = (lead as any).contactName || (lead as any).companyName;
            const agentName = user.fullName || user.username;
            // Fire and forget — don't block response
            sendCallRatingEmail(leadEmail, leadName, (lead as any).companyName, agentName, ratingUrl)
              .catch((err: any) => console.error("[LeadRating] Email error:", err.message));
          } catch (emailErr: any) {
            console.error("[LeadRating] Token gen error:", emailErr.message);
          }
        }
      }

      // Add email to marketing if converting
      const emailVal = email || (lead as any).email;
      if (emailVal && !(lead as any).addedToMarketing) {
        await MarketingEmailModel.updateOne(
          { email: emailVal.toLowerCase().trim() },
          { $setOnInsert: { email: emailVal.toLowerCase().trim(), name: (lead as any).contactName || (lead as any).companyName, source: "leads_data" } },
          { upsert: true }
        );
        update.addedToMarketing = true;
      }

      const updated = await LeadDataModel.findByIdAndUpdate(lead._id, { $set: update }, { new: true });
      res.json({ lead: updated });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Public rating routes (no auth needed)
  app.get("/api/leads/rate/:token", async (req, res) => {
    try {
      const { LeadDataModel } = await import("./models");
      const lead = await LeadDataModel.findOne({ callRatingToken: req.params.token });
      if (!lead) return res.status(404).json({ error: "الرابط غير صالح أو انتهت صلاحيته" });
      res.json({
        companyName: (lead as any).companyName,
        contactName: (lead as any).contactName,
        alreadyRated: !!(lead as any).callRatingScore,
        score: (lead as any).callRatingScore,
        comment: (lead as any).callRatingComment,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/leads/rate/:token", async (req, res) => {
    try {
      const { LeadDataModel } = await import("./models");
      const lead = await LeadDataModel.findOne({ callRatingToken: req.params.token });
      if (!lead) return res.status(404).json({ error: "الرابط غير صالح" });
      if ((lead as any).callRatingScore) return res.status(400).json({ error: "تم التقييم مسبقاً" });
      const { score, comment } = req.body;
      if (!score || score < 1 || score > 5) return res.status(400).json({ error: "تقييم غير صالح" });
      await LeadDataModel.findByIdAndUpdate(lead._id, {
        $set: {
          callRatingScore: score,
          callRatingComment: comment || "",
          callRatingSubmittedAt: new Date(),
        }
      });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Re-send rating email for a lead
  app.post("/api/leads-data/:id/resend-rating", async (req, res) => {
    if (!canAccessLeads(req)) return res.status(401).json({ error: "غير مصرح" });
    try {
      const { LeadDataModel } = await import("./models");
      const { sendCallRatingEmail } = await import("./email");
      const { randomBytes } = await import("crypto");
      const user = req.user as any;
      const lead = await LeadDataModel.findById(req.params.id);
      if (!lead) return res.status(404).json({ error: "العميل غير موجود" });
      const leadEmail = (lead as any).email;
      if (!leadEmail) return res.status(400).json({ error: "لا يوجد بريد إلكتروني" });
      const token = randomBytes(24).toString("hex");
      const siteUrl = process.env.EMAIL_SITE_URL || "https://qiroxstudio.online";
      const ratingUrl = `${siteUrl}/rate-call/${token}`;
      await LeadDataModel.findByIdAndUpdate(lead._id, {
        $set: {
          callRatingToken: token,
          callRatingSentAt: new Date(),
          callRatingScore: null,
          callRatingComment: "",
          callRatingSubmittedAt: null,
        }
      });
      await sendCallRatingEmail(leadEmail, (lead as any).contactName || (lead as any).companyName, (lead as any).companyName, user.fullName || user.username, ratingUrl);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/leads-data/:id", async (req, res) => {
    if (!canAccessLeads(req)) return res.status(401).json({ error: "غير مصرح" });
    try {
      const { LeadDataModel } = await import("./models");
      await LeadDataModel.findByIdAndDelete(req.params.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/leads-data/import", async (req, res) => {
    if (!canAccessLeads(req)) return res.status(401).json({ error: "غير مصرح" });
    try {
      const { LeadDataModel, MarketingEmailModel } = await import("./models");
      const user = req.user as any;
      const { leads: rows } = req.body as { leads: Array<{ companyName?: string; contactName?: string; phone?: string; email?: string; sector?: string }> };
      if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ error: "لا توجد بيانات" });
      let added = 0, skipped = 0;
      for (const row of rows) {
        if (!row.companyName) { skipped++; continue; }
        try {
          await LeadDataModel.create({
            companyName: row.companyName,
            contactName: row.contactName || "",
            phone: row.phone || "",
            email: row.email || "",
            sector: row.sector || "",
            source: "import",
            assignedTo: String(user._id),
            assignedToName: user.fullName || user.username,
            statusHistory: [{ status: "new", changedBy: user.username, note: "استيراد" }],
            addedToMarketing: !!row.email,
          });
          if (row.email) {
            await MarketingEmailModel.updateOne(
              { email: row.email.toLowerCase().trim() },
              { $setOnInsert: { email: row.email.toLowerCase().trim(), name: row.contactName || row.companyName, source: "leads_data" } },
              { upsert: true }
            );
          }
          added++;
        } catch { skipped++; }
      }
      res.json({ added, skipped });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
