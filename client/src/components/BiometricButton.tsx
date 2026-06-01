import { useState, useEffect, useRef } from "react";
import {
  checkBiometricAvailable,
  isBiometricRegisteredLocally,
  loginWithBiometric,
} from "@/hooks/use-biometric";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Fingerprint, ScanFace, Loader2, ShieldCheck, ChevronDown, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type BiometricType = "fingerprint" | "face";

const PREF_KEY = "qirox_biometric_pref";

function getSavedPref(): BiometricType {
  try { return (localStorage.getItem(PREF_KEY) as BiometricType) || "fingerprint"; } catch { return "fingerprint"; }
}
function savePref(t: BiometricType) {
  try { localStorage.setItem(PREF_KEY, t); } catch {}
}

interface Props {
  prefillIdentifier?: string;
  onSuccess?: (user: any) => void;
  className?: string;
}

export function BiometricButton({ prefillIdentifier = "", onSuccess, className }: Props) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [registeredLocally, setRegisteredLocally] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pref, setPref] = useState<BiometricType>(getSavedPref);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    checkBiometricAvailable().then(ok => {
      setAvailable(ok);
      if (ok) setRegisteredLocally(isBiometricRegisteredLocally());
    });
  }, []);

  useEffect(() => {
    function onClickOut(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    if (showPicker) document.addEventListener("mousedown", onClickOut);
    return () => document.removeEventListener("mousedown", onClickOut);
  }, [showPicker]);

  if (!available || !registeredLocally) return null;

  function selectType(t: BiometricType) {
    if (t === "face") {
      toast({
        title: "بصمة الوجه غير متاحة",
        description: "بصمة الوجه لا تعمل حالياً في النظام. سيتم استخدام بصمة الإصبع.",
        variant: "destructive",
      });
      return;
    }
    savePref(t);
    setPref(t);
    setShowPicker(false);
  }

  const handleLogin = async () => {
    if (loading || success) return;
    setLoading(true);
    try {
      const user = await loginWithBiometric(prefillIdentifier || undefined);
      setSuccess(true);
      toast({ title: `مرحباً ${user.fullName || user.username}`, description: "تم تسجيل الدخول بالبصمة" });
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
        toast({ title: "تم الإلغاء", description: "لم يتم التحقق من البصمة", variant: "default" });
      } else {
        toast({ title: "تعذّر تسجيل الدخول بالبصمة", description: "سجّل دخولك بكلمة المرور", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const Icon = pref === "face" ? ScanFace : Fingerprint;
  const color = "text-violet-500";
  const bg = "bg-violet-50 border-violet-200 hover:bg-violet-100";

  return (
    <div className={`relative flex-shrink-0 ${className || ""}`} ref={pickerRef}>
      {/* Main biometric button */}
      <div className="flex items-stretch h-11 rounded-xl border border-violet-200 overflow-hidden">
        {/* Trigger login */}
        <motion.button
          type="button"
          data-testid="btn-biometric-login"
          onClick={handleLogin}
          disabled={loading || success}
          whileTap={{ scale: 0.94 }}
          className={`flex items-center justify-center w-11 ${bg} transition-colors disabled:opacity-60`}
          title={pref === "fingerprint" ? "تسجيل الدخول بالبصمة" : "تسجيل الدخول بالوجه"}
        >
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.span key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Loader2 className={`w-5 h-5 animate-spin ${color}`} />
              </motion.span>
            ) : success ? (
              <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <ShieldCheck className="w-5 h-5 text-green-500" />
              </motion.span>
            ) : (
              <motion.span key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Icon className={`w-5 h-5 ${color}`} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Type picker toggle */}
        <button
          type="button"
          data-testid="btn-biometric-type-toggle"
          onClick={() => setShowPicker(v => !v)}
          className="flex items-center justify-center w-5 border-r border-violet-200 bg-violet-50 hover:bg-violet-100 transition-colors"
          title="اختر نوع البصمة"
        >
          <ChevronDown className={`w-3 h-3 text-violet-400 transition-transform ${showPicker ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Picker dropdown */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden min-w-[170px]"
          >
            <p className="text-[10px] text-black/30 font-bold px-3 pt-2.5 pb-1">اختر نوع البصمة</p>

            {/* Fingerprint option */}
            <button
              type="button"
              data-testid="btn-biometric-pick-fingerprint"
              onClick={() => selectType("fingerprint")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-violet-50 transition-colors ${pref === "fingerprint" ? "bg-violet-50" : ""}`}
            >
              <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Fingerprint className="w-4 h-4 text-violet-500" />
              </div>
              <div className="text-start">
                <p className="text-[12px] font-semibold text-gray-800">بصمة الإصبع</p>
                <p className="text-[10px] text-gray-400">Fingerprint</p>
              </div>
              {pref === "fingerprint" && (
                <ShieldCheck className="w-3.5 h-3.5 text-violet-500 mr-auto" />
              )}
            </button>

            {/* Face ID option — disabled */}
            <button
              type="button"
              data-testid="btn-biometric-pick-face"
              onClick={() => selectType("face")}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-red-50 transition-colors opacity-60"
            >
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <ScanFace className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-start flex-1">
                <p className="text-[12px] font-semibold text-gray-600 flex items-center gap-1">
                  بصمة الوجه
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                </p>
                <p className="text-[10px] text-red-400">غير متاحة حالياً</p>
              </div>
            </button>

            <div className="px-3 pb-2.5 pt-1">
              <p className="text-[9px] text-black/20 leading-relaxed">
                بصمة الوجه لا تعمل في النظام حالياً
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
