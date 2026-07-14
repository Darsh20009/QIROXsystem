import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useI18n } from "@/lib/i18n";

export default function InteractiveTimeline() {
  const { t, dir } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"]
  });

  const isRtl = dir === "rtl";
  const height = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const milestones = [
    { year: t("v2.timeline.m1.year"), title: t("v2.timeline.m1.title"), desc: t("v2.timeline.m1.desc") },
    { year: t("v2.timeline.m2.year"), title: t("v2.timeline.m2.title"), desc: t("v2.timeline.m2.desc") },
    { year: t("v2.timeline.m3.year"), title: t("v2.timeline.m3.title"), desc: t("v2.timeline.m3.desc") },
    { year: t("v2.timeline.m4.year"), title: t("v2.timeline.m4.title"), desc: t("v2.timeline.m4.desc") },
  ];

  return (
    <section className="py-24 bg-background relative" ref={ref}>
      <div className="container px-4 md:px-6">
        
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <span className="text-brand font-medium tracking-widest text-sm uppercase mb-4 block">
            {t("v2.timeline.badge")}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            {t("v2.timeline.title")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("v2.timeline.subtitle")}
          </p>
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Track background */}
          <div className={`absolute top-0 bottom-0 w-[2px] bg-border ${isRtl ? 'right-8 md:right-1/2' : 'left-8 md:left-1/2'} -translate-x-1/2 rtl:translate-x-1/2`} />
          
          {/* Animated fill track */}
          <motion.div 
            className={`absolute top-0 w-[4px] bg-brand ${isRtl ? 'right-8 md:right-1/2' : 'left-8 md:left-1/2'} -translate-x-1/2 rtl:translate-x-1/2 shadow-[0_0_10px_rgba(var(--brand),0.8)]`} 
            style={{ height }}
          />

          <div className="space-y-16">
            {milestones.map((m, i) => {
              const isEven = i % 2 === 0;
              return (
                <div key={i} className={`relative flex items-center ${isRtl ? 'md:flex-row-reverse' : ''} justify-end md:justify-between`}>
                  
                  {/* Left Side (Empty on mobile, alternating on desktop) */}
                  <div className={`hidden md:block w-5/12 ${isEven ? 'text-right rtl:text-left' : 'opacity-0'}`}>
                    {isEven && (
                      <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
                        <h4 className="text-xl font-bold mb-2">{m.title}</h4>
                        <p className="text-muted-foreground">{m.desc}</p>
                      </div>
                    )}
                  </div>

                  {/* Center Dot */}
                  <div className={`absolute ${isRtl ? 'right-8' : 'left-8'} md:static md:w-2/12 flex justify-center z-10 translate-x-1/2 md:translate-x-0 rtl:-translate-x-1/2 rtl:md:translate-x-0`}>
                    <div className="w-8 h-8 rounded-full bg-background border-4 border-brand flex items-center justify-center shadow-lg">
                      <div className="w-2 h-2 rounded-full bg-brand" />
                    </div>
                  </div>

                  {/* Right Side */}
                  <div className={`w-[calc(100%-5rem)] md:w-5/12 ${!isEven ? 'text-left rtl:text-right' : 'md:opacity-0'}`}>
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-sm font-bold text-brand bg-brand/10 px-3 py-1 rounded-full">{m.year}</span>
                    </div>
                    {(!isEven || true) && (
                      <div className={`bg-card p-6 rounded-2xl border border-border/50 shadow-sm ${isEven ? 'md:hidden' : ''}`}>
                        <h4 className="text-xl font-bold mb-2">{m.title}</h4>
                        <p className="text-muted-foreground">{m.desc}</p>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
