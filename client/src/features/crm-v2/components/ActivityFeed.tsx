// ── ActivityFeed ──────────────────────────────────────────────────────────────
// Sprint 008 — CRM V2. CRM-wide activity feed with stats.
// Behind FEATURE_CRM_V2.

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Activity, Phone, Mail, MessageSquare, Video, FileText, CheckSquare } from "lucide-react";
import { useCrmV2Stats } from "../hooks/useCrmV2";

interface ActivityFeedProps {
  lang?: "ar" | "en";
}

const TYPE_ICONS: Record<string, any> = {
  call: Phone, email: Mail, whatsapp: MessageSquare,
  meeting: Video, note: FileText, task: CheckSquare,
};

const TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  call:             { ar: "مكالمة",     en: "Call" },
  email:            { ar: "بريد",       en: "Email" },
  whatsapp:         { ar: "واتساب",     en: "WhatsApp" },
  meeting:          { ar: "اجتماع",     en: "Meeting" },
  note:             { ar: "ملاحظة",     en: "Note" },
  task:             { ar: "مهمة",       en: "Task" },
  attachment:       { ar: "مرفق",       en: "Attachment" },
  support:          { ar: "دعم",        en: "Support" },
  internal_comment: { ar: "تعليق",      en: "Comment" },
};

export function ActivityFeed({ lang = "ar" }: ActivityFeedProps) {
  const isAr = lang === "ar";
  const { data, isLoading } = useCrmV2Stats();

  const stats = data;
  const byType: Array<{ _id: string; count: number }> = stats?.interactions?.byType ?? [];

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="space-y-5">

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: isAr ? "إجمالي التفاعلات" : "Total Interactions", value: stats?.interactions?.total ?? 0 },
          { label: isAr ? "آخر 30 يوماً" : "Last 30 Days",          value: stats?.interactions?.last30d ?? 0 },
          { label: isAr ? "فرص مفتوحة" : "Open Deals",               value: stats?.opportunities?.open ?? 0 },
          { label: isAr ? "تذكيرات معلقة" : "Pending Reminders",     value: stats?.reminders?.pending ?? 0 },
        ].map((k, i) => (
          <div key={i} className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 p-3 text-center">
            {isLoading ? <Skeleton className="h-7 w-10 mx-auto" /> : (
              <p className="text-xl font-bold text-black dark:text-white">{k.value}</p>
            )}
            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline value */}
      {!isLoading && stats?.opportunities && (
        <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-gray-400" />
            <h4 className="text-sm font-semibold text-black dark:text-white">
              {isAr ? "قيمة الخط" : "Pipeline Value"}
            </h4>
          </div>
          <div className="flex items-end gap-3">
            <div>
              <p className="text-[10px] text-gray-400">{isAr ? "إجمالي" : "Total"}</p>
              <p className="text-xl font-bold text-black dark:text-white">
                {Number(stats.opportunities.totalPipelineValue || 0).toLocaleString()}
                <span className="text-xs font-normal text-gray-400 ms-1">SAR</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">{isAr ? "موزون" : "Weighted"}</p>
              <p className="text-base font-semibold text-black dark:text-white">
                {Math.round(stats.opportunities.weightedPipelineValue || 0).toLocaleString()}
                <span className="text-xs font-normal text-gray-400 ms-1">SAR</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown by interaction type */}
      <div>
        <h4 className="text-sm font-semibold text-black dark:text-white mb-3">
          {isAr ? "التفاعلات حسب النوع" : "Interactions by Type"}
        </h4>
        <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden bg-white dark:bg-gray-900 divide-y divide-black/[0.04] dark:divide-white/[0.04]">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-7 h-7 rounded-lg" />
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="h-3 w-8" />
                </div>
              ))}
            </div>
          ) : byType.length === 0 ? (
            <div className="flex flex-col items-center py-6 gap-2 text-center">
              <span className="text-2xl">📊</span>
              <p className="text-xs text-gray-400">
                {isAr ? "لا توجد بيانات بعد" : "No data yet"}
              </p>
            </div>
          ) : (
            byType.map((item, i) => {
              const Icon = TYPE_ICONS[item._id] ?? Activity;
              const typeLabel = TYPE_LABELS[item._id]?.[isAr ? "ar" : "en"] ?? item._id;
              const max = Math.max(...byType.map(b => b.count), 1);
              const pct = Math.round((item.count / max) * 100);
              return (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-black dark:text-white">{typeLabel}</span>
                      <span className="text-xs font-bold text-black dark:text-white">{item.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-black dark:bg-white"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.04 }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Taxonomy */}
      {!isLoading && stats?.taxonomy && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: isAr ? "التاغات" : "Tags",        value: stats.taxonomy.tags },
            { label: isAr ? "الشرائح" : "Segments",   value: stats.taxonomy.segments },
            { label: isAr ? "القواعد" : "Rules",       value: stats.taxonomy.rules },
          ].map((t, i) => (
            <div key={i} className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 p-3 text-center">
              <p className="text-xl font-bold text-black dark:text-white">{t.value}</p>
              <p className="text-[10px] text-gray-400">{t.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
