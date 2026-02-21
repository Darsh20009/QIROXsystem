import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useServices } from "@/hooks/use-services";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Loader2, ArrowLeft, Check, Server, ShoppingBag, Utensils, Building2, Briefcase } from "lucide-react";

const IconMap: Record<string, any> = { Utensils, ShoppingBag, Building2, Server };

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
  })
};

export default function Services() {
  const { data: services, isLoading } = useServices();

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0F]">
      <Navigation />

      <section className="pt-36 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-40" />
        <div className="absolute inset-0 animated-grid-dark opacity-20" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 mb-6">
              <Briefcase className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span className="text-white/40 text-xs tracking-wider uppercase">Services</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-black font-heading text-white mb-6 tracking-tight">
              خدماتنا <span className="text-gradient">المتميزة</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-white/30 text-lg max-w-2xl mx-auto">
              حلول مصممة خصيصاً لنمو أعمالك. اختر الباقة المناسبة ودعنا نتكفل بالباقي.
            </motion.p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0A0A0F] to-transparent" />
      </section>

      <section className="py-20 container mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#00D4FF]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services?.map((service, idx) => {
              const Icon = IconMap[service.icon || "Server"] || Server;
              return (
                <motion.div
                  key={service.id}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={idx}
                >
                  <div className="glass-card group p-7 rounded-2xl flex flex-col h-full">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 mb-5 group-hover:bg-[#00D4FF]/10 transition-all">
                      <Icon className="w-5 h-5 text-white/40 group-hover:text-[#00D4FF] transition-colors" />
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 text-white/30 self-start mb-4">
                      {service.category === 'restaurants' ? 'مطاعم وكافيهات' :
                       service.category === 'stores' ? 'متاجر إلكترونية' : 'شركات ومؤسسات'}
                    </span>
                    <h3 className="text-lg font-bold font-heading text-white mb-3">{service.title}</h3>
                    <p className="text-sm text-white/30 mb-6 leading-relaxed flex-1">{service.description}</p>

                    <div className="space-y-2.5 mb-6">
                      {service.features?.slice(0, 4).map((feature, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-white/40">
                          <Check className="w-3.5 h-3.5 text-[#00D4FF]/60 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between py-4 border-t border-white/5 mb-4">
                      <span className="text-xs text-white/20">المدة التقديرية</span>
                      <span className="text-sm font-semibold text-white">{service.estimatedDuration}</span>
                    </div>

                    <Link href={`/order?service=${service.id}`} className="w-full">
                      <Button className="w-full h-12 premium-btn rounded-xl font-semibold">
                        اطلب الخدمة
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
