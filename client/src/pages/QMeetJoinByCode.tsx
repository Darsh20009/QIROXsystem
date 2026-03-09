// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Video, Loader2, CheckCircle2, XCircle, Clock,
  ArrowRight, Users, Calendar, Timer
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

export default function QMeetJoinByCode() {
  const { data: user } = useUser();
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("enter_code");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [meetingInfo, setMeetingInfo] = useState<MeetingInfo | null>(null);
  const [meetingLink, setMeetingLink] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const autoLookupDoneRef = useRef(false);

  // Resolve the effective user ID (logged-in or guest)
  const effectiveUserId = user ? (user._id || user.id) : getOrCreateGuestId();

  // Auto-fill code from URL ?code= param and trigger lookup
  useEffect(() => {
    if (autoLookupDoneRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const urlCode = (params.get("code") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    if (urlCode.length === 6) {
      autoLookupDoneRef.current = true;
      setCode(urlCode);
      // lookup immediately
      setLoading(true);
      fetch(`/api/qmeet/by-code/${urlCode}`)
        .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(new Error(e.message || "كود غير صحيح"))))
        .then(data => { setMeetingInfo(data); setStep("meeting_info"); })
        .catch(err => toast({ title: "خطأ", description: err?.message || "كود غير صحيح أو الاجتماع غير متاح", variant: "destructive" }))
        .finally(() => setLoading(false));
    }
  }, [toast]);

  // WebSocket listener for approval notification (works for both logged-in and guest)
  useEffect(() => {
    if (step !== "pending") return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "auth", userId: effectiveUserId }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "qmeet_join_response") {
          if (data.approved) {
            setMeetingLink(data.meetingLink);
            setStep("approved");
            toast({ title: "تمت الموافقة!", description: `يمكنك الآن الانضمام لـ "${data.meetingTitle}"` });
          } else {
            setStep("rejected");
            toast({ title: "تم الرفض", description: "رفض المضيف طلب انضمامك", variant: "destructive" });
          }
          ws.close();
        }
      } catch {}
    };

    return () => { ws.close(); };
  }, [step, effectiveUserId, toast]);

  const handleCodeInput = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setCode(clean);
  };

  const lookupCode = async () => {
    if (code.length !== 6) {
      toast({ title: "الكود يجب أن يكون 6 أحرف", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/qmeet/by-code/${code}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "كود غير صحيح");
      }
      const data = await res.json();
      setMeetingInfo(data);
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
      // Save guest info for MeetingRoom to use
      if (!user) {
        sessionStorage.setItem("qmeet_guest_name", guestName.trim());
        sessionStorage.setItem("qmeet_guest_id", effectiveUserId);
      }

      const body: any = {};
      if (!user) {
        body.guestName = guestName.trim();
        body.guestId = effectiveUserId;
      }

      const res = await fetch(`/api/qmeet/by-code/${code}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "حدث خطأ");

      if (data.status === "approved") {
        setMeetingLink(data.meetingLink);
        setStep("approved");
      } else if (data.status === "pending") {
        setStep("pending");
      }
    } catch (err: any) {
      toast({ title: "خطأ", description: err?.message || "حدث خطأ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const joinNow = () => {
    if (meetingLink) navigate(meetingLink);
  };

  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    live: "bg-green-500/20 text-green-300 border-green-500/30",
    completed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  const statusLabels: Record<string, string> = {
    scheduled: "مجدول",
    live: "مباشر الآن",
    completed: "انتهى",
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-md space-y-6">

        {/* Logo */}
        <div className="text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold">QMeet</h1>
          <p className="text-white/40 text-sm mt-1">انضم باستخدام كود الاجتماع</p>
        </div>

        {/* ─── Step: Enter Code ─────────────────────────────── */}
        {step === "enter_code" && (
          <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-white/70 text-sm font-medium">أدخل كود الاجتماع (6 أحرف)</label>
              <Input
                value={code}
                onChange={(e) => handleCodeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && code.length === 6 && lookupCode()}
                placeholder="مثال: QM4X7B"
                className="bg-gray-800 border-gray-700 text-white text-center text-2xl font-mono tracking-[0.4em] h-14 placeholder:text-gray-600 placeholder:tracking-normal"
                maxLength={6}
                data-testid="input-join-code"
                autoFocus
              />
              <div className="flex gap-1 justify-center mt-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`w-8 h-1 rounded-full transition-all ${i < code.length ? "bg-blue-500" : "bg-gray-700"}`} />
                ))}
              </div>
            </div>
            <Button
              onClick={lookupCode}
              disabled={code.length !== 6 || loading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base"
              data-testid="button-lookup-code"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "بحث عن الاجتماع"}
            </Button>
            <button onClick={() => navigate("/dashboard")} className="w-full text-white/30 hover:text-white/60 text-sm transition-colors text-center">
              رجوع للرئيسية
            </button>
          </div>
        )}

        {/* ─── Step: Meeting Info ───────────────────────────── */}
        {step === "meeting_info" && meetingInfo && (
          <div className="bg-gray-900 rounded-2xl p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <Badge className={`text-xs mb-2 ${statusColors[meetingInfo.status] || statusColors.scheduled}`}>
                  {statusLabels[meetingInfo.status] || meetingInfo.status}
                </Badge>
                <h2 className="text-white text-lg font-bold leading-tight">{meetingInfo.title}</h2>
              </div>
              <div className="bg-gray-800 rounded-xl px-3 py-2 text-center">
                <p className="text-[10px] text-white/40">كود</p>
                <p className="text-white font-mono font-bold text-sm tracking-widest">{meetingInfo.joinCode}</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-white/60 text-sm">
                <Users className="w-4 h-4 shrink-0" />
                <span>المضيف: <span className="text-white/80 font-medium">{meetingInfo.hostName}</span></span>
              </div>
              <div className="flex items-center gap-3 text-white/60 text-sm">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>{new Date(meetingInfo.scheduledAt).toLocaleString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="flex items-center gap-3 text-white/60 text-sm">
                <Timer className="w-4 h-4 shrink-0" />
                <span>المدة: <span className="text-white/80">{meetingInfo.durationMinutes} دقيقة</span></span>
              </div>
            </div>

            <div className="bg-amber-900/30 border border-amber-700/40 rounded-xl p-3">
              <p className="text-amber-300 text-xs leading-relaxed">
                سيتلقى المضيف إشعاراً بطلبك وسيقرر قبوله أو رفضه. انتظر الموافقة قبل الدخول.
              </p>
            </div>

            {/* Guest name input - only shown when not logged in */}
            {!user && (
              <div>
                <label className="text-white/60 text-xs font-medium block mb-1.5">اسمك <span className="text-red-400">*</span></label>
                <Input
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  placeholder="أدخل اسمك ليظهر للمضيف"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  data-testid="input-guest-name"
                  autoFocus
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={requestJoin}
                disabled={loading}
                className="flex-1 h-11 bg-green-600 hover:bg-green-500 text-white font-bold"
                data-testid="button-request-join"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "طلب الانضمام"}
              </Button>
              <Button
                onClick={() => setStep("enter_code")}
                variant="outline"
                className="border-gray-700 text-white/60 hover:bg-gray-800 h-11"
                data-testid="button-back-code"
              >
                تغيير الكود
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step: Pending ────────────────────────────────── */}
        {step === "pending" && (
          <div className="bg-gray-900 rounded-2xl p-8 space-y-6 text-center">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
              <Clock className="w-10 h-10 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-white text-xl font-bold mb-2">بانتظار الموافقة</h2>
              <p className="text-white/50 text-sm">
                تم إرسال طلبك للمضيف. سيتم إشعارك فور الموافقة أو الرفض.
              </p>
              {meetingInfo && (
                <p className="text-white/30 text-xs mt-3">اجتماع: {meetingInfo.title}</p>
              )}
            </div>
            <div className="flex gap-2 justify-center">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
            <p className="text-white/20 text-xs">الصفحة تنتظر الرد تلقائياً...</p>
          </div>
        )}

        {/* ─── Step: Approved ───────────────────────────────── */}
        {step === "approved" && (
          <div className="bg-gray-900 rounded-2xl p-8 space-y-6 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <div>
              <h2 className="text-white text-xl font-bold mb-2">تمت الموافقة!</h2>
              <p className="text-white/50 text-sm">يمكنك الآن الدخول للاجتماع</p>
              {meetingInfo && (
                <p className="text-white/30 text-xs mt-2">{meetingInfo.title}</p>
              )}
            </div>
            <Button
              onClick={joinNow}
              className="w-full h-12 bg-green-600 hover:bg-green-500 text-white font-bold text-base"
              data-testid="button-join-now"
            >
              <Video className="w-5 h-5 ml-2" />
              ادخل الاجتماع الآن
            </Button>
          </div>
        )}

        {/* ─── Step: Rejected ───────────────────────────────── */}
        {step === "rejected" && (
          <div className="bg-gray-900 rounded-2xl p-8 space-y-6 text-center">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <div>
              <h2 className="text-white text-xl font-bold mb-2">تم رفض الطلب</h2>
              <p className="text-white/50 text-sm">رفض المضيف طلب انضمامك لهذا الاجتماع.</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => { setStep("enter_code"); setCode(""); setMeetingInfo(null); }}
                variant="outline"
                className="flex-1 border-gray-700 text-white/60 hover:bg-gray-800 h-11"
              >
                محاولة بكود آخر
              </Button>
              <Button
                onClick={() => navigate("/dashboard")}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white h-11"
              >
                الرئيسية
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
