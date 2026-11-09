// ── TasksSection ──────────────────────────────────────────────────────────────
// Sprint 007 — Customer Dashboard V2. Fully implemented with live data.
// Behind FEATURE_DASHBOARD_V2. Existing /dashboard untouched.

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { CheckSquare, Circle, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "../../components/EmptyState";

interface TasksSectionProps {
  lang?: "ar" | "en";
}

const PRIORITY_LABELS: Record<string, { ar: string; en: string }> = {
  low:    { ar: "منخفض", en: "Low" },
  medium: { ar: "متوسط", en: "Medium" },
  high:   { ar: "عالي",  en: "High" },
  urgent: { ar: "عاجل",  en: "Urgent" },
};

export function TasksSection({ lang = "ar" }: TasksSectionProps) {
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

  const tasks = (dash?.issues ?? []).slice(0, 6);
  const open  = tasks.filter((t: any) => t.status !== "closed" && t.status !== "resolved");

  return (
    <section dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center gap-2 mb-3">
        <CheckSquare className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-black dark:text-white">
          {isAr ? "المهام" : "Tasks"}
        </h3>
        {!isLoading && open.length > 0 && (
          <span className="text-[10px] font-bold bg-black dark:bg-white text-white dark:text-black px-1.5 py-0.5 rounded-full">
            {open.length}
          </span>
        )}
      </div>

      <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon="✅"
            titleAr="لا توجد مهام معلقة"
            titleEn="No Pending Tasks"
            subtitleAr="ستظهر مهامك هنا عند بدء المشروع"
            subtitleEn="Your tasks will appear here once a project starts"
            lang={lang}
          />
        ) : (
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04] bg-white dark:bg-gray-900">
            {tasks.map((task: any, i: number) => {
              const done = task.status === "closed" || task.status === "resolved";
              const priority = task.priority || "medium";
              const pLabel = PRIORITY_LABELS[priority]?.[isAr ? "ar" : "en"] ?? priority;
              return (
                <motion.div
                  key={task.id || i}
                  initial={{ opacity: 0, x: isAr ? 8 : -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                  className="flex items-center gap-3 p-3"
                >
                  <div className="flex-shrink-0 text-gray-400">
                    {done
                      ? <CheckCircle2 className="w-4 h-4 text-black dark:text-white" />
                      : <Circle className="w-4 h-4" />
                    }
                  </div>
                  <p className={`flex-1 text-xs leading-tight min-w-0 truncate ${
                    done ? "line-through text-gray-400" : "text-black dark:text-white"
                  }`}>
                    {task.title || task.description || (isAr ? "مهمة" : "Task")}
                  </p>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 h-4 border-black/10 dark:border-white/10 flex-shrink-0"
                  >
                    {pLabel}
                  </Badge>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
