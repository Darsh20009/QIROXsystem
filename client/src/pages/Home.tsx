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
import qiroxLogo from "@assets/qirox_without_background_1771716363944.png";
import {
  ArrowRight, ArrowLeft, Sparkles, Zap, Shield, Cpu,
  Layers, ShoppingBag, Building2, GraduationCap,
  Heart, Coffee, Home as HomeIcon, Scissors, Lightbulb,
  Check, Star, Infinity, ChevronRight,
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

const SECTORS = [
  { icon: ShoppingBag, arName: "متاجر إلكترونية", enName: "E-Commerce",   segment: "ecommerce" },
  { icon: Coffee,      arName: "مطاعم ومقاهي",    enName: "Restaurants",  segment: "restaurant" },
  { icon: GraduationCap, arName: "منصات تعليمية", enName: "Education",    segment: "education" },
  { icon: Building2,   arName: "شركات ومؤسسات",   enName: "Corporate",    segment: "corporate" },
  { icon: Heart,       arName: "صحة وعيادات",      enName: "Healthcare",   segment: "healthcare" },
  { icon: HomeIcon,    arName: "عقارات",           enName: "Real Estate",  segment: "realestate" },
  { icon: Scissors,    arName: "صالونات تجميل",    enName: "Beauty Salons",segment: "beauty" },
  { icon: Lightbulb,   arName: "ابدأ فكرتك الخاصة", enName: "Start your own idea", custom: true },
];

const PILLARS = [
  { icon: Zap, ar: { t: "سريع", d: "نسلّم في أيام، لا أشهر" }, en: { t: "Fast", d: "Days, not months" } },
  { icon: Shield, ar: { t: "آمن", d: "حماية كاملة لبياناتك" }, en: { t: "Secure", d: "Full data protection" } },
  { icon: Cpu, ar: { t: "ذكي", d: "مساعد ذكي ينفّذ معك" }, en: { t: "Smart", d: "AI helps you build" } },
  { icon: Sparkles, ar: { t: "بسيط", d: "سهل حتى لو ما عندك خبرة تقنية" }, en: { t: "Simple", d: "Easy, even without tech skills" } },
];

const TABS = [
  { id: "systems", ar: "الأنظمة", en: "Systems" },
  { id: "pricing", ar: "الباقات", en: "Plans" },
  { id: "process", ar: "كيف نعمل", en: "How We Work" },
  { id: "partners", ar: "شركاؤنا", en: "Partners" },
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
  const { data: apiPartners = [] } = useQuery<Partner[]>({ queryKey: ["/api/partners"] });
  const { data: pricingPlans = [] } = useQuery<any[]>({ queryKey: ["/api/pricing"] });

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
    <div className="min-h-screen flex flex-col bg-white text-black dark:bg-black dark:text-white" dir={dir}>
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
              <img src={qiroxLogo} alt="QIROX" className="h-12 md:h-14 w-auto mb-5 dark:invert" />
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-black/15 dark:border-white/15 text-[11px] font-bold tracking-wide uppercase mb-7">
                <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white animate-pulse" />
                {ar ? "QIROX Studio · شريكك التقني" : "QIROX Studio · Your tech partner"}
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
          <div className="container mx-auto px-5 md:px-8 max-w-6xl">
            <div className="mx-auto inline-flex items-center gap-1 p-1.5 rounded-full bg-white/85 dark:bg-black/85 backdrop-blur-md border border-black/10 dark:border-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)]">
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

            {/* Sector illustrated cards grid */}
            <motion.div {...fade(1)} className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-14">
              {SECTORS.map((s: any, i) => {
                const IllustrationComponent = SECTOR_ILLUSTRATIONS[s.arName];
                const sectorHref = s.custom
                  ? "/start"
                  : `/prices?segment=${s.segment}`;
                return (
                  <Link key={i} href={sectorHref}>
                    <div
                      className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] ${
                        s.custom
                          ? "bg-black dark:bg-white"
                          : "bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/[0.09]"
                      }`}
                      data-testid={`card-sector-${i}`}
                    >
                      {/* Illustration */}
                      <div className={`absolute inset-0 flex items-center justify-center p-4 pb-12 ${s.custom ? "text-white dark:text-black" : "text-black dark:text-white"}`}>
                        {IllustrationComponent && <IllustrationComponent />}
                      </div>
                      {/* Label + price badge */}
                      <div className={`absolute bottom-0 inset-x-0 p-3 pt-6 ${
                        s.custom
                          ? "bg-gradient-to-t from-black/70 dark:from-white/30 to-transparent"
                          : "bg-gradient-to-t from-black/[0.12] dark:from-white/[0.12] to-transparent"
                      }`}>
                        <div className={`text-xs font-bold ${s.custom ? "text-white dark:text-black" : "text-black dark:text-white"}`}>
                          {ar ? s.arName : s.enName}
                        </div>
                        {!s.custom && (
                          <div className={`text-[9px] mt-0.5 font-medium ${s.custom ? "text-white/70 dark:text-black/70" : "text-black/50 dark:text-white/50"}`}>
                            {ar ? "السعر على حسب الاحتياج" : "Custom pricing"}
                          </div>
                        )}
                      </div>
                      {s.custom && (
                        <div className="absolute top-3 right-3">
                          <Lightbulb className="w-4 h-4 text-white/80 dark:text-black/80" />
                        </div>
                      )}
                      {/* Arrow on hover */}
                      {!s.custom && (
                        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-5 h-5 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center">
                            <ChevronRight className="w-3 h-3 text-black/60 dark:text-white/60" />
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </motion.div>

            {/* Templates grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 max-w-2xl mx-auto">
              {visibleTemplates.length === 0
                ? CURRENT_SECTORS.map((s: any, i) => {
                    const IllustrationComponent = SECTOR_ILLUSTRATIONS[s.arName];
                    return (
                      <motion.div key={i} {...fade(i)}>
                        <Link href={`/prices?segment=${s.segment}`}>
                          <div className="group aspect-[4/5] rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] overflow-hidden cursor-pointer hover:bg-black/[0.06] dark:hover:bg-white/[0.07] transition-all duration-300 hover:scale-[1.02]" data-testid={`card-template-placeholder-${i}`}>
                            <div className="h-3/4 flex items-center justify-center overflow-hidden text-black/30 dark:text-white/30 p-6">
                              {IllustrationComponent ? <IllustrationComponent /> : <Layers className="w-10 h-10" />}
                            </div>
                            <div className="p-3.5 md:p-4">
                              <div className="font-bold text-sm">{ar ? s.arName : s.enName}</div>
                              <div className="text-[11px] text-black/45 dark:text-white/45 mt-0.5 flex items-center gap-1">
                                {ar ? "اضغط للاستعراض" : "Tap to explore"}
                                <ChevronRight className="w-3 h-3" />
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })
                : visibleTemplates.map((tpl: any, i: number) => {
                    const tplCat = (tpl.category || tpl.sector || "").toLowerCase();
                    const CATEGORY_TO_SEGMENT: Record<string, string> = { food: "restaurant", cafe: "restaurant", dining: "restaurant", store: "ecommerce", shop: "ecommerce" };
                    const resolvedSegment = CATEGORY_TO_SEGMENT[tplCat] || tplCat;
                    const matchedSector = SECTORS.find(s =>
                      s.segment === resolvedSegment ||
                      s.segment === tplCat ||
                      s.enName.toLowerCase().replace(/[^a-z]/g, "").includes(tplCat.replace(/[^a-z]/g, "")) ||
                      s.arName.includes(tpl.category || "")
                    );
                    const IllComp = matchedSector ? SECTOR_ILLUSTRATIONS[matchedSector.arName] : null;
                    const catLabel = matchedSector ? (ar ? matchedSector.arName : matchedSector.enName) : (tpl.category || "");
                    return (
                      <motion.div key={tpl._id || tpl.id || i} {...fade(i)}>
                        <Link href={`/templates/${tpl.slug || tpl._id}`}>
                          <div className="group aspect-[4/5] rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] overflow-hidden cursor-pointer hover-elevate active-elevate-2 transition-all" data-testid={`card-template-${tpl._id || i}`}>
                            <div className="h-3/4 flex items-center justify-center overflow-hidden text-black/25 dark:text-white/25" style={tpl.heroColor && !tpl.coverImage && !IllComp ? { background: `linear-gradient(135deg, ${tpl.heroColor}22 0%, ${tpl.heroColor}44 100%)` } : {}}>
                              {tpl.coverImage ? (
                                <img src={tpl.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              ) : IllComp ? (
                                <div className="w-full h-full p-6"><IllComp /></div>
                              ) : (
                                <div className="flex flex-col items-center gap-3">
                                  {matchedSector && (() => { const Icon = matchedSector.icon; return <Icon className="w-10 h-10" style={tpl.heroColor ? { color: tpl.heroColor } : {}} />; })()}
                                  {!matchedSector && <Layers className="w-10 h-10" />}
                                  <span className="text-xs font-medium text-black/40 dark:text-white/40">{catLabel}</span>
                                </div>
                              )}
                            </div>
                            <div className="p-3.5 md:p-4">
                              <div className="font-bold text-sm truncate">{ar ? tpl.nameAr || tpl.name : tpl.name}</div>
                              <div className="text-[11px] text-black/45 dark:text-white/45 mt-0.5 truncate">{catLabel}</div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
            </div>

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
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.07] dark:border-white/[0.08] mb-5">
                <Sparkles className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
                <span className="text-xs font-semibold text-black/45 dark:text-white/45 tracking-wider">{ar ? "شفافية كاملة في الأسعار" : "Full pricing transparency"}</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
                {ar ? "ابدأ من 399 ريال" : "Starting from SAR 399"}
                <br />
                <span className="text-black/30 dark:text-white/30">{ar ? "لكل قطاع وميزانية" : "for every sector & budget"}</span>
              </h2>
              <p className="text-black/50 dark:text-white/50 text-sm leading-relaxed max-w-lg mx-auto">
                {ar ? "ثلاثة مستويات واضحة — اختر ما يناسب مشروعك الآن، وارتقِ عند نموّك." : "Three clear tiers — pick what fits your project now, upgrade as you grow."}
              </p>
            </motion.div>

            {/* Tier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 max-w-5xl mx-auto items-start">
              {[
                {
                  tier: "lite",
                  nameAr: "لايت", nameEn: "Lite",
                  tagAr: "للشركات الناشئة والمشاريع الصغيرة",
                  tagEn: "For startups & small businesses",
                  priceAr: "يبدأ من 399 ريال", priceEn: "From SAR 399",
                  periodAr: "لـ 6 أشهر", periodEn: "for 6 months",
                  featuresAr: ["موقع احترافي كامل", "لوحة تحكم سهلة", "دعم فني أساسي", "SSL + نطاق مجاني", "تقارير الأداء"],
                  featuresEn: ["Complete professional website", "Easy control panel", "Basic support", "Free SSL + domain", "Performance reports"],
                  popular: false,
                },
                {
                  tier: "pro",
                  nameAr: "برو", nameEn: "Pro",
                  tagAr: "الأكثر طلباً — للمشاريع الجادة",
                  tagEn: "Most popular — for serious projects",
                  priceAr: "يبدأ من 599 ريال", priceEn: "From SAR 599",
                  periodAr: "لـ 6 أشهر", periodEn: "for 6 months",
                  featuresAr: ["كل ميزات لايت", "تطبيق جوال (iOS/Android)", "نظام متكامل للقطاع", "إشعارات فورية للعملاء", "تقارير متقدمة + AI"],
                  featuresEn: ["All Lite features", "Mobile app (iOS/Android)", "Full sector system", "Push notifications", "Advanced reports + AI"],
                  popular: true,
                },
                {
                  tier: "infinite",
                  nameAr: "إنفينيت", nameEn: "Infinite",
                  tagAr: "للمؤسسات والمشاريع الكبيرة",
                  tagEn: "For enterprises & large projects",
                  priceAr: "يبدأ من 899 ريال", priceEn: "From SAR 899",
                  periodAr: "لـ 6 أشهر", periodEn: "for 6 months",
                  featuresAr: ["كل ميزات برو", "تطوير مخصص بلا حدود", "خادم مخصص", "مساعد AI مدمج", "أولوية دعم 24/7"],
                  featuresEn: ["All Pro features", "Unlimited custom dev", "Dedicated server", "Built-in AI assistant", "Priority 24/7 support"],
                  popular: false,
                },
              ].map((tier, i) => (
                <motion.div key={tier.tier} {...fade(i)} className={tier.popular ? "md:-mt-4" : ""}>
                  <div className={`relative rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                    tier.popular
                      ? "bg-black dark:bg-white shadow-2xl shadow-black/25 dark:shadow-white/10"
                      : "bg-white dark:bg-gray-900 border border-black/[0.08] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20"
                  }`} data-testid={`card-plan-${tier.tier}`}>

                    {tier.popular && (
                      <div className="absolute top-0 inset-x-0 flex justify-center -translate-y-full pb-1">
                        <div className="bg-black dark:bg-white text-white dark:text-black text-[10px] font-black px-3 py-1 rounded-t-lg flex items-center gap-1">
                          <Star className="w-2.5 h-2.5" />
                          {ar ? "الأكثر طلباً" : "Most Popular"}
                        </div>
                      </div>
                    )}

                    {/* Top gradient bar */}
                    <div className={`h-1 w-full ${
                      tier.tier === "infinite"
                        ? "bg-gradient-to-r from-zinc-300 via-zinc-100 to-zinc-300"
                        : tier.popular
                          ? "bg-gradient-to-r from-white/20 via-white/60 to-white/20"
                          : "bg-black/[0.06] dark:bg-white/[0.08]"
                    }`} />

                    <div className="p-6 flex flex-col gap-5">
                      {/* Header */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xl font-black tracking-tight ${tier.popular ? "text-white dark:text-black" : "text-black dark:text-white"}`}>
                            {ar ? tier.nameAr : tier.nameEn}
                          </span>
                          {tier.tier === "infinite" && (
                            <Infinity className={`w-4 h-4 ${tier.popular ? "text-white/50" : "text-black/30 dark:text-white/30"}`} />
                          )}
                        </div>
                        <p className={`text-[11px] leading-snug ${tier.popular ? "text-white/55 dark:text-black/55" : "text-black/45 dark:text-white/45"}`}>
                          {ar ? tier.tagAr : tier.tagEn}
                        </p>
                      </div>

                      {/* Price */}
                      <div className={`rounded-xl p-3.5 ${tier.popular ? "bg-white/10 dark:bg-black/10" : "bg-black/[0.03] dark:bg-white/[0.05]"}`}>
                        <div className={`text-lg font-black ${tier.popular ? "text-white dark:text-black" : "text-black dark:text-white"}`}>
                          {ar ? tier.priceAr : tier.priceEn}
                        </div>
                        <div className={`text-[10px] mt-0.5 ${tier.popular ? "text-white/50 dark:text-black/50" : "text-black/40 dark:text-white/40"}`}>
                          {ar ? tier.periodAr : tier.periodEn} · {ar ? "يختلف حسب القطاع" : "varies by sector"}
                        </div>
                      </div>

                      {/* Features */}
                      <ul className="space-y-2">
                        {(ar ? tier.featuresAr : tier.featuresEn).map((f, fi) => (
                          <li key={fi} className="flex items-start gap-2 text-xs">
                            <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${tier.popular ? "text-white/60 dark:text-black/60" : "text-black/40 dark:text-white/40"}`} />
                            <span className={tier.popular ? "text-white/80 dark:text-black/80" : "text-black/65 dark:text-white/65"}>{f}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <Link href="/prices">
                        <Button className={`w-full rounded-xl h-10 font-bold text-sm gap-1.5 ${
                          tier.popular
                            ? "bg-white text-black hover:bg-white/90 dark:bg-black dark:text-white dark:hover:bg-black/90"
                            : "bg-black/[0.06] text-black hover:bg-black/10 dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/15 border border-black/[0.08] dark:border-white/[0.08]"
                        }`} data-testid={`button-plan-${tier.tier}`}>
                          {ar ? "عرض التفاصيل" : "View details"}
                          <Arrow className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom strip */}
            <motion.div {...fade(4)} className="mt-10 max-w-5xl mx-auto">
              <div className="rounded-2xl bg-black dark:bg-white p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
                <div className="relative flex items-center gap-3 text-center md:text-start">
                  <div className="w-10 h-10 rounded-xl bg-white/15 dark:bg-black/15 flex items-center justify-center shrink-0">
                    <Cpu className="w-5 h-5 text-white dark:text-black" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white dark:text-black">{ar ? "مش عارف ايش يناسبك؟" : "Not sure which tier fits?"}</div>
                    <div className="text-xs text-white/55 dark:text-black/55 mt-0.5">{ar ? "اسأل مساعدنا الذكي — يساعدك تختار الأفضل لمشروعك في دقيقة" : "Ask our AI advisor — helps you pick the best fit in a minute"}</div>
                  </div>
                </div>
                <div className="relative flex gap-2 shrink-0">
                  <Link href="/start">
                    <Button className="bg-white text-black hover:bg-white/90 dark:bg-black dark:text-white dark:hover:bg-black/90 rounded-xl h-10 px-5 font-bold text-sm gap-1.5" data-testid="button-ai-advisor">
                      <Sparkles className="w-4 h-4" />
                      {ar ? "اسأل المساعد" : "Ask the AI"}
                    </Button>
                  </Link>
                  <Link href="/prices">
                    <Button variant="outline" className="border-white/25 dark:border-black/25 text-white dark:text-black hover:bg-white/10 dark:hover:bg-black/10 rounded-xl h-10 px-5 font-bold text-sm gap-1.5" data-testid="button-view-all-plans">
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

        {/* ─── PARTNERS ─── */}
        <section id="tab-partners" className="pt-16 pb-24 md:pt-20 md:pb-28">
          <div className="container mx-auto px-5 md:px-8 max-w-6xl">
            <motion.div {...fade(0)} className="mb-12 text-center max-w-xl mx-auto">
              <h2 className="text-2xl md:text-4xl font-black mb-3 tracking-tight">{ar ? "شركاء يثقون بنا" : "Partners who trust us"}</h2>
              <p className="text-sm text-black/55 dark:text-white/55">
                {ar ? "علامات بنينا معها قصص نجاح حقيقية." : "Brands we've built real success stories with."}
              </p>
            </motion.div>

            {apiPartners.length === 0 ? (
              <motion.div {...fade(1)} className="flex flex-wrap justify-center items-center gap-8 py-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-28 h-10 rounded-lg bg-black/[0.05] dark:bg-white/[0.06] animate-pulse" />
                ))}
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
