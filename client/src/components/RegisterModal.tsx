import { useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Loader2, User, Mail, Phone, Lock, Sparkles, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin?: () => void;
}

export default function RegisterModal({ open, onOpenChange, onSwitchToLogin }: RegisterModalProps) {
  const { dir } = useI18n();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const register = useRegister();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(true);

  function close() {
    onOpenChange(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      toast({ title: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "كلمة المرور قصيرة جداً", description: "6 أحرف على الأقل", variant: "destructive" });
      return;
    }
    if (!agreed) {
      toast({ title: "يجب الموافقة على الشروط للمتابعة", variant: "destructive" });
      return;
    }

    const username = email.split("@")[0] + "_" + Math.random().toString(36).slice(2, 6);

    try {
      await register.mutateAsync({
        username,
        password,
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        role: "client",
      } as any);

      toast({
        title: "أهلاً بك في كيروكس ✓",
        description: "تم إنشاء حسابك — أكمل التحقق من البريد لتفعيل الحساب",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      close();
      // Continue to login page where OTP/verification flow lives
      setLocation("/login?verify=" + encodeURIComponent(email.trim().toLowerCase()));
    } catch (err: any) {
      toast({
        title: "تعذر إنشاء الحساب",
        description: err?.message || "حاول مرة أخرى",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={dir}
        className="max-w-md p-0 overflow-hidden border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#0a0a14]"
        data-testid="dialog-register-modal"
      >
        {/* Decorative header */}
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-violet-500/10 via-blue-500/5 to-transparent border-b border-black/[0.05] dark:border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <DialogHeader className="space-y-0">
                <DialogTitle className="text-base font-black text-black dark:text-white text-right">
                  ابدأ مع كيروكس في 30 ثانية
                </DialogTitle>
                <DialogDescription className="text-[11px] text-black/50 dark:text-white/50 mt-0.5 text-right">
                  أنشئ حسابك مجاناً — لا حاجة لبطاقة ائتمان
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3.5">
          <div>
            <Label htmlFor="reg-name" className="text-[11px] font-bold text-black/60 dark:text-white/60 mb-1.5 block">
              الاسم الكامل *
            </Label>
            <div className="relative">
              <User className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-black/30 dark:text-white/30 pointer-events-none" />
              <Input
                id="reg-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: محمد أحمد"
                className="pr-10 h-11"
                autoFocus
                data-testid="input-register-name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reg-email" className="text-[11px] font-bold text-black/60 dark:text-white/60 mb-1.5 block">
              البريد الإلكتروني *
            </Label>
            <div className="relative">
              <Mail className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-black/30 dark:text-white/30 pointer-events-none" />
              <Input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="pr-10 h-11"
                dir="ltr"
                data-testid="input-register-email"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reg-phone" className="text-[11px] font-bold text-black/60 dark:text-white/60 mb-1.5 block">
              رقم الجوال (اختياري)
            </Label>
            <div className="relative">
              <Phone className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-black/30 dark:text-white/30 pointer-events-none" />
              <Input
                id="reg-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+966 5XX XXX XXX"
                className="pr-10 h-11"
                dir="ltr"
                data-testid="input-register-phone"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reg-password" className="text-[11px] font-bold text-black/60 dark:text-white/60 mb-1.5 block">
              كلمة المرور * (6 أحرف على الأقل)
            </Label>
            <div className="relative">
              <Lock className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-black/30 dark:text-white/30 pointer-events-none" />
              <Input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10 h-11"
                dir="ltr"
                data-testid="input-register-password"
              />
            </div>
          </div>

          <label className="flex items-start gap-2 text-[11px] text-black/55 dark:text-white/55 select-none cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 accent-violet-600"
              data-testid="checkbox-register-agree"
            />
            <span>
              أوافق على شروط الاستخدام وسياسة الخصوصية لمنصة كيروكس
            </span>
          </label>

          <Button
            type="submit"
            disabled={register.isPending}
            className="w-full premium-btn h-12 rounded-xl text-sm font-black gap-2"
            data-testid="button-register-submit"
          >
            {register.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جارٍ إنشاء الحساب...
              </>
            ) : (
              <>
                إنشاء حسابي الآن
                {dir === "rtl" ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </>
            )}
          </Button>

          <div className="flex items-center gap-2 justify-center pt-1 text-[10px] text-black/40 dark:text-white/40">
            <ShieldCheck className="w-3 h-3" />
            <span>بياناتك محمية بتشفير SSL</span>
          </div>

          <div className="text-center text-[12px] text-black/55 dark:text-white/55 pt-1 border-t border-black/[0.05] dark:border-white/[0.05] mt-2">
            <span>لديك حساب بالفعل؟ </span>
            <button
              type="button"
              onClick={() => {
                close();
                if (onSwitchToLogin) onSwitchToLogin();
                else setLocation("/login");
              }}
              className="text-violet-600 dark:text-violet-400 font-bold hover:underline"
              data-testid="button-switch-to-login"
            >
              سجّل الدخول
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
