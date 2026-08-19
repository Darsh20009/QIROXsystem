import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { ShoppingBag, Coffee, Building2, ChevronRight, ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

export default function ServicesShowcase() {
  const { t, dir } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const isRtl = dir === "rtl";
  const Icon = isRtl ? ChevronLeft : ChevronRight;

  const services = [
    {
      id: "ecommerce",
      title: t("v2.services.ecommerce"),
      desc: t("v2.services.ecommerce.desc"),
      icon: ShoppingBag,
      color: "from-emerald-500/20 to-emerald-500/0",
      iconColor: "text-emerald-500",
      link: "/systems?category=ecommerce"
    },
    {
      id: "restaurant",
      title: t("v2.services.restaurant"),
      desc: t("v2.services.restaurant.desc"),
      icon: Coffee,
      color: "from-orange-500/20 to-orange-500/0",
      iconColor: "text-orange-500",
      link: "/systems?category=restaurant"
    },
    {
      id: "corporate",
      title: t("v2.services.corporate"),
      desc: t("v2.services.corporate.desc"),
      icon: Building2,
      color: "from-indigo-500/20 to-indigo-500/0",
      iconColor: "text-indigo-500",
      link: "/systems?category=corporate"
    }
  ];

  return (
    <section className="py-24 bg-muted/30 relative">
      <div className="container px-4 md:px-6" ref={ref}>
        
        <div className="flex flex-col items-center text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            className="text-brand font-medium tracking-widest text-sm uppercase mb-4"
          >
            {t("v2.services.badge")}
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
          >
            {t("v2.services.title")}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl"
          >
            {t("v2.services.subtitle")}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {services.map((svc, i) => (
            <motion.div
              key={svc.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
            >
              <Link href={svc.link} className="block group h-full">
                <Card className="h-full cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden flex flex-col">
                  <div className={`h-32 bg-gradient-to-br ${svc.color} relative overflow-hidden flex items-center p-6 shrink-0`}>
                    <svc.icon className={`w-12 h-12 ${svc.iconColor} opacity-80 group-hover:scale-110 transition-transform duration-500`} />
                  </div>
                  <CardContent className="p-6 flex flex-col grow">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-brand transition-colors">{svc.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      {svc.desc}
                    </p>
                    <div className="flex items-center text-sm font-medium text-brand/80 group-hover:text-brand mt-auto">
                      <span>{t("v2.hero.secondaryCta")}</span>
                      <Icon className="w-4 h-4 ml-1 rtl:mr-1 rtl:ml-0 opacity-0 -translate-x-2 rtl:translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
