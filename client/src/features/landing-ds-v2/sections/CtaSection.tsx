import { useI18n } from "@/lib/i18n";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function CtaSection() {
  const { t, lang } = useI18n();
  const L = lang === "ar";
  const Arrow = L ? ArrowLeft : ArrowRight;

  return (
    <section id="contact" className="py-24 md:py-32 relative bg-ds-background">
      <div className="max-w-ds-container-md mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-ds-full border border-ds-border-emphasis bg-ds-surface-1 mb-8 shadow-ds-xs">
          <span className="w-2 h-2 rounded-full bg-ds-blue-500 animate-pulse" />
          <span className="text-ds-xs font-semibold tracking-wide text-ds-foreground uppercase">
            {t("dsv2.cta.badge")}
          </span>
        </div>
        
        <h2 className="font-heading text-ds-4xl md:text-ds-5xl tracking-tight text-ds-foreground mb-6">
          {t("dsv2.cta.title")}
        </h2>
        
        <p className="text-ds-lg text-ds-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
          {t("dsv2.cta.subtitle")}
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/contact" className="ds-btn ds-btn-primary px-10 py-4 text-ds-lg w-full sm:w-auto shadow-ds-md hover:shadow-ds-lg group">
            {t("dsv2.cta.contact")}
            <Arrow size={20} strokeWidth={1.75} className="transform group-hover:translate-x-1 transition-transform duration-ds-fast" style={{ transform: L ? "scaleX(-1) translateX(4px)" : "translateX(4px)" }} />
          </a>
        </div>
      </div>
    </section>
  );
}
