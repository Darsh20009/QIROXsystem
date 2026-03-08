import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { usePricingPlans } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useState, useMemo, useEffect } from "react";
import {
  Loader2, Check, ArrowLeft, X, Globe, Tag, Gift, Plus, Shield, Headphones,
  Clock, Smartphone, Palette, TrendingUp, Infinity as InfinityIcon, Crown, CalendarDays, CalendarRange,
  Calendar, Zap, Star, UtensilsCrossed, ShoppingBag, GraduationCap, Building2, Home, Heart, ChevronRight, Dumbbell, Store,
  CheckCircle2, Sparkles
} from "lucide-react";
import { QiroxIcon } from "@/components/qirox-brand";

type BillingPeriod = "monthly" | "sixmonth" | "annual" | "lifetime";

const PERIODS: { key: BillingPeriod; labelAr: string; labelEn: string; sublabelAr: string; sublabelEn: string; icon: any; badgeAr?: string; badgeEn?: string }[] = [
  { key: "monthly",  labelAr: "شهري",       labelEn: "Monthly",   sublabelAr: "ادفع كل شهر",   sublabelEn: "Pay monthly",    icon: Calendar },
  { key: "sixmonth", labelAr: "نصف سنوي",   labelEn: "6 Months",  sublabelAr: "6 أشهر",         sublabelEn: "6 months",       icon: CalendarRange, badgeAr: "وفّر 30%", badgeEn: "Save 30%" },
  { key: "annual",   labelAr: "سنوي",       labelEn: "Annual",    sublabelAr: "سنة كاملة",      sublabelEn: "Full year",      icon: CalendarDays,  badgeAr: "الأوفر",   badgeEn: "Best Value" },
  { key: "lifetime", labelAr: "مدى الحياة", labelEn: "Lifetime",  sublabelAr: "دفعة واحدة",     sublabelEn: "One-time",       icon: InfinityIcon,  badgeAr: "دائم",     badgeEn: "Forever" },
];

const SEGMENT_LOOKUP: Record<string, { labelAr: string; labelEn: string; icon: any; color: string }> = {
  restaurant:    { labelAr: "مطاعم ومقاهي",    labelEn: "Restaurants",   icon: UtensilsCrossed, color: "text-orange-600" },
  ecommerce:     { labelAr: "متاجر إلكترونية", labelEn: "E-Commerce",    icon: ShoppingBag,     color: "text-blue-600" },
  store:         { labelAr: "متاجر إلكترونية", labelEn: "E-Commerce",    icon: Store,           color: "text-blue-600" },
  education:     { labelAr: "منصات تعليمية",   labelEn: "Education",     icon: GraduationCap,   color: "text-violet-600" },
  corporate:     { labelAr: "شركات ومؤسسات",   labelEn: "Corporate",     icon: Building2,       color: "text-slate-600" },
  other:         { labelAr: "شركات ومؤسسات",   labelEn: "Corporate",     icon: Building2,       color: "text-slate-600" },
  realestate:    { labelAr: "عقارات",           labelEn: "Real Estate",   icon: Home,            color: "text-teal-600" },
  healthcare:    { labelAr: "صحة وعيادات",      labelEn: "Healthcare",    icon: Heart,           color: "text-rose-600" },
  health:        { labelAr: "صحة ولياقة",       labelEn: "Health",        icon: Heart,           color: "text-rose-600" },
  fitness:       { labelAr: "لياقة وجيم",       labelEn: "Fitness",       icon: Dumbbell,        color: "text-green-600" },
  beauty:        { labelAr: "تجميل وصالونات",  labelEn: "Beauty",        icon: Sparkles,        color: "text-pink-600" },
  tech:          { labelAr: "تقنية وبرمجة",    labelEn: "Technology",    icon: Globe,           color: "text-blue-700" },
  food:          { labelAr: "مطاعم ومقاهي",    labelEn: "Restaurants",   icon: UtensilsCrossed, color: "text-orange-600" },
  commerce:      { labelAr: "متاجر إلكترونية", labelEn: "E-Commerce",    icon: ShoppingBag,     color: "text-blue-600" },
  institutional: { labelAr: "مؤسسات وجمعيات",  labelEn: "Institutions",  icon: Building2,       color: "text-slate-600" },
  personal:      { labelAr: "خدمات شخصية",     labelEn: "Personal",      icon: Globe,           color: "text-purple-600" },
  general:       { labelAr: "عام",              labelEn: "General",       icon: Globe,           color: "text-slate-600" },
};

const TIER_META: Record<string, {
  labelAr: string; labelEn: string; icon: any;
  headerBg: string; accentText: string; badgeStyle: string; checkColor: string; ctaBg: string;
}> = {
  lite: {
    labelAr: "لايت", labelEn: "Lite", icon: Zap,
    headerBg: "bg-slate-50 dark:bg-slate-800/60",
    accentText: "text-slate-800 dark:text-slate-100",
    badgeStyle: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600",
    checkColor: "text-slate-600 dark:text-slate-300",
    ctaBg: "bg-slate-800 hover:bg-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 text-white",
  },
  pro: {
    labelAr: "برو", labelEn: "Pro", icon: Star,
    headerBg: "bg-blue-600",
    accentText: "text-white",
    badgeStyle: "bg-white/20 text-white border border-white/30",
    checkColor: "text-blue-100",
    ctaBg: "bg-white text-blue-600 hover:bg-blue-50",
  },
  infinite: {
    labelAr: "إنفينتي", labelEn: "Infinite", icon: InfinityIcon,
    headerBg: "bg-slate-900 dark:bg-slate-950",
    accentText: "text-white",
    badgeStyle: "bg-amber-400/20 text-amber-300 border border-amber-400/30",
    checkColor: "text-amber-400",
    ctaBg: "bg-amber-400 hover:bg-amber-500 text-slate-900",
  },
};

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

function TierCard({ plan, period, idx, isPopularOverride, onSelect, lang }: {
  plan: any; period: BillingPeriod; idx: number; isPopularOverride?: boolean;
  onSelect: (plan: any, price: number, period: BillingPeriod) => void; lang: string;
}) {
  const cfg = TIER_META[plan.tier] || TIER_META.lite;
  const cfgLabel = lang === "ar" ? cfg.labelAr : cfg.labelEn;
  const price = getPeriodPrice(plan, period);
  const isPopular = plan.isPopular || isPopularOverride;
  const monthlyBase = plan.monthlyPrice ?? 0;
  const monthlyEquiv = period === "monthly" ? price
    : period === "sixmonth" ? Math.round(price / 6)
    : period === "annual"   ? Math.round(price / 12) : null;
  const saving = monthlyEquiv && monthlyBase ? Math.round(((monthlyBase - monthlyEquiv) / monthlyBase) * 100) : 0;
  const isPro = plan.tier === "pro";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.1 }}
      className={`relative flex flex-col rounded-2xl border overflow-hidden transition-shadow duration-300 hover:shadow-xl ${
        isPro
          ? "border-blue-600 shadow-lg shadow-blue-600/15 dark:shadow-blue-700/20"
          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
      }`}
      data-testid={`card-tier-${plan.tier}`}
    >
      {isPopular && (
        <div className="absolute -top-px inset-x-0 h-1 bg-blue-600" />
      )}

      {/* Card Header */}
      <div className={`p-6 ${cfg.headerBg}`}>
        {isPopular && (
          <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full mb-3 border border-white/30">
            <Crown className="w-3 h-3" /> {lang === "ar" ? "الأكثر طلباً" : "Most Popular"}
          </span>
        )}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <cfg.icon className={`w-5 h-5 ${cfg.accentText} opacity-80`} />
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-0.5 ${isPro ? "text-white/60" : "text-slate-400 dark:text-slate-500"}`}>QIROX</p>
              <p className={`text-sm font-black ${cfg.accentText}`}>{lang === "ar" ? plan.nameAr : (plan.nameEn || plan.nameAr)}</p>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cfg.badgeStyle}`}>{cfgLabel}</span>
        </div>
        <p className={`text-xs leading-relaxed min-h-8 ${isPro ? "text-white/65" : "text-slate-500 dark:text-slate-400"}`}>
          {lang === "ar" ? plan.descriptionAr : (plan.descriptionEn || plan.descriptionAr)}
        </p>
      </div>

      {/* Price Section */}
      <div className={`px-6 py-5 border-b ${isPro ? "bg-blue-600/95 border-white/10" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"}`}>
        <AnimatePresence mode="wait">
          <motion.div key={`${plan.tier}-${period}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className={`text-4xl font-black tracking-tight ${isPro ? "text-white" : "text-slate-900 dark:text-white"}`}>{price.toLocaleString()}</span>
              <span className={`text-sm font-medium ${isPro ? "text-white/60" : "text-slate-400"}`}>{lang === "ar" ? "ريال" : "SAR"}</span>
              <span className={`text-xs ${isPro ? "text-white/40" : "text-slate-400"}`}>{getPeriodSuffix(period, lang)}</span>
            </div>
            {monthlyEquiv && period !== "monthly" && (
              <p className={`text-[11px] mt-1.5 flex items-center gap-1.5 flex-wrap ${isPro ? "text-white/50" : "text-slate-400"}`}>
                {lang === "ar"
                  ? <span>= <span className="font-semibold">{monthlyEquiv.toLocaleString()} ر.س/شهر</span></span>
                  : <span>= <span className="font-semibold">{monthlyEquiv.toLocaleString()} SAR/mo</span></span>}
                {saving > 0 && (
                  <span className={`font-bold text-emerald-${isPro ? "200" : "600"}`}>
                    {lang === "ar" ? `— وفّر ${saving}%` : `— Save ${saving}%`}
                  </span>
                )}
              </p>
            )}
            {period === "lifetime" && (
              <p className={`text-[11px] mt-1.5 flex items-center gap-1 ${isPro ? "text-white/50" : "text-slate-400"}`}>
                <Globe className="w-3 h-3" /> {lang === "ar" ? "دومين مجاني 3 سنوات" : "Free domain for 3 years"}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Features */}
      <div className={`flex-1 px-6 py-5 ${isPro ? "bg-blue-600/90" : "bg-white dark:bg-slate-900"}`}>
        <div className="space-y-3">
          {(lang === "ar" ? plan.featuresAr : (plan.featuresEn || plan.featuresAr))?.map((f: string, i: number) => (
            <div key={i} className="flex items-start gap-2.5">
              <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${cfg.checkColor}`} />
              <span className={`text-xs leading-relaxed ${isPro ? "text-white/75" : "text-slate-600 dark:text-slate-300"}`}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className={`px-6 py-5 ${isPro ? "bg-blue-600/90" : "bg-white dark:bg-slate-900"} border-t ${isPro ? "border-white/10" : "border-slate-100 dark:border-slate-800"}`}>
        <Button
          onClick={() => onSelect(plan, price, period)}
          className={`w-full h-11 rounded-xl font-bold text-sm gap-2 transition-all ${cfg.ctaBg}`}
          data-testid={`button-select-${plan.tier}`}
        >
          {lang === "ar" ? `اختر ${cfgLabel}` : `Choose ${cfgLabel}`} <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

export default function Prices() {
  const { data: plans, isLoading } = usePricingPlans();
  const { lang, dir } = useI18n();

  const segments = useMemo(() => {
    if (!plans || plans.length === 0) return Object.entries(SEGMENT_LOOKUP).slice(0, 6).map(([k, v]) => ({ key: k, ...v }));
    const seen = new Set<string>();
    const result: (typeof SEGMENT_LOOKUP[string] & { key: string })[] = [];
    for (const p of plans) {
      const k: string = p.segment;
      if (!k || k === "general" || seen.has(k)) continue;
      seen.add(k);
      const meta = SEGMENT_LOOKUP[k] ?? { labelAr: k, labelEn: k, icon: Globe, color: "text-slate-600" };
      result.push({ key: k, ...meta });
    }
    return result.length > 0 ? result : Object.entries(SEGMENT_LOOKUP).slice(0, 6).map(([k, v]) => ({ key: k, ...v }));
  }, [plans]);

  const [segment, setSegment] = useState("");
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

  useEffect(() => {
    if (!segment && segments.length > 0) setSegment(segments[0].key);
  }, [segments, segment]);

  const activeSeg = segments.find(s => s.key === segment) ?? segments[0] ?? { key: "general", labelAr: "عام", labelEn: "General", icon: Globe, color: "text-slate-600" };
  const tierPlans = plans?.filter((p: any) =>
    p.segment === segment && ["lite","pro","infinite"].includes(p.tier ?? "")
  ).sort((a: any, b: any) =>
    (({ lite:1, pro:2, infinite:3 } as Record<string,number>)[a.tier ?? ""] ?? 9) - (({ lite:1, pro:2, infinite:3 } as Record<string,number>)[b.tier ?? ""] ?? 9)
  ) ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950" dir={dir}>
      <Navigation />

      {/* ─── HERO ─── */}
      <section className="pt-24 pb-16 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Tag className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {lang === "ar" ? "الأسعار والباقات" : "Pricing & Plans"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 leading-tight tracking-tight">
                  {lang === "ar" ? <>باقات واضحة،<br />بدون مفاجآت</> : <>Clear pricing,<br />no surprises</>}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed max-w-md">
                  {lang === "ar"
                    ? "كل قطاع له نظامه الخاص — اختر قطاعك ثم المستوى الذي يناسب حجم نشاطك."
                    : "Every sector has its own system — choose your sector then the level that fits your business size."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Shield,     label: lang === "ar" ? "ضمان الجودة"    : "Quality Guarantee" },
                  { icon: Headphones, label: lang === "ar" ? "دعم 24/7"        : "24/7 Support" },
                  { icon: Clock,      label: lang === "ar" ? "تسليم في الموعد" : "On-time Delivery" },
                  { icon: Globe,      label: lang === "ar" ? "نطاق مجاني"      : "Free Domain" },
                ].map(({ icon: Ic, label }) => (
                  <div key={label} className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <Ic className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── SEGMENT SELECTOR ─── */}
      <section className="py-8 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4 max-w-5xl">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
            {lang === "ar" ? "نوع المشروع" : "Project Type"}
          </p>
          <div className="flex flex-wrap gap-2" data-testid="segment-selector">
            {segments.map(seg => {
              const Icon = seg.icon;
              const isActive = segment === seg.key;
              return (
                <button
                  key={seg.key}
                  onClick={() => setSegment(seg.key)}
                  data-testid={`btn-segment-${seg.key}`}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? (lang === "ar" ? "text-white dark:text-slate-900" : "text-white dark:text-slate-900") : seg.color}`} />
                  {lang === "ar" ? seg.labelAr : seg.labelEn}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── BILLING PERIOD TABS ─── */}
      <section className="py-6 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-wrap items-center gap-2" data-testid="billing-period-selector">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 ml-1">
              {lang === "ar" ? "دورة الفوترة:" : "Billing:"}
            </span>
            {PERIODS.map(({ key, labelAr, labelEn, badgeAr, badgeEn }) => {
              const pLabel  = lang === "ar" ? labelAr : labelEn;
              const pBadge  = lang === "ar" ? badgeAr : badgeEn;
              const isActive = period === key;
              return (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  data-testid={`tab-period-${key}`}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                    isActive
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  {pLabel}
                  {pBadge && !isActive && (
                    <span className="text-[9px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                      {pBadge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── TIER CARDS ─── */}
      <section className="py-12 container mx-auto px-4 max-w-5xl">
        {/* Active context breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-sm text-slate-500 dark:text-slate-400">
          <activeSeg.icon className={`w-4 h-4 ${activeSeg.color}`} />
          <span className="font-medium text-slate-700 dark:text-slate-200">{lang === "ar" ? activeSeg.labelAr : activeSeg.labelEn}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          <span>{lang === "ar" ? PERIODS.find(p => p.key === period)?.labelAr : PERIODS.find(p => p.key === period)?.labelEn}</span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            <p className="text-sm text-slate-400">{lang === "ar" ? "جاري التحميل..." : "Loading..."}</p>
          </div>
        ) : tierPlans.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Gift className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">
              {lang === "ar" ? "لا توجد باقات لهذا القطاع بعد" : "No plans for this sector yet"}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${segment}-${period}`}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {tierPlans.map((plan: any, idx: number) => (
                <TierCard key={`${plan.id}-${period}`} plan={plan} period={period} idx={idx} isPopularOverride={plan.tier === "pro"} onSelect={handlePlanSelect} lang={lang} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      {/* ─── COMPARISON TABLE ─── */}
      {tierPlans.length === 3 && (
        <section className="pb-16 container mx-auto px-4 max-w-5xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-4">
              {lang === "ar" ? "مقارنة الباقات" : "Plan Comparison"}
            </h2>
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
            <div className="min-w-[480px]">
              <div className="grid grid-cols-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <div className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {lang === "ar" ? "الميزة" : "Feature"}
                </div>
                {tierPlans.map((p: any) => {
                  const cfg = TIER_META[p.tier] || TIER_META.lite;
                  return (
                    <div key={p.id} className="p-4 text-center">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {lang === "ar" ? cfg.labelAr : cfg.labelEn}
                      </span>
                    </div>
                  );
                })}
              </div>
              {[
                { label: lang === "ar" ? `السعر (${PERIODS.find(p=>p.key===period)?.labelAr})` : `Price (${PERIODS.find(p=>p.key===period)?.labelEn})`, values: tierPlans.map((p: any) => `${getPeriodPrice(p,period).toLocaleString()} ${lang === "ar" ? "ر.س" : "SAR"}`) },
                { label: lang === "ar" ? "عدد الميزات" : "Features", values: tierPlans.map((p: any) => lang === "ar" ? `${p.featuresAr?.length ?? 0} ميزة` : `${p.featuresAr?.length ?? 0} features`) },
                { label: lang === "ar" ? "دعم فني"           : "Support",        values: lang === "ar" ? ["شهر واحد", "6 أشهر", "24/7 أولوية"] : ["1 month", "6 months", "24/7 Priority"] },
                { label: lang === "ar" ? "تطبيق جوال"        : "Mobile App",     values: [false, false, true] },
                { label: lang === "ar" ? "دومين مجاني"       : "Free Domain",    values: lang === "ar" ? [false, "سنة واحدة", "3 سنوات"] : [false, "1 year", "3 years"] },
                { label: lang === "ar" ? "دعم متعدد القنوات" : "Multi-channel",  values: [false, true, true] },
              ].map((row, i) => (
                <div key={i} className={`grid grid-cols-4 border-b border-slate-100 dark:border-slate-800 last:border-0 ${i % 2 !== 0 ? "bg-slate-50/50 dark:bg-slate-900/30" : ""}`}>
                  <div className="p-3.5 text-xs text-slate-600 dark:text-slate-400 font-medium">{row.label}</div>
                  {row.values.map((val: any, vi) => (
                    <div key={vi} className="p-3.5 text-center">
                      {typeof val === "boolean"
                        ? val
                          ? <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                          : <X className="w-4 h-4 text-slate-200 dark:text-slate-700 mx-auto" />
                        : <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{val}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── DEMO TRIAL ─── */}
      <section className="py-12 bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-white dark:bg-slate-950 overflow-hidden" data-testid="card-demo-plan">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 border-b md:border-b-0 md:border-l md:border-r-0 rtl:md:border-r rtl:md:border-l-0 border-emerald-100 dark:border-emerald-800/30">
                <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-5">
                  {lang === "ar" ? "جرّب قبل أن تشتري" : "Try before you buy"}
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{lang === "ar" ? "النسخة التجريبية" : "Free Trial"}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-5">
                  {lang === "ar" ? "جرّب نظامك الحقيقي لمدة 7 أيام — بدون تعهد بالشراء" : "Try your real system for 7 days — no purchase commitment"}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {(lang === "ar"
                    ? ["7 أيام كاملة","نظام حقيقي","دعم فني","بدون تعهد","تُحسم من الباقة"]
                    : ["7 full days","Real system","Technical support","No commitment","Deducted from plan"]
                  ).map(f => (
                    <span key={f} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                      <Check className="w-3 h-3" />{f}
                    </span>
                  ))}
                </div>
                <Link href="/contact">
                  <Button className="h-11 px-7 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2" data-testid="button-demo-trial">
                    {lang === "ar" ? "ابدأ تجربتك المجانية" : "Start Free Trial"} <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="p-8 bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-7xl font-black text-emerald-600 dark:text-emerald-400 mb-1 leading-none">30</div>
                  <div className="text-slate-500 dark:text-slate-400 font-semibold">{lang === "ar" ? "ريال فقط" : "SAR only"}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-2 max-w-[160px]">{lang === "ar" ? "تُحسم من قيمة الباقة عند الاشتراك" : "Deducted from plan price upon subscription"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ADDONS ─── */}
      <section className="py-16 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
              <Plus className="w-4 h-4 text-white dark:text-slate-900" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">{lang === "ar" ? "الإضافات" : "Add-ons"}</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">{lang === "ar" ? "تُضاف إلى أي باقة" : "Available on any plan"}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(lang === "ar" ? [
              { icon: Smartphone, label: "تطبيق جوال",  sub: "iOS + Android",        price: "1,000+", features: ["نشر App Store & Play","iOS و Android","إشعارات Push","تجربة أصيلة"], accent: "border-slate-300 dark:border-slate-600" },
              { icon: TrendingUp, label: "SEO & تسويق", sub: "تحسين محركات البحث",  price: "500+",   features: ["SEO احترافي","Google Analytics","Sitemap XML","تقرير شهري"],       accent: "border-violet-200 dark:border-violet-800/50" },
              { icon: Palette,    label: "هوية بصرية",  sub: "شعار + هوية كاملة",   price: "800+",   features: ["تصميم شعار","دليل الهوية","ألوان وخطوط","كل الصيغ"],            accent: "border-amber-200 dark:border-amber-800/50" },
            ] : [
              { icon: Smartphone, label: "Mobile App",      sub: "iOS + Android",               price: "1,000+", features: ["App Store & Play","iOS & Android","Push Notifications","Native experience"], accent: "border-slate-300 dark:border-slate-600" },
              { icon: TrendingUp, label: "SEO & Marketing", sub: "Search engine optimization",   price: "500+",   features: ["Professional SEO","Google Analytics","Sitemap XML","Monthly report"],       accent: "border-violet-200 dark:border-violet-800/50" },
              { icon: Palette,    label: "Brand Identity",  sub: "Logo + full identity",         price: "800+",   features: ["Logo design","Brand guide","Colors & fonts","All formats"],                  accent: "border-amber-200 dark:border-amber-800/50" },
            ]).map((a, ai) => (
              <motion.div
                key={a.label}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: ai * 0.08 }}
                className={`rounded-xl border-2 ${a.accent} bg-white dark:bg-slate-900 p-6 hover:shadow-lg transition-shadow duration-300`}
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <a.icon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                </div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{a.label}</p>
                <p className="text-slate-900 dark:text-white font-black text-base mb-3">{a.sub}</p>
                <div className="flex items-baseline gap-1.5 mb-4">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{a.price}</span>
                  <span className="text-sm text-slate-400">{lang === "ar" ? "ريال" : "SAR"}</span>
                </div>
                <div className="space-y-2 mb-5">
                  {a.features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />{f}
                    </div>
                  ))}
                </div>
                <Link href="/contact">
                  <Button variant="outline" className="w-full h-9 rounded-lg font-bold text-xs border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                    {lang === "ar" ? "أضف للطلب" : "Add to order"}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-16 bg-slate-900 dark:bg-slate-950">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">
                {lang === "ar" ? "باقة مخصصة" : "Custom Plan"}
              </p>
              <h2 className="text-3xl font-black text-white mb-3">
                {lang === "ar" ? "تحتاج عرضاً خاصاً؟" : "Need a custom quote?"}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                {lang === "ar"
                  ? "تواصل معنا وسنعدّ لك عرضاً يناسب احتياجاتك وميزانيتك تماماً."
                  : "Contact us and we'll prepare a quote tailored exactly to your needs and budget."}
              </p>
            </div>
            <div className="flex md:justify-end">
              <Link href="/contact">
                <Button size="lg" className="bg-white text-slate-900 h-12 px-8 rounded-xl font-black hover:bg-slate-100 gap-2" data-testid="button-custom-pricing">
                  {lang === "ar" ? "تواصل معنا الآن" : "Contact Us Now"} <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* ── Plan Order Dialog ── */}
      <Dialog open={!!selectedPlan} onOpenChange={v => !v && setSelectedPlan(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl bg-white dark:bg-slate-900" dir={dir}>
          {selectedPlan && (() => {
            const cfg = TIER_META[selectedPlan.plan.tier] || TIER_META.lite;
            const cfgLabel = lang === "ar" ? cfg.labelAr : cfg.labelEn;
            const segInfo = segments.find(s => s.key === selectedPlan.plan.segment) ?? (SEGMENT_LOOKUP[selectedPlan.plan.segment] ? { key: selectedPlan.plan.segment, ...SEGMENT_LOOKUP[selectedPlan.plan.segment] } : null);
            const periodLabel = lang === "ar" ? PERIODS.find(p => p.key === selectedPlan.period)?.labelAr : PERIODS.find(p => p.key === selectedPlan.period)?.labelEn;
            const planName = lang === "ar" ? (selectedPlan.plan.nameAr || cfgLabel) : (selectedPlan.plan.nameEn || selectedPlan.plan.nameAr || cfgLabel);
            const planFeatures = lang === "ar" ? selectedPlan.plan.featuresAr : (selectedPlan.plan.featuresEn || selectedPlan.plan.featuresAr);
            return (
              <div className="flex flex-col">
                {/* Header */}
                <div className="px-6 pt-6 pb-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <QiroxIcon className="w-6 h-6 object-contain" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{lang === "ar" ? "الباقة المختارة" : "Selected Plan"}</p>
                        <p className="font-black text-lg text-slate-900 dark:text-white leading-tight">{planName}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPlan(null)}
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-900 dark:text-white font-black text-sm">{selectedPlan.price.toLocaleString()} {lang === "ar" ? "ريال" : "SAR"}</span>
                      <span className="text-slate-400 text-xs">/ {periodLabel}</span>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">{cfgLabel}</span>
                    {segInfo && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <segInfo.icon className={`w-3.5 h-3.5 ${segInfo.color}`} />
                        <span className="text-slate-600 dark:text-slate-300 text-xs font-medium">{lang === "ar" ? segInfo.labelAr : segInfo.labelEn}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-5 leading-relaxed">
                    {lang === "ar"
                      ? <>اخترت <strong className="text-slate-900 dark:text-white">{planName}</strong>. ستنتقل الآن لإتمام بيانات مشروعك.</>
                      : <>You selected <strong className="text-slate-900 dark:text-white">{planName}</strong>. You'll now complete your project details.</>}
                  </p>
                  <div className="space-y-2.5 mb-6">
                    {planFeatures?.slice(0, 5).map((f: string, i: number) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                        {f}
                      </div>
                    ))}
                    {(planFeatures?.length ?? 0) > 5 && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mr-6 rtl:mr-0 rtl:ml-6">
                        {lang === "ar" ? `+ ${planFeatures.length - 5} ميزة أخرى` : `+ ${planFeatures.length - 5} more features`}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleGoToOrder} className="flex-1 h-11 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white gap-2" data-testid="button-confirm-plan">
                      {lang === "ar" ? "متابعة الطلب" : "Continue to Order"} <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedPlan(null)} className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-700" data-testid="button-cancel-plan">
                      {lang === "ar" ? "إلغاء" : "Cancel"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
