import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin, useRegister } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, AlertCircle, Eye, EyeOff, User, Mail, Lock, Building2, ChevronLeft, ShieldCheck, RefreshCw, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";
import { CountryPhoneInput } from "@/components/CountryPhoneInput";
import { CountrySelect } from "@/components/CountrySelect";

export default function Login() {
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const isRegister = location === "/register" || location === "/employee/register-secret";
  const isEmployeeRegister = location === "/employee/register-secret";

  // Email verification step state
  const [verifyStep, setVerifyStep] = useState<{ email: string; name: string } | null>(null);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const { mutate: login, isPending: isLoginPending, error: loginError } = useLogin();
  const { mutate: register, isPending: isRegisterPending, error: registerError } = useRegister();

  const isPending = isLoginPending || isRegisterPending;
  const error = loginError || registerError;

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = ["", "", "", "", "", ""];
    pasted.split("").forEach((char, idx) => {
      if (idx < 6) newOtp[idx] = char;
    });
    setOtpCode(newOtp);
    const lastIndex = Math.min(pasted.length - 1, 5);
    document.getElementById(`otp-${lastIndex}`)?.focus();
  };

  const handleVerifyEmail = async () => {
    const code = otpCode.join("");
    if (code.length !== 6) { setVerifyError("أدخل الرمز المكوّن من 6 أرقام"); return; }
    setIsVerifying(true);
    setVerifyError("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyStep!.email, code }),
      });
      const data = await res.json();
      if (!res.ok) { setVerifyError(data.error || "الرمز غير صحيح"); return; }
      // Refresh user data and redirect
      const userRes = await fetch("/api/auth/user");
      if (userRes.ok) {
        const user = await userRes.json();
        queryClient.setQueryData(["/api/auth/user"], user);
      }
      toast({ title: "تم التحقق بنجاح!", description: "مرحباً بك في QIROX" });
      setLocation("/dashboard");
    } catch {
      setVerifyError("حدث خطأ، حاول مجدداً");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setVerifyError("");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      if (res.ok) {
        toast({ title: "تم الإرسال!", description: "تحقق من بريدك الإلكتروني" });
        setOtpCode(["", "", "", "", "", ""]);
      }
    } catch {
      setVerifyError("حدث خطأ أثناء الإرسال");
    } finally {
      setIsResending(false);
    }
  };

  const registerSchema = z.object({
    username: z.string().min(3, "اسم المستخدم 3 أحرف على الأقل"),
    password: z.string().min(6, "كلمة المرور 6 أحرف على الأقل"),
    email: z.string().email("بريد إلكتروني غير صالح"),
    fullName: z.string().min(2, "الاسم الكامل مطلوب"),
    confirmPassword: z.string(),
    whatsappNumber: z.string().optional(),
    country: z.string().optional(),
    businessType: z.string().optional(),
    role: z.string().optional(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

  const loginSchema = z.object({
    username: z.string().min(1, "مطلوب"),
    password: z.string().min(1, "مطلوب"),
  });

  const schema = isRegister ? registerSchema : loginSchema;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      fullName: "",
      confirmPassword: "",
      whatsappNumber: "",
      country: "",
      businessType: "",
      role: isEmployeeRegister ? "employee_manager" : "client",
    },
  });

  const onSubmit = (data: any) => {
    if (isRegister) {
      const { confirmPassword, ...userData } = data;
      register(userData, {
        onSuccess: (user: any) => {
          if (user.email) {
            setVerifyStep({ email: user.email, name: user.fullName || user.username || "" });
          } else {
            // Employee with no email — just log them in
            queryClient.setQueryData(["/api/auth/user"], user);
            setLocation(user.role === "client" ? "/dashboard" : "/admin");
          }
        },
      });
    } else {
      login(data);
    }
  };

  const inputBase = "h-12 bg-black/[0.02] border-black/[0.08] focus:border-black/25 text-black placeholder:text-black/20 rounded-xl transition-colors";

  const businessTypes = [
    { value: "commercial", label: "تجاري / متجر" },
    { value: "restaurant", label: "مطعم / مقهى" },
    { value: "education", label: "تعليمي / أكاديمية" },
    { value: "medical", label: "طبي / صحي" },
    { value: "real_estate", label: "عقارات" },
    { value: "services", label: "خدمات" },
    { value: "technology", label: "تقنية / برمجة" },
    { value: "other", label: "أخرى" },
  ];

  return (
    <div className="min-h-screen flex bg-white" dir="rtl">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex w-[42%] bg-black flex-col justify-between p-12 relative overflow-hidden flex-shrink-0">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Brand */}
        <div className="relative z-10">
          <Link href="/">
            <img src={qiroxLogoPath} alt="QIROX" className="h-9 w-auto object-contain brightness-[2] opacity-90 hover:opacity-100 transition-opacity cursor-pointer" />
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-col gap-6">
          <div>
            <h2 className="text-4xl font-black text-white font-heading leading-tight mb-4">
              {isRegister
                ? <>منصتك الرقمية<br /><span className="text-white/40">تبدأ من هنا</span></>
                : <>أهلاً بعودتك<br /><span className="text-white/40">إلى QIROX</span></>
              }
            </h2>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              {isRegister
                ? "انضم إلى مئات الأعمال التي تثق في QIROX لبناء حضورها الرقمي الاحترافي"
                : "نحن هنا لمساعدتك في إدارة مشاريعك الرقمية وتحقيق أهدافك"
              }
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "+200", label: "عميل" },
              { value: "+8", label: "قطاعات" },
              { value: "99%", label: "رضا" },
            ].map(s => (
              <div key={s.label} className="bg-white/[0.05] rounded-xl p-3 text-center border border-white/[0.07]">
                <p className="text-white font-black text-lg">{s.value}</p>
                <p className="text-white/35 text-[10px]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10 border-t border-white/[0.07] pt-6">
          <p className="text-white/25 text-xs leading-relaxed italic">
            "QIROX — منصة صناعة الأنظمة الرقمية المتكاملة"
          </p>
        </div>
      </div>

      {/* Right form area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <Link href="/">
            <img src={qiroxLogoPath} alt="QIROX" className="h-9 w-auto object-contain mx-auto" />
          </Link>
        </div>

        <AnimatePresence mode="wait">
        {verifyStep ? (
          <motion.div
            key="verify-step"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black mb-4">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-black font-heading text-black mb-2">تأكيد البريد الإلكتروني</h1>
              <p className="text-black/40 text-sm leading-relaxed">
                أرسلنا رمز التحقق إلى<br />
                <span className="text-black font-semibold" dir="ltr">{verifyStep.email}</span>
              </p>
            </div>

            {/* OTP boxes */}
            <div className="flex justify-center gap-3 mb-6" dir="ltr">
              {otpCode.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                  data-testid={`otp-box-${i}`}
                  className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all duration-200 ${
                    digit ? "border-black bg-black text-white" : "border-black/[0.15] bg-black/[0.02] text-black"
                  } focus:border-black focus:ring-2 focus:ring-black/10`}
                />
              ))}
            </div>

            {verifyError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
                <Alert variant="destructive" className="bg-red-50 border-red-200/70 text-red-600 rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{verifyError}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <Button
              onClick={handleVerifyEmail}
              disabled={isVerifying || otpCode.join("").length !== 6}
              className="w-full h-12 bg-black hover:bg-black/80 text-white rounded-xl font-bold text-sm mb-4"
              data-testid="button-verify-email"
            >
              {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <><CheckCircle2 className="w-4 h-4 ml-2" />تأكيد الحساب</>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending}
                className="text-sm text-black/40 hover:text-black transition-colors flex items-center gap-1.5 mx-auto"
                data-testid="button-resend-otp"
              >
                {isResending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                إعادة إرسال الرمز
              </button>
            </div>

            <p className="text-center text-[11px] text-black/25 mt-4">الرمز صالح لمدة 30 دقيقة</p>
          </motion.div>
        ) : (
        <motion.div
          key="main-form"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-black font-heading text-black mb-1.5">
              {isRegister
                ? (isEmployeeRegister ? "تسجيل موظف جديد" : "إنشاء حساب جديد")
                : "تسجيل الدخول"
              }
            </h1>
            <p className="text-black/35 text-sm">
              {isRegister
                ? (isEmployeeRegister ? "حساب خاص بفريق QIROX الداخلي" : "أنشئ حسابك وابدأ مشروعك الرقمي اليوم")
                : "أدخل بياناتك للوصول إلى لوحة تحكمك"
              }
            </p>
          </div>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">
                <Alert variant="destructive" className="bg-red-50 border-red-200/70 text-red-600 rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error.message}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {/* Username */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black/50 text-xs font-semibold">{t("login.username")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                        <Input placeholder="user123" {...field} className={`${inputBase} pr-10`} data-testid="input-username" />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {isRegister && (
                <>
                  {/* Full Name */}
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black/50 text-xs font-semibold">{t("login.fullName")}</FormLabel>
                        <FormControl>
                          <Input placeholder="محمد أحمد" {...field} className={inputBase} data-testid="input-fullName" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black/50 text-xs font-semibold">{t("login.email")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                            <Input type="email" placeholder="name@example.com" {...field} className={`${inputBase} pr-10`} dir="ltr" data-testid="input-email" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Employee Role */}
                  {isEmployeeRegister && (
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black/50 text-xs font-semibold">{t("login.role")}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className={inputBase}>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="employee_manager">Manager</SelectItem>
                              <SelectItem value="employee_sales">Sales Manager</SelectItem>
                              <SelectItem value="employee_sales_exec">Sales</SelectItem>
                              <SelectItem value="employee_dev">Developer</SelectItem>
                              <SelectItem value="employee_design">Designer</SelectItem>
                              <SelectItem value="employee_support">Support</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Phone with Country Code */}
                  <FormField
                    control={form.control}
                    name="whatsappNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black/50 text-xs font-semibold">رقم الواتساب / الهاتف</FormLabel>
                        <FormControl>
                          <CountryPhoneInput
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="5XXXXXXXX"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {!isEmployeeRegister && (
                    <div className="grid grid-cols-2 gap-3">
                      {/* Country Select */}
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black/50 text-xs font-semibold">{t("login.country")}</FormLabel>
                            <FormControl>
                              <CountrySelect
                                value={field.value || ""}
                                onChange={field.onChange}
                                placeholder="اختر الدولة"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      {/* Business Type */}
                      <FormField
                        control={form.control}
                        name="businessType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black/50 text-xs font-semibold">{t("login.businessType")}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className={`${inputBase} text-sm`}>
                                  <SelectValue placeholder="نوع النشاط" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {businessTypes.map(bt => (
                                  <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-black/50 text-xs font-semibold">{t("login.password")}</FormLabel>
                      {!isRegister && (
                        <Link href="/forgot-password" className="text-[11px] text-black/35 hover:text-black/60 transition-colors" data-testid="link-forgot-password">
                          نسيت كلمة المرور؟
                        </Link>
                      )}
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                        <Input
                          type={showPw ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                          className={`${inputBase} pr-10 pl-10`}
                          data-testid="input-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(!showPw)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20 hover:text-black/50 transition-colors"
                        >
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {isRegister && (
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black/50 text-xs font-semibold">{t("login.confirmPassword")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                          <Input
                            type={showConfirmPw ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                            className={`${inputBase} pr-10 pl-10`}
                            data-testid="input-confirmPassword"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPw(!showConfirmPw)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20 hover:text-black/50 transition-colors"
                          >
                            {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-12 bg-black hover:bg-black/80 text-white rounded-xl font-bold text-sm transition-all mt-2 gap-2"
                disabled={isPending}
                data-testid="button-submit-login"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("login.processing")}
                  </>
                ) : (
                  <>
                    {isRegister ? t("login.submitRegister") : t("login.submit")}
                    <ChevronLeft className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Switch auth mode */}
          <div className="mt-6 text-center">
            <span className="text-sm text-black/35">
              {isRegister ? t("login.hasAccount") : t("login.noAccount")}{" "}
            </span>
            <Link href={isRegister ? "/login" : "/register"} className="text-sm text-black font-bold hover:underline">
              {isRegister ? t("login.signIn") : t("login.createAccount")}
            </Link>
          </div>

          {/* Policy note for register */}
          {isRegister && !isEmployeeRegister && (
            <p className="mt-4 text-center text-[11px] text-black/25 leading-relaxed">
              بالتسجيل، أنت توافق على{" "}
              <span className="text-black/40 underline cursor-pointer">سياسة الخصوصية</span>
              {" "}و{" "}
              <span className="text-black/40 underline cursor-pointer">شروط الاستخدام</span>
            </p>
          )}
        </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
