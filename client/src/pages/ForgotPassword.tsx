import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, KeyRound, ShieldCheck, ArrowLeft, Eye, EyeOff, CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";

type Step = "email" | "otp" | "reset" | "done";

const isDev = import.meta.env.DEV;

export default function ForgotPassword() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [emailError, setEmailError] = useState("");

  const otpCode = otp.join("");

  async function handleSendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setEmailError("");
    if (!email.trim() || !email.includes("@")) {
      setEmailError("أدخل بريداً إلكترونياً صالحاً");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "حدث خطأ");
      setStep("otp");
      setResendCount(c => c + 1);
      toast({
        title: "تم إرسال رمز التحقق",
        description: `راجع بريدك الإلكتروني${resendCount > 0 ? " — إعادة الإرسال" : ""}. قد يصل في الـ Spam.`,
      });
    } catch (err: any) {
      toast({ title: err.message || "حدث خطأ في الإرسال", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otpCode.length !== 6) return;
    setLoading(true);
    try {
      const r = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), code: otpCode }),
      });
      const d = await r.json();
      if (!r.ok || !d.valid) throw new Error(d.error || "رمز غير صحيح أو منتهي الصلاحية");
      setStep("reset");
    } catch (err: any) {
      toast({ title: err.message || "رمز غير صحيح", variant: "destructive" });
      setOtp(["", "", "", "", "", ""]);
      document.getElementById("otp-0")?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) return toast({ title: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
    if (newPassword !== confirmPassword) return toast({ title: "كلمتا المرور غير متطابقتين", variant: "destructive" });
    setLoading(true);
    try {
      const r = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), code: otpCode, newPassword }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "خطأ في التغيير");
      setStep("done");
    } catch (err: any) {
      toast({ title: err.message || "حدث خطأ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function handleOtpInput(idx: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[idx] = digit;
    setOtp(newOtp);
    if (digit && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (paste.length > 0) {
      const newOtp = paste.split("").concat(Array(6).fill("")).slice(0, 6);
      setOtp(newOtp);
      document.getElementById(`otp-${Math.min(paste.length - 1, 5)}`)?.focus();
    }
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  }

  const steps = [
    { key: "email", icon: Mail, label: "البريد" },
    { key: "otp",   icon: KeyRound, label: "التحقق" },
    { key: "reset", icon: ShieldCheck, label: "كلمة المرور" },
  ];
  const currentStepIdx = steps.findIndex(s => s.key === step);

  const pwStrength = newPassword.length === 0 ? 0 : newPassword.length < 6 ? 1 : newPassword.length < 10 ? 2 : 3;
  const pwStrengthColors = ["", "bg-red-400", "bg-yellow-400", "bg-green-500"];
  const pwStrengthLabels = ["", "ضعيفة", "متوسطة", "قوية"];

  return (
    <div className="min-h-screen flex bg-white" dir="rtl">
      {/* Decorative left panel */}
      <div className="hidden lg:flex w-[40%] bg-black flex-col justify-center items-center p-12 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="relative z-10 text-center">
          <Link href="/">
            <img src={qiroxLogoPath} alt="QIROX" className="h-9 mx-auto mb-12 brightness-[2] opacity-80 hover:opacity-100 transition cursor-pointer" />
          </Link>
          <div className="w-20 h-20 bg-white/[0.07] rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/[0.08]">
            <ShieldCheck className="w-10 h-10 text-white/60" />
          </div>
          <h2 className="text-3xl font-black text-white font-heading mb-4">
            حماية حسابك<br /><span className="text-white/35">أولويتنا</span>
          </h2>
          <p className="text-white/35 text-sm leading-relaxed max-w-xs mx-auto">
            نستخدم رمز تحقق أحادي الاستخدام (OTP) لضمان أن استعادة الحساب تتم بأمان تام
          </p>
          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              { label: "رمز سري", desc: "6 أرقام" },
              { label: "صلاحية", desc: "10 دقائق" },
              { label: "استخدام", desc: "مرة واحدة" },
            ].map(s => (
              <div key={s.label} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 text-center">
                <p className="text-white text-xs font-bold">{s.label}</p>
                <p className="text-white/35 text-[10px] mt-0.5">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/">
            <img src={qiroxLogoPath} alt="QIROX" className="h-9 mx-auto" />
          </Link>
        </div>

        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">

            {/* ── STEP: EMAIL ── */}
            {step === "email" && (
              <motion.div key="email" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <div className="mb-8">
                  <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center mb-5">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-black font-heading text-black mb-1.5">استعادة كلمة المرور</h1>
                  <p className="text-black/40 text-sm">سنرسل رمز تحقق على بريدك الإلكتروني لإعادة تعيين كلمة المرور</p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-black/50 block mb-1.5">البريد الإلكتروني</label>
                    <div className="relative">
                      <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setEmailError(""); }}
                        className={`w-full h-12 pr-10 pl-4 rounded-xl border text-sm outline-none transition-colors ${emailError ? "border-red-400 bg-red-50" : "border-black/[0.08] bg-black/[0.02] focus:border-black/25"}`}
                        dir="ltr"
                        required
                        data-testid="input-forgot-email"
                      />
                    </div>
                    {emailError && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {emailError}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full h-12 bg-black hover:bg-black/80 text-white rounded-xl font-bold text-sm" disabled={loading} data-testid="button-send-otp">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin ml-2" /> جاري الإرسال...</> : <><Mail className="w-4 h-4 ml-2" /> إرسال رمز التحقق</>}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link href="/login" className="text-xs text-black/35 hover:text-black/60 transition-colors flex items-center justify-center gap-1.5">
                    <ArrowLeft className="w-3.5 h-3.5" /> العودة لتسجيل الدخول
                  </Link>
                </div>
              </motion.div>
            )}

            {/* ── STEP: OTP ── */}
            {step === "otp" && (
              <motion.div key="otp" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <div className="mb-8">
                  <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center mb-5">
                    <KeyRound className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-black font-heading text-black mb-1.5">أدخل رمز التحقق</h1>
                  <p className="text-black/40 text-sm">
                    أرسلنا رمزاً مكوّناً من 6 أرقام إلى{" "}
                    <span className="text-black font-semibold">{email}</span>
                  </p>
                  <p className="text-black/25 text-xs mt-1">تحقق من مجلد الـ Spam إذا لم يصل خلال دقيقة</p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  {/* OTP Boxes */}
                  <div>
                    <label className="text-xs font-semibold text-black/50 block mb-3">رمز التحقق (6 أرقام)</label>
                    <div className="flex gap-2 justify-center" dir="ltr" onPaste={handleOtpPaste}>
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
                          className={`w-12 h-14 text-center text-2xl font-black border-2 rounded-2xl outline-none transition-all select-none ${
                            digit
                              ? "border-black bg-black text-white shadow-lg shadow-black/20 scale-105"
                              : "border-black/[0.10] bg-black/[0.01] text-black focus:border-black/40 focus:bg-black/[0.02]"
                          }`}
                          data-testid={`otp-digit-${i}`}
                        />
                      ))}
                    </div>
                    <p className="text-center text-[10px] text-black/25 mt-2">يمكنك لصق الرمز مباشرة</p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-black hover:bg-black/80 text-white rounded-xl font-bold text-sm"
                    disabled={loading || otpCode.length !== 6}
                    data-testid="button-verify-otp"
                  >
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin ml-2" /> جاري التحقق...</> : <><KeyRound className="w-4 h-4 ml-2" /> تأكيد الرمز</>}
                  </Button>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={loading}
                      className="w-full text-sm text-black/40 hover:text-black/70 transition-colors flex items-center justify-center gap-1.5 py-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      لم تستلم الرمز؟ إعادة إرسال
                    </button>

                    {isDev && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const r = await fetch(`/api/auth/dev-otp/${encodeURIComponent(email)}`);
                            const d = await r.json();
                            if (d.code) {
                              setOtp(d.code.split("").slice(0, 6));
                              toast({ title: `رمز التطوير: ${d.code}`, description: "تم ملء الرمز تلقائياً" });
                            } else {
                              toast({ title: "لا يوجد رمز نشط", variant: "destructive" });
                            }
                          } catch {
                            toast({ title: "خطأ في جلب الرمز", variant: "destructive" });
                          }
                        }}
                        className="w-full text-xs text-blue-500/60 hover:text-blue-600 transition-colors py-1 border border-dashed border-blue-200 rounded-lg"
                        data-testid="button-dev-fetch-otp"
                      >
                        🛠 عرض الرمز (وضع التطوير فقط)
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); }}
                    className="w-full text-xs text-black/25 hover:text-black/50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    تغيير البريد الإلكتروني
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── STEP: RESET ── */}
            {step === "reset" && (
              <motion.div key="reset" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <div className="mb-8">
                  <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center mb-5">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-black font-heading text-black mb-1.5">كلمة مرور جديدة</h1>
                  <p className="text-black/40 text-sm">اختر كلمة مرور قوية — 6 أحرف على الأقل</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-black/50 block mb-1.5">كلمة المرور الجديدة</label>
                    <div className="relative">
                      <ShieldCheck className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                      <input
                        type={showPw ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full h-12 pr-10 pl-10 border border-black/[0.08] bg-black/[0.02] rounded-xl text-sm outline-none focus:border-black/25 transition-colors"
                        required
                        minLength={6}
                        data-testid="input-new-password"
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20 hover:text-black/50 transition-colors">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {newPassword.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex gap-1">
                          {[1, 2, 3].map(level => (
                            <div key={level} className={`h-1 flex-1 rounded-full transition-all ${pwStrength >= level ? pwStrengthColors[pwStrength] : "bg-black/[0.06]"}`} />
                          ))}
                        </div>
                        <p className={`text-[10px] ${pwStrength === 1 ? "text-red-500" : pwStrength === 2 ? "text-yellow-600" : "text-green-600"}`}>
                          قوة كلمة المرور: {pwStrengthLabels[pwStrength]}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-black/50 block mb-1.5">تأكيد كلمة المرور</label>
                    <div className="relative">
                      <ShieldCheck className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                      <input
                        type={showConfirmPw ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className={`w-full h-12 pr-10 pl-10 border rounded-xl text-sm outline-none transition-colors ${
                          confirmPassword && newPassword !== confirmPassword
                            ? "border-red-400 bg-red-50 focus:border-red-400"
                            : confirmPassword && newPassword === confirmPassword
                            ? "border-green-400 bg-green-50 focus:border-green-400"
                            : "border-black/[0.08] bg-black/[0.02] focus:border-black/25"
                        }`}
                        required
                        data-testid="input-confirm-password"
                      />
                      <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20 hover:text-black/50 transition-colors">
                        {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> كلمتا المرور غير متطابقتين
                      </p>
                    )}
                    {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
                      <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> كلمتا المرور متطابقتان
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-black hover:bg-black/80 text-white rounded-xl font-bold text-sm mt-2"
                    disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
                    data-testid="button-reset-password"
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin ml-2" /> جاري الحفظ...</>
                      : <><ShieldCheck className="w-4 h-4 ml-2" /> تغيير كلمة المرور</>
                    }
                  </Button>
                </form>
              </motion.div>
            )}

            {/* ── STEP: DONE ── */}
            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="text-center">
                <div className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/25">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-black font-heading text-black mb-2">تم بنجاح!</h2>
                <p className="text-black/40 text-sm mb-8 max-w-xs mx-auto">
                  تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
                </p>
                <Link href="/login">
                  <Button className="bg-black hover:bg-black/80 text-white font-bold rounded-xl px-10 h-12" data-testid="button-go-login">
                    تسجيل الدخول
                  </Button>
                </Link>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Step indicator */}
          {step !== "done" && (
            <div className="mt-10 flex items-center justify-center gap-3">
              {steps.map((s, i) => (
                <div key={s.key} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all text-[10px] font-bold ${
                    i === currentStepIdx ? "bg-black text-white shadow-md" :
                    i < currentStepIdx ? "bg-green-500 text-white" :
                    "bg-black/[0.06] text-black/30"
                  }`}>
                    {i < currentStepIdx ? "✓" : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-8 h-px transition-all ${i < currentStepIdx ? "bg-green-400" : "bg-black/[0.08]"}`} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
