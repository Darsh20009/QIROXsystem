import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { X, ChevronLeft, Sparkles } from "lucide-react";
import { useUser } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

interface QuickAction {
  label: string;
  path: string;
  icon: string;
}

const CLIENT_ACTIONS: QuickAction[] = [
  { label: "طلباتي ومشاريعي", path: "/dashboard?tab=orders", icon: "📋" },
  { label: "استكشف الباقات", path: "/prices", icon: "📦" },
  { label: "محفظتي", path: "/dashboard?tab=wallet", icon: "💳" },
];

const EMPLOYEE_ACTIONS: QuickAction[] = [
  { label: "مهامي اليوم", path: "/employee/role-dashboard", icon: "✅" },
  { label: "تسجيل الحضور", path: "/employee/role-dashboard?tab=attendance", icon: "⏰" },
  { label: "الطلبات المسندة إليّ", path: "/employee/role-dashboard?tab=orders", icon: "📂" },
];

function getGreeting(name: string, role: string, orderCount: number, walletBalance: number): string {
  const hour = new Date().getHours();
  const timeGreet = hour < 12 ? "صباح الخير" : hour < 17 ? "مساء الخير" : "مساء النور";
  const firstName = name.split(" ")[0];

  if (role === "client") {
    if (orderCount === 0)
      return `${timeGreet} ${firstName}! 👋\nأهلاً بك في QIROX. جاهز تبدأ مشروعك الأول؟`;
    if (orderCount > 0)
      return `${timeGreet} ${firstName}! 👋\nعندك ${orderCount} ${orderCount === 1 ? "طلب" : "طلبات"} في النظام. تتابعها؟`;
    return `${timeGreet} ${firstName}! 👋\nأنا هنا لو احتجت أي مساعدة.`;
  }

  if (role === "employee" || role === "employee_manager" || role === "manager") {
    return `${timeGreet} ${firstName}! 💼\nيوم موفق، شوف مهام اليوم وابدأ!`;
  }

  return `${timeGreet} ${firstName}! 👋\nأهلاً بك في QIROX.`;
}

export function WelcomeAssistant() {
  const { data: user } = useUser();
  const [, navigate] = useLocation();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [countdown, setCountdown] = useState(12);

  const { data: orders } = useQuery<any[]>({
    queryKey: ["/api/orders"],
    enabled: !!user && user.role === "client",
  });

  useEffect(() => {
    if (!user) return;
    const key = `welcome_shown_${user._id || user.id}_${new Date().toDateString()}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, [user]);

  useEffect(() => {
    if (!visible || dismissed) return;
    if (countdown <= 0) { setVisible(false); return; }
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [visible, dismissed, countdown]);

  const dismiss = () => {
    setDismissed(true);
    setVisible(false);
  };

  const handleAction = (path: string) => {
    dismiss();
    setTimeout(() => navigate(path), 200);
  };

  if (!user) return null;

  const role = user.role || "client";
  const name = user.fullName || user.username || "مرحباً";
  const orderCount = orders?.length ?? 0;
  const isEmployee = role !== "client";
  const actions = isEmployee ? EMPLOYEE_ACTIONS : CLIENT_ACTIONS;
  const greeting = getGreeting(name, role, orderCount, user.walletBalance ?? 0);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-6 z-[9999] w-[320px]"
          dir="rtl"
        >
          {/* Card */}
          <div className="relative bg-white dark:bg-zinc-900 border border-black/8 dark:border-white/10 rounded-2xl shadow-xl shadow-black/8 overflow-hidden">

            {/* Countdown bar */}
            <motion.div
              className="absolute top-0 right-0 h-[2px] bg-black/10 dark:bg-white/10 origin-right"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 12, ease: "linear" }}
            />

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#0ea5e9,#7c3aed)" }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-[11px] text-black/40 dark:text-white/40 font-medium leading-none mb-0.5">
                    QIROX AI
                  </p>
                  <p className="text-[12px] font-semibold text-black/70 dark:text-white/70 leading-none">
                    مساعدك الشخصي
                  </p>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="w-7 h-7 rounded-full flex items-center justify-center text-black/30 dark:text-white/30 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black/60 dark:hover:text-white/60 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Divider */}
            <div className="mx-4 h-px bg-black/5 dark:bg-white/5" />

            {/* Greeting */}
            <div className="px-4 py-3">
              <p className="text-[13.5px] font-medium text-black/80 dark:text-white/80 leading-relaxed whitespace-pre-line">
                {greeting}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="px-4 pb-4 flex flex-col gap-1.5">
              {actions.map((action) => (
                <button
                  key={action.path}
                  onClick={() => handleAction(action.path)}
                  className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl bg-black/3 dark:bg-white/5 hover:bg-black/7 dark:hover:bg-white/8 border border-transparent hover:border-black/8 dark:hover:border-white/10 transition-all group text-right"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{action.icon}</span>
                    <span className="text-[12.5px] font-medium text-black/70 dark:text-white/70 group-hover:text-black dark:group-hover:text-white transition-colors">
                      {action.label}
                    </span>
                  </div>
                  <ChevronLeft className="w-3.5 h-3.5 text-black/25 dark:text-white/25 group-hover:text-black/50 dark:group-hover:text-white/50 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
