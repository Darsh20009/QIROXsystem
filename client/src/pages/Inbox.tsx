import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2, MessageSquare, Send, Users, Search, Paperclip,
  Mic, X, Download, Play, Pause, FileText, CheckCheck, Check,
  ArrowRight, Phone, MoreVertical, Smile, Trash2
} from "lucide-react";
import { useInboxSocket } from "@/hooks/useInboxSocket";
import { UserAvatar } from "@/components/UserAvatar";

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function timeAgo(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} س`;
  return d.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    admin: "مدير", manager: "مدير عام", developer: "مطور",
    designer: "مصمم", support: "دعم", client: "عميل",
    sales: "مبيعات", sales_manager: "مدير مبيعات", accountant: "محاسب",
  };
  return map[role] || role;
}

function getRoleGradient(role?: string) {
  const map: Record<string, string> = {
    admin:         "from-gray-800 to-black",
    manager:       "from-slate-700 to-slate-900",
    developer:     "from-violet-500 to-indigo-600",
    designer:      "from-pink-500 to-rose-600",
    client:        "from-blue-500 to-cyan-600",
    support:       "from-emerald-500 to-green-600",
    sales:         "from-orange-500 to-amber-600",
    sales_manager: "from-red-500 to-orange-600",
    accountant:    "from-teal-500 to-cyan-600",
  };
  return map[role || ""] || "from-gray-500 to-gray-700";
}

// ─────────────────────────────────────────────────────────
// Avatar (uses UserAvatar for photo/custom avatar support)
// ─────────────────────────────────────────────────────────
function Avatar({ name, role, online, size = "md", profilePhotoUrl, avatarConfig }: {
  name: string; role?: string; online?: boolean; size?: "sm" | "md" | "lg";
  profilePhotoUrl?: string; avatarConfig?: string;
}) {
  const avatarSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "md";
  const dotSz = size === "sm" ? "w-2 h-2 border" : "w-2.5 h-2.5 border-2";
  return (
    <div className="relative flex-shrink-0">
      <UserAvatar
        profilePhotoUrl={profilePhotoUrl}
        avatarConfig={avatarConfig}
        name={name}
        role={role}
        size={avatarSize as any}
      />
      {online !== undefined && (
        <div className={`absolute bottom-0 left-0 ${dotSz} rounded-full border-white dark:border-gray-900 ${online ? "bg-emerald-400" : "bg-gray-300 dark:bg-gray-600"}`} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Voice Player
// ─────────────────────────────────────────────────────────
function getAudioMimeType(url: string): string {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  if (ext === "oga" || ext === "ogg") return "audio/ogg";
  if (ext === "weba" || ext === "webm") return "audio/webm";
  if (ext === "m4a") return "audio/mp4";
  if (ext === "mp3") return "audio/mpeg";
  if (ext === "wav") return "audio/wav";
  return "";
}

function VoicePlayer({ url, isMe = false }: { url: string; isMe?: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadError, setLoadError] = useState(false);

  const toggle = () => {
    if (!audioRef.current || loadError) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play().catch(() => setLoadError(true)); setPlaying(true); }
  };

  const mimeType = getAudioMimeType(url);

  return (
    <div className="flex items-center gap-2.5 min-w-[160px] max-w-[220px]">
      <audio ref={audioRef} preload="metadata"
        onTimeUpdate={() => audioRef.current && setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0)}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={() => { setPlaying(false); setProgress(0); }}
        onError={() => setLoadError(true)}
      >
        <source src={url} type={mimeType || undefined} />
      </audio>
      <button
        onClick={toggle}
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
          isMe ? "bg-white/20 hover:bg-white/30 text-white" : "bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200"
        } ${loadError ? "opacity-40 cursor-not-allowed" : ""}`}
      >
        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>
      <div className="flex-1">
        <div className={`h-1.5 rounded-full overflow-hidden ${isMe ? "bg-white/20" : "bg-black/10 dark:bg-white/10"}`}>
          <div
            className={`h-full rounded-full transition-all ${isMe ? "bg-white/70" : "bg-gray-500 dark:bg-gray-300"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={`text-[9px] mt-0.5 block ${isMe ? "text-white/50" : "text-gray-400 dark:text-gray-400"}`}>
          {loadError ? "⚠️ خطأ" : duration > 0 ? `${Math.floor(duration)}ث` : "🎙️ صوتية"}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Read Receipt Icon
// ─────────────────────────────────────────────────────────
function ReadReceipt({ read }: { read: boolean }) {
  if (read) {
    return (
      <span title="شاهد الرسالة" className="flex items-center">
        <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
      </span>
    );
  }
  return (
    <span title="تم الإرسال">
      <Check className="w-3.5 h-3.5 text-white/40" />
    </span>
  );
}

// ─────────────────────────────────────────────────────────
// Message Bubble
// ─────────────────────────────────────────────────────────
function MessageBubble({ msg, isMe, contact, onDelete }: { msg: any; isMe: boolean; contact: any; onDelete?: (id: string) => void }) {
  const [hovered, setHovered] = useState(false);
  const hasText = !!msg.body;
  const hasAttachment = !!msg.attachmentUrl;
  const attachType = msg.attachmentType;
  const msgId = msg.id || msg._id;

  return (
    <div
      className={`flex items-end gap-2 group ${isMe ? "flex-row-reverse" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!isMe && <Avatar name={contact?.fullName || "?"} role={contact?.role} size="sm" profilePhotoUrl={contact?.profilePhotoUrl} avatarConfig={contact?.avatarConfig} />}

      <div className={`max-w-[72%] sm:max-w-[60%] rounded-2xl overflow-hidden shadow-sm ${
        isMe
          ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm"
          : "bg-white dark:bg-gray-800 border border-black/[0.06] dark:border-white/[0.06] text-gray-900 dark:text-gray-100 rounded-tl-sm"
      }`}>
        {/* Image */}
        {hasAttachment && attachType === "image" && (
          <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer">
            <img src={msg.attachmentUrl} alt={msg.attachmentName || "صورة"} className="max-w-[240px] max-h-[200px] object-cover hover:opacity-90 transition-opacity" />
          </a>
        )}
        {/* Voice */}
        {hasAttachment && attachType === "voice" && (
          <div className="px-3.5 py-3">
            <VoicePlayer url={msg.attachmentUrl} isMe={isMe} />
          </div>
        )}
        {/* File */}
        {hasAttachment && attachType === "file" && (
          <a href={msg.attachmentUrl} download={msg.attachmentName} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-2.5 px-3.5 py-3 hover:opacity-80 transition-opacity ${isMe ? "text-white" : "text-gray-800 dark:text-gray-200"}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isMe ? "bg-white/20" : "bg-violet-100 dark:bg-violet-900/30"}`}>
              <FileText className={`w-4 h-4 ${isMe ? "text-white" : "text-violet-600 dark:text-violet-400"}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate max-w-[160px]">{msg.attachmentName || "ملف"}</p>
              {msg.attachmentSize && <p className={`text-[9px] ${isMe ? "text-white/50" : "text-gray-400"}`}>{formatSize(msg.attachmentSize)}</p>}
            </div>
            <Download className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
          </a>
        )}
        {/* Text */}
        {hasText && (
          <div className="px-3.5 py-2.5">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
          </div>
        )}
        {/* Footer */}
        <div className="px-3.5 pb-2 flex items-center justify-end gap-1.5">
          <span className={`text-[9px] ${isMe ? "text-white/40" : "text-gray-400 dark:text-gray-500"}`}>
            {formatTime(msg.createdAt)}
          </span>
          {isMe && <ReadReceipt read={!!msg.read} />}
        </div>
      </div>

      {/* Delete button */}
      {hovered && onDelete && (
        <button
          onClick={() => onDelete(msgId)}
          className="w-6 h-6 flex items-center justify-center rounded-full text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
          title="حذف"
          data-testid={`button-delete-message-${msgId}`}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Date Separator
// ─────────────────────────────────────────────────────────
function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  let label = d.toLocaleDateString("ar-SA", { weekday: "long", month: "long", day: "numeric" });
  if (d.toDateString() === today.toDateString()) label = "اليوم";
  else if (d.toDateString() === yesterday.toDateString()) label = "الأمس";
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-black/[0.06] dark:bg-white/[0.06]" />
      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium px-2 bg-gray-50 dark:bg-gray-900/50 rounded-full border border-black/[0.05] dark:border-white/[0.05] py-0.5">
        {label}
      </span>
      <div className="flex-1 h-px bg-black/[0.06] dark:bg-white/[0.06]" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Sound Notification
// ─────────────────────────────────────────────────────────
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
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.2);
  } catch {}
}

// ─────────────────────────────────────────────────────────
// Typing Indicator
// ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-end gap-2 px-1">
      <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        {[0, 150, 300].map(delay => (
          <span key={delay} className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────
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
  const [showContacts, setShowContacts] = useState(true); // mobile view toggle

  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
          if (Notification.permission === "granted") {
            const senderName = evt.message?.fromUserId?.fullName || "رسالة";
            new Notification(`💬 ${senderName}`, { body: evt.message?.body || "رسالة جديدة", tag: `msg-${fromId}` });
          }
        }
      }
      if (evt.type === "typing" && String(evt.fromUserId) === activeContactIdRef.current) {
        setIsTypingRemote(evt.isTyping);
        if (evt.isTyping) setTimeout(() => setIsTypingRemote(false), 4000);
      }
      if (evt.type === "voice_recording" && String(evt.fromUserId) === activeContactIdRef.current) {
        setIsVoiceRemote(evt.isRecording);
      }
    },
  });

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
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const r = await fetch("/api/employees");
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
          profilePhotoUrl: other?.profilePhotoUrl || "",
          avatarConfig: other?.avatarConfig || "",
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
    (c.fullName || c.username || "").toLowerCase().includes(search.toLowerCase())
  );

  // Scroll to bottom when thread loads
  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timer);
  }, [thread]);

  // Focus input when chat opens on mobile
  useEffect(() => {
    if (activeContact && !showContacts) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [activeContact, showContacts]);

  // ── Typing ──
  const handleInputChange = (val: string) => {
    setMessageText(val);
    if (activeContact?.id) {
      if (!isTypingLocal) { setIsTypingLocal(true); sendTyping(activeContact.id, true); }
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        setIsTypingLocal(false);
        sendTyping(activeContact.id, false);
      }, 2000);
    }
  };

  // ── Mutations ──
  const deleteMutation = useMutation({
    mutationFn: async (msgId: string) => (await apiRequest("DELETE", `/api/inbox/${msgId}`)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inbox"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inbox/thread", activeContact?.id] });
    },
    onError: () => toast({ title: "تعذّر حذف الرسالة", variant: "destructive" }),
  });

  const sendMutation = useMutation({
    mutationFn: async (data: { body?: string; attachmentUrl?: string; attachmentType?: string; attachmentName?: string; attachmentSize?: number }) => {
      if (!activeContact?.id) return;
      return (await apiRequest("POST", "/api/inbox", { toUserId: activeContact.id, ...data })).json();
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
      sendMutation.mutate({
        attachmentUrl: data.url,
        attachmentType: file.type.startsWith("image/") ? "image" : "file",
        attachmentName: file.name,
        attachmentSize: file.size,
      });
    } catch {
      toast({ title: "فشل رفع الملف", variant: "destructive" });
    } finally { setUploadingFile(false); }
  };

  // ── Voice Recording ──
  const getSupportedMimeType = () => {
    const types = ["audio/ogg;codecs=opus", "audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
    for (const t of types) { try { if (MediaRecorder.isTypeSupported(t)) return t; } catch {} }
    return "";
  };

  const startRecording = async () => {
    if (!activeContact?.id) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: BlobPart[] = [];
      const mimeType = getSupportedMimeType();
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mr.ondataavailable = e => { if (e.data?.size > 0) chunks.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setIsRecording(false);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setRecordingTime(0);
        if (activeContact?.id) sendVoiceRecording(activeContact.id, false);
        const finalType = mimeType || mr.mimeType || "audio/webm";
        const ext = finalType.includes("mp4") ? "m4a" : finalType.includes("ogg") ? "oga" : "weba";
        const blob = new Blob(chunks, { type: finalType });
        if (blob.size < 100) return;
        const formData = new FormData();
        formData.append("file", blob, `voice_${Date.now()}.${ext}`);
        setUploadingFile(true);
        try {
          const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
          if (!res.ok) throw new Error("upload failed");
          const data = await res.json();
          if (data.url) sendMutation.mutate({ attachmentUrl: data.url, attachmentType: "voice", attachmentName: "رسالة صوتية", attachmentSize: blob.size });
        } catch { toast({ title: "فشل إرسال الصوت", variant: "destructive" }); }
        finally { setUploadingFile(false); }
      };
      mr.start(100);
      setMediaRecorder(mr);
      setIsRecording(true);
      setRecordingTime(0);
      if (activeContact?.id) sendVoiceRecording(activeContact.id, true);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch { toast({ title: "لا يمكن الوصول للمايك", variant: "destructive" }); }
  };

  const stopRecording = () => { mediaRecorder?.stop(); setMediaRecorder(null); };
  const cancelRecording = () => {
    if (mediaRecorder) { mediaRecorder.ondataavailable = null; mediaRecorder.onstop = null; mediaRecorder.stop(); setMediaRecorder(null); }
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setRecordingTime(0);
    if (activeContact?.id) sendVoiceRecording(activeContact.id, false);
  };

  // Group messages by date
  const groupedThread = (() => {
    const groups: { date: string; messages: any[] }[] = [];
    for (const msg of thread) {
      const dateKey = new Date(msg.createdAt).toDateString();
      const last = groups[groups.length - 1];
      if (last?.date === dateKey) last.messages.push(msg);
      else groups.push({ date: dateKey, messages: [msg] });
    }
    return groups;
  })();

  const totalUnread = contacts.reduce((s, c) => s + c.unread, 0);

  const openChat = (contact: any) => {
    setActiveContact(contact);
    setIsTypingRemote(false);
    setIsVoiceRemote(false);
    setShowContacts(false);
  };

  const backToContacts = () => {
    setShowContacts(true);
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <p className="text-gray-400 text-sm">يجب تسجيل الدخول</p>
    </div>
  );

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 flex flex-col" dir="rtl">

      {/* ── Top Bar (mobile only) ── */}
      <div className="md:hidden bg-white dark:bg-gray-900 border-b border-black/[0.06] dark:border-white/[0.06] px-4 py-3 flex items-center gap-3 flex-shrink-0 safe-top">
        {!showContacts && activeContact ? (
          <>
            <button onClick={backToContacts} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300" data-testid="button-back-to-contacts">
              <ArrowRight className="w-4 h-4" />
            </button>
            <Avatar name={activeContact.fullName} role={activeContact.role} online={onlineUsers.has(activeContact.id)} size="sm" profilePhotoUrl={activeContact.profilePhotoUrl} avatarConfig={activeContact.avatarConfig} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{activeContact.fullName}</p>
              <p className="text-[10px] text-gray-400">
                {isTypingRemote ? "يكتب..." : isVoiceRemote ? "يسجل صوتاً..." : onlineUsers.has(activeContact.id) ? "متصل الآن" : roleLabel(activeContact.role)}
              </p>
            </div>
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-red-400"}`} />
          </>
        ) : (
          <>
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center relative shadow-sm">
              <MessageSquare className="w-4 h-4 text-white" />
              {totalUnread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}
            </div>
            <h1 className="font-black text-gray-900 dark:text-white text-sm flex-1">صندوق الرسائل</h1>
            <div className={`flex items-center gap-1 text-[10px] ${connected ? "text-emerald-500" : "text-red-400"}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-red-400"}`} />
              {connected ? "متصل" : "..."}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Contacts Panel ── */}
        <div className={`
          ${showContacts ? "flex" : "hidden"} md:flex
          w-full md:w-[300px] lg:w-[320px]
          flex-col flex-shrink-0
          bg-white dark:bg-gray-900
          md:border-l border-black/[0.06] dark:border-white/[0.06]
        `}>
          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between px-4 py-4 border-b border-black/[0.06] dark:border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm relative">
                <MessageSquare className="w-4 h-4 text-white" />
                {totalUnread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{totalUnread > 9 ? "9+" : totalUnread}</span>
                )}
              </div>
              <div>
                <h1 className="font-black text-sm text-gray-900 dark:text-white">الرسائل</h1>
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-red-400"}`} />
                  <p className="text-[10px] text-gray-400">{connected ? "متصل" : "جاري الاتصال..."}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="px-3 py-2.5 border-b border-black/[0.04] dark:border-white/[0.04]">
            <div className="relative">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                placeholder="بحث في المحادثات..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 text-xs pr-8 bg-gray-50 dark:bg-gray-800 border-transparent focus:border-violet-300 dark:focus:border-violet-700"
                data-testid="input-search-contacts"
              />
            </div>
          </div>

          {/* New Message (employees only) */}
          {me?.role !== "client" && employees.length > 0 && (
            <div className="px-3 py-2 border-b border-black/[0.04] dark:border-white/[0.04]">
              <select
                value={newContactId}
                onChange={e => {
                  const u = employees.find((emp: any) => emp.id === e.target.value);
                  if (u) { openChat({ id: u.id, fullName: u.fullName || u.username, role: u.role }); setNewContactId(""); }
                }}
                className="w-full h-8 text-xs border border-black/[0.08] dark:border-white/[0.08] rounded-lg px-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                data-testid="select-new-contact"
              >
                <option value="">+ رسالة جديدة للفريق</option>
                {employees.filter((e: any) => e.id !== me.id).map((e: any) => (
                  <option key={e.id} value={e.id}>{e.fullName || e.username} ({roleLabel(e.role)})</option>
                ))}
              </select>
            </div>
          )}

          {/* Contacts List */}
          <ScrollArea className="flex-1">
            {loadingMsgs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-gray-300 dark:text-gray-600" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="py-12 text-center px-6">
                <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-xs font-semibold text-gray-400">لا توجد محادثات بعد</p>
                <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">ابدأ محادثة جديدة أعلاه</p>
              </div>
            ) : (
              <div className="py-1">
                {filteredContacts.map(c => {
                  const isOnline = onlineUsers.has(c.id);
                  const isActive = activeContact?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => openChat(c)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-all duration-150 ${
                        isActive
                          ? "bg-violet-50 dark:bg-violet-900/20 border-r-2 border-violet-500"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/60 border-r-2 border-transparent"
                      }`}
                      data-testid={`contact-${c.id}`}
                    >
                      <Avatar name={c.fullName} role={c.role} online={isOnline} size="md" profilePhotoUrl={c.profilePhotoUrl} avatarConfig={c.avatarConfig} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className={`text-xs font-bold truncate ${isActive ? "text-violet-700 dark:text-violet-300" : "text-gray-800 dark:text-gray-100"}`}>{c.fullName}</p>
                          <span className="text-[9px] text-gray-400 flex-shrink-0 mr-1">{timeAgo(c.lastAt)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{c.lastMsg}</p>
                          {c.unread > 0 && (
                            <span className="w-4 h-4 bg-violet-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center flex-shrink-0 mr-1">
                              {c.unread > 9 ? "9+" : c.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* ── Chat Area ── */}
        <div className={`
          ${!showContacts || activeContact ? "flex" : "hidden"} md:flex
          flex-1 flex-col overflow-hidden
          bg-gray-50 dark:bg-gray-950
        `}>
          {!activeContact ? (
            /* Empty state */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-6">
                <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <MessageSquare className="w-9 h-9 text-violet-400 dark:text-violet-500" />
                </div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">اختر محادثة للبدء</p>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5">ستظهر رسائلك هنا</p>
              </div>
            </div>
          ) : (
            <>
              {/* ── Chat Header (desktop only) ── */}
              <div className="hidden md:flex bg-white dark:bg-gray-900 border-b border-black/[0.06] dark:border-white/[0.06] px-5 py-3 items-center gap-3 flex-shrink-0 shadow-sm">
                <Avatar name={activeContact.fullName} role={activeContact.role} online={onlineUsers.has(activeContact.id)} profilePhotoUrl={activeContact.profilePhotoUrl} avatarConfig={activeContact.avatarConfig} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{activeContact.fullName}</p>
                  <div className="flex items-center gap-1.5 h-4">
                    {isVoiceRemote ? (
                      <span className="text-[10px] text-purple-500 animate-pulse flex items-center gap-1">
                        <Mic className="w-2.5 h-2.5" /> يسجل صوتاً...
                      </span>
                    ) : isTypingRemote ? (
                      <span className="text-[10px] text-violet-500 font-medium flex items-center gap-1">
                        <span className="flex gap-0.5">
                          {[0, 150, 300].map(d => <span key={d} className="w-1 h-1 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                        </span>
                        يكتب...
                      </span>
                    ) : (
                      <p className="text-[10px] text-gray-400 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${onlineUsers.has(activeContact.id) ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`} />
                        {onlineUsers.has(activeContact.id) ? "متصل الآن" : roleLabel(activeContact.role)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500" : "bg-red-400"}`} title={connected ? "متصل" : "غير متصل"} />
                </div>
              </div>

              {/* ── Messages Area ── */}
              <ScrollArea className="flex-1 px-3 sm:px-5 py-4">
                {loadingThread ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-300 dark:text-gray-600" />
                  </div>
                ) : thread.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                    </div>
                    <p className="text-xs text-gray-400">ابدأ المحادثة الآن</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {groupedThread.map(({ date, messages }) => (
                      <div key={date}>
                        <DateSeparator date={messages[0].createdAt} />
                        <div className="space-y-1.5">
                          {messages.map((msg: any) => {
                            const isMe = String(msg.fromUserId?.id || msg.fromUserId) === String(me?.id);
                            return (
                              <MessageBubble
                                key={msg.id || msg._id}
                                msg={msg}
                                isMe={isMe}
                                contact={activeContact}
                                onDelete={(id) => deleteMutation.mutate(id)}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {(isTypingRemote || isVoiceRemote) && <TypingDots />}
                    <div ref={bottomRef} />
                  </div>
                )}
              </ScrollArea>

              {/* ── Input Area ── */}
              <div className="bg-white dark:bg-gray-900 border-t border-black/[0.06] dark:border-white/[0.06] p-3 flex-shrink-0 safe-bottom">
                {/* Recording Bar */}
                {isRecording && (
                  <div className="flex items-center gap-3 mb-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-xl px-3 py-2.5">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400 flex-1">
                      تسجيل... {recordingTime}ث
                    </span>
                    <button onClick={cancelRecording} className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors" data-testid="button-cancel-recording">
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={stopRecording}
                      className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors font-semibold flex items-center gap-1"
                      data-testid="button-stop-recording"
                    >
                      <Send className="w-3 h-3" /> إرسال
                    </button>
                  </div>
                )}

                <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }}
                    data-testid="input-file-upload"
                  />

                  {/* Attach */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile || isRecording}
                    className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20 flex-shrink-0"
                    data-testid="button-attach-file"
                  >
                    {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                  </button>

                  {/* Voice */}
                  {!isRecording && (
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={uploadingFile}
                      className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20 flex-shrink-0"
                      data-testid="button-start-recording"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  )}

                  {/* Text Input */}
                  {!isRecording && (
                    <div className="flex-1 relative">
                      <Input
                        ref={inputRef}
                        value={messageText}
                        onChange={e => handleInputChange(e.target.value)}
                        placeholder="اكتب رسالتك..."
                        className="h-10 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-violet-400 dark:focus:border-violet-600 rounded-xl pr-3 pl-3"
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        data-testid="input-message"
                      />
                    </div>
                  )}

                  {/* Send */}
                  {!isRecording && (
                    <Button
                      type="submit"
                      size="icon"
                      className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 shadow-sm flex-shrink-0 disabled:opacity-50"
                      disabled={!messageText.trim() || sendMutation.isPending}
                      data-testid="button-send-message"
                    >
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
