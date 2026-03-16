import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Phone, CheckCircle2, Loader2, ShieldCheck,
  Clock, AlertTriangle, PhoneCall, Send, RefreshCw, ArrowRight, Info
} from "lucide-react";

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

type Method = "telegram" | "call";
type Stage  = "enter-phone" | "enter-otp" | "call-wait" | "done";

const OTP_LENGTH = 6;

export default function PhoneVerify() {
  const { data: user } = useUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isRegisterFlow = new URLSearchParams(window.location.search).get("flow") === "register";
  const nextAfterVerify = isRegisterFlow ? "/onboarding" : "/dashboard";

  const [stage, setStage]   = useState<Stage>("enter-phone");
  const [method, setMethod] = useState<Method>("telegram");
  const [phone, setPhone]   = useState((user as any)?.phone || "");
  const [otp, setOtp]       = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [remaining, setRemaining] = useState("");

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

  const initMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/phone-verify/init", { phone, method }).then(r => r.json()),
    onSuccess: (data: any) => {
      if (data.alreadyVerified) {
        if (isRegisterFlow) navigate("/onboarding");
        else setStage("done");
        return;
      }
      if (data.error === "gateway_not_configured") {
        toast({ title: "الخدمة غير متاحة حالياً", description: data.message, variant: "destructive" });
        return;
      }
      if (data.error === "send_failed") {
        toast({ title: "فشل الإرسال", description: data.message, variant: "destructive" });
        return;
      }
      setExpiresAt(new Date(data.expiresAt));
      if (method === "telegram") {
        setOtp(Array(OTP_LENGTH).fill(""));
        setStage("enter-otp");
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setStage("call-wait");
      }
    },
    onError: (e: any) => {
      const msg: string = e?.message || "";
      if (msg.includes("gateway_not_configured") || msg.includes("غير مُفعّلة") || msg.includes("Telegram Gateway")) {
        toast({
          title: "تيليجرام غير متاح",
          description: "سيتم التحقق عبر اتصال هاتفي بدلاً من ذلك.",
          variant: "destructive",
        });
        setMethod("call");
        return;
      }
      toast({ title: msg || "حدث خطأ", variant: "destructive" });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/phone-verify/confirm-otp", { otp: otp.join("") }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/phone-verify/status"] });
      if (isRegisterFlow) {
        navigate("/onboarding");
      } else {
        setStage("done");
      }
    },
    onError: (e: any) => toast({ title: e?.message || "الرمز غير صحيح أو منتهي الصلاحية", variant: "destructive" }),
  });

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && otp.join("").length === OTP_LENGTH) confirmMutation.mutate();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newOtp = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((c, i) => { if (i < OTP_LENGTH) newOtp[i] = c; });
    setOtp(newOtp);
    otpRefs.current[Math.min(pasted.length - 1, OTP_LENGTH - 1)]?.focus();
  };

  const handleStart = useCallback(() => {
    const cleaned = phone.replace(/\s/g, "");
    if (cleaned.length < 9) {
      toast({ title: "أدخل رقم جوال صحيح", variant: "destructive" });
      return;
    }
    initMutation.mutate();
  }, [phone, method, initMutation]);

  const isOtpFull = otp.join("").length === OTP_LENGTH;

  if ((user as any)?.phoneVerified && stage !== "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 p-4" dir="rtl">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">رقمك موثّق</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">رقم جوالك تم توثيقه مسبقاً.</p>
          <Button onClick={() => navigate(nextAfterVerify)} className="rounded-2xl bg-gray-900 dark:bg-white dark:text-gray-900 text-white h-11">
            {isRegisterFlow ? "متابعة ←" : "لوحة التحكم"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir="rtl">

      {/* Header */}
      <div className="bg-gray-900 dark:bg-gray-950 border-b border-white/5 px-5 pb-6">
        <div className="max-w-lg mx-auto pt-10">
          {isRegisterFlow && (
            <div className="flex items-center gap-1 mb-5">
              {[
                { n: 1, label: "البيانات", done: true },
                { n: 2, label: "البريد", done: true },
                { n: 3, label: "الجوال", done: false, active: true },
                { n: 4, label: "الترحيب", done: false },
              ].map((step, i) => (
                <div key={step.n} className="flex items-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all
                      ${step.active ? "bg-white text-gray-900" : step.done ? "bg-emerald-500 text-white" : "bg-white/10 text-white/30"}`}>
                      {step.done ? "✓" : step.n}
                    </div>
                    <span className={`text-[10px] font-semibold hidden sm:block ${step.active ? "text-white" : step.done ? "text-emerald-400" : "text-white/20"}`}>{step.label}</span>
                  </div>
                  {i < 3 && <div className={`h-px w-5 mx-1 ${step.done ? "bg-emerald-400" : "bg-white/10"}`} />}
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-lg leading-tight">توثيق رقم الجوال</h1>
              <p className="text-white/40 text-xs">{isRegisterFlow ? "الخطوة 3 من 4" : "تحقق من هوية حسابك"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <AnimatePresence mode="wait">

          {/* ── STAGE: Enter Phone ── */}
          {stage === "enter-phone" && (
            <motion.div key="phone" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">

              {/* Method toggle */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/5 p-1.5 flex gap-1.5 shadow-sm">
                <button onClick={() => setMethod("telegram")}
                  className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl font-bold text-sm transition-all
                    ${method === "telegram" ? "bg-[#2CA5E0] text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
                  data-testid="method-telegram">
                  <TelegramIcon /> تيليجرام
                </button>
                <button onClick={() => setMethod("call")}
                  className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl font-bold text-sm transition-all
                    ${method === "call" ? "bg-emerald-500 text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
                  data-testid="method-call">
                  <PhoneCall className="w-4 h-4" /> اتصال
                </button>
              </div>

              {/* Phone input */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/5 p-5 shadow-sm">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                  {method === "telegram" ? "سيصلك رمز التحقق على تيليجرام" : "سيتصل بك فريق QIROX"}
                </p>
                <div className="relative">
                  <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="05xxxxxxxx"
                    className="h-14 rounded-2xl pr-11 text-xl font-mono bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600"
                    type="tel" dir="ltr" data-testid="input-phone-number"
                    onKeyDown={e => e.key === "Enter" && handleStart()}
                  />
                </div>

                {method === "telegram" && (
                  <div className="flex items-start gap-2 mt-3 bg-blue-50 dark:bg-blue-950/50 rounded-2xl p-3">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                      تأكد أن رقمك مُسجّل على تيليجرام. سيصلك رمز 6 أرقام مباشرةً في محادثة تيليجرام.
                    </p>
                  </div>
                )}
                {method === "call" && (
                  <div className="flex items-start gap-2 mt-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl p-3">
                    <Info className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                      سيتصل بك أحد موظفي QIROX على رقمك ويُؤكد توثيق الحساب.
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleStart}
                disabled={initMutation.isPending || phone.replace(/\s/g, "").length < 9}
                className="w-full h-14 rounded-2xl bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-black text-base gap-2 shadow-lg shadow-gray-900/10"
                data-testid="btn-start-verify">
                {initMutation.isPending
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : method === "telegram"
                    ? <><Send className="w-5 h-5" /> إرسال رمز التحقق</>
                    : <><PhoneCall className="w-5 h-5" /> طلب اتصال</>
                }
              </Button>

              {isRegisterFlow && (
                <button onClick={() => navigate("/onboarding")} className="w-full text-center text-xs text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 py-2 transition-colors">
                  تخطي الآن والتوثيق لاحقاً ←
                </button>
              )}
            </motion.div>
          )}

          {/* ── STAGE: OTP Entry ── */}
          {stage === "enter-otp" && (
            <motion.div key="otp" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

              {/* Status card */}
              <div className="bg-[#2CA5E0]/10 dark:bg-[#2CA5E0]/5 border border-[#2CA5E0]/20 rounded-3xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 bg-[#2CA5E0] rounded-2xl flex items-center justify-center text-white shrink-0">
                  <TelegramIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 dark:text-white text-sm">تحقق من تيليجرام</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    تم إرسال رمز 6 أرقام إلى تيليجرام المرتبط بـ
                  </p>
                  <p className="font-mono font-bold text-[#2CA5E0] text-sm mt-0.5" dir="ltr">{phone}</p>
                </div>
              </div>

              {/* OTP boxes */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/5 p-6 shadow-sm">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 text-center">أدخل الرمز الذي وصلك</p>
                <div className="flex justify-center gap-2 mb-4" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      maxLength={1}
                      type="tel"
                      inputMode="numeric"
                      dir="ltr"
                      data-testid={`otp-box-${i}`}
                      className={`w-12 h-14 text-center text-2xl font-black rounded-2xl border-2 outline-none transition-all
                        bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                        ${digit ? "border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "border-gray-200 dark:border-white/10 focus:border-gray-400 dark:focus:border-white/30"}`}
                    />
                  ))}
                </div>
                {expiresAt && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-600">
                    <Clock className="w-3.5 h-3.5" />
                    <span>ينتهي الرمز خلال {remaining}</span>
                  </div>
                )}
              </div>

              <Button
                onClick={() => confirmMutation.mutate()}
                disabled={!isOtpFull || confirmMutation.isPending}
                className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base gap-2"
                data-testid="btn-confirm-otp">
                {confirmMutation.isPending
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <><CheckCircle2 className="w-5 h-5" /> تأكيد الرمز</>
                }
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStage("enter-phone")}
                  className="flex-1 h-11 rounded-2xl text-sm border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 bg-transparent">
                  <ArrowRight className="w-4 h-4 ml-1" /> تغيير الرقم
                </Button>
                <Button variant="outline" onClick={() => initMutation.mutate()} disabled={initMutation.isPending}
                  className="flex-1 h-11 rounded-2xl text-sm border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 bg-transparent gap-1.5">
                  {initMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4" /> إعادة الإرسال</>}
                </Button>
              </div>

              {!isRegisterFlow && (
                <button onClick={() => navigate("/dashboard")} className="w-full text-center text-xs text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 py-2 transition-colors">
                  تخطي الآن ←
                </button>
              )}
            </motion.div>
          )}

          {/* ── STAGE: Call Wait ── */}
          {stage === "call-wait" && (
            <motion.div key="call" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/5 p-6 text-center shadow-sm">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                    <PhoneCall className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-400/30 animate-ping" />
                </div>
                <h2 className="font-black text-gray-900 dark:text-white text-xl mb-1">انتظر الاتصال</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">طلبك وصل إلى فريق QIROX</p>
                <div className="inline-flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-2 mb-5">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="font-mono font-bold text-gray-700 dark:text-gray-200" dir="ltr">{phone}</span>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl p-4 text-right space-y-2">
                  {[
                    "تم إشعار فريق QIROX بطلبك",
                    "سيتصل بك موظف خلال دقائق قليلة",
                    "بعد التأكيد يُحدَّث حسابك تلقائياً",
                  ].map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
                {expiresAt && (
                  <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-gray-400 dark:text-gray-600">
                    <Clock className="w-3.5 h-3.5" />
                    <span>ينتهي الطلب خلال {remaining}</span>
                  </div>
                )}
              </div>

              <Button variant="outline" onClick={() => { setMethod("telegram"); setStage("enter-phone"); }}
                className="w-full h-11 rounded-2xl text-sm border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 bg-transparent gap-2">
                <TelegramIcon /> التوثيق عبر تيليجرام بدلاً من ذلك
              </Button>
              <button onClick={() => navigate(nextAfterVerify)}
                className="w-full text-center text-xs text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 py-2 transition-colors">
                {isRegisterFlow ? "تخطي ومتابعة ←" : "العودة للوحة التحكم ←"}
              </button>
            </motion.div>
          )}

          {/* ── STAGE: Done ── */}
          {stage === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 18 }} className="text-center">
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/5 p-8 shadow-sm">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1, stiffness: 250 }}
                  className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
                  <ShieldCheck className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                </motion.div>
                <h2 className="font-black text-gray-900 dark:text-white text-2xl mb-2">تم التوثيق! 🎉</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">رقم جوالك موثّق بنجاح</p>
                <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl px-4 py-2 mb-6">
                  <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400" dir="ltr">{phone}</span>
                </div>
                <Button onClick={() => navigate(nextAfterVerify)}
                  className="w-full h-12 rounded-2xl bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-black gap-2"
                  data-testid="btn-done">
                  <CheckCircle2 className="w-4 h-4" />
                  {isRegisterFlow ? "متابعة ←" : "لوحة التحكم"}
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
