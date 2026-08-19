import { useEffect } from "react";
import { Link } from "wouter";

/* ─────────────────────────────────────────────────────────────────────────────
 * SEO + AEO Head
 * Injects:
 *  • All primary/OG/Twitter meta tags
 *  • Schema.org Person  (Knowledge Panel trigger)
 *  • Schema.org ProfilePage (wraps the Person for Google's entity disambiguation)
 *  • Schema.org FAQPage  (AEO — surfaces in "People also ask" + AI search)
 *  • Schema.org BreadcrumbList
 * ───────────────────────────────────────────────────────────────────────────── */
function SEOHead() {
  useEffect(() => {
    const BASE = "https://qiroxstudio.online";
    const PAGE = `${BASE}/youssef-darwish`;
    const HERO_IMG = `${BASE}/youssef-darwish-cto-qirox-1.jpg`;

    /* Title — Arabic first for Arabic Google; English for global */
    document.title =
      "يوسف محمد درويش — المدير التنفيذي التقني وشريك مؤسس | QIROX Studio | Youssef Mohamed Darwish CTO & Co-Founder";

    const setMeta = (key: string, value: string, prop = false) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(
        `meta[${attr}="${key}"]`
      ) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.content = value;
    };

    /* ── Primary SEO ── */
    setMeta(
      "description",
      "يوسف محمد درويش — المدير التنفيذي التقني (CTO) وشريك مؤسس في شركة QIROX Studio، مواليد 18 أغسطس 2000، مصري الجنسية. Youssef Mohamed Darwish, Chief Technology Officer & Co-Founder at QIROX Studio Saudi Arabia, born 18/08/2000, Egyptian."
    );
    setMeta(
      "keywords",
      "يوسف درويش, يوسف محمد درويش, يوسف محمد محمود درويش, يوسف درويش كيروكس, المدير التنفيذي التقني كيروكس, شريك مؤسس كيروكس, Youssef Darwish, Youssef Mohamed Darwish, Youssef Mohammed Darwish, youssef darwish cto, youssef darwish qirox, youssef darwish co-founder, QIROX CTO, QIROX Studio CTO, كيروكس ستوديو"
    );
    setMeta("robots", "index, follow, max-image-preview:large, max-snippet:-1");
    setMeta("author", "Youssef Mohamed Darwish — QIROX Studio");

    /* ── Open Graph (profile type — critical for Google Knowledge Panel) ── */
    setMeta("og:type", "profile", true);
    setMeta("og:title", "يوسف محمد درويش — CTO وشريك مؤسس | Youssef Mohamed Darwish", true);
    setMeta(
      "og:description",
      "المدير التنفيذي التقني وشريك مؤسس في QIROX Studio. مصري. مواليد 18/08/2000. Chief Technology Officer & Co-Founder at QIROX Studio, Egyptian, born 18/08/2000.",
      true
    );
    setMeta("og:url", PAGE, true);
    setMeta("og:image", HERO_IMG, true);
    setMeta("og:image:secure_url", HERO_IMG, true);
    setMeta("og:image:width", "1080", true);
    setMeta("og:image:height", "1350", true);
    setMeta("og:image:alt", "Youssef Mohamed Darwish CTO & Co-Founder QIROX Studio — يوسف محمد درويش", true);
    setMeta("og:image:type", "image/jpeg", true);
    setMeta("og:site_name", "QIROX Studio", true);
    setMeta("og:locale", "ar_SA", true);
    setMeta("og:locale:alternate", "en_US", true);
    setMeta("profile:first_name", "Youssef Mohamed", true);
    setMeta("profile:last_name", "Darwish", true);
    setMeta("profile:username", "youssef-darwish", true);

    /* ── Twitter Card ── */
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", "Youssef Mohamed Darwish — CTO & Co-Founder at QIROX Studio");
    setMeta(
      "twitter:description",
      "Chief Technology Officer & Co-Founder at QIROX Studio, Saudi Arabia. يوسف محمد درويش، المدير التنفيذي التقني والشريك المؤسس، كيروكس ستوديو. Egyptian. Born 18/08/2000."
    );
    setMeta("twitter:image", HERO_IMG);
    setMeta("twitter:image:alt", "Youssef Mohamed Darwish CTO QIROX Studio");

    /* ── Canonical ── */
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = PAGE;

    /* ── JSON-LD schemas ── */
    const schemas = [
      /* 1. Person — triggers Knowledge Panel */
      {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": `${PAGE}#person`,
        "name": "Youssef Mohamed Darwish",
        "alternateName": [
          "يوسف محمد درويش",
          "يوسف درويش",
          "يوسف محمد محمود درويش",
          "Youssef Mohammed Darwish",
          "Youssef M. Darwish",
          "يوسف درويش كيروكس"
        ],
        "givenName": "Youssef",
        "additionalName": "Mohamed Mahmoud",
        "familyName": "Darwish",
        "birthDate": "2000-08-18",
        "birthPlace": {
          "@type": "Country",
          "name": "Egypt",
          "sameAs": "https://www.wikidata.org/wiki/Q79"
        },
        "nationality": {
          "@type": "Country",
          "name": "Egypt",
          "sameAs": "https://www.wikidata.org/wiki/Q79"
        },
        "description":
          "يوسف محمد درويش (مواليد 18 أغسطس 2000) مصري الجنسية، المدير التنفيذي التقني (CTO) والشريك المؤسس في شركة QIROX Studio السعودية. يقود الفريق التقني ويشرف على بناء الأنظمة الرقمية المتكاملة لعملاء المنطقة. Youssef Mohamed Darwish (born 18 August 2000) is an Egyptian technologist and entrepreneur, serving as Chief Technology Officer & Co-Founder of QIROX Studio, Saudi Arabia.",
        "jobTitle": ["Chief Technology Officer", "Co-Founder", "Partner"],
        "hasOccupation": {
          "@type": "Occupation",
          "name": "Chief Technology Officer",
          "description": "يقود الرؤية التقنية والهندسة البرمجية لشركة QIROX Studio | Leads the technical vision and software engineering of QIROX Studio",
          "occupationLocation": {
            "@type": "Country",
            "name": "Saudi Arabia"
          }
        },
        "url": PAGE,
        "mainEntityOfPage": {
          "@type": "ProfilePage",
          "@id": PAGE
        },
        "image": [
          {
            "@type": "ImageObject",
            "url": `${BASE}/youssef-darwish-cto-qirox-1.jpg`,
            "name": "Youssef Mohamed Darwish CTO QIROX Studio official portrait",
            "description": "يوسف محمد درويش المدير التنفيذي التقني وشريك مؤسس كيروكس ستوديو — صورة رسمية",
            "representativeOfPage": true
          },
          {
            "@type": "ImageObject",
            "url": `${BASE}/youssef-darwish-cto-qirox-2.jpg`,
            "name": "Youssef Darwish QIROX Studio formal suit boardroom",
            "description": "يوسف درويش في مجلس الإدارة — الزي الرسمي"
          },
          {
            "@type": "ImageObject",
            "url": `${BASE}/youssef-darwish-cto-qirox-3.jpg`,
            "name": "Youssef Mohamed Darwish professional casual",
            "description": "يوسف محمد درويش صورة احترافية"
          },
          {
            "@type": "ImageObject",
            "url": `${BASE}/youssef-darwish-cto-qirox-4.jpg`,
            "name": "Youssef Darwish at industry conference QIROX",
            "description": "يوسف درويش في مؤتمر الصناعة — كيروكس ستوديو"
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
          "Software Engineering", "هندسة البرمجيات",
          "Artificial Intelligence", "الذكاء الاصطناعي",
          "Digital Transformation", "التحول الرقمي",
          "Product Development", "تطوير المنتجات",
          "React.js", "Node.js", "TypeScript", "MongoDB",
          "Mobile App Development", "تطوير تطبيقات الجوال",
          "SaaS", "ERP Systems", "Cloud Architecture"
        ],
        "sameAs": [
          PAGE,
          `${BASE}/team/youssef-darwish`
        ]
      },

      /* 2. ProfilePage — wraps Person, helps Google EntityPage disambiguation */
      {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "@id": PAGE,
        "url": PAGE,
        "name": "يوسف محمد درويش — Youssef Mohamed Darwish | QIROX Studio",
        "description":
          "الصفحة الرسمية ليوسف محمد درويش، المدير التنفيذي التقني والشريك المؤسس في QIROX Studio. Official profile page of Youssef Mohamed Darwish, CTO & Co-Founder at QIROX Studio.",
        "mainEntity": { "@id": `${PAGE}#person` },
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "QIROX Studio", "item": BASE },
            { "@type": "ListItem", "position": 2, "name": "فريق العمل | Team", "item": `${BASE}/about` },
            { "@type": "ListItem", "position": 3, "name": "يوسف محمد درويش — Youssef Mohamed Darwish", "item": PAGE }
          ]
        },
        "inLanguage": ["ar", "en"],
        "isPartOf": { "@id": `${BASE}/#website` }
      },

      /* 3. FAQPage — surfaces in "People also ask" + AI/AEO answers */
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "من هو يوسف درويش؟",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "يوسف محمد درويش (مواليد 18 أغسطس 2000) مصري الجنسية، هو المدير التنفيذي التقني (CTO) والشريك المؤسس في شركة QIROX Studio السعودية. يقود الفريق التقني ويشرف على بناء المنصات الرقمية وأنظمة الذكاء الاصطناعي."
            }
          },
          {
            "@type": "Question",
            "name": "Who is Youssef Mohamed Darwish?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Youssef Mohamed Darwish (born 18 August 2000) is an Egyptian entrepreneur and technologist serving as Chief Technology Officer (CTO) and Co-Founder at QIROX Studio, a leading Saudi technology company. He leads the technical vision and software engineering of the company."
            }
          },
          {
            "@type": "Question",
            "name": "ما هو منصب يوسف درويش في كيروكس ستوديو؟",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "يشغل يوسف محمد درويش منصب المدير التنفيذي التقني (CTO) وشريك مؤسس في شركة QIROX Studio. يقود الرؤية التقنية للشركة ويشرف على جميع منتجاتها وأنظمتها الرقمية."
            }
          },
          {
            "@type": "Question",
            "name": "What is Youssef Darwish's role at QIROX Studio?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Youssef Mohamed Darwish serves as Chief Technology Officer (CTO) and Co-Founder at QIROX Studio. He leads the technical team and oversees the development of all digital platforms and systems serving clients across Saudi Arabia and the region."
            }
          },
          {
            "@type": "Question",
            "name": "ما جنسية يوسف درويش؟",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "يوسف محمد درويش مصري الجنسية، وُلد في 18 أغسطس 2000. يقيم ويعمل في المملكة العربية السعودية حيث يقود الفريق التقني لشركة QIROX Studio."
            }
          },
          {
            "@type": "Question",
            "name": "What is the nationality of Youssef Darwish?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Youssef Mohamed Darwish is Egyptian, born on 18 August 2000. He is based in Saudi Arabia where he co-founded and leads the technology division of QIROX Studio."
            }
          },
          {
            "@type": "Question",
            "name": "من هو المدير التنفيذي التقني لشركة QIROX Studio؟",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "المدير التنفيذي التقني (CTO) لشركة QIROX Studio هو يوسف محمد درويش. وهو أيضاً شريك مؤسس في الشركة، وُلد في 18 أغسطس 2000، مصري الجنسية."
            }
          },
          {
            "@type": "Question",
            "name": "Who is the CTO of QIROX Studio?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The Chief Technology Officer (CTO) of QIROX Studio is Youssef Mohamed Darwish. He is also a co-founder and partner of the company, born 18 August 2000, Egyptian nationality."
            }
          },
          {
            "@type": "Question",
            "name": "متى وُلد يوسف درويش؟",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "يوسف محمد درويش مواليد 18 أغسطس 2000."
            }
          }
        ]
      }
    ];

    const existingIds = ["ld-youssef-person", "ld-youssef-profile", "ld-youssef-faq"];
    existingIds.forEach((id, i) => {
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement("script");
        el.id = id;
        (el as HTMLScriptElement).type = "application/ld+json";
        document.head.appendChild(el);
      }
      el.textContent = JSON.stringify(schemas[i]);
    });

    return () => {
      existingIds.forEach(id => document.getElementById(id)?.remove());
    };
  }, []);
  return null;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Data
 * ───────────────────────────────────────────────────────────────────────────── */
const photos = [
  {
    src: "/youssef-darwish-cto-qirox-1.jpg",
    alt: "يوسف محمد درويش المدير التنفيذي التقني كيروكس ستوديو — Youssef Mohamed Darwish CTO QIROX Studio official portrait",
    caption: "الصورة الرسمية · Official Portrait",
    priority: true,
  },
  {
    src: "/youssef-darwish-cto-qirox-2.jpg",
    alt: "يوسف درويش شريك مؤسس كيروكس في غرفة الاجتماعات — Youssef Darwish Co-Founder QIROX boardroom",
    caption: "في مجلس الإدارة · Boardroom",
    priority: false,
  },
  {
    src: "/youssef-darwish-cto-qirox-3.jpg",
    alt: "يوسف محمد درويش صورة احترافية — Youssef Mohamed Darwish professional photo",
    caption: "صورة احترافية · Professional",
    priority: false,
  },
  {
    src: "/youssef-darwish-cto-qirox-4.jpg",
    alt: "يوسف درويش في مؤتمر الصناعة كيروكس — Youssef Darwish at QIROX industry conference",
    caption: "مؤتمر الصناعة · Conference",
    priority: false,
  },
];

const expertise = [
  { en: "Software Engineering", ar: "هندسة البرمجيات", icon: "⚙️" },
  { en: "Artificial Intelligence", ar: "الذكاء الاصطناعي", icon: "🧠" },
  { en: "Digital Transformation", ar: "التحول الرقمي", icon: "🔄" },
  { en: "Product Architecture", ar: "هندسة المنتجات", icon: "🏗️" },
  { en: "Mobile Development", ar: "تطوير الجوال", icon: "📱" },
  { en: "Cloud & DevOps", ar: "الحوسبة السحابية", icon: "☁️" },
];

const faqs = [
  {
    q_ar: "من هو يوسف محمد درويش؟",
    q_en: "Who is Youssef Mohamed Darwish?",
    a_ar:
      "يوسف محمد درويش (مواليد 18 أغسطس 2000) مصري الجنسية، المدير التنفيذي التقني (CTO) والشريك المؤسس في شركة QIROX Studio. يقود الرؤية التقنية ويشرف على بناء الأنظمة الرقمية المتكاملة.",
    a_en:
      "Youssef Mohamed Darwish (born 18 August 2000) is an Egyptian entrepreneur and technologist serving as CTO & Co-Founder at QIROX Studio, Saudi Arabia. He leads the company's technical vision and software platforms.",
  },
  {
    q_ar: "ما منصبه في QIROX Studio؟",
    q_en: "What is his role at QIROX Studio?",
    a_ar:
      "يشغل يوسف منصب المدير التنفيذي التقني (CTO) وشريك مؤسس في QIROX Studio. يقود الفريق التقني ويشرف على جميع المنتجات والأنظمة الرقمية.",
    a_en:
      "Youssef serves as Chief Technology Officer (CTO) and Co-Founder at QIROX Studio. He leads the engineering team and oversees all digital platforms and AI-driven systems.",
  },
  {
    q_ar: "ما جنسيته وتاريخ ميلاده؟",
    q_en: "What is his nationality and date of birth?",
    a_ar: "يوسف محمد درويش مصري الجنسية، وُلد في 18 أغسطس 2000.",
    a_en: "Youssef Mohamed Darwish is Egyptian, born on 18 August 2000.",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
 * Page Component
 * ───────────────────────────────────────────────────────────────────────────── */
export default function TeamYoussefDarwish() {
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
          {/* Decorative gradient orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/[0.03] blur-3xl" />
            <div className="absolute top-1/2 left-10 w-72 h-72 rounded-full bg-white/[0.02] blur-2xl" />
            <div className="absolute bottom-0 right-1/3 w-48 h-48 rounded-full bg-white/[0.04] blur-2xl" />
          </div>

          <div className="relative max-w-5xl mx-auto px-6 pt-14 pb-20 flex flex-col md:flex-row items-center gap-10">

            {/* Portrait */}
            <div className="flex-shrink-0 relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-white/0 scale-105 blur-lg" />
              <img
                src="/youssef-darwish-cto-qirox-1.jpg"
                alt="يوسف محمد درويش المدير التنفيذي التقني وشريك مؤسس كيروكس ستوديو — Youssef Mohamed Darwish CTO & Co-Founder QIROX Studio"
                title="Youssef Mohamed Darwish — Chief Technology Officer & Co-Founder at QIROX Studio"
                className="relative w-52 h-64 md:w-64 md:h-80 object-cover object-top rounded-2xl border border-white/10 shadow-2xl"
                loading="eager"
                fetchPriority="high"
                itemProp="image"
              />
              {/* Badge */}
              <div className="absolute -bottom-3 -left-3 bg-white text-black text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg tracking-wide uppercase">
                CTO · Co-Founder
              </div>
            </div>

            {/* Info */}
            <div className="text-center md:text-right" itemProp="name" content="Youssef Mohamed Darwish">
              <p className="text-xs font-bold tracking-[0.3em] text-white/30 uppercase mb-4">
                QIROX Studio — كيروكس ستوديو
              </p>

              {/* Arabic name — largest, most visible for Arabic Google crawlers */}
              <h1 className="text-5xl md:text-6xl font-black leading-tight mb-2" itemProp="alternateName">
                يوسف محمد درويش
              </h1>

              {/* English — Latin indexing */}
              <h2 className="text-xl md:text-2xl font-bold text-white/60 mb-1" itemProp="name">
                Youssef Mohamed Darwish
              </h2>
              <p className="text-sm text-white/30 mb-6">
                Youssef Mohamed Mahmoud Darwish
              </p>

              {/* Role badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-6">
                <span className="px-4 py-1.5 rounded-full border border-white/15 text-sm font-bold text-white/90 bg-white/5 backdrop-blur-sm">
                  Chief Technology Officer
                </span>
                <span className="px-4 py-1.5 rounded-full border border-white/15 text-sm font-bold text-white/90 bg-white/5 backdrop-blur-sm">
                  Co-Founder · شريك مؤسس
                </span>
              </div>

              {/* Quick facts row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-white/40">
                <span>🇪🇬 مصري · Egyptian</span>
                <span>·</span>
                <span>📅 18 / 08 / 2000</span>
                <span>·</span>
                <span>🇸🇦 الرياض، السعودية</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── IDENTITY STRIP (SEO keyword-rich, visually clean) ── */}
        <section className="bg-[#0e0e1e] py-5 px-6 text-center overflow-x-auto">
          <p className="text-white/25 text-xs tracking-widest whitespace-nowrap">
            يوسف درويش&nbsp;·&nbsp;يوسف محمد درويش&nbsp;·&nbsp;يوسف محمد محمود درويش&nbsp;·&nbsp;
            Youssef Darwish&nbsp;·&nbsp;Youssef Mohamed Darwish&nbsp;·&nbsp;Youssef Mohammed Darwish&nbsp;·&nbsp;
            CTO QIROX&nbsp;·&nbsp;كيروكس ستوديو&nbsp;·&nbsp;المدير التنفيذي التقني&nbsp;·&nbsp;شريك مؤسس&nbsp;·&nbsp;مصر
          </p>
        </section>

        {/* ── BIOGRAPHY ── */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Arabic bio */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-0.5 bg-black" />
                <h2 className="text-2xl font-black text-black">من هو يوسف درويش؟</h2>
              </div>
              <p className="text-gray-600 leading-loose text-[15px] mb-4">
                <strong className="text-black">يوسف محمد محمود درويش</strong> (مواليد{" "}
                <strong className="text-black">18 أغسطس 2000</strong>، مصري الجنسية) هو المدير
                التنفيذي التقني (CTO) والشريك المؤسس في{" "}
                <strong className="text-black">شركة QIROX Studio</strong>، إحدى شركات التقنية
                الرائدة في المملكة العربية السعودية.
              </p>
              <p className="text-gray-600 leading-loose text-[15px] mb-4">
                يقود يوسف الفريق الهندسي في كيروكس ويُشرف على بناء المنصات الرقمية وأنظمة الذكاء
                الاصطناعي التي تخدم المؤسسات والشركات في المنطقة. يتميز بخبرة عميقة في هندسة
                البرمجيات، التحول الرقمي، وبناء المنتجات من الفكرة حتى الإطلاق.
              </p>
              <p className="text-gray-500 leading-loose text-[14px]">
                بدأ يوسف مسيرته التقنية في سن مبكر وأسّس QIROX Studio برؤية واضحة: تحويل الأفكار
                إلى أنظمة رقمية حقيقية تُحدث فارقاً في السوق السعودي والخليجي.
              </p>
            </div>

            {/* English bio */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-0.5 bg-black" />
                <h2 className="text-2xl font-black text-black">About Youssef Darwish</h2>
              </div>
              <p className="text-gray-600 leading-loose text-[15px] mb-4">
                <strong className="text-black">Youssef Mohamed Darwish</strong> (born{" "}
                <strong className="text-black">18 August 2000</strong>, Egyptian) is the Chief
                Technology Officer and Co-Founder at{" "}
                <strong className="text-black">QIROX Studio</strong>, a leading Saudi technology
                company specializing in intelligent digital solutions.
              </p>
              <p className="text-gray-600 leading-loose text-[15px] mb-4">
                Youssef leads the engineering team at QIROX, overseeing the development of advanced
                digital platforms, AI-driven systems, and enterprise software serving clients across
                Saudi Arabia and the Gulf region.
              </p>
              <p className="text-gray-500 leading-loose text-[14px]">
                Starting his tech journey at an early age, he co-founded QIROX Studio with a clear
                mission: turning ideas into real digital systems that create tangible impact in the
                Saudi and GCC markets.
              </p>
            </div>
          </div>
        </section>

        {/* ── PROFILE CARD (rich facts — AEO & Knowledge Panel) ── */}
        <section className="bg-[#f8f8fb] py-12 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-black text-black mb-8 text-center">
              معلومات الملف الشخصي · Profile Information
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label_ar: "الاسم الكامل", label_en: "Full Name", value_ar: "يوسف محمد محمود درويش", value_en: "Youssef Mohamed Mahmoud Darwish", icon: "👤" },
                { label_ar: "الجنسية", label_en: "Nationality", value_ar: "🇪🇬 مصري", value_en: "🇪🇬 Egyptian", icon: "" },
                { label_ar: "تاريخ الميلاد", label_en: "Date of Birth", value_ar: "18 / 08 / 2000", value_en: "18 Aug 2000", icon: "📅" },
                { label_ar: "المنصب", label_en: "Position", value_ar: "CTO · شريك مؤسس", value_en: "CTO · Co-Founder", icon: "💼" },
                { label_ar: "الشركة", label_en: "Company", value_ar: "كيروكس ستوديو", value_en: "QIROX Studio", icon: "🏢" },
                { label_ar: "موقع العمل", label_en: "Based In", value_ar: "الرياض، السعودية", value_en: "Riyadh, Saudi Arabia", icon: "📍" },
                { label_ar: "المجال", label_en: "Industry", value_ar: "تقنية المعلومات", value_en: "Information Technology", icon: "💻" },
                { label_ar: "الموقع الرسمي", label_en: "Website", value_ar: "qiroxstudio.online", value_en: "qiroxstudio.online", icon: "🌐" },
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

        {/* ── PHOTO GALLERY (critical for Google Images crawling) ── */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-black mb-2">
              صور يوسف محمد درويش · Photos
            </h2>
            <p className="text-sm text-gray-400">
              يوسف درويش المدير التنفيذي التقني كيروكس ستوديو · Youssef Darwish CTO QIROX Studio
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((photo, i) => (
              <figure key={i} className="m-0 group">
                <div className="overflow-hidden rounded-2xl bg-gray-100 aspect-[3/4]">
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    title={`Youssef Mohamed Darwish — ${photo.caption}`}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    loading={photo.priority ? "eager" : "lazy"}
                    itemProp="image"
                  />
                </div>
                <figcaption className="text-[11px] text-gray-400 mt-2 text-center font-medium">
                  {photo.caption}
                </figcaption>
              </figure>
            ))}
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
                <div
                  key={i}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.07] transition-colors"
                >
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <p className="font-black text-white text-sm">{item.en}</p>
                  <p className="text-white/40 text-xs mt-0.5">{item.ar}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ (AEO — Answer Engine Optimization) ── */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-black mb-2">أسئلة شائعة · FAQ</h2>
            <p className="text-sm text-gray-400">
              يوسف محمد درويش — الأسئلة الأكثر بحثاً على الإنترنت
            </p>
          </div>
          <div className="space-y-5">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-black/[0.08] rounded-2xl p-6"
                itemScope
                itemType="https://schema.org/Question"
              >
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <p className="font-black text-black text-[15px]" itemProp="name">{faq.q_ar}</p>
                  <p className="font-bold text-black/60 text-[14px]">{faq.q_en}</p>
                </div>
                <div
                  className="grid md:grid-cols-2 gap-4"
                  itemScope
                  itemType="https://schema.org/Answer"
                  itemProp="acceptedAnswer"
                >
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
            <img
              src="/qirox-icon.png"
              alt="QIROX Studio Logo — كيروكس ستوديو"
              className="w-14 h-14 mx-auto mb-5 opacity-80"
            />
            <p className="text-white/40 text-xs tracking-widest uppercase mb-3">شركة</p>
            <h3 className="text-2xl font-black text-white mb-2">QIROX Studio · كيروكس ستوديو</h3>
            <p className="text-white/40 text-sm mb-6">
              مصنع الأنظمة الرقمية · Saudi Arabia · الرياض
            </p>
            <a
              href="https://qiroxstudio.online"
              className="inline-block px-8 py-3 bg-white text-black font-black rounded-xl hover:bg-white/90 transition-colors text-sm"
            >
              زيارة الموقع · Visit Website
            </a>
          </div>
        </section>

        {/* ── HIDDEN SEO TEXT BLOCK
             Crawlable full-name variations + structured facts for parsers.
             Visually invisible but readable by Googlebot.
          ── */}
        <div
          style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0.001 }}
          aria-hidden="true"
        >
          <p>
            يوسف درويش | يوسف محمد درويش | يوسف محمد محمود درويش | يوسف درويش كيروكس |
            Youssef Darwish | Youssef Mohamed Darwish | Youssef Mohammed Darwish |
            Youssef M. Darwish | youssef darwish cto | youssef darwish qirox |
            CTO QIROX Studio | Chief Technology Officer QIROX | Co-Founder QIROX |
            مصري | Egyptian | مواليد 18 أغسطس 2000 | born August 18 2000 |
            المدير التنفيذي التقني | شريك مؤسس | تقنية | ذكاء اصطناعي |
            الرياض السعودية | Riyadh Saudi Arabia | QIROX Studio Saudi Arabia
          </p>
        </div>

      </div>
    </>
  );
}
