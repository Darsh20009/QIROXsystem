import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";
import qiroxNoBgPath from "@assets/qirox_without_background_1771716363944.png";

const BAR_DATA = [38, 55, 42, 70, 58, 85, 63, 92, 74, 100, 82, 96];
const LINE_POINTS = [
  [0, 72], [8, 60], [16, 65], [24, 48], [32, 52], [40, 35],
  [48, 42], [56, 28], [64, 32], [72, 18], [80, 22], [88, 12], [96, 8], [100, 10]
];
const RING_RADIUS = 88;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const isSafari = typeof navigator !== "undefined" && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isMobileDevice = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

function pointsToPath(pts: number[][]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cpx = (x0 + x1) / 2;
    d += ` C ${cpx} ${y0}, ${cpx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

function pointsToArea(pts: number[][], h: number): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]} ${h} L ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cpx = (x0 + x1) / 2;
    d += ` C ${cpx} ${y0}, ${cpx} ${y1}, ${x1} ${y1}`;
  }
  d += ` L ${pts[pts.length - 1][0]} ${h} Z`;
  return d;
}

function AnimatedCounter({ target, duration = 1.8, delay = 0, suffix = "" }: {
  target: number; duration?: number; delay?: number; suffix?: string;
}) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const start = Date.now();
      const tick = () => {
        const elapsed = (Date.now() - start) / 1000;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setVal(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay * 1000);
    return () => clearTimeout(t);
  }, [target, duration, delay]);
  return <>{val.toLocaleString()}{suffix}</>;
}

/* ── Floating particles ─────────────────────────────────────── */
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 1,
  dur: 4 + Math.random() * 6,
  delay: Math.random() * 3,
  color: ["#60a5fa", "#a78bfa", "#34d399", "#f472b6"][Math.floor(Math.random() * 4)],
}));

/* ── Boot lines ─────────────────────────────────────────────── */
const BOOT_LINES = [
  "▶ QIROX OS v3.0 booting...",
  "✓ Auth module loaded",
  "✓ AI engine ready",
  "✓ WebRTC signaling OK",
  "✓ Payment gateway connected",
  "◎ Launching interface...",
];

function BootLine({ text, delay }: { text: string; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay * 1000);
    return () => clearTimeout(t);
  }, [delay]);
  if (!visible) return null;
  return (
    <motion.p
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="text-[9px] font-mono text-emerald-400/70 leading-relaxed"
    >
      {text}
    </motion.p>
  );
}

function MobileSplash({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 500),
      setTimeout(() => setPhase(3), 900),
      setTimeout(() => setPhase(4), 1400),
      setTimeout(onComplete, 2200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence mode="wait">
      {phase < 4 && (
        <motion.div
          key="splash-mobile"
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
          style={{ background: "linear-gradient(135deg, #030308 0%, #060614 50%, #030308 100%)" }}
          exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
        >
          {/* Grid */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }} />

          {/* Glow blobs */}
          <motion.div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", transform: "translate(30%, -30%)" }}
            initial={{ opacity: 0 }} animate={phase >= 1 ? { opacity: 1 } : {}} transition={{ duration: 1.5 }}
          />
          <motion.div className="absolute bottom-0 left-0 w-56 h-56 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)", transform: "translate(-30%, 30%)" }}
            initial={{ opacity: 0 }} animate={phase >= 1 ? { opacity: 1 } : {}} transition={{ duration: 1.5, delay: 0.3 }}
          />

          {/* Particles */}
          {PARTICLES.slice(0, 14).map(p => (
            <motion.div key={p.id} className="absolute rounded-full pointer-events-none"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: p.color, opacity: 0 }}
              animate={phase >= 1 ? { opacity: [0, 0.6, 0], y: [-8, 8, -8] } : {}}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}

          <div className="relative z-10 flex flex-col items-center px-8">
            {/* Logo with glow ring */}
            <motion.div
              className="relative flex items-center justify-center"
              style={{ width: 180, height: 100 }}
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={phase >= 1 ? { opacity: 1, scale: 1, y: 0 } : {}}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Glow behind logo */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)" }} />
              <img
                src={qiroxNoBgPath}
                alt="QIROX"
                className="relative w-full h-auto object-contain z-10"
                data-testid="img-splash-logo"
                style={{ filter: "invert(1) brightness(1.3) drop-shadow(0 0 12px rgba(147,197,253,0.4))" }}
              />
            </motion.div>

            {/* Tagline */}
            <motion.div className="text-center mt-3"
              initial={{ opacity: 0 }} animate={phase >= 2 ? { opacity: 1 } : {}} transition={{ duration: 0.5 }}
            >
              <p className="text-[9px] tracking-[5px] uppercase text-indigo-400/60 font-medium">
                BUILD SYSTEMS. STAY HUMAN.
              </p>
              <p className="text-[8px] tracking-[3px] text-white/20 mt-1">مصنع الأنظمة الرقمية</p>
            </motion.div>

            {/* Divider */}
            <motion.div className="my-4 flex items-center gap-2"
              initial={{ opacity: 0, scaleX: 0 }} animate={phase >= 2 ? { opacity: 1, scaleX: 1 } : {}}
              transition={{ duration: 0.6 }}
            >
              <div className="w-8 h-px bg-gradient-to-r from-transparent to-indigo-500/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/60" />
              <div className="w-8 h-px bg-gradient-to-l from-transparent to-indigo-500/50" />
            </motion.div>

            {/* Stats */}
            <motion.div className="flex items-center gap-5"
              initial={{ opacity: 0, y: 8 }} animate={phase >= 3 ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
            >
              {[
                { label: "عميل نشط", target: 1240, suffix: "+", color: "#60a5fa" },
                { label: "مشروع", target: 874, suffix: "", color: "#a78bfa" },
                { label: "رضا العملاء", target: 99, suffix: "%", color: "#34d399" },
              ].map(({ label, target, suffix, color }, i) => (
                <div key={label} className="text-center">
                  <p className="font-black text-base tabular-nums" style={{ fontFamily: "monospace", color }}>
                    {phase >= 3 && <AnimatedCounter target={target} delay={i * 0.15} suffix={suffix} />}
                  </p>
                  <p className="text-white/25 text-[8px] tracking-widest uppercase mt-0.5">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-28">
            <div className="w-full h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)" }}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.5, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  if (isMobileDevice) {
    return <MobileSplash onComplete={onComplete} />;
  }

  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 80),
      setTimeout(() => setPhase(2), 400),
      setTimeout(() => setPhase(3), 750),
      setTimeout(() => setPhase(4), 1150),
      setTimeout(() => setPhase(5), 1600),
      setTimeout(() => setPhase(6), 2100),
      setTimeout(onComplete, 2600),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const linePath = pointsToPath(LINE_POINTS);
  const areaPath = pointsToArea(LINE_POINTS, 100);
  const R1 = RING_RADIUS, R2 = 70, R3 = 50;
  const C1 = 2 * Math.PI * R1, C2 = 2 * Math.PI * R2, C3 = 2 * Math.PI * R3;

  return (
    <AnimatePresence mode="wait">
      {phase < 6 && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
          style={{ background: "linear-gradient(135deg, #020208 0%, #04040f 50%, #020208 100%)" }}
          exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }}
        >

          {/* ── Grid ── */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.035) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(99,102,241,0.035) 1px, transparent 1px)`,
            backgroundSize: "56px 56px",
          }} />

          {/* ── Glow orbs ── */}
          <motion.div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)", transform: "translate(25%, -25%)" }}
            initial={{ opacity: 0 }} animate={phase >= 1 ? { opacity: 1 } : {}} transition={{ duration: 2 }}
          />
          <motion.div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 65%)", transform: "translate(-25%, 25%)" }}
            initial={{ opacity: 0 }} animate={phase >= 1 ? { opacity: 1 } : {}} transition={{ duration: 2, delay: 0.4 }}
          />
          <motion.div className="absolute top-1/2 left-1/2 w-[700px] h-[700px] rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
            style={{ background: "radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 60%)" }}
            initial={{ scale: 0, opacity: 0 }} animate={phase >= 1 ? { scale: 1.3, opacity: 1 } : {}}
            transition={{ duration: 2.5, ease: "easeOut" }}
          />

          {/* ── Floating particles ── */}
          {PARTICLES.map(p => (
            <motion.div key={p.id} className="absolute rounded-full pointer-events-none"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: p.color }}
              initial={{ opacity: 0 }}
              animate={phase >= 1 ? { opacity: [0, 0.5, 0], y: [0, -15, 0] } : {}}
              transition={{ duration: p.dur, delay: p.delay + 0.5, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}

          {/* ── Top scan line ── */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.5), rgba(6,182,212,0.5), transparent)" }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={phase >= 1 ? { scaleX: 1, opacity: [0, 1, 0.3] } : {}}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* ── Performance chart (top) ── */}
          <motion.div
            className="absolute top-8 left-0 right-0 px-16 md:px-32"
            initial={{ opacity: 0, y: -10 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <svg width="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height: 50 }}>
              <defs>
                <linearGradient id="splAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(99,102,241,0.18)" />
                  <stop offset="100%" stopColor="rgba(99,102,241,0)" />
                </linearGradient>
                <linearGradient id="splLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(99,102,241,0.1)" />
                  <stop offset="50%" stopColor="rgba(6,182,212,0.9)" />
                  <stop offset="100%" stopColor="rgba(139,92,246,0.5)" />
                </linearGradient>
              </defs>
              <motion.path d={areaPath} fill="url(#splAreaGrad)"
                initial={{ opacity: 0 }} animate={phase >= 2 ? { opacity: 1 } : {}} transition={{ duration: 1.2, delay: 0.3 }} />
              <motion.path d={linePath} fill="none" stroke="url(#splLineGrad)" strokeWidth="1.5"
                initial={{ pathLength: 0 }} animate={phase >= 2 ? { pathLength: 1 } : {}}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }} />
              {LINE_POINTS.filter((_, i) => i % 4 === 0).map(([x, y], i) => (
                <motion.circle key={i} cx={x} cy={y} r={1.8} fill="#60a5fa"
                  initial={{ scale: 0, opacity: 0 }} animate={phase >= 2 ? { scale: 1, opacity: 0.8 } : {}}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }} />
              ))}
            </svg>
            <motion.p initial={{ opacity: 0 }} animate={phase >= 2 ? { opacity: 1 } : {}} transition={{ delay: 0.6 }}
              className="text-[7px] tracking-[4px] uppercase text-indigo-400/30 text-center mt-0.5"
            >SYSTEM PERFORMANCE INDEX</motion.p>
          </motion.div>

          {/* ── Boot log (bottom-left) ── */}
          <motion.div
            className="absolute bottom-12 left-8 md:left-16 hidden md:block"
            initial={{ opacity: 0, x: -10 }}
            animate={phase >= 3 ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="space-y-0.5">
              {BOOT_LINES.map((line, i) => (
                <BootLine key={i} text={line} delay={phase >= 3 ? i * 0.18 : 999} />
              ))}
            </div>
          </motion.div>

          {/* ── Center: Multi-ring + Logo ── */}
          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              className="relative flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={phase >= 2 ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            >
              {/* Multi-ring SVG */}
              <svg
                width="340" height="340"
                viewBox="-130 -130 260 260"
                className="absolute pointer-events-none"
                style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
              >
                <defs>
                  <linearGradient id="arc1Grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
                  </linearGradient>
                  <linearGradient id="arc2Grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0.2" />
                  </linearGradient>
                  <linearGradient id="arc3Grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
                  </linearGradient>
                  <filter id="glowBlue" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                {/* Outer ring track */}
                <circle cx="0" cy="0" r={R1} fill="none" stroke="rgba(99,102,241,0.08)" strokeWidth="1" />
                {/* Outer arc (blue→cyan) */}
                <motion.circle cx="0" cy="0" r={R1} fill="none"
                  stroke="url(#arc1Grad)" strokeWidth="2" strokeLinecap="round"
                  strokeDasharray={C1}
                  filter="url(#glowBlue)"
                  initial={{ strokeDashoffset: C1, rotate: -90 }}
                  animate={phase >= 2 ? { strokeDashoffset: C1 * 0.1, rotate: -90 } : {}}
                  style={{ transformOrigin: "0 0" }}
                  transition={{ duration: 2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                />

                {/* Mid ring track */}
                <circle cx="0" cy="0" r={R2} fill="none" stroke="rgba(139,92,246,0.07)" strokeWidth="1" />
                {/* Mid arc (violet→pink) */}
                <motion.circle cx="0" cy="0" r={R2} fill="none"
                  stroke="url(#arc2Grad)" strokeWidth="1.5" strokeLinecap="round"
                  strokeDasharray={C2}
                  initial={{ strokeDashoffset: C2, rotate: 90 }}
                  animate={phase >= 2 ? { strokeDashoffset: C2 * 0.25, rotate: 90 } : {}}
                  style={{ transformOrigin: "0 0" }}
                  transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
                />

                {/* Inner ring track */}
                <circle cx="0" cy="0" r={R3} fill="none" stroke="rgba(52,211,153,0.07)" strokeWidth="1" />
                {/* Inner arc (green→cyan) */}
                <motion.circle cx="0" cy="0" r={R3} fill="none"
                  stroke="url(#arc3Grad)" strokeWidth="1.5" strokeLinecap="round"
                  strokeDasharray={C3}
                  initial={{ strokeDashoffset: C3, rotate: -45 }}
                  animate={phase >= 2 ? { strokeDashoffset: C3 * 0.4, rotate: -45 } : {}}
                  style={{ transformOrigin: "0 0" }}
                  transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.7 }}
                />

                {/* Tick marks */}
                {Array.from({ length: 36 }).map((_, i) => {
                  const angle = (i / 36) * 2 * Math.PI - Math.PI / 2;
                  const inner = 93, outer = i % 6 === 0 ? 99 : 96;
                  const isMain = i % 6 === 0;
                  return (
                    <motion.line key={i}
                      x1={inner * Math.cos(angle)} y1={inner * Math.sin(angle)}
                      x2={outer * Math.cos(angle)} y2={outer * Math.sin(angle)}
                      stroke={isMain ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.12)"} strokeWidth={isMain ? 1.5 : 0.8}
                      initial={{ opacity: 0 }}
                      animate={phase >= 2 ? { opacity: 1 } : {}}
                      transition={{ delay: 0.03 * i, duration: 0.3 }}
                    />
                  );
                })}

                {/* Node dots on outer ring */}
                {[0, 72, 144, 216, 288].map((deg, i) => {
                  const rad = (deg - 90) * Math.PI / 180;
                  const nodeColors = ["#60a5fa", "#a78bfa", "#34d399", "#f472b6", "#fbbf24"];
                  return (
                    <motion.circle key={i}
                      cx={R1 * Math.cos(rad)} cy={R1 * Math.sin(rad)} r={3}
                      fill={nodeColors[i]}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={phase >= 3 ? { scale: 1, opacity: 1 } : {}}
                      transition={{ delay: 0.8 + i * 0.12, duration: 0.5 }}
                    />
                  );
                })}

                {/* Center label */}
                <motion.text x="0" y={R1 + 12} textAnchor="middle"
                  fill="rgba(99,102,241,0.4)" fontSize="6" fontFamily="monospace" letterSpacing="2"
                  initial={{ opacity: 0 }} animate={phase >= 4 ? { opacity: 1 } : {}} transition={{ duration: 0.5 }}
                >99.9% UPTIME</motion.text>
              </svg>

              {/* Logo */}
              <div className="relative z-10 w-[200px] md:w-[240px] flex items-center justify-center" style={{ height: 120 }}>
                {/* Logo glow */}
                <motion.div className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)" }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={phase >= 2 ? { scale: 1.5, opacity: 1 } : {}}
                  transition={{ duration: 1.5 }}
                />
                <motion.img
                  src={qiroxNoBgPath}
                  alt="QIROX"
                  className="relative w-full h-auto object-contain z-10"
                  data-testid="img-splash-logo"
                  style={{ filter: "invert(1) brightness(1.4) drop-shadow(0 0 20px rgba(147,197,253,0.5))" }}
                  initial={{ opacity: 0, scale: 0.85, y: 6 }}
                  animate={phase >= 2 ? { opacity: 1, scale: 1, y: 0 } : {}}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                />
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="flex items-center gap-8 mt-6"
              initial={{ opacity: 0, y: 14 }}
              animate={phase >= 4 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {[
                { label: "عميل نشط", target: 1240, suffix: "+", color: "#60a5fa" },
                { label: "مشروع مكتمل", target: 874, suffix: "", color: "#a78bfa" },
                { label: "نسبة الرضا", target: 99, suffix: "%", color: "#34d399" },
              ].map(({ label, target, suffix, color }, i) => (
                <div key={label} className="text-center">
                  <p className="font-black text-lg tabular-nums" style={{ fontFamily: "monospace", color }}>
                    {phase >= 4 && <AnimatedCounter target={target} delay={i * 0.2} suffix={suffix} />}
                  </p>
                  <p className="text-white/25 text-[9px] tracking-widest uppercase mt-0.5">{label}</p>
                </div>
              ))}
            </motion.div>

            {/* Divider */}
            <motion.div className="flex items-center gap-3 my-5"
              initial={{ opacity: 0, scaleX: 0 }} animate={phase >= 4 ? { opacity: 1, scaleX: 1 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="w-16 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.5))" }} />
              <div className="flex gap-1">
                {["#6366f1", "#8b5cf6", "#06b6d4"].map((c, i) => (
                  <motion.div key={i} className="rounded-full" style={{ width: 4, height: 4, background: c }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
                  />
                ))}
              </div>
              <div className="w-16 h-px" style={{ background: "linear-gradient(90deg, rgba(6,182,212,0.5), transparent)" }} />
            </motion.div>

            {/* Tagline */}
            <motion.div className="text-center"
              initial={{ opacity: 0 }} animate={phase >= 5 ? { opacity: 1 } : {}} transition={{ duration: 0.5 }}
            >
              <p className="text-[10px] tracking-[8px] uppercase font-medium" style={{ color: "rgba(99,102,241,0.5)" }}>
                BUILD SYSTEMS. STAY HUMAN.
              </p>
              <p className="text-[9px] tracking-[5px] text-white/20 mt-1.5">مصنع الأنظمة الرقمية</p>
            </motion.div>
          </div>

          {/* ── Right side: metric badges ── */}
          {phase >= 3 && [
            { top: "24%", right: "8%", val: "+12.4%", label: "Growth", color: "#34d399", delay: 0 },
            { top: "42%", right: "6%", val: "SAR 2.1M", label: "Revenue", color: "#60a5fa", delay: 0.2 },
            { top: "60%", right: "8%", val: "< 40ms", label: "Latency", color: "#a78bfa", delay: 0.35 },
          ].map(({ top, right, val, label, color, delay }, i) => (
            <motion.div key={i} className="absolute hidden md:block" style={{ top, right }}
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + delay }}
            >
              <div className="rounded-xl px-3 py-2 border" style={{
                background: "rgba(255,255,255,0.02)", borderColor: `${color}25`,
                boxShadow: `0 0 12px ${color}15`
              }}>
                <p className="font-mono font-bold text-xs" style={{ color }}>{val}</p>
                <p className="text-white/25 text-[8px] uppercase tracking-widest mt-0.5">{label}</p>
              </div>
            </motion.div>
          ))}

          {/* ── Left side: metric badges ── */}
          {phase >= 3 && [
            { top: "24%", left: "8%", val: "1,847 req/s", label: "Throughput", color: "#f472b6", delay: 0.1 },
            { top: "42%", left: "6%", val: "874 مشروع", label: "Delivered", color: "#fbbf24", delay: 0.25 },
            { top: "60%", left: "8%", val: "99.9% SLA", label: "Availability", color: "#06b6d4", delay: 0.4 },
          ].map(({ top, left, val, label, color, delay }, i) => (
            <motion.div key={i} className="absolute hidden md:block" style={{ top, left }}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + delay }}
            >
              <div className="rounded-xl px-3 py-2 border" style={{
                background: "rgba(255,255,255,0.02)", borderColor: `${color}25`,
                boxShadow: `0 0 12px ${color}15`
              }}>
                <p className="font-mono font-bold text-xs" style={{ color }}>{val}</p>
                <p className="text-white/25 text-[8px] uppercase tracking-widest mt-0.5">{label}</p>
              </div>
            </motion.div>
          ))}

          {/* ── Progress bar ── */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-40">
            <div className="relative">
              <div className="w-full h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4, #34d399)" }}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3.5, ease: "linear" }}
                />
              </div>
              <motion.p className="text-[7px] text-center mt-1.5 tracking-widest uppercase"
                style={{ color: "rgba(99,102,241,0.35)" }}
                initial={{ opacity: 0 }} animate={phase >= 1 ? { opacity: 1 } : {}} transition={{ delay: 0.3 }}
              >QIROX OS LOADING</motion.p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function QiroxLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      <img src={qiroxLogoPath} alt="QIROX" className="h-8 w-auto object-contain" />
    </div>
  );
}

export function QiroxIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <img src={qiroxLogoPath} alt="QIROX" className={`object-contain ${className}`} />
  );
}
