import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, Sparkles, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { getHintForPath, isHintDismissed, dismissHint } from "@/lib/page-hints";

export function PageHintCard() {
  const [location] = useLocation();
  const { data: user } = useUser();
  const { lang } = useI18n();
  const ar = lang === "ar";

  const [visible, setVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hint = getHintForPath(location);
  const userId = user ? String((user as any)._id || (user as any).id || "guest") : null;

  // When route changes, check if we should show hint
  useEffect(() => {
    if (!hint || !userId) {
      setVisible(false);
      setCurrentKey(null);
      return;
    }
    if (hint.key === currentKey) return;

    // Check role restriction
    if (hint.roles && user && !(hint.roles.includes((user as any).role))) {
      setVisible(false);
      return;
    }

    setCurrentKey(hint.key);
    setMinimized(false);

    if (isHintDismissed(hint.key, userId)) {
      setVisible(false);
      return;
    }

    // Small delay to let page render first
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(true), 600);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [location, userId]);

  const handleDismiss = () => {
    if (hint && userId) dismissHint(hint.key, userId);
    setVisible(false);
    setMinimized(false);
  };

  const handleMinimize = () => setMinimized(true);

  const handleReopen = () => {
    setMinimized(false);
    setVisible(true);
  };

  if (!hint || !user) return null;
  const title = ar ? hint.titleAr : hint.titleEn;
  const desc = ar ? hint.descAr : hint.descEn;
  const features = ar ? hint.featuresAr : hint.featuresEn;

  return (
    <>
      {/* Floating re-open button when minimized */}
      <AnimatePresence>
        {minimized && (
          <motion.button
            key="reopen-btn"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            onClick={handleReopen}
            data-testid="hint-reopen-btn"
            className={`fixed bottom-6 ${ar ? "left-6" : "right-6"} z-50 w-11 h-11 rounded-2xl bg-gradient-to-br ${hint.color} shadow-lg shadow-black/20 flex items-center justify-center text-white text-lg hover:scale-110 transition-transform`}
            title={ar ? "إعادة فتح التلميح" : "Reopen hint"}
          >
            <Sparkles className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main hint card */}
      <AnimatePresence>
        {visible && !minimized && (
          <motion.div
            key={`hint-${hint.key}`}
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={`fixed bottom-6 ${ar ? "left-6" : "right-6"} z-50 w-[320px] max-w-[calc(100vw-2rem)] rounded-3xl overflow-hidden shadow-2xl shadow-black/25`}
            data-testid="hint-card"
          >
            {/* Header gradient */}
            <div className={`bg-gradient-to-br ${hint.color} px-5 pt-5 pb-4 relative`}>
              {/* Close & minimize buttons */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <button
                  onClick={handleMinimize}
                  data-testid="hint-minimize-btn"
                  className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  title={ar ? "تصغير" : "Minimize"}
                >
                  <ChevronDown className="w-3.5 h-3.5 text-white" />
                </button>
                <button
                  onClick={handleDismiss}
                  data-testid="hint-dismiss-btn"
                  className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  title={ar ? "إغلاق نهائي" : "Close permanently"}
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>

              {/* Icon + title */}
              <div className="flex items-center gap-3 mt-1">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                  {hint.icon}
                </div>
                <div>
                  <p className="text-white/60 text-[10px] font-medium uppercase tracking-wider mb-0.5">
                    {ar ? "دليل الصفحة" : "Page Guide"}
                  </p>
                  <h3 className="text-white font-black text-base leading-tight">{title}</h3>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="bg-white dark:bg-gray-900 px-5 py-4">
              <p className="text-black/60 dark:text-white/60 text-[12.5px] leading-relaxed mb-4">
                {desc}
              </p>

              <div className="space-y-2 mb-4">
                <p className="text-[10px] font-bold text-black/30 dark:text-white/30 uppercase tracking-wider mb-2">
                  {ar ? "ماذا يمكنك فعله هنا؟" : "What can you do here?"}
                </p>
                {features.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: ar ? 10 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.06 }}
                    className="flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-[12px] text-black/70 dark:text-white/70 leading-snug">{f}</span>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={handleDismiss}
                data-testid="hint-got-it-btn"
                className={`w-full bg-gradient-to-r ${hint.color} text-white font-bold text-sm rounded-xl h-9 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {ar ? "فهمت، شكراً!" : "Got it, thanks!"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
