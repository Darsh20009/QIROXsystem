import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"enter" | "logo" | "text" | "exit">("enter");

  useEffect(() => {
    const t0 = setTimeout(() => setPhase("logo"), 200);
    const t1 = setTimeout(() => setPhase("text"), 1000);
    const t2 = setTimeout(() => setPhase("exit"), 2600);
    const t3 = setTimeout(onComplete, 3200);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <AnimatePresence mode="wait">
      {phase !== "exit" && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "#0A0A0F" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 60%)",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1.2], opacity: [0, 0.5, 0.3] }}
            transition={{ duration: 2, ease: "easeOut" }}
          />

          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="mb-8"
            >
              <img
                src={qiroxLogoPath}
                alt="QIROX Studio"
                className="w-[320px] md:w-[420px] h-auto object-contain"
                data-testid="img-splash-logo"
              />
            </motion.div>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="w-24 h-[1px] mb-5 origin-center"
              style={{ background: "linear-gradient(90deg, transparent, #00D4FF, transparent)" }}
            />

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: phase === "text" ? 1 : 0,
                y: phase === "text" ? 0 : 8,
              }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-xs tracking-[5px] uppercase font-medium"
              style={{ color: "rgba(0,212,255,0.5)" }}
            >
              Build Infrastructure. Scale Brands.
            </motion.p>
          </div>

          <motion.div
            className="absolute bottom-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 1 }}
          >
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 h-1 rounded-full bg-[#00D4FF]"
                  animate={{
                    opacity: [0.2, 1, 0.2],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
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
    <div className={`rounded-lg flex items-center justify-center ${className}`} style={{ background: "linear-gradient(135deg, #00D4FF, #0099CC)" }}>
      <span className="text-sm font-black text-[#0A0A0F] font-heading">Q</span>
    </div>
  );
}
