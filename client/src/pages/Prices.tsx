import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { usePricingPlans } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import {
  Loader2, Check, ArrowLeft, Star, Zap,
  GraduationCap, UtensilsCrossed, ShoppingBag, Building2,
  Globe, Phone, Tag, Gift, Plus
} from "lucide-react";

const planIcons: Record<string, any> = {
  ecommerce: ShoppingBag,
  education: GraduationCap,
  restaurant: UtensilsCrossed,
  enterprise: Building2,
  starter: Zap,
  business: Star,
};

const planColors: Record<string, string> = {
  ecommerce: "from-blue-500/10 to-cyan-500/10",
  education: "from-violet-500/10 to-purple-500/10",
  restaurant: "from-orange-500/10 to-amber-500/10",
  enterprise: "from-gray-100 to-gray-50",
};

const iconColors: Record<string, string> = {
  ecommerce: "text-blue-600",
  education: "text-violet-600",
  restaurant: "text-orange-500",
  enterprise: "text-gray-500",
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }
  })
};

export default function Prices() {
  const { data: plans, isLoading } = usePricingPlans();
  const { t, lang, dir } = useI18n();

  const regularPlans = plans?.filter(p => !p.isCustom) ?? [];
  const customPlan = plans?.find(p => p.isCustom);

  const billingLabel = (cycle: string) => {
    if (cycle === "yearly") return t("prices.per.yearly");
    if (cycle === "monthly") return t("prices.per.monthly");
    return t("prices.per.once");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white" dir={dir}>
      <Navigation />

      {/* Hero */}
      <section className="pt-36 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.07] bg-black/[0.02] mb-6">
              <Tag className="w-3.5 h-3.5 text-black/40" />
              <span className="text-black/40 text-xs tracking-wider">{t("prices.badge")}</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-black font-heading text-black mb-5 tracking-tight">
              {t("prices.hero.title")} <span className="text-black/25">{t("prices.hero.titleHighlight")}</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-black/40 text-lg max-w-xl mx-auto">
              {t("prices.hero.subtitle")}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="pb-24 container mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-black/30" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto mb-5">
              {regularPlans.map((plan, idx) => {
                const Icon = planIcons[plan.slug] || Star;
                const colorClass = planColors[plan.slug] || "";
                const iconColor = iconColors[plan.slug] || "text-black/50";

                return (
                  <motion.div
                    key={plan.id}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    custom={idx}
                    className="relative"
                    data-testid={`card-plan-${plan.slug}`}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-3 right-1/2 translate-x-1/2 z-10">
                        <span className="bg-black text-white text-[11px] font-bold px-5 py-1.5 rounded-full shadow-lg inline-block whitespace-nowrap">
                          {t("prices.popular")}
                        </span>
                      </div>
                    )}
                    {plan.offerLabel && (
                      <div className="absolute -top-3 left-4 z-10">
                        <span className="bg-green-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow inline-block">
                          {plan.offerLabel}
                        </span>
                      </div>
                    )}

                    <div className={`p-7 rounded-2xl flex flex-col h-full border transition-all ${
                      plan.isPopular
                        ? "border-black/20 shadow-xl shadow-black/[0.07]"
                        : "border-black/[0.07] hover:shadow-lg hover:shadow-black/[0.04]"
                    }`}>
                      {plan.isPopular && (
                        <div className="absolute top-0 right-0 left-0 h-[2px] bg-black rounded-t-2xl" />
                      )}

                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-gradient-to-br ${colorClass} border border-black/[0.05]`}>
                        <Icon className={`w-5 h-5 ${iconColor}`} />
                      </div>

                      <h3 className="text-lg font-bold font-heading text-black mb-1">
                        {lang === "ar" ? plan.nameAr : (plan.name || plan.nameAr)}
                      </h3>
                      <p className="text-xs text-black/35 mb-6 leading-relaxed">
                        {lang === "ar" ? plan.descriptionAr : (plan.description || plan.descriptionAr)}
                      </p>

                      <div className="mb-6">
                        {plan.originalPrice && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-black/30 line-through">{plan.originalPrice.toLocaleString()} {t("prices.sar")}</span>
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">{t("prices.offerNow")}</span>
                          </div>
                        )}
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-4xl font-black text-black">{plan.price.toLocaleString()}</span>
                          <span className="text-black/35 text-sm">{t("prices.sar")}</span>
                          <span className="text-black/25 text-xs">/ {billingLabel(plan.billingCycle)}</span>
                        </div>
                      </div>

                      <div className="space-y-2.5 flex-1 mb-5">
                        {(lang === "ar" ? plan.featuresAr : (plan.features || plan.featuresAr))?.map((feature: string, i: number) => (
                          <div key={i} className="flex items-start gap-2.5 text-sm text-black/50">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              plan.isPopular ? "bg-black/[0.08]" : "bg-black/[0.04]"
                            }`}>
                              <Check className="w-2.5 h-2.5 text-black/60" />
                            </div>
                            <span className="leading-snug">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {plan.addonsAr && plan.addonsAr.length > 0 && (
                        <div className="mb-5 pt-4 border-t border-black/[0.05]">
                          <p className="text-[10px] text-black/30 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                            <Plus className="w-3 h-3" /> {t("prices.addons.label")}
                          </p>
                          <div className="space-y-1.5">
                            {(lang === "ar" ? plan.addonsAr : ((plan as any).addons || plan.addonsAr))?.map((addon: string, i: number) => (
                              <div key={i} className="text-xs text-black/40 flex items-center gap-1.5">
                                <Globe className="w-3 h-3 flex-shrink-0 text-black/25" />
                                {addon}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Link href="/order">
                        <Button
                          className={`w-full h-11 rounded-xl font-semibold text-sm ${
                            plan.isPopular
                              ? "premium-btn"
                              : "bg-black/[0.04] hover:bg-black/[0.08] text-black border border-black/[0.06]"
                          }`}
                          data-testid={`button-select-${plan.slug}`}
                        >
                          {t("prices.select")}
                          <ArrowLeft className="w-4 h-4 mr-2" />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {customPlan && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={3}
                className="max-w-5xl mx-auto"
                data-testid="card-plan-enterprise"
              >
                <div className="border border-black/[0.07] rounded-2xl p-7 md:p-10 bg-[#fafafa] hover:shadow-lg hover:shadow-black/[0.04] transition-all">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold font-heading text-black mb-1">
                        {lang === "ar" ? customPlan.nameAr : (customPlan.name || customPlan.nameAr)}
                      </h3>
                      <p className="text-black/40 text-sm leading-relaxed max-w-2xl">
                        {lang === "ar" ? customPlan.descriptionAr : (customPlan.description || customPlan.descriptionAr)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Link href="/contact">
                        <Button className="premium-btn h-12 px-8 rounded-xl font-semibold" data-testid="button-contact-enterprise">
                          {t("prices.contact")}
                          <Phone className="w-4 h-4 mr-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
                    {(lang === "ar" ? customPlan.featuresAr : (customPlan.features || customPlan.featuresAr))?.map((feature: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-black/45">
                        <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-black/30" />
                        <span className="leading-snug">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </section>

      {/* Domain Pricing */}
      <section className="py-16 bg-[#fafafa] border-t border-black/[0.04]">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.07] bg-white mb-4">
              <Gift className="w-3.5 h-3.5 text-black/40" />
              <span className="text-black/40 text-xs">{t("prices.domains.badge")}</span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-black">{t("prices.domains.title")}</h2>
            <p className="text-black/35 text-sm mt-2">{t("prices.domains.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-black/[0.07] p-6" data-testid="card-domain-local">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-black text-sm">{t("prices.localDomain.title")}</h4>
                  <p className="text-xs text-black/35">.sa | .com.sa | .net.sa</p>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-black text-black">100</span>
                <span className="text-black/35 text-sm">{t("prices.sar")} {t("prices.year")}</span>
                <span className="text-sm text-black/30 line-through mr-1">150</span>
              </div>
              <p className="text-[11px] text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full inline-block">{t("prices.limited")}</p>
            </div>

            <div className="bg-white rounded-2xl border border-black/[0.07] p-6" data-testid="card-domain-global">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-black text-sm">{t("prices.globalDomain.title")}</h4>
                  <p className="text-xs text-black/35">.com | .net | .org | .io</p>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-black text-black">45</span>
                <span className="text-black/35 text-sm">{t("prices.sar")} {t("prices.year")}</span>
                <span className="text-sm text-black/30 line-through mr-1">60</span>
              </div>
              <p className="text-[11px] text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full inline-block">{t("prices.limited")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Custom CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-black mb-4">
            {t("prices.custom.title")}
          </h2>
          <p className="text-black/35 text-base mb-8 max-w-md mx-auto">
            {t("prices.custom.subtitle")}
          </p>
          <Link href="/contact">
            <Button size="lg" className="premium-btn h-13 px-10 rounded-xl font-semibold" data-testid="button-custom-pricing">
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
