/**
 * LoginCharacters — 4 animated face characters for the login page left panel.
 *
 * Behaviours:
 *  • Idle        : gentle floating bob, eyes track the mouse
 *  • emailFocused: characters lean toward the form, focused brows, big smile
 *  • showPassword: paws slide up and cover both eyes (peek-a-boo)
 *  • hasError    : frown + worried brows + shake
 */

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

// ─── types ────────────────────────────────────────────────────────────────────
interface Props {
  emailFocused: boolean;
  showPassword: boolean;
  hasError:     boolean;
}

type Shape = "rect" | "circle" | "half";

interface Char {
  id:    number;
  cx:    number; // SVG center-x
  cy:    number; // SVG center-y
  r:     number; // body half-size / radius
  shape: Shape;
  fill:  string;
  line:  string; // stroke colour
  delay: number; // float animation phase
}

// ─── SVG canvas ───────────────────────────────────────────────────────────────
const W = 460;
const H = 220;

// ─── character definitions ────────────────────────────────────────────────────
const CHARS: Char[] = [
  { id: 0, cx: 52,  cy: 112, r: 32, shape: "rect",   fill: "#ededff", line: "#b4b4d8", delay: 0    },
  { id: 1, cx: 158, cy: 108, r: 38, shape: "circle", fill: "#ddeeff", line: "#98bcd8", delay: 0.28 },
  { id: 2, cx: 260, cy: 114, r: 29, shape: "rect",   fill: "#ffddf2", line: "#d898be", delay: 0.14 },
  { id: 3, cx: 364, cy: 110, r: 35, shape: "half",   fill: "#ddfff0", line: "#90ccb0", delay: 0.42 },
];

// eye offsets relative to body centre
const EL = { dx: -13, dy: -9 };  // left eye
const ER = { dx:  13, dy: -9 };  // right eye
const SOCKET_R = 9;
const PUPIL_R  = 4;
const MAX_MOVE = 3.5;

// ─── helpers ──────────────────────────────────────────────────────────────────
function pupilOff(
  ex: number, ey: number,
  mx: number, my: number,
): { x: number; y: number } {
  const dx = mx - ex, dy = my - ey;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return { x: 0, y: 0 };
  const mag = Math.min(MAX_MOVE, dist * 0.065);
  return { x: (dx / dist) * mag, y: (dy / dist) * mag };
}

/** All three states share the same M…Q path structure so framer can interpolate. */
function mouthD(cx: number, cy: number, state: "smile" | "frown" | "focus"): string {
  const my = cy + 14;
  if (state === "frown")  return `M ${cx-12},${my+5} Q ${cx},${my-4} ${cx+12},${my+5}`;
  if (state === "focus")  return `M ${cx-10},${my-3} Q ${cx},${my+12} ${cx+10},${my-3}`;
                          return `M ${cx-12},${my-2} Q ${cx},${my+8}  ${cx+12},${my-2}`;
}

function bodyPath(c: Char): string {
  const { cx, cy, r, shape } = c;
  if (shape === "circle") return `M ${cx},${cy} m -${r},0 a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`;
  if (shape === "half")   return `M ${cx-r},${cy+r} A ${r},${r} 0 0,1 ${cx+r},${cy+r} Z`;
  // rounded rect
  const rx = r * 0.28;
  return `M ${cx-r+rx},${cy-r} h${r*2-rx*2} q${rx},0 ${rx},${rx} v${r*2-rx*2} q0,${rx} -${rx},${rx} h-${r*2-rx*2} q-${rx},0 -${rx},-${rx} v-${r*2-rx*2} q0,-${rx} ${rx},-${rx} Z`;
}

// ─── component ────────────────────────────────────────────────────────────────
export function LoginCharacters({ emailFocused, showPassword, hasError }: Props) {
  const svgRef  = useRef<SVGSVGElement>(null);
  const [mouse, setMouse] = useState({ x: W / 2, y: H / 2 });
  const [errKey, setErrKey] = useState(0);
  const prevErr = useRef(false);

  // mouse → SVG coords (batched via rAF)
  useEffect(() => {
    let raf = 0;
    let pending = { x: W / 2, y: H / 2 };
    const onMove = (e: MouseEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      pending = {
        x: ((e.clientX - rect.left) / rect.width)  * W,
        y: ((e.clientY - rect.top)  / rect.height) * H,
      };
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setMouse({ ...pending }));
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  // trigger a fresh shake key whenever a new error appears
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
      {CHARS.map((c) => {
        const lx = c.cx + EL.dx, ly = c.cy + EL.dy;
        const rx = c.cx + ER.dx, ry = c.cy + ER.dy;
        const lp = showPassword ? { x: 0, y: 0 } : pupilOff(lx, ly, mouse.x, mouse.y);
        const rp = showPassword ? { x: 0, y: 0 } : pupilOff(rx, ry, mouse.x, mouse.y);
        const mPath = mouthD(c.cx, c.cy, moodState);
        const initialMouth = mouthD(c.cx, c.cy, "smile");

        // shake & lean
        const xAnim: number | number[] =
          hasError
            ? [0, -7, 7, -7, 7, -3, 3, 0]
            : emailFocused ? 5 : 0;
        const rotAnim =
          emailFocused && !hasError
            ? (c.id % 2 === 0 ? 7 : -4)
            : 0;

        return (
          <motion.g
            key={c.id}
            style={{ originX: `${c.cx}px`, originY: `${c.cy + c.r * 0.4}px` }}
            animate={{ x: xAnim, rotate: rotAnim }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            // Re-trigger shake animation on each new error
            custom={errKey}
          >
            {/* ── idle floating bob ── */}
            <motion.g
              animate={{ y: [0, -8, 0] }}
              transition={{
                repeat: Infinity,
                duration: 2.1 + c.delay * 0.4,
                delay:    c.delay,
                ease:     "easeInOut",
              }}
            >
              {/* Drop shadow */}
              <ellipse
                cx={c.cx} cy={c.cy + c.r + 8}
                rx={c.r * 0.6} ry={4}
                fill="rgba(255,255,255,0.05)"
              />

              {/* Body */}
              <motion.path
                d={bodyPath(c)}
                fill={c.fill}
                stroke={c.line}
                strokeWidth={1.5}
              />

              {/* ── eyebrows ── */}
              {hasError ? (
                /* worried — angled inward */
                <>
                  <line x1={c.cx-17} y1={c.cy-21} x2={c.cx-8} y2={c.cy-27}
                    stroke="rgba(70,50,50,0.55)" strokeWidth={1.8} strokeLinecap="round" />
                  <line x1={c.cx+8}  y1={c.cy-27} x2={c.cx+17} y2={c.cy-21}
                    stroke="rgba(70,50,50,0.55)" strokeWidth={1.8} strokeLinecap="round" />
                </>
              ) : emailFocused ? (
                /* focused — slightly raised outer edge */
                <>
                  <line x1={c.cx-17} y1={c.cy-25} x2={c.cx-8} y2={c.cy-22}
                    stroke="rgba(40,40,80,0.35)" strokeWidth={1.5} strokeLinecap="round" />
                  <line x1={c.cx+8}  y1={c.cy-22} x2={c.cx+17} y2={c.cy-25}
                    stroke="rgba(40,40,80,0.35)" strokeWidth={1.5} strokeLinecap="round" />
                </>
              ) : null}

              {/* ── eye sockets ── */}
              <circle cx={lx} cy={ly} r={SOCKET_R} fill="white" />
              <circle cx={rx} cy={ry} r={SOCKET_R} fill="white" />

              {/* ── pupils (hidden when password visible) ── */}
              {!showPassword && (
                <>
                  <circle cx={lx + lp.x} cy={ly + lp.y} r={PUPIL_R} fill="#1a1630" />
                  <circle cx={lx + lp.x + 1.4} cy={ly + lp.y - 1.4} r={1.2} fill="rgba(255,255,255,0.9)" />
                  <circle cx={rx + rp.x} cy={ry + rp.y} r={PUPIL_R} fill="#1a1630" />
                  <circle cx={rx + rp.x + 1.4} cy={ry + rp.y - 1.4} r={1.2} fill="rgba(255,255,255,0.9)" />
                </>
              )}

              {/* ── nose dot ── */}
              <circle cx={c.cx} cy={c.cy + 5} r={2.2} fill="rgba(0,0,0,0.2)" />

              {/* ── mouth (morphs between states) ── */}
              <motion.path
                initial={{ d: initialMouth }}
                animate={{ d: mPath }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                fill="none"
                stroke="rgba(0,0,0,0.38)"
                strokeWidth={2}
                strokeLinecap="round"
              />

              {/* ── paws that cover eyes when password is revealed ── */}
              <motion.g
                initial={{ y: 55, opacity: 0 }}
                animate={showPassword ? { y: 0, opacity: 1 } : { y: 55, opacity: 0 }}
                transition={{ type: "spring", stiffness: 290, damping: 22 }}
              >
                {/* left paw */}
                <ellipse cx={lx} cy={ly} rx={12} ry={10} fill={c.fill} stroke={c.line} strokeWidth={1.4} />
                <circle  cx={lx-5} cy={ly-9}  r={4} fill={c.fill} stroke={c.line} strokeWidth={1} />
                <circle  cx={lx}   cy={ly-11} r={4} fill={c.fill} stroke={c.line} strokeWidth={1} />
                <circle  cx={lx+5} cy={ly-9}  r={4} fill={c.fill} stroke={c.line} strokeWidth={1} />
                {/* right paw */}
                <ellipse cx={rx} cy={ry} rx={12} ry={10} fill={c.fill} stroke={c.line} strokeWidth={1.4} />
                <circle  cx={rx-5} cy={ry-9}  r={4} fill={c.fill} stroke={c.line} strokeWidth={1} />
                <circle  cx={rx}   cy={ry-11} r={4} fill={c.fill} stroke={c.line} strokeWidth={1} />
                <circle  cx={rx+5} cy={ry-9}  r={4} fill={c.fill} stroke={c.line} strokeWidth={1} />
              </motion.g>

              {/* ── concentration sparks when email focused ── */}
              {emailFocused && !hasError && !showPassword && (
                <>
                  <motion.line
                    x1={c.cx - c.r - 7} y1={c.cy - 6}
                    x2={c.cx - c.r - 16} y2={c.cy - 6}
                    stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} strokeLinecap="round"
                    animate={{ x2: [c.cx - c.r - 14, c.cx - c.r - 18, c.cx - c.r - 14] }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
                  />
                  <motion.line
                    x1={c.cx - c.r - 7} y1={c.cy + 1}
                    x2={c.cx - c.r - 13} y2={c.cy + 1}
                    stroke="rgba(255,255,255,0.2)" strokeWidth={1} strokeLinecap="round"
                    animate={{ x2: [c.cx - c.r - 11, c.cx - c.r - 15, c.cx - c.r - 11] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: 0.15, ease: "easeInOut" }}
                  />
                </>
              )}
            </motion.g>
          </motion.g>
        );
      })}

      {/* ── ground line ── */}
      <line x1={20} y1={H - 12} x2={W - 20} y2={H - 12}
        stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
    </svg>
  );
}
