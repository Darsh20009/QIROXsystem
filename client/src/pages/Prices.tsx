import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { usePricingPlans } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import SARIcon from "@/components/SARIcon";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useState, useMemo, useEffect } from "react";
import {
  Loader2, Check, ArrowLeft, X, Globe, Tag, Gift, Plus, Shield,
  Smartphone, Palette, TrendingUp, Infinity as InfinityIcon, Crown, CalendarDays, CalendarRange,
  Calendar, Zap, Star, UtensilsCrossed, ShoppingBag, GraduationCap, Building2, Home, Heart, ChevronRight,
  Dumbbell, Store, CheckCircle2, Sparkles, ShoppingCart, Cpu, Code2, Server, Database, LayoutDashboard,
  Bell, Users, Lock, BarChart3, Layers, Rocket, Boxes
} from "lucide-react";
import { QiroxIcon } from "@/components/qirox-brand";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { PackageFinderModal } from "@/components/PackageFinderModal";

type BillingPeriod = "monthly" | "sixmonth" | "annual" | "lifetime";

const PERIODS: { key: BillingPeriod; labelAr: string; labelEn: string; sublabelAr: string; sublabelEn: string; icon: any; badgeAr?: string; badgeEn?: string }[] = [
  { key: "monthly",  labelAr: "شهري",       labelEn: "Monthly",   sublabelAr: "ادفع كل شهر",   sublabelEn: "Pay monthly",    icon: Calendar },
  { key: "sixmonth", labelAr: "نصف سنوي",   labelEn: "6 Months",  sublabelAr: "6 أشهر",         sublabelEn: "6 months",       icon: CalendarRange, badgeAr: "وفّر 30%", badgeEn: "Save 30%" },
  { key: "annual",   labelAr: "سنوي",       labelEn: "Annual",    sublabelAr: "سنة كاملة",      sublabelEn: "Full year",      icon: CalendarDays,  badgeAr: "الأوفر",   badgeEn: "Best Value" },
  { key: "lifetime", labelAr: "مدى الحياة", labelEn: "Lifetime",  sublabelAr: "دفعة واحدة",     sublabelEn: "One-time",       icon: InfinityIcon,  badgeAr: "دائم",     badgeEn: "Forever" },
];

const SEGMENT_LOOKUP: Record<string, { labelAr: string; labelEn: string; icon: any; color: string; bg: string }> = {
  restaurant:    { labelAr: "مطاعم ومقاهي",    labelEn: "Restaurants",   icon: UtensilsCrossed, color: "text-orange-400", bg: "bg-orange-500/10" },
  ecommerce:     { labelAr: "متاجر إلكترونية", labelEn: "E-Commerce",    icon: ShoppingBag,     color: "text-blue-400",   bg: "bg-blue-500/10" },
  store:         { labelAr: "متاجر إلكترونية", labelEn: "E-Commerce",    icon: Store,           color: "text-blue-400",   bg: "bg-blue-500/10" },
  education:     { labelAr: "منصات تعليمية",   labelEn: "Education",     icon: GraduationCap,   color: "text-violet-400", bg: "bg-violet-500/10" },
  corporate:     { labelAr: "شركات ومؤسسات",   labelEn: "Corporate",     icon: Building2,       color: "text-slate-400",  bg: "bg-slate-500/10" },
  other:         { labelAr: "شركات ومؤسسات",   labelEn: "Corporate",     icon: Building2,       color: "text-slate-400",  bg: "bg-slate-500/10" },
  realestate:    { labelAr: "عقارات",           labelEn: "Real Estate",   icon: Home,            color: "text-teal-400",   bg: "bg-teal-500/10" },
  healthcare:    { labelAr: "صحة وعيادات",      labelEn: "Healthcare",    icon: Heart,           color: "text-rose-400",   bg: "bg-rose-500/10" },
  health:        { labelAr: "صحة ولياقة",       labelEn: "Health",        icon: Heart,           color: "text-rose-400",   bg: "bg-rose-500/10" },
  fitness:       { labelAr: "لياقة وجيم",       labelEn: "Fitness",       icon: Dumbbell,        color: "text-green-400",  bg: "bg-green-500/10" },
  beauty:        { labelAr: "تجميل وصالونات",  labelEn: "Beauty",        icon: Sparkles,        color: "text-pink-400",   bg: "bg-pink-500/10" },
  tech:          { labelAr: "تقنية وبرمجة",    labelEn: "Technology",    icon: Globe,           color: "text-cyan-400",   bg: "bg-cyan-500/10" },
  food:          { labelAr: "مطاعم ومقاهي",    labelEn: "Restaurants",   icon: UtensilsCrossed, color: "text-orange-400", bg: "bg-orange-500/10" },
  commerce:      { labelAr: "متاجر إلكترونية", labelEn: "E-Commerce",    icon: ShoppingBag,     color: "text-blue-400",   bg: "bg-blue-500/10" },
  institutional: { labelAr: "مؤسسات وجمعيات",  labelEn: "Institutions",  icon: Building2,       color: "text-slate-400",  bg: "bg-slate-500/10" },
  personal:      { labelAr: "خدمات شخصية",     labelEn: "Personal",      icon: Globe,           color: "text-purple-400", bg: "bg-purple-500/10" },
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
    borderColor: "border-blue-500/50",
    accentColor: "text-white",
    accentGlow: "shadow-[0_0_40px_rgba(59,130,246,0.25)]",
    priceColor: "text-white",
    featureColor: "text-blue-100/80",
    badgeBg: "bg-white/10",
    badgeText: "text-white",
    ctaBg: "bg-white hover:bg-blue-50 text-blue-700",
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
    borderColor: "border-amber-500/30",
    accentColor: "text-amber-300",
    accentGlow: "shadow-[0_0_50px_rgba(245,158,11,0.15)]",
    priceColor: "text-white",
    featureColor: "text-slate-300/80",
    badgeBg: "bg-amber-400/10",
    badgeText: "text-amber-300",
    ctaBg: "bg-amber-400 hover:bg-amber-500 text-slate-900",
    ctaText: "",
    patternColor: "opacity-[0.07]",
    taglinePrimary: "بلا حدود",
    taglineSecondary: "No limits",
    tierNum: "03",
  },
};

function getPeriodPrice(plan: any, period: BillingPeriod): number {
  if (period === "monthly")  return plan.monthlyPrice  ?? 0;
  if (period === "sixmonth") return plan.sixMonthPrice ?? 0;
  if (period === "annual")   return plan.annualPrice   ?? 0;
  return plan.lifetimePrice ?? plan.price ?? 0;
}
function getPeriodSuffix(period: BillingPeriod, lang: string): string {
  if (lang === "en") {
    if (period === "monthly")  return "/ mo";
    if (period === "sixmonth") return "/ 6 mo";
    if (period === "annual")   return "/ yr";
    return "";
  }
  if (period === "monthly")  return "/ شهر";
  if (period === "sixmonth") return "/ 6 أشهر";
  if (period === "annual")   return "/ سنة";
  return "";
}

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
function TierCard({ plan, period, idx, isPopularOverride, onSelect, lang, isLoading }: {
  plan: any; period: BillingPeriod; idx: number; isPopularOverride?: boolean;
  onSelect: (plan: any, price: number, period: BillingPeriod) => void; lang: string; isLoading?: boolean;
}) {
  const cfg = TIER_CONFIG[plan.tier] || TIER_CONFIG.lite;
  const price = getPeriodPrice(plan, period);
  const isPopular = plan.isPopular || isPopularOverride;
  const isPro = plan.tier === "pro";
  const isInfinite = plan.tier === "infinite";
  const monthlyBase = plan.monthlyPrice ?? 0;
  const monthlyEquiv = period === "monthly" ? price
    : period === "sixmonth" ? Math.round(price / 6)
    : period === "annual"   ? Math.round(price / 12) : null;
  const saving = monthlyEquiv && monthlyBase ? Math.round(((monthlyBase - monthlyEquiv) / monthlyBase) * 100) : 0;
  const features = (lang === "ar" ? plan.featuresAr : (plan.featuresEn || plan.featuresAr)) ?? [];
  const TierIcon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-500
        hover:-translate-y-1 hover:shadow-2xl cursor-pointer group
        ${cfg.cardBg} ${cfg.borderColor} ${cfg.accentGlow}`}
      onClick={() => onSelect(plan, price, period)}
      data-testid={`card-tier-${plan.tier}`}
    >
      {/* Popular glow line */}
      {isPopular && (
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
      )}

      {/* Decorative background */}
      <div className={`absolute inset-0 text-gray-300 dark:text-slate-400 ${cfg.patternColor} pointer-events-none`}>
        <GridPattern />
      </div>

      {/* Amber constellation dots for Infinite */}
      {isInfinite && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[[15,20],[85,35],[45,60],[70,15],[30,75],[90,65],[10,85],[55,40]].map(([x,y],i) => (
            <div key={i} className="absolute w-0.5 h-0.5 rounded-full bg-amber-400/40"
              style={{ left:`${x}%`, top:`${y}%` }} />
          ))}
        </div>
      )}

      {/* ─── Header ─── */}
      <div className={`relative px-6 pt-6 pb-5 bg-gradient-to-br ${cfg.headerGrad}`}>
        {/* Tier number badge */}
        <div className={`absolute top-4 ${lang === "ar" ? "left-4" : "right-4"} text-[11px] font-black tracking-[0.2em] ${isInfinite ? "text-amber-400/40" : isPro ? "text-white/20" : "text-gray-300 dark:text-slate-600"}`}>
          {cfg.tierNum}
        </div>

        {/* Popular badge */}
        {isPopular && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 + 0.3 }}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full mb-3 shadow-lg shadow-blue-500/30"
          >
            <Crown className="w-3 h-3" /> {lang === "ar" ? "الأكثر طلباً" : "Most Popular"}
          </motion.div>
        )}

        {/* Icon + Name */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.badgeBg}`}>
            <TierIcon className={`w-5 h-5 ${isInfinite ? "text-amber-400" : isPro ? "text-blue-200" : "text-gray-500 dark:text-slate-300"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-0.5 ${isPro ? "text-white/40" : isInfinite ? "text-amber-400/50" : "text-gray-400 dark:text-slate-500"}`}>QIROX SYSTEMS</p>
            <p className={`font-black text-base leading-tight truncate ${cfg.accentColor}`}>
              {lang === "ar" ? plan.nameAr : (plan.nameEn || plan.nameAr)}
            </p>
          </div>
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border shrink-0 ${cfg.badgeBg} ${cfg.badgeText} ${isInfinite ? "border-amber-400/20" : isPro ? "border-white/15" : "border-gray-300 dark:border-slate-600"}`}>
            {lang === "ar" ? cfg.labelAr : cfg.labelEn}
          </span>
        </div>

        {/* Tagline */}
        <p className={`text-xs font-bold tracking-wider ${isInfinite ? "text-amber-400/60" : isPro ? "text-white/30" : "text-gray-400 dark:text-slate-500"}`}>
          — {lang === "ar" ? cfg.taglinePrimary : cfg.taglineSecondary}
        </p>
      </div>

      {/* ─── Price ─── */}
      <div className={`relative px-6 py-5 border-t ${isInfinite ? "border-amber-400/10 bg-white/[0.02]" : isPro ? "border-white/10 bg-white/[0.05]" : "border-gray-100 bg-gray-50 dark:border-slate-800/60 dark:bg-[#0f172a]"}`}>
        <AnimatePresence mode="wait">
          <motion.div key={`${plan.tier}-${period}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className={`text-4xl font-black tracking-tight ${cfg.priceColor}`}>{price.toLocaleString()}</span>
              {lang === "ar"
                ? <SARIcon size={16} className={`${isPro || isInfinite ? "opacity-40" : "opacity-60"}`} />
                : <span className={`text-sm font-medium ${isPro || isInfinite ? "text-white/40" : "text-gray-400 dark:text-slate-400"}`}>SAR</span>}
              <span className={`text-xs ${isPro || isInfinite ? "text-white/30" : "text-gray-400 dark:text-slate-400"}`}>{getPeriodSuffix(period, lang)}</span>
            </div>
            {monthlyEquiv && period !== "monthly" && (
              <div className={`mt-2 flex items-center gap-2 flex-wrap text-[11px] ${isPro || isInfinite ? "text-white/40" : "text-gray-500 dark:text-slate-400"}`}>
                <span className="flex items-center gap-1">= <span className="font-semibold flex items-center gap-0.5">{monthlyEquiv.toLocaleString()} {lang === "ar" ? <SARIcon size={10} className="opacity-70" /> : "SAR"}/شهر</span></span>
                {saving > 0 && <span className={`font-black text-emerald-${isPro ? "300" : "500"}`}>{lang === "ar" ? `— وفّر ${saving}%` : `— Save ${saving}%`}</span>}
              </div>
            )}
            {period === "lifetime" && (
              <p className={`text-[11px] mt-2 flex items-center gap-1 ${isPro || isInfinite ? "text-white/40" : "text-gray-500 dark:text-slate-400"}`}>
                <Globe className="w-3 h-3" /> {lang === "ar" ? "دومين مجاني 3 سنوات" : "Free domain 3 years"}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── Features ─── */}
      <div className={`relative flex-1 px-6 py-5 ${isInfinite ? "bg-[#09090f]" : isPro ? "bg-[#1a3a6e]" : "bg-white dark:bg-[#0f172a]"}`}>
        <p className={`text-[9px] font-black uppercase tracking-[0.18em] mb-3.5 ${isInfinite ? "text-amber-400/40" : isPro ? "text-white/25" : "text-gray-400 dark:text-slate-500"}`}>
          {lang === "ar" ? "يشمل النظام" : "SYSTEM INCLUDES"}
        </p>
        <div className="space-y-2.5">
          {features.slice(0, 6).map((f: string, i: number) => {
            const FIcon = featureIcon(f);
            return (
              <div key={i} className="flex items-start gap-2.5">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${isInfinite ? "bg-amber-400/10" : isPro ? "bg-white/10" : "bg-gray-100 dark:bg-slate-800"}`}>
                  <FIcon className={`w-3 h-3 ${isInfinite ? "text-amber-400" : isPro ? "text-blue-200" : "text-gray-500 dark:text-slate-400"}`} />
                </div>
                <span className={`text-xs leading-snug ${cfg.featureColor}`}>{f}</span>
              </div>
            );
          })}
          {features.length > 6 && (
            <div className={`text-[10px] font-bold ${isInfinite ? "text-amber-400/40" : isPro ? "text-white/30" : "text-gray-400 dark:text-slate-400"} mr-7 rtl:mr-0 rtl:ml-7`}>
              {lang === "ar" ? `+ ${features.length - 6} ميزة أخرى` : `+ ${features.length - 6} more`}
            </div>
          )}
        </div>
      </div>

      {/* ─── CTA ─── */}
      <div className={`relative px-6 py-5 border-t ${isInfinite ? "border-amber-400/10 bg-[#09090f]" : isPro ? "border-white/10 bg-[#1a3a6e]" : "border-gray-100 bg-white dark:border-slate-800/60 dark:bg-[#0f172a]"}`}>
        <Button
          onClick={e => { e.stopPropagation(); if (!isLoading) onSelect(plan, price, period); }}
          disabled={isLoading}
          className={`w-full h-11 rounded-xl font-black text-sm gap-2 transition-all ${cfg.ctaBg}`}
          data-testid={`button-select-${plan.tier}`}
        >
          {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> {lang === "ar" ? "جارٍ الإضافة..." : "Adding..."}</> : <>{lang === "ar" ? `أضف للسلة` : `Add to Cart`} <ShoppingCart className="w-4 h-4" /></>}
        </Button>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────── */
export default function Prices() {
  const { data: plans, isLoading } = usePricingPlans();
  const { lang, dir } = useI18n();

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

  const [segment, setSegment] = useState("");
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [finderOpen, setFinderOpen] = useState(false);
  const [, navigate] = useLocation();
  const { data: user } = useUser();
  const { toast } = useToast();
  const [addingPlanId, setAddingPlanId] = useState<string | null>(null);
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

  const addToCartMutation = useMutation({
    mutationFn: async ({ plan, price, period }: { plan: any; price: number; period: BillingPeriod }) => {
      const periodLabelAr = PERIODS.find(p => p.key === period)?.labelAr ?? period;
      const periodLabelEn = PERIODS.find(p => p.key === period)?.labelEn ?? period;
      const tierLabelAr = TIER_CONFIG[plan.tier]?.labelAr ?? plan.tier;
      const segInfo = SEGMENT_LOOKUP[plan.segment];
      const cartItem = {
        type: "plan",
        refId: plan._id || plan.id || "",
        name: plan.nameEn || plan.nameAr || tierLabelAr,
        nameAr: plan.nameAr || tierLabelAr,
        price,
        qty: 1,
        config: {
          tier: plan.tier,
          tierLabel: tierLabelAr,
          segment: plan.segment,
          segmentLabel: segInfo?.labelAr || plan.segment,
          period,
          periodLabel: periodLabelAr,
          periodLabelEn,
        },
      };
      if (!user) {
        const existing = (() => { try { const s = localStorage.getItem("qiroxGuestCart"); return s ? JSON.parse(s) : { items: [] }; } catch { return { items: [] }; } })();
        const hadPlan = existing.items.some((i: any) => i.type === "plan" || i.type === "service");
        existing.items = existing.items.filter((i: any) => i.type !== "plan" && i.type !== "service");
        existing.items.push({ ...cartItem, _id: Date.now().toString() });
        localStorage.setItem("qiroxGuestCart", JSON.stringify(existing));
        return { guest: true, replaced: hadPlan };
      }
      const cachedCart = (queryClient.getQueryData(["/api/cart"]) as any);
      const hadPlan = Array.isArray(cachedCart?.items) && cachedCart.items.some((i: any) => i.type === "plan" || i.type === "service");
      const r = await apiRequest("POST", "/api/cart/items", cartItem);
      const data = await r.json();
      return { ...data, replaced: hadPlan };
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      setAddingPlanId(null);
      if (data?.replaced) {
        toast({ title: "✓ تم استبدال الباقة السابقة", description: "أُضيفت الباقة الجديدة كمشروع واحد في السلة" });
      } else {
        toast({ title: "✓ تمت إضافة الباقة للسلة", description: "يمكنك إضافة خدمات إضافية قبل إتمام الطلب" });
      }
      navigate("/cart");
    },
    onError: () => {
      setAddingPlanId(null);
      toast({ title: "تعذّر إضافة الباقة للسلة", variant: "destructive" });
    },
  });

  function handlePlanSelect(plan: any, price: number, p: BillingPeriod) {
    setAddingPlanId(plan._id || plan.id || plan.tier);
    addToCartMutation.mutate({ plan, price, period: p });
  }

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
      <section className="relative pt-24 pb-20 overflow-hidden bg-gray-50 dark:bg-[#080810]">
        {/* Background grid */}
        <div className="absolute inset-0 text-gray-300/[0.06] dark:text-slate-300/[0.04] pointer-events-none">
          <GridPattern />
        </div>
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-400/10 dark:bg-blue-600/10 blur-[80px] rounded-full" />
        </div>

        <div className="relative container mx-auto px-4 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center">
                <Boxes className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600/70 dark:text-blue-400/70">
                {lang === "ar" ? "مصنع الأنظمة الرقمية" : "DIGITAL SYSTEMS FACTORY"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-5 leading-[1.05] tracking-tight">
                  {lang === "ar"
                    ? <><span className="text-gray-900 dark:text-white">باقات</span><br /><span className="bg-gradient-to-l from-cyan-500 to-blue-500 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">مبنية</span><br /><span className="text-gray-400 dark:text-white/60">لقطاعك</span></>
                    : <><span className="text-gray-900 dark:text-white">Plans</span><br /><span className="bg-gradient-to-r from-cyan-500 to-blue-500 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">built</span><br /><span className="text-gray-400 dark:text-white/60">for your sector</span></>}
                </h1>
                <p className="text-gray-500 dark:text-slate-400 text-base leading-relaxed max-w-sm mb-8">
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
                      <p className="text-2xl font-black text-gray-900 dark:text-white">{s.val}</p>
                      <p className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-wider">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Package Finder CTA */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFinderOpen(true)}
                  data-testid="button-open-package-finder"
                  className="group relative flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-violet-500/10 hover:from-blue-500/20 hover:to-violet-500/20 hover:border-blue-500/50 transition-all duration-300 text-right max-w-xs"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {lang === "ar" ? "اعرف باقتك الخاصة بك" : "Find Your Package"}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                      {lang === "ar" ? "سؤالين وأختار لك الأنسب 🤖" : "AI recommends your perfect plan"}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </motion.button>
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
              {lang === "ar" ? "الفترة :" : "PERIOD :"}
            </span>
            {PERIODS.map(({ key, labelAr, labelEn, icon: PIcon, badgeAr, badgeEn }) => {
              const pLabel = lang === "ar" ? labelAr : labelEn;
              const pBadge = lang === "ar" ? badgeAr : badgeEn;
              const isActive = period === key;
              return (
                <button key={key} onClick={() => setPeriod(key)} data-testid={`tab-period-${key}`}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all border ${
                    isActive
                      ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/25"
                      : "border-gray-300 dark:border-slate-700/60 text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-400 dark:hover:border-slate-600"
                  }`}
                >
                  <PIcon className="w-3 h-3" />
                  {pLabel}
                  {pBadge && !isActive && (
                    <span className="text-[8px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">{pBadge}</span>
                  )}
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
          <div className="flex items-center gap-2 mb-10">
            <div className={`w-6 h-6 rounded-md ${activeSeg.bg} flex items-center justify-center`}>
              <activeSeg.icon className={`w-3.5 h-3.5 ${activeSeg.color}`} />
            </div>
            <span className="text-sm font-black text-gray-800 dark:text-slate-200">{lang === "ar" ? activeSeg.labelAr : activeSeg.labelEn}</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-slate-700" />
            <span className="text-xs text-gray-500 dark:text-slate-500">{lang === "ar" ? PERIODS.find(p => p.key === period)?.labelAr : PERIODS.find(p => p.key === period)?.labelEn}</span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                <Loader2 className="w-12 h-12 animate-spin text-blue-500/60" />
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
                  <TierCard key={`${plan.id}-${period}`} plan={plan} period={period} idx={idx} isPopularOverride={plan.tier === "pro"} onSelect={handlePlanSelect} lang={lang} isLoading={addToCartMutation.isPending && addingPlanId === (plan._id || plan.id || plan.tier)} />
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
                  { label: lang === "ar" ? `السعر (${PERIODS.find(p=>p.key===period)?.labelAr})` : `Price (${PERIODS.find(p=>p.key===period)?.labelEn})`, values: tierPlans.map((p: any) => lang === "ar" ? <span className="flex items-center justify-center gap-1 text-gray-800 dark:text-slate-200">{getPeriodPrice(p,period).toLocaleString()} <SARIcon size={10} className="opacity-70" /></span> : `${getPeriodPrice(p,period).toLocaleString()} SAR`) },
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
                            ? <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mx-auto" />
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

      {/* ─── DEMO TRIAL ─── */}
      <section className="py-14 bg-white dark:bg-[#050508] border-y border-gray-200 dark:border-slate-800/60">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="relative rounded-2xl border border-emerald-200 dark:border-emerald-500/20 overflow-hidden bg-emerald-50/50 dark:bg-transparent" data-testid="card-demo-plan">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 dark:from-emerald-950/30 to-transparent pointer-events-none" />
            <div className="relative grid grid-cols-1 md:grid-cols-2">
              <div className="p-8">
                <span className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-500/20 mb-5 uppercase tracking-widest">
                  <Rocket className="w-3 h-3" /> {lang === "ar" ? "جرّب قبل أن تشتري" : "Try before you buy"}
                </span>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{lang === "ar" ? "النسخة التجريبية" : "Free Trial"}</h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                  {lang === "ar" ? "جرّب نظامك الحقيقي لمدة 7 أيام — بدون تعهد بالشراء" : "Try your real system for 7 days — no purchase commitment"}
                </p>
                <div className="flex flex-wrap gap-2 mb-7">
                  {(lang === "ar"
                    ? ["7 أيام كاملة","نظام حقيقي","دعم فني","بدون تعهد","تُحسم من الباقة"]
                    : ["7 full days","Real system","Support","No commitment","Deducted from plan"]
                  ).map(f => (
                    <span key={f} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-400/8 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/15">
                      <Check className="w-3 h-3" />{f}
                    </span>
                  ))}
                </div>
                <Link href="/contact">
                  <Button className="h-11 px-7 rounded-xl font-black bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-900 gap-2 shadow-lg shadow-emerald-500/20" data-testid="button-demo-trial">
                    {lang === "ar" ? "ابدأ تجربتك المجانية" : "Start Free Trial"} <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="p-8 flex items-center justify-center border-t md:border-t-0 border-emerald-200 dark:border-emerald-500/10">
                <div className="text-center">
                  <div className="text-8xl font-black text-emerald-500 dark:text-emerald-400 mb-1 leading-none tabular-nums">30</div>
                  <div className="text-gray-500 dark:text-slate-400 font-bold text-sm flex items-center justify-center gap-1">
                    {lang === "ar" ? <><SARIcon size={13} /> فقط</> : "SAR only"}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-slate-600 mt-3 max-w-[160px]">
                    {lang === "ar" ? "تُحسم من قيمة الباقة عند الاشتراك" : "Deducted from plan price on subscribe"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ADDONS ─── */}
      <section className="py-16 bg-gray-50 dark:bg-[#080810]">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center">
              <Plus className="w-4 h-4 text-gray-600 dark:text-slate-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">{lang === "ar" ? "المميزات الإضافية" : "Additional Features"}</h2>
              <p className="text-xs text-gray-400 dark:text-slate-600">{lang === "ar" ? "تُضاف إلى أي باقة" : "Available on any plan"}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(lang === "ar" ? [
              { icon: Smartphone, label: "تطبيق جوال",  sub: "iOS + Android",        price: "1,000+", features: ["نشر App Store & Play","iOS و Android","إشعارات Push","تجربة أصيلة"], color: "text-gray-500 dark:text-slate-300", border: "border-gray-200 dark:border-slate-700/50", glow: "" },
              { icon: TrendingUp, label: "SEO & تسويق", sub: "تحسين محركات البحث",  price: "500+",   features: ["SEO احترافي","Google Analytics","Sitemap XML","تقرير شهري"],       color: "text-violet-500 dark:text-violet-300", border: "border-violet-200 dark:border-violet-700/30", glow: "" },
              { icon: Palette,    label: "هوية بصرية",  sub: "شعار + هوية كاملة",   price: "800+",   features: ["تصميم شعار","دليل الهوية","ألوان وخطوط","كل الصيغ"],            color: "text-amber-500 dark:text-amber-300", border: "border-amber-200 dark:border-amber-700/30", glow: "" },
            ] : [
              { icon: Smartphone, label: "Mobile App",      sub: "iOS + Android",    price: "1,000+", features: ["App Store & Play","iOS & Android","Push Notifications","Native experience"], color: "text-gray-500 dark:text-slate-300", border: "border-gray-200 dark:border-slate-700/50", glow: "" },
              { icon: TrendingUp, label: "SEO & Marketing", sub: "Search optimization", price: "500+", features: ["Professional SEO","Google Analytics","Sitemap XML","Monthly report"], color: "text-violet-500 dark:text-violet-300", border: "border-violet-200 dark:border-violet-700/30", glow: "" },
              { icon: Palette,    label: "Brand Identity",  sub: "Logo + full identity", price: "800+", features: ["Logo design","Brand guide","Colors & fonts","All formats"],      color: "text-amber-500 dark:text-amber-300", border: "border-amber-200 dark:border-amber-700/30", glow: "" },
            ]).map((a, ai) => (
              <motion.div
                key={a.label}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: ai * 0.08 }}
                className={`relative rounded-xl border ${a.border} bg-white dark:bg-white/[0.025] p-6 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors`}
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-5">
                  <a.icon className={`w-5 h-5 ${a.color}`} />
                </div>
                <p className="text-[9px] font-black text-gray-400 dark:text-slate-600 uppercase tracking-[0.18em] mb-0.5">{a.label}</p>
                <p className="text-gray-900 dark:text-white font-black text-base mb-4">{a.sub}</p>
                <div className="flex items-baseline gap-1.5 mb-5">
                  <span className="text-3xl font-black text-gray-900 dark:text-white">{a.price}</span>
                  {lang === "ar" ? <SARIcon size={13} className="opacity-50" /> : <span className="text-sm text-gray-400 dark:text-slate-600">SAR</span>}
                </div>
                <div className="space-y-2 mb-5">
                  {a.features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-500">
                      <Check className="w-3 h-3 text-emerald-500 shrink-0" />{f}
                    </div>
                  ))}
                </div>
                <Link href="/contact">
                  <Button variant="outline" className="w-full h-9 rounded-lg font-bold text-xs border-gray-300 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-400 dark:hover:border-slate-600">
                    {lang === "ar" ? "أضف للطلب" : "Add to order"}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

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
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="text-white font-semibold text-sm">{salesOffer.title}</span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed mb-4">{salesOffer.body}</p>
              <Button
                onClick={() => { setShowSalesOffer(false); setFinderOpen(true); }}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white h-9 text-sm font-semibold"
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
