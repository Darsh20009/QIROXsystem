import { useState, useMemo } from "react";
import { useCurrency } from "@/hooks/use-currency";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import {
  Utensils, Coffee, Scissors, Heart, BookOpen, Home, Dumbbell,
  GraduationCap, ShoppingBag, Monitor, ChevronDown, ChevronUp,
  CheckCircle2, Search, X, Zap, Star, Target, Shield, Globe,
  Wifi, Smartphone, BarChart3, Users, Clock, CreditCard, Bell,
  FileText, Layers, Settings, TrendingUp, Package, Calendar,
  MessageSquare, QrCode, Printer, MapPin, Truck, Lock, Brain,
  ChefHat, Camera, Music, Award, Activity, Stethoscope, Pill,
  Building2, Key, Wrench, ShoppingCart, Tag, ArrowLeft, ArrowRight,
  Grid3x3, List, Sparkles, Rocket
} from "lucide-react";
import { Link } from "wouter";

// ─── Sector Data ──────────────────────────────────────────────────────────────

const SECTORS = [
  {
    id: "restaurant",
    nameAr: "نظام المطاعم",
    nameEn: "Restaurant System",
    descAr: "نظام متكامل لإدارة المطاعم من الطلب حتى التوصيل — بواجهة مصممة للسرعة والسهولة",
    descEn: "Full restaurant management from order to delivery — built for speed and simplicity",
    icon: Utensils,
    color: "from-orange-500 to-red-500",
    light: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800",
    textColor: "text-orange-600 dark:text-orange-400",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
    accent: "#f97316",
    category: "F&B",
    complexity: 5,
    popularity: 5,
    modules: [
      { icon: Monitor, nameAr: "نقطة بيع (POS) مخصصة", nameEn: "Custom POS Interface" },
      { icon: QrCode, nameAr: "قائمة QR للعملاء", nameEn: "QR Digital Menu" },
      { icon: ChefHat, nameAr: "شاشة المطبخ (KDS)", nameEn: "Kitchen Display (KDS)" },
      { icon: Truck, nameAr: "إدارة التوصيل", nameEn: "Delivery Management" },
      { icon: Users, nameAr: "إدارة الطاولات والغرف", nameEn: "Table & Floor Management" },
      { icon: Package, nameAr: "مخزون المواد الخام", nameEn: "Raw Materials Inventory" },
      { icon: BarChart3, nameAr: "تقارير الأصناف والمبيعات", nameEn: "Item & Sales Reports" },
      { icon: Star, nameAr: "نظام الولاء والنقاط", nameEn: "Loyalty & Points System" },
      { icon: Smartphone, nameAr: "تطبيق موبايل للعملاء", nameEn: "Customer Mobile App" },
      { icon: CreditCard, nameAr: "دفع متعدد الوسائل", nameEn: "Multi-method Payments" },
    ],
    uniqueFeatures: [
      { ar: "شاشة مطبخ (KDS) لعرض الطلبات لفريق الطهي مباشرةً", en: "Kitchen Display System for real-time chef order tracking" },
      { ar: "تتبع حالة كل طلب لحظياً (يُحضَّر / جاهز / تم التسليم)", en: "Real-time order status tracking per table/delivery" },
      { ar: "إدارة موديفايرز القائمة (بدون بصل، حار، إضافات...)", en: "Full menu modifiers management (no onion, spicy, extras)" },
      { ar: "جلسات كاشير منفصلة مع إغلاق يومي وتسوية", en: "Separate cashier sessions with daily closing & reconciliation" },
      { ar: "قائمة QR ديناميكية تُحدَّث لحظياً بدون إعادة طباعة", en: "Dynamic QR menu — updates instantly, no reprinting" },
    ],
    techSpecs: [
      { ar: "نقطة بيع تعمل بدون إنترنت (Offline Mode)", en: "Offline POS mode — works without internet" },
      { ar: "طابعة إيصالات حرارية + طباعة مباشرة للمطبخ", en: "Thermal receipt printer + direct kitchen printing" },
      { ar: "تكامل مع أجهزة الباركود والوزن", en: "Barcode scanner & weight scale integration" },
      { ar: "داشبورد تحليلي يومي/أسبوعي/شهري", en: "Daily/weekly/monthly analytics dashboard" },
      { ar: "نظام API مفتوح للتكامل مع مزودي التوصيل", en: "Open API for delivery platform integrations" },
    ],
    targetUsers: [
      { ar: "مطاعم عائلية وسريعة الخدمة", en: "Family & fast food restaurants" },
      { ar: "سلاسل المطاعم متعددة الفروع", en: "Multi-branch restaurant chains" },
      { ar: "مطابخ السحابة (Cloud Kitchens)", en: "Cloud & ghost kitchens" },
      { ar: "المطاعم الفندقية", en: "Hotel restaurants" },
    ],
  },
  {
    id: "cafe",
    nameAr: "نظام الكافيهات",
    nameEn: "Café System",
    descAr: "مصمم خصيصاً لإيقاع الكافيه — طلبيات سريعة، مشروبات مخصصة، وتجربة عملاء مميزة",
    descEn: "Built for the café pace — quick orders, custom drinks, and premium customer experience",
    icon: Coffee,
    color: "from-amber-500 to-yellow-500",
    light: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    textColor: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    accent: "#f59e0b",
    category: "F&B",
    complexity: 3,
    popularity: 5,
    modules: [
      { icon: Monitor, nameAr: "POS سريع للكافيه", nameEn: "Fast Café POS" },
      { icon: Coffee, nameAr: "مخصصات المشروبات", nameEn: "Drink Customization" },
      { icon: QrCode, nameAr: "طلب عبر QR من الطاولة", nameEn: "QR Table Ordering" },
      { icon: CreditCard, nameAr: "بطاقات الشحن والرصيد", nameEn: "Prepaid Balance Cards" },
      { icon: Star, nameAr: "نظام الولاء والنقاط", nameEn: "Loyalty & Stamps" },
      { icon: BarChart3, nameAr: "تقارير المشروبات الأفضل مبيعاً", nameEn: "Best-seller Reports" },
      { icon: Bell, nameAr: "نداء الطلب الجاهز", nameEn: "Order Ready Notification" },
      { icon: Smartphone, nameAr: "تطبيق موبايل", nameEn: "Mobile App" },
    ],
    uniqueFeatures: [
      { ar: "خيارات تخصيص المشروبات (سايز، إضافات، حرارة، سكر)", en: "Full drink customization (size, extras, temperature, sugar)" },
      { ar: "نظام بطاقات الشحن المدفوعة مسبقاً للعملاء المميزين", en: "Prepaid loyalty cards for VIP customers" },
      { ar: "طوابع رقمية (اشترِ 9 واحصل على 1 مجاناً)", en: "Digital stamps system (buy 9 get 1 free)" },
      { ar: "شاشة عرض للعملاء تُظهر طلبهم وتوقع الاستلام", en: "Customer display screen showing their order & ETA" },
      { ar: "إدارة قوائم موسمية وعروض الصباح/المساء بتوقيت تلقائي", en: "Seasonal menus & time-based morning/evening specials" },
    ],
    techSpecs: [
      { ar: "طباعة تذاكر مشروبات مخصصة لكل باريستا", en: "Custom drink tickets printed per barista station" },
      { ar: "تكامل مع ماكينات الدفع اللاتماسي (Tap-to-Pay)", en: "Contactless payment terminal integration" },
      { ar: "داشبورد ساعة الذروة وتحليل الطلبيات", en: "Peak hour dashboard & order flow analysis" },
    ],
    targetUsers: [
      { ar: "الكافيهات المستقلة والسلاسل", en: "Independent & chain cafés" },
      { ar: "كافيهات بأكثر من كاشير أو فرع", en: "Multi-cashier or multi-branch cafés" },
    ],
  },
  {
    id: "salon",
    nameAr: "نظام صالونات التجميل",
    nameEn: "Beauty Salon System",
    descAr: "نظام حجوزات وإدارة شاملة للصالونات — من موعد العميل حتى متابعة الفنيين وتقارير الأداء",
    descEn: "Full booking and management for salons — from client appointment to stylist performance",
    icon: Scissors,
    color: "from-pink-500 to-rose-500",
    light: "bg-pink-50 dark:bg-pink-950/30",
    border: "border-pink-200 dark:border-pink-800",
    textColor: "text-pink-600 dark:text-pink-400",
    badge: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
    accent: "#ec4899",
    category: "Beauty",
    complexity: 3,
    popularity: 4,
    modules: [
      { icon: Calendar, nameAr: "نظام الحجوزات الذكي", nameEn: "Smart Booking System" },
      { icon: Users, nameAr: "إدارة الفنيين والغرف", nameEn: "Stylist & Room Management" },
      { icon: FileText, nameAr: "ملف العميل التفصيلي", nameEn: "Client Profile & History" },
      { icon: Bell, nameAr: "تذكيرات المواعيد التلقائية", nameEn: "Auto Appointment Reminders" },
      { icon: Package, nameAr: "مخزون منتجات الصالون", nameEn: "Product Inventory" },
      { icon: CreditCard, nameAr: "الفواتير والدفع", nameEn: "Billing & Payments" },
      { icon: BarChart3, nameAr: "تقارير الفنيين والأداء", nameEn: "Stylist Performance Reports" },
      { icon: Star, nameAr: "برنامج الولاء والعروض", nameEn: "Loyalty & Promotions" },
      { icon: Globe, nameAr: "حجز أونلاين من الموقع", nameEn: "Online Booking from Website" },
    ],
    uniqueFeatures: [
      { ar: "جدولة ذكية تراعي مدة كل خدمة وإتاحة الفنيين", en: "Smart scheduling based on service duration & stylist availability" },
      { ar: "ملف العميل يحتوي ألوان الشعر السابقة والحساسيات والتفضيلات", en: "Client file with past hair colors, allergies & preferences" },
      { ar: "تذكيرات SMS/واتساب تلقائية قبل الموعد بساعة أو يوم", en: "Auto SMS/WhatsApp reminders 1hr or 1 day before appointment" },
      { ar: "حساب عمولة كل فني بناءً على الخدمات المنجزة", en: "Auto stylist commission calculation per completed service" },
      { ar: "قائمة انتظار ذكية عند امتلاء المواعيد", en: "Smart waitlist when appointments are fully booked" },
    ],
    techSpecs: [
      { ar: "تقويم تفاعلي يومي/أسبوعي مع Drag & Drop", en: "Interactive daily/weekly calendar with Drag & Drop" },
      { ar: "تكامل مع Google Calendar وApple Calendar", en: "Google Calendar & Apple Calendar integration" },
      { ar: "تقارير إيرادات كل فني والخدمات الأكثر طلباً", en: "Per-stylist revenue reports & most-requested services" },
    ],
    targetUsers: [
      { ar: "صالونات نساء ورجال", en: "Ladies & gents salons" },
      { ar: "سبا ومراكز تجميل", en: "Spas & beauty centers" },
      { ar: "سلاسل الصالونات", en: "Salon chains" },
    ],
  },
  {
    id: "clinic",
    nameAr: "نظام العيادات والمستشفيات",
    nameEn: "Clinic & Hospital System",
    descAr: "نظام طبي متكامل للعيادات والمستشفيات — ملف المريض، المواعيد، الوصفات، والفواتير في مكان واحد",
    descEn: "Complete medical system for clinics & hospitals — patient records, appointments, prescriptions & billing",
    icon: Stethoscope,
    color: "from-cyan-500 to-blue-500",
    light: "bg-cyan-50 dark:bg-cyan-950/30",
    border: "border-cyan-200 dark:border-cyan-800",
    textColor: "text-cyan-600 dark:text-cyan-400",
    badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
    accent: "#06b6d4",
    category: "Healthcare",
    complexity: 5,
    popularity: 4,
    modules: [
      { icon: FileText, nameAr: "الملف الطبي الإلكتروني", nameEn: "Electronic Patient Record" },
      { icon: Calendar, nameAr: "جدولة المواعيد", nameEn: "Appointment Scheduling" },
      { icon: Pill, nameAr: "وصفات إلكترونية", nameEn: "E-Prescriptions" },
      { icon: Users, nameAr: "إدارة الأطباء والأخصائيين", nameEn: "Doctor & Specialist Management" },
      { icon: CreditCard, nameAr: "الفواتير والتأمين", nameEn: "Billing & Insurance" },
      { icon: Activity, nameAr: "متابعة الحالة الصحية", nameEn: "Health Status Tracking" },
      { icon: Bell, nameAr: "تذكيرات الجرعات والمواعيد", nameEn: "Dose & Appointment Reminders" },
      { icon: Package, nameAr: "إدارة مستودع الأدوية", nameEn: "Pharmacy Inventory" },
      { icon: BarChart3, nameAr: "تقارير الإشغال والأداء", nameEn: "Occupancy & Performance Reports" },
    ],
    uniqueFeatures: [
      { ar: "ملف طبي كامل للمريض مع تاريخ الأمراض والحساسيات والأدوية", en: "Full patient EMR with disease history, allergies & medications" },
      { ar: "وصفات إلكترونية قابلة للطباعة والإرسال للصيدلية مباشرة", en: "E-prescriptions printable & sent directly to pharmacy" },
      { ar: "قائمة انتظار ذكية مع عرض الوقت المتبقي للمريض", en: "Smart queue system showing estimated wait time to patients" },
      { ar: "نظام التحويل بين الأطباء داخل نفس المنشأة", en: "Internal doctor-to-doctor referral system" },
      { ar: "تقارير الإشغال الساعية لتحسين كفاءة العمل", en: "Hourly occupancy reports for optimal workflow efficiency" },
    ],
    techSpecs: [
      { ar: "متوافق مع معايير بيانات الرعاية الصحية (FHIR/HL7)", en: "Compatible with healthcare data standards (FHIR/HL7)" },
      { ar: "تشفير كامل لبيانات المرضى", en: "Full patient data encryption" },
      { ar: "تكامل مع أجهزة القياس الطبية", en: "Medical device integration support" },
    ],
    targetUsers: [
      { ar: "عيادات الأطباء المتخصصين", en: "Specialist doctor clinics" },
      { ar: "مراكز طبية متعددة التخصصات", en: "Multi-specialty medical centers" },
      { ar: "مستشفيات صغيرة ومتوسطة", en: "Small & medium hospitals" },
    ],
  },
  {
    id: "quran",
    nameAr: "نظام أكاديميات تحفيظ القرآن",
    nameEn: "Quran Academy System",
    descAr: "نظام متخصص لأكاديميات القرآن الكريم — إدارة الحلقات والطلاب وتتبع التقدم والتواصل مع الأسر",
    descEn: "Specialized system for Quran academies — manage circles, students, progress tracking & family communication",
    icon: BookOpen,
    color: "from-green-500 to-emerald-600",
    light: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    textColor: "text-green-600 dark:text-green-400",
    badge: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    accent: "#22c55e",
    category: "Education",
    complexity: 3,
    popularity: 5,
    modules: [
      { icon: Users, nameAr: "إدارة الطلاب والمجموعات", nameEn: "Student & Group Management" },
      { icon: Calendar, nameAr: "جداول الحلقات", nameEn: "Circle Schedules" },
      { icon: CheckCircle2, nameAr: "تتبع التقدم والحفظ", nameEn: "Memorization Progress Tracking" },
      { icon: Award, nameAr: "شهادات رقمية", nameEn: "Digital Certificates" },
      { icon: Clock, nameAr: "نظام الحضور والغياب", nameEn: "Attendance System" },
      { icon: MessageSquare, nameAr: "تواصل مع أولياء الأمور", nameEn: "Parent Communication Portal" },
      { icon: CreditCard, nameAr: "إدارة الرسوم والاشتراكات", nameEn: "Fees & Subscription Management" },
      { icon: BarChart3, nameAr: "تقارير تفصيلية لكل طالب", nameEn: "Detailed Per-student Reports" },
    ],
    uniqueFeatures: [
      { ar: "تتبع تقدم الحفظ صفحة بصفحة لكل طالب مع ملاحظات المعلم", en: "Page-by-page memorization tracking per student with teacher notes" },
      { ar: "شهادات رقمية تُصدر تلقائياً عند اكتمال الختمة", en: "Auto-generated digital certificates upon Quran completion" },
      { ar: "تقارير للولي يعرض فيها تقدم الطالب وحضوره أسبوعياً", en: "Weekly parent reports showing student progress & attendance" },
      { ar: "نظام التلاوة الصوتية — يسجل الطالب ويراجع المعلم", en: "Audio recitation system — student records, teacher reviews" },
      { ar: "دعم المجموعات المختلطة والمنفصلة (أونلاين وبالحضور)", en: "Supports online & in-person mixed groups" },
    ],
    techSpecs: [
      { ar: "تطبيق خاص بالطالب لمتابعة مسيرته القرآنية", en: "Dedicated student app for tracking Quran journey" },
      { ar: "إشعارات للأسرة عبر واتساب/SMS تلقائياً", en: "Auto WhatsApp/SMS notifications to families" },
      { ar: "تصدير تقارير الدفعة الكاملة بصيغة Excel/PDF", en: "Batch report export in Excel/PDF format" },
    ],
    targetUsers: [
      { ar: "أكاديميات تحفيظ القرآن", en: "Quran memorization academies" },
      { ar: "حلقات المساجد والمراكز الإسلامية", en: "Mosque circles & Islamic centers" },
      { ar: "الأكاديميات الأونلاين", en: "Online Quran academies" },
    ],
  },
  {
    id: "realestate",
    nameAr: "نظام إدارة العقارات",
    nameEn: "Real Estate Management System",
    descAr: "إدارة كاملة للعقارات والوحدات والعقود والمستأجرين — تحكم كامل في محفظتك العقارية",
    descEn: "Complete property management — units, contracts, tenants & full real estate portfolio control",
    icon: Home,
    color: "from-violet-500 to-purple-600",
    light: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-800",
    textColor: "text-violet-600 dark:text-violet-400",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
    accent: "#8b5cf6",
    category: "Real Estate",
    complexity: 4,
    popularity: 3,
    modules: [
      { icon: Building2, nameAr: "إدارة العقارات والوحدات", nameEn: "Property & Unit Management" },
      { icon: FileText, nameAr: "إدارة العقود والإيجارات", nameEn: "Contract & Lease Management" },
      { icon: Users, nameAr: "ملفات المستأجرين", nameEn: "Tenant Profiles" },
      { icon: Wrench, nameAr: "طلبات الصيانة", nameEn: "Maintenance Requests" },
      { icon: CreditCard, nameAr: "إيجارات وسداد ذكي", nameEn: "Rent Collection & Reminders" },
      { icon: BarChart3, nameAr: "تقارير العائد والإشغال", nameEn: "Yield & Occupancy Reports" },
      { icon: Globe, nameAr: "بوابة المالك والمستأجر", nameEn: "Owner & Tenant Portal" },
      { icon: Bell, nameAr: "تنبيهات انتهاء العقود", nameEn: "Contract Expiry Alerts" },
    ],
    uniqueFeatures: [
      { ar: "إدارة محافظ عقارية متعددة (سكني، تجاري، مكاتب)", en: "Multi-portfolio management (residential, commercial, offices)" },
      { ar: "إشعارات تلقائية عند قرب انتهاء العقد أو التأخر في الدفع", en: "Auto alerts for contract expiry & late payment" },
      { ar: "بوابة المستأجر لرفع طلبات الصيانة وعرض الفواتير", en: "Tenant portal for maintenance requests & invoice viewing" },
      { ar: "تقارير العائد على الاستثمار (ROI) لكل عقار", en: "ROI reports per property" },
      { ar: "إدارة ودائع الضمان وتسويتها عند إنهاء العقد", en: "Security deposit management & end-of-contract settlement" },
    ],
    techSpecs: [
      { ar: "دعم عقود إيجار سعودية وفق النظام (REGA)", en: "Saudi lease contracts compliant with REGA regulations" },
      { ar: "تكامل مع منصة إيجار الحكومية", en: "Ejar government platform integration" },
      { ar: "تصدير كامل للبيانات المالية للمحاسبة", en: "Full financial data export for accounting" },
    ],
    targetUsers: [
      { ar: "شركات إدارة العقارات", en: "Property management companies" },
      { ar: "ملاك عقارات متعددة", en: "Multi-property owners" },
      { ar: "مطورو العقارات", en: "Real estate developers" },
    ],
  },
  {
    id: "fitness",
    nameAr: "نظام اللياقة البدنية",
    nameEn: "Gym & Fitness System",
    descAr: "نظام متكامل لإدارة الجيم والنوادي الرياضية — عضويات، حصص، مدربون، وتتبع أداء الأعضاء",
    descEn: "Complete gym & fitness club management — memberships, classes, trainers & member performance tracking",
    icon: Dumbbell,
    color: "from-rose-500 to-red-600",
    light: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200 dark:border-rose-800",
    textColor: "text-rose-600 dark:text-rose-400",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
    accent: "#f43f5e",
    category: "Fitness",
    complexity: 3,
    popularity: 4,
    modules: [
      { icon: CreditCard, nameAr: "إدارة العضويات والباقات", nameEn: "Membership & Package Management" },
      { icon: Calendar, nameAr: "جدولة الحصص الجماعية", nameEn: "Group Class Scheduling" },
      { icon: Users, nameAr: "ملفات الأعضاء الصحية", nameEn: "Member Health Profiles" },
      { icon: Activity, nameAr: "قياسات اللياقة والأهداف", nameEn: "Fitness Measurements & Goals" },
      { icon: QrCode, nameAr: "دخول بالباركود/QR", nameEn: "QR/Barcode Entry Access" },
      { icon: Bell, nameAr: "تذكيرات التجديد والحصص", nameEn: "Renewal & Class Reminders" },
      { icon: BarChart3, nameAr: "تقارير الحضور والإيرادات", nameEn: "Attendance & Revenue Reports" },
      { icon: Star, nameAr: "نظام الولاء ومكافآت الأداء", nameEn: "Loyalty & Achievement Rewards" },
    ],
    uniqueFeatures: [
      { ar: "دخول ذكي بـ QR أو بصمة — بدون كاشير", en: "Smart QR or fingerprint entry — no cashier needed" },
      { ar: "تتبع قياسات الجسم (وزن، دهون، كتلة عضلية) شهرياً", en: "Monthly body measurement tracking (weight, fat, muscle mass)" },
      { ar: "حجز الحصص الجماعية من التطبيق مع قائمة الانتظار", en: "Group class booking from app with automatic waitlist" },
      { ar: "تنبيه تلقائي عند قرب انتهاء العضوية (قبل 7 أيام)", en: "Auto membership expiry alert 7 days before end" },
      { ar: "لوحة المدرب الشخصي مع متابعة عملائه", en: "Personal trainer dashboard with client tracking" },
    ],
    techSpecs: [
      { ar: "نظام تحكم بالبوابات الإلكترونية (Turnstile/Door Lock)", en: "Electronic gate & door lock control system" },
      { ar: "تطبيق عضو لحجز الحصص والاطلاع على التقدم", en: "Member app for booking classes & viewing progress" },
      { ar: "تكامل مع أجهزة الوزن والقياس الذكية", en: "Smart scale & measurement device integration" },
    ],
    targetUsers: [
      { ar: "صالات الجيم والنوادي الرياضية", en: "Gyms & sports clubs" },
      { ar: "مراكز اليوغا والبيلاتس", en: "Yoga & pilates studios" },
      { ar: "نوادي السباحة والأنشطة", en: "Swimming clubs & activity centers" },
    ],
  },
  {
    id: "school",
    nameAr: "نظام إدارة المدارس",
    nameEn: "School Management System",
    descAr: "نظام أكاديمي متكامل للمدارس — طلاب، فصول، جداول، تقارير، وتواصل مع أولياء الأمور",
    descEn: "Full academic system for schools — students, classes, schedules, reports & parent communication",
    icon: GraduationCap,
    color: "from-indigo-500 to-blue-600",
    light: "bg-indigo-50 dark:bg-indigo-950/30",
    border: "border-indigo-200 dark:border-indigo-800",
    textColor: "text-indigo-600 dark:text-indigo-400",
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
    accent: "#6366f1",
    category: "Education",
    complexity: 5,
    popularity: 3,
    modules: [
      { icon: Users, nameAr: "إدارة الطلاب والفصول", nameEn: "Student & Class Management" },
      { icon: Calendar, nameAr: "الجداول الدراسية", nameEn: "Academic Schedules" },
      { icon: Clock, nameAr: "الحضور والغياب", nameEn: "Attendance Tracking" },
      { icon: BarChart3, nameAr: "التقارير الأكاديمية", nameEn: "Academic Reports" },
      { icon: MessageSquare, nameAr: "بوابة أولياء الأمور", nameEn: "Parent Communication Portal" },
      { icon: CreditCard, nameAr: "الرسوم الدراسية والفواتير", nameEn: "Tuition & Billing" },
      { icon: Award, nameAr: "شهادات ووثائق رقمية", nameEn: "Digital Certificates & Documents" },
      { icon: FileText, nameAr: "مناهج ومواد تعليمية", nameEn: "Curriculum & Learning Materials" },
    ],
    uniqueFeatures: [
      { ar: "جدول ذكي يراعي توزيع المعلمين والفصول والمواد", en: "Smart timetable considering teachers, rooms & subjects" },
      { ar: "بوابة الولي لمتابعة درجات وحضور الطالب لحظياً", en: "Parent portal for real-time grades & attendance monitoring" },
      { ar: "نظام الإشعار الفوري عند غياب الطالب", en: "Instant absence notification to parents" },
      { ar: "كشف حساب الرسوم مع جدول أقساط قابل للتخصيص", en: "Fee account statement with customizable installment plan" },
      { ar: "أرشيف رقمي لكل وثائق الطالب طوال مسيرته الدراسية", en: "Digital archive of all student documents throughout their academic journey" },
    ],
    techSpecs: [
      { ar: "لوحة المعلم لرصد الدرجات وإدارة المحتوى", en: "Teacher dashboard for grading & content management" },
      { ar: "تكامل مع نظام الحضور الإلكتروني (بصمة/RFID)", en: "Electronic attendance integration (fingerprint/RFID)" },
      { ar: "تصدير ملف الطالب الكامل بصيغة PDF", en: "Full student profile export in PDF format" },
    ],
    targetUsers: [
      { ar: "المدارس الابتدائية والثانوية", en: "Primary & secondary schools" },
      { ar: "المدارس الأهلية والدولية", en: "Private & international schools" },
      { ar: "مراكز التعليم والدروس الخصوصية", en: "Tutoring & learning centers" },
    ],
  },
  {
    id: "ecommerce",
    nameAr: "نظام التجارة الإلكترونية",
    nameEn: "E-Commerce System",
    descAr: "متجر إلكتروني احترافي متكامل — منتجات، طلبات، شحن، بوابات دفع، وتحليلات متقدمة",
    descEn: "Professional full-stack e-commerce — products, orders, shipping, payment gateways & advanced analytics",
    icon: ShoppingBag,
    color: "from-teal-500 to-cyan-600",
    light: "bg-teal-50 dark:bg-teal-950/30",
    border: "border-teal-200 dark:border-teal-800",
    textColor: "text-teal-600 dark:text-teal-400",
    badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
    accent: "#14b8a6",
    category: "Commerce",
    complexity: 5,
    popularity: 5,
    modules: [
      { icon: Package, nameAr: "إدارة المنتجات والتصنيفات", nameEn: "Product & Category Management" },
      { icon: ShoppingCart, nameAr: "نظام سلة ومعالجة الطلبات", nameEn: "Cart & Order Processing" },
      { icon: Truck, nameAr: "الشحن والتتبع", nameEn: "Shipping & Tracking" },
      { icon: CreditCard, nameAr: "بوابات دفع متعددة", nameEn: "Multiple Payment Gateways" },
      { icon: Tag, nameAr: "كوبونات وعروض وتخفيضات", nameEn: "Coupons, Offers & Discounts" },
      { icon: BarChart3, nameAr: "تحليلات المتجر المتقدمة", nameEn: "Advanced Store Analytics" },
      { icon: Star, nameAr: "تقييمات العملاء", nameEn: "Customer Reviews & Ratings" },
      { icon: Smartphone, nameAr: "تطبيق موبايل للمتجر", nameEn: "Store Mobile App" },
      { icon: Globe, nameAr: "دعم متعدد العملات والمناطق", nameEn: "Multi-currency & Region Support" },
    ],
    uniqueFeatures: [
      { ar: "محرك بحث ذكي مع فلترة متقدمة (سعر، تقييم، الأكثر مبيعاً)", en: "Smart search engine with advanced filters (price, rating, best-seller)" },
      { ar: "إدارة المنتجات المتغيرة (ألوان، مقاسات، خيارات)", en: "Variable products management (colors, sizes, options)" },
      { ar: "تتبع الشحنة من المخزن حتى باب المنزل", en: "Shipment tracking from warehouse to customer's door" },
      { ar: "إدارة المبيعات الفلاشية والعروض المحدودة بالوقت", en: "Flash sales & time-limited offers management" },
      { ar: "لوحة تحكم بائع متعدد (Marketplace) اختياري", en: "Optional multi-vendor marketplace dashboard" },
    ],
    techSpecs: [
      { ar: "تكامل مع Mada, Apple Pay, STCPay, PayPal", en: "Mada, Apple Pay, STCPay & PayPal integration" },
      { ar: "API مفتوح للتكامل مع منصات الشحن (Aramex, SMSA)", en: "Open API for shipping platform integration (Aramex, SMSA)" },
      { ar: "SEO متقدم لكل صفحة منتج", en: "Advanced SEO for every product page" },
    ],
    targetUsers: [
      { ar: "المتاجر الإلكترونية بجميع الأحجام", en: "E-commerce stores of all sizes" },
      { ar: "الشركات الراغبة بالتوسع رقمياً", en: "Businesses expanding to digital sales" },
      { ar: "المنصات متعددة البائعين", en: "Multi-vendor marketplace platforms" },
    ],
  },
  {
    id: "pos",
    nameAr: "نظام نقاط البيع (POS)",
    nameEn: "Point of Sale (POS) System",
    descAr: "حل POS احترافي لأي نوع تجارة — سريع، موثوق، يعمل أونلاين وأوفلاين مع تحكم كامل",
    descEn: "Professional POS for any retail — fast, reliable, online & offline with full control",
    icon: Monitor,
    color: "from-slate-600 to-gray-700",
    light: "bg-slate-50 dark:bg-slate-950/30",
    border: "border-slate-200 dark:border-slate-800",
    textColor: "text-slate-600 dark:text-slate-400",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300",
    accent: "#475569",
    category: "Retail",
    complexity: 2,
    popularity: 5,
    modules: [
      { icon: Monitor, nameAr: "واجهة بيع سريعة", nameEn: "Fast Sales Interface" },
      { icon: Package, nameAr: "إدارة المخزون الآني", nameEn: "Real-time Inventory" },
      { icon: Printer, nameAr: "طباعة إيصالات حرارية", nameEn: "Thermal Receipt Printing" },
      { icon: CreditCard, nameAr: "دفع نقدي وإلكتروني", nameEn: "Cash & Electronic Payments" },
      { icon: Users, nameAr: "إدارة الكاشيرين والجلسات", nameEn: "Cashier & Session Management" },
      { icon: BarChart3, nameAr: "تقارير يومية فورية", nameEn: "Instant Daily Reports" },
      { icon: Tag, nameAr: "كوبونات وتخفيضات", nameEn: "Coupons & Discounts" },
      { icon: QrCode, nameAr: "باركود وQR للمنتجات", nameEn: "Product Barcode & QR" },
    ],
    uniqueFeatures: [
      { ar: "يعمل بدون إنترنت (Offline Mode) ويتزامن عند الاتصال", en: "Works offline & syncs automatically when connected" },
      { ar: "إغلاق يومي للكاشير مع تقرير الفروق النقدية", en: "Daily cashier closing with cash discrepancy report" },
      { ar: "إدارة عدة نقاط بيع في نفس الوقت من لوحة مركزية", en: "Multi-POS management from a single central dashboard" },
      { ar: "دعم الفواتير الضريبية والزكاة وفق متطلبات هيئة الزكاة", en: "VAT-compliant invoices per ZATCA requirements" },
      { ar: "تكامل مع أجهزة الطباعة والسكانر والشاشة المزدوجة", en: "Printer, scanner & dual-screen integration" },
    ],
    techSpecs: [
      { ar: "يعمل على iPad, Android Tablet, Desktop PC, Laptop", en: "Runs on iPad, Android Tablet, Desktop PC & Laptop" },
      { ar: "دعم فاتورة ZATCA (Phase 2) بالكامل", en: "Full ZATCA e-invoice support (Phase 2)" },
      { ar: "لوحة مركزية لعدة فروع مع مزامنة فورية", en: "Central dashboard for multi-branch with instant sync" },
    ],
    targetUsers: [
      { ar: "المتاجر والمحلات التجارية", en: "Retail stores & shops" },
      { ar: "الصيدليات ومحلات الإلكترونيات", en: "Pharmacies & electronics stores" },
      { ar: "البقالات والسوبرماركت", en: "Grocery & supermarket stores" },
    ],
  },
];

// ─── Complexity & Popularity Dots ─────────────────────────────────────────────
function Dots({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} className={`w-2 h-2 rounded-full transition-all ${i < value ? color : "bg-black/10 dark:bg-white/10"}`} />
      ))}
    </div>
  );
}

// ─── Sector Card ──────────────────────────────────────────────────────────────
function SectorCard({ sector, expanded, onToggle, view }: {
  sector: typeof SECTORS[0];
  expanded: boolean;
  onToggle: () => void;
  view: "grid" | "list";
}) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const Icon = sector.icon;

  if (view === "list") {
    return (
      <motion.div
        layout
        className={`rounded-2xl border bg-white dark:bg-gray-900 overflow-hidden transition-all duration-300 ${expanded ? sector.border : "border-black/[0.06] dark:border-white/[0.06]"}`}>
        {/* List header */}
        <button onClick={onToggle} className="w-full flex items-center gap-4 px-5 py-4 text-right hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${sector.color} flex items-center justify-center shrink-0 shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0 text-right">
            <p className="font-bold text-black dark:text-white text-sm">{ar ? sector.nameAr : sector.nameEn}</p>
            <p className="text-xs text-black/40 dark:text-white/40 truncate">{ar ? sector.descAr : sector.descEn}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sector.badge}`}>{sector.category}</span>
            <span className="text-xs text-black/30 dark:text-white/30">{sector.modules.length} {ar ? "وحدة" : "modules"}</span>
            {expanded ? <ChevronUp className="w-4 h-4 text-black/30 dark:text-white/30" /> : <ChevronDown className="w-4 h-4 text-black/30 dark:text-white/30" />}
          </div>
        </button>
        <AnimatePresence>
          {expanded && <ExpandedContent sector={sector} ar={ar} />}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      className={`rounded-2xl border bg-white dark:bg-gray-900 overflow-hidden transition-all duration-300 ${expanded ? `${sector.border} shadow-lg` : "border-black/[0.06] dark:border-white/[0.06] hover:shadow-md"}`}>
      {/* Gradient top strip */}
      <div className={`h-1.5 bg-gradient-to-r ${sector.color}`} />

      {/* Card body */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${sector.color} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${sector.badge}`}>{sector.category}</span>
        </div>

        <h3 className="font-black text-black dark:text-white text-base mb-1">{ar ? sector.nameAr : sector.nameEn}</h3>
        <p className="text-xs text-black/50 dark:text-white/50 leading-relaxed mb-4 line-clamp-2">{ar ? sector.descAr : sector.descEn}</p>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-[10px] text-black/40 dark:text-white/40 font-medium mb-1">{ar ? "التعقيد" : "Complexity"}</p>
            <Dots value={sector.complexity} color={`bg-gradient-to-r ${sector.color} bg-clip-text`} />
            <div className="flex gap-1 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i < sector.complexity ? `bg-gradient-to-r ${sector.color}` : "bg-black/10 dark:bg-white/10"}`} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-black/40 dark:text-white/40 font-medium mb-1">{ar ? "الطلب" : "Demand"}</p>
            <div className="flex gap-1 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i < sector.popularity ? `bg-gradient-to-r ${sector.color}` : "bg-black/10 dark:bg-white/10"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Module count */}
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-3.5 h-3.5 text-black/30 dark:text-white/30" />
          <span className="text-xs text-black/40 dark:text-white/40">{sector.modules.length} {ar ? "وحدة متخصصة" : "specialized modules"}</span>
        </div>

        {/* Toggle button */}
        <button onClick={onToggle}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${expanded ? `bg-gradient-to-r ${sector.color} text-white shadow-md` : "bg-black/[0.03] dark:bg-white/[0.03] text-black/60 dark:text-white/60 hover:bg-black/[0.06] dark:hover:bg-white/[0.06]"}`}
          data-testid={`btn-sector-expand-${sector.id}`}>
          {expanded ? (ar ? "إخفاء التفاصيل" : "Hide Details") : (ar ? "عرض التفاصيل الكاملة" : "View Full Details")}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && <ExpandedContent sector={sector} ar={ar} />}
      </AnimatePresence>
    </motion.div>
  );
}

function ExpandedContent({ sector, ar }: { sector: typeof SECTORS[0]; ar: boolean }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="overflow-hidden">
      <div className={`mx-4 mb-4 rounded-2xl ${sector.light} border ${sector.border} overflow-hidden`}>
        <div className="p-4 space-y-5">

          {/* Modules */}
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider ${sector.textColor} mb-3 flex items-center gap-2`}>
              <Layers className="w-3.5 h-3.5" />
              {ar ? "الوحدات والمكونات" : "System Modules"}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {sector.modules.map((m, i) => {
                const MIcon = m.icon;
                return (
                  <div key={i} className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-xl px-2.5 py-2 border border-black/[0.05] dark:border-white/[0.05]">
                    <MIcon className={`w-3.5 h-3.5 shrink-0 ${sector.textColor}`} />
                    <span className="text-xs text-black/70 dark:text-white/70 font-medium">{ar ? m.nameAr : m.nameEn}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unique Features */}
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider ${sector.textColor} mb-3 flex items-center gap-2`}>
              <Sparkles className="w-3.5 h-3.5" />
              {ar ? "الميزات الحصرية لهذا القطاع" : "Sector-Exclusive Features"}
            </h4>
            <div className="space-y-2">
              {sector.uniqueFeatures.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-white dark:bg-gray-900 rounded-xl px-3 py-2.5 border border-black/[0.05] dark:border-white/[0.05]">
                  <div className={`w-5 h-5 rounded-lg bg-gradient-to-br ${sector.color} flex items-center justify-center shrink-0 mt-0.5 shadow-sm`}>
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-xs text-black/70 dark:text-white/70 font-medium leading-relaxed">{ar ? f.ar : f.en}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Specs */}
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider ${sector.textColor} mb-3 flex items-center gap-2`}>
              <Settings className="w-3.5 h-3.5" />
              {ar ? "المواصفات التقنية" : "Technical Specifications"}
            </h4>
            <div className="space-y-1.5">
              {sector.techSpecs.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-black/60 dark:text-white/60">
                  <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${sector.color} shrink-0`} />
                  {ar ? s.ar : s.en}
                </div>
              ))}
            </div>
          </div>

          {/* Target Users */}
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider ${sector.textColor} mb-3 flex items-center gap-2`}>
              <Target className="w-3.5 h-3.5" />
              {ar ? "المستخدمون المستهدفون" : "Target Users"}
            </h4>
            <div className="flex flex-wrap gap-2">
              {sector.targetUsers.map((u, i) => (
                <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-medium ${sector.badge}`}>{ar ? u.ar : u.en}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Comparison Matrix ─────────────────────────────────────────────────────────
const COMPARISON_FEATURES = [
  { key: "pos", ar: "نقطة بيع (POS)", en: "Point of Sale (POS)" },
  { key: "booking", ar: "حجوزات ومواعيد", en: "Bookings & Appointments" },
  { key: "inventory", ar: "إدارة المخزون", en: "Inventory Management" },
  { key: "loyalty", ar: "برنامج ولاء", en: "Loyalty Program" },
  { key: "app", ar: "تطبيق موبايل", en: "Mobile App" },
  { key: "delivery", ar: "إدارة التوصيل", en: "Delivery Management" },
  { key: "qr_menu", ar: "قائمة QR", en: "QR Menu" },
  { key: "reports", ar: "تقارير متقدمة", en: "Advanced Reports" },
  { key: "multi_branch", ar: "تعدد الفروع", en: "Multi-branch" },
  { key: "parent_portal", ar: "بوابة أولياء الأمور", en: "Parent Portal" },
  { key: "emr", ar: "ملف طبي إلكتروني", en: "Electronic Medical Record" },
  { key: "contracts", ar: "إدارة العقود", en: "Contract Management" },
];

const SECTOR_FEATURES: Record<string, Record<string, boolean | "partial">> = {
  restaurant: { pos: true, booking: "partial", inventory: true, loyalty: true, app: true, delivery: true, qr_menu: true, reports: true, multi_branch: true, parent_portal: false, emr: false, contracts: false },
  cafe: { pos: true, booking: false, inventory: "partial", loyalty: true, app: true, delivery: "partial", qr_menu: true, reports: true, multi_branch: true, parent_portal: false, emr: false, contracts: false },
  salon: { pos: true, booking: true, inventory: "partial", loyalty: true, app: true, delivery: false, qr_menu: false, reports: true, multi_branch: true, parent_portal: false, emr: false, contracts: false },
  clinic: { pos: true, booking: true, inventory: "partial", loyalty: false, app: true, delivery: false, qr_menu: false, reports: true, multi_branch: true, parent_portal: false, emr: true, contracts: "partial" },
  quran: { pos: false, booking: true, inventory: false, loyalty: false, app: true, delivery: false, qr_menu: false, reports: true, multi_branch: true, parent_portal: true, emr: false, contracts: false },
  realestate: { pos: false, booking: false, inventory: false, loyalty: false, app: "partial", delivery: false, qr_menu: false, reports: true, multi_branch: true, parent_portal: false, emr: false, contracts: true },
  fitness: { pos: true, booking: true, inventory: "partial", loyalty: true, app: true, delivery: false, qr_menu: false, reports: true, multi_branch: true, parent_portal: false, emr: false, contracts: false },
  school: { pos: "partial", booking: true, inventory: false, loyalty: false, app: true, delivery: false, qr_menu: false, reports: true, multi_branch: true, parent_portal: true, emr: false, contracts: false },
  ecommerce: { pos: false, booking: false, inventory: true, loyalty: true, app: true, delivery: true, qr_menu: false, reports: true, multi_branch: "partial", parent_portal: false, emr: false, contracts: false },
  pos: { pos: true, booking: false, inventory: true, loyalty: "partial", app: false, delivery: false, qr_menu: "partial", reports: true, multi_branch: true, parent_portal: false, emr: false, contracts: false },
};

function FeatureCell({ value }: { value: boolean | "partial" | undefined }) {
  if (value === true) return <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />;
  if (value === "partial") return <div className="w-4 h-4 rounded-full bg-amber-400/30 border-2 border-amber-400 mx-auto" />;
  return <X className="w-3.5 h-3.5 text-black/15 dark:text-white/15 mx-auto" />;
}

function ComparisonMatrix({ ar }: { ar: boolean }) {
  const [search, setSearch] = useState("");
  const filtered = SECTORS.filter(s =>
    !search || (ar ? s.nameAr : s.nameEn).includes(search) || s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.07] dark:border-white/[0.07] overflow-hidden shadow-sm">
      <div className="p-4 border-b border-black/[0.05] dark:border-white/[0.05]">
        <div className="relative max-w-xs">
          <Search className="w-4 h-4 text-black/30 dark:text-white/30 absolute right-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={ar ? "فلترة القطاعات..." : "Filter sectors..."}
            className="w-full h-9 pr-9 pl-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-sm outline-none focus:border-black/25 dark:focus:border-white/25" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-black/[0.05] dark:border-white/[0.05]">
              <th className="text-right px-4 py-3 font-bold text-black/50 dark:text-white/50 sticky right-0 bg-white dark:bg-gray-900 min-w-[140px]">
                {ar ? "الميزة" : "Feature"}
              </th>
              {filtered.map(s => {
                const Icon = s.icon;
                return (
                  <th key={s.id} className="px-3 py-3 text-center min-w-[90px]">
                    <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-1 shadow-sm`}>
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="font-bold text-black/60 dark:text-white/60 leading-tight" style={{ fontSize: "10px" }}>{ar ? s.nameAr : s.nameEn}</p>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_FEATURES.map((feat, i) => (
              <tr key={feat.key} className={`border-b border-black/[0.03] dark:border-white/[0.03] ${i % 2 === 0 ? "" : "bg-black/[0.01] dark:bg-white/[0.01]"}`}>
                <td className="px-4 py-2.5 font-semibold text-black/60 dark:text-white/60 sticky right-0 bg-inherit">
                  {ar ? feat.ar : feat.en}
                </td>
                {filtered.map(s => (
                  <td key={s.id} className="px-3 py-2.5 text-center">
                    <FeatureCell value={SECTOR_FEATURES[s.id]?.[feat.key]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 border-t border-black/[0.05] dark:border-white/[0.05] flex items-center gap-4 text-[10px] text-black/40 dark:text-white/40">
        <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {ar ? "مدمج" : "Included"}</span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-400/30 border border-amber-400" /> {ar ? "جزئي" : "Partial"}</span>
        <span className="flex items-center gap-1.5"><X className="w-3 h-3" /> {ar ? "غير مشمول" : "Not included"}</span>
      </div>
    </div>
  );
}

// ─── Budget Planner Component ───────────────────────────────────────────────────
function BudgetPlanner({ ar }: { ar: boolean }) {
  const currency = useCurrency();
  const [selectedBudget, setSelectedBudget] = useState<"starter" | "growth" | "enterprise">("growth");

  const tiers = useMemo(() => [
    {
      key: "starter" as const,
      label: ar ? "مبتدئ" : "Starter",
      icon: Zap,
      color: "from-emerald-500 to-teal-500",
      bgLight: "bg-emerald-50 dark:bg-emerald-950/20",
      border: "border-emerald-200 dark:border-emerald-800/40",
      textColor: "text-emerald-600 dark:text-emerald-400",
      btnActive: "bg-emerald-600 text-white",
      sar: 15000,
      egp: 105000,
      plan: ar ? "لايت" : "Lite",
      desc: ar ? "مثالي لبدء نشاطك الرقمي" : "Perfect for launching your digital presence",
      badge: ar ? "أفضل للبداية" : "Best to Start",
      what: ar ? [
        "موقع احترافي بتصميم مخصص",
        "لوحة تحكم أساسية للنشاط",
        "نظام حجوزات أو طلبات",
        "تقارير أساسية يومية",
        "دعم تقني لمدة 6 أشهر",
      ] : [
        "Professional custom-designed website",
        "Basic business control panel",
        "Booking or ordering system",
        "Basic daily reports",
        "6-month technical support",
      ],
      notIncluded: ar ? ["تطبيق موبايل", "ذكاء اصطناعي", "تعدد الفروع"] : ["Mobile app", "AI features", "Multi-branch"],
    },
    {
      key: "growth" as const,
      label: ar ? "نمو" : "Growth",
      icon: Star,
      color: "from-blue-500 to-violet-600",
      bgLight: "bg-blue-50 dark:bg-blue-950/20",
      border: "border-blue-200 dark:border-blue-800/40",
      textColor: "text-blue-600 dark:text-blue-400",
      btnActive: "bg-blue-600 text-white",
      sar: 50000,
      egp: 350000,
      plan: ar ? "برو" : "Pro",
      desc: ar ? "للنشاطات التي تريد التوسع والنمو" : "For businesses ready to scale",
      badge: ar ? "الأكثر طلباً" : "Most Popular",
      what: ar ? [
        "كل ميزات الباقة المبتدئة ✦",
        "تطبيق PWA كامل للموبايل",
        "بوابة دفع إلكترونية مجانية",
        "نظام ولاء ونقاط للعملاء",
        "تقارير تحليلية متقدمة",
        "1,000 بريد إلكتروني شهرياً",
        "5 تعديلات ما بعد التسليم",
      ] : [
        "All Starter features ✦",
        "Full PWA mobile app",
        "Free payment gateway",
        "Customer loyalty & points",
        "Advanced analytics reports",
        "1,000 monthly emails",
        "5 post-delivery edits",
      ],
      notIncluded: ar ? ["تعدد الفروع", "ERP مؤسسي"] : ["Multi-branch", "Enterprise ERP"],
    },
    {
      key: "enterprise" as const,
      label: ar ? "مؤسسي" : "Enterprise",
      icon: Building2,
      color: "from-amber-500 to-orange-500",
      bgLight: "bg-amber-50 dark:bg-amber-950/20",
      border: "border-amber-200 dark:border-amber-800/40",
      textColor: "text-amber-600 dark:text-amber-400",
      btnActive: "bg-amber-500 text-white",
      sar: 999999,
      egp: 6999993,
      plan: ar ? "إنفينيت" : "Infinity",
      desc: ar ? "للشركات والسلاسل الكبيرة بلا حدود" : "For large businesses with no limits",
      badge: ar ? "بلا حدود" : "No Limits",
      what: ar ? [
        "كل ميزات برو ✦✦",
        "إدارة فروع متعددة غير محدودة",
        "نظام ERP وإدارة مؤسسية",
        "5 بريد إلكتروني رسمي باسمك",
        "10,000 رسالة بريدية شهرياً",
        "مدير حساب مخصص 24/7",
        "20 تطوير ما بعد التسليم",
      ] : [
        "All Pro features ✦✦",
        "Unlimited multi-branch management",
        "ERP & enterprise system",
        "5 branded email addresses",
        "10,000 monthly emails",
        "Dedicated account manager 24/7",
        "20 post-delivery developments",
      ],
      notIncluded: [],
    },
  ], [ar]);

  const selected = tiers.find(t => t.key === selectedBudget)!;

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="mt-10 rounded-3xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 overflow-hidden shadow-sm">

      {/* Header */}
      <div className="px-6 py-5 border-b border-black/[0.05] dark:border-white/[0.05] bg-gradient-to-l from-violet-50/60 to-transparent dark:from-violet-950/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/20">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black text-black dark:text-white">
              {ar ? "اشتغل على قد ميزانيتك" : "Work Within Your Budget"}
            </h3>
            <p className="text-xs text-black/40 dark:text-white/40">
              {ar
                ? `اختر حجم استثمارك وشوف إيش تحصل عليه${currency.isEgypt ? " — بالجنيه المصري" : ""}`
                : "Pick your investment range and see exactly what you get"}
            </p>
          </div>
          {currency.isEgypt && (
            <span className="mr-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-black border border-emerald-200 dark:border-emerald-800/40">
              🇪🇬 الأسعار بالجنيه
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Budget selector tabs */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {tiers.map(tier => {
            const Icon = tier.icon;
            const isActive = selectedBudget === tier.key;
            const amount = currency.isEgypt ? tier.egp : tier.sar;
            const isEnterprise = tier.key === "enterprise";
            return (
              <button key={tier.key} onClick={() => setSelectedBudget(tier.key)}
                data-testid={`budget-tier-${tier.key}`}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 text-center ${
                  isActive
                    ? `${tier.bgLight} ${tier.border} shadow-md ring-1 ring-inset ${tier.border}`
                    : "border-black/[0.06] dark:border-white/[0.06] hover:border-black/[0.12] dark:hover:border-white/[0.12]"
                }`}>
                {tier.badge && isActive && (
                  <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap bg-gradient-to-r ${tier.color} text-white shadow-sm`}>
                    {tier.badge}
                  </span>
                )}
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className={`text-sm font-black ${isActive ? tier.textColor : "text-black/60 dark:text-white/60"}`}>{tier.label}</p>
                  <p className={`text-[11px] font-bold mt-0.5 ${isActive ? tier.textColor + "/70" : "text-black/35 dark:text-white/35"}`}>
                    {isEnterprise
                      ? (ar ? "50,000+ ريال" : "SAR 50,000+")
                      : `${ar ? "حتى" : "Up to"} ${currency.isEgypt
                          ? `${(amount).toLocaleString("ar-EG")} ${ar ? "جنيه" : "EGP"}`
                          : `${amount.toLocaleString("ar-SA")} ${ar ? "ريال" : "SAR"}`}`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          <motion.div key={selectedBudget} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
            className={`rounded-2xl border ${selected.bgLight} ${selected.border} p-5`}>
            <div className="flex flex-col md:flex-row gap-5">
              {/* Left: what you get */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black bg-gradient-to-r ${selected.color} text-white`}>{selected.plan}</span>
                  <span className={`text-sm font-bold ${selected.textColor}`}>{selected.desc}</span>
                </div>
                <p className={`text-[11px] font-black uppercase tracking-wider mb-2 ${selected.textColor}`}>
                  {ar ? "✦ إيش تحصل عليه" : "✦ What you get"}
                </p>
                <ul className="space-y-1.5">
                  {selected.what.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${selected.textColor}`} />
                      <span className="text-xs text-black/70 dark:text-white/70 leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right: not included + CTA */}
              <div className="md:w-48 flex flex-col gap-3">
                {selected.notIncluded.length > 0 && (
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wider text-black/30 dark:text-white/30 mb-2">
                      {ar ? "غير مشمول" : "Not included"}
                    </p>
                    <ul className="space-y-1.5">
                      {selected.notIncluded.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <div className="w-3.5 h-3.5 shrink-0 mt-0.5 rounded-full border border-black/20 dark:border-white/20 flex items-center justify-center">
                            <div className="w-1.5 h-0.5 bg-black/30 dark:bg-white/30 rounded-full" />
                          </div>
                          <span className="text-[11px] text-black/35 dark:text-white/35 line-through leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Link href="/prices" className={`mt-auto flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-black bg-gradient-to-r ${selected.color} text-white shadow-md transition-opacity hover:opacity-90`}>
                  <Rocket className="w-3.5 h-3.5" />
                  {ar ? "شوف الأسعار" : "View Pricing"}
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom hint */}
        <p className="text-center text-[11px] text-black/30 dark:text-white/30 mt-4 font-medium">
          {ar
            ? currency.isEgypt
              ? "💡 الأسعار المعروضة بالجنيه المصري — تواصل معنا للحصول على عرض خاص لمصر"
              : "💡 الأسعار التقريبية — تواصل معنا للحصول على عرض سعر مخصص"
            : "💡 Approximate pricing — contact us for a custom quote"}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SectorGuide() {
  const { lang, dir } = useI18n();
  const ar = lang === "ar";
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [tab, setTab] = useState<"sectors" | "compare">("sectors");

  const categories = useMemo(() => {
    const cats = [...new Set(SECTORS.map(s => s.category))];
    return [{ key: "all", ar: "الكل", en: "All" }, ...cats.map(c => ({ key: c, ar: c, en: c }))];
  }, []);

  const filtered = useMemo(() => SECTORS.filter(s => {
    const matchSearch = !search || (ar ? s.nameAr : s.nameEn).includes(search) || (ar ? s.descAr : s.descEn).includes(search);
    const matchCat = category === "all" || s.category === category;
    return matchSearch && matchCat;
  }), [search, category, ar]);

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  return (
    <div className="relative min-h-screen space-y-6 p-4 md:p-6" dir={dir}>
      <PageGraphics variant="dashboard" />

      {/* ── Header ── */}
      <div className="relative z-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-black dark:bg-white flex items-center justify-center shadow-lg">
                <Layers className="w-6 h-6 text-white dark:text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-black dark:text-white">{ar ? "دليل القطاعات التقني" : "Sector Technical Guide"}</h1>
                <p className="text-sm text-black/40 dark:text-white/40">{ar ? `${SECTORS.length} قطاع مدعوم — مميزات تقنية حصرية لكل قطاع` : `${SECTORS.length} supported sectors — exclusive technical features per sector`}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setView("grid")} className={`p-2 rounded-xl border transition-colors ${view === "grid" ? "bg-black dark:bg-white text-white dark:text-black border-transparent" : "border-black/10 dark:border-white/10 text-black/40 dark:text-white/40"}`}>
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button onClick={() => setView("list")} className={`p-2 rounded-xl border transition-colors ${view === "list" ? "bg-black dark:bg-white text-white dark:text-black border-transparent" : "border-black/10 dark:border-white/10 text-black/40 dark:text-white/40"}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: ar ? "قطاعات مدعومة" : "Supported Sectors", value: SECTORS.length, icon: Layers, color: "text-violet-600" },
              { label: ar ? "وحدات متخصصة" : "Specialized Modules", value: SECTORS.reduce((a, s) => a + s.modules.length, 0), icon: Package, color: "text-blue-600" },
              { label: ar ? "ميزات حصرية" : "Exclusive Features", value: SECTORS.reduce((a, s) => a + s.uniqueFeatures.length, 0), icon: Sparkles, color: "text-amber-600" },
              { label: ar ? "قطاعات عالية الطلب" : "High-demand Sectors", value: SECTORS.filter(s => s.popularity >= 4).length, icon: TrendingUp, color: "text-emerald-600" },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] p-4 flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${s.color} shrink-0`} />
                  <div>
                    <p className="text-xl font-black text-black dark:text-white">{s.value}</p>
                    <p className="text-[10px] text-black/40 dark:text-white/40 font-medium">{s.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] rounded-2xl p-1 w-fit mb-5">
            {[
              { key: "sectors", label: ar ? "عروض القطاعات" : "Sector Presentations", icon: Layers },
              { key: "compare", label: ar ? "مقارنة الميزات" : "Feature Comparison", icon: Grid3x3 },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === t.key ? "bg-black dark:bg-white text-white dark:text-black shadow-sm" : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"}`}
                data-testid={`tab-${t.key}`}>
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Filter row (sectors tab only) */}
          {tab === "sectors" && (
            <div className="flex flex-wrap gap-2 items-center mb-4">
              <div className="relative">
                <Search className="w-4 h-4 text-black/30 dark:text-white/30 absolute right-3 top-1/2 -translate-y-1/2" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={ar ? "ابحث عن قطاع..." : "Search sector..."}
                  className="h-9 pr-9 pl-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-900 text-sm outline-none focus:border-black/25 dark:focus:border-white/25 w-52 transition" />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {categories.map(c => (
                  <button key={c.key} onClick={() => setCategory(c.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${category === c.key ? "bg-black dark:bg-white text-white dark:text-black border-transparent" : "border-black/10 dark:border-white/10 text-black/50 dark:text-white/50 hover:border-black/20 dark:hover:border-white/20"}`}>
                    {ar ? c.ar : c.en}
                  </button>
                ))}
              </div>
              <span className="text-xs text-black/30 dark:text-white/30 mr-auto">{filtered.length} {ar ? "نتيجة" : "results"}</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Content ── */}
      {tab === "sectors" ? (
        <motion.div layout className={view === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"}>
          {filtered.map((sector, i) => (
            <motion.div key={sector.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <SectorCard sector={sector} expanded={expanded === sector.id} onToggle={() => toggle(sector.id)} view={view} />
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-black/30 dark:text-white/30">
              <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{ar ? "لا توجد نتائج" : "No results found"}</p>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <ComparisonMatrix ar={ar} />
        </motion.div>
      )}

      {/* Budget Planner */}
      <BudgetPlanner ar={ar} />

      {/* Legend footer */}
      {tab === "sectors" && (
        <p className="text-center text-xs text-black/25 dark:text-white/25 pt-4">
          {ar ? "هذا الدليل تقني داخلي للموظفين — يُحدَّث مع كل إصدار جديد من النظام" : "Internal technical guide for employees — updated with every system release"}
        </p>
      )}
    </div>
  );
}
