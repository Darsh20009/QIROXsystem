import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import {
  Loader2, Check, ShoppingCart, Sparkles, ArrowLeft, Globe, ShoppingBag,
  Utensils, Building2, GraduationCap, Briefcase, Server, Dumbbell, Coffee,
  ChevronDown, Plus, Package, Info, Database, Cloud, Mail, Gift, Cpu,
  ArrowRight, CheckCircle2, Star, Layers, X, ZapIcon, Upload,
  Zap, Infinity, Crown, Home, Heart, UtensilsCrossed, Tag, ChevronLeft
} from "lucide-react";
import { usePricingPlans } from "@/hooks/use-templates";
import type { QiroxProduct } from "@shared/schema";

/* ── Packages section helpers ───────────────────────────────────────────── */
type BillingPeriod = "monthly" | "sixmonth" | "annual" | "lifetime";

const PKG_PERIODS: { key: BillingPeriod; label: string; badge?: string }[] = [
  { key: "monthly",  label: "شهري" },
  { key: "sixmonth", label: "نصف سنوي", badge: "وفّر 30%" },
  { key: "annual",   label: "سنوي",     badge: "الأوفر" },
  { key: "lifetime", label: "مدى الحياة", badge: "∞" },
];

const PKG_SEGMENTS = [
  { key: "restaurant",  labelAr: "مطاعم",   icon: UtensilsCrossed, grad: "from-orange-500 to-red-500",    bg: "bg-orange-50",   text: "text-orange-600", border: "border-orange-200" },
  { key: "ecommerce",   labelAr: "متاجر",   icon: ShoppingBag,     grad: "from-blue-500 to-cyan-500",     bg: "bg-blue-50",     text: "text-blue-600",   border: "border-blue-200" },
  { key: "education",   labelAr: "تعليم",   icon: GraduationCap,   grad: "from-violet-500 to-purple-500", bg: "bg-violet-50",   text: "text-violet-600", border: "border-violet-200" },
  { key: "corporate",   labelAr: "شركات",   icon: Building2,       grad: "from-slate-600 to-gray-700",    bg: "bg-slate-50",    text: "text-slate-600",  border: "border-slate-200" },
  { key: "realestate",  labelAr: "عقارات",  icon: Home,            grad: "from-teal-500 to-emerald-500",  bg: "bg-teal-50",     text: "text-teal-600",   border: "border-teal-200" },
  { key: "healthcare",  labelAr: "صحة",     icon: Heart,           grad: "from-rose-500 to-pink-500",     bg: "bg-rose-50",     text: "text-rose-600",   border: "border-rose-200" },
];

const PKG_TIERS: Record<string, { label: string; icon: any; grad: string; border: string; dark?: boolean }> = {
  lite:     { label: "لايت",     icon: Zap,      grad: "from-teal-500 to-emerald-500",   border: "border-teal-200/70" },
  pro:      { label: "برو",      icon: Star,     grad: "from-violet-600 to-purple-500",  border: "border-violet-300/70" },
  infinite: { label: "إنفينتي", icon: Infinity,  grad: "from-gray-800 to-black",         border: "border-black/25", dark: true },
};

function pkgPrice(plan: any, period: BillingPeriod) {
  if (period === "monthly")  return plan.monthlyPrice  ?? 0;
  if (period === "sixmonth") return plan.sixMonthPrice ?? 0;
  if (period === "annual")   return plan.annualPrice   ?? 0;
  return plan.lifetimePrice ?? plan.price ?? 0;
}
function pkgSuffix(period: BillingPeriod) {
  if (period === "monthly")  return "/ شهر";
  if (period === "sixmonth") return "/ 6 أشهر";
  if (period === "annual")   return "/ سنة";
  return "";
}

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  priceMin?: number;
  priceMax?: number;
  estimatedDuration?: string;
  features?: string[];
  icon?: string;
}

const categoryConfig: Record<string, { label: string; icon: any; gradient: string; color: string; lightBg: string }> = {
  stores: { label: "المتاجر الإلكترونية", icon: ShoppingBag, gradient: "from-amber-500 to-orange-600", color: "text-amber-600", lightBg: "bg-amber-50" },
  restaurants: { label: "المطاعم والكافيهات", icon: Utensils, gradient: "from-red-500 to-pink-600", color: "text-red-600", lightBg: "bg-red-50" },
  education: { label: "المنصات التعليمية", icon: GraduationCap, gradient: "from-blue-500 to-indigo-600", color: "text-blue-600", lightBg: "bg-blue-50" },
  health: { label: "الصحة واللياقة", icon: Dumbbell, gradient: "from-green-500 to-teal-600", color: "text-green-600", lightBg: "bg-green-50" },
  personal: { label: "المواقع الشخصية", icon: Briefcase, gradient: "from-violet-500 to-purple-600", color: "text-violet-600", lightBg: "bg-violet-50" },
  institutions: { label: "الشركات والمؤسسات", icon: Building2, gradient: "from-slate-600 to-gray-800", color: "text-slate-600", lightBg: "bg-slate-50" },
  food: { label: "منظومات الطعام", icon: Coffee, gradient: "from-yellow-500 to-amber-600", color: "text-yellow-600", lightBg: "bg-yellow-50" },
};

const storeFeatures = [
  "بانر رئيسي متحرك وكاروسيل عروض",
  "تصفح المنتجات مع فلاتر ذكية",
  "سلة تسوق متقدمة + نظام كوبونات",
  "صفحة تفاصيل المنتج مع صور متعددة",
  "متغيرات المنتج (لون، مقاس، SKU)",
  "تقارير المبيعات والمنتجات الأكثر مبيعاً",
  "إدارة المخزون والفروع",
  "نقطة بيع POS متكاملة",
  "فواتير ضريبية متوافقة مع ZATCA",
  "ربط Apple Pay وطرق دفع متعددة",
];

const restaurantFeatures = [
  "قائمة رقمية بالفئات والمنتجات",
  "طلب عبر QR Code على الطاولة",
  "شاشة المطبخ KDS للطلبات الفورية",
  "نظام Takeaway وتوصيل مع تتبع",
  "إدارة الطاولات والحجوزات",
  "نظام ولاء وبطاقات رقمية",
  "تقارير الأداء والمبيعات اليومية",
  "نقطة بيع كاشير متكاملة",
  "تحليلات أوقات الذروة والمنتجات",
];

const serviceFeaturesMap: Record<string, string[]> = {
  stores: storeFeatures,
  food: restaurantFeatures,
  restaurants: restaurantFeatures,
};

const customizableCategories = ["education", "institutions", "health", "personal"];
const isCustomizable = (category: string) => customizableCategories.includes(category);

const mongoTiers = [
  { id: "M0", name: "M0 Free", price: 0, storage: "512 MB", note: "تطوير فقط", badge: "" },
  { id: "M2", name: "M2 Shared", price: 9, storage: "2 GB", note: "مشاريع صغيرة", badge: "" },
  { id: "M10", name: "M10 Dedicated", price: 57, storage: "10 GB", note: "إنتاج — موصى به", badge: "موصى به" },
  { id: "M20", name: "M20 Dedicated", price: 140, storage: "20 GB", note: "مشاريع متقدمة", badge: "" },
  { id: "M30", name: "M30 Dedicated", price: 410, storage: "40 GB", note: "حجم تجاري كبير", badge: "" },
];

const awsTiers = [
  { id: "t3.micro", name: "t3.micro", price: 8, cpu: "2 vCPU", ram: "1 GB", note: "اختبار" },
  { id: "t3.medium", name: "t3.medium", price: 33, cpu: "2 vCPU", ram: "4 GB", note: "مواقع متوسطة" },
  { id: "t3.large", name: "t3.large", price: 66, cpu: "2 vCPU", ram: "8 GB", note: "موصى به للإنتاج", badge: "موصى به" },
  { id: "m5.large", name: "m5.large", price: 96, cpu: "2 vCPU", ram: "8 GB", note: "أداء محسّن" },
  { id: "c5.xlarge", name: "c5.xlarge", price: 170, cpu: "4 vCPU", ram: "8 GB", note: "مشاريع مكثفة" },
];

const emailPlans = [
  { id: "basic", name: "أساسي", price: 35, accounts: 1, storage: "15 GB" },
  { id: "business", name: "أعمال", price: 99, accounts: 5, storage: "50 GB", badge: "الأكثر طلباً" },
  { id: "enterprise", name: "مؤسسي", price: 249, accounts: 25, storage: "250 GB" },
];

export default function Services() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [selectedCat, setSelectedCat] = useState("all");

  /* Packages state */
  const [pkgSegment, setPkgSegment] = useState("restaurant");
  const [pkgPeriod, setPkgPeriod]   = useState<BillingPeriod>("monthly");

  /* Required docs state (per selected service) */
  const [logoFile,       setLogoFile]       = useState<{ url: string; filename: string } | null>(null);
  const [licenseFile,    setLicenseFile]    = useState<{ url: string; filename: string } | null>(null);
  const [docsUploading,  setDocsUploading]  = useState<"logo" | "license" | null>(null);
  const [svcPeriod,      setSvcPeriod]      = useState<BillingPeriod>("monthly");

  /* Reset docs when service selection changes */
  useEffect(() => {
    setLogoFile(null);
    setLicenseFile(null);
    setSvcPeriod("monthly");
  }, [selectedServiceId]);

  /* Category → Segment mapping */
  const CAT_TO_SEGMENT: Record<string, string> = {
    restaurants: "restaurant", food: "restaurant",
    stores: "ecommerce",
    education: "education",
    institutions: "corporate", personal: "corporate",
    health: "healthcare",
  };

  const { data: services, isLoading } = useQuery<Service[]>({ queryKey: ["/api/services"] });
  const { data: products } = useQuery<QiroxProduct[]>({ queryKey: ["/api/products"] });
  const { data: plans } = usePricingPlans();

  const tierOrder: Record<string, number> = { lite: 1, pro: 2, infinite: 3 };
  const tierPlans = (plans as any[])?.filter(
    (p: any) => p.segment === pkgSegment && ["lite","pro","infinite"].includes(p.tier ?? "")
  ).sort((a: any, b: any) => (tierOrder[a.tier ?? ""] ?? 9) - (tierOrder[b.tier ?? ""] ?? 9)) ?? [];

  /* Plans for selected service (derived from service category) */
  const svcSegment   = selectedServiceId ? (CAT_TO_SEGMENT[services?.find(s => s.id === selectedServiceId)?.category || ""] || "") : "";
  const svcTierPlans = (plans as any[])?.filter(
    (p: any) => p.segment === svcSegment && ["lite","pro","infinite"].includes(p.tier ?? "")
  ).sort((a: any, b: any) => (tierOrder[a.tier ?? ""] ?? 9) - (tierOrder[b.tier ?? ""] ?? 9)) ?? [];

  /* Upload helper for required docs */
  const uploadDoc = async (file: File, field: "logo" | "license") => {
    if (!user) { setLocation("/login"); return; }
    setDocsUploading(field);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (field === "logo")    setLogoFile(data);
      if (field === "license") setLicenseFile(data);
      toast({ title: field === "logo" ? "✓ تم رفع الشعار" : "✓ تم رفع السجل التجاري" });
    } catch {
      toast({ title: "فشل رفع الملف", variant: "destructive" });
    } finally {
      setDocsUploading(null);
    }
  };

  const addToCartMutation = useMutation({
    mutationFn: async (item: any) => {
      const res = await apiRequest("POST", "/api/cart/items", item);
      return res.json();
    },
    onSuccess: (_, item) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      const key = item.refId || item.name;
      setAddedIds(prev => new Set([...prev, key]));
      toast({ title: `✓ أُضيف للسلة` });
    },
    onError: () => toast({ title: "يجب تسجيل الدخول أولاً", variant: "destructive" }),
  });

  const addService = (service: Service) => {
    if (!user) { sessionStorage.setItem("returnAfterLogin", "/services"); setLocation("/login"); return; }
    const key = `service-${service.id}`;
    addToCartMutation.mutate({
      type: 'service', refId: service.id, name: service.title, nameAr: service.title,
      price: service.priceMin || 0, qty: 1,
      config: {
        category: service.category,
        duration: service.estimatedDuration,
        logoUrl:      logoFile?.url || null,
        logoFilename: logoFile?.filename || null,
        licenseUrl:      licenseFile?.url || null,
        licenseFilename: licenseFile?.filename || null,
      },
    });
  };

  const addProduct = (p: QiroxProduct) => {
    if (!user) { sessionStorage.setItem("returnAfterLogin", "/services"); setLocation("/login"); return; }
    addToCartMutation.mutate({
      type: p.category === 'domain' ? 'domain' : p.category === 'email' ? 'email' : p.category === 'hosting' ? 'hosting' : p.category === 'gift' ? 'gift' : 'product',
      refId: p.id, name: p.name, nameAr: p.nameAr, price: p.price, qty: 1,
      imageUrl: p.images?.[0], config: p.specs,
    });
  };

  const addInfra = (item: any) => {
    if (!user) { sessionStorage.setItem("returnAfterLogin", "/services"); setLocation("/login"); return; }
    addToCartMutation.mutate(item);
  };

  const categories = [...new Set(services?.map(s => s.category) || [])];
  const filtered = services?.filter(s => selectedCat === "all" || s.category === selectedCat) || [];
  const selectedService = services?.find(s => s.id === selectedServiceId);
  const relatedProducts = selectedService
    ? products?.filter(p => p.isActive && (
        (p.serviceSlug && selectedService.title.toLowerCase().includes(p.serviceSlug.toLowerCase())) ||
        (p.serviceSlug && p.serviceSlug.toLowerCase().includes(selectedService.category.toLowerCase()))
      )) || []
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-white" dir="rtl">
      <Navigation />

      {/* Hero */}
      <section className="pt-36 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] bg-black/[0.02] mb-5">
              <Sparkles className="w-3.5 h-3.5 text-black/40" />
              <span className="text-black/40 text-xs tracking-wider">مصنع الأنظمة الرقمية</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black font-heading text-black mb-4">خدماتنا</h1>
            <p className="text-black/40 text-xl max-w-2xl mx-auto leading-relaxed">
              اختر نظامك الرقمي، أضف البنية التحتية، واطلق مشروعك
            </p>
          </motion.div>

          {/* Steps */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-center justify-center gap-3 mb-10">
            {[
              { n: "١", label: "اختر الخدمة" },
              { n: "→", label: "" },
              { n: "٢", label: "أضف المنتجات" },
              { n: "→", label: "" },
              { n: "٣", label: "أتمم الطلب" },
            ].map((s, i) =>
              s.n === "→" ? (
                <ArrowLeft key={i} className="w-4 h-4 text-black/20 rotate-180" />
              ) : (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border ${selectedServiceId ? 'bg-black text-white border-black' : 'bg-white text-black/40 border-black/[0.12]'}`}>{s.n}</div>
                  <span className="text-xs text-black/40 hidden sm:block">{s.label}</span>
                </div>
              )
            )}
          </motion.div>

          {/* Category Filter */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex flex-wrap justify-center gap-2">
            <button onClick={() => { setSelectedCat("all"); setSelectedServiceId(null); }}
              className={`px-5 py-2 rounded-full text-sm font-medium border transition-all ${selectedCat === "all" ? 'bg-black text-white border-black' : 'bg-white text-black/60 border-black/[0.08] hover:border-black/20'}`}>
              الكل ({services?.length || 0})
            </button>
            {categories.map(cat => {
              const cfg = categoryConfig[cat];
              if (!cfg) return null;
              return (
                <button key={cat} onClick={() => { setSelectedCat(cat); setSelectedServiceId(null); }}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium border transition-all ${selectedCat === cat ? 'bg-black text-white border-black' : 'bg-white text-black/60 border-black/[0.08] hover:border-black/20'}`}>
                  <cfg.icon className="w-3.5 h-3.5" />
                  {cfg.label}
                </button>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── PACKAGES SECTION ─────────────────────────────────────────────── */}
      <section className="pb-16 container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.03] border border-black/[0.06] mb-3">
              <Tag className="w-3 h-3 text-black/35" />
              <span className="text-[11px] text-black/40 tracking-widest uppercase font-semibold">الباقات الجاهزة</span>
            </div>
            <h2 className="text-2xl font-black text-black font-heading">اختر باقتك المناسبة</h2>
            <p className="text-black/40 text-sm mt-1">أنظمة متكاملة بأسعار ثابتة — اختر القطاع والمستوى</p>
          </div>
          <Link href="/prices">
            <button className="flex items-center gap-1.5 text-sm font-bold text-black/50 hover:text-black transition-colors">
              عرض الكل <ChevronLeft className="w-4 h-4" />
            </button>
          </Link>
        </div>

        {/* Segment pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {PKG_SEGMENTS.map(seg => {
            const Icon = seg.icon;
            const active = pkgSegment === seg.key;
            return (
              <button key={seg.key} onClick={() => setPkgSegment(seg.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border transition-all ${active ? `${seg.bg} ${seg.border} ${seg.text}` : 'border-black/[0.08] text-black/50 hover:border-black/15 hover:bg-black/[0.02]'}`}
                data-testid={`pkg-seg-${seg.key}`}>
                <Icon className="w-3.5 h-3.5" />
                {seg.labelAr}
              </button>
            );
          })}
        </div>

        {/* Period tabs */}
        <div className="flex flex-wrap gap-1.5 mb-7 p-1.5 bg-black/[0.03] border border-black/[0.05] rounded-2xl w-fit">
          {PKG_PERIODS.map(p => (
            <button key={p.key} onClick={() => setPkgPeriod(p.key)}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${pkgPeriod === p.key ? 'bg-black text-white shadow' : 'text-black/45 hover:text-black/70'}`}
              data-testid={`pkg-period-${p.key}`}>
              {p.label}
              {p.badge && pkgPeriod !== p.key && (
                <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-black leading-none">{p.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tier cards */}
        {tierPlans.length === 0 ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-black/20" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {tierPlans.map((plan: any, idx: number) => {
              const tier = PKG_TIERS[plan.tier] || PKG_TIERS.lite;
              const Icon = tier.icon;
              const price = pkgPrice(plan, pkgPeriod);
              const suffix = pkgSuffix(pkgPeriod);
              const isDark = !!tier.dark;
              const segCfg = PKG_SEGMENTS.find(s => s.key === pkgSegment)!;

              const monthlyBase = plan.monthlyPrice ?? 0;
              const monthlyEquiv = pkgPeriod === "monthly" ? price
                : pkgPeriod === "sixmonth" ? Math.round(price / 6)
                : pkgPeriod === "annual"   ? Math.round(price / 12)
                : null;
              const saving = monthlyEquiv && monthlyBase ? Math.round(((monthlyBase - monthlyEquiv) / monthlyBase) * 100) : 0;

              return (
                <motion.div key={plan._id || idx}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.07, duration: 0.4 }}
                  className={`relative rounded-2xl border overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl ${isDark ? 'bg-gradient-to-br from-gray-900 to-black border-white/10 hover:shadow-black/20' : `bg-white ${tier.border}`} ${plan.isPopular ? 'ring-2 ring-violet-400 shadow-lg shadow-violet-100' : ''}`}
                  data-testid={`pkg-card-${plan.tier}`}
                >
                  {plan.isPopular && (
                    <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-violet-500 via-purple-400 to-violet-600" />
                  )}
                  {plan.isPopular && (
                    <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                      <span className="inline-flex items-center gap-1 bg-black text-white text-[10px] font-black px-3 py-1 rounded-full shadow">
                        <Crown className="w-2.5 h-2.5" /> الأكثر طلباً
                      </span>
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    {/* Tier badge */}
                    <div className="flex items-center justify-between mb-5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${tier.grad}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className={`text-xs font-black px-3 py-1 rounded-full bg-gradient-to-r ${tier.grad} text-white`}>
                        {tier.label}
                      </span>
                    </div>

                    {/* Name & desc */}
                    <p className={`text-lg font-black font-heading mb-1 ${isDark ? 'text-white' : 'text-black'}`}>{plan.nameAr}</p>
                    <p className={`text-[11px] leading-relaxed mb-4 min-h-[32px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>{plan.descriptionAr}</p>

                    {/* Price */}
                    <div className={`rounded-xl p-4 mb-5 ${isDark ? 'bg-white/[0.05] border border-white/[0.08]' : 'bg-black/[0.03] border border-black/[0.05]'}`}>
                      <AnimatePresence mode="wait">
                        <motion.div key={`${plan.tier}-${pkgPeriod}`} initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }} transition={{ duration: 0.18 }}>
                          <div className="flex items-baseline gap-1.5">
                            <span className={`text-3xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{price.toLocaleString()}</span>
                            <span className={`text-sm font-bold ${isDark ? 'text-white/40' : 'text-black/40'}`}>ريال</span>
                            <span className={`text-xs ${isDark ? 'text-white/25' : 'text-black/25'}`}>{suffix}</span>
                          </div>
                          {monthlyEquiv && pkgPeriod !== "monthly" && (
                            <p className={`text-[10px] mt-1 ${isDark ? 'text-white/30' : 'text-black/30'}`}>
                              = <span className="font-bold">{monthlyEquiv.toLocaleString()} ر.س/شهر</span>
                              {saving > 0 && <span className="text-emerald-500 mr-1"> — وفّر {saving}%</span>}
                            </p>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Features (first 4) */}
                    {plan.featuresAr?.length > 0 && (
                      <ul className="space-y-1.5 mb-5 flex-1">
                        {(plan.featuresAr as string[]).slice(0, 4).map((f, fi) => (
                          <li key={fi} className={`flex items-start gap-2 text-xs ${isDark ? 'text-white/45' : 'text-black/55'}`}>
                            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-gradient-to-br ${tier.grad}`}>
                              <Check className="w-2 h-2 text-white" />
                            </div>
                            <span className="leading-snug">{f}</span>
                          </li>
                        ))}
                        {plan.featuresAr?.length > 4 && (
                          <li className={`text-[10px] mr-5 ${isDark ? 'text-white/25' : 'text-black/30'}`}>
                            +{plan.featuresAr.length - 4} مميزات أخرى
                          </li>
                        )}
                      </ul>
                    )}

                    {/* CTA */}
                    <Link href={`/order?plan=${plan.tier}&segment=${pkgSegment}&period=${pkgPeriod}&price=${price}`}>
                      <Button className={`w-full h-10 rounded-xl font-bold text-sm gap-1.5 ${isDark ? 'bg-white text-black hover:bg-white/90' : `bg-gradient-to-r ${tier.grad} text-white hover:opacity-90`}`}
                        data-testid={`btn-pkg-order-${plan.tier}`}>
                        اطلب الآن <ArrowLeft className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Divider */}
      <div className="container mx-auto px-4 max-w-6xl mb-12">
        <div className="border-t border-black/[0.06]" />
      </div>

      {/* Services Grid */}
      <section className="pb-8 container mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-black/20" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {filtered.map((service, i) => {
              const cat = categoryConfig[service.category] || { label: service.category, icon: Briefcase, gradient: "from-gray-500 to-slate-600", color: "text-gray-600", lightBg: "bg-gray-50" };
              const Icon = cat.icon;
              const isSelected = selectedServiceId === service.id;
              const isAdded = addedIds.has(`service-${service.id}`);

              return (
                <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <div
                    onClick={() => setSelectedServiceId(isSelected ? null : service.id)}
                    className={`relative bg-white border rounded-3xl p-6 cursor-pointer transition-all duration-300 group ${isSelected ? 'border-black shadow-2xl shadow-black/10 scale-[1.01]' : 'border-black/[0.07] hover:border-black/20 hover:shadow-lg'}`}
                    data-testid={`service-card-${service.id}`}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-black/[0.02] to-transparent pointer-events-none" />
                    )}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        {isSelected && <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center"><Check className="w-3.5 h-3.5 text-white" /></div>}
                        {service.estimatedDuration && (
                          <span className="text-[9px] bg-black/[0.04] text-black/40 px-2 py-0.5 rounded-full border border-black/[0.06]">⏱ {service.estimatedDuration}</span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-lg font-black text-black font-heading mb-1.5">{service.title}</h3>
                    <p className="text-black/45 text-xs leading-relaxed mb-4">{service.description}</p>

                    <div className="flex items-center justify-between">
                      <div>
                        {service.priceMin && service.priceMin > 0 ? (
                          <p className="text-2xl font-black text-black">{service.priceMin.toLocaleString()} <span className="text-sm font-normal text-black/40">ر.س</span></p>
                        ) : (
                          <p className="text-sm font-bold text-black/40">حسب المتطلبات</p>
                        )}
                      </div>
                      <div className={`text-xs font-bold flex items-center gap-1 transition-all ${isSelected ? 'text-black' : 'text-black/30 group-hover:text-black/60'}`}>
                        {isSelected ? "مختار" : "اختر"}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {isAdded && (
                      <div className="absolute top-3 left-3 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> في السلة
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Selected Service Detail Panel */}
      <AnimatePresence>
        {selectedService && (
          <motion.section
            key="detail"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="pb-24 container mx-auto px-4 max-w-6xl"
          >
            <div className="bg-[#f9f9f9] rounded-[2rem] border border-black/[0.06] overflow-hidden mt-6">
              {/* Service Header */}
              <div className="bg-white border-b border-black/[0.05] p-8 flex items-start justify-between gap-6 flex-wrap">
                <div className="flex items-center gap-5">
                  {(() => {
                    const cat = categoryConfig[selectedService.category] || { gradient: "from-gray-500 to-slate-600", icon: Briefcase };
                    const Icon = cat.icon;
                    return (
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                    );
                  })()}
                  <div>
                    <h2 className="text-2xl font-black text-black font-heading">{selectedService.title}</h2>
                    <p className="text-black/45 text-sm mt-1 max-w-lg">{selectedService.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    {selectedService.priceMin && selectedService.priceMin > 0 ? (
                      <p className="text-3xl font-black text-black">{selectedService.priceMin.toLocaleString()} <span className="text-base font-normal text-black/40">ر.س</span></p>
                    ) : (
                      <p className="text-lg font-bold text-black/40">حسب المتطلبات</p>
                    )}
                  </div>
                  <Button
                    onClick={() => addService(selectedService)}
                    disabled={addToCartMutation.isPending || addedIds.has(`service-${selectedService.id}`)}
                    className={`rounded-2xl h-12 px-6 font-bold transition-all ${addedIds.has(`service-${selectedService.id}`) ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-black text-white hover:bg-black/80'}`}
                    data-testid={`button-add-service-${selectedService.id}`}
                  >
                    {addedIds.has(`service-${selectedService.id}`) ? (
                      <><CheckCircle2 className="w-4 h-4 ml-2" />أُضيفت للسلة</>
                    ) : (
                      <><ShoppingCart className="w-4 h-4 ml-2" />أضف للسلة</>
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-8 space-y-10">
                {/* Features / Customization */}
                {isCustomizable(selectedService.category) ? (
                  <div>
                    <SectionTitle icon={Layers} title="نظام مخصص بالكامل" />
                    <div className="bg-white rounded-2xl p-6 border border-black/[0.06] flex flex-col md:flex-row items-start gap-6">
                      <div className="flex-1">
                        <p className="text-black/55 text-sm leading-relaxed">
                          هذا النظام يُبنى حسب متطلباتك وطبيعة نشاطك بالكامل — لا قيود على الميزات أو التصميم.
                          كل عنصر يُصمّم ويُبرمج من الصفر لمناسبة رؤيتك تماماً.
                        </p>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {["تصميم مخصص 100%", "ميزات لا محدودة", "تكامل مع أنظمتك", "API خاص", "دعم متواصل"].map(f => (
                            <span key={f} className="text-xs px-3 py-1.5 rounded-full border border-black/[0.08] text-black/60 bg-white font-medium">{f}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-black flex items-center justify-center mb-2 mx-auto">
                          <ZapIcon className="w-10 h-10 text-white" />
                        </div>
                        <p className="text-xs text-black/40 font-medium">استشارة مجانية</p>
                      </div>
                    </div>
                  </div>
                ) : serviceFeaturesMap[selectedService.category] ? (
                  <div>
                    <SectionTitle icon={CheckCircle2} title="ما يتضمنه النظام" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {serviceFeaturesMap[selectedService.category].map((f, i) => {
                        const cat = categoryConfig[selectedService.category];
                        return (
                          <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-black/[0.05]">
                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${cat?.gradient || 'from-gray-400 to-gray-600'}`}>
                              <Check className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-sm text-black/70">{f}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : selectedService.features?.length ? (
                  <div>
                    <SectionTitle icon={CheckCircle2} title="مميزات الخدمة" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedService.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-black/60 bg-white rounded-xl px-4 py-2.5 border border-black/[0.05]">
                          <Check className="w-3.5 h-3.5 text-black/30 flex-shrink-0" />{f}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Admin Products linked to this service */}
                {relatedProducts.length > 0 && (
                  <div>
                    <SectionTitle icon={Package} title="المنتجات المرتبطة بهذه الخدمة" subtitle="أضف ما تحتاجه لمشروعك" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {relatedProducts.map((p, i) => {
                        const isAdded = addedIds.has(p.id);
                        return (
                          <motion.div key={p.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                            className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden hover:shadow-md transition-all group">
                            <div className="h-36 bg-gradient-to-br from-black/[0.02] to-black/[0.05] flex items-center justify-center overflow-hidden">
                              {p.images?.[0] ? (
                                <img src={p.images[0]} alt={p.nameAr} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              ) : (
                                <Package className="w-10 h-10 text-black/15" />
                              )}
                            </div>
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm text-black truncate">{p.nameAr}</p>
                                  {p.badge && <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">{p.badge}</span>}
                                </div>
                                <p className="font-black text-black text-sm flex-shrink-0 mr-2">{p.price.toLocaleString()} <span className="text-[10px] font-normal text-black/40">ر.س</span></p>
                              </div>
                              {p.descriptionAr && <p className="text-[11px] text-black/40 line-clamp-1 mb-3">{p.descriptionAr}</p>}
                              <Button size="sm" onClick={() => addProduct(p)} disabled={addToCartMutation.isPending}
                                className={`w-full rounded-xl text-xs h-8 ${isAdded ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-black text-white hover:bg-black/80'}`}
                                data-testid={`button-add-product-${p.id}`}>
                                {isAdded ? <><Check className="w-3 h-3 ml-1" />أُضيف</> : <><Plus className="w-3 h-3 ml-1" />أضف للسلة</>}
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Gifts from Admin */}
                {(() => {
                  const gifts = products?.filter(p => p.isActive && p.category === 'gift') || [];
                  if (!gifts.length) return null;
                  return (
                    <div>
                      <SectionTitle icon={Gift} title="هدايا الخدمة" subtitle="إضافة مميزة مع كل مشروع" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {gifts.map((g, i) => {
                          const isAdded = addedIds.has(g.id);
                          return (
                            <div key={g.id} className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border border-pink-100 p-4 flex flex-col gap-3">
                              <div className="w-10 h-10 rounded-xl bg-pink-500 flex items-center justify-center">
                                <Gift className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-sm text-black">{g.nameAr}</p>
                                <p className="text-xs text-black/45 mt-1">{g.descriptionAr}</p>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="font-black text-black text-sm">{g.price > 0 ? `${g.price.toLocaleString()} ر.س` : "مجاناً"}</p>
                                <Button size="sm" onClick={() => addProduct(g)} className={`rounded-xl text-[11px] h-7 px-3 ${isAdded ? 'bg-green-500 text-white' : 'bg-pink-500 text-white hover:bg-pink-600'}`}>
                                  {isAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* ── Service Packages ───────────────────────────────────── */}
                {svcTierPlans.length > 0 && (
                  <div>
                    <SectionTitle icon={Tag} title="الباقات المتاحة لهذه الخدمة" subtitle="اختر المستوى المناسب لمشروعك" />

                    {/* Period tabs */}
                    <div className="flex flex-wrap gap-1.5 mb-5 p-1.5 bg-black/[0.03] border border-black/[0.05] rounded-2xl w-fit">
                      {PKG_PERIODS.map(p => (
                        <button key={p.key} onClick={() => setSvcPeriod(p.key)}
                          className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${svcPeriod === p.key ? 'bg-black text-white shadow' : 'text-black/45 hover:text-black/70'}`}>
                          {p.label}
                          {p.badge && svcPeriod !== p.key && (
                            <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-black leading-none">{p.badge}</span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {svcTierPlans.map((plan: any, idx: number) => {
                        const tier = PKG_TIERS[plan.tier] || PKG_TIERS.lite;
                        const Icon = tier.icon;
                        const price = pkgPrice(plan, svcPeriod);
                        const suffix = pkgSuffix(svcPeriod);
                        const isDark = !!tier.dark;
                        const monthlyBase = plan.monthlyPrice ?? 0;
                        const monthlyEquiv = svcPeriod === "monthly" ? price
                          : svcPeriod === "sixmonth" ? Math.round(price / 6)
                          : svcPeriod === "annual"   ? Math.round(price / 12)
                          : null;
                        const saving = monthlyEquiv && monthlyBase ? Math.round(((monthlyBase - monthlyEquiv) / monthlyBase) * 100) : 0;
                        return (
                          <div key={plan._id || idx}
                            className={`relative rounded-2xl border overflow-hidden flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-900 to-black border-white/10' : `bg-white ${tier.border}`} ${plan.isPopular ? 'ring-2 ring-violet-400' : ''}`}>
                            {plan.isPopular && <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-violet-500 via-purple-400 to-violet-600" />}
                            <div className="p-5 flex flex-col flex-1">
                              <div className="flex items-center justify-between mb-4">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${tier.grad}`}>
                                  <Icon className="w-4 h-4 text-white" />
                                </div>
                                <span className={`text-[11px] font-black px-2.5 py-1 rounded-full bg-gradient-to-r ${tier.grad} text-white`}>{tier.label}</span>
                              </div>
                              <p className={`text-base font-black mb-1 ${isDark ? 'text-white' : 'text-black'}`}>{plan.nameAr}</p>
                              <p className={`text-[11px] leading-relaxed mb-3 ${isDark ? 'text-white/40' : 'text-black/40'}`}>{plan.descriptionAr}</p>
                              <div className={`rounded-xl p-3 mb-4 ${isDark ? 'bg-white/[0.05] border border-white/[0.08]' : 'bg-black/[0.03] border border-black/[0.05]'}`}>
                                <div className="flex items-baseline gap-1.5">
                                  <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{price.toLocaleString()}</span>
                                  <span className={`text-xs font-bold ${isDark ? 'text-white/40' : 'text-black/40'}`}>ريال {suffix}</span>
                                </div>
                                {monthlyEquiv && svcPeriod !== "monthly" && saving > 0 && (
                                  <p className="text-[10px] text-emerald-500 mt-0.5">وفّر {saving}%</p>
                                )}
                              </div>
                              <ul className="space-y-1 flex-1 mb-4">
                                {(plan.featuresAr as string[] || []).slice(0, 3).map((f: string, fi: number) => (
                                  <li key={fi} className={`flex items-start gap-1.5 text-[11px] ${isDark ? 'text-white/45' : 'text-black/55'}`}>
                                    <Check className={`w-3 h-3 flex-shrink-0 mt-0.5 ${isDark ? 'text-white/30' : 'text-black/30'}`} />
                                    <span>{f}</span>
                                  </li>
                                ))}
                                {(plan.featuresAr?.length || 0) > 3 && <li className={`text-[10px] mr-4 ${isDark ? 'text-white/25' : 'text-black/25'}`}>+{plan.featuresAr.length - 3} مميزات أخرى</li>}
                              </ul>
                              <Link href={`/order?plan=${plan.tier}&segment=${svcSegment}&period=${svcPeriod}&price=${price}`}>
                                <Button size="sm" className={`w-full h-9 rounded-xl font-bold text-xs gap-1.5 ${isDark ? 'bg-white text-black hover:bg-white/90' : `bg-gradient-to-r ${tier.grad} text-white hover:opacity-90`}`}>
                                  اطلب هذه الباقة <ArrowLeft className="w-3 h-3" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Required Documents ──────────────────────────────────── */}
                <div>
                  <SectionTitle icon={Info} title="المستندات المطلوبة" subtitle="مطلوبة قبل بدء العمل — تُحفظ في ملفك لدينا" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Logo Upload */}
                    <div className={`bg-white rounded-2xl border p-5 transition-all ${logoFile ? 'border-green-300 bg-green-50/30' : 'border-black/[0.08] border-dashed'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${logoFile ? 'bg-green-500' : 'bg-black/[0.06]'}`}>
                          {logoFile ? <Check className="w-4 h-4 text-white" /> : <Package className="w-4 h-4 text-black/40" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-black">شعار الجهة / اللوجو</p>
                          <p className="text-[10px] text-black/40">PNG أو SVG — أفضل جودة</p>
                        </div>
                        <span className="mr-auto text-[9px] bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-bold">مطلوب</span>
                      </div>
                      {logoFile ? (
                        <div className="flex items-center gap-2 bg-green-100 rounded-xl px-3 py-2">
                          <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                          <span className="text-xs text-green-800 font-medium truncate flex-1">{logoFile.filename}</span>
                          <button onClick={() => setLogoFile(null)} className="text-green-600 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-24 rounded-xl border-2 border-dashed border-black/[0.08] cursor-pointer hover:border-black/20 hover:bg-black/[0.02] transition-all">
                          <input type="file" className="hidden" accept="image/*,.svg,.pdf"
                            disabled={docsUploading === "logo"}
                            onChange={e => { const f = e.target.files?.[0]; if (f) uploadDoc(f, "logo"); e.target.value = ""; }} />
                          {docsUploading === "logo"
                            ? <Loader2 className="w-5 h-5 animate-spin text-black/30" />
                            : <><Upload className="w-5 h-5 text-black/25 mb-1.5" /><span className="text-xs text-black/35">اضغط لرفع الشعار</span></>}
                        </label>
                      )}
                    </div>

                    {/* Trade Registration Upload */}
                    <div className={`bg-white rounded-2xl border p-5 transition-all ${licenseFile ? 'border-green-300 bg-green-50/30' : 'border-black/[0.08] border-dashed'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${licenseFile ? 'bg-green-500' : 'bg-black/[0.06]'}`}>
                          {licenseFile ? <Check className="w-4 h-4 text-white" /> : <Info className="w-4 h-4 text-black/40" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-black">السجل التجاري / الرخصة</p>
                          <p className="text-[10px] text-black/40">صورة أو PDF واضحة</p>
                        </div>
                        <span className="mr-auto text-[9px] bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-bold">مطلوب</span>
                      </div>
                      {licenseFile ? (
                        <div className="flex items-center gap-2 bg-green-100 rounded-xl px-3 py-2">
                          <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                          <span className="text-xs text-green-800 font-medium truncate flex-1">{licenseFile.filename}</span>
                          <button onClick={() => setLicenseFile(null)} className="text-green-600 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-24 rounded-xl border-2 border-dashed border-black/[0.08] cursor-pointer hover:border-black/20 hover:bg-black/[0.02] transition-all">
                          <input type="file" className="hidden" accept="image/*,.pdf"
                            disabled={docsUploading === "license"}
                            onChange={e => { const f = e.target.files?.[0]; if (f) uploadDoc(f, "license"); e.target.value = ""; }} />
                          {docsUploading === "license"
                            ? <Loader2 className="w-5 h-5 animate-spin text-black/30" />
                            : <><Upload className="w-5 h-5 text-black/25 mb-1.5" /><span className="text-xs text-black/35">اضغط لرفع السجل التجاري</span></>}
                        </label>
                      )}
                    </div>
                  </div>
                  {(!logoFile || !licenseFile) && (
                    <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mt-3 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 flex-shrink-0" />
                      يُطلب رفع الشعار والسجل التجاري قبل بدء تنفيذ المشروع — يمكن إكمالهما لاحقاً من حسابك
                    </p>
                  )}
                </div>

                {/* Infrastructure */}
                <div>
                  <SectionTitle icon={Server} title="البنية التحتية" subtitle="قاعدة بيانات + استضافة = مشروع مكتمل" />

                  {/* MongoDB Atlas */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-green-600 flex items-center justify-center"><Database className="w-4 h-4 text-white" /></div>
                      <div>
                        <p className="font-bold text-sm text-black">MongoDB Atlas</p>
                        <p className="text-[10px] text-black/40">قاعدة بيانات سحابية عالية الأداء</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                      {mongoTiers.map(tier => {
                        const key = `mongo-${tier.id}`;
                        const isAdded = addedIds.has(key);
                        return (
                          <div key={tier.id} className={`bg-white rounded-xl border p-3 relative ${tier.badge ? 'border-green-300 shadow-sm' : 'border-black/[0.07]'}`}>
                            {tier.badge && <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] bg-green-600 text-white px-2 py-0.5 rounded-full font-bold">{tier.badge}</span>}
                            <p className="font-bold text-xs text-black">{tier.name}</p>
                            <p className="text-[10px] text-black/40 mb-1">{tier.storage} · {tier.note}</p>
                            <p className="font-black text-black text-sm mb-2">{tier.price === 0 ? "مجاناً" : `$${tier.price}/شهر`}</p>
                            <Button size="sm" onClick={() => { const k = key; addInfra({ type: 'hosting', name: `MongoDB Atlas ${tier.name}`, nameAr: `قاعدة بيانات ${tier.name}`, price: tier.price, qty: 1, config: { dbType: 'mongodb_atlas', tier: tier.id, storage: tier.storage } }); setAddedIds(p => new Set([...p, k])); }}
                              className={`w-full rounded-lg text-[10px] h-7 ${isAdded ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-black/80'}`}>
                              {isAdded ? <><Check className="w-3 h-3 ml-1" />أُضيف</> : <><Plus className="w-3 h-3 ml-1" />أضف</>}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* AWS EC2 */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center"><Cloud className="w-4 h-4 text-white" /></div>
                      <div>
                        <p className="font-bold text-sm text-black">AWS EC2</p>
                        <p className="text-[10px] text-black/40">خوادم أمازون السحابية — الأفضل عالمياً</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                      {awsTiers.map(tier => {
                        const key = `aws-${tier.id}`;
                        const isAdded = addedIds.has(key);
                        return (
                          <div key={tier.id} className={`bg-white rounded-xl border p-3 relative ${(tier as any).badge ? 'border-orange-300 shadow-sm' : 'border-black/[0.07]'}`}>
                            {(tier as any).badge && <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold">{(tier as any).badge}</span>}
                            <p className="font-bold text-xs text-black">{tier.name}</p>
                            <p className="text-[10px] text-black/40 mb-1">{tier.cpu} · {tier.ram} · {tier.note}</p>
                            <p className="font-black text-black text-sm mb-2">${tier.price}/شهر</p>
                            <Button size="sm" onClick={() => { const k = key; addInfra({ type: 'hosting', name: `AWS EC2 ${tier.name}`, nameAr: `خادم AWS ${tier.name}`, price: tier.price, qty: 1, config: { hostingType: 'aws_ec2', tier: tier.id, cpu: tier.cpu, ram: tier.ram } }); setAddedIds(p => new Set([...p, k])); }}
                              className={`w-full rounded-lg text-[10px] h-7 ${isAdded ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-black/80'}`}>
                              {isAdded ? <><Check className="w-3 h-3 ml-1" />أُضيف</> : <><Plus className="w-3 h-3 ml-1" />أضف</>}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Domain & Email (from admin products) */}
                  {(() => {
                    const domainProds = products?.filter(p => p.isActive && p.category === 'domain') || [];
                    const emailProds = products?.filter(p => p.isActive && p.category === 'email') || [];
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Domains */}
                        {domainProds.length > 0 && (
                          <div className="bg-white rounded-2xl border border-black/[0.07] p-5">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center"><Globe className="w-4 h-4 text-white" /></div>
                              <div>
                                <p className="font-bold text-sm text-black">الدومين</p>
                                <p className="text-[10px] text-black/40">هوية موقعك على الإنترنت</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {domainProds.map(d => {
                                const isAdded = addedIds.has(d.id);
                                return (
                                  <div key={d.id} className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/50 border border-blue-100">
                                    <div className="flex items-center gap-2">
                                      {d.images?.[0] && <img src={d.images[0]} className="w-6 h-6 rounded object-cover" alt="" />}
                                      <p className="text-xs font-bold text-black">{d.nameAr}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs font-black text-black">{d.price.toLocaleString()} ر.س</p>
                                      <Button size="sm" onClick={() => addProduct(d)} className={`rounded-lg text-[10px] h-6 px-2 ${isAdded ? 'bg-green-500 text-white' : 'bg-black text-white'}`}>
                                        {isAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Email */}
                        {emailProds.length > 0 && (
                          <div className="bg-white rounded-2xl border border-black/[0.07] p-5">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center"><Mail className="w-4 h-4 text-white" /></div>
                              <div>
                                <p className="font-bold text-sm text-black">البريد المهني</p>
                                <p className="text-[10px] text-black/40">بريد يحمل اسم علامتك</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {emailProds.map(e => {
                                const isAdded = addedIds.has(e.id);
                                return (
                                  <div key={e.id} className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100">
                                    <div className="flex items-center gap-2">
                                      {e.images?.[0] && <img src={e.images[0]} className="w-6 h-6 rounded object-cover" alt="" />}
                                      <div>
                                        <p className="text-xs font-bold text-black">{e.nameAr}</p>
                                        {e.badge && <span className="text-[9px] text-indigo-600">{e.badge}</span>}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs font-black text-black">{e.price.toLocaleString()} ر.س</p>
                                      <Button size="sm" onClick={() => addProduct(e)} className={`rounded-lg text-[10px] h-6 px-2 ${isAdded ? 'bg-green-500 text-white' : 'bg-black text-white'}`}>
                                        {isAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Fallback email plans if no admin email products */}
                        {emailProds.length === 0 && (
                          <div className="bg-white rounded-2xl border border-black/[0.07] p-5">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center"><Mail className="w-4 h-4 text-white" /></div>
                              <div>
                                <p className="font-bold text-sm text-black">البريد المهني</p>
                                <p className="text-[10px] text-black/40">بريد يحمل اسم علامتك</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {emailPlans.map(ep => {
                                const key = `email-${ep.id}`;
                                const isAdded = addedIds.has(key);
                                return (
                                  <div key={ep.id} className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100">
                                    <div>
                                      <p className="text-xs font-bold text-black">{ep.name}</p>
                                      <p className="text-[10px] text-black/40">{ep.accounts} حساب · {ep.storage}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs font-black text-black">{ep.price} ر.س</p>
                                      <Button size="sm" onClick={() => { const k = key; addInfra({ type: 'email', name: `Business Email ${ep.name}`, nameAr: `بريد أعمال ${ep.name}`, price: ep.price, qty: 1, config: { emailPlan: ep.id } }); setAddedIds(p => new Set([...p, k])); }}
                                        className={`rounded-lg text-[10px] h-6 px-2 ${isAdded ? 'bg-green-500 text-white' : 'bg-black text-white'}`}>
                                        {isAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* CTA */}
                <div className="bg-black rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-white">
                    <h3 className="text-xl font-bold mb-1">السلة جاهزة للإتمام</h3>
                    <p className="text-white/45 text-sm">راجع اختياراتك وأتمم طلبك الآن — الفريق سيتواصل معك خلال 24 ساعة</p>
                  </div>
                  <div className="flex gap-3 flex-shrink-0">
                    <Link href="/cart">
                      <Button className="bg-white text-black hover:bg-white/90 font-bold px-6 h-11 rounded-xl" data-testid="button-go-cart">
                        <ShoppingCart className="w-4 h-4 ml-2" />
                        عرض السلة
                      </Button>
                    </Link>
                    <Link href="/devices">
                      <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 h-11 rounded-xl px-5">
                        <Package className="w-4 h-4 ml-2" />
                        المزيد
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Not logged in CTA */}
      {!user && !isLoading && (
        <div className="pb-24 container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="bg-black rounded-3xl p-10 text-center text-white">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-white/30" />
            <h3 className="text-xl font-bold mb-2">سجل دخولك لإضافة للسلة</h3>
            <p className="text-white/45 text-sm mb-6">اختر خدماتك وأضف البنية التحتية بحسابك</p>
            <Link href="/login">
              <Button className="bg-white text-black hover:bg-white/90 font-bold px-8 h-11 rounded-xl">تسجيل الدخول</Button>
            </Link>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 rounded-xl bg-black/[0.06] flex items-center justify-center">
        <Icon className="w-4 h-4 text-black/50" />
      </div>
      <div>
        <p className="font-bold text-sm text-black">{title}</p>
        {subtitle && <p className="text-[11px] text-black/35">{subtitle}</p>}
      </div>
    </div>
  );
}
