import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Send, Loader2, Sparkles, RotateCcw, User, Coffee, Zap, Heart, Star,
  TrendingUp, FileText, Users, BarChart3, Brain, ChevronRight, ImagePlus, XCircle, Mic
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  role: "user" | "assistant";
  content: string;
  images?: string[];
  streaming?: boolean;
  toolsUsed?: string[];
  displayType?: string;
  toolData?: any;
  allTools?: any[];
}

const ROLE_QUICK_PROMPTS: Record<string, { label: string; icon: any }[]> = {
  admin: [
    { label: "تقرير الأداء اليوم", icon: BarChart3 },
    { label: "أجرِ تحليل ذكي شامل للأعمال", icon: Brain },
    { label: "أرسل إشعاراً لجميع العملاء", icon: Users },
    { label: "ما الطلبات المعلّقة؟", icon: FileText },
  ],
  manager: [
    { label: "ما مهام فريقي اليوم؟", icon: FileText },
    { label: "اعرض لوحة Kanban", icon: BarChart3 },
    { label: "تقرير مالي للشهر", icon: TrendingUp },
    { label: "ساعدني في توزيع المهام", icon: Users },
  ],
  developer: [
    { label: "ساعدني في مشكلة تقنية", icon: Brain },
    { label: "اعرض مهامي المعلّقة", icon: FileText },
    { label: "راجع هذا الكود معي", icon: Sparkles },
    { label: "اقترح بنية مناسبة", icon: TrendingUp },
  ],
  designer: [
    { label: "ساعدني في فكرة تصميم", icon: Brain },
    { label: "اقترح نظام ألوان جذاب", icon: Sparkles },
    { label: "ما أحدث توجهات التصميم؟", icon: TrendingUp },
    { label: "اعرض مهامي", icon: FileText },
  ],
  sales: [
    { label: "ساعدني في إعداد عرض سعر", icon: FileText },
    { label: "كيف أقنع عميلاً متردداً؟", icon: Brain },
    { label: "اكتب رسالة متابعة للعميل", icon: Sparkles },
    { label: "أرني قائمة العملاء", icon: Users },
  ],
  sales_manager: [
    { label: "تحليل أداء المبيعات هذا الشهر", icon: TrendingUp },
    { label: "توقع إيرادات الشهر القادم", icon: Brain },
    { label: "أرسل رسالة تحفيزية للفريق", icon: Users },
    { label: "تقرير مالي شامل", icon: BarChart3 },
  ],
  accountant: [
    { label: "تقرير مالي للشهر الحالي", icon: TrendingUp },
    { label: "أنشئ فاتورة لعميل", icon: FileText },
    { label: "من لديه أعلى رصيد محفظة؟", icon: BarChart3 },
    { label: "ما الطلبات المعلّقة الدفع؟", icon: Sparkles },
  ],
  support: [
    { label: "ساعدني في الرد على شكوى", icon: Brain },
    { label: "اكتب رد احترافي للعميل", icon: FileText },
    { label: "أرني طلبات اليوم", icon: BarChart3 },
    { label: "تصعيد مشكلة لمدير", icon: TrendingUp },
  ],
  default: [
    { label: "ما مهامي اليوم؟", icon: FileText },
    { label: "ساعدني في تقرير", icon: BarChart3 },
    { label: "اقترح خطوة لتحسين الأداء", icon: Brain },
    { label: "تواصل مع عميل جديد", icon: Users },
  ],
};

function getTimeGreeting(name: string): { greeting: string; energy: string; icon: "coffee" | "zap" | "star" | "heart" } {
  const hour = new Date().getHours();
  const firstName = name.split(" ")[0];
  if (hour >= 5 && hour < 12) {
    const phrases = [
      { greeting: `صباح الخير يا ${firstName}! ☀️`, energy: "شربة قوتك جاهزة — يوم جديد وفرص جديدة تنتظرك! 💪", icon: "coffee" as const },
      { greeting: `صباح النور يا ${firstName}! 🌅`, energy: "أحسن صباح تبدأ بخطوة واحدة للأمام. خلّينا ننجز!", icon: "coffee" as const },
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  } else if (hour >= 12 && hour < 17) {
    const phrases = [
      { greeting: `مساء الخير يا ${firstName}! 🌤️`, energy: "نص اليوم راح — والنص الثاني أحسن. إيش بخدمتك؟", icon: "zap" as const },
      { greeting: `يا هلا ${firstName}! 🔥`, energy: "الظهيرة وقت المنجزين. أنا هنا أساعدك!", icon: "zap" as const },
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  } else if (hour >= 17 && hour < 21) {
    const phrases = [
      { greeting: `مساء النور يا ${firstName}! 🌆`, energy: "آخر الساعات ذهب — خلّينا نختم اليوم بإنجاز!", icon: "star" as const },
      { greeting: `هلا والله ${firstName}! ⭐`, energy: "المساء وقت التأمل والتخطيط. إيش تحتاج؟", icon: "star" as const },
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  } else {
    const phrases = [
      { greeting: `هلا ${firstName}! 🌙`, energy: "الليل الهادي وقت الأفكار العظيمة. إيش في بالك؟", icon: "heart" as const },
    ];
    return phrases[0];
  }
}

const TOOL_LABELS: Record<string, string> = {
  get_orders: "📋 جلب الطلبات",
  get_clients: "👥 جلب العملاء",
  get_analytics: "📊 التحليلات",
  get_employees: "👤 الموظفون",
  get_wallet_info: "💰 المحفظة",
  get_projects: "🗂️ المشاريع",
  get_finance_report: "📈 التقرير المالي",
  get_kanban_board: "🎯 لوحة Kanban",
  get_attendance_summary: "🕐 الحضور",
  generate_ai_insight: "🧠 تحليل ذكي",
  get_user_profile: "👤 ملف المستخدم",
  send_bulk_message: "📢 رسالة جماعية",
  update_order_status: "✏️ تحديث الطلب",
  send_notification: "🔔 إشعار",
  create_task: "✅ مهمة جديدة",
  send_email: "📧 إرسال بريد",
  create_quotation: "📄 عرض سعر",
  create_invoice: "🧾 فاتورة",
  navigate_to: "🧭 التنقّل",
  show_page_preview: "👁️ معاينة",
  search_web: "🔍 بحث الويب",
  generate_image: "🖼️ توليد صورة",
  generate_qr_code: "📱 رمز QR",
  escalate_to_human: "🆘 تصعيد",
};

function formatContent(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("### ")) return <h3 key={i} className="font-bold text-sm mt-2 mb-0.5 text-black dark:text-white">{line.slice(4)}</h3>;
    if (line.startsWith("## ")) return <h2 key={i} className="font-black text-sm mt-3 mb-1 text-black dark:text-white">{line.slice(3)}</h2>;
    if (line.startsWith("# ")) return <h1 key={i} className="font-black text-base mt-3 mb-1 text-black dark:text-white">{line.slice(2)}</h1>;
    if (line.startsWith("- ") || line.startsWith("• ")) {
      return (
        <li key={i} className="text-xs text-black/75 dark:text-white/75 mr-3 leading-relaxed flex gap-1.5">
          <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-black/30 dark:bg-white/30" />
          <span>{line.slice(2)}</span>
        </li>
      );
    }
    if (line.match(/^\d+\./)) {
      const rest = line.replace(/^\d+\./, "").trim();
      const num = line.match(/^(\d+)\./)?.[1];
      return (
        <li key={i} className="text-xs text-black/75 dark:text-white/75 mr-2 leading-relaxed flex gap-2">
          <span className="flex-shrink-0 w-4 h-4 rounded-full bg-black/10 dark:bg-white/10 text-[9px] flex items-center justify-center font-bold">{num}</span>
          <span>{rest}</span>
        </li>
      );
    }
    if (line.trim() === "") return <div key={i} className="h-1.5" />;
    if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
      return <p key={i} className="text-xs font-black text-black dark:text-white mt-1 leading-relaxed">{line.slice(2, -2)}</p>;
    }
    const parts = line.split(/\*\*(.*?)\*\*/g);
    if (parts.length > 1) return (
      <p key={i} className="text-xs text-black/75 dark:text-white/75 leading-relaxed">
        {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="font-bold text-black dark:text-white">{part}</strong> : part)}
      </p>
    );
    return <p key={i} className="text-xs text-black/75 dark:text-white/75 leading-relaxed">{line}</p>;
  });
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function EmployeeAIAssistant({ open, onClose }: Props) {
  const { lang } = useI18n();
  const L = lang === "ar";
  const { data: user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `emp-${Date.now()}`);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [modelLabel, setModelLabel] = useState("Qirox AI");
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef("");

  const role = (user as any)?.role || "employee";
  const name = (user as any)?.fullName || (user as any)?.username || "الموظف";
  const greetingData = getTimeGreeting(name);
  const quickPrompts = ROLE_QUICK_PROMPTS[role] || ROLE_QUICK_PROMPTS.default;

  const iconMap = { coffee: Coffee, zap: Zap, star: Star, heart: Heart };
  const GreetIcon = iconMap[greetingData.icon];

  useEffect(() => {
    if (open) setTimeout(() => textRef.current?.focus(), 300);
  }, [open]);

  // Speech-to-text (voice input) setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setSpeechSupported(false); return; }
    setSpeechSupported(true);
    const recognition = new SpeechRecognition();
    recognition.lang = "ar-SA";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      const combined = (baseTextRef.current + " " + finalText + " " + interimText).replace(/\s+/g, " ").trim();
      setInput(combined);
    };
    recognition.onend = () => {
      baseTextRef.current = "";
      setListening(false);
    };
    recognition.onerror = () => { setListening(false); };
    recognitionRef.current = recognition;
    return () => { try { recognition.stop(); } catch {} };
  }, []);

  const toggleListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (listening) {
      try { recognition.stop(); } catch {}
      setListening(false);
    } else {
      baseTextRef.current = input.trim();
      try {
        recognition.start();
        setListening(true);
      } catch { setListening(false); }
    }
  }, [listening, input]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, activeTools]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.slice(0, 4).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const base64 = ev.target?.result as string;
        setAttachedImages(prev => [...prev.slice(0, 3), base64]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }, []);

  const send = useCallback(async (text: string = input.trim(), imgs: string[] = attachedImages) => {
    if (!text && imgs.length === 0) return;
    if (loading) return;
    if (listening) { try { recognitionRef.current?.stop(); } catch {} setListening(false); }
    const msgText = text || "انظر إلى هذه الصورة";
    setMessages(prev => [...prev, { role: "user", content: msgText, images: imgs.length ? imgs : undefined }]);
    setInput("");
    setAttachedImages([]);
    setLoading(true);
    setActiveTools([]);

    // Add empty streaming message
    setMessages(prev => [...prev, { role: "assistant", content: "", streaming: true }]);

    abortRef.current = new AbortController();

    try {
      const resp = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: msgText, images: imgs.length ? imgs : undefined }),
        signal: abortRef.current.signal,
        credentials: "include",
      });

      if (!resp.ok || !resp.body) throw new Error("stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      let finalToolData: any = null;
      let finalDisplayType: string | undefined;
      let finalAllTools: any[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));

            if (evt.type === "tool_start") {
              setActiveTools(evt.tools || []);
            } else if (evt.type === "tool_result") {
              if (evt.displayType) {
                finalDisplayType = evt.displayType;
                finalToolData = evt.data;
              }
            } else if (evt.type === "stream_start") {
              setActiveTools([]);
            } else if (evt.type === "delta") {
              fullContent += evt.content;
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") {
                  updated[updated.length - 1] = { ...last, content: fullContent };
                }
                return updated;
              });
            } else if (evt.type === "done") {
              if (evt.model) setModelLabel(evt.model);
              finalAllTools = evt.allTools || [];
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") {
                  updated[updated.length - 1] = {
                    ...last,
                    content: evt.reply || fullContent,
                    streaming: false,
                    displayType: finalDisplayType,
                    toolData: finalToolData,
                    allTools: finalAllTools,
                  };
                }
                return updated;
              });
            } else if (evt.type === "error") {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") {
                  updated[updated.length - 1] = { ...last, content: "حدث خطأ. حاول مرة أخرى.", streaming: false };
                }
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = { ...last, content: "حدث خطأ في الاتصال. حاول مرة أخرى.", streaming: false };
          }
          return updated;
        });
      }
    } finally {
      setLoading(false);
      setActiveTools([]);
      abortRef.current = null;
    }
  }, [input, loading, sessionId, listening]);

  function reset() {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setActiveTools([]);
    setAttachedImages([]);
    setLoading(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ opacity: 0, x: L ? -320 : 320, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: L ? -320 : 320, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className={`fixed bottom-4 z-50 w-[350px] md:w-[400px] flex flex-col bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-black/[0.08] dark:border-white/[0.08] overflow-hidden ${L ? "left-4" : "right-4"}`}
            style={{ maxHeight: "86vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.06] flex-shrink-0 bg-gradient-to-l from-black/[0.02] dark:from-white/[0.02] to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-black dark:bg-white flex items-center justify-center shadow-sm overflow-hidden">
                    <img src="/qirox-icon-nobg.png" alt="Qirox" className="w-6 h-6 object-contain" data-testid="img-ai-logo" />
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${loading ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                </div>
                <div>
                  <p className="text-sm font-black text-black dark:text-white">Qirox AI</p>
                  <p className="text-[10px] text-black/35 dark:text-white/35 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${loading ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                    {loading ? "يفكّر..." : "مساعدك الذكي"} · {modelLabel}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={reset}
                    className="w-7 h-7 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors"
                    title="محادثة جديدة"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
                </button>
              </div>
            </div>

            {/* Active Tools Bar */}
            <AnimatePresence>
              {activeTools.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200/50 dark:border-amber-800/30 px-4 py-2 overflow-hidden"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <Loader2 className="w-3 h-3 animate-spin text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    {activeTools.map(t => (
                      <span key={t} className="text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                        {TOOL_LABELS[t] || t}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-1">
                  {/* Warm greeting card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="w-full rounded-2xl bg-gradient-to-br from-black dark:from-white to-black/80 dark:to-white/80 p-4 text-white dark:text-black relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-full opacity-5"
                      style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "16px 16px" }} />
                    <div className="relative z-10 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/15 dark:bg-black/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <GreetIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm leading-tight">{greetingData.greeting}</p>
                        <p className="text-[11px] mt-1.5 opacity-75 leading-relaxed">{greetingData.energy}</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Quick prompts */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="w-full"
                  >
                    <p className="text-[10px] font-black text-black/25 dark:text-white/25 uppercase tracking-widest mb-2 text-center">
                      اسألني عن
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {quickPrompts.map((p, i) => {
                        const Icon = p.icon;
                        return (
                          <motion.button
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.25 + i * 0.06 }}
                            onClick={() => send(p.label)}
                            className="text-right text-[11px] text-black/65 dark:text-white/65 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.07] dark:hover:bg-white/[0.08] rounded-xl px-2.5 py-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] leading-snug font-medium flex items-center gap-2"
                          >
                            <Icon className="w-3 h-3 flex-shrink-0 opacity-50" />
                            <span className="flex-1">{p.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Capabilities hint */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="w-full bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl p-3"
                  >
                    <p className="text-[10px] text-black/40 dark:text-white/40 text-center leading-relaxed">
                      🧠 أملك صلاحية الوصول للبيانات الحقيقية · أستطيع إنشاء تقارير ومستندات فعلية · أرسل رسائل وإشعارات · وأكثر بكثير
                    </p>
                  </motion.div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5 ${msg.role === "user" ? "bg-black dark:bg-white" : "bg-black/[0.06] dark:bg-white/[0.08]"}`}>
                      {msg.role === "user"
                        ? <User className="w-3 h-3 text-white dark:text-black" />
                        : <Sparkles className="w-3 h-3 text-black/50 dark:text-white/50" />
                      }
                    </div>
                    <div className={`max-w-[82%] rounded-2xl px-3 py-2 ${msg.role === "user" ? "bg-black dark:bg-white text-white dark:text-black" : "bg-black/[0.04] dark:bg-white/[0.06]"}`}>
                      {msg.role === "user"
                        ? <div>
                            {msg.images && msg.images.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {msg.images.map((img, ii) => (
                                  <img key={ii} src={img} alt="" className="w-24 h-24 object-cover rounded-lg border border-white/20" />
                                ))}
                              </div>
                            )}
                            <p className="text-xs leading-relaxed">{msg.content}</p>
                          </div>
                        : (
                          <div className="text-black dark:text-white">
                            {msg.content ? formatContent(msg.content) : null}
                            {msg.streaming && !msg.content && (
                              <div className="flex gap-1 items-center py-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-black/30 dark:bg-white/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-black/30 dark:bg-white/30 animate-bounce" style={{ animationDelay: "120ms" }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-black/30 dark:bg-white/30 animate-bounce" style={{ animationDelay: "240ms" }} />
                              </div>
                            )}
                            {msg.streaming && msg.content && (
                              <span className="inline-block w-0.5 h-3 bg-black/50 dark:bg-white/50 animate-pulse mr-0.5 align-middle" />
                            )}
                            {/* Tools used indicator */}
                            {!msg.streaming && msg.allTools && msg.allTools.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.06] flex flex-wrap gap-1">
                                {msg.allTools.map((t, ti) => (
                                  <span key={ti} className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${t.success ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"}`}>
                                    {TOOL_LABELS[t.name] || t.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      }
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-2 border-t border-black/[0.05] dark:border-white/[0.05] flex-shrink-0">
              {/* Attached image previews */}
              {attachedImages.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                  {attachedImages.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img} alt="" className="w-16 h-16 object-cover rounded-xl border border-black/10 dark:border-white/10" />
                      <button
                        onClick={() => setAttachedImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black dark:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-remove-image-${i}`}
                      >
                        <XCircle className="w-3.5 h-3.5 text-white dark:text-black" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 items-end">
                {/* Image upload button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  data-testid="ai-image-file-input"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || attachedImages.length >= 4}
                  className="h-9 w-9 p-0 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] hover:bg-black/[0.07] dark:hover:bg-white/[0.08] flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40"
                  title="إرفاق صورة"
                  data-testid="ai-assistant-image-upload"
                >
                  <ImagePlus className="w-3.5 h-3.5 text-black/50 dark:text-white/50" />
                </button>
                {speechSupported && (
                  <button
                    onClick={toggleListening}
                    disabled={loading}
                    className={`h-9 w-9 p-0 rounded-xl border flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40 ${
                      listening
                        ? "border-red-500/40 bg-red-500 text-white animate-pulse"
                        : "border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] hover:bg-black/[0.07] dark:hover:bg-white/[0.08]"
                    }`}
                    title={listening ? "إيقاف التسجيل" : "تحدّث بدل الكتابة"}
                    data-testid="ai-assistant-voice"
                  >
                    <Mic className={`w-3.5 h-3.5 ${listening ? "text-white" : "text-black/50 dark:text-white/50"}`} />
                  </button>
                )}
                <Textarea
                  ref={textRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder={listening ? "🎤 جارٍ الاستماع... تحدّث الآن" : "اكتب أو تحدّث... Shift+Enter لسطر جديد"}
                  rows={1}
                  className="flex-1 resize-none text-xs rounded-xl border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] focus-visible:ring-1 min-h-[36px] max-h-[120px] py-2 px-3"
                  style={{ direction: "rtl" }}
                  data-testid="ai-assistant-input"
                />
                <Button
                  size="sm"
                  onClick={() => send()}
                  disabled={(!input.trim() && attachedImages.length === 0) || loading}
                  className="h-9 w-9 p-0 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-black/85 flex-shrink-0"
                  data-testid="ai-assistant-send"
                >
                  {loading
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Send className="w-3.5 h-3.5" />
                  }
                </Button>
              </div>
              <p className="text-[9px] text-black/15 dark:text-white/15 text-center mt-1.5">
                Qirox AI · يدعم الصور والنصوص · يتعلم من كل محادثة
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
