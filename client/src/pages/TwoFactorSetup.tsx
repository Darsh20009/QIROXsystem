import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Smartphone, Check, X, Loader2, Copy, RefreshCw, KeyRound, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";

export default function TwoFactorSetup() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [step, setStep] = useState<"idle" | "setup" | "verify" | "done">("idle");
  const [setupData, setSetupData] = useState<{ secret: string; otpauth_url: string } | null>(null);
  const [token, setToken] = useState("");
  const [disableConfirm, setDisableConfirm] = useState(false);

  const { data: status, isLoading } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/totp/status"],
  });

  const setupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/totp/setup");
      return await res.json();
    },
    onSuccess: (data: any) => { setSetupData(data); setStep("setup"); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const verifyMutation = useMutation({
    mutationFn: async (t: string) => {
      const res = await apiRequest("POST", "/api/totp/verify-setup", { token: t });
      return await res.json();
    },
    onSuccess: () => {
      setStep("done");
      qc.invalidateQueries({ queryKey: ["/api/totp/status"] });
      toast({ title: "تم تفعيل 2FA بنجاح!" });
    },
    onError: (e: any) => toast({ title: "الرمز غير صحيح", description: e.message, variant: "destructive" }),
  });

  const disableMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/totp/disable");
      return await res.json();
    },
    onSuccess: () => {
      setDisableConfirm(false);
      setStep("idle");
      qc.invalidateQueries({ queryKey: ["/api/totp/status"] });
      toast({ title: "تم إلغاء تفعيل 2FA" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" /></div>;
  }

  const isEnabled = status?.enabled;

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-5" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-black dark:text-white flex items-center gap-2">
          <Shield className="w-6 h-6" />
          المصادقة الثنائية (2FA)
        </h1>
        <p className="text-sm text-black/50 dark:text-white/45 mt-1">حماية حسابك بخطوة تحقق إضافية عند تسجيل الدخول</p>
      </div>

      {/* Status Card */}
      <div className={`rounded-2xl border p-4 flex items-center gap-3 ${isEnabled ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50" : "bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.07] dark:border-white/[0.07]"}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEnabled ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-black/[0.05] dark:bg-white/[0.05]"}`}>
          {isEnabled ? <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <X className="w-5 h-5 text-black/30 dark:text-white/30" />}
        </div>
        <div>
          <p className="font-bold text-sm text-black dark:text-white">{isEnabled ? "مفعّل" : "غير مفعّل"}</p>
          <p className="text-xs text-black/50 dark:text-white/45">{isEnabled ? "حسابك محمي بالمصادقة الثنائية" : "يُنصح بتفعيل 2FA لحماية حسابك"}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Idle / Not enabled */}
        {!isEnabled && step === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3 flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">تحتاج إلى تطبيق مصادقة مثل Google Authenticator أو Authy على هاتفك.</p>
            </div>
            <Button onClick={() => setupMutation.mutate()} disabled={setupMutation.isPending} className="w-full" data-testid="button-setup-2fa">
              {setupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Smartphone className="w-4 h-4 ml-2" />}
              إعداد 2FA الآن
            </Button>
          </motion.div>
        )}

        {/* Setup step — show QR */}
        {step === "setup" && setupData && (
          <motion.div key="setup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="text-center p-6 rounded-2xl bg-white dark:bg-gray-900 border border-black/[0.07] dark:border-white/[0.07]">
              <p className="text-sm font-bold text-black dark:text-white mb-4">امسح الرمز بتطبيق المصادقة</p>
              <div className="inline-block p-3 bg-white rounded-xl border border-black/[0.06]">
                <QRCodeSVG value={setupData.otpauth_url} size={180} />
              </div>
              <div className="mt-4">
                <p className="text-xs text-black/40 dark:text-white/40 mb-2">أو أدخل المفتاح يدوياً:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-black/[0.04] dark:bg-white/[0.04] px-3 py-2 rounded-lg font-mono break-all text-black dark:text-white">
                    {setupData.secret}
                  </code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(setupData.secret); toast({ title: "تم النسخ" }); }}
                    className="p-2 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                    data-testid="button-copy-secret"
                  >
                    <Copy className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
                  </button>
                </div>
              </div>
            </div>
            <Button onClick={() => setStep("verify")} className="w-full" data-testid="button-next-verify">
              التالي — أدخل رمز التحقق
            </Button>
          </motion.div>
        )}

        {/* Verify step */}
        {step === "verify" && (
          <motion.div key="verify" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <p className="text-sm text-black/60 dark:text-white/55">أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة:</p>
            <Input
              value={token}
              onChange={e => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="text-center text-2xl tracking-widest font-mono"
              maxLength={6}
              inputMode="numeric"
              data-testid="input-totp-token"
            />
            <Button
              onClick={() => verifyMutation.mutate(token)}
              disabled={token.length !== 6 || verifyMutation.isPending}
              className="w-full"
              data-testid="button-verify-totp"
            >
              {verifyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <KeyRound className="w-4 h-4 ml-2" />}
              تحقق وفعّل
            </Button>
          </motion.div>
        )}

        {/* Done */}
        {(step === "done" || isEnabled) && (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {!disableConfirm ? (
              <Button variant="outline" onClick={() => setDisableConfirm(true)} className="w-full text-red-600 border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-900/20" data-testid="button-disable-2fa">
                إلغاء تفعيل 2FA
              </Button>
            ) : (
              <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-4 space-y-3">
                <p className="text-sm font-bold text-red-700 dark:text-red-400">هل أنت متأكد من إلغاء التفعيل؟</p>
                <p className="text-xs text-red-600/80 dark:text-red-400/70">سيصبح حسابك أقل أماناً.</p>
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" onClick={() => disableMutation.mutate()} disabled={disableMutation.isPending} data-testid="button-confirm-disable-2fa">
                    {disableMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "نعم، إلغاء"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDisableConfirm(false)}>إلغاء</Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
