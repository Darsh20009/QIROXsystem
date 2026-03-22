import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useInboxSocket } from "@/hooks/useInboxSocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Send, Headphones, Clock, CheckCircle2, XCircle, Star, RefreshCw,
  User, Package, Wrench, Ticket, ArrowRightLeft, PhoneCall, Mail,
  Globe, MapPin, Loader2, Plus, MessageSquare, AlertCircle, Building2,
  Paperclip, Mic, MicOff, Play, Pause, Download, FileText, Check, CheckCheck,
  ChevronRight, Crown, Activity
} from "lucide-react";


function timeAgo(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `${Math.floor(diff / 60)}د`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}س`;
  return d.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
}
function formatSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}
function roleLabel(r: string) {
  const m: Record<string, string> = { admin: "مدير", manager: "مدير عام", support: "خدمة عملاء", developer: "مطور", designer: "مصمم", client: "عميل" };
  return m[r] || r;
}
function statusInfo(status: string) {
  if (status === 'waiting') return { label: "في الانتظار", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" };
  if (status === 'active') return { label: "نشط", color: "bg-green-100 text-green-700", dot: "bg-green-500" };
  return { label: "مغلق", color: "bg-gray-100 text-gray-500", dot: "bg-gray-400" };
}

let audioCtx: AudioContext | null = null;
function playBeep() {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.frequency.setValueAtTime(880, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(660, audioCtx.currentTime + 0.08);
    g.gain.setValueAtTime(0.3, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    o.start(audioCtx.currentTime); o.stop(audioCtx.currentTime + 0.2);
  } catch {}
}

function VoicePlayer({ url, isMe = false }: { url: string; isMe?: boolean }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [prog, setProg] = useState(0);
  const [dur, setDur] = useState(0);
  const btnCls = isMe ? "bg-white/20 hover:bg-white/30 text-white" : "bg-black/10 hover:bg-black/20 text-black";
  const trackCls = isMe ? "bg-white/20" : "bg-black/10";
  const fillCls = isMe ? "bg-white/70" : "bg-black/50";
  const textCls = isMe ? "opacity-60" : "text-black/40";
  return (
    <div className="flex items-center gap-2 min-w-[150px]">
      <audio ref={ref} src={url} onTimeUpdate={() => { if (ref.current) setProg((ref.current.currentTime / ref.current.duration) * 100 || 0); }} onLoadedMetadata={() => { if (ref.current) setDur(ref.current.duration); }} onEnded={() => { setPlaying(false); setProg(0); }} />
      <button onClick={() => { if (!ref.current) return; if (playing) { ref.current.pause(); setPlaying(false); } else { ref.current.play(); setPlaying(true); } }} className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${btnCls}`}>
        {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
      </button>
      <div className="flex-1">
        <div className={`h-1 ${trackCls} rounded-full overflow-hidden`}><div className={`h-full ${fillCls} rounded-full transition-all`} style={{ width: `${prog}%` }} /></div>
        <span className={`text-[9px] mt-0.5 block ${textCls}`}>{dur > 0 ? `${Math.floor(dur)}s` : "🎙️"}</span>
      </div>
    </div>
  );
}

function MsgBubble({ msg, isMe }: { msg: any; isMe: boolean }) {
  if (msg.isAutoMessage) {
    return (
      <div className="flex flex-col items-center my-2">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-3 h-3 text-white" />
          </div>
          <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">{msg.autoSender || "QIROX Studio"}</span>
        </div>
        <div className="max-w-[85%] bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/40 border border-violet-200/60 dark:border-violet-700/40 rounded-2xl px-4 py-3 text-center">
          <p className="text-sm text-violet-800 dark:text-violet-200 leading-relaxed">{msg.body}</p>
        </div>
        <span className="text-[9px] text-black/25 dark:text-white/25 mt-1">{timeAgo(msg.createdAt)}</span>
      </div>
    );
  }
  const sender = msg.fromUserId;
  const nm = sender?.fullName || sender?.username || "؟";
  return (
    <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
      {!isMe && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
          {nm[0]?.toUpperCase()}
        </div>
      )}
      <div className={`max-w-[70%] rounded-2xl overflow-hidden ${isMe ? "bg-black text-white rounded-tr-sm" : "bg-white border border-black/[0.07] text-black rounded-tl-sm dark:bg-gray-800 dark:text-white dark:border-white/[0.08]"}`}>
        {!isMe && <p className="px-3 pt-2 text-[10px] font-bold opacity-70">{nm}</p>}
        {msg.attachmentType === "image" && <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer"><img src={msg.attachmentUrl} alt="" className="max-w-[220px] max-h-[180px] object-cover" /></a>}
        {msg.attachmentType === "voice" && <div className="px-3 py-2"><VoicePlayer url={msg.attachmentUrl} isMe={isMe} /></div>}
        {msg.attachmentType === "file" && (
          <a href={msg.attachmentUrl} download={msg.attachmentName} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-3 py-2.5 hover:opacity-80 ${isMe ? "text-white" : "text-black dark:text-white"}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isMe ? "bg-white/20" : "bg-black/[0.06] dark:bg-white/[0.1]"}`}><FileText className="w-3.5 h-3.5" /></div>
            <div className="min-w-0"><p className="text-xs font-semibold truncate max-w-[140px]">{msg.attachmentName || "File"}</p>{msg.attachmentSize && <p className="text-[9px] opacity-70">{formatSize(msg.attachmentSize)}</p>}</div>
            <Download className="w-3 h-3 opacity-60 flex-shrink-0" />
          </a>
        )}
        {msg.body && <div className="px-3.5 py-2.5"><p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p></div>}
        <div className="px-3.5 pb-2 flex items-center justify-end gap-1">
          <span className="text-[9px] opacity-70">{timeAgo(msg.createdAt)}</span>
          {isMe && <CheckCheck className="w-3 h-3 opacity-70" />}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 px-1 py-0.5">
      <div className="flex items-center gap-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl rounded-bl-sm px-3 py-2">
        <span className="text-[10px] text-black/40 dark:text-white/30 ml-1">{name}</span>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block w-1.5 h-1.5 rounded-full bg-black/30 dark:bg-white/30"
            style={{
              animation: "typingBounce 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ChatInput({ onSend, disabled, placeholder = "Write your message...", onTyping }: {
  onSend: (data: any) => void;
  disabled?: boolean;
  placeholder?: string;
  onTyping?: (isTyping: boolean) => void;
}) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recTime, setRecTime] = useState(0);
  const timerRef = useRef<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<any>(null);

  const handleTextChange = (val: string) => {
    setText(val);
    if (onTyping) {
      if (val.trim()) {
        onTyping(true);
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => onTyping(false), 2500);
      } else {
        clearTimeout(typingTimerRef.current);
        onTyping(false);
      }
    }
  };

  const submit = () => {
    if (!text.trim()) return;
    onSend({ body: text.trim() });
    setText("");
    if (onTyping) { clearTimeout(typingTimerRef.current); onTyping(false); }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const { url } = await r.json();
      const isImg = file.type.startsWith("image/");
      onSend({ body: "", attachmentUrl: url, attachmentType: isImg ? "image" : "file", attachmentName: file.name, attachmentSize: file.size });
    } catch { } finally { setUploading(false); }
  };

  const getSupportedMimeType = () => {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4", "audio/mpeg"];
    for (const t of types) { try { if (MediaRecorder.isTypeSupported(t)) return t; } catch {} }
    return "";
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      const chunks: Blob[] = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const finalType = mimeType || "audio/webm";
        const ext = finalType.includes("mp4") ? "mp4" : finalType.includes("ogg") ? "ogg" : finalType.includes("mp3") ? "mp3" : "webm";
        const blob = new Blob(chunks, { type: finalType });
        if (blob.size < 100) { setRecording(false); setRecTime(0); return; }
        const file = new File([blob], `voice_${Date.now()}.${ext}`, { type: finalType });
        const fd = new FormData(); fd.append("file", file);
        try {
          const r = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
          if (!r.ok) { const e = await r.json(); console.error("[voice upload]", e); setRecording(false); setRecTime(0); return; }
          const { url } = await r.json();
          onSend({ body: "", attachmentUrl: url, attachmentType: "voice", attachmentName: L ? "رسالة صوتية" : "Voice Message" });
        } catch (e) { console.error("[voice send]", e); }
        setRecording(false); setRecTime(0);
      };
      mr.start(100); setRecorder(mr); setRecording(true);
      timerRef.current = setInterval(() => setRecTime(t => t + 1), 1000);
    } catch (e) { console.error("[startRec]", e); }
  };

  const stopRec = () => { recorder?.stop(); clearInterval(timerRef.current); };

  return (
    <div className="flex items-end gap-2 p-3 border-t border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900">
      <input ref={fileRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }} />
      {recording ? (
        <div className="flex-1 flex items-center gap-3 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2.5 border border-red-200 dark:border-red-800/30">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-bold text-red-600">{Math.floor(recTime / 60)}:{String(recTime % 60).padStart(2, "0")}</span>
          <span className="text-xs text-red-500">{L ? "جارٍ التسجيل..." : "Recording..."}</span>
        </div>
      ) : (
        <Input value={text} onChange={e => handleTextChange(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }} placeholder={placeholder || defaultPlaceholder} className="flex-1 rounded-xl border-black/[0.08] dark:border-white/[0.1] text-sm h-10" disabled={disabled} data-testid="input-cs-message" />
      )}
      <Button size="icon" variant="ghost" className="h-10 w-10 text-black/40 dark:text-white/40 hover:text-black hover:bg-black/[0.05] rounded-xl" onClick={() => fileRef.current?.click()} disabled={uploading || recording} data-testid="button-attach-file">
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
      </Button>
      <Button size="icon" variant="ghost" className={`h-10 w-10 rounded-xl ${recording ? "text-red-500 hover:bg-red-50" : "text-black/40 dark:text-white/40 hover:text-black"}`} onClick={recording ? stopRec : startRec} disabled={disabled} data-testid="button-voice-record">
        {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </Button>
      <Button size="icon" className="h-10 w-10 bg-black text-white hover:bg-black/80 rounded-xl flex-shrink-0" onClick={submit} disabled={disabled || !text.trim()} data-testid="button-send-cs-message">
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ══════════════════════════════════════════════
// CLIENT VIEW
// ══════════════════════════════════════════════
function ClientView({ user }: { user: any }) {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const [subject, setSubject] = useState("");
  const [showRating, setShowRating] = useState(false);
  const [ratingVal, setRatingVal] = useState(0);
  const [ratingNote, setRatingNote] = useState("");
  const [waitingElapsed, setWaitingElapsed] = useState(0);
  const [agentTyping, setAgentTyping] = useState(false);
  const urgentCalledRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeSessionRef = useRef<string | null>(null);
  const agentTypingTimerRef = useRef<any>(null);

  const { data: session, isLoading: loadingSession, refetch: refetchSession } = useQuery<any>({
    queryKey: ["/api/cs/my-session"],
    refetchInterval: 8000,
  });

  const { data: messages = [], isLoading: loadingMsgs } = useQuery<any[]>({
    queryKey: ["/api/cs/sessions", session?.id, "messages"],
    queryFn: async () => {
      if (!session?.id) return [];
      const r = await fetch(`/api/cs/sessions/${session.id}/messages`, { credentials: "include" });
      return r.json();
    },
    enabled: !!session?.id,
    refetchInterval: 5000,
  });

  const agentId = session?.agent?._id || session?.agent?.id;

  const { sendTyping } = useInboxSocket({
    userId: user?.id,
    onEvent: useCallback((evt: any) => {
      if (evt.type === "cs_session_update") {
        queryClient.invalidateQueries({ queryKey: ["/api/cs/my-session"] });
        if (session?.id) queryClient.invalidateQueries({ queryKey: ["/api/cs/sessions", session.id, "messages"] });
      }
      if (evt.type === "new_message" && evt.csSessionId) {
        queryClient.invalidateQueries({ queryKey: ["/api/cs/sessions", evt.csSessionId, "messages"] });
        setAgentTyping(false);
        playBeep();
      }
      if (evt.type === "typing") {
        setAgentTyping(evt.isTyping);
        if (evt.isTyping) {
          clearTimeout(agentTypingTimerRef.current);
          agentTypingTimerRef.current = setTimeout(() => setAgentTyping(false), 4000);
        }
      }
    }, [session?.id]),
  });

  useEffect(() => {
    if (session?.status === 'closed' && !session.rating) setShowRating(true);
  }, [session?.status, session?.rating]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Waiting timer: 0-2min = connecting, 2-3min = urgent (notify), 3+min = give up
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
      if (elapsed >= 120 && !urgentCalledRef.current && session.id) {
        urgentCalledRef.current = true;
        fetch(`/api/cs/sessions/${session.id}/urgent`, { method: "POST", credentials: "include" }).catch(() => {});
      }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [session?.id, session?.status, session?.createdAt]);

  const startMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/cs/sessions", { subject: subject.trim() || (L ? "دردشة عامة" : "General Chat") });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/cs/my-session"] }); setSubject(""); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const sendMutation = useMutation({
    mutationFn: async (data: any) => {
      const r = await apiRequest("POST", `/api/cs/sessions/${session.id}/messages`, data);
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/cs/sessions", session?.id, "messages"] }),
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("PATCH", `/api/cs/sessions/${session.id}/close`, {});
      return r.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/cs/my-session"] }); },
  });

  const rateMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", `/api/cs/sessions/${session.id}/rate`, { rating: ratingVal, ratingNote });
      return r.json();
    },
    onSuccess: () => { setShowRating(false); queryClient.invalidateQueries({ queryKey: ["/api/cs/my-session"] }); toast({ title: L ? "شكراً على تقييمك!" : "Thank you for your rating!" }); },
  });

  if (loadingSession) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-black/30" /></div>;
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center p-6" dir={dir}>
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center">
            <Headphones className="w-8 h-8 text-violet-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-black dark:text-white mb-2">{L ? "خدمة العملاء" : "Customer Service"}</h2>
            <p className="text-sm text-black/50 dark:text-white/50">{L ? "ابدأ محادثة مع فريق الدعم للحصول على مساعدة فورية" : "Start a chat with the support team for immediate help"}</p>
          </div>
          <div className="space-y-3">
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder={L ? "موضوع المحادثة (اختياري)" : "Conversation subject (optional)"} className="rounded-xl text-center" data-testid="input-cs-subject" />
            <Button className="w-full bg-black text-white hover:bg-black/80 font-bold rounded-xl h-11 gap-2" onClick={() => startMutation.mutate()} disabled={startMutation.isPending} data-testid="button-start-cs">
              {startMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Headphones className="w-4 h-4" />}
              {L ? "ابدأ المحادثة" : "Start Chat"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const si = statusInfo(session.status);
  const agent = session.agent;
  const agentName = agent?.fullName || agent?.username || (L ? "خدمة العملاء" : "Customer Support");

  return (
    <div className="flex flex-col flex-1 min-h-0" dir={dir}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black">
            {session.status === 'waiting' ? <Clock className="w-5 h-5" /> : agentName[0]?.toUpperCase()}
          </div>
          <div className={`absolute bottom-0 left-0 w-2.5 h-2.5 rounded-full border-2 border-white ${si.dot}`} />
        </div>
        <div className="flex-1">
          <p className="font-black text-sm text-black dark:text-white">{session.status === 'waiting' ? (L ? 'في الانتظار...' : 'Waiting...') : agentName}</p>
          <p className="text-[10px] text-black/40 dark:text-white/30">{session.status === 'waiting' ? (L ? 'جارٍ البحث عن موظف متاح' : 'Searching for an available agent') : roleLabel(agent?.role || 'support', L)}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${si.color}`}>{si.label}</span>
        {session.status === 'active' && (
          <Button size="sm" variant="ghost" className="h-7 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50 gap-1" onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending} data-testid="button-close-session">
            <XCircle className="w-3.5 h-3.5" /> {L ? "إنهاء" : "End"}
          </Button>
        )}
      </div>

      {/* Session info banner */}
      {session.subject && <div className="px-4 py-1.5 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.04] dark:border-white/[0.04]"><p className="text-[10px] text-black/40 dark:text-white/30">{L ? "الموضوع:" : "Subject:"} {session.subject}</p></div>}

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        {session.status === 'waiting' && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            {waitingElapsed >= 180 ? (
              <>
                <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <span className="text-2xl">😔</span>
                </div>
                <p className="text-sm font-bold text-red-500">{L ? "عذراً، الفريق مشغول حالياً" : "Sorry, the team is currently busy"}</p>
                <p className="text-xs text-black/40 dark:text-white/30 text-center max-w-xs">
                  {L ? "يرجى التواصل في وقت لاحق أو أرسل رسالتك وسنرد عليك في أقرب وقت ممكن" : "Please try again later or send your message and we'll reply as soon as possible"}
                </p>
              </>
            ) : waitingElapsed >= 120 ? (
              <>
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                  <span className="text-xl">⏳</span>
                </div>
                <p className="text-sm font-bold text-amber-600">{L ? "جاري التواصل مع الفريق..." : "Contacting the team..."}</p>
                <p className="text-xs text-black/40 dark:text-white/30 text-center">{L ? "يتم تنبيه أحد المشرفين، يُرجى الانتظار" : "Notifying a supervisor, please wait"}</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600 animate-pulse" />
                </div>
                <p className="text-sm font-bold text-black/60 dark:text-white/60">{L ? "جاري التوصيل لأقرب موظف..." : "Connecting to the nearest agent..."}</p>
                <p className="text-xs text-black/40 dark:text-white/30 text-center">{L ? "سيتم تعيين موظف خدمة العملاء قريباً" : "A customer service agent will be assigned soon"}</p>
              </>
            )}
          </div>
        )}
        {loadingMsgs && session.status !== 'waiting' ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-black/20" /></div>
        ) : (
          <div className="space-y-3">
            {messages.length === 0 && session.status === 'active' && (
              <div className="text-center py-8 text-sm text-black/30 dark:text-white/20">{L ? "ابدأ المحادثة..." : "Start the conversation..."}</div>
            )}
            {messages.map((msg: any) => (
              <MsgBubble key={msg.id} msg={msg} isMe={String(msg.fromUserId?.id || msg.fromUserId) === String(user.id)} />
            ))}
            {agentTyping && session.status === 'active' && (
              <TypingIndicator name={session?.agent?.fullName || session?.agent?.username || (L ? "الموظف" : "Agent")} />
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      {(session.status === 'active' || session.status === 'waiting') && (
        <ChatInput
          onSend={(data) => sendMutation.mutate(data)}
          disabled={sendMutation.isPending}
          placeholder={session.status === 'waiting' ? (L ? "اكتب رسالتك وسيردّ عليك الموظف فور انضمامه..." : "Write your message, the agent will reply when they join...") : (L ? "اكتب رسالتك..." : "Write your message...")}
          onTyping={agentId ? (isTyping) => sendTyping(agentId, isTyping) : undefined}
        />
      )}
      {session.status === 'closed' && !showRating && (
        <div className="p-4 border-t border-black/[0.07] dark:border-white/[0.07] flex flex-col gap-2">
          <p className="text-xs text-center text-black/40 dark:text-white/30">{L ? "تم إغلاق المحادثة" : "Conversation closed"}</p>
          <Button variant="outline" className="w-full rounded-xl text-sm gap-2" onClick={() => startMutation.mutate()} disabled={startMutation.isPending} data-testid="button-new-cs-session">
            <Plus className="w-4 h-4" /> {L ? "بدء محادثة جديدة" : "Start New Chat"}
          </Button>
        </div>
      )}

      {/* Rating dialog */}
      <Dialog open={showRating} onOpenChange={setShowRating}>
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader><DialogTitle className="font-black text-center">{L ? "كيف كانت تجربتك؟" : "How was your experience?"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2 text-center">
            <p className="text-sm text-black/50 dark:text-white/40">{L ? "قيّم جودة الخدمة التي تلقيتها" : "Rate the quality of service you received"}</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <button key={i} onClick={() => setRatingVal(i)} className={`w-10 h-10 rounded-full transition-all ${i <= ratingVal ? "text-amber-500 scale-110" : "text-black/20 dark:text-white/20 hover:text-amber-400"}`} data-testid={`button-rating-${i}`}>
                  <Star className="w-8 h-8" fill={i <= ratingVal ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
            <Textarea value={ratingNote} onChange={e => setRatingNote(e.target.value)} placeholder={L ? "تعليق (اختياري)" : "Comment (optional)"} rows={2} className="rounded-xl text-sm" data-testid="input-rating-note" />
            <div className="flex gap-2">
              <Button className="flex-1 bg-black text-white font-bold rounded-xl" onClick={() => rateMutation.mutate()} disabled={!ratingVal || rateMutation.isPending} data-testid="button-submit-rating">
                {rateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (L ? "إرسال التقييم" : "Submit Rating")}
              </Button>
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowRating(false)}>{L ? "تخطي" : "Skip"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ══════════════════════════════════════════════
// AGENT/ADMIN VIEW
// ══════════════════════════════════════════════
function AgentView({ user }: { user: any }) {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSessions, setShowSessions] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [clientTyping, setClientTyping] = useState(false);
  const clientTypingTimerRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: sessions = [], isLoading: loadingSessions } = useQuery<any[]>({
    queryKey: ["/api/cs/sessions", statusFilter],
    queryFn: async () => {
      const r = await fetch(`/api/cs/sessions?status=${statusFilter}`, { credentials: "include" });
      return r.json();
    },
    refetchInterval: 6000,
  });

  const { data: sessionDetail } = useQuery<any>({
    queryKey: ["/api/cs/sessions", selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const r = await fetch(`/api/cs/sessions/${selectedId}`, { credentials: "include" });
      return r.json();
    },
    enabled: !!selectedId,
    refetchInterval: 10000,
  });

  const { data: messages = [], isLoading: loadingMsgs } = useQuery<any[]>({
    queryKey: ["/api/cs/sessions", selectedId, "messages"],
    queryFn: async () => {
      if (!selectedId) return [];
      const r = await fetch(`/api/cs/sessions/${selectedId}/messages`, { credentials: "include" });
      return r.json();
    },
    enabled: !!selectedId,
    refetchInterval: 5000,
  });

  const { data: allAgents = [] } = useQuery<any[]>({
    queryKey: ["/api/users/agents"],
    queryFn: async () => {
      const r = await fetch("/api/admin/employees?roles=support,admin,manager", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
  });

  const selectedIdRef = useRef(selectedId);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  const { sendTyping } = useInboxSocket({
    userId: user?.id,
    onEvent: useCallback((evt: any) => {
      if (evt.type === "cs_session_update" || evt.type === "cs_assigned") {
        queryClient.invalidateQueries({ queryKey: ["/api/cs/sessions"] });
        playBeep();
      }
      if (evt.type === "new_message" && evt.csSessionId) {
        queryClient.invalidateQueries({ queryKey: ["/api/cs/sessions", evt.csSessionId, "messages"] });
        queryClient.invalidateQueries({ queryKey: ["/api/cs/sessions"] });
        if (evt.csSessionId !== selectedIdRef.current) playBeep();
        setClientTyping(false);
      }
      if (evt.type === "typing") {
        setClientTyping(evt.isTyping);
        if (evt.isTyping) {
          clearTimeout(clientTypingTimerRef.current);
          clientTypingTimerRef.current = setTimeout(() => setClientTyping(false), 4000);
        }
      }
    }, []),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: async (data: any) => {
      const r = await apiRequest("POST", `/api/cs/sessions/${selectedId}/messages`, data);
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cs/sessions", selectedId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cs/sessions"] });
    },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const assignMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("PATCH", `/api/cs/sessions/${id}/assign`, {});
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    onSuccess: (s: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cs/sessions"] });
      setSelectedId(s.id); setStatusFilter("active"); setShowSessions(false);
      toast({ title: L ? "تم استلام المحادثة" : "Conversation accepted" });
    },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const transferMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("PATCH", `/api/cs/sessions/${selectedId}/transfer`, { toAgentId: transferTarget, note: transferNote });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cs/sessions"] });
      setTransferOpen(false); setTransferTarget(""); setTransferNote("");
      toast({ title: L ? "تم تحويل المحادثة" : "Conversation transferred" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("PATCH", `/api/cs/sessions/${selectedId}/close`, {});
      return r.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/cs/sessions"] }); toast({ title: L ? "تم إغلاق المحادثة" : "Conversation closed" }); },
  });

  const selected = sessions.find((s: any) => s.id === selectedId) || null;
  const clientData = sessionDetail;

  const waitingCount = sessions.filter((s: any) => s.status === 'waiting').length;

  return (
    <div className="flex flex-1 min-h-0" dir={dir}>
      {/* ── Left: Sessions List ── */}
      <div className={`${showSessions ? "flex" : "hidden"} md:flex w-full md:w-72 flex-shrink-0 border-l border-black/[0.07] dark:border-white/[0.07] flex-col bg-white dark:bg-gray-900`}>
        <div className="px-4 py-3 border-b border-black/[0.07] dark:border-white/[0.07]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-sm text-black dark:text-white">{L ? "المحادثات" : "Conversations"}</h2>
            {waitingCount > 0 && <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{waitingCount} {L ? "في الانتظار" : "waiting"}</span>}
          </div>
          <div className="flex gap-1">
            {["waiting", "active", "closed"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-all ${statusFilter === s ? "bg-black text-white dark:bg-white dark:text-black" : "text-black/40 dark:text-white/40 hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"}`} data-testid={`filter-${s}`}>
                {s === "waiting" ? (L ? "انتظار" : "Waiting") : s === "active" ? (L ? "نشط" : "Active") : (L ? "مغلق" : "Closed")}
              </button>
            ))}
          </div>
        </div>
        <ScrollArea className="flex-1">
          {loadingSessions ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-black/20" /></div>
          ) : sessions.length === 0 ? (
            <div className="py-10 text-center text-xs text-black/30 dark:text-white/20">{L ? "لا توجد محادثات" : "No conversations"}</div>
          ) : (
            <div className="p-2 space-y-1">
              {sessions.map((s: any) => {
                const si = statusInfo(s.status);
                const cName = s.client?.fullName || s.client?.username || (L ? "عميل" : "Client");
                const isSelected = s.id === selectedId;
                return (
                  <div key={s.id} onClick={() => { setSelectedId(s.id); setShowSessions(false); }} className={`rounded-xl p-3 cursor-pointer transition-all border ${isSelected ? "bg-black text-white border-transparent" : "bg-transparent border-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.03] hover:border-black/[0.06] dark:hover:border-white/[0.06]"}`} data-testid={`session-item-${s.id}`}>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${isSelected ? "bg-white/20 text-white" : "bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 text-violet-700 dark:text-violet-300"}`}>{cName[0]?.toUpperCase()}</div>
                        {s.isUrgent && s.status === 'waiting' && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center text-[7px] text-white font-black border border-white dark:border-gray-900">!</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <p className={`text-xs font-bold truncate ${isSelected ? "text-white" : "text-black dark:text-white"}`}>{cName}</p>
                            {s.isUrgent && s.status === 'waiting' && (
                              <span className="shrink-0 text-[8px] font-black px-1 py-0.5 rounded bg-red-500/15 text-red-500 border border-red-500/20">{L ? "عاجل" : "Urgent"}</span>
                            )}
                          </div>
                          <span className={`text-[9px] shrink-0 ${isSelected ? "text-white/50" : "text-black/30 dark:text-white/30"}`}>{timeAgo(s.lastMessageAt || s.createdAt, L)}</span>
                        </div>
                        <p className={`text-[10px] truncate ${isSelected ? "text-white/60" : "text-black/40 dark:text-white/30"}`}>{s.subject || (L ? "دردشة عامة" : "General Chat")}</p>
                      </div>
                    </div>
                    {s.status === 'waiting' && (
                      <Button size="sm" className={`w-full mt-2 h-6 text-[10px] gap-1 text-white ${s.isUrgent ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"}`} onClick={e => { e.stopPropagation(); assignMutation.mutate(s.id); }} disabled={assignMutation.isPending} data-testid={`button-claim-${s.id}`}>
                        <PhoneCall className="w-3 h-3" /> {s.isUrgent ? "🚨 استلام عاجل" : "استلام"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ── Right: Chat + Client Profile ── */}
      {selectedId && selected ? (
        <div className={`${!showSessions ? "flex" : "hidden"} md:flex flex-1 flex-col min-w-0`}>
          {/* Chat header */}
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-b border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900">
            {/* Mobile back button */}
            <button
              onClick={() => { setShowSessions(true); }}
              className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors flex-shrink-0"
              data-testid="button-back-to-sessions"
            >
              <ChevronRight className="w-4 h-4 text-black/60 dark:text-white/60" />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
              {(selected.client?.fullName || selected.client?.username || "؟")[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-black dark:text-white truncate">{selected.client?.fullName || selected.client?.username}</p>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${statusInfo(selected.status).color}`}>{statusInfo(selected.status).label}</span>
                {selected.subject && <span className="text-[10px] text-black/40 dark:text-white/30 truncate max-w-[100px] sm:max-w-[150px]">{selected.subject}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {selected.status === 'active' && (
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-black/10 dark:border-white/10" onClick={() => setTransferOpen(true)} data-testid="button-transfer-session">
                  <ArrowRightLeft className="w-3.5 h-3.5" /> {L ? "تحويل" : "Transfer"}
                </Button>
              )}
              {selected.status !== 'closed' && (
                <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 gap-1" onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending} data-testid="button-close-cs">
                  <XCircle className="w-3.5 h-3.5" /> {L ? "إغلاق" : "Close"}
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Messages */}
            <div className="flex-1 flex flex-col min-w-0">
              <ScrollArea className="flex-1 px-4 py-4">
                {loadingMsgs ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-black/20" /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-sm text-black/25 dark:text-white/20">{L ? "لا توجد رسائل بعد" : "No messages yet"}</div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg: any) => (
                      <MsgBubble key={msg.id} msg={msg} isMe={String(msg.fromUserId?.id || msg.fromUserId) === String(user.id)} />
                    ))}
                    {clientTyping && selected.status === 'active' && (
                      <TypingIndicator name={selected.client?.fullName || selected.client?.username || (L ? "العميل" : "Client")} />
                    )}
                    <div ref={bottomRef} />
                  </div>
                )}
              </ScrollArea>
              {selected.status !== 'closed' && (
                <ChatInput
                  onSend={(data) => sendMutation.mutate(data)}
                  disabled={sendMutation.isPending || selected.status === 'waiting'}
                  placeholder={selected.status === 'waiting' ? (L ? "في انتظار استلام الجلسة..." : "Waiting to accept session...") : (L ? "اكتب ردك..." : "Type your reply...")}
                  onTyping={selected.client ? (isTyping) => {
                    const clientUserId = selected.client?._id || selected.client?.id;
                    if (clientUserId) sendTyping(clientUserId, isTyping);
                  } : undefined}
                />
              )}
              {selected.status === 'closed' && (
                <div className="p-3 border-t border-black/[0.07] dark:border-white/[0.07] text-center text-xs text-black/30 dark:text-white/20">
                  {L ? "المحادثة مغلقة" : "Conversation closed"}
                  {selected.rating && <span className="mr-2">• {L ? "تقييم:" : "Rating:"} {"⭐".repeat(selected.rating)}</span>}
                </div>
              )}
            </div>

            {/* Client Profile Sidebar */}
            <div className="w-64 flex-shrink-0 border-r border-black/[0.07] dark:border-white/[0.07] bg-gray-50 dark:bg-gray-900/50 overflow-y-auto">
              <div className="p-3 border-b border-black/[0.07] dark:border-white/[0.07]">
                <p className="text-[10px] font-black text-black/40 dark:text-white/30 uppercase tracking-wider mb-2">{L ? "ملف العميل" : "Client Profile"}</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-black/30 dark:text-white/30 flex-shrink-0" />
                    <p className="text-xs font-bold text-black dark:text-white truncate" data-testid="text-client-name">{clientData?.client?.fullName || clientData?.client?.username || "—"}</p>
                  </div>
                  {clientData?.client?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-black/30 dark:text-white/30 flex-shrink-0" />
                      <p className="text-[10px] text-black/50 dark:text-white/40 truncate" data-testid="text-client-email">{clientData.client.email}</p>
                    </div>
                  )}
                  {clientData?.client?.country && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-black/30 dark:text-white/30 flex-shrink-0" />
                      <p className="text-[10px] text-black/50 dark:text-white/40" data-testid="text-client-country">{clientData.client.country}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Orders */}
              <div className="p-3 border-b border-black/[0.07] dark:border-white/[0.07]">
                <p className="text-[10px] font-black text-black/40 dark:text-white/30 uppercase tracking-wider mb-2 flex items-center gap-1"><Package className="w-3 h-3" /> {L ? "الطلبات" : "Orders"} ({clientData?.orders?.length || 0})</p>
                <div className="space-y-1">
                  {(clientData?.orders || []).slice(0, 4).map((o: any) => (
                    <div key={o._id || o.id} className="bg-white dark:bg-gray-800 rounded-lg px-2 py-1.5 border border-black/[0.05] dark:border-white/[0.05]" data-testid={`client-order-${o._id || o.id}`}>
                      <p className="text-[10px] font-bold text-black dark:text-white truncate">{o.businessName || o.serviceType}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[9px] text-black/40 dark:text-white/30">{o.planTier || "—"}</span>
                        <span className={`text-[8px] font-bold px-1 py-0.5 rounded-full ${o.status === 'approved' ? "bg-green-100 text-green-700" : o.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>{o.status === 'approved' ? (L ? "موافق" : "Approved") : o.status === 'pending' ? (L ? "انتظار" : "Pending") : o.status}</span>
                      </div>
                    </div>
                  ))}
                  {!clientData?.orders?.length && <p className="text-[10px] text-black/30 dark:text-white/20">{L ? "لا توجد طلبات" : "No orders"}</p>}
                </div>
              </div>

              {/* Projects */}
              <div className="p-3 border-b border-black/[0.07] dark:border-white/[0.07]">
                <p className="text-[10px] font-black text-black/40 dark:text-white/30 uppercase tracking-wider mb-2 flex items-center gap-1"><Activity className="w-3 h-3" /> {L ? "المشاريع" : "Projects"} ({clientData?.projects?.length || 0})</p>
                <div className="space-y-1">
                  {(clientData?.projects || []).slice(0, 3).map((p: any) => (
                    <div key={p._id || p.id} className="bg-white dark:bg-gray-800 rounded-lg px-2 py-1.5 border border-black/[0.05] dark:border-white/[0.05]" data-testid={`client-project-${p._id || p.id}`}>
                      <p className="text-[10px] font-bold text-black dark:text-white truncate">{p.title || `${L ? "مشروع" : "Project"} #${p._id}`}</p>
                      <p className="text-[9px] text-black/40 dark:text-white/30">{p.phase || "—"} • {p.progress || 0}%</p>
                    </div>
                  ))}
                  {!clientData?.projects?.length && <p className="text-[10px] text-black/30 dark:text-white/20">{L ? "لا توجد مشاريع" : "No projects"}</p>}
                </div>
              </div>

              {/* Mod requests */}
              <div className="p-3 border-b border-black/[0.07] dark:border-white/[0.07]">
                <p className="text-[10px] font-black text-black/40 dark:text-white/30 uppercase tracking-wider mb-2 flex items-center gap-1"><Wrench className="w-3 h-3" /> {L ? "التعديلات" : "Modifications"} ({clientData?.modRequests?.length || 0})</p>
                <div className="space-y-1">
                  {(clientData?.modRequests || []).slice(0, 3).map((m: any) => (
                    <div key={m._id || m.id} className="bg-white dark:bg-gray-800 rounded-lg px-2 py-1.5 border border-black/[0.05] dark:border-white/[0.05]" data-testid={`client-mod-${m._id || m.id}`}>
                      <p className="text-[10px] font-bold text-black dark:text-white truncate">{m.title}</p>
                      <span className={`text-[8px] font-bold px-1 py-0.5 rounded-full ${m.status === 'completed' ? "bg-green-100 text-green-700" : m.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>{m.status}</span>
                    </div>
                  ))}
                  {!clientData?.modRequests?.length && <p className="text-[10px] text-black/30 dark:text-white/20">{L ? "لا توجد تعديلات" : "No modifications"}</p>}
                </div>
              </div>

              {/* Tickets */}
              <div className="p-3">
                <p className="text-[10px] font-black text-black/40 dark:text-white/30 uppercase tracking-wider mb-2 flex items-center gap-1"><Ticket className="w-3 h-3" /> {L ? "التذاكر" : "Tickets"} ({clientData?.tickets?.length || 0})</p>
                <div className="space-y-1">
                  {(clientData?.tickets || []).slice(0, 3).map((t: any) => (
                    <div key={t._id || t.id} className="bg-white dark:bg-gray-800 rounded-lg px-2 py-1.5 border border-black/[0.05] dark:border-white/[0.05]" data-testid={`client-ticket-${t._id || t.id}`}>
                      <p className="text-[10px] font-bold text-black dark:text-white truncate">{t.title}</p>
                    </div>
                  ))}
                  {!clientData?.tickets?.length && <p className="text-[10px] text-black/30 dark:text-white/20">{L ? "لا توجد تذاكر" : "No tickets"}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-center p-8">
          <div>
            <MessageSquare className="w-12 h-12 mx-auto text-black/10 dark:text-white/10 mb-3" />
            <p className="text-sm text-black/30 dark:text-white/20">{L ? "اختر محادثة للبدء" : "Select a conversation to start"}</p>
          </div>
        </div>
      )}

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader><DialogTitle className="font-black">{L ? "تحويل المحادثة" : "Transfer Conversation"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">{L ? "تحويل إلى" : "Transfer to"}</label>
              <select value={transferTarget} onChange={e => setTransferTarget(e.target.value)} className="w-full border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-transparent" data-testid="select-transfer-target">
                <option value="">{L ? "اختر موظف..." : "Choose agent..."}</option>
                {allAgents.filter((a: any) => String(a.id || a._id) !== String(user.id)).map((a: any) => (
                  <option key={a.id || a._id} value={a.id || a._id}>{a.fullName || a.username} ({roleLabel(a.role, L)})</option>
                ))}
                {allAgents.length === 0 && <option value={user.id}>{L ? "المدير" : "Admin"}</option>}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">{L ? "ملاحظة للموظف (اختياري)" : "Note for agent (optional)"}</label>
              <Textarea value={transferNote} onChange={e => setTransferNote(e.target.value)} rows={2} className="rounded-xl text-sm" data-testid="input-transfer-note" />
            </div>
            <Button className="w-full bg-black text-white font-bold rounded-xl gap-2" onClick={() => transferMutation.mutate()} disabled={!transferTarget || transferMutation.isPending} data-testid="button-confirm-transfer">
              {transferMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
              {L ? "تحويل المحادثة" : "Transfer Conversation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ══════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════
export default function CSChat() {
  const { data: user, isLoading } = useUser();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const me = user as any;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-black/30" />
      </div>
    );
  }

  const isAgent = me?.role && ['support', 'admin', 'manager'].includes(me.role);

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-50 dark:bg-gray-950" dir={dir}>
      {/* Page title bar */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-white dark:bg-gray-900 border-b border-black/[0.07] dark:border-white/[0.07] flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center">
          <Headphones className="w-4 h-4 text-violet-600" />
        </div>
        <div>
          <h1 className="font-black text-sm text-black dark:text-white">
            {isAgent ? "لوحة خدمة العملاء" : "خدمة العملاء"}
          </h1>
          <p className="text-[10px] text-black/40 dark:text-white/30">
            {isAgent ? "إدارة محادثات العملاء والردود الفورية" : "تواصل مع فريق الدعم مباشرة"}
          </p>
        </div>
        {isAgent && (
          <div className="mr-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] text-black/50 dark:text-white/30">متصل</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {isAgent ? <AgentView user={me} /> : <ClientView user={me} />}
      </div>
    </div>
  );
}
