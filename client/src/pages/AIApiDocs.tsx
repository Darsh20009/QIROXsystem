/**
 * QIROX AI — Public API Documentation Page
 * Accessible at /ai-docs (no auth required)
 */
import { useState } from "react";
import { Copy, Check, Zap, Search, Cpu, Activity, Key, ChevronDown, ChevronRight, Globe, Lock } from "lucide-react";

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };
  return { copied, copy };
}

function CodeBlock({ code, lang = "bash", id }: { code: string; lang?: string; id: string }) {
  const { copied, copy } = useCopy();
  return (
    <div className="relative rounded-xl bg-[#0d1117] border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
        <span className="text-[11px] font-mono text-white/40">{lang}</span>
        <button onClick={() => copy(code, id)} className="flex items-center gap-1.5 text-[11px] text-white/50 hover:text-white/80 transition">
          {copied === id ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copied</span></> : <><Copy className="w-3 h-3" />Copy</>}
        </button>
      </div>
      <pre className="p-4 text-[12.5px] font-mono text-[#e6edf3] overflow-x-auto leading-relaxed whitespace-pre">{code}</pre>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  const map: Record<string, string> = {
    green:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    blue:   "bg-blue-500/15 text-blue-400 border-blue-500/30",
    orange: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    red:    "bg-red-500/15 text-red-400 border-red-500/30",
    purple: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  };
  return <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${map[color] || map.blue}`}>{label}</span>;
}

function EndpointCard({
  method, path, title, description, auth, children,
}: {
  method: string; path: string; title: string; description: string; auth: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const mc: Record<string, string> = {
    POST: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    GET:  "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  };
  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition text-left"
      >
        <span className={`px-2.5 py-1 rounded-lg text-xs font-black border font-mono shrink-0 ${mc[method] || mc.GET}`}>{method}</span>
        <code className="text-sm text-white/80 font-mono">{path}</code>
        <div className="flex-1 min-w-0 hidden sm:block">
          <span className="text-sm text-white/50 truncate">{title}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded border shrink-0 ${auth === "none" ? "border-white/10 text-white/30" : "border-amber-500/30 text-amber-400"}`}>
          {auth === "none" ? "No auth" : auth}
        </span>
        {open ? <ChevronDown className="w-4 h-4 text-white/30 shrink-0" /> : <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />}
      </button>
      {open && (
        <div className="border-t border-white/10 p-5 space-y-4 bg-white/[0.02]">
          <p className="text-sm text-white/60">{description}</p>
          {children}
        </div>
      )}
    </div>
  );
}

export default function AIApiDocs() {
  const BASE = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com";

  return (
    <div className="min-h-screen bg-[#080c14] text-white" dir="ltr">
      {/* ── Header ── */}
      <div className="border-b border-white/10 bg-[#0d1117]">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">QIROX AI API</h1>
              <p className="text-xs text-white/40">v1.0 · Production</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge label="Stable" color="green" />
            <Badge label="OpenAI-Compatible" color="blue" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">

        {/* ── Overview ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold">Overview</h2>
          </div>
          <p className="text-white/60 text-sm leading-relaxed max-w-3xl">
            QIROX AI provides a REST API for Arabic/English conversational AI with RAG (Retrieval-Augmented Generation),
            semantic search, and text embeddings. The API is OpenAI-compatible and supports both local (on-device) and
            external AI providers. All responses are bilingual-aware — the model matches the language of the user.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Cpu, label: "Local AI", desc: "Qwen2.5-0.5B runs on-device — zero API cost" },
              { icon: Search, label: "RAG", desc: "BM25 + Semantic retrieval with RRF fusion" },
              { icon: Activity, label: "Streaming", desc: "SSE streaming with word-by-word delivery" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold">{label}</span>
                </div>
                <p className="text-xs text-white/50">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Base URL ── */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2"><Globe className="w-4 h-4 text-white/40" /> Base URL</h2>
          <CodeBlock id="base-url" lang="text" code={`${BASE}/api/v1/ai`} />
        </section>

        {/* ── Authentication ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold">Authentication</h2>
          </div>
          <p className="text-sm text-white/60">
            Include your API key in the <code className="text-amber-300 bg-white/10 px-1 rounded">Authorization</code> header.
            Keys are created from the admin panel under <strong>Admin → QIROX AI → API Keys</strong>.
          </p>
          <CodeBlock id="auth-header" lang="http" code={`Authorization: Bearer qai-<your-key>`} />
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
            <p className="text-xs font-semibold text-amber-400">Key Permissions</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { perm: "chat",       desc: "Access /v1/ai/chat" },
                { perm: "knowledge",  desc: "Access /v1/ai/search" },
                { perm: "embeddings", desc: "Access /v1/ai/embed" },
              ].map(({ perm, desc }) => (
                <div key={perm} className="flex items-start gap-2 text-xs text-white/60">
                  <Badge label={perm} color="orange" />
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Endpoints ── */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Endpoints</h2>

          {/* Health */}
          <EndpointCard method="GET" path="/api/v1/ai/health" title="Health check" description="Returns current model status, RAG document count, and active AI mode. No authentication required." auth="none">
            <CodeBlock id="health-req" lang="bash" code={`curl ${BASE}/api/v1/ai/health`} />
            <CodeBlock id="health-res" lang="json" code={`{
  "status": "ok",
  "version": "1.0.0",
  "models": {
    "chat":       "gpt-4o",
    "embedding":  "all-MiniLM-L6-v2 (384d)",
    "generation": "Qwen2.5-0.5B-Instruct",
    "mode":       "external"
  },
  "rag": { "enabled": true, "documents": 24, "topK": 5 },
  "timestamp": "2026-01-01T00:00:00.000Z"
}`} />
          </EndpointCard>

          {/* Chat */}
          <EndpointCard method="POST" path="/api/v1/ai/chat" title="Chat completion (RAG-powered)" description="Send a conversation and receive an AI response enriched with knowledge-base context and live system data. Supports streaming (SSE) via stream: true." auth="Bearer (chat)">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Request body</p>
              <div className="space-y-1.5 text-xs text-white/60">
                {[
                  { f: "messages", t: "array", req: true, d: "Conversation history [{role, content}]. Roles: user | assistant | system" },
                  { f: "stream",   t: "boolean", req: false, d: 'Enable SSE streaming (default: false)' },
                ].map(({ f, t, req, d }) => (
                  <div key={f} className="flex gap-3 items-start">
                    <code className="text-blue-300 w-24 shrink-0">{f}</code>
                    <Badge label={t} color="purple" />
                    {req && <Badge label="required" color="orange" />}
                    <span className="text-white/50">{d}</span>
                  </div>
                ))}
              </div>
            </div>
            <CodeBlock id="chat-req" lang="bash" code={`curl -X POST ${BASE}/api/v1/ai/chat \\
  -H "Authorization: Bearer qai-..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      { "role": "user", "content": "ما هي خدمات QIROX؟" }
    ]
  }'`} />
            <CodeBlock id="chat-res" lang="json" code={`{
  "id": "qai-1753920000000",
  "object": "chat.completion",
  "model": "qirox-ai",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "QIROX منصة سعودية متكاملة لتطوير المنتجات الرقمية..."
    },
    "finish_reason": "stop"
  }],
  "usage": { "total_tokens": 312 },
  "meta": { "ragDocs": 4 }
}`} />
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Streaming (SSE)</p>
            <CodeBlock id="chat-stream" lang="javascript" code={`const res = await fetch('${BASE}/api/v1/ai/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer qai-...',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'اشرح لي باقة Pro' }],
    stream: true,
  }),
});

const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\\n\\n');
  buffer = lines.pop() || '';
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const data = line.slice(6).trim();
    if (data === '[DONE]') return;
    const chunk = JSON.parse(data);
    if (chunk.content) process.stdout.write(chunk.content);
  }
}`} />
          </EndpointCard>

          {/* Search */}
          <EndpointCard method="GET" path="/api/v1/ai/search" title="Knowledge base search" description="Semantic + BM25 hybrid search over your knowledge base. Returns ranked documents with similarity scores." auth="Bearer (knowledge)">
            <div className="space-y-1.5 text-xs text-white/60">
              {[
                { f: "q",  t: "string",  req: true,  d: "Search query (Arabic or English)" },
                { f: "k",  t: "number",  req: false, d: "Max results to return (default: 5, max: 20)" },
              ].map(({ f, t, req, d }) => (
                <div key={f} className="flex gap-3 items-start">
                  <code className="text-blue-300 w-8 shrink-0">{f}</code>
                  <Badge label={t} color="purple" />
                  {req && <Badge label="required" color="orange" />}
                  <span className="text-white/50">{d}</span>
                </div>
              ))}
            </div>
            <CodeBlock id="search-req" lang="bash" code={`curl "${BASE}/api/v1/ai/search?q=باقة+Pro&k=3" \\
  -H "Authorization: Bearer qai-..."`} />
            <CodeBlock id="search-res" lang="json" code={`{
  "query": "باقة Pro",
  "results": [
    {
      "title": "باقات QIROX",
      "content": "باقة Pro تشمل موقع إلكتروني + تطبيق + لوحة إدارة...",
      "category": "pricing",
      "tags": ["باقات", "pro"],
      "score": 0.8712
    }
  ],
  "count": 1,
  "engine": "hybrid"
}`} />
          </EndpointCard>

          {/* Embed */}
          <EndpointCard method="POST" path="/api/v1/ai/embed" title="Text embeddings" description="Generate 384-dimensional semantic embedding vectors using all-MiniLM-L6-v2 (multilingual). Format is OpenAI-compatible. Requires embedding model to be loaded from admin panel." auth="Bearer (embeddings)">
            <CodeBlock id="embed-req" lang="bash" code={`curl -X POST ${BASE}/api/v1/ai/embed \\
  -H "Authorization: Bearer qai-..." \\
  -H "Content-Type: application/json" \\
  -d '{ "input": ["مرحبا بالعالم", "Hello world"] }'`} />
            <CodeBlock id="embed-res" lang="json" code={`{
  "object": "list",
  "data": [
    { "object": "embedding", "index": 0, "embedding": [0.023, -0.041, ...] },
    { "object": "embedding", "index": 1, "embedding": [0.019, -0.038, ...] }
  ],
  "model": "all-MiniLM-L6-v2",
  "dimensions": 384,
  "usage": { "prompt_tokens": 8 }
}`} />
          </EndpointCard>
        </section>

        {/* ── SDKs / Quick Start ── */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Quick Start</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Python</p>
              <CodeBlock id="py-sdk" lang="python" code={`import requests

API_KEY = "qai-..."
BASE    = "${BASE}/api/v1/ai"

def chat(message: str) -> str:
    r = requests.post(f"{BASE}/chat", json={
        "messages": [{"role": "user", "content": message}]
    }, headers={"Authorization": f"Bearer {API_KEY}"})
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]

print(chat("ما هي خدمات QIROX؟"))`} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">JavaScript / TypeScript</p>
              <CodeBlock id="js-sdk" lang="typescript" code={`const API_KEY = "qai-...";
const BASE    = "${BASE}/api/v1/ai";

async function chat(message: string) {
  const res = await fetch(\`\${BASE}/chat\`, {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: message }],
    }),
  });
  const data = await res.json();
  return data.choices[0].message.content;
}

console.log(await chat("ما هي خدمات QIROX؟"));`} />
            </div>
          </div>
        </section>

        {/* ── Rate limits ── */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2"><Key className="w-4 h-4 text-white/40" /> Rate Limits</h2>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr className="text-left">
                  {["Limit type", "Default", "Configurable"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-xs font-semibold text-white/40 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ["Daily requests per key",   "1,000", "Yes — per-key setting in admin"],
                  ["Batch embed inputs",        "100",   "Fixed"],
                  ["Max search results (k)",    "20",    "Fixed"],
                  ["Streaming connection",      "∞",     "—"],
                ].map(([type, def, conf]) => (
                  <tr key={type} className="hover:bg-white/[0.02] transition">
                    <td className="px-4 py-2.5 text-white/70">{type}</td>
                    <td className="px-4 py-2.5"><Badge label={def} color="blue" /></td>
                    <td className="px-4 py-2.5 text-white/40 text-xs">{conf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-white/40">
            Exceeded rate limit returns <code className="text-red-400 bg-white/10 px-1 rounded">401</code> with <code className="text-red-300 bg-white/10 px-1 rounded">"تجاوز الحد اليومي"</code>.
            The counter resets every 24 hours.
          </p>
        </section>

        {/* ── Error reference ── */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Error Codes</h2>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr className="text-left">
                  {["Status", "Code", "Meaning"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-xs font-semibold text-white/40 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ["400", "Bad Request",       "Missing required fields (messages, q, input)"],
                  ["401", "Unauthorized",      "Missing, invalid, or rate-limited API key"],
                  ["403", "Forbidden",         "Key lacks required permission for this endpoint"],
                  ["503", "Service Unavail.",  "Embedding model not loaded (embed endpoint only)"],
                  ["500", "Server Error",      "Unexpected error — check error.message in body"],
                ].map(([code, name, desc]) => (
                  <tr key={code} className="hover:bg-white/[0.02] transition">
                    <td className="px-4 py-2.5"><Badge label={code} color={code === "400" || code === "500" ? "red" : "orange"} /></td>
                    <td className="px-4 py-2.5 font-mono text-xs text-white/60">{name}</td>
                    <td className="px-4 py-2.5 text-white/50 text-xs">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-white/10 pt-8 pb-4 flex items-center justify-between text-xs text-white/30">
          <span>QIROX AI API v1.0 · Built by QIROX Systems Factory</span>
          <a href="/admin/qirox-ai" className="hover:text-white/60 transition">Admin Panel →</a>
        </div>
      </div>
    </div>
  );
}
