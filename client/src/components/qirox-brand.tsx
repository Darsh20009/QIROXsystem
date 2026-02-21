import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

function FloatingParticle({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        background: `rgba(0, 212, 255, ${0.1 + Math.random() * 0.3})`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.8, 0],
        scale: [0, 1, 0.5],
        y: [0, -60 - Math.random() * 80],
      }}
      transition={{
        duration: 2.5 + Math.random() * 1.5,
        delay,
        repeat: Infinity,
        ease: "easeOut",
      }}
    />
  );
}

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"enter" | "logo" | "text" | "exit">("enter");

  useEffect(() => {
    const t0 = setTimeout(() => setPhase("logo"), 300);
    const t1 = setTimeout(() => setPhase("text"), 1200);
    const t2 = setTimeout(() => setPhase("exit"), 2800);
    const t3 = setTimeout(onComplete, 3500);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: 0.5 + Math.random() * 1.5,
    x: `${30 + Math.random() * 40}%`,
    y: `${40 + Math.random() * 30}%`,
    size: 2 + Math.random() * 4,
  }));

  return (
    <AnimatePresence mode="wait">
      {phase !== "exit" && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "#0A0A0F" }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <div className="absolute inset-0 dot-grid opacity-20" />
          </motion.div>

          <motion.div
            className="absolute w-[700px] h-[700px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 60%)",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1.2], opacity: [0, 0.6, 0.4] }}
            transition={{ duration: 2, ease: "easeOut" }}
          />

          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(100,80,255,0.05) 0%, transparent 60%)",
            }}
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1], opacity: [0, 0.5, 0.3] }}
            transition={{ duration: 2.5, delay: 0.3, ease: "easeOut" }}
          />

          <motion.div
            className="absolute w-[250px] h-[250px] rounded-full border border-[#00D4FF]/10"
            initial={{ scale: 0, opacity: 0, rotate: 0 }}
            animate={{ scale: 1, opacity: 0.4, rotate: 360 }}
            transition={{
              scale: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 1 },
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            }}
          >
            <div className="absolute -top-1 left-1/2 w-2 h-2 rounded-full bg-[#00D4FF] shadow-[0_0_10px_#00D4FF]" />
          </motion.div>

          <motion.div
            className="absolute w-[350px] h-[350px] rounded-full border border-white/5"
            initial={{ scale: 0, opacity: 0, rotate: 0 }}
            animate={{ scale: 1, opacity: 0.3, rotate: -360 }}
            transition={{
              scale: { duration: 1.5, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 1.2, delay: 0.2 },
              rotate: { duration: 30, repeat: Infinity, ease: "linear" },
            }}
          >
            <div className="absolute top-1/2 -right-1 w-1.5 h-1.5 rounded-full bg-[#00D4FF]/60" />
          </motion.div>

          {particles.map((p) => (
            <FloatingParticle key={p.id} {...p} />
          ))}

          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="mb-10"
            >
              <div className="w-24 h-24 relative">
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, #00D4FF, #0099CC)",
                  }}
                  animate={{
                    boxShadow: [
                      "0 0 30px rgba(0,212,255,0.2), 0 0 60px rgba(0,212,255,0.1)",
                      "0 0 50px rgba(0,212,255,0.4), 0 0 100px rgba(0,212,255,0.2)",
                      "0 0 30px rgba(0,212,255,0.2), 0 0 60px rgba(0,212,255,0.1)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />

                <motion.div
                  className="absolute -inset-3 rounded-3xl border border-[#00D4FF]/20"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />

                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-black text-[#0A0A0F] font-heading">Q</span>
                </div>
              </div>
            </motion.div>

            <div className="overflow-hidden">
              <motion.h1
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="text-6xl md:text-8xl font-black tracking-[10px] text-white mb-3"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                QIROX
              </motion.h1>
            </div>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="w-32 h-[2px] mb-6 origin-center"
              style={{ background: "linear-gradient(90deg, transparent, #00D4FF, transparent)" }}
            />

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: phase === "text" ? 1 : 0,
                y: phase === "text" ? 0 : 10,
              }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-sm tracking-[6px] uppercase font-medium"
              style={{ color: "rgba(0,212,255,0.6)" }}
            >
              Systems Factory
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{
                opacity: phase === "text" ? 0.3 : 0,
              }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-xs tracking-[3px] mt-3"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              مصنع الأنظمة الرقمية
            </motion.p>
          </div>

          <motion.div
            className="absolute bottom-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1.5 }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]"
                    animate={{
                      opacity: [0.2, 1, 0.2],
                      scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.25,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="absolute top-0 left-0 right-0 h-[1px]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 1.5 }}
            style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent)", transformOrigin: "center" }}
          />
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-[1px]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.7, duration: 1.5 }}
            style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.2), transparent)", transformOrigin: "center" }}
          />
        </motion.div>
      )}
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
