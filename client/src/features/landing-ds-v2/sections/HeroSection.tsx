import { useI18n } from "@/lib/i18n";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";

export default function HeroSection() {
  const { t, lang } = useI18n();
  const L = lang === "ar";
  const Arrow = L ? ArrowLeft : ArrowRight;

  return (
    <section className="relative min-h-[95dvh] flex items-center pt-32 pb-20 overflow-hidden">
      {/* Background Effect: radial soft glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] bg-ds-blue-500/5 dark:bg-ds-blue-500/10 rounded-full blur-[100px] md:blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-ds-container-xl mx-auto px-6 w-full relative z-10 flex flex-col items-center text-center">
        
        <div className="ds-anim-fade-in inline-flex items-center gap-2 px-3 py-1.5 rounded-ds-full border border-ds-border-hairline bg-ds-surface-1 mb-8 shadow-ds-xs">
          <span className="w-2 h-2 rounded-full bg-ds-green-500 animate-pulse" />
          <span className="text-ds-xs font-semibold tracking-wide text-ds-muted-foreground uppercase">
            {t("dsv2.hero.badge")}
          </span>
        </div>

        <h1 className="font-heading text-ds-5xl md:text-ds-6xl lg:text-[72px] leading-tight md:leading-[1.1] tracking-tight text-ds-foreground mb-6 max-w-4xl ds-anim-rise-in" style={{ animationDelay: "100ms" }}>
          {t("dsv2.hero.title1")}{" "}
          <span className="text-ds-muted-foreground">{t("dsv2.hero.title2")}</span>{" "}
          <br className="hidden md:block" />
          {t("dsv2.hero.title3")}
        </h1>

        <p className="text-ds-lg md:text-ds-xl text-ds-muted-foreground max-w-2xl leading-relaxed mb-12 ds-anim-rise-in" style={{ animationDelay: "200ms" }}>
          {t("dsv2.hero.subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 ds-anim-rise-in w-full sm:w-auto" style={{ animationDelay: "300ms" }}>
          <a href="#contact" className="ds-btn ds-btn-primary px-8 py-4 text-ds-base w-full sm:w-auto shadow-ds-md hover:shadow-ds-lg justify-center">
            {t("dsv2.hero.cta")}
            <Arrow size={18} strokeWidth={1.75} />
          </a>
          <a href="#portfolio" className="ds-btn ds-btn-secondary px-8 py-4 text-ds-base w-full sm:w-auto justify-center bg-ds-surface-1 text-ds-foreground border border-ds-border-hairline hover:bg-ds-surface-2 shadow-ds-xs hover:shadow-ds-sm">
            {t("dsv2.hero.secondaryCta")}
          </a>
        </div>
      </div>
      
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 ds-anim-fade-in" style={{ animationDelay: "800ms" }}>
        <ChevronDown size={24} strokeWidth={1.75} className="text-ds-muted-foreground animate-bounce" />
      </div>
    </section>
  );
}
