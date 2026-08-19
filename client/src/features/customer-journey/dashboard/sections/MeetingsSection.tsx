// ── MeetingsSection ───────────────────────────────────────────────────────────
// Sprint 007 — Customer Dashboard V2. Fully implemented with live data.
// Behind FEATURE_DASHBOARD_V2. Existing /dashboard untouched.

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Video, Calendar, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../../components/EmptyState";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";

interface MeetingsSectionProps {
  lang?: "ar" | "en";
}

const STATUS_MAP: Record<string, { ar: string; en: string }> = {
  scheduled:  { ar: "مجدول",  en: "Scheduled" },
  completed:  { ar: "منتهي",  en: "Completed" },
  cancelled:  { ar: "ملغي",   en: "Cancelled" },
  pending:    { ar: "معلق",   en: "Pending" },
};

export function MeetingsSection({ lang = "ar" }: MeetingsSectionProps) {
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

  const meetings = (dash?.meetings ?? []).slice(0, 4);

  return (
    <section dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-black dark:text-white">
            {isAr ? "الاجتماعات" : "Meetings"}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1 text-gray-400 h-7"
          onClick={() => window.open("/qmeet", "_blank")}
        >
          {isAr ? "QMeet" : "QMeet"}
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>

      <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <EmptyState
            icon="🎥"
            titleAr="لا توجد اجتماعات مجدولة"
            titleEn="No Scheduled Meetings"
            subtitleAr="يمكنك الانضمام لاجتماع عبر QMeet"
            subtitleEn="Join a meeting via QMeet"
            ctaLabelAr="فتح QMeet"
            ctaLabelEn="Open QMeet"
            onCtaClick={() => window.open("/qmeet", "_blank")}
            lang={lang}
          />
        ) : (
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04] bg-white dark:bg-gray-900">
            {meetings.map((m: any, i: number) => {
              const ts = m.scheduledAt || m.createdAt ? new Date(m.scheduledAt || m.createdAt) : null;
              const dateStr = ts
                ? format(ts, "d MMM, h:mm a", { locale: isAr ? arLocale : enUS })
                : "";
              const statusLabel = STATUS_MAP[m.status]?.[isAr ? "ar" : "en"] ?? m.status;
              return (
                <motion.div
                  key={m.id || i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.25 }}
                  className="flex items-center gap-3 p-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex flex-col items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-black dark:text-white truncate">
                      {m.title || m.type || (isAr ? "اجتماع" : "Meeting")}
                    </p>
                    {dateStr && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{dateStr}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-black/10 dark:border-white/10 flex-shrink-0">
                    {statusLabel}
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
