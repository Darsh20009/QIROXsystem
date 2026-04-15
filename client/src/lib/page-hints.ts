export interface PageHint {
  key: string;
  icon: string;
  color: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  featuresAr: string[];
  featuresEn: string[];
  roles?: string[];
}

export const PAGE_HINTS: PageHint[] = [
  {
    key: "/dashboard",
    icon: "🏠",
    color: "from-blue-600 to-indigo-600",
    titleAr: "لوحة التحكم الرئيسية",
    titleEn: "Main Dashboard",
    descAr: "مركز إدارة كل شيء يخصك في Qirox Studio — طلباتك، مشاريعك، فواتيرك، واجتماعاتك القادمة في مكان واحد.",
    descEn: "Your control center in Qirox Studio — orders, projects, invoices, and upcoming meetings all in one place.",
    featuresAr: [
      "تتبع حالة طلباتك الحالية",
      "متابعة تقدم مشاريعك",
      "عرض اجتماعاتك القادمة والانضمام إليها",
      "رصيد محفظتك وآخر المعاملات",
      "تواصل مع فريق الدعم",
    ],
    featuresEn: [
      "Track the status of your current orders",
      "Monitor your project progress",
      "View and join upcoming meetings",
      "Wallet balance and recent transactions",
      "Contact support team",
    ],
    roles: ["client", "employee", "manager", "admin"],
  },
  {
    key: "/projects",
    icon: "📁",
    color: "from-violet-600 to-purple-600",
    titleAr: "مشاريعي",
    titleEn: "My Projects",
    descAr: "هنا تجد كل مشاريعك الجارية والمكتملة مع Qirox Studio — من تصميم الهوية إلى تطوير الأنظمة.",
    descEn: "All your ongoing and completed projects with Qirox Studio — from branding to system development.",
    featuresAr: [
      "متابعة نسبة الإنجاز لكل مشروع",
      "التواصل مع فريق العمل في كل مشروع",
      "مراجعة الملفات والتسليمات",
      "الموافقة على مراحل العمل",
      "طلب تعديلات على المشروع",
    ],
    featuresEn: [
      "Track completion percentage for each project",
      "Communicate with the project team",
      "Review files and deliverables",
      "Approve project milestones",
      "Request project modifications",
    ],
    roles: ["client"],
  },
  {
    key: "/wallet",
    icon: "💳",
    color: "from-emerald-600 to-green-600",
    titleAr: "محفظتي الرقمية",
    titleEn: "My Digital Wallet",
    descAr: "محفظتك الرقمية في Qirox Pay — اشحن رصيدك واستخدمه لدفع الخدمات والاشتراكات.",
    descEn: "Your Qirox Pay digital wallet — top up your balance and use it for services and subscriptions.",
    featuresAr: [
      "شحن الرصيد عبر الدفع الإلكتروني",
      "الدفع مقابل الطلبات والخدمات",
      "عرض سجل المعاملات الكاملة",
      "تحويل الرصيد",
      "استخدام بطاقة المحفظة الرقمية",
    ],
    featuresEn: [
      "Top up balance via electronic payment",
      "Pay for orders and services",
      "View complete transaction history",
      "Transfer balance",
      "Use your digital wallet card",
    ],
    roles: ["client"],
  },
  {
    key: "/invoices",
    icon: "🧾",
    color: "from-amber-600 to-orange-600",
    titleAr: "فواتيري",
    titleEn: "My Invoices",
    descAr: "كل فواتيرك في مكان واحد — استعرض وادفع وحمّل فواتيرك الضريبية بسهولة.",
    descEn: "All your invoices in one place — view, pay, and download tax invoices easily.",
    featuresAr: [
      "عرض جميع الفواتير المستحقة والمدفوعة",
      "تحميل الفاتورة بصيغة PDF",
      "الدفع الفوري عبر المحفظة أو البطاقة",
      "تتبع تاريخ الاستحقاق",
    ],
    featuresEn: [
      "View all pending and paid invoices",
      "Download invoice as PDF",
      "Instant payment via wallet or card",
      "Track due dates",
    ],
    roles: ["client"],
  },
  {
    key: "/my-services",
    icon: "⚡",
    color: "from-cyan-600 to-blue-600",
    titleAr: "خدماتي المفعّلة",
    titleEn: "My Active Services",
    descAr: "نظرة كاملة على الخدمات التي تشترك بها في Qirox Studio وتفاصيل كل خدمة.",
    descEn: "Full overview of your subscribed services in Qirox Studio and details of each.",
    featuresAr: [
      "عرض جميع خدماتك الفعّالة",
      "تفاصيل كل خدمة وتاريخ انتهائها",
      "طلب تجديد أو ترقية الخدمة",
      "متابعة حالة كل خدمة",
    ],
    featuresEn: [
      "View all your active services",
      "Service details and expiry dates",
      "Request renewal or upgrade",
      "Monitor service status",
    ],
    roles: ["client"],
  },
  {
    key: "/my-tools",
    icon: "🛠️",
    color: "from-violet-600 to-fuchsia-600",
    titleAr: "أدواتي ومميزاتي",
    titleEn: "My Tools & Features",
    descAr: "مجموعة أدوات قوية متاحة لك — من تحويل الملفات إلى إنشاء الباركود والمزيد.",
    descEn: "A powerful set of tools at your disposal — from file conversion to barcode generation and more.",
    featuresAr: [
      "أدوات PDF: دمج، تقسيم، تحويل",
      "إنشاء باركود وQR code",
      "أدوات إنتاجية متنوعة",
      "مشاركة النتائج مباشرة",
    ],
    featuresEn: [
      "PDF tools: merge, split, convert",
      "Generate barcodes and QR codes",
      "Various productivity tools",
      "Share results directly",
    ],
    roles: ["client", "employee"],
  },
  {
    key: "/inbox",
    icon: "✉️",
    color: "from-sky-600 to-blue-600",
    titleAr: "صندوق الرسائل",
    titleEn: "Message Inbox",
    descAr: "تواصل مباشر مع فريق Qirox Studio — اسأل واستفسر وتابع ردود الفريق.",
    descEn: "Direct communication with the Qirox Studio team — ask questions and follow up on responses.",
    featuresAr: [
      "إرسال رسائل مباشرة للفريق",
      "استقبال الإشعارات والتحديثات",
      "مرفقات الملفات والصور",
      "تاريخ كامل للمحادثات",
    ],
    featuresEn: [
      "Send direct messages to the team",
      "Receive notifications and updates",
      "File and image attachments",
      "Complete conversation history",
    ],
    roles: ["client", "employee"],
  },
  {
    key: "/my-profile",
    icon: "👤",
    color: "from-rose-600 to-pink-600",
    titleAr: "ملفي الشخصي",
    titleEn: "My Profile",
    descAr: "بياناتك الشخصية وهويتك الإبداعية على Qirox Studio — خصّص مظهرك وابنِ هويتك.",
    descEn: "Your personal data and creative identity on Qirox Studio — customize your look and build your identity.",
    featuresAr: [
      "تحديث بياناتك الشخصية",
      "تخصيص الصورة الشخصية أو الأفاتار",
      "إضافة حسابات التواصل الاجتماعي",
      "عرض ملفك للآخرين",
      "تغيير كلمة المرور",
    ],
    featuresEn: [
      "Update your personal information",
      "Customize profile picture or avatar",
      "Add social media accounts",
      "Show your profile to others",
      "Change password",
    ],
    roles: ["client", "employee"],
  },
  {
    key: "/meet/join",
    icon: "🎥",
    color: "from-purple-600 to-violet-600",
    titleAr: "الانضمام لاجتماع",
    titleEn: "Join a Meeting",
    descAr: "انضم للاجتماعات المجدولة مع فريق Qirox Studio عبر نظام QMeet المدمج.",
    descEn: "Join scheduled meetings with the Qirox Studio team via the integrated QMeet system.",
    featuresAr: [
      "الانضمام بكود الاجتماع السري",
      "انضمام مباشر من رابط الدعوة",
      "كاميرا وميكروفون وحصة الشاشة",
      "دردشة نصية داخل الاجتماع",
      "السبورة التفاعلية المشتركة",
    ],
    featuresEn: [
      "Join using the meeting code",
      "Direct join via invitation link",
      "Camera, mic, and screen sharing",
      "In-meeting text chat",
      "Shared interactive whiteboard",
    ],
    roles: ["client", "employee"],
  },
  {
    key: "/cart",
    icon: "🛒",
    color: "from-green-600 to-emerald-600",
    titleAr: "سلة المشتريات",
    titleEn: "Shopping Cart",
    descAr: "راجع الخدمات التي أضفتها قبل الإتمام — يمكنك تعديل أو إزالة أي خدمة قبل الدفع.",
    descEn: "Review services you've added before checkout — modify or remove any service before payment.",
    featuresAr: [
      "مراجعة الخدمات المختارة",
      "تعديل أو إزالة العناصر",
      "تطبيق كود الخصم",
      "الدفع عبر المحفظة أو البطاقة",
      "تأكيد الطلب وإنشاء الفاتورة",
    ],
    featuresEn: [
      "Review selected services",
      "Edit or remove items",
      "Apply discount code",
      "Pay via wallet or card",
      "Confirm order and generate invoice",
    ],
    roles: ["client"],
  },
  {
    key: "/cs-chat",
    icon: "🎧",
    color: "from-teal-600 to-cyan-600",
    titleAr: "دعم العملاء المباشر",
    titleEn: "Live Customer Support",
    descAr: "تواصل مع فريق دعم Qirox في الوقت الفعلي للحصول على مساعدة فورية.",
    descEn: "Contact Qirox support team in real-time for immediate assistance.",
    featuresAr: [
      "دردشة مباشرة مع فريق الدعم",
      "إرفاق الصور والملفات",
      "تتبع حالة تذكرة الدعم",
      "سجل كامل للمحادثات السابقة",
    ],
    featuresEn: [
      "Live chat with support team",
      "Attach images and files",
      "Track support ticket status",
      "Full history of past conversations",
    ],
    roles: ["client"],
  },
  {
    key: "/my-modifications",
    icon: "✏️",
    color: "from-orange-600 to-amber-600",
    titleAr: "طلبات التعديل",
    titleEn: "Modification Requests",
    descAr: "أرسل وتابع طلبات التعديل على مشاريعك وخدماتك — كل تعديل موثّق ومتابَع.",
    descEn: "Submit and track modification requests on your projects and services — every change documented.",
    featuresAr: [
      "إرسال طلب تعديل جديد",
      "تحديد نوع التعديل والأولوية",
      "متابعة حالة كل طلب",
      "إرفاق صور ومستندات توضيحية",
      "التواصل مع الفريق حول التعديل",
    ],
    featuresEn: [
      "Submit a new modification request",
      "Specify type and priority",
      "Track the status of each request",
      "Attach images and explanatory documents",
      "Communicate with the team about the change",
    ],
    roles: ["client"],
  },
  {
    key: "/switch-reminder",
    icon: "🔔",
    color: "from-violet-600 to-purple-600",
    titleAr: "تذكير تجديد الاشتراك",
    titleEn: "Renewal Reminder",
    descAr: "سجّل موعد انتهاء اشتراكك مع أي شركة أخرى وسيتواصل معك فريقنا قبل الانتهاء.",
    descEn: "Register your current subscription expiry and we'll reach out before it ends.",
    featuresAr: [
      "أدخل اسم الشركة الحالية وموعد انتهاء الاشتراك",
      "سيتواصل معك فريق Qirox قبل الموعد",
      "اكتشف مميزاتنا واتخذ قرارك بهدوء",
      "الخدمة مجانية وبدون أي التزام",
    ],
    featuresEn: [
      "Enter your current provider and expiry date",
      "Qirox team will reach out before it expires",
      "Learn about our features and decide calmly",
      "Free service with no commitment",
    ],
    roles: ["client"],
  },
  {
    key: "/my-api-keys",
    icon: "🔑",
    color: "from-violet-600 to-indigo-600",
    titleAr: "مفاتيح API",
    titleEn: "API Keys",
    descAr: "اربط متجرك أو تطبيقك بنظام Qirox مباشرةً لجلب الطلبات والإحصائيات والمشاريع برمجياً.",
    descEn: "Connect your store or app directly to Qirox to programmatically fetch orders, stats, and projects.",
    featuresAr: [
      "أنشئ مفاتيح API آمنة ومشفرة",
      "تحكم بالصلاحيات: طلبات، مشاريع، فواتير، محفظة",
      "كل طلب API يُسجَّل للمراقبة والحماية",
      "مفاتيح غير محدودة المدة أو مع تاريخ انتهاء",
    ],
    featuresEn: [
      "Create secure, hashed API keys",
      "Control scopes: orders, projects, invoices, wallet",
      "All API calls are logged for monitoring and security",
      "Keys can be permanent or set to expire",
    ],
    roles: ["client"],
  },
  {
    key: "/my-consultations",
    icon: "📅",
    color: "from-indigo-600 to-blue-600",
    titleAr: "جلسات الاستشارة",
    titleEn: "Consultation Sessions",
    descAr: "احجز جلسات استشارية مع خبراء Qirox لتطوير مشروعك وأعمالك.",
    descEn: "Book consultation sessions with Qirox experts to develop your project and business.",
    featuresAr: [
      "حجز موعد استشاري مناسب",
      "اختيار نوع الاستشارة",
      "متابعة الجلسات القادمة",
      "الانضمام للجلسة عبر QMeet",
    ],
    featuresEn: [
      "Book a convenient consultation time",
      "Choose consultation type",
      "Track upcoming sessions",
      "Join session via QMeet",
    ],
    roles: ["client"],
  },
  {
    key: "/payment-history",
    icon: "💰",
    color: "from-green-600 to-teal-600",
    titleAr: "سجل المدفوعات",
    titleEn: "Payment History",
    descAr: "سجل كامل بجميع مدفوعاتك في Qirox Studio — شفافية تامة لكل معاملة.",
    descEn: "Complete record of all your payments in Qirox Studio — full transparency for every transaction.",
    featuresAr: [
      "عرض جميع المدفوعات",
      "تصفية حسب التاريخ أو النوع",
      "تحميل كشف الحساب",
      "تفاصيل كل عملية دفع",
    ],
    featuresEn: [
      "View all payments",
      "Filter by date or type",
      "Download account statement",
      "Details of each payment",
    ],
    roles: ["client"],
  },
  {
    key: "/employee/role-dashboard",
    icon: "⚙️",
    color: "from-slate-700 to-gray-700",
    titleAr: "لوحتي المتخصصة",
    titleEn: "My Role Dashboard",
    descAr: "لوحة تحكم مخصصة لدورك الوظيفي — أدوات وعمليات خاصة بمهامك اليومية.",
    descEn: "A dashboard customized for your role — tools and operations specific to your daily tasks.",
    featuresAr: [
      "متابعة المهام الخاصة بدورك",
      "إجراءات سريعة مخصصة",
      "إحصاءات وتقارير دورك",
      "اجتماعاتك القادمة",
    ],
    featuresEn: [
      "Track tasks specific to your role",
      "Quick custom actions",
      "Role-specific stats and reports",
      "Your upcoming meetings",
    ],
    roles: ["employee", "manager"],
  },
  {
    key: "/admin/qmeet",
    icon: "🎥",
    color: "from-purple-600 to-violet-600",
    titleAr: "نظام اجتماعات QMeet",
    titleEn: "QMeet Meeting System",
    descAr: "أنشئ وأدر اجتماعات الفيديو مع العملاء والفريق — جدولة متقدمة وتتبع كامل.",
    descEn: "Create and manage video meetings with clients and team — advanced scheduling and full tracking.",
    featuresAr: [
      "إنشاء اجتماع جديد وإرسال الدعوات",
      "إدارة المشاركين وطلبات الانضمام",
      "جدولة الاجتماعات وتذكير المدعوين",
      "عرض التقارير وتقييمات المشاركين",
      "الإشراف على الاجتماعات المباشرة",
    ],
    featuresEn: [
      "Create new meeting and send invitations",
      "Manage participants and join requests",
      "Schedule meetings and remind attendees",
      "View reports and participant ratings",
      "Supervise live meetings",
    ],
    roles: ["employee", "manager", "admin"],
  },
  {
    key: "/admin/orders",
    icon: "📋",
    color: "from-blue-600 to-indigo-600",
    titleAr: "إدارة الطلبات",
    titleEn: "Order Management",
    descAr: "تتبع وإدارة جميع طلبات العملاء من الاستلام حتى التسليم النهائي.",
    descEn: "Track and manage all client orders from receipt to final delivery.",
    featuresAr: [
      "عرض جميع الطلبات وحالاتها",
      "تحديث حالة الطلب",
      "إضافة ملاحظات وتعليقات",
      "إرسال إشعارات للعميل",
      "تصدير تقرير الطلبات",
    ],
    featuresEn: [
      "View all orders and their statuses",
      "Update order status",
      "Add notes and comments",
      "Send notifications to client",
      "Export order report",
    ],
    roles: ["employee", "manager", "admin"],
  },
  {
    key: "/admin/customers",
    icon: "👥",
    color: "from-rose-600 to-pink-600",
    titleAr: "إدارة العملاء",
    titleEn: "Customer Management",
    descAr: "قاعدة بيانات كاملة لجميع عملاء Qirox Studio مع تفاصيل كل عميل.",
    descEn: "Complete database of all Qirox Studio clients with full details for each.",
    featuresAr: [
      "عرض قائمة العملاء كاملة",
      "البحث والتصفية المتقدمة",
      "تفاصيل الطلبات والمشاريع لكل عميل",
      "تواصل مباشر مع العميل",
    ],
    featuresEn: [
      "View complete client list",
      "Advanced search and filtering",
      "Order and project details per client",
      "Direct communication with client",
    ],
    roles: ["employee", "manager", "admin"],
  },
  {
    key: "/admin/analytics",
    icon: "📊",
    color: "from-indigo-600 to-violet-600",
    titleAr: "التحليلات المتقدمة",
    titleEn: "Advanced Analytics",
    descAr: "تقارير وإحصاءات شاملة عن أداء المنصة — الإيرادات، النمو، والنشاط.",
    descEn: "Comprehensive reports and statistics about platform performance — revenue, growth, and activity.",
    featuresAr: [
      "رسوم بيانية للإيرادات الشهرية",
      "تتبع نمو قاعدة العملاء",
      "تحليل أداء الخدمات",
      "تقارير الحضور والنشاط",
    ],
    featuresEn: [
      "Monthly revenue charts",
      "Client base growth tracking",
      "Service performance analysis",
      "Attendance and activity reports",
    ],
    roles: ["manager", "admin"],
  },
];

export function getHintForPath(path: string): PageHint | null {
  const normalized = path.split("?")[0].replace(/\/+$/, "") || "/";
  const exact = PAGE_HINTS.find(h => h.key === normalized);
  if (exact) return exact;
  const prefix = PAGE_HINTS.find(h => h.key !== "/" && normalized.startsWith(h.key));
  return prefix || null;
}

export function isHintDismissed(key: string, userId: string): boolean {
  try {
    const stored = localStorage.getItem(`hint_dismissed_${userId}`);
    if (!stored) return false;
    const dismissed: string[] = JSON.parse(stored);
    return dismissed.includes(key);
  } catch {
    return false;
  }
}

export function dismissHint(key: string, userId: string): void {
  try {
    const stored = localStorage.getItem(`hint_dismissed_${userId}`);
    const dismissed: string[] = stored ? JSON.parse(stored) : [];
    if (!dismissed.includes(key)) {
      dismissed.push(key);
      localStorage.setItem(`hint_dismissed_${userId}`, JSON.stringify(dismissed));
    }
  } catch {}
}

export function resetAllHints(userId: string): void {
  try {
    localStorage.removeItem(`hint_dismissed_${userId}`);
  } catch {}
}
