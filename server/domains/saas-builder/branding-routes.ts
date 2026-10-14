import type { Express, Request, Response } from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import net from "net";
import multer from "multer";
import { OrderModel, PartnerModel, ProjectModel, SaasBuilderModel, SandboxProjectModel } from "../../models";
import { SAAS_FEATURES } from "../../../shared/saas-builder";
import { saasFeaturesForTier } from "./model";
import { persistSaasLogo, type LogoResult } from "./logos";

const PROJECT_ROLES = new Set(["admin", "cto"]);
const PROJECT_READ_ROLES = new Set([
  "admin", "cto", "manager", "accountant", "sales_manager", "sales", "developer",
  "designer", "support", "hr", "marketing", "content", "supervisor", "ceo",
]);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1 } });
let saasBuilderIndexPromise: Promise<string> | null = null;

export async function ensureSaasBuilderProjectIndex(): Promise<void> {
  if (!saasBuilderIndexPromise) {
    saasBuilderIndexPromise = SaasBuilderModel.collection.createIndex({ projectId: 1 }, { unique: true });
  }
  try {
    await saasBuilderIndexPromise;
  } catch (error) {
    saasBuilderIndexPromise = null;
    throw error;
  }
}

export type ProjectPublicBranding = {
  publicName: string;
  publicNameAr: string;
  websiteUrl: string;
  logoUrl: string;
};

function requestUser(req: any) {
  const user = req.user as any;
  return { role: String(user?.role || "").toLowerCase(), id: String(user?.id || user?._id || "") };
}

function authenticated(req: Request): boolean {
  return Boolean((req as any).isAuthenticated?.());
}

function isHttpsWebsite(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const ipHost = host.replace(/^\[|\]$/g, "");
    if (url.protocol !== "https:" || url.username || url.password || host === "localhost"
      || host.endsWith(".local") || host.endsWith(".localhost") || host.endsWith(".internal")) return false;
    if (net.isIP(ipHost)) {
      const ipv4 = ipHost.split(".").map(Number);
      if (net.isIPv4(ipHost)) {
        const [a, b] = ipv4;
        if (a === 0 || a === 10 || a === 127 || a >= 224
          || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31
          || a === 192 && b === 168 || a === 100 && b >= 64 && b <= 127
          || a === 192 && b === 0 || a === 198 && (b === 18 || b === 19)) return false;
      } else if (ipHost === "::1" || ipHost.startsWith("fc") || ipHost.startsWith("fd") || ipHost.startsWith("fe80")) return false;
    }
    return true;
  } catch { return false; }
}

function isSafeLogoUrl(value: string): boolean {
  return /^\/uploads\/saas-logos\/[a-f0-9-]{36}(?:-original)?\.(?:png|jpe?g|gif|webp)$/i.test(value)
    || isHttpsWebsite(value);
}

function projectPartnerKey(projectId: unknown): string {
  return `project-branding:${String(projectId)}`;
}

async function withProjectBrandingLease<T>(projectId: unknown, callback: (project: any) => Promise<T>): Promise<T> {
  const token = crypto.randomUUID();
  const now = new Date();
  const project: any = await ProjectModel.findOneAndUpdate(
    {
      _id: projectId,
      $or: [
        { brandingPartnerLeaseExpiresAt: null },
        { brandingPartnerLeaseExpiresAt: { $exists: false } },
        { brandingPartnerLeaseExpiresAt: { $lt: now } },
      ],
    },
    { $set: { brandingPartnerLeaseToken: token, brandingPartnerLeaseExpiresAt: new Date(now.getTime() + 5 * 60_000) } },
    { new: true },
  ).select("+brandingPartnerLeaseToken");
  if (!project) {
    const error: any = new Error("Project branding update is already in progress");
    error.status = 409;
    error.code = "projectBrandingBusy";
    throw error;
  }
  try {
    return await callback(project);
  } finally {
    await ProjectModel.updateOne(
      { _id: projectId, brandingPartnerLeaseToken: token },
      { $unset: { brandingPartnerLeaseToken: 1, brandingPartnerLeaseExpiresAt: 1 } },
    ).catch(() => {});
  }
}

async function currentSystemPartner(project: any, builder: any) {
  const canonicalKey = projectPartnerKey(project._id);
  let partner: any = await PartnerModel.findOne({ relatedService: canonicalKey }).lean();
  if (partner) return partner;
  const legacyKey = `saas-builder:${String(project._id)}`;
  if (builder?.partnerId) {
    partner = await PartnerModel.findOne({ _id: builder.partnerId, relatedService: legacyKey }).lean();
    if (partner) return partner;
  }
  return null;
}

function partnerFields(input: ProjectPublicBranding, extra: {
  features?: string[];
  featuresAr?: string[];
  category?: string;
  logoMetadata?: { logoOriginalUrl?: string; logoProcessingStatus?: string; logoProcessingWarning?: string };
} = {}) {
  return {
    name: input.publicName,
    nameAr: input.publicNameAr,
    logoUrl: input.logoUrl,
    websiteUrl: input.websiteUrl,
    category: String(extra.category || "Business").slice(0, 120),
    isActive: true,
    features: extra.features || [],
    featuresAr: extra.featuresAr || [],
    description: "Business platform built for its organization.",
    descriptionAr: "منصة أعمال مصممة لهذا النشاط التجاري.",
    ...(extra.logoMetadata ? {
      logoOriginalUrl: extra.logoMetadata.logoOriginalUrl || "",
      logoProcessingStatus: extra.logoMetadata.logoProcessingStatus || "unknown",
      logoProcessingWarning: extra.logoMetadata.logoProcessingWarning || "",
      logoProcessedAt: extra.logoMetadata.logoProcessingStatus === "processed" ? new Date() : null,
    } : {}),
  };
}

export async function publishProjectPartner(input: {
  projectId: unknown;
  config: ProjectPublicBranding;
  features?: string[];
  featuresAr?: string[];
  category?: string;
  logoMetadata?: { logoOriginalUrl?: string; logoProcessingStatus?: string; logoProcessingWarning?: string };
}): Promise<{ partnerId: string; websiteUrl: string }> {
  await ensureSaasBuilderProjectIndex();
  const projectId = String(input.projectId);
  return withProjectBrandingLease(projectId, async (project) => {
    const builder: any = await SaasBuilderModel.findOne({ projectId }).lean();
    const key = projectPartnerKey(projectId);
    const legacyKey = `saas-builder:${projectId}`;
    const existing: any = await currentSystemPartner(project, builder);
    let partner: any;
    if (existing && existing.relatedService === legacyKey) {
      partner = await PartnerModel.findOneAndUpdate(
        { _id: existing._id, relatedService: legacyKey },
        { $set: { ...partnerFields(input.config, input), relatedService: key } },
        { new: true },
      ).lean();
    } else {
      partner = await PartnerModel.findOneAndUpdate(
        { relatedService: key },
        {
          $set: { ...partnerFields(input.config, input), relatedService: key },
          $setOnInsert: { sortOrder: 0, serviceIds: [] },
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
      ).lean();
    }
    await ProjectModel.updateOne(
      { _id: projectId, brandingPartnerLeaseToken: project.brandingPartnerLeaseToken },
      {
        $set: {
          "branding.publicName": input.config.publicName,
          "branding.publicNameAr": input.config.publicNameAr,
          "branding.websiteUrl": input.config.websiteUrl,
          "branding.partnerId": partner._id,
        },
      },
    );
    if (builder) await SaasBuilderModel.updateOne({ projectId }, { $set: { partnerId: partner._id } });
    return { partnerId: String(partner._id), websiteUrl: String(partner.websiteUrl || "") };
  });
}

export async function syncProjectBranding(input: {
  projectId: unknown;
  config: ProjectPublicBranding;
}): Promise<void> {
  await ensureSaasBuilderProjectIndex();
  const projectId = String(input.projectId);
  await withProjectBrandingLease(projectId, async (project) => {
    const builder: any = await SaasBuilderModel.findOne({ projectId }).lean();
    if (builder?.status === "building" || (builder?.leaseExpiresAt && new Date(builder.leaseExpiresAt).getTime() > Date.now())) {
      const error: any = new Error("Project build is in progress");
      error.status = 409;
      error.code = "buildInProgress";
      throw error;
    }
    const config = { ...input.config, logoUrl: input.config.logoUrl || project.logoUrl || "" };
    if (builder) {
      const result = await SaasBuilderModel.updateOne(
        {
          projectId,
          $or: [{ leaseExpiresAt: null }, { leaseExpiresAt: { $exists: false } }, { leaseExpiresAt: { $lt: new Date() } }],
        },
        { $set: {
          "config.businessName": config.publicNameAr,
          "config.businessNameEn": config.publicName,
          "config.websiteUrl": config.websiteUrl,
          "config.logoUrl": config.logoUrl,
        } },
      );
      if (!result.matchedCount) {
        const error: any = new Error("Project build is in progress");
        error.status = 409;
        error.code = "buildInProgress";
        throw error;
      }
    }
    await ProjectModel.updateOne(
      { _id: projectId, brandingPartnerLeaseToken: project.brandingPartnerLeaseToken },
      {
        $set: {
          "branding.publicName": config.publicName,
          "branding.publicNameAr": config.publicNameAr,
          "branding.websiteUrl": config.websiteUrl,
          logoUrl: config.logoUrl,
        },
      },
    );
    const partner = await currentSystemPartner(project, builder);
    if (partner) {
      await PartnerModel.updateOne(
        { _id: partner._id, relatedService: partner.relatedService },
        { $set: partnerFields(config, {
          features: partner.features, featuresAr: partner.featuresAr, category: partner.category,
          logoMetadata: {
            logoOriginalUrl: partner.logoOriginalUrl,
            logoProcessingStatus: partner.logoProcessingStatus,
            logoProcessingWarning: partner.logoProcessingWarning,
          },
        }) },
      );
    }
  });
}

export async function saveProjectLogo(input: {
  projectId: unknown;
  orderId: unknown;
  logo: LogoResult;
  addedBy?: unknown;
}): Promise<void> {
  await ensureSaasBuilderProjectIndex();
  const projectId = String(input.projectId);
  await withProjectBrandingLease(projectId, async (project) => {
    const builder: any = await SaasBuilderModel.findOne({ projectId }).lean();
    if (builder?.status === "building" || (builder?.leaseExpiresAt && new Date(builder.leaseExpiresAt).getTime() > Date.now())) {
      const error: any = new Error("Project build is in progress");
      error.status = 409;
      error.code = "buildInProgress";
      throw error;
    }
    if (builder) {
      const result = await SaasBuilderModel.updateOne(
        {
          projectId,
          $or: [{ leaseExpiresAt: null }, { leaseExpiresAt: { $exists: false } }, { leaseExpiresAt: { $lt: new Date() } }],
        },
        {
          $set: {
            "config.logoUrl": input.logo.logoUrl,
            logoOriginalUrl: input.logo.logoOriginalUrl,
            logoProcessingStatus: input.logo.processingStatus,
            logoProcessingWarning: input.logo.warning || "",
          },
        },
      );
      if (!result.matchedCount) {
        const error: any = new Error("Project build is in progress");
        error.status = 409;
        error.code = "buildInProgress";
        throw error;
      }
    }
    await Promise.all([
      ProjectModel.updateOne(
        { _id: projectId, brandingPartnerLeaseToken: project.brandingPartnerLeaseToken },
        {
          $set: { logoUrl: input.logo.logoUrl, logoOriginalUrl: input.logo.logoOriginalUrl },
          $push: { projectFiles: { title: "شعار النشاط", url: input.logo.logoUrl, fileType: "logo", addedBy: input.addedBy } },
        },
      ),
      OrderModel.updateOne({ _id: input.orderId }, { $set: { logoUrl: input.logo.logoUrl } }),
      SandboxProjectModel.updateMany({ sourceProjectId: projectId }, { $set: { logoUrl: input.logo.logoUrl } }),
    ]);
    const partner = await currentSystemPartner(project, builder);
    if (partner) {
      await PartnerModel.updateOne(
        { _id: partner._id, relatedService: partner.relatedService },
        { $set: {
          logoUrl: input.logo.logoUrl,
          logoOriginalUrl: input.logo.logoOriginalUrl,
          logoProcessingStatus: input.logo.processingStatus,
          logoProcessingWarning: input.logo.warning || "",
          logoProcessedAt: input.logo.processingStatus === "processed" ? new Date() : null,
        } },
      );
    }
    if (builder?.partnerId && (!partner || String(builder.partnerId) !== String(partner._id))) {
      await PartnerModel.updateOne(
        { _id: builder.partnerId, relatedService: `saas-builder:${projectId}` },
        { $set: {
          logoUrl: input.logo.logoUrl,
          logoOriginalUrl: input.logo.logoOriginalUrl,
          logoProcessingStatus: input.logo.processingStatus,
          logoProcessingWarning: input.logo.warning || "",
        } },
      );
    }
  });
}

function publicConfig(project: any, builder?: any): ProjectPublicBranding {
  return {
    publicName: String(project.branding?.publicName || builder?.config?.businessNameEn || builder?.config?.businessName || ""),
    publicNameAr: String(project.branding?.publicNameAr || builder?.config?.businessName || ""),
    websiteUrl: String(project.branding?.websiteUrl || builder?.config?.websiteUrl || ""),
    logoUrl: String(project.logoUrl || builder?.config?.logoUrl || ""),
  };
}

function projectPartnerId(project: any, builder?: any): string | null {
  const partnerId = project.branding?.partnerId || builder?.partnerId;
  return partnerId ? String(partnerId) : null;
}

function requireStaff(req: Request, res: Response, mutation = false): boolean {
  if (!authenticated(req)) {
    res.status(401).json({ error: "يجب تسجيل الدخول" });
    return false;
  }
  const { role } = requestUser(req);
  if (!(mutation ? PROJECT_ROLES : PROJECT_READ_ROLES).has(role)) {
    res.status(403).json({ error: "ليست لديك صلاحية لإدارة هوية المشروع" });
    return false;
  }
  return true;
}

function featureGate(_req: Request, res: Response, next: () => void) {
  if (process.env.FEATURE_SAAS_PROJECT_BUILDER === "false") return res.sendStatus(404);
  next();
}

function safeResponseError(res: Response, error: any) {
  if (error?.status === 409) return res.status(409).json({ error: "هناك عملية أخرى تعمل على المشروع حالياً" });
  console.error("[ProjectBranding] request failed", { status: Number(error?.status) || 0, code: String(error?.code || "unknown").slice(0, 40) });
  return res.status(503).json({ error: "تعذر تحديث هوية المشروع حالياً" });
}

export function registerProjectBrandingRoutes(app: Express) {
  const base = "/api/admin/projects/:id/branding";
  app.get(base, featureGate, async (req, res) => {
    if (!requireStaff(req, res)) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.sendStatus(404);
    try {
      const project: any = await ProjectModel.findById(req.params.id).lean();
      if (!project) return res.sendStatus(404);
      const order = project.orderId ? await OrderModel.findById(project.orderId).select("_id").lean() : null;
      if (!order) return res.sendStatus(404);
      await ensureSaasBuilderProjectIndex();
      const builder: any = await SaasBuilderModel.findOne({ projectId: project._id }).lean();
      res.json({
        projectId: String(project._id),
        config: publicConfig(project, builder),
        partnerId: projectPartnerId(project, builder),
      });
    } catch (error: any) {
      safeResponseError(res, error);
    }
  });

  app.put(base, featureGate, async (req, res) => {
    if (!requireStaff(req, res, true)) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.sendStatus(404);
    try {
      const current: any = await ProjectModel.findById(req.params.id).lean();
      if (!current) return res.sendStatus(404);
      const order = current.orderId ? await OrderModel.findById(current.orderId).select("_id").lean() : null;
      if (!order) return res.sendStatus(404);
      const rawConfig = req.body?.config && typeof req.body.config === "object" ? req.body.config : req.body;
      const config: ProjectPublicBranding = {
        publicName: String(rawConfig?.publicName ?? rawConfig?.name ?? "").trim().slice(0, 180),
        publicNameAr: String(rawConfig?.publicNameAr ?? rawConfig?.nameAr ?? "").trim().slice(0, 180),
        websiteUrl: String(rawConfig?.websiteUrl || "").trim().slice(0, 1000),
        logoUrl: String(rawConfig?.logoUrl ?? rawConfig?.logoURL ?? current.logoUrl ?? "").trim().slice(0, 1000),
      };
      if (!config.publicName || !config.publicNameAr) return res.status(400).json({ error: "الاسم العام والاسم العربي مطلوبان" });
      if (config.websiteUrl && !isHttpsWebsite(config.websiteUrl)) return res.status(400).json({ error: "رابط الموقع يجب أن يكون HTTPS عاماً" });
      if (config.logoUrl && !isSafeLogoUrl(config.logoUrl)) return res.status(400).json({ error: "رابط الشعار غير صالح" });
      await syncProjectBranding({ projectId: req.params.id, config });
      const updated: any = await ProjectModel.findById(req.params.id).lean();
      await ensureSaasBuilderProjectIndex();
      const builder: any = await SaasBuilderModel.findOne({ projectId: req.params.id }).lean();
      res.json({
        success: true,
        projectId: String(updated._id),
        config: publicConfig(updated, builder),
        partnerId: projectPartnerId(updated, builder),
      });
    } catch (error: any) {
      safeResponseError(res, error);
    }
  });

  app.post(`${base}/logo`, featureGate, async (req, res) => {
    if (!requireStaff(req, res, true)) return;
    try {
      await new Promise<void>((resolve, reject) => upload.single("logo")(req as any, res as any, (error: any) => error ? reject(error) : resolve()));
      const file = (req as any).file;
      if (!file) return res.status(400).json({ error: "ملف الشعار مطلوب" });
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.sendStatus(404);
      const project: any = await ProjectModel.findById(req.params.id).lean();
      if (!project) return res.sendStatus(404);
      const order: any = project.orderId ? await OrderModel.findById(project.orderId).select("_id").lean() : null;
      if (!order) return res.sendStatus(404);
      const logo = await persistSaasLogo(file.buffer, file.mimetype, ["true", "1", "yes"].includes(String(req.body?.removeBackground).toLowerCase()));
      await saveProjectLogo({ projectId: project._id, orderId: order._id, logo, addedBy: (req.user as any)?._id });
      res.json({ success: true, logoUrl: logo.logoUrl, originalUrl: logo.logoOriginalUrl, processingStatus: logo.processingStatus, processed: logo.processingStatus === "processed", warning: logo.warning || "" });
    } catch (error: any) {
      if (error instanceof multer.MulterError) return res.status(400).json({ error: error.code === "LIMIT_FILE_SIZE" ? "حجم الشعار يتجاوز 8MB" : "تعذر رفع الشعار" });
      if (error?.status === 400) return res.status(400).json({ error: error.message || "بيانات الشعار غير صالحة" });
      safeResponseError(res, error);
    }
  });

  app.post(`${base}/partner`, featureGate, async (req, res) => {
    if (!requireStaff(req, res, true)) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.sendStatus(404);
    try {
      const project: any = await ProjectModel.findById(req.params.id).lean();
      if (!project) return res.sendStatus(404);
      const order: any = project.orderId ? await OrderModel.findById(project.orderId).select("_id sector").lean() : null;
      if (!order) return res.sendStatus(404);
      await ensureSaasBuilderProjectIndex();
      const builder: any = await SaasBuilderModel.findOne({ projectId: project._id }).lean();
      const config = publicConfig(project, builder);
      if (!config.publicName || !config.publicNameAr || !config.logoUrl || !isSafeLogoUrl(config.logoUrl)) {
        return res.status(400).json({ error: "الاسم العام والاسم العربي والشعار مطلوبة للنشر" });
      }
      if (!isHttpsWebsite(config.websiteUrl)) return res.status(400).json({ error: "رابط HTTPS عام مطلوب لإضافة المشروع إلى الشركاء" });
      const permittedFeatures = builder?.tier ? saasFeaturesForTier(SAAS_FEATURES as any[], builder.tier, builder?.config?.extraFeatures) : [];
      const { partnerId, websiteUrl } = await publishProjectPartner({
        projectId: project._id,
        config,
        features: permittedFeatures.map((feature: any) => String(feature.labelEn || feature.id)),
        featuresAr: permittedFeatures.map((feature: any) => String(feature.labelAr || feature.id)),
        category: String(order.sector || project.sector || "Business"),
        ...(builder ? { logoMetadata: {
          logoOriginalUrl: builder.logoOriginalUrl,
          logoProcessingStatus: builder.logoProcessingStatus,
          logoProcessingWarning: builder.logoProcessingWarning,
        } } : {}),
      });
      res.json({ success: true, projectId: String(project._id), partnerId, websiteUrl });
    } catch (error: any) {
      safeResponseError(res, error);
    }
  });
}