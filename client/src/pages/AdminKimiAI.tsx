import { useState, useRef, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Trash2, Bot, User, Sparkles, ChevronDown, Copy, RotateCcw } from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

interface Message { role: "user" | "assistant"; content: string; }

const SYSTEM_PROMPTS: Record<string, string> = {
  general: "أنت Kimi، مساعد ذكاء اصطناعي متخصص لمنصة Qirox. تساعد الموظفين والمديرين والعملاء في جميع المهام الإدارية والتشغيلية. تتحدث بالعربية افتراضياً وتقدم إجابات دقيقة ومفيدة وعملية.",
  finance: "أنت مساعد مالي متخصص لمنصة Qirox. تساعد في تحليل الإيرادات، المصاريف، الأرباح، الفواتير، وعروض الأسعار. تقدم توصيات مالية دقيقة وتساعد في اتخاذ القرارات المالية الصحيحة.",
  projects: "أنت مدير مشاريع ذكي لمنصة Qirox. تساعد في إدارة المشاريع، تتبع التقدم، تخصيص المهام، وتقديم توصيات لتسريع التسليم وتحسين جودة العمل.",
  sales: "أنت مستشار مبيعات ذكي لمنصة Qirox. تساعد في استراتيجيات البيع، تحليل العملاء، إعداد عروض الأسعار، والتفاوض مع العملاء لإتمام الصفقات بنجاح.",
  hr: "أنت مدير موارد بشرية ذكي لمنصة Qirox. تساعد في إدارة الموظفين، تقييم الأداء، جدولة الرواتب، وتقديم توصيات لتطوير الفريق.",
  tech: "أنت مستشار تقني متخصص لمنصة Qirox. تساعد في اختيار التقنيات المناسبة، مراجعة المتطلبات التقنية، وتقديم حلول برمجية للمشاريع المختلفة.",
};

const QUICK_PROMPTS = [
  { label: "تحليل الأداء المالي", prompt: "حلّل الأداء المالي لهذا الشهر وقدّم توصيات لتحسينه" },
  { label: "كيفية تحسين المبيعات", prompt: "ما هي أفضل استراتيجيات لزيادة المبيعات في منصة Qirox؟" },
  { label: "إعداد عرض سعر", prompt: "ساعدني في إعداد عرض سعر احترافي لعميل يريد موقعاً إلكترونياً" },
  { label: "تقرير أداء الموظفين", prompt: "كيف أُعدّ تقرير أداء شهري شامل للموظفين؟" },
  { label: "خطة تسويقية", prompt: "أعدّ لي خطة تسويقية بسيطة لاستقطاب عملاء جدد" },
  { label: "تحليل المشاريع المتأخرة", prompt: "ما هي أسباب تأخر تسليم المشاريع وكيف نعالجها؟" },
];

function formatContent(content: string) {
  const lines = content.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("### ")) return <h3 key={i} className="font-bold text-black text-sm mt-3 mb-1">{line.slice(4)}</h3>;
    if (line.startsWith("## ")) return <h2 key={i} className="font-black text-black text-base mt-4 mb-1">{line.slice(3)}</h2>;
    if (line.startsWith("# ")) return <h1 key={i} className="font-black text-black text-lg mt-4 mb-2">{line.slice(2)}</h1>;
    if (line.startsWith("- ") || line.startsWith("• ")) return <li key={i} className="text-sm text-black/80 mr-4 list-disc">{line.slice(2)}</li>;
    if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-bold text-sm text-black">{line.slice(2, -2)}</p>;
    if (line.trim() === "") return <div key={i} className="h-2" />;
    // Handle inline bold
    const parts = line.split(/\*\*(.*?)\*\*/g);
    if (parts.length > 1) return (
      <p key={i} className="text-sm text-black/80 leading-relaxed">
        {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="font-bold text-black">{part}</strong> : part)}
      </p>
    );
    return <p key={i} className="text-sm text-black/80 leading-relaxed">{line}</p>;
  });
}

export default function AdminKimiAI() {
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("general");
  const [showQuick, setShowQuick] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (content: string) => {
    if (!content.trim() || loading) return;
    const userMsg: Message = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setShowQuick(false);
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/ai/kimi", {
        messages: newMessages,
        systemPrompt: SYSTEM_PROMPTS[mode],
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الاتصال");
      const assistantContent = data.choices?.[0]?.message?.content || "لم يتم الحصول على رد.";
      setMessages(prev => [...prev, { role: "assistant", content: assistantContent }]);
    } catch (e: any) {
      toast({ title: L ? "خطأ في الاتصال بـ Qirox AI" : "Qirox AI Error", description: e.message, variant: "destructive" });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-120px)] min-h-[600px]" dir={dir}>
      <PageGraphics variant="minimal" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-black flex items-center gap-2">
              Qirox AI <Sparkles className="w-4 h-4 text-black/40" />
            </h1>
            <p className="text-xs text-black/35">{L ? "مساعدك الذكي المتخصص لمنصة Qirox" : "Your specialized AI agent for Qirox"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="h-8 w-40 text-xs border-black/10" data-testid="select-ai-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">🤖 عام</SelectItem>
              <SelectItem value="finance">💰 مالي</SelectItem>
              <SelectItem value="projects">📁 مشاريع</SelectItem>
              <SelectItem value="sales">📊 مبيعات</SelectItem>
              <SelectItem value="hr">👥 موارد بشرية</SelectItem>
              <SelectItem value="tech">⚙️ تقني</SelectItem>
            </SelectContent>
          </Select>
          {messages.length > 0 && (
            <Button size="sm" variant="outline" className="h-8 text-xs border-black/10 gap-1"
              onClick={() => { setMessages([]); setShowQuick(true); }} data-testid="button-clear-chat">
              <Trash2 className="w-3 h-3" /> {L ? "مسح" : "Clear"}
            </Button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-black/[0.07] bg-black/[0.01] p-4 space-y-4 mb-4">

        {/* Welcome / quick prompts */}
        {messages.length === 0 && showQuick && (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-black text-black mb-1">مرحباً! أنا Kimi</h2>
            <p className="text-sm text-black/40 mb-6 max-w-sm">
              مساعدك الذكي المتخصص لمنصة Qirox — اسألني عن الإدارة، المالية، المشاريع، المبيعات، أو أي شيء آخر
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full max-w-lg">
              {QUICK_PROMPTS.map((p, i) => (
                <button key={i}
                  onClick={() => send(p.prompt)}
                  className="text-right p-3 rounded-xl border border-black/[0.08] hover:border-black/20 hover:bg-black/[0.02] transition-all text-xs font-medium text-black/70 hover:text-black"
                  data-testid={`button-quick-prompt-${i}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-xl bg-black flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user"
              ? "bg-black text-white rounded-tr-sm"
              : "bg-white border border-black/[0.07] text-black rounded-tl-sm"
            }`}>
              {msg.role === "user"
                ? <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                : <div className="space-y-0.5">{formatContent(msg.content)}</div>
              }
              {msg.role === "assistant" && (
                <button
                  onClick={() => { navigator.clipboard.writeText(msg.content); toast({ title: L ? "تم نسخ الرد" : "Copied" }); }}
                  className="mt-2 flex items-center gap-1 text-[10px] text-black/30 hover:text-black/60 transition-colors"
                  data-testid={`button-copy-message-${i}`}>
                  <Copy className="w-3 h-3" /> {L ? "نسخ" : "Copy"}
                </button>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-xl bg-black/[0.06] flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-3.5 h-3.5 text-black/60" />
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white border border-black/[0.07] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-black/40" />
              <span className="text-sm text-black/40">{L ? "Kimi يفكر..." : "Kimi is thinking..."}</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 flex gap-2 items-end">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={L ? "اكتب رسالتك هنا... (Enter للإرسال، Shift+Enter للسطر الجديد)" : "Type your message... (Enter to send, Shift+Enter for new line)"}
            className="resize-none min-h-[52px] max-h-[160px] text-sm border-black/[0.10] rounded-xl pr-4 pl-4 py-3 overflow-y-auto"
            rows={1}
            disabled={loading}
            data-testid="input-chat-message"
          />
        </div>
        <Button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          className="bg-black text-white h-[52px] px-5 rounded-xl flex-shrink-0"
          data-testid="button-send-message">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>

      {/* Quick action row */}
      <div className="flex gap-2 mt-2 overflow-x-auto pb-1 flex-shrink-0">
        {QUICK_PROMPTS.slice(0, 4).map((p, i) => (
          <button key={i}
            onClick={() => send(p.prompt)}
            className="whitespace-nowrap text-[11px] px-3 py-1.5 rounded-lg border border-black/[0.08] text-black/50 hover:border-black/20 hover:text-black/70 hover:bg-black/[0.02] transition-all flex-shrink-0"
            data-testid={`button-quick-action-${i}`}>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
