/**
 * QiroxAIFloat — Floating AI assistant button + mini chat panel
 * Visible throughout the employee/admin area.
 * Uses /api/admin/qirox-ai/chat/stream for SSE streaming.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, X, Send, Loader2, RotateCcw, ExternalLink } from "lucide-react";
import { useUser } from "@/hooks/use-auth";

interface Message { role: "user" | "assistant"; content: string; ragDocs?: number }

const SUGGESTIONS = [
  "كم عدد العملاء الحاليين؟",
  "ما آخر الطلبات النشطة؟",
  "اشرح باقة Pro",
  "What services does QIROX offer?",
];

export default function QiroxAIFloat() {
  const { user } = useUser();
  const [open, setOpen]       = useState(false);
  const [msgs, setMsgs]       = useState<Message[]>([]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState("");
  const [ragDocs, setRagDocs] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef  = useRef<AbortController | null>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, streaming]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  const send = useCallback(async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;

    setInput("");
    const newMsgs: Message[] = [...msgs, { role: "user", content: q }];
    setMsgs(newMsgs);
    setLoading(true);
    setStreaming("");
    setRagDocs(0);

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/admin/qirox-ai/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: ctrl.signal,
        body: JSON.stringify({ messages: newMsgs.map(m => ({ role: m.role, content: m.content })) }),
      });

      if (!res.ok || !res.body) throw new Error("Server error");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";
      let reply     = "";

      setLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const chunk = JSON.parse(raw);
            if (chunk.ragDocs !== undefined) setRagDocs(chunk.ragDocs);
            if (chunk.content) { reply += chunk.content; setStreaming(reply); }
          } catch {}
        }
      }

      const finalReply = reply.trim() || "عذراً، لم أستطع توليد رد. حاول مجدداً.";
      setMsgs(prev => [...prev, { role: "assistant", content: finalReply, ragDocs }]);
      setStreaming("");
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setLoading(false);
      setStreaming("");
      setMsgs(prev => [...prev, { role: "assistant", content: "⚠️ حدث خطأ. تأكد من اتصالك وحاول مجدداً." }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, msgs, loading]);

  const clearChat = () => { setMsgs([]); setStreaming(""); setRagDocs(0); };

  if (!user) return null;

  return (
    <>
      {/* ── Floating Button ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 left-6 z-[200] w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-700 shadow-lg shadow-blue-900/40 flex items-center justify-center hover:scale-110 transition-transform group"
            title="QIROX AI"
          >
            <Zap className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-2xl border-2 border-blue-400/40 animate-ping pointer-events-none" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 380 }}
            className="fixed bottom-6 left-6 z-[200] w-[360px] max-w-[calc(100vw-24px)] flex flex-col bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
            style={{ height: "min(520px, calc(100vh - 80px))" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-violet-700/20 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">QIROX AI</p>
                  <p className="text-[10px] text-white/40">مساعدك الذكي · {ragDocs > 0 ? `${ragDocs} مصادر` : "RAG مفعّل"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a href="/ai-docs" target="_blank" rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition" title="API Docs">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition" title="محادثة جديدة">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm" dir="auto">
              {msgs.length === 0 && !streaming && (
                <div className="space-y-4 py-2">
                  <div className="text-center space-y-1">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-600/20 flex items-center justify-center border border-white/10">
                      <Zap className="w-6 h-6 text-blue-400" />
                    </div>
                    <p className="text-white/70 font-medium text-sm">كيف أساعدك اليوم؟</p>
                    <p className="text-white/30 text-xs">أنا QIROX AI — وصول مباشر لبيانات النظام</p>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {SUGGESTIONS.map(s => (
                      <button key={s} onClick={() => send(s)}
                        className="text-right text-xs px-3 py-2 rounded-xl border border-white/10 hover:border-blue-500/40 hover:bg-blue-500/10 text-white/50 hover:text-white/80 transition text-start">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-white/8 border border-white/10 text-white/85 rounded-bl-md"
                  }`}>
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    {m.role === "assistant" && m.ragDocs !== undefined && m.ragDocs > 0 && (
                      <p className="text-[10px] text-white/30 mt-1">📚 {m.ragDocs} مصادر من قاعدة المعرفة</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Streaming bubble */}
              {(streaming || loading) && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md px-3.5 py-2.5 bg-white/8 border border-white/10 text-white/85 text-sm leading-relaxed">
                    {loading && !streaming
                      ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      : <p className="whitespace-pre-wrap break-words">{streaming}<span className="inline-block w-0.5 h-4 bg-blue-400 animate-pulse ml-0.5 align-text-bottom rounded-full" /></p>
                    }
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-white/10 px-3 py-2.5 bg-white/[0.02]">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="اكتب سؤالك... (Enter للإرسال)"
                  className="flex-1 resize-none bg-white/8 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition max-h-24 leading-relaxed"
                  style={{ direction: "auto" }}
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition shrink-0"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
