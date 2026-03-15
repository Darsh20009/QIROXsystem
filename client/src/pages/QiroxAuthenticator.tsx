import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Smartphone, Copy, Check, RefreshCw, Lock, ChevronRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const STEP = 15;

function CountdownRing({ secondsLeft }: { secondsLeft: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const progress = secondsLeft / STEP;
  const offset = circ * (1 - progress);
  const hue = Math.floor(progress * 120);
  const color = `hsl(${hue}, 72%, 45%)`;

  return (
    <svg width="112" height="112" viewBox="0 0 112 112" className="absolute inset-0">
      <circle cx="56" cy="56" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="6" />
      <circle
        cx="56" cy="56" r={r} fill="none"
        stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 56 56)"
        style={{ transition: "stroke-dashoffset 0.4s linear, stroke 0.4s ease" }}
      />
    </svg>
  );
}

export default function QiroxAuthenticator() {
  const { data: user } = useUser();
  const { toast } = useToast();

  const [code, setCode] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(STEP);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCode = useCallback(async () => {
    try {
      const res = await fetch("/api/totp/current-code", { credentials: "include" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "خطأ في جلب الرمز");
        setCode(null);
        return;
      }
      const data = await res.json();
      setCode(data.code);
      setSecondsLeft(data.secondsLeft);
      setError(null);
    } catch {
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCode();
  }, [fetchCode]);

  useEffect(() => {
    if (!code) return;
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          fetchCode();
          return STEP;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [code, fetchCode]);

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast({ title: "تم نسخ الرمز" });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const digits = code ? code.split("") : ["–", "–", "–", "–", "–", "–"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-gray-900 flex flex-col items-center justify-center px-4 py-10" dir="rtl">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="w-16 h-16 bg-white/[0.08] rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/[0.12]">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Qirox Authenticator</h1>
        <p className="text-white/40 text-sm mt-1.5">رمز التحقق الثنائي — يتجدد كل {STEP} ثانية</p>
      </motion.div>

      {/* Code card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm"
      >
        {error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-red-300 font-bold text-sm mb-2">{error}</p>
            {error.includes("مفعّل") && (
              <p className="text-red-400/60 text-xs mb-5">يجب تفعيل المصادق الثنائي أولاً من إعدادات الأمان</p>
            )}
            {error.includes("مفعّل") ? (
              <Link href="/security/2fa">
                <Button size="sm" className="bg-white text-black hover:bg-white/90 rounded-xl">
                  تفعيل المصادق الثنائي
                  <ChevronRight className="w-3.5 h-3.5 mr-1" />
                </Button>
              </Link>
            ) : (
              <Button
                size="sm"
                onClick={fetchCode}
                className="bg-white/10 text-white hover:bg-white/20 rounded-xl"
              >
                <RefreshCw className="w-3.5 h-3.5 ml-1.5" />
                إعادة المحاولة
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-3xl p-8 text-center relative overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none rounded-3xl" />

            {/* Countdown ring */}
            <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
              <CountdownRing secondsLeft={secondsLeft} />
              <div className="relative z-10 text-center">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={secondsLeft}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`text-3xl font-black tabular-nums ${secondsLeft <= 5 ? "text-red-400" : secondsLeft <= 8 ? "text-amber-400" : "text-white"}`}
                  >
                    {loading ? "–" : secondsLeft}
                  </motion.span>
                </AnimatePresence>
                <p className="text-[9px] text-white/30 font-medium mt-0.5">ثانية</p>
              </div>
            </div>

            {/* 6-digit code */}
            <div className="flex items-center justify-center gap-1.5 mb-6">
              {digits.map((d, i) => (
                <motion.div
                  key={`${code}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`w-10 h-14 rounded-xl flex items-center justify-center text-2xl font-black tabular-nums border transition-all duration-300 ${
                    loading
                      ? "bg-white/[0.04] border-white/[0.06] text-white/20"
                      : secondsLeft <= 5
                      ? "bg-red-500/10 border-red-500/20 text-red-300"
                      : "bg-white/[0.08] border-white/[0.12] text-white"
                  } ${i === 2 ? "ml-2" : ""}`}
                >
                  {loading ? <div className="w-3 h-3 rounded-full bg-white/20 animate-pulse" /> : d}
                </motion.div>
              ))}
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              disabled={loading || !code}
              className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/[0.1] text-white text-sm font-semibold transition-all disabled:opacity-40"
              data-testid="button-copy-auth-code"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "تم النسخ" : "نسخ الرمز"}
            </button>

            {/* Refresh button */}
            <button
              onClick={fetchCode}
              className="flex items-center gap-1.5 mx-auto mt-3 text-xs text-white/30 hover:text-white/60 transition-colors"
              data-testid="button-refresh-code"
            >
              <RefreshCw className="w-3 h-3" />
              تحديث يدوي
            </button>
          </div>
        )}
      </motion.div>

      {/* Instructions card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="w-full max-w-sm mt-5 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <Smartphone className="w-4 h-4 text-white/50" />
          <p className="text-white/70 text-sm font-bold">كيف تستخدم المصادق؟</p>
        </div>
        <ol className="space-y-3 text-right">
          {[
            { num: "١", text: "افتح Qirox على الجهاز الذي أنت مسجّل فيه (كالجوال)" },
            { num: "٢", text: "انتقل لصفحة المصادق — ستظهر هذه الصفحة بكودها الحالي" },
            { num: "٣", text: "على الجهاز الجديد (كاللابتوب)، أدخل الكود في خانة التحقق الثنائي" },
            { num: "٤", text: "الكود يتجدد كل 15 ثانية — أدخله قبل انتهاء العداد" },
          ].map(step => (
            <li key={step.num} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-white/10 text-white/70 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{step.num}</span>
              <span className="text-white/50 text-xs leading-relaxed">{step.text}</span>
            </li>
          ))}
        </ol>
      </motion.div>

      {/* Security note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-5 flex items-center gap-2 text-white/25 text-xs"
      >
        <Lock className="w-3.5 h-3.5" />
        <span>الرمز خاص بك — لا تشاركه مع أي شخص آخر</span>
      </motion.div>

      {/* Back link */}
      <Link href="/dashboard" className="mt-8 text-white/25 text-xs hover:text-white/50 transition-colors">
        ← العودة للوحة التحكم
      </Link>
    </div>
  );
}
