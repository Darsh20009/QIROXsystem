import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/hooks/use-auth";
import { ArrowRight, ArrowLeft, Send, Sparkles, Loader2, ShoppingBag, Paperclip, X, ImageIcon, FileText } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import qiroxLogo from "@assets/qirox_without_background_1771716363944.png";

type AttachedFile = { name: string; type: string; size: number; data: string; preview?: string };
type Msg = {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  files?: AttachedFile[];
};

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

function formatBytes(b: number) {
  if (b < 1024) return b + " B";
  if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
  return (b / 1048576).toFixed(1) + " MB";
}

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
  const [pendingFiles, setPendingFiles] = useState<AttachedFile[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const autoStartedRef = useRef(false);

  const starters = useMemo(() => (ar ? STARTERS_AR : STARTERS_EN), [ar]);

  // Auto-start if ?sector= param is in the URL
  useEffect(() => {
    if (autoStartedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const sector = params.get("sector");
    if (sector) {
      autoStartedRef.current = true;
      window.history.replaceState({}, "", window.location.pathname);
      const msg = ar
        ? `أريد نظاماً أو موقعاً لـ ${sector}`
        : `I need a system or website for ${sector}`;
      setTimeout(() => send(msg), 300);
    }
  }, [ar]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  async function pickFiles(acceptImages = false) {
    return new Promise<AttachedFile[]>((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.accept = acceptImages ? "image/*" : "image/*,application/pdf,.doc,.docx,.txt,.zip";
      input.onchange = async () => {
        const files = Array.from(input.files || []);
        const result: AttachedFile[] = [];
        for (const f of files) {
          if (f.size > 8 * 1024 * 1024) continue;
          const data = await new Promise<string>(res => {
            const r = new FileReader();
            r.onload = () => res((r.result as string).split(",")[1]);
            r.readAsDataURL(f);
          });
          const preview = f.type.startsWith("image/") ? `data:${f.type};base64,${data}` : undefined;
          result.push({ name: f.name, type: f.type, size: f.size, data, preview });
        }
        resolve(result);
      };
      input.click();
    });
  }

  async function addFiles(imagesOnly = false) {
    const files = await pickFiles(imagesOnly);
    setPendingFiles(prev => [...prev, ...files]);
  }

  async function send(text: string) {
    const t = text.trim();
    if (!t && pendingFiles.length === 0) return;
    if (busy) return;
    if (!started) setStarted(true);

    const filesToSend = [...pendingFiles];
    setMsgs(m => [...m, { role: "user", content: t, files: filesToSend.length > 0 ? filesToSend : undefined }]);
    setInput("");
    setPendingFiles([]);
    setBusy(true);

    try {
      // Build message with file context
      let fullMessage = t;
      if (filesToSend.length > 0) {
        const fileNames = filesToSend.map(f => f.name).join(", ");
        fullMessage += `\n\n[المستخدم أرفق ${filesToSend.length} ملف/صورة: ${fileNames}]`;
      }

      const res = await fetch("/api/ai/message", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `${fullMessage}\n\n[سياق: العميل في صفحة البدء السريع — مساعده في تحديد متطلبات مشروعه وإنشاء طلب أو طلب استشارة فعلي عبر الأدوات.]`,
          sessionId: sessionIdRef.current,
          userId: (user as any)?.id,
          userName: (user as any)?.fullName,
          userRole: (user as any)?.role || "guest",
          attachments: filesToSend.map(f => ({ name: f.name, type: f.type, data: f.data })),
        }),
      });
      const data = await res.json();
      const reply = data.reply || data.message || data.content || (ar ? "..." : "...");
      const suggestions: string[] = Array.isArray(data.suggestions) ? data.suggestions : [];
      setMsgs(m => [...m, { role: "assistant", content: reply, suggestions }]);
    } catch {
      setMsgs(m => [...m, { role: "assistant", content: ar ? "تعذّر الاتصال. حاول مرة أخرى." : "Connection failed. Try again." }]);
    } finally {
      setBusy(false);
    }
  }

  const InputBar = (
    <form
      onSubmit={e => { e.preventDefault(); send(input); }}
      className="relative shrink-0"
    >
      {/* Pending file previews */}
      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {pendingFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] text-[11px]">
              {f.preview ? (
                <img src={f.preview} alt={f.name} className="w-7 h-7 rounded object-cover shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-black/40 dark:text-white/40 shrink-0" />
              )}
              <span className="truncate max-w-[100px]">{f.name}</span>
              <span className="text-black/30 dark:text-white/30 shrink-0">{formatBytes(f.size)}</span>
              <button type="button" onClick={() => setPendingFiles(p => p.filter((_, j) => j !== i))} className="text-black/30 dark:text-white/30 hover:text-red-500 transition">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        {/* Image attach */}
        <button
          type="button"
          onClick={() => addFiles(true)}
          className="shrink-0 w-9 h-9 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] flex items-center justify-center transition text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
          title={ar ? "إرفاق صورة" : "Attach image"}
          data-testid="button-attach-image-chat"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        {/* File attach */}
        <button
          type="button"
          onClick={() => addFiles(false)}
          className="shrink-0 w-9 h-9 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] flex items-center justify-center transition text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
          title={ar ? "إرفاق ملف" : "Attach file"}
          data-testid="button-attach-file-chat"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <div className="relative flex-1">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={ar ? "اكتب رسالتك…" : "Type your message…"}
            className={`h-11 ${ar ? "pl-11 pr-4" : "pr-11 pl-4"} text-sm bg-black/[0.03] dark:bg-white/[0.05] border-black/15 dark:border-white/15 rounded-xl`}
            disabled={busy}
            data-testid="input-conversation-message"
          />
          <button
            type="submit"
            disabled={(!input.trim() && pendingFiles.length === 0) || busy}
            className={`absolute ${ar ? "left-2" : "right-2"} top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center disabled:opacity-30 transition`}
            data-testid="button-conversation-send"
            aria-label="send"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen flex flex-col bg-white text-black dark:bg-black dark:text-white" dir={dir}>
      <Navigation />

      <main className="flex-1 flex flex-col">
        {!started ? (
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

              {/* Input box with file attach */}
              <div className="max-w-xl mx-auto mb-6">
                {pendingFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2 justify-center">
                    {pendingFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] text-[11px]">
                        {f.preview ? (
                          <img src={f.preview} alt={f.name} className="w-7 h-7 rounded object-cover shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-black/40 dark:text-white/40 shrink-0" />
                        )}
                        <span className="truncate max-w-[100px]">{f.name}</span>
                        <button type="button" onClick={() => setPendingFiles(p => p.filter((_, j) => j !== i))} className="text-black/30 hover:text-red-500 transition">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <form
                  onSubmit={e => { e.preventDefault(); send(input); }}
                  className="relative"
                >
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => addFiles(true)}
                      className="shrink-0 h-14 w-12 rounded-2xl border border-black/12 dark:border-white/12 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center justify-center transition text-black/35 dark:text-white/35 hover:text-black dark:hover:text-white"
                      title={ar ? "إرفاق صورة" : "Attach image"}
                      data-testid="button-attach-image-start"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    <div className="relative flex-1">
                      <Input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder={ar ? "اكتب فكرتك أو احتياجك بكلمات بسيطة…" : "Describe your idea or need in simple words…"}
                        className={`h-14 ${ar ? "pl-14 pr-4" : "pr-14 pl-4"} text-base bg-black/[0.03] dark:bg-white/[0.05] border-black/15 dark:border-white/15 rounded-2xl`}
                        data-testid="input-quickstart-message"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={!input.trim() && pendingFiles.length === 0}
                        className={`absolute ${ar ? "left-2" : "right-2"} top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center disabled:opacity-30 transition`}
                        data-testid="button-quickstart-send"
                        aria-label="send"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </form>
                <p className="text-[10px] text-black/30 dark:text-white/30 mt-1.5 text-center">
                  {ar ? "يمكنك إرفاق صور أو ملفات لتوضيح فكرتك (حد أقصى 8MB لكل ملف)" : "You can attach images or files to describe your idea (max 8MB each)"}
                </p>
              </div>

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
              className="flex-1 overflow-y-auto space-y-3 pb-4 min-h-[420px] max-h-[calc(100vh-320px)]"
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
                      {/* File thumbnails for user messages */}
                      {m.files && m.files.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {m.files.map((f, j) => (
                            <div key={j} className="flex items-center gap-1.5">
                              {f.preview ? (
                                <img src={f.preview} alt={f.name} className="max-w-[160px] max-h-[120px] rounded-lg object-cover" />
                              ) : (
                                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-[11px]">
                                  <FileText className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate max-w-[120px]">{f.name}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
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

            {/* Input bar */}
            {InputBar}

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
