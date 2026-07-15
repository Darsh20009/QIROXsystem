import { useSEO } from "@/hooks/use-seo";
import { useI18n } from "@/lib/i18n";
import PilotNav from "./sections/PilotNav";
import HeroSection from "./sections/HeroSection";
import ServicesSection from "./sections/ServicesSection";
import PortfolioSection from "./sections/PortfolioSection";
import TechStackSection from "./sections/TechStackSection";
import CtaSection from "./sections/CtaSection";
import PilotFooter from "./sections/PilotFooter";

export default function LandingDSV2Page() {
  const { t, lang } = useI18n();
  const ar = lang === "ar";

  useSEO({
    title: ar ? "كيروكس استوديو | مصنع الأنظمة الرقمية" : "QIROX Studio | Digital Systems Factory",
    description: t("dsv2.hero.subtitle"),
    keywords: "كيروكس استوديو, Qirox Studio, شركة برمجة الرياض, أنظمة مطاعم, متاجر إلكترونية, أنظمة مؤسسية, بوابات دفع سعودية",
    canonical: "/",
    ogImage: "https://qiroxstudio.online/qirox-icon.png",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Qirox Studio",
        "url": "https://qiroxstudio.online",
        "logo": "https://qiroxstudio.online/qirox-icon.png",
        "description": ar
          ? "شركة برمجة سعودية متخصصة في بناء الأنظمة الرقمية الجاهزة للإنتاج: متاجر إلكترونية، أنظمة مطاعم، ومنصات مؤسسية"
          : "Saudi software company specialized in production-ready digital systems: e-commerce stores, restaurant systems, and institutional platforms",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "الرياض",
          "addressRegion": "منطقة الرياض",
          "addressCountry": "SA",
        },
        "sameAs": ["https://qiroxstudio.online"],
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": ar ? "الرئيسية" : "Home", "item": "https://qiroxstudio.online/" },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": [
          {
            "@type": "Service",
            "position": 1,
            "name": ar ? "استشارة تقنية" : "Technical Consulting",
            "description": ar
              ? "استشارة تقنية استراتيجية لكبار المديرين التنفيذيين. مراجعات المعمارية واختيار التقنيات وخرائط التحول الرقمي. يبدأ من 1,875 ر.س / جلسة."
              : "Strategic technology advisory for executives: architecture reviews, tech stack selection, and digital transformation roadmaps. Starting at 1,875 SAR / session.",
            "provider": { "@type": "Organization", "name": "Qirox Studio" },
            "areaServed": "SA",
          },
          {
            "@type": "Service",
            "position": 2,
            "name": ar ? "تطوير مواقع" : "Web Development",
            "description": ar
              ? "بناء مواقع ومنصات ويب احترافية. يبدأ من 18,750 ر.س / مشروع."
              : "Professional website and web platform development. Starting at 18,750 SAR / project.",
            "provider": { "@type": "Organization", "name": "Qirox Studio" },
            "areaServed": "SA",
          },
          {
            "@type": "Service",
            "position": 3,
            "name": ar ? "الذكاء الاصطناعي والتعلم الآلي" : "AI & Machine Learning",
            "description": ar
              ? "حلول ذكاء اصطناعي وتعلم آلي مخصصة للأعمال. يبدأ من 37,500 ر.س / مشروع."
              : "Custom AI and machine learning solutions for business. Starting at 37,500 SAR / project.",
            "provider": { "@type": "Organization", "name": "Qirox Studio" },
            "areaServed": "SA",
          },
          {
            "@type": "Service",
            "position": 4,
            "name": ar ? "تحليل أعمال" : "Business Analysis",
            "description": ar
              ? "تحليل احتياجات الأعمال وتصميم الحلول. يبدأ من 11,250 ر.س / تعاقد."
              : "Business needs analysis and solution design. Starting at 11,250 SAR / engagement.",
            "provider": { "@type": "Organization", "name": "Qirox Studio" },
            "areaServed": "SA",
          },
          {
            "@type": "Service",
            "position": 5,
            "name": ar ? "إدارة مشاريع" : "Project Management",
            "description": ar
              ? "إدارة مشاريع تقنية احترافية من التخطيط حتى التسليم. يبدأ من 7,500 ر.س / شهر."
              : "Professional technical project management from planning to delivery. Starting at 7,500 SAR / month.",
            "provider": { "@type": "Organization", "name": "Qirox Studio" },
            "areaServed": "SA",
          },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": ar ? "ما هي طرق الدفع المتاحة؟" : "What payment methods are available?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": ar
                ? "ندعم مدى، Apple Pay، STC Pay، تمارا، وتابي، بالإضافة إلى التحويل البنكي المباشر."
                : "We support Mada, Apple Pay, STC Pay, Tamara, and Tabby, in addition to direct bank transfer.",
            },
          },
          {
            "@type": "Question",
            "name": ar ? "هل الأنظمة تدعم اللغتين العربية والإنجليزية؟" : "Do the systems support both Arabic and English?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": ar
                ? "نعم، جميع الأنظمة مبنية بدعم أصيل للغة العربية (RTL) والإنجليزية من مستوى البنية التحتية."
                : "Yes, every system is built with native right-to-left Arabic support and English from the infrastructure level.",
            },
          },
          {
            "@type": "Question",
            "name": ar ? "ما هي الخدمات التي تقدمونها؟" : "What services do you offer?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": ar
                ? "نقدم استشارات تقنية، تطوير مواقع، حلول ذكاء اصطناعي وتعلم آلي، تحليل أعمال، وإدارة مشاريع، إلى جانب أنظمة وقوالب جاهزة لقطاعات متعددة مثل المتاجر الإلكترونية والمنصات التعليمية."
                : "We offer technical consulting, web development, AI and machine learning solutions, business analysis, and project management, alongside ready-made systems and templates for sectors like e-commerce and education platforms.",
            },
          },
        ],
      },
    ],
  });

  return (
    <div className="min-h-[100dvh] bg-ds-background text-ds-foreground font-sans antialiased overflow-x-hidden" dir={lang === "ar" ? "rtl" : "ltr"}>
      <PilotNav />
      <main>
        <HeroSection />
        <ServicesSection />
        <PortfolioSection />
        <TechStackSection />
        <CtaSection />
      </main>
      <PilotFooter />
    </div>
  );
}
