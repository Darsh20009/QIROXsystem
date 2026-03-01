import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { usePricingPlans } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import {
  Loader2, Check, ArrowLeft, X,
  Globe, Tag, Gift, Plus, Sparkles, Shield, Headphones,
  Clock, Smartphone, Palette, TrendingUp,
  Infinity, Crown, CalendarDays, CalendarRange, Calendar, Zap,
  Star, UtensilsCrossed, ShoppingBag, GraduationCap, Building2,
  Home, Heart, ChevronRight
} from "lucide-react";

type BillingPeriod = "monthly" | "sixmonth" | "annual" | "lifetime";

const PERIODS: { key: BillingPeriod; label: string; sublabel: string; icon: any; badge?: string }[] = [
  { key: "monthly",  label: "شهري",        sublabel: "ادفع كل شهر",    icon: Calendar },
  { key: "sixmonth", label: "نصف سنوي",    sublabel: "6 أشهر",         icon: CalendarRange, badge: "وفّر 30%" },
  { key: "annual",   label: "سنوي",        sublabel: "سنة كاملة",      icon: CalendarDays,  badge: "الأوفر ★" },
  { key: "lifetime", label: "مدى الحياة",  sublabel: "دفعة واحدة",     icon: Infinity,      badge: "دائم ∞" },
];

const SEGMENTS = [
  { key: "restaurant",  labelAr: "مطاعم ومقاهي",         icon: UtensilsCrossed, color: "from-orange-500 to-red-500",    bg: "bg-orange-50",   text: "text-orange-600",  border: "border-orange-200" },
  { key: "ecommerce",   labelAr: "متاجر إلكترونية",       icon: ShoppingBag,     color: "from-blue-500 to-cyan-500",     bg: "bg-blue-50",     text: "text-blue-600",    border: "border-blue-200" },
  { key: "education",   labelAr: "منصات تعليمية",         icon: GraduationCap,   color: "from-violet-500 to-purple-500", bg: "bg-violet-50",   text: "text-violet-600",  border: "border-violet-200" },
  { key: "corporate",   labelAr: "شركات ومؤسسات",         icon: Building2,       color: "from-slate-600 to-gray-700",    bg: "bg-slate-50",    text: "text-slate-600",   border: "border-slate-200" },
  { key: "realestate",  labelAr: "عقارات",                icon: Home,            color: "from-teal-500 to-emerald-500",  bg: "bg-teal-50",     text: "text-teal-600",    border: "border-teal-200" },
  { key: "healthcare",  labelAr: "صحة وعيادات",           icon: Heart,           color: "from-rose-500 to-pink-500",     bg: "bg-rose-50",     text: "text-rose-600",    border: "border-rose-200" },
];

const TIER_CONFIG: Record<string, {
  label: string; icon: any;
  gradient: string; headerGrad: string; border: string; glow: string;
  checkColor: string; isDark?: boolean;
}> = {
  lite: {
    label: "لايت",  icon: Zap,
    gradient: "from-teal-50/50 to-white",  headerGrad: "from-teal-500 to-emerald-500",
    border: "border-teal-200/60",  glow: "hover:shadow-teal-100",  checkColor: "text-teal-500",
  },
  pro: {
    label: "برو",   icon: Star,
    gradient: "from-violet-50/50 to-white", headerGrad: "from-violet-600 to-purple-500",
    border: "border-violet-300/70", glow: "hover:shadow-violet-100", checkColor: "text-violet-500",
  },
  infinite: {
    label: "إنفينتي", icon: Infinity, isDark: true,
    gradient: "from-gray-950 to-gray-900", headerGrad: "from-gray-800 to-black",
    border: "border-black/30", glow: "hover:shadow-black/20", checkColor: "text-white/60",
  },
};

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } })
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
  return "";
}

function TierCard({ plan, period, idx, segmentColor }: { plan: any; period: BillingPeriod; idx: number; segmentColor: string }) {
  const cfg = TIER_CONFIG[plan.tier] || TIER_CONFIG.lite;
  const Icon = cfg.icon;
  const price = getPeriodPrice(plan, period);
  const { isDark, isPopular } = { isDark: !!cfg.isDark, isPopular: plan.isPopular };

  const monthlyBase = plan.monthlyPrice ?? 0;
  const monthlyEquiv = period === "monthly" ? price
    : period === "sixmonth" ? Math.round(price / 6)
    : period === "annual"   ? Math.round(price / 12)
    : null;
  const saving = monthlyEquiv && monthlyBase ? Math.round(((monthlyBase - monthlyEquiv) / monthlyBase) * 100) : 0;

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={idx} className="relative flex flex-col" data-testid={`card-tier-${plan.tier}`}>
      {isPopular && (
        <div className="absolute -top-4 inset-x-0 flex justify-center z-20">
          <span className="inline-flex items-center gap-1.5 bg-black text-white text-[11px] font-black px-5 py-1.5 rounded-full shadow-lg shadow-black/20">
            <Crown className="w-3 h-3" /> الأكثر طلباً
          </span>
        </div>
      )}

      <div className={`relative flex flex-col flex-1 rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${cfg.glow} ${
        isPopular ? "border-violet-300/80 shadow-xl shadow-violet-100/50 scale-[1.02] z-10" : cfg.border
      }`}>
        {isPopular && <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-violet-500 via-purple-400 to-violet-600" />}

        <div className={`p-6 flex flex-col flex-1 ${isDark ? `bg-gradient-to-br ${cfg.gradient}` : `bg-gradient-to-br ${cfg.gradient}`}`}>
          <div className="flex items-center justify-between mb-5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isDark ? "bg-white/[0.08]" : `bg-gradient-to-br ${cfg.headerGrad} bg-opacity-10`}`}>
              <Icon className={`w-5 h-5 ${isDark ? "text-white/70" : "text-white"}`} />
            </div>
            <span className={`text-xs font-black px-3 py-1 rounded-full bg-gradient-to-r ${cfg.headerGrad} text-white shadow-sm`}>
              {cfg.label}
            </span>
          </div>

          <h3 className={`text-xl font-black font-heading mb-1 ${isDark ? "text-white" : "text-black dark:text-white"}`}>{plan.nameAr}</h3>
          <p className={`text-xs mb-5 leading-relaxed min-h-8 ${isDark ? "text-white/45" : "text-black/40 dark:text-white/40"}`}>{plan.descriptionAr}</p>

          <div className={`mb-5 p-4 rounded-xl ${isDark ? "bg-white/[0.05] border border-white/[0.07]" : "bg-black/[0.03] border border-black/[0.05]"}`}>
            <AnimatePresence mode="wait">
              <motion.div key={`${plan.tier}-${period}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className={`text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-black"}`}>{price.toLocaleString()}</span>
                  <span className={`text-sm font-bold ${isDark ? "text-white/50" : "text-black/40"}`}>ريال</span>
                  <span className={`text-xs ${isDark ? "text-white/30" : "text-black/25"}`}>{getPeriodSuffix(period)}</span>
                </div>
                {monthlyEquiv && period !== "monthly" && (
                  <p className={`text-[10px] mt-1 ${isDark ? "text-white/30" : "text-black/30"}`}>
                    = <span className="font-bold">{monthlyEquiv.toLocaleString()} ر.س/شهر</span>
                    {saving > 0 && <span className="text-emerald-400 mr-1"> — وفّر {saving}%</span>}
                  </p>
                )}
                {period === "lifetime" && (
                  <p className={`text-[10px] mt-1.5 flex items-center gap-1 ${isDark ? "text-white/30" : "text-black/30"}`}>
                    <Globe className="w-3 h-3" /> دومين مجاني لمدة 3 سنوات
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="space-y-2 flex-1 mb-5">
            {plan.featuresAr?.map((f: string, i: number) => (
              <div key={i} className={`flex items-start gap-2 text-xs ${isDark ? "text-white/50" : "text-black/55"}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isDark ? "bg-white/[0.08]" : "bg-black/[0.04]"}`}>
                  <Check className={`w-2.5 h-2.5 ${cfg.checkColor}`} />
                </div>
                <span className="leading-snug">{f}</span>
              </div>
            ))}
          </div>

          <Link href={`/order?plan=${plan.tier}&segment=${plan.segment}&period=${period}&price=${getPeriodPrice(plan, period)}`}>
            <Button className={`w-full h-11 rounded-xl font-bold text-sm gap-2 transition-all ${
              isDark ? "bg-white text-black hover:bg-white/90"
              : isPopular ? `bg-gradient-to-r ${cfg.headerGrad} text-white hover:opacity-90 shadow-lg`
              : `bg-gradient-to-r ${segmentColor} text-white hover:opacity-90`
            }`} data-testid={`button-select-${plan.tier}`}>
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
  const [segment, setSegment] = useState("restaurant");
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  const activeSegment = SEGMENTS.find(s => s.key === segment)!;
  const tierPlans = plans?.filter((p: any) => p.segment === segment && ["lite","pro","infinite"].includes(p.tier ?? ""))
    .sort((a: any, b: any) => ({ lite:1, pro:2, infinite:3 }[a.tier ?? ""] ?? 9) - ({ lite:1, pro:2, infinite:3 }[b.tier ?? ""] ?? 9)) ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950" dir={dir}>
      <Navigation />

      {/* Hero */}
      <section className="pt-36 pb-10 relative overflow-hidden">
        <PageGraphics variant="hero-light" />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute top-20 left-1/4 w-80 h-80 bg-violet-500/[0.04] rounded-full blur-3xl" />
        <div className="absolute top-32 right-1/4 w-60 h-60 bg-teal-500/[0.04] rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.07] bg-black/[0.02] mb-6">
              <Tag className="w-3.5 h-3.5 text-black/40" />
              <span className="text-black/40 text-xs tracking-wider">الأسعار على حسب نوع مشروعك</span>
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-black font-heading text-black dark:text-white mb-4 tracking-tight">
              اختر <span className="text-black/20 dark:text-white/20">نوع مشروعك</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-black/40 dark:text-white/40 text-base max-w-lg mx-auto mb-3 leading-relaxed">
              كل نظام له أسعاره الخاصة — اختر القطاع ثم المستوى المناسب لك
            </motion.p>

            {/* Trust badges */}
            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap justify-center gap-2.5 mb-10">
              {[{icon: Shield, label:"ضمان الجودة"},{icon:Headphones,label:"دعم 24/7"},{icon:Clock,label:"تسليم في الموعد"},{icon:Sparkles,label:"تصميم احترافي"}].map(({icon:Ic,label})=>(
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-black/[0.02] border border-black/[0.06] rounded-full text-xs text-black/45">
                  <Ic className="w-3 h-3" /> {label}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Segment Selector */}
      <section className="pb-6 container mx-auto px-4 max-w-5xl">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}>
          <p className="text-center text-xs font-semibold text-black/30 uppercase tracking-widest mb-4">اختر نوع المشروع</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5" data-testid="segment-selector">
            {SEGMENTS.map((seg) => {
              const Icon = seg.icon;
              const isActive = segment === seg.key;
              return (
                <button key={seg.key} onClick={() => setSegment(seg.key)} data-testid={`btn-segment-${seg.key}`}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 ${
                    isActive
                      ? `${seg.bg} ${seg.border} shadow-md scale-[1.03]`
                      : "border-black/[0.07] hover:border-black/15 hover:bg-black/[0.02]"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isActive ? `bg-gradient-to-br ${seg.color}` : "bg-black/[0.04]"
                  }`}>
                    <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-black/40"}`} />
                  </div>
                  <span className={`text-[11px] font-bold text-center leading-tight ${isActive ? seg.text : "text-black/45"}`}>
                    {seg.labelAr}
                  </span>
                  {isActive && (
                    <motion.div layoutId="seg-indicator" className={`absolute bottom-2 w-1.5 h-1.5 rounded-full bg-gradient-to-br ${seg.color}`} />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Billing Period Tabs */}
      <section className="pb-4 container mx-auto px-4 max-w-5xl">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5} className="flex justify-center">
          <div className="inline-flex items-center gap-1 p-1.5 bg-black/[0.03] border border-black/[0.06] rounded-2xl" data-testid="billing-period-selector">
            {PERIODS.map(({ key, label, sublabel, icon: PIcon, badge }) => (
              <button key={key} onClick={() => setPeriod(key)} data-testid={`tab-period-${key}`}
                className={`relative flex flex-col items-center px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 min-w-[85px] md:min-w-[110px] ${
                  period === key ? "bg-black dark:bg-white text-white dark:text-black shadow-lg" : "text-black/45 hover:text-black/75 hover:bg-black/[0.03]"
                }`}
              >
                {badge && period !== key && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap z-10">
                    {badge}
                  </span>
                )}
                <PIcon className="w-4 h-4 mb-0.5" />
                <span className="text-xs font-black">{label}</span>
                <span className={`text-[9px] leading-none mt-0.5 ${period === key ? "text-white/60" : "text-black/30"}`}>{sublabel}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Active segment + period label */}
      <div className="container mx-auto px-4 max-w-5xl mb-4">
        <AnimatePresence mode="wait">
          <motion.div key={`${segment}-${period}`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className={`rounded-xl px-5 py-3 flex items-center gap-3 text-sm bg-gradient-to-r ${activeSegment.color} text-white`}
          >
            <activeSegment.icon className="w-4 h-4" />
            <span className="font-black">{activeSegment.labelAr}</span>
            <span className="opacity-60">—</span>
            <span className="opacity-75">{PERIODS.find(p=>p.key===period)?.label}</span>
            {period === "lifetime" && <span className="opacity-60 text-xs mr-auto flex items-center gap-1"><Globe className="w-3 h-3"/>دومين مجاني 3 سنوات</span>}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Tier Cards */}
      <section className="pb-16 container mx-auto px-4 max-w-5xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-black/30" />
            <p className="text-xs text-black/30">جاري التحميل...</p>
          </div>
        ) : tierPlans.length === 0 ? (
          <div className="text-center py-20 text-black/30 text-sm">لا توجد باقات لهذا القطاع بعد</div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={`${segment}-${period}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8"
            >
              {tierPlans.map((plan: any, idx: number) => (
                <TierCard key={`${plan.id}-${period}`} plan={plan} period={period} idx={idx} segmentColor={activeSegment.color} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      {/* Feature Comparison Table */}
      {tierPlans.length === 3 && (
        <section className="pb-16 container mx-auto px-4 max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-6">
            <h2 className="text-xl font-bold font-heading text-black dark:text-white mb-1">مقارنة المستويات</h2>
            <p className="text-black/35 text-xs">{activeSegment.labelAr}</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="rounded-2xl border border-black/[0.07] overflow-hidden"
          >
            <div className="grid grid-cols-4 bg-black/[0.02] border-b border-black/[0.07]">
              <div className="p-4 text-xs font-semibold text-black/40">الميزة</div>
              {tierPlans.map((p: any) => {
                const cfg = TIER_CONFIG[p.tier] || TIER_CONFIG.lite;
                return (
                  <div key={p.id} className="p-4 text-center">
                    <span className={`text-xs font-black px-3 py-1 rounded-full bg-gradient-to-r ${cfg.headerGrad} text-white`}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>
            {[
              { label: `السعر (${PERIODS.find(p=>p.key===period)?.label})`, values: tierPlans.map((p: any) => `${getPeriodPrice(p, period).toLocaleString()} ر.س`) },
              { label: "عدد الميزات", values: tierPlans.map((p: any) => `${p.featuresAr?.length ?? 0} ميزة`) },
              { label: "دعم فني",   values: ["شهر واحد", "6 أشهر", "24/7 أولوية"] },
              { label: "تطبيق جوال", values: [false, false, true] },
              { label: "دومين مجاني", values: [false, "سنة واحدة", "3 سنوات"] },
              { label: "دعم متعدد القنوات", values: [false, true, true] },
            ].map((row, i) => (
              <div key={i} className={`grid grid-cols-4 border-b border-black/[0.04] ${i % 2 === 0 ? "" : "bg-black/[0.01]"}`}>
                <div className="p-3.5 text-xs text-black/50 font-medium">{row.label}</div>
                {row.values.map((val: any, vi: number) => (
                  <div key={vi} className="p-3.5 text-center">
                    {typeof val === "boolean"
                      ? val ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-black/15 mx-auto" />
                      : <span className="text-xs font-semibold text-black">{val}</span>}
                  </div>
                ))}
              </div>
            ))}
          </motion.div>
        </section>
      )}

      {/* Demo Trial */}
      <section className="pb-12 container mx-auto px-4 max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
          <div className="rounded-2xl border-2 border-dashed border-emerald-200/60 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 p-8 relative overflow-hidden" data-testid="card-demo-plan">
            <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow">
              <Sparkles className="w-3 h-3" /> جرّب قبل أن تشتري
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mt-8 md:mt-0">
              <div>
                <h3 className="text-2xl font-black font-heading text-black mb-3">النسخة التجريبية 🎯</h3>
                <p className="text-black/50 text-sm leading-relaxed mb-5">جرّب نظامك الحقيقي لمدة 7 أيام — بدون تعهد بالشراء</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {["7 أيام كاملة","نظام حقيقي","دعم فني","بدون تعهد","تُحسم من الباقة"].map(f=>(
                    <span key={f} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                      <Check className="w-3 h-3"/>{f}
                    </span>
                  ))}
                </div>
                <Link href="/contact">
                  <Button className="h-11 px-8 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white gap-2 shadow-lg shadow-emerald-500/20" data-testid="button-demo-trial">
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

      {/* Addons */}
      <section className="py-12 container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.07] bg-white mb-4">
            <Plus className="w-3.5 h-3.5 text-black/40" />
            <span className="text-black/40 text-xs">إضافات على أي باقة</span>
          </div>
          <h2 className="text-2xl font-bold font-heading text-black dark:text-white">ارفع مستوى مشروعك</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: Smartphone, label: "تطبيق جوال", sub: "iOS + Android", price: "1,000+", color: "bg-black", textColor: "text-white", subColor: "text-white/40", features: ["نشر App Store & Play","iOS و Android","إشعارات Push","تجربة أصيلة"], btnClass: "bg-white text-black" },
            { icon: TrendingUp, label: "SEO & تسويق",sub: "تحسين محركات البحث", price: "500+", color: "bg-violet-50 border border-black/[0.07]", textColor: "text-black", subColor: "text-violet-600/60", features: ["SEO احترافي","Google Analytics","Sitemap XML","تقرير شهري"], btnClass: "bg-violet-600 text-white" },
            { icon: Palette, label: "هوية بصرية",   sub: "شعار + هوية كاملة", price: "800+", color: "bg-amber-50 border border-black/[0.07]",  textColor: "text-black", subColor: "text-amber-600/60",  features: ["تصميم شعار","دليل الهوية","ألوان وخطوط","كل الصيغ"],  btnClass: "bg-amber-500 text-white" },
          ].map((a,ai)=>(
            <motion.div key={a.label} initial="hidden" whileInView="visible" viewport={{once:true}} variants={fadeUp} custom={ai}>
              <div className={`rounded-2xl ${a.color} p-7 h-full hover:shadow-xl transition-all duration-300`}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.07] flex items-center justify-center">
                    <a.icon className={`w-6 h-6 ${a.subColor}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${a.subColor}`}>{a.label}</p>
                    <p className={`font-bold text-sm ${a.textColor}`}>{a.sub}</p>
                  </div>
                </div>
                <div className={`text-4xl font-black mb-1 ${a.textColor}`}>{a.price}</div>
                <div className={`text-sm mb-5 opacity-40 ${a.textColor}`}>ريال يُضاف للباقة</div>
                <div className="space-y-2 mb-5">
                  {a.features.map(f=>(
                    <div key={f} className={`flex items-center gap-2 text-xs opacity-60 ${a.textColor}`}>
                      <Check className="w-3 h-3 flex-shrink-0"/>{f}
                    </div>
                  ))}
                </div>
                <Link href="/contact">
                  <Button className={`w-full h-10 rounded-xl font-bold text-xs ${a.btnClass}`}>أضف للطلب</Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 relative overflow-hidden bg-black">
        <div className="absolute inset-0 opacity-5" style={{backgroundImage:"radial-gradient(circle at 1px 1px, white 1px, transparent 0)",backgroundSize:"24px 24px"}}/>
        <div className="container mx-auto px-4 text-center relative z-10">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-4">باقة مخصصة</p>
          <h2 className="text-3xl font-bold font-heading text-white mb-4">تحتاج عرضاً خاصاً؟</h2>
          <p className="text-white/45 text-base mb-8 max-w-md mx-auto">تواصل معنا وسنعدّ لك عرضاً يناسب احتياجاتك وميزانيتك تماماً</p>
          <Link href="/contact">
            <Button size="lg" className="bg-white text-black h-12 px-10 rounded-xl font-semibold hover:bg-white/90" data-testid="button-custom-pricing">
              تواصل معنا الآن <ArrowLeft className="w-5 h-5 mr-2"/>
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
