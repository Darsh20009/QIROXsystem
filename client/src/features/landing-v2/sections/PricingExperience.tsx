import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Link } from "wouter";
import { buttonVariants } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PricingExperience() {
  const { t, dir } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const isRtl = dir === "rtl";

  return (
    <section className="py-24 bg-background relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-brand/5 clip-path-slant pointer-events-none" style={{ clipPath: "polygon(0 0, 100% 10%, 100% 100%, 0 90%)" }} />
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          
          <div className="w-full md:w-1/2 text-center md:text-start rtl:md:text-right">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              className="text-brand font-medium tracking-widest text-sm uppercase mb-4 block"
            >
              {t("v2.pricing.badge")}
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-bold tracking-tight mb-6"
            >
              {t("v2.pricing.title")}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground max-w-lg mb-8"
            >
              {t("v2.pricing.subtitle")}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.3 }}
            >
              <Link href="/prices" className={cn(buttonVariants({ size: "lg" }), "rounded-full px-8 bg-brand hover:bg-brand-dark text-white")}>
                {t("v2.pricing.viewAll")}
              </Link>
            </motion.div>
          </div>

          <div className="w-full md:w-1/2">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, rotateY: isRtl ? -10 : 10 }}
              animate={isInView ? { opacity: 1, scale: 1, rotateY: 0 } : { opacity: 0, scale: 0.95, rotateY: isRtl ? -10 : 10 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative rounded-3xl bg-card border border-brand/20 shadow-2xl p-8 md:p-12 overflow-hidden perspective-1000"
            >
              <div className="absolute top-0 right-0 p-4">
                <div className="text-xs font-bold px-3 py-1 bg-brand text-white rounded-full">{t("v2.pricing.card.badge")}</div>
              </div>
              <h3 className="text-2xl font-bold mb-2">{t("v2.pricing.card.title")}</h3>
              <p className="text-muted-foreground mb-6">{t("v2.pricing.card.desc")}</p>
              
              <div className="mb-8">
                <span className="text-4xl font-black">{t("v2.pricing.card.price")}</span>
                <span className="text-muted-foreground">{t("v2.pricing.card.period")}</span>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  t("v2.pricing.card.f1"), 
                  t("v2.pricing.card.f2"), 
                  t("v2.pricing.card.f3"), 
                  t("v2.pricing.card.f4")
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-brand" />
                    </div>
                    <span className="font-medium">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand/10 rounded-full blur-[80px]" />
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
