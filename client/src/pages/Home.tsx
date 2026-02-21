import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";
import ParticleCanvas from "@/components/ParticleCanvas";
import { useTemplates } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Link } from "wouter";
import { useRef } from "react";
import {
  ArrowLeft, Globe, ArrowUpRight,
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Layers,
  Cpu, Database, Code2, Shield, Zap, GitBranch,
  UtensilsCrossed, Store, Building2
} from "lucide-react";

const sectorIcons: Record<string, any> = {
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Globe
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }
  })
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

export default function Home() {
  const { data: templates } = useTemplates();
  const heroRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spotlightX = useTransform(mouseX, (v) => `${v}px`);
  const spotlightY = useTransform(mouseY, (v) => `${v}px`);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0F]">
      <Navigation />

      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        <ParticleCanvas />
        <div className="absolute inset-0 animated-grid-dark opacity-20" />
        <div className="absolute inset-0 gradient-mesh" />

        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full pointer-events-none opacity-50"
          style={{
            left: spotlightX,
            top: spotlightY,
            background: "radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 60%)",
            transform: "translate(-50%, -50%)"
          }}
        />

        <div className="absolute top-1/4 right-[10%] w-72 h-72 rounded-full blur-[120px] opacity-20" style={{ background: "rgba(0,212,255,0.15)" }} />
        <div className="absolute bottom-1/4 left-[10%] w-96 h-96 rounded-full blur-[150px] opacity-10" style={{ background: "rgba(100,80,255,0.1)" }} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp} custom={0} className="mb-8">
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass border border-white/10">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D4FF] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D4FF]" />
                  </span>
                  <span className="text-white/50 text-sm font-medium tracking-wide">Systems Factory — مصنع الأنظمة</span>
                </div>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-5xl md:text-7xl lg:text-[5.5rem] font-black font-heading text-white leading-[1.05] mb-8 tracking-tight"
              >
                نبني <span className="text-gradient">بنية تحتية</span>
                <br />
                <span className="text-white/20">رقمية متكاملة.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-lg md:text-xl text-white/35 mb-14 max-w-2xl mx-auto leading-relaxed"
              >
                منصة QIROX لتوليد وإدارة الأنظمة الرقمية.
                <br className="hidden md:block" />
                {templates?.length || 8} نظام احترافي جاهز للتخصيص والنشر الفوري.
              </motion.p>

              <motion.div
                variants={fadeUp}
                custom={3}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link href="/portfolio">
                  <Button size="lg" className="premium-btn h-14 px-8 text-base rounded-xl" data-testid="button-explore-portfolio">
                    استعرض الأنظمة
                    <ArrowLeft className="w-5 h-5 mr-2" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button variant="outline" size="lg" className="h-14 px-8 text-base border-white/10 text-white/70 hover:bg-white/5 hover:text-white rounded-xl font-semibold bg-transparent" data-testid="button-about-home">
                    تعرف على المنصة
                  </Button>
                </Link>
              </motion.div>

              <motion.div variants={fadeUp} custom={4} className="mt-20 flex items-center justify-center gap-12">
                {[
                  { value: templates?.length || 8, label: "نظام متكامل" },
                  { value: "6+", label: "قطاع مختلف" },
                  { value: "100%", label: "قابل للتخصيص" },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl md:text-3xl font-black text-white mb-1 font-heading">{stat.value}</div>
                    <div className="text-white/25 text-xs">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0A0A0F] to-transparent" />
      </section>

      <section className="py-28 section-dark relative">
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-20"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 mb-6">
              <Layers className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span className="text-white/40 text-xs tracking-wider uppercase">القطاعات</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold font-heading text-white mb-5">
              {templates?.length || 8} أنظمة <span className="text-gradient">جاهزة للنشر</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-white/30 max-w-xl mx-auto">
              كل نظام مبني على بنية Core + Modules قابلة للتوسعة بدون حدود
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates?.map((template, idx) => {
              const Icon = sectorIcons[template.icon || "Globe"] || Globe;
              return (
                <motion.div
                  key={template.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={idx}
                >
                  <Link href="/portfolio">
                    <div
                      className="glass-card group p-6 rounded-2xl cursor-pointer h-full"
                      data-testid={`home-sector-${template.slug}`}
                    >
                      <div className="flex items-start justify-between mb-5">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 group-hover:bg-[#00D4FF]/10 transition-all duration-500">
                          <Icon className="w-5 h-5 text-white/40 group-hover:text-[#00D4FF] transition-colors duration-500" />
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-white/10 group-hover:text-[#00D4FF] transition-all duration-300 group-hover:translate-x-[-2px] group-hover:translate-y-[-2px]" />
                      </div>
                      <h3 className="text-base font-bold font-heading text-white mb-2">{template.nameAr}</h3>
                      <p className="text-sm text-white/30 leading-relaxed line-clamp-2 mb-4">{template.descriptionAr}</p>
                      <div className="flex items-center justify-between text-[10px] text-white/20">
                        <span>{template.estimatedDuration}</span>
                        <span className="px-2.5 py-1 rounded-full bg-white/5 text-white/30">{template.category}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mt-14"
          >
            <Link href="/portfolio">
              <Button variant="outline" size="lg" className="h-12 px-8 border-white/10 text-white/60 hover:text-white hover:bg-white/5 rounded-xl font-semibold transition-all bg-transparent" data-testid="button-all-systems">
                عرض جميع الأنظمة
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-28 section-darker relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.2), transparent)" }} />
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <div className="text-center mb-16">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 mb-6">
                <Zap className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span className="text-white/40 text-xs tracking-wider uppercase">المسارات الرئيسية</span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold font-heading text-white mb-5">
                4 مسارات <span className="text-gradient">خدمية متخصصة</span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-white/30 max-w-xl mx-auto">
                نقدم حلول رقمية متكاملة مصممة لأربع قطاعات رئيسية
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto mb-24">
              {[
                {
                  icon: UtensilsCrossed,
                  title: "المطاعم والكافيهات",
                  desc: "نظام إدارة متكامل: قائمة طعام إلكترونية، حجوزات، طلبات أونلاين، نظام كاشير، وإدارة مخزون.",
                  features: ["قائمة QR", "نظام طلبات", "إدارة فروع", "تقارير مبيعات"],
                  gradient: "from-orange-500/20 to-red-500/10",
                  accent: "#FF6B35",
                },
                {
                  icon: Store,
                  title: "المتاجر والبراندات",
                  desc: "متجر إلكتروني احترافي: كتالوج منتجات، سلة مشتريات، بوابات دفع، شحن وتتبع.",
                  features: ["متجر إلكتروني", "بوابات دفع", "تتبع شحن", "تحليلات"],
                  gradient: "from-purple-500/20 to-pink-500/10",
                  accent: "#A855F7",
                },
                {
                  icon: GraduationCap,
                  title: "التعليم والتدريب",
                  desc: "منصة تعليمية شاملة: دورات، اختبارات، شهادات، بث مباشر، وإدارة طلاب.",
                  features: ["منصة دورات", "اختبارات", "شهادات", "بث مباشر"],
                  gradient: "from-green-500/20 to-emerald-500/10",
                  accent: "#22C55E",
                },
                {
                  icon: Building2,
                  title: "المؤسسات والشركات",
                  desc: "نظام مؤسسي متكامل: إدارة موظفين، مشاريع، مالية، تقارير، وبوابة عملاء.",
                  features: ["بوابة عملاء", "إدارة مشاريع", "نظام مالي", "تقارير ذكية"],
                  gradient: "from-[#00D4FF]/20 to-blue-500/10",
                  accent: "#00D4FF",
                },
              ].map((path, idx) => (
                <motion.div key={idx} variants={fadeUp} custom={idx}>
                  <div className={`glass-card group p-8 rounded-2xl h-full relative overflow-hidden`} data-testid={`service-path-${idx}`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${path.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500"
                          style={{ background: `${path.accent}15`, border: `1px solid ${path.accent}20` }}>
                          <path.icon className="w-6 h-6 transition-colors duration-500" style={{ color: path.accent }} />
                        </div>
                        <Link href="/portfolio">
                          <ArrowUpRight className="w-5 h-5 text-white/10 group-hover:text-white/40 transition-all duration-300 cursor-pointer" />
                        </Link>
                      </div>
                      <h3 className="text-xl font-bold font-heading text-white mb-3">{path.title}</h3>
                      <p className="text-sm text-white/35 leading-relaxed mb-5">{path.desc}</p>
                      <div className="flex flex-wrap gap-2">
                        {path.features.map((f, i) => (
                          <span key={i} className="text-[11px] px-3 py-1 rounded-full border transition-colors duration-300"
                            style={{ borderColor: `${path.accent}20`, color: `${path.accent}90`, background: `${path.accent}08` }}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center mb-20">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 mb-6">
                <Layers className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span className="text-white/40 text-xs tracking-wider uppercase">المميزات</span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold font-heading text-white mb-5">
                لماذا <span className="text-gradient">QIROX</span>؟
              </motion.h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {[
                { icon: Layers, title: "معمارية وحدوية", desc: "Core + Modules. إضافة ميزات بدون كسر البنية الأساسية.", color: "#00D4FF" },
                { icon: Database, title: "قاعدة بيانات مستقلة", desc: "كل عميل يحصل على MongoDB Atlas مستقلة وآمنة.", color: "#48CAE4" },
                { icon: Code2, title: "تصدير مشروع كامل", desc: "ZIP جاهز للنشر مع .env و README وبذور البيانات.", color: "#0099CC" },
                { icon: Shield, title: "حماية متكاملة", desc: "JWT + Role-based access + تشفير كامل للبيانات.", color: "#90E0EF" },
              ].map((item, idx) => (
                <motion.div key={idx} variants={fadeUp} custom={idx}>
                  <div className="glass-card p-7 rounded-2xl h-full group">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-500"
                      style={{ background: `${item.color}10` }}
                    >
                      <item.icon className="w-5 h-5 transition-colors duration-500" style={{ color: `${item.color}80` }} />
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

      <section className="py-24 section-dark relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="glass-card rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 gradient-mesh opacity-50" />
            <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent)" }} />

            <div className="relative z-10">
              <motion.div variants={fadeUp} custom={0} className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-0">
                {[
                  { value: templates?.length || 8, label: "نظام متكامل" },
                  { value: "6+", label: "قطاعات مختلفة" },
                  { value: "3", label: "باقات أسعار" },
                  { value: "2", label: "أسواق مستهدفة" },
                ].map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-4xl md:text-5xl font-black text-white mb-2 font-heading">{stat.value}</div>
                    <div className="text-white/30 text-sm">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 section-darker" />
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.2), transparent)" }} />

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-4xl md:text-6xl font-bold font-heading text-white mb-6">
              ابدأ مشروعك <span className="text-gradient">الآن</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-white/30 text-lg max-w-2xl mx-auto mb-12">
              اختر النظام المناسب لقطاعك وابدأ في بناء بنيتك التحتية الرقمية.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/portfolio">
                <Button size="lg" className="premium-btn h-14 px-10 text-base rounded-xl" data-testid="button-cta-portfolio">
                  استعرض الأنظمة
                  <ArrowLeft className="w-5 h-5 mr-2" />
                </Button>
              </Link>
              <Link href="/prices">
                <Button variant="outline" size="lg" className="h-14 px-10 text-base border-white/10 text-white/60 hover:bg-white/5 hover:text-white rounded-xl font-semibold bg-transparent" data-testid="button-cta-prices">
                  الباقات والأسعار
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <InstallPrompt />
      <Footer />
    </div>
  );
}
