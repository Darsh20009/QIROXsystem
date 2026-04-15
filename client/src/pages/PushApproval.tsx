import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Check, X, Smartphone, AlertTriangle, Lock, Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";

function useQueryParam(key: string) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

function generateDistractors(correct: number): number[] {
  const nums = new Set<number>();
  nums.add(correct);
  while (nums.size < 3) {
    const n = Math.floor(10 + Math.random() * 90);
    if (n !== correct) nums.add(n);
  }
  const arr = Array.from(nums);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

type ChallengeStatus = "loading" | "pending" | "approved" | "denied" | "expired" | "error";

export default function PushApproval() {
  const challengeId = useQueryParam("id");
  const { data: user } = useUser();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const [, navigate] = useLocation();

  const [status, setStatus] = useState<ChallengeStatus>("loading");
  const [correctNumber, setCorrectNumber] = useState<number | null>(null);
  const [responding, setResponding] = useState(false);
  const [selectedNum, setSelectedNum] = useState<number | null>(null);
  const [error, setError] = useState("");

  const choices = useMemo(
    () => (correctNumber !== null ? generateDistractors(correctNumber) : []),
    [correctNumber]
  );

  const loadChallenge = useCallback(async () => {
    if (!challengeId) { setStatus("error"); setError(L ? "رمز التحقق مفقود" : "Missing challenge ID"); return; }
    try {
      const res = await fetch(`/api/auth/push-challenge/status/${challengeId}`, { credentials: "include" });
      if (res.status === 404 || res.status === 410) { setStatus("expired"); return; }
      if (!res.ok) { setStatus("error"); return; }
      const data = await res.json();
      setCorrectNumber(data.number);
      if (data.status === "approved") { setStatus("approved"); return; }
      if (data.status === "denied") { setStatus("denied"); return; }
      setStatus("pending");
    } catch {
      setStatus("error");
      setError(L ? "خطأ في الاتصال" : "Connection error");
    }
  }, [challengeId]);

  useEffect(() => { loadChallenge(); }, [loadChallenge]);

  const handleSelect = async (num: number) => {
    if (!challengeId || responding || correctNumber === null) return;
    setSelectedNum(num);
    setResponding(true);

    const action = num === correctNumber ? "approve" : "deny";
    try {
      const res = await fetch("/api/auth/push-challenge/respond", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, action }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || (L ? "حدث خطأ" : "An error occurred")); setResponding(false); setSelectedNum(null); return; }
      setStatus(action === "approve" ? "approved" : "denied");
    } catch {
      setError(L ? "خطأ في الاتصال" : "Connection error");
      setResponding(false);
      setSelectedNum(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-gray-900 flex items-center justify-center p-6" dir={dir}>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-8 max-w-sm w-full text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-amber-300 font-bold">{L ? "يجب تسجيل الدخول لتأكيد هذا الطلب" : "You must be logged in to approve this request"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-gray-900 flex flex-col items-center justify-center px-4 py-10" dir={dir}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <div className="relative inline-flex mx-auto mb-4">
          <div className="w-16 h-16 rounded-3xl overflow-hidden border border-white/[0.15] shadow-2xl">
            <img src="/icon-192.png" alt="QIROX" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center border-2 border-gray-950 shadow-lg">
            <Shield className="w-3.5 h-3.5 text-amber-900" />
          </div>
        </div>
        <h1 className="text-2xl font-black text-white">{L ? "تأكيد تسجيل الدخول" : "Confirm Login"}</h1>
        <p className="text-white/40 text-sm mt-1">{L ? "جهاز جديد يحاول الدخول إلى حسابك" : "A new device is trying to access your account"}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="w-full max-w-sm">
        <AnimatePresence mode="wait">

          {/* Loading */}
          {status === "loading" && (
            <motion.div key="loading" className="bg-white/[0.06] border border-white/[0.1] rounded-3xl p-10 text-center">
              <Loader2 className="w-8 h-8 text-white/40 mx-auto animate-spin" />
            </motion.div>
          )}

          {/* Pending — 3-number selection UI */}
          {status === "pending" && correctNumber !== null && (
            <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

              {/* Instruction card */}
              <div className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-3xl p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 pointer-events-none rounded-3xl" />

                <div className="flex items-center justify-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-white/40 flex-shrink-0" />
                  <p className="text-white/40 text-xs">{L ? "مرحباً " + (user?.fullName || user?.username) : "Hi " + (user?.fullName || user?.username)}</p>
                </div>

                <p className="text-white font-bold text-base mb-1">
                  {L ? "اختر الرقم الظاهر على الجهاز الجديد" : "Tap the number shown on the new device"}
                </p>
                <p className="text-white/40 text-xs leading-relaxed">
                  {L
                    ? "انظر إلى الجهاز الذي تحاول تسجيل الدخول منه، واختر الرقم المطابق"
                    : "Look at the device trying to log in and tap the matching number"}
                </p>
              </div>

              {/* 3-number grid */}
              <div className="grid grid-cols-3 gap-3">
                {choices.map((num) => {
                  const isSelected = selectedNum === num;
                  const isCorrect = num === correctNumber;
                  return (
                    <motion.button
                      key={num}
                      onClick={() => handleSelect(num)}
                      disabled={responding}
                      whileTap={{ scale: 0.94 }}
                      data-testid={`button-push-number-${num}`}
                      className={`h-20 rounded-2xl font-black text-3xl flex items-center justify-center transition-all relative overflow-hidden disabled:cursor-not-allowed
                        ${isSelected
                          ? isCorrect
                            ? "bg-green-500/30 border-2 border-green-400"
                            : "bg-red-500/20 border-2 border-red-400"
                          : "bg-white/[0.07] border border-white/[0.12] hover:bg-white/[0.12] hover:border-white/[0.25]"
                        }
                      `}
                      style={!isSelected ? {
                        background: "linear-gradient(135deg, rgba(14,165,233,0.08), rgba(124,58,237,0.08))",
                      } : undefined}
                    >
                      {isSelected && responding ? (
                        <Loader2 className="w-6 h-6 animate-spin text-white/60" />
                      ) : (
                        <span className="text-white tabular-nums" dir="ltr">{num}</span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {error && <p className="text-red-400 text-xs text-center mt-2">{error}</p>}

              {/* Deny option */}
              <motion.button
                onClick={() => handleSelect(-1)}
                disabled={responding}
                whileTap={{ scale: 0.97 }}
                data-testid="button-push-deny"
                className="w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all bg-white/[0.04] border border-white/[0.06] text-red-400/70 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 disabled:opacity-40"
              >
                <X className="w-4 h-4" />
                {L ? "لم أكن أنا — رفض الطلب" : "Not me — Deny this request"}
              </motion.button>

              {/* Security warning */}
              <div className="flex items-start gap-2 px-1">
                <Lock className="w-3.5 h-3.5 text-amber-400/60 flex-shrink-0 mt-0.5" />
                <p className="text-white/25 text-[11px] leading-relaxed">
                  {L
                    ? "إذا لم تكن أنت من يحاول الدخول، انقر رفض الطلب وغيّر كلمة مرورك فوراً."
                    : "If you didn't try to log in, tap Deny and change your password immediately."}
                </p>
              </div>
            </motion.div>
          )}

          {/* Approved */}
          {status === "approved" && (
            <motion.div key="approved" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-green-500/10 border border-green-500/20 rounded-3xl p-10 text-center">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
              >
                <Check className="w-8 h-8 text-green-400" />
              </motion.div>
              <h2 className="text-green-300 font-black text-lg mb-1">{L ? "تم التأكيد ✓" : "Approved ✓"}</h2>
              <p className="text-green-400/60 text-sm">{L ? "تم السماح للجهاز الجديد بالدخول بنجاح." : "The new device has been granted access."}</p>
              <button onClick={() => navigate("/dashboard")} className="mt-6 px-6 py-2.5 rounded-xl bg-green-500/20 text-green-300 text-sm font-bold hover:bg-green-500/30 transition-all">
                {L ? "العودة للوحة التحكم" : "Back to Dashboard"}
              </button>
            </motion.div>
          )}

          {/* Denied */}
          {status === "denied" && (
            <motion.div key="denied" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/20 rounded-3xl p-10 text-center">
              <X className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h2 className="text-red-300 font-black text-lg mb-1">{L ? "تم رفض الطلب" : "Request Denied"}</h2>
              <p className="text-red-400/60 text-sm mb-5">{L ? "لم يُسمح للجهاز الجديد بالدخول." : "The new device was not granted access."}</p>
              <button onClick={() => navigate("/dashboard")} className="px-6 py-2.5 rounded-xl bg-white/10 text-white text-sm font-bold hover:bg-white/20 transition-all">
                {L ? "العودة للوحة التحكم" : "Back to Dashboard"}
              </button>
            </motion.div>
          )}

          {/* Expired / Error */}
          {(status === "expired" || status === "error") && (
            <motion.div key="expired" className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-8 text-center">
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <p className="text-amber-300 font-bold">{status === "expired" ? (L ? "انتهت صلاحية الرمز" : "Challenge expired") : (error || (L ? "حدث خطأ" : "An error occurred"))}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
