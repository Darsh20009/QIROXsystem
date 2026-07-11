// ── FollowUpPanel ─────────────────────────────────────────────────────────────
// Sprint 008 — CRM V2. Follow-up Engine architecture display.
// Shows rules, triggers, actions, and reminder types.
// Automation ships in Sprint 009+. This is the design/config interface.
// Behind FEATURE_CRM_V2.

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Zap, ArrowRight, Settings } from "lucide-react";
import { useFollowUpRules } from "../hooks/useCrmV2";

interface FollowUpPanelProps {
  lang?: "ar" | "en";
}

const CATEGORY_LABELS: Record<string, { ar: string; en: string; icon: any }> = {
  time:  { ar: "زمني",    en: "Time-based", icon: Clock },
  stage: { ar: "مرحلة",   en: "Stage",      icon: ArrowRight },
  score: { ar: "تقييم",   en: "Score",      icon: Zap },
  event: { ar: "حدث",     en: "Event",      icon: AlertTriangle },
};

const PRIORITY_COLORS: Record<string, string> = {
  low:      "border-gray-200 dark:border-gray-700 text-gray-400",
  medium:   "border-gray-300 dark:border-gray-600 text-gray-500",
  high:     "border-gray-500 dark:border-gray-400 text-gray-700 dark:text-gray-200",
  urgent:   "border-gray-700 dark:border-gray-200 text-black dark:text-white",
  critical: "border-black dark:border-white text-black dark:text-white font-bold",
};

export function FollowUpPanel({ lang = "ar" }: FollowUpPanelProps) {
  const isAr = lang === "ar";
  const { data, isLoading } = useFollowUpRules();

  const catalogue = data?.catalogue;
  const rules = data?.rules ?? [];

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="space-y-5">

      {/* Status banner — engine not yet active */}
      <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-gray-900 p-4">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-black dark:text-white">
              {isAr ? "محرك المتابعة — هيكل معماري" : "Follow-Up Engine — Architecture"}
            </p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              {isAr
                ? "هذه القواعد جاهزة من الناحية التقنية. التنفيذ التلقائي (Cron) قيد التطوير ويشحن في Sprint 009+."
                : "Rules are configured and ready. Automated execution (Cron) is in development and ships in Sprint 009+."}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span className="text-[10px] text-gray-400">{isAr ? "الأتمتة: معطلة حتى Sprint 009" : "Automation: disabled until Sprint 009"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trigger Catalogue */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : catalogue?.triggers && (
        <div>
          <h4 className="text-sm font-semibold text-black dark:text-white mb-3">
            {isAr ? "قائلة المحفزات" : "Trigger Catalogue"}
            <span className="text-[10px] font-normal text-gray-400 ms-2">({catalogue.triggers.length})</span>
          </h4>
          <div className="space-y-2">
            {catalogue.triggers.map((t: any, i: number) => {
              const CatMeta = CATEGORY_LABELS[t.category];
              const Icon = CatMeta?.icon ?? Clock;
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-start gap-3 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 p-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-black dark:text-white">
                        {isAr ? t.nameAr : t.nameEn}
                      </span>
                      <Badge variant="outline" className={`text-[9px] h-4 px-1.5 border ${PRIORITY_COLORS[t.defaultPriority]}`}>
                        {t.defaultPriority}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-black/10 dark:border-white/10">
                        {isAr ? CatMeta?.ar : CatMeta?.en}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{t.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Catalogue */}
      {!isLoading && catalogue?.actions && (
        <div>
          <h4 className="text-sm font-semibold text-black dark:text-white mb-3">
            {isAr ? "قائمة الإجراءات" : "Action Catalogue"}
            <span className="text-[10px] font-normal text-gray-400 ms-2">({catalogue.actions.length})</span>
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {catalogue.actions.map((a: any, i: number) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 p-3"
              >
                <p className="text-[11px] font-medium text-black dark:text-white leading-tight">
                  {isAr ? a.nameAr : a.nameEn}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{a.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Configured Rules */}
      <div>
        <h4 className="text-sm font-semibold text-black dark:text-white mb-3">
          {isAr ? "القواعد المكوّنة" : "Configured Rules"}
          <span className="text-[10px] font-normal text-gray-400 ms-2">({rules.length})</span>
        </h4>
        {isLoading ? (
          <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : rules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/[0.1] dark:border-white/[0.1] p-6 flex flex-col items-center gap-2 text-center">
            <span className="text-2xl">⚙️</span>
            <p className="text-xs text-gray-400">
              {isAr ? "لا توجد قواعد مكوّنة بعد" : "No rules configured yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {rules.map((rule: any, i: number) => (
              <div key={rule.id || i} className="flex items-center gap-3 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 p-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${rule.isActive ? "bg-black dark:bg-white" : "bg-gray-200 dark:bg-gray-700"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-black dark:text-white truncate">
                    {isAr ? (rule.nameAr || rule.name) : rule.name}
                  </p>
                  <p className="text-[10px] text-gray-400">{rule.trigger} · {rule.priority}</p>
                </div>
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-black/10 dark:border-white/10 flex-shrink-0">
                  {rule.isActive ? (isAr ? "نشط" : "Active") : (isAr ? "معطل" : "Inactive")}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Priority Framework */}
      {!isLoading && catalogue?.priorityFramework && (
        <div>
          <h4 className="text-sm font-semibold text-black dark:text-white mb-3">
            {isAr ? "إطار الأولويات" : "Priority Framework"}
          </h4>
          <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 overflow-hidden divide-y divide-black/[0.04] dark:divide-white/[0.04]">
            {Object.entries(catalogue.priorityFramework).map(([level, config]: [string, any]) => (
              <div key={level} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: config.color }} />
                  <span className="text-xs font-medium text-black dark:text-white capitalize">{level}</span>
                  <span className="text-[10px] text-gray-400">{isAr ? config.label.ar : config.label.en}</span>
                </div>
                <div className="text-[10px] text-gray-400 text-right">
                  <span>{isAr ? "رد خلال" : "Respond in"} {config.responseWindowHours}h</span>
                  {config.escalateAfterHours && (
                    <span className="ms-2">{isAr ? "تصعيد بعد" : "Escalate after"} {config.escalateAfterHours}h</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
