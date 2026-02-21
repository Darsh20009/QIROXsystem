import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useTemplates } from "@/hooks/use-templates";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeft, Code2, Users, Shield, Rocket, Target, Layers, Globe,
  Building2, Cpu, GitBranch, Settings, TrendingUp, Award,
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee
} from "lucide-react";
import { QiroxIcon } from "@/components/qirox-brand";

const sectorIcons: Record<string, any> = {
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Globe
};

export default function About() {
  const { data: templates } = useTemplates();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />

      <section className="pt-32 pb-20 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex justify-center mb-8">
                <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/20">
                  <QiroxIcon className="w-14 h-14 text-white" />
                </div>
              </div>

              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 mb-6 text-sm px-4 py-2">
                Website Infrastructure Automation Platform
              </Badge>

              <h1 className="text-4xl md:text-6xl font-extrabold font-heading mb-6 leading-tight">
                نحن لا نبني مواقع.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  نحن نبني بنية تحتية رقمية.
                </span>
              </h1>

              <p className="text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
                QIROX هي منصة تقنية متكاملة لتوليد وإدارة الأنظمة الرقمية. 
                نحول أفكار العملاء إلى منصات قابلة للتوسع والتطوير المستمر.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-heading text-primary mb-4">ما يميزنا عن أي شركة أخرى</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              الفرق الحقيقي ليس "توليد موقع"... الفرق هو أننا نسلم الموقع + نتحكم في بنيته + نطوره + نوسعه.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { icon: Layers, title: "معمارية وحدوية", desc: "كل نظام مبني على Core + Modules. إضافة ميزة جديدة بدون كسر البنية." },
              { icon: GitBranch, title: "تحديث مركزي", desc: "تحديث كل المواقع التي تستخدم نفس الموديول بضغطة زر واحدة." },
              { icon: Shield, title: "حماية متكاملة", desc: "نظام أمان متقدم مع JWT، Role-based access، وتشفير البيانات." },
              { icon: Cpu, title: "بنية SaaS", desc: "منصتنا مبنية بمعايير SaaS عالمية مثل Linear وVercel وStripe." },
              { icon: Settings, title: "قابلية التخصيص", desc: "كل مشروع عميل قابل للتوسعة. إضافة ميزات دون إعادة بناء." },
              { icon: TrendingUp, title: "نمو مستمر", desc: "العميل لا يخرج منك أبداً. كل مرة يريد ميزة → أنت تضيف Module." },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-xl transition-all duration-300 h-full">
                  <CardContent className="pt-8 pb-6">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4 text-primary">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold font-heading text-primary mb-2">{item.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-heading text-primary mb-4">القطاعات التي نخدمها</h2>
            <p className="text-slate-500">
              {templates?.length || 8} نظام متكامل يغطي أهم القطاعات في السوق
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {templates?.map((t, idx) => {
              const Icon = sectorIcons[t.icon || "Globe"] || Globe;
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="text-center p-6 rounded-2xl bg-white shadow-sm hover:shadow-lg transition-all border border-slate-100"
                  data-testid={`about-sector-${t.slug}`}
                >
                  <div 
                    className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${t.heroColor}15`, color: t.heroColor }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-primary mb-1">{t.nameAr}</h3>
                  <p className="text-xs text-slate-400">{t.category}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-heading text-primary mb-4">البنية التقنية</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              مبنية بأحدث التقنيات وأعلى معايير الجودة
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100">
              <h3 className="font-bold text-lg text-primary mb-4 flex items-center gap-2">
                <Code2 className="w-5 h-5" /> Frontend
              </h3>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2"><span className="w-2 h-2 bg-cyan-500 rounded-full"></span> React + TypeScript</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 bg-cyan-500 rounded-full"></span> Tailwind CSS</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 bg-cyan-500 rounded-full"></span> Framer Motion</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 bg-cyan-500 rounded-full"></span> Shadcn/UI + Radix</div>
              </div>
            </div>
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100">
              <h3 className="font-bold text-lg text-primary mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5" /> Backend
              </h3>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> Node.js + Express</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> MongoDB Atlas</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> JWT + Role-based Auth</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> REST API</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-white/10 text-white border-white/20 mb-4">خطة Monetization</Badge>
            <h2 className="text-3xl font-bold font-heading mb-4">نموذج الأعمال</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              مصادر دخل متنوعة ومستدامة
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Building2, title: "إنشاء مشاريع", desc: "رسوم إنشاء مشروع لكل عميل جديد" },
              { icon: Rocket, title: "اشتراكات شهرية", desc: "صيانة ودعم فني وتحديثات مستمرة" },
              { icon: Award, title: "إضافات Premium", desc: "SEO Module, CRM, Payment Gateway" },
            ].map((item, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="w-12 h-12 mx-auto bg-white/10 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-primary to-slate-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-6">
            هل أنت مستعد للبدء؟
          </h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10">
            سواء كنت عميل أو مستثمر، نحن جاهزون لبناء المستقبل الرقمي معاً.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/portfolio">
              <Button size="lg" className="h-14 px-8 text-lg bg-white text-slate-900 hover:bg-slate-100" data-testid="button-view-portfolio">
                استعرض أنظمتنا
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg border-white/30 text-white hover:bg-white/10" data-testid="button-contact-about">
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
