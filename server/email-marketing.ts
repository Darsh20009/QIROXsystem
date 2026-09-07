import type { Express } from "express";
import { randomBytes } from "crypto";
import {
  MarketingEmailModel,
  EmailCampaignModel,
  EmailCampaignRecipientModel,
  InterestedLeadModel,
  GlobalSentEmailModel,
} from "./models";
import { sendEmail } from "./email";
import { connManager } from "./connection-manager";

// ── Helpers ───────────────────────────────────────────────────────────────────

function genTrackId(): string {
  return randomBytes(16).toString("hex");
}

function getBaseUrl(): string {
  const domain = process.env.REPLIT_DEV_DOMAIN || process.env.EMAIL_SITE_URL || "https://qiroxstudio.online";
  return domain.startsWith("http") ? domain : `https://${domain}`;
}

/** Wrap all links in the HTML body with tracking redirects */
function injectTrackingLinks(html: string, trackId: string, baseUrl: string): string {
  return html.replace(/href="(https?:\/\/[^"]+)"/g, (_, url) => {
    const encoded = encodeURIComponent(url);
    return `href="${baseUrl}/api/email-marketing/track/click/${trackId}?url=${encoded}"`;
  });
}

/** Inject open-tracking 1x1 pixel before </body> */
function injectTrackingPixel(html: string, trackId: string, baseUrl: string): string {
  const pixel = `<img src="${baseUrl}/api/email-marketing/track/open/${trackId}" width="1" height="1" style="display:none" alt="" />`;
  if (html.includes("</body>")) return html.replace("</body>", `${pixel}</body>`);
  return html + pixel;
}

/** Build final tracked email HTML */
function buildTrackedEmail(htmlBody: string, trackId: string): string {
  const baseUrl = getBaseUrl();
  let html = injectTrackingLinks(htmlBody, trackId, baseUrl);
  html = injectTrackingPixel(html, trackId, baseUrl);
  return html;
}

// ── Daily bulk send (1000 emails) ────────────────────────────────────────────

export async function runDailyBulkCampaign(): Promise<{ sent: number; skipped: number; campaignId: string | null }> {
  // Find an active daily template (most recent manual campaign marked as template, or create default)
  const templateCampaign = await EmailCampaignModel.findOne({ type: "daily_bulk", status: "completed" }).sort({ completedAt: -1 }).lean();

  const subject = templateCampaign?.subject || "اكتشف QIROX — مصنع الأنظمة الرقمية";
  const htmlBody = templateCampaign?.htmlBody || getDefaultMarketingHtml();

  // Get emails not yet globally sent
  const alreadySent = await GlobalSentEmailModel.distinct("email");
  const candidates = await MarketingEmailModel.find({
    email: { $nin: alreadySent },
    unsubscribed: false,
    bounced: false,
  }).limit(1000).lean();

  if (candidates.length === 0) {
    return { sent: 0, skipped: 0, campaignId: null };
  }

  // Create campaign record
  const campaign = await EmailCampaignModel.create({
    name: `حملة يومية ${new Date().toLocaleDateString("ar-SA")}`,
    subject,
    htmlBody,
    type: "daily_bulk",
    status: "running",
    totalTarget: candidates.length,
    totalSent: 0,
    createdBy: "system",
  });

  let sent = 0;
  const recipients: any[] = [];

  for (const candidate of candidates) {
    const trackId = genTrackId();
    recipients.push({
      campaignId: campaign._id,
      email: candidate.email,
      name: candidate.name || "",
      trackId,
      status: "pending",
    });
  }

  await EmailCampaignRecipientModel.insertMany(recipients, { ordered: false }).catch(() => {});

  // Send emails in small batches to avoid SMTP overload
  const BATCH = 20;
  for (let i = 0; i < recipients.length; i += BATCH) {
    const chunk = recipients.slice(i, i + BATCH);
    await Promise.allSettled(
      chunk.map(async (r) => {
        try {
          const trackedHtml = buildTrackedEmail(htmlBody, r.trackId);
          const ok = await sendEmail(r.email, r.name || r.email, subject, trackedHtml);
          const status = ok ? "sent" : "failed";
          await EmailCampaignRecipientModel.updateOne({ trackId: r.trackId }, { $set: { status, sentAt: ok ? new Date() : null } });
          if (ok) {
            sent++;
            await GlobalSentEmailModel.updateOne(
              { email: r.email },
              { $set: { lastSentAt: new Date() }, $inc: { sendCount: 1 }, $setOnInsert: { email: r.email, firstSentAt: new Date() } },
              { upsert: true }
            );
          }
        } catch {}
      })
    );
    // Small delay between batches
    await new Promise((res) => setTimeout(res, 200));
  }

  await EmailCampaignModel.updateOne({ _id: campaign._id }, {
    $set: { status: "completed", totalSent: sent, completedAt: new Date() }
  });

  return { sent, skipped: candidates.length - sent, campaignId: String(campaign._id) };
}

// ── Weekly interested collection ─────────────────────────────────────────────

export async function runWeeklyInterestedCollection(): Promise<{ newLeads: number; followUpSent: number }> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Find recipients who opened or clicked in last 7 days
  const engaged = await EmailCampaignRecipientModel.find({
    $or: [
      { opened: true, openedAt: { $gte: oneWeekAgo } },
      { clicked: true, clickedAt: { $gte: oneWeekAgo } },
    ]
  }).lean();

  let newLeads = 0;
  const uniqueMap = new Map<string, any>();
  for (const r of engaged) {
    if (!uniqueMap.has(r.email)) uniqueMap.set(r.email, r);
  }

  for (const [email, r] of uniqueMap) {
    const engType = r.clicked ? "clicked" : "opened";
    await InterestedLeadModel.updateOne(
      { email },
      {
        $set: { lastEngagedAt: new Date(), engagementType: engType },
        $addToSet: { campaignIds: r.campaignId },
        $setOnInsert: { email, name: r.name || "", firstEngagedAt: new Date() },
      },
      { upsert: true }
    ).then((res) => { if (res.upsertedCount > 0) newLeads++; });
  }

  // Send follow-up emails to interested leads not contacted this week
  const leadsToFollowUp = await InterestedLeadModel.find({
    $or: [{ followUpSentAt: null }, { followUpSentAt: { $lt: oneWeekAgo } }]
  }).limit(500).lean();

  let followUpSent = 0;
  const followSubject = "نشكر اهتمامك بـ QIROX — تواصل معنا الآن";
  const followHtml = getFollowUpHtml();

  for (const lead of leadsToFollowUp) {
    try {
      const trackId = genTrackId();
      // Create a mini campaign for tracking
      const tracked = buildTrackedEmail(followHtml, trackId);
      const ok = await sendEmail(lead.email, lead.name || lead.email, followSubject, tracked);
      if (ok) {
        followUpSent++;
        await InterestedLeadModel.updateOne({ _id: lead._id }, {
          $set: { followUpSentAt: new Date() },
          $inc: { followUpCount: 1 }
        });
      }
    } catch {}
  }

  return { newLeads, followUpSent };
}

// ── Default HTML templates ────────────────────────────────────────────────────

function getDefaultMarketingHtml(): string {
  const site = getBaseUrl();
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;direction:rtl}
  .wrap{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,.08)}
  .header{background:#000;padding:32px;text-align:center}
  .header img{width:60px;height:60px;border-radius:50%}
  .header h1{color:#fff;margin:12px 0 0;font-size:24px;letter-spacing:1px}
  .body{padding:36px 32px}
  .body h2{font-size:22px;color:#111;margin-bottom:12px}
  .body p{color:#444;font-size:15px;line-height:1.8;margin-bottom:16px}
  .cta{display:inline-block;background:#000;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;margin:8px 4px}
  .features{display:flex;flex-wrap:wrap;gap:12px;margin:24px 0}
  .feat{flex:1;min-width:140px;background:#f8f8f8;border-radius:8px;padding:16px;text-align:center}
  .feat .icon{font-size:28px;margin-bottom:8px}
  .feat p{font-size:13px;color:#555;margin:0}
  .footer{background:#111;color:#888;padding:20px 32px;text-align:center;font-size:12px}
  .footer a{color:#aaa;text-decoration:none}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <img src="${site}/qirox-icon.png" alt="Qirox" />
    <h1>QIROX</h1>
  </div>
  <div class="body">
    <h2>حوّل فكرتك إلى نظام رقمي احترافي</h2>
    <p>نحن في <strong>Qirox</strong> نبني الأنظمة الرقمية المخصصة — من المواقع والمتاجر إلى الأنظمة الإدارية المتكاملة لكل القطاعات.</p>
    <div class="features">
      <div class="feat"><div class="icon">🏪</div><p>متاجر إلكترونية</p></div>
      <div class="feat"><div class="icon">🏥</div><p>أنظمة المستشفيات</p></div>
      <div class="feat"><div class="icon">🏫</div><p>أنظمة التعليم</p></div>
      <div class="feat"><div class="icon">🏢</div><p>أنظمة الشركات</p></div>
    </div>
    <p>سواء كنت تمتلك مطعماً أو عيادة أو شركة — لدينا النظام المثالي لك بأسعار تنافسية وجودة عالمية.</p>
    <div style="text-align:center;margin-top:24px">
      <a href="${site}" class="cta">🚀 ابدأ مشروعك الآن</a>
      <a href="${site}/contact" class="cta" style="background:#333">تواصل معنا</a>
    </div>
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} Qirox — مصنع الأنظمة الرقمية</p>
    <p><a href="${site}">qiroxstudio.online</a></p>
  </div>
</div>
</body></html>`;
}

function getFollowUpHtml(): string {
  const site = getBaseUrl();
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;direction:rtl}
  .wrap{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,.08)}
  .header{background:#000;padding:32px;text-align:center}
  .header h1{color:#fff;margin:12px 0 0;font-size:24px}
  .body{padding:36px 32px}
  .body h2{font-size:20px;color:#111;margin-bottom:12px}
  .body p{color:#444;font-size:15px;line-height:1.8}
  .cta{display:inline-block;background:#000;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold}
  .footer{background:#111;color:#888;padding:20px 32px;text-align:center;font-size:12px}
  .footer a{color:#aaa;text-decoration:none}
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><h1>شكراً لاهتمامك بـ QIROX 🎯</h1></div>
  <div class="body">
    <h2>يسعدنا تواصلك معنا</h2>
    <p>لاحظنا اهتمامك بخدماتنا — فريق Qirox مستعد لمساعدتك في بناء نظامك الرقمي المثالي.</p>
    <p>سواء لديك فكرة أو مشروع جاهز للتنفيذ، نحن هنا لنحوّله إلى واقع بأعلى معايير الجودة.</p>
    <div style="text-align:center;margin-top:28px">
      <a href="${site}/contact" class="cta">📞 تواصل مع فريقنا الآن</a>
    </div>
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} Qirox — <a href="${site}">qiroxstudio.online</a></p>
  </div>
</div>
</body></html>`;
}

// ── Route registration ────────────────────────────────────────────────────────

export function registerEmailMarketingRoutes(app: Express) {

  // ── Tracking (public, no auth) ──────────────────────────────────────────────

  // Open pixel tracking
  app.get("/api/email-marketing/track/open/:trackId", async (req, res) => {
    try {
      const { trackId } = req.params;
      await EmailCampaignRecipientModel.findOneAndUpdate(
        { trackId, opened: false },
        { $set: { opened: true, openedAt: new Date() } }
      );
      // If opened for the first time, update campaign stat
      const rec = await EmailCampaignRecipientModel.findOne({ trackId }).lean();
      if (rec) {
        await EmailCampaignModel.updateOne({ _id: rec.campaignId }, { $inc: { totalOpened: 1 } });
      }
    } catch {}
    // Return 1x1 transparent GIF
    const gif = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
    res.setHeader("Content-Type", "image/gif");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.end(gif);
  });

  // Click tracking redirect
  app.get("/api/email-marketing/track/click/:trackId", async (req, res) => {
    const { trackId } = req.params;
    const targetUrl = req.query.url as string;
    try {
      const rec = await EmailCampaignRecipientModel.findOneAndUpdate(
        { trackId, clicked: false },
        { $set: { clicked: true, clickedAt: new Date() } },
        { new: true }
      ).lean();
      if (rec) {
        await EmailCampaignModel.updateOne({ _id: rec.campaignId }, { $inc: { totalClicked: 1 } });
      }
    } catch {}
    const destination = targetUrl ? decodeURIComponent(targetUrl) : getBaseUrl();
    res.redirect(302, destination);
  });

  // ── Dashboard stats ─────────────────────────────────────────────────────────
  app.get("/api/email-marketing/dashboard", async (req, res) => {
    if (!(req as any).isAuthenticated?.() || !["admin", "manager", "marketing"].includes((req as any).user?.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    try {
      const [totalEmails, unsubscribed, globalSent, totalCampaigns, recentCampaigns, interestedLeads, todayCampaign] = await Promise.all([
        MarketingEmailModel.countDocuments(),
        MarketingEmailModel.countDocuments({ unsubscribed: true }),
        GlobalSentEmailModel.countDocuments(),
        EmailCampaignModel.countDocuments(),
        EmailCampaignModel.find().sort({ createdAt: -1 }).limit(5).lean(),
        InterestedLeadModel.countDocuments(),
        EmailCampaignModel.findOne({ type: "daily_bulk", createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } }).lean(),
      ]);
      const totalOpened = await EmailCampaignModel.aggregate([{ $group: { _id: null, total: { $sum: "$totalOpened" } } }]);
      const totalClicked = await EmailCampaignModel.aggregate([{ $group: { _id: null, total: { $sum: "$totalClicked" } } }]);
      res.json({
        totalEmails,
        unsubscribed,
        activeEmails: totalEmails - unsubscribed,
        globalSent,
        remaining: Math.max(0, totalEmails - unsubscribed - globalSent),
        totalCampaigns,
        recentCampaigns,
        interestedLeads,
        todayCampaign,
        totalOpened: totalOpened[0]?.total || 0,
        totalClicked: totalClicked[0]?.total || 0,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Email list management ───────────────────────────────────────────────────

  app.get("/api/email-marketing/emails", async (req, res) => {
    if (!(req as any).isAuthenticated?.() || !["admin", "manager", "marketing"].includes((req as any).user?.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string || "";
      const filter: any = {};
      if (search) filter.email = { $regex: search, $options: "i" };
      const [emails, total] = await Promise.all([
        MarketingEmailModel.find(filter).sort({ addedAt: -1 }).skip((page-1)*limit).limit(limit).lean(),
        MarketingEmailModel.countDocuments(filter),
      ]);
      res.json({ emails, total, page, pages: Math.ceil(total / limit) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Add single email
  app.post("/api/email-marketing/emails", async (req, res) => {
    if (!(req as any).isAuthenticated?.() || !["admin", "manager", "marketing"].includes((req as any).user?.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    try {
      const { email, name, source } = req.body;
      if (!email) return res.status(400).json({ error: "البريد مطلوب" });
      const doc = await MarketingEmailModel.findOneAndUpdate(
        { email: email.toLowerCase().trim() },
        { $setOnInsert: { email: email.toLowerCase().trim(), name: name || "", source: source || "manual", addedAt: new Date() } },
        { upsert: true, new: true }
      ).lean();
      res.json({ success: true, doc });
    } catch (err: any) {
      if (err.code === 11000) return res.json({ success: true, message: "موجود مسبقاً" });
      res.status(500).json({ error: err.message });
    }
  });

  // Bulk import emails (newline or comma separated)
  app.post("/api/email-marketing/emails/import", async (req, res) => {
    if (!(req as any).isAuthenticated?.() || !["admin", "manager", "marketing"].includes((req as any).user?.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    try {
      const { text, source } = req.body;
      if (!text) return res.status(400).json({ error: "النص مطلوب" });
      const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
      const found = text.match(emailRegex) || [];
      const unique = [...new Set(found.map((e: string) => e.toLowerCase().trim()))];
      if (unique.length === 0) return res.status(400).json({ error: "لم يتم العثور على بريد إلكتروني صالح" });

      const ops = unique.map((email: string) => ({
        updateOne: {
          filter: { email },
          update: { $setOnInsert: { email, name: "", source: source || "import", addedAt: new Date() } },
          upsert: true,
        }
      }));
      const result = await MarketingEmailModel.bulkWrite(ops, { ordered: false });
      res.json({ success: true, found: unique.length, inserted: result.upsertedCount, duplicate: unique.length - result.upsertedCount });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete email from list
  app.delete("/api/email-marketing/emails/:id", async (req, res) => {
    if (!(req as any).isAuthenticated?.() || !["admin", "manager", "marketing"].includes((req as any).user?.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    try {
      await MarketingEmailModel.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Campaigns ───────────────────────────────────────────────────────────────

  app.get("/api/email-marketing/campaigns", async (req, res) => {
    if (!(req as any).isAuthenticated?.() || !["admin", "manager", "marketing"].includes((req as any).user?.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const [campaigns, total] = await Promise.all([
        EmailCampaignModel.find().sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).lean(),
        EmailCampaignModel.countDocuments(),
      ]);
      res.json({ campaigns, total });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create campaign (draft)
  app.post("/api/email-marketing/campaigns", async (req, res) => {
    if (!(req as any).isAuthenticated?.() || !["admin", "manager", "marketing"].includes((req as any).user?.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    try {
      const { name, subject, htmlBody, type, batchSize } = req.body;
      if (!name || !subject || !htmlBody) return res.status(400).json({ error: "الاسم والموضوع والمحتوى مطلوبة" });
      const campaign = await EmailCampaignModel.create({
        name, subject, htmlBody,
        type: type || "manual",
        status: "draft",
        batchSize: batchSize || 1000,
        createdBy: (req as any).user?.username || "admin",
      });
      res.json({ success: true, campaign });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get campaign details + recipients
  app.get("/api/email-marketing/campaigns/:id", async (req, res) => {
    if (!(req as any).isAuthenticated?.() || !["admin", "manager", "marketing"].includes((req as any).user?.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    try {
      const campaign = await EmailCampaignModel.findById(req.params.id).lean();
      if (!campaign) return res.status(404).json({ error: "الحملة غير موجودة" });
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const [recipients, totalRecipients] = await Promise.all([
        EmailCampaignRecipientModel.find({ campaignId: campaign._id }).sort({ sentAt: -1 }).skip((page-1)*limit).limit(limit).lean(),
        EmailCampaignRecipientModel.countDocuments({ campaignId: campaign._id }),
      ]);
      res.json({ campaign, recipients, totalRecipients });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Send / launch campaign (picks unsent emails)
  app.post("/api/email-marketing/campaigns/:id/send", async (req, res) => {
    if (!(req as any).isAuthenticated?.() || !["admin", "manager"].includes((req as any).user?.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    try {
      const campaign = await EmailCampaignModel.findById(req.params.id).lean();
      if (!campaign) return res.status(404).json({ error: "الحملة غير موجودة" });
      if (campaign.status === "running") return res.status(400).json({ error: "الحملة تعمل بالفعل" });

      await EmailCampaignModel.updateOne({ _id: campaign._id }, { $set: { status: "running" } });
      res.json({ success: true, message: "بدأ الإرسال في الخلفية" });

      // Run in background
      (async () => {
        try {
          const alreadySent = await GlobalSentEmailModel.distinct("email");
          const batchSize = campaign.batchSize || 1000;
          const candidates = await MarketingEmailModel.find({
            email: { $nin: alreadySent },
            unsubscribed: false,
            bounced: false,
          }).limit(batchSize).lean();

          let sent = 0;
          const recipients: any[] = candidates.map(c => ({
            campaignId: campaign._id,
            email: c.email,
            name: c.name || "",
            trackId: genTrackId(),
            status: "pending",
          }));

          await EmailCampaignRecipientModel.insertMany(recipients, { ordered: false }).catch(() => {});
          await EmailCampaignModel.updateOne({ _id: campaign._id }, { $set: { totalTarget: candidates.length } });

          const BATCH = 20;
          for (let i = 0; i < recipients.length; i += BATCH) {
            const chunk = recipients.slice(i, i + BATCH);
            await Promise.allSettled(chunk.map(async (r) => {
              try {
                const trackedHtml = buildTrackedEmail(campaign.htmlBody, r.trackId);
                const ok = await sendEmail(r.email, r.name || r.email, campaign.subject, trackedHtml);
                const status = ok ? "sent" : "failed";
                await EmailCampaignRecipientModel.updateOne({ trackId: r.trackId }, { $set: { status, sentAt: ok ? new Date() : null } });
                if (ok) {
                  sent++;
                  await GlobalSentEmailModel.updateOne(
                    { email: r.email },
                    { $set: { lastSentAt: new Date() }, $inc: { sendCount: 1 }, $setOnInsert: { email: r.email, firstSentAt: new Date() } },
                    { upsert: true }
                  );
                }
              } catch {}
            }));
            await new Promise(res => setTimeout(res, 200));
          }
          await EmailCampaignModel.updateOne({ _id: campaign._id }, { $set: { status: "completed", totalSent: sent, completedAt: new Date() } });
        } catch (err) {
          await EmailCampaignModel.updateOne({ _id: campaign._id }, { $set: { status: "failed" } });
        }
      })();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get default template HTML
  app.get("/api/email-marketing/default-template", async (req, res) => {
    if (!(req as any).isAuthenticated?.()) return res.status(401).json({ error: "Unauthorized" });
    res.json({ html: getDefaultMarketingHtml() });
  });

  // ── Interested leads ────────────────────────────────────────────────────────
  app.get("/api/email-marketing/interested", async (req, res) => {
    if (!(req as any).isAuthenticated?.() || !["admin", "manager", "marketing"].includes((req as any).user?.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const [leads, total] = await Promise.all([
        InterestedLeadModel.find().sort({ lastEngagedAt: -1 }).skip((page-1)*limit).limit(limit).lean(),
        InterestedLeadModel.countDocuments(),
      ]);
      res.json({ leads, total });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Manual triggers ─────────────────────────────────────────────────────────
  app.post("/api/email-marketing/run-daily", async (req, res) => {
    if (!(req as any).isAuthenticated?.() || !["admin", "manager"].includes((req as any).user?.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    try {
      res.json({ success: true, message: "بدأ الإرسال اليومي في الخلفية" });
      runDailyBulkCampaign().catch(console.error);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/email-marketing/run-weekly", async (req, res) => {
    if (!(req as any).isAuthenticated?.() || !["admin", "manager"].includes((req as any).user?.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    try {
      const result = await runWeeklyInterestedCollection();
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  console.log("[EmailMarketing] Routes registered");
}
