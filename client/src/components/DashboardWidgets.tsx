// @ts-nocheck
/**
 * DashboardWidgets — ويدجت الإشعارات + "ما الجديد" للوحة التحكم
 */
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  Bell, BellRing, Package, MessageSquare, AlertCircle, Zap, Check,
  CheckCheck, ChevronLeft, Sparkles, X, ArrowLeft, Rocket, Wrench, Shield, Star,
  ExternalLink, Info
} from "lucide-react";
import { CHANGELOG, CURRENT_VERSION } from "@/lib/changelog";

/* ── helpers ── */
function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}

function NotifIcon({ type }: { type: string }) {
  const cls = "w-4 h-4";
  if (type === "order") return <Package className={`${cls} text-blue-500`} />;
  if (type === "message") return <MessageSquare className={`${cls} text-emerald-500`} />;
  if (type === "payment" || type === "success") return <Zap className={`${cls} text-amber-500`} />;
  if (type === "alert" || type === "error") return <AlertCircle className={`${cls} text-red-500`} />;
  return <Bell className={`${cls} text-violet-500`} />;
}

const TYPE_LABEL: Record<string, string> = {
  order: "تحديث طلب", message: "رسالة جديدة", payment: "دفع",
  success: "نجاح", alert: "تنبيه", system: "النظام", info: "معلومة",
};

/* ════════════════════════════════════════
   NotificationsWidget — ويدجت الإشعارات
════════════════════════════════════════ */
export function NotificationsWidget() {
  const [, navigate] = useLocation();

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 25000,
  });

  const { data: notifications = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
  };

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("PATCH", `/api/notifications/${id}/read`, {}); },
    onSuccess: invalidate,
  });

  const markAllMutation = useMutation({
    mutationFn: async () => { await apiRequest("PATCH", "/api/notifications/read-all", {}); },
    onSuccess: invalidate,
  });

  const unread = countData?.count || 0;
  const recent = notifications.slice(0, 5);
  const hasUnread = unread > 0;

  if (notifications.length === 0 && !isLoading) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid rgba(0,0,0,0.06)" }}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-black/[0.05] dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${hasUnread ? "bg-violet-100 dark:bg-violet-900/30" : "bg-gray-100 dark:bg-gray-800"}`}>
            {hasUnread
              ? <BellRing className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              : <Bell className="w-3.5 h-3.5 text-gray-400" />
            }
          </div>
          <span className="text-sm font-bold text-black dark:text-white">الإشعارات</span>
          {hasUnread && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
              {unread} جديد
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasUnread && (
            <button
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center gap-1 font-semibold"
              data-testid="button-mark-all-read-widget"
            >
              <CheckCheck className="w-3 h-3" /> قراءة الكل
            </button>
          )}
        </div>
      </div>

      {/* Notifications list */}
      <div className="bg-white dark:bg-gray-900">
        <AnimatePresence>
          {recent.map((n: any, i: number) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`flex items-start gap-3 px-4 py-3 border-b border-black/[0.03] dark:border-white/[0.04] hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors cursor-pointer ${!n.read ? "bg-violet-50/40 dark:bg-violet-950/20" : ""}`}
              onClick={() => {
                if (!n.read) markReadMutation.mutate(n.id);
                if (n.link) navigate(n.link);
              }}
              data-testid={`notif-widget-${n.id}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.read ? "bg-violet-100 dark:bg-violet-900/40" : "bg-gray-100 dark:bg-gray-800"}`}>
                <NotifIcon type={n.type} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${!n.read ? "text-violet-500 dark:text-violet-400" : "text-gray-400 dark:text-gray-600"}`}>
                    {TYPE_LABEL[n.type] || "إشعار"}
                  </span>
                  <span className="text-[9px] text-gray-300 dark:text-gray-600">{timeAgo(n.createdAt)}</span>
                </div>
                <p className={`text-xs leading-snug ${!n.read ? "font-bold text-black dark:text-white" : "font-medium text-gray-600 dark:text-gray-400"}`}>
                  {n.title}
                </p>
                {n.body && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">{n.body}</p>
                )}
              </div>
              {!n.read && <div className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0 mt-2" />}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {notifications.length > 5 && (
        <div className="bg-white dark:bg-gray-900 px-4 py-2.5 border-t border-black/[0.04] dark:border-white/[0.05]">
          <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center">
            {notifications.length - 5} إشعار إضافي · شاهد الكل من قائمة الإشعارات
          </p>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   WhatsNewWidget — ويدجت "ما الجديد"
════════════════════════════════════════ */
const FEATURE_ICONS: Record<string, any> = {
  new: Rocket,
  improvement: Zap,
  fix: Wrench,
  security: Shield,
};
const FEATURE_COLORS: Record<string, string> = {
  new: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-800/40",
  improvement: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-800/40",
  fix: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-800/40",
  security: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-100 dark:border-violet-800/40",
};
const FEATURE_LABELS: Record<string, string> = {
  new: "جديد", improvement: "تحسين", fix: "إصلاح", security: "أمان",
};

export function WhatsNewWidget({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const latest = CHANGELOG[0];
  if (!latest) return null;

  const featuresShown = open ? latest.features : latest.features.slice(0, 3);

  return (
    <div
      className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900"
      style={{ border: "1px solid rgba(0,0,0,0.06)" }}
      dir="rtl"
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-black dark:text-white">ما الجديد في النظام</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
              v{CURRENT_VERSION}
            </span>
          </div>
          <p className="text-[10px] text-black/40 dark:text-white/40 truncate">{latest.label}</p>
        </div>
        <ChevronLeft className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${open ? "rotate-90" : ""}`} />
      </div>

      {/* Version summary */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {/* Summary banner */}
            <div className="px-4 py-3 border-t border-black/[0.05] dark:border-white/[0.06]"
              style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.04) 0%, rgba(14,165,233,0.04) 100%)" }}>
              <p className="text-xs text-black/60 dark:text-white/60 leading-relaxed">{latest.summary}</p>
              <p className="text-[10px] text-black/30 dark:text-white/30 mt-1.5">
                {new Date(latest.date).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>

            {/* Features list */}
            <div className="divide-y divide-black/[0.03] dark:divide-white/[0.04]">
              {featuresShown.map((f, i) => {
                const Icon = FEATURE_ICONS[f.type] || Info;
                const colorCls = FEATURE_COLORS[f.type] || FEATURE_COLORS.new;
                const label = FEATURE_LABELS[f.type] || "ميزة";
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-3 px-4 py-3"
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 border ${colorCls}`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-xs font-bold text-black dark:text-white">{f.title}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black border ${colorCls}`}>
                          {label}
                        </span>
                      </div>
                      <p className="text-[10px] text-black/45 dark:text-white/45 leading-relaxed">{f.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Show more / older versions */}
            {latest.features.length > 3 && (
              <div className="px-4 py-2.5 border-t border-black/[0.04] dark:border-white/[0.05] bg-gray-50 dark:bg-gray-800/40">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
                  {latest.features.length} ميزة في هذا الإصدار
                </p>
              </div>
            )}

            {/* Previous versions */}
            {CHANGELOG.length > 1 && (
              <div className="px-4 py-3 border-t border-black/[0.05] dark:border-white/[0.06]">
                <p className="text-[10px] font-bold text-black/30 dark:text-white/30 mb-2">إصدارات سابقة</p>
                <div className="space-y-1.5">
                  {CHANGELOG.slice(1, 3).map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                        v{v.version}
                      </span>
                      <span className="text-[10px] text-black/40 dark:text-white/40 truncate">{v.label}</span>
                      <span className="text-[9px] text-black/20 dark:text-white/20 mr-auto flex-shrink-0">
                        {new Date(v.date).toLocaleDateString("ar-SA", { month: "short", year: "numeric" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
