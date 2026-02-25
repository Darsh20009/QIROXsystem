import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Check, ShoppingCart, Sparkles, ArrowLeft, Globe, ShoppingBag, Utensils, Building2, GraduationCap, Briefcase, Server, Dumbbell, Heart, User, Coffee, BookOpen, ClipboardCheck, ChevronDown, Plus, Package, Info } from "lucide-react";
import type { QiroxProduct } from "@shared/schema";

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  priceMin?: number;
  priceMax?: number;
  estimatedDuration?: string;
  features?: string[];
  icon?: string;
}

const iconMap: Record<string, any> = {
  ShoppingBag, Utensils, Building2, Server, Dumbbell, Heart, User, Coffee, BookOpen,
  ClipboardCheck, GraduationCap, Globe, Briefcase, Package, Sparkles,
};

const categoryConfig: Record<string, { label: string; icon: any; gradient: string; color: string; lightBg: string }> = {
  stores: { label: "المتاجر الإلكترونية", icon: ShoppingBag, gradient: "from-amber-500 to-orange-600", color: "text-amber-600", lightBg: "bg-amber-50" },
  restaurants: { label: "المطاعم والكافيهات", icon: Utensils, gradient: "from-red-500 to-pink-600", color: "text-red-600", lightBg: "bg-red-50" },
  education: { label: "المنصات التعليمية", icon: GraduationCap, gradient: "from-blue-500 to-indigo-600", color: "text-blue-600", lightBg: "bg-blue-50" },
  health: { label: "الصحة واللياقة", icon: Dumbbell, gradient: "from-green-500 to-teal-600", color: "text-green-600", lightBg: "bg-green-50" },
  personal: { label: "المواقع الشخصية", icon: User, gradient: "from-violet-500 to-purple-600", color: "text-violet-600", lightBg: "bg-violet-50" },
  institutions: { label: "الشركات والمؤسسات", icon: Building2, gradient: "from-slate-600 to-gray-800", color: "text-slate-600", lightBg: "bg-slate-50" },
  food: { label: "منظومات الطعام", icon: Coffee, gradient: "from-yellow-500 to-amber-600", color: "text-yellow-600", lightBg: "bg-yellow-50" },
};

const storeFeatures = [
  "بانر رئيسي متحرك وكاروسيل عروض",
  "تصفح المنتجات مع فلاتر ذكية",
  "سلة تسوق متقدمة + نظام كوبونات",
  "صفحة تفاصيل المنتج مع صور متعددة",
  "متغيرات المنتج (لون، مقاس، SKU)",
  "تقارير المبيعات والمنتجات الأكثر مبيعاً",
  "إدارة المخزون والفروع",
  "نقطة بيع POS متكاملة",
  "فواتير ضريبية متوافقة مع ZATCA",
  "ربط Apple Pay وطرق دفع متعددة",
];

const restaurantFeatures = [
  "قائمة رقمية بالفئات والمنتجات",
  "طلب عبر QR Code على الطاولة",
  "شاشة المطبخ KDS للطلبات الفورية",
  "نظام Takeaway وتوصيل مع تتبع",
  "إدارة الطاولات والحجوزات",
  "نظام ولاء وبطاقات رقمية",
  "تقارير الأداء والمبيعات اليومية",
  "نقطة بيع كاشير متكاملة",
  "تحليلات أوقات الذروة والمنتجات",
];

const serviceFeaturesMap: Record<string, string[]> = {
  stores: storeFeatures,
  food: restaurantFeatures,
  restaurants: restaurantFeatures,
};

const customizableCategories = ["education", "institutions", "health", "personal"];

const isCustomizable = (category: string) => customizableCategories.includes(category);

export default function Services() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [selectedCat, setSelectedCat] = useState("all");

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const { data: products } = useQuery<QiroxProduct[]>({
    queryKey: ["/api/products"],
  });

  const addToCartMutation = useMutation({
    mutationFn: async (service: Service) => {
      const res = await apiRequest("POST", "/api/cart/items", {
        type: 'service',
        refId: service.id,
        name: service.title,
        nameAr: service.title,
        price: service.priceMin || 0,
        qty: 1,
        config: { category: service.category, duration: service.estimatedDuration },
      });
      return res.json();
    },
    onSuccess: (_, service) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      setAddedIds(prev => new Set([...prev, service.id]));
      toast({ title: `✓ "${service.title}" أُضيف للسلة` });
    },
    onError: () => toast({ title: "يجب تسجيل الدخول أولاً", variant: "destructive" }),
  });

  const categories = [...new Set(services?.map(s => s.category) || [])];
  const filtered = services?.filter(s => selectedCat === "all" || s.category === selectedCat) || [];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />

      {/* Hero */}
      <section className="pt-36 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] bg-black/[0.02] mb-6">
              <Sparkles className="w-3.5 h-3.5 text-black/40" />
              <span className="text-black/40 text-xs tracking-wider">مصنع الأنظمة الرقمية</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black font-heading text-black mb-5 tracking-tight">
              خدماتنا
            </h1>
            <p className="text-black/40 text-xl max-w-2xl mx-auto leading-relaxed">
              اختر النظام المناسب لمشروعك — كل خدمة مصممة بعناية لتناسب قطاعك
            </p>
          </motion.div>

          {/* Category filter */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-wrap justify-center gap-2 mt-10">
            <button
              onClick={() => setSelectedCat("all")}
              className={`px-5 py-2 rounded-full text-sm font-medium border transition-all ${selectedCat === "all" ? 'bg-black text-white border-black' : 'bg-white text-black/60 border-black/[0.08] hover:border-black/20'}`}
            >
              الكل ({services?.length || 0})
            </button>
            {categories.map(cat => {
              const cfg = categoryConfig[cat];
              if (!cfg) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium border transition-all ${selectedCat === cat ? 'bg-black text-white border-black' : 'bg-white text-black/60 border-black/[0.08] hover:border-black/20'}`}
                >
                  <cfg.icon className="w-3.5 h-3.5" />
                  {cfg.label}
                </button>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="pb-24 container mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-black/20" />
          </div>
        ) : (
          <div className="space-y-6 max-w-5xl mx-auto">
            {filtered.map((service, i) => {
              const cat = categoryConfig[service.category] || { label: service.category, icon: Briefcase, gradient: "from-gray-500 to-slate-600", color: "text-gray-600", lightBg: "bg-gray-50" };
              const Icon = iconMap[service.icon || ""] || cat.icon;
              const features = serviceFeaturesMap[service.category];
              const customizable = isCustomizable(service.category);
              const relatedProducts = products?.filter(p => p.serviceSlug && service.title.toLowerCase().includes(p.serviceSlug)) || [];
              const isExpanded = expanded === service.id;
              const isAdded = addedIds.has(service.id);

              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  data-testid={`service-card-${service.id}`}
                >
                  <div className={`bg-white border border-black/[0.07] rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300 ${isExpanded ? 'shadow-lg' : ''}`}>
                    {/* Main Row */}
                    <div className="p-6 md:p-8 flex items-start gap-6">
                      {/* Icon */}
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-black text-black font-heading">{service.title}</h3>
                              {customizable && (
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">مخصص بالكامل</span>
                              )}
                            </div>
                            <p className="text-black/50 text-sm leading-relaxed max-w-xl">{service.description}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            {service.priceMin && service.priceMin > 0 ? (
                              <div className="text-right">
                                <p className="text-2xl font-black text-black">{service.priceMin.toLocaleString()} ر.س</p>
                                {service.priceMax && service.priceMax !== service.priceMin && (
                                  <p className="text-xs text-black/35">حتى {service.priceMax.toLocaleString()} ر.س</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm font-bold text-black/40">حسب المتطلبات</p>
                            )}
                            {service.estimatedDuration && (
                              <span className="text-[10px] bg-black/[0.04] text-black/40 px-2.5 py-1 rounded-full border border-black/[0.06]">
                                ⏱ {service.estimatedDuration}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-5 flex-wrap">
                          {user ? (
                            <Button
                              size="sm"
                              className={`rounded-xl h-9 px-5 text-xs font-bold transition-all ${isAdded ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-black text-white hover:bg-black/80'}`}
                              onClick={() => !isAdded && addToCartMutation.mutate(service)}
                              disabled={addToCartMutation.isPending}
                              data-testid={`button-add-service-${service.id}`}
                            >
                              {isAdded ? <Check className="w-3.5 h-3.5 ml-1" /> : <ShoppingCart className="w-3.5 h-3.5 ml-1" />}
                              {isAdded ? "في السلة" : "أضف للسلة"}
                            </Button>
                          ) : (
                            <Link href="/order">
                              <Button size="sm" className="rounded-xl h-9 px-5 text-xs font-bold bg-black text-white hover:bg-black/80" data-testid={`button-order-${service.id}`}>
                                <ArrowLeft className="w-3.5 h-3.5 ml-1" />
                                اطلب الآن
                              </Button>
                            </Link>
                          )}
                          <button
                            onClick={() => setExpanded(isExpanded ? null : service.id)}
                            className="flex items-center gap-1 text-xs text-black/40 hover:text-black transition-colors"
                            data-testid={`button-expand-${service.id}`}
                          >
                            <Info className="w-3.5 h-3.5" />
                            {isExpanded ? "إخفاء التفاصيل" : "عرض المميزات"}
                            <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                          {user && (
                            <Link href="/cart">
                              <button className="text-xs text-black/40 hover:text-black transition-colors underline underline-offset-2">
                                عرض السلة
                              </button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 md:px-8 pb-8 border-t border-black/[0.05] pt-6">
                            {customizable ? (
                              <div className="flex flex-col items-center text-center py-6">
                                <div className={`w-16 h-16 rounded-2xl ${cat.lightBg} flex items-center justify-center mb-4`}>
                                  <Icon className={`w-8 h-8 ${cat.color}`} />
                                </div>
                                <h4 className="font-bold text-base text-black mb-2">نظام مخصص بالكامل</h4>
                                <p className="text-black/45 text-sm max-w-lg leading-relaxed">
                                  هذا النظام يُبنى حسب متطلباتك الخاصة. لا توجد قيود على الميزات أو التصميم — كل شيء يُبنى من الصفر
                                  لمناسبة نشاطك التجاري تماماً.
                                </p>
                                <div className="flex flex-wrap gap-2 mt-5 justify-center">
                                  {["تصميم مخصص", "ميزات لا محدودة", "تكامل مع أنظمتك", "API خاص", "دعم متواصل"].map(f => (
                                    <span key={f} className={`text-xs px-3 py-1 rounded-full border ${cat.lightBg} ${cat.color} border-current/20 font-medium`}>{f}</span>
                                  ))}
                                </div>
                              </div>
                            ) : features ? (
                              <div>
                                <h4 className="font-bold text-sm text-black/60 mb-4 uppercase tracking-wider">ما يتضمنه النظام</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {features.map((f, fi) => (
                                    <div key={fi} className="flex items-center gap-3 text-sm text-black/70">
                                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${cat.gradient}`}>
                                        <Check className="w-3 h-3 text-white" />
                                      </div>
                                      {f}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {service.features?.map((f, fi) => (
                                  <div key={fi} className="flex items-center gap-2 text-sm text-black/60">
                                    <Check className="w-3.5 h-3.5 text-black/30 flex-shrink-0" />
                                    {f}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Related Products */}
                            {relatedProducts.length > 0 && (
                              <div className="mt-6">
                                <h4 className="font-bold text-sm text-black/60 mb-3 flex items-center gap-2">
                                  <Package className="w-4 h-4" />
                                  أجهزة وإضافات موصى بها
                                </h4>
                                <div className="flex gap-3 flex-wrap">
                                  {relatedProducts.map(p => (
                                    <Link key={p.id} href="/devices">
                                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-black/[0.08] hover:border-black/20 bg-white hover:shadow-sm transition-all cursor-pointer">
                                        {p.images?.[0] && <img src={p.images[0]} className="w-8 h-8 rounded-lg object-cover" alt={p.nameAr} />}
                                        <div>
                                          <p className="text-xs font-bold text-black">{p.nameAr}</p>
                                          <p className="text-[10px] text-black/40">{p.price.toLocaleString()} ر.س</p>
                                        </div>
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}

            {filtered.length === 0 && !isLoading && (
              <div className="text-center py-20">
                <Briefcase className="w-16 h-16 mx-auto mb-4 text-black/10" />
                <p className="text-black/30">لا توجد خدمات في هذه الفئة</p>
              </div>
            )}
          </div>
        )}

        {/* Bottom CTA */}
        {user && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-16 max-w-5xl mx-auto">
            <div className="bg-black rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-white">
                <h3 className="text-xl font-bold mb-1.5">أضف الإضافات البنية التحتية</h3>
                <p className="text-white/50 text-sm">استضافة AWS، قاعدة بيانات MongoDB Atlas، دومين، وبريد أعمال</p>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <Link href="/cart">
                  <Button className="bg-white text-black hover:bg-white/90 font-bold px-6 h-11 rounded-xl" data-testid="button-view-cart">
                    <ShoppingCart className="w-4 h-4 ml-2" />
                    السلة ({addedIds.size})
                  </Button>
                </Link>
                <Link href="/devices">
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 h-11 rounded-xl px-6" data-testid="button-browse-devices-cta">
                    <Package className="w-4 h-4 ml-2" />
                    الأجهزة
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </section>

      <Footer />
    </div>
  );
}
