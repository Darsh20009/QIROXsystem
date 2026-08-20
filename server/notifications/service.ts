import { baseTemplate, sendEmail } from "../email";
import mongoose from "mongoose";
import crypto from "crypto";
import { NotificationDeliveryModel, NotificationTemplateModel } from "../models/notification-delivery";
import { normalizePhone } from "./phone";

export type NotificationChannel = "email" | "whatsapp";

export type NotificationRequest = {
  event: string;
  idempotencyKey: string;
  recipient: {
    userId?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  subject: string;
  message: string;
  actionUrl?: string;
  channels?: NotificationChannel[];
  whatsappTemplate?: string;
  metadata?: Record<string, unknown>;
  sensitive?: boolean;
};

type DeliveryResult = {
  id: string;
  channel: NotificationChannel;
  status: string;
  error?: string;
};

let workerTimer: NodeJS.Timeout | undefined;
let lastWhatsAppAlertAt = 0;
const MAX_ALERT_FREQUENCY_MS = 30 * 60 * 1000;

function escapeHtml(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildEmailBody(message: string, actionUrl?: string): string {
  const text = escapeHtml(message).replace(/\n/g, "<br />");
  const action = actionUrl
    ? `<p style="margin:22px 0 0;"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700;">عرض التفاصيل</a></p>`
    : "";
  return baseTemplate(`<p style="font-size:15px;line-height:1.9;color:#333;margin:0;">${text}</p>${action}`);
}

function deliverySummary(delivery: any): DeliveryResult {
  return {
    id: String(delivery._id),
    channel: delivery.channel,
    status: delivery.status,
    ...(delivery.lastError ? { error: delivery.lastError } : {}),
  };
}

async function createDelivery(
  request: NotificationRequest,
  channel: NotificationChannel,
): Promise<any> {
  const phone = normalizePhone(request.recipient.phone);
  const existing = await NotificationDeliveryModel.findOne({
    idempotencyKey: request.idempotencyKey,
    channel,
  });
  if (existing) return existing;

  const hasRecipient = channel === "email"
    ? Boolean(request.recipient.email)
    : phone.valid;
  const body = channel === "email" ? buildEmailBody(request.message, request.actionUrl) : request.message;

  try {
    return await NotificationDeliveryModel.create({
      event: request.event,
      idempotencyKey: request.idempotencyKey,
      channel,
      status: hasRecipient ? "pending" : "skipped",
      recipient: {
        userId: request.recipient.userId || null,
        name: request.recipient.name || "",
        email: request.recipient.email || "",
        phone: request.recipient.phone || "",
        normalizedPhone: phone.e164,
      },
      subject: request.subject,
      body,
      textBody: request.message,
      sensitive: Boolean(request.sensitive),
      template: request.whatsappTemplate || "",
      metadata: request.metadata || {},
      lastError: hasRecipient
        ? ""
        : channel === "email"
          ? "لا يوجد بريد إلكتروني للمستلم"
          : phone.reason || "لا يوجد رقم واتساب صالح للمستلم",
    });
  } catch (error: any) {
    // Concurrent requests for the same event should re-use the durable delivery.
    if (error?.code === 11000) {
      return NotificationDeliveryModel.findOne({ idempotencyKey: request.idempotencyKey, channel });
    }
    throw error;
  }
}

async function sendWhatsAppThroughMeta(delivery: any): Promise<{ provider: string; messageId?: string }> {
  const token = process.env.WHATSAPP_META_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_META_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error("Meta WhatsApp Business غير مهيأ: أضف WHATSAPP_META_ACCESS_TOKEN وWHATSAPP_META_PHONE_NUMBER_ID");
  }

  const version = process.env.WHATSAPP_META_API_VERSION || "v22.0";
  const to = String(delivery.recipient?.normalizedPhone || "").replace(/\D/g, "");
  if (!to) throw new Error("رقم واتساب غير صالح");

  // QIROX template keys are internal. A Meta template is used only when its
  // approved name is explicitly configured, so a local template never
  // accidentally masquerades as an approved Meta template.
  const templateKey = String(delivery.template || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_");
  const template = templateKey ? process.env[`WHATSAPP_META_TEMPLATE_${templateKey}`] || "" : "";
  const payload: Record<string, unknown> = {
    messaging_product: "whatsapp",
    to,
  };
  if (template) {
    payload.type = "template";
    payload.template = {
      name: template,
      language: { code: process.env.WHATSAPP_META_TEMPLATE_LANGUAGE || "ar" },
      components: [{
        type: "body",
        parameters: [{ type: "text", text: String(delivery.textBody || "") }],
      }],
    };
  } else {
    // Meta permits free-form text only within its customer-service window.
    // If Meta rejects it, the durable delivery record keeps the provider error.
    payload.type = "text";
    payload.text = { preview_url: false, body: String(delivery.textBody || "") };
  }

  const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.error?.message || `HTTP ${response.status}`;
    throw new Error(`Meta WhatsApp: ${detail}`);
  }
  return { provider: "meta", messageId: data?.messages?.[0]?.id };
}

async function sendWhatsAppThroughBaileys(delivery: any): Promise<{ provider: string }> {
  const { waModule } = await import("../whatsapp-module");
  await waModule.sendNotification(delivery.recipient?.normalizedPhone || delivery.recipient?.phone, delivery.textBody || "");
  return { provider: "baileys" };
}

async function sendWhatsApp(delivery: any): Promise<{ provider: string; messageId?: string }> {
  const provider = (process.env.WHATSAPP_PROVIDER || "").trim().toLowerCase();
  const metaConfigured = Boolean(process.env.WHATSAPP_META_ACCESS_TOKEN && process.env.WHATSAPP_META_PHONE_NUMBER_ID);
  if (provider === "meta" || (!provider && metaConfigured)) return sendWhatsAppThroughMeta(delivery);
  if (provider === "baileys" || !provider) return sendWhatsAppThroughBaileys(delivery);
  throw new Error("WHATSAPP_PROVIDER غير مدعوم. استخدم meta أو baileys");
}

async function alertWhatsAppHealth(error: string): Promise<void> {
  if (Date.now() - lastWhatsAppAlertAt < MAX_ALERT_FREQUENCY_MS) return;
  lastWhatsAppAlertAt = Date.now();
  const sent = await sendEmail(
    "youssefd.business@gmail.com",
    "Youssef",
    "⚠️ تعذر إرسال واتساب من QIROX",
    buildEmailBody(`تعذر تسليم رسالة واتساب من QIROX.\nالسبب: ${error}\nراجع سجل التسليم في لوحة التحكم.`),
  );
  if (!sent) console.error("[Notifications] WhatsApp alert email could not be delivered");
}

async function sendDelivery(delivery: any): Promise<void> {
  if (delivery.channel === "email") {
    const sent = await sendEmail(
      delivery.recipient.email,
      delivery.recipient.name || delivery.recipient.email,
      delivery.subject,
      delivery.body,
      delivery.textBody,
    );
    if (!sent) throw new Error("تعذر تسليم البريد عبر SMTP");
    delivery.provider = "smtp";
    return;
  }

  const result = await sendWhatsApp(delivery);
  delivery.provider = result.provider;
  delivery.providerMessageId = result.messageId || "";
}

export async function processNotificationDelivery(id: string): Promise<DeliveryResult | null> {
  const now = new Date();
  const leaseExpiresAt = new Date(now.getTime() + 2 * 60_000);
  const claimToken = crypto.randomUUID();
  const delivery = await NotificationDeliveryModel.findOneAndUpdate(
    {
      _id: id,
      $or: [
        { status: { $in: ["pending", "retrying"] }, nextAttemptAt: { $lte: now } },
        { status: "sending", leaseExpiresAt: { $lte: now } },
        { status: "sending", leaseExpiresAt: { $exists: false } },
      ],
    },
    {
      $set: { status: "sending", lastAttemptAt: now, leaseExpiresAt, claimToken },
      $inc: { attempts: 1 },
    },
    { new: true },
  );
  if (!delivery) return null;

  // Long SMTP or provider calls must retain their lease while active. Every
  // final state transition below is fenced by claimToken, so a stale worker
  // can never overwrite a newer claim after a crash/recovery.
  const heartbeat = setInterval(() => {
    NotificationDeliveryModel.updateOne(
      { _id: delivery._id, status: "sending", claimToken },
      { $set: { leaseExpiresAt: new Date(Date.now() + 2 * 60_000) } },
    ).catch(() => {});
  }, 30_000);
  heartbeat.unref?.();

  try {
    await sendDelivery(delivery);
    const finalized = await NotificationDeliveryModel.findOneAndUpdate(
      { _id: delivery._id, status: "sending", claimToken },
      { $set: { status: "sent", sentAt: new Date(), lastError: "", leaseExpiresAt: null } },
      { new: true },
    );
    if (!finalized) {
      const current = await NotificationDeliveryModel.findById(delivery._id);
      return current ? deliverySummary(current) : null;
    }
    return deliverySummary(finalized);
  } catch (error: any) {
    const reason = String(error?.message || error || "فشل غير معروف").slice(0, 1000);
    if (delivery.channel === "whatsapp") await alertWhatsAppHealth(reason).catch(() => {});

    let update: Record<string, unknown>;
    if (delivery.attempts >= delivery.maxAttempts) {
      update = { status: "failed", lastError: reason, leaseExpiresAt: null };
    } else {
      const delayMs = Math.min(60_000 * Math.pow(2, Math.max(0, delivery.attempts - 1)), 15 * 60_000);
      update = {
        status: "retrying",
        lastError: reason,
        nextAttemptAt: new Date(Date.now() + delayMs),
        leaseExpiresAt: null,
      };
    }
    const finalized = await NotificationDeliveryModel.findOneAndUpdate(
      { _id: delivery._id, status: "sending", claimToken },
      { $set: update },
      { new: true },
    );
    if (!finalized) {
      const current = await NotificationDeliveryModel.findById(delivery._id);
      return current ? deliverySummary(current) : null;
    }
    return deliverySummary(finalized);
  } finally {
    clearInterval(heartbeat);
  }
}

export async function dispatchNotification(request: NotificationRequest): Promise<DeliveryResult[]> {
  const channels = Array.from(new Set(request.channels?.length ? request.channels : ["email", "whatsapp"]));
  const deliveries = await Promise.all(channels.map(channel => createDelivery(request, channel)));
  const results = await Promise.all(deliveries.map(async delivery => {
    if (delivery.status === "skipped") return deliverySummary(delivery);
    return (await processNotificationDelivery(String(delivery._id))) || deliverySummary(delivery);
  }));
  return results;
}

export async function retryNotificationDelivery(id: string): Promise<DeliveryResult | null> {
  const delivery = await NotificationDeliveryModel.findOneAndUpdate(
    { _id: id, status: { $in: ["failed", "retrying"] } },
    { $set: { status: "pending", nextAttemptAt: new Date(), lastError: "", leaseExpiresAt: null, claimToken: "", attempts: 0 } },
    { new: true },
  );
  if (!delivery) return null;
  return processNotificationDelivery(String(delivery._id));
}

export async function processDueNotificationDeliveries(): Promise<number> {
  // Do not let Mongoose buffer queries and emit noisy retry errors while the
  // server remains intentionally available without a database connection.
  if (mongoose.connection.readyState !== 1) return 0;
  const now = new Date();
  const due = await NotificationDeliveryModel.find({
    $or: [
      { status: { $in: ["pending", "retrying"] }, nextAttemptAt: { $lte: now } },
      { status: "sending", leaseExpiresAt: { $lte: now } },
      { status: "sending", leaseExpiresAt: { $exists: false } },
    ],
  }).sort({ nextAttemptAt: 1 }).limit(25).select("_id").lean();
  await Promise.all(due.map((delivery: any) => processNotificationDelivery(String(delivery._id))));
  return due.length;
}

export function startNotificationWorker(): void {
  if (workerTimer) return;
  workerTimer = setInterval(() => {
    processDueNotificationDeliveries().catch(error => console.error("[Notifications] retry worker error:", error?.message || error));
  }, 30_000);
  workerTimer.unref?.();
  processDueNotificationDeliveries().catch(error => console.error("[Notifications] initial worker error:", error?.message || error));
}

export async function getNotificationHealth(): Promise<Record<string, unknown>> {
  const metaConfigured = Boolean(process.env.WHATSAPP_META_ACCESS_TOKEN && process.env.WHATSAPP_META_PHONE_NUMBER_ID);
  const requestedProvider = (process.env.WHATSAPP_PROVIDER || "").trim().toLowerCase();
  const activeProvider = requestedProvider || (metaConfigured ? "meta" : "baileys");
  let baileysStatus: unknown = undefined;
  if (activeProvider === "baileys") {
    const { waModule } = await import("../whatsapp-module");
    const status = waModule.getStatus();
    // QR material never leaves the dedicated admin WhatsApp endpoints.
    baileysStatus = { status: status.status, phoneNumber: status.phoneNumber || null };
  }
  const pending = await NotificationDeliveryModel.countDocuments({ status: { $in: ["pending", "retrying", "sending"] } });
  const failed = await NotificationDeliveryModel.countDocuments({ status: "failed" });
  return {
    email: { configured: Boolean(process.env.CPANEL_SMTP_HOST || process.env.SMTP_HOST) && Boolean(process.env.CPANEL_SMTP_USER || process.env.SMTP_USER) },
    whatsapp: {
      provider: activeProvider,
      official: activeProvider === "meta",
      configured: activeProvider === "meta" ? metaConfigured : true,
      status: baileysStatus,
    },
    queue: { pending, failed, retryIntervalSeconds: 30, maxAttempts: 3 },
  };
}

export async function listNotificationTemplates(): Promise<any[]> {
  return NotificationTemplateModel.find({ isActive: true }).sort({ key: 1 }).lean();
}

export async function ensureNotificationTemplates(): Promise<void> {
  if (mongoose.connection.readyState !== 1) return;
  const defaults = [
    { key: "welcome_employee", name: "ترحيب موظف جديد", subject: "مرحباً بك في QIROX", body: "مرحباً {name}، يسعدنا انضمامك إلى فريق QIROX.", variables: ["name"] },
    { key: "order_status", name: "تحديث حالة طلب", subject: "تحديث على طلبك من QIROX", body: "مرحباً {name}، تم تحديث حالة طلبك إلى: {status}.", variables: ["name", "status"] },
    { key: "invoice_ready", name: "فاتورة جديدة", subject: "فاتورتك جاهزة من QIROX", body: "مرحباً {name}، صدرت فاتورتك رقم {number}. يمكنك مراجعتها من الرابط المرفق.", variables: ["name", "number"] },
    { key: "quotation_ready", name: "عرض سعر جاهز", subject: "عرض السعر جاهز من QIROX", body: "مرحباً {name}، أصبح عرض السعر رقم {number} جاهزاً للمراجعة.", variables: ["name", "number"] },
  ];
  await Promise.all(defaults.map(template => NotificationTemplateModel.updateOne(
    { key: template.key },
    { $setOnInsert: { ...template, channels: ["email", "whatsapp"], isActive: true } },
    { upsert: true },
  )));
}

export const notificationApiDocs = {
  title: "QIROX Notification API",
  authentication: "جلسة QIROX مسجلة الدخول. الإرسال والسجل متاحان للموظفين، وإدارة القوالب وإعادة المحاولة للمديرين.",
  endpoints: [
    { method: "GET", path: "/api/notifications/health", description: "حالة البريد وواتساب وقائمة الإرسال" },
    { method: "GET", path: "/api/notifications/deliveries", description: "آخر محاولات الإرسال" },
    { method: "POST", path: "/api/notifications/send", description: "إرسال رسالة موحدة بالبريد وواتساب" },
    { method: "GET", path: "/api/notifications/templates", description: "القوالب الفعالة" },
    { method: "POST", path: "/api/admin/notifications/deliveries/:id/retry", description: "إعادة محاولة رسالة فاشلة" },
  ],
};