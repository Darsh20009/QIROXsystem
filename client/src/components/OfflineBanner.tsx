import { useState, useEffect, useCallback } from "react";
import { WifiOff, RefreshCw, X } from "lucide-react";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    if (wasOffline) {
      setShowBackOnline(true);
      setDismissed(false);
      setTimeout(() => setShowBackOnline(false), 4000);
    }
    setWasOffline(false);
  }, [wasOffline]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
    setDismissed(false);
    setShowBackOnline(false);
  }, []);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  if (dismissed) return null;
  if (isOnline && !showBackOnline) return null;

  // Back online toast
  if (showBackOnline) {
    return (
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-white text-black px-5 py-3 rounded-2xl shadow-2xl border border-black/10 animate-in slide-in-from-bottom-4 duration-300"
        style={{ direction: "rtl" }}
      >
        <span className="w-2 h-2 rounded-full bg-black animate-pulse shrink-0" />
        <span className="font-semibold text-sm">عاد الاتصال بالإنترنت</span>
      </div>
    );
  }

  // Offline banner — fixed top bar
  return (
    <div
      className="fixed top-0 inset-x-0 z-[9999] animate-in slide-in-from-top-2 duration-300"
      style={{ direction: "rtl" }}
    >
      <div className="flex items-center justify-between gap-4 bg-black text-white px-4 py-2.5 text-sm font-medium">
        <div className="flex items-center gap-2.5">
          <WifiOff className="w-4 h-4 shrink-0 opacity-70" />
          <span>لا يوجد اتصال بالإنترنت — بعض الميزات غير متاحة</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-colors rounded-lg px-3 py-1.5 text-xs font-semibold"
          >
            <RefreshCw className="w-3 h-3" />
            إعادة المحاولة
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors opacity-60 hover:opacity-100"
            aria-label="إغلاق"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook to detect offline state anywhere in the app
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return isOnline;
}
