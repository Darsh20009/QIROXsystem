import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"logo" | "text" | "exit">("logo");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("text"), 800);
    const t2 = setTimeout(() => setPhase("exit"), 2200);
    const t3 = setTimeout(onComplete, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== "exit" ? null : null}
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0A0A0F 0%, #0D0D14 50%, #0A0A0F 100%)" }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute inset-0 dot-grid opacity-30" />

        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute w-[300px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(100,80,255,0.04) 0%, transparent 70%)" }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />

        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <div className="w-20 h-20 relative">
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, #00D4FF, #0099CC)",
                  boxShadow: "0 0 60px rgba(0,212,255,0.3)"
                }}
                animate={{ boxShadow: ["0 0 40px rgba(0,212,255,0.2)", "0 0 80px rgba(0,212,255,0.4)", "0 0 40px rgba(0,212,255,0.2)"] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-black text-[#0A0A0F] font-heading">Q</span>
              </div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl font-black tracking-[8px] text-white mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            QIROX
          </motion.h1>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 120 }}
            transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="h-[2px] mb-6"
            style={{ background: "linear-gradient(90deg, transparent, #00D4FF, transparent)" }}
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === "text" || phase === "exit" ? 1 : 0 }}
            transition={{ duration: 0.6 }}
            className="text-sm tracking-[4px] uppercase"
            style={{ color: "rgba(0,212,255,0.5)" }}
          >
            Systems Factory
          </motion.p>
        </div>

        <motion.div
          className="absolute bottom-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1.2 }}
        >
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function QiroxLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`font-heading font-black tracking-wider relative inline-flex items-center gap-2 ${className}`}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00D4FF, #0099CC)" }}>
        <span className="text-xs font-black text-[#0A0A0F]">Q</span>
      </div>
      <span className="text-white">QIROX</span>
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
