import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const ease = [0.22, 1, 0.36, 1];

function useVis() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return { ref, inView };
}

/* ─── Browser Frame ─── */
function BrowserFrame({
  url,
  children,
  className = "",
  delay = 0,
}: {
  url: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useVis();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28, rotateX: 4 }}
      animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ duration: 0.85, ease, delay }}
      style={{ perspective: 1000 }}
      className={className}
    >
      <div
        style={{
          borderRadius: 12,
          background: "#111",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
          overflow: "hidden",
        }}
      >
        {/* Chrome bar */}
        <div style={{ background: "#1a1a1a", padding: "7px 12px", display: "flex", alignItems: "center", gap: 7, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", gap: 5 }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
            ))}
          </div>
          <div style={{ flex: 1, margin: "0 8px", background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 14, display: "flex", alignItems: "center", padding: "0 8px", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(34,197,94,0.7)" }} />
            <span style={{ fontSize: 7, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{url}</span>
          </div>
        </div>
        {children}
      </div>
      {/* Laptop base */}
      <div style={{ width: "110%", marginLeft: "-5%", height: 14, background: "#1c1c1c", borderRadius: "0 0 14px 14px", marginTop: -1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 50, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
      </div>
      <div style={{ width: "118%", marginLeft: "-9%", height: 5, background: "#141414", borderRadius: "0 0 8px 8px" }} />
    </motion.div>
  );
}

/* ─── Phone Frame ─── */
function PhoneFrame({
  children,
  className = "",
  delay = 0,
  animate: animateProp,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animate?: any;
}) {
  const { ref, inView } = useVis();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? (animateProp || { opacity: 1, y: 0 }) : {}}
      transition={{ duration: 0.9, ease, delay }}
      className={className}
    >
      <div style={{
        width: 120,
        borderRadius: 22,
        background: "#0a0a0a",
        border: "1px solid rgba(255,255,255,0.12)",
        padding: 5,
        boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.06)",
      }}>
        <div style={{ width: 38, height: 5, borderRadius: 2.5, background: "#0a0a0a", margin: "0 auto 3px", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
          <div style={{ width: 3.5, height: 3.5, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
          <div style={{ width: 11, height: 2.5, borderRadius: 2, background: "rgba(255,255,255,0.08)" }} />
        </div>
        <div style={{ background: "#111", borderRadius: 16, overflow: "hidden", padding: "8px 7px" }}>
          {/* Status bar */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
            <span style={{ fontSize: 5.5, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>9:41</span>
            <div style={{ display: "flex", gap: 2 }}>
              {[3, 2, 1].map(i => (
                <div key={i} style={{ width: 2.5, height: 2.5 * i + 1, background: "#fff", opacity: i === 3 ? 0.7 : 0.25, borderRadius: 1, alignSelf: "flex-end" }} />
              ))}
            </div>
          </div>
          {children}
        </div>
        <div style={{ width: 34, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "4px auto 2px" }} />
      </div>
    </motion.div>
  );
}

/* ─── Floating Badge ─── */
function FloatingBadge({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const { ref, inView } = useVis();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.88, y: 8 }}
      animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease, delay }}
      style={{
        position: "absolute",
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        padding: "7px 11px",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   PRICES PAGE VISUAL
   Shows pricing tiers + feature checklist in browser
   ═══════════════════════════════════════════════ */
export function PricesHeroVisual({ lang = "ar" }: { lang?: string }) {
  const L = lang === "ar";
  const tiers = [
    { name: L ? "لايت" : "Lite",     price: L ? "على حسب الاحتياج" : "Custom", tag: L ? "مثالي للبداية" : "Perfect start" },
    { name: L ? "برو" : "Pro",       price: L ? "على حسب الاحتياج" : "Custom", tag: L ? "الأكثر مبيعاً" : "Best seller", active: true },
    { name: L ? "إنهائي" : "Infinite", price: L ? "على حسب الاحتياج" : "Custom", tag: L ? "للمؤسسات" : "Enterprise" },
  ];
  const features = [
    L ? "لوحة تحكم شاملة" : "Full dashboard",
    L ? "تقارير تفصيلية" : "Detailed reports",
    L ? "تطبيق جوال" : "Mobile app",
    L ? "دعم أولوية" : "Priority support",
  ];

  return (
    <div className="hidden lg:flex items-center justify-center relative" style={{ minHeight: 320 }}>
      {/* Browser mockup */}
      <BrowserFrame url={L ? "prices.qiroxstudio.online" : "prices.qiroxstudio.online"} delay={0.1}>
        <div style={{ padding: "14px 16px", background: "#0d0d0d" }}>
          <p style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", marginBottom: 10, fontFamily: "sans-serif" }}>
            {L ? "اختر باقتك" : "Choose your plan"}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
            {tiers.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                style={{
                  background: t.active ? "#fff" : "rgba(255,255,255,0.05)",
                  border: t.active ? "none" : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 8,
                  padding: "10px 8px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {t.active && (
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#111" }} />
                )}
                <p style={{ fontSize: 7, fontWeight: 800, color: t.active ? "#000" : "rgba(255,255,255,0.5)", marginBottom: 4, fontFamily: "sans-serif" }}>{t.name}</p>
                <p style={{ fontSize: 11, fontWeight: 900, color: t.active ? "#000" : "#fff", fontFamily: "monospace", lineHeight: 1 }}>{t.price}</p>
                <p style={{ fontSize: 5.5, color: t.active ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.25)", marginTop: 3, fontFamily: "sans-serif" }}>{t.tag}</p>
              </motion.div>
            ))}
          </div>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 7, padding: "8px 10px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p style={{ fontSize: 6.5, color: "rgba(255,255,255,0.25)", marginBottom: 6, fontFamily: "sans-serif" }}>{L ? "تشمل الباقة" : "Includes"}</p>
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.1 }}
                style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 6, color: "#fff" }}>✓</span>
                </div>
                <p style={{ fontSize: 6.5, color: "rgba(255,255,255,0.5)", fontFamily: "sans-serif" }}>{f}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </BrowserFrame>

      {/* Phone mockup */}
      <PhoneFrame delay={0.35} className="absolute -bottom-6 -right-4 z-10">
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
          <div style={{ width: 18, height: 18, borderRadius: 6, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: "#111" }} />
          </div>
          <div>
            <p style={{ fontSize: 6.5, fontWeight: 800, color: "#fff", margin: 0 }}>QIROX</p>
            <p style={{ fontSize: 5, color: "rgba(255,255,255,0.3)", margin: 0 }}>{L ? "باقاتنا" : "Our Plans"}</p>
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: 8, padding: "8px 8px" }}>
          <p style={{ fontSize: 6, color: "rgba(0,0,0,0.4)", margin: "0 0 4px" }}>{L ? "الباقة الأكثر طلباً" : "Top plan"}</p>
          <p style={{ fontSize: 9, fontWeight: 900, color: "#111", fontFamily: "sans-serif", margin: "0 0 2px" }}>{L ? "على حسب الاحتياج" : "Custom"}</p>
          <p style={{ fontSize: 5, color: "rgba(0,0,0,0.3)", margin: 0 }}>{L ? "تواصل للحصول على عرض" : "Contact for quote"}</p>
        </div>
        <div style={{ marginTop: 7, space: 4 }}>
          {[L ? "نظام كامل" : "Full system", L ? "جوال + ويب" : "Mobile + Web"].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 4 }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.4)" }} />
              <p style={{ fontSize: 6, color: "rgba(255,255,255,0.5)", margin: 0, fontFamily: "sans-serif" }}>{item}</p>
            </div>
          ))}
        </div>
      </PhoneFrame>

      {/* Floating badges */}
      <FloatingBadge delay={0.8} style={{ top: -10, right: -10 }}>
        <p style={{ fontSize: 8, fontWeight: 800, color: "#fff", margin: 0 }}>100+</p>
        <p style={{ fontSize: 6.5, color: "rgba(255,255,255,0.4)", margin: "1px 0 0", fontFamily: "sans-serif" }}>{L ? "نظام مُسلَّم" : "Delivered"}</p>
      </FloatingBadge>
      <FloatingBadge delay={1.0} style={{ bottom: 30, left: -16 }}>
        <p style={{ fontSize: 8, fontWeight: 800, color: "#fff", margin: 0 }}>5★</p>
        <p style={{ fontSize: 6.5, color: "rgba(255,255,255,0.4)", margin: "1px 0 0", fontFamily: "sans-serif" }}>{L ? "تقييم العملاء" : "Rating"}</p>
      </FloatingBadge>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ABOUT PAGE VISUAL
   Shows company stats + team + milestones in browser
   ═══════════════════════════════════════════════ */
export function AboutHeroVisual({ lang = "ar" }: { lang?: string }) {
  const L = lang === "ar";
  return (
    <div className="hidden lg:flex items-center justify-center relative" style={{ minHeight: 300 }}>

      {/* Main browser */}
      <BrowserFrame url="about.qiroxstudio.online" delay={0.1}>
        <div style={{ padding: "14px 16px", background: "#0d0d0d" }}>
          {/* Header strip */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: "#111" }} />
            </div>
            <div>
              <p style={{ fontSize: 7.5, fontWeight: 900, color: "#fff", margin: 0 }}>QIROX Studio</p>
              <p style={{ fontSize: 5.5, color: "rgba(255,255,255,0.3)", margin: 0 }}>{L ? "منصة الأنظمة الرقمية" : "Digital Systems Platform"}</p>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7, marginBottom: 10 }}>
            {[
              { val: "2023", label: L ? "تأسست" : "Founded" },
              { val: "100+", label: L ? "عميل" : "Clients" },
              { val: "7+", label: L ? "قطاع" : "Sectors" },
            ].map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                style={{ background: "rgba(255,255,255,0.05)", borderRadius: 7, padding: "8px 8px", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                <p style={{ fontSize: 12, fontWeight: 900, color: "#fff", fontFamily: "monospace", margin: 0 }}>{s.val}</p>
                <p style={{ fontSize: 5.5, color: "rgba(255,255,255,0.3)", fontFamily: "sans-serif", margin: "2px 0 0" }}>{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Timeline / milestones */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 7, padding: "8px 10px", border: "1px solid rgba(255,255,255,0.04)" }}>
            <p style={{ fontSize: 6, color: "rgba(255,255,255,0.2)", marginBottom: 7, fontFamily: "sans-serif" }}>{L ? "مسيرتنا" : "Our Journey"}</p>
            {[
              { year: "2023", label: L ? "تأسيس المنصة" : "Platform founded" },
              { year: "2024", label: L ? "توسع لـ 6 قطاعات" : "Expanded to 6 sectors" },
              { year: "2025", label: L ? "100+ نظام مُسلَّم" : "100+ systems delivered" },
            ].map((m, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.15 }}
                style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 6 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: i === 2 ? "#fff" : "rgba(255,255,255,0.35)", flexShrink: 0, marginTop: 1 }} />
                  {i < 2 && <div style={{ width: 1, height: 8, background: "rgba(255,255,255,0.1)" }} />}
                </div>
                <div>
                  <span style={{ fontSize: 6, fontWeight: 800, color: i === 2 ? "#fff" : "rgba(255,255,255,0.45)", fontFamily: "monospace" }}>{m.year} · </span>
                  <span style={{ fontSize: 6, color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}>{m.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </BrowserFrame>

      {/* Floating phone */}
      <PhoneFrame delay={0.4} className="absolute -right-8 top-4 z-10">
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 7 }}>
          <div style={{ width: 14, height: 14, borderRadius: 5, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 6, height: 6, borderRadius: 2, background: "#111" }} />
          </div>
          <p style={{ fontSize: 6, fontWeight: 800, color: "#fff", margin: 0 }}>QIROX</p>
        </div>
        {[
          { emoji: "🍽️", name: L ? "مطاعم" : "Cafes" },
          { emoji: "🛍️", name: L ? "متاجر" : "Stores" },
          { emoji: "📚", name: L ? "تعليم" : "Edu" },
          { emoji: "🏢", name: L ? "شركات" : "Corp" },
        ].map((s, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.1 }}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "4px 6px", marginBottom: 4, border: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 9 }}>{s.emoji}</span>
            <p style={{ fontSize: 6, color: "rgba(255,255,255,0.55)", margin: 0, fontFamily: "sans-serif" }}>{s.name}</p>
          </motion.div>
        ))}
      </PhoneFrame>

      <FloatingBadge delay={0.9} style={{ bottom: -10, left: -14 }}>
        <p style={{ fontSize: 8, fontWeight: 800, color: "#fff", margin: 0 }}>✦ AI</p>
        <p style={{ fontSize: 6, color: "rgba(255,255,255,0.35)", margin: "1px 0 0" }}>{L ? "مدمج في كل نظام" : "Built into every system"}</p>
      </FloatingBadge>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CONTACT PAGE VISUAL
   Shows contact channels + support availability
   ═══════════════════════════════════════════════ */
export function ContactHeroVisual({ lang = "ar" }: { lang?: string }) {
  const L = lang === "ar";
  return (
    <div className="hidden lg:flex items-center justify-center relative" style={{ minHeight: 280 }}>

      {/* Browser */}
      <BrowserFrame url="contact.qiroxstudio.online" delay={0.1}>
        <div style={{ padding: "14px 16px", background: "#0d0d0d" }}>
          <p style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", marginBottom: 10, fontFamily: "sans-serif" }}>
            {L ? "تواصل مع الفريق" : "Reach the team"}
          </p>

          {/* Channel cards */}
          {[
            { icon: "💬", label: "WhatsApp", sub: L ? "رد فوري" : "Instant reply", dot: "#25D366" },
            { icon: "✈️", label: "Telegram", sub: L ? "متوفر ٢٤/٧" : "24/7 available", dot: "#229ED9" },
            { icon: "📧", label: "Email", sub: "info@qiroxstudio.online", dot: "#fff" },
          ].map((c, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.12 }}
              style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px", marginBottom: 7, border: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontSize: 13 }}>{c.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 7.5, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "sans-serif" }}>{c.label}</p>
                <p style={{ fontSize: 6, color: "rgba(255,255,255,0.35)", margin: "2px 0 0", fontFamily: "sans-serif" }}>{c.sub}</p>
              </div>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, opacity: 0.7 }} />
            </motion.div>
          ))}

          {/* Status bar */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: "rgba(255,255,255,0.03)", borderRadius: 7, border: "1px solid rgba(255,255,255,0.04)" }}>
            <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.8, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
            <p style={{ fontSize: 6.5, color: "rgba(255,255,255,0.45)", fontFamily: "sans-serif", margin: 0 }}>
              {L ? "الفريق متاح الآن — متوسط الرد: أقل من ساعة" : "Team available — avg reply under 1h"}
            </p>
          </motion.div>
        </div>
      </BrowserFrame>

      {/* Phone */}
      <PhoneFrame delay={0.4} className="absolute -bottom-4 -right-6 z-10">
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 7 }}>
          <div style={{ width: 14, height: 14, borderRadius: 5, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 6, height: 6, borderRadius: 2, background: "#111" }} />
          </div>
          <p style={{ fontSize: 6, fontWeight: 800, color: "#fff", margin: 0 }}>QIROX Support</p>
        </div>
        {/* Chat bubbles */}
        {[
          { msg: L ? "مرحباً، كيف أساعدك؟" : "Hi! How can I help?", mine: false },
          { msg: L ? "أريد معرفة الباقات" : "I want to know plans", mine: true },
          { msg: L ? "تفضّل! لدينا 3 مستويات" : "Sure! We have 3 tiers", mine: false },
        ].map((b, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.2 }}
            style={{ display: "flex", justifyContent: b.mine ? "flex-end" : "flex-start", marginBottom: 4 }}>
            <div style={{
              background: b.mine ? "#fff" : "rgba(255,255,255,0.08)",
              borderRadius: b.mine ? "8px 8px 0 8px" : "8px 8px 8px 0",
              padding: "4px 6px",
              maxWidth: "75%",
            }}>
              <p style={{ fontSize: 5.5, color: b.mine ? "#111" : "rgba(255,255,255,0.65)", margin: 0, fontFamily: "sans-serif" }}>{b.msg}</p>
            </div>
          </motion.div>
        ))}
      </PhoneFrame>

      <FloatingBadge delay={1.0} style={{ top: -8, right: -12 }}>
        <p style={{ fontSize: 8, fontWeight: 800, color: "#fff", margin: 0 }}>⚡ {L ? "دعم سريع" : "Fast Support"}</p>
        <p style={{ fontSize: 6, color: "rgba(255,255,255,0.35)", margin: "1px 0 0" }}>{L ? "متوفر دائماً" : "Always available"}</p>
      </FloatingBadge>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TEMPLATES / PORTFOLIO PAGE VISUAL  
   Shows a grid of system previews
   ═══════════════════════════════════════════════ */
export function TemplatesHeroVisual({ lang = "ar" }: { lang?: string }) {
  const L = lang === "ar";
  const systems = [
    { emoji: "🍽️", name: L ? "نظام المطاعم" : "Restaurant System", ver: "v3.2" },
    { emoji: "🛍️", name: L ? "متجر إلكتروني" : "E-Commerce", ver: "v2.8" },
    { emoji: "📚", name: L ? "منصة تعليمية" : "LMS Platform", ver: "v2.1" },
    { emoji: "🏋️", name: L ? "نظام اللياقة" : "Fitness System", ver: "v1.9" },
    { emoji: "🏢", name: L ? "نظام مؤسسي" : "Enterprise", ver: "v4.0" },
    { emoji: "💇", name: L ? "صالون تجميل" : "Beauty Salon", ver: "v2.4" },
  ];
  return (
    <div className="hidden lg:flex items-center justify-center relative" style={{ minHeight: 300 }}>
      <BrowserFrame url="systems.qiroxstudio.online" delay={0.1}>
        <div style={{ padding: "12px 14px", background: "#0d0d0d" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", margin: 0, fontFamily: "sans-serif" }}>{L ? "الأنظمة الجاهزة" : "Ready Systems"}</p>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 4, padding: "2px 6px" }}>
              <p style={{ fontSize: 6.5, color: "rgba(255,255,255,0.45)", margin: 0, fontFamily: "monospace" }}>{systems.length} {L ? "نظام" : "systems"}</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
            {systems.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.08 }}
                style={{ background: "rgba(255,255,255,0.04)", borderRadius: 7, padding: "9px 8px", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                <span style={{ fontSize: 14 }}>{s.emoji}</span>
                <p style={{ fontSize: 6, fontWeight: 700, color: "rgba(255,255,255,0.6)", margin: "4px 0 2px", fontFamily: "sans-serif" }}>{s.name}</p>
                <p style={{ fontSize: 5.5, color: "rgba(255,255,255,0.2)", margin: 0, fontFamily: "monospace" }}>{s.ver}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </BrowserFrame>

      <PhoneFrame delay={0.4} className="absolute -right-6 top-8 z-10">
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
          <div style={{ width: 14, height: 14, borderRadius: 5, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 6, height: 6, borderRadius: 2, background: "#111" }} />
          </div>
          <p style={{ fontSize: 6, fontWeight: 800, color: "#fff", margin: 0 }}>QIROX</p>
        </div>
        {systems.slice(0, 4).map((s, i) => (
          <motion.div key={i}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.1 }}
            style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
            <span style={{ fontSize: 10 }}>{s.emoji}</span>
            <p style={{ fontSize: 6, color: "rgba(255,255,255,0.5)", margin: 0, fontFamily: "sans-serif" }}>{s.name}</p>
          </motion.div>
        ))}
      </PhoneFrame>

      <FloatingBadge delay={0.9} style={{ bottom: -8, left: -14 }}>
        <p style={{ fontSize: 8, fontWeight: 800, color: "#fff", margin: 0 }}>✦ {L ? "مبني من الصفر" : "Built from scratch"}</p>
        <p style={{ fontSize: 6, color: "rgba(255,255,255,0.35)", margin: "1px 0 0" }}>{L ? "ليس قالباً جاهزاً" : "Not a template"}</p>
      </FloatingBadge>
    </div>
  );
}
