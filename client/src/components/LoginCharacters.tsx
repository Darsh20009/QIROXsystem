/**
 * LoginCharacters — 4 dramatic B&W animated face characters for the login page.
 *
 * Design language: monochrome (black bodies / white features), tight grouping,
 * layered realistic eyes, thick expressive brows, glossy body sheen.
 *
 * Behaviours:
 *  • Idle        : gentle floating bob, pupils track the mouse
 *  • emailFocused: lean toward form, arched brows, wide grin
 *  • showPassword: paws spring up and cover both eyes
 *  • hasError    : worried V-brows, frown, shake
 */

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

interface Props {
  emailFocused: boolean;
  showPassword: boolean;
  hasError:     boolean;
}

type Shape = "rect" | "circle" | "half";

interface Char {
  id:     number;
  cx:     number;
  cy:     number;
  r:      number;
  shape:  Shape;
  delay:  number;
  gradId: string;
}

// ─── SVG canvas ───────────────────────────────────────────────────────────────
const W = 460;
const H = 210;

// ─── characters — tight 18 px gaps, centred in W ─────────────────────────────
const CHARS: Char[] = [
  { id: 0, cx: 103, cy: 112, r: 32, shape: "rect",   delay: 0,    gradId: "g0" },
  { id: 1, cx: 190, cy: 108, r: 37, shape: "circle", delay: 0.28, gradId: "g1" },
  { id: 2, cx: 274, cy: 113, r: 29, shape: "rect",   delay: 0.14, gradId: "g2" },
  { id: 3, cx: 355, cy: 109, r: 34, shape: "half",   delay: 0.42, gradId: "g3" },
];

// ─── eye geometry ─────────────────────────────────────────────────────────────
const EL = { dx: -12, dy: -9  };
const ER = { dx:  12, dy: -9  };
const SOCK_R   = 11;   // white socket
const IRIS_R   = 7.5;  // light-grey iris
const PUPIL_R  = 4.8;  // black pupil
const MAX_MOVE = 3.5;

function pupilOff(ex: number, ey: number, mx: number, my: number) {
  const dx = mx - ex, dy = my - ey;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return { x: 0, y: 0 };
  const mag = Math.min(MAX_MOVE, dist * 0.065);
  return { x: (dx / dist) * mag, y: (dy / dist) * mag };
}

/** Consistent M…Q path so framer-motion can morph between states. */
function mouthD(cx: number, cy: number, r: number, state: "smile" | "frown" | "focus"): string {
  const my = cy + r * 0.44;
  const hw = r * 0.42;          // half-width
  const bulge = r * 0.28;
  if (state === "frown")
    return `M ${cx - hw},${my + bulge * 0.55} Q ${cx},${my - bulge * 0.6} ${cx + hw},${my + bulge * 0.55}`;
  if (state === "focus")
    return `M ${cx - hw * 0.85},${my - bulge * 0.2} Q ${cx},${my + bulge * 1.2} ${cx + hw * 0.85},${my - bulge * 0.2}`;
  return   `M ${cx - hw},${my - bulge * 0.15} Q ${cx},${my + bulge * 0.95} ${cx + hw},${my - bulge * 0.15}`;
}

/** SVG path for body shape */
function bodyPath(c: Char): string {
  const { cx, cy, r, shape } = c;
  if (shape === "circle")
    return `M ${cx},${cy} m -${r},0 a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`;
  if (shape === "half")
    return `M ${cx - r},${cy + r * 0.55} A ${r},${r} 0 0,1 ${cx + r},${cy + r * 0.55} Z`;
  // rounded rect
  const rx = r * 0.3;
  return (
    `M ${cx - r + rx},${cy - r} ` +
    `h ${r * 2 - rx * 2} q ${rx},0 ${rx},${rx} ` +
    `v ${r * 2 - rx * 2} q 0,${rx} -${rx},${rx} ` +
    `h -${r * 2 - rx * 2} q -${rx},0 -${rx},-${rx} ` +
    `v -${r * 2 - rx * 2} q 0,-${rx} ${rx},-${rx} Z`
  );
}

/** Top-of-body gloss arc path */
function glossPath(c: Char): string {
  const { cx, cy, r, shape } = c;
  const gr = r * 0.72;
  if (shape === "circle")
    return `M ${cx - gr},${cy - r * 0.35} A ${gr},${gr * 0.6} 0 0,1 ${cx + gr},${cy - r * 0.35}`;
  if (shape === "half")
    return `M ${cx - gr},${cy - r * 0.25} A ${gr},${gr * 0.45} 0 0,1 ${cx + gr},${cy - r * 0.25}`;
  return `M ${cx - gr},${cy - r * 0.55} A ${gr},${gr * 0.5} 0 0,1 ${cx + gr},${cy - r * 0.55}`;
}

// ─── component ────────────────────────────────────────────────────────────────
export function LoginCharacters({ emailFocused, showPassword, hasError }: Props) {
  const svgRef  = useRef<SVGSVGElement>(null);
  const [mouse, setMouse] = useState({ x: W / 2, y: H / 2 });
  const [errKey, setErrKey] = useState(0);
  const prevErr = useRef(false);

  // rAF-batched mouse tracking
  useEffect(() => {
    let raf = 0;
    let pending = { x: W / 2, y: H / 2 };
    const onMove = (e: MouseEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      pending = {
        x: ((e.clientX - rect.left)  / rect.width)  * W,
        y: ((e.clientY - rect.top)   / rect.height) * H,
      };
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setMouse({ ...pending }));
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    if (hasError && !prevErr.current) setErrKey(k => k + 1);
    prevErr.current = hasError;
  }, [hasError]);

  const moodState: "smile" | "frown" | "focus" =
    hasError ? "frown" : emailFocused ? "focus" : "smile";

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: "auto", overflow: "visible", display: "block" }}
    >
      <defs>
        {/* Body radial gradients — charcoal core → near-black edge */}
        {[
          { id: "g0", c1: "#2e2e2e", c2: "#0a0a0a" },
          { id: "g1", c1: "#292929", c2: "#080808" },
          { id: "g2", c1: "#323232", c2: "#0c0c0c" },
          { id: "g3", c1: "#272727", c2: "#090909" },
        ].map(({ id, c1, c2 }) => (
          <radialGradient key={id} id={id} cx="38%" cy="30%" r="68%" fx="38%" fy="30%">
            <stop offset="0%"   stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </radialGradient>
        ))}

        {/* Iris gradient — light grey centre → mid-grey edge */}
        <radialGradient id="iris" cx="50%" cy="40%" r="60%">
          <stop offset="0%"   stopColor="#d8d8d8" />
          <stop offset="100%" stopColor="#a0a0a0" />
        </radialGradient>

        {/* Gloss gradient — white top fade */}
        <linearGradient id="gloss" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="white" stopOpacity="0.18" />
          <stop offset="100%" stopColor="white" stopOpacity="0"    />
        </linearGradient>

        {/* Soft drop-shadow filter */}
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.55" />
        </filter>
      </defs>

      {CHARS.map((c) => {
        const lx = c.cx + EL.dx, ly = c.cy + EL.dy;
        const rx = c.cx + ER.dx, ry = c.cy + ER.dy;
        const lp = showPassword ? { x: 0, y: 0 } : pupilOff(lx, ly, mouse.x, mouse.y);
        const rp = showPassword ? { x: 0, y: 0 } : pupilOff(rx, ry, mouse.x, mouse.y);
        const mPath  = mouthD(c.cx, c.cy, c.r, moodState);
        const mInit  = mouthD(c.cx, c.cy, c.r, "smile");

        // shake on error, lean on email focus
        const xAnim: number | number[] =
          hasError ? [0, -8, 8, -8, 8, -4, 4, 0] : emailFocused ? 6 : 0;
        const rotAnim = emailFocused && !hasError ? (c.id % 2 === 0 ? 8 : -5) : 0;

        // brow positions
        const browY = c.cy - c.r * 0.72;
        const browW = c.r * 0.48;

        return (
          <motion.g
            key={c.id}
            style={{ originX: `${c.cx}px`, originY: `${c.cy + c.r * 0.3}px` }}
            animate={{ x: xAnim, rotate: rotAnim }}
            transition={{ duration: 0.38, ease: "easeOut" }}
            custom={errKey}
          >
            {/* floating bob */}
            <motion.g
              animate={{ y: [0, -7, 0] }}
              transition={{
                repeat: Infinity,
                duration: 2.2 + c.delay * 0.5,
                delay:    c.delay,
                ease:     "easeInOut",
              }}
            >
              {/* ── shadow ellipse ── */}
              <motion.ellipse
                cx={c.cx} cy={c.cy + c.r + 10}
                rx={c.r * 0.65} ry={5}
                fill="rgba(0,0,0,0.35)"
                animate={{ scaleX: [1, 0.85, 1] }}
                transition={{ repeat: Infinity, duration: 2.2 + c.delay * 0.5, delay: c.delay, ease: "easeInOut" }}
              />

              {/* ── body ── */}
              <path
                d={bodyPath(c)}
                fill={`url(#${c.gradId})`}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth={1.5}
                filter="url(#shadow)"
              />

              {/* ── top gloss ── */}
              <path
                d={glossPath(c)}
                fill="none"
                stroke="url(#gloss)"
                strokeWidth={c.r * 0.45}
                strokeLinecap="round"
                opacity={0.9}
              />

              {/* ── eyebrows (thick, expressive) ── */}
              <motion.g>
                {hasError ? (
                  /* worried — angled sharply inward (V shape) */
                  <>
                    <line
                      x1={c.cx - browW - 3} y1={browY + 4}
                      x2={c.cx - 4}          y2={browY - 4}
                      stroke="rgba(255,255,255,0.85)" strokeWidth={2.8} strokeLinecap="round"
                    />
                    <line
                      x1={c.cx + 4}          y1={browY - 4}
                      x2={c.cx + browW + 3}  y2={browY + 4}
                      stroke="rgba(255,255,255,0.85)" strokeWidth={2.8} strokeLinecap="round"
                    />
                  </>
                ) : emailFocused ? (
                  /* raised + arched — excitement */
                  <>
                    <path
                      d={`M ${c.cx - browW - 2},${browY + 1} Q ${c.cx - browW / 2},${browY - 7} ${c.cx - 3},${browY - 3}`}
                      fill="none" stroke="rgba(255,255,255,0.82)" strokeWidth={2.6} strokeLinecap="round"
                    />
                    <path
                      d={`M ${c.cx + 3},${browY - 3} Q ${c.cx + browW / 2},${browY - 7} ${c.cx + browW + 2},${browY + 1}`}
                      fill="none" stroke="rgba(255,255,255,0.82)" strokeWidth={2.6} strokeLinecap="round"
                    />
                  </>
                ) : (
                  /* idle — gentle slight arch */
                  <>
                    <path
                      d={`M ${c.cx - browW - 1},${browY + 2} Q ${c.cx - browW / 2},${browY - 3} ${c.cx - 3},${browY + 1}`}
                      fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2.2} strokeLinecap="round"
                    />
                    <path
                      d={`M ${c.cx + 3},${browY + 1} Q ${c.cx + browW / 2},${browY - 3} ${c.cx + browW + 1},${browY + 2}`}
                      fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2.2} strokeLinecap="round"
                    />
                  </>
                )}
              </motion.g>

              {/* ── eye sockets (white) ── */}
              <circle cx={lx} cy={ly} r={SOCK_R} fill="white" />
              <circle cx={rx} cy={ry} r={SOCK_R} fill="white" />

              {/* ── iris (grey ring for depth) ── */}
              <circle cx={lx} cy={ly} r={IRIS_R} fill="url(#iris)" />
              <circle cx={rx} cy={ry} r={IRIS_R} fill="url(#iris)" />

              {/* ── pupils + catchlight ── */}
              {!showPassword && (
                <>
                  {/* left */}
                  <circle cx={lx + lp.x} cy={ly + lp.y} r={PUPIL_R} fill="#050505" />
                  <circle cx={lx + lp.x - 1.6} cy={ly + lp.y - 1.8} r={1.8} fill="white" opacity={0.95} />
                  <circle cx={lx + lp.x + 1.6} cy={ly + lp.y + 1.2} r={0.8} fill="white" opacity={0.45} />
                  {/* right */}
                  <circle cx={rx + rp.x} cy={ry + rp.y} r={PUPIL_R} fill="#050505" />
                  <circle cx={rx + rp.x - 1.6} cy={ry + rp.y - 1.8} r={1.8} fill="white" opacity={0.95} />
                  <circle cx={rx + rp.x + 1.6} cy={ry + rp.y + 1.2} r={0.8} fill="white" opacity={0.45} />
                </>
              )}

              {/* ── nose ── */}
              <circle cx={c.cx} cy={c.cy + c.r * 0.18} r={2.5} fill="rgba(255,255,255,0.22)" />

              {/* ── mouth (morphs) ── */}
              <motion.path
                initial={{ d: mInit }}
                animate={{ d: mPath }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth={2.4}
                strokeLinecap="round"
              />

              {/* ── paws (spring up on showPassword) ── */}
              <motion.g
                initial={{ y: 60, opacity: 0 }}
                animate={showPassword ? { y: 0, opacity: 1 } : { y: 60, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
              >
                {/* left paw */}
                <ellipse cx={lx} cy={ly} rx={13} ry={11}
                  fill={`url(#${c.gradId})`} stroke="rgba(255,255,255,0.25)" strokeWidth={1.4} />
                <circle cx={lx - 5} cy={ly - 10} r={4.5}
                  fill={`url(#${c.gradId})`} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                <circle cx={lx}     cy={ly - 12} r={4.5}
                  fill={`url(#${c.gradId})`} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                <circle cx={lx + 5} cy={ly - 10} r={4.5}
                  fill={`url(#${c.gradId})`} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                {/* right paw */}
                <ellipse cx={rx} cy={ry} rx={13} ry={11}
                  fill={`url(#${c.gradId})`} stroke="rgba(255,255,255,0.25)" strokeWidth={1.4} />
                <circle cx={rx - 5} cy={ry - 10} r={4.5}
                  fill={`url(#${c.gradId})`} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                <circle cx={rx}     cy={ry - 12} r={4.5}
                  fill={`url(#${c.gradId})`} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                <circle cx={rx + 5} cy={ry - 10} r={4.5}
                  fill={`url(#${c.gradId})`} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
              </motion.g>

              {/* ── focus sparks ── */}
              {emailFocused && !hasError && !showPassword && (
                <>
                  <motion.line
                    x1={c.cx - c.r - 6}  y1={c.cy - 8}
                    x2={c.cx - c.r - 16} y2={c.cy - 8}
                    stroke="rgba(255,255,255,0.5)" strokeWidth={2} strokeLinecap="round"
                    animate={{ x2: [c.cx - c.r - 14, c.cx - c.r - 19, c.cx - c.r - 14] }}
                    transition={{ repeat: Infinity, duration: 0.75, ease: "easeInOut" }}
                  />
                  <motion.line
                    x1={c.cx - c.r - 6}  y1={c.cy}
                    x2={c.cx - c.r - 12} y2={c.cy}
                    stroke="rgba(255,255,255,0.28)" strokeWidth={1.4} strokeLinecap="round"
                    animate={{ x2: [c.cx - c.r - 10, c.cx - c.r - 15, c.cx - c.r - 10] }}
                    transition={{ repeat: Infinity, duration: 0.75, delay: 0.18, ease: "easeInOut" }}
                  />
                </>
              )}
            </motion.g>
          </motion.g>
        );
      })}

      {/* subtle ground line */}
      <line x1={40} y1={H - 8} x2={W - 40} y2={H - 8}
        stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
    </svg>
  );
}
