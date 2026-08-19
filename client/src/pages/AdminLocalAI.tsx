/**
 * AdminLocalAI — QIROX Local AI Engine
 * Zero-cost AI powered by local ONNX models — no external provider needed
 */

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Cpu, Zap, Database, RefreshCw, Send, Bot, User,
  Loader2, CheckCircle2, XCircle, Clock, TrendingDown,
  Wifi, WifiOff, Play, MessageSquare,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LocalAIStatus {
  ready: boolean;
  loading: boolean;
  error: string | null;
  modelId: string;
  useLocalAI: boolean;
  localAIRequests: number;
  localAISavedCalls: number;
}

interface ChatMsg { role: "user" | "assistant"; content: string; ragDocs?: number; latency?: number; }

export default function AdminLocalAI() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const { data: status, refetch } = useQuery<LocalAIStatus>({
    queryKey: ["/api/admin/local-ai/status"],
    queryFn: async () => {
      const r = await fetch("/api/admin/local-ai/status", { credentials: "include" });
      return r.json();
    },
    refetchInterval: (data) => (data?.loading ? 3000 : 10000),
  });

  // Poll while loading
  useEffect(() => {
    if (status?.loading) {
      pollRef.current = setInterval(() => refetch(), 2000);
    } else {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [status?.loading]);

  const loadModelMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/local-ai/load-model", {}),
    onSuccess: () => {
      toast({ title: "⏳ جارٍ تحميل النموذج في الخلفية..." });
      setTimeout(() => refetch(), 2000);
    },
    onError: (e: any) => toast({ title: "فشل تحميل النموذج", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) => apiRequest("POST", "/api/admin/local-ai/toggle", { enabled }),
    onSuccess: (_, enabled) => {
      toast({ title: enabled ? "✅ تم تفعيل الـ AI المحلي" : "⚠️ تم إيقاف الـ AI المحلي (سيستخدم المزود الخارجي)" });
      qc.invalidateQueries({ queryKey: ["/api/admin/local-ai/status"] });
    },
  });

  const reindexMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/local-ai/reindex-embeddings", {}),
    onSuccess: () => toast({ title: "🔄 جارٍ إعادة فهرسة الوثائق..." }),
    onError: (e: any) => toast({ title: "فشل الفهرسة", description: e.message, variant: "destructive" }),
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const r = await apiRequest("POST", "/api/admin/local-ai/test-chat", { message });
      return r.json();
    },
    onSuccess: (data) => {
      setChatHistory(h => [...h, {
        role: "assistant",
        content: data.reply,
        ragDocs: data.ragDocs,
        latency: data.tokens,
      }]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    },
    onError: (e: any) => {
      setChatHistory(h => [...h, { role: "assistant", content: `❌ خطأ: ${e.message}` }]);
    },
  });

  const handleSend = () => {
    const msg = chatInput.trim();
    if (!msg) return;
    setChatHistory(h => [...h, { role: "user", content: msg }]);
    setChatInput("");
    chatMutation.mutate(msg);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const modelState = !status ? "unknown"
    : status.ready ? "ready"
    : status.loading ? "loading"
    : status.error ? "error"
    : "idle";

  const stateConfig = {
    ready:   { label: "جاهز ✅", color: "bg-green-500", icon: CheckCircle2, textColor: "text-green-600" },
    loading: { label: "جارٍ التحميل...", color: "bg-yellow-400 animate-pulse", icon: Loader2, textColor: "text-yellow-600" },
    error:   { label: "خطأ ❌", color: "bg-red-500", icon: XCircle, textColor: "text-red-600" },
    idle:    { label: "لم يُحمَّل", color: "bg-gray-300", icon: Clock, textColor: "text-gray-500" },
    unknown: { label: "غير معروف", color: "bg-gray-300", icon: Clock, textColor: "text-gray-500" },
  }[modelState];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10" dir="rtl">

      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="p-2.5 bg-black dark:bg-white rounded-xl">
          <Cpu className="w-5 h-5 text-white dark:text-black" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-black dark:text-white">QIROX Local AI</h1>
          <p className="text-xs text-black/50 dark:text-white/50">ذكاء اصطناعي محلي — بدون مزود خارجي، بدون تكلفة</p>
        </div>
        <div className="mr-auto flex items-center gap-2">
          <span className="text-xs text-black/50 dark:text-white/50">
            {status?.useLocalAI ? "محلي" : "خارجي"}
          </span>
          <Switch
            checked={status?.useLocalAI || false}
            onCheckedChange={(v) => toggleMutation.mutate(v)}
            disabled={toggleMutation.isPending}
          />
        </div>
      </div>

      {/* Status + Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Model Status Card */}
        <div className="bg-white dark:bg-gray-900 border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-black dark:text-white">حالة النموذج</p>
            <div className={`flex items-center gap-1.5 text-xs font-medium ${stateConfig.textColor}`}>
              <div className={`w-2 h-2 rounded-full ${stateConfig.color}`} />
              {stateConfig.label}
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-black/50 dark:text-white/50">النموذج</span>
              <span className="font-mono text-black/70 dark:text-white/70 text-[10px]">
                {status?.modelId || "all-MiniLM-L6-v2"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-black/50 dark:text-white/50">الحجم</span>
              <span className="text-black/70 dark:text-white/70">~23 MB (semantic embeddings)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-black/50 dark:text-white/50">الأداء</span>
              <span className="text-black/70 dark:text-white/70">CPU-only · لا يحتاج GPU</span>
            </div>
          </div>

          {modelState === "error" && status?.error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg p-2 mb-3">{status.error}</p>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 h-8 text-xs bg-black dark:bg-white text-white dark:text-black hover:bg-black/80"
              onClick={() => loadModelMutation.mutate()}
              disabled={loadModelMutation.isPending || modelState === "loading" || modelState === "ready"}
            >
              {modelState === "loading" ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <Play className="w-3 h-3 ml-1" />}
              {modelState === "ready" ? "محمَّل" : modelState === "loading" ? "جارٍ التحميل..." : "تحميل النموذج"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => reindexMutation.mutate()}
              disabled={reindexMutation.isPending || modelState !== "ready"}
              title="إعادة حساب الـ embeddings لكل الوثائق"
            >
              <RefreshCw className={`w-3 h-3 ${reindexMutation.isPending ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white dark:bg-gray-900 border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5">
          <p className="text-sm font-semibold text-black dark:text-white mb-4">الإحصائيات</p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-green-50 dark:bg-green-950/30">
              <TrendingDown className="w-4 h-4 text-green-600 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-green-700 dark:text-green-400">طلبات خُدمت محلياً</p>
                <p className="text-xl font-black text-green-600">{status?.localAIRequests?.toLocaleString() || "0"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30">
              <Zap className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">توفير في API Calls</p>
                <p className="text-xl font-black text-blue-600">{status?.localAISavedCalls?.toLocaleString() || "0"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-black/40 dark:text-white/40 mt-1">
              {status?.useLocalAI ? (
                <><Wifi className="w-3 h-3 text-green-500" /> يعمل الـ AI المحلي الآن — صفر تكلفة لكل سؤال</>
              ) : (
                <><WifiOff className="w-3 h-3 text-yellow-500" /> يستخدم المزود الخارجي — فعّل الـ Local AI للتوفير</>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] rounded-2xl p-5">
        <p className="text-sm font-semibold text-black dark:text-white mb-3">كيف يعمل؟</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-black/60 dark:text-white/60">
          <div className="flex gap-2 items-start">
            <span className="w-5 h-5 rounded-full bg-black dark:bg-white text-white dark:text-black text-[10px] flex items-center justify-center font-bold shrink-0">١</span>
            <span><strong className="text-black dark:text-white">Semantic Embeddings</strong> — نموذج all-MiniLM-L6-v2 يحوّل السؤال لـ vector رقمي</span>
          </div>
          <div className="flex gap-2 items-start">
            <span className="w-5 h-5 rounded-full bg-black dark:bg-white text-white dark:text-black text-[10px] flex items-center justify-center font-bold shrink-0">٢</span>
            <span><strong className="text-black dark:text-white">Hybrid Retrieval</strong> — يبحث في قاعدة المعرفة بـ BM25 + Cosine Similarity معاً</span>
          </div>
          <div className="flex gap-2 items-start">
            <span className="w-5 h-5 rounded-full bg-black dark:bg-white text-white dark:text-black text-[10px] flex items-center justify-center font-bold shrink-0">٣</span>
            <span><strong className="text-black dark:text-white">Smart Response</strong> — يبني الإجابة من الوثائق المسترجعة بدون AI خارجي</span>
          </div>
        </div>
      </div>

      {/* Test Chat */}
      <div className="bg-white dark:bg-gray-900 border border-black/[0.07] dark:border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
          <MessageSquare className="w-4 h-4 text-black/50 dark:text-white/50" />
          <p className="text-sm font-semibold text-black dark:text-white">اختبار المحرك المحلي</p>
          <Badge variant="outline" className="mr-auto text-[10px] h-5">
            {modelState === "ready" ? "جاهز" : "النموذج لم يُحمَّل"}
          </Badge>
        </div>

        {/* Chat messages */}
        <div className="h-64 overflow-y-auto p-4 space-y-3">
          {chatHistory.length === 0 && (
            <div className="flex items-center justify-center h-full text-xs text-black/30 dark:text-white/30">
              اكتب سؤالاً لتجربة الـ AI المحلي
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "user" ? "bg-black dark:bg-white" : "bg-gray-100 dark:bg-gray-800"
              }`}>
                {msg.role === "user"
                  ? <User className="w-3 h-3 text-white dark:text-black" />
                  : <Bot className="w-3 h-3 text-black/60 dark:text-white/60" />
                }
              </div>
              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
                msg.role === "user"
                  ? "bg-black dark:bg-white text-white dark:text-black rounded-tr-none"
                  : "bg-gray-50 dark:bg-gray-800 text-black dark:text-white rounded-tl-none"
              }`}>
                <p>{msg.content}</p>
                {msg.ragDocs !== undefined && msg.role === "assistant" && (
                  <p className="text-[10px] opacity-50 mt-1">
                    <Database className="w-2.5 h-2.5 inline ml-0.5" />
                    {msg.ragDocs} وثيقة مسترجعة
                  </p>
                )}
              </div>
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                <Loader2 className="w-3 h-3 animate-spin text-black/40 dark:text-white/40" />
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl rounded-tl-none px-3 py-2">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-black/[0.06] dark:border-white/[0.06] p-3 flex gap-2">
          <Input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="اسألني أي سؤال عن QIROX..."
            className="flex-1 h-8 text-xs"
            dir="rtl"
          />
          <Button
            size="sm"
            className="h-8 w-8 p-0 bg-black dark:bg-white text-white dark:text-black"
            onClick={handleSend}
            disabled={chatMutation.isPending || !chatInput.trim()}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-xs text-black/40 dark:text-white/40 space-y-1 pb-2">
        <p>• أضف وثائق في <strong className="text-black/60 dark:text-white/60">QIROX AI Hub ← قاعدة المعرفة</strong> ثم اضغط "إعادة فهرسة" لتحسين الـ AI المحلي</p>
        <p>• النموذج يُحمَّل مرة واحدة عند الضغط ويبقى في الذاكرة — قد يستغرق التحميل الأول دقيقتين</p>
        <p>• عند تفعيل "Local AI": واتساب، AI Hub، QIROX Agent — كلها تعمل محلياً تلقائياً</p>
      </div>
    </div>
  );
}
