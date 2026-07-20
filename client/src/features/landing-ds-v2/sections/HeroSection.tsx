import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { ArrowLeft, ArrowRight, Mouse } from "lucide-react";

// Badge data
const BADGES = [
  { icon: "🤖", key: "AI" },
  { icon: "⚡", key: "Automation" },
  { icon: "☁️", key: "Cloud" },
  { icon: "🏢", key: "Business Systems" },
  { icon: "🌐", key: "Web" },
  { icon: "📱", key: "Mobile" },
  { icon: "🔒", key: "Cyber Security" },
] as const;

const BADGE_AR: Record<string, string> = {
  AI: "الذكاء الاصطناعي",
  Automation: "الأتمتة",
  Cloud: "الحوسبة السحابية",
  "Business Systems": "أنظمة الأعمال",
  Web: "الويب",
  Mobile: "الجوال",
  "Cyber Security": "الأمن السيبراني",
};

// Stats
const STATS = [
  { value: 500, suffix: "+", key: "dsv2.stats.projects" },
  { value: 98, suffix: "%", key: "dsv2.stats.satisfaction" },
  { value: 4, suffix: "+", key: "dsv2.stats.years" },
  { value: 10, suffix: "+", key: "dsv2.stats.countries" },
] as const;

function useCountUp(target: number, duration = 1800, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setCount(current);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);
  return count;
}

function StatItem({ value, suffix, labelKey }: { value: number; suffix: string; labelKey: string }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const count = useCountUp(value, 1600, active);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex flex-col items-center sm:items-start gap-0.5">
      <span className="text-3xl md:text-4xl font-bold text-[#0F172A] tabular-nums leading-none">
        {count}{suffix}
      </span>
      <span className="text-[12px] md:text-[13px] text-gray-500 font-medium leading-tight">
        {t(labelKey)}
      </span>
    </div>
  );
}

export default function HeroSection() {
  const { t, lang } = useI18n();
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;

  return (
    <section
      dir={ar ? "rtl" : "ltr"}
      className="relative min-h-[100dvh] flex flex-col overflow-hidden bg-white"
      aria-label={ar ? "القسم الرئيسي" : "Hero section"}
    >
      {/* Soft radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 w-[70%] h-full bg-gradient-to-r from-white via-white/90 to-transparent z-10"
      />

      {/* Hero background image — right side */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero-bg.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-right"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </div>

      {/* Content */}
      <div className="relative z-20 flex-1 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-28 pb-16 md:pt-32 md:pb-20">
          <div className="max-w-xl lg:max-w-2xl">

            {/* Label */}
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm mb-7 shadow-sm"
              style={{ animation: "heroFadeUp 0.6s ease both", animationDelay: "0ms" }}
            >
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
              <span className="text-[11px] font-bold tracking-[0.12em] text-gray-500 uppercase">
                QIROX STUDIO
              </span>
            </div>

            {/* H1 */}
            <h1
              className="font-bold text-[#0F172A] leading-[1.12] tracking-tight mb-5"
              style={{
                fontSize: "clamp(2rem, 5vw, 3.25rem)",
                animation: "heroFadeUp 0.6s ease both",
                animationDelay: "80ms",
              }}
            >
              {ar
                ? "نبني البنية الرقمية التي تقود مستقبل أعمالك"
                : "Building The Digital Infrastructure Of Modern Businesses"}
            </h1>

            {/* Blue accent line */}
            <p
              className="text-[#3B82F6] font-semibold text-lg md:text-xl mb-5"
              style={{ animation: "heroFadeUp 0.6s ease both", animationDelay: "160ms" }}
            >
              {ar ? "بذكاء. بسرعة. واستدامة." : "Powered by AI. Built for Growth."}
            </p>

            {/* Description */}
            <p
              className="text-gray-500 text-[15px] md:text-base leading-relaxed mb-9 max-w-lg"
              style={{ animation: "heroFadeUp 0.6s ease both", animationDelay: "220ms" }}
            >
              {ar
                ? "نساعد الشركات ورواد الأعمال على بناء أنظمة رقمية متكاملة، ومنتجات تقنية، وحلول ذكاء اصطناعي، تجعل أعمالهم أكثر كفاءة وقابلية للنمو."
                : "We help businesses build scalable software, AI solutions, digital products and operational systems that accelerate growth and innovation."}
            </p>

            {/* CTAs */}
            <div
              className="flex flex-wrap gap-3 mb-10"
              style={{ animation: "heroFadeUp 0.6s ease both", animationDelay: "300ms" }}
            >
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-[14px] font-semibold text-white bg-[#0F172A] hover:bg-[#1e293b] rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                {ar ? "ابدأ مشروعك" : "Start Your Project"}
                <Arrow size={16} strokeWidth={2} />
              </a>
              <a
                href="#portfolio"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-[14px] font-semibold text-[#0F172A] bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                {ar ? "شاهد أعمالنا" : "View Portfolio"}
              </a>
            </div>

            {/* Capability badges */}
            <div
              className="flex flex-wrap gap-2 mb-12"
              style={{ animation: "heroFadeUp 0.6s ease both", animationDelay: "380ms" }}
            >
              {BADGES.map(({ icon, key }) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 text-[12px] font-medium text-gray-600 shadow-sm"
                >
                  <span>{icon}</span>
                  {ar ? BADGE_AR[key] : key}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-6"
              style={{ animation: "heroFadeUp 0.6s ease both", animationDelay: "460ms" }}
            >
              {STATS.map(({ value, suffix, key }) => (
                <StatItem key={key} value={value} suffix={suffix} labelKey={key} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="relative z-20 flex justify-center pb-8"
        style={{ animation: "heroFadeUp 0.6s ease both", animationDelay: "700ms" }}
        aria-hidden
      >
        <div className="flex flex-col items-center gap-1.5 text-gray-400">
          <Mouse size={20} strokeWidth={1.5} className="animate-bounce-slow" />
          <span className="text-[10px] font-medium tracking-widest uppercase opacity-60">
            {ar ? "اسحب للأسفل" : "Scroll"}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-bounce-slow {
          animation: bounceSlow 2.4s ease-in-out infinite;
        }
        @keyframes bounceSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
      `}</style>
    </section>
  );
}
