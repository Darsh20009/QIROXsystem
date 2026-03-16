import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Phone, CheckCircle2, Loader2, ShieldCheck,
  Clock, PhoneCall, Info, Star
} from "lucide-react";

type Stage = "enter-phone" | "call-wait" | "done";

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
  const [phone, setPhone] = useState((user as any)?.phone || "");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [remaining, setRemaining] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

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

  // ── Polling: check verification status every 5s while waiting for call ──
  useQuery({
    queryKey: ["/api/phone-verify/status", "poll"],
    queryFn: () => apiRequest("GET", "/api/phone-verify/status").then(r => r.json()),
    refetchInterval: stage === "call-wait" ? 5000 : false,
    enabled: stage === "call-wait",
    select: (data: any) => data,
    staleTime: 0,
  });

  // Watch verification status changes to auto-transition to "done"
  const { data: verifyStatus } = useQuery({
    queryKey: ["/api/phone-verify/status"],
    enabled: stage === "call-wait",
    refetchInterval: stage === "call-wait" ? 5000 : false,
    staleTime: 0,
  }) as { data: any };

  useEffect(() => {
    if (stage === "call-wait" && verifyStatus?.phoneVerified) {
      setStage("done");
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/phone-verify/status"] });
    }
  }, [verifyStatus, stage]);

  // ── WebSocket: listen for "phone_verified" push for instant response ──
  useEffect(() => {
    if (stage !== "call-wait" || !(user as any)?.id) return;
    const uid = String((user as any).id || (user as any)._id);
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;
    ws.onopen = () => ws.send(JSON.stringify({ type: "auth", userId: uid }));
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "phone_verified") {
          setStage("done");
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
          queryClient.invalidateQueries({ queryKey: ["/api/phone-verify/status"] });
        }
      } catch {}
    };
    ws.onerror = () => {};
    return () => { ws.close(); wsRef.current = null; };
  }, [stage, (user as any)?.id]);

  const initMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/phone-verify/init", { phone, method: "call" }).then(r => r.json()),
    onSuccess: (data: any) => {
      if (data.alreadyVerified) {
        if (isRegisterFlow) navigate("/onboarding");
        else setStage("done");
        return;
      }
      setExpiresAt(new Date(data.expiresAt));
      setStage("call-wait");
    },
    onError: (e: any) => {
      toast({ title: e?.message || "حدث خطأ", variant: "destructive" });
    },
  });

  const handleStart = useCallback(() => {
    const cleaned = phone.replace(/\s/g, "");
    if (cleaned.length < 9) {
      toast({ title: "أدخل رقم جوال صحيح", variant: "destructive" });
      return;
    }
    initMutation.mutate();
  }, [phone, initMutation]);

  if ((user as any)?.phoneVerified && stage !== "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 p-4" dir={dir}>
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-violet-950 flex flex-col" dir={dir}>
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
                  {L ? "سيتصل بك فريق QIROX للتحقق" : "QIROX team will call you to verify"}
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
                <div className="flex items-start gap-2 mt-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl p-3">
                  <Info className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                    {L ? "سيتصل بك أحد موظفي QIROX على رقمك ويُؤكد توثيق الحساب." : "A QIROX staff member will call you at your number to confirm account verification."}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleStart}
                disabled={initMutation.isPending || phone.replace(/\s/g, "").length < 9}
                className="w-full h-14 rounded-2xl bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-black text-base gap-2 shadow-lg shadow-gray-900/10"
                data-testid="btn-start-verify">
                {initMutation.isPending
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <><PhoneCall className="w-5 h-5" /> {L ? "طلب اتصال للتوثيق" : "Request Verification Call"}</>
                }
              </Button>

              {isRegisterFlow && (
                <button onClick={() => navigate("/onboarding")} className="w-full text-center text-xs text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 py-2 transition-colors">
                  {L ? "تخطي الآن والتوثيق لاحقاً ←" : "Skip for now, verify later →"}
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
                <h2 className="font-black text-gray-900 dark:text-white text-xl mb-1">{L ? "انتظر الاتصال" : "Waiting for Call"}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{L ? "طلبك وصل إلى فريق QIROX" : "Your request has been sent to the QIROX team"}</p>
                <div className="inline-flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-2 mb-5">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="font-mono font-bold text-gray-700 dark:text-gray-200" dir="ltr">{phone}</span>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl p-4 text-right space-y-2">
                  {[
                    L ? "تم إشعار فريق QIROX بطلبك" : "QIROX team has been notified",
                    L ? "سيتصل بك موظف خلال دقائق قليلة" : "A staff member will call you in a few minutes",
                    L ? "بعد التأكيد يُحدَّث حسابك تلقائياً" : "After confirmation, your account will update automatically",
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
                    <span>{L ? `ينتهي الطلب خلال ${remaining}` : `Request expires in ${remaining}`}</span>
                  </div>
                )}
              </div>

              <Button variant="outline" onClick={() => setStage("enter-phone")}
                className="w-full h-11 rounded-2xl text-sm border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 bg-transparent gap-2">
                {L ? "تغيير الرقم" : "Change Number"}
              </Button>
              <button onClick={() => navigate(nextAfterVerify)}
                className="w-full text-center text-xs text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 py-2 transition-colors">
                {isRegisterFlow ? (L ? "تخطي ومتابعة ←" : "Skip & Continue →") : (L ? "العودة للوحة التحكم ←" : "Back to Dashboard →")}
              </button>
            </motion.div>
          )}

          {/* ── STAGE: Done ── */}
          {stage === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 18 }} className="text-center">
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/5 p-8 shadow-sm space-y-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1, stiffness: 250 }}
                  className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                </motion.div>
                <div>
                  <h2 className="font-black text-gray-900 dark:text-white text-2xl mb-1">{L ? "تم التوثيق بنجاح! 🎉" : "Verified Successfully! 🎉"}</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{L ? "رقم جوالك موثّق الآن" : "Your phone number is now verified"}</p>
                </div>
                <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl px-4 py-2">
                  <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400" dir="ltr">{phone}</span>
                </div>
                {/* Service rating prompt */}
                <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-800/30 rounded-2xl p-4">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className="w-5 h-5 text-violet-400 fill-violet-400" />
                    ))}
                  </div>
                  <p className="text-xs text-violet-700 dark:text-violet-300 font-semibold">
                    {L ? "شكراً لاستخدام خدمات QIROX Studio!" : "Thank you for using QIROX Studio services!"}
                  </p>
                  <p className="text-xs text-violet-600/70 dark:text-violet-400/60 mt-0.5">
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
