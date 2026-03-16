import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Zap, FileText, Bell, BarChart3 } from "lucide-react";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";

const STORAGE_KEY = (uid: string) => `qirox_ai_intro_v3_${uid}`;
const AUTO_DISMISS_SEC = 10;

const EMPLOYEE_ROLES = ["admin", "manager", "developer", "designer", "support", "sales", "sales_manager", "accountant", "merchant"];

const CAPABILITIES = [
  { icon: FileText, label: "عرض الطلبات والمشاريع فورياً" },
  { icon: Zap, label: "تنفيذ المهام بأمر نصي مباشر" },
  { icon: Bell, label: "إرسال الإشعارات وتغيير الحالات" },
  { icon: BarChart3, label: "تحليل البيانات والإجابة بأرقام دقيقة" },
];

function AIOrb() {
  return (
    <div className="relative w-20 h-20 mx-auto mb-5 flex items-center justify-center">
      {[0, 1].map(i => (
        <motion.div key={i} className="absolute rounded-full border border-cyan-400/20"
          style={{ width: 80 + i * 20, height: 80 + i * 20 }}
          animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.08, 0.3] }}
          transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.7, ease: "easeInOut" }}
        />
      ))}
      <motion.div className="absolute w-20 h-20 rounded-full"
        style={{ background: "conic-gradient(from 0deg, #06b6d4, #7c3aed, #0ea5e9, #06b6d4)", padding: 2 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-full h-full rounded-full bg-[#080e1a]" />
      </motion.div>
      <motion.div className="relative z-10 w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%)" }}
        animate={{ boxShadow: ["0 0 16px rgba(14,165,233,0.4)", "0 0 32px rgba(124,58,237,0.5)", "0 0 16px rgba(14,165,233,0.4)"] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <img src={qiroxLogoPath} alt="QIROX AI" className="w-8 h-8 object-contain invert" />
      </motion.div>
    </div>
  );
}

function ProgressBar({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(intervalRef.current!); onDone(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [onDone]);

  const pct = ((seconds - remaining) / seconds) * 100;
  return (
    <div className="mt-3 space-y-1">
      <div className="h-[3px] bg-white/10 rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
          animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "linear" }}
        />
      </div>
      <p className="text-center text-white/30 text-[10px]">يُغلق تلقائياً خلال {remaining} ث</p>
    </div>
  );
}

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
    const timer = setTimeout(() => setVisible(true), 1800);
    return () => clearTimeout(timer);
  }, [userId, userRole]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY(userId), "1");
    setVisible(false);
  };

  const handleUse = () => {
    dismiss();
    window.dispatchEvent(new CustomEvent("qirox-open-ai"));
    onOpen?.();
  };

  const firstName = (userName || "").split(" ")[0] || "بك";

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm"
            onClick={dismiss}
          />

          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed z-[1000] inset-x-4 bottom-4 sm:inset-auto sm:bottom-6 sm:end-6 sm:w-[320px]"
            dir="rtl"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative rounded-2xl overflow-hidden w-full"
              style={{
                background: "linear-gradient(160deg, #080e1a 0%, #0d1630 60%, #080d1a 100%)",
                border: "1px solid rgba(14,165,233,0.2)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <div className="h-0.5 w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500" />

              <button onClick={dismiss}
                className="absolute top-3 start-3 w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/8 transition-all z-10"
                data-testid="button-ai-intro-close">
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="px-5 pt-5 pb-4">
                <AIOrb />

                <div className="text-center mb-4">
                  <h2 className="text-white font-bold text-base leading-tight mb-1">
                    أهلاً {firstName}
                  </h2>
                  <p className="text-white/45 text-xs leading-relaxed">
                    مساعدك الذكي جاهز — يساعدك في إدارة العمل يومياً
                  </p>
                </div>

                <div className="space-y-1.5 mb-4">
                  {CAPABILITIES.map((cap, i) => (
                    <motion.div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                      initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.08 }}>
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(14,165,233,0.15)" }}>
                        <cap.icon className="w-3 h-3 text-cyan-400" />
                      </div>
                      <span className="text-white/60 text-xs">{cap.label}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="text-center mb-3">
                  <span className="text-[10px] text-white/25">
                    أيقونة
                    <span className="text-cyan-400/60 mx-1">QIROX AI</span>
                    في أسفل الشاشة
                  </span>
                </div>

                <button onClick={handleUse}
                  className="w-full h-10 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #0ea5e9, #7c3aed)" }}
                  data-testid="button-ai-intro-start">
                  <Sparkles className="w-3.5 h-3.5" />
                  فتح المساعد الآن
                </button>

                <ProgressBar seconds={AUTO_DISMISS_SEC} onDone={dismiss} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
