import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { checkBiometricAvailable, registerBiometric, clearBiometricLocal } from "@/hooks/use-biometric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Fingerprint, Smartphone, Trash2, Plus, Loader2, ShieldCheck, Monitor, TabletSmartphone } from "lucide-react";

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

  if (available === false) return null;

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
          disabled={registering || available === null}
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
