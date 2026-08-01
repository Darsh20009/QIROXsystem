import { useEffect } from "react";

function SEOHead() {
  useEffect(() => {
    document.title = "محمد الدباني — المدير التنفيذي | QIROX Studio | Mohammed Aldabbani CEO";

    const setMeta = (name: string, content: string, prop?: boolean) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.content = content;
    };

    setMeta("description", "محمد الدباني — المدير التنفيذي (CEO) لشركة QIROX Studio السعودية. Mohammed Aldabbani, Chief Executive Officer at QIROX Studio, Saudi Arabia. Building intelligent digital solutions.");
    setMeta("keywords", "محمد الدباني, محمد الدبانى, المدير التنفيذي كيروكس, Mohammed Aldabbani, Mohammed Al-Dabbani, mohmmed aldbani ceo, mohammed aldabbani qirox, QIROX CEO, كيروكس ستوديو, قيروكس");
    setMeta("robots", "index, follow, max-image-preview:large");
    setMeta("author", "Mohammed Aldabbani — QIROX Studio");

    setMeta("og:type", "profile", true);
    setMeta("og:title", "محمد الدباني — CEO | QIROX Studio | Mohammed Aldabbani", true);
    setMeta("og:description", "المدير التنفيذي لشركة QIROX Studio. Chief Executive Officer at QIROX Studio Saudi Arabia.", true);
    setMeta("og:url", "https://qiroxstudio.online/mohammed-aldabbani", true);
    setMeta("og:image", "https://qiroxstudio.online/mohammed-aldabbani-ceo.jpg", true);
    setMeta("og:image:alt", "Mohammed Aldabbani CEO QIROX Studio", true);
    setMeta("og:site_name", "QIROX Studio", true);
    setMeta("profile:first_name", "Mohammed", true);
    setMeta("profile:last_name", "Aldabbani", true);
    setMeta("profile:username", "mohammed-aldabbani", true);

    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", "Mohammed Aldabbani — CEO at QIROX Studio");
    setMeta("twitter:description", "Chief Executive Officer at QIROX Studio, Saudi Arabia. محمد الدباني، المدير التنفيذي، كيروكس ستوديو.");
    setMeta("twitter:image", "https://qiroxstudio.online/mohammed-aldabbani-ceo.jpg");

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = "https://qiroxstudio.online/mohammed-aldabbani";

    const schemaId = "ld-mohammed-aldabbani";
    let existing = document.getElementById(schemaId);
    if (!existing) { existing = document.createElement("script"); existing.id = schemaId; (existing as HTMLScriptElement).type = "application/ld+json"; document.head.appendChild(existing); }
    existing.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": "https://qiroxstudio.online/mohammed-aldabbani#person",
      "name": "Mohammed Aldabbani",
      "alternateName": ["محمد الدباني", "محمد الدبانى", "Mohammed Al-Dabbani", "mohmmed aldbani", "محمد الدباني المدير التنفيذي"],
      "jobTitle": "Chief Executive Officer (CEO)",
      "description": "محمد الدباني هو المدير التنفيذي لشركة QIROX Studio، شركة سعودية رائدة في بناء الحلول الرقمية الذكية. Mohammed Aldabbani is the Chief Executive Officer of QIROX Studio, a leading Saudi technology company.",
      "url": "https://qiroxstudio.online/mohammed-aldabbani",
      "image": [
        {
          "@type": "ImageObject",
          "url": "https://qiroxstudio.online/mohammed-aldabbani-ceo.jpg",
          "name": "Mohammed Aldabbani CEO QIROX Studio official portrait",
          "description": "محمد الدباني المدير التنفيذي كيروكس ستوديو صورة رسمية"
        }
      ],
      "worksFor": {
        "@type": "Organization",
        "@id": "https://qiroxstudio.online/#organization",
        "name": "QIROX Studio",
        "url": "https://qiroxstudio.online",
        "logo": "https://qiroxstudio.online/qirox-icon.png"
      },
      "nationality": { "@type": "Country", "name": "Saudi Arabia" },
      "knowsAbout": [
        "Business Strategy", "Digital Transformation", "Technology Leadership",
        "إدارة الأعمال", "التحول الرقمي", "ريادة الأعمال"
      ],
      "sameAs": [
        "https://qiroxstudio.online/mohammed-aldabbani",
        "https://qiroxstudio.online/team/mohammed-aldabbani"
      ]
    });

    return () => {
      const s = document.getElementById(schemaId);
      if (s) s.remove();
    };
  }, []);
  return null;
}

export default function TeamMohammedAlDabbani() {
  return (
    <>
      <SEOHead />
      <div className="min-h-screen bg-white" lang="ar" dir="rtl">

        {/* ── Hero ── */}
        <section className="bg-[#0a0a16] text-white pt-16 pb-20 px-6">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10">
            <div className="flex-shrink-0">
              <img
                src="/mohammed-aldabbani-ceo.jpg"
                alt="محمد الدباني المدير التنفيذي كيروكس ستوديو — Mohammed Aldabbani CEO QIROX Studio"
                title="Mohammed Aldabbani — Chief Executive Officer at QIROX Studio"
                className="w-52 h-52 md:w-64 md:h-64 object-cover object-top rounded-2xl border-2 border-white/10"
                loading="eager"
                fetchPriority="high"
              />
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs font-bold tracking-[0.25em] text-white/40 uppercase mb-3">QIROX Studio — كيروكس ستوديو</p>
              <h1 className="text-4xl md:text-5xl font-black mb-2">محمد الدباني</h1>
              <h2 className="text-lg md:text-xl font-bold text-white/70 mb-1">Mohammed Aldabbani</h2>
              <p className="text-base text-white/50 mb-1">Mohammed Al-Dabbani · mohmmed aldbani</p>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
                <span className="px-4 py-1.5 rounded-full bg-white/10 text-sm font-bold text-white">Chief Executive Officer</span>
                <span className="px-4 py-1.5 rounded-full bg-white/10 text-sm font-bold text-white">المدير التنفيذي</span>
              </div>
              <p className="mt-3 text-sm text-white/40">CEO · QIROX Studio · Saudi Arabia · المملكة العربية السعودية</p>
            </div>
          </div>
        </section>

        {/* ── About ── */}
        <section className="max-w-4xl mx-auto px-6 py-14">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-2xl font-black text-black mb-4">من هو محمد الدباني؟</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>محمد الدباني</strong> هو المدير التنفيذي (CEO) لشركة <strong>QIROX Studio</strong>،
                إحدى الشركات التقنية الرائدة في المملكة العربية السعودية المتخصصة في بناء الحلول الرقمية الذكية.
              </p>
              <p className="text-gray-600 leading-relaxed">
                يقود محمد الدباني الرؤية الاستراتيجية لشركة QIROX ويوجّه مسيرتها نحو تحقيق التميز في
                مجال التقنية وخدمة الشركات والمؤسسات في المنطقة بحلول رقمية مبتكرة وذكية.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-black text-black mb-4">About Mohammed Aldabbani</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>Mohammed Aldabbani</strong> is the Chief Executive Officer (CEO) of <strong>QIROX Studio</strong>,
                a leading Saudi technology company specializing in building intelligent digital solutions.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Mohammed leads the strategic vision of QIROX Studio and drives the company's mission to deliver
                innovative digital platforms and services to enterprises across Saudi Arabia and the region.
              </p>
            </div>
          </div>
        </section>

        {/* ── Photo showcase ── */}
        <section className="bg-gray-50 py-14 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-black text-black mb-2 text-center">
              صور محمد الدباني — Mohammed Aldabbani Photos
            </h2>
            <p className="text-sm text-gray-400 text-center mb-8">
              محمد الدباني المدير التنفيذي كيروكس ستوديو · Mohammed Aldabbani CEO QIROX Studio Saudi Arabia
            </p>
            <div className="flex justify-center">
              <figure className="m-0 max-w-sm w-full">
                <img
                  src="/mohammed-aldabbani-ceo.jpg"
                  alt="محمد الدباني المدير التنفيذي كيروكس ستوديو السعودية — Mohammed Aldabbani CEO QIROX Studio Saudi Arabia"
                  title="Mohammed Aldabbani — CEO QIROX Studio"
                  className="w-full rounded-2xl object-cover"
                  loading="lazy"
                />
                <figcaption className="text-center text-sm text-gray-500 mt-3">
                  محمد الدباني — المدير التنفيذي، كيروكس ستوديو<br/>
                  <span className="text-xs">Mohammed Aldabbani — CEO, QIROX Studio</span>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* ── Role & Company ── */}
        <section className="max-w-4xl mx-auto px-6 py-14">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { en: "Chief Executive Officer", ar: "المدير التنفيذي", icon: "👔" },
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

          <div className="mt-10 p-6 bg-[#0a0a16] rounded-2xl text-center">
            <p className="text-white/80 text-sm leading-relaxed">
              محمد الدباني · محمد الدبانى · mohmmed aldbani · Mohammed Aldabbani ·
              Mohammed Al-Dabbani · mohmmed aldbani ceo · محمد الدباني المدير التنفيذي كيروكس ·
              Mohammed Aldabbani CEO QIROX Studio Saudi Arabia
            </p>
          </div>
        </section>

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
