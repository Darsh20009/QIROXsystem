import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import {
  Globe, Sparkles, Shield, Headphones, Clock, Palette,
  UtensilsCrossed, ShoppingBag, GraduationCap, Building2,
  Home, Heart, ChevronRight, Check, ArrowLeft, Layers,
  ShoppingCart, QrCode, Star, Users, BarChart3, CreditCard,
  BookOpen, Video, Award, FileText, Briefcase, MapPin,
  CalendarCheck, Stethoscope, Pill, Activity, Settings,
  Smartphone, Zap, Code2, Database, Bot, Tag, MessageSquare,
  TrendingUp, Package, Coffee, Utensils, ChefHat,
} from "lucide-react";

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } })
};

const SEGMENTS = [
  { key: "restaurant",  labelAr: "مطاعم ومقاهي",       icon: UtensilsCrossed, color: "from-orange-500 to-red-500",    bg: "bg-orange-50 dark:bg-orange-900/10",   text: "text-orange-600 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800/40" },
  { key: "ecommerce",   labelAr: "متاجر إلكترونية",     icon: ShoppingBag,     color: "from-blue-500 to-cyan-500",     bg: "bg-blue-50 dark:bg-blue-900/10",       text: "text-blue-600 dark:text-blue-400",   border: "border-blue-200 dark:border-blue-800/40" },
  { key: "education",   labelAr: "منصات تعليمية",       icon: GraduationCap,   color: "from-violet-500 to-purple-500", bg: "bg-violet-50 dark:bg-violet-900/10",   text: "text-violet-600 dark:text-violet-400", border: "border-violet-200 dark:border-violet-800/40" },
  { key: "corporate",   labelAr: "شركات ومؤسسات",       icon: Building2,       color: "from-slate-600 to-gray-700",    bg: "bg-slate-50 dark:bg-slate-900/10",     text: "text-slate-600 dark:text-slate-400",  border: "border-slate-200 dark:border-slate-800/40" },
  { key: "realestate",  labelAr: "عقارات",              icon: Home,            color: "from-teal-500 to-emerald-500",  bg: "bg-teal-50 dark:bg-teal-900/10",       text: "text-teal-600 dark:text-teal-400",   border: "border-teal-200 dark:border-teal-800/40" },
  { key: "healthcare",  labelAr: "صحة وعيادات",         icon: Heart,           color: "from-rose-500 to-pink-500",     bg: "bg-rose-50 dark:bg-rose-900/10",       text: "text-rose-600 dark:text-rose-400",   border: "border-rose-200 dark:border-rose-800/40" },
];

interface SystemCard {
  icon: any;
  title: string;
  description: string;
  features: string[];
  badge?: string;
  highlight?: boolean;
  locked?: boolean;
}

const SYSTEMS: Record<string, SystemCard[]> = {
  restaurant: [
    {
      icon: ChefHat,
      title: "نظام إدارة المطعم",
      description: "منصة متكاملة لإدارة القائمة والطلبات والطاولات بلحظة واحدة",
      features: ["قائمة رقمية تفاعلية", "إدارة الطلبات لحظة بلحظة", "نظام الطاولات والحجوزات", "تقارير المبيعات اليومية"],
      badge: "الأكثر طلباً",
      highlight: true,
    },
    {
      icon: QrCode,
      title: "قائمة QR كود",
      description: "منيو رقمي يُفتح بمسح كيو آر — بدون تطبيق، يعمل على أي هاتف",
      features: ["تحديث فوري للأسعار", "صور عالية الجودة", "متعدد اللغات", "تخصيص كامل للألوان والشعار"],
    },
    {
      icon: ShoppingCart,
      title: "نظام الطلب عبر الإنترنت",
      description: "استقبل الطلبات مباشرة من موقعك دون وسيط أو عمولة",
      features: ["طلب للتوصيل والاستلام", "تكامل مع WhatsApp", "دفع إلكتروني", "تتبع حالة الطلب"],
    },
    {
      icon: Coffee,
      title: "نظام الاشتراكات والبطاقات",
      description: "بناء قاعدة عملاء وفية عبر نظام اشتراكات وبطاقات الولاء",
      features: ["بطاقة الولاء الرقمية", "نقاط المكافآت", "باقات الاشتراك الشهري", "إشعارات العروض التلقائية"],
    },
    {
      icon: BarChart3,
      title: "لوحة تحكم المبيعات",
      description: "تقارير وإحصائيات شاملة لفهم أداء مطعمك بدقة",
      features: ["تقارير الأداء اليومي", "تحليل الأطباق الأكثر مبيعاً", "كشف الأوقات الذروة", "مقارنة الفروع"],
    },
    {
      icon: Smartphone,
      title: "تطبيق جوال للعملاء",
      description: "تطبيق iOS وAndroid باسم علامتك التجارية",
      features: ["طلب مباشر من التطبيق", "بوش نوتيفيكيشن للعروض", "سجل طلبات العميل", "نظام التقييمات"],
      badge: "خيار إضافي",
    },
  ],
  ecommerce: [
    {
      icon: ShoppingBag,
      title: "متجر إلكتروني متكامل",
      description: "متجر احترافي بتجربة تسوق سلسة ومحرك بحث ذكي",
      features: ["عرض المنتجات بالفئات", "محرك بحث وفلترة", "سلة التسوق الذكية", "متعدد العملات واللغات"],
      badge: "الأكثر طلباً",
      highlight: true,
    },
    {
      icon: CreditCard,
      title: "بوابة الدفع الإلكتروني",
      description: "تكامل مع كل طرق الدفع السعودية والعالمية",
      features: ["مدى، Apple Pay، STC Pay", "Stripe وPayPal", "تقسيط عبر تمارا وتابي", "حماية من الاحتيال"],
    },
    {
      icon: Package,
      title: "نظام إدارة المخزون",
      description: "تتبع المخزون والشحن تلقائياً مع تنبيهات الكمية",
      features: ["تتبع المخزون اللحظي", "باركود للمنتجات", "تكامل مع مستودعات الشحن", "تقارير المخزون"],
    },
    {
      icon: TrendingUp,
      title: "أدوات التسويق الرقمي",
      description: "أدوات مدمجة لزيادة المبيعات وتحسين الظهور في جوجل",
      features: ["SEO متقدم", "كوبونات الخصم", "بيع متقاطع ذكي", "تكامل Meta وGoogle Ads"],
    },
    {
      icon: Users,
      title: "إدارة العملاء (CRM)",
      description: "قاعدة بيانات عملاء مع سجل الطلبات والتفضيلات",
      features: ["ملف شامل لكل عميل", "سجل الطلبات كامل", "نقاط الولاء", "رسائل تسويقية مستهدفة"],
    },
    {
      icon: Bot,
      title: "مساعد ذكاء اصطناعي",
      description: "روبوت دردشة ذكي يرد على استفسارات العملاء 24/7",
      features: ["إجابات فورية", "تتبع الطلبات عبر الشات", "إحالة للدعم البشري", "تعلم تلقائي من المحادثات"],
      badge: "جديد",
    },
  ],
  education: [
    {
      icon: BookOpen,
      title: "منصة التعليم الإلكتروني (LMS)",
      description: "نظام إدارة محتوى تعليمي كامل مع تجربة طالب متميزة",
      features: ["رفع الدروس والمحاضرات", "تقدم الطالب والشهادات", "اختبارات وواجبات تفاعلية", "لوحة تحكم المعلم"],
      badge: "الأكثر طلباً",
      highlight: true,
    },
    {
      icon: Video,
      title: "البث المباشر والدروس المسجلة",
      description: "بث الدروس مباشرة أو تسجيلها للمشاهدة في أي وقت",
      features: ["بث مباشر متكامل", "تسجيل الدروس تلقائياً", "غرفة الأسئلة والأجوبة", "خدمة التقطير من YouTube/Zoom"],
    },
    {
      icon: Award,
      title: "نظام الشهادات الرقمية",
      description: "إصدار شهادات إتمام إلكترونية موثقة وقابلة للمشاركة",
      features: ["شهادات قابلة للتحقق", "رفع على LinkedIn", "تصميم بهوية منصتك", "أرشيف كامل للطلاب"],
    },
    {
      icon: CalendarCheck,
      title: "نظام حجز الجلسات الخاصة",
      description: "احجز جلسات تدريبية فردية مع المدربين بسهولة",
      features: ["تقويم المدرب", "إشعارات الحصص", "تكامل Zoom وMeet", "نظام الدفع قبل الحجز"],
    },
    {
      icon: Users,
      title: "بوابة أولياء الأمور",
      description: "متابعة تقدم الطالب من قِبل ولي الأمر بشكل شفاف",
      features: ["تقارير أداء الطالب", "إشعارات الغياب والنشاط", "التواصل مع المعلم", "دفع الرسوم إلكترونياً"],
    },
    {
      icon: Zap,
      title: "أكاديمية تحفيظ القرآن",
      description: "منصة متخصصة لتحفيظ القرآن الكريم مع نظام متابعة كاملة",
      features: ["تسجيل التلاوات الصوتية", "متابعة الحفظ يومياً", "نظام الإجازات الرقمي", "بوابة الطالب والمعلم"],
      badge: "متخصص",
    },
  ],
  corporate: [
    {
      icon: Building2,
      title: "موقع الشركة الاحترافي",
      description: "حضور رقمي قوي يعكس هوية ومكانة شركتك",
      features: ["تصميم متكيف مع الهوية البصرية", "صفحات الخدمات والإنجازات", "نماذج التواصل الذكية", "تحسين محركات البحث"],
      badge: "الأكثر طلباً",
      highlight: true,
    },
    {
      icon: Users,
      title: "نظام إدارة الموظفين (HR)",
      description: "نظام داخلي شامل لإدارة الموارد البشرية والرواتب",
      features: ["ملفات الموظفين الرقمية", "الحضور والإجازات", "كشف الرواتب التلقائي", "تقييمات الأداء"],
    },
    {
      icon: Briefcase,
      title: "نظام إدارة العملاء (CRM)",
      description: "تتبع العملاء المحتملين وصفقاتك من البداية للإغلاق",
      features: ["خط أنابيب المبيعات", "متابعة العملاء المحتملين", "تذكيرات المهام التلقائية", "تقارير الأداء"],
    },
    {
      icon: FileText,
      title: "بوابة التوثيق والعقود",
      description: "إدارة العقود والوثائق الرقمية بأمان وسهولة",
      features: ["توقيع إلكتروني", "أرشيف الوثائق", "صلاحيات الوصول", "تنبيهات انتهاء العقود"],
    },
    {
      icon: Globe,
      title: "البوابة الإلكترونية للعملاء",
      description: "بوابة خاصة لعملائك لمتابعة مشاريعهم وطلباتهم",
      features: ["بوابة دخول مخصصة", "متابعة حالة الطلبات", "مستودع الوثائق المشتركة", "نظام التذاكر والدعم"],
    },
    {
      icon: Database,
      title: "نظام ERP مؤسسي",
      description: "نظام متكامل يربط المبيعات والمخزون والمحاسبة في منصة واحدة",
      features: ["المبيعات والمشتريات", "المحاسبة والفواتير", "إدارة المخزون", "لوحات التحليل والتقارير"],
      locked: true,
    },
  ],
  realestate: [
    {
      icon: Home,
      title: "موقع عرض العقارات",
      description: "منصة احترافية لعرض وبيع وتأجير العقارات بتصميم جذاب",
      features: ["بحث متقدم بالموقع والسعر", "معرض صور وفيديو 360°", "خريطة تفاعلية", "نماذج استفسار ذكية"],
      badge: "الأكثر طلباً",
      highlight: true,
    },
    {
      icon: MapPin,
      title: "نظام إدارة العقارات",
      description: "نظام داخلي لإدارة محفظتك العقارية كاملاً",
      features: ["إدارة العقارات والوحدات", "عقود الإيجار الرقمية", "تتبع المدفوعات والإيرادات", "صيانة وبلاغات العملاء"],
    },
    {
      icon: CalendarCheck,
      title: "نظام حجز المعاينات",
      description: "يسمح للعملاء بحجز مواعيد المعاينة مباشرة من الموقع",
      features: ["تقويم المواعيد المتاحة", "تأكيد تلقائي عبر SMS/WhatsApp", "تذكيرات الموعد", "إلغاء وإعادة جدولة"],
    },
    {
      icon: Briefcase,
      title: "بوابة المستثمرين",
      description: "بوابة خاصة للمستثمرين لمتابعة عوائد محافظهم العقارية",
      features: ["تقارير العوائد الدورية", "وثائق الملكية الرقمية", "إشعارات دفع الإيجار", "رسوم بيانية للأداء"],
      locked: true,
    },
    {
      icon: BarChart3,
      title: "لوحة تحليلات السوق",
      description: "تقارير ذكية عن أداء السوق العقاري وتوجهاته",
      features: ["مقارنة أسعار المناطق", "نسبة الإشغال", "تقرير الطلب والعرض", "توقعات بالذكاء الاصطناعي"],
      locked: true,
    },
    {
      icon: Users,
      title: "نظام إدارة الوسطاء العقاريين",
      description: "منصة لإدارة فريق الوسطاء وتتبع أداء كل منهم",
      features: ["ملفات الوسطاء والعقارات المسندة", "لوحة أداء الوسيط", "عمولات تلقائية", "تدريب وموارد الوسيط"],
    },
  ],
  healthcare: [
    {
      icon: Stethoscope,
      title: "موقع العيادة أو المستشفى",
      description: "موقع طبي احترافي يبني ثقة المريض ويسهل التواصل",
      features: ["صفحات الأطباء والتخصصات", "نظام حجز المواعيد", "خريطة الوصول", "شهادات وإنجازات"],
      badge: "الأكثر طلباً",
      highlight: true,
    },
    {
      icon: CalendarCheck,
      title: "نظام حجز المواعيد الطبية",
      description: "احجز بأي وقت من أي مكان — دون الحاجة للاتصال",
      features: ["جدول الطبيب المتاح", "تذكيرات SMS وWhatsApp", "إلغاء وإعادة جدولة", "قائمة الانتظار الذكية"],
    },
    {
      icon: Activity,
      title: "ملف المريض الإلكتروني",
      description: "سجل طبي رقمي آمن يحمي بيانات مرضاك",
      features: ["تاريخ الزيارات والتشخيص", "الوصفات الطبية الرقمية", "نتائج التحاليل والأشعة", "خصوصية وأمان HIPAA"],
    },
    {
      icon: Pill,
      title: "نظام الصيدلية الإلكتروني",
      description: "إدارة المخزون الدوائي وطلبات الأدوية بذكاء",
      features: ["إدارة المخزون الدوائي", "تنبيهات انتهاء الصلاحية", "طلبات التوريد التلقائية", "سجل الوصفات الصادرة"],
    },
    {
      icon: MessageSquare,
      title: "نظام الاستشارات الطبية عن بعد",
      description: "تليميديسين — استشارة طبية فيديو من أي مكان",
      features: ["مكالمة فيديو مشفرة", "كتابة التشخيص خلال الجلسة", "الوصفة الإلكترونية بعد المكالمة", "أرشيف الاستشارات"],
      locked: true,
    },
    {
      icon: BarChart3,
      title: "لوحة تحليل أداء العيادة",
      description: "تقارير دقيقة عن إيرادات وأداء عيادتك",
      features: ["إيرادات يومية وشهرية", "أداء كل طبيب", "نسبة الحجوزات والإلغاء", "رضا المرضى"],
      locked: true,
    },
  ],
};

const CUSTOM_SYSTEMS = [
  { icon: Globe,        title: "مواقع الشركات",       color: "from-slate-500 to-gray-600" },
  { icon: ShoppingCart, title: "متاجر إلكترونية",      color: "from-blue-500 to-cyan-500" },
  { icon: BookOpen,     title: "منصات تعليمية",        color: "from-violet-500 to-purple-500" },
  { icon: Utensils,     title: "أنظمة المطاعم",        color: "from-orange-500 to-red-500" },
  { icon: Home,         title: "مواقع عقارية",         color: "from-teal-500 to-emerald-500" },
  { icon: Stethoscope,  title: "مواقع طبية",           color: "from-rose-500 to-pink-500" },
  { icon: Code2,        title: "أنظمة ERP/CRM",       color: "from-indigo-500 to-blue-600" },
  { icon: Bot,          title: "أنظمة بالذكاء الاصطناعي", color: "from-emerald-500 to-teal-500" },
  { icon: Smartphone,   title: "تطبيقات الجوال",       color: "from-amber-500 to-orange-500" },
  { icon: Database,     title: "لوحات تحكم وإدارة",   color: "from-cyan-500 to-sky-500" },
  { icon: Users,        title: "بوابات الموظفين",      color: "from-purple-500 to-fuchsia-500" },
  { icon: Star,         title: "وأي فكرة في بالك…",   color: "from-black to-gray-700" },
];

export default function Systems() {
  const { lang, dir } = useI18n();
  const [segment, setSegment] = useState("restaurant");
  const activeSegment = SEGMENTS.find(s => s.key === segment)!;
  const systems = SYSTEMS[segment] || [];

  const segLabels: Record<string, string> = {
    restaurant: lang === "ar" ? "مطاعم ومقاهي"     : "Restaurants & Cafes",
    ecommerce:  lang === "ar" ? "متاجر إلكترونية"   : "E-Commerce",
    education:  lang === "ar" ? "منصات تعليمية"     : "Education Platforms",
    corporate:  lang === "ar" ? "شركات ومؤسسات"     : "Corporate",
    realestate: lang === "ar" ? "عقارات"             : "Real Estate",
    healthcare: lang === "ar" ? "صحة وعيادات"        : "Health & Clinics",
  };

  const trustBadges = [
    { icon: Shield,     label: lang === "ar" ? "ضمان الجودة"     : "Quality Guarantee" },
    { icon: Headphones, label: lang === "ar" ? "دعم 24/7"         : "24/7 Support" },
    { icon: Clock,      label: lang === "ar" ? "تسليم في الموعد" : "On-Time Delivery" },
    { icon: Palette,    label: lang === "ar" ? "تصميم احترافي"   : "Professional Design" },
  ];

  const whyQirox = [
    { icon: Settings, title: lang === "ar" ? "تخصيص كامل" : "Full Customization", desc: lang === "ar" ? "كل نظام يُبنى خصيصاً لمشروعك — لا قوالب جاهزة" : "Every system is built specifically for your project — no templates" },
    { icon: Shield,   title: lang === "ar" ? "أمان وحماية" : "Security & Safety",  desc: lang === "ar" ? "بنية تحتية محمية مع نسخ احتياطية يومية" : "Protected infrastructure with daily backups" },
    { icon: Zap,      title: lang === "ar" ? "سرعة الأداء" : "High Performance",   desc: lang === "ar" ? "مواقع تُحمّل بأقل من ثانية على أي جهاز" : "Sites that load in under a second on any device" },
    { icon: Headphones, title: lang === "ar" ? "دعم مستمر" : "Ongoing Support",   desc: lang === "ar" ? "فريقنا معك بعد الإطلاق لضمان نجاح مشروعك" : "Our team is with you after launch to ensure project success" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950" dir={dir}>
      <Navigation />

      {/* Hero */}
      <section className="pt-36 pb-10 relative overflow-hidden">
        <PageGraphics variant="hero-light" />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute top-20 left-1/4 w-80 h-80 bg-violet-500/[0.04] rounded-full hidden md:block blur-3xl" />
        <div className="absolute top-32 right-1/4 w-60 h-60 bg-teal-500/[0.04] rounded-full hidden md:block blur-3xl" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.07] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.03] mb-6">
              <Code2 className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
              <span className="text-black/40 dark:text-white/40 text-xs tracking-wider">
                {lang === "ar" ? "ننفذ أي نظام رقمي لأي قطاع" : "We build any digital system for any sector"}
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-black font-heading text-black dark:text-white mb-4 tracking-tight">
              {lang === "ar"
                ? <>الأنظمة التي <span className="text-black/20 dark:text-white/20">نبنيها</span></>
                : <>Systems We <span className="text-black/20 dark:text-white/20">Build</span></>}
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-black/40 dark:text-white/40 text-base max-w-lg mx-auto mb-3 leading-relaxed">
              {lang === "ar"
                ? "اختر قطاعك واكتشف الأنظمة والمواقع التي نتخصص في تنفيذها — مع امكانية تنفيذ أي فكرة خارج القائمة"
                : "Choose your sector and discover the systems and websites we specialize in — with the ability to build any idea beyond the list"}
            </motion.p>

            {/* Trust badges */}
            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap justify-center gap-2.5 mb-10">
              {trustBadges.map(({ icon: Ic, label }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] rounded-full text-xs text-black/45 dark:text-white/45">
                  <Ic className="w-3 h-3" /> {label}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Segment Selector */}
      <section className="pb-6 container mx-auto px-4 max-w-5xl">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}>
          <p className="text-center text-xs font-semibold text-black/30 dark:text-white/30 uppercase tracking-widest mb-4">
            {lang === "ar" ? "اختر نوع مشروعك" : "Choose Your Project Type"}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5" data-testid="segment-selector">
            {SEGMENTS.map((seg) => {
              const Icon = seg.icon;
              const isActive = segment === seg.key;
              return (
                <button key={seg.key} onClick={() => setSegment(seg.key)} data-testid={`btn-segment-${seg.key}`}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 ${
                    isActive
                      ? `${seg.bg} ${seg.border} shadow-md scale-[1.03]`
                      : "border-black/[0.07] dark:border-white/[0.08] hover:border-black/15 dark:hover:border-white/15 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isActive ? `bg-gradient-to-br ${seg.color}` : "bg-black/[0.04] dark:bg-white/[0.06]"
                  }`}>
                    <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-black/40 dark:text-white/40"}`} />
                  </div>
                  <span className={`text-[11px] font-bold text-center leading-tight ${isActive ? seg.text : "text-black/45 dark:text-white/45"}`}>
                    {segLabels[seg.key] || seg.labelAr}
                  </span>
                  {isActive && (
                    <motion.div layoutId="seg-indicator" className={`absolute bottom-2 w-1.5 h-1.5 rounded-full bg-gradient-to-br ${seg.color}`} />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Active Segment Banner */}
      <div className="container mx-auto px-4 max-w-5xl mb-6">
        <AnimatePresence mode="wait">
          <motion.div key={segment} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className={`rounded-xl px-5 py-3 flex items-center gap-3 text-sm bg-gradient-to-r ${activeSegment.color} text-white`}
          >
            <activeSegment.icon className="w-4 h-4" />
            <span className="font-black">{segLabels[activeSegment.key] || activeSegment.labelAr}</span>
            <span className="opacity-60">—</span>
            <span className="opacity-80">
              {lang === "ar" ? "الأنظمة والحلول الرقمية التي ننفذها لهذا القطاع" : "Digital systems and solutions we implement for this sector"}
            </span>
            <Link href={`/prices?segment=${segment}`} className="mr-auto">
              <span className="text-[11px] font-black bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-lg flex items-center gap-1">
                {lang === "ar" ? "عرض الأسعار" : "View Pricing"} <ArrowLeft className="w-3 h-3 rotate-180" />
              </span>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* System Cards */}
      <section className="pb-16 container mx-auto px-4 max-w-5xl">
        <AnimatePresence mode="wait">
          <motion.div key={segment} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {systems.map((sys, idx) => {
              const Icon = sys.icon;
              return (
                <motion.div key={idx} variants={fadeUp} custom={idx} initial="hidden" animate="visible"
                  className={`relative rounded-2xl border p-6 flex flex-col gap-4 transition-all ${
                    sys.locked
                      ? "opacity-70 cursor-not-allowed bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.06] dark:border-white/[0.06]"
                      : `hover:-translate-y-0.5 hover:shadow-lg ${sys.highlight ? `${activeSegment.bg} ${activeSegment.border}` : "bg-white dark:bg-gray-900 border-black/[0.07] dark:border-white/[0.08]"}`
                  }`}
                  data-testid={`system-card-${idx}`}
                >
                  {sys.locked ? (
                    <span className="absolute top-4 left-4 text-[10px] font-black px-2.5 py-1 rounded-full bg-black/10 dark:bg-white/10 text-black/50 dark:text-white/50 flex items-center gap-1">
                      <span>🔒</span> {lang === "ar" ? "قريباً" : "Coming Soon"}
                    </span>
                  ) : sys.badge && (
                    <span className={`absolute top-4 left-4 text-[10px] font-black px-2.5 py-1 rounded-full bg-gradient-to-r ${activeSegment.color} text-white`}>
                      {sys.badge}
                    </span>
                  )}
                  <div>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${sys.locked ? "bg-black/[0.06] dark:bg-white/[0.06]" : `bg-gradient-to-br ${activeSegment.color}`}`}>
                      <Icon className={`w-5 h-5 ${sys.locked ? "text-black/30 dark:text-white/30" : "text-white"}`} />
                    </div>
                    <h3 className="text-base font-black text-black dark:text-white mb-1">{sys.title}</h3>
                    <p className="text-xs text-black/45 dark:text-white/45 leading-relaxed">{sys.description}</p>
                  </div>
                  <ul className="space-y-1.5 flex-1">
                    {sys.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2 text-[12px] text-black/60 dark:text-white/60">
                        <Check className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${sys.locked ? "text-black/20 dark:text-white/20" : activeSegment.text}`} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {sys.locked ? (
                    <div className="w-full h-9 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-black/[0.04] dark:bg-white/[0.04] text-black/30 dark:text-white/30 border border-black/[0.06] dark:border-white/[0.06] cursor-not-allowed select-none">
                      🔒 {lang === "ar" ? "غير متاح حالياً — قريباً" : "Not Available Yet — Coming Soon"}
                    </div>
                  ) : (
                    <Link href={`/order?segment=${segment}`}>
                      <Button size="sm" className={`w-full h-9 rounded-xl font-bold text-xs gap-1.5 bg-gradient-to-r ${activeSegment.color} text-white hover:opacity-90`}>
                        {lang === "ar" ? "اطلب هذا النظام" : "Order This System"} <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Any Website Section */}
      <section className="pb-16 container mx-auto px-4 max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          className="bg-black dark:bg-white rounded-3xl p-8 md:p-10 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 mb-5">
              <Sparkles className="w-3.5 h-3.5 text-white/60 dark:text-black/60" />
              <span className="text-white/60 dark:text-black/60 text-xs">
                {lang === "ar" ? "لا حدود لما ننفذه" : "No limits to what we build"}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white dark:text-black mb-3">
              {lang === "ar" ? "نبني أي موقع أو نظام تتخيله" : "We Build Any Website or System You Can Imagine"}
            </h2>
            <p className="text-white/50 dark:text-black/50 text-sm max-w-lg mx-auto mb-8 leading-relaxed">
              {lang === "ar"
                ? "القائمة فوق مجرد أمثلة — فريق QIROX ينفذ أي فكرة رقمية من الصفر، مهما كانت طبيعة مشروعك"
                : "The list above is just examples — the QIROX team executes any digital idea from scratch, no matter the nature of your project"}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-8">
              {CUSTOM_SYSTEMS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-white/60 dark:text-black/60 text-center leading-tight">{s.title}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/consultation">
                <Button className="bg-white dark:bg-black text-black dark:text-white hover:bg-white/90 dark:hover:bg-black/90 font-bold text-sm px-6 h-11 rounded-xl gap-2">
                  <CalendarCheck className="w-4 h-4" />
                  {lang === "ar" ? "احجز استشارة مجانية" : "Book Free Consultation"}
                </Button>
              </Link>
              <Link href="/prices">
                <Button variant="outline" className="border-white/20 dark:border-black/20 text-white dark:text-black hover:bg-white/10 dark:hover:bg-black/10 font-bold text-sm px-6 h-11 rounded-xl gap-2">
                  <Tag className="w-4 h-4" />
                  {lang === "ar" ? "عرض الأسعار" : "View Pricing"}
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Why Qirox */}
      <section className="pb-16 container mx-auto px-4 max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-8">
          <h2 className="text-2xl font-black font-heading text-black dark:text-white mb-2">
            {lang === "ar" ? "لماذا QIROX؟" : "Why QIROX?"}
          </h2>
          <p className="text-black/40 dark:text-white/40 text-sm">
            {lang === "ar" ? "ما يميزنا في كل نظام نبنيه" : "What sets us apart in every system we build"}
          </p>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {whyQirox.map(({ icon: Ic, title, desc }, i) => (
            <motion.div key={i} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-5 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center mx-auto mb-3">
                <Ic className="w-5 h-5 text-black/40 dark:text-white/40" />
              </div>
              <h3 className="text-sm font-black text-black dark:text-white mb-1">{title}</h3>
              <p className="text-[11px] text-black/40 dark:text-white/40 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
