import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { usePricingPlans } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import {
  Loader2, Check, ArrowLeft, Star,
  GraduationCap, UtensilsCrossed, ShoppingBag, Building2,
  Globe, Phone, Tag, Gift, Plus, Sparkles, Shield, Headphones,
  Clock, BadgePercent, ChevronRight, Smartphone, Palette, TrendingUp,
  Infinity, RefreshCw, Crown
} from "lucide-react";

const planIcons: Record<string, any> = {
  ecommerce: ShoppingBag,
  education: GraduationCap,
  restaurant: UtensilsCrossed,
  enterprise: RefreshCw,
  starter: Star,
  business: Crown,
};

const planAccents: Record<string, {
  gradient: string; iconBg: string; iconText: string; border: string;
  glow: string; badgeBg: string; badgeText: string; checkColor: string;
}> = {
  restaurant: {
    gradient: "from-orange-50 via-amber-50/60 to-white",
    iconBg: "bg-orange-500/10", iconText: "text-orange-600",
    border: "border-orange-200/60", glow: "hover:shadow-orange-100",
    badgeBg: "bg-orange-500", badgeText: "text-white",
    checkColor: "text-orange-500",
  },
  education: {
    gradient: "from-violet-50 via-purple-50/60 to-white",
    iconBg: "bg-violet-500/10", iconText: "text-violet-600",
    border: "border-violet-200/60", glow: "hover:shadow-violet-100",
    badgeBg: "bg-violet-600", badgeText: "text-white",
    checkColor: "text-violet-500",
  },
  ecommerce: {
    gradient: "from-blue-50 via-cyan-50/60 to-white",
    iconBg: "bg-blue-500/10", iconText: "text-blue-600",
    border: "border-blue-200/60", glow: "hover:shadow-blue-100",
    badgeBg: "bg-blue-600", badgeText: "text-white",
    checkColor: "text-blue-500",
  },
  enterprise: {
    gradient: "from-emerald-50 via-teal-50/60 to-white",
    iconBg: "bg-emerald-600 text-white", iconText: "text-white",
    border: "border-emerald-200/60", glow: "hover:shadow-emerald-100",
    badgeBg: "bg-emerald-600", badgeText: "text-white",
    checkColor: "text-emerald-500",
  },
};

const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] } })
};

function LifetimePlanCard({ plan, idx }: { plan: any; idx: number }) {
  const { lang } = useI18n();
  const Icon = planIcons[plan.slug] || Star;
  const accent = planAccents[plan.slug] || planAccents.ecommerce;

  const discount = plan.originalPrice && plan.price
    ? Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)
    : 0;

  const isPopular = plan.isPopular;

  return (
    <motion.div
      initial="hidden" animate="visible" variants={fadeUp} custom={idx}
      className="relative flex flex-col"
      data-testid={`card-plan-${plan.slug}`}
    >
      {isPopular && (
        <div className="absolute -top-4 inset-x-0 flex justify-center z-20">
          <span className="inline-flex items-center gap-1.5 bg-black text-white text-[11px] font-bold px-5 py-1.5 rounded-full shadow-lg shadow-black/20">
            <Crown className="w-3 h-3" />
            الأكثر طلباً
          </span>
        </div>
      )}

      <div className={`relative flex flex-col flex-1 rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${accent.glow} ${
        isPopular
          ? "border-black/20 shadow-xl shadow-black/8 scale-[1.02] z-10"
          : `${accent.border}`
      }`}>
        {isPopular && (
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-violet-500 via-purple-400 to-violet-600" />
        )}

        <div className={`p-7 flex flex-col flex-1 bg-gradient-to-br dark:from-gray-900/60 dark:to-gray-800/40 ${!isPopular ? accent.gradient : "from-violet-50/80 via-purple-50/50 to-white"}`}>
          <div className="flex items-start justify-between mb-5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accent.iconBg}`}>
              <Icon className={`w-5 h-5 ${plan.slug === "enterprise" ? "text-white" : accent.iconText}`} />
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black ${accent.badgeBg} ${accent.badgeText}`}>
              <Infinity className="w-3.5 h-3.5" />
              مدى الحياة
            </div>
          </div>

          <h3 className="text-lg font-black font-heading text-black dark:text-white mb-1.5">
            {lang === "ar" ? plan.nameAr : (plan.name || plan.nameAr)}
          </h3>
          <p className="text-xs text-black/40 dark:text-white/40 mb-5 leading-relaxed min-h-[2.5rem]">
            {lang === "ar" ? plan.descriptionAr : (plan.description || plan.descriptionAr)}
          </p>

          <div className="mb-5 p-4 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05]">
            {plan.originalPrice && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-black/30 dark:text-white/30 line-through">
                  {plan.originalPrice.toLocaleString()} ر.س
                </span>
                {discount > 0 && (
                  <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                    وفّر {discount}%
                  </span>
                )}
              </div>
            )}
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black text-black dark:text-white tracking-tight">
                {plan.price.toLocaleString()}
              </span>
              <span className="text-black/40 dark:text-white/40 text-sm font-bold">ريال</span>
              <span className="text-black/25 dark:text-white/25 text-xs">دفعة واحدة</span>
            </div>
            <p className="text-[10px] text-black/30 mt-1.5 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              يشمل دومين مجاني لمدة 3 سنوات
            </p>
          </div>

          <div className="space-y-2.5 flex-1 mb-6">
            {(lang === "ar" ? plan.featuresAr : (plan.features || plan.featuresAr))?.map((feature: string, i: number) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-black/55 dark:text-white/55">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-black/[0.04]`}>
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
                  : "bg-black/[0.07] dark:bg-white/[0.07] hover:bg-black/[0.13] dark:hover:bg-white/[0.13] text-black dark:text-white border border-black/[0.07] dark:border-white/[0.07]"
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

  const lifetimePlans = plans?.filter(p => !p.isCustom && p.billingCycle === "lifetime") ?? [];
  const renewalPlan = plans?.find(p => p.isCustom);

  const trustBadges = [
    { icon: Shield, label: "ضمان الجودة" },
    { icon: Headphones, label: "دعم فني 24/7" },
    { icon: Clock, label: "تسليم في الموعد" },
    { icon: Sparkles, label: "تصميم احترافي" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950" dir={dir}>
      <Navigation />

      {/* Hero */}
      <section className="pt-36 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute top-20 left-1/4 w-80 h-80 bg-violet-500/[0.04] rounded-full blur-3xl" />
        <div className="absolute top-32 right-1/4 w-60 h-60 bg-orange-500/[0.04] rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.07] dark:border-white/[0.07] bg-black/[0.02] dark:bg-white/[0.02] mb-6">
              <Tag className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
              <span className="text-black/40 dark:text-white/40 text-xs tracking-wider">الأسعار والباقات</span>
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-black font-heading text-black dark:text-white mb-5 tracking-tight">
              باقات{" "}
              <span className="text-black/25 dark:text-white/25">مدى الحياة</span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-black/40 dark:text-white/40 text-lg max-w-2xl mx-auto mb-6 leading-relaxed">
              ادفع مرة واحدة — واحتفظ بنظامك إلى الأبد. كل باقة تشمل دومين مجاني لمدة <span className="text-black dark:text-white font-bold">3 سنوات</span> كاملة
            </motion.p>

            {/* Lifetime badge */}
            <motion.div variants={fadeUp} custom={3} className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-black text-white mb-10">
              <Infinity className="w-5 h-5" />
              <span className="font-bold text-sm">دفعة واحدة — ملكية مدى الحياة</span>
              <Infinity className="w-5 h-5" />
            </motion.div>

            {/* Trust badges */}
            <motion.div variants={fadeUp} custom={4} className="flex flex-wrap justify-center gap-3">
              {trustBadges.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] rounded-full text-xs text-black/50 dark:text-white/50">
                  <Icon className="w-3 h-3" />
                  {label}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Domain Inclusion Banner */}
      <section className="pb-8 container mx-auto px-4 max-w-5xl">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <div className="rounded-2xl bg-gradient-to-r from-black to-gray-900 p-6 flex flex-col md:flex-row items-center gap-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/[0.02] -translate-y-1/2 translate-x-1/4" />
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Globe className="w-7 h-7 text-white/80" />
            </div>
            <div className="flex-1 text-center md:text-right">
              <h3 className="text-white font-black text-lg mb-1">دومين مجاني لمدة 3 سنوات كاملة 🎁</h3>
              <p className="text-white/50 text-sm">جميع الباقات تشمل دومين (.com أو .sa) مجاناً لمدة 3 سنوات من تاريخ التعاقد — بعدها يُجدَّد بباقة التجديد السنوي</p>
            </div>
            <div className="flex-shrink-0 flex flex-col items-center gap-1">
              <div className="text-3xl font-black text-white">3</div>
              <div className="text-white/40 text-xs font-semibold">سنوات مجانية</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Plans Grid */}
      <section className="pb-16 container mx-auto px-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-black/30 dark:text-white/30" />
            <p className="text-xs text-black/30">جاري التحميل...</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 gap-6 max-w-5xl mx-auto pt-6 ${
            lifetimePlans.length === 1 ? "md:grid-cols-1 max-w-sm" :
            lifetimePlans.length === 2 ? "md:grid-cols-2 max-w-2xl" :
            "md:grid-cols-3"
          }`}>
            {lifetimePlans
              .sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99))
              .map((plan, idx) => (
              <LifetimePlanCard key={plan.id} plan={plan} idx={idx} />
            ))}
          </div>
        )}
      </section>

      {/* Renewal Plan */}
      {renewalPlan && (
        <section className="pb-20 container mx-auto px-4 max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <div className="relative border border-emerald-200/60 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-50/80 to-teal-50/50 dark:from-emerald-900/10 dark:to-teal-900/10" data-testid="card-plan-renewal">
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />
              <div className="p-8 md:p-10">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="w-14 h-14 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-black font-heading text-black dark:text-white">
                        {lang === "ar" ? renewalPlan.nameAr : (renewalPlan.name || renewalPlan.nameAr)}
                      </h3>
                      <span className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-full font-bold flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        بعد 3 سنوات
                      </span>
                    </div>
                    <p className="text-black/45 dark:text-white/45 text-sm leading-relaxed max-w-2xl">
                      {lang === "ar" ? renewalPlan.descriptionAr : (renewalPlan.description || renewalPlan.descriptionAr)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-center md:text-right">
                    <div className="text-4xl font-black text-black dark:text-white">
                      {renewalPlan.price?.toLocaleString()}
                    </div>
                    <div className="text-sm text-black/35 dark:text-white/35 font-medium">ريال / سنة</div>
                    {renewalPlan.originalPrice && (
                      <div className="text-xs text-black/25 line-through mt-0.5">{renewalPlan.originalPrice?.toLocaleString()} ريال</div>
                    )}
                    <div className="text-[10px] text-emerald-600 font-bold mt-1">شامل ضريبة القيمة المضافة</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 pt-6 border-t border-black/[0.06]">
                  {(lang === "ar" ? renewalPlan.featuresAr : (renewalPlan.features || renewalPlan.featuresAr))?.map((feature: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-black/50 dark:text-white/50">
                      <Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-emerald-500" />
                      <span className="leading-snug">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <Link href="/contact">
                    <Button className="h-11 px-8 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-500/20" data-testid="button-renewal-plan">
                      <Phone className="w-4 h-4" />
                      تواصل للتجديد
                    </Button>
                  </Link>
                  <p className="text-xs text-black/30">
                    * يُطبَّق سعر التجديد تلقائياً بعد انتهاء مدة الدومين (3 سنوات)
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Demo / Trial Plan */}
      <section className="pb-16 container mx-auto px-4 max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
          <div className="rounded-2xl border-2 border-dashed border-black/[0.1] dark:border-white/[0.1] bg-gradient-to-br from-emerald-50/60 to-teal-50/40 dark:from-emerald-900/10 dark:to-teal-900/10 p-8 relative overflow-hidden" data-testid="card-demo-plan">
            <div className="absolute top-4 left-4 md:top-6 md:left-6">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow">
                <Sparkles className="w-3 h-3" />
                جرّب قبل أن تشتري
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mt-8 md:mt-0" dir={dir}>
              <div>
                <h3 className="text-2xl md:text-3xl font-black font-heading text-black dark:text-white mb-3">
                  النسخة التجريبية
                  <span className="mr-2">🎯</span>
                </h3>
                <p className="text-black/50 dark:text-white/50 text-sm leading-relaxed mb-6">
                  جرّب نظامك قبل الشراء الكامل — نمنحك نسخة تجريبية حقيقية لمدة 7 أيام كاملة لتختبر كل المميزات وتتأكد من ملاءمة النظام لاحتياجاتك
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {["7 أيام كاملة", "نظام حقيقي بالكامل", "دعم تقني خلال التجربة", "بدون تعهد بالشراء", "تُحسم من قيمة الباقة"].map(f => (
                    <span key={f} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <Check className="w-3 h-3" />
                      {f}
                    </span>
                  ))}
                </div>
                <Link href="/contact">
                  <Button className="h-12 px-8 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white gap-2 shadow-lg shadow-emerald-500/20" data-testid="button-demo-trial">
                    ابدأ تجربتك المجانية
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-7xl font-black text-emerald-600 mb-1">30</div>
                  <div className="text-black/40 dark:text-white/40 text-lg font-semibold">ريال فقط</div>
                  <div className="text-xs text-black/30 dark:text-white/30 mt-1">تُحسم من قيمة الباقة عند الاشتراك</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Add-ons Section */}
      <section className="py-16 container mx-auto px-4 max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-10" dir={dir}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 mb-4">
            <Plus className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
            <span className="text-black/40 dark:text-white/40 text-xs tracking-wider">إضافات على أي باقة</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-black dark:text-white mb-3">
            ارفع مستوى مشروعك
          </h2>
          <p className="text-black/40 dark:text-white/40 text-sm max-w-lg mx-auto">
            أضف هذه الخدمات لأي باقة تختارها بتكلفة إضافية بسيطة
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-gradient-to-br from-gray-950 to-black p-7 h-full relative overflow-hidden group hover:shadow-2xl hover:shadow-black/20 transition-all duration-300" data-testid="addon-mobile-app">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-1/2 translate-x-1/4" />
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
                    <Check className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/contact">
                <Button className="w-full h-10 rounded-xl bg-white text-black hover:bg-gray-100 font-bold text-xs" data-testid="button-addon-app">
                  أضف للطلب
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
            <div className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-gradient-to-br from-violet-50/60 to-purple-50/40 dark:from-violet-900/10 dark:to-purple-900/10 p-7 h-full relative overflow-hidden group hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300" data-testid="addon-seo">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-violet-600/60 font-semibold uppercase tracking-wider">تسويق رقمي</p>
                  <p className="text-black dark:text-white font-bold text-sm">SEO + Marketing</p>
                </div>
              </div>
              <div className="mb-5">
                <div className="text-4xl font-black text-black dark:text-white mb-0.5">500+</div>
                <div className="text-black/30 dark:text-white/30 text-sm">ريال يُضاف للباقة</div>
              </div>
              <div className="space-y-2.5 mb-5">
                {["تحسين محركات البحث SEO", "ربط Google Analytics", "خريطة موقع XML", "صفحات OG للسوشيال", "تقرير أداء شهري"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-black/50 dark:text-white/50">
                    <Check className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/contact">
                <Button className="w-full h-10 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs" data-testid="button-addon-seo">
                  أضف للطلب
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}>
            <div className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-gradient-to-br from-amber-50/60 to-orange-50/40 dark:from-amber-900/10 dark:to-orange-900/10 p-7 h-full relative overflow-hidden group hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300" data-testid="addon-brand">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <Palette className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-amber-600/60 font-semibold uppercase tracking-wider">هوية بصرية</p>
                  <p className="text-black dark:text-white font-bold text-sm">Logo & Brand Identity</p>
                </div>
              </div>
              <div className="mb-5">
                <div className="text-4xl font-black text-black dark:text-white mb-0.5">800+</div>
                <div className="text-black/30 dark:text-white/30 text-sm">ريال يُضاف للباقة</div>
              </div>
              <div className="space-y-2.5 mb-5">
                {["تصميم شعار احترافي", "دليل الهوية البصرية", "ألوان وخطوط العلامة", "ملفات بجميع الصيغ", "تطبيق على القرطاسية"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-black/50 dark:text-white/50">
                    <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/contact">
                <Button className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs" data-testid="button-addon-brand">
                  أضف للطلب
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20 container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold font-heading text-black dark:text-white mb-3">
            ماذا تشمل كل باقة؟
          </h2>
          <p className="text-black/40 dark:text-white/40 text-sm">
            مزايا ثابتة في جميع الباقات بدون استثناء
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Shield, title: "ضمان الجودة", desc: "مراجعة كاملة قبل التسليم مع ضمان إصلاح أي خطأ" },
            { icon: Headphones, title: "دعم فني مستمر", desc: "فريق دعم متاح على مدار الساعة عبر القنوات المختلفة" },
            { icon: Clock, title: "تسليم في الموعد", desc: "التزام تام بالجداول الزمنية المتفق عليها" },
            { icon: Sparkles, title: "تصميم احترافي", desc: "تصاميم عصرية بأعلى معايير UX/UI العالمية" },
            { icon: Globe, title: "دعم ثنائي اللغة", desc: "جميع أنظمتنا تدعم العربية والإنجليزية بالكامل" },
            { icon: Gift, title: "تدريب مجاني", desc: "جلسة تدريب مجانية لاستخدام النظام بعد التسليم" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-3 p-4 rounded-xl border border-black/[0.05] dark:border-white/[0.05] bg-black/[0.01] dark:bg-white/[0.01] hover:bg-black/[0.025] dark:hover:bg-white/[0.025] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-black/50 dark:text-white/50" />
              </div>
              <div>
                <h4 className="font-semibold text-black dark:text-white text-sm mb-1">{title}</h4>
                <p className="text-xs text-black/40 dark:text-white/40 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Custom CTA */}
      <section className="py-20 relative overflow-hidden bg-black dark:bg-white">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="container mx-auto px-4 text-center relative z-10">
          <p className="text-white/50 dark:text-black/50 text-xs uppercase tracking-widest mb-4">
            باقة مخصصة
          </p>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-white dark:text-black mb-4">
            تحتاج عرضاً خاصاً؟
          </h2>
          <p className="text-white/50 dark:text-black/50 text-base mb-8 max-w-md mx-auto">
            تواصل معنا وسنعدّ لك عرضاً مخصصاً يناسب احتياجاتك وميزانيتك
          </p>
          <Link href="/contact">
            <Button size="lg" className="bg-white dark:bg-black text-black dark:text-white h-13 px-10 rounded-xl font-semibold hover:bg-white/90 dark:hover:bg-black/90 transition-all" data-testid="button-custom-pricing">
              تواصل معنا الآن
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
