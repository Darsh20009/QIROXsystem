import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";
import ParticleCanvas from "@/components/ParticleCanvas";
import { useTemplates } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, Globe, ArrowUpRight,
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Layers,
  Database, Code2, Shield, Zap,
  UtensilsCrossed, Store, Building2, ChevronLeft, ChevronRight
} from "lucide-react";

import bannerImg1 from "@assets/qirox_1771715726312.png";
import bannerImg2 from "@assets/Screenshot_2026-01-02_013103_1771715758847.png";
import bannerImg3 from "@assets/Screenshot_2026-01-02_013107_1771715758847.png";
import bannerImg4 from "@assets/Screenshot_2026-01-02_013112_1771715758847.png";
import bannerImg5 from "@assets/Screenshot_2026-01-02_013117_1771715758847.png";

const bannerImages = [bannerImg1, bannerImg2, bannerImg3, bannerImg4, bannerImg5];

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
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0F]">
      <Navigation />

      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        <ParticleCanvas />
        <div className="absolute inset-0 animated-grid-dark opacity-10" />

        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full pointer-events-none opacity-40"
          style={{
            left: spotlightX,
            top: spotlightY,
            background: "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 60%)",
            transform: "translate(-50%, -50%)"
          }}
        />

        <div className="absolute top-1/4 right-[10%] w-96 h-96 rounded-full blur-[150px] opacity-15" style={{ background: "rgba(0,212,255,0.2)" }} />
        <div className="absolute bottom-1/3 left-[5%] w-80 h-80 rounded-full blur-[120px] opacity-10" style={{ background: "rgba(100,50,255,0.15)" }} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp} custom={0} className="mb-6">
                <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D4FF] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D4FF]" />
                  </span>
                  <span className="text-white/50 text-sm font-medium tracking-wide">Systems Factory — مصنع الأنظمة الرقمية</span>
                </div>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-5xl md:text-7xl lg:text-[5.5rem] font-black font-heading text-white leading-[1.05] mb-4 tracking-tight"
              >
                Build Systems.
              </motion.h1>
              <motion.h1
                variants={fadeUp}
                custom={1.5}
                className="text-5xl md:text-7xl lg:text-[5.5rem] font-black font-heading leading-[1.05] mb-8 tracking-tight"
              >
                <span className="text-gradient">Stay Human.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-lg md:text-xl text-white/40 mb-12 max-w-2xl mx-auto leading-relaxed"
              >
                منصة QIROX لبناء وإدارة الأنظمة الرقمية المتكاملة.
                <br className="hidden md:block" />
                {templates?.length || 8} نظام احترافي جاهز للتخصيص والنشر الفوري.
              </motion.p>

              <motion.div
                variants={fadeUp}
                custom={3}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
              >
                <Link href="/contact">
                  <Button size="lg" className="premium-btn h-14 px-10 text-base rounded-xl gap-2" data-testid="button-start-project">
                    ابدأ مشروعك
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/portfolio">
                  <Button variant="outline" size="lg" className="h-14 px-10 text-base border-white/10 text-white/70 hover:bg-white/5 hover:text-white rounded-xl font-semibold bg-transparent" data-testid="button-explore-solutions">
                    استعرض الأنظمة
                  </Button>
                </Link>
              </motion.div>

              <motion.div variants={fadeUp} custom={4} className="flex flex-wrap items-center justify-center gap-10 md:gap-16 mb-6">
                {[
                  { value: templates?.length || 8, label: "نظام متكامل" },
                  { value: "4", label: "مسارات متخصصة" },
                  { value: "100%", label: "قابل للتخصيص" },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-3xl md:text-4xl font-black text-white mb-1 font-heading">{stat.value}</div>
                    <div className="text-white/25 text-xs tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#0A0A0F] to-transparent" />
      </section>

      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]" />
                <span className="text-white/40 text-xs tracking-wider uppercase">من نحن</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-heading text-white">
                Build Infrastructure. <span className="text-gradient">Scale Brands.</span>
              </h2>
            </motion.div>

            <motion.div variants={fadeUp} custom={1} className="relative max-w-5xl mx-auto">
              <div className="relative rounded-3xl overflow-hidden aspect-[16/7] group">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentSlide}
                    src={bannerImages[currentSlide]}
                    alt="QIROX Studio"
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  />
                </AnimatePresence>

                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F]/60 via-transparent to-[#0A0A0F]/20" />
                <div className="absolute inset-0 border border-white/[0.08] rounded-3xl" />

                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 transition-all opacity-0 group-hover:opacity-100"
                  data-testid="button-prev-slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 transition-all opacity-0 group-hover:opacity-100"
                  data-testid="button-next-slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                  {bannerImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        idx === currentSlide
                          ? "w-8 bg-[#00D4FF]"
                          : "w-1.5 bg-white/20 hover:bg-white/40"
                      }`}
                      data-testid={`slide-dot-${idx}`}
                    />
                  ))}
                </div>
              </div>

              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-[#00D4FF]/5 via-transparent to-[#00D4FF]/5 -z-10 blur-xl" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-28 relative">
        <div className="absolute inset-0 dot-grid opacity-15" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.15), transparent)" }} />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <div className="text-center mb-16">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl mb-5">
                <Zap className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span className="text-white/40 text-xs tracking-wider uppercase">المسارات الرئيسية</span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold font-heading text-white mb-4">
                4 مسارات <span className="text-gradient">خدمية متخصصة</span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-white/30 max-w-xl mx-auto text-base">
                حلول رقمية متكاملة مصممة لأربع قطاعات رئيسية
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
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
                  <div className="glass-card group p-8 rounded-2xl h-full relative overflow-hidden" data-testid={`service-path-${idx}`}>
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
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-28 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.15), transparent)" }} />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl mb-5">
              <Layers className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span className="text-white/40 text-xs tracking-wider uppercase">القطاعات</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold font-heading text-white mb-4">
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

      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.15), transparent)" }} />
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <div className="text-center mb-16">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl mb-5">
                <Layers className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span className="text-white/40 text-xs tracking-wider uppercase">المميزات</span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold font-heading text-white mb-4">
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
                  <div className="glass-card p-7 rounded-2xl h-full group hover:border-white/10 transition-all duration-500">
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

      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="glass-card rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 gradient-mesh opacity-30" />
            <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent)" }} />

            <div className="relative z-10">
              <motion.div variants={fadeUp} custom={0} className="grid grid-cols-2 md:grid-cols-4 gap-8">
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

      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.15), transparent)" }} />

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
              <Link href="/contact">
                <Button size="lg" className="premium-btn h-14 px-10 text-base rounded-xl gap-2" data-testid="button-cta-start">
                  ابدأ مشروعك
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/prices">
                <Button variant="outline" size="lg" className="h-14 px-10 text-base border-white/10 text-white/60 hover:bg-white/5 hover:text-white rounded-xl font-semibold bg-transparent" data-testid="button-cta-prices">
                  الباقات والأسعار
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} custom={3} className="mt-16 flex flex-col items-center gap-3">
              <div className="flex items-center gap-6 text-sm text-white/25">
                <span>www.qiroxstudio.online</span>
                <span className="w-1 h-1 rounded-full bg-white/10" />
                <span>الرياض</span>
                <span className="w-1 h-1 rounded-full bg-white/10" />
                <span>القاهرة</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <InstallPrompt />
      <Footer />
    </div>
  );
}
