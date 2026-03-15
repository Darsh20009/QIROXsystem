import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Smartphone, Check, X, Loader2, Copy, KeyRound, AlertTriangle, Mail, Lock, Eye, EyeOff, RefreshCw, Zap } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";

type Status = { enabled: boolean; totp: boolean; emailOtp: boolean; passphrase: boolean };

export default function TwoFactorSetup() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [totpStep, setTotpStep] = useState<"idle" | "setup" | "verify">("idle");
  const [setupData, setSetupData] = useState<{ secret: string; otpauth_url: string } | null>(null);
  const [totpToken, setTotpToken] = useState("");

  const [emailStep, setEmailStep] = useState<"idle" | "verify">("idle");
  const [emailCode, setEmailCode] = useState("");
  const [emailTarget, setEmailTarget] = useState("");

  const [passphraseStep, setPassphraseStep] = useState<"idle" | "setup">("idle");
  const [passphrase, setPassphrase] = useState("");
  const [passphraseConfirm, setPassphraseConfirm] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);

  const [disabling, setDisabling] = useState<string | null>(null);

  const { data: status, isLoading } = useQuery<Status>({
    queryKey: ["/api/totp/status"],
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["/api/totp/status"] });

  const totpSetupMutation = useMutation({
    mutationFn: async () => { const res = await apiRequest("POST", "/api/totp/setup"); return await res.json(); },
    onSuccess: (data: any) => { setSetupData(data); setTotpStep("setup"); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const totpVerifyMutation = useMutation({
    mutationFn: async (t: string) => { const res = await apiRequest("POST", "/api/totp/verify-setup", { token: t }); return await res.json(); },
    onSuccess: () => { setTotpStep("idle"); setTotpToken(""); invalidate(); toast({ title: "تم تفعيل تطبيق المصادقة بنجاح" }); },
    onError: (e: any) => toast({ title: "الرمز غير صحيح", description: e.message, variant: "destructive" }),
  });

  const totpDisableMutation = useMutation({
    mutationFn: async () => { const res = await apiRequest("POST", "/api/totp/disable"); return await res.json(); },
    onSuccess: () => { setDisabling(null); invalidate(); toast({ title: "تم إلغاء تفعيل تطبيق المصادقة" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const emailSetupMutation = useMutation({
    mutationFn: async () => { const res = await apiRequest("POST", "/api/2fa/email-otp/setup"); return await res.json(); },
    onSuccess: (data: any) => { setEmailStep("verify"); setEmailTarget(data.email || ""); setEmailCode(""); toast({ title: "تم إرسال رمز التحقق لبريدك" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const emailVerifyMutation = useMutation({
    mutationFn: async (code: string) => { const res = await apiRequest("POST", "/api/2fa/email-otp/verify", { code }); return await res.json(); },
    onSuccess: () => { setEmailStep("idle"); setEmailCode(""); invalidate(); toast({ title: "تم تفعيل التحقق عبر البريد بنجاح" }); },
    onError: (e: any) => toast({ title: "الرمز غير صحيح", description: e.message, variant: "destructive" }),
  });

  const emailResendMutation = useMutation({
    mutationFn: async () => { const res = await apiRequest("POST", "/api/2fa/email-otp/setup"); return await res.json(); },
    onSuccess: () => { setEmailCode(""); toast({ title: "تم إعادة إرسال الرمز" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const emailDisableMutation = useMutation({
    mutationFn: async () => { const res = await apiRequest("POST", "/api/2fa/email-otp/disable"); return await res.json(); },
    onSuccess: () => { setDisabling(null); invalidate(); toast({ title: "تم إلغاء التحقق عبر البريد" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const passphraseSetupMutation = useMutation({
    mutationFn: async (p: string) => { const res = await apiRequest("POST", "/api/2fa/passphrase/setup", { passphrase: p }); return await res.json(); },
    onSuccess: () => { setPassphraseStep("idle"); setPassphrase(""); setPassphraseConfirm(""); invalidate(); toast({ title: "تم تفعيل كلمة الاسترداد" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const passphraseDisableMutation = useMutation({
    mutationFn: async () => { const res = await apiRequest("POST", "/api/2fa/passphrase/disable"); return await res.json(); },
    onSuccess: () => { setDisabling(null); invalidate(); toast({ title: "تم إلغاء كلمة الاسترداد" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" /></div>;
  }

  const anyEnabled = status?.totp || status?.emailOtp || status?.passphrase;

  const methods = [
    { id: "totp", label: "تطبيق المصادقة", desc: "Qirox Authenticator أو Google Authenticator", icon: Smartphone, enabled: status?.totp },
    { id: "email", label: "رمز عبر البريد", desc: "إرسال رمز تحقق لبريدك عند الدخول", icon: Mail, enabled: status?.emailOtp },
    { id: "passphrase", label: "كلمة الاسترداد", desc: "كلمة سرية تستخدمها كخيار بديل", icon: Lock, enabled: status?.passphrase },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-5" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-black dark:text-white flex items-center gap-2">
          <Shield className="w-6 h-6" />
          المصادقة الثنائية (2FA)
        </h1>
        <p className="text-sm text-black/50 dark:text-white/45 mt-1">حماية حسابك بخطوة تحقق إضافية عند تسجيل الدخول</p>
      </div>

      <div className={`rounded-2xl border p-4 flex items-center gap-3 ${anyEnabled ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50" : "bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.07] dark:border-white/[0.07]"}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${anyEnabled ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-black/[0.05] dark:bg-white/[0.05]"}`}>
          {anyEnabled ? <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <X className="w-5 h-5 text-black/30 dark:text-white/30" />}
        </div>
        <div>
          <p className="font-bold text-sm text-black dark:text-white">{anyEnabled ? "مفعّل" : "غير مفعّل"}</p>
          <p className="text-xs text-black/50 dark:text-white/45">
            {anyEnabled
              ? `${[status?.totp && "تطبيق المصادقة", status?.emailOtp && "البريد", status?.passphrase && "كلمة الاسترداد"].filter(Boolean).join(" · ")}`
              : "يُنصح بتفعيل طريقة واحدة على الأقل لحماية حسابك"}
          </p>
        </div>
      </div>

      {!anyEnabled && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400">فعّل طريقة واحدة على الأقل لحماية حسابك. يمكنك تفعيل أكثر من طريقة للحصول على خيارات متعددة عند تسجيل الدخول.</p>
        </div>
      )}

      {/* Qirox Authenticator shortcut when TOTP is enabled */}
      {status?.totp && (
        <Link href="/authenticator">
          <div className="bg-gradient-to-br from-black to-gray-900 rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:shadow-xl hover:shadow-black/20 transition-all group" data-testid="link-qirox-authenticator">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-white">Qirox Authenticator</p>
              <p className="text-xs text-white/40 mt-0.5">أدخل رمزك على أي جهاز جديد بدون تطبيق خارجي</p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-white/10 group-hover:bg-white/15 flex items-center justify-center transition-colors">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        </Link>
      )}

      <div className="space-y-3">
        {methods.map(m => (
          <div key={m.id} className={`rounded-2xl border p-4 transition-all ${m.enabled ? "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10" : "border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-white/[0.02]"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.enabled ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-black/[0.05] dark:bg-white/[0.05]"}`}>
                <m.icon className={`w-5 h-5 ${m.enabled ? "text-emerald-600 dark:text-emerald-400" : "text-black/40 dark:text-white/40"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-black dark:text-white">{m.label}</p>
                  {m.enabled && <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full font-bold">مفعّل</span>}
                </div>
                <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">{m.desc}</p>
              </div>
              {!m.enabled && disabling !== m.id && emailStep === "idle" && (
                <Button
                  size="sm"
                  onClick={() => {
                    if (m.id === "totp") totpSetupMutation.mutate();
                    else if (m.id === "email") emailSetupMutation.mutate();
                    else setPassphraseStep("setup");
                  }}
                  disabled={totpSetupMutation.isPending || emailSetupMutation.isPending}
                  className="shrink-0 text-xs"
                  data-testid={`button-enable-${m.id}`}
                >
                  {(m.id === "totp" && totpSetupMutation.isPending) || (m.id === "email" && emailSetupMutation.isPending) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "تفعيل"}
                </Button>
              )}
              {m.enabled && disabling !== m.id && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDisabling(m.id)}
                  className="shrink-0 text-xs text-red-600 border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-900/20"
                  data-testid={`button-disable-${m.id}`}
                >
                  إلغاء
                </Button>
              )}
            </div>

            <AnimatePresence>
              {disabling === m.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800/50 space-y-2">
                    <p className="text-xs text-red-600 dark:text-red-400 font-bold">هل أنت متأكد من إلغاء تفعيل {m.label}؟</p>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (m.id === "totp") totpDisableMutation.mutate();
                          else if (m.id === "email") emailDisableMutation.mutate();
                          else passphraseDisableMutation.mutate();
                        }}
                        disabled={totpDisableMutation.isPending || emailDisableMutation.isPending || passphraseDisableMutation.isPending}
                        data-testid={`button-confirm-disable-${m.id}`}
                      >
                        {(totpDisableMutation.isPending || emailDisableMutation.isPending || passphraseDisableMutation.isPending) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "نعم، إلغاء"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDisabling(null)}>تراجع</Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {m.id === "totp" && totpStep === "setup" && setupData && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-4 pt-4 border-t border-black/[0.07] dark:border-white/[0.07] space-y-4">
                    <div className="text-center p-4 rounded-xl bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06]">
                      <p className="text-sm font-bold text-black dark:text-white mb-3">امسح الرمز بتطبيق المصادقة</p>
                      <div className="inline-block p-3 bg-white rounded-xl border border-black/[0.06]">
                        <QRCodeSVG value={setupData.otpauth_url} size={160} />
                      </div>
                      <div className="mt-3">
                        <p className="text-xs text-black/40 dark:text-white/40 mb-2">أو أدخل المفتاح يدوياً:</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs bg-black/[0.04] dark:bg-white/[0.04] px-3 py-2 rounded-lg font-mono break-all text-black dark:text-white">{setupData.secret}</code>
                          <button onClick={() => { navigator.clipboard.writeText(setupData.secret); toast({ title: "تم النسخ" }); }} className="p-2 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05]" data-testid="button-copy-secret">
                            <Copy className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => setTotpStep("verify")} className="w-full" data-testid="button-next-verify">التالي — أدخل رمز التحقق</Button>
                  </div>
                </motion.div>
              )}

              {m.id === "totp" && totpStep === "verify" && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-4 pt-4 border-t border-black/[0.07] dark:border-white/[0.07] space-y-3">
                    <p className="text-sm text-black/60 dark:text-white/55">أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة:</p>
                    <Input
                      value={totpToken}
                      onChange={e => setTotpToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="text-center text-2xl tracking-widest font-mono"
                      maxLength={6}
                      inputMode="numeric"
                      data-testid="input-totp-token"
                    />
                    <Button
                      onClick={() => totpVerifyMutation.mutate(totpToken)}
                      disabled={totpToken.length !== 6 || totpVerifyMutation.isPending}
                      className="w-full"
                      data-testid="button-verify-totp"
                    >
                      {totpVerifyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <KeyRound className="w-4 h-4 ml-2" />}
                      تحقق وفعّل
                    </Button>
                  </div>
                </motion.div>
              )}

              {m.id === "email" && emailStep === "verify" && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-4 pt-4 border-t border-black/[0.07] dark:border-white/[0.07] space-y-3">
                    <p className="text-sm text-black/60 dark:text-white/55">
                      أرسلنا رمز تحقق مكون من 6 أرقام إلى{" "}
                      <span className="font-bold text-black dark:text-white" dir="ltr">{emailTarget}</span>
                    </p>
                    <Input
                      value={emailCode}
                      onChange={e => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="text-center text-2xl tracking-widest font-mono"
                      maxLength={6}
                      inputMode="numeric"
                      data-testid="input-email-otp-code"
                    />
                    <Button
                      onClick={() => emailVerifyMutation.mutate(emailCode)}
                      disabled={emailCode.length !== 6 || emailVerifyMutation.isPending}
                      className="w-full"
                      data-testid="button-verify-email-otp"
                    >
                      {emailVerifyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <KeyRound className="w-4 h-4 ml-2" />}
                      تحقق وفعّل
                    </Button>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => emailResendMutation.mutate()}
                        disabled={emailResendMutation.isPending}
                        className="text-xs text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 transition-colors flex items-center gap-1"
                        data-testid="button-resend-email-otp"
                      >
                        {emailResendMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        إعادة إرسال الرمز
                      </button>
                      <button
                        onClick={() => { setEmailStep("idle"); setEmailCode(""); }}
                        className="text-xs text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60 transition-colors"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {m.id === "passphrase" && passphraseStep === "setup" && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-4 pt-4 border-t border-black/[0.07] dark:border-white/[0.07] space-y-3">
                    <p className="text-sm text-black/60 dark:text-white/55">اختر كلمة استرداد سرية (6 أحرف على الأقل):</p>
                    <div className="relative">
                      <Input
                        type={showPassphrase ? "text" : "password"}
                        value={passphrase}
                        onChange={e => setPassphrase(e.target.value)}
                        placeholder="كلمة الاسترداد"
                        className="pl-10"
                        data-testid="input-passphrase"
                      />
                      <button type="button" onClick={() => setShowPassphrase(!showPassphrase)} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30">
                        {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Input
                      type={showPassphrase ? "text" : "password"}
                      value={passphraseConfirm}
                      onChange={e => setPassphraseConfirm(e.target.value)}
                      placeholder="تأكيد كلمة الاسترداد"
                      data-testid="input-passphrase-confirm"
                    />
                    {passphrase && passphraseConfirm && passphrase !== passphraseConfirm && (
                      <p className="text-xs text-red-500">الكلمتان غير متطابقتين</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => passphraseSetupMutation.mutate(passphrase)}
                        disabled={!passphrase || passphrase.length < 6 || passphrase !== passphraseConfirm || passphraseSetupMutation.isPending}
                        className="flex-1"
                        data-testid="button-save-passphrase"
                      >
                        {passphraseSetupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <KeyRound className="w-4 h-4 ml-2" />}
                        حفظ وتفعيل
                      </Button>
                      <Button variant="outline" onClick={() => { setPassphraseStep("idle"); setPassphrase(""); setPassphraseConfirm(""); }}>إلغاء</Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
