// ── ActiveProjectsSection ─────────────────────────────────────────────────────
// Sprint 003 — Dashboard V2 placeholder section.
// No production wiring. Feature-flagged. Not yet active.

import { Layers, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EMPTY_STATES } from "../../components/EmptyState";

interface ActiveProjectsSectionProps {
  lang?: "ar" | "en";
  /** Placeholder — will be wired to real data in Sprint 004+. */
  isLoading?: boolean;
}

export function ActiveProjectsSection({
  lang = "ar",
  isLoading = false,
}: ActiveProjectsSectionProps) {
  const isAr = lang === "ar";

  return (
    <section dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-black dark:text-white">
            {isAr ? "المشاريع النشطة" : "Active Projects"}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1 text-gray-400"
          onClick={() => (window.location.href = "/dashboard")}
        >
          {isAr ? "عرض الكل" : "View All"}
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>

      <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2].map(i => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          /* Placeholder — data wiring in Sprint 004+ */
          EMPTY_STATES.projects(lang)
        )}
      </div>
    </section>
  );
}
