// ── ActiveProjectsSection ─────────────────────────────────────────────────────
// Sprint 007 — Customer Dashboard V2. Fully implemented with live data.
// Behind FEATURE_DASHBOARD_V2. Existing /dashboard untouched.

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Layers, ExternalLink, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { EmptyState } from "../../components/EmptyState";

interface ActiveProjectsSectionProps {
  lang?: "ar" | "en";
}

const PHASE_LABELS: Record<string, { ar: string; en: string }> = {
  discovery:   { ar: "الاكتشاف",  en: "Discovery" },
  design:      { ar: "التصميم",   en: "Design" },
  development: { ar: "التطوير",   en: "Development" },
  testing:     { ar: "الاختبار",  en: "Testing" },
  launch:      { ar: "الإطلاق",   en: "Launch" },
  completed:   { ar: "مكتمل",     en: "Completed" },
};

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  active:     { ar: "نشط",      en: "Active" },
  in_progress:{ ar: "قيد التنفيذ", en: "In Progress" },
  on_hold:    { ar: "متوقف",    en: "On Hold" },
  completed:  { ar: "مكتمل",   en: "Completed" },
  cancelled:  { ar: "ملغي",    en: "Cancelled" },
};

export function ActiveProjectsSection({ lang = "ar" }: ActiveProjectsSectionProps) {
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

  const allProjects = dash?.projects ?? [];
  const active = allProjects.filter(
    (p: any) => p.status !== "completed" && p.status !== "cancelled"
  );

  return (
    <section dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-black dark:text-white">
            {isAr ? "المشاريع النشطة" : "Active Projects"}
          </h3>
          {!isLoading && active.length > 0 && (
            <span className="text-[10px] font-bold bg-black dark:bg-white text-white dark:text-black px-1.5 py-0.5 rounded-full">
              {active.length}
            </span>
          )}
        </div>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="text-xs gap-1 text-gray-400 h-7">
            {isAr ? "عرض الكل" : "View All"}
            <ExternalLink className="w-3 h-3" />
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        ) : active.length === 0 ? (
          <EmptyState
            icon="🗂️"
            titleAr="لا توجد مشاريع نشطة"
            titleEn="No Active Projects"
            subtitleAr="ابدأ طلبك الأول ليظهر مشروعك هنا"
            subtitleEn="Start your first order to see your project here"
            ctaLabelAr="ابدأ طلبك"
            ctaLabelEn="Start an Order"
            ctaHref="/order"
            lang={lang}
          />
        ) : (
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04] bg-white dark:bg-gray-900">
            {active.slice(0, 4).map((project: any, i: number) => {
              const pct = Math.max(0, Math.min(100, Number(project.completionPercentage ?? 0)));
              const phase = project.currentPhase || "discovery";
              const phaseLabel = PHASE_LABELS[phase]?.[isAr ? "ar" : "en"] ?? phase;
              const statusLabel = STATUS_LABELS[project.status]?.[isAr ? "ar" : "en"] ?? project.status;
              return (
                <motion.div
                  key={project.id || i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  className="p-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black dark:text-white truncate">
                        {project.name || (isAr ? "مشروع بدون اسم" : "Unnamed Project")}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{phaseLabel}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-black/10 dark:border-white/10">
                        {statusLabel}
                      </Badge>
                      <Link href={`/projects/${project.id || project._id}`}>
                        <button className="text-gray-300 hover:text-black dark:hover:text-white transition-colors">
                          <ArrowLeft className={`w-3.5 h-3.5 ${isAr ? "" : "rotate-180"}`} />
                        </button>
                      </Link>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-black dark:bg-white"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.06 }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{pct}% {isAr ? "مكتمل" : "complete"}</p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
