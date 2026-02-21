import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useTemplates } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useState } from "react";
import {
  Loader2, ExternalLink, ArrowLeft, Check, ArrowUpRight,
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Globe, Layers, Filter
} from "lucide-react";

const IconMap: Record<string, any> = {
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Globe
};

const categoryLabels: Record<string, string> = {
  all: "الكل",
  education: "التعليم",
  health: "الصحة واللياقة",
  personal: "شخصي",
  institutional: "مؤسسي",
  commerce: "تجارة إلكترونية",
  food: "مطاعم وكافيهات",
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

  const categories = ["all", ...Array.from(new Set(templates?.map(t => t.category) || []))];
  const filtered = activeFilter === "all"
    ? templates
    : templates?.filter(t => t.category === activeFilter);

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0F]">
      <Navigation />

      <section className="pt-36 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-40" />
        <div className="absolute inset-0 animated-grid-dark opacity-20" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 mb-6">
              <Layers className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span className="text-white/40 text-xs tracking-wider uppercase">Portfolio</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl lg:text-7xl font-black font-heading text-white mb-6 tracking-tight">
              الأنظمة <span className="text-gradient">الجاهزة</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-white/30 text-lg max-w-2xl mx-auto leading-relaxed">
              {templates?.length || 8} أنظمة مبنية بمعايير SaaS عالمية. كل نظام قابل للتخصيص والتوسعة.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex items-center justify-center gap-12 mt-14">
              {[
                { value: templates?.length || 8, label: "نظام" },
                { value: "6+", label: "قطاع" },
                { value: "100%", label: "قابل للتخصيص" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-black text-white">{stat.value}</div>
                  <div className="text-white/20 text-xs mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0A0A0F] to-transparent" />
      </section>

      <section className="py-3 glass sticky top-0 z-30 border-b border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Filter className="w-4 h-4 text-white/20 flex-shrink-0" />
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                data-testid={`filter-${cat}`}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === cat
                    ? "bg-[#00D4FF] text-[#0A0A0F] font-semibold"
                    : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70"
                }`}
              >
                {categoryLabels[cat] || cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 container mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#00D4FF]" />
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
                    className="glass-card group p-6 rounded-2xl flex flex-col h-full"
                    data-testid={`card-template-${template.slug}`}
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 group-hover:bg-[#00D4FF]/10 transition-all duration-500">
                        <Icon className="w-5 h-5 text-white/40 group-hover:text-[#00D4FF] transition-colors duration-500" />
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 text-white/30">
                        {categoryLabels[template.category] || template.category}
                      </span>
                    </div>

                    <h3 className="text-base font-bold font-heading text-white mb-1">{template.nameAr}</h3>
                    <p className="text-[10px] text-white/20 font-mono mb-3">{template.name}</p>
                    <p className="text-sm text-white/30 leading-relaxed mb-5 line-clamp-2 flex-1">{template.descriptionAr}</p>

                    <div className="space-y-2 mb-5">
                      {template.featuresAr?.slice(0, 3).map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-white/30">
                          <Check className="w-3 h-3 text-[#00D4FF]/60 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                      {(template.featuresAr?.length || 0) > 3 && (
                        <div className="text-[10px] text-white/15">
                          +{(template.featuresAr?.length || 0) - 3} ميزات أخرى
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-white/20">يبدأ من</span>
                        <span className="font-bold text-white text-sm">{template.priceMin?.toLocaleString()} <span className="text-white/30 text-xs">{template.currency}</span></span>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] text-white/20">المدة</span>
                        <span className="text-xs text-white/30">{template.estimatedDuration}</span>
                      </div>
                      <div className="flex gap-2">
                        <Link href="/order" className="flex-1">
                          <Button className="w-full h-10 text-xs premium-btn rounded-xl" data-testid={`button-order-${template.slug}`}>
                            اطلب الآن
                            <ArrowLeft className="w-3 h-3 mr-1" />
                          </Button>
                        </Link>
                        {template.repoUrl && (
                          <a href={template.repoUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="icon" className="h-10 w-10 border-white/10 text-white/30 hover:text-white hover:bg-white/5 rounded-xl bg-transparent" data-testid={`button-repo-${template.slug}`}>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold font-heading text-white mb-6">
            جاهز لبناء <span className="text-gradient">مشروعك</span>؟
          </h2>
          <p className="text-white/30 text-lg max-w-2xl mx-auto mb-12">
            اختر النظام المناسب وابدأ بنيتك التحتية الرقمية.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/order">
              <Button size="lg" className="premium-btn h-14 px-10 rounded-xl font-semibold" data-testid="button-start-project">
                ابدأ مشروعك
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="h-14 px-10 border-white/10 text-white/60 hover:text-white hover:bg-white/5 rounded-xl font-semibold bg-transparent" data-testid="button-contact-us">
                تواصل معنا
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
