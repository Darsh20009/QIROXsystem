// ── useJourney ────────────────────────────────────────────────────────────────
// Sprint 003 — Architecture only. Not yet active in production.
//
// Primary consumer hook. Wraps JourneyContext and composes engine utilities
// into a clean API for components.

import { useMemo } from "react";
import { useJourneyContext } from "../context/journey-context";
import { buildProgressSnapshot } from "../engine/progress-engine";
import { resolveCtas } from "../engine/cta-engine";
import { buildChecklist } from "../engine/checklist-engine";
import { getNextStep } from "../engine/journey-engine";
import type {
  JourneyStepId,
  JourneyStepStatus,
  ProgressSnapshot,
  Cta,
  Checklist,
} from "../types";
import { JOURNEY_STEP_MAP } from "../constants";

// ── Main hook ─────────────────────────────────────────────────────────────────

export interface UseJourneyResult {
  // ── State ──────────────────────────────────────────────────────────────────
  activeStepId:    JourneyStepId;
  progressPercent: number;
  isComplete:      boolean;
  isLoading:       boolean;

  // ── Computed ───────────────────────────────────────────────────────────────
  progress:        ProgressSnapshot;
  activeCtas:      Cta[];
  activeChecklist: Checklist;
  nextStepId:      JourneyStepId | null;

  // ── Actions ────────────────────────────────────────────────────────────────
  advanceStep(meta?: Record<string, unknown>): void;
  skipStep(): void;
  goToStep(stepId: JourneyStepId): void;
  resetJourney(): void;
}

export function useJourney(): UseJourneyResult {
  const ctx = useJourneyContext();
  const { state, setStepStatus, setActiveStep, resetJourney, isLoading } = ctx;

  const progress = useMemo(
    () => buildProgressSnapshot(state.steps, state.activeStepId),
    [state.steps, state.activeStepId]
  );

  const activeStepState = state.steps[state.activeStepId];

  const activeCtas = useMemo(
    () => resolveCtas({
      stepId: state.activeStepId,
      status: activeStepState?.status ?? "available",
      meta:   activeStepState?.meta ?? {},
    }),
    [state.activeStepId, activeStepState]
  );

  const activeChecklist = useMemo(
    () => {
      const completedIds = new Set(
        (activeStepState?.meta?.checklistCompleted as string[] | undefined) ?? []
      );
      return buildChecklist(state.activeStepId, completedIds);
    },
    [state.activeStepId, activeStepState]
  );

  const nextStepId = useMemo(() => getNextStep(state), [state]);

  const advanceStep = (meta?: Record<string, unknown>) => {
    // Uses the atomic ADVANCE_STEP reducer action so getNextStep is evaluated
    // against the post-transition state (dependants already unlocked).
    ctx.advanceCurrentStep(state.activeStepId, "completed", meta);
  };

  const skipStep = () => {
    const def = JOURNEY_STEP_MAP[state.activeStepId];
    if (!def?.skippable) return;
    ctx.advanceCurrentStep(state.activeStepId, "skipped");
  };

  const goToStep = (stepId: JourneyStepId) => {
    setActiveStep(stepId);
  };

  return {
    activeStepId:    state.activeStepId,
    progressPercent: state.progressPercent,
    isComplete:      state.isComplete,
    isLoading,
    progress,
    activeCtas,
    activeChecklist,
    nextStepId,
    advanceStep,
    skipStep,
    goToStep,
    resetJourney,
  };
}

// ── Per-step hook ─────────────────────────────────────────────────────────────

export interface UseJourneyStepResult {
  stepId:    JourneyStepId;
  status:    JourneyStepStatus;
  isActive:  boolean;
  ctas:      Cta[];
  checklist: Checklist;
  complete(meta?: Record<string, unknown>): void;
  skip(): void;
}

export function useJourneyStep(stepId: JourneyStepId): UseJourneyStepResult {
  const { state, setStepStatus } = useJourneyContext();
  const stepState = state.steps[stepId];
  const status: JourneyStepStatus = stepState?.status ?? "locked";
  const isActive = state.activeStepId === stepId;

  const ctas = useMemo(
    () => resolveCtas({ stepId, status, meta: stepState?.meta ?? {} }),
    [stepId, status, stepState?.meta]
  );

  const checklist = useMemo(
    () => buildChecklist(stepId, new Set(
      (stepState?.meta?.checklistCompleted as string[] | undefined) ?? []
    )),
    [stepId, stepState?.meta]
  );

  return {
    stepId,
    status,
    isActive,
    ctas,
    checklist,
    complete: (meta) => setStepStatus(stepId, "completed", meta),
    skip:     ()     => setStepStatus(stepId, "skipped"),
  };
}
