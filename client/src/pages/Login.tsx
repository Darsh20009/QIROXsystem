import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin, useRegister, saveDeviceToken } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, AlertCircle, Eye, EyeOff, User, Mail, Lock, Building2, ChevronLeft, ShieldCheck, Shield, RefreshCw, CheckCircle2, Sparkles, ArrowRight, Star, Phone, AtSign, Smartphone, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { SiGoogle, SiGithub } from "react-icons/si";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";
import { CountryPhoneInput } from "@/components/CountryPhoneInput";
import { CountrySelect } from "@/components/CountrySelect";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { BiometricButton } from "@/components/BiometricButton";
import { QuickPinButton } from "@/components/QuickPinButton";

export default function Login() {
  const [location, setLocation] = useLocation();
  const { t, dir, lang } = useI18n();
  const ar = lang === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleCallbackHandled = useRef(false);
  const [githubEnabled, setGithubEnabled] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const githubCallbackHandled = useRef(false);

  const isRegister = location === "/register" || location === "/employee/register-secret";
  const isEmployeeRegister = location === "/employee/register-secret";

  // Check if Google OAuth is enabled on the server
  useEffect(() => {
    fetch("/api/auth/google/status", { credentials: "include" })
      .then(r => r.json())
      .then(d => setGoogleEnabled(!!d.enabled))
      .catch(() => {});
  }, []);

  // Handle Google OAuth callback: pick up device token from URL param and navigate
  useEffect(() => {
    if (googleCallbackHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const googleToken = params.get("googleToken");
    const nextPath = params.get("next") || "/dashboard";
    if (!googleToken) {
      // Also handle ?error= from Google OAuth failure
      const googleError = params.get("error");
      if (googleError) {
        toast({ title: "فشل تسجيل الدخول بـ Google", description: "حدث خطأ أثناء الاتصال بـ Google، حاول مرة أخرى", variant: "destructive" });
        window.history.replaceState({}, "", window.location.pathname);
      }
      return;
    }
    googleCallbackHandled.current = true;
    saveDeviceToken(googleToken);
    // Remove params from URL
    window.history.replaceState({}, "", window.location.pathname);
    // Clear any OTP/verification state — Google users are already verified
    setVerifyStep(null);
    // Refresh user data then navigate
    queryClient.invalidateQueries({ queryKey: ["/api/user"] }).then(() => {
      setLocation(nextPath);
    });
  }, []);

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    window.location.href = "/api/auth/google";
  };

  // Check if GitHub OAuth is enabled on the server
  useEffect(() => {
    fetch("/api/auth/github/status", { credentials: "include" })
      .then(r => r.json())
      .then(d => setGithubEnabled(!!d.enabled))
      .catch(() => {});
  }, []);

  // Handle GitHub OAuth callback
  useEffect(() => {
    if (githubCallbackHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const githubToken = params.get("githubToken");
    const nextPath = params.get("next") || "/dashboard";
    if (!githubToken) {
      const githubError = params.get("error");
      if (githubError && githubError.includes("github")) {
        toast({ title: "فشل تسجيل الدخول بـ GitHub", description: "حدث خطأ أثناء الاتصال بـ GitHub، حاول مرة أخرى", variant: "destructive" });
        window.history.replaceState({}, "", window.location.pathname);
      }
      return;
    }
    githubCallbackHandled.current = true;
    saveDeviceToken(githubToken);
    window.history.replaceState({}, "", window.location.pathname);
    setVerifyStep(null);
    queryClient.invalidateQueries({ queryKey: ["/api/user"] }).then(() => {
      setLocation(nextPath);
    });
  }, []);

  const handleGithubLogin = () => {
    setGithubLoading(true);
    window.location.href = "/api/auth/github";
  };

  const identifierHints = ["user123", "name@email.com", "+966XXXXXXXXX"];
  const [hintIndex, setHintIndex] = useState(0);
  const [hintVisible, setHintVisible] = useState(true);

  useEffect(() => {
    if (isRegister) return;
    const interval = setInterval(() => {
      setHintVisible(false);
      setTimeout(() => {
        setHintIndex(i => (i + 1) % identifierHints.length);
        setHintVisible(true);
      }, 300);
    }, 2200);
    return () => clearInterval(interval);
  }, [isRegister]);

  const [verifyStep, setVerifyStep] = useState<{ email: string; name: string } | null>(null);
  const verifyMode = "email" as const;
  const [verifySuccess, setVerifySuccess] = useState<{ name: string } | null>(null);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const [twoFA, setTwoFA] = useState<{ tempToken: string; methods: string[] } | null>(null);
  const [twoFAMethod, setTwoFAMethod] = useState<string>("");
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFAPassphrase, setTwoFAPassphrase] = useState("");
  const [is2FAVerifying, setIs2FAVerifying] = useState(false);
  const [twoFAError, setTwoFAError] = useState("");
  const [is2FAResending, setIs2FAResending] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);

  // Push Approval states
  const [pushChallengeId, setPushChallengeId] = useState<string | null>(null);
  const [pushNumber, setPushNumber] = useState<number | null>(null);
  const [pushStatus, setPushStatus] = useState<"idle" | "requesting" | "waiting" | "approved" | "denied" | "expired">("idle");

  // Push Approval: poll for status when waiting
  useEffect(() => {
    if (pushStatus !== "waiting" || !pushChallengeId) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const r = await fetch(`/api/auth/push-challenge/status/${pushChallengeId}`, { credentials: "include" });
        if (cancelled) return;
        if (r.status === 410 || r.status === 404) { setPushStatus("expired"); return; }
        if (!r.ok) return;
        const data = await r.json();
        if (data.status === "approved") {
          setPushStatus("approved");
          // Complete login
          const r2 = await fetch("/api/auth/push-challenge/complete", {
            method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ challengeId: pushChallengeId, tempToken: twoFA?.tempToken }),
          });
          if (!r2.ok) { const err = await r2.json().catch(() => ({})); setTwoFAError(err.error || "فشل إكمال تسجيل الدخول"); return; }
          const user = await r2.json();
          queryClient.setQueryData(["/api/user"], user);
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
          setTwoFA(null);
          if (user.role === "client") {
            const returnUrl = sessionStorage.getItem("returnAfterLogin");
            if (returnUrl) { sessionStorage.removeItem("returnAfterLogin"); setLocation(returnUrl); }
            else setLocation("/dashboard");
          } else { setLocation("/admin"); }
        } else if (data.status === "denied") {
          setPushStatus("denied");
          setTwoFAError("تم رفض طلب تسجيل الدخول من الجهاز الآخر");
        }
      } catch {}
    };

    poll();
    const interval = setInterval(poll, 2500);
    return () => { cancelled = true; clearInterval(interval); };
  }, [pushStatus, pushChallengeId]);

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

  const handleVerifyOtp = async () => {
    const code = otpCode.join("").trim();
    if (code.length !== 6) { setVerifyError("أدخل الرمز المكوّن من 6 أرقام"); return; }
    setIsVerifying(true);
    setVerifyError("");

    const endpoint = "/api/auth/verify-email";
    const body = { code, email: verifyStep!.email };

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      setVerifyError("تعذّر الوصول إلى الخادم، تحقق من اتصالك بالإنترنت وأعد المحاولة");
      setIsVerifying(false);
      return;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setVerifyError(data.error || "الرمز غير صحيح أو منتهي الصلاحية، تأكد من آخر رسالة في بريدك");
      setIsVerifying(false);
      return;
    }

    // Save device token if returned
    if (data.deviceToken) {
      saveDeviceToken(data.deviceToken);
    }

    // Invalidate user cache so Dashboard fetches fresh data
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });

    setIsVerifying(false);
    const name = verifyStep!.name;
    const role = data.role;
    setVerifyStep(null);
    setVerifySuccess({ name });
    setTimeout(() => {
      setVerifySuccess(null);
      const returnUrl = sessionStorage.getItem("returnAfterLogin");
      if (returnUrl) {
        sessionStorage.removeItem("returnAfterLogin");
        setLocation(returnUrl);
      } else if (role && role !== "client") {
        setLocation("/admin");
      } else {
        setLocation("/dashboard");
      }
    }, 3500);
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setVerifyError("");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST", credentials: "include" });
      if (res.ok) {
        toast({ title: "تم إعادة الإرسال!", description: "تحقق من صندوق الوارد أو مجلد الإسبام" });
        setOtpCode(["", "", "", "", "", ""]);
        document.getElementById("otp-0")?.focus();
      } else {
        const d = await res.json().catch(() => ({}));
        setVerifyError(d.error || "تعذّر إرسال الرمز، حاول مجدداً");
      }
    } catch {
      setVerifyError("حدث خطأ أثناء الإرسال، تحقق من اتصالك وحاول مجدداً");
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
    whatsappNumber: isEmployeeRegister
      ? z.string().optional()
      : z.string().min(5, "رقم الجوال مطلوب"),
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
            if (user.resent) {
              toast({
                title: "حسابك موجود — تم إعادة إرسال الرمز",
                description: "يوجد حساب غير مفعّل بهذه البيانات. أرسلنا رمزًا جديدًا إلى بريدك.",
              });
            }
            // Cache user data so verify-email page knows user is authenticated
            queryClient.setQueryData(["/api/user"], user);
            // Navigate to standalone email verify page for registration flow
            setLocation("/verify-email?flow=register");
          } else {
            queryClient.setQueryData(["/api/user"], user);
            if (user.role === "client") {
              const returnUrl = sessionStorage.getItem("returnAfterLogin");
              if (returnUrl) {
                sessionStorage.removeItem("returnAfterLogin");
                setLocation(returnUrl);
              } else {
                setLocation("/dashboard");
              }
            } else {
              setLocation("/admin");
            }
          }
        },
      });
    } else {
      login(data, {
        onSuccess: (user: any) => {
          if (user.requires2FA) {
            setTwoFA({ tempToken: user.tempToken, methods: user.methods });
            setTwoFAMethod(user.methods[0]);
            setTwoFACode("");
            setTwoFAPassphrase("");
            setTwoFAError("");
            setEmailOtpSent(false);
            return;
          }
          if (user.role === "client" && user.email && (user.needsVerification || !user.emailVerified)) {
            setVerifyStep({ email: user.email, name: user.fullName || user.username || "" });
          }
        },
      });
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
    <div className="min-h-screen flex bg-white" dir={dir}>
      <PageGraphics variant="auth" />
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex w-[42%] bg-black flex-col justify-between p-12 relative overflow-hidden flex-shrink-0">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Brand */}
        <div className="relative z-10">
          <Link href="/">
            <img src={qiroxLogoPath} alt="QIROX" className="h-9 w-auto object-contain invert opacity-90 hover:opacity-100 transition-opacity cursor-pointer" />
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

          {/* Social login badges */}
          {(googleEnabled || githubEnabled) && !isEmployeeRegister && (
            <div className="flex flex-col gap-2">
              {googleEnabled && (
                <div className="relative overflow-hidden flex items-center gap-3 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3.5">
                  {/* Google color top bar */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] flex">
                    <div className="flex-1 bg-[#4285F4]/70" />
                    <div className="flex-1 bg-[#EA4335]/70" />
                    <div className="flex-1 bg-[#FBBC05]/70" />
                    <div className="flex-1 bg-[#34A853]/70" />
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-md shadow-black/20">
                    <SiGoogle className="w-[18px] h-[18px] text-[#4285F4]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-xs font-bold">دخول سريع بـ Google</p>
                    <p className="text-white/30 text-[10px] mt-0.5">آمن · مشفّر · بضغطة واحدة</p>
                  </div>
                  <span className="flex items-center gap-1 shrink-0">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34A853] opacity-60" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34A853]" />
                    </span>
                  </span>
                </div>
              )}
              {githubEnabled && (
                <div className="relative overflow-hidden flex items-center gap-3 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3.5">
                  {/* GitHub brand gradient top bar */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] flex">
                    <div className="flex-1 bg-[#6e40c9]/80" />
                    <div className="flex-1 bg-[#8957e5]/80" />
                    <div className="flex-1 bg-white/40" />
                    <div className="flex-1 bg-[#58a6ff]/80" />
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#161b22] to-[#30363d] flex items-center justify-center shrink-0 shadow-md shadow-black/30 border border-white/[0.08]">
                    <SiGithub className="w-[18px] h-[18px] text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-xs font-bold">دخول سريع بـ GitHub</p>
                    <p className="text-white/30 text-[10px] mt-0.5">آمن · مشفّر · بضغطة واحدة</p>
                  </div>
                  <span className="flex items-center gap-1 shrink-0">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8957e5] opacity-60" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8957e5]" />
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}
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
        {verifySuccess ? (
          <motion.div
            key="verify-success"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md flex flex-col items-center text-center"
          >
            {/* Animated success icon */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, duration: 0.6, type: "spring", stiffness: 200 }}
              className="relative mb-8"
            >
              <div className="w-24 h-24 rounded-3xl bg-black flex items-center justify-center shadow-2xl shadow-black/20">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
              {/* Floating sparkles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-black/20"
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: Math.cos((i * 60 * Math.PI) / 180) * 55,
                    y: Math.sin((i * 60 * Math.PI) / 180) * 55,
                  }}
                  transition={{ delay: 0.4 + i * 0.07, duration: 0.9, ease: "easeOut" }}
                  style={{ top: "50%", left: "50%", marginTop: -4, marginLeft: -4 }}
                />
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              <h1 className="text-3xl font-black text-black font-heading mb-2">
                أهلاً بك{verifySuccess.name ? `، ${verifySuccess.name.split(" ")[0]}` : ""}!
              </h1>
              <p className="text-black/40 text-sm mb-6 leading-relaxed">
                تم تفعيل حسابك بنجاح — لوحة تحكمك جاهزة الآن
              </p>

              {/* Features preview */}
              <div className="space-y-2.5 mb-8">
                {[
                  { icon: Star, text: "تقديم طلبك الأول ومتابعة مراحل التنفيذ" },
                  { icon: Sparkles, text: "التواصل المباشر مع فريق QIROX Studio" },
                  { icon: ArrowRight, text: "متابعة مشاريعك ونسبة الإتمام" },
                ].map(({ icon: Icon, text }, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + idx * 0.1, duration: 0.4 }}
                    className="flex items-center gap-3 bg-black/[0.03] rounded-xl px-4 py-3 text-right"
                  >
                    <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-black/70 font-medium">{text}</span>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="flex items-center justify-center gap-2 text-xs text-black/30"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>جارٍ الانتقال للوحة التحكم...</span>
              </motion.div>
            </motion.div>
          </motion.div>
        ) : twoFA ? (
          <motion.div
            key="2fa-step"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-black font-heading text-black mb-2">المصادقة الثنائية</h1>
              <p className="text-black/40 text-sm leading-relaxed">اختر طريقة التحقق لإكمال تسجيل الدخول</p>
            </div>

            {twoFA.methods.length > 1 && (
              <div className="flex gap-2 mb-5 p-1 bg-black/[0.03] rounded-xl overflow-x-auto">
                {twoFA.methods.map(m => (
                  <button
                    key={m}
                    onClick={() => {
                      setTwoFAMethod(m); setTwoFACode(""); setTwoFAPassphrase(""); setTwoFAError("");
                      if (m !== "email") setEmailOtpSent(false);
                      if (m !== "push") { setPushStatus("idle"); setPushChallengeId(null); setPushNumber(null); }
                    }}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${twoFAMethod === m ? "bg-black text-white shadow-sm" : "text-black/50 hover:text-black/70"}`}
                    data-testid={`tab-2fa-${m}`}
                  >
                    {m === "totp" ? "تطبيق المصادقة" : m === "email" ? "البريد الإلكتروني" : m === "push" ? "🔔 إشعار الجهاز" : "كلمة الاسترداد"}
                  </button>
                ))}
              </div>
            )}

            {twoFAMethod === "totp" && (
              <div className="space-y-3">
                <p className="text-sm text-black/60">أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة:</p>
                <Input
                  value={twoFACode}
                  onChange={e => setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest font-mono h-14 rounded-xl border-2 border-black/[0.1] focus:border-black"
                  maxLength={6}
                  inputMode="numeric"
                  autoFocus
                  data-testid="input-2fa-totp"
                />
              </div>
            )}

            {twoFAMethod === "email" && !emailOtpSent && (
              <div className="space-y-4 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-black/[0.05] mx-auto">
                  <Mail className="w-6 h-6 text-black/50" />
                </div>
                <p className="text-sm text-black/60">سيتم إرسال رمز التحقق إلى بريدك الإلكتروني المسجّل</p>
                <Button
                  onClick={async () => {
                    setIsSendingEmailOtp(true);
                    setTwoFAError("");
                    try {
                      const r = await fetch("/api/auth/resend-2fa-email", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tempToken: twoFA.tempToken }) });
                      if (r.ok) { setEmailOtpSent(true); toast({ title: "تم إرسال الرمز", description: "تحقق من صندوق الوارد أو مجلد الإسبام" }); }
                      else { const d = await r.json().catch(() => ({})); setTwoFAError(d.error || "فشل إرسال الرمز"); }
                    } catch { setTwoFAError("تعذّر الاتصال بالخادم"); }
                    setIsSendingEmailOtp(false);
                  }}
                  disabled={isSendingEmailOtp}
                  className="w-full h-12 bg-black hover:bg-black/80 text-white rounded-xl font-bold text-sm"
                  data-testid="button-send-2fa-email"
                >
                  {isSendingEmailOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <><Mail className="w-4 h-4 ml-2" />إرسال رمز التحقق</>
                  )}
                </Button>
              </div>
            )}

            {twoFAMethod === "email" && emailOtpSent && (
              <div className="space-y-3">
                <p className="text-sm text-black/60">أدخل الرمز المرسل إلى بريدك الإلكتروني:</p>
                <Input
                  value={twoFACode}
                  onChange={e => setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest font-mono h-14 rounded-xl border-2 border-black/[0.1] focus:border-black"
                  maxLength={6}
                  inputMode="numeric"
                  autoFocus
                  data-testid="input-2fa-email"
                />
                <button
                  onClick={async () => {
                    setIs2FAResending(true);
                    try {
                      const r = await fetch("/api/auth/resend-2fa-email", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tempToken: twoFA.tempToken }) });
                      if (r.ok) { toast({ title: "تم إعادة إرسال الرمز" }); setTwoFACode(""); }
                      else { const d = await r.json().catch(() => ({})); setTwoFAError(d.error || "فشل إعادة الإرسال"); }
                    } catch { setTwoFAError("تعذّر الاتصال بالخادم"); }
                    setIs2FAResending(false);
                  }}
                  disabled={is2FAResending}
                  className="text-xs text-black/40 hover:text-black/70 transition-colors underline"
                  data-testid="button-resend-2fa-email"
                >
                  {is2FAResending ? "جارٍ الإرسال..." : "إعادة إرسال الرمز"}
                </button>
              </div>
            )}

            {twoFAMethod === "passphrase" && (
              <div className="space-y-3">
                <p className="text-sm text-black/60">أدخل كلمة الاسترداد الخاصة بك:</p>
                <Input
                  type="password"
                  value={twoFAPassphrase}
                  onChange={e => setTwoFAPassphrase(e.target.value)}
                  placeholder="كلمة الاسترداد"
                  className="h-14 rounded-xl border-2 border-black/[0.1] focus:border-black text-lg"
                  autoFocus
                  data-testid="input-2fa-passphrase"
                />
              </div>
            )}

            {/* Push Approval method UI */}
            {twoFAMethod === "push" && (
              <div className="space-y-4">
                {pushStatus === "idle" && (
                  <div className="text-center space-y-4 py-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black/[0.05] mx-auto">
                      <Smartphone className="w-8 h-8 text-black/50" />
                    </div>
                    <div>
                      <p className="text-sm text-black/70 font-medium mb-1">تأكيد عبر جهازك الموثوق</p>
                      <p className="text-xs text-black/40">سيُرسَل إشعار لأجهزتك المسجّلة تُؤكّد فيه تسجيل الدخول</p>
                    </div>
                    <Button
                      onClick={async () => {
                        setPushStatus("requesting");
                        setTwoFAError("");
                        try {
                          const r = await fetch("/api/auth/push-challenge/request", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tempToken: twoFA?.tempToken }) });
                          const d = await r.json();
                          if (!r.ok) { setTwoFAError(d.error || "فشل إرسال الإشعار"); setPushStatus("idle"); return; }
                          setPushChallengeId(d.challengeId);
                          setPushNumber(d.number);
                          setPushStatus("waiting");
                        } catch { setTwoFAError("تعذّر الاتصال بالخادم"); setPushStatus("idle"); }
                      }}
                      disabled={pushStatus === "requesting"}
                      className="w-full h-12 bg-black hover:bg-black/80 text-white rounded-xl font-bold text-sm"
                      data-testid="button-send-push-challenge"
                    >
                      {pushStatus === "requesting" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Smartphone className="w-4 h-4 ml-2" />إرسال إشعار التأكيد</>}
                    </Button>
                  </div>
                )}

                {pushStatus === "waiting" && pushNumber !== null && (
                  <div className="text-center space-y-4 py-2">
                    <p className="text-xs text-black/40">تأكد أن هذا الرمز يطابق ما يظهر على جهازك الآخر:</p>
                    {/* Big animated number */}
                    <motion.div
                      className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center border-2 border-black/10 bg-black/[0.03]"
                      animate={{ borderColor: ["rgba(0,0,0,0.1)", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.1)"] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <span className="text-5xl font-black text-black tabular-nums" dir="ltr">{pushNumber}</span>
                    </motion.div>
                    <div className="flex items-center justify-center gap-2 text-black/40">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs">في انتظار الموافقة...</span>
                    </div>
                    <button
                      onClick={() => { setPushStatus("idle"); setPushChallengeId(null); setPushNumber(null); setTwoFAError(""); }}
                      className="text-xs text-black/30 hover:text-black/60 transition-colors underline"
                    >
                      لم يصل الإشعار؟ أعد الإرسال
                    </button>
                  </div>
                )}

                {pushStatus === "denied" && (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-3">
                      <X className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="text-sm text-red-600 font-medium mb-3">تم رفض طلب تسجيل الدخول</p>
                    <button onClick={() => { setPushStatus("idle"); setTwoFAError(""); }} className="text-xs text-black/40 hover:text-black/70 underline">المحاولة مجدداً</button>
                  </div>
                )}

                {pushStatus === "expired" && (
                  <div className="text-center py-4">
                    <p className="text-sm text-amber-600 mb-3">انتهت صلاحية الرمز</p>
                    <button onClick={() => { setPushStatus("idle"); setTwoFAError(""); }} className="text-xs text-black/40 hover:text-black/70 underline">المحاولة مجدداً</button>
                  </div>
                )}
              </div>
            )}

            {twoFAError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                <Alert variant="destructive" className="bg-red-50 border-red-200/70 text-red-600 rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{twoFAError}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {twoFAMethod !== "push" && (
              <Button
                onClick={async () => {
                  const codeVal = twoFAMethod === "passphrase" ? twoFAPassphrase : twoFACode;
                  if (!codeVal) { setTwoFAError(twoFAMethod === "passphrase" ? "أدخل كلمة الاسترداد" : "أدخل رمز التحقق"); return; }
                  if (twoFAMethod !== "passphrase" && codeVal.length !== 6) { setTwoFAError("أدخل الرمز المكون من 6 أرقام"); return; }
                  setIs2FAVerifying(true); setTwoFAError("");
                  try {
                    const r = await fetch("/api/auth/verify-2fa", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tempToken: twoFA.tempToken, method: twoFAMethod, code: codeVal }) });
                    const data = await r.json().catch(() => ({}));
                    if (!r.ok) { setTwoFAError(data.error || "فشل التحقق"); setIs2FAVerifying(false); return; }
                    setTwoFA(null);
                    if (data.role === "client" && data.email && (data.needsVerification || !data.emailVerified)) {
                      setVerifyStep({ email: data.email, name: data.fullName || data.username || "" });
                    } else {
                      queryClient.setQueryData(["/api/user"], data);
                      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                      if (data.role === "client") {
                        const returnUrl = sessionStorage.getItem("returnAfterLogin");
                        if (returnUrl) { sessionStorage.removeItem("returnAfterLogin"); setLocation(returnUrl); }
                        else setLocation("/dashboard");
                      } else { setLocation("/admin"); }
                    }
                  } catch { setTwoFAError("تعذّر الاتصال بالخادم"); }
                  setIs2FAVerifying(false);
                }}
                disabled={is2FAVerifying || (twoFAMethod === "email" && !emailOtpSent) || (twoFAMethod !== "passphrase" ? twoFACode.length !== 6 : !twoFAPassphrase)}
                className="w-full h-12 bg-black hover:bg-black/80 text-white rounded-xl font-bold text-sm mt-5"
                data-testid="button-verify-2fa"
              >
                {is2FAVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <><ShieldCheck className="w-4 h-4 ml-2" />تحقق وادخل</>
                )}
              </Button>
            )}

            <div className="text-center mt-4">
              <button onClick={() => { setTwoFA(null); setTwoFACode(""); setTwoFAPassphrase(""); setTwoFAError(""); setEmailOtpSent(false); setPushStatus("idle"); setPushChallengeId(null); setPushNumber(null); }} className="text-xs text-black/30 hover:text-black/60 transition-colors" data-testid="button-back-from-2fa">
                العودة لتسجيل الدخول
              </button>
            </div>
          </motion.div>
        ) : verifyStep ? (
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
                أرسلنا رمز التحقق المكوّن من 6 أرقام إلى<br />
                <span className="text-black font-semibold" dir="ltr">{verifyStep.email}</span>
              </p>
            </div>

            {/* Info notice */}
            <div className="border rounded-xl px-4 py-3 mb-5 flex items-start gap-3 bg-amber-50 border-amber-200/60">
              <span className="text-base mt-0.5 flex-shrink-0 text-amber-500">⚠️</span>
              <div>
                <p className="text-amber-800 text-xs font-semibold mb-0.5">لم يصل البريد؟</p>
                <p className="text-amber-700 text-[11px] leading-relaxed">
                  تحقق من مجلد <strong>الإسبام / Spam</strong> أو البريد غير المرغوب فيه — أحياناً تصل الرسائل هناك. إذا لم تجده، اضغط "إعادة إرسال الرمز" أدناه.
                </p>
              </div>
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
              onClick={handleVerifyOtp}
              disabled={isVerifying || otpCode.join("").length !== 6}
              className="w-full h-12 bg-black hover:bg-black/80 text-white rounded-xl font-bold text-sm mb-4"
              data-testid="button-verify-otp"
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

            <p className="text-center text-[11px] text-black/25 mt-4">
              {"الرمز صالح لمدة 30 دقيقة"}
            </p>
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

          {/* Social OAuth Buttons */}
          {(googleEnabled || githubEnabled) && !isEmployeeRegister && (
            <div className="mb-5">
              {googleEnabled && <motion.button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                data-testid="btn-google-login"
                whileHover={!googleLoading ? { y: -2 } : {}}
                whileTap={!googleLoading ? { y: 0, scale: 0.99 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="w-full relative overflow-hidden rounded-xl border border-black/[0.1] bg-white flex items-center gap-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed group"
                style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}
              >
                {/* Shimmer sweep on hover */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.55) 50%, transparent 60%)",
                    x: "-120%",
                  }}
                  animate={googleLoading ? {} : undefined}
                  whileHover={{ x: "120%" }}
                  transition={{ duration: 0.45, ease: "easeInOut" }}
                />

                {/* Google colored icon column */}
                <div className="relative flex-shrink-0 w-[58px] h-[58px] flex items-center justify-center border-l border-black/[0.07] bg-gradient-to-br from-white to-black/[0.02]">
                  {/* Four Google color corner dots */}
                  <span className="absolute top-[7px] right-[7px] w-[5px] h-[5px] rounded-full bg-[#4285F4] opacity-70" />
                  <span className="absolute top-[7px] left-[7px] w-[5px] h-[5px] rounded-full bg-[#EA4335] opacity-70" />
                  <span className="absolute bottom-[7px] left-[7px] w-[5px] h-[5px] rounded-full bg-[#FBBC05] opacity-70" />
                  <span className="absolute bottom-[7px] right-[7px] w-[5px] h-[5px] rounded-full bg-[#34A853] opacity-70" />
                  {googleLoading ? (
                    <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="#E5E5E5" strokeWidth="2.5" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="#4285F4" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <SiGoogle className="w-[22px] h-[22px] text-[#4285F4]" />
                  )}
                </div>

                {/* Text area */}
                <div className="flex-1 px-4 py-3.5 text-right">
                  <p className="text-black font-bold text-[14px] leading-snug">
                    {googleLoading
                      ? "جارٍ الاتصال بـ Google..."
                      : isRegister
                      ? "إنشاء حساب بـ Google"
                      : "تسجيل الدخول بـ Google"
                    }
                  </p>
                  {!googleLoading && (
                    <p className="text-black/35 text-[10.5px] font-medium mt-0.5">
                      دخول سريع · آمن · بضغطة واحدة
                    </p>
                  )}
                </div>

                {/* Google 4-color bottom bar */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] flex">
                  <div className="flex-1 bg-[#4285F4]" />
                  <div className="flex-1 bg-[#EA4335]" />
                  <div className="flex-1 bg-[#FBBC05]" />
                  <div className="flex-1 bg-[#34A853]" />
                </div>
              </motion.button>}

              {/* GitHub OAuth Button */}
              {githubEnabled && (
                <motion.button
                  type="button"
                  onClick={handleGithubLogin}
                  disabled={githubLoading}
                  data-testid="btn-github-login"
                  whileHover={!githubLoading ? { y: -2 } : {}}
                  whileTap={!githubLoading ? { y: 0, scale: 0.99 } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="w-full mt-3 relative overflow-hidden rounded-xl border border-black/[0.1] bg-[#24292e] flex items-center gap-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.12)" }}
                >
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)", x: "-120%" }}
                    whileHover={{ x: "120%" }}
                    transition={{ duration: 0.45, ease: "easeInOut" }}
                  />
                  <div className="relative flex-shrink-0 w-[58px] h-[58px] flex items-center justify-center border-l border-white/10 bg-black/20">
                    {githubLoading ? (
                      <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <SiGithub className="w-[22px] h-[22px] text-white" />
                    )}
                  </div>
                  <div className="flex-1 px-4 py-3.5 text-right">
                    <p className="text-white font-bold text-[14px] leading-snug">
                      {githubLoading ? "جارٍ الاتصال بـ GitHub..." : isRegister ? "إنشاء حساب بـ GitHub" : "تسجيل الدخول بـ GitHub"}
                    </p>
                    {!githubLoading && (
                      <p className="text-white/40 text-[10.5px] font-medium mt-0.5">دخول سريع · آمن · بضغطة واحدة</p>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10" />
                </motion.button>
              )}

              <div className="flex items-center gap-3 mt-4">
                <div className="flex-1 h-px bg-black/[0.07]" />
                <span className="text-xs text-black/30 font-medium">أو بالبريد وكلمة المرور</span>
                <div className="flex-1 h-px bg-black/[0.07]" />
              </div>
            </div>
          )}

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {/* Smart Identifier */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => {
                  const v = field.value || "";
                  const detectedEmail = v.includes("@");
                  const detectedPhone = /^[\+\d]/.test(v) && v.replace(/\D/g, "").length >= 6;
                  const IdentifierIcon = detectedEmail ? Mail : detectedPhone ? Phone : isRegister ? User : AtSign;
                  const iconColor = detectedEmail
                    ? "text-cyan-500"
                    : detectedPhone
                    ? "text-emerald-500"
                    : "text-black/20 dark:text-white/20";
                  const labelText = ar
                    ? "اسم المستخدم أو البريد أو الجوال"
                    : "Username, Email, or Phone";
                  return (
                    <FormItem>
                      <div className="flex items-center gap-1.5">
                        <FormLabel className="text-black/50 dark:text-white/50 text-xs font-semibold">{labelText}</FormLabel>
                        {!isRegister && (
                          <span className="flex gap-0.5 items-center text-[10px] text-black/30 dark:text-white/30 font-mono">
                            <span className={`w-1.5 h-1.5 rounded-full ${detectedEmail ? "bg-cyan-400" : "bg-black/15 dark:bg-white/15"}`} />
                            <span className={`w-1.5 h-1.5 rounded-full ${detectedPhone ? "bg-emerald-400" : "bg-black/15 dark:bg-white/15"}`} />
                            <span className={`w-1.5 h-1.5 rounded-full ${!detectedEmail && !detectedPhone && v ? "bg-violet-400" : "bg-black/15 dark:bg-white/15"}`} />
                          </span>
                        )}
                      </div>
                      <FormControl>
                        <div className="relative">
                          <IdentifierIcon className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-300 ${iconColor}`} />
                          <Input
                            {...field}
                            autoComplete="username"
                            placeholder={isRegister ? "user123" : hintVisible ? identifierHints[hintIndex] : ""}
                            className={`${inputBase} pr-10 transition-all duration-200`}
                            data-testid="input-username"
                          />
                        </div>
                      </FormControl>
                      {!isRegister && !v && (
                        <p className="text-[10px] text-black/30 dark:text-white/30 mt-0.5">
                          {ar ? "يقبل: اسم المستخدم • البريد الإلكتروني • رقم الجوال" : "Accepts: username • email • mobile number"}
                        </p>
                      )}
                      <FormMessage className="text-xs" />
                    </FormItem>
                  );
                }}
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
                        <FormLabel className="text-black/50 text-xs font-semibold flex items-center gap-1">
                          رقم الواتساب / الهاتف
                          {!isEmployeeRegister && <span className="text-red-500">*</span>}
                        </FormLabel>
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

              {!isRegister && (
                <>
                  <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 h-px bg-black/[0.07]" />
                    <span className="text-xs text-black/30 font-medium">أو</span>
                    <div className="flex-1 h-px bg-black/[0.07]" />
                  </div>
                  <BiometricButton prefillIdentifier={form.watch("username") || ""} />
                  <QuickPinButton prefillIdentifier={form.watch("username") || ""} />
                </>
              )}
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
