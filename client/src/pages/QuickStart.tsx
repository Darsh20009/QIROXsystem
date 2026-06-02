import { useState, useRef, useCallback } from "react";
import { useCurrency } from "@/hooks/use-currency";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/hooks/use-auth";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Loader2, Sparkles,
  UtensilsCrossed, ShoppingBag, GraduationCap, Building2,
  Heart, Scissors, Home, MoreHorizontal, Globe, Smartphone,
  LayoutDashboard, CalendarCheck, CreditCard, BarChart3,
  MessageSquare, Truck, Lock, Zap, Phone, Video, Check,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
const qiroxLogo = "/qirox-icon-nobg.png";

/* ─── Data ─── */
const SECTORS_AR = [
  { key: "restaurant",  icon: UtensilsCrossed, label: "مطاعم ومقاهي",    color: "text-orange-500",  bg: "bg-orange-50 dark:bg-orange-500/10" },
  { key: "ecommerce",   icon: ShoppingBag,     label: "متاجر إلكترونية", color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-500/10" },
  { key: "education",   icon: GraduationCap,   label: "منصات تعليمية",   color: "text-purple-500",  bg: "bg-purple-50 dark:bg-purple-500/10" },
  { key: "corporate",   icon: Building2,       label: "شركات ومؤسسات",   color: "text-slate-500",   bg: "bg-slate-50 dark:bg-slate-500/10" },
  { key: "healthcare",  icon: Heart,           label: "صحة وعيادات",     color: "text-red-500",     bg: "bg-red-50 dark:bg-red-500/10" },
  { key: "beauty",      icon: Scissors,        label: "تجميل وصالونات",  color: "text-pink-500",    bg: "bg-pink-50 dark:bg-pink-500/10" },
  { key: "realestate",  icon: Home,            label: "عقارات",           color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  { key: "other",       icon: MoreHorizontal,  label: "قطاع آخر",         color: "text-gray-400",    bg: "bg-gray-50 dark:bg-gray-500/10" },
];

const SECTORS_EN = [
  { key: "restaurant",  icon: UtensilsCrossed, label: "Restaurants & Cafes", color: "text-orange-500",  bg: "bg-orange-50 dark:bg-orange-500/10" },
  { key: "ecommerce",   icon: ShoppingBag,     label: "Online Stores",        color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-500/10" },
  { key: "education",   icon: GraduationCap,   label: "Education Platforms",  color: "text-purple-500",  bg: "bg-purple-50 dark:bg-purple-500/10" },
  { key: "corporate",   icon: Building2,       label: "Corporate & Business", color: "text-slate-500",   bg: "bg-slate-50 dark:bg-slate-500/10" },
  { key: "healthcare",  icon: Heart,           label: "Health & Clinics",     color: "text-red-500",     bg: "bg-red-50 dark:bg-red-500/10" },
  { key: "beauty",      icon: Scissors,        label: "Beauty & Salons",      color: "text-pink-500",    bg: "bg-pink-50 dark:bg-pink-500/10" },
  { key: "realestate",  icon: Home,            label: "Real Estate",          color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  { key: "other",       icon: MoreHorizontal,  label: "Other Sector",         color: "text-gray-400",    bg: "bg-gray-50 dark:bg-gray-500/10" },
];

const FEATURES_AR = [
  { key: "website",    icon: Globe,          label: "موقع ويب" },
  { key: "mobile",     icon: Smartphone,     label: "تطبيق جوال" },
  { key: "dashboard",  icon: LayoutDashboard,label: "لوحة تحكم" },
  { key: "booking",    icon: CalendarCheck,  label: "نظام حجوزات" },
  { key: "payment",    icon: CreditCard,     label: "دفع إلكتروني" },
  { key: "reports",    icon: BarChart3,      label: "تقارير وإحصاءات" },
  { key: "chat",       icon: MessageSquare,  label: "تواصل مع العملاء" },
  { key: "delivery",   icon: Truck,          label: "نظام توصيل" },
  { key: "auth",       icon: Lock,           label: "نظام تسجيل الدخول" },
  { key: "ai",         icon: Zap,            label: "ميزات ذكاء اصطناعي" },
];

const FEATURES_EN = [
  { key: "website",    icon: Globe,          label: "Website" },
  { key: "mobile",     icon: Smartphone,     label: "Mobile App" },
  { key: "dashboard",  icon: LayoutDashboard,label: "Admin Dashboard" },
  { key: "booking",    icon: CalendarCheck,  label: "Booking System" },
  { key: "payment",    icon: CreditCard,     label: "Online Payment" },
  { key: "reports",    icon: BarChart3,      label: "Reports & Analytics" },
  { key: "chat",       icon: MessageSquare,  label: "Customer Messaging" },
  { key: "delivery",   icon: Truck,          label: "Delivery System" },
  { key: "auth",       icon: Lock,           label: "Authentication" },
  { key: "ai",         icon: Zap,            label: "AI Features" },
];

const BUDGETS_AR_SAR = [
  { key: "unknown",   label: "لم أحدد بعد",           sub: "سنقترح ما يناسبك" },
  { key: "small",     label: "أقل من 15,000 ريال",    sub: "مشاريع لايت" },
  { key: "medium",    label: "15,000 – 50,000 ريال",  sub: "مشاريع برو" },
  { key: "large",     label: "أكثر من 50,000 ريال",   sub: "مشاريع إنفينيت" },
];

const BUDGETS_AR_EGP = [
  { key: "unknown",   label: "لم أحدد بعد",             sub: "سنقترح ما يناسبك" },
  { key: "small",     label: "أقل من 105,000 جنيه",     sub: "مشاريع لايت" },
  { key: "medium",    label: "105,000 – 350,000 جنيه",  sub: "مشاريع برو" },
  { key: "large",     label: "أكثر من 350,000 جنيه",    sub: "مشاريع إنفينيت" },
];

const BUDGETS_EN = [
  { key: "unknown",   label: "Not sure yet",        sub: "We'll suggest the best fit" },
  { key: "small",     label: "Under SAR 15,000",    sub: "Lite projects" },
  { key: "medium",    label: "SAR 15,000 – 50,000", sub: "Pro projects" },
  { key: "large",     label: "SAR 50,000+",          sub: "Infinite projects" },
];

const CONTACT_OPTIONS_AR = [
  { key: "phone",     icon: Phone,     label: "مكالمة هاتفية" },
  { key: "whatsapp",  icon: SiWhatsapp,label: "واتساب" },
  { key: "video",     icon: Video,     label: "مكالمة فيديو" },
];

const CONTACT_OPTIONS_EN = [
  { key: "phone",     icon: Phone,     label: "Phone Call" },
  { key: "whatsapp",  icon: SiWhatsapp,label: "WhatsApp" },
  { key: "video",     icon: Video,     label: "Video Call" },
];

const TOTAL_STEPS = 5; // 1: sector, 2: idea, 3: features, 4: budget, 5: contact

/* ─── Component ─── */
export default function QuickStart() {
  const { lang, dir } = useI18n();
  const ar = lang === "ar";
  const { data: user } = useUser();
  const currency = useCurrency();
  const Arrow = ar ? ArrowLeft : ArrowRight;

  const sectors  = ar ? SECTORS_AR  : SECTORS_EN;
  const featuresList = ar ? FEATURES_AR : FEATURES_EN;
  const budgets  = ar ? (currency.isEgypt ? BUDGETS_AR_EGP : BUDGETS_AR_SAR) : BUDGETS_EN;
  const contactOptions = ar ? CONTACT_OPTIONS_AR : CONTACT_OPTIONS_EN;

  /* form state */
  const [step, setStep]           = useState(0); // 0 = hero
  const [sector, setSector]       = useState("");
  const [idea, setIdea]           = useState("");
  const [features, setFeatures]   = useState<string[]>([]);
  const [budget, setBudget]       = useState("");
  const [name, setName]           = useState((user as any)?.fullName || "");
  const [phone, setPhone]         = useState((user as any)?.phone || "");
  const [email, setEmail]         = useState((user as any)?.email || "");
  const [contact, setContact]     = useState("whatsapp");

  /* submission state */
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [refNumber, setRefNumber]   = useState("");
  const [error, setError]           = useState("");

  /* AI state */
  const [enhancing, setEnhancing]   = useState(false);

  async function enhanceIdea() {
    if (idea.trim().length < 5) return;
    setEnhancing(true);
    try {
      const r = await fetch("/api/ai/enhance-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: idea.trim(), sector, features }),
      });
      const data = await r.json();
      if (data.enhanced) setIdea(data.enhanced);
    } catch (_) {}
    setEnhancing(false);
  }

  const progressPct = step === 0 ? 0 : Math.round((step / TOTAL_STEPS) * 100);

  function toggleFeature(key: string) {
    setFeatures(f => f.includes(key) ? f.filter(k => k !== key) : [...f, key]);
  }

  function canNext(): boolean {
    if (step === 1) return !!sector;
    if (step === 2) return idea.trim().length >= 5;
    if (step === 3) return features.length > 0;
    if (step === 4) return !!budget;
    if (step === 5) return name.trim().length >= 2 && phone.trim().length >= 8;
    return true;
  }

  function next() { if (canNext()) setStep(s => s + 1); }
  function back() { setStep(s => Math.max(0, s - 1)); }

  async function submit() {
    if (!canNext()) return;
    setSubmitting(true);
    setError("");
    try {
      const sectorObj = sectors.find(s => s.key === sector);
      const selectedFeatureLabels = features.map(f => featuresList.find(x => x.key === f)?.label || f);
      const budgetObj = budgets.find(b => b.key === budget);

      const r = await fetch("/api/quickstart/lead", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: name.trim(),
          clientPhone: phone.trim(),
          clientEmail: email.trim() || undefined,
          sector,
          idea: idea.trim(),
          features: selectedFeatureLabels,
          budget: budgetObj?.label || budget,
          preferredContact: contact,
          lang,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Error");
      setRefNumber(data.refNumber || "QS-000000");
      setSubmitted(true);
    } catch (e: any) {
      setError(ar ? "حدث خطأ. حاول مجدداً." : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  /* ─── Success screen ─── */
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-black text-black dark:text-white" dir={dir}>
        <Navigation />
        <main className="flex-1 flex items-center justify-center px-5 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="max-w-lg w-full text-center"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-black mb-3">
              {ar ? "تم! وصلت طلبك 🎉" : "Done! We got your request 🎉"}
            </h1>
            <p className="text-black/60 dark:text-white/60 mb-6 leading-relaxed">
              {ar
                ? `فريق QIROX سيتواصل معك على ${phone} في أقرب وقت. رقم المرجع:`
                : `QIROX team will contact you at ${phone} shortly. Your reference:`}
            </p>
            <div className="inline-block px-6 py-3 rounded-2xl border-2 border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] text-2xl font-black tracking-widest mb-8">
              {refNumber}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`https://wa.me/966554656670?text=${encodeURIComponent(ar ? `مرحباً، مرجع طلبي: ${refNumber}` : `Hello, my reference: ${refNumber}`)}`}
                target="_blank" rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] text-white font-bold hover:bg-[#1ebe5d] transition text-sm"
                data-testid="link-success-whatsapp"
              >
                <SiWhatsapp className="w-4 h-4" />
                {ar ? "تواصل على واتساب" : "Chat on WhatsApp"}
              </a>
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-black/15 dark:border-white/15 font-bold hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition text-sm"
              >
                {ar ? "العودة للرئيسية" : "Back to Home"}
              </a>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  /* ─── Hero screen ─── */
  if (step === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-black text-black dark:text-white" dir={dir}>
        <Navigation />
        <main className="flex-1 flex items-center justify-center px-5 py-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="max-w-2xl w-full text-center"
          >
            <div className="flex justify-center mb-8">
              <img src="/qirox-logo-nobg.png" alt="QIROX" className="h-11 w-auto object-contain dark:invert" />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 dark:border-white/10 text-[11px] font-bold tracking-widest uppercase mb-7 bg-black/[0.02] dark:bg-white/[0.03]">
              <Sparkles className="w-3 h-3" />
              {ar ? "حدّد مشروعك خلال دقيقتين" : "Define your project in 2 minutes"}
            </div>

            <h1 className="text-4xl md:text-6xl font-black leading-[1.1] tracking-tight mb-5">
              {ar ? (
                <>
                  ابدأ مشروعك<br />
                  <span className="text-black/25 dark:text-white/25">بخطوات واضحة</span>
                </>
              ) : (
                <>
                  Start your project<br />
                  <span className="text-black/25 dark:text-white/25">with clear steps</span>
                </>
              )}
            </h1>

            <p className="text-base text-black/55 dark:text-white/55 mb-10 max-w-md mx-auto leading-relaxed">
              {ar
                ? "5 أسئلة بسيطة — وفريق QIROX يتواصل معك بعرض مفصّل يناسب نشاطك تماماً."
                : "5 simple questions — and QIROX team contacts you with a tailored proposal for your business."}
            </p>

            {/* Step preview pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {(ar
                ? ["القطاع", "الفكرة", "المميزات", "الميزانية", "بياناتك"]
                : ["Sector", "Your Idea", "Features", "Budget", "Your Info"]
              ).map((label, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 text-xs font-medium text-black/50 dark:text-white/50">
                  <span className="w-4 h-4 rounded-full bg-black/10 dark:bg-white/10 text-[10px] flex items-center justify-center font-black">{i + 1}</span>
                  {label}
                </div>
              ))}
            </div>

            <Button
              onClick={() => setStep(1)}
              className="h-14 px-10 rounded-2xl bg-black text-white dark:bg-white dark:text-black hover:opacity-90 text-base font-black gap-2 shadow-2xl shadow-black/20"
              data-testid="button-start-wizard"
            >
              {ar ? "ابدأ الآن" : "Start Now"}
              <Arrow className="w-5 h-5" />
            </Button>

            <p className="text-[11px] text-black/30 dark:text-white/30 mt-4">
              {ar ? "مجاناً · لا تحتاج حساباً · يستغرق أقل من دقيقتين" : "Free · No account needed · Under 2 minutes"}
            </p>
          </motion.div>
        </main>
      </div>
    );
  }

  /* ─── Wizard screen ─── */
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black text-black dark:text-white" dir={dir}>
      <Navigation />

      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-2xl">

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-[11px] text-black/40 dark:text-white/40 mb-2 font-medium">
              <span>{ar ? `الخطوة ${step} من ${TOTAL_STEPS}` : `Step ${step} of ${TOTAL_STEPS}`}</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-black/8 dark:bg-white/8 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-black dark:bg-white"
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={slideVariants}
              custom={1}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeOut" }}
            >

              {/* ─── Step 1: Sector ─── */}
              {step === 1 && (
                <div>
                  <h2 className="text-2xl md:text-3xl font-black mb-2">
                    {ar ? "ما قطاع نشاطك؟" : "What's your business sector?"}
                  </h2>
                  <p className="text-black/50 dark:text-white/50 text-sm mb-7">
                    {ar ? "اختر الأقرب لمشروعك" : "Pick the closest to your project"}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {sectors.map(s => {
                      const Icon = s.icon;
                      const selected = sector === s.key;
                      return (
                        <button
                          key={s.key}
                          onClick={() => { setSector(s.key); }}
                          className={`relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200 text-center ${
                            selected
                              ? "border-black dark:border-white bg-black text-white dark:bg-white dark:text-black shadow-lg scale-[1.03]"
                              : "border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                          }`}
                          data-testid={`sector-${s.key}`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? "bg-white/15" : s.bg}`}>
                            <Icon className={`w-5 h-5 ${selected ? "text-white dark:text-black" : s.color}`} />
                          </div>
                          <span className="text-xs font-bold leading-tight">{s.label}</span>
                          {selected && (
                            <CheckCircle2 className="absolute top-2 left-2 w-3.5 h-3.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─── Step 2: Idea ─── */}
              {step === 2 && (
                <div>
                  <h2 className="text-2xl md:text-3xl font-black mb-2">
                    {ar ? "صف فكرتك بكلماتك" : "Describe your idea in your own words"}
                  </h2>
                  <p className="text-black/50 dark:text-white/50 text-sm mb-7">
                    {ar
                      ? "لا تقلق من التفاصيل — اكتب ما يدور في ذهنك"
                      : "Don't worry about details — just write what's on your mind"}
                  </p>
                  <Textarea
                    value={idea}
                    onChange={e => setIdea(e.target.value)}
                    placeholder={ar
                      ? "مثال: أريد تطبيق لحجز مواعيد صالون الحلاقة، يعرض الأوقات المتاحة للعملاء ويرسل تنبيهات قبل الموعد…"
                      : "Example: I want an app for booking barbershop appointments, showing available slots and sending reminders…"}
                    className="min-h-[160px] text-sm bg-black/[0.02] dark:bg-white/[0.04] border-black/12 dark:border-white/12 rounded-2xl resize-none"
                    data-testid="textarea-idea"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <p className={`text-xs transition-colors ${idea.trim().length < 5 ? "text-black/30 dark:text-white/30" : "text-emerald-500"}`}>
                      {idea.trim().length} {ar ? "حرف" : "characters"}
                      {idea.trim().length >= 5 && " ✓"}
                    </p>
                    {idea.trim().length >= 5 && (
                      <button
                        onClick={enhanceIdea}
                        disabled={enhancing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/15 dark:border-white/15 text-xs font-bold hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition disabled:opacity-50"
                        data-testid="button-enhance-idea"
                      >
                        {enhancing
                          ? <><Loader2 className="w-3 h-3 animate-spin" /> {ar ? "جارٍ التحسين…" : "Enhancing…"}</>
                          : <><Sparkles className="w-3 h-3" /> {ar ? "حسّن فكرتي بالذكاء الاصطناعي" : "Enhance with AI"}</>
                        }
                      </button>
                    )}
                  </div>
                  {enhancing && (
                    <p className="text-xs text-black/40 dark:text-white/40 mt-2">
                      {ar ? "الذكاء الاصطناعي يطور فكرتك ويجعلها أوضح للفريق التقني…" : "AI is enhancing your idea for the technical team…"}
                    </p>
                  )}
                </div>
              )}

              {/* ─── Step 3: Features ─── */}
              {step === 3 && (
                <div>
                  <h2 className="text-2xl md:text-3xl font-black mb-2">
                    {ar ? "ما المميزات التي تحتاجها؟" : "What features do you need?"}
                  </h2>
                  <p className="text-black/50 dark:text-white/50 text-sm mb-7">
                    {ar ? "اختر كل ما ينطبق — يمكنك اختيار أكثر من واحدة" : "Pick all that apply — multiple choices allowed"}
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {featuresList.map(f => {
                      const Icon = f.icon;
                      const selected = features.includes(f.key);
                      return (
                        <button
                          key={f.key}
                          onClick={() => toggleFeature(f.key)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 text-start ${
                            selected
                              ? "border-black dark:border-white bg-black text-white dark:bg-white dark:text-black"
                              : "border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/25 hover:bg-black/[0.02]"
                          }`}
                          data-testid={`feature-${f.key}`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {f.label}
                          {selected && <Check className="w-3.5 h-3.5 ms-auto shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  {features.length > 0 && (
                    <p className="text-xs text-emerald-500 mt-3 font-medium">
                      {features.length} {ar ? "مميزة مختارة ✓" : "features selected ✓"}
                    </p>
                  )}
                </div>
              )}

              {/* ─── Step 4: Budget ─── */}
              {step === 4 && (
                <div>
                  <h2 className="text-2xl md:text-3xl font-black mb-2">
                    {ar ? "ما ميزانيتك التقريبية؟" : "What's your approximate budget?"}
                  </h2>
                  <p className="text-black/50 dark:text-white/50 text-sm mb-7">
                    {ar ? "هذا يساعدنا في اقتراح الباقة المناسبة لك" : "This helps us suggest the right package for you"}
                  </p>
                  <div className="flex flex-col gap-3">
                    {budgets.map(b => {
                      const selected = budget === b.key;
                      return (
                        <button
                          key={b.key}
                          onClick={() => setBudget(b.key)}
                          className={`flex items-center justify-between px-5 py-4 rounded-2xl border-2 text-start transition-all duration-200 ${
                            selected
                              ? "border-black dark:border-white bg-black text-white dark:bg-white dark:text-black shadow-lg"
                              : "border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/25"
                          }`}
                          data-testid={`budget-${b.key}`}
                        >
                          <div>
                            <div className="font-bold text-sm">{b.label}</div>
                            <div className={`text-xs mt-0.5 ${selected ? "opacity-70" : "text-black/40 dark:text-white/40"}`}>{b.sub}</div>
                          </div>
                          {selected && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─── Step 5: Contact Info ─── */}
              {step === 5 && (
                <div>
                  <h2 className="text-2xl md:text-3xl font-black mb-2">
                    {ar ? "بياناتك للتواصل" : "Your contact info"}
                  </h2>
                  <p className="text-black/50 dark:text-white/50 text-sm mb-7">
                    {ar ? "سيتواصل معك فريقنا خلال 24 ساعة" : "Our team will reach out within 24 hours"}
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold mb-1.5">
                        {ar ? "اسمك الكريم" : "Your Name"} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder={ar ? "مثال: محمد العلي" : "e.g. John Smith"}
                        className="h-12 rounded-xl border-black/12 dark:border-white/12 bg-black/[0.02] dark:bg-white/[0.04]"
                        data-testid="input-name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5">
                        {ar ? "رقم جوالك" : "Phone Number"} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder={ar ? "05xxxxxxxx" : "+966 5x xxx xxxx"}
                        className="h-12 rounded-xl border-black/12 dark:border-white/12 bg-black/[0.02] dark:bg-white/[0.04]"
                        dir="ltr"
                        type="tel"
                        data-testid="input-phone"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5">
                        {ar ? "بريدك الإلكتروني (اختياري)" : "Email (optional)"}
                      </label>
                      <Input
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="example@domain.com"
                        className="h-12 rounded-xl border-black/12 dark:border-white/12 bg-black/[0.02] dark:bg-white/[0.04]"
                        dir="ltr"
                        type="email"
                        data-testid="input-email"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-2">
                        {ar ? "طريقة التواصل المفضّلة" : "Preferred Contact Method"}
                      </label>
                      <div className="flex gap-2">
                        {contactOptions.map(c => {
                          const Icon = c.icon;
                          const selected = contact === c.key;
                          return (
                            <button
                              key={c.key}
                              onClick={() => setContact(c.key)}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium flex-1 justify-center transition-all ${
                                selected
                                  ? "border-black dark:border-white bg-black text-white dark:bg-white dark:text-black"
                                  : "border-black/10 dark:border-white/10 hover:border-black/25"
                              }`}
                              data-testid={`contact-${c.key}`}
                            >
                              <Icon className="w-4 h-4 shrink-0" />
                              {c.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-red-500 mt-4 font-medium">{error}</p>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-black/8 dark:border-white/8">
            <button
              onClick={back}
              className="flex items-center gap-1.5 text-sm text-black/45 dark:text-white/45 hover:text-black dark:hover:text-white transition font-medium"
              data-testid="button-back"
            >
              {ar ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {ar ? "رجوع" : "Back"}
            </button>

            {step < TOTAL_STEPS ? (
              <Button
                onClick={next}
                disabled={!canNext()}
                className="h-12 px-8 rounded-xl bg-black text-white dark:bg-white dark:text-black hover:opacity-90 font-black gap-2 disabled:opacity-30"
                data-testid="button-next"
              >
                {ar ? "التالي" : "Next"}
                <Arrow className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={submit}
                disabled={!canNext() || submitting}
                className="h-12 px-8 rounded-xl bg-black text-white dark:bg-white dark:text-black hover:opacity-90 font-black gap-2 disabled:opacity-30"
                data-testid="button-submit"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{ar ? "جارٍ الإرسال…" : "Sending…"}</>
                ) : (
                  <>{ar ? "أرسل طلبي 🚀" : "Send Request 🚀"}</>
                )}
              </Button>
            )}
          </div>

          {/* Step summary chips (visible in step 5 as review) */}
          {step === 5 && (
            <div className="mt-6 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/8 dark:border-white/8">
              <p className="text-xs font-bold text-black/50 dark:text-white/50 mb-3">
                {ar ? "ملخص طلبك:" : "Your request summary:"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  sectors.find(s => s.key === sector)?.label,
                  ...(features.slice(0, 3).map(f => featuresList.find(x => x.key === f)?.label)),
                  features.length > 3 ? `+${features.length - 3} ${ar ? "أخرى" : "more"}` : null,
                  budgets.find(b => b.key === budget)?.label,
                ].filter(Boolean).map((t, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full bg-black/[0.06] dark:bg-white/[0.06] text-[11px] font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
