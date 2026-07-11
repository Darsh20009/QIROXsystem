// ── TimelineSection ────────────────────────────────────────────────────────────
// Sprint 007 — Customer Dashboard V2. New section. Project timeline.
// Behind FEATURE_DASHBOARD_V2.

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Clock, CheckCircle2, Circle, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TimelineSectionProps {
  lang?: "ar" | "en";
}

const PHASES = [
  { key: "discovery",   ar: "الاكتشاف",   en: "Discovery" },
  { key: "design",      ar: "التصميم",    en: "Design" },
  { key: "development", ar: "التطوير",    en: "Development" },
  { key: "testing",     ar: "الاختبار",   en: "Testing" },
  { key: "launch",      ar: "الإطلاق",    en: "Launch" },
];

function phaseIndex(phase: string) {
  return PHASES.findIndex(p => p.key === phase);
}

export function TimelineSection({ lang = "ar" }: TimelineSectionProps) {
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

  const activeProjects = (dash?.projects ?? []).filter(
    (p: any) => p.status !== "completed" && p.status !== "cancelled"
  );
  const project = activeProjects[0];

  if (!isLoading && !project) return null;

  const currentPhaseIdx = project ? phaseIndex(project.currentPhase || "discovery") : 0;

  return (
    <section dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-black dark:text-white">
          {isAr ? "التايم لاين" : "Project Timeline"}
        </h3>
        {!isLoading && project && (
          <span className="text-[10px] text-gray-400 truncate max-w-[140px]">
            — {project.name || (isAr ? "مشروع" : "Project")}
          </span>
        )}
      </div>

      <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="h-3.5 flex-1" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-0">
            {PHASES.map((phase, idx) => {
              const done    = idx < currentPhaseIdx;
              const active  = idx === currentPhaseIdx;
              const locked  = idx > currentPhaseIdx;
              const isLast  = idx === PHASES.length - 1;

              return (
                <div key={phase.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: idx * 0.08 }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${
                        done
                          ? "border-black dark:border-white bg-black dark:bg-white"
                          : active
                          ? "border-black dark:border-white bg-white dark:bg-gray-900"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white dark:text-black" />
                      ) : active ? (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          <Circle className="w-3.5 h-3.5 text-black dark:text-white fill-black dark:fill-white" />
                        </motion.div>
                      ) : (
                        <Lock className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                      )}
                    </motion.div>
                    {!isLast && (
                      <div
                        className={`w-0.5 h-6 mt-0.5 ${
                          done
                            ? "bg-black/20 dark:bg-white/20"
                            : "bg-gray-100 dark:bg-gray-800"
                        }`}
                      />
                    )}
                  </div>
                  <div className={`pb-6 pt-1 flex-1 min-w-0 ${isLast ? "pb-0" : ""}`}>
                    <p className={`text-xs font-medium leading-tight ${
                      done || active
                        ? "text-black dark:text-white"
                        : "text-gray-300 dark:text-gray-600"
                    }`}>
                      {isAr ? phase.ar : phase.en}
                    </p>
                    {active && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {isAr ? "المرحلة الحالية" : "Current phase"}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
