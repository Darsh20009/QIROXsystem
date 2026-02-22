import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { usePricingPlans, useTemplates } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Loader2, Check, ArrowLeft, Star, Zap, Crown, DollarSign } from "lucide-react";

const planIcons: Record<string, any> = {
  starter: Zap,
  business: Star,
  enterprise: Crown,
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }
  })
};

export default function Prices() {
  const { data: plans, isLoading } = usePricingPlans();
  const { data: templates } = useTemplates();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />

      <section className="pt-36 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] bg-black/[0.02] mb-6">
              <DollarSign className="w-3.5 h-3.5 text-black/40" />
              <span className="text-black/40 text-xs tracking-wider uppercase">Pricing</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl lg:text-7xl font-black font-heading text-black mb-6 tracking-tight">
              الباقات <span className="text-gray-400">والأسعار</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-black/40 text-lg max-w-2xl mx-auto">
              كل باقة تشمل تصميم احترافي، كود نظيف، ودعم فني مستمر.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 container mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-black/30" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {plans?.map((plan, idx) => {
              const Icon = planIcons[plan.slug] || Star;
              return (
                <motion.div
                  key={plan.id}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={idx}
                  className="relative"
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="bg-black text-white text-xs font-semibold px-5 py-1.5 rounded-full shadow-lg inline-block">
                        الأكثر طلباً
                      </span>
                    </div>
                  )}
                  <div
                    className={`p-8 rounded-2xl flex flex-col h-full relative overflow-hidden border transition-all ${
                      plan.isPopular
                        ? "border-black/20 shadow-xl shadow-black/[0.06]"
                        : "border-black/[0.06] hover:shadow-lg hover:shadow-black/[0.04]"
                    }`}
                    data-testid={`card-plan-${plan.slug}`}
                  >
                    {plan.isPopular && (
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-black" />
                    )}

                    <div className="text-center mb-8 pt-4">
                      <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-5 ${
                        plan.isPopular ? "bg-black/[0.06]" : "bg-black/[0.03]"
                      }`}>
                        <Icon className={`w-6 h-6 ${plan.isPopular ? "text-black" : "text-black/40"}`} />
                      </div>
                      <h3 className="text-xl font-bold font-heading text-black mb-1">{plan.nameAr}</h3>
                      <p className="text-xs text-black/35">{plan.descriptionAr}</p>
                    </div>

                    <div className="text-center mb-8">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-5xl font-black text-black">{plan.price.toLocaleString()}</span>
                        <span className="text-black/35 text-sm mr-1">{plan.currency}</span>
                      </div>
                      <p className="text-[10px] text-black/25 mt-2">
                        {plan.billingCycle === "monthly" ? "شهرياً" : plan.billingCycle === "yearly" ? "سنوياً" : "دفعة واحدة"}
                      </p>
                    </div>

                    <div className="space-y-3.5 flex-1">
                      {plan.featuresAr?.map((feature, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-black/45">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            plan.isPopular ? "bg-black/[0.08] text-black" : "bg-black/[0.04] text-black/35"
                          }`}>
                            <Check className="w-3 h-3" />
                          </div>
                          <span>{feature}</span>
                        </div>
                      ))}
                      {plan.maxProjects && (
                        <div className="flex items-center gap-3 text-sm text-black/45">
                          <div className="w-5 h-5 rounded-full bg-black/[0.04] text-black/35 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                          <span>حتى {plan.maxProjects} مشاريع</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-8">
                      <Link href="/order">
                        <Button
                          className={`w-full h-12 rounded-xl font-semibold ${
                            plan.isPopular
                              ? "premium-btn"
                              : "bg-black/[0.04] hover:bg-black/[0.08] text-black border border-black/[0.06]"
                          }`}
                          data-testid={`button-select-${plan.slug}`}
                        >
                          اختر هذه الباقة
                          <ArrowLeft className="w-4 h-4 mr-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      <section className="py-20 bg-[#fafafa] relative">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold font-heading text-black text-center mb-12">
            أسعار الأنظمة حسب القطاع
          </h2>
          <div className="overflow-x-auto max-w-4xl mx-auto border border-black/[0.06] rounded-2xl bg-white">
            <table className="w-full" data-testid="table-templates-pricing">
              <thead>
                <tr className="border-b border-black/[0.06]">
                  <th className="text-right py-4 px-5 text-xs font-semibold text-black/40 uppercase tracking-wider">النظام</th>
                  <th className="text-right py-4 px-5 text-xs font-semibold text-black/40 uppercase tracking-wider">القطاع</th>
                  <th className="text-right py-4 px-5 text-xs font-semibold text-black/40 uppercase tracking-wider">السعر (من)</th>
                  <th className="text-right py-4 px-5 text-xs font-semibold text-black/40 uppercase tracking-wider">السعر (إلى)</th>
                  <th className="text-right py-4 px-5 text-xs font-semibold text-black/40 uppercase tracking-wider">المدة</th>
                </tr>
              </thead>
              <tbody>
                {templates?.map((t) => (
                  <tr key={t.id} className="border-b border-black/[0.04] hover:bg-black/[0.01] transition-colors">
                    <td className="py-4 px-5 text-sm font-medium text-black">{t.nameAr}</td>
                    <td className="py-4 px-5">
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-black/[0.03] text-black/35">{t.category}</span>
                    </td>
                    <td className="py-4 px-5 text-sm text-black/50">{t.priceMin?.toLocaleString()} {t.currency}</td>
                    <td className="py-4 px-5 text-sm text-black/50">{t.priceMax?.toLocaleString()} {t.currency}</td>
                    <td className="py-4 px-5 text-xs text-black/30">{t.estimatedDuration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-28 relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-black mb-5">
            تحتاج حلاً <span className="text-gray-400">مخصصاً</span>؟
          </h2>
          <p className="text-black/35 text-lg mb-10">تواصل معنا للحصول على عرض سعر يناسب مشروعك</p>
          <Link href="/contact">
            <Button size="lg" className="premium-btn h-14 px-10 rounded-xl font-semibold" data-testid="button-custom-pricing">
              طلب عرض سعر
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
