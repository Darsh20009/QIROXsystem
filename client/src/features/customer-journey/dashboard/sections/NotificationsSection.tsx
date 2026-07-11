// ── NotificationsSection ──────────────────────────────────────────────────────
// Sprint 007 — Customer Dashboard V2. Fully implemented with live data.
// Behind FEATURE_DASHBOARD_V2. Existing /dashboard untouched.

import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../../components/EmptyState";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ar as arLocale } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";

interface NotificationsSectionProps {
  lang?: "ar" | "en";
}

export function NotificationsSection({ lang = "ar" }: NotificationsSectionProps) {
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

  const markAllRead = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v2/client/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const notifications = (dash?.notifications ?? []).slice(0, 6);
  const unread = notifications.filter((n: any) => !n.read);

  return (
    <section dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-black dark:text-white">
            {isAr ? "الإشعارات" : "Notifications"}
          </h3>
          {!isLoading && unread.length > 0 && (
            <span className="text-[10px] font-bold bg-black dark:bg-white text-white dark:text-black px-1.5 py-0.5 rounded-full">
              {unread.length}
            </span>
          )}
        </div>
        {unread.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 text-gray-400 h-7"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="w-3 h-3" />
            {isAr ? "قراءة الكل" : "Mark all read"}
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="🔔"
            titleAr="لا توجد إشعارات جديدة"
            titleEn="No New Notifications"
            subtitleAr="ستظهر تحديثات مشروعك هنا"
            subtitleEn="Your project updates will appear here"
            lang={lang}
          />
        ) : (
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04] bg-white dark:bg-gray-900">
            {notifications.map((n: any, i: number) => {
              const ts = n.createdAt ? new Date(n.createdAt) : null;
              const timeAgo = ts
                ? formatDistanceToNow(ts, { addSuffix: true, locale: isAr ? arLocale : enUS })
                : "";
              return (
                <motion.div
                  key={n.id || i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-start gap-3 p-3 transition-colors ${
                    !n.read ? "bg-black/[0.02] dark:bg-white/[0.02]" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-sm flex-shrink-0">
                    {n.icon || "🔔"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-black dark:text-white leading-tight">
                      {n.title || (isAr ? "إشعار" : "Notification")}
                    </p>
                    {n.body && (
                      <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
                    )}
                    {timeAgo && (
                      <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5">{timeAgo}</p>
                    )}
                  </div>
                  {!n.read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white flex-shrink-0 mt-1.5" />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
