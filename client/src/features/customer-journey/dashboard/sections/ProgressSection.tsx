// ── ProgressSection ───────────────────────────────────────────────────────────
// Sprint 003 — Dashboard V2 placeholder section.
// No production wiring. Feature-flagged. Not yet active.

import { ProgressTimeline } from "../../components/ProgressTimeline";
import { JourneyProvider } from "../../context/journey-context";

interface ProgressSectionProps {
  lang?: "ar" | "en";
}

export function ProgressSection({ lang = "ar" }: ProgressSectionProps) {
  const isAr = lang === "ar";
  return (
    <section dir={isAr ? "rtl" : "ltr"}>
      <h3 className="text-sm font-semibold text-black dark:text-white mb-3">
        {isAr ? "تقدم رحلتك" : "Your Journey Progress"}
      </h3>
      {/* ProgressTimeline reads from JourneyContext — must be inside JourneyProvider */}
      <ProgressTimeline lang={lang} />
    </section>
  );
}
