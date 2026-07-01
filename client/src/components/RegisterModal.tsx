import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import {
  Loader2, User, Mail, Lock, Sparkles, ArrowLeft, ArrowRight,
  ShieldCheck, CheckCircle2, MessageSquare, KeyRound, Clock, Phone
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CountryPhoneInput } from "@/components/CountryPhoneInput";

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin?: () => void;
}

type Step = "phone" | "otp" | "details";

export default function RegisterModal({ open, onOpenChange, onSwitchToLogin }: RegisterModalProps) {
  const { dir } = useI18n();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const register = useRegister();

  const [step, setStep] = useState<Step>("phone");

  // Step 1 — phone
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [remaining, setRemaining] = useState("");
  const [phoneToken, setPhoneToken] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");

  // Step 2 — details
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(true);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = Math.max(0, expiresAt.getTime() - Date.now());
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  // Reset on close
  function close() {
    onOpenChange(false);
    setTimeout(() => {
      setStep("phone");
      setPhone("");
      setOtp("");
      setPhoneToken("");
      setVerifiedPhone("");
      setFullName("");
      setEmail("");
      setPassword("");
    }, 300);
  }

  // ── Mutations ──────────────────────────────────────────────

  const sendOtpMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/pre-register/phone-otp-init", { phone }).then(async r => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "تعذر إرسال الرمز");
        return data;
      }),
    onSuccess: (data) => {
      setExpiresAt(new Date(data.expiresAt));
      setStep("otp");
      toast({ title: "✅ تم الإرسال", description: "سيصلك رمز التحقق عبر واتساب خلال دقائق" });
    },
    onError: (e: any) => {
      toast({ title: e.message || "حدث خطأ", variant: "destructive" });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/pre-register/phone-otp-verify", { phone, otp }).then(async r => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "الرمز غير صحيح");
        return data;
      }),
    onSuccess: (data) => {
      setPhoneToken(data.phoneToken);
      setVerifiedPhone(data.phone);
      setStep("details");
    },
    onError: (e: any) => {
      toast({ title: e.message || "الرمز غير صحيح أو منتهي الصلاحية", variant: "destructive" });
    },
  });

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      toast({ title: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "كلمة المرور قصيرة جداً", description: "6 أحرف على الأقل", variant: "destructive" });
      return;
    }
    if (!agreed) {
      toast({ title: "يجب الموافقة على الشروط للمتابعة", variant: "destructive" });
      return;
    }

    const username = email.split("@")[0] + "_" + Math.random().toString(36).slice(2, 6);

    try {
      const userData = await register.mutateAsync({
        username,
        password,
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        phone: verifiedPhone || undefined,
        phoneToken: phoneToken || undefined,
        role: "client",
      } as any);

      queryClient.setQueryData(["/api/user"], userData);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      close();
      setLocation("/verify-email?flow=register");
    } catch (err: any) {
      toast({ title: "تعذر إنشاء الحساب", description: err?.message || "حاول مرة أخرى", variant: "destructive" });
    }
  }

  // ── Step indicators ─────────────────────────────────────────
  const steps = [
    { key: "phone", label: "الجوال", n: 1 },
    { key: "otp",   label: "التحقق", n: 2 },
    { key: "details", label: "البيانات", n: 3 },
  ];
  const stepIdx = steps.findIndex(s => s.key === step);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={dir}
        className="max-w-md p-0 overflow-hidden border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#0a0a14]"
        data-testid="dialog-register-modal"
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-emerald-500/10 via-violet-500/5 to-transparent border-b border-black/[0.05] dark:border-white/[0.05]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-violet-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <DialogHeader className="space-y-0">
                <DialogTitle className="text-base font-black text-black dark:text-white text-right">
                  إنشاء حساب جديد
                </DialogTitle>
                <DialogDescription className="text-[11px] text-black/50 dark:text-white/50 mt-0.5 text-right">
                  ابدأ بتوثيق جوالك عبر واتساب
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          {/* Step bar */}
          <div className="flex items-center gap-2">
            {steps.map((s, i) => {
              const done = i < stepIdx;
              const active = i === stepIdx;
              return (
                <div key={s.key} className="flex items-center gap-1.5 flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-all
                    ${active ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/40" : done ? "bg-black dark:bg-white text-white dark:text-black" : "bg-black/[0.06] dark:bg-white/[0.06] text-black/30 dark:text-white/30"}`}>
                    {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.n}
                  </div>
                  <span className={`text-[10px] font-bold truncate ${active ? "text-black dark:text-white" : done ? "text-black/60 dark:text-white/60" : "text-black/25 dark:text-white/25"}`}>{s.label}</span>
                  {i < steps.length - 1 && (
                    <div className={`h-px flex-1 mx-1 ${done ? "bg-black/20 dark:bg-white/20" : "bg-black/[0.06] dark:bg-white/[0.06]"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <AnimatePresence mode="wait">

            {/* ── Step 1: Phone ── */}
            {step === "phone" && (
              <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <Label className="text-[11px] font-bold text-black/60 dark:text-white/60 mb-2 block">
                    رقم الجوال *
                  </Label>
                  <CountryPhoneInput value={phone} onChange={setPhone} placeholder="5XXXXXXXX" />
                </div>

                <div className="flex items-start gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl p-3">
                  <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                    سيُرسَل إليك رمز تحقق عبر واتساب لتوثيق رقم جوالك قبل إنشاء الحساب.
                  </p>
                </div>

                <Button
                  onClick={() => {
                    const cleaned = phone.replace(/\D/g, "");
                    if (cleaned.length < 10) {
                      toast({ title: "أدخل رقم جوال صحيح مع رمز الدولة", variant: "destructive" });
                      return;
                    }
                    sendOtpMutation.mutate();
                  }}
                  disabled={sendOtpMutation.isPending || phone.replace(/\D/g, "").length < 10}
                  className="w-full h-12 rounded-xl font-black gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                  data-testid="button-send-otp"
                >
                  {sendOtpMutation.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الإرسال...</>
                    : <><MessageSquare className="w-4 h-4" /> إرسال رمز واتساب</>
                  }
                </Button>

                <div className="text-center text-[12px] text-black/55 dark:text-white/55 pt-1 border-t border-black/[0.05] dark:border-white/[0.05]">
                  <span>لديك حساب؟ </span>
                  <button
                    type="button"
                    onClick={() => { close(); if (onSwitchToLogin) onSwitchToLogin(); else setLocation("/login"); }}
                    className="text-violet-600 dark:text-violet-400 font-bold hover:underline"
                    data-testid="button-switch-to-login"
                  >
                    سجّل الدخول
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: OTP ── */}
            {step === "otp" && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="text-center">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
                    <MessageSquare className="w-7 h-7 text-emerald-500" />
                  </div>
                  <p className="text-sm text-black/70 dark:text-white/70 mb-1">تم إرسال رمز التحقق إلى</p>
                  <div className="inline-flex items-center gap-2 bg-black/[0.04] dark:bg-white/[0.04] rounded-xl px-3 py-1.5 mb-1">
                    <Phone className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
                    <span className="font-mono font-bold text-black dark:text-white text-sm" dir="ltr">{phone}</span>
                  </div>
                  <p className="text-[11px] text-black/40 dark:text-white/40">عبر واتساب — ستصلك الرسالة خلال دقائق</p>
                </div>

                <div>
                  <Label className="text-[11px] font-bold text-black/60 dark:text-white/60 mb-2 block">
                    رمز التحقق (6 أرقام)
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 dark:text-white/30 pointer-events-none" />
                    <Input
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="• • • • • •"
                      className="pr-10 h-12 text-xl font-mono tracking-[0.5em] text-center"
                      type="text" inputMode="numeric" dir="ltr"
                      data-testid="input-otp"
                      onKeyDown={e => e.key === "Enter" && otp.length === 6 && verifyOtpMutation.mutate()}
                      autoFocus
                    />
                  </div>
                  {expiresAt && (
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] text-black/40 dark:text-white/40">
                      <Clock className="w-3 h-3" />
                      <span>ينتهي الرمز خلال {remaining}</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => verifyOtpMutation.mutate()}
                  disabled={otp.length !== 6 || verifyOtpMutation.isPending}
                  className="w-full h-12 rounded-xl font-black gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                  data-testid="button-confirm-otp"
                >
                  {verifyOtpMutation.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ التحقق...</>
                    : <><CheckCircle2 className="w-4 h-4" /> تأكيد الرمز</>
                  }
                </Button>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => { setStep("phone"); setOtp(""); }}
                    className="text-[12px] text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 transition-colors"
                  >
                    ← تغيير الرقم
                  </button>
                  <button
                    type="button"
                    onClick={() => sendOtpMutation.mutate()}
                    disabled={sendOtpMutation.isPending}
                    className="text-[12px] text-violet-600 dark:text-violet-400 hover:underline disabled:opacity-50"
                  >
                    إعادة الإرسال
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Details ── */}
            {step === "details" && (
              <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <form onSubmit={handleRegister} className="space-y-3.5">
                  {/* Verified phone badge */}
                  <div className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-700/40 rounded-xl px-3.5 py-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">رقم موثّق ✓</p>
                      <p className="font-mono text-sm font-bold text-emerald-800 dark:text-emerald-300 truncate" dir="ltr">{verifiedPhone}</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reg-name" className="text-[11px] font-bold text-black/60 dark:text-white/60 mb-1.5 block">
                      الاسم الكامل *
                    </Label>
                    <div className="relative">
                      <User className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-black/30 dark:text-white/30 pointer-events-none" />
                      <Input
                        id="reg-name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="مثال: محمد أحمد"
                        className="pr-10 h-11"
                        autoFocus
                        data-testid="input-register-name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reg-email" className="text-[11px] font-bold text-black/60 dark:text-white/60 mb-1.5 block">
                      البريد الإلكتروني *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-black/30 dark:text-white/30 pointer-events-none" />
                      <Input
                        id="reg-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="pr-10 h-11"
                        dir="ltr"
                        data-testid="input-register-email"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reg-password" className="text-[11px] font-bold text-black/60 dark:text-white/60 mb-1.5 block">
                      كلمة المرور * (6 أحرف على الأقل)
                    </Label>
                    <div className="relative">
                      <Lock className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-black/30 dark:text-white/30 pointer-events-none" />
                      <Input
                        id="reg-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10 h-11"
                        dir="ltr"
                        data-testid="input-register-password"
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-2 text-[11px] text-black/55 dark:text-white/55 select-none cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 accent-violet-600"
                      data-testid="checkbox-register-agree"
                    />
                    <span>أوافق على شروط الاستخدام وسياسة الخصوصية لمنصة كيروكس</span>
                  </label>

                  <Button
                    type="submit"
                    disabled={register.isPending}
                    className="w-full premium-btn h-12 rounded-xl text-sm font-black gap-2"
                    data-testid="button-register-submit"
                  >
                    {register.isPending
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ إنشاء الحساب...</>
                      : <>إنشاء حسابي الآن {dir === "rtl" ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}</>
                    }
                  </Button>

                  <div className="flex items-center gap-2 justify-center pt-1 text-[10px] text-black/40 dark:text-white/40">
                    <ShieldCheck className="w-3 h-3" />
                    <span>بياناتك محمية بتشفير SSL — جوالك موثّق ✓</span>
                  </div>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
