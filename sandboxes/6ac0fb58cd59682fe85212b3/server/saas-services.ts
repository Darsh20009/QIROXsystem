import type { Express } from "express";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { CustomerModel } from "../shared/schema";

function config() { return JSON.parse(process.env.BUSINESS_CONFIG_JSON || "{}"); }
function tenant() { return String(process.env.TENANT_ID || ""); }
function phoneNumber(value: unknown) {
  const cleaned = String(value || "").replace(/[\s()-]/g, "");
  const match = cleaned.match(/^(?:\+?966|00966|0)?(5\d{8})$/);
  return match?.[1] || "";
}
function digest(value: string) {
  if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is required");
  return crypto.createHmac("sha256", process.env.SESSION_SECRET).update(value).digest("hex");
}
function customerResponse(customer: any) {
  const { password, passwordHash, __v, ...safe } = customer;
  for (const key of Object.keys(safe)) if (/password|secret|token|credential|walletPin|otp|recovery/i.test(key)) delete safe[key];
  safe.id = String(customer.id || customer._id || "");
  return safe;
}

async function send(channel: "whatsapp" | "email", payload: any, idempotencyKey: string) {
  const base = new URL(process.env.QIROX_PLATFORM_URL || "");
  if (base.protocol !== "https:" || base.username || base.password) throw new Error("QIROX HTTPS API configuration required");
  const prefix = `QIROX_${channel.toUpperCase()}`;
  const key = process.env[`${prefix}_API_KEY`];
  const apiPath = process.env[`${prefix}_API_PATH`];
  if (!key || !apiPath || !/^\/api\/v1\/projects\/[a-zA-Z0-9-]+\/(whatsapp|email)$/.test(apiPath)) throw new Error("QIROX project integration is not configured");
  const response = await fetch(new URL(apiPath, base), {
    method: "POST", redirect: "error", signal: AbortSignal.timeout(15000),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("QIROX delivery failed");
  const acknowledgement = await response.json();
  if ((acknowledgement?.ok !== true && acknowledgement?.success !== true)
    || ["failed", "cancelled", "skipped", "suppressed"].includes(String(acknowledgement?.delivery?.status || ""))) {
    throw new Error("QIROX delivery was not acknowledged");
  }
}

export async function sendSaasEmail(options: { to: string; subject: string; text?: string; html?: string; attachments?: any[] }) {
  if (options.attachments?.length) throw new Error("QIROX email API does not support attachments");
  const message = options.text || String(options.html || "").replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "").replace(/<br\s*\/?>|<\/(?:p|div|h[1-6]|li)>/gi, "\n").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
  await send("email", { recipient: { email: options.to }, subject: options.subject, message }, crypto.randomUUID());
  return true;
}

export function registerSaasServices(app: Express) {
  let indexPromise: Promise<unknown> | undefined;
  const collection = () => CustomerModel.db.collection("saas_customer_challenges");
  const limiter = () => CustomerModel.db.collection("saas_auth_limits");
  const ready = () => indexPromise ||= Promise.all([
    collection().createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    limiter().createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]).catch(error => { indexPromise = undefined; throw error; });
  const enabled = () => config().customerWhatsappRegistration === true;
  app.get("/api/saas/public-config", (_req, res) => {
    const input = config();
    // Public branding only: never expose BUSINESS_CONFIG_JSON or env secrets.
    res.json({ businessName: input.businessName, logoUrl: input.logoUrl || "", primaryColor: input.primaryColor, heroImageUrl: input.heroImageUrl || "" });
  });
  // Disable unverified self-registration only when the customer explicitly opts in.
  app.post("/api/customers/register", (_req, res, next) => {
    if (enabled()) return res.status(403).json({ error: "استخدم التسجيل برمز واتساب لتأكيد رقمك" });
    next();
  });
  app.post("/api/customers/login", (_req, res, next) => {
    if (enabled()) return res.status(403).json({ error: "استخدم الدخول برمز واتساب لتأكيد رقمك" });
    next();
  });
  app.post("/api/saas/customer/send-code", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (!enabled()) return res.status(404).json({ error: "الخدمة غير مفعلة" });
    const phone = phoneNumber(req.body?.phone);
    if (!phone) return res.status(400).json({ error: "رقم الجوال السعودي غير صالح" });
    try {
      await ready();
      const window = Math.floor(Date.now() / 300000);
      const limitKey = digest(`${tenant()}:${req.ip}:${window}`);
      const limited: any = await limiter().findOneAndUpdate(
        { _id: limitKey as any },
        { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + 600000) } },
        { upsert: true, returnDocument: "after" },
      );
      if ((limited?.value || limited)?.count > 10) return res.status(429).json({ error: "انتظر قبل طلب رمز جديد" });
      const recent = await collection().findOne({ tenantId: tenant(), phone, createdAt: { $gt: new Date(Date.now() - 60000) } });
      if (recent) return res.status(429).json({ error: "يمكن طلب رمز جديد بعد دقيقة" });
      const id = crypto.randomUUID();
      const code = crypto.randomInt(100000, 1000000).toString();
      await collection().insertOne({
        _id: id as any, tenantId: tenant(), phone, codeHash: digest(`${id}:${phone}:${code}`),
        attempts: 0, consumedAt: null, createdAt: new Date(), expiresAt: new Date(Date.now() + 300000),
      });
      try {
        await send("whatsapp", { recipient: { phone: `+966${phone}` }, platformName: config().businessName, code, message: `رمز تأكيد الدخول إلى ${config().businessName}: ${code}\nصالح لمدة خمس دقائق. لا تشاركه مع أي شخص.` }, `otp-${id}`);
      } catch (error) {
        await collection().deleteOne({ _id: id as any });
        throw error;
      }
      res.json({ challengeId: id, expiresIn: 300 });
    } catch {
      res.status(503).json({ error: "تعذر إرسال رمز واتساب. راجع اتصال منصة QIROX وإعدادات الخدمة" });
    }
  });
  app.post("/api/saas/customer/verify-code", async (req: any, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (!enabled()) return res.status(404).json({ error: "الخدمة غير مفعلة" });
    const phone = phoneNumber(req.body?.phone);
    const id = String(req.body?.challengeId || "");
    const code = String(req.body?.code || "");
    const name = String(req.body?.name || "").trim().slice(0, 100);
    const email = String(req.body?.email || "").trim().toLowerCase().slice(0, 180);
    if (!phone || !/^[0-9a-f-]{36}$/.test(id) || !/^\d{6}$/.test(code) || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return res.status(400).json({ error: "بيانات التحقق غير صالحة" });
    try {
      await ready();
      const attempted: any = await collection().findOneAndUpdate({
        _id: id as any, phone, tenantId: tenant(), consumedAt: null,
        expiresAt: { $gt: new Date() }, attempts: { $lt: 5 },
      }, { $inc: { attempts: 1 } }, { returnDocument: "before" });
      const challenge = attempted?.value || attempted;
      const expected = digest(`${id}:${phone}:${code}`);
      if (!challenge || typeof challenge.codeHash !== "string" || !/^[0-9a-f]{64}$/.test(challenge.codeHash) || !crypto.timingSafeEqual(Buffer.from(challenge.codeHash, "hex"), Buffer.from(expected, "hex"))) return res.status(400).json({ error: "الرمز غير صحيح أو انتهت صلاحيته" });
      // The original customer model is single-tenant and has no tenantId/id
      // fields. Its dedicated customer database is the isolation boundary.
      let customer: any = await CustomerModel.findOne({ phone }).lean();
      if (!customer && name.length < 2) return res.status(400).json({ error: "أدخل اسمك لإكمال التسجيل" });
      if (customer && (customer.isActive === false || customer.isActive === 0 || ["blocked", "suspended"].includes(customer.status))) return res.status(403).json({ error: "الحساب غير متاح" });
      const used = await collection().updateOne({ _id: id as any, consumedAt: null }, { $set: { consumedAt: new Date() } });
      if (!used.modifiedCount) return res.status(400).json({ error: "الرمز مستخدم بالفعل" });
      const isNew = !customer;
      if (!customer) {
        const created = await CustomerModel.create({
          phone, name, ...(email ? { email } : {}),
          password: await bcrypt.hash(crypto.randomBytes(32).toString("base64url"), 12),
          isPasswordSet: 1,
        });
        customer = created.toObject();
      }
      const employeeSession = req.session.employee;
      const version = req.session._sv;
      await new Promise<void>((resolve, reject) => req.session.regenerate((error: any) => error ? reject(error) : resolve()));
      if (employeeSession) req.session.employee = employeeSession;
      if (version) req.session._sv = version;
      req.session.customer = customerResponse(customer);
      await new Promise<void>((resolve, reject) => req.session.save((error: any) => error ? reject(error) : resolve()));
      let emailStatus = "not-requested";
      if (isNew && email && config().notificationEmail === true) {
        try {
          await send("email", { recipient: { email, name }, subject: `مرحبًا بك في ${config().businessName}`, message: `تم تسجيل حسابك بنجاح في ${config().businessName}.` }, `welcome-${id}`);
          emailStatus = "queued";
        } catch {
          emailStatus = "failed";
          await CustomerModel.db.collection("saas_notification_failures").insertOne({ customerId: String(customer.id || customer._id), tenantId: tenant(), channel: "email", createdAt: new Date(), status: "failed" });
        }
      }
      res.json({ ...customerResponse(customer), emailStatus });
    } catch (error: any) {
      res.status(error?.code === 11000 ? 409 : 503).json({ error: "تعذر إكمال التسجيل. أعد المحاولة" });
    }
  });
}