import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import EmployeeLayout from "@/components/EmployeeLayout";
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
} from "lucide-react";

const BASE_DOMAIN = "deployment.qiroxstudio.online";

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
  idle:      "bg-white/5 text-white/40 border-white/10",
  suspended: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  queued:    "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  success:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-white/5 text-white/40 border-white/10",
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

// ── Stats Bar ──────────────────────────────────────────────────────────────
function StatsBar({ stats }: { stats: any }) {
  const cards = [
    { label: "إجمالي المشاريع", value: stats?.totalProjects ?? 0, icon: Boxes, color: "text-violet-400" },
    { label: "مشاريع مباشرة", value: stats?.liveProjects ?? 0, icon: CheckCircle2, color: "text-emerald-400" },
    { label: "فشل النشر", value: stats?.failedProjects ?? 0, icon: AlertTriangle, color: "text-red-400" },
    { label: "إجمالي النشرات", value: stats?.totalRuns ?? 0, icon: Rocket, color: "text-blue-400" },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map((c) => (
        <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] border border-white/8 rounded-xl p-4 flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-white/5 ${c.color}`}><c.icon size={18} /></div>
          <div>
            <p className="text-2xl font-black text-white">{c.value}</p>
            <p className="text-[11px] text-white/40">{c.label}</p>
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
    <motion.div initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.5) }}
      className={`flex gap-2 font-mono text-[12px] leading-relaxed ${color}`}>
      <span className="shrink-0 opacity-50 select-none">{prefix}</span>
      <span className="break-all">{log.message}</span>
    </motion.div>
  );
}

// ── Terminal ───────────────────────────────────────────────────────────────
function Terminal_({ logs, status, isActive }: { logs: any[]; status: string; isActive: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);

  return (
    <div className="bg-[#0d0d0d] border border-white/8 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8 bg-white/[0.02]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-amber-500/60" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
        </div>
        <span className="text-white/30 text-xs font-mono ml-2">deploy.log</span>
        {isActive && (
          <div className="ml-auto flex items-center gap-1.5 text-[11px] text-blue-400">
            <Loader2 size={10} className="animate-spin" /><span>مباشر</span>
          </div>
        )}
      </div>
      <div ref={ref} className="p-4 h-72 overflow-y-auto space-y-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {logs.length === 0 && (
          <p className="text-white/20 text-[12px] font-mono">في انتظار بدء النشر...</p>
        )}
        {logs.map((log, i) => <LogLine key={i} log={log} index={i} />)}
        {isActive && (
          <div className="flex gap-2 font-mono text-[12px] text-white/30 mt-1">
            <span className="animate-pulse">█</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AI Assistant ───────────────────────────────────────────────────────────
function AIAssistant({ run, project, onClose }: { run: any; project: any; onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const hasError = run?.status === "failed" || run?.logs?.some((l: any) => l.level === "error");

  const analyzeAuto = useCallback(async () => {
    if (!hasError || !run) return;
    setLoading(true);
    try {
      const r = await apiRequest("POST", "/api/deploy/ai/analyze", {
        logs: run.logs,
        framework: project?.framework,
        buildCommand: project?.buildCommand,
        runId: run.id || run._id,
      });
      const data = await r.json();
      setMessages([{ role: "ai", text: data.suggestion }]);
    } catch { toast({ title: "خطأ", description: "تعذر الاتصال بالذكاء الاصطناعي", variant: "destructive" }); }
    setLoading(false);
  }, [run, project]);

  useEffect(() => { if (messages.length === 0 && hasError) analyzeAuto(); }, [hasError]);

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
        runId: run?.id || run?._id,
      });
      const data = await r.json();
      setMessages(m => [...m, { role: "ai", text: data.suggestion }]);
    } catch { toast({ title: "خطأ", description: "تعذر الاتصال بالذكاء الاصطناعي", variant: "destructive" }); }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border border-white/8 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 bg-gradient-to-r from-violet-500/10 to-blue-500/10">
        <div className="p-1.5 rounded-lg bg-violet-500/20"><Bot size={16} className="text-violet-400" /></div>
        <div>
          <p className="text-sm font-bold text-white">Qirox AI — محلل النشر</p>
          <p className="text-[10px] text-white/40">يحلل الأخطاء ويقترح الحلول</p>
        </div>
        <button onClick={onClose} className="ml-auto text-white/30 hover:text-white/70 transition-colors"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && messages.length === 0 && (
          <div className="flex items-center gap-2 text-violet-400 text-sm">
            <Loader2 size={14} className="animate-spin" />
            <span>يحلل سجلات النشر...</span>
          </div>
        )}
        {!loading && messages.length === 0 && !hasError && (
          <div className="text-center text-white/30 text-sm py-8">
            <Bot size={32} className="mx-auto mb-2 opacity-30" />
            <p>اسألني عن أي مشكلة في النشر</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-violet-600 text-white"
                : "bg-white/[0.05] border border-white/8 text-white/80"
            }`}>
              {m.role === "ai" && <Bot size={12} className="text-violet-400 mb-1" />}
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
      <div className="p-3 border-t border-white/8 flex gap-2">
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="اسأل عن المشكلة..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-500/50 transition-colors"
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}
          className="p-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 rounded-lg text-white transition-colors">
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Create Project Modal ───────────────────────────────────────────────────
function CreateProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState<"token" | "repo" | "config">("token");
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
      if (uData.login) { setGhUser(uData); setRepos(rData); setStep("repo"); }
      else throw new Error("Invalid token");
    } catch { toast({ title: "خطأ", description: "تعذر الاتصال بـ GitHub. تأكد من صحة التوكن", variant: "destructive" }); }
    setLoading(false);
  };

  const selectRepo = async (repo: any) => {
    setSelectedRepo(repo);
    setForm(f => ({ ...f, name: repo.name, githubBranch: repo.default_branch }));
    setLoading(true);
    try {
      const r = await apiRequest("POST", "/api/deploy/github/branches", {
        token, owner: repo.full_name.split("/")[0], repo: repo.name,
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
        ...form,
        githubOwner: owner,
        githubRepo: repoName,
        githubToken: token,
      });
      qc.invalidateQueries({ queryKey: ["/api/deploy/projects"] });
      qc.invalidateQueries({ queryKey: ["/api/deploy/stats"] });
      toast({ title: "تم الإنشاء!", description: `مشروع "${form.name}" جاهز للنشر` });
      onCreated();
      onClose();
    } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  const filteredRepos = repos.filter(r =>
    r.full_name.toLowerCase().includes(repoSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/15 rounded-xl"><Rocket size={18} className="text-violet-400" /></div>
            <div>
              <h2 className="text-base font-bold text-white">مشروع جديد</h2>
              <p className="text-xs text-white/40">ربط مستودع GitHub ونشره</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors"><X size={18} /></button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-0 px-6 py-3 border-b border-white/8 bg-white/[0.02]">
          {[["token","GitHub Token"],["repo","اختيار المستودع"],["config","الإعدادات"]].map(([s, label], i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg transition-all ${
                step === s ? "bg-violet-500/20 text-violet-400" :
                ["token","repo","config"].indexOf(step) > i ? "text-emerald-400" : "text-white/30"
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step === s ? "bg-violet-500 text-white" :
                  ["token","repo","config"].indexOf(step) > i ? "bg-emerald-500 text-white" : "bg-white/10 text-white/40"
                }`}>{["token","repo","config"].indexOf(step) > i ? "✓" : i+1}</span>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < 2 && <ChevronRight size={12} className="text-white/20 mx-1" />}
            </div>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {/* Step 1: Token */}
          {step === "token" && (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300 flex gap-3">
                <Info size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Personal Access Token مطلوب</p>
                  <p className="text-xs text-blue-300/70">انتقل إلى GitHub → Settings → Developer Settings → Personal Access Tokens → Generate new token. اختر صلاحيات: <code className="bg-blue-500/20 px-1 rounded">repo</code></p>
                </div>
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">GitHub Personal Access Token</label>
                <input
                  type="password" value={token} onChange={e => setToken(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && connectGitHub()}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-white/20 outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>
              <button onClick={connectGitHub} disabled={loading || !token.trim()}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Github size={16} />}
                {loading ? "جاري الاتصال..." : "ربط GitHub"}
              </button>
            </div>
          )}

          {/* Step 2: Repo */}
          {step === "repo" && (
            <div className="space-y-3">
              {ghUser && (
                <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <img src={ghUser.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                  <div>
                    <p className="text-sm font-semibold text-white">{ghUser.name || ghUser.login}</p>
                    <p className="text-xs text-emerald-400">@{ghUser.login} — متصل</p>
                  </div>
                  <CheckCircle2 size={16} className="ml-auto text-emerald-400" />
                </div>
              )}
              <input
                value={repoSearch} onChange={e => setRepoSearch(e.target.value)}
                placeholder="ابحث عن مستودع..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-500/50 transition-colors"
              />
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredRepos.map(repo => (
                  <button key={repo.id} onClick={() => selectRepo(repo)}
                    className="w-full flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-violet-500/10 border border-white/8 hover:border-violet-500/30 rounded-xl transition-all text-left">
                    <FolderGit2 size={16} className="text-white/40 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{repo.name}</p>
                      <p className="text-xs text-white/30 truncate">{repo.description || repo.full_name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {repo.private && <Lock size={11} className="text-amber-400" />}
                      {repo.language && <span className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded">{repo.language}</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Config */}
          {step === "config" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">اسم المشروع</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">الفرع</label>
                  <select value={form.githubBranch} onChange={e => setForm(f => ({ ...f, githubBranch: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition-colors">
                    {branches.length ? branches.map(b => <option key={b} value={b}>{b}</option>) : <option value="main">main</option>}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">أمر البناء</label>
                <input value={form.buildCommand} onChange={e => setForm(f => ({ ...f, buildCommand: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-mono outline-none focus:border-violet-500/50 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">مجلد الإخراج</label>
                  <input value={form.outputDir} onChange={e => setForm(f => ({ ...f, outputDir: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-mono outline-none focus:border-violet-500/50 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Node.js</label>
                  <select value={form.nodeVersion} onChange={e => setForm(f => ({ ...f, nodeVersion: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition-colors">
                    {["18","20","21","22"].map(v => <option key={v} value={v}>Node {v}</option>)}
                  </select>
                </div>
              </div>
              <div className="p-3 bg-white/[0.03] border border-white/8 rounded-xl">
                <p className="text-xs text-white/40 mb-1">النطاق المخصص</p>
                <p className="text-sm text-violet-400 font-mono">
                  {form.name ? `${form.name.toLowerCase().replace(/[^a-z0-9]/g,"-")}` : "your-project"}.{BASE_DOMAIN}
                </p>
              </div>
              <button onClick={createProject} disabled={loading || !form.name.trim()}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
                {loading ? "جاري الإنشاء..." : "إنشاء المشروع"}
              </button>
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
      className="group cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] border border-white/8 hover:border-white/15 rounded-2xl p-5 transition-all">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 font-bold"
          style={{ backgroundColor: project.avatarColor + "25", color: project.avatarColor }}>
          {FRAMEWORK_ICONS[project.framework] || "🌐"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-white truncate">{project.name}</h3>
            {isActive && <Loader2 size={12} className="text-blue-400 animate-spin shrink-0" />}
          </div>
          <p className="text-xs text-white/40 truncate mb-2">{project.description || `${project.githubOwner}/${project.githubRepo}`}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[project.status] || STATUS_COLORS.idle}`}>
              {STATUS_LABELS[project.status] || project.status}
            </span>
            <span className="text-[10px] text-white/30 flex items-center gap-1">
              <GitBranch size={9} />{project.githubBranch}
            </span>
            {project.framework && project.framework !== "auto" && (
              <span className="text-[10px] text-white/30">{project.framework}</span>
            )}
          </div>
        </div>
        <ChevronRight size={16} className="text-white/20 group-hover:text-white/50 transition-colors shrink-0 mt-1" />
      </div>
      {project.domain && project.status === "live" && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
          <Globe size={11} className="text-emerald-400 shrink-0" />
          <a href={`https://${project.domain}`} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-mono truncate transition-colors">
            {project.domain}
          </a>
          <ExternalLink size={10} className="text-emerald-400/50 shrink-0" />
        </div>
      )}
      <div className="mt-2 flex items-center gap-3 text-[11px] text-white/25">
        <span className="flex items-center gap-1"><Rocket size={9} />{project.deployCount} نشر</span>
        <span>آخر نشر: {timeAgo(project.lastDeployAt)}</span>
      </div>
    </motion.div>
  );
}

// ── Project Detail Panel ───────────────────────────────────────────────────
function ProjectDetail({ project, onBack }: { project: any; onBack: () => void }) {
  const [activeRun, setActiveRun] = useState<any>(null);
  const [showAI, setShowAI] = useState(false);
  const [activeTab, setActiveTab] = useState<"logs" | "settings" | "env">("logs");
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
    if (runs.length > 0) {
      const latest = runs[0];
      setActiveRun(latest);
    }
  }, [runs]);

  // Poll active run
  const { data: liveRun } = useQuery<any>({
    queryKey: ["/api/deploy/runs", activeRun?.id || activeRun?._id],
    queryFn: async () => {
      const r = await fetch(`/api/deploy/runs/${activeRun?.id || activeRun?._id}`);
      return r.json();
    },
    enabled: !!activeRun && ["queued","building","deploying"].includes(activeRun?.status),
    refetchInterval: 1200,
  });

  const displayRun = liveRun || activeRun;
  const isDeploying = displayRun && ["queued","building","deploying"].includes(displayRun.status);

  const { data: freshProject } = useQuery<any>({
    queryKey: ["/api/deploy/projects", project.id || project._id],
    queryFn: async () => {
      const r = await fetch(`/api/deploy/projects/${project.id || project._id}`);
      return r.json();
    },
    refetchInterval: isDeploying ? 2000 : 10000,
  });

  const currentProject = freshProject || project;

  const deployMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/deploy/projects/${project.id || project._id}/deploy`, {}),
    onSuccess: async (res) => {
      const data = await res.json();
      toast({ title: "🚀 النشر بدأ!", description: "جاري بناء ونشر المشروع..." });
      qc.invalidateQueries({ queryKey: ["/api/deploy/projects"] });
      refetchRuns();
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const cancelMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/deploy/runs/${displayRun?.id || displayRun?._id}/cancel`, {}),
    onSuccess: () => {
      toast({ title: "تم الإلغاء" });
      refetchRuns();
      qc.invalidateQueries({ queryKey: ["/api/deploy/projects"] });
    },
  });

  const copyDomain = () => {
    if (currentProject.domain) {
      navigator.clipboard.writeText(`https://${currentProject.domain}`);
      toast({ title: "تم النسخ", description: currentProject.domain });
    }
  };

  return (
    <div className="space-y-4">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors">
          <ChevronRight size={16} className="rotate-180" /> المشاريع
        </button>
        <span className="text-white/20">/</span>
        <span className="text-sm text-white font-semibold">{currentProject.name}</span>
      </div>

      {/* Project Header */}
      <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-5">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ backgroundColor: currentProject.avatarColor + "25", color: currentProject.avatarColor }}>
            {FRAMEWORK_ICONS[currentProject.framework] || "🌐"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-lg font-black text-white">{currentProject.name}</h2>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[currentProject.status] || STATUS_COLORS.idle}`}>
                {isDeploying && <Loader2 size={10} className="inline mr-1 animate-spin" />}
                {STATUS_LABELS[currentProject.status] || currentProject.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/40">
              <span className="flex items-center gap-1"><Github size={11} />{currentProject.githubOwner}/{currentProject.githubRepo}</span>
              <span className="flex items-center gap-1"><GitBranch size={11} />{currentProject.githubBranch}</span>
              <span className="flex items-center gap-1"><Package size={11} />Node {currentProject.nodeVersion}</span>
              <span className="flex items-center gap-1"><Server size={11} />Region: {currentProject.region}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a href={`https://github.com/${currentProject.githubOwner}/${currentProject.githubRepo}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/8 px-3 py-2 rounded-xl transition-all">
              <Github size={13} /> GitHub
            </a>
            {currentProject.status === "live" && (
              <a href={`https://${currentProject.domain}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-2 rounded-xl transition-all">
                <ExternalLink size={13} /> فتح الموقع
              </a>
            )}
            {isDeploying ? (
              <button onClick={() => cancelMutation.mutate()}
                className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-2 rounded-xl transition-all">
                <Square size={13} /> إلغاء
              </button>
            ) : (
              <button onClick={() => deployMutation.mutate()} disabled={deployMutation.isPending}
                className="flex items-center gap-1.5 text-xs text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 px-3 py-2 rounded-xl transition-all font-semibold">
                {deployMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Rocket size={13} />}
                نشر الآن
              </button>
            )}
          </div>
        </div>
        {/* Domain */}
        {currentProject.domain && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-white/[0.02] border border-white/8 rounded-xl">
            <Globe size={13} className="text-violet-400 shrink-0" />
            <span className="text-sm text-violet-300 font-mono flex-1">{currentProject.domain}</span>
            <button onClick={copyDomain} className="text-white/30 hover:text-white/70 transition-colors"><Copy size={12} /></button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.02] p-1 rounded-xl border border-white/8 w-fit">
        {([["logs","سجل النشر",Terminal],["settings","الإعدادات",Settings2]] as const).map(([t, label, Icon]) => (
          <button key={t} onClick={() => setActiveTab(t as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === t ? "bg-violet-600 text-white" : "text-white/40 hover:text-white/70"
            }`}>
            <Icon size={12} />{label}
          </button>
        ))}
      </div>

      {/* Tab: Logs */}
      {activeTab === "logs" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            {/* Runs history */}
            {runs.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {runs.slice(0, 8).map((run: any) => (
                  <button key={run.id || run._id}
                    onClick={() => setActiveRun(run)}
                    className={`flex items-center gap-1.5 shrink-0 text-[11px] px-3 py-1.5 rounded-xl border transition-all ${
                      (activeRun?.id || activeRun?._id) === (run.id || run._id)
                        ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                        : "bg-white/[0.02] border-white/8 text-white/40 hover:border-white/20"
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      run.status === "success" ? "bg-emerald-400" :
                      run.status === "failed" ? "bg-red-400" :
                      ["building","deploying","queued"].includes(run.status) ? "bg-blue-400 animate-pulse" : "bg-white/20"
                    }`} />
                    #{runs.indexOf(run) + 1} · {run.branch} · {timeAgo(run.createdAt)}
                  </button>
                ))}
              </div>
            )}

            {/* Run info */}
            {displayRun && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "الحالة", value: STATUS_LABELS[displayRun.status] || displayRun.status },
                  { label: "المدة", value: formatDuration(displayRun.buildDuration) },
                  { label: "الفرع", value: displayRun.branch },
                ].map(item => (
                  <div key={item.label} className="bg-white/[0.02] border border-white/8 rounded-xl p-3 text-center">
                    <p className="text-xs text-white/30 mb-1">{item.label}</p>
                    <p className="text-sm font-bold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            )}
            {displayRun && displayRun.commitMsg && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] border border-white/8 rounded-xl text-xs text-white/50">
                <GitCommit size={11} />
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

          {/* AI Panel */}
          <div className="h-[480px]">
            {showAI ? (
              <AIAssistant run={displayRun} project={currentProject} onClose={() => setShowAI(false)} />
            ) : (
              <button onClick={() => setShowAI(true)}
                className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/20 hover:border-violet-500/40 rounded-xl transition-all group">
                <div className="p-4 rounded-2xl bg-violet-500/20 group-hover:bg-violet-500/30 transition-all">
                  <Bot size={28} className="text-violet-400" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-white text-sm">Qirox AI</p>
                  <p className="text-xs text-white/40">محلل أخطاء النشر</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-violet-400 bg-violet-500/15 px-3 py-1.5 rounded-full">
                  <Sparkles size={11} /> تحليل ذكي للأخطاء
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === "settings" && (
        <ProjectSettings project={currentProject} />
      )}
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

  const removeEnv = (i: number) => setEnvVars(v => v.filter((_, j) => j !== i));

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Settings2 size={14} />إعدادات البناء</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "أمر البناء", key: "buildCommand" },
            { label: "أمر التشغيل", key: "startCommand" },
            { label: "مجلد الإخراج", key: "outputDir" },
            { label: "إصدار Node.js", key: "nodeVersion" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="text-xs text-white/50 mb-1 block">{label}</label>
              <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-mono outline-none focus:border-violet-500/50 transition-colors" />
            </div>
          ))}
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => setForm(f => ({ ...f, autoDeploy: !f.autoDeploy }))}
            className={`w-10 h-5 rounded-full transition-all ${form.autoDeploy ? "bg-violet-600" : "bg-white/10"} flex items-center`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow transition-all ${form.autoDeploy ? "translate-x-5" : "translate-x-0.5"}`} />
          </div>
          <span className="text-sm text-white/70">نشر تلقائي عند push</span>
        </label>
      </div>

      <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Lock size={14} />متغيرات البيئة</h3>
        <div className="flex gap-2">
          <input value={envKey} onChange={e => setEnvKey(e.target.value)} placeholder="KEY"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none focus:border-violet-500/50" />
          <input value={envVal} onChange={e => setEnvVal(e.target.value)} placeholder="VALUE"
            type={envSecret ? "password" : "text"}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none focus:border-violet-500/50" />
          <button onClick={() => setEnvSecret(s => !s)}
            className={`p-2 rounded-xl border transition-all ${envSecret ? "border-amber-500/40 bg-amber-500/10 text-amber-400" : "border-white/10 bg-white/5 text-white/40"}`}>
            {envSecret ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
          <button onClick={addEnv} className="px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm transition-colors">
            <Plus size={14} />
          </button>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {envVars.map((ev, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 bg-white/[0.02] border border-white/8 rounded-xl">
              <span className="text-xs text-violet-300 font-mono flex-1">{ev.key}</span>
              <span className="text-xs text-white/40 font-mono flex-1 truncate">
                {ev.isSecret && !showSecrets[i] ? "••••••••" : ev.value}
              </span>
              {ev.isSecret && (
                <button onClick={() => setShowSecrets(s => ({ ...s, [i]: !s[i] }))}
                  className="text-white/30 hover:text-white/70">
                  {showSecrets[i] ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              )}
              {ev.isSecret && <Lock size={11} className="text-amber-400" />}
              <button onClick={() => removeEnv(i)} className="text-red-400/50 hover:text-red-400 transition-colors"><X size={12} /></button>
            </div>
          ))}
          {envVars.length === 0 && <p className="text-xs text-white/25 text-center py-4">لا توجد متغيرات بيئة</p>}
        </div>
      </div>

      <button onClick={saveSettings}
        className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
        <CheckCheck size={14} /> حفظ الإعدادات
      </button>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function DeploymentCloud() {
  const { lang } = useI18n();
  const { data: user } = useUser();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

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

  const filtered = projects.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.githubRepo?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <EmployeeLayout>
      <div className="min-h-screen bg-[#080808] text-white">
        {/* Hero Header */}
        <div className="relative overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-transparent to-blue-900/10 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-violet-600/5 blur-3xl pointer-events-none" />
          <div className="relative max-w-6xl mx-auto px-6 py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-xl bg-violet-500/20"><Cloud size={20} className="text-violet-400" /></div>
                  <span className="text-xs text-violet-400 font-semibold tracking-widest uppercase">Qirox Deployment Cloud</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">نشر المشاريع السحابي</h1>
                <p className="text-sm text-white/40">ربط GitHub، بناء ونشر تلقائي بذكاء اصطناعي لحل الأخطاء</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-[11px] text-white/30 bg-white/5 px-2 py-1 rounded-full flex items-center gap-1">
                    <Globe size={9} /> deployment.qiroxstudio.online
                  </span>
                  <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                    <Wifi size={9} /> الخوادم تعمل
                  </span>
                  <span className="text-[11px] text-violet-400 bg-violet-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                    <Bot size={9} /> Kimi AI مفعّل
                  </span>
                </div>
              </div>
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-violet-500/20">
                <Plus size={16} /> مشروع جديد
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-6">
          {selectedProject ? (
            <AnimatePresence mode="wait">
              <motion.div key={selectedProject.id || selectedProject._id}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <ProjectDetail
                  project={selectedProject}
                  onBack={() => setSelectedProject(null)}
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <StatsBar stats={stats} />
                {/* Search + Filter */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="relative flex-1">
                    <Terminal size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="بحث عن مشروع..."
                      className="w-full bg-white/[0.03] border border-white/8 rounded-xl pr-9 pl-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-500/40 transition-colors"
                    />
                  </div>
                  <button onClick={() => refetch()} className="p-2.5 bg-white/[0.03] border border-white/8 hover:border-white/20 rounded-xl text-white/40 hover:text-white/70 transition-all">
                    <RefreshCw size={15} />
                  </button>
                </div>

                {loadingProjects ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 size={28} className="text-violet-400 animate-spin" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="inline-flex p-6 rounded-2xl bg-white/[0.02] border border-white/8 mb-4">
                      <Cloud size={40} className="text-white/20" />
                    </div>
                    <h3 className="text-lg font-bold text-white/60 mb-2">لا توجد مشاريع</h3>
                    <p className="text-sm text-white/30 mb-6">أنشئ مشروعك الأول وانشره في ثوانٍ</p>
                    <button onClick={() => setShowCreate(true)}
                      className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all">
                      <Plus size={15} /> مشروع جديد
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {filtered.map(p => (
                        <ProjectCard key={p.id || p._id} project={p}
                          onClick={() => setSelectedProject(p)} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={() => refetch()} />
      )}
    </EmployeeLayout>
  );
}
