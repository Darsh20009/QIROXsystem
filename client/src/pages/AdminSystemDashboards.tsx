import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Coffee, ShoppingCart, Store, Building2, UtensilsCrossed, Truck, Stethoscope,
  GraduationCap, Hotel, Car, Dumbbell, Scissors, LayoutDashboard, Check,
  TrendingUp, Users, Package, Star, ChevronLeft, Globe, Smartphone, Monitor,
  Zap, Shield, BarChart3, Settings, Bell, CreditCard, FileText, Calendar
} from "lucide-react";

interface DashboardFeature { icon: any; label: string; }
interface DashboardTemplate {
  id: string;
  name: string;
  nameEn: string;
  icon: any;
  color: string;
  textColor: string;
  description: string;
  descriptionEn: string;
  category: string;
  stats: { label: string; value: string }[];
  features: DashboardFeature[];
  modules: string[];
  screens: string[];
  badge?: string;
}

const TEMPLATES: DashboardTemplate[] = [
  {
    id: "cafe",
    name: "نظام إدارة المقاهي والمطاعم",
    nameEn: "Café & Restaurant ERP",
    icon: Coffee,
    color: "bg-amber-950",
    textColor: "text-amber-950",
    description: "نظام متكامل لإدارة المقاهي والمطاعم — الطلبات، الكاشير، المطبخ، المخزون، والتقارير",
    descriptionEn: "Full café & restaurant management — POS, kitchen display, inventory & reports",
    category: "hospitality",
    badge: "الأكثر طلباً",
    stats: [
      { label: "طلب شهرياً", value: "4,200+" },
      { label: "وقت التوصيل", value: "12d" },
      { label: "التقييم", value: "4.9★" },
    ],
    features: [
      { icon: ShoppingCart, label: "نظام نقاط البيع (POS)" },
      { icon: Monitor, label: "شاشة المطبخ (KDS)" },
      { icon: Package, label: "إدارة المخزون" },
      { icon: Users, label: "إدارة الموظفين" },
      { icon: BarChart3, label: "تقارير المبيعات" },
      { icon: Smartphone, label: "تطبيق الطلبات" },
      { icon: Globe, label: "قائمة إلكترونية QR" },
      { icon: Bell, label: "إشعارات فورية" },
    ],
    modules: ["POS متعدد الكاشير", "شاشة طلبات المطبخ", "إدارة الطاولات", "برنامج ولاء", "توصيل وايجري", "حجوزات أونلاين", "إدارة الوجبات", "تقارير تفصيلية"],
    screens: ["لوحة التحكم الرئيسية", "إدارة الطلبات", "إدارة القائمة", "المخزن والمشتريات", "الموظفون والورديات", "التقارير المالية"],
  },
  {
    id: "market",
    name: "نظام إدارة البقالات والمحلات",
    nameEn: "Supermarket & Retail ERP",
    icon: Store,
    color: "bg-emerald-900",
    textColor: "text-emerald-900",
    description: "نظام شامل لإدارة البقالات والمحلات التجارية — البضاعة، الكاشير، الديون، والتقارير",
    descriptionEn: "Comprehensive retail management — inventory, POS, debt tracking & analytics",
    category: "retail",
    stats: [
      { label: "عميل نشط", value: "2,800+" },
      { label: "وقت التوصيل", value: "10d" },
      { label: "التقييم", value: "4.8★" },
    ],
    features: [
      { icon: ShoppingCart, label: "كاشير سريع" },
      { icon: Package, label: "إدارة المنتجات" },
      { icon: FileText, label: "تتبع الديون" },
      { icon: TrendingUp, label: "تحليل المبيعات" },
      { icon: Truck, label: "إدارة الموردين" },
      { icon: CreditCard, label: "دفع متعدد" },
      { icon: Bell, label: "تنبيهات انتهاء الصلاحية" },
      { icon: BarChart3, label: "تقارير الربح" },
    ],
    modules: ["كاشير لمس سريع", "باركود وQR", "إدارة الفروع", "تتبع الديون والسلف", "إدارة الموردين", "تنبيه نفاد المخزون", "عروض وخصومات", "حسابات يومية"],
    screens: ["لوحة المبيعات", "إدارة البضاعة", "ديون العملاء", "حسابات الموردين", "التقارير اليومية", "إعدادات النظام"],
  },
  {
    id: "ecommerce",
    name: "متجر إلكتروني متكامل",
    nameEn: "Full E-Commerce Platform",
    icon: Globe,
    color: "bg-blue-900",
    textColor: "text-blue-900",
    description: "منصة تجارة إلكترونية متكاملة — المنتجات، الطلبات، الشحن، الدفع الإلكتروني، والتسويق",
    descriptionEn: "Complete e-commerce platform — products, orders, shipping, payments & marketing",
    category: "ecommerce",
    badge: "الأسرع نمواً",
    stats: [
      { label: "منتج يُباع يومياً", value: "15K+" },
      { label: "وقت التوصيل", value: "14d" },
      { label: "التقييم", value: "4.9★" },
    ],
    features: [
      { icon: Package, label: "إدارة المنتجات" },
      { icon: ShoppingCart, label: "سلة المشتريات" },
      { icon: CreditCard, label: "بوابات دفع متعددة" },
      { icon: Truck, label: "تتبع الشحنات" },
      { icon: Star, label: "تقييمات العملاء" },
      { icon: TrendingUp, label: "تسويق وكوبونات" },
      { icon: Smartphone, label: "تطبيق جوال" },
      { icon: BarChart3, label: "تحليلات متقدمة" },
    ],
    modules: ["متجر متعدد اللغات", "بوابة Moyasar/PayPal", "شحن Aramex/SMSA", "إدارة المرتجعات", "حملات البريد", "واجهة API للمطورين", "تكامل الوسائط", "لوحة المستخدم"],
    screens: ["واجهة المتجر", "لوحة التاجر", "إدارة الطلبات", "إدارة المنتجات", "التسويق والخصومات", "التحليلات والتقارير"],
  },
  {
    id: "company",
    name: "نظام ERP للشركات",
    nameEn: "Corporate ERP System",
    icon: Building2,
    color: "bg-slate-900",
    textColor: "text-slate-900",
    description: "نظام ERP متكامل للشركات — الموارد البشرية، المشاريع، المالية، العملاء، والعمليات",
    descriptionEn: "Full corporate ERP — HR, projects, finance, CRM & operations management",
    category: "enterprise",
    stats: [
      { label: "شركة تستخدمه", value: "340+" },
      { label: "وقت التوصيل", value: "21d" },
      { label: "التقييم", value: "4.9★" },
    ],
    features: [
      { icon: Users, label: "إدارة الموارد البشرية" },
      { icon: FileText, label: "إدارة المشاريع" },
      { icon: TrendingUp, label: "محاسبة ومالية" },
      { icon: Building2, label: "إدارة العملاء CRM" },
      { icon: Calendar, label: "الجدولة والمهام" },
      { icon: Shield, label: "صلاحيات متقدمة" },
      { icon: Settings, label: "إعدادات مخصصة" },
      { icon: Zap, label: "تكاملات API" },
    ],
    modules: ["هيكل الموظفين", "الرواتب والعقود", "إدارة المشاريع", "فواتير وعروض أسعار", "تتبع الطلبات", "لوحات المعلومات", "تقارير الإدارة", "نظام الأدوار"],
    screens: ["لوحة المدير التنفيذي", "الموارد البشرية", "الإدارة المالية", "إدارة العملاء", "المشاريع والمهام", "التقارير التحليلية"],
  },
  {
    id: "clinic",
    name: "نظام العيادات والمراكز الطبية",
    nameEn: "Clinic & Medical Center ERP",
    icon: Stethoscope,
    color: "bg-red-900",
    textColor: "text-red-900",
    description: "نظام طبي متكامل — المواعيد، المرضى، الطواريء، المخزن، والفواتير الطبية",
    descriptionEn: "Complete medical system — appointments, patients, emergency, stock & billing",
    category: "medical",
    stats: [
      { label: "عيادة نشطة", value: "180+" },
      { label: "وقت التوصيل", value: "18d" },
      { label: "التقييم", value: "4.8★" },
    ],
    features: [
      { icon: Calendar, label: "إدارة المواعيد" },
      { icon: Users, label: "سجلات المرضى" },
      { icon: FileText, label: "الوصفات الطبية" },
      { icon: Package, label: "مخزن الصيدلية" },
      { icon: CreditCard, label: "الفواتير والتأمين" },
      { icon: Bell, label: "تذكيرات المواعيد" },
      { icon: BarChart3, label: "تقارير إحصائية" },
      { icon: Shield, label: "خصوصية البيانات" },
    ],
    modules: ["حجز المواعيد", "ملف المريض الإلكتروني", "نظام الوصفات", "مخزن الأدوية", "فوترة التأمين", "SMS تذكير", "تقارير الأطباء", "نظام الطوارئ"],
    screens: ["لوحة الاستقبال", "ملفات المرضى", "الجدول الزمني", "الصيدلية", "الفواتير", "تقارير المركز"],
  },
  {
    id: "gym",
    name: "نظام صالات اللياقة والرياضة",
    nameEn: "Gym & Fitness Center ERP",
    icon: Dumbbell,
    color: "bg-orange-900",
    textColor: "text-orange-900",
    description: "نظام شامل لصالات اللياقة — العضويات، الحضور، المدربون، الجدولة، والتقارير",
    descriptionEn: "Complete gym management — memberships, attendance, trainers & scheduling",
    category: "fitness",
    stats: [
      { label: "صالة نشطة", value: "95+" },
      { label: "وقت التوصيل", value: "10d" },
      { label: "التقييم", value: "4.7★" },
    ],
    features: [
      { icon: Users, label: "إدارة العضويات" },
      { icon: Calendar, label: "حجز الجلسات" },
      { icon: Check, label: "نظام الحضور" },
      { icon: Star, label: "إدارة المدربين" },
      { icon: CreditCard, label: "الاشتراكات والدفع" },
      { icon: Bell, label: "تذكير بالتمارين" },
      { icon: Smartphone, label: "تطبيق الأعضاء" },
      { icon: BarChart3, label: "تقارير الحضور" },
    ],
    modules: ["باب ذكي RFID", "خطط التمرين", "تغذية وتتبع", "اشتراكات متعددة", "برنامج ولاء", "إشعارات رمضان", "إدارة الفروع", "تقييم الأعضاء"],
    screens: ["لوحة الإدارة", "عضويات ومشتركون", "المدربون", "الجلسات والمواعيد", "المبيعات", "التقارير"],
  },
  {
    id: "school",
    name: "نظام المدارس والمراكز التعليمية",
    nameEn: "School & Education ERP",
    icon: GraduationCap,
    color: "bg-indigo-900",
    textColor: "text-indigo-900",
    description: "نظام تعليمي متكامل — الطلاب، الحضور، الدرجات، الرسوم، والتواصل مع أولياء الأمور",
    descriptionEn: "Full education system — students, attendance, grades, fees & parent communication",
    category: "education",
    stats: [
      { label: "مؤسسة تعليمية", value: "120+" },
      { label: "وقت التوصيل", value: "16d" },
      { label: "التقييم", value: "4.8★" },
    ],
    features: [
      { icon: Users, label: "إدارة الطلاب" },
      { icon: Calendar, label: "الجداول الدراسية" },
      { icon: Check, label: "نظام الحضور" },
      { icon: FileText, label: "الدرجات والشهادات" },
      { icon: CreditCard, label: "الرسوم والمدفوعات" },
      { icon: Bell, label: "تواصل الأهالي" },
      { icon: Smartphone, label: "تطبيق الطالب" },
      { icon: BarChart3, label: "تقارير الأداء" },
    ],
    modules: ["سجل الطالب", "الحضور والغياب", "الدرجات والاختبارات", "الرسوم الدراسية", "SMS للوالدين", "الواجبات المنزلية", "الشهادات الرقمية", "تقارير المعلمين"],
    screens: ["لوحة الإدارة", "بوابة الطالب", "بوابة ولي الأمر", "شؤون المعلمين", "الشؤون المالية", "التقارير"],
  },
  {
    id: "salon",
    name: "نظام الصالونات ومراكز التجميل",
    nameEn: "Salon & Beauty Center ERP",
    icon: Scissors,
    color: "bg-pink-900",
    textColor: "text-pink-900",
    description: "نظام متكامل للصالونات ومراكز التجميل — المواعيد، المنتجات، الموظفين، والنقاط",
    descriptionEn: "Complete salon management — appointments, products, staff & loyalty points",
    category: "beauty",
    stats: [
      { label: "صالون نشط", value: "210+" },
      { label: "وقت التوصيل", value: "8d" },
      { label: "التقييم", value: "4.8★" },
    ],
    features: [
      { icon: Calendar, label: "حجز المواعيد" },
      { icon: Users, label: "ملفات العملاء" },
      { icon: Package, label: "إدارة المنتجات" },
      { icon: Star, label: "برنامج النقاط" },
      { icon: CreditCard, label: "كاشير متعدد" },
      { icon: Bell, label: "تذكير المواعيد" },
      { icon: Smartphone, label: "حجز أونلاين" },
      { icon: BarChart3, label: "تقارير الأداء" },
    ],
    modules: ["حجز أونلاين", "ملف العميلة", "خدمات الصالون", "كوبونات وخصومات", "إدارة المواد", "تقييم الخدمة", "تقارير الموظفين", "نظام العمولات"],
    screens: ["لوحة الاستقبال", "المواعيد", "ملفات العملاء", "المبيعات والكاشير", "المخزون", "التقارير"],
  },
];

const CATEGORIES = [
  { key: "all", label: "الكل", labelEn: "All" },
  { key: "hospitality", label: "ضيافة", labelEn: "Hospitality" },
  { key: "retail", label: "تجزئة", labelEn: "Retail" },
  { key: "ecommerce", label: "تجارة إلكترونية", labelEn: "E-Commerce" },
  { key: "enterprise", label: "شركات", labelEn: "Enterprise" },
  { key: "medical", label: "طبي", labelEn: "Medical" },
  { key: "fitness", label: "لياقة", labelEn: "Fitness" },
  { key: "education", label: "تعليم", labelEn: "Education" },
  { key: "beauty", label: "تجميل", labelEn: "Beauty" },
];

export default function AdminSystemDashboards() {
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const [selectedCat, setSelectedCat] = useState("all");
  const [selected, setSelected] = useState<DashboardTemplate | null>(null);

  const filtered = selectedCat === "all" ? TEMPLATES : TEMPLATES.filter(t => t.category === selectedCat);

  return (
    <div className="relative overflow-hidden space-y-6" dir={dir}>
      <PageGraphics variant="dashboard" />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-black">
            {L ? "لوحات الأنظمة الجاهزة" : "System Dashboard Templates"}
          </h1>
          <p className="text-xs text-black/35">
            {L ? "أنظمة ERP متخصصة لكل قطاع — جاهزة للتخصيص والتوصيل" : "Sector-specific ERP systems — ready to customize and deploy"}
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map(c => (
          <button key={c.key}
            onClick={() => setSelectedCat(c.key)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex-shrink-0 ${selectedCat === c.key ? "bg-black text-white" : "bg-black/[0.04] text-black/50 hover:bg-black/[0.08] hover:text-black/70"}`}
            data-testid={`filter-cat-${c.key}`}>
            {L ? c.label : c.labelEn}
          </button>
        ))}
      </div>

      {/* Templates grid */}
      {!selected ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(t => {
            const Icon = t.icon;
            return (
              <div key={t.id}
                onClick={() => setSelected(t)}
                className="group cursor-pointer border border-black/[0.07] rounded-2xl overflow-hidden hover:border-black/20 hover:shadow-md transition-all bg-white"
                data-testid={`card-system-${t.id}`}>
                {/* Card header */}
                <div className={`${t.color} p-5 relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-10">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="absolute rounded-full bg-white"
                        style={{ width: 40 + i * 10, height: 40 + i * 10, top: -10 + i * 5, right: -10 + i * 3, opacity: 0.05 + i * 0.01 }} />
                    ))}
                  </div>
                  <div className="relative">
                    <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    {t.badge && (
                      <span className="absolute top-0 left-0 text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-lg">
                        {t.badge}
                      </span>
                    )}
                    <h3 className="text-white font-black text-sm leading-tight">
                      {L ? t.name : t.nameEn}
                    </h3>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4">
                  <p className="text-xs text-black/40 leading-relaxed mb-3 line-clamp-2">
                    {L ? t.description : t.descriptionEn}
                  </p>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-1 mb-3">
                    {t.stats.map((s, i) => (
                      <div key={i} className="text-center bg-black/[0.02] rounded-lg py-1.5">
                        <p className="text-xs font-black text-black">{s.value}</p>
                        <p className="text-[9px] text-black/30 leading-tight">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Feature tags */}
                  <div className="flex flex-wrap gap-1">
                    {t.features.slice(0, 4).map((f, i) => {
                      const FIcon = f.icon;
                      return (
                        <span key={i} className="flex items-center gap-0.5 text-[10px] text-black/40 bg-black/[0.03] rounded-md px-1.5 py-0.5">
                          <FIcon className="w-2.5 h-2.5" /> {f.label}
                        </span>
                      );
                    })}
                    {t.features.length > 4 && (
                      <span className="text-[10px] text-black/30 px-1.5 py-0.5">+{t.features.length - 4}</span>
                    )}
                  </div>
                </div>

                <div className="border-t border-black/[0.05] px-4 py-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-black/30 font-medium">{L ? "عرض التفاصيل" : "View details"}</span>
                  <ChevronLeft className="w-3.5 h-3.5 text-black/20 group-hover:text-black/50 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* === Detail view === */
        <div className="space-y-5">
          <button onClick={() => setSelected(null)}
            className="flex items-center gap-1.5 text-xs text-black/40 hover:text-black transition-colors"
            data-testid="button-back-templates">
            <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
            {L ? "العودة إلى القائمة" : "Back to list"}
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left: Overview */}
            <div className="lg:col-span-2 space-y-4">
              {/* Hero */}
              <div className={`${selected.color} rounded-2xl p-6 relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="absolute rounded-full bg-white"
                      style={{ width: 60 + i * 20, height: 60 + i * 20, bottom: -20, right: -10 + i * 25, opacity: 0.05 + i * 0.01 }} />
                  ))}
                </div>
                <div className="relative flex items-start gap-4">
                  <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center flex-shrink-0">
                    {(() => { const Icon = selected.icon; return <Icon className="w-7 h-7 text-white" />; })()}
                  </div>
                  <div className="flex-1">
                    {selected.badge && (
                      <Badge className="mb-2 text-[10px] bg-white/20 text-white border-0">{selected.badge}</Badge>
                    )}
                    <h2 className="text-white font-black text-xl leading-tight mb-2">
                      {L ? selected.name : selected.nameEn}
                    </h2>
                    <p className="text-white/70 text-sm leading-relaxed">
                      {L ? selected.description : selected.descriptionEn}
                    </p>
                    <div className="flex gap-4 mt-4">
                      {selected.stats.map((s, i) => (
                        <div key={i}>
                          <p className="text-white font-black text-lg">{s.value}</p>
                          <p className="text-white/50 text-[10px]">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="border border-black/[0.07] rounded-2xl p-5">
                <h3 className="font-black text-black text-sm mb-3">{L ? "المميزات الرئيسية" : "Key Features"}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {selected.features.map((f, i) => {
                    const FIcon = f.icon;
                    return (
                      <div key={i} className="flex flex-col items-center text-center bg-black/[0.02] rounded-xl p-3 gap-2">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                          <FIcon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[11px] font-medium text-black/60">{f.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Screens */}
              <div className="border border-black/[0.07] rounded-2xl p-5">
                <h3 className="font-black text-black text-sm mb-3">{L ? "الشاشات المتضمنة" : "Included Screens"}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selected.screens.map((sc, i) => (
                    <div key={i} className="flex items-center gap-2 bg-black/[0.02] rounded-lg p-2.5">
                      <div className="w-5 h-5 bg-black rounded-md flex items-center justify-center flex-shrink-0">
                        <Monitor className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs text-black/60 font-medium">{sc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Modules + Actions */}
            <div className="space-y-4">
              {/* Modules list */}
              <div className="border border-black/[0.07] rounded-2xl p-5">
                <h3 className="font-black text-black text-sm mb-3">{L ? "الوحدات والمكونات" : "Modules & Components"}</h3>
                <div className="space-y-2">
                  {selected.modules.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-black/60">
                      <div className="w-4 h-4 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                      {m}
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="border border-black rounded-2xl p-5 bg-black text-white">
                <h3 className="font-black text-base mb-2">{L ? "ابدأ الآن" : "Get Started"}</h3>
                <p className="text-xs text-white/50 mb-4 leading-relaxed">
                  {L ? "سيتواصل معك فريقنا لبدء تخصيص النظام حسب احتياجاتك" : "Our team will contact you to customize this system for your needs"}
                </p>
                <Button className="w-full bg-white text-black hover:bg-white/90 rounded-xl font-bold text-sm h-10"
                  onClick={() => window.open("/contact", "_blank")}
                  data-testid="button-request-system">
                  {L ? "طلب هذا النظام" : "Request this system"}
                </Button>
                <Button variant="ghost" className="w-full text-white/50 hover:text-white rounded-xl text-xs h-9 mt-1"
                  onClick={() => window.open("/demos", "_blank")}
                  data-testid="button-view-demo">
                  {L ? "مشاهدة العرض التجريبي" : "View live demo"}
                </Button>
              </div>

              {/* Tech stack */}
              <div className="border border-black/[0.07] rounded-2xl p-4">
                <h3 className="font-black text-black text-xs mb-3 text-black/50 uppercase tracking-wide">{L ? "التقنيات المستخدمة" : "Tech Stack"}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {["React 18", "Node.js", "MongoDB", "TypeScript", "Tailwind", "WebSockets"].map(tech => (
                    <span key={tech} className="text-[10px] font-mono bg-black/[0.05] text-black/60 px-2 py-1 rounded-md">{tech}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
