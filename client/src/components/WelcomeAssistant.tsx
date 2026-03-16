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
  { label: "استعراض الباقات", path: "/prices", icon: "📦" },
  { label: "محفظتي", path: "/dashboard?tab=wallet", icon: "💳" },
];

const EMPLOYEE_ACTIONS: QuickAction[] = [
  { label: "مهام اليوم", path: "/employee/role-dashboard", icon: "✅" },
  { label: "تسجيل الحضور", path: "/employee/role-dashboard?tab=attendance", icon: "⏰" },
  { label: "الطلبات المسندة", path: "/employee/role-dashboard?tab=orders", icon: "📂" },
];

function getGreeting(name: string, role: string, orderCount: number): string {
  const hour = new Date().getHours();
  const timeGreet = hour < 12 ? "صباح الخير" : hour < 17 ? "مساء الخير" : "مساء النور";
  const firstName = name.split(" ")[0];

  if (role === "client") {
    if (orderCount === 0)
      return `${timeGreet}، ${firstName}. مرحباً بك في QIROX — يمكنك بدء مشروعك الآن.`;
    return `${timeGreet}، ${firstName}. لديك ${orderCount} ${orderCount === 1 ? "طلب" : "طلبات"} في النظام.`;
  }

  return `${timeGreet}، ${firstName}. يوم عمل منتج.`;
}

export function WelcomeAssistant() {
  const { data: user } = useUser();
  const [, navigate] = useLocation();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const { data: orders } = useQuery<{ id: string }[]>({
    queryKey: ["/api/orders"],
    enabled: !!user && user.role === "client",
  });

  useEffect(() => {
    if (!user) return;
    const key = `welcome_shown_${user._id || user.id}_${new Date().toDateString()}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    const timer = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    if (!visible || dismissed) return;
    const timer = setTimeout(() => setVisible(false), 14000);
    return () => clearTimeout(timer);
  }, [visible, dismissed]);

  const dismiss = () => {
    setDismissed(true);
    setVisible(false);
  };

  const handleAction = (path: string) => {
    dismiss();
    setTimeout(() => navigate(path), 150);
  };

  if (!user) return null;

  const role = user.role || "client";
  const name = user.fullName || user.username || "";
  const orderCount = orders?.length ?? 0;
  const isEmployee = role !== "client";
  const actions = isEmployee ? EMPLOYEE_ACTIONS : CLIENT_ACTIONS;
  const greeting = getGreeting(name, role, orderCount);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed z-[9998] inset-x-4 bottom-4 sm:inset-auto sm:bottom-6 sm:start-6 sm:w-[300px] pointer-events-auto"
          dir="rtl"
        >
          <div className="relative bg-white dark:bg-zinc-900 border border-black/8 dark:border-white/8 rounded-2xl shadow-lg shadow-black/10 dark:shadow-black/40 overflow-hidden">

            {/* Auto-dismiss progress line */}
            <motion.div
              className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-cyan-500/60 to-purple-500/60 origin-left"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 14, ease: "linear" }}
            />

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#0ea5e9,#7c3aed)" }}>
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-black/35 dark:text-white/35 font-medium leading-none mb-0.5">
                    QIROX
                  </p>
                  <p className="text-[12px] font-semibold text-black/70 dark:text-white/70 leading-none">
                    مرحباً بك
                  </p>
                </div>
              </div>
              <button onClick={dismiss}
                className="w-6 h-6 rounded-full flex items-center justify-center text-black/25 dark:text-white/25 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black/50 dark:hover:text-white/50 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="mx-4 h-px bg-black/5 dark:bg-white/5" />

            {/* Greeting */}
            <div className="px-4 py-2.5">
              <p className="text-[12.5px] text-black/75 dark:text-white/75 leading-relaxed">
                {greeting}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="px-4 pb-4 flex flex-col gap-1">
              {actions.map((action) => (
                <button key={action.path} onClick={() => handleAction(action.path)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-black/3 dark:bg-white/4 hover:bg-black/6 dark:hover:bg-white/7 border border-transparent hover:border-black/6 dark:hover:border-white/8 transition-all group text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-sm leading-none">{action.icon}</span>
                    <span className="text-[12px] font-medium text-black/65 dark:text-white/65 group-hover:text-black dark:group-hover:text-white transition-colors">
                      {action.label}
                    </span>
                  </div>
                  <ChevronLeft className="w-3 h-3 text-black/20 dark:text-white/20 flex-shrink-0" />
                </button>
              ))}
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
