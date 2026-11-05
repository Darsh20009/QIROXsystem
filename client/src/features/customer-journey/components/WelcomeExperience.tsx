// ── WelcomeExperience ─────────────────────────────────────────────────────────
// Sprint 003 — Architecture only. Not yet active in production.
//
// First-screen experience shown when a client enters the journey for the
// first time or when the WELCOME step is active.

import { motion } from "framer-motion";
import { Sparkles, ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJourney } from "../hooks/use-journey";
import { JOURNEY_STEP_ID } from "../types";

// ── Component ─────────────────────────────────────────────────────────────────

interface WelcomeExperienceProps {
  /** User's display name for personalised greeting. */
  userName?: string;
  /** Language direction — defaults to "ar". */
  lang?: "ar" | "en";
}

export function WelcomeExperience({ userName, lang = "ar" }: WelcomeExperienceProps) {
  const { advanceStep } = useJourney();

  const isAr = lang === "ar";

  const greeting = isAr
    ? `مرحباً${userName ? ` ${userName}` : ""}! 👋`
    : `Welcome${userName ? `, ${userName}` : ""}! 👋`;

  const subtitle = isAr
    ? "نحن سعداء بانضمامك إلى QIROX. دعنا نأخذك في رحلة لتحويل فكرتك إلى واقع."
    : "We're glad you're here. Let us guide you through turning your idea into reality.";

  const handleStart = () => {
    advanceStep({ startedAt: new Date().toISOString() });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center text-center gap-8 py-16 px-6"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4, type: "spring" }}
        className="w-20 h-20 rounded-2xl bg-black dark:bg-white flex items-center justify-center shadow-xl"
      >
        <Sparkles className="w-10 h-10 text-white dark:text-black" />
      </motion.div>

      {/* Greeting */}
      <div className="space-y-3 max-w-md">
        <h1 className="text-3xl font-bold text-black dark:text-white">{greeting}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">{subtitle}</p>
      </div>

      {/* Steps preview */}
      <WelcomeStepsPeek isAr={isAr} />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <Button
          onClick={handleStart}
          className="flex-1 gap-2 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
        >
          {isAr ? "ابدأ رحلتك" : "Start Your Journey"}
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => window.open("https://wa.me/966500000000", "_blank")}
        >
          <MessageSquare className="w-4 h-4" />
          {isAr ? "تواصل معنا" : "Contact Us"}
        </Button>
      </div>
    </motion.div>
  );
}

// ── Steps preview strip ───────────────────────────────────────────────────────

function WelcomeStepsPeek({ isAr }: { isAr: boolean }) {
  const steps = [
    { emoji: "🔍", labelAr: "اكتشف",   labelEn: "Discover" },
    { emoji: "⚙️",  labelAr: "هيّئ",    labelEn: "Configure" },
    { emoji: "💳",  labelAr: "ادفع",    labelEn: "Pay" },
    { emoji: "🚀",  labelAr: "انطلق",   labelEn: "Launch" },
    { emoji: "🎉",  labelAr: "استلم",   labelEn: "Receive" },
  ];

  return (
    <div
      className="flex items-center gap-2 flex-wrap justify-center"
      dir={isAr ? "rtl" : "ltr"}
    >
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">{s.emoji}</span>
            <span className="text-xs text-gray-400">{isAr ? s.labelAr : s.labelEn}</span>
          </div>
          {i < steps.length - 1 && (
            <span className="text-gray-200 dark:text-gray-700 text-lg">
              {isAr ? "←" : "→"}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
