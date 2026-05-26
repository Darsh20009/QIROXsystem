import { useState, useMemo } from "react";
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
const qiroxLogo = "/qirox-icon.png";
import demoEcommerceImg from "@assets/Screenshot_2026-04-27_at_6.23.57_PM_1777303494183.png";
import demoRestaurantImg from "@assets/Screenshot_2026-04-27_at_1.59.42_PM_1777302518837.png";
import {
  ArrowRight, ArrowLeft, Sparkles, Zap, Shield, Cpu,
  Layers, ShoppingBag, Building2, GraduationCap,
  Heart, Coffee, Home as HomeIcon, Scissors, Lightbulb,
  Check, Star, Infinity, ChevronRight, TrendingUp, Bot, Globe,
} from "lucide-react";
import { SiWhatsapp, SiInstagram, SiX, SiLinkedin } from "react-icons/si";

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
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="80" cy="52" r="28" fill="currentColor" fillOpacity=".12"/>
      <path d="M70 52 C70 42 90 42 90 52 C90 59 86 62 86 68 L74 68 C74 62 70 59 70 52Z" fill="currentColor" fillOpacity=".25"/>
      <rect x="74" y="70" width="12" height="4" rx="2" fill="currentColor" fillOpacity=".25"/>
      <rect x="76" y="76" width="8" height="4" rx="2" fill="currentColor" fillOpacity=".2"/>
      <path d="M55 30 L50 25 M105 30 L110 25 M80 22 L80 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeOpacity=".2"/>
      <path d="M45 85 L115 85" stroke="currentColor" strokeWidth="2" strokeOpacity=".1" strokeDasharray="4 4"/>
      <circle cx="50" cy="95" r="6" fill="currentColor" fillOpacity=".12"/>
      <circle cx="80" cy="100" r="6" fill="currentColor" fillOpacity=".12"/>
      <circle cx="110" cy="95" r="6" fill="currentColor" fillOpacity=".12"/>
    </svg>
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
  { icon: ShoppingBag, arName: "متاجر إلكترونية",    enName: "E-Commerce",        segment: "ecommerce" },
  { icon: Coffee,      arName: "مطاعم ومقاهي",       enName: "Restaurants",       segment: "restaurant" },
  { icon: GraduationCap, arName: "منصات تعليمية",   enName: "Education",         segment: "education" },
  { icon: Building2,   arName: "شركات ومؤسسات",      enName: "Corporate",         segment: "corporate" },
  { icon: Heart,       arName: "صحة وعيادات",         enName: "Healthcare",        segment: "healthcare" },
  { icon: HomeIcon,    arName: "عقارات",              enName: "Real Estate",       segment: "realestate" },
  { icon: Scissors,    arName: "صالونات تجميل",       enName: "Beauty Salons",     segment: "beauty" },
  { icon: TrendingUp,  arName: "وكالات التسويق",      enName: "Marketing Agencies",segment: "marketing" },
  { icon: Bot,         arName: "ذكاء اصطناعي",        enName: "AI Solutions",       segment: "ai" },
  { icon: Lightbulb,   arName: "ابدأ فكرتك الخاصة",  enName: "Start your own idea", custom: true },
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

export default function Home() {
  const { lang, dir } = useI18n();
  const ar = lang === "ar";
  const [tab, setTab] = useState<string>("systems");

  const { data: templates = [] } = useTemplates();
  const { data: apiPartners = [], isLoading: partnersLoading } = useQuery<Partner[]>({ queryKey: ["/api/partners"] });
  const { data: pricingPlans = [] } = useQuery<any[]>({ queryKey: ["/api/pricing"] });
  const { data: publicReviews = [] } = useQuery<any[]>({ queryKey: ["/api/reviews/public"] });

  const STATIC_REVIEWS = [
    { id: "sr1", clientName: "م. أ", serviceTitle: ar ? "متجر إلكتروني" : "E-commerce Store", rating: 5, comment: ar ? "تجربة ممتازة من البداية للنهاية. الفريق احترافي ومتجاوب والتسليم كان في الوقت المحدد تماماً." : "Excellent experience from start to finish. Professional team and on-time delivery." },
    { id: "sr2", clientName: "أ. س", serviceTitle: ar ? "موقع مطعم" : "Restaurant Website", rating: 5, comment: ar ? "صُممت لنا منصة جميلة وسريعة وزادت مبيعاتنا من اليوم الأول. أنصح الجميع بكيروكس." : "Beautiful, fast platform and sales increased from day one. Highly recommend Qirox." },
    { id: "sr3", clientName: "م. ف", serviceTitle: ar ? "نظام حجوزات" : "Booking System", rating: 5, comment: ar ? "اخترت كيروكس بناءً على توصية ولم يخيّب الأمل. دعم فوري ومشروع محترف بجميع المقاييس." : "Chose Qirox based on a recommendation — didn't disappoint. Fast support and quality work." },
    { id: "sr4", clientName: "أ. ن", serviceTitle: ar ? "متجر ملابس" : "Fashion Store", rating: 5, comment: ar ? "السرعة والجودة والسعر المناسب — كل شيء متكامل. أنصح كل صاحب مشروع بكيروكس." : "Speed, quality, and fair pricing — everything is complete. Recommended for any project owner." },
    { id: "sr5", clientName: "م. خ", serviceTitle: ar ? "موقع خدمات" : "Services Website", rating: 4, comment: ar ? "فريق جاد ومحترف. المشروع خرج بشكل أفضل مما توقعته والدعم لا يزال مستمراً." : "Serious and professional team. The project exceeded my expectations and support continues." },
    { id: "sr6", clientName: "أ. ر", serviceTitle: ar ? "موقع عيادة" : "Clinic Website", rating: 5, comment: ar ? "تعاملنا مع كيروكس لأول مرة وستكون ليست الأخيرة. جودة عالية وتواصل رائع طوال المشروع." : "First time with Qirox and definitely not the last. High quality and great communication." },
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
              <img src={qiroxLogo} alt="مصنع الأنظمة الرقمية" className="h-12 md:h-14 w-auto mb-5 dark:invert" />
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-black/15 dark:border-white/15 text-[11px] font-bold tracking-wide uppercase mb-7">
                <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white animate-pulse" />
                {ar ? "مصنع الأنظمة الرقمية · شريكك التقني" : "Digital Systems Factory · Your tech partner"}
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6 max-w-4xl">
                {ar ? "نحوّل فكرتك" : "We turn your idea"}
                <br />
                <span className="text-black/40 dark:text-white/40">{ar ? "إلى موقع أو نظام جاهز" : "into a real working system"}</span>
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
                      <div className={`absolute inset-0 bottom-[35%] flex items-center justify-center p-3 transition-transform duration-500 group-hover:scale-110 ${
                        s.custom ? "text-white dark:text-black" : "text-black dark:text-white"
                      }`}>
                        <div className="relative w-full h-full flex items-center justify-center">
                          {IllustrationComponent ? <IllustrationComponent /> : <Icon className="w-10 h-10" />}
                        </div>
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

        {/* ─── CLIENT REVIEWS / TESTIMONIALS ─── */}
        <section className="py-16 md:py-24 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="container mx-auto px-5 md:px-8 max-w-6xl">
            <motion.div {...fade(0)} className="mb-12 text-center max-w-xl mx-auto">
              <span className="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full border border-amber-300/50 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-[11px] font-black uppercase tracking-wider">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                {ar ? "آراء العملاء" : "Client Reviews"}
              </span>
              <h2 className="text-2xl md:text-4xl font-black mb-3 tracking-tight">
                {ar ? "ماذا يقول عملاؤنا؟" : "What our clients say"}
              </h2>
              <p className="text-sm text-black/55 dark:text-white/55">
                {ar ? "تقييمات حقيقية من أصحاب مشاريع أنجزناها معاً." : "Real ratings from project owners we worked with."}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {(displayReviews as any[]).slice(0, 6).map((r: any, i: number) => (
                <motion.div key={r.id || r._id || i} {...fade(i)}>
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] p-5 h-full flex flex-col hover:shadow-md dark:hover:shadow-white/5 transition-shadow">
                    <div className="flex items-center gap-1 mb-3">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-4 h-4 ${s <= (r.rating || 5) ? "fill-amber-400 text-amber-400" : "text-black/15 dark:text-white/15"}`} />
                      ))}
                    </div>
                    <p className="text-sm text-black/75 dark:text-white/70 leading-relaxed flex-1 mb-4">
                      {r.comment || r.text || "—"}
                    </p>
                    <div className="flex items-center gap-3 pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-black/10 to-black/5 dark:from-white/10 dark:to-white/5 flex items-center justify-center shrink-0">
                        <span className="text-sm font-black text-black/60 dark:text-white/60">
                          {(r.clientName || r.userName || "ع").charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{r.clientName || r.userName || "عميل كيروكس"}</p>
                        {r.serviceTitle && <p className="text-[11px] text-black/40 dark:text-white/40">{r.serviceTitle}</p>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

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
                <div className="w-10 h-10 rounded-2xl bg-black dark:bg-white flex items-center justify-center shadow-md">
                  <img src="/qirox-icon.png" alt="Q" className="w-6 h-6 object-contain invert dark:invert-0" />
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
                      <img src="/qirox-icon.png" alt="" className="w-3 h-3 object-contain opacity-40" />
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
              <img src={qiroxLogo} alt="QIROX" className="h-12 w-auto mx-auto mb-6 invert dark:invert-0" />
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
