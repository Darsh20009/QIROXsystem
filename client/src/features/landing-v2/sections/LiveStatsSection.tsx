import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useI18n } from "@/lib/i18n";

function CountUp({ end, suffix = "", duration = 2 }: { end: number, suffix?: string, duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration, isInView]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function LiveStatsSection() {
  const { t } = useI18n();
  
  const stats = [
    { value: 120, suffix: "+", label: t("v2.stats.delivered") },
    { value: 85, suffix: "+", label: t("v2.stats.clients") },
    { value: 12, suffix: "", label: t("v2.stats.sectors") },
    { value: 99, suffix: ".9%", label: t("v2.stats.uptime") },
  ];

  return (
    <section className="py-20 bg-brand text-brand-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250px_250px] animate-[gradient-shift_3s_linear_infinite]" />
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 divide-x divide-white/10 rtl:divide-x-reverse">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center text-center px-4"
            >
              <div className="text-4xl md:text-6xl font-black mb-2 tracking-tighter tabular-nums drop-shadow-md">
                <CountUp end={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm md:text-base font-medium opacity-90">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
