import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, Globe, ShieldCheck, Zap } from "lucide-react";
import { QiroxIcon } from "@/components/qirox-brand";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-body">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
        <div className="absolute inset-0 hero-gradient pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* Text Content */}
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
                  المنصة الرائدة للأعمال الرقمية
                </div>
                
                <h1 className="text-4xl lg:text-6xl font-extrabold font-heading text-primary leading-tight mb-6">
                   Qirox | كيروكس <br />
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                     نبني الأنظمة، ونبقى بشرًا.
                   </span>
                </h1>
                
                <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  بناء منصات ومواقع احترافية في السعودية ومصر. نحن نحول أفكارك إلى واقع رقمي ملموس عبر حلول تقنية متكاملة.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link href="/register">
                    <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-1 rounded-xl">
                      ابدأ رحلتك الآن
                      <ArrowLeft className="w-5 h-5 mr-2" />
                    </Button>
                  </Link>
                  <Link href="/services">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-lg border-2 border-slate-200 hover:border-primary hover:text-primary hover:bg-slate-50 transition-all rounded-xl">
                      تصفح خدماتنا
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* Visual/Image Area */}
            <div className="flex-1 w-full relative">
               <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
               >
                 {/* Abstract/Artistic representation since no banner provided */}
                 <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border-8 border-white/50 backdrop-blur-sm aspect-[4/3] bg-slate-900 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-slate-900 to-slate-800 opacity-90 z-10"></div>
                    
                    {/* Decorative Elements */}
                    <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-secondary/30 rounded-full blur-3xl animate-pulse z-20"></div>
                    <div className="absolute bottom-1/3 left-1/3 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl z-20"></div>
                    
                    <div className="absolute inset-0 flex items-center justify-center z-30 flex-col text-white p-8 text-center">
                        <div className="w-24 h-24 mb-6 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg p-4">
                           <QiroxIcon className="w-full h-full text-white" />
                        </div>
                        <h3 className="text-2xl font-bold font-heading mb-2">أنظمة ذكية للمستقبل</h3>
                        <p className="text-slate-300 text-sm">نحن نصمم تجارب مستخدم لا تُنسى</p>
                        
                        {/* Fake UI Elements for "System" look */}
                        <div className="mt-8 w-full max-w-xs space-y-3 opacity-60">
                           <div className="h-2 bg-white/20 rounded-full w-3/4 mx-auto"></div>
                           <div className="h-2 bg-white/10 rounded-full w-1/2 mx-auto"></div>
                           <div className="flex gap-2 justify-center mt-4">
                              <div className="w-8 h-8 rounded-full bg-white/20"></div>
                              <div className="w-8 h-8 rounded-full bg-white/20"></div>
                              <div className="w-8 h-8 rounded-full bg-white/20"></div>
                           </div>
                        </div>
                    </div>
                 </div>
                 
                 {/* Floating Cards */}
               </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features/Stats Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
           <div className="text-center mb-16">
              <h2 className="text-3xl font-bold font-heading text-primary mb-4">مسارات خدماتنا الأساسية</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">نقدم حلولاً متخصصة تلبي احتياجات مختلف القطاعات الحيوية</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: "المطاعم والكافيهات", desc: "أنظمة إدارة وطلب متكاملة للهوية الرقمية", icon: Zap },
                { title: "المتاجر والبراندات", desc: "منصات تجارة إلكترونية احترافية لنمو مبيعاتك", icon: Globe },
                { title: "التعليم والمنصات", desc: "بيئات تعليمية ذكية لإدارة الدورات والطلاب", icon: CheckCircle2 },
                { title: "الأنظمة المؤسسية", desc: "حلول تقنية داخلية مخصصة للشركات والمنظمات", icon: ShieldCheck },
              ].map((feat, idx) => (
                <div key={idx} className="p-8 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-slate-100 group text-center">
                   <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 text-primary group-hover:text-secondary group-hover:scale-110 transition-all duration-300 border border-slate-100 mx-auto">
                      <feat.icon className="w-7 h-7" />
                   </div>
                   <h3 className="text-xl font-bold font-heading mb-3 text-primary">{feat.title}</h3>
                   <p className="text-slate-500 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>
      
      <InstallPrompt />
      <Footer />
    </div>
  );
}
