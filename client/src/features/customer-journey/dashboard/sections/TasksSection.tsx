// ── TasksSection ──────────────────────────────────────────────────────────────
// Sprint 003 — Dashboard V2 placeholder section.
// No production wiring. Feature-flagged. Not yet active.

import { CheckSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EMPTY_STATES } from "../../components/EmptyState";

interface TasksSectionProps {
  lang?: "ar" | "en";
  isLoading?: boolean;
}

export function TasksSection({ lang = "ar", isLoading = false }: TasksSectionProps) {
  const isAr = lang === "ar";
  return (
    <section dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center gap-2 mb-3">
        <CheckSquare className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-black dark:text-white">
          {isAr ? "المهام" : "Tasks"}
        </h3>
      </div>
      <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden">
        {isLoading
          ? <div className="p-4 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
          : EMPTY_STATES.tasks(lang)
        }
      </div>
    </section>
  );
}
