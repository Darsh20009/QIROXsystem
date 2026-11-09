// ── Customer Journey V2 — Step Registry ──────────────────────────────────────
// Sprint 003 — Architecture only. Not yet active in production.
// Single source of truth for all 11 journey steps.

import { JOURNEY_STEP_ID, type JourneyStepDefinition } from "./types";

// ── Step Registry ─────────────────────────────────────────────────────────────

export const JOURNEY_STEPS: JourneyStepDefinition[] = [
  {
    id:            JOURNEY_STEP_ID.WELCOME,
    order:         1,
    labelAr:       "مرحباً بك",
    labelEn:       "Welcome",
    descriptionAr: "ابدأ رحلتك مع QIROX",
    descriptionEn: "Start your QIROX journey",
    icon:          "Sparkles",
    skippable:     false,
    dependsOn:     [],
  },
  {
    id:            JOURNEY_STEP_ID.DISCOVER_SERVICES,
    order:         2,
    labelAr:       "اكتشف الخدمات",
    labelEn:       "Discover Services",
    descriptionAr: "استعرض الخدمات المتاحة واختر ما يناسبك",
    descriptionEn: "Browse available services and find what fits",
    icon:          "Search",
    skippable:     false,
    dependsOn:     [JOURNEY_STEP_ID.WELCOME],
  },
  {
    id:            JOURNEY_STEP_ID.CONFIGURE_PROJECT,
    order:         3,
    labelAr:       "تهيئة المشروع",
    labelEn:       "Configure Project",
    descriptionAr: "حدد متطلباتك وأضف التفاصيل",
    descriptionEn: "Define your requirements and add details",
    icon:          "Settings2",
    skippable:     false,
    dependsOn:     [JOURNEY_STEP_ID.DISCOVER_SERVICES],
  },
  {
    id:            JOURNEY_STEP_ID.REVIEW_PROPOSAL,
    order:         4,
    labelAr:       "مراجعة العرض",
    labelEn:       "Review Proposal",
    descriptionAr: "راجع العرض والتكاليف قبل الموافقة",
    descriptionEn: "Review the proposal and costs before approving",
    icon:          "FileText",
    skippable:     false,
    dependsOn:     [JOURNEY_STEP_ID.CONFIGURE_PROJECT],
  },
  {
    id:            JOURNEY_STEP_ID.PAYMENT,
    order:         5,
    labelAr:       "الدفع",
    labelEn:       "Payment",
    descriptionAr: "أتمم عملية الدفع لبدء المشروع",
    descriptionEn: "Complete payment to start the project",
    icon:          "CreditCard",
    skippable:     false,
    dependsOn:     [JOURNEY_STEP_ID.REVIEW_PROPOSAL],
  },
  {
    id:            JOURNEY_STEP_ID.PROJECT_KICKOFF,
    order:         6,
    labelAr:       "انطلاق المشروع",
    labelEn:       "Project Kickoff",
    descriptionAr: "اجتماع الانطلاق وتحديد الجدول الزمني",
    descriptionEn: "Kickoff meeting and timeline setup",
    icon:          "Rocket",
    skippable:     false,
    dependsOn:     [JOURNEY_STEP_ID.PAYMENT],
  },
  {
    id:            JOURNEY_STEP_ID.PRODUCTION,
    order:         7,
    labelAr:       "مرحلة التنفيذ",
    labelEn:       "Production",
    descriptionAr: "فريقنا يعمل على مشروعك",
    descriptionEn: "Our team is building your project",
    icon:          "Layers",
    skippable:     false,
    dependsOn:     [JOURNEY_STEP_ID.PROJECT_KICKOFF],
  },
  {
    id:            JOURNEY_STEP_ID.CLIENT_REVIEW,
    order:         8,
    labelAr:       "مراجعة العميل",
    labelEn:       "Client Review",
    descriptionAr: "راجع العمل المنجز وقدم ملاحظاتك",
    descriptionEn: "Review deliverables and provide feedback",
    icon:          "Eye",
    skippable:     false,
    dependsOn:     [JOURNEY_STEP_ID.PRODUCTION],
  },
  {
    id:            JOURNEY_STEP_ID.DELIVERY,
    order:         9,
    labelAr:       "التسليم",
    labelEn:       "Delivery",
    descriptionAr: "استلم مشروعك المكتمل",
    descriptionEn: "Receive your completed project",
    icon:          "PackageCheck",
    skippable:     false,
    dependsOn:     [JOURNEY_STEP_ID.CLIENT_REVIEW],
  },
  {
    id:            JOURNEY_STEP_ID.SUPPORT,
    order:         10,
    labelAr:       "الدعم",
    labelEn:       "Support",
    descriptionAr: "نحن هنا لمساعدتك بعد التسليم",
    descriptionEn: "We're here to help after delivery",
    icon:          "Headphones",
    skippable:     true,
    dependsOn:     [JOURNEY_STEP_ID.DELIVERY],
  },
  {
    id:            JOURNEY_STEP_ID.LOYALTY,
    order:         11,
    labelAr:       "برنامج الولاء",
    labelEn:       "Loyalty",
    descriptionAr: "احصل على مكافآت وعروض حصرية",
    descriptionEn: "Earn rewards and exclusive offers",
    icon:          "Crown",
    skippable:     true,
    dependsOn:     [JOURNEY_STEP_ID.SUPPORT],
  },
];

/** Map for O(1) lookup by step ID. */
export const JOURNEY_STEP_MAP = Object.fromEntries(
  JOURNEY_STEPS.map(s => [s.id, s])
) as Record<string, JourneyStepDefinition>;

/** Total number of journey steps. */
export const JOURNEY_TOTAL_STEPS = JOURNEY_STEPS.length;

/** Query key used by React Query for the journey state. */
export const JOURNEY_QUERY_KEY = ["customer-journey-v2"] as const;

/** Query key for feature flags. */
export const FEATURE_FLAGS_QUERY_KEY = ["public-feature-flags"] as const;

/** Feature flag names consumed by this feature. */
export const FLAG_CUSTOMER_JOURNEY_V2 = "FEATURE_CUSTOMER_JOURNEY_V2";
export const FLAG_DASHBOARD_V2        = "FEATURE_DASHBOARD_V2";
