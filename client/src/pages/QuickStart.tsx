import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/hooks/use-auth";
import { ArrowRight, ArrowLeft, Send, Sparkles, Loader2, ShoppingBag, MessageSquare } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import qiroxLogo from "@assets/qirox_without_background_1771716363944.png";

type Msg = { role: "user" | "assistant"; content: string; suggestions?: string[] };

const STARTERS_AR = [
  "أبغى موقع متجر إلكتروني",
  "أحتاج نظام حجوزات لمطعمي",
  "موقع تعريفي لشركتي",
  "تطبيق جوال لخدماتي",
];
const STARTERS_EN = [
  "I want an e-commerce site",
  "I need a booking system for my restaurant",
  "A landing page for my company",
  "A mobile app for my services",
];

export default function QuickStart() {
  const { lang, dir } = useI18n();
  const ar = lang === "ar";
  const { data: user } = useUser();
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const sessionIdRef = useRef<string>(`qs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const starters = useMemo(() => (ar ? STARTERS_AR : STARTERS_EN), [ar]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    if (!started) setStarted(true);

    setMsgs((m) => [...m, { role: "user", content: t }]);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/ai/message", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `${t}\n\n[سياق: العميل في صفحة البدء السريع — مساعده في تحديد متطلبات مشروعه وإنشاء طلب أو طلب استشارة فعلي عبر الأدوات.]`,
          sessionId: sessionIdRef.current,
          userId: user?.id,
          userName: user?.fullName,
          userRole: user?.role || "guest",
        }),
      });
      const data = await res.json();
      const reply = data.reply || data.message || data.content || (ar ? "..." : "...");
      const suggestions: string[] = Array.isArray(data.suggestions) ? data.suggestions : [];
      setMsgs((m) => [...m, { role: "assistant", content: reply, suggestions }]);
    } catch {
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: ar ? "تعذّر الاتصال. حاول مرة أخرى." : "Connection failed. Try again." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-black dark:bg-black dark:text-white" dir={dir}>
      <Navigation />

      <main className="flex-1 flex flex-col">
        {!started ? (
          /* ─── Welcome screen ─── */
          <div className="flex-1 flex flex-col items-center justify-center px-5 py-16 md:py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl w-full text-center"
            >
              <img src={qiroxLogo} alt="QIROX" className="h-12 md:h-14 w-auto mx-auto mb-6 dark:invert" />
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/15 dark:border-white/15 text-[11px] font-bold tracking-wide uppercase mb-6">
                <Sparkles className="w-3 h-3" />
                {ar ? "بدء سريع بالذكاء الاصطناعي" : "Quick start with AI"}
              </div>
              <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight mb-5">
                {ar ? "احكِ لنا فكرتك" : "Tell us your idea"}
                <br />
                <span className="text-black/40 dark:text-white/40">
                  {ar ? "نتولى الباقي" : "we handle the rest"}
                </span>
              </h1>
              <p className="text-sm md:text-base text-black/60 dark:text-white/60 mb-10 max-w-lg mx-auto leading-relaxed">
                {ar
                  ? "تحدّث مع QIROX AI بشكل طبيعي. هو يفهم احتياجك، يقترح الحل المناسب، وينشئ طلبك مباشرة — بدون نماذج طويلة."
                  : "Talk naturally with QIROX AI. It understands your needs, suggests the right solution, and creates your order directly — no long forms."}
              </p>

              {/* Input box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="relative max-w-xl mx-auto mb-6"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={ar ? "اكتب فكرتك أو احتياجك بكلمات بسيطة…" : "Describe your idea or need in simple words…"}
                  className="h-14 pl-4 pr-14 text-base bg-black/[0.03] dark:bg-white/[0.05] border-black/15 dark:border-white/15 rounded-2xl"
                  data-testid="input-quickstart-message"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className={`absolute ${ar ? "left-2" : "right-2"} top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center disabled:opacity-30 transition`}
                  data-testid="button-quickstart-send"
                  aria-label="send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {/* Starter chips */}
              <div className="flex flex-wrap justify-center gap-2 mb-10">
                {starters.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => send(s)}
                    className="px-4 py-2 rounded-full border border-black/12 dark:border-white/12 text-xs md:text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition"
                    data-testid={`button-starter-${i}`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Alt actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-black/45 dark:text-white/45">
                <span>{ar ? "أو" : "or"}</span>
                <a href="https://wa.me/966554656670" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white transition" data-testid="link-quickstart-whatsapp">
                  <SiWhatsapp className="w-3.5 h-3.5" />
                  {ar ? "تواصل واتساب" : "WhatsApp us"}
                </a>
                <span className="opacity-40">·</span>
                <Link href="/cart" className="inline-flex items-center gap-1.5 hover:text-black dark:hover:text-white transition" data-testid="link-quickstart-manual">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {ar ? "تصفح يدوي للباقات" : "Browse plans manually"}
                </Link>
              </div>
            </motion.div>
          </div>
        ) : (
          /* ─── Conversation screen ─── */
          <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 py-6">
            {/* Header card */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] mb-4">
              <div className="w-9 h-9 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{ar ? "مساعد QIROX الذكي" : "QIROX AI Assistant"}</p>
                <p className="text-[11px] text-black/45 dark:text-white/45 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white animate-pulse" />
                  {ar ? "متصل وجاهز للتنفيذ" : "Online & ready to act"}
                </p>
              </div>
              <a href="https://wa.me/966554656670" target="_blank" rel="noreferrer" className="text-xs text-black/55 dark:text-white/55 hover:text-black dark:hover:text-white inline-flex items-center gap-1.5" data-testid="link-conversation-whatsapp">
                <SiWhatsapp className="w-3.5 h-3.5" />
                {ar ? "واتساب" : "WhatsApp"}
              </a>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-3 pb-4 min-h-[420px] max-h-[calc(100vh-280px)]"
            >
              <AnimatePresence initial={false}>
                {msgs.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-black text-white dark:bg-white dark:text-black"
                          : "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border border-black/[0.06] dark:border-white/[0.08]"
                      }`}
                      data-testid={`msg-${m.role}-${i}`}
                    >
                      {m.content}
                      {m.role === "assistant" && m.suggestions && m.suggestions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {m.suggestions.map((s, j) => (
                            <button
                              key={j}
                              onClick={() => send(s)}
                              className="px-2.5 py-1 text-[11px] rounded-full border border-black/15 dark:border-white/15 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition"
                              data-testid={`suggestion-${i}-${j}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {busy && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] inline-flex items-center gap-2 text-xs text-black/55 dark:text-white/55">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {ar ? "QIROX يفكر…" : "QIROX is thinking…"}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="relative shrink-0"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={ar ? "اكتب رسالتك…" : "Type your message…"}
                className="h-12 pl-4 pr-12 text-sm bg-black/[0.03] dark:bg-white/[0.05] border-black/15 dark:border-white/15 rounded-xl"
                disabled={busy}
                data-testid="input-conversation-message"
              />
              <button
                type="submit"
                disabled={!input.trim() || busy}
                className={`absolute ${ar ? "left-2" : "right-2"} top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center disabled:opacity-30 transition`}
                data-testid="button-conversation-send"
                aria-label="send"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Footer hint */}
            <p className="text-[11px] text-center text-black/40 dark:text-white/40 mt-3">
              {ar
                ? "QIROX AI ينشئ طلبك أو يحجز استشارتك مباشرة عند جمع كل المعلومات اللازمة."
                : "QIROX AI creates your order or books a consultation directly once it gathers all needed info."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
