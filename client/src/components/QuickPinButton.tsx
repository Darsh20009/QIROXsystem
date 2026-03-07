import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  checkBiometricAvailable,
} from "@/hooks/use-biometric";
import {
  isQuickPinSetLocally,
  loginWithQuickPin,
} from "@/hooks/use-quick-pin";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Hash, Loader2, Eye, EyeOff } from "lucide-react";

interface Props {
  prefillIdentifier?: string;
  onSuccess?: (user: any) => void;
  className?: string;
}

export function QuickPinButton({ prefillIdentifier = "", onSuccess, className }: Props) {
  const [biometricAvailable, setBiometricAvailable] = useState<boolean | null>(null);
  const [pinSetLocally, setPinSetLocally] = useState(false);
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkBiometricAvailable().then(ok => {
      setBiometricAvailable(ok);
      if (!ok) setPinSetLocally(isQuickPinSetLocally());
    });
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  if (biometricAvailable !== false) return null;
  if (!pinSetLocally) return null;

  const handleLogin = async () => {
    const id = prefillIdentifier.trim() || "";
    if (!id) {
      toast({ title: "أدخل اسم المستخدم أو البريد أولاً", variant: "destructive" });
      setOpen(false);
      return;
    }
    if (!pin) {
      toast({ title: "أدخل الرمز السريع", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const user = await loginWithQuickPin(id, pin);
      toast({ title: `مرحباً ${user.fullName || user.username}`, description: "تم تسجيل الدخول بالرمز السريع ✅" });
      setOpen(false);
      setPin("");
      if (onSuccess) {
        onSuccess(user);
      } else {
        if (user.role === "client") {
          const returnUrl = sessionStorage.getItem("returnAfterLogin");
          if (returnUrl) { sessionStorage.removeItem("returnAfterLogin"); setLocation(returnUrl); }
          else setLocation("/dashboard");
        } else {
          setLocation("/admin");
        }
      }
    } catch (err: any) {
      toast({ title: "خطأ في الرمز", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 gap-2 border-dashed"
        onClick={() => setOpen(true)}
        data-testid="btn-quick-pin-login"
      >
        <Hash className="w-4 h-4" />
        تسجيل الدخول بالرمز السريع
      </Button>

      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setPin(""); }}>
        <DialogContent className="max-w-xs" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary" />
              الرمز السريع
            </DialogTitle>
            <DialogDescription>أدخل رمزك السريع لتسجيل الدخول</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="relative">
              <Input
                ref={inputRef}
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                placeholder="● ● ● ●"
                maxLength={8}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                data-testid="input-login-quick-pin"
                className="text-center tracking-[0.5em] text-xl pr-4"
              />
              <button
                type="button"
                onClick={() => setShowPin(v => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button className="w-full" onClick={handleLogin} disabled={loading} data-testid="btn-confirm-pin-login">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin ml-2" />جاري التحقق...</>
                : <><Hash className="w-4 h-4 ml-2" />دخول</>
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
