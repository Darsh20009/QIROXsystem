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

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1300),
      setTimeout(() => setPhase(4), 2000),
      setTimeout(() => setPhase(5), 2900),
      setTimeout(() => setPhase(6), 3700),
      setTimeout(onComplete, 4400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const linePath = pointsToPath(LINE_POINTS);
  const areaPath = pointsToArea(LINE_POINTS, 100);

  return (
    <AnimatePresence mode="wait">
      {phase < 6 && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
          style={{ background: "#000" }}
          exit={{ opacity: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
        >
          {/* ── Subtle grid ── */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
              backgroundSize: "48px 48px",
            }}
          />

          {/* ── Ambient center glow ── */}
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={phase >= 1 ? { scale: 1.6, opacity: 1 } : {}}
            transition={{ duration: 2, ease: "easeOut" }}
          />

          {/* ══════════════════════════════════════════════
              BAR CHART — bottom left
          ══════════════════════════════════════════════ */}
          <motion.div
            className="absolute bottom-12 left-8 md:left-16"
            initial={{ opacity: 0 }}
            animate={phase >= 1 ? { opacity: 1 } : {}}
            transition={{ duration: 0.5 }}
          >
            <svg width="180" height="90" viewBox="0 0 180 90">
              {/* Axis lines */}
              <line x1="0" y1="88" x2="180" y2="88" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              {[0, 1, 2, 3].map((i) => (
                <line key={i} x1="0" y1={i * 22} x2="180" y2={i * 22}
                  stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="3 4" />
              ))}
              {BAR_DATA.map((val, i) => {
                const h = (val / 100) * 80;
                const x = i * 14 + 4;
                return (
                  <motion.rect
                    key={i}
                    x={x} y={88 - h} width={9} height={h}
                    rx={2}
                    fill={i === BAR_DATA.length - 1 ? "rgba(255,255,255,0.7)"
                      : i >= BAR_DATA.length - 3 ? "rgba(255,255,255,0.35)"
                      : "rgba(255,255,255,0.15)"}
                    initial={{ scaleY: 0 }}
                    animate={phase >= 1 ? { scaleY: 1 } : {}}
                    transition={{ duration: 0.7, delay: 0.1 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
                  />
                );
              })}
            </svg>
            <motion.p
              initial={{ opacity: 0 }} animate={phase >= 2 ? { opacity: 1 } : {}}
              transition={{ duration: 0.4 }}
              className="text-[8px] tracking-widest uppercase text-white/20 mt-1 text-center"
            >Revenue Growth</motion.p>
          </motion.div>

          {/* ══════════════════════════════════════════════
              BAR CHART — bottom right (inverted color scheme)
          ══════════════════════════════════════════════ */}
          <motion.div
            className="absolute bottom-12 right-8 md:right-16"
            initial={{ opacity: 0 }}
            animate={phase >= 1 ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <svg width="140" height="90" viewBox="0 0 140 90">
              <line x1="0" y1="88" x2="140" y2="88" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              {[22, 44, 66].map((y, i) => (
                <line key={i} x1="0" y1={y} x2="140" y2={y}
                  stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="3 4" />
              ))}
              {[65, 45, 78, 52, 88, 60, 94, 70, 83].map((val, i) => {
                const h = (val / 100) * 80;
                const x = i * 14 + 4;
                return (
                  <motion.rect
                    key={i} x={x} y={88 - h} width={9} height={h} rx={2}
                    fill={i === 6 ? "rgba(255,255,255,0.65)"
                      : i > 5 ? "rgba(255,255,255,0.3)"
                      : "rgba(255,255,255,0.12)"}
                    initial={{ scaleY: 0 }}
                    animate={phase >= 1 ? { scaleY: 1 } : {}}
                    transition={{ duration: 0.7, delay: 0.2 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
                  />
                );
              })}
            </svg>
            <motion.p
              initial={{ opacity: 0 }} animate={phase >= 2 ? { opacity: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-[8px] tracking-widest uppercase text-white/20 mt-1 text-center"
            >Orders / Month</motion.p>
          </motion.div>

          {/* ══════════════════════════════════════════════
              LINE CHART — top strip (full width)
          ══════════════════════════════════════════════ */}
          <motion.div
            className="absolute top-10 left-0 right-0 px-8 md:px-20"
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : {}}
            transition={{ duration: 0.6 }}
          >
            <svg width="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height: 60 }}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
                <linearGradient id="strokeGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                  <stop offset="60%" stopColor="rgba(255,255,255,0.7)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.4)" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              {/* Area fill */}
              <motion.path
                d={areaPath}
                fill="url(#lineGrad)"
                initial={{ opacity: 0 }}
                animate={phase >= 2 ? { opacity: 1 } : {}}
                transition={{ duration: 1.2, delay: 0.3 }}
              />
              {/* Line */}
              <motion.path
                d={linePath}
                fill="none"
                stroke="url(#strokeGrad)"
                strokeWidth="1.5"
                filter="url(#glow)"
                initial={{ pathLength: 0 }}
                animate={phase >= 2 ? { pathLength: 1 } : {}}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              />
              {/* Data dots */}
              {LINE_POINTS.filter((_, i) => i % 3 === 0).map(([x, y], i) => (
                <motion.circle
                  key={i} cx={x} cy={y} r={1.5}
                  fill="white" filter="url(#glow)"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={phase >= 2 ? { scale: 1, opacity: 1 } : {}}
                  transition={{ delay: 0.4 + i * 0.12, duration: 0.4 }}
                />
              ))}
            </svg>
            <motion.p
              initial={{ opacity: 0 }} animate={phase >= 2 ? { opacity: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="text-[8px] tracking-widest uppercase text-white/15 text-center mt-1"
            >System Performance Index</motion.p>
          </motion.div>

          {/* ══════════════════════════════════════════════
              CENTER CONTENT: Ring + Logo
          ══════════════════════════════════════════════ */}
          <div className="relative z-10 flex flex-col items-center">

            {/* Outer ring with animated arc */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={phase >= 3 ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* SVG ring chart */}
              <svg
                width="260" height="260"
                viewBox="-110 -110 220 220"
                className="absolute -inset-[10px] pointer-events-none"
                style={{ width: 260, height: 260, left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
              >
                <defs>
                  <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
                  </linearGradient>
                  <filter id="arcGlow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                {/* Track */}
                <circle cx="0" cy="0" r={RING_RADIUS}
                  fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />

                {/* Animated arc ~87% */}
                <motion.circle
                  cx="0" cy="0" r={RING_RADIUS}
                  fill="none"
                  stroke="url(#arcGrad)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  filter="url(#arcGlow)"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  initial={{ strokeDashoffset: RING_CIRCUMFERENCE, rotate: -90 }}
                  animate={phase >= 3 ? {
                    strokeDashoffset: RING_CIRCUMFERENCE * 0.13,
                    rotate: -90
                  } : {}}
                  style={{ transformOrigin: "0 0" }}
                  transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                />

                {/* Small tick marks */}
                {Array.from({ length: 24 }).map((_, i) => {
                  const angle = (i / 24) * 2 * Math.PI - Math.PI / 2;
                  const inner = 92, outer = 96;
                  return (
                    <motion.line
                      key={i}
                      x1={inner * Math.cos(angle)} y1={inner * Math.sin(angle)}
                      x2={outer * Math.cos(angle)} y2={outer * Math.sin(angle)}
                      stroke="rgba(255,255,255,0.12)" strokeWidth="1"
                      initial={{ opacity: 0 }}
                      animate={phase >= 3 ? { opacity: 1 } : {}}
                      transition={{ delay: 0.05 * i, duration: 0.3 }}
                    />
                  );
                })}

                {/* Percentage text */}
                <motion.text
                  x="0" y="96"
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.25)"
                  fontSize="7"
                  fontFamily="monospace"
                  letterSpacing="2"
                  initial={{ opacity: 0 }}
                  animate={phase >= 4 ? { opacity: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  87% EFFICIENCY
                </motion.text>
              </svg>

              {/* Logo */}
              <motion.div
                className="relative w-[200px] md:w-[240px] flex items-center justify-center"
                style={{ height: 120 }}
              >
                <motion.img
                  src={qiroxNoBgPath}
                  alt="QIROX"
                  className="w-full h-auto object-contain"
                  data-testid="img-splash-logo"
                  style={{ filter: "brightness(0) invert(1)" }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={phase >= 3 ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                />
              </motion.div>
            </motion.div>

            {/* ── Stats row ── */}
            <motion.div
              className="flex items-center gap-6 mt-6"
              initial={{ opacity: 0, y: 12 }}
              animate={phase >= 4 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {[
                { label: "عميل نشط", target: 1240, suffix: "+" },
                { label: "مشروع مكتمل", target: 874, suffix: "" },
                { label: "نسبة الرضا", target: 99, suffix: "%" },
              ].map(({ label, target, suffix }, i) => (
                <div key={label} className="text-center">
                  <p className="text-white font-black text-lg tabular-nums" style={{ fontFamily: "monospace" }}>
                    {phase >= 4 && <AnimatedCounter target={target} delay={i * 0.2} suffix={suffix} />}
                  </p>
                  <p className="text-white/25 text-[9px] tracking-widest uppercase mt-0.5">{label}</p>
                </div>
              ))}
            </motion.div>

            {/* ── Divider ── */}
            <motion.div
              className="w-24 h-px bg-white/10 my-5"
              initial={{ scaleX: 0 }}
              animate={phase >= 4 ? { scaleX: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            />

            {/* ── Tagline ── */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={phase >= 5 ? { opacity: 1 } : {}}
              transition={{ duration: 0.5 }}
            >
              <p className="text-[10px] tracking-[8px] uppercase text-white/40 font-medium">
                BUILD SYSTEMS. STAY HUMAN.
              </p>
              <p className="text-[9px] tracking-[5px] text-white/20 mt-1.5">
                مصنع الأنظمة الرقمية
              </p>
            </motion.div>
          </div>

          {/* ══════════════════════════════════════════════
              SIDE MINI CHARTS — left and right vertical
          ══════════════════════════════════════════════ */}

          {/* Left side: mini donut */}
          <motion.div
            className="absolute left-6 md:left-12 top-1/2 -translate-y-1/2"
            initial={{ opacity: 0, x: -20 }}
            animate={phase >= 3 ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          >
            <svg width="70" height="70" viewBox="-35 -35 70 70">
              <circle cx="0" cy="0" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <motion.circle cx="0" cy="0" r="28" fill="none"
                stroke="rgba(255,255,255,0.45)" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 28}
                initial={{ strokeDashoffset: 2 * Math.PI * 28, rotate: -90 }}
                animate={phase >= 3 ? { strokeDashoffset: 2 * Math.PI * 28 * 0.28, rotate: -90 } : {}}
                style={{ transformOrigin: "0 0" }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
              />
              <text x="0" y="4" textAnchor="middle" fill="rgba(255,255,255,0.5)"
                fontSize="9" fontFamily="monospace" fontWeight="bold">72%</text>
            </svg>
            <p className="text-[7px] tracking-widest text-white/20 text-center mt-1 uppercase">Projects</p>
          </motion.div>

          {/* Right side: mini donut 2 */}
          <motion.div
            className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2"
            initial={{ opacity: 0, x: 20 }}
            animate={phase >= 3 ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
          >
            <svg width="70" height="70" viewBox="-35 -35 70 70">
              <circle cx="0" cy="0" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <motion.circle cx="0" cy="0" r="28" fill="none"
                stroke="rgba(255,255,255,0.35)" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 28}
                initial={{ strokeDashoffset: 2 * Math.PI * 28, rotate: -90 }}
                animate={phase >= 3 ? { strokeDashoffset: 2 * Math.PI * 28 * 0.07, rotate: -90 } : {}}
                style={{ transformOrigin: "0 0" }}
                transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
              />
              <text x="0" y="4" textAnchor="middle" fill="rgba(255,255,255,0.5)"
                fontSize="9" fontFamily="monospace" fontWeight="bold">93%</text>
            </svg>
            <p className="text-[7px] tracking-widest text-white/20 text-center mt-1 uppercase">Uptime</p>
          </motion.div>

          {/* ── Floating data points ── */}
          {phase >= 2 && [
            { top: "22%", left: "18%", val: "+12.4%", delay: 0 },
            { top: "30%", right: "20%", val: "SAR 2.1M", delay: 0.2 },
            { top: "65%", left: "22%", val: "1,847 req/s", delay: 0.4 },
            { top: "68%", right: "18%", val: "< 40ms", delay: 0.3 },
          ].map(({ top, left, right, val, delay }, i) => (
            <motion.div
              key={i}
              className="absolute hidden md:block"
              style={{ top, left, right }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + delay }}
            >
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 backdrop-blur-sm">
                <p className="text-white/60 text-[10px] font-mono font-bold">{val}</p>
              </div>
            </motion.div>
          ))}

          {/* ── Loading bar at very bottom ── */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-32">
            <div className="w-full h-[1px] bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white/30 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3.8, ease: "linear" }}
              />
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
