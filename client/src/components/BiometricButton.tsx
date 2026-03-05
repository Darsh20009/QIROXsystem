import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  checkBiometricAvailable,
  isBiometricRegisteredLocally,
  loginWithBiometric,
} from "@/hooks/use-biometric";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Fingerprint, Loader2 } from "lucide-react";

interface Props {
  prefillIdentifier?: string;
  onSuccess?: (user: any) => void;
  className?: string;
}

export function BiometricButton({ prefillIdentifier = "", onSuccess, className }: Props) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [registeredLocally, setRegisteredLocally] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    checkBiometricAvailable().then(ok => {
      setAvailable(ok);
      if (ok) setRegisteredLocally(isBiometricRegisteredLocally());
    });
  }, []);

  // Only show if biometric hardware is available AND a credential was previously registered on this device
  if (!available || !registeredLocally) return null;

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Use discoverable flow (no identifier needed) if no prefill; otherwise targeted flow
      const user = await loginWithBiometric(prefillIdentifier || undefined);
      toast({ title: `مرحباً ${user.fullName || user.username}`, description: "تم تسجيل الدخول بالبصمة ✅" });
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
      const msg = err.message || "";
      if (msg.toLowerCase().includes("cancel") || msg.includes("NotAllowed") || msg.includes("AbortError")) {
        toast({ title: "تم الإلغاء", description: "لم يتم التحقق من البصمة" });
      } else if (msg.includes("لم يتم التعرف") || msg.includes("تسجيل البصمة")) {
        toast({ title: "البصمة غير مسجّلة", description: "سجّل دخولك بكلمة المرور ثم أضف بصمتك من الملف الشخصي", variant: "destructive" });
      } else {
        toast({ title: "تعذّر تسجيل الدخول بالبصمة", description: msg, variant: "destructive" });
      }
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
        onClick={handleLogin}
        disabled={loading}
        data-testid="btn-biometric-login"
      >
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Fingerprint className="w-4 h-4" />
        }
        {loading ? "جاري التحقق..." : "تسجيل الدخول بالبصمة"}
      </Button>
    </div>
  );
}
