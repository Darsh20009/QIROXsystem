// @ts-nocheck
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Package, MessageCircle, Wallet, BarChart3,
  ArrowLeft, CheckCircle2, Star, ShoppingCart, Headphones,
  Zap, Shield, Clock,
} from "lucide-react";

export default function ClientOnboarding() {
  const [step, setStep] = useState(0);
  const [, navigate] = useLocation();
  const { data: user } = useUser();
  const { lang, dir } = useI18n();
  const L = lang === "ar";

  const STEPS = [
    {
      id: "welcome",
      icon: Sparkles,
      color: "from-black to-gray-800",
      title: L ? "أهلاً وسهلاً! 🎉" : "Welcome! 🎉",
      subtitle: L ? "نورت منصة QIROX — مكانك لتحويل أفكارك لواقع رقمي" : "Welcome to QIROX — your place to turn ideas into digital reality",
      description: L
        ? "منصتنا مصممة لتجعل رحلتك معنا سهلة ومريحة. خلال دقيقتين ستفهم كيف تستفيد من كل الخدمات."
        : "Our platform is designed to make your journey with us easy and smooth. In two minutes you'll understand how to benefit from all services.",
      visual: (
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {[
            { icon: Package, label: L ? "طلباتك" : "Your Orders", color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" },
            { icon: BarChart3, label: L ? "مشاريعك" : "Your Projects", color: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" },
            { icon: Wallet, label: L ? "محفظتك" : "Your Wallet", color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" },
            { icon: MessageCircle, label: L ? "دعمنا" : "Support", color: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.15 }}
              className={`flex flex-col items-center gap-2 rounded-2xl p-4 ${item.color} w-20`}>
              <item.icon className="w-7 h-7" />
              <span className="text-[10px] font-bold text-center">{item.label}</span>
            </motion.div>
          ))}
        </div>
      ),
    },
    {
      id: "services",
      icon: ShoppingCart,
      color: "from-blue-600 to-blue-800",
      title: L ? "اطلب خدمتك بسهولة" : "Order Your Service Easily",
      subtitle: L ? "باقات مصممة لكل نوع نشاط تجاري" : "Packages designed for every type of business",
      description: L
        ? "اختر الباقة المناسبة لنشاطك — لايت، برو، أو إنفينيت — وأضف ما تحتاجه من إضافات. فريقنا يبدأ العمل فوراً."
        : "Choose the right package for your business — Lite, Pro, or Infinite — and add the add-ons you need. Our team starts immediately.",
      visual: (
        <div className="space-y-3">
          {[
            { tier: L ? "لايت" : "Lite", desc: L ? "للمشاريع الناشئة" : "For startups", color: "border-gray-200 dark:border-gray-700", badge: "" },
            { tier: L ? "برو" : "Pro", desc: L ? "للمشاريع المتنامية" : "For growing projects", color: "border-blue-200 dark:border-blue-700", badge: L ? "الأكثر طلباً" : "Most Popular" },
            { tier: L ? "إنفينيت" : "Infinite", desc: L ? "للمشاريع الكبيرة" : "For large projects", color: "border-purple-200 dark:border-purple-700", badge: L ? "لا حدود" : "Unlimited" },
          ].map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}
              className={`flex items-center justify-between p-3 rounded-xl border ${p.color} bg-white dark:bg-gray-900`}>
              <div>
                <p className="font-bold text-sm text-black dark:text-white">{p.tier}</p>
                <p className="text-xs text-black/40 dark:text-white/40">{p.desc}</p>
              </div>
              {p.badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400">{p.badge}</span>}
            </motion.div>
          ))}
        </div>
      ),
    },
    {
      id: "track",
      icon: BarChart3,
      color: "from-purple-600 to-purple-800",
      title: L ? "تابع مشروعك لحظة بلحظة" : "Track Your Project in Real Time",
      subtitle: L ? "شفافية كاملة في كل مراحل التنفيذ" : "Full transparency across all execution stages",
      description: L
        ? "من لوحة تحكمك تقدر تشوف تقدم مشروعك، المرحلة الحالية، والمدة المتوقعة. الفريق يحدّثك عند كل تطور."
        : "From your dashboard you can see your project progress, current stage, and estimated timeline. The team updates you at every milestone.",
      visual: (
        <div className="space-y-2">
          {[
            { label: L ? "استلام الطلب" : "Order Received", done: true },
            { label: L ? "الدراسة والتخطيط" : "Planning & Analysis", done: true },
            { label: L ? "التصميم والبناء" : "Design & Build", active: true },
            { label: L ? "الاختبار والمراجعة" : "Testing & Review", done: false },
            { label: L ? "التسليم النهائي" : "Final Delivery", done: false },
          ].map((phase, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.12 }}
              className={`flex items-center gap-3 p-2.5 rounded-xl ${phase.active ? "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700" : ""}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${phase.done ? "bg-black dark:bg-white" : phase.active ? "bg-purple-500" : "bg-black/[0.06] dark:bg-white/[0.06]"}`}>
                {phase.done ? <CheckCircle2 className="w-3.5 h-3.5 text-white dark:text-black" /> : phase.active ? <Clock className="w-3 h-3 text-white" /> : <span className="w-2 h-2 rounded-full bg-black/20 dark:bg-white/20" />}
              </div>
              <span className={`text-xs font-medium ${phase.active ? "text-purple-700 dark:text-purple-400 font-bold" : phase.done ? "text-black dark:text-white" : "text-black/40 dark:text-white/40"}`}>{phase.label}</span>
              {phase.active && <span className="text-[10px] text-purple-500 mr-auto">{L ? "جارٍ الآن" : "In Progress"}</span>}
            </motion.div>
          ))}
        </div>
      ),
    },
    {
      id: "support",
      icon: Headphones,
      color: "from-emerald-600 to-emerald-800",
      title: L ? "دعم دائم معك" : "Always-On Support",
      subtitle: L ? "فريقنا جاهز للمساعدة في أي وقت" : "Our team is ready to help at any time",
      description: L
        ? "سواء عندك سؤال عن مشروعك أو تريد تعديل، فريق QIROX متاح عبر المحادثة المباشرة، الرسائل، أو QIROX AI."
        : "Whether you have a question about your project or want a modification, the QIROX team is available via live chat, messages, or QIROX AI.",
      visual: (
        <div className="space-y-3">
          {[
            { icon: MessageCircle, title: L ? "محادثة مباشرة" : "Live Chat", desc: L ? "تكلم مع الدعم فوراً" : "Talk to support instantly", color: "text-emerald-500" },
            { icon: Zap, title: "QIROX AI", desc: L ? "مساعد ذكي متاح 24/7" : "AI assistant available 24/7", color: "text-amber-500" },
            { icon: Shield, title: L ? "ضمان الجودة" : "Quality Guarantee", desc: L ? "ما بتدفع إلا لما تتأكد" : "You only pay when satisfied", color: "text-blue-500" },
            { icon: Star, title: L ? "برنامج الولاء" : "Loyalty Program", desc: L ? "نقاط مع كل طلب" : "Points with every order", color: "text-purple-500" },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06]">
              <item.icon className={`w-5 h-5 shrink-0 ${item.color}`} />
              <div>
                <p className="font-bold text-sm text-black dark:text-white">{item.title}</p>
                <p className="text-[11px] text-black/40 dark:text-white/40">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      ),
    },
  ];

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      try { localStorage.setItem("qirox_onboarding_done", "1"); } catch {}
      navigate("/dashboard");
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSkip = () => {
    try { localStorage.setItem("qirox_onboarding_done", "1"); } catch {}
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col" dir={dir}>
      {/* Progress bar */}
      <div className="w-full h-1 bg-black/[0.06] dark:bg-white/[0.06]">
        <motion.div
          className="h-full bg-black dark:bg-white"
          animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-5 py-8">
        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <button key={i} onClick={() => i < step && setStep(i)}
              className={`transition-all duration-300 rounded-full ${i === step ? "w-8 h-2 bg-black dark:bg-white" : i < step ? "w-2 h-2 bg-black/40 dark:bg-white/40" : "w-2 h-2 bg-black/10 dark:bg-white/10"}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: L ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: L ? -30 : 30 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {/* Icon header */}
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${current.color} flex items-center justify-center mb-6 shadow-lg`}>
              <current.icon className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-2xl font-black text-black dark:text-white mb-1">{current.title}</h1>
            <p className="text-sm font-semibold text-black/50 dark:text-white/50 mb-3">{current.subtitle}</p>
            <p className="text-sm text-black/60 dark:text-white/55 leading-relaxed mb-8">{current.description}</p>

            {/* Visual content */}
            <div className="flex-1 mb-8">
              {current.visual}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleNext}
            className="w-full h-12 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-sm font-bold gap-2 hover:bg-black/80 dark:hover:bg-white/80"
            data-testid="button-onboarding-next"
          >
            {isLast ? (L ? "ابدأ الآن 🚀" : "Get Started 🚀") : (L ? "التالي" : "Next")}
            {!isLast && <ArrowLeft className={`w-4 h-4 ${L ? "rotate-180" : ""}`} />}
          </Button>
          {!isLast && (
            <button onClick={handleSkip} className="w-full text-center text-xs text-black/30 dark:text-white/30 hover:text-black/50 dark:hover:text-white/50 transition-colors py-2" data-testid="button-onboarding-skip">
              {L ? "تخطي الجولة التعريفية" : "Skip the tour"}
            </button>
          )}
        </div>

        {/* Step counter */}
        <p className="text-center text-[10px] text-black/20 dark:text-white/20 mt-4">
          {L ? `${step + 1} من ${STEPS.length}` : `${step + 1} of ${STEPS.length}`}
        </p>
      </div>
    </div>
  );
}
