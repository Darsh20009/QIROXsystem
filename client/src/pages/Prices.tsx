import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { usePricingPlans, useTemplates } from "@/hooks/use-templates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Loader2, Check, ArrowLeft, Star, Zap, Crown } from "lucide-react";

const planIcons: Record<string, any> = {
  starter: Zap,
  business: Star,
  enterprise: Crown,
};

export default function Prices() {
  const { data: plans, isLoading } = usePricingPlans();
  const { data: templates } = useTemplates();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />

      <section className="pt-32 pb-16 bg-gradient-to-b from-primary to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-extrabold font-heading mb-6">
              باقات <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">الأسعار</span>
            </h1>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              اختر الباقة التي تناسب احتياجات عملك. كل باقاتنا تشمل تصميم احترافي وكود نظيف ودعم فني.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 container mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans?.map((plan, idx) => {
              const Icon = planIcons[plan.slug] || Star;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="relative"
                >
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 px-4 py-1.5 text-sm shadow-lg">
                        الأكثر طلباً
                      </Badge>
                    </div>
                  )}
                  <Card 
                    className={`border-0 shadow-lg flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                      plan.isPopular ? "ring-2 ring-cyan-500 scale-105" : ""
                    }`}
                    data-testid={`card-plan-${plan.slug}`}
                  >
                    <div className={`h-2 ${plan.isPopular ? "bg-gradient-to-r from-cyan-500 to-blue-600" : "bg-slate-200"}`}></div>
                    <CardHeader className="text-center pb-4 pt-8">
                      <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                        plan.isPopular ? "bg-cyan-50 text-cyan-600" : "bg-slate-100 text-slate-600"
                      }`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <CardTitle className="text-xl font-bold font-heading text-primary">
                        {plan.nameAr}
                      </CardTitle>
                      <p className="text-sm text-slate-500 mt-1">{plan.descriptionAr}</p>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <div className="text-center mb-8">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-4xl font-extrabold text-primary">{plan.price.toLocaleString()}</span>
                          <span className="text-slate-500 text-sm">{plan.currency}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {plan.billingCycle === "monthly" ? "شهرياً" : plan.billingCycle === "yearly" ? "سنوياً" : "دفعة واحدة"}
                        </p>
                      </div>

                      <div className="space-y-3 flex-1">
                        {plan.featuresAr?.map((feature, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm text-slate-700">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                              plan.isPopular ? "bg-cyan-50 text-cyan-600" : "bg-green-50 text-green-600"
                            }`}>
                              <Check className="w-3 h-3" />
                            </div>
                            <span>{feature}</span>
                          </div>
                        ))}
                        {plan.maxProjects && (
                          <div className="flex items-center gap-3 text-sm text-slate-700">
                            <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3" />
                            </div>
                            <span>حتى {plan.maxProjects} مشاريع</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-8">
                        <Link href="/order">
                          <Button 
                            className={`w-full h-12 text-base ${
                              plan.isPopular 
                                ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/20" 
                                : "bg-slate-900 hover:bg-slate-800"
                            }`}
                            data-testid={`button-select-${plan.slug}`}
                          >
                            اختر هذه الباقة
                            <ArrowLeft className="w-4 h-4 mr-2" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold font-heading text-primary text-center mb-12">
            أنظمتنا المتاحة بالأسعار
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse max-w-4xl mx-auto" data-testid="table-templates-pricing">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-right py-4 px-4 font-bold text-primary">النظام</th>
                  <th className="text-right py-4 px-4 font-bold text-primary">القطاع</th>
                  <th className="text-right py-4 px-4 font-bold text-primary">السعر (من)</th>
                  <th className="text-right py-4 px-4 font-bold text-primary">السعر (إلى)</th>
                  <th className="text-right py-4 px-4 font-bold text-primary">المدة</th>
                </tr>
              </thead>
              <tbody>
                {templates?.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800">{t.nameAr}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="text-xs">{t.category}</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{t.priceMin?.toLocaleString()} {t.currency}</td>
                    <td className="py-3 px-4 text-slate-600">{t.priceMax?.toLocaleString()} {t.currency}</td>
                    <td className="py-3 px-4 text-slate-500 text-sm">{t.estimatedDuration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold font-heading mb-4">هل تحتاج حلاً مخصصاً؟</h2>
          <p className="text-slate-400 text-lg mb-8">تواصل معنا للحصول على عرض سعر مخصص لمشروعك</p>
          <Link href="/contact">
            <Button size="lg" className="h-14 px-8 bg-white text-slate-900 hover:bg-slate-100" data-testid="button-custom-pricing">
              طلب عرض سعر مخصص
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
