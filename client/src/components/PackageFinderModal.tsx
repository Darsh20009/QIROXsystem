import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowLeft, Check, ChevronRight, RotateCcw, Send, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { PricingPlan } from "@shared/schema";

/* ─── Tier helpers ─── */
type Tier = "lite" | "pro" | "infinite";

function slugToTier(slug: string, nameAr: string): Tier {
  const s = (slug + " " + nameAr).toLowerCase();
  if (s.includes("infinite") || s.includes("إنفينيت")) return "infinite";
  if (s.includes("pro") || s.includes("برو")) return "pro";
  return "lite";
}

const TIER_META: Record<Tier, { nameAr: string; emoji: string; gradient: string; accent: string; border: string; glow: string; desc: string; features: string[]; notFor: string }> = {
  lite: {
    nameAr: "لايت",
    emoji: "⚡",
    gradient: "from-slate-600 to-slate-800",
    accent: "text-slate-200",
    border: "border-slate-600",
    glow: "shadow-slate-500/20",
    desc: "مثالية للمشاريع الناشئة والأعمال الصغيرة. كل الأساسيات لإطلاق وجودك الرقمي.",
    features: ["موقع إلكتروني احترافي", "إدارة الخدمات والمنتجات", "نظام الطلبات الأساسي", "لوحة تحكم خاصة", "دعم فني أساسي"],
    notFor: "غير مناسبة لمن يحتاج تطبيق جوال أو ميزات متقدمة.",
  },
  pro: {
    nameAr: "برو",
    emoji: "🚀",
    gradient: "from-blue-600 to-indigo-700",
    accent: "text-blue-100",
    border: "border-blue-500",
    glow: "shadow-blue-500/30",
    desc: "للمشاريع المتنامية. تطبيق جوال، بوابات دفع، ذكاء اصطناعي، وتحليلات متقدمة.",
    features: ["كل ميزات لايت +", "تطبيق جوال (iOS & Android)", "بوابات الدفع الإلكتروني", "CRM وإدارة العملاء", "تقارير وتحليلات متقدمة", "ذكاء اصطناعي مدمج"],
    notFor: "قد تكون أكثر مما تحتاجه إذا كان مشروعك بسيطاً.",
  },
  infinite: {
    nameAr: "إنفينيت",
    emoji: "♾️",
    gradient: "from-amber-500 to-orange-600",
    accent: "text-amber-100",
    border: "border-amber-400",
    glow: "shadow-amber-500/30",
    desc: "للمشاريع الكبيرة والشركات. تخصيص كامل، خادم مخصص، وفريق دعم 24/7.",
    features: ["كل ميزات برو +", "تخصيص كامل بلا حدود", "خادم مخصص حصري", "تكاملات API خارجية", "فريق دعم مخصص 24/7", "أولوية في التسليم"],
    notFor: "ليست الخيار الأمثل لمن يبحث عن سعر منخفض.",
  },
};

/* ─── Questions (sector-neutral) ─── */
const QUESTIONS = [
  {
    id: "goal",
    question: "ما هدفك الرئيسي من النظام؟",
    hint: "أخبرني بالهدف وسأختار الأنسب لك بالضبط",
    options: [
      { label: "🌐 أريد موقعاً احترافياً لعرض خدماتي أو أعمالي", value: "showcase",  score: { lite: 3, pro: 1, infinite: 0 } },
      { label: "💼 أريد نظاماً متكاملاً يدير عملياتي كاملاً",    value: "manage",    score: { lite: 0, pro: 3, infinite: 2 } },
      { label: "🏢 أريد حلاً مؤسسياً مخصصاً بالكامل لشركتي",   value: "enterprise", score: { lite: 0, pro: 1, infinite: 3 } },
      { label: "🚀 أريد الانطلاق بسرعة بأقل تكلفة",             value: "launch",     score: { lite: 3, pro: 1, infinite: 0 } },
    ],
  },
  {
    id: "size",
    question: "ما حجم مشروعك أو نشاطك التجاري؟",
    hint: "يساعدني هذا في تحديد مستوى التعقيد المطلوب",
    options: [
      { label: "🌱 ناشئ (بداية أو فكرة)",          value: "small",  score: { lite: 3, pro: 1, infinite: 0 } },
      { label: "📈 متوسط (يعمل حالياً ويتنامى)",    value: "medium", score: { lite: 1, pro: 3, infinite: 1 } },
      { label: "🏆 كبير (راسخ أو بفروع متعددة)",   value: "large",  score: { lite: 0, pro: 1, infinite: 3 } },
    ],
  },
  {
    id: "mobile",
    question: "هل تحتاج تطبيق جوال خاص بك لعملائك؟",
    hint: "التطبيق يرفع تجربة العميل بشكل كبير",
    options: [
      { label: "📱 نعم، ضروري جداً",      value: "yes",   score: { lite: 0, pro: 3, infinite: 2 } },
      { label: "🔜 ربما لاحقاً",          value: "later", score: { lite: 2, pro: 2, infinite: 1 } },
      { label: "❌ لا أحتاجه الآن",       value: "no",    score: { lite: 3, pro: 1, infinite: 0 } },
    ],
  },
  {
    id: "budget",
    question: "ما ميزانيتك التقريبية للمشروع؟",
    hint: "لا توجد إجابة خاطئة — سأقترح الأنسب",
    options: [
      { label: "💰 أقل من 6,000 ريال",          value: "low",    score: { lite: 3, pro: 0, infinite: 0 } },
      { label: "💰💰 6,000 – 15,000 ريال",       value: "medium", score: { lite: 1, pro: 3, infinite: 0 } },
      { label: "💰💰💰 أكثر من 15,000 ريال",    value: "high",   score: { lite: 0, pro: 1, infinite: 3 } },
    ],
  },
  {
    id: "priority",
    question: "ما الأهم بالنسبة لك في النظام؟",
    hint: "سيساعدني في تحديد المستوى الأمثل",
    options: [
      { label: "🎨 تصميم جذاب واحترافي",       value: "design",   score: { lite: 3, pro: 1, infinite: 1 } },
      { label: "⚙️ ميزات متقدمة وتكاملات",     value: "features", score: { lite: 0, pro: 3, infinite: 2 } },
      { label: "🤖 ذكاء اصطناعي وتحليلات",     value: "ai",       score: { lite: 0, pro: 2, infinite: 3 } },
      { label: "🛡️ دعم فني مكثف وأولوية",      value: "support",  score: { lite: 1, pro: 2, infinite: 3 } },
    ],
  },
];

/* ─── Text-based keyword scoring ─── */
const LITE_KW = ["ناشئ", "بداية", "صغير", "بسيط", "أول", "أساسي", "محدود", "موقع فقط", "بدون تطبيق", "أرخص", "اقتصادي"];
const PRO_KW  = ["تطبيق", "جوال", "متوسط", "متنامي", "دفع", "ولاء", "crm", "تقارير", "تحليل", "متجر", "قسط", "عملاء كثير"];
const INF_KW  = ["شركة", "مؤسسة", "فروع", "api", "خادم", "تكامل", "مخصص", "كبير", "ضخم", "سلسلة", "24/7", "24 ساعة", "إنفينيت"];

function scoreFromText(text: string): Tier {
  const t = text.toLowerCase();
  let lite = 0, pro = 0, inf = 0;
  LITE_KW.forEach(k => { if (t.includes(k)) lite += 2; });
  PRO_KW.forEach(k => { if (t.includes(k)) pro += 2; });
  INF_KW.forEach(k => { if (t.includes(k)) inf += 2; });
  if (inf > pro && inf > lite) return "infinite";
  if (pro >= lite) return "pro";
  return "lite";
}

function calcRecommendation(answers: Record<string, string>, textScore?: Tier): Tier {
  const score: Record<string, number> = { lite: 0, pro: 0, infinite: 0 };
  QUESTIONS.forEach(q => {
    const val = answers[q.id];
    if (!val) return;
    const opt = q.options.find(o => o.value === val);
    if (!opt) return;
    score.lite += opt.score.lite;
    score.pro += opt.score.pro;
    score.infinite += opt.score.infinite;
  });
  if (textScore) {
    score[textScore] += 5;
  }
  if (score.infinite >= score.pro && score.infinite >= score.lite) return "infinite";
  if (score.pro >= score.lite) return "pro";
  return "lite";
}

/* ─── Price display from API ─── */
function PriceSection({ tier, plans }: { tier: Tier; plans: PricingPlan[] }) {
  const tierPlans = plans.filter(p => slugToTier(p.slug, p.nameAr) === tier && p.status === "active");
  const monthly   = tierPlans.find(p => p.billingCycle === "monthly");
  const yearly    = tierPlans.find(p => p.billingCycle === "yearly");
  const lifetime  = tierPlans.find(p => p.billingCycle === "one_time");

  if (tierPlans.length === 0) return null;

  return (
    <div className="bg-white/[0.02] px-5 py-4 border-t border-white/[0.06]">
      <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">الأسعار</p>
      {monthly  && <PriceRow label="شهري"              price={monthly.price}  currency={monthly.currency} />}
      {yearly   && <PriceRow label="سنوي (الأوفر)"     price={yearly.price}   currency={yearly.currency}  highlight />}
      {lifetime && <PriceRow label="مدى الحياة"        price={lifetime.price} currency={lifetime.currency} />}
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

/* ─── Comparison Table ─── */
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
          <tr className="border-t border-white/[0.05]">
            <td className="py-2 px-3 text-white/40">تطبيق جوال</td>
            <td className="py-2 px-3 text-center text-red-400">✗</td>
            <td className="py-2 px-3 text-center text-emerald-400">✓</td>
            <td className="py-2 px-3 text-center text-emerald-400">✓</td>
          </tr>
          <tr className="border-t border-white/[0.05]">
            <td className="py-2 px-3 text-white/40">ذكاء اصطناعي</td>
            <td className="py-2 px-3 text-center text-red-400">✗</td>
            <td className="py-2 px-3 text-center text-emerald-400">✓</td>
            <td className="py-2 px-3 text-center text-emerald-400">✓</td>
          </tr>
          <tr className="border-t border-white/[0.05]">
            <td className="py-2 px-3 text-white/40">دعم 24/7</td>
            <td className="py-2 px-3 text-center text-red-400">✗</td>
            <td className="py-2 px-3 text-center text-red-400">✗</td>
            <td className="py-2 px-3 text-center text-emerald-400">✓</td>
          </tr>
          <tr className="border-t border-white/[0.05]">
            <td className="py-2 px-3 text-white/40">خادم مخصص</td>
            <td className="py-2 px-3 text-center text-red-400">✗</td>
            <td className="py-2 px-3 text-center text-red-400">✗</td>
            <td className="py-2 px-3 text-center text-emerald-400">✓</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ─── Main Modal ─── */
export function PackageFinderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<"text" | "quiz">("text");
  const [textInput, setTextInput] = useState("");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [chatLog, setChatLog] = useState<{ from: "ai" | "user"; text: string }[]>([]);
  const [finished, setFinished] = useState(false);
  const [recommended, setRecommended] = useState<Tier | null>(null);
  const [textTier, setTextTier] = useState<Tier | undefined>(undefined);
  const [animating, setAnimating] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const { data: plans = [] } = useQuery<PricingPlan[]>({ queryKey: ["/api/pricing"] });

  useEffect(() => {
    if (open) {
      setMode("text");
      setTextInput("");
      setStep(0);
      setAnswers({});
      setFinished(false);
      setRecommended(null);
      setTextTier(undefined);
      setAnimating(false);
      setShowCompare(false);
      setChatLog([
        { from: "ai", text: "أهلاً! 👋 أنا مساعد QIROX الذكي.\n\nأخبرني باختصار عن مشروعك أو نشاطك، وسأختار لك الباقة المثالية تلقائياً 🎯\n\nأو إذا أردت، اختر وضع الأسئلة التفصيلية." },
      ]);
    }
  }, [open]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatLog, finished]);

  function startQuiz() {
    setMode("quiz");
    setChatLog(prev => [
      ...prev,
      { from: "user", text: "أريد الأسئلة التفصيلية" },
      { from: "ai", text: QUESTIONS[0].question },
    ]);
  }

  function submitText() {
    if (!textInput.trim()) return;
    const tier = scoreFromText(textInput);
    setTextTier(tier);
    setChatLog(prev => [
      ...prev,
      { from: "user", text: textInput },
      { from: "ai", text: "شكراً! لحظة أحلل متطلباتك... ✨" },
    ]);
    setTextInput("");
    setAnimating(true);
    setTimeout(() => {
      setMode("quiz");
      setStep(0);
      setChatLog(prev => [
        ...prev,
        { from: "ai", text: "فهمت ✅ دعني أكمل بسؤالين سريعين للتأكد:\n\n" + QUESTIONS[0].question },
      ]);
      setAnimating(false);
    }, 1000);
  }

  function handleAnswer(questionId: string, value: string, label: string) {
    if (animating) return;
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    setChatLog(prev => [...prev, { from: "user", text: label }]);
    setAnimating(true);

    const nextStep = step + 1;
    if (nextStep >= QUESTIONS.length) {
      setTimeout(() => {
        setChatLog(prev => [...prev, { from: "ai", text: "ممتاز! لحظة، أحلل إجاباتك... ✨" }]);
        setTimeout(() => {
          const rec = calcRecommendation(newAnswers, textTier);
          setRecommended(rec);
          setFinished(true);
          const meta = TIER_META[rec];
          setChatLog(prev => [...prev,
            { from: "ai", text: `بناءً على وصفك وإجاباتك، الباقة الأنسب لك هي باقة ${meta.nameAr} ${meta.emoji}\n\nهذه الباقة ${meta.desc}\n\n👇 إليك التفاصيل الكاملة:` },
          ]);
          setAnimating(false);
        }, 1200);
      }, 400);
    } else {
      setTimeout(() => {
        setChatLog(prev => [...prev, { from: "ai", text: QUESTIONS[nextStep].question }]);
        setStep(nextStep);
        setAnimating(false);
      }, 500);
    }
  }

  function handleReset() {
    setMode("text");
    setTextInput("");
    setStep(0);
    setAnswers({});
    setFinished(false);
    setRecommended(null);
    setTextTier(undefined);
    setAnimating(false);
    setShowCompare(false);
    setChatLog([
      { from: "ai", text: "حسناً، لنبدأ من جديد! 🔄\n\nأخبرني عن مشروعك أو نشاطك التجاري:" },
    ]);
  }

  const pkg = recommended ? TIER_META[recommended] : null;
  const progress = mode === "text" ? 0 : Math.min(((step + (finished ? 1 : 0)) / QUESTIONS.length) * 100, 100);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
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
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-bold">مكتشف الباقة الذكي</p>
                <p className="text-white/30 text-[10px]">QIROX AI · يحلل احتياجاتك تلقائياً</p>
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

          {/* Progress */}
          {mode === "quiz" && (
            <div className="h-1 bg-white/[0.05] flex-shrink-0">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-violet-500"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          )}

          {/* Chat area */}
          <div
            ref={chatRef}
            className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
            style={{ scrollbarWidth: "none", minHeight: 0 }}
          >
            {chatLog.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className={`flex ${msg.from === "user" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                    msg.from === "ai"
                      ? "bg-white/[0.06] text-white/85 rounded-tl-sm"
                      : "bg-blue-500/20 border border-blue-500/30 text-blue-200 rounded-tr-sm text-right"
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}

            {/* Recommendation card */}
            {finished && pkg && recommended && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
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
                <PriceSection tier={recommended} plans={plans} />

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
                  <Link href={`/order?package=${recommended}`}>
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

          {/* Text input (first step) */}
          {mode === "text" && !finished && (
            <div className="px-5 pb-5 pt-2 flex-shrink-0 border-t border-white/[0.05] space-y-3">
              <div className="relative">
                <textarea
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && textInput.trim()) { e.preventDefault(); submitText(); } }}
                  placeholder="مثال: عندي صالون تجميل أريد نظام حجز مواعيد وتطبيق جوال..."
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 text-white/80 text-sm placeholder:text-white/20 resize-none outline-none focus:border-blue-500/50 transition-colors leading-relaxed"
                  rows={3}
                  data-testid="input-project-description"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={submitText}
                  disabled={!textInput.trim() || animating}
                  className="flex-1 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90 text-white text-sm font-bold border-0 gap-2 disabled:opacity-40"
                  data-testid="button-submit-description"
                >
                  <Send className="w-3.5 h-3.5" />
                  تحليل واختيار الباقة
                </Button>
                <Button
                  onClick={startQuiz}
                  variant="ghost"
                  className="h-10 px-3 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/[0.05] text-xs whitespace-nowrap"
                  data-testid="button-start-quiz"
                >
                  أسئلة تفصيلية
                </Button>
              </div>
            </div>
          )}

          {/* Quiz options */}
          {mode === "quiz" && !finished && (
            <div className="px-5 pb-5 pt-2 flex-shrink-0 border-t border-white/[0.05]">
              {QUESTIONS[step]?.hint && (
                <p className="text-white/25 text-[11px] mb-3 text-center">{QUESTIONS[step].hint}</p>
              )}
              <div className="grid grid-cols-1 gap-2">
                {QUESTIONS[step]?.options.map(opt => (
                  <motion.button
                    key={opt.value}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(QUESTIONS[step].id, opt.value, opt.label)}
                    disabled={animating}
                    className="w-full text-right px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/[0.16] text-white/80 hover:text-white text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                    data-testid={`btn-finder-option-${opt.value}`}
                  >
                    {opt.label}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Reset when done */}
          {finished && (
            <div className="px-5 pb-4 pt-2 flex-shrink-0 border-t border-white/[0.05]">
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-white/25 hover:text-white/50 text-xs transition-colors"
                data-testid="button-finder-restart"
              >
                <RotateCcw className="w-3 h-3" />
                أعد من البداية
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
