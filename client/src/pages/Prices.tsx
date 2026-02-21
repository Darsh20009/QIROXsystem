import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { usePricingPlans, useTemplates } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Loader2, Check, ArrowLeft } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
  })
};

export default function Prices() {
  const { data: plans, isLoading } = usePricingPlans();
  const { data: templates } = useTemplates();

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F4F4]">
      <Navigation />

      <section className="pt-32 pb-16 bg-[#111111] text-white relative overflow-hidden">
        <div className="absolute inset-0 animated-grid-dark opacity-40" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.span variants={fadeUp} custom={0} className="inline-block text-white/40 text-sm font-medium tracking-widest uppercase mb-6">
              Pricing
            </motion.span>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-black font-heading mb-6 tracking-tight">
              الباقات والأسعار
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-white/40 text-lg max-w-2xl mx-auto">
              كل باقة تشمل تصميم احترافي، كود نظيف، ودعم فني مستمر.
            </motion.p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#F4F4F4] to-transparent" />
      </section>

      <section className="py-20 container mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#111111]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans?.map((plan, idx) => (
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
                    <span className="bg-[#111111] text-white text-xs font-semibold px-4 py-1.5 rounded-full">
                      الأكثر طلباً
                    </span>
                  </div>
                )}
                <div
                  className={`p-6 rounded-xl bg-white border flex flex-col h-full transition-all duration-300 ${
                    plan.isPopular
                      ? "border-[#111111] border-2 shadow-lg"
                      : "border-[#E0E0E0] hover:border-[#111111]"
                  }`}
                  data-testid={`card-plan-${plan.slug}`}
                >
                  <div className="text-center mb-6 pt-2">
                    <h3 className="text-lg font-bold font-heading text-[#111111] mb-1">{plan.nameAr}</h3>
                    <p className="text-xs text-[#555555]">{plan.descriptionAr}</p>
                  </div>

                  <div className="text-center mb-8">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-black text-[#111111]">{plan.price.toLocaleString()}</span>
                      <span className="text-[#555555] text-sm">{plan.currency}</span>
                    </div>
                    <p className="text-[10px] text-black/30 mt-1">
                      {plan.billingCycle === "monthly" ? "شهرياً" : plan.billingCycle === "yearly" ? "سنوياً" : "دفعة واحدة"}
                    </p>
                  </div>

                  <div className="space-y-3 flex-1">
                    {plan.featuresAr?.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-[#555555]">
                        <Check className="w-4 h-4 text-[#111111] flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                    {plan.maxProjects && (
                      <div className="flex items-center gap-3 text-sm text-[#555555]">
                        <Check className="w-4 h-4 text-[#111111] flex-shrink-0" />
                        <span>حتى {plan.maxProjects} مشاريع</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-8">
                    <Link href="/order">
                      <Button
                        className={`w-full h-12 rounded-lg font-semibold ${
                          plan.isPopular
                            ? "bg-[#111111] hover:bg-[#2B2B2B] text-white"
                            : "bg-[#F4F4F4] hover:bg-[#EAEAEA] text-[#111111]"
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
            ))}
          </div>
        )}
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold font-heading text-[#111111] text-center mb-10">
            أسعار الأنظمة حسب القطاع
          </h2>
          <div className="overflow-x-auto max-w-4xl mx-auto">
            <table className="w-full" data-testid="table-templates-pricing">
              <thead>
                <tr className="border-b-2 border-[#E0E0E0]">
                  <th className="text-right py-3 px-4 text-sm font-bold text-[#111111]">النظام</th>
                  <th className="text-right py-3 px-4 text-sm font-bold text-[#111111]">القطاع</th>
                  <th className="text-right py-3 px-4 text-sm font-bold text-[#111111]">السعر (من)</th>
                  <th className="text-right py-3 px-4 text-sm font-bold text-[#111111]">السعر (إلى)</th>
                  <th className="text-right py-3 px-4 text-sm font-bold text-[#111111]">المدة</th>
                </tr>
              </thead>
              <tbody>
                {templates?.map((t) => (
                  <tr key={t.id} className="border-b border-[#E0E0E0] hover:bg-[#F4F4F4] transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-[#111111]">{t.nameAr}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-0.5 rounded bg-[#EAEAEA] text-[#555555]">{t.category}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-[#555555]">{t.priceMin?.toLocaleString()} {t.currency}</td>
                    <td className="py-3 px-4 text-sm text-[#555555]">{t.priceMax?.toLocaleString()} {t.currency}</td>
                    <td className="py-3 px-4 text-xs text-black/40">{t.estimatedDuration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#111111] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold font-heading mb-4">تحتاج حلاً مخصصاً؟</h2>
          <p className="text-white/40 text-lg mb-8">تواصل معنا للحصول على عرض سعر يناسب مشروعك</p>
          <Link href="/contact">
            <Button size="lg" className="h-14 px-8 bg-white text-[#111111] hover:bg-white/90 rounded-xl font-semibold" data-testid="button-custom-pricing">
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
