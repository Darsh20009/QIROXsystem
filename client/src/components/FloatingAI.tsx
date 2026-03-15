import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Minimize2 } from "lucide-react";
import { AIPanel } from "@/components/QiroxAI";
import { useUser } from "@/hooks/use-auth";

export function FloatingAI() {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(true);
  const { data: user } = useUser();

  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 4000);
    return () => clearTimeout(t);
  }, []);

  if (!user) return null;

  return (
    <>
      {/* ── Floating trigger button ── */}
      <div className="fixed bottom-6 left-6 z-[900] flex flex-col items-start gap-2">
        {/* Tooltip label — appears before first open */}
        <AnimatePresence>
          {pulse && !open && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-black dark:bg-white text-white dark:text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-lg pointer-events-none whitespace-nowrap"
            >
              مساعد QIROX الذكي ✨
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => { setOpen(o => !o); setPulse(false); }}
          data-testid="button-floating-ai"
          className="relative w-12 h-12 rounded-2xl shadow-xl flex items-center justify-center"
          style={{
            background: open
              ? "linear-gradient(135deg,#7c3aed,#4f46e5)"
              : "linear-gradient(135deg,#0ea5e9,#7c3aed)",
          }}
          aria-label="فتح مساعد QIROX الذكي"
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <X className="w-5 h-5 text-white" />
              </motion.div>
            ) : (
              <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulse ring */}
          {pulse && !open && (
            <span className="absolute inset-0 rounded-2xl animate-ping opacity-30"
              style={{ background: "linear-gradient(135deg,#0ea5e9,#7c3aed)" }} />
          )}
        </motion.button>
      </div>

      {/* ── Slide-over panel ── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop on mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[890] bg-black/30 backdrop-blur-sm md:hidden"
            />

            <motion.div
              initial={{ opacity: 0, x: -20, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-24 left-4 z-[895] w-[340px] max-h-[75vh] flex flex-col"
              style={{ filter: "drop-shadow(0 20px 60px rgba(0,0,0,0.35))" }}
            >
              {/* Panel header */}
              <div
                className="flex items-center justify-between px-4 py-2.5 rounded-t-2xl"
                style={{ background: "linear-gradient(135deg,#0ea5e9,#7c3aed)" }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white/80" />
                  <span className="text-white text-xs font-bold">مساعد QIROX الذكي</span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  data-testid="button-close-floating-ai"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-white" />
                </button>
              </div>

              {/* AI Panel content */}
              <div className="flex-1 rounded-b-2xl overflow-hidden border border-t-0 border-white/10 bg-[#0d0d1a]" style={{ minHeight: 0 }}>
                <AIPanel className="h-[480px]" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
