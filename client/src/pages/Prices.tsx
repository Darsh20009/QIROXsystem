import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { usePricingPlans } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import {
  Loader2, Check, ArrowLeft, X, Globe, Tag, Gift, Plus, Sparkles, Shield, Headphones,
  Clock, Smartphone, Palette, TrendingUp, Infinity as InfinityIcon, Crown, CalendarDays, CalendarRange,
  Calendar, Zap, Star, UtensilsCrossed, ShoppingBag, GraduationCap, Building2, Home, Heart, ChevronRight,
  CheckCircle2
} from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { QiroxIcon } from "@/components/qirox-brand";

type BillingPeriod = "monthly" | "sixmonth" | "annual" | "lifetime";

const PERIODS: { key: BillingPeriod; labelAr: string; labelEn: string; sublabelAr: string; sublabelEn: string; icon: any; badgeAr?: string; badgeEn?: string }[] = [
  { key: "monthly",  labelAr: "شهري",       labelEn: "Monthly",   sublabelAr: "ادفع كل شهر",   sublabelEn: "Pay monthly",    icon: Calendar },
  { key: "sixmonth", labelAr: "نصف سنوي",   labelEn: "6 Months",  sublabelAr: "6 أشهر",         sublabelEn: "6 months",       icon: CalendarRange, badgeAr: "وفّر 30%", badgeEn: "Save 30%" },
  { key: "annual",   labelAr: "سنوي",       labelEn: "Annual",    sublabelAr: "سنة كاملة",      sublabelEn: "Full year",      icon: CalendarDays,  badgeAr: "الأوفر ★",  badgeEn: "Best Value ★" },
  { key: "lifetime", labelAr: "مدى الحياة", labelEn: "Lifetime",  sublabelAr: "دفعة واحدة",     sublabelEn: "One-time",       icon: InfinityIcon,  badgeAr: "دائم ∞",    badgeEn: "Forever ∞" },
];

const SEGMENTS = [
  { key: "restaurant",  labelAr: "مطاعم ومقاهي",    labelEn: "Restaurants",   icon: UtensilsCrossed, color: "from-orange-500 to-red-500",    bg: "bg-orange-500",   glow: "shadow-orange-500/40" },
  { key: "ecommerce",   labelAr: "متاجر إلكترونية", labelEn: "E-Commerce",    icon: ShoppingBag,     color: "from-blue-500 to-cyan-500",     bg: "bg-blue-500",     glow: "shadow-blue-500/40" },
  { key: "education",   labelAr: "منصات تعليمية",   labelEn: "Education",     icon: GraduationCap,   color: "from-violet-500 to-purple-500", bg: "bg-violet-500",   glow: "shadow-violet-500/40" },
  { key: "corporate",   labelAr: "شركات ومؤسسات",   labelEn: "Corporate",     icon: Building2,       color: "from-slate-500 to-gray-600",    bg: "bg-slate-600",    glow: "shadow-slate-500/40" },
  { key: "realestate",  labelAr: "عقارات",           labelEn: "Real Estate",   icon: Home,            color: "from-teal-500 to-emerald-500",  bg: "bg-teal-500",     glow: "shadow-teal-500/40" },
  { key: "healthcare",  labelAr: "صحة وعيادات",      labelEn: "Healthcare",    icon: Heart,           color: "from-rose-500 to-pink-500",     bg: "bg-rose-500",     glow: "shadow-rose-500/40" },
];

const TIER_META: Record<string, {
  labelAr: string; labelEn: string; icon: any;
  accent: string; accentText: string; accentGlow: string;
  border: string; ring: string; checkColor: string; badgeGrad: string;
}> = {
  lite: {
    labelAr: "لايت", labelEn: "Lite", icon: Zap,
    accent: "from-cyan-500/20 to-cyan-400/10",
    accentText: "text-cyan-400",
    accentGlow: "hover:shadow-cyan-500/20",
    border: "border-white/[0.08]",
    ring: "ring-cyan-500/30",
    checkColor: "text-cyan-400",
    badgeGrad: "from-cyan-500 to-cyan-400",
  },
  pro: {
    labelAr: "برو", labelEn: "Pro", icon: Star,
    accent: "from-cyan-400/25 to-blue-400/15",
    accentText: "text-cyan-300",
    accentGlow: "hover:shadow-cyan-400/25",
    border: "border-cyan-500/20",
    ring: "ring-cyan-400/40",
    checkColor: "text-cyan-300",
    badgeGrad: "from-cyan-400 to-blue-400",
  },
  infinite: {
    labelAr: "إنفينتي", labelEn: "Infinite", icon: InfinityIcon,
    accent: "from-amber-400/20 to-cyan-400/15",
    accentText: "text-amber-300",
    accentGlow: "hover:shadow-amber-400/20",
    border: "border-amber-400/20",
    ring: "ring-amber-400/40",
    checkColor: "text-amber-300",
    badgeGrad: "from-amber-400 to-orange-400",
  },
};

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <PageGraphics variant="hero-light" />
      {[
        { w: 500, h: 500, top: "-15%", right: "-10%", from: "from-violet-400/15", to: "to-purple-400/10", dur: 9 },
        { w: 350, h: 350, top: "40%",  left: "-8%",   from: "from-teal-400/12",   to: "to-cyan-400/8",   dur: 11 },
        { w: 250, h: 250, top: "70%",  right: "5%",   from: "from-rose-400/10",   to: "to-pink-400/8",   dur: 8 },
        { w: 180, h: 180, top: "20%",  left: "30%",   from: "from-amber-400/8",   to: "to-orange-400/6", dur: 13 },
      ].map((o, i) => (
        <motion.div key={i} className={`absolute rounded-full bg-gradient-to-br ${o.from} ${o.to} blur-3xl`}
          style={{ width: o.w, height: o.h, top: o.top, ...(o.right ? { right: o.right } : { left: o.left }) }}
          animate={{ y: [0, -25, 0], x: [0, 12, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: o.dur, repeat: Infinity, ease: "easeInOut" }} />
      ))}
    </div>
  );
}

function GridDots() {
  return (
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
      style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "28px 28px" }} />
  );
}

function getPeriodPrice(plan: any, period: BillingPeriod): number {
  if (period === "monthly")  return plan.monthlyPrice  ?? 0;
  if (period === "sixmonth") return plan.sixMonthPrice ?? 0;
  if (period === "annual")   return plan.annualPrice   ?? 0;
  return plan.lifetimePrice ?? plan.price ?? 0;
}
function getPeriodSuffix(period: BillingPeriod, lang: string): string {
  if (lang === "en") {
    if (period === "monthly")  return "/ mo";
    if (period === "sixmonth") return "/ 6 mo";
    if (period === "annual")   return "/ yr";
    return "";
  }
  if (period === "monthly")  return "/ شهر";
  if (period === "sixmonth") return "/ 6 أشهر";
  if (period === "annual")   return "/ سنة";
  return "";
}

function TierCard({ plan, period, idx, onSelect, lang }: { plan: any; period: BillingPeriod; idx: number; segmentColor: string; onSelect: (plan: any, price: number, period: BillingPeriod) => void; lang: string }) {
  const cfg = TIER_META[plan.tier] || TIER_META.lite;
  const cfgLabel = lang === "ar" ? cfg.labelAr : cfg.labelEn;
  const price = getPeriodPrice(plan, period);
  const isPopular = plan.isPopular;
  const monthlyBase = plan.monthlyPrice ?? 0;
  const monthlyEquiv = period === "monthly" ? price
    : period === "sixmonth" ? Math.round(price / 6)
    : period === "annual"   ? Math.round(price / 12) : null;
  const saving = monthlyEquiv && monthlyBase ? Math.round(((monthlyBase - monthlyEquiv) / monthlyBase) * 100) : 0;

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), { stiffness: 180, damping: 28 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), { stiffness: 180, damping: 28 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: idx * 0.12, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1200 }}
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect();
        mouseX.set((e.clientX - r.left) / r.width - 0.5);
        mouseY.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
      className="relative flex flex-col"
      data-testid={`card-tier-${plan.tier}`}
    >
      {isPopular && (
        <div className="absolute -top-5 inset-x-0 flex justify-center z-20">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 }}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[11px] font-black px-5 py-1.5 rounded-full shadow-lg shadow-cyan-500/30"
          >
            <Crown className="w-3 h-3" /> الأكثر طلباً
          </motion.span>
        </div>
      )}

      {/* Outer glow */}
      <div className={`absolute -inset-0.5 bg-gradient-to-br ${cfg.accent} rounded-3xl blur-md pointer-events-none opacity-70`} />

      {/* Card */}
      <div className={`relative flex flex-col flex-1 rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${cfg.accentGlow} ${
        isPopular ? `${cfg.border} shadow-xl ring-1 ${cfg.ring}` : cfg.border
      } bg-[#0a0a0f]`}>

        {/* Top accent line */}
        <div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${cfg.badgeGrad} opacity-80`} />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />

        <div className="p-6 flex flex-col flex-1">
          {/* Header row: Logo + Badge */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${cfg.accent} border ${cfg.border}`}>
                <QiroxIcon className="w-6 h-6 object-contain" />
              </div>
              <div>
                <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest leading-none mb-0.5">QIROX</p>
                <p className={`text-xs font-black ${cfg.accentText}`}>{lang === "ar" ? plan.nameAr : (plan.nameEn || plan.nameAr)}</p>
              </div>
            </div>
            <span className={`text-[10px] font-black px-3 py-1.5 rounded-full bg-gradient-to-r ${cfg.badgeGrad} text-white shadow-sm`}>
              {cfgLabel}
            </span>
          </div>

          <p className="text-white/35 text-xs mb-5 leading-relaxed min-h-8">{lang === "ar" ? plan.descriptionAr : (plan.descriptionEn || plan.descriptionAr)}</p>

          {/* Price Box */}
          <div className="mb-5 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
            <AnimatePresence mode="wait">
              <motion.div key={`${plan.tier}-${period}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-4xl font-black tracking-tight text-white">{price.toLocaleString()}</span>
                  <span className="text-sm font-bold text-white/40">{lang === "ar" ? "ريال" : "SAR"}</span>
                  <span className="text-xs text-white/25">{getPeriodSuffix(period, lang)}</span>
                </div>
                {monthlyEquiv && period !== "monthly" && (
                  <p className="text-[10px] mt-1.5 flex items-center gap-1 flex-wrap text-white/30">
                    {lang === "ar"
                      ? <span>= <span className="font-bold">{monthlyEquiv.toLocaleString()} ر.س/شهر</span></span>
                      : <span>= <span className="font-bold">{monthlyEquiv.toLocaleString()} SAR/mo</span></span>}
                    {saving > 0 && <span className="text-emerald-400 font-bold">{lang === "ar" ? `— وفّر ${saving}%` : `— Save ${saving}%`}</span>}
                  </p>
                )}
                {period === "lifetime" && (
                  <p className="text-[10px] mt-1.5 flex items-center gap-1 text-white/30">
                    <Globe className="w-3 h-3" /> {lang === "ar" ? "دومين مجاني لمدة 3 سنوات" : "Free domain for 3 years"}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Features */}
          <div className="space-y-2 flex-1 mb-5">
            {(lang === "ar" ? plan.featuresAr : (plan.featuresEn || plan.featuresAr))?.map((f: string, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-start gap-2.5 text-xs text-white/50">
                <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-white/[0.06]">
                  <Check className={`w-2.5 h-2.5 ${cfg.checkColor}`} />
                </div>
                <span className="leading-relaxed">{f}</span>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <Button
            onClick={() => onSelect(plan, price, period)}
            className={`w-full h-12 rounded-xl font-bold text-sm gap-2 transition-all shadow-lg bg-gradient-to-r ${cfg.badgeGrad} text-white hover:opacity-90 hover:shadow-xl`}
            data-testid={`button-select-${plan.tier}`}
          >
            {lang === "ar" ? `اختر ${cfgLabel}` : `Choose ${cfgLabel}`} <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Prices() {
  const { data: plans, isLoading } = usePricingPlans();
  const { lang, dir } = useI18n();
  const [segment, setSegment] = useState("restaurant");
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<{ plan: any; price: number; period: BillingPeriod } | null>(null);
  const [, navigate] = useLocation();

  function handlePlanSelect(plan: any, price: number, p: BillingPeriod) {
    setSelectedPlan({ plan, price, period: p });
  }

  function handleGoToOrder() {
    if (!selectedPlan) return;
    const q = new URLSearchParams({
      plan: selectedPlan.plan.tier,
      segment: selectedPlan.plan.segment,
      period: selectedPlan.period,
      price: String(selectedPlan.price),
    });
    setSelectedPlan(null);
    navigate(`/order?${q.toString()}`);
  }

  const activeSeg = SEGMENTS.find(s => s.key === segment) ?? SEGMENTS[0];
  const tierPlans = plans?.filter((p: any) =>
    p.segment === segment && ["lite","pro","infinite"].includes(p.tier ?? "")
  ).sort((a: any, b: any) =>
    (({ lite:1, pro:2, infinite:3 } as Record<string,number>)[a.tier ?? ""] ?? 9) - (({ lite:1, pro:2, infinite:3 } as Record<string,number>)[b.tier ?? ""] ?? 9)
  ) ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950" dir={dir}>
      <Navigation />

      {/* ─── HERO ─── */}
      <section className="relative pt-20 pb-0 overflow-hidden bg-black min-h-[60vh] flex items-end">
        <GridDots />
        <FloatingOrbs />

        <div className="container mx-auto px-4 relative z-10 pb-16 pt-24 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 border border-white/15 rounded-full px-5 py-2 mb-7 bg-white/5 backdrop-blur-sm"
            >
              <Tag className="w-3.5 h-3.5 text-white/50" />
              <span className="text-sm font-medium text-white/50">{lang === "ar" ? "الأسعار على حسب نوع مشروعك" : "Pricing based on your project type"}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7 }}
              className="text-5xl md:text-7xl font-black text-white mb-5 leading-[1.05] tracking-tight"
            >
              {lang === "ar" ? <>استثمر في نظامك<br /><span className="bg-gradient-to-r from-violet-400 via-teal-400 to-pink-400 bg-clip-text text-transparent">بالسعر المناسب</span></> : <>Invest in your system<br /><span className="bg-gradient-to-r from-violet-400 via-teal-400 to-pink-400 bg-clip-text text-transparent">at the right price</span></>}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-white/45 text-lg max-w-xl mx-auto mb-10"
            >
              {lang === "ar" ? "كل قطاع له نظامه — اختر قطاعك ثم المستوى الذي يناسب طموحك" : "Every sector has its system — choose your sector then the level that fits your ambitions"}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="flex flex-wrap justify-center gap-3">
              {[
                { icon: Shield,      label: lang === "ar" ? "ضمان الجودة"    : "Quality Guarantee" },
                { icon: Headphones,  label: lang === "ar" ? "دعم 24/7"        : "24/7 Support" },
                { icon: Clock,       label: lang === "ar" ? "تسليم في الموعد" : "On-time Delivery" },
                { icon: Sparkles,    label: lang === "ar" ? "تصميم احترافي"   : "Professional Design" },
              ].map(({ icon: Ic, label }) => (
                <div key={label} className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-full bg-white/5 text-xs text-white/50">
                  <Ic className="w-3.5 h-3.5" /> {label}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white dark:from-gray-950 to-transparent" />
      </section>

      {/* ─── SEGMENT SELECTOR ─── */}
      <section className="pt-12 pb-6 container mx-auto px-4 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <p className="text-center text-[11px] font-bold text-black/25 dark:text-white/25 uppercase tracking-[3px] mb-5">{lang === "ar" ? "اختر نوع المشروع" : "Choose Project Type"}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3" data-testid="segment-selector">
            {SEGMENTS.map(seg => {
              const Icon = seg.icon;
              const isActive = segment === seg.key;
              return (
                <motion.button
                  key={seg.key}
                  onClick={() => setSegment(seg.key)}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  data-testid={`btn-segment-${seg.key}`}
                  className={`relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-250 ${
                    isActive
                      ? `border-transparent shadow-xl ${seg.glow}`
                      : "border-black/[0.07] dark:border-white/[0.07] hover:border-black/15 dark:hover:border-white/15"
                  }`}
                >
                  {isActive && (
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${seg.color} opacity-[0.12]`} />
                  )}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                    isActive ? `bg-gradient-to-br ${seg.color} shadow-lg` : "bg-black/[0.04] dark:bg-white/[0.04]"
                  }`}>
                    <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-black/40 dark:text-white/40"}`} />
                  </div>
                  <span className={`text-[11px] font-black text-center leading-tight ${isActive ? "text-black dark:text-white" : "text-black/45 dark:text-white/45"}`}>
                    {lang === "ar" ? seg.labelAr : seg.labelEn}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ─── BILLING PERIOD TABS ─── */}
      <section className="pb-6 container mx-auto px-4 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex justify-center">
          <div className="relative inline-flex items-center gap-1.5 p-1.5 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl" data-testid="billing-period-selector">
            {PERIODS.map(({ key, labelAr, labelEn, sublabelAr, sublabelEn, icon: PIcon, badgeAr, badgeEn }) => {
              const pLabel = lang === "ar" ? labelAr : labelEn;
              const pSub   = lang === "ar" ? sublabelAr : sublabelEn;
              const pBadge = lang === "ar" ? badgeAr : badgeEn;
              return (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                data-testid={`tab-period-${key}`}
                className={`relative flex flex-col items-center px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 min-w-[85px] md:min-w-[105px] ${
                  period === key ? "bg-black dark:bg-white text-white dark:text-black shadow-lg" : "text-black/45 dark:text-white/45 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                }`}
              >
                {pBadge && period !== key && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-full whitespace-nowrap z-10 shadow">
                    {pBadge}
                  </span>
                )}
                <PIcon className="w-4 h-4 mb-0.5" />
                <span className="text-xs font-black">{pLabel}</span>
                <span className={`text-[9px] leading-none mt-0.5 ${period === key ? "text-white/55 dark:text-black/55" : "text-black/28 dark:text-white/28"}`}>{pSub}</span>
              </button>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Active label strip */}
      <div className="container mx-auto px-4 max-w-5xl mb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${segment}-${period}`}
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
            className={`rounded-2xl px-6 py-4 flex items-center gap-3 bg-gradient-to-r ${activeSeg.color} text-white overflow-hidden relative`}
          >
            <div className="absolute inset-0 opacity-10">
              <GridDots />
            </div>
            <activeSeg.icon className="w-5 h-5 relative z-10" />
            <span className="font-black relative z-10">{lang === "ar" ? activeSeg.labelAr : activeSeg.labelEn}</span>
            <span className="opacity-50 relative z-10">—</span>
            <span className="opacity-75 relative z-10">{lang === "ar" ? PERIODS.find(p => p.key === period)?.labelAr : PERIODS.find(p => p.key === period)?.labelEn}</span>
            {period === "lifetime" && (
              <span className="mr-auto opacity-65 text-xs flex items-center gap-1 relative z-10">
                <Globe className="w-3 h-3" /> {lang === "ar" ? "دومين مجاني 3 سنوات" : "Free domain 3 years"}
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── TIER CARDS ─── */}
      <section className="pb-20 container mx-auto px-4 max-w-5xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-black/10 dark:border-white/10 border-t-black dark:border-t-white rounded-full animate-spin" />
            <p className="text-xs text-black/30 dark:text-white/30">{lang === "ar" ? "جاري التحميل..." : "Loading..."}</p>
          </div>
        ) : tierPlans.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <div className="w-16 h-16 bg-black/[0.04] dark:bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Gift className="w-7 h-7 text-black/20 dark:text-white/20" />
            </div>
            <p className="text-black/30 dark:text-white/30 text-sm">{lang === "ar" ? "لا توجد باقات لهذا القطاع بعد" : "No plans for this sector yet"}</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${segment}-${period}`}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-7 pt-10"
            >
              {tierPlans.map((plan: any, idx: number) => (
                <TierCard key={`${plan.id}-${period}`} plan={plan} period={period} idx={idx} segmentColor={activeSeg.color} onSelect={handlePlanSelect} lang={lang} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      {/* ─── COMPARISON TABLE ─── */}
      {tierPlans.length === 3 && (
        <section className="pb-16 container mx-auto px-4 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-7">
            <p className="text-[11px] font-bold text-black/25 dark:text-white/25 uppercase tracking-[3px] mb-2">{lang === "ar" ? "مقارنة" : "Compare"}</p>
            <h2 className="text-2xl font-black text-black dark:text-white">{lang === "ar" ? "قارن بين المستويات" : "Compare Plans"}</h2>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-3xl border border-black/[0.07] dark:border-white/[0.07] overflow-x-auto shadow-sm">
            <div className="min-w-[480px]">
            <div className="grid grid-cols-4 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.06] dark:border-white/[0.06]">
              <div className="p-4 text-xs font-bold text-black/35 dark:text-white/35">{lang === "ar" ? "الميزة" : "Feature"}</div>
              {tierPlans.map((p: any) => {
                const cfg = TIER_META[p.tier] || TIER_META.lite;
                return (
                  <div key={p.id} className="p-4 text-center">
                    <span className={`text-xs font-black px-3 py-1.5 rounded-full bg-gradient-to-r ${cfg.badgeGrad} text-white shadow-sm`}>{lang === "ar" ? cfg.labelAr : cfg.labelEn}</span>
                  </div>
                );
              })}
            </div>
            {[
              { label: lang === "ar" ? `السعر (${PERIODS.find(p=>p.key===period)?.labelAr})` : `Price (${PERIODS.find(p=>p.key===period)?.labelEn})`, values: tierPlans.map((p: any) => `${getPeriodPrice(p,period).toLocaleString()} ${lang === "ar" ? "ر.س" : "SAR"}`) },
              { label: lang === "ar" ? "عدد الميزات" : "Features", values: tierPlans.map((p: any) => lang === "ar" ? `${p.featuresAr?.length ?? 0} ميزة` : `${p.featuresAr?.length ?? 0} features`) },
              { label: lang === "ar" ? "دعم فني"           : "Support",         values: lang === "ar" ? ["شهر واحد", "6 أشهر", "24/7 أولوية"] : ["1 month", "6 months", "24/7 Priority"] },
              { label: lang === "ar" ? "تطبيق جوال"        : "Mobile App",      values: [false, false, true] },
              { label: lang === "ar" ? "دومين مجاني"       : "Free Domain",     values: lang === "ar" ? [false, "سنة واحدة", "3 سنوات"] : [false, "1 year", "3 years"] },
              { label: lang === "ar" ? "دعم متعدد القنوات" : "Multi-channel",   values: [false, true, true] },
            ].map((row, i) => (
              <div key={i} className={`grid grid-cols-4 border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 ${i % 2 !== 0 ? "bg-black/[0.01] dark:bg-white/[0.01]" : ""}`}>
                <div className="p-3.5 text-xs text-black/50 dark:text-white/50 font-medium">{row.label}</div>
                {row.values.map((val: any, vi) => (
                  <div key={vi} className="p-3.5 text-center">
                    {typeof val === "boolean"
                      ? val
                        ? <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        : <X className="w-4 h-4 text-black/12 dark:text-white/12 mx-auto" />
                      : <span className="text-xs font-semibold text-black dark:text-white">{val}</span>}
                  </div>
                ))}
              </div>
            ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* ─── DEMO TRIAL ─── */}
      <section className="pb-12 container mx-auto px-4 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="relative rounded-3xl overflow-hidden border-2 border-emerald-200/50 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 p-8" data-testid="card-demo-plan">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/10 rounded-full blur-2xl" />
            <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow mb-5 relative z-10">
              <Sparkles className="w-3 h-3" /> {lang === "ar" ? "جرّب قبل أن تشتري" : "Try before you buy"}
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
              <div>
                <h3 className="text-2xl font-black text-black dark:text-white mb-3">{lang === "ar" ? "النسخة التجريبية 🎯" : "Free Trial 🎯"}</h3>
                <p className="text-black/50 dark:text-white/50 text-sm leading-relaxed mb-5">{lang === "ar" ? "جرّب نظامك الحقيقي لمدة 7 أيام — بدون تعهد بالشراء" : "Try your real system for 7 days — no commitment required"}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {(lang === "ar"
                    ? ["7 أيام كاملة","نظام حقيقي","دعم فني","بدون تعهد","تُحسم من الباقة"]
                    : ["7 full days","Real system","Technical support","No commitment","Deducted from plan"]
                  ).map(f => (
                    <span key={f} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <Check className="w-3 h-3" />{f}
                    </span>
                  ))}
                </div>
                <Link href="/contact">
                  <Button className="h-12 px-8 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white gap-2 shadow-lg shadow-emerald-500/25" data-testid="button-demo-trial">
                    {lang === "ar" ? "ابدأ تجربتك المجانية" : "Start Free Trial"} <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl font-black text-emerald-600 dark:text-emerald-400 mb-1 leading-none">30</div>
                  <div className="text-black/40 dark:text-white/40 text-lg font-semibold">{lang === "ar" ? "ريال فقط" : "SAR only"}</div>
                  <div className="text-xs text-black/30 dark:text-white/30 mt-1">{lang === "ar" ? "تُحسم من قيمة الباقة عند الاشتراك" : "Deducted from plan price upon subscription"}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── ADDONS ─── */}
      <section className="py-16 bg-[#fafafa] dark:bg-gray-900/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 mb-4 shadow-sm">
              <Plus className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
              <span className="text-black/40 dark:text-white/40 text-xs font-medium">{lang === "ar" ? "إضافات على أي باقة" : "Add-ons for any plan"}</span>
            </div>
            <h2 className="text-3xl font-black text-black dark:text-white">{lang === "ar" ? "ارفع مستوى مشروعك" : "Upgrade Your Project"}</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(lang === "ar" ? [
              { icon: Smartphone, label: "تطبيق جوال",  sub: "iOS + Android",        price: "1,000+", grad: "from-black to-gray-800",       features: ["نشر App Store & Play","iOS و Android","إشعارات Push","تجربة أصيلة"], btn: "bg-white text-black" },
              { icon: TrendingUp, label: "SEO & تسويق", sub: "تحسين محركات البحث",  price: "500+",   grad: "from-violet-600 to-purple-700", features: ["SEO احترافي","Google Analytics","Sitemap XML","تقرير شهري"],       btn: "bg-white text-violet-700" },
              { icon: Palette,    label: "هوية بصرية",  sub: "شعار + هوية كاملة",   price: "800+",   grad: "from-amber-400 to-orange-500",  features: ["تصميم شعار","دليل الهوية","ألوان وخطوط","كل الصيغ"],            btn: "bg-white text-amber-600" },
            ] : [
              { icon: Smartphone, label: "Mobile App",  sub: "iOS + Android",        price: "1,000+", grad: "from-black to-gray-800",       features: ["App Store & Play Store","iOS & Android","Push Notifications","Native experience"], btn: "bg-white text-black" },
              { icon: TrendingUp, label: "SEO & Marketing", sub: "Search engine optimization", price: "500+", grad: "from-violet-600 to-purple-700", features: ["Professional SEO","Google Analytics","Sitemap XML","Monthly report"], btn: "bg-white text-violet-700" },
              { icon: Palette,    label: "Brand Identity", sub: "Logo + full identity", price: "800+", grad: "from-amber-400 to-orange-500", features: ["Logo design","Brand guide","Colors & fonts","All formats"], btn: "bg-white text-amber-600" },
            ]).map((a, ai) => (
              <motion.div key={a.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: ai * 0.1 }}
                className={`rounded-3xl bg-gradient-to-br ${a.grad} p-7 h-full hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className={`w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-5 relative z-10`}>
                  <a.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-white/60 text-xs font-bold mb-1 relative z-10">{a.label}</p>
                <p className="text-white font-black text-lg mb-0.5 relative z-10">{a.sub}</p>
                <div className="text-4xl font-black text-white mb-1 relative z-10">{a.price}</div>
                <div className="text-white/40 text-sm mb-5 relative z-10">{lang === "ar" ? "ريال يُضاف للباقة" : "SAR added to plan"}</div>
                <div className="space-y-2 mb-6 relative z-10">
                  {a.features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-white/65">
                      <Check className="w-3 h-3 shrink-0 text-white/80" />{f}
                    </div>
                  ))}
                </div>
                <Link href="/contact">
                  <Button className={`w-full h-11 rounded-xl font-bold text-xs ${a.btn} hover:opacity-90 shadow-md relative z-10`}>{lang === "ar" ? "أضف للطلب" : "Add to order"}</Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 relative overflow-hidden bg-black">
        <GridDots />
        <FloatingOrbs />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-white/35 text-[11px] uppercase tracking-[4px] mb-4">{lang === "ar" ? "باقة مخصصة" : "Custom Plan"}</p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5">{lang === "ar" ? "تحتاج عرضاً خاصاً؟" : "Need a custom quote?"}</h2>
            <p className="text-white/40 text-base mb-8 max-w-md mx-auto leading-relaxed">{lang === "ar" ? "تواصل معنا وسنعدّ لك عرضاً يناسب احتياجاتك وميزانيتك تماماً" : "Contact us and we'll prepare a quote tailored exactly to your needs and budget"}</p>
            <Link href="/contact">
              <Button size="lg" className="bg-white text-black h-13 px-10 rounded-2xl font-black hover:bg-white/90 shadow-xl shadow-white/10 gap-2" data-testid="button-custom-pricing">
                {lang === "ar" ? "تواصل معنا الآن" : "Contact Us Now"} <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* ── Plan Order Dialog ── */}
      <Dialog open={!!selectedPlan} onOpenChange={v => !v && setSelectedPlan(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl border border-white/[0.08] shadow-2xl bg-[#0a0a0f]" dir={dir}>
          {selectedPlan && (() => {
            const cfg = TIER_META[selectedPlan.plan.tier] || TIER_META.lite;
            const cfgLabel = lang === "ar" ? cfg.labelAr : cfg.labelEn;
            const segInfo = SEGMENTS.find(s => s.key === selectedPlan.plan.segment);
            const periodLabel = lang === "ar" ? PERIODS.find(p => p.key === selectedPlan.period)?.labelAr : PERIODS.find(p => p.key === selectedPlan.period)?.labelEn;
            const planName = lang === "ar" ? (selectedPlan.plan.nameAr || cfgLabel) : (selectedPlan.plan.nameEn || selectedPlan.plan.nameAr || cfgLabel);
            const planFeatures = lang === "ar" ? selectedPlan.plan.featuresAr : (selectedPlan.plan.featuresEn || selectedPlan.plan.featuresAr);
            return (
              <div className="flex flex-col">
                {/* Header */}
                <div className="p-6 pb-5 relative overflow-hidden border-b border-white/[0.06]">
                  <div className={`absolute inset-0 bg-gradient-to-br ${cfg.accent} opacity-60`} />
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "18px 18px" }} />
                  <button onClick={() => setSelectedPlan(null)} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10">
                    <X className="w-4 h-4 text-white/70" />
                  </button>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                        <QiroxIcon className="w-6 h-6 object-contain" />
                      </div>
                      <div>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{lang === "ar" ? "الباقة المختارة" : "Selected Plan"}</p>
                        <p className={`font-black text-lg leading-tight ${cfg.accentText}`}>{planName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full border border-white/10">
                        <span className="text-white font-black text-sm">{selectedPlan.price.toLocaleString()} {lang === "ar" ? "ريال" : "SAR"}</span>
                        <span className="text-white/40 text-xs">/ {periodLabel}</span>
                      </div>
                      <span className={`text-[10px] font-black px-3 py-1.5 rounded-full bg-gradient-to-r ${cfg.badgeGrad} text-white`}>{cfgLabel}</span>
                      {segInfo && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full border border-white/10">
                          <segInfo.icon className="w-3 h-3 text-white/50" />
                          <span className="text-white/60 text-xs font-medium">{lang === "ar" ? segInfo.labelAr : segInfo.labelEn}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  <p className="text-white/40 text-sm mb-5 leading-relaxed">
                    {lang === "ar"
                      ? <>اخترت <strong className={cfg.accentText}>{planName}</strong>. ستنتقل الآن لإتمام بيانات مشروعك.</>
                      : <>You selected <strong className={cfg.accentText}>{planName}</strong>. You'll now complete your project details.</>}
                  </p>
                  <div className="space-y-2.5 mb-6">
                    {planFeatures?.slice(0, 5).map((f: string, i: number) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm text-white/50">
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${cfg.checkColor}`} />
                        {f}
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={handleGoToOrder}
                    className={`w-full h-12 rounded-2xl font-bold text-sm gap-2 bg-gradient-to-r ${cfg.badgeGrad} text-white hover:opacity-90 shadow-lg`}
                    data-testid="button-confirm-order"
                  >
                    {lang === "ar" ? "ابدأ طلبك الآن" : "Start Your Order"} <ArrowLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
