import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useTemplates } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import {
  ArrowLeft, Code2, Layers, Globe, Cpu, GitBranch, TrendingUp,
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Building2, Rocket, Award, Shield, Database, Info, Zap
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
    <div className="min-h-screen flex flex-col bg-white" dir={dir}>
      <Navigation />

      {/* Hero */}
      <section className="pt-40 pb-36 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] bg-black/[0.02] mb-6">
                <Info className="w-3.5 h-3.5 text-black/40" />
                <span className="text-black/40 text-xs tracking-wider uppercase">{t("about.badge")}</span>
              </motion.div>
              <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl lg:text-7xl font-black font-heading text-black leading-[1.05] mb-8 tracking-tight">
                {t("about.hero.title1")}
                <br />
                <span className="text-gray-400">{t("about.hero.title2")}</span>
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-black/40 leading-relaxed max-w-2xl mx-auto">
                {t("about.hero.subtitle")}
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-28 bg-[#fafafa] relative">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <div className="text-center mb-16">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] bg-white mb-6">
                <Zap className="w-3.5 h-3.5 text-black/40" />
                <span className="text-black/40 text-xs tracking-wider uppercase">{t("about.features.badge")}</span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold font-heading text-black mb-4">
                {t("about.features.title")} <span className="text-gray-400">{t("about.features.titleHighlight")}</span>
              </motion.h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {features.map((item, idx) => (
                <motion.div key={idx} variants={fadeUp} custom={idx}>
                  <div className="bg-white border border-black/[0.06] p-7 rounded-2xl h-full group hover:shadow-lg hover:shadow-black/[0.04] transition-all">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-black/[0.04]">
                      <item.icon className="w-5 h-5 text-black/40" />
                    </div>
                    <h3 className="text-base font-bold font-heading text-black mb-3">{item.title[lang]}</h3>
                    <p className="text-sm text-black/40 leading-relaxed">{item.desc[lang]}</p>
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] bg-black/[0.02] mb-6">
              <Globe className="w-3.5 h-3.5 text-black/40" />
              <span className="text-black/40 text-xs tracking-wider uppercase">{t("about.sectors.badge")}</span>
            </div>
            <h2 className="text-3xl font-bold font-heading text-black mb-4">{t("about.sectors.title")}</h2>
            <p className="text-black/35">{templates?.length || 8} {t("about.systems.count")}</p>
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
                  <div className="border border-black/[0.06] bg-white text-center p-6 rounded-2xl group hover:shadow-lg hover:shadow-black/[0.04] transition-all" data-testid={`about-sector-${tmpl.slug}`}>
                    <div className="w-12 h-12 mx-auto rounded-xl bg-black/[0.04] flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-black/35" />
                    </div>
                    <h3 className="font-bold text-sm text-black mb-1">{lang === "ar" ? tmpl.nameAr : tmpl.name}</h3>
                    <p className="text-[10px] text-black/25">{tmpl.category}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-28 bg-[#fafafa] relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] bg-white mb-6">
              <Code2 className="w-3.5 h-3.5 text-black/40" />
              <span className="text-black/40 text-xs tracking-wider uppercase">{t("about.tech.badge")}</span>
            </div>
            <h2 className="text-3xl font-bold font-heading text-black mb-4">{t("about.tech.title")}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              { title: "Frontend", icon: Code2, items: ["React + TypeScript", "Tailwind CSS", "Framer Motion", "Shadcn/UI + Radix"] },
              { title: "Backend", icon: Cpu, items: ["Node.js + Express", "MongoDB Atlas", "JWT + Role-based Auth", "REST API"] },
            ].map((stack, i) => (
              <div key={i} className="bg-white border border-black/[0.06] p-8 rounded-2xl">
                <h3 className="font-bold text-black mb-5 flex items-center gap-2 text-sm">
                  <stack.icon className="w-4 h-4 text-black/40" /> {stack.title}
                </h3>
                <div className="space-y-3">
                  {stack.items.map(item => (
                    <div key={item} className="flex items-center gap-3 text-sm text-black/45">
                      <span className="w-1.5 h-1.5 rounded-full bg-black/20" />
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] bg-black/[0.02] mb-6">
              <TrendingUp className="w-3.5 h-3.5 text-black/40" />
              <span className="text-black/40 text-xs tracking-wider uppercase">{t("about.business.badge")}</span>
            </div>
            <h2 className="text-3xl font-bold font-heading text-black mb-4">{t("about.business.title")}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {businessModel.map((item, idx) => (
              <div key={idx} className="bg-white border border-black/[0.06] p-8 rounded-2xl text-center hover:shadow-lg hover:shadow-black/[0.04] transition-all">
                <div className="w-14 h-14 mx-auto bg-black/[0.04] rounded-2xl flex items-center justify-center mb-5">
                  <item.icon className="w-6 h-6 text-black/35" />
                </div>
                <h3 className="font-bold text-black text-base mb-2">{item.title[lang]}</h3>
                <p className="text-black/40 text-sm">{item.desc[lang]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 bg-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold font-heading text-white mb-6">
            {t("about.cta.title")}
          </h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto mb-12">
            {t("about.cta.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/portfolio">
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
