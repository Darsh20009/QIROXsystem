// ── WelcomeSection ────────────────────────────────────────────────────────────
// Sprint 003 — Dashboard V2 placeholder section.
// No production wiring. Feature-flagged. Not yet active.

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useUser } from "@/hooks/use-auth";

interface WelcomeSectionProps {
  lang?: "ar" | "en";
}

export function WelcomeSection({ lang = "ar" }: WelcomeSectionProps) {
  const { data: user } = useUser();
  const isAr = lang === "ar";

  const hour = new Date().getHours();
  const greeting = isAr
    ? hour < 12 ? "صباح الخير" : hour < 17 ? "مساء الخير" : "مساء النور"
    : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const name = (user as any)?.fullName || (user as any)?.username || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-between gap-4 p-6 rounded-2xl bg-black dark:bg-white text-white dark:text-black"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="space-y-1">
        <p className="text-sm opacity-70">{greeting}</p>
        <h2 className="text-xl font-bold">
          {name ? (isAr ? `${name} ،مرحباً` : `Welcome, ${name}`) : (isAr ? "مرحباً بك" : "Welcome back")}
        </h2>
        <p className="text-xs opacity-60">
          {isAr ? "هذه لوحة رحلتك مع QIROX" : "This is your QIROX journey dashboard"}
        </p>
      </div>
      <div className="w-12 h-12 rounded-xl bg-white/10 dark:bg-black/10 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-6 h-6" />
      </div>
    </motion.div>
  );
}
