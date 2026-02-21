import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";
import { useTemplates } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
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

const shimmerKeyframes = `
@keyframes shimmer {
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
}
`;

export default function Home() {
  const { data: templates } = useTemplates();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeCarouselIdx, setActiveCarouselIdx] = useState(0);

  const scrollCarousel = useCallback((direction: "left" | "right") => {
    if (!carouselRef.current) return;
    const card = carouselRef.current.querySelector("[data-carousel-card]") as HTMLElement | null;
    const step = card ? card.offsetWidth + 20 : 320;
    const scrollAmount = direction === "right" ? step : -step;
    carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const handleScroll = () => {
      const card = el.querySelector("[data-carousel-card]") as HTMLElement | null;
      const step = card ? card.offsetWidth + 20 : 320;
      const idx = Math.round(el.scrollLeft / step);
      setActiveCarouselIdx(idx);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const totalCards = templates?.length || 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0F]">
      <style>{shimmerKeyframes}</style>
      <Navigation />

      <section className="relative w-full min-h-[80vh] flex items-center justify-center pt-28 pb-16" data-testid="section-hero">
        <div className="absolute inset-0 bg-[#0A0A0F]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0A0A0F] to-transparent" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h1 dir="ltr" className="text-5xl sm:text-6xl md:text-8xl font-black font-heading text-white leading-[1.05] mb-1 tracking-tight">
                Build Systems.
              </h1>
              <h1
                dir="ltr"
                className="text-5xl sm:text-6xl md:text-8xl font-black font-heading leading-[1.05] mb-8 tracking-tight"
                style={{
                  background: "linear-gradient(90deg, #00D4FF, #0099CC, #00D4FF, #48CAE4, #00D4FF)",
                  backgroundSize: "400% 100%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  animation: "shimmer 6s linear infinite",
                }}
              >
                .Stay Human
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg sm:text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed"
              dir="rtl"
            >
              مصنع الأنظمة الرقمية — نبني بنية تحتية رقمية متكاملة
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
            >
              <Link href="/contact">
                <Button
                  size="lg"
                  className="h-14 px-10 text-base rounded-md gap-2 font-semibold no-default-hover-elevate no-default-active-elevate"
                  style={{ background: "linear-gradient(135deg, #00D4FF, #0099CC)", color: "#0A0A0F", border: "1px solid #00D4FF" }}
                  data-testid="button-start-project"
                >
                  ابدأ مشروعك
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/portfolio">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-10 text-base border-white/15 text-white/70 rounded-md font-semibold bg-white/5 backdrop-blur-sm"
                  data-testid="button-explore-solutions"
                >
                  استعرض الأنظمة
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/[0.08] bg-white/[0.03]"
              data-testid="promo-banner"
            >
              <span className="text-[11px] font-bold tracking-wider text-[#00D4FF] bg-[#00D4FF]/10 px-2.5 py-0.5 rounded-full">NEW</span>
              <span className="text-white/50 text-sm" dir="rtl">باقة Enterprise متاحة الآن</span>
              <ArrowLeft className="w-3.5 h-3.5 text-white/30" />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-6 relative z-10" data-testid="section-stats">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="border border-white/[0.08] rounded-md overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.08] rtl:divide-x-reverse">
              {[
                { value: `${templates?.length || 8}+`, label: "أنظمة جاهزة" },
                { value: "6+", label: "قطاعات" },
                { value: "3", label: "باقات" },
                { value: "2", label: "السعودية ومصر" },
              ].map((stat, idx) => (
                <div key={idx} className="px-6 py-8 text-center" data-testid={`stat-card-${idx}`}>
                  <div className="text-3xl md:text-4xl font-black mb-2 font-heading text-white">
                    {stat.value}
                  </div>
                  <div className="text-white/30 text-sm" dir="rtl">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-28 relative" data-testid="section-pathfinder">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
            className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-10 md:p-14 flex flex-col justify-center" dir="rtl">
                <span className="text-[#00D4FF] text-sm font-semibold mb-3">ابدأ هنا</span>
                <h2 className="text-3xl md:text-4xl font-bold font-heading text-white mb-4 leading-tight">
                  ابدأ مشروعك الرقمي الآن
                </h2>
                <p className="text-white/40 text-base leading-relaxed mb-8 max-w-md">
                  نحوّل فكرتك إلى نظام رقمي متكامل يعمل من أول يوم. ابدأ بباقة تناسبك واحصل على نظامك خلال أيام.
                </p>
                <div>
                  <Link href="/contact">
                    <Button
                      size="lg"
                      className="h-13 px-8 text-base rounded-md gap-2 font-semibold"
                      style={{ background: "linear-gradient(135deg, #00D4FF, #0099CC)", color: "#0A0A0F", border: "1px solid #00D4FF" }}
                      data-testid="button-pathfinder-cta"
                    >
                      ابدأ الآن
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="p-10 md:p-14 border-t md:border-t-0 md:border-r border-white/[0.08] rtl:md:border-r-0 rtl:md:border-l rtl:border-white/[0.08]" dir="rtl">
                <h3 className="text-white/40 text-sm font-semibold mb-8 tracking-wider uppercase">روابط سريعة</h3>
                <div className="space-y-1">
                  {[
                    { href: "/portfolio", label: "الأنظمة" },
                    { href: "/prices", label: "الباقات" },
                    { href: "/about", label: "عن المنصة" },
                    { href: "/contact", label: "تواصل" },
                  ].map((link) => (
                    <Link key={link.href} href={link.href}>
                      <div
                        className="flex items-center justify-between py-4 px-4 rounded-md text-white/60 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer group"
                        data-testid={`pathfinder-link-${link.href.replace("/", "")}`}
                      >
                        <span className="text-base font-medium">{link.label}</span>
                        <ArrowLeft className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-28 relative" data-testid="section-carousel">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-3" dir="rtl">
                <motion.div variants={fadeUp} custom={0}>
                  <span className="text-[#00D4FF] text-sm font-semibold mb-3 block">الأنظمة</span>
                  <h2 className="text-3xl md:text-4xl font-bold font-heading text-white mb-4 leading-tight">
                    أنظمة جاهزة{" "}
                    <span
                      style={{
                        background: "linear-gradient(90deg, #00D4FF, #0099CC)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      للنشر
                    </span>
                  </h2>
                  <p className="text-white/40 text-sm leading-relaxed mb-8">
                    أنظمة مصممة بعناية، قابلة للتخصيص الكامل حسب احتياجك. اختر النظام المناسب وابدأ فوراً.
                  </p>
                  <div className="flex gap-2">
                    {templates?.slice(0, 5).map((_, idx) => (
                      <div
                        key={idx}
                        className={`rounded-full transition-all duration-300 ${
                          idx === activeCarouselIdx
                            ? "w-6 h-2 bg-[#00D4FF]"
                            : "w-2 h-2 bg-white/15"
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              </div>

              <div className="lg:col-span-9 relative">
                <div className="flex items-center gap-3 mb-4 justify-end">
                  <button
                    onClick={() => scrollCarousel("right")}
                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all"
                    data-testid="button-carousel-prev"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => scrollCarousel("left")}
                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all"
                    data-testid="button-carousel-next"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>

                <div
                  ref={carouselRef}
                  className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {templates?.map((template, idx) => {
                    const Icon = sectorIcons[template.icon || "Globe"] || Globe;
                    return (
                      <Link key={template.id} href="/portfolio">
                        <div
                          className="flex-shrink-0 w-[300px] bg-white rounded-[32px] p-8 cursor-pointer group snap-start"
                          data-testid={`carousel-card-${template.slug}`}
                          data-carousel-card
                        >
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#0A0A0F]/5 mb-6">
                            <Icon className="w-5 h-5 text-[#0A0A0F]/60" />
                          </div>
                          <h3 className="text-lg font-bold text-[#0A0A0F] mb-2" dir="rtl">{template.nameAr}</h3>
                          <p className="text-sm text-[#0A0A0F]/50 leading-relaxed mb-6 line-clamp-3" dir="rtl">
                            {template.descriptionAr}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs px-3 py-1.5 rounded-full bg-[#0A0A0F]/5 text-[#0A0A0F]/50 font-medium">
                              {template.category}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-[#0A0A0F]/5 flex items-center justify-center group-hover:bg-[#00D4FF] transition-colors">
                              <ArrowUpRight className="w-4 h-4 text-[#0A0A0F]/40 group-hover:text-white transition-colors" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-28 relative" data-testid="section-services">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <div className="text-center mb-16" dir="rtl">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] mb-5">
                <Zap className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span className="text-white/40 text-xs tracking-wider uppercase">المسارات الرئيسية</span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold font-heading text-white mb-4">
                4 مسارات{" "}
                <span style={{ background: "linear-gradient(90deg, #00D4FF, #0099CC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  خدمية متخصصة
                </span>
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
                  accent: "#FF6B35",
                },
                {
                  icon: Store,
                  title: "المتاجر والبراندات",
                  desc: "متجر إلكتروني احترافي: كتالوج منتجات، سلة مشتريات، بوابات دفع، شحن وتتبع.",
                  features: ["متجر إلكتروني", "بوابات دفع", "تتبع شحن", "تحليلات"],
                  accent: "#A855F7",
                },
                {
                  icon: GraduationCap,
                  title: "التعليم والتدريب",
                  desc: "منصة تعليمية شاملة: دورات، اختبارات، شهادات، بث مباشر، وإدارة طلاب.",
                  features: ["منصة دورات", "اختبارات", "شهادات", "بث مباشر"],
                  accent: "#22C55E",
                },
                {
                  icon: Building2,
                  title: "المؤسسات والشركات",
                  desc: "نظام مؤسسي متكامل: إدارة موظفين، مشاريع، مالية، تقارير، وبوابة عملاء.",
                  features: ["بوابة عملاء", "إدارة مشاريع", "نظام مالي", "تقارير ذكية"],
                  accent: "#00D4FF",
                },
              ].map((path, idx) => (
                <motion.div key={idx} variants={fadeUp} custom={idx}>
                  <div
                    className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-10 h-full group transition-all duration-500 hover:border-white/[0.12]"
                    data-testid={`service-path-${idx}`}
                    dir="rtl"
                  >
                    <div className="flex items-start justify-between mb-8">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500"
                        style={{ background: `${path.accent}12`, border: `1px solid ${path.accent}20` }}
                      >
                        <path.icon className="w-6 h-6 transition-colors duration-500" style={{ color: path.accent }} />
                      </div>
                      <Link href="/portfolio">
                        <ArrowUpRight className="w-5 h-5 text-white/10 group-hover:text-white/40 transition-all duration-300 cursor-pointer" />
                      </Link>
                    </div>
                    <h3 className="text-xl font-bold font-heading text-white mb-3">{path.title}</h3>
                    <p className="text-sm text-white/35 leading-relaxed mb-6">{path.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {path.features.map((f, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-3.5 py-1.5 rounded-full border transition-colors duration-300"
                          style={{ borderColor: `${path.accent}20`, color: `${path.accent}90`, background: `${path.accent}08` }}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-28 relative" data-testid="section-why">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.15), transparent)" }} />
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <div className="text-center mb-16" dir="rtl">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] mb-5">
                <Sparkles className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span className="text-white/40 text-xs tracking-wider uppercase">لماذا نحن</span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold font-heading text-white mb-4">
                لماذا{" "}
                <span style={{ background: "linear-gradient(90deg, #00D4FF, #0099CC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  QIROX
                </span>
                ؟
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
                  <div
                    className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-8 h-full transition-all duration-500 hover:border-white/[0.12]"
                    data-testid={`why-card-${idx}`}
                    dir="rtl"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-all duration-500"
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

      <section className="py-20 md:py-28 relative" data-testid="section-spotlight">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <div
              className="rounded-[25px] p-12 md:p-20 text-center relative overflow-hidden"
              style={{
                background: "linear-gradient(90deg, #0A2A3A, rgba(0,212,255,0.12) 35%, rgba(0,212,255,0.09) 55%, #0A2A3A)",
              }}
            >
              <div className="absolute inset-0 border border-white/[0.06] rounded-[25px] pointer-events-none" />

              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold font-heading text-white mb-6" dir="rtl">
                  ابدأ مشروعك الآن
                </h2>
                <p className="text-white/40 text-lg max-w-2xl mx-auto mb-10" dir="rtl">
                  نحوّل فكرتك إلى نظام رقمي متكامل يعمل من أول يوم.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/contact">
                    <Button
                      size="lg"
                      className="h-14 px-10 text-base rounded-md gap-2 font-semibold"
                      style={{ background: "linear-gradient(135deg, #00D4FF, #0099CC)", color: "#0A0A0F", border: "1px solid #00D4FF" }}
                      data-testid="button-cta-start"
                    >
                      ابدأ مشروعك
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/prices">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-14 px-10 text-base border-white/10 text-white/60 rounded-md font-semibold bg-transparent"
                      data-testid="button-cta-prices"
                    >
                      الباقات والأسعار
                    </Button>
                  </Link>
                </div>

                <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-sm text-white/25">
                  <span>www.qiroxstudio.online</span>
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                  <span>الرياض</span>
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                  <span>القاهرة</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <InstallPrompt />
      <Footer />
    </div>
  );
}
