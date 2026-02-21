import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";
import { useTemplates } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeft, Globe, ShieldCheck, Zap, CheckCircle2,
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Layers, Cpu, TrendingUp
} from "lucide-react";
import { QiroxIcon } from "@/components/qirox-brand";

const sectorIcons: Record<string, any> = {
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Globe
};

export default function Home() {
  const { data: templates } = useTemplates();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-body">
      <Navigation />

      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
        <div className="absolute inset-0 hero-gradient pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 text-center lg:text-right">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary font-semibold text-sm mb-6 border border-secondary/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                  </span>
                  Website Infrastructure Automation Platform
                </div>

                <h1 className="text-4xl lg:text-6xl font-extrabold font-heading text-primary leading-tight mb-6">
                  Qirox | كيروكس <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                    مصنع الأنظمة الرقمية
                  </span>
                </h1>

                <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  منصة تقنية متكاملة لتوليد وإدارة الأنظمة الرقمية. نحول أفكارك إلى منصات قابلة للتوسع في السعودية ومصر.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link href="/portfolio">
                    <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-1 rounded-xl" data-testid="button-explore-portfolio">
                      استعرض أنظمتنا
                      <ArrowLeft className="w-5 h-5 mr-2" />
                    </Button>
                  </Link>
                  <Link href="/prices">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-lg border-2 border-slate-200 hover:border-primary hover:text-primary hover:bg-slate-50 transition-all rounded-xl" data-testid="button-view-prices">
                      الباقات والأسعار
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>

            <div className="flex-1 w-full relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border-8 border-white/50 backdrop-blur-sm aspect-[4/3] bg-slate-900 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary via-slate-900 to-slate-800 opacity-90 z-10"></div>
                  <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-secondary/30 rounded-full blur-3xl animate-pulse z-20"></div>
                  <div className="absolute bottom-1/3 left-1/3 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl z-20"></div>

                  <div className="absolute inset-0 flex items-center justify-center z-30 flex-col text-white p-8 text-center">
                    <div className="w-24 h-24 mb-6 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg p-4">
                      <QiroxIcon className="w-full h-full text-white" />
                    </div>
                    <h3 className="text-2xl font-bold font-heading mb-2">Systems Factory</h3>
                    <p className="text-slate-300 text-sm">{templates?.length || 8} أنظمة متكاملة جاهزة للتخصيص</p>

                    <div className="mt-6 grid grid-cols-4 gap-3 w-full max-w-xs">
                      {templates?.slice(0, 8).map((t, i) => (
                        <div key={t.id} className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                          {(() => {
                            const Icon = sectorIcons[t.icon || "Globe"] || Globe;
                            return <Icon className="w-5 h-5 text-white/80" />;
                          })()}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4 text-sm px-4 py-2">
              {templates?.length || 8} نظام متكامل
            </Badge>
            <h2 className="text-3xl font-bold font-heading text-primary mb-4">القطاعات التي نخدمها</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              كل نظام مبني على بنية معمارية وحدوية (Core + Modules) وجاهز للتخصيص والنشر
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates?.map((template, idx) => {
              const Icon = sectorIcons[template.icon || "Globe"] || Globe;
              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  <Card className="border-0 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden h-full" data-testid={`home-sector-${template.slug}`}>
                    <div
                      className="h-2 w-full"
                      style={{ backgroundColor: template.heroColor }}
                    />
                    <CardContent className="pt-6 pb-6">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${template.heroColor}15`, color: template.heroColor }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold font-heading text-primary mb-2">{template.nameAr}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed mb-3 line-clamp-2">{template.descriptionAr}</p>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{template.estimatedDuration}</span>
                        <Badge variant="secondary" className="text-[10px]">{template.category}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link href="/portfolio">
              <Button variant="outline" size="lg" className="h-12 px-8" data-testid="button-all-systems">
                عرض جميع الأنظمة بالتفصيل
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-heading text-primary mb-4">لماذا QIROX؟</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">بنية SaaS عالمية مصممة للسوق العربي</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Layers, title: "معمارية وحدوية", desc: "Core + Modules. إضافة ميزة جديدة بدون كسر البنية الحالية.", color: "#06b6d4" },
              { icon: Cpu, title: "تحديث مركزي", desc: "تحديث كل المواقع بنفس الموديول بضغطة واحدة.", color: "#3b82f6" },
              { icon: TrendingUp, title: "نمو مستمر", desc: "العميل يطلب ميزة → تضيف Module → إيراد مستدام.", color: "#10b981" },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-xl transition-all duration-300 text-center h-full">
                  <CardContent className="pt-10 pb-8">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 mx-auto"
                      style={{ backgroundColor: `${item.color}15`, color: item.color }}
                    >
                      <item.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold font-heading text-primary mb-3">{item.title}</h3>
                    <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-900 text-white">
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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <div className="text-3xl md:text-4xl font-extrabold text-cyan-400 mb-2">{stat.value}</div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-primary to-slate-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-6">
            ابدأ مشروعك الرقمي اليوم
          </h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10">
            اختر القالب المناسب لقطاعك وابدأ في بناء نظامك الرقمي مع فريق QIROX.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/portfolio">
              <Button size="lg" className="h-14 px-8 text-lg bg-white text-slate-900 hover:bg-slate-100" data-testid="button-cta-portfolio">
                استعرض أنظمتنا
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg border-white/30 text-white hover:bg-white/10" data-testid="button-cta-about">
                تعرف علينا
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
