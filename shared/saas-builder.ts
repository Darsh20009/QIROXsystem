export type BuilderTier = "lite" | "pro" | "infinity";

export type BuilderConfig = {
  businessName: string;
  businessNameEn: string;
  commercialRegNumber: string;
  taxNumber: string;
  commercialRegUrl: string;
  bankName: string;
  bankAccountName: string;
  iban: string;
  logoUrl: string;
  primaryColor: string;
  phone: string;
  address: string;
  websiteUrl: string;
  secondaryColor?: string;
  heroImageUrl?: string;
  splashEnabled?: boolean;
  splashImageUrl?: string;
  splashBackgroundColor?: string;
  splashImageFit?: "contain" | "cover";
  splashDurationMs?: number;
  splashTitle?: string;
  splashSubtitle?: string;
  extraFeatures?: string[];
  customerWhatsappRegistration?: boolean;
  notificationEmail?: boolean;
};

/** These aliases are shared with the generated application's permission gates. */
export const SAAS_FEATURE_ALIASES: Record<string, string[]> = {
  accounting: ["accounting", "accountingModule", "basicReports"],
  "customer-management": ["customerManagement", "customerApp", "crm"],
  reviews: ["reviews"],
  "apple-wallet": ["appleWallet", "wallet"],
  integrations: ["integrations", "erpIntegration"],
  pwa: ["pwa"],
  push: ["push", "pushNotifications"],
  "sales-reports": ["salesReports"],
  inventory: ["inventory", "inventoryManagement", "rawItems", "recipeManagement", "supplierManagement", "warehouseManagement"],
  payments: ["paymentGateway", "onlinePayments"],
  loyalty: ["loyalty", "loyaltyProgram", "loyaltyPoints", "giftCards"],
  "advanced-reports": ["advancedReports", "advancedAnalytics", "biAnalytics"],
  attendance: ["attendance", "payrollManagement", "employeeManagement", "enterpriseAdministration"],
};

export const SAAS_FEATURES = [
  { id: "menu", labelAr: "قائمة الطعام", labelEn: "Digital menu", minTier: "lite" },
  { id: "table-booking", labelAr: "حجز الطاولات", labelEn: "Table booking", minTier: "lite" },
  { id: "website", labelAr: "موقع المطعم", labelEn: "Restaurant website", minTier: "lite" },
  { id: "qr-menu", labelAr: "قائمة رقمية عبر QR", labelEn: "QR menu", minTier: "lite" },
  { id: "maps", labelAr: "الموقع والخرائط", labelEn: "Maps and location", minTier: "lite" },
  { id: "social", labelAr: "روابط التواصل الاجتماعي", labelEn: "Social links", minTier: "lite" },
  { id: "order-management", labelAr: "إدارة وتتبع الطلبات", labelEn: "Order management and tracking", minTier: "lite" },
  { id: "kitchen", labelAr: "شاشة المطبخ الأساسية", labelEn: "Core kitchen display", minTier: "lite" },
  { id: "invoice-printing", labelAr: "طباعة الفواتير والطلبات", labelEn: "Invoice and order printing", minTier: "lite" },
  { id: "pos", labelAr: "نقطة البيع POS", labelEn: "Point of sale", minTier: "lite" },
  { id: "accounting", labelAr: "المحاسبة المتكاملة", labelEn: "Accounting", minTier: "pro" },
  { id: "customer-management", labelAr: "إدارة العملاء", labelEn: "Customer management", minTier: "pro" },
  { id: "reviews", labelAr: "التقييمات والمراجعات", labelEn: "Ratings and reviews", minTier: "pro" },
  { id: "apple-wallet", labelAr: "دعم Apple Wallet", labelEn: "Apple Wallet support", minTier: "pro" },
  { id: "integrations", labelAr: "تكاملات الخدمات", labelEn: "Service integrations", minTier: "pro" },
  { id: "pwa", labelAr: "تطبيق PWA", labelEn: "PWA", minTier: "pro" },
  { id: "push", labelAr: "الإشعارات الفورية", labelEn: "Push notifications", minTier: "pro" },
  { id: "sales-reports", labelAr: "تقارير المبيعات", labelEn: "Sales reports", minTier: "pro" },
  { id: "inventory", labelAr: "إدارة المخزون", labelEn: "Inventory", minTier: "infinity" },
  { id: "payments", labelAr: "بوابة الدفع الإلكتروني", labelEn: "Online payments", minTier: "pro" },
  { id: "loyalty", labelAr: "برنامج الولاء والنقاط", labelEn: "Loyalty and points", minTier: "pro" },
  { id: "advanced-reports", labelAr: "التقارير المتقدمة", labelEn: "Advanced reports", minTier: "infinity" },
  { id: "attendance", labelAr: "الحضور والإدارة المؤسسية", labelEn: "Attendance and enterprise administration", minTier: "infinity" },
] as const;

// Delivery allowances are not claims that external services are provisioned.
export const SAAS_DELIVERY_ENTITLEMENTS = {
  lite: { monthlyEmailLimit: 0, businessMailboxes: 0, postDeliveryRevisions: 0, postDeliveryFeatures: 0, prioritySupport: false },
  pro: { monthlyEmailLimit: 1000, businessMailboxes: 0, postDeliveryRevisions: 5, postDeliveryFeatures: 0, prioritySupport: false },
  infinity: { monthlyEmailLimit: 10000, businessMailboxes: 5, postDeliveryRevisions: 5, postDeliveryFeatures: 20, prioritySupport: true },
} as const;