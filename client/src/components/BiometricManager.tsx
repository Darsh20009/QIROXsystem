import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { checkBiometricAvailable, registerBiometric, clearBiometricLocal, clearFaceLocal } from "@/hooks/use-biometric";
import { getQuickPinStatus, setQuickPin, removeQuickPin } from "@/hooks/use-quick-pin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  Fingerprint, ScanFace, CheckCircle2, Plus, Trash2, Loader2,
  ShieldCheck, Monitor, Smartphone, TabletSmartphone, KeyRound,
  Eye, EyeOff, Hash, AlertCircle, ChevronRight, X, Camera
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { FaceRecognitionModal } from "@/components/FaceRecognitionModal";

type SetupStep = "choose_type" | "choose_finger" | "face_prep" | "scanning" | "success" | "error";
type BiometricType = "fingerprint" | "face";

interface Credential {
  id: string;
  deviceName: string;
  userAgent: string;
  lastUsed?: string;
  createdAt: string;
}

interface FingerDef {
  key: string;
  label: string;
  height: number;
}

const RIGHT_FINGERS: FingerDef[] = [
  { key: "right_thumb",  label: "الإبهام", height: 64 },
  { key: "right_index",  label: "السبابة", height: 82 },
  { key: "right_middle", label: "الوسطى",  height: 92 },
  { key: "right_ring",   label: "البنصر",  height: 80 },
  { key: "right_pinky",  label: "الخنصر",  height: 60 },
];
const LEFT_FINGERS: FingerDef[] = [
  { key: "left_thumb",  label: "الإبهام", height: 64 },
  { key: "left_index",  label: "السبابة", height: 82 },
  { key: "left_middle", label: "الوسطى",  height: 92 },
  { key: "left_ring",   label: "البنصر",  height: 80 },
  { key: "left_pinky",  label: "الخنصر",  height: 60 },
];

const FINGER_FULL_LABELS: Record<string, string> = {
  right_thumb: "إبهام اليمنى", right_index: "سبابة اليمنى",
  right_middle: "وسطى اليمنى", right_ring: "بنصر اليمنى", right_pinky: "خنصر اليمنى",
  left_thumb: "إبهام اليسرى", left_index: "سبابة اليسرى",
  left_middle: "وسطى اليسرى", left_ring: "بنصر اليسرى", left_pinky: "خنصر اليسرى",
};

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
}

function deviceIcon(ua: string) {
  if (/iPhone|iPad/i.test(ua)) return <Smartphone className="w-4 h-4" />;
  if (/Android/i.test(ua)) return <TabletSmartphone className="w-4 h-4" />;
  return <Monitor className="w-4 h-4" />;
}

function isFaceBiometric(name: string) {
  return /وجه|face/i.test(name);
}

function ScanningAnimation({ type, success, error }: { type: BiometricType; success?: boolean; error?: boolean }) {
  const color = error ? "red" : success ? "green" : type === "face" ? "sky" : "violet";
  const colorMap: Record<string, { ring: string; icon: string; glow: string }> = {
    violet: { ring: "border-violet-500", icon: "text-violet-400", glow: "bg-violet-500/20" },
    sky:    { ring: "border-sky-400",    icon: "text-sky-400",    glow: "bg-sky-500/20"    },
    green:  { ring: "border-green-400",  icon: "text-green-400",  glow: "bg-green-500/20"  },
    red:    { ring: "border-red-400",    icon: "text-red-400",    glow: "bg-red-500/20"    },
  };
  const c = colorMap[color];
  const Icon = error ? AlertCircle : success ? CheckCircle2 : type === "face" ? ScanFace : Fingerprint;

  return (
    <div className="relative flex items-center justify-center w-48 h-48 mx-auto">
      {!success && !error && [0, 1, 2].map(i => (
        <motion.div
          key={i}
          className={`absolute rounded-full border ${c.ring}`}
          initial={{ width: 80, height: 80, opacity: 0.7 }}
          animate={{ width: 80 + (i + 1) * 34, height: 80 + (i + 1) * 34, opacity: 0 }}
          transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.55, ease: "easeOut" }}
        />
      ))}
      {(success || error) && (
        <motion.div
          className={`absolute rounded-full border-2 ${c.ring}`}
          initial={{ width: 80, height: 80, opacity: 1 }}
          animate={{ width: 160, height: 160, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      )}
      <motion.div
        className={`relative z-10 p-6 rounded-full ${c.glow}`}
        animate={success || error ? { scale: [1, 1.15, 1] } : { scale: [1, 1.04, 1] }}
        transition={{ duration: success || error ? 0.4 : 2, repeat: success || error ? 0 : Infinity }}
      >
        <Icon className={`w-12 h-12 ${c.icon}`} />
      </motion.div>
    </div>
  );
}

function FaceScanFrame() {
  return (
    <div className="relative w-44 h-56 mx-auto">
      {[0, 1, 2, 3].map(i => {
        const top = i < 2;
        const left = i % 2 === 0;
        return (
          <div key={i} className={`absolute w-7 h-7 border-sky-400 ${top ? "top-0 border-t-2" : "bottom-0 border-b-2"} ${left ? "left-0 border-l-2" : "right-0 border-r-2"} rounded-sm`} />
        );
      })}
      <div className="absolute inset-3 rounded-full border-2 border-dashed border-sky-500/40" />
      <motion.div
        className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent rounded-full shadow-[0_0_6px_#38bdf8]"
        initial={{ top: "10%" }}
        animate={{ top: ["10%", "90%", "10%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <ScanFace className="w-12 h-12 text-sky-400/30" />
      </div>
    </div>
  );
}

function FingerSelector({ onSelect }: { onSelect: (key: string, label: string) => void }) {
  const [hand, setHand] = useState<"right" | "left">("right");
  const [hovered, setHovered] = useState<string | null>(null);
  const fingers = hand === "right" ? RIGHT_FINGERS : LEFT_FINGERS;

  return (
    <div className="space-y-5">
      <div className="flex justify-center gap-2">
        {(["right", "left"] as const).map(h => (
          <button
            key={h}
            onClick={() => setHand(h)}
            className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${hand === h ? "bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.5)]" : "bg-white/8 text-white/50 hover:bg-white/15"}`}
          >
            {h === "right" ? "اليد اليمنى" : "اليد اليسرى"}
          </button>
        ))}
      </div>

      <div className="relative flex items-end justify-center gap-2.5 pb-2">
        {fingers.map(f => (
          <button
            key={f.key}
            data-testid={`btn-finger-${f.key}`}
            onClick={() => onSelect(f.key, FINGER_FULL_LABELS[f.key])}
            onMouseEnter={() => setHovered(f.key)}
            onMouseLeave={() => setHovered(null)}
            className="relative flex flex-col items-center group cursor-pointer"
          >
            <motion.div
              className="relative w-11 rounded-t-[20px] rounded-b-sm overflow-hidden"
              style={{ height: f.height }}
              whileHover={{ scaleY: 1.06, scaleX: 1.04 }}
              animate={{
                background: hovered === f.key
                  ? "linear-gradient(180deg, #7c3aed 0%, #4c1d95 100%)"
                  : "linear-gradient(180deg, #374151 0%, #1f2937 100%)",
                boxShadow: hovered === f.key
                  ? "0 0 16px 2px rgba(124,58,237,0.5)"
                  : "none",
              }}
              transition={{ duration: 0.18 }}
            >
              <div className="mt-2.5 flex flex-col items-center gap-[3px] px-1.5">
                {[0, 1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    className="h-[1.5px] rounded-full"
                    style={{ width: `${72 - i * 12}%` }}
                    animate={{ backgroundColor: hovered === f.key ? "rgba(196,181,253,0.6)" : "rgba(107,114,128,0.4)" }}
                    transition={{ duration: 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
            <p className={`mt-1.5 text-[10px] font-medium transition-colors leading-tight ${hovered === f.key ? "text-violet-300" : "text-gray-500"}`}>
              {f.label}
            </p>
          </button>
        ))}
        <div className="absolute bottom-5 w-[calc(5*2.75rem+4*0.625rem)] h-9 bg-gray-800/70 rounded-b-xl border-x border-b border-gray-700/50" style={{ zIndex: -1 }} />
      </div>

      <p className="text-center text-xs text-white/35">اضغط على الإصبع الذي تريد تسجيله</p>
    </div>
  );
}

function SetupDialog({ open, onClose, onFaceSetup }: { open: boolean; onClose: () => void; onFaceSetup: () => void }) {
  const { toast } = useToast();
  const [step, setStep] = useState<SetupStep>("choose_type");
  const [biometricType, setBiometricType] = useState<BiometricType>("fingerprint");
  const [scanLabel, setScanLabel] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleClose = () => {
    onClose();
    setTimeout(() => setStep("choose_type"), 300);
  };

  const startRegistration = async (label: string) => {
    setScanLabel(label);
    setStep("scanning");
    try {
      await registerBiometric(label);
      setStep("success");
      setTimeout(() => {
        handleClose();
        toast({ title: "تم تسجيل السمة الحيوية", description: `تم حفظ "${label}" بنجاح` });
      }, 2200);
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("cancel") || msg.includes("NotAllowed") || msg.includes("AbortError")) {
        handleClose();
        toast({ title: "تم الإلغاء", description: "لم يتم تسجيل السمة الحيوية" });
      } else {
        setErrorMsg(msg);
        setStep("error");
      }
    }
  };

  const stepContent: Partial<Record<SetupStep, { title: string; subtitle?: string }>> = {
    choose_type:   { title: "اختر نوع السمة الحيوية", subtitle: "اختر طريقة التعرف المناسبة لجهازك" },
    choose_finger: { title: "اختر الإصبع", subtitle: "حدد الإصبع الذي ستستخدمه لتسجيل الدخول" },
    face_prep:     { title: "بصمة الوجه", subtitle: "تأكد من إضاءة جيدة وانظر مباشرة للكاميرا" },
    scanning:      { title: "جاري المسح...", subtitle: scanLabel ? `تسجيل ${scanLabel}` : "اتبع تعليمات جهازك" },
    success:       { title: "تم التسجيل!", subtitle: "يمكنك الآن تسجيل الدخول بهذه السمة الحيوية" },
    error:         { title: "تعذّر التسجيل", subtitle: errorMsg || "حدث خطأ أثناء التسجيل" },
  };
  const meta = stepContent[step] || { title: "" };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-sm" dir="rtl">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-950 border border-white/10 shadow-2xl">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-sky-600/10 rounded-full blur-3xl" />
          </div>

          <div className="relative p-6 pb-7">
            <div className="flex items-start justify-between mb-5">
              <div>
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={step + "title"}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="text-lg font-bold text-white"
                  >
                    {meta.title}
                  </motion.h2>
                </AnimatePresence>
                {meta.subtitle && (
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={step + "sub"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-white/40 mt-0.5"
                    >
                      {meta.subtitle}
                    </motion.p>
                  </AnimatePresence>
                )}
              </div>
              <button onClick={handleClose} className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {step === "choose_type" && (
                <motion.div key="choose_type" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="grid grid-cols-2 gap-3">
                  {/* Fingerprint — available */}
                  <motion.button
                    key="fingerprint"
                    data-testid="btn-biometric-type-fingerprint"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setBiometricType("fingerprint"); setStep("choose_finger"); }}
                    className="relative flex flex-col items-center gap-3 p-5 rounded-xl border transition-all border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 hover:border-violet-500/60"
                  >
                    <div className="p-3 rounded-xl bg-violet-500/20 text-violet-400">
                      <Fingerprint className="w-7 h-7" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">بصمة الإصبع</p>
                      <p className="text-[10px] text-white/40 mt-0.5 leading-tight">إصبع الإبهام أو السبابة</p>
                    </div>
                    <ChevronRight className="absolute top-3 left-3 w-3.5 h-3.5 text-violet-400/50" />
                  </motion.button>

                  {/* Face ID — real camera recognition */}
                  <motion.button
                    key="face"
                    data-testid="btn-biometric-type-face"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { handleClose(); onFaceSetup(); }}
                    className="relative flex flex-col items-center gap-3 p-5 rounded-xl border transition-all border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 hover:border-sky-500/60"
                  >
                    <div className="p-3 rounded-xl bg-sky-500/20 text-sky-400">
                      <ScanFace className="w-7 h-7" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">بصمة الوجه</p>
                      <p className="text-[10px] text-white/40 mt-0.5 leading-tight">Face ID / التعرف بالوجه</p>
                    </div>
                    <ChevronRight className="absolute top-3 left-3 w-3.5 h-3.5 text-sky-400/50" />
                  </motion.button>
                </motion.div>
              )}

              {step === "choose_finger" && (
                <motion.div key="choose_finger" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }}>
                  <FingerSelector onSelect={(key, label) => startRegistration(label)} />
                  <button onClick={() => setStep("choose_type")} className="mt-4 text-xs text-white/30 hover:text-white/60 transition-colors mx-auto block">
                    رجوع
                  </button>
                </motion.div>
              )}

              {step === "face_prep" && (
                <motion.div key="face_prep" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} className="space-y-4">
                  <FaceScanFrame />

                  {/* Explanation box — clarifies the passkey prompt */}
                  <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 p-3.5 space-y-2">
                    <p className="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      ملاحظة مهمة قبل البدء
                    </p>
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      سيطلب منك الجهاز <span className="text-white/80 font-medium">حفظ مفتاح دخول (Passkey)</span> — هذا طبيعي ومطلوب. اضغط "حفظ" أو "موافق" لإتمام التسجيل. هذا ليس حفظ كلمة مرور، بل بصمة دخول آمنة.
                    </p>
                  </div>

                  <Button
                    data-testid="btn-start-face-scan"
                    className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold"
                    onClick={() => startRegistration("بصمة الوجه")}
                  >
                    <ScanFace className="w-4 h-4 ml-2" />
                    تسجيل بصمة الوجه
                  </Button>
                  <button onClick={() => setStep("choose_type")} className="text-xs text-white/30 hover:text-white/60 transition-colors mx-auto block">
                    رجوع
                  </button>
                </motion.div>
              )}

              {step === "scanning" && (
                <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-4 space-y-4 text-center">
                  <ScanningAnimation type={biometricType} />
                  <p className="text-sm text-white/60 animate-pulse">اتبع تعليمات جهازك...</p>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4 space-y-3 text-center">
                  <ScanningAnimation type={biometricType} success />
                  <p className="text-sm font-semibold text-green-400">تمّ تسجيل السمة الحيوية بنجاح</p>
                </motion.div>
              )}

              {step === "error" && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4 space-y-4 text-center">
                  <ScanningAnimation type={biometricType} error />
                  <p className="text-sm text-red-400">{errorMsg || "حدث خطأ أثناء التسجيل"}</p>
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" onClick={() => startRegistration(scanLabel)} className="bg-violet-700 hover:bg-violet-600">
                      إعادة المحاولة
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleClose} className="text-white/50">
                      إغلاق
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function QuickPinManager() {
  const { dir } = useI18n();
  const { toast } = useToast();
  const [showSetDialog, setShowSetDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: status, isLoading } = useQuery<{ hasPin: boolean; setAt: string | null }>({
    queryKey: ["/api/auth/quick-pin/status"],
    queryFn: () => getQuickPinStatus(),
  });

  const handleSet = async () => {
    if (pin.length < 4) { toast({ title: "الرمز قصير", description: "يجب أن يكون 4 أرقام على الأقل", variant: "destructive" }); return; }
    if (pin !== pinConfirm) { toast({ title: "الرمز غير متطابق", description: "تأكد من إدخال نفس الرمز مرتين", variant: "destructive" }); return; }
    setLoading(true);
    try {
      await setQuickPin(pin);
      toast({ title: "تم تفعيل الرمز السريع", description: "يمكنك الآن الدخول بالرمز من صفحة تسجيل الدخول" });
      setShowSetDialog(false);
      setPin(""); setPinConfirm("");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/quick-pin/status"] });
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      await removeQuickPin();
      toast({ title: "تم إلغاء الرمز السريع" });
      setShowRemoveDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/quick-pin/status"] });
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4" dir={dir}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 dark:bg-orange-500/15">
            <Hash className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-sm">الرمز السريع (PIN)</p>
            <p className="text-xs text-muted-foreground">دخول سريع بلا كلمة مرور للأجهزة بدون بصمة</p>
          </div>
        </div>
        {!isLoading && (
          status?.hasPin ? (
            <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950" onClick={() => setShowRemoveDialog(true)} data-testid="btn-remove-quick-pin">
              <Trash2 className="w-3.5 h-3.5 ml-1" />إلغاء الرمز
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setShowSetDialog(true)} data-testid="btn-set-quick-pin">
              <Plus className="w-3.5 h-3.5 ml-1" />تفعيل الرمز
            </Button>
          )
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="w-4 h-4 animate-spin" />جاري التحميل...
        </div>
      ) : status?.hasPin ? (
        <div className="rounded-xl border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 px-4 py-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-600">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-300">الرمز السريع مفعّل</p>
            {status.setAt && <p className="text-xs text-green-600 dark:text-green-400">مفعّل منذ: {formatDate(status.setAt)}</p>}
          </div>
          <Badge variant="secondary" className="mr-auto text-xs text-green-700 bg-green-100 dark:bg-green-900/50">
            <ShieldCheck className="w-3 h-3 ml-1" /> موثّق
          </Badge>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground space-y-1">
          <Hash className="w-8 h-8 mx-auto opacity-30 mb-2" />
          <p>لم يتم تفعيل الرمز السريع بعد</p>
          <p className="text-xs">فعّل رمزاً من 4-8 أرقام للدخول السريع</p>
        </div>
      )}

      <Dialog open={showSetDialog} onOpenChange={setShowSetDialog}>
        <DialogContent className="max-w-sm" dir={dir}>
          <div className="pt-2 space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-base">تفعيل الرمز السريع</h3>
            </div>
            <p className="text-sm text-muted-foreground">اختر رمزاً من 4 إلى 8 أرقام لتسجيل الدخول بسرعة</p>
            <div className="relative">
              <Input type={showPin ? "text" : "password"} inputMode="numeric" placeholder="الرمز (4-8 أرقام)" maxLength={8} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ""))} data-testid="input-quick-pin" className="text-center tracking-widest text-lg" />
              <button type="button" onClick={() => setShowPin(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Input type={showPin ? "text" : "password"} inputMode="numeric" placeholder="تأكيد الرمز" maxLength={8} value={pinConfirm} onChange={e => setPinConfirm(e.target.value.replace(/\D/g, ""))} onKeyDown={e => e.key === "Enter" && handleSet()} data-testid="input-quick-pin-confirm" className="text-center tracking-widest text-lg" />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleSet} disabled={loading} data-testid="btn-confirm-quick-pin">
                {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <KeyRound className="w-4 h-4 ml-2" />}
                {loading ? "جاري الحفظ..." : "تفعيل الرمز"}
              </Button>
              <Button variant="outline" onClick={() => { setShowSetDialog(false); setPin(""); setPinConfirm(""); }}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent className="max-w-sm" dir={dir}>
          <div className="pt-2 space-y-4">
            <h3 className="font-bold text-base">إلغاء الرمز السريع</h3>
            <p className="text-sm text-muted-foreground">هل أنت متأكد؟ لن تتمكن من تسجيل الدخول بالرمز بعد الإلغاء</p>
            <div className="flex gap-2">
              <Button variant="destructive" className="flex-1" onClick={handleRemove} disabled={loading} data-testid="btn-confirm-remove-pin">
                {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                {loading ? "جاري الإلغاء..." : "نعم، إلغاء الرمز"}
              </Button>
              <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>تراجع</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function BiometricManager() {
  const { dir } = useI18n();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkBiometricAvailable().then(setAvailable);
  }, []);

  const { data: credentials = [], isLoading } = useQuery<Credential[]>({
    queryKey: ["/api/auth/webauthn/credentials"],
  });

  const { data: faceStatus, refetch: refetchFace } = useQuery<{ registered: boolean; updatedAt?: string }>({
    queryKey: ["/api/auth/face-recognition/status"],
  });

  const handleDelete = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/auth/webauthn/credentials/${id}`);
      const updated = credentials.filter(c => c.id !== id);
      queryClient.setQueryData<Credential[]>(["/api/auth/webauthn/credentials"], updated);
      if (updated.length === 0) clearBiometricLocal();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/webauthn/credentials"] });
    } catch {}
  };

  const handleDeleteFace = async () => {
    try {
      await apiRequest("DELETE", "/api/auth/face-recognition/delete");
      clearFaceLocal();
      refetchFace();
      toast({ title: "تم حذف بصمة الوجه", description: "يمكنك تسجيلها مجدداً في أي وقت" });
    } catch {
      toast({ title: "تعذّر الحذف", variant: "destructive" });
    }
  };

  if (available === false) return <QuickPinManager />;

  if (available === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="w-4 h-4 animate-spin" />جاري التحقق من الجهاز...
      </div>
    );
  }

  return (
    <div className="space-y-4" dir={dir}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">السمات الحيوية</p>
            <p className="text-xs text-muted-foreground">بصمة الإصبع · بصمة الوجه · Windows Hello</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setSetupOpen(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
          data-testid="btn-add-biometric"
        >
          <Plus className="w-3.5 h-3.5" />
          إضافة سمة حيوية
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
          <Loader2 className="w-4 h-4 animate-spin" />جاري التحميل...
        </div>
      ) : credentials.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-dashed p-6 text-center space-y-2"
        >
          <div className="flex justify-center gap-3 mb-3 opacity-25">
            <Fingerprint className="w-8 h-8" />
            <ScanFace className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">لم يتم تسجيل أي سمة حيوية بعد</p>
          <p className="text-xs text-muted-foreground/70">أضف بصمة الإصبع أو الوجه لتسجيل الدخول بدون كلمة مرور</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2 gap-1.5"
            onClick={() => setSetupOpen(true)}
            data-testid="btn-add-biometric-empty"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة الآن
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {credentials.map((cred, i) => {
            const isFace = isFaceBiometric(cred.deviceName);
            return (
              <motion.div
                key={cred.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                data-testid={`card-credential-${cred.id}`}
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className={`p-2.5 rounded-xl ${isFace ? "bg-sky-500/10 text-sky-500" : "bg-violet-500/10 text-violet-500"}`}>
                  {isFace ? <ScanFace className="w-4 h-4" /> : <Fingerprint className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{cred.deviceName}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    {deviceIcon(cred.userAgent)}
                    {cred.lastUsed ? `آخر استخدام: ${formatDate(cred.lastUsed)}` : `مضاف: ${formatDate(cred.createdAt)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="secondary" className="hidden sm:flex text-xs gap-1">
                    <ShieldCheck className="w-3 h-3" /> موثّق
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => handleDelete(cred.id)}
                    data-testid={`btn-delete-credential-${cred.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Face Recognition (Camera-based, cross-device) ─────────────────────── */}
      <div className="mt-2 rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">التعرف على الوجه</p>
              <p className="text-xs text-muted-foreground">كاميرا ذكاء اصطناعي — يعمل من أي جهاز</p>
            </div>
          </div>
          {faceStatus?.registered ? (
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 text-xs gap-1">
                <CheckCircle2 className="w-3 h-3" /> مسجّل
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={handleDeleteFace}
                data-testid="btn-delete-face"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => setFaceModalOpen(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white gap-1.5"
              data-testid="btn-register-face"
            >
              <Camera className="w-3.5 h-3.5" />
              تسجيل الوجه
            </Button>
          )}
        </div>
        {faceStatus?.registered && (
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2.5">
            <span>تعمل من أي جهاز أو متصفح</span>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => setFaceModalOpen(true)}>
              <Camera className="w-3 h-3" /> تحديث البصمة
            </Button>
          </div>
        )}
      </div>

      <SetupDialog open={setupOpen} onClose={() => setSetupOpen(false)} onFaceSetup={() => setFaceModalOpen(true)} />

      <FaceRecognitionModal
        open={faceModalOpen}
        onClose={() => setFaceModalOpen(false)}
        mode="register"
        onRegistered={() => { refetchFace(); }}
      />
    </div>
  );
}
