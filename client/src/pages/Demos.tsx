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

const CATEGORY_META: Record<string, { labelAr: string; icon: any; color: string; bg: string; border: string }> = {
  restaurant:  { labelAr: "مطاعم ومقاهي",    icon: UtensilsCrossed, color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  ecommerce:   { labelAr: "متاجر إلكترونية",  icon: ShoppingBag,     color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200" },
  education:   { labelAr: "منصات تعليمية",    icon: GraduationCap,   color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
  corporate:   { labelAr: "شركات ومؤسسات",    icon: Building2,       color: "text-slate-700",  bg: "bg-slate-50",  border: "border-slate-200" },
  realestate:  { labelAr: "عقارات",           icon: Home,            color: "text-teal-700",   bg: "bg-teal-50",   border: "border-teal-200" },
  healthcare:  { labelAr: "صحة وعيادات",      icon: Heart,           color: "text-rose-700",   bg: "bg-rose-50",   border: "border-rose-200" },
  general:     { labelAr: "عام",              icon: Globe,           color: "text-gray-700",   bg: "bg-gray-50",   border: "border-gray-200" },
};

const TIER_META: Record<string, { label: string; color: string; bg: string }> = {
  lite:     { label: "لايت",    color: "text-blue-700",   bg: "bg-blue-50" },
  pro:      { label: "برو",     color: "text-violet-700", bg: "bg-violet-50" },
  infinite: { label: "إنفينيت", color: "text-amber-700",  bg: "bg-amber-50" },
  custom:   { label: "مخصص",   color: "text-gray-700",   bg: "bg-gray-50" },
};

function TemplateCard({ template, index }: { template: SectorTemplate; index: number }) {
  const cat = CATEGORY_META[template.category] || CATEGORY_META.general;
  const CatIcon = cat.icon;
  const color = template.heroColor || "#0f172a";
  const tier = template.tier ? TIER_META[template.tier] : null;

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
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">متاح</span>
              )}
              {template.status === "coming_soon" && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">قريباً</span>
              )}
              {template.demoUrl && template.status === "active" && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/20 text-white border border-white/20 flex items-center gap-1">
                  <Play className="w-2.5 h-2.5" /> ديمو
                </span>
              )}
              {template.howToUseVideoUrl && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/20 text-white border border-white/20 flex items-center gap-1">
                  <Video className="w-2.5 h-2.5" /> فيديو
                </span>
              )}
            </div>

            {/* Name */}
            <div className="absolute bottom-3 right-4 left-4">
              <h3 className="text-white font-black text-lg leading-tight drop-shadow-sm">{template.nameAr}</h3>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color} ${cat.border} mt-1 inline-block`}>
                {cat.labelAr}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-5">
            {/* Description */}
            <p className="text-sm text-black/55 dark:text-white/55 leading-relaxed mb-4 line-clamp-2">
              {template.descriptionAr || template.description}
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
                  <Zap className="w-3 h-3" />{template.featuresAr.length} ميزة
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
                عرض التفاصيل
                <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              </span>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0"
                style={{ backgroundColor: color }}
              >
                <ArrowLeft className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Demos() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: templates = [], isLoading } = useQuery<SectorTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const CAFE_ONLY = true; // Set to false when other templates are ready

  const activeTemplates = templates
    .filter(t => t.status !== "archived")
    .filter(t => !CAFE_ONLY || t.category === "restaurant" || t.category === "food" || t.slug === "cafe-restaurant");

  const categories = ["all", ...Array.from(new Set(activeTemplates.map(t => t.category)))];

  const filtered = activeTemplates.filter(t => {
    const matchCat = activeCategory === "all" || t.category === activeCategory;
    const matchSearch = !search || t.nameAr.includes(search) || t.name.toLowerCase().includes(search.toLowerCase()) || (t.descriptionAr || "").includes(search);
    return matchCat && matchSearch;
  }).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const withDemo = activeTemplates.filter(t => t.demoUrl && t.status === "active").length;

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-gray-950" dir="rtl">
      <Navigation />

      {/* Hero */}
      <div className="relative overflow-hidden bg-black pt-28 pb-20">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-white/70 text-sm font-medium">نماذج جاهزة ومجربة</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            اكتشف نماذج<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">مشاريع Qirox</span>
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto mb-8">
            جرّب الأنظمة قبل الشراء — استعرض المميزات الكاملة لكل نظام واعرف كيف يناسب مشروعك
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-white/40 flex-wrap">
            <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-green-400" />{withDemo} نموذج حي</span>
            <span className="flex items-center gap-2"><Package className="w-4 h-4 text-blue-400" />{activeTemplates.length} قالب</span>
            <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-violet-400" />تجربة مجانية</span>
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
                placeholder="ابحث عن نظام..."
                className="w-full h-10 pr-9 pl-4 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] text-sm focus:outline-none focus:border-black/20 dark:focus:border-white/20"
                data-testid="input-search-demos"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {categories.map(cat => {
                const meta = cat === "all" ? null : CATEGORY_META[cat];
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
                    {cat === "all" ? "الكل" : (meta?.labelAr || cat)}
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
            <p className="text-black/40 dark:text-white/40 font-bold text-xl mb-2">لا توجد نتائج</p>
            <p className="text-black/30 dark:text-white/30 text-sm">جرّب تصفية مختلفة أو ابحث بكلمة أخرى</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-black/30 dark:text-white/30 mb-6 font-medium">{filtered.length} نظام — اضغط على البطاقة لعرض تفاصيل النموذج</p>
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
          <Sparkles className="w-10 h-10 text-violet-400 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-white mb-3">لم تجد ما تبحث عنه؟</h2>
          <p className="text-white/40 mb-8">نبني أنظمة مخصصة بالكامل حسب احتياج مشروعك</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/order">
              <Button className="h-12 px-8 rounded-2xl bg-white text-black hover:bg-white/90 font-bold text-base gap-2" data-testid="btn-start-project">
                <ArrowRight className="w-5 h-5" /> ابدأ مشروعك الآن
              </Button>
            </Link>
            <Link href="/consultation">
              <Button variant="outline" className="h-12 px-8 rounded-2xl border-white/20 text-white hover:bg-white/10 font-bold text-base gap-2">
                <Star className="w-5 h-5" /> احجز استشارة مجانية
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
