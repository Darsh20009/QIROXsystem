import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkBiometricAvailable, loginWithBiometric } from "@/hooks/use-biometric";
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
  const [identifier, setIdentifier] = useState(prefillIdentifier);
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    checkBiometricAvailable().then(setAvailable);
  }, []);

  useEffect(() => {
    setIdentifier(prefillIdentifier);
  }, [prefillIdentifier]);

  if (!available) return null;

  const handleLogin = async () => {
    const id = identifier.trim();
    if (!id) {
      setShowInput(true);
      return;
    }
    setLoading(true);
    try {
      const user = await loginWithBiometric(id);
      toast({ title: `مرحباً ${user.fullName || user.username}`, description: "تم تسجيل الدخول بالبصمة" });
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
      if (msg.includes("لم يتم تسجيل بصمة") || msg.includes("غير موجود")) {
        toast({ title: "لا توجد بصمة مسجّلة", description: msg, variant: "destructive" });
      } else if (msg.toLowerCase().includes("cancel") || msg.includes("NotAllowed")) {
        toast({ title: "تم الإلغاء", description: "لم يتم التحقق من البصمة" });
      } else {
        toast({ title: "تعذّر تسجيل الدخول", description: msg, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className || ""}`}>
      {showInput && !prefillIdentifier && (
        <Input
          dir="ltr"
          placeholder="البريد الإلكتروني أو اسم المستخدم"
          value={identifier}
          onChange={e => setIdentifier(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          className="text-center"
          autoFocus
          data-testid="input-biometric-identifier"
        />
      )}
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
