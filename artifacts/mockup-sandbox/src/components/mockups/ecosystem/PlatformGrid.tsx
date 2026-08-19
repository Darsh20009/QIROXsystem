// Direction B — "المنصة التقنية" | Clean Apple-style white, technical credibility

const CAPABILITIES = [
  {
    icon: "💳",
    ar: "حلول الدفع",
    en: "Payment Solutions",
    accent: "#6366f1",
    bg: "#eef2ff",
    partners: ["Apple Pay", "Google Pay", "Paymob", "STC Pay", "Tamara", "Visa"],
  },
  {
    icon: "☁️",
    ar: "البنية السحابية",
    en: "Cloud Infrastructure",
    accent: "#0ea5e9",
    bg: "#f0f9ff",
    partners: ["AWS", "MongoDB", "Cloudflare", "Docker", "GitHub"],
  },
  {
    icon: "🤖",
    ar: "الذكاء الاصطناعي",
    en: "Artificial Intelligence",
    accent: "#8b5cf6",
    bg: "#f5f3ff",
    partners: ["GPT-4o", "Claude", "Gemini", "Azure AI"],
  },
  {
    icon: "🔒",
    ar: "الأمان والحماية",
    en: "Security & Compliance",
    accent: "#10b981",
    bg: "#f0fdf4",
    partners: ["SSL/TLS", "WAF", "Backup", "Monitor"],
  },
  {
    icon: "📊",
    ar: "التحليل والبيانات",
    en: "Analytics & Data",
    accent: "#f59e0b",
    bg: "#fffbeb",
    partners: ["Google Analytics", "Search Console", "Meta Pixel"],
  },
  {
    icon: "🖥️",
    ar: "الأجهزة الذكية",
    en: "Smart Devices",
    accent: "#ef4444",
    bg: "#fef2f2",
    partners: ["POS Terminal", "Kiosk", "Barcode", "Tablet"],
  },
];

export function PlatformGrid() {
  return (
    <div
      dir="rtl"
      className="min-h-screen"
      style={{
        background: "#fff",
        fontFamily: "'IBM Plex Sans Arabic', 'Inter', sans-serif",
        padding: "64px 56px",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-14">
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 100,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              marginBottom: 20,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", display: "inline-block" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.14em" }}>QIROX PLATFORM</span>
          </div>

          <h2
            style={{
              fontSize: 46,
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1.18,
              letterSpacing: "-0.02em",
              marginBottom: 14,
            }}
          >
            البنية التقنية الكاملة
            <br />
            <span style={{ color: "#94a3b8", fontWeight: 700 }}>خلف مشروعك</span>
          </h2>
          <p style={{ color: "#64748b", fontSize: 15, maxWidth: 440, lineHeight: 1.7 }}>
            منصة واحدة تجمع أفضل التقنيات في العالم — مُدارة، مُحسّنة، وجاهزة للإنتاج من اليوم الأول.
          </p>
        </div>

        {/* Stats column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "flex-end" }}>
          {[
            { n: "500+", label: "مشروع مُنجز" },
            { n: "98%", label: "رضا العملاء" },
            { n: "10+", label: "دولة" },
          ].map(({ n, label }) => (
            <div key={n} style={{ textAlign: "left" }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{n}</p>
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3×2 Capability grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {CAPABILITIES.map((cap) => (
          <div
            key={cap.ar}
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: "24px 22px",
              border: "1px solid #f1f5f9",
              boxShadow: "0 2px 16px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.04)",
              position: "relative",
              overflow: "hidden",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            {/* Accent corner */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 80,
                height: 80,
                background: `radial-gradient(circle at top left, ${cap.accent}18, transparent 70%)`,
                borderRadius: 20,
              }}
            />

            {/* Icon */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: cap.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                marginBottom: 16,
                border: `1px solid ${cap.accent}22`,
              }}
            >
              {cap.icon}
            </div>

            {/* Title */}
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{cap.ar}</h3>
            <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16, fontWeight: 500 }}>{cap.en}</p>

            {/* Divider */}
            <div style={{ width: 32, height: 2, background: cap.accent, borderRadius: 2, marginBottom: 14 }} />

            {/* Partner pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {cap.partners.map((p) => (
                <span
                  key={p}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 100,
                    fontSize: 11,
                    fontWeight: 600,
                    color: cap.accent,
                    background: cap.bg,
                    border: `1px solid ${cap.accent}33`,
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div
        style={{
          marginTop: 32,
          padding: "28px 32px",
          borderRadius: 20,
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h4 style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
            جاهز لبناء بنيتك التقنية؟
          </h4>
          <p style={{ color: "#64748b", fontSize: 14 }}>تواصل معنا وابدأ مشروعك خلال 48 ساعة.</p>
        </div>
        <button
          style={{
            padding: "12px 28px",
            borderRadius: 12,
            background: "#3b82f6",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(59,130,246,0.4)",
            whiteSpace: "nowrap",
          }}
        >
          ابدأ الآن ←
        </button>
      </div>
    </div>
  );
}
