import { useEffect } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
 * SEO + AEO Head — Mohammed Ali Al-Dabbani (CEO & Co-Founder, QIROX Studio)
 * Injects: Person · ProfilePage · FAQPage · BreadcrumbList schemas
 * ───────────────────────────────────────────────────────────────────────────── */
function SEOHead() {
  useEffect(() => {
    const BASE = "https://qiroxstudio.online";
    const PAGE = `${BASE}/mohammed-aldabbani`;
    const HERO_IMG = `${BASE}/mohammed-aldabbani-ceo.jpg`;

    document.title =
      "محمد الدباني — الرئيس التنفيذي وشريك مؤسس | QIROX Studio | Mohammed Aldabbani CEO & Co-Founder";

    const setMeta = (key: string, value: string, prop = false) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.content = value;
    };

    /* ── Primary SEO ── */
    setMeta("description",
      "محمد الدباني — الرئيس التنفيذي (CEO) وشريك مؤسس في شركة QIROX Studio، المملكة العربية السعودية. يقود الرؤية الاستراتيجية ومسيرة الشركة نحو الريادة التقنية. Mohammed Aldabbani, Chief Executive Officer & Co-Founder at QIROX Studio, Saudi Arabia.");
    setMeta("keywords",
      "محمد الدباني, محمد علي الدباني, محمد الدبانى, الدباني كيروكس, الرئيس التنفيذي كيروكس, CEO كيروكس, شريك مؤسس كيروكس, Mohammed Aldabbani, Mohammed Ali Al-Dabbani, Mohammed Al-Dabbani, mohmmed aldbani, mohammed aldabbani ceo, mohammed aldabbani qirox, QIROX CEO, كيروكس ستوديو");
    setMeta("robots", "index, follow, max-image-preview:large, max-snippet:-1");
    setMeta("author", "Mohammed Aldabbani — QIROX Studio");

    /* ── Open Graph ── */
    setMeta("og:type", "profile", true);
    setMeta("og:title", "محمد الدباني — CEO وشريك مؤسس | Mohammed Aldabbani | QIROX Studio", true);
    setMeta("og:description",
      "الرئيس التنفيذي والشريك المؤسس في QIROX Studio، المملكة العربية السعودية. Chief Executive Officer & Co-Founder at QIROX Studio, Saudi Arabia.", true);
    setMeta("og:url", PAGE, true);
    setMeta("og:image", HERO_IMG, true);
    setMeta("og:image:secure_url", HERO_IMG, true);
    setMeta("og:image:width", "1080", true);
    setMeta("og:image:height", "1350", true);
    setMeta("og:image:alt", "Mohammed Aldabbani CEO & Co-Founder QIROX Studio — محمد الدباني الرئيس التنفيذي كيروكس", true);
    setMeta("og:image:type", "image/jpeg", true);
    setMeta("og:site_name", "QIROX Studio", true);
    setMeta("og:locale", "ar_SA", true);
    setMeta("og:locale:alternate", "en_US", true);
    setMeta("profile:first_name", "Mohammed Ali", true);
    setMeta("profile:last_name", "Al-Dabbani", true);
    setMeta("profile:username", "mohammed-aldabbani", true);

    /* ── Twitter Card ── */
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", "Mohammed Aldabbani — CEO & Co-Founder at QIROX Studio");
    setMeta("twitter:description",
      "Chief Executive Officer & Co-Founder at QIROX Studio, Saudi Arabia. محمد الدباني، الرئيس التنفيذي والشريك المؤسس، كيروكس ستوديو.");
    setMeta("twitter:image", HERO_IMG);
    setMeta("twitter:image:alt", "Mohammed Aldabbani CEO QIROX Studio");

    /* ── Canonical ── */
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = PAGE;

    /* ── JSON-LD Schemas ── */
    const schemas = [
      /* 1. Person — triggers Google Knowledge Panel */
      {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": `${PAGE}#person`,
        "name": "Mohammed Aldabbani",
        "alternateName": [
          "محمد الدباني",
          "محمد علي الدباني",
          "محمد الدبانى",
          "Mohammed Ali Al-Dabbani",
          "Mohammed Al-Dabbani",
          "mohmmed aldbani",
          "محمد الدباني CEO",
          "محمد الدباني كيروكس"
        ],
        "givenName": "Mohammed Ali",
        "familyName": "Al-Dabbani",
        "nationality": {
          "@type": "Country",
          "name": "Saudi Arabia",
          "sameAs": "https://www.wikidata.org/wiki/Q851"
        },
        "birthPlace": {
          "@type": "Country",
          "name": "Saudi Arabia",
          "sameAs": "https://www.wikidata.org/wiki/Q851"
        },
        "description":
          "محمد الدباني الرئيس التنفيذي (CEO) والشريك المؤسس في شركة QIROX Studio السعودية. يقود الرؤية الاستراتيجية للشركة ويوجّه مسيرتها نحو الريادة في التقنية والأنظمة الرقمية. Mohammed Aldabbani is the Chief Executive Officer and Co-Founder of QIROX Studio, a leading Saudi technology company. He drives the company's strategic vision and business growth.",
        "jobTitle": ["Chief Executive Officer", "Co-Founder", "Partner"],
        "hasOccupation": {
          "@type": "Occupation",
          "name": "Chief Executive Officer",
          "description": "يقود الرؤية الاستراتيجية والنمو التجاري لشركة QIROX Studio | Leads strategic vision and business growth of QIROX Studio",
          "occupationLocation": { "@type": "Country", "name": "Saudi Arabia" }
        },
        "url": PAGE,
        "mainEntityOfPage": {
          "@type": "ProfilePage",
          "@id": PAGE
        },
        "image": [
          {
            "@type": "ImageObject",
            "url": `${BASE}/mohammed-aldabbani-ceo.jpg`,
            "name": "Mohammed Aldabbani CEO QIROX Studio official portrait — محمد الدباني الرئيس التنفيذي كيروكس",
            "description": "محمد الدباني الرئيس التنفيذي والشريك المؤسس كيروكس ستوديو — صورة رسمية",
            "representativeOfPage": true
          }
        ],
        "worksFor": {
          "@type": "Organization",
          "@id": `${BASE}/#organization`,
          "name": "QIROX Studio",
          "url": BASE,
          "logo": `${BASE}/qirox-icon.png`
        },
        "knowsAbout": [
          "Business Strategy", "الاستراتيجية التجارية",
          "Digital Transformation", "التحول الرقمي",
          "Technology Leadership", "قيادة التقنية",
          "Entrepreneurship", "ريادة الأعمال",
          "Product Management", "إدارة المنتجات",
          "SaaS", "Enterprise Solutions", "Customer Success"
        ],
        "sameAs": [PAGE, `${BASE}/team/mohammed-aldabbani`]
      },

      /* 2. ProfilePage */
      {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "@id": PAGE,
        "url": PAGE,
        "name": "محمد الدباني — Mohammed Aldabbani | QIROX Studio",
        "description":
          "الصفحة الرسمية لمحمد الدباني، الرئيس التنفيذي والشريك المؤسس في QIROX Studio. Official profile of Mohammed Aldabbani, CEO & Co-Founder at QIROX Studio.",
        "mainEntity": { "@id": `${PAGE}#person` },
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "QIROX Studio", "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "فريق العمل | Team", "item": `${BASE}/about` },
            { "@type": "ListItem", "position": 3, "name": "محمد الدباني — Mohammed Aldabbani", "item": PAGE }
          ]
        },
        "inLanguage": ["ar", "en"],
        "isPartOf": { "@id": `${BASE}/#website` }
      },

      /* 3. FAQPage — AEO / "People also ask" */
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "من هو محمد الدباني؟",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "محمد الدباني هو الرئيس التنفيذي (CEO) والشريك المؤسس في شركة QIROX Studio، إحدى شركات التقنية الرائدة في المملكة العربية السعودية. يقود الرؤية الاستراتيجية للشركة ويوجّه مسيرتها نحو الريادة في الأنظمة الرقمية والذكاء الاصطناعي."
            }
          },
          {
            "@type": "Question",
            "name": "Who is Mohammed Aldabbani?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Mohammed Aldabbani is the Chief Executive Officer (CEO) and Co-Founder at QIROX Studio, a leading Saudi technology company. He drives the company's strategic vision and growth, serving clients across Saudi Arabia and the Gulf region."
            }
          },
          {
            "@type": "Question",
            "name": "ما منصب محمد الدباني في QIROX Studio؟",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "يشغل محمد الدباني منصب الرئيس التنفيذي (CEO) وشريك مؤسس في شركة QIROX Studio. يقود الرؤية الاستراتيجية والنمو التجاري ويشرف على جميع عمليات الشركة."
            }
          },
          {
            "@type": "Question",
            "name": "What is Mohammed Aldabbani's role at QIROX Studio?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Mohammed Aldabbani serves as Chief Executive Officer (CEO) and Co-Founder at QIROX Studio. He leads the company's strategic direction, business development, and oversees all operations across Saudi Arabia and the region."
            }
          },
          {
            "@type": "Question",
            "name": "من هو الرئيس التنفيذي لشركة QIROX Studio؟",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "الرئيس التنفيذي (CEO) لشركة QIROX Studio هو محمد الدباني، وهو أيضاً شريك مؤسس في الشركة. سعودي الجنسية ويقود الرؤية الاستراتيجية للشركة."
            }
          },
          {
            "@type": "Question",
            "name": "Who is the CEO of QIROX Studio?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The CEO of QIROX Studio is Mohammed Aldabbani. He is also a co-founder and partner of the company, Saudi national, leading its strategic vision and market expansion across the Gulf region."
            }
          },
          {
            "@type": "Question",
            "name": "ما جنسية محمد الدباني؟",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "محمد الدباني سعودي الجنسية، يعمل ويقيم في المملكة العربية السعودية حيث يقود شركة QIROX Studio."
            }
          },
          {
            "@type": "Question",
            "name": "ما علاقة محمد الدباني بيوسف درويش في كيروكس؟",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "محمد الدباني ويوسف محمد درويش هما الشريكان المؤسسان لشركة QIROX Studio. محمد يشغل منصب الرئيس التنفيذي (CEO)، ويوسف يشغل منصب المدير التنفيذي التقني (CTO). معاً يقودان رؤية الشركة نحو الريادة في الحلول الرقمية."
            }
          }
        ]
      }
    ];

    const ids = ["ld-mohammed-person", "ld-mohammed-profile", "ld-mohammed-faq"];
    ids.forEach((id, i) => {
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement("script");
        el.id = id;
        (el as HTMLScriptElement).type = "application/ld+json";
        document.head.appendChild(el);
      }
      el.textContent = JSON.stringify(schemas[i]);
    });

    return () => { ids.forEach(id => document.getElementById(id)?.remove()); };
  }, []);
  return null;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Expertise data
 * ───────────────────────────────────────────────────────────────────────────── */
const expertise = [
  { en: "Business Strategy", ar: "الاستراتيجية التجارية", icon: "📊" },
  { en: "Digital Transformation", ar: "التحول الرقمي", icon: "🔄" },
  { en: "Product Management", ar: "إدارة المنتجات", icon: "🎯" },
  { en: "Market Expansion", ar: "التوسع في السوق", icon: "🌍" },
  { en: "Tech Leadership", ar: "قيادة التقنية", icon: "🚀" },
  { en: "Enterprise Sales", ar: "مبيعات المؤسسات", icon: "🤝" },
];

const faqs = [
  {
    q_ar: "من هو محمد الدباني؟",
    q_en: "Who is Mohammed Aldabbani?",
    a_ar: "محمد الدباني هو الرئيس التنفيذي (CEO) والشريك المؤسس في شركة QIROX Studio. يقود الرؤية الاستراتيجية للشركة ونموها في السوق السعودي والخليجي.",
    a_en: "Mohammed Aldabbani is the Chief Executive Officer (CEO) and Co-Founder at QIROX Studio, a leading Saudi technology company. He drives the company's strategic vision and market growth.",
  },
  {
    q_ar: "ما منصبه في QIROX Studio؟",
    q_en: "What is his role at QIROX Studio?",
    a_ar: "يشغل محمد الدباني منصب الرئيس التنفيذي (CEO) وشريك مؤسس. يشرف على الرؤية الاستراتيجية، التوسع التجاري، وجميع عمليات الشركة.",
    a_en: "Mohammed serves as Chief Executive Officer (CEO) and Co-Founder at QIROX Studio. He oversees strategic vision, business expansion, and all company operations.",
  },
  {
    q_ar: "من هم مؤسسو QIROX Studio؟",
    q_en: "Who are the founders of QIROX Studio?",
    a_ar: "تأسست شركة QIROX Studio على يد محمد الدباني (CEO) ويوسف محمد درويش (CTO). معاً يقودان الرؤية الكاملة للشركة نحو الريادة في الحلول الرقمية.",
    a_en: "QIROX Studio was co-founded by Mohammed Aldabbani (CEO) and Youssef Mohamed Darwish (CTO). Together they lead the company's complete vision in digital solutions.",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
 * Page Component
 * ───────────────────────────────────────────────────────────────────────────── */
export default function TeamMohammedAlDabbani() {
  return (
    <>
      <SEOHead />
      <div className="min-h-screen bg-white font-sans" lang="ar" dir="rtl">

        {/* ── HERO ── */}
        <section
          className="relative overflow-hidden bg-[#070714] text-white"
          style={{ minHeight: 520 }}
          itemScope
          itemType="https://schema.org/Person"
        >
          {/* Decorative orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/[0.03] blur-3xl" />
            <div className="absolute top-1/2 right-10 w-72 h-72 rounded-full bg-white/[0.02] blur-2xl" />
            <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-white/[0.04] blur-2xl" />
          </div>

          <div className="relative max-w-5xl mx-auto px-6 pt-14 pb-20 flex flex-col md:flex-row items-center gap-10">

            {/* Portrait */}
            <div className="flex-shrink-0 relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-white/0 scale-105 blur-lg" />
              <img
                src="/mohammed-aldabbani-ceo.jpg"
                alt="محمد الدباني الرئيس التنفيذي وشريك مؤسس كيروكس ستوديو — Mohammed Aldabbani CEO & Co-Founder QIROX Studio"
                title="Mohammed Aldabbani — Chief Executive Officer & Co-Founder at QIROX Studio"
                className="relative w-52 h-64 md:w-64 md:h-80 object-cover object-top rounded-2xl border border-white/10 shadow-2xl"
                loading="eager"
                fetchPriority="high"
                itemProp="image"
              />
              {/* Badge */}
              <div className="absolute -bottom-3 -left-3 bg-white text-black text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg tracking-wide uppercase">
                CEO · Co-Founder
              </div>
            </div>

            {/* Info */}
            <div className="text-center md:text-right">
              <p className="text-xs font-bold tracking-[0.3em] text-white/30 uppercase mb-4">
                QIROX Studio — كيروكس ستوديو
              </p>

              {/* Arabic name — largest for Arabic Google */}
              <h1 className="text-5xl md:text-6xl font-black leading-tight mb-2" itemProp="alternateName">
                محمد الدباني
              </h1>
              <h2 className="text-xl md:text-2xl font-bold text-white/60 mb-1" itemProp="name">
                Mohammed Aldabbani
              </h2>
              <p className="text-sm text-white/30 mb-6">
                Mohammed Ali Al-Dabbani · محمد علي الدباني
              </p>

              {/* Role badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-6">
                <span className="px-4 py-1.5 rounded-full border border-white/15 text-sm font-bold text-white/90 bg-white/5 backdrop-blur-sm">
                  Chief Executive Officer
                </span>
                <span className="px-4 py-1.5 rounded-full border border-white/15 text-sm font-bold text-white/90 bg-white/5 backdrop-blur-sm">
                  Co-Founder · شريك مؤسس
                </span>
              </div>

              {/* Quick facts */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-white/40">
                <span>🇸🇦 سعودي · Saudi</span>
                <span>·</span>
                <span>🏢 QIROX Studio</span>
                <span>·</span>
                <span>📍 الرياض، السعودية</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── IDENTITY STRIP ── */}
        <section className="bg-[#0e0e1e] py-5 px-6 text-center overflow-x-auto">
          <p className="text-white/25 text-xs tracking-widest whitespace-nowrap">
            محمد الدباني&nbsp;·&nbsp;محمد علي الدباني&nbsp;·&nbsp;محمد الدبانى&nbsp;·&nbsp;الدباني كيروكس&nbsp;·&nbsp;
            Mohammed Aldabbani&nbsp;·&nbsp;Mohammed Ali Al-Dabbani&nbsp;·&nbsp;Mohammed Al-Dabbani&nbsp;·&nbsp;
            mohmmed aldbani&nbsp;·&nbsp;CEO QIROX&nbsp;·&nbsp;الرئيس التنفيذي كيروكس&nbsp;·&nbsp;شريك مؤسس&nbsp;·&nbsp;السعودية
          </p>
        </section>

        {/* ── BIOGRAPHY ── */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-0.5 bg-black" />
                <h2 className="text-2xl font-black text-black">من هو محمد الدباني؟</h2>
              </div>
              <p className="text-gray-600 leading-loose text-[15px] mb-4">
                <strong className="text-black">محمد علي الدباني</strong>، سعودي الجنسية، الرئيس التنفيذي (CEO)
                والشريك المؤسس في <strong className="text-black">شركة QIROX Studio</strong>، إحدى شركات
                التقنية الرائدة في المملكة العربية السعودية المتخصصة في بناء الأنظمة الرقمية الذكية.
              </p>
              <p className="text-gray-600 leading-loose text-[15px] mb-4">
                يقود محمد الرؤية الاستراتيجية الكاملة للشركة ويوجّه مسيرتها نحو الريادة في السوق السعودي
                والخليجي، مع التركيز على تقديم حلول رقمية مبتكرة تُحدث فارقاً حقيقياً في قطاع التقنية.
              </p>
              <p className="text-gray-500 leading-loose text-[14px]">
                أسّس محمد شركة QIROX Studio مع شريكه يوسف محمد درويش برؤية واضحة: بناء منصة تقنية سعودية
                تُحوّل أفكار الشركات إلى أنظمة رقمية متكاملة وقابلة للتوسع.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-0.5 bg-black" />
                <h2 className="text-2xl font-black text-black">About Mohammed Aldabbani</h2>
              </div>
              <p className="text-gray-600 leading-loose text-[15px] mb-4">
                <strong className="text-black">Mohammed Ali Al-Dabbani</strong>, Saudi national, is the
                Chief Executive Officer (CEO) and Co-Founder of{" "}
                <strong className="text-black">QIROX Studio</strong>, a leading Saudi technology company
                specializing in intelligent digital solutions.
              </p>
              <p className="text-gray-600 leading-loose text-[15px] mb-4">
                Mohammed leads the company's complete strategic vision, driving its growth across the
                Saudi and Gulf markets with a focus on delivering innovative digital platforms that create
                real impact for enterprises and institutions.
              </p>
              <p className="text-gray-500 leading-loose text-[14px]">
                He co-founded QIROX Studio alongside Youssef Mohamed Darwish (CTO) with a clear mission:
                to build a Saudi tech powerhouse that turns business ideas into scalable digital systems.
              </p>
            </div>
          </div>
        </section>

        {/* ── PROFILE CARD ── */}
        <section className="bg-[#f8f8fb] py-12 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-black text-black mb-8 text-center">
              معلومات الملف الشخصي · Profile Information
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label_ar: "الاسم الكامل", label_en: "Full Name", value_ar: "محمد علي الدباني", value_en: "Mohammed Ali Al-Dabbani" },
                { label_ar: "الجنسية", label_en: "Nationality", value_ar: "🇸🇦 سعودي", value_en: "🇸🇦 Saudi Arabian" },
                { label_ar: "المنصب", label_en: "Position", value_ar: "CEO · شريك مؤسس", value_en: "CEO · Co-Founder" },
                { label_ar: "الشركة", label_en: "Company", value_ar: "كيروكس ستوديو", value_en: "QIROX Studio" },
                { label_ar: "موقع العمل", label_en: "Based In", value_ar: "الرياض، السعودية", value_en: "Riyadh, Saudi Arabia" },
                { label_ar: "المجال", label_en: "Industry", value_ar: "تقنية المعلومات", value_en: "Information Technology" },
                { label_ar: "الشريك", label_en: "Co-Founder with", value_ar: "يوسف محمد درويش (CTO)", value_en: "Youssef M. Darwish (CTO)" },
                { label_ar: "الموقع الرسمي", label_en: "Website", value_ar: "qiroxstudio.online", value_en: "qiroxstudio.online" },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-black/[0.05] shadow-sm">
                  <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest mb-1">{item.label_en} · {item.label_ar}</p>
                  <p className="text-sm font-black text-black">{item.value_en}</p>
                  <p className="text-xs text-black/40">{item.value_ar}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PHOTO SHOWCASE ── */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-black mb-2">
              صور محمد الدباني · Photos
            </h2>
            <p className="text-sm text-gray-400">
              محمد الدباني الرئيس التنفيذي كيروكس ستوديو · Mohammed Aldabbani CEO QIROX Studio Saudi Arabia
            </p>
          </div>
          <div className="flex justify-center">
            <figure className="m-0 w-full max-w-sm group">
              <div className="overflow-hidden rounded-2xl bg-gray-100">
                <img
                  src="/mohammed-aldabbani-ceo.jpg"
                  alt="محمد الدباني الرئيس التنفيذي وشريك مؤسس كيروكس ستوديو السعودية — Mohammed Aldabbani CEO Co-Founder QIROX Studio Saudi Arabia"
                  title="Mohammed Ali Al-Dabbani — CEO & Co-Founder, QIROX Studio"
                  className="w-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  loading="eager"
                  itemProp="image"
                />
              </div>
              <figcaption className="text-center mt-4">
                <p className="font-black text-black text-sm">محمد الدباني — الرئيس التنفيذي، كيروكس ستوديو</p>
                <p className="text-gray-400 text-xs mt-0.5">Mohammed Aldabbani — CEO & Co-Founder, QIROX Studio</p>
              </figcaption>
            </figure>
          </div>
        </section>

        {/* ── EXPERTISE ── */}
        <section className="bg-[#070714] py-14 px-6 text-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-black mb-8 text-center">
              مجالات الخبرة · Areas of Expertise
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {expertise.map((item, i) => (
                <div key={i} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.07] transition-colors">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <p className="font-black text-white text-sm">{item.en}</p>
                  <p className="text-white/40 text-xs mt-0.5">{item.ar}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── LEADERSHIP TEAM (cross-link Youssef & Mohammed) ── */}
        <section className="max-w-5xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-black text-black mb-8 text-center">
            قيادة كيروكس ستوديو · QIROX Leadership Team
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Mohammed card — active */}
            <div className="bg-[#070714] rounded-2xl p-6 text-white text-center">
              <img
                src="/mohammed-aldabbani-ceo.jpg"
                alt="محمد الدباني CEO كيروكس"
                className="w-20 h-20 rounded-full object-cover object-top mx-auto mb-4 border-2 border-white/10"
              />
              <p className="font-black text-white text-base">محمد الدباني</p>
              <p className="text-white/40 text-xs">Mohammed Aldabbani</p>
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-white/10 text-[11px] font-bold text-white">CEO · Co-Founder</span>
            </div>
            {/* Youssef card — link */}
            <a href="/youssef-darwish" className="bg-gray-50 border border-black/[0.06] rounded-2xl p-6 text-center hover:shadow-md transition-shadow block">
              <img
                src="/youssef-darwish-cto-qirox-1.jpg"
                alt="يوسف محمد درويش CTO كيروكس"
                className="w-20 h-20 rounded-full object-cover object-top mx-auto mb-4 border-2 border-black/[0.06]"
              />
              <p className="font-black text-black text-base">يوسف محمد درويش</p>
              <p className="text-black/40 text-xs">Youssef Mohamed Darwish</p>
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-black/[0.06] text-[11px] font-bold text-black/60">CTO · Co-Founder</span>
            </a>
          </div>
        </section>

        {/* ── FAQ (AEO) ── */}
        <section className="max-w-5xl mx-auto px-6 py-14 border-t border-black/[0.05]">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-black mb-2">أسئلة شائعة · FAQ</h2>
            <p className="text-sm text-gray-400">محمد الدباني — الأسئلة الأكثر بحثاً</p>
          </div>
          <div className="space-y-5">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-black/[0.08] rounded-2xl p-6"
                itemScope itemType="https://schema.org/Question">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <p className="font-black text-black text-[15px]" itemProp="name">{faq.q_ar}</p>
                  <p className="font-bold text-black/60 text-[14px]">{faq.q_en}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4"
                  itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
                  <p className="text-gray-600 text-[14px] leading-relaxed" itemProp="text">{faq.a_ar}</p>
                  <p className="text-gray-400 text-[13px] leading-relaxed">{faq.a_en}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── COMPANY LINK ── */}
        <section className="bg-[#070714] py-14 px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <img src="/qirox-icon.png" alt="QIROX Studio Logo" className="w-14 h-14 mx-auto mb-5 opacity-80" />
            <p className="text-white/40 text-xs tracking-widest uppercase mb-3">شركة</p>
            <h3 className="text-2xl font-black text-white mb-2">QIROX Studio · كيروكس ستوديو</h3>
            <p className="text-white/40 text-sm mb-6">مصنع الأنظمة الرقمية · Saudi Arabia · الرياض</p>
            <a href="https://qiroxstudio.online"
              className="inline-block px-8 py-3 bg-white text-black font-black rounded-xl hover:bg-white/90 transition-colors text-sm">
              زيارة الموقع · Visit Website
            </a>
          </div>
        </section>

        {/* ── HIDDEN SEO text block ── */}
        <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0.001 }} aria-hidden="true">
          <p>
            محمد الدباني | محمد علي الدباني | محمد الدبانى | الدباني كيروكس |
            Mohammed Aldabbani | Mohammed Ali Al-Dabbani | Mohammed Al-Dabbani |
            mohmmed aldbani | CEO QIROX Studio | Chief Executive Officer QIROX |
            Co-Founder QIROX | شريك مؤسس كيروكس | الرئيس التنفيذي كيروكس |
            سعودي | Saudi Arabian | الرياض السعودية | Riyadh Saudi Arabia |
            QIROX Studio Saudi Arabia | كيروكس ستوديو | مؤسس كيروكس
          </p>
        </div>

      </div>
    </>
  );
}
