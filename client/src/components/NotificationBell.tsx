import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Bell, BellRing, Check, CheckCheck, Package, MessageSquare, FileText, Loader2, X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function NotifIcon({ type }: { type: string }) {
  if (type === "order") return <Package className="w-3.5 h-3.5 text-blue-500" />;
  if (type === "message") return <MessageSquare className="w-3.5 h-3.5 text-green-500" />;
  return <FileText className="w-3.5 h-3.5 text-orange-500" />;
}

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} س`;
  return new Date(date).toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000,
  });

  const { data: notifications = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    enabled: open,
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

  const deleteOneMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/notifications/${id}`); },
    onSuccess: invalidate,
  });

  const clearReadMutation = useMutation({
    mutationFn: async () => { await apiRequest("DELETE", "/api/notifications"); },
    onSuccess: invalidate,
  });

  const unread = countData?.count || 0;
  const hasRead = notifications.some((n: any) => n.read);

  return (
    <div className="relative" dir="rtl">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-8 h-8 flex items-center justify-center rounded-xl hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
        data-testid="button-notification-bell"
        aria-label="الإشعارات"
      >
        {unread > 0
          ? <BellRing className="w-4 h-4 text-gray-800 dark:text-white animate-[swing_0.5s_ease-in-out_infinite_alternate]" />
          : <Bell className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        }
        {unread > 0 && (
          <span className="absolute -top-0.5 -left-0.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center" data-testid="notification-count">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-10 w-80 bg-white dark:bg-gray-900 border border-black/[0.08] dark:border-white/[0.08] rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.05] dark:border-white/[0.06]">
                <span className="text-xs font-black text-gray-900 dark:text-white">
                  الإشعارات {unread > 0 && <span className="text-gray-400 dark:text-gray-500">({unread})</span>}
                </span>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button
                      onClick={() => markAllMutation.mutate()}
                      disabled={markAllMutation.isPending}
                      className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex items-center gap-1"
                      data-testid="button-mark-all-read"
                    >
                      <CheckCheck className="w-3 h-3" /> قراءة الكل
                    </button>
                  )}
                  {hasRead && (
                    <button
                      onClick={() => clearReadMutation.mutate()}
                      disabled={clearReadMutation.isPending}
                      className="text-[10px] text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                      title="حذف المقروءة"
                      data-testid="button-clear-read-notifications"
                    >
                      <Trash2 className="w-3 h-3" /> مسح المقروءة
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-300 dark:text-gray-600" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell className="w-6 h-6 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 dark:text-gray-500">لا توجد إشعارات</p>
                  </div>
                ) : (
                  <div>
                    {notifications.map((n: any) => (
                      <div
                        key={n.id}
                        className={`group flex items-start gap-3 px-4 py-3 border-b border-black/[0.03] dark:border-white/[0.04] transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${
                          !n.read ? "bg-violet-50/50 dark:bg-violet-900/10" : ""
                        }`}
                        data-testid={`notification-${n.id}`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer ${
                            !n.read ? "bg-violet-100 dark:bg-violet-900/30" : "bg-gray-100 dark:bg-gray-800"
                          }`}
                          onClick={() => { if (!n.read) markReadMutation.mutate(n.id); setOpen(false); if (n.link) window.location.href = n.link; }}
                        >
                          <NotifIcon type={n.type} />
                        </div>
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => { if (!n.read) markReadMutation.mutate(n.id); setOpen(false); if (n.link) window.location.href = n.link; }}
                        >
                          <p className={`text-xs leading-relaxed ${!n.read ? "font-bold text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>{n.title}</p>
                          {n.body && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">{n.body}</p>}
                          <p className="text-[9px] text-gray-300 dark:text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                          {!n.read && <div className="w-1.5 h-1.5 bg-violet-500 rounded-full" />}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteOneMutation.mutate(n.id); }}
                            disabled={deleteOneMutation.isPending}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-all"
                            title="حذف الإشعار"
                            data-testid={`button-delete-notification-${n.id}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
