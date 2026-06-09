import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, Loader2, Sparkles, RotateCcw, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ROLE_CONTEXT: Record<string, string> = {
  admin: "أنت مساعد ذكي لمدير منصة Qirox. تساعد في جميع مهام الإدارة العامة والقرارات الاستراتيجية.",
  manager: "أنت مساعد ذكي لمدير منصة Qirox. تساعد في الإشراف على المشاريع والفرق.",
  developer: "أنت مساعد تقني ذكي لمطور في Qirox. تساعد في المهام التقنية ومتطلبات المشاريع.",
  designer: "أنت مساعد إبداعي ذكي لمصمم في Qirox. تساعد في متطلبات التصميم والمراجعات البصرية.",
  sales: "أنت مساعد مبيعات ذكي في Qirox. تساعد في إعداد عروض الأسعار وتحليل العملاء.",
  sales_manager: "أنت مساعد مبيعات ذكي لمدير المبيعات في Qirox. تساعد في استراتيجيات المبيعات والتقارير.",
  accountant: "أنت مساعد مالي ذكي لمحاسب في Qirox. تساعد في التقارير المالية والفواتير.",
  hr: "أنت مساعد موارد بشرية ذكي في Qirox. تساعد في إدارة الموظفين والرواتب والحضور.",
  support: "أنت مساعد دعم فني ذكي في Qirox. تساعد في حل مشاكل العملاء والتذاكر.",
  marketing: "أنت مساعد تسويقي ذكي في Qirox. تساعد في المحتوى التسويقي واستقطاب العملاء.",
  content: "أنت مساعد محتوى ذكي في Qirox. تساعد في كتابة ومراجعة المحتوى والمنتجات.",
  merchant: "أنت مساعد ذكي للتاجر في Qirox. تساعد في الطلبات والمنتجات وبيانات المبيعات.",
};

const QUICK_PROMPTS_AR = [
  "ما هي مهامي اليوم؟",
  "ساعدني في إعداد تقرير سريع",
  "اقترح عليّ خطوة لتحسين الأداء",
  "كيف أتواصل مع عميل جديد؟",
];

function formatContent(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("### ")) return <h3 key={i} className="font-bold text-sm mt-2 mb-0.5 text-black dark:text-white">{line.slice(4)}</h3>;
    if (line.startsWith("## ")) return <h2 key={i} className="font-black text-sm mt-3 mb-1 text-black dark:text-white">{line.slice(3)}</h2>;
    if (line.startsWith("- ") || line.startsWith("• ")) {
      return <li key={i} className="text-xs text-black/75 dark:text-white/75 mr-3 list-disc leading-relaxed">{line.slice(2)}</li>;
    }
    if (line.trim() === "") return <div key={i} className="h-1.5" />;
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const role = (user as any)?.role || "employee";
  const name = (user as any)?.fullName || (user as any)?.username || "الموظف";
  const systemPrompt = ROLE_CONTEXT[role] || "أنت مساعد ذكي لموظف في Qirox.";

  useEffect(() => {
    if (open) {
      setTimeout(() => textRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string = input.trim()) {
    if (!text || loading) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/ai/message", {
        sessionId,
        message: text,
        systemPrompt: `${systemPrompt}\nاسم الموظف: ${name}، الدور: ${role}.`,
        history: messages.slice(-8),
      });
      const data = await res.json();
      const reply = data.reply || data.content || data.message || (L ? "عذراً، لم أتمكن من الإجابة" : "Sorry, I couldn't respond.");
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: L ? "حدث خطأ في الاتصال. حاول مرة أخرى." : "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setMessages([]);
    setInput("");
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
            className={`fixed bottom-4 z-50 w-[340px] md:w-[380px] flex flex-col bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-black/[0.08] dark:border-white/[0.08] overflow-hidden ${L ? "left-4" : "right-4"}`}
            style={{ maxHeight: "82vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.06] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-black dark:bg-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white dark:text-black" />
                </div>
                <div>
                  <p className="text-sm font-black text-black dark:text-white">Qirox AI</p>
                  <p className="text-[10px] text-black/35 dark:text-white/35">{L ? "مساعدك الذكي" : "Your AI assistant"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={reset}
                    className="w-7 h-7 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors"
                    title={L ? "محادثة جديدة" : "New chat"}
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-6">
                  <div className="w-14 h-14 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
                    <Bot className="w-7 h-7 text-black/30 dark:text-white/30" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-black dark:text-white">{L ? `مرحباً ${name}!` : `Hello, ${name}!`}</p>
                    <p className="text-xs text-black/40 dark:text-white/40 mt-1">{L ? "كيف يمكنني مساعدتك اليوم؟" : "How can I help you today?"}</p>
                  </div>
                  {L && (
                    <div className="w-full space-y-1.5">
                      {QUICK_PROMPTS_AR.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => send(p)}
                          className="w-full text-right text-xs text-black/60 dark:text-white/60 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.07] rounded-xl px-3 py-2 transition-colors"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5 ${msg.role === "user" ? "bg-black dark:bg-white" : "bg-black/[0.06] dark:bg-white/[0.08]"}`}>
                      {msg.role === "user"
                        ? <User className="w-3 h-3 text-white dark:text-black" />
                        : <Sparkles className="w-3 h-3 text-black/50 dark:text-white/50" />
                      }
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${msg.role === "user" ? "bg-black dark:bg-white text-white dark:text-black" : "bg-black/[0.04] dark:bg-white/[0.06]"}`}>
                      {msg.role === "user"
                        ? <p className="text-xs leading-relaxed">{msg.content}</p>
                        : <div className="text-black dark:text-white">{formatContent(msg.content)}</div>
                      }
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-lg bg-black/[0.06] dark:bg-white/[0.08] flex items-center justify-center mt-0.5">
                    <Sparkles className="w-3 h-3 text-black/50 dark:text-white/50" />
                  </div>
                  <div className="bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl px-3 py-2.5">
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-black/30 dark:bg-white/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-black/30 dark:bg-white/30 animate-bounce" style={{ animationDelay: "120ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-black/30 dark:bg-white/30 animate-bounce" style={{ animationDelay: "240ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-2 border-t border-black/[0.05] dark:border-white/[0.05] flex-shrink-0">
              <div className="flex gap-2 items-end">
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
                  placeholder={L ? "اكتب رسالتك..." : "Type your message..."}
                  rows={1}
                  className="flex-1 resize-none text-xs rounded-xl border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] focus-visible:ring-1 min-h-[36px] max-h-[120px] py-2 px-3"
                  style={{ direction: L ? "rtl" : "ltr" }}
                />
                <Button
                  size="sm"
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  className="h-9 w-9 p-0 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-black/85 flex-shrink-0"
                  data-testid="ai-assistant-send"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </Button>
              </div>
              <p className="text-[10px] text-black/25 dark:text-white/25 text-center mt-1.5">Qirox AI · ذكاء اصطناعي</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
