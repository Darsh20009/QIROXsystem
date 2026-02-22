import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Lang = "ar" | "en";

const translations = {
  "nav.home": { ar: "الرئيسية", en: "Home" },
  "nav.services": { ar: "الخدمات", en: "Services" },
  "nav.portfolio": { ar: "الأنظمة", en: "Portfolio" },
  "nav.prices": { ar: "الباقات", en: "Pricing" },
  "nav.partners": { ar: "الشركاء", en: "Partners" },
  "nav.about": { ar: "عن المنصة", en: "About" },
  "nav.contact": { ar: "تواصل", en: "Contact" },
  "nav.dashboard": { ar: "لوحة التحكم", en: "Dashboard" },
  "nav.login": { ar: "دخول", en: "Login" },
  "nav.startProject": { ar: "ابدأ مشروعك", en: "Start Project" },

  "home.badge": { ar: "SYSTEMS FACTORY", en: "SYSTEMS FACTORY" },
  "home.tagline": { ar: "Build Systems. Stay Human.", en: "Build Systems. Stay Human." },
  "home.hero.title1": { ar: "نبني", en: "We Build" },
  "home.hero.title2": { ar: "أنظمة", en: "Systems" },
  "home.hero.title3": { ar: "المستقبل", en: "of the Future" },
  "home.hero.subtitle": { ar: "بنية تحتية رقمية متكاملة للشركات والمؤسسات في العالم العربي", en: "Complete digital infrastructure for businesses and institutions in the Arab world" },
  "home.stats.systems": { ar: "نظام جاهز", en: "Ready Systems" },
  "home.stats.sectors": { ar: "قطاع", en: "Sectors" },
  "home.stats.clients": { ar: "عميل نشط", en: "Active Clients" },
  "home.stats.uptime": { ar: "وقت تشغيل", en: "Uptime" },
  "home.templates.title": { ar: "أنظمتنا", en: "Our Systems" },
  "home.templates.subtitle": { ar: "أنظمة مبنية بمعايير SaaS عالمية", en: "Systems built to global SaaS standards" },
  "home.paths.title": { ar: "مسارات الخدمة", en: "Service Paths" },
  "home.paths.subtitle": { ar: "اختر المسار المناسب لمشروعك", en: "Choose the right path for your project" },
  "home.cta.title": { ar: "جاهز لبناء مشروعك؟", en: "Ready to build your project?" },
  "home.cta.subtitle": { ar: "ابدأ رحلتك الرقمية الآن", en: "Start your digital journey now" },
  "home.orderNow": { ar: "اطلب الآن", en: "Order Now" },
  "home.startFrom": { ar: "يبدأ من", en: "Starting from" },

  "services.badge": { ar: "SERVICES", en: "SERVICES" },
  "services.title": { ar: "خدماتنا", en: "Our Services" },
  "services.titleHighlight": { ar: "المتميزة", en: "Premium" },
  "services.subtitle": { ar: "حلول مصممة خصيصاً لنمو أعمالك. اختر الباقة المناسبة ودعنا نتكفل بالباقي.", en: "Solutions designed specifically for your business growth. Choose the right package and let us handle the rest." },
  "services.duration": { ar: "المدة التقديرية", en: "Estimated Duration" },
  "services.orderService": { ar: "اطلب الخدمة", en: "Order Service" },
  "services.cat.restaurants": { ar: "مطاعم وكافيهات", en: "Restaurants & Cafes" },
  "services.cat.stores": { ar: "متاجر إلكترونية", en: "E-commerce Stores" },
  "services.cat.institutions": { ar: "شركات ومؤسسات", en: "Companies & Institutions" },
  "services.cat.education": { ar: "تعليم", en: "Education" },
  "services.cat.health": { ar: "صحة ولياقة", en: "Health & Fitness" },
  "services.cat.personal": { ar: "شخصي", en: "Personal" },

  "order.step1": { ar: "نوع المشروع", en: "Project Type" },
  "order.step2": { ar: "المتطلبات", en: "Requirements" },
  "order.step3": { ar: "المستندات", en: "Documents" },
  "order.step4": { ar: "الدفع", en: "Payment" },
  "order.step5": { ar: "تأكيد", en: "Confirm" },
  "order.step1.title": { ar: "نوع المشروع والقطاع", en: "Project Type & Sector" },
  "order.step2.title": { ar: "المتطلبات الفنية والنمط", en: "Technical Requirements & Style" },
  "order.step3.title": { ar: "رفع المستندات", en: "Upload Documents" },
  "order.step4.title": { ar: "اختر طريقة الدفع", en: "Choose Payment Method" },
  "order.step5.title": { ar: "ملخص الطلب", en: "Order Summary" },
  "order.serviceLabel": { ar: "الخدمة", en: "Service" },
  "order.projectType": { ar: "نوع المشروع", en: "Project Type" },
  "order.projectTypePlaceholder": { ar: "مثال: تطبيق توصيل", en: "e.g. Delivery App" },
  "order.sector": { ar: "القطاع", en: "Sector" },
  "order.sectorPlaceholder": { ar: "مثال: قطاع التجزئة", en: "e.g. Retail Sector" },
  "order.competitors": { ar: "المنافسين", en: "Competitors" },
  "order.competitorsPlaceholder": { ar: "اذكر أهم المنافسين...", en: "List main competitors..." },
  "order.visualStyle": { ar: "النمط البصري", en: "Visual Style" },
  "order.visualStylePlaceholder": { ar: "مودرن، كلاسيك...", en: "Modern, Classic..." },
  "order.siteLanguage": { ar: "لغة الموقع", en: "Site Language" },
  "order.siteLanguagePlaceholder": { ar: "عربي، إنجليزي...", en: "Arabic, English..." },
  "order.requiredFunctions": { ar: "الوظائف المطلوبة", en: "Required Functions" },
  "order.requiredFunctionsPlaceholder": { ar: "اشرح الوظائف التي تريدها...", en: "Describe the functions you need..." },
  "order.whatsapp": { ar: "ربط واتس", en: "WhatsApp" },
  "order.social": { ar: "ربط سوشيال", en: "Social Media" },
  "order.hasHosting": { ar: "لديه استضافة", en: "Has Hosting" },
  "order.hasDomain": { ar: "لديه دومين", en: "Has Domain" },
  "order.docsNote": { ar: "ارفع الملفات المطلوبة هنا (أو اتركها فارغة للمناقشة لاحقاً)", en: "Upload required files here (or leave empty to discuss later)" },
  "order.logo": { ar: "اللوجو", en: "Logo" },
  "order.brandIdentity": { ar: "الهوية التجارية", en: "Brand Identity" },
  "order.content": { ar: "المحتوى النصي", en: "Text Content" },
  "order.images": { ar: "الصور", en: "Images" },
  "order.video": { ar: "فيديو", en: "Video" },
  "order.accessCredentials": { ar: "بيانات الدخول (اختياري)", en: "Access Credentials (Optional)" },
  "order.accessCredentialsPlaceholder": { ar: "أدخل بيانات الدخول إن وجدت...", en: "Enter access credentials if any..." },
  "order.uploadClick": { ar: "اضغط لرفع ملف", en: "Click to upload a file" },
  "order.uploadedFiles": { ar: "الملفات المرفوعة", en: "Uploaded Files" },
  "order.bankTransfer": { ar: "تحويل بنكي (50% مقدم)", en: "Bank Transfer (50% Deposit)" },
  "order.paypal": { ar: "PayPal (دفع كامل)", en: "PayPal (Full Payment)" },
  "order.bankDetails": { ar: "بيانات الحساب البنكي:", en: "Bank Account Details:" },
  "order.bankNote": { ar: "بنك الراجحي السعودي (بشرط المحول غير راجحي)", en: "Al Rajhi Bank Saudi (condition: transfer not from Rajhi)" },
  "order.receiptLink": { ar: "إيصال التحويل", en: "Transfer Receipt" },
  "order.receiptPlaceholder": { ar: "ارفع صورة الإيصال", en: "Upload receipt image" },
  "order.paypalAmount": { ar: "المبلغ المطلوب", en: "Amount Due" },
  "order.paypalNote": { ar: "سيتم فتح بوابة PayPal للدفع الآمن بالبطاقة أو حساب PayPal", en: "PayPal gateway will open for secure payment via card or PayPal account" },
  "order.paymentMethod": { ar: "طريقة الدفع", en: "Payment Method" },
  "order.startingPrice": { ar: "السعر المبدئي", en: "Starting Price" },
  "order.functionsRequired": { ar: "الوظائف المطلوبة", en: "Required Functions" },
  "order.noDetails": { ar: "لا توجد تفاصيل إضافية", en: "No additional details" },
  "order.prev": { ar: "السابق", en: "Previous" },
  "order.next": { ar: "التالي", en: "Next" },
  "order.confirm": { ar: "تأكيد الطلب", en: "Confirm Order" },
  "order.success": { ar: "تم استلام طلبك بنجاح", en: "Your order has been received successfully" },
  "order.successDesc": { ar: "سيتم التواصل معك قريباً لتأكيد التفاصيل.", en: "We will contact you soon to confirm the details." },
  "order.error": { ar: "حدث خطأ", en: "An error occurred" },
  "order.errorDesc": { ar: "لم نتمكن من إرسال طلبك، حاول مرة أخرى.", en: "We could not send your order, please try again." },
  "order.serviceNotFound": { ar: "الخدمة غير موجودة", en: "Service not found" },
  "order.backToServices": { ar: "العودة للخدمات", en: "Back to Services" },
  "order.sar": { ar: "ر.س", en: "SAR" },

  "partners.badge": { ar: "PARTNERS", en: "PARTNERS" },
  "partners.title1": { ar: "شركاؤنا", en: "Our Partners" },
  "partners.title2": { ar: "في النجاح", en: "in Success" },
  "partners.subtitle": { ar: "نفتخر بثقة عملائنا وشركائنا الذين اختاروا QIROX لبناء أنظمتهم الرقمية", en: "We are proud of the trust of our clients and partners who chose QIROX to build their digital systems" },

  "portfolio.badge": { ar: "Portfolio", en: "Portfolio" },
  "portfolio.title1": { ar: "الأنظمة", en: "Ready" },
  "portfolio.title2": { ar: "الجاهزة", en: "Systems" },
  "portfolio.subtitle": { ar: "أنظمة مبنية بمعايير SaaS عالمية. كل نظام قابل للتخصيص والتوسعة.", en: "Systems built to global SaaS standards. Each system is customizable and extensible." },
  "portfolio.system": { ar: "نظام", en: "system" },
  "portfolio.sectors": { ar: "قطاع", en: "sectors" },
  "portfolio.customizable": { ar: "قابل للتخصيص", en: "customizable" },
  "portfolio.moreFeatures": { ar: "ميزات أخرى", en: "more features" },
  "portfolio.startFrom": { ar: "يبدأ من", en: "Starting from" },
  "portfolio.duration": { ar: "المدة", en: "Duration" },
  "portfolio.orderNow": { ar: "اطلب الآن", en: "Order Now" },
  "portfolio.readyTitle": { ar: "جاهز لبناء", en: "Ready to build" },
  "portfolio.readyHighlight": { ar: "مشروعك", en: "your project" },
  "portfolio.readySubtitle": { ar: "اختر النظام المناسب وابدأ بنيتك التحتية الرقمية.", en: "Choose the right system and start your digital infrastructure." },
  "portfolio.startProject": { ar: "ابدأ مشروعك", en: "Start Your Project" },
  "portfolio.contactUs": { ar: "تواصل معنا", en: "Contact Us" },

  "login.title": { ar: "تسجيل الدخول", en: "Sign In" },
  "login.subtitle": { ar: "مرحباً بك مجدداً، أدخل بياناتك للمتابعة", en: "Welcome back, enter your details to continue" },
  "login.register.title": { ar: "إنشاء حساب جديد", en: "Create New Account" },
  "login.register.subtitle": { ar: "أدخل بياناتك لإنشاء حساب والبدء", en: "Enter your details to create an account and get started" },
  "login.employee.title": { ar: "تسجيل موظف جديد", en: "New Employee Registration" },
  "login.employee.subtitle": { ar: "أكمل بياناتك كموظف للانضمام للمنصة", en: "Complete your details as an employee to join the platform" },
  "login.username": { ar: "اسم المستخدم", en: "Username" },
  "login.password": { ar: "كلمة المرور", en: "Password" },
  "login.confirmPassword": { ar: "تأكيد كلمة المرور", en: "Confirm Password" },
  "login.fullName": { ar: "الاسم الكامل", en: "Full Name" },
  "login.email": { ar: "البريد الإلكتروني", en: "Email" },
  "login.whatsapp": { ar: "رقم الواتساب", en: "WhatsApp Number" },
  "login.country": { ar: "الدولة", en: "Country" },
  "login.businessType": { ar: "نوع النشاط", en: "Business Type" },
  "login.role": { ar: "الدور الوظيفي", en: "Job Role" },
  "login.submit": { ar: "دخول", en: "Sign In" },
  "login.submitRegister": { ar: "إنشاء الحساب", en: "Create Account" },
  "login.processing": { ar: "جاري المعالجة...", en: "Processing..." },
  "login.hasAccount": { ar: "لديك حساب بالفعل؟", en: "Already have an account?" },
  "login.noAccount": { ar: "ليس لديك حساب؟", en: "Don't have an account?" },
  "login.signIn": { ar: "سجل دخولك", en: "Sign In" },
  "login.createAccount": { ar: "أنشئ حساباً جديداً", en: "Create Account" },

  "footer.description": { ar: "بنية تحتية رقمية متكاملة للشركات والمؤسسات في العالم العربي", en: "Complete digital infrastructure for businesses in the Arab world" },
  "footer.quickLinks": { ar: "روابط سريعة", en: "Quick Links" },
  "footer.legal": { ar: "قانوني", en: "Legal" },
  "footer.privacy": { ar: "سياسة الخصوصية", en: "Privacy Policy" },
  "footer.terms": { ar: "الشروط والأحكام", en: "Terms & Conditions" },
  "footer.rights": { ar: "جميع الحقوق محفوظة", en: "All rights reserved" },

  "admin.dashboard": { ar: "لوحة التحكم", en: "Dashboard" },
  "admin.templates": { ar: "إدارة القوالب", en: "Templates Management" },
  "admin.services": { ar: "إدارة الخدمات", en: "Services Management" },
  "admin.orders": { ar: "إدارة الطلبات", en: "Orders Management" },
  "admin.finance": { ar: "الإدارة المالية", en: "Finance" },
  "admin.employees": { ar: "إدارة الموظفين", en: "Employees" },
  "admin.partners": { ar: "إدارة الشركاء", en: "Partners Management" },
  "admin.logout": { ar: "تسجيل خروج", en: "Logout" },

  "common.loading": { ar: "جاري التحميل...", en: "Loading..." },
  "common.save": { ar: "حفظ", en: "Save" },
  "common.cancel": { ar: "إلغاء", en: "Cancel" },
  "common.delete": { ar: "حذف", en: "Delete" },
  "common.edit": { ar: "تعديل", en: "Edit" },
  "common.add": { ar: "إضافة", en: "Add" },
  "common.update": { ar: "تحديث", en: "Update" },
  "common.search": { ar: "بحث", en: "Search" },
  "common.all": { ar: "الكل", en: "All" },
  "common.sar": { ar: "ر.س", en: "SAR" },
  "common.filter": { ar: "تصفية", en: "Filter" },
} as const;

type TranslationKey = keyof typeof translations;

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  dir: "rtl" | "ltr";
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("qirox-lang") as Lang) || "ar";
    }
    return "ar";
  });

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    localStorage.setItem("qirox-lang", lang);
  }, [lang]);

  const t = (key: TranslationKey): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] || entry["ar"] || key;
  };

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export { translations, type TranslationKey, type Lang };
