import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-auth";
import { useInboxSocket } from "@/hooks/useInboxSocket";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Headphones, X, Send, Loader2, MessageCircle, Sparkles,
  CheckCheck, Check, Clock, ChevronDown, Wifi, WifiOff,
  Paperclip, Mic, MicOff, RefreshCw, FileText, Download, Play, Pause,
} from "lucide-react";

function FloatVoicePlayer({ url }: { url: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [prog, setProg] = useState(0);
  const [dur, setDur] = useState(0);
  return (
    <div className="flex items-center gap-2 min-w-[150px] px-3 py-2">
      <audio
        ref={ref}
        src={url}
        onTimeUpdate={() => { if (ref.current) setProg((ref.current.currentTime / ref.current.duration) * 100 || 0); }}
        onLoadedMetadata={() => { if (ref.current) setDur(ref.current.duration); }}
        onEnded={() => { setPlaying(false); setProg(0); }}
      />
      <button
        onClick={() => {
          if (!ref.current) return;
          if (playing) { ref.current.pause(); setPlaying(false); }
          else { ref.current.play(); setPlaying(true); }
        }}
        className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center shrink-0 transition-all"
      >
        {playing ? <Pause className="w-3 h-3 text-white" /> : <Play className="w-3 h-3 text-white" />}
      </button>
      <div className="flex-1">
        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/60 rounded-full transition-all" style={{ width: `${prog}%` }} />
        </div>
        <span className="text-[9px] text-white/40 mt-0.5 block">{dur > 0 ? `${Math.floor(dur)}ث` : "🎙️"}</span>
      </div>
    </div>
  );
}

function timeAgo(date: string) {
  const d = new Date(date);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} س`;
  return d.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
}

let audioCtx: AudioContext | null = null;
function playNotif() {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.type = "sine";
    o.frequency.setValueAtTime(1000, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(700, audioCtx.currentTime + 0.15);
    g.gain.setValueAtTime(0.2, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    o.start(); o.stop(audioCtx.currentTime + 0.3);
  } catch {}
}

export function FloatingClientChat() {
  const { data: user } = useUser();
  if (!user || user.role !== "client") return null;
  return <FloatingClientChatInner user={user} />;
}

function FloatingClientChatInner({ user }: { user: any }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [agentTyping, setAgentTyping] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [bounceBtn, setBounceBtn] = useState(false);
  const [waitingElapsed, setWaitingElapsed] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const urgentCalledRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const typingTimerRef = useRef<any>(null);
  const agentTypingTimerRef = useRef<any>(null);

  // ── Fetch active session ───────────────────────────────────────────────
  const { data: session, isLoading: sessionLoading, refetch: refetchSession } = useQuery<any>({
    queryKey: ["/api/cs/my-session"],
    refetchInterval: open ? 15000 : false,
  });

  useEffect(() => {
    if (session?.id) sessionIdRef.current = session.id;
  }, [session]);

  // ── Fetch messages ─────────────────────────────────────────────────────
  const { data: messages = [], refetch: refetchMsgs } = useQuery<any[]>({
    queryKey: ["/api/cs/sessions", session?.id, "messages"],
    queryFn: async () => {
      if (!session?.id) return [];
      const r = await fetch(`/api/cs/sessions/${session.id}/messages`, { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
    enabled: !!session?.id && open,
    refetchInterval: open ? 8000 : false,
  });

  // ── WebSocket for real-time ────────────────────────────────────────────
  const { connected, sendTyping } = useInboxSocket({
    userId: user.id,
    onEvent: useCallback((evt: any) => {
      if (evt.type === "new_message" && evt.message) {
        const msg = evt.message;
        const sessionId = sessionIdRef.current;
        if (!sessionId) return;
        const fromMe = String(msg.fromUserId?._id || msg.fromUserId) === String(user.id);
        if (!fromMe) {
          if (!open) {
            setUnread(prev => prev + 1);
            setBounceBtn(true);
            setTimeout(() => setBounceBtn(false), 1000);
            playNotif();
          }
          setAgentTyping(false);
          refetchMsgs();
        }
      }
      if (evt.type === "typing") {
        setAgentTyping(evt.isTyping);
        if (evt.isTyping) {
          clearTimeout(agentTypingTimerRef.current);
          agentTypingTimerRef.current = setTimeout(() => setAgentTyping(false), 4000);
        }
      }
    }, [open, user.id, refetchMsgs]),
  });

  useEffect(() => { setWsConnected(connected); }, [connected]);

  // ── Scroll to bottom ───────────────────────────────────────────────────
  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  // Clear unread when panel opens
  useEffect(() => {
    if (open) { setUnread(0); inputRef.current?.focus(); }
  }, [open]);

  // Listen for external trigger (e.g. from FloatingBrandPulse)
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-cs-chat", handler);
    return () => window.removeEventListener("open-cs-chat", handler);
  }, []);

  // ── Waiting timer: track elapsed seconds since session creation ────────
  useEffect(() => {
    if (!session || session.status !== "waiting") {
      setWaitingElapsed(0);
      urgentCalledRef.current = false;
      return;
    }
    const createdAt = new Date(session.createdAt).getTime();
    const tick = () => {
      const elapsed = Math.floor((Date.now() - createdAt) / 1000);
      setWaitingElapsed(elapsed);
      // After 2 minutes (120s), mark as urgent once
      if (elapsed >= 120 && !urgentCalledRef.current && session.id) {
        urgentCalledRef.current = true;
        fetch(`/api/cs/sessions/${session.id}/urgent`, { method: "POST", credentials: "include" }).catch(() => {});
      }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [session?._id, session?.status, session?.createdAt]);

  // ── Create session ─────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/cs/sessions", {}),
    onSuccess: () => {
      refetchSession();
      queryClient.invalidateQueries({ queryKey: ["/api/cs/my-session"] });
    },
    onError: () => toast({ title: "تعذّر إنشاء الجلسة", variant: "destructive" }),
  });

  // ── Upload file ────────────────────────────────────────────────────────
  const uploadFile = async (file: File) => {
    if (!session?.id) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      if (!r.ok) throw new Error();
      const { url } = await r.json();
      const isImg = file.type.startsWith("image/");
      await apiRequest("POST", `/api/cs/sessions/${session.id}/messages`, {
        body: "", attachmentUrl: url,
        attachmentType: isImg ? "image" : "file",
        attachmentName: file.name, attachmentSize: file.size,
      });
      refetchMsgs();
    } catch {
      toast({ title: "فشل رفع الملف", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // ── Voice recording ────────────────────────────────────────────────────
  const getSupportedMimeType = () => {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4", "audio/mpeg"];
    for (const t of types) { try { if (MediaRecorder.isTypeSupported(t)) return t; } catch {} }
    return "";
  };

  const startRec = async () => {
    if (!session?.id) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      const chunks: BlobPart[] = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const finalType = mimeType || "audio/webm";
        const ext = finalType.includes("mp4") ? "mp4" : finalType.includes("ogg") ? "ogg" : finalType.includes("mp3") ? "mp3" : "webm";
        const blob = new Blob(chunks, { type: finalType });
        if (blob.size < 100) { setRecording(false); return; }
        const file = new File([blob], `voice_${Date.now()}.${ext}`, { type: finalType });
        const fd = new FormData(); fd.append("file", file);
        try {
          const r = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
          if (!r.ok) {
            const errData = await r.json().catch(() => ({}));
            console.error("[voice upload float]", errData);
            toast({ title: "فشل رفع الصوت: " + (errData.error || r.status), variant: "destructive" });
            setRecording(false); return;
          }
          const { url } = await r.json();
          const sid = sessionIdRef.current;
          if (!sid) { setRecording(false); return; }
          await apiRequest("POST", `/api/cs/sessions/${sid}/messages`, {
            body: "", attachmentUrl: url, attachmentType: "voice", attachmentName: "رسالة صوتية",
          });
          refetchMsgs();
        } catch (e) {
          console.error("[voice send float]", e);
          toast({ title: "فشل إرسال الرسالة الصوتية", variant: "destructive" });
        }
        setRecording(false);
      };
      mr.start(100);
      setRecorder(mr);
      setRecording(true);
    } catch (e) {
      console.error("[startRec float]", e);
      toast({ title: "تعذّر الوصول للميكروفون", variant: "destructive" });
    }
  };

  const stopRec = () => { recorder?.stop(); };

  // ── Send message ───────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!text.trim() || !session?.id) return;
    setSending(true);
    try {
      await apiRequest("POST", `/api/cs/sessions/${session.id}/messages`, { body: text.trim() });
      setText("");
      refetchMsgs();
    } catch {
      toast({ title: "فشل إرسال الرسالة", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const statusColor = session?.status === "active" ? "#22c55e" : session?.status === "waiting" ? "#f59e0b" : "#6b7280";
  const statusLabel = session?.status === "active" ? "متصل الآن" : session?.status === "waiting" ? "في الانتظار" : "مغلق";

  const agentName = session?.agentId?.fullName || session?.agentId?.username || "فريق الدعم";

  const panelVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.92 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 380, damping: 28 } },
    exit: { opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.18 } },
  };

  return (
    <div className="hidden md:flex fixed md:bottom-6 left-4 md:left-6 z-[9999] flex-col items-start gap-3" dir="rtl">
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-[340px] sm:w-[380px] rounded-3xl overflow-hidden shadow-2xl border border-white/[0.08]"
            style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)" }}
          >
            {/* Header */}
            <div className="relative px-5 py-4 flex items-center gap-3 overflow-hidden"
              style={{ background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #111 100%)" }}>
              <div className="absolute inset-0 opacity-[0.04]"
                style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "16px 16px" }} />
              <div className="absolute right-0 top-0 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)", transform: "translate(30%, -40%)" }} />

              <div className="relative w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Headphones className="w-5 h-5 text-white" />
              </div>

              <div className="relative flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-none mb-1 truncate">
                  {session?.agentId ? agentName : "QIROX Support"}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusColor }} />
                  <span className="text-[11px] font-medium" style={{ color: statusColor }}>{statusLabel}</span>
                  {wsConnected
                    ? <Wifi className="w-2.5 h-2.5 text-white/20 ml-1" />
                    : <WifiOff className="w-2.5 h-2.5 text-red-400/50 ml-1" />}
                </div>
              </div>

              <div className="relative flex items-center gap-1.5">
                <button onClick={() => refetchMsgs()} className="w-7 h-7 rounded-xl flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-xl flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all" data-testid="button-chat-close">
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="bg-[#0d0d0d] flex flex-col" style={{ height: 420 }}>
              {sessionLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-white/20" />
                </div>

              ) : !session || session.status === "closed" ? (
                /* ── Welcome / Start ─── */
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring" }}
                    className="w-16 h-16 rounded-3xl mb-5 flex items-center justify-center relative"
                    style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <Headphones className="w-8 h-8 text-white/70" />
                    <motion.div
                      className="absolute inset-0 rounded-3xl"
                      animate={{ boxShadow: ["0 0 0 0 rgba(255,255,255,0.1)", "0 0 0 12px rgba(255,255,255,0)"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>

                  <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                    className="text-white font-bold text-base mb-2">
                    مرحباً بك في الدعم
                  </motion.p>
                  <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                    className="text-white/35 text-xs leading-relaxed mb-6 max-w-[220px]">
                    فريقنا متاح لمساعدتك في أي استفسار أو مشكلة تواجهها
                  </motion.p>

                  <div className="w-full space-y-2.5 mb-5">
                    {[
                      "🛠️ مشكلة تقنية",
                      "📦 استفسار عن الطلب",
                      "💡 طلب تعديل",
                    ].map((item, i) => (
                      <motion.button
                        key={item}
                        initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 + i * 0.08 }}
                        onClick={() => createMutation.mutate()}
                        className="w-full text-right px-4 py-2.5 rounded-2xl text-xs text-white/50 hover:text-white/80 transition-all"
                        style={{ border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
                        data-testid={`chat-quick-${i}`}
                      >
                        {item}
                      </motion.button>
                    ))}
                  </div>

                  <motion.button
                    initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
                    onClick={() => createMutation.mutate()}
                    disabled={createMutation.isPending}
                    className="w-full h-11 rounded-2xl font-bold text-sm text-black flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, #fff 0%, #d4d4d4 100%)" }}
                    data-testid="button-start-chat"
                  >
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><MessageCircle className="w-4 h-4" />ابدأ المحادثة</>}
                  </motion.button>
                </div>

              ) : (
                /* ── Chat Messages ─── */
                <>
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
                    {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
                        {session.status === "waiting" && waitingElapsed >= 180 ? (
                          /* Phase 3: 3+ min — please contact later */
                          <>
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                              <span className="text-xl">😔</span>
                            </div>
                            <p className="text-red-400/80 text-xs text-center font-semibold leading-relaxed px-4">
                              عذراً، الفريق مشغول حالياً
                            </p>
                            <p className="text-white/30 text-[10px] text-center px-4">
                              يرجى التواصل في وقت لاحق أو أرسل رسالتك وسنرد عليك
                            </p>
                          </>
                        ) : session.status === "waiting" && waitingElapsed >= 120 ? (
                          /* Phase 2: 2-3 min — still waiting, notified admin */
                          <>
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
                              <span className="text-lg">⏳</span>
                            </div>
                            <p className="text-amber-400/70 text-xs text-center">جاري التواصل مع الفريق...</p>
                            <motion.div className="flex gap-1" initial={{}} animate={{}}>
                              {[0, 1, 2].map(i => (
                                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400/50"
                                  animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, delay: i * 0.2, repeat: Infinity }} />
                              ))}
                            </motion.div>
                          </>
                        ) : session.status === "waiting" ? (
                          /* Phase 1: < 2 min — connecting */
                          <>
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                              <Loader2 className="w-5 h-5 text-amber-400/60 animate-spin" />
                            </div>
                            <p className="text-white/40 text-xs text-center">جاري التوصيل لأقرب موظف...</p>
                            <motion.div className="flex gap-1" initial={{}} animate={{}}>
                              {[0, 1, 2].map(i => (
                                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400/60"
                                  animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, delay: i * 0.2, repeat: Infinity }} />
                              ))}
                            </motion.div>
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                              <MessageCircle className="w-5 h-5 text-white/20" />
                            </div>
                            <p className="text-white/20 text-xs text-center">لا توجد رسائل بعد</p>
                          </>
                        )}
                      </div>
                    )}

                    {messages.map((msg: any, i: number) => {
                      const isMe = String(msg.fromUserId?._id || msg.fromUserId) === String(user.id);
                      const showDate = i === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[i - 1].createdAt).toDateString();
                      return (
                        <div key={msg._id}>
                          {showDate && (
                            <div className="flex items-center gap-2 my-3">
                              <div className="flex-1 h-px bg-white/[0.05]" />
                              <span className="text-white/20 text-[9px] px-2">{new Date(msg.createdAt).toLocaleDateString("ar-SA")}</span>
                              <div className="flex-1 h-px bg-white/[0.05]" />
                            </div>
                          )}
                          {msg.isAutoMessage ? (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                              className="flex flex-col items-center my-2"
                            >
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                                  <MessageCircle className="w-2.5 h-2.5 text-white" />
                                </div>
                                <span className="text-[10px] font-bold" style={{ color: "rgba(167,139,250,0.9)" }}>
                                  {msg.autoSender || "QIROX Studio"}
                                </span>
                              </div>
                              <div className="max-w-[90%] px-4 py-2.5 rounded-2xl text-center text-xs leading-relaxed"
                                style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)" }}>
                                <p style={{ color: "rgba(221,214,254,0.9)" }}>{msg.body}</p>
                              </div>
                              <span className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.15)" }}>{timeAgo(msg.createdAt)}</span>
                            </motion.div>
                          ) : (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`flex ${isMe ? "justify-end" : "justify-start"} mb-0.5`}
                          >
                            <div className={`max-w-[75%] rounded-2xl text-xs leading-relaxed overflow-hidden ${isMe ? "rounded-br-md" : "rounded-bl-md"}`}
                              style={{
                                background: isMe
                                  ? "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.07))"
                                  : "rgba(255,255,255,0.05)",
                                border: isMe
                                  ? "1px solid rgba(255,255,255,0.1)"
                                  : "1px solid rgba(255,255,255,0.05)",
                              }}>
                              {msg.attachmentType === "image" && msg.attachmentUrl && (
                                <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer">
                                  <img src={msg.attachmentUrl} alt="" className="max-w-full max-h-[160px] object-cover w-full" />
                                </a>
                              )}
                              {msg.attachmentType === "voice" && msg.attachmentUrl && (
                                <FloatVoicePlayer url={msg.attachmentUrl} />
                              )}
                              {msg.attachmentType === "file" && msg.attachmentUrl && (
                                <a href={msg.attachmentUrl} download={msg.attachmentName} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 hover:opacity-80 text-white/70">
                                  <FileText className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate text-[10px]">{msg.attachmentName || "ملف"}</span>
                                  <Download className="w-3 h-3 shrink-0 ml-auto" />
                                </a>
                              )}
                              {msg.body && (
                                <p className={`px-3.5 py-2 ${isMe ? "text-white" : "text-white/75"} break-words`}>{msg.body}</p>
                              )}
                              <div className={`flex items-center gap-1 px-3.5 pb-1.5 ${isMe ? "justify-end" : "justify-start"}`}>
                                <span className="text-[9px] text-white/20">{timeAgo(msg.createdAt)}</span>
                                {isMe && (msg.read
                                  ? <CheckCheck className="w-2.5 h-2.5 text-white/40" />
                                  : <Check className="w-2.5 h-2.5 text-white/20" />
                                )}
                              </div>
                            </div>
                          </motion.div>
                          )}
                        </div>
                      );
                    })}
                    {agentTyping && session.status === "active" && (
                      <div className="flex items-center gap-2 py-1 px-2">
                        <div className="flex gap-1 items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-[typingBounce_1s_ease-in-out_0ms_infinite]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-[typingBounce_1s_ease-in-out_200ms_infinite]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-[typingBounce_1s_ease-in-out_400ms_infinite]" />
                        </div>
                        <span className="text-[10px] text-white/30">
                          {session?.agent?.fullName || session?.agent?.username || "الموظف"} يكتب...
                        </span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Rating if closed */}
                  {session.status === "closed" && !session.rating && (
                    <div className="px-4 py-3 border-t border-white/[0.05] text-center">
                      <p className="text-white/30 text-[10px] mb-2">قيّم تجربتك</p>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map(r => (
                          <button key={r} onClick={async () => {
                            await apiRequest("POST", `/api/cs/sessions/${session.id}/rate`, { rating: r });
                            refetchSession();
                          }} className="text-white/20 hover:text-yellow-400 transition-colors text-lg">★</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input */}
                  {session.status !== "closed" && (
                    <div className="px-3 pt-2 pb-3 border-t border-white/[0.05]" style={{ background: "rgba(0,0,0,0.4)" }}>
                      {session.status === "waiting" && (
                        <div className="flex items-center justify-center gap-1.5 mb-2">
                          {waitingElapsed >= 180 ? (
                            <span className="text-red-400/70 text-[10px]">يرجى التواصل في وقت لاحق أو أرسل رسالتك</span>
                          ) : waitingElapsed >= 120 ? (
                            <><Loader2 className="w-3 h-3 animate-spin text-amber-500/70" /><span className="text-amber-500/70 text-[10px]">جاري التواصل مع الفريق...</span></>
                          ) : (
                            <><Loader2 className="w-3 h-3 animate-spin text-amber-400/60" /><span className="text-amber-400/60 text-[10px]">جاري التوصيل لأقرب موظف...</span></>
                          )}
                        </div>
                      )}
                      <input ref={fileRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }} />
                      <div className="flex gap-1.5 items-center">
                        <button
                          onClick={() => fileRef.current?.click()}
                          disabled={uploading || recording || !session?.id}
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                          data-testid="button-attach-file-float"
                        >
                          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white/50" /> : <Paperclip className="w-3.5 h-3.5 text-white/50" />}
                        </button>
                        <button
                          onClick={recording ? stopRec : startRec}
                          disabled={uploading || !session?.id}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30 ${recording ? "animate-pulse" : ""}`}
                          style={{ background: recording ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.06)", border: `1px solid ${recording ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}` }}
                          data-testid="button-voice-record-float"
                        >
                          {recording ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-white/50" />}
                        </button>
                        <div className="flex-1">
                          <Input
                            ref={inputRef}
                            value={text}
                            onChange={e => {
                              setText(e.target.value);
                              const agentId = session?.agent?._id || session?.agent?.id;
                              if (agentId) {
                                sendTyping(agentId, true);
                                clearTimeout(typingTimerRef.current);
                                typingTimerRef.current = setTimeout(() => sendTyping(agentId, false), 2000);
                              }
                            }}
                            onKeyDown={handleKey}
                            placeholder={recording ? "جارٍ التسجيل..." : "اكتب رسالتك..."}
                            disabled={recording}
                            className="bg-white/[0.05] border-white/[0.08] text-white text-sm rounded-2xl h-9 px-3 placeholder:text-white/20 focus:bg-white/[0.07] focus:border-white/[0.15] transition-all"
                            dir="rtl"
                            data-testid="input-chat-message"
                          />
                        </div>
                        <button
                          onClick={sendMessage}
                          disabled={sending || !text.trim() || recording}
                          className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-95 disabled:opacity-40"
                          style={{ background: text.trim() ? "linear-gradient(135deg, #fff, #d4d4d4)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                          data-testid="button-send-message"
                        >
                          {sending ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Send className="w-4 h-4" style={{ color: text.trim() ? "#000" : "rgba(255,255,255,0.3)" }} />}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Button ─────────────────────────────────────────────── */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        animate={bounceBtn ? { y: [0, -8, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl group"
        style={{
          background: open
            ? "linear-gradient(135deg, #1a1a1a, #111)"
            : "linear-gradient(135deg, #1a1a1a 0%, #000 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: open
            ? "0 8px 32px rgba(0,0,0,0.6)"
            : "0 8px 32px rgba(0,0,0,0.5), 0 0 0 0px rgba(255,255,255,0.1)",
        }}
        data-testid="button-float-chat"
        aria-label="خدمة العملاء"
      >
        {/* Pulse ring when unread */}
        {unread > 0 && !open && (
          <>
            <motion.div className="absolute inset-0 rounded-2xl"
              animate={{ boxShadow: ["0 0 0 0 rgba(255,255,255,0.25)", "0 0 0 14px rgba(255,255,255,0)"] }}
              transition={{ duration: 1.5, repeat: Infinity }} />
            <motion.div className="absolute inset-0 rounded-2xl"
              animate={{ boxShadow: ["0 0 0 0 rgba(255,255,255,0.12)", "0 0 0 22px rgba(255,255,255,0)"] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} />
          </>
        )}

        {/* Icon */}
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <X className="w-5 h-5 text-white/70" />
            </motion.div>
          ) : (
            <motion.div key="msg" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <Headphones className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        <AnimatePresence>
          {unread > 0 && !open && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500 }}
              className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full text-[9px] font-black text-white flex items-center justify-center px-1"
              style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Sparkle on hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 70%)" }}
        />
      </motion.button>
    </div>
  );
}
