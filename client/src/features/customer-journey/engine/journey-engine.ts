// ── Journey Engine ────────────────────────────────────────────────────────────
// Sprint 003 — Architecture only. Not yet active in production.
//
// Pure state-machine logic for the Customer Journey V2.
// No React, no side effects — functions only.
// The engine is consumed by the JourneyContext provider.

import {
  JOURNEY_STEP_ID,
  type JourneyStepId,
  type JourneyStepStatus,
  type JourneyState,
  type JourneyStepState,
} from "../types";
import { JOURNEY_STEPS, JOURNEY_STEP_MAP, JOURNEY_TOTAL_STEPS } from "../constants";
import { computeProgress } from "./progress-engine";

// ── Factory: build the initial journey state ──────────────────────────────────

export function createInitialJourneyState(): JourneyState {
  const steps: Partial<Record<JourneyStepId, JourneyStepState>> = {};

  for (const step of JOURNEY_STEPS) {
    steps[step.id] = {
      id:     step.id,
      status: step.order === 1 ? "available" : "locked",
      meta:   {},
    };
  }

  return {
    version:         1,
    activeStepId:    JOURNEY_STEP_ID.WELCOME,
    steps,
    progressPercent: 0,
    isComplete:      false,
    updatedAt:       new Date(),
  };
}

// ── Transition: set a step's status ──────────────────────────────────────────

export function applyStepTransition(
  state: JourneyState,
  stepId: JourneyStepId,
  nextStatus: JourneyStepStatus,
  meta?: Record<string, unknown>,
): JourneyState {
  const currentStepState = state.steps[stepId];
  if (!currentStepState) return state; // unknown step — no-op

  const now = new Date();

  const updatedStep: JourneyStepState = {
    ...currentStepState,
    status:      nextStatus,
    meta:        { ...currentStepState.meta, ...meta },
    startedAt:   nextStatus === "in_progress" ? (currentStepState.startedAt ?? now) : currentStepState.startedAt,
    completedAt: nextStatus === "completed"   ? now : currentStepState.completedAt,
  };

  const updatedSteps: Partial<Record<JourneyStepId, JourneyStepState>> = {
    ...state.steps,
    [stepId]: updatedStep,
  };

  // When a step completes, unlock its direct dependants
  if (nextStatus === "completed" || nextStatus === "skipped") {
    for (const step of JOURNEY_STEPS) {
      if (
        step.dependsOn.includes(stepId) &&
        updatedSteps[step.id]?.status === "locked" &&
        _allDependenciesMet(step.dependsOn, updatedSteps)
      ) {
        updatedSteps[step.id] = {
          ...updatedSteps[step.id]!,
          status: "available",
        };
      }
    }
  }

  const progress = computeProgress(updatedSteps, JOURNEY_TOTAL_STEPS);

  return {
    ...state,
    steps:           updatedSteps,
    progressPercent: progress.progressPercent,
    isComplete:      progress.completedSteps === JOURNEY_TOTAL_STEPS,
    updatedAt:       now,
  };
}

// ── Transition: set the active step pointer ───────────────────────────────────

export function applyActiveStepChange(
  state: JourneyState,
  stepId: JourneyStepId,
): JourneyState {
  const stepState = state.steps[stepId];
  if (!stepState) return state;

  // Can only navigate to available, in_progress, or completed steps
  if (stepState.status === "locked") return state;

  return {
    ...state,
    activeStepId: stepId,
    updatedAt:    new Date(),
  };
}

// ── Serialisation ─────────────────────────────────────────────────────────────
// Store in sessionStorage / server — dates need special handling.

export function serialiseJourneyState(state: JourneyState): string {
  return JSON.stringify(state, (_key, value) => {
    if (value instanceof Date) return { __type: "Date", iso: value.toISOString() };
    return value;
  });
}

export function deserialiseJourneyState(raw: string): JourneyState | null {
  try {
    const parsed = JSON.parse(raw, (_key, value) => {
      if (value && typeof value === "object" && value.__type === "Date") {
        return new Date(value.iso);
      }
      return value;
    });
    if (parsed?.version !== 1) return null; // version mismatch — discard
    return parsed as JourneyState;
  } catch {
    return null;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _allDependenciesMet(
  deps: JourneyStepId[],
  steps: Partial<Record<JourneyStepId, JourneyStepState>>,
): boolean {
  return deps.every(dep => {
    const s = steps[dep]?.status;
    return s === "completed" || s === "skipped";
  });
}

/** Returns the next available/in_progress step after the given one, or null. */
export function getNextStep(state: JourneyState): JourneyStepId | null {
  const currentDef = JOURNEY_STEP_MAP[state.activeStepId];
  if (!currentDef) return null;

  for (const step of JOURNEY_STEPS) {
    if (step.order <= currentDef.order) continue;
    const s = state.steps[step.id]?.status;
    if (s === "available" || s === "in_progress") return step.id;
  }
  return null;
}
