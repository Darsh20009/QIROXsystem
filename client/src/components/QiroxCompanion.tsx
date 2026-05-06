import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { QiroxIcon } from "@/components/qirox-brand";
import { Sparkles, X, Send, Loader2, Minimize2, ArrowUpRight, ExternalLink, Eye, QrCode } from "lucide-react";

type ToolArtifact = {
  name: string;
  displayType?: string;
  data?: any;
};

type Msg = {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  artifacts?: ToolArtifact[];
};

const SESSION_KEY = "qirox_companion_session";

function pageContext(path: string, L: boolean): { hint: string; quick: string[] } {
  if (path === "/" || path === "") return {
    hint: L ? "نحن في الواجهة الرئيسية" : "On the homepage",
    quick: L ? ["ما هي QIROX؟", "أريد باقة لمشروعي", "كم تكلف الميزات الإضافية؟"]
              : ["What is QIROX?", "I need a package", "Show extra add-ons pricing"],
  };
  if (path.startsWith("/prices")) return {
    hint: L ? "العميل يتصفح الأسعار" : "Browsing pricing",
    quick: L ? ["أيش الفرق بين الباقات؟", "أنا صاحب مطعم، أيش أنسب لي؟", "أبي AI لمشروعي"]
              : ["Compare packages", "Best for a restaurant?", "Add AI to my project"],
  };
  if (path.startsWith("/order") || path.startsWith("/cart")) return {
    hint: L ? "العميل في طلب جديد — ساعده يكمل بسرعة" : "User is placing an order — help them finish",
    quick: L ? ["كيف أرفع إيصال التحويل؟", "أي طرق الدفع متاحة؟", "متى يبدأ العمل بعد الدفع؟"]
              : ["How to upload receipt?", "Payment methods?", "When does work start?"],
  };
  if (path.startsWith("/auth") || path.startsWith("/login") || path.startsWith("/signup") || path.startsWith("/register")) return {
    hint: L ? "تسجيل/إنشاء حساب — رحب وساعد" : "Auth flow — welcome and help",
    quick: L ? ["كيف أنشئ حسابي؟", "نسيت كلمة المرور", "هل التسجيل مجاني؟"]
              : ["How to register?", "Forgot password", "Is signup free?"],
  };
  if (path.startsWith("/dashboard")) return {
    hint: L ? "العميل في لوحته" : "Client dashboard",
    quick: L ? ["أين مشاريعي؟", "كيف أدفع فاتورة؟", "أبي أضيف ميزة لمشروعي"]
              : ["Where are my projects?", "Pay an invoice", "Add a feature"],
  };
  return {
    hint: `${L ? "الصفحة الحالية" : "Current page"}: ${path}`,
    quick: L ? ["كيف تساعدني؟", "أبي أتواصل مع موظف", "أبي أعرف عن QIROX"]
              : ["How can you help?", "Talk to a human", "About QIROX"],
  };
}

export default function QiroxCompanion() {
  const [location, setLocation] = useLocation();
  const { data: user } = useUser();
  const { lang, dir } = useI18n();
  const L = lang === "ar";

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hide on internal admin/staff routes that already have rich AI panels
  const hidden = useMemo(() => {
    const skip = ["/ai-studio", "/ai/", "/employee-role", "/admin/system-map"];
    return skip.some(p => location.startsWith(p));
  }, [location]);

  const ctx = useMemo(() => pageContext(location, L), [location, L]);

  // Persist sessionId
  const [sessionId] = useState(() => {
    try {
      const existing = localStorage.getItem(SESSION_KEY);
      if (existing) return existing;
      const id = `qc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(SESSION_KEY, id);
      return id;
    } catch { return `qc_${Date.now()}`; }
  });

  // Welcome message on first open
  useEffect(() => {
    if (open && msgs.length === 0) {
      const greet = user
        ? (L ? `أهلاً ${user.fullName?.split(" ")[0] || ""} 👋 أنا مساعدك الذكي في QIROX. كيف أقدر أخدمك؟`
              : `Hi ${user.fullName?.split(" ")[0] || ""}! I'm your QIROX assistant. How can I help?`)
        : (L ? "أهلاً بك في QIROX 👋 أنا مساعدك الذكي — أساعدك تختار الباقة المناسبة، أو أجاوبك عن أي استفسار."
              : "Welcome to QIROX! I'm your AI assistant — I'll help you find the right plan or answer any question.");
      setMsgs([{ role: "assistant", content: greet, suggestions: ctx.quick }]);
    }
  }, [open]); // eslint-disable-line

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setMsgs(m => [...m, { role: "user", content: t }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai/message", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `${t}\n\n[${ctx.hint}]`,
          sessionId,
          userId: user?.id,
          userName: user?.fullName,
          userRole: user?.role || "visitor",
        }),
      });
      const data = await res.json();
      const reply = data.reply || data.message || data.content || (L ? "..." : "...");
      const suggestions: string[] = Array.isArray(data.suggestions) ? data.suggestions : [];

      // Collect tool artifacts (navigation, previews, qr, etc.) for visual rendering
      const artifacts: ToolArtifact[] = Array.isArray(data.allTools)
        ? data.allTools
            .filter((t: any) => t.success && t.displayType && t.data)
            .map((t: any) => ({ name: t.name, displayType: t.displayType, data: t.data }))
        : [];

      // Auto-navigate if AI fired a navigate_to tool with autoOpen
      const autoNav = artifacts.find(a => a.displayType === "navigate" && a.data?.autoOpen !== false && a.data?.path);
      if (autoNav) {
        setTimeout(() => setLocation(autoNav.data.path), 700);
      }

      // Legacy NAVIGATE action (text marker fallback)
      if (data.action === "NAVIGATE" && data?.data?.url && !autoNav) {
        artifacts.push({ name: "navigate_to", displayType: "navigate", data: { path: data.data.url, label: data.data.label, autoOpen: false } });
      }

      setMsgs(m => [...m, { role: "assistant", content: reply, suggestions, artifacts }]);
    } catch (err: any) {
      setMsgs(m => [...m, { role: "assistant", content: L ? "تعذّر الاتصال بالمساعد. حاول مرة أخرى." : "Connection failed. Try again." }]);
    } finally {
      setBusy(false);
    }
  }

  if (hidden) return null;

  return (
    <>
      {/* Floating trigger */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setMinimized(false); }}
          className="fixed z-[60] bottom-20 sm:bottom-6 left-4 sm:left-6 group"
          data-testid="button-open-companion"
          aria-label={L ? "فتح المساعد الذكي" : "Open AI assistant"}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-white/30 blur-xl group-hover:bg-white/50 transition" />
            <div className="relative w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-2xl border-2 border-black hover:scale-105 transition-transform">
              <QiroxIcon className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-black rounded-full border-2 border-white animate-pulse" />
            </div>
          </div>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          dir={dir}
          className={`fixed z-[60] bottom-20 sm:bottom-6 left-4 sm:left-6 w-[calc(100vw-2rem)] sm:w-[380px] bg-white border border-black/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all ${
            minimized ? "h-14" : "h-[min(560px,calc(100vh-7rem))]"
          }`}
          data-testid="panel-companion"
        >
          {/* Header */}
          <div className="bg-black text-white px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <QiroxIcon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate flex items-center gap-1.5">
                {L ? "مساعد QIROX" : "QIROX Assistant"}
                <Sparkles className="w-3 h-3 opacity-60" />
              </p>
              <p className="text-[10px] text-white/50 truncate">{ctx.hint}</p>
            </div>
            <button onClick={() => setMinimized(m => !m)} className="p-1.5 hover:bg-white/10 rounded-lg transition" data-testid="button-minimize-companion" aria-label="minimize">
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition" data-testid="button-close-companion" aria-label="close">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-black/[0.015]">
                {msgs.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[92%] ${m.role === "user" ? "bg-black text-white" : "bg-white border border-black/10 text-black"} rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words space-y-2`}
                         data-testid={`msg-${m.role}-${i}`}>
                      {m.content && <div>{m.content}</div>}

                      {/* Tool artifacts (navigate buttons, page previews, QR images, page lists) */}
                      {m.artifacts && m.artifacts.length > 0 && (
                        <div className="space-y-2 mt-1">
                          {m.artifacts.map((a, k) => {
                            if (a.displayType === "navigate") {
                              const path = a.data?.path || "/";
                              const label = a.data?.label || path;
                              const auto = a.data?.autoOpen !== false;
                              return (
                                <button
                                  key={k}
                                  onClick={() => setLocation(path)}
                                  className="w-full flex items-center justify-between gap-2 bg-black text-white hover:bg-black/85 transition rounded-xl px-3 py-2.5 text-xs font-bold group"
                                  data-testid={`artifact-navigate-${i}-${k}`}
                                >
                                  <span className="flex items-center gap-2">
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                    <span>{auto ? (L ? "تم فتح: " : "Opened: ") : (L ? "افتح: " : "Open: ")}{label}</span>
                                  </span>
                                  <span className="text-[10px] opacity-60 font-mono">{path}</span>
                                </button>
                              );
                            }

                            if (a.displayType === "page_preview") {
                              const path = a.data?.path || "/";
                              const title = a.data?.title || path;
                              const height = Math.min(600, Math.max(220, Number(a.data?.height) || 360));
                              return (
                                <div key={k} className="rounded-xl overflow-hidden border border-black/10 bg-white" data-testid={`artifact-preview-${i}-${k}`}>
                                  <div className="flex items-center justify-between bg-black/[0.03] px-3 py-1.5 border-b border-black/10">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-black/70">
                                      <Eye className="w-3 h-3" />
                                      <span>{title}</span>
                                    </div>
                                    <button
                                      onClick={() => setLocation(path)}
                                      className="flex items-center gap-1 text-[10px] text-black/55 hover:text-black"
                                    >
                                      <ExternalLink className="w-2.5 h-2.5" />
                                      {L ? "فتح" : "Open"}
                                    </button>
                                  </div>
                                  <iframe
                                    src={path}
                                    title={title}
                                    style={{ height: `${height}px` }}
                                    className="w-full bg-white"
                                    sandbox="allow-same-origin allow-scripts allow-forms"
                                  />
                                </div>
                              );
                            }

                            if (a.displayType === "qr_code") {
                              const url = a.data?.imageUrl;
                              if (!url) return null;
                              return (
                                <div key={k} className="rounded-xl border border-black/10 bg-white p-3 flex items-center gap-3" data-testid={`artifact-qr-${i}-${k}`}>
                                  <img src={url} alt={a.data?.label || "QR"} className="w-24 h-24 rounded-lg" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-black/70 mb-1">
                                      <QrCode className="w-3 h-3" />
                                      {L ? "رمز QR" : "QR Code"}
                                    </div>
                                    {a.data?.label && <p className="text-[11px] font-medium text-black truncate">{a.data.label}</p>}
                                    <p className="text-[10px] text-black/50 truncate" dir="ltr">{a.data?.source}</p>
                                  </div>
                                </div>
                              );
                            }

                            if (a.displayType === "pages_list" && Array.isArray(a.data?.pages)) {
                              return (
                                <div key={k} className="rounded-xl border border-black/10 bg-white p-2 grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto" data-testid={`artifact-pages-${i}-${k}`}>
                                  {a.data.pages.slice(0, 24).map((p: any, idx: number) => (
                                    <button
                                      key={idx}
                                      onClick={() => setLocation(p.path)}
                                      className="flex flex-col items-start text-left p-1.5 rounded-lg bg-black/[0.03] hover:bg-black hover:text-white transition group"
                                    >
                                      <span className="text-[11px] font-bold leading-tight truncate w-full">{p.title}</span>
                                      <span className="text-[9px] opacity-50 group-hover:opacity-70 font-mono truncate w-full" dir="ltr">{p.path}</span>
                                    </button>
                                  ))}
                                </div>
                              );
                            }

                            // Generic action_success — small chip
                            if (a.displayType === "action_success") {
                              return (
                                <div key={k} className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-2 py-1 inline-flex items-center gap-1 font-bold">
                                  ✓ {a.name}
                                </div>
                              );
                            }

                            return null;
                          })}
                        </div>
                      )}

                      {m.suggestions && m.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-black/10">
                          {m.suggestions.slice(0, 4).map((s, j) => (
                            <button
                              key={j}
                              onClick={() => send(s)}
                              className="text-[11px] bg-black/[0.04] hover:bg-black hover:text-white border border-black/10 hover:border-black px-2 py-1 rounded-lg font-medium transition"
                              data-testid={`button-suggestion-${i}-${j}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {busy && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-black/10 rounded-2xl px-3.5 py-2 text-sm flex items-center gap-2 text-black/40">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {L ? "يفكر..." : "Thinking..."}
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <form
                onSubmit={(e) => { e.preventDefault(); send(input); }}
                className="border-t border-black/10 p-2.5 flex items-end gap-2 bg-white shrink-0"
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  placeholder={L ? "اكتب سؤالك..." : "Ask anything..."}
                  rows={1}
                  className="flex-1 resize-none bg-black/[0.04] border border-black/10 focus:border-black focus:bg-white outline-none rounded-xl px-3 py-2 text-sm leading-relaxed max-h-24"
                  data-testid="input-companion"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || busy}
                  className="w-10 h-10 rounded-xl bg-black text-white disabled:bg-black/20 disabled:text-white/50 hover:bg-black/85 transition flex items-center justify-center shrink-0"
                  data-testid="button-send-companion"
                  aria-label="send"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>

              {/* Footer hint */}
              <div className="text-[9px] text-black/30 text-center pb-1.5 bg-white">
                {L ? "مدعوم بـ QIROX AI" : "Powered by QIROX AI"} · {L ? "آمن وسريع" : "secure & fast"}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
