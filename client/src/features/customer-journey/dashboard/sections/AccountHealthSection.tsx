// ── AccountHealthSection ───────────────────────────────────────────────────────
// Sprint 007 — Customer Dashboard V2. New section. Live health score.
// Behind FEATURE_DASHBOARD_V2.

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck } from "lucide-react";

interface AccountHealthSectionProps {
  lang?: "ar" | "en";
}

function getHealthLabel(score: number, isAr: boolean) {
  if (score >= 90) return isAr ? "ممتاز" : "Excellent";
  if (score >= 70) return isAr ? "جيد جداً" : "Very Good";
  if (score >= 50) return isAr ? "جيد" : "Good";
  if (score >= 30) return isAr ? "متوسط" : "Fair";
  return isAr ? "يحتاج تحسيناً" : "Needs Attention";
}

function getHealthColor(score: number) {
  if (score >= 70) return "bg-black dark:bg-white";
  if (score >= 40) return "bg-gray-600 dark:bg-gray-300";
  return "bg-gray-400 dark:bg-gray-500";
}

export function AccountHealthSection({ lang = "ar" }: AccountHealthSectionProps) {
  const isAr = lang === "ar";

  const { data: dash, isLoading } = useQuery<any>({
    queryKey: ["/api/v2/client/dashboard"],
    queryFn: async () => {
      const r = await fetch("/api/v2/client/dashboard");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    staleTime: 60_000,
  });

  const score: number = dash?.kpis?.healthScore ?? 0;

  return (
    <section dir={isAr ? "rtl" : "ltr"}>
      <h3 className="text-sm font-semibold text-black dark:text-white mb-3">
        {isAr ? "صحة الحساب" : "Account Health"}
      </h3>
      <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <Skeleton className="h-5 w-24" />
            ) : (
              <p className="text-lg font-bold text-black dark:text-white">
                {score}<span className="text-sm font-normal text-gray-400">/100</span>
              </p>
            )}
            <p className="text-xs text-gray-400">
              {isLoading ? "" : getHealthLabel(score, isAr)}
            </p>
          </div>
        </div>

        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${getHealthColor(score)}`}
            initial={{ width: 0 }}
            animate={{ width: isLoading ? "0%" : `${score}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { ar: "مشاريع نشطة", en: "Active projects", ok: (dash?.kpis?.activeProjects ?? 0) > 0 },
            { ar: "فاتورة مدفوعة", en: "Paid invoice", ok: (dash?.kpis?.paidInvoices ?? 0) > 0 },
            { ar: "إشعارات", en: "Notifications", ok: (dash?.kpis?.unreadNotifications ?? 0) < 5 },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.ok ? "bg-black dark:bg-white" : "bg-gray-200 dark:bg-gray-700"}`} />
              <span className="text-[10px] text-gray-400 leading-tight">{isAr ? item.ar : item.en}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
