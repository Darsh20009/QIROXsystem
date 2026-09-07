import { useRef, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

/* ─── Tech logos on orbits ───────────────────────────────────────────── */
const RING_1 = [
  { abbr: "OAI", name: "OpenAI",  color: "#fff",    bg: "#1a1a1a", duration: 28 },
  { abbr: "GH",  name: "GitHub",  color: "#fff",    bg: "#24292e", duration: 28 },
  { abbr: "MDB", name: "MongoDB", color: "#00ed64", bg: "#0f2117", duration: 28 },
  { abbr: "PP",  name: "PayPal",  color: "#fff",    bg: "#003087", duration: 28 },
  { abbr: "AWS", name: "AWS",     color: "#232f3e", bg: "#ff9900", duration: 28 },
  { abbr: "G",   name: "Google",  color: "#fff",    bg: "#4285f4", duration: 28 },
  { abbr: "⌘",   name: "Apple",   color: "#fff",    bg: "#1d1d1f", duration: 28 },
];
const RING_2 = [
  { abbr: "CF",   name: "Cloudflare",    color: "#fff",    bg: "#f48120", duration: 44 },
  { abbr: "MS",   name: "Microsoft",     color: "#fff",    bg: "#00a4ef", duration: 44 },
  { abbr: "META", name: "Meta",          color: "#fff",    bg: "#0082fb", duration: 44 },
  { abbr: "🐳",   name: "Docker",        color: "#fff",    bg: "#2496ed", duration: 44 },
  { abbr: "STR",  name: "Stripe",        color: "#fff",    bg: "#635bff", duration: 44 },
  { abbr: "NODE", name: "Node.js",       color: "#fff",    bg: "#339933", duration: 44 },
  { abbr: "GCP",  name: "Google Cloud",  color: "#fff",    bg: "#4285f4", duration: 44 },
];

/* ─── Ecosystem cards ────────────────────────────────────────────────── */
const CARDS = [
  {
    icon: "💳",
    title: "Payment Solutions",
    titleAr: "حلول الدفع",
    accent: "#635bff",
    items: ["Paymob", "Apple Pay", "Google Pay", "Visa", "Mastercard", "STC Pay", "Tamara", "Tabby"],
  },
  {
    icon: "☁️",
    title: "Cloud Infrastructure",
    titleAr: "البنية السحابية",
    accent: "#0ea5e9",
    items: ["MongoDB", "AWS", "Docker", "Cloudflare", "GitHub", "Node.js"],
  },
  {
    icon: "🤖",
    title: "Artificial Intelligence",
    titleAr: "الذكاء الاصطناعي",
    accent: "#8b5cf6",
    items: ["OpenAI GPT-4o", "Claude Sonnet", "Gemini", "Azure AI"],
  },
  {
    icon: "🔒",
    title: "Security",
    titleAr: "الأمان",
    accent: "#10b981",
    items: ["SSL / TLS", "WAF Firewall", "Backup Vault", "Uptime Monitor"],
  },
  {
    icon: "📊",
    title: "Analytics",
    titleAr: "التحليلات",
    accent: "#f59e0b",
    items: ["Google Analytics", "Search Console", "Meta Pixel", "Heatmaps"],
  },
  {
    icon: "🖥️",
    title: "Smart Devices",
    titleAr: "الأجهزة الذكية",
    accent: "#ef4444",
    items: ["POS Terminal", "Kitchen Display", "Barcode Scanner", "Receipt Printer", "Self-Order Kiosk", "Tablet"],
  },
];

/* ─── Orbit Logo ─────────────────────────────────────────────────────── */
function OrbitLogo({
  abbr, name, color, bg, radius, index, total, duration,
}: {
  abbr: string; name: string; color: string; bg: string;
  radius: number; index: number; total: number; duration: number;
}) {
  const delay = -duration * (index / total);
  return (
    <div
      title={name}
      className="absolute"
      style={{
        top: "50%", left: "50%",
        marginTop: "-20px", marginLeft: "-20px",
        width: 40, height: 40,
        animation: `eco-orbit ${duration}s linear infinite`,
        animationDelay: `${delay}s`,
        "--r": `${radius}px`,
      } as React.CSSProperties}
    >
      <div
        className="w-full h-full rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg"
        style={{
          color, backgroundColor: bg,
          animation: `eco-counter ${duration}s linear infinite`,
          animationDelay: `${delay}s`,
          border: "2px solid rgba(255,255,255,0.15)",
        }}
      >
        {abbr}
      </div>
    </div>
  );
}

/* ─── 3-D tilt card ──────────────────────────────────────────────────── */
function EcoCard({ icon, title, titleAr, accent, items }: (typeof CARDS)[number]) {
  const ref = useRef<HTMLDivElement>(null);
  const { lang } = useI18n();
  const ar = lang === "ar";

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 16;
    const y = -((e.clientY - r.top) / r.height - 0.5) * 16;
    el.style.transform = `perspective(700px) rotateY(${x}deg) rotateX(${y}deg) translateZ(10px)`;
    el.style.boxShadow = `${-x}px ${-y}px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
    el.style.boxShadow = "";
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      dir={ar ? "rtl" : "ltr"}
      className="relative rounded-[24px] p-6 cursor-default select-none transition-all duration-300 ease-out"
      style={{
        background: "rgba(255,255,255,0.75)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.85)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Accent glow in corner */}
      <div
        className="absolute top-0 right-0 w-28 h-28 rounded-[24px] pointer-events-none opacity-[0.08]"
        style={{ background: `radial-gradient(circle at top right, ${accent}, transparent 70%)` }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-sm flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${accent}22, ${accent}11)`, border: `1px solid ${accent}33` }}
        >
          {icon}
        </div>
        <div>
          <p className="font-bold text-[#0F172A] text-[15px] leading-tight">{ar ? titleAr : title}</p>
          <div className="w-8 h-0.5 mt-1 rounded-full" style={{ background: accent }} />
        </div>
      </div>

      {/* Items */}
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-gray-600"
            style={{
              background: `${accent}0f`,
              border: `1px solid ${accent}22`,
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Section ───────────────────────────────────────────────────── */
export default function EcosystemSection() {
  const { t, lang } = useI18n();
  const ar = lang === "ar";

  // Animate section in on scroll
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      id="ecosystem"
      ref={sectionRef}
      dir={ar ? "rtl" : "ltr"}
      className="relative py-24 md:py-32 overflow-hidden bg-[#fafbff]"
    >
      {/* Ambient background blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-[0.035]"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">

        {/* Section header */}
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-200 bg-blue-50 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[11px] font-bold tracking-[0.12em] text-blue-600 uppercase">
              {ar ? "المنظومة التقنية" : "Our Ecosystem"}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0F172A] mb-4 tracking-tight">
            {ar ? "قلب المنظومة الرقمية" : "Welcome to the"}
            <br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
              {ar ? "كيروكس في المركز" : "QIROX Ecosystem"}
            </span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-[15px] leading-relaxed">
            {ar
              ? "كيروكس لا تعمل وحدها — تربط أفضل التقنيات والشركاء في منصة واحدة متكاملة."
              : "QIROX doesn't work alone — it connects the world's best technologies in one integrated platform."}
          </p>
        </div>

        {/* ── Orbital 3D System ────────────────────────────────────── */}
        <div
          className={`relative flex justify-center mb-24 transition-all duration-1000 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
        >
          {/* 3D tilt wrapper */}
          <div
            className="relative"
            style={{
              width: 480, height: 480,
              transform: "perspective(700px) rotateX(18deg)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Orbit ring 1 */}
            <div aria-hidden className="absolute rounded-full border"
              style={{ width: 300, height: 300, top: 90, left: 90, borderColor: "rgba(59,130,246,0.15)", borderStyle: "dashed", borderWidth: 1 }} />
            {/* Orbit ring 2 */}
            <div aria-hidden className="absolute rounded-full border"
              style={{ width: 460, height: 460, top: 10, left: 10, borderColor: "rgba(139,92,246,0.12)", borderStyle: "dashed", borderWidth: 1 }} />

            {/* Center glow */}
            <div aria-hidden className="absolute rounded-full"
              style={{ width: 140, height: 140, top: 170, left: 170, background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)", animation: "eco-pulse 3s ease-in-out infinite" }} />
            <div aria-hidden className="absolute rounded-full"
              style={{ width: 100, height: 100, top: 190, left: 190, background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)", animation: "eco-pulse 3s ease-in-out infinite", animationDelay: "0.5s" }} />

            {/* Center QIROX logo */}
            <div className="absolute flex items-center justify-center rounded-full bg-white shadow-2xl"
              style={{
                width: 72, height: 72, top: 204, left: 204,
                border: "2px solid rgba(59,130,246,0.2)",
                boxShadow: "0 0 0 6px rgba(59,130,246,0.06), 0 0 0 12px rgba(59,130,246,0.03), 0 8px 32px rgba(59,130,246,0.15)",
              }}
            >
              <img src="/qirox-icon.png" alt="QIROX" className="w-10 h-10 object-contain" />
            </div>

            {/* Ring 1 logos */}
            {RING_1.map((l, i) => (
              <OrbitLogo key={l.name} {...l} radius={150} index={i} total={RING_1.length} />
            ))}
            {/* Ring 2 logos */}
            {RING_2.map((l, i) => (
              <OrbitLogo key={l.name} {...l} radius={230} index={i} total={RING_2.length} />
            ))}
          </div>
        </div>

        {/* ── Divider label ────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-12">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          <span className="text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase px-3 whitespace-nowrap">
            {ar ? "البنية التقنية المتكاملة" : "Digital Business Infrastructure"}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>

        {/* ── 6 Glassmorphism Cards ────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CARDS.map((card, i) => (
            <div
              key={card.title}
              className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${300 + i * 80}ms` }}
            >
              <EcoCard {...card} />
            </div>
          ))}
        </div>
      </div>

      {/* ── CSS keyframes injected once ──────────────────────────── */}
      <style>{`
        @keyframes eco-orbit {
          from { transform: rotate(0deg) translateX(var(--r)); }
          to   { transform: rotate(360deg) translateX(var(--r)); }
        }
        @keyframes eco-counter {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes eco-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.12); }
        }
      `}</style>
    </section>
  );
}
