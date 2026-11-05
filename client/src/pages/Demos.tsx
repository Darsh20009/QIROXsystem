import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import type { SectorTemplate } from "@shared/schema";
import {
  ArrowLeft, ArrowRight, Star,
  Clock, Zap, Search, Filter, Globe, ChevronLeft,
  ShoppingBag, UtensilsCrossed, GraduationCap, Building2, Home, Heart,
  Loader2, Sparkles, Package, Play, Video,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

function getCategoryMeta(L: boolean): Record<string, { label: string; icon: any; color: string; bg: string; border: string }> {
  return {
    restaurant:  { label: L ? "مطاعم ومقاهي" : "Restaurants & Cafes",    icon: UtensilsCrossed, color: "text-black dark:text-white", bg: "bg-black/[0.04] dark:bg-white/[0.06]", border: "border-black/10 dark:border-white/10" },
    food:        { label: L ? "مطاعم ومقاهي" : "Restaurants & Cafes",    icon: UtensilsCrossed, color: "text-black dark:text-white", bg: "bg-black/[0.04] dark:bg-white/[0.06]", border: "border-black/10 dark:border-white/10" },
    ecommerce:   { label: L ? "متاجر إلكترونية" : "E-Commerce",  icon: ShoppingBag,     color: "text-black dark:text-white",   bg: "bg-black/[0.04] dark:bg-white/[0.06]",   border: "border-black/10 dark:border-white/10" },
    education:   { label: L ? "منصات تعليمية" : "Education Platforms",    icon: GraduationCap,   color: "text-black dark:text-white", bg: "bg-black/[0.04] dark:bg-white/[0.06]", border: "border-black/10 dark:border-white/10" },
    corporate:   { label: L ? "شركات ومؤسسات" : "Corporate",    icon: Building2,       color: "text-slate-700",  bg: "bg-slate-50",  border: "border-slate-200" },
    realestate:  { label: L ? "عقارات" : "Real Estate",           icon: Home,            color: "text-black dark:text-white",   bg: "bg-black/[0.04] dark:bg-white/[0.06]",   border: "border-black/10 dark:border-white/10" },
    healthcare:  { label: L ? "صحة وعيادات" : "Healthcare",      icon: Heart,           color: "text-black dark:text-white",   bg: "bg-black/[0.04] dark:bg-white/[0.06]",   border: "border-black/10 dark:border-white/10" },
    health:      { label: L ? "صحة وعيادات" : "Healthcare",      icon: Heart,           color: "text-black dark:text-white",   bg: "bg-black/[0.04] dark:bg-white/[0.06]",   border: "border-black/10 dark:border-white/10" },
    beauty:      { label: L ? "صالونات تجميل" : "Beauty Salons",  icon: Globe,           color: "text-black dark:text-white",   bg: "bg-black/[0.04] dark:bg-white/[0.06]",   border: "border-black/10 dark:border-white/10" },
    general:     { label: L ? "عام" : "General",              icon: Globe,           color: "text-gray-700",   bg: "bg-gray-50",   border: "border-gray-200" },
  };
}

function getTierMeta(L: boolean): Record<string, { label: string; color: string; bg: string }> {
  return {
    lite:     { label: L ? "لايت" : "Lite",    color: "text-black dark:text-white",   bg: "bg-black/[0.04] dark:bg-white/[0.06]" },
    pro:      { label: L ? "برو" : "Pro",     color: "text-black dark:text-white", bg: "bg-black/[0.04] dark:bg-white/[0.06]" },
    infinite: { label: L ? "إنفينيت" : "Infinite", color: "text-black dark:text-white",  bg: "bg-black/[0.04] dark:bg-white/[0.06]" },
    custom:   { label: L ? "مخصص" : "Custom",   color: "text-gray-700",   bg: "bg-gray-50" },
  };
}

function TemplateCard({ template, index }: { template: SectorTemplate; index: number }) {
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const catMeta = getCategoryMeta(L);
  const cat = catMeta[template.category] || catMeta.general;
  const CatIcon = cat.icon;
  const color = template.heroColor || "#0f172a";
  const tierMeta = getTierMeta(L);
  const tier = template.tier ? tierMeta[template.tier] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      data-testid={`card-template-${template.id}`}
    >
      <Link href={`/templates/${template.slug}`}>
        <div className="bg-white dark:bg-gray-900 border border-black/[0.07] dark:border-white/[0.07] rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer h-full">
          {/* Color Banner */}
          <div className="relative h-32 overflow-hidden" style={{ backgroundColor: color }}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />

            {/* Category icon */}
            <div className="absolute top-4 right-4">
              <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                <CatIcon className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Status + Demo badges */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5">
              {template.status === "active" && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border border-black/10 dark:border-white/10">{L ? "متاح" : "Available"}</span>
              )}
              {template.status === "coming_soon" && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border border-black/10 dark:border-white/10">{L ? "قريباً" : "Coming Soon"}</span>
              )}
              {template.demoUrl && template.status === "active" && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/20 text-white border border-white/20 flex items-center gap-1">
                  <Play className="w-2.5 h-2.5" /> {L ? "ديمو" : "Demo"}
                </span>
              )}
              {template.howToUseVideoUrl && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/20 text-white border border-white/20 flex items-center gap-1">
                  <Video className="w-2.5 h-2.5" /> {L ? "فيديو" : "Video"}
                </span>
              )}
            </div>

            {/* Name */}
            <div className="absolute bottom-3 right-4 left-4">
              <h3 className="text-white font-black text-lg leading-tight drop-shadow-sm">{L ? template.nameAr : (template.name || template.nameAr)}</h3>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color} ${cat.border} mt-1 inline-block`}>
                {cat.label}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-5">
            {/* Description */}
            <p className="text-sm text-black/55 dark:text-white/55 leading-relaxed mb-4 line-clamp-2">
              {L ? (template.descriptionAr || template.description) : (template.description || template.descriptionAr)}
            </p>

            {/* Meta row */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              {template.estimatedDuration && (
                <span className="flex items-center gap-1.5 text-[11px] text-black/50 dark:text-white/50 bg-black/[0.03] dark:bg-white/[0.03] px-2.5 py-1 rounded-full border border-black/[0.04] dark:border-white/[0.04]">
                  <Clock className="w-3 h-3" />{template.estimatedDuration}
                </span>
              )}
              {template.featuresAr && template.featuresAr.length > 0 && (
                <span className="flex items-center gap-1.5 text-[11px] text-black/50 dark:text-white/50 bg-black/[0.03] dark:bg-white/[0.03] px-2.5 py-1 rounded-full border border-black/[0.04] dark:border-white/[0.04]">
                  <Zap className="w-3 h-3" />{template.featuresAr.length} {L ? "ميزة" : "features"}
                </span>
              )}
              {tier && (
                <span className={`flex items-center gap-1.5 text-[11px] font-bold ${tier.color} ${tier.bg} px-2.5 py-1 rounded-full`}>
                  <Package className="w-3 h-3" /> {tier.label}
                </span>
              )}
            </div>

            {/* CTA */}
            <div className="flex items-center justify-between pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
              <span className="text-xs font-bold text-black/40 dark:text-white/40 group-hover:text-black dark:group-hover:text-white transition-colors flex items-center gap-1">
                {L ? "عرض التفاصيل" : "View Details"}
                {L ? <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> : <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />}
              </span>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0"
                style={{ backgroundColor: color }}
              >
                {L ? <ArrowLeft className="w-4 h-4 text-white" /> : <ArrowRight className="w-4 h-4 text-white" />}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Demos() {
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: templates = [], isLoading } = useQuery<SectorTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const VISIBLE_SLUGS = ["ecommerce-store", "cafe-restaurant"];

  const activeTemplates = templates
    .filter(t => t.status !== "archived")
    .filter(t => VISIBLE_SLUGS.includes(t.slug));

  const categories = ["all", ...Array.from(new Set(activeTemplates.map(t => t.category)))];

  const filtered = activeTemplates.filter(t => {
    const matchCat = activeCategory === "all" || t.category === activeCategory;
    const matchSearch = !search || t.nameAr.includes(search) || t.name.toLowerCase().includes(search.toLowerCase()) || (t.descriptionAr || "").includes(search);
    return matchCat && matchSearch;
  }).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const withDemo = activeTemplates.filter(t => t.demoUrl && t.status === "active").length;

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-gray-950" dir={dir}>
      <Navigation />

      {/* Hero */}
      <div className="relative overflow-hidden bg-black pt-28 pb-20">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-black dark:bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black dark:bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-black/70 dark:text-white/70" />
            <span className="text-white/70 text-sm font-medium">{L ? "نماذج جاهزة ومجربة" : "Ready & Tested Templates"}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            {L ? <>اكتشف نماذج<br /></> : <>Discover<br /></>}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-black/[0.08] dark:from-white/[0.1] to-black/[0.08] dark:to-white/[0.1]">{L ? "مشاريع Qirox" : "Qirox Projects"}</span>
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto mb-8">
            {L ? "جرّب الأنظمة قبل الشراء — استعرض المميزات الكاملة لكل نظام واعرف كيف يناسب مشروعك" : "Try the systems before you buy — explore full features of each system and see how it fits your project"}
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-white/40 flex-wrap">
            <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-black/70 dark:text-white/70" />{withDemo} {L ? "نموذج حي" : "live demos"}</span>
            <span className="flex items-center gap-2"><Package className="w-4 h-4 text-black/70 dark:text-white/70" />{activeTemplates.length} {L ? "قالب" : "templates"}</span>
            <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-black/70 dark:text-white/70" />{L ? "تجربة مجانية" : "Free trial"}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 dark:text-white/30" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={L ? "ابحث عن نظام..." : "Search systems..."}
                className="w-full h-10 pr-9 pl-4 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] text-sm focus:outline-none focus:border-black/20 dark:focus:border-white/20"
                data-testid="input-search-demos"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {categories.map(cat => {
                const catMeta = getCategoryMeta(L);
                const meta = cat === "all" ? null : catMeta[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    data-testid={`filter-${cat}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap transition-all ${
                      activeCategory === cat
                        ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                        : "border-black/[0.08] dark:border-white/[0.08] text-black/50 dark:text-white/50 hover:border-black/20 dark:hover:border-white/20"
                    }`}
                  >
                    {meta ? <meta.icon className="w-3 h-3" /> : <Filter className="w-3 h-3" />}
                    {cat === "all" ? (L ? "الكل" : "All") : (meta?.label || cat)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-black/20 dark:text-white/20" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Globe className="w-16 h-16 mx-auto mb-4 text-black/10 dark:text-white/10" />
            <p className="text-black/40 dark:text-white/40 font-bold text-xl mb-2">{L ? "لا توجد نتائج" : "No Results"}</p>
            <p className="text-black/30 dark:text-white/30 text-sm">{L ? "جرّب تصفية مختلفة أو ابحث بكلمة أخرى" : "Try a different filter or search with another keyword"}</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-black/30 dark:text-white/30 mb-6 font-medium">{filtered.length} {L ? "نظام — اضغط على البطاقة لعرض تفاصيل النموذج" : "systems — click a card to view template details"}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((t, i) => (
                <TemplateCard key={t.id} template={t} index={i} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* CTA */}
      <div className="bg-black py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <Sparkles className="w-10 h-10 text-black/70 dark:text-white/70 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-white mb-3">{L ? "لم تجد ما تبحث عنه؟" : "Didn't find what you're looking for?"}</h2>
          <p className="text-white/40 mb-8">{L ? "نبني أنظمة مخصصة بالكامل حسب احتياج مشروعك" : "We build fully custom systems tailored to your project needs"}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/order">
              <Button className="h-12 px-8 rounded-2xl bg-white text-black hover:bg-white/90 font-bold text-base gap-2" data-testid="btn-start-project">
                <ArrowRight className="w-5 h-5" /> {L ? "ابدأ فكرتك الخاصة" : "Start Your Own Idea"}
              </Button>
            </Link>
            <Link href="/consultation">
              <Button variant="outline" className="h-12 px-8 rounded-2xl border-white/20 text-white hover:bg-white/10 font-bold text-base gap-2">
                <Star className="w-5 h-5" /> {L ? "احجز استشارة مجانية" : "Book a Free Consultation"}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
