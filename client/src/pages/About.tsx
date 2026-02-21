import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useTemplates } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
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

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0F]">
      <Navigation />

      <section className="pt-40 pb-36 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-40" />
        <div className="absolute inset-0 animated-grid-dark opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 mb-6">
                <Info className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span className="text-white/40 text-xs tracking-wider uppercase">About QIROX</span>
              </motion.div>
              <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl lg:text-7xl font-black font-heading text-white leading-[1.05] mb-8 tracking-tight">
                نحن لا نبني مواقع.
                <br />
                <span className="text-gradient">نحن نبني بنية تحتية.</span>
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-white/30 leading-relaxed max-w-2xl mx-auto">
                QIROX منصة تقنية متكاملة لتوليد وإدارة الأنظمة الرقمية.
                نحول أفكار العملاء إلى منصات قابلة للتوسع والتطوير المستمر.
              </motion.p>
            </motion.div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0A0A0F] to-transparent" />
      </section>

      <section className="py-28 section-darker relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.15), transparent)" }} />
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <div className="text-center mb-16">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 mb-6">
                <Zap className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span className="text-white/40 text-xs tracking-wider uppercase">المميزات</span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold font-heading text-white mb-4">
                ما يميزنا عن <span className="text-gradient">أي شركة أخرى</span>
              </motion.h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {[
                { icon: Layers, title: "معمارية وحدوية", desc: "كل نظام مبني على Core + Modules. إضافة ميزة جديدة بدون كسر البنية.", color: "#00D4FF" },
                { icon: GitBranch, title: "تحديث مركزي", desc: "تحديث كل المواقع التي تستخدم نفس الموديول بضغطة زر.", color: "#48CAE4" },
                { icon: Shield, title: "حماية متكاملة", desc: "JWT + Role-based access + تشفير البيانات الحساسة.", color: "#0099CC" },
                { icon: Database, title: "قاعدة بيانات مستقلة", desc: "كل عميل يحصل على MongoDB Atlas مستقلة وآمنة.", color: "#90E0EF" },
                { icon: Code2, title: "تصدير مشروع كامل", desc: "ZIP جاهز للنشر مع .env و README و database seed.", color: "#00D4FF" },
                { icon: TrendingUp, title: "نمو مستمر", desc: "العميل يطلب ميزة → تضيف Module → إيراد مستدام.", color: "#48CAE4" },
              ].map((item, idx) => (
                <motion.div key={idx} variants={fadeUp} custom={idx}>
                  <div className="glass-card p-7 rounded-2xl h-full group">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: `${item.color}10` }}>
                      <item.icon className="w-5 h-5" style={{ color: `${item.color}80` }} />
                    </div>
                    <h3 className="text-base font-bold font-heading text-white mb-3">{item.title}</h3>
                    <p className="text-sm text-white/30 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-28 section-dark relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 mb-6">
              <Globe className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span className="text-white/40 text-xs tracking-wider uppercase">القطاعات</span>
            </div>
            <h2 className="text-3xl font-bold font-heading text-white mb-4">القطاعات التي نخدمها</h2>
            <p className="text-white/30">{templates?.length || 8} نظام متكامل يغطي أهم القطاعات</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {templates?.map((t, idx) => {
              const Icon = sectorIcons[t.icon || "Globe"] || Globe;
              return (
                <motion.div
                  key={t.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={idx}
                >
                  <div className="glass-card text-center p-6 rounded-2xl group" data-testid={`about-sector-${t.slug}`}>
                    <div className="w-12 h-12 mx-auto rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-[#00D4FF]/10 transition-all">
                      <Icon className="w-5 h-5 text-white/30 group-hover:text-[#00D4FF] transition-colors" />
                    </div>
                    <h3 className="font-bold text-sm text-white mb-1">{t.nameAr}</h3>
                    <p className="text-[10px] text-white/20">{t.category}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-28 section-darker relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.15), transparent)" }} />
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 mb-6">
              <Code2 className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span className="text-white/40 text-xs tracking-wider uppercase">Tech Stack</span>
            </div>
            <h2 className="text-3xl font-bold font-heading text-white mb-4">البنية التقنية</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              { title: "Frontend", icon: Code2, items: ["React + TypeScript", "Tailwind CSS", "Framer Motion", "Shadcn/UI + Radix"] },
              { title: "Backend", icon: Cpu, items: ["Node.js + Express", "MongoDB Atlas", "JWT + Role-based Auth", "REST API"] },
            ].map((stack, i) => (
              <div key={i} className="glass-card p-8 rounded-2xl">
                <h3 className="font-bold text-white mb-5 flex items-center gap-2 text-sm">
                  <stack.icon className="w-4 h-4 text-[#00D4FF]" /> {stack.title}
                </h3>
                <div className="space-y-3">
                  {stack.items.map(t => (
                    <div key={t} className="flex items-center gap-3 text-sm text-white/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]/50" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 mb-6">
              <TrendingUp className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span className="text-white/40 text-xs tracking-wider uppercase">Business Model</span>
            </div>
            <h2 className="text-3xl font-bold font-heading text-white mb-4">نموذج الأعمال</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { icon: Building2, title: "إنشاء مشاريع", desc: "رسوم إنشاء لكل عميل جديد يختار نظامه" },
              { icon: Rocket, title: "اشتراكات شهرية", desc: "صيانة ودعم فني وتحديثات مستمرة" },
              { icon: Award, title: "إضافات Premium", desc: "SEO, CRM, Payment Gateway, والمزيد" },
            ].map((item, idx) => (
              <div key={idx} className="glass-card p-8 rounded-2xl text-center">
                <div className="w-14 h-14 mx-auto bg-white/5 rounded-2xl flex items-center justify-center mb-5">
                  <item.icon className="w-6 h-6 text-[#00D4FF]/60" />
                </div>
                <h3 className="font-bold text-white text-base mb-2">{item.title}</h3>
                <p className="text-white/30 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28 section-card relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-20" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold font-heading text-white mb-6">
            هل أنت مستعد <span className="text-gradient">للبدء</span>؟
          </h2>
          <p className="text-white/30 text-lg max-w-2xl mx-auto mb-12">
            سواء كنت عميل أو مستثمر، نحن جاهزون لبناء المستقبل الرقمي معاً.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/portfolio">
              <Button size="lg" className="premium-btn h-14 px-10 rounded-xl font-semibold" data-testid="button-view-portfolio">
                استعرض أنظمتنا
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="h-14 px-10 border-white/10 text-white/60 hover:text-white hover:bg-white/5 rounded-xl font-semibold bg-transparent" data-testid="button-contact-about">
                تواصل معنا
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
