import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  Check, Zap, Star, Crown, Infinity as InfinityIcon, Globe, Sparkles,
  UtensilsCrossed, ShoppingBag, Building2, GraduationCap, Heart, Home,
  Smartphone, Shield, BarChart3, Bell, Layers, Rocket, MessageSquare,
  Copy, X, Send, Loader2, ChevronRight, ChevronDown, Phone, Mail,
  User, Calendar, CalendarRange, CalendarDays, Bot, CheckCircle2,
  ArrowRight, ExternalLink, Tag, Palette, Lock, TrendingUp, Database,
  Server, LayoutDashboard, Dumbbell, Store, Users, MessageCircle,
  Minus, Plus, ScanLine, ClipboardList, ReceiptText, Printer, Truck,
  CreditCard, Award, Apple, PlayCircle, Gift, Clock, ChevronLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";

/* ─── Pricing Data ────────────────────────────────────────────────────── */
/* These prices match the original prices used in the employee/admin system
   (seeded in server/routes.ts). Each sector has lite/pro/infinity tiers
   with sm (6-month), yr (annual) and life (lifetime) prices. */
const PRICES = {
  restaurant: { lite: { sm: 380,  yr: 699,  life: 3499  }, pro: { sm: 650,  yr: 1199, life: 5999  }, infinity: { sm: 1100, yr: 1999, life: 9999  } },
  ecommerce:  { lite: { sm: 550,  yr: 999,  life: 4999  }, pro: { sm: 950,  yr: 1699, life: 7999  }, infinity: { sm: 1700, yr: 2999, life: 14999 } },
  education:  { lite: { sm: 750,  yr: 1299, life: 5999  }, pro: { sm: 1300, yr: 2299, life: 10999 }, infinity: { sm: 2300, yr: 3999, life: 19999 } },
  healthcare: { lite: { sm: 550,  yr: 999,  life: 4999  }, pro: { sm: 950,  yr: 1699, life: 7999  }, infinity: { sm: 1700, yr: 2999, life: 14999 } },
  realestate: { lite: { sm: 550,  yr: 999,  life: 4999  }, pro: { sm: 950,  yr: 1699, life: 7999  }, infinity: { sm: 1700, yr: 2999, life: 14999 } },
  corporate:  { lite: { sm: 950,  yr: 1699, life: 7999  }, pro: { sm: 1900, yr: 3299, life: 15999 }, infinity: { sm: 3800, yr: 6599, life: 29999 } },
  fitness:    { lite: { sm: 550,  yr: 999,  life: 4999  }, pro: { sm: 950,  yr: 1699, life: 7999  }, infinity: { sm: 1700, yr: 2999, life: 14999 } },
  beauty:     { lite: { sm: 380,  yr: 699,  life: 3499  }, pro: { sm: 650,  yr: 1199, life: 5999  }, infinity: { sm: 1100, yr: 1999, life: 9999  } },
  events:     { lite: { sm: 550,  yr: 999,  life: 4999  }, pro: { sm: 950,  yr: 1699, life: 7999  }, infinity: { sm: 1700, yr: 2999, life: 14999 } },
  marketing:  { lite: { sm: 750,  yr: 1299, life: 5999  }, pro: { sm: 1300, yr: 2299, life: 10999 }, infinity: { sm: 2300, yr: 3999, life: 19999 } },
  ai:         { lite: { sm: 950,  yr: 1699, life: 7999  }, pro: { sm: 1900, yr: 3299, life: 15999 }, infinity: { sm: 3800, yr: 6599, life: 29999 } },
  other:      { lite: { sm: 550,  yr: 999,  life: 4999  }, pro: { sm: 950,  yr: 1699, life: 7999  }, infinity: { sm: 1700, yr: 2999, life: 14999 } },
} as const;
type SectorKey = keyof typeof PRICES;
function multiYearPrice(annual: number, years: number) {
  let total = 0;
  for (let i = 0; i < years; i++) total += annual * Math.max(1 - i * 0.05, 0.6);
  return Math.round(total);
}
function multiYearDiscount(years: number) { return Math.min((years - 1) * 5, 40); }

/* ─── Features ────────────────────────────────────────────────────────── */
const RESTAURANT_FEATURES = {
  lite: [
    { icon: Globe,           ar: "موقع العميل الاحترافي" },
    { icon: LayoutDashboard, ar: "نظام إدارة الطاولات" },
    { icon: ScanLine,        ar: "نظام نقاط البيع (POS)" },
    { icon: Printer,         ar: "نظام طباعة الفواتير والطلبات" },
    { icon: Truck,           ar: "نظام تتبع الطلبات" },
    { icon: Layers,          ar: "الميزات الأساسية للنظام" },
  ],
  pro: [
    { icon: Zap,            ar: "كل مميزات لايت ✦" },
    { icon: BarChart3,      ar: "نظام المحاسبة المتكاملة" },
    { icon: Award,          ar: "نظام الولاء والنقاط" },
    { icon: Apple,          ar: "إضافة لـ Apple Wallet" },
    { icon: Users,          ar: "إدارة العملاء المتكاملة" },
    { icon: Star,           ar: "نظام التقييمات والمراجعات" },
    { icon: Layers,         ar: "نظام الـ Integrations" },
    { icon: CreditCard,     ar: "بوابة دفع إلكترونية مجانية" },
    { icon: Smartphone,     ar: "تطبيق PWA (ويب تطبيق)" },
    { icon: Bell,           ar: "إشعارات فورية (Push)" },
    { icon: Mail,           ar: "1,000 رسالة بريدية شهرياً" },
    { icon: CheckCircle2,   ar: "5 تعديلات ما بعد التسليم" },
  ],
  infinity: [
    { icon: Star,           ar: "كل مميزات برو ✦✦" },
    { icon: Mail,           ar: "5 بريد باسم المطعم/الكافيه" },
    { icon: MessageCircle,  ar: "10,000 رسالة بريدية شهرياً" },
    { icon: Building2,      ar: "توافق نظام الحضور والإدارة المؤسسية" },
    { icon: Database,       ar: "نظام مخزون وتقارير متقدمة" },
    { icon: Shield,         ar: "دعم أولوية 24/7 ومدير حساب مخصص" },
    { icon: Rocket,         ar: "20 تطوير/ميزة ما بعد التسليم" },
  ],
};
const ECOMMERCE_FEATURES = {
  lite: [
    { icon: Globe,           ar: "موقع متجر إلكتروني احترافي" },
    { icon: ShoppingBag,     ar: "نظام إدارة المنتجات والمخزون" },
    { icon: ReceiptText,     ar: "سلة التسوق وإدارة الطلبات" },
    { icon: Printer,         ar: "نظام طباعة الفواتير" },
    { icon: Truck,           ar: "نظام تتبع وشحن الطلبات" },
    { icon: Layers,          ar: "الميزات الأساسية للمتجر" },
  ],
  pro: [
    { icon: Zap,            ar: "كل مميزات لايت ✦" },
    { icon: BarChart3,      ar: "نظام المحاسبة والتقارير" },
    { icon: Award,          ar: "نظام الولاء والكوبونات" },
    { icon: Apple,          ar: "إضافة لـ Apple Wallet" },
    { icon: Users,          ar: "إدارة العملاء المتكاملة" },
    { icon: Star,           ar: "نظام التقييمات والمراجعات" },
    { icon: Layers,         ar: "نظام الـ Integrations" },
    { icon: CreditCard,     ar: "بوابة دفع إلكترونية مجانية" },
    { icon: Smartphone,     ar: "تطبيق PWA (ويب تطبيق)" },
    { icon: Bell,           ar: "إشعارات للطلبات الجديدة" },
    { icon: Mail,           ar: "1,000 رسالة بريدية شهرياً" },
    { icon: CheckCircle2,   ar: "5 تعديلات ما بعد التسليم" },
  ],
  infinity: [
    { icon: Star,           ar: "كل مميزات برو ✦✦" },
    { icon: Mail,           ar: "5 بريد باسم المتجر" },
    { icon: MessageCircle,  ar: "10,000 رسالة بريدية شهرياً" },
    { icon: Database,       ar: "نظام مخزون متكامل متقدم" },
    { icon: BarChart3,      ar: "تقارير وتحليلات متقدمة" },
    { icon: Shield,         ar: "دعم أولوية 24/7 ومدير حساب مخصص" },
    { icon: Rocket,         ar: "20 تطوير/ميزة ما بعد التسليم" },
  ],
};

const LIFETIME_PERKS = [
  { icon: Globe,    ar: "نطاق مجاني لمدة 3 سنوات" },
  { icon: Shield,   ar: "دعم تقني مستمر 3 سنوات من التسليم" },
  { icon: Server,   ar: "استضافة على خوادم كيروكس مدى الحياة" },
  { icon: Clock,    ar: "متابعة شخصية بعد 3 سنوات بـ 100 ريال/سنة فقط" },
];

const OTHER_SECTORS: { key: SectorKey; icon: any; ar: string }[] = [
  { key: "education",    icon: GraduationCap, ar: "تعليم وأكاديميات" },
  { key: "healthcare",   icon: Heart,         ar: "صحة وعيادات" },
  { key: "realestate",   icon: Home,          ar: "عقارات" },
  { key: "corporate",    icon: Building2,     ar: "شركات ومؤسسات" },
  { key: "fitness",      icon: Dumbbell,      ar: "لياقة وجيم" },
  { key: "beauty",       icon: Sparkles,      ar: "تجميل وصالونات" },
  { key: "events",       icon: Calendar,      ar: "فعاليات ومناسبات" },
  { key: "marketing",    icon: TrendingUp,    ar: "وكالات التسويق" },
  { key: "ai",           icon: Bot,           ar: "ذكاء اصطناعي" },
  { key: "other",        icon: Globe,         ar: "قطاع آخر" },
];

/* ─── Generic Features for "Other" Sectors ────────────────────────────── */
/* Used by sectors that don't have bespoke restaurant/ecommerce feature lists. */
const GENERIC_FEATURES = {
  lite: [
    { icon: Globe,           ar: "موقع احترافي مخصص للقطاع" },
    { icon: LayoutDashboard, ar: "لوحة تحكم متكاملة" },
    { icon: Layers,          ar: "الميزات الأساسية للنظام" },
    { icon: Smartphone,      ar: "تصميم متجاوب لكل الأجهزة" },
    { icon: Shield,          ar: "SSL مجاني وحماية كاملة" },
    { icon: CheckCircle2,    ar: "دعم فني شهرين بعد التسليم" },
  ],
  pro: [
    { icon: Zap,            ar: "كل مميزات لايت ✦" },
    { icon: BarChart3,      ar: "نظام تقارير وتحليلات" },
    { icon: Users,          ar: "إدارة العملاء المتكاملة" },
    { icon: Award,          ar: "نظام الولاء والنقاط" },
    { icon: CreditCard,     ar: "بوابة دفع إلكترونية" },
    { icon: Smartphone,     ar: "تطبيق PWA (ويب تطبيق)" },
    { icon: Bell,           ar: "إشعارات فورية (Push)" },
    { icon: Mail,           ar: "1,000 رسالة بريدية شهرياً" },
    { icon: CheckCircle2,   ar: "5 تعديلات ما بعد التسليم" },
  ],
  infinity: [
    { icon: Star,           ar: "كل مميزات برو ✦✦" },
    { icon: Mail,           ar: "5 بريد باسم النشاط" },
    { icon: MessageCircle,  ar: "10,000 رسالة بريدية شهرياً" },
    { icon: Database,       ar: "نظام بيانات وتقارير متقدمة" },
    { icon: Building2,      ar: "توافق نظام الإدارة المؤسسية" },
    { icon: Shield,         ar: "دعم أولوية 24/7 ومدير حساب مخصص" },
    { icon: Rocket,         ar: "20 تطوير/ميزة ما بعد التسليم" },
  ],
};

function featuresFor(sector: SectorKey, tier: "lite"|"pro"|"infinity") {
  if (sector === "restaurant") return RESTAURANT_FEATURES[tier];
  if (sector === "ecommerce")  return ECOMMERCE_FEATURES[tier];
  return GENERIC_FEATURES[tier];
}

const DURATION_OPTS = [
  { key: "sixmonth", ar: "6 أشهر", icon: CalendarRange },
  { key: "annual",   ar: "سنة", icon: CalendarDays },
  { key: "2y",       ar: "سنتان", icon: CalendarDays },
  { key: "3y",       ar: "3 سنوات", icon: CalendarDays },
  { key: "5y",       ar: "5 سنوات", icon: CalendarDays },
  { key: "lifetime", ar: "مدى الحياة", icon: InfinityIcon },
];

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function fmt(n: number) { return n.toLocaleString("ar-SA"); }

type Period = "sixmonth" | "annual" | "multiyear" | "lifetime";
type Sector = "restaurant" | "ecommerce" | "other";
type Tier   = "lite" | "pro" | "infinity";

/* ─── Plan Card ───────────────────────────────────────────────────────── */
const TIER_STYLES: Record<Tier, { bg: string; border: string; headerBg: string; textColor: string; badgeBg: string; btnBg: string; glow: string; tag: string }> = {
  lite: {
    bg: "bg-white dark:bg-[#0f172a]", border: "border-gray-200 dark:border-slate-700/50",
    headerBg: "bg-gray-50 dark:bg-[#111827]", textColor: "text-gray-900 dark:text-white",
    badgeBg: "bg-gray-100 dark:bg-slate-800", btnBg: "bg-gray-900 hover:bg-black text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900",
    glow: "", tag: "انطلق بثقة",
  },
  pro: {
    bg: "bg-[#1a3a6e]", border: "border-blue-400/20",
    headerBg: "from-[#1e40af] to-[#1a3a6e]", textColor: "text-white",
    badgeBg: "bg-white/10", btnBg: "bg-white hover:bg-blue-50 text-blue-900",
    glow: "shadow-[0_0_60px_rgba(59,130,246,0.18)]", tag: "النظام الأذكى",
  },
  infinity: {
    bg: "bg-[#09090f]", border: "border-amber-500/15",
    headerBg: "from-[#0f0f18] to-[#09090f]", textColor: "text-white",
    badgeBg: "bg-white/[0.07]", btnBg: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white",
    glow: "shadow-[0_0_60px_rgba(245,158,11,0.12)]", tag: "بلا حدود",
  },
};

function PlanCard({ tier, period, years, sector, onCustom, onOrder }: {
  tier: Tier; period: Period; years: number; sector: SectorKey;
  onCustom: ()=>void; onOrder: (info: { tier: Tier; period: Period; years: number; sector: string; price: number; label: string })=>void;
}) {
  const st = TIER_STYLES[tier];
  const prices = PRICES[sector][tier];
  const features = featuresFor(sector, tier);
  const isPro = tier === "pro";
  const isInfinity = tier === "infinity";
  const isLifetime = period === "lifetime";

  let price = 0, label = "", sublabel = "";
  if (period === "sixmonth") { price = prices.sm; label = "6 أشهر"; sublabel = `${fmt(prices.sm * 2)} / السنة`; }
  else if (period === "annual") { price = prices.yr; label = "سنة"; sublabel = "دفعة واحدة"; }
  else if (period === "multiyear") {
    price = multiYearPrice(prices.yr, years);
    const disc = multiYearDiscount(years);
    label = `${years} سنوات`;
    sublabel = disc > 0 ? `خصم ${disc}% على السنوات الإضافية` : "";
  }
  else { price = prices.life; label = "مدى الحياة"; sublabel = "دفعة واحدة للأبد"; }

  const icons = { lite: Zap, pro: Star, infinity: InfinityIcon };
  const TIcon = icons[tier];

  const tierNames = { lite: "لايت", pro: "برو", infinity: "إنفينتي" };
  const descrs = { lite: "الباقة الأساسية — مثالية للانطلاق", pro: "الباقة الذكية — الأكثر توازناً", infinity: "الباقة الشاملة — بلا قيود" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className={`relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${st.bg} ${st.border} ${st.glow}`}
      data-testid={`card-plan-${tier}`}
    >
      {isPro && <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-blue-400 to-transparent"/>}
      {isInfinity && <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent"/>}

      {/* Popular badge — outside the card, above it */}
      {isPro && (
        <div className="absolute -top-3.5 inset-x-0 flex justify-center">
          <span className="flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30">
            <Crown className="w-3 h-3"/> الأكثر طلباً
          </span>
        </div>
      )}

      {/* Header */}
      <div className={`px-6 pt-6 pb-5 bg-gradient-to-br ${isPro || isInfinity ? st.headerBg : st.headerBg} relative`}>
        <div className="flex items-start justify-between">
          <div>
            <div className={`w-10 h-10 rounded-2xl ${st.badgeBg} flex items-center justify-center mb-4`}>
              <TIcon className={`w-5 h-5 ${isInfinity ? "text-amber-400" : isPro ? "text-blue-200" : "text-gray-500 dark:text-slate-400"}`}/>
            </div>
            <h3 className={`text-2xl font-black ${st.textColor}`}>{tierNames[tier]}</h3>
            <p className={`text-xs mt-1 ${isPro ? "text-blue-300/60" : isInfinity ? "text-amber-400/50" : "text-gray-400 dark:text-slate-500"}`}>{descrs[tier]}</p>
          </div>
          {isInfinity && (
            <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 mt-1">
              <InfinityIcon className="w-3 h-3"/> شامل
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className={`px-6 py-5 ${isPro ? "bg-white/[0.04] border-t border-white/10" : isInfinity ? "bg-white/[0.02] border-t border-white/[0.06]" : "bg-gray-50 dark:bg-[#111827] border-t border-gray-100 dark:border-slate-800"}`}>
        <AnimatePresence mode="wait">
          <motion.div key={`${tier}-${period}-${years}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black tracking-tight ${st.textColor}`}>{fmt(price)}</span>
              <span className={`text-sm font-bold ${isPro || isInfinity ? "text-white/40" : "text-gray-400"}`}>ريال</span>
            </div>
            <p className={`text-xs mt-1 ${isPro ? "text-blue-300/50" : isInfinity ? "text-amber-400/40" : "text-gray-400"}`}>
              {period === "sixmonth" ? "كل 6 أشهر" : period === "annual" ? "سنوياً — دفعة واحدة" : period === "multiyear" ? `${years} سنوات (خصم ${multiYearDiscount(years)}%)` : "مرة واحدة — للأبد"}
            </p>
            {period === "sixmonth" && <p className={`text-[10px] mt-0.5 ${isPro || isInfinity ? "text-white/25" : "text-gray-400/70"}`}>ما يعادل {fmt(prices.sm * 2)} ريال / سنة</p>}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Features */}
      <div className={`flex-1 px-6 py-5 ${isInfinity ? "bg-[#09090f]" : isPro ? "bg-[#1a3a6e]" : "bg-white dark:bg-[#0f172a]"}`}>
        {isLifetime && (
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4 ${isPro ? "bg-white/10 border border-white/15" : isInfinity ? "bg-amber-500/10 border border-amber-500/20" : "bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20"}`}>
            <InfinityIcon className={`w-4 h-4 shrink-0 ${isInfinity ? "text-amber-400" : isPro ? "text-blue-200" : "text-emerald-600 dark:text-emerald-400"}`}/>
            <span className={`text-xs font-black ${isInfinity ? "text-amber-300" : isPro ? "text-white" : "text-emerald-700 dark:text-emerald-300"}`}>جميع الميزات مفتوحة — مدى الحياة</span>
          </div>
        )}
        <div className="space-y-2.5">
          {features.map(({ icon: Icon, ar }, i) => (
            <div key={i} className="flex items-start gap-3">
              <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isInfinity ? "text-amber-400" : isPro ? "text-blue-300" : "text-emerald-500"}`}/>
              <span className={`text-[12px] leading-snug ${isInfinity ? "text-slate-300" : isPro ? "text-blue-100" : "text-gray-600 dark:text-slate-300"}`}>{ar}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className={`px-6 pb-6 pt-4 ${isInfinity ? "bg-[#09090f]" : isPro ? "bg-[#1a3a6e]" : "bg-white dark:bg-[#0f172a]"}`}>
        <button
          onClick={() => onOrder({ tier, period, years, sector, price, label })}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all ${st.btnBg}`}
          data-testid={`button-subscribe-${tier}`}
        >
          <Rocket className="w-4 h-4"/>
          أكمل الطلب الآن
        </button>
        <p className="text-[10px] text-center mt-2 opacity-50">
          {isInfinity || isPro ? "إكمال البيانات → تحويل بنكي → تواصل عبر واتساب" : "إكمال البيانات → تحويل بنكي → تواصل عبر واتساب"}
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Custom Plan Banner (horizontal strip below main cards) ─────────── */
function CustomBanner({ onOpen }: { onOpen: ()=>void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
      className="mt-5 rounded-2xl border border-dashed border-violet-300 dark:border-violet-700/40 bg-gradient-to-l from-violet-50 via-white to-purple-50 dark:from-violet-950/20 dark:via-[#0d0d18] dark:to-purple-950/10 overflow-hidden"
      data-testid="card-custom-plan"
    >
      <div className="flex flex-col md:flex-row items-center gap-6 px-8 py-6">
        {/* Icon */}
        <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Sparkles className="w-7 h-7 text-white"/>
        </div>

        {/* Text */}
        <div className="flex-1 text-center md:text-start">
          <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
            <h3 className="text-base font-black text-gray-900 dark:text-white">باقة مخصصة — ما وجدت ما يناسبك؟</h3>
            <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
              <Bot className="w-2.5 h-2.5"/> AI
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            اوصف احتياجاتك بمساعدة الذكاء الاصطناعي، وسنعد لك عرض سعر مخصص مع رقم تذكرة للمتابعة
          </p>
          <div className="flex items-center gap-4 mt-2 justify-center md:justify-start">
            {["أي مدة تناسبك","ميزات غير محدودة","عرض سعر خاص بك"].map((t,i)=>(
              <span key={i} className="flex items-center gap-1 text-[11px] text-violet-600 dark:text-violet-400 font-bold">
                <Check className="w-3 h-3"/> {t}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onOpen}
          className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white text-sm font-black transition-all shadow-lg shadow-purple-500/20 whitespace-nowrap"
          data-testid="button-open-custom"
        >
          <Sparkles className="w-4 h-4"/> صمّم باقتك
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Lifetime Perks Banner ───────────────────────────────────────────── */
function LifetimePerks() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-2xl bg-gradient-to-r from-[#09090f] via-[#0f0f1a] to-[#09090f] border border-amber-500/15 p-6">
      <div className="flex items-center gap-2 mb-4">
        <InfinityIcon className="w-5 h-5 text-amber-400"/>
        <h4 className="font-black text-white">مميزات خاصة بباقة مدى الحياة</h4>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {LIFETIME_PERKS.map(({ icon: Icon, ar }, i) => (
          <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-amber-500/10">
            <Icon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"/>
            <span className="text-xs text-slate-300 leading-snug">{ar}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Custom Ticket Modal ─────────────────────────────────────────────── */
interface ChatMsg { role: "user"|"assistant"; content: string; }
function CustomModal({ onClose, sector, sectorLabel, initialDuration }: {
  onClose: ()=>void; sector: string; sectorLabel: string; initialDuration?: string;
}) {
  const { toast } = useToast();
  const { user } = useUser();
  const [step, setStep] = useState<"chat"|"contact"|"success">("chat");
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([
    { role: "assistant", content: `مرحباً! أنا مساعد كيروكس 🤝\nسأساعدك على صياغة احتياجاتك بشكل دقيق حتى يتمكن فريقنا من تقديم أفضل عرض سعر لك.\n\nأخبرني: ما نوع نشاطك؟ وما أبرز الميزات التي تحتاجها في نظامك؟` },
  ]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [requirements, setRequirements] = useState("");
  const [contactName, setContactName] = useState((user as any)?.fullName || "");
  const [contactPhone, setContactPhone] = useState((user as any)?.phone || "");
  const [contactEmail, setContactEmail] = useState((user as any)?.email || "");
  const [duration, setDuration] = useState(initialDuration || "annual");
  const [submitting, setSubmitting] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [whatsapp, setWhatsapp] = useState("966500000000");
  const chatRef = useRef<HTMLDivElement>(null);

  const { data: modalSettings } = useQuery<any>({
    queryKey: ["/api/public/settings"],
    staleTime: 60_000,
  });
  useEffect(() => {
    const wa = modalSettings?.whatsapp || modalSettings?.contactPhone || "";
    if (wa) setWhatsapp(wa.replace(/\D/g, ""));
  }, [modalSettings]);

  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }); }, [chatHistory]);

  async function sendAiMsg() {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    const updated: ChatMsg[] = [...chatHistory, { role: "user", content: userMsg }];
    setChatHistory(updated);
    setAiLoading(true);
    try {
      const r = await fetch("/api/price-request/ai-help", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history: updated.slice(0, -1) }),
      });
      const d = await r.json();
      setChatHistory(prev => [...prev, { role: "assistant", content: d.reply || "..." }]);
    } catch {
      setChatHistory(prev => [...prev, { role: "assistant", content: "عذراً، حدث خطأ. اكتب احتياجاتك مباشرة في الحقل أدناه." }]);
    }
    setAiLoading(false);
  }

  function useAsRequirements(content: string) {
    setRequirements(content);
    toast({ title: "تم نقل الوصف ✓", description: "يمكنك تعديله قبل الإرسال" });
  }

  async function handleSubmit() {
    if (!contactName || !contactPhone || !requirements) {
      toast({ title: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" }); return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/price-request", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector, sectorLabel, duration, requirements, contactName, contactPhone, contactEmail }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "فشل الإرسال");
      setTicketNumber(d.ticketNumber);
      setStep("success");
    } catch (e: any) {
      toast({ title: "فشل الإرسال", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  }

  const durLabels: Record<string,string> = { sixmonth:"6 أشهر", annual:"سنة", "2y":"سنتان", "3y":"3 سنوات", "5y":"5 سنوات", lifetime:"مدى الحياة" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}/>
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0d0d18] rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.05] shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white"/>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black text-black dark:text-white">باقة مخصصة — {sectorLabel}</h3>
            <p className="text-[10px] text-black/40 dark:text-white/40">اكتب احتياجاتك واحصل على عرض سعر</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05]">
            <X className="w-4 h-4 text-black/40 dark:text-white/40"/>
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 px-5 py-2 shrink-0 border-b border-black/[0.05] dark:border-white/[0.04]">
          {["chat","contact","success"].map((s,i)=>(
            <div key={s} className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${step===s||( s==="success"&&step==="success")?"bg-violet-600 text-white":step==="success"||( i===0&&step!=="chat")||(i===1&&step==="success")?"bg-emerald-500 text-white":"bg-black/[0.06] dark:bg-white/[0.06] text-black/40 dark:text-white/40"}`}>
                {(i===0&&step!=="chat")||(i===1&&step==="success")?<Check className="w-3 h-3"/>:i+1}
              </div>
              <span className={`text-[10px] font-semibold ${step===s?"text-violet-600":"text-black/30 dark:text-white/30"}`}>{["صياغة الاحتياجات","بياناتك","التأكيد"][i]}</span>
              {i<2&&<ChevronLeft className="w-3 h-3 text-black/20 dark:text-white/20"/>}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col">

          {/* ── Step 1: Chat ── */}
          {step === "chat" && (
            <div className="flex flex-col h-full">
              <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role==="user"?"justify-start":"justify-end"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${msg.role==="user"?"bg-black/[0.04] dark:bg-white/[0.05]":"bg-violet-600 text-white"}`}>
                      <p className={`text-xs leading-relaxed whitespace-pre-wrap ${msg.role==="user"?"text-black dark:text-white":"text-white"}`}>{msg.content}</p>
                      {msg.role==="assistant"&&<button onClick={()=>useAsRequirements(msg.content)} className="mt-1.5 text-[9px] text-white/60 hover:text-white flex items-center gap-1"><ClipboardList className="w-3 h-3"/>استخدم كوصف</button>}
                    </div>
                  </div>
                ))}
                {aiLoading && <div className="flex justify-end"><div className="bg-violet-600 rounded-2xl px-4 py-3"><div className="flex gap-1">{[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}</div></div></div>}
              </div>
              <div className="border-t border-black/[0.06] dark:border-white/[0.05] p-3 flex gap-2 shrink-0">
                <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendAiMsg()} placeholder="اكتب احتياجاتك..." className="flex-1 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl px-3 py-2 text-sm outline-none placeholder:text-black/25 dark:placeholder:text-white/25 text-black dark:text-white" data-testid="input-ai-chat"/>
                <button onClick={sendAiMsg} disabled={!input.trim()||aiLoading} className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 flex items-center justify-center transition" data-testid="button-send-ai">
                  {aiLoading?<Loader2 className="w-4 h-4 text-white animate-spin"/>:<Send className="w-4 h-4 text-white"/>}
                </button>
              </div>
              {/* Requirements textarea */}
              <div className="p-3 pt-0 shrink-0">
                <label className="text-[10px] font-black uppercase tracking-wider text-black/30 dark:text-white/30 mb-1.5 block">الوصف النهائي لمتطلباتك *</label>
                <textarea value={requirements} onChange={e=>setRequirements(e.target.value)} rows={3} placeholder="اكتب أو انقل الوصف هنا..." className="w-full bg-black/[0.03] dark:bg-white/[0.04] rounded-xl px-3 py-2 text-sm outline-none resize-none placeholder:text-black/20 dark:placeholder:text-white/20 text-black dark:text-white border border-black/[0.06] dark:border-white/[0.05]" data-testid="textarea-requirements"/>
                <button onClick={()=>requirements&&setStep("contact")} disabled={!requirements.trim()} className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-black transition" data-testid="button-next-contact">
                  التالي: بياناتك <ArrowRight className="w-4 h-4"/>
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Contact ── */}
          {step === "contact" && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/20">
                <p className="text-[10px] font-black text-violet-600 dark:text-violet-400 mb-1">الوصف المدخل:</p>
                <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed line-clamp-3">{requirements}</p>
                <button onClick={()=>setStep("chat")} className="text-[10px] text-violet-500 mt-1 hover:underline">تعديل الوصف</button>
              </div>

              <div>
                <label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-wider mb-1.5 block">مدة المشروع</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {DURATION_OPTS.map(({key,ar,icon:Icon})=>(
                    <button key={key} onClick={()=>setDuration(key)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${duration===key?"bg-violet-600 text-white":"bg-black/[0.03] dark:bg-white/[0.04] text-black/50 dark:text-white/50 hover:bg-black/[0.06] dark:hover:bg-white/[0.07]"}`} data-testid={`button-duration-${key}`}>
                      <Icon className="w-3 h-3"/>{ar}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-wider mb-1.5 block">الاسم *</label>
                  <div className="relative">
                    <User className="absolute top-1/2 -translate-y-1/2 right-3 w-3.5 h-3.5 text-black/25 dark:text-white/25 pointer-events-none"/>
                    <Input value={contactName} onChange={e=>setContactName(e.target.value)} className="pr-9 h-9 text-sm" placeholder="اسمك الكريم" data-testid="input-contact-name"/>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-wider mb-1.5 block">رقم الهاتف / واتساب *</label>
                  <div className="relative">
                    <Phone className="absolute top-1/2 -translate-y-1/2 right-3 w-3.5 h-3.5 text-black/25 dark:text-white/25 pointer-events-none"/>
                    <Input value={contactPhone} onChange={e=>setContactPhone(e.target.value)} className="pr-9 h-9 text-sm" placeholder="+966 5XX XXX XXX" dir="ltr" data-testid="input-contact-phone"/>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-wider mb-1.5 block">البريد الإلكتروني (اختياري)</label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 -translate-y-1/2 right-3 w-3.5 h-3.5 text-black/25 dark:text-white/25 pointer-events-none"/>
                    <Input value={contactEmail} onChange={e=>setContactEmail(e.target.value)} className="pr-9 h-9 text-sm" placeholder="email@example.com" dir="ltr" data-testid="input-contact-email"/>
                  </div>
                </div>
              </div>

              <button onClick={handleSubmit} disabled={submitting||!contactName||!contactPhone} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 disabled:opacity-40 text-white text-sm font-black transition" data-testid="button-submit-ticket">
                {submitting?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}
                {submitting?"جارٍ الإرسال...":"أرسل طلب السعر"}
              </button>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === "success" && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500"/>
              </div>
              <div>
                <h3 className="text-xl font-black text-black dark:text-white mb-1">تم استلام طلبك!</h3>
                <p className="text-sm text-black/50 dark:text-white/50">رقم تذكرتك</p>
                <div className="flex items-center gap-2 justify-center mt-2">
                  <span className="text-2xl font-black text-violet-600 dark:text-violet-400 font-mono">{ticketNumber}</span>
                  <button onClick={()=>{navigator.clipboard.writeText(ticketNumber);toast({title:"تم النسخ ✓"});}} className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"><Copy className="w-4 h-4 text-black/40 dark:text-white/40"/></button>
                </div>
              </div>
              <div className="w-full p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20 text-sm text-emerald-700 dark:text-emerald-300 space-y-1">
                <p>✓ تم إشعار فريق كيروكس</p>
                <p>✓ ستصلك رسالة تأكيد قريباً</p>
                {user && <p>✓ يمكنك متابعة الطلب من حسابك</p>}
              </div>
              <a
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`مرحباً، لدي طلب سعر برقم التذكرة ${ticketNumber} — ${sectorLabel}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#20c05c] text-white text-sm font-black transition"
                data-testid="button-whatsapp-ticket"
              >
                <MessageSquare className="w-4 h-4"/>
                تواصل واتساب برقم التذكرة
              </a>
              <button onClick={onClose} className="text-sm text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition">إغلاق</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────── */
const SEGMENT_TO_SECTOR: Record<string, Sector> = {
  restaurant: "restaurant",
  ecommerce: "ecommerce",
};
const NON_PRIMARY_SEGMENTS = ["education","healthcare","realestate","corporate","fitness","beauty","events","marketing","ai","other"];

export default function Prices() {
  const { L } = useI18n();
  const { user } = useUser();
  const [, setLocation] = useLocation();

  // Read URL parameters (?segment=…) once on mount
  const initialSegment = (() => {
    if (typeof window === "undefined") return null;
    const sp = new URLSearchParams(window.location.search);
    return sp.get("segment");
  })();
  const initialSector: Sector = initialSegment && SEGMENT_TO_SECTOR[initialSegment]
    ? SEGMENT_TO_SECTOR[initialSegment]
    : (initialSegment && NON_PRIMARY_SEGMENTS.includes(initialSegment))
      ? "other"
      : "restaurant";
  const initialOtherSector = initialSegment && NON_PRIMARY_SEGMENTS.includes(initialSegment) ? initialSegment : "education";

  const [sector, setSector] = useState<Sector>(initialSector);
  const [period, setPeriod] = useState<Period>("annual");
  const [years, setYears] = useState(2);
  const [otherSector, setOtherSector] = useState(initialOtherSector);
  const [otherDuration, setOtherDuration] = useState("annual");
  const [customOpen, setCustomOpen] = useState(false);
  const [customSector, setCustomSector] = useState("restaurant");
  const [customSectorLabel, setCustomSectorLabel] = useState("مطاعم ومقاهي");
  const [customDuration, setCustomDuration] = useState("annual");

  const { data: settings } = useQuery<any>({ queryKey: ["/api/public/settings"], staleTime: 60_000 });
  const whatsapp = (settings?.whatsapp || settings?.contactPhone || "").replace(/\D/g, "") || "966500000000";

  function startOrder(info: { tier: Tier; period: Period; years: number; sector: string; price: number; label: string }) {
    const params = new URLSearchParams({
      plan: info.tier,
      segment: info.sector,
      period: info.period === "multiyear" ? `${info.years}y` : info.period,
      price: String(info.price),
    });
    setLocation(`/order?${params.toString()}`);
  }

  const SECTORS_DATA = [
    { key: "restaurant" as Sector, icon: UtensilsCrossed, ar: "مطاعم ومقاهي", en: "Restaurants", color: "from-orange-500 to-amber-500" },
    { key: "ecommerce"  as Sector, icon: ShoppingBag,     ar: "متاجر إلكترونية", en: "E-Commerce", color: "from-blue-500 to-cyan-500" },
    { key: "other"      as Sector, icon: Building2,        ar: "قطاعات أخرى", en: "Other Sectors", color: "from-violet-500 to-purple-600" },
  ];

  function openCustom(sec: string, label: string, dur?: string) {
    setCustomSector(sec); setCustomSectorLabel(label);
    setCustomDuration(dur || (period === "multiyear" ? `${years}y` : period));
    setCustomOpen(true);
  }

  const PERIODS_LIST = [
    { key: "sixmonth" as Period, ar: "6 أشهر", icon: CalendarRange },
    { key: "annual"   as Period, ar: "سنة", icon: CalendarDays },
    { key: "multiyear"as Period, ar: "سنوات+", icon: CalendarDays, extra: true },
    { key: "lifetime" as Period, ar: "مدى الحياة", icon: InfinityIcon },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#05050c]" dir="rtl">
      <Navigation/>

      {/* ── Hero ── */}
      <section className="pt-24 pb-8 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-black/30 dark:text-white/30 mb-4">
            <Tag className="w-3 h-3"/> الباقات والأسعار
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-black dark:text-white mb-3 leading-tight">
            اختر الباقة المناسبة<br/>
            <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent">لنشاطك التجاري</span>
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-base max-w-lg mx-auto">
            أسعار شفافة بدون رسوم مخفية — باقات مرنة تناسب كل قطاع
          </p>
        </motion.div>
      </section>

      {/* ── Sector Tabs ── */}
      <section className="px-4 pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 p-1.5 bg-black/[0.04] dark:bg-white/[0.04] rounded-2xl">
            {SECTORS_DATA.map(s => {
              const Icon = s.icon;
              const active = sector === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setSector(s.key)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl transition-all ${active ? "bg-white dark:bg-[#1a1a2e] shadow-md" : "hover:bg-white/50 dark:hover:bg-white/[0.04]"}`}
                  data-testid={`button-sector-${s.key}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${active ? `bg-gradient-to-br ${s.color}` : "bg-black/[0.06] dark:bg-white/[0.06]"}`}>
                    <Icon className={`w-4 h-4 ${active ? "text-white" : "text-black/40 dark:text-white/40"}`}/>
                  </div>
                  <span className={`text-[11px] font-black ${active ? "text-black dark:text-white" : "text-black/35 dark:text-white/35"}`}>{s.ar}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Pricing Content ── */}
      <section className="px-4 pb-16">
        <div className="max-w-5xl mx-auto">

          {/* Restaurant / Ecommerce */}
          {(sector === "restaurant" || sector === "ecommerce") && (
            <>
              {/* Period switcher */}
              <div className="flex flex-col items-center mb-8 gap-3">
                <div className="flex gap-1.5 p-1 bg-black/[0.04] dark:bg-white/[0.04] rounded-xl">
                  {PERIODS_LIST.map(p => {
                    const Icon = p.icon;
                    const active = period === p.key;
                    return (
                      <button key={p.key} onClick={() => setPeriod(p.key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black transition-all ${active ? "bg-white dark:bg-[#1a1a2e] text-black dark:text-white shadow-sm" : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"}`}
                        data-testid={`button-period-${p.key}`}
                      >
                        <Icon className="w-3.5 h-3.5"/>{p.ar}
                      </button>
                    );
                  })}
                </div>

                {/* Multi-year picker */}
                {period === "multiyear" && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">عدد السنوات:</span>
                    <button onClick={() => setYears(y => Math.max(2, y - 1))} className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition"><Minus className="w-3 h-3"/></button>
                    <span className="text-lg font-black text-blue-700 dark:text-blue-300 w-6 text-center">{years}</span>
                    <button onClick={() => setYears(y => Math.min(10, y + 1))} className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition"><Plus className="w-3 h-3"/></button>
                    <span className="text-xs font-bold text-blue-500 dark:text-blue-400">خصم {multiYearDiscount(years)}% على السنوات الإضافية</span>
                  </motion.div>
                )}
              </div>

              {/* Plan cards — 3 col grid, Pro slightly elevated */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                <PlanCard tier="lite"     period={period} years={years} sector={sector as SectorKey} onCustom={() => openCustom(sector, SECTORS_DATA.find(s=>s.key===sector)?.ar||sector)} onOrder={startOrder}/>
                <div className="md:mt-[-14px]">
                  <PlanCard tier="pro"   period={period} years={years} sector={sector as SectorKey} onCustom={() => openCustom(sector, SECTORS_DATA.find(s=>s.key===sector)?.ar||sector)} onOrder={startOrder}/>
                </div>
                <PlanCard tier="infinity" period={period} years={years} sector={sector as SectorKey} onCustom={() => openCustom(sector, SECTORS_DATA.find(s=>s.key===sector)?.ar||sector)} onOrder={startOrder}/>
              </div>

              {/* Custom banner — below main cards */}
              <CustomBanner onOpen={() => openCustom(sector, SECTORS_DATA.find(s=>s.key===sector)?.ar||sector, period==="multiyear"?`${years}y`:period)}/>

              {/* Lifetime perks */}
              {period === "lifetime" && <LifetimePerks/>}

              {/* Multi-year note */}
              {period === "multiyear" && (
                <div className="mt-6 text-center text-xs text-black/30 dark:text-white/30">
                  السنة الثانية وما بعدها تأخذ خصم 5% إضافي لكل سنة — الخصم الأقصى 40%
                </div>
              )}

              {/* Lifetime note */}
              {period !== "lifetime" && (
                <div className="mt-6 text-center">
                  <p className="text-xs text-black/30 dark:text-white/30">
                    جميع باقات مدى الحياة تشمل نطاقاً مجانياً لمدة 3 سنوات + دعم تقني 3 سنوات + استضافة على خوادم كيروكس مدى الحياة
                  </p>
                </div>
              )}
            </>
          )}

          {/* Other Sectors */}
          {sector === "other" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-black dark:text-white mb-2">قطاعات أخرى</h2>
                <p className="text-sm text-black/40 dark:text-white/40">اختر قطاعك واختر المدة المناسبة</p>
              </div>

              {/* Sub-sector grid */}
              <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
                {OTHER_SECTORS.map(s => {
                  const Icon = s.icon;
                  const active = otherSector === s.key;
                  return (
                    <button key={s.key} onClick={() => setOtherSector(s.key)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${active ? "border-violet-400 bg-violet-50 dark:bg-violet-900/10" : "border-black/[0.06] dark:border-white/[0.06] hover:border-violet-200 dark:hover:border-violet-800"}`}
                      data-testid={`button-other-sector-${s.key}`}
                    >
                      <Icon className={`w-5 h-5 ${active ? "text-violet-600 dark:text-violet-400" : "text-black/30 dark:text-white/30"}`}/>
                      <span className={`text-[10px] font-bold text-center ${active ? "text-violet-700 dark:text-violet-300" : "text-black/40 dark:text-white/40"}`}>{s.ar}</span>
                    </button>
                  );
                })}
              </div>

              {/* Period switcher (same component as restaurant/ecommerce) */}
              <div className="flex flex-col items-center mb-8 gap-3">
                <div className="flex gap-1.5 p-1 bg-black/[0.04] dark:bg-white/[0.04] rounded-xl">
                  {PERIODS_LIST.map(p => {
                    const Icon = p.icon;
                    const active = period === p.key;
                    return (
                      <button key={p.key} onClick={() => setPeriod(p.key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black transition-all ${active ? "bg-white dark:bg-[#1a1a2e] text-black dark:text-white shadow-sm" : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"}`}
                        data-testid={`button-other-period-${p.key}`}
                      >
                        <Icon className="w-3.5 h-3.5"/>{p.ar}
                      </button>
                    );
                  })}
                </div>

                {/* Multi-year picker */}
                {period === "multiyear" && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/20">
                    <span className="text-xs font-bold text-violet-700 dark:text-violet-300">عدد السنوات:</span>
                    <button onClick={() => setYears(y => Math.max(2, y - 1))} className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center hover:bg-violet-500 transition"><Minus className="w-3 h-3"/></button>
                    <span className="text-lg font-black text-violet-700 dark:text-violet-300 w-6 text-center">{years}</span>
                    <button onClick={() => setYears(y => Math.min(10, y + 1))} className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center hover:bg-violet-500 transition"><Plus className="w-3 h-3"/></button>
                    <span className="text-xs font-bold text-violet-500 dark:text-violet-400">خصم {multiYearDiscount(years)}% على السنوات الإضافية</span>
                  </motion.div>
                )}
              </div>

              {/* Plan cards for the selected sub-sector */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                <PlanCard tier="lite"     period={period} years={years} sector={otherSector as SectorKey} onCustom={() => openCustom(otherSector, OTHER_SECTORS.find(s=>s.key===otherSector)?.ar||otherSector)} onOrder={startOrder}/>
                <div className="md:mt-[-14px]">
                  <PlanCard tier="pro"   period={period} years={years} sector={otherSector as SectorKey} onCustom={() => openCustom(otherSector, OTHER_SECTORS.find(s=>s.key===otherSector)?.ar||otherSector)} onOrder={startOrder}/>
                </div>
                <PlanCard tier="infinity" period={period} years={years} sector={otherSector as SectorKey} onCustom={() => openCustom(otherSector, OTHER_SECTORS.find(s=>s.key===otherSector)?.ar||otherSector)} onOrder={startOrder}/>
              </div>

              {/* Custom banner */}
              <CustomBanner onOpen={() => openCustom(otherSector, OTHER_SECTORS.find(s=>s.key===otherSector)?.ar||otherSector, period==="multiyear"?`${years}y`:period)}/>

              {/* Lifetime perks */}
              {period === "lifetime" && <LifetimePerks/>}

              {/* Multi-year note */}
              {period === "multiyear" && (
                <div className="mt-6 text-center text-xs text-black/30 dark:text-white/30">
                  السنة الثانية وما بعدها تأخذ خصم 5% إضافي لكل سنة — الخصم الأقصى 40%
                </div>
              )}

              {/* Lifetime note */}
              {period !== "lifetime" && (
                <div className="mt-6 text-center">
                  <p className="text-xs text-black/30 dark:text-white/30">
                    جميع باقات مدى الحياة تشمل نطاقاً مجانياً لمدة 3 سنوات + دعم تقني 3 سنوات + استضافة على خوادم كيروكس مدى الحياة
                  </p>
                </div>
              )}
            </>
          )}

        </div>
      </section>

      {/* Custom Modal */}
      {customOpen && (
        <CustomModal
          onClose={() => setCustomOpen(false)}
          sector={customSector}
          sectorLabel={customSectorLabel}
          initialDuration={customDuration}
        />
      )}

      <Footer/>
    </div>
  );
}
