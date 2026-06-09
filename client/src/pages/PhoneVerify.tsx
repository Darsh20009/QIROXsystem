import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2, Loader2, ShieldCheck,
  Clock, Info, Star, MessageSquare, KeyRound
} from "lucide-react";
import { CountryPhoneInput } from "@/components/CountryPhoneInput";

type Method = "whatsapp";
type Stage = "enter-phone" | "otp-input" | "done";

export default function PhoneVerify() {
  const { data: user } = useUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { lang, dir } = useI18n();
  const L = lang === "ar";

  const isRegisterFlow = new URLSearchParams(window.location.search).get("flow") === "register";
  const nextAfterVerify = isRegisterFlow ? "/onboarding" : "/dashboard";

  const [stage, setStage] = useState<Stage>("enter-phone");
  const [method] = useState<Method>("whatsapp");
  const [phone, setPhone] = useState((user as any)?.phone || "");
  const [otp, setOtp] = useState("");
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
      if (data.error) { toast({ title: data.error, variant: "destructive" }); return; }
      setExpiresAt(new Date(data.expiresAt));
      setStage("otp-input");
    },
    onError: (e: any) => {
      toast({ title: e?.message || "حدث خطأ", variant: "destructive" });
    },
  });

  const confirmOtpMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/phone-verify/confirm-otp", { otp }).then(r => r.json()),
    onSuccess: (data: any) => {
      if (data.error) { toast({ title: data.error, variant: "destructive" }); return; }
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/phone-verify/status"] });
      setStage("done");
    },
    onError: () => {
      toast({ title: L ? "الرمز غير صحيح أو انتهت صلاحيته" : "Invalid or expired code", variant: "destructive" });
    },
  });

  const handleStart = useCallback(() => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 10) {
      toast({ title: L ? "أدخل رقم جوال صحيح مع رمز الدولة" : "Enter a valid phone number with country code", variant: "destructive" });
      return;
    }
    initMutation.mutate();
  }, [phone, method, initMutation]);

  if ((user as any)?.phoneVerified && stage !== "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 p-4" dir={dir}>
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-black/[0.04] dark:bg-white/[0.06] rounded-full flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-10 h-10 text-black dark:text-white" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{L ? "رقمك موثّق" : "Phone Already Verified"}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">{L ? "رقم جوالك تم توثيقه مسبقاً." : "Your phone number has already been verified."}</p>
          <Button onClick={() => navigate("/dashboard")} className="rounded-2xl px-8 h-12 bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-black">
            {L ? "لوحة التحكم" : "Go to Dashboard"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex flex-col" dir={dir}>
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          {isRegisterFlow && (
            <div className="flex items-center gap-2">
              {[
                { n: 1, label: L ? "الحساب" : "Account", done: true },
                { n: 2, label: L ? "الملف" : "Profile", done: true },
                { n: 3, label: L ? "الجوال" : "Phone", done: false, active: true },
                { n: 4, label: L ? "الترحيب" : "Welcome", done: false },
              ].map((step, i) => (
                <div key={step.n} className="flex items-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all
                      ${(step as any).active ? "bg-white text-gray-900" : step.done ? "bg-black dark:bg-white text-white" : "bg-white/10 text-white/30"}`}>
                      {step.done ? "✓" : step.n}
                    </div>
                    <span className={`text-[10px] font-semibold hidden sm:block ${(step as any).active ? "text-white" : step.done ? "text-white/70" : "text-white/20"}`}>{step.label}</span>
                  </div>
                  {i < 3 && <div className={`h-px w-5 mx-1 ${step.done ? "bg-white/10" : "bg-white/10"}`} />}
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-lg leading-tight">{L ? "توثيق رقم الجوال" : "Phone Verification"}</h1>
              <p className="text-white/40 text-xs">{isRegisterFlow ? (L ? "الخطوة 3 من 4" : "Step 3 of 4") : (L ? "تحقق من هوية حسابك" : "Verify your account identity")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-lg mx-auto px-4 py-6 w-full">
        <AnimatePresence mode="wait">

          {/* ── STAGE: Enter Phone ── */}
          {stage === "enter-phone" && (
            <motion.div key="phone" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">

              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/5 p-5 shadow-sm">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                  {L ? "سيُرسَل رمز التحقق عبر واتساب أو بريدك الإلكتروني" : "OTP code sent via WhatsApp and your email"}
                </p>
                <CountryPhoneInput
                  value={phone}
                  onChange={setPhone}
                  placeholder="5XXXXXXXX"
                />
                <div className="flex items-start gap-2 mt-3 bg-black/[0.04] dark:bg-white/[0.04] rounded-2xl p-3">
                  <Info className="w-4 h-4 text-white/50 mt-0.5 shrink-0" />
                  <p className="text-xs text-white/50 leading-relaxed">
                    {L ? "سيصلك رمز التحقق عبر رسالة واتساب وبريدك الإلكتروني خلال دقائق." : "You'll receive a verification code via WhatsApp and your email within minutes."}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleStart}
                disabled={initMutation.isPending || phone.replace(/\D/g, "").length < 10}
                className="w-full h-14 rounded-2xl font-black text-base gap-2 shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                data-testid="btn-start-verify">
                {initMutation.isPending
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <><MessageSquare className="w-5 h-5" /> {L ? "طلب رمز واتساب" : "Request WhatsApp OTP"}</>
                }
              </Button>

              {isRegisterFlow && (
                <button onClick={() => navigate("/onboarding")} className="w-full text-center text-xs text-gray-400 hover:text-gray-300 py-2 transition-colors">
                  {L ? "تخطي الآن والتوثيق لاحقاً ←" : "Skip for now, verify later →"}
                </button>
              )}
            </motion.div>
          )}

          {/* ── STAGE: OTP Input (WhatsApp) ── */}
          {stage === "otp-input" && (
            <motion.div key="otp" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/5 p-6 text-center shadow-sm">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border-2 border-emerald-500/30">
                    <MessageSquare className="w-10 h-10 text-emerald-400" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-400/20 animate-ping" />
                </div>
                <h2 className="font-black text-gray-900 dark:text-white text-xl mb-1">{L ? "أدخل رمز واتساب" : "Enter WhatsApp OTP"}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                  {L ? "سيصلك رمز التحقق عبر واتساب على الرقم:" : "You'll receive a code via WhatsApp at:"}
                </p>
                <div className="inline-flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-2 mb-5">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="font-mono font-bold text-gray-700 dark:text-gray-200" dir="ltr">{phone}</span>
                </div>

                {/* OTP input */}
                <div className="space-y-3">
                  <div className="relative">
                    <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="______"
                      className="h-14 rounded-2xl pr-11 text-2xl font-mono tracking-[0.4em] text-center bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                      type="text" inputMode="numeric" dir="ltr"
                      data-testid="input-otp"
                      onKeyDown={e => e.key === "Enter" && otp.length === 6 && confirmOtpMutation.mutate()}
                      autoFocus
                    />
                  </div>
                  <Button
                    onClick={() => confirmOtpMutation.mutate()}
                    disabled={otp.length !== 6 || confirmOtpMutation.isPending}
                    className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base gap-2"
                    data-testid="btn-confirm-otp">
                    {confirmOtpMutation.isPending
                      ? <Loader2 className="w-5 h-5 animate-spin" />
                      : <><CheckCircle2 className="w-5 h-5" /> {L ? "تأكيد الرمز" : "Confirm Code"}</>
                    }
                  </Button>
                </div>

                {expiresAt && (
                  <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{L ? `ينتهي الرمز خلال ${remaining}` : `Code expires in ${remaining}`}</span>
                  </div>
                )}
              </div>

              <Button variant="outline" onClick={() => { setStage("enter-phone"); setOtp(""); }}
                className="w-full h-11 rounded-2xl text-sm border-white/10 text-white/60 bg-transparent gap-2">
                {L ? "تغيير الرقم أو الطريقة" : "Change Number or Method"}
              </Button>
            </motion.div>
          )}

          {/* ── STAGE: Done ── */}
          {stage === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 18 }} className="text-center">
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/5 p-8 shadow-sm space-y-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1, stiffness: 250 }}
                  className="w-24 h-24 bg-black/[0.04] dark:bg-white/[0.06] rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-12 h-12 text-black dark:text-white" />
                </motion.div>
                <div>
                  <h2 className="font-black text-gray-900 dark:text-white text-2xl mb-1">{L ? "تم التوثيق بنجاح! 🎉" : "Verified Successfully! 🎉"}</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{L ? "رقم جوالك موثّق الآن" : "Your phone number is now verified"}</p>
                </div>
                <div className="inline-flex items-center gap-2 bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl px-4 py-2">
                  <Phone className="w-4 h-4 text-black dark:text-white" />
                  <span className="font-mono font-bold text-black dark:text-white" dir="ltr">{phone}</span>
                </div>
                <div className="bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className="w-5 h-5 text-black/70 dark:text-white/70 fill-violet-400" />
                    ))}
                  </div>
                  <p className="text-xs text-black/70 dark:text-white/70 font-semibold">
                    {L ? "شكراً لاستخدام خدمات QIROX Studio!" : "Thank you for using QIROX Studio services!"}
                  </p>
                  <p className="text-xs text-black/70 dark:text-white/70 mt-0.5">
                    {L ? "يسعدنا خدمتك دائماً" : "We're always happy to serve you"}
                  </p>
                </div>
                <Button onClick={() => navigate(nextAfterVerify)}
                  className="w-full h-12 rounded-2xl bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-black gap-2"
                  data-testid="btn-done">
                  <CheckCircle2 className="w-4 h-4" />
                  {isRegisterFlow ? (L ? "متابعة ←" : "Continue →") : (L ? "لوحة التحكم" : "Dashboard")}
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
