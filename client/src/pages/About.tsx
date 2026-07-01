import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useTemplates } from "@/hooks/use-templates";
import { AboutHeroVisual } from "@/components/MarketingVisual";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useSEO } from "@/hooks/use-seo";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Code2, Layers, Globe, Cpu, GitBranch, TrendingUp,
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Building2, Rocket, Award, Shield, Database, Info, Zap, Users,
  Smartphone, Monitor, Tablet, ExternalLink, Handshake, CheckCircle2, Apple, Download
} from "lucide-react";
const sectorIcons: Record<string, any> = {
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Globe
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
  })
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

export default function About() {
  const { data: templates } = useTemplates();
  const { t, lang, dir } = useI18n();

  useSEO({
    title: lang === "ar" ? "من نحن — كيروكس استوديو | شركة برمجة سعودية في الرياض" : "About Us — Qirox Studio | Saudi Software Company",
    description: lang === "ar"
      ? "كيروكس استوديو — شركة برمجة سعودية تأسست في الرياض. نبني مواقع وتطبيقات وأنظمة رقمية احترافية. فريق من أفضل المطورين السعوديين بخبرة 4+ سنوات."
      : "Qirox Studio — Saudi software company based in Riyadh. We build professional websites, apps, and digital systems. A team of top Saudi developers with 4+ years experience.",
    keywords: "كيروكس استوديو, من نحن, شركة برمجة سعودية, مطورين سعوديين, Qirox Studio about, software company Riyadh, فريق كيروكس",
    canonical: "/about",
  });

  const { data: partners = [] } = useQuery<any[]>({
    queryKey: ["/api/partners"],
  });

  const { data: appDownloads } = useQuery<any>({
    queryKey: ["/api/app-downloads"],
  });

  const features = [
    {
      icon: Layers,
      title: { ar: "معمارية وحدوية", en: "Modular Architecture" },
      desc: { ar: "كل نظام مبني على Core + Modules. إضافة ميزة جديدة بدون كسر البنية.", en: "Every system is built on Core + Modules. Add new features without breaking the structure." }
    },
    {
      icon: GitBranch,
      title: { ar: "تحديث مركزي", en: "Central Updates" },
      desc: { ar: "تحديث كل المواقع التي تستخدم نفس الموديول بضغطة زر.", en: "Update all sites using the same module with a single click." }
    },
    {
      icon: Shield,
      title: { ar: "حماية متكاملة", en: "Comprehensive Security" },
      desc: { ar: "JWT + Role-based access + تشفير البيانات الحساسة.", en: "JWT + Role-based access + encryption of sensitive data." }
    },
    {
      icon: Database,
      title: { ar: "قاعدة بيانات مستقلة", en: "Independent Database" },
      desc: { ar: "كل عميل يحصل على MongoDB Atlas مستقلة وآمنة.", en: "Each client gets their own secure, isolated MongoDB Atlas instance." }
    },
    {
      icon: Code2,
      title: { ar: "تصدير مشروع كامل", en: "Full Project Export" },
      desc: { ar: "ZIP جاهز للنشر مع .env و README و database seed.", en: "Deploy-ready ZIP with .env, README, and database seed." }
    },
    {
      icon: TrendingUp,
      title: { ar: "نمو مستمر", en: "Continuous Growth" },
      desc: { ar: "العميل يطلب ميزة → تضيف Module → إيراد مستدام.", en: "Client requests a feature → you add a Module → sustainable revenue." }
    },
  ];

  const businessModel = [
    {
      icon: Building2,
      title: { ar: "إنشاء مشاريع", en: "Project Creation" },
      desc: { ar: "رسوم إنشاء لكل عميل جديد يختار نظامه", en: "Setup fee for each new client choosing their system" }
    },
    {
      icon: Rocket,
      title: { ar: "اشتراكات شهرية", en: "Monthly Subscriptions" },
      desc: { ar: "صيانة ودعم فني وتحديثات مستمرة", en: "Maintenance, technical support, and continuous updates" }
    },
    {
      icon: Award,
      title: { ar: "إضافات Premium", en: "Premium Add-ons" },
      desc: { ar: "SEO, CRM, Payment Gateway, والمزيد", en: "SEO, CRM, Payment Gateway, and more" }
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950" dir={dir}>
      <Navigation />

      {/* Hero */}
      <section className="relative overflow-hidden bg-black">
        <div className="absolute inset-0 pointer-events-none opacity-[0.055]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-950 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10 pt-24 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.1] bg-white/[0.05] mb-6">
                <span className="w-2 h-2 rounded-full bg-white/40 animate-pulse" />
                <span className="text-white/45 text-xs tracking-wider uppercase">{t("about.badge")}</span>
              </motion.div>
              <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-black font-heading text-white leading-[1.08] mb-6 tracking-tight">
                {t("about.hero.title1")}
                <br />
                <span className="text-white/30">{t("about.hero.title2")}</span>
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} className="text-base text-white/40 leading-relaxed max-w-md">
                {t("about.hero.subtitle")}
              </motion.p>
            </motion.div>
            <AboutHeroVisual lang={lang} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-28 bg-[#fafafa] dark:bg-gray-900/30 relative">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <div className="text-center mb-16">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 mb-6">
                <Zap className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
                <span className="text-black/40 dark:text-white/40 text-xs tracking-wider uppercase">{t("about.features.badge")}</span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold font-heading text-black dark:text-white mb-4">
                {t("about.features.title")} <span className="text-gray-400 dark:text-gray-500">{t("about.features.titleHighlight")}</span>
              </motion.h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {features.map((item, idx) => (
                <motion.div key={idx} variants={fadeUp} custom={idx}>
                  <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] p-7 rounded-2xl h-full group hover:shadow-lg hover:shadow-black/[0.04] dark:hover:shadow-black/[0.2] transition-all">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-black/[0.04] dark:bg-white/[0.04]">
                      <item.icon className="w-5 h-5 text-black/40 dark:text-white/40" />
                    </div>
                    <h3 className="text-base font-bold font-heading text-black dark:text-white mb-3">{item.title[lang]}</h3>
                    <p className="text-sm text-black/40 dark:text-white/40 leading-relaxed">{item.desc[lang]}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sectors */}
      <section className="py-28 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] mb-6">
              <Globe className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
              <span className="text-black/40 dark:text-white/40 text-xs tracking-wider uppercase">{t("about.sectors.badge")}</span>
            </div>
            <h2 className="text-3xl font-bold font-heading text-black dark:text-white mb-4">{t("about.sectors.title")}</h2>
            <p className="text-black/35 dark:text-white/35">{templates?.length || 8} {t("about.systems.count")}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {templates?.map((tmpl, idx) => {
              const Icon = sectorIcons[tmpl.icon || "Globe"] || Globe;
              return (
                <motion.div
                  key={tmpl.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={idx}
                >
                  <div className="border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 text-center p-6 rounded-2xl group hover:shadow-lg hover:shadow-black/[0.04] dark:hover:shadow-black/[0.2] transition-all" data-testid={`about-sector-${tmpl.slug}`}>
                    <div className="w-12 h-12 mx-auto rounded-xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-black/35 dark:text-white/35" />
                    </div>
                    <h3 className="font-bold text-sm text-black dark:text-white mb-1">{lang === "ar" ? tmpl.nameAr : tmpl.name}</h3>
                    <p className="text-[10px] text-black/25 dark:text-white/25">{tmpl.category}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Partners */}
      {partners.length > 0 && (
        <section className="py-28 bg-[#fafafa] dark:bg-gray-900/30 relative">
          <div className="container mx-auto px-4">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              <div className="text-center mb-16">
                <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 mb-6">
                  <Handshake className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
                  <span className="text-black/40 dark:text-white/40 text-xs tracking-wider uppercase">PARTNERS</span>
                </motion.div>
                <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold font-heading text-black dark:text-white mb-4">
                  {lang === "ar" ? "شركاؤنا" : "Our"} <span className="text-gray-400 dark:text-gray-500">{lang === "ar" ? "المميزون" : "Partners"}</span>
                </motion.h2>
                <motion.p variants={fadeUp} custom={2} className="text-black/35 dark:text-white/35 text-sm max-w-xl mx-auto">
                  {lang === "ar" ? "نفخر بشراكتنا مع أبرز الجهات في المنطقة" : "We're proud to partner with leading organizations in the region"}
                </motion.p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                {partners.map((partner: any, idx: number) => (
                  <motion.div key={partner._id || idx} variants={fadeUp} custom={idx}>
                    <a
                      href={partner.websiteUrl || "#"}
                      target={partner.websiteUrl ? "_blank" : "_self"}
                      rel="noopener noreferrer"
                      className="block"
                      data-testid={`card-partner-${idx}`}
                    >
                      <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] p-6 rounded-2xl text-center group hover:shadow-lg hover:shadow-black/[0.04] dark:hover:shadow-black/[0.2] transition-all h-full">
                        <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden bg-black/[0.03] dark:bg-white/[0.03] flex items-center justify-center mb-4 border border-black/[0.05] dark:border-white/[0.05]">
                          {partner.logoUrl ? (
                            <img src={partner.logoUrl} alt={partner.name} className="w-full h-full object-contain p-1" />
                          ) : (
                            <Building2 className="w-7 h-7 text-black/20 dark:text-white/20" />
                          )}
                        </div>
                        <h3 className="font-bold text-sm text-black dark:text-white mb-1 truncate">{lang === "ar" ? (partner.nameAr || partner.name) : (partner.name || partner.nameAr)}</h3>
                        {partner.category && <p className="text-[10px] text-black/30 dark:text-white/30">{partner.category}</p>}
                        {partner.websiteUrl && (
                          <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-black/25 dark:text-white/25 group-hover:text-black/50 dark:group-hover:text-white/50 transition-colors">
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span>{lang === "ar" ? "زيارة الموقع" : "Visit site"}</span>
                          </div>
                        )}
                      </div>
                    </a>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Compatible Platforms & Devices */}
      <section className="py-28 relative">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <div className="text-center mb-16">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] mb-6">
                <Smartphone className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
                <span className="text-black/40 dark:text-white/40 text-xs tracking-wider uppercase">COMPATIBLE</span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold font-heading text-black dark:text-white mb-4">
                {lang === "ar" ? "الأجهزة" : "Compatible"} <span className="text-gray-400 dark:text-gray-500">{lang === "ar" ? "المتوافقة" : "Devices"}</span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-black/35 dark:text-white/35 text-sm max-w-xl mx-auto">
                {lang === "ar" ? "متاح على جميع المنصات والأجهزة الرئيسية" : "Available on all major platforms and devices"}
              </motion.p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
              {[
                {
                  key: "android",
                  icon: Smartphone,
                  iconBg: "bg-black dark:bg-white",
                  iconColor: "text-white dark:text-black",
                  title: { ar: "أندرويد", en: "Android" },
                  desc: { ar: "Google Play — جميع أجهزة أندرويد", en: "Google Play — All Android devices" },
                  url: appDownloads?.playStore?.enabled ? appDownloads.playStore.url : null,
                  badge: { ar: "متوفر", en: "Available" },
                  badgeStyle: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
                  enabled: appDownloads?.playStore?.enabled ?? true,
                  version: "Android 7.0+",
                },
                {
                  key: "ios",
                  icon: Apple,
                  iconBg: "bg-black dark:bg-white",
                  iconColor: "text-white dark:text-black",
                  title: { ar: "آيفون وآيباد", en: "iPhone & iPad" },
                  desc: { ar: "App Store — iPhone وiPad", en: "App Store — iPhone & iPad" },
                  url: appDownloads?.appStore?.enabled ? appDownloads.appStore.url : null,
                  badge: appDownloads?.appStore?.enabled ? { ar: "متوفر", en: "Available" } : { ar: "قريباً", en: "Coming Soon" },
                  badgeStyle: appDownloads?.appStore?.enabled ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
                  enabled: appDownloads?.appStore?.enabled ?? false,
                  version: "iOS 15+",
                },
                {
                  key: "macos",
                  icon: Apple,
                  iconBg: "bg-black dark:bg-white",
                  iconColor: "text-white dark:text-black",
                  title: { ar: "ماك", en: "macOS" },
                  desc: { ar: "تطبيق سطح مكتب — DMG + Dark Mode", en: "Desktop App — DMG + Dark Mode" },
                  url: appDownloads?.macStore?.enabled ? appDownloads.macStore.url : null,
                  badge: { ar: "تحميل مباشر", en: "Direct Download" },
                  badgeStyle: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
                  enabled: true,
                  version: "macOS 12+",
                  newTag: true,
                },
                {
                  key: "windows",
                  icon: Monitor,
                  iconBg: "bg-black dark:bg-white",
                  iconColor: "text-white dark:text-black",
                  title: { ar: "ويندوز", en: "Windows" },
                  desc: { ar: "Microsoft Store — EXE Installer", en: "Microsoft Store — EXE Installer" },
                  url: appDownloads?.msStore?.enabled ? appDownloads.msStore.url : null,
                  badge: { ar: "متوفر", en: "Available" },
                  badgeStyle: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
                  enabled: true,
                  version: "Windows 10+",
                },
              ].map((item, idx) => (
                <motion.div key={item.key} variants={fadeUp} custom={idx}>
                  <div className={`relative bg-white dark:bg-gray-900 border rounded-2xl p-6 text-center group transition-all duration-300 h-full flex flex-col items-center ${item.enabled ? "border-black/[0.07] dark:border-white/[0.07] hover:shadow-xl hover:shadow-black/[0.07] dark:hover:shadow-black/[0.3] hover:-translate-y-1" : "border-dashed border-black/[0.06] dark:border-white/[0.06] opacity-55"}`} data-testid={`card-device-${item.key}`}>
                    {(item as any).newTag && (
                      <span className="absolute top-3 end-3 text-[9px] font-black bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        NEW
                      </span>
                    )}
                    {/* Dark-mode adaptive icon */}
                    <div className={`w-14 h-14 mx-auto rounded-2xl ${item.iconBg} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}>
                      <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                    </div>
                    <h3 className="font-bold text-black dark:text-white text-base mb-1">{item.title[lang]}</h3>
                    <p className="text-[10px] text-black/35 dark:text-white/35 mb-1 font-mono">{(item as any).version}</p>
                    <p className="text-black/40 dark:text-white/40 text-xs mb-4 flex-1 leading-relaxed">{item.desc[lang]}</p>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${(item as any).badgeStyle}`}>
                      {item.enabled && <CheckCircle2 className="w-3 h-3" />}
                      {item.badge[lang]}
                    </div>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-black dark:text-white bg-black/[0.05] dark:bg-white/[0.07] hover:bg-black/[0.09] dark:hover:bg-white/[0.12] px-3 py-1.5 rounded-xl transition-colors"
                        data-testid={`link-download-${item.key}`}>
                        <Download className="w-3 h-3" />
                        {lang === "ar" ? "تحميل" : "Download"}
                      </a>
                    ) : item.key === "macos" ? (
                      <a href="/about#download" className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-black dark:text-white bg-black/[0.05] dark:bg-white/[0.07] hover:bg-black/[0.09] dark:hover:bg-white/[0.12] px-3 py-1.5 rounded-xl transition-colors">
                        <Apple className="w-3 h-3" />
                        {lang === "ar" ? "من لوحة الأدمن" : "Via Admin Panel"}
                      </a>
                    ) : null}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-28 bg-[#fafafa] dark:bg-gray-900/30 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 mb-6">
              <Code2 className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
              <span className="text-black/40 dark:text-white/40 text-xs tracking-wider uppercase">{t("about.tech.badge")}</span>
            </div>
            <h2 className="text-3xl font-bold font-heading text-black dark:text-white mb-4">{t("about.tech.title")}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              { title: "Frontend", icon: Code2, items: ["React + TypeScript", "Tailwind CSS", "Framer Motion", "Shadcn/UI + Radix"] },
              { title: "Backend", icon: Cpu, items: ["Node.js + Express", "MongoDB Atlas", "JWT + Role-based Auth", "REST API"] },
            ].map((stack, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] p-8 rounded-2xl">
                <h3 className="font-bold text-black dark:text-white mb-5 flex items-center gap-2 text-sm">
                  <stack.icon className="w-4 h-4 text-black/40 dark:text-white/40" /> {stack.title}
                </h3>
                <div className="space-y-3">
                  {stack.items.map(item => (
                    <div key={item} className="flex items-center gap-3 text-sm text-black/45 dark:text-white/45">
                      <span className="w-1.5 h-1.5 rounded-full bg-black/20 dark:bg-white/20 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Model */}
      <section className="py-28 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] mb-6">
              <TrendingUp className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
              <span className="text-black/40 dark:text-white/40 text-xs tracking-wider uppercase">{t("about.business.badge")}</span>
            </div>
            <h2 className="text-3xl font-bold font-heading text-black dark:text-white mb-4">{t("about.business.title")}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {businessModel.map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] p-8 rounded-2xl text-center hover:shadow-lg hover:shadow-black/[0.04] dark:hover:shadow-black/[0.2] transition-all">
                <div className="w-14 h-14 mx-auto bg-black/[0.04] dark:bg-white/[0.04] rounded-2xl flex items-center justify-center mb-5">
                  <item.icon className="w-6 h-6 text-black/35 dark:text-white/35" />
                </div>
                <h3 className="font-bold text-black dark:text-white text-base mb-2">{item.title[lang]}</h3>
                <p className="text-black/40 dark:text-white/40 text-sm">{item.desc[lang]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 bg-black dark:bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold font-heading text-white mb-6">
            {t("about.cta.title")}
          </h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto mb-12">
            {t("about.cta.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/systems">
              <Button size="lg" className="h-14 px-10 rounded-xl font-semibold bg-white text-black hover:bg-gray-100" data-testid="button-view-portfolio">
                {t("about.cta.systems")}
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="h-14 px-10 border-white/15 text-white/60 hover:text-white hover:bg-white/10 rounded-xl font-semibold bg-transparent" data-testid="button-contact-about">
                {t("about.cta.contact")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
