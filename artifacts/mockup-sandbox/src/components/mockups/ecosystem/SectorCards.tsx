// Direction A — "القطاعات" | Dark cinematic, Saudi identity, human photos

const SECTORS = [
  {
    ar: "العقارات",
    en: "Real Estate",
    img: "/sectors/realestate.png",
    tags: ["CRM", "AI Valuation", "Portal", "Contracts"],
    accent: "#3b82f6",
  },
  {
    ar: "المطاعم والضيافة",
    en: "Restaurants & Hospitality",
    img: "/sectors/restaurant.png",
    tags: ["POS", "QR Menu", "Delivery", "Reservations"],
    accent: "#f59e0b",
  },
  {
    ar: "التعليم والتدريب",
    en: "Education & Training",
    img: "/sectors/education.png",
    tags: ["LMS", "Live Classes", "Certificates", "Exams"],
    accent: "#10b981",
  },
  {
    ar: "الشركات والمؤسسات",
    en: "Enterprises & Corporations",
    img: "/sectors/corporate.png",
    tags: ["ERP", "HR Portal", "Finance", "Analytics"],
    accent: "#8b5cf6",
  },
];

export function SectorCards() {
  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col"
      style={{
        background: "#0a0f1e",
        fontFamily: "'IBM Plex Sans Arabic', 'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <div className="px-12 pt-16 pb-10">
        <div className="flex items-center gap-3 mb-6">
          <div style={{ width: 3, height: 32, background: "linear-gradient(to bottom, #3b82f6, #8b5cf6)", borderRadius: 2 }} />
          <span style={{ color: "#6b7db3", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
            QIROX STUDIO · القطاعات
          </span>
        </div>

        <h2 style={{ fontSize: 52, fontWeight: 800, color: "#fff", lineHeight: 1.15, marginBottom: 12 }}>
          نبني مستقبل
          <br />
          <span style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            كل القطاعات
          </span>
        </h2>
        <p style={{ color: "#64748b", fontSize: 16, maxWidth: 480 }}>
          أنظمة رقمية متخصصة مبنية لكل صناعة — ليست قوالب عامة، بل حلول مُصنعة بدقة.
        </p>
      </div>

      {/* 2×2 Grid */}
      <div className="flex-1 grid grid-cols-2 gap-px px-12 pb-12" style={{ gap: 16 }}>
        {SECTORS.map((s) => (
          <div
            key={s.ar}
            className="relative overflow-hidden group"
            style={{
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer",
              minHeight: 260,
            }}
          >
            {/* Photo background */}
            <img
              src={s.img}
              alt={s.ar}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Cinematic overlay */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.15) 100%)" }}
            />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-8">
              <div className="mb-3">
                <p style={{ color: s.accent, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>
                  {s.en}
                </p>
                <h3 style={{ color: "#fff", fontSize: 32, fontWeight: 800, lineHeight: 1.2 }}>
                  {s.ar}
                </h3>
              </div>

              {/* Tech tags */}
              <div className="flex flex-wrap gap-2 mt-3">
                {s.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#fff",
                      background: "rgba(255,255,255,0.1)",
                      border: `1px solid ${s.accent}44`,
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Top-right accent dot */}
            <div
              className="absolute top-5 left-5"
              style={{ width: 8, height: 8, borderRadius: "50%", background: s.accent, boxShadow: `0 0 12px ${s.accent}` }}
            />
          </div>
        ))}
      </div>

      {/* Bottom strip */}
      <div className="px-12 pb-10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {["500+ مشروع", "98% رضا العملاء", "4+ سنوات", "10+ دول"].map((s) => (
            <div key={s} style={{ textAlign: "center" }}>
              <p style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>{s.split(" ").slice(0, 1)}</p>
              <p style={{ color: "#475569", fontSize: 11 }}>{s.split(" ").slice(1).join(" ")}</p>
            </div>
          ))}
        </div>
        <button
          style={{
            padding: "12px 28px",
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            color: "#fff",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(59,130,246,0.4)",
          }}
        >
          ابدأ مشروعك ←
        </button>
      </div>
    </div>
  );
}
