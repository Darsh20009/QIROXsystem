import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageSquare, Send, Users, Search, Paperclip, Mic, MicOff, X, Download, Play, Pause, Image as ImageIcon, FileText, CheckCheck, Check, Wifi, WifiOff } from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useInboxSocket } from "@/hooks/useInboxSocket";

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function timeAgo(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} س`;
  return d.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function roleLabel(role: string) {
  const map: Record<string, string> = { admin: "مدير", manager: "مدير عام", developer: "مطور", designer: "مصمم", support: "دعم", client: "عميل", sales: "مبيعات", sales_manager: "مدير مبيعات", accountant: "محاسب" };
  return map[role] || role;
}

function Avatar({ name, role, online }: { name: string; role?: string; online?: boolean }) {
  const colors: Record<string, string> = { admin: "bg-black text-white", manager: "bg-gray-800 text-white", developer: "bg-violet-600 text-white", designer: "bg-pink-600 text-white", client: "bg-blue-600 text-white", support: "bg-green-600 text-white", sales: "bg-orange-600 text-white" };
  const cls = colors[role || ""] || "bg-gray-500 text-white";
  return (
    <div className="relative flex-shrink-0">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black ${cls}`}>
        {(name || "?")[0].toUpperCase()}
      </div>
      {online !== undefined && (
        <div className={`absolute bottom-0 left-0 w-2.5 h-2.5 rounded-full border-2 border-white ${online ? "bg-green-500" : "bg-gray-300"}`} />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Voice Message Player
// ──────────────────────────────────────────────
function VoicePlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  return (
    <div className="flex items-center gap-2 min-w-[160px]">
      <audio ref={audioRef} src={url}
        onTimeUpdate={() => {
          if (audioRef.current) setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0);
        }}
        onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }}
        onEnded={() => { setPlaying(false); setProgress(0); }}
      />
      <button onClick={toggle} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 hover:bg-white/30 transition-all">
        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>
      <div className="flex-1">
        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/70 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[9px] opacity-60 mt-0.5 block">{duration > 0 ? `${Math.floor(duration)}ث` : "🎙️ صوتية"}</span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Message Bubble
// ──────────────────────────────────────────────
function MessageBubble({ msg, isMe, contact }: { msg: any; isMe: boolean; contact: any }) {
  const hasText = !!msg.body;
  const hasAttachment = !!msg.attachmentUrl;
  const attachType = msg.attachmentType;

  return (
    <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
      {!isMe && <Avatar name={contact?.fullName || "?"} role={contact?.role} />}
      <div className={`max-w-[72%] rounded-2xl overflow-hidden ${isMe ? "bg-black text-white rounded-tr-sm" : "bg-white border border-black/[0.07] text-black rounded-tl-sm"}`}>
        {hasAttachment && attachType === "image" && (
          <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer">
            <img src={msg.attachmentUrl} alt={msg.attachmentName || "صورة"} className="max-w-[240px] max-h-[200px] object-cover" />
          </a>
        )}
        {hasAttachment && attachType === "voice" && (
          <div className="px-3 py-2.5">
            <VoicePlayer url={msg.attachmentUrl} />
          </div>
        )}
        {hasAttachment && attachType === "file" && (
          <a href={msg.attachmentUrl} download={msg.attachmentName} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-2 px-3 py-2.5 hover:opacity-80 transition-opacity ${isMe ? "text-white" : "text-black"}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isMe ? "bg-white/20" : "bg-black/[0.06]"}`}>
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate max-w-[160px]">{msg.attachmentName || "ملف"}</p>
              {msg.attachmentSize && <p className={`text-[9px] ${isMe ? "text-white/50" : "text-black/40"}`}>{formatSize(msg.attachmentSize)}</p>}
            </div>
            <Download className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
          </a>
        )}
        {hasText && (
          <div className="px-3.5 py-2.5">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
          </div>
        )}
        <div className={`px-3.5 pb-2 flex items-center justify-end gap-1 ${hasText ? "" : ""}`}>
          <span className={`text-[9px] ${isMe ? "text-white/40" : "text-black/30"}`}>{timeAgo(msg.createdAt)}</span>
          {isMe && <CheckCheck className="w-3 h-3 text-white/40" />}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Sound Notification
// ──────────────────────────────────────────────
let audioCtx: AudioContext | null = null;
function playNotificationSound() {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.2);
  } catch {}
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────
export default function Inbox() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const me = user as any;

  const [activeContact, setActiveContact] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const [newContactId, setNewContactId] = useState("");
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const [isTypingRemote, setIsTypingRemote] = useState(false);
  const [isVoiceRemote, setIsVoiceRemote] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMsgCountRef = useRef(0);

  const activeContactIdRef = useRef<string | null>(null);
  activeContactIdRef.current = activeContact?.id || null;

  // ── WebSocket ──
  const { connected, onlineUsers, sendTyping, sendVoiceRecording } = useInboxSocket({
    userId: me?.id,
    onEvent: (evt) => {
      if (evt.type === "new_message") {
        const fromId = String(evt.message?.fromUserId?.id || evt.message?.fromUserId);
        queryClient.invalidateQueries({ queryKey: ["/api/inbox"] });
        queryClient.invalidateQueries({ queryKey: ["/api/badges"] });
        if (fromId === activeContactIdRef.current) {
          queryClient.invalidateQueries({ queryKey: ["/api/inbox/thread", activeContactIdRef.current] });
        }
        if (fromId !== String(me?.id)) {
          playNotificationSound();
          // Browser notification
          if (Notification.permission === "granted") {
            const senderName = evt.message?.fromUserId?.fullName || evt.message?.fromUserId?.username || "رسالة";
            new Notification(`💬 ${senderName}`, { body: evt.message?.body || "رسالة جديدة", tag: `msg-${fromId}` });
          }
        }
      }
      if (evt.type === "typing") {
        if (String(evt.fromUserId) === activeContactIdRef.current) {
          setIsTypingRemote(evt.isTyping);
          if (evt.isTyping) setTimeout(() => setIsTypingRemote(false), 4000);
        }
      }
      if (evt.type === "voice_recording") {
        if (String(evt.fromUserId) === activeContactIdRef.current) {
          setIsVoiceRemote(evt.isRecording);
        }
      }
    },
  });

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ── Queries ──
  const { data: allMessages = [], isLoading: loadingMsgs } = useQuery<any[]>({ queryKey: ["/api/inbox"] });

  const { data: thread = [], isLoading: loadingThread } = useQuery<any[]>({
    queryKey: ["/api/inbox/thread", activeContact?.id],
    queryFn: async () => {
      if (!activeContact?.id) return [];
      const r = await fetch(`/api/inbox/thread/${activeContact.id}`);
      return r.json();
    },
    enabled: !!activeContact?.id,
    refetchInterval: 6000,
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const r = await fetch("/api/admin/users");
      if (!r.ok) return [];
      return r.json();
    },
    enabled: !!user && user.role !== "client",
  });

  // ── Contacts ──
  const contacts = (() => {
    const map = new Map<string, any>();
    for (const msg of allMessages) {
      const other = String(msg.fromUserId?.id || msg.fromUserId) === String(me?.id)
        ? msg.toUserId : msg.fromUserId;
      if (!other || String(other?.id || other) === String(me?.id)) continue;
      const oid = String(other?.id || other);
      if (!map.has(oid)) {
        map.set(oid, {
          id: oid,
          fullName: other?.fullName || other?.username || "مستخدم",
          role: other?.role || "client",
          lastMsg: msg.body || (msg.attachmentType === "voice" ? "🎙️ رسالة صوتية" : msg.attachmentType === "image" ? "🖼️ صورة" : "📎 مرفق"),
          lastAt: msg.createdAt,
          unread: 0,
        });
      }
    }
    for (const msg of allMessages) {
      if (!msg.read && String(msg.toUserId?.id || msg.toUserId) === String(me?.id)) {
        const fid = String(msg.fromUserId?.id || msg.fromUserId);
        const c = map.get(fid);
        if (c) c.unread++;
      }
    }
    return [...map.values()].sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
  })();

  const filteredContacts = contacts.filter(c =>
    c.fullName.toLowerCase().includes(search.toLowerCase())
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  // Clear typing remote after inactivity
  useEffect(() => {
    if (isTypingRemote) {
      const t = setTimeout(() => setIsTypingRemote(false), 5000);
      return () => clearTimeout(t);
    }
  }, [isTypingRemote]);

  // ── Send Typing ──
  const handleInputChange = (val: string) => {
    setMessageText(val);
    if (activeContact?.id) {
      if (!isTypingLocal) {
        setIsTypingLocal(true);
        sendTyping(activeContact.id, true);
      }
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        setIsTypingLocal(false);
        sendTyping(activeContact.id, false);
      }, 2000);
    }
  };

  // ── Send Message ──
  const sendMutation = useMutation({
    mutationFn: async (data: { body?: string; attachmentUrl?: string; attachmentType?: string; attachmentName?: string; attachmentSize?: number }) => {
      if (!activeContact?.id) return;
      const r = await apiRequest("POST", "/api/inbox", { toUserId: activeContact.id, ...data });
      return r.json();
    },
    onSuccess: () => {
      setMessageText("");
      setIsTypingLocal(false);
      if (activeContact?.id) sendTyping(activeContact.id, false);
      queryClient.invalidateQueries({ queryKey: ["/api/inbox"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inbox/thread", activeContact?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/badges"] });
    },
    onError: () => toast({ title: "تعذّر إرسال الرسالة", variant: "destructive" }),
  });

  const handleSend = () => {
    if (!messageText.trim()) return;
    sendMutation.mutate({ body: messageText.trim() });
  };

  // ── File Upload ──
  const handleFileUpload = async (file: File) => {
    if (!activeContact?.id) return;
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.url) throw new Error("فشل الرفع");
      const isImage = file.type.startsWith("image/");
      sendMutation.mutate({
        attachmentUrl: data.url,
        attachmentType: isImage ? "image" : "file",
        attachmentName: file.name,
        attachmentSize: file.size,
      });
    } catch {
      toast({ title: "فشل رفع الملف", variant: "destructive" });
    } finally {
      setUploadingFile(false);
    }
  };

  // ── Voice Recording ──
  const startRecording = async () => {
    if (!activeContact?.id) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: BlobPart[] = [];
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setIsRecording(false);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setRecordingTime(0);
        if (activeContact?.id) sendVoiceRecording(activeContact.id, false);
        const blob = new Blob(chunks, { type: "audio/webm" });
        if (blob.size < 1000) return; // Too short
        const formData = new FormData();
        formData.append("file", blob, `voice_${Date.now()}.webm`);
        setUploadingFile(true);
        try {
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          const data = await res.json();
          if (data.url) {
            sendMutation.mutate({ attachmentUrl: data.url, attachmentType: "voice", attachmentName: "رسالة صوتية", attachmentSize: blob.size });
          }
        } catch {
          toast({ title: "فشل إرسال الصوت", variant: "destructive" });
        } finally {
          setUploadingFile(false);
        }
      };
      mr.start();
      setMediaRecorder(mr);
      setIsRecording(true);
      setRecordingTime(0);
      if (activeContact?.id) sendVoiceRecording(activeContact.id, true);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      toast({ title: "لا يمكن الوصول للمايك", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setMediaRecorder(null);
  };

  const cancelRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.ondataavailable = null;
      mediaRecorder.onstop = null;
      mediaRecorder.stop();
      setMediaRecorder(null);
    }
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setRecordingTime(0);
    if (activeContact?.id) sendVoiceRecording(activeContact.id, false);
  };

  const totalUnread = contacts.reduce((s, c) => s + c.unread, 0);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f8f8]">
      <p className="text-black/40 text-sm">يجب تسجيل الدخول</p>
    </div>
  );

  return (
    <div className="h-screen bg-[#f8f8f8] flex flex-col relative" dir="rtl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none"><PageGraphics variant="dashboard" /></div>

      {/* Page Header */}
      <div className="bg-white border-b border-black/[0.06] px-5 py-4 flex items-center justify-between flex-shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center relative">
            <MessageSquare className="w-4 h-4 text-white" />
            {totalUnread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </div>
          <div>
            <h1 className="font-black text-black text-sm">صندوق الرسائل</h1>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-500" : "bg-red-400"}`} />
              <p className="text-[10px] text-black/35">{connected ? "متصل" : "جاري الاتصال..."}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* ── Contacts Sidebar ── */}
        <div className="w-[260px] border-l border-black/[0.06] bg-white flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-black/[0.05]">
            <div className="relative">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/25" />
              <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 text-xs pr-8 bg-black/[0.03] border-transparent" data-testid="input-search-contacts" />
            </div>
          </div>

          {/* New Message for non-clients */}
          {me?.role !== "client" && employees.length > 0 && (
            <div className="p-3 border-b border-black/[0.05]">
              <select
                value={newContactId}
                onChange={e => {
                  const u = employees.find((emp: any) => emp.id === e.target.value);
                  if (u) { setActiveContact({ id: u.id, fullName: u.fullName || u.username, role: u.role }); setNewContactId(""); }
                }}
                className="w-full h-8 text-xs border border-black/[0.08] rounded-lg px-2 bg-white text-black/60"
                data-testid="select-new-contact"
              >
                <option value="">+ رسالة جديدة</option>
                {employees.filter((e: any) => e.id !== me.id).map((e: any) => (
                  <option key={e.id} value={e.id}>{e.fullName || e.username} ({roleLabel(e.role)})</option>
                ))}
              </select>
            </div>
          )}

          <ScrollArea className="flex-1">
            {loadingMsgs ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-black/20" /></div>
            ) : filteredContacts.length === 0 ? (
              <div className="py-10 text-center px-4">
                <Users className="w-8 h-8 text-black/10 mx-auto mb-2" />
                <p className="text-xs text-black/30">لا توجد محادثات بعد</p>
              </div>
            ) : (
              <div>
                {filteredContacts.map(c => {
                  const isOnline = onlineUsers.has(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setActiveContact(c); setIsTypingRemote(false); setIsVoiceRemote(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-3 text-right transition-colors hover:bg-black/[0.02] border-b border-black/[0.04] ${activeContact?.id === c.id ? "bg-black/[0.04]" : ""}`}
                      data-testid={`contact-${c.id}`}
                    >
                      <Avatar name={c.fullName} role={c.role} online={isOnline} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-black truncate">{c.fullName}</p>
                          <span className="text-[9px] text-black/30 flex-shrink-0">{timeAgo(c.lastAt)}</span>
                        </div>
                        <p className="text-[10px] text-black/40 truncate mt-0.5">{c.lastMsg}</p>
                      </div>
                      {c.unread > 0 && (
                        <span className="w-4 h-4 bg-black text-white text-[9px] font-bold rounded-full flex items-center justify-center flex-shrink-0">{c.unread}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* ── Chat Area ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!activeContact ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-black/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-7 h-7 text-black/15" />
                </div>
                <p className="text-sm font-bold text-black/30">اختر محادثة للبدء</p>
                <p className="text-xs text-black/20 mt-1">أو ابدأ محادثة جديدة</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-black/[0.06] px-5 py-3 flex items-center gap-3 flex-shrink-0">
                <Avatar name={activeContact.fullName} role={activeContact.role} online={onlineUsers.has(activeContact.id)} />
                <div className="flex-1">
                  <p className="text-sm font-bold text-black">{activeContact.fullName}</p>
                  <div className="flex items-center gap-1.5 h-4">
                    {isVoiceRemote ? (
                      <span className="text-[10px] text-purple-500 animate-pulse flex items-center gap-1">
                        <Mic className="w-2.5 h-2.5" />يسجل صوتاً...
                      </span>
                    ) : isTypingRemote ? (
                      <span className="text-[10px] text-blue-500 flex items-center gap-1">
                        <span className="flex gap-0.5">
                          <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                        يكتب...
                      </span>
                    ) : (
                      <p className="text-[10px] text-black/40 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${onlineUsers.has(activeContact.id) ? "bg-green-500" : "bg-gray-300"}`} />
                        {onlineUsers.has(activeContact.id) ? "متصل الآن" : `${roleLabel(activeContact.role)}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-4">
                {loadingThread ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-5 h-5 animate-spin text-black/20" />
                  </div>
                ) : thread.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-xs text-black/30">ابدأ المحادثة</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {thread.map((msg: any) => {
                      const isMe = String(msg.fromUserId?.id || msg.fromUserId) === String(me?.id);
                      return (
                        <MessageBubble key={msg.id || msg._id} msg={msg} isMe={isMe} contact={activeContact} />
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input Area */}
              <div className="bg-white border-t border-black/[0.06] p-3 flex-shrink-0">
                {/* Recording Bar */}
                {isRecording && (
                  <div className="flex items-center gap-3 mb-3 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-red-600 flex-1">
                      تسجيل... {recordingTime}ث
                    </span>
                    <button onClick={cancelRecording} className="text-red-400 hover:text-red-600" data-testid="button-cancel-recording">
                      <X className="w-4 h-4" />
                    </button>
                    <button onClick={stopRecording} className="bg-red-500 text-white text-xs px-3 py-1 rounded-lg hover:bg-red-600 transition-colors font-semibold" data-testid="button-stop-recording">
                      إرسال
                    </button>
                  </div>
                )}

                <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
                  {/* File Attach */}
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }} data-testid="input-file-upload" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile || isRecording}
                    className="w-9 h-9 flex items-center justify-center text-black/30 hover:text-black/70 transition-colors rounded-xl hover:bg-black/[0.04] flex-shrink-0" data-testid="button-attach-file">
                    {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                  </button>

                  {/* Voice Recording */}
                  {!isRecording ? (
                    <button type="button" onClick={startRecording} disabled={uploadingFile}
                      className="w-9 h-9 flex items-center justify-center text-black/30 hover:text-black/70 transition-colors rounded-xl hover:bg-black/[0.04] flex-shrink-0" data-testid="button-start-recording">
                      <Mic className="w-4 h-4" />
                    </button>
                  ) : null}

                  {/* Text Input */}
                  {!isRecording && (
                    <Input
                      value={messageText}
                      onChange={e => handleInputChange(e.target.value)}
                      placeholder="اكتب رسالتك..."
                      className="flex-1 h-9 text-sm bg-black/[0.03] border-transparent focus:bg-white focus:border-black/20"
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      data-testid="input-message"
                    />
                  )}

                  {/* Send Button */}
                  {!isRecording && (
                    <Button type="submit" size="icon"
                      className="w-9 h-9 bg-black text-white rounded-xl hover:bg-black/80 flex-shrink-0"
                      disabled={!messageText.trim() || sendMutation.isPending}
                      data-testid="button-send-message">
                      {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  )}
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
