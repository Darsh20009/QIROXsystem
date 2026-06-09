import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin, useRegister, saveDeviceToken } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, AlertCircle, Eye, EyeOff, User, Mail, Lock, Building2, ChevronLeft, ShieldCheck, Shield, RefreshCw, CheckCircle2, Sparkles, ArrowRight, Star, Phone, AtSign, Smartphone, X, QrCode, ScanLine, MessageSquare, KeyRound } from "lucide-react";
import { QrLoginScanner } from "@/components/QrLoginScanner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { SiGoogle, SiGithub, SiApple } from "react-icons/si";
const qiroxLogoPath = "/qirox-icon-nobg.png";
import { CountryPhoneInput } from "@/components/CountryPhoneInput";
import { CountrySelect } from "@/components/CountrySelect";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { BiometricButton } from "@/components/BiometricButton";
import { QuickPinButton } from "@/components/QuickPinButton";

// ─── Formal QIROX System Panel ───────────────────────────────────────────────

const SYSTEM_MODULES = [
  { label: "لوحة التحكم",     icon: "▪", active: true  },
  { label: "إدارة المشاريع",  icon: "▪", active: false },
  { label: "التقارير المالية",icon: "▪", active: false },
  { label: "العملاء والعقود", icon: "▪", active: false },
  { label: "الذكاء الاصطناعي",icon: "▪", active: false },
];

const METRIC_BARS = [
  { label: "المشاريع النشطة", val: 78, color: "rgba(255,255,255,0.9)"  },
  { label: "رضا العملاء",     val: 96, color: "rgba(255,255,255,0.7)"  },
  { label: "نسبة الإنجاز",    val: 64, color: "rgba(255,255,255,0.55)" },
];

function AuthPremiumPanel({ isRegister, isEmployeeRegister, googleEnabled, githubEnabled, appleEnabled,
  googleLoading, githubLoading, appleLoading, handleGoogleLogin, handleGithubLogin, handleAppleLogin }: {
  isRegister: boolean; isEmployeeRegister: boolean;
  googleEnabled: boolean; githubEnabled: boolean; appleEnabled: boolean;
  googleLoading: boolean; githubLoading: boolean; appleLoading: boolean;
  handleGoogleLogin: () => void; handleGithubLogin: () => void; handleAppleLogin: () => void;
}) {
  const [activeModule, setActiveModule] = useState(0);
  const [barWidths, setBarWidths] = useState([0, 0, 0]);

  useEffect(() => {
    const t = setInterval(() => setActiveModule(c => (c + 1) % SYSTEM_MODULES.length), 2200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBarWidths(METRIC_BARS.map(m => m.val));
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="hidden lg:flex w-[44%] flex-col justify-between relative overflow-hidden flex-shrink-0"
      style={{ background: "#0e0e12" }}
    >
      {/* Subtle top-right light bloom */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 65%)" }} />

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      {/* Left accent stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.18) 60%, transparent 100%)" }} />

      {/* ── Top brand bar ── */}
      <div className="relative z-10 px-10 pt-10 pb-0 flex items-center justify-between">
        <Link href="/">
          <motion.div className="flex items-center gap-3 cursor-pointer" whileHover={{ opacity: 0.85 }} transition={{ duration: 0.2 }}>
            <img src="/qirox-icon-nobg.png" alt="QIROX" className="h-8 w-auto object-contain" />
            <div>
              <span className="text-white font-black text-lg tracking-[0.12em] block leading-none" style={{ fontFamily: "var(--font-heading)" }}>QIROX</span>
              <span className="text-white/30 text-[9px] tracking-[0.25em] uppercase block mt-0.5">Systems Factory</span>
            </div>
          </motion.div>
        </Link>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute h-full w-full rounded-full bg-white opacity-30" />
            <span className="relative rounded-full h-1.5 w-1.5 bg-white/60" />
          </span>
          <span className="text-white/30 text-[9px] tracking-widest uppercase font-mono">Live</span>
        </div>
      </div>

      {/* ── Main content: System UI preview ── */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-10 py-6 gap-5">

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="text-white/25 text-[10px] uppercase tracking-[0.3em] mb-2 font-mono">
            {isRegister ? "— منضم جديد" : "— بوابة الدخول"}
          </p>
          <h2 className="text-white font-black leading-[1.1] mb-1" style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontFamily: "var(--font-heading)" }}>
            {isRegister ? <>ابنِ نظامك<br /><span className="text-white/35">الرقمي</span></> : <>منصة إدارة<br /><span className="text-white/35">متكاملة</span></>}
          </h2>
          <p className="text-white/30 text-xs leading-relaxed">
            {isRegister ? "مصنع الأنظمة الرقمية — أكثر من 100 عميل بنوا أنظمتهم معنا" : "نظام إدارة الأعمال الرقمي الشامل · مُصمَّم للسوق العربي"}
          </p>
        </motion.div>

        {/* ── System UI mockup ── */}
        <motion.div
          className="rounded-2xl overflow-hidden relative"
          style={{
            background: "#141418",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
        >
          {/* Window chrome */}
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.05]"
            style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="w-2 h-2 rounded-full bg-white/10" />
            <div className="w-2 h-2 rounded-full bg-white/10" />
            <div className="w-2 h-2 rounded-full bg-white/10" />
            <span className="text-white/20 text-[9px] font-mono ml-2 tracking-wider">qirox.app / dashboard</span>
            <div className="ml-auto flex items-center gap-1">
              <div className="w-12 h-1.5 rounded-full bg-white/08" style={{ background: "rgba(255,255,255,0.06)" }} />
            </div>
          </div>

          {/* Mockup body: sidebar + content */}
          <div className="flex" style={{ height: 180 }}>
            {/* Sidebar */}
            <div className="w-[90px] border-r border-white/[0.05] flex flex-col py-3 gap-0.5 px-2 shrink-0"
              style={{ background: "rgba(255,255,255,0.01)" }}>
              <div className="flex items-center gap-1.5 px-2 py-1.5 mb-2">
                <div className="w-4 h-4 rounded bg-white/15 shrink-0" />
                <div className="h-1.5 rounded-full w-10 bg-white/10" />
              </div>
              {SYSTEM_MODULES.map((mod, i) => (
                <motion.div key={mod.label}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-default"
                  animate={{ backgroundColor: i === activeModule ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0)" }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: i === activeModule ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.15)" }} />
                  <div className="h-1 rounded-full flex-1"
                    style={{ background: i === activeModule ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.08)" }} />
                </motion.div>
              ))}
            </div>

            {/* Main area */}
            <div className="flex-1 p-4 flex flex-col gap-3">
              {/* Top metric cards */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: "١٢٤", l: "مشروع" },
                  { v: "٩٨٪", l: "رضا" },
                  { v: "٨", l: "قطاعات" },
                ].map((m, i) => (
                  <motion.div key={i}
                    className="rounded-lg p-2"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
                  >
                    <p className="text-white font-bold text-xs">{m.v}</p>
                    <p className="text-white/30 text-[8px] mt-0.5">{m.l}</p>
                  </motion.div>
                ))}
              </div>

              {/* Bar chart mock */}
              <div className="flex flex-col gap-2">
                {METRIC_BARS.map((bar, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-1 rounded-full flex-1 bg-white/[0.06] overflow-hidden">
                      <motion.div className="h-full rounded-full"
                        style={{ background: `rgba(255,255,255,${0.25 - i * 0.06})` }}
                        initial={{ width: "0%" }}
                        animate={{ width: `${barWidths[i]}%` }}
                        transition={{ duration: 1.1, delay: 0.7 + i * 0.15, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-white/20 text-[8px] w-5 text-left font-mono">{bar.val}%</span>
                  </div>
                ))}
              </div>

              {/* Active module label */}
              <AnimatePresence mode="wait">
                <motion.div key={activeModule}
                  className="mt-auto flex items-center gap-1.5"
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="w-1 h-1 rounded-full bg-white/40" />
                  <span className="text-white/30 text-[9px] font-mono">{SYSTEM_MODULES[activeModule].label}</span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ── Feature list ── */}
        <div className="flex flex-col gap-2">
          {[
            { title: "إدارة شاملة",      desc: "عمليات · مالية · موظفون · عملاء" },
            { title: "ذكاء اصطناعي",     desc: "Kimi AI · تحليل · محادثة · أتمتة" },
            { title: "أمان مؤسسي",       desc: "2FA · تشفير · جلسات آمنة"         },
          ].map((f, i) => (
            <motion.div key={f.title}
              className="flex items-start gap-3"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.55 + i * 0.12 }}
            >
              <div className="w-4 h-4 rounded border border-white/15 flex items-center justify-center mt-0.5 shrink-0"
                style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="w-1.5 h-1.5 rounded-sm bg-white/50" />
              </div>
              <div>
                <p className="text-white/75 text-[11px] font-semibold leading-tight">{f.title}</p>
                <p className="text-white/25 text-[9px] mt-0.5 font-mono">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Social login */}
        {(googleEnabled || githubEnabled || appleEnabled) && !isEmployeeRegister && (
          <div className="flex gap-2">
            {googleEnabled && (
              <button type="button" onClick={handleGoogleLogin} disabled={googleLoading}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 transition-all cursor-pointer"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              >
                <SiGoogle className="w-3.5 h-3.5 text-white/60" />
                <span className="text-white/55 text-[10px] font-medium">Google</span>
              </button>
            )}
            {githubEnabled && (
              <button type="button" onClick={handleGithubLogin} disabled={githubLoading}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 transition-all cursor-pointer"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              >
                <SiGithub className="w-3.5 h-3.5 text-white/60" />
                <span className="text-white/55 text-[10px] font-medium">GitHub</span>
              </button>
            )}
            {appleEnabled && (
              <button type="button" onClick={handleAppleLogin} disabled={appleLoading}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 transition-all cursor-pointer"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              >
                <SiApple className="w-3.5 h-3.5 text-white/60" />
                <span className="text-white/55 text-[10px] font-medium">Apple</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom bar ── */}
      <div className="relative z-10 px-10 pb-8 pt-4 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <p className="text-white/15 text-[9px] font-mono tracking-wider">QIROX © 2025 · v2.0</p>
        <div className="flex items-center gap-1.5">
          {["2FA", "AES-256", "TLS 1.3"].map(t => (
            <span key={t} className="text-[8px] font-mono text-white/20 px-1.5 py-0.5 rounded"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function Login() {
  const [location, setLocation] = useLocation();
  const { t, dir, lang } = useI18n();
  const ar = lang === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleCallbackHandled = useRef(false);
  const [githubEnabled, setGithubEnabled] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const githubCallbackHandled = useRef(false);
  const [appleEnabled, setAppleEnabled] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const appleCallbackHandled = useRef(false);

  const [phoneLoginOpen, setPhoneLoginOpen] = useState(false);
  const [phoneLoginStep, setPhoneLoginStep] = useState<"phone" | "otp">("phone");
  const [phoneLoginPhone, setPhoneLoginPhone] = useState("");
  const [phoneLoginOtp, setPhoneLoginOtp] = useState("");
  const [phoneLoginPending, setPhoneLoginPending] = useState(false);
  const [phoneLoginExpiry, setPhoneLoginExpiry] = useState<Date | null>(null);
  const [phoneLoginSecsLeft, setPhoneLoginSecsLeft] = useState(900);

  const isRegister = location === "/register" || location === "/employee/register-secret";
  const isEmployeeRegister = location === "/employee/register-secret";

  // Read ?redirect= param from URL and save to sessionStorage for post-login redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get("redirect");
    if (redirectTo && redirectTo.startsWith("/")) {
      try { sessionStorage.setItem("returnAfterLogin", redirectTo); } catch {}
      // Clean the param from URL without reload
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Handle QR login error redirects (?qr=invalid|denied|error)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qrStatus = params.get("qr");
    if (!qrStatus) return;
    window.history.replaceState({}, "", window.location.pathname);
    const messages: Record<string, { title: string; desc: string }> = {
      invalid: { title: "باركود غير صالح", desc: "رمز الباركود الذي مسحته غير موجود أو منتهي الصلاحية" },
      denied:  { title: "غير مسموح", desc: "هذا الحساب لا يملك صلاحية الدخول بالباركود" },
      error:   { title: "خطأ في تسجيل الدخول", desc: "حدث خطأ أثناء محاولة الدخول. حاول مجدداً أو سجّل الدخول يدوياً" },
    };
    const msg = messages[qrStatus] || messages.error;
    setTimeout(() => {
      toast({ title: msg.title, description: msg.desc, variant: "destructive" });
    }, 200);
  }, []);

  // Phone OTP login countdown timer
  useEffect(() => {
    if (!phoneLoginExpiry || phoneLoginStep !== "otp") return;
    const tick = () => setPhoneLoginSecsLeft(Math.max(0, Math.floor((phoneLoginExpiry.getTime() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phoneLoginExpiry, phoneLoginStep]);

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

  // Check if Apple Sign In is enabled on the server
  useEffect(() => {
    fetch("/api/auth/apple/status", { credentials: "include" })
      .then(r => r.json())
      .then(d => setAppleEnabled(!!d.enabled))
      .catch(() => {});
  }, []);

  // Handle Apple Sign In callback
  useEffect(() => {
    if (appleCallbackHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const appleToken = params.get("appleToken");
    const nextPath = params.get("next") || "/dashboard";
    if (!appleToken) {
      const appleError = params.get("error");
      if (appleError && appleError.includes("apple")) {
        toast({ title: "فشل تسجيل الدخول بـ Apple", description: "حدث خطأ أثناء الاتصال بـ Apple، حاول مرة أخرى", variant: "destructive" });
        window.history.replaceState({}, "", window.location.pathname);
      }
      return;
    }
    appleCallbackHandled.current = true;
    saveDeviceToken(appleToken);
    window.history.replaceState({}, "", window.location.pathname);
    setVerifyStep(null);
    queryClient.invalidateQueries({ queryKey: ["/api/user"] }).then(() => {
      setLocation(nextPath);
    });
  }, []);

  const handleAppleLogin = () => {
    setAppleLoading(true);
    window.location.href = "/api/auth/apple";
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

  const [twoFAExpiresAt, setTwoFAExpiresAt] = useState<number | null>(null);
  const [twoFASecondsLeft, setTwoFASecondsLeft] = useState(600);
  const [totpSecondsLeft, setTotpSecondsLeft] = useState(30);

  useEffect(() => {
    if (!twoFA || !twoFAExpiresAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((twoFAExpiresAt - Date.now()) / 1000));
      setTwoFASecondsLeft(remaining);
      const epoch = Math.floor(Date.now() / 1000);
      setTotpSecondsLeft(30 - (epoch % 30));
      if (remaining === 0) {
        setTwoFA(null);
        setTwoFAError("انتهت مهلة جلسة التحقق. يرجى تسجيل الدخول مجدداً");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [twoFA, twoFAExpiresAt]);

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

  const togglePhoneLogin = () => {
    if (phoneLoginOpen) {
      setPhoneLoginOpen(false);
      setPhoneLoginStep("phone");
      setPhoneLoginOtp("");
      setPhoneLoginExpiry(null);
    } else {
      setPhoneLoginOpen(true);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (phoneLoginPhone.replace(/\D/g, "").length < 10) {
      toast({ title: "أدخل رقم جوال صحيح مع رمز الدولة", variant: "destructive" });
      return;
    }
    setPhoneLoginPending(true);
    try {
      const r = await fetch("/api/auth/phone-otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneLoginPhone, method: "whatsapp" }),
      });
      const data = await r.json();
      if (data.error) { toast({ title: data.error, variant: "destructive" }); return; }
      const expiry = new Date(Date.now() + 15 * 60 * 1000);
      setPhoneLoginExpiry(expiry);
      setPhoneLoginSecsLeft(900);
      setPhoneLoginStep("otp");
    } catch {
      toast({ title: "حدث خطأ، حاول مرة أخرى", variant: "destructive" });
    } finally { setPhoneLoginPending(false); }
  };

  const handleVerifyPhoneOtp = async () => {
    if (phoneLoginOtp.length !== 6) return;
    setPhoneLoginPending(true);
    try {
      const r = await fetch("/api/auth/phone-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneLoginPhone, otp: phoneLoginOtp }),
      });
      const data = await r.json();
      if (data.error || !data.success) {
        toast({ title: data.error || "الرمز غير صحيح أو انتهت صلاحيته", variant: "destructive" });
        return;
      }
      queryClient.setQueryData(["/api/user"], data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      const ret = sessionStorage.getItem("returnAfterLogin");
      if (ret) { sessionStorage.removeItem("returnAfterLogin"); setLocation(ret); }
      else setLocation(data.user?.role === "client" ? "/dashboard" : "/admin");
    } catch {
      toast({ title: "حدث خطأ، حاول مرة أخرى", variant: "destructive" });
    } finally { setPhoneLoginPending(false); }
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
      const { confirmPassword, whatsappNumber, ...rest } = data;
      const userData = { ...rest, phone: whatsappNumber || undefined, whatsappNumber: whatsappNumber || undefined };
      register(userData, {
        onSuccess: (user: any) => {
          queryClient.setQueryData(["/api/user"], user);
          if (user.resent) {
            toast({
              title: "حسابك موجود — تم إعادة إرسال الرمز",
              description: "يوجد حساب غير مفعّل بهذه البيانات. أرسلنا رمزًا جديدًا إلى بريدك.",
            });
            // Skip face setup for resent accounts — go straight to email verification
            setLocation("/verify-email?flow=register");
            return;
          }
          // For client accounts — show face setup step first
          const redirectTo = user.email ? "/verify-email?flow=register" : (() => {
            const r = sessionStorage.getItem("returnAfterLogin");
            if (r) { sessionStorage.removeItem("returnAfterLogin"); return r; }
            return user.role === "client" ? "/dashboard" : "/admin";
          })();

          setLocation(redirectTo);
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
            setTwoFAExpiresAt(Date.now() + 10 * 60 * 1000);
            setTwoFASecondsLeft(600);
            const epoch = Math.floor(Date.now() / 1000);
            setTotpSecondsLeft(30 - (epoch % 30));
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
      <AuthPremiumPanel isRegister={isRegister} isEmployeeRegister={isEmployeeRegister}
        googleEnabled={googleEnabled} githubEnabled={githubEnabled} appleEnabled={appleEnabled}
        googleLoading={googleLoading} githubLoading={githubLoading} appleLoading={appleLoading}
        handleGoogleLogin={handleGoogleLogin} handleGithubLogin={handleGithubLogin} handleAppleLogin={handleAppleLogin}
      />

      {/* Right form area */}
      <div className="flex-1 flex flex-col items-center px-6 py-12 overflow-y-auto relative" style={{ justifyContent: "safe center" }}>

        {/* ── Decorative background layer ── */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {/* Dot grid */}
          <div className="absolute inset-0 opacity-[0.5]" style={{
            backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.055) 1.2px, transparent 1.2px)",
            backgroundSize: "26px 26px",
          }} />

          {/* Large circle rings — top-left corner */}
          <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full border border-black/[0.05]" />
          <div className="absolute -top-28 -left-28 w-[420px] h-[420px] rounded-full border border-black/[0.04]" />
          <div className="absolute -top-14 -left-14 w-[300px] h-[300px] rounded-full border border-black/[0.03]" />

          {/* Large circle rings — bottom-right corner */}
          <div className="absolute -bottom-40 -right-40 w-[480px] h-[480px] rounded-full border border-black/[0.04]" />
          <div className="absolute -bottom-24 -right-24 w-[340px] h-[340px] rounded-full border border-black/[0.03]" />

          {/* Hexagon — top right */}
          <svg className="absolute top-10 right-10 opacity-[0.045]" width="140" height="140" viewBox="0 0 140 140">
            <polygon points="70,6 126,37 126,103 70,134 14,103 14,37" fill="none" stroke="black" strokeWidth="1.5"/>
            <polygon points="70,24 110,46 110,94 70,116 30,94 30,46" fill="none" stroke="black" strokeWidth="0.8"/>
          </svg>

          {/* Hexagon — bottom left */}
          <svg className="absolute bottom-16 left-6 opacity-[0.035]" width="100" height="100" viewBox="0 0 100 100">
            <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="none" stroke="black" strokeWidth="1.5"/>
          </svg>

          {/* Diamond/square rotated — mid left */}
          <svg className="absolute top-1/2 -translate-y-1/2 -left-10 opacity-[0.03]" width="180" height="180" viewBox="0 0 180 180">
            <rect x="15" y="15" width="150" height="150" rx="8" fill="none" stroke="black" strokeWidth="1.5" transform="rotate(45 90 90)"/>
            <rect x="35" y="35" width="110" height="110" rx="6" fill="none" stroke="black" strokeWidth="0.8" transform="rotate(45 90 90)"/>
          </svg>

          {/* Accent line — top */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-black/10 to-transparent" />

          {/* QIROX large watermark letter */}
          <div className="absolute bottom-8 right-8 text-[180px] font-black text-black/[0.018] leading-none font-heading tracking-tight select-none">
            Q
          </div>

          {/* Small floating accent dots */}
          <div className="absolute top-1/3 right-[15%] w-2 h-2 rounded-full bg-black/[0.06]" />
          <div className="absolute top-1/3 right-[18%] w-1 h-1 rounded-full bg-black/[0.04]" />
          <div className="absolute top-[40%] left-[12%] w-1.5 h-1.5 rounded-full bg-black/[0.05]" />
          <div className="absolute bottom-1/3 left-[18%] w-2 h-2 rounded-full bg-black/[0.04]" />

          {/* Diagonal accent lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.025]" preserveAspectRatio="none">
            <line x1="0" y1="0" x2="30%" y2="60%" stroke="black" strokeWidth="0.8"/>
            <line x1="100%" y1="100%" x2="70%" y2="40%" stroke="black" strokeWidth="0.8"/>
          </svg>
        </div>
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <Link href="/">
            <div className="inline-block hover:opacity-85 transition-opacity">
              <img src="/qirox-logo-nobg.png" alt="QIROX" className="h-7 w-auto object-contain dark:invert" />
            </div>
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
              <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition-colors ${
                twoFASecondsLeft <= 60
                  ? "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border border-black/10 dark:border-white/10"
                  : twoFASecondsLeft <= 180
                    ? "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border border-black/10 dark:border-white/10"
                    : "bg-black/[0.04] text-black/40 border border-black/[0.08]"
              }`} data-testid="text-2fa-countdown">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${twoFASecondsLeft <= 60 ? "bg-black/[0.08] dark:bg-white/[0.1] animate-pulse" : twoFASecondsLeft <= 180 ? "bg-black/[0.08] dark:bg-white/[0.1] animate-pulse" : "bg-black/20"}`} />
                {String(Math.floor(twoFASecondsLeft / 60)).padStart(2, "0")}:{String(twoFASecondsLeft % 60).padStart(2, "0")}
              </div>
            </div>

            {twoFA.methods.length > 1 && (
              <div className={`mb-5 p-1 bg-black/[0.03] rounded-xl ${twoFA.methods.length >= 3 ? "grid grid-cols-2 gap-1" : "flex gap-1"}`}>
                {twoFA.methods.map(m => (
                  <button
                    key={m}
                    onClick={() => {
                      setTwoFAMethod(m); setTwoFACode(""); setTwoFAPassphrase(""); setTwoFAError("");
                      if (m !== "email") setEmailOtpSent(false);
                      if (m !== "push") { setPushStatus("idle"); setPushChallengeId(null); setPushNumber(null); }
                    }}
                    className={`py-2.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center leading-tight ${twoFAMethod === m ? "bg-black text-white shadow-sm" : "text-black/50 hover:text-black/70"}`}
                    data-testid={`tab-2fa-${m}`}
                  >
                    {m === "totp" ? "🔐 المصادقة" : m === "email" ? "📧 البريد" : m === "push" ? "🔔 إشعار الجهاز" : "🛡️ الاسترداد"}
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
                <div className="flex items-center gap-2.5 justify-center" data-testid="text-totp-timer">
                  <div className="relative w-5 h-5 flex-shrink-0">
                    <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" className="text-black/10" />
                      <circle
                        cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeDasharray={`${2 * Math.PI * 8}`}
                        strokeDashoffset={`${2 * Math.PI * 8 * (1 - totpSecondsLeft / 30)}`}
                        strokeLinecap="round"
                        className={`transition-all duration-1000 ${totpSecondsLeft <= 5 ? "text-black/70 dark:text-white/70" : "text-black/40"}`}
                      />
                    </svg>
                  </div>
                  <span className={`text-xs font-mono font-medium ${totpSecondsLeft <= 5 ? "text-black dark:text-white" : "text-black/40"}`}>
                    ينتهي الرمز خلال {totpSecondsLeft} ثانية
                  </span>
                </div>
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
                    {/* App logo + phone icon */}
                    <div className="relative inline-flex mx-auto">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border border-black/10 shadow-sm">
                        <img src="/icon-192.png" alt="QIROX" className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-black flex items-center justify-center border-2 border-white">
                        <Smartphone className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-black/70 font-medium mb-1">تأكيد عبر جهازك الموثوق</p>
                      <p className="text-xs text-black/40">سيُرسَل إشعار من QIROX لأجهزتك المسجّلة تُؤكّد فيه تسجيل الدخول</p>
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
                    {/* Push notification preview */}
                    <div className="bg-black/[0.04] rounded-2xl p-3 border border-black/[0.06] text-right flex items-start gap-3">
                      <img src="/icon-192.png" alt="QIROX" className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-black/10" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-black/80 mb-0.5">QIROX — محاولة تسجيل دخول</p>
                        <p className="text-[11px] text-black/50 leading-snug">جهاز جديد يحاول الدخول لحسابك · انقر للتأكيد أو الرفض</p>
                      </div>
                    </div>
                    <p className="text-xs text-black/50 font-medium">تأكد أن هذا الرقم يطابق ما يظهر على جهازك الآخر:</p>
                    {/* Big animated number */}
                    <motion.div
                      className="w-28 h-28 mx-auto rounded-3xl flex flex-col items-center justify-center border-2 border-black/10 bg-black/[0.02] gap-1"
                      animate={{ borderColor: ["rgba(0,0,0,0.08)", "rgba(0,0,0,0.25)", "rgba(0,0,0,0.08)"] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <span className="text-5xl font-black text-black tabular-nums leading-none" dir="ltr">{pushNumber}</span>
                      <span className="text-[10px] text-black/30 font-medium">الرمز</span>
                    </motion.div>
                    <div className="flex items-center justify-center gap-2 text-black/40">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs">في انتظار موافقتك على الجهاز الآخر...</span>
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
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black/[0.04] dark:bg-white/[0.06] mx-auto mb-3">
                      <X className="w-6 h-6 text-black dark:text-white" />
                    </div>
                    <p className="text-sm text-black dark:text-white font-medium mb-3">تم رفض طلب تسجيل الدخول</p>
                    <button onClick={() => { setPushStatus("idle"); setTwoFAError(""); }} className="text-xs text-black/40 hover:text-black/70 underline">المحاولة مجدداً</button>
                  </div>
                )}

                {pushStatus === "expired" && (
                  <div className="text-center py-4">
                    <p className="text-sm text-black dark:text-white mb-3">انتهت صلاحية الرمز</p>
                    <button onClick={() => { setPushStatus("idle"); setTwoFAError(""); }} className="text-xs text-black/40 hover:text-black/70 underline">المحاولة مجدداً</button>
                  </div>
                )}
              </div>
            )}

            {twoFAError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                <Alert variant="destructive" className="bg-black/[0.04] dark:bg-white/[0.06] border-black/10 dark:border-white/10 text-black dark:text-white rounded-xl">
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
            <div className="border rounded-xl px-4 py-3 mb-5 flex items-start gap-3 bg-black/[0.04] dark:bg-white/[0.06] border-black/10 dark:border-white/10">
              <span className="text-base mt-0.5 flex-shrink-0 text-black dark:text-white">⚠️</span>
              <div>
                <p className="text-black dark:text-white text-xs font-semibold mb-0.5">لم يصل البريد؟</p>
                <p className="text-black dark:text-white text-[11px] leading-relaxed">
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
                <Alert variant="destructive" className="bg-black/[0.04] dark:bg-white/[0.06] border-black/10 dark:border-white/10 text-black dark:text-white rounded-xl">
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
            {/* Brand mark above title */}
            <div className="flex items-center gap-2.5 mb-4">
              <Link href="/">
                <img src="/qirox-logo-nobg.png" alt="QIROX" className="h-5 w-auto object-contain opacity-30 hover:opacity-60 transition-opacity" />
              </Link>
              <div className="flex-1 h-px bg-gradient-to-l from-black/10 to-transparent" />
              <span className="text-[10px] font-mono font-bold text-black/20 tracking-widest uppercase">
                {isRegister ? "NEW ACCOUNT" : "SECURE LOGIN"}
              </span>
            </div>

            {/* Main title with decorative accent */}
            <div className="relative">
              {/* Vertical accent line */}
              <div className="absolute right-0 top-0 bottom-0 w-[3px] rounded-full bg-gradient-to-b from-black via-black/60 to-transparent" />
              <div className="pr-4">
                <h1 className="text-[2.1rem] font-black font-heading text-black leading-tight tracking-tight">
                  {isRegister
                    ? (isEmployeeRegister ? "تسجيل موظف" : "إنشاء حساب")
                    : "تسجيل الدخول"
                  }
                </h1>
                {isRegister && (
                  <span className="text-[2.1rem] font-black font-heading leading-tight tracking-tight text-black/25 block">
                    {isEmployeeRegister ? "جديد" : "جديد"}
                  </span>
                )}
                <p className="text-black/35 text-[13px] mt-1.5 leading-relaxed">
                  {isRegister
                    ? (isEmployeeRegister ? "حساب خاص بفريق QIROX الداخلي" : "أنشئ حسابك وابدأ فكرتك الخاصة اليوم")
                    : "أدخل بياناتك للوصول إلى لوحة تحكمك"
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">
                <Alert variant="destructive" className="bg-black/[0.04] dark:bg-white/[0.06] border-black/10 dark:border-white/10 text-black dark:text-white rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error.message}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Social OAuth Buttons */}
          {(googleEnabled || githubEnabled || appleEnabled) && !isEmployeeRegister && (
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

              {/* Apple Sign In Button */}
              {appleEnabled && (
                <motion.button
                  type="button"
                  onClick={handleAppleLogin}
                  disabled={appleLoading}
                  data-testid="btn-apple-login"
                  whileHover={!appleLoading ? { y: -2 } : {}}
                  whileTap={!appleLoading ? { y: 0, scale: 0.99 } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="w-full mt-3 relative overflow-hidden rounded-xl border border-black/[0.15] bg-black flex items-center gap-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.25)" }}
                >
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)", x: "-120%" }}
                    whileHover={{ x: "120%" }}
                    transition={{ duration: 0.45, ease: "easeInOut" }}
                  />
                  <div className="relative flex-shrink-0 w-[58px] h-[58px] flex items-center justify-center border-l border-white/10 bg-white/[0.06]">
                    {appleLoading ? (
                      <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <SiApple className="w-[24px] h-[24px] text-white" />
                    )}
                  </div>
                  <div className="flex-1 px-4 py-3.5 text-right">
                    <p className="text-white font-bold text-[14px] leading-snug">
                      {appleLoading ? "جارٍ الاتصال بـ Apple..." : isRegister ? "إنشاء حساب بـ Apple" : "تسجيل الدخول بـ Apple"}
                    </p>
                    {!appleLoading && (
                      <p className="text-white/40 text-[10.5px] font-medium mt-0.5">دخول سريع · آمن · بضغطة واحدة</p>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/[0.07]" />
                </motion.button>
              )}

              {/* QR Scan login */}
              {!isRegister && (
                <button
                  type="button"
                  onClick={() => setQrScannerOpen(true)}
                  className="mt-3 w-full flex items-center gap-3 rounded-xl border border-black/[0.1] bg-white hover:bg-black/[0.02] transition-colors p-3 text-right group"
                  data-testid="button-open-qr-scanner"
                >
                  <div className="relative flex-shrink-0 w-11 h-11 rounded-lg bg-black flex items-center justify-center">
                    <ScanLine className="w-5 h-5 text-white" />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <p className="text-black font-bold text-[13px] leading-snug">
                      {ar ? "تسجيل الدخول بالباركود" : "Sign in with QR badge"}
                    </p>
                    <p className="text-black/45 text-[10.5px] font-medium mt-0.5">
                      {ar ? "امسح بطاقة الموظف · بدون كلمة مرور" : "Scan your ID badge · no password"}
                    </p>
                  </div>
                  <QrCode className="w-4 h-4 text-black/40 group-hover:text-black transition-colors" />
                </button>
              )}

              {/* Phone Login — alongside Google/Apple/QR */}
              {!isRegister && (
                <motion.button
                  type="button"
                  onClick={togglePhoneLogin}
                  data-testid="btn-phone-login"
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.99 }}
                  className={`mt-3 w-full relative overflow-hidden rounded-xl border flex items-center gap-0 transition-all duration-200 ${
                    phoneLoginOpen
                      ? "border-emerald-400 bg-emerald-600"
                      : "border-emerald-100 bg-gradient-to-r from-emerald-50 to-green-50"
                  }`}
                >
                  <div className={`flex-shrink-0 w-[58px] h-[58px] flex items-center justify-center border-l ${phoneLoginOpen ? "border-emerald-500/40" : "border-emerald-100"}`}>
                    <Phone className={`w-5 h-5 ${phoneLoginOpen ? "text-white" : "text-emerald-600"}`} />
                  </div>
                  <div className="flex-1 px-4 py-3.5 text-right">
                    <p className={`font-bold text-[14px] leading-snug ${phoneLoginOpen ? "text-white" : "text-gray-800"}`}>دخول بالجوال</p>
                    <p className={`text-[10.5px] font-medium mt-0.5 ${phoneLoginOpen ? "text-white/60" : "text-emerald-600/70"}`}>
                      {phoneLoginOpen ? "اضغط للإلغاء والعودة" : "رمز واتساب · بدون كلمة مرور"}
                    </p>
                  </div>
                  <div className="px-4">
                    {phoneLoginOpen
                      ? <X className="w-4 h-4 text-white/70" />
                      : <ChevronLeft className="w-4 h-4 text-gray-300" />
                    }
                  </div>
                </motion.button>
              )}

              {!phoneLoginOpen && (
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex-1 h-px bg-black/[0.07]" />
                  <span className="text-xs text-black/30 font-medium">أو بالبريد وكلمة المرور</span>
                  <div className="flex-1 h-px bg-black/[0.07]" />
                </div>
              )}
            </div>
          )}

          {/* QR scanner shown even when no OAuth providers enabled */}
          {!isRegister && !(googleEnabled || githubEnabled || appleEnabled) && (
            <div className="mb-5">
              <button
                type="button"
                onClick={() => setQrScannerOpen(true)}
                className="w-full flex items-center gap-3 rounded-xl border border-black/[0.1] bg-white hover:bg-black/[0.02] transition-colors p-3 text-right group"
                data-testid="button-open-qr-scanner-alt"
              >
                <div className="relative flex-shrink-0 w-11 h-11 rounded-lg bg-black flex items-center justify-center">
                  <ScanLine className="w-5 h-5 text-white" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="flex-1">
                  <p className="text-black font-bold text-[13px] leading-snug">
                    {ar ? "تسجيل الدخول بالباركود" : "Sign in with QR badge"}
                  </p>
                  <p className="text-black/45 text-[10.5px] font-medium mt-0.5">
                    {ar ? "امسح بطاقة الموظف · بدون كلمة مرور" : "Scan your ID badge · no password"}
                  </p>
                </div>
                <QrCode className="w-4 h-4 text-black/40 group-hover:text-black transition-colors" />
              </button>
              {/* Phone Login — for non-OAuth section */}
              {!isRegister && (
                <motion.button
                  type="button"
                  onClick={togglePhoneLogin}
                  data-testid="btn-phone-login-alt"
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.99 }}
                  className={`mt-3 w-full relative overflow-hidden rounded-xl border flex items-center gap-0 transition-all duration-200 ${
                    phoneLoginOpen
                      ? "border-emerald-400 bg-emerald-600"
                      : "border-emerald-100 bg-gradient-to-r from-emerald-50 to-green-50"
                  }`}
                >
                  <div className={`flex-shrink-0 w-[58px] h-[58px] flex items-center justify-center border-l ${phoneLoginOpen ? "border-emerald-500/40" : "border-emerald-100"}`}>
                    <Phone className={`w-5 h-5 ${phoneLoginOpen ? "text-white" : "text-emerald-600"}`} />
                  </div>
                  <div className="flex-1 px-4 py-3.5 text-right">
                    <p className={`font-bold text-[14px] leading-snug ${phoneLoginOpen ? "text-white" : "text-gray-800"}`}>دخول بالجوال</p>
                    <p className={`text-[10.5px] font-medium mt-0.5 ${phoneLoginOpen ? "text-white/60" : "text-emerald-600/70"}`}>
                      {phoneLoginOpen ? "اضغط للإلغاء والعودة" : "رمز واتساب · بدون كلمة مرور"}
                    </p>
                  </div>
                  <div className="px-4">
                    {phoneLoginOpen ? <X className="w-4 h-4 text-white/70" /> : <ChevronLeft className="w-4 h-4 text-gray-300" />}
                  </div>
                </motion.button>
              )}

              {!phoneLoginOpen && (
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex-1 h-px bg-black/[0.07]" />
                  <span className="text-xs text-black/30 font-medium">أو بالبريد وكلمة المرور</span>
                  <div className="flex-1 h-px bg-black/[0.07]" />
                </div>
              )}
            </div>
          )}

          <QrLoginScanner open={qrScannerOpen} onClose={() => setQrScannerOpen(false)} />

          {/* Form OR Phone Panel */}
          {!phoneLoginOpen ? (
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
                    ? "text-black dark:text-white"
                    : detectedPhone
                    ? "text-black dark:text-white"
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
                            <span className={`w-1.5 h-1.5 rounded-full ${detectedEmail ? "bg-black/[0.08] dark:bg-white/[0.1]" : "bg-black/15 dark:bg-white/15"}`} />
                            <span className={`w-1.5 h-1.5 rounded-full ${detectedPhone ? "bg-black/[0.08] dark:bg-white/[0.1]" : "bg-black/15 dark:bg-white/15"}`} />
                            <span className={`w-1.5 h-1.5 rounded-full ${!detectedEmail && !detectedPhone && v ? "bg-black/[0.08] dark:bg-white/[0.1]" : "bg-black/15 dark:bg-white/15"}`} />
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
                          <span className="text-black/30 text-[10px] font-normal">(اختياري)</span>
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
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                          <Input
                            type={showPw ? "text" : "password"}
                            placeholder="••••••••"
                            autoComplete={isRegister ? "new-password" : "current-password"}
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
                        {!isRegister && (
                          <BiometricButton prefillIdentifier={form.watch("username") || ""} />
                        )}
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
                            autoComplete="new-password"
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
                <QuickPinButton prefillIdentifier={form.watch("username") || ""} />
              )}
            </form>
          </Form>
          ) : (
          /* ── Phone OTP Panel ── */
          <div className="space-y-4">
            <button type="button"
              onClick={togglePhoneLogin}
              className="flex items-center gap-1.5 text-xs text-black/40 hover:text-black/70 transition-colors -mb-1">
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة لتسجيل الدخول بكلمة المرور</span>
            </button>

            {phoneLoginStep === "phone" && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-black/50 mb-2">رقم الجوال مع رمز الدولة</p>
                  <CountryPhoneInput value={phoneLoginPhone} onChange={setPhoneLoginPhone} placeholder="5XXXXXXXX" />
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-emerald-700 leading-relaxed">سيصلك رمز التحقق عبر رسالة واتساب وبريدك الإلكتروني المسجّل</p>
                </div>
                <Button type="button" onClick={handleSendPhoneOtp}
                  disabled={phoneLoginPending || phoneLoginPhone.replace(/\D/g, "").length < 10}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm gap-2"
                  data-testid="btn-send-phone-otp">
                  {phoneLoginPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><MessageSquare className="w-4 h-4" /> إرسال رمز التحقق</>
                  }
                </Button>
              </div>
            )}

            {phoneLoginStep === "otp" && (
              <div className="space-y-3">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                  <p className="text-[11px] text-emerald-600 mb-1">تم إرسال الرمز عبر واتساب وبريدك الإلكتروني</p>
                  <p className="font-mono text-sm font-bold text-black/70" dir="ltr">{phoneLoginPhone}</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-black/50">رمز التحقق (6 أرقام)</p>
                    <span className={`text-xs font-mono font-bold tabular-nums ${phoneLoginSecsLeft < 60 ? "text-red-500" : "text-black/30"}`}>
                      {String(Math.floor(phoneLoginSecsLeft / 60)).padStart(2, "0")}:{String(phoneLoginSecsLeft % 60).padStart(2, "0")}
                    </span>
                  </div>
                  <Input
                    value={phoneLoginOtp}
                    onChange={e => setPhoneLoginOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="______"
                    className="h-14 text-2xl font-mono tracking-[0.4em] text-center bg-white border-black/[0.08] rounded-xl"
                    type="text" inputMode="numeric" dir="ltr"
                    data-testid="input-phone-otp" autoFocus
                    onKeyDown={e => e.key === "Enter" && phoneLoginOtp.length === 6 && handleVerifyPhoneOtp()}
                  />
                </div>
                <Button type="button" onClick={handleVerifyPhoneOtp}
                  disabled={phoneLoginOtp.length !== 6 || phoneLoginPending}
                  className="w-full h-12 bg-black hover:bg-black/80 text-white rounded-xl font-bold text-sm gap-2"
                  data-testid="btn-phone-otp-verify">
                  {phoneLoginPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><CheckCircle2 className="w-4 h-4" /> تأكيد الرمز والدخول</>
                  }
                </Button>
                {phoneLoginSecsLeft === 0 && (
                  <Button type="button" onClick={handleSendPhoneOtp} disabled={phoneLoginPending}
                    variant="outline" className="w-full h-10 rounded-xl text-sm gap-1.5">
                    {phoneLoginPending
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <><RefreshCw className="w-3.5 h-3.5" /> إعادة إرسال الرمز</>
                    }
                  </Button>
                )}
                <button type="button"
                  onClick={() => { setPhoneLoginStep("phone"); setPhoneLoginOtp(""); setPhoneLoginExpiry(null); }}
                  className="w-full text-center text-xs text-black/30 hover:text-black/50 py-1 transition-colors">
                  تغيير رقم الجوال
                </button>
              </div>
            )}
          </div>
          )}


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

      {/* ── Mobile-only fixed bottom brand bar ── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 overflow-hidden" style={{ height: "44px" }}>
        {/* Dark background */}
        <div className="absolute inset-0 bg-[#030508]" />
        {/* Green grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "linear-gradient(#00ff41 1px, transparent 1px), linear-gradient(90deg, #00ff41 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />
        {/* Top border glow */}
        <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,255,65,0.4), transparent)" }} />
        {/* Content */}
        <div className="relative z-10 h-full flex items-center justify-between px-5">
          <Link href="/">
            <img src="/qirox-logo-nobg.png" alt="QIROX" className="h-4 w-auto object-contain invert opacity-50" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-[#00ff41]/50 tracking-widest">SYSTEMS FACTORY</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff41] opacity-60 animate-pulse" />
          </div>
        </div>
      </div>

    </div>
  );
}
