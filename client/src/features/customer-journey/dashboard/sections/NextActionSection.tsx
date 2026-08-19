// ── NextActionSection ─────────────────────────────────────────────────────────
// Customer Dashboard V2. Wired to /api/v2/customer/next-action (server-computed).
// Server derives the recommendation from real DB state — not local context.
// Falls back gracefully when the flag is off or there is nothing left to do.

import { motion } from "framer-motion";
import { ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface NextActionSectionProps {
  lang?: "ar" | "en";
}

export function NextActionSection({ lang = "ar" }: NextActionSectionProps) {
  const isAr = lang === "ar";

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/v2/customer/next-action"],
    queryFn: async () => {
      const r = await fetch("/api/v2/customer/next-action");
      if (!r.ok) return null;
      return r.json();
    },
    staleTime: 60_000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-gray-50 dark:bg-gray-900/60 p-5">
        <div className="flex items-start gap-3">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
    );
  }

  // Journey complete
  if (data?.ok && data.action === null) {
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

  const action = data?.action;
  if (!action) return null;

  const urgencyColor =
    action.urgency === "high"
      ? "border-black/20 dark:border-white/20 bg-black/[0.02] dark:bg-white/[0.02]"
      : "border-black/[0.08] dark:border-white/[0.08] bg-gray-50 dark:bg-gray-900/60";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`rounded-2xl border p-5 ${urgencyColor}`}
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
            {isAr ? action.titleAr : action.titleEn}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isAr ? action.descriptionAr : action.descriptionEn}
          </p>
        </div>
        {action.urgency === "high" && (
          <span className="text-[9px] font-bold bg-black dark:bg-white text-white dark:text-black px-1.5 py-0.5 rounded-full flex-shrink-0">
            {isAr ? "عاجل" : "Urgent"}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          className="gap-2 text-xs bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
          onClick={() => { window.location.href = action.href; }}
        >
          {isAr ? action.titleAr : action.titleEn}
          <ArrowLeft className={`w-3 h-3 ${isAr ? "" : "rotate-180"}`} />
        </Button>
      </div>
    </motion.div>
  );
}
