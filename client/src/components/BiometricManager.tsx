import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { checkBiometricAvailable, registerBiometric, clearBiometricLocal } from "@/hooks/use-biometric";
import { getQuickPinStatus, setQuickPin, removeQuickPin } from "@/hooks/use-quick-pin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Fingerprint, Smartphone, Trash2, Plus, Loader2, ShieldCheck, Monitor, TabletSmartphone, KeyRound, Eye, EyeOff, Hash } from "lucide-react";

interface Credential {
  id: string;
  deviceName: string;
  userAgent: string;
  lastUsed?: string;
  createdAt: string;
}

function deviceIcon(userAgent: string) {
  if (/iPhone|iPad/i.test(userAgent)) return <Smartphone className="w-4 h-4" />;
  if (/Android/i.test(userAgent)) return <TabletSmartphone className="w-4 h-4" />;
  return <Monitor className="w-4 h-4" />;
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
}

function QuickPinManager() {
  const { toast } = useToast();
  const [showSetDialog, setShowSetDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: status, isLoading } = useQuery<{ hasPin: boolean; setAt: string | null }>({
    queryKey: ["/api/auth/quick-pin/status"],
    queryFn: () => getQuickPinStatus(),
  });

  const handleSet = async () => {
    if (pin.length < 4) { toast({ title: "الرمز قصير", description: "يجب أن يكون 4 أرقام على الأقل", variant: "destructive" }); return; }
    if (pin !== pinConfirm) { toast({ title: "الرمز غير متطابق", description: "تأكد من إدخال نفس الرمز مرتين", variant: "destructive" }); return; }
    setLoading(true);
    try {
      await setQuickPin(pin);
      toast({ title: "تم تفعيل الرمز السريع ✅", description: "يمكنك الآن الدخول بالرمز من صفحة تسجيل الدخول" });
      setShowSetDialog(false);
      setPin(""); setPinConfirm("");
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      await removeQuickPin();
      toast({ title: "تم إلغاء الرمز السريع" });
      setShowRemoveDialog(false);
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Hash className="w-5 h-5 text-primary" />
          <div>
            <p className="font-semibold text-sm">الرمز السريع (PIN)</p>
            <p className="text-xs text-muted-foreground">دخول سريع بلا كلمة مرور للأجهزة بدون بصمة</p>
          </div>
        </div>
        {!isLoading && (
          status?.hasPin ? (
            <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => setShowRemoveDialog(true)} data-testid="btn-remove-quick-pin">
              <Trash2 className="w-3.5 h-3.5 ml-1" />
              إلغاء الرمز
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setShowSetDialog(true)} data-testid="btn-set-quick-pin">
              <Plus className="w-3.5 h-3.5 ml-1" />
              تفعيل الرمز
            </Button>
          )
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          جاري التحميل...
        </div>
      ) : status?.hasPin ? (
        <div className="rounded-xl border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 px-4 py-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-600">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-300">الرمز السريع مفعّل</p>
            {status.setAt && (
              <p className="text-xs text-green-600 dark:text-green-400">مفعّل منذ: {formatDate(status.setAt)}</p>
            )}
          </div>
          <Badge variant="secondary" className="mr-auto text-xs text-green-700 bg-green-100 dark:bg-green-900/50">
            <ShieldCheck className="w-3 h-3 ml-1" /> موثّق
          </Badge>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground space-y-1">
          <Hash className="w-8 h-8 mx-auto opacity-30 mb-2" />
          <p>لم يتم تفعيل الرمز السريع بعد</p>
          <p className="text-xs">فعّل رمزاً من 4-8 أرقام للدخول السريع بلا كلمة مرور</p>
        </div>
      )}

      <Dialog open={showSetDialog} onOpenChange={setShowSetDialog}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="w-4 h-4" /> تفعيل الرمز السريع</DialogTitle>
            <DialogDescription>اختر رمزاً من 4 إلى 8 أرقام لتسجيل الدخول بسرعة</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="relative">
              <Input
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                placeholder="الرمز (4-8 أرقام)"
                maxLength={8}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
                data-testid="input-quick-pin"
                className="text-center tracking-widest text-lg"
              />
              <button
                type="button"
                onClick={() => setShowPin(v => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Input
              type={showPin ? "text" : "password"}
              inputMode="numeric"
              placeholder="تأكيد الرمز"
              maxLength={8}
              value={pinConfirm}
              onChange={e => setPinConfirm(e.target.value.replace(/\D/g, ""))}
              onKeyDown={e => e.key === "Enter" && handleSet()}
              data-testid="input-quick-pin-confirm"
              className="text-center tracking-widest text-lg"
            />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleSet} disabled={loading} data-testid="btn-confirm-quick-pin">
                {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <KeyRound className="w-4 h-4 ml-2" />}
                {loading ? "جاري الحفظ..." : "تفعيل الرمز"}
              </Button>
              <Button variant="outline" onClick={() => { setShowSetDialog(false); setPin(""); setPinConfirm(""); }}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>إلغاء الرمز السريع</DialogTitle>
            <DialogDescription>هل أنت متأكد؟ لن تتمكن من تسجيل الدخول بالرمز بعد الإلغاء</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-1">
            <Button variant="destructive" className="flex-1" onClick={handleRemove} disabled={loading} data-testid="btn-confirm-remove-pin">
              {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              {loading ? "جاري الإلغاء..." : "نعم، إلغاء الرمز"}
            </Button>
            <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>تراجع</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function BiometricManager() {
  const { toast } = useToast();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [registering, setRegistering] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [deviceName, setDeviceName] = useState("");

  useEffect(() => {
    checkBiometricAvailable().then(setAvailable);
  }, []);

  const { data: credentials = [], isLoading } = useQuery<Credential[]>({
    queryKey: ["/api/auth/webauthn/credentials"],
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/auth/webauthn/credentials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/webauthn/credentials"] }).then(() => {
        const remaining = queryClient.getQueryData<Credential[]>(["/api/auth/webauthn/credentials"]);
        if (!remaining || remaining.length === 0) clearBiometricLocal();
      });
      toast({ title: "تم حذف البصمة" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const handleRegister = async () => {
    setShowNameDialog(false);
    setRegistering(true);
    try {
      await registerBiometric(deviceName || undefined);
      toast({ title: "تم تسجيل البصمة", description: "يمكنك الآن تسجيل الدخول بالبصمة من هذا الجهاز" });
      setDeviceName("");
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("cancel") || msg.includes("NotAllowed")) {
        toast({ title: "تم الإلغاء", description: "لم يتم تسجيل البصمة" });
      } else {
        toast({ title: "تعذّر التسجيل", description: msg, variant: "destructive" });
      }
    } finally {
      setRegistering(false);
    }
  };

  if (available === false) {
    return <QuickPinManager />;
  }

  if (available === null) return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      جاري التحقق من الجهاز...
    </div>
  );

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Fingerprint className="w-5 h-5 text-primary" />
          <div>
            <p className="font-semibold text-sm">تسجيل الدخول بالبصمة</p>
            <p className="text-xs text-muted-foreground">بصمة الإصبع / التعرف على الوجه / Windows Hello</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowNameDialog(true)}
          disabled={registering}
          data-testid="btn-add-biometric"
        >
          {registering
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin ml-1" />جاري التسجيل...</>
            : <><Plus className="w-3.5 h-3.5 ml-1" />إضافة جهاز</>
          }
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          جاري التحميل...
        </div>
      ) : credentials.length === 0 ? (
        <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground space-y-1">
          <Fingerprint className="w-8 h-8 mx-auto opacity-30 mb-2" />
          <p>لم يتم تسجيل أي جهاز بعد</p>
          <p className="text-xs">أضف جهازك لتسجيل الدخول بسرعة بدون كلمة مرور</p>
        </div>
      ) : (
        <div className="space-y-2">
          {credentials.map(cred => (
            <div
              key={cred.id}
              data-testid={`card-credential-${cred.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {deviceIcon(cred.userAgent)}
                </div>
                <div>
                  <p className="text-sm font-medium">{cred.deviceName}</p>
                  <p className="text-xs text-muted-foreground">
                    {cred.lastUsed ? `آخر استخدام: ${formatDate(cred.lastUsed)}` : `مضاف: ${formatDate(cred.createdAt)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs hidden sm:flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> موثّق
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-red-400 hover:text-red-500"
                  onClick={() => deleteM.mutate(cred.id)}
                  disabled={deleteM.isPending}
                  data-testid={`btn-delete-credential-${cred.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة جهاز بالبصمة</DialogTitle>
            <DialogDescription>سيطلب منك الجهاز التحقق بالبصمة أو الوجه</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <Input
              placeholder="اسم الجهاز (اختياري)"
              value={deviceName}
              onChange={e => setDeviceName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleRegister()}
              data-testid="input-device-name"
            />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleRegister} data-testid="btn-confirm-biometric">
                <Fingerprint className="w-4 h-4 ml-2" />
                تسجيل البصمة
              </Button>
              <Button variant="outline" onClick={() => setShowNameDialog(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
