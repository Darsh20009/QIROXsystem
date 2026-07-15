import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

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
  "nav.startProject": { ar: "ابدأ فكرتك الخاصة", en: "Start Your Idea" },

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
  "home.startProject": { ar: "ابدأ فكرتك الخاصة", en: "Start Your Own Idea" },
  "home.exploreSystems": { ar: "استعرض الأنظمة", en: "Explore Systems" },
  "home.promo.new": { ar: "NEW", en: "NEW" },
  "home.promo.text": { ar: "باقة Enterprise متاحة الآن", en: "Enterprise package now available" },

  "home.stats.readySystems": { ar: "أنظمة جاهزة", en: "Ready Systems" },
  "home.stats.sectorsCount": { ar: "قطاعات", en: "Sectors" },
  "home.stats.packages": { ar: "باقات", en: "Packages" },
  "home.stats.locations": { ar: "السعودية ومصر", en: "Saudi Arabia & Egypt" },

  "home.pathfinder.label": { ar: "ابدأ هنا", en: "Start Here" },
  "home.pathfinder.title": { ar: "ابدأ فكرتك الخاصة الآن", en: "Start Your Own Idea Now" },
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

  "home.spotlight.title": { ar: "ابدأ فكرتك الخاصة الآن", en: "Start Your Own Idea Now" },
  "home.spotlight.desc": { ar: "نحوّل فكرتك إلى نظام رقمي متكامل يعمل من أول يوم.", en: "We transform your idea into a complete digital system that works from day one." },
  "home.spotlight.cta": { ar: "ابدأ فكرتك الخاصة", en: "Start Your Own Idea" },
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
  "portfolio.startProject": { ar: "ابدأ فكرتك الخاصة", en: "Start Your Own Idea" },
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

  // About page
  "about.badge": { ar: "عن Qirox", en: "About Qirox" },
  "about.hero.title1": { ar: "نحن لا نبني مواقع.", en: "We don't build websites." },
  "about.hero.title2": { ar: "نحن نبني بنية تحتية.", en: "We build infrastructure." },
  "about.hero.subtitle": { ar: "QIROX منصة تقنية متكاملة لتوليد وإدارة الأنظمة الرقمية. نحول أفكار العملاء إلى منصات قابلة للتوسع والتطوير المستمر.", en: "QIROX is a comprehensive tech platform for generating and managing digital systems. We transform client ideas into scalable and continuously evolving platforms." },
  "about.features.badge": { ar: "المميزات", en: "Features" },
  "about.features.title": { ar: "ما يميزنا عن", en: "What sets us apart from" },
  "about.features.titleHighlight": { ar: "أي شركة أخرى", en: "any other company" },
  "about.sectors.badge": { ar: "القطاعات", en: "Sectors" },
  "about.sectors.title": { ar: "القطاعات التي نخدمها", en: "Sectors We Serve" },
  "about.tech.badge": { ar: "البنية التقنية", en: "Tech Stack" },
  "about.tech.title": { ar: "البنية التقنية", en: "Technical Architecture" },
  "about.business.badge": { ar: "نموذج الأعمال", en: "Business Model" },
  "about.business.title": { ar: "نموذج الأعمال", en: "Business Model" },
  "about.cta.title": { ar: "هل أنت مستعد للبدء؟", en: "Ready to Get Started?" },
  "about.cta.subtitle": { ar: "سواء كنت عميل أو مستثمر، نحن جاهزون لبناء المستقبل الرقمي معاً.", en: "Whether you're a client or investor, we're ready to build the digital future together." },
  "about.cta.systems": { ar: "استعرض أنظمتنا", en: "View Our Systems" },
  "about.cta.contact": { ar: "تواصل معنا", en: "Contact Us" },
  "about.systems.count": { ar: "نظام متكامل يغطي أهم القطاعات", en: "complete systems covering the most important sectors" },

  // Prices page
  "prices.badge": { ar: "الباقات والأسعار", en: "Plans & Pricing" },
  "prices.hero.title": { ar: "اختر الباقة", en: "Choose the Plan" },
  "prices.hero.titleHighlight": { ar: "المناسبة", en: "That Fits You" },
  "prices.hero.subtitle": { ar: "أسعار واضحة بدون رسوم مخفية — كل باقة تشمل تصميماً احترافياً ودعماً فنياً مستمراً", en: "Transparent pricing with no hidden fees — every plan includes professional design and continuous technical support" },
  "prices.popular": { ar: "الأكثر طلباً", en: "Most Popular" },
  "prices.offerNow": { ar: "عرض الآن", en: "Offer Now" },
  "prices.per.once": { ar: "مرة واحدة", en: "one-time" },
  "prices.per.monthly": { ar: "شهرياً", en: "monthly" },
  "prices.per.yearly": { ar: "سنوياً", en: "yearly" },
  "prices.select": { ar: "اختر هذه الباقة", en: "Select This Plan" },
  "prices.contact": { ar: "تواصل معنا", en: "Contact Us" },
  "prices.addons.label": { ar: "إضافات متاحة", en: "Available Add-ons" },
  "prices.domains.badge": { ar: "النطاقات والإضافات", en: "Domains & Add-ons" },
  "prices.domains.title": { ar: "أسعار الدومينات", en: "Domain Pricing" },
  "prices.domains.subtitle": { ar: "متاحة كإضافة مع أي باقة — بأسعار تفضيلية خلال العرض الحالي", en: "Available as an add-on with any plan — at preferential prices during the current offer" },
  "prices.localDomain.title": { ar: "دومين سعودي محلي", en: "Saudi Local Domain" },
  "prices.globalDomain.title": { ar: "دومين عالمي", en: "Global Domain" },
  "prices.limited": { ar: "لفترة محدودة", en: "Limited time" },
  "prices.custom.title": { ar: "تحتاج حلاً مخصصاً؟", en: "Need a Custom Solution?" },
  "prices.custom.subtitle": { ar: "تواصل معنا وسنبني لك ما تحتاجه بالضبط — بأي تصميم وأي ميزات", en: "Contact us and we'll build exactly what you need — any design, any features" },
  "prices.custom.cta": { ar: "طلب عرض سعر", en: "Request a Quote" },
  "prices.sar": { ar: "ر.س", en: "SAR" },
  "prices.year": { ar: "/ سنة", en: "/ year" },

  "news.badge":     { ar: "آخر الأخبار والتحديثات",                          en: "Latest News & Updates" },
  "news.title":     { ar: "أخبار QIROX",                                      en: "QIROX News" },
  "news.subtitle":  { ar: "ابق على اطلاع بأحدث المستجدات والإطلاقات",         en: "Stay up to date with the latest updates and launches" },
  "news.readMore":  { ar: "اقرأ المزيد",                                       en: "Read More" },
  "news.empty":     { ar: "لا توجد أخبار حالياً",                              en: "No news available" },
  "news.emptyMsg":  { ar: "سيتم نشر التحديثات والأخبار هنا قريباً",            en: "Updates and news will be published here soon" },
  "news.close":     { ar: "إغلاق",                                             en: "Close" },

  "devices.title":      { ar: "المنتجات والأجهزة",        en: "Products & Devices" },
  "devices.subtitle":   { ar: "اختر المنتج المناسب لمشروعك", en: "Choose the right product for your project" },
  "devices.search":     { ar: "ابحث عن منتج...",           en: "Search products..." },
  "devices.addToCart":  { ar: "أضف للسلة",                 en: "Add to Cart" },
  "devices.buyNow":     { ar: "اشتري الآن",                 en: "Buy Now" },
  "devices.inCart":     { ar: "في السلة",                  en: "In Cart" },
  "devices.all":        { ar: "الكل",                      en: "All" },
  "devices.empty":      { ar: "لا توجد منتجات",            en: "No products found" },

  "common.close":       { ar: "إغلاق",          en: "Close" },
  "common.confirm":     { ar: "تأكيد",          en: "Confirm" },
  "common.back":        { ar: "رجوع",           en: "Back" },
  "common.next":        { ar: "التالي",         en: "Next" },
  "common.prev":        { ar: "السابق",         en: "Previous" },
  "common.send":        { ar: "إرسال",          en: "Send" },
  "common.view":        { ar: "عرض",            en: "View" },
  "common.yes":         { ar: "نعم",            en: "Yes" },
  "common.no":          { ar: "لا",             en: "No" },
  "common.required":    { ar: "مطلوب",          en: "Required" },
  "common.optional":    { ar: "اختياري",        en: "Optional" },
  "common.success":     { ar: "تم بنجاح",       en: "Success" },
  "common.error":       { ar: "حدث خطأ",        en: "An error occurred" },
  "common.noData":      { ar: "لا توجد بيانات", en: "No data available" },

  "dsv2.nav.services": { ar: "الخدمات", en: "Services" },
  "dsv2.nav.portfolio": { ar: "الأنظمة الجاهزة", en: "Ready Systems" },
  "dsv2.nav.contact": { ar: "تواصل معنا", en: "Contact Us" },
  "dsv2.nav.dashboard": { ar: "لوحة التحكم", en: "Dashboard" },
  "dsv2.nav.login": { ar: "دخول", en: "Login" },
  "dsv2.nav.startProject": { ar: "ابدأ مشروعك", en: "Start Project" },
  
  "dsv2.hero.badge": { ar: "مصنع الأنظمة الرقمية", en: "DIGITAL SYSTEMS FACTORY" },
  "dsv2.hero.title1": { ar: "نصمم", en: "We Design" },
  "dsv2.hero.title2": { ar: "ونشحن", en: "and Ship" },
  "dsv2.hero.title3": { ar: "أنظمة للإنتاج", en: "Production Systems" },
  "dsv2.hero.subtitle": { ar: "أنظمة جاهزة للإنتاج، ومتاجر إلكترونية، ومنصات مؤسسية. مصممة كمنتجات SaaS احترافية، وليست مشاريع مخصصة لمرة واحدة. هندسة دقيقة لشركات المستقبل.", en: "Production-ready systems, e-commerce stores, and institutional platforms. Built as polished SaaS products, not custom one-offs. Precision engineering for the companies of the future." },
  "dsv2.hero.cta": { ar: "ابدأ مشروعك", en: "Start Your Project" },
  "dsv2.hero.secondaryCta": { ar: "استكشف الأنظمة", en: "Explore Systems" },

  "dsv2.services.badge": { ar: "الخدمات الهندسية", en: "ENGINEERING SERVICES" },
  "dsv2.services.title": { ar: "خبرة هندسية عند الطلب", en: "Engineering Expertise, On Demand" },
  "dsv2.services.subtitle": { ar: "من الاستشارة إلى التسليم، فرق متخصصة تبني وتدير أنظمتك التقنية بدقة.", en: "From consulting to delivery, specialized teams build and run your technical systems with precision." },
  "dsv2.services.customQuote": { ar: "تسعير مخصص", en: "Custom Quote" },
  "dsv2.services.order": { ar: "اطلب الخدمة", en: "Request Service" },
  
  "dsv2.portfolio.badge": { ar: "أعمالنا", en: "PORTFOLIO" },
  "dsv2.portfolio.title": { ar: "أنظمة حية تعمل الآن", en: "Live Systems in Action" },
  "dsv2.portfolio.subtitle": { ar: "قوالب وأنظمة مخصصة للقطاعات جاهزة للعمل. استعرض إمكانيات الأنظمة الحية التي تعمل في السوق اليوم.", en: "Sector-specific templates and systems ready for deployment. Explore the capabilities of live systems powering the market today." },
  "dsv2.portfolio.viewDemo": { ar: "عرض النظام المباشر", en: "View Live Demo" },
  "dsv2.portfolio.liveDemo": { ar: "تجربة حية", en: "Live Demo" },
  
  "dsv2.tech.badge": { ar: "البنية التقنية", en: "TECHNOLOGY STACK" },
  "dsv2.tech.title": { ar: "بنية تحتية هندسية صارمة", en: "Rigorous Engineering Infrastructure" },
  "dsv2.tech.subtitle": { ar: "تم بناء أنظمتنا على أحدث التقنيات لضمان السرعة، وقابلية التوسع، وتجربة مستخدم ممتازة في اللغتين العربية والإنجليزية.", en: "Our systems are built on modern technologies to ensure speed, scalability, and an excellent user experience in both Arabic and English." },
  "dsv2.tech.desc": { ar: "نعتمد على تقنيات أثبتت جدارتها في الإنتاج، مع تكامل كامل مع بوابات الدفع المحلية في السعودية كـ مدى، stc pay، أبل باي، تمارا، وتابي. بنية تحتية ثنائية اللغة تدعم العربية من الأساس وليس كإضافة ثانوية.", en: "We rely on production-proven technologies, fully integrated with local Saudi payment gateways like Mada, stc pay, Apple Pay, Tamara, and Tabby. A bilingual infrastructure natively supporting Arabic, not as an afterthought." },
  
  "dsv2.cta.badge": { ar: "اتصل بنا", en: "CONTACT US" },
  "dsv2.cta.title": { ar: "جاهز لبناء بنية تحتية رقمية؟", en: "Ready to build a digital infrastructure?" },
  "dsv2.cta.subtitle": { ar: "تواصل معنا لمناقشة متطلبات مشروعك، أو احصل على وصول فوري لأحد أنظمتنا الجاهزة.", en: "Contact us to discuss your project requirements, or get instant access to one of our ready systems." },
  "dsv2.cta.contact": { ar: "تواصل معنا الآن", en: "Contact Us Now" },
  
  "dsv2.footer.description": { ar: "شركة سعودية هندسية لبناء برمجيات على مستوى المؤسسات وأنظمة للشركات الحديثة.", en: "Saudi engineering company building enterprise-grade software and systems for modern businesses." },
  "dsv2.footer.rights": { ar: "جميع الحقوق محفوظة", en: "All rights reserved" },
  "dsv2.footer.legal": { ar: "قانوني", en: "Legal" },
  "dsv2.footer.privacy": { ar: "سياسة الخصوصية", en: "Privacy Policy" },
  "dsv2.footer.terms": { ar: "الشروط والأحكام", en: "Terms & Conditions" },
  "dsv2.footer.contact": { ar: "تواصل", en: "Contact" },

  // Landing V2
  "v2.hero.badge": { ar: "مصنع الأنظمة الرقمية", en: "DIGITAL SYSTEMS FACTORY" },
  "v2.hero.title1": { ar: "نبني", en: "We Build" },
  "v2.hero.title2": { ar: "المستقبل الرقمي", en: "The Digital Future" },
  "v2.hero.subtitle": { ar: "لا نصنع مجرد مواقع، بل نبني بنية تحتية تقنية متكاملة تنطلق بأعمالك نحو آفاق جديدة خلال أيام.", en: "We don't just build websites, we build complete technical infrastructure that launches your business to new horizons in days." },
  "v2.hero.cta": { ar: "ابدأ رحلتك", en: "Start Your Journey" },
  "v2.hero.secondaryCta": { ar: "استكشف الأنظمة", en: "Explore Systems" },

  "v2.story.badge": { ar: "رؤيتنا", en: "OUR VISION" },
  "v2.story.title": { ar: "نحن هنا لتمكينك", en: "We are here to empower you" },
  "v2.story.p1": { ar: "نعلم أن الانتقال للعالم الرقمي قد يكون معقداً، لذلك صممنا كيروكس ليكون شريكك التقني الذي يزيل عنك العبء، لتركز أنت على نمو أعمالك وتحقيق طموحاتك.", en: "We know transitioning to digital can be complex. That's why we designed QIROX to be your tech partner, removing the burden so you can focus on growing your business and achieving your ambitions." },
  
  "v2.services.badge": { ar: "خدماتنا", en: "OUR SERVICES" },
  "v2.services.title": { ar: "أنظمة متكاملة", en: "Complete Systems" },
  "v2.services.subtitle": { ar: "حلول تقنية مصممة لتلائم مختلف القطاعات بكفاءة وأمان.", en: "Tech solutions designed to fit various sectors efficiently and securely." },
  "v2.services.ecommerce": { ar: "المتاجر الإلكترونية", en: "E-Commerce" },
  "v2.services.ecommerce.desc": { ar: "نظام متكامل لإدارة المبيعات والمخزون بسلاسة.", en: "Complete system for seamless sales and inventory management." },
  "v2.services.restaurant": { ar: "المطاعم والمقاهي", en: "Restaurants & Cafes" },
  "v2.services.restaurant.desc": { ar: "نظام نقاط البيع والطلبات الذكية عبر رمز الاستجابة السريعة.", en: "POS system and smart QR orders." },
  "v2.services.corporate": { ar: "الشركات والمؤسسات", en: "Corporate" },
  "v2.services.corporate.desc": { ar: "بوابة رقمية تعكس احترافية أعمالك وتسهل تواصلك مع العملاء.", en: "Digital portal reflecting your professionalism and facilitating client communication." },

  "v2.portfolio.badge": { ar: "أعمالنا", en: "OUR WORK" },
  "v2.portfolio.title": { ar: "بصمتنا الرقمية", en: "Our Digital Footprint" },
  "v2.portfolio.subtitle": { ar: "استعرض مجموعة من الأنظمة التي بنيناها بشغف واحترافية.", en: "Browse a selection of systems we built with passion and professionalism." },
  "v2.portfolio.viewAll": { ar: "جميع الأنظمة", en: "View All Systems" },

  "v2.journey.badge": { ar: "رحلتك معنا", en: "YOUR JOURNEY" },
  "v2.journey.title": { ar: "من الفكرة إلى الإطلاق", en: "From Idea to Launch" },
  "v2.journey.subtitle": { ar: "خطوات واضحة ومدروسة لضمان نجاح مشروعك بأعلى معايير الجودة.", en: "Clear and considered steps to ensure the success of your project with the highest quality standards." },
  "v2.journey.step1": { ar: "اكتشاف الاحتياجات", en: "Discover Needs" },
  "v2.journey.step1.desc": { ar: "نجلس معك لفهم رؤيتك وأهدافك بدقة.", en: "We sit with you to understand your vision and goals precisely." },
  "v2.journey.step2": { ar: "التصميم والبناء", en: "Design & Build" },
  "v2.journey.step2.desc": { ar: "نحول الفكرة إلى واقع باستخدام أحدث التقنيات.", en: "We turn the idea into reality using the latest technologies." },
  "v2.journey.step3": { ar: "الإطلاق والنمو", en: "Launch & Grow" },
  "v2.journey.step3.desc": { ar: "نرافقك في الانطلاق ونقدم دعماً مستمراً لضمان نجاحك.", en: "We accompany you at launch and provide continuous support to ensure success." },

  "v2.stats.delivered": { ar: "نظام أُطلق بنجاح", en: "Systems Launched" },
  "v2.stats.clients": { ar: "عميل يثق بنا", en: "Trusting Clients" },
  "v2.stats.sectors": { ar: "قطاعات نخدمها", en: "Sectors Served" },
  "v2.stats.uptime": { ar: "استقرار وثبات", en: "Uptime Stability" },

  "v2.timeline.badge": { ar: "مسار العمل", en: "WORKFLOW" },
  "v2.timeline.title": { ar: "نعمل بشفافية وسرعة", en: "We Work Transparently & Fast" },
  "v2.timeline.subtitle": { ar: "نلتزم بجداول زمنية دقيقة لتقديم مشاريع ذات قيمة حقيقية وفي وقت قياسي.", en: "We adhere to precise timelines to deliver projects of real value in record time." },

  "v2.testimonials.badge": { ar: "آراء العملاء", en: "TESTIMONIALS" },
  "v2.testimonials.title": { ar: "شركاء النجاح", en: "Partners in Success" },
  "v2.testimonials.subtitle": { ar: "أصوات من وثقوا بنا لنكون جزءاً من قصتهم.", en: "Voices of those who trusted us to be part of their story." },

  "v2.pricing.badge": { ar: "الاستثمار", en: "INVESTMENT" },
  "v2.pricing.title": { ar: "قيمة حقيقية لأعمالك", en: "Real Value for Your Business" },
  "v2.pricing.subtitle": { ar: "اختر الباقة التي تتناسب مع طموحاتك وميزانيتك بأسعار واضحة وبدون رسوم خفية.", en: "Choose the package that fits your ambitions and budget with clear prices and no hidden fees." },
  "v2.pricing.viewAll": { ar: "عرض كل الباقات", en: "View All Packages" },

  "v2.cta.title": { ar: "هل أنت مستعد لتغيير قواعد اللعبة؟", en: "Ready to Change the Game?" },
  "v2.cta.subtitle": { ar: "لا تدع المنافسين يسبقونك. ابدأ في بناء نظامك الرقمي اليوم ودعنا نكون شركاء نجاحك.", en: "Don't let competitors outpace you. Start building your digital system today and let us be your partners in success." },
  "v2.cta.primary": { ar: "ابدأ مشروعك الآن", en: "Start Your Project Now" },
  "v2.cta.contact": { ar: "تواصل مع المبيعات", en: "Contact Sales" },

  // Portfolio items
  "v2.portfolio.sys1.name": { ar: "فود فلو كاشير", en: "FoodFlow POS" },
  "v2.portfolio.sys1.tag": { ar: "مطاعم", en: "Restaurant" },
  "v2.portfolio.sys2.name": { ar: "ستور ماكس", en: "StoreMax E-Com" },
  "v2.portfolio.sys2.tag": { ar: "تجزئة", en: "Retail" },
  "v2.portfolio.sys3.name": { ar: "بوابة كورب داش", en: "CorpDash Portal" },
  "v2.portfolio.sys3.tag": { ar: "شركات", en: "Corporate" },

  // Timeline items
  "v2.timeline.m1.year": { ar: "اليوم الأول", en: "Day 1" },
  "v2.timeline.m1.title": { ar: "الاستكشاف والتحليل", en: "Kickoff & Discovery" },
  "v2.timeline.m1.desc": { ar: "نرسم معمارية النظام ونحدد المتطلبات.", en: "We map out the architecture and define requirements." },
  "v2.timeline.m2.year": { ar: "اليوم الثالث", en: "Day 3" },
  "v2.timeline.m2.title": { ar: "اعتماد التصميم", en: "Design Sign-off" },
  "v2.timeline.m2.desc": { ar: "اعتماد الواجهات البصرية وتجربة المستخدم.", en: "Visuals and UX approved." },
  "v2.timeline.m3.year": { ar: "اليوم العاشر", en: "Day 10" },
  "v2.timeline.m3.title": { ar: "اكتمال التطوير", en: "Development Complete" },
  "v2.timeline.m3.desc": { ar: "بناء واختبار المحرك الأساسي للنظام.", en: "Core engine built and tested." },
  "v2.timeline.m4.year": { ar: "اليوم الرابع عشر", en: "Day 14" },
  "v2.timeline.m4.title": { ar: "الإطلاق", en: "Launch" },
  "v2.timeline.m4.desc": { ar: "أنظمتك تعمل وتستقبل العملاء.", en: "Systems live and operational." },

  // Testimonials
  "v2.test.1.name": { ar: "أحمد الفهد", en: "Ahmed Al-Fahad" },
  "v2.test.1.role": { ar: "المدير التنفيذي، فود فلو", en: "CEO, FoodFlow Arabia" },
  "v2.test.1.content": { ar: "لم يبنِ لنا QIROX نظاماً وحسب؛ بل غيّروا طريقة عملنا بالكامل. السرعة والجودة فاقتا توقعاتنا.", en: "QIROX didn't just build us a system; they transformed our operations. The speed and quality were beyond our expectations." },
  "v2.test.2.name": { ar: "سارة منصور", en: "Sarah Mansour" },
  "v2.test.2.role": { ar: "مؤسسة، لوكس بيوتي", en: "Founder, Luxe Beauty" },
  "v2.test.2.content": { ar: "تجربة مميزة من اليوم الأول. الفريق يفهم احتياجات الأعمال بعمق، وليس فقط البرمجة.", en: "A truly premium experience from day one. The team understands business needs deeply, not just code." },
  "v2.test.3.name": { ar: "عمر يوسف", en: "Omar Youssef" },
  "v2.test.3.role": { ar: "مدير، بيلد كورب", en: "Director, BuildCorp" },
  "v2.test.3.content": { ar: "أطلقنا بوابتنا المؤسسية خلال 10 أيام. قابلية التوسع والمعمارية القوية تمنحنا راحة البال.", en: "We launched our corporate portal in 10 days. The scalability and robust architecture give us peace of mind." },

  // Pricing Experience
  "v2.pricing.card.badge": { ar: "الأكثر طلباً", en: "POPULAR" },
  "v2.pricing.card.title": { ar: "نظام برو", en: "Pro System" },
  "v2.pricing.card.desc": { ar: "بنية تحتية رقمية متكاملة", en: "Complete digital infrastructure" },
  "v2.pricing.card.price": { ar: "٤,٩٩٩ ر.س", en: "SAR 4,999" },
  "v2.pricing.card.period": { ar: " / مرة واحدة", en: " / one-time" },
  "v2.pricing.card.f1": { ar: "تطبيق ويب مخصص", en: "Custom Web App" },
  "v2.pricing.card.f2": { ar: "لوحة تحكم للمديرين", en: "Admin Dashboard" },
  "v2.pricing.card.f3": { ar: "ربط برمجي (API)", en: "API Integration" },
  "v2.pricing.card.f4": { ar: "أولوية في الدعم الفني", en: "Priority Support" },
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

  /* ── Auto-switch language when country changes ── */
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { country?: string; lang?: string } | null;
      const newLang = detail?.lang as Lang | undefined;
      if (newLang === "ar" || newLang === "en") setLang(newLang);
    };
    window.addEventListener("qirox-country-change", handler);
    return () => window.removeEventListener("qirox-country-change", handler);
  }, []);

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

/* ─── AI Translation Cache (in-memory + localStorage) ─── */
const AI_CACHE_KEY = "qirox_ai_translations_v1";

function loadAICache(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(AI_CACHE_KEY) || "{}");
  } catch { return {}; }
}

function saveAICache(cache: Record<string, string>) {
  try { localStorage.setItem(AI_CACHE_KEY, JSON.stringify(cache)); } catch {}
}

const _aiCacheMemory: Record<string, string> = {};

/**
 * useAITranslate — translate any arbitrary text using the AI endpoint.
 * Returns { translated, isLoading, translate }.
 * Results are cached in localStorage to avoid repeated API calls.
 */
export function useAITranslate() {
  const { lang } = useI18n();

  const translate = useCallback(async (
    text: string,
    context?: string
  ): Promise<string> => {
    if (!text || lang === "ar") return text; // Arabic is default, no translation needed
    const cacheKey = `${lang}:${text}`;
    if (_aiCacheMemory[cacheKey]) return _aiCacheMemory[cacheKey];
    const stored = loadAICache();
    if (stored[cacheKey]) {
      _aiCacheMemory[cacheKey] = stored[cacheKey];
      return stored[cacheKey];
    }
    try {
      const res = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLang: lang, context }),
      });
      const data = await res.json();
      const translated = data.translated || text;
      _aiCacheMemory[cacheKey] = translated;
      const updatedCache = loadAICache();
      updatedCache[cacheKey] = translated;
      saveAICache(updatedCache);
      return translated;
    } catch { return text; }
  }, [lang]);

  return { translate, lang };
}

/**
 * useDynamicText — a hook that auto-translates a given Arabic text to the current language.
 * Pass the Arabic source text; it returns the translated string.
 */
export function useDynamicText(arabicText: string, context?: string): string {
  const { lang } = useI18n();
  const [translated, setTranslated] = useState(arabicText);
  const { translate } = useAITranslate();

  useEffect(() => {
    if (lang === "ar") { setTranslated(arabicText); return; }
    translate(arabicText, context).then(setTranslated);
  }, [arabicText, lang, context]);

  return translated;
}

export { translations, type TranslationKey, type Lang };
