// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import {
  X, Send, Sparkles, Bot, Minimize2, Maximize2,
  RotateCcw, ChevronDown, Loader2, Mail, Package,
  Zap, MessageSquare, ExternalLink, Check, Star,
  Globe, Lightbulb, BookOpen, TrendingUp
} from "lucide-react";

/* ─── Helpers ─── */
function uid() { return Math.random().toString(36).slice(2, 10); }

interface Msg {
  id: string;
  role: "user" | "ai" | "system";
  text: string;
  suggestions?: string[];
  action?: string;
  data?: any;
  timestamp: Date;
}

/* ─── Markdown-lite renderer ─── */
function renderText(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code class=\"bg-white/10 px-1 rounded text-xs\">$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href=\"$2\" class=\"underline text-cyan-300 hover:text-cyan-100\" target=\"_blank\">$1 ↗</a>")
    .replace(/\n/g, "<br/>");
}

/* ─── Typing indicator ─── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-2 h-2 rounded-full bg-cyan-400/70"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
      ))}
    </div>
  );
}

/* ─── Role config ─── */
const ROLE_CFG = {
  admin: { label: "المدير", color: "from-violet-600 to-indigo-700", badge: "bg-violet-500/20 text-violet-300", icon: "👑" },
  employee: { label: "الموظف", color: "from-blue-600 to-cyan-700", badge: "bg-blue-500/20 text-blue-300", icon: "💼" },
  client: { label: "العميل", color: "from-emerald-600 to-teal-700", badge: "bg-emerald-500/20 text-emerald-300", icon: "⭐" },
  guest: { label: "الزائر", color: "from-slate-600 to-slate-700", badge: "bg-slate-500/20 text-slate-300", icon: "👋" },
};

/* ─── Quick actions by role ─── */
const QUICK_ACTIONS: Record<string, { label: string; icon: any; msg: string }[]> = {
  admin: [
    { label: "تحليل الموقع", icon: TrendingUp, msg: "اقتراحات لتحسين الموقع" },
    { label: "إرسال بريد", icon: Mail, msg: "أرسل بريد إلكتروني" },
    { label: "شرح صفحة", icon: BookOpen, msg: "اشرح صفحة لوحة القيادة" },
    { label: "مقارنة الباقات", icon: Package, msg: "قارن بين الباقات" },
  ],
  employee: [
    { label: "شرح الطلبات", icon: BookOpen, msg: "اشرح صفحة الطلبات" },
    { label: "إرسال بريد", icon: Mail, msg: "أرسل بريد إلكتروني" },
    { label: "شرح الكانبان", icon: Lightbulb, msg: "اشرح صفحة الكانبان" },
    { label: "شرح الفواتير", icon: Globe, msg: "اشرح صفحة الفواتير" },
  ],
  client: [
    { label: "أنسب باقة لي", icon: Star, msg: "أنسب باقة لمشروعي" },
    { label: "مقارنة الباقات", icon: Package, msg: "قارن بين الباقات" },
    { label: "طلب مخصص", icon: Zap, msg: "أريد طلباً مخصصاً" },
    { label: "تواصل معنا", icon: MessageSquare, msg: "كيف أتواصل مع فريق QIROX؟" },
  ],
  guest: [
    { label: "استكشف الباقات", icon: Package, msg: "أخبرني عن الباقات المتاحة" },
    { label: "أنسب باقة لي", icon: Star, msg: "أنسب باقة لمشروعي" },
    { label: "كيف تعمل المنصة؟", icon: Globe, msg: "كيف تعمل منصة QIROX؟" },
    { label: "طلب مخصص", icon: Zap, msg: "أريد طلباً مخصصاً" },
  ],
};

/* ═══════════════════════════════════════════════════════ */
export default function QiroxAI() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => uid());
  const [location] = useLocation();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: user } = useQuery<any>({ queryKey: ["/api/user"], retry: false });
  const role = user?.role || "guest";
  const cfg = ROLE_CFG[role] || ROLE_CFG.guest;
  const quickActions = QUICK_ACTIONS[role] || QUICK_ACTIONS.guest;

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  // Welcome message on first open
  const initialized = useRef(false);
  useEffect(() => {
    if (open && !initialized.current) {
      initialized.current = true;
      addAiMsg(
        role === "client"
          ? `مرحباً${user?.fullName ? ` ${user.fullName}` : ""}! ✨ أنا **QIROX AI**، مستشارك الشخصي.\n\nيمكنني مساعدتك في:\n• اختيار الباقة الأنسب لمشروعك\n• إنشاء طلب مخصص\n• الإجابة على أي استفسار\n\nكيف أقدر أساعدك؟`
          : role === "employee"
          ? `أهلاً${user?.fullName ? ` ${user.fullName}` : ""}! 👋 أنا **QIROX AI**، مساعدك داخل النظام.\n\nاسألني عن أي صفحة أو مهمة وسأشرحها لك بالتفصيل، أو أرسل بريداً للعملاء مباشرة من هنا.`
          : role === "admin"
          ? `مرحباً${user?.fullName ? ` ${user.fullName}` : ""}! 👑 أنا **QIROX AI**، مساعدك الإداري.\n\nيمكنني تحليل الموقع، شرح الصفحات، إرسال البريد، ومساعدتك في أي قرار.`
          : "مرحباً! 🤖 أنا **QIROX AI**.\n\nيمكنني مساعدتك في اكتشاف الباقة المثالية لمشروعك أو الإجابة على أي سؤال. جرب!",
        role === "guest" ? ["استكشف الباقات", "أنسب باقة لمشروعي", "كيف تعمل المنصة؟"] : undefined
      );
    }
  }, [open, role, user]);

  function addAiMsg(text: string, suggestions?: string[], action?: string, data?: any) {
    setMsgs(prev => [...prev, { id: uid(), role: "ai", text, suggestions, action, data, timestamp: new Date() }]);
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { id: uid(), role: "user", text: text.trim(), timestamp: new Date() };
    setMsgs(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          sessionId,
          context: { role, page: location, name: user?.fullName || user?.username },
        }),
      });
      const data = await res.json();
      // Handle special actions
      if (data.action === "CUSTOM_ORDER_SUBMITTED" && data.data) {
        // Submit to backend
        fetch("/api/ai/custom-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data.data),
        }).catch(console.error);
      }
      addAiMsg(data.reply || "عذراً، حدث خطأ.", data.suggestions, data.action, data.data);
    } catch {
      addAiMsg("⚠️ حدث خطأ في الاتصال. تحقق من الإنترنت وحاول مجدداً.");
    } finally {
      setLoading(false);
    }
  }, [loading, sessionId, role, location, user]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  }

  function resetChat() {
    setMsgs([]);
    initialized.current = false;
    fetch(`/api/ai/session/${sessionId}`, { method: "DELETE" }).catch(() => {});
    // Re-trigger welcome
    setTimeout(() => {
      initialized.current = false;
    }, 100);
  }

  const panelW = expanded ? "w-[520px]" : "w-[380px]";
  const panelH = expanded ? "h-[85vh]" : "h-[580px]";

  return (
    <>
      {/* ─── Floating button ─── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 left-6 z-[9999] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #0ea5e9, #7c3aed)" }}
            data-testid="button-qirox-ai-open"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            >
              <Sparkles className="w-7 h-7 text-white" />
            </motion.div>
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: "2px solid rgba(14,165,233,0.5)" }}
              animate={{ scale: [1, 1.4], opacity: [0.7, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {/* Badge */}
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <span className="text-[9px] font-black text-white">AI</span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── Chat panel ─── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className={`fixed bottom-6 left-6 z-[9999] ${panelW} ${panelH} rounded-3xl overflow-hidden flex flex-col`}
            style={{
              background: "linear-gradient(160deg, #0a0f1e 0%, #0d1526 60%, #0a0e1c 100%)",
              border: "1px solid rgba(14,165,233,0.2)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
            data-testid="panel-qirox-ai"
          >
            {/* ── Header ── */}
            <div className={`relative flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${cfg.color} flex-shrink-0`}>
              {/* Mesh background */}
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)" }} />

              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="relative flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-white text-sm">QIROX AI</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${cfg.badge}`}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <motion.div className="w-1.5 h-1.5 rounded-full bg-green-400"
                    animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                  <span className="text-[10px] text-white/60">متصل — جاهز للمساعدة</span>
                </div>
              </div>
              <div className="relative flex items-center gap-1">
                <button onClick={resetChat} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all" title="محادثة جديدة">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all">
                  {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all" data-testid="button-qirox-ai-close">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ── Quick actions (shown only when no messages) ── */}
            <AnimatePresence>
              {msgs.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="px-3 pt-3 grid grid-cols-2 gap-2 flex-shrink-0">
                  {quickActions.map((qa, i) => {
                    const Icon = qa.icon;
                    return (
                      <motion.button key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => sendMessage(qa.msg)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-right text-[11px] font-semibold text-white/80 hover:text-white transition-all group"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                        data-testid={`button-quick-action-${i}`}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.2), rgba(124,58,237,0.2))" }}>
                          <Icon className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <span className="leading-tight">{qa.label}</span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
              <AnimatePresence initial={false}>
                {msgs.map(msg => (
                  <motion.div key={msg.id}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}
                  >
                    {msg.role === "ai" && (
                      <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
                        style={{ background: "linear-gradient(135deg, #0ea5e9, #7c3aed)" }}>
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
                      <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                        msg.role === "user"
                          ? "text-white rounded-tr-sm"
                          : "text-white/90 rounded-tl-sm"
                        }`}
                        style={msg.role === "user"
                          ? { background: "linear-gradient(135deg, #0ea5e9, #2563eb)" }
                          : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }
                        }
                        dangerouslySetInnerHTML={{ __html: renderText(msg.text) }}
                      />

                      {/* Special action cards */}
                      {msg.action === "SHOW_PACKAGE" && msg.data?.all && (
                        <div className="w-full grid gap-1.5 mt-1">
                          {msg.data.all.map((pkg: any) => (
                            <div key={pkg.tier}
                              className={`px-3 py-2 rounded-xl flex items-center gap-2.5 cursor-pointer transition-all hover:scale-[1.01] ${pkg.tier === msg.data.recommended?.tier ? "border border-cyan-500/50" : "border border-white/8"}`}
                              style={{ background: pkg.tier === msg.data.recommended?.tier ? "rgba(14,165,233,0.12)" : "rgba(255,255,255,0.04)" }}
                              onClick={() => sendMessage(`اختر باقة ${pkg.nameAr}`)}
                            >
                              <div className="text-lg">{pkg.tier === "lite" ? "🥉" : pkg.tier === "pro" ? "🥈" : "🏆"}</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-black text-white">{pkg.nameAr}</div>
                                <div className="text-[10px] text-white/50">{pkg.price.toLocaleString()} ريال+</div>
                              </div>
                              {pkg.tier === msg.data.recommended?.tier && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black text-cyan-300 bg-cyan-500/20">موصى به</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Suggestions */}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                          {msg.suggestions.map((s, i) => (
                            <button key={i} onClick={() => sendMessage(s)}
                              className="text-[11px] px-2.5 py-1 rounded-full text-cyan-300 hover:text-white font-semibold transition-all hover:scale-[1.03]"
                              style={{ background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.25)" }}
                              data-testid={`button-suggestion-${i}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5 text-sm"
                        style={{ background: "rgba(255,255,255,0.1)" }}>
                        {cfg.icon}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {loading && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #0ea5e9, #7c3aed)" }}>
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="px-3 py-1 rounded-2xl rounded-tl-sm" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <TypingDots />
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* ── Scroll to bottom hint ── */}
            {msgs.length > 4 && (
              <button onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] text-white/60 hover:text-white transition-all"
                style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <ChevronDown className="w-3 h-3 inline mr-1" />
                للأسفل
              </button>
            )}

            {/* ── Input ── */}
            <div className="flex-shrink-0 p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="اكتب رسالتك..."
                  disabled={loading}
                  className="flex-1 bg-transparent text-white text-[13px] placeholder:text-white/30 outline-none text-right"
                  dir="rtl"
                  data-testid="input-ai-message"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
                  style={{ background: "linear-gradient(135deg, #0ea5e9, #7c3aed)" }}
                  data-testid="button-ai-send"
                >
                  {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" style={{ transform: "scaleX(-1)" }} />}
                </motion.button>
              </div>
              <p className="text-center text-[10px] text-white/20 mt-1.5">QIROX AI · مدعوم بالبحث الذكي</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
