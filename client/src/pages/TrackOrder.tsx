import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CheckCircle2, Clock, XCircle, Phone, Video, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

type LeadStatus = "pending" | "confirmed" | "rejected" | "cancelled" | "completed";

interface TrackResult {
  refNumber: string;
  clientName: string;
  status: LeadStatus;
  topic: string;
  createdAt: string;
  consultationType: string;
  employeeName: string | null;
  adminNotes: string | null;
}

const STATUS_CONFIG: Record<LeadStatus, { label_ar: string; label_en: string; icon: any; color: string; bg: string; dot: string }> = {
  pending: {
    label_ar: "قيد المراجعة", label_en: "Under Review",
    icon: Clock, color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  confirmed: {
    label_ar: "تم التأكيد", label_en: "Confirmed",
    icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
  completed: {
    label_ar: "مكتمل", label_en: "Completed",
    icon: CheckCircle2, color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
  },
  rejected: {
    label_ar: "مرفوض", label_en: "Rejected",
    icon: XCircle, color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    dot: "bg-red-500",
  },
  cancelled: {
    label_ar: "ملغي", label_en: "Cancelled",
    icon: XCircle, color: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
  },
};

const STEPS: { status: LeadStatus; label_ar: string; label_en: string }[] = [
  { status: "pending", label_ar: "استلام الطلب", label_en: "Received" },
  { status: "confirmed", label_ar: "تأكيد التواصل", label_en: "Confirmed" },
  { status: "completed", label_ar: "اكتمال المتابعة", label_en: "Completed" },
];

const STEP_ORDER: LeadStatus[] = ["pending", "confirmed", "completed"];

function getStepIndex(status: LeadStatus): number {
  if (status === "rejected" || status === "cancelled") return -1;
  return STEP_ORDER.indexOf(status);
}

export default function TrackOrder() {
  const { lang, dir } = useI18n();
  const L = lang === "ar";

  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleTrack(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const cleaned = ref.trim().toUpperCase();
    if (!cleaned) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const r = await fetch(`/api/track/${encodeURIComponent(cleaned)}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "حدث خطأ");
      setResult(data);
    } catch (err: any) {
      setError(err.message || (L ? "لم يتم العثور على الطلب" : "Order not found"));
    } finally {
      setLoading(false);
    }
  }

  const cfg = result ? (STATUS_CONFIG[result.status] || STATUS_CONFIG.pending) : null;
  const stepIdx = result ? getStepIndex(result.status) : -1;
  const isNegative = result && (result.status === "rejected" || result.status === "cancelled");

  return (
    <div dir={dir} className="min-h-screen bg-white dark:bg-black flex flex-col">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-black via-black to-black/90 text-white pt-20 pb-16 px-4">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #6366f1 0%, transparent 50%), radial-gradient(circle at 80% 20%, #818cf8 0%, transparent 40%)" }}
        />
        <div className="relative max-w-lg mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {L ? "تتبع طلبك" : "Track Your Order"}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              {L ? "تتبّع حالة طلبك" : "Track Your Request"}
            </h1>
            <p className="text-white/60 text-sm">
              {L
                ? "أدخل رقم المرجع الذي حصلت عليه بعد إرسال طلبك عبر QIROX AI Wizard"
                : "Enter the reference number you received after submitting your request via QIROX AI Wizard"}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-lg mx-auto w-full px-4 -mt-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <form onSubmit={handleTrack} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-black/10 dark:border-white/10 p-5 flex flex-col gap-3">
            <label className="text-xs text-black/40 dark:text-white/40 font-medium tracking-wide uppercase">
              {L ? "رقم المرجع" : "Reference Number"}
            </label>
            <div className="flex gap-2">
              <Input
                data-testid="input-ref-number"
                value={ref}
                onChange={e => setRef(e.target.value)}
                placeholder="QS-XXXXXX"
                className="font-mono text-sm tracking-widest uppercase flex-1"
                maxLength={9}
                onBlur={() => {
                  const cleaned = ref.trim().toUpperCase();
                  if (cleaned && !cleaned.startsWith("QS-") && !cleaned.startsWith("QS")) {
                    setRef("QS-" + cleaned.replace(/^QS-?/, ""));
                  } else {
                    setRef(cleaned);
                  }
                }}
              />
              <Button
                data-testid="button-track"
                type="submit"
                disabled={loading || !ref.trim()}
                className="bg-black text-white dark:bg-white dark:text-black hover:opacity-80 rounded-xl px-4"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-black/30 dark:text-white/30">
              {L ? "مثال: QS-4A2F91 — الرقم يظهر في رسالة التأكيد" : "Example: QS-4A2F91 — Found in your confirmation message"}
            </p>
          </form>
        </motion.div>
      </div>

      {/* Result */}
      <div className="max-w-lg mx-auto w-full px-4 mt-6 pb-16">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-5 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-red-700 dark:text-red-400">{L ? "الطلب غير موجود" : "Not Found"}</p>
                <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-0.5">{error}</p>
              </div>
            </motion.div>
          )}

          {result && cfg && (
            <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Status card */}
              <div className={`rounded-2xl border p-5 mb-4 ${cfg.bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-black/50 dark:text-white/50">{result.refNumber}</span>
                  <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${cfg.color}`}>
                    <span className={`w-2 h-2 rounded-full ${cfg.dot} ${result.status === "pending" ? "animate-pulse" : ""}`} />
                    {L ? cfg.label_ar : cfg.label_en}
                  </span>
                </div>
                <p className="text-lg font-bold text-black dark:text-white mb-0.5">{result.clientName}</p>
                <p className="text-sm text-black/50 dark:text-white/50">{result.topic}</p>
                {result.employeeName && (
                  <p className="text-xs mt-2 text-black/40 dark:text-white/40">
                    {L ? `المسؤول: ${result.employeeName}` : `Assigned to: ${result.employeeName}`}
                  </p>
                )}
                {result.adminNotes && (
                  <div className="mt-3 p-3 rounded-xl bg-white/60 dark:bg-black/30 text-sm text-black/70 dark:text-white/70">
                    <span className="font-semibold block mb-1">{L ? "ملاحظات الفريق:" : "Team Notes:"}</span>
                    {result.adminNotes}
                  </div>
                )}
                <p className="text-xs text-black/30 dark:text-white/30 mt-3">
                  {L ? "تاريخ الإرسال:" : "Submitted:"} {new Date(result.createdAt).toLocaleDateString(L ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>

              {/* Progress steps */}
              {!isNegative && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-black/10 dark:border-white/10 p-5">
                  <p className="text-xs font-semibold text-black/40 dark:text-white/40 uppercase tracking-wide mb-4">
                    {L ? "مراحل الطلب" : "Order Progress"}
                  </p>
                  <div className="flex items-start gap-0">
                    {STEPS.map((step, idx) => {
                      const done = idx <= stepIdx;
                      const active = idx === stepIdx;
                      return (
                        <div key={step.status} className="flex-1 flex flex-col items-center relative">
                          {/* connector line */}
                          {idx < STEPS.length - 1 && (
                            <div className={`absolute top-3.5 ${L ? "right-1/2" : "left-1/2"} w-full h-0.5 ${done && stepIdx > idx ? "bg-black dark:bg-white" : "bg-black/10 dark:bg-white/10"}`} />
                          )}
                          {/* circle */}
                          <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${done ? "bg-black dark:bg-white border-black dark:border-white" : "bg-white dark:bg-zinc-900 border-black/20 dark:border-white/20"}`}>
                            {done
                              ? <CheckCircle2 className={`w-3.5 h-3.5 ${done ? "text-white dark:text-black" : "text-black/20"}`} />
                              : <span className="w-1.5 h-1.5 rounded-full bg-black/20 dark:bg-white/20" />
                            }
                            {active && <span className="absolute inset-0 rounded-full border-2 border-black dark:border-white animate-ping opacity-30" />}
                          </div>
                          <p className={`text-center text-[10px] mt-2 leading-tight ${done ? "text-black dark:text-white font-semibold" : "text-black/30 dark:text-white/30"}`}>
                            {L ? step.label_ar : step.label_en}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="mt-4 flex justify-end">
                <a href="/start" className="inline-flex items-center gap-1.5 text-sm text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors">
                  {L ? "إرسال طلب جديد" : "Submit new request"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
