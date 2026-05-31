import { useState, useEffect } from "react";
import {
  checkBiometricAvailable,
  isBiometricRegisteredLocally,
  loginWithBiometric,
} from "@/hooks/use-biometric";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Fingerprint, ScanFace, Loader2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  prefillIdentifier?: string;
  onSuccess?: (user: any) => void;
  className?: string;
}

function isLikelyFaceID(): boolean {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  return /iPhone|iPad/.test(ua);
}

export function BiometricButton({ prefillIdentifier = "", onSuccess, className }: Props) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [registeredLocally, setRegisteredLocally] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const faceID = isLikelyFaceID();

  useEffect(() => {
    checkBiometricAvailable().then(ok => {
      setAvailable(ok);
      if (ok) setRegisteredLocally(isBiometricRegisteredLocally());
    });
  }, []);

  if (!available || !registeredLocally) return null;

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const user = await loginWithBiometric(prefillIdentifier || undefined);
      setSuccess(true);
      toast({ title: `مرحباً ${user.fullName || user.username}`, description: "تم تسجيل الدخول بالسمة الحيوية" });
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(user);
        } else {
          const returnUrl = sessionStorage.getItem("returnAfterLogin");
          if (returnUrl) { sessionStorage.removeItem("returnAfterLogin"); setLocation(returnUrl); }
          else setLocation(user.role === "client" ? "/dashboard" : "/admin");
        }
      }, 600);
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("cancel") || msg.includes("NotAllowed") || msg.includes("AbortError")) {
        toast({ title: "تم الإلغاء", description: "لم يتم التحقق من السمة الحيوية" });
      } else if (msg.includes("لم يتم التعرف") || msg.includes("تسجيل البصمة")) {
        toast({ title: "السمة الحيوية غير مسجّلة", description: "سجّل دخولك بكلمة المرور ثم أضف سمتك الحيوية من الإعدادات", variant: "destructive" });
      } else {
        toast({ title: "تعذّر تسجيل الدخول", description: msg, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const Icon = faceID ? ScanFace : Fingerprint;
  const iconColor = faceID ? "text-sky-500" : "text-violet-500";
  const ringColor = faceID ? "bg-sky-500/15 border-sky-500/30" : "bg-violet-500/15 border-violet-500/30";
  const labelText = faceID ? "بصمة الوجه" : "بصمة الإصبع";
  const subtitleText = faceID ? "Face ID" : "تسجيل دخول بالبصمة";

  return (
    <div className={className}>
      <motion.button
        type="button"
        data-testid="btn-biometric-login"
        onClick={handleLogin}
        disabled={loading || success}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="relative w-full h-14 rounded-xl border bg-white dark:bg-gray-900 overflow-hidden flex items-center gap-3 px-4 transition-all disabled:opacity-70 group"
        style={{ borderColor: faceID ? "rgba(14,165,233,0.3)" : "rgba(124,58,237,0.3)" }}
      >
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${faceID ? "bg-sky-50 dark:bg-sky-950/20" : "bg-violet-50 dark:bg-violet-950/20"}`} />

        {!loading && !success && (
          <>
            {[1, 2].map(i => (
              <motion.div
                key={i}
                className={`absolute rounded-full border ${faceID ? "border-sky-400/20" : "border-violet-400/20"}`}
                style={{ width: 36, height: 36, left: 10, top: "50%", translateY: "-50%" }}
                animate={{ width: 36 + i * 24, height: 36 + i * 24, opacity: [0.5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
              />
            ))}
          </>
        )}

        <div className={`relative z-10 w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${ringColor}`}>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loader" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                <Loader2 className={`w-4 h-4 animate-spin ${iconColor}`} />
              </motion.div>
            ) : success ? (
              <motion.div key="check" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <ShieldCheck className="w-4 h-4 text-green-500" />
              </motion.div>
            ) : (
              <motion.div key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative z-10 flex-1 text-start">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">
            {loading ? "جاري التحقق..." : success ? "تم الدخول بنجاح" : labelText}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">
            {loading ? "اتبع تعليمات جهازك" : success ? "" : subtitleText}
          </p>
        </div>

        <div className="relative z-10 flex-shrink-0">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${success ? "border-green-500/30 text-green-500 bg-green-500/10" : faceID ? "border-sky-500/30 text-sky-500 bg-sky-500/10" : "border-violet-500/30 text-violet-500 bg-violet-500/10"}`}>
            {success ? "تم" : "سريع"}
          </span>
        </div>
      </motion.button>
    </div>
  );
}
