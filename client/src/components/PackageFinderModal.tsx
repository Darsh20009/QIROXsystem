import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowLeft, Check, ChevronRight, RotateCcw, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

/* ─── Package definitions with full pricing ─── */
const PACKAGES_DATA = {
  lite: {
    nameAr: "لايت",
    emoji: "⚡",
    gradient: "from-slate-600 to-slate-800",
    accentColor: "text-slate-200",
    borderColor: "border-slate-600",
    glowColor: "shadow-slate-500/20",
    desc: "مثالية للمشاريع الناشئة والأعمال الصغيرة. تحصل على كل الأساسيات لإطلاق وجودك الرقمي بشكل احترافي.",
    features: [
      "موقع إلكتروني احترافي",
      "إدارة المنتجات والخدمات",
      "نظام الطلبات الأساسي",
      "لوحة تحكم خاصة",
      "دعم فني أساسي",
    ],
    notFor: "غير مناسبة لمن يحتاج تطبيق جوال أو ميزات متقدمة.",
    priceFromLabel: "يبدأ من",
    priceMonthly: 499,
    priceSixmonth: 2500,
    priceAnnual: 4500,
    priceLifetime: 5000,
  },
  pro: {
    nameAr: "برو",
    emoji: "🚀",
    gradient: "from-blue-600 to-indigo-700",
    accentColor: "text-blue-100",
    borderColor: "border-blue-500",
    glowColor: "shadow-blue-500/30",
    desc: "للمشاريع المتنامية التي تحتاج قوة حقيقية. تكاملات متقدمة، تطبيق جوال، وذكاء اصطناعي مدمج.",
    features: [
      "كل ميزات لايت +",
      "تطبيق جوال (iOS & Android)",
      "بوابات الدفع الإلكتروني",
      "CRM وإدارة العملاء",
      "تقارير وتحليلات متقدمة",
      "ذكاء اصطناعي مدمج",
    ],
    notFor: "قد تكون مبالغاً فيها لمن يحتاج نظاماً بسيطاً.",
    priceFromLabel: "يبدأ من",
    priceMonthly: 999,
    priceSixmonth: 5200,
    priceAnnual: 9000,
    priceLifetime: 10000,
  },
  infinite: {
    nameAr: "إنفينيت",
    emoji: "♾️",
    gradient: "from-amber-500 to-orange-600",
    accentColor: "text-amber-100",
    borderColor: "border-amber-400",
    glowColor: "shadow-amber-500/30",
    desc: "للمشاريع الكبيرة التي لا حدود لها. تخصيص كامل، خادم مخصص، وفريق دعم على مدار الساعة.",
    features: [
      "كل ميزات برو +",
      "تخصيص كامل بلا حدود",
      "خادم مخصص حصري",
      "تكاملات API خارجية",
      "فريق دعم مخصص 24/7",
      "أولوية في التسليم",
    ],
    notFor: "ليست الخيار الأمثل لمن يبحث عن سعر منخفض.",
    priceFromLabel: "يبدأ من",
    priceMonthly: 1999,
    priceSixmonth: 10500,
    priceAnnual: 18000,
    priceLifetime: 20000,
  },
};

/* ─── Quiz questions ─── */
const QUESTIONS = [
  {
    id: "sector",
    question: "ما نوع مشروعك؟",
    hint: "سأختار لك الباقة الأنسب لقطاعك تحديداً",
    options: [
      { label: "🍽️ مطعم أو كافيه",       value: "food",         score: { lite: 2, pro: 2, infinite: 1 } },
      { label: "🛍️ متجر إلكتروني",        value: "ecommerce",    score: { lite: 1, pro: 3, infinite: 2 } },
      { label: "📚 تعليم أو أكاديمية",    value: "education",    score: { lite: 2, pro: 3, infinite: 1 } },
      { label: "💪 صحة أو لياقة",         value: "health",       score: { lite: 2, pro: 2, infinite: 1 } },
      { label: "✨ تجميل أو صالون",       value: "beauty",       score: { lite: 3, pro: 2, infinite: 1 } },
      { label: "🏢 شركة أو مؤسسة",        value: "corporate",    score: { lite: 0, pro: 2, infinite: 3 } },
      { label: "🌟 قطاع آخر",             value: "other",        score: { lite: 2, pro: 2, infinite: 1 } },
    ],
  },
  {
    id: "size",
    question: "ما حجم مشروعك الحالي؟",
    hint: "يساعدني هذا في معرفة مستوى التعقيد الذي تحتاجه",
    options: [
      { label: "🌱 مشروع ناشئ (بداية)",       value: "small",  score: { lite: 3, pro: 1, infinite: 0 } },
      { label: "📈 متوسط (يعمل حالياً)",      value: "medium", score: { lite: 1, pro: 3, infinite: 1 } },
      { label: "🏆 كبير (متنامٍ أو راسخ)",    value: "large",  score: { lite: 0, pro: 1, infinite: 3 } },
    ],
  },
  {
    id: "products",
    question: "كم عدد المنتجات أو الخدمات التي تقدمها تقريباً؟",
    hint: "هذا يؤثر على البنية التقنية للنظام",
    options: [
      { label: "📦 أقل من 20",          value: "few",    score: { lite: 3, pro: 1, infinite: 0 } },
      { label: "📦📦 من 20 إلى 100",     value: "medium", score: { lite: 1, pro: 3, infinite: 1 } },
      { label: "📦📦📦 أكثر من 100",     value: "many",   score: { lite: 0, pro: 2, infinite: 3 } },
    ],
  },
  {
    id: "mobile",
    question: "هل تحتاج تطبيق جوال لعملائك؟",
    hint: "التطبيق يرفع تجربة العميل ويزيد الولاء",
    options: [
      { label: "📱 نعم، ضروري جداً",     value: "yes",   score: { lite: 0, pro: 3, infinite: 2 } },
      { label: "🔜 لاحقاً ربما",          value: "later", score: { lite: 2, pro: 2, infinite: 1 } },
      { label: "❌ لا أحتاجه الآن",      value: "no",    score: { lite: 3, pro: 1, infinite: 0 } },
    ],
  },
  {
    id: "budget",
    question: "ما ميزانيتك التقريبية للمشروع؟",
    hint: "لا توجد إجابة خاطئة — سأقترح الأنسب لميزانيتك",
    options: [
      { label: "💰 أقل من 6,000 ريال",          value: "low",    score: { lite: 3, pro: 0, infinite: 0 } },
      { label: "💰💰 6,000 – 12,000 ريال",       value: "medium", score: { lite: 1, pro: 3, infinite: 0 } },
      { label: "💰💰💰 أكثر من 12,000 ريال",     value: "high",   score: { lite: 0, pro: 1, infinite: 3 } },
    ],
  },
  {
    id: "priority",
    question: "ما أهم شيء تحتاجه في نظامك؟",
    hint: "سيساعدني هذا في تحديد المستوى الأمثل",
    options: [
      { label: "🎨 تصميم جذاب واحترافي",       value: "design",   score: { lite: 3, pro: 1, infinite: 1 } },
      { label: "⚙️ ميزات متقدمة وتكاملات",     value: "features", score: { lite: 0, pro: 3, infinite: 2 } },
      { label: "🤖 ذكاء اصطناعي وتحليلات",     value: "ai",       score: { lite: 0, pro: 2, infinite: 3 } },
      { label: "🛡️ دعم فني مكثف 24/7",         value: "support",  score: { lite: 1, pro: 2, infinite: 3 } },
    ],
  },
  {
    id: "customers",
    question: "كم تتوقع عدد عملائك شهرياً؟",
    hint: "يحدد هذا قدرة الخادم والبنية التحتية المطلوبة",
    options: [
      { label: "👥 أقل من 100 عميل",       value: "low",    score: { lite: 3, pro: 1, infinite: 0 } },
      { label: "👥👥 100 – 500 عميل",       value: "medium", score: { lite: 1, pro: 3, infinite: 1 } },
      { label: "👥👥👥 أكثر من 500 عميل",  value: "high",   score: { lite: 0, pro: 1, infinite: 3 } },
    ],
  },
];

/* ─── Scoring ─── */
function calcRecommendation(answers: Record<string, string>): "lite" | "pro" | "infinite" {
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
  if (score.infinite >= score.pro && score.infinite >= score.lite) return "infinite";
  if (score.pro >= score.lite) return "pro";
  return "lite";
}

/* ─── Price badge ─── */
function PriceRow({ label, price, highlight }: { label: string; price: number; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${highlight ? "bg-white/10" : ""}`}>
      <span className="text-xs text-white/50">{label}</span>
      <span className={`text-sm font-bold ${highlight ? "text-white" : "text-white/70"}`}>
        {price.toLocaleString()} <span className="text-[10px] font-normal">ر.س</span>
      </span>
    </div>
  );
}

/* ─── Main Modal Component ─── */
export function PackageFinderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [chatLog, setChatLog] = useState<{ from: "ai" | "user"; text: string }[]>([]);
  const [finished, setFinished] = useState(false);
  const [recommended, setRecommended] = useState<"lite" | "pro" | "infinite" | null>(null);
  const [animating, setAnimating] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setStep(0);
      setAnswers({});
      setFinished(false);
      setRecommended(null);
      setAnimating(false);
      setChatLog([
        { from: "ai", text: "أهلاً! 👋 أنا مساعد QIROX الذكي.\n\nسأطرح عليك بضعة أسئلة قصيرة لأحدد الباقة المثالية لمشروعك من بين باقاتنا الثلاث.\n\nجاهز؟ لنبدأ! 🎯" },
        { from: "ai", text: QUESTIONS[0].question },
      ]);
    }
  }, [open]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatLog, finished]);

  function handleAnswer(questionId: string, value: string, label: string) {
    if (animating) return;
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    setChatLog(prev => [...prev, { from: "user", text: label }]);
    setAnimating(true);

    const nextStep = step + 1;
    if (nextStep >= QUESTIONS.length) {
      setTimeout(() => {
        setChatLog(prev => [...prev,
          { from: "ai", text: "ممتاز! لحظة، أحلل إجاباتك... ✨" }
        ]);
        setTimeout(() => {
          const rec = calcRecommendation(newAnswers);
          setRecommended(rec);
          setFinished(true);
          setChatLog(prev => [...prev,
            { from: "ai", text: `بناءً على إجاباتك، التوصية المثالية لك هي 👇` }
          ]);
          setAnimating(false);
        }, 1200);
      }, 400);
    } else {
      setTimeout(() => {
        setChatLog(prev => [...prev,
          { from: "ai", text: QUESTIONS[nextStep].question }
        ]);
        setStep(nextStep);
        setAnimating(false);
      }, 500);
    }
  }

  function handleReset() {
    setStep(0);
    setAnswers({});
    setFinished(false);
    setRecommended(null);
    setAnimating(false);
    setChatLog([
      { from: "ai", text: "حسناً، لنبدأ من جديد! 🔄" },
      { from: "ai", text: QUESTIONS[0].question },
    ]);
  }

  const pkg = recommended ? PACKAGES_DATA[recommended] : null;
  const progress = Math.min(((step + (finished ? 1 : 0)) / QUESTIONS.length) * 100, 100);

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
          style={{ maxHeight: "90vh" }}
          dir="rtl"
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-bold">مكتشف الباقة</p>
                <p className="text-white/30 text-[10px]">QIROX AI · {QUESTIONS.length} أسئلة</p>
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

          {/* ── Progress bar ── */}
          <div className="h-1 bg-white/[0.05] flex-shrink-0">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-violet-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>

          {/* ── Chat area ── */}
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

            {/* ── Recommendation Card ── */}
            {finished && pkg && recommended && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`rounded-2xl border ${pkg.borderColor} overflow-hidden shadow-xl ${pkg.glowColor}`}
              >
                <div className={`bg-gradient-to-br ${pkg.gradient} px-5 py-4`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{pkg.emoji}</span>
                    <div>
                      <p className="text-white/50 text-[10px] uppercase tracking-widest">باقتك المقترحة</p>
                      <p className="text-white text-xl font-black">باقة {pkg.nameAr}</p>
                    </div>
                  </div>
                  <p className={`text-sm leading-relaxed mt-2 ${pkg.accentColor} opacity-80`}>{pkg.desc}</p>
                </div>

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

                <div className="bg-white/[0.02] px-5 py-4 border-t border-white/[0.06]">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">الأسعار</p>
                  <PriceRow label="شهري" price={pkg.priceMonthly} />
                  <PriceRow label="نصف سنوي" price={pkg.priceSixmonth} />
                  <PriceRow label="سنوي (الأوفر)" price={pkg.priceAnnual} highlight />
                  <PriceRow label="مدى الحياة" price={pkg.priceLifetime} />
                </div>

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
                      قارن كل الباقات
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Options / Hint ── */}
          {!finished && (
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

          {/* ── Reset (when done) ── */}
          {finished && (
            <div className="px-5 pb-4 pt-2 flex-shrink-0 border-t border-white/[0.05]">
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-white/25 hover:text-white/50 text-xs transition-colors"
                data-testid="button-finder-restart"
              >
                <RotateCcw className="w-3 h-3" />
                أعد الاختبار من البداية
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
