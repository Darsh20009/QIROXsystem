import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  X, MessageSquare, Package, FileText, Wrench,
  Bell, ChevronLeft, ChevronRight, AlertCircle,
} from "lucide-react";
import { useUser } from "@/hooks/use-auth";

const TYPE_CONFIG: Record<string, { icon: any; gradient: string; border: string; iconBg: string; label: string }> = {
  message: {
    icon: MessageSquare,
    gradient: "from-[#0f172a] via-[#134e4a] to-[#0e7490]",
    border: "border-cyan-500/30",
    iconBg: "bg-cyan-400/20",
    label: "رسالة جديدة",
  },
  order: {
    icon: Package,
    gradient: "from-[#0f172a] via-[#1e3a5f] to-[#1d4ed8]",
    border: "border-blue-500/30",
    iconBg: "bg-blue-400/20",
    label: "تحديث طلب",
  },
  modification: {
    icon: Wrench,
    gradient: "from-[#0f172a] via-[#3b2a00] to-[#b45309]",
    border: "border-amber-500/30",
    iconBg: "bg-amber-400/20",
    label: "طلب تعديل",
  },
  alert: {
    icon: AlertCircle,
    gradient: "from-[#0f172a] via-[#3b0a0a] to-[#b91c1c]",
    border: "border-red-500/30",
    iconBg: "bg-red-400/20",
    label: "تنبيه",
  },
  default: {
    icon: Bell,
    gradient: "from-[#0f172a] via-[#1e293b] to-[#0e7490]",
    border: "border-cyan-500/20",
    iconBg: "bg-white/10",
    label: "إشعار",
  },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.default;
}

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}

export function GlobalNotificationBanner() {
  const { data: user } = useUser();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 20000,
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/notifications/${id}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const activeNotifications = notifications.filter(
    (n: any) => !n.read && !dismissedIds.has(n.id)
  );

  useEffect(() => {
    if (activeNotifications.length > 0) {
      setVisible(true);
      setCurrentIndex(0);
    } else {
      setVisible(false);
    }
  }, [activeNotifications.length]);

  useEffect(() => {
    if (!visible || activeNotifications.length === 0) return;
    const timer = setTimeout(() => {
      handleDismiss(activeNotifications[currentIndex]?.id);
    }, 10000);
    return () => clearTimeout(timer);
  }, [visible, currentIndex, activeNotifications.length]);

  const handleDismiss = useCallback((id?: string) => {
    if (!id) {
      setVisible(false);
      return;
    }
    setDismissedIds(prev => new Set([...prev, id]));
    const remaining = activeNotifications.filter(n => n.id !== id);
    if (remaining.length === 0) {
      setVisible(false);
    } else {
      setCurrentIndex(0);
    }
  }, [activeNotifications]);

  const handleClick = (n: any) => {
    markReadMutation.mutate(n.id);
    setDismissedIds(prev => new Set([...prev, n.id]));
  };

  const goNext = () => {
    setCurrentIndex(i => Math.min(i + 1, activeNotifications.length - 1));
  };

  const goPrev = () => {
    setCurrentIndex(i => Math.max(i - 1, 0));
  };

  if (!user) return null;

  const current = activeNotifications[currentIndex];
  const cfg = current ? getConfig(current.type) : getConfig("default");
  const Icon = cfg.icon;

  return (
    <AnimatePresence>
      {visible && current && (
        <motion.div
          key={current.id}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden z-50 relative"
          dir="rtl"
        >
          <div className={`bg-gradient-to-l ${cfg.gradient} border-b ${cfg.border} px-4 py-2.5`}>
            <div className="max-w-7xl mx-auto flex items-center gap-3">
              {/* Icon */}
              <div className={`w-7 h-7 rounded-lg ${cfg.iconBg} border border-white/10 flex items-center justify-center shrink-0`}>
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {current.link ? (
                  <Link href={current.link} onClick={() => handleClick(current)}>
                    <div className="cursor-pointer group">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">{cfg.label}</span>
                        <span className="text-[10px] text-white/35">{timeAgo(current.createdAt)}</span>
                      </div>
                      <p className="text-xs font-bold text-white leading-snug truncate group-hover:text-cyan-300 transition-colors">
                        {current.title}
                      </p>
                      {current.body && (
                        <p className="text-[11px] text-white/50 truncate">{current.body}</p>
                      )}
                    </div>
                  </Link>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">{cfg.label}</span>
                      <span className="text-[10px] text-white/35">{timeAgo(current.createdAt)}</span>
                    </div>
                    <p className="text-xs font-bold text-white leading-snug truncate">{current.title}</p>
                    {current.body && (
                      <p className="text-[11px] text-white/50 truncate">{current.body}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Multi-notification nav */}
              {activeNotifications.length > 1 && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={goPrev}
                    disabled={currentIndex === 0}
                    className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-white" />
                  </button>
                  <span className="text-[10px] text-white/50 font-bold tabular-nums min-w-[32px] text-center">
                    {currentIndex + 1}/{activeNotifications.length}
                  </span>
                  <button
                    onClick={goNext}
                    disabled={currentIndex === activeNotifications.length - 1}
                    className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              )}

              {/* Dismiss */}
              <button
                onClick={() => handleDismiss(current.id)}
                className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
                title="إغلاق"
                data-testid="button-dismiss-banner"
              >
                <X className="w-3.5 h-3.5 text-white/70" />
              </button>
            </div>

            {/* Progress bar (auto-dismiss timer) */}
            <div className="max-w-7xl mx-auto mt-2">
              <motion.div
                key={`${current.id}-progress`}
                className="h-0.5 bg-white/20 rounded-full overflow-hidden"
              >
                <motion.div
                  className="h-full bg-white/50 rounded-full"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 10, ease: "linear" }}
                />
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
