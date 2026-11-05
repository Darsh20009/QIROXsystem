// ── CRM V2 Follow-Up Engine — Architecture ────────────────────────────────────
// Sprint 008 — CRM V2 Foundation.
//
// STATUS: ARCHITECTURE ONLY.
// The engine design and configuration schema are defined here.
// Automation (background execution) ships in Sprint 009+.
//
// What is defined here:
//   - Trigger catalogue (what events start a follow-up)
//   - Action catalogue (what the engine does)
//   - Priority + escalation framework
//   - Reminder type taxonomy
//   - Rule evaluation interface (not wired to a cron yet)

// ── Trigger Catalogue ─────────────────────────────────────────────────────────

export interface FollowUpTrigger {
  id: string;
  nameAr: string;
  nameEn: string;
  category: "time" | "stage" | "score" | "event";
  description: string;
  defaultPriority: "low" | "medium" | "high" | "urgent" | "critical";
}

export const TRIGGER_CATALOGUE: FollowUpTrigger[] = [
  {
    id: "no_contact_7d",
    nameAr: "لا تواصل منذ 7 أيام",
    nameEn: "No contact in 7 days",
    category: "time",
    description: "Triggered when a lead/customer has not been contacted for 7 days.",
    defaultPriority: "medium",
  },
  {
    id: "no_contact_14d",
    nameAr: "لا تواصل منذ 14 يوماً",
    nameEn: "No contact in 14 days",
    category: "time",
    description: "Triggered when a lead/customer has not been contacted for 14 days.",
    defaultPriority: "high",
  },
  {
    id: "no_contact_30d",
    nameAr: "لا تواصل منذ 30 يوماً",
    nameEn: "No contact in 30 days",
    category: "time",
    description: "Triggered when a lead/customer has not been contacted for 30 days.",
    defaultPriority: "urgent",
  },
  {
    id: "stage_stale",
    nameAr: "لا تقدم في المرحلة",
    nameEn: "Stage is stale",
    category: "stage",
    description: "Opportunity has been in the same stage for too long.",
    defaultPriority: "high",
  },
  {
    id: "proposal_sent_no_response",
    nameAr: "لا رد على العرض",
    nameEn: "Proposal sent, no response",
    category: "event",
    description: "A quotation was sent but the client has not responded.",
    defaultPriority: "high",
  },
  {
    id: "invoice_overdue",
    nameAr: "فاتورة متأخرة",
    nameEn: "Invoice overdue",
    category: "event",
    description: "An invoice has passed its due date without payment.",
    defaultPriority: "urgent",
  },
  {
    id: "project_at_risk",
    nameAr: "مشروع في خطر",
    nameEn: "Project at risk",
    category: "event",
    description: "Project completion is delayed beyond expected date.",
    defaultPriority: "urgent",
  },
  {
    id: "lead_score_dropped",
    nameAr: "انخفض تقييم العميل المحتمل",
    nameEn: "Lead score dropped",
    category: "score",
    description: "The computed lead score dropped below a threshold.",
    defaultPriority: "medium",
  },
  {
    id: "new_lead_assigned",
    nameAr: "تعيين عميل محتمل جديد",
    nameEn: "New lead assigned",
    category: "event",
    description: "A new lead has been assigned to this employee.",
    defaultPriority: "high",
  },
  {
    id: "meeting_completed",
    nameAr: "بعد الاجتماع",
    nameEn: "After meeting completed",
    category: "event",
    description: "A meeting was completed — follow-up required.",
    defaultPriority: "medium",
  },
  {
    id: "contract_expiring",
    nameAr: "عقد على وشك الانتهاء",
    nameEn: "Contract expiring soon",
    category: "time",
    description: "A contract is expiring within the configured window.",
    defaultPriority: "high",
  },
  {
    id: "subscription_expiring",
    nameAr: "اشتراك على وشك الانتهاء",
    nameEn: "Subscription expiring soon",
    category: "time",
    description: "A subscription is expiring — renewal opportunity.",
    defaultPriority: "high",
  },
];

// ── Action Catalogue ──────────────────────────────────────────────────────────

export interface FollowUpAction {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string;
  requiresParams: string[];
}

export const ACTION_CATALOGUE: FollowUpAction[] = [
  {
    id: "create_reminder",
    nameAr: "إنشاء تذكير",
    nameEn: "Create Reminder",
    description: "Create a reminder for the assigned employee.",
    requiresParams: ["title", "assignedTo", "dueInHours"],
  },
  {
    id: "send_whatsapp",
    nameAr: "إرسال واتساب",
    nameEn: "Send WhatsApp",
    description: "Send a WhatsApp message using a predefined template.",
    requiresParams: ["templateId", "phone"],
  },
  {
    id: "send_email",
    nameAr: "إرسال بريد إلكتروني",
    nameEn: "Send Email",
    description: "Send an email using a predefined template.",
    requiresParams: ["templateId", "email"],
  },
  {
    id: "assign_task",
    nameAr: "تعيين مهمة",
    nameEn: "Assign Task",
    description: "Create a task and assign it to an employee.",
    requiresParams: ["title", "assignedTo", "dueInHours"],
  },
  {
    id: "escalate_to_manager",
    nameAr: "تصعيد للمدير",
    nameEn: "Escalate to Manager",
    description: "Notify the manager with an escalation alert.",
    requiresParams: ["managerId"],
  },
  {
    id: "move_to_segment",
    nameAr: "نقل إلى شريحة",
    nameEn: "Move to Segment",
    description: "Add the subject to a CRM segment.",
    requiresParams: ["segmentId"],
  },
  {
    id: "add_tag",
    nameAr: "إضافة تاغ",
    nameEn: "Add Tag",
    description: "Add a tag to the lead or customer.",
    requiresParams: ["tagId"],
  },
  {
    id: "notify_employee",
    nameAr: "إشعار الموظف",
    nameEn: "Notify Employee",
    description: "Send an in-app notification to the assigned employee.",
    requiresParams: ["employeeId"],
  },
];

// ── Reminder Type Taxonomy ────────────────────────────────────────────────────

export const REMINDER_TYPES = [
  { id: "call_back",       ar: "معاودة الاتصال",      en: "Call Back",          priority: "high" },
  { id: "send_proposal",   ar: "إرسال عرض السعر",    en: "Send Proposal",      priority: "high" },
  { id: "follow_up_email", ar: "متابعة بريد إلكتروني",en: "Follow-up Email",   priority: "medium" },
  { id: "check_in",        ar: "تسجيل حضور",          en: "Check In",           priority: "low" },
  { id: "collect_payment", ar: "تحصيل دفعة",          en: "Collect Payment",    priority: "urgent" },
  { id: "contract_renewal",ar: "تجديد عقد",           en: "Contract Renewal",   priority: "high" },
  { id: "demo_scheduled",  ar: "تقديم عرض توضيحي",   en: "Demo Scheduled",     priority: "high" },
  { id: "onboarding",      ar: "تهيئة العميل",         en: "Client Onboarding", priority: "high" },
  { id: "review_meeting",  ar: "اجتماع مراجعة",        en: "Review Meeting",    priority: "medium" },
  { id: "custom",          ar: "مخصص",                en: "Custom",             priority: "medium" },
] as const;

// ── Priority Framework ────────────────────────────────────────────────────────

export const PRIORITY_FRAMEWORK = {
  low: {
    label: { ar: "منخفض",    en: "Low" },
    responseWindowHours: 72,
    color: "#E5E7EB",
    escalateAfterHours: null,
  },
  medium: {
    label: { ar: "متوسط",    en: "Medium" },
    responseWindowHours: 24,
    color: "#9CA3AF",
    escalateAfterHours: 48,
  },
  high: {
    label: { ar: "عالي",     en: "High" },
    responseWindowHours: 8,
    color: "#4B5563",
    escalateAfterHours: 24,
  },
  urgent: {
    label: { ar: "عاجل",     en: "Urgent" },
    responseWindowHours: 2,
    color: "#1F2937",
    escalateAfterHours: 4,
  },
  critical: {
    label: { ar: "حرج",      en: "Critical" },
    responseWindowHours: 0.5,
    color: "#000000",
    escalateAfterHours: 1,
  },
} as const;

// ── Escalation Matrix ─────────────────────────────────────────────────────────

export const ESCALATION_MATRIX = [
  {
    level: 1,
    triggerAfterHours: 4,
    notifyRole: "manager",
    action: "notify_employee",
    descriptionAr: "إشعار المدير المباشر",
    descriptionEn: "Notify direct manager",
  },
  {
    level: 2,
    triggerAfterHours: 24,
    notifyRole: "senior_manager",
    action: "escalate_to_manager",
    descriptionAr: "تصعيد للإدارة العليا",
    descriptionEn: "Escalate to senior management",
  },
  {
    level: 3,
    triggerAfterHours: 72,
    notifyRole: "admin",
    action: "escalate_to_manager",
    descriptionAr: "تصعيد لمدير النظام",
    descriptionEn: "Escalate to system admin",
  },
] as const;

// ── Rule Evaluator Interface ──────────────────────────────────────────────────
// Will be implemented as a background job in Sprint 009+.

export interface RuleEvaluationContext {
  subjectType: "lead" | "customer";
  subjectId: string;
  leadScore: number;
  healthScore: number;
  daysSinceLastContact: number;
  currentStageId?: string;
  openOpportunities: number;
  hasOverdueInvoice: boolean;
  hasAtRiskProject: boolean;
  hasRecentMeeting: boolean;
  assignedEmployeeId: string;
}

/**
 * Evaluate a single rule against a context.
 * Returns true if the rule should fire.
 * NOTE: This is the interface contract — full execution in Sprint 009+.
 */
export function evaluateRule(
  rule: {
    trigger: string;
    triggerConfig: {
      daysThreshold?: number | null;
      scoreThreshold?: number | null;
    };
  },
  ctx: RuleEvaluationContext,
): boolean {
  switch (rule.trigger) {
    case "no_contact_7d":
      return ctx.daysSinceLastContact >= 7;
    case "no_contact_14d":
      return ctx.daysSinceLastContact >= 14;
    case "no_contact_30d":
      return ctx.daysSinceLastContact >= 30;
    case "invoice_overdue":
      return ctx.hasOverdueInvoice;
    case "project_at_risk":
      return ctx.hasAtRiskProject;
    case "meeting_completed":
      return ctx.hasRecentMeeting;
    case "lead_score_dropped":
      return ctx.leadScore < (rule.triggerConfig.scoreThreshold ?? 30);
    case "stage_stale":
      return ctx.daysSinceLastContact >= (rule.triggerConfig.daysThreshold ?? 7);
    default:
      return false;
  }
}
