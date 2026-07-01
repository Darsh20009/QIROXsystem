import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneInput } from "@/components/phone-input";
import { Coffee, Mail, Phone, User, ArrowRight, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Step =
  | "choice"
  | "email" | "phone" | "password"
  | "phone-only" | "name" | "phone-password";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("choice");

  // ── Email path state ─────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [emailPhone, setEmailPhone] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");

  // ── Phone+Name path state ────────────────────────────────────────
  const [phoneOnly, setPhoneOnly] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phonePassword, setPhonePassword] = useState("");
  const [phoneConfirm, setPhoneConfirm] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");

  // ── UI ───────────────────────────────────────────────────────────
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "نسيت كلمة المرور - QIROX Cafe | إعادة تعيين";
  }, []);

  // ════════════════════════════════════════════════════════════════
  // EMAIL PATH handlers
  // ════════════════════════════════════════════════════════════════
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return toast({ title: "خطأ", description: "البريد الإلكتروني غير صحيح", variant: "destructive" });
    }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/customers/check-email", { email });
      const data = await res.json();
      if (data.exists) {
        setVerifiedEmail(email);
        setStep("phone");
      } else {
        toast({ title: "خطأ", description: "البريد غير مسجل لدينا", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message || "حدث خطأ", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleEmailPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = emailPhone.trim().replace(/\s/g, "");
    if (!/^5\d{8}$/.test(clean)) {
      return toast({ title: "خطأ", description: "رقم الجوال يجب أن يبدأ بـ 5 (9 أرقام)", variant: "destructive" });
    }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/customers/verify-phone-email", { email: verifiedEmail, phone: clean });
      const data = await res.json();
      if (data.valid) {
        setStep("password");
      } else {
        toast({ title: "خطأ", description: "رقم الجوال غير مطابق للبريد", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message || "حدث خطأ", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailPassword.length < 4) return toast({ title: "خطأ", description: "كلمة المرور 4 أحرف على الأقل", variant: "destructive" });
    if (emailPassword !== emailConfirm) return toast({ title: "خطأ", description: "كلمتا المرور غير متطابقتان", variant: "destructive" });
    setLoading(true);
    const clean = emailPhone.trim().replace(/\s/g, "");
    try {
      await apiRequest("POST", "/api/customers/reset-password-direct", {
        email: verifiedEmail, phone: clean, newPassword: emailPassword,
      });
      toast({ title: "تم بنجاح!", description: "تم تغيير كلمة المرور. يمكنك تسجيل الدخول الآن" });
      setTimeout(() => navigate("/auth"), 1500);
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message || "حدث خطأ", variant: "destructive" });
    } finally { setLoading(false); }
  };

  // ════════════════════════════════════════════════════════════════
  // PHONE+NAME PATH handlers
  // ════════════════════════════════════════════════════════════════
  const handlePhoneOnlySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phoneOnly.trim().replace(/\s/g, "");
    if (!/^5\d{8}$/.test(clean)) {
      return toast({ title: "خطأ", description: "رقم الجوال يجب أن يبدأ بـ 5 (9 أرقام)", variant: "destructive" });
    }
    setVerifiedPhone(clean);
    setStep("name");
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      return toast({ title: "خطأ", description: "يرجى إدخال الاسم", variant: "destructive" });
    }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/customers/verify-phone-name", {
        phone: verifiedPhone, name: customerName.trim(),
      });
      const data = await res.json();
      if (data.valid) {
        setStep("phone-password");
        toast({ title: "تم التحقق", description: "الآن أدخل كلمة المرور الجديدة" });
      } else {
        toast({ title: "خطأ", description: "رقم الجوال أو الاسم غير صحيح", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message || "حدث خطأ", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handlePhonePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phonePassword.length < 4) return toast({ title: "خطأ", description: "كلمة المرور 4 أحرف على الأقل", variant: "destructive" });
    if (phonePassword !== phoneConfirm) return toast({ title: "خطأ", description: "كلمتا المرور غير متطابقتان", variant: "destructive" });
    setLoading(true);
    try {
      await apiRequest("POST", "/api/customers/reset-password-by-phone-name", {
        phone: verifiedPhone, name: customerName.trim(), newPassword: phonePassword,
      });
      toast({ title: "تم بنجاح!", description: "تم تغيير كلمة المرور. يمكنك تسجيل الدخول الآن" });
      setTimeout(() => navigate("/auth"), 1500);
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message || "حدث خطأ", variant: "destructive" });
    } finally { setLoading(false); }
  };

  // ════════════════════════════════════════════════════════════════
  // UI helpers
  // ════════════════════════════════════════════════════════════════
  const titles: Record<Step, string> = {
    choice: "نسيت كلمة المرور؟",
    email: "استرداد بالبريد الإلكتروني",
    phone: "تحقق من رقم الجوال",
    password: "كلمة المرور الجديدة",
    "phone-only": "استرداد برقم الجوال والاسم",
    name: "تحقق من هويتك",
    "phone-password": "كلمة المرور الجديدة",
  };

  const descs: Record<Step, string> = {
    choice: "اختر طريقة الاسترداد",
    email: "أدخل بريدك الإلكتروني المسجل",
    phone: "أدخل رقم الجوال المرتبط بالبريد",
    password: "أدخل كلمة المرور الجديدة وتأكيدها",
    "phone-only": "أدخل رقم جوالك المسجل",
    name: "أدخل الاسم المسجل في حسابك",
    "phone-password": "أدخل كلمة المرور الجديدة وتأكيدها",
  };

  const canGoBack = step !== "choice";
  const handleBack = () => {
    if (step === "email" || step === "phone-only") setStep("choice");
    else if (step === "phone") setStep("email");
    else if (step === "password") setStep("phone");
    else if (step === "name") setStep("phone-only");
    else if (step === "phone-password") setStep("name");
  };

  const SubmitButton = ({ label, testId }: { label: string; testId: string }) => (
    <Button
      type="submit"
      disabled={loading}
      className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-300"
      data-testid={testId}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          <span>جارٍ التحقق...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span>{label}</span>
          <ArrowRight className="w-5 h-5" />
        </div>
      )}
    </Button>
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, hsl(165, 15%, 97%) 0%, hsl(165, 12%, 88%) 50%, hsl(165, 15%, 97%) 100%)" }}
      dir="rtl"
    >
      <Card className="w-full max-w-md border-primary/30 bg-card backdrop-blur shadow-xl">
        <CardHeader className="space-y-3 text-center pb-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30">
              <Coffee className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">{titles[step]}</CardTitle>
          <CardDescription className="text-muted-foreground">{descs[step]}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">

          {/* ── CHOICE ─────────────────────────────────────────── */}
          {step === "choice" && (
            <div className="space-y-3">
              <button
                onClick={() => setStep("email")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group text-right"
                data-testid="button-choice-email"
              >
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">لدي بريد إلكتروني</p>
                  <p className="text-sm text-muted-foreground">استرداد عبر البريد الإلكتروني ورقم الجوال</p>
                </div>
                <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>

              <button
                onClick={() => setStep("phone-only")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group text-right"
                data-testid="button-choice-phone"
              >
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">ليس لدي بريد إلكتروني</p>
                  <p className="text-sm text-muted-foreground">استرداد عبر رقم الجوال واسم الحساب</p>
                </div>
                <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            </div>
          )}

          {/* ── EMAIL PATH ─────────────────────────────────────── */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-foreground">
                  <Mail className="w-4 h-4" /> البريد الإلكتروني
                </Label>
                <Input
                  id="email" type="email" dir="ltr"
                  placeholder="example@email.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-border focus:border-primary focus:ring-primary/30"
                  data-testid="input-email" required
                />
              </div>
              <SubmitButton label="التالي" testId="button-submit-email" />
            </form>
          )}

          {step === "phone" && (
            <form onSubmit={handleEmailPhoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailPhone" className="flex items-center gap-2 text-foreground">
                  <Phone className="w-4 h-4" /> رقم الجوال
                </Label>
                <PhoneInput
                  id="emailPhone" value={emailPhone} onChange={(v) => setEmailPhone(v)}
                  placeholder="5xxxxxxxx" data-testid="input-phone" required
                />
                <p className="text-xs text-muted-foreground">رقم الجوال المرتبط بالبريد المدخل</p>
              </div>
              <SubmitButton label="تحقق" testId="button-submit-phone" />
            </form>
          )}

          {step === "password" && (
            <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"} placeholder="أدخل كلمة المرور الجديدة"
                    value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)}
                    className="bg-secondary border-border focus:border-primary pl-10"
                    data-testid="input-new-password" required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute left-3 top-2.5 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">تأكيد كلمة المرور</Label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"} placeholder="أعد إدخال كلمة المرور"
                    value={emailConfirm} onChange={(e) => setEmailConfirm(e.target.value)}
                    className="bg-secondary border-border focus:border-primary pl-10"
                    data-testid="input-confirm-password" required
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute left-3 top-2.5 text-muted-foreground hover:text-foreground">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">كلمة المرور يجب أن تكون 4 أحرف على الأقل</p>
              </div>
              <SubmitButton label="تغيير كلمة المرور" testId="button-reset-password" />
            </form>
          )}

          {/* ── PHONE+NAME PATH ────────────────────────────────── */}
          {step === "phone-only" && (
            <form onSubmit={handlePhoneOnlySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneOnly" className="flex items-center gap-2 text-foreground">
                  <Phone className="w-4 h-4" /> رقم الجوال
                </Label>
                <PhoneInput
                  id="phoneOnly" value={phoneOnly} onChange={(v) => setPhoneOnly(v)}
                  placeholder="5xxxxxxxx" data-testid="input-phone-only" required
                />
                <p className="text-xs text-muted-foreground">رقم الجوال المسجل في حسابك</p>
              </div>
              <SubmitButton label="التالي" testId="button-submit-phone-only" />
            </form>
          )}

          {step === "name" && (
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName" className="flex items-center gap-2 text-foreground">
                  <User className="w-4 h-4" /> اسم الحساب
                </Label>
                <Input
                  id="customerName"
                  placeholder="أدخل اسمك كما هو مسجل في الحساب"
                  value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-secondary border-border focus:border-primary focus:ring-primary/30"
                  data-testid="input-name" required
                />
                <p className="text-xs text-muted-foreground">
                  الاسم الذي أدخلته عند إنشاء حسابك
                </p>
              </div>
              <SubmitButton label="تحقق من الهوية" testId="button-submit-name" />
            </form>
          )}

          {step === "phone-password" && (
            <form onSubmit={handlePhonePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"} placeholder="أدخل كلمة المرور الجديدة"
                    value={phonePassword} onChange={(e) => setPhonePassword(e.target.value)}
                    className="bg-secondary border-border focus:border-primary pl-10"
                    data-testid="input-phone-new-password" required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute left-3 top-2.5 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">تأكيد كلمة المرور</Label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"} placeholder="أعد إدخال كلمة المرور"
                    value={phoneConfirm} onChange={(e) => setPhoneConfirm(e.target.value)}
                    className="bg-secondary border-border focus:border-primary pl-10"
                    data-testid="input-phone-confirm-password" required
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute left-3 top-2.5 text-muted-foreground hover:text-foreground">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">كلمة المرور يجب أن تكون 4 أحرف على الأقل</p>
              </div>
              <SubmitButton label="تغيير كلمة المرور" testId="button-phone-reset-password" />
            </form>
          )}

          {/* ── Bottom links ────────────────────────────────────── */}
          <div className="pt-2 flex items-center justify-between">
            {canGoBack ? (
              <button
                type="button" onClick={handleBack}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-back"
              >
                <ArrowRight className="w-4 h-4" />
                رجوع
              </button>
            ) : (
              <span />
            )}
            <button
              type="button" onClick={() => navigate("/auth")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
              data-testid="link-back-to-login"
            >
              تسجيل الدخول
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
