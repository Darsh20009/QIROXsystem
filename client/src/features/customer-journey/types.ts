// ── Customer Journey V2 — Type Definitions ────────────────────────────────────
// Sprint 003 — Architecture only. Not yet active in production.
// All production gating is handled by FEATURE_CUSTOMER_JOURNEY_V2 flag.

// ── Journey Step IDs ─────────────────────────────────────────────────────────

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

// ── Journey Step Status ───────────────────────────────────────────────────────

export type JourneyStepStatus =
  | "locked"        // Not yet reachable
  | "available"     // Reachable but not started
  | "in_progress"   // Currently active
  | "completed"     // Done
  | "skipped";      // Bypassed

// ── Journey Step Definition ───────────────────────────────────────────────────

export interface JourneyStepDefinition {
  /** Unique identifier for this step. */
  id: JourneyStepId;
  /** Display order (1-based). */
  order: number;
  /** Arabic label shown in the UI. */
  labelAr: string;
  /** English label shown in the UI. */
  labelEn: string;
  /** Short Arabic description. */
  descriptionAr: string;
  /** Short English description. */
  descriptionEn: string;
  /** Icon name (lucide-react). */
  icon: string;
  /** Whether this step can be skipped. */
  skippable: boolean;
  /** Steps that must be completed before this one becomes available. */
  dependsOn: JourneyStepId[];
}

// ── Journey Step State ────────────────────────────────────────────────────────

export interface JourneyStepState {
  id: JourneyStepId;
  status: JourneyStepStatus;
  startedAt?: Date;
  completedAt?: Date;
  /** Arbitrary metadata stored per-step (e.g. linked orderId, projectId). */
  meta: Record<string, unknown>;
}

// ── Journey State (full) ──────────────────────────────────────────────────────

export interface JourneyState {
  /** Journey schema version — bump when shape changes. */
  version: 1;
  /** ID of the currently active step. */
  activeStepId: JourneyStepId;
  /** Per-step state map. */
  steps: Partial<Record<JourneyStepId, JourneyStepState>>;
  /** Overall progress 0–100. */
  progressPercent: number;
  /** Whether the full journey is complete. */
  isComplete: boolean;
  /** UTC timestamp of last state mutation. */
  updatedAt: Date;
}

// ── Journey Context value ─────────────────────────────────────────────────────

export interface JourneyContextValue {
  /** Full journey state. */
  state: JourneyState;
  /** Ordered array of step definitions. */
  steps: JourneyStepDefinition[];
  /** Advance a step to a new status. */
  setStepStatus(stepId: JourneyStepId, status: JourneyStepStatus, meta?: Record<string, unknown>): void;
  /** Move the active step pointer. */
  setActiveStep(stepId: JourneyStepId): void;
  /**
   * Atomically complete or skip the given step and advance the active-step
   * pointer to the next unlocked step — computed from the post-transition state.
   * Prefer this over calling setStepStatus + setActiveStep separately.
   */
  advanceCurrentStep(stepId: JourneyStepId, nextStatus?: "completed" | "skipped", meta?: Record<string, unknown>): void;
  /** Reset the journey to initial state (dev/testing only). */
  resetJourney(): void;
  /** True while journey state is loading. */
  isLoading: boolean;
}

// ── CTA (Call to Action) ──────────────────────────────────────────────────────

export type CtaVariant = "primary" | "secondary" | "ghost";

export interface Cta {
  /** Unique key for this CTA (for stable rendering). */
  key: string;
  /** Arabic label. */
  labelAr: string;
  /** English label. */
  labelEn: string;
  /** Target route or URL. */
  href: string;
  /** Visual variant. */
  variant: CtaVariant;
  /** Icon name (lucide-react, optional). */
  icon?: string;
  /** If true, opens in a new tab. */
  external?: boolean;
}

// ── Checklist ─────────────────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string;
  /** Arabic label. */
  labelAr: string;
  /** English label. */
  labelEn: string;
  /** Whether the item is completed. */
  completed: boolean;
  /** Whether the item is required to advance the step. */
  required: boolean;
  /** Step this item belongs to. */
  stepId: JourneyStepId;
}

export interface Checklist {
  stepId: JourneyStepId;
  items: ChecklistItem[];
  /** Computed completion ratio 0–100. */
  completionPercent: number;
  /** True when all required items are completed. */
  canAdvance: boolean;
}

// ── Progress ──────────────────────────────────────────────────────────────────

export interface ProgressSnapshot {
  totalSteps: number;
  completedSteps: number;
  progressPercent: number;
  currentStepOrder: number;
  currentStepLabelAr: string;
  currentStepLabelEn: string;
}

// ── Feature Flags (client-side shape) ────────────────────────────────────────

export interface ClientFeatureFlags {
  FEATURE_CUSTOMER_JOURNEY_V2: boolean;
  FEATURE_DASHBOARD_V2: boolean;
  [key: string]: boolean;
}
