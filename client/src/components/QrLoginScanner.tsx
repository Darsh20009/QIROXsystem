import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, QrCode, Camera, AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function QrLoginScanner({ open, onClose }: Props) {
  const { lang } = useI18n();
  const L = lang === "ar";
  const containerId = "qr-login-scanner-region";
  const scannerRef = useRef<any>(null);
  const [error, setError] = useState<string>("");
  const [starting, setStarting] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setError("");
    setStarting(true);
    setRedirecting(false);

    (async () => {
      try {
        const mod = await import("html5-qrcode");
        const { Html5Qrcode } = mod;
        if (cancelled) return;

        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded: string) => {
            if (cancelled || redirecting) return;
            handleDecoded(decoded);
          },
          () => {}
        );
        if (!cancelled) setStarting(false);
      } catch (e: any) {
        if (cancelled) return;
        setStarting(false);
        setError(
          L
            ? "تعذر فتح الكاميرا. تأكد من الإذن أو استخدم رابط QR مباشرة."
            : "Cannot open camera. Check permission or use the QR link directly."
        );
      }
    })();

    function handleDecoded(decoded: string) {
      setRedirecting(true);
      try {
        let url: URL;
        try {
          url = new URL(decoded);
        } catch {
          url = new URL(decoded, window.location.origin);
        }
        if (!url.pathname.startsWith("/api/qr-login/")) {
          setRedirecting(false);
          setError(L ? "هذا الباركود غير صالح للدخول" : "This QR is not a valid login code");
          return;
        }
        // Stop scanner before navigating
        try {
          scannerRef.current?.stop().catch(() => {});
        } catch {}
        window.location.href = url.pathname + url.search;
      } catch {
        setRedirecting(false);
        setError(L ? "هذا الباركود غير صالح" : "Invalid QR code");
      }
    }

    return () => {
      cancelled = true;
      try {
        scannerRef.current?.stop?.().catch(() => {});
        scannerRef.current?.clear?.();
      } catch {}
      scannerRef.current = null;
    };
  }, [open, L]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10" data-testid="dialog-qr-scanner">
        <DialogHeader className="p-5 pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-black dark:text-white">
            <QrCode className="w-4 h-4" />
            {L ? "تسجيل الدخول بالباركود" : "Sign in with QR"}
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 pt-3 space-y-3">
          <p className="text-xs text-black/55 dark:text-white/55 leading-relaxed text-center">
            {L
              ? "وجّه الكاميرا إلى باركود بطاقة الموظف الخاصة بك للدخول الفوري"
              : "Point the camera at your Employee ID badge QR for instant sign in"}
          </p>

          <div className="relative rounded-2xl overflow-hidden bg-black aspect-square">
            <div id={containerId} className="absolute inset-0 [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />

            {starting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 gap-2 bg-black/70">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs">{L ? "تشغيل الكاميرا…" : "Starting camera…"}</span>
              </div>
            )}

            {redirecting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-2 bg-black/85">
                <Loader2 className="w-7 h-7 animate-spin" />
                <span className="text-sm font-bold">{L ? "جاري تسجيل الدخول…" : "Signing you in…"}</span>
              </div>
            )}

            {/* Corner brackets overlay */}
            {!starting && !redirecting && (
              <div className="pointer-events-none absolute inset-8">
                <span className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-white/85 rounded-tl-md" />
                <span className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-white/85 rounded-tr-md" />
                <span className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-white/85 rounded-bl-md" />
                <span className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-white/85 rounded-br-md" />
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] p-3 text-xs text-black dark:text-white">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-black/50 dark:text-white/50 justify-center">
            <Camera className="w-3 h-3" />
            <span>{L ? "يحتاج إذن استخدام الكاميرا" : "Camera permission required"}</span>
          </div>

          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-black/10 dark:border-white/10"
            data-testid="button-qr-scan-cancel"
          >
            {L ? "إلغاء" : "Cancel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
