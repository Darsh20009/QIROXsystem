import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function TestimonialsSection() {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const testimonials = [
    {
      name: t("v2.test.1.name"),
      role: t("v2.test.1.role"),
      content: t("v2.test.1.content"),
      rating: 5
    },
    {
      name: t("v2.test.2.name"),
      role: t("v2.test.2.role"),
      content: t("v2.test.2.content"),
      rating: 5
    },
    {
      name: t("v2.test.3.name"),
      role: t("v2.test.3.role"),
      content: t("v2.test.3.content"),
      rating: 5
    }
  ];

  return (
    <section className="py-24 bg-muted/20 relative border-t border-border/50">
      <div className="container px-4 md:px-6" ref={ref}>
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            className="text-brand font-medium tracking-widest text-sm uppercase mb-4 block"
          >
            {t("v2.testimonials.badge")}
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
          >
            {t("v2.testimonials.title")}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground"
          >
            {t("v2.testimonials.subtitle")}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((tItem, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
            >
              <Card className="h-full bg-background border-border/40 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-8 flex flex-col h-full">
                  <div className="flex gap-1 mb-6">
                    {Array.from({ length: tItem.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-lg leading-relaxed mb-8 flex-grow">
                    "{tItem.content}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center font-bold text-lg text-brand">
                      {tItem.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold">{tItem.name}</h4>
                      <p className="text-sm text-muted-foreground">{tItem.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
