import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, KeyRound, ShieldCheck, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";

type Step = "email" | "otp" | "reset" | "done";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const otpCode = otp.join("");

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return toast({ title: "أدخل بريداً إلكترونياً صالحاً", variant: "destructive" });
    setLoading(true);
    try {
      const r = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      await r.json();
      setStep("otp");
      toast({ title: "تم إرسال رمز التحقق", description: "راجع بريدك الإلكتروني (وقد يكون في الـ spam)" });
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally { setLoading(false); }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otpCode.length !== 6) return toast({ title: "أدخل الرمز المكوّن من 6 أرقام", variant: "destructive" });
    setLoading(true);
    try {
      const r = await fetch("/api/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code: otpCode }) });
      const d = await r.json();
      if (!r.ok || !d.valid) throw new Error(d.error || "رمز خاطئ");
      setStep("reset");
    } catch (err: any) {
      toast({ title: err.message || "رمز غير صحيح أو منتهي", variant: "destructive" });
    } finally { setLoading(false); }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) return toast({ title: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
    if (newPassword !== confirmPassword) return toast({ title: "كلمتا المرور غير متطابقتين", variant: "destructive" });
    setLoading(true);
    try {
      const r = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code: otpCode, newPassword }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "خطأ");
      setStep("done");
    } catch (err: any) {
      toast({ title: err.message || "حدث خطأ", variant: "destructive" });
    } finally { setLoading(false); }
  }

  function handleOtpInput(idx: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[idx] = digit;
    setOtp(newOtp);
    if (digit && idx < 5) {
      const next = document.getElementById(`otp-${idx + 1}`);
      next?.focus();
    }
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      const prev = document.getElementById(`otp-${idx - 1}`);
      prev?.focus();
    }
  }

  const steps = [
    { key: "email", icon: Mail, label: "البريد" },
    { key: "otp", icon: KeyRound, label: "التحقق" },
    { key: "reset", icon: ShieldCheck, label: "كلمة المرور" },
  ];
  const currentStep = steps.findIndex(s => s.key === step);

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={qiroxLogoPath} alt="Qirox" className="h-10 mx-auto mb-4" />
          <h1 className="text-xl font-black text-black">استعادة كلمة المرور</h1>
          <p className="text-sm text-black/40 mt-1">سنرسل لك رمز تحقق على بريدك</p>
        </div>

        {/* Progress (only for non-done steps) */}
        {step !== "done" && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === currentStep;
              const isDone = i < currentStep;
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-black text-white' : isDone ? 'bg-green-500 text-white' : 'bg-black/[0.07] text-black/30'}`}>
                    {isDone ? <span className="text-xs">✓</span> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  {i < steps.length - 1 && <div className={`w-8 h-px transition-all ${i < currentStep ? 'bg-green-500' : 'bg-black/[0.10]'}`} />}
                </div>
              );
            })}
          </div>
        )}

        {/* Card */}
        <div className="bg-white border border-black/[0.07] rounded-2xl p-6 shadow-sm">
          <AnimatePresence mode="wait">

            {/* Step 1: Email */}
            {step === "email" && (
              <motion.form key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <p className="font-bold text-black text-sm mb-1">أدخل بريدك الإلكتروني</p>
                  <p className="text-xs text-black/40 mb-4">سيتم إرسال رمز التحقق على هذا البريد</p>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/25 pointer-events-none" />
                    <Input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="pr-10 text-sm" dir="ltr" required data-testid="input-forgot-email" />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-black text-white h-11 font-bold rounded-xl" disabled={loading} data-testid="button-send-otp">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Mail className="w-4 h-4 ml-2" />}
                  إرسال رمز التحقق
                </Button>
              </motion.form>
            )}

            {/* Step 2: OTP */}
            {step === "otp" && (
              <motion.form key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <p className="font-bold text-black text-sm mb-1">أدخل رمز التحقق</p>
                  <p className="text-xs text-black/40 mb-4">أرسلنا رمزاً مكوّناً من 6 أرقام إلى <span className="font-medium text-black">{email}</span></p>
                  <div className="flex gap-2 justify-center" dir="ltr">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpInput(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        className={`w-11 h-14 text-center text-xl font-black border rounded-xl outline-none transition-all ${digit ? 'border-black bg-black/[0.02]' : 'border-black/[0.10]'} focus:border-black focus:ring-2 focus:ring-black/10`}
                        data-testid={`otp-digit-${i}`}
                      />
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full bg-black text-white h-11 font-bold rounded-xl" disabled={loading || otpCode.length !== 6} data-testid="button-verify-otp">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <KeyRound className="w-4 h-4 ml-2" />}
                  تأكيد الرمز
                </Button>
                <button type="button" onClick={() => handleSendOtp({ preventDefault: () => {} } as any)} className="w-full text-xs text-black/40 hover:text-black/70 transition-colors" disabled={loading}>
                  لم تستلم الرمز؟ إعادة إرسال
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const r = await fetch(`/api/auth/dev-otp/${encodeURIComponent(email)}`);
                      const d = await r.json();
                      if (d.code) {
                        const newOtp = d.code.split("").slice(0, 6);
                        setOtp(newOtp);
                        toast({ title: `الرمز: ${d.code}`, description: "تم ملء الرمز تلقائياً" });
                      } else {
                        toast({ title: "لا يوجد رمز نشط — أعد الإرسال أولاً", variant: "destructive" });
                      }
                    } catch {
                      toast({ title: "تعذّر جلب الرمز", variant: "destructive" });
                    }
                  }}
                  className="w-full text-xs text-blue-500/70 hover:text-blue-600 transition-colors"
                  data-testid="button-dev-fetch-otp"
                >
                  عرض الرمز مباشرة (وضع التطوير)
                </button>
              </motion.form>
            )}

            {/* Step 3: New Password */}
            {step === "reset" && (
              <motion.form key="reset" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <p className="font-bold text-black text-sm mb-1">كلمة مرور جديدة</p>
                  <p className="text-xs text-black/40 mb-4">اختر كلمة مرور قوية من 6 أحرف فأكثر</p>
                </div>
                <div className="relative">
                  <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/25 pointer-events-none" />
                  <Input type={showPw ? "text" : "password"} placeholder="كلمة المرور الجديدة" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="pr-10 pl-10 text-sm" required minLength={6} data-testid="input-new-password" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60 transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/25 pointer-events-none" />
                  <Input type={showPw ? "text" : "password"} placeholder="تأكيد كلمة المرور" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="pr-10 text-sm" required data-testid="input-confirm-password" />
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500">كلمتا المرور غير متطابقتين</p>
                )}
                <Button type="submit" className="w-full bg-black text-white h-11 font-bold rounded-xl" disabled={loading || (!!confirmPassword && newPassword !== confirmPassword)} data-testid="button-reset-password">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <ShieldCheck className="w-4 h-4 ml-2" />}
                  تغيير كلمة المرور
                </Button>
              </motion.form>
            )}

            {/* Done */}
            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-black text-black text-lg mb-2">تم تغيير كلمة المرور! ✅</h3>
                <p className="text-sm text-black/50 mb-6">يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة</p>
                <Link href="/login">
                  <Button className="bg-black text-white font-bold rounded-xl px-8" data-testid="button-go-login">
                    تسجيل الدخول
                  </Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Back link */}
        {step === "email" && (
          <div className="text-center mt-5">
            <Link href="/login" className="text-xs text-black/40 hover:text-black/70 transition-colors flex items-center justify-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              العودة لتسجيل الدخول
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
