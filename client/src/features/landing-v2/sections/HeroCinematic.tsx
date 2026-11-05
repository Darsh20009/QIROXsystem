import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HeroCinematic() {
  const { t, dir } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  
  const isRtl = dir === "rtl";
  const Icon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section 
      ref={containerRef} 
      className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-background pt-24 pb-20 perspective-1000"
    >
      {/* Cinematic Background Layer */}
      <motion.div 
        style={{ y, opacity, scale }}
        className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-brand/5 via-background/50 to-background z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand/20 blur-[120px] rounded-full mix-blend-screen opacity-50" />
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-blue-500/10 blur-[100px] rounded-full mix-blend-screen opacity-40" />
        
        {/* Abstract Cinematic Grid */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at center, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            transform: 'rotateX(60deg) translateY(-100px) scale(2)',
            transformOrigin: 'top center'
          }}
        />
      </motion.div>

      {/* Content Layer */}
      <div className="container px-4 md:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-brand mb-8 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
            </span>
            <span className="text-sm font-medium tracking-wider">{t("v2.hero.badge")}</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 leading-[1.1]"
          >
            {t("v2.hero.title1")} <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-blue-500">
              {t("v2.hero.title2")}
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            {t("v2.hero.subtitle")}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              href="/join" 
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto h-14 px-8 text-base bg-brand hover:bg-brand-dark text-white rounded-full transition-transform hover:scale-105 group")}
            >
              {t("v2.hero.cta")}
              <Icon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            
            <Link 
              href="/systems" 
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto h-14 px-8 text-base rounded-full border-border/50 hover:bg-muted/50 backdrop-blur-sm group")}
            >
              <Play className="w-4 h-4 mr-2 group-hover:text-brand transition-colors" />
              {t("v2.hero.secondaryCta")}
            </Link>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
