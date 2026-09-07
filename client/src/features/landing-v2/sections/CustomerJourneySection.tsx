import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Search, PenTool, Rocket } from "lucide-react";

export default function CustomerJourneySection() {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const steps = [
    {
      num: "01",
      icon: Search,
      title: t("v2.journey.step1"),
      desc: t("v2.journey.step1.desc"),
    },
    {
      num: "02",
      icon: PenTool,
      title: t("v2.journey.step2"),
      desc: t("v2.journey.step2.desc"),
    },
    {
      num: "03",
      icon: Rocket,
      title: t("v2.journey.step3"),
      desc: t("v2.journey.step3.desc"),
    }
  ];

  return (
    <section className="py-24 bg-card relative border-y border-border/50">
      <div className="container px-4 md:px-6" ref={ref}>
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            className="text-brand font-medium tracking-widest text-sm uppercase mb-4 block"
          >
            {t("v2.journey.badge")}
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
          >
            {t("v2.journey.title")}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground"
          >
            {t("v2.journey.subtitle")}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-[1px] bg-border/80 border-dashed" />
          
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.2 }}
              className="relative flex flex-col items-center text-center z-10"
            >
              <div className="w-24 h-24 rounded-full bg-background border-2 border-brand/20 flex items-center justify-center mb-6 shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-brand/5 group-hover:bg-brand/10 transition-colors" />
                <step.icon className="w-8 h-8 text-brand" />
                <div className="absolute top-2 right-2 text-xs font-bold text-muted-foreground opacity-50">{step.num}</div>
              </div>
              <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
              <p className="text-muted-foreground max-w-xs">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
