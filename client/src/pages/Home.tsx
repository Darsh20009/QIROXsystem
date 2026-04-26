import { useState, useMemo, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
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
  ShoppingBag, Building2, GraduationCap, Heart, Coffee,
  Home as HomeIcon, Scissors, Lightbulb, Star, Infinity as InfinityIcon,
  ChevronRight, Check, Rocket, MessageSquare, Globe, BarChart3, Layers,
  Lock, Bell, CreditCard, Palette, TrendingUp, Users, Phone,
} from "lucide-react";
import { SiWhatsapp, SiInstagram, SiX, SiLinkedin } from "react-icons/si";

/* ─── Animation helpers ───────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.1 },
  transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] as any },
});
const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

/* ─── Data ────────────────────────────────────────────────────────────── */
const PILLARS = [
  { icon: Rocket, gradient: "from-violet-600 to-purple-600", ar: { t: "تسليم سريع", d: "في أيام لا أشهر — نبني بسرعة احترافية" }, en: { t: "Fast Delivery", d: "Days not months — we build at pro speed" } },
  { icon: Shield, gradient: "from-blue-600 to-cyan-500",    ar: { t: "أمان كامل", d: "خوادمنا مشفّرة وبياناتك محمية 100%" }, en: { t: "Fully Secure", d: "Encrypted servers, 100% data protection" } },
  { icon: Cpu,    gradient: "from-emerald-500 to-teal-500", ar: { t: "ذكاء اصطناعي", d: "مساعد ذكي يفهم احتياجاتك ويبني معك" }, en: { t: "AI Powered", d: "Smart assistant that understands & builds" } },
  { icon: Globe,  gradient: "from-amber-500 to-orange-500", ar: { t: "لأي قطاع", d: "مطاعم، متاجر، عيادات — حل لكل نشاط" }, en: { t: "Any Sector", d: "Restaurants, stores, clinics — any business" } },
];

const SECTORS_GRID = [
  { icon: ShoppingBag,   arName: "متاجر إلكترونية", enName: "E-Commerce",      segment: "ecommerce",   grad: "from-blue-600/90 to-cyan-500/90",     glow: "shadow-blue-500/25" },
  { icon: Coffee,        arName: "مطاعم ومقاهي",    enName: "Restaurants",     segment: "restaurant",  grad: "from-orange-500/90 to-amber-400/90",  glow: "shadow-orange-500/25" },
  { icon: GraduationCap, arName: "منصات تعليمية",  enName: "Education",       segment: "education",   grad: "from-emerald-600/90 to-teal-400/90",  glow: "shadow-emerald-500/25" },
  { icon: Building2,     arName: "شركات ومؤسسات",  enName: "Corporate",       segment: "corporate",   grad: "from-violet-600/90 to-purple-500/90", glow: "shadow-violet-500/25" },
  { icon: Heart,         arName: "صحة وعيادات",     enName: "Healthcare",      segment: "healthcare",  grad: "from-rose-500/90 to-pink-400/90",     glow: "shadow-rose-500/25" },
  { icon: HomeIcon,      arName: "عقارات",          enName: "Real Estate",     segment: "realestate",  grad: "from-sky-600/90 to-blue-400/90",      glow: "shadow-sky-500/25" },
  { icon: Scissors,      arName: "صالونات تجميل",   enName: "Beauty Salons",   segment: "beauty",      grad: "from-fuchsia-500/90 to-pink-400/90",  glow: "shadow-fuchsia-500/25" },
  { icon: Lightbulb,     arName: "ابدأ فكرتك",     enName: "Your Own Idea",   custom: true,           grad: "from-[#1a1a2e]/95 to-[#0d0d18]/95",   glow: "shadow-white/5" },
];

const PRICING_PREVIEW = [
  {
    tier: "lite", nameAr: "لايت", tag: "للبداية بثقة",
    price: 699, currency: "ريال / سنة",
    features: ["موقع احترافي كامل", "لوحة تحكم متكاملة", "نقطة بيع + فواتير", "دعم فني مستمر"],
    dark: false, accent: "violet",
  },
  {
    tier: "pro", nameAr: "برو", tag: "الأكثر طلباً",
    price: 999, currency: "ريال / سنة",
    features: ["كل مميزات لايت", "محاسبة + ولاء + كوبونات", "تطبيق PWA", "بوابة دفع مجانية", "1,000 رسالة شهرياً"],
    dark: true, accent: "blue", popular: true,
  },
  {
    tier: "infinity", nameAr: "إنفينتي", tag: "بلا حدود",
    price: 1499, currency: "ريال / سنة",
    features: ["كل مميزات برو", "تطبيق iOS + Android", "5 بريد باسم النشاط", "20 تطوير بعد التسليم"],
    dark: false, accent: "amber",
  },
];

const PROCESS_STEPS = [
  { num: "01", grad: "from-violet-600 to-purple-600", ar: { t: "احكِ لنا فكرتك", d: "تواصل معنا أو اكتب للمساعد الذكي — يفهم احتياجاتك في دقائق" } },
  { num: "02", grad: "from-blue-600 to-cyan-500",    ar: { t: "اختر ما يناسبك", d: "أسعار واضحة، اختر الباقة والمدة التي تناسب ميزانيتك بدون ضغط" } },
  { num: "03", grad: "from-emerald-500 to-teal-500", ar: { t: "نبني ونسلّم", d: "فريقنا يبني نظامك بجودة احترافية وسرعة فائقة حتى التسليم" } },
  { num: "04", grad: "from-amber-500 to-orange-500", ar: { t: "ندعمك دائماً", d: "صيانة وتحديثات ودعم فني متاح حين تحتاجه — أنت لست وحدك" } },
];

const FEATURES_SHOWCASE = [
  { icon: BarChart3, ar: "تقارير وإحصائيات مباشرة",  en: "Live reports & analytics" },
  { icon: Bell,       ar: "إشعارات فورية للعملاء",     en: "Instant push notifications" },
  { icon: CreditCard, ar: "بوابة دفع إلكترونية",       en: "Online payment gateway" },
  { icon: Layers,     ar: "نظام Integrations كامل",    en: "Full integrations system" },
  { icon: Lock,       ar: "أمان وصلاحيات متقدمة",      en: "Advanced security & roles" },
  { icon: Users,      ar: "إدارة العملاء والولاء",      en: "CRM & loyalty management" },
  { icon: Palette,    ar: "تصميم يعكس هويتك",          en: "Design reflecting your brand" },
  { icon: TrendingUp, ar: "متابعة المبيعات والأداء",    en: "Sales & performance tracking" },
];

/* ─── Animated Orb ────────────────────────────────────────────────────── */
function Orb({ className }: { className: string }) {
  return <div className={`absolute rounded-full blur-3xl pointer-events-none ${className}`} aria-hidden/>;
}

/* ─── Marquee ─────────────────────────────────────────────────────────── */
function Marquee({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden relative">
      <div className="flex gap-8 animate-[marquee_30s_linear_infinite] w-max">{children}{children}</div>
    </div>
  );
}

export default function Home() {
  const { lang, dir } = useI18n();
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const { data: templates = [] } = useTemplates();
  const { data: apiPartners = [] } = useQuery<Partner[]>({ queryKey: ["/api/partners"] });
  const { data: settings } = useQuery<any>({ queryKey: ["/api/public/settings"] });
  const waNumber = (settings?.whatsapp || settings?.contactPhone || "966554656670").replace(/\D/g, "");

  const visibleTemplates = useMemo(() => {
    const list = (templates as any[]).filter(t => t?.status !== "draft");
    return list.slice(0, 4);
  }, [templates]);

  return (
    <div className="min-h-screen flex flex-col bg-[#05050d] text-white overflow-x-hidden" dir={dir}>
      <Navigation />

      <main className="flex-1">
        {/* ════════════════════════════════════════════
            HERO — Dark Luxury
        ════════════════════════════════════════════ */}
        <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-16">
          {/* Background mesh gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#05050d] via-[#0d0520] to-[#050514]"/>
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage:"linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)", backgroundSize:"40px 40px" }}/>
          {/* Orbs */}
          <Orb className="w-[600px] h-[600px] bg-violet-600/20 -top-32 -right-32 animate-pulse"/>
          <Orb className="w-[500px] h-[500px] bg-blue-600/15 top-1/3 -left-48"/>
          <Orb className="w-[400px] h-[400px] bg-purple-500/10 bottom-0 right-1/4"/>
          <Orb className="w-[300px] h-[300px] bg-cyan-500/10 bottom-1/4 -left-24"/>

          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 container mx-auto px-5 max-w-5xl text-center">
            {/* Logo */}
            <motion.div {...fadeIn(0)} className="mb-6">
              <img src={qiroxLogo} alt="QIROX" className="h-10 w-auto mx-auto invert brightness-90"/>
            </motion.div>

            {/* Pill badge */}
            <motion.div {...fadeIn(0.1)} className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md text-[11px] font-bold tracking-[0.15em] uppercase text-white/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"/>
                QIROX Studio · شريكك التقني
              </div>
            </motion.div>

            {/* Heading */}
            <motion.h1 {...fadeUp(0.15)} className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.0] tracking-tight mb-6">
              <span className="text-white">نحوّل </span>
              <span className="text-white/30">فكرتك</span>
              <br/>
              <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                إلى نظام جاهز
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p {...fadeUp(0.25)} className="text-base md:text-lg text-white/45 max-w-2xl mx-auto mb-10 leading-relaxed">
              ما تحتاج تكون تقني — احكِ لنا اللي تبيه بكلام عادي، وفريقنا والمساعد الذكي يبنونه لك.
              <br className="hidden md:block"/>
              مهما كانت ميزانيتك، عندنا الحل المناسب لنشاطك.
            </motion.p>

            {/* CTAs */}
            <motion.div {...fadeUp(0.35)} className="flex flex-wrap gap-3 justify-center mb-5">
              <Link href="/start">
                <button className="group relative flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-black text-sm transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02]" data-testid="button-hero-start">
                  <Sparkles className="w-4 h-4"/>
                  ابدأ فكرتك الخاصة
                  <Arrow className="w-4 h-4 group-hover:translate-x-[-2px] transition-transform"/>
                </button>
              </Link>
              <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer">
                <button className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white font-bold text-sm transition-all backdrop-blur-sm hover:border-white/20" data-testid="button-hero-whatsapp">
                  <SiWhatsapp className="w-4 h-4 text-emerald-400"/>
                  تواصل واتساب
                </button>
              </a>
            </motion.div>
            <motion.div {...fadeIn(0.45)}>
              <Link href="/prices" className="text-xs text-white/25 hover:text-white/50 transition" data-testid="link-hero-manual">
                أو تصفح الباقات والأسعار بنفسك ←
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.div {...fadeUp(0.5)} className="flex flex-wrap justify-center gap-6 md:gap-10 mt-16">
              {[["50+","مشروع أُنجز"],["3","قطاعات متخصصة"],["100%","رضا العملاء"]].map(([n,l],i)=>(
                <div key={i} className="text-center">
                  <div className="text-2xl font-black bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">{n}</div>
                  <div className="text-[10px] text-white/35 mt-0.5 font-semibold tracking-wider uppercase">{l}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#05050d] to-transparent pointer-events-none"/>
        </section>

        {/* ════════════════════════════════════════════
            PILLARS — 4 key advantages
        ════════════════════════════════════════════ */}
        <section className="py-16 md:py-20 bg-[#05050d]">
          <div className="container mx-auto px-5 max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {PILLARS.map((p, i) => (
                <motion.div key={i} {...fadeUp(i * 0.07)} className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                    <p.icon className="w-5 h-5 text-white"/>
                  </div>
                  <div className="font-black text-sm text-white mb-1">{ar ? p.ar.t : p.en.t}</div>
                  <div className="text-xs text-white/40 leading-relaxed">{ar ? p.ar.d : p.en.d}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            SECTORS — Sector grid
        ════════════════════════════════════════════ */}
        <section id="systems" className="py-20 md:py-28 bg-[#07070f]">
          <div className="container mx-auto px-5 max-w-6xl">
            <motion.div {...fadeUp(0)} className="text-center mb-14">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/20 mb-3">القطاعات</p>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
                نظام لكل{" "}
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">قطاع</span>
              </h2>
              <p className="text-white/40 text-base max-w-xl mx-auto">
                اختر مجالك — نبني لك نظاماً احترافياً مخصصاً بالكامل لطبيعة نشاطك
              </p>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
              {SECTORS_GRID.map((s, i) => {
                const Icon = s.icon;
                const href = s.custom ? "/start" : `/prices?segment=${s.segment}`;
                return (
                  <motion.div key={i} {...fadeUp(i * 0.06)}>
                    <Link href={href}>
                      <div className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-xl ${s.glow}`} data-testid={`card-sector-${i}`}>
                        {/* Gradient background */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${s.grad} opacity-90`}/>
                        {/* Grid texture */}
                        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage:"linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)", backgroundSize:"16px 16px" }}/>
                        {/* Glow orb */}
                        <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"/>
                        {/* Icon */}
                        <div className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                          <Icon className="w-5 h-5 text-white"/>
                        </div>
                        {s.custom && <Lightbulb className="absolute top-4 left-4 w-4 h-4 text-white/60"/>}
                        {/* Arrow on hover */}
                        <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!s.custom && <ChevronRight className="w-4 h-4 text-white/70"/>}
                        </div>
                        {/* Label */}
                        <div className="absolute bottom-0 inset-x-0 p-3 pt-8 bg-gradient-to-t from-black/50 to-transparent">
                          <div className="text-xs font-black text-white">{ar ? s.arName : s.enName}</div>
                          {!s.custom && <div className="text-[9px] text-white/50 mt-0.5">اضغط للاستعراض</div>}
                          {s.custom && <div className="text-[9px] text-white/60 mt-0.5">اكتب فكرتك بكلام بسيط</div>}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Features showcase */}
            <motion.div {...fadeUp(0.3)} className="mt-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 md:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-5 text-center">كل الأنظمة تحتوي على</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {FEATURES_SHOWCASE.map(({ icon: Icon, ar: arText, en: enText }, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-white/40"/>
                    </div>
                    <span className="text-xs text-white/50">{ar ? arText : enText}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="text-center mt-10">
              <Link href="/systems">
                <button className="flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white/60 hover:text-white text-sm font-bold transition" data-testid="button-view-all-systems">
                  عرض كل الأنظمة <Arrow className="w-4 h-4"/>
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            PRICING PREVIEW
        ════════════════════════════════════════════ */}
        <section id="pricing" className="py-20 md:py-28 bg-[#05050d] relative overflow-hidden">
          <Orb className="w-96 h-96 bg-violet-600/10 top-0 right-0"/>
          <Orb className="w-80 h-80 bg-blue-600/10 bottom-0 left-0"/>

          <div className="container mx-auto px-5 max-w-6xl relative">
            <motion.div {...fadeUp(0)} className="text-center mb-14">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/20 mb-3">الأسعار</p>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
                باقات{" "}
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">واضحة</span>
                {" "}بدون مفاجآت
              </h2>
              <p className="text-white/40 text-base max-w-xl mx-auto">
                أسعار شفافة — كل شيء داخل السعر بدون إضافات خفية. اختر المدة التي تناسبك.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {PRICING_PREVIEW.map((plan, i) => {
                const accentColors: Record<string, string> = {
                  violet: "from-violet-500 to-purple-600",
                  blue:   "from-blue-500 to-cyan-500",
                  amber:  "from-amber-400 to-orange-500",
                };
                const accentGrad = accentColors[plan.accent];
                return (
                  <motion.div key={plan.tier} {...fadeUp(i * 0.1)}>
                    <div className={`relative rounded-2xl overflow-hidden h-full flex flex-col border transition-all hover:-translate-y-1 hover:shadow-2xl ${plan.popular ? "border-blue-500/30 bg-gradient-to-b from-blue-900/30 to-[#09090f] shadow-[0_0_40px_rgba(59,130,246,0.12)]" : "border-white/[0.06] bg-white/[0.02]"}`} data-testid={`card-plan-home-${plan.tier}`}>
                      {/* Top line */}
                      <div className={`h-px w-full bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.1)] to-transparent`}/>
                      {plan.popular && <div className={`h-0.5 w-full bg-gradient-to-r from-transparent via-blue-400 to-transparent -mt-0.5`}/>}

                      <div className="p-6 flex-1 flex flex-col">
                        {plan.popular && (
                          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-300/60 mb-3">
                            <Star className="w-3 h-3"/>{plan.tag}
                          </div>
                        )}
                        {!plan.popular && <div className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3">{plan.tag}</div>}

                        <h3 className="text-2xl font-black text-white mb-4">{plan.nameAr}</h3>

                        <div className="mb-5">
                          <div className="flex items-end gap-1.5">
                            <span className={`text-4xl font-black bg-gradient-to-r ${accentGrad} bg-clip-text text-transparent`}>{plan.price.toLocaleString("ar-SA")}</span>
                            <span className="text-xs text-white/30 mb-1.5">{plan.currency}</span>
                          </div>
                          <p className="text-[10px] text-white/25 mt-1">أو {Math.round(plan.price/2).toLocaleString("ar-SA")} ريال / 6 أشهر</p>
                        </div>

                        <ul className="space-y-2 flex-1 mb-6">
                          {plan.features.map((f, fi) => (
                            <li key={fi} className="flex items-start gap-2 text-sm">
                              <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${accentGrad} flex items-center justify-center shrink-0 mt-0.5`}>
                                <Check className="w-2.5 h-2.5 text-white"/>
                              </div>
                              <span className="text-white/55">{f}</span>
                            </li>
                          ))}
                        </ul>

                        <Link href="/prices">
                          <button className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all ${plan.popular ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/20" : "border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white"}`} data-testid={`button-plan-select-home-${plan.tier}`}>
                            عرض التفاصيل <Arrow className="w-4 h-4"/>
                          </button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div {...fadeUp(0.4)} className="mt-8 max-w-5xl mx-auto rounded-2xl border border-white/[0.05] bg-gradient-to-r from-violet-900/10 to-blue-900/10 p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-center md:text-start">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shrink-0 shadow-lg">
                  <Sparkles className="w-5 h-5 text-white"/>
                </div>
                <div>
                  <div className="font-black text-sm text-white">ميزانيتك هي نقطة البداية</div>
                  <div className="text-xs text-white/40 mt-0.5">احكِ للمساعد الذكي عن ميزانيتك — يرتب لك أفضل حل ممكن</div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link href="/start">
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition" data-testid="button-ai-advisor">
                    <Cpu className="w-4 h-4"/> اسأل المساعد
                  </button>
                </Link>
                <Link href="/prices">
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white/60 hover:text-white font-bold text-sm transition" data-testid="button-view-all-plans">
                    كل الباقات <Arrow className="w-4 h-4"/>
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            PROCESS — How we work
        ════════════════════════════════════════════ */}
        <section id="process" className="py-20 md:py-28 bg-[#07070f]">
          <div className="container mx-auto px-5 max-w-6xl">
            <motion.div {...fadeUp(0)} className="text-center mb-16">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/20 mb-3">كيف نعمل</p>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
                من الفكرة{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">للإطلاق</span>
              </h2>
              <p className="text-white/40 text-base max-w-xl mx-auto">
                أربع خطوات بسيطة يعرفها الجميع — بدون تعقيد أو تقنية مزعجة
              </p>
            </motion.div>

            <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {/* Connecting line */}
              <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-violet-600/20 via-blue-500/20 to-emerald-500/20" style={{top:"2.5rem"}}/>

              {PROCESS_STEPS.map((s, i) => (
                <motion.div key={i} {...fadeUp(i * 0.1)} className="relative flex flex-col">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.grad} flex items-center justify-center mb-4 text-white font-black text-lg shadow-lg relative z-10`}>
                    {s.num}
                  </div>
                  <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 flex-1">
                    <div className="font-black text-sm text-white mb-1.5">{s.ar.t}</div>
                    <div className="text-xs text-white/40 leading-relaxed">{s.ar.d}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA after process */}
            <motion.div {...fadeUp(0.4)} className="text-center mt-12">
              <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer">
                <button className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white font-bold text-sm transition" data-testid="button-process-contact">
                  <MessageSquare className="w-4 h-4 text-emerald-400"/>
                  ابدأ محادثة معنا الآن
                </button>
              </a>
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            PARTNERS — Marquee logos
        ════════════════════════════════════════════ */}
        {apiPartners.length > 0 && (
          <section id="partners" className="py-20 md:py-24 bg-[#05050d] border-y border-white/[0.04] overflow-hidden">
            <div className="container mx-auto px-5 max-w-6xl mb-10">
              <motion.div {...fadeUp(0)} className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/20 mb-3">شركاؤنا</p>
                <h2 className="text-2xl md:text-4xl font-black text-white">
                  علامات تثق{" "}
                  <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">بكيروكس</span>
                </h2>
              </motion.div>
            </div>
            <style>{`@keyframes marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }`}</style>
            <Marquee>
              {apiPartners.map((p: any) => (
                <Link key={p.id || p._id} href="/partners">
                  <div className="flex items-center gap-3 px-6 py-3 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05] transition-all group cursor-pointer" data-testid={`logo-partner-${p.id||p._id}`}>
                    <img src={p.logoUrl} alt={p.nameAr||p.name} className="h-8 w-auto object-contain grayscale invert opacity-40 group-hover:opacity-80 group-hover:grayscale-0 transition-all" style={{filter:"brightness(10) grayscale(1)"}}/>
                    <span className="text-xs text-white/30 font-bold group-hover:text-white/60 transition whitespace-nowrap">{p.nameAr||p.name}</span>
                  </div>
                </Link>
              ))}
            </Marquee>
          </section>
        )}

        {/* ════════════════════════════════════════════
            CTA — Final call to action
        ════════════════════════════════════════════ */}
        <section className="py-24 md:py-32 relative overflow-hidden bg-[#07070f]">
          <Orb className="w-[600px] h-[600px] bg-violet-700/15 -top-32 left-1/2 -translate-x-1/2"/>
          <Orb className="w-[400px] h-[400px] bg-blue-700/10 bottom-0 right-0"/>

          <div className="relative container mx-auto px-5 max-w-3xl text-center">
            <motion.div {...fadeUp(0)}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-lg shadow-violet-500/30 mb-8 mx-auto">
                <Rocket className="w-8 h-8 text-white"/>
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-5 leading-tight tracking-tight">
                جاهز تبدأ<br/>
                <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">مشروعك؟</span>
              </h2>
              <p className="text-white/40 mb-10 max-w-xl mx-auto leading-relaxed">
                احكِ لنا فكرتك بكلام بسيط — المساعد الذكي يفهمك ويرتب لك كل شيء، مهما كانت ميزانيتك.
              </p>
              <div className="flex flex-wrap gap-3 justify-center mb-12">
                <Link href="/start">
                  <button className="group flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-black text-sm transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02]" data-testid="button-cta-start">
                    <Sparkles className="w-4 h-4"/>
                    ابدأ فكرتك الخاصة
                    <Arrow className="w-4 h-4"/>
                  </button>
                </Link>
                <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer">
                  <button className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white font-bold text-sm transition" data-testid="button-cta-whatsapp">
                    <SiWhatsapp className="w-4 h-4 text-emerald-400"/>
                    تحدث معنا
                  </button>
                </a>
              </div>

              {/* Social */}
              <div className="flex items-center justify-center gap-5 text-white/20">
                {[
                  { Icon: SiInstagram, href: "https://instagram.com/qirox.sa", id: "instagram" },
                  { Icon: SiX,         href: "https://x.com/qiroxsa",          id: "x" },
                  { Icon: SiLinkedin,  href: "https://www.linkedin.com/company/qirox", id: "linkedin" },
                ].map(({ Icon, href, id }) => (
                  <a key={id} href={href} target="_blank" rel="noreferrer" className="hover:text-white transition-colors p-2 rounded-lg hover:bg-white/[0.05]" data-testid={`link-social-${id}`}>
                    <Icon className="w-4 h-4"/>
                  </a>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer/>
      <InstallPrompt/>
    </div>
  );
}
