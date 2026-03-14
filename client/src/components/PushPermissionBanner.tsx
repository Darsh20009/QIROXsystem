import { useState, useEffect } from "react";
import { Bell, BellOff, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const DISMISSED_KEY = "qirox_push_banner_dismissed_v2";

interface Props {
  show: boolean;
}

export function PushPermissionBanner({ show }: Props) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { status, subscribe } = usePushNotifications();

  useEffect(() => {
    if (!show) return;
    if (status !== "default") return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (Notification.permission !== "default") return;

    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    const timer = setTimeout(() => setVisible(true), 3500);
    return () => clearTimeout(timer);
  }, [show, status]);

  if (!visible || success) return null;

  const handleEnable = async () => {
    setLoading(true);
    try {
      const ok = await subscribe();
      if (ok) {
        setSuccess(true);
        setTimeout(() => setVisible(false), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  return (
    <div
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-bottom-4 duration-300"
      data-testid="push-permission-banner"
      dir="rtl"
    >
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-4 flex gap-3 items-start">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mt-0.5">
          <Bell className="w-5 h-5 text-blue-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight mb-0.5">
            فعّل إشعارات الجهاز
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            احصل على إشعارات فورية للرسائل والطلبات والاجتماعات — حتى عندما يكون التطبيق مغلقاً
          </p>

          {/* Device icons */}
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Smartphone className="w-3 h-3" />
              أندرويد · ويندوز · سطح المكتب
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              className="h-8 text-xs px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex-1"
              onClick={handleEnable}
              disabled={loading}
              data-testid="push-enable-btn"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  جارٍ التفعيل...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Bell className="w-3 h-3" />
                  تفعيل الإشعارات
                </span>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs px-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
              onClick={handleDismiss}
              data-testid="push-dismiss-btn"
            >
              لاحقاً
            </Button>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
          data-testid="push-close-btn"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Success state */}
      {success && (
        <div className="absolute inset-0 bg-green-900/95 rounded-2xl flex items-center justify-center gap-2 animate-in fade-in duration-300">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm text-white font-medium">تم تفعيل الإشعارات ✓</p>
        </div>
      )}
    </div>
  );
}
