import type { Express, Request } from "express";
import mongoose from "mongoose";
import { DraftProjectModel, OrderModel, ProjectModel, UserModel } from "../../models";
import { ALL_EMPLOYEE_MAIL_ROLES } from "../../mail-access";

type ApprovedOrderProvisioner = (order: any, req: Request) => Promise<{
  project?: any;
  projectCreated?: boolean;
  pending?: boolean;
}>;

// Draft project access is intentionally separate from active customer-project
// permissions. Staff can create/read their own drafts; only the CTO can assign,
// edit, or delete records.
const STAFF_ROLES = new Set([
  ...ALL_EMPLOYEE_MAIL_ROLES.filter((role) => role !== "investor"),
  "owner",
]);
const DRAFT_STATUSES = new Set(["draft", "planning", "ready"]);
const TEXT_LIMITS: Record<string, number> = {
  title: 200,
  summary: 3000,
  projectType: 120,
  sector: 120,
  projectConcept: 10000,
  targetAudience: 4000,
  mainFeatures: 10000,
  techStack: 2000,
  framework: 500,
  language: 500,
  database: 1000,
  databaseDesign: 5000,
  hosting: 1000,
  deploymentStrategy: 3000,
  domain: 500,
  githubRepo: 1000,
  stagingUrl: 1000,
  productionUrl: 1000,
  notes: 10000,
};

function getPrincipal(req: any) {
  const user = req.user as any;
  return {
    id: String(user?.id || user?._id || ""),
    role: String(user?.role || ""),
  };
}

function requireStaff(req: any, res: any) {
  if (!req.isAuthenticated?.()) {
    res.sendStatus(401);
    return null;
  }
  const principal = getPrincipal(req);
  if (!principal.id || !STAFF_ROLES.has(principal.role)) {
    res.sendStatus(403);
    return null;
  }
  return principal;
}

function requireCto(req: any, res: any) {
  const principal = requireStaff(req, res);
  if (!principal) return null;
  if (principal.role !== "cto") {
    res.sendStatus(403);
    return null;
  }
  return principal;
}

function normalizeProjectFields(body: any) {
  const fields: Record<string, string> = {};
  for (const [key, maxLength] of Object.entries(TEXT_LIMITS)) {
    if (body?.[key] !== undefined) {
      fields[key] = String(body[key] ?? "").trim().slice(0, maxLength);
    }
  }
  if (body?.status !== undefined && DRAFT_STATUSES.has(String(body.status))) {
    fields.status = String(body.status);
  }
  return fields;
}

async function resolveVisibleTo(raw: unknown): Promise<string[] | null> {
  if (!Array.isArray(raw)) return null;
  const ids = [...new Set(raw.map((id) => String(id)))];
  if (ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) return null;
  if (!ids.length) return [];
  const matchingUsers = await UserModel.find({
    _id: { $in: ids },
    role: { $in: [...STAFF_ROLES] },
  }).select("_id").lean();
  if (matchingUsers.length !== ids.length) return null;
  return ids;
}

function projectResponse(project: any) {
  return project?.toJSON ? project.toJSON() : project;
}

export function isApprovedOrderForDraftPromotion(order: any): boolean {
  return order?.paymentStatus === "approved" || order?.status === "approved";
}

export function registerDraftProjectRoutes(app: Express, provisionApprovedOrder: ApprovedOrderProvisioner) {
  // Default-on, additive feature flag; setting this to "false" hides its API.
  app.use("/api/draft-projects", (_req, res, next) => {
    if (process.env.FEATURE_DRAFT_PROJECTS === "false") return res.sendStatus(404);
    next();
  });

  app.get("/api/draft-projects", async (req, res) => {
    const principal = requireStaff(req, res);
    if (!principal) return;
    try {
      const query = principal.role === "cto"
        ? {}
        : { $or: [{ visibleTo: principal.id }, { createdBy: principal.id }] };
      const projects = await DraftProjectModel.find(query).sort({ updatedAt: -1 });
      res.json(projects.map(projectResponse));
    } catch (error: any) {
      console.error("[DraftProjects] list failed:", error?.message || error);
      res.status(500).json({ error: "تعذر تحميل المشاريع المسودة" });
    }
  });

  app.get("/api/draft-projects/employee-directory", async (req, res) => {
    const principal = requireCto(req, res);
    if (!principal) return;
    try {
      const employees = await UserModel.find({ role: { $in: [...STAFF_ROLES] } })
        .select("_id fullName username role")
        .sort({ fullName: 1 })
        .lean() as any[];
      res.json(employees.map((employee) => ({
        id: String(employee._id),
        fullName: employee.fullName || employee.username || "",
        username: employee.username || "",
        role: employee.role || "",
      })));
    } catch (error: any) {
      console.error("[DraftProjects] employee directory failed:", error?.message || error);
      res.status(500).json({ error: "تعذر تحميل قائمة الموظفين" });
    }
  });

  app.get("/api/draft-projects/promotable-orders", async (req, res) => {
    const principal = requireCto(req, res);
    if (!principal) return;
    const draftId = String(req.query.draftId || "");
    if (draftId && !mongoose.Types.ObjectId.isValid(draftId)) return res.status(400).json({ error: "معرّف المسودة غير صالح" });
    try {
      const draftObjectId = draftId ? new mongoose.Types.ObjectId(draftId) : null;
      if (draftObjectId && !await DraftProjectModel.exists({ _id: draftObjectId })) return res.sendStatus(404);
      const orders = await OrderModel.find({
        $and: [
          { $or: [{ paymentStatus: "approved" }, { status: "approved" }] },
          {
            $or: [
              { draftProjectId: null },
              { draftProjectId: { $exists: false } },
              ...(draftObjectId ? [{ draftProjectId: draftObjectId }] : []),
            ],
          },
        ],
      })
        .select("_id orderNumber businessName serviceType projectType status createdAt draftProjectId")
        .sort({ createdAt: -1 })
        .limit(200)
        .lean() as any[];
      const projectIds = orders.map((order) => order._id);
      const projects = await ProjectModel.find({ orderId: { $in: projectIds } }).select("_id orderId").lean() as any[];
      const projectsByOrder = new Map(projects.map((project) => [String(project.orderId), String(project._id)]));
      res.json(orders.map((order) => ({
        id: String(order._id),
        orderNumber: String(order.orderNumber || ""),
        businessName: String(order.businessName || ""),
        serviceType: String(order.serviceType || order.projectType || ""),
        status: String(order.status || ""),
        createdAt: order.createdAt || null,
        projectId: projectsByOrder.get(String(order._id)) || null,
      })));
    } catch (error: any) {
      console.error("[DraftProjects] eligible order list failed:", error?.message || error);
      res.status(500).json({ error: "تعذر تحميل الطلبات المعتمدة" });
    }
  });

  app.get("/api/draft-projects/:id", async (req, res) => {
    const principal = requireStaff(req, res);
    if (!principal) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.sendStatus(404);
    try {
      const query: any = { _id: req.params.id };
      if (principal.role !== "cto") {
        query.$or = [{ visibleTo: principal.id }, { createdBy: principal.id }];
      }
      const project = await DraftProjectModel.findOne(query);
      if (!project) return res.sendStatus(404);
      res.json(projectResponse(project));
    } catch (error: any) {
      console.error("[DraftProjects] read failed:", error?.message || error);
      res.status(500).json({ error: "تعذر تحميل المشروع المسودة" });
    }
  });

  app.post("/api/draft-projects", async (req, res) => {
    const principal = requireStaff(req, res);
    if (!principal) return;
    const fields = normalizeProjectFields(req.body);
    if (!fields.title) return res.status(400).json({ error: "اسم المشروع مطلوب" });
    if (req.body?.status !== undefined && !DRAFT_STATUSES.has(String(req.body.status))) {
      return res.status(400).json({ error: "حالة المشروع غير صالحة" });
    }
    try {
      const visibleTo = principal.role === "cto"
        ? await resolveVisibleTo(req.body?.visibleTo)
        : [];
      if (!visibleTo) return res.status(400).json({ error: "قائمة الموظفين المحددة غير صالحة" });
      const project = await DraftProjectModel.create({
        ...fields,
        visibleTo,
        createdBy: principal.id,
        updatedBy: principal.id,
      });
      res.status(201).json(projectResponse(project));
    } catch (error: any) {
      console.error("[DraftProjects] create failed:", error?.message || error);
      res.status(500).json({ error: "تعذر حفظ المشروع المسودة" });
    }
  });

  app.patch("/api/draft-projects/:id", async (req, res) => {
    const principal = requireCto(req, res);
    if (!principal) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.sendStatus(404);
    const fields = normalizeProjectFields(req.body);
    if (req.body?.title !== undefined && !fields.title) {
      return res.status(400).json({ error: "اسم المشروع مطلوب" });
    }
    if (req.body?.status !== undefined && !DRAFT_STATUSES.has(String(req.body.status))) {
      return res.status(400).json({ error: "حالة المشروع غير صالحة" });
    }
    try {
      if (req.body?.visibleTo !== undefined) {
        const visibleTo = await resolveVisibleTo(req.body.visibleTo);
        if (!visibleTo) return res.status(400).json({ error: "قائمة الموظفين المحددة غير صالحة" });
        (fields as any).visibleTo = visibleTo;
      }
      const project = await DraftProjectModel.findByIdAndUpdate(
        req.params.id,
        { $set: { ...fields, updatedBy: principal.id } },
        { new: true, runValidators: true },
      );
      if (!project) return res.sendStatus(404);
      res.json(projectResponse(project));
    } catch (error: any) {
      console.error("[DraftProjects] update failed:", error?.message || error);
      res.status(500).json({ error: "تعذر تحديث المشروع المسودة" });
    }
  });

  app.delete("/api/draft-projects/:id", async (req, res) => {
    const principal = requireCto(req, res);
    if (!principal) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.sendStatus(404);
    try {
      const existing = await DraftProjectModel.findById(req.params.id).select("promotedOrderId");
      if (!existing) return res.sendStatus(404);
      if (existing.promotedOrderId) {
        return res.status(409).json({ error: "لا يمكن حذف مسودة مرتبطة بمشروع عميل نشط" });
      }
      const project = await DraftProjectModel.findByIdAndDelete(req.params.id);
      if (!project) return res.sendStatus(404);
      res.json({ ok: true });
    } catch (error: any) {
      console.error("[DraftProjects] delete failed:", error?.message || error);
      res.status(500).json({ error: "تعذر حذف المشروع المسودة" });
    }
  });

  app.post("/api/draft-projects/:id/promote", async (req, res) => {
    const principal = requireCto(req, res);
    if (!principal) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(String(req.body?.orderId || ""))) {
      return res.status(400).json({ error: "بيانات التحويل غير صالحة" });
    }
    try {
      const draftId = new mongoose.Types.ObjectId(req.params.id);
      const orderId = new mongoose.Types.ObjectId(String(req.body.orderId));
      const draft: any = await DraftProjectModel.findById(draftId);
      if (!draft) return res.sendStatus(404);
      if (draft.promotedProjectId) {
        if (String(draft.promotedOrderId) !== String(orderId)) {
          return res.status(409).json({ error: "هذه المسودة مرتبطة بالفعل بطلب آخر" });
        }
        return res.json({
          success: true,
          alreadyPromoted: true,
          draft: projectResponse(draft),
          projectId: String(draft.promotedProjectId),
          orderId: String(draft.promotedOrderId),
        });
      }
      if (draft.status !== "ready") {
        return res.status(409).json({ error: "يجب أن تكون المسودة جاهزة للمراجعة قبل تحويلها" });
      }

      const order: any = await OrderModel.findById(orderId);
      if (!order || !isApprovedOrderForDraftPromotion(order)) {
        return res.status(409).json({ error: "اختر طلباً معتمداً أو مدفوعاً قبل إنشاء مشروع العميل" });
      }
      const existingProject: any = await ProjectModel.findOne({ orderId }).select("_id orderId draftProjectId");
      if (existingProject?.draftProjectId && String(existingProject.draftProjectId) !== String(draftId)) {
        return res.status(409).json({ error: "مشروع العميل مرتبط بالفعل بمسودة أخرى" });
      }
      const reservedDraft: any = await DraftProjectModel.findOneAndUpdate(
        {
          _id: draftId,
          status: "ready",
          $or: [
            { promotedOrderId: null },
            { promotedOrderId: { $exists: false } },
            { promotedOrderId: orderId },
          ],
        },
        { $set: { promotedOrderId: orderId } },
        { new: true },
      );
      if (!reservedDraft) {
        const current: any = await DraftProjectModel.findById(draftId).select("promotedOrderId promotedProjectId");
        if (current?.promotedProjectId) {
          return res.status(409).json({ error: "المسودة مرتبطة بالفعل بمشروع عميل" });
        }
        if (current?.promotedOrderId && String(current.promotedOrderId) !== String(orderId)) {
          return res.status(409).json({ error: "هذه المسودة مرتبطة بالفعل بطلب آخر" });
        }
        return res.status(409).json({ error: "تعذر بدء التحويل؛ حدّث الصفحة وحاول مرة أخرى" });
      }

      const claimedOrder: any = await OrderModel.findOneAndUpdate(
        {
          _id: orderId,
          $and: [
            { $or: [{ paymentStatus: "approved" }, { status: "approved" }] },
            { $or: [{ draftProjectId: null }, { draftProjectId: { $exists: false } }, { draftProjectId: draftId }] },
          ],
        },
        { $set: { draftProjectId: draftId } },
        { new: true },
      );
      if (!claimedOrder) {
        const currentOrder: any = await OrderModel.findById(orderId).select("draftProjectId paymentStatus status");
        if (currentOrder?.draftProjectId && String(currentOrder.draftProjectId) !== String(draftId)) {
          await DraftProjectModel.updateOne(
            { _id: draftId, promotedOrderId: orderId, promotedProjectId: null },
            { $unset: { promotedOrderId: 1 } },
          );
          return res.status(409).json({ error: "هذا الطلب مرتبط بالفعل بمسودة أخرى" });
        }
        await DraftProjectModel.updateOne(
          { _id: draftId, promotedOrderId: orderId, promotedProjectId: null },
          { $unset: { promotedOrderId: 1 } },
        );
        return res.status(409).json({ error: "تعذر تثبيت الطلب المعتمد للمسودة" });
      }

      // Existing client projects only need an additive draft link. Re-running
      // full order provisioning here could change GitHub repository settings.
      const projectForOrder = existingProject
        || await ProjectModel.findOne({ orderId }).select("_id orderId status draftProjectId");
      if (projectForOrder?.draftProjectId && String(projectForOrder.draftProjectId) !== String(draftId)) {
        await Promise.all([
          OrderModel.updateOne({ _id: orderId, draftProjectId: draftId }, { $unset: { draftProjectId: 1 } }),
          DraftProjectModel.updateOne(
            { _id: draftId, promotedOrderId: orderId, promotedProjectId: null },
            { $unset: { promotedOrderId: 1 } },
          ),
        ]);
        return res.status(409).json({ error: "مشروع العميل مرتبط بالفعل بمسودة أخرى" });
      }
      const result = projectForOrder
        ? { project: projectForOrder, projectCreated: false, pending: false }
        : await provisionApprovedOrder(claimedOrder, req);
      if (result.pending || !result.project) {
        return res.status(202).json({
          pending: true,
          message: "إعداد مشروع العميل جارٍ. أعد المحاولة بعد اكتمال التجهيز.",
          draft: projectResponse(reservedDraft),
          orderId: String(orderId),
        });
      }

      const projectId = String(result.project._id || result.project.id || "");
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(503).json({ error: "تم إنشاء الطلب، لكن تعذر التحقق من مشروع العميل" });
      }
      const linkedProject: any = await ProjectModel.findOneAndUpdate(
        {
          _id: projectId,
          orderId,
          $or: [
            { draftProjectId: null },
            { draftProjectId: { $exists: false } },
            { draftProjectId: draftId },
          ],
        },
        { $set: { draftProjectId: draftId } },
        { new: true },
      ).select("_id orderId status draftProjectId");
      if (!linkedProject) {
        await Promise.all([
          OrderModel.updateOne({ _id: orderId, draftProjectId: draftId }, { $unset: { draftProjectId: 1 } }),
          DraftProjectModel.updateOne(
            { _id: draftId, promotedOrderId: orderId, promotedProjectId: null },
            { $unset: { promotedOrderId: 1 } },
          ),
        ]);
        return res.status(409).json({ error: "المشروع مرتبط بالفعل بمسودة أخرى" });
      }
      const promotedDraft: any = await DraftProjectModel.findOneAndUpdate(
        { _id: draftId, promotedOrderId: orderId, $or: [{ promotedProjectId: null }, { promotedProjectId: { $exists: false } }] },
        {
          $set: {
            promotedProjectId: linkedProject._id,
            promotedAt: new Date(),
            promotedBy: principal.id,
          },
        },
        { new: true },
      );
      if (!promotedDraft) {
        return res.status(409).json({ error: "تم تجهيز المشروع؛ حدّث الصفحة لمزامنة ارتباط المسودة" });
      }
      res.json({
        success: true,
        alreadyPromoted: false,
        draft: projectResponse(promotedDraft),
        projectId: String(linkedProject._id),
        orderId: String(orderId),
        orderNumber: String(claimedOrder.orderNumber || ""),
        projectCreated: Boolean(result.projectCreated),
      });
    } catch (error: any) {
      console.error("[DraftProjects] promotion failed:", error?.message || error);
      res.status(503).json({ error: "تعذر تحويل المسودة إلى مشروع عميل حالياً. أعد المحاولة لاحقاً." });
    }
  });
}