// ── NextActionSection ─────────────────────────────────────────────────────────
// Sprint 003 — Dashboard V2 placeholder section.
// No production wiring. Feature-flagged. Not yet active.
//
// "Next Recommended Action" — surfaces the primary CTA for the active step.

import { motion } from "framer-motion";
import { ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJourneyContext } from "../../context/journey-context";
import { resolveCtas } from "../../engine/cta-engine";
import { JOURNEY_STEP_MAP } from "../../constants";

interface NextActionSectionProps {
  lang?: "ar" | "en";
}

export function NextActionSection({ lang = "ar" }: NextActionSectionProps) {
  const { state } = useJourneyContext();
  const isAr = lang === "ar";

  const stepState = state.steps[state.activeStepId];
  const stepDef   = JOURNEY_STEP_MAP[state.activeStepId];
  const ctas      = resolveCtas({
    stepId: state.activeStepId,
    status: stepState?.status ?? "available",
    meta:   stepState?.meta ?? {},
  });

  const primaryCta = ctas[0];

  if (!primaryCta || state.isComplete) {
    if (state.isComplete) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-black dark:bg-white p-5 flex items-center gap-4"
          dir={isAr ? "rtl" : "ltr"}
        >
          <span className="text-3xl">🎉</span>
          <div>
            <p className="font-bold text-white dark:text-black text-sm">
              {isAr ? "اكتملت رحلتك!" : "Journey complete!"}
            </p>
            <p className="text-xs text-white/70 dark:text-black/60 mt-0.5">
              {isAr ? "شكراً لثقتك بـ QIROX" : "Thank you for choosing QIROX"}
            </p>
          </div>
        </motion.div>
      );
    }
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-gray-50 dark:bg-gray-900/60 p-5"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white dark:text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 mb-0.5">
            {isAr ? "الإجراء المقترح التالي" : "Next Recommended Action"}
          </p>
          <p className="text-sm font-semibold text-black dark:text-white">
            {isAr ? stepDef?.labelAr : stepDef?.labelEn}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isAr ? stepDef?.descriptionAr : stepDef?.descriptionEn}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {ctas.slice(0, 2).map(cta => (
          <Button
            key={cta.key}
            size="sm"
            variant={cta.variant === "primary" ? "default" : "outline"}
            className={`gap-2 text-xs ${
              cta.variant === "primary"
                ? "bg-black dark:bg-white text-white dark:text-black hover:bg-black/90"
                : ""
            }`}
            onClick={() => {
              if (cta.external) {
                window.open(cta.href, "_blank");
              } else {
                window.location.href = cta.href;
              }
            }}
          >
            {isAr ? cta.labelAr : cta.labelEn}
            <ArrowLeft className="w-3 h-3" />
          </Button>
        ))}
      </div>
    </motion.div>
  );
}
