import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useSEO } from "@/hooks/use-seo";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useCurrency } from "@/hooks/use-currency";
import {
  Check, Zap, Star, Crown, Infinity as InfinityIcon, Globe, Sparkles,
  UtensilsCrossed, ShoppingBag, Building2, GraduationCap, Heart, Home,
  Smartphone, Shield, BarChart3, Bell, Layers, Rocket, MessageSquare,
  Copy, X, Send, Loader2, ChevronRight, ChevronDown, Phone, Mail,
  User, Calendar, CalendarRange, CalendarDays, Bot, CheckCircle2,
  ArrowRight, ExternalLink, Tag, Palette, Lock, TrendingUp, Database,
  Server, LayoutDashboard, Dumbbell, Store, Users, MessageCircle,
  Minus, Plus, ScanLine, ClipboardList, ReceiptText, Printer, Truck,
  CreditCard, Award, Apple, PlayCircle, Gift, Clock, ChevronLeft,
  QrCode, ChefHat, BookOpen, Video, MapPin, CalendarCheck, Stethoscope,
  Pill, Activity, Package, Coffee, Utensils, Code2, Briefcase, FileText,
  ShoppingCart, Wrench,
} from "lucide-react";
import { Input } from "@/components/ui/input";

/* ─── Pricing Data ────────────────────────────────────────────────────── */
/* These prices match the original prices used in the employee/admin system
   (seeded in server/routes.ts). Each sector has lite/pro/infinity tiers
   with sm (6-month), yr (annual) and life (lifetime) prices. */
const PRICES = {
  restaurant: { lite: { sm: 399,  yr: 899,  life: 5299  }, pro: { sm: 799,  yr: 1699, life: 9299  }, infinity: { sm: 1699, yr: 3299, life: 17299 } },
  ecommerce:  { lite: { sm: 649,  yr: 1349, life: 7599  }, pro: { sm: 1249, yr: 2399, life: 12799 }, infinity: { sm: 2399, yr: 4499, life: 23799 } },
  education:  { lite: { sm: 899,  yr: 1749, life: 9599  }, pro: { sm: 1699, yr: 3199, life: 16799 }, infinity: { sm: 3099, yr: 5799, life: 29799 } },
  healthcare: { lite: { sm: 649,  yr: 1349, life: 7599  }, pro: { sm: 1249, yr: 2399, life: 12799 }, infinity: { sm: 2399, yr: 4499, life: 23799 } },
  realestate: { lite: { sm: 649,  yr: 1349, life: 7599  }, pro: { sm: 1249, yr: 2399, life: 12799 }, infinity: { sm: 2399, yr: 4499, life: 23799 } },
  corporate:  { lite: { sm: 1249, yr: 2399, life: 12799 }, pro: { sm: 2599, yr: 4899, life: 25299 }, infinity: { sm: 5399, yr: 9999, life: 50799 } },
  fitness:    { lite: { sm: 649,  yr: 1349, life: 7599  }, pro: { sm: 1249, yr: 2399, life: 12799 }, infinity: { sm: 2399, yr: 4499, life: 23799 } },
  beauty:     { lite: { sm: 399,  yr: 899,  life: 5299  }, pro: { sm: 799,  yr: 1699, life: 9299  }, infinity: { sm: 1699, yr: 3299, life: 17299 } },
  events:     { lite: { sm: 649,  yr: 1349, life: 7599  }, pro: { sm: 1249, yr: 2399, life: 12799 }, infinity: { sm: 2399, yr: 4499, life: 23799 } },
  marketing:  { lite: { sm: 899,  yr: 1749, life: 9599  }, pro: { sm: 1699, yr: 3199, life: 16799 }, infinity: { sm: 3099, yr: 5799, life: 29799 } },
  ai:         { lite: { sm: 1249, yr: 2399, life: 12799 }, pro: { sm: 2599, yr: 4899, life: 25299 }, infinity: { sm: 5399, yr: 9999, life: 50799 } },
  other:      { lite: { sm: 0,    yr: 0,    life: 0     }, pro: { sm: 0,    yr: 0,    life: 0     }, infinity: { sm: 0,    yr: 0,    life: 0     } },
} as const;
type SectorKey = keyof typeof PRICES;
function multiYearPrice(annual: number, years: number) {
  let total = 0;
  for (let i = 0; i < years; i++) total += annual * Math.max(1 - i * 0.05, 0.6);
  return Math.round(total);
}
function multiYearDiscount(years: number) { return Math.min((years - 1) * 5, 40); }

/* ─── Features ────────────────────────────────────────────────────────── */
const RESTAURANT_FEATURES = {
  lite: [
    { icon: Globe,           ar: "موقع العميل الاحترافي" },
    { icon: LayoutDashboard, ar: "نظام إدارة الطاولات" },
    { icon: ScanLine,        ar: "نظام نقاط البيع (POS)" },
    { icon: Printer,         ar: "نظام طباعة الفواتير والطلبات" },
    { icon: Truck,           ar: "نظام تتبع الطلبات" },
    { icon: Layers,          ar: "الميزات الأساسية للنظام" },
  ],
  pro: [
    { icon: Zap,            ar: "كل مميزات لايت ✦" },
    { icon: BarChart3,      ar: "نظام المحاسبة المتكاملة" },
    { icon: Award,          ar: "نظام الولاء والنقاط" },
    { icon: Apple,          ar: "إضافة لـ Apple Wallet" },
    { icon: Users,          ar: "إدارة العملاء المتكاملة" },
    { icon: Star,           ar: "نظام التقييمات والمراجعات" },
    { icon: Layers,         ar: "نظام الـ Integrations" },
    { icon: CreditCard,     ar: "بوابة دفع إلكترونية مجانية" },
    { icon: Smartphone,     ar: "تطبيق PWA (ويب تطبيق)" },
    { icon: Bell,           ar: "إشعارات فورية (Push)" },
    { icon: Mail,           ar: "1,000 رسالة بريدية شهرياً" },
    { icon: CheckCircle2,   ar: "5 تعديلات ما بعد التسليم" },
  ],
  infinity: [
    { icon: Star,           ar: "كل مميزات برو ✦✦" },
    { icon: Mail,           ar: "5 بريد باسم المطعم/الكافيه" },
    { icon: MessageCircle,  ar: "10,000 رسالة بريدية شهرياً" },
    { icon: Building2,      ar: "توافق نظام الحضور والإدارة المؤسسية" },
    { icon: Database,       ar: "نظام مخزون وتقارير متقدمة" },
    { icon: Shield,         ar: "دعم أولوية 24/7 ومدير حساب مخصص" },
    { icon: Rocket,         ar: "20 تطوير/ميزة ما بعد التسليم" },
  ],
};
const ECOMMERCE_FEATURES = {
  lite: [
    { icon: Globe,           ar: "موقع متجر إلكتروني احترافي" },
    { icon: ShoppingBag,     ar: "نظام إدارة المنتجات والمخزون" },
    { icon: ReceiptText,     ar: "سلة التسوق وإدارة الطلبات" },
    { icon: Printer,         ar: "نظام طباعة الفواتير" },
    { icon: Truck,           ar: "نظام تتبع وشحن الطلبات" },
    { icon: Layers,          ar: "الميزات الأساسية للمتجر" },
  ],
  pro: [
    { icon: Zap,            ar: "كل مميزات لايت ✦" },
    { icon: BarChart3,      ar: "نظام المحاسبة والتقارير" },
    { icon: Award,          ar: "نظام الولاء والكوبونات" },
    { icon: Apple,          ar: "إضافة لـ Apple Wallet" },
    { icon: Users,          ar: "إدارة العملاء المتكاملة" },
    { icon: Star,           ar: "نظام التقييمات والمراجعات" },
    { icon: Layers,         ar: "نظام الـ Integrations" },
    { icon: CreditCard,     ar: "بوابة دفع إلكترونية مجانية" },
    { icon: Smartphone,     ar: "تطبيق PWA (ويب تطبيق)" },
    { icon: Bell,           ar: "إشعارات للطلبات الجديدة" },
    { icon: Mail,           ar: "1,000 رسالة بريدية شهرياً" },
    { icon: CheckCircle2,   ar: "5 تعديلات ما بعد التسليم" },
  ],
  infinity: [
    { icon: Star,           ar: "كل مميزات برو ✦✦" },
    { icon: Mail,           ar: "5 بريد باسم المتجر" },
    { icon: MessageCircle,  ar: "10,000 رسالة بريدية شهرياً" },
    { icon: Database,       ar: "نظام مخزون متكامل متقدم" },
    { icon: BarChart3,      ar: "تقارير وتحليلات متقدمة" },
    { icon: Shield,         ar: "دعم أولوية 24/7 ومدير حساب مخصص" },
    { icon: Rocket,         ar: "20 تطوير/ميزة ما بعد التسليم" },
  ],
};

const LIFETIME_PERKS = [
  { icon: Globe,    ar: "نطاق مجاني لمدة 3 سنوات" },
  { icon: Shield,   ar: "دعم تقني مستمر 3 سنوات من التسليم" },
  { icon: Server,   ar: "استضافة على خوادم كيروكس مدى الحياة" },
  { icon: Clock,    ar: "متابعة شخصية بعد 3 سنوات بـ 100 ريال/سنة فقط" },
];

const OTHER_SECTORS: { key: SectorKey; icon: any; ar: string }[] = [
  { key: "education",    icon: GraduationCap, ar: "تعليم وأكاديميات" },
  { key: "healthcare",   icon: Heart,         ar: "صحة وعيادات" },
  { key: "realestate",   icon: Home,          ar: "عقارات" },
  { key: "corporate",    icon: Building2,     ar: "شركات ومؤسسات" },
  { key: "fitness",      icon: Dumbbell,      ar: "لياقة وجيم" },
  { key: "beauty",       icon: Sparkles,      ar: "تجميل وصالونات" },
  { key: "events",       icon: Calendar,      ar: "فعاليات ومناسبات" },
  { key: "marketing",    icon: TrendingUp,    ar: "وكالات التسويق" },
  { key: "ai",           icon: Bot,           ar: "ذكاء اصطناعي" },
  { key: "other",        icon: Globe,         ar: "قطاع آخر" },
];

/* ─── Sector-Specific Feature Lists ──────────────────────────────────── */

const EDUCATION_FEATURES = {
  lite: [
    { icon: Globe,           ar: "موقع أكاديمية/مدرسة احترافي" },
    { icon: Users,           ar: "إدارة الطلاب والمجموعات" },
    { icon: ClipboardList,   ar: "نظام الحضور والغياب" },
    { icon: BookOpen,        ar: "إدارة المناهج والمحتوى" },
    { icon: CalendarDays,    ar: "جداول الحصص الذكية" },
    { icon: Layers,          ar: "الميزات الأساسية للنظام" },
  ],
  pro: [
    { icon: Zap,            ar: "كل مميزات لايت ✦" },
    { icon: CreditCard,     ar: "نظام الفواتير والرسوم الدراسية" },
    { icon: MessageSquare,  ar: "بوابة أولياء الأمور" },
    { icon: Award,          ar: "شهادات رقمية تلقائية" },
    { icon: BarChart3,      ar: "تقارير أداء الطلاب التفصيلية" },
    { icon: ClipboardList,  ar: "نظام الواجبات والتقييمات" },
    { icon: CreditCard,     ar: "بوابة دفع إلكترونية" },
    { icon: Smartphone,     ar: "تطبيق PWA (ويب تطبيق)" },
    { icon: Bell,           ar: "إشعارات فورية (Push)" },
    { icon: Mail,           ar: "1,000 رسالة بريدية شهرياً" },
    { icon: CheckCircle2,   ar: "5 تعديلات ما بعد التسليم" },
  ],
  infinity: [
    { icon: Star,           ar: "كل مميزات برو ✦✦" },
    { icon: Mail,           ar: "5 بريد باسم الأكاديمية" },
    { icon: MessageCircle,  ar: "10,000 رسالة بريدية شهرياً" },
    { icon: Video,          ar: "نظام LMS للدراسة الأونلاين" },
    { icon: Database,       ar: "أرشيف رقمي كامل للطلاب" },
    { icon: Shield,         ar: "دعم أولوية 24/7 ومدير حساب مخصص" },
    { icon: Rocket,         ar: "20 تطوير/ميزة ما بعد التسليم" },
  ],
};

const HEALTHCARE_FEATURES = {
  lite: [
    { icon: Globe,           ar: "موقع عيادة/مركز طبي احترافي" },
    { icon: FileText,        ar: "الملف الطبي الإلكتروني للمرضى" },
    { icon: Calendar,        ar: "نظام الحجز والمواعيد الذكي" },
    { icon: Stethoscope,     ar: "وصفات إلكترونية قابلة للطباعة" },
    { icon: Users,           ar: "إدارة الأطباء والأخصائيين" },
    { icon: Layers,          ar: "الميزات الأساسية للنظام" },
  ],
  pro: [
    { icon: Zap,            ar: "كل مميزات لايت ✦" },
    { icon: CreditCard,     ar: "نظام الفواتير والتأمين الطبي" },
    { icon: Users,          ar: "قائمة انتظار ذكية بالوقت المتبقي" },
    { icon: Bell,           ar: "تذكيرات المواعيد التلقائية" },
    { icon: Activity,       ar: "متابعة الحالة الصحية للمرضى" },
    { icon: BarChart3,      ar: "تقارير الإشغال والأداء" },
    { icon: CreditCard,     ar: "بوابة دفع إلكترونية" },
    { icon: Smartphone,     ar: "تطبيق PWA (ويب تطبيق)" },
    { icon: Bell,           ar: "إشعارات فورية (Push)" },
    { icon: Mail,           ar: "1,000 رسالة بريدية شهرياً" },
    { icon: CheckCircle2,   ar: "5 تعديلات ما بعد التسليم" },
  ],
  infinity: [
    { icon: Star,           ar: "كل مميزات برو ✦✦" },
    { icon: Mail,           ar: "5 بريد باسم العيادة/المركز" },
    { icon: MessageCircle,  ar: "10,000 رسالة بريدية شهرياً" },
    { icon: Package,        ar: "إدارة مستودع الأدوية والمستلزمات" },
    { icon: Database,       ar: "تشفير كامل وأرشفة بيانات المرضى" },
    { icon: Shield,         ar: "دعم أولوية 24/7 ومدير حساب مخصص" },
    { icon: Rocket,         ar: "20 تطوير/ميزة ما بعد التسليم" },
  ],
};

const REALESTATE_FEATURES = {
  lite: [
    { icon: Globe,           ar: "موقع عقاري احترافي" },
    { icon: Building2,       ar: "إدارة العقارات والوحدات" },
    { icon: FileText,        ar: "إدارة العقود والإيجارات" },
    { icon: Users,           ar: "ملفات المستأجرين والملاك" },
    { icon: MapPin,          ar: "خريطة وتفاصيل العقارات" },
    { icon: Layers,          ar: "الميزات الأساسية للنظام" },
  ],
  pro: [
    { icon: Zap,            ar: "كل مميزات لايت ✦" },
    { icon: BarChart3,      ar: "تقارير العائد والإشغال (ROI)" },
    { icon: Globe,          ar: "بوابة المالك والمستأجر" },
    { icon: Bell,           ar: "تنبيهات انتهاء العقود والدفع" },
    { icon: CreditCard,     ar: "نظام تحصيل الإيجارات الذكي" },
    { icon: Wrench,         ar: "طلبات الصيانة والمتابعة" },
    { icon: CreditCard,     ar: "بوابة دفع إلكترونية" },
    { icon: Smartphone,     ar: "تطبيق PWA (ويب تطبيق)" },
    { icon: Bell,           ar: "إشعارات فورية (Push)" },
    { icon: Mail,           ar: "1,000 رسالة بريدية شهرياً" },
    { icon: CheckCircle2,   ar: "5 تعديلات ما بعد التسليم" },
  ],
  infinity: [
    { icon: Star,           ar: "كل مميزات برو ✦✦" },
    { icon: Mail,           ar: "5 بريد باسم الشركة العقارية" },
    { icon: MessageCircle,  ar: "10,000 رسالة بريدية شهرياً" },
    { icon: Database,       ar: "تكامل مع منصة إيجار الحكومية" },
    { icon: Building2,      ar: "إدارة محافظ عقارية متعددة" },
    { icon: Shield,         ar: "دعم أولوية 24/7 ومدير حساب مخصص" },
    { icon: Rocket,         ar: "20 تطوير/ميزة ما بعد التسليم" },
  ],
};

const CORPORATE_FEATURES = {
  lite: [
    { icon: Globe,           ar: "موقع شركة/مؤسسة احترافي" },
    { icon: Users,           ar: "إدارة الموظفين والأقسام" },
    { icon: Briefcase,       ar: "نظام إدارة المشاريع والمهام" },
    { icon: Code2,           ar: "قاعدة بيانات العملاء (CRM)" },
    { icon: FileText,        ar: "إدارة المستندات والعقود" },
    { icon: Layers,          ar: "الميزات الأساسية للنظام" },
  ],
  pro: [
    { icon: Zap,            ar: "كل مميزات لايت ✦" },
    { icon: BarChart3,      ar: "نظام الفواتير والمحاسبة" },
    { icon: TrendingUp,     ar: "تقارير الأداء والمبيعات" },
    { icon: Clock,          ar: "نظام الحضور والإجازات" },
    { icon: Calendar,       ar: "إدارة المواعيد والاجتماعات" },
    { icon: Award,          ar: "بوابة العملاء الذاتية" },
    { icon: CreditCard,     ar: "بوابة دفع إلكترونية" },
    { icon: Smartphone,     ar: "تطبيق PWA (ويب تطبيق)" },
    { icon: Bell,           ar: "إشعارات فورية (Push)" },
    { icon: Mail,           ar: "1,000 رسالة بريدية شهرياً" },
    { icon: CheckCircle2,   ar: "5 تعديلات ما بعد التسليم" },
  ],
  infinity: [
    { icon: Star,           ar: "كل مميزات برو ✦✦" },
    { icon: Mail,           ar: "5 بريد مؤسسي باسم الشركة" },
    { icon: MessageCircle,  ar: "10,000 رسالة بريدية شهرياً" },
    { icon: Database,       ar: "نظام ERP وإدارة مؤسسية متكاملة" },
    { icon: Building2,      ar: "إدارة الفروع والمكاتب المتعددة" },
    { icon: Shield,         ar: "دعم أولوية 24/7 ومدير حساب مخصص" },
    { icon: Rocket,         ar: "20 تطوير/ميزة ما بعد التسليم" },
  ],
};

const FITNESS_FEATURES = {
  lite: [
    { icon: Globe,           ar: "موقع جيم/نادي رياضي احترافي" },
    { icon: CreditCard,      ar: "إدارة العضويات والباقات" },
    { icon: CalendarDays,    ar: "جدولة الحصص الجماعية" },
    { icon: Users,           ar: "ملفات الأعضاء الصحية" },
    { icon: QrCode,          ar: "دخول ذكي بـ QR/باركود" },
    { icon: Layers,          ar: "الميزات الأساسية للنظام" },
  ],
  pro: [
    { icon: Zap,            ar: "كل مميزات لايت ✦" },
    { icon: Activity,       ar: "تتبع قياسات اللياقة والأهداف" },
    { icon: Users,          ar: "لوحة المدرب الشخصي وعملائه" },
    { icon: Award,          ar: "نظام الولاء والمكافآت" },
    { icon: Bell,           ar: "تذكيرات التجديد والحصص" },
    { icon: BarChart3,      ar: "تقارير الحضور والإيرادات" },
    { icon: CreditCard,     ar: "بوابة دفع إلكترونية" },
    { icon: Smartphone,     ar: "تطبيق PWA (ويب تطبيق)" },
    { icon: Bell,           ar: "إشعارات فورية (Push)" },
    { icon: Mail,           ar: "1,000 رسالة بريدية شهرياً" },
    { icon: CheckCircle2,   ar: "5 تعديلات ما بعد التسليم" },
  ],
  infinity: [
    { icon: Star,           ar: "كل مميزات برو ✦✦" },
    { icon: Mail,           ar: "5 بريد باسم النادي/الجيم" },
    { icon: MessageCircle,  ar: "10,000 رسالة بريدية شهرياً" },
    { icon: Lock,           ar: "تحكم بالبوابات الإلكترونية" },
    { icon: Building2,      ar: "إدارة متعددة الفروع والأندية" },
    { icon: Shield,         ar: "دعم أولوية 24/7 ومدير حساب مخصص" },
    { icon: Rocket,         ar: "20 تطوير/ميزة ما بعد التسليم" },
  ],
};

const BEAUTY_FEATURES = {
  lite: [
    { icon: Globe,           ar: "موقع صالون/سبا احترافي" },
    { icon: CalendarCheck,   ar: "نظام الحجوزات الذكي أونلاين" },
    { icon: Users,           ar: "إدارة الفنيين والغرف" },
    { icon: FileText,        ar: "ملف العميل والتفضيلات التفصيلية" },
    { icon: Tag,             ar: "كتالوج الخدمات والأسعار" },
    { icon: Layers,          ar: "الميزات الأساسية للنظام" },
  ],
  pro: [
    { icon: Zap,            ar: "كل مميزات لايت ✦" },
    { icon: Bell,           ar: "تذكيرات المواعيد التلقائية (SMS/واتساب)" },
    { icon: BarChart3,      ar: "حساب عمولة الفنيين تلقائياً" },
    { icon: Package,        ar: "مخزون منتجات الصالون" },
    { icon: Award,          ar: "نظام الولاء والعروض الخاصة" },
    { icon: Star,           ar: "تقارير الفنيين والخدمات الأكثر طلباً" },
    { icon: CreditCard,     ar: "بوابة دفع إلكترونية" },
    { icon: Smartphone,     ar: "تطبيق PWA (ويب تطبيق)" },
    { icon: Bell,           ar: "إشعارات فورية (Push)" },
    { icon: Mail,           ar: "1,000 رسالة بريدية شهرياً" },
    { icon: CheckCircle2,   ar: "5 تعديلات ما بعد التسليم" },
  ],
  infinity: [
    { icon: Star,           ar: "كل مميزات برو ✦✦" },
    { icon: Mail,           ar: "5 بريد باسم الصالون" },
    { icon: MessageCircle,  ar: "10,000 رسالة بريدية شهرياً" },
    { icon: Building2,      ar: "إدارة متعددة الفروع والصالونات" },
    { icon: Database,       ar: "تقارير وتحليلات متقدمة للأعمال" },
    { icon: Shield,         ar: "دعم أولوية 24/7 ومدير حساب مخصص" },
    { icon: Rocket,         ar: "20 تطوير/ميزة ما بعد التسليم" },
  ],
};

const EVENTS_FEATURES = {
  lite: [
    { icon: Globe,           ar: "موقع فعاليات/مناسبات احترافي" },
    { icon: Calendar,        ar: "إدارة الفعاليات والمواعيد" },
    { icon: Tag,             ar: "نظام تذاكر وحجوزات أونلاين" },
    { icon: Users,           ar: "إدارة قوائم الضيوف والمدعوين" },
    { icon: MapPin,          ar: "إدارة الأماكن والقاعات" },
    { icon: Layers,          ar: "الميزات الأساسية للنظام" },
  ],
  pro: [
    { icon: Zap,            ar: "كل مميزات لايت ✦" },
    { icon: QrCode,         ar: "دخول الضيوف بـ QR بدون طابور" },
    { icon: Briefcase,      ar: "إدارة الرعاة والشركاء" },
    { icon: BarChart3,      ar: "تقارير الفعالية والحضور" },
    { icon: ReceiptText,    ar: "نظام الفواتير والعروض المالية" },
    { icon: Bell,           ar: "تذكيرات وإشعارات المدعوين" },
    { icon: CreditCard,     ar: "بوابة دفع إلكترونية" },
    { icon: Smartphone,     ar: "تطبيق PWA (ويب تطبيق)" },
    { icon: Bell,           ar: "إشعارات فورية (Push)" },
    { icon: Mail,           ar: "1,000 رسالة بريدية شهرياً" },
    { icon: CheckCircle2,   ar: "5 تعديلات ما بعد التسليم" },
  ],
  infinity: [
    { icon: Star,           ar: "كل مميزات برو ✦✦" },
    { icon: Mail,           ar: "5 بريد باسم الشركة/الفعالية" },
    { icon: MessageCircle,  ar: "10,000 رسالة بريدية شهرياً" },
    { icon: Video,          ar: "نظام RSVP وإدارة الردود المتقدمة" },
    { icon: Database,       ar: "تقارير تحليلية شاملة للفعاليات" },
    { icon: Shield,         ar: "دعم أولوية 24/7 ومدير حساب مخصص" },
    { icon: Rocket,         ar: "20 تطوير/ميزة ما بعد التسليم" },
  ],
};

const MARKETING_FEATURES = {
  lite: [
    { icon: Globe,           ar: "موقع وكالة تسويق احترافي" },
    { icon: Users,           ar: "بوابة عملاء مخصصة" },
    { icon: TrendingUp,      ar: "إدارة الحملات التسويقية" },
    { icon: CalendarDays,    ar: "تقويم المحتوى والنشر" },
    { icon: BarChart3,       ar: "تقارير الأداء الأساسية" },
    { icon: Layers,          ar: "الميزات الأساسية للنظام" },
  ],
  pro: [
    { icon: Zap,            ar: "كل مميزات لايت ✦" },
    { icon: Code2,          ar: "نظام CRM وإدارة العملاء" },
    { icon: Globe,          ar: "أدوات SEO ومحركات البحث" },
    { icon: BarChart3,      ar: "لوحة تحليلات التسويق الشاملة" },
    { icon: FileText,       ar: "إدارة التقارير الشهرية للعملاء" },
    { icon: Award,          ar: "نظام المهام والتسليمات" },
    { icon: CreditCard,     ar: "بوابة دفع إلكترونية" },
    { icon: Smartphone,     ar: "تطبيق PWA (ويب تطبيق)" },
    { icon: Bell,           ar: "إشعارات فورية (Push)" },
    { icon: Mail,           ar: "1,000 رسالة بريدية شهرياً" },
    { icon: CheckCircle2,   ar: "5 تعديلات ما بعد التسليم" },
  ],
  infinity: [
    { icon: Star,           ar: "كل مميزات برو ✦✦" },
    { icon: Mail,           ar: "5 بريد باسم الوكالة" },
    { icon: MessageCircle,  ar: "10,000 رسالة بريدية شهرياً" },
    { icon: Sparkles,       ar: "تقارير ذكاء اصطناعي ومتقدمة" },
    { icon: Database,       ar: "داشبورد White-Label للعملاء" },
    { icon: Shield,         ar: "دعم أولوية 24/7 ومدير حساب مخصص" },
    { icon: Rocket,         ar: "20 تطوير/ميزة ما بعد التسليم" },
  ],
};

const AI_FEATURES = {
  lite: [
    { icon: Globe,           ar: "موقع منصة ذكاء اصطناعي احترافي" },
    { icon: Bot,             ar: "روبوت محادثة مخصص (AI Chatbot)" },
    { icon: Database,        ar: "قاعدة معرفة ذكية قابلة للتدريب" },
    { icon: BarChart3,       ar: "لوحة إحصائيات المحادثات" },
    { icon: Lock,            ar: "إدارة المستخدمين والصلاحيات" },
    { icon: Layers,          ar: "الميزات الأساسية للنظام" },
  ],
  pro: [
    { icon: Zap,            ar: "كل مميزات لايت ✦" },
    { icon: Sparkles,       ar: "نماذج AI مخصصة للقطاع" },
    { icon: Layers,         ar: "تكامل مع أنظمة خارجية (API)" },
    { icon: BarChart3,      ar: "تحليلات متقدمة للمحادثات والأداء" },
    { icon: Users,          ar: "لوحة تحكم متعددة المستخدمين" },
    { icon: Shield,         ar: "تشفير كامل وحماية البيانات" },
    { icon: CreditCard,     ar: "بوابة دفع إلكترونية" },
    { icon: Smartphone,     ar: "تطبيق PWA (ويب تطبيق)" },
    { icon: Bell,           ar: "إشعارات فورية (Push)" },
    { icon: Mail,           ar: "1,000 رسالة بريدية شهرياً" },
    { icon: CheckCircle2,   ar: "5 تعديلات ما بعد التسليم" },
  ],
  infinity: [
    { icon: Star,           ar: "كل مميزات برو ✦✦" },
    { icon: Mail,           ar: "5 بريد باسم المنصة" },
    { icon: MessageCircle,  ar: "10,000 رسالة بريدية شهرياً" },
    { icon: Bot,            ar: "تدريب نماذج مخصصة غير محدود" },
    { icon: Server,         ar: "استضافة نماذج AI خاصة" },
    { icon: Shield,         ar: "دعم أولوية 24/7 ومدير حساب مخصص" },
    { icon: Rocket,         ar: "20 تطوير/ميزة ما بعد التسليم" },
  ],
};

/* ─── Generic Features for "Other" Sector ─────────────────────────────── */
const GENERIC_FEATURES = {
  lite: [
    { icon: Globe,           ar: "موقع احترافي مخصص للقطاع" },
    { icon: LayoutDashboard, ar: "لوحة تحكم متكاملة" },
    { icon: Layers,          ar: "الميزات الأساسية للنظام" },
    { icon: Smartphone,      ar: "تصميم متجاوب لكل الأجهزة" },
    { icon: Shield,          ar: "SSL مجاني وحماية كاملة" },
    { icon: CheckCircle2,    ar: "دعم فني شهرين بعد التسليم" },
  ],
  pro: [
    { icon: Zap,            ar: "كل مميزات لايت ✦" },
    { icon: BarChart3,      ar: "نظام تقارير وتحليلات" },
    { icon: Users,          ar: "إدارة العملاء المتكاملة" },
    { icon: Award,          ar: "نظام الولاء والنقاط" },
    { icon: CreditCard,     ar: "بوابة دفع إلكترونية" },
    { icon: Smartphone,     ar: "تطبيق PWA (ويب تطبيق)" },
    { icon: Bell,           ar: "إشعارات فورية (Push)" },
    { icon: Mail,           ar: "1,000 رسالة بريدية شهرياً" },
    { icon: CheckCircle2,   ar: "5 تعديلات ما بعد التسليم" },
  ],
  infinity: [
    { icon: Star,           ar: "كل مميزات برو ✦✦" },
    { icon: Mail,           ar: "5 بريد باسم النشاط" },
    { icon: MessageCircle,  ar: "10,000 رسالة بريدية شهرياً" },
    { icon: Database,       ar: "نظام بيانات وتقارير متقدمة" },
    { icon: Building2,      ar: "توافق نظام الإدارة المؤسسية" },
    { icon: Shield,         ar: "دعم أولوية 24/7 ومدير حساب مخصص" },
    { icon: Rocket,         ar: "20 تطوير/ميزة ما بعد التسليم" },
  ],
};

function featuresFor(sector: SectorKey, tier: "lite"|"pro"|"infinity") {
  if (sector === "restaurant") return RESTAURANT_FEATURES[tier];
  if (sector === "ecommerce")  return ECOMMERCE_FEATURES[tier];
  if (sector === "education")  return EDUCATION_FEATURES[tier];
  if (sector === "healthcare") return HEALTHCARE_FEATURES[tier];
  if (sector === "realestate") return REALESTATE_FEATURES[tier];
  if (sector === "corporate")  return CORPORATE_FEATURES[tier];
  if (sector === "fitness")    return FITNESS_FEATURES[tier];
  if (sector === "beauty")     return BEAUTY_FEATURES[tier];
  if (sector === "events")     return EVENTS_FEATURES[tier];
  if (sector === "marketing")  return MARKETING_FEATURES[tier];
  if (sector === "ai")         return AI_FEATURES[tier];
  return GENERIC_FEATURES[tier];
}

const DURATION_OPTS = [
  { key: "sixmonth", ar: "6 أشهر", icon: CalendarRange },
  { key: "annual",   ar: "سنة", icon: CalendarDays },
  { key: "2y",       ar: "سنتان", icon: CalendarDays },
  { key: "3y",       ar: "3 سنوات", icon: CalendarDays },
  { key: "5y",       ar: "5 سنوات", icon: CalendarDays },
  { key: "lifetime", ar: "مدى الحياة", icon: InfinityIcon },
];

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function fmt(n: number) { return n.toLocaleString("ar-SA"); }

type Period = "sixmonth" | "annual" | "multiyear" | "lifetime";
type Sector = "restaurant" | "ecommerce" | "other";
type Tier   = "lite" | "pro" | "infinity";

/* ─── Plan Card ───────────────────────────────────────────────────────── */
const TIER_STYLES: Record<Tier, { bg: string; border: string; headerBg: string; textColor: string; badgeBg: string; btnBg: string; glow: string; tag: string }> = {
  lite: {
    bg: "bg-white dark:bg-[#0f172a]", border: "border-gray-200 dark:border-slate-700/50",
    headerBg: "bg-gray-50 dark:bg-[#111827]", textColor: "text-gray-900 dark:text-white",
    badgeBg: "bg-gray-100 dark:bg-slate-800", btnBg: "bg-gray-900 hover:bg-black text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900",
    glow: "", tag: "انطلق بثقة",
  },
  pro: {
    bg: "bg-[#1a3a6e]", border: "border-blue-400/20",
    headerBg: "from-[#1e40af] to-[#1a3a6e]", textColor: "text-white",
    badgeBg: "bg-white/10", btnBg: "bg-white hover:bg-blue-50 text-blue-900",
    glow: "shadow-[0_0_60px_rgba(59,130,246,0.18)]", tag: "النظام الأذكى",
  },
  infinity: {
    bg: "bg-[#09090f]", border: "border-amber-500/15",
    headerBg: "from-[#0f0f18] to-[#09090f]", textColor: "text-white",
    badgeBg: "bg-white/[0.07]", btnBg: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white",
    glow: "shadow-[0_0_60px_rgba(245,158,11,0.12)]", tag: "بلا حدود",
  },
};

function PlanCard({ tier, period, years, sector, onCustom, onOrder }: {
  tier: Tier; period: Period; years: number; sector: SectorKey;
  onCustom: ()=>void; onOrder: (info: { tier: Tier; period: Period; years: number; sector: string; price: number; label: string })=>void;
}) {
  const st = TIER_STYLES[tier];
  const prices = PRICES[sector][tier];
  const features = featuresFor(sector, tier);
  const isPro = tier === "pro";
  const isInfinity = tier === "infinity";
  const isLifetime = period === "lifetime";
  const currency = useCurrency();

  let price = 0, label = "", sublabel = "";
  if (period === "sixmonth") { price = prices.sm; label = "6 أشهر"; sublabel = `${currency.format(prices.sm * 2)} / السنة`; }
  else if (period === "annual") { price = prices.yr; label = "سنة"; sublabel = "دفعة واحدة"; }
  else if (period === "multiyear") {
    price = multiYearPrice(prices.yr, years);
    const disc = multiYearDiscount(years);
    label = `${years} سنوات`;
    sublabel = disc > 0 ? `خصم ${disc}% على السنوات الإضافية` : "";
  }
  else { price = prices.life; label = "مدى الحياة"; sublabel = "دفعة واحدة للأبد"; }

  // Monthly equivalent + savings
  const monthlyEquiv =
    period === "sixmonth"  ? Math.round(prices.sm / 6) :
    period === "annual"    ? Math.round(prices.yr / 12) :
    period === "multiyear" ? Math.round(price / (12 * years)) :
                             null;
  const annualizedSixMo = prices.sm * 2;
  const savingsVsSixMo =
    period === "annual"    ? Math.max(0, Math.round((1 - prices.yr / annualizedSixMo) * 100)) :
    period === "multiyear" ? Math.max(0, Math.round((1 - (price / years) / annualizedSixMo) * 100)) :
                             0;

  const icons = { lite: Zap, pro: Star, infinity: InfinityIcon };
  const TIcon = icons[tier];

  const tierNames = { lite: "لايت", pro: "برو", infinity: "إنفينتي" };
  const descrs = { lite: "الباقة الأساسية — مثالية للانطلاق", pro: "الباقة الذكية — الأكثر توازناً", infinity: "الباقة الشاملة — بلا قيود" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className={`relative flex flex-col h-full rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${st.bg} ${st.border} ${st.glow} ${isPro ? "ring-1 ring-blue-500/30" : ""} ${isInfinity ? "ring-1 ring-amber-500/15" : ""}`}
      data-testid={`card-plan-${tier}`}
    >
      {isPro && <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-blue-400 to-transparent"/>}
      {isInfinity && <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent"/>}

      {/* Popular badge — outside the card, above it */}
      {isPro && (
        <div className="absolute -top-3.5 inset-x-0 flex justify-center">
          <span className="flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30">
            <Crown className="w-3 h-3"/> الأكثر طلباً
          </span>
        </div>
      )}

      {/* Header */}
      <div className={`px-6 pt-6 pb-5 bg-gradient-to-br ${isPro || isInfinity ? st.headerBg : st.headerBg} relative`}>
        <div className="flex items-start justify-between">
          <div>
            <div className={`w-10 h-10 rounded-2xl ${st.badgeBg} flex items-center justify-center mb-4`}>
              <TIcon className={`w-5 h-5 ${isInfinity ? "text-amber-400" : isPro ? "text-blue-200" : "text-gray-500 dark:text-slate-400"}`}/>
            </div>
            <h3 className={`text-2xl font-black ${st.textColor}`}>{tierNames[tier]}</h3>
            <p className={`text-xs mt-1 ${isPro ? "text-blue-300/60" : isInfinity ? "text-amber-400/50" : "text-gray-400 dark:text-slate-500"}`}>{descrs[tier]}</p>
          </div>
          {isInfinity && (
            <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 mt-1">
              <InfinityIcon className="w-3 h-3"/> شامل
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className={`px-6 py-5 relative ${isPro ? "bg-white/[0.04] border-t border-white/10" : isInfinity ? "bg-white/[0.02] border-t border-white/[0.06]" : "bg-gray-50 dark:bg-[#111827] border-t border-gray-100 dark:border-slate-800"}`}>
        {savingsVsSixMo > 0 && (
          <span className={`absolute top-3 left-3 text-[10px] font-black px-2 py-0.5 rounded-full ${
            isInfinity ? "bg-amber-500/15 text-amber-300 border border-amber-500/25" :
            isPro      ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/25" :
                         "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/40"
          }`}>
            وفّر {savingsVsSixMo}%
          </span>
        )}
        {isLifetime && (
          <span className={`absolute top-3 left-3 text-[10px] font-black px-2 py-0.5 rounded-full ${
            isInfinity ? "bg-amber-500/15 text-amber-300 border border-amber-500/25" :
            isPro      ? "bg-white/15 text-white border border-white/20" :
                         "bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800/40"
          }`}>
            للأبد
          </span>
        )}
        <AnimatePresence mode="wait">
          <motion.div key={`${tier}-${period}-${years}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black tracking-tight ${st.textColor}`}>{currency.format(price)}</span>
              <span className={`text-sm font-bold ${isPro || isInfinity ? "text-white/40" : "text-gray-400"}`}>{currency.symbol}</span>
            </div>
            {!currency.isSaudi && (
              <p className={`text-[10px] mt-0.5 font-bold ${isPro ? "text-blue-200/50" : isInfinity ? "text-amber-300/40" : "text-gray-400/70"}`}>
                ≈ {fmt(price)} ر.س
              </p>
            )}
            <p className={`text-xs mt-1 font-bold ${isPro ? "text-blue-200/70" : isInfinity ? "text-amber-300/60" : "text-gray-500 dark:text-slate-400"}`}>
              {period === "sixmonth" ? "كل 6 أشهر" : period === "annual" ? "سنوياً — دفعة واحدة" : period === "multiyear" ? `${years} سنوات (خصم ${multiYearDiscount(years)}%)` : "مرة واحدة — للأبد"}
            </p>
            {monthlyEquiv !== null && (
              <div className={`mt-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${
                isInfinity ? "bg-amber-500/[0.06] border border-amber-500/15" :
                isPro      ? "bg-white/[0.06] border border-white/10" :
                             "bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50"
              }`}>
                <span className={`text-[11px] font-bold ${isInfinity ? "text-amber-300/70" : isPro ? "text-blue-200/70" : "text-gray-500 dark:text-slate-400"}`}>≈</span>
                <span className={`text-sm font-black ${st.textColor}`}>{currency.format(monthlyEquiv)}</span>
                <span className={`text-[11px] font-bold ${isInfinity ? "text-amber-300/70" : isPro ? "text-blue-200/70" : "text-gray-500 dark:text-slate-400"}`}>{currency.symbol} / شهر</span>
              </div>
            )}
            {period === "sixmonth" && (
              <p className={`text-[10px] mt-1.5 ${isPro || isInfinity ? "text-white/35" : "text-gray-400/80"}`}>
                يساوي <span className="line-through">{currency.format(prices.sm * 2)}</span> {currency.symbol} سنوياً
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Features */}
      <div className={`flex-1 px-6 py-5 ${isInfinity ? "bg-[#09090f]" : isPro ? "bg-[#1a3a6e]" : "bg-white dark:bg-[#0f172a]"}`}>
        {isLifetime && (
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4 ${isPro ? "bg-white/10 border border-white/15" : isInfinity ? "bg-amber-500/10 border border-amber-500/20" : "bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20"}`}>
            <InfinityIcon className={`w-4 h-4 shrink-0 ${isInfinity ? "text-amber-400" : isPro ? "text-blue-200" : "text-emerald-600 dark:text-emerald-400"}`}/>
            <span className={`text-xs font-black ${isInfinity ? "text-amber-300" : isPro ? "text-white" : "text-emerald-700 dark:text-emerald-300"}`}>جميع الميزات مفتوحة — مدى الحياة</span>
          </div>
        )}
        <div className="space-y-2.5">
          {features.map(({ icon: Icon, ar }, i) => (
            <div key={i} className="flex items-start gap-3">
              <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isInfinity ? "text-amber-400" : isPro ? "text-blue-300" : "text-emerald-500"}`}/>
              <span className={`text-[12px] leading-snug ${isInfinity ? "text-slate-300" : isPro ? "text-blue-100" : "text-gray-600 dark:text-slate-300"}`}>{ar}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className={`px-6 pb-6 pt-4 ${isInfinity ? "bg-[#09090f]" : isPro ? "bg-[#1a3a6e]" : "bg-white dark:bg-[#0f172a]"}`}>
        <button
          onClick={() => onOrder({ tier, period, years, sector, price, label })}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all ${st.btnBg}`}
          data-testid={`button-subscribe-${tier}`}
        >
          <Rocket className="w-4 h-4"/>
          أكمل الطلب الآن
        </button>
        <p className="text-[10px] text-center mt-2 opacity-50">
          {isInfinity || isPro ? "إكمال البيانات → تحويل بنكي → تواصل عبر واتساب" : "إكمال البيانات → تحويل بنكي → تواصل عبر واتساب"}
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Custom Plan Banner (horizontal strip below main cards) ─────────── */
function CustomBanner({ onOpen }: { onOpen: ()=>void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
      className="mt-5 rounded-2xl border border-dashed border-violet-300 dark:border-violet-700/40 bg-gradient-to-l from-violet-50 via-white to-purple-50 dark:from-violet-950/20 dark:via-[#0d0d18] dark:to-purple-950/10 overflow-hidden"
      data-testid="card-custom-plan"
    >
      <div className="flex flex-col md:flex-row items-center gap-6 px-8 py-6">
        {/* Icon */}
        <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Sparkles className="w-7 h-7 text-white"/>
        </div>

        {/* Text */}
        <div className="flex-1 text-center md:text-start">
          <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
            <h3 className="text-base font-black text-gray-900 dark:text-white">باقة مخصصة — ما وجدت ما يناسبك؟</h3>
            <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
              <Bot className="w-2.5 h-2.5"/> AI
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            اوصف احتياجاتك بمساعدة الذكاء الاصطناعي، وسنعد لك عرض سعر مخصص مع رقم تذكرة للمتابعة
          </p>
          <div className="flex items-center gap-4 mt-2 justify-center md:justify-start">
            {["أي مدة تناسبك","ميزات غير محدودة","عرض سعر خاص بك"].map((t,i)=>(
              <span key={i} className="flex items-center gap-1 text-[11px] text-violet-600 dark:text-violet-400 font-bold">
                <Check className="w-3 h-3"/> {t}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onOpen}
          className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white text-sm font-black transition-all shadow-lg shadow-purple-500/20 whitespace-nowrap"
          data-testid="button-open-custom"
        >
          <Sparkles className="w-4 h-4"/> صمّم باقتك
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Lifetime Perks Banner ───────────────────────────────────────────── */
function LifetimePerks() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-2xl bg-gradient-to-r from-[#09090f] via-[#0f0f1a] to-[#09090f] border border-amber-500/15 p-6">
      <div className="flex items-center gap-2 mb-4">
        <InfinityIcon className="w-5 h-5 text-amber-400"/>
        <h4 className="font-black text-white">مميزات خاصة بباقة مدى الحياة</h4>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {LIFETIME_PERKS.map(({ icon: Icon, ar }, i) => (
          <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-amber-500/10">
            <Icon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"/>
            <span className="text-xs text-slate-300 leading-snug">{ar}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Custom Ticket Modal ─────────────────────────────────────────────── */
interface ChatMsg { role: "user"|"assistant"; content: string; }
function CustomModal({ onClose, sector, sectorLabel, initialDuration }: {
  onClose: ()=>void; sector: string; sectorLabel: string; initialDuration?: string;
}) {
  const { toast } = useToast();
  const { user } = useUser();
  const [step, setStep] = useState<"chat"|"contact"|"success">("chat");
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([
    { role: "assistant", content: `مرحباً! أنا مساعد كيروكس 🤝\nسأساعدك على صياغة احتياجاتك بشكل دقيق حتى يتمكن فريقنا من تقديم أفضل عرض سعر لك.\n\nأخبرني: ما نوع نشاطك؟ وما أبرز الميزات التي تحتاجها في نظامك؟` },
  ]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [requirements, setRequirements] = useState("");
  const [contactName, setContactName] = useState((user as any)?.fullName || "");
  const [contactPhone, setContactPhone] = useState((user as any)?.phone || "");
  const [contactEmail, setContactEmail] = useState((user as any)?.email || "");
  const [duration, setDuration] = useState(initialDuration || "annual");
  const [submitting, setSubmitting] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [whatsapp, setWhatsapp] = useState("966500000000");
  const chatRef = useRef<HTMLDivElement>(null);

  const { data: modalSettings } = useQuery<any>({
    queryKey: ["/api/public/settings"],
    staleTime: 60_000,
  });
  useEffect(() => {
    const wa = modalSettings?.whatsapp || modalSettings?.contactPhone || "";
    if (wa) setWhatsapp(wa.replace(/\D/g, ""));
  }, [modalSettings]);

  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }); }, [chatHistory]);

  async function sendAiMsg() {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    const updated: ChatMsg[] = [...chatHistory, { role: "user", content: userMsg }];
    setChatHistory(updated);
    setAiLoading(true);
    try {
      const r = await fetch("/api/price-request/ai-help", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history: updated.slice(0, -1) }),
      });
      const d = await r.json();
      setChatHistory(prev => [...prev, { role: "assistant", content: d.reply || "..." }]);
    } catch {
      setChatHistory(prev => [...prev, { role: "assistant", content: "عذراً، حدث خطأ. اكتب احتياجاتك مباشرة في الحقل أدناه." }]);
    }
    setAiLoading(false);
  }

  function useAsRequirements(content: string) {
    setRequirements(content);
    toast({ title: "تم نقل الوصف ✓", description: "يمكنك تعديله قبل الإرسال" });
  }

  async function handleSubmit() {
    if (!contactName || !contactPhone || !requirements) {
      toast({ title: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" }); return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/price-request", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector, sectorLabel, duration, requirements, contactName, contactPhone, contactEmail }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "فشل الإرسال");
      setTicketNumber(d.ticketNumber);
      setStep("success");
    } catch (e: any) {
      toast({ title: "فشل الإرسال", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  }

  const durLabels: Record<string,string> = { sixmonth:"6 أشهر", annual:"سنة", "2y":"سنتان", "3y":"3 سنوات", "5y":"5 سنوات", lifetime:"مدى الحياة" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}/>
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0d0d18] rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.05] shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white"/>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black text-black dark:text-white">باقة مخصصة — {sectorLabel}</h3>
            <p className="text-[10px] text-black/40 dark:text-white/40">اكتب احتياجاتك واحصل على عرض سعر</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05]">
            <X className="w-4 h-4 text-black/40 dark:text-white/40"/>
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 px-5 py-2 shrink-0 border-b border-black/[0.05] dark:border-white/[0.04]">
          {["chat","contact","success"].map((s,i)=>(
            <div key={s} className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${step===s||( s==="success"&&step==="success")?"bg-violet-600 text-white":step==="success"||( i===0&&step!=="chat")||(i===1&&step==="success")?"bg-emerald-500 text-white":"bg-black/[0.06] dark:bg-white/[0.06] text-black/40 dark:text-white/40"}`}>
                {(i===0&&step!=="chat")||(i===1&&step==="success")?<Check className="w-3 h-3"/>:i+1}
              </div>
              <span className={`text-[10px] font-semibold ${step===s?"text-violet-600":"text-black/30 dark:text-white/30"}`}>{["صياغة الاحتياجات","بياناتك","التأكيد"][i]}</span>
              {i<2&&<ChevronLeft className="w-3 h-3 text-black/20 dark:text-white/20"/>}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col">

          {/* ── Step 1: Chat ── */}
          {step === "chat" && (
            <div className="flex flex-col h-full">
              <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role==="user"?"justify-start":"justify-end"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${msg.role==="user"?"bg-black/[0.04] dark:bg-white/[0.05]":"bg-violet-600 text-white"}`}>
                      <p className={`text-xs leading-relaxed whitespace-pre-wrap ${msg.role==="user"?"text-black dark:text-white":"text-white"}`}>{msg.content}</p>
                      {msg.role==="assistant"&&<button onClick={()=>useAsRequirements(msg.content)} className="mt-1.5 text-[9px] text-white/60 hover:text-white flex items-center gap-1"><ClipboardList className="w-3 h-3"/>استخدم كوصف</button>}
                    </div>
                  </div>
                ))}
                {aiLoading && <div className="flex justify-end"><div className="bg-violet-600 rounded-2xl px-4 py-3"><div className="flex gap-1">{[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}</div></div></div>}
              </div>
              <div className="border-t border-black/[0.06] dark:border-white/[0.05] p-3 flex gap-2 shrink-0">
                <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendAiMsg()} placeholder="اكتب احتياجاتك..." className="flex-1 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl px-3 py-2 text-sm outline-none placeholder:text-black/25 dark:placeholder:text-white/25 text-black dark:text-white" data-testid="input-ai-chat"/>
                <button onClick={sendAiMsg} disabled={!input.trim()||aiLoading} className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 flex items-center justify-center transition" data-testid="button-send-ai">
                  {aiLoading?<Loader2 className="w-4 h-4 text-white animate-spin"/>:<Send className="w-4 h-4 text-white"/>}
                </button>
              </div>
              {/* Requirements textarea */}
              <div className="p-3 pt-0 shrink-0">
                <label className="text-[10px] font-black uppercase tracking-wider text-black/30 dark:text-white/30 mb-1.5 block">الوصف النهائي لمتطلباتك *</label>
                <textarea value={requirements} onChange={e=>setRequirements(e.target.value)} rows={3} placeholder="اكتب أو انقل الوصف هنا..." className="w-full bg-black/[0.03] dark:bg-white/[0.04] rounded-xl px-3 py-2 text-sm outline-none resize-none placeholder:text-black/20 dark:placeholder:text-white/20 text-black dark:text-white border border-black/[0.06] dark:border-white/[0.05]" data-testid="textarea-requirements"/>
                <button onClick={()=>requirements&&setStep("contact")} disabled={!requirements.trim()} className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-black transition" data-testid="button-next-contact">
                  التالي: بياناتك <ArrowRight className="w-4 h-4"/>
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Contact ── */}
          {step === "contact" && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/20">
                <p className="text-[10px] font-black text-violet-600 dark:text-violet-400 mb-1">الوصف المدخل:</p>
                <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed line-clamp-3">{requirements}</p>
                <button onClick={()=>setStep("chat")} className="text-[10px] text-violet-500 mt-1 hover:underline">تعديل الوصف</button>
              </div>

              <div>
                <label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-wider mb-1.5 block">مدة المشروع</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {DURATION_OPTS.map(({key,ar,icon:Icon})=>(
                    <button key={key} onClick={()=>setDuration(key)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${duration===key?"bg-violet-600 text-white":"bg-black/[0.03] dark:bg-white/[0.04] text-black/50 dark:text-white/50 hover:bg-black/[0.06] dark:hover:bg-white/[0.07]"}`} data-testid={`button-duration-${key}`}>
                      <Icon className="w-3 h-3"/>{ar}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-wider mb-1.5 block">الاسم *</label>
                  <div className="relative">
                    <User className="absolute top-1/2 -translate-y-1/2 right-3 w-3.5 h-3.5 text-black/25 dark:text-white/25 pointer-events-none"/>
                    <Input value={contactName} onChange={e=>setContactName(e.target.value)} className="pr-9 h-9 text-sm" placeholder="اسمك الكريم" data-testid="input-contact-name"/>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-wider mb-1.5 block">رقم الهاتف / واتساب *</label>
                  <div className="relative">
                    <Phone className="absolute top-1/2 -translate-y-1/2 right-3 w-3.5 h-3.5 text-black/25 dark:text-white/25 pointer-events-none"/>
                    <Input value={contactPhone} onChange={e=>setContactPhone(e.target.value)} className="pr-9 h-9 text-sm" placeholder="+966 5XX XXX XXX" dir="ltr" data-testid="input-contact-phone"/>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-wider mb-1.5 block">البريد الإلكتروني (اختياري)</label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 -translate-y-1/2 right-3 w-3.5 h-3.5 text-black/25 dark:text-white/25 pointer-events-none"/>
                    <Input value={contactEmail} onChange={e=>setContactEmail(e.target.value)} className="pr-9 h-9 text-sm" placeholder="email@example.com" dir="ltr" data-testid="input-contact-email"/>
                  </div>
                </div>
              </div>

              <button onClick={handleSubmit} disabled={submitting||!contactName||!contactPhone} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 disabled:opacity-40 text-white text-sm font-black transition" data-testid="button-submit-ticket">
                {submitting?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}
                {submitting?"جارٍ الإرسال...":"أرسل طلب السعر"}
              </button>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === "success" && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500"/>
              </div>
              <div>
                <h3 className="text-xl font-black text-black dark:text-white mb-1">تم استلام طلبك!</h3>
                <p className="text-sm text-black/50 dark:text-white/50">رقم تذكرتك</p>
                <div className="flex items-center gap-2 justify-center mt-2">
                  <span className="text-2xl font-black text-violet-600 dark:text-violet-400 font-mono">{ticketNumber}</span>
                  <button onClick={()=>{navigator.clipboard.writeText(ticketNumber);toast({title:"تم النسخ ✓"});}} className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"><Copy className="w-4 h-4 text-black/40 dark:text-white/40"/></button>
                </div>
              </div>
              <div className="w-full p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20 text-sm text-emerald-700 dark:text-emerald-300 space-y-1">
                <p>✓ تم إشعار فريق كيروكس</p>
                <p>✓ ستصلك رسالة تأكيد قريباً</p>
                {user && <p>✓ يمكنك متابعة الطلب من حسابك</p>}
              </div>
              <a
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`مرحباً، لدي طلب سعر برقم التذكرة ${ticketNumber} — ${sectorLabel}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#20c05c] text-white text-sm font-black transition"
                data-testid="button-whatsapp-ticket"
              >
                <MessageSquare className="w-4 h-4"/>
                تواصل واتساب برقم التذكرة
              </a>
              <button onClick={onClose} className="text-sm text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition">إغلاق</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Custom Inline Form (for "قطاع آخر" — no price, direct to staff) ── */
function CustomInlineForm({ sector, sectorLabel, initialDuration }: {
  sector: string; sectorLabel: string; initialDuration?: string;
}) {
  const { toast } = useToast();
  const { user } = useUser();
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([
    { role: "assistant", content: `أهلاً بك 👋 — أخبرني عن مشروعك:\n• ما نوع نشاطك؟\n• ما الميزات الأساسية التي تحتاجها؟\n• هل لديك مرجع أو موقع يعجبك؟\n\nسأساعدك في صياغة المتطلبات ثم نرفعها مباشرة لفريق كيروكس.` },
  ]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [requirements, setRequirements] = useState("");
  const [contactName, setContactName] = useState((user as any)?.fullName || "");
  const [contactPhone, setContactPhone] = useState((user as any)?.phone || "");
  const [contactEmail, setContactEmail] = useState((user as any)?.email || "");
  const [duration, setDuration] = useState(initialDuration || "annual");
  const [submitting, setSubmitting] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [whatsapp, setWhatsapp] = useState("966500000000");
  const chatRef = useRef<HTMLDivElement>(null);

  const { data: modalSettings } = useQuery<any>({
    queryKey: ["/api/public/settings"], staleTime: 60_000,
  });
  useEffect(() => {
    const wa = modalSettings?.whatsapp || modalSettings?.contactPhone || "";
    if (wa) setWhatsapp(wa.replace(/\D/g, ""));
  }, [modalSettings]);

  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }); }, [chatHistory]);

  async function sendAiMsg() {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    const updated: ChatMsg[] = [...chatHistory, { role: "user", content: userMsg }];
    setChatHistory(updated);
    setAiLoading(true);
    try {
      const r = await fetch("/api/price-request/ai-help", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history: updated.slice(0, -1) }),
      });
      const d = await r.json();
      setChatHistory(prev => [...prev, { role: "assistant", content: d.reply || "..." }]);
    } catch {
      setChatHistory(prev => [...prev, { role: "assistant", content: "اكتب احتياجاتك مباشرة في الحقل أسفل المحادثة وسنتولى الباقي." }]);
    }
    setAiLoading(false);
  }

  function useAsRequirements(content: string) {
    setRequirements(content);
    toast({ title: "تم نقل الوصف ✓", description: "يمكنك تعديله قبل الإرسال" });
  }

  async function handleSubmit() {
    if (!contactName || !contactPhone || !requirements) {
      toast({ title: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" }); return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/price-request", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector, sectorLabel, duration, requirements, contactName, contactPhone, contactEmail }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "فشل الإرسال");
      setTicketNumber(d.ticketNumber);
      setSubmitted(true);
      toast({ title: "تم رفع طلبك للموظفين ✓", description: `رقم تذكرتك: ${d.ticketNumber}` });
    } catch (e: any) {
      toast({ title: "فشل الإرسال", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border-2 border-emerald-200 dark:border-emerald-700/30 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-emerald-950/20 dark:via-[#0d0d18] dark:to-emerald-950/10 p-10 text-center" data-testid="custom-inline-success">
        <div className="w-20 h-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-10 h-10 text-emerald-500"/>
        </div>
        <h3 className="text-2xl font-black text-black dark:text-white mb-2">تم رفع طلبك للموظفين ✓</h3>
        <p className="text-sm text-black/50 dark:text-white/50 mb-1">رقم تذكرتك:</p>
        <div className="flex items-center gap-2 justify-center mb-5">
          <span className="text-3xl font-black text-violet-600 dark:text-violet-400 font-mono">{ticketNumber}</span>
          <button onClick={()=>{navigator.clipboard.writeText(ticketNumber);toast({title:"تم النسخ ✓"});}} className="p-2 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"><Copy className="w-4 h-4 text-black/40 dark:text-white/40"/></button>
        </div>
        <div className="max-w-md mx-auto p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20 text-sm text-emerald-700 dark:text-emerald-300 space-y-1 mb-5">
          <p>✓ وصل طلبك مباشرةً للفريق المختص</p>
          <p>✓ سيتواصل معك أحد الموظفين خلال ساعات</p>
        </div>
        <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`مرحباً، لدي طلب سعر برقم التذكرة ${ticketNumber} — ${sectorLabel}`)}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#20c05c] text-white text-sm font-black transition"
          data-testid="button-inline-whatsapp">
          <MessageSquare className="w-4 h-4"/> تواصل واتساب برقم التذكرة
        </a>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border-2 border-violet-200 dark:border-violet-700/30 bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-violet-950/20 dark:via-[#0d0d18] dark:to-purple-950/10 overflow-hidden"
      data-testid="custom-inline-form">

      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-violet-200/50 dark:border-violet-700/20 bg-gradient-to-l from-violet-100/50 to-transparent dark:from-violet-900/20">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Sparkles className="w-6 h-6 text-white"/>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-black dark:text-white">قطاع آخر — اطلب نظامك المخصص</h3>
            <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
              <Bot className="w-2.5 h-2.5"/> AI
            </span>
          </div>
          <p className="text-xs text-black/50 dark:text-white/50 mt-0.5">اوصف نظامك بدون التزام بسعر — سيرفع الطلب مباشرةً للفريق المختص</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* ── Left: AI Chat ── */}
        <div className="flex flex-col border-b lg:border-b-0 lg:border-l border-violet-200/40 dark:border-violet-700/20">
          <div ref={chatRef} className="h-[300px] overflow-y-auto p-4 space-y-3">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role==="user"?"justify-start":"justify-end"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${msg.role==="user"?"bg-black/[0.05] dark:bg-white/[0.06]":"bg-violet-600 text-white"}`}>
                  <p className={`text-xs leading-relaxed whitespace-pre-wrap ${msg.role==="user"?"text-black dark:text-white":"text-white"}`}>{msg.content}</p>
                  {msg.role==="assistant" && i > 0 && <button onClick={()=>useAsRequirements(msg.content)} className="mt-1.5 text-[9px] text-white/70 hover:text-white flex items-center gap-1"><ClipboardList className="w-3 h-3"/>استخدم كوصف</button>}
                </div>
              </div>
            ))}
            {aiLoading && <div className="flex justify-end"><div className="bg-violet-600 rounded-2xl px-4 py-3"><div className="flex gap-1">{[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}</div></div></div>}
          </div>
          <div className="border-t border-violet-200/40 dark:border-violet-700/20 p-3 flex gap-2 bg-white/40 dark:bg-black/20">
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendAiMsg()} placeholder="اكتب احتياجاتك..." className="flex-1 bg-white dark:bg-white/[0.04] rounded-xl px-3 py-2 text-sm outline-none placeholder:text-black/25 dark:placeholder:text-white/25 text-black dark:text-white border border-black/[0.05] dark:border-white/[0.05]" data-testid="input-inline-ai-chat"/>
            <button onClick={sendAiMsg} disabled={!input.trim()||aiLoading} className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 flex items-center justify-center transition" data-testid="button-inline-send-ai">
              {aiLoading?<Loader2 className="w-4 h-4 text-white animate-spin"/>:<Send className="w-4 h-4 text-white"/>}
            </button>
          </div>
        </div>

        {/* ── Right: Form ── */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-wider mb-1.5 block">الوصف النهائي لمتطلباتك *</label>
            <textarea value={requirements} onChange={e=>setRequirements(e.target.value)} rows={5} placeholder="اكتب أو انقل الوصف هنا — كلما كان أوضح، كان عرض السعر أدق..." className="w-full bg-white dark:bg-white/[0.04] rounded-xl px-3 py-2 text-sm outline-none resize-none placeholder:text-black/25 dark:placeholder:text-white/25 text-black dark:text-white border border-black/[0.06] dark:border-white/[0.05]" data-testid="textarea-inline-requirements"/>
          </div>

          <div>
            <label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-wider mb-1.5 block">مدة المشروع</label>
            <div className="grid grid-cols-3 gap-1.5">
              {DURATION_OPTS.map(({key,ar,icon:Icon})=>(
                <button key={key} onClick={()=>setDuration(key)} className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] font-bold transition ${duration===key?"bg-violet-600 text-white":"bg-black/[0.04] dark:bg-white/[0.04] text-black/60 dark:text-white/60 hover:bg-black/[0.08] dark:hover:bg-white/[0.08]"}`} data-testid={`button-inline-duration-${key}`}>
                  <Icon className="w-3 h-3"/>{ar}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-wider mb-1.5 block">الاسم *</label>
              <div className="relative">
                <User className="absolute top-1/2 -translate-y-1/2 right-3 w-3.5 h-3.5 text-black/25 dark:text-white/25 pointer-events-none"/>
                <Input value={contactName} onChange={e=>setContactName(e.target.value)} className="pr-9 h-9 text-sm" placeholder="اسمك الكريم" data-testid="input-inline-name"/>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-wider mb-1.5 block">الهاتف *</label>
              <div className="relative">
                <Phone className="absolute top-1/2 -translate-y-1/2 right-3 w-3.5 h-3.5 text-black/25 dark:text-white/25 pointer-events-none"/>
                <Input value={contactPhone} onChange={e=>setContactPhone(e.target.value)} className="pr-9 h-9 text-sm" placeholder="+966 5XX XXX XXX" dir="ltr" data-testid="input-inline-phone"/>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-wider mb-1.5 block">البريد (اختياري)</label>
            <div className="relative">
              <Mail className="absolute top-1/2 -translate-y-1/2 right-3 w-3.5 h-3.5 text-black/25 dark:text-white/25 pointer-events-none"/>
              <Input value={contactEmail} onChange={e=>setContactEmail(e.target.value)} className="pr-9 h-9 text-sm" placeholder="email@example.com" dir="ltr" data-testid="input-inline-email"/>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={submitting||!contactName||!contactPhone||!requirements} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 disabled:opacity-40 text-white text-sm font-black transition shadow-lg shadow-purple-500/20" data-testid="button-inline-submit">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
            {submitting ? "جارٍ الرفع للموظفين..." : "ارفع الطلب للموظفين الآن"}
          </button>
          <p className="text-[10px] text-center text-black/40 dark:text-white/40">سيصل طلبك مباشرة لفريق كيروكس وسيتم التواصل معك في أقرب وقت</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────── */
const SEGMENT_TO_SECTOR: Record<string, Sector> = {
  restaurant: "restaurant",
  ecommerce: "ecommerce",
};
const NON_PRIMARY_SEGMENTS = ["education","healthcare","realestate","corporate","fitness","beauty","events","marketing","ai","other"];

export default function Prices() {
  const { lang } = useI18n();
  const L = lang === "ar";
  const { user } = useUser();

  useSEO({
    title: L ? "خدمات وأسعار كيروكس استوديو — باقات بناء المواقع والأنظمة" : "Qirox Studio Services & Pricing — Website & System Packages",
    description: L
      ? "خدمات كيروكس استوديو: بناء مواقع إلكترونية، تطبيقات جوال، وأنظمة إدارة. أسعار تبدأ من 699 ريال. باقة لايت، برو، وإنفينيت. تسليم من 3 أيام. الرياض، المملكة العربية السعودية."
      : "Qirox Studio services: websites, mobile apps, management systems. Prices from 699 SAR. Lite, Pro, Infinite packages. Delivery from 3 days. Riyadh, Saudi Arabia.",
    keywords: "خدمات كيروكس استوديو, أسعار كيروكس استوديو, خدمات كيروكس, Qirox Studio services, خدمات برمجة مواقع السعودية, باقات بناء مواقع, أسعار تصميم مواقع الرياض, Qirox pricing, تكلفة برمجة موقع, خدمات تطوير تطبيقات, نظام إدارة سعودي, باقات برمجة سعودية, سعر موقع الكتروني السعودية",
    canonical: "/prices",
  });
  const [, setLocation] = useLocation();

  // Read URL parameters (?segment=…) once on mount
  const initialSegment = (() => {
    if (typeof window === "undefined") return null;
    const sp = new URLSearchParams(window.location.search);
    return sp.get("segment");
  })();
  const initialSector: Sector = initialSegment && SEGMENT_TO_SECTOR[initialSegment]
    ? SEGMENT_TO_SECTOR[initialSegment]
    : (initialSegment && NON_PRIMARY_SEGMENTS.includes(initialSegment))
      ? "other"
      : "restaurant";
  const initialOtherSector = initialSegment && NON_PRIMARY_SEGMENTS.includes(initialSegment) ? initialSegment : "education";

  const [sector, setSector] = useState<Sector>(initialSector);
  const [period, setPeriod] = useState<Period>("annual");
  const [years, setYears] = useState(2);
  const [otherSector, setOtherSector] = useState(initialOtherSector);
  const [otherDuration, setOtherDuration] = useState("annual");
  const [customOpen, setCustomOpen] = useState(false);
  const [customSector, setCustomSector] = useState("restaurant");
  const [customSectorLabel, setCustomSectorLabel] = useState("مطاعم ومقاهي");
  const [customDuration, setCustomDuration] = useState("annual");

  const { data: settings } = useQuery<any>({ queryKey: ["/api/public/settings"], staleTime: 60_000 });
  const whatsapp = (settings?.whatsapp || settings?.contactPhone || "").replace(/\D/g, "") || "966500000000";

  function startOrder(info: { tier: Tier; period: Period; years: number; sector: string; price: number; label: string }) {
    const params = new URLSearchParams({
      plan: info.tier,
      segment: info.sector,
      period: info.period === "multiyear" ? `${info.years}y` : info.period,
      price: String(info.price),
    });
    setLocation(`/order?${params.toString()}`);
  }

  const SECTORS_DATA = [
    { key: "restaurant" as Sector, icon: UtensilsCrossed, ar: "مطاعم ومقاهي",    en: "Restaurants", color: "from-orange-500 to-amber-500" },
    { key: "ecommerce"  as Sector, icon: ShoppingBag,     ar: "متاجر إلكترونية", en: "E-Commerce",  color: "from-blue-500 to-cyan-500" },
    { key: "education"  as Sector, icon: GraduationCap,   ar: "تعليم وأكاديميات",  en: "Education",   color: "from-indigo-500 to-blue-600" },
    { key: "healthcare" as Sector, icon: Heart,           ar: "صحة وعيادات",      en: "Healthcare",  color: "from-rose-500 to-pink-600" },
    { key: "realestate" as Sector, icon: Home,            ar: "عقارات",          en: "Real Estate", color: "from-emerald-500 to-teal-600" },
    { key: "corporate"  as Sector, icon: Building2,       ar: "شركات ومؤسسات",   en: "Corporate",   color: "from-slate-600 to-zinc-700" },
    { key: "fitness"    as Sector, icon: Dumbbell,        ar: "لياقة وجيم",       en: "Fitness",     color: "from-lime-500 to-green-600" },
    { key: "beauty"     as Sector, icon: Sparkles,        ar: "تجميل وصالونات",   en: "Beauty",      color: "from-pink-500 to-fuchsia-600" },
    { key: "events"     as Sector, icon: Calendar,        ar: "فعاليات ومناسبات", en: "Events",      color: "from-amber-500 to-orange-600" },
    { key: "marketing"  as Sector, icon: TrendingUp,      ar: "وكالات التسويق",   en: "Marketing",   color: "from-cyan-500 to-blue-500" },
    { key: "ai"         as Sector, icon: Bot,             ar: "ذكاء اصطناعي",     en: "AI",          color: "from-violet-600 to-purple-700" },
    { key: "other"      as Sector, icon: Globe,           ar: "قطاع آخر",         en: "Other",       color: "from-purple-500 to-fuchsia-600" },
  ];

  function openCustom(sec: string, label: string, dur?: string) {
    setCustomSector(sec); setCustomSectorLabel(label);
    setCustomDuration(dur || (period === "multiyear" ? `${years}y` : period));
    setCustomOpen(true);
  }

  const PERIODS_LIST = [
    { key: "sixmonth" as Period, ar: "6 أشهر", icon: CalendarRange },
    { key: "annual"   as Period, ar: "سنة", icon: CalendarDays },
    { key: "multiyear"as Period, ar: "سنوات+", icon: CalendarDays, extra: true },
    { key: "lifetime" as Period, ar: "مدى الحياة", icon: InfinityIcon },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#05050c]" dir="rtl">
      <Navigation/>

      {/* ── Hero ── */}
      <section className="pt-28 pb-10 px-4 text-center relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-violet-500/[0.04] dark:bg-violet-500/[0.07] rounded-full blur-3xl -translate-y-1/2"/>
          <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-blue-500/[0.03] dark:bg-blue-500/[0.05] rounded-full blur-3xl -translate-y-1/3"/>
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.07] dark:border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
            <span className="text-[11px] font-black tracking-widest uppercase text-black/40 dark:text-white/40">الباقات والأسعار</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-black dark:text-white mb-4 leading-[1.12] tracking-tight">
            نظام احترافي يناسب<br/>
            <span className="relative inline-block">
              <span className="bg-gradient-to-l from-violet-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">قطاعك وميزانيتك</span>
              <svg className="absolute -bottom-1 inset-x-0 w-full" height="6" viewBox="0 0 200 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 3 Q50 0 100 3 Q150 6 200 3" stroke="url(#u)" strokeWidth="2.5" fill="none"/>
                <defs><linearGradient id="u" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse"><stop stopColor="#7c3aed"/><stop offset="0.5" stopColor="#2563eb"/><stop offset="1" stopColor="#06b6d4"/></linearGradient></defs>
              </svg>
            </span>
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-6">
            أسعار شفافة بدون رسوم مخفية — من مطاعم وعيادات إلى شركات وذكاء اصطناعي
          </p>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {[
              { icon: Shield,       text: "SSL + حماية كاملة" },
              { icon: CheckCircle2, text: "تسليم 7-21 يوم" },
              { icon: Rocket,       text: "دعم تقني مستمر" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs text-black/40 dark:text-white/40 font-semibold">
                <Icon className="w-3.5 h-3.5 text-emerald-500"/>
                {text}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Sector Tabs ── */}
      <section className="px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-[11px] font-black tracking-widest uppercase text-black/25 dark:text-white/25 mb-4">اختر قطاعك</p>
          <div
            className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2"
            data-testid="sector-tabs"
          >
            {SECTORS_DATA.map((s, i) => {
              const Icon = s.icon;
              const active = sector === s.key;
              return (
                <motion.button
                  key={s.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSector(s.key)}
                  className={`relative flex flex-col items-center gap-2 py-3.5 px-2 rounded-2xl transition-all duration-200 border ${
                    active
                      ? "bg-black dark:bg-white border-black dark:border-white shadow-xl shadow-black/10 dark:shadow-white/5 scale-105"
                      : "bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.07] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:scale-[1.03]"
                  }`}
                  data-testid={`button-sector-${s.key}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    active ? "bg-white/15 dark:bg-black/15" : `bg-gradient-to-br ${s.color} opacity-10`
                  }`}>
                    <Icon className={`${active ? "text-white dark:text-black" : "text-black/50 dark:text-white/50"}`} style={{ width: 18, height: 18 }}/>
                  </div>
                  <span className={`text-[10px] font-black text-center leading-tight whitespace-nowrap ${
                    active ? "text-white dark:text-black" : "text-black/45 dark:text-white/45"
                  }`}>{s.ar}</span>
                  {active && (
                    <div className="absolute inset-0 rounded-2xl ring-2 ring-black dark:ring-white ring-offset-1 ring-offset-white dark:ring-offset-[#05050c] pointer-events-none"/>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Pricing Content ── */}
      <section className="px-4 pb-16">
        <div className="max-w-5xl mx-auto">

          {/* Pricing block for any selected sector (or inline custom form for "قطاع آخر") */}
          {sector !== "other" ? (
            <>
              {/* Period switcher */}
              <div className="flex flex-col items-center mb-8 gap-3">
                <div className="flex gap-1.5 p-1 bg-black/[0.04] dark:bg-white/[0.04] rounded-xl">
                  {PERIODS_LIST.map(p => {
                    const Icon = p.icon;
                    const active = period === p.key;
                    return (
                      <button key={p.key} onClick={() => setPeriod(p.key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black transition-all ${active ? "bg-white dark:bg-[#1a1a2e] text-black dark:text-white shadow-sm" : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"}`}
                        data-testid={`button-period-${p.key}`}
                      >
                        <Icon className="w-3.5 h-3.5"/>{p.ar}
                      </button>
                    );
                  })}
                </div>

                {/* Multi-year picker */}
                {period === "multiyear" && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">عدد السنوات:</span>
                    <button onClick={() => setYears(y => Math.max(2, y - 1))} className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition"><Minus className="w-3 h-3"/></button>
                    <span className="text-lg font-black text-blue-700 dark:text-blue-300 w-6 text-center">{years}</span>
                    <button onClick={() => setYears(y => Math.min(10, y + 1))} className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition"><Plus className="w-3 h-3"/></button>
                    <span className="text-xs font-bold text-blue-500 dark:text-blue-400">خصم {multiYearDiscount(years)}% على السنوات الإضافية</span>
                  </motion.div>
                )}
              </div>

              {/* Plan cards — 3 col grid, equal heights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
                <PlanCard tier="lite"     period={period} years={years} sector={sector as SectorKey} onCustom={() => openCustom(sector, SECTORS_DATA.find(s=>s.key===sector)?.ar||sector)} onOrder={startOrder}/>
                <PlanCard tier="pro"      period={period} years={years} sector={sector as SectorKey} onCustom={() => openCustom(sector, SECTORS_DATA.find(s=>s.key===sector)?.ar||sector)} onOrder={startOrder}/>
                <PlanCard tier="infinity" period={period} years={years} sector={sector as SectorKey} onCustom={() => openCustom(sector, SECTORS_DATA.find(s=>s.key===sector)?.ar||sector)} onOrder={startOrder}/>
              </div>

              {/* Custom banner — below main cards */}
              <CustomBanner onOpen={() => openCustom(sector, SECTORS_DATA.find(s=>s.key===sector)?.ar||sector, period==="multiyear"?`${years}y`:period)}/>

              {/* Lifetime perks */}
              {period === "lifetime" && <LifetimePerks/>}

              {/* Multi-year note */}
              {period === "multiyear" && (
                <div className="mt-6 text-center text-xs text-black/30 dark:text-white/30">
                  السنة الثانية وما بعدها تأخذ خصم 5% إضافي لكل سنة — الخصم الأقصى 40%
                </div>
              )}

              {/* Lifetime note */}
              {period !== "lifetime" && (
                <div className="mt-6 text-center">
                  <p className="text-xs text-black/30 dark:text-white/30">
                    جميع باقات مدى الحياة تشمل نطاقاً مجانياً لمدة 3 سنوات + دعم تقني 3 سنوات + استضافة على خوادم كيروكس مدى الحياة
                  </p>
                </div>
              )}
            </>
          ) : null}

          {/* "قطاع آخر" — inline custom request form (no prices) */}
          {sector === "other" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-black dark:text-white mb-2">قطاع آخر</h2>
                <p className="text-sm text-black/40 dark:text-white/40">اوصف نظامك وسنرفع طلبك مباشرةً للفريق المختص</p>
              </div>
              <CustomInlineForm
                sector="other"
                sectorLabel="قطاع آخر"
                initialDuration={period === "multiyear" ? `${years}y` : period}
              />

              {/* Multi-year note */}
              {period === "multiyear" && (
                <div className="mt-6 text-center text-xs text-black/30 dark:text-white/30">
                  السنة الثانية وما بعدها تأخذ خصم 5% إضافي لكل سنة — الخصم الأقصى 40%
                </div>
              )}

              {/* Lifetime note */}
              {period !== "lifetime" && (
                <div className="mt-6 text-center">
                  <p className="text-xs text-black/30 dark:text-white/30">
                    جميع باقات مدى الحياة تشمل نطاقاً مجانياً لمدة 3 سنوات + دعم تقني 3 سنوات + استضافة على خوادم كيروكس مدى الحياة
                  </p>
                </div>
              )}
            </>
          )}

        </div>
      </section>

      {/* Custom Modal */}
      {customOpen && (
        <CustomModal
          onClose={() => setCustomOpen(false)}
          sector={customSector}
          sectorLabel={customSectorLabel}
          initialDuration={customDuration}
        />
      )}

      {/* ── Systems Showcase Section ── */}
      <SystemsShowcase sector={sector === "other" ? "restaurant" : sector as any} />

      <Footer/>
    </div>
  );
}

/* ─── Systems Showcase ────────────────────────────────────────────────── */
const SECTOR_SYSTEMS: Record<string, { icon: any; title: string; description: string; features: string[]; badge?: string; highlight?: boolean; locked?: boolean }[]> = {
  restaurant: [
    { icon: ChefHat, title: "نظام إدارة المطعم", description: "منصة متكاملة لإدارة القائمة والطلبات والطاولات بلحظة واحدة", features: ["قائمة رقمية تفاعلية", "إدارة الطلبات لحظة بلحظة", "نظام الطاولات والحجوزات", "تقارير المبيعات اليومية"], badge: "الأكثر طلباً", highlight: true },
    { icon: QrCode, title: "قائمة QR كود", description: "منيو رقمي يُفتح بمسح كيو آر — بدون تطبيق", features: ["تحديث فوري للأسعار", "صور عالية الجودة", "متعدد اللغات", "تخصيص كامل"] },
    { icon: ShoppingCart, title: "نظام الطلب الإلكتروني", description: "استقبل الطلبات مباشرة من موقعك دون وسيط", features: ["طلب للتوصيل والاستلام", "تكامل مع WhatsApp", "دفع إلكتروني", "تتبع الطلب"] },
    { icon: BarChart3, title: "لوحة تحكم المبيعات", description: "تقارير وإحصائيات شاملة لفهم أداء مطعمك", features: ["تقارير الأداء اليومي", "أكثر الأطباق مبيعاً", "كشف أوقات الذروة", "مقارنة الفروع"] },
    { icon: Coffee, title: "نظام الاشتراكات والولاء", description: "بناء قاعدة عملاء وفية عبر نقاط المكافآت", features: ["بطاقة الولاء الرقمية", "نقاط المكافآت", "باقات الاشتراك", "إشعارات العروض"] },
  ],
  ecommerce: [
    { icon: ShoppingBag, title: "متجر إلكتروني متكامل", description: "متجر احترافي بتجربة تسوق سلسة ومحرك بحث ذكي", features: ["عرض المنتجات بالفئات", "محرك بحث وفلترة", "سلة التسوق الذكية", "متعدد العملات"], badge: "الأكثر طلباً", highlight: true },
    { icon: CreditCard, title: "بوابة الدفع الإلكتروني", description: "تكامل مع كل طرق الدفع السعودية والعالمية", features: ["مدى وApple Pay", "Stripe وPayPal", "تقسيط تمارا وتابي", "حماية من الاحتيال"] },
    { icon: Package, title: "نظام إدارة المخزون", description: "تتبع المخزون والشحن تلقائياً مع تنبيهات", features: ["تتبع المخزون اللحظي", "باركود للمنتجات", "مستودعات الشحن", "تقارير المخزون"] },
    { icon: TrendingUp, title: "أدوات التسويق الرقمي", description: "أدوات مدمجة لزيادة المبيعات وتحسين الظهور", features: ["SEO متقدم", "كوبونات الخصم", "بيع متقاطع ذكي", "تكامل Meta وGoogle"] },
    { icon: Bot, title: "مساعد ذكاء اصطناعي", description: "روبوت دردشة ذكي يرد على استفسارات العملاء", features: ["إجابات فورية", "تتبع الطلبات", "إحالة للدعم", "تعلم تلقائي"], badge: "جديد" },
  ],
  education: [
    { icon: BookOpen, title: "منصة التعليم الإلكتروني", description: "نظام إدارة محتوى تعليمي كامل مع تجربة طالب متميزة", features: ["رفع الدروس والمحاضرات", "تقدم الطالب والشهادات", "اختبارات تفاعلية", "لوحة المعلم"], badge: "الأكثر طلباً", highlight: true },
    { icon: Video, title: "البث المباشر والدروس المسجلة", description: "بث الدروس مباشرة أو تسجيلها للمشاهدة", features: ["بث مباشر متكامل", "تسجيل تلقائي", "غرفة الأسئلة", "خدمة التقطير"] },
    { icon: Award, title: "نظام الشهادات الرقمية", description: "إصدار شهادات إتمام إلكترونية موثقة", features: ["شهادات قابلة للتحقق", "رفع على LinkedIn", "تصميم بهويتك", "أرشيف كامل"] },
    { icon: CalendarCheck, title: "نظام حجز الجلسات", description: "احجز جلسات تدريبية فردية مع المدربين", features: ["تقويم المدرب", "إشعارات الحصص", "تكامل Zoom", "دفع قبل الحجز"] },
  ],
  healthcare: [
    { icon: Stethoscope, title: "نظام إدارة العيادات", description: "نظام طبي متكامل لإدارة المرضى والمواعيد", features: ["ملف المريض الرقمي", "إدارة المواعيد", "الوصفات الطبية", "تقارير إحصائية"], badge: "الأكثر طلباً", highlight: true },
    { icon: CalendarCheck, title: "حجز المواعيد أونلاين", description: "بوابة حجز ذكية للمرضى مع تذكيرات تلقائية", features: ["حجز عبر الموقع", "تذكير SMS/واتساب", "تأكيد تلقائي", "لائحة انتظار ذكية"] },
    { icon: Pill, title: "إدارة الصيدلية والأدوية", description: "تتبع المخزون الدوائي وإدارة الوصفات", features: ["مخزون الأدوية", "تنبيهات الانتهاء", "الوصفات الرقمية", "تقارير الصرف"] },
    { icon: Activity, title: "لوحة التحليل الصحي", description: "تحليلات شاملة لأداء العيادة والمرضى", features: ["إحصائيات المرضى", "تحليل الأمراض الشائعة", "تقارير الأطباء", "مؤشرات الأداء"] },
  ],
  realestate: [
    { icon: Home, title: "موقع عرض العقارات", description: "منصة احترافية لعرض وبيع وتأجير العقارات", features: ["بحث متقدم بالموقع", "معرض صور وفيديو 360°", "خريطة تفاعلية", "نماذج استفسار ذكية"], badge: "الأكثر طلباً", highlight: true },
    { icon: MapPin, title: "نظام إدارة العقارات", description: "نظام داخلي لإدارة محفظتك العقارية كاملاً", features: ["إدارة الوحدات", "عقود الإيجار الرقمية", "تتبع المدفوعات", "صيانة وبلاغات"] },
    { icon: CalendarCheck, title: "نظام حجز المعاينات", description: "جدولة المعاينات العقارية بشكل منظم", features: ["حجز المعاينات", "جدول الوكلاء", "تذكيرات تلقائية", "تقارير المعاينات"] },
    { icon: FileText, title: "العقود الرقمية", description: "إعداد وتوقيع عقود البيع والإيجار إلكترونياً", features: ["عقود قابلة للتوقيع", "أرشيف العقود", "تنبيهات التجديد", "حماية قانونية"] },
  ],
  corporate: [
    { icon: Building2, title: "موقع الشركة الاحترافي", description: "حضور رقمي قوي يعكس هوية ومكانة شركتك", features: ["هوية بصرية متكاملة", "صفحات الخدمات", "نماذج التواصل", "SEO متقدم"], badge: "الأكثر طلباً", highlight: true },
    { icon: Users, title: "نظام إدارة الموظفين HR", description: "نظام شامل لإدارة الموارد البشرية والرواتب", features: ["ملفات الموظفين", "الحضور والإجازات", "كشف الرواتب", "تقييمات الأداء"] },
    { icon: Briefcase, title: "نظام إدارة العملاء CRM", description: "تتبع العملاء المحتملين وصفقاتك", features: ["خط المبيعات", "متابعة العملاء", "تذكيرات المهام", "تقارير الأداء"] },
    { icon: Database, title: "نظام ERP مؤسسي", description: "نظام متكامل يربط المبيعات والمخزون والمحاسبة", features: ["المبيعات والمشتريات", "المحاسبة والفواتير", "إدارة المخزون", "لوحات التحليل"], locked: true },
  ],
  fitness: [
    { icon: Dumbbell, title: "نظام إدارة الصالة", description: "نظام شامل لإدارة العضويات والحضور والمدربين", features: ["إدارة العضويات", "نظام الحضور", "جدول التمارين", "تقارير الأداء"], badge: "الأكثر طلباً", highlight: true },
    { icon: CreditCard, title: "الاشتراكات والمدفوعات", description: "إدارة باقات الاشتراك والمدفوعات تلقائياً", features: ["باقات متعددة", "تجديد تلقائي", "إشعار انتهاء الاشتراك", "تاريخ الدفعات"] },
    { icon: Users, title: "إدارة المدربين", description: "نظام لجدولة المدربين ومتابعة أدائهم", features: ["جدول المدرب", "عدد الجلسات", "تقييم العملاء", "العمولات"] },
    { icon: Smartphone, title: "تطبيق الأعضاء", description: "تطبيق PWA للأعضاء لمتابعة تقدمهم", features: ["خطة التمرين", "تتبع التقدم", "حجز الجلسات", "إشعارات المدرب"] },
  ],
  beauty: [
    { icon: Sparkles, title: "نظام إدارة الصالون", description: "نظام متكامل لإدارة المواعيد والعملاء والموظفين", features: ["حجز المواعيد", "ملفات العميلات", "إدارة الخدمات", "تقارير الأداء"], badge: "الأكثر طلباً", highlight: true },
    { icon: CalendarCheck, title: "الحجز الإلكتروني", description: "بوابة حجز أونلاين متاحة 24/7 للعميلات", features: ["حجز بدون مكالمات", "تذكيرات تلقائية", "تأكيد فوري", "إلغاء سهل"] },
    { icon: Award, title: "برنامج الولاء والنقاط", description: "برنامج مكافآت يشجع العميلات على العودة", features: ["نقاط مع كل زيارة", "مكافآت قابلة للاستبدال", "مستويات VIP", "عروض حصرية"] },
    { icon: Users, title: "إدارة الموظفين والعمولات", description: "تتبع أداء الموظفين وحساب العمولات", features: ["أداء كل موظف", "العمولات التلقائية", "تقييم العملاء", "جدول الورديات"] },
  ],
  events: [
    { icon: Calendar, title: "منصة إدارة الفعاليات", description: "نظام شامل لتنظيم وإدارة الفعاليات والمناسبات", features: ["إدارة التذاكر", "تسجيل المشاركين", "برنامج الفعالية", "تقارير الحضور"], badge: "الأكثر طلباً", highlight: true },
    { icon: CreditCard, title: "بيع التذاكر أونلاين", description: "منصة بيع تذاكر متكاملة مع دفع إلكتروني", features: ["باركود التذاكر", "تذاكر مجانية ومدفوعة", "إدارة الطاقة الاستيعابية", "إحصائيات المبيعات"] },
    { icon: Users, title: "إدارة الضيوف والمتحدثين", description: "إدارة قوائم الضيوف والمتحدثين بسهولة", features: ["قوائم VIP", "بوابة المتحدث", "تسجيل وصول QR", "إشعارات مخصصة"] },
    { icon: Globe, title: "موقع الفعالية الاحترافي", description: "صفحة هبوط مخصصة لكل فعالية", features: ["تصميم احترافي", "عد تنازلي", "خريطة الموقع", "نماذج التسجيل"] },
  ],
  marketing: [
    { icon: TrendingUp, title: "موقع الوكالة التسويقية", description: "حضور رقمي احترافي يعرض خدماتك وأعمالك", features: ["محفظة الأعمال", "صفحات الخدمات", "نماذج الاستفسار", "مدونة المحتوى"], badge: "الأكثر طلباً", highlight: true },
    { icon: BarChart3, title: "لوحة تقارير العملاء", description: "لوحة تقارير احترافية لعرض نتائج حملاتك", features: ["إحصائيات مخصصة", "تقارير PDF", "مقاييس الأداء", "تصدير البيانات"] },
    { icon: Users, title: "إدارة العملاء CRM", description: "نظام لإدارة عملاء الوكالة ومشاريعهم", features: ["ملفات العملاء", "متابعة المشاريع", "تسجيل المهام", "فواتير وعروض أسعار"] },
    { icon: MessageSquare, title: "إدارة السوشيال ميديا", description: "جدولة ونشر المحتوى عبر منصات متعددة", features: ["جدولة المنشورات", "تعدد المنصات", "تقارير التفاعل", "مكتبة المحتوى"] },
  ],
  ai: [
    { icon: Bot, title: "منصة خدمات الذكاء الاصطناعي", description: "منصة متكاملة لتقديم خدمات وحلول الذكاء الاصطناعي", features: ["واجهة المستخدم الذكية", "تكامل النماذج اللغوية", "لوحة إدارة المشاريع", "API للمطورين"], badge: "الأكثر طلباً", highlight: true },
    { icon: MessageSquare, title: "روبوت المحادثة الذكي", description: "شاتبوت مدرَّب على بيانات نشاطك التجاري", features: ["إجابات تلقائية ذكية", "تكامل مع WhatsApp", "تعلم مستمر", "إحصائيات المحادثات"] },
    { icon: Code2, title: "واجهة API للمطورين", description: "بوابة API لتوصيل خدمات الذكاء الاصطناعي", features: ["توثيق API شامل", "مفاتيح API آمنة", "Rate Limiting", "Sandbox للاختبار"] },
    { icon: BarChart3, title: "لوحة التحليلات الذكية", description: "تحليلات مدعومة بالذكاء الاصطناعي لفهم بياناتك", features: ["تنبؤات المبيعات", "تحليل سلوك المستخدم", "كشف الشذوذ", "تقارير ذكية"] },
  ],
};

function SystemsShowcase({ sector }: { sector: string }) {
  const systems = SECTOR_SYSTEMS[sector] || SECTOR_SYSTEMS.restaurant;

  return (
    <section className="px-4 py-16 bg-black/[0.02] dark:bg-white/[0.01] border-t border-black/[0.04] dark:border-white/[0.04]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-black/25 dark:text-white/25 mb-3">
            <Layers className="w-3 h-3" /> ماذا يشمل نظامك
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-black dark:text-white mb-3">
            الأنظمة المتضمنة في باقتك
          </h2>
          <p className="text-sm text-black/40 dark:text-white/40 max-w-lg mx-auto">
            كل باقة تأتي مع منظومة متكاملة من الأنظمة المتخصصة لقطاعك — مُصمَّمة خصيصاً لتلبية احتياجاتك
          </p>
        </div>

        {/* System cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {systems.map((sys, i) => {
            const Icon = sys.icon;
            return (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={{ hidden: { opacity: 0, y: 16 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }) }}
                className={`relative bg-white dark:bg-[#0f172a] border rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-md ${
                  sys.highlight
                    ? "border-black/15 dark:border-white/10 shadow-sm"
                    : "border-black/[0.06] dark:border-white/[0.06]"
                } ${sys.locked ? "opacity-60" : ""}`}
                data-testid={`system-card-${i}`}
              >
                {sys.badge && (
                  <div className="absolute -top-2.5 right-4">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${sys.highlight ? "bg-black text-white dark:bg-white dark:text-black" : "bg-black/[0.07] dark:bg-white/[0.07] text-black/70 dark:text-white/70"}`}>
                      {sys.badge}
                    </span>
                  </div>
                )}
                {sys.locked && (
                  <div className="absolute top-3 left-3">
                    <Lock className="w-3.5 h-3.5 text-black/25 dark:text-white/25" />
                  </div>
                )}

                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${sys.highlight ? "bg-black dark:bg-white" : "bg-black/[0.05] dark:bg-white/[0.05]"}`}>
                    <Icon className={`w-5 h-5 ${sys.highlight ? "text-white dark:text-black" : "text-black/40 dark:text-white/40"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-black dark:text-white text-sm leading-tight">{sys.title}</h3>
                    <p className="text-[11px] text-black/40 dark:text-white/40 mt-0.5 leading-relaxed line-clamp-2">{sys.description}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {sys.features.map((feat, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-black/[0.06] dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                        <Check className="w-2 h-2 text-black/50 dark:text-white/50" />
                      </div>
                      <span className="text-[11px] text-black/50 dark:text-white/50">{feat}</span>
                    </div>
                  ))}
                </div>

                {sys.locked && (
                  <div className="mt-3 pt-2.5 border-t border-black/[0.05] dark:border-white/[0.05]">
                    <span className="text-[10px] text-black/30 dark:text-white/30 font-medium">متاح في باقة إنفينتي فقط</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-xs text-black/30 dark:text-white/30 mb-4">
            جميع الأنظمة تأتي مُعدَّة ومُخصَّصة بهويتك التجارية — التسليم بين 7-21 يوم
          </p>
          <Button
            variant="outline"
            className="border-black/10 dark:border-white/10 text-sm"
            onClick={() => window.open("/systems", "_blank")}
            data-testid="button-explore-systems"
          >
            استكشف جميع الأنظمة <ExternalLink className="w-3.5 h-3.5 mr-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
