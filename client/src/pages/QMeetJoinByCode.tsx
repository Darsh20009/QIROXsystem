// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Video, Loader2, CheckCircle2, XCircle, Clock,
  Users, Calendar, Timer, Shield, Wifi
} from "lucide-react";

type Step = "enter_code" | "meeting_info" | "pending" | "approved" | "rejected";

interface MeetingInfo {
  id: string;
  title: string;
  hostName: string;
  scheduledAt: string;
  status: string;
  durationMinutes: number;
  joinCode: string;
}

function getOrCreateGuestId(): string {
  let id = sessionStorage.getItem("qmeet_guest_id");
  if (!id) {
    id = "guest_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("qmeet_guest_id", id);
  }
  return id;
}

function formatWaitTime(seconds: number): string {
  if (seconds < 60) return `${seconds} ثانية`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m} د ${s} ث` : `${m} دقيقة`;
}

export default function QMeetJoinByCode() {
  const { data: user } = useUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("enter_code");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [meetingInfo, setMeetingInfo] = useState<MeetingInfo | null>(null);
  const [meetingLink, setMeetingLink] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const autoLookupDoneRef = useRef(false);

  // Waiting room timer
  const [waitSeconds, setWaitSeconds] = useState(0);
  const waitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-join countdown when approved
  const [autoJoinCount, setAutoJoinCount] = useState(4);
  const autoJoinRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const effectiveUserId = user ? (user._id || user.id) : getOrCreateGuestId();

  // Auto-fill code from URL ?code= param
  useEffect(() => {
    if (autoLookupDoneRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const urlCode = (params.get("code") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    if (urlCode.length === 6) {
      autoLookupDoneRef.current = true;
      setCode(urlCode);
      setLoading(true);
      fetch(`/api/qmeet/by-code/${urlCode}`)
        .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(new Error(e.message || "كود غير صحيح"))))
        .then(data => { setMeetingInfo(data); setStep("meeting_info"); })
        .catch(err => toast({ title: "خطأ", description: err?.message || "كود غير صحيح", variant: "destructive" }))
        .finally(() => setLoading(false));
    }
  }, [toast]);

  // Start waiting timer when entering pending state
  useEffect(() => {
    if (step === "pending") {
      setWaitSeconds(0);
      waitTimerRef.current = setInterval(() => setWaitSeconds(s => s + 1), 1000);
    } else {
      if (waitTimerRef.current) clearInterval(waitTimerRef.current);
    }
    return () => { if (waitTimerRef.current) clearInterval(waitTimerRef.current); };
  }, [step]);

  // Auto-join countdown when approved
  useEffect(() => {
    if (step === "approved" && meetingLink) {
      setAutoJoinCount(4);
      autoJoinRef.current = setInterval(() => {
        setAutoJoinCount(c => {
          if (c <= 1) {
            clearInterval(autoJoinRef.current!);
            navigate(meetingLink);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => { if (autoJoinRef.current) clearInterval(autoJoinRef.current); };
  }, [step, meetingLink, navigate]);

  // WebSocket for approval/rejection notification
  useEffect(() => {
    if (step !== "pending") return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => ws.send(JSON.stringify({ type: "auth", userId: effectiveUserId }));

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "qmeet_join_response") {
          if (data.approved) {
            setMeetingLink(data.meetingLink);
            setStep("approved");
          } else {
            setStep("rejected");
          }
          ws.close();
        }
      } catch {}
    };

    return () => ws.close();
  }, [step, effectiveUserId]);

  const handleCodeInput = (val: string) => {
    setCode(val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
  };

  const lookupCode = async () => {
    if (code.length !== 6) {
      toast({ title: "الكود يجب أن يكون 6 أحرف", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/qmeet/by-code/${code}`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "كود غير صحيح");
      setMeetingInfo(await res.json());
      setStep("meeting_info");
    } catch (err: any) {
      toast({ title: "خطأ", description: err?.message || "كود غير صحيح أو الاجتماع غير متاح", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const requestJoin = async () => {
    if (!meetingInfo) return;
    if (!user && !guestName.trim()) {
      toast({ title: "مطلوب", description: "أدخل اسمك قبل الانضمام", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (!user) {
        sessionStorage.setItem("qmeet_guest_name", guestName.trim());
        sessionStorage.setItem("qmeet_guest_id", effectiveUserId);
      }
      const body: any = !user ? { guestName: guestName.trim(), guestId: effectiveUserId } : {};
      const res = await fetch(`/api/qmeet/by-code/${code}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "حدث خطأ");
      if (data.status === "approved") { setMeetingLink(data.meetingLink); setStep("approved"); }
      else if (data.status === "pending") setStep("pending");
    } catch (err: any) {
      toast({ title: "خطأ", description: err?.message || "حدث خطأ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    live: "bg-green-500/20 text-green-300 border-green-500/30",
    completed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  const statusLabels: Record<string, string> = { scheduled: "مجدول", live: "مباشر الآن", completed: "انتهى" };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" dir="rtl"
      style={{ background: "linear-gradient(160deg, #060c18 0%, #080e1a 50%, #060c18 100%)" }}>
      <div className="w-full max-w-md space-y-6">

        {/* Logo */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}>
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">QMeet</h1>
          <p className="text-white/40 text-sm mt-1">انضم باستخدام كود الاجتماع</p>
        </div>

        {/* ─── Enter Code ─── */}
        {step === "enter_code" && (
          <div className="rounded-2xl p-6 space-y-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="space-y-2">
              <label className="text-white/70 text-sm font-medium block">كود الاجتماع (6 أحرف)</label>
              <Input
                value={code}
                onChange={(e) => handleCodeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && code.length === 6 && lookupCode()}
                placeholder="مثال: QM4X7B"
                className="text-center text-2xl font-mono tracking-[0.4em] h-14 placeholder:text-gray-600 placeholder:tracking-normal"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                maxLength={6}
                data-testid="input-join-code"
                autoFocus
              />
              <div className="flex gap-1.5 justify-center mt-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ background: i < code.length ? "#3b82f6" : "rgba(255,255,255,0.1)" }} />
                ))}
              </div>
            </div>
            <Button
              onClick={lookupCode}
              disabled={code.length !== 6 || loading}
              className="w-full h-12 text-white font-bold text-base"
              style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
              data-testid="button-lookup-code"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "بحث عن الاجتماع"}
            </Button>
            <button onClick={() => navigate("/dashboard")} className="w-full text-white/30 hover:text-white/60 text-sm transition-colors text-center">
              رجوع للرئيسية
            </button>
          </div>
        )}

        {/* ─── Meeting Info ─── */}
        {step === "meeting_info" && meetingInfo && (
          <div className="rounded-2xl p-6 space-y-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Badge className={`text-xs mb-2 border ${statusColors[meetingInfo.status] || statusColors.scheduled}`}>
                  {statusLabels[meetingInfo.status] || meetingInfo.status}
                </Badge>
                <h2 className="text-white text-lg font-bold leading-tight">{meetingInfo.title}</h2>
              </div>
              <div className="rounded-xl px-3 py-2 text-center shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] text-white/40">كود</p>
                <p className="text-white font-mono font-bold text-sm tracking-widest">{meetingInfo.joinCode}</p>
              </div>
            </div>

            <div className="space-y-2.5 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-3 text-white/60 text-sm">
                <Users className="w-4 h-4 shrink-0 text-blue-400" />
                <span>المضيف: <span className="text-white/90 font-medium">{meetingInfo.hostName}</span></span>
              </div>
              <div className="flex items-center gap-3 text-white/60 text-sm">
                <Calendar className="w-4 h-4 shrink-0 text-blue-400" />
                <span>{new Date(meetingInfo.scheduledAt).toLocaleString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="flex items-center gap-3 text-white/60 text-sm">
                <Timer className="w-4 h-4 shrink-0 text-blue-400" />
                <span>المدة: <span className="text-white/80">{meetingInfo.durationMinutes} دقيقة</span></span>
              </div>
            </div>

            <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <Shield className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-amber-300/90 text-xs leading-relaxed">
                الاجتماع محمي — سيُشعَر المضيف بطلبك ويقرر قبوله أو رفضه.
              </p>
            </div>

            {!user && (
              <div>
                <label className="text-white/60 text-xs font-medium block mb-1.5">اسمك <span className="text-red-400">*</span></label>
                <Input
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  placeholder="أدخل اسمك ليظهر للمضيف"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                  className="placeholder:text-gray-500"
                  data-testid="input-guest-name"
                  autoFocus
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={requestJoin}
                disabled={loading || (!user && !guestName.trim())}
                className="flex-1 h-11 text-white font-bold"
                style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
                data-testid="button-request-join"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "طلب الانضمام"}
              </Button>
              <Button
                onClick={() => setStep("enter_code")}
                className="border-white/10 text-white/50 hover:bg-white/5 h-11"
                variant="outline"
                data-testid="button-back-code"
              >
                تغيير
              </Button>
            </div>
          </div>
        )}

        {/* ─── Pending (Professional Waiting Room) ─── */}
        {step === "pending" && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* Header bar */}
            <div className="px-5 py-3 flex items-center gap-2.5 border-b border-white/[0.06]" style={{ background: "rgba(245,158,11,0.08)" }}>
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-300 text-xs font-semibold">صالة الانتظار</span>
              <span className="mr-auto text-white/30 text-xs font-mono">{formatWaitTime(waitSeconds)}</span>
            </div>

            <div className="p-8 space-y-7 text-center">
              {/* Animated rings */}
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-amber-500/30 animate-ping" style={{ animationDuration: "2s" }} />
                <div className="absolute inset-2 rounded-full border-2 border-amber-500/40 animate-ping" style={{ animationDuration: "2.4s", animationDelay: "0.4s" }} />
                <div className="absolute inset-4 rounded-full flex items-center justify-center" style={{ background: "rgba(245,158,11,0.15)", border: "2px solid rgba(245,158,11,0.4)" }}>
                  <Clock className="w-8 h-8 text-amber-400" />
                </div>
              </div>

              {/* Text */}
              <div className="space-y-2">
                <h2 className="text-white text-xl font-bold">في انتظار موافقة المضيف</h2>
                <p className="text-white/50 text-sm leading-relaxed">
                  تم إرسال طلبك إلى المضيف. ستنتقل تلقائياً للاجتماع فور الموافقة.
                </p>
              </div>

              {/* Meeting info card */}
              {meetingInfo && (
                <div className="rounded-xl p-3.5 text-right" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-white font-semibold text-sm truncate">{meetingInfo.title}</p>
                  <p className="text-white/40 text-xs mt-1">المضيف: {meetingInfo.hostName}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-amber-400/80 text-xs">في انتظار الموافقة...</span>
                  </div>
                </div>
              )}

              {/* Live connection indicator */}
              <div className="flex items-center justify-center gap-2 text-white/25 text-xs">
                <Wifi className="w-3.5 h-3.5" />
                <span>متصل ببث مباشر — لا تغلق الصفحة</span>
              </div>

              {/* Bouncing dots */}
              <div className="flex gap-2 justify-center">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}
                    className="w-1.5 h-1.5 rounded-full bg-amber-500"
                    style={{ animation: `bounce 1.2s infinite`, animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Approved ─── */}
        {step === "approved" && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="px-5 py-3 flex items-center gap-2.5 border-b border-white/[0.06]" style={{ background: "rgba(22,163,74,0.1)" }}>
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-xs font-semibold">تمت الموافقة على انضمامك</span>
            </div>
            <div className="p-8 space-y-6 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                style={{ background: "rgba(22,163,74,0.15)", border: "2px solid rgba(74,222,128,0.4)" }}>
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <div>
                <h2 className="text-white text-xl font-bold mb-1">مرحباً بك!</h2>
                <p className="text-white/50 text-sm">وافق المضيف على انضمامك</p>
                {meetingInfo && <p className="text-white/30 text-xs mt-2">{meetingInfo.title}</p>}
              </div>
              <Button
                onClick={() => meetingLink && navigate(meetingLink)}
                className="w-full h-12 text-white font-bold text-base relative"
                style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
                data-testid="button-join-now"
              >
                <Video className="w-5 h-5 ml-2" />
                ادخل الاجتماع
                <span className="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/20 text-xs font-bold flex items-center justify-center">
                  {autoJoinCount}
                </span>
              </Button>
            </div>
          </div>
        )}

        {/* ─── Rejected ─── */}
        {step === "rejected" && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="px-5 py-3 flex items-center gap-2.5 border-b border-white/[0.06]" style={{ background: "rgba(239,68,68,0.1)" }}>
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-xs font-semibold">تم رفض الطلب</span>
            </div>
            <div className="p-8 space-y-6 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                style={{ background: "rgba(239,68,68,0.12)", border: "2px solid rgba(248,113,113,0.4)" }}>
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <div>
                <h2 className="text-white text-xl font-bold mb-1">لم تُقبَل</h2>
                <p className="text-white/50 text-sm">رفض المضيف طلب انضمامك لهذا الاجتماع.</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => { setStep("enter_code"); setCode(""); setMeetingInfo(null); }}
                  className="flex-1 border-white/10 text-white/60 hover:bg-white/5 h-11"
                  variant="outline"
                >
                  محاولة بكود آخر
                </Button>
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="flex-1 h-11 text-white font-bold"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  الرئيسية
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
