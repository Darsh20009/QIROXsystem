import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { usePricingPlans } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import {
  Loader2, Check, ArrowLeft, Star,
  GraduationCap, UtensilsCrossed, ShoppingBag, RefreshCw,
  Globe, Phone, Tag, Gift, Plus, Sparkles, Shield, Headphones,
  Clock, ChevronRight, Smartphone, Palette, TrendingUp,
  Infinity, Crown, CalendarDays, CalendarRange, Calendar
} from "lucide-react";

type BillingPeriod = "monthly" | "sixmonth" | "annual" | "lifetime";

const PERIODS: { key: BillingPeriod; label: string; sublabel: string; icon: any; saveBadge?: string }[] = [
  { key: "monthly",  label: "شهري",       sublabel: "ادفع كل شهر",        icon: Calendar },
  { key: "sixmonth", label: "نصف سنوي",   sublabel: "6 أشهر",              icon: CalendarRange, saveBadge: "وفّر حتى 35%" },
  { key: "annual",   label: "سنوي",       sublabel: "سنة كاملة",           icon: CalendarDays,  saveBadge: "الأوفر شهرياً" },
  { key: "lifetime", label: "مدى الحياة", sublabel: "دفعة واحدة للأبد",    icon: Infinity,      saveBadge: "ملكية دائمة" },
];

const planIcons: Record<string, any> = {
  ecommerce: ShoppingBag,
  education: GraduationCap,
  restaurant: UtensilsCrossed,
};

const planAccents: Record<string, {
  gradient: string; iconBg: string; iconText: string; border: string;
  glow: string; checkColor: string; tabActive: string;
}> = {
  restaurant: {
    gradient: "from-orange-50/80 via-amber-50/50 to-white",
    iconBg: "bg-orange-500/10", iconText: "text-orange-600",
    border: "border-orange-200/50", glow: "hover:shadow-orange-100",
    checkColor: "text-orange-500", tabActive: "bg-orange-500",
  },
  education: {
    gradient: "from-violet-50/80 via-purple-50/50 to-white",
    iconBg: "bg-violet-500/10", iconText: "text-violet-600",
    border: "border-violet-200/50", glow: "hover:shadow-violet-100",
    checkColor: "text-violet-500", tabActive: "bg-violet-600",
  },
  ecommerce: {
    gradient: "from-blue-50/80 via-cyan-50/50 to-white",
    iconBg: "bg-blue-500/10", iconText: "text-blue-600",
    border: "border-blue-200/50", glow: "hover:shadow-blue-100",
    checkColor: "text-blue-500", tabActive: "bg-blue-600",
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

function PlanCard({ plan, idx, period }: { plan: any; idx: number; period: BillingPeriod }) {
  const Icon = planIcons[plan.slug] || Star;
  const accent = planAccents[plan.slug] || planAccents.ecommerce;
  const price = getPeriodPrice(plan, period);
  const isPopular = plan.isPopular;

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
      data-testid={`card-plan-${plan.slug}`}
    >
      {isPopular && (
        <div className="absolute -top-4 inset-x-0 flex justify-center z-20">
          <span className="inline-flex items-center gap-1.5 bg-black text-white text-[11px] font-bold px-5 py-1.5 rounded-full shadow-lg shadow-black/20">
            <Crown className="w-3 h-3" /> الأكثر طلباً
          </span>
        </div>
      )}

      <div className={`relative flex flex-col flex-1 rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${accent.glow} ${
        isPopular ? "border-black/20 shadow-xl scale-[1.02] z-10" : accent.border
      }`}>
        {isPopular && <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-violet-500 via-purple-400 to-violet-600" />}

        <div className={`p-7 flex flex-col flex-1 bg-gradient-to-br dark:from-gray-900/60 dark:to-gray-800/40 ${!isPopular ? accent.gradient : "from-violet-50/80 via-purple-50/50 to-white"}`}>

          <div className="flex items-start justify-between mb-5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accent.iconBg}`}>
              <Icon className={`w-5 h-5 ${accent.iconText}`} />
            </div>
            {period === "lifetime" && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-black text-white">
                <Infinity className="w-3.5 h-3.5" /> مدى الحياة
              </div>
            )}
            {saving > 0 && period !== "monthly" && period !== "lifetime" && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500 text-white">
                وفّر {saving}%
              </div>
            )}
          </div>

          <h3 className="text-lg font-black font-heading text-black dark:text-white mb-1.5">
            {plan.nameAr}
          </h3>
          <p className="text-xs text-black/40 dark:text-white/40 mb-5 leading-relaxed min-h-[2.5rem]">
            {plan.descriptionAr}
          </p>

          {/* Price */}
          <div className="mb-5 p-4 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05]">
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black text-black dark:text-white tracking-tight">
                {price.toLocaleString()}
              </span>
              <span className="text-black/40 dark:text-white/40 text-sm font-bold">ريال</span>
              <span className="text-black/25 dark:text-white/25 text-xs">{getPeriodSuffix(period)}</span>
            </div>
            {monthlyCost && period !== "monthly" && (
              <p className="text-[10px] text-black/35 mt-1">
                يُعادل <span className="font-bold text-black/55">{monthlyCost.toLocaleString()} ريال/شهر</span>
                {saving > 0 && <span className="text-emerald-600 mr-1"> — وفّر {saving}% مقارنةً بالشهري</span>}
              </p>
            )}
            {period === "lifetime" && (
              <p className="text-[10px] text-black/30 mt-1.5 flex items-center gap-1">
                <Globe className="w-3 h-3" /> يشمل دومين مجاني لمدة 3 سنوات
              </p>
            )}
            {period !== "lifetime" && (
              <p className="text-[10px] text-black/30 mt-1.5 flex items-center gap-1">
                <Shield className="w-3 h-3" /> شامل ضريبة القيمة المضافة
              </p>
            )}
          </div>

          {/* Features */}
          <div className="space-y-2.5 flex-1 mb-6">
            {plan.featuresAr?.slice(0, 8).map((feature: string, i: number) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-black/55 dark:text-white/55">
                <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-black/[0.04]">
                  <Check className={`w-2.5 h-2.5 ${accent.checkColor}`} />
                </div>
                <span className="leading-snug">{feature}</span>
              </div>
            ))}
          </div>

          <Link href="/order">
            <Button
              className={`w-full h-11 rounded-xl font-bold text-sm transition-all gap-2 ${
                isPopular
                  ? "bg-black text-white hover:bg-black/80 shadow-lg"
                  : "bg-black/[0.06] dark:bg-white/[0.06] hover:bg-black/[0.12] dark:hover:bg-white/[0.12] text-black dark:text-white border border-black/[0.07] dark:border-white/[0.07]"
              }`}
              data-testid={`button-select-${plan.slug}`}
            >
              اختر هذه الباقة
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function Prices() {
  const { data: plans, isLoading } = usePricingPlans();
  const { lang, dir } = useI18n();
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  const mainPlans = plans?.filter(p => !p.isCustom && ["restaurant","education","ecommerce"].includes(p.slug))
    .sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99)) ?? [];
  const renewalPlan = plans?.find(p => p.isCustom);

  const trustBadges = [
    { icon: Shield,     label: "ضمان الجودة" },
    { icon: Headphones, label: "دعم فني 24/7" },
    { icon: Clock,      label: "تسليم في الموعد" },
    { icon: Sparkles,   label: "تصميم احترافي" },
  ];

  const currentPeriodInfo = PERIODS.find(p => p.key === period)!;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950" dir={dir}>
      <Navigation />

      {/* Hero */}
      <section className="pt-36 pb-14 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute top-20 left-1/4 w-80 h-80 bg-violet-500/[0.04] rounded-full blur-3xl" />
        <div className="absolute top-32 right-1/4 w-60 h-60 bg-orange-500/[0.04] rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.07] bg-black/[0.02] mb-6">
              <Tag className="w-3.5 h-3.5 text-black/40" />
              <span className="text-black/40 text-xs tracking-wider">الأسعار والباقات</span>
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-black font-heading text-black dark:text-white mb-5 tracking-tight">
              باقات{" "}
              <span className="text-black/25 dark:text-white/25">شفافة وواضحة</span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-black/40 dark:text-white/40 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              اختر الخطة التي تناسبك — شهري أو نصف سنوي أو سنوي، أو امتلك نظامك <strong className="text-black dark:text-white">مدى الحياة</strong>
            </motion.p>

            {/* Trust badges */}
            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap justify-center gap-3 mb-12">
              {trustBadges.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-black/[0.02] border border-black/[0.06] rounded-full text-xs text-black/50 dark:text-white/50">
                  <Icon className="w-3 h-3" /> {label}
                </div>
              ))}
            </motion.div>

            {/* Billing Period Selector */}
            <motion.div variants={fadeUp} custom={4} className="inline-flex items-center gap-1 p-1.5 bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl" data-testid="billing-period-selector">
              {PERIODS.map(({ key, label, sublabel, icon: PIcon, saveBadge }) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  data-testid={`tab-period-${key}`}
                  className={`relative flex flex-col items-center px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 min-w-[80px] md:min-w-[100px] ${
                    period === key
                      ? "bg-black dark:bg-white text-white dark:text-black shadow-lg"
                      : "text-black/45 dark:text-white/45 hover:text-black/75 dark:hover:text-white/75 hover:bg-black/[0.03]"
                  }`}
                >
                  {saveBadge && period !== key && (
                    <span className="absolute -top-2 -left-1 text-[9px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
                      {key === "lifetime" ? "∞" : key === "annual" ? "★" : "↑"}
                    </span>
                  )}
                  <PIcon className="w-4 h-4 mb-0.5" />
                  <span className="text-xs font-black">{label}</span>
                  <span className={`text-[9px] leading-none mt-0.5 ${period === key ? "text-white/60 dark:text-black/60" : "text-black/30 dark:text-white/30"}`}>{sublabel}</span>
                </button>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Period info banner */}
      <div className="container mx-auto px-4 max-w-5xl mb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={period}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className={`rounded-xl px-5 py-3 flex items-center justify-between text-sm ${
              period === "lifetime"
                ? "bg-black text-white"
                : period === "annual"
                ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 text-emerald-800 dark:text-emerald-300"
                : period === "sixmonth"
                ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200/60 text-blue-800 dark:text-blue-300"
                : "bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] text-black/50 dark:text-white/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <currentPeriodInfo.icon className="w-4 h-4" />
              <span className="font-bold">{currentPeriodInfo.label}</span>
              <span className="opacity-60">— {currentPeriodInfo.sublabel}</span>
            </div>
            {currentPeriodInfo.saveBadge && (
              <span className="text-xs font-black opacity-80">{currentPeriodInfo.saveBadge}</span>
            )}
            {period === "lifetime" && (
              <span className="text-xs opacity-60 flex items-center gap-1">
                <Globe className="w-3 h-3" /> يشمل دومين مجاني 3 سنوات
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Plans Grid */}
      <section className="pb-16 container mx-auto px-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-black/30" />
            <p className="text-xs text-black/30">جاري التحميل...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={period}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-6"
            >
              {mainPlans.map((plan, idx) => (
                <PlanCard key={`${plan.id}-${period}`} plan={plan} idx={idx} period={period} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      {/* Renewal Plan (only shown on lifetime tab) */}
      {period === "lifetime" && renewalPlan && (
        <section className="pb-16 container mx-auto px-4 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="relative border border-emerald-200/60 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-50/80 to-teal-50/50 dark:from-emerald-900/10 dark:to-teal-900/10" data-testid="card-plan-renewal">
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />
              <div className="p-8 md:p-10">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="w-14 h-14 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-black font-heading text-black dark:text-white">{renewalPlan.nameAr}</h3>
                      <span className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-full font-bold flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" /> بعد انتهاء الدومين (3 سنوات)
                      </span>
                    </div>
                    <p className="text-black/45 text-sm leading-relaxed max-w-2xl">{renewalPlan.descriptionAr}</p>
                  </div>
                  <div className="flex-shrink-0 text-center">
                    <div className="text-4xl font-black text-black dark:text-white">{renewalPlan.price?.toLocaleString()}</div>
                    <div className="text-sm text-black/35 font-medium">ريال / سنة</div>
                    {renewalPlan.originalPrice && (
                      <div className="text-xs text-black/25 line-through mt-0.5">{renewalPlan.originalPrice?.toLocaleString()} ريال</div>
                    )}
                    <div className="text-[10px] text-emerald-600 font-bold mt-1">شامل ضريبة القيمة المضافة</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 pt-6 border-t border-black/[0.06]">
                  {renewalPlan.featuresAr?.map((feature: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-black/50">
                      <Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-emerald-500" />
                      <span className="leading-snug">{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-4">
                  <Link href="/contact">
                    <Button className="h-11 px-8 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-500/20" data-testid="button-renewal-plan">
                      <Phone className="w-4 h-4" /> تواصل للتجديد
                    </Button>
                  </Link>
                  <p className="text-xs text-black/30">* يُطبَّق بعد انتهاء مدة الدومين المجانية (3 سنوات)</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Demo / Trial Plan */}
      <section className="pb-16 container mx-auto px-4 max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
          <div className="rounded-2xl border-2 border-dashed border-black/[0.1] bg-gradient-to-br from-emerald-50/60 to-teal-50/40 p-8 relative overflow-hidden" data-testid="card-demo-plan">
            <div className="absolute top-4 left-4 md:top-6 md:left-6">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow">
                <Sparkles className="w-3 h-3" /> جرّب قبل أن تشتري
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mt-8 md:mt-0">
              <div>
                <h3 className="text-2xl md:text-3xl font-black font-heading text-black mb-3">
                  النسخة التجريبية <span>🎯</span>
                </h3>
                <p className="text-black/50 text-sm leading-relaxed mb-6">
                  جرّب نظامك قبل الشراء الكامل — نمنحك نسخة تجريبية حقيقية لمدة 7 أيام كاملة لتختبر كل المميزات وتتأكد من ملاءمة النظام لاحتياجاتك
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {["7 أيام كاملة", "نظام حقيقي", "دعم فني خلال التجربة", "بدون تعهد", "تُحسم من قيمة الباقة"].map(f => (
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

      {/* Add-ons Section */}
      <section className="py-16 container mx-auto px-4 max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.07] bg-white mb-4">
            <Plus className="w-3.5 h-3.5 text-black/40" />
            <span className="text-black/40 text-xs tracking-wider">إضافات على أي باقة</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-black dark:text-white mb-3">ارفع مستوى مشروعك</h2>
          <p className="text-black/40 text-sm max-w-lg mx-auto">أضف هذه الخدمات لأي باقة تختارها بتكلفة إضافية بسيطة</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <div className="rounded-2xl border border-black/[0.08] bg-gradient-to-br from-gray-950 to-black p-7 h-full relative overflow-hidden hover:shadow-2xl hover:shadow-black/20 transition-all duration-300" data-testid="addon-mobile-app">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.07] flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white/70" />
                </div>
                <div>
                  <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">تطبيق جوال</p>
                  <p className="text-white font-bold text-sm">App Store + Play Store</p>
                </div>
              </div>
              <div className="mb-5">
                <div className="text-4xl font-black text-white mb-0.5">1,000+</div>
                <div className="text-white/30 text-sm">ريال يُضاف للباقة</div>
              </div>
              <div className="space-y-2.5 mb-5">
                {["نشر على App Store", "نشر على Google Play", "iOS و Android", "إشعارات Push", "تجربة مستخدم أصلية"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-white/50">
                    <Check className="w-3.5 h-3.5 text-white/30 flex-shrink-0" /> {f}
                  </div>
                ))}
              </div>
              <Link href="/contact">
                <Button className="w-full h-10 rounded-xl bg-white text-black hover:bg-gray-100 font-bold text-xs" data-testid="button-addon-app">أضف للطلب</Button>
              </Link>
            </div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
            <div className="rounded-2xl border border-black/[0.07] bg-gradient-to-br from-violet-50/60 to-purple-50/40 p-7 h-full relative overflow-hidden hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300" data-testid="addon-seo">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-violet-600/60 font-semibold uppercase tracking-wider">تسويق رقمي</p>
                  <p className="text-black font-bold text-sm">SEO + Marketing</p>
                </div>
              </div>
              <div className="mb-5">
                <div className="text-4xl font-black text-black mb-0.5">500+</div>
                <div className="text-black/30 text-sm">ريال يُضاف للباقة</div>
              </div>
              <div className="space-y-2.5 mb-5">
                {["تحسين محركات البحث SEO", "ربط Google Analytics", "خريطة موقع XML", "صفحات OG للسوشيال", "تقرير أداء شهري"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-black/50">
                    <Check className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" /> {f}
                  </div>
                ))}
              </div>
              <Link href="/contact">
                <Button className="w-full h-10 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs" data-testid="button-addon-seo">أضف للطلب</Button>
              </Link>
            </div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}>
            <div className="rounded-2xl border border-black/[0.07] bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-7 h-full relative overflow-hidden hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300" data-testid="addon-brand">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <Palette className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-amber-600/60 font-semibold uppercase tracking-wider">هوية بصرية</p>
                  <p className="text-black font-bold text-sm">Logo & Brand Identity</p>
                </div>
              </div>
              <div className="mb-5">
                <div className="text-4xl font-black text-black mb-0.5">800+</div>
                <div className="text-black/30 text-sm">ريال يُضاف للباقة</div>
              </div>
              <div className="space-y-2.5 mb-5">
                {["تصميم شعار احترافي", "دليل الهوية البصرية", "ألوان وخطوط العلامة", "ملفات بجميع الصيغ", "تطبيق على القرطاسية"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-black/50">
                    <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" /> {f}
                  </div>
                ))}
              </div>
              <Link href="/contact">
                <Button className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs" data-testid="button-addon-brand">أضف للطلب</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold font-heading text-black dark:text-white mb-3">ماذا تشمل كل باقة؟</h2>
          <p className="text-black/40 text-sm">مزايا ثابتة في جميع الباقات بدون استثناء</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Shield,     title: "ضمان الجودة",      desc: "مراجعة كاملة قبل التسليم مع ضمان إصلاح أي خطأ" },
            { icon: Headphones, title: "دعم فني مستمر",    desc: "فريق دعم متاح على مدار الساعة عبر القنوات المختلفة" },
            { icon: Clock,      title: "تسليم في الموعد",  desc: "التزام تام بالجداول الزمنية المتفق عليها" },
            { icon: Sparkles,   title: "تصميم احترافي",    desc: "تصاميم عصرية بأعلى معايير UX/UI العالمية" },
            { icon: Globe,      title: "دعم ثنائي اللغة",  desc: "جميع أنظمتنا تدعم العربية والإنجليزية بالكامل" },
            { icon: Gift,       title: "تدريب مجاني",      desc: "جلسة تدريب مجانية لاستخدام النظام بعد التسليم" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-3 p-4 rounded-xl border border-black/[0.05] bg-black/[0.01] hover:bg-black/[0.025] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-black/[0.04] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-black/50" />
              </div>
              <div>
                <h4 className="font-semibold text-black dark:text-white text-sm mb-1">{title}</h4>
                <p className="text-xs text-black/40 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Custom CTA */}
      <section className="py-20 relative overflow-hidden bg-black dark:bg-white">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="container mx-auto px-4 text-center relative z-10">
          <p className="text-white/50 dark:text-black/50 text-xs uppercase tracking-widest mb-4">باقة مخصصة</p>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-white dark:text-black mb-4">تحتاج عرضاً خاصاً؟</h2>
          <p className="text-white/50 dark:text-black/50 text-base mb-8 max-w-md mx-auto">
            تواصل معنا وسنعدّ لك عرضاً مخصصاً يناسب احتياجاتك وميزانيتك
          </p>
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
