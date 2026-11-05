import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Link } from "wouter";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PortfolioPremium() {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const systems = [
    { id: 1, img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800", name: t("v2.portfolio.sys1.name"), tag: t("v2.portfolio.sys1.tag") },
    { id: 2, img: "https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&q=80&w=800", name: t("v2.portfolio.sys2.name"), tag: t("v2.portfolio.sys2.tag") },
    { id: 3, img: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800", name: t("v2.portfolio.sys3.name"), tag: t("v2.portfolio.sys3.tag") },
  ];

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container px-4 md:px-6" ref={ref}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              className="text-brand font-medium tracking-widest text-sm uppercase mb-4 block"
            >
              {t("v2.portfolio.badge")}
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
            >
              {t("v2.portfolio.title")}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground"
            >
              {t("v2.portfolio.subtitle")}
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.3 }}
          >
            <Link href="/systems" className={cn(buttonVariants({ variant: "outline" }), "rounded-full px-6")}>
              {t("v2.portfolio.viewAll")}
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {systems.map((sys, i) => (
            <motion.div
              key={sys.id}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
              className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-muted block cursor-pointer"
            >
              <img 
                src={sys.img} 
                alt={sys.name} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="absolute bottom-0 left-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs text-white mb-3 inline-block">
                  {sys.tag}
                </span>
                <h3 className="text-2xl font-bold text-white drop-shadow-md">
                  {sys.name}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
