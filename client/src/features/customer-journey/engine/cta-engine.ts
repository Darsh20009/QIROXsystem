// ── CTA Engine ────────────────────────────────────────────────────────────────
// Sprint 003 — Architecture only. Not yet active in production.
//
// Pure functions that derive the correct Call-To-Action(s) for any given
// journey step and status combination. No React, no side effects.

import {
  JOURNEY_STEP_ID,
  type JourneyStepId,
  type JourneyStepStatus,
  type Cta,
} from "../types";

// ── CTA resolver ──────────────────────────────────────────────────────────────

interface CtaInput {
  stepId:     JourneyStepId;
  status:     JourneyStepStatus;
  /** Resolved meta (e.g. linked orderId) from the step state. */
  meta?:      Record<string, unknown>;
}

/**
 * Returns the ordered list of CTAs for a given step + status.
 * Primary CTA is always first.
 */
export function resolveCtas(input: CtaInput): Cta[] {
  const { stepId, status, meta = {} } = input;

  if (status === "locked")    return [];
  if (status === "completed") return resolveCompletedCtas(stepId, meta);

  return resolveActiveCtas(stepId, meta);
}

// ── Active / available / in_progress CTAs ────────────────────────────────────

function resolveActiveCtas(stepId: JourneyStepId, meta: Record<string, unknown>): Cta[] {
  switch (stepId) {
    case JOURNEY_STEP_ID.WELCOME:
      return [
        { key: "start_journey", labelAr: "ابدأ رحلتك", labelEn: "Start Journey",
          href: "/prices", variant: "primary", icon: "ArrowLeft" },
      ];

    case JOURNEY_STEP_ID.DISCOVER_SERVICES:
      return [
        { key: "browse_services", labelAr: "استعرض الخدمات", labelEn: "Browse Services",
          href: "/prices", variant: "primary", icon: "Search" },
        { key: "contact_us", labelAr: "تواصل معنا", labelEn: "Contact Us",
          href: "/contact", variant: "secondary", icon: "MessageSquare" },
      ];

    case JOURNEY_STEP_ID.CONFIGURE_PROJECT:
      return [
        { key: "start_order", labelAr: "ابدأ طلبك", labelEn: "Start Order",
          href: "/order", variant: "primary", icon: "Plus" },
      ];

    case JOURNEY_STEP_ID.REVIEW_PROPOSAL:
      return [
        { key: "view_proposal", labelAr: "راجع العرض", labelEn: "Review Proposal",
          href: meta.quotationId ? `/dashboard?tab=quotations` : "/dashboard",
          variant: "primary", icon: "FileText" },
      ];

    case JOURNEY_STEP_ID.PAYMENT:
      return [
        { key: "complete_payment", labelAr: "أتمم الدفع", labelEn: "Complete Payment",
          href: "/dashboard?tab=invoices", variant: "primary", icon: "CreditCard" },
      ];

    case JOURNEY_STEP_ID.PROJECT_KICKOFF:
      return [
        { key: "view_project", labelAr: "عرض المشروع", labelEn: "View Project",
          href: meta.projectId ? `/project/${meta.projectId}` : "/dashboard",
          variant: "primary", icon: "Rocket" },
      ];

    case JOURNEY_STEP_ID.PRODUCTION:
      return [
        { key: "track_project", labelAr: "تتبع التقدم", labelEn: "Track Progress",
          href: meta.projectId ? `/project/${meta.projectId}/workspace` : "/dashboard",
          variant: "primary", icon: "Activity" },
      ];

    case JOURNEY_STEP_ID.CLIENT_REVIEW:
      return [
        { key: "submit_review", labelAr: "قدم ملاحظاتك", labelEn: "Submit Feedback",
          href: meta.projectId ? `/project/${meta.projectId}/workspace` : "/dashboard",
          variant: "primary", icon: "MessageSquare" },
      ];

    case JOURNEY_STEP_ID.DELIVERY:
      return [
        { key: "accept_delivery", labelAr: "قبول التسليم", labelEn: "Accept Delivery",
          href: meta.projectId ? `/project/${meta.projectId}/workspace` : "/dashboard",
          variant: "primary", icon: "PackageCheck" },
      ];

    case JOURNEY_STEP_ID.SUPPORT:
      return [
        { key: "open_ticket", labelAr: "فتح تذكرة دعم", labelEn: "Open Support Ticket",
          href: "/support", variant: "primary", icon: "Headphones" },
        { key: "help_center", labelAr: "مركز المساعدة", labelEn: "Help Center",
          href: "/help", variant: "secondary", icon: "HelpCircle" },
      ];

    case JOURNEY_STEP_ID.LOYALTY:
      return [
        { key: "view_loyalty", labelAr: "عرض مكافآتي", labelEn: "View My Rewards",
          href: "/loyalty", variant: "primary", icon: "Crown" },
      ];

    default:
      return [];
  }
}

// ── Completed step CTAs (usually secondary — "view details") ─────────────────

function resolveCompletedCtas(stepId: JourneyStepId, meta: Record<string, unknown>): Cta[] {
  switch (stepId) {
    case JOURNEY_STEP_ID.PAYMENT:
      return [
        { key: "view_invoice", labelAr: "عرض الفاتورة", labelEn: "View Invoice",
          href: "/dashboard?tab=invoices", variant: "ghost", icon: "Receipt" },
      ];

    case JOURNEY_STEP_ID.DELIVERY:
      return [
        { key: "view_files", labelAr: "عرض الملفات", labelEn: "View Files",
          href: meta.projectId ? `/project/${meta.projectId}/workspace` : "/dashboard",
          variant: "ghost", icon: "FolderOpen" },
      ];

    default:
      return [];
  }
}
