// ── Checklist Engine ──────────────────────────────────────────────────────────
// Sprint 003 — Architecture only. Not yet active in production.
//
// Pure functions for building and evaluating per-step checklists.
// No React, no side effects.

import {
  JOURNEY_STEP_ID,
  type JourneyStepId,
  type ChecklistItem,
  type Checklist,
} from "../types";

// ── Step checklist definitions ────────────────────────────────────────────────
// Each step has a set of items the client must complete to advance.

const STEP_CHECKLIST_DEFINITIONS: Partial<Record<JourneyStepId, Omit<ChecklistItem, "completed">[]>> = {
  [JOURNEY_STEP_ID.WELCOME]: [
    { id: "profile_complete",  labelAr: "اكمل ملفك الشخصي",    labelEn: "Complete your profile",        required: true,  stepId: JOURNEY_STEP_ID.WELCOME },
    { id: "phone_verified",    labelAr: "تحقق من رقم هاتفك",    labelEn: "Verify your phone number",     required: false, stepId: JOURNEY_STEP_ID.WELCOME },
  ],
  [JOURNEY_STEP_ID.DISCOVER_SERVICES]: [
    { id: "viewed_services",   labelAr: "استعرضت الخدمات",      labelEn: "Browsed services",             required: true,  stepId: JOURNEY_STEP_ID.DISCOVER_SERVICES },
    { id: "saved_shortlist",   labelAr: "حفظت قائمة مختصرة",   labelEn: "Saved a shortlist",            required: false, stepId: JOURNEY_STEP_ID.DISCOVER_SERVICES },
  ],
  [JOURNEY_STEP_ID.CONFIGURE_PROJECT]: [
    { id: "order_submitted",   labelAr: "تم إرسال الطلب",        labelEn: "Order submitted",              required: true,  stepId: JOURNEY_STEP_ID.CONFIGURE_PROJECT },
    { id: "requirements_doc",  labelAr: "وثيقة المتطلبات مرفقة", labelEn: "Requirements doc attached",   required: false, stepId: JOURNEY_STEP_ID.CONFIGURE_PROJECT },
  ],
  [JOURNEY_STEP_ID.REVIEW_PROPOSAL]: [
    { id: "proposal_read",     labelAr: "قرأت العرض",            labelEn: "Read the proposal",            required: true,  stepId: JOURNEY_STEP_ID.REVIEW_PROPOSAL },
    { id: "questions_asked",   labelAr: "طرحت أسئلتك",          labelEn: "Asked your questions",         required: false, stepId: JOURNEY_STEP_ID.REVIEW_PROPOSAL },
    { id: "proposal_approved", labelAr: "وافقت على العرض",       labelEn: "Approved the proposal",       required: true,  stepId: JOURNEY_STEP_ID.REVIEW_PROPOSAL },
  ],
  [JOURNEY_STEP_ID.PAYMENT]: [
    { id: "invoice_received",  labelAr: "استلمت الفاتورة",       labelEn: "Received invoice",             required: true,  stepId: JOURNEY_STEP_ID.PAYMENT },
    { id: "payment_done",      labelAr: "تم الدفع",              labelEn: "Payment completed",            required: true,  stepId: JOURNEY_STEP_ID.PAYMENT },
  ],
  [JOURNEY_STEP_ID.PROJECT_KICKOFF]: [
    { id: "kickoff_meeting",   labelAr: "حضرت اجتماع الانطلاق",  labelEn: "Attended kickoff meeting",    required: true,  stepId: JOURNEY_STEP_ID.PROJECT_KICKOFF },
    { id: "timeline_agreed",   labelAr: "تم الاتفاق على الجدول", labelEn: "Timeline agreed",             required: true,  stepId: JOURNEY_STEP_ID.PROJECT_KICKOFF },
  ],
  [JOURNEY_STEP_ID.PRODUCTION]: [
    { id: "updates_reviewed",  labelAr: "راجعت تحديثات المشروع", labelEn: "Reviewed project updates",    required: false, stepId: JOURNEY_STEP_ID.PRODUCTION },
  ],
  [JOURNEY_STEP_ID.CLIENT_REVIEW]: [
    { id: "deliverables_seen", labelAr: "راجعت المخرجات",        labelEn: "Reviewed deliverables",       required: true,  stepId: JOURNEY_STEP_ID.CLIENT_REVIEW },
    { id: "feedback_sent",     labelAr: "أرسلت ملاحظاتك",        labelEn: "Sent feedback",               required: true,  stepId: JOURNEY_STEP_ID.CLIENT_REVIEW },
  ],
  [JOURNEY_STEP_ID.DELIVERY]: [
    { id: "delivery_accepted", labelAr: "قبلت التسليم",           labelEn: "Accepted delivery",           required: true,  stepId: JOURNEY_STEP_ID.DELIVERY },
    { id: "files_downloaded",  labelAr: "حملت الملفات",           labelEn: "Downloaded files",            required: false, stepId: JOURNEY_STEP_ID.DELIVERY },
    { id: "nps_submitted",     labelAr: "أرسلت تقييمك",           labelEn: "Submitted NPS rating",        required: false, stepId: JOURNEY_STEP_ID.DELIVERY },
  ],
  [JOURNEY_STEP_ID.SUPPORT]: [
    { id: "support_aware",     labelAr: "تعرفت على قنوات الدعم",  labelEn: "Aware of support channels",  required: true,  stepId: JOURNEY_STEP_ID.SUPPORT },
  ],
  [JOURNEY_STEP_ID.LOYALTY]: [
    { id: "loyalty_enrolled",  labelAr: "انضممت لبرنامج الولاء",  labelEn: "Enrolled in loyalty program", required: false, stepId: JOURNEY_STEP_ID.LOYALTY },
  ],
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Build a Checklist for the given step with the provided completion state.
 * completedIds: set of item IDs the client has already completed.
 */
export function buildChecklist(
  stepId: JourneyStepId,
  completedIds: Set<string> = new Set(),
): Checklist {
  const defs = STEP_CHECKLIST_DEFINITIONS[stepId] ?? [];

  const items: ChecklistItem[] = defs.map(def => ({
    ...def,
    completed: completedIds.has(def.id),
  }));

  const requiredItems   = items.filter(i => i.required);
  const completedReq    = requiredItems.filter(i => i.completed).length;
  const totalItems      = items.length;
  const completedTotal  = items.filter(i => i.completed).length;

  const completionPercent = totalItems === 0
    ? 100
    : Math.round((completedTotal / totalItems) * 100);

  const canAdvance = requiredItems.length === 0 || completedReq === requiredItems.length;

  return { stepId, items, completionPercent, canAdvance };
}

/** Toggle a single checklist item and return the updated Checklist. */
export function toggleChecklistItem(
  checklist: Checklist,
  itemId: string,
  completed: boolean,
): Checklist {
  const updatedItems = checklist.items.map(item =>
    item.id === itemId ? { ...item, completed } : item
  );

  const completedIds = new Set(
    updatedItems.filter(i => i.completed).map(i => i.id)
  );

  return buildChecklist(checklist.stepId, completedIds);
}
