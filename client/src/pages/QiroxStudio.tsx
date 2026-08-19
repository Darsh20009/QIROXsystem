import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  Send, Loader2, User, Sparkles, RefreshCw, Copy, Check,
  ImagePlus, X, Wand2, Paperclip, Download, ZoomIn,
  MessageSquare, Palette, Code2, Brain, Lightbulb,
  ChevronDown, ChevronUp, CheckSquare, Square, Eye,
  Maximize2, Star, Zap, Globe, BarChart3, Video, Play,
} from "lucide-react";

interface Msg {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
  images?: { url: string; prompt?: string; style?: string }[];
  videos?: { url: string; prompt?: string }[];
  attachedImages?: string[];
  attachedTasks?: Task[];
  thinking?: boolean;
}

interface Task {
  _id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
}

const IMAGE_STYLES = [
  { id: "realistic", labelAr: "واقعي", labelEn: "Realistic", color: "from-blue-500 to-cyan-500" },
  { id: "cartoon", labelAr: "كرتوني", labelEn: "Cartoon", color: "from-yellow-500 to-orange-500" },
  { id: "3d render", labelAr: "ثلاثي الأبعاد", labelEn: "3D Render", color: "from-purple-500 to-pink-500" },
  { id: "watercolor", labelAr: "مائي", labelEn: "Watercolor", color: "from-teal-500 to-green-500" },
  { id: "minimalist", labelAr: "مبسط", labelEn: "Minimalist", color: "from-gray-500 to-slate-500" },
  { id: "cinematic", labelAr: "سينمائي", labelEn: "Cinematic", color: "from-red-500 to-rose-500" },
  { id: "logo design", labelAr: "شعار", labelEn: "Logo", color: "from-indigo-500 to-violet-500" },
  { id: "ui mockup", labelAr: "واجهة", labelEn: "UI Mockup", color: "from-emerald-500 to-teal-500" },
];

const QUICK_PROMPTS_AR = [
  { icon: Palette, text: "ولّد لي تصميم بنر احترافي لـ QIROX", type: "image" },
  { icon: Brain, text: "حلّل هذه الصورة وأعطني أفكاراً للتطوير", type: "vision" },
  { icon: Code2, text: "اكتب لي مكوّن React احترافي مع Tailwind", type: "code" },
  { icon: Lightbulb, text: "أعطني 10 أفكار إبداعية لتطوير منصة SaaS", type: "ideas" },
  { icon: BarChart3, text: "ساعدني في تحليل بيانات الأداء وإعداد تقرير", type: "analysis" },
  { icon: Globe, text: "اكتب محتوى تسويقي احترافي بالعربية", type: "content" },
];

const QUICK_PROMPTS_EN = [
  { icon: Palette, text: "Generate a professional banner for QIROX", type: "image" },
  { icon: Brain, text: "Analyze this image and suggest improvements", type: "vision" },
  { icon: Code2, text: "Write a professional React component with Tailwind", type: "code" },
  { icon: Lightbulb, text: "Give me 10 creative ideas for a SaaS platform", type: "ideas" },
  { icon: BarChart3, text: "Help me analyze performance data and prepare a report", type: "analysis" },
  { icon: Globe, text: "Write professional marketing content in Arabic", type: "content" },
];

function parseContent(text: string) {
  const parts: { type: "text" | "code"; content: string; lang?: string }[] = [];
  const regex = /```(\w+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    parts.push({ type: "code", lang: match[1] || "text", content: match[2].trim() });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push({ type: "text", content: text.slice(lastIndex) });
  return parts;
}

function CodeBlock({ content, lang }: { content: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-3 rounded-xl overflow-hidden border border-white/10 bg-black/50">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/8">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>
          <span className="text-[10px] font-mono text-white/30 ml-1">{lang}</span>
        </div>
        <button onClick={() => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-white/70 transition-colors px-2 py-1 rounded-lg hover:bg-white/10">
          {copied ? <><Check className="w-3 h-3 text-green-400" /><span className="text-green-400">تم النسخ</span></> : <><Copy className="w-3 h-3" /><span>نسخ</span></>}
        </button>
      </div>
      <pre className="p-4 text-[12px] font-mono text-emerald-300/90 overflow-x-auto leading-relaxed whitespace-pre-wrap"><code>{content}</code></pre>
    </div>
  );
}

function ImagePreview({ url, prompt }: { url: string; prompt?: string }) {
  const [zoomed, setZoomed] = useState(false);
  return (
    <>
      <div className="mt-3 rounded-2xl overflow-hidden border border-white/10 bg-black/30 group relative">
        <img src={url} alt={prompt || "Generated"} className="w-full max-h-80 object-cover cursor-zoom-in" onClick={() => setZoomed(true)} loading="lazy" />
        {/* QIROX watermark */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 pointer-events-none">
          <img src="/qirox-icon-nobg.png" alt="" className="w-3 h-3 object-contain opacity-70" />
          <span className="text-[9px] font-black text-white/60 tracking-wider">QIROX AI</span>
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            <button onClick={() => setZoomed(true)} className="p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 transition-colors"><ZoomIn className="w-4 h-4" /></button>
            <a href={url} download target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 transition-colors"><Download className="w-4 h-4" /></a>
          </div>
        </div>
        {prompt && <div className="px-3 py-2 text-[10px] text-white/30 border-t border-white/5 truncate">{prompt}</div>}
      </div>
      <AnimatePresence>
        {zoomed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4" onClick={() => setZoomed(false)}>
            <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
              src={url} alt={prompt} className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl" />
            {/* Watermark on zoom */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10">
              <img src="/qirox-icon-nobg.png" alt="" className="w-4 h-4 object-contain opacity-60" />
              <span className="text-[10px] font-black text-white/50 tracking-widest">QIROX AI</span>
            </div>
            <button onClick={() => setZoomed(false)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
              <X className="w-5 h-5 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function TypewriterText({ text, onDone }: { text: string; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    if (!text) return;
    const speed = text.length > 400 ? 6 : text.length > 150 ? 10 : 18;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(iv);
        setDone(true);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(iv);
  }, [text]);
  return (
    <span className="whitespace-pre-wrap">
      {displayed}
      {!done && <span className="inline-block w-0.5 h-[1em] bg-violet-400 ml-0.5 animate-pulse align-middle" />}
    </span>
  );
}

function VideoPreview({ url, prompt }: { url: string; prompt?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  return (
    <div className="mt-3 rounded-2xl overflow-hidden border border-white/10 bg-black/30">
      {!loaded && !error && (
        <div className="flex items-center justify-center gap-2 py-8 text-white/40">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">جاري توليد الفيديو...</span>
        </div>
      )}
      {error ? (
        <div className="flex items-center justify-center gap-2 py-8 text-red-400/70 text-sm">
          <X className="w-4 h-4" />
          <span>فشل توليد الفيديو</span>
        </div>
      ) : (
        <video
          src={url}
          controls
          autoPlay
          loop
          muted
          className={`w-full max-h-80 object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0 h-0"}`}
          onLoadedData={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
      {prompt && (
        <div className="px-3 py-2 text-[10px] text-white/30 border-t border-white/5 truncate flex items-center gap-1.5">
          <Play className="w-3 h-3" />
          {prompt}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg, L, isNew, userAvatar, userName }: {
  msg: Msg; L: boolean; isNew?: boolean; userAvatar?: string; userName?: string;
}) {
  const isAI = msg.role === "ai";
  const parts = isAI ? parseContent(msg.content) : [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isAI ? "" : "flex-row-reverse"}`}>

      {/* Avatar */}
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden ${
        isAI ? "bg-gradient-to-br from-violet-600 to-purple-700 shadow-lg shadow-violet-500/25" : "bg-black/[0.04] dark:bg-white/[0.07] border border-black/10 dark:border-white/10"
      }`}>
        {isAI ? (
          <img src="/qirox-icon-nobg.png" alt="Q" className="w-6 h-6 object-contain" />
        ) : userAvatar ? (
          <img src={userAvatar} alt={userName || ""} className="w-full h-full object-cover" />
        ) : userName ? (
          <span className="text-xs font-black text-gray-700 dark:text-white/80">{userName.charAt(0).toUpperCase()}</span>
        ) : (
          <User className="w-4 h-4 text-gray-600 dark:text-white/70" />
        )}
      </div>

      <div className={`flex-1 max-w-[88%] ${isAI ? "" : "flex flex-col items-end"}`}>
        {/* Sender label for AI */}
        {isAI && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[10px] font-black text-violet-400 tracking-wide">QIROX AI</span>
            <img src="/qirox-icon-nobg.png" alt="" className="w-3 h-3 object-contain opacity-50" />
          </div>
        )}

        {msg.thinking ? (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.06] w-fit">
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-2 h-2 rounded-full bg-violet-400/60"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.0, delay: i * 0.2, repeat: Infinity }} />
              ))}
            </div>
            <span className="text-xs text-gray-400 dark:text-white/40">{L ? "يفكر..." : "Thinking..."}</span>
          </div>
        ) : (
          <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isAI
              ? "bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.07] text-gray-900 dark:text-white/90"
              : "bg-gradient-to-br from-violet-600/25 to-purple-600/20 border border-violet-500/25 text-gray-900 dark:text-white"
          }`}>
            {msg.attachedImages && msg.attachedImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {msg.attachedImages.map((img, i) => (
                  <img key={i} src={img} alt="" className="h-20 w-20 rounded-xl object-cover border border-black/10 dark:border-white/10" />
                ))}
              </div>
            )}
            {msg.attachedTasks && msg.attachedTasks.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {msg.attachedTasks.map((t, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-violet-500/20 border border-violet-500/30 text-[11px]">
                    <CheckSquare className="w-3 h-3 text-violet-400" />
                    <span className="text-violet-200 font-medium">{t.title}</span>
                  </div>
                ))}
              </div>
            )}
            {isAI ? (
              <>
                {parts.map((p, i) =>
                  p.type === "code"
                    ? <CodeBlock key={i} content={p.content} lang={p.lang || "text"} />
                    : (isNew && i === parts.findIndex(x => x.type === "text"))
                      ? <p key={i} className="mb-1"><TypewriterText text={p.content} /></p>
                      : <p key={i} className="whitespace-pre-wrap mb-1">{p.content}</p>
                )}
                {msg.images?.map((img, i) => <ImagePreview key={i} url={img.url} prompt={img.prompt} />)}
                {msg.videos?.map((vid, i) => <VideoPreview key={i} url={vid.url} prompt={vid.prompt} />)}
              </>
            ) : (
              <p className="whitespace-pre-wrap">{msg.content}</p>
            )}
          </div>
        )}
        <span className="text-[10px] text-gray-400 dark:text-white/20 mt-1 mx-1">
          {msg.timestamp.toLocaleTimeString(L ? "ar-SA" : "en", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </motion.div>
  );
}

export default function QiroxStudio() {
  const { lang } = useI18n();
  const L = lang === "ar";
  const { data: user } = useUser();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [newestMsgId, setNewestMsgId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `studio-${Date.now()}`);

  // Image upload
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Task attachment
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);

  // Image generation panel
  const [showImageGen, setShowImageGen] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("realistic");
  const [generatingImage, setGeneratingImage] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Fetch tasks for attachment
  const { data: tasksData } = useQuery<any>({
    queryKey: ["/api/admin/kanban/tasks"],
    enabled: showTaskPicker,
  });
  const tasks: Task[] = tasksData?.tasks || tasksData || [];

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).slice(0, 4).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        setUploadedImages(prev => [...prev.slice(-3), result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    setInput("");
    setShowImageGen(false);

    const userMsg: Msg = {
      id: `u-${Date.now()}`, role: "user", content,
      timestamp: new Date(),
      attachedImages: uploadedImages.length ? [...uploadedImages] : undefined,
      attachedTasks: selectedTasks.length ? [...selectedTasks] : undefined,
    };
    const thinking: Msg = { id: `t-${Date.now()}`, role: "ai", content: "", timestamp: new Date(), thinking: true };

    setMessages(prev => [...prev, userMsg, thinking]);
    setLoading(true);

    const imgsCopy = [...uploadedImages];
    const tasksCopy = [...selectedTasks];
    setUploadedImages([]);
    setSelectedTasks([]);

    try {
      const res = await apiRequest("POST", "/api/studio/chat", {
        message: content,
        sessionId,
        images: imgsCopy,
        tasks: tasksCopy,
      }).then(r => r.json());

      const aiId = `a-${Date.now()}`;
      const aiMsg: Msg = {
        id: aiId, role: "ai",
        content: res.reply || (L ? "تم الإنجاز." : "Done."),
        timestamp: new Date(),
        images: res.images || [],
        videos: res.videos || [],
      };
      setNewestMsgId(aiId);
      setMessages(prev => prev.filter(m => !m.thinking).concat(aiMsg));
    } catch (err: any) {
      setMessages(prev => prev.filter(m => !m.thinking));
      toast({ title: L ? "حدث خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [input, loading, sessionId, uploadedImages, selectedTasks, L]);

  const generateImageDirect = async () => {
    if (!imagePrompt.trim() || generatingImage) return;
    setGeneratingImage(true);
    setShowImageGen(false);

    const thinking: Msg = { id: `t-${Date.now()}`, role: "ai", content: "", timestamp: new Date(), thinking: true };
    const userMsg: Msg = {
      id: `u-${Date.now()}`, role: "user",
      content: `🎨 ${L ? "توليد صورة" : "Generate image"}: ${imagePrompt} — ${L ? "أسلوب" : "Style"}: ${selectedStyle}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg, thinking]);

    try {
      const res = await apiRequest("POST", "/api/studio/chat", {
        message: imagePrompt,
        sessionId,
        generateImage: true,
        imageStyle: selectedStyle,
      }).then(r => r.json());

      const aiId = `a-${Date.now()}`;
      const aiMsg: Msg = {
        id: aiId, role: "ai",
        content: res.reply || "تم توليد الصورة! 🎨",
        timestamp: new Date(),
        images: res.images || [],
      };
      setNewestMsgId(aiId);
      setMessages(prev => prev.filter(m => !m.thinking).concat(aiMsg));
    } catch (err: any) {
      setMessages(prev => prev.filter(m => !m.thinking));
      toast({ title: L ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingImage(false);
      setImagePrompt("");
    }
  };

  const PROMPTS = L ? QUICK_PROMPTS_AR : QUICK_PROMPTS_EN;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#08090d] text-gray-900 dark:text-white overflow-hidden relative" dir={L ? "rtl" : "ltr"}>
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0)", backgroundSize: "28px 28px" }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 py-3.5 border-b border-black/[0.08] dark:border-white/[0.06] bg-white/70 dark:bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-500/30 overflow-hidden">
              <img src="/qirox-icon-nobg.png" alt="QIROX" className="w-7 h-7 object-contain" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-gray-50 dark:border-[#08090d] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-tight text-gray-900 dark:text-white">QIROX Studio AI</h1>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/25">
                QIROX AI
              </span>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-white/30">{L ? "مساعد إبداعي متطور — رؤية · تصميم · كود · أفكار" : "Advanced Creative AI — Vision · Design · Code · Ideas"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400">{L ? "نشط" : "Active"}</span>
          </div>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} data-testid="studio-clear"
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.06] transition-all">
              <RefreshCw className="w-3.5 h-3.5 text-gray-400 dark:text-white/40" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5 py-6 space-y-5">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full pb-10">
            {/* Hero icon */}
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500/20 via-purple-600/20 to-indigo-700/20 border border-violet-500/20 flex items-center justify-center shadow-2xl shadow-violet-500/10">
                <Sparkles className="w-12 h-12 text-violet-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Zap className="w-4 h-4 text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 text-center">
              {L ? "مرحباً في QIROX Studio" : "Welcome to QIROX Studio"}
            </h2>
            <p className="text-gray-400 dark:text-white/35 text-center text-sm max-w-md mb-2">
              {L
                ? "ذكاء اصطناعي إبداعي من الجيل الجديد — حلّل صوراً، ولّد تصاميم، اكتب كوداً، وأكثر."
                : "Next-gen creative AI — analyze images, generate designs, write code, and more."}
            </p>

            {/* Capability pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-xl">
              {[
                { icon: Eye, label: L ? "رؤية الصور" : "Image Vision", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
                { icon: Wand2, label: L ? "توليد الصور" : "Image Gen", color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
                { icon: Video, label: L ? "توليد فيديو" : "Video Gen", color: "text-red-400 bg-red-500/10 border-red-500/20" },
                { icon: Code2, label: L ? "كتابة الكود" : "Code Writing", color: "text-green-400 bg-green-500/10 border-green-500/20" },
                { icon: Brain, label: L ? "تحليل عميق" : "Deep Analysis", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
                { icon: Star, label: L ? "إبداعي 100%" : "100% Creative", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
              ].map(({ icon: Icon, label, color }, i) => (
                <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-semibold ${color}`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </div>
              ))}
            </div>

            {/* Quick prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {PROMPTS.map(({ icon: Icon, text, type }, i) => (
                <button key={i} onClick={() => {
                  if (type === "image") { setShowImageGen(true); setImagePrompt(text); }
                  else sendMessage(text);
                }}
                  data-testid={`studio-prompt-${i}`}
                  className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] hover:bg-black/[0.06] dark:hover:bg-white/[0.07] border border-black/[0.08] dark:border-white/[0.06] hover:border-violet-500/30 transition-all text-start group">
                  <div className="w-7 h-7 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/25 transition-all">
                    <Icon className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-white/55 group-hover:text-gray-800 dark:group-hover:text-white/85 transition-colors leading-snug">{text}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            L={L}
            isNew={msg.id === newestMsgId}
            userAvatar={(user as any)?.avatar}
            userName={(user as any)?.name || (user as any)?.username}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Image Generation Panel */}
      <AnimatePresence>
        {showImageGen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="relative z-10 border-t border-black/[0.08] dark:border-white/[0.06] bg-white/70 dark:bg-black/40 backdrop-blur-xl px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-pink-400" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">{L ? "توليد صورة إبداعية" : "Generate Creative Image"}</span>
              </div>
              <button onClick={() => setShowImageGen(false)} className="text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/70"><X className="w-4 h-4" /></button>
            </div>
            <input
              value={imagePrompt}
              onChange={e => setImagePrompt(e.target.value)}
              placeholder={L ? "صف الصورة التي تريدها..." : "Describe the image you want..."}
              className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 focus:border-pink-500/40 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-black/30 dark:placeholder-white/25 outline-none mb-3"
              onKeyDown={e => e.key === "Enter" && generateImageDirect()}
              data-testid="studio-img-prompt"
            />
            <div className="flex flex-wrap gap-2 mb-3">
              {IMAGE_STYLES.map(s => (
                <button key={s.id} onClick={() => setSelectedStyle(s.id)}
                  data-testid={`studio-style-${s.id}`}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                    selectedStyle === s.id
                      ? `bg-gradient-to-r ${s.color} text-white border-transparent shadow-lg`
                      : "bg-black/[0.03] dark:bg-white/[0.04] border-black/10 dark:border-white/10 text-gray-500 dark:text-white/50 hover:border-black/15 dark:hover:border-white/20"
                  }`}>
                  {L ? s.labelAr : s.labelEn}
                </button>
              ))}
            </div>
            <button onClick={generateImageDirect} disabled={!imagePrompt.trim() || generatingImage}
              data-testid="studio-gen-btn"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-pink-500/25 transition-all flex items-center justify-center gap-2">
              {generatingImage
                ? <><Loader2 className="w-4 h-4 animate-spin" />{L ? "يولّد..." : "Generating..."}</>
                : <><Wand2 className="w-4 h-4" />{L ? "ولّد الصورة" : "Generate Image"}</>}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Picker Modal */}
      <AnimatePresence>
        {showTaskPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowTaskPicker(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-[#0f1117] border border-black/10 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.08] dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-violet-400" />
                  <span className="font-bold text-gray-900 dark:text-white text-sm">{L ? "إرفاق مهام" : "Attach Tasks"}</span>
                </div>
                <button onClick={() => setShowTaskPicker(false)} className="text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/70"><X className="w-4 h-4" /></button>
              </div>
              <div className="overflow-y-auto max-h-80 p-3 space-y-2">
                {tasks.length === 0
                  ? <div className="text-center py-8 text-gray-400 dark:text-white/30 text-sm">{L ? "لا توجد مهام" : "No tasks found"}</div>
                  : tasks.map((task: Task) => {
                    const sel = selectedTasks.some(t => t._id === task._id);
                    return (
                      <button key={task._id} onClick={() => setSelectedTasks(prev => sel ? prev.filter(t => t._id !== task._id) : [...prev, task])}
                        className={`w-full flex items-start gap-3 px-4 py-3 rounded-2xl border transition-all text-start ${
                          sel ? "bg-violet-500/15 border-violet-500/30" : "bg-black/[0.03] dark:bg-white/[0.03] border-black/[0.08] dark:border-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.06]"
                        }`}>
                        {sel ? <CheckSquare className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-gray-400 dark:text-white/30 flex-shrink-0 mt-0.5" />}
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white/90 font-medium">{task.title}</p>
                          {task.description && <p className="text-[11px] text-gray-400 dark:text-white/40 mt-0.5 line-clamp-1">{task.description}</p>}
                        </div>
                      </button>
                    );
                  })
                }
              </div>
              <div className="px-5 py-4 border-t border-black/[0.08] dark:border-white/[0.06]">
                <button onClick={() => setShowTaskPicker(false)}
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-all">
                  {L ? `إرفاق ${selectedTasks.length} مهمة` : `Attach ${selectedTasks.length} task(s)`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="relative z-10 px-5 pb-5 pt-3 border-t border-black/[0.08] dark:border-white/[0.06] bg-white/60 dark:bg-black/30 backdrop-blur-xl">
        {/* Attached previews */}
        {(uploadedImages.length > 0 || selectedTasks.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {uploadedImages.map((img, i) => (
              <div key={i} className="relative group">
                <img src={img} alt="" className="w-14 h-14 rounded-xl object-cover border border-black/10 dark:border-white/10" />
                <button onClick={() => setUploadedImages(prev => prev.filter((_, j) => j !== i))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {selectedTasks.map((t, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-violet-500/20 border border-violet-500/30 text-[11px] font-medium text-violet-300 group">
                <CheckSquare className="w-3 h-3" />
                <span className="max-w-[100px] truncate">{t.title}</span>
                <button onClick={() => setSelectedTasks(prev => prev.filter((_, j) => j !== i))} className="text-violet-400/50 hover:text-violet-300 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative transition-all ${isDragging ? "ring-2 ring-violet-500/50 rounded-2xl" : ""}`}>
          <div className="flex gap-2 items-end max-w-4xl mx-auto">
            {/* Left action buttons */}
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <button onClick={() => fileRef.current?.click()}
                data-testid="studio-upload-img"
                className="w-10 h-10 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] hover:bg-violet-500/20 border border-black/[0.08] dark:border-white/[0.08] hover:border-violet-500/30 flex items-center justify-center transition-all"
                title={L ? "رفع صورة" : "Upload image"}>
                <ImagePlus className="w-4 h-4 text-gray-400 dark:text-white/40 hover:text-violet-400 transition-colors" />
              </button>
              <button onClick={() => { setShowImageGen(v => !v); }}
                data-testid="studio-toggle-imggen"
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                  showImageGen ? "bg-pink-500/20 border-pink-500/40 text-pink-400" : "bg-black/[0.03] dark:bg-white/[0.05] hover:bg-pink-500/20 border-black/[0.08] dark:border-white/[0.08] hover:border-pink-500/30 text-gray-400 dark:text-white/40"
                }`}
                title={L ? "توليد صورة" : "Generate image"}>
                <Wand2 className="w-4 h-4" />
              </button>
              <button onClick={() => setShowTaskPicker(true)}
                data-testid="studio-attach-task"
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                  selectedTasks.length > 0
                    ? "bg-violet-500/20 border-violet-500/40 text-violet-400"
                    : "bg-black/[0.03] dark:bg-white/[0.05] hover:bg-violet-500/20 border-black/[0.08] dark:border-white/[0.08] hover:border-violet-500/30 text-gray-400 dark:text-white/40"
                }`}
                title={L ? "إرفاق مهمة" : "Attach task"}>
                <Paperclip className="w-4 h-4" />
              </button>
            </div>

            {/* Textarea */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                rows={1}
                placeholder={L
                  ? "اكتب رسالتك... أو اسحب صورة هنا (Shift+Enter للسطر الجديد)"
                  : "Type your message... or drag an image here (Shift+Enter for new line)"}
                disabled={loading}
                data-testid="studio-input"
                className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/[0.1] focus:border-violet-500/40 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-black/30 dark:placeholder-white/20 resize-none outline-none transition-all leading-relaxed min-h-[48px] max-h-48 disabled:opacity-50"
                style={{ fieldSizing: "content" } as any}
              />
            </div>

            {/* Right buttons */}
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <button onClick={() => setShowImageGen(v => !v)}
                data-testid="studio-image-gen"
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                  showImageGen
                    ? "bg-pink-500/20 border-pink-500/40 text-pink-400"
                    : "bg-black/[0.03] dark:bg-white/[0.05] hover:bg-pink-500/20 border-black/[0.08] dark:border-white/[0.08] hover:border-pink-500/30 text-gray-400 dark:text-white/40"
                }`}
                title={L ? "توليد صورة" : "Generate image"}>
                <Wand2 className="w-4 h-4" />
              </button>
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                data-testid="studio-send"
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-violet-500/30 transition-all">
                {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-400 dark:text-white/12 mt-2">
          QIROX Studio AI · QIROX AI · {L ? "رؤية الصور · توليد التصاميم · تحليل المهام" : "Image Vision · Design Generation · Task Analysis"}
        </p>
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => handleFileChange(e.target.files)} data-testid="studio-file-input" />
    </div>
  );
}
