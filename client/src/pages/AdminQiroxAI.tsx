/**
 * AdminQiroxAI — QIROX AI Hub
 * Full AI management: Knowledge Base, Chat Test, API Keys, Settings, Usage
 */

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BrainCircuit, Database, Key, BarChart2, Settings, Send, Plus,
  Trash2, RefreshCw, Copy, Check, Bot, User, Loader2, FileText,
  Zap, Globe, Lock, Activity, MessageSquare, X, Eye, EyeOff,
  ChevronRight, TrendingUp, Cpu
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

// ── Types ─────────────────────────────────────────────────────────────────────
interface KnowledgeDoc {
  _id: string; title: string; content: string; category: string;
  tags: string[]; active: boolean; docLength: number; source: string;
  createdAt: string;
}
interface AIKey {
  _id: string; name: string; key: string; permissions: string[];
  rateLimitPerDay: number; usedToday: number; totalRequests: number;
  totalTokens: number; active: boolean; lastUsedAt?: string; createdAt: string;
}
interface AISettings {
  model: string; temperature: number; maxTokens: number; topK: number;
  systemPrompt: string; ragEnabled: boolean; useLocalAI?: boolean;
}
interface ChatMsg { role: "user" | "assistant"; content: string; ragDocs?: number; streaming?: boolean; }
interface LocalAIStatus {
  embedding: { ready: boolean; loading: boolean; error: string | null; modelId: string };
  llm:       { ready: boolean; loading: boolean; error: string | null; modelId: string };
  useLocalAI: boolean; localAIRequests: number; localAISavedCalls: number;
}
interface UsageStats {
  total: number; tokens: number;
  bySource: Record<string, number>;
  byDay: Record<string, number>;
}

const CATEGORIES = [
  { v: "services", l: "الخدمات" }, { v: "pricing", l: "الأسعار" },
  { v: "policies", l: "السياسات" }, { v: "faq", l: "الأسئلة الشائعة" },
  { v: "team", l: "الفريق" }, { v: "custom", l: "مخصص" },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminQiroxAI() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const qc = useQueryClient();

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  // Knowledge state
  const [docDialog, setDocDialog] = useState(false);
  const [editDoc, setEditDoc] = useState<Partial<KnowledgeDoc> | null>(null);

  // Key state
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyLimit, setNewKeyLimit] = useState("1000");
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Settings state
  const [settings, setSettings] = useState<AISettings>({
    model: "gpt-4o", temperature: 0.8, maxTokens: 700, topK: 5,
    systemPrompt: "", ragEnabled: true,
  });

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: localAI, refetch: refetchLocalAI } = useQuery<LocalAIStatus>({
    queryKey: ["/api/admin/local-ai/status"],
    queryFn: () => fetch("/api/admin/local-ai/status", { credentials: "include" }).then(r => r.json()),
    refetchInterval: (data) => {
      const emb = (data as any)?.embedding; const llm = (data as any)?.llm;
      if (emb?.loading || llm?.loading) return 2000;
      return 15_000;
    },
  });

  const { data: docs = [], isLoading: docsLoading } = useQuery<KnowledgeDoc[]>({
    queryKey: ["/api/admin/qirox-ai/knowledge"],
    queryFn: () => fetch("/api/admin/qirox-ai/knowledge", { credentials: "include" }).then(r => r.json()),
  });
  const { data: keys = [], isLoading: keysLoading } = useQuery<AIKey[]>({
    queryKey: ["/api/admin/qirox-ai/keys"],
    queryFn: () => fetch("/api/admin/qirox-ai/keys", { credentials: "include" }).then(r => r.json()),
  });
  const { data: usage } = useQuery<UsageStats>({
    queryKey: ["/api/admin/qirox-ai/stats"],
    queryFn: () => fetch("/api/admin/qirox-ai/stats", { credentials: "include" }).then(r => r.json()),
    refetchInterval: 30_000,
  });
  const { data: settingsData } = useQuery<AISettings>({
    queryKey: ["/api/admin/qirox-ai/settings"],
    queryFn: () => fetch("/api/admin/qirox-ai/settings", { credentials: "include" }).then(r => r.json()),
    onSuccess: (d) => d && setSettings(d),
  } as any);
  useEffect(() => { if (settingsData) setSettings(settingsData); }, [settingsData]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const saveDocMutation = useMutation({
    mutationFn: (data: Partial<KnowledgeDoc>) =>
      data._id
        ? apiRequest("PATCH", `/api/admin/qirox-ai/knowledge/${data._id}`, data).then(r => r.json())
        : apiRequest("POST", "/api/admin/qirox-ai/knowledge", data).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/qirox-ai/knowledge"] });
      toast({ title: L ? "✅ تم حفظ المستند" : "✅ Document saved" });
      setDocDialog(false); setEditDoc(null);
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/qirox-ai/knowledge/${id}`).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/qirox-ai/knowledge"] }); toast({ title: L ? "تم الحذف" : "Deleted" }); },
  });

  const reindexMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/qirox-ai/reindex").then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/qirox-ai/knowledge"] }); toast({ title: L ? "✅ تم إعادة الفهرسة" : "✅ Re-indexed" }); },
  });

  const reindexEmbMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/local-ai/reindex-embeddings").then(r => r.json()),
    onSuccess: () => toast({ title: L ? "✅ جاري تحديث التضمينات الدلالية..." : "✅ Semantic reindex started..." }),
    onError: (e: any) => toast({ title: e.message || "فشل", variant: "destructive" }),
  });

  const loadLLMMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/local-ai/load-llm").then(r => r.json()),
    onSuccess: () => { toast({ title: L ? "⏳ جاري تحميل نموذج Qwen2.5..." : "⏳ Loading Qwen2.5 model..." }); setTimeout(() => refetchLocalAI(), 3000); },
  });

  const loadEmbMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/local-ai/load-model").then(r => r.json()),
    onSuccess: () => { toast({ title: L ? "⏳ جاري تحميل نموذج التضمين..." : "⏳ Loading embedding model..." }); setTimeout(() => refetchLocalAI(), 3000); },
  });

  const createKeyMutation = useMutation({
    mutationFn: (data: { name: string; rateLimitPerDay: number }) =>
      apiRequest("POST", "/api/admin/qirox-ai/keys", data).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/qirox-ai/keys"] });
      toast({ title: L ? "✅ تم إنشاء المفتاح" : "✅ Key created" });
      setNewKeyName(""); setNewKeyLimit("1000");
    },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/qirox-ai/keys/${id}`).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/qirox-ai/keys"] }); toast({ title: L ? "تم إلغاء المفتاح" : "Key revoked" }); },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (data: Partial<AISettings>) => apiRequest("PATCH", "/api/admin/qirox-ai/settings", data).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/qirox-ai/settings"] }); toast({ title: L ? "✅ تم حفظ الإعدادات" : "✅ Settings saved" }); },
  });

  // ── Chat ─── streaming-first, fallback to non-streaming ────────────────────
  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMsg = { role: "user", content: chatInput.trim() };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatInput("");
    setChatLoading(true);
    const payload = newHistory.map(m => ({ role: m.role, content: m.content }));

    // Try streaming first
    try {
      const resp = await fetch("/api/admin/qirox-ai/chat/stream", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload }),
      });
      if (!resp.ok || !resp.body) throw new Error("no stream");

      // Add a placeholder streaming message
      setChatHistory(h => [...h, { role: "assistant", content: "", streaming: true, ragDocs: 0 }]);

      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = ""; let acc = ""; let ragDocs = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const ev = JSON.parse(raw);
            if (ev.content) {
              acc += ev.content;
              setChatHistory(h => {
                const c = [...h];
                const last = c[c.length - 1];
                if (last?.role === "assistant") c[c.length - 1] = { ...last, content: acc };
                return c;
              });
            }
            if (ev.ragDocs !== undefined) ragDocs = ev.ragDocs;
          } catch {}
        }
      }

      // Finalize
      setChatHistory(h => {
        const c = [...h];
        const last = c[c.length - 1];
        if (last?.role === "assistant") c[c.length - 1] = { ...last, content: acc || "...", streaming: false, ragDocs };
        return c;
      });
      return;
    } catch {/* fall through */}

    // Fallback — non-streaming
    try {
      const res = await fetch("/api/admin/qirox-ai/chat", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload }),
      });
      const data = await res.json();
      setChatHistory(h => [...h.filter(m => !m.streaming), { role: "assistant", content: data.reply, ragDocs: data.ragDocs }]);
    } catch { toast({ title: L ? "فشل الإرسال" : "Send failed", variant: "destructive" }); setChatHistory(h => h.filter(m => !m.streaming)); }
    finally { setChatLoading(false); }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-4" dir={dir}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-black dark:text-white">QIROX AI Hub</h1>
            <p className="text-xs text-black/40 dark:text-white/40">{L ? "ذكاء اصطناعي خاص بك — مبني من الصفر" : "Your own AI — built from scratch"}</p>
          </div>
        </div>
        {/* Stats strip */}
        <div className="flex items-center gap-3">
          <StatPill icon={<MessageSquare className="w-3 h-3" />} label={L ? "طلبات اليوم" : "Today"} value={String(usage?.total || 0)} color="purple" />
          <StatPill icon={<Cpu className="w-3 h-3" />} label="Tokens" value={fmtNum(usage?.tokens || 0)} color="indigo" />
          <StatPill icon={<Database className="w-3 h-3" />} label={L ? "المستندات" : "Docs"} value={String(docs.length)} color="blue" />
        </div>
      </div>

      {/* ── API endpoint info strip ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05]">
        <Globe className="w-4 h-4 text-purple-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-black/60 dark:text-white/60 truncate">POST /api/qirox-ai/chat</p>
          <p className="text-[10px] text-black/30 dark:text-white/30">{L ? "واجهة برمجية متوافقة مع OpenAI — استخدم مفاتيح API الخاصة بك" : "OpenAI-compatible API — use your own API keys"}</p>
        </div>
        <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">Live</Badge>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="chat">
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="chat" className="gap-1.5 text-xs">
            <MessageSquare className="w-3.5 h-3.5" />{L ? "اختبار" : "Chat Test"}
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="gap-1.5 text-xs">
            <Database className="w-3.5 h-3.5" />{L ? "قاعدة المعرفة" : "Knowledge"}
          </TabsTrigger>
          <TabsTrigger value="keys" className="gap-1.5 text-xs">
            <Key className="w-3.5 h-3.5" />{L ? "مفاتيح API" : "API Keys"}
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-1.5 text-xs">
            <BarChart2 className="w-3.5 h-3.5" />{L ? "الإحصائيات" : "Stats"}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-xs">
            <Settings className="w-3.5 h-3.5" />{L ? "الإعدادات" : "Settings"}
          </TabsTrigger>
        </TabsList>

        {/* ── Chat Test ── */}
        <TabsContent value="chat">
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden bg-white dark:bg-gray-900 flex flex-col" style={{ height: "60vh" }}>
            <div className="px-4 py-2.5 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs font-bold text-black dark:text-white">QIROX AI — {settings.model}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[9px] h-4 px-1.5">{L ? "RAG" : "RAG"}: {settings.ragEnabled ? "ON" : "OFF"}</Badge>
                <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 text-black/30 hover:text-black" onClick={() => setChatHistory([])}>
                  <X className="w-3 h-3" />{L ? "مسح" : "Clear"}
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50/50 dark:bg-gray-950/50">
              {chatHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/10 flex items-center justify-center">
                    <BrainCircuit className="w-6 h-6 text-purple-500/50" />
                  </div>
                  <p className="text-sm text-black/30 dark:text-white/30">{L ? "ابدأ محادثة لاختبار QIROX AI" : "Start a conversation to test QIROX AI"}</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[
                      L ? "ما هي باقات كيروكس؟" : "What are QIROX packages?",
                      L ? "كيف أبدأ مشروعي؟" : "How do I start my project?",
                      L ? "ما الفرق بين Pro و Infinity؟" : "Pro vs Infinity?",
                    ].map(q => (
                      <button key={q} onClick={() => { setChatInput(q); }} className="text-[11px] px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800 hover:bg-purple-100 transition-colors">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex gap-2 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "bg-gradient-to-br from-purple-500 to-indigo-600" : "bg-black dark:bg-white"}`}>
                      {msg.role === "assistant" ? <BrainCircuit className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5 text-white dark:text-black" />}
                    </div>
                    <div className={`rounded-2xl px-3 py-2 ${msg.role === "assistant" ? "bg-white dark:bg-gray-800 shadow-sm border border-black/[0.04] dark:border-white/[0.04] rounded-tl-sm" : "bg-black dark:bg-white rounded-tr-sm"}`}>
                      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "assistant" ? "text-black dark:text-white" : "text-white dark:text-black"}`}>
                        {msg.content}
                        {msg.streaming && <span className="inline-block w-1 h-3.5 bg-purple-500 rounded-sm ml-0.5 animate-pulse align-middle" />}
                      </p>
                      {msg.ragDocs != null && msg.ragDocs > 0 && !msg.streaming && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Database className="w-2.5 h-2.5 text-purple-400" />
                          <span className="text-[9px] text-black/30 dark:text-white/30">{msg.ragDocs} {L ? "مستند من قاعدة المعرفة" : "docs from knowledge base"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      <BrainCircuit className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm border border-black/[0.04] dark:border-white/[0.04] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEnd} />
            </div>
            <div className="px-3 py-2.5 border-t border-black/[0.04] dark:border-white/[0.04]">
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }}}
                  placeholder={L ? "اسأل QIROX AI... (Enter للإرسال)" : "Ask QIROX AI... (Enter to send)"}
                  className="text-sm border-black/10 dark:border-white/10"
                />
                <Button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:opacity-90">
                  {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Knowledge Base ── */}
        <TabsContent value="knowledge">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-black/50 dark:text-white/50">{docs.length} {L ? "مستند في قاعدة المعرفة" : "documents in knowledge base"}</p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8 border-black/10" onClick={() => reindexMutation.mutate()} disabled={reindexMutation.isPending}>
                  {reindexMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  {L ? "إعادة فهرسة" : "Re-index"}
                </Button>
                <Button size="sm" className="gap-1.5 text-xs h-8 bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:opacity-90"
                  onClick={() => { setEditDoc({ category: "custom", active: true }); setDocDialog(true); }}>
                  <Plus className="w-3 h-3" />{L ? "إضافة مستند" : "Add Document"}
                </Button>
              </div>
            </div>

            {docsLoading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-purple-500" /></div>}

            <div className="grid gap-2">
              {docs.map(doc => (
                <div key={doc._id} className={`flex items-start gap-3 p-3.5 rounded-xl border ${doc.active ? "border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900" : "border-black/[0.03] dark:border-white/[0.03] bg-black/[0.01] opacity-60"}`}>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-black dark:text-white truncate">{doc.title}</p>
                      <Badge className="text-[9px] h-4 px-1.5 bg-purple-50 text-purple-700 border-purple-100">{CATEGORIES.find(c => c.v === doc.category)?.l || doc.category}</Badge>
                      {!doc.active && <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-black/30">مخفي</Badge>}
                    </div>
                    <p className="text-xs text-black/40 dark:text-white/40 mt-0.5 line-clamp-2">{doc.content}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[9px] text-black/25 dark:text-white/25">{doc.docLength} {L ? "كلمة" : "tokens"}</span>
                      {doc.tags?.map(t => <span key={t} className="text-[9px] text-black/25 dark:text-white/25 px-1.5 py-0.5 rounded bg-black/[0.03] dark:bg-white/[0.03]">{t}</span>)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditDoc(doc); setDocDialog(true); }}>
                      <FileText className="w-3.5 h-3.5 text-black/30" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => deleteDocMutation.mutate(doc._id)}>
                      <Trash2 className="w-3.5 h-3.5 text-black/30 hover:text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              {!docsLoading && docs.length === 0 && (
                <div className="text-center py-12 text-black/25 dark:text-white/25">
                  <Database className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{L ? "قاعدة المعرفة فارغة — أضف مستندات لتحسين ردود الذكاء الاصطناعي" : "Knowledge base is empty — add documents to improve AI responses"}</p>
                </div>
              )}
            </div>
          </div>

          {/* Doc dialog */}
          <Dialog open={docDialog} onOpenChange={v => { if (!v) { setDocDialog(false); setEditDoc(null); } }}>
            <DialogContent className="max-w-lg bg-white dark:bg-gray-900" dir={dir}>
              <DialogHeader>
                <DialogTitle className="text-black dark:text-white">{editDoc?._id ? (L ? "تعديل مستند" : "Edit Document") : (L ? "إضافة مستند" : "Add Document")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-black/50 dark:text-white/40 mb-1 block">{L ? "العنوان" : "Title"}</label>
                  <Input value={editDoc?.title || ""} onChange={e => setEditDoc(d => ({ ...d, title: e.target.value }))} className="text-sm border-black/10 dark:border-white/10" />
                </div>
                <div>
                  <label className="text-xs text-black/50 dark:text-white/40 mb-1 block">{L ? "التصنيف" : "Category"}</label>
                  <Select value={editDoc?.category || "custom"} onValueChange={v => setEditDoc(d => ({ ...d, category: v }))}>
                    <SelectTrigger className="text-sm border-black/10 dark:border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-black/50 dark:text-white/40 mb-1 block">{L ? "المحتوى (كلما كان أكثر تفصيلاً كان الذكاء الاصطناعي أدق)" : "Content (more detail = smarter AI)"}</label>
                  <Textarea value={editDoc?.content || ""} onChange={e => setEditDoc(d => ({ ...d, content: e.target.value }))} rows={7} className="text-sm border-black/10 dark:border-white/10" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-black/50 dark:text-white/40">{L ? "نشط" : "Active"}</label>
                  <Switch checked={editDoc?.active !== false} onCheckedChange={v => setEditDoc(d => ({ ...d, active: v }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="border-black/10" onClick={() => { setDocDialog(false); setEditDoc(null); }}>{L ? "إلغاء" : "Cancel"}</Button>
                <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:opacity-90"
                  disabled={saveDocMutation.isPending || !editDoc?.title || !editDoc?.content}
                  onClick={() => saveDocMutation.mutate(editDoc as any)}>
                  {saveDocMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {L ? "حفظ" : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── API Keys ── */}
        <TabsContent value="keys">
          <div className="space-y-4">
            {/* OpenAI-compatible usage guide */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 border border-purple-100 dark:border-purple-800/30">
              <p className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />{L ? "استخدام الـ API خارجياً" : "Using the API externally"}
              </p>
              <pre className="text-[10px] font-mono bg-black/[0.04] dark:bg-white/[0.04] rounded-lg p-2.5 overflow-x-auto text-black/70 dark:text-white/70">{`curl -X POST https://your-domain.com/api/qirox-ai/chat \\
  -H "Authorization: Bearer qai-YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"messages":[{"role":"user","content":"السلام"}]}'`}</pre>
            </div>

            {/* Create key */}
            <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 space-y-3">
              <p className="text-sm font-bold text-black dark:text-white">{L ? "إنشاء مفتاح جديد" : "Create New Key"}</p>
              <div className="flex gap-2">
                <Input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder={L ? "اسم المفتاح (مثال: واتساب بوت، موقع الإنتاج...)" : "Key name (e.g. WhatsApp Bot, Production site...)"} className="flex-1 text-sm border-black/10 dark:border-white/10" />
                <Input value={newKeyLimit} onChange={e => setNewKeyLimit(e.target.value)} type="number" placeholder="1000" className="w-24 text-sm border-black/10 dark:border-white/10" />
                <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:opacity-90 gap-1.5 text-sm"
                  onClick={() => createKeyMutation.mutate({ name: newKeyName, rateLimitPerDay: Number(newKeyLimit) })}
                  disabled={createKeyMutation.isPending || !newKeyName.trim()}>
                  {createKeyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  {L ? "إنشاء" : "Create"}
                </Button>
              </div>
            </div>

            {/* Keys list */}
            {keysLoading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-purple-500" /></div>}
            <div className="space-y-2">
              {keys.map(k => (
                <div key={k._id} className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-purple-500" />
                      <p className="text-sm font-bold text-black dark:text-white">{k.name}</p>
                      <Badge className={`text-[9px] h-4 px-1.5 ${k.active ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"}`}>
                        {k.active ? (L ? "نشط" : "Active") : (L ? "ملغى" : "Revoked")}
                      </Badge>
                    </div>
                    <button onClick={() => revokeKeyMutation.mutate(k._id)} className="text-black/20 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {/* Key value */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05]">
                    <code className="flex-1 text-[11px] font-mono text-black/60 dark:text-white/60 truncate">
                      {visibleKeys.has(k._id) ? k.key : k.key.slice(0, 8) + "••••••••••••••••••••••••••••••••••••••••"}
                    </code>
                    <button onClick={() => setVisibleKeys(s => { const n = new Set(s); n.has(k._id) ? n.delete(k._id) : n.add(k._id); return n; })} className="text-black/30 hover:text-black dark:hover:text-white">
                      {visibleKeys.has(k._id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => copyKey(k.key)} className="text-black/30 hover:text-black dark:hover:text-white">
                      {copiedKey === k.key ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-black/[0.02] dark:bg-white/[0.02] p-2">
                      <p className="text-xs font-bold text-black dark:text-white">{k.usedToday}</p>
                      <p className="text-[9px] text-black/30 dark:text-white/30">{L ? "اليوم" : "Today"} / {k.rateLimitPerDay}</p>
                    </div>
                    <div className="rounded-lg bg-black/[0.02] dark:bg-white/[0.02] p-2">
                      <p className="text-xs font-bold text-black dark:text-white">{fmtNum(k.totalRequests)}</p>
                      <p className="text-[9px] text-black/30 dark:text-white/30">{L ? "إجمالي الطلبات" : "Total requests"}</p>
                    </div>
                    <div className="rounded-lg bg-black/[0.02] dark:bg-white/[0.02] p-2">
                      <p className="text-xs font-bold text-black dark:text-white">{fmtNum(k.totalTokens)}</p>
                      <p className="text-[9px] text-black/30 dark:text-white/30">Tokens</p>
                    </div>
                  </div>
                </div>
              ))}
              {!keysLoading && keys.length === 0 && (
                <div className="text-center py-10 text-black/25 dark:text-white/25">
                  <Key className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{L ? "لا توجد مفاتيح — أنشئ مفتاحاً لاستخدام الـ API خارجياً" : "No keys — create one to use the API externally"}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Stats ── */}
        <TabsContent value="stats">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 grid grid-cols-4 gap-3">
              {[
                { label: L ? "إجمالي الطلبات (7 أيام)" : "Total Requests (7d)", value: fmtNum(usage?.total || 0), icon: <MessageSquare className="w-4 h-4" />, color: "purple" },
                { label: L ? "إجمالي التوكنز" : "Total Tokens", value: fmtNum(usage?.tokens || 0), icon: <Cpu className="w-4 h-4" />, color: "indigo" },
                { label: L ? "عبر واتساب" : "via WhatsApp", value: fmtNum((usage?.bySource || {}).whatsapp || 0), icon: <Activity className="w-4 h-4" />, color: "green" },
                { label: L ? "مستندات المعرفة" : "Knowledge Docs", value: String(docs.length), icon: <Database className="w-4 h-4" />, color: "blue" },
              ].map(s => (
                <div key={s.label} className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500">{s.icon}</div>
                  </div>
                  <p className="text-2xl font-black text-black dark:text-white">{s.value}</p>
                  <p className="text-[10px] text-black/40 dark:text-white/40 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* By source */}
            <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900">
              <p className="text-sm font-bold text-black dark:text-white mb-3">{L ? "الطلبات حسب المصدر" : "Requests by Source"}</p>
              <div className="space-y-2">
                {Object.entries(usage?.bySource || {}).map(([src, count]) => {
                  const total = usage?.total || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={src}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-black/60 dark:text-white/60">{src}</span>
                        <span className="font-bold text-black dark:text-white">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.04] overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {!Object.keys(usage?.bySource || {}).length && <p className="text-xs text-black/25 text-center py-4">{L ? "لا توجد بيانات بعد" : "No data yet"}</p>}
              </div>
            </div>

            {/* By day */}
            <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900">
              <p className="text-sm font-bold text-black dark:text-white mb-3">{L ? "الطلبات يومياً (7 أيام)" : "Daily Requests (7d)"}</p>
              <div className="space-y-1.5">
                {Object.entries(usage?.byDay || {}).sort().map(([day, count]) => {
                  const max = Math.max(...Object.values(usage?.byDay || { x: 1 }));
                  const pct = Math.round((count / max) * 100);
                  return (
                    <div key={day} className="flex items-center gap-2">
                      <span className="text-[10px] text-black/40 dark:text-white/40 w-20 shrink-0">{day.slice(5)}</span>
                      <div className="flex-1 h-5 rounded-lg bg-black/[0.03] dark:bg-white/[0.03] overflow-hidden flex items-center">
                        <div className="h-full rounded-lg bg-gradient-to-r from-purple-400/80 to-indigo-500/80" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-black/60 dark:text-white/60 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
                {!Object.keys(usage?.byDay || {}).length && <p className="text-xs text-black/25 text-center py-4">{L ? "لا توجد بيانات بعد" : "No data yet"}</p>}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Settings ── */}
        <TabsContent value="settings">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4 p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900">
              <p className="text-sm font-bold text-black dark:text-white flex items-center gap-2"><Zap className="w-4 h-4 text-purple-500" />{L ? "إعدادات النموذج" : "Model Settings"}</p>

              <div>
                <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{L ? "النموذج" : "Model"}</label>
                <Select value={settings.model} onValueChange={v => setSettings(s => ({ ...s, model: v }))}>
                  <SelectTrigger className="text-sm border-black/10 dark:border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{L ? `درجة الإبداع (${settings.temperature})` : `Temperature (${settings.temperature})`}</label>
                <input type="range" min={0} max={1} step={0.05} value={settings.temperature}
                  onChange={e => setSettings(s => ({ ...s, temperature: Number(e.target.value) }))}
                  className="w-full accent-purple-500" />
              </div>

              <div>
                <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{L ? `حد الرد (${settings.maxTokens} token)` : `Max tokens (${settings.maxTokens})`}</label>
                <input type="range" min={100} max={2000} step={50} value={settings.maxTokens}
                  onChange={e => setSettings(s => ({ ...s, maxTokens: Number(e.target.value) }))}
                  className="w-full accent-purple-500" />
              </div>

              <div>
                <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{L ? `عدد مستندات RAG (${settings.topK})` : `RAG docs to fetch (${settings.topK})`}</label>
                <input type="range" min={1} max={10} step={1} value={settings.topK}
                  onChange={e => setSettings(s => ({ ...s, topK: Number(e.target.value) }))}
                  className="w-full accent-purple-500" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-black dark:text-white">{L ? "تفعيل RAG" : "Enable RAG"}</p>
                  <p className="text-[10px] text-black/30 dark:text-white/30">{L ? "يجلب مستندات ذات صلة عند كل سؤال" : "Fetches relevant docs for each question"}</p>
                </div>
                <Switch checked={settings.ragEnabled} onCheckedChange={v => setSettings(s => ({ ...s, ragEnabled: v }))} />
              </div>
            </div>

            <div className="space-y-4 p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900">
              <p className="text-sm font-bold text-black dark:text-white flex items-center gap-2"><MessageSquare className="w-4 h-4 text-purple-500" />{L ? "نظام الـ Prompt" : "System Prompt"}</p>
              <Textarea
                value={settings.systemPrompt}
                onChange={e => setSettings(s => ({ ...s, systemPrompt: e.target.value }))}
                placeholder={L ? "معلومات إضافية تريد أن يعرفها الذكاء الاصطناعي — تُضاف بعد الـ prompt الأساسي الخاص بكيروكس..." : "Extra info for AI — appended after the base QIROX prompt..."}
                rows={10}
                className="text-sm border-black/10 dark:border-white/10 font-mono"
              />
              <p className="text-[10px] text-black/30 dark:text-white/30">{L ? "مثال: عروض الشهر الحالي، سياسة إضافية، معلومات خاصة بالشركة..." : "e.g. Current month offers, extra policy, company-specific info..."}</p>
            </div>

            {/* ── Local AI engine status ── */}
            <div className="col-span-2 space-y-3 p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-500" />{L ? "محرك الذكاء الاصطناعي المحلي" : "Local AI Engine"}
                  <Badge className="text-[9px] h-4 px-1.5 bg-purple-50 text-purple-700 border-purple-100">Qwen2.5 + MiniLM</Badge>
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-black/40 dark:text-white/40">{L ? "وضع محلي" : "Local mode"}</p>
                  <Switch
                    checked={settings.useLocalAI || false}
                    onCheckedChange={v => setSettings(s => ({ ...s, useLocalAI: v }))}
                  />
                </div>
              </div>

              {/* Embedding model */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { title: L ? "نموذج التضمين" : "Embedding Model", subtitle: localAI?.embedding?.modelId || "MiniLM-L6-v2", status: localAI?.embedding, onLoad: () => loadEmbMutation.mutate(), loading: loadEmbMutation.isPending },
                  { title: L ? "نموذج التوليد" : "Generation LLM", subtitle: localAI?.llm?.modelId || "Qwen2.5-0.5B-Instruct", status: localAI?.llm, onLoad: () => loadLLMMutation.mutate(), loading: loadLLMMutation.isPending },
                ].map(item => (
                  <div key={item.title} className="p-3 rounded-xl border border-black/[0.05] dark:border-white/[0.05] bg-black/[0.01] dark:bg-white/[0.01]">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs font-bold text-black dark:text-white">{item.title}</p>
                        <p className="text-[9px] font-mono text-black/30 dark:text-white/30 truncate max-w-[150px]">{item.subtitle}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${item.status?.ready ? "bg-green-500" : item.status?.loading ? "bg-yellow-400 animate-pulse" : item.status?.error ? "bg-red-400" : "bg-black/10 dark:bg-white/10"}`} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[9px] h-4 px-1.5 ${item.status?.ready ? "bg-green-50 text-green-700 border-green-100" : item.status?.loading ? "bg-yellow-50 text-yellow-700 border-yellow-100" : item.status?.error ? "bg-red-50 text-red-700 border-red-100" : "bg-gray-50 text-gray-500 border-gray-100"}`}>
                        {item.status?.ready ? (L?"جاهز":"Ready") : item.status?.loading ? (L?"يتحمل":"Loading…") : item.status?.error ? (L?"خطأ":"Error") : (L?"غير محمل":"Not loaded")}
                      </Badge>
                      {!item.status?.ready && !item.status?.loading && (
                        <Button size="sm" variant="outline" className="h-5 text-[9px] px-2 border-purple-200 text-purple-600 hover:bg-purple-50"
                          onClick={item.onLoad} disabled={item.loading}>
                          {item.loading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : L ? "تحميل" : "Load"}
                        </Button>
                      )}
                    </div>
                    {item.status?.error && <p className="text-[9px] text-red-500 mt-1 truncate">{item.status.error}</p>}
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-black/30 dark:text-white/30">
                {L
                  ? "في الوضع المحلي، يعمل QIROX AI بالكامل على الخادم بدون الحاجة لـ API خارجي. الـ Qwen2.5 نموذج ~300MB يُنزَّل تلقائياً."
                  : "In local mode, QIROX AI runs entirely on the server — no external API needed. Qwen2.5 is a ~300MB model that downloads automatically."}
              </p>
            </div>

            <div className="col-span-2">
              <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:opacity-90 gap-2"
                onClick={() => saveSettingsMutation.mutate(settings)}
                disabled={saveSettingsMutation.isPending}>
                {saveSettingsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {L ? "حفظ الإعدادات" : "Save Settings"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function StatPill({ icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-${color}-50 dark:bg-${color}-900/10 border-${color}-100 dark:border-${color}-800/30`}>
      <span className={`text-${color}-500`}>{icon}</span>
      <div>
        <p className="text-xs font-bold text-black dark:text-white">{value}</p>
        <p className="text-[9px] text-black/40 dark:text-white/40">{label}</p>
      </div>
    </div>
  );
}
