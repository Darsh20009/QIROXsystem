import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

// Placeholder companies shown when no logos are present in /partners
const PLACEHOLDER_NAMES = [
  "Alpha Corp", "NexaGroup", "BuildCo", "TechVision",
  "Orion Ltd", "Spark Media", "Vertex Inc", "PrimeTech",
];

// Known partner logo filenames — add image files to client/public/partners/ and list them here
// e.g.: const PARTNER_LOGOS = ["logo-acme.png", "logo-globex.svg"];
const PARTNER_LOGOS: string[] = [
  "logo-moonshot.png",
  "logo-paymob.png",
  "logo-shadj.png",
  "logo-storagex.png",
];

// Filter to logos that actually exist (we load them and show only those that succeed)
function PartnerLogo({ src, alt }: { src: string; alt: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setOk(false)}
      className="h-7 md:h-8 w-auto object-contain grayscale opacity-60 hover:opacity-90 hover:grayscale-0 transition-all duration-300 select-none"
      loading="lazy"
      draggable={false}
    />
  );
}

export default function TrustedSection() {
  const { t, lang } = useI18n();
  const ar = lang === "ar";
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  // Auto-scroll the marquee via CSS animation; pause on hover
  const hasLogos = PARTNER_LOGOS.length > 0;

  // Duplicate items for seamless loop
  const items = hasLogos ? [...PARTNER_LOGOS, ...PARTNER_LOGOS] : [...PLACEHOLDER_NAMES, ...PLACEHOLDER_NAMES];

  return (
    <section
      dir={ar ? "rtl" : "ltr"}
      className="py-14 md:py-16 border-t border-gray-100 bg-white overflow-hidden"
      aria-label={ar ? "شركاء موثوقون" : "Trusted partners"}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 mb-10 text-center">
        <p className="text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-2">
          {ar ? "يثق بنا" : "Trusted by"}
        </p>
        <h2 className="text-xl md:text-2xl font-bold text-[#0F172A]">
          {ar ? "يثق بنا رواد الأعمال والشركات" : "Trusted by ambitious businesses"}
        </h2>
      </div>

      {/* Marquee track */}
      <div
        className="relative overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Left/right fade masks */}
        <div aria-hidden className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-white to-transparent" />
        <div aria-hidden className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-white to-transparent" />

        <div
          ref={trackRef}
          className="flex items-center gap-12 md:gap-16"
          style={{
            width: "max-content",
            animation: `marqueeScroll 28s linear infinite`,
            animationPlayState: paused ? "paused" : "running",
          }}
        >
          {items.map((item, i) => (
            <div key={i} className="flex-shrink-0 flex items-center justify-center h-10">
              {hasLogos ? (
                <PartnerLogo
                  src={`/${item}`}
                  alt={item.replace(/\.[^.]+$/, "").replace(/-/g, " ")}
                />
              ) : (
                <span className="px-5 py-2 rounded-lg border border-gray-200 bg-gray-50 text-[12px] font-semibold text-gray-400 tracking-wide whitespace-nowrap select-none">
                  {item}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marqueeScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
