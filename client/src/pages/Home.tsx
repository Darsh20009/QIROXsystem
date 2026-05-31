import { useState, useMemo, useRef, useEffect, type ElementType } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useTemplates } from "@/hooks/use-templates";
import type { Partner } from "@shared/schema";
const qiroxLogo = "/qirox-icon-nobg.png";
import demoEcommerceImg from "@assets/Screenshot_2026-04-27_at_6.23.57_PM_1777303494183.png";
import demoRestaurantImg from "@assets/Screenshot_2026-04-27_at_1.59.42_PM_1777302518837.png";
import {
  ArrowRight, ArrowLeft, Sparkles, Zap, Shield, Cpu,
  Layers, ShoppingBag, Building2, GraduationCap,
  Heart, Coffee, Home as HomeIcon, Scissors, Lightbulb,
  Check, Star, Infinity, ChevronRight, TrendingUp, Bot, Globe,
} from "lucide-react";
import { SiWhatsapp, SiInstagram, SiX, SiLinkedin, SiGoogle, SiApple } from "react-icons/si";
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
  { icon: ShoppingBag,   img: "/sector-01.png", arName: "متاجر إلكترونية",    enName: "E-Commerce",          segment: "ecommerce" },
  { icon: Coffee,        img: "/sector-02.png", arName: "مطاعم ومقاهي",       enName: "Restaurants",         segment: "restaurant" },
  { icon: GraduationCap, img: "/sector-03.png", arName: "منصات تعليمية",      enName: "Education",           segment: "education" },
  { icon: Building2,     img: "/sector-04.png", arName: "شركات ومؤسسات",      enName: "Corporate",           segment: "corporate" },
  { icon: Heart,         img: "/sector-05.png", arName: "صحة وعيادات",        enName: "Healthcare",          segment: "healthcare" },
  { icon: HomeIcon,      img: "/sector-06.png", arName: "عقارات",              enName: "Real Estate",         segment: "realestate" },
  { icon: Scissors,      img: "/sector-07.png", arName: "صالونات تجميل",      enName: "Beauty Salons",       segment: "beauty" },
  { icon: TrendingUp,    img: "/sector-08.png", arName: "وكالات التسويق",      enName: "Marketing Agencies",  segment: "marketing" },
  { icon: Bot,           img: "/sector-09.png", arName: "ذكاء اصطناعي",       enName: "AI Solutions",        segment: "ai" },
  { icon: Lightbulb,     arName: "ابدأ فكرتك الخاصة",  enName: "Start your own idea", custom: true },
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
  { ar: { t: "احكِ لنا فكرتك", d: "تواصل معنا أو احكِ للمساعد الذكي بكلام بسيط — يفهم احتياجك خلال دقائق" }, en: { t: "Tell us your idea", d: "Reach out or chat with our AI — it gets your need in minutes" } },
  { ar: { t: "اختر ما يناسبك", d: "أسعار واضحة بالكامل، اختر اللي يناسب ميزانيتك بدون ضغط" }, en: { t: "Pick what fits you", d: "Crystal-clear prices — pick what fits your budget, no pressure" } },
  { ar: { t: "نبني ونسلّم", d: "فريقنا يبني نظامك بسرعة عالية وجودة احترافية" }, en: { t: "We build & ship", d: "Our team delivers fast with pro quality" } },
  { ar: { t: "ندعمك دائماً", d: "صيانة، تحديثات، ودعم متاح وقت ما تحتاج" }, en: { t: "We support you", d: "Maintenance, updates, support whenever you need" } },
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
        <section className="relative pt-28 pb-24 md:pt-36 md:pb-32 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              maskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 80%)",
              WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 80%)",
            }}
          />
          <div className="container mx-auto px-5 md:px-8 max-w-6xl relative">
            <motion.div {...fade(0)} className="flex flex-col items-center text-center">
              <div className="inline-block mb-5">
                <img src="/qirox-icon.png" alt="مصنع الأنظمة الرقمية" className="h-12 md:h-14 w-auto object-contain dark:invert" />
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-black/15 dark:border-white/15 text-[11px] font-bold tracking-wide uppercase mb-7">
                <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white animate-pulse" />
                {ar ? "مصنع الأنظمة الرقمية · شريكك التقني" : "Digital Systems Factory · Your tech partner"}
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6 max-w-4xl">
                {ar ? "نحوّل فكرتك" : "We turn your idea"}
                <br />
                <span className="text-black/40 dark:text-white/40">{ar ? "إلى موقع أو نظام مخصص" : "into a real working system"}</span>
              </h1>
              <p className="text-base md:text-lg text-black/60 dark:text-white/60 max-w-2xl mb-9 leading-relaxed">
                {ar
                  ? "ما تحتاج تكون تقني — احكِ لنا اللي تبيه بكلام عادي، وفريقنا والمساعد الذكي يبنونه لك. مهما كانت ميزانيتك، عندنا الحل المناسب."
                  : "No tech skills required — describe what you need in plain words, and our team plus AI build it. Whatever your budget, we have the right solution."}
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/start">
                  <Button size="lg" className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 rounded-xl h-12 px-6 font-bold gap-2" data-testid="button-hero-start">
                    <Sparkles className="w-4 h-4" />
                    {ar ? "ابدأ فكرتك الخاصة" : "Start Your Own Idea"}
                    <Arrow className="w-4 h-4" />
                  </Button>
                </Link>
                <a href="https://wa.me/966554656670" target="_blank" rel="noreferrer">
                  <Button size="lg" variant="outline" className="border-black/15 dark:border-white/15 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-xl h-12 px-6 font-bold gap-2" data-testid="button-hero-whatsapp">
                    <SiWhatsapp className="w-4 h-4" />
                    {ar ? "تواصل واتساب" : "WhatsApp us"}
                  </Button>
                </a>
              </div>

              {/* ── OAuth quick-login strip — shown only to guests ── */}
              {!user && (googleEnabled || appleEnabled) && (
                <motion.div {...fade(0.6)} className="mt-6 flex flex-col items-center gap-3">
                  <div className="flex items-center gap-3 w-full max-w-xs">
                    <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
                    <span className="text-[11px] font-bold text-black/35 dark:text-white/35 whitespace-nowrap">
                      {ar ? "أو سجّل الدخول بـ" : "or sign in with"}
                    </span>
                    <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
                  </div>
                  <div className="flex gap-2">
                    {googleEnabled && (
                      <button
                        onClick={() => { window.location.href = "/api/auth/google"; }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-black/12 dark:border-white/12 bg-white dark:bg-white/[0.04] hover:bg-black/[0.03] dark:hover:bg-white/[0.08] transition-colors text-sm font-bold text-black dark:text-white shadow-sm shadow-black/5"
                        data-testid="btn-hero-google-login"
                      >
                        <SiGoogle className="w-4 h-4 text-[#4285F4]" />
                        Google
                      </button>
                    )}
                    {appleEnabled && (
                      <button
                        onClick={() => { window.location.href = "/api/auth/apple"; }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-black/12 dark:border-white/12 bg-white dark:bg-black hover:bg-black/[0.03] dark:hover:bg-white/[0.06] transition-colors text-sm font-bold text-black dark:text-white shadow-sm shadow-black/5"
                        data-testid="btn-hero-apple-login"
                      >
                        <SiApple className="w-4 h-4" />
                        Apple
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              <Link href="/prices" className="mt-4 text-xs text-black/45 dark:text-white/45 hover:text-black dark:hover:text-white transition" data-testid="link-hero-manual">
                {ar ? "أو تصفح الباقات بنفسك" : "or browse plans on your own"}
              </Link>
            </motion.div>

            {/* Pillars row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mt-20 md:mt-24 max-w-5xl mx-auto">
              {PILLARS.map((p, i) => (
                <motion.div key={i} {...fade(i)} className="text-center md:text-start">
                  <div className="w-11 h-11 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mb-4 mx-auto md:mx-0">
                    <p.icon className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-base mb-1">{ar ? p.ar.t : p.en.t}</div>
                  <div className="text-xs md:text-sm text-black/55 dark:text-white/55 leading-relaxed">{ar ? p.ar.d : p.en.d}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Video Showcase Banner ── */}
        <section className="relative overflow-hidden bg-black">
          <div className="relative w-full" style={{ aspectRatio: "16/7" }}>
            <video
              src="/demo-video.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />
            <div className="absolute inset-0 flex items-end justify-center pb-8">
              <div className="text-center px-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold tracking-wide mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {ar ? "نظام كيروكس في العمل" : "QIROX in action"}
                </div>
                <h2 className="text-white text-xl md:text-3xl font-black max-w-xl mx-auto leading-tight drop-shadow-lg">
                  {ar ? "شاهد كيف نبني أنظمتك الرقمية" : "See how we build your digital systems"}
                </h2>
              </div>
            </div>
          </div>
        </section>

        {/* ── Graphic Divider after Hero ── */}
        <GraphicDivider variant={1} dark />

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
        <section id="tab-systems" className="pt-16 pb-24 md:pt-20 md:pb-28">
          <div className="container mx-auto px-5 md:px-8 max-w-6xl">
            <motion.div {...fade(0)} className="mb-12 text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">{ar ? "أنظمة جاهزة لكل نشاط" : "Ready systems for every business"}</h2>
              <p className="text-black/55 dark:text-white/55 text-base leading-relaxed">
                {ar ? "اختر القالب المناسب لمجالك، نخصّصه لك خلال أيام." : "Pick a template for your field, we customize it within days."}
              </p>
            </motion.div>

            {/* Sector illustrated cards grid — premium brand-aligned design */}
            <motion.div {...fade(1)} className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-14">
              {SECTORS.map((s: any, i) => {
                const IllustrationComponent = SECTOR_ILLUSTRATIONS[s.arName];
                const sectorHref = s.custom ? "/start" : `/prices?segment=${s.segment}`;
                const Icon = s.icon;
                const accent = SECTOR_ACCENT[s.arName];
                const num = String(i + 1).padStart(2, "0");
                return (
                  <Link key={i} href={sectorHref}>
                    <div
                      className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98] ring-1 ring-inset ${
                        s.custom
                          ? "bg-gradient-to-br from-neutral-900 via-black to-neutral-900 dark:from-white dark:via-neutral-100 dark:to-white ring-white/10 dark:ring-black/10 hover:ring-white/30 dark:hover:ring-black/30"
                          : `bg-gradient-to-br from-white to-neutral-100 dark:from-neutral-900 dark:to-black ring-black/5 dark:ring-white/5 hover:ring-2 ${accent?.ring || "hover:ring-black/20 dark:hover:ring-white/20"}`
                      }`}
                      data-testid={`card-sector-${i}`}
                    >
                      {/* Signature glow blob (sector accent) — soft, premium */}
                      {!s.custom && accent && (
                        <div
                          className={`absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl ${accent.glow} transition-all duration-500 group-hover:scale-150 group-hover:opacity-80 opacity-60`}
                          aria-hidden="true"
                        />
                      )}

                      {/* Subtle grid texture overlay for depth (brand pattern) */}
                      <div
                        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06] pointer-events-none"
                        style={{
                          backgroundImage:
                            s.custom
                              ? "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)"
                              : "radial-gradient(circle, currentColor 1px, transparent 1px)",
                          backgroundSize: "14px 14px",
                        }}
                        aria-hidden="true"
                      />

                      {/* Top-corner sector number — typographic accent, brand-feel */}
                      <div className={`absolute top-2.5 right-3 text-[10px] font-mono font-bold tracking-wider ${
                        s.custom ? "text-white/30 dark:text-black/30" : "text-black/25 dark:text-white/25"
                      }`}>
                        {num}
                      </div>

                      {/* Illustration zone — top 65% — bigger, bolder, lifted on hover */}
                      <div className={`absolute inset-0 bottom-[35%] overflow-hidden transition-transform duration-500 group-hover:scale-110 ${
                        s.custom ? "text-white dark:text-black" : "text-black dark:text-white"
                      }`}>
                        {s.img ? (
                          <img src={s.img} alt={s.arName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-3">
                            {IllustrationComponent ? <IllustrationComponent /> : <Icon className="w-10 h-10" />}
                          </div>
                        )}
                      </div>

                      {/* Bottom title strip — premium solid black/white with crisp typography */}
                      <div className={`absolute bottom-0 inset-x-0 h-[35%] flex flex-col items-center justify-center gap-1 px-2 ${
                        s.custom
                          ? "bg-black/40 dark:bg-white/40 backdrop-blur-sm"
                          : "bg-black dark:bg-white"
                      }`}>
                        <div className={`text-[11px] md:text-xs font-black text-center leading-tight tracking-tight ${
                          s.custom ? "text-white dark:text-black" : "text-white dark:text-black"
                        }`}>
                          {ar ? s.arName : s.enName}
                        </div>
                        {s.custom ? (
                          <div className="text-[9px] text-white/70 dark:text-black/70 font-medium flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            {ar ? "ابدأ فكرتك" : "Start your idea"}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[9px] text-white/60 dark:text-black/60 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {ar ? "اعرف المزيد" : "Learn more"}
                            <ChevronRight className="w-2.5 h-2.5 rtl:rotate-180" />
                          </div>
                        )}
                      </div>

                      {/* Custom card sparkle badge */}
                      {s.custom && (
                        <div className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20 dark:ring-black/20">
                          <Lightbulb className="w-3.5 h-3.5 text-white dark:text-black" />
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </motion.div>

            <div className="text-center mt-12">
              <Link href="/systems">
                <Button variant="outline" className="border-black/15 dark:border-white/15 rounded-xl h-11 px-6 font-bold gap-2" data-testid="button-view-all-systems">
                  {ar ? "عرض كل الأنظمة" : "View all systems"}
                  <Arrow className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Stats + Graphic after Systems ── */}
        <StatsBar ar={ar} />
        <GraphicBanner ar={ar} />

        {/* ─── PRICING ─── */}
        <section id="tab-pricing" className="pt-16 pb-24 md:pt-20 md:pb-28 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="container mx-auto px-5 md:px-8 max-w-6xl">

            <motion.div {...fade(0)} className="mb-14 text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
                {ar ? "باقات مرنة" : "Flexible plans"}
                <br />
                <span className="text-black/30 dark:text-white/30">{ar ? "تناسب كل مشروع وميزانية" : "for every project & budget"}</span>
              </h2>
              <p className="text-black/50 dark:text-white/50 text-sm leading-relaxed max-w-lg mx-auto">
                {ar
                  ? "ثلاثة مستويات واضحة — الأسعار تختلف حسب القطاع والمتطلبات. تكلّم مساعدنا وخذ سعراً مخصصاً لمشروعك."
                  : "Three clear tiers — pricing varies by sector and needs. Talk to our advisor for a quote tailored to your project."}
              </p>
            </motion.div>

            {/* Tier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 max-w-5xl mx-auto items-start">
              {([
                {
                  tier: "lite",
                  nameAr: "لايت", nameEn: "Lite",
                  tagAr: "للبداية والمشاريع الصغيرة",
                  tagEn: "For startups & small projects",
                  keyAr: "الأساسيات الكاملة للانطلاق",
                  keyEn: "Everything you need to launch",
                  featuresAr: ["موقع احترافي متكامل", "لوحة تحكم سهلة الاستخدام", "دعم فني أساسي مستمر", "نطاق + SSL مجاني", "تقارير الأداء الشهرية"],
                  featuresEn: ["Full professional website", "Easy-to-use dashboard", "Continuous basic support", "Free domain + SSL", "Monthly reports"],
                  popular: false,
                },
                {
                  tier: "pro",
                  nameAr: "برو", nameEn: "Pro",
                  tagAr: "الأكثر طلباً — للمشاريع الجادة",
                  tagEn: "Most popular — for serious projects",
                  keyAr: "نظام متكامل مع تطبيق جوال",
                  keyEn: "Full system + mobile app",
                  featuresAr: ["كل ميزات لايت", "تطبيق جوال iOS وAndroid", "نظام متكامل للقطاع", "إشعارات فورية للعملاء", "تقارير متقدمة وذكاء اصطناعي"],
                  featuresEn: ["All Lite features", "iOS & Android mobile app", "Sector-specific full system", "Push notifications", "Advanced AI-powered reports"],
                  popular: true,
                },
                {
                  tier: "infinite",
                  nameAr: "إنفينيت", nameEn: "Infinite",
                  tagAr: "للمؤسسات والمشاريع الكبيرة",
                  tagEn: "For enterprises & large-scale",
                  keyAr: "بدون حدود — كل شيء مخصص",
                  keyEn: "Unlimited — everything custom",
                  featuresAr: ["كل ميزات برو", "تطوير مخصص بلا قيود", "خادم مستقل مخصص", "مساعد ذكاء اصطناعي مدمج", "أولوية دعم على مدار الساعة"],
                  featuresEn: ["All Pro features", "Unlimited custom development", "Dedicated private server", "Built-in AI assistant", "Priority round-the-clock support"],
                  popular: false,
                },
              ] as const).map((tier, i) => (
                <motion.div key={tier.tier} {...fade(i)} className={tier.popular ? "md:-mt-5" : ""}>
                  <div className={`relative rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                    tier.popular
                      ? "bg-black dark:bg-white shadow-2xl shadow-black/20 dark:shadow-white/10"
                      : "bg-white dark:bg-gray-900 border border-black/[0.08] dark:border-white/[0.08] hover:shadow-md"
                  }`} data-testid={`card-plan-${tier.tier}`}>

                    {/* Popular label above card */}
                    {tier.popular && (
                      <div className="absolute -top-px inset-x-0 flex justify-center">
                        <div className="bg-black dark:bg-white text-white dark:text-black text-[10px] font-black px-4 py-1 rounded-b-xl flex items-center gap-1.5 shadow">
                          <Star className="w-2.5 h-2.5" />
                          {ar ? "الأكثر طلباً" : "Most Popular"}
                        </div>
                      </div>
                    )}

                    <div className={`p-6 flex flex-col gap-4 ${tier.popular ? "pt-8" : ""}`}>

                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className={`text-2xl font-black tracking-tight ${tier.popular ? "text-white dark:text-black" : "text-black dark:text-white"}`}>
                            {ar ? tier.nameAr : tier.nameEn}
                            {tier.tier === "infinite" && <Infinity className="w-5 h-5 inline-block mr-2 mb-1 opacity-50" />}
                          </div>
                          <div className={`text-[11px] mt-0.5 ${tier.popular ? "text-white/55 dark:text-black/55" : "text-black/45 dark:text-white/45"}`}>
                            {ar ? tier.tagAr : tier.tagEn}
                          </div>
                        </div>
                      </div>

                      {/* Key value prop */}
                      <div className={`text-sm font-bold px-3 py-2.5 rounded-lg ${
                        tier.popular ? "bg-white/12 dark:bg-black/12 text-white dark:text-black" : "bg-black/[0.04] dark:bg-white/[0.05] text-black dark:text-white"
                      }`}>
                        {ar ? tier.keyAr : tier.keyEn}
                      </div>

                      {/* Features */}
                      <ul className="space-y-2 flex-1">
                        {(ar ? tier.featuresAr : tier.featuresEn).map((f, fi) => (
                          <li key={fi} className="flex items-start gap-2 text-xs">
                            <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${tier.popular ? "text-white/60 dark:text-black/60" : "text-black/35 dark:text-white/35"}`} />
                            <span className={tier.popular ? "text-white/80 dark:text-black/80" : "text-black/60 dark:text-white/60"}>{f}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Divider */}
                      <div className={`h-px ${tier.popular ? "bg-white/10 dark:bg-black/10" : "bg-black/[0.05] dark:bg-white/[0.05]"}`} />

                      {/* Price note + CTA */}
                      <div>
                        <div className={`text-[10px] mb-3 text-center ${tier.popular ? "text-white/45 dark:text-black/45" : "text-black/35 dark:text-white/35"}`}>
                          {ar ? "السعر يختلف حسب القطاع والمتطلبات" : "Price varies by sector & requirements"}
                        </div>
                        <Link href="/prices">
                          <Button className={`w-full rounded-xl h-10 font-bold text-sm gap-1.5 ${
                            tier.popular
                              ? "bg-white text-black hover:bg-white/90 dark:bg-black dark:text-white dark:hover:bg-black/90"
                              : "bg-black text-white hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90"
                          }`} data-testid={`button-plan-${tier.tier}`}>
                            {ar ? "اعرف السعر" : "See pricing"}
                            <Arrow className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom CTA */}
            <motion.div {...fade(4)} className="mt-10 max-w-5xl mx-auto">
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
        <section id="tab-process" className="pt-16 pb-24 md:pt-20 md:pb-28">
          <div className="container mx-auto px-5 md:px-8 max-w-6xl">
            <motion.div {...fade(0)} className="mb-14 text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">{ar ? "كيف نعمل" : "How we work"}</h2>
              <p className="text-black/55 dark:text-white/55 text-base leading-relaxed">
                {ar ? "أربع خطوات بسيطة من الفكرة للإطلاق." : "Four simple steps from idea to launch."}
              </p>
            </motion.div>

            <div className="relative max-w-5xl mx-auto">
              {/* Connecting line */}
              <div className="hidden lg:block absolute top-8 left-0 right-0 h-px bg-black/[0.07] dark:bg-white/[0.07]" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6">
                {PROCESS_STEPS.map((s, i) => (
                  <motion.div key={i} {...fade(i)} className="relative">
                    {/* Step circle */}
                    <div className="w-16 h-16 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mb-5 text-xl font-black relative z-10">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="font-bold text-base md:text-lg mb-2">{ar ? s.ar.t : s.en.t}</div>
                    <div className="text-sm text-black/55 dark:text-white/55 leading-relaxed">{ar ? s.ar.d : s.en.d}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Graphic Divider between Process and Reviews ── */}
        <GraphicDivider variant={3} dark />

        {/* ─── CLIENT REVIEWS / TESTIMONIALS ─── */}
        <section className="py-16 md:py-24 overflow-hidden relative">
          {/* Subtle bg pattern */}
          <div className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04] pointer-events-none"
            style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

          <div className="container mx-auto px-5 md:px-8 max-w-6xl relative">
            {/* Header */}
            <motion.div {...fade(0)} className="mb-10 text-center max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.03] text-black/55 dark:text-white/55 text-[11px] font-black uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-black/40 dark:bg-white/40" />
                {ar ? "آراء العملاء" : "Client Reviews"}
              </span>
              <h2 className="text-3xl md:text-5xl font-black mb-3 tracking-tight">
                {ar ? "ماذا يقول عملاؤنا؟" : "What our clients say"}
              </h2>
              <p className="text-sm text-black/45 dark:text-white/45 max-w-lg mx-auto">
                {ar ? "أكثر من 37 تقييم حقيقي من أصحاب مشاريع عملنا معهم — كلٌّ بحسب تجربته الخاصة." : "Over 37 real reviews from project owners we worked with."}
              </p>
              {/* Aggregate stats */}
              <div className="flex items-center justify-center gap-6 mt-5">
                <div className="flex items-center gap-1.5">
                  {[1,2,3,4,5].map(s => (
                    <div key={s} className="w-3.5 h-3.5 rounded-full bg-black/20 dark:bg-white/30" />
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
        <section id="tab-partners" className="pt-16 pb-24 md:pt-20 md:pb-28">
          <div className="container mx-auto px-5 md:px-8 max-w-6xl">
            <motion.div {...fade(0)} className="mb-12 text-center max-w-xl mx-auto">
              <h2 className="text-2xl md:text-4xl font-black mb-3 tracking-tight">{ar ? "شركاء يثقون بنا" : "Partners who trust us"}</h2>
              <p className="text-sm text-black/55 dark:text-white/55">
                {ar ? "علامات بنينا معها قصص نجاح حقيقية." : "Brands we've built real success stories with."}
              </p>
            </motion.div>

            {partnersLoading ? (
              <motion.div {...fade(1)} className="flex flex-wrap justify-center items-center gap-8 py-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-28 h-10 rounded-lg bg-black/[0.05] dark:bg-white/[0.06] animate-pulse" />
                ))}
              </motion.div>
            ) : apiPartners.length === 0 ? (
              <motion.div {...fade(1)} className="text-center py-8">
                <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 mb-6">
                  {["شركة الأنظمة", "مجموعة التقنية", "مؤسسة الابتكار", "شركة الحلول", "مجموعة الرقمية"].map((name, i) => (
                    <div key={i} className="h-10 px-5 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06] flex items-center">
                      <span className="text-sm font-bold text-black/30 dark:text-white/25">{name}</span>
                    </div>
                  ))}
                </div>
                <Link href="/partners">
                  <span className="text-sm text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/60 transition-colors cursor-pointer border-b border-dashed border-black/20 dark:border-white/20">
                    {ar ? "تصفح صفحة شركائنا ←" : "View our partners page →"}
                  </span>
                </Link>
              </motion.div>
            ) : (
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
                {apiPartners.map((p: any) => (
                  <div key={p.id || p._id} className="grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300" data-testid={`logo-partner-${p.id || p._id}`}>
                    <Link href="/partners">
                      <img src={p.logoUrl} alt={ar ? (p.nameAr || p.name) : (p.name || p.nameAr)} className="h-12 md:h-14 w-auto object-contain max-w-[140px] cursor-pointer" />
                    </Link>
                  </div>
                ))}
              </div>
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

        {/* ─── SOCIAL MEDIA POSTS ─── */}
        <section className="py-16 md:py-20 bg-gray-50/80 dark:bg-gray-950/80">
          <div className="container mx-auto px-5 md:px-8 max-w-6xl">
            {/* Section header */}
            <div className="flex items-center justify-between gap-4 mb-8" dir="rtl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center">
                  <img src="/qirox-icon-nobg.png" alt="Q" className="w-8 h-8 object-contain dark:invert" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                    {ar ? "من حساباتنا" : "From Our Socials"}
                  </h2>
                  <p className="text-xs text-black/40 dark:text-white/35 font-medium mt-0.5">@qirox.sa · @qiroxStudiosa</p>
                </div>
              </div>
              <a href="https://instagram.com/qirox.sa" target="_blank" rel="noreferrer"
                className="text-xs font-bold text-black/50 dark:text-white/40 hover:text-black dark:hover:text-white transition border border-black/10 dark:border-white/10 rounded-full px-4 py-1.5 hover:border-black/30 dark:hover:border-white/30 flex-shrink-0">
                {ar ? "تابعنا ↗" : "Follow ↗"}
              </a>
            </div>

            {/* Posts grid — images fully visible, not cropped */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4" dir="rtl">
              {[
                { src: "/post-1.png",  text: "مصنع الأنظمة الرقمية — نبني أنظمة احترافية لكل قطاع" },
                { src: "/post-2.png",  text: "شريكك الموثوق في رحلة التحول الرقمي" },
                { src: "/post-3.png",  text: "من فكرة بسيطة إلى نظام متكامل — مع كيروكس" },
                { src: "/post-4.png",  text: "تصاميم عصرية وأداء سريع لكل مشروع" },
                { src: "/post-5.png",  text: "كيروكس — حيث تلتقي التكنولوجيا بنمو الأعمال" },
                { src: "/post-6.png",  text: "خدمة متكاملة من التصميم حتى الإطلاق" },
                { src: "/post-7.png",  text: "أكثر من 50 مشروع منجز في قطاعات متعددة" },
                { src: "/post-8.png",  text: "الإدارة الذكية تبدأ من نظام ذكي مبني لك" },
                { src: "/post-9.png",  text: "التحول الرقمي صار ضرورة لا خيار — ابدأ الآن" },
                { src: "/post-10.png", text: "دعم فني متواصل وفريق احترافي بجانبك دائماً" },
                { src: "/post-11.png", text: "باقات مرنة تناسب كل ميزانية وكل مشروع" },
                { src: "/post-12.png", text: "لما تكون بياناتك مرتبة قراراتك تصير أسرع" },
              ].map((p, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: (i % 4) * 0.07 }}
                  className="group bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] overflow-hidden hover:shadow-lg hover:border-black/15 dark:hover:border-white/15 transition-all duration-300 cursor-pointer"
                >
                  {/* Image — object-contain so nothing is cut */}
                  <div className="bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-2" style={{ height: 150 }}>
                    <img
                      src={p.src} alt={p.text}
                      className="max-w-full max-h-full object-contain rounded-xl group-hover:scale-[1.02] transition-transform duration-300"
                      style={{ maxHeight: 134 }}
                    />
                  </div>
                  {/* Text below */}
                  <div className="px-3 pt-2.5 pb-3">
                    <p className="text-xs font-semibold text-gray-800 dark:text-white/85 leading-snug line-clamp-2">{p.text}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <img src="/qirox-icon-nobg.png" alt="" className="w-3 h-3 object-contain opacity-40 dark:invert" />
                      <span className="text-[10px] text-black/30 dark:text-white/25 font-medium">@qirox.sa</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <div className="h-24 bg-gradient-to-b from-transparent to-black dark:to-white" aria-hidden />
        <section className="bg-black text-white dark:bg-white dark:text-black pt-8 pb-24 md:pb-28">
          <div className="container mx-auto px-5 md:px-8 max-w-3xl text-center">
            <motion.div {...fade(0)}>
              <div className="inline-block mb-6">
                <img src="/qirox-logo-nobg.png" alt="QIROX" className="h-14 md:h-16 w-auto object-contain invert dark:invert-0" />
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-5 leading-tight tracking-tight">
                {ar ? "جاهز تبدأ؟" : "Ready to start?"}
              </h2>
              <p className="text-white/60 dark:text-black/60 mb-10 max-w-xl mx-auto leading-relaxed">
                {ar
                  ? "احكِ لنا فكرتك بكلام بسيط — المساعد الذكي يفهمك ويرتب لك كل شيء، مهما كانت ميزانيتك."
                  : "Describe your idea in plain words — our AI gets you and arranges everything, whatever your budget."}
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/start">
                  <Button size="lg" className="bg-white text-black hover:bg-white/90 dark:bg-black dark:text-white dark:hover:bg-black/90 rounded-xl h-12 px-6 font-bold gap-2" data-testid="button-cta-start">
                    <Sparkles className="w-4 h-4" />
                    {ar ? "ابدأ فكرتك الخاصة" : "Start Your Own Idea"}
                    <Arrow className="w-4 h-4" />
                  </Button>
                </Link>
                <a href="https://wa.me/966554656670" target="_blank" rel="noreferrer">
                  <Button size="lg" variant="outline" className="bg-transparent border-white/25 text-white hover:bg-white/10 dark:border-black/25 dark:text-black dark:hover:bg-black/10 rounded-xl h-12 px-6 font-bold gap-2" data-testid="button-cta-whatsapp">
                    <SiWhatsapp className="w-4 h-4" />
                    {ar ? "تحدث معنا" : "Talk to us"}
                  </Button>
                </a>
              </div>

              <div className="flex items-center justify-center gap-5 mt-12 text-white/50 dark:text-black/50">
                <a href="https://instagram.com/qirox.sa" target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-white dark:hover:text-black transition" data-testid="link-social-instagram"><SiInstagram className="w-5 h-5" /></a>
                <a href="https://x.com/qiroxsa" target="_blank" rel="noreferrer" aria-label="X" className="hover:text-white dark:hover:text-black transition" data-testid="link-social-x"><SiX className="w-5 h-5" /></a>
                <a href="https://www.linkedin.com/company/qirox" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:text-white dark:hover:text-black transition" data-testid="link-social-linkedin"><SiLinkedin className="w-5 h-5" /></a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <InstallPrompt />
    </div>
  );
}
