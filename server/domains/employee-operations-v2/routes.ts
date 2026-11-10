import type { Express, Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { DeviceTokenModel } from "../../models/auth";
import { EmployeeOperationMessageModel, EmployeeProfileModel, EmployeeWorkContractModel } from "../../models/hr";
import { OrderModel } from "../../models/orders";
import { ProjectFeatureModel, ProjectMemberModel, ProjectModel, TaskModel } from "../../models/projects";
import { ProjectSubscriptionModel } from "../../models/project-subscriptions";
import { QiroxSystemSettingsModel } from "../../models/system";
import { UserModel } from "../../models/user";
import { generateEmployeeWorkContractPdf } from "../../services/pdf.service";
import { revokeUserSockets } from "../../ws";

const ACCESS_ROLES = new Set(["admin", "manager", "hr"]);
const DAY_MS = 24 * 60 * 60 * 1000;

function idOf(value: any): string {
  return String(value?._id ?? value?.id ?? value ?? "");
}

function safeName(user: any): string {
  return String(user?.fullName || user?.name || user?.username || "موظف").trim();
}

function employeePhone(user: any): string {
  return String(user?.whatsappNumber || user?.phone || "").trim();
}

function roleName(role: string): string {
  const labels: Record<string, string> = {
    admin: "مدير النظام", manager: "مدير", hr: "الموارد البشرية",
    sales_manager: "مدير مبيعات", sales: "المبيعات", developer: "مطور",
    designer: "مصمم", support: "الدعم الفني", data_entry: "إدخال البيانات",
    accountant: "محاسب", merchant: "التوصيل", marketing: "التسويق",
    content: "صانع محتوى",
  };
  return labels[role] || role || "موظف";
}

function dateAr(value: Date | string | null | undefined): string {
  if (!value) return "غير محدد";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "غير محدد";
  return date.toLocaleDateString("ar-SA", { timeZone: "Asia/Riyadh", year: "numeric", month: "long", day: "numeric" });
}

function expiryText(subscription: any): string {
  if (subscription.period === "lifetime") return "اشتراك مدى الحياة";
  return dateAr(subscription.expiresAt);
}

export function roleNotice(user: any): string {
  const title = user?.jobTitle || roleName(user?.role);
  return [
    `السلام عليكم ${safeName(user)}،`,
    "",
    "نرحب بك في فريق QIROX Studio. تم تحديث بيانات دورك في النظام.",
    `الدور الوظيفي في النظام: ${roleName(user?.role)}.`,
    `المسمى الوظيفي: ${title}.`,
    "تظهر لك الصلاحيات المرتبطة بدورك الحالي. إذا احتجت توضيحًا حول مهامك أو وصولك، تواصل مع الإدارة.",
    "",
    "نتمنى لك التوفيق،",
    "فريق QIROX Studio",
  ].join("\n");
}

export function terminationNotice(user: any): string {
  return [
    `السلام عليكم ${safeName(user)}،`,
    "",
    `نحيطك علمًا بأنه تم إنهاء علاقة العمل وإيقاف صلاحيات الدخول اعتبارًا من ${dateAr(new Date())}.`,
    "يرجى التنسيق لاستكمال تسليم العهد والملفات والأعمال. وسيتم استكمال أي إجراءات ومستحقات وفق العقد والأنظمة المعمول بها.",
    "",
    "فريق QIROX Studio",
  ].join("\n");
}

export function subscriptionNotice(project: any, recipient: any, recipientType: "client" | "employee"): string {
  const projectName = project.name || "المشروع";
  const expiry = expiryText(project.subscription);
  if (recipientType === "employee") {
    return [
      `تذكير متابعة: اشتراك مشروع «${projectName}» للعميل ${project.client.name} ${project.subscription.period === "lifetime" ? "هو مدى الحياة" : `ينتهي بتاريخ ${expiry}`}.`,
      "يرجى متابعة حالة المشروع والتواصل مع العميل عند الحاجة للتجديد.",
      "QIROX Studio",
    ].join("\n");
  }
  return [
    `السلام عليكم ${safeName(recipient)}،`,
    "",
    project.subscription.period === "lifetime"
      ? `نذكّرك بأن اشتراك مشروع «${projectName}» لدى QIROX Studio هو اشتراك مدى الحياة.`
      : `نحب نذكّرك بأن اشتراك مشروع «${projectName}» لدى QIROX Studio ينتهي بتاريخ ${expiry}.`,
    "إذا رغبت بالتجديد أو بمراجعة احتياج مشروعك، رد على هذه الرسالة وسنساعدك.",
    "",
    "فريق QIROX Studio",
  ].join("\n");
}

async function isFeatureEnabled(): Promise<boolean> {
  try {
    const { container, TOKENS, FeatureFlag } = await import("../../infrastructure");
    const flags = container.tryResolve<{ isEnabled(flag: string): boolean }>(TOKENS.FeatureFlags);
    if (flags?.isEnabled) return flags.isEnabled(FeatureFlag.EMPLOYEE_OPERATIONS_V2);
  } catch {
    // During early boot, fall through to the environment flag.
  }
  return ["true", "1", "yes", "on"].includes(
    String(process.env.FEATURE_EMPLOYEE_OPERATIONS_V2 || "").toLowerCase().trim(),
  );
}

function requireStaff(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated?.()) {
    res.sendStatus(401);
    return;
  }
  if (!ACCESS_ROLES.has(String((req.user as any)?.role || ""))) {
    res.sendStatus(403);
    return;
  }
  next();
}

function requireFeature(handler: (req: Request, res: Response) => Promise<void>) {
  return async (req: Request, res: Response, _next: NextFunction) => {
    if (!(await isFeatureEnabled())) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    try {
      await handler(req, res);
    } catch (error: any) {
      console.error("[employee-operations-v2]", error?.message || error);
      if (!res.headersSent) {
        res.status(500).json({ error: "تعذر إكمال العملية. حاول مرة أخرى." });
      }
    }
  };
}

async function getEmployee(userId: string): Promise<any | null> {
  return UserModel.findById(userId).lean();
}

async function activeEmployee(userId: string): Promise<any | null> {
  const user = await getEmployee(userId);
  if (!user || user.role === "client" || user.employmentStatus === "terminated") return null;
  return user;
}

async function getAssignedEmployees(projectId: string, managerId?: any): Promise<any[]> {
  const [members, tasks, features] = await Promise.all([
    ProjectMemberModel.find({ projectId }).select("userId").lean(),
    TaskModel.find({ projectId, assignedTo: { $ne: null } }).select("assignedTo").lean(),
    ProjectFeatureModel.find({ projectId, assignedTo: { $ne: null } }).select("assignedTo").lean(),
  ]);
  const ids = new Set<string>();
  if (managerId) ids.add(idOf(managerId));
  members.forEach((row: any) => { if (row.userId) ids.add(idOf(row.userId)); });
  tasks.forEach((row: any) => { if (row.assignedTo) ids.add(idOf(row.assignedTo)); });
  features.forEach((row: any) => { if (row.assignedTo) ids.add(idOf(row.assignedTo)); });
  if (!ids.size) return [];
  const users = await UserModel.find({
    _id: { $in: [...ids] },
    role: { $ne: "client" },
    employmentStatus: { $ne: "terminated" },
  }).select("fullName username role jobTitle phone whatsappNumber").lean();
  return users.map((user: any) => ({
    id: idOf(user),
    name: safeName(user),
    role: roleName(user.role),
    hasWhatsApp: Boolean(employeePhone(user)),
  }));
}

function getContractSalaryDescription(contract: any): string {
  const salary = contract.salarySnapshot || {};
  if (salary.salaryType === "fixed") return `${Number(salary.amount).toLocaleString("ar-SA")} ريال سعودي شهريًا`;
  if (salary.salaryType === "hourly") return `${Number(salary.amount).toLocaleString("ar-SA")} ريال سعودي لكل ساعة`;
  return `عمولة بنسبة ${Number(salary.commissionRate)}% وفق سياسة العمولة المعتمدة`;
}

function mapContract(contract: any): any {
  const row = contract?.toObject ? contract.toObject() : contract;
  return {
    id: idOf(row),
    contractNumber: row.contractNumber,
    userId: idOf(row.userId),
    employeeName: row.employeeSnapshot?.fullName || "",
    jobTitle: row.employeeSnapshot?.jobTitle || "",
    status: row.status,
    startDate: row.terms?.startDate || null,
    endDate: row.terms?.endDate || null,
    contractType: row.terms?.contractType || "",
    employerLegalName: row.employerLegalName || "",
    createdAt: row.createdAt,
    sentAt: row.sentAt,
    terminatedAt: row.terminatedAt,
    terminationReason: row.terminationReason || "",
  };
}

function mapMessage(message: any): any {
  const row = message?.toObject ? message.toObject() : message;
  return {
    id: idOf(row),
    kind: row.kind,
    userId: row.userId ? idOf(row.userId) : null,
    projectId: row.projectId ? idOf(row.projectId) : null,
    contractId: row.contractId ? idOf(row.contractId) : null,
    recipientName: row.recipientName,
    message: row.message,
    internalNote: row.internalNote || "",
    status: row.status,
    error: row.error || "",
    sentAt: row.sentAt,
    createdAt: row.createdAt,
  };
}

async function saveAndSendMessage(messageId: string, submittedText?: string): Promise<any> {
  const message = await EmployeeOperationMessageModel.findById(messageId).select("+recipientPhone");
  if (!message) throw Object.assign(new Error("لم يتم العثور على سجل الإرسال."), { statusCode: 404 });
  if (message.status === "sent" || message.status === "sending") {
    throw Object.assign(new Error("تم إرسال هذه الرسالة بالفعل أو يجري إرسالها."), { statusCode: 409 });
  }
  if (typeof submittedText === "string") {
    const trimmed = submittedText.trim();
    if (!trimmed || trimmed.length > 3000) {
      throw Object.assign(new Error("نص الرسالة مطلوب ويجب ألا يتجاوز 3000 حرف."), { statusCode: 400 });
    }
    message.message = trimmed;
  }
  if (!String(message.recipientPhone || "").trim() || message.recipientPhone === "missing") {
    throw Object.assign(new Error("لا يوجد رقم واتساب صالح للمستلم."), { statusCode: 422 });
  }
  const claimed = await EmployeeOperationMessageModel.findOneAndUpdate(
    { _id: message._id, status: { $in: ["draft", "failed"] } },
    { $set: { status: "sending", error: "", message: message.message } },
    { new: true },
  ).select("+recipientPhone");
  if (!claimed) throw Object.assign(new Error("تم بدء هذا الإرسال من نافذة أخرى."), { statusCode: 409 });

  try {
    const { waModule } = await import("../../whatsapp-module");
    if (claimed.kind === "contract") {
      const contract: any = await EmployeeWorkContractModel.findById(claimed.contractId);
      if (!contract) throw new Error("لم يتم العثور على مسودة العقد.");
      if (!String(contract.employerLegalName || "").trim()) {
        throw new Error("أكمل الاسم النظامي لصاحب العمل قبل إرسال العقد.");
      }
      const pdf = await generateEmployeeWorkContractPdf({
        contractNumber: contract.contractNumber,
        employerName: contract.employerName,
        employerLegalName: contract.employerLegalName,
        employerCommercialReg: contract.employerCommercialReg,
        employeeName: contract.employeeSnapshot.fullName,
        employeeNationalId: contract.employeeSnapshot.nationalId,
        employeeRole: roleName(contract.employeeSnapshot.role),
        jobTitle: contract.employeeSnapshot.jobTitle,
        salaryDescription: getContractSalaryDescription(contract),
        startDate: contract.terms.startDate,
        contractType: contract.terms.contractType,
        endDate: contract.terms.endDate,
        workLocation: contract.terms.workLocation,
        weeklyHours: contract.terms.weeklyHours,
        probationDays: contract.terms.probationDays,
        jurisdiction: contract.jurisdiction,
      });
      await waModule.sendDocumentNotification(
        claimed.recipientPhone,
        Buffer.from(pdf),
        `${contract.contractNumber}.pdf`,
        "application/pdf",
        claimed.message,
      );
      contract.status = "sent";
      contract.sentAt = new Date();
      await contract.save();
    } else {
      await waModule.sendNotification(claimed.recipientPhone, claimed.message);
    }
    const sent = await EmployeeOperationMessageModel.findByIdAndUpdate(
      claimed._id,
      { $set: { status: "sent", sentAt: new Date(), error: "" } },
      { new: true },
    );
    return mapMessage(sent);
  } catch (error: any) {
    await EmployeeOperationMessageModel.findByIdAndUpdate(claimed._id, {
      $set: { status: "failed", error: String(error?.message || "WhatsApp send failed").slice(0, 500) },
    });
    throw Object.assign(
      new Error(String(error?.message || "تعذر إرسال الرسالة عبر واتساب.").slice(0, 350)),
      { statusCode: 502 },
    );
  }
}

function errorResponse(res: Response, error: any): void {
  res.status(Number(error?.statusCode) || 500).json({
    error: String(error?.message || "تعذر إكمال العملية."),
  });
}

export function registerEmployeeOperationsV2Routes(app: Express): void {
  app.get(
    "/api/v2/employee-operations/bootstrap",
    requireStaff,
    requireFeature(async (_req, res) => {
      const users = await UserModel.find({
        role: { $ne: "client" },
        employmentStatus: { $ne: "terminated" },
      }).select("fullName username role jobTitle phone whatsappNumber employmentStatus").sort({ fullName: 1 }).lean();
      const profiles = await EmployeeProfileModel.find({
        userId: { $in: users.map((user: any) => user._id) },
      }).select("userId jobTitle salaryType fixedSalary hourlyRate commissionRate nationalId").lean();
      const profileById = new Map(profiles.map((profile: any) => [idOf(profile.userId), profile]));
      const settings: any = await QiroxSystemSettingsModel.findOne().select("companyName companyNameAr commercialReg").lean();
      const employees = users.map((user: any) => {
        const profile: any = profileById.get(idOf(user)) || {};
        return {
          id: idOf(user),
          name: safeName(user),
          role: user.role,
          roleLabel: roleName(user.role),
          jobTitle: profile.jobTitle || user.jobTitle || roleName(user.role),
          nationalId: profile.nationalId || user.nationalId || "",
          hasWhatsApp: Boolean(employeePhone(user)),
          employmentStatus: user.employmentStatus || "active",
          salary: {
            salaryType: profile.salaryType || "fixed",
            fixedSalary: Number(profile.fixedSalary || 0),
            hourlyRate: Number(profile.hourlyRate || 0),
            commissionRate: Number(profile.commissionRate || 0),
          },
        };
      });
      res.json({
        employees,
        brandName: settings?.companyNameAr || settings?.companyName || "QIROX Studio",
        employerCommercialReg: settings?.commercialReg || "",
        legalReviewNotice: "مسودة داخلية فقط؛ لا تُعد استشارة قانونية أو عقدًا نافذًا قبل استكمال البيانات والمراجعة والتوقيع والتوثيق النظامي.",
      });
    }),
  );

  app.get(
    "/api/v2/employee-operations/contracts",
    requireStaff,
    requireFeature(async (_req, res) => {
      const contracts = await EmployeeWorkContractModel.find().sort({ createdAt: -1 }).limit(100).lean();
      res.json({ contracts: contracts.map(mapContract) });
    }),
  );

  app.post(
    "/api/v2/employee-operations/contracts",
    requireStaff,
    requireFeature(async (req, res) => {
      const body = req.body || {};
      const user = await activeEmployee(String(body.employeeId || ""));
      if (!user) return res.status(404).json({ error: "الموظف غير موجود أو تم إيقاف حسابه." });
      const profile: any = await EmployeeProfileModel.findOne({ userId: user._id }).lean();
      if (!profile) return res.status(422).json({ error: "أكمل بيانات الموظف المالية في صفحة الموظفين قبل إنشاء العقد." });
      const salaryType = profile.salaryType || "fixed";
      const salaryAmount = salaryType === "fixed" ? Number(profile.fixedSalary || 0) : Number(profile.hourlyRate || 0);
      const commissionRate = Number(profile.commissionRate || 0);
      if ((salaryType === "commission" && commissionRate <= 0) || (salaryType !== "commission" && salaryAmount <= 0)) {
        return res.status(422).json({ error: "أدخل قيمة راتب أو أجر أو عمولة صحيحة في ملف الموظف قبل إنشاء العقد." });
      }
      const startDate = new Date(body.startDate);
      const endDate = body.endDate ? new Date(body.endDate) : null;
      const contractType = body.contractType === "fixed" ? "fixed" : body.contractType === "indefinite" ? "indefinite" : "";
      const weeklyHours = Number(body.weeklyHours);
      const probationDays = Number(body.probationDays);
      const workLocation = String(body.workLocation || "").trim().slice(0, 180);
      if (!contractType || Number.isNaN(startDate.getTime()) || !workLocation ||
          !Number.isFinite(weeklyHours) || weeklyHours < 1 || weeklyHours > 168 ||
          !Number.isInteger(probationDays) || probationDays < 0 || probationDays > 180 ||
          (contractType === "fixed" && (!endDate || Number.isNaN(endDate.getTime()) || endDate <= startDate))) {
        return res.status(400).json({ error: "راجع نوع العقد وتواريخه ومكان العمل وساعات العمل وفترة التجربة." });
      }
      const settings: any = await QiroxSystemSettingsModel.findOne().select("companyName companyNameAr commercialReg").lean();
      const employeeName = safeName(user);
      const contract = await EmployeeWorkContractModel.create({
        contractNumber: `EMP-${randomUUID().slice(0, 8).toUpperCase()}`,
        userId: user._id,
        status: "draft",
        employerName: settings?.companyNameAr || settings?.companyName || "QIROX Studio",
        employerLegalName: String(body.employerLegalName || "").trim().slice(0, 180),
        employerCommercialReg: String(body.employerCommercialReg || settings?.commercialReg || "").trim().slice(0, 80),
        employeeSnapshot: {
          fullName: employeeName,
          nationalId: String(profile.nationalId || user.nationalId || "").trim(),
          role: String(user.role || ""),
          jobTitle: String(profile.jobTitle || user.jobTitle || roleName(user.role)),
        },
        salarySnapshot: {
          salaryType,
          amount: salaryAmount,
          commissionRate,
        },
        terms: { contractType, startDate, endDate: contractType === "fixed" ? endDate : null, workLocation, weeklyHours, probationDays },
        clauses: { workProductOwnership: true, confidentiality: true, handover: true },
        createdBy: (req.user as any)._id || (req.user as any).id,
      });
      res.status(201).json({ contract: mapContract(contract) });
    }),
  );

  app.get(
    "/api/v2/employee-operations/contracts/:id/pdf",
    requireStaff,
    requireFeature(async (req, res) => {
      const contract: any = await EmployeeWorkContractModel.findById(req.params.id);
      if (!contract) return res.status(404).json({ error: "العقد غير موجود." });
      const pdf = await generateEmployeeWorkContractPdf({
        contractNumber: contract.contractNumber,
        employerName: contract.employerName,
        employerLegalName: contract.employerLegalName,
        employerCommercialReg: contract.employerCommercialReg,
        employeeName: contract.employeeSnapshot.fullName,
        employeeNationalId: contract.employeeSnapshot.nationalId,
        employeeRole: roleName(contract.employeeSnapshot.role),
        jobTitle: contract.employeeSnapshot.jobTitle,
        salaryDescription: getContractSalaryDescription(contract),
        startDate: contract.terms.startDate,
        contractType: contract.terms.contractType,
        endDate: contract.terms.endDate,
        workLocation: contract.terms.workLocation,
        weeklyHours: contract.terms.weeklyHours,
        probationDays: contract.terms.probationDays,
        jurisdiction: contract.jurisdiction,
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${contract.contractNumber}.pdf"`);
      res.setHeader("Cache-Control", "private, no-store");
      res.send(Buffer.from(pdf));
    }),
  );

  app.post(
    "/api/v2/employee-operations/contracts/:id/send",
    requireStaff,
    requireFeature(async (req, res) => {
      const contract: any = await EmployeeWorkContractModel.findById(req.params.id);
      if (!contract || contract.status === "terminated") return res.status(404).json({ error: "العقد غير موجود أو تم إنهاؤه." });
      const employee = await activeEmployee(idOf(contract.userId));
      if (!employee) return res.status(409).json({ error: "لا يمكن إرسال العقد بعد إيقاف حساب الموظف." });
      if (!contract.employerLegalName) return res.status(422).json({ error: "أكمل الاسم النظامي لصاحب العمل قبل الإرسال." });
      const phone = employeePhone(employee);
      if (!phone) return res.status(422).json({ error: "أضف رقم واتساب للموظف أولًا." });
      const message = await EmployeeOperationMessageModel.create({
        kind: "contract",
        userId: employee._id,
        contractId: contract._id,
        recipientName: safeName(employee),
        recipientPhone: phone,
        message: `مرفق مسودة عقد العمل رقم ${contract.contractNumber} للمراجعة. الوثيقة مسودة وتتطلب استكمال البيانات والمراجعة والتوقيع.`,
        status: "draft",
        sentBy: (req.user as any)._id || (req.user as any).id,
      });
      try {
        const sent = await saveAndSendMessage(idOf(message), message.message);
        res.json({ message: sent, contract: mapContract(await EmployeeWorkContractModel.findById(contract._id)) });
      } catch (error: any) {
        errorResponse(res, error);
      }
    }),
  );

  app.get(
    "/api/v2/employee-operations/employees/:id/role-message",
    requireStaff,
    requireFeature(async (req, res) => {
      const user = await activeEmployee(req.params.id);
      if (!user) return res.status(404).json({ error: "الموظف غير موجود أو تم إيقاف حسابه." });
      res.json({ message: roleNotice(user), employeeName: safeName(user), hasWhatsApp: Boolean(employeePhone(user)) });
    }),
  );

  app.post(
    "/api/v2/employee-operations/employees/:id/role-message",
    requireStaff,
    requireFeature(async (req, res) => {
      const user = await activeEmployee(req.params.id);
      if (!user) return res.status(404).json({ error: "الموظف غير موجود أو تم إيقاف حسابه." });
      const phone = employeePhone(user);
      if (!phone) return res.status(422).json({ error: "أضف رقم واتساب للموظف أولًا." });
      const text = String(req.body?.message || roleNotice(user)).trim();
      if (!text || text.length > 3000) return res.status(400).json({ error: "نص الرسالة مطلوب ويجب ألا يتجاوز 3000 حرف." });
      const record = await EmployeeOperationMessageModel.create({
        kind: "role_notice",
        userId: user._id,
        recipientName: safeName(user),
        recipientPhone: phone,
        message: text,
        sentBy: (req.user as any)._id || (req.user as any).id,
      });
      try {
        res.json({ message: await saveAndSendMessage(idOf(record), text) });
      } catch (error: any) {
        errorResponse(res, error);
      }
    }),
  );

  app.post(
    "/api/v2/employee-operations/employees/:id/terminate",
    requireStaff,
    requireFeature(async (req, res) => {
      const actor = req.user as any;
      const employee = await getEmployee(req.params.id);
      if (!employee || employee.role === "client") return res.status(404).json({ error: "الموظف غير موجود." });
      if (idOf(actor) === idOf(employee)) return res.status(400).json({ error: "لا يمكن إنهاء صلاحية حسابك من هذه الصفحة." });
      if (employee.role === "admin" || (actor.role !== "admin" && ["manager", "hr"].includes(employee.role))) {
        return res.status(403).json({ error: "لا تملك صلاحية إنهاء خدمة هذا الحساب." });
      }
      if (employee.employmentStatus === "terminated") {
        return res.status(409).json({ error: "هذا الموظف موقوف بالفعل." });
      }
      const reason = String(req.body?.reason || "").trim().slice(0, 500);
      const now = new Date();
      const updated = await UserModel.findOneAndUpdate(
        { _id: employee._id, employmentStatus: { $ne: "terminated" }, role: { $ne: "client" } },
        { $set: {
          employmentStatus: "terminated",
          employmentTerminatedAt: now,
          employmentTerminationReason: reason,
        } },
        { new: true },
      );
      if (!updated) return res.status(409).json({ error: "تم تغيير حالة الموظف من نافذة أخرى." });

      await EmployeeWorkContractModel.updateMany(
        { userId: employee._id, status: { $ne: "terminated" } },
        { $set: { status: "terminated", terminatedAt: now, terminationReason: reason } },
      );
      await DeviceTokenModel.deleteMany({ userId: employee._id });
      revokeUserSockets(idOf(employee));
      try {
        const { invalidateUserCache } = await import("../../auth");
        invalidateUserCache(idOf(employee));
      } catch {}
      // Delete all persisted Passport sessions for immediate access revocation
      // across server instances while preserving the user and employment record.
      try {
        const mongoose = await import("mongoose");
        const db = mongoose.default.connection.db;
        if (db) {
          await db.collection("sessions").deleteMany({ "session.passport.user": idOf(employee) });
        }
      } catch (error: any) {
        console.error("[employee-operations-v2] session revocation failed:", error?.message || error);
      }
      const draftMessage = await EmployeeOperationMessageModel.create({
        kind: "termination_notice",
        userId: employee._id,
        recipientName: safeName(employee),
        recipientPhone: employeePhone(employee) || "missing",
        message: terminationNotice(employee),
        internalNote: reason,
        status: "draft",
        sentBy: actor._id || actor.id,
      });
      if (!employeePhone(employee)) {
        draftMessage.status = "failed";
        draftMessage.error = "لا يوجد رقم واتساب محفوظ للموظف.";
        await draftMessage.save();
      }
      res.json({
        employeeId: idOf(employee),
        employmentStatus: "terminated",
        terminatedAt: now,
        terminationMessage: mapMessage(draftMessage),
      });
    }),
  );

  app.post(
    "/api/v2/employee-operations/messages/:id/send",
    requireStaff,
    requireFeature(async (req, res) => {
      try {
        const message = await saveAndSendMessage(req.params.id, req.body?.message);
        res.json({ message });
      } catch (error: any) {
        errorResponse(res, error);
      }
    }),
  );

  app.get(
    "/api/v2/employee-operations/subscription-projects",
    requireStaff,
    requireFeature(async (_req, res) => {
      const subscriptions = await ProjectSubscriptionModel.find({ period: { $ne: "lifetime" } }).sort({ expiresAt: 1 }).lean();
      const projectIds = subscriptions.map((sub: any) => sub.projectId);
      const projects = await ProjectModel.find({ _id: { $in: projectIds } }).select("orderId clientId managerId status").lean();
      const projectById = new Map(projects.map((project: any) => [idOf(project), project]));
      const orderIds = projects.map((project: any) => project.orderId).filter(Boolean);
      const orders = await OrderModel.find({ _id: { $in: orderIds } }).select("businessName projectType sector serviceType planTier").lean();
      const orderById = new Map(orders.map((order: any) => [idOf(order), order]));
      const clientIds = [...new Set(subscriptions.map((sub: any) => idOf(sub.clientId)).filter(Boolean))];
      const clients = await UserModel.find({ _id: { $in: clientIds } }).select("fullName username phone whatsappNumber").lean();
      const clientById = new Map(clients.map((client: any) => [idOf(client), client]));
      const output = await Promise.all(subscriptions.map(async (subscription: any) => {
        const project = projectById.get(idOf(subscription.projectId));
        if (!project) return null;
        const order: any = orderById.get(idOf(project.orderId));
        const client: any = clientById.get(idOf(subscription.clientId));
        const assignedEmployees = await getAssignedEmployees(idOf(project), project.managerId);
        const name = String(order?.businessName || order?.projectType || order?.serviceType || `مشروع ${idOf(project).slice(-6)}`);
        return {
          id: idOf(project),
          name,
          status: project.status,
          client: client ? {
            id: idOf(client),
            name: safeName(client),
            hasWhatsApp: Boolean(employeePhone(client)),
          } : null,
          subscription: {
            id: idOf(subscription),
            period: subscription.period,
            planTier: subscription.planTier || "",
            status: subscription.status,
            expiresAt: subscription.expiresAt,
            remainingDays: subscription.expiresAt ? Math.ceil((new Date(subscription.expiresAt).getTime() - Date.now()) / DAY_MS) : null,
          },
          assignedEmployees,
        };
      }));
      res.json({ projects: output.filter(Boolean) });
    }),
  );

  app.post(
    "/api/v2/employee-operations/subscription-reminders",
    requireStaff,
    requireFeature(async (req, res) => {
      const projectId = String(req.body?.projectId || "");
      const targetType = req.body?.targetType === "employee" ? "employee" : req.body?.targetType === "client" ? "client" : "";
      const targetId = String(req.body?.targetId || "");
      if (!projectId || !targetId || !targetType) return res.status(400).json({ error: "اختر المشروع والمستلم." });
      const subscription: any = await ProjectSubscriptionModel.findOne({ projectId, period: { $ne: "lifetime" } }).lean();
      const project: any = await ProjectModel.findById(projectId).select("orderId clientId managerId").lean();
      if (!subscription || !project) return res.status(404).json({ error: "لا يوجد اشتراك قابل للتذكير لهذا المشروع." });
      const order: any = await OrderModel.findById(project.orderId).select("businessName projectType serviceType").lean();
      const client: any = await UserModel.findById(subscription.clientId).select("fullName username phone whatsappNumber").lean();
      if (!client) return res.status(404).json({ error: "لم يتم العثور على العميل." });
      let recipient: any;
      if (targetType === "client") {
        if (idOf(client) !== targetId) return res.status(403).json({ error: "المستلم لا يطابق عميل المشروع." });
        recipient = client;
      } else {
        const assigned = await getAssignedEmployees(projectId, project.managerId);
        if (!assigned.some((person) => person.id === targetId)) {
          return res.status(403).json({ error: "يمكن إرسال تذكير الموظف لموظف معيّن في المشروع فقط." });
        }
        recipient = await activeEmployee(targetId);
        if (!recipient) return res.status(404).json({ error: "الموظف المحدد غير متاح." });
      }
      const phone = employeePhone(recipient);
      if (!phone) return res.status(422).json({ error: "لا يوجد رقم واتساب للمستلم المحدد." });
      const projectContext = {
        name: String(order?.businessName || order?.projectType || order?.serviceType || `مشروع ${idOf(project).slice(-6)}`),
        client: { name: safeName(client) },
        subscription,
      };
      const generatedText = subscriptionNotice(projectContext, recipient, targetType);
      const messageText = String(req.body?.message || generatedText).trim();
      if (!messageText || messageText.length > 3000) {
        return res.status(400).json({ error: "نص التذكير مطلوب ويجب ألا يتجاوز 3000 حرف." });
      }
      const record = await EmployeeOperationMessageModel.create({
        kind: "subscription_reminder",
        userId: targetType === "employee" ? recipient._id : null,
        projectId: project._id,
        recipientName: safeName(recipient),
        recipientPhone: phone,
        message: messageText,
        sentBy: (req.user as any)._id || (req.user as any).id,
      });
      try {
        res.json({ message: await saveAndSendMessage(idOf(record), messageText) });
      } catch (error: any) {
        errorResponse(res, error);
      }
    }),
  );

  app.get(
    "/api/v2/employee-operations/messages",
    requireStaff,
    requireFeature(async (_req, res) => {
      const messages = await EmployeeOperationMessageModel.find()
        .select("-recipientPhone")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();
      res.json({ messages: messages.map(mapMessage) });
    }),
  );
}
