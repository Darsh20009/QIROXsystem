// Direction C — "الفريق والمنظومة" | Split: human/team left + tech right

const ROWS = [
  { icon: "💳", ar: "حلول الدفع",        en: "Payment Solutions",     accent: "#6366f1", items: ["Apple Pay", "Paymob", "STC Pay", "Tamara", "Visa"] },
  { icon: "☁️", ar: "البنية السحابية",    en: "Cloud Infrastructure", accent: "#0ea5e9", items: ["AWS", "MongoDB", "Cloudflare", "Docker"] },
  { icon: "🤖", ar: "الذكاء الاصطناعي",  en: "Artificial Intelligence", accent: "#8b5cf6", items: ["GPT-4o", "Claude", "Gemini"] },
  { icon: "🔒", ar: "الأمان",             en: "Security",              accent: "#10b981", items: ["SSL/TLS", "WAF Firewall", "Backup Vault"] },
  { icon: "📊", ar: "التحليلات",          en: "Analytics",             accent: "#f59e0b", items: ["Google Analytics", "Meta Pixel"] },
  { icon: "🖥️", ar: "الأجهزة الذكية",   en: "Smart Devices",         accent: "#ef4444", items: ["POS", "Kiosk", "Barcode", "Tablet"] },
];

export function HumanTech() {
  return (
    <div
      dir="rtl"
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "'IBM Plex Sans Arabic', 'Inter', sans-serif",
      }}
    >
      {/* ── Left: Human/Brand side ───────────────────────── */}
      <div
        style={{
          width: "42%",
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
          background: "#060d1f",
        }}
      >
        {/* Team photo background */}
        <img
          src="/sectors/team.png"
          alt="QIROX Team"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            opacity: 0.35,
          }}
        />

        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(6,13,31,0.2) 0%, rgba(6,13,31,0.6) 60%, rgba(6,13,31,0.95) 100%)",
          }}
        />

        {/* Blue glow at top */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: "50%",
            transform: "translateX(50%)",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "48px 40px",
          }}
        >
          {/* Top: logo + label */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
              <img src="/qirox-icon.png" alt="QIROX" style={{ width: 36, height: 36, objectFit: "contain" }} />
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, letterSpacing: "0.1em" }}>
                QIROX STUDIO
              </span>
            </div>

            {/* Main message */}
            <div
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: 100,
                background: "rgba(59,130,246,0.15)",
                border: "1px solid rgba(59,130,246,0.3)",
                marginBottom: 20,
              }}
            >
              <span style={{ color: "#60a5fa", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em" }}>
                DIGITAL INFRASTRUCTURE
              </span>
            </div>

            <h2
              style={{
                color: "#fff",
                fontSize: 40,
                fontWeight: 800,
                lineHeight: 1.25,
                marginBottom: 16,
              }}
            >
              نبني البنية
              <br />
              التقنية التي
              <br />
              <span style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                تدير أعمالك
              </span>
            </h2>

            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 1.75, maxWidth: 320 }}>
              فريق هندسي سعودي متخصص يبني أنظمة رقمية متكاملة — تجمع أفضل التقنيات في منصة واحدة.
            </p>
          </div>

          {/* Bottom: stats row */}
          <div style={{ display: "flex", gap: 32 }}>
            {[{ n: "500+", l: "مشروع" }, { n: "98%", l: "رضا" }, { n: "10+", l: "دول" }].map(({ n, l }) => (
              <div key={n}>
                <p style={{ color: "#fff", fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{n}</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 4 }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Tech capabilities ──────────────────────── */}
      <div
        style={{
          flex: 1,
          background: "#f8fafc",
          padding: "48px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 0,
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ color: "#0f172a", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
            ما يشمله النظام
          </h3>
          <p style={{ color: "#94a3b8", fontSize: 13 }}>
            كل ما تحتاجه لتشغيل أعمالك رقمياً — في مكان واحد
          </p>
        </div>

        {/* Capability rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ROWS.map((row, i) => (
            <div
              key={row.ar}
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                border: "1px solid #f1f5f9",
                boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${row.accent}12`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  flexShrink: 0,
                  border: `1px solid ${row.accent}22`,
                }}
              >
                {row.icon}
              </div>

              {/* Labels */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                  <span style={{ color: "#0f172a", fontSize: 15, fontWeight: 700 }}>{row.ar}</span>
                  <span style={{ color: "#94a3b8", fontSize: 11, fontWeight: 500 }}>{row.en}</span>
                </div>
                {/* Tech pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {row.items.map((item) => (
                    <span
                      key={item}
                      style={{
                        padding: "2px 9px",
                        borderRadius: 100,
                        fontSize: 11,
                        fontWeight: 600,
                        color: row.accent,
                        background: `${row.accent}10`,
                        border: `1px solid ${row.accent}28`,
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Accent bar */}
              <div style={{ width: 3, height: 36, borderRadius: 3, background: row.accent, flexShrink: 0 }} />
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          style={{
            marginTop: 20,
            width: "100%",
            padding: "16px",
            borderRadius: 14,
            background: "#0f172a",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            letterSpacing: "-0.01em",
          }}
        >
          ابدأ مشروعك مع كيروكس ←
        </button>
      </div>
    </div>
  );
}
