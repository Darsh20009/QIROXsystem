import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const ease = [0.22, 1, 0.36, 1];

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

const isSafari = typeof navigator !== "undefined" && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

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

const CHART_SETS = {
  growth:   [[0,72],[10,60],[20,55],[30,48],[40,52],[50,35],[60,42],[70,28],[80,22],[90,18],[100,12]],
  wave:     [[0,50],[12,38],[24,55],[36,30],[48,42],[60,25],[72,35],[84,20],[96,28],[100,22]],
  spike:    [[0,70],[8,65],[16,40],[24,58],[32,30],[40,45],[48,15],[56,35],[64,20],[72,40],[80,10],[90,25],[100,18]],
  smooth:   [[0,60],[14,50],[28,45],[42,38],[56,42],[70,30],[84,25],[100,20]],
  volatile: [[0,50],[10,30],[20,55],[30,20],[40,60],[50,15],[60,45],[70,25],[80,50],[90,10],[100,30]],
};

const BAR_SETS = {
  ascending: [25, 35, 30, 45, 40, 55, 50, 65, 60, 75, 70, 85, 80, 95],
  pulse:     [60, 40, 80, 35, 90, 45, 70, 55, 85, 65, 95, 50, 75, 100],
  gentle:    [40, 45, 38, 50, 42, 55, 48, 52, 46, 58, 50, 55],
  sharp:     [20, 80, 30, 90, 25, 85, 35, 95, 40, 88, 45, 92],
};

export function GridPattern({ dark = false, opacity = 0.03 }: { dark?: boolean; opacity?: number }) {
  const color = dark ? "255,255,255" : "0,0,0";
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `linear-gradient(rgba(${color},${opacity}) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(${color},${opacity}) 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
      }}
    />
  );
}

export function DotPattern({ dark = false, opacity = 0.04 }: { dark?: boolean; opacity?: number }) {
  const color = dark ? "#fff" : "#000";
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, ${color} 1px, transparent 0)`,
        backgroundSize: "32px 32px",
        opacity,
      }}
    />
  );
}

export function GlowOrb({ position = "center", dark = false, size = 500, intensity = 0.04 }: {
  position?: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  dark?: boolean; size?: number; intensity?: number;
}) {
  if (isSafari) return null;

  const posMap: Record<string, string> = {
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    "top-left": "top-0 left-0 -translate-x-1/3 -translate-y-1/3",
    "top-right": "top-0 right-0 translate-x-1/3 -translate-y-1/3",
    "bottom-left": "bottom-0 left-0 -translate-x-1/3 translate-y-1/3",
    "bottom-right": "bottom-0 right-0 translate-x-1/3 translate-y-1/3",
  };
  const color = dark ? `rgba(255,255,255,${intensity})` : `rgba(0,0,0,${intensity})`;

  return (
    <div
      className={`absolute rounded-full pointer-events-none ${posMap[position]}`}
      style={{ width: size, height: size, background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, opacity: 0.8 }}
    />
  );
}

export function AnimatedBars({
  data = BAR_SETS.ascending, position = "bottom-left", dark = false,
  width = 180, height = 90, barWidth = 9, gap = 14,
  label, className = "",
}: {
  data?: number[]; position?: string; dark?: boolean;
  width?: number; height?: number; barWidth?: number; gap?: number;
  label?: string; className?: string;
}) {
  const isMobile = useIsMobile();
  if (isMobile) return null;

  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const strokeColor = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const gridColor = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const labelColor = dark ? "text-white/20" : "text-black/20";
  const maxY = height - 2;

  return (
    <div ref={ref} className={`pointer-events-none ${className}`}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <line x1="0" y1={maxY} x2={width} y2={maxY} stroke={strokeColor} strokeWidth="1" />
        {[0, 1, 2, 3].map(i => (
          <line key={i} x1="0" y1={i * (maxY / 4)} x2={width} y2={i * (maxY / 4)}
            stroke={gridColor} strokeWidth="1" strokeDasharray="3 4" />
        ))}
        {data.map((val, i) => {
          const h = (val / 100) * (maxY - 8);
          const x = i * gap + 2;
          const isLast3 = i >= data.length - 3;
          const isLast = i === data.length - 1;
          const fill = dark
            ? (isLast ? "rgba(255,255,255,0.7)" : isLast3 ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.15)")
            : (isLast ? "rgba(0,0,0,0.5)" : isLast3 ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.08)");
          return (
            <motion.rect key={i}
              x={x} y={maxY - h} width={barWidth} height={h} rx={2} fill={fill}
              initial={{ scaleY: 0 }}
              animate={inView ? { scaleY: 1 } : {}}
              transition={{ duration: 0.7, delay: 0.1 + i * 0.04, ease }}
              style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
            />
          );
        })}
      </svg>
      {label && (
        <motion.p
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.5 }}
          className={`text-[8px] tracking-widest uppercase ${labelColor} mt-1 text-center`}
        >{label}</motion.p>
      )}
    </div>
  );
}

export function AnimatedLine({
  points = CHART_SETS.growth, dark = false, label, className = "", height = 60,
}: {
  points?: number[][]; dark?: boolean; label?: string; className?: string; height?: number;
}) {
  const isMobile = useIsMobile();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const linePath = pointsToPath(points);
  const areaPath = pointsToArea(points, 100);
  const idSuffix = `${Math.random().toString(36).slice(2, 8)}`;

  const strokeColors = dark
    ? { start: "rgba(255,255,255,0.1)", mid: "rgba(255,255,255,0.7)", end: "rgba(255,255,255,0.4)" }
    : { start: "rgba(0,0,0,0.05)", mid: "rgba(0,0,0,0.4)", end: "rgba(0,0,0,0.2)" };
  const areaColors = dark
    ? { top: "rgba(255,255,255,0.12)", bottom: "rgba(255,255,255,0)" }
    : { top: "rgba(0,0,0,0.06)", bottom: "rgba(0,0,0,0)" };
  const dotFill = dark ? "white" : "black";

  if (isMobile) {
    return (
      <div className={`pointer-events-none ${className}`}>
        <svg width="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height: Math.min(height, 35) }}>
          <path d={areaPath} fill={areaColors.top} opacity={0.5} />
          <path d={linePath} fill="none" stroke={dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"} strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  return (
    <div ref={ref} className={`pointer-events-none ${className}`}>
      <svg width="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height }}>
        <defs>
          <linearGradient id={`lg-${idSuffix}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={areaColors.top} />
            <stop offset="100%" stopColor={areaColors.bottom} />
          </linearGradient>
          <linearGradient id={`sg-${idSuffix}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={strokeColors.start} />
            <stop offset="60%" stopColor={strokeColors.mid} />
            <stop offset="100%" stopColor={strokeColors.end} />
          </linearGradient>
        </defs>
        <motion.path d={areaPath} fill={`url(#lg-${idSuffix})`}
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 1.2, delay: 0.3 }} />
        <motion.path d={linePath} fill="none" stroke={`url(#sg-${idSuffix})`} strokeWidth="1.5"
          initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 1.4, ease, delay: 0.1 }} />
        {points.filter((_, i) => i % 3 === 0).map(([x, y], i) => (
          <motion.circle key={i} cx={x} cy={y} r={1.5} fill={dotFill}
            initial={{ scale: 0, opacity: 0 }} animate={inView ? { scale: 1, opacity: dark ? 1 : 0.5 } : {}}
            transition={{ delay: 0.5 + i * 0.12, duration: 0.4 }} />
        ))}
      </svg>
      {label && (
        <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.4, delay: 0.6 }}
          className={`text-[8px] tracking-widest uppercase ${dark ? "text-white/15" : "text-black/15"} text-center mt-1`}
        >{label}</motion.p>
      )}
    </div>
  );
}

export function AnimatedRing({
  percent = 72, radius = 28, strokeWidth = 6, dark = false,
  label, className = "", size = 70,
}: {
  percent?: number; radius?: number; strokeWidth?: number; dark?: boolean;
  label?: string; className?: string; size?: number;
}) {
  const isMobile = useIsMobile();
  if (isMobile) return null;

  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const circumference = 2 * Math.PI * radius;
  const trackColor = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const arcColor = dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.25)";
  const textColor = dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.35)";
  const labelColor = dark ? "text-white/20" : "text-black/20";

  return (
    <div ref={ref} className={`pointer-events-none ${className}`}>
      <svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}>
        <circle cx="0" cy="0" r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <motion.circle cx="0" cy="0" r={radius} fill="none"
          stroke={arcColor} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={inView ? { strokeDashoffset: circumference * (1 - percent / 100) } : {}}
          style={{ transform: "rotate(-90deg)", transformOrigin: "0 0" }}
          transition={{ duration: 1.5, ease, delay: 0.3 }}
        />
        <text x="0" y="4" textAnchor="middle" fill={textColor}
          fontSize="9" fontFamily="monospace" fontWeight="bold">{percent}%</text>
      </svg>
      {label && (
        <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.4, delay: 0.6 }}
          className={`text-[7px] tracking-widest ${labelColor} text-center mt-1 uppercase`}
        >{label}</motion.p>
      )}
    </div>
  );
}

export function FloatingMetrics({ dark = false, metrics, className = "" }: {
  dark?: boolean;
  metrics: { value: string; x?: string; y?: string }[];
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const bg = dark ? "bg-white/[0.04] border-white/[0.08]" : "bg-black/[0.02] border-black/[0.05]";
  const text = dark ? "text-white/60" : "text-black/40";

  return (
    <div ref={ref} className={`pointer-events-none ${className}`}>
      {metrics.map(({ value, x, y }, i) => (
        <motion.div key={i}
          className="absolute hidden md:block"
          style={{ left: x, top: y, right: x ? undefined : y }}
          initial={{ opacity: 0, y: 6 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
        >
          <div className={`${bg} border rounded-lg px-2.5 py-1.5`}>
            <p className={`${text} text-[10px] font-mono font-bold`}>{value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function SectionDivider({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const lineColor = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

  return (
    <div ref={ref} className={`relative py-8 ${className}`}>
      <svg width="100%" height="2" className="pointer-events-none">
        <motion.line x1="0" y1="1" x2="100%" y2="1" stroke={lineColor} strokeWidth="1"
          initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 1.2, ease }} />
      </svg>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
        {[0, 1, 2, 3, 4].map(i => (
          <motion.div key={i}
            className={`rounded-full ${dark ? "bg-white/10" : "bg-black/[0.06]"}`}
            style={{ width: 3, height: i === 2 ? 12 : i === 1 || i === 3 ? 8 : 4 }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={inView ? { scaleY: 1, opacity: 1 } : {}}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
          />
        ))}
      </div>
    </div>
  );
}

export function TickMarks({ dark = false, count = 20, radius = 88, innerR = 82, outerR = 86, className = "" }: {
  dark?: boolean; count?: number; radius?: number; innerR?: number; outerR?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const color = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";

  return (
    <svg ref={ref} width={radius * 2 + 20} height={radius * 2 + 20}
      viewBox={`${-(radius + 10)} ${-(radius + 10)} ${(radius + 10) * 2} ${(radius + 10) * 2}`}
      className={`pointer-events-none ${className}`}
    >
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
        return (
          <motion.line key={i}
            x1={innerR * Math.cos(angle)} y1={innerR * Math.sin(angle)}
            x2={outerR * Math.cos(angle)} y2={outerR * Math.sin(angle)}
            stroke={color} strokeWidth="1"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.05 * i, duration: 0.3 }}
          />
        );
      })}
    </svg>
  );
}

type Variant =
  | "hero-light"
  | "hero-dark"
  | "bars-corners"
  | "line-top"
  | "rings-sides"
  | "dashboard"
  | "auth"
  | "minimal"
  | "full-light"
  | "full-dark";

export function PageGraphics({ variant = "hero-light" }: { variant?: Variant }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    const isDark = variant === "hero-dark" || variant === "full-dark" || variant === "auth";
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {isDark ? <GridPattern dark opacity={0.02} /> : <DotPattern opacity={0.018} />}
      </div>
    );
  }

  switch (variant) {
    case "hero-dark":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <GridPattern dark opacity={0.025} />
          <GlowOrb dark position="center" intensity={0.04} />
          <AnimatedBars data={BAR_SETS.ascending} dark className="absolute bottom-8 left-6 md:left-14" label="Revenue" />
          <AnimatedBars data={BAR_SETS.pulse} dark className="absolute bottom-8 right-6 md:right-14" width={140} gap={14} label="Orders" />
          <AnimatedLine points={CHART_SETS.growth} dark className="absolute top-8 left-0 right-0 px-8 md:px-20" label="Performance" />
          <AnimatedRing percent={87} dark className="absolute left-6 md:left-12 top-1/2 -translate-y-1/2" label="Efficiency" />
          <AnimatedRing percent={93} dark className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2" label="Uptime" />
          <FloatingMetrics dark metrics={[
            { value: "+12.4%", x: "18%", y: "22%" },
            { value: "SAR 2.1M", x: "75%", y: "28%" },
            { value: "1,847 req/s", x: "20%", y: "65%" },
            { value: "< 40ms", x: "78%", y: "68%" },
          ]} />
        </div>
      );

    case "hero-light":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <DotPattern opacity={0.025} />
          <GlowOrb position="top-right" intensity={0.03} size={400} />
          <GlowOrb position="bottom-left" intensity={0.02} size={350} />
          <AnimatedBars data={BAR_SETS.gentle} className="absolute bottom-6 left-6 md:left-14 opacity-60" width={160} gap={13} />
          <AnimatedLine points={CHART_SETS.smooth} className="absolute top-6 left-0 right-0 px-10 md:px-24 opacity-50" height={50} />
          <AnimatedRing percent={78} className="absolute right-6 md:right-14 bottom-10 opacity-50" label="Quality" />
        </div>
      );

    case "bars-corners":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <DotPattern opacity={0.02} />
          <AnimatedBars data={BAR_SETS.ascending} className="absolute bottom-4 left-4 md:left-10 opacity-40" width={120} height={60} barWidth={6} gap={9} />
          <AnimatedBars data={BAR_SETS.pulse} className="absolute bottom-4 right-4 md:right-10 opacity-40" width={120} height={60} barWidth={6} gap={9} />
        </div>
      );

    case "line-top":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <DotPattern opacity={0.02} />
          <AnimatedLine points={CHART_SETS.wave} className="absolute top-4 left-0 right-0 px-6 md:px-16 opacity-50" height={45} />
          <GlowOrb position="top-right" intensity={0.025} size={300} />
        </div>
      );

    case "rings-sides":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <DotPattern opacity={0.02} />
          <AnimatedRing percent={72} className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 opacity-50" label="Active" />
          <AnimatedRing percent={91} className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 opacity-50" label="Complete" />
          <GlowOrb position="center" intensity={0.02} size={300} />
        </div>
      );

    case "dashboard":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <DotPattern opacity={0.015} />
          <AnimatedLine points={CHART_SETS.smooth} className="absolute top-0 left-0 right-0 px-10 opacity-30" height={35} />
        </div>
      );

    case "auth":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <GridPattern dark opacity={0.02} />
          <GlowOrb dark position="center" intensity={0.03} size={400} />
          <AnimatedBars data={BAR_SETS.gentle} dark className="absolute bottom-8 left-8 opacity-30" width={120} height={60} barWidth={6} gap={10} />
          <AnimatedBars data={BAR_SETS.sharp} dark className="absolute bottom-8 right-8 opacity-30" width={120} height={60} barWidth={6} gap={10} />
          <AnimatedLine points={CHART_SETS.spike} dark className="absolute top-6 left-0 right-0 px-12 opacity-25" height={40} />
        </div>
      );

    case "minimal":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <DotPattern opacity={0.02} />
          <GlowOrb position="top-right" intensity={0.02} size={250} />
        </div>
      );

    case "full-light":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <DotPattern opacity={0.025} />
          <GlowOrb position="top-left" intensity={0.03} size={400} />
          <GlowOrb position="bottom-right" intensity={0.025} size={350} />
          <AnimatedBars data={BAR_SETS.ascending} className="absolute bottom-6 left-6 md:left-14 opacity-50" label="Growth" />
          <AnimatedBars data={BAR_SETS.pulse} className="absolute bottom-6 right-6 md:right-14 opacity-50" width={140} gap={14} label="Orders" />
          <AnimatedLine points={CHART_SETS.growth} className="absolute top-6 left-0 right-0 px-8 md:px-20 opacity-50" label="Performance" />
          <AnimatedRing percent={82} className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 opacity-45" label="Projects" />
          <AnimatedRing percent={95} className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 opacity-45" label="Satisfaction" />
          <FloatingMetrics metrics={[
            { value: "+24.6%", x: "18%", y: "20%" },
            { value: "SAR 1.8M", x: "76%", y: "25%" },
            { value: "874 مشروع", x: "15%", y: "70%" },
            { value: "99.9% SLA", x: "80%", y: "72%" },
          ]} />
        </div>
      );

    case "full-dark":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <GridPattern dark opacity={0.025} />
          <GlowOrb dark position="top-left" intensity={0.04} />
          <GlowOrb dark position="bottom-right" intensity={0.03} size={400} />
          <AnimatedBars data={BAR_SETS.ascending} dark className="absolute bottom-8 left-6 md:left-14" label="Revenue" />
          <AnimatedBars data={BAR_SETS.pulse} dark className="absolute bottom-8 right-6 md:right-14" width={140} gap={14} label="Engagement" />
          <AnimatedLine points={CHART_SETS.spike} dark className="absolute top-8 left-0 right-0 px-8 md:px-20" label="Throughput" />
          <AnimatedRing percent={87} dark className="absolute left-6 md:left-12 top-1/2 -translate-y-1/2" label="Efficiency" />
          <AnimatedRing percent={93} dark className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2" label="Uptime" />
          <FloatingMetrics dark metrics={[
            { value: "+18.2%", x: "20%", y: "22%" },
            { value: "4,291 عميل", x: "74%", y: "28%" },
            { value: "2,100 req/s", x: "16%", y: "68%" },
            { value: "< 25ms", x: "80%", y: "65%" },
          ]} />
        </div>
      );

    default:
      return null;
  }
}

export { CHART_SETS, BAR_SETS };
