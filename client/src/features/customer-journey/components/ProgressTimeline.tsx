// ── ProgressTimeline ──────────────────────────────────────────────────────────
// Sprint 003 — Architecture only. Not yet active in production.
//
// Visual timeline of all 11 journey steps showing current status.

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Lock, SkipForward } from "lucide-react";
import { useJourneyContext } from "../context/journey-context";
import type { JourneyStepStatus, JourneyStepDefinition } from "../types";

// ── Step dot ──────────────────────────────────────────────────────────────────

function StepDot({ status, isActive }: { status: JourneyStepStatus; isActive: boolean }) {
  if (status === "completed")
    return <CheckCircle2 className="w-5 h-5 text-black dark:text-white" />;
  if (status === "skipped")
    return <SkipForward className="w-5 h-5 text-gray-400" />;
  if (status === "locked")
    return <Lock className="w-4 h-4 text-gray-300 dark:text-gray-600" />;

  return (
    <motion.div
      animate={{ scale: isActive ? [1, 1.15, 1] : 1 }}
      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
    >
      <Circle
        className={`w-5 h-5 ${
          isActive
            ? "text-black dark:text-white fill-black dark:fill-white"
            : "text-gray-300 dark:text-gray-600"
        }`}
      />
    </motion.div>
  );
}

// ── Step row ──────────────────────────────────────────────────────────────────

function StepRow({
  step,
  status,
  isActive,
  isLast,
  lang,
  onClick,
}: {
  step: JourneyStepDefinition;
  status: JourneyStepStatus;
  isActive: boolean;
  isLast: boolean;
  lang: "ar" | "en";
  onClick(): void;
}) {
  const label = lang === "ar" ? step.labelAr : step.labelEn;

  const isClickable = status === "available" || status === "in_progress" || status === "completed";

  return (
    <div className="flex items-start gap-3">
      {/* Dot + connector */}
      <div className="flex flex-col items-center flex-shrink-0">
        <button
          onClick={isClickable ? onClick : undefined}
          className={`flex items-center justify-center w-8 h-8 rounded-full border transition-colors ${
            isActive
              ? "border-black dark:border-white bg-black dark:bg-white"
              : status === "completed" || status === "skipped"
              ? "border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/5"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          } ${isClickable ? "cursor-pointer hover:scale-105 transition-transform" : "cursor-default"}`}
          aria-label={label}
        >
          <div className={isActive ? "text-white dark:text-black" : ""}>
            <StepDot status={status} isActive={isActive} />
          </div>
        </button>
        {!isLast && (
          <div
            className={`w-px flex-1 min-h-[24px] mt-1 ${
              status === "completed" || status === "skipped"
                ? "bg-black/20 dark:bg-white/20"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
          />
        )}
      </div>

      {/* Label */}
      <div className="pt-1 pb-6">
        <p
          className={`text-sm font-medium leading-tight ${
            isActive
              ? "text-black dark:text-white"
              : status === "locked"
              ? "text-gray-300 dark:text-gray-600"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {step.order}. {label}
        </p>
        {isActive && (
          <p className="text-xs text-gray-400 mt-0.5">
            {lang === "ar" ? "الخطوة الحالية" : "Current step"}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface ProgressTimelineProps {
  lang?: "ar" | "en";
}

export function ProgressTimeline({ lang = "ar" }: ProgressTimelineProps) {
  const { state, steps, setActiveStep } = useJourneyContext();

  return (
    <div className="py-4 px-2" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">
            {lang === "ar" ? "تقدم الرحلة" : "Journey Progress"}
          </span>
          <span className="text-xs font-bold text-black dark:text-white">
            {state.progressPercent}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-black dark:bg-white"
            initial={{ width: 0 }}
            animate={{ width: `${state.progressPercent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Steps */}
      <div>
        {steps.map((step, idx) => {
          const stepState = state.steps[step.id];
          const status: JourneyStepStatus = stepState?.status ?? "locked";
          const isActive = state.activeStepId === step.id;
          const isLast   = idx === steps.length - 1;

          return (
            <StepRow
              key={step.id}
              step={step}
              status={status}
              isActive={isActive}
              isLast={isLast}
              lang={lang}
              onClick={() => setActiveStep(step.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
