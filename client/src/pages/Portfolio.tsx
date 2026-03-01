import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useTemplates } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import {
  Loader2, ArrowLeft, Check, ArrowUpRight,
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Globe, Layers, Filter
} from "lucide-react";

const IconMap: Record<string, any> = {
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Globe
};

const categoryLabelsMap: Record<string, { ar: string; en: string }> = {
  all: { ar: "الكل", en: "All" },
  education: { ar: "التعليم", en: "Education" },
  health: { ar: "الصحة واللياقة", en: "Health & Fitness" },
  personal: { ar: "شخصي", en: "Personal" },
  institutional: { ar: "مؤسسي", en: "Institutional" },
  commerce: { ar: "تجارة إلكترونية", en: "E-commerce" },
  food: { ar: "مطاعم وكافيهات", en: "Restaurants & Cafes" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }
  })
};

export default function Portfolio() {
  const { data: templates, isLoading } = useTemplates();
  const [activeFilter, setActiveFilter] = useState("all");
  const { t, lang } = useI18n();

  const categories = ["all", ...Array.from(new Set(templates?.map(t => t.category) || []))];
  const filtered = activeFilter === "all"
    ? templates
    : templates?.filter(t => t.category === activeFilter);

  const catLabel = (cat: string) => categoryLabelsMap[cat]?.[lang] || cat;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />

      <section className="pt-36 pb-24 relative overflow-hidden">
        <PageGraphics variant="bars-corners" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] bg-black/[0.02] mb-6">
              <Layers className="w-3.5 h-3.5 text-black/40" />
              <span className="text-black/40 text-xs tracking-wider uppercase">{t("portfolio.badge")}</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl lg:text-7xl font-black font-heading text-black mb-6 tracking-tight">
              {t("portfolio.title1")} <span className="text-gray-400">{t("portfolio.title2")}</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-black/40 text-lg max-w-2xl mx-auto leading-relaxed">
              {t("portfolio.subtitle")}
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex items-center justify-center gap-12 mt-14">
              {[
                { value: templates?.length || 8, label: t("portfolio.system") },
                { value: "6+", label: t("portfolio.sectors") },
                { value: "100%", label: t("portfolio.customizable") },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-black text-black">{stat.value}</div>
                  <div className="text-black/25 text-xs mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-3 bg-white/90 backdrop-blur-lg sticky top-0 z-30 border-b border-black/[0.04]">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Filter className="w-4 h-4 text-black/20 flex-shrink-0" />
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                data-testid={`filter-${cat}`}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === cat
                    ? "bg-black text-white font-semibold"
                    : "bg-black/[0.04] text-black/40 hover:bg-black/[0.08] hover:text-black/60"
                }`}
              >
                {catLabel(cat)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 container mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-black/30" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered?.map((template, idx) => {
              const Icon = IconMap[template.icon || "Globe"] || Globe;
              return (
                <motion.div
                  key={template.id}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={idx}
                >
                  <div
                    className="group p-6 rounded-2xl flex flex-col h-full border border-black/[0.06] bg-white hover:shadow-lg hover:shadow-black/[0.04] transition-all"
                    data-testid={`card-template-${template.slug}`}
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-black/[0.04]">
                        <Icon className="w-5 h-5 text-black/40" />
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-black/[0.03] text-black/35">
                        {catLabel(template.category)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold font-heading text-black mb-1">
                      {lang === "ar" ? template.nameAr : template.name}
                    </h3>
                    <p className="text-[10px] text-black/25 font-mono mb-3">
                      {lang === "ar" ? template.name : template.nameAr}
                    </p>
                    <p className="text-sm text-black/40 leading-relaxed mb-5 line-clamp-2 flex-1">
                      {lang === "ar" ? template.descriptionAr : template.description}
                    </p>

                    <div className="space-y-2 mb-5">
                      {(lang === "ar" ? template.featuresAr : template.features)?.slice(0, 3).map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-black/35">
                          <Check className="w-3 h-3 text-black/25 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                      {((lang === "ar" ? template.featuresAr : template.features)?.length || 0) > 3 && (
                        <div className="text-[10px] text-black/20">
                          +{((lang === "ar" ? template.featuresAr : template.features)?.length || 0) - 3} {t("portfolio.moreFeatures")}
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-black/[0.04]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-black/25">{t("portfolio.startFrom")}</span>
                        <span className="font-bold text-black text-sm">{template.priceMin?.toLocaleString()} <span className="text-black/35 text-xs">{template.currency}</span></span>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] text-black/25">{t("portfolio.duration")}</span>
                        <span className="text-xs text-black/35">{template.estimatedDuration}</span>
                      </div>
                      <div className="flex gap-2">
                        <Link href="/order" className="flex-1">
                          <Button className="w-full h-10 text-xs premium-btn rounded-xl" data-testid={`button-order-${template.slug}`}>
                            {t("portfolio.orderNow")}
                            <ArrowLeft className="w-3 h-3 mr-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      <section className="py-28 relative overflow-hidden bg-[#fafafa]">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold font-heading text-black mb-6">
            {t("portfolio.readyTitle")} <span className="text-gray-400">{t("portfolio.readyHighlight")}</span>
          </h2>
          <p className="text-black/35 text-lg max-w-2xl mx-auto mb-12">
            {t("portfolio.readySubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/order">
              <Button size="lg" className="premium-btn h-14 px-10 rounded-xl font-semibold" data-testid="button-start-project">
                {t("portfolio.startProject")}
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="h-14 px-10 border-black/[0.08] text-black/50 hover:text-black hover:bg-black/[0.03] rounded-xl font-semibold bg-transparent" data-testid="button-contact-us">
                {t("portfolio.contactUs")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
