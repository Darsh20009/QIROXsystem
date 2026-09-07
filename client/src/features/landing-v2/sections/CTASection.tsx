import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Link } from "wouter";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CTASection() {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-32 relative overflow-hidden" ref={ref}>
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-foreground text-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_100%)]" />
      </div>

      <div className="container px-4 md:px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6 text-background">
            {t("v2.cta.title")}
          </h2>
          <p className="text-xl text-background/70 mb-10 leading-relaxed">
            {t("v2.cta.subtitle")}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/join" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto h-14 px-8 text-lg bg-brand hover:bg-brand/90 text-white rounded-full")}>
              {t("v2.cta.primary")}
            </Link>
            <Link href="/contact" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto h-14 px-8 text-lg rounded-full border-background/20 text-background hover:bg-background/10 hover:text-background")}>
              {t("v2.cta.contact")}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
