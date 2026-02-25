import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useServices } from "@/hooks/use-services";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Loader2, ArrowLeft, Check, Server, ShoppingBag, Utensils, Building2, Briefcase } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const IconMap: Record<string, any> = { Utensils, ShoppingBag, Building2, Server };

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
  })
};

const categoryMap: Record<string, string> = {
  restaurants: "services.cat.restaurants",
  stores: "services.cat.stores",
  institutions: "services.cat.institutions",
  education: "services.cat.education",
  health: "services.cat.health",
  personal: "services.cat.personal",
};

export default function Services() {
  const { data: services, isLoading } = useServices();
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />

      <section className="pt-36 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] bg-black/[0.02] mb-6">
              <Briefcase className="w-3.5 h-3.5 text-black/40" />
              <span className="text-black/40 text-xs tracking-wider uppercase">{t("services.badge")}</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-black font-heading text-black mb-6 tracking-tight">
              {t("services.title")} <span className="text-gray-400">{t("services.titleHighlight")}</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-black/40 text-lg max-w-2xl mx-auto">
              {t("services.subtitle")}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services?.map((service, idx) => {
              const Icon = IconMap[service.icon || "Server"] || Server;
              const catKey = categoryMap[service.category || ""] as any;
              return (
                <motion.div
                  key={service.id}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={idx}
                >
                  <div className="group p-7 rounded-2xl flex flex-col h-full border border-black/[0.06] bg-white hover:shadow-lg hover:shadow-black/[0.04] transition-all" data-testid={`card-service-${service.id}`}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-black/[0.04] mb-5">
                      <Icon className="w-5 h-5 text-black/40" />
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-black/[0.03] text-black/40 self-start mb-4" data-testid={`text-category-${service.id}`}>
                      {catKey ? t(catKey) : service.category}
                    </span>
                    <h3 className="text-lg font-bold font-heading text-black mb-3" data-testid={`text-title-${service.id}`}>{service.title}</h3>
                    <p className="text-sm text-black/40 mb-6 leading-relaxed flex-1" data-testid={`text-description-${service.id}`}>{service.description}</p>

                    <div className="space-y-2.5 mb-6">
                      {service.features?.slice(0, 4).map((feature, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-black/40">
                          <Check className="w-3.5 h-3.5 text-black/25 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between py-4 border-t border-black/[0.04] mb-2" data-testid={`text-price-range-${service.id}`}>
                      <span className="text-xs text-black/25">{t("services.price") || "السعر"}</span>
                      <span className="text-sm font-semibold text-black">
                        {(!service.priceMin && !service.priceMax)
                          ? "السعر بعد مناقشة"
                          : service.priceMin === service.priceMax
                            ? `${service.priceMin!.toLocaleString()} ر.س`
                            : service.priceMin && service.priceMax
                              ? `${service.priceMin.toLocaleString()} - ${service.priceMax.toLocaleString()} ر.س`
                              : service.priceMin
                                ? `من ${service.priceMin.toLocaleString()} ر.س`
                                : `حتى ${service.priceMax!.toLocaleString()} ر.س`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-4 border-t border-black/[0.04] mb-4" data-testid={`text-duration-${service.id}`}>
                      <span className="text-xs text-black/25">{t("services.duration")}</span>
                      <span className="text-sm font-semibold text-black">{service.estimatedDuration}</span>
                    </div>

                    <Link href={`/order?service=${service.id}`} className="w-full">
                      <Button className="w-full h-12 premium-btn rounded-xl font-semibold" data-testid={`button-order-service-${service.id}`}>
                        {t("services.orderService")}
                        <ArrowLeft className="w-4 h-4 mr-2" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
