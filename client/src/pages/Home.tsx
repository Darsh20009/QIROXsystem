import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";
import SARIcon from "@/components/SARIcon";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useTemplates } from "@/hooks/use-templates";
import type { Partner } from "@shared/schema";
import qiroxLogo from "@assets/qirox_without_background_1771716363944.png";
import {
  ArrowRight, ArrowLeft, Sparkles, Zap, Shield, Cpu,
  Layers, ShoppingBag, Building2, GraduationCap,
  Heart, Coffee, Briefcase, MessageSquare, Mail, Database,
  Send, Search, Bot,
} from "lucide-react";
import { SiWhatsapp, SiInstagram, SiX, SiLinkedin } from "react-icons/si";

const SECTORS = [
  { icon: ShoppingBag,    arName: "متاجر إلكترونية",  enName: "E-Commerce" },
  { icon: Coffee,         arName: "مطاعم ومقاهي",    enName: "Restaurants" },
  { icon: GraduationCap,  arName: "منصات تعليمية",   enName: "Education" },
  { icon: Building2,      arName: "شركات ومؤسسات",  enName: "Corporate" },
  { icon: Heart,          arName: "صحة وعيادات",     enName: "Healthcare" },
  { icon: Briefcase,      arName: "خدمات احترافية",  enName: "Services" },
];

const PILLARS = [
  { icon: Zap,      ar: { t: "سريع",         d: "نسلّم في أيام، لا أشهر" },         en: { t: "Fast",       d: "Days, not months" } },
  { icon: Shield,   ar: { t: "آمن",          d: "حماية كاملة لبياناتك" },           en: { t: "Secure",     d: "Full data protection" } },
  { icon: Cpu,      ar: { t: "ذكي",          d: "مساعد ذكي ينفّذ معك" },             en: { t: "Smart",      d: "AI helps you build" } },
  { icon: Sparkles, ar: { t: "بسيط",         d: "سهل حتى لو ما عندك خبرة تقنية" },   en: { t: "Simple",     d: "Easy, even without tech skills" } },
];

const PRICING_HIGHLIGHTS = [
  { icon: Mail,         ar: "بريد رسمي",   en: "Branded Email", priceAr: "600",  priceEn: "600",  perAr: "/سنة", perEn: "/yr", noteAr: "5 صناديق + إدارة كاملة من النظام", noteEn: "5 mailboxes + full in-app management" },
  { icon: Database,     ar: "قاعدة بيانات", en: "Database",     priceAr: "300",  priceEn: "300",  perAr: "/شهر", perEn: "/mo", noteAr: "10GB MongoDB أو PostgreSQL",        noteEn: "10GB MongoDB or PostgreSQL" },
  { icon: MessageSquare,ar: "رسائل SMS",   en: "SMS",           priceAr: "300",  priceEn: "300",  perAr: "/شهر", perEn: "/mo", noteAr: "1500 رسالة شهرياً",                noteEn: "1,500 messages / month" },
  { icon: Send,         ar: "إرسال بريد",  en: "Email Sending", priceAr: "100",  priceEn: "100",  perAr: "/شهر", perEn: "/mo", noteAr: "1000 رسالة شهرياً",                noteEn: "1,000 messages / month" },
  { icon: Search,       ar: "تحسين SEO",  en: "SEO Boost",      priceAr: "300",  priceEn: "300",  perAr: "/شهر", perEn: "/mo", noteAr: "تحسين كامل لمحركات البحث",        noteEn: "Full search engine optimization" },
  { icon: Bot,          ar: "ذكاء اصطناعي", en: "AI Add-On",    priceAr: "150",  priceEn: "150",  perAr: "+", perEn: "+",      noteAr: "3 فئات: A1 / A2 / A3",             noteEn: "3 tiers: A1 / A2 / A3" },
];

const TABS = [
  { id: "systems",  ar: "الأنظمة",   en: "Systems" },
  { id: "pricing",  ar: "الأسعار",   en: "Pricing" },
  { id: "process",  ar: "كيف نعمل",  en: "How We Work" },
  { id: "partners", ar: "شركاؤنا",   en: "Partners" },
];

const PROCESS_STEPS = [
  { ar: { t: "احكِ لنا فكرتك",   d: "تواصل معنا أو احكِ للمساعد الذكي بكلام بسيط — يفهم احتياجك خلال دقائق" }, en: { t: "Tell us your idea",   d: "Reach out or chat with our AI — it gets your need in minutes" } },
  { ar: { t: "اختر الباقة",      d: "أسعار واضحة بالكامل، اختر اللي يناسب ميزانيتك" },                          en: { t: "Pick a plan",         d: "Crystal-clear prices — pick what fits your budget" } },
  { ar: { t: "نبني ونسلّم",      d: "فريقنا يبني نظامك بسرعة عالية وجودة احترافية" },                            en: { t: "We build & ship",     d: "Our team delivers fast with pro quality" } },
  { ar: { t: "ندعمك دائماً",     d: "صيانة، تحديثات، ودعم متاح وقت ما تحتاج" },                                  en: { t: "We support you",      d: "Maintenance, updates, support whenever you need" } },
];

const fade = (i = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.55, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] as any },
});

export default function Home() {
  const { lang, dir } = useI18n();
  const ar = lang === "ar";
  const [tab, setTab] = useState<typeof TABS[number]["id"]>("systems");

  const { data: templates = [] } = useTemplates();
  const { data: apiPartners = [] } = useQuery<Partner[]>({ queryKey: ["/api/partners"] });

  const Arrow = ar ? ArrowLeft : ArrowRight;

  const visibleTemplates = useMemo(
    () => (templates as any[]).filter((t) => t?.status !== "draft").slice(0, 8),
    [templates]
  );

  return (
    <div className="min-h-screen flex flex-col bg-white text-black dark:bg-black dark:text-white" dir={dir}>
      <Navigation />

      {/* ═══════════════════════════════════════════════════════
          ONE CONTINUOUS CANVAS — no alternating background blocks.
          Sections flow into each other with soft spacing only.
          ═══════════════════════════════════════════════════════ */}
      <main className="flex-1">
        {/* Soft global texture (very subtle dot grid in hero only) */}

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
                  ? "ما تحتاج تكون تقني — احكِ لنا اللي تبيه بكلام عادي، وفريقنا والمساعد الذكي يبنونه لك بأسعار واضحة وبدون مفاجآت."
                  : "No tech skills required — describe what you need in plain words, and our team plus AI build it for you with clear, no-surprise pricing."}
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/start">
                  <Button size="lg" className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 rounded-xl h-12 px-6 font-bold gap-2" data-testid="button-hero-start">
                    <Sparkles className="w-4 h-4" />
                    {ar ? "ابدأ بمحادثة بسيطة" : "Start with a simple chat"}
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
              <Link href="/cart" className="mt-4 text-xs text-black/45 dark:text-white/45 hover:text-black dark:hover:text-white transition" data-testid="link-hero-manual">
                {ar ? "أو تصفح الباقات بنفسك" : "or browse plans on your own"}
              </Link>
            </motion.div>

            {/* Pillars row — soft, no hard borders */}
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

        {/* ─── TAB BAR — pill chips floating, no hard divider lines ─── */}
        <div className="sticky top-16 z-30 -mt-4 mb-2">
          <div className="container mx-auto px-5 md:px-8 max-w-6xl">
            <div className="mx-auto inline-flex items-center gap-1 p-1.5 rounded-full bg-white/85 dark:bg-black/85 backdrop-blur-md border border-black/10 dark:border-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]">
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
                      active
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "text-black/55 dark:text-white/55 hover:text-black dark:hover:text-white"
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

            {/* Sector chips */}
            <motion.div {...fade(1)} className="flex flex-wrap justify-center gap-2 md:gap-2.5 mb-14">
              {SECTORS.map((s, i) => (
                <div key={i} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-xs font-medium">
                  <s.icon className="w-3.5 h-3.5" />
                  {ar ? s.arName : s.enName}
                </div>
              ))}
            </motion.div>

            {/* Templates grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {visibleTemplates.length === 0
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-[4/5] rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] animate-pulse" />
                  ))
                : visibleTemplates.map((tpl: any, i: number) => (
                    <motion.div key={tpl._id || tpl.id || i} {...fade(i)}>
                      <Link href={`/templates/${tpl.slug || tpl._id}`}>
                        <div
                          className="group aspect-[4/5] rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] overflow-hidden cursor-pointer hover-elevate active-elevate-2 transition-all"
                          data-testid={`card-template-${tpl._id || i}`}
                        >
                          <div className="h-3/4 flex items-center justify-center overflow-hidden bg-gradient-to-br from-black/[0.02] to-black/[0.06] dark:from-white/[0.03] dark:to-white/[0.08]">
                            {tpl.coverImage ? (
                              <img src={tpl.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <Layers className="w-10 h-10 text-black/20 dark:text-white/20" />
                            )}
                          </div>
                          <div className="p-3.5 md:p-4">
                            <div className="font-bold text-sm truncate">{ar ? tpl.nameAr || tpl.name : tpl.name}</div>
                            <div className="text-[11px] text-black/45 dark:text-white/45 mt-0.5 truncate">{tpl.category || tpl.sector || ""}</div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
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
        <section id="tab-pricing" className="pt-16 pb-24 md:pt-20 md:pb-28">
          <div className="container mx-auto px-5 md:px-8 max-w-6xl">
            <motion.div {...fade(0)} className="mb-12 text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">{ar ? "أسعار واضحة، بدون مفاجآت" : "Clear pricing, zero surprises"}</h2>
              <p className="text-black/55 dark:text-white/55 text-base leading-relaxed">
                {ar ? "كل خدمة بسعرها المعلن. تدفع فقط على اللي تحتاجه." : "Every service at its published price. Pay only for what you need."}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 max-w-5xl mx-auto">
              {PRICING_HIGHLIGHTS.map((p, i) => (
                <motion.div key={i} {...fade(i)}
                  className="rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] p-5 md:p-6 hover-elevate transition-all"
                  data-testid={`card-addon-${i}`}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center">
                      <p.icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-black text-xl md:text-2xl tracking-tight">{ar ? p.priceAr : p.priceEn}</span>
                      <SARIcon className="w-3.5 h-3.5 text-black/45 dark:text-white/45" />
                      <span className="text-[11px] text-black/45 dark:text-white/45 font-medium">{ar ? p.perAr : p.perEn}</span>
                    </div>
                  </div>
                  <div className="font-bold text-base md:text-lg mb-1.5">{ar ? p.ar : p.en}</div>
                  <div className="text-xs md:text-sm text-black/55 dark:text-white/55 leading-relaxed">{ar ? p.noteAr : p.noteEn}</div>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/prices">
                <Button className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 rounded-xl h-12 px-6 font-bold gap-2" data-testid="button-view-pricing">
                  {ar ? "عرض كل الباقات والإضافات" : "See all plans & add-ons"}
                  <Arrow className="w-4 h-4" />
                </Button>
              </Link>
            </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-5xl mx-auto">
              {PROCESS_STEPS.map((s, i) => (
                <motion.div key={i} {...fade(i)} className="relative">
                  <div className="text-6xl md:text-7xl font-black text-black/[0.07] dark:text-white/[0.08] leading-none mb-3 select-none">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="font-bold text-base md:text-lg mb-2">{ar ? s.ar.t : s.en.t}</div>
                  <div className="text-sm text-black/55 dark:text-white/55 leading-relaxed">{ar ? s.ar.d : s.en.d}</div>
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

            {apiPartners.length === 0 ? (
              <div className="text-center text-black/30 dark:text-white/30 text-sm py-8">
                {ar ? "قريباً" : "Coming soon"}
              </div>
            ) : (
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
                {apiPartners.map((p: any) => (
                  <div
                    key={p.id || p._id}
                    className="grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                    data-testid={`logo-partner-${p.id || p._id}`}
                  >
                    {p.websiteUrl ? (
                      <a href={p.websiteUrl} target="_blank" rel="noreferrer" title={ar ? (p.nameAr || p.name) : (p.name || p.nameAr)}>
                        <img src={p.logoUrl} alt={p.name} className="h-12 md:h-14 w-auto object-contain max-w-[140px]" />
                      </a>
                    ) : (
                      <img src={p.logoUrl} alt={p.name} className="h-12 md:h-14 w-auto object-contain max-w-[140px]" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ─── CTA — only colored block, but transitions softly via gradient bridge ─── */}
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
                  ? "احكِ لنا فكرتك بكلام بسيط — المساعد الذكي يفهمك ويرتب لك كل شيء."
                  : "Describe your idea in plain words — our AI gets you and arranges everything."}
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/start">
                  <Button size="lg" className="bg-white text-black hover:bg-white/90 dark:bg-black dark:text-white dark:hover:bg-black/90 rounded-xl h-12 px-6 font-bold gap-2" data-testid="button-cta-start">
                    <Sparkles className="w-4 h-4" />
                    {ar ? "ابدأ الآن" : "Get started"}
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
