import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Phone, CheckCircle2, Loader2, ArrowRight,
  ShieldCheck, Clock, ExternalLink, AlertTriangle,
  PhoneCall, Info, Send, RefreshCw
} from "lucide-react";

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

type Method = "telegram" | "call";
type Stage  = "select-method" | "enter-phone" | "telegram-otp" | "call-wait" | "done";

export default function PhoneVerify() {
  const { data: user } = useUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [stage, setStage]     = useState<Stage>("select-method");
  const [method, setMethod]   = useState<Method>("telegram");
  const [phone, setPhone]     = useState((user as any)?.phone || "");
  const [otp, setOtp]         = useState("");
  const [botUsername, setBotUsername] = useState("QIROX_BOT");
  const [expiresAt, setExpiresAt]     = useState<Date | null>(null);
  const [remaining, setRemaining]     = useState("");

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

  const initMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/phone-verify/init", { phone, method }).then(r => r.json()),
    onSuccess: (data: any) => {
      if (data.alreadyVerified) { setStage("done"); return; }
      setExpiresAt(new Date(data.expiresAt));
      if (data.botUsername) setBotUsername(data.botUsername);
      if (method === "telegram") setStage("telegram-otp");
      else setStage("call-wait");
    },
    onError: (e: any) => toast({ title: e?.message || "حدث خطأ", variant: "destructive" }),
  });

  const confirmOtpMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/phone-verify/confirm-otp", { otp }).then(r => r.json()),
    onSuccess: () => {
      setStage("done");
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/phone-verify/status"] });
      toast({ title: "✅ تم توثيق رقم جوالك بنجاح!" });
    },
    onError: (e: any) => toast({ title: e?.message || "الرمز غير صحيح أو منتهي الصلاحية", variant: "destructive" }),
  });

  const handleStart = useCallback(() => {
    const cleaned = phone.replace(/\s/g, "");
    if (cleaned.length < 9) {
      toast({ title: "أدخل رقم جوال صحيح", variant: "destructive" });
      return;
    }
    initMutation.mutate();
  }, [phone, initMutation]);

  const handleResend = () => {
    setOtp("");
    initMutation.mutate();
  };

  if ((user as any)?.phoneVerified && stage !== "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white p-4" dir="rtl">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-black mb-2">رقمك موثّق</h2>
          <p className="text-black/50 text-sm mb-5">رقم جوالك {(user as any)?.phone} تم توثيقه مسبقاً.</p>
          <Button onClick={() => navigate("/dashboard")} className="rounded-2xl bg-black text-white h-11">العودة للوحة التحكم</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 pt-safe-top pb-8">
        <div className="max-w-lg mx-auto pt-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-lg">توثيق رقم الجوال</h1>
              <p className="text-white/50 text-xs">حماية حسابك وتأكيد هويتك</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <AnimatePresence mode="wait">

          {/* ── STAGE: Select Method ── */}
          {stage === "select-method" && (
            <motion.div key="select" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-800">رقم جوالك غير موثّق</p>
                  <p className="text-xs text-amber-700 mt-0.5">رقم الجوال مهم لأمان حسابك. يرجى توثيقه.</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-black/[0.06] p-5 shadow-sm">
                <h2 className="font-black text-black mb-4">اختر طريقة التوثيق</h2>
                <div className="space-y-3">
                  <button onClick={() => { setMethod("telegram"); setStage("enter-phone"); }}
                    className="w-full text-right rounded-2xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-all p-4 flex items-center gap-4"
                    data-testid="method-telegram">
                    <div className="w-12 h-12 bg-[#2CA5E0] rounded-2xl flex items-center justify-center text-white shrink-0"><TelegramIcon /></div>
                    <div className="flex-1">
                      <p className="font-bold text-black">توثيق عبر تيليجرام</p>
                      <p className="text-xs text-black/50 mt-0.5">أرسل رقمك للبوت — يصلك رمز 6 أرقام فوراً</p>
                    </div>
                    <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">أسرع</span>
                  </button>

                  <button onClick={() => { setMethod("call"); setStage("enter-phone"); }}
                    className="w-full text-right rounded-2xl border-2 border-black/[0.07] hover:border-black/20 transition-all p-4 flex items-center gap-4"
                    data-testid="method-call">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
                      <PhoneCall className="w-6 h-6 text-emerald-700" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-black">توثيق عبر الاتصال</p>
                      <p className="text-xs text-black/50 mt-0.5">سيتصل بك أحد موظفي QIROX لتأكيد رقمك</p>
                    </div>
                  </button>
                </div>
              </div>

              <button onClick={() => navigate("/dashboard")} className="w-full text-center text-xs text-black/30 hover:text-black/50 py-2 transition-colors">
                سأوثّق لاحقاً ←
              </button>
            </motion.div>
          )}

          {/* ── STAGE: Enter Phone ── */}
          {stage === "enter-phone" && (
            <motion.div key="phone" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <div className="bg-white rounded-3xl border border-black/[0.06] p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  {method === "telegram"
                    ? <div className="w-10 h-10 bg-[#2CA5E0] rounded-2xl flex items-center justify-center text-white"><TelegramIcon /></div>
                    : <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center"><PhoneCall className="w-5 h-5 text-emerald-700" /></div>
                  }
                  <div>
                    <p className="font-black text-black">{method === "telegram" ? "توثيق عبر تيليجرام" : "توثيق عبر الاتصال"}</p>
                    <p className="text-xs text-black/40">
                      {method === "telegram" ? "أرسل رقمك للبوت واستلم الرمز" : "سنتصل بك خلال دقائق"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-bold text-black/40 uppercase tracking-wider mb-1.5 block">رقم الجوال *</Label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                      <Input value={phone} onChange={e => setPhone(e.target.value)}
                        placeholder="05xxxxxxxx" className="h-12 rounded-xl pr-10 text-base"
                        type="tel" dir="ltr" data-testid="input-phone-number"
                        onKeyDown={e => e.key === "Enter" && handleStart()} />
                    </div>
                  </div>

                  {method === "telegram" && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        <div className="text-xs text-blue-700 space-y-1">
                          <p className="font-bold">كيف يعمل التوثيق؟</p>
                          <p>1. أدخل رقم جوالك ثم اضغط "التالي"</p>
                          <p>2. افتح @{botUsername} على تيليجرام</p>
                          <p>3. أرسل رقم جوالك للبوت</p>
                          <p>4. سيُرسل لك البوت رمز 6 أرقام</p>
                          <p>5. أدخل الرمز هنا لإتمام التوثيق ✅</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {method === "call" && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div className="text-xs text-emerald-700 space-y-1">
                          <p className="font-bold">خطوات التوثيق عبر الاتصال:</p>
                          <p>1. أدخل رقم جوالك واضغط "طلب الاتصال"</p>
                          <p>2. يُبلَّغ فريق QIROX فوراً</p>
                          <p>3. سيتصل بك موظف ويؤكد رقمك</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStage("select-method")} className="h-12 px-5 rounded-2xl" data-testid="btn-back">
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button onClick={handleStart} disabled={initMutation.isPending || !phone.trim()}
                  className="flex-1 h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black gap-2"
                  data-testid="btn-start-verify">
                  {initMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : method === "telegram"
                      ? <><Send className="w-4 h-4" /> التالي</>
                      : <><PhoneCall className="w-4 h-4" /> طلب الاتصال</>
                  }
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── STAGE: Telegram OTP Entry ── */}
          {stage === "telegram-otp" && (
            <motion.div key="tg-otp" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-4">

              {/* Step 1: Open Bot */}
              <div className="bg-white rounded-3xl border border-black/[0.06] p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#2CA5E0] rounded-2xl flex items-center justify-center text-white shrink-0">
                    <TelegramIcon />
                  </div>
                  <div>
                    <p className="font-black text-black">افتح تيليجرام وأرسل رقمك</p>
                    <p className="text-xs text-black/40">البوت سيُرسل لك رمز التحقق</p>
                  </div>
                </div>

                {/* Step indicators */}
                <div className="space-y-3 mb-5">
                  {[
                    { n: 1, text: `افتح @${botUsername} على تيليجرام`, done: false },
                    { n: 2, text: `أرسل رقم جوالك: ${phone}`, done: false },
                    { n: 3, text: "سيصلك رمز 6 أرقام من البوت", done: false },
                    { n: 4, text: "أدخل الرمز في الحقل أدناه", done: false },
                  ].map(s => (
                    <div key={s.n} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 shrink-0">{s.n}</div>
                      <p className="text-sm text-black/70">{s.text}</p>
                    </div>
                  ))}
                </div>

                <a href={`https://t.me/${botUsername}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#2CA5E0] hover:bg-[#2498d1] text-white font-bold h-11 rounded-2xl transition-colors mb-4"
                  data-testid="btn-open-telegram">
                  <TelegramIcon />
                  فتح @{botUsername}
                  <ExternalLink className="w-4 h-4" />
                </a>

                {/* OTP Input */}
                <div>
                  <Label className="text-xs font-bold text-black/40 uppercase tracking-wider mb-1.5 block">
                    أدخل الرمز الذي وصلك
                  </Label>
                  <Input
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="• • • • • •"
                    className="h-14 rounded-xl text-center text-2xl font-black tracking-[0.5em] border-2 focus:border-slate-900"
                    type="tel"
                    inputMode="numeric"
                    maxLength={6}
                    dir="ltr"
                    data-testid="input-otp"
                    onKeyDown={e => e.key === "Enter" && otp.length === 6 && confirmOtpMutation.mutate()}
                  />
                  {expiresAt && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-black/40">
                      <Clock className="w-3.5 h-3.5" />
                      <span>ينتهي الرمز خلال {remaining}</span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={() => confirmOtpMutation.mutate()}
                disabled={otp.length < 6 || confirmOtpMutation.isPending}
                className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black gap-2"
                data-testid="btn-confirm-otp">
                {confirmOtpMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><CheckCircle2 className="w-4 h-4" /> تأكيد الرمز</>
                }
              </Button>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStage("enter-phone")} className="flex-1 h-10 rounded-2xl text-sm">
                  تغيير الرقم
                </Button>
                <Button variant="outline" onClick={handleResend} disabled={initMutation.isPending} className="flex-1 h-10 rounded-2xl text-sm gap-1.5">
                  {initMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><RefreshCw className="w-3.5 h-3.5" /> إعادة إرسال</>}
                </Button>
              </div>

              <button onClick={() => { setMethod("call"); setStage("enter-phone"); }} className="w-full text-center text-xs text-black/30 hover:text-black/50 py-2 transition-colors">
                لا يوجد تيليجرام؟ اطلب اتصالاً بدلاً من ذلك ←
              </button>
            </motion.div>
          )}

          {/* ── STAGE: Call Wait ── */}
          {stage === "call-wait" && (
            <motion.div key="call-wait" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="bg-white rounded-3xl border border-black/[0.06] p-6 shadow-sm text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                  <PhoneCall className="w-10 h-10 text-emerald-600" />
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-ping" />
                </div>
                <h2 className="font-black text-black text-xl mb-1">في انتظار الاتصال</h2>
                <p className="text-black/50 text-sm mb-2">طلبك وصل إلى فريق QIROX</p>
                <div className="inline-flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2 mb-5">
                  <Phone className="w-4 h-4 text-black/40" />
                  <span className="font-mono font-bold text-black" dir="ltr">{phone}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-right space-y-2 mb-4">
                  <p className="text-sm font-bold text-emerald-800">ماذا يحدث الآن؟</p>
                  <div className="space-y-1.5 text-xs text-emerald-700">
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>تم إشعار فريق QIROX بطلبك</span></div>
                    <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 shrink-0" /><span>سيتصل بك موظف خلال دقائق قليلة</span></div>
                    <div className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 shrink-0" /><span>بعد التأكيد سيُحدَّث حسابك فوراً</span></div>
                  </div>
                </div>
                {expiresAt && (
                  <div className="flex items-center justify-center gap-2 text-xs text-black/40">
                    <Clock className="w-3.5 h-3.5" />
                    <span>ينتهي الطلب خلال {remaining}</span>
                  </div>
                )}
              </div>

              <Button variant="outline" onClick={() => { setMethod("telegram"); setStage("enter-phone"); }} className="w-full h-11 rounded-2xl text-sm gap-2">
                <TelegramIcon /> التوثيق عبر تيليجرام بدلاً من ذلك
              </Button>
              <button onClick={() => navigate("/dashboard")} className="w-full text-center text-xs text-black/30 hover:text-black/50 py-2 transition-colors">
                العودة للوحة التحكم ←
              </button>
            </motion.div>
          )}

          {/* ── STAGE: Done ── */}
          {stage === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }} className="space-y-4">
              <div className="bg-white rounded-3xl border border-black/[0.06] p-8 shadow-sm text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                  className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <ShieldCheck className="w-12 h-12 text-emerald-600" />
                </motion.div>
                <h2 className="font-black text-black text-2xl mb-2">🎉 تم التوثيق!</h2>
                <p className="text-black/50 text-sm mb-1">رقم جوالك موثّق بنجاح</p>
                <div className="inline-flex items-center gap-2 bg-emerald-50 rounded-xl px-4 py-2 mb-6">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span className="font-mono font-bold text-emerald-700" dir="ltr">{phone}</span>
                </div>
                <Button onClick={() => navigate("/dashboard")} className="w-full h-12 rounded-2xl bg-black hover:bg-black/80 text-white font-black gap-2" data-testid="btn-done">
                  العودة للوحة التحكم
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
