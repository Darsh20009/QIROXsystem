import { motion, useInView, animate } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const ease = [0.22, 1, 0.36, 1];

function AnimCounter({ to, duration = 1.5, delay = 0 }: { to: number; duration?: number; delay?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => {
      const ctrl = animate(0, to, {
        duration,
        ease: "easeOut",
        onUpdate: (v) => setVal(Math.round(v)),
      });
      return () => ctrl.stop();
    }, delay * 1000);
    return () => clearTimeout(t);
  }, [inView, to, duration, delay]);
  return <span ref={ref}>{val.toLocaleString("ar-SA")}</span>;
}

const BARS = [28, 42, 36, 58, 45, 72, 61, 88, 76, 95, 83, 100];
const BARS2 = [60, 45, 70, 38, 82, 55, 90, 48, 75, 62, 85, 73];

function MiniBarChart({ bars, color = "#111", delay = 0, height = 40 }: {
  bars: number[]; color?: string; delay?: number; height?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const bw = 6; const gap = 11;
  const w = bars.length * gap;
  return (
    <svg ref={ref} width={w} height={height} viewBox={`0 0 ${w} ${height}`} style={{ overflow: "visible" }}>
      {bars.map((v, i) => {
        const h = (v / 100) * (height - 4);
        const isLast = i === bars.length - 1;
        const isRecent = i >= bars.length - 3;
        const alpha = isLast ? 0.9 : isRecent ? 0.55 : 0.2;
        return (
          <motion.rect key={i}
            x={i * gap} y={height - h} width={bw} height={h} rx={2}
            fill={color} opacity={alpha}
            initial={{ scaleY: 0 }}
            animate={inView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.5, delay: delay + i * 0.04, ease }}
            style={{ transformBox: "fill-box", transformOrigin: "bottom center" }}
          />
        );
      })}
    </svg>
  );
}

function MiniLineChart({ height = 30 }: { height?: number }) {
  const pts = [[0, 28],[12,22],[24,25],[36,16],[48,20],[60,11],[72,14],[84,6],[96,9],[108,4]];
  const w = 110;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const cpx = (x0 + x1) / 2;
    d += ` C ${cpx} ${y0}, ${cpx} ${y1}, ${x1} ${y1}`;
  }
  return (
    <svg ref={ref} width={w} height={height} viewBox={`0 0 ${w} ${height}`}>
      <motion.path d={d} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5"
        initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}}
        transition={{ duration: 1.6, ease, delay: 0.4 }} />
      <motion.circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3}
        fill="#111"
        initial={{ scale: 0 }} animate={inView ? { scale: 1 } : {}}
        transition={{ delay: 1.8, duration: 0.3 }} />
    </svg>
  );
}

function LaptopMockup({ dark = false }: { dark?: boolean }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  const bg = dark ? "#0f0f0f" : "#f9f9f9";
  const screenBg = dark ? "#111" : "#fff";
  const border = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)";
  const textMuted = dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)";
  const textMain = dark ? "#fff" : "#111";
  const cardBg = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const sidebarBg = dark ? "#000" : "#f3f3f3";
  const navDot = dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)";

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 32, rotateX: 6 }}
      animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ duration: 0.9, ease, delay: 0.1 }}
      style={{ perspective: 1200 }}
      className="relative hidden md:block"
    >
      {/* Screen body */}
      <div style={{
        width: 440, borderRadius: 12,
        background: screenBg,
        border: `1px solid ${border}`,
        boxShadow: dark
          ? "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)"
          : "0 24px 80px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}>
        {/* Browser chrome */}
        <div style={{ background: dark ? "#1a1a1a" : "#f0f0f0", padding: "7px 12px", display: "flex", alignItems: "center", gap: 6, borderBottom: `1px solid ${border}` }}>
          <div style={{ display: "flex", gap: 5 }}>
            {["#ff5f57","#febc2e","#28c840"].map((c, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
            ))}
          </div>
          <div style={{ flex: 1, margin: "0 10px", background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", borderRadius: 4, height: 14, display: "flex", alignItems: "center", paddingLeft: 8 }}>
            <span style={{ fontSize: 7, color: textMuted, fontFamily: "monospace" }}>dashboard.qirox.com</span>
          </div>
        </div>

        {/* Dashboard layout */}
        <div style={{ display: "flex", height: 260 }}>
          {/* Sidebar */}
          <div style={{ width: 52, background: sidebarBg, borderRight: `1px solid ${border}`, padding: "12px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: dark ? "#fff" : "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: dark ? "#000" : "#fff" }} />
            </div>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ width: 22, height: 22, borderRadius: 6, background: i === 1 ? (dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)") : navDot }} />
            ))}
          </div>

          {/* Main content */}
          <div style={{ flex: 1, padding: "12px 14px", overflow: "hidden" }}>
            {/* Header stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7, marginBottom: 12 }}>
              {[
                { label: "الطلبات", value: "384", trend: "+18%" },
                { label: "المشاريع", value: "27", trend: "+7%" },
                { label: "العملاء", value: "94", trend: "+3%" },
              ].map((s, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 8 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.12, duration: 0.5 }}
                  style={{ background: cardBg, borderRadius: 6, padding: "7px 9px", border: `1px solid ${border}` }}
                >
                  <p style={{ fontSize: 7, color: textMuted, margin: 0, fontFamily: "sans-serif" }}>{s.label}</p>
                  <p style={{ fontSize: 14, fontWeight: 900, color: textMain, margin: "2px 0", fontFamily: "monospace" }}>{s.value}</p>
                  <p style={{ fontSize: 6.5, color: "#16a34a", margin: 0, fontWeight: 700 }}>{s.trend}</p>
                </motion.div>
              ))}
            </div>

            {/* Chart area */}
            <div style={{ background: cardBg, borderRadius: 6, padding: "8px 10px", marginBottom: 8, border: `1px solid ${border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <p style={{ fontSize: 7, color: textMuted, margin: 0, fontFamily: "sans-serif" }}>الإيرادات الشهرية</p>
                <p style={{ fontSize: 7, color: textMuted, margin: 0, fontFamily: "monospace" }}>2026</p>
              </div>
              <MiniBarChart bars={BARS} color={dark ? "#fff" : "#111"} delay={0.3} height={52} />
            </div>

            {/* Bottom row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              <div style={{ background: cardBg, borderRadius: 6, padding: "7px 9px", border: `1px solid ${border}` }}>
                <p style={{ fontSize: 6.5, color: textMuted, margin: "0 0 4px", fontFamily: "sans-serif" }}>نمو المبيعات</p>
                <MiniLineChart height={28} />
              </div>
              <div style={{ background: cardBg, borderRadius: 6, padding: "7px 9px", border: `1px solid ${border}` }}>
                <p style={{ fontSize: 6.5, color: textMuted, margin: "0 0 5px", fontFamily: "sans-serif" }}>الطلبات النشطة</p>
                {["طلب جديد #384","قيد التنفيذ #381","مكتمل #379"].map((t, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -6 }} animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.8 + i * 0.12 }}
                    style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}
                  >
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: i === 0 ? "#f59e0b" : i === 1 ? "#6366f1" : "#16a34a", flexShrink: 0 }} />
                    <p style={{ fontSize: 6, color: textMain, margin: 0, opacity: 0.6, fontFamily: "sans-serif" }}>{t}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Laptop base */}
      <div style={{
        width: 480, height: 18, margin: "0 auto",
        background: dark ? "#1a1a1a" : "#d8d8d8",
        borderRadius: "0 0 18px 18px",
        boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.12)",
        position: "relative", zIndex: -1, marginTop: -1,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ width: 60, height: 4, borderRadius: 4, background: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" }} />
      </div>
      <div style={{
        width: 520, height: 6, margin: "0 auto",
        background: dark ? "#111" : "#c8c8c8",
        borderRadius: "0 0 8px 8px",
        boxShadow: dark ? "0 8px 30px rgba(0,0,0,0.5)" : "0 8px 30px rgba(0,0,0,0.15)",
      }} />
    </motion.div>
  );
}

function PhoneMockup({ dark = false }: { dark?: boolean }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  const phoneBg = dark ? "#0a0a0a" : "#1a1a1a";
  const screenBg = dark ? "#111" : "#fff";
  const border = dark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.15)";
  const textMain = dark ? "#fff" : "#111";
  const textMuted = dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)";
  const cardBg = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
  const cardBorder = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)";

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 40, x: 10 }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.9, ease, delay: 0.35 }}
      className="hidden md:block"
    >
      <div style={{
        width: 130, borderRadius: 22,
        background: phoneBg,
        border: `1px solid ${border}`,
        padding: 5,
        boxShadow: dark
          ? "0 20px 60px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.06)"
          : "0 20px 60px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(255,255,255,0.08)",
      }}>
        {/* Notch */}
        <div style={{ width: 40, height: 6, borderRadius: 3, background: phoneBg, margin: "0 auto 4px", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
          <div style={{ width: 12, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
        </div>

        {/* Screen */}
        <div style={{ background: screenBg, borderRadius: 16, overflow: "hidden", padding: "10px 8px" }}>
          {/* Status bar */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 6, color: textMuted, fontFamily: "monospace" }}>9:41</span>
            <div style={{ display: "flex", gap: 3 }}>
              {[3,2,1].map(i => (
                <div key={i} style={{ width: 3, height: 3 * i + 1, background: textMain, opacity: i === 3 ? 0.8 : 0.3, borderRadius: 1, alignSelf: "flex-end" }} />
              ))}
            </div>
          </div>

          {/* App header */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 9 }}>
            <div style={{ width: 18, height: 18, borderRadius: 6, background: dark ? "#fff" : "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: dark ? "#000" : "#fff" }} />
            </div>
            <div>
              <p style={{ fontSize: 6.5, fontWeight: 800, color: textMain, margin: 0, fontFamily: "sans-serif" }}>QIROX</p>
              <p style={{ fontSize: 5.5, color: textMuted, margin: 0 }}>لوحة التحكم</p>
            </div>
          </div>

          {/* Stat card */}
          <div style={{ background: dark ? "rgba(255,255,255,0.08)" : "#111", borderRadius: 10, padding: "8px 9px", marginBottom: 7 }}>
            <p style={{ fontSize: 5.5, color: dark ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.5)", margin: "0 0 2px", fontFamily: "sans-serif" }}>إجمالي الإيرادات</p>
            <p style={{ fontSize: 14, fontWeight: 900, color: dark ? "#fff" : "#fff", margin: "0 0 5px", fontFamily: "monospace" }}>12.4k</p>
            <MiniBarChart bars={BARS2.slice(0, 8)} color="#fff" delay={0.5} height={24} />
          </div>

          {/* Notification */}
          {[
            { title: "طلب جديد #384", sub: "قيوة ذهبية — 3 منتجات", dot: "#f59e0b" },
            { title: "مشروع محدّث", sub: "تقدم 78% — قيد التنفيذ", dot: "#6366f1" },
          ].map((n, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: 10 }} animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.9 + i * 0.18 }}
              style={{ display: "flex", gap: 5, alignItems: "flex-start", background: cardBg, borderRadius: 8, padding: "5px 6px", marginBottom: 4, border: `1px solid ${cardBorder}` }}
            >
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: n.dot, marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 6.5, fontWeight: 700, color: textMain, margin: 0, fontFamily: "sans-serif" }}>{n.title}</p>
                <p style={{ fontSize: 5.5, color: textMuted, margin: 0 }}>{n.sub}</p>
              </div>
            </motion.div>
          ))}

          {/* Bottom nav */}
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8, paddingTop: 6, borderTop: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}` }}>
            {["⊞","✦","◎","⤵"].map((icon, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div style={{ width: 14, height: 14, borderRadius: 5, background: i === 0 ? (dark ? "#fff" : "#000") : cardBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 6, color: i === 0 ? (dark ? "#000" : "#fff") : textMuted }}>{icon}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Home indicator */}
        <div style={{ width: 36, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.2)", margin: "5px auto 2px" }} />
      </div>
    </motion.div>
  );
}

function FloatingCard({ text, sub, x, y, delay, dark }: { text: string; sub: string; x: string | number; y: string | number; delay: number; dark?: boolean }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const bg = dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.95)";
  const border = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const textMain = dark ? "#fff" : "#111";
  const textSub = dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";

  return (
    <motion.div
      ref={ref}
      className="absolute hidden lg:flex flex-col"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, y: 12, scale: 0.92 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, ease, delay }}
    >
      <div style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 12,
        padding: "8px 12px",
        backdropFilter: "blur(12px)",
        boxShadow: dark ? "0 8px 24px rgba(0,0,0,0.3)" : "0 8px 24px rgba(0,0,0,0.1)",
        minWidth: 110,
      }}>
        <p style={{ fontSize: 9, fontWeight: 800, color: textMain, margin: 0, fontFamily: "monospace" }}>{text}</p>
        <p style={{ fontSize: 8, color: textSub, margin: "2px 0 0", fontFamily: "sans-serif" }}>{sub}</p>
      </div>
    </motion.div>
  );
}

export function ClientHeroVisual({
  dark = false,
  totalOrders = 0,
  activeProjects = 0,
  completedOrders = 0,
}: {
  dark?: boolean;
  totalOrders?: number;
  activeProjects?: number;
  completedOrders?: number;
}) {
  return (
    <div className="hidden lg:flex items-center justify-center relative" style={{ minHeight: 310 }}>
      {/* Floating stat cards */}
      <FloatingCard text={`+${totalOrders || 12} طلب`} sub="هذا الشهر" x={-20} y={20} delay={0.8} dark={dark} />
      <FloatingCard text={`${activeProjects || 3} مشروع`} sub="قيد التنفيذ" x={-30} y={200} delay={1.0} dark={dark} />
      <FloatingCard text="AI ✦" sub="مساعد ذكي" x="72%" y={-10} delay={1.2} dark={dark} />
      <FloatingCard text={`${completedOrders || 8} مكتمل`} sub="بنجاح" x="68%" y={240} delay={1.1} dark={dark} />

      {/* Device mockups */}
      <div className="flex items-end gap-4 relative">
        <div className="relative" style={{ marginBottom: 20 }}>
          <PhoneMockup dark={dark} />
        </div>
        <LaptopMockup dark={dark} />
      </div>
    </div>
  );
}
