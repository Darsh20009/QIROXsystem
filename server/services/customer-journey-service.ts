// ── Customer Journey V2 — Aggregation Service ─────────────────────────────────
// Sprint B — Additive only. New module, imported by the new /api/v2/customer
// namespace (server/routes/customer-v2.ts). Nothing here is imported by, or
// changes the behavior of, any existing route or model.
//
// Purpose: compute a real, database-backed view of a customer's lifecycle
// (the 11-step journey already modelled on the client in
// client/src/features/customer-journey/types.ts) instead of the purely
// client-side/sessionStorage state the journey UI currently derives on its
// own. This service is read-only — it never writes journey state, it derives
// it fresh from existing collections (Orders, Projects, Invoices,
// Quotations, CRM leads) on every call.
//
// Kept intentionally framework-agnostic (no req/res) so it can be reused by
// the /api/v2/customer routes, by an admin/CRM view, or by a future
// scheduled job without modification.

// ── Journey step vocabulary ────────────────────────────────────────────────────
// Mirrors client/src/features/customer-journey/types.ts JOURNEY_STEP_ID.
// Duplicated intentionally: this is a server module and must not import from
// client/src. Keep the two lists in sync if the client step list changes.

export const JOURNEY_STEP_ID = {
  WELCOME:           "welcome",
  DISCOVER_SERVICES: "discover_services",
  CONFIGURE_PROJECT: "configure_project",
  REVIEW_PROPOSAL:   "review_proposal",
  PAYMENT:           "payment",
  PROJECT_KICKOFF:   "project_kickoff",
  PRODUCTION:        "production",
  CLIENT_REVIEW:     "client_review",
  DELIVERY:          "delivery",
  SUPPORT:           "support",
  LOYALTY:           "loyalty",
} as const;

export type JourneyStepId = typeof JOURNEY_STEP_ID[keyof typeof JOURNEY_STEP_ID];

export type JourneyStepStatus = "locked" | "available" | "in_progress" | "completed" | "skipped";

export interface JourneyStepState {
  id: JourneyStepId;
  order: number;
  status: JourneyStepStatus;
  startedAt?: Date | null;
  completedAt?: Date | null;
  meta: Record<string, unknown>;
}

export interface CustomerJourneyState {
  version: 1;
  userId: string;
  activeStepId: JourneyStepId;
  steps: Record<JourneyStepId, JourneyStepState>;
  progressPercent: number;
  isComplete: boolean;
  updatedAt: Date;
  source: "database"; // distinguishes this from the client's local-only mock state
}

// Ordered step list — order drives activeStepId resolution ("first step that
// is not completed/skipped").
const STEP_ORDER: JourneyStepId[] = [
  JOURNEY_STEP_ID.WELCOME,
  JOURNEY_STEP_ID.DISCOVER_SERVICES,
  JOURNEY_STEP_ID.CONFIGURE_PROJECT,
  JOURNEY_STEP_ID.REVIEW_PROPOSAL,
  JOURNEY_STEP_ID.PAYMENT,
  JOURNEY_STEP_ID.PROJECT_KICKOFF,
  JOURNEY_STEP_ID.PRODUCTION,
  JOURNEY_STEP_ID.CLIENT_REVIEW,
  JOURNEY_STEP_ID.DELIVERY,
  JOURNEY_STEP_ID.SUPPORT,
  JOURNEY_STEP_ID.LOYALTY,
];

// Project lifecycle order, per server/models/projects.ts projectSchema.status enum.
const PROJECT_STATUS_ORDER = [
  "new", "under_study", "pending_payment", "in_progress", "testing", "review", "delivery", "closed",
] as const;

function projectStatusIndex(status: string | undefined): number {
  const i = PROJECT_STATUS_ORDER.indexOf((status ?? "new") as any);
  return i === -1 ? 0 : i;
}

// ── Raw inputs the aggregator needs ────────────────────────────────────────────
// Loaded once per call via a handful of lean() queries — cheap, index-backed
// (userId/clientId are already indexed on these collections).

interface JourneyInputs {
  user: any;
  crmLead: any | null;
  orders: any[];
  quotations: any[];
  invoices: any[];
  projects: any[];
  supportTickets: any[];
}

async function loadJourneyInputs(userId: string): Promise<JourneyInputs> {
  const {
    UserModel, OrderModel, QuotationModel, InvoiceModel, ProjectModel, CrmLeadModel, SupportTicketModel,
  } = await import("../models");

  const uid = String(userId);

  const [user, orders, quotations, invoices, projects, supportTickets] = await Promise.all([
    UserModel.findById(uid).select("email fullName createdAt role").lean(),
    OrderModel.find({ userId: uid }).sort({ createdAt: 1 }).lean(),
    QuotationModel.find({ userId: uid }).sort({ createdAt: 1 }).lean(),
    InvoiceModel.find({ userId: uid }).sort({ createdAt: 1 }).lean(),
    ProjectModel.find({ clientId: uid }).sort({ createdAt: 1 }).lean(),
    SupportTicketModel.find({ userId: uid }).sort({ createdAt: 1 }).lean(),
  ]);

  // CRM lead linkage is best-effort and by email — CrmLead is not always
  // created for a self-registered customer, so a miss here is expected and
  // does not affect any other stage of the journey.
  let crmLead: any | null = null;
  const email = (user as any)?.email;
  if (email) {
    crmLead = await CrmLeadModel.findOne({ email: String(email).toLowerCase().trim() })
      .sort({ createdAt: -1 })
      .lean();
  }

  return { user, crmLead, orders, quotations, invoices, projects, supportTickets };
}

// ── Stage resolvers ────────────────────────────────────────────────────────────
// Each resolver derives ONE step's status + linked-record meta from the raw
// inputs. Kept as small pure functions so the overall state machine (locking,
// activeStepId, progress) stays simple and testable.

function resolveWelcome(inputs: JourneyInputs): Pick<JourneyStepState, "status" | "startedAt" | "completedAt" | "meta"> {
  const createdAt = inputs.user?.createdAt ?? null;
  return { status: "completed", startedAt: createdAt, completedAt: createdAt, meta: {} };
}

function resolveDiscoverServices(inputs: JourneyInputs): Pick<JourneyStepState, "status" | "startedAt" | "completedAt" | "meta"> {
  const hasSignal = inputs.orders.length > 0 || inputs.quotations.length > 0 || !!inputs.crmLead;
  if (hasSignal) {
    const first = inputs.quotations[0] ?? inputs.orders[0];
    return {
      status: "completed",
      startedAt: first?.createdAt ?? null,
      completedAt: first?.createdAt ?? null,
      meta: { leadStage: inputs.crmLead?.stage ?? null },
    };
  }
  return { status: "available", startedAt: null, completedAt: null, meta: {} };
}

function resolveConfigureProject(inputs: JourneyInputs, prevCompleted: boolean): Pick<JourneyStepState, "status" | "startedAt" | "completedAt" | "meta"> {
  if (inputs.orders.length > 0) {
    const first = inputs.orders[0];
    return {
      status: "completed",
      startedAt: first.createdAt ?? null,
      completedAt: first.createdAt ?? null,
      meta: { orderId: String(first._id), orderCount: inputs.orders.length },
    };
  }
  return { status: prevCompleted ? "available" : "locked", startedAt: null, completedAt: null, meta: {} };
}

function resolveReviewProposal(inputs: JourneyInputs, prevCompleted: boolean): Pick<JourneyStepState, "status" | "startedAt" | "completedAt" | "meta"> {
  const decided = inputs.quotations.filter((q: any) => q.status === "accepted" || q.status === "rejected");
  const accepted = inputs.quotations.find((q: any) => q.status === "accepted");
  // A customer who placed an order directly (no separate quotation flow)
  // has implicitly passed proposal review — the order itself is the proposal.
  if (accepted || (inputs.orders.length > 0 && inputs.quotations.length === 0)) {
    const ref = accepted ?? inputs.orders[0];
    return {
      status: "completed",
      startedAt: ref?.createdAt ?? null,
      completedAt: ref?.createdAt ?? null,
      meta: { quotationId: accepted ? String(accepted._id) : null },
    };
  }
  if (decided.length > 0) {
    // Only rejected quotations on file — proposal reviewed but not accepted yet.
    return { status: "in_progress", startedAt: decided[0].createdAt ?? null, completedAt: null, meta: {} };
  }
  return { status: prevCompleted ? "available" : "locked", startedAt: null, completedAt: null, meta: {} };
}

function resolvePayment(inputs: JourneyInputs, prevCompleted: boolean): Pick<JourneyStepState, "status" | "startedAt" | "completedAt" | "meta"> {
  const paidInvoices = inputs.invoices.filter((i: any) => i.status === "paid");
  const paidOrder = inputs.orders.find((o: any) => ["approved", "in_progress", "completed"].includes(o.status));
  if (paidInvoices.length > 0 || paidOrder) {
    const ref = paidInvoices[0] ?? paidOrder;
    return {
      status: "completed",
      startedAt: ref?.paidAt ?? ref?.createdAt ?? null,
      completedAt: ref?.paidAt ?? ref?.createdAt ?? null,
      meta: { invoiceId: paidInvoices[0] ? String(paidInvoices[0]._id) : null, paidInvoiceCount: paidInvoices.length },
    };
  }
  if (inputs.invoices.length > 0) {
    return { status: "in_progress", startedAt: inputs.invoices[0].createdAt ?? null, completedAt: null, meta: {} };
  }
  return { status: prevCompleted ? "available" : "locked", startedAt: null, completedAt: null, meta: {} };
}

function resolveProjectKickoff(inputs: JourneyInputs, prevCompleted: boolean): Pick<JourneyStepState, "status" | "startedAt" | "completedAt" | "meta"> {
  if (inputs.projects.length > 0) {
    const first = inputs.projects[0];
    return {
      status: "completed",
      startedAt: first.startDate ?? first.createdAt ?? null,
      completedAt: first.startDate ?? first.createdAt ?? null,
      meta: { projectId: String(first._id), projectCount: inputs.projects.length },
    };
  }
  return { status: prevCompleted ? "available" : "locked", startedAt: null, completedAt: null, meta: {} };
}

function latestProject(inputs: JourneyInputs): any | null {
  if (inputs.projects.length === 0) return null;
  // Most advanced project represents the customer's furthest journey point.
  return [...inputs.projects].sort((a, b) => projectStatusIndex(b.status) - projectStatusIndex(a.status))[0];
}

function resolveProduction(inputs: JourneyInputs, prevCompleted: boolean): Pick<JourneyStepState, "status" | "startedAt" | "completedAt" | "meta"> {
  const project = latestProject(inputs);
  if (!project) return { status: prevCompleted ? "available" : "locked", startedAt: null, completedAt: null, meta: {} };
  const idx = projectStatusIndex(project.status);
  if (idx >= projectStatusIndex("testing")) {
    return { status: "completed", startedAt: project.startDate ?? project.createdAt ?? null, completedAt: null, meta: { projectId: String(project._id), progress: project.progress ?? 0 } };
  }
  if (idx >= projectStatusIndex("in_progress")) {
    return { status: "in_progress", startedAt: project.startDate ?? project.createdAt ?? null, completedAt: null, meta: { projectId: String(project._id), progress: project.progress ?? 0 } };
  }
  return { status: "available", startedAt: null, completedAt: null, meta: {} };
}

function resolveClientReview(inputs: JourneyInputs, prevCompleted: boolean): Pick<JourneyStepState, "status" | "startedAt" | "completedAt" | "meta"> {
  const project = latestProject(inputs);
  if (!project) return { status: prevCompleted ? "available" : "locked", startedAt: null, completedAt: null, meta: {} };
  const idx = projectStatusIndex(project.status);
  if (idx >= projectStatusIndex("delivery")) {
    return { status: "completed", startedAt: null, completedAt: null, meta: { projectId: String(project._id) } };
  }
  if (idx === projectStatusIndex("review")) {
    return { status: "in_progress", startedAt: null, completedAt: null, meta: { projectId: String(project._id) } };
  }
  return { status: prevCompleted ? "available" : "locked", startedAt: null, completedAt: null, meta: {} };
}

function resolveDelivery(inputs: JourneyInputs, prevCompleted: boolean): Pick<JourneyStepState, "status" | "startedAt" | "completedAt" | "meta"> {
  const project = latestProject(inputs);
  if (!project) return { status: prevCompleted ? "available" : "locked", startedAt: null, completedAt: null, meta: {} };
  const idx = projectStatusIndex(project.status);
  if (idx >= projectStatusIndex("closed") || project.deliveredAt) {
    return { status: "completed", startedAt: null, completedAt: project.deliveredAt ?? null, meta: { projectId: String(project._id) } };
  }
  if (idx === projectStatusIndex("delivery")) {
    return { status: "in_progress", startedAt: null, completedAt: null, meta: { projectId: String(project._id) } };
  }
  return { status: prevCompleted ? "available" : "locked", startedAt: null, completedAt: null, meta: {} };
}

function resolveSupport(inputs: JourneyInputs, prevCompleted: boolean): Pick<JourneyStepState, "status" | "startedAt" | "completedAt" | "meta"> {
  // Support is an ongoing stage once delivery is complete — there is no
  // terminal "done" state for it, so it stays "in_progress" (never
  // "completed") once reached. This mirrors the real relationship: support
  // does not end because a project shipped.
  return { status: prevCompleted ? "in_progress" : "locked", startedAt: null, completedAt: null, meta: {} };
}

function resolveLoyalty(inputs: JourneyInputs, deliveryCompleted: boolean): Pick<JourneyStepState, "status" | "startedAt" | "completedAt" | "meta"> {
  // No loyalty-program data model exists yet in this codebase — this stage
  // becomes reachable (not locked) once at least one project has been
  // delivered, but is never auto-completed by this service.
  return { status: deliveryCompleted ? "available" : "locked", startedAt: null, completedAt: null, meta: {} };
}

// ── Main aggregator ────────────────────────────────────────────────────────────

/**
 * Build a real, database-backed Customer Journey V2 state for one user.
 * Read-only — safe to call as often as needed (e.g. on every dashboard load).
 */
export async function buildCustomerJourneyState(userId: string): Promise<CustomerJourneyState | null> {
  const inputs = await loadJourneyInputs(userId);
  if (!inputs.user) return null;

  const welcome = resolveWelcome(inputs);
  const discover = resolveDiscoverServices(inputs);
  const configure = resolveConfigureProject(inputs, discover.status === "completed");
  const review = resolveReviewProposal(inputs, configure.status === "completed");
  const payment = resolvePayment(inputs, review.status === "completed");
  const kickoff = resolveProjectKickoff(inputs, payment.status === "completed");
  const production = resolveProduction(inputs, kickoff.status === "completed");
  const clientReview = resolveClientReview(inputs, production.status === "completed");
  const delivery = resolveDelivery(inputs, clientReview.status === "completed");
  const support = resolveSupport(inputs, delivery.status === "completed");
  const loyalty = resolveLoyalty(inputs, delivery.status === "completed");

  const resolved: Record<JourneyStepId, Pick<JourneyStepState, "status" | "startedAt" | "completedAt" | "meta">> = {
    [JOURNEY_STEP_ID.WELCOME]: welcome,
    [JOURNEY_STEP_ID.DISCOVER_SERVICES]: discover,
    [JOURNEY_STEP_ID.CONFIGURE_PROJECT]: configure,
    [JOURNEY_STEP_ID.REVIEW_PROPOSAL]: review,
    [JOURNEY_STEP_ID.PAYMENT]: payment,
    [JOURNEY_STEP_ID.PROJECT_KICKOFF]: kickoff,
    [JOURNEY_STEP_ID.PRODUCTION]: production,
    [JOURNEY_STEP_ID.CLIENT_REVIEW]: clientReview,
    [JOURNEY_STEP_ID.DELIVERY]: delivery,
    [JOURNEY_STEP_ID.SUPPORT]: support,
    [JOURNEY_STEP_ID.LOYALTY]: loyalty,
  };

  const steps = {} as Record<JourneyStepId, JourneyStepState>;
  STEP_ORDER.forEach((id, i) => {
    steps[id] = { id, order: i + 1, ...resolved[id] };
  });

  const completedOrSkipped = STEP_ORDER.filter(id => steps[id].status === "completed" || steps[id].status === "skipped");
  const progressPercent = Math.round((completedOrSkipped.length / STEP_ORDER.length) * 100);
  const isComplete = completedOrSkipped.length === STEP_ORDER.length;

  // Active step: first step not yet completed/skipped, else the last step.
  const activeStepId = STEP_ORDER.find(id => steps[id].status !== "completed" && steps[id].status !== "skipped")
    ?? STEP_ORDER[STEP_ORDER.length - 1];

  return {
    version: 1,
    userId: String(userId),
    activeStepId,
    steps,
    progressPercent,
    isComplete,
    updatedAt: new Date(),
    source: "database",
  };
}

// ── Customer summary (profile + KPIs) ─────────────────────────────────────────

export interface CustomerSummary {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  memberSince: Date | null;
  crmStage: string | null;
  kpis: {
    totalOrders: number;
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalInvoices: number;
    paidInvoices: number;
    totalQuotations: number;
  };
}

export async function buildCustomerSummary(userId: string): Promise<CustomerSummary | null> {
  const inputs = await loadJourneyInputs(userId);
  if (!inputs.user) return null;

  const activeProjects = inputs.projects.filter((p: any) => p.status !== "closed");
  const completedProjects = inputs.projects.filter((p: any) => p.status === "closed");
  const paidInvoices = inputs.invoices.filter((i: any) => i.status === "paid");

  return {
    userId: String(userId),
    fullName: inputs.user.fullName ?? "",
    email: inputs.user.email ?? "",
    phone: inputs.user.phone ?? "",
    role: inputs.user.role ?? "client",
    memberSince: inputs.user.createdAt ?? null,
    crmStage: inputs.crmLead?.stage ?? null,
    kpis: {
      totalOrders: inputs.orders.length,
      totalProjects: inputs.projects.length,
      activeProjects: activeProjects.length,
      completedProjects: completedProjects.length,
      totalInvoices: inputs.invoices.length,
      paidInvoices: paidInvoices.length,
      totalQuotations: inputs.quotations.length,
    },
  };
}

// ── Customer timeline (chronological, real events only) ───────────────────────

export type TimelineEventType = "order" | "quotation" | "invoice" | "project";

export interface TimelineEvent {
  type: TimelineEventType;
  id: string;
  title: string;
  status: string;
  occurredAt: Date;
}

export async function buildCustomerTimeline(userId: string): Promise<TimelineEvent[] | null> {
  const inputs = await loadJourneyInputs(userId);
  if (!inputs.user) return null;

  const events: TimelineEvent[] = [
    ...inputs.orders.map((o: any) => ({
      type: "order" as const,
      id: String(o._id),
      title: o.serviceType || o.planTier || "Order",
      status: o.status,
      occurredAt: o.createdAt,
    })),
    ...inputs.quotations.map((q: any) => ({
      type: "quotation" as const,
      id: String(q._id),
      title: q.title || q.quotationNumber,
      status: q.status,
      occurredAt: q.createdAt,
    })),
    ...inputs.invoices.map((i: any) => ({
      type: "invoice" as const,
      id: String(i._id),
      title: i.title || i.invoiceNumber,
      status: i.status,
      occurredAt: i.createdAt,
    })),
    ...inputs.projects.map((p: any) => ({
      type: "project" as const,
      id: String(p._id),
      title: `Project ${String(p._id).slice(-6)}`,
      status: p.status,
      occurredAt: p.createdAt,
    })),
  ];

  return events
    .filter(e => !!e.occurredAt)
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}

// ── Journey Events (Sprint C) ──────────────────────────────────────────────────
// Superset of buildCustomerTimeline: merges the same real record events with
// derived "journey step" events (a step reaching completed/in_progress),
// giving a single narrative feed for the dashboard's activity/timeline UI.
// Additive — buildCustomerTimeline is untouched and still used wherever it
// already is, this is a new export consumed by the new /events endpoint.

export type JourneyEventType = TimelineEventType | "journey_step";

export interface JourneyEvent {
  type: JourneyEventType;
  id: string;
  title: string;
  status: string;
  occurredAt: Date;
  meta?: Record<string, unknown>;
}

export async function buildJourneyEvents(userId: string): Promise<JourneyEvent[] | null> {
  const [inputs, journey] = await Promise.all([
    loadJourneyInputs(userId),
    buildCustomerJourneyState(userId),
  ]);
  if (!inputs.user || !journey) return null;

  const recordEvents: JourneyEvent[] = (await buildCustomerTimeline(userId) ?? []).map(e => ({
    type: e.type,
    id: e.id,
    title: e.title,
    status: e.status,
    occurredAt: e.occurredAt,
  }));

  const stepEvents: JourneyEvent[] = STEP_ORDER
    .map(id => journey.steps[id])
    .filter(s => s.status === "completed" && (s.completedAt || s.startedAt))
    .map(s => ({
      type: "journey_step" as const,
      id: `journey_step_${s.id}`,
      title: s.id,
      status: s.status,
      occurredAt: (s.completedAt ?? s.startedAt) as Date,
      meta: { order: s.order, ...s.meta },
    }));

  return [...recordEvents, ...stepEvents]
    .filter(e => !!e.occurredAt)
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}

// ── Next Recommended Action (Sprint C) ─────────────────────────────────────────
// Read-only recommendation engine: given the customer's real journey state,
// derive the single highest-priority action they (or staff, on their behalf)
// should take next. Mirrors the CTA vocabulary already used by the client's
// (currently inactive) cta-engine.ts so the two can converge later without a
// breaking change — this is an independent server-side derivation, not an
// import from client code.

export type ActionUrgency = "low" | "medium" | "high";

export interface RecommendedAction {
  stepId: JourneyStepId;
  actionKey: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  href: string;
  urgency: ActionUrgency;
}

const RECOMMENDED_ACTION_BY_STEP: Record<JourneyStepId, (inputs: JourneyInputs, meta: Record<string, unknown>) => Omit<RecommendedAction, "stepId">> = {
  [JOURNEY_STEP_ID.WELCOME]: () => ({
    actionKey: "start_journey", titleAr: "ابدأ رحلتك", titleEn: "Start your journey",
    descriptionAr: "استعرض خدماتنا واختر الحل المناسب لمشروعك.",
    descriptionEn: "Browse our services and pick the right solution for your project.",
    href: "/prices", urgency: "low",
  }),
  [JOURNEY_STEP_ID.DISCOVER_SERVICES]: () => ({
    actionKey: "browse_services", titleAr: "استعرض الخدمات", titleEn: "Browse services",
    descriptionAr: "تصفح الباقات والأنظمة المتاحة لاختيار ما يناسبك.",
    descriptionEn: "Explore available plans and systems to find the right fit.",
    href: "/prices", urgency: "medium",
  }),
  [JOURNEY_STEP_ID.CONFIGURE_PROJECT]: () => ({
    actionKey: "start_order", titleAr: "ابدأ طلبك", titleEn: "Start your order",
    descriptionAr: "أكمل تفاصيل مشروعك لنبدأ في إعداد عرض السعر.",
    descriptionEn: "Complete your project details so we can prepare a proposal.",
    href: "/order", urgency: "medium",
  }),
  [JOURNEY_STEP_ID.REVIEW_PROPOSAL]: (_inputs, meta) => ({
    actionKey: "review_proposal", titleAr: "راجع العرض المقدم", titleEn: "Review your proposal",
    descriptionAr: "لديك عرض سعر بانتظار موافقتك.",
    descriptionEn: "You have a quotation awaiting your decision.",
    href: meta.quotationId ? "/dashboard?tab=quotations" : "/dashboard", urgency: "high",
  }),
  [JOURNEY_STEP_ID.PAYMENT]: () => ({
    actionKey: "complete_payment", titleAr: "أتمم عملية الدفع", titleEn: "Complete payment",
    descriptionAr: "لديك فاتورة غير مسددة — أتمم الدفع لبدء العمل على مشروعك.",
    descriptionEn: "You have an unpaid invoice — complete payment to kick off your project.",
    href: "/dashboard?tab=invoices", urgency: "high",
  }),
  [JOURNEY_STEP_ID.PROJECT_KICKOFF]: (_inputs, meta) => ({
    actionKey: "await_kickoff", titleAr: "بانتظار بدء المشروع", titleEn: "Awaiting project kickoff",
    descriptionAr: "فريقنا سيبدأ العمل على مشروعك قريبًا.",
    descriptionEn: "Our team will begin work on your project shortly.",
    href: meta.projectId ? `/project/${meta.projectId}` : "/dashboard", urgency: "low",
  }),
  [JOURNEY_STEP_ID.PRODUCTION]: (_inputs, meta) => ({
    actionKey: "track_progress", titleAr: "تابع تقدم مشروعك", titleEn: "Track your project's progress",
    descriptionAr: "مشروعك قيد التنفيذ حاليًا — يمكنك متابعة التقدم في أي وقت.",
    descriptionEn: "Your project is currently in production — check progress anytime.",
    href: meta.projectId ? `/project/${meta.projectId}/workspace` : "/dashboard", urgency: "low",
  }),
  [JOURNEY_STEP_ID.CLIENT_REVIEW]: (_inputs, meta) => ({
    actionKey: "submit_review", titleAr: "قدم ملاحظاتك على المشروع", titleEn: "Submit your project feedback",
    descriptionAr: "مشروعك جاهز للمراجعة — شاركنا ملاحظاتك.",
    descriptionEn: "Your project is ready for review — share your feedback.",
    href: meta.projectId ? `/project/${meta.projectId}/workspace` : "/dashboard", urgency: "high",
  }),
  [JOURNEY_STEP_ID.DELIVERY]: (_inputs, meta) => ({
    actionKey: "accept_delivery", titleAr: "أكد استلام مشروعك", titleEn: "Confirm delivery",
    descriptionAr: "مشروعك تم تسليمه — أكد الاستلام لإغلاق المشروع.",
    descriptionEn: "Your project has been delivered — confirm receipt to close it out.",
    href: meta.projectId ? `/project/${meta.projectId}/workspace` : "/dashboard", urgency: "high",
  }),
  [JOURNEY_STEP_ID.SUPPORT]: (inputs) => {
    const openTickets = inputs.supportTickets.filter((t: any) => t.status === "open" || t.status === "in_review");
    if (openTickets.length > 0) {
      return {
        actionKey: "await_support_reply", titleAr: "بانتظار رد الدعم الفني", titleEn: "Awaiting support reply",
        descriptionAr: `لديك ${openTickets.length} تذكرة دعم مفتوحة.`,
        descriptionEn: `You have ${openTickets.length} open support ticket(s).`,
        href: "/support", urgency: "medium",
      };
    }
    return {
      actionKey: "open_support", titleAr: "بحاجة إلى مساعدة؟", titleEn: "Need help?",
      descriptionAr: "فريق الدعم متاح للإجابة على استفساراتك.",
      descriptionEn: "Our support team is available for any questions.",
      href: "/support", urgency: "low",
    };
  },
  [JOURNEY_STEP_ID.LOYALTY]: () => ({
    actionKey: "view_loyalty", titleAr: "اكتشف مكافآتك", titleEn: "Discover your rewards",
    descriptionAr: "استعرض برنامج الولاء والمكافآت المتاحة لك.",
    descriptionEn: "Check out the loyalty program and rewards available to you.",
    href: "/loyalty", urgency: "low",
  }),
};

/**
 * Derive the single next recommended action for a customer from their real
 * journey state. Returns null only if the customer doesn't exist or has
 * completed every step (nothing left to recommend).
 */
export async function buildNextRecommendedAction(userId: string): Promise<RecommendedAction | null> {
  const [inputs, journey] = await Promise.all([
    loadJourneyInputs(userId),
    buildCustomerJourneyState(userId),
  ]);
  if (!inputs.user || !journey) return null;
  if (journey.isComplete) return null;

  const activeStep = journey.steps[journey.activeStepId];
  const resolver = RECOMMENDED_ACTION_BY_STEP[journey.activeStepId];
  const built = resolver(inputs, activeStep.meta);

  return { stepId: journey.activeStepId, ...built };
}

// ── Customer Health Score (Sprint C) ────────────────────────────────────────────
// Composite 0-100 score derived purely from real records — no placeholder
// inputs. Intended for staff-facing "at risk" surfacing, not shown to the
// customer themselves. Weighted blend of:
//   - payment health   (30%): paid vs total invoices
//   - engagement recency (25%): days since the customer's last recorded activity
//   - project momentum (25%): active project progress + completion ratio
//   - support friction (20%): open/high-priority ticket load
// Each factor defaults to a neutral baseline when there isn't enough data
// yet (e.g. a brand-new customer with no invoices), rather than penalizing
// customers who simply haven't reached that stage.

export type HealthBand = "excellent" | "good" | "fair" | "at_risk" | "critical";

export interface CustomerHealthScore {
  userId: string;
  score: number; // 0-100
  band: HealthBand;
  factors: {
    paymentHealth: number;
    engagementRecency: number;
    projectMomentum: number;
    supportFriction: number;
  };
  computedAt: Date;
}

function scoreToBand(score: number): HealthBand {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  if (score >= 30) return "at_risk";
  return "critical";
}

function daysSince(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const ms = Date.now() - new Date(date).getTime();
  return ms / (1000 * 60 * 60 * 24);
}

function computePaymentHealth(inputs: JourneyInputs): number {
  if (inputs.invoices.length === 0) return 70; // neutral — no invoices yet
  const paid = inputs.invoices.filter((i: any) => i.status === "paid").length;
  const cancelled = inputs.invoices.filter((i: any) => i.status === "cancelled").length;
  const relevant = inputs.invoices.length - cancelled;
  if (relevant <= 0) return 70;
  const ratio = paid / relevant;
  return Math.round(ratio * 100);
}

function computeEngagementRecency(inputs: JourneyInputs): number {
  const lastDates = [
    ...inputs.orders.map((o: any) => o.createdAt),
    ...inputs.invoices.map((i: any) => i.createdAt),
    ...inputs.projects.map((p: any) => p.updatedAt ?? p.createdAt),
    ...inputs.quotations.map((q: any) => q.createdAt),
  ].filter(Boolean);

  if (lastDates.length === 0) return 60; // brand-new customer, neutral

  const mostRecent = lastDates.reduce((latest: Date, d: any) =>
    new Date(d) > latest ? new Date(d) : latest, new Date(0));
  const days = daysSince(mostRecent) ?? 0;

  if (days <= 7) return 100;
  if (days <= 30) return 85;
  if (days <= 90) return 60;
  if (days <= 180) return 35;
  return 15;
}

function computeProjectMomentum(inputs: JourneyInputs): number {
  if (inputs.projects.length === 0) return 65; // no project yet — neutral, not a penalty
  const closed = inputs.projects.filter((p: any) => p.status === "closed");
  const active = inputs.projects.filter((p: any) => p.status !== "closed");

  if (active.length === 0) return 90; // everything delivered/closed cleanly

  const avgActiveProgress = active.reduce((sum: number, p: any) => sum + (p.progress ?? 0), 0) / active.length;
  const closedRatio = closed.length / inputs.projects.length;
  return Math.round(avgActiveProgress * 0.7 + closedRatio * 100 * 0.3);
}

function computeSupportFriction(inputs: JourneyInputs): number {
  if (inputs.supportTickets.length === 0) return 100; // no friction on record
  const open = inputs.supportTickets.filter((t: any) => t.status === "open" || t.status === "in_review");
  const highPriorityOpen = open.filter((t: any) => t.priority === "high").length;
  const staleOpen = open.filter((t: any) => (daysSince(t.createdAt) ?? 0) > 3).length;

  let score = 100 - open.length * 10 - highPriorityOpen * 10 - staleOpen * 10;
  return Math.max(0, Math.min(100, score));
}

export async function buildCustomerHealthScore(userId: string): Promise<CustomerHealthScore | null> {
  const inputs = await loadJourneyInputs(userId);
  if (!inputs.user) return null;

  const paymentHealth = computePaymentHealth(inputs);
  const engagementRecency = computeEngagementRecency(inputs);
  const projectMomentum = computeProjectMomentum(inputs);
  const supportFriction = computeSupportFriction(inputs);

  const score = Math.round(
    paymentHealth * 0.30 +
    engagementRecency * 0.25 +
    projectMomentum * 0.25 +
    supportFriction * 0.20
  );

  return {
    userId: String(userId),
    score,
    band: scoreToBand(score),
    factors: { paymentHealth, engagementRecency, projectMomentum, supportFriction },
    computedAt: new Date(),
  };
}

// ── Dashboard KPIs (Sprint C) ───────────────────────────────────────────────────
// Staff-facing, portfolio-wide KPIs computed via real MongoDB aggregation
// pipelines (not a per-customer loop) — safe to call at scale. Read-only,
// no side effects. Consumed by the new /dashboard-kpis endpoint.

export interface DashboardKpis {
  totalCustomers: number;
  newCustomersLast30Days: number;
  activeProjects: number;
  completedProjects: number;
  revenuePaid: number;
  revenueOutstanding: number;
  openSupportTickets: number;
  avgActiveProjectProgress: number;
  computedAt: Date;
}

export async function buildDashboardKpis(): Promise<DashboardKpis> {
  const { UserModel, ProjectModel, InvoiceModel, SupportTicketModel } = await import("../models");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalCustomers,
    newCustomersLast30Days,
    activeProjects,
    completedProjects,
    revenuePaidAgg,
    revenueOutstandingAgg,
    openSupportTickets,
    avgProgressAgg,
  ] = await Promise.all([
    UserModel.countDocuments({ role: "client" }),
    UserModel.countDocuments({ role: "client", createdAt: { $gte: thirtyDaysAgo } }),
    ProjectModel.countDocuments({ status: { $ne: "closed" } }),
    ProjectModel.countDocuments({ status: "closed" }),
    InvoiceModel.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    InvoiceModel.aggregate([
      { $match: { status: "unpaid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    SupportTicketModel.countDocuments({ status: { $in: ["open", "in_review"] } }),
    ProjectModel.aggregate([
      { $match: { status: { $ne: "closed" } } },
      { $group: { _id: null, avg: { $avg: "$progress" } } },
    ]),
  ]);

  return {
    totalCustomers,
    newCustomersLast30Days,
    activeProjects,
    completedProjects,
    revenuePaid: revenuePaidAgg[0]?.total ?? 0,
    revenueOutstanding: revenueOutstandingAgg[0]?.total ?? 0,
    openSupportTickets,
    avgActiveProjectProgress: Math.round(avgProgressAgg[0]?.avg ?? 0),
    computedAt: new Date(),
  };
}
