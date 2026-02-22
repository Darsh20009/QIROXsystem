import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";
import { useTemplates } from "@/hooks/use-templates";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft, Globe, ArrowUpRight,
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Layers,
  Sparkles, Shield, Zap,
  UtensilsCrossed, Store, Building2, ChevronLeft, ChevronRight,
  Headphones, Palette
} from "lucide-react";

const sectorIcons: Record<string, any> = {
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Globe
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }
  })
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

export default function Home() {
  const { data: templates } = useTemplates();
  const { t, lang, dir } = useI18n();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeCarouselIdx, setActiveCarouselIdx] = useState(0);

  const scrollCarousel = useCallback((direction: "left" | "right") => {
    if (!carouselRef.current) return;
    const card = carouselRef.current.querySelector("[data-carousel-card]") as HTMLElement | null;
    const step = card ? card.offsetWidth + 20 : 320;
    const scrollAmount = direction === "right" ? step : -step;
    carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const handleScroll = () => {
      const card = el.querySelector("[data-carousel-card]") as HTMLElement | null;
      const step = card ? card.offsetWidth + 20 : 320;
      const idx = Math.round(el.scrollLeft / step);
      setActiveCarouselIdx(idx);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />

      <section className="relative w-full min-h-[80vh] flex items-center justify-center pt-28 pb-16" data-testid="section-hero">
        <div className="absolute inset-0 bg-white" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)", backgroundSize: "40px 40px" }} />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h1 dir="ltr" className="text-5xl sm:text-6xl md:text-8xl font-black font-heading text-black leading-[1.05] mb-1 tracking-tight">
                Build Systems.
              </h1>
              <h1
                dir="ltr"
                className="text-5xl sm:text-6xl md:text-8xl font-black font-heading leading-[1.05] mb-8 tracking-tight text-gray-400"
              >
                .Stay Human
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg sm:text-xl text-black/50 mb-10 max-w-2xl mx-auto leading-relaxed"
              dir={dir}
            >
              {t("home.hero.subtitleFull")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
            >
              <Link href="/contact">
                <Button
                  size="lg"
                  className="h-14 px-10 text-base rounded-md gap-2 font-semibold bg-black text-white hover:bg-gray-900 no-default-hover-elevate no-default-active-elevate"
                  data-testid="button-start-project"
                >
                  {t("home.startProject")}
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/portfolio">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-10 text-base border-black/10 text-black/60 rounded-md font-semibold bg-transparent hover:bg-black/[0.03]"
                  data-testid="button-explore-solutions"
                >
                  {t("home.exploreSystems")}
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-black/[0.06] bg-black/[0.02]"
              data-testid="promo-banner"
            >
              <span className="text-[11px] font-bold tracking-wider text-black bg-black/[0.06] px-2.5 py-0.5 rounded-full">{t("home.promo.new")}</span>
              <span className="text-black/40 text-sm" dir={dir}>{t("home.promo.text")}</span>
              <ArrowLeft className="w-3.5 h-3.5 text-black/20" />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-6 relative z-10" data-testid="section-stats">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="border border-black/[0.06] rounded-md overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-black/[0.06] rtl:divide-x-reverse">
              {[
                { value: `${templates?.length || 8}+`, label: t("home.stats.readySystems") },
                { value: "6+", label: t("home.stats.sectorsCount") },
                { value: "3", label: t("home.stats.packages") },
                { value: "2", label: t("home.stats.locations") },
              ].map((stat, idx) => (
                <div key={idx} className="px-6 py-8 text-center" data-testid={`stat-card-${idx}`}>
                  <div className="text-3xl md:text-4xl font-black mb-2 font-heading text-black">
                    {stat.value}
                  </div>
                  <div className="text-black/35 text-sm" dir={dir}>{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-28 relative" data-testid="section-pathfinder">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
            className="rounded-[24px] border border-black/[0.06] bg-[#fafafa] overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-10 md:p-14 flex flex-col justify-center" dir={dir}>
                <span className="text-black/40 text-sm font-semibold mb-3">{t("home.pathfinder.label")}</span>
                <h2 className="text-3xl md:text-4xl font-bold font-heading text-black mb-4 leading-tight">
                  {t("home.pathfinder.title")}
                </h2>
                <p className="text-black/40 text-base leading-relaxed mb-8 max-w-md">
                  {t("home.pathfinder.desc")}
                </p>
                <div>
                  <Link href="/contact">
                    <Button
                      size="lg"
                      className="h-13 px-8 text-base rounded-md gap-2 font-semibold bg-black text-white hover:bg-gray-900"
                      data-testid="button-pathfinder-cta"
                    >
                      {t("home.pathfinder.cta")}
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="p-10 md:p-14 border-t md:border-t-0 md:border-r border-black/[0.06] rtl:md:border-r-0 rtl:md:border-l rtl:border-black/[0.06]" dir={dir}>
                <h3 className="text-black/40 text-sm font-semibold mb-8 tracking-wider uppercase">{t("home.pathfinder.quickLinks")}</h3>
                <div className="space-y-1">
                  {[
                    { href: "/portfolio", labelKey: "home.pathfinder.systems" as const },
                    { href: "/prices", labelKey: "home.pathfinder.packages" as const },
                    { href: "/about", labelKey: "home.pathfinder.aboutPlatform" as const },
                    { href: "/contact", labelKey: "home.pathfinder.contact" as const },
                  ].map((link) => (
                    <Link key={link.href} href={link.href}>
                      <div
                        className="flex items-center justify-between py-4 px-4 rounded-md text-black/50 hover:text-black hover:bg-black/[0.03] transition-all cursor-pointer group"
                        data-testid={`pathfinder-link-${link.href.replace("/", "")}`}
                      >
                        <span className="text-base font-medium">{t(link.labelKey)}</span>
                        <ArrowLeft className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-28 relative" data-testid="section-carousel">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-3" dir={dir}>
                <motion.div variants={fadeUp} custom={0}>
                  <span className="text-black/40 text-sm font-semibold mb-3 block">{t("home.carousel.label")}</span>
                  <h2 className="text-3xl md:text-4xl font-bold font-heading text-black mb-4 leading-tight">
                    {t("home.carousel.title")}{" "}
                    <span className="text-gray-400">{t("home.carousel.titleHighlight")}</span>
                  </h2>
                  <p className="text-black/40 text-sm leading-relaxed mb-8">
                    {t("home.carousel.desc")}
                  </p>
                  <div className="flex gap-2">
                    {templates?.slice(0, 5).map((_, idx) => (
                      <div
                        key={idx}
                        className={`rounded-full transition-all duration-300 ${
                          idx === activeCarouselIdx
                            ? "w-6 h-2 bg-black"
                            : "w-2 h-2 bg-black/10"
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              </div>

              <div className="lg:col-span-9 relative">
                <div className="flex items-center gap-3 mb-4 justify-end">
                  <button
                    onClick={() => scrollCarousel("right")}
                    className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center text-black/30 hover:text-black hover:border-black/20 transition-all"
                    data-testid="button-carousel-prev"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => scrollCarousel("left")}
                    className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center text-black/30 hover:text-black hover:border-black/20 transition-all"
                    data-testid="button-carousel-next"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>

                <div
                  ref={carouselRef}
                  className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {templates?.map((template, idx) => {
                    const Icon = sectorIcons[template.icon || "Globe"] || Globe;
                    return (
                      <Link key={template.id} href="/portfolio">
                        <div
                          className="flex-shrink-0 w-[300px] bg-[#fafafa] rounded-[24px] p-8 cursor-pointer group snap-start border border-black/[0.04] hover:border-black/[0.08] transition-all hover:shadow-lg hover:shadow-black/[0.04]"
                          data-testid={`carousel-card-${template.slug}`}
                          data-carousel-card
                        >
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-black/[0.04] mb-6">
                            <Icon className="w-5 h-5 text-black/40" />
                          </div>
                          <h3 className="text-lg font-bold text-black mb-2" dir={dir}>{lang === "ar" ? template.nameAr : (template.name || template.nameAr)}</h3>
                          <p className="text-sm text-black/40 leading-relaxed mb-6 line-clamp-3" dir={dir}>
                            {lang === "ar" ? template.descriptionAr : (template.description || template.descriptionAr)}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs px-3 py-1.5 rounded-full bg-black/[0.04] text-black/40 font-medium">
                              {template.category}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-black/[0.04] flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                              <ArrowUpRight className="w-4 h-4 text-black/30 group-hover:text-white transition-colors" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-28 relative" data-testid="section-services">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <div className="text-center mb-16" dir={dir}>
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] bg-black/[0.02] mb-5">
                <Zap className="w-3.5 h-3.5 text-black/40" />
                <span className="text-black/40 text-xs tracking-wider uppercase">{t("home.services.badge")}</span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold font-heading text-black mb-4">
                {t("home.services.title")}{" "}
                <span className="text-gray-400">{t("home.services.titleHighlight")}</span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-black/35 max-w-xl mx-auto text-base">
                {t("home.services.subtitle")}
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
              {[
                {
                  icon: UtensilsCrossed,
                  title: t("home.services.restaurants.title"),
                  desc: t("home.services.restaurants.desc"),
                  features: [t("home.services.restaurants.f1"), t("home.services.restaurants.f2"), t("home.services.restaurants.f3"), t("home.services.restaurants.f4")],
                },
                {
                  icon: Store,
                  title: t("home.services.stores.title"),
                  desc: t("home.services.stores.desc"),
                  features: [t("home.services.stores.f1"), t("home.services.stores.f2"), t("home.services.stores.f3"), t("home.services.stores.f4")],
                },
                {
                  icon: GraduationCap,
                  title: t("home.services.education.title"),
                  desc: t("home.services.education.desc"),
                  features: [t("home.services.education.f1"), t("home.services.education.f2"), t("home.services.education.f3"), t("home.services.education.f4")],
                },
                {
                  icon: Building2,
                  title: t("home.services.enterprise.title"),
                  desc: t("home.services.enterprise.desc"),
                  features: [t("home.services.enterprise.f1"), t("home.services.enterprise.f2"), t("home.services.enterprise.f3"), t("home.services.enterprise.f4")],
                },
              ].map((path, idx) => (
                <motion.div key={idx} variants={fadeUp} custom={idx}>
                  <div
                    className="rounded-[24px] border border-black/[0.06] bg-white p-10 h-full group transition-all duration-300 hover:border-black/[0.1] hover:shadow-lg hover:shadow-black/[0.04]"
                    data-testid={`service-path-${idx}`}
                    dir={dir}
                  >
                    <div className="flex items-start justify-between mb-8">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-black/[0.04] transition-all duration-300">
                        <path.icon className="w-6 h-6 text-black/40" />
                      </div>
                      <Link href="/portfolio">
                        <ArrowUpRight className="w-5 h-5 text-black/10 group-hover:text-black/40 transition-all duration-300 cursor-pointer" />
                      </Link>
                    </div>
                    <h3 className="text-xl font-bold font-heading text-black mb-3">{path.title}</h3>
                    <p className="text-sm text-black/40 leading-relaxed mb-6">{path.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {path.features.map((f, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-3.5 py-1.5 rounded-full border border-black/[0.06] text-black/40 bg-black/[0.02]"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-28 relative bg-[#fafafa]" data-testid="section-why">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <div className="text-center mb-16" dir={dir}>
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] bg-white mb-5">
                <Sparkles className="w-3.5 h-3.5 text-black/40" />
                <span className="text-black/40 text-xs tracking-wider uppercase">{t("home.why.badge")}</span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold font-heading text-black mb-4">
                {t("home.why.title")}{" "}
                <span className="text-gray-400">QIROX</span>
                {lang === "ar" ? "؟" : "?"}
              </motion.h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {[
                { icon: Layers, title: t("home.why.scalable.title"), desc: t("home.why.scalable.desc") },
                { icon: Palette, title: t("home.why.design.title"), desc: t("home.why.design.desc") },
                { icon: Headphones, title: t("home.why.support.title"), desc: t("home.why.support.desc") },
                { icon: Shield, title: t("home.why.security.title"), desc: t("home.why.security.desc") },
              ].map((item, idx) => (
                <motion.div key={idx} variants={fadeUp} custom={idx}>
                  <div
                    className="rounded-[24px] border border-black/[0.06] bg-white p-8 h-full transition-all duration-300 hover:shadow-lg hover:shadow-black/[0.04]"
                    data-testid={`why-card-${idx}`}
                    dir={dir}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-black/[0.04]">
                      <item.icon className="w-5 h-5 text-black/40" />
                    </div>
                    <h3 className="text-base font-bold font-heading text-black mb-3">{item.title}</h3>
                    <p className="text-sm text-black/35 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-28 relative" data-testid="section-spotlight">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <div className="rounded-[25px] p-12 md:p-20 text-center relative overflow-hidden bg-black">
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />

              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold font-heading text-white mb-6" dir={dir}>
                  {t("home.spotlight.title")}
                </h2>
                <p className="text-white/50 text-lg max-w-2xl mx-auto mb-10" dir={dir}>
                  {t("home.spotlight.desc")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/contact">
                    <Button
                      size="lg"
                      className="h-14 px-10 text-base rounded-md gap-2 font-semibold bg-white text-black hover:bg-gray-100"
                      data-testid="button-cta-start"
                    >
                      {t("home.spotlight.cta")}
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/prices">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-14 px-10 text-base border-white/15 text-white/70 rounded-md font-semibold bg-transparent hover:bg-white/10"
                      data-testid="button-cta-prices"
                    >
                      {t("home.spotlight.prices")}
                    </Button>
                  </Link>
                </div>

                <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-sm text-white/25">
                  <span>www.qiroxstudio.online</span>
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                  <span>{t("home.spotlight.riyadh")}</span>
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                  <span>{t("home.spotlight.cairo")}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <InstallPrompt />
      <Footer />
    </div>
  );
}
