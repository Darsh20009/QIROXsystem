// QIROX — Bento Grid · Saudi Luxury · White background · Icon-forward
// Fixed: uses import.meta.env.BASE_URL for all image paths

const B = import.meta.env.BASE_URL; // "/__mockup/"

const img = (name: string) => `${B}ai/${name}`;

export function QiroxBento() {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#F5F5F0",
        fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', Arial, sans-serif",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* ── ROW 1 ─────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, height: 420 }}>

        {/* Panel A — Hero photo + headline */}
        <div style={{
          borderRadius: 28, overflow: "hidden", position: "relative",
          background: "#111",
        }}>
          <img src={img("saudi-ceo.jpg")} alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%" }} />
          {/* gradient */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 60%)" }} />
          {/* text */}
          <div style={{ position: "absolute", inset: 0, padding: "40px 44px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", marginBottom: 12 }}>
              QIROX STUDIO · الرياض
            </p>
            <h2 style={{ color: "#fff", fontSize: 56, fontWeight: 900, lineHeight: 1.1, margin: 0, letterSpacing: "-0.03em" }}>
              نبني مستقبل
              <br />
              <span style={{ color: "#60a5fa" }}>أعمالك</span>
            </h2>
          </div>
          {/* QIROX icon floating */}
          <div style={{
            position: "absolute", top: 28, left: 28,
            width: 52, height: 52, borderRadius: 16,
            background: "rgba(255,255,255,0.12)", backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <img src={img("qirox-icon-nobg.png")} alt="" style={{ width: 30, height: 30, objectFit: "contain", filter: "brightness(10)" }} />
          </div>
        </div>

        {/* Panel B — QIROX brand stamp */}
        <div style={{
          borderRadius: 28, overflow: "hidden",
          background: "#0A0A14",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          position: "relative", gap: 20,
        }}>
          {/* blue glow */}
          <div style={{
            position: "absolute", width: 200, height: 200, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.2), transparent 70%)",
            filter: "blur(30px)",
          }} />
          <img src={img("qirox-icon-nobg.png")} alt="QIROX"
            style={{ width: 80, height: 80, objectFit: "contain", filter: "brightness(10) drop-shadow(0 0 20px rgba(59,130,246,0.6))", position: "relative" }} />
          <img src={img("qirox-logo.png")} alt="QIROX STUDIO"
            style={{ height: 22, objectFit: "contain", filter: "brightness(10) opacity(0.7)", position: "relative" }} />
          <div style={{
            position: "relative", padding: "6px 16px", borderRadius: 100,
            border: "1px solid rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.08)",
          }}>
            <span style={{ color: "#60a5fa", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em" }}>DIGITAL ECOSYSTEM</span>
          </div>
        </div>
      </div>

      {/* ── ROW 2 ─────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, height: 280 }}>

        {/* Panel C — Restaurant */}
        <div style={{ borderRadius: 24, overflow: "hidden", position: "relative", gridColumn: "span 2", background: "#111" }}>
          <img src={img("saudi-restaurant.jpg")} alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)" }} />
          <div style={{ position: "absolute", bottom: 24, right: 24, left: 24 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 100, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", marginBottom: 10 }}>
              <span style={{ color: "#fbbf24", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>HOSPITALITY</span>
            </div>
            <h3 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0 }}>الضيافة والتجزئة</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "6px 0 0" }}>POS · QR Menu · حجوزات · Delivery</p>
          </div>
        </div>

        {/* Panel D — Stat 500+ */}
        <div style={{
          borderRadius: 24, overflow: "hidden",
          background: "#1D4ED8",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), transparent 60%)" }} />
          <p style={{ color: "#fff", fontSize: 64, fontWeight: 900, margin: 0, lineHeight: 1, letterSpacing: "-0.04em", position: "relative" }}>+500</p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, margin: "8px 0 0", fontWeight: 600, position: "relative" }}>مشروع مُنجز</p>
        </div>

        {/* Panel E — Stat 98% */}
        <div style={{
          borderRadius: 24, overflow: "hidden",
          background: "#0A0A14",
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 70% 30%, rgba(139,92,246,0.12), transparent 60%)" }} />
          <p style={{ color: "#fff", fontSize: 64, fontWeight: 900, margin: 0, lineHeight: 1, letterSpacing: "-0.04em", position: "relative" }}>98%</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "8px 0 0", fontWeight: 600, position: "relative" }}>رضا العملاء</p>
        </div>
      </div>

      {/* ── ROW 3 ─────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, height: 300 }}>

        {/* Panel F — Tech hand */}
        <div style={{ borderRadius: 24, overflow: "hidden", position: "relative", background: "#111" }}>
          <img src={img("saudi-tech-hand.jpg")} alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)" }} />
          <div style={{ position: "absolute", bottom: 22, right: 22 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 100, background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", marginBottom: 8 }}>
              <span style={{ color: "#60a5fa", fontSize: 11, fontWeight: 700 }}>AI + TECH</span>
            </div>
            <h3 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: 0 }}>التقنية والذكاء</h3>
          </div>
        </div>

        {/* Panel G — Team */}
        <div style={{ borderRadius: 24, overflow: "hidden", position: "relative", background: "#111" }}>
          <img src={img("saudi-team.jpg")} alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)" }} />
          <div style={{ position: "absolute", bottom: 22, right: 22 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 100, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", marginBottom: 8 }}>
              <span style={{ color: "#c4b5fd", fontSize: 11, fontWeight: 700 }}>ENTERPRISE</span>
            </div>
            <h3 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: 0 }}>الشركات والمؤسسات</h3>
          </div>
        </div>

        {/* Panel H — CTA */}
        <div style={{
          borderRadius: 24, overflow: "hidden",
          background: "linear-gradient(145deg, #1e3a8a, #1e1b4b)",
          display: "flex", flexDirection: "column",
          alignItems: "flex-end", justifyContent: "space-between",
          padding: "32px 28px",
          position: "relative",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 80%, rgba(99,102,241,0.3), transparent 60%)" }} />

          <div style={{ position: "relative", textAlign: "right" }}>
            <img src={img("qirox-icon-nobg.png")} alt=""
              style={{ width: 44, height: 44, objectFit: "contain", filter: "brightness(10) opacity(0.4)", marginBottom: 16 }} />
            <h3 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
              جاهز لبناء
              <br />مشروعك؟
            </h3>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: "10px 0 0", lineHeight: 1.6 }}>
              تواصل معنا وابدأ
              <br />خلال 48 ساعة.
            </p>
          </div>

          <button style={{
            position: "relative",
            width: "100%",
            padding: "14px 0",
            borderRadius: 14,
            background: "#fff",
            color: "#1e1b4b",
            fontSize: 15,
            fontWeight: 800,
            border: "none",
            cursor: "pointer",
            letterSpacing: "-0.01em",
          }}>
            ابدأ الآن ←
          </button>
        </div>
      </div>
    </div>
  );
}
