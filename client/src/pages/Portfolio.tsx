import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useTemplates } from "@/hooks/use-templates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useState } from "react";
import {
  Loader2, ExternalLink, ArrowLeft, Check, Filter,
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Globe, Layers
} from "lucide-react";

const IconMap: Record<string, any> = {
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Globe, Layers
};

const categoryLabels: Record<string, string> = {
  all: "الكل",
  education: "التعليم",
  health: "الصحة واللياقة",
  personal: "شخصي",
  institutional: "مؤسسي",
  commerce: "تجارة إلكترونية",
  food: "مطاعم وكافيهات",
};

export default function Portfolio() {
  const { data: templates, isLoading } = useTemplates();
  const [activeFilter, setActiveFilter] = useState("all");

  const categories = ["all", ...Array.from(new Set(templates?.map(t => t.category) || []))];
  const filtered = activeFilter === "all" 
    ? templates 
    : templates?.filter(t => t.category === activeFilter);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />

      <section className="pt-32 pb-20 bg-gradient-to-b from-slate-900 to-slate-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-white/10 text-white border-white/20 mb-6 text-sm px-4 py-2">
              QIROX Systems Factory
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold font-heading mb-6">
              أنظمتنا <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">الجاهزة</span>
            </h1>
            <p className="text-slate-300 text-lg max-w-3xl mx-auto leading-relaxed">
              8 أنظمة احترافية مبنية بأعلى المعايير التقنية. كل نظام قابل للتخصيص والتوسعة حسب احتياجات عملك.
              <br />
              <span className="text-cyan-400 font-semibold">نحن لا نبني مواقع. نحن نبني بنية تحتية رقمية.</span>
            </p>

            <div className="flex items-center justify-center gap-8 mt-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-cyan-400">{templates?.length || 8}</div>
                <div className="text-slate-400 text-sm mt-1">نظام جاهز</div>
              </div>
              <div className="w-px h-12 bg-slate-600"></div>
              <div className="text-center">
                <div className="text-4xl font-bold text-cyan-400">6+</div>
                <div className="text-slate-400 text-sm mt-1">قطاعات مختلفة</div>
              </div>
              <div className="w-px h-12 bg-slate-600"></div>
              <div className="text-center">
                <div className="text-4xl font-bold text-cyan-400">100%</div>
                <div className="text-slate-400 text-sm mt-1">قابل للتخصيص</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-6 bg-white border-b border-slate-200 sticky top-16 z-30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <Filter className="w-5 h-5 text-slate-400 flex-shrink-0" />
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                data-testid={`filter-${cat}`}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === cat
                    ? "bg-slate-900 text-white shadow-lg"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {categoryLabels[cat] || cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 container mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered?.map((template, idx) => {
              const Icon = IconMap[template.icon || "Globe"] || Globe;

              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  <Card 
                    className="border-0 shadow-md hover:shadow-2xl transition-all duration-500 flex flex-col overflow-hidden group h-full"
                    data-testid={`card-template-${template.slug}`}
                  >
                    <div 
                      className="h-40 relative overflow-hidden"
                      style={{ backgroundColor: template.heroColor || "#0f172a" }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform duration-500">
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <Badge className="absolute top-3 left-3 bg-white/20 text-white border-0 backdrop-blur-sm text-xs">
                        {categoryLabels[template.category] || template.category}
                      </Badge>
                      {template.status === "active" && (
                        <div className="absolute top-3 right-3 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      )}
                    </div>

                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-bold font-heading text-primary leading-tight">
                        {template.nameAr}
                      </CardTitle>
                      <p className="text-xs text-slate-400 font-mono">{template.name}</p>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col">
                      <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3">
                        {template.descriptionAr}
                      </p>

                      <div className="space-y-2 mb-4">
                        {template.featuresAr?.slice(0, 3).map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                            <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                        {(template.featuresAr?.length || 0) > 3 && (
                          <div className="text-xs text-slate-400">
                            +{(template.featuresAr?.length || 0) - 3} ميزات أخرى
                          </div>
                        )}
                      </div>

                      <div className="mt-auto pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-slate-400">السعر يبدأ من</span>
                          <span className="font-bold text-primary text-sm">
                            {template.priceMin?.toLocaleString()} {template.currency}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs text-slate-400">المدة التقديرية</span>
                          <span className="text-xs font-medium text-slate-600">{template.estimatedDuration}</span>
                        </div>

                        <div className="flex gap-2">
                          <Link href="/order" className="flex-1">
                            <Button 
                              className="w-full h-9 text-xs bg-slate-900 hover:bg-slate-800"
                              data-testid={`button-order-${template.slug}`}
                            >
                              اطلب الآن
                              <ArrowLeft className="w-3 h-3 mr-1" />
                            </Button>
                          </Link>
                          {template.repoUrl && (
                            <a href={template.repoUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="icon" className="h-9 w-9" data-testid={`button-repo-${template.slug}`}>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-6">
            جاهز لبناء مشروعك الرقمي؟
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
            اختر النظام المناسب لقطاعك ودعنا نحوله إلى منصة رقمية متكاملة خاصة بك.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/order">
              <Button size="lg" className="h-14 px-8 text-lg bg-white text-slate-900 hover:bg-slate-100" data-testid="button-start-project">
                ابدأ مشروعك الآن
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg border-slate-600 text-white hover:bg-slate-800" data-testid="button-contact-us">
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
