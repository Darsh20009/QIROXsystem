import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";
import { useTemplates } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, Globe, ArrowUpRight,
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Layers,
  Sparkles, Shield, Zap,
  UtensilsCrossed, Store, Building2, ChevronLeft, ChevronRight,
  Headphones, Palette
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
  const [currentSlide, setCurrentSlide] = useState(0);

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

      <section className="relative w-full h-screen min-h-[600px] max-h-[1000px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src={bannerImages[currentSlide]}
              alt="QIROX"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-[#0A0A0F]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/30 to-transparent" />

        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center">
              <div className="mb-5">
                <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/[0.12] bg-white/[0.06] backdrop-blur-xl">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D4FF] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D4FF]" />
                  </span>
                  <span className="text-white/60 text-sm font-medium">مصنع الأنظمة الرقمية</span>
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black font-heading text-white leading-[1.1] mb-2 drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
                Build Systems.
              </h1>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black font-heading leading-[1.1] mb-6 drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
                <span className="text-gradient">Stay Human.</span>
              </h1>

              <p className="text-base sm:text-lg text-white/60 mb-8 max-w-lg mx-auto leading-relaxed drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)]">
                نصمم أنظمة رقمية تنبض بالحياة — لأن التقنية أداة، والإنسان هو الهدف.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/contact">
                  <Button size="lg" className="premium-btn h-14 px-10 text-base rounded-xl gap-2" data-testid="button-start-project">
                    ابدأ مشروعك
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/portfolio">
                  <Button variant="outline" size="lg" className="h-14 px-10 text-base border-white/15 text-white/70 hover:bg-white/10 hover:text-white rounded-xl font-semibold bg-white/5 backdrop-blur-sm" data-testid="button-explore-solutions">
                    استعرض الأنظمة
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={prevSlide}
          className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-black/50 transition-all"
          data-testid="button-prev-slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-black/50 transition-all"
          data-testid="button-next-slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2.5">
          {bannerImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`rounded-full transition-all duration-500 ${
                idx === currentSlide
                  ? "w-8 h-2 bg-[#00D4FF]"
                  : "w-2 h-2 bg-white/25 hover:bg-white/40"
              }`}
              data-testid={`slide-dot-${idx}`}
            />
          ))}
        </div>
      </section>

      <section className="py-20 md:py-28 relative">
        <div className="absolute inset-0 dot-grid opacity-15" />
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
                حلول رقمية متكاملة مصممة خصيصاً لتلبي احتياجات عملك
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
              أنظمة مصممة بعناية، قابلة للتخصيص الكامل حسب احتياجك
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
                <Sparkles className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span className="text-white/40 text-xs tracking-wider uppercase">لماذا نحن</span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold font-heading text-white mb-4">
                لماذا <span className="text-gradient">QIROX</span>؟
              </motion.h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {[
                { icon: Layers, title: "بنية قابلة للتوسع", desc: "أنظمة مبنية بطريقة ذكية تنمو مع نمو مشروعك بدون قيود.", color: "#00D4FF" },
                { icon: Palette, title: "تصميم يعبّر عنك", desc: "هوية بصرية فريدة تعكس شخصية علامتك التجارية وتميّزك عن المنافسين.", color: "#48CAE4" },
                { icon: Headphones, title: "دعم مستمر", desc: "فريق متخصص يرافقك من البداية حتى بعد الإطلاق لضمان نجاح مشروعك.", color: "#0099CC" },
                { icon: Shield, title: "حماية متكاملة", desc: "أمان على أعلى مستوى لحماية بيانات عملائك ومعاملاتك.", color: "#90E0EF" },
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
              نحوّل فكرتك إلى نظام رقمي متكامل يعمل من أول يوم.
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
