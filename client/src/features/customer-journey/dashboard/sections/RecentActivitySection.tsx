// ── RecentActivitySection ──────────────────────────────────────────────────────
// Sprint 007 — Customer Dashboard V2. New section. Activity feed from notifications.
// Behind FEATURE_DASHBOARD_V2.

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar as arLocale } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";

interface RecentActivitySectionProps {
  lang?: "ar" | "en";
}

export function RecentActivitySection({ lang = "ar" }: RecentActivitySectionProps) {
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

  const activities = (dash?.notifications ?? []).slice(0, 6);

  return (
    <section dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-black dark:text-white">
          {isAr ? "النشاط الأخير" : "Recent Activity"}
        </h3>
      </div>

      <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden bg-white dark:bg-gray-900 divide-y divide-black/[0.04] dark:divide-white/[0.04]">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center px-4">
            <span className="text-2xl">📋</span>
            <p className="text-sm font-medium text-black dark:text-white">
              {isAr ? "لا يوجد نشاط بعد" : "No activity yet"}
            </p>
            <p className="text-xs text-gray-400">
              {isAr ? "سيظهر نشاطك هنا" : "Your activity will appear here"}
            </p>
          </div>
        ) : (
          activities.map((item: any, idx: number) => {
            const ts = item.createdAt ? new Date(item.createdAt) : null;
            const timeAgo = ts
              ? formatDistanceToNow(ts, {
                  addSuffix: true,
                  locale: isAr ? arLocale : enUS,
                })
              : "";
            return (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-start gap-3 p-3"
              >
                <div className="w-8 h-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-base flex-shrink-0">
                  {item.icon || "🔔"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-black dark:text-white truncate">
                    {item.title || (isAr ? "إشعار جديد" : "New notification")}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                    {item.body || ""}
                  </p>
                  {timeAgo && (
                    <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5">{timeAgo}</p>
                  )}
                </div>
                {!item.read && (
                  <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white flex-shrink-0 mt-1.5" />
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </section>
  );
}
