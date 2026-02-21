import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";
import qiroxNoBgPath from "@assets/qirox_without_background_1771716363944.png";

function MatrixRain({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const chars = "01アイウエオカキクケコサシスセソQIROX٠١٢٣٤٥٦٧٨٩";
    const fontSize = 14;
    let columns = 0;
    let drops: number[] = [];
    let speeds: number[] = [];

    const initColumns = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize);
      drops = Array(columns).fill(0).map(() => Math.random() * -100);
      speeds = Array(columns).fill(0).map(() => 0.3 + Math.random() * 0.7);
    };
    initColumns();
    window.addEventListener("resize", initColumns);

    let opacity = 0;
    let stopped = false;

    const draw = () => {
      if (stopped || !ctx || !canvas) return;
      const targetOpacity = activeRef.current ? 0.8 : 0;
      opacity += (targetOpacity - opacity) * 0.05;

      if (opacity < 0.005 && !activeRef.current) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.fillStyle = "rgba(10, 10, 15, 0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < columns; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        const brightness = Math.random();
        if (brightness > 0.95) {
          ctx.fillStyle = `rgba(0, 212, 255, ${opacity})`;
          ctx.shadowColor = "#00D4FF";
          ctx.shadowBlur = 8;
        } else if (brightness > 0.7) {
          ctx.fillStyle = `rgba(0, 180, 220, ${opacity * 0.6})`;
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = `rgba(0, 140, 180, ${opacity * 0.25})`;
          ctx.shadowBlur = 0;
        }

        ctx.font = `${fontSize}px monospace`;
        ctx.fillText(char, x, y);
        ctx.shadowBlur = 0;

        drops[i] += speeds[i];
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.98) {
          drops[i] = Math.random() * -20;
        }
      }
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      stopped = true;
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", initColumns);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.7 }}
    />
  );
}

function GlitchText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [glitchChar, setGlitchChar] = useState("");
  const chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?01";

  useEffect(() => {
    let idx = 0;
    let glitchCount = 0;
    const maxGlitches = 3;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        if (glitchCount < maxGlitches) {
          setGlitchChar(chars[Math.floor(Math.random() * chars.length)]);
          glitchCount++;
        } else {
          if (idx < text.length) {
            setDisplayed(text.substring(0, idx + 1));
            idx++;
            glitchCount = 0;
          } else {
            if (intervalId) clearInterval(intervalId);
            setGlitchChar("");
          }
        }
      }, 40);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, delay]);

  return (
    <span>
      {displayed}
      {glitchChar && (
        <span className="text-[#00D4FF]/50">{glitchChar}</span>
      )}
    </span>
  );
}

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 3200),
      setTimeout(() => setPhase(5), 3800),
      setTimeout(onComplete, 4500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence mode="wait">
      {phase < 5 && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "#0A0A0F" }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <MatrixRain active={phase >= 1 && phase < 4} />

          {phase >= 2 && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="w-[800px] h-[800px] rounded-full border border-[#00D4FF]/20"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 3, 4], opacity: [0.6, 0.2, 0] }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </motion.div>
          )}

          {phase >= 2 && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="w-[200px] h-[200px] rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)",
                }}
                initial={{ scale: 0 }}
                animate={{ scale: [0, 5, 3] }}
                transition={{ duration: 2, ease: "easeOut" }}
              />
            </motion.div>
          )}

          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.5, filter: "blur(20px)" }}
              animate={phase >= 2 ? {
                opacity: 1,
                scale: 1,
                filter: "blur(0px)",
              } : {}}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6 relative"
            >
              {phase >= 2 && phase < 4 && (
                <>
                  <motion.div
                    className="absolute inset-0"
                    animate={{
                      x: [0, -3, 3, -1, 0],
                      opacity: [1, 0.8, 0.9, 0.7, 1],
                    }}
                    transition={{
                      duration: 0.15,
                      repeat: 3,
                      delay: 0,
                    }}
                  >
                    <img
                      src={qiroxNoBgPath}
                      alt=""
                      className="w-[280px] md:w-[400px] h-auto object-contain"
                      style={{ filter: "hue-rotate(20deg) brightness(1.5)" }}
                    />
                  </motion.div>
                  <motion.div
                    className="absolute inset-0"
                    animate={{
                      x: [0, 3, -3, 1, 0],
                      opacity: [1, 0.6, 0.8, 0.9, 1],
                    }}
                    transition={{
                      duration: 0.15,
                      repeat: 3,
                      delay: 0.05,
                    }}
                  >
                    <img
                      src={qiroxNoBgPath}
                      alt=""
                      className="w-[280px] md:w-[400px] h-auto object-contain"
                      style={{ filter: "hue-rotate(-20deg) brightness(1.3)", mixBlendMode: "screen" }}
                    />
                  </motion.div>
                </>
              )}

              <motion.img
                src={qiroxNoBgPath}
                alt="QIROX"
                className="w-[280px] md:w-[400px] h-auto object-contain relative z-10"
                data-testid="img-splash-logo"
                style={{
                  filter: phase >= 2 ? "drop-shadow(0 0 30px rgba(0,212,255,0.4)) drop-shadow(0 0 60px rgba(0,212,255,0.15))" : "none",
                }}
                animate={phase >= 4 ? { scale: 1.05, filter: "drop-shadow(0 0 40px rgba(0,212,255,0.6))" } : {}}
                transition={{ duration: 0.5 }}
              />
            </motion.div>

            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={phase >= 2 ? { scaleX: 1, opacity: 1 } : {}}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="w-32 h-[1px] mb-6 origin-center"
              style={{ background: "linear-gradient(90deg, transparent, #00D4FF, transparent)" }}
            />

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={phase >= 3 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <p
                className="text-[11px] sm:text-xs tracking-[6px] uppercase font-medium mb-2"
                style={{ color: "rgba(0,212,255,0.6)" }}
              >
                {phase >= 3 && <GlitchText text="BUILD SYSTEMS. STAY HUMAN." delay={200} />}
              </p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={phase >= 3 ? { opacity: 0.3 } : {}}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="text-[10px] tracking-[4px] uppercase text-white/30"
              >
                مصنع الأنظمة الرقمية
              </motion.p>
            </motion.div>
          </div>

          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={phase >= 1 && phase < 4 ? { opacity: 0.4 } : { opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-[3px]">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-[3px] rounded-full bg-[#00D4FF]"
                    animate={{
                      height: [4, 16, 4],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] tracking-[3px] uppercase text-[#00D4FF]/40 mr-2">
                LOADING
              </span>
            </div>
          </motion.div>

          {phase >= 4 && (
            <>
              <motion.div
                className="absolute inset-0 bg-[#00D4FF]/5"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.3 }}
              />
              <motion.div
                className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2"
                style={{ background: "linear-gradient(90deg, transparent 10%, #00D4FF 50%, transparent 90%)" }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: [0, 1, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </>
          )}
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
