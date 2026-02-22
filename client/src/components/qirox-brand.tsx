import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";
import qiroxNoBgPath from "@assets/qirox_without_background_1771716363944.png";

function TypeWriter({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let idx = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        if (idx < text.length) {
          setDisplayed(text.substring(0, idx + 1));
          idx++;
        } else {
          if (intervalId) clearInterval(intervalId);
        }
      }, 60);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, delay]);

  return (
    <span>
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        className="inline-block w-[2px] h-[1em] bg-black/30 ml-[2px] align-middle"
      />
    </span>
  );
}

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1600),
      setTimeout(() => setPhase(4), 2800),
      setTimeout(() => setPhase(5), 3400),
      setTimeout(onComplete, 4000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence mode="wait">
      {phase < 5 && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-white"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)", backgroundSize: "32px 32px" }} />

          {phase >= 1 && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="w-[300px] h-[300px] rounded-full border border-black/[0.04]"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 4, 5], opacity: [0.5, 0.1, 0] }}
                transition={{ duration: 2, ease: "easeOut" }}
              />
            </motion.div>
          )}

          {phase >= 1 && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
            >
              <motion.div
                className="w-[500px] h-[500px] rounded-full"
                style={{ background: "radial-gradient(circle, rgba(0,0,0,0.03) 0%, transparent 70%)" }}
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.5, 1] }}
                transition={{ duration: 2, ease: "easeOut" }}
              />
            </motion.div>
          )}

          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={phase >= 1 ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8 relative"
            >
              <motion.img
                src={qiroxNoBgPath}
                alt="QIROX"
                className="w-[220px] md:w-[320px] h-auto object-contain relative z-10"
                data-testid="img-splash-logo"
                style={{ filter: "grayscale(100%) contrast(1.2)" }}
              />
            </motion.div>

            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={phase >= 2 ? { scaleX: 1, opacity: 1 } : {}}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="w-20 h-[1px] bg-black/10 mb-6 origin-center"
            />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={phase >= 3 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <p className="text-[11px] sm:text-xs tracking-[6px] uppercase font-medium mb-2 text-black/40">
                {phase >= 3 && <TypeWriter text="BUILD SYSTEMS. STAY HUMAN." delay={100} />}
              </p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={phase >= 3 ? { opacity: 0.3 } : {}}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="text-[10px] tracking-[4px] uppercase text-black/25"
              >
                مصنع الأنظمة الرقمية
              </motion.p>
            </motion.div>
          </div>

          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={phase >= 1 && phase < 4 ? { opacity: 0.3 } : { opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-[3px]">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-[3px] rounded-full bg-black/20"
                    animate={{
                      height: [3, 12, 3],
                      opacity: [0.2, 0.6, 0.2],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
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
