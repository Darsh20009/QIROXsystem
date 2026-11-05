import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Mail, User, Users, ShieldCheck, Package, MessageSquare, Star,
  FileText, CreditCard, Truck, Phone, Search, Wrench, Bell, Building2,
  CalendarCheck, Megaphone, KeyRound, ClipboardList, Banknote
} from "lucide-react";

interface EmailEvent {
  id: string;
  event: string;
  eventEn: string;
  recipient: string;
  recipientEn: string;
  recipientType: "client" | "employee" | "admin" | "owner";
  trigger: string;
  triggerEn: string;
  subject: string;
  icon: React.ElementType;
  category: string;
}

const EMAIL_EVENTS: EmailEvent[] = [
  // ── AUTH / ACCOUNT ──────────────────────────────────────────────
  {
    id: "welcome",
    category: "auth",
    icon: User,
    event: "ترحيب بعميل جديد",
    eventEn: "Welcome (self-register)",
    recipient: "العميل",
    recipientEn: "Client",
    recipientType: "client",
    trigger: "تسجيل حساب جديد ذاتياً",
    triggerEn: "Client self-registers",
    subject: "مرحباً بك في QIROX",
  },
  {
    id: "email_verify",
    category: "auth",
    icon: ShieldCheck,
    event: "رمز تفعيل الحساب (OTP)",
    eventEn: "Email Verification OTP",
    recipient: "المستخدم",
    recipientEn: "User",
    recipientType: "client",
    trigger: "التسجيل الجديد أو تغيير البريد",
    triggerEn: "New registration or email change",
    subject: "رمز تفعيل حسابك | QIROX",
  },
  {
    id: "otp_reset",
    category: "auth",
    icon: KeyRound,
    event: "رمز إعادة تعيين كلمة المرور",
    eventEn: "Password Reset OTP",
    recipient: "المستخدم",
    recipientEn: "User",
    recipientType: "client",
    trigger: "طلب نسيت كلمة المرور",
    triggerEn: "Forgot password request",
    subject: "رمز التحقق | QIROX",
  },
  {
    id: "login_otp",
    category: "auth",
    icon: ShieldCheck,
    event: "رمز توثيق الجهاز (2FA)",
    eventEn: "Device 2FA OTP",
    recipient: "المستخدم",
    recipientEn: "User",
    recipientType: "client",
    trigger: "تسجيل دخول من جهاز جديد",
    triggerEn: "Login from new device",
    subject: "رمز توثيق جهازك | QIROX",
  },
  {
    id: "welcome_creds",
    category: "auth",
    icon: KeyRound,
    event: "بيانات الدخول عند إنشاء حساب",
    eventEn: "Welcome with Credentials",
    recipient: "موظف / عميل جديد",
    recipientEn: "New Employee / Client",
    recipientType: "employee",
    trigger: "إنشاء حساب موظف أو عميل من الإدارة",
    triggerEn: "Admin creates employee or client account",
    subject: "بيانات حسابك في QIROX",
  },
  {
    id: "wallet_otp",
    category: "auth",
    icon: CreditCard,
    event: "رمز تأكيد دفع المحفظة",
    eventEn: "Wallet Payment OTP",
    recipient: "العميل",
    recipientEn: "Client",
    recipientType: "client",
    trigger: "عند إتمام دفع من محفظة Qirox Pay",
    triggerEn: "Wallet payment confirmation",
    subject: "رمز تأكيد الدفع | Qirox Pay",
  },

  // ── ORDERS / PROJECTS ────────────────────────────────────────────
  {
    id: "order_confirm",
    category: "orders",
    icon: Package,
    event: "تأكيد استلام الطلب",
    eventEn: "Order Confirmation",
    recipient: "العميل",
    recipientEn: "Client",
    recipientType: "client",
    trigger: "عند تقديم طلب جديد",
    triggerEn: "New order submitted",
    subject: "تأكيد طلبك | QIROX",
  },
  {
    id: "order_status",
    category: "orders",
    icon: Package,
    event: "تحديث حالة الطلب",
    eventEn: "Order Status Update",
    recipient: "العميل",
    recipientEn: "Client",
    recipientType: "client",
    trigger: "عند تغيير حالة الطلب من الإدارة",
    triggerEn: "Admin changes order status",
    subject: "تحديث طلبك | QIROX",
  },
  {
    id: "project_update",
    category: "orders",
    icon: Wrench,
    event: "تحديث تقدم المشروع",
    eventEn: "Project Progress Update",
    recipient: "العميل",
    recipientEn: "Client",
    recipientType: "client",
    trigger: "تغيير حالة أو نسبة إنجاز المشروع",
    triggerEn: "Project status or progress changed",
    subject: "تحديث مشروع | QIROX",
  },
  {
    id: "features_email",
    category: "orders",
    icon: ClipboardList,
    event: "ملف مميزات المشروع",
    eventEn: "Features List Email",
    recipient: "العميل",
    recipientEn: "Client",
    recipientType: "client",
    trigger: "عند إرسال قائمة مميزات المشروع للعميل",
    triggerEn: "Admin sends features list to client",
    subject: "ملف مميزات مشروعك | QIROX",
  },
  {
    id: "admin_new_order",
    category: "orders",
    icon: Package,
    event: "إشعار طلب جديد للمديرين",
    eventEn: "New Order — Admin Notification",
    recipient: "admin / manager / supervisor + info@qiroxstudio.online",
    recipientEn: "Admins & Managers",
    recipientType: "admin",
    trigger: "عند تقديم أي طلب جديد من عميل",
    triggerEn: "Any new order submitted",
    subject: "طلب جديد | QIROX",
  },

  // ── FINANCE ──────────────────────────────────────────────────────
  {
    id: "invoice",
    category: "finance",
    icon: FileText,
    event: "إرسال فاتورة",
    eventEn: "Invoice Email",
    recipient: "العميل",
    recipientEn: "Client",
    recipientType: "client",
    trigger: "عند إصدار فاتورة وإرسالها من الإدارة",
    triggerEn: "Admin issues & sends invoice",
    subject: "فاتورة رقم XXX | QIROX",
  },
  {
    id: "receipt",
    category: "finance",
    icon: CreditCard,
    event: "إرسال سند قبض",
    eventEn: "Receipt Email",
    recipient: "العميل",
    recipientEn: "Client",
    recipientType: "client",
    trigger: "عند تأكيد استلام الدفعة",
    triggerEn: "Payment receipt confirmed",
    subject: "سند قبض | QIROX",
  },
  {
    id: "quotation",
    category: "finance",
    icon: ClipboardList,
    event: "إرسال عرض السعر (مع PDF)",
    eventEn: "Quotation Email (with PDF)",
    recipient: "العميل",
    recipientEn: "Client",
    recipientType: "client",
    trigger: "عند إرسال عرض سعر من الإدارة",
    triggerEn: "Admin sends quotation",
    subject: "عرض سعر | QIROX",
  },
  {
    id: "wallet_topup",
    category: "finance",
    icon: Banknote,
    event: "نتيجة طلب شحن المحفظة",
    eventEn: "Wallet Topup Status",
    recipient: "العميل",
    recipientEn: "Client",
    recipientType: "client",
    trigger: "قبول أو رفض طلب شحن محفظة Qirox Pay",
    triggerEn: "Wallet topup approved or rejected",
    subject: "شحن المحفظة | Qirox Pay",
  },

  // ── TASKS ─────────────────────────────────────────────────────────
  {
    id: "task_assigned",
    category: "tasks",
    icon: ClipboardList,
    event: "تكليف بمهمة جديدة",
    eventEn: "Task Assigned",
    recipient: "الموظف المكلَّف",
    recipientEn: "Assigned Employee",
    recipientType: "employee",
    trigger: "عند إسناد مهمة لموظف في أي مشروع",
    triggerEn: "Task assigned to employee",
    subject: "مهمة جديدة | QIROX",
  },
  {
    id: "task_completed",
    category: "tasks",
    icon: ClipboardList,
    event: "إتمام مهمة",
    eventEn: "Task Completed",
    recipient: "مدير المشروع",
    recipientEn: "Project Manager",
    recipientType: "employee",
    trigger: "عند تحديث مهمة إلى مكتملة",
    triggerEn: "Task marked as completed",
    subject: "انجاز مهمة | QIROX",
  },
  {
    id: "task_status",
    category: "tasks",
    icon: ClipboardList,
    event: "تغيير حالة المهمة",
    eventEn: "Task Status Changed",
    recipient: "الموظف المكلَّف بالمهمة",
    recipientEn: "Assigned Employee",
    recipientType: "employee",
    trigger: "عند تغيير حالة المهمة",
    triggerEn: "Task status updated",
    subject: "تحديث المهمة | QIROX",
  },

  // ── MESSAGES ──────────────────────────────────────────────────────
  {
    id: "message_notif",
    category: "messages",
    icon: MessageSquare,
    event: "إشعار رسالة جديدة",
    eventEn: "New Message Notification",
    recipient: "المستلم (عميل أو موظف)",
    recipientEn: "Recipient (Client or Employee)",
    recipientType: "client",
    trigger: "عند إرسال رسالة جديدة في صندوق البريد",
    triggerEn: "New message sent in inbox",
    subject: "رسالة جديدة | QIROX",
  },
  {
    id: "missed_call",
    category: "messages",
    icon: Phone,
    event: "إشعار مكالمة فائتة",
    eventEn: "Missed Call Notification",
    recipient: "الموظف المستدعى",
    recipientEn: "Called Employee",
    recipientType: "employee",
    trigger: "عند محاولة مكالمة QMeet وعدم الرد",
    triggerEn: "QMeet call unanswered",
    subject: "مكالمة فائتة | QIROX",
  },

  // ── SUPPORT ───────────────────────────────────────────────────────
  {
    id: "ticket_created",
    category: "support",
    icon: Star,
    event: "تأكيد فتح تذكرة دعم",
    eventEn: "Support Ticket Created",
    recipient: "العميل",
    recipientEn: "Client",
    recipientType: "client",
    trigger: "عند رفع تذكرة دعم جديدة",
    triggerEn: "Client submits support ticket",
    subject: "تذكرة دعم #XXX | QIROX",
  },
  {
    id: "ticket_reply",
    category: "support",
    icon: Star,
    event: "رد على تذكرة الدعم",
    eventEn: "Support Ticket Reply",
    recipient: "العميل",
    recipientEn: "Client",
    recipientType: "client",
    trigger: "عند رد الفريق على التذكرة أو تغيير حالتها",
    triggerEn: "Admin replies or changes ticket status",
    subject: "ردّ على تذكرتك | QIROX",
  },
  {
    id: "ticket_admin",
    category: "support",
    icon: Users,
    event: "إشعار تذكرة جديدة للفريق",
    eventEn: "New Ticket — Staff Notification",
    recipient: "admin / manager / support",
    recipientEn: "Admins, Managers & Support staff",
    recipientType: "admin",
    trigger: "عند فتح أي تذكرة دعم من عميل",
    triggerEn: "New support ticket submitted",
    subject: "تذكرة دعم جديدة | QIROX",
  },

  // ── CONSULTATIONS ─────────────────────────────────────────────────
  {
    id: "consult_confirm",
    category: "consultations",
    icon: CalendarCheck,
    event: "تأكيد موعد الاستشارة",
    eventEn: "Consultation Confirmation",
    recipient: "العميل",
    recipientEn: "Client",
    recipientType: "client",
    trigger: "عند تأكيد موعد الاستشارة",
    triggerEn: "Consultation booking confirmed",
    subject: "تأكيد موعد الاستشارة | QIROX",
  },
  {
    id: "consult_notif",
    category: "consultations",
    icon: CalendarCheck,
    event: "إشعار استشارة جديدة للموظف",
    eventEn: "Consultation Notification — Staff",
    recipient: "الموظف المحجوز",
    recipientEn: "Assigned Staff Member",
    recipientType: "employee",
    trigger: "عند حجز استشارة مع موظف معين",
    triggerEn: "Client books consultation with this employee",
    subject: "استشارة جديدة | QIROX",
  },

  // ── CLIENTS (ADMIN SIDE) ─────────────────────────────────────────
  {
    id: "admin_new_client",
    category: "clients",
    icon: User,
    event: "إشعار عميل جديد للمديرين",
    eventEn: "New Client — Admin Notification",
    recipient: "admin / manager + info@qiroxstudio.online",
    recipientEn: "Admins & Managers",
    recipientType: "admin",
    trigger: "عند تسجيل عميل جديد (ذاتياً أو من الإدارة)",
    triggerEn: "New client registered",
    subject: "عميل جديد | QIROX",
  },
  {
    id: "data_request",
    category: "clients",
    icon: ClipboardList,
    event: "طلب بيانات من الفريق",
    eventEn: "Data Request",
    recipient: "العميل",
    recipientEn: "Client",
    recipientType: "client",
    trigger: "عند إرسال طلب بيانات للعميل من لوحة المشاريع",
    triggerEn: "Employee sends data request to client",
    subject: "طلب بيانات جديد | QIROX",
  },

  // ── SHIPMENTS ────────────────────────────────────────────────────
  {
    id: "shipment",
    category: "shipments",
    icon: Truck,
    event: "تحديث الشحنة",
    eventEn: "Shipment Update",
    recipient: "العميل",
    recipientEn: "Client",
    recipientType: "client",
    trigger: "عند تحديث حالة الشحنة",
    triggerEn: "Shipment status updated",
    subject: "تحديث شحنتك | QIROX",
  },

  // ── MARKETING ────────────────────────────────────────────────────
  {
    id: "marketing_campaign",
    category: "marketing",
    icon: Megaphone,
    event: "حملة تسويق بريدية",
    eventEn: "Email Marketing Campaign",
    recipient: "قائمة العملاء المستهدفين",
    recipientEn: "Target client list",
    recipientType: "client",
    trigger: "عند إطلاق حملة تسويق بريدية يدوياً أو تلقائياً",
    triggerEn: "Email campaign launched (manual or scheduled)",
    subject: "حسب محتوى الحملة",
  },
  {
    id: "discount_email",
    category: "marketing",
    icon: Megaphone,
    event: "إرسال كود خصم مخصص",
    eventEn: "Personalized Discount Code",
    recipient: "العميل المستهدف",
    recipientEn: "Target Client",
    recipientType: "client",
    trigger: "عند إرسال كود خصم من قائمة العربات المهجورة",
    triggerEn: "Discount sent from abandoned cart list",
    subject: "كود خصم خاص لك | QIROX",
  },
  {
    id: "direct_email",
    category: "marketing",
    icon: Mail,
    event: "بريد مباشر يدوي",
    eventEn: "Manual Direct Email",
    recipient: "أي مستلم يختاره المدير",
    recipientEn: "Any chosen recipient",
    recipientType: "admin",
    trigger: "عند الإرسال اليدوي من لوحة البريد المباشر",
    triggerEn: "Admin manually sends direct email",
    subject: "حسب اختيار المدير",
  },

  // ── OWNER ────────────────────────────────────────────────────────
  {
    id: "owner_wa",
    category: "owner",
    icon: Building2,
    event: "إشعار واتساب للمالك",
    eventEn: "Owner WhatsApp Alert",
    recipient: "youssefd.business@gmail.com",
    recipientEn: "Owner email",
    recipientType: "owner",
    trigger: "عند أي حدث رئيسي (عميل / طلب / ...)",
    triggerEn: "Any major event (new client, order, etc.)",
    subject: "إشعار واتساب — QIROX",
  },
  {
    id: "contact_form",
    category: "owner",
    icon: Mail,
    event: "رسالة نموذج التواصل",
    eventEn: "Contact Form Message",
    recipient: "info@qiroxstudio.online",
    recipientEn: "Support email",
    recipientType: "admin",
    trigger: "عند تعبئة نموذج التواصل في الموقع",
    triggerEn: "Visitor submits contact form",
    subject: "رسالة جديدة من نموذج التواصل",
  },
  {
    id: "job_apply",
    category: "owner",
    icon: Users,
    event: "طلب توظيف جديد",
    eventEn: "New Job Application",
    recipient: "info@qiroxstudio.online + HR",
    recipientEn: "HR & Admin email",
    recipientType: "admin",
    trigger: "عند تقديم طلب توظيف من صفحة الوظائف",
    triggerEn: "Applicant submits job application",
    subject: "طلب توظيف جديد | QIROX HR",
  },
];

const CATEGORIES: { key: string; label: string; icon: React.ElementType; color: string }[] = [
  { key: "all",           label: "الكل",               icon: Mail,           color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  { key: "auth",          label: "المصادقة والحساب",   icon: ShieldCheck,    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { key: "orders",        label: "الطلبات والمشاريع",   icon: Package,        color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  { key: "finance",       label: "المالية والدفع",      icon: CreditCard,     color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  { key: "tasks",         label: "المهام",              icon: ClipboardList,  color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
  { key: "messages",      label: "الرسائل والمكالمات",  icon: MessageSquare,  color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" },
  { key: "support",       label: "الدعم الفني",         icon: Star,           color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  { key: "consultations", label: "الاستشارات",          icon: CalendarCheck,  color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" },
  { key: "clients",       label: "العملاء",             icon: User,           color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
  { key: "shipments",     label: "الشحنات",             icon: Truck,          color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300" },
  { key: "marketing",     label: "التسويق",             icon: Megaphone,      color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  { key: "owner",         label: "الإدارة العليا",      icon: Building2,      color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
];

const RECIPIENT_COLORS: Record<string, string> = {
  client:   "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800",
  employee: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800",
  admin:    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800",
  owner:    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800",
};

const RECIPIENT_LABELS: Record<string, string> = {
  client: "عميل", employee: "موظف", admin: "إدارة", owner: "مالك"
};

export default function AdminEmailGuide() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = EMAIL_EVENTS.filter(e => {
    const matchCat = activeCategory === "all" || e.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || e.event.includes(q) || e.eventEn.toLowerCase().includes(q) || e.recipient.includes(q) || e.trigger.includes(q);
    return matchCat && matchSearch;
  });

  const stats = {
    total: EMAIL_EVENTS.length,
    client: EMAIL_EVENTS.filter(e => e.recipientType === "client").length,
    employee: EMAIL_EVENTS.filter(e => e.recipientType === "employee").length,
    admin: EMAIL_EVENTS.filter(e => e.recipientType === "admin").length,
    owner: EMAIL_EVENTS.filter(e => e.recipientType === "owner").length,
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{ar ? "دليل البريد الإلكتروني" : "Email Events Guide"}</h1>
            <p className="text-sm text-muted-foreground">{ar ? "كل حدث يرسل بريداً في النظام — التفاصيل الكاملة" : "Every email-sending event in the system"}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-3xl font-black">{stats.total}</p>
          <p className="text-xs text-muted-foreground mt-1">إجمالي أنواع البريد</p>
        </div>
        <div className="rounded-xl border bg-blue-50 dark:bg-blue-950/20 p-4 text-center">
          <p className="text-3xl font-black text-blue-600">{stats.client}</p>
          <p className="text-xs text-muted-foreground mt-1">تُرسل للعملاء</p>
        </div>
        <div className="rounded-xl border bg-violet-50 dark:bg-violet-950/20 p-4 text-center">
          <p className="text-3xl font-black text-violet-600">{stats.employee}</p>
          <p className="text-xs text-muted-foreground mt-1">تُرسل للموظفين</p>
        </div>
        <div className="rounded-xl border bg-orange-50 dark:bg-orange-950/20 p-4 text-center">
          <p className="text-3xl font-black text-orange-600">{stats.admin + stats.owner}</p>
          <p className="text-xs text-muted-foreground mt-1">تُرسل للإدارة</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pr-9"
            placeholder="ابحث عن حدث أو مستلم..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                isActive ? cat.color + " border-current shadow-sm scale-105" : "border-border bg-background hover:bg-muted"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
              {cat.key !== "all" && (
                <span className="text-xs opacity-70">({EMAIL_EVENTS.filter(e => e.category === cat.key).length})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Events Table */}
      <div className="rounded-xl border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-right p-3 font-semibold text-muted-foreground">الحدث</th>
                <th className="text-right p-3 font-semibold text-muted-foreground">المستلم</th>
                <th className="text-right p-3 font-semibold text-muted-foreground">متى يُرسَل</th>
                <th className="text-right p-3 font-semibold text-muted-foreground w-48 hidden sm:table-cell">موضوع البريد</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-muted-foreground">
                    لا توجد نتائج
                  </td>
                </tr>
              ) : (
                filtered.map((e, idx) => {
                  const Icon = e.icon;
                  return (
                    <tr key={e.id} className={`border-b transition-colors hover:bg-muted/30 ${idx % 2 === 0 ? "" : "bg-muted/10"}`}>
                      <td className="p-3">
                        <div className="flex items-start gap-2">
                          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold leading-tight">{e.event}</p>
                            <p className="text-xs text-muted-foreground">{e.eventEn}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className={`w-fit text-xs ${RECIPIENT_COLORS[e.recipientType]}`}>
                            {RECIPIENT_LABELS[e.recipientType]}
                          </Badge>
                          <span className="text-xs text-muted-foreground leading-tight max-w-[200px]">{e.recipient}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="text-sm leading-snug text-foreground/90">{e.trigger}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{e.triggerEn}</p>
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono leading-tight block">{e.subject}</code>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="p-3 border-t bg-muted/30 text-sm text-muted-foreground text-center">
            يُعرض {filtered.length} من أصل {EMAIL_EVENTS.length} نوع بريد في النظام
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="rounded-xl border p-4 bg-muted/20">
        <p className="text-sm font-semibold mb-3">دليل الألوان</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(RECIPIENT_LABELS).map(([key, label]) => (
            <Badge key={key} variant="outline" className={`${RECIPIENT_COLORS[key]} text-xs`}>
              {label} — {key === "client" ? "يُرسل لأصحاب الحسابات العادية" : key === "employee" ? "يُرسل لفريق العمل والموظفين" : key === "admin" ? "يُرسل للمديرين وأصحاب الصلاحيات" : "يُرسل لبريد المالك"}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
