import { UserModel } from "./models";
import {
  ManualMarketingCampaignModel,
  ManualMarketingQuotaNoticeModel,
} from "./models/whatsapp";
import { MANUAL_MARKETING_REPLY_CHAT_ID, waModule } from "./whatsapp-module";
let noticeIndexPromise: Promise<string> | null = null;
let campaignIndexPromise: Promise<string> | null = null;

async function ensureNoticeIndex() {
  if (!noticeIndexPromise) {
    noticeIndexPromise = ManualMarketingQuotaNoticeModel.collection.createIndex(
      { dayKey: 1, userId: 1, type: 1 },
      { unique: true, name: "manual_marketing_quota_notice_daily_unique" },
    ).catch(error => {
      noticeIndexPromise = null;
      throw error;
    });
  }
  await noticeIndexPromise;
}

async function ensureCampaignIndex() {
  if (!campaignIndexPromise) {
    campaignIndexPromise = ManualMarketingCampaignModel.collection.createIndex(
      { sentBy: 1, status: 1, sentAt: 1 },
      { name: "manual_marketing_daily_quota_lookup" },
    ).catch(error => {
      campaignIndexPromise = null;
      throw error;
    });
  }
  await campaignIndexPromise;
}

export function getSaudiDayWindow(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);
  const dayKey = `${values.year}-${values.month}-${values.day}`;
  const start = new Date(Date.UTC(year, month - 1, day) - 3 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { dayKey, start, end };
}

export async function getManualMarketingDailyCounts(start: Date, end: Date) {
  await ensureCampaignIndex();
  const rows = await ManualMarketingCampaignModel.aggregate([
    {
      $match: {
        status: { $in: ["active", "sending", "opted_out", "superseded"] },
        sentAt: { $gte: start, $lt: end },
        sentBy: { $ne: null },
      },
    },
    { $group: { _id: "$sentBy", count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row: any) => [String(row._id), Number(row.count) || 0]));
}

async function claimNotice(dayKey: string, type: "completed" | "incomplete_summary", userId: any = null) {
  try {
    await ensureNoticeIndex();
    return await ManualMarketingQuotaNoticeModel.findOneAndUpdate(
      {
        dayKey,
        userId,
        type,
        $or: [{ status: "failed" }, { status: { $exists: false } }],
      },
      { $set: { status: "sending", error: "" }, $setOnInsert: { dayKey, userId, type } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  } catch (error: any) {
    if (error?.code === 11000) return null;
    throw error;
  }
}

async function sendClaimedNotice(notice: any, text: string) {
  if (!notice) return false;
  try {
    if (waModule.getStatus().status !== "connected") throw new Error("WhatsApp QIROX is not connected");
    await waModule.sendText(MANUAL_MARKETING_REPLY_CHAT_ID, text, false);
    await ManualMarketingQuotaNoticeModel.updateOne(
      { _id: notice._id },
      { $set: { status: "sent", sentAt: new Date(), error: "" } },
    );
    return true;
  } catch (error: any) {
    await ManualMarketingQuotaNoticeModel.updateOne(
      { _id: notice._id },
      { $set: { status: "failed", error: String(error?.message || error).slice(0, 500) } },
    ).catch(() => {});
    console.error("[ManualMarketingQuota] WhatsApp notice failed:", error?.message || error);
    return false;
  }
}

export async function notifyManualMarketingQuotaCompletion(employeeId: string, sentAt = new Date()) {
  const { dayKey, start, end } = getSaudiDayWindow(sentAt);
  const employee: any = await UserModel.findById(employeeId)
    .select("fullName role employmentStatus manualMarketingDailyQuota")
    .lean();
  if (!employee || employee.role !== "data_entry" || employee.employmentStatus === "terminated") return;
  const quota = Math.max(0, Number(employee.manualMarketingDailyQuota) || 0);
  if (!quota) return;
  const dailyCounts = await getManualMarketingDailyCounts(start, end);
  const sent = dailyCounts.get(String(employee._id)) || 0;
  if (sent < quota) return;

  const notice = await claimNotice(dayKey, "completed", employee._id);
  const name = String(employee.fullName || "موظف Data Entry").replace(/[\r\n]+/g, " ").slice(0, 120);
  await sendClaimedNotice(notice, `اكتمل هدف التسويق اليومي ✅\nالموظف: ${name}\nأرسل ${sent} من ${quota} رسالة اليوم.`);
}

export async function sendManualMarketingIncompleteDailySummary(now = new Date()) {
  const { dayKey, start, end } = getSaudiDayWindow(now);
  const staff: any[] = await UserModel.find({
    role: "data_entry",
    employmentStatus: { $ne: "terminated" },
    manualMarketingDailyQuota: { $gt: 0 },
  }).select("fullName manualMarketingDailyQuota").lean();
  if (!staff.length) return { sent: false, incomplete: 0 };

  const counts = await getManualMarketingDailyCounts(start, end);
  const incomplete = staff
    .map(employee => {
      const sent = counts.get(String(employee._id)) || 0;
      const quota = Number(employee.manualMarketingDailyQuota) || 0;
      return { employee, sent, quota };
    })
    .filter(row => row.sent < row.quota);
  if (!incomplete.length) return { sent: false, incomplete: 0 };

  const notice = await claimNotice(dayKey, "incomplete_summary");
  if (!notice) return { sent: false, incomplete: incomplete.length };
  const lines = incomplete.map(({ employee, sent, quota }) =>
    `• ${String(employee.fullName || "موظف").replace(/[\r\n]+/g, " ").slice(0, 100)}: أرسل ${sent} من ${quota} (متبقي ${quota - sent})`,
  );
  const text = `ملخص التسويق اليدوي غير المكتمل — ${dayKey} (توقيت الرياض)\n${lines.join("\n")}`;
  const sent = await sendClaimedNotice(notice, text);
  return { sent, incomplete: incomplete.length };
}
