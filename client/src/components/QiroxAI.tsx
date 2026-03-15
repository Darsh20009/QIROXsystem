// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import {
  Send, Sparkles, RotateCcw, Loader2, Mail, Package,
  Zap, MessageSquare, Star, Globe, Lightbulb, BookOpen, TrendingUp, Bot,
  ArrowLeft, BarChart2, Wallet, ShoppingCart, FileText, Users, Clock
} from "lucide-react";

function uid() { return Math.random().toString(36).slice(2, 10); }

interface Msg {
  id: string;
  role: "user" | "ai";
  text: string;
  suggestions?: string[];
  action?: string;
  data?: any;
  timestamp: Date;
}

function renderText(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code class=\"bg-white/10 px-1 rounded text-xs font-mono\">$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href=\"$2\" class=\"underline text-cyan-300 hover:text-cyan-100\" target=\"_blank\">$1 ↗</a>")
    .replace(/\n/g, "<br/>");
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400/80"
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }} />
      ))}
    </div>
  );
}

const ROLE_CFG = {
  admin:    { label: "مدير", icon: "👑", gradient: "from-violet-500 to-indigo-600" },
  manager:  { label: "مدير", icon: "👑", gradient: "from-violet-500 to-indigo-600" },
  employee: { label: "موظف", icon: "💼", gradient: "from-blue-500 to-cyan-600" },
  employee_manager: { label: "مشرف", icon: "🔑", gradient: "from-blue-500 to-cyan-600" },
  client:   { label: "عميل", icon: "⭐", gradient: "from-emerald-500 to-teal-600" },
  guest:    { label: "زائر", icon: "👋", gradient: "from-slate-500 to-slate-600" },
};

const QUICK_ACTIONS: Record<string, { label: string; icon: any; msg: string }[]> = {
  admin: [
    { label: "ملخص النظام", icon: BarChart2, msg: "ملخص احصاءات النظام" },
    { label: "شرح الصفحة", icon: BookOpen, msg: "اشرح لوحة القيادة" },
    { label: "مقارنة الباقات", icon: Package, msg: "قارن بين الباقات" },
    { label: "إرسال بريد", icon: Mail, msg: "أرسل بريد إلكتروني" },
  ],
  manager: [
    { label: "ملخص النظام", icon: BarChart2, msg: "ملخص احصاءات النظام" },
    { label: "شرح الصفحة", icon: BookOpen, msg: "اشرح لوحة القيادة" },
    { label: "مقارنة الباقات", icon: Package, msg: "قارن بين الباقات" },
    { label: "إرسال بريد", icon: Mail, msg: "أرسل بريد إلكتروني" },
  ],
  employee: [
    { label: "ملخص مهامي", icon: Clock, msg: "ايش عندي من مهام اليوم" },
    { label: "شرح الطلبات", icon: BookOpen, msg: "اشرح صفحة الطلبات" },
    { label: "شرح الكانبان", icon: Lightbulb, msg: "اشرح صفحة الكانبان" },
    { label: "إرسال بريد", icon: Mail, msg: "أرسل بريد إلكتروني" },
  ],
  employee_manager: [
    { label: "ملخص مهامي", icon: Clock, msg: "ايش عندي من مهام اليوم" },
    { label: "شرح الطلبات", icon: BookOpen, msg: "اشرح صفحة الطلبات" },
    { label: "شرح الكانبان", icon: Lightbulb, msg: "اشرح صفحة الكانبان" },
    { label: "إرسال بريد", icon: Mail, msg: "أرسل بريد إلكتروني" },
  ],
  client: [
    { label: "حسابي", icon: BarChart2, msg: "اعطني ملخص حسابي" },
    { label: "أنسب باقة لي", icon: Star, msg: "أنسب باقة لمشروعي" },
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

/* ─── Stats Card rendered inside chat ─── */
function StatsCard({ data, role }: { data: any; role: string }) {
  if (!data) return null;
  if (role === "client" && data.orders) {
    const { orders, projects, wallet } = data;
    return (
      <div className="w-full mt-1.5 rounded-xl overflow-hidden" style={{ background: "rgba(14,165,233,0.07)", border: "1px solid rgba(14,165,233,0.2)" }}>
        <div className="px-3 py-2 grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-[18px] font-black text-cyan-300">{orders.total}</div>
            <div className="text-[9px] text-white/40">طلب إجمالي</div>
          </div>
          <div className="text-center">
            <div className="text-[18px] font-black text-emerald-300">{projects?.active ?? 0}</div>
            <div className="text-[9px] text-white/40">مشروع نشط</div>
          </div>
          <div className="text-center">
            <div className="text-[14px] font-black text-amber-300">{Number(wallet?.balance ?? 0).toLocaleString()}</div>
            <div className="text-[9px] text-white/40">رصيد (ريال)</div>
          </div>
        </div>
        {orders.pending > 0 && (
          <div className="px-3 py-1.5 text-[10px] text-amber-300 font-semibold" style={{ borderTop: "1px solid rgba(14,165,233,0.15)" }}>
            ⚠️ {orders.pending} طلب في الانتظار
          </div>
        )}
      </div>
    );
  }
  if ((role === "admin" || role === "manager") && (data.totalClients !== undefined || data.openOrders !== undefined)) {
    return (
      <div className="w-full mt-1.5 rounded-xl overflow-hidden" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.22)" }}>
        <div className="px-3 py-2 grid grid-cols-2 gap-2">
          <div className="text-center">
            <div className="text-[17px] font-black text-violet-300">{data.totalClients ?? 0}</div>
            <div className="text-[9px] text-white/40">إجمالي العملاء</div>
          </div>
          <div className="text-center">
            <div className="text-[17px] font-black text-orange-300">{data.openOrders ?? 0}</div>
            <div className="text-[9px] text-white/40">طلبات مفتوحة</div>
          </div>
          <div className="text-center">
            <div className="text-[14px] font-black text-emerald-300">{Number(data.monthRevenue ?? 0).toLocaleString()}</div>
            <div className="text-[9px] text-white/40">إيرادات الشهر</div>
          </div>
          <div className="text-center">
            <div className="text-[17px] font-black text-cyan-300">{data.newClients ?? 0}</div>
            <div className="text-[9px] text-white/40">عملاء جدد (أسبوع)</div>
          </div>
        </div>
      </div>
    );
  }
  if ((role === "employee" || role === "employee_manager") && data.orders) {
    const o = data.orders;
    return (
      <div className="w-full mt-1.5 rounded-xl overflow-hidden" style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)" }}>
        <div className="px-3 py-2 grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-[17px] font-black text-amber-300">{o.pending ?? 0}</div>
            <div className="text-[9px] text-white/40">معلقة</div>
          </div>
          <div className="text-center">
            <div className="text-[17px] font-black text-blue-300">{o.active ?? 0}</div>
            <div className="text-[9px] text-white/40">نشطة</div>
          </div>
          <div className="text-center">
            <div className="text-[17px] font-black text-emerald-300">{o.completed ?? 0}</div>
            <div className="text-[9px] text-white/40">مكتملة</div>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

/* ─── Navigate action card ─── */
function NavigateCard({ url, label, onNavigate }: { url: string; label: string; onNavigate: (url: string) => void }) {
  return (
    <button
      onClick={() => onNavigate(url)}
      className="w-full mt-1.5 flex items-center gap-2 px-3 py-2.5 rounded-xl text-right transition-all hover:scale-[1.01]"
      style={{ background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.3)" }}
      data-testid="button-ai-navigate"
    >
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold text-cyan-300">انتقل إلى: {label}</div>
        <div className="text-[9px] text-white/35 font-mono mt-0.5">{url}</div>
      </div>
      <ArrowLeft className="w-4 h-4 text-cyan-400 flex-shrink-0" />
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   AIPanel — مكوّن مدمج داخل الصفحات (ليس عائماً)
   استخدمه هكذا:  <AIPanel className="h-[520px]" />
══════════════════════════════════════════════════════════ */
export function AIPanel({ className = "" }: { className?: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => uid());
  const [location, navigate] = useLocation();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  const { data: user } = useQuery<any>({ queryKey: ["/api/user"], retry: false });
  const role = user?.role || "guest";
  const cfg = ROLE_CFG[role] || ROLE_CFG.guest;
  const quickActions = QUICK_ACTIONS[role] || QUICK_ACTIONS.guest;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      addAiMsg(
        role === "client"
          ? `مرحباً${user?.fullName ? ` ${user.fullName}` : ""}! ✨ أنا **QIROX AI**، مستشارك الشخصي.\n\nيمكنني عرض حسابك، اختيار الباقة الأنسب، أو الانتقال لأي صفحة تحتاجها.\n\nكيف أقدر أساعدك؟`
          : role === "admin" || role === "manager"
          ? `مرحباً${user?.fullName ? ` ${user.fullName}` : ""}! 👑 أنا **QIROX AI**، مساعدك الإداري.\n\nيمكنني عرض إحصاءات النظام، تحليل الموقع، إرسال البريد، والانتقال لأي صفحة.`
          : role === "employee" || role === "employee_manager"
          ? `أهلاً${user?.fullName ? ` ${user.fullName}` : ""}! 💼 أنا **QIROX AI**، مساعدك داخل النظام.\n\nيمكنني عرض مهامك، شرح أي صفحة، أو مساعدتك في التنقل.`
          : `مرحباً! أنا **QIROX AI**.\n\nيمكنني مساعدتك في اكتشاف الباقة المثالية أو الإجابة على أي سؤال.`,
        role === "guest" ? ["استكشف الباقات", "أنسب باقة لمشروعي", "كيف تعمل المنصة؟"] : undefined
      );
    }
  }, [role, user]);

  function addAiMsg(text: string, suggestions?: string[], action?: string, data?: any) {
    setMsgs(prev => [...prev, { id: uid(), role: "ai", text, suggestions, action, data, timestamp: new Date() }]);
  }

  function handleNavigate(url: string) {
    navigate(url);
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    setMsgs(prev => [...prev, { id: uid(), role: "user", text: text.trim(), timestamp: new Date() }]);
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

      // Handle actions that trigger side-effects
      if (data.action === "CUSTOM_ORDER_SUBMITTED" && data.data) {
        fetch("/api/ai/custom-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data.data) }).catch(() => {});
      }
      if (data.action === "NAVIGATE" && data.data?.url) {
        addAiMsg(data.reply || "سأنقلك الآن...", data.suggestions, data.action, data.data);
        setLoading(false);
        setTimeout(() => handleNavigate(data.data.url), 900);
        return;
      }
      if (data.action === "GO_PRICES") {
        addAiMsg(data.reply || "انتقل للأسعار", data.suggestions, data.action, data.data);
        setLoading(false);
        setTimeout(() => handleNavigate("/prices"), 900);
        return;
      }

      addAiMsg(data.reply || "عذراً، حدث خطأ.", data.suggestions, data.action, data.data);
    } catch {
      addAiMsg("⚠️ حدث خطأ في الاتصال. تحقق من الإنترنت وحاول مجدداً.");
    } finally {
      setLoading(false);
    }
  }, [loading, sessionId, role, location, user]);

  function resetChat() {
    setMsgs([]);
    initialized.current = false;
    fetch(`/api/ai/session/${sessionId}`, { method: "DELETE" }).catch(() => {});
    setTimeout(() => {
      initialized.current = false;
      addAiMsg(role === "client" ? `مرحباً مجدداً! 👋 كيف أقدر أساعدك؟` : `تم تجديد المحادثة. كيف أقدر أساعدك؟`);
    }, 50);
  }

  return (
    <div
      className={`flex flex-col rounded-2xl overflow-hidden ${className}`}
      style={{
        background: "linear-gradient(160deg, #080e1a 0%, #0c1525 60%, #080d1a 100%)",
        border: "1px solid rgba(14,165,233,0.18)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
      dir="rtl"
    >
      {/* ── Header ── */}
      <div className={`relative flex items-center gap-2.5 px-4 py-3 flex-shrink-0 bg-gradient-to-l ${cfg.gradient}`}>
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.2) 0%, transparent 60%)" }} />
        <div className="relative w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="relative flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-black text-white text-sm tracking-tight">QIROX AI</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-bold">
              {cfg.icon} {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-green-300"
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            <span className="text-[10px] text-white/60">جاهز للمساعدة</span>
          </div>
        </div>
        <button
          onClick={resetChat}
          className="relative p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
          title="محادثة جديدة"
          data-testid="button-ai-reset"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Quick actions (when no messages yet) ── */}
      <AnimatePresence>
        {msgs.length === 0 && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="px-3 pt-3 grid grid-cols-2 gap-2 flex-shrink-0">
            {quickActions.map((qa, i) => {
              const Icon = qa.icon;
              return (
                <motion.button key={i}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => sendMessage(qa.msg)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-right text-[11px] font-semibold text-white/75 hover:text-white transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  data-testid={`button-ai-quick-${i}`}
                >
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,rgba(14,165,233,0.25),rgba(124,58,237,0.25))" }}>
                    <Icon className="w-3 h-3 text-cyan-400" />
                  </div>
                  <span className="leading-tight">{qa.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10 min-h-0">
        <AnimatePresence initial={false}>
          {msgs.map(msg => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}
            >
              {msg.role === "ai" && (
                <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5"
                  style={{ background: "linear-gradient(135deg,#0ea5e9,#7c3aed)" }}>
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              )}
              <div className={`max-w-[82%] flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`px-3 py-2 rounded-2xl text-[12.5px] leading-relaxed ${msg.role === "user" ? "text-white rounded-tr-sm" : "text-white/90 rounded-tl-sm"}`}
                  style={msg.role === "user"
                    ? { background: "linear-gradient(135deg,#0ea5e9,#2563eb)" }
                    : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}
                  dangerouslySetInnerHTML={{ __html: renderText(msg.text) }}
                />

                {/* Stats card — SHOW_STATS action */}
                {msg.action === "SHOW_STATS" && msg.data && (
                  <StatsCard data={msg.data} role={role} />
                )}

                {/* Navigate card — NAVIGATE action */}
                {msg.action === "NAVIGATE" && msg.data?.url && (
                  <NavigateCard url={msg.data.url} label={msg.data.label} onNavigate={handleNavigate} />
                )}

                {/* Package cards — SHOW_PACKAGE action */}
                {msg.action === "SHOW_PACKAGE" && msg.data?.all && (
                  <div className="w-full grid gap-1.5 mt-0.5">
                    {msg.data.all.map((pkg: any) => (
                      <div key={pkg.tier}
                        className="px-2.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                        style={{
                          background: pkg.tier === msg.data.recommended?.tier ? "rgba(14,165,233,0.12)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${pkg.tier === msg.data.recommended?.tier ? "rgba(14,165,233,0.4)" : "rgba(255,255,255,0.08)"}`,
                        }}
                        onClick={() => sendMessage(`اختر باقة ${pkg.nameAr}`)}
                      >
                        <span className="text-base">{pkg.tier === "lite" ? "🥉" : pkg.tier === "pro" ? "🥈" : "🏆"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-black text-white">{pkg.nameAr}</div>
                          <div className="text-[10px] text-white/45">{pkg.price?.toLocaleString()} ريال+</div>
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
                        data-testid={`button-ai-suggestion-${i}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5 text-xs"
                  style={{ background: "rgba(255,255,255,0.1)" }}>
                  {cfg.icon}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#0ea5e9,#7c3aed)" }}>
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div className="px-3 py-1 rounded-2xl rounded-tl-sm" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}>
              <TypingDots />
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="flex-shrink-0 p-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="اكتب سؤالك أو اطلب انتقالاً..."
            disabled={loading}
            className="flex-1 bg-transparent text-white text-[12.5px] placeholder:text-white/30 outline-none text-right"
            dir="rtl"
            data-testid="input-ai-message"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
            style={{ background: "linear-gradient(135deg,#0ea5e9,#7c3aed)" }}
            data-testid="button-ai-send"
          >
            {loading
              ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              : <Send className="w-3.5 h-3.5 text-white" style={{ transform: "scaleX(-1)" }} />}
          </motion.button>
        </div>
        <p className="text-center text-[9px] text-white/20 mt-1">QIROX AI · متصل بالنظام</p>
      </div>
    </div>
  );
}

export default AIPanel;
