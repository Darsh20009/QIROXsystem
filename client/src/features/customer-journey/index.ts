// ── Customer Journey V2 — Public API ─────────────────────────────────────────
// Sprint 003 — Architecture only. Not yet active in production.
//
// Import from this barrel rather than reaching into sub-directories.
// This keeps import paths stable as the feature matures.

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  JourneyStepId,
  JourneyStepStatus,
  JourneyStepDefinition,
  JourneyStepState,
  JourneyState,
  JourneyContextValue,
  Cta,
  CtaVariant,
  ChecklistItem,
  Checklist,
  ProgressSnapshot,
  ClientFeatureFlags,
} from "./types";
export { JOURNEY_STEP_ID } from "./types";

// ── Constants / registry ──────────────────────────────────────────────────────
export {
  JOURNEY_STEPS,
  JOURNEY_STEP_MAP,
  JOURNEY_TOTAL_STEPS,
  JOURNEY_QUERY_KEY,
  FEATURE_FLAGS_QUERY_KEY,
  FLAG_CUSTOMER_JOURNEY_V2,
  FLAG_DASHBOARD_V2,
} from "./constants";

// ── Engine ────────────────────────────────────────────────────────────────────
export {
  createInitialJourneyState,
  applyStepTransition,
  applyActiveStepChange,
  serialiseJourneyState,
  deserialiseJourneyState,
  getNextStep,
} from "./engine/journey-engine";

export {
  computeProgress,
  buildProgressSnapshot,
  getReachedMilestone,
  MILESTONES,
} from "./engine/progress-engine";

export { resolveCtas }          from "./engine/cta-engine";
export { buildChecklist, toggleChecklistItem } from "./engine/checklist-engine";

// ── Context ───────────────────────────────────────────────────────────────────
export { JourneyProvider, useJourneyContext } from "./context/journey-context";

// ── Hooks ─────────────────────────────────────────────────────────────────────
export { useJourney, useJourneyStep } from "./hooks/use-journey";
export { useFeatureFlags, useFlag }   from "./hooks/use-feature-flags";

// ── Components ────────────────────────────────────────────────────────────────
export { JourneyShell, DashboardV2Guard } from "./components/JourneyShell";
export { WelcomeExperience }             from "./components/WelcomeExperience";
export { ProgressTimeline }              from "./components/ProgressTimeline";
export { EmptyState, EMPTY_STATES }      from "./components/EmptyState";
