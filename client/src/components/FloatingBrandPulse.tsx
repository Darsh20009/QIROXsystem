import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { MessageCircle, ArrowLeft, Headphones } from "lucide-react";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";
import { useUser } from "@/hooks/use-auth";

type Phase = "hidden" | "logo" | "contact";

export function FloatingBrandPulse() {
  const [phase, setPhase] = useState<Phase>("hidden");
  const { data: user } = useUser();
  const isClient = user?.role === "client";

  useEffect(() => {
    const sequence: { phase: Phase; duration: number }[] = [
      { phase: "hidden", duration: 2500 },
      { phase: "logo", duration: 3800 },
      { phase: "contact", duration: 4200 },
      { phase: "hidden", duration: 3000 },
    ];

    let idx = 0;
    let timer: ReturnType<typeof setTimeout>;

    function step() {
      const current = sequence[idx % sequence.length];
      setPhase(current.phase);
      timer = setTimeout(() => {
        idx++;
        step();
      }, current.duration);
    }

    const initial = setTimeout(step, 1800);
    return () => {
      clearTimeout(initial);
      clearTimeout(timer);
    };
  }, []);

  function handleContactClick() {
    if (isClient) {
      window.dispatchEvent(new Event("open-cs-chat"));
    }
  }

  return (
    <div className="fixed bottom-20 md:bottom-8 right-4 md:right-6 z-[90] flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence mode="wait">

        {/* ── Logo State ── */}
        {phase === "logo" && (
          <motion.div
            key="logo"
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 12 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="pointer-events-auto"
          >
            <Link href="/">
              <div className="relative group cursor-pointer">
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-black/10 dark:bg-white/10"
                  animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="relative flex items-center gap-3 bg-white dark:bg-gray-900 border border-black/[0.08] dark:border-white/[0.08] shadow-2xl shadow-black/10 rounded-2xl px-4 py-3 group-hover:shadow-black/20 transition-shadow duration-300">
                  <img
                    src={qiroxLogoPath}
                    alt="QIROX"
                    className="h-7 w-auto object-contain dark:invert"
                  />
                  <div className="w-px h-5 bg-black/[0.08] dark:bg-white/[0.08]" />
                  <p className="text-[11px] font-bold text-black/40 dark:text-white/40 whitespace-nowrap">
                    وكالة رقمية متكاملة
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* ── Contact State ── */}
        {phase === "contact" && (
          <motion.div
            key="contact"
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 12 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="pointer-events-auto"
          >
            {isClient ? (
              /* Client → opens CS Chat directly */
              <button onClick={handleContactClick} className="relative group cursor-pointer block">
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-black"
                  animate={{ scale: [1, 1.14, 1], opacity: [0.15, 0, 0.15] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="relative flex items-center gap-3 bg-black dark:bg-white shadow-2xl shadow-black/25 rounded-2xl px-5 py-3 group-hover:opacity-90 transition-opacity duration-200">
                  <div className="relative">
                    <motion.div
                      className="absolute inset-0 bg-white/20 rounded-full"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                    />
                    <Headphones className="w-4 h-4 text-white dark:text-black relative z-10" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white dark:text-black tracking-wide leading-tight">خدمة العملاء</p>
                    <p className="text-[9px] text-white/50 dark:text-black/50 font-medium">اضغط للتواصل معنا</p>
                  </div>
                  <ArrowLeft className="w-3.5 h-3.5 text-white/60 dark:text-black/60 group-hover:translate-x-[-3px] transition-transform duration-200" />
                </div>
              </button>
            ) : (
              /* Guest/Public → goes to /contact page */
              <Link href="/contact">
                <div className="relative group cursor-pointer">
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-black"
                    animate={{ scale: [1, 1.14, 1], opacity: [0.15, 0, 0.15] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <div className="relative flex items-center gap-3 bg-black dark:bg-white shadow-2xl shadow-black/25 rounded-2xl px-5 py-3 group-hover:opacity-90 transition-opacity duration-200">
                    <div className="relative">
                      <motion.div
                        className="absolute inset-0 bg-white/20 rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                      />
                      <MessageCircle className="w-4 h-4 text-white dark:text-black relative z-10" />
                    </div>
                    <p className="text-sm font-black text-white dark:text-black tracking-wide">تواصل معنا</p>
                    <ArrowLeft className="w-3.5 h-3.5 text-white/60 dark:text-black/60 group-hover:translate-x-[-3px] transition-transform duration-200" />
                  </div>
                </div>
              </Link>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
