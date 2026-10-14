import crypto from "crypto";

export const PROJECT_INTEGRATION_TYPES = ["whatsapp", "email", "api"] as const;
export const PROJECT_INTEGRATION_ENVIRONMENTS = ["development", "staging", "production"] as const;
export type ProjectIntegrationType = (typeof PROJECT_INTEGRATION_TYPES)[number];
export type ProjectIntegrationEnvironment = (typeof PROJECT_INTEGRATION_ENVIRONMENTS)[number];

export function hashProjectIntegrationKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

export function createProjectIntegrationSecret(type: ProjectIntegrationType) {
  const rawKey = `qrx_project_${type}_${crypto.randomBytes(32).toString("hex")}`;
  return {
    rawKey,
    keyHash: hashProjectIntegrationKey(rawKey),
    keyPrefix: `${rawKey.slice(0, 24)}...`,
  };
}

export function integrationTypeLabel(type: ProjectIntegrationType): string {
  if (type === "whatsapp") return "واتساب CRM";
  if (type === "email") return "Project Email";
  return "Project Integration API";
}

export function projectIntegrationApiPath(orderId: string, type: ProjectIntegrationType): string {
  return `/api/v1/projects/${encodeURIComponent(orderId)}/${type}`;
}

export function projectIntegrationDocsPath(): string {
  return "/api/v1/projects/integrations/docs";
}

const rateBuckets = new Map<string, { startedAt: number; count: number }>();

export function reserveProjectIntegrationRateLimit(integrationId: string, limit: number) {
  const now = Date.now();
  const bucket = rateBuckets.get(integrationId);
  if (!bucket || now - bucket.startedAt >= 60_000) {
    const fresh = { startedAt: now, count: 1 };
    rateBuckets.set(integrationId, fresh);
    return { allowed: true, limit, remaining: Math.max(0, limit - 1), resetAt: new Date(now + 60_000) };
  }
  bucket.count += 1;
  const allowed = bucket.count <= limit;
  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: new Date(bucket.startedAt + 60_000),
  };
}

export function getRequestBaseUrl(req: any): string {
  const forwardedProto = String(req.get?.("x-forwarded-proto") || "").split(",")[0].trim();
  const protocol = forwardedProto || req.protocol || "https";
  const host = String(req.get?.("host") || "").trim();
  if (host) return `${protocol}://${host}`;
  return String(process.env.APP_URL || "https://qiroxstudio.online").replace(/\/+$/, "");
}

export function serializeProjectIntegration(integration: any, req: any, orderId?: string) {
  const source = integration?.toObject ? integration.toObject() : integration;
  if (!source) return null;
  const id = String(source._id || source.id);
  const resolvedOrderId = String(orderId || source.orderId);
  return {
    id,
    type: source.type,
    environment: source.environment,
    label: source.label,
    status: source.expiresAt && new Date(source.expiresAt) <= new Date() ? "expired" : source.status,
    publicIdentifier: source.publicIdentifier,
    keyPrefix: source.keyPrefix,
    apiBaseUrl: `${getRequestBaseUrl(req)}${source.apiBasePath || projectIntegrationApiPath(resolvedOrderId, source.type)}`,
    documentationUrl: `${getRequestBaseUrl(req)}${source.documentationPath || projectIntegrationDocsPath()}`,
    allowedOrigins: source.allowedOrigins || [],
    rateLimitPerMinute: source.rateLimitPerMinute,
    maxMessageLength: source.maxMessageLength,
    expiresAt: source.expiresAt || null,
    lastUsedAt: source.lastUsedAt || null,
    requestCount: source.requestCount || 0,
    createdAt: source.createdAt || null,
    updatedAt: source.updatedAt || null,
  };
}

export const projectIntegrationApiDocs = {
  title: "QIROX Project Integrations API",
  version: "1",
  authentication: "استخدم Authorization: Bearer qrx_project_<type>_<secret>. يُعرض المفتاح السري مرة واحدة عند الإنشاء أو التدوير.",
  environments: {
    development: "للاختبار والتطوير فقط",
    staging: "لبيئة ما قبل الإنتاج",
    production: "للاستخدام الحي",
  },
  limits: {
    whatsapp: { messageMaxLength: 4000, idempotencyKey: "8-160 characters", rateLimit: "حسب إعداد المشروع، الافتراضي 30 طلباً/دقيقة" },
    email: { messageMaxLength: 100000, subjectMaxLength: 200, idempotencyKey: "8-160 characters", rateLimit: "حسب إعداد المشروع، الافتراضي 30 طلباً/دقيقة" },
    api: { messageMaxLength: 100000, channels: ["email", "whatsapp"], idempotencyKey: "8-160 characters", rateLimit: "حسب إعداد المشروع، الافتراضي 30 طلباً/دقيقة" },
  },
  endpoints: [
    {
      method: "POST",
      path: "/api/v1/projects/:projectId/whatsapp",
      body: {
        recipient: { phone: "+966500000000", name: "اسم المستلم" },
        platformName: "اسم المنصة",
        clientName: "اسم العميل",
        code: "123456",
        message: "رسالة نصية اختيارية",
      },
      description: "إرسال الرسالة من رقم QIROX المتصل بواتساب CRM عبر QR. لا يحتاج WhatsApp Business أو Meta.",
    },
    {
      method: "POST",
      path: "/api/v1/projects/:projectId/email",
      body: { recipient: { email: "customer@example.com", name: "اسم المستلم" }, subject: "عنوان الرسالة", message: "نص الرسالة" },
      description: "إرسال بريد المشروع عبر مزود SMTP المهيأ.",
    },
    {
      method: "POST",
      path: "/api/v1/projects/:projectId/api",
      body: { channel: "email", recipient: { email: "customer@example.com", name: "اسم المستلم" }, subject: "عنوان الرسالة", message: "نص الرسالة" },
      description: "نقطة الربط العامة للمشروع؛ اختر email أو whatsapp مع نفس مفتاح الربط.",
    },
  ],
  headers: {
    authorization: "Bearer qrx_project_<type>_<secret>",
    "idempotency-key": "قيمة فريدة من 8 إلى 160 حرفاً لكل عملية",
  },
};