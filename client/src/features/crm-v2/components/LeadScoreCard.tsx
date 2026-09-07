// ── LeadScoreCard ─────────────────────────────────────────────────────────────
// Sprint 008 — CRM V2. Displays computed lead/health/engagement scores.
// Behind FEATURE_CRM_V2.

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { useCustomerScore, useRefreshScore } from "../hooks/useCrmV2";

interface LeadScoreCardProps {
  customerId: string;
  lang?: "ar" | "en";
}

const GRADE_COLORS: Record<string, string> = {
  A: "text-black dark:text-white",
  B: "text-gray-700 dark:text-gray-300",
  C: "text-gray-500 dark:text-gray-400",
  D: "text-gray-400 dark:text-gray-500",
  F: "text-gray-300 dark:text-gray-600",
};

const GRADE_LABELS: Record<string, { ar: string; en: string }> = {
  A: { ar: "ممتاز",          en: "Excellent" },
  B: { ar: "جيد جداً",       en: "Very Good" },
  C: { ar: "متوسط",          en: "Average" },
  D: { ar: "ضعيف",           en: "Weak" },
  F: { ar: "يحتاج تدخلاً",   en: "Needs Attention" },
};

function ScoreBar({ label, labelAr, value, isLoading }: { label: string; labelAr: string; value: number; isLoading: boolean; lang: "ar"|"en" }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-gray-500">{labelAr}</span>
        {isLoading ? <Skeleton className="h-3 w-8" /> : <span className="text-[11px] font-bold text-black dark:text-white">{value}</span>}
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-black dark:bg-white"
          initial={{ width: 0 }}
          animate={{ width: isLoading ? "0%" : `${value}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export function LeadScoreCard({ customerId, lang = "ar" }: LeadScoreCardProps) {
  const isAr = lang === "ar";
  const { data, isLoading } = useCustomerScore(customerId);
  const refresh = useRefreshScore(customerId);

  const score = data?.score;
  const grade = score?.grade ?? "C";

  return (
    <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gray-400" />
          <h4 className="text-sm font-semibold text-black dark:text-white">
            {isAr ? "تقييم العميل" : "Customer Score"}
          </h4>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 text-gray-400"
          onClick={() => refresh.mutate()}
          disabled={refresh.isPending}
        >
          <RefreshCw className={`w-3 h-3 ${refresh.isPending ? "animate-spin" : ""}`} />
          {isAr ? "تحديث" : "Refresh"}
        </Button>
      </div>

      {/* Grade */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`text-5xl font-black ${GRADE_COLORS[grade]}`}>
          {isLoading ? "—" : grade}
        </div>
        <div>
          <p className="text-xs font-medium text-black dark:text-white">
            {isLoading ? "" : (isAr ? GRADE_LABELS[grade]?.ar : GRADE_LABELS[grade]?.en)}
          </p>
          {score?.computedAt && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              {isAr ? "محدّث" : "Updated"} {new Date(score.computedAt).toLocaleDateString(isAr ? "ar-SA" : "en-US")}
            </p>
          )}
        </div>
      </div>

      {/* Score Bars */}
      <div className="space-y-3">
        <ScoreBar label="Lead Score" labelAr="تقييم الاهتمام" value={score?.leadScore ?? 0} isLoading={isLoading} lang={lang} />
        <ScoreBar label="Health Score" labelAr="صحة الحساب" value={score?.healthScore ?? 0} isLoading={isLoading} lang={lang} />
        <ScoreBar label="Engagement" labelAr="مستوى التفاعل" value={score?.engagementScore ?? 0} isLoading={isLoading} lang={lang} />
      </div>

      {/* Signals */}
      {score?.signals && (
        <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.04] grid grid-cols-2 gap-2">
          {[
            { ar: "مشروع نشط",       en: "Active project",  ok: score.signals.hasActiveProject },
            { ar: "فاتورة مدفوعة",   en: "Paid invoice",    ok: score.signals.hasPaidInvoice },
            { ar: "تفاعل حديث",      en: "Recent contact",  ok: score.signals.recentInteraction },
            { ar: "فرصة مفتوحة",     en: "Open deal",       ok: score.signals.openOpportunity },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.ok ? "bg-black dark:bg-white" : "bg-gray-200 dark:bg-gray-700"}`} />
              <span className="text-[10px] text-gray-400">{isAr ? s.ar : s.en}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
