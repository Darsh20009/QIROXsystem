import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";
import { useTemplates } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeft, Globe,
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Layers, ArrowUpRight,
  Cpu, Database, Code2, Shield
} from "lucide-react";

const sectorIcons: Record<string, any> = {
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Globe
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
  })
};

export default function Home() {
  const { data: templates } = useTemplates();
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
    <div className="min-h-screen flex flex-col bg-[#F4F4F4] font-body">
      <Navigation />

      <section
        className="relative pt-40 pb-32 lg:pt-56 lg:pb-40 overflow-hidden bg-[#111111]"
        onMouseMove={handleMouseMove}
      >
        <div className="absolute inset-0 animated-grid-dark opacity-60" />

        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            left: spotlightX,
            top: spotlightY,
            background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)",
            transform: "translate(-50%, -50%)"
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0}
              className="mb-8"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-white/60 text-sm font-medium tracking-wide">
                <span className="w-2 h-2 bg-white/40 rounded-full animate-pulse" />
                Systems Factory
              </span>
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
              className="text-5xl md:text-7xl lg:text-8xl font-black font-heading text-white leading-[1.1] mb-8 tracking-tight"
            >
              نبني بنية تحتية
              <br />
              <span className="text-white/30">رقمية.</span>
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={2}
              className="text-lg md:text-xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              منصة QIROX لتوليد وإدارة الأنظمة الرقمية.
              {templates?.length || 8} نظام متكامل جاهز للتخصيص والنشر.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={3}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/portfolio">
                <Button size="lg" className="h-14 px-8 text-base bg-white text-black hover:bg-white/90 rounded-xl font-semibold" data-testid="button-explore-portfolio">
                  استعرض الأنظمة
                  <ArrowLeft className="w-5 h-5 mr-2" />
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="h-14 px-8 text-base border-white/20 text-white hover:bg-white/5 rounded-xl font-semibold" data-testid="button-about-home">
                  تعرف على المنصة
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F4F4F4] to-transparent" />
      </section>

      <section className="py-24 bg-[#F4F4F4]">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-black/40 uppercase tracking-widest mb-3">
              القطاعات
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold font-heading text-[#111111] mb-4">
              {templates?.length || 8} أنظمة جاهزة للنشر
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-[#555555] max-w-xl mx-auto">
              كل نظام مبني على بنية Core + Modules قابلة للتوسعة والتخصيص
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
                      className="group p-6 rounded-xl bg-white border border-[#E0E0E0] hover:border-[#111111] transition-all duration-300 cursor-pointer h-full"
                      data-testid={`home-sector-${template.slug}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-[#F4F4F4] flex items-center justify-center group-hover:bg-[#111111] group-hover:text-white transition-all duration-300">
                          <Icon className="w-5 h-5" />
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-black/20 group-hover:text-black transition-colors" />
                      </div>
                      <h3 className="text-base font-bold font-heading text-[#111111] mb-2">{template.nameAr}</h3>
                      <p className="text-sm text-[#555555] leading-relaxed line-clamp-2 mb-3">{template.descriptionAr}</p>
                      <div className="flex items-center justify-between text-xs text-black/30">
                        <span>{template.estimatedDuration}</span>
                        <span className="px-2 py-0.5 rounded bg-[#EAEAEA] text-[#555555]">{template.category}</span>
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
            className="text-center mt-12"
          >
            <Link href="/portfolio">
              <Button variant="outline" size="lg" className="h-12 px-8 border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white rounded-xl font-semibold transition-all" data-testid="button-all-systems">
                عرض جميع الأنظمة
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-black/40 uppercase tracking-widest mb-3">البنية التحتية</p>
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-[#111111] mb-4">لماذا QIROX؟</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Layers, title: "معمارية وحدوية", desc: "Core + Modules. إضافة ميزات بدون كسر البنية." },
              { icon: Database, title: "قاعدة بيانات مستقلة", desc: "كل عميل يحصل على MongoDB مستقلة." },
              { icon: Code2, title: "تصدير مشروع كامل", desc: "ZIP جاهز للنشر مع .env و README." },
              { icon: Shield, title: "حماية متكاملة", desc: "JWT + Role-based access + تشفير." },
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

      <section className="py-20 bg-[#EAEAEA]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto text-center">
            {[
              { value: templates?.length || 8, label: "نظام متكامل" },
              { value: "6+", label: "قطاعات مختلفة" },
              { value: "3", label: "باقات أسعار" },
              { value: "2", label: "أسواق مستهدفة" },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={idx}
              >
                <div className="text-4xl md:text-5xl font-black text-[#111111] mb-2 font-heading">{stat.value}</div>
                <div className="text-[#555555] text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#111111] relative overflow-hidden">
        <div className="absolute inset-0 animated-grid-dark opacity-40" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold font-heading text-white mb-6">
            ابدأ مشروعك الآن
          </h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto mb-10">
            اختر النظام المناسب لقطاعك وابدأ في بناء بنيتك التحتية الرقمية.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/portfolio">
              <Button size="lg" className="h-14 px-8 text-base bg-white text-[#111111] hover:bg-white/90 rounded-xl font-semibold" data-testid="button-cta-portfolio">
                استعرض الأنظمة
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </Link>
            <Link href="/prices">
              <Button variant="outline" size="lg" className="h-14 px-8 text-base border-white/20 text-white hover:bg-white/5 rounded-xl font-semibold" data-testid="button-cta-prices">
                الباقات والأسعار
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <InstallPrompt />
      <Footer />
    </div>
  );
}
