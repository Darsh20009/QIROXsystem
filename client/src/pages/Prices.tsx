import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { usePricingPlans } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import {
  Loader2, Check, ArrowLeft, Star, Zap,
  GraduationCap, UtensilsCrossed, ShoppingBag, Building2,
  Globe, Phone, Tag, Gift, Plus, Sparkles, Shield, Headphones,
  Clock, BadgePercent, ChevronRight, Smartphone, Palette, TrendingUp
} from "lucide-react";

const planIcons: Record<string, any> = {
  ecommerce: ShoppingBag,
  education: GraduationCap,
  restaurant: UtensilsCrossed,
  enterprise: Building2,
  starter: Zap,
  business: Star,
};

const planAccents: Record<string, { bg: string; icon: string; badge: string; glow: string }> = {
  ecommerce:  { bg: "from-blue-500/8 to-cyan-400/6",   icon: "bg-blue-500/10 text-blue-600",   badge: "bg-blue-50 text-blue-700 border-blue-100",  glow: "shadow-blue-500/10" },
  education:  { bg: "from-violet-500/8 to-purple-400/6",icon: "bg-violet-500/10 text-violet-600",badge:"bg-violet-50 text-violet-700 border-violet-100",glow:"shadow-violet-500/10"},
  restaurant: { bg: "from-orange-500/8 to-amber-400/6", icon: "bg-orange-500/10 text-orange-600",badge:"bg-orange-50 text-orange-700 border-orange-100",glow:"shadow-orange-500/10"},
  enterprise: { bg: "from-gray-100 to-gray-50",         icon: "bg-gray-900 text-white",          badge: "bg-gray-100 text-gray-700 border-gray-200",  glow: "shadow-gray-500/10" },
  starter:    { bg: "from-teal-500/8 to-green-400/6",   icon: "bg-teal-500/10 text-teal-600",   badge: "bg-teal-50 text-teal-700 border-teal-100",   glow: "shadow-teal-500/10" },
  business:   { bg: "from-yellow-500/8 to-amber-400/6", icon: "bg-yellow-500/10 text-yellow-600",badge:"bg-yellow-50 text-yellow-700 border-yellow-100",glow:"shadow-yellow-500/10"},
};

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } })
};

function PlanCard({ plan, idx, billingFilter }: {
  plan: any; idx: number; billingFilter: string;
}) {
  const { t, lang } = useI18n();
  if (billingFilter !== "all" && plan.billingCycle !== billingFilter) return null;

  const Icon = planIcons[plan.slug] || Star;
  const accent = planAccents[plan.slug] || planAccents.starter;

  const discount = plan.originalPrice && plan.price
    ? Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)
    : 0;

  const billingLabel = (cycle: string) => {
    if (cycle === "yearly") return lang === "ar" ? "سنوياً" : "/ year";
    if (cycle === "monthly") return lang === "ar" ? "شهرياً" : "/ month";
    return lang === "ar" ? "مرة واحدة" : "one-time";
  };

  return (
    <motion.div
      initial="hidden" animate="visible" variants={fadeUp} custom={idx}
      className="relative flex flex-col"
      data-testid={`card-plan-${plan.slug}`}
    >
      {plan.isPopular && (
        <div className="absolute -top-4 inset-x-0 flex justify-center z-20">
          <span className="inline-flex items-center gap-1.5 bg-black text-white text-[11px] font-bold px-4 py-1.5 rounded-full shadow-lg">
            <Sparkles className="w-3 h-3" />
            {lang === "ar" ? "الأكثر طلباً" : "Most Popular"}
          </span>
        </div>
      )}

      {plan.offerLabel && !plan.isPopular && (
        <div className="absolute -top-3.5 right-4 z-20">
          <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow">
            <BadgePercent className="w-3 h-3" />
            {plan.offerLabel}
          </span>
        </div>
      )}

      <div className={`relative flex flex-col flex-1 rounded-2xl border transition-all duration-300 overflow-hidden ${
        plan.isPopular
          ? "border-black/25 shadow-2xl shadow-black/10 scale-[1.02] z-10"
          : `border-black/[0.07] dark:border-white/[0.07] hover:shadow-xl hover:${accent.glow} hover:-translate-y-0.5`
      }`}>
        {plan.isPopular && (
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-black via-gray-700 to-black" />
        )}

        <div className={`p-7 flex flex-col flex-1 bg-gradient-to-br dark:from-gray-900/60 dark:to-gray-800/40 ${plan.isPopular ? "" : `${accent.bg}`}`}>

          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${accent.icon}`}>
            <Icon className="w-5 h-5" />
          </div>

          <h3 className="text-lg font-bold font-heading text-black dark:text-white mb-1.5">
            {lang === "ar" ? plan.nameAr : (plan.name || plan.nameAr)}
          </h3>
          <p className="text-xs text-black/40 dark:text-white/40 mb-6 leading-relaxed min-h-[2.5rem]">
            {lang === "ar" ? plan.descriptionAr : (plan.description || plan.descriptionAr)}
          </p>

          <div className="mb-6">
            {plan.originalPrice && (
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm text-black/30 dark:text-white/30 line-through">
                  {plan.originalPrice.toLocaleString()} {t("prices.sar")}
                </span>
                {discount > 0 && (
                  <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                    -{discount}%
                  </span>
                )}
              </div>
            )}
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black text-black dark:text-white tracking-tight">
                {plan.price.toLocaleString()}
              </span>
              <span className="text-black/35 dark:text-white/35 text-sm font-medium">{t("prices.sar")}</span>
              <span className="text-black/25 dark:text-white/25 text-xs">{billingLabel(plan.billingCycle)}</span>
            </div>
          </div>

          <div className="space-y-2.5 flex-1 mb-6">
            {(lang === "ar" ? plan.featuresAr : (plan.features || plan.featuresAr))?.map((feature: string, i: number) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-black/55 dark:text-white/55">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  plan.isPopular ? "bg-black/[0.1] dark:bg-white/[0.1]" : "bg-black/[0.04] dark:bg-white/[0.04]"
                }`}>
                  <Check className="w-2.5 h-2.5 text-black/70 dark:text-white/70" />
                </div>
                <span className="leading-snug">{feature}</span>
              </div>
            ))}
          </div>

          {plan.addonsAr && plan.addonsAr.length > 0 && (
            <div className="mb-6 pt-4 border-t border-black/[0.05] dark:border-white/[0.05]">
              <p className="text-[10px] text-black/30 dark:text-white/30 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Plus className="w-3 h-3" />
                {lang === "ar" ? "إضافات متاحة" : "Available Add-ons"}
              </p>
              <div className="space-y-1.5">
                {(lang === "ar" ? plan.addonsAr : ((plan as any).addons || plan.addonsAr))?.map((addon: string, i: number) => (
                  <div key={i} className="text-xs text-black/40 dark:text-white/40 flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 flex-shrink-0 text-black/20 dark:text-white/20" />
                    {addon}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link href="/order">
            <Button
              className={`w-full h-11 rounded-xl font-semibold text-sm transition-all ${
                plan.isPopular
                  ? "premium-btn"
                  : "bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.09] dark:hover:bg-white/[0.09] text-black dark:text-white border border-black/[0.07] dark:border-white/[0.07]"
              }`}
              data-testid={`button-select-${plan.slug}`}
            >
              {lang === "ar" ? "اختر هذه الباقة" : "Select This Plan"}
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function Prices() {
  const { data: plans, isLoading } = usePricingPlans();
  const { t, lang, dir } = useI18n();
  const [billingFilter, setBillingFilter] = useState<"all" | "one_time" | "monthly" | "yearly">("all");

  const regularPlans = plans?.filter(p => !p.isCustom) ?? [];
  const customPlan = plans?.find(p => p.isCustom);

  const hasBillingCycles = regularPlans.some(p => p.billingCycle === "monthly" || p.billingCycle === "yearly");

  const filteredPlans = billingFilter === "all"
    ? regularPlans
    : regularPlans.filter(p => p.billingCycle === billingFilter);

  const trustBadges = [
    { icon: Shield, label: lang === "ar" ? "ضمان الجودة" : "Quality Guarantee" },
    { icon: Headphones, label: lang === "ar" ? "دعم فني 24/7" : "24/7 Support" },
    { icon: Clock, label: lang === "ar" ? "تسليم في الموعد" : "On-Time Delivery" },
    { icon: Sparkles, label: lang === "ar" ? "تصميم احترافي" : "Pro Design" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950" dir={dir}>
      <Navigation />

      {/* Hero */}
      <section className="pt-36 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-black/[0.02] dark:bg-white/[0.02] rounded-full blur-3xl" />
        <div className="absolute top-32 right-1/4 w-56 h-56 bg-black/[0.015] dark:bg-white/[0.015] rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.07] dark:border-white/[0.07] bg-black/[0.02] dark:bg-white/[0.02] mb-6">
              <Tag className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
              <span className="text-black/40 dark:text-white/40 text-xs tracking-wider">{t("prices.badge")}</span>
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-black font-heading text-black dark:text-white mb-5 tracking-tight">
              {t("prices.hero.title")}{" "}
              <span className="text-black/25 dark:text-white/25">{t("prices.hero.titleHighlight")}</span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-black/40 dark:text-white/40 text-lg max-w-xl mx-auto mb-8">
              {t("prices.hero.subtitle")}
            </motion.p>

            {/* Trust badges */}
            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap justify-center gap-3 mb-10">
              {trustBadges.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] rounded-full text-xs text-black/50 dark:text-white/50">
                  <Icon className="w-3 h-3" />
                  {label}
                </div>
              ))}
            </motion.div>

            {/* Billing cycle filter */}
            {hasBillingCycles && (
              <motion.div variants={fadeUp} custom={4} className="inline-flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-xl">
                {[
                  { key: "all", label: lang === "ar" ? "الكل" : "All" },
                  { key: "one_time", label: lang === "ar" ? "مرة واحدة" : "One-time" },
                  { key: "monthly", label: lang === "ar" ? "شهري" : "Monthly" },
                  { key: "yearly", label: lang === "ar" ? "سنوي" : "Yearly" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setBillingFilter(key as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      billingFilter === key
                        ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
                        : "text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Demo / Trial Plan */}
      <section className="pb-10 container mx-auto px-4 max-w-5xl">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <div className="rounded-2xl border-2 border-dashed border-black/[0.1] dark:border-white/[0.1] bg-gradient-to-br from-emerald-50/60 to-teal-50/40 dark:from-emerald-900/10 dark:to-teal-900/10 p-8 relative overflow-hidden" data-testid="card-demo-plan">
            <div className="absolute top-4 left-4 md:top-6 md:left-6">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow">
                <Sparkles className="w-3 h-3" />
                {lang === "ar" ? "جرّب قبل أن تشتري" : "Try Before You Buy"}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mt-8 md:mt-0" dir={dir}>
              <div>
                <h3 className="text-2xl md:text-3xl font-black font-heading text-black dark:text-white mb-3">
                  {lang === "ar" ? "النسخة التجريبية" : "Demo Trial"}
                  <span className="text-emerald-600 mr-2">🎯</span>
                </h3>
                <p className="text-black/50 dark:text-white/50 text-sm leading-relaxed mb-6">
                  {lang === "ar"
                    ? "جرّب نظامك قبل الشراء الكامل — نمنحك نسخة تجريبية حقيقية لمدة 7 أيام كاملة لتختبر كل المميزات وتتأكد من ملاءمة النظام لاحتياجاتك"
                    : "Try your system before full purchase — get a real 7-day trial to test all features and ensure the system fits your needs"}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {(lang === "ar"
                    ? ["7 أيام كاملة", "نظام حقيقي بالكامل", "دعم تقني خلال التجربة", "بدون تعهد بالشراء", "استرداد قيمتها عند الاشتراك"]
                    : ["7 full days", "Real system", "Technical support", "No purchase commitment", "Deducted from subscription"]
                  ).map(f => (
                    <span key={f} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <Check className="w-3 h-3" />
                      {f}
                    </span>
                  ))}
                </div>
                <Link href="/contact">
                  <Button className="h-12 px-8 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white gap-2 shadow-lg shadow-emerald-500/20" data-testid="button-demo-trial">
                    {lang === "ar" ? "ابدأ تجربتك المجانية" : "Start Free Trial"}
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-7xl font-black text-emerald-600 mb-1">30</div>
                  <div className="text-black/40 dark:text-white/40 text-lg font-semibold">{lang === "ar" ? "ريال فقط" : "SAR only"}</div>
                  <div className="text-xs text-black/30 dark:text-white/30 mt-1">{lang === "ar" ? "تُحسم من قيمة الباقة عند الاشتراك" : "Deducted from plan price on subscription"}</div>
                  <div className="mt-4 w-24 h-1 bg-emerald-500/20 rounded-full mx-auto">
                    <div className="w-3/4 h-full bg-emerald-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Plans Grid */}
      <section className="pb-24 container mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-black/30 dark:text-white/30" />
          </div>
        ) : (
          <>
            {filteredPlans.length === 0 ? (
              <div className="text-center py-20 text-black/30 dark:text-white/30">
                {lang === "ar" ? "لا توجد باقات بهذا النوع" : "No plans for this cycle"}
              </div>
            ) : (
              <div className={`grid grid-cols-1 gap-6 max-w-5xl mx-auto mb-6 ${
                filteredPlans.length === 1 ? "md:grid-cols-1 max-w-sm" :
                filteredPlans.length === 2 ? "md:grid-cols-2 max-w-2xl" :
                "md:grid-cols-3"
              }`}>
                {filteredPlans.map((plan, idx) => (
                  <PlanCard key={plan.id} plan={plan} idx={idx} billingFilter={billingFilter} />
                ))}
              </div>
            )}

            {/* Enterprise / Custom Plan */}
            {customPlan && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={filteredPlans.length} className="max-w-5xl mx-auto" data-testid="card-plan-enterprise">
                <div className="relative border border-black/[0.07] dark:border-white/[0.07] rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800" />
                  <div className="relative p-7 md:p-10">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                      <div className="w-14 h-14 rounded-xl bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-white dark:text-black" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="text-xl font-bold font-heading text-black dark:text-white">
                            {lang === "ar" ? customPlan.nameAr : (customPlan.name || customPlan.nameAr)}
                          </h3>
                          {customPlan.offerLabel && (
                            <span className="text-xs bg-emerald-500 text-white px-2.5 py-0.5 rounded-full font-semibold">
                              {customPlan.offerLabel}
                            </span>
                          )}
                        </div>
                        <p className="text-black/40 dark:text-white/40 text-sm leading-relaxed max-w-2xl">
                          {lang === "ar" ? customPlan.descriptionAr : (customPlan.description || customPlan.descriptionAr)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <Link href="/contact">
                          <Button className="premium-btn h-12 px-8 rounded-xl font-semibold" data-testid="button-contact-enterprise">
                            {lang === "ar" ? "تواصل معنا" : "Contact Us"}
                            <Phone className="w-4 h-4 mr-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
                      {(lang === "ar" ? customPlan.featuresAr : (customPlan.features || customPlan.featuresAr))?.map((feature: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-black/45 dark:text-white/45">
                          <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-black/30 dark:text-white/30" />
                          <span className="leading-snug">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </section>

      {/* Add-ons Section */}
      <section className="py-16 container mx-auto px-4 max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-10" dir={dir}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 mb-4">
            <Plus className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
            <span className="text-black/40 dark:text-white/40 text-xs tracking-wider">{lang === "ar" ? "إضافات على أي باقة" : "Add-ons on Any Plan"}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-black dark:text-white mb-3">
            {lang === "ar" ? "ارفع مستوى مشروعك" : "Elevate Your Project"}
          </h2>
          <p className="text-black/40 dark:text-white/40 text-sm max-w-lg mx-auto">
            {lang === "ar" ? "أضف هذه الخدمات لأي باقة تختارها بتكلفة إضافية بسيطة" : "Add these services to any plan you choose at a small extra cost"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* App Store + Play Store */}
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
                <div className="text-white/30 text-sm">{lang === "ar" ? "ريال يُضاف للباقة" : "SAR added to plan"}</div>
              </div>
              <div className="space-y-2.5 mb-5">
                {(lang === "ar"
                  ? ["نشر على App Store", "نشر على Google Play", "iOS و Android", "إشعارات Push", "تجربة مستخدم أصلية"]
                  : ["App Store publish", "Google Play publish", "iOS & Android", "Push notifications", "Native UX"]
                ).map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-white/50">
                    <Check className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/contact">
                <Button className="w-full h-10 rounded-xl bg-white text-black hover:bg-gray-100 font-bold text-xs" data-testid="button-addon-app">
                  {lang === "ar" ? "أضف للطلب" : "Add to Order"}
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* SEO & Marketing */}
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
                <div className="text-black/30 dark:text-white/30 text-sm">{lang === "ar" ? "ريال يُضاف للباقة" : "SAR added to plan"}</div>
              </div>
              <div className="space-y-2.5 mb-5">
                {(lang === "ar"
                  ? ["تحسين محركات البحث SEO", "ربط Google Analytics", "خريطة موقع XML", "صفحات OG للسوشيال", "تقرير أداء شهري"]
                  : ["SEO optimization", "Google Analytics setup", "XML sitemap", "OG social pages", "Monthly performance report"]
                ).map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-black/50 dark:text-white/50">
                    <Check className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/contact">
                <Button className="w-full h-10 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs" data-testid="button-addon-seo">
                  {lang === "ar" ? "أضف للطلب" : "Add to Order"}
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Logo & Brand */}
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
                <div className="text-black/30 dark:text-white/30 text-sm">{lang === "ar" ? "ريال يُضاف للباقة" : "SAR added to plan"}</div>
              </div>
              <div className="space-y-2.5 mb-5">
                {(lang === "ar"
                  ? ["تصميم شعار احترافي", "دليل الهوية البصرية", "ألوان وخطوط العلامة", "ملفات بجميع الصيغ", "تطبيق على القرطاسية"]
                  : ["Professional logo design", "Brand guidelines", "Brand colors & fonts", "All format files", "Stationery application"]
                ).map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-black/50 dark:text-white/50">
                    <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/contact">
                <Button className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs" data-testid="button-addon-brand">
                  {lang === "ar" ? "أضف للطلب" : "Add to Order"}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Domain Pricing */}
      <section className="py-16 bg-[#fafafa] dark:bg-gray-900/50 border-t border-black/[0.04] dark:border-white/[0.04]">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 mb-4">
              <Gift className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
              <span className="text-black/40 dark:text-white/40 text-xs">{t("prices.domains.badge")}</span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-black dark:text-white">{t("prices.domains.title")}</h2>
            <p className="text-black/35 dark:text-white/35 text-sm mt-2">{t("prices.domains.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                type: "local", icon: Globe, color: "green",
                title: t("prices.localDomain.title"), ext: ".sa | .com.sa | .net.sa",
                price: 100, original: 150, bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-600 dark:text-green-400",
                badge: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
              },
              {
                type: "global", icon: Globe, color: "blue",
                title: t("prices.globalDomain.title"), ext: ".com | .net | .org | .io",
                price: 45, original: 60, bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400",
                badge: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
              },
            ].map(domain => (
              <div key={domain.type} className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.07] dark:border-white/[0.07] p-6 hover:shadow-lg transition-all" data-testid={`card-domain-${domain.type}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${domain.bg}`}>
                    <domain.icon className={`w-5 h-5 ${domain.text}`} />
                  </div>
                  <div>
                    <h4 className="font-bold text-black dark:text-white text-sm">{domain.title}</h4>
                    <p className="text-xs text-black/35 dark:text-white/35">{domain.ext}</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-black text-black dark:text-white">{domain.price}</span>
                  <span className="text-black/35 dark:text-white/35 text-sm">{t("prices.sar")} {t("prices.year")}</span>
                  <span className="text-sm text-black/25 dark:text-white/25 line-through">{domain.original}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full inline-block ${domain.badge}`}>
                    {t("prices.limited")}
                  </span>
                  <span className="text-[11px] text-black/30 dark:text-white/30">
                    {lang === "ar"
                      ? `وفّر ${domain.original - domain.price} ر.س`
                      : `Save ${domain.original - domain.price} SAR`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ / Value Props */}
      <section className="py-20 container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold font-heading text-black dark:text-white mb-3">
            {lang === "ar" ? "ماذا تشمل كل باقة؟" : "What's Included in Every Plan?"}
          </h2>
          <p className="text-black/40 dark:text-white/40 text-sm">
            {lang === "ar" ? "مزايا ثابتة في جميع الباقات بدون استثناء" : "Fixed benefits across all plans without exception"}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Shield, title: lang === "ar" ? "ضمان الجودة" : "Quality Guarantee", desc: lang === "ar" ? "مراجعة كاملة قبل التسليم مع ضمان إصلاح أي خطأ" : "Full review before delivery with guaranteed bug fixes" },
            { icon: Headphones, title: lang === "ar" ? "دعم فني مستمر" : "Continuous Support", desc: lang === "ar" ? "فريق دعم متاح على مدار الساعة عبر القنوات المختلفة" : "Support team available 24/7 across all channels" },
            { icon: Clock, title: lang === "ar" ? "تسليم في الموعد" : "On-Time Delivery", desc: lang === "ar" ? "التزام تام بالجداول الزمنية المتفق عليها" : "Full commitment to agreed-upon timelines" },
            { icon: Sparkles, title: lang === "ar" ? "تصميم احترافي" : "Professional Design", desc: lang === "ar" ? "تصاميم عصرية بأعلى معايير UX/UI العالمية" : "Modern designs to the highest global UX/UI standards" },
            { icon: Globe, title: lang === "ar" ? "دعم ثنائي اللغة" : "Bilingual Support", desc: lang === "ar" ? "جميع أنظمتنا تدعم العربية والإنجليزية بالكامل" : "All our systems fully support Arabic and English" },
            { icon: Gift, title: lang === "ar" ? "تدريب مجاني" : "Free Training", desc: lang === "ar" ? "جلسة تدريب مجانية لاستخدام النظام بعد التسليم" : "Free training session on system usage after delivery" },
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
            {lang === "ar" ? "باقة مخصصة" : "Custom Package"}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-white dark:text-black mb-4">
            {t("prices.custom.title")}
          </h2>
          <p className="text-white/50 dark:text-black/50 text-base mb-8 max-w-md mx-auto">
            {t("prices.custom.subtitle")}
          </p>
          <Link href="/contact">
            <Button size="lg" className="bg-white dark:bg-black text-black dark:text-white h-13 px-10 rounded-xl font-semibold hover:bg-white/90 dark:hover:bg-black/90 transition-all" data-testid="button-custom-pricing">
              {t("prices.custom.cta")}
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
