import { CalendarClock, CheckCircle2, Clock3, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type ProjectSubscriptionCardProps = {
  project: any;
  lang: "ar" | "en";
  compact?: boolean;
  onRequestRenewal?: () => void;
  renewalPending?: boolean;
};

function getLiveSubscription(subscription: any, now: number) {
  if (!subscription) return null;
  const expiresAt = subscription.expiresAt ? new Date(subscription.expiresAt).getTime() : 0;
  const startedAt = subscription.startedAt ? new Date(subscription.startedAt).getTime() : 0;
  const remainingDays = subscription.period === "lifetime"
    ? null
    : expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / 86400000)) : 0;
  const expired = expiresAt > 0 && expiresAt <= now;
  const totalMs = startedAt && expiresAt ? Math.max(1, expiresAt - startedAt) : 1;
  const percentRemaining = subscription.period === "lifetime"
    ? 100
    : expiresAt ? Math.max(0, Math.min(100, Math.round(((expiresAt - now) / totalMs) * 100))) : 0;
  return { ...subscription, status: expired ? "expired" : subscription.status, remainingDays, percentRemaining };
}

export default function ProjectSubscriptionCard({ project, lang, compact = false, onRequestRenewal, renewalPending = false }: ProjectSubscriptionCardProps) {
  const L = lang === "ar";
  const [now, setNow] = useState(() => Date.now());
  const subscription = useMemo(() => getLiveSubscription(project?.subscription, now), [project?.subscription, now]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const status = subscription?.status || "not_started";
  const active = status === "active";
  const expired = status === "expired";
  const renewalRequestPending = project?.subscriptionRenewalRequest?.status === "pending";
  const periodLabel = subscription?.period === "monthly"
    ? (L ? "شهري" : "Monthly")
    : subscription?.period === "6months"
      ? (L ? "6 أشهر" : "6 months")
        : subscription?.period === "annual"
        ? (L ? "سنوي" : "Annual")
          : subscription?.period === "lifetime"
            ? (L ? "دائم" : "Lifetime")
        : "";

  return (
    <div className={`rounded-2xl border border-black/[0.07] dark:border-white/[0.08] bg-white dark:bg-gray-900 ${compact ? "p-3" : "p-4"}`} data-testid={`project-subscription-card-${project?.id || "unknown"}`}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] flex items-center justify-center shrink-0">
          {active ? <CheckCircle2 className="w-5 h-5 text-black dark:text-white" /> : expired ? <Clock3 className="w-5 h-5 text-black/50 dark:text-white/50" /> : <CalendarClock className="w-5 h-5 text-black/50 dark:text-white/50" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-sm text-black dark:text-white">{L ? "اشتراك المشروع" : "Project subscription"}</p>
            <span className="text-[10px] font-bold text-black/50 dark:text-white/50">
              {active ? (L ? "نشط" : "Active") : expired ? (L ? "منتهٍ" : "Expired") : status === "suspended" ? (L ? "موقوف" : "Suspended") : (L ? "لم يبدأ" : "Not started")}
            </span>
          </div>
          {subscription ? (
            <>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-2xl font-black text-black dark:text-white">{subscription.period === "lifetime" ? "∞" : subscription.remainingDays}</span>
                <span className="text-[10px] text-black/45 dark:text-white/45 mb-1">{subscription.period === "lifetime" ? (L ? "اشتراك دائم" : "Lifetime access") : (L ? "يوم متبقي" : "days remaining")}</span>
                {periodLabel && <span className="text-[10px] text-black/45 dark:text-white/45 mb-1 ms-auto">{periodLabel}</span>}
              </div>
              <div className="h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden mt-2">
                <div className="h-full rounded-full bg-black dark:bg-white transition-all" style={{ width: `${subscription.percentRemaining}%` }} />
              </div>
              {subscription.expiresAt && (
                <p className="text-[10px] text-black/45 dark:text-white/45 mt-2">
                  {L ? "ينتهي في" : "Expires"}: {new Date(subscription.expiresAt).toLocaleDateString(L ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}
              {expired && onRequestRenewal && (
                renewalRequestPending ? (
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-black/55 dark:text-white/55" data-testid={`renewal-request-pending-${project?.id}`}>
                    <Clock3 className="w-3.5 h-3.5" />
                    {L ? "تم إرسال طلب التجديد — بانتظار مراجعة الفريق" : "Renewal request sent — waiting for the team"}
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={onRequestRenewal}
                    disabled={renewalPending}
                    className="mt-3 h-8 w-full rounded-xl bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80 text-xs font-bold gap-1.5"
                    data-testid={`button-request-project-renewal-${project?.id}`}
                  >
                    {renewalPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    {L ? "طلب تجديد الاشتراك" : "Request Subscription Renewal"}
                  </Button>
                )
              )}
            </>
          ) : (
            <p className="text-xs text-black/50 dark:text-white/50 mt-1">
              {L ? "يبدأ العداد تلقائياً عند اكتمال المشروع." : "The countdown starts automatically when the project is completed."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}