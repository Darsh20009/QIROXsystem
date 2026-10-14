import type { Express, Request, Response } from "express";
import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import mongoose from "mongoose";
import multer from "multer";
import bcrypt from "bcryptjs";
import {
  OrderModel, OrderProvisioningModel, OrderSpecsModel,
  ProjectModel, SaasBuilderModel, ProjectIntegrationModel, SandboxProjectModel,
} from "../../models";
import { resolveGitHubToken } from "../../github-repositories";
import { normalizeSplashSettings, splashPreviewMarkup } from "../../../services/saas-templates/runtime/splash-screen.mjs";
import { SAAS_FEATURES, type BuilderConfig } from "../../../shared/saas-builder";
import { generateProject, listTemplates, validateBuilderConfig } from "./templates";
import { persistSaasLogo, extractLogoPalette } from "./logos";
import { inheritedBuilderConfig, localBuilderImage, safeLocalUploadUrl } from "./config";
import { createProjectIntegrationSecret, projectIntegrationApiPath, projectIntegrationDocsPath } from "../../project-integrations";
import {
  ensureSaasBuilderProjectIndex, publishProjectPartner, saveProjectLogo, syncProjectBranding,
} from "./branding-routes";
import {
  databaseForSaasBuild, fingerprintSaasBuilderConfig, inspectProjectDatabaseUri, mongoDatabaseLinkFailure, prepareProjectDatabaseUri, safeSaasBuilderBuild,
  saasFeaturesForTier, templatePreviewTheme,
} from "./model";
import { parseCanonicalGitHubRepository, replaceRepositoryContents } from "./deployment";
import {
  createPreparedArtifact, getLatestPreparedArtifact, getPreparedArtifact,
  removeLatestPreparedArtifact, removePreparedArtifact, type PreparedArtifact,
} from "./delivery-artifacts";

const MAX_LOGO_BYTES = 8 * 1024 * 1024;
const TIER_RANK: Record<string, number> = { lite: 1, pro: 2, infinite: 3, infinity: 3 };
const CONFIG_FIELDS: Partial<Record<keyof BuilderConfig, number>> = {
  businessName: 180,
  businessNameEn: 180,
  commercialRegNumber: 80,
  taxNumber: 80,
  commercialRegUrl: 1000,
  bankName: 120,
  bankAccountName: 180,
  iban: 64,
  logoUrl: 1000,
  primaryColor: 7,
  phone: 40,
  address: 400,
  websiteUrl: 1000,
  secondaryColor: 7,
  heroImageUrl: 1000,
  splashImageUrl: 1000,
  splashTitle: 180,
  splashSubtitle: 300,
};

function featureEnabled() {
  return process.env.FEATURE_SAAS_PROJECT_BUILDER !== "false";
}

function deliveryWorkflowEnabled() {
  return process.env.FEATURE_SAAS_BUILDER_DELIVERY_V2 !== "false";
}

export function saasBuilderPrincipal(req: any): { id: string; role: string } | null {
  if (!req?.isAuthenticated?.()) return null;
  const user = req.user as any;
  const role = String(user?.role || "").toLowerCase();
  if (!user || !["admin", "cto", "owner"].includes(role)) return null;
  return { id: String(user.id || user._id || ""), role };
}

export function saasTierFromOrder(order: any): "lite" | "pro" | "infinity" | null {
  const persisted = String(order?.planTier || "").toLowerCase();
  if (persisted === "infinite" || persisted === "infinity") return "infinity";
  if (persisted === "lite" || persisted === "pro") return persisted;
  return null;
}

export function isSaasBuilderOrder(order: any): boolean {
  const sector = `${order?.sector || ""} ${order?.serviceType || ""} ${order?.projectType || ""} ${order?.planSegment || ""}`.toLowerCase();
  return /restaurant|cafe|café|مطعم|مقهى|كافيه|مطاعم/.test(sector);
}

export function normalizeBuilderConfig(raw: any): BuilderConfig {
  const config: any = {};
  for (const [key, limit] of Object.entries(CONFIG_FIELDS)) {
    const value = raw?.[key];
    config[key] = typeof value === "string" ? value.trim().slice(0, limit) : "";
  }
  config.extraFeatures = [...new Set(Array.isArray(raw?.extraFeatures) ? raw.extraFeatures : [])]
    .filter((id): id is string => typeof id === "string" && SAAS_FEATURES.some(feature => feature.id === id));
  config.customerWhatsappRegistration = raw?.customerWhatsappRegistration === true;
  config.notificationEmail = raw?.notificationEmail === true;
  Object.assign(config, normalizeSplashSettings(raw || {}));
  return config as BuilderConfig;
}

export function buildOneTimeDeploymentEnvelope(input: {
  envRequirements: Array<{ key: string; required: boolean; description: string }>;
  projectId: string;
  tier: string;
  config: BuilderConfig;
  databaseUri: string;
  access?: { adminPasswordHash?: string; staffPasswordHash?: string };
  integrationEnv?: Record<string, string>;
}): Array<{ key: string; required: boolean; description: string; value?: string; persisted?: false }> {
  const deploymentConfig = normalizeBuilderConfig(input.config);
  if (deploymentConfig.logoUrl.startsWith("/uploads/")) {
    const extension = path.extname(deploymentConfig.logoUrl).toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(extension)) {
      throw new Error("صيغة الشعار المرفوع غير صالحة لإعداد النشر");
    }
    deploymentConfig.logoUrl = `/tenant-logo${extension}`;
  }
  if (deploymentConfig.heroImageUrl?.startsWith("/uploads/")) {
    deploymentConfig.heroImageUrl = `/tenant-hero${path.extname(deploymentConfig.heroImageUrl).toLowerCase()}`;
  }
  if (deploymentConfig.splashImageUrl?.startsWith("/uploads/")) {
    deploymentConfig.splashImageUrl = `/tenant-splash${path.extname(deploymentConfig.splashImageUrl).toLowerCase()}`;
  }
  const requiredKeys = new Set(input.envRequirements.map((item) => item.key));
  const values: Record<string, string> = {
    MONGODB_URI: String(input.databaseUri).trim(),
    TENANT_ID: input.projectId,
    PROJECT_PLAN_TIER: input.tier,
    BUSINESS_CONFIG_JSON: JSON.stringify(deploymentConfig),
  };
  if (requiredKeys.has("SESSION_SECRET")) values.SESSION_SECRET = crypto.randomBytes(48).toString("base64url");
  if (requiredKeys.has("BOOTSTRAP_ADMIN_PASSWORD") && !input.access?.adminPasswordHash) values.BOOTSTRAP_ADMIN_PASSWORD = crypto.randomBytes(32).toString("base64url");
  if (input.access?.adminPasswordHash) values.BOOTSTRAP_ADMIN_PASSWORD_HASH = input.access.adminPasswordHash;
  if (input.access?.staffPasswordHash) values.BOOTSTRAP_STAFF_PASSWORD_HASH = input.access.staffPasswordHash;
  Object.assign(values, input.integrationEnv || {});
  const requirements = [...input.envRequirements];
  for (const key of Object.keys(values)) if (!requirements.some(item => item.key === key)) requirements.push({ key, required: true, description: "إعداد نشر خاص بالمشروع؛ لا يُحفظ في ملفات المصدر." });
  return requirements.map((item) => ({
    ...item,
    ...(item.key === "BOOTSTRAP_ADMIN_PASSWORD" && input.access?.adminPasswordHash ? { required: false } : {}),
    ...(item.key === "MONGODB_URI" && !String(values.MONGODB_URI || "").trim()
      ? { required: false, description: "اختياري لتجهيز الملفات؛ أضف رابط MongoDB مخصصًا قبل تشغيل النظام أو نشره." }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(values, item.key) && !(item.key === "MONGODB_URI" && !String(values.MONGODB_URI || "").trim())
      ? { value: values[item.key], persisted: false as const }
      : {}),
  }));
}

export function validateBuilderConfigLocally(config: BuilderConfig): string[] {
  const errors: string[] = [];
  if (!config.businessName) errors.push("اسم النشاط مطلوب");
  if (!config.commercialRegNumber) errors.push("رقم السجل التجاري مطلوب");
  if (config.commercialRegUrl && !isHttpsUrl(config.commercialRegUrl) && !safeLocalUploadUrl(config.commercialRegUrl)) {
    errors.push("رابط السجل التجاري يجب أن يكون HTTPS");
  }
  if (config.websiteUrl && !isHttpsUrl(config.websiteUrl)) errors.push("رابط الموقع يجب أن يكون HTTPS");
  if (config.logoUrl && !isSafePublicUrl(config.logoUrl)) errors.push("رابط الشعار غير صالح");
  if (config.primaryColor && !/^#[0-9a-f]{6}$/i.test(config.primaryColor)) errors.push("لون الهوية غير صالح");
  if (config.secondaryColor && !/^#[0-9a-f]{6}$/i.test(config.secondaryColor)) errors.push("اللون الثانوي غير صالح");
  if (config.heroImageUrl && !isSafePublicUrl(config.heroImageUrl)) errors.push("رابط صورة الهيرو غير صالح");
  if (config.splashImageUrl && !isSafePublicUrl(config.splashImageUrl)) errors.push("رابط صورة شاشة البداية غير صالح");
  if (config.iban && !/^[A-Za-z0-9 -]{8,64}$/.test(config.iban)) errors.push("رقم IBAN غير صالح");
  return errors;
}

function isHttpsUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return false;
    if (host === "[::1]" || host.startsWith("[fc") || host.startsWith("[fd") || host.startsWith("[fe80:")) return false;
    const ipv4 = host.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
    if (ipv4) {
      const [a, b] = host.split(".").map(Number);
      if (a === 0 || a === 10 || a === 127 || a === 169 && b === 254 || a === 192 && b === 168 || a === 172 && b >= 16 && b <= 31) return false;
    }
    return true;
  } catch { return false; }
}

function isSafePublicUrl(raw: string): boolean {
  return (safeLocalUploadUrl(raw) && !/\.pdf$/i.test(raw)) || isHttpsUrl(raw);
}

function templateIdOf(template: any): string {
  return String(template?.id || template?.templateId || template?.key || "");
}

function templateAvailable(templates: any[], id: string, tier: string): boolean {
  const template = templates.find((item) => templateIdOf(item) === id);
  if (!template || template.available === false) return false;
  const minimum = String(template.minTier || template.minimumTier || "lite").toLowerCase();
  return (TIER_RANK[tier] || 0) >= (TIER_RANK[minimum] || Number.MAX_SAFE_INTEGER);
}

async function validateWithTemplates(config: BuilderConfig, tier: string): Promise<string[]> {
  const localErrors = validateBuilderConfigLocally(config);
  try {
    const result: any = await (validateBuilderConfig as any)(config, tier);
    if (result === false) localErrors.push("إعدادات المشروع غير صالحة");
    else if (Array.isArray(result)) localErrors.push(...result.map(String));
    else if (result && typeof result === "object") {
      if (result.valid === false) {
        const errors = result.errors || result.issues || ["إعدادات المشروع غير صالحة"];
        localErrors.push(...(Array.isArray(errors) ? errors.map((item: any) => String(item?.message || item)) : [String(errors)]));
      }
    }
  } catch (error: any) {
    localErrors.push(String(error?.message || "إعدادات المشروع غير صالحة"));
  }
  return [...new Set(localErrors)];
}

export function formatSaasBuilderError(error: any): { status: number; body: Record<string, unknown> } {
  if (error?.status === 409 || error?.code === "needsConfirmation") {
    const needsConfirmation = error?.code === "needsConfirmation";
    return {
      status: 409,
      body: {
        error: needsConfirmation ? "المستودع يحتوي على أكواد سابقة؛ يلزم تأكيد الاستبدال" : "تعارض في حالة المشروع",
        code: error.code || "conflict",
        ...(needsConfirmation ? { needsConfirmation: true } : {}),
      },
    };
  }
  if (error?.status === 401 || error?.status === 403 || error?.status === 429) {
    const operationLabels: Record<string, string> = {
      repository_read: "التحقق من المستودع",
      branch_read: "قراءة الفرع",
      commit_read: "قراءة النسخة الحالية",
      tree_read: "قراءة ملفات المستودع",
      backup_ref_create: "إنشاء النسخة الاحتياطية",
      blob_create: "رفع ملفات المشروع",
      tree_create: "تجميع ملفات المشروع",
      commit_create: "إنشاء نسخة المشروع",
      branch_update: "تحديث الفرع المستهدف",
    };
    const operation = operationLabels[String(error?.operation || "")];
    const code = String(error?.code || "");
    let message = "رفض GitHub عملية المزامنة. تحقق من صلاحية الاتصال وإعدادات المستودع؛ لم يتغير الفرع المستهدف.";
    if (code === "github_token_scope") {
      message = "صلاحية اتصال GitHub لا تسمح بكتابة محتوى هذا المستودع. امنح الرمز صلاحية Contents: Read and write ووصولاً إلى المستودع ثم أعد المحاولة.";
    } else if (code === "github_repository_rules") {
      message = "رفضت قواعد المستودع في GitHub تحديث المشروع. راجع قواعد الفرع أو فحص حماية الأسرار؛ لم يتغير الفرع المستهدف.";
    } else if (code === "github_rate_limit") {
      const retryAfterSeconds = Math.max(1, Math.ceil(Number(error?.retryAfterSeconds) || 60));
      message = `فرض GitHub حداً مؤقتاً للطلبات. انتظر ${retryAfterSeconds} ثانية ثم أعد المحاولة؛ لم يتغير الفرع المستهدف.`;
    } else if (code === "github_unauthorized") {
      message = "انتهت صلاحية اتصال GitHub أو لم يعد صالحاً. أعد ربط حساب GitHub ثم أعد المحاولة.";
    }
    return {
      status: 503,
      body: {
        error: operation ? `${message} المرحلة: ${operation}.` : message,
        code: code || "github_forbidden",
        ...(operation ? { operation: String(error.operation) } : {}),
      },
    };
  }
  if (error?.status === 404) return { status: 404, body: { error: "المورد المطلوب غير موجود" } };
  if (error?.status === 400) return { status: 400, body: { error: "بيانات الطلب غير صالحة" } };
  return { status: 503, body: { error: "تعذر إكمال عملية منشئ النظام حالياً" } };
}

function sendError(res: Response, error: any) {
  const result = formatSaasBuilderError(error);
  if (result.status === 503) {
    console.error("[SaasBuilder] request failed", {
      status: Number(error?.status) || 0,
      code: String(error?.code || "unknown").slice(0, 40),
      operation: String(error?.operation || "unknown").slice(0, 40),
    });
  }
  return res.status(result.status).json(result.body);
}

async function resolveOrderContext(orderId: string) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) return { error: "not-found" as const };
  const order: any = await OrderModel.findById(orderId).lean();
  if (!order) return { error: "not-found" as const };
  if (!isSaasBuilderOrder(order)) return { error: "ineligible" as const };
  const project: any = await ProjectModel.findOne({ orderId: order._id }).lean();
  if (!project) return { error: "project-missing" as const };
  const builder: any = await SaasBuilderModel.findOne({ projectId: project._id }).lean();
  return { order, project, builder };
}

function respondContextError(res: Response, context: any): boolean {
  if (!context.error) return false;
  if (context.error === "not-found") res.status(404).json({ error: "الطلب غير موجود" });
  else if (context.error === "ineligible") res.status(400).json({ error: "منشئ الأنظمة متاح لطلبات المطاعم والمقاهي فقط" });
  else res.status(404).json({ error: "لا يوجد مشروع مرتبط بهذا الطلب" });
  return true;
}

function configForGet(builder: any, order: any, project: any): BuilderConfig {
  return normalizeBuilderConfig(inheritedBuilderConfig(builder, order, project));
}

function escapeHtml(text: unknown): string {
  return String(text || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char] as string));
}

function makeDesignPreview(config: BuilderConfig, template: any, templateIndex: number): string {
  const accent = /^#[0-9a-f]{6}$/i.test(config.primaryColor) ? config.primaryColor : "#2563eb";
  const logo = config.logoUrl && isSafePublicUrl(config.logoUrl) ? config.logoUrl : "";
  const templateName = template?.nameAr || template?.name || "معاينة التصميم";
  const theme = templatePreviewTheme(template, templateIndex);
  const styles: Record<string, { background: string; panel: string; hero: string; radius: string; font: string }> = {
    modern: { background: "#f4f6fb", panel: "#ffffff", hero: "linear-gradient(130deg,var(--brand),#14213d)", radius: "26px", font: "system-ui,sans-serif" },
    warm: { background: "#fff8ef", panel: "#fffdf8", hero: "linear-gradient(130deg,#a95028,var(--brand))", radius: "18px", font: "Georgia,serif" },
    dark: { background: "#090d17", panel: "#141c2b", hero: "linear-gradient(130deg,#111827,var(--brand))", radius: "12px", font: "system-ui,sans-serif" },
    classic: { background: "#f5f0e7", panel: "#fffdf7", hero: "linear-gradient(130deg,#314633,var(--brand))", radius: "4px", font: "Georgia,serif" },
    minimal: { background: "#ffffff", panel: "#ffffff", hero: "linear-gradient(130deg,#ffffff,#eef2f7)", radius: "2px", font: "Arial,sans-serif" },
  };
  const selected = styles[theme];
  const secondary = /^#[0-9a-f]{6}$/i.test(config.secondaryColor || "") ? config.secondaryColor : accent;
  const templateHero = `linear-gradient(130deg,${accent},${secondary})`;
  const heroText = theme === "minimal" ? "#172033" : "#ffffff";
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>معاينة تصميم</title><style>
:root{--brand:${accent};--page:${selected.background};--panel:${selected.panel};--hero:${templateHero};--radius:${selected.radius};--hero-ink:${heroText}}*{box-sizing:border-box}body{margin:0;background:var(--page);color:#172033;font:16px/1.7 ${selected.font}}.preview-shell{max-width:1080px;margin:32px auto;padding:24px}.notice{display:inline-block;margin-bottom:18px;padding:7px 12px;border-radius:99px;background:#fff2cc;color:#684f00;font:13px system-ui,sans-serif}.hero{background:var(--hero);color:var(--hero-ink);border-radius:var(--radius);padding:48px;min-height:260px;display:flex;align-items:center;justify-content:space-between;gap:24px}.hero h1{font-size:clamp(30px,5vw,54px);margin:8px 0}.hero p{opacity:.86}.logo{width:80px;height:80px;object-fit:contain;background:#fff;border-radius:12px;padding:8px}.card{margin-top:18px;background:var(--panel);border-radius:var(--radius);padding:24px;box-shadow:0 8px 32px #10204012;border-top:3px solid var(--brand)}.identity{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.field{padding:12px;border:1px solid #e7eaf033;border-radius:calc(var(--radius)/2)}.muted{color:#667085}@media(max-width:620px){.preview-shell{padding:14px}.hero{padding:28px;display:block}.logo{margin-bottom:14px}.identity{grid-template-columns:1fr}}
</style></head><body><main class="preview-shell"><span class="notice">معاينة تصميم فقط — ليست نظاماً يعمل أو خدمة منشورة · ${escapeHtml(templateName)}</span><section class="hero">${logo ? `<img class="logo" src="${escapeHtml(logo)}" alt="">` : ""}<div><p>مرحباً بكم في</p><h1>${escapeHtml(config.businessName || config.businessNameEn)}</h1><p>${escapeHtml(config.address || "هوية النشاط التجاري")}</p></div></section><section class="card"><h2>بيانات النشاط</h2><div class="identity"><div class="field"><span class="muted">رقم السجل التجاري</span><br>${escapeHtml(config.commercialRegNumber || "—")}</div><div class="field"><span class="muted">للتواصل</span><br>${escapeHtml(config.phone || "—")}</div><div class="field"><span class="muted">الموقع</span><br>${escapeHtml(config.websiteUrl || "—")}</div><div class="field"><span class="muted">هوية اللون</span><br><span style="color:${escapeHtml(accent)}">${escapeHtml(accent)}</span></div></div></section></main></body></html>`;
  const preview = config.heroImageUrl && isSafePublicUrl(config.heroImageUrl)
    ? html.replace('<section class="hero">', `<section class="hero" style="position:relative;isolation:isolate;overflow:hidden"><img src="${escapeHtml(config.heroImageUrl)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-1;opacity:.3">`)
    : html;
  return preview.replace(/<body(?:\s[^>]*)?>/i, match => match + splashPreviewMarkup(config));
}

function requireAdmin(req: Request, res: Response): boolean {
  if (!(req as any).isAuthenticated?.()) {
    res.status(401).json({ error: "يجب تسجيل الدخول" });
    return false;
  }
  if (!saasBuilderPrincipal(req)) {
    res.status(403).json({ error: "هذه العملية متاحة للمسؤول أو مالك النظام أو CTO فقط" });
    return false;
  }
  return true;
}

async function featureGate(_req: Request, res: Response, next: () => void) {
  if (!featureEnabled()) return res.sendStatus(404);
  try {
    await ensureSaasBuilderProjectIndex();
    next();
  } catch {
    console.error("[SaasBuilder] model index initialization failed");
    res.status(503).json({ error: "تعذر تهيئة منشئ النظام حالياً" });
  }
}

async function deliveryFeatureGate(req: Request, res: Response, next: () => void) {
  if (!deliveryWorkflowEnabled()) return res.sendStatus(404);
  return featureGate(req, res, next);
}

const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_LOGO_BYTES, files: 1 },
});

async function getTemplateList() {
  return await (listTemplates as any)();
}

function serverErrorStatus(error: any) {
  if (error instanceof multer.MulterError) return 400;
  if (error?.status && [400, 404, 409, 503].includes(error.status)) return error.status;
  return 503;
}

function attachLogoRoute(app: Express, method: "post" | "put", route: string) {
  app[method](route, featureGate, async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      await new Promise<void>((resolve, reject) => {
        logoUpload.single("logo")(req as any, res as any, (error: any) => error ? reject(error) : resolve());
      });
      const file = (req as any).file;
      if (!file) return res.status(400).json({ error: "ملف الشعار مطلوب" });
      const context = await resolveOrderContext(req.params.id);
      if (respondContextError(res, context)) return;
      const { order, project, builder } = context as any;
      if (builder?.status === "building" || (builder?.leaseExpiresAt && new Date(builder.leaseExpiresAt).getTime() > Date.now())) {
        return res.status(409).json({ error: "لا يمكن تعديل الشعار أثناء إنشاء النظام", code: "buildInProgress" });
      }
      const logo = await persistSaasLogo(file.buffer, file.mimetype, ["true", "1", "yes"].includes(String(req.body?.removeBackground).toLowerCase()));
      await saveProjectLogo({ projectId: project._id, orderId: order._id, logo, addedBy: (req.user as any)?._id });
      const palette = await extractLogoPalette(file.buffer).catch(() => null);
      res.json({ success: true, logoUrl: logo.logoUrl, originalUrl: logo.logoOriginalUrl, processingStatus: logo.processingStatus, processed: logo.processingStatus === "processed", warning: logo.warning || "", palette });
    } catch (error: any) {
      const status = serverErrorStatus(error);
      if (status === 400) return res.status(400).json({ error: error?.code === "LIMIT_FILE_SIZE" ? "حجم الشعار يتجاوز 8MB" : error.message || "بيانات الشعار غير صالحة" });
      sendError(res, error);
    }
  });
}

export function registerSaasBuilderRoutes(app: Express) {
  const base = "/api/admin/orders/:id/saas-builder";

  app.get(base, featureGate, async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const context = await resolveOrderContext(req.params.id);
      if (respondContextError(res, context)) return;
      const { order, project, builder } = context as any;
      const tier = saasTierFromOrder(order);
      const templates = await getTemplateList();
      const integrations: any[] = await ProjectIntegrationModel.find({ orderId: order._id, status: "active", $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }).select("type").lean();
      const specs: any = await OrderSpecsModel.findOne({ orderId: order._id }).select("+databaseUri githubRepoUrl").lean();
      const provisioning: any = await OrderProvisioningModel.findOne({ orderId: order._id }).select("githubActorId").lean();
      const repositoryUrl = String(project.repoUrl || specs?.githubRepoUrl
        || (project.githubRepoOwner && project.githubRepoName ? `https://github.com/${project.githubRepoOwner}/${project.githubRepoName}` : "")).trim();
      const githubToken = await resolveGitHubToken(req, true, String(provisioning?.githubActorId || "") || undefined);
      const leaseExpiresAt = builder?.leaseExpiresAt ? new Date(builder.leaseExpiresAt).getTime() : 0;
      res.json({
        projectId: String(project._id),
        orderId: String(order._id),
        tier,
        sector: order.sector || order.serviceType || order.projectType || "",
        templates,
        templateId: builder?.templateId || "",
        accessConfigured: builder?.accessConfigured || { admin: false, staff: false },
        integrationReadiness: {
          whatsapp: integrations.some(item => ["whatsapp", "api"].includes(item.type)),
          email: integrations.some(item => ["email", "api"].includes(item.type)),
        },
        config: configForGet(builder, order, project),
        build: safeSaasBuilderBuild(builder?.build),
        status: builder?.status || "draft",
        buildBusy: builder?.status === "building" && leaseExpiresAt > Date.now(),
        deliveryWorkflowV2: deliveryWorkflowEnabled(),
        githubReady: Boolean(parseCanonicalGitHubRepository(repositoryUrl) && githubToken),
        preparedArtifact: deliveryWorkflowEnabled()
          ? await getLatestPreparedArtifact(String(project._id), String(order._id))
          : null,
        logoUrl: project.logoUrl || order.logoUrl || "",
        partnerId: builder?.partnerId ? String(builder.partnerId) : null,
        databaseReadiness: specs?.databaseUri
          ? "configured_in_specs"
          : "not_configured",
      });
    } catch (error: any) {
      sendError(res, error);
    }
  });

  app.post(`${base}/prepare`, deliveryFeatureGate, async (req, res) => {
    if (!requireAdmin(req, res)) return;
    let tempDir = "";
    let builderLeaseToken = "";
    let projectId = "";
    let orderId = "";
    let artifactId = "";
    try {
      const context = await resolveOrderContext(req.params.id);
      if (respondContextError(res, context)) return;
      const { order, project, builder: priorBuilder } = context as any;
      projectId = String(project._id);
      orderId = String(order._id);
      const tier = saasTierFromOrder(order);
      if (!tier) return res.status(400).json({ error: "لا توجد باقة مؤكدة على الطلب؛ تجهيز النظام متوقف" });
      if (!priorBuilder) return res.status(400).json({ error: "احفظ إعدادات القالب والهوية قبل تجهيز النظام" });

      const builderNow = new Date();
      builderLeaseToken = crypto.randomUUID();
      const builderLease = await SaasBuilderModel.findOneAndUpdate(
        {
          projectId: project._id,
          $or: [{ leaseExpiresAt: null }, { leaseExpiresAt: { $exists: false } }, { leaseExpiresAt: { $lt: builderNow } }],
        },
        {
          $set: {
            orderId: order._id,
            tier,
            status: "building",
            leaseToken: builderLeaseToken,
            leaseExpiresAt: new Date(builderNow.getTime() + 15 * 60 * 1000),
          },
        },
        { new: true },
      );
      if (!builderLease) {
        builderLeaseToken = "";
        const activeBuilder: any = await SaasBuilderModel.findOne({ projectId: project._id }).select("leaseExpiresAt status").lean();
        if (activeBuilder?.leaseExpiresAt && new Date(activeBuilder.leaseExpiresAt).getTime() > Date.now()) {
          return res.status(202).json({ status: "building", code: "buildInProgress", message: "تجهيز المشروع جارٍ بالفعل" });
        }
        return res.status(409).json({ error: "تعذر بدء التجهيز؛ حدّث الحالة وحاول مرة أخرى", code: "builderLeaseConflict" });
      }

      const templateId = String(builderLease.templateId || "").trim();
      const config = normalizeBuilderConfig(builderLease.config || {});
      const errors = await validateWithTemplates(config, tier);
      if (errors.length) return res.status(400).json({ error: errors[0], errors });
      const templates = await getTemplateList();
      if (!templateAvailable(templates, templateId, tier)) return res.status(400).json({ error: "قالب المشروع غير متاح ضمن الباقة" });
      const fingerprint = fingerprintSaasBuilderConfig(templateId, tier, config);

      const specs: any = await OrderSpecsModel.findOne({ orderId: order._id }).select("+databaseUri").lean();
      const databaseSetup = databaseForSaasBuild(specs?.databaseUri, process.env.MONGODB_URI, OrderModel.db.name);
      tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "saas-builder-prepare-"));
      const generated: any = await (generateProject as any)({
        templateId,
        config,
        tier,
        outputDir: tempDir,
        ...(localBuilderImage(config.logoUrl) ? { logoPath: localBuilderImage(config.logoUrl) } : {}),
        ...(localBuilderImage(config.heroImageUrl) ? { heroPath: localBuilderImage(config.heroImageUrl) } : {}),
        ...(localBuilderImage(config.splashImageUrl) ? { splashPath: localBuilderImage(config.splashImageUrl) } : {}),
      });

      const envRequirements = (generated.envVars || []).map((item: any) => ({
        key: String(item.key || ""),
        required: Boolean(item.required),
        description: String(item.description || ""),
      })).filter((item: any) => item.key && /^[A-Z][A-Z0-9_]{1,63}$/.test(item.key));
      const mongoRequirement = envRequirements.find((item: any) => item.key === "MONGODB_URI");
      if (mongoRequirement) {
        mongoRequirement.required = databaseSetup.databaseReady;
        mongoRequirement.description = databaseSetup.databaseReady
          ? "رابط MongoDB المخصص الذي تم اختباره لهذا المشروع."
          : "اختياري لتجهيز الملفات. أضف رابط MongoDB مخصصًا قبل تشغيل النظام أو نشره.";
      } else {
        envRequirements.push({
          key: "MONGODB_URI",
          required: databaseSetup.databaseReady,
          description: databaseSetup.databaseReady
            ? "رابط MongoDB المخصص الذي تم اختباره لهذا المشروع."
            : "اختياري لتجهيز الملفات. أضف رابط MongoDB مخصصًا قبل تشغيل النظام أو نشره.",
        });
      }
      if (!envRequirements.some((item: any) => item.key === "SESSION_SECRET")) {
        envRequirements.push({ key: "SESSION_SECRET", required: true, description: "مفتاح جلسات التطبيق؛ ينشأ عند رفعه إلى GitHub أو أضفه يدوياً لخدمة النشر." });
      }

      const warnings = [
        ...(Array.isArray(generated.warnings) ? generated.warnings.map((item: any) => String(item).slice(0, 300)) : []),
        ...(!databaseSetup.databaseReady ? ["تم تجهيز الملفات دون ربط MongoDB. أضف قاعدة مخصصة قبل تشغيل النظام أو نشره."] : []),
      ];
      for (const [enabled, channel] of [[config.customerWhatsappRegistration, "whatsapp"], [config.notificationEmail, "email"]] as const) {
        if (enabled && !await ProjectIntegrationModel.exists({
          orderId,
          status: "active",
          type: { $in: [channel, "api"] },
          $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
        })) {
          warnings.push(`أعد إعداد تكامل ${channel === "whatsapp" ? "واتساب" : "البريد"} قبل رفع المشروع إلى GitHub.`);
        }
      }

      const completedAt = new Date();
      const safeSummary = {
        branch: "",
        commitSha: "",
        backupRef: "",
        fileCount: Number(generated.fileCount || 0),
        buildCommand: String(generated.buildCommand || "").slice(0, 300),
        startCommand: String(generated.startCommand || "").slice(0, 300),
        envRequirements,
        warnings,
        completedAt,
      };
      const artifact = await createPreparedArtifact({
        orderId,
        projectId,
        outputDir: tempDir,
        templateId,
        tier,
        configFingerprint: fingerprint,
        generated: {
          ...safeSummary,
          envVars: envRequirements,
          warnings,
        },
      });
      artifactId = artifact.artifactId;

      const update = await SaasBuilderModel.updateOne(
        { projectId: project._id, leaseToken: builderLeaseToken },
        { $set: { status: "prepared", configFingerprint: fingerprint, build: safeSummary }, $unset: { leaseToken: 1, leaseExpiresAt: 1 } },
      );
      if (!update.matchedCount) {
        await removePreparedArtifact(artifactId);
        artifactId = "";
        throw new Error("تعذر تثبيت الملفات الجاهزة؛ أعد التجهيز");
      }
      builderLeaseToken = "";
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.setHeader("Pragma", "no-cache");
      res.json({
        success: true,
        status: "prepared",
        projectId,
        orderId,
        databaseReady: databaseSetup.databaseReady,
        artifact,
        build: safeSaasBuilderBuild(safeSummary),
        envRequirements,
      });
    } catch (error: any) {
      if (artifactId) await removePreparedArtifact(artifactId).catch(() => {});
      sendError(res, error);
    } finally {
      if (tempDir) await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      if (builderLeaseToken && projectId) {
        await SaasBuilderModel.updateOne(
          { projectId, leaseToken: builderLeaseToken, status: "building" },
          { $set: { status: "failed" }, $unset: { leaseToken: 1, leaseExpiresAt: 1 } },
        ).catch(() => {});
      }
    }
  });

  app.get(`${base}/artifacts/:artifactId/download`, deliveryFeatureGate, async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const context = await resolveOrderContext(req.params.id);
      if (respondContextError(res, context)) return;
      const { order, project } = context as any;
      const artifact = await getPreparedArtifact(req.params.artifactId, String(project._id), String(order._id));
      if (!artifact) return res.status(410).json({ error: "انتهت صلاحية الملفات الجاهزة؛ أعد تجهيز المشروع" });
      res.setHeader("Cache-Control", "no-store, private");
      res.download(artifact.zipPath, `qirox-project-${String(project._id).slice(-8)}.zip`, (error) => {
        if (error && !res.headersSent) res.status(410).json({ error: "تعذر تنزيل الملف؛ أعد تجهيز المشروع" });
      });
    } catch (error: any) {
      sendError(res, error);
    }
  });

  app.put(base, featureGate, async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const context = await resolveOrderContext(req.params.id);
      if (respondContextError(res, context)) return;
      const { order, project, builder } = context as any;
      if (builder?.status === "building" || (builder?.leaseExpiresAt && new Date(builder.leaseExpiresAt).getTime() > Date.now())) {
        return res.status(409).json({ error: "يعمل إنشاء آخر على هذا المشروع", code: "buildInProgress" });
      }
      const tier = saasTierFromOrder(order);
      if (!tier) return res.status(400).json({ error: "لا توجد باقة مؤكدة على الطلب؛ لا يمكن حفظ إعدادات المنشئ" });
      const config = normalizeBuilderConfig({ ...configForGet(builder, order, project), ...(req.body?.config || req.body) });
      const errors = await validateWithTemplates(config, tier);
      if (errors.length) return res.status(400).json({ error: errors[0], errors });
      const templateId = String(req.body?.templateId || "").trim().slice(0, 120);
      const templates = await getTemplateList();
      if (!templateId || !templateAvailable(templates, templateId, tier)) {
        return res.status(400).json({ error: "قالب المشروع غير متاح ضمن الباقة المؤكدة" });
      }
      let saved: any;
      try {
        saved = await SaasBuilderModel.findOneAndUpdate(
          {
            projectId: project._id,
            $or: [{ leaseExpiresAt: null }, { leaseExpiresAt: { $exists: false } }, { leaseExpiresAt: { $lt: new Date() } }],
          },
          { $set: { orderId: order._id, tier, templateId, config, prefillVersion: 2, status: "draft", configFingerprint: "" } },
          { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
        ).lean() as any;
      } catch (error: any) {
        if (error?.code === 11000) return res.status(409).json({ error: "لا يمكن تعديل إعدادات المشروع أثناء وجود عملية أخرى", code: "operationInProgress" });
        throw error;
      }
      await syncProjectBranding({
        projectId: project._id,
        config: {
          publicName: config.businessNameEn || config.businessName,
          publicNameAr: config.businessName,
          websiteUrl: config.websiteUrl,
          logoUrl: config.logoUrl || project.logoUrl || order.logoUrl || "",
        },
      });
      await SandboxProjectModel.updateMany({ sourceProjectId: project._id }, { $set: { logoUrl: config.logoUrl || project.logoUrl || order.logoUrl || "" } });
      await removeLatestPreparedArtifact(String(project._id), String(order._id));
      res.json({ success: true, projectId: String(project._id), templateId, config: saved.config, status: saved.status });
    } catch (error: any) {
      sendError(res, error);
    }
  });

  attachLogoRoute(app, "post", `${base}/logo`);
  attachLogoRoute(app, "put", `${base}/logo`);

  app.post(`${base}/database`, featureGate, async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const context = await resolveOrderContext(req.params.id);
    if (respondContextError(res, context)) return;
    const database = prepareProjectDatabaseUri(
      req.body?.databaseUri,
      String(context.order!._id),
      process.env.MONGODB_URI,
      OrderModel.db.name,
    );
    if (database.sameAsPlatform) {
      return res.status(400).json({
        code: "platformDatabaseNotAllowed",
        error: "هذا رابط قاعدة المنصة نفسها، ولا يمكن ربط بياناتها بمشروع عميل. يمكنك متابعة تجهيز الملفات دون ربط قاعدة MongoDB.",
      });
    }
    if (!database.valid) {
      return res.status(400).json({ code: "invalidDatabaseUri", error: "أدخل رابط MongoDB كاملًا يتضمن اسم قاعدة بيانات مستقلة." });
    }
    let connection: mongoose.Connection | undefined;
    let phase: "connect" | "save" = "connect";
    try {
      connection = mongoose.createConnection(database.databaseUri, { serverSelectionTimeoutMS: 15000, connectTimeoutMS: 10000 });
      await connection.asPromise();
      await connection.db!.admin().ping();
      phase = "save";
      await OrderSpecsModel.updateOne({ orderId: context.order!._id }, { $set: { databaseUri: database.databaseUri } }, { upsert: true });
      const workspace: any = await SandboxProjectModel.findOne({ sourceProjectId: context.project!._id }).lean();
      if (workspace) {
        const { persistMissingSandboxEnvironment } = await import("../../sandbox-routes");
        await persistMissingSandboxEnvironment(workspace._id, { MONGODB_URI: database.databaseUri }, ["MONGODB_URI"]);
      }
      res.setHeader("Cache-Control", "no-store");
      res.json({
        connected: true,
        restartRequired: Boolean(workspace),
        databaseNameAssigned: database.autoAssignedDatabaseName,
      });
    } catch (error: any) {
      const failure = mongoDatabaseLinkFailure(error, phase);
      console.warn("[SaaSBuilder] MongoDB link failed", failure.code);
      res.status(503).json({ error: failure.message, code: failure.code });
    } finally { await connection?.close().catch(() => {}); }
  });

  app.post(`${base}/preview/runtime`, featureGate, async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const context = await resolveOrderContext(req.params.id);
      if (respondContextError(res, context)) return;
      const { order, project, builder } = context as any;
      if (!builder?.templateId) return res.status(400).json({ error: "اختر القالب واحفظ الإعدادات أولًا" });
      if (builder.status === "building") return res.status(409).json({ error: "انتظر انتهاء عملية إنشاء النظام" });
      const specs: any = await OrderSpecsModel.findOne({ orderId: order._id }).select("+databaseUri").lean();
      const database = inspectProjectDatabaseUri(specs?.databaseUri, process.env.MONGODB_URI, OrderModel.db.name);
      if (!database.valid || database.sameAsPlatform) {
        return res.status(400).json({ error: "اربط قاعدة بيانات مخصصة قبل تشغيل النظام" });
      }
      const tier = saasTierFromOrder(order);
      if (!tier) return res.status(400).json({ error: "لم يتم تأكيد الباقة" });
      const errors = await validateWithTemplates(normalizeBuilderConfig(builder.config), tier);
      if (errors.length) return res.status(400).json({ error: errors[0] });
      const { prepareSaasRuntimeWorkspace } = await import("./workspace");
      const result = await prepareSaasRuntimeWorkspace({ order, project, builder, ownerId: (req.user as any)._id });
      res.json({ ...result, kind: "runtime", editsPreserved: true });
    } catch (error: any) {
      res.status(503).json({ error: "تعذر تجهيز المعاينة التشغيلية؛ تحقق من قاعدة البيانات وملفات المشروع" });
    }
  });

  app.post(`${base}/access`, featureGate, async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const context = await resolveOrderContext(req.params.id);
      if (respondContextError(res, context)) return;
      const { order, project } = context as any;
      const tier = saasTierFromOrder(order);
      if (!tier) return res.status(400).json({ error: "اختر باقة مؤكدة أولاً" });
      const changes: Record<string, unknown> = {};
      for (const [name, minimum] of [["adminPassword", 16], ["staffPassword", 12]] as const) {
        const value = req.body?.[name];
        if (value === undefined || value === "") continue;
        if (typeof value !== "string" || value.length < minimum || Buffer.byteLength(value) > 72) {
          return res.status(400).json({ error: `بيانات الدخول تتطلب ${minimum} محرفًا على الأقل وحدًا أقصى 72 بايت` });
        }
        const role = name === "adminPassword" ? "admin" : "staff";
        changes[`credentials.${name}Hash`] = await bcrypt.hash(value, 12);
        changes[`accessConfigured.${role}`] = true;
      }
      if (!Object.keys(changes).length) return res.status(400).json({ error: "أدخل بيانات دخول جديدة لحفظها" });
      const saved: any = await SaasBuilderModel.findOneAndUpdate({
        projectId: project._id,
        status: { $ne: "building" },
        $or: [{ leaseExpiresAt: null }, { leaseExpiresAt: { $exists: false } }, { leaseExpiresAt: { $lt: new Date() } }],
      }, { $set: changes, $setOnInsert: { orderId: order._id, tier, config: {} } }, { upsert: true, new: true }).lean();
      res.setHeader("Cache-Control", "no-store");
      res.json({ success: true, accessConfigured: saved.accessConfigured });
    } catch (error: any) {
      if (error?.code === 11000) return res.status(409).json({ error: "لا يمكن تعديل الدخول أثناء إنشاء النظام" });
      sendError(res, error);
    }
  });

  app.post(`${base}/hero`, featureGate, async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const context = await resolveOrderContext(req.params.id);
      if (respondContextError(res, context)) return;
      const { builder } = context as any;
      if (builder?.status === "building") return res.status(409).json({ error: "انتظر اكتمال إنشاء المشروع" });
      await new Promise<void>((resolve, reject) => logoUpload.single("hero")(req, res, error => error ? reject(error) : resolve()));
      if (!req.file) return res.status(400).json({ error: "اختر صورة الهيرو" });
      const image = await persistSaasLogo(req.file.buffer, req.file.mimetype, false);
      res.json({ heroImageUrl: image.logoUrl });
    } catch (error: any) { sendError(res, error); }
  });

  app.post(`${base}/splash`, featureGate, async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const context = await resolveOrderContext(req.params.id);
      if (respondContextError(res, context)) return;
      if (context.builder?.status === "building") return res.status(409).json({ error: "انتظر اكتمال إنشاء المشروع" });
      await new Promise<void>((resolve, reject) => logoUpload.single("splash")(req, res, error => error ? reject(error) : resolve()));
      if (!req.file) return res.status(400).json({ error: "اختر صورة شاشة البداية" });
      const image = await persistSaasLogo(req.file.buffer, req.file.mimetype, false);
      res.json({ splashImageUrl: image.logoUrl });
    } catch (error: any) { sendError(res, error); }
  });

  app.post(`${base}/palette`, featureGate, async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const context = await resolveOrderContext(req.params.id);
      if (respondContextError(res, context)) return;
      const { builder, order, project } = context as any;
      const file = localBuilderImage(configForGet(builder, order, project).logoUrl);
      // Do not fetch user-supplied external URLs (SSRF); uploaded logos are local.
      if (!file) return res.status(400).json({ error: "ارفع الشعار محليًا لاستخراج ألوانه" });
      const palette = await extractLogoPalette(await fs.promises.readFile(file));
      res.json({ palette });
    } catch (error: any) { sendError(res, error); }
  });

  app.post(`${base}/preview`, featureGate, async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const context = await resolveOrderContext(req.params.id);
      if (respondContextError(res, context)) return;
      const { order, project, builder } = context as any;
      const tier = saasTierFromOrder(order);
      if (!tier) return res.status(400).json({ error: "لا توجد باقة مؤكدة على الطلب" });
      const config = normalizeBuilderConfig(req.body?.config || builder?.config || configForGet(builder, order, project));
      const errors = await validateWithTemplates(config, tier);
      if (errors.length) return res.status(400).json({ error: errors[0], errors });
      const templateId = String(req.body?.templateId || builder?.templateId || "");
      const templates = await getTemplateList();
      if (!templateAvailable(templates, templateId, tier)) return res.status(400).json({ error: "قالب المشروع غير متاح ضمن الباقة" });
      const templateIndex = templates.findIndex((item: any) => templateIdOf(item) === templateId);
      const template = templates[templateIndex];
      res.json({ html: makeDesignPreview(config, template, templateIndex), kind: "design" });
    } catch (error: any) {
      sendError(res, error);
    }
  });

  app.post(`${base}/create`, featureGate, async (req, res) => {
    if (!requireAdmin(req, res)) return;
    let tempDir = "";
    let retainPreparedDir = false;
    let preparedArtifact: PreparedArtifact | null = null;
    let builderLeaseToken = "";
    let orderLeaseToken = "";
    let projectId = "";
    let orderId = "";
    let originalProvisioningStatus = "";
    try {
      const context = await resolveOrderContext(req.params.id);
      if (respondContextError(res, context)) return;
      const { order, project, builder: priorBuilder } = context as any;
      projectId = String(project._id);
      orderId = String(order._id);
      const tier = saasTierFromOrder(order);
      if (!tier) return res.status(400).json({ error: "لا توجد باقة مؤكدة على الطلب؛ إنشاء النظام متوقف" });
      if (!priorBuilder) return res.status(400).json({ error: "احفظ إعدادات القالب والهوية قبل إنشاء النظام" });
      for (const [enabled, channel] of [[priorBuilder.config?.customerWhatsappRegistration, "whatsapp"], [priorBuilder.config?.notificationEmail, "email"]] as const) {
        if (enabled && !await ProjectIntegrationModel.exists({ orderId, status: "active", type: { $in: [channel, "api"] }, $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] })) {
          return res.status(400).json({ error: "أعد إعداد تكامل واتساب أو البريد قبل إنشاء النظام" });
        }
      }
      const specs: any = await OrderSpecsModel.findOne({ orderId: order._id }).select("+databaseUri").lean();
      const databaseSetup = databaseForSaasBuild(specs?.databaseUri, process.env.MONGODB_URI, OrderModel.db.name);
      const databaseUri = databaseSetup.databaseUri;
      const repositoryUrl = String(project.repoUrl || specs.githubRepoUrl
        || (project.githubRepoOwner && project.githubRepoName
          ? `https://github.com/${project.githubRepoOwner}/${project.githubRepoName}`
          : "")).trim();
      if (!parseCanonicalGitHubRepository(repositoryUrl)) return res.status(400).json({ error: "لا يوجد مستودع GitHub قانوني مرتبط بالمشروع" });
      const initialProvisioning: any = await OrderProvisioningModel.findOne({ orderId: order._id }).select("githubActorId").lean();
      const token = await resolveGitHubToken(req, true, String(initialProvisioning?.githubActorId || "") || undefined);
      if (!token) return res.status(503).json({ error: "اتصال GitHub غير مهيأ" });
      const templateId = String(priorBuilder.templateId || "").trim();
      const config = normalizeBuilderConfig(priorBuilder.config);
      const errors = await validateWithTemplates(config, tier);
      if (errors.length) return res.status(400).json({ error: errors[0], errors });
      const templates = await getTemplateList();
      if (!templateAvailable(templates, templateId, tier)) return res.status(400).json({ error: "قالب المشروع غير متاح ضمن الباقة" });
      const fingerprint = fingerprintSaasBuilderConfig(templateId, tier, config);
      const preparedArtifactId = String(req.body?.preparedArtifactId || "").trim();
      if (preparedArtifactId) {
        if (!deliveryWorkflowEnabled()) return res.sendStatus(404);
        preparedArtifact = await getPreparedArtifact(preparedArtifactId, projectId, orderId);
        if (!preparedArtifact) return res.status(410).json({ error: "انتهت صلاحية الملفات الجاهزة؛ أعد تجهيز المشروع", code: "preparedArtifactExpired" });
        if (preparedArtifact.configFingerprint !== fingerprint || preparedArtifact.templateId !== templateId || preparedArtifact.tier !== tier) {
          await removePreparedArtifact(preparedArtifactId);
          preparedArtifact = null;
          return res.status(409).json({ error: "تغيرت الإعدادات بعد تجهيز الملفات؛ أعد تجهيز المشروع قبل الرفع", code: "preparedArtifactStale" });
        }
      }
      if (priorBuilder?.status === "published" && priorBuilder.configFingerprint === fingerprint) {
        return res.status(409).json({ error: "تم نشر هذه الإعدادات بالفعل؛ لم تتم إعادة الإنشاء", code: "alreadyPublished", build: safeSaasBuilderBuild(priorBuilder.build) });
      }
      const replaceExisting = req.body?.replaceExisting === true;
      const builderNow = new Date();
      builderLeaseToken = crypto.randomUUID();
      try {
        await SaasBuilderModel.updateOne(
          { projectId: project._id },
          { $setOnInsert: { orderId: order._id, tier, status: "draft", config: {}, templateId: "" } },
          { upsert: true, setDefaultsOnInsert: true },
        );
      } catch (error: any) {
        if (error?.code !== 11000) throw error;
      }
      const builderLeaseFilter: any = {
        projectId: project._id,
        $or: [{ leaseExpiresAt: null }, { leaseExpiresAt: { $exists: false } }, { leaseExpiresAt: { $lt: builderNow } }],
      };
      if (!preparedArtifact) builderLeaseFilter.updatedAt = priorBuilder.updatedAt;
      const builderLeaseSet: any = {
        orderId: order._id,
        tier,
        status: "building",
        leaseToken: builderLeaseToken,
        leaseExpiresAt: new Date(builderNow.getTime() + 15 * 60 * 1000),
      };
      if (!preparedArtifact) {
        builderLeaseSet.templateId = templateId;
        builderLeaseSet.config = config;
      }
      const builderLease = await SaasBuilderModel.findOneAndUpdate(
        builderLeaseFilter,
        { $set: builderLeaseSet },
        { new: true, runValidators: true },
      );
      if (!builderLease) return res.status(409).json({ error: "إنشاء آخر يعمل حالياً لهذا المشروع", code: "buildInProgress" });
      if (preparedArtifact && fingerprintSaasBuilderConfig(
        String(builderLease.templateId || ""),
        tier,
        normalizeBuilderConfig(builderLease.config || {}),
      ) !== preparedArtifact.configFingerprint) {
        await SaasBuilderModel.updateOne(
          { projectId: project._id, leaseToken: builderLeaseToken },
          { $set: { status: "prepared" }, $unset: { leaseToken: 1, leaseExpiresAt: 1 } },
        );
        builderLeaseToken = "";
        await removePreparedArtifact(preparedArtifact.artifactId);
        preparedArtifact = null;
        return res.status(409).json({ error: "تغيرت الإعدادات بعد تجهيز الملفات؛ أعد تجهيز المشروع قبل الرفع", code: "preparedArtifactStale" });
      }
      if (builderLease.configFingerprint === fingerprint && builderLease.build?.commitSha) {
        await SaasBuilderModel.updateOne(
          { projectId: project._id, leaseToken: builderLeaseToken },
          { $set: { status: "published" }, $unset: { leaseToken: 1, leaseExpiresAt: 1 } },
        );
        builderLeaseToken = "";
        return res.status(409).json({
          error: "تم نشر هذه الإعدادات بالفعل؛ لم تتم إعادة الإنشاء",
          code: "alreadyPublished",
          build: safeSaasBuilderBuild(builderLease.build),
        });
      }

      const provisioningNow = new Date();
      orderLeaseToken = crypto.randomUUID();
      let provisioning: any = await OrderProvisioningModel.findOne({ orderId: order._id }).lean();
      if (!provisioning) {
        try {
          await OrderProvisioningModel.create({
            orderId: order._id,
            clientId: order.userId,
            status: "ready_for_configuration",
            steps: { project: "ready", repository: "ready", database: "not_configured", deployment: "not_configured" },
          });
        } catch (error: any) { if (error?.code !== 11000) throw error; }
      }
      const previousProvisioningStatus = String(provisioning?.status || "ready_for_configuration");
      provisioning = await OrderProvisioningModel.findOneAndUpdate(
        {
          orderId: order._id,
          $or: [
            { status: { $in: ["queued", "failed", "ready_for_configuration"] } },
            { status: "in_progress", leaseExpiresAt: { $lt: provisioningNow } },
            { status: "in_progress", leaseExpiresAt: null },
            { status: "in_progress", leaseExpiresAt: { $exists: false } },
          ],
        },
        { $set: { status: "in_progress", leaseToken: orderLeaseToken, leaseExpiresAt: new Date(provisioningNow.getTime() + 15 * 60 * 1000) } },
        { new: true },
      ).select("+leaseToken").lean();
      if (!provisioning) {
        await SaasBuilderModel.updateOne(
          { projectId: project._id, leaseToken: builderLeaseToken },
          { $set: { status: priorBuilder.status || "draft" }, $unset: { leaseToken: 1, leaseExpiresAt: 1 } },
        );
        builderLeaseToken = "";
        return res.status(409).json({ error: "إعداد المستودع أو الطلب قيد التنفيذ؛ حاول لاحقاً", code: "provisioningBusy" });
      }
      originalProvisioningStatus = previousProvisioningStatus === "in_progress" ? "ready_for_configuration" : previousProvisioningStatus;

      const assertLease = async () => {
        const renewedUntil = new Date(Date.now() + 15 * 60 * 1000);
        const [builderCurrent, orderCurrent] = await Promise.all([
          SaasBuilderModel.updateOne(
            { projectId: project._id, leaseToken: builderLeaseToken },
            { $set: { leaseExpiresAt: renewedUntil } },
          ),
          OrderProvisioningModel.updateOne(
            { orderId: order._id, leaseToken: orderLeaseToken },
            { $set: { leaseExpiresAt: renewedUntil } },
          ),
        ]);
        if (!builderCurrent.matchedCount || !orderCurrent.matchedCount) throw new Error("تم فقدان قفل الإنشاء قبل اكتمال العملية");
      };
      let generated: any;
      if (preparedArtifact) {
        tempDir = preparedArtifact.outputDir;
        retainPreparedDir = true;
        generated = preparedArtifact.generated;
      } else {
        tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "saas-builder-create-"));
        generated = await (generateProject as any)({
          templateId, config, tier, outputDir: tempDir,
          ...(localBuilderImage(config.logoUrl) ? { logoPath: localBuilderImage(config.logoUrl) } : {}),
          ...(localBuilderImage(config.heroImageUrl) ? { heroPath: localBuilderImage(config.heroImageUrl) } : {}),
          ...(localBuilderImage(config.splashImageUrl) ? { splashPath: localBuilderImage(config.splashImageUrl) } : {}),
        });
      }
      // Prepare private deployment credentials before touching the repository.
      const privateBuilder: any = await SaasBuilderModel.findOne({ projectId }).select("+credentials").lean();
      const integrationEnv: Record<string, string> = {};
      for (const [enabled, channel] of [[config.customerWhatsappRegistration, "whatsapp"], [config.notificationEmail, "email"]] as const) {
        if (!enabled) continue;
        const secret = createProjectIntegrationSecret(channel);
        const apiPath = projectIntegrationApiPath(orderId, channel);
        await ProjectIntegrationModel.create({
          orderId, projectId, type: channel, environment: "production",
          label: "SaaS generated system", keyHash: secret.keyHash, keyPrefix: secret.keyPrefix,
          publicIdentifier: `qrx_${channel}_${crypto.randomUUID()}`, apiBasePath: apiPath,
          documentationPath: projectIntegrationDocsPath(), createdBy: (req.user as any)._id,
        });
        integrationEnv[`QIROX_${channel.toUpperCase()}_API_KEY`] = secret.rawKey;
        integrationEnv[`QIROX_${channel.toUpperCase()}_API_PATH`] = apiPath;
      }
      await assertLease();
      const synced = await replaceRepositoryContents({ token, repositoryUrl, outputDir: tempDir, replaceExisting, assertLease });
      const envRequirements = (generated.envVars || []).map((item: any) => ({
        key: String(item.key || ""),
        required: Boolean(item.required),
        description: String(item.description || ""),
      })).filter((item: any) => item.key && /^[A-Z][A-Z0-9_]{1,63}$/.test(item.key));
      const databaseDescription = databaseSetup.databaseReady
        ? "رابط MongoDB المخصص الذي تم اختباره لهذا المشروع."
        : "اختياري لتجهيز الملفات. أضف رابط MongoDB مخصصًا قبل تشغيل النظام أو نشره.";
      const mongoRequirement = envRequirements.find((item: any) => item.key === "MONGODB_URI");
      if (mongoRequirement) {
        mongoRequirement.required = databaseSetup.databaseReady;
        mongoRequirement.description = databaseDescription;
      } else {
        envRequirements.push({ key: "MONGODB_URI", required: databaseSetup.databaseReady, description: databaseDescription });
      }
      if (!envRequirements.some((item: any) => item.key === "SESSION_SECRET")) {
        envRequirements.push({ key: "SESSION_SECRET", required: true, description: "مفتاح جلسات التطبيق؛ يتم إظهاره مرة واحدة بعد الإنشاء." });
      }
      const completedAt = new Date();
      const safeSummary = {
        ...synced,
        fileCount: Number(generated.fileCount || synced.fileCount),
        buildCommand: String(generated.buildCommand || "").slice(0, 300),
        startCommand: String(generated.startCommand || "").slice(0, 300),
        envRequirements,
        warnings: [
          ...(Array.isArray(generated.warnings) ? generated.warnings.map((item: any) => String(item).slice(0, 300)) : []),
          ...(!databaseSetup.databaseReady ? ["تم تجهيز الملفات دون ربط MongoDB. أضف قاعدة مخصصة قبل تشغيل النظام أو نشره."] : []),
        ],
        databaseReady: databaseSetup.databaseReady,
        completedAt,
      };
      const update = await SaasBuilderModel.updateOne(
        { projectId: project._id, leaseToken: builderLeaseToken },
        { $set: { status: "published", configFingerprint: fingerprint, build: safeSummary }, $unset: { leaseToken: 1, leaseExpiresAt: 1 } },
      );
      if (!update.matchedCount) throw new Error("تعذر تثبيت نتيجة الإنشاء بعد مزامنة المستودع");

      const envVars = buildOneTimeDeploymentEnvelope({
        envRequirements,
        projectId,
        tier,
        config,
        databaseUri,
        access: privateBuilder?.credentials,
        integrationEnv,
      });
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.setHeader("Pragma", "no-cache");
      res.json({
        success: true,
        projectId,
        orderId,
        databaseReady: databaseSetup.databaseReady,
        branch: synced.branch,
        commitSha: synced.commitSha,
        backupRef: synced.backupRef,
        build: safeSaasBuilderBuild(safeSummary),
        secrets: envVars.filter((item: any) => item.value !== undefined),
        envVars,
        deployment: { automatic: false, requiredEnvVars: envRequirements },
      });
    } catch (error: any) {
      sendError(res, error);
    } finally {
      if (tempDir && !retainPreparedDir) await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      if (orderLeaseToken && orderId) {
        await OrderProvisioningModel.updateOne(
          { orderId, leaseToken: orderLeaseToken },
          {
            $set: { status: originalProvisioningStatus || "ready_for_configuration" },
            $unset: { leaseToken: 1, leaseExpiresAt: 1 },
          },
        ).catch(() => {});
      }
      if (builderLeaseToken && projectId) {
        await SaasBuilderModel.updateOne(
          { projectId, leaseToken: builderLeaseToken, status: "building" },
          { $set: { status: preparedArtifact ? "prepared" : "failed" }, $unset: { leaseToken: 1, leaseExpiresAt: 1 } },
        ).catch(() => {});
      }
    }
  });

  app.post(`${base}/partner`, featureGate, async (req, res) => {
    if (!requireAdmin(req, res)) return;
    let partnerLease = "";
    try {
      const context = await resolveOrderContext(req.params.id);
      if (respondContextError(res, context)) return;
      const { order, project, builder } = context as any;
      const tier = saasTierFromOrder(order);
      if (!tier) return res.status(400).json({ error: "لا توجد باقة مؤكدة على الطلب" });
      const config = normalizeBuilderConfig(builder?.config || {});
      const errors = await validateWithTemplates(config, tier);
      if (errors.length) return res.status(400).json({ error: errors[0], errors });
      if (!isHttpsUrl(config.websiteUrl)) return res.status(400).json({ error: "رابط HTTPS عام مطلوب لإضافة النشاط إلى الشركاء" });
      if (!config.businessName || !config.logoUrl || !isSafePublicUrl(config.logoUrl)) {
        return res.status(400).json({ error: "الاسم العام والشعار مطلوبان للنشر" });
      }
      partnerLease = crypto.randomUUID();
      const claimed = await SaasBuilderModel.findOneAndUpdate(
        {
          projectId: project._id,
          $or: [{ leaseExpiresAt: null }, { leaseExpiresAt: { $exists: false } }, { leaseExpiresAt: { $lt: new Date() } }],
        },
        { $set: { leaseToken: partnerLease, leaseExpiresAt: new Date(Date.now() + 5 * 60_000) } },
        { new: true },
      ).lean();
      if (!claimed) {
        partnerLease = "";
        return res.status(409).json({ error: "عملية أخرى تعمل على إعداد هذا المشروع", code: "operationInProgress" });
      }
      const allowedFeatures = saasFeaturesForTier(SAAS_FEATURES as any[], tier, config.extraFeatures);
      const publicFeatures = allowedFeatures
        .map((feature) => String(feature.labelEn || feature.id || "").slice(0, 120));
      const featuresAr = allowedFeatures
        .map((feature) => String(feature.labelAr || feature.id || "").slice(0, 120));
      const published = await publishProjectPartner({
        projectId: project._id,
        config: {
          publicName: config.businessNameEn || config.businessName,
          publicNameAr: config.businessName,
          websiteUrl: config.websiteUrl,
          logoUrl: config.logoUrl,
        },
        features: publicFeatures,
        featuresAr,
        category: String(order.sector || "SaaS").slice(0, 120),
        logoMetadata: {
          logoOriginalUrl: builder.logoOriginalUrl,
          logoProcessingStatus: builder.logoProcessingStatus,
          logoProcessingWarning: builder.logoProcessingWarning,
        },
      });
      await SaasBuilderModel.updateOne(
        { projectId: project._id, leaseToken: partnerLease },
        { $unset: { leaseToken: 1, leaseExpiresAt: 1 } },
      );
      partnerLease = "";
      res.json({ success: true, partnerId: published.partnerId, projectId: String(project._id), websiteUrl: published.websiteUrl });
    } catch (error: any) {
      sendError(res, error);
    } finally {
      if (partnerLease) {
        await SaasBuilderModel.updateOne({ leaseToken: partnerLease }, { $unset: { leaseToken: 1, leaseExpiresAt: 1 } }).catch(() => {});
      }
    }
  });
}