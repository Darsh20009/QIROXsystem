import { useState, useMemo, useRef, useEffect, type ElementType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useCurrency } from "@/hooks/use-currency";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useSEO } from "@/hooks/use-seo";
import { useTemplates } from "@/hooks/use-templates";
import type { Partner } from "@shared/schema";
const qiroxLogo = "/qirox-icon-nobg.png";
import demoEcommerceImg from "@assets/Screenshot_2026-04-27_at_6.23.57_PM_1777303494183.png";
import demoRestaurantImg from "@assets/Screenshot_2026-04-27_at_1.59.42_PM_1777302518837.png";
import {
  ArrowRight, ArrowLeft, ArrowUpRight, Sparkles, Zap, Shield, Cpu,
  Layers, ShoppingBag, Building2, GraduationCap,
  Heart, Coffee, Home as HomeIcon, Scissors, Lightbulb,
  Check, Star, Infinity, ChevronRight, TrendingUp, Bot, Globe,
  CalendarRange, CalendarDays, Minus, Plus, Crown, Rocket,
  Server, UtensilsCrossed,
} from "lucide-react";
import { SiWhatsapp, SiInstagram, SiX, SiGoogle, SiApple } from "react-icons/si";
import { Linkedin } from "lucide-react";
import { useUser } from "@/hooks/use-auth";

// ─── Sector SVG Illustrations ────────────────────────────────────────────────
function EcommerceIllustration() {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="20" y="30" width="120" height="70" rx="8" fill="currentColor" fillOpacity=".06"/>
      <rect x="35" y="15" width="90" height="50" rx="6" fill="currentColor" fillOpacity=".1"/>
      <rect x="50" y="28" width="60" height="8" rx="3" fill="currentColor" fillOpacity=".25"/>
      <rect x="50" y="42" width="40" height="6" rx="3" fill="currentColor" fillOpacity=".15"/>
      <circle cx="55" cy="80" r="8" fill="currentColor" fillOpacity=".2"/>
      <circle cx="80" cy="80" r="8" fill="currentColor" fillOpacity=".2"/>
      <circle cx="105" cy="80" r="8" fill="currentColor" fillOpacity=".2"/>
      <path d="M40 60 L55 72 L75 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeOpacity=".4"/>
    </svg>
  );
}
function RestaurantIllustration() {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="80" cy="90" rx="50" ry="8" fill="currentColor" fillOpacity=".07"/>
      <rect x="50" y="35" width="60" height="55" rx="10" fill="currentColor" fillOpacity=".1"/>
      <path d="M65 35 C65 25 95 25 95 35" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeOpacity=".3"/>
      <circle cx="80" cy="60" r="14" fill="currentColor" fillOpacity=".18"/>
      <path d="M72 60 L78 66 L90 54" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="35" y="85" width="90" height="6" rx="3" fill="currentColor" fillOpacity=".12"/>
    </svg>
  );
}
function EducationIllustration() {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="25" y="40" width="110" height="65" rx="8" fill="currentColor" fillOpacity=".07"/>
      <path d="M80 20 L115 38 L80 56 L45 38 Z" fill="currentColor" fillOpacity=".18"/>
      <path d="M115 38 L115 65" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeOpacity=".3"/>
      <rect x="55" y="65" width="50" height="35" rx="6" fill="currentColor" fillOpacity=".12"/>
      <rect x="65" y="78" width="30" height="4" rx="2" fill="currentColor" fillOpacity=".25"/>
      <rect x="70" y="88" width="20" height="4" rx="2" fill="currentColor" fillOpacity=".2"/>
    </svg>
  );
}
function CorporateIllustration() {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="40" y="25" width="80" height="80" rx="6" fill="currentColor" fillOpacity=".08"/>
      <rect x="50" y="35" width="60" height="70" rx="4" fill="currentColor" fillOpacity=".1"/>
      <rect x="58" y="45" width="12" height="12" rx="2" fill="currentColor" fillOpacity=".22"/>
      <rect x="78" y="45" width="12" height="12" rx="2" fill="currentColor" fillOpacity=".22"/>
      <rect x="98" y="45" width="12" height="12" rx="2" fill="currentColor" fillOpacity=".22"/>
      <rect x="58" y="65" width="12" height="12" rx="2" fill="currentColor" fillOpacity=".16"/>
      <rect x="78" y="65" width="12" height="12" rx="2" fill="currentColor" fillOpacity=".16"/>
      <rect x="98" y="65" width="12" height="12" rx="2" fill="currentColor" fillOpacity=".16"/>
      <rect x="65" y="85" width="30" height="20" rx="3" fill="currentColor" fillOpacity=".18"/>
    </svg>
  );
}
function HealthcareIllustration() {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="80" cy="60" r="45" fill="currentColor" fillOpacity=".06"/>
      <path d="M80 35 C80 35 50 50 50 68 C50 82 65 90 80 90 C95 90 110 82 110 68 C110 50 80 35 80 35Z" fill="currentColor" fillOpacity=".13"/>
      <rect x="73" y="50" width="14" height="35" rx="3" fill="currentColor" fillOpacity=".28"/>
      <rect x="63" y="60" width="34" height="14" rx="3" fill="currentColor" fillOpacity=".28"/>
    </svg>
  );
}
function RealEstateIllustration() {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="20" y="95" width="120" height="6" rx="3" fill="currentColor" fillOpacity=".1"/>
      <path d="M80 25 L120 60 L120 95 L40 95 L40 60 Z" fill="currentColor" fillOpacity=".1"/>
      <path d="M30 65 L80 25 L130 65" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeOpacity=".25"/>
      <rect x="60" y="70" width="40" height="25" rx="3" fill="currentColor" fillOpacity=".2"/>
      <rect x="73" y="78" width="14" height="17" rx="2" fill="currentColor" fillOpacity=".3"/>
      <rect x="45" y="72" width="10" height="10" rx="2" fill="currentColor" fillOpacity=".18"/>
      <rect x="105" y="72" width="10" height="10" rx="2" fill="currentColor" fillOpacity=".18"/>
    </svg>
  );
}
function BeautyIllustration() {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="80" cy="60" r="40" fill="currentColor" fillOpacity=".07"/>
      <circle cx="80" cy="55" r="22" stroke="currentColor" strokeWidth="2.5" strokeOpacity=".2"/>
      <circle cx="80" cy="55" r="14" fill="currentColor" fillOpacity=".15"/>
      <path d="M65 80 L95 80" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeOpacity=".3"/>
      <path d="M55 38 L68 55 M105 38 L92 55" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeOpacity=".2"/>
      <circle cx="80" cy="55" r="6" fill="currentColor" fillOpacity=".3"/>
    </svg>
  );
}
function IdeaIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <style>{`
        @keyframes ideaGlow{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:1;transform:scale(1.18)}}
        @keyframes ideaPulse{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:.7;transform:scale(1.35)}}
        @keyframes ideaRay{0%,100%{opacity:.2;transform-origin:center;transform:scaleX(1)}50%{opacity:.9;transform:scaleX(1.3)}}
        @keyframes ideaFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes ideaSpark{0%{opacity:0;transform:translate(0,0) scale(0)}40%{opacity:1;transform:translate(var(--tx),var(--ty)) scale(1)}100%{opacity:0;transform:translate(calc(var(--tx)*1.8),calc(var(--ty)*1.8)) scale(0)}}
        @keyframes ideaFlicker{0%,100%{opacity:1}92%{opacity:1}93%{opacity:.6}95%{opacity:1}97%{opacity:.8}99%{opacity:1}}
        @keyframes ideaRotateSlow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .idea-glow{animation:ideaGlow 2.4s ease-in-out infinite}
        .idea-pulse{animation:ideaPulse 3s ease-in-out infinite}
        .idea-float{animation:ideaFloat 3s ease-in-out infinite}
        .idea-flicker{animation:ideaFlicker 4s ease-in-out infinite}
        .idea-rotate{animation:ideaRotateSlow 12s linear infinite}
      `}</style>

      {/* outermost soft glow ring */}
      <div className="idea-pulse absolute rounded-full"
        style={{width:'80%',height:'80%',background:'radial-gradient(circle,rgba(201,168,76,0.18) 0%,transparent 70%)'}} />

      {/* mid glow ring */}
      <div className="idea-glow absolute rounded-full"
        style={{width:'55%',height:'55%',background:'radial-gradient(circle,rgba(201,168,76,0.35) 0%,transparent 70%)',animationDelay:'.4s'}} />

      {/* rotating dashed ring */}
      <div className="idea-rotate absolute"
        style={{width:'62%',height:'62%',border:'1.5px dashed rgba(201,168,76,0.22)',borderRadius:'50%'}} />

      {/* rays — 8 directions */}
      {[0,45,90,135,180,225,270,315].map((deg,i) => (
        <div key={deg} className="absolute"
          style={{
            width:'42%',height:'1.5px',
            top:'50%',left:'50%',
            transformOrigin:'0 50%',
            transform:`rotate(${deg}deg)`,
            background:`linear-gradient(90deg,rgba(201,168,76,0) 0%,rgba(201,168,76,0.55) 50%,rgba(201,168,76,0) 100%)`,
            animation:`ideaRay ${2+i*0.18}s ease-in-out infinite`,
            animationDelay:`${i*0.22}s`,
          }} />
      ))}

      {/* sparks */}
      {[
        {tx:'-22px',ty:'-26px',d:'0s'},{tx:'24px',ty:'-20px',d:'0.6s'},
        {tx:'-28px',ty:'10px',d:'1.1s'},{tx:'26px',ty:'14px',d:'0.3s'},
        {tx:'0px',ty:'-32px',d:'0.9s'},{tx:'-10px',ty:'28px',d:'1.4s'},
      ].map((s,i)=>(
        <div key={i} className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background:'#c9a84c',
            top:'50%',left:'50%',
            ['--tx' as any]:s.tx,['--ty' as any]:s.ty,
            animation:`ideaSpark 2.2s ease-out infinite`,
            animationDelay:s.d,
            boxShadow:'0 0 4px 2px rgba(201,168,76,0.6)',
          }} />
      ))}

      {/* bulb SVG — floating + flickering */}
      <div className="idea-float idea-flicker relative z-10" style={{width:'52%',height:'52%'}}>
        <svg viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',filter:'drop-shadow(0 0 10px rgba(201,168,76,0.9)) drop-shadow(0 0 22px rgba(201,168,76,0.55))'}}>
          {/* inner glow fill */}
          <ellipse cx="40" cy="38" rx="22" ry="22" fill="rgba(201,168,76,0.25)"/>
          {/* bulb body */}
          <path d="M24 38 C24 24 56 24 56 38 C56 48 50 54 50 62 L30 62 C30 54 24 48 24 38Z"
            fill="rgba(201,168,76,0.85)" />
          {/* highlight shine */}
          <ellipse cx="34" cy="30" rx="5" ry="8" fill="rgba(255,255,255,0.25)" transform="rotate(-15 34 30)"/>
          {/* filament lines */}
          <path d="M34 62 L34 68 M40 62 L40 70 M46 62 L46 68" stroke="rgba(201,168,76,0.6)" strokeWidth="2" strokeLinecap="round"/>
          {/* base bands */}
          <rect x="30" y="68" width="20" height="5" rx="2.5" fill="rgba(201,168,76,0.5)"/>
          <rect x="32" y="75" width="16" height="5" rx="2.5" fill="rgba(201,168,76,0.4)"/>
          <rect x="34" y="82" width="12" height="5" rx="2.5" fill="rgba(201,168,76,0.3)"/>
        </svg>
      </div>
    </div>
  );
}

const SECTOR_ILLUSTRATIONS: Record<string, React.FC> = {
  "متاجر إلكترونية": EcommerceIllustration,
  "مطاعم ومقاهي": RestaurantIllustration,
  "منصات تعليمية": EducationIllustration,
  "شركات ومؤسسات": CorporateIllustration,
  "صحة وعيادات": HealthcareIllustration,
  "عقارات": RealEstateIllustration,
  "صالونات تجميل": BeautyIllustration,
  "ابدأ فكرتك الخاصة": IdeaIllustration,
};

// Premium brand-aligned signature accents — monochrome cards stay true to QIROX
// black/white identity; each sector earns a single jewel-tone "glow blob"
// + matching hover ring. Subtle on light mode, luminous on dark mode.
const SECTOR_ACCENT: Record<string, { glow: string; ring: string }> = {
  "متاجر إلكترونية": { glow: "bg-emerald-500/30 dark:bg-emerald-400/40",   ring: "ring-emerald-500/40 dark:ring-emerald-400/50" },
  "مطاعم ومقاهي":     { glow: "bg-orange-500/30 dark:bg-orange-400/40",     ring: "ring-orange-500/40 dark:ring-orange-400/50" },
  "منصات تعليمية":    { glow: "bg-sky-500/30 dark:bg-sky-400/40",           ring: "ring-sky-500/40 dark:ring-sky-400/50" },
  "شركات ومؤسسات":    { glow: "bg-indigo-500/30 dark:bg-indigo-400/40",     ring: "ring-indigo-500/40 dark:ring-indigo-400/50" },
  "صحة وعيادات":      { glow: "bg-rose-500/30 dark:bg-rose-400/40",         ring: "ring-rose-500/40 dark:ring-rose-400/50" },
  "عقارات":            { glow: "bg-teal-500/30 dark:bg-teal-400/40",         ring: "ring-teal-500/40 dark:ring-teal-400/50" },
  "صالونات تجميل":     { glow: "bg-fuchsia-500/30 dark:bg-fuchsia-400/40",   ring: "ring-fuchsia-500/40 dark:ring-fuchsia-400/50" },
  "وكالات التسويق":    { glow: "bg-violet-500/30 dark:bg-violet-400/40",     ring: "ring-violet-500/40 dark:ring-violet-400/50" },
  "ذكاء اصطناعي":      { glow: "bg-cyan-500/30 dark:bg-cyan-400/40",         ring: "ring-cyan-500/40 dark:ring-cyan-400/50" },
};

const SECTORS = [
  { icon: Coffee,         img: "/sectors/restaurant.jpg", arName: "المطاعم والمقاهي",     enName: "Restaurants & Cafés", arDesc: "نظام نقاط بيع ومطبخ وإدارة الملبات والمخزون.",          enDesc: "POS, kitchen display & order management.",               slug: "restaurant", segment: "restaurant" },
  { icon: Heart,          img: "/sectors/healthcare.jpg", arName: "الصحة والتجميل",       enName: "Health & Beauty",     arDesc: "إدارة العيادات والمراكز الطبية وصالونات التجميل.",       enDesc: "Clinics, medical centres & beauty salon management.",    slug: "healthcare", segment: "healthcare" },
  { icon: ShoppingBag,    img: "/sectors/ecommerce.jpg",  arName: "المتاجر",              enName: "E-Commerce",          arDesc: "منصة متكاملة لإدارة المتاجر والمنتجات والمبيعات.",      enDesc: "Full platform for products, sales & shipping.",          slug: "ecommerce",  segment: "ecommerce" },
  { icon: Building2,      img: "/sectors/corporate.jpg",  arName: "الشركات والوكلات",     enName: "Companies & Agencies",arDesc: "حلول ERP وCRM ومالية لتسيير أعمالك بكفاءة.",            enDesc: "ERP, CRM & financial solutions.",                        slug: "corporate",  segment: "corporate" },
  { icon: GraduationCap,  img: "/sectors/education.jpg",  arName: "التعليم والمنصات",     enName: "Education Platforms", arDesc: "منصات تعليمية متكاملة للدورات والطلاب والاختبارات.",    enDesc: "Full LMS for courses, students & exams.",                slug: "education",  segment: "education" },
  { icon: Bot,            img: "/sectors/ai.jpg",         arName: "الذكاء الاصطناعي",     enName: "AI Solutions",        arDesc: "أدوات ذكية لتحسين العمليات واتخاذ قرارات أفضل.",        enDesc: "Smart tools to improve operations & decision-making.",   slug: "ai",         segment: "ai" },
];

const PILLARS = [
  { icon: Zap, ar: { t: "سريع", d: "نسلّم في أيام، لا أشهر" }, en: { t: "Fast", d: "Days, not months" } },
  { icon: Shield, ar: { t: "آمن", d: "حماية كاملة لبياناتك" }, en: { t: "Secure", d: "Full data protection" } },
  { icon: Cpu, ar: { t: "ذكي", d: "مساعد ذكي ينفّذ معك" }, en: { t: "Smart", d: "AI helps you build" } },
  { icon: Sparkles, ar: { t: "بسيط", d: "سهل حتى لو ما عندك خبرة تقنية" }, en: { t: "Simple", d: "Easy, even without tech skills" } },
];

const TABS = [
  { id: "systems",   ar: "الأنظمة",  en: "Systems" },
  { id: "templates", ar: "النماذج",  en: "Templates" },
  { id: "pricing",   ar: "الباقات",  en: "Plans" },
  { id: "process",   ar: "كيف نعمل", en: "How We Work" },
  { id: "partners",  ar: "شركاؤنا",  en: "Partners" },
];

const PROCESS_STEPS = [
  { icon: Lightbulb,   ar: { t: "استشارة",         d: "تواصل معنا وشارك فكرتك — نفهم احتياجك ونحدد الحل المناسب" },         en: { t: "Consultation",      d: "Reach out and share your idea — we understand your need and define the right solution" } },
  { icon: TrendingUp,  ar: { t: "تحليل وتخطيط",    d: "ندرس احتياجاتك ونضع خطة تنفيذ واضحة مع جدول زمني محدد" },           en: { t: "Analysis & Planning",d: "We study your needs and set a clear execution plan with a defined timeline" } },
  { icon: Cpu,         ar: { t: "تصميم وتطوير",    d: "فريقنا يبني نظامك بتصميم احترافي وأداء عالي بأحدث التقنيات" },       en: { t: "Design & Development",d: "Our team builds your system with pro design and high performance using latest tech" } },
  { icon: Rocket,      ar: { t: "اختبار وإطلاق",   d: "نختبر بدقة ونطلق نظامك بثقة تامة بعد مراجعة شاملة" },               en: { t: "Testing & Launch",   d: "We test thoroughly and launch your system with full confidence after comprehensive review" } },
  { icon: Zap,         ar: { t: "دعم وتحسين",      d: "صيانة مستمرة وتحديثات دورية ودعم فني متاح وقت ما تحتاج" },          en: { t: "Support & Growth",   d: "Ongoing maintenance, regular updates and tech support whenever you need it" } },
];

const FALLBACK_PLANS = [
  {
    tier: "lite",
    nameAr: "لايت", nameEn: "Lite",
    tagAr: "للشركات الناشئة", tagEn: "For Startups",
    featuresAr: ["موقع احترافي", "لوحة تحكم", "دعم فني", "3 صفحات"],
    featuresEn: ["Professional website", "Control panel", "Tech support", "3 pages"],
    price: null,
  },
  {
    tier: "pro",
    nameAr: "برو", nameEn: "Pro",
    tagAr: "الأكثر طلباً ⭐", tagEn: "Most popular ⭐",
    popular: true,
    featuresAr: ["كل ميزات لايت", "نظام متكامل", "تطبيق جوال", "تقارير متقدمة"],
    featuresEn: ["All Lite features", "Full system", "Mobile app", "Advanced reports"],
    price: null,
  },
  {
    tier: "infinite",
    nameAr: "إنفينيت", nameEn: "Infinite",
    tagAr: "بدون حدود", tagEn: "No limits",
    featuresAr: ["كل شيء في برو", "تطوير مخصص", "أولوية دعم", "خادم مخصص"],
    featuresEn: ["Everything in Pro", "Custom dev", "Priority support", "Dedicated server"],
    price: null,
  },
];

/* ─── Pricing Data (matches Prices page) ─────────────────────────────── */
const HOME_PRICES = {
  restaurant: { lite: { sm: 399,  yr: 899,  life: 5299  }, pro: { sm: 799,  yr: 1699, life: 9299  }, infinity: { sm: 1699, yr: 3299, life: 17299 } },
  ecommerce:  { lite: { sm: 649,  yr: 1349, life: 7599  }, pro: { sm: 1249, yr: 2399, life: 12799 }, infinity: { sm: 2399, yr: 4499, life: 23799 } },
  education:  { lite: { sm: 899,  yr: 1749, life: 9599  }, pro: { sm: 1699, yr: 3199, life: 16799 }, infinity: { sm: 3099, yr: 5799, life: 29799 } },
  healthcare: { lite: { sm: 649,  yr: 1349, life: 7599  }, pro: { sm: 1249, yr: 2399, life: 12799 }, infinity: { sm: 2399, yr: 4499, life: 23799 } },
  corporate:  { lite: { sm: 1249, yr: 2399, life: 12799 }, pro: { sm: 2599, yr: 4899, life: 25299 }, infinity: { sm: 5399, yr: 9999, life: 50799 } },
  ai:         { lite: { sm: 1249, yr: 2399, life: 12799 }, pro: { sm: 2599, yr: 4899, life: 25299 }, infinity: { sm: 5399, yr: 9999, life: 50799 } },
} as const;
type HomePriceSector = keyof typeof HOME_PRICES;
type HomePricePeriod = "sixmonth" | "annual" | "multiyear" | "lifetime";
type HomePriceTier   = "lite" | "pro" | "infinity";

function homeMYPrice(annual: number, years: number) {
  let t = 0;
  for (let i = 0; i < years; i++) t += annual * Math.max(1 - i * 0.05, 0.6);
  return Math.round(t);
}
function homeMYDiscount(years: number) { return Math.min((years - 1) * 5, 40); }

const HOME_TIER_FEATURES: Record<HomePriceTier, string[]> = {
  lite:     ["موقع احترافي متكامل", "لوحة تحكم سهلة", "نطاق + SSL مجاني", "دعم فني مستمر", "تقارير شهرية"],
  pro:      ["كل ميزات لايت ✦", "تطبيق جوال iOS/Android", "بوابة دفع إلكترونية", "إشعارات فورية", "تقارير ذكاء اصطناعي"],
  infinity: ["كل ميزات برو ✦✦", "تطوير مخصص بلا قيود", "خادم مستقل مخصص", "مساعد ذكاء اصطناعي", "دعم أولوية 24/7"],
};

const HOME_SECTORS_PRICING = [
  { key: "restaurant" as HomePriceSector, icon: UtensilsCrossed, ar: "مطاعم",   color: "from-orange-500 to-amber-500" },
  { key: "ecommerce"  as HomePriceSector, icon: ShoppingBag,     ar: "متاجر",   color: "from-blue-500 to-cyan-500" },
  { key: "corporate"  as HomePriceSector, icon: Building2,       ar: "شركات",   color: "from-slate-600 to-zinc-700" },
  { key: "healthcare" as HomePriceSector, icon: Heart,           ar: "صحة",     color: "from-rose-500 to-pink-600" },
  { key: "ai"         as HomePriceSector, icon: Bot,             ar: "ذكاء اصطناعي", color: "from-violet-600 to-purple-700" },
  { key: "education"  as HomePriceSector, icon: GraduationCap,   ar: "تعليم",   color: "from-indigo-500 to-blue-600" },
];

const fade = (i = 0) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.12 },
  transition: { duration: 0.55, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as any },
});

// ─── Graphic Divider — transparent, scroll-triggered, continuously animated ──
function GraphicDivider({ variant = 1 }: { variant?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); io.disconnect(); } },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const ease = [0.22, 1, 0.36, 1] as const;

  // Path draw-on animation
  const draw = (delay = 0, dur = 1.5) => ({
    initial: { pathLength: 0, opacity: 0 },
    animate: vis ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 },
    transition: { duration: dur, ease, delay },
  });

  // Colour tokens — adapts to dark/light mode via CSS var trick
  const s1  = "rgba(128,128,128,0.18)";
  const s2  = "rgba(128,128,128,0.07)";
  const acc = "rgba(128,128,128,0.38)";

  return (
    <div ref={ref} className="relative w-full overflow-visible select-none pointer-events-none dark:[--gd-acc:rgba(255,255,255,0.38)] [--gd-acc:rgba(0,0,0,0.38)]" style={{ height: 96 }}>
      <svg viewBox="0 0 1440 96" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" fill="none">

        {/* ── V1: Diagonal slashes + twin bezier arcs + drifting dots ── */}
        {variant === 1 && <>
          {Array.from({ length: 18 }, (_, i) => (
            <motion.line key={i}
              x1={i * 90} y1={0} x2={i * 90 - 96} y2={96}
              stroke={s2} strokeWidth="1"
              {...draw(i * 0.028, 0.9)}
            />
          ))}
          <motion.path
            d="M-80 70 C200 8 530 90 780 48 C1040 6 1250 80 1540 22"
            stroke={s1} strokeWidth="1.6" strokeLinecap="round"
            {...draw(0.22, 1.5)}
          />
          <motion.path
            d="M-80 30 C300 96 680 0 980 64 C1180 100 1370 28 1540 60"
            stroke={acc} strokeWidth="1" strokeLinecap="round"
            {...draw(0.48, 1.5)}
          />
          {/* Drifting dots along arcs */}
          {[180, 420, 660, 900, 1140, 1320].map((cx, i) => (
            <motion.circle key={i} cx={cx} cy={48} r={2.5}
              fill={i % 2 === 0 ? "currentColor" : "transparent"}
              stroke="currentColor" strokeWidth="1"
              className="text-black/20 dark:text-white/20"
              initial={{ opacity: 0, scale: 0 }}
              animate={vis ? {
                opacity: [0, 0.7, 0.3, 0.7, 0],
                y: [0, -(8 + i * 2), 0, (8 + i * 2), 0],
                scale: [0, 1, 1, 1, 0],
              } : {}}
              transition={{ duration: 3.5 + i * 0.3, repeat: Infinity, delay: 1.4 + i * 0.28, ease: "easeInOut" }}
            />
          ))}
        </>}

        {/* ── V2: Triple zigzag + sparks at peaks ── */}
        {variant === 2 && <>
          <motion.path
            d="M0 48 L80 16 L160 80 L240 16 L320 80 L400 16 L480 80 L560 16 L640 80 L720 16 L800 80 L880 16 L960 80 L1040 16 L1120 80 L1200 16 L1280 80 L1360 16 L1440 48"
            stroke={acc} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
            {...draw(0, 1.4)}
          />
          <motion.path
            d="M0 64 L80 32 L160 96 L240 32 L320 96 L400 32 L480 96 L560 32 L640 96 L720 32 L800 96 L880 32 L960 96 L1040 32 L1120 96 L1200 32 L1280 96 L1360 32 L1440 64"
            stroke={s1} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"
            {...draw(0.2, 1.4)}
          />
          <motion.path
            d="M0 32 L80 0 L160 64 L240 0 L320 64 L400 0 L480 64 L560 0 L640 64 L720 0 L800 64 L880 0 L960 64 L1040 0 L1120 64 L1200 0 L1280 64 L1360 0 L1440 32"
            stroke={s2} strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round"
            {...draw(0.4, 1.4)}
          />
          {/* Sparks at every other peak */}
          {[80, 240, 400, 560, 720, 880, 1040, 1200, 1360].map((cx, i) => (
            <motion.circle key={i} cx={cx} cy={16} r={3.5}
              className="text-black/25 dark:text-white/25"
              fill="currentColor"
              initial={{ opacity: 0, scale: 0 }}
              animate={vis ? { opacity: [0, 0.8, 0], scale: [0, 1.6, 0] } : {}}
              transition={{ duration: 1.4, repeat: Infinity, delay: 1.5 + i * 0.22, ease: "easeOut" }}
            />
          ))}
        </>}

        {/* ── V3: Converging fans + pulsing bullseye ── */}
        {variant === 3 && <>
          {[-32, -18, -6, 6, 18, 32].map((off, i) => (
            <motion.line key={`L${i}`}
              x1={0} y1={48 + off} x2={720} y2={48}
              stroke={i === 2 || i === 3 ? acc : i === 1 || i === 4 ? s1 : s2}
              strokeWidth={i === 2 || i === 3 ? "1.5" : i === 1 || i === 4 ? "0.9" : "0.5"}
              {...draw(i * 0.07, 1.2)}
            />
          ))}
          {[-32, -18, -6, 6, 18, 32].map((off, i) => (
            <motion.line key={`R${i}`}
              x1={1440} y1={48 + off} x2={720} y2={48}
              stroke={i === 2 || i === 3 ? acc : i === 1 || i === 4 ? s1 : s2}
              strokeWidth={i === 2 || i === 3 ? "1.5" : i === 1 || i === 4 ? "0.9" : "0.5"}
              {...draw(i * 0.07 + 0.06, 1.2)}
            />
          ))}
          {/* Bullseye rings — appear then breathe */}
          {[5, 13, 24, 38].map((r, i) => (
            <motion.circle key={i} cx={720} cy={48} r={r}
              stroke={i === 0 ? acc : i === 1 ? s1 : s2}
              strokeWidth={i === 0 ? "1.8" : "0.8"}
              initial={{ opacity: 0, scale: 0 }}
              animate={vis ? {
                opacity: 1, scale: 1,
                ...(i < 2 ? { r: [r, r + 4, r] } : {}),
              } : {}}
              transition={{
                opacity: { duration: 0.5, delay: 1.1 + i * 0.18, ease },
                scale:   { duration: 0.5, delay: 1.1 + i * 0.18, ease },
                r:       { duration: 2.5, repeat: Infinity, delay: 1.8 + i * 0.3, ease: "easeInOut" },
              }}
            />
          ))}
          {/* Solid centre dot that pulses */}
          <motion.circle cx={720} cy={48} r={5}
            className="text-black/40 dark:text-white/40" fill="currentColor"
            animate={vis ? { r: [5, 8, 5], opacity: [0.4, 0.1, 0.4] } : {}}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 1.9 }}
          />
        </>}

        {/* ── V4: Layered sine waves + dots riding the crest ── */}
        {variant === 4 && <>
          <motion.path d="M0 48 C160 48 320 16 480 48 C640 80 800 16 960 48 C1120 80 1280 48 1440 48"
            stroke={acc} strokeWidth="1.8" strokeLinecap="round" {...draw(0, 1.5)} />
          <motion.path d="M0 60 C160 60 320 28 480 60 C640 92 800 28 960 60 C1120 92 1280 60 1440 60"
            stroke={s1} strokeWidth="1.1" strokeLinecap="round" {...draw(0.2, 1.5)} />
          <motion.path d="M0 36 C160 36 320 4 480 36 C640 68 800 4 960 36 C1120 68 1280 36 1440 36"
            stroke={s1} strokeWidth="1.1" strokeLinecap="round" {...draw(0.2, 1.5)} />
          <motion.path d="M0 72 C160 72 320 40 480 72 C640 104 800 40 960 72 C1120 104 1280 72 1440 72"
            stroke={s2} strokeWidth="0.6" strokeLinecap="round" {...draw(0.4, 1.5)} />
          <motion.path d="M0 24 C160 24 320 -8 480 24 C640 56 800 -8 960 24 C1120 56 1280 24 1440 24"
            stroke={s2} strokeWidth="0.6" strokeLinecap="round" {...draw(0.4, 1.5)} />
          {/* Dots that ride the top wave's crests and troughs */}
          {[0, 1, 2, 3, 4].map((i) => {
            const baseX = i * 320;
            const isUp = i % 2 === 0;
            return (
              <motion.circle key={i} r={3}
                className="text-black/30 dark:text-white/30" fill="currentColor"
                initial={{ cx: baseX, cy: 48, opacity: 0 }}
                animate={vis ? {
                  cx: [baseX, baseX + 160, baseX + 320],
                  cy: isUp ? [48, 16, 48] : [48, 80, 48],
                  opacity: [0, 0.7, 0.7, 0],
                } : {}}
                transition={{ duration: 4.5, repeat: Infinity, delay: 1.6 + i * 0.45, ease: "easeInOut" }}
              />
            );
          })}
        </>}

        {/* ── V5: Full radial burst + rotating dashed ring + pulsing core ── */}
        {variant === 5 && <>
          {Array.from({ length: 22 }, (_, i) => {
            const angle = (i / 22) * Math.PI * 2;
            const cx = 720, cy = 48;
            const r1 = 12, r2 = 58 + (i % 5) * 12;
            return (
              <motion.line key={i}
                x1={cx + Math.cos(angle) * r1} y1={cy + Math.sin(angle) * r1}
                x2={cx + Math.cos(angle) * r2} y2={cy + Math.sin(angle) * r2}
                stroke={i % 4 === 0 ? acc : i % 2 === 0 ? s1 : s2}
                strokeWidth={i % 4 === 0 ? "1.3" : i % 2 === 0 ? "0.8" : "0.4"}
                {...draw(i * 0.022, 1.1)}
              />
            );
          })}
          <motion.line x1={0} y1={48} x2={635} y2={48} stroke={s1} strokeWidth="0.9" {...draw(0.38, 1.0)} />
          <motion.line x1={805} y1={48} x2={1440} y2={48} stroke={s1} strokeWidth="0.9" {...draw(0.38, 1.0)} />
          {/* Static inner rings */}
          {[8, 18, 30].map((r, i) => (
            <motion.circle key={i} cx={720} cy={48} r={r}
              stroke={i === 0 ? acc : s1} strokeWidth={i === 0 ? "1.8" : "0.8"}
              initial={{ opacity: 0, scale: 0 }}
              animate={vis ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.55, delay: 1.0 + i * 0.18, ease }}
            />
          ))}
          {/* Rotating outer dashed ring */}
          <motion.circle cx={720} cy={48} r={48}
            stroke={s2} strokeWidth="0.6" strokeDasharray="8 6"
            initial={{ opacity: 0 }}
            animate={vis ? { opacity: 1, rotate: 360 } : {}}
            transition={{
              opacity: { duration: 0.4, delay: 1.7 },
              rotate:  { duration: 18, repeat: Infinity, ease: "linear", delay: 1.7 },
            }}
            style={{ transformOrigin: "720px 48px" }}
          />
          {/* Pulsing core dot */}
          <motion.circle cx={720} cy={48} r={5}
            className="text-black/45 dark:text-white/45" fill="currentColor"
            animate={vis ? { r: [5, 8, 5], opacity: [0.45, 0.1, 0.45] } : {}}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 2.0 }}
          />
        </>}

      </svg>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar({ ar }: { ar: boolean }) {
  const stats = [
    { num: "37+",    arLabel: "مشروع مكتمل",       enLabel: "Projects delivered" },
    { num: "9+",     arLabel: "قطاع تخصصي",         enLabel: "Industry sectors" },
    { num: "4.97",   arLabel: "متوسط تقييم العملاء", enLabel: "Client rating avg." },
    { num: "21",     arLabel: "يوم أقصى للتسليم",    enLabel: "Days max. delivery" },
  ];
  return (
    <div className="bg-black dark:bg-white text-white dark:text-black overflow-hidden relative">
      {/* subtle grid texture */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
      <div className="relative grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.08] dark:divide-black/[0.08] rtl:divide-x-reverse">
        {stats.map((s, i) => (
          <motion.div key={i} {...fade(i)} className="text-center py-10 px-6">
            <div className="text-4xl md:text-5xl font-black tracking-tight leading-none mb-2">{s.num}</div>
            <div className="text-[11px] font-medium tracking-[0.12em] uppercase text-white/35 dark:text-black/35">
              {ar ? s.arLabel : s.enLabel}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Graphic Divider Banner ───────────────────────────────────────────────────
function GraphicBanner({ ar }: { ar: boolean }) {
  const icons = [
    { Icon: ShoppingBag,    label: ar ? "متاجر" : "Stores" },
    { Icon: Coffee,         label: ar ? "مطاعم" : "Cafés" },
    { Icon: GraduationCap,  label: ar ? "تعليم" : "Edu" },
    { Icon: Heart,          label: ar ? "صحة" : "Health" },
    { Icon: HomeIcon,       label: ar ? "عقارات" : "Real Estate" },
    { Icon: Building2,      label: ar ? "شركات" : "Corp." },
    { Icon: Scissors,       label: ar ? "تجميل" : "Beauty" },
    { Icon: Bot,            label: ar ? "ذكاء اصطناعي" : "AI" },
  ];
  return (
    <div className="relative overflow-hidden bg-gray-50 dark:bg-gray-950 border-y border-black/[0.05] dark:border-white/[0.05]">
      {/* Background dot grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "28px 28px" }} />
      <div className="container mx-auto px-5 md:px-8 max-w-6xl py-12 relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left: headline */}
          <div className="text-center md:text-start flex-shrink-0 max-w-xs">
            <div className="text-[10px] font-black tracking-[0.25em] uppercase text-black/30 dark:text-white/25 mb-3">
              {ar ? "نغطي كل القطاعات" : "Every industry covered"}
            </div>
            <div className="text-2xl md:text-3xl font-black leading-tight text-gray-900 dark:text-white">
              {ar ? "نظام لكل قطاع\nبهوية خاصة به" : "A system for every\nsector & brand"}
            </div>
          </div>
          {/* Right: icon grid */}
          <div className="grid grid-cols-4 gap-3 flex-shrink-0">
            {icons.map(({ Icon, label }, i) => (
              <motion.div
                key={i}
                {...fade(i * 0.5)}
                className="flex flex-col items-center gap-1.5 w-16"
              >
                <div className="w-12 h-12 rounded-2xl bg-black/[0.05] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-black/50 dark:text-white/45" />
                </div>
                <span className="text-[9px] font-bold text-black/35 dark:text-white/30 text-center leading-tight">{label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Review Badge Animation Delays ───────────────────────────────────────────
const TAG_ANIM: Record<string, { delay: string; dur: string }> = {
  "سرعة استجابة": { delay: "0s",    dur: "5s"  },
  "إبداع وتصميم": { delay: "1.4s",  dur: "7s"  },
  "حل سريع":      { delay: "0.6s",  dur: "4.5s"},
  "جودة عالية":   { delay: "2.1s",  dur: "6.5s"},
  "سرعة تسليم":   { delay: "0.3s",  dur: "5.5s"},
  "تواصل ممتاز":  { delay: "1.8s",  dur: "6s"  },
};

// ─── Single Review Card ───────────────────────────────────────────────────────
function ReviewCard({ r }: { r: any }) {
  const initials = (r.clientName || "ع").replace(/[^ء-ي A-Za-z]/g, "").trim().slice(0, 2);
  const anim = TAG_ANIM[r.tag] || { delay: "0s", dur: "6s" };
  return (
    <div dir="rtl" className="flex-shrink-0 w-[280px] md:w-[300px] bg-white dark:bg-gray-900 rounded-2xl p-5 mx-2 border border-black/[0.06] dark:border-white/[0.06] shadow-sm flex flex-col">
      {/* Top row: quote mark + Qirox brand */}
      <div className="flex items-start justify-between mb-2">
        <div
          className="text-[44px] font-black leading-none select-none font-serif"
          style={{ color: "transparent", WebkitTextStroke: "1.5px rgba(0,0,0,0.12)" }}
          aria-hidden
        >"</div>
        {/* Qirox badge — no background */}
        <div className="flex items-center gap-1">
          <img src="/qirox-icon.png" alt="Qirox" className="w-3.5 h-3.5 object-contain opacity-40" />
          <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 tracking-wide">QIROX</span>
        </div>
      </div>

      {/* Comment */}
      <p className="text-[12.5px] text-gray-700 dark:text-gray-300 leading-[1.75] line-clamp-3 flex-1">
        {r.comment || r.text || "—"}
      </p>

      {/* Separator */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent my-3.5" />

      {/* Footer: avatar + name + tag */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-black text-gray-500 dark:text-gray-400">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black text-gray-800 dark:text-gray-200 leading-tight truncate">{r.clientName || "عميل كيروكس"}</p>
            <p className="text-[9.5px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">{r.serviceTitle || "خدمة كيروكس"}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {r.tag && (
            <span
              className="badge-animated text-[9px] font-bold px-2 py-[4px] rounded-full tracking-wide whitespace-nowrap"
              style={{ animationDelay: anim.delay, animationDuration: anim.dur }}
            >
              {r.tag}
            </span>
          )}
          {/* Stars */}
          <div className="flex gap-[3px]">
            {[1,2,3,4,5].map(s => (
              <div
                key={s}
                className={`w-[6px] h-[6px] rounded-full ${
                  s <= (r.rating || 5)
                    ? "bg-amber-400"
                    : "bg-black/10 dark:bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Single Seamless Review Track ────────────────────────────────────────────
// Duplicates the reviews so translateX(-50%) lands exactly back at the start.
function ReviewTrack({ reviews }: { reviews: any[] }) {
  const enough = reviews.length < 8 ? [...reviews, ...reviews, ...reviews, ...reviews] : reviews;
  const items = [...enough, ...enough];           // 2× → loop at -50%
  const dur = `${Math.max(enough.length * 3.2, 44)}s`;
  return (
    <div
      className="flex overflow-hidden"
      style={{ WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)", maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}
    >
      <div
        className="flex shrink-0"
        style={{ animation: `marquee-left ${dur} linear infinite`, willChange: "transform" }}
      >
        {items.map((r, i) => <ReviewCard key={`${r.id}-${i}`} r={r} />)}
      </div>
    </div>
  );
}

export default function Home() {
  const { lang, dir } = useI18n();
  const ar = lang === "ar";
  const [tab, setTab] = useState<string>("systems");
  const [, setLocation] = useLocation();
  const currency = useCurrency();

  // ── Pricing section state ──────────────────────────────────────────────────
  const [pricingSector, setPricingSector] = useState<HomePriceSector>("restaurant");
  const [pricingPeriod, setPricingPeriod] = useState<HomePricePeriod>("annual");
  const [pricingYears, setPricingYears] = useState(2);

  // ── Auto-scroll sector cards ──────────────────────────────────────────────
  const sectorScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sectorScrollRef.current;
    if (!el) return;
    let paused = false;
    let timer: ReturnType<typeof setTimeout>;
    const doScroll = () => {
      if (paused) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 300, behavior: "smooth" });
      }
      timer = setTimeout(doScroll, 2800);
    };
    timer = setTimeout(doScroll, 3500);
    const pause = () => { paused = true; clearTimeout(timer); };
    const resume = () => { paused = false; timer = setTimeout(doScroll, 2000); };
    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", resume, { passive: true });
    return () => {
      clearTimeout(timer);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resume);
    };
  }, []);

  useSEO({
    title: ar
      ? "كيروكس استوديو — بناء مواقع وتطبيقات وأنظمة رقمية في الرياض"
      : "Qirox Studio — Websites, Apps & Digital Systems in Riyadh",
    description: ar
      ? "كيروكس استوديو: شركة برمجة سعودية في الرياض. نبني مواقع إلكترونية، تطبيقات جوال، وأنظمة إدارة ذكية لأكثر من 10 قطاعات. تسليم سريع وجودة عالية."
      : "Qirox Studio: Saudi software company in Riyadh. We build websites, mobile apps, and smart management systems for 10+ sectors. Fast delivery, high quality.",
    keywords: "كيروكس استوديو, خدمات كيروكس استوديو, قيروكس استوديو, كيروكس, Qirox Studio, شركة برمجة مواقع السعودية, تطوير تطبيقات الرياض, بناء مواقع, نظام إدارة ذكي, برمجة مواقع الرياض, أفضل شركة برمجة سعودية, تصميم مواقع الرياض, شركة برمجة الرياض, تطوير مواقع سعودية, أنظمة إدارة الأعمال",
    canonical: "/",
    jsonLd: [{
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Qirox Studio",
      "url": "https://qiroxstudio.online",
      "logo": "https://qiroxstudio.online/qirox-icon.png",
      "description": ar
        ? "شركة برمجة سعودية متخصصة في بناء المواقع والتطبيقات والأنظمة الرقمية"
        : "Saudi software company specialized in websites, apps, and digital systems",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "الرياض",
        "addressRegion": "منطقة الرياض",
        "addressCountry": "SA"
      },
      "sameAs": ["https://qiroxstudio.online"],
    }],
  });

  const { data: user } = useUser();
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [appleEnabled, setAppleEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/auth/google/status").then(r => r.json()).then(d => setGoogleEnabled(!!d.enabled)).catch(() => {});
    fetch("/api/auth/apple/status").then(r => r.json()).then(d => setAppleEnabled(!!d.enabled)).catch(() => {});
  }, []);

  const { data: templates = [] } = useTemplates();
  const { data: apiPartners = [], isLoading: partnersLoading } = useQuery<Partner[]>({ queryKey: ["/api/partners"] });
  const { data: pricingPlans = [] } = useQuery<any[]>({ queryKey: ["/api/pricing"] });
  const { data: publicReviews = [] } = useQuery<any[]>({ queryKey: ["/api/reviews/public"] });

  const STATIC_REVIEWS = [
    { id: "sr1",  clientName: "م. العنزي",   serviceTitle: "متجر إلكتروني",      rating: 5, tag: "سرعة استجابة", comment: "والله ما توقعت الرد يجي بهالسرعة. كتبت لهم الساعة 11 الليل وجاوبوني خلال دقيقتين وحلّوا المشكلة. هذا مستوى خدمة ما شفته عند أحد." },
    { id: "sr2",  clientName: "أ. الزهراني", serviceTitle: "موقع مطعم",          rating: 5, tag: "إبداع وتصميم",  comment: "التصميم طلع فوق التوقعات بمراحل. أرسلت لهم فكرة بسيطة وجابوا لي شيء ما خطر على بالي. إبداع حقيقي." },
    { id: "sr3",  clientName: "م. الغامدي",  serviceTitle: "نظام حجوزات",        rating: 5, tag: "حل سريع",       comment: "واجهت مشكلة في صفحة الدفع أول ما شغّلنا النظام. تواصلت معهم وخلال ساعة كانت المشكلة محلولة وكل شيء شغّال تمام. ردهم كان أسرع مما توقعت." },
    { id: "sr4",  clientName: "أ. القحطاني", serviceTitle: "متجر ملابس",         rating: 5, tag: "جودة عالية",   comment: "اشتغلت مع شركات كثيرة قبل كيروكس وما لقيت نفس الاحترافية. الجودة واضحة في كل تفصيلة من المشروع." },
    { id: "sr5",  clientName: "م. الشهري",   serviceTitle: "موقع خدمات",         rating: 5, tag: "سرعة تسليم",   comment: "أُنجز المشروع قبل الموعد المحدد بيومين! وطلعت النتيجة أفضل مما توقعت. ما شاء الله على الفريق." },
    { id: "sr6",  clientName: "أ. الدوسري",  serviceTitle: "موقع عيادة",         rating: 5, tag: "تواصل ممتاز",  comment: "كل مرة تواصلت فيها مع الفريق كان الرد فوري والحل واضح. ما احتجت أشرح المشكلة أكثر من مرة." },
    { id: "sr7",  clientName: "م. السلمي",   serviceTitle: "نظام إدارة",         rating: 5, tag: "إبداع وتصميم",  comment: "قلت لهم ابني لي شيء يعبر عن شركتي. جابوا نظام احترافي بتصميم ما رأيت مثله في السوق. فعلاً مختلفون." },
    { id: "sr8",  clientName: "أ. المطيري",  serviceTitle: "متجر إلكتروني",      rating: 4, tag: "حل سريع",       comment: "كان عندي تعليق على بعض التفاصيل بعد التسليم، بس فريق كيروكس ما أخّر وعدّل كل شيء في نفس اليوم. هذا الاحترام يُقدَّر." },
    { id: "sr9",  clientName: "م. العتيبي",  serviceTitle: "تطبيق جوال",         rating: 5, tag: "سرعة استجابة", comment: "لا أبالغ لو قلت إن ردودهم كانت أسرع من ردود بعض الموظفين في شركتي! دعم فوري ومتواصل." },
    { id: "sr10", clientName: "أ. الرشيدي",  serviceTitle: "منصة تعليمية",       rating: 5, tag: "جودة عالية",   comment: "الكود نظيف، الأداء سريع، والتصميم احترافي. فريق يعرف ماذا يفعل ويعرف كيف يُسعد العميل." },
    { id: "sr11", clientName: "م. الحربي",   serviceTitle: "موقع شركة",          rating: 5, tag: "سرعة تسليم",   comment: "أرسلت الطلب وأُنجز في وقت قياسي. الأقل من المتوقع زمنياً والأكثر من المتوقع جودةً." },
    { id: "sr12", clientName: "أ. الجهني",   serviceTitle: "متجر مجوهرات",       rating: 5, tag: "إبداع وتصميم",  comment: "أنا في مجال الفاخر والاحترافية شرط عندي. كيروكس فاجأني بتصميم يليق بعلامتي التجارية تماماً." },
    { id: "sr13", clientName: "م. البقمي",   serviceTitle: "نظام مستودعات",      rating: 5, tag: "حل سريع",       comment: "عندنا خطأ في التقارير أربكنا. كتبنا للدعم وخلال 30 دقيقة تقريباً كان الخطأ محلولاً وأُرسلت لنا التقارير الصحيحة." },
    { id: "sr14", clientName: "أ. الثبيتي",  serviceTitle: "موقع مطعم",          rating: 5, tag: "تواصل ممتاز",  comment: "الفريق يتعامل معك وكأنك صديق لا مجرد عميل. يشرحون كل شيء بوضوح ويحرصون على رضاك." },
    { id: "sr15", clientName: "م. العمري",   serviceTitle: "متجر إلكتروني",      rating: 5, tag: "سرعة استجابة", comment: "راسلتهم في يوم العطلة وجاء الرد خلال دقائق. هذا الالتزام بخدمة العميل نادر جداً." },
    { id: "sr16", clientName: "أ. الشمري",   serviceTitle: "تطبيق توصيل",        rating: 5, tag: "جودة عالية",   comment: "التطبيق شغّال بسرعة وبدون أخطاء من اليوم الأول. الاختبار كان شاملاً والتسليم كان محترماً." },
    { id: "sr17", clientName: "م. الفيفي",   serviceTitle: "نظام فندقي",         rating: 4, tag: "حل سريع",       comment: "واجهنا مشكلة في نظام الحجوزات أيام الذروة. الدعم تواصل معنا فوراً وحلّ المشكلة في أقل من ساعة." },
    { id: "sr18", clientName: "أ. الزيد",    serviceTitle: "منصة خدمات",         rating: 5, tag: "إبداع وتصميم",  comment: "أعطيتهم حرية التصميم الكاملة وما خذلوني. جاء التصميم بمستوى عالمي وهوية بصرية قوية." },
    { id: "sr19", clientName: "م. الصاعدي",  serviceTitle: "موقع عقارات",        rating: 5, tag: "سرعة تسليم",   comment: "قالوا لي أسبوعين وسلّموا في 10 أيام. الجودة ما اختلفت، بالعكس زادت. فريق محترم ومحترف." },
    { id: "sr20", clientName: "أ. المالكي",  serviceTitle: "نظام صيدلية",        rating: 5, tag: "تواصل ممتاز",  comment: "ما مررت بتجربة مريحة مثلها. الفريق يرد، يشرح، يتابع، ويسلّم. كل خطوة كانت واضحة." },
    { id: "sr21", clientName: "م. الأحمدي",  serviceTitle: "متجر مواد بناء",     rating: 5, tag: "سرعة استجابة", comment: "ردهم أسرع من واتساب شخصي! وليس فقط رد، بل حل فعلي ومتابعة إلى أن تأكدوا من حل المشكلة." },
    { id: "sr22", clientName: "أ. السبيعي",  serviceTitle: "موقع مدرسة",         rating: 5, tag: "جودة عالية",   comment: "الموقع يعمل بكفاءة عالية حتى في أوقات الازدحام. اختبروه جيداً قبل التسليم وهذا يُظهر احترافيتهم." },
    { id: "sr23", clientName: "م. القرني",   serviceTitle: "تطبيق كوبونات",      rating: 5, tag: "حل سريع",       comment: "طلبت تعديلاً على نظام الكوبونات بعد الإطلاق. التعديل انتهى في نفس اليوم. ما توقعت هالسرعة." },
    { id: "sr24", clientName: "أ. الحميدي",  serviceTitle: "منصة عروض",          rating: 5, tag: "إبداع وتصميم",  comment: "التصميم كان مبتكراً ومختلفاً عن كل ما رأيته في السوق. كيروكس عندهم لمسة إبداعية خاصة." },
    { id: "sr25", clientName: "م. العسيري",  serviceTitle: "نظام مطاعم",         rating: 5, tag: "سرعة تسليم",   comment: "أسرع تسليم مشروع في تاريخي مع شركات التقنية. وبالجودة المطلوبة. هذا الجمع بين السرعة والجودة نادر." },
    { id: "sr26", clientName: "أ. الغنام",   serviceTitle: "موقع مؤسسة",         rating: 4, tag: "حل سريع",       comment: "كان عندنا خلل في صفحة التواصل أخّرنا. تواصلت مع الدعم وكان الحل جاهزاً قبل ما أنهي كوبي الشاي!" },
    { id: "sr27", clientName: "م. الوادعي",  serviceTitle: "متجر عطور",           rating: 5, tag: "تواصل ممتاز",  comment: "يتابعون معك حتى بعد التسليم. أرسلوا لي رسالة بعد أسبوع يسألون عن الأداء. هذا نادر في هذا المجال." },
    { id: "sr28", clientName: "أ. الزراعي",  serviceTitle: "نظام مزرعة",         rating: 5, tag: "سرعة استجابة", comment: "نظام زراعي متخصص وما ترددوا في بنائه. ردّوا على كل استفساراتي التقنية بسرعة ووضوح." },
    { id: "sr29", clientName: "م. الحسين",   serviceTitle: "تطبيق لياقة",        rating: 5, tag: "جودة عالية",   comment: "التطبيق أُطلق وما واجهنا أي مشكلة تقنية. العمل الاحترافي واضح من التفاصيل الصغيرة." },
    { id: "sr30", clientName: "أ. الصقر",    serviceTitle: "موقع بوتيك",         rating: 5, tag: "إبداع وتصميم",  comment: "قلت لهم أريد شيئاً راقياً ومميزاً. جاء التصميم بمستوى يليق بعلامة تجارية دولية." },
    { id: "sr31", clientName: "م. المحيسن",  serviceTitle: "نظام جمعية",         rating: 5, tag: "سرعة تسليم",   comment: "أول مرة أشوف مشروع ينتهي قبل الموعد وبجودة أعلى مما طلبت. الفريق فاق توقعاتي." },
    { id: "sr32", clientName: "أ. النفيسة",  serviceTitle: "موقع تجميل",         rating: 5, tag: "حل سريع",       comment: "واجهت مشكلة في حجوزات السبا أول يوم. خمس دقائق وكانت محلولة. خمس دقائق! هذا الدعم الحقيقي." },
    { id: "sr33", clientName: "م. الرفاعي",  serviceTitle: "منصة سياحة",         rating: 5, tag: "تواصل ممتاز",  comment: "الفريق واضح، صادق، وملتزم. ما قالوا نعم على كل شيء، شرحوا ما يمكن وما لا يمكن وهذا الاحترام يبني الثقة." },
    { id: "sr34", clientName: "أ. القصيبي",  serviceTitle: "نظام مستشفى",        rating: 5, tag: "سرعة استجابة", comment: "في قطاع الصحة الوقت حرج. دعم كيروكس تعامل مع طلباتنا بهذه الأهمية ولم يقصّروا يوماً." },
    { id: "sr35", clientName: "م. المنصور",  serviceTitle: "موقع شركة استثمار",  rating: 5, tag: "جودة عالية",   comment: "أُعطي المشروع لفريق كيروكس بعد أن فشلت شركتان قبلهم. سلّموا بجودة عالية وبدون تعقيدات." },
    { id: "sr36", clientName: "أ. العقيل",   serviceTitle: "متجر إلكتروني",      rating: 5, tag: "إبداع وتصميم",  comment: "كان عندي صورة ذهنية لما أريد. كيروكس ترجمها إلى واقع أفضل مما تخيّلت. إبداع بلا مبالغة." },
    { id: "sr37", clientName: "م. الجبر",    serviceTitle: "تطبيق خدمات منزلية", rating: 5, tag: "سرعة تسليم",   comment: "تسليم سريع، اختبار دقيق، ودعم ما بعد التسليم. المشروع شغّال من اليوم الأول بكفاءة تامة." },
  ];

  const displayReviews = (publicReviews as any[]).length > 0 ? publicReviews : STATIC_REVIEWS;

  const Arrow = ar ? ArrowLeft : ArrowRight;

  const CURRENT_CATEGORIES = ["restaurant", "ecommerce", "food", "مطاعم", "متاجر", "Restaurants", "E-Commerce"];
  const visibleTemplates = useMemo(
    () =>
      (templates as any[])
        .filter((t) => {
          if (t?.status === "draft") return false;
          const cat = (t?.category || t?.sector || "").toLowerCase();
          return CURRENT_CATEGORIES.some((c) => cat.includes(c.toLowerCase()));
        })
        .slice(0, 4),
    [templates]
  );
  const CURRENT_SECTORS = SECTORS.filter((s) => s.arName === "متاجر إلكترونية" || s.arName === "مطاعم ومقاهي");

  const displayedPlans = (pricingPlans as any[]).length > 0 ? (pricingPlans as any[]).slice(0, 3) : FALLBACK_PLANS;

  return (
    <div className="min-h-screen flex flex-col bg-white text-black dark:bg-gray-950 dark:text-white" dir={dir}>
      <Navigation />

      <main className="flex-1">
        {/* ─── HERO ─── */}
        <section className="relative bg-[#f0f0ee] dark:bg-[#0d0d0d] overflow-x-hidden">
          <div className="container mx-auto px-6 md:px-10 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 items-end gap-0 lg:gap-6 pt-28 lg:pt-32">

              {/* ── Text column ── */}
              <motion.div {...fade(0)} className="flex flex-col justify-center order-1">
                <p className={`text-[10px] md:text-[11px] font-bold uppercase text-black/40 dark:text-white/35 mb-7 ${ar ? "tracking-normal" : "tracking-[0.22em]"}`}>
                  {ar ? "نبني أنظمة رقمية تتوسّع معك" : "We Build Digital Systems That Scale"}
                </p>
                <h1 className="text-5xl sm:text-6xl lg:text-[4.25rem] xl:text-[4.75rem] font-black leading-[1.0] tracking-tight text-black dark:text-white mb-6">
                  {ar ? (<>من الفكرة<br />إلى الأثر.</>) : (<>From Vision<br />to Impact.</>)}
                </h1>
                <p className="text-base md:text-[17px] text-black/55 dark:text-white/45 max-w-[340px] mb-10 leading-relaxed">
                  {ar
                    ? "كيروكس يشارك الشركات الطموحة في تصميم وبناء وتطوير منتجات رقمية تحقق نتائج حقيقية."
                    : "Qirox Studio partners with ambitious businesses to design, build and scale digital products that drive real results."}
                </p>
                <div className="flex flex-wrap items-center gap-5 mb-8">
                  <Link href="/start">
                    <Button size="lg" className="bg-black text-white hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90 rounded-full h-12 px-8 font-bold gap-2 text-sm" data-testid="button-hero-start">
                      {ar ? "ابدأ مشروعك" : "Start Your Project"}
                      <Arrow className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/about" className="flex items-center gap-1.5 text-sm font-semibold text-black/55 dark:text-white/45 hover:text-black dark:hover:text-white transition-colors border-b border-black/20 dark:border-white/20 pb-px">
                    {ar ? "شاهد أعمالنا" : "See Our Work"}
                    <Arrow className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {!user && (googleEnabled || appleEnabled) && (
                  <motion.div {...fade(0.5)} className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 w-full max-w-[260px]">
                      <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
                      <span className="text-[10px] font-bold text-black/30 dark:text-white/25 whitespace-nowrap">
                        {ar ? "أو سجّل الدخول بـ" : "or sign in with"}
                      </span>
                      <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
                    </div>
                    <div className="flex gap-2">
                      {googleEnabled && (
                        <button onClick={() => { window.location.href = "/api/auth/google"; }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.08] transition-colors text-sm font-bold text-black dark:text-white shadow-sm" data-testid="btn-hero-google-login">
                          <SiGoogle className="w-4 h-4 text-[#4285F4]" />Google
                        </button>
                      )}
                      {appleEnabled && (
                        <button onClick={() => { window.location.href = "/api/auth/apple"; }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black hover:bg-white dark:hover:bg-white/[0.06] transition-colors text-sm font-bold text-black dark:text-white shadow-sm" data-testid="btn-hero-apple-login">
                          <SiApple className="w-4 h-4" />Apple
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* ── Hero image column ── */}
              <motion.div {...fade(0)} className="flex items-end justify-center order-2 -mx-4 sm:-mx-6 lg:mx-0 overflow-visible">
                <img
                  src="/qirox-hero-new.png"
                  alt="QIROX"
                  className="w-full max-w-[520px] sm:max-w-[640px] lg:max-w-none lg:w-full select-none pointer-events-none block"
                  draggable={false}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              </motion.div>

            </div>
          </div>

          {/* ── Fade transition to white / dark-bg ── */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none h-14 bg-gradient-to-b from-transparent to-white dark:to-[#0a0a0a]" />
        </section>

        {/* ─── TAB BAR ─── */}
        <div className="sticky top-16 z-30 -mt-4 mb-2">
          <div className="container mx-auto px-5 md:px-8 max-w-6xl flex justify-center">
            <div className="inline-flex items-center gap-1 p-1.5 rounded-full bg-white/85 dark:bg-black/85 backdrop-blur-md border border-black/10 dark:border-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)]">
              {TABS.map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTab(t.id);
                      document.getElementById(`tab-${t.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={`shrink-0 px-4 md:px-5 h-9 rounded-full text-xs md:text-sm font-bold transition-all ${
                      active ? "bg-black text-white dark:bg-white dark:text-black" : "text-black/55 dark:text-white/55 hover:text-black dark:hover:text-white"
                    }`}
                    data-testid={`tab-${t.id}`}
                  >
                    {ar ? t.ar : t.en}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── SYSTEMS ─── */}
        <section id="tab-systems" className="pt-14 pb-0 md:pt-20 bg-white dark:bg-[#0a0a0a]" style={{ overflowX: "clip" }}>

          {/* ── Mobile header (above the flex row) ── */}
          <div className="md:hidden px-5 mb-6">
            <p className={`text-[10px] font-bold ${ar ? "" : "tracking-[0.22em]"} uppercase text-black/35 dark:text-white/30 mb-3`}>
              {ar ? "أنظمتنا" : "OUR SYSTEMS"}
            </p>
            <h2 className="text-3xl font-black leading-tight text-black dark:text-white mb-2 tracking-tight">
              {ar ? "أنظمة جاهزة لكل قطاع" : "Ready for every sector"}
            </h2>
          </div>

          <div className="flex items-start" dir={dir}>

            {/* ── LEFT: Text column (desktop only) ── */}
            <motion.div {...fade(0)} className="hidden md:flex flex-shrink-0 flex-col justify-center w-[220px] lg:w-[260px] px-8 lg:px-12 pt-4">
              <p className={`text-[10px] font-bold ${ar ? "" : "tracking-[0.22em]"} uppercase text-black/35 dark:text-white/30 mb-5`}>
                {ar ? "أنظمتنا" : "OUR SYSTEMS"}
              </p>
              <h2 className="text-[1.85rem] lg:text-[2.2rem] font-black leading-[1.15] text-black dark:text-white mb-4 tracking-tight">
                {ar ? "أنظمة جاهزة لكل قطاع" : "Ready for every sector"}
              </h2>
              <p className="text-sm text-black/50 dark:text-white/45 leading-relaxed mb-7">
                {ar ? "حلول متكاملة لتبسيط عملياتك ودفع نموك." : "Integrated solutions to streamline operations."}
              </p>
              <Link href="/systems">
                <button className="inline-flex items-center gap-2 text-sm font-bold border border-black/20 dark:border-white/20 rounded-full px-5 py-2.5 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-300">
                  {ar ? "عرض كل الأنظمة" : "See all systems"}
                  <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              </Link>
            </motion.div>

            {/* ── RIGHT: Horizontal scroll cards ── */}
            <motion.div {...fade(1)} className="flex-1 min-w-0 overflow-hidden">
              <div
                ref={sectorScrollRef}
                className="overflow-x-auto pb-10 pr-5 md:pr-8 pl-4 snap-x snap-mandatory scroll-smooth"
                style={{
                  display: "grid",
                  gridAutoFlow: "column",
                  gridAutoColumns: "min(72vw, 200px)",
                  gap: "14px",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                } as React.CSSProperties}
              >
                {SECTORS.map((s: any, i: number) => {
                  const Icon = s.icon;
                  const name = ar ? s.arName : s.enName;
                  return (
                    <Link key={i} href={`/sector/${s.slug}`}>
                      <div
                        className="group rounded-[20px] overflow-hidden cursor-pointer snap-start transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_32px_56px_-12px_rgba(0,0,0,0.5)] relative w-full"
                        style={{ height: 420 }}
                        data-testid={`card-sector-${i}`}
                      >
                        {/* ── Full-bleed photo ── */}
                        <img
                          src={s.img}
                          alt={name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          loading="lazy"
                        />

                        {/* ── Gradient overlay: subtle top → deep black bottom ── */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.88) 70%, rgba(0,0,0,0.97) 100%)" }}
                        />

                        {/* ── Text + icon — bottom overlay ── */}
                        <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col">
                          {/* Icon badge */}
                          <div className="w-9 h-9 rounded-[10px] bg-black/45 backdrop-blur-sm border border-white/15 flex items-center justify-center mb-3">
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          {/* Sector name */}
                          <h3
                            className="text-[1.4rem] font-black text-white leading-tight mb-1.5 tracking-tight"
                            style={{
                              animation: `sector-type ${Math.max(0.5, name.length * 0.055)}s steps(${name.length}, end) ${i * 0.18}s both`,
                            }}
                          >
                            {name}
                          </h3>
                          <p className="text-[11px] text-white/58 leading-relaxed line-clamp-2 mb-3">
                            {ar ? s.arDesc : s.enDesc}
                          </p>
                          {/* Arrow — bottom right */}
                          <div className="flex justify-end">
                            <div className="w-8 h-8 rounded-full border border-white/30 group-hover:border-white/70 group-hover:bg-white/12 flex items-center justify-center transition-all duration-300">
                              <ChevronRight className="w-3.5 h-3.5 text-white rtl:rotate-180" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {/* ── "لم تجد قطاعك؟" card — QIROX branded ── */}
                <Link href="/start">
                  <div
                    className="group rounded-[20px] overflow-hidden cursor-pointer snap-start transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_24px_60px_-12px_rgba(255,255,255,0.15)] flex flex-col w-full"
                    style={{ height: 460 }}
                  >
                    {/* Top — QIROX icon with glow */}
                    <div className="relative overflow-hidden bg-[#0a0a0a] flex items-center justify-center" style={{ height: 258, flexShrink: 0 }}>
                      {/* Radial glow behind icon */}
                      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 70%)" }} />
                      {/* Animated concentric rings */}
                      <div className="absolute w-32 h-32 rounded-full border border-white/[0.06] animate-ping" style={{ animationDuration: "3s" }} />
                      <div className="absolute w-48 h-48 rounded-full border border-white/[0.04]" style={{ animation: "ping 4s cubic-bezier(0,0,0.2,1) infinite" }} />
                      {/* Dot grid */}
                      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
                      {/* QIROX icon */}
                      <div className="relative z-10 flex flex-col items-center gap-3">
                        <div className="w-20 h-20 rounded-[22px] bg-white/[0.06] border border-white/[0.12] flex items-center justify-center group-hover:bg-white/[0.10] transition-all duration-500 group-hover:scale-110">
                          <img src={qiroxLogo} alt="QIROX" className="w-12 h-12 object-contain opacity-90" />
                        </div>
                      </div>
                    </div>
                    {/* Dark info panel */}
                    <div className="flex-1 bg-[#0a0a0a] p-5 flex flex-col justify-between">
                      <div>
                        <div className="w-[50px] h-[50px] rounded-[14px] bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-3.5">
                          <Sparkles className="w-5 h-5 text-white/70" />
                        </div>
                        <h3 className="text-[1.15rem] font-black text-white leading-snug mb-2 tracking-tight">
                          {ar ? "لم تجد قطاعك؟" : "Don't see your sector?"}
                        </h3>
                        <p className="text-[12.5px] text-white/50 leading-relaxed">
                          {ar ? "نبني نظامك من الصفر بهوية خاصة تحت إشراف مبرمجين متخصصين." : "We build your system from scratch with a unique identity."}
                        </p>
                      </div>
                      <div className="w-9 h-9 rounded-full border border-white/20 group-hover:border-white/60 group-hover:bg-white/[0.08] flex items-center justify-center transition-all duration-300 mt-3 self-start">
                        <ChevronRight className="w-4 h-4 text-white rtl:rotate-180" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>

              <style>{`
                .snap-x::-webkit-scrollbar { display: none; }
                @keyframes sector-type {
                  from { clip-path: inset(0 0 0 100%); }
                  to   { clip-path: inset(0 0 0 0); }
                }
              `}</style>
            </motion.div>
          </div>
        </section>

        {/* ─── WHY QIROX ─── */}
        <section className="bg-[#0d0d0d] relative overflow-hidden border-y border-white/[0.06]">
          {/* Subtle dot grid */}
          <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

          <div className="relative flex flex-col lg:flex-row">

            {/* Left: headline column */}
            <motion.div {...fade(0)}
              className="shrink-0 flex flex-col justify-center px-8 md:px-10 py-10 md:py-12 lg:border-e border-white/[0.06] lg:w-[280px] xl:w-[310px]">
              <p className="text-[9px] font-black tracking-[0.28em] uppercase text-white/28 mb-4">WHY QIROX</p>
              <h2 className="text-[1.6rem] md:text-[1.85rem] font-black leading-[1.12] text-white mb-5 tracking-tight" dir={dir}>
                {ar ? (<>بنينا مختلفين.<br />عشان تتوسّع<br />بشكل مختلف.</>)
                     : (<>Built different.<br />So you can scale<br />differently.</>)}
              </h2>
              <Link href="/about">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/40 hover:text-white/80 transition-colors cursor-pointer" dir={dir}>
                  {ar ? "تعرّف علينا أكثر" : "Learn more about us"}
                  <Arrow className="w-3 h-3" />
                </span>
              </Link>
            </motion.div>

            {/* Right: 6 items in single row with dividers */}
            {/* always a single scrollable row — no wrapping on any screen size */}
            <div className="flex-1 flex overflow-x-auto scrollbar-none border-t border-white/[0.06] lg:border-t-0 divide-x divide-white/[0.06] rtl:divide-x-reverse">
              {[
                { icon: Lightbulb,  en: "Custom\nSolution",        ar: "حل\nمخصص",              enDesc: "Built around your business.",               arDesc: "مبني حول عملك." },
                { icon: Layers,     en: "Scalable\nArchitecture",   ar: "بنية قابلة\nللتوسّع",   enDesc: "Systems that grow with you.",               arDesc: "أنظمة تنمو مع مشروعك." },
                { icon: Bot,        en: "AI &\nAutomation",         ar: "ذكاء اصطناعي\nوأتمتة",  enDesc: "Intelligent tools to save time and increase impact.", arDesc: "أدوات تسرّع إنتاجك وتوسّع أثرك." },
                { icon: Shield,     en: "Secure\n& Reliable",       ar: "آمن\nوموثوق",            enDesc: "Enterprise-grade security and 99.9% uptime.", arDesc: "أمان مستوى المؤسسات وتشغيل 99.9%." },
                { icon: Star,       en: "Dedicated\nSupport",       ar: "دعم\nمخصص",              enDesc: "A team with you at every step.",             arDesc: "فريق بجانبك في كل خطوة." },
                { icon: TrendingUp, en: "Proven\nResults",          ar: "نتائج\nمثبتة",           enDesc: "37+ successful projects across industries.", arDesc: "37+ مشروع ناجح في قطاعات متعددة.", stat: "37+ projects · 9+ sectors" },
              ].map((f, i) => {
                const FIcon = f.icon;
                const titleLines = ar ? f.ar.split("\n") : f.en.split("\n");
                return (
                  <motion.div key={i} {...fade(i * 0.06)}
                    className="flex flex-col gap-3 px-5 py-8 md:px-6 hover:bg-white/[0.03] transition-colors duration-200 min-w-[130px] flex-1 shrink-0">
                    <div className="w-7 h-7 flex items-center justify-center">
                      <FIcon className="w-[18px] h-[18px] text-white/55" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-white leading-snug mb-1.5">
                        {titleLines[0]}{titleLines[1] ? <><br />{titleLines[1]}</> : null}
                      </p>
                      <p className="text-[11px] text-white/55 leading-[1.6]">
                        {ar ? f.arDesc : f.enDesc}
                      </p>
                    </div>
                    {f.stat && (
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.15em] mt-auto">{f.stat}</p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── LIVE DEMO ─── */}
        <section className="py-16 md:py-24 bg-white dark:bg-[#0a0a0a] overflow-hidden">
          <div className="container mx-auto px-5 md:px-10 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

              {/* Left: text */}
              <motion.div {...fade(0)}>
                <p className="text-[10px] font-black tracking-[0.25em] uppercase text-black/30 dark:text-white/30 mb-5">LIVE DEMO</p>
                <h2 className="text-3xl md:text-5xl font-black leading-[1.05] tracking-tight mb-5 text-black dark:text-white">
                  {ar ? (<>شاهد الأنظمة<br />تعمل على أرض الواقع</>) : (<>See our systems<br />in real action</>)}
                </h2>
                <p className="text-base text-black/52 dark:text-white/45 leading-relaxed mb-8 max-w-sm">
                  {ar ? "اكتشف كيف تبدو أنظمتنا في العمل الفعلي قبل أن تقرر — تجربة حقيقية قبل الالتزام."
                       : "Discover how our systems look in real action before you decide — a real trial before any commitment."}
                </p>
                <a href="#tab-templates" onClick={(e) => { e.preventDefault(); document.getElementById("tab-templates")?.scrollIntoView({ behavior: "smooth" }); }}>
                  <button className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black rounded-full h-12 px-7 text-sm font-bold hover:opacity-80 transition-opacity shadow-lg shadow-black/10">
                    {ar ? "استكشف الديمو الآن" : "Explore the demo now"}
                    <Arrow className="w-4 h-4" />
                  </button>
                </a>
              </motion.div>

              {/* Right: devices mockup image */}
              <motion.div {...fade(1)} className="flex items-center justify-center">
                <img
                  src="/demo-devices.png"
                  alt="QIROX Demo"
                  className="w-full max-w-lg object-contain drop-shadow-2xl"
                  loading="lazy"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── PRICING ─── */}
        <section id="tab-pricing" className="pt-16 pb-24 md:pt-20 md:pb-28 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="container mx-auto px-5 md:px-8 max-w-6xl">

            <motion.div {...fade(0)} className="mb-10 text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
                {ar ? "باقات مرنة" : "Flexible plans"}
                <br />
                <span className="text-black/30 dark:text-white/30">{ar ? "تناسب كل قطاع وميزانية" : "for every sector & budget"}</span>
              </h2>
              <p className="text-black/50 dark:text-white/50 text-sm leading-relaxed max-w-lg mx-auto">
                {ar ? "أسعار شفافة بدون رسوم مخفية — اختر قطاعك وطريقة الدفع واطلب الآن." : "Transparent pricing with no hidden fees — pick your sector and billing cycle."}
              </p>
            </motion.div>

            {/* ── Sector Tabs ── */}
            <motion.div {...fade(1)} className="mb-6">
              <p className="text-center text-[10px] font-black tracking-widest uppercase text-black/25 dark:text-white/25 mb-3">اختر قطاعك</p>
              <div className="flex flex-wrap justify-center gap-2">
                {HOME_SECTORS_PRICING.map((s) => {
                  const Icon = s.icon;
                  const active = pricingSector === s.key;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setPricingSector(s.key)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 border ${
                        active
                          ? "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black shadow-lg scale-105"
                          : "bg-black/[0.03] dark:bg-white/[0.03] border-black/[0.07] dark:border-white/[0.07] text-black/55 dark:text-white/55 hover:bg-black/[0.07] dark:hover:bg-white/[0.07]"
                      }`}
                      data-testid={`button-pricing-sector-${s.key}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {s.ar}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* ── Period Switcher ── */}
            <motion.div {...fade(2)} className="flex flex-col items-center mb-8 gap-3">
              <div className="flex gap-1 p-1 bg-black/[0.04] dark:bg-white/[0.04] rounded-xl">
                {([ 
                  { key: "sixmonth" as HomePricePeriod, ar: "6 أشهر",      icon: CalendarRange },
                  { key: "annual"   as HomePricePeriod, ar: "سنة",          icon: CalendarDays  },
                  { key: "multiyear"as HomePricePeriod, ar: "سنوات+",       icon: CalendarDays  },
                  { key: "lifetime" as HomePricePeriod, ar: "مدى الحياة",   icon: Infinity      },
                ] as const).map(({ key, ar: label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setPricingPeriod(key)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black transition-all ${
                      pricingPeriod === key
                        ? "bg-white dark:bg-[#1a1a2e] text-black dark:text-white shadow-sm"
                        : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
                    }`}
                    data-testid={`button-pricing-period-${key}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Multi-year picker */}
              <AnimatePresence>
                {pricingPeriod === "multiyear" && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20"
                  >
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">عدد السنوات:</span>
                    <button onClick={() => setPricingYears(y => Math.max(2, y - 1))} className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition"><Minus className="w-3 h-3"/></button>
                    <span className="text-lg font-black text-blue-700 dark:text-blue-300 w-6 text-center">{pricingYears}</span>
                    <button onClick={() => setPricingYears(y => Math.min(10, y + 1))} className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition"><Plus className="w-3 h-3"/></button>
                    <span className="text-xs font-bold text-blue-500 dark:text-blue-400">خصم {homeMYDiscount(pricingYears)}%</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ── Plan Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 max-w-5xl mx-auto items-stretch">
              {(["lite", "pro", "infinity"] as HomePriceTier[]).map((tier, i) => {
                const prices = HOME_PRICES[pricingSector][tier];
                let price = 0, periodLabel = "";
                if (pricingPeriod === "sixmonth")  { price = prices.sm;                               periodLabel = "كل 6 أشهر"; }
                else if (pricingPeriod === "annual")    { price = prices.yr;                               periodLabel = "سنوياً"; }
                else if (pricingPeriod === "multiyear") { price = homeMYPrice(prices.yr, pricingYears);   periodLabel = `${pricingYears} سنوات`; }
                else                                    { price = prices.life;                            periodLabel = "مدى الحياة"; }

                const isPro = tier === "pro";
                const isInf = tier === "infinity";
                const tierNames = { lite: "لايت", pro: "برو", infinity: "إنفينتي" };
                const tierDescs = { lite: "الباقة الأساسية — مثالية للانطلاق", pro: "الباقة الذكية — الأكثر توازناً", infinity: "الباقة الشاملة — بلا قيود" };
                const TIcon = tier === "lite" ? Zap : tier === "pro" ? Star : Infinity;

                const orderPeriodParam = pricingPeriod === "multiyear" ? `${pricingYears}y` : pricingPeriod;

                return (
                  <motion.div key={tier} {...fade(i)} className={`flex flex-col relative rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                    isInf  ? "bg-[#09090f] border-amber-500/15 shadow-[0_0_60px_rgba(245,158,11,0.10)] ring-1 ring-amber-500/10" :
                    isPro  ? "bg-[#1a3a6e] border-blue-400/20 shadow-[0_0_60px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/25" :
                             "bg-white dark:bg-[#0f172a] border-gray-200 dark:border-slate-700/50"
                  }`} data-testid={`card-plan-${tier}`}>

                    {/* Top accent line */}
                    {isPro && <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-blue-400 to-transparent"/>}
                    {isInf && <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent"/>}

                    {/* Most popular badge */}
                    {isPro && (
                      <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                        <span className="flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30">
                          <Crown className="w-3 h-3"/> الأكثر طلباً
                        </span>
                      </div>
                    )}

                    {/* Header */}
                    <div className={`px-6 pt-6 pb-4 ${isPro || isInf ? "" : "bg-gray-50 dark:bg-[#111827]"} relative`}>
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center mb-3 ${isInf ? "bg-white/[0.07]" : isPro ? "bg-white/10" : "bg-gray-100 dark:bg-slate-800"}`}>
                        <TIcon className={`w-4.5 h-4.5 ${isInf ? "text-amber-400" : isPro ? "text-blue-200" : "text-gray-500 dark:text-slate-400"}`} style={{ width: 18, height: 18 }}/>
                      </div>
                      <h3 className={`text-2xl font-black ${isInf || isPro ? "text-white" : "text-gray-900 dark:text-white"}`}>{tierNames[tier]}</h3>
                      <p className={`text-xs mt-0.5 ${isInf ? "text-amber-400/50" : isPro ? "text-blue-300/60" : "text-gray-400 dark:text-slate-500"}`}>{tierDescs[tier]}</p>
                    </div>

                    {/* Price */}
                    <div className={`px-6 py-4 border-t ${isPro ? "border-white/10 bg-white/[0.04]" : isInf ? "border-white/[0.06] bg-white/[0.02]" : "border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-[#111827]"}`}>
                      <AnimatePresence mode="wait">
                        <motion.div key={`${tier}-${pricingSector}-${pricingPeriod}-${pricingYears}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-4xl font-black tracking-tight ${isInf || isPro ? "text-white" : "text-gray-900 dark:text-white"}`}>{currency.format(price)}</span>
                            <span className={`text-sm font-bold ${isInf || isPro ? "text-white/40" : "text-gray-400"}`}>{currency.symbol}</span>
                          </div>
                          <p className={`text-xs mt-1 font-bold ${isPro ? "text-blue-200/70" : isInf ? "text-amber-300/60" : "text-gray-500 dark:text-slate-400"}`}>{periodLabel}</p>
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Features */}
                    <div className={`flex-1 px-6 py-4 ${isInf ? "bg-[#09090f]" : isPro ? "bg-[#1a3a6e]" : "bg-white dark:bg-[#0f172a]"}`}>
                      <ul className="space-y-2.5">
                        {HOME_TIER_FEATURES[tier].map((f, fi) => (
                          <li key={fi} className="flex items-start gap-2.5 text-xs">
                            <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isInf ? "text-amber-400" : isPro ? "text-blue-300" : "text-emerald-500"}`}/>
                            <span className={isInf ? "text-slate-300" : isPro ? "text-blue-100" : "text-gray-600 dark:text-slate-300"}>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA */}
                    <div className={`px-6 pb-6 pt-4 ${isInf ? "bg-[#09090f]" : isPro ? "bg-[#1a3a6e]" : "bg-white dark:bg-[#0f172a]"}`}>
                      <button
                        onClick={() => setLocation(`/order?plan=${tier}&segment=${pricingSector}&period=${orderPeriodParam}&price=${price}`)}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all ${
                          isInf ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white" :
                          isPro ? "bg-white hover:bg-blue-50 text-blue-900" :
                                  "bg-gray-900 hover:bg-black text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900"
                        }`}
                        data-testid={`button-order-${tier}`}
                      >
                        <Rocket className="w-4 h-4"/>
                        أكمل الطلب الآن
                      </button>
                      <p className={`text-[10px] text-center mt-2 ${isInf || isPro ? "text-white/30" : "text-gray-400/70"}`}>
                        تحويل بنكي · تواصل واتساب
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Multiyear / lifetime note */}
            {pricingPeriod === "multiyear" && (
              <p className="mt-5 text-center text-xs text-black/30 dark:text-white/30">
                السنة الثانية وما بعدها تأخذ خصم 5% إضافي لكل سنة — الخصم الأقصى 40%
              </p>
            )}
            {pricingPeriod === "lifetime" && (
              <p className="mt-5 text-center text-xs text-black/30 dark:text-white/30">
                دفعة واحدة للأبد · استضافة مجانية على خوادم كيروكس · دعم 3 سنوات مشمول
              </p>
            )}

            {/* Bottom CTA */}
            <motion.div {...fade(4)} className="mt-8 max-w-5xl mx-auto">
              <div className="rounded-2xl bg-black dark:bg-white p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "18px 18px" }} />
                <div className="relative flex items-center gap-3 text-center md:text-start">
                  <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-black/10 flex items-center justify-center shrink-0">
                    <Cpu className="w-5 h-5 text-white dark:text-black" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white dark:text-black">{ar ? "مو متأكد ايش يناسبك؟" : "Not sure which plan fits you?"}</div>
                    <div className="text-xs text-white/50 dark:text-black/50 mt-0.5 max-w-xs">{ar ? "احكِ لمساعدنا الذكي عن مشروعك، يرتّب لك عرض سعر مخصص في دقائق" : "Tell our AI about your project and get a custom quote in minutes"}</div>
                  </div>
                </div>
                <div className="relative flex gap-2 shrink-0">
                  <Link href="/start">
                    <Button className="bg-white text-black hover:bg-white/90 dark:bg-black dark:text-white dark:hover:bg-black/90 rounded-xl h-10 px-5 font-bold text-sm gap-1.5" data-testid="button-ai-advisor">
                      <Cpu className="w-4 h-4" />
                      {ar ? "اسأل المساعد" : "Ask the AI"}
                    </Button>
                  </Link>
                  <Link href="/prices">
                    <Button variant="outline" className="border-white/20 dark:border-black/20 text-white dark:text-black hover:bg-white/10 dark:hover:bg-black/10 rounded-xl h-10 px-5 font-bold text-sm gap-1.5" data-testid="button-view-all-plans">
                      {ar ? "كل الباقات" : "All plans"}
                      <Arrow className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>

          </div>
        </section>

        {/* ── Graphic Divider between Pricing and Process ── */}
        <GraphicDivider variant={2} />

        {/* ─── PROCESS ─── */}
        <section id="tab-process" className="pt-16 pb-24 md:pt-20 md:pb-28 bg-white dark:bg-[#0a0a0a]">
          <div className="container mx-auto px-5 md:px-8 max-w-7xl">
            <motion.div {...fade(0)} className="mb-14 text-center max-w-2xl mx-auto">
              <p className="text-[10px] font-black tracking-[0.25em] uppercase text-black/30 dark:text-white/30 mb-4">HOW WE WORK</p>
              <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
                {ar ? (<>من الفكرة<br /><span className="text-black/30 dark:text-white/30">إلى الإطلاق</span></>) : (<>From Idea<br /><span className="text-black/30 dark:text-white/30">to Launch</span></>)}
              </h2>
            </motion.div>

            <div className="relative max-w-6xl mx-auto">
              {/* Connecting line */}
              <div className="hidden lg:block absolute top-[2.2rem] left-0 right-0 h-px bg-black/[0.07] dark:bg-white/[0.07] z-0" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 md:gap-5">
                {PROCESS_STEPS.map((s, i) => {
                  const StepIcon = s.icon;
                  return (
                    <motion.div key={i} {...fade(i * 0.08)} className="relative flex flex-col items-center text-center lg:items-start lg:text-start">
                      {/* Step number + icon */}
                      <div className="relative z-10 w-[4.5rem] h-[4.5rem] rounded-2xl bg-black dark:bg-white flex flex-col items-center justify-center mb-5 shadow-lg">
                        <span className="text-[9px] font-black text-white/40 dark:text-black/40 tracking-widest mb-0.5">{String(i + 1).padStart(2, "0")}</span>
                        <StepIcon className="w-5 h-5 text-white dark:text-black" />
                      </div>
                      <div className="font-black text-base mb-2 text-black dark:text-white">{ar ? s.ar.t : s.en.t}</div>
                      <div className="text-[12.5px] text-black/50 dark:text-white/48 leading-relaxed">{ar ? s.ar.d : s.en.d}</div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Graphic Divider between Process and Reviews ── */}
        <GraphicDivider variant={3} dark />

        {/* ─── CLIENT REVIEWS / TESTIMONIALS ─── */}
        <section className="py-16 md:py-24 overflow-hidden relative bg-white dark:bg-[#0a0a0a]">
          {/* Subtle bg pattern */}
          <div className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04] pointer-events-none"
            style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

          <div className="container mx-auto px-5 md:px-8 max-w-6xl relative">
            {/* Header */}
            <motion.div {...fade(0)} className="mb-10 text-center max-w-2xl mx-auto">
              <p className="text-[10px] font-black tracking-[0.25em] uppercase text-black/30 dark:text-white/30 mb-5">CLIENTS SAY</p>
              <h2 className="text-3xl md:text-5xl font-black mb-3 tracking-tight text-black dark:text-white">
                {ar ? (<>ثقة عملائنا.<br /><span className="text-black/30 dark:text-white/30">نجاحها.</span></>) : (<>Our clients trust.<br /><span className="text-black/30 dark:text-white/30">Their success.</span></>)}
              </h2>
              {/* Aggregate stats */}
              <div className="flex items-center justify-center gap-6 mt-6">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => (
                    <div key={s} className="w-3 h-3 rounded-full bg-amber-400" />
                  ))}
                  <span className="text-sm font-black text-gray-900 dark:text-white ms-2">4.97</span>
                </div>
                <div className="w-px h-4 bg-black/12 dark:bg-white/12" />
                <span className="text-sm text-black/40 dark:text-white/40 font-medium">{ar ? "37+ تقييم موثّق" : "37+ verified reviews"}</span>
              </div>
            </motion.div>
          </div>

          {/* ── Tag filter pills ── */}
          <div className="flex justify-center gap-2 flex-wrap px-4 mb-8">
            {["الكل","سرعة استجابة","إبداع وتصميم","حل سريع","جودة عالية","سرعة تسليم","تواصل ممتاز"].map((t, i) => (
              <span key={i} className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${i === 0 ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white" : "border-black/10 dark:border-white/10 text-black/50 dark:text-white/50 bg-transparent"}`}>
                {t}
              </span>
            ))}
          </div>

          {/* ── Single seamless review track ── */}
          <div className="relative select-none" dir="ltr">
            <ReviewTrack reviews={displayReviews} />
          </div>

          {/* CTA */}
          <div className="text-center mt-10">
            <a href="https://wa.me/966554656670" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black text-sm font-bold hover:opacity-80 transition-opacity shadow-lg shadow-black/10 dark:shadow-white/5"
              data-testid="btn-reviews-cta"
            >
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {ar ? "ابدأ مشروعك وانضم لعملائنا" : "Start your project and join our clients"}
            </a>
          </div>
        </section>

        {/* ── Graphic Divider between Reviews and Partners ── */}
        <GraphicDivider variant={4} />

        {/* ─── PARTNERS ─── */}
        <section id="tab-partners" className="pt-14 pb-20 md:pt-16 md:pb-24 bg-white dark:bg-[#0a0a0a]">
          <div className="container mx-auto px-5 md:px-8 max-w-6xl">
            <motion.div {...fade(0)} className="mb-10 text-center">
              <p className="text-[10px] font-black tracking-[0.25em] uppercase text-black/30 dark:text-white/30 mb-2">TRUSTED PARTNERS</p>
            </motion.div>

            {partnersLoading ? (
              <motion.div {...fade(1)} className="flex flex-wrap justify-center items-center gap-8 py-6">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="w-24 h-8 rounded-lg bg-black/[0.05] dark:bg-white/[0.06] animate-pulse" />
                ))}
              </motion.div>
            ) : apiPartners.length > 0 ? (
              <motion.div {...fade(1)} className="flex flex-wrap justify-center items-center gap-10 md:gap-14 py-4">
                {apiPartners.map((p: any) => (
                  <div key={p.id || p._id} className="grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300" data-testid={`logo-partner-${p.id || p._id}`}>
                    <Link href="/partners">
                      <img src={p.logoUrl} alt={ar ? (p.nameAr || p.name) : (p.name || p.nameAr)} className="h-10 md:h-12 w-auto object-contain max-w-[130px] cursor-pointer" />
                    </Link>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div {...fade(1)} className="flex flex-wrap justify-center items-center gap-8 md:gap-12 py-4">
                {[
                  { name: "tabby",     style: "font-black text-[1.2rem] tracking-tight"  },
                  { name: "tamara",    style: "font-black text-[1.1rem] tracking-tight"  },
                  { name: "ZATCA",     style: "font-black text-[1.0rem] tracking-[0.08em]" },
                  { name: "aws",       style: "font-black text-[1.3rem] tracking-tight"  },
                  { name: "odoo",      style: "font-black text-[1.1rem] tracking-tight"  },
                  { name: "Adobe",     style: "font-black text-[1.1rem] tracking-tight"  },
                  { name: "Microsoft", style: "font-semibold text-[1.0rem] tracking-tight" },
                ].map((p, i) => (
                  <div key={i} className="opacity-30 hover:opacity-60 transition-opacity duration-300">
                    <span className={`${p.style} text-black dark:text-white`}>{p.name}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </section>

        {/* ── Graphic Divider between Partners and Templates ── */}
        <GraphicDivider variant={5} dark />

        {/* ─── DEMO TEMPLATES — creative frame at end of homepage ─── */}
        <section id="tab-templates" className="pt-16 pb-24 md:pt-20 md:pb-28 relative overflow-hidden">
          {/* Decorative grid background */}
          <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05] pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "24px 24px" }} />

          <div className="container mx-auto px-5 md:px-8 max-w-6xl relative">
            <motion.div {...fade(0)} className="mb-12 text-center max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full border border-violet-300/40 dark:border-violet-700/40 bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300 text-[11px] font-black uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                {ar ? "عرض حي · DEMO" : "Live Preview · DEMO"}
              </span>
              <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
                {ar ? "جرّب نماذج جاهزة" : "Try ready-made templates"}
                <br />
                <span className="text-black/35 dark:text-white/35">{ar ? "قبل ما تطلب" : "before you order"}</span>
              </h2>
              <p className="text-black/55 dark:text-white/55 text-base leading-relaxed">
                {ar
                  ? "هذه نماذج تجريبية لمشاريع حقيقية بنيناها — اضغط واستكشف قبل اختيار باقتك."
                  : "Live demo templates from real projects — click and explore before picking a plan."}
              </p>
            </motion.div>

            {/* Browser-style frame around templates */}
            <motion.div {...fade(1)} className="relative max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-black/[0.04] dark:from-white/[0.06] via-transparent to-violet-500/[0.04] border border-black/[0.08] dark:border-white/[0.08] p-4 md:p-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_60px_-20px_rgba(255,255,255,0.06)]">
              {/* Window chrome */}
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.06] dark:bg-white/[0.06] text-[10px] font-mono text-black/50 dark:text-white/50">
                  <Globe className="w-3 h-3" />
                  qiroxstudio.online/demo
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-600 text-white tracking-wider">
                  DEMO
                </span>
              </div>

              {/* Templates grid inside frame */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {visibleTemplates.length === 0
                  ? CURRENT_SECTORS.map((s: any, i) => {
                      const heroImg = s.segment === "ecommerce" ? demoEcommerceImg : demoRestaurantImg;
                      return (
                        <motion.div key={i} {...fade(i)}>
                          <Link href={`/prices?segment=${s.segment}`}>
                            <div className="group relative aspect-[16/10] rounded-2xl bg-black border border-white/[0.08] overflow-hidden cursor-pointer hover:scale-[1.015] hover:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] transition-all duration-300" data-testid={`card-template-placeholder-${i}`}>
                              {/* Hero image with side shadow */}
                              <img
                                src={heroImg}
                                alt={s.arName}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                                loading="lazy"
                              />
                              {/* Side shadow gradients (left + right + bottom) for depth */}
                              <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-black/70 via-black/25 to-transparent pointer-events-none" />
                              <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-black/55 via-black/15 to-transparent pointer-events-none" />
                              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

                              {/* DEMO ribbon */}
                              <div className="absolute top-3 left-3 z-10">
                                <span className="text-[10px] font-black px-2.5 py-1 rounded-md bg-violet-600 text-white tracking-wider shadow-lg shadow-violet-500/30">DEMO</span>
                              </div>

                              {/* Bottom info */}
                              <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 z-10 text-right" dir="rtl">
                                <div className="font-black text-lg md:text-2xl text-white drop-shadow-lg">{ar ? s.arName : s.enName}</div>
                                <div className="text-xs md:text-sm text-white/75 mt-1.5 flex items-center justify-end gap-1.5">
                                  {ar ? "افتح المعاينة الحية" : "Open live preview"}
                                  <ChevronRight className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform rotate-180" />
                                </div>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })
                  : (() => {
                      // Show only restaurant + ecommerce hero demos on the homepage
                      const restTpl = visibleTemplates.find((t: any) => /food|cafe|restaurant|dining/i.test(t.category || t.sector || t.slug || ""));
                      const ecomTpl = visibleTemplates.find((t: any) => /ecom|shop|store/i.test(t.category || t.sector || t.slug || ""));
                      const heroes = [
                        { tpl: restTpl, segment: "restaurant", arName: "مطاعم ومقاهي",   enName: "Restaurants & Cafes", img: demoRestaurantImg },
                        { tpl: ecomTpl, segment: "ecommerce",  arName: "متاجر إلكترونية", enName: "E-Commerce Stores",   img: demoEcommerceImg  },
                      ];
                      return heroes.map((h, i) => (
                        <motion.div key={i} {...fade(i)}>
                          <Link href={h.tpl ? `/templates/${h.tpl.slug || h.tpl._id}` : `/prices?segment=${h.segment}`}>
                            <div className="group relative aspect-[16/10] rounded-2xl bg-black border border-white/[0.08] overflow-hidden cursor-pointer hover:scale-[1.015] hover:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] transition-all duration-300" data-testid={`card-template-${h.tpl?._id || i}`}>
                              {/* Hero image with side shadow */}
                              <img
                                src={h.img}
                                alt={h.arName}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                                loading="lazy"
                              />
                              {/* Side shadow gradients (left + right + bottom) for depth */}
                              <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-black/70 via-black/25 to-transparent pointer-events-none" />
                              <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-black/55 via-black/15 to-transparent pointer-events-none" />
                              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

                              {/* DEMO ribbon */}
                              <div className="absolute top-3 left-3 z-10">
                                <span className="text-[10px] font-black px-2.5 py-1 rounded-md bg-violet-600 text-white tracking-wider shadow-lg shadow-violet-500/30">DEMO</span>
                              </div>

                              {/* Bottom info */}
                              <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 z-10 text-right" dir="rtl">
                                <div className="font-black text-lg md:text-2xl text-white drop-shadow-lg">{ar ? (h.tpl?.nameAr || h.arName) : (h.tpl?.name || h.enName)}</div>
                                <div className="text-xs md:text-sm text-white/75 mt-1.5 flex items-center justify-end gap-1.5">
                                  {ar ? "افتح المعاينة الحية" : "Open live preview"}
                                  <ChevronRight className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform rotate-180" />
                                </div>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ));
                    })()}
              </div>

              {/* Caption inside frame */}
              <div className="mt-5 flex items-center justify-center gap-3 text-[11px] text-black/45 dark:text-white/45">
                <div className="h-px flex-1 bg-black/[0.08] dark:bg-white/[0.08] max-w-[80px]" />
                <span className="font-medium">
                  {ar ? "كل النماذج للاستعراض فقط · ستُخصّص بالكامل لمشروعك" : "All templates are previews · fully customized for your project"}
                </span>
                <div className="h-px flex-1 bg-black/[0.08] dark:bg-white/[0.08] max-w-[80px]" />
              </div>
            </motion.div>

            <div className="text-center mt-10">
              <Link href="/systems">
                <Button className="bg-black dark:bg-white text-white dark:text-black hover:opacity-90 rounded-xl h-12 px-7 font-bold gap-2" data-testid="button-explore-all-demos">
                  <Layers className="w-4 h-4" />
                  {ar ? "استكشف كل النماذج" : "Explore all templates"}
                  <Arrow className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="bg-[#0a0a0a] relative overflow-hidden">
          {/* Subtle dot grid */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

          <div className="container mx-auto px-5 md:px-10 max-w-7xl relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-end min-h-[460px] md:min-h-[520px]">

              {/* Left: text + buttons */}
              <motion.div {...fade(0)} className="flex flex-col justify-center py-20 md:py-24 lg:py-28">
                <p className="text-[10px] font-black tracking-[0.25em] uppercase text-white/25 mb-6">START NOW</p>
                <h2 className="text-4xl md:text-5xl lg:text-[3.2rem] font-black leading-[1.08] tracking-tight text-white mb-6">
                  {ar ? (<>جاهز لتحويل<br />فكرتك إلى نظام؟</>) : (<>Ready to turn<br />your idea into<br />a system?</>)}
                </h2>
                <p className="text-white/48 text-base leading-relaxed mb-8 max-w-sm">
                  {ar
                    ? "احكِ لنا فكرتك بكلام بسيط — فريقنا يفهمك ويرتب لك كل شيء مهما كانت ميزانيتك."
                    : "Describe your idea in plain words — our team gets you and arranges everything, whatever your budget."}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/start">
                    <Button size="lg" className="bg-white text-black hover:bg-white/90 rounded-xl h-12 px-7 font-bold gap-2 text-sm shadow-lg shadow-white/10" data-testid="button-cta-start">
                      {ar ? "ابدأ مشروعك الآن" : "Start Your Project"}
                      <Arrow className="w-4 h-4" />
                    </Button>
                  </Link>
                  <a href="https://wa.me/966554656670" target="_blank" rel="noreferrer">
                    <Button size="lg" variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/[0.08] rounded-xl h-12 px-7 font-bold gap-2 text-sm" data-testid="button-cta-whatsapp">
                      <SiWhatsapp className="w-4 h-4" />
                      {ar ? "تحدث معنا" : "Talk to us"}
                    </Button>
                  </a>
                </div>
                {/* Social links */}
                <div className="flex items-center gap-4 mt-10 text-white/30">
                  <a href="https://instagram.com/qirox.sa" target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-white/70 transition"><SiInstagram className="w-4 h-4" /></a>
                  <a href="https://x.com/qiroxsa" target="_blank" rel="noreferrer" aria-label="X" className="hover:text-white/70 transition"><SiX className="w-4 h-4" /></a>
                  <a href="https://www.linkedin.com/company/qirox" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:text-white/70 transition"><Linkedin className="w-4 h-4" /></a>
                </div>
              </motion.div>

              {/* Right: 3D Q cube */}
              <motion.div
                {...fade(1)}
                className="hidden lg:flex items-end justify-center lg:justify-end relative"
              >
                <img
                  src="/qirox-hero-new.png"
                  alt="QIROX"
                  className="w-full max-w-[560px] select-none pointer-events-none block"
                  draggable={false}
                  loading="lazy"
                />
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <InstallPrompt />
    </div>
  );
}
