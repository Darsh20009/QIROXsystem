import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, Check } from "lucide-react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { getHintForPath, isHintDismissed, dismissHint } from "@/lib/page-hints";

function useTypewriter(text: string, speed = 22, startDelay = 0) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    let delayId: ReturnType<typeof setTimeout>;
    let intervalId: ReturnType<typeof setInterval>;
    delayId = setTimeout(() => {
      intervalId = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          setDone(true);
          clearInterval(intervalId);
        }
      }, speed);
    }, startDelay);
    return () => { clearTimeout(delayId); clearInterval(intervalId); };
  }, [text, speed, startDelay]);

  return { displayed, done };
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-current opacity-60"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

export function PageHintCard() {
  const [location] = useLocation();
  const { data: user } = useUser();
  const { lang } = useI18n();
  const ar = lang === "ar";

  const [visible, setVisible] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hint = getHintForPath(location);
  const userId = user ? String((user as any)._id || (user as any).id || "guest") : null;

  useEffect(() => {
    if (!hint || !userId) {
      setVisible(false);
      setCurrentKey(null);
      return;
    }
    if (hint.key === currentKey) return;

    if (hint.roles && user && !(hint.roles.includes((user as any).role))) {
      setVisible(false);
      return;
    }

    setCurrentKey(hint.key);
    setMinimized(false);
    setShowTyping(false);
    setShowContent(false);

    if (isHintDismissed(hint.key, userId)) {
      setVisible(false);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    let innerTimer: ReturnType<typeof setTimeout>;
    timerRef.current = setTimeout(() => {
      setVisible(true);
      setShowTyping(true);
      innerTimer = setTimeout(() => {
        setShowTyping(false);
        setShowContent(true);
      }, 1400);
    }, 700);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (innerTimer) clearTimeout(innerTimer);
    };
  }, [location, userId]);

  const handleDismiss = () => {
    if (hint && userId) dismissHint(hint.key, userId);
    setVisible(false);
    setMinimized(false);
  };

  const handleMinimize = () => setMinimized(true);
  const handleReopen = () => { setMinimized(false); setVisible(true); };

  if (!hint || !user) return null;

  const title = ar ? hint.titleAr : hint.titleEn;
  const desc  = ar ? hint.descAr   : hint.descEn;
  const features = ar ? hint.featuresAr : hint.featuresEn;

  return (
    <>
      {/* Floating re-open bubble */}
      <AnimatePresence>
        {minimized && (
          <motion.button
            key="reopen-btn"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            onClick={handleReopen}
            data-testid="hint-reopen-btn"
            className={`fixed bottom-6 ${ar ? "left-6" : "right-6"} z-50 w-12 h-12 rounded-2xl bg-gradient-to-br ${hint.color} shadow-xl shadow-black/20 flex items-center justify-center hover:scale-110 transition-transform`}
          >
            <span className="text-xl">{hint.icon}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main card */}
      <AnimatePresence>
        {visible && !minimized && (
          <motion.div
            key={`hint-${hint.key}`}
            initial={{ opacity: 0, y: 50, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className={`fixed bottom-6 ${ar ? "left-4 sm:left-6" : "right-4 sm:right-6"} z-50 w-[300px] sm:w-[320px] max-w-[calc(100vw-2rem)]`}
            data-testid="hint-card"
          >
            {/* Chat bubble tail */}
            <div className={`relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl shadow-black/20 overflow-hidden border border-black/[0.06] dark:border-white/[0.06]`}>

              {/* Top strip with gradient */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${hint.color}`} />

              <div className="p-4">
                {/* Avatar row */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${hint.color} flex items-center justify-center text-xl shrink-0 shadow-md`}>
                    {hint.icon}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-bold text-black/40 dark:text-white/40 leading-none mb-1">
                          {ar ? "مساعد Qirox" : "Qirox Assistant"}
                        </p>
                        <p className="text-sm font-black text-black dark:text-white leading-tight">{title}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={handleMinimize}
                          data-testid="hint-minimize-btn"
                          className="w-6 h-6 rounded-full bg-black/[0.05] dark:bg-white/[0.07] hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
                        >
                          <ChevronDown className="w-3 h-3 text-black/50 dark:text-white/50" />
                        </button>
                        <button
                          onClick={handleDismiss}
                          data-testid="hint-dismiss-btn"
                          className="w-6 h-6 rounded-full bg-black/[0.05] dark:bg-white/[0.07] hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors group"
                        >
                          <X className="w-3 h-3 text-black/50 dark:text-white/50 group-hover:text-red-500 transition-colors" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat bubble with typing / text */}
                <div className={`bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl rounded-tl-md px-3.5 py-2.5 mb-3 min-h-[44px] flex items-center ${ar ? "rounded-tl-md rounded-tr-2xl" : "rounded-tr-md rounded-tl-2xl"}`}>
                  {showTyping && (
                    <div className="text-black/40 dark:text-white/40">
                      <TypingDots />
                    </div>
                  )}
                  {showContent && (
                    <TypewriterText text={desc} speed={20} className="text-[12.5px] text-black/65 dark:text-white/65 leading-relaxed" />
                  )}
                </div>

                {/* Features list */}
                <AnimatePresence>
                  {showContent && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                      className="space-y-1.5 mb-3"
                    >
                      {features.map((f, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: ar ? 8 : -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.07 }}
                          className="flex items-start gap-2"
                        >
                          <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${hint.color} flex items-center justify-center shrink-0 mt-0.5`}>
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                          <span className="text-[11.5px] text-black/60 dark:text-white/60 leading-snug">{f}</span>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer button */}
                <AnimatePresence>
                  {showContent && (
                    <motion.button
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + features.length * 0.07 }}
                      onClick={handleDismiss}
                      data-testid="hint-got-it-btn"
                      className={`w-full bg-gradient-to-r ${hint.color} text-white font-bold text-sm rounded-2xl h-9 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all`}
                    >
                      {ar ? "فاهم، شكراً 👍" : "Got it, thanks!"}
                    </motion.button>
                  )}
                </AnimatePresence>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function TypewriterText({ text, speed = 22, className = "" }: { text: string; speed?: number; className?: string }) {
  const { displayed, done } = useTypewriter(text, speed, 0);
  return (
    <span className={className}>
      {displayed}
      {!done && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.45, repeat: Infinity, repeatType: "reverse" }}
          className="inline-block w-[2px] h-[13px] bg-current align-middle mr-0.5 rounded-full"
        />
      )}
    </span>
  );
}
