import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { AboutReferenceLayout } from "@/components/about/AboutReferenceLayout";
import { useI18n } from "@/lib/i18n";
import { useSEO } from "@/hooks/use-seo";
import "./AboutReferencePage.css";

export default function AboutReferencePage() {
  const { lang, dir } = useI18n();

  useSEO({
    title: lang === "ar" ? "من نحن | كيروكس — المنظومة التقنية لبناء البنية التحتية الرقمية للأعمال" : "About QIROX | Digital Business Infrastructure Company",
    description: lang === "ar"
      ? "تعرف على كيروكس: منظومة تقنية تبني البنية التحتية الرقمية للشركات عبر الحلول الرقمية المتكاملة، الأتمتة، الذكاء الاصطناعي، المنتجات التقنية، والمعرفة."
      : "Meet QIROX, a technology ecosystem building digital business infrastructure through integrated solutions, automation, artificial intelligence, products, and knowledge.",
    keywords: "من نحن كيروكس, QIROX, Qirox Studio, هوية كيروكس, رؤية كيروكس, رسالة كيروكس, البنية التحتية الرقمية للأعمال, شركة تقنية سعودية, الذكاء الاصطناعي, الأتمتة, محمد الدباني, يوسف درويش",
    canonical: "/about",
    ogType: "website",
    ogImage: "https://qiroxstudio.online/og-cover.png",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": "https://qiroxstudio.online/about#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "ما هي كيروكس؟",
          acceptedAnswer: {
            "@type": "Answer",
            text: "كيروكس هي منظومة تقنية لبناء البنية التحتية الرقمية للشركات، تجمع بين الحلول الرقمية المتكاملة، الأتمتة، الذكاء الاصطناعي، المنتجات التقنية، والمعرفة.",
          },
        },
        {
          "@type": "Question",
          name: "ماذا يعني اسم QIROX؟",
          acceptedAnswer: {
            "@type": "Answer",
            text: "QIROX اختصار لـ Quality الجودة، Innovation الابتكار، Reliability الموثوقية، Optimization التحسين، وXperience التجربة.",
          },
        },
        {
          "@type": "Question",
          name: "ما رؤية كيروكس؟",
          acceptedAnswer: {
            "@type": "Answer",
            text: "تطمح كيروكس إلى أن تصبح المنظومة التقنية الأكثر تأثيراً في تمكين الشركات ورواد الأعمال من بناء أعمال أكثر كفاءة واستدامة، انطلاقاً من المملكة العربية السعودية إلى الأسواق العالمية.",
          },
        },
        {
          "@type": "Question",
          name: "هل ينتهي دور كيروكس عند تسليم المشروع؟",
          acceptedAnswer: {
            "@type": "Answer",
            text: "لا. تؤمن كيروكس بأن تسليم المشروع ليس نهاية العلاقة مع العميل، بل بدايتها؛ فبعد الإطلاق تبدأ مرحلة التطوير والتحسين وقياس الأداء ودعم التوسع.",
          },
        },
        {
          "@type": "Question",
          name: "من يقود كيروكس؟",
          acceptedAnswer: {
            "@type": "Answer",
            text: "يقود كيروكس محمد بن علي الدباني بصفته الرئيس التنفيذي، ويوسف محمد درويش بصفته المدير التنفيذي التقني.",
          },
        },
      ],
    },
  });

  return (
      <div className="about-reference-page min-h-screen bg-[#f8f9f7] text-[#1c2420] dark:bg-[#0b100e] dark:text-[#e8efeb]" dir={dir}>
      <Navigation />
        <main className="pt-24">
        <AboutReferenceLayout lang={lang} />
      </main>
      <Footer />
    </div>
  );
}