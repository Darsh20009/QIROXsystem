// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowLeft, Check, ChevronRight, RotateCcw, Send, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { PricingPlan } from "@shared/schema";

type Tier = "lite" | "pro" | "infinite";

function uid() { return Math.random().toString(36).slice(2, 10); }

function slugToTier(slug: string, nameAr: string): Tier {
  const s = (slug + " " + nameAr).toLowerCase();
  if (s.includes("infinite") || s.includes("إنفينيت")) return "infinite";
  if (s.includes("pro") || s.includes("برو")) return "pro";
  return "lite";
}

const TIER_META: Record<Tier, {
  nameAr: string; emoji: string; gradient: string; accent: string;
  border: string; glow: string; desc: string; features: string[]; notFor: string;
}> = {
  lite: {
    nameAr: "لايت", emoji: "⚡",
    gradient: "from-slate-600 to-slate-800", accent: "text-slate-200",
    border: "border-slate-600", glow: "shadow-slate-500/20",
    desc: "مثالية للمشاريع الناشئة والأعمال الصغيرة. كل الأساسيات لإطلاق وجودك الرقمي.",
    features: ["موقع إلكتروني احترافي", "إدارة الخدمات والمنتجات", "نظام الطلبات الأساسي", "لوحة تحكم خاصة", "دعم فني أساسي"],
    notFor: "غير مناسبة لمن يحتاج تطبيق جوال أو ميزات متقدمة.",
  },
  pro: {
    nameAr: "برو", emoji: "🚀",
    gradient: "from-blue-600 to-indigo-700", accent: "text-blue-100",
    border: "border-blue-500", glow: "shadow-blue-500/30",
    desc: "للمشاريع المتنامية. تطبيق جوال، بوابات دفع، ذكاء اصطناعي، وتحليلات متقدمة.",
    features: ["كل ميزات لايت +", "تطبيق جوال (iOS & Android)", "بوابات الدفع الإلكتروني", "CRM وإدارة العملاء", "تقارير وتحليلات متقدمة", "ذكاء اصطناعي مدمج"],
    notFor: "قد تكون أكثر مما تحتاجه إذا كان مشروعك بسيطاً.",
  },
  infinite: {
    nameAr: "إنفينيت", emoji: "♾️",
    gradient: "from-amber-500 to-orange-600", accent: "text-amber-100",
    border: "border-amber-400", glow: "shadow-amber-500/30",
    desc: "للمشاريع الكبيرة والشركات. تخصيص كامل، خادم مخصص، وفريق دعم 24/7.",
    features: ["كل ميزات برو +", "تخصيص كامل بلا حدود", "خادم مخصص حصري", "تكاملات API خارجية", "فريق دعم مخصص 24/7", "أولوية في التسليم"],
    notFor: "ليست الخيار الأمثل لمن يبحث عن سعر منخفض.",
  },
};

/* ── Price section from API ── */
function PriceSection({ tier, plans }: { tier: Tier; plans: PricingPlan[] }) {
  const tierPlans = plans.filter(p => slugToTier(p.slug, p.nameAr) === tier && p.status === "active");
  const monthly  = tierPlans.find(p => p.billingCycle === "monthly");
  const yearly   = tierPlans.find(p => p.billingCycle === "yearly");
  const lifetime = tierPlans.find(p => p.billingCycle === "one_time");
  if (!tierPlans.length) return null;
  return (
    <div className="bg-white/[0.02] px-5 py-4 border-t border-white/[0.06]">
      <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">الأسعار</p>
      {monthly  && <PriceRow label="شهري"           price={monthly.price}  currency={monthly.currency} />}
      {yearly   && <PriceRow label="سنوي (الأوفر)"  price={yearly.price}   currency={yearly.currency}  highlight />}
      {lifetime && <PriceRow label="مدى الحياة"     price={lifetime.price} currency={lifetime.currency} />}
    </div>
  );
}

function PriceRow({ label, price, currency = "SAR", highlight }: { label: string; price: number; currency?: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${highlight ? "bg-white/10" : ""}`}>
      <span className="text-xs text-white/50">{label}</span>
      <span className={`text-sm font-bold ${highlight ? "text-white" : "text-white/70"}`}>
        {price.toLocaleString()} <span className="text-[10px] font-normal">{currency === "SAR" ? "ر.س" : currency}</span>
      </span>
    </div>
  );
}

/* ── Comparison table ── */
function CompareTable({ plans }: { plans: PricingPlan[] }) {
  const tiers: Tier[] = ["lite", "pro", "infinite"];
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-xs text-right border-collapse">
        <thead>
          <tr>
            <th className="py-2 px-3 text-white/30 font-normal text-right">الباقة</th>
            {tiers.map(t => (
              <th key={t} className="py-2 px-3 text-center">
                <span className="text-white/80 font-bold">{TIER_META[t].emoji} {TIER_META[t].nameAr}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {["monthly", "yearly", "one_time"].map(cycle => {
            const labels: Record<string, string> = { monthly: "شهري", yearly: "سنوي", one_time: "مدى الحياة" };
            return (
              <tr key={cycle} className="border-t border-white/[0.05]">
                <td className="py-2 px-3 text-white/40">{labels[cycle]}</td>
                {tiers.map(t => {
                  const p = plans.find(pl => slugToTier(pl.slug, pl.nameAr) === t && pl.billingCycle === cycle && pl.status === "active");
                  return (
                    <td key={t} className="py-2 px-3 text-center text-white/70 font-bold">
                      {p ? `${p.price.toLocaleString()} ر.س` : "—"}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {[
            { label: "تطبيق جوال", tiers: [false, true, true] },
            { label: "ذكاء اصطناعي", tiers: [false, true, true] },
            { label: "دعم 24/7",    tiers: [false, false, true] },
            { label: "خادم مخصص",  tiers: [false, false, true] },
          ].map(row => (
            <tr key={row.label} className="border-t border-white/[0.05]">
              <td className="py-2 px-3 text-white/40">{row.label}</td>
              {row.tiers.map((v, i) => (
                <td key={i} className={`py-2 px-3 text-center ${v ? "text-emerald-400" : "text-red-400"}`}>{v ? "✓" : "✗"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Typing indicator ── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400/70"
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />
      ))}
    </div>
  );
}

/* ── Message bubble ── */
function renderMsg(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

/* ══ Main Modal ══ */
interface ChatMsg { id: string; from: "ai" | "user"; text: string; }

export function PackageFinderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [tier, setTier] = useState<Tier | null>(null);
  const [reasoning, setReasoning] = useState("");
  const [showCompare, setShowCompare] = useState(false);
  const [sessionId] = useState(() => uid());
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: plans = [] } = useQuery<PricingPlan[]>({ queryKey: ["/api/pricing"] });

  /* scroll to bottom */
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  /* greeting when modal opens */
  useEffect(() => {
    if (open) {
      setMessages([{
        id: uid(), from: "ai",
        text: "أهلاً! 👋 أنا مساعد QIROX الذكي.\n\nأخبرني باختصار عن مشروعك أو نشاطك، وسأختار لك الباقة المثالية تلقائياً 🎯",
      }]);
      setInput("");
      setDone(false);
      setTier(null);
      setReasoning("");
      setShowCompare(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading || done) return;

    setMessages(prev => [...prev, { id: uid(), from: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/package-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, sessionId }),
      });
      const data = await res.json();

      if (data.done && data.tier) {
        if (data.reply) setMessages(prev => [...prev, { id: uid(), from: "ai", text: data.reply }]);
        setTier(data.tier as Tier);
        setReasoning(data.reasoning || "");
        setDone(true);
        setMessages(prev => [...prev, {
          id: uid(), from: "ai",
          text: `بناءً على محادثتنا، الباقة الأنسب لك هي **باقة ${TIER_META[data.tier as Tier].nameAr}** ${TIER_META[data.tier as Tier].emoji}\n\n${data.reasoning || TIER_META[data.tier as Tier].desc}\n\n👇 إليك التفاصيل الكاملة:`,
        }]);
      } else {
        setMessages(prev => [...prev, { id: uid(), from: "ai", text: data.reply || "عذراً، حدث خطأ مؤقت." }]);
      }
    } catch {
      setMessages(prev => [...prev, { id: uid(), from: "ai", text: "⚠️ حدث خطأ في الاتصال. حاول مجدداً." }]);
    } finally {
      setLoading(false);
    }
  }, [loading, done, sessionId]);

  function handleReset() {
    setMessages([{ id: uid(), from: "ai", text: "حسناً، لنبدأ من جديد! 🔄\n\nأخبرني عن مشروعك أو نشاطك التجاري:" }]);
    setInput("");
    setDone(false);
    setTier(null);
    setReasoning("");
    setShowCompare(false);
    fetch(`/api/ai/session/${sessionId}`, { method: "DELETE" }).catch(() => {});
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const pkg = tier ? TIER_META[tier] : null;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg bg-[#0d0d1a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
          style={{ maxHeight: "92vh" }}
          dir="rtl"
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-bold">مكتشف الباقة الذكي</p>
                <p className="text-white/30 text-[10px] flex items-center gap-1.5">
                  <motion.span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400"
                    animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                  QIROX AI · يحلل احتياجاتك تلقائياً
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors"
              data-testid="button-close-package-finder"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* ── Chat area ── */}
          <div
            ref={chatRef}
            className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0"
            style={{ scrollbarWidth: "none" }}
          >
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${msg.from === "user" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.from === "ai"
                        ? "bg-white/[0.06] text-white/85 rounded-tl-sm"
                        : "bg-blue-500/20 border border-blue-500/30 text-blue-200 rounded-tr-sm text-right"
                    }`}
                    dangerouslySetInnerHTML={{ __html: renderMsg(msg.text) }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* typing indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="flex justify-end"
              >
                <div className="px-4 py-2 rounded-2xl rounded-tl-sm bg-white/[0.06]">
                  <TypingDots />
                </div>
              </motion.div>
            )}

            {/* Recommendation card */}
            {done && tier && pkg && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className={`rounded-2xl border ${pkg.border} overflow-hidden shadow-xl ${pkg.glow}`}
              >
                {/* Tier header */}
                <div className={`bg-gradient-to-br ${pkg.gradient} px-5 py-4`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{pkg.emoji}</span>
                    <div>
                      <p className="text-white/50 text-[10px] uppercase tracking-widest">باقتك المقترحة</p>
                      <p className="text-white text-xl font-black">باقة {pkg.nameAr}</p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="bg-white/[0.04] px-5 py-4">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-3">ما تشمله الباقة</p>
                  <div className="space-y-1.5">
                    {pkg.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="text-white/70 text-xs">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Real prices from API */}
                <PriceSection tier={tier} plans={plans} />

                {/* Compare toggle */}
                <div className="px-5 pt-3 pb-1">
                  <button
                    onClick={() => setShowCompare(v => !v)}
                    className="w-full flex items-center justify-center gap-1.5 text-white/30 hover:text-white/60 text-xs py-1 transition-colors"
                    data-testid="button-toggle-compare"
                  >
                    {showCompare ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {showCompare ? "إخفاء مقارنة الباقات" : "مقارنة جميع الباقات"}
                  </button>
                </div>

                {/* Comparison table */}
                <AnimatePresence>
                  {showCompare && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden border-t border-white/[0.06]"
                    >
                      <div className="px-3 py-3">
                        <CompareTable plans={plans} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="px-5 pb-5 pt-3 space-y-2">
                  <Link href={`/order?package=${tier}`}>
                    <Button
                      className={`w-full h-11 rounded-xl font-bold text-sm bg-gradient-to-r ${pkg.gradient} hover:opacity-90 text-white border-0 gap-2`}
                      data-testid="button-package-finder-select"
                      onClick={onClose}
                    >
                      اختر باقة {pkg.nameAr}
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/prices">
                    <Button
                      variant="ghost"
                      className="w-full h-9 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.05] text-xs gap-1.5"
                      onClick={onClose}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                      عرض صفحة الأسعار الكاملة
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Chat input ── */}
          <div className="px-5 pb-5 pt-3 flex-shrink-0 border-t border-white/[0.05] space-y-2">
            {done ? (
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-white/25 hover:text-white/50 text-xs transition-colors"
                data-testid="button-finder-restart"
              >
                <RotateCcw className="w-3 h-3" />
                أعد من البداية
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-2.5 focus-within:border-blue-500/40 transition-colors">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && input.trim()) { e.preventDefault(); sendMessage(input); } }}
                  placeholder="اكتب عن مشروعك أو أجب على السؤال..."
                  disabled={loading}
                  className="flex-1 bg-transparent text-white/85 text-sm outline-none placeholder:text-white/20 min-w-0"
                  data-testid="input-project-description"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30 bg-gradient-to-br from-blue-600 to-violet-600"
                  data-testid="button-submit-description"
                >
                  {loading
                    ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                    : <Send className="w-3.5 h-3.5 text-white" style={{ transform: "scaleX(-1)" }} />}
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
