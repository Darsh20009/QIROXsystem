import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Bell, BellRing, Check, CheckCheck, Package, MessageSquare, FileText, Loader2 } from "lucide-react";
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

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/notifications/${id}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/notifications/read-all", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const unread = countData?.count || 0;

  return (
    <div className="relative" dir="rtl">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-8 h-8 flex items-center justify-center rounded-xl hover:bg-black/[0.05] transition-colors"
        data-testid="button-notification-bell"
        aria-label="الإشعارات"
      >
        {unread > 0 ? <BellRing className="w-4 h-4 text-black animate-[swing_0.5s_ease-in-out_infinite_alternate]" /> : <Bell className="w-4 h-4 text-black/50" />}
        {unread > 0 && (
          <span className="absolute -top-0.5 -left-0.5 w-4 h-4 bg-black text-white text-[8px] font-black rounded-full flex items-center justify-center" data-testid="notification-count">
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
              className="absolute left-0 top-10 w-72 bg-white border border-black/[0.08] rounded-2xl shadow-xl overflow-hidden z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.05]">
                <span className="text-xs font-black text-black">الإشعارات {unread > 0 && <span className="text-black/30">({unread})</span>}</span>
                {unread > 0 && (
                  <button
                    onClick={() => markAllMutation.mutate()}
                    disabled={markAllMutation.isPending}
                    className="text-[10px] text-black/40 hover:text-black/70 transition-colors flex items-center gap-1"
                    data-testid="button-mark-all-read"
                  >
                    <CheckCheck className="w-3 h-3" /> قراءة الكل
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-72 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-4 h-4 animate-spin text-black/20" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell className="w-6 h-6 text-black/10 mx-auto mb-2" />
                    <p className="text-xs text-black/30">لا توجد إشعارات</p>
                  </div>
                ) : (
                  <div>
                    {notifications.map((n: any) => (
                      <button
                        key={n.id}
                        onClick={() => { markReadMutation.mutate(n.id); setOpen(false); if (n.link) window.location.href = n.link; }}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-right hover:bg-black/[0.02] border-b border-black/[0.03] transition-colors ${!n.read ? 'bg-black/[0.02]' : ''}`}
                        data-testid={`notification-${n.id}`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.read ? 'bg-black/[0.06]' : 'bg-black/[0.03]'}`}>
                          <NotifIcon type={n.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-relaxed ${!n.read ? 'font-bold text-black' : 'text-black/70'}`}>{n.title}</p>
                          {n.body && <p className="text-[10px] text-black/40 mt-0.5 truncate">{n.body}</p>}
                          <p className="text-[9px] text-black/25 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.read && <div className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0 mt-2" />}
                      </button>
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
