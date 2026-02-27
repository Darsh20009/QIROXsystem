import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Loader2, RefreshCw, CheckCircle2, AlertCircle, Sparkles, Star, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";
import { Link } from "wouter";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState<{ name: string } | null>(null);

  // Redirect if not authenticated or already verified
  useEffect(() => {
    if (isLoading) return;
    if (!user) { setLocation("/login"); return; }
    if ((user as any).emailVerified) { setLocation("/dashboard"); }
  }, [user, isLoading]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);
    if (value && index < 5) document.getElementById(`otp-ve-${index + 1}`)?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0)
      document.getElementById(`otp-ve-${index - 1}`)?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = ["", "", "", "", "", ""];
    pasted.split("").forEach((char, idx) => { if (idx < 6) newOtp[idx] = char; });
    setOtpCode(newOtp);
    document.getElementById(`otp-ve-${Math.min(pasted.length - 1, 5)}`)?.focus();
  };

  const handleVerify = async () => {
    const code = otpCode.join("").trim();
    if (code.length !== 6) { setVerifyError("أدخل الرمز المكوّن من 6 أرقام"); return; }
    setIsVerifying(true);
    setVerifyError("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: (user as any).email, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setVerifyError(data.error || "الرمز غير صحيح أو منتهي الصلاحية، تأكد من الكود المُرسل إلى بريدك");
        return;
      }
      // Refresh user session
      const userRes = await fetch("/api/auth/user", { credentials: "include" });
      if (userRes.ok) {
        const updatedUser = await userRes.json();
        queryClient.setQueryData(["/api/auth/user"], updatedUser);
      }
      // Show welcome screen
      setVerifySuccess({ name: (user as any).fullName || (user as any).username || "" });
      setTimeout(() => setLocation("/dashboard"), 3500);
    } catch {
      setVerifyError("فشل الاتصال بالخادم، تحقق من اتصالك وحاول مجدداً");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setVerifyError("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: "تم إعادة الإرسال!", description: "تحقق من صندوق الوارد أو مجلد الإسبام" });
        setOtpCode(["", "", "", "", "", ""]);
        document.getElementById("otp-ve-0")?.focus();
      } else {
        const d = await res.json().catch(() => ({}));
        setVerifyError(d.error || "تعذّر إرسال الرمز، حاول مجدداً");
      }
    } catch {
      setVerifyError("حدث خطأ أثناء الإرسال");
    } finally {
      setIsResending(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-black/30" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white" dir="rtl">
      {/* Left decorative panel */}
      <div className="hidden lg:flex w-[42%] bg-black flex-col justify-between p-12 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="relative z-10">
          <Link href="/">
            <img src={qiroxLogoPath} alt="QIROX" className="h-9 w-auto object-contain brightness-[2] opacity-90 hover:opacity-100 transition-opacity cursor-pointer" />
          </Link>
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-white font-heading leading-tight mb-4">
            خطوة واحدة<br /><span className="text-white/40">لتفعيل حسابك</span>
          </h2>
          <p className="text-white/40 text-sm leading-relaxed max-w-xs">
            أرسلنا رمز التحقق إلى بريدك الإلكتروني. أدخله لتفعيل حسابك والبدء في استخدام المنصة.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-white/20 text-[11px]">
          <span>QIROX Studio</span><span>·</span><span>منصة رقمية متكاملة</span>
        </div>
      </div>

      {/* Right content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="lg:hidden mb-8 text-center">
          <Link href="/">
            <img src={qiroxLogoPath} alt="QIROX" className="h-9 w-auto object-contain mx-auto" />
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {verifySuccess ? (
            /* ── Welcome Screen ── */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md flex flex-col items-center text-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, duration: 0.6, type: "spring", stiffness: 200 }}
                className="relative mb-8"
              >
                <div className="w-24 h-24 rounded-3xl bg-black flex items-center justify-center shadow-2xl shadow-black/20">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-black/25"
                    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], x: Math.cos((i * 60 * Math.PI) / 180) * 55, y: Math.sin((i * 60 * Math.PI) / 180) * 55 }}
                    transition={{ delay: 0.4 + i * 0.07, duration: 0.9, ease: "easeOut" }}
                    style={{ top: "50%", left: "50%", marginTop: -4, marginLeft: -4 }}
                  />
                ))}
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }}>
                <h1 className="text-3xl font-black text-black font-heading mb-2">
                  أهلاً بك{verifySuccess.name ? `، ${verifySuccess.name.split(" ")[0]}` : ""}!
                </h1>
                <p className="text-black/40 text-sm mb-6 leading-relaxed">تم تفعيل حسابك بنجاح — لوحة تحكمك جاهزة الآن</p>
                <div className="space-y-2.5 mb-8">
                  {[
                    { icon: Star, text: "تقديم طلبك الأول ومتابعة مراحل التنفيذ" },
                    { icon: Sparkles, text: "التواصل المباشر مع فريق QIROX Studio" },
                    { icon: ArrowRight, text: "متابعة مشاريعك ونسبة الإتمام" },
                  ].map(({ icon: Icon, text }, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.55 + idx * 0.1, duration: 0.4 }}
                      className="flex items-center gap-3 bg-black/[0.03] rounded-xl px-4 py-3 text-right"
                    >
                      <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm text-black/70 font-medium">{text}</span>
                    </motion.div>
                  ))}
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="flex items-center justify-center gap-2 text-xs text-black/30">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جارٍ الانتقال للوحة التحكم...</span>
                </motion.div>
              </motion.div>
            </motion.div>
          ) : (
            /* ── OTP Form ── */
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md"
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black mb-4">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-black font-heading text-black mb-2">تأكيد البريد الإلكتروني</h1>
                <p className="text-black/40 text-sm leading-relaxed">
                  أرسلنا رمز التحقق المكوّن من 6 أرقام إلى<br />
                  <span className="text-black font-semibold" dir="ltr">{(user as any).email}</span>
                </p>
              </div>

              {/* Account locked notice */}
              <div className="bg-red-50 border border-red-200/60 rounded-xl px-4 py-3 mb-4 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 text-xs font-semibold mb-0.5">حسابك مقفل مؤقتاً</p>
                  <p className="text-red-700 text-[11px] leading-relaxed">
                    يجب تفعيل البريد الإلكتروني قبل الوصول للوحة التحكم. أدخل الرمز المُرسل إليك لإلغاء القفل.
                  </p>
                </div>
              </div>

              {/* Spam warning */}
              <div className="bg-amber-50 border border-amber-200/60 rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
                <span className="text-amber-500 text-base mt-0.5 flex-shrink-0">⚠️</span>
                <div>
                  <p className="text-amber-800 text-xs font-semibold mb-0.5">لم يصل البريد؟</p>
                  <p className="text-amber-700 text-[11px] leading-relaxed">
                    تحقق من مجلد <strong>الإسبام / Spam</strong> — أحياناً تصل الرسائل هناك. إذا لم تجده، اضغط "إعادة إرسال الرمز" أدناه.
                  </p>
                </div>
              </div>

              {/* OTP boxes */}
              <div className="flex justify-center gap-3 mb-6" dir="ltr">
                {otpCode.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-ve-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    data-testid={`otp-ve-box-${i}`}
                    className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all duration-200 ${
                      digit ? "border-black bg-black text-white" : "border-black/[0.15] bg-black/[0.02] text-black"
                    } focus:border-black focus:ring-2 focus:ring-black/10`}
                  />
                ))}
              </div>

              {verifyError && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
                  <Alert variant="destructive" className="bg-red-50 border-red-200/70 text-red-600 rounded-xl">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{verifyError}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <Button
                onClick={handleVerify}
                disabled={isVerifying || otpCode.join("").length !== 6}
                className="w-full h-12 bg-black hover:bg-black/80 text-white rounded-xl font-bold text-sm mb-4"
                data-testid="button-verify-email-page"
              >
                {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <><CheckCircle2 className="w-4 h-4 ml-2" />تأكيد وتفعيل الحساب</>
                )}
              </Button>

              <div className="text-center space-y-3">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-sm text-black/40 hover:text-black transition-colors flex items-center gap-1.5 mx-auto"
                  data-testid="button-resend-otp-page"
                >
                  {isResending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  إعادة إرسال الرمز
                </button>
                <p className="text-[11px] text-black/25">الرمز صالح لمدة 30 دقيقة</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
