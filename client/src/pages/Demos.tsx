import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import type { SectorTemplate, FeatureDetail } from "@shared/schema";
import {
  Play, ChevronDown, ArrowRight, Star,
  Clock, Zap, Search, Filter, Globe, CheckCircle2,
  ShoppingBag, UtensilsCrossed, GraduationCap, Building2, Home, Heart,
  Loader2, Sparkles, ListChecks, Package, FileText, Video, Link2, ExternalLink, Users,
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

const statusBadge: Record<string, { label: string; style: string }> = {
  active:      { label: "متاح الآن", style: "bg-green-100 text-green-700 border-green-200" },
  coming_soon: { label: "قريباً",    style: "bg-amber-100 text-amber-700 border-amber-200" },
  archived:    { label: "مؤرشف",     style: "bg-gray-100 text-gray-500 border-gray-200" },
};

function FeatureCard({ fd, index }: { fd: FeatureDetail; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 text-right hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
        data-testid={`btn-feature-${index}`}
      >
        <span className="text-2xl flex-shrink-0">{fd.icon || "✨"}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-black dark:text-white">{fd.titleAr}</p>
        </div>
        <span className={`transition-transform flex-shrink-0 text-black/30 dark:text-white/30 ${open ? "rotate-180" : ""}`}>
          <ChevronDown className="w-4 h-4" />
        </span>
      </button>
      <AnimatePresence>
        {open && fd.descAr && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0">
              <div className="bg-black/[0.03] dark:bg-white/[0.03] rounded-xl p-3 border-r-2 border-black/20 dark:border-white/20">
                <p className="text-sm text-black/70 dark:text-white/70 leading-relaxed">{fd.descAr}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TemplateCard({ template, index }: { template: SectorTemplate; index: number }) {
  const [showFeatures, setShowFeatures] = useState(false);
  const cat = CATEGORY_META[template.category] || CATEGORY_META.general;
  const CatIcon = cat.icon;
  const status = statusBadge[template.status] || statusBadge.active;
  const hasDemoUrl = !!template.demoUrl;
  const hasDetails = !!(template.featuresDetails && template.featuresDetails.length > 0);
  const color = template.heroColor || "#0f172a";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="bg-white dark:bg-gray-900 border border-black/[0.07] dark:border-white/[0.07] rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 group"
      data-testid={`card-template-${template.id}`}
    >
      {/* Color Banner */}
      <div className="relative h-28 overflow-hidden" style={{ backgroundColor: color }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-4 right-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
            <CatIcon className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${status.style}`}>
            {status.label}
          </span>
        </div>
        <div className="absolute bottom-3 right-4">
          <h3 className="text-white font-black text-lg leading-tight drop-shadow-sm">{template.nameAr}</h3>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color} ${cat.border} mt-1 inline-block`}>
            {cat.labelAr}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Description */}
        <p className="text-sm text-black/60 dark:text-white/60 leading-relaxed mb-4">
          {template.descriptionAr || template.description}
        </p>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {template.estimatedDuration && (
            <span className="flex items-center gap-1.5 text-[11px] text-black/50 dark:text-white/50 bg-black/[0.03] dark:bg-white/[0.03] px-2.5 py-1 rounded-full">
              <Clock className="w-3 h-3" />{template.estimatedDuration}
            </span>
          )}
          {template.featuresAr && template.featuresAr.length > 0 && (
            <span className="flex items-center gap-1.5 text-[11px] text-black/50 dark:text-white/50 bg-black/[0.03] dark:bg-white/[0.03] px-2.5 py-1 rounded-full">
              <Zap className="w-3 h-3" />{template.featuresAr.length} ميزة
            </span>
          )}
        </div>

        {/* Features Summary */}
        {template.featuresAr && template.featuresAr.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1.5">
              {template.featuresAr.slice(0, 5).map((f, i) => (
                <span key={i} className="flex items-center gap-1 text-[11px] text-black/60 dark:text-white/60 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-2.5 h-2.5 text-green-600 dark:text-green-400 flex-shrink-0" /> {f}
                </span>
              ))}
              {template.featuresAr.length > 5 && (
                <span className="text-[11px] text-black/40 dark:text-white/40 px-2 py-0.5">+{template.featuresAr.length - 5}</span>
              )}
            </div>
          </div>
        )}

        {/* Feature Details Toggle */}
        {hasDetails && (
          <div className="mb-4">
            <button
              onClick={() => setShowFeatures(v => !v)}
              className="flex items-center gap-2 text-xs font-bold text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors w-full py-2 border-t border-black/[0.04] dark:border-white/[0.04]"
              data-testid={`btn-toggle-features-${template.id}`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              {showFeatures ? "إخفاء" : "عرض"} دليل المميزات ({template.featuresDetails!.length})
              <ChevronDown className={`w-3.5 h-3.5 mr-auto transition-transform ${showFeatures ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showFeatures && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-2">
                    {template.featuresDetails!.map((fd, i) => (
                      <FeatureCard key={i} fd={fd} index={i} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
          {hasDemoUrl && template.status === "active" ? (
            <a href={template.demoUrl} target="_blank" rel="noopener noreferrer" className="flex-1" data-testid={`btn-live-demo-${template.id}`}>
              <Button className="w-full h-10 rounded-xl font-bold gap-2 text-sm" style={{ backgroundColor: color }}>
                <Play className="w-4 h-4" /> جرّب الديمو
              </Button>
            </a>
          ) : (
            <Button disabled className="flex-1 h-10 rounded-xl font-bold gap-2 text-sm opacity-70">
              <Globe className="w-4 h-4" /> {template.status === "coming_soon" ? "قريباً" : "الديمو غير متاح"}
            </Button>
          )}
          <Link href={`/order?template=${template.slug}`}>
            <Button variant="outline" className="h-10 rounded-xl font-bold gap-2 text-sm border-black/[0.08] dark:border-white/[0.08] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all" data-testid={`btn-order-${template.id}`}>
              <ArrowRight className="w-4 h-4" /> ابدأ مشروعك
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

interface EmployeePortfolioItem {
  _id: string;
  title: string;
  type: "template" | "file" | "video";
  url: string;
  description: string;
  employeeName: string;
  employeeJobTitle: string;
  employeeAvatarUrl: string;
}

const PORTFOLIO_TYPE_CONFIG = {
  template: { label: "نموذج",  icon: FileText, color: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-900/20",   border: "border-blue-200 dark:border-blue-700",   badge: "bg-blue-100 text-blue-700" },
  file:     { label: "ملف",    icon: Link2,    color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-700", badge: "bg-purple-100 text-purple-700" },
  video:    { label: "فيديو",  icon: Video,    color: "text-red-500",    bg: "bg-red-50 dark:bg-red-900/20",     border: "border-red-200 dark:border-red-700",     badge: "bg-red-100 text-red-700" },
};

export default function Demos() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: templates = [], isLoading } = useQuery<SectorTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const { data: employeeItems = [] } = useQuery<EmployeePortfolioItem[]>({
    queryKey: ["/api/public/employee-portfolio"],
    staleTime: 5 * 60 * 1000,
  });

  const activeTemplates = templates.filter(t => t.status !== "archived" && !!t.demoUrl);

  const categories = ["all", ...Array.from(new Set(activeTemplates.map(t => t.category)))];

  const filtered = activeTemplates.filter(t => {
    const matchCat = activeCategory === "all" || t.category === activeCategory;
    const matchSearch = !search || t.nameAr.includes(search) || t.name.toLowerCase().includes(search.toLowerCase()) || (t.descriptionAr || "").includes(search);
    return matchCat && matchSearch;
  }).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const totalWithDemo = activeTemplates.length;

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-gray-950" dir="rtl">
      <Navigation />

      {/* Hero */}
      <div className="relative overflow-hidden bg-black pt-28 pb-20">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }}>
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
            <div className="flex items-center justify-center gap-6 text-sm text-white/40">
              <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-green-400" />{totalWithDemo} نموذج حي متاح</span>
              <span className="flex items-center gap-2"><Package className="w-4 h-4 text-blue-400" />{activeTemplates.length} قالب</span>
              <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-violet-400" />تجربة مجانية</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Search */}
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
            {/* Category filter */}
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
            <p className="text-xs text-black/30 dark:text-white/30 mb-6 font-medium">{filtered.length} نظام</p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((t, i) => (
                <TemplateCard key={t.id} template={t} index={i} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Employee Portfolio Section */}
      {employeeItems.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 pb-12">
          <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-black dark:bg-white rounded-2xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white dark:text-black" />
              </div>
              <div>
                <h2 className="text-xl font-black text-black dark:text-white">أعمال فريقنا</h2>
                <p className="text-xs text-black/40 dark:text-white/40">نماذج وملفات وفيديوهات أضافها أعضاء الفريق</p>
              </div>
              <span className="mr-auto text-xs text-black/30 dark:text-white/30 bg-black/[0.04] dark:bg-white/[0.04] px-3 py-1 rounded-full">
                {employeeItems.length} عنصر
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {employeeItems.map((item, i) => {
                const cfg = PORTFOLIO_TYPE_CONFIG[item.type] || PORTFOLIO_TYPE_CONFIG.template;
                const Icon = cfg.icon;
                return (
                  <motion.a
                    key={item._id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`group relative flex flex-col rounded-2xl border p-4 hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-900 ${cfg.border}`}
                    data-testid={`emp-portfolio-${item._id}`}
                  >
                    {/* Type badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-black/20 dark:text-white/20 group-hover:text-black/60 dark:group-hover:text-white/60 transition-colors" />
                    </div>

                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${cfg.bg}`}>
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                    </div>

                    {/* Title + desc */}
                    <p className="font-bold text-sm text-black dark:text-white mb-1 leading-tight line-clamp-2">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-black/40 dark:text-white/40 mb-3 line-clamp-2">{item.description}</p>
                    )}

                    {/* Employee */}
                    <div className="mt-auto pt-3 border-t border-black/[0.05] dark:border-white/[0.05] flex items-center gap-2">
                      {item.employeeAvatarUrl ? (
                        <img src={item.employeeAvatarUrl} alt={item.employeeName}
                          className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center flex-shrink-0 text-[10px] font-black text-black/40 dark:text-white/40">
                          {item.employeeName.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-black/60 dark:text-white/60 truncate">{item.employeeName}</p>
                        {item.employeeJobTitle && (
                          <p className="text-[10px] text-black/30 dark:text-white/30 truncate">{item.employeeJobTitle}</p>
                        )}
                      </div>
                    </div>
                  </motion.a>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
