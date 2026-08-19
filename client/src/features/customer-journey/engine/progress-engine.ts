// ── Progress Engine ───────────────────────────────────────────────────────────
// Sprint 003 — Architecture only. Not yet active in production.
//
// Pure functions for computing journey progress.
// No React, no side effects.

import type { JourneyStepId, JourneyStepState, ProgressSnapshot } from "../types";
import { JOURNEY_STEPS, JOURNEY_STEP_MAP } from "../constants";

// ── Core computation ──────────────────────────────────────────────────────────

export function computeProgress(
  steps: Partial<Record<JourneyStepId, JourneyStepState>>,
  totalSteps: number,
): { completedSteps: number; progressPercent: number } {
  let completed = 0;

  for (const step of JOURNEY_STEPS) {
    const s = steps[step.id]?.status;
    if (s === "completed" || s === "skipped") completed++;
  }

  const percent = totalSteps === 0
    ? 0
    : Math.round((completed / totalSteps) * 100);

  return { completedSteps: completed, progressPercent: percent };
}

// ── Snapshot for UI ───────────────────────────────────────────────────────────

export function buildProgressSnapshot(
  steps: Partial<Record<JourneyStepId, JourneyStepState>>,
  activeStepId: JourneyStepId,
): ProgressSnapshot {
  const totalSteps = JOURNEY_STEPS.length;
  const { completedSteps, progressPercent } = computeProgress(steps, totalSteps);
  const currentDef = JOURNEY_STEP_MAP[activeStepId];

  return {
    totalSteps,
    completedSteps,
    progressPercent,
    currentStepOrder:   currentDef?.order ?? 1,
    currentStepLabelAr: currentDef?.labelAr ?? "",
    currentStepLabelEn: currentDef?.labelEn ?? "",
  };
}

// ── Milestones ────────────────────────────────────────────────────────────────
// Named checkpoints for celebratory UI moments.

export type MilestoneKey = "quarter" | "half" | "three_quarters" | "complete";

export interface Milestone {
  key: MilestoneKey;
  threshold: number; // progressPercent at which this fires
  labelAr: string;
  labelEn: string;
}

export const MILESTONES: Milestone[] = [
  { key: "quarter",       threshold: 25,  labelAr: "ربع الطريق",        labelEn: "Quarter way there!" },
  { key: "half",          threshold: 50,  labelAr: "منتصف الطريق",      labelEn: "Halfway there!" },
  { key: "three_quarters",threshold: 75,  labelAr: "ثلاثة أرباع الطريق",labelEn: "Almost there!" },
  { key: "complete",      threshold: 100, labelAr: "اكتملت الرحلة 🎉",  labelEn: "Journey complete! 🎉" },
];

/** Returns the highest milestone reached at the given percent, or null. */
export function getReachedMilestone(percent: number): Milestone | null {
  let reached: Milestone | null = null;
  for (const m of MILESTONES) {
    if (percent >= m.threshold) reached = m;
  }
  return reached;
}
