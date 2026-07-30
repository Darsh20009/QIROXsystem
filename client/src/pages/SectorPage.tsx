import { useRef, useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { useSEO } from "@/hooks/use-seo";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import type { Partner } from "@shared/schema";
import {
  ShoppingBag, Coffee, Building2, Heart, Home as HomeIcon,
  Scissors, ArrowLeft, ArrowRight, Check, Shield, Headphones,
  Star, Zap, ChevronRight, ExternalLink, Globe,
  ShoppingCart, BarChart3, Users, Package, CreditCard, QrCode,
  Monitor, Truck, ChefHat, Calendar, FileText, Stethoscope,
  Key, MapPin, Camera, Bell, Lock, Smartphone, Settings, Wifi,
  TrendingUp, Clock, Award, Target, MessageSquare,
  GraduationCap, Bot,
} from "lucide-react";

// ─── Sector master data ───────────────────────────────────────────────────────

const SECTOR_DATA: Record<string, {
  slug: string;
  img: string;
  icon: React.ElementType;
  arName: string;
  enName: string;
  arShortDesc: string;
  enShortDesc: string;
  arHeroTitle: string;
  enHeroTitle: string;
  arHeroSub: string;
  enHeroSub: string;
  segment: string;
  features: Array<{ icon: React.ElementType; arTitle: string; enTitle: string; arDesc: string; enDesc: string }>;
  whyQirox: Array<{ arTitle: string; enTitle: string; arDesc: string; enDesc: string }>;
  guarantee: Array<{ icon: React.ElementType; arLabel: string; enLabel: string; arDesc: string; enDesc: string }>;
  seoKeywords: string;
}> = {
  ecommerce: {
    slug: "ecommerce",
    img: "/sectors/ecommerce.jpg",
    icon: ShoppingBag,
    arName: "المتاجر",
    enName: "E-Commerce",
    arShortDesc: "منصة متكاملة لإدارة المنتجات والمبيعات والشحن",
    enShortDesc: "Full platform for products, sales and shipping",
    arHeroTitle: "متجرك الإلكتروني\nالمثالي",
    enHeroTitle: "Your Perfect\nOnline Store",
    arHeroSub: "نبني لك منصة بيع احترافية بكل تفصيلة تحتاجها — من صفحة المنتج حتى التسليم للعميل.",
    enHeroSub: "We build your professional e-commerce platform with every detail you need — from product page to customer delivery.",
    segment: "ecommerce",
    seoKeywords: "متجر إلكتروني, تصميم متجر, برمجة متجر سعودي, نظام متجر, كيروكس متجر إلكتروني, e-commerce saudi",
    features: [
      { icon: ShoppingCart, arTitle: "إدارة المنتجات والفئات", enTitle: "Product & Category Management", arDesc: "أضف آلاف المنتجات مع صور ومتغيرات وأوزان وأسعار متعددة بسهولة تامة.", enDesc: "Add thousands of products with images, variants, weights and multiple prices with ease." },
      { icon: CreditCard, arTitle: "بوابات دفع سعودية متكاملة", enTitle: "Saudi Payment Gateways", arDesc: "ماستركارد، فيزا، أبل باي، مدى، تابي، تمارا — كلها جاهزة في نظامك.", enDesc: "Mastercard, Visa, Apple Pay, Mada, Tabby, Tamara — all ready in your system." },
      { icon: Truck, arTitle: "ربط مع شركات الشحن", enTitle: "Shipping Integration", arDesc: "أرامكس، سمسا، جاهز، SMSA — ربط مباشر لإنشاء بوليصات الشحن لحظياً.", enDesc: "Aramex, SMSA, Jahiz — direct integration for instant waybill creation." },
      { icon: BarChart3, arTitle: "لوحة تحكم تحليلية متقدمة", enTitle: "Advanced Analytics Dashboard", arDesc: "تقارير المبيعات اليومية، المنتجات الأعلى مبيعاً، معدل التحويل، وأداء الحملات.", enDesc: "Daily sales reports, top products, conversion rates and campaign performance." },
      { icon: Bell, arTitle: "إشعارات العملاء الذكية", enTitle: "Smart Customer Notifications", arDesc: "إشعارات واتساب + بريد إلكتروني عند الطلب، الشحن، والتسليم — تلقائياً.", enDesc: "WhatsApp + email notifications on order, shipping, delivery — fully automated." },
      { icon: Target, arTitle: "نظام كوبونات وعروض", enTitle: "Coupons & Promotions System", arDesc: "أنشئ عروضاً بالنسبة أو القيمة، لفئات محددة، أو لعملاء مميزين فقط.", enDesc: "Create percentage or fixed-value promotions for specific categories or VIP customers." },
    ],
    whyQirox: [
      { arTitle: "لا رسوم معاملات", enTitle: "Zero Transaction Fees", arDesc: "معظم المنافسين يأخذون 1–3% من كل بيعة. عندنا: صفر. كل ريال ربحته يبقى لك.", enDesc: "Most competitors take 1–3% per sale. With us: zero. Every riyal you earn stays yours." },
      { arTitle: "تصميم هويتك — مش قالب جاهز", enTitle: "Your Brand, Not a Template", arDesc: "لا قوالب متكررة. نبني واجهة متجرك من الصفر لتعكس هويتك التجارية الفريدة.", enDesc: "No repeated templates. We build your store interface from scratch to reflect your unique brand." },
      { arTitle: "دعم فني متخصص في التجارة الإلكترونية", enTitle: "E-Commerce Specialized Support", arDesc: "فريقنا يفهم التجارة الإلكترونية السعودية — من VAT حتى نظام حماية المستهلك.", enDesc: "Our team understands Saudi e-commerce — from VAT to consumer protection regulations." },
    ],
    guarantee: [
      { icon: Shield, arLabel: "ضمان جودة 90 يوم", enLabel: "90-Day Quality Guarantee", arDesc: "أي خطأ بعد التسليم، نصلحه مجاناً خلال 24 ساعة.", enDesc: "Any bug after delivery, we fix it free within 24 hours." },
      { icon: Headphones, arLabel: "دعم 24/7 بالعربي", enLabel: "24/7 Arabic Support", arDesc: "واتساب + تذاكر دعم. نرد في أقل من ساعة في أوقات العمل.", enDesc: "WhatsApp + support tickets. We reply in under an hour during working hours." },
      { icon: Zap, arLabel: "تسليم خلال 21 يوم", enLabel: "Delivery in 21 Days", arDesc: "تسليم كامل المشروع خلال 21 يوم عمل — مضمون في العقد.", enDesc: "Full project delivery within 21 working days — guaranteed in the contract." },
      { icon: TrendingUp, arLabel: "تحديثات مجانية سنة", enLabel: "Free Updates for 1 Year", arDesc: "تحديثات الأمان والتحسينات الجوهرية مجانية خلال السنة الأولى.", enDesc: "Security updates and core improvements free for the first year." },
    ],
  },

  restaurant: {
    slug: "restaurant",
    img: "/sectors/restaurant.jpg",
    icon: Coffee,
    arName: "المطاعم والمقاهي",
    enName: "Restaurants & Cafés",
    arShortDesc: "نظام نقاط بيع ومطبخ وإدارة الطلبات والمخزون",
    enShortDesc: "POS, kitchen display, orders and inventory",
    arHeroTitle: "نظام مطعمك\nمن الطلب للتسليم",
    enHeroTitle: "Your Restaurant\nOrder to Delivery",
    arHeroSub: "نقطة بيع، شاشة مطبخ، إدارة طاولات، ومخزون — كل ما يحتاجه مطعمك في نظام واحد.",
    enHeroSub: "POS, kitchen display, table management, and inventory — everything your restaurant needs in one system.",
    segment: "restaurant",
    seoKeywords: "نظام مطعم, نقطة بيع مطعم, برنامج كافيه, نظام طلبات مطعم, كيروكس مطاعم, restaurant POS saudi",
    features: [
      { icon: Monitor, arTitle: "نقطة بيع (POS) مخصصة لمطعمك", enTitle: "Custom Restaurant POS", arDesc: "واجهة مصممة لسرعة الكاشير — لا تأخير، لا أخطاء. تعمل حتى بدون إنترنت.", enDesc: "Interface designed for cashier speed — no delays, no errors. Works offline too." },
      { icon: ChefHat, arTitle: "شاشة مطبخ ذكية (KDS)", enTitle: "Smart Kitchen Display (KDS)", arDesc: "كل طلب يظهر للطباخ مباشرةً بالترتيب والأولوية — لا أوراق، لا تشويش.", enDesc: "Every order appears to the chef directly in order and priority — no paper, no confusion." },
      { icon: QrCode, arTitle: "قائمة QR ديناميكية", enTitle: "Dynamic QR Menu", arDesc: "عدّل الأسعار والأصناف من لوحة التحكم — تتحدث القائمة فوراً بدون إعادة طباعة.", enDesc: "Edit prices and items from the control panel — menu updates instantly without reprinting." },
      { icon: Users, arTitle: "إدارة الطاولات والفروع", enTitle: "Table & Branch Management", arDesc: "خطة الطوابق، حالة كل طاولة، ونقل الطلبات — كل ذلك من شاشة واحدة.", enDesc: "Floor plan, table status, and order transfers — all from one screen." },
      { icon: Package, arTitle: "مخزون المواد الخام", enTitle: "Raw Materials Inventory", arDesc: "تتبع كل مكوّن يُستهلك من كل طلب — تنبيهات تلقائية عند انخفاض المخزون.", enDesc: "Track every ingredient consumed from each order — auto alerts when stock runs low." },
      { icon: Star, arTitle: "نظام نقاط الولاء", enTitle: "Loyalty Points System", arDesc: "عملاؤك يجمعون نقاطاً مع كل طلب ويستردونها كخصم — يزيد الرجوع إليك.", enDesc: "Your customers earn points with every order and redeem them as discounts — increases return visits." },
    ],
    whyQirox: [
      { arTitle: "وضع أوف لاين حقيقي", enTitle: "True Offline Mode", arDesc: "المنافسون يعدون بـ'أوف لاين' ثم يعطّل النظام عند انقطاع النت. نظامنا يعمل بالكامل.", enDesc: "Competitors promise 'offline' but the system breaks when internet cuts. Ours works completely." },
      { arTitle: "KDS مدمج في الباقة الأساسية", enTitle: "KDS Built Into Base Package", arDesc: "شاشة المطبخ تحتاج دفع إضافي عند معظم المنافسين. عندنا مدمجة من البداية.", enDesc: "Kitchen display costs extra with most competitors. With us it's included from day one." },
      { arTitle: "دعم الطباعة المباشرة بدون Windows", enTitle: "Direct Printing Without Windows", arDesc: "طباعة مباشرة على الطابعات الحرارية دون الحاجة لكمبيوتر — التابلت يكفي.", enDesc: "Direct printing to thermal printers without a computer needed — a tablet is enough." },
    ],
    guarantee: [
      { icon: Shield, arLabel: "ضمان جودة 90 يوم", enLabel: "90-Day Quality Guarantee", arDesc: "أي خطأ بعد التسليم، نصلحه مجاناً خلال 24 ساعة.", enDesc: "Any bug after delivery, we fix it free within 24 hours." },
      { icon: Headphones, arLabel: "دعم 24/7 بالعربي", enLabel: "24/7 Arabic Support", arDesc: "نعرف أن المطعم لا يتوقف — دعمنا معك على مدار الساعة.", enDesc: "We know a restaurant never stops — our support is with you round the clock." },
      { icon: Zap, arLabel: "تسليم خلال 14 يوم", enLabel: "Delivery in 14 Days", arDesc: "نظام المطعم الكامل جاهز في 14 يوم — مع تدريب الفريق.", enDesc: "Full restaurant system ready in 14 days — including staff training." },
      { icon: Award, arLabel: "تدريب الفريق مجاناً", enLabel: "Free Team Training", arDesc: "نزور مطعمك ونُدرّب فريقك على النظام كاملاً بدون رسوم إضافية.", enDesc: "We visit your restaurant and train your team on the full system at no extra cost." },
    ],
  },

  corporate: {
    slug: "corporate",
    img: "/sectors/corporate.jpg",
    icon: Building2,
    arName: "الشركات والوكلات",
    enName: "Companies & Agencies",
    arShortDesc: "حلول ERP وCRM ومالية متكاملة لإدارة الأعمال",
    enShortDesc: "Integrated ERP, CRM and financial solutions",
    arHeroTitle: "أدِر شركتك\nبالكفاءة الكاملة",
    enHeroTitle: "Run Your Company\nAt Full Efficiency",
    arHeroSub: "نظام ERP شامل مصمم لطبيعة السوق السعودي — محاسبة، موارد بشرية، مبيعات، وعمليات في منصة واحدة.",
    enHeroSub: "Comprehensive ERP designed for the Saudi market — accounting, HR, sales, and operations in one platform.",
    segment: "corporate",
    seoKeywords: "نظام شركات ERP, برنامج CRM سعودي, نظام موارد بشرية, برنامج محاسبة, كيروكس شركات, ERP saudi arabia",
    features: [
      { icon: FileText, arTitle: "محاسبة وفق معايير ZATCA", enTitle: "ZATCA-Compliant Accounting", arDesc: "فوترة إلكترونية معتمدة، ضريبة القيمة المضافة، وتقارير مالية جاهزة لهيئة الزكاة.", enDesc: "Approved e-invoicing, VAT compliance, and financial reports ready for ZATCA." },
      { icon: Users, arTitle: "إدارة الموارد البشرية", enTitle: "Human Resources Management", arDesc: "ملفات الموظفين، الرواتب، الإجازات، العقود، ومتابعة الأداء — كل شيء موثّق.", enDesc: "Employee files, salaries, leaves, contracts, and performance tracking — all documented." },
      { icon: MessageSquare, arTitle: "CRM لإدارة العملاء", enTitle: "Customer Relationship Management", arDesc: "تاريخ كل عميل، المقترحات المرسلة، مرحلة الصفقة، والمتابعات — في مكان واحد.", enDesc: "Each client's history, sent proposals, deal stage, and follow-ups — all in one place." },
      { icon: BarChart3, arTitle: "تقارير الأداء التنفيذي", enTitle: "Executive Performance Reports", arDesc: "داشبورد للإدارة العليا يعرض KPIs بشكل بياني واضح وقابل للتصدير.", enDesc: "Executive dashboard showing KPIs in clear, exportable charts." },
      { icon: Settings, arTitle: "إدارة المشاريع والمهام", enTitle: "Project & Task Management", arDesc: "خطط المشاريع، توزيع المهام على الفرق، ومتابعة التسليم — بدون أدوات خارجية.", enDesc: "Project plans, task distribution to teams, and delivery tracking — without external tools." },
      { icon: Lock, arTitle: "صلاحيات متعددة المستويات", enTitle: "Multi-Level Permissions", arDesc: "كل موظف يرى فقط ما يحتاجه — حماية بيانات شركتك في كل مستوى.", enDesc: "Every employee sees only what they need — your company data protected at every level." },
    ],
    whyQirox: [
      { arTitle: "لا ترخيص سنوي مزعج", enTitle: "No Annoying Annual License", arDesc: "SAP وOracle تحتجز بياناتك وراء رسوم سنوية مرتفعة. نحن نبيعك النظام — تملكه.", enDesc: "SAP and Oracle lock your data behind high annual fees. We sell you the system — you own it." },
      { arTitle: "مُخصَّص لنظام ضريبة الاستحقاق السعودي", enTitle: "Built for Saudi VAT System", arDesc: "ليس ترجمة لنظام غربي. مبني من الصفر ليعمل وفق متطلبات ZATCA بدقة.", enDesc: "Not a translated Western system. Built from scratch to work precisely with ZATCA requirements." },
      { arTitle: "تكامل مع العمالة والمقيمين", enTitle: "Workforce & Iqama Integration", arDesc: "ربط مع أبشر، تتبع مدد الإقامة، وتنبيهات تجديد الوثائق — ميزة لا تجدها إلا عندنا.", enDesc: "Integration with Absher, Iqama expiry tracking, and document renewal alerts — only with us." },
    ],
    guarantee: [
      { icon: Shield, arLabel: "ضمان جودة 90 يوم", enLabel: "90-Day Quality Guarantee", arDesc: "أي خطأ بعد التسليم، نصلحه مجاناً خلال 24 ساعة.", enDesc: "Any bug after delivery, we fix it free within 24 hours." },
      { icon: Headphones, arLabel: "دعم 24/7 بالعربي", enLabel: "24/7 Arabic Support", arDesc: "واتساب + تذاكر دعم. فريق يفهم عمليات الشركات السعودية.", enDesc: "WhatsApp + support tickets. A team that understands Saudi business operations." },
      { icon: Lock, arLabel: "سيادة البيانات — ملك لك", enLabel: "Data Sovereignty — Yours to Own", arDesc: "قاعدة بياناتك على سيرفرك أو الخادم السحابي الذي تختاره — لا قفل من طرفنا.", enDesc: "Your database on your server or cloud of choice — no lock-in from our side." },
      { icon: Award, arLabel: "تخصيص بلا حدود", enLabel: "Unlimited Customization", arDesc: "طوّر وعدّل على النظام كيفما تشاء بعد الاستلام — الكود كاملاً لك.", enDesc: "Develop and modify the system however you like after handover — full code is yours." },
    ],
  },

  healthcare: {
    slug: "healthcare",
    img: "/sectors/healthcare.jpg",
    icon: Heart,
    arName: "الصحة والتجميل",
    enName: "Health & Beauty",
    arShortDesc: "إدارة العيادات والمرضى والمواعيد والملفات الطبية",
    enShortDesc: "Clinic, patient, appointment and medical file management",
    arHeroTitle: "عيادتك الرقمية\nبمعايير طبية عالية",
    enHeroTitle: "Your Digital Clinic\nAt World-Class Standards",
    arHeroSub: "نظام إدارة طبية متكامل مصمم لعيادات ومراكز الرياض — من الحجز حتى الملف الطبي الكامل.",
    enHeroSub: "Integrated medical management system designed for Riyadh clinics and centers — from booking to full medical record.",
    segment: "healthcare",
    seoKeywords: "نظام عيادة, برنامج حجوزات طبية, ملف طبي إلكتروني, نظام مستشفى سعودي, كيروكس صحة, clinic management saudi",
    features: [
      { icon: Calendar, arTitle: "نظام حجوزات ذكي", enTitle: "Smart Booking System", arDesc: "جدولة المواعيد تلقائياً، تأكيد واتساب، وتذكير قبل يوم من الموعد — لا تغيّبات.", enDesc: "Automatic appointment scheduling, WhatsApp confirmation, and reminder the day before — no no-shows." },
      { icon: Stethoscope, arTitle: "الملف الطبي الإلكتروني", enTitle: "Electronic Medical Record", arDesc: "تاريخ المريض الكامل، الوصفات، نتائج التحاليل، والصور — آمن ومشفّر.", enDesc: "Complete patient history, prescriptions, lab results, and images — secure and encrypted." },
      { icon: FileText, arTitle: "الوصفات والتقارير الطبية", enTitle: "Prescriptions & Medical Reports", arDesc: "أصدر وصفات رقمية بتوقيع الطبيب، قابلة للطباعة والإرسال للصيدلية مباشرةً.", enDesc: "Issue digital prescriptions with doctor's signature, printable and sendable to pharmacy directly." },
      { icon: CreditCard, arTitle: "إدارة الفوترة والتأمين", enTitle: "Billing & Insurance Management", arDesc: "فوترة خدمات متعددة، تتبع مطالبات التأمين، وتقارير الإيرادات لكل طبيب.", enDesc: "Multi-service billing, insurance claim tracking, and revenue reports per doctor." },
      { icon: BarChart3, arTitle: "تقارير الأداء الطبي", enTitle: "Medical Performance Reports", arDesc: "أكثر الأمراض تكراراً، أداء كل طبيب، معدل الرجوع — بيانات تصنع القرار الصحيح.", enDesc: "Most common diagnoses, each doctor's performance, return rate — data that makes the right decision." },
      { icon: Wifi, arTitle: "بوابة المريض الذاتية", enTitle: "Patient Self-Service Portal", arDesc: "يحجز المريض بنفسه، يشوف مواعيده، ويستلم نتائجه عبر تطبيق أو موقع خاص.", enDesc: "Patient books themselves, views appointments, and receives results via dedicated app or website." },
    ],
    whyQirox: [
      { arTitle: "معتمد لمتطلبات وزارة الصحة", enTitle: "Compliant with MOH Requirements", arDesc: "نظامنا مصمم ليتوافق مع اشتراطات وزارة الصحة السعودية للأنظمة الصحية الرقمية.", enDesc: "Our system is designed to comply with Saudi Ministry of Health digital health system requirements." },
      { arTitle: "لا بيانات طبية تخرج للخارج", enTitle: "No Medical Data Leaves the Kingdom", arDesc: "جميع بيانات مرضاك على سيرفرات داخل المملكة — خصوصية تامة وامتثال PDPL.", enDesc: "All patient data on servers inside the Kingdom — complete privacy and PDPL compliance." },
      { arTitle: "تصميم مُعتاد للطواقم الطبية", enTitle: "Familiar Design for Medical Staff", arDesc: "واجهة مشابهة للأنظمة العالمية — الطاقم يتعلمها في ساعة دون الحاجة لدورات طويلة.", enDesc: "Interface similar to global systems — staff learn it in an hour without long training courses." },
    ],
    guarantee: [
      { icon: Shield, arLabel: "ضمان جودة 90 يوم", enLabel: "90-Day Quality Guarantee", arDesc: "أي خطأ بعد التسليم، نصلحه مجاناً خلال 24 ساعة.", enDesc: "Any bug after delivery, we fix it free within 24 hours." },
      { icon: Headphones, arLabel: "دعم 24/7 — لأن الطب لا يتوقف", enLabel: "24/7 Support — Medicine Never Stops", arDesc: "فريق دعم متخصص يفهم أهمية استمرارية الأنظمة الطبية.", enDesc: "Specialized support team that understands the importance of medical system continuity." },
      { icon: Lock, arLabel: "تشفير بيانات المرضى", enTitle: "Patient Data Encryption", arDesc: "تشفير AES-256 لجميع البيانات الطبية الحساسة — لا أحد يصل إليها إلا المُصرَّح لهم.", enDesc: "AES-256 encryption for all sensitive medical data — only authorized personnel can access." },
      { icon: Zap, arLabel: "تسليم خلال 21 يوم", enLabel: "Delivery in 21 Days", arDesc: "نظام عيادتك الكامل جاهز في 21 يوم — مع تدريب الطاقم الطبي.", enDesc: "Your complete clinic system ready in 21 days — including medical staff training." },
    ],
  },

  education: {
    slug: "education",
    img: "/sectors/education.jpg",
    icon: GraduationCap,
    arName: "التعليم والمنصات",
    enName: "Education Platforms",
    arShortDesc: "منصات تعليمية متكاملة للدورات والطلاب والاختبارات",
    enShortDesc: "Full LMS for courses, students and exams",
    arHeroTitle: "منصتك التعليمية\nبمعايير عالمية",
    enHeroTitle: "Your Education Platform\nAt World Standards",
    arHeroSub: "نبني لك منصة تعليمية احترافية — إدارة دورات، طلاب، اختبارات، وشهادات إتمام تلقائية.",
    enHeroSub: "We build your professional learning platform — course management, students, exams, and auto-generated certificates.",
    segment: "education",
    seoKeywords: "منصة تعليمية, نظام LMS سعودي, إدارة دورات تدريبية, برنامج تعليمي, كيروكس تعليم, LMS saudi arabia",
    features: [
      { icon: Monitor, arTitle: "إدارة الدورات والمحتوى", enTitle: "Course & Content Management", arDesc: "أضف دوراتك بالفيديو والـPDF والاختبارات — منظمة في وحدات ودروس تفاعلية.", enDesc: "Add your courses with video, PDF and quizzes — organized in interactive modules and lessons." },
      { icon: Users, arTitle: "إدارة الطلاب والتسجيل", enTitle: "Student & Enrollment Management", arDesc: "سجّل الطلاب يدوياً أو تلقائياً، تابع تقدمهم، وأرسل تنبيهات التذكير.", enDesc: "Enroll students manually or automatically, track their progress, and send reminder alerts." },
      { icon: FileText, arTitle: "اختبارات وتقييمات تلقائية", enTitle: "Automatic Tests & Assessments", arDesc: "أنشئ اختبارات بأنواع مختلفة (اختيار متعدد، صح/خطأ) مع تصحيح وتقييم فوري.", enDesc: "Create quizzes with multiple types (MCQ, true/false) with instant auto-grading." },
      { icon: Award, arTitle: "شهادات إتمام احترافية", enTitle: "Professional Completion Certificates", arDesc: "شهادات مُصمَّمة بهويتك تُصدَر تلقائياً عند إكمال الدورة — قابلة للتحقق برمز QR.", enDesc: "Branded certificates auto-issued upon course completion — verifiable via QR code." },
      { icon: BarChart3, arTitle: "تقارير أداء الطلاب", enTitle: "Student Performance Reports", arDesc: "تتبع معدل الإنجاز، نتائج الاختبارات، ووقت الدراسة لكل طالب بتفصيل كامل.", enDesc: "Track completion rate, exam scores, and study time per student in full detail." },
      { icon: CreditCard, arTitle: "بوابة دفع للاشتراكات", enTitle: "Subscription Payment Gateway", arDesc: "بيع دوراتك بمدفوعة واحدة أو اشتراك شهري — مع كوبونات خصم ذكية.", enDesc: "Sell your courses with one-time payment or monthly subscription — with smart discount coupons." },
    ],
    whyQirox: [
      { arTitle: "تصميم بهويتك الكاملة", enTitle: "Fully Branded Design", arDesc: "منصتك بلوجوك وألوانك وتجربة المستخدم التي تعكس مؤسستك — لا قوالب مكررة.", enDesc: "Your platform with your logo, colors and UX that reflects your institution — no repeated templates." },
      { arTitle: "دروس مباشرة مدمجة في المنصة", enTitle: "Live Sessions Built Into the Platform", arDesc: "لايف مدمج داخل المنصة — الطلاب يشاركون دون الخروج لـ Zoom أو Meet.", enDesc: "Live sessions embedded in the platform — students participate without leaving to Zoom or Meet." },
      { arTitle: "تطبيق موبايل للطلاب", enTitle: "Student Mobile App", arDesc: "تطبيق iOS وAndroid بعلامتك التجارية — الطلاب يدرسون أينما كانوا.", enDesc: "iOS and Android app branded for you — students study anywhere they are." },
    ],
    guarantee: [
      { icon: Shield, arLabel: "ضمان جودة 90 يوم", enLabel: "90-Day Quality Guarantee", arDesc: "أي خطأ بعد التسليم، نصلحه مجاناً خلال 24 ساعة.", enDesc: "Any bug after delivery, we fix it free within 24 hours." },
      { icon: Headphones, arLabel: "دعم 24/7 بالعربي", enLabel: "24/7 Arabic Support", arDesc: "واتساب + تذاكر دعم. نرد في أقل من ساعة في أوقات العمل.", enDesc: "WhatsApp + support tickets. We reply in under an hour during working hours." },
      { icon: Zap, arLabel: "تسليم خلال 21 يوم", enLabel: "Delivery in 21 Days", arDesc: "منصتك التعليمية الكاملة جاهزة في 21 يوم — مضمون في العقد.", enDesc: "Your full education platform ready in 21 days — guaranteed in the contract." },
      { icon: Award, arLabel: "تدريب فريق المحتوى مجاناً", enLabel: "Free Content Team Training", arDesc: "نُدرّب فريقك على رفع المحتوى وإدارة الطلاب والتقارير بالكامل.", enDesc: "We train your team on content upload, student management and reports fully." },
    ],
  },

  ai: {
    slug: "ai",
    img: "/sectors/ai.jpg",
    icon: Bot,
    arName: "الذكاء الاصطناعي",
    enName: "AI Solutions",
    arShortDesc: "أدوات ذكية لتحسين العمليات واتخاذ قرارات أفضل",
    enShortDesc: "Smart tools to improve operations and make better decisions",
    arHeroTitle: "ذكاء اصطناعي\nيبني معك",
    enHeroTitle: "AI That\nBuilds With You",
    arHeroSub: "ندمج الذكاء الاصطناعي في نظامك — تحليل البيانات، الأتمتة، والمساعد الذكي الخاص بك.",
    enHeroSub: "We integrate AI into your system — data analytics, automation, and your own smart assistant.",
    segment: "ai",
    seoKeywords: "ذكاء اصطناعي سعودي, نظام AI, أتمتة ذكية, تحليل بيانات, كيروكس ذكاء اصطناعي, AI solutions saudi",
    features: [
      { icon: BarChart3, arTitle: "تحليل البيانات الذكي", enTitle: "Smart Data Analytics", arDesc: "لوحة تحكم تفاعلية تحلل بياناتك وتستخرج رؤى قابلة للتنفيذ — بدون خلفية تقنية.", enDesc: "Interactive dashboard that analyzes your data and extracts actionable insights — no tech background needed." },
      { icon: MessageSquare, arTitle: "مساعد ذكي خاص بك", enTitle: "Your Own AI Assistant", arDesc: "مساعد يفهم عمليات شركتك ويجيب فريقك على أسئلتهم فوراً — بالعربي الكامل.", enDesc: "An assistant that understands your business and answers your team instantly — fully in Arabic." },
      { icon: Settings, arTitle: "أتمتة العمليات المتكررة", enTitle: "Repetitive Process Automation", arDesc: "أتمت مهام التقارير، الإشعارات، والتصنيفات — وفّر ساعات عمل يومياً.", enDesc: "Automate reporting tasks, notifications, and classifications — save work hours daily." },
      { icon: TrendingUp, arTitle: "التوقعات والنمذجة الذكية", enTitle: "AI Predictions & Modelling", arDesc: "توقعات المبيعات والطلب والسلوك — تتخذ قراراتك قبل المنافسين.", enDesc: "Sales, demand, and behavior predictions — make decisions before your competitors." },
      { icon: Target, arTitle: "تخصيص تجربة العملاء", enTitle: "Customer Experience Personalization", arDesc: "توصيات ذكية ومحتوى مخصص لكل عميل — يرفع الرضا والمبيعات تلقائياً.", enDesc: "Smart recommendations and personalized content per customer — automatically raises satisfaction and sales." },
      { icon: Lock, arTitle: "أمان وسيادة البيانات", enTitle: "Data Security & Sovereignty", arDesc: "نماذج الذكاء الاصطناعي تعمل على بنيتك التحتية فقط — لا تسريب، لا استخدام خارجي.", enDesc: "AI models run on your infrastructure only — no leaks, no external use." },
    ],
    whyQirox: [
      { arTitle: "ذكاء اصطناعي بالعربي أولاً", enTitle: "Arabic-First AI", arDesc: "نماذجنا تفهم اللهجة السعودية والمصطلحات المحلية — لا ترجمة، لا سوء فهم.", enDesc: "Our models understand Saudi dialect and local terminology — no translation, no misunderstanding." },
      { arTitle: "تكامل مع أنظمتك الحالية", enTitle: "Integration With Your Existing Systems", arDesc: "ندمج الذكاء الاصطناعي في نظامك الحالي — لا تحتاج تغيير كل شيء من الصفر.", enDesc: "We integrate AI into your existing system — no need to replace everything from scratch." },
      { arTitle: "ملكيتك الكاملة للنماذج والبيانات", enTitle: "Full Ownership of Models & Data", arDesc: "النماذج المُدرَّبة على بياناتك ملك لك — لا اشتراكات، لا رسوم دورية.", enDesc: "Models trained on your data are yours — no subscriptions, no recurring fees." },
    ],
    guarantee: [
      { icon: Shield, arLabel: "ضمان جودة 90 يوم", enLabel: "90-Day Quality Guarantee", arDesc: "أي خطأ بعد التسليم، نصلحه مجاناً خلال 24 ساعة.", enDesc: "Any bug after delivery, we fix it free within 24 hours." },
      { icon: Headphones, arLabel: "دعم 24/7 بالعربي", enLabel: "24/7 Arabic Support", arDesc: "واتساب + تذاكر دعم. نرد في أقل من ساعة في أوقات العمل.", enDesc: "WhatsApp + support tickets. We reply in under an hour during working hours." },
      { icon: Zap, arLabel: "نماذج أولية خلال 14 يوم", enLabel: "Initial Models in 14 Days", arDesc: "نماذجك الأولية جاهزة للاختبار خلال أسبوعين من انطلاق المشروع.", enDesc: "Your initial models ready for testing within two weeks of project kickoff." },
      { icon: Lock, arLabel: "بياناتك لا تغادر سيرفرك", enLabel: "Your Data Never Leaves Your Server", arDesc: "كل معالجة AI تتم على بنيتك التحتية — صفر تسريب مضمون.", enDesc: "All AI processing on your infrastructure — zero leakage guaranteed." },
    ],
  },

};

// ─── Smart Partner Iframe ─────────────────────────────────────────────────────
function PartnerIframe({ url, name }: { url: string; name: string }) {
  const [hovered, setHovered] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // Auto-scroll after 2 seconds
    timerRef.current = setTimeout(() => setScrolled(true), 2000);
    return () => clearTimeout(timerRef.current!);
  }, []);

  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-xl bg-gray-900 cursor-pointer group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Iframe with scroll animation */}
      <div
        className="absolute inset-0 transition-transform"
        style={{
          transform: hovered ? "translateY(-25%)" : scrolled ? "translateY(-12%)" : "translateY(0)",
          transition: hovered ? "transform 1.2s cubic-bezier(0.4,0,0.2,1)" : "transform 3s cubic-bezier(0.4,0,0.2,1)",
          height: "150%",
          width: "100%",
        }}
      >
        <iframe
          src={url}
          title={name}
          className="w-full h-full border-0 pointer-events-none"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
          style={{ height: "100%", width: "100%" }}
        />
      </div>
      {/* Overlay hint */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-white text-sm font-bold hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-4 h-4" />
          {name}
        </a>
      </div>
    </div>
  );
}

// ─── SectorPage component ─────────────────────────────────────────────────────
export default function SectorPage() {
  const [, params] = useRoute<{ slug: string }>("/sector/:slug");
  const { lang, dir } = useI18n();
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;

  const slug = params?.slug ?? "";
  const sector = SECTOR_DATA[slug];

  const { data: partners = [] } = useQuery<Partner[]>({ queryKey: ["/api/partners"] });
  const { data: segmentPricing = [] } = useQuery<any[]>({ queryKey: ["/api/segment-pricing"] });

  // Map Arabic relatedService values stored in DB → our sector slugs
  const RELATEDSERVICE_SLUG: Record<string, string> = {
    "نظام إدارة الكافيهات":      "restaurant",
    "نظام إدارة المطاعم":        "restaurant",
    "نظام التجارة الإلكترونية":  "ecommerce",
    "نظام إدارة المستشفيات":     "healthcare",
    "نظام إدارة العقارات":       "healthcare",
    "نظام إدارة صالونات":        "healthcare",
    "نظام صالون تجميل":          "healthcare",
    "نظام الشركات":              "corporate",
    "لوحة تحكم الإدارة":        "corporate",
  };

  const sectorPartners = (partners as Partner[]).filter(
    (p) => RELATEDSERVICE_SLUG[p.relatedService as string] === slug
  );

  // DB segmentKeys: "restaurants" → restaurant slug, everything else → "others"
  const SEGMENT_KEY_MAP: Record<string, string> = {
    restaurant: "restaurants",
  };
  const segmentKeyForSector = SEGMENT_KEY_MAP[slug] ?? "others";

  const sectorPricing = (segmentPricing as any[]).filter(
    (sp) => sp.segmentKey === segmentKeyForSector
  );

  useSEO(sector ? {
    title: ar
      ? `نظام ${sector.arName} | كيروكس استوديو`
      : `${sector.enName} System | Qirox Studio`,
    description: ar ? sector.arHeroSub : sector.enHeroSub,
    keywords: sector.seoKeywords,
    canonical: `/sector/${slug}`,
    jsonLd: [{
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": ar ? `نظام ${sector.arName}` : `${sector.enName} System`,
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, iOS, Android",
      "description": ar ? sector.arHeroSub : sector.enHeroSub,
      "offers": sectorPricing.length > 0 ? sectorPricing.map((sp: any) => ({
        "@type": "Offer",
        "name": sp.planNameAr || sp.planName || "",
        "price": sp.monthlyPrice || sp.price || 0,
        "priceCurrency": "SAR",
      })) : undefined,
      "provider": {
        "@type": "Organization",
        "name": "Qirox Studio",
        "url": "https://qiroxstudio.online",
      },
    }],
  } : { title: "كيروكس", description: "" });

  const fade = (i: number) => ({
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, delay: i * 0.1 },
  });

  if (!sector) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950" dir={dir}>
        <Navigation />
        <main className="flex-1 flex items-center justify-center text-center px-6">
          <div>
            <p className="text-black/40 dark:text-white/40 text-lg mb-6">
              {ar ? "القطاع غير موجود" : "Sector not found"}
            </p>
            <Link href="/">
              <Button>{ar ? "العودة للرئيسية" : "Back to Home"}</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const SectorIcon = sector.icon;

  return (
    <div className="min-h-screen flex flex-col bg-white text-black dark:bg-gray-950 dark:text-white" dir={dir}>
      <Navigation />

      <main className="flex-1">
        {/* ─── HERO ─── */}
        <section className="relative min-h-[92vh] flex items-end overflow-hidden">
          {/* Background photo — blurred glass effect */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={sector.img}
              alt={ar ? sector.arName : sector.enName}
              className="w-full h-full object-cover scale-110"
              style={{ filter: "blur(6px) brightness(0.6)" }}
              loading="eager"
            />
            {/* Frosted glass sheen */}
            <div className="absolute inset-0 backdrop-blur-[2px] bg-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/5" />
          </div>

          {/* Content */}
          <div className="relative w-full pb-20 pt-40">
            <div className="container mx-auto px-6 md:px-10 max-w-5xl">
              {/* Breadcrumb */}
              <motion.div {...fade(0)} className="flex items-center gap-2 text-white/50 text-sm mb-8">
                <Link href="/" className="hover:text-white transition-colors">{ar ? "الرئيسية" : "Home"}</Link>
                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                <span className="text-white/80">{ar ? sector.arName : sector.enName}</span>
              </motion.div>

              {/* Icon badge */}
              <motion.div {...fade(1)} className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                <SectorIcon className="w-8 h-8 text-white" />
              </motion.div>

              {/* Title */}
              <motion.h1 {...fade(2)} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6 whitespace-pre-line">
                {ar ? sector.arHeroTitle : sector.enHeroTitle}
              </motion.h1>

              {/* Sub */}
              <motion.p {...fade(3)} className="text-lg md:text-xl text-white/70 max-w-xl leading-relaxed mb-10">
                {ar ? sector.arHeroSub : sector.enHeroSub}
              </motion.p>

              {/* CTAs */}
              <motion.div {...fade(4)} className="flex flex-wrap items-center gap-4">
                <Link href="/start">
                  <Button size="lg" className="bg-white text-black hover:bg-white/90 rounded-full h-12 px-8 font-bold gap-2">
                    {ar ? "ابدأ مشروعك" : "Start Your Project"}
                    <Arrow className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href={`/prices?segment=${sector.segment}`}>
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-full h-12 px-8 font-bold">
                    {ar ? "اطلع على الأسعار" : "View Pricing"}
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── FEATURES ─── */}
        <section className="py-24 bg-white dark:bg-gray-950">
          <div className="container mx-auto px-6 md:px-10 max-w-6xl">
            <motion.div {...fade(0)} className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block text-[11px] font-black uppercase tracking-widest text-black/40 dark:text-white/40 mb-4">
                {ar ? "المميزات" : "FEATURES"}
              </span>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
                {ar ? `كل ما يحتاجه ${sector.arName}` : `Everything ${sector.enName} Needs`}
              </h2>
              <p className="text-black/55 dark:text-white/55 text-base leading-relaxed">
                {ar ? "مميزات مدروسة لكل تفصيلة في عملك — لا شيء ناقص، لا شيء زائد." : "Features crafted for every detail in your business — nothing missing, nothing unnecessary."}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sector.features.map((f, i) => {
                const FIcon = f.icon;
                return (
                  <motion.div key={i} {...fade(i * 0.5)} className="group p-6 rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-black/[0.01] dark:bg-white/[0.02] hover:border-black/15 dark:hover:border-white/15 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-all duration-300">
                    <div className="w-11 h-11 rounded-xl bg-black dark:bg-white flex items-center justify-center mb-4">
                      <FIcon className="w-5 h-5 text-white dark:text-black" />
                    </div>
                    <h3 className="text-base font-black mb-2">{ar ? f.arTitle : f.enTitle}</h3>
                    <p className="text-sm text-black/55 dark:text-white/55 leading-relaxed">{ar ? f.arDesc : f.enDesc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── WHY QIROX ─── */}
        <section className="py-24 bg-[#f0f0ee] dark:bg-[#0d0d0d]">
          <div className="container mx-auto px-6 md:px-10 max-w-5xl">
            <motion.div {...fade(0)} className="mb-16 max-w-2xl">
              <span className="inline-block text-[11px] font-black uppercase tracking-widest text-black/40 dark:text-white/40 mb-4">
                {ar ? "لماذا كيروكس؟" : "WHY QIROX?"}
              </span>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
                {ar ? "ما لا تجده في السوق\nستجده عندنا" : "What the market lacks\nyou'll find with us"}
              </h2>
              <p className="text-black/55 dark:text-white/55 text-base leading-relaxed">
                {ar ? "الأنظمة العادية تحل 80% من احتياجات القطاع. نحن نبني الـ 100%." : "Ordinary systems solve 80% of sector needs. We build 100%."}
              </p>
            </motion.div>

            <div className="space-y-5">
              {sector.whyQirox.map((w, i) => (
                <motion.div key={i} {...fade(i * 0.5)} className="flex items-start gap-6 p-6 rounded-2xl bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06]">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center mt-0.5">
                    <Check className="w-5 h-5 text-white dark:text-black" strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black mb-1.5">{ar ? w.arTitle : w.enTitle}</h3>
                    <p className="text-black/60 dark:text-white/60 leading-relaxed">{ar ? w.arDesc : w.enDesc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── PRICING ─── */}
        <section className="py-24 bg-white dark:bg-gray-950">
          <div className="container mx-auto px-6 md:px-10 max-w-5xl">
            <motion.div {...fade(0)} className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block text-[11px] font-black uppercase tracking-widest text-black/40 dark:text-white/40 mb-4">
                {ar ? "الأسعار" : "PRICING"}
              </span>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
                {ar ? "باقات مصممة لك" : "Packages Designed for You"}
              </h2>
              <p className="text-black/55 dark:text-white/55 text-base leading-relaxed">
                {ar ? "أسعار شفافة. لا رسوم خفية. لا مفاجآت." : "Transparent pricing. No hidden fees. No surprises."}
              </p>
            </motion.div>

            {(() => {
              const FALLBACK = [
                {
                  nameAr: "لايت", nameEn: "Lite",
                  tagAr: "للبدايات", tagEn: "Starter",
                  featuresAr: ["موقع احترافي مخصص لقطاعك", "لوحة تحكم أساسية", "دعم فني 6 أشهر", "3 مستخدمين"],
                  featuresEn: ["Custom site for your sector", "Basic control panel", "6-month support", "3 users"],
                },
                {
                  nameAr: "برو", nameEn: "Pro",
                  tagAr: "الأكثر طلباً ⭐", tagEn: "Most Popular ⭐",
                  popular: true,
                  featuresAr: ["كل ميزات لايت", "نظام متكامل لقطاعك", "تطبيق جوال iOS وAndroid", "تقارير متقدمة وذكاء اصطناعي"],
                  featuresEn: ["All Lite features", "Full sector system", "iOS & Android app", "Advanced reports & AI"],
                },
                {
                  nameAr: "إنفينيت", nameEn: "Infinite",
                  tagAr: "بلا حدود", tagEn: "No Limits",
                  featuresAr: ["كل شيء في برو", "تطوير مخصص كامل", "أولوية دعم 24/7", "خادم سحابي مخصص"],
                  featuresEn: ["Everything in Pro", "Full custom dev", "24/7 priority support", "Dedicated cloud server"],
                },
              ];
              const plans = sectorPricing.length > 0
                ? sectorPricing.map((p: any, i: number) => ({
                    nameAr: p.planNameAr || p.planName || `باقة ${i + 1}`,
                    nameEn: p.planName || `Plan ${i + 1}`,
                    tagAr: i === 1 ? "الأكثر طلباً ⭐" : "",
                    tagEn: i === 1 ? "Most Popular ⭐" : "",
                    popular: i === 1,
                    price: p.monthlyPrice || p.price || null,
                    featuresAr: p.features || [],
                    featuresEn: p.features || [],
                    planId: p._id || p.id || i,
                  }))
                : FALLBACK;

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan: any, i: number) => (
                    <motion.div key={i} {...fade(i * 0.5)} className={`relative p-7 rounded-2xl border-2 flex flex-col ${plan.popular ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black" : "border-black/[0.08] dark:border-white/[0.08]"}`}>
                      {plan.popular && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-black dark:bg-white text-white dark:text-black text-[11px] font-black uppercase tracking-wider whitespace-nowrap">
                          {ar ? "الأكثر طلباً" : "Most Popular"}
                        </div>
                      )}
                      <div className="mb-1">
                        <span className={`text-[11px] font-bold uppercase tracking-widest ${plan.popular ? "text-white/50 dark:text-black/50" : "text-black/35 dark:text-white/35"}`}>
                          {ar ? plan.tagAr : plan.tagEn}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black mb-3">{ar ? plan.nameAr : plan.nameEn}</h3>
                      {plan.price != null ? (
                        <div className="flex items-baseline gap-1 mb-5">
                          <span className="text-4xl font-black">{Number(plan.price).toLocaleString()}</span>
                          <span className={`text-sm ${plan.popular ? "text-white/55 dark:text-black/55" : "text-black/40 dark:text-white/40"}`}>{ar ? "ر.س / شهر" : "SAR / mo"}</span>
                        </div>
                      ) : (
                        <div className="mb-5">
                          <span className={`text-sm font-bold ${plan.popular ? "text-white/60 dark:text-black/60" : "text-black/40 dark:text-white/40"}`}>
                            {ar ? "السعر حسب المتطلبات" : "Price by requirements"}
                          </span>
                        </div>
                      )}
                      <ul className="space-y-2.5 mb-7 flex-1">
                        {(ar ? plan.featuresAr : plan.featuresEn).slice(0, 5).map((ft: string, fi: number) => (
                          <li key={fi} className="flex items-start gap-2.5 text-sm">
                            <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.popular ? "text-white/70 dark:text-black/70" : "text-black/50 dark:text-white/50"}`} strokeWidth={3} />
                            {ft}
                          </li>
                        ))}
                      </ul>
                      <Link href={plan.planId != null ? `/order?segment=${sector.segment}&plan=${plan.planId}` : `/start?sector=${sector.slug}`}>
                        <Button className={`w-full rounded-xl h-11 font-bold ${plan.popular ? "bg-white text-black hover:bg-white/90 dark:bg-black dark:text-white dark:hover:bg-black/90" : "bg-black text-white hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90"}`}>
                          {ar ? "ابدأ الآن" : "Get Started"}
                          <Arrow className="w-4 h-4 ms-2" />
                        </Button>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              );
            })()}

            <motion.div {...fade(3)} className="text-center mt-8">
              <p className="text-sm text-black/40 dark:text-white/40">
                {ar ? "السعر يختلف حسب القطاع والمتطلبات — تكلّم مساعدنا للحصول على سعر مخصص." : "Price varies by sector and requirements — talk to our advisor for a custom quote."}
              </p>
            </motion.div>
          </div>
        </section>

        {/* ─── GUARANTEE ─── */}
        <section className="py-24 bg-black dark:bg-white text-white dark:text-black">
          <div className="container mx-auto px-6 md:px-10 max-w-6xl">
            <motion.div {...fade(0)} className="text-center max-w-2xl mx-auto mb-14">
              <span className="inline-block text-[11px] font-black uppercase tracking-widest text-white/40 dark:text-black/40 mb-4">
                {ar ? "ضماناتنا" : "OUR GUARANTEES"}
              </span>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
                {ar ? "نضمن جودتنا\nبالعقد" : "We Guarantee Our Quality\nIn the Contract"}
              </h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sector.guarantee.map((g, i) => {
                const GIcon = g.icon;
                return (
                  <motion.div key={i} {...fade(i * 0.5)} className="p-6 rounded-2xl bg-white/[0.06] dark:bg-black/[0.06] border border-white/10 dark:border-black/10 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-black/10 flex items-center justify-center mx-auto mb-4">
                      <GIcon className="w-6 h-6" />
                    </div>
                    <h3 className="font-black text-base mb-2">{ar ? g.arLabel : g.enLabel}</h3>
                    <p className="text-sm text-white/55 dark:text-black/55 leading-relaxed">{ar ? g.arDesc : g.enDesc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── PARTNERS (for this sector) ─── */}
        {sectorPartners.length > 0 && (
          <section className="py-24 bg-[#f0f0ee] dark:bg-[#0d0d0d]">
            <div className="container mx-auto px-6 md:px-10 max-w-6xl">
              <motion.div {...fade(0)} className="text-center max-w-xl mx-auto mb-14">
                <span className="inline-block text-[11px] font-black uppercase tracking-widest text-black/40 dark:text-white/40 mb-4">
                  {ar ? "شركاء النجاح" : "SUCCESS PARTNERS"}
                </span>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
                  {ar ? `أبرز عملائنا في ${sector.arName}` : `Our Top ${sector.enName} Partners`}
                </h2>
                <p className="text-black/55 dark:text-white/55 text-sm leading-relaxed">
                  {ar ? "علامات تجارية حقيقية بنت مشاريعها مع كيروكس." : "Real brands that built their projects with Qirox."}
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sectorPartners.map((p, i) => (
                  <motion.div key={p.id} {...fade(i * 0.5)} className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.07] dark:border-white/[0.07] overflow-hidden">
                    {/* Iframe preview */}
                    {p.websiteUrl ? (
                      <div className="h-48 relative">
                        <PartnerIframe url={p.websiteUrl} name={p.name} />
                      </div>
                    ) : p.logoUrl ? (
                      <div className="h-48 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-800">
                        <img src={p.logoUrl} alt={p.name} className="max-h-20 max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="h-48 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                        <Globe className="w-12 h-12 text-black/20 dark:text-white/20" />
                      </div>
                    )}

                    {/* Partner info */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-2">
                        {p.logoUrl && (
                          <img src={p.logoUrl} alt={p.name} className="h-8 w-auto object-contain" />
                        )}
                        <h3 className="font-black text-sm">
                          {ar ? (p.nameAr || p.name) : p.name}
                        </h3>
                      </div>
                      {(p.descriptionAr || p.description) && (
                        <p className="text-xs text-black/50 dark:text-white/50 leading-relaxed">
                          {ar ? (p.descriptionAr || p.description) : (p.description || p.descriptionAr)}
                        </p>
                      )}
                      {p.websiteUrl && (
                        <a
                          href={p.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {ar ? "زيارة الموقع" : "Visit Website"}
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── CTA FINAL ─── */}
        <section className="py-24 bg-white dark:bg-gray-950">
          <div className="container mx-auto px-6 md:px-10 max-w-3xl text-center">
            <motion.div {...fade(0)}>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-5">
                {ar ? "جاهز تبدأ مشروعك؟" : "Ready to Start Your Project?"}
              </h2>
              <p className="text-black/55 dark:text-white/55 text-base leading-relaxed mb-10 max-w-xl mx-auto">
                {ar
                  ? "تحدث مع فريقنا الآن — بدون التزام، بدون ضغط. نسمعك ونقترح لك الحل المناسب مجاناً."
                  : "Talk to our team now — no commitment, no pressure. We listen and propose the right solution for free."}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/start">
                  <Button size="lg" className="bg-black text-white hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90 rounded-full h-12 px-10 font-bold gap-2">
                    {ar ? "ابدأ مشروعك مجاناً" : "Start Your Project Free"}
                    <Arrow className="w-4 h-4" />
                  </Button>
                </Link>
                <a href="https://wa.me/966500000000" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="rounded-full h-12 px-10 font-bold border-black/15 dark:border-white/15">
                    {ar ? "واتساب مباشر" : "WhatsApp Direct"}
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
