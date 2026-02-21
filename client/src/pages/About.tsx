import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useTemplates } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeft, Code2, Layers, Globe, Cpu, GitBranch, TrendingUp,
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Building2, Rocket, Award, Shield, Database
} from "lucide-react";

const sectorIcons: Record<string, any> = {
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Globe
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }
  })
};

export default function About() {
  const { data: templates } = useTemplates();

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F4F4]">
      <Navigation />

      <section className="pt-40 pb-32 bg-[#111111] text-white relative overflow-hidden">
        <div className="absolute inset-0 animated-grid-dark opacity-40" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial="hidden" animate="visible">
              <motion.span variants={fadeUp} custom={0} className="inline-block text-white/40 text-sm font-medium tracking-widest uppercase mb-6">
                About QIROX
              </motion.span>
              <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl lg:text-7xl font-black font-heading leading-[1.1] mb-8 tracking-tight">
                نحن لا نبني مواقع.
                <br />
                <span className="text-white/30">نحن نبني بنية تحتية.</span>
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-white/40 leading-relaxed max-w-2xl mx-auto">
                QIROX منصة تقنية متكاملة لتوليد وإدارة الأنظمة الرقمية.
                نحول أفكار العملاء إلى منصات قابلة للتوسع والتطوير المستمر.
              </motion.p>
            </motion.div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#F4F4F4] to-transparent" />
      </section>

      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-black/30 uppercase tracking-widest mb-3">المميزات</p>
            <h2 className="text-3xl font-bold font-heading text-[#111111] mb-4">ما يميزنا عن أي شركة أخرى</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { icon: Layers, title: "معمارية وحدوية", desc: "كل نظام مبني على Core + Modules. إضافة ميزة جديدة بدون كسر البنية." },
              { icon: GitBranch, title: "تحديث مركزي", desc: "تحديث كل المواقع التي تستخدم نفس الموديول بضغطة زر واحدة." },
              { icon: Shield, title: "حماية متكاملة", desc: "JWT + Role-based access + تشفير البيانات." },
              { icon: Database, title: "قاعدة بيانات مستقلة", desc: "كل عميل يحصل على MongoDB Atlas مستقلة." },
              { icon: Code2, title: "تصدير مشروع كامل", desc: "ZIP جاهز للنشر مع .env و README و database seed." },
              { icon: TrendingUp, title: "نمو مستمر", desc: "العميل يطلب ميزة → تضيف Module → إيراد مستدام." },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={idx}
                className="p-6 rounded-xl border border-[#E0E0E0] bg-white hover:border-[#111111] transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#F4F4F4] flex items-center justify-center mb-4 group-hover:bg-[#111111] group-hover:text-white transition-all">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold font-heading text-[#111111] mb-2">{item.title}</h3>
                <p className="text-sm text-[#555555] leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#F4F4F4]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-black/30 uppercase tracking-widest mb-3">القطاعات</p>
            <h2 className="text-3xl font-bold font-heading text-[#111111] mb-4">القطاعات التي نخدمها</h2>
            <p className="text-[#555555]">{templates?.length || 8} نظام متكامل يغطي أهم القطاعات</p>
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
                  className="text-center p-5 rounded-xl bg-white border border-[#E0E0E0] hover:border-[#111111] transition-all group"
                  data-testid={`about-sector-${t.slug}`}
                >
                  <div className="w-10 h-10 mx-auto rounded-lg bg-[#F4F4F4] flex items-center justify-center mb-3 group-hover:bg-[#111111] group-hover:text-white transition-all">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-[#111111] mb-1">{t.nameAr}</h3>
                  <p className="text-[10px] text-black/30">{t.category}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-black/30 uppercase tracking-widest mb-3">Tech Stack</p>
            <h2 className="text-3xl font-bold font-heading text-[#111111] mb-4">البنية التقنية</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <div className="p-6 rounded-xl border border-[#E0E0E0]">
              <h3 className="font-bold text-[#111111] mb-4 flex items-center gap-2 text-sm">
                <Code2 className="w-4 h-4" /> Frontend
              </h3>
              <div className="space-y-2 text-sm text-[#555555]">
                {["React + TypeScript", "Tailwind CSS", "Framer Motion", "Shadcn/UI + Radix"].map(t => (
                  <div key={t} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#111111] rounded-full" />
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 rounded-xl border border-[#E0E0E0]">
              <h3 className="font-bold text-[#111111] mb-4 flex items-center gap-2 text-sm">
                <Cpu className="w-4 h-4" /> Backend
              </h3>
              <div className="space-y-2 text-sm text-[#555555]">
                {["Node.js + Express", "MongoDB Atlas", "JWT + Role-based Auth", "REST API"].map(t => (
                  <div key={t} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#111111] rounded-full" />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#111111] text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-white/30 text-sm font-medium tracking-widest uppercase">Monetization</span>
            <h2 className="text-3xl font-bold font-heading mt-3 mb-4">نموذج الأعمال</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { icon: Building2, title: "إنشاء مشاريع", desc: "رسوم إنشاء لكل عميل جديد" },
              { icon: Rocket, title: "اشتراكات شهرية", desc: "صيانة ودعم فني وتحديثات" },
              { icon: Award, title: "إضافات Premium", desc: "SEO, CRM, Payment Gateway" },
            ].map((item, idx) => (
              <div key={idx} className="p-6 rounded-xl border border-white/10 text-center">
                <div className="w-10 h-10 mx-auto bg-white/5 rounded-lg flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-white/60" />
                </div>
                <h3 className="font-bold text-base mb-2">{item.title}</h3>
                <p className="text-white/40 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#EAEAEA]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-[#111111] mb-6">
            هل أنت مستعد للبدء؟
          </h2>
          <p className="text-[#555555] text-lg max-w-2xl mx-auto mb-10">
            سواء كنت عميل أو مستثمر، نحن جاهزون لبناء المستقبل الرقمي معاً.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/portfolio">
              <Button size="lg" className="h-14 px-8 bg-[#111111] hover:bg-[#2B2B2B] text-white rounded-xl font-semibold" data-testid="button-view-portfolio">
                استعرض أنظمتنا
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="h-14 px-8 border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white rounded-xl font-semibold" data-testid="button-contact-about">
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
