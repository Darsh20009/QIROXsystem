import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { usePricingPlans } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import {
  Loader2, Check, ArrowLeft, Star, X,
  Globe, Phone, Tag, Gift, Plus, Sparkles, Shield, Headphones,
  Clock, ChevronRight, Smartphone, Palette, TrendingUp,
  Infinity, Crown, CalendarDays, CalendarRange, Calendar, Zap
} from "lucide-react";

type BillingPeriod = "monthly" | "sixmonth" | "annual" | "lifetime";

const PERIODS: { key: BillingPeriod; label: string; sublabel: string; icon: any; highlight?: string }[] = [
  { key: "monthly",  label: "شهري",       sublabel: "ادفع كل شهر",     icon: Calendar },
  { key: "sixmonth", label: "نصف سنوي",   sublabel: "6 أشهر",          icon: CalendarRange, highlight: "وفّر حتى 35%" },
  { key: "annual",   label: "سنوي",       sublabel: "سنة كاملة",       icon: CalendarDays,  highlight: "الأوفر شهرياً ★" },
  { key: "lifetime", label: "مدى الحياة", sublabel: "دفعة واحدة",      icon: Infinity,      highlight: "ملكية دائمة ∞" },
];

const TIER_CONFIG: Record<string, {
  label: string; icon: any;
  gradient: string; iconBg: string; iconText: string;
  border: string; glow: string; checkColor: string;
  headerGrad: string;
}> = {
  lite: {
    label: "لايت",  icon: Zap,
    gradient: "from-teal-50/60 to-white",
    iconBg: "bg-teal-500/10", iconText: "text-teal-600",
    border: "border-teal-200/60", glow: "hover:shadow-teal-100",
    checkColor: "text-teal-500", headerGrad: "from-teal-500 to-emerald-500",
  },
  pro: {
    label: "برو",   icon: Star,
    gradient: "from-violet-50/60 to-white",
    iconBg: "bg-violet-500/10", iconText: "text-violet-600",
    border: "border-violet-300/70", glow: "hover:shadow-violet-100",
    checkColor: "text-violet-500", headerGrad: "from-violet-600 to-purple-500",
  },
  infinite: {
    label: "إنفينتي", icon: Infinity,
    gradient: "from-gray-950 to-gray-900",
    iconBg: "bg-white/10", iconText: "text-white",
    border: "border-black/30", glow: "hover:shadow-black/20",
    checkColor: "text-white/70", headerGrad: "from-gray-800 to-black",
  },
};

const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] } })
};

function getPeriodPrice(plan: any, period: BillingPeriod): number {
  if (period === "monthly")  return plan.monthlyPrice  ?? 0;
  if (period === "sixmonth") return plan.sixMonthPrice ?? 0;
  if (period === "annual")   return plan.annualPrice   ?? 0;
  return plan.lifetimePrice ?? plan.price ?? 0;
}

function getPeriodSuffix(period: BillingPeriod): string {
  if (period === "monthly")  return "/ شهر";
  if (period === "sixmonth") return "/ 6 أشهر";
  if (period === "annual")   return "/ سنة";
  return "دفعة واحدة";
}

function TierCard({ plan, period, idx }: { plan: any; period: BillingPeriod; idx: number }) {
  const cfg = TIER_CONFIG[plan.tier] || TIER_CONFIG.lite;
  const Icon = cfg.icon;
  const price = getPeriodPrice(plan, period);
  const isPopular = plan.isPopular;
  const isDark = plan.tier === "infinite";

  const monthlyCost = period === "monthly"  ? price
    : period === "sixmonth" ? Math.round(price / 6)
    : period === "annual"   ? Math.round(price / 12)
    : null;

  const monthlyBase = plan.monthlyPrice ?? 0;
  const saving = monthlyCost && monthlyBase ? Math.round(((monthlyBase - monthlyCost) / monthlyBase) * 100) : 0;

  return (
    <motion.div
      initial="hidden" animate="visible" variants={fadeUp} custom={idx}
      className="relative flex flex-col"
      data-testid={`card-tier-${plan.tier}`}
    >
      {isPopular && (
        <div className="absolute -top-4 inset-x-0 flex justify-center z-20">
          <span className="inline-flex items-center gap-1.5 bg-black text-white text-[11px] font-black px-5 py-1.5 rounded-full shadow-lg shadow-black/20">
            <Crown className="w-3 h-3" /> الأكثر طلباً
          </span>
        </div>
      )}

      <div className={`relative flex flex-col flex-1 rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${cfg.glow} ${
        isPopular ? "border-violet-300/80 shadow-xl shadow-violet-100 scale-[1.02] z-10" : cfg.border
      }`}>
        {isPopular && <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-violet-500 via-purple-400 to-violet-600" />}

        <div className={`p-7 flex flex-col flex-1 bg-gradient-to-br ${isDark ? cfg.gradient : `${cfg.gradient} dark:from-gray-900/60 dark:to-gray-800/40`}`}>

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${cfg.iconBg}`}>
              <Icon className={`w-5 h-5 ${cfg.iconText}`} />
            </div>
            <div className={`text-xs font-black px-3 py-1 rounded-full bg-gradient-to-r ${cfg.headerGrad} text-white`}>
              {cfg.label}
            </div>
          </div>

          <h3 className={`text-xl font-black font-heading mb-1.5 ${isDark ? "text-white" : "text-black dark:text-white"}`}>
            {plan.nameAr}
          </h3>
          <p className={`text-xs mb-5 leading-relaxed min-h-[2.5rem] ${isDark ? "text-white/50" : "text-black/40 dark:text-white/40"}`}>
            {plan.descriptionAr}
          </p>

          {/* Price box */}
          <div className={`mb-5 p-4 rounded-xl border ${isDark ? "bg-white/[0.05] border-white/[0.08]" : "bg-black/[0.03] border-black/[0.05]"}`}>
            <AnimatePresence mode="wait">
              <motion.div key={`${plan.tier}-${period}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-4xl font-black tracking-tight ${isDark ? "text-white" : "text-black dark:text-white"}`}>
                    {price.toLocaleString()}
                  </span>
                  <span className={`text-sm font-bold ${isDark ? "text-white/50" : "text-black/40"}`}>ريال</span>
                  <span className={`text-xs ${isDark ? "text-white/30" : "text-black/25"}`}>{getPeriodSuffix(period)}</span>
                </div>
                {monthlyCost && period !== "monthly" && (
                  <p className={`text-[10px] mt-1 ${isDark ? "text-white/35" : "text-black/35"}`}>
                    يُعادل <span className="font-bold">{monthlyCost.toLocaleString()} ر.س/شهر</span>
                    {saving > 0 && <span className="text-emerald-400 mr-1"> — وفّر {saving}%</span>}
                  </p>
                )}
                {period === "lifetime" && (
                  <p className={`text-[10px] mt-1.5 flex items-center gap-1 ${isDark ? "text-white/35" : "text-black/30"}`}>
                    <Globe className="w-3 h-3" /> دومين مجاني 3 سنوات
                  </p>
                )}
                {period !== "lifetime" && (
                  <p className={`text-[10px] mt-1.5 flex items-center gap-1 ${isDark ? "text-white/35" : "text-black/30"}`}>
                    <Shield className="w-3 h-3" /> شامل ضريبة القيمة المضافة
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Features */}
          <div className="space-y-2.5 flex-1 mb-6">
            {plan.featuresAr?.map((feature: string, i: number) => (
              <div key={i} className={`flex items-start gap-2.5 text-xs ${isDark ? "text-white/55" : "text-black/55 dark:text-white/55"}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isDark ? "bg-white/[0.08]" : "bg-black/[0.04]"}`}>
                  <Check className={`w-2.5 h-2.5 ${cfg.checkColor}`} />
                </div>
                <span className="leading-snug">{feature}</span>
              </div>
            ))}
          </div>

          <Link href="/order">
            <Button
              className={`w-full h-11 rounded-xl font-bold text-sm gap-2 transition-all ${
                isDark
                  ? "bg-white text-black hover:bg-white/90"
                  : isPopular
                  ? "bg-black text-white hover:bg-black/80 shadow-lg"
                  : `bg-gradient-to-r ${cfg.headerGrad} text-white hover:opacity-90 shadow-lg`
              }`}
              data-testid={`button-select-${plan.tier}`}
            >
              اختر {cfg.label} <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function Prices() {
  const { data: plans, isLoading } = usePricingPlans();
  const { dir } = useI18n();
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  const tierPlans = plans?.filter(p => !p.isCustom && ["lite","pro","infinite"].includes((p as any).tier ?? ""))
    .sort((a, b) => {
      const ORDER: Record<string, number> = { lite: 1, pro: 2, infinite: 3 };
      return (ORDER[(a as any).tier] || 99) - (ORDER[(b as any).tier] || 99);
    }) ?? [];

  const currentPeriod = PERIODS.find(p => p.key === period)!;

  const trustBadges = [
    { icon: Shield,     label: "ضمان الجودة" },
    { icon: Headphones, label: "دعم فني 24/7" },
    { icon: Clock,      label: "تسليم في الموعد" },
    { icon: Sparkles,   label: "تصميم احترافي" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950" dir={dir}>
      <Navigation />

      {/* Hero */}
      <section className="pt-36 pb-14 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute top-20 left-1/4 w-80 h-80 bg-violet-500/[0.05] rounded-full blur-3xl" />
        <div className="absolute top-32 right-1/4 w-60 h-60 bg-teal-500/[0.04] rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.07] bg-black/[0.02] mb-6">
              <Tag className="w-3.5 h-3.5 text-black/40" />
              <span className="text-black/40 text-xs tracking-wider">الأسعار والباقات</span>
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-black font-heading text-black dark:text-white mb-5 tracking-tight">
              اختر <span className="text-black/25 dark:text-white/25">باقتك المناسبة</span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-black/40 dark:text-white/40 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              ثلاثة مستويات تناسب كل الاحتياجات — ادفع شهرياً أو نصف سنوي أو سنوي، أو امتلك نظامك <strong className="text-black dark:text-white">مدى الحياة</strong>
            </motion.p>

            {/* Trust badges */}
            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap justify-center gap-3 mb-10">
              {trustBadges.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-black/[0.02] border border-black/[0.06] rounded-full text-xs text-black/50">
                  <Icon className="w-3 h-3" /> {label}
                </div>
              ))}
            </motion.div>

            {/* Period Selector */}
            <motion.div variants={fadeUp} custom={4} className="inline-flex items-center gap-1 p-1.5 bg-black/[0.03] border border-black/[0.06] rounded-2xl" data-testid="billing-period-selector">
              {PERIODS.map(({ key, label, sublabel, icon: PIcon, highlight }) => (
                <button key={key} onClick={() => setPeriod(key)} data-testid={`tab-period-${key}`}
                  className={`relative flex flex-col items-center px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 min-w-[80px] md:min-w-[110px] ${
                    period === key ? "bg-black dark:bg-white text-white dark:text-black shadow-lg" : "text-black/45 hover:text-black/75 hover:bg-black/[0.03]"
                  }`}
                >
                  {highlight && period !== key && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
                      {highlight}
                    </span>
                  )}
                  <PIcon className="w-4 h-4 mb-0.5" />
                  <span className="text-xs font-black">{label}</span>
                  <span className={`text-[9px] leading-none mt-0.5 ${period === key ? "text-white/60" : "text-black/30"}`}>{sublabel}</span>
                </button>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Period info bar */}
      <div className="container mx-auto px-4 max-w-5xl mb-2">
        <AnimatePresence mode="wait">
          <motion.div key={period} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className={`rounded-xl px-5 py-3 flex items-center justify-between text-sm ${
              period === "lifetime" ? "bg-black text-white"
              : period === "annual" ? "bg-emerald-50 border border-emerald-200/60 text-emerald-800"
              : period === "sixmonth" ? "bg-blue-50 border border-blue-200/60 text-blue-800"
              : "bg-black/[0.02] border border-black/[0.06] text-black/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <currentPeriod.icon className="w-4 h-4" />
              <span className="font-bold">{currentPeriod.label}</span>
              <span className="opacity-60">— {currentPeriod.sublabel}</span>
            </div>
            {currentPeriod.highlight && (
              <span className="text-xs font-black opacity-80">{currentPeriod.highlight}</span>
            )}
            {period === "lifetime" && (
              <span className="text-xs opacity-60 flex items-center gap-1">
                <Globe className="w-3 h-3" /> يشمل دومين مجاني 3 سنوات
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Tier comparison grid */}
      <section className="pb-20 container mx-auto px-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-black/30" />
            <p className="text-xs text-black/30">جاري التحميل...</p>
          </div>
        ) : tierPlans.length === 0 ? (
          <div className="text-center py-20 text-black/30">لا توجد باقات متاحة حالياً</div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={period} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-8"
            >
              {tierPlans.map((plan, idx) => (
                <TierCard key={`${plan.id}-${period}`} plan={plan} period={period} idx={idx} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      {/* Feature Comparison Table */}
      {tierPlans.length === 3 && (
        <section className="pb-20 container mx-auto px-4 max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-8">
            <h2 className="text-2xl font-bold font-heading text-black dark:text-white mb-2">مقارنة المستويات</h2>
            <p className="text-black/40 text-sm">اختر المستوى الذي يناسب احتياجاتك</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="rounded-2xl border border-black/[0.07] overflow-hidden"
          >
            <div className="grid grid-cols-4 bg-black/[0.02] border-b border-black/[0.07]">
              <div className="p-4 text-xs font-semibold text-black/40">الميزة</div>
              {tierPlans.map(p => {
                const cfg = TIER_CONFIG[(p as any).tier] || TIER_CONFIG.lite;
                return (
                  <div key={p.id} className="p-4 text-center">
                    <span className={`text-xs font-black px-2 py-1 rounded-full bg-gradient-to-r ${cfg.headerGrad} text-white`}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>
            {[
              { label: "الأسعار", values: tierPlans.map(p => `${getPeriodPrice(p as any, period).toLocaleString()} ر.س`) },
              { label: "عدد الصفحات", values: ["حتى 5", "غير محدود", "غير محدود"] },
              { label: "لوحة تحكم", values: [false, true, true] },
              { label: "تحسين SEO", values: [false, true, true] },
              { label: "تطبيق جوال", values: [false, false, true] },
              { label: "بوابة دفع", values: [false, false, true] },
              { label: "دعم فني", values: ["شهر واحد", "6 أشهر", "24/7 أولوية"] },
              { label: "نسخ احتياطي", values: [false, "أسبوعي", "يومي"] },
            ].map((row, i) => (
              <div key={i} className={`grid grid-cols-4 border-b border-black/[0.04] ${i % 2 === 0 ? "" : "bg-black/[0.01]"}`}>
                <div className="p-3.5 text-xs text-black/50 font-medium">{row.label}</div>
                {row.values.map((val, vi) => (
                  <div key={vi} className="p-3.5 text-center">
                    {typeof val === "boolean" ? (
                      val
                        ? <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        : <X className="w-4 h-4 text-black/15 mx-auto" />
                    ) : (
                      <span className="text-xs font-semibold text-black dark:text-white">{val}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </motion.div>
        </section>
      )}

      {/* Demo Trial */}
      <section className="pb-16 container mx-auto px-4 max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
          <div className="rounded-2xl border-2 border-dashed border-black/[0.1] bg-gradient-to-br from-emerald-50/60 to-teal-50/40 p-8 relative overflow-hidden" data-testid="card-demo-plan">
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow">
                <Sparkles className="w-3 h-3" /> جرّب قبل أن تشتري
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mt-8 md:mt-0">
              <div>
                <h3 className="text-2xl font-black font-heading text-black mb-3">النسخة التجريبية 🎯</h3>
                <p className="text-black/50 text-sm leading-relaxed mb-6">
                  جرّب نظامك قبل الشراء الكامل — نمنحك نسخة تجريبية حقيقية لمدة 7 أيام كاملة بدون تعهد بالشراء
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {["7 أيام كاملة", "نظام حقيقي", "دعم فني", "بدون تعهد", "تُحسم من الباقة"].map(f => (
                    <span key={f} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                      <Check className="w-3 h-3" /> {f}
                    </span>
                  ))}
                </div>
                <Link href="/contact">
                  <Button className="h-12 px-8 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white gap-2 shadow-lg shadow-emerald-500/20" data-testid="button-demo-trial">
                    ابدأ تجربتك المجانية <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-7xl font-black text-emerald-600 mb-1">30</div>
                  <div className="text-black/40 text-lg font-semibold">ريال فقط</div>
                  <div className="text-xs text-black/30 mt-1">تُحسم من قيمة الباقة عند الاشتراك</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Add-ons */}
      <section className="py-14 container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.07] bg-white mb-4">
            <Plus className="w-3.5 h-3.5 text-black/40" />
            <span className="text-black/40 text-xs tracking-wider">إضافات على أي باقة</span>
          </div>
          <h2 className="text-2xl font-bold font-heading text-black dark:text-white mb-3">ارفع مستوى مشروعك</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: Smartphone, label: "تطبيق جوال", sublabel: "App Store + Play Store", price: "1,000+", color: "from-gray-950 to-black", textColor: "text-white", subColor: "text-white/40", priceColor: "text-white", descColor: "text-white/30", features: ["نشر على App Store", "نشر على Google Play", "iOS و Android", "إشعارات Push", "تجربة أصلية"], checkClass: "text-white/30", featureClass: "text-white/50", btnClass: "bg-white text-black hover:bg-gray-100", testId: "addon-mobile-app", btnTestId: "button-addon-app" },
            { icon: TrendingUp, label: "SEO & تسويق", sublabel: "SEO + Marketing", price: "500+", color: "from-violet-50/60 to-purple-50/40 border border-black/[0.07]", textColor: "text-black", subColor: "text-violet-600/60", priceColor: "text-black", descColor: "text-black/30", features: ["تحسين SEO احترافي", "ربط Analytics", "خريطة موقع XML", "صفحات OG", "تقرير شهري"], checkClass: "text-violet-500", featureClass: "text-black/50", btnClass: "bg-violet-600 hover:bg-violet-700 text-white", testId: "addon-seo", btnTestId: "button-addon-seo" },
            { icon: Palette, label: "هوية بصرية", sublabel: "Logo & Brand", price: "800+", color: "from-amber-50/60 to-orange-50/40 border border-black/[0.07]", textColor: "text-black", subColor: "text-amber-600/60", priceColor: "text-black", descColor: "text-black/30", features: ["تصميم شعار احترافي", "دليل الهوية", "ألوان وخطوط", "ملفات كل الصيغ", "تطبيق على القرطاسية"], checkClass: "text-amber-500", featureClass: "text-black/50", btnClass: "bg-amber-500 hover:bg-amber-600 text-white", testId: "addon-brand", btnTestId: "button-addon-brand" },
          ].map((a, ai) => (
            <motion.div key={a.label} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={ai}>
              <div className={`rounded-2xl bg-gradient-to-br ${a.color} p-7 h-full relative overflow-hidden hover:shadow-xl transition-all duration-300`} data-testid={a.testId}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.07] flex items-center justify-center">
                    <a.icon className={`w-6 h-6 ${a.subColor}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${a.subColor}`}>{a.label}</p>
                    <p className={`font-bold text-sm ${a.textColor}`}>{a.sublabel}</p>
                  </div>
                </div>
                <div className="mb-5">
                  <div className={`text-4xl font-black mb-0.5 ${a.priceColor}`}>{a.price}</div>
                  <div className={`text-sm ${a.descColor}`}>ريال يُضاف للباقة</div>
                </div>
                <div className="space-y-2.5 mb-5">
                  {a.features.map(f => (
                    <div key={f} className={`flex items-center gap-2 text-xs ${a.featureClass}`}>
                      <Check className={`w-3.5 h-3.5 flex-shrink-0 ${a.checkClass}`} /> {f}
                    </div>
                  ))}
                </div>
                <Link href="/contact">
                  <Button className={`w-full h-10 rounded-xl font-bold text-xs ${a.btnClass}`} data-testid={a.btnTestId}>أضف للطلب</Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden bg-black dark:bg-white">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="container mx-auto px-4 text-center relative z-10">
          <p className="text-white/50 dark:text-black/50 text-xs uppercase tracking-widest mb-4">باقة مخصصة</p>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-white dark:text-black mb-4">تحتاج عرضاً خاصاً؟</h2>
          <p className="text-white/50 dark:text-black/50 text-base mb-8 max-w-md mx-auto">تواصل معنا وسنعدّ لك عرضاً يناسب احتياجاتك وميزانيتك</p>
          <Link href="/contact">
            <Button size="lg" className="bg-white dark:bg-black text-black dark:text-white h-13 px-10 rounded-xl font-semibold hover:bg-white/90 transition-all" data-testid="button-custom-pricing">
              تواصل معنا الآن <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
