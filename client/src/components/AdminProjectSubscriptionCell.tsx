import { CalendarClock, CheckCircle2, Clock3, Loader2, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminProjectSubscriptionCellProps = {
  projectId?: string;
  subscription?: any;
  lang: "ar" | "en";
  adjustmentPending?: boolean;
  onAdjust: (days: number) => void;
};

export default function AdminProjectSubscriptionCell({
  projectId,
  subscription,
  lang,
  adjustmentPending = false,
  onAdjust,
}: AdminProjectSubscriptionCellProps) {
  const L = lang === "ar";
  const [now, setNow] = useState(() => Date.now());
  const [step, setStep] = useState("30");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  if (!subscription) {
    return (
      <div className="min-w-[170px] text-xs text-black/35">
        <div className="flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5" />
          {L ? "لم يبدأ الاشتراك" : "Subscription not started"}
        </div>
      </div>
    );
  }

  const isLifetime = subscription.period === "lifetime";
  const expiresAt = subscription.expiresAt ? new Date(subscription.expiresAt).getTime() : 0;
  const remainingDays = isLifetime
    ? null
    : expiresAt
      ? Math.max(0, Math.ceil((expiresAt - now) / 86400000))
      : 0;
  const expired = !isLifetime && expiresAt > 0 && expiresAt <= now;
  const isActive = !expired && subscription.status === "active";
  const parsedStep = Math.min(3650, Math.max(1, Number.parseInt(step, 10) || 1));

  return (
    <div className="min-w-[190px] space-y-2" data-testid={`admin-project-subscription-${projectId || "unknown"}`}>
      <div className="flex items-center gap-1.5">
        {isActive ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-black/60" />
        ) : expired ? (
          <Clock3 className="w-3.5 h-3.5 text-black/40" />
        ) : (
          <CalendarClock className="w-3.5 h-3.5 text-black/40" />
        )}
        <span className="text-xs font-bold text-black">
          {isLifetime ? (L ? "اشتراك دائم" : "Lifetime") : `${remainingDays} ${L ? "يوم متبقٍ" : "days left"}`}
        </span>
      </div>
      <p className="text-[10px] text-black/40">
        {expired ? (L ? "منتهٍ" : "Expired") : isActive ? (L ? "نشط" : "Active") : (L ? "موقوف" : "Suspended")}
        {expiresAt > 0 && (
          <> · {L ? "ينتهي" : "Ends"} {new Date(expiresAt).toLocaleDateString(L ? "ar-SA" : "en-US", { month: "short", day: "numeric" })}</>
        )}
      </p>
      {!isLifetime && projectId && (
        <div className="flex items-center gap-1" dir="ltr">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="w-7 h-7 rounded-lg"
            onClick={() => onAdjust(-parsedStep)}
            disabled={adjustmentPending || expired && remainingDays === 0}
            title={L ? "تقليل المدة" : "Reduce duration"}
            data-testid={`button-reduce-subscription-${projectId}`}
          >
            {adjustmentPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Minus className="w-3 h-3" />}
          </Button>
          <Input
            type="number"
            min={1}
            max={3650}
            value={step}
            onChange={(event) => setStep(event.target.value)}
            className="h-7 w-14 rounded-lg px-1 text-center text-[10px]"
            aria-label={L ? "عدد الأيام" : "Number of days"}
            data-testid={`input-subscription-days-${projectId}`}
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="w-7 h-7 rounded-lg"
            onClick={() => onAdjust(parsedStep)}
            disabled={adjustmentPending}
            title={L ? "زيادة المدة" : "Increase duration"}
            data-testid={`button-increase-subscription-${projectId}`}
          >
            {adjustmentPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          </Button>
          <span className="text-[10px] text-black/35 ms-1">{L ? "يوم" : "days"}</span>
        </div>
      )}
    </div>
  );
}