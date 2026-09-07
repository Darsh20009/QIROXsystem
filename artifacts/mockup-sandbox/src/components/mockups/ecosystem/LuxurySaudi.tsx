// QIROX — Premium Saudi Identity Ecosystem Section
// White background · Real AI photos · Logo-forward · Luxury editorial

export function LuxurySaudi() {
  return (
    <div
      dir="rtl"
      style={{
        background: "#FAFAFA",
        minHeight: "100vh",
        fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', 'Arial', sans-serif",
        color: "#0A0A0A",
        overflow: "hidden",
      }}
    >
      {/* ── HERO STRIP ─────────────────────────────────────────── */}
      <div style={{ position: "relative", height: 540, overflow: "hidden" }}>
        {/* Full-bleed CEO photo */}
        <img
          src="/ai/saudi-ceo.jpg"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }}
        />

        {/* Right→left gradient — white side for text */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to left, rgba(250,250,250,0) 10%, rgba(250,250,250,0.55) 45%, rgba(250,250,250,0.97) 72%, #FAFAFA 100%)",
        }} />

        {/* Top and bottom fade */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to bottom, #FAFAFA, transparent)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, background: "linear-gradient(to top, #FAFAFA, transparent)" }} />

        {/* Text over left side */}
        <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 64px", maxWidth: 620 }}>

          {/* QIROX logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <img src="/ai/qirox-icon-nobg.png" alt="QIROX" style={{ width: 40, height: 40, objectFit: "contain" }} />
            <img src="/ai/qirox-logo.png" alt="QIROX STUDIO" style={{ height: 22, objectFit: "contain", opacity: 0.9 }} />
          </div>

          {/* Label */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 14px", borderRadius: 100, marginBottom: 22,
            background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.18)",
            width: "fit-content",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", display: "inline-block" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.15em" }}>QIROX ECOSYSTEM</span>
          </div>

          <h2 style={{ fontSize: 50, fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.025em", margin: 0, marginBottom: 18 }}>
            نبني ما يجعل
            <br />
            <span style={{ color: "#3b82f6" }}>أعمالك تتفوق</span>
          </h2>
          <p style={{ color: "#555", fontSize: 16, lineHeight: 1.8, maxWidth: 440, margin: 0 }}>
            منظومة متكاملة من الحلول الرقمية — مبنية لتصمد أمام المستقبل وتنمو مع طموحك.
          </p>
        </div>
      </div>

      {/* ── THREE EDITORIAL CARDS ───────────────────────────────── */}
      <div style={{ padding: "0 40px 48px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 8 }}>

        {/* Card 1 — Tech / Digital */}
        <div style={{
          borderRadius: 24, overflow: "hidden",
          background: "#fff",
          boxShadow: "0 4px 32px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
            <img src="/ai/saudi-tech-hand.jpg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }} />
            {/* Icon badge */}
            <div style={{
              position: "absolute", bottom: 16, right: 16,
              width: 44, height: 44, borderRadius: 14,
              background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <img src="/ai/qirox-icon-nobg.png" alt="" style={{ width: 26, height: 26, objectFit: "contain", filter: "brightness(10)" }} />
            </div>
          </div>

          <div style={{ padding: "22px 24px 24px" }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, marginBottom: 8 }}>التقنية والذكاء</h3>
            <p style={{ color: "#666", fontSize: 13.5, lineHeight: 1.75, margin: 0, marginBottom: 18 }}>
              واجهات ذكية مدعومة بـ AI — تحليل بيانات حي، أتمتة كاملة، وتجربة مستخدم لا مثيل لها.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {["GPT-4o", "Dashboard", "Analytics", "Automation"].map(t => (
                <span key={t} style={{
                  padding: "4px 11px", borderRadius: 100, fontSize: 11.5, fontWeight: 600,
                  color: "#3b82f6", background: "#eff6ff", border: "1px solid #bfdbfe",
                }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2 — Hospitality / Sector */}
        <div style={{
          borderRadius: 24, overflow: "hidden",
          background: "#fff",
          boxShadow: "0 4px 32px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
            <img src="/ai/saudi-restaurant.jpg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }} />
            <div style={{
              position: "absolute", bottom: 16, right: 16,
              width: 44, height: 44, borderRadius: 14,
              background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <img src="/ai/qirox-icon-nobg.png" alt="" style={{ width: 26, height: 26, objectFit: "contain", filter: "brightness(10)" }} />
            </div>
          </div>

          <div style={{ padding: "22px 24px 24px" }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, marginBottom: 8 }}>الضيافة والتجزئة</h3>
            <p style={{ color: "#666", fontSize: 13.5, lineHeight: 1.75, margin: 0, marginBottom: 18 }}>
              أنظمة POS ذكية، قوائم رقمية، حجوزات آنية — كل ما يحتاجه مشروعك من اليوم الأول.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {["POS", "QR Menu", "Delivery", "STC Pay"].map(t => (
                <span key={t} style={{
                  padding: "4px 11px", borderRadius: 100, fontSize: 11.5, fontWeight: 600,
                  color: "#f59e0b", background: "#fffbeb", border: "1px solid #fde68a",
                }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Card 3 — Enterprise / Team */}
        <div style={{
          borderRadius: 24, overflow: "hidden",
          background: "#fff",
          boxShadow: "0 4px 32px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
            <img src="/ai/saudi-team.jpg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }} />
            <div style={{
              position: "absolute", bottom: 16, right: 16,
              width: 44, height: 44, borderRadius: 14,
              background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <img src="/ai/qirox-icon-nobg.png" alt="" style={{ width: 26, height: 26, objectFit: "contain", filter: "brightness(10)" }} />
            </div>
          </div>

          <div style={{ padding: "22px 24px 24px" }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, marginBottom: 8 }}>الشركات والمؤسسات</h3>
            <p style={{ color: "#666", fontSize: 13.5, lineHeight: 1.75, margin: 0, marginBottom: 18 }}>
              ERP، إدارة الموارد البشرية، بوابات العملاء — بنية تحتية تقنية جاهزة للمؤسسات.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {["ERP", "HR Portal", "CRM", "Analytics"].map(t => (
                <span key={t} style={{
                  padding: "4px 11px", borderRadius: 100, fontSize: 11.5, fontWeight: 600,
                  color: "#8b5cf6", background: "#f5f3ff", border: "1px solid #ddd6fe",
                }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM — Logo + Stats + CTA ─────────────────────────── */}
      <div style={{
        margin: "0 40px 48px",
        borderRadius: 28,
        background: "#0A0A0A",
        padding: "48px 56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Ambient glow */}
        <div style={{
          position: "absolute", top: -60, right: "30%",
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }} />

        {/* Left: Logo + tagline */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <img
            src="/ai/qirox-icon-nobg.png"
            alt="QIROX"
            style={{ width: 64, height: 64, objectFit: "contain", filter: "brightness(10)" }}
          />
          <div>
            <img src="/ai/qirox-logo.png" alt="QIROX STUDIO" style={{ height: 26, objectFit: "contain", marginBottom: 8, filter: "brightness(10)" }} />
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>نبني البنية الرقمية التي تقود مستقبل أعمالك</p>
          </div>
        </div>

        {/* Center: Stats */}
        <div style={{ display: "flex", gap: 52 }}>
          {[
            { n: "+500", l: "مشروع مُنجز" },
            { n: "98%",  l: "رضا العملاء" },
            { n: "+10",  l: "دولة" },
            { n: "+4",   l: "سنوات خبرة" },
          ].map(({ n, l }) => (
            <div key={n} style={{ textAlign: "center" }}>
              <p style={{ color: "#fff", fontSize: 30, fontWeight: 900, lineHeight: 1, margin: 0, letterSpacing: "-0.03em" }}>{n}</p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "6px 0 0", fontWeight: 500 }}>{l}</p>
            </div>
          ))}
        </div>

        {/* Right: CTA */}
        <button style={{
          padding: "16px 36px",
          borderRadius: 16,
          background: "#3b82f6",
          color: "#fff",
          fontSize: 15,
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(59,130,246,0.35)",
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
        }}>
          ابدأ مشروعك ←
        </button>
      </div>
    </div>
  );
}
