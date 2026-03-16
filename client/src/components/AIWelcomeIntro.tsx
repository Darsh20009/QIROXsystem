import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Zap, FileText, Bell, BarChart3, Bot } from "lucide-react";

const STORAGE_KEY = (uid: string) => `qirox_ai_intro_v2_${uid}`;
const AUTO_DISMISS_SEC = 9;

const EMPLOYEE_ROLES = ["admin", "manager", "developer", "designer", "support", "sales", "sales_manager", "accountant", "merchant"];

const CAPABILITIES = [
  { icon: FileText, label: "يعرض طلباتك ومشاريعك فوراً" },
  { icon: Zap, label: "يُنفّذ مهام حقيقية بأمر صوتي أو نصي" },
  { icon: Bell, label: "يرسل إشعارات ويغيّر الحالات" },
  { icon: BarChart3, label: "يُحلّل البيانات ويُجيب بأرقام حقيقية" },
];

/* ── Animated AI Orb ── */
function AIOrb() {
  return (
    <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
      {/* outer glow rings */}
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="absolute rounded-full border border-cyan-400/20"
          style={{ width: 112 + i * 28, height: 112 + i * 28 }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6, ease: "easeInOut" }}
        />
      ))}

      {/* spinning gradient ring */}
      <motion.div className="absolute w-28 h-28 rounded-full"
        style={{ background: "conic-gradient(from 0deg, #06b6d4, #7c3aed, #0ea5e9, #06b6d4)", padding: 2 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-full h-full rounded-full bg-[#080e1a]" />
      </motion.div>

      {/* floating particles */}
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const r = 50;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        return (
          <motion.div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400"
            style={{ x: px, y: py }}
            animate={{ scale: [0.6, 1.4, 0.6], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3 }}
          />
        );
      })}

      {/* core icon */}
      <motion.div className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%)" }}
        animate={{ boxShadow: ["0 0 20px rgba(14,165,233,0.4)", "0 0 40px rgba(124,58,237,0.6)", "0 0 20px rgba(14,165,233,0.4)"] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Bot className="w-8 h-8 text-white" />
      </motion.div>
    </div>
  );
}

/* ── Progress Bar ── */
function ProgressCountdown({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(intervalRef.current); onDone(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const pct = ((seconds - remaining) / seconds) * 100;

  return (
    <div className="mt-4 space-y-1.5">
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
          animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: "linear" }}
        />
      </div>
      <p className="text-center text-white/30 text-[11px]">يُغلق تلقائياً بعد {remaining} ثوانٍ</p>
    </div>
  );
}

/* ── Main Component ── */
interface Props {
  userId: string;
  userName: string;
  userRole: string;
  onOpen?: () => void;
}

export function AIWelcomeIntro({ userId, userName, userRole, onOpen }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!EMPLOYEE_ROLES.includes(userRole)) return;
    const key = STORAGE_KEY(userId);
    if (localStorage.getItem(key)) return;
    // Delay to not interrupt page load
    const t = setTimeout(() => setVisible(true), 1800);
    return () => clearTimeout(t);
  }, [userId, userRole]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY(userId), "1");
    setVisible(false);
  };

  const handleUse = () => {
    dismiss();
    // Trigger FloatingAI to open via custom event
    window.dispatchEvent(new CustomEvent("qirox-open-ai"));
    onOpen?.();
  };

  const firstName = (userName || "").split(" ")[0] || "موظف";

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="fixed bottom-6 end-6 z-[1000] w-[340px]"
            onClick={e => e.stopPropagation()}
          >
            {/* Card body */}
            <div className="relative rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(160deg, #080e1a 0%, #0d1630 60%, #080d1a 100%)",
                border: "1px solid rgba(14,165,233,0.25)",
                boxShadow: "0 8px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              {/* Top gradient stripe */}
              <div className="h-0.5 w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500" />

              {/* Close button */}
              <button onClick={dismiss}
                className="absolute top-3 start-3 w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all z-10"
                data-testid="button-ai-intro-close">
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="px-6 pt-6 pb-5">
                {/* Orb */}
                <AIOrb />

                {/* Greeting */}
                <div className="text-center mb-4">
                  <motion.h2 className="text-white font-black text-lg leading-tight mb-1"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    مرحباً يا {firstName}! 👋
                  </motion.h2>
                  <motion.p className="text-white/50 text-sm"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                    مساعدك الذكي الشخصي جاهز لخدمتك
                  </motion.p>
                </div>

                {/* Capabilities */}
                <motion.div className="space-y-2 mb-5"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                  {CAPABILITIES.map((cap, i) => (
                    <motion.div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + i * 0.1 }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.2), rgba(124,58,237,0.2))" }}>
                        <cap.icon className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <span className="text-white/65 text-[12.5px]">{cap.label}</span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Hint */}
                <motion.div className="text-center mb-4"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>
                  <span className="text-[11px] text-white/30">أيقونة </span>
                  <span className="inline-flex items-center gap-0.5 text-[11px] text-cyan-400/70">
                    <Sparkles className="w-3 h-3" /> QIROX AI
                  </span>
                  <span className="text-[11px] text-white/30"> موجودة في الزاوية السفلية</span>
                </motion.div>

                {/* CTA Button */}
                <motion.button onClick={handleUse}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full h-11 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all"
                  style={{ background: "linear-gradient(135deg, #0ea5e9, #7c3aed)" }}
                  data-testid="button-ai-intro-start">
                  <Sparkles className="w-4 h-4" />
                  ابدأ الاستخدام الآن
                </motion.button>

                {/* Auto-dismiss countdown */}
                <ProgressCountdown seconds={AUTO_DISMISS_SEC} onDone={dismiss} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
