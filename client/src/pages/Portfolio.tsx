import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useTemplates } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useState } from "react";
import {
  Loader2, ExternalLink, ArrowLeft, Check, Filter, ArrowUpRight,
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Globe
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
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }
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
    <div className="min-h-screen flex flex-col bg-[#F4F4F4]">
      <Navigation />

      <section className="pt-32 pb-20 bg-[#111111] text-white relative overflow-hidden">
        <div className="absolute inset-0 animated-grid-dark opacity-40" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.span variants={fadeUp} custom={0} className="inline-block text-white/40 text-sm font-medium tracking-widest uppercase mb-6">
              QIROX Systems
            </motion.span>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl lg:text-7xl font-black font-heading mb-6 tracking-tight">
              الأنظمة الجاهزة
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-white/40 text-lg max-w-2xl mx-auto leading-relaxed">
              {templates?.length || 8} أنظمة مبنية بمعايير SaaS عالمية. كل نظام قابل للتخصيص والتوسعة.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex items-center justify-center gap-12 mt-12">
              <div className="text-center">
                <div className="text-3xl font-black">{templates?.length || 8}</div>
                <div className="text-white/30 text-xs mt-1">نظام</div>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <div className="text-center">
                <div className="text-3xl font-black">6+</div>
                <div className="text-white/30 text-xs mt-1">قطاع</div>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <div className="text-center">
                <div className="text-3xl font-black">100%</div>
                <div className="text-white/30 text-xs mt-1">قابل للتخصيص</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#F4F4F4] to-transparent" />
      </section>

      <section className="py-4 bg-white border-b border-[#E0E0E0] sticky top-16 z-30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="w-4 h-4 text-black/30 flex-shrink-0" />
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                data-testid={`filter-${cat}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === cat
                    ? "bg-[#111111] text-white"
                    : "bg-[#F4F4F4] text-[#555555] hover:bg-[#EAEAEA]"
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
            <Loader2 className="w-8 h-8 animate-spin text-[#111111]" />
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
                    className="group p-5 rounded-xl bg-white border border-[#E0E0E0] hover:border-[#111111] transition-all duration-300 flex flex-col h-full"
                    data-testid={`card-template-${template.slug}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[#F4F4F4] flex items-center justify-center group-hover:bg-[#111111] group-hover:text-white transition-all">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#EAEAEA] text-[#555555]">
                        {categoryLabels[template.category] || template.category}
                      </span>
                    </div>

                    <h3 className="text-base font-bold font-heading text-[#111111] mb-1">{template.nameAr}</h3>
                    <p className="text-[10px] text-black/30 font-mono mb-3">{template.name}</p>
                    <p className="text-sm text-[#555555] leading-relaxed mb-4 line-clamp-2 flex-1">{template.descriptionAr}</p>

                    <div className="space-y-1.5 mb-4">
                      {template.featuresAr?.slice(0, 3).map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-[#555555]">
                          <Check className="w-3 h-3 text-[#111111] flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                      {(template.featuresAr?.length || 0) > 3 && (
                        <div className="text-[10px] text-black/30">
                          +{(template.featuresAr?.length || 0) - 3} ميزات أخرى
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-[#E0E0E0]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-black/30">يبدأ من</span>
                        <span className="font-bold text-[#111111] text-sm">{template.priceMin?.toLocaleString()} {template.currency}</span>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-black/30">المدة</span>
                        <span className="text-xs text-[#555555]">{template.estimatedDuration}</span>
                      </div>
                      <div className="flex gap-2">
                        <Link href="/order" className="flex-1">
                          <Button className="w-full h-9 text-xs bg-[#111111] hover:bg-[#2B2B2B] text-white rounded-lg" data-testid={`button-order-${template.slug}`}>
                            اطلب الآن
                            <ArrowLeft className="w-3 h-3 mr-1" />
                          </Button>
                        </Link>
                        {template.repoUrl && (
                          <a href={template.repoUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="icon" className="h-9 w-9 border-[#E0E0E0] hover:border-[#111111] rounded-lg" data-testid={`button-repo-${template.slug}`}>
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

      <section className="py-20 bg-[#111111] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-6">
            جاهز لبناء مشروعك؟
          </h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto mb-10">
            اختر النظام المناسب وابدأ بنيتك التحتية الرقمية.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/order">
              <Button size="lg" className="h-14 px-8 bg-white text-[#111111] hover:bg-white/90 rounded-xl font-semibold" data-testid="button-start-project">
                ابدأ مشروعك
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="h-14 px-8 border-white/20 text-white hover:bg-white/5 rounded-xl font-semibold" data-testid="button-contact-us">
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
