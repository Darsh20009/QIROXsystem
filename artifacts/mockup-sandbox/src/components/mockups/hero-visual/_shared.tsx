import { useEffect, useState } from "react";

const heroImage = "/__mockup/images-qirox-hero-cube.png";

const labels = {
  ar: ["الاستراتيجية", "التصميم", "التطوير", "ذكاء اصطناعي", "التكامل", "النمو"],
  en: ["Strategy", "Design", "Development", "AI & Automation", "Integration", "Growth"],
};

export function HeroVisual({
  larger = false,
  lang = "ar",
}: {
  larger?: boolean;
  lang?: "ar" | "en";
}) {
  const ar = lang === "ar";
  const copy = labels[lang];

  return (
    <main className={`hero-preview ${larger ? "hero-preview--larger" : "hero-preview--current"}`} dir={ar ? "rtl" : "ltr"}>
      <div className="hero-preview__text">
        <p className="hero-preview__eyebrow">
          {ar ? "نبني أنظمة رقمية تتوسّع معك" : "WE BUILD DIGITAL SYSTEMS THAT SCALE"}
        </p>
        <h1>
          {ar ? <>من الفكرة<br />إلى الأثر.</> : <>From Vision<br />to Impact.</>}
        </h1>
        <p className="hero-preview__description">
          {ar
            ? "كيروكس يشارك الشركات الطموحة في تصميم وبناء وتطوير منتجات رقمية تحقق نتائج حقيقية."
            : "Qirox Studio partners with ambitious businesses to design, build and scale digital products that drive real results."}
        </p>
        <div className="hero-preview__actions">
          <button>{ar ? "ابدأ مشروعك" : "Start Your Project"} <span>←</span></button>
          <a href="#work">{ar ? "شاهد أعمالنا" : "See Our Work"} <span>←</span></a>
        </div>
      </div>

      <div className="hero-preview__visual" aria-label={ar ? "عنصر QIROX ثلاثي الأبعاد" : "QIROX 3D visual"}>
        <div className="hero-preview__labels hero-preview__labels--a">
          {copy.slice(0, 3).map((label) => (
            <div className="hero-preview__label" key={label}>
              <span>{label}</span>
              <i />
            </div>
          ))}
        </div>
        <img
          src={heroImage}
          alt="QIROX"
          width="1536"
          height="1024"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <div className="hero-preview__labels hero-preview__labels--b">
          {copy.slice(3).map((label) => (
            <div className="hero-preview__label" key={label}>
              <i />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export function usePreviewLanguage() {
  const [lang, setLang] = useState<"ar" | "en">("ar");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "l") setLang((current) => current === "ar" ? "en" : "ar");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { lang, setLang };
}