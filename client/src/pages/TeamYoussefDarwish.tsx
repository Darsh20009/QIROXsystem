import { useEffect } from "react";
import { Link } from "wouter";

// ── SEO: inject all meta + JSON-LD via Helmet equivalent ──────────────────────
function SEOHead() {
  useEffect(() => {
    // Title
    document.title = "يوسف محمد درويش — المدير التنفيذي التقني | QIROX Studio | Youssef Mohammed Darwish CTO";

    const setMeta = (name: string, content: string, prop?: boolean) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.content = content;
    };

    // Primary SEO
    setMeta("description", "يوسف محمد محمود درويش — المدير التنفيذي التقني (CTO) لشركة QIROX Studio السعودية. Youssef Mohammed Darwish, Chief Technology Officer at QIROX Studio, Saudi Arabia. Building intelligent digital solutions.");
    setMeta("keywords", "يوسف درويش, يوسف محمد درويش, يوسف محمد محمود درويش, المدير التنفيذي التقني كيروكس, Youssef Darwish, Youssef Mohammed Darwish, youssef darwish cto, youssef darwish qirox, QIROX CTO, كيروكس ستوديو");
    setMeta("robots", "index, follow, max-image-preview:large");
    setMeta("author", "Youssef Mohammed Darwish — QIROX Studio");

    // Open Graph
    setMeta("og:type", "profile", true);
    setMeta("og:title", "يوسف محمد درويش — CTO | QIROX Studio | Youssef Darwish", true);
    setMeta("og:description", "المدير التنفيذي التقني لشركة QIROX Studio. Chief Technology Officer at QIROX Studio.", true);
    setMeta("og:url", "https://qiroxstudio.online/youssef-darwish", true);
    setMeta("og:image", "https://qiroxstudio.online/youssef-darwish-cto-qirox-2.jpg", true);
    setMeta("og:image:alt", "Youssef Mohammed Darwish CTO QIROX Studio", true);
    setMeta("og:site_name", "QIROX Studio", true);
    setMeta("profile:first_name", "Youssef Mohammed", true);
    setMeta("profile:last_name", "Darwish", true);
    setMeta("profile:username", "youssef-darwish", true);

    // Twitter Card
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", "Youssef Mohammed Darwish — CTO at QIROX Studio");
    setMeta("twitter:description", "Chief Technology Officer at QIROX Studio, Saudi Arabia. يوسف محمد درويش، المدير التنفيذي التقني، كيروكس ستوديو.");
    setMeta("twitter:image", "https://qiroxstudio.online/youssef-darwish-cto-qirox-2.jpg");

    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = "https://qiroxstudio.online/youssef-darwish";

    // JSON-LD Person schema — key for Google Knowledge Panel
    const schemaId = "ld-youssef-darwish";
    let existing = document.getElementById(schemaId);
    if (!existing) { existing = document.createElement("script"); existing.id = schemaId; (existing as HTMLScriptElement).type = "application/ld+json"; document.head.appendChild(existing); }
    existing.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": "https://qiroxstudio.online/youssef-darwish#person",
      "name": "Youssef Mohammed Darwish",
      "alternateName": ["يوسف محمد درويش", "يوسف محمد محمود درويش", "Youssef Darwish", "يوسف درويش"],
      "jobTitle": "Chief Technology Officer (CTO)",
      "description": "يوسف محمد محمود درويش هو المدير التنفيذي التقني لشركة QIROX Studio، شركة سعودية متخصصة في بناء الحلول الرقمية الذكية. Youssef Mohammed Darwish is the Chief Technology Officer at QIROX Studio, a Saudi company specializing in building intelligent digital solutions.",
      "url": "https://qiroxstudio.online/youssef-darwish",
      "image": [
        {
          "@type": "ImageObject",
          "url": "https://qiroxstudio.online/youssef-darwish-cto-qirox-1.jpg",
          "name": "Youssef Mohammed Darwish CTO QIROX Studio conference",
          "description": "يوسف محمد درويش المدير التنفيذي التقني كيروكس ستوديو"
        },
        {
          "@type": "ImageObject",
          "url": "https://qiroxstudio.online/youssef-darwish-cto-qirox-2.jpg",
          "name": "Youssef Darwish CTO QIROX official portrait",
          "description": "يوسف درويش صورة رسمية المدير التنفيذي التقني"
        },
        {
          "@type": "ImageObject",
          "url": "https://qiroxstudio.online/youssef-darwish-cto-qirox-3.jpg",
          "name": "Youssef Darwish at QIROX Studio event",
          "description": "يوسف درويش في فعالية كيروكس ستوديو"
        },
        {
          "@type": "ImageObject",
          "url": "https://qiroxstudio.online/youssef-darwish-cto-qirox-4.jpg",
          "name": "Youssef Mohammed Darwish casual professional photo",
          "description": "يوسف محمد درويش صورة احترافية"
        },
        {
          "@type": "ImageObject",
          "url": "https://qiroxstudio.online/youssef-darwish-cto-qirox-5.jpg",
          "name": "Youssef Darwish QIROX professional",
          "description": "يوسف درويش كيروكس"
        }
      ],
      "worksFor": {
        "@type": "Organization",
        "@id": "https://qiroxstudio.online/#organization",
        "name": "QIROX Studio",
        "url": "https://qiroxstudio.online",
        "logo": "https://qiroxstudio.online/qirox-icon.png",
        "sameAs": ["https://qiroxstudio.online"]
      },
      "nationality": { "@type": "Country", "name": "Saudi Arabia" },
      "knowsAbout": [
        "Software Engineering", "Digital Transformation", "AI Systems",
        "Web Development", "هندسة البرمجيات", "التحول الرقمي", "الذكاء الاصطناعي"
      ],
      "sameAs": [
        "https://qiroxstudio.online/youssef-darwish",
        "https://qiroxstudio.online/team/youssef-darwish"
      ]
    });

    return () => {
      const s = document.getElementById(schemaId);
      if (s) s.remove();
    };
  }, []);
  return null;
}

// ── Photos ────────────────────────────────────────────────────────────────────
const photos = [
  { src: "/youssef-darwish-cto-qirox-2.jpg", alt: "Youssef Mohammed Darwish CTO QIROX Studio — يوسف محمد درويش المدير التنفيذي التقني", title: "Youssef Darwish — Official Portrait" },
  { src: "/youssef-darwish-cto-qirox-3.jpg", alt: "يوسف درويش في فعالية كيروكس ستوديو — Youssef Darwish at QIROX event", title: "QIROX Studio Event" },
  { src: "/youssef-darwish-cto-qirox-1.jpg", alt: "يوسف محمد محمود درويش كيروكس — Youssef Darwish QIROX conference", title: "Industry Conference" },
  { src: "/youssef-darwish-cto-qirox-4.jpg", alt: "يوسف درويش كيروكس ستوديو — Youssef Darwish QIROX Studio", title: "Professional Photo" },
  { src: "/youssef-darwish-cto-qirox-5.jpg", alt: "يوسف محمد درويش المدير التقني كيروكس — Youssef Darwish CTO QIROX", title: "Business Professional" },
];

export default function TeamYoussefDarwish() {
  return (
    <>
      <SEOHead />
      <div className="min-h-screen bg-white" lang="ar" dir="rtl">

        {/* ── Hero ── */}
        <section className="bg-[#0a0a16] text-white pt-16 pb-20 px-6">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10">
            {/* Main portrait */}
            <div className="flex-shrink-0">
              <img
                src="/youssef-darwish-cto-qirox-2.jpg"
                alt="يوسف محمد درويش المدير التنفيذي التقني كيروكس ستوديو — Youssef Mohammed Darwish CTO QIROX Studio"
                title="Youssef Mohammed Darwish — Chief Technology Officer at QIROX Studio"
                className="w-52 h-52 md:w-64 md:h-64 object-cover object-top rounded-2xl border-2 border-white/10"
                loading="eager"
                fetchPriority="high"
              />
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs font-bold tracking-[0.25em] text-white/40 uppercase mb-3">QIROX Studio — كيروكس ستوديو</p>
              {/* Arabic name — biggest, most visible for Arabic Google */}
              <h1 className="text-4xl md:text-5xl font-black mb-2">يوسف محمد درويش</h1>
              {/* English — for English Google */}
              <h2 className="text-lg md:text-xl font-bold text-white/70 mb-1">Youssef Mohammed Darwish</h2>
              <p className="text-base text-white/50 mb-1">Youssef Mohammed Mahmoud Darwish</p>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
                <span className="px-4 py-1.5 rounded-full bg-white/10 text-sm font-bold text-white">Chief Technology Officer</span>
                <span className="px-4 py-1.5 rounded-full bg-white/10 text-sm font-bold text-white">المدير التنفيذي التقني</span>
              </div>
              <p className="mt-3 text-sm text-white/40">CTO · QIROX Studio · Saudi Arabia · المملكة العربية السعودية</p>
            </div>
          </div>
        </section>

        {/* ── About ── */}
        <section className="max-w-4xl mx-auto px-6 py-14">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-2xl font-black text-black mb-4">من هو يوسف درويش؟</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>يوسف محمد محمود درويش</strong> هو المدير التنفيذي التقني (CTO) لشركة <strong>QIROX Studio</strong>،
                إحدى شركات التقنية الرائدة في المملكة العربية السعودية المتخصصة في بناء الحلول الرقمية الذكية.
              </p>
              <p className="text-gray-600 leading-relaxed">
                يقود يوسف الفريق التقني في QIROX ويُشرف على بناء المنصات والأنظمة الرقمية المتقدمة التي تخدم
                المؤسسات والشركات في المنطقة. يتميز بخبرته العميقة في هندسة البرمجيات، الذكاء الاصطناعي،
                والتحول الرقمي.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-black text-black mb-4">About Youssef Darwish</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>Youssef Mohammed Darwish</strong> is the Chief Technology Officer (CTO) at <strong>QIROX Studio</strong>,
                a leading Saudi technology company specializing in building intelligent digital solutions.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Youssef leads the technical team at QIROX, overseeing the development of advanced digital platforms
                and systems serving enterprises across the region. He brings deep expertise in software engineering,
                artificial intelligence, and digital transformation.
              </p>
            </div>
          </div>
        </section>

        {/* ── Photo Gallery (key for Google Images) ── */}
        <section className="bg-gray-50 py-14 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-black text-black mb-2 text-center">
              صور يوسف محمد درويش — Youssef Darwish Photos
            </h2>
            <p className="text-sm text-gray-400 text-center mb-8">
              يوسف درويش المدير التنفيذي التقني كيروكس ستوديو · Youssef Darwish CTO QIROX Studio
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {photos.map((p, i) => (
                <figure key={i} className="m-0">
                  <img
                    src={p.src}
                    alt={p.alt}
                    title={p.title}
                    className="w-full aspect-square object-cover object-top rounded-xl"
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                  <figcaption className="text-[10px] text-gray-400 mt-1 text-center truncate">{p.title}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ── Role & Company ── */}
        <section className="max-w-4xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-black text-black mb-8 text-center">
            QIROX Studio — كيروكس ستوديو
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { en: "Chief Technology Officer", ar: "المدير التنفيذي التقني", icon: "💻" },
              { en: "QIROX Studio", ar: "كيروكس ستوديو", icon: "🏢" },
              { en: "Saudi Arabia", ar: "المملكة العربية السعودية", icon: "🇸🇦" },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <p className="font-black text-black">{item.en}</p>
                <p className="text-gray-500 text-sm">{item.ar}</p>
              </div>
            ))}
          </div>

          {/* Keywords block for Google crawlers */}
          <div className="mt-10 p-6 bg-[#0a0a16] rounded-2xl text-center">
            <p className="text-white/80 text-sm leading-relaxed">
              يوسف درويش · يوسف محمد درويش · يوسف محمد محمود درويش · Youssef Darwish · Youssef Mohammed Darwish ·
              youssef darwish cto · يوسف درويش كيروكس · Youssef Darwish QIROX · المدير التنفيذي التقني كيروكس ·
              Chief Technology Officer QIROX Studio Saudi Arabia
            </p>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-[#0a0a16] py-12 px-6 text-center">
          <p className="text-white/50 text-sm mb-4">QIROX Studio — Building Intelligent Digital Solutions</p>
          <a href="https://qiroxstudio.online" className="inline-block px-8 py-3 bg-white text-black font-black rounded-xl hover:bg-white/90 transition-colors">
            قيروكس ستوديو — زيارة الموقع
          </a>
        </section>

      </div>
    </>
  );
}
