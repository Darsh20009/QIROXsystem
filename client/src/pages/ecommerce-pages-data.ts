import {
  Store, ShoppingBag, ShoppingCart, CreditCard, Package,
  User, Lock, ShieldCheck, LayoutDashboard, Settings,
  Users, Truck, Tag, Building2, Receipt, Monitor,
  BarChart3, FileText, Wallet, Heart, Star,
  Bell, RefreshCw, Globe, Zap, MapPin,
  ClipboardList, Archive, BadgeCheck, Gift,
} from "lucide-react";

export interface EcommercePageEntry {
  path: string;
  titleAr: string;
  descAr: string;
  icon: any;
  badge: string;
  badgeColor: string;
  theme: "violet" | "dark" | "green" | "slate" | "sky" | "red" | "orange";
}

export interface EcommerceSection {
  id: string;
  titleAr: string;
  emoji: string;
  color: string;
  pages: EcommercePageEntry[];
}

export const ECOMMERCE_SECTIONS: EcommerceSection[] = [
  // ══════════════════════════════════════════════
  // 1. صفحات العملاء العامة
  // ══════════════════════════════════════════════
  {
    id: "customer-public",
    titleAr: "بوابة العملاء — صفحات عامة (بدون تسجيل دخول)",
    emoji: "🛍️",
    color: "#7c3aed",
    pages: [
      {
        path: "/",
        titleAr: "الواجهة الرئيسية",
        descAr: "أول صفحة يراها الزائر — تعرض البانرات الترويجية، أبرز المنتجات، الفئات، وعروض اليوم. مصممة لتحويل الزوار إلى عملاء من أول ثانية.",
        icon: Store,
        badge: "عام",
        badgeColor: "bg-violet-100 text-violet-700",
        theme: "violet",
      },
      {
        path: "/products",
        titleAr: "كتالوج المنتجات",
        descAr: "صفحة تسوق شاملة مع فلترة متقدمة بالفئة والسعر والتقييم. يمكن البحث عن أي منتج وإضافته للسلة أو قائمة الرغبات مباشرة.",
        icon: ShoppingBag,
        badge: "عام",
        badgeColor: "bg-violet-100 text-violet-700",
        theme: "violet",
      },
      {
        path: "/cart",
        titleAr: "سلة التسوق",
        descAr: "عرض المنتجات المختارة مع إمكانية تعديل الكميات، تطبيق كوبون الخصم، وحساب رسوم الشحن. يوضح الإجمالي قبل الانتقال للدفع.",
        icon: ShoppingCart,
        badge: "عام",
        badgeColor: "bg-violet-100 text-violet-700",
        theme: "violet",
      },
      {
        path: "/login",
        titleAr: "تسجيل الدخول",
        descAr: "بوابة دخول العملاء برقم الجوال أو البريد الإلكتروني مع دعم نسيان كلمة المرور وإعادة الإرسال.",
        icon: Lock,
        badge: "دخول",
        badgeColor: "bg-gray-100 text-gray-600",
        theme: "violet",
      },
      {
        path: "/register",
        titleAr: "إنشاء حساب جديد",
        descAr: "نموذج تسجيل بسيط بالاسم ورقم الجوال والبريد والكلمة السرية مع التحقق عبر رمز OTP.",
        icon: User,
        badge: "دخول",
        badgeColor: "bg-gray-100 text-gray-600",
        theme: "violet",
      },
      {
        path: "/forgot-password",
        titleAr: "استعادة كلمة المرور",
        descAr: "إعادة تعيين كلمة المرور عبر رمز يُرسل للجوال أو البريد الإلكتروني.",
        icon: RefreshCw,
        badge: "عام",
        badgeColor: "bg-violet-100 text-violet-700",
        theme: "violet",
      },
      {
        path: "/terms",
        titleAr: "الشروط والأحكام",
        descAr: "صفحة الشروط والأحكام وسياسة الخصوصية وسياسة الاسترداد.",
        icon: FileText,
        badge: "عام",
        badgeColor: "bg-violet-100 text-violet-700",
        theme: "violet",
      },
    ],
  },

  // ══════════════════════════════════════════════
  // 2. بوابة العملاء المسجلين
  // ══════════════════════════════════════════════
  {
    id: "customer-auth",
    titleAr: "بوابة العملاء المسجلين",
    emoji: "👤",
    color: "#6d28d9",
    pages: [
      {
        path: "/checkout",
        titleAr: "إتمام الطلب والدفع",
        descAr: "خطوات الدفع الذكية: اختيار العنوان، طريقة الشحن، ثم بوابة الدفع الموحدة (بطاقة / STC Pay / Apple Pay / تمارة / تابي / محفظة / تحويل) مع كشف تلقائي لنوع البطاقة.",
        icon: CreditCard,
        badge: "عميل",
        badgeColor: "bg-purple-100 text-purple-700",
        theme: "dark",
      },
      {
        path: "/orders",
        titleAr: "تتبع طلباتي",
        descAr: "عرض جميع الطلبات مع الحالة الحية (قيد المراجعة → مؤكد → جاهز → في الطريق → مسلّم). إمكانية إعادة الطلب أو رفع شكوى.",
        icon: Package,
        badge: "عميل",
        badgeColor: "bg-purple-100 text-purple-700",
        theme: "dark",
      },
      {
        path: "/profile",
        titleAr: "الملف الشخصي",
        descAr: "إدارة بيانات الحساب وعناوين التوصيل وإعدادات الإشعارات، وعرض رصيد المحفظة ومستوى برنامج الولاء (برونز / فضي / ذهبي).",
        icon: User,
        badge: "عميل",
        badgeColor: "bg-purple-100 text-purple-700",
        theme: "violet",
      },
      {
        path: "/profile/invoices",
        titleAr: "فواتيري",
        descAr: "سجل الفواتير الكاملة مع إمكانية الطباعة أو التحميل بصيغة PDF لكل فاتورة.",
        icon: Receipt,
        badge: "عميل",
        badgeColor: "bg-purple-100 text-purple-700",
        theme: "slate",
      },
    ],
  },

  // ══════════════════════════════════════════════
  // 3. لوحة الإدارة
  // ══════════════════════════════════════════════
  {
    id: "admin-dashboard",
    titleAr: "لوحة إدارة المتجر",
    emoji: "⚙️",
    color: "#4f46e5",
    pages: [
      {
        path: "/admin",
        titleAr: "لوحة التحكم الرئيسية",
        descAr: "نظرة شاملة على أداء المتجر: إجمالي المبيعات، الطلبات الجديدة، أعلى المنتجات مبيعاً، ومؤشرات الأداء اليومية والشهرية بالرسوم البيانية.",
        icon: LayoutDashboard,
        badge: "مدير",
        badgeColor: "bg-indigo-100 text-indigo-700",
        theme: "dark",
      },
      {
        path: "/admin/branches",
        titleAr: "إدارة الفروع",
        descAr: "إضافة وتعديل فروع المتجر مع تحديد مناطق التوصيل وأوقات العمل وإعدادات كل فرع بشكل مستقل.",
        icon: Building2,
        badge: "مدير",
        badgeColor: "bg-indigo-100 text-indigo-700",
        theme: "dark",
      },
      {
        path: "/admin/staff",
        titleAr: "إدارة الموظفين",
        descAr: "إضافة الموظفين وتحديد أدوارهم وصلاحياتهم (مدير / كاشير / مستودع)، مع تتبع الحضور والغياب.",
        icon: Users,
        badge: "مدير",
        badgeColor: "bg-indigo-100 text-indigo-700",
        theme: "dark",
      },
      {
        path: "/admin/inventory",
        titleAr: "إدارة المخزون",
        descAr: "تتبع مخزون المنتجات مع تنبيهات النفاد، سجل الحركات، وإمكانية التحديث الجماعي للمخزون.",
        icon: Archive,
        badge: "مدير",
        badgeColor: "bg-indigo-100 text-indigo-700",
        theme: "dark",
      },
      {
        path: "/admin/banners",
        titleAr: "البانرات الإعلانية",
        descAr: "إدارة بانرات الصفحة الرئيسية مع إمكانية تحديد الرابط، ترتيب العرض، وجدولة تواريخ الظهور.",
        icon: Tag,
        badge: "مدير",
        badgeColor: "bg-indigo-100 text-indigo-700",
        theme: "dark",
      },
      {
        path: "/admin/roles",
        titleAr: "الأدوار والصلاحيات (RBAC)",
        descAr: "نظام متقدم للتحكم بصلاحيات الموظفين — حدد بدقة من يرى ماذا ومن يستطيع التعديل.",
        icon: ShieldCheck,
        badge: "مدير",
        badgeColor: "bg-indigo-100 text-indigo-700",
        theme: "red",
      },
      {
        path: "/admin/audit-logs",
        titleAr: "سجل التدقيق",
        descAr: "سجل كامل لجميع عمليات النظام — من سجّل دخول، من عدّل منتج، من أجرى دفعة — مع التوقيت والجهاز.",
        icon: ClipboardList,
        badge: "مدير",
        badgeColor: "bg-indigo-100 text-indigo-700",
        theme: "slate",
      },
    ],
  },

  // ══════════════════════════════════════════════
  // 4. نظام الكاشير POS
  // ══════════════════════════════════════════════
  {
    id: "pos-system",
    titleAr: "نظام الكاشير والصندوق (POS)",
    emoji: "🖥️",
    color: "#0891b2",
    pages: [
      {
        path: "/pos",
        titleAr: "واجهة الكاشير POS",
        descAr: "واجهة احترافية للكاشير: بحث واختيار المنتجات، تعديل الكميات، إضافة خصومات، معالجة الدفع (نقد/بطاقة/محفظة) وطباعة الفاتورة.",
        icon: Monitor,
        badge: "موظف",
        badgeColor: "bg-cyan-100 text-cyan-700",
        theme: "dark",
      },
      {
        path: "/cash-drawer",
        titleAr: "إدارة الصندوق النقدي",
        descAr: "فتح وإغلاق الصندوق مع إدخال المبلغ الابتدائي، تسجيل المقبوضات والمصروفات النقدية يدوياً.",
        icon: Wallet,
        badge: "موظف",
        badgeColor: "bg-cyan-100 text-cyan-700",
        theme: "dark",
      },
      {
        path: "/cash-report",
        titleAr: "تقرير الصندوق اليومي",
        descAr: "ملخص يومي للصندوق: إجمالي المبيعات، الفرق عن المتوقع، توزيع طرق الدفع، وتصدير التقرير.",
        icon: BarChart3,
        badge: "موظف",
        badgeColor: "bg-cyan-100 text-cyan-700",
        theme: "dark",
      },
    ],
  },
];

export const ECOMMERCE_PORTALS = [
  {
    role: "مدير المتجر",
    username: "567891011",
    password: "123456",
    access: "لوحة الإدارة الكاملة — المنتجات، الطلبات، الموظفين، التقارير، الإعدادات",
    color: "text-violet-700",
    bg: "bg-violet-50",
  },
  {
    role: "عميل تجريبي",
    username: "500000001",
    password: "123456",
    access: "سلة التسوق، الدفع، تتبع الطلبات، المحفظة، برنامج الولاء",
    color: "text-blue-700",
    bg: "bg-blue-50",
  },
  {
    role: "كاشير POS",
    username: "500000002",
    password: "123456",
    access: "واجهة الكاشير، الصندوق النقدي، تقرير المبيعات اليومي",
    color: "text-cyan-700",
    bg: "bg-cyan-50",
  },
];
