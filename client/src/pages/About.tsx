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
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />

      <section className="pt-40 pb-36 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] bg-black/[0.02] mb-6">
                <Info className="w-3.5 h-3.5 text-black/40" />
                <span className="text-black/40 text-xs tracking-wider uppercase">About QIROX</span>
              </motion.div>
              <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl lg:text-7xl font-black font-heading text-black leading-[1.05] mb-8 tracking-tight">
                نحن لا نبني مواقع.
                <br />
                <span className="text-gray-400">نحن نبني بنية تحتية.</span>
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-black/40 leading-relaxed max-w-2xl mx-auto">
                QIROX منصة تقنية متكاملة لتوليد وإدارة الأنظمة الرقمية.
                نحول أفكار العملاء إلى منصات قابلة للتوسع والتطوير المستمر.
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-28 bg-[#fafafa] relative">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <div className="text-center mb-16">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] bg-white mb-6">
                <Zap className="w-3.5 h-3.5 text-black/40" />
                <span className="text-black/40 text-xs tracking-wider uppercase">المميزات</span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold font-heading text-black mb-4">
                ما يميزنا عن <span className="text-gray-400">أي شركة أخرى</span>
              </motion.h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {[
                { icon: Layers, title: "معمارية وحدوية", desc: "كل نظام مبني على Core + Modules. إضافة ميزة جديدة بدون كسر البنية." },
                { icon: GitBranch, title: "تحديث مركزي", desc: "تحديث كل المواقع التي تستخدم نفس الموديول بضغطة زر." },
                { icon: Shield, title: "حماية متكاملة", desc: "JWT + Role-based access + تشفير البيانات الحساسة." },
                { icon: Database, title: "قاعدة بيانات مستقلة", desc: "كل عميل يحصل على MongoDB Atlas مستقلة وآمنة." },
                { icon: Code2, title: "تصدير مشروع كامل", desc: "ZIP جاهز للنشر مع .env و README و database seed." },
                { icon: TrendingUp, title: "نمو مستمر", desc: "العميل يطلب ميزة → تضيف Module → إيراد مستدام." },
              ].map((item, idx) => (
                <motion.div key={idx} variants={fadeUp} custom={idx}>
                  <div className="bg-white border border-black/[0.06] p-7 rounded-2xl h-full group hover:shadow-lg hover:shadow-black/[0.04] transition-all">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-black/[0.04]">
                      <item.icon className="w-5 h-5 text-black/40" />
                    </div>
                    <h3 className="text-base font-bold font-heading text-black mb-3">{item.title}</h3>
                    <p className="text-sm text-black/40 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-28 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] bg-black/[0.02] mb-6">
              <Globe className="w-3.5 h-3.5 text-black/40" />
              <span className="text-black/40 text-xs tracking-wider uppercase">القطاعات</span>
            </div>
            <h2 className="text-3xl font-bold font-heading text-black mb-4">القطاعات التي نخدمها</h2>
            <p className="text-black/35">{templates?.length || 8} نظام متكامل يغطي أهم القطاعات</p>
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
                  <div className="border border-black/[0.06] bg-white text-center p-6 rounded-2xl group hover:shadow-lg hover:shadow-black/[0.04] transition-all" data-testid={`about-sector-${t.slug}`}>
                    <div className="w-12 h-12 mx-auto rounded-xl bg-black/[0.04] flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-black/35" />
                    </div>
                    <h3 className="font-bold text-sm text-black mb-1">{t.nameAr}</h3>
                    <p className="text-[10px] text-black/25">{t.category}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-28 bg-[#fafafa] relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] bg-white mb-6">
              <Code2 className="w-3.5 h-3.5 text-black/40" />
              <span className="text-black/40 text-xs tracking-wider uppercase">Tech Stack</span>
            </div>
            <h2 className="text-3xl font-bold font-heading text-black mb-4">البنية التقنية</h2>
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
                  {stack.items.map(t => (
                    <div key={t} className="flex items-center gap-3 text-sm text-black/45">
                      <span className="w-1.5 h-1.5 rounded-full bg-black/20" />
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
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] bg-black/[0.02] mb-6">
              <TrendingUp className="w-3.5 h-3.5 text-black/40" />
              <span className="text-black/40 text-xs tracking-wider uppercase">Business Model</span>
            </div>
            <h2 className="text-3xl font-bold font-heading text-black mb-4">نموذج الأعمال</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { icon: Building2, title: "إنشاء مشاريع", desc: "رسوم إنشاء لكل عميل جديد يختار نظامه" },
              { icon: Rocket, title: "اشتراكات شهرية", desc: "صيانة ودعم فني وتحديثات مستمرة" },
              { icon: Award, title: "إضافات Premium", desc: "SEO, CRM, Payment Gateway, والمزيد" },
            ].map((item, idx) => (
              <div key={idx} className="bg-white border border-black/[0.06] p-8 rounded-2xl text-center hover:shadow-lg hover:shadow-black/[0.04] transition-all">
                <div className="w-14 h-14 mx-auto bg-black/[0.04] rounded-2xl flex items-center justify-center mb-5">
                  <item.icon className="w-6 h-6 text-black/35" />
                </div>
                <h3 className="font-bold text-black text-base mb-2">{item.title}</h3>
                <p className="text-black/40 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28 bg-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold font-heading text-white mb-6">
            هل أنت مستعد <span className="text-gray-500">للبدء</span>؟
          </h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto mb-12">
            سواء كنت عميل أو مستثمر، نحن جاهزون لبناء المستقبل الرقمي معاً.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/portfolio">
              <Button size="lg" className="h-14 px-10 rounded-xl font-semibold bg-white text-black hover:bg-gray-100" data-testid="button-view-portfolio">
                استعرض أنظمتنا
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="h-14 px-10 border-white/15 text-white/60 hover:text-white hover:bg-white/10 rounded-xl font-semibold bg-transparent" data-testid="button-contact-about">
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
