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
}

async function loadJourneyInputs(userId: string): Promise<JourneyInputs> {
  const {
    UserModel, OrderModel, QuotationModel, InvoiceModel, ProjectModel, CrmLeadModel,
  } = await import("../models");

  const uid = String(userId);

  const [user, orders, quotations, invoices, projects] = await Promise.all([
    UserModel.findById(uid).select("email fullName createdAt role").lean(),
    OrderModel.find({ userId: uid }).sort({ createdAt: 1 }).lean(),
    QuotationModel.find({ userId: uid }).sort({ createdAt: 1 }).lean(),
    InvoiceModel.find({ userId: uid }).sort({ createdAt: 1 }).lean(),
    ProjectModel.find({ clientId: uid }).sort({ createdAt: 1 }).lean(),
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

  return { user, crmLead, orders, quotations, invoices, projects };
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
