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

  "home.hero.subtitleFull": { ar: "مصنع الأنظمة الرقمية — نبني بنية تحتية رقمية متكاملة", en: "Digital Systems Factory — Building complete digital infrastructure" },
  "home.startProject": { ar: "ابدأ مشروعك", en: "Start Your Project" },
  "home.exploreSystems": { ar: "استعرض الأنظمة", en: "Explore Systems" },
  "home.promo.new": { ar: "NEW", en: "NEW" },
  "home.promo.text": { ar: "باقة Enterprise متاحة الآن", en: "Enterprise package now available" },

  "home.stats.readySystems": { ar: "أنظمة جاهزة", en: "Ready Systems" },
  "home.stats.sectorsCount": { ar: "قطاعات", en: "Sectors" },
  "home.stats.packages": { ar: "باقات", en: "Packages" },
  "home.stats.locations": { ar: "السعودية ومصر", en: "Saudi Arabia & Egypt" },

  "home.pathfinder.label": { ar: "ابدأ هنا", en: "Start Here" },
  "home.pathfinder.title": { ar: "ابدأ مشروعك الرقمي الآن", en: "Start Your Digital Project Now" },
  "home.pathfinder.desc": { ar: "نحوّل فكرتك إلى نظام رقمي متكامل يعمل من أول يوم. ابدأ بباقة تناسبك واحصل على نظامك خلال أيام.", en: "We transform your idea into a complete digital system that works from day one. Start with a package that suits you and get your system within days." },
  "home.pathfinder.cta": { ar: "ابدأ الآن", en: "Start Now" },
  "home.pathfinder.quickLinks": { ar: "روابط سريعة", en: "Quick Links" },
  "home.pathfinder.systems": { ar: "الأنظمة", en: "Systems" },
  "home.pathfinder.packages": { ar: "الباقات", en: "Packages" },
  "home.pathfinder.aboutPlatform": { ar: "عن المنصة", en: "About Platform" },
  "home.pathfinder.contact": { ar: "تواصل", en: "Contact" },

  "home.carousel.label": { ar: "الأنظمة", en: "Systems" },
  "home.carousel.title": { ar: "أنظمة جاهزة", en: "Ready Systems" },
  "home.carousel.titleHighlight": { ar: "للنشر", en: "to Deploy" },
  "home.carousel.desc": { ar: "أنظمة مصممة بعناية، قابلة للتخصيص الكامل حسب احتياجك. اختر النظام المناسب وابدأ فوراً.", en: "Carefully designed systems, fully customizable to your needs. Choose the right system and start immediately." },

  "home.services.badge": { ar: "المسارات الرئيسية", en: "Main Paths" },
  "home.services.title": { ar: "4 مسارات", en: "4 Specialized" },
  "home.services.titleHighlight": { ar: "خدمية متخصصة", en: "Service Paths" },
  "home.services.subtitle": { ar: "حلول رقمية متكاملة مصممة خصيصاً لتلبي احتياجات عملك", en: "Comprehensive digital solutions designed specifically to meet your business needs" },

  "home.services.restaurants.title": { ar: "المطاعم والكافيهات", en: "Restaurants & Cafes" },
  "home.services.restaurants.desc": { ar: "نظام إدارة متكامل: قائمة طعام إلكترونية، حجوزات، طلبات أونلاين، نظام كاشير، وإدارة مخزون.", en: "Complete management system: digital menu, reservations, online orders, POS system, and inventory management." },
  "home.services.restaurants.f1": { ar: "قائمة QR", en: "QR Menu" },
  "home.services.restaurants.f2": { ar: "نظام طلبات", en: "Order System" },
  "home.services.restaurants.f3": { ar: "إدارة فروع", en: "Branch Management" },
  "home.services.restaurants.f4": { ar: "تقارير مبيعات", en: "Sales Reports" },

  "home.services.stores.title": { ar: "المتاجر والبراندات", en: "Stores & Brands" },
  "home.services.stores.desc": { ar: "متجر إلكتروني احترافي: كتالوج منتجات، سلة مشتريات، بوابات دفع، شحن وتتبع.", en: "Professional e-commerce store: product catalog, shopping cart, payment gateways, shipping and tracking." },
  "home.services.stores.f1": { ar: "متجر إلكتروني", en: "E-commerce Store" },
  "home.services.stores.f2": { ar: "بوابات دفع", en: "Payment Gateways" },
  "home.services.stores.f3": { ar: "تتبع شحن", en: "Shipping Tracking" },
  "home.services.stores.f4": { ar: "تحليلات", en: "Analytics" },

  "home.services.education.title": { ar: "التعليم والتدريب", en: "Education & Training" },
  "home.services.education.desc": { ar: "منصة تعليمية شاملة: دورات، اختبارات، شهادات، بث مباشر، وإدارة طلاب.", en: "Comprehensive educational platform: courses, exams, certificates, live streaming, and student management." },
  "home.services.education.f1": { ar: "منصة دورات", en: "Course Platform" },
  "home.services.education.f2": { ar: "اختبارات", en: "Exams" },
  "home.services.education.f3": { ar: "شهادات", en: "Certificates" },
  "home.services.education.f4": { ar: "بث مباشر", en: "Live Streaming" },

  "home.services.enterprise.title": { ar: "المؤسسات والشركات", en: "Enterprises & Companies" },
  "home.services.enterprise.desc": { ar: "نظام مؤسسي متكامل: إدارة موظفين، مشاريع، مالية، تقارير، وبوابة عملاء.", en: "Complete enterprise system: employee management, projects, finance, reports, and client portal." },
  "home.services.enterprise.f1": { ar: "بوابة عملاء", en: "Client Portal" },
  "home.services.enterprise.f2": { ar: "إدارة مشاريع", en: "Project Management" },
  "home.services.enterprise.f3": { ar: "نظام مالي", en: "Financial System" },
  "home.services.enterprise.f4": { ar: "تقارير ذكية", en: "Smart Reports" },

  "home.why.badge": { ar: "لماذا نحن", en: "Why Us" },
  "home.why.title": { ar: "لماذا", en: "Why" },
  "home.why.scalable.title": { ar: "بنية قابلة للتوسع", en: "Scalable Architecture" },
  "home.why.scalable.desc": { ar: "أنظمة مبنية بطريقة ذكية تنمو مع نمو مشروعك بدون قيود.", en: "Smartly built systems that grow with your project without limitations." },
  "home.why.design.title": { ar: "تصميم يعبّر عنك", en: "Design That Represents You" },
  "home.why.design.desc": { ar: "هوية بصرية فريدة تعكس شخصية علامتك التجارية وتميّزك عن المنافسين.", en: "Unique visual identity that reflects your brand personality and sets you apart from competitors." },
  "home.why.support.title": { ar: "دعم مستمر", en: "Continuous Support" },
  "home.why.support.desc": { ar: "فريق متخصص يرافقك من البداية حتى بعد الإطلاق لضمان نجاح مشروعك.", en: "A dedicated team that accompanies you from start to post-launch to ensure your project's success." },
  "home.why.security.title": { ar: "حماية متكاملة", en: "Comprehensive Security" },
  "home.why.security.desc": { ar: "أمان على أعلى مستوى لحماية بيانات عملائك ومعاملاتك.", en: "Top-level security to protect your clients' data and transactions." },

  "home.spotlight.title": { ar: "ابدأ مشروعك الآن", en: "Start Your Project Now" },
  "home.spotlight.desc": { ar: "نحوّل فكرتك إلى نظام رقمي متكامل يعمل من أول يوم.", en: "We transform your idea into a complete digital system that works from day one." },
  "home.spotlight.cta": { ar: "ابدأ مشروعك", en: "Start Your Project" },
  "home.spotlight.prices": { ar: "الباقات والأسعار", en: "Packages & Pricing" },
  "home.spotlight.riyadh": { ar: "الرياض", en: "Riyadh" },
  "home.spotlight.cairo": { ar: "القاهرة", en: "Cairo" },

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
