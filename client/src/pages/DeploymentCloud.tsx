import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useRoute, Link } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Cloud, Github, Zap, Globe, AlertTriangle, CheckCircle2, Clock,
  Plus, RefreshCw, Trash2, Play, Square, ExternalLink, Copy,
  ChevronRight, X, Settings2, Eye, EyeOff, Bot, Send,
  GitBranch, GitCommit, Cpu, MemoryStick, Server, Layers,
  Activity, BarChart3, Terminal, Package, ArrowRight, Star,
  Shield, Gauge, MonitorCheck, Boxes, Sparkles, Loader2,
  FolderGit2, ChevronDown, Lock, Unlock, Link2, Rocket,
  BookOpen, Code2, Database, Wifi, WifiOff, TrendingUp,
  AlertCircle, Info, CheckCheck, RotateCcw, FlaskConical,
  ChevronLeft, LayoutDashboard, BrainCircuit, Timer, ImageIcon,
} from "lucide-react";

// BASE_DOMAIN is fetched dynamically from /api/deploy/config
let _cachedDomain = "deployment.qiroxstudio.online";
let _cachedMode = "simulation";
(async () => {
  try {
    const r = await fetch("/api/deploy/config");
    const d = await r.json();
    if (d.baseDomain) _cachedDomain = d.baseDomain;
    if (d.mode) _cachedMode = d.mode;
  } catch {}
})();
function getBaseDomain() { return _cachedDomain; }
function getDeployMode() { return _cachedMode; }

const FRAMEWORK_ICONS: Record<string, string> = {
  "Next.js": "⬛", "Vite": "⚡", "Nuxt.js": "💚", "Astro": "🚀",
  "Remix": "💿", "SvelteKit": "🧡", "Angular": "🔴", "Gatsby": "💜",
  "Node.js": "🟢", "Python": "🐍", "Static": "📄", "auto": "🔍",
};

const STATUS_COLORS: Record<string, string> = {
  live:      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  building:  "bg-blue-500/15 text-blue-400 border-blue-500/30",
  deploying: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  failed:    "bg-red-500/15 text-red-400 border-red-500/30",
  idle:      "bg-black/[0.03] dark:bg-white/5 text-gray-400 dark:text-white/40 border-black/10 dark:border-white/10",
  suspended: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  queued:    "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  success:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-black/[0.03] dark:bg-white/5 text-gray-400 dark:text-white/40 border-black/10 dark:border-white/10",
};

const STATUS_LABELS: Record<string, string> = {
  live: "مباشر", building: "يُبنى", deploying: "يُنشر",
  failed: "فشل", idle: "خامل", suspended: "موقوف",
  queued: "في الطابور", success: "نجح", cancelled: "ملغى",
};

const LOG_COLORS: Record<string, string> = {
  info:    "text-blue-400",
  cmd:     "text-yellow-300",
  stdout:  "text-white/70",
  error:   "text-red-400",
  success: "text-emerald-400",
  warn:    "text-amber-400",
};

const SERVICE_TYPES = [
  {
    id: "web",
    icon: Globe,
    title: "خدمة ويب",
    titleEn: "Web Service",
    desc: "تطبيق ويب كامل يستجيب لطلبات HTTP",
    color: "#6366f1",
    bg: "from-violet-600/20 to-violet-600/5",
    border: "border-violet-500/30 hover:border-violet-500/60",
  },
  {
    id: "static",
    icon: Zap,
    title: "موقع ثابت",
    titleEn: "Static Site",
    desc: "ملفات HTML/CSS/JS سريعة عبر CDN",
    color: "#3b82f6",
    bg: "from-blue-600/20 to-blue-600/5",
    border: "border-blue-500/30 hover:border-blue-500/60",
  },
  {
    id: "cron",
    icon: Timer,
    title: "مهمة مجدولة",
    titleEn: "Cron Job",
    desc: "سكريبت يعمل بجدول زمني محدد تلقائياً",
    color: "#f59e0b",
    bg: "from-amber-600/20 to-amber-600/5",
    border: "border-amber-500/30 hover:border-amber-500/60",
  },
  {
    id: "worker",
    icon: Cpu,
    title: "عملية خلفية",
    titleEn: "Background Worker",
    desc: "عملية تعمل بدون HTTP في الخلفية",
    color: "#10b981",
    bg: "from-emerald-600/20 to-emerald-600/5",
    border: "border-emerald-500/30 hover:border-emerald-500/60",
  },
];

function timeAgo(date: string | Date | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "الآن";
  if (diff < 3600) return `منذ ${Math.round(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.round(diff / 3600)} ساعة`;
  return `منذ ${Math.round(diff / 86400)} يوم`;
}

function formatDuration(sec: number): string {
  if (!sec) return "—";
  if (sec < 60) return `${sec}ث`;
  return `${Math.floor(sec / 60)}د ${sec % 60}ث`;
}

// ── Standalone Layout ──────────────────────────────────────────────────────
function CloudLayout({ children, onNewProject }: { children: React.ReactNode; onNewProject?: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white" dir="rtl">
      <header className="sticky top-0 z-40 border-b border-black/[0.08] dark:border-white/[0.08] bg-white/90 dark:bg-gray-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/employee/role-dashboard">
              <button className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/80 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05]">
                <ChevronLeft size={14} />
                <LayoutDashboard size={12} />
                <span className="hidden sm:inline"> لوحة التحكم</span>
              </button>
            </Link>
            <div className="w-px h-4 bg-black/[0.08] dark:bg-white/[0.08]" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-violet-600 rounded-lg flex items-center justify-center">
                <Cloud size={12} className="text-white" />
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">Qirox Cloud</span>
              <span className="hidden sm:flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
              {getDeployMode() !== "vercel" && (
                <span className="hidden sm:flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  <FlaskConical size={9} /> محاكاة
                </span>
              )}
            </div>
          </div>
          {onNewProject && (
            <button
              onClick={onNewProject}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-lg shadow-violet-500/20"
            >
              <Plus size={14} />
              مشروع جديد
            </button>
          )}
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}

// ── Stats Bar ──────────────────────────────────────────────────────────────
function StatsBar({ stats }: { stats: any }) {
  const cards = [
    { label: "إجمالي المشاريع", value: stats?.totalProjects ?? 0, icon: Boxes, color: "text-violet-400", bg: "bg-violet-500/10" },
    { label: "مشاريع مباشرة", value: stats?.liveProjects ?? 0, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "فشل النشر", value: stats?.failedProjects ?? 0, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "إجمالي النشرات", value: stats?.totalRuns ?? 0, icon: Rocket, color: "text-blue-400", bg: "bg-blue-500/10" },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map((c) => (
        <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] rounded-xl p-4 flex items-center gap-3">
          <div className={`p-2 rounded-lg ${c.bg} ${c.color}`}><c.icon size={16} /></div>
          <div>
            <p className="text-xl font-black text-gray-900 dark:text-white">{c.value}</p>
            <p className="text-[10px] text-gray-400 dark:text-white/40">{c.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Log Line ───────────────────────────────────────────────────────────────
function LogLine({ log, index }: { log: any; index: number }) {
  const color = LOG_COLORS[log.level] || "text-white/60";
  const prefix = log.level === "error" ? "✖" : log.level === "success" ? "✔" : log.level === "cmd" ? "$" : "›";
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      className={`flex items-start gap-2 font-mono text-[11px] leading-relaxed ${color}`}
    >
      <span className="shrink-0 opacity-60 select-none">{prefix}</span>
      <span className="break-all">{log.message}</span>
    </motion.div>
  );
}

// ── Terminal ───────────────────────────────────────────────────────────────
function Terminal_({ logs, status, isActive }: { logs: any[]; status: string; isActive: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);
  return (
    <div className="bg-[#090e1a] border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[10px] text-white/30 font-mono mr-1">build output</span>
        {isActive && (
          <span className="mr-auto flex items-center gap-1 text-[10px] text-blue-400">
            <Loader2 size={9} className="animate-spin" /> building...
          </span>
        )}
      </div>
      <div className="p-4 h-64 overflow-y-auto space-y-0.5 scrollbar-hide">
        {logs.length === 0 ? (
          <p className="text-white/20 text-xs font-mono text-center py-8">في انتظار النشر...</p>
        ) : (
          logs.map((log: any, i: number) => <LogLine key={i} log={log} index={i} />)
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ── AI Assistant ───────────────────────────────────────────────────────────
function AIAssistant({ run, project, onClose }: { run: any; project: any; onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const hasError = run?.status === "failed";

  const analyzeAuto = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiRequest("POST", "/api/deploy/ai/analyze", {
        logs: run?.logs || [],
        framework: project?.framework,
        buildCommand: project?.buildCommand,
        errorMessage: run?.error,
        runId: run?.id || run?._id,
      });
      const data = await r.json();
      setMessages([{ role: "ai", text: data.suggestion }]);
    } catch (e: any) {
      toast({ title: "خطأ", description: "تعذر تحليل الأخطاء", variant: "destructive" });
    }
    setLoading(false);
  }, [run, project]);

  useEffect(() => {
    if (hasError && messages.length === 0) analyzeAuto();
  }, [hasError]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const r = await apiRequest("POST", "/api/deploy/ai/analyze", {
        logs: run?.logs || [],
        framework: project?.framework,
        buildCommand: project?.buildCommand,
        question: q,
      });
      const data = await r.json();
      setMessages(m => [...m, { role: "ai", text: data.suggestion }]);
    } catch {
      setMessages(m => [...m, { role: "ai", text: "عذراً، حدث خطأ في الاتصال." }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#090e1a] border border-black/[0.08] dark:border-white/[0.08] rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.08] dark:border-white/[0.06] bg-gradient-to-r from-violet-500/10 to-blue-500/10">
        <div className="p-1.5 rounded-lg bg-violet-500/20"><BrainCircuit size={15} className="text-violet-400" /></div>
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">Qirox AI</p>
          <p className="text-[10px] text-gray-400 dark:text-white/40">محلل أخطاء النشر</p>
        </div>
        <button onClick={onClose} className="mr-auto text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white/70 transition-colors"><X size={15} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && messages.length === 0 && (
          <div className="flex items-center gap-2 text-violet-400 text-sm">
            <Loader2 size={14} className="animate-spin" />
            <span>يحلل سجلات النشر...</span>
          </div>
        )}
        {!loading && messages.length === 0 && !hasError && (
          <div className="text-center text-gray-400 dark:text-white/30 text-sm py-8">
            <BrainCircuit size={28} className="mx-auto mb-2 opacity-30" />
            <p>اسألني عن أي مشكلة في النشر</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === "user" ? "bg-violet-600 text-white" : "bg-black/[0.05] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/8 text-gray-700 dark:text-white/80"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && messages.length > 0 && (
          <div className="flex gap-1 text-violet-400 pl-1">
            {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {hasError && messages.length === 0 && !loading && (
        <div className="px-4 pb-2">
          <button onClick={analyzeAuto} className="w-full text-xs bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 border border-violet-500/30 rounded-lg py-2 transition-colors flex items-center justify-center gap-2">
            <Sparkles size={12} /> تحليل الخطأ تلقائياً
          </button>
        </div>
      )}
      <div className="p-3 border-t border-black/[0.08] dark:border-white/[0.06] flex gap-2">
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="اسأل عن المشكلة..."
          className="flex-1 bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 outline-none focus:border-violet-500/50 transition-colors"
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}
          className="p-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 rounded-lg text-white transition-colors">
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Service Type Step (Render-like) ────────────────────────────────────────
function ServiceTypeStep({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">ما نوع الخدمة التي تريد نشرها؟</p>
        <p className="text-xs text-gray-400 dark:text-white/40">اختر النوع المناسب لمشروعك</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {SERVICE_TYPES.map(s => {
          const Icon = s.icon;
          const isSelected = selected === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`relative group flex flex-col gap-2.5 p-4 rounded-xl border transition-all text-right ${
                isSelected
                  ? `bg-gradient-to-br ${s.bg} border-opacity-100`
                  : "bg-black/[0.025] dark:bg-white/[0.025] border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              } ${isSelected ? s.border.split(" ")[0] : s.border}`}
            >
              {isSelected && (
                <div className="absolute top-2.5 left-2.5 w-4 h-4 rounded-full bg-black/10 dark:bg-white/20 flex items-center justify-center">
                  <CheckCheck size={9} className="text-gray-900 dark:text-white" />
                </div>
              )}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: s.color + "25", color: s.color }}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{s.title}</p>
                <p className="text-[10px] text-gray-400 dark:text-white/40 mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── GitHub OAuth Step ──────────────────────────────────────────────────────
function GitHubConnectStep({
  ghUser, token, setToken, onConnect, loading, onUseOAuth,
}: {
  ghUser: any; token: string; setToken: (t: string) => void;
  onConnect: () => void; loading: boolean; onUseOAuth: () => void;
}) {
  const [oauthAvailable, setOauthAvailable] = useState<boolean | null>(null);
  const [showPAT, setShowPAT] = useState(false);

  useEffect(() => {
    fetch("/api/deploy/github/oauth/available")
      .then(r => r.json())
      .then(d => {
        setOauthAvailable(d.available);
        // Only show PAT input if no OAuth AND no system token
        if (!d.available && !d.hasSystemToken) setShowPAT(true);
      })
      .catch(() => { setOauthAvailable(false); setShowPAT(true); });
  }, []);

  if (ghUser) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
          <img src={ghUser.avatar_url} alt="" className="w-10 h-10 rounded-full ring-2 ring-emerald-500/30" />
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 dark:text-white">{ghUser.name || ghUser.login}</p>
            <p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 size={10} /> @{ghUser.login} — متصل بـ GitHub</p>
          </div>
          <Github size={20} className="text-gray-400 dark:text-white/30" />
        </div>
        <p className="text-xs text-gray-400 dark:text-white/40 text-center">حساب GitHub متصل. تابع لاختيار المستودع.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 dark:bg-[#161b22] border border-black/10 dark:border-white/[0.1] rounded-xl flex items-start gap-3">
        <Github size={18} className="text-gray-900 dark:text-white shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">ربط حساب GitHub</p>
          <p className="text-xs text-gray-500 dark:text-white/50">نحتاج للوصول لمستودعاتك لنشر مشروعك تلقائياً</p>
        </div>
      </div>

      {oauthAvailable === true && (
        <>
          <button
            onClick={onUseOAuth}
            className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-gray-100 text-black border border-black/10 dark:border-transparent font-semibold text-sm py-3 rounded-xl transition-all"
          >
            <Github size={17} />
            تسجيل الدخول بـ GitHub
          </button>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-black/[0.07] dark:bg-white/[0.07]" />
            <button onClick={() => setShowPAT(p => !p)} className="text-[11px] text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 transition-colors">
              أو استخدام Personal Access Token
            </button>
            <div className="flex-1 h-px bg-black/[0.07] dark:bg-white/[0.07]" />
          </div>
        </>
      )}

      {oauthAvailable === false && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex gap-2.5">
          <Info size={13} className="shrink-0 mt-0.5" />
          <span>تسجيل الدخول بـ GitHub غير مفعّل. استخدم <strong>Personal Access Token</strong> بدلاً منه.</span>
        </div>
      )}

      <AnimatePresence>
        {showPAT && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex gap-2.5">
              <Info size={13} className="shrink-0 mt-0.5" />
              <span>GitHub → Settings → Developer Settings → Personal Access Tokens (Classic) → صلاحية <code className="bg-blue-500/20 px-1 rounded">repo</code> → Generate token</span>
            </div>
            <input
              type="password" value={token} onChange={e => setToken(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onConnect()}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white font-mono placeholder:text-black/30 dark:placeholder:text-white/20 outline-none focus:border-violet-500/50 transition-colors"
            />
            <button onClick={onConnect} disabled={loading || !token.trim()}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Github size={15} />}
              {loading ? "جاري الاتصال..." : "ربط بـ Token"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Create Project Modal ───────────────────────────────────────────────────
function CreateProjectModal({ onClose, onCreated, initialStep = "service" }: {
  onClose: () => void; onCreated: () => void; initialStep?: string;
}) {
  const [step, setStep] = useState<"service" | "github" | "repo" | "config">(initialStep as any);
  const [serviceType, setServiceType] = useState(() => {
    if (initialStep === "repo" || initialStep === "github") {
      return sessionStorage.getItem("deploy_service_type") || "web";
    }
    return "web";
  });
  const [token, setToken] = useState("");
  const [ghUser, setGhUser] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "", description: "", githubBranch: "main",
    buildCommand: "npm run build", startCommand: "npm start",
    outputDir: "dist", nodeVersion: "20", plan: "starter", region: "me-1",
  });
  const [loading, setLoading] = useState(false);
  const [repoSearch, setRepoSearch] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const STEPS = ["service", "github", "repo", "config"];
  const STEP_LABELS = ["الخدمة", "GitHub", "المستودع", "الإعدادات"];
  const currentStepIdx = STEPS.indexOf(step);

  // On mount at github step — check if system token already connected → skip to repo
  useEffect(() => {
    if (initialStep === "repo" || initialStep !== "service") return;
    (async () => {
      try {
        const r = await fetch("/api/deploy/github/oauth/status");
        const data = await r.json();
        if (data.connected && data.token) {
          setGhUser(data);
          setToken(data.token);
        }
      } catch {}
    })();
  }, []);

  // After OAuth redirect → auto-fetch status + repos
  useEffect(() => {
    if (initialStep !== "repo") return;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch("/api/deploy/github/oauth/status");
        const data = await r.json();
        if (data.connected && data.token) {
          setGhUser(data);
          setToken(data.token);
          const rR = await fetch("/api/deploy/github/repos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: data.token }),
          });
          const rData = await rR.json();
          setRepos(Array.isArray(rData) ? rData : []);
        } else {
          // Token expired or not connected — fall back to GitHub step
          setStep("github");
          toast({ title: "انتهت صلاحية الاتصال", description: "أعد ربط GitHub", variant: "destructive" });
        }
      } catch {
        setStep("github");
      }
      setLoading(false);
    })();
  }, []);

  const goToGitHub = () => {
    sessionStorage.setItem("deploy_service_type", serviceType);
    sessionStorage.setItem("deploy_reopen_modal", "1");
    window.location.href = "/api/deploy/github/oauth/start";
  };

  const connectGitHub = async () => {
    if (!token.trim()) return;
    setLoading(true);
    try {
      const [uR, rR] = await Promise.all([
        apiRequest("POST", "/api/deploy/github/user", { token }),
        apiRequest("POST", "/api/deploy/github/repos", { token }),
      ]);
      const uData = await uR.json();
      const rData = await rR.json();
      if (uData.login) { setGhUser({ ...uData, token }); setRepos(Array.isArray(rData) ? rData : []); setStep("repo"); }
      else throw new Error("Token غير صالح");
    } catch (e: any) { toast({ title: "خطأ", description: e.message || "تعذر الاتصال بـ GitHub", variant: "destructive" }); }
    setLoading(false);
  };

  const nextFromGithub = () => {
    if (!ghUser) { toast({ title: "ربط GitHub أولاً", variant: "destructive" }); return; }
    setStep("repo");
  };

  const selectRepo = async (repo: any) => {
    setSelectedRepo({ ...repo, repoId: repo.id });
    setForm(f => ({ ...f, name: repo.name, githubBranch: repo.default_branch || "main" }));
    setLoading(true);
    try {
      const activeToken = token || ghUser?.token || "";
      const r = await apiRequest("POST", "/api/deploy/github/branches", {
        token: activeToken,
        owner: repo.full_name.split("/")[0], repo: repo.name,
      });
      const data = await r.json();
      setBranches(data.map((b: any) => b.name));
    } catch {}
    setLoading(false);
    setStep("config");
  };

  const createProject = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const [owner, repoName] = selectedRepo.full_name.split("/");
      await apiRequest("POST", "/api/deploy/projects", {
        ...form, serviceType,
        githubOwner: owner, githubRepo: repoName,
        githubToken: token || ghUser?.token || "",
        githubRepoId: selectedRepo.repoId || selectedRepo.id || "",
      });
      qc.invalidateQueries({ queryKey: ["/api/deploy/projects"] });
      qc.invalidateQueries({ queryKey: ["/api/deploy/stats"] });
      toast({ title: "تم الإنشاء! 🚀", description: `مشروع "${form.name}" جاهز للنشر` });
      onCreated();
      onClose();
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  const filteredRepos = repos.filter(r =>
    r.full_name.toLowerCase().includes(repoSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full sm:max-w-lg bg-white dark:bg-[#0c1322] border border-black/10 dark:border-white/[0.1] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.07] dark:border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-600/20 border border-violet-500/30 rounded-xl flex items-center justify-center">
              <Rocket size={15} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">مشروع جديد</h2>
              <p className="text-[11px] text-gray-400 dark:text-white/35">ربط مستودع GitHub ونشره</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white/70 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center px-5 py-3 border-b border-black/5 dark:border-white/[0.05] gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex items-center gap-1.5 text-[11px] font-medium transition-all ${
                step === s ? "text-violet-400" :
                currentStepIdx > i ? "text-emerald-400" : "text-gray-400 dark:text-white/25"
              }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  step === s ? "bg-violet-500 text-white" :
                  currentStepIdx > i ? "bg-emerald-500 text-white" : "bg-black/[0.07] dark:bg-white/[0.07] text-gray-400 dark:text-white/30"
                }`}>
                  {currentStepIdx > i ? "✓" : i + 1}
                </span>
                <span className="hidden sm:inline">{STEP_LABELS[i]}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-1 transition-all ${currentStepIdx > i ? "bg-emerald-500/40" : "bg-black/[0.08] dark:bg-white/[0.06]"}`} />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="p-5 space-y-4">
          {step === "service" && (
            <>
              <ServiceTypeStep selected={serviceType} onSelect={setServiceType} />
              <button onClick={() => setStep("github")}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2">
                التالي
                <ChevronLeft size={15} />
              </button>
            </>
          )}

          {step === "github" && (
            <>
              <GitHubConnectStep
                ghUser={ghUser} token={token} setToken={setToken}
                onConnect={connectGitHub} loading={loading} onUseOAuth={goToGitHub}
              />
              <div className="flex gap-2">
                <button onClick={() => setStep("service")} className="flex-1 bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.07] dark:hover:bg-white/[0.07] text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white rounded-xl py-2.5 text-sm font-medium transition-all">
                  رجوع
                </button>
                <button onClick={nextFromGithub} disabled={!ghUser}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-1.5">
                  التالي <ChevronLeft size={14} />
                </button>
              </div>
            </>
          )}

          {step === "repo" && (
            <div className="space-y-3">
              {loading && repos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 size={24} className="text-violet-400 animate-spin" />
                  <p className="text-sm text-gray-400 dark:text-white/40">جاري جلب مستودعاتك...</p>
                </div>
              ) : (
                <>
                  {ghUser && (
                    <div className="flex items-center gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      {ghUser.avatar_url && <img src={ghUser.avatar_url} alt="" className="w-7 h-7 rounded-full" />}
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{ghUser.name || ghUser.login}</span>
                      <CheckCircle2 size={13} className="mr-auto text-emerald-400" />
                    </div>
                  )}
                  <input
                    value={repoSearch} onChange={e => setRepoSearch(e.target.value)}
                    placeholder="ابحث عن مستودع..."
                    className="w-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 outline-none focus:border-violet-500/50 transition-colors"
                  />
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {filteredRepos.map(repo => (
                      <button key={repo.id} onClick={() => selectRepo(repo)}
                        className="w-full flex items-center gap-3 p-3 bg-black/[0.025] dark:bg-white/[0.025] hover:bg-violet-500/10 border border-black/[0.07] dark:border-white/[0.07] hover:border-violet-500/30 rounded-xl transition-all text-right">
                        <FolderGit2 size={15} className="text-gray-400 dark:text-white/35 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{repo.name}</p>
                          <p className="text-[11px] text-gray-400 dark:text-white/30 truncate">{repo.full_name}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {repo.private && <Lock size={10} className="text-amber-400" />}
                          {repo.language && <span className="text-[10px] text-gray-400 dark:text-white/30 bg-black/[0.05] dark:bg-white/[0.05] px-1.5 py-0.5 rounded">{repo.language}</span>}
                        </div>
                      </button>
                    ))}
                    {filteredRepos.length === 0 && (
                      <p className="text-center text-xs text-gray-400 dark:text-white/30 py-6">لا توجد مستودعات</p>
                    )}
                  </div>
                  <button onClick={() => setStep("github")} className="w-full bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.07] dark:hover:bg-white/[0.07] text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white rounded-xl py-2.5 text-sm font-medium transition-all">
                    رجوع
                  </button>
                </>
              )}
            </div>
          )}

          {step === "config" && (
            <div className="space-y-3">
              {selectedRepo && (
                <div className="flex items-center gap-2 p-2.5 bg-black/[0.025] dark:bg-white/[0.025] border border-black/[0.07] dark:border-white/[0.07] rounded-xl">
                  <FolderGit2 size={13} className="text-violet-400 shrink-0" />
                  <span className="text-xs text-gray-500 dark:text-white/60">{selectedRepo.full_name}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-gray-400 dark:text-white/40 mb-1 block">اسم المشروع</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-violet-500/50 transition-colors" />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 dark:text-white/40 mb-1 block">الفرع</label>
                  <select value={form.githubBranch} onChange={e => setForm(f => ({ ...f, githubBranch: e.target.value }))}
                    className="w-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-violet-500/50 transition-colors">
                    {branches.length ? branches.map(b => <option key={b} value={b}>{b}</option>) : <option value="main">main</option>}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-gray-400 dark:text-white/40 mb-1 block">أمر البناء</label>
                <input value={form.buildCommand} onChange={e => setForm(f => ({ ...f, buildCommand: e.target.value }))}
                  className="w-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white font-mono outline-none focus:border-violet-500/50 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-gray-400 dark:text-white/40 mb-1 block">مجلد الإخراج</label>
                  <input value={form.outputDir} onChange={e => setForm(f => ({ ...f, outputDir: e.target.value }))}
                    className="w-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white font-mono outline-none focus:border-violet-500/50 transition-colors" />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 dark:text-white/40 mb-1 block">Node.js</label>
                  <select value={form.nodeVersion} onChange={e => setForm(f => ({ ...f, nodeVersion: e.target.value }))}
                    className="w-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-violet-500/50 transition-colors">
                    {["18","20","21","22"].map(v => <option key={v} value={v}>Node {v}</option>)}
                  </select>
                </div>
              </div>
              <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[11px] text-gray-400 dark:text-white/40">الرابط بعد النشر</p>
                  {getDeployMode() === "vercel" ? (
                    <span className="text-[9px] bg-black/50 border border-black/10 dark:border-white/10 text-gray-500 dark:text-white/50 px-1.5 py-0.5 rounded font-mono">Vercel ✓</span>
                  ) : (
                    <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-mono">محاكاة</span>
                  )}
                </div>
                <p className="text-xs text-violet-300 font-mono">
                  {getDeployMode() === "vercel"
                    ? `${form.name ? form.name.toLowerCase().replace(/[^a-z0-9]/g,"-") : "your-project"}.vercel.app`
                    : `${form.name ? form.name.toLowerCase().replace(/[^a-z0-9]/g,"-") : "your-project"}.${getBaseDomain()}`
                  }
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep("repo")} className="flex-1 bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.07] dark:hover:bg-white/[0.07] text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white rounded-xl py-2.5 text-sm font-medium transition-all">
                  رجوع
                </button>
                <button onClick={createProject} disabled={loading || !form.name.trim()}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
                  {loading ? "جاري الإنشاء..." : "إنشاء المشروع"}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Project Card ───────────────────────────────────────────────────────────
function ProjectCard({ project, onClick }: { project: any; onClick: () => void }) {
  const isActive = ["building", "deploying"].includes(project.status);
  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="group cursor-pointer bg-black/[0.025] dark:bg-white/[0.025] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] border border-black/[0.07] dark:border-white/[0.07] hover:border-black/[0.14] dark:hover:border-white/[0.14] rounded-2xl p-5 transition-all">
      <div className="flex items-start gap-3.5">
        {project.logoUrl ? (
          <img src={project.logoUrl} alt={project.name}
            className="w-10 h-10 rounded-xl object-cover shrink-0 ring-1 ring-black/10 dark:ring-white/10" />
        ) : (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 font-bold"
            style={{ backgroundColor: (project.avatarColor || "#6366f1") + "22", color: project.avatarColor || "#6366f1" }}>
            {FRAMEWORK_ICONS[project.framework] || "🌐"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{project.name}</h3>
            {isActive && <Loader2 size={11} className="text-blue-400 animate-spin shrink-0" />}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-white/35 truncate mb-2.5">{project.description || `${project.githubOwner}/${project.githubRepo}`}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[project.status] || STATUS_COLORS.idle}`}>
              {STATUS_LABELS[project.status] || project.status}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-white/25 flex items-center gap-1">
              <GitBranch size={8} />{project.githubBranch}
            </span>
            {project.serviceType && (
              <span className="text-[10px] text-gray-400 dark:text-white/25">{SERVICE_TYPES.find(s => s.id === project.serviceType)?.title || project.serviceType}</span>
            )}
            {project.documentation && (
              <span className="text-[10px] text-violet-400 flex items-center gap-0.5"><BookOpen size={8} /> موثّق</span>
            )}
          </div>
        </div>
        <ChevronLeft size={15} className="text-gray-400 dark:text-white/20 group-hover:text-gray-600 dark:group-hover:text-white/50 transition-colors shrink-0 mt-1" />
      </div>
      {project.domain && project.status === "live" && (
        <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/[0.05] flex items-center gap-2">
          <Globe size={10} className="text-emerald-400 shrink-0" />
          <a href={`https://${project.domain}`} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-mono truncate transition-colors flex-1">
            {project.domain}
          </a>
          <ExternalLink size={9} className="text-emerald-400/50 shrink-0" />
        </div>
      )}
      <div className="mt-2.5 flex items-center gap-3 text-[10px] text-gray-400 dark:text-white/20">
        <span className="flex items-center gap-1"><Rocket size={8} />{project.deployCount || 0} نشر</span>
        <span>آخر نشر: {timeAgo(project.lastDeployAt)}</span>
      </div>
    </motion.div>
  );
}

// ── Docs Tab ───────────────────────────────────────────────────────────────
function DocsTab({ project }: { project: any }) {
  const [generating, setGenerating] = useState(false);
  const [docs, setDocs] = useState<string>(project.documentation || "");
  const { toast } = useToast();
  const qc = useQueryClient();

  const generateDocs = async () => {
    setGenerating(true);
    try {
      const r = await apiRequest("POST", `/api/deploy/projects/${project.id || project._id}/generate-docs`, {});
      const data = await r.json();
      if (data.documentation) {
        setDocs(data.documentation);
        qc.invalidateQueries({ queryKey: ["/api/deploy/projects"] });
        toast({ title: "✅ تم توليد التوثيق", description: "جاهز للمراجعة" });
      } else {
        throw new Error(data.message || "فشل التوليد");
      }
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message || "تعذر توليد التوثيق", variant: "destructive" });
    }
    setGenerating(false);
  };

  const copyDocs = () => {
    navigator.clipboard.writeText(docs);
    toast({ title: "تم النسخ" });
  };

  if (!docs) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="p-5 rounded-2xl bg-violet-500/10 border border-violet-500/20">
          <BookOpen size={32} className="text-violet-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">لا يوجد توثيق بعد</p>
          <p className="text-xs text-gray-400 dark:text-white/40">الذكاء الاصطناعي سيولّد توثيقاً احترافياً لمشروعك بنقرة واحدة</p>
        </div>
        <button onClick={generateDocs} disabled={generating}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-violet-500/20">
          {generating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          {generating ? "جاري توليد التوثيق..." : "توليد التوثيق بـ AI"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BookOpen size={14} className="text-violet-400" /> توثيق المشروع
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={copyDocs}
            className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] px-3 py-1.5 rounded-lg transition-all">
            <Copy size={11} /> نسخ
          </button>
          <button onClick={generateDocs} disabled={generating}
            className="flex items-center gap-1.5 text-xs text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50">
            {generating ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
            {generating ? "جاري التوليد..." : "تجديد"}
          </button>
        </div>
      </div>
      <div className="bg-black/[0.025] dark:bg-white/[0.025] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5 max-h-[520px] overflow-y-auto">
        <pre className="text-xs text-gray-700 dark:text-white/75 whitespace-pre-wrap leading-relaxed font-sans">{docs}</pre>
      </div>
    </div>
  );
}

// ── Project Detail ─────────────────────────────────────────────────────────
function ProjectDetail({ project, onBack }: { project: any; onBack: () => void }) {
  const [activeRun, setActiveRun] = useState<any>(null);
  const [showAI, setShowAI] = useState(false);
  const [activeTab, setActiveTab] = useState<"logs" | "docs" | "settings">("logs");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: runs = [], refetch: refetchRuns } = useQuery<any[]>({
    queryKey: ["/api/deploy/projects", project.id || project._id, "runs"],
    queryFn: async () => {
      const r = await fetch(`/api/deploy/projects/${project.id || project._id}/runs`);
      return r.json();
    },
    refetchInterval: activeRun && ["queued","building","deploying"].includes(activeRun?.status) ? 1500 : 5000,
  });

  useEffect(() => {
    if (runs.length > 0) setActiveRun(runs[0]);
  }, [runs]);

  const { data: liveRun } = useQuery<any>({
    queryKey: ["/api/deploy/runs", activeRun?.id || activeRun?._id],
    queryFn: async () => {
      const r = await fetch(`/api/deploy/runs/${activeRun?.id || activeRun?._id}`);
      return r.json();
    },
    enabled: !!activeRun && ["queued","building","deploying"].includes(activeRun?.status),
    refetchInterval: 1200,
  });

  const { data: freshProject } = useQuery<any>({
    queryKey: ["/api/deploy/projects", project.id || project._id],
    queryFn: async () => {
      const r = await fetch(`/api/deploy/projects/${project.id || project._id}`);
      return r.json();
    },
    refetchInterval: 5000,
  });

  const currentProject = freshProject || project;
  const displayRun = liveRun || activeRun;
  const isDeploying = displayRun && ["queued","building","deploying"].includes(displayRun.status);

  const deployMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/deploy/projects/${project.id || project._id}/deploy`, {}),
    onSuccess: () => {
      toast({ title: "🚀 النشر بدأ!", description: "جاري بناء المشروع..." });
      qc.invalidateQueries({ queryKey: ["/api/deploy/projects"] });
      refetchRuns();
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const cancelMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/deploy/runs/${displayRun?.id || displayRun?._id}/cancel`, {}),
    onSuccess: () => { toast({ title: "تم الإلغاء" }); refetchRuns(); qc.invalidateQueries({ queryKey: ["/api/deploy/projects"] }); },
    onError: (e: any) => toast({ title: "فشل الإلغاء", description: e?.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-white/40 hover:text-gray-900 dark:hover:text-white transition-colors px-2.5 py-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05]">
          <ChevronRight size={15} /> المشاريع
        </button>
        <span className="text-gray-400 dark:text-white/20">/</span>
        <span className="text-sm text-gray-900 dark:text-white font-semibold">{currentProject.name}</span>
      </div>

      <div className="bg-black/[0.025] dark:bg-white/[0.025] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-5">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ backgroundColor: (currentProject.avatarColor || "#6366f1") + "22", color: currentProject.avatarColor || "#6366f1" }}>
            {FRAMEWORK_ICONS[currentProject.framework] || "🌐"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-lg font-black text-gray-900 dark:text-white">{currentProject.name}</h2>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[currentProject.status] || STATUS_COLORS.idle}`}>
                {isDeploying && <Loader2 size={10} className="inline mr-1 animate-spin" />}
                {STATUS_LABELS[currentProject.status] || currentProject.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-white/35">
              <span className="flex items-center gap-1"><Github size={10} />{currentProject.githubOwner}/{currentProject.githubRepo}</span>
              <span className="flex items-center gap-1"><GitBranch size={10} />{currentProject.githubBranch}</span>
              <span className="flex items-center gap-1"><Package size={10} />Node {currentProject.nodeVersion}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a href={`https://github.com/${currentProject.githubOwner}/${currentProject.githubRepo}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/40 hover:text-gray-900 dark:hover:text-white bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] border border-black/[0.07] dark:border-white/[0.07] px-3 py-2 rounded-xl transition-all">
              <Github size={12} /> GitHub
            </a>
            {currentProject.status === "live" && currentProject.domain && (
              <a href={`https://${currentProject.domain}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 px-3 py-2 rounded-xl transition-all">
                <ExternalLink size={12} /> فتح الموقع
              </a>
            )}
            {isDeploying ? (
              <button onClick={() => cancelMutation.mutate()}
                className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 px-3 py-2 rounded-xl transition-all">
                <Square size={12} /> إلغاء
              </button>
            ) : (
              <button onClick={() => deployMutation.mutate()} disabled={deployMutation.isPending}
                className="flex items-center gap-1.5 text-xs text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-3 py-2 rounded-xl transition-all font-semibold">
                {deployMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Rocket size={12} />}
                نشر الآن
              </button>
            )}
          </div>
        </div>
        {currentProject.domain && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
            <Globe size={12} className="text-violet-400 shrink-0" />
            <span className="text-sm text-violet-300 font-mono flex-1">{currentProject.domain}</span>
            <button onClick={() => { navigator.clipboard.writeText(`https://${currentProject.domain}`); }}
              className="text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white/70 transition-colors"><Copy size={11} /></button>
          </div>
        )}
      </div>

      <div className="flex gap-1 bg-black/[0.025] dark:bg-white/[0.025] p-1 rounded-xl border border-black/[0.07] dark:border-white/[0.07] w-fit flex-wrap">
        {([
          ["logs","سجل النشر",Terminal],
          ["docs","التوثيق",BookOpen],
          ["settings","الإعدادات",Settings2]
        ] as const).map(([t, label, Icon]) => (
          <button key={t} onClick={() => setActiveTab(t as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === t ? "bg-violet-600 text-white" : "text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/70"
            }`}>
            <Icon size={12} />{label}
            {t === "docs" && currentProject.documentation && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />}
          </button>
        ))}
      </div>

      {activeTab === "docs" && <DocsTab project={currentProject} />}
      {activeTab === "logs" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            {runs.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {runs.slice(0, 8).map((run: any) => (
                  <button key={run.id || run._id}
                    onClick={() => setActiveRun(run)}
                    className={`flex items-center gap-1.5 shrink-0 text-[11px] px-3 py-1.5 rounded-xl border transition-all ${
                      (activeRun?.id || activeRun?._id) === (run.id || run._id)
                        ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                        : "bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.07] dark:border-white/[0.07] text-gray-400 dark:text-white/35 hover:border-black/15 dark:hover:border-white/20"
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      run.status === "success" ? "bg-emerald-400" :
                      run.status === "failed" ? "bg-red-400" :
                      ["building","deploying","queued"].includes(run.status) ? "bg-blue-400 animate-pulse" : "bg-black/10 dark:bg-white/20"
                    }`} />
                    #{runs.indexOf(run) + 1} · {run.branch} · {timeAgo(run.createdAt)}
                  </button>
                ))}
              </div>
            )}
            {displayRun && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "الحالة", value: STATUS_LABELS[displayRun.status] || displayRun.status },
                  { label: "المدة", value: formatDuration(displayRun.buildDuration) },
                  { label: "الفرع", value: displayRun.branch },
                ].map(item => (
                  <div key={item.label} className="bg-black/[0.025] dark:bg-white/[0.025] border border-black/[0.07] dark:border-white/[0.07] rounded-xl p-3 text-center">
                    <p className="text-[11px] text-gray-400 dark:text-white/30 mb-1">{item.label}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            )}
            {displayRun?.commitMsg && (
              <div className="flex items-center gap-2 px-3 py-2 bg-black/[0.025] dark:bg-white/[0.025] border border-black/[0.07] dark:border-white/[0.07] rounded-xl text-xs text-gray-400 dark:text-white/40">
                <GitCommit size={10} />
                <span className="font-mono">{displayRun.commitSha?.slice(0,7)}</span>
                <span>—</span>
                <span className="truncate">{displayRun.commitMsg}</span>
              </div>
            )}
            <Terminal_
              logs={displayRun?.logs || []}
              status={displayRun?.status || "idle"}
              isActive={!!isDeploying}
            />
          </div>
          <div className="h-[480px]">
            {showAI ? (
              <AIAssistant run={displayRun} project={currentProject} onClose={() => setShowAI(false)} />
            ) : (
              <button onClick={() => setShowAI(true)}
                className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/20 hover:border-violet-500/40 rounded-xl transition-all group">
                <div className="p-4 rounded-2xl bg-violet-500/15 group-hover:bg-violet-500/25 transition-all">
                  <BrainCircuit size={26} className="text-violet-400" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900 dark:text-white text-sm">Qirox AI</p>
                  <p className="text-xs text-gray-400 dark:text-white/35">محلل أخطاء النشر</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full">
                  <Sparkles size={10} /> تحليل ذكي للأخطاء
                </div>
              </button>
            )}
          </div>
        </div>
      )}
      {activeTab === "settings" && <ProjectSettings project={currentProject} />}
    </div>
  );
}

// ── Project Settings ───────────────────────────────────────────────────────
function ProjectSettings({ project }: { project: any }) {
  const [form, setForm] = useState({
    buildCommand: project.buildCommand || "npm run build",
    startCommand: project.startCommand || "npm start",
    outputDir: project.outputDir || "dist",
    nodeVersion: project.nodeVersion || "20",
    autoDeploy: project.autoDeploy !== false,
    description: project.description || "",
    logoUrl: project.logoUrl || "",
  });
  const [envKey, setEnvKey] = useState("");
  const [envVal, setEnvVal] = useState("");
  const [envSecret, setEnvSecret] = useState(false);
  const [envVars, setEnvVars] = useState<any[]>(project.envVars || []);
  const [showSecrets, setShowSecrets] = useState<Record<number, boolean>>({});
  const { toast } = useToast();
  const qc = useQueryClient();

  const saveSettings = async () => {
    try {
      await apiRequest("PUT", `/api/deploy/projects/${project.id || project._id}`, { ...form, envVars });
      qc.invalidateQueries({ queryKey: ["/api/deploy/projects"] });
      toast({ title: "تم الحفظ", description: "تم تحديث إعدادات المشروع" });
    } catch { toast({ title: "خطأ", variant: "destructive" }); }
  };

  const addEnv = () => {
    if (!envKey.trim()) return;
    setEnvVars(v => [...v, { key: envKey.trim(), value: envVal, isSecret: envSecret }]);
    setEnvKey(""); setEnvVal(""); setEnvSecret(false);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Logo & Description */}
      <div className="bg-black/[0.025] dark:bg-white/[0.025] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><ImageIcon size={13} />هوية المشروع</h3>
        <div className="flex gap-4 items-start">
          <div className="shrink-0">
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="Logo"
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-violet-500/30" />
            ) : (
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-black"
                style={{ backgroundColor: (project.avatarColor || "#6366f1") + "22", color: project.avatarColor || "#6366f1" }}>
                {(project.name || "Q").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <label className="text-[11px] text-gray-400 dark:text-white/40 mb-1 block">رابط اللوجو (URL)</label>
              <input value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
                placeholder="https://example.com/logo.png"
                className="w-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-violet-500/50 transition-colors placeholder:text-black/20 dark:placeholder:text-white/20" />
              <p className="text-[10px] text-gray-400 dark:text-white/25 mt-1">ضع رابط صورة اللوجو ليظهر في البطاقة وصفحة النشر</p>
            </div>
            <div>
              <label className="text-[11px] text-gray-400 dark:text-white/40 mb-1 block">وصف المشروع</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="وصف قصير للمشروع..."
                className="w-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-violet-500/50 transition-colors placeholder:text-black/20 dark:placeholder:text-white/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Build Settings */}
      <div className="bg-black/[0.025] dark:bg-white/[0.025] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Settings2 size={13} />إعدادات البناء</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "أمر البناء", key: "buildCommand" },
            { label: "أمر التشغيل", key: "startCommand" },
            { label: "مجلد الإخراج", key: "outputDir" },
            { label: "إصدار Node.js", key: "nodeVersion" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="text-[11px] text-gray-400 dark:text-white/40 mb-1 block">{label}</label>
              <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white font-mono outline-none focus:border-violet-500/50 transition-colors" />
            </div>
          ))}
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => setForm(f => ({ ...f, autoDeploy: !f.autoDeploy }))}
            className={`w-9 h-5 rounded-full transition-all ${form.autoDeploy ? "bg-violet-600" : "bg-black/5 dark:bg-white/10"} relative`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.autoDeploy ? "right-0.5" : "left-0.5"}`} />
          </div>
          <span className="text-sm text-gray-500 dark:text-white/60">نشر تلقائي عند push</span>
        </label>
      </div>

      <div className="bg-black/[0.025] dark:bg-white/[0.025] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Lock size={13} />متغيرات البيئة</h3>
        <div className="flex gap-2">
          <input value={envKey} onChange={e => setEnvKey(e.target.value)} placeholder="KEY"
            className="flex-1 bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white font-mono outline-none focus:border-violet-500/50" />
          <input value={envVal} onChange={e => setEnvVal(e.target.value)} placeholder="VALUE"
            type={envSecret ? "password" : "text"}
            className="flex-1 bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white font-mono outline-none focus:border-violet-500/50" />
          <button onClick={() => setEnvSecret(s => !s)}
            className={`p-2 rounded-xl border transition-all ${envSecret ? "border-amber-500/40 bg-amber-500/10 text-amber-400" : "border-black/[0.08] dark:border-white/[0.08] bg-black/[0.04] dark:bg-white/[0.04] text-gray-400 dark:text-white/40"}`}>
            {envSecret ? <Lock size={13} /> : <Unlock size={13} />}
          </button>
          <button onClick={addEnv} className="px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm transition-colors">
            <Plus size={13} />
          </button>
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {envVars.map((ev, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.07] dark:border-white/[0.07] rounded-xl">
              <span className="text-xs text-violet-300 font-mono flex-1">{ev.key}</span>
              <span className="text-xs text-gray-400 dark:text-white/35 font-mono flex-1 truncate">
                {ev.isSecret && !showSecrets[i] ? "••••••••" : ev.value}
              </span>
              {ev.isSecret && (
                <button onClick={() => setShowSecrets(s => ({ ...s, [i]: !s[i] }))} className="text-gray-400 dark:text-white/25 hover:text-gray-700 dark:hover:text-white/70">
                  {showSecrets[i] ? <EyeOff size={11} /> : <Eye size={11} />}
                </button>
              )}
              {ev.isSecret && <Lock size={10} className="text-amber-400" />}
              <button onClick={() => setEnvVars(v => v.filter((_, j) => j !== i))} className="text-red-400/40 hover:text-red-400 transition-colors">
                <X size={11} />
              </button>
            </div>
          ))}
          {envVars.length === 0 && <p className="text-[11px] text-gray-400 dark:text-white/25 text-center py-4">لا توجد متغيرات بيئة</p>}
        </div>
      </div>

      <button onClick={saveSettings}
        className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
        <CheckCheck size={13} /> حفظ الإعدادات
      </button>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function DeploymentCloud() {
  const [, setLocation] = useLocation();
  const [matchDetail, params] = useRoute("/employee/deployment-cloud/:id");
  const [showCreate, setShowCreate] = useState(false);
  const [createInitialStep, setCreateInitialStep] = useState<string>("service");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: projects = [], isLoading: loadingProjects, refetch } = useQuery<any[]>({
    queryKey: ["/api/deploy/projects"],
    queryFn: async () => {
      const r = await fetch("/api/deploy/projects");
      return r.json();
    },
    refetchInterval: 8000,
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/deploy/stats"],
    queryFn: async () => {
      const r = await fetch("/api/deploy/stats");
      return r.json();
    },
    refetchInterval: 10000,
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthParam = urlParams.get("oauth");
    if (oauthParam === "success") {
      sessionStorage.removeItem("deploy_service_type");
      sessionStorage.removeItem("deploy_reopen_modal");
      setCreateInitialStep("repo");
      setShowCreate(true);
      window.history.replaceState({}, "", "/employee/deployment-cloud");
    } else if (oauthParam === "no_config") {
      toast({
        title: "GitHub OAuth غير مفعّل",
        description: "أضف GITHUB_CLIENT_ID و GITHUB_CLIENT_SECRET في إعدادات البيئة، أو استخدم Personal Access Token",
        variant: "destructive",
      });
      sessionStorage.removeItem("deploy_service_type");
      sessionStorage.removeItem("deploy_reopen_modal");
      setCreateInitialStep("github");
      setShowCreate(true);
      window.history.replaceState({}, "", "/employee/deployment-cloud");
    } else if (oauthParam === "error") {
      toast({
        title: "فشل ربط GitHub",
        description: "تعذر الاتصال بـ GitHub. حاول مجدداً أو استخدم Personal Access Token",
        variant: "destructive",
      });
      setCreateInitialStep("github");
      setShowCreate(true);
      window.history.replaceState({}, "", "/employee/deployment-cloud");
    }
  }, []);

  useEffect(() => {
    if (matchDetail && params?.id && projects.length > 0) {
      const found = projects.find((p: any) => (p._id || p.id) === params.id);
      if (found) setSelectedProject(found);
    }
  }, [matchDetail, params?.id, projects]);

  const handleProjectClick = (p: any) => {
    setSelectedProject(p);
    setLocation(`/employee/deployment-cloud/${p._id || p.id}`);
  };

  const handleBack = () => {
    setSelectedProject(null);
    setLocation("/employee/deployment-cloud");
  };

  const filtered = projects.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.githubRepo?.toLowerCase().includes(search.toLowerCase())
  );

  const showDetail = matchDetail && params?.id && selectedProject;

  return (
    <CloudLayout onNewProject={showDetail ? undefined : () => setShowCreate(true)}>
      <AnimatePresence mode="wait">
        {showDetail ? (
          <motion.div key="detail" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <ProjectDetail project={selectedProject} onBack={handleBack} />
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">نشر المشاريع السحابي</h1>
              <p className="text-sm text-gray-400 dark:text-white/40">ربط GitHub · بناء ونشر تلقائي · ذكاء اصطناعي لحل الأخطاء</p>
            </div>

            <StatsBar stats={stats} />

            <div className="flex items-center gap-3 mb-5">
              <div className="relative flex-1">
                <Terminal size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/25" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="بحث عن مشروع..."
                  className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] rounded-xl pr-9 pl-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-black/30 dark:placeholder:text-white/25 outline-none focus:border-violet-500/40 transition-colors"
                />
              </div>
              <button onClick={() => refetch()} className="p-2.5 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] hover:border-black/15 dark:hover:border-white/20 rounded-xl text-gray-400 dark:text-white/35 hover:text-gray-700 dark:hover:text-white/70 transition-all">
                <RefreshCw size={14} />
              </button>
            </div>

            {loadingProjects ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 size={28} className="text-violet-400 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24">
                <div className="inline-flex p-6 rounded-2xl bg-black/[0.025] dark:bg-white/[0.025] border border-black/[0.07] dark:border-white/[0.07] mb-5">
                  <Cloud size={36} className="text-gray-400 dark:text-white/20" />
                </div>
                <h3 className="text-lg font-bold text-gray-500 dark:text-white/50 mb-2">لا توجد مشاريع</h3>
                <p className="text-sm text-gray-400 dark:text-white/25 mb-6">أنشئ مشروعك الأول وانشره في ثوانٍ</p>
                <button onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all">
                  <Plus size={14} /> مشروع جديد
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filtered.map(p => (
                    <ProjectCard key={p.id || p._id} project={p} onClick={() => handleProjectClick(p)} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {showCreate && (
        <CreateProjectModal
          initialStep={createInitialStep}
          onClose={() => setShowCreate(false)}
          onCreated={() => refetch()}
        />
      )}
    </CloudLayout>
  );
}
