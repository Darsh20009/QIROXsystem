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
  ArrowRight, ArrowLeft, ArrowUpRight, Sparkles, Zap, Shield, Cpu,
  Globe2, Layers, Smartphone, ShoppingBag, Building2, GraduationCap,
  Heart, Coffee, Briefcase, Check, MessageSquare, Mail, Database,
  Send, Search, Bot, ChevronRight,
} from "lucide-react";
import { SiWhatsapp, SiInstagram, SiX, SiLinkedin } from "react-icons/si";

/* ─── Constants ───────────────────────────────────────────────── */
const SECTORS = [
  { icon: ShoppingBag,    arName: "متاجر إلكترونية",  enName: "E-Commerce" },
  { icon: Coffee,         arName: "مطاعم ومقاهي",    enName: "Restaurants & Cafes" },
  { icon: GraduationCap,  arName: "منصات تعليمية",   enName: "Education Platforms" },
  { icon: Building2,      arName: "شركات ومؤسسات",  enName: "Corporate" },
  { icon: Heart,          arName: "صحة وعيادات",     enName: "Healthcare" },
  { icon: Briefcase,      arName: "خدمات احترافية",  enName: "Professional Services" },
];

const PILLARS = [
  { icon: Zap,      ar: { t: "سرعة فائقة",       d: "نسلّم في أيام، لا أشهر" },         en: { t: "Lightning Fast",  d: "Delivered in days, not months" } },
  { icon: Shield,   ar: { t: "أمان مؤسسي",       d: "بنية تحتية محصّنة وحماية كاملة" },  en: { t: "Enterprise Grade", d: "Hardened infra & full security" } },
  { icon: Cpu,      ar: { t: "ذكاء اصطناعي",     d: "QIROX AI ينفّذ مهامك فعلياً" },     en: { t: "AI-Native",       d: "QIROX AI actually executes your work" } },
  { icon: Sparkles, ar: { t: "تجربة لا تُضاهى", d: "تصميم نظيف يخدم أعمالك" },          en: { t: "Unmatched UX",    d: "Clean design that serves your business" } },
];

const PRICING_HIGHLIGHTS = [
  { icon: Mail,         ar: "بريد رسمي", en: "Branded Email",     priceAr: "600 / سنة",    priceEn: "600 / yr",      noteAr: "5 صناديق + إدارة من النظام", noteEn: "5 mailboxes + in-app mgmt" },
  { icon: Database,     ar: "قاعدة بيانات", en: "Database",       priceAr: "300 / شهر",    priceEn: "300 / mo",      noteAr: "10GB MongoDB أو PostgreSQL",   noteEn: "10GB MongoDB or PostgreSQL" },
  { icon: MessageSquare,ar: "رسائل SMS", en: "SMS",                priceAr: "300 / شهر",    priceEn: "300 / mo",      noteAr: "1500 رسالة شهرياً",           noteEn: "1,500 messages / month" },
  { icon: Send,         ar: "إرسال بريد", en: "Email Sending",     priceAr: "100 / شهر",    priceEn: "100 / mo",      noteAr: "1000 رسالة شهرياً",           noteEn: "1,000 messages / month" },
  { icon: Search,       ar: "تحسين SEO", en: "SEO Boost",          priceAr: "300 / شهر",    priceEn: "300 / mo",      noteAr: "تحسين كامل لمحركات البحث",   noteEn: "Full search engine optimization" },
  { icon: Bot,          ar: "ذكاء اصطناعي", en: "AI Add-On",      priceAr: "من 150",       priceEn: "from 150",      noteAr: "3 فئات: A1 / A2 / A3",        noteEn: "3 tiers: A1 / A2 / A3" },
];

const TABS = [
  { id: "systems",  ar: "الأنظمة",   en: "Systems" },
  { id: "pricing",  ar: "الأسعار",   en: "Pricing" },
  { id: "process",  ar: "كيف نعمل",  en: "How We Work" },
  { id: "partners", ar: "شركاؤنا",   en: "Partners" },
];

const PROCESS_STEPS = [
  { ar: { t: "احكِ لنا فكرتك",   d: "تواصل عبر الموقع أو واتساب — QIROX AI يستوعب احتياجك في دقائق" }, en: { t: "Tell us your idea",   d: "Reach out — QIROX AI captures your needs in minutes" } },
  { ar: { t: "اختر الباقة",      d: "أسعار شفافة ومفصّلة بدون مفاجآت" },                                en: { t: "Pick a plan",         d: "Transparent prices, no surprises" } },
  { ar: { t: "نبني ونسلّم",      d: "فريق تقني + ذكاء اصطناعي يبني نظامك بسرعة قياسية" },                en: { t: "We build & ship",     d: "Tech team + AI deliver at record speed" } },
  { ar: { t: "ندعمك للأبد",      d: "صيانة، تحديثات، ودعم فعّال 24/7" },                                en: { t: "We support forever",  d: "Maintenance, updates, real 24/7 support" } },
];

const fade = (i = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as any },
});

/* ─── Page ────────────────────────────────────────────────────── */
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

      {/* ═══ HERO ═══ */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
        {/* subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.05] dark:opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="container mx-auto px-5 md:px-8 max-w-6xl relative">
          <motion.div {...fade(0)} className="flex flex-col items-center text-center">
            <img src={qiroxLogo} alt="QIROX" className="h-14 md:h-16 w-auto mb-6 dark:invert" />
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/15 dark:border-white/15 text-[11px] font-bold tracking-wide uppercase mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white animate-pulse" />
              {ar ? "QIROX Studio · شريكك التقني" : "QIROX Studio · Your tech partner"}
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6 max-w-4xl">
              {ar ? "نحوّل الأفكار" : "We turn ideas"}
              <br />
              <span className="text-black/40 dark:text-white/40">{ar ? "إلى تقنية حقيقية" : "into real technology"}</span>
            </h1>
            <p className="text-base md:text-lg text-black/60 dark:text-white/60 max-w-2xl mb-10 leading-relaxed">
              {ar
                ? "التقنية بقت سهلة. نحوّل أي فكرة إلى موقع أو نظام احترافي بمميزات لا توجد في السوق وبأسعار شفافة."
                : "Tech is simple now. We turn any idea into a professional site or system with features unmatched in the market — and transparent pricing."}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/cart">
                <Button size="lg" className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 rounded-xl h-12 px-6 font-bold gap-2" data-testid="button-hero-start">
                  {ar ? "ابدأ مشروعك" : "Start your project"}
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
          </motion.div>

          {/* Pillars row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-16 md:mt-20">
            {PILLARS.map((p, i) => (
              <motion.div key={i} {...fade(i)} className="rounded-2xl border border-black/10 dark:border-white/10 p-5 bg-black/[0.02] dark:bg-white/[0.03]">
                <div className="w-10 h-10 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mb-3">
                  <p.icon className="w-5 h-5" />
                </div>
                <div className="font-bold text-sm md:text-base mb-1">{ar ? p.ar.t : p.en.t}</div>
                <div className="text-xs md:text-sm text-black/55 dark:text-white/55">{ar ? p.ar.d : p.en.d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TABS ═══ */}
      <section className="border-y border-black/10 dark:border-white/10 sticky top-16 z-30 bg-white/90 dark:bg-black/90 backdrop-blur">
        <div className="container mx-auto px-5 md:px-8 max-w-6xl">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar -mx-2 px-2 py-2">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id);
                    document.getElementById(`tab-${t.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`shrink-0 px-4 md:px-5 h-10 rounded-full text-sm font-bold transition-all ${
                    active
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "text-black/60 dark:text-white/60 hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
                  }`}
                  data-testid={`tab-${t.id}`}
                >
                  {ar ? t.ar : t.en}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ SYSTEMS ═══ */}
      <section id="tab-systems" className="py-20 md:py-24">
        <div className="container mx-auto px-5 md:px-8 max-w-6xl">
          <motion.div {...fade(0)} className="mb-12 text-center">
            <h2 className="text-3xl md:text-5xl font-black mb-4">{ar ? "تعرّف على الأنظمة" : "Meet the systems"}</h2>
            <p className="text-black/55 dark:text-white/55 max-w-2xl mx-auto">
              {ar ? "جاهزة، قابلة للتخصيص، ومبنية لتلائم نشاطك من اليوم الأول." : "Ready, customizable, and built to fit your business from day one."}
            </p>
          </motion.div>

          {/* Sector chips */}
          <motion.div {...fade(1)} className="flex flex-wrap justify-center gap-2 md:gap-3 mb-12">
            {SECTORS.map((s, i) => (
              <div key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 dark:border-white/10 text-xs md:text-sm font-medium">
                <s.icon className="w-3.5 h-3.5" />
                {ar ? s.arName : s.enName}
              </div>
            ))}
          </motion.div>

          {/* Templates grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {visibleTemplates.length === 0
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] animate-pulse" />
                ))
              : visibleTemplates.map((tpl: any, i: number) => (
                  <motion.div key={tpl._id || tpl.id || i} {...fade(i)}>
                    <Link href={`/templates/${tpl.slug || tpl._id}`}>
                      <div
                        className="group aspect-[4/5] rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] overflow-hidden cursor-pointer hover-elevate active-elevate-2"
                        data-testid={`card-template-${tpl._id || i}`}
                      >
                        <div className="h-3/4 bg-gradient-to-br from-black/[0.04] to-black/[0.08] dark:from-white/[0.04] dark:to-white/[0.1] flex items-center justify-center overflow-hidden">
                          {tpl.coverImage ? (
                            <img src={tpl.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <Layers className="w-10 h-10 text-black/20 dark:text-white/20" />
                          )}
                        </div>
                        <div className="p-3 md:p-4">
                          <div className="font-bold text-sm truncate">{ar ? tpl.nameAr || tpl.name : tpl.name}</div>
                          <div className="text-[11px] text-black/45 dark:text-white/45 mt-0.5 truncate">{tpl.category || tpl.sector || ""}</div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/systems">
              <Button variant="outline" className="border-black/15 dark:border-white/15 rounded-xl h-11 px-6 font-bold gap-2" data-testid="button-view-all-systems">
                {ar ? "عرض كل الأنظمة" : "View all systems"}
                <Arrow className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="tab-pricing" className="py-20 md:py-24 bg-black/[0.02] dark:bg-white/[0.02] border-y border-black/10 dark:border-white/10">
        <div className="container mx-auto px-5 md:px-8 max-w-6xl">
          <motion.div {...fade(0)} className="mb-12 text-center">
            <h2 className="text-3xl md:text-5xl font-black mb-4">{ar ? "أسعار شفافة" : "Transparent pricing"}</h2>
            <p className="text-black/55 dark:text-white/55 max-w-2xl mx-auto">
              {ar ? "كتالوج رسمي، بدون مفاجآت. أنت تختار ما تحتاج، نحن ننفّذ." : "Official catalog, zero surprises. You pick, we deliver."}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {PRICING_HIGHLIGHTS.map((p, i) => (
              <motion.div key={i} {...fade(i)}
                className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-black p-5 hover-elevate"
                data-testid={`card-addon-${i}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl border border-black/15 dark:border-white/15 flex items-center justify-center">
                    <p.icon className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline gap-1 justify-end">
                      <span className="font-black text-lg">{ar ? p.priceAr : p.priceEn}</span>
                      <SARIcon className="w-3.5 h-3.5 text-black/45 dark:text-white/45" />
                    </div>
                  </div>
                </div>
                <div className="font-bold text-base mb-1">{ar ? p.ar : p.en}</div>
                <div className="text-xs text-black/50 dark:text-white/50">{ar ? p.noteAr : p.noteEn}</div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/prices">
              <Button className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 rounded-xl h-12 px-6 font-bold gap-2" data-testid="button-view-pricing">
                {ar ? "عرض كل الباقات والإضافات" : "See all plans & add-ons"}
                <Arrow className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ PROCESS ═══ */}
      <section id="tab-process" className="py-20 md:py-24">
        <div className="container mx-auto px-5 md:px-8 max-w-6xl">
          <motion.div {...fade(0)} className="mb-12 text-center">
            <h2 className="text-3xl md:text-5xl font-black mb-4">{ar ? "كيف نعمل" : "How we work"}</h2>
            <p className="text-black/55 dark:text-white/55 max-w-2xl mx-auto">
              {ar ? "أربع خطوات بسيطة من الفكرة إلى الإطلاق." : "Four simple steps from idea to launch."}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {PROCESS_STEPS.map((s, i) => (
              <motion.div key={i} {...fade(i)}
                className="rounded-2xl border border-black/10 dark:border-white/10 p-6 bg-black/[0.02] dark:bg-white/[0.03] relative"
              >
                <div className="absolute top-4 right-4 text-5xl font-black text-black/[0.06] dark:text-white/[0.06] leading-none">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="w-9 h-9 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mb-4 font-black text-sm">
                  {i + 1}
                </div>
                <div className="font-bold text-base mb-2">{ar ? s.ar.t : s.en.t}</div>
                <div className="text-xs md:text-sm text-black/55 dark:text-white/55">{ar ? s.ar.d : s.en.d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PARTNERS ═══ */}
      <section id="tab-partners" className="py-20 md:py-24 border-t border-black/10 dark:border-white/10">
        <div className="container mx-auto px-5 md:px-8 max-w-6xl">
          <motion.div {...fade(0)} className="mb-10 text-center">
            <h2 className="text-2xl md:text-4xl font-black mb-3">{ar ? "شركاء يثقون بنا" : "Partners who trust us"}</h2>
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

      {/* ═══ CTA ═══ */}
      <section className="py-20 md:py-28 bg-black text-white dark:bg-white dark:text-black">
        <div className="container mx-auto px-5 md:px-8 max-w-4xl text-center">
          <motion.div {...fade(0)}>
            <img src={qiroxLogo} alt="QIROX" className="h-12 w-auto mx-auto mb-6 invert dark:invert-0" />
            <h2 className="text-3xl md:text-5xl font-black mb-5 leading-tight">
              {ar ? "جاهز تبدأ؟" : "Ready to start?"}
            </h2>
            <p className="text-white/60 dark:text-black/60 mb-10 max-w-xl mx-auto">
              {ar
                ? "احكِ لنا فكرتك — QIROX AI يساعدك تختار الباقة الأنسب وفريقنا يبدأ التنفيذ فوراً."
                : "Tell us your idea — QIROX AI helps you pick the right plan and our team starts immediately."}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/cart">
                <Button size="lg" className="bg-white text-black hover:bg-white/90 dark:bg-black dark:text-white dark:hover:bg-black/90 rounded-xl h-12 px-6 font-bold gap-2" data-testid="button-cta-start">
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

            {/* Social */}
            <div className="flex items-center justify-center gap-4 mt-12 text-white/50 dark:text-black/50">
              <a href="https://instagram.com/qirox.sa" target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-white dark:hover:text-black transition" data-testid="link-social-instagram"><SiInstagram className="w-5 h-5" /></a>
              <a href="https://x.com/qiroxsa" target="_blank" rel="noreferrer" aria-label="X" className="hover:text-white dark:hover:text-black transition" data-testid="link-social-x"><SiX className="w-5 h-5" /></a>
              <a href="https://www.linkedin.com/company/qirox" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:text-white dark:hover:text-black transition" data-testid="link-social-linkedin"><SiLinkedin className="w-5 h-5" /></a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <InstallPrompt />
    </div>
  );
}
