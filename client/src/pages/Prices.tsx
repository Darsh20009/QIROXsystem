import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { usePricingPlans } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import SARIcon from "@/components/SARIcon";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearch } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useState, useMemo, useEffect } from "react";
import {
  Loader2, Check, ArrowLeft, X, Globe, Tag, Gift, Plus, Shield,
  Smartphone, Palette, TrendingUp, Infinity as InfinityIcon, Crown, CalendarDays, CalendarRange,
  Calendar, Zap, Star, UtensilsCrossed, ShoppingBag, GraduationCap, Building2, Home, Heart, ChevronRight,
  Dumbbell, Store, CheckCircle2, Sparkles, Cpu, Code2, Server, Database, LayoutDashboard,
  Bell, Users, Lock, BarChart3, Layers, Rocket, Boxes, MessageCircle
} from "lucide-react";
import { QiroxIcon } from "@/components/qirox-brand";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-auth";
import { PackageFinderModal } from "@/components/PackageFinderModal";
import { PricesHeroVisual } from "@/components/MarketingVisual";

type BillingPeriod = "monthly" | "sixmonth" | "annual" | "lifetime";

const PERIODS: { key: BillingPeriod; labelAr: string; labelEn: string; sublabelAr: string; sublabelEn: string; icon: any }[] = [
  { key: "monthly",  labelAr: "شهري",       labelEn: "Monthly",   sublabelAr: "ادفع كل شهر",   sublabelEn: "Pay monthly",    icon: Calendar },
  { key: "sixmonth", labelAr: "نصف سنوي",   labelEn: "6 Months",  sublabelAr: "6 أشهر",         sublabelEn: "6 months",       icon: CalendarRange },
  { key: "annual",   labelAr: "سنوي",       labelEn: "Annual",    sublabelAr: "سنة كاملة",      sublabelEn: "Full year",      icon: CalendarDays  },
  { key: "lifetime", labelAr: "مدى الحياة", labelEn: "Lifetime",  sublabelAr: "دفعة واحدة",     sublabelEn: "One-time",       icon: InfinityIcon  },
];

const SEGMENT_LOOKUP: Record<string, { labelAr: string; labelEn: string; icon: any; color: string; bg: string }> = {
  restaurant:    { labelAr: "مطاعم ومقاهي",    labelEn: "Restaurants",   icon: UtensilsCrossed, color: "text-black/70 dark:text-white/70", bg: "bg-black dark:bg-white" },
  ecommerce:     { labelAr: "متاجر إلكترونية", labelEn: "E-Commerce",    icon: ShoppingBag,     color: "text-black/70 dark:text-white/70",   bg: "bg-black dark:bg-white" },
  store:         { labelAr: "متاجر إلكترونية", labelEn: "E-Commerce",    icon: Store,           color: "text-black/70 dark:text-white/70",   bg: "bg-black dark:bg-white" },
  education:     { labelAr: "منصات تعليمية",   labelEn: "Education",     icon: GraduationCap,   color: "text-black/70 dark:text-white/70", bg: "bg-black dark:bg-white" },
  corporate:     { labelAr: "شركات ومؤسسات",   labelEn: "Corporate",     icon: Building2,       color: "text-slate-400",  bg: "bg-slate-500/10" },
  other:         { labelAr: "شركات ومؤسسات",   labelEn: "Corporate",     icon: Building2,       color: "text-slate-400",  bg: "bg-slate-500/10" },
  realestate:    { labelAr: "عقارات",           labelEn: "Real Estate",   icon: Home,            color: "text-black/70 dark:text-white/70",   bg: "bg-black dark:bg-white" },
  healthcare:    { labelAr: "صحة وعيادات",      labelEn: "Healthcare",    icon: Heart,           color: "text-black/70 dark:text-white/70",   bg: "bg-black dark:bg-white" },
  health:        { labelAr: "صحة ولياقة",       labelEn: "Health",        icon: Heart,           color: "text-black/70 dark:text-white/70",   bg: "bg-black dark:bg-white" },
  fitness:       { labelAr: "لياقة وجيم",       labelEn: "Fitness",       icon: Dumbbell,        color: "text-black/70 dark:text-white/70",  bg: "bg-black dark:bg-white" },
  beauty:        { labelAr: "تجميل وصالونات",  labelEn: "Beauty",        icon: Sparkles,        color: "text-black/70 dark:text-white/70",   bg: "bg-black dark:bg-white" },
  tech:          { labelAr: "تقنية وبرمجة",    labelEn: "Technology",    icon: Globe,           color: "text-black/70 dark:text-white/70",   bg: "bg-black dark:bg-white" },
  food:          { labelAr: "مطاعم ومقاهي",    labelEn: "Restaurants",   icon: UtensilsCrossed, color: "text-black/70 dark:text-white/70", bg: "bg-black dark:bg-white" },
  commerce:      { labelAr: "متاجر إلكترونية", labelEn: "E-Commerce",    icon: ShoppingBag,     color: "text-black/70 dark:text-white/70",   bg: "bg-black dark:bg-white" },
  institutional: { labelAr: "مؤسسات وجمعيات",  labelEn: "Institutions",  icon: Building2,       color: "text-slate-400",  bg: "bg-slate-500/10" },
  personal:      { labelAr: "خدمات شخصية",     labelEn: "Personal",      icon: Globe,           color: "text-black/70 dark:text-white/70", bg: "bg-black dark:bg-white" },
  general:       { labelAr: "عام",              labelEn: "General",       icon: Globe,           color: "text-slate-400",  bg: "bg-slate-500/10" },
};

// Map feature keywords to icons for visual display
function featureIcon(text: string): any {
  const t = text.toLowerCase();
  if (t.includes("تطبيق") || t.includes("جوال") || t.includes("app")) return Smartphone;
  if (t.includes("دفع") || t.includes("payment") || t.includes("بنك")) return Shield;
  if (t.includes("تقرير") || t.includes("إحصاء") || t.includes("report")) return BarChart3;
  if (t.includes("مستخدم") || t.includes("عميل") || t.includes("user")) return Users;
  if (t.includes("إشعار") || t.includes("notif")) return Bell;
  if (t.includes("قاعدة") || t.includes("database") || t.includes("بيانات")) return Database;
  if (t.includes("سيرفر") || t.includes("server") || t.includes("استضافة")) return Server;
  if (t.includes("لوحة") || t.includes("dashboard") || t.includes("واجهة")) return LayoutDashboard;
  if (t.includes("دومين") || t.includes("domain") || t.includes("نطاق")) return Globe;
  if (t.includes("برمجة") || t.includes("كود") || t.includes("code")) return Code2;
  if (t.includes("أمان") || t.includes("حماية") || t.includes("security")) return Lock;
  if (t.includes("seo") || t.includes("تسويق") || t.includes("marketing")) return TrendingUp;
  if (t.includes("تصميم") || t.includes("هوية") || t.includes("design")) return Palette;
  if (t.includes("طبقة") || t.includes("layer") || t.includes("module")) return Layers;
  return CheckCircle2;
}

const TIER_CONFIG: Record<string, {
  labelAr: string; labelEn: string; icon: any;
  cardBg: string; headerGrad: string; borderColor: string;
  accentColor: string; accentGlow: string;
  priceColor: string; featureColor: string;
  badgeBg: string; badgeText: string;
  ctaBg: string; ctaText: string;
  patternColor: string; taglinePrimary: string; taglineSecondary: string;
  tierNum: string;
}> = {
  lite: {
    labelAr: "لايت", labelEn: "Lite", icon: Zap,
    cardBg: "bg-white dark:bg-[#0f172a]",
    headerGrad: "from-gray-50 via-white to-gray-50 dark:from-[#0f172a] dark:via-[#131e2e] dark:to-[#0f172a]",
    borderColor: "border-gray-200 dark:border-slate-700/60",
    accentColor: "text-gray-900 dark:text-slate-200",
    accentGlow: "",
    priceColor: "text-gray-900 dark:text-white",
    featureColor: "text-gray-600 dark:text-slate-300",
    badgeBg: "bg-gray-100 dark:bg-slate-800/80",
    badgeText: "text-gray-600 dark:text-slate-300",
    ctaBg: "bg-gray-900 hover:bg-black text-white dark:bg-slate-200 dark:hover:bg-white dark:text-slate-900",
    ctaText: "",
    patternColor: "opacity-[0.03] dark:opacity-[0.06]",
    taglinePrimary: "انطلق بثقة",
    taglineSecondary: "Launch with confidence",
    tierNum: "01",
  },
  pro: {
    labelAr: "برو", labelEn: "Pro", icon: Star,
    cardBg: "bg-[#1a3a6e]",
    headerGrad: "from-[#1e40af] via-[#1a3a6e] to-[#1e3a8a]",
    borderColor: "border-black dark:border-white",
    accentColor: "text-white",
    accentGlow: "shadow-[0_0_40px_rgba(59,130,246,0.25)]",
    priceColor: "text-white",
    featureColor: "text-black/60 dark:text-white/60",
    badgeBg: "bg-white/10",
    badgeText: "text-white",
    ctaBg: "bg-white hover:bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white",
    ctaText: "",
    patternColor: "opacity-[0.08]",
    taglinePrimary: "النظام الأذكى",
    taglineSecondary: "The smart system",
    tierNum: "02",
  },
  infinite: {
    labelAr: "إنفينتي", labelEn: "Infinite", icon: InfinityIcon,
    cardBg: "bg-[#09090f]",
    headerGrad: "from-[#0f0f18] via-[#0d0d16] to-[#09090f]",
    borderColor: "border-black dark:border-white",
    accentColor: "text-black/70 dark:text-white/70",
    accentGlow: "shadow-[0_0_50px_rgba(245,158,11,0.15)]",
    priceColor: "text-white",
    featureColor: "text-slate-300/80",
    badgeBg: "bg-black/[0.08] dark:bg-white/[0.1]",
    badgeText: "text-black/70 dark:text-white/70",
    ctaBg: "bg-black/[0.08] dark:bg-white/[0.1] hover:bg-black dark:bg-white text-slate-900",
    ctaText: "",
    patternColor: "opacity-[0.07]",
    taglinePrimary: "بلا حدود",
    taglineSecondary: "No limits",
    tierNum: "03",
  },
};

/* ─── Decorative SVG grid pattern ────────────────────────────────────── */
function GridPattern({ className = "" }: { className?: string }) {
  return (
    <svg className={`absolute inset-0 w-full h-full ${className}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid-sm" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-sm)" />
    </svg>
  );
}

/* ─── Tier Card ───────────────────────────────────────────────────────── */
function TierCard({ plan, period, idx, isPopularOverride, lang, whatsapp }: {
  plan: any; period: BillingPeriod; idx: number; isPopularOverride?: boolean;
  lang: string; whatsapp?: string;
}) {
  const cfg = TIER_CONFIG[plan.tier] || TIER_CONFIG.lite;
  const isPopular = plan.isPopular || isPopularOverride;
  const isPro = plan.tier === "pro";
  const isInfinite = plan.tier === "infinite";
  const features = (lang === "ar" ? plan.featuresAr : (plan.featuresEn || plan.featuresAr)) ?? [];
  const TierIcon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-500
        hover:-translate-y-1 hover:shadow-2xl group
        ${cfg.cardBg} ${cfg.borderColor} ${cfg.accentGlow}`}
      data-testid={`card-tier-${plan.tier}`}
    >
      {/* Popular glow line */}
      {isPopular && (
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-black/[0.08] dark:via-white/[0.1] to-transparent" />
      )}

      {/* Decorative background */}
      <div className={`absolute inset-0 text-gray-300 dark:text-slate-400 ${cfg.patternColor} pointer-events-none`}>
        <GridPattern />
      </div>

      {/* Amber constellation dots for Infinite */}
      {isInfinite && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[[15,20],[85,35],[45,60],[70,15],[30,75],[90,65],[10,85],[55,40]].map(([x,y],i) => (
            <div key={i} className="absolute w-0.5 h-0.5 rounded-full bg-black/[0.08] dark:bg-white/[0.1]"
              style={{ left:`${x}%`, top:`${y}%` }} />
          ))}
        </div>
      )}

      {/* ─── Header ─── */}
      <div className={`relative px-6 pt-6 pb-5 bg-gradient-to-br ${cfg.headerGrad}`}>
        {/* Tier number badge */}
        <div className={`absolute top-4 ${lang === "ar" ? "left-4" : "right-4"} text-[11px] font-black tracking-[0.2em] ${isInfinite ? "text-black/70 dark:text-white/70" : isPro ? "text-white/20" : "text-gray-300 dark:text-slate-600"}`}>
          {cfg.tierNum}
        </div>

        {/* Popular badge */}
        {isPopular && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 + 0.3 }}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-black dark:from-white to-black dark:to-white text-white text-[10px] font-black px-3 py-1.5 rounded-full mb-3 shadow-lg shadow-blue-500/30"
          >
            <Crown className="w-3 h-3" /> {lang === "ar" ? "الأكثر طلباً" : "Most Popular"}
          </motion.div>
        )}

        {/* Icon + Name */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.badgeBg}`}>
            <TierIcon className={`w-5 h-5 ${isInfinite ? "text-black/70 dark:text-white/70" : isPro ? "text-black/60 dark:text-white/60" : "text-gray-500 dark:text-slate-300"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-0.5 ${isPro ? "text-white/40" : isInfinite ? "text-black/70 dark:text-white/70" : "text-gray-400 dark:text-slate-500"}`}>QIROX SYSTEMS</p>
            <p className={`font-black text-base leading-tight truncate ${cfg.accentColor}`}>
              {lang === "ar" ? plan.nameAr : (plan.nameEn || plan.nameAr)}
            </p>
          </div>
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border shrink-0 ${cfg.badgeBg} ${cfg.badgeText} ${isInfinite ? "border-black/15 dark:border-white/15" : isPro ? "border-white/15" : "border-gray-300 dark:border-slate-600"}`}>
            {lang === "ar" ? cfg.labelAr : cfg.labelEn}
          </span>
        </div>

        {/* Tagline */}
        <p className={`text-xs font-bold tracking-wider ${isInfinite ? "text-black/70 dark:text-white/70" : isPro ? "text-white/30" : "text-gray-400 dark:text-slate-500"}`}>
          — {lang === "ar" ? cfg.taglinePrimary : cfg.taglineSecondary}
        </p>
      </div>

      {/* ─── Price ─── */}
      <div className={`relative px-6 py-5 border-t ${isInfinite ? "border-black/15 dark:border-white/15 bg-white/[0.02]" : isPro ? "border-white/10 bg-white/[0.05]" : "border-gray-100 bg-gray-50 dark:border-slate-800/60 dark:bg-[#0f172a]"}`}>
        <AnimatePresence mode="wait">
          <motion.div key={`${plan.tier}-${period}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-2xl font-black tracking-tight ${cfg.priceColor}`}>
                {lang === "ar" ? "على حسب الاحتياج" : "Custom Pricing"}
              </span>
            </div>
            <p className={`text-[11px] mt-1.5 ${isPro || isInfinite ? "text-white/40" : "text-gray-500 dark:text-slate-400"}`}>
              {lang === "ar" ? "تواصل معنا للحصول على عرض خاص" : "Contact us for a personalized quote"}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── Features ─── */}
      <div className={`relative flex-1 px-6 py-5 ${isInfinite ? "bg-[#09090f]" : isPro ? "bg-[#1a3a6e]" : "bg-white dark:bg-[#0f172a]"}`}>
        <p className={`text-[9px] font-black uppercase tracking-[0.18em] mb-3.5 ${isInfinite ? "text-black/70 dark:text-white/70" : isPro ? "text-white/25" : "text-gray-400 dark:text-slate-500"}`}>
          {lang === "ar" ? "يشمل النظام" : "SYSTEM INCLUDES"}
        </p>
        {/* Lifetime unlock banner */}
        {period === "lifetime" && (
          <div className={`mb-3 flex items-center gap-2 px-3 py-2 rounded-xl ${isInfinite ? "bg-black/[0.08] dark:bg-white/[0.1] border border-black/15 dark:border-white/15" : isPro ? "bg-white/10 border border-white/20" : "bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 dark:bg-black dark:bg-white dark:border-black dark:border-white"}`}>
            <InfinityIcon className={`w-4 h-4 shrink-0 ${isInfinite ? "text-black/70 dark:text-white/70" : isPro ? "text-black/60 dark:text-white/60" : "text-black dark:text-white dark:text-black/70 dark:text-white/70"}`} />
            <span className={`text-[11px] font-black ${isInfinite ? "text-black/70 dark:text-white/70" : isPro ? "text-white" : "text-black dark:text-white dark:text-black/70 dark:text-white/70"}`}>
              {lang === "ar" ? "كل الميزات مفتوحة — بلا حدود ومدى الحياة" : "All features unlocked — unlimited forever"}
            </span>
          </div>
        )}
        <div className="space-y-2.5">
          {(period === "lifetime" ? features : features.slice(0, 6)).map((f: string, i: number) => {
            const FIcon = featureIcon(f);
            return (
              <div key={i} className="flex items-start gap-2.5">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${isInfinite ? "bg-black/[0.08] dark:bg-white/[0.1]" : isPro ? "bg-white/10" : "bg-gray-100 dark:bg-slate-800"}`}>
                  <FIcon className={`w-3 h-3 ${isInfinite ? "text-black/70 dark:text-white/70" : isPro ? "text-black/60 dark:text-white/60" : "text-gray-500 dark:text-slate-400"}`} />
                </div>
                <span className={`text-xs leading-snug ${cfg.featureColor}`}>{f}</span>
              </div>
            );
          })}
          {period !== "lifetime" && features.length > 6 && (
            <div className={`text-[10px] font-bold ${isInfinite ? "text-black/70 dark:text-white/70" : isPro ? "text-white/30" : "text-gray-400 dark:text-slate-400"} mr-7 rtl:mr-0 rtl:ml-7`}>
              {lang === "ar" ? `+ ${features.length - 6} ميزة أخرى` : `+ ${features.length - 6} more`}
            </div>
          )}
        </div>
      </div>

      {/* ─── CTA ─── */}
      <div className={`relative px-6 py-5 border-t ${isInfinite ? "border-black/15 dark:border-white/15 bg-[#09090f]" : isPro ? "border-white/10 bg-[#1a3a6e]" : "border-gray-100 bg-white dark:border-slate-800/60 dark:bg-[#0f172a]"}`}>
        <Button
          onClick={e => {
            e.stopPropagation();
            const planName = lang === "ar" ? plan.nameAr : (plan.nameEn || plan.nameAr);
            const segmentLabel = plan.segment ? SEGMENT_LOOKUP[plan.segment]?.labelAr ?? plan.segment : "";
            const msg = lang === "ar"
              ? `مرحباً، أريد الاستفسار عن باقة ${planName}${segmentLabel ? ` لـ${segmentLabel}` : ""}`
              : `Hello, I'd like to inquire about the ${planName} plan${segmentLabel ? ` for ${SEGMENT_LOOKUP[plan.segment]?.labelEn ?? segmentLabel}` : ""}`;
            const waNumber = whatsapp ? whatsapp.replace(/\D/g, "") : "";
            const waUrl = waNumber
              ? `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`
              : `https://wa.me/?text=${encodeURIComponent(msg)}`;
            window.open(waUrl, "_blank");
          }}
          className={`w-full h-11 rounded-xl font-black text-sm gap-2 transition-all ${cfg.ctaBg}`}
          data-testid={`button-select-${plan.tier}`}
        >
          {lang === "ar" ? "تواصل للحصول على عرض" : "Get a Quote"}
          <MessageCircle className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────── */
export default function Prices() {
  const { data: plans, isLoading } = usePricingPlans();
  const { lang, dir } = useI18n();
  const { data: publicSettings } = useQuery<{ whatsapp?: string }>({
    queryKey: ["/api/public/settings"],
    staleTime: 10 * 60 * 1000,
  });

  const segments = useMemo(() => {
    if (!plans || plans.length === 0) return Object.entries(SEGMENT_LOOKUP).slice(0, 6).map(([k, v]) => ({ key: k, ...v }));
    const seen = new Set<string>();
    const result: (typeof SEGMENT_LOOKUP[string] & { key: string })[] = [];
    for (const p of plans) {
      const k: string = p.segment;
      if (!k || k === "general" || seen.has(k)) continue;
      seen.add(k);
      const meta = SEGMENT_LOOKUP[k] ?? { labelAr: k, labelEn: k, icon: Globe, color: "text-slate-400", bg: "bg-slate-500/10" };
      result.push({ key: k, ...meta });
    }
    return result.length > 0 ? result : Object.entries(SEGMENT_LOOKUP).slice(0, 6).map(([k, v]) => ({ key: k, ...v }));
  }, [plans]);

  const searchStr = useSearch();
  const [segment, setSegment] = useState(() => {
    // Auto-select segment from URL param (?segment=xxx) set by home page sector cards
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("segment");
      if (param) return param;
    }
    return "";
  });

  // Sync segment when URL param changes (e.g. user goes home → picks another sector)
  useEffect(() => {
    const param = new URLSearchParams(searchStr).get("segment");
    if (param) setSegment(param);
  }, [searchStr]);
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [finderOpen, setFinderOpen] = useState(false);
  const { data: user } = useUser();
  const [salesOffer, setSalesOffer] = useState<{ title: string; body: string; cta: string } | null>(null);
  const [showSalesOffer, setShowSalesOffer] = useState(false);

  useEffect(() => {
    if (user) return;
    const timer = setTimeout(async () => {
      try {
        const data = await apiRequest("POST", "/api/ai/analyze", {
          text: `أنت مساعد مبيعات ذكي لـ QIROX Studio. مستخدم جديد يتصفح صفحة الأسعار منذ 15 ثانية ولم يختر باقة بعد. اكتب رسالة مقنعة قصيرة جداً (3 أسطر) لتشجيعه على التواصل أو اختيار الباقة المناسبة. اجعلها ودية ومُلحّة بلطف. أجب بـ JSON فقط: {"title":"عنوان قصير","body":"رسالة قصيرة 2-3 جمل","cta":"نص زر الدعوة للفعل"}`
        });
        if (data?.result) {
          const jsonMatch = data.result.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const offer = JSON.parse(jsonMatch[0]);
            setSalesOffer(offer);
            setShowSalesOffer(true);
          }
        }
      } catch {}
    }, 18000);
    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    if (!segment && segments.length > 0) setSegment(segments[0].key);
  }, [segments, segment]);

  const activeSeg = segments.find(s => s.key === segment) ?? segments[0] ?? { key: "general", labelAr: "عام", labelEn: "General", icon: Globe, color: "text-slate-400", bg: "bg-slate-500/10" };
  const tierPlans = plans?.filter((p: any) =>
    p.segment === segment && ["lite","pro","infinite"].includes(p.tier ?? "")
  ).sort((a: any, b: any) =>
    (({ lite:1, pro:2, infinite:3 } as Record<string,number>)[a.tier ?? ""] ?? 9) - (({ lite:1, pro:2, infinite:3 } as Record<string,number>)[b.tier ?? ""] ?? 9)
  ) ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#080810]" dir={dir}>
      <Navigation />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-black">
        <div className="absolute inset-0 pointer-events-none opacity-[0.055]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-[#080810] to-transparent pointer-events-none" />

        <div className="relative container mx-auto px-4 max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Eyebrow */}
            <div className="flex items-center gap-2 pt-24 mb-6">
              <span className="w-2 h-2 rounded-full bg-white/40 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
                {lang === "ar" ? "مصنع الأنظمة الرقمية" : "DIGITAL SYSTEMS FACTORY"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center pb-20">
              <div>
                <h1 className="text-5xl md:text-6xl font-black text-white mb-5 leading-[1.05] tracking-tight">
                  {lang === "ar"
                    ? <><span>باقات</span><br /><span className="text-white/60">مبنية</span><br /><span className="text-white/25">لقطاعك</span></>
                    : <><span>Plans</span><br /><span className="text-white/60">built</span><br /><span className="text-white/25">for your sector</span></>}
                </h1>
                <p className="text-white/40 text-base leading-relaxed max-w-sm mb-8">
                  {lang === "ar"
                    ? "كل قطاع له نظامه الخاص المبرمج من الصفر — ليس قالبًا جاهزًا، بل مصنع مخصص لك."
                    : "Every sector has its own system built from scratch — not a template, a factory built for you."}
                </p>
                {/* Stats row */}
                <div className="flex items-center gap-6 mb-8">
                  {[
                    { val: "100+", label: lang === "ar" ? "نظام مُسلَّم" : "Delivered" },
                    { val: "3",    label: lang === "ar" ? "مستويات" : "Tiers" },
                    { val: "7",    label: lang === "ar" ? "قطاعات" : "Sectors" },
                  ].map(s => (
                    <div key={s.val}>
                      <p className="text-2xl font-black text-white">{s.val}</p>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Package Finder CTA */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFinderOpen(true)}
                  data-testid="button-open-package-finder"
                  className="group relative flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-white/[0.12] bg-white/[0.06] hover:bg-white/[0.1] hover:border-white/25 transition-all duration-300 text-right max-w-xs"
                >
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-4 h-4 text-black" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">
                      {lang === "ar" ? "اعرف باقتك الخاصة بك" : "Find Your Package"}
                    </p>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      {lang === "ar" ? "سؤالين وأختار لك الأنسب 🤖" : "AI recommends your perfect plan"}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </motion.button>
              </div>

              {/* ── Marketing Visual ── */}
              <div className="relative">
                <PricesHeroVisual lang={lang} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── SEGMENT SELECTOR ─── */}
      <section className="py-6 border-b border-gray-200 dark:border-slate-800/80 bg-gray-50/80 dark:bg-[#0a0a14] sticky top-0 z-20 backdrop-blur-sm">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-wrap items-center gap-2" data-testid="segment-selector">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-600 ml-2">
              {lang === "ar" ? "القطاع :" : "SECTOR :"}
            </span>
            {segments.map(seg => {
              const Icon = seg.icon;
              const isActive = segment === seg.key;
              return (
                <motion.button
                  key={seg.key} onClick={() => setSegment(seg.key)}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  data-testid={`btn-segment-${seg.key}`}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? "bg-gray-900 text-white dark:bg-white dark:text-slate-900 border-gray-900 dark:border-white"
                      : "border-gray-300 dark:border-slate-700/60 text-gray-500 dark:text-slate-500 hover:border-gray-400 dark:hover:border-slate-600 hover:text-gray-700 dark:hover:text-slate-300 bg-transparent"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white dark:text-slate-700" : seg.color}`} />
                  {lang === "ar" ? seg.labelAr : seg.labelEn}
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── BILLING PERIOD TABS ─── */}
      <section className="py-5 bg-white dark:bg-[#0a0a14] border-b border-gray-200 dark:border-slate-800/60">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-wrap items-center gap-2" data-testid="billing-period-selector">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-600 ml-2">
              {lang === "ar" ? "عرض المميزات :" : "FEATURES :"}
            </span>
            {PERIODS.map(({ key, labelAr, labelEn, icon: PIcon }) => {
              const pLabel = lang === "ar" ? labelAr : labelEn;
              const isActive = period === key;
              return (
                <button key={key} onClick={() => setPeriod(key)} data-testid={`tab-period-${key}`}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all border ${
                    isActive
                      ? "bg-black dark:bg-white border-black dark:border-white text-white dark:text-slate-900 shadow-lg shadow-black/10"
                      : "border-gray-300 dark:border-slate-700/60 text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-400 dark:hover:border-slate-600"
                  }`}
                >
                  <PIcon className="w-3 h-3" />
                  {pLabel}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── TIER CARDS ─── */}
      <section className="py-14 bg-gray-100 dark:bg-[#0a0a14]">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Context breadcrumb */}
          <div className="flex items-center gap-3 mb-10">
            <div className={`w-7 h-7 rounded-lg ${activeSeg.bg} flex items-center justify-center`}>
              <activeSeg.icon className={`w-4 h-4 ${activeSeg.color}`} />
            </div>
            <span className="text-sm font-black text-gray-800 dark:text-slate-200">{lang === "ar" ? activeSeg.labelAr : activeSeg.labelEn}</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-slate-700" />
            <span className="text-xs font-medium text-gray-500 dark:text-slate-500">{lang === "ar" ? "الباقات المتاحة" : "Available Plans"}</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.07] text-gray-500 dark:text-slate-400">
              {lang === "ar" ? "السعر على حسب الاحتياج" : "Custom Pricing"}
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-black dark:border-white" />
                <Loader2 className="w-12 h-12 animate-spin text-black dark:text-white" />
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-600 uppercase tracking-wider">{lang === "ar" ? "جاري تحميل الأنظمة..." : "Loading systems..."}</p>
            </div>
          ) : tierPlans.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-gray-300 dark:border-slate-800 rounded-2xl">
              <Gift className="w-10 h-10 text-gray-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-slate-500 text-sm">{lang === "ar" ? "لا توجد باقات لهذا القطاع بعد" : "No plans for this sector yet"}</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${segment}-${period}`}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-5"
              >
                {tierPlans.map((plan: any, idx: number) => (
                  <TierCard key={`${plan.id}-${period}`} plan={plan} period={period} idx={idx} isPopularOverride={plan.tier === "pro"} lang={lang} whatsapp={publicSettings?.whatsapp} />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* ─── COMPARISON TABLE ─── */}
      {tierPlans.length === 3 && (
        <section className="pb-16 bg-gray-100 dark:bg-[#0a0a14]">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-200 dark:bg-slate-800" />
              <h2 className="text-[10px] font-black text-gray-400 dark:text-slate-600 uppercase tracking-[0.2em] px-4">
                {lang === "ar" ? "مقارنة الباقات" : "PLAN COMPARISON"}
              </h2>
              <div className="flex-1 h-px bg-gray-200 dark:bg-slate-800" />
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-slate-800 overflow-x-auto bg-white dark:bg-transparent">
              <div className="min-w-[480px]">
                <div className="grid grid-cols-4 bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-800">
                  <div className="p-4 text-[9px] font-black text-gray-400 dark:text-slate-600 uppercase tracking-wider">
                    {lang === "ar" ? "الميزة" : "Feature"}
                  </div>
                  {tierPlans.map((p: any) => {
                    const cfg = TIER_CONFIG[p.tier] || TIER_CONFIG.lite;
                    return (
                      <div key={p.id} className="p-4 text-center">
                        <span className="text-xs font-black text-gray-700 dark:text-slate-300">
                          {lang === "ar" ? cfg.labelAr : cfg.labelEn}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {[
                  { label: lang === "ar" ? "السعر" : "Price", values: tierPlans.map(() => lang === "ar" ? <span className="text-xs font-bold text-gray-700 dark:text-slate-300">على حسب الاحتياج</span> : <span className="text-xs font-bold text-gray-700 dark:text-slate-300">Custom</span>) },
                  { label: lang === "ar" ? "عدد الميزات" : "Features", values: tierPlans.map((p: any) => lang === "ar" ? `${p.featuresAr?.length ?? 0} ميزة` : `${p.featuresAr?.length ?? 0} features`) },
                  { label: lang === "ar" ? "دعم فني"           : "Support",        values: lang === "ar" ? ["شهر واحد", "6 أشهر", "24/7 أولوية"] : ["1 month", "6 months", "24/7 Priority"] },
                  { label: lang === "ar" ? "تطبيق جوال"        : "Mobile App",     values: [false, false, true] },
                  { label: lang === "ar" ? "دومين مجاني"       : "Free Domain",    values: lang === "ar" ? [false, "سنة واحدة", "3 سنوات"] : [false, "1 year", "3 years"] },
                  { label: lang === "ar" ? "دعم متعدد القنوات" : "Multi-channel",  values: [false, true, true] },
                ].map((row, i) => (
                  <div key={i} className={`grid grid-cols-4 border-b border-gray-100 dark:border-slate-800 last:border-0 ${i % 2 !== 0 ? "bg-gray-50/50 dark:bg-slate-900/20" : ""}`}>
                    <div className="p-3.5 text-xs text-gray-500 dark:text-slate-500 font-medium">{row.label}</div>
                    {row.values.map((val: any, vi) => (
                      <div key={vi} className="p-3.5 text-center">
                        {typeof val === "boolean"
                          ? val
                            ? <Check className="w-4 h-4 text-black dark:text-white dark:text-black/70 dark:text-white/70 mx-auto" />
                            : <X className="w-4 h-4 text-gray-300 dark:text-slate-700 mx-auto" />
                          : <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">{val}</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}



      {/* ─── CTA ─── */}
      <section className="py-16 bg-white dark:bg-[#050508] border-t border-gray-200 dark:border-slate-800/60">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-[9px] font-black text-gray-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-4">
                {lang === "ar" ? "باقة مخصصة" : "CUSTOM PLAN"}
              </p>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">
                {lang === "ar" ? "تحتاج عرضاً خاصاً؟" : "Need a custom quote?"}
              </h2>
              <p className="text-gray-500 dark:text-slate-500 text-sm leading-relaxed">
                {lang === "ar"
                  ? "تواصل معنا وسنعدّ لك عرضاً يناسب احتياجاتك وميزانيتك تماماً."
                  : "Contact us and we'll prepare a quote tailored exactly to your needs."}
              </p>
            </div>
            <div className="flex md:justify-end">
              <Link href="/contact">
                <Button size="lg" className="bg-gray-900 dark:bg-white text-white dark:text-slate-900 h-12 px-8 rounded-xl font-black hover:bg-black dark:hover:bg-slate-100 gap-2" data-testid="button-custom-pricing">
                  {lang === "ar" ? "تواصل معنا الآن" : "Contact Us Now"} <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PackageFinderModal open={finderOpen} onClose={() => setFinderOpen(false)} />

      {/* Smart Sales Assistant Popup */}
      <AnimatePresence>
        {showSalesOffer && salesOffer && (
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 end-6 z-50 w-80 bg-gradient-to-br from-[#1a1b2e] to-[#0f1020] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
            data-testid="card-sales-assistant"
          >
            <div className="p-4">
              <button onClick={() => setShowSalesOffer(false)} className="absolute top-3 end-3 text-white/30 hover:text-white transition-colors" data-testid="button-close-sales">
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-black dark:from-white to-black dark:to-white flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="text-white font-semibold text-sm">{salesOffer.title}</span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed mb-4">{salesOffer.body}</p>
              <Button
                onClick={() => { setShowSalesOffer(false); setFinderOpen(true); }}
                className="w-full bg-gradient-to-r from-black dark:from-white to-black dark:to-white hover:from-black dark:from-white hover:to-black dark:to-white text-white h-9 text-sm font-semibold"
                data-testid="button-sales-cta"
              >
                {salesOffer.cta || "ابدأ الآن"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Extra add-ons section — driven by the official QIROX catalog API
// ─────────────────────────────────────────────────────────────────────────
const ADDON_ICON_MAP: Record<string, any> = {
  Plus, Smartphone, TrendingUp, Palette, Database, Bell, Cpu, Sparkles,
  Globe, Server, BarChart3, Layers, Shield, Lock, Users, Rocket, Boxes,
  Code2, LayoutDashboard, Zap, Star, Mail: Bell,
};

const BILLING_LABEL: Record<string, { ar: string; en: string }> = {
  one_time: { ar: "مرة واحدة", en: "One-time" },
  monthly:  { ar: "شهرياً",    en: "Monthly" },
  annual:   { ar: "سنوياً",    en: "Annual" },
  lifetime: { ar: "مدى الحياة", en: "Lifetime" },
};

function ExtraAddonsSection({ lang }: { lang: string }) {
  const { data: addons = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/extra-addons"] });
  const L = lang === "ar";

  const visible = (addons || []).filter((a: any) => a.isActive !== false);

  return (
    <section className="py-16 bg-gray-50 dark:bg-[#080810]" data-testid="section-extra-addons">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-black dark:bg-white flex items-center justify-center">
            <Plus className="w-4 h-4 text-white dark:text-black" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              {L ? "كتالوج الميزات الإضافية الرسمي" : "Official Add-ons Catalog"}
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-500">
              {L ? "أسعار رسمية موحّدة — تُضاف إلى أي باقة" : "Official unified pricing — add to any plan"}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 dark:text-slate-600 mb-8 ms-11">
          {L ? "الأسعار شاملة، والميزات المخصّصة لمشروعك تظهر هنا أيضاً عند تسجيل الدخول." : "Prices are inclusive. Your custom features appear here when you're signed in."}
        </p>

        {isLoading ? (
          <div className="text-center py-16 text-xs text-gray-400 dark:text-slate-600 uppercase tracking-widest">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            {L ? "جارٍ تحميل الكتالوج..." : "Loading catalog..."}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-300 dark:border-slate-800 rounded-2xl">
            <Gift className="w-10 h-10 text-gray-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-slate-500">
              {L ? "لا توجد ميزات إضافية متاحة حالياً." : "No add-ons available right now."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((a: any, idx: number) => {
              const Icon = ADDON_ICON_MAP[a.icon] || Plus;
              const isCustom = !!a.isCustom;
              const billing = BILLING_LABEL[a.billingType || "one_time"];
              const quotaTxt = a.quotaCount > 0
                ? `${a.quotaCount.toLocaleString()} ${a.quotaLabel || (L ? "وحدة" : "units")}`
                : null;
              return (
                <motion.div
                  key={a.id || a._id || idx}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(idx * 0.04, 0.3) }}
                  className={`relative rounded-2xl border bg-white dark:bg-white/[0.025] p-5 transition-colors ${
                    isCustom
                      ? "border-black dark:border-white"
                      : "border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30"
                  }`}
                  data-testid={`card-addon-${a.id || a._id || idx}`}
                >
                  {isCustom && (
                    <span className="absolute top-3 end-3 text-[9px] font-black tracking-[0.18em] uppercase px-2 py-0.5 rounded-full bg-black text-white dark:bg-white dark:text-black">
                      {L ? "مخصّص لك" : "Custom"}
                    </span>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-gray-700 dark:text-slate-200" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 dark:text-slate-600 mb-1">
                    {a.category || "Feature"}
                  </p>
                  <h3 className="text-gray-900 dark:text-white font-black text-base mb-1" data-testid={`text-addon-name-${a.id || idx}`}>
                    {L ? (a.nameAr || a.name) : (a.name || a.nameAr)}
                  </h3>
                  {(L ? a.descriptionAr : a.description) && (
                    <p className="text-xs text-gray-500 dark:text-slate-500 leading-relaxed mb-4 line-clamp-2">
                      {L ? a.descriptionAr : a.description}
                    </p>
                  )}
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-3xl font-black text-gray-900 dark:text-white">
                      {Number(a.price || 0).toLocaleString()}
                    </span>
                    {L ? <SARIcon size={13} className="opacity-60" /> : <span className="text-sm text-gray-400 dark:text-slate-600">SAR</span>}
                    <span className="text-[10px] text-gray-400 dark:text-slate-600 ms-1">/ {billing[L ? "ar" : "en"]}</span>
                  </div>
                  {quotaTxt && (
                    <p className="text-[11px] text-gray-500 dark:text-slate-500 mb-4">
                      {L ? "يشمل: " : "Includes: "} <span className="font-semibold text-gray-700 dark:text-slate-300">{quotaTxt}</span>
                    </p>
                  )}
                  <Link href="/order">
                    <Button
                      variant="outline"
                      className="w-full h-9 rounded-lg font-bold text-xs mt-3 border-gray-300 dark:border-white/15 text-gray-700 dark:text-slate-200 hover:bg-black hover:text-white hover:border-black dark:hover:bg-white dark:hover:text-black dark:hover:border-white"
                      data-testid={`button-add-addon-${a.id || idx}`}
                    >
                      {L ? "أضف لطلبي" : "Add to my order"}
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
