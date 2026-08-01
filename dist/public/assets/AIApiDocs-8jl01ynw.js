import{j as e,r as h}from"./vendor-react-DXvDjYCw.js";import{aj as u,G as x,Q as j,b5 as g,aa as w,bi as N,az as f,ah as v,bB as y,aU as A,aS as k}from"./vendor-ui-D4N7r3Ag.js";function S(){const[a,s]=h.useState(null);return{copied:a,copy:(r,n)=>{navigator.clipboard.writeText(r).then(()=>{s(n),setTimeout(()=>s(null),2e3)})}}}function i({code:a,lang:s="bash",id:t}){const{copied:r,copy:n}=S();return e.jsxs("div",{className:"relative rounded-xl bg-[#0d1117] border border-white/10 overflow-hidden",children:[e.jsxs("div",{className:"flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5",children:[e.jsx("span",{className:"text-[11px] font-mono text-white/40",children:s}),e.jsx("button",{onClick:()=>n(a,t),className:"flex items-center gap-1.5 text-[11px] text-white/50 hover:text-white/80 transition",children:r===t?e.jsxs(e.Fragment,{children:[e.jsx(v,{className:"w-3 h-3 text-emerald-400"}),e.jsx("span",{className:"text-emerald-400",children:"Copied"})]}):e.jsxs(e.Fragment,{children:[e.jsx(y,{className:"w-3 h-3"}),"Copy"]})})]}),e.jsx("pre",{className:"p-4 text-[12.5px] font-mono text-[#e6edf3] overflow-x-auto leading-relaxed whitespace-pre",children:a})]})}function l({label:a,color:s}){const t={green:"bg-emerald-500/15 text-emerald-400 border-emerald-500/30",blue:"bg-blue-500/15 text-blue-400 border-blue-500/30",orange:"bg-orange-500/15 text-orange-400 border-orange-500/30",red:"bg-red-500/15 text-red-400 border-red-500/30",purple:"bg-purple-500/15 text-purple-400 border-purple-500/30"};return e.jsx("span",{className:`px-2 py-0.5 rounded-md text-[11px] font-bold border ${t[s]||t.blue}`,children:a})}function d({method:a,path:s,title:t,description:r,auth:n,children:m}){const[c,p]=h.useState(!1),o={POST:"bg-blue-500/20 text-blue-300 border-blue-500/40",GET:"bg-emerald-500/20 text-emerald-300 border-emerald-500/40"};return e.jsxs("div",{className:"border border-white/10 rounded-2xl overflow-hidden",children:[e.jsxs("button",{onClick:()=>p(b=>!b),className:"w-full flex items-center gap-3 p-4 hover:bg-white/5 transition text-left",children:[e.jsx("span",{className:`px-2.5 py-1 rounded-lg text-xs font-black border font-mono shrink-0 ${o[a]||o.GET}`,children:a}),e.jsx("code",{className:"text-sm text-white/80 font-mono",children:s}),e.jsx("div",{className:"flex-1 min-w-0 hidden sm:block",children:e.jsx("span",{className:"text-sm text-white/50 truncate",children:t})}),e.jsx("span",{className:`text-xs px-2 py-0.5 rounded border shrink-0 ${n==="none"?"border-white/10 text-white/30":"border-amber-500/30 text-amber-400"}`,children:n==="none"?"No auth":n}),c?e.jsx(A,{className:"w-4 h-4 text-white/30 shrink-0"}):e.jsx(k,{className:"w-4 h-4 text-white/30 shrink-0"})]}),c&&e.jsxs("div",{className:"border-t border-white/10 p-5 space-y-4 bg-white/[0.02]",children:[e.jsx("p",{className:"text-sm text-white/60",children:r}),m]})]})}function E(){const a=typeof window<"u"?window.location.origin:"https://your-domain.com";return e.jsxs("div",{className:"min-h-screen bg-[#080c14] text-white",dir:"ltr",children:[e.jsx("div",{className:"border-b border-white/10 bg-[#0d1117]",children:e.jsxs("div",{className:"max-w-5xl mx-auto px-6 py-6 flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center",children:e.jsx(u,{className:"w-5 h-5 text-white"})}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-lg font-bold tracking-tight",children:"QIROX AI API"}),e.jsx("p",{className:"text-xs text-white/40",children:"v1.0 · Production"})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(l,{label:"Stable",color:"green"}),e.jsx(l,{label:"OpenAI-Compatible",color:"blue"})]})]})}),e.jsxs("div",{className:"max-w-5xl mx-auto px-6 py-10 space-y-12",children:[e.jsxs("section",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(x,{className:"w-5 h-5 text-blue-400"}),e.jsx("h2",{className:"text-xl font-bold",children:"Overview"})]}),e.jsx("p",{className:"text-white/60 text-sm leading-relaxed max-w-3xl",children:"QIROX AI provides a REST API for Arabic/English conversational AI with RAG (Retrieval-Augmented Generation), semantic search, and text embeddings. The API is OpenAI-compatible and supports both local (on-device) and external AI providers. All responses are bilingual-aware — the model matches the language of the user."}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-3",children:[{icon:j,label:"Local AI",desc:"Qwen2.5-0.5B runs on-device — zero API cost"},{icon:g,label:"RAG",desc:"BM25 + Semantic retrieval with RRF fusion"},{icon:w,label:"Streaming",desc:"SSE streaming with word-by-word delivery"}].map(({icon:s,label:t,desc:r})=>e.jsxs("div",{className:"rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-1",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(s,{className:"w-4 h-4 text-blue-400"}),e.jsx("span",{className:"text-sm font-semibold",children:t})]}),e.jsx("p",{className:"text-xs text-white/50",children:r})]},t))})]}),e.jsxs("section",{className:"space-y-3",children:[e.jsxs("h2",{className:"text-lg font-bold flex items-center gap-2",children:[e.jsx(x,{className:"w-4 h-4 text-white/40"})," Base URL"]}),e.jsx(i,{id:"base-url",lang:"text",code:`${a}/api/v1/ai`})]}),e.jsxs("section",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(N,{className:"w-5 h-5 text-amber-400"}),e.jsx("h2",{className:"text-xl font-bold",children:"Authentication"})]}),e.jsxs("p",{className:"text-sm text-white/60",children:["Include your API key in the ",e.jsx("code",{className:"text-amber-300 bg-white/10 px-1 rounded",children:"Authorization"})," header. Keys are created from the admin panel under ",e.jsx("strong",{children:"Admin → QIROX AI → API Keys"}),"."]}),e.jsx(i,{id:"auth-header",lang:"http",code:"Authorization: Bearer qai-<your-key>"}),e.jsxs("div",{className:"rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2",children:[e.jsx("p",{className:"text-xs font-semibold text-amber-400",children:"Key Permissions"}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-2",children:[{perm:"chat",desc:"Access /v1/ai/chat"},{perm:"knowledge",desc:"Access /v1/ai/search"},{perm:"embeddings",desc:"Access /v1/ai/embed"}].map(({perm:s,desc:t})=>e.jsxs("div",{className:"flex items-start gap-2 text-xs text-white/60",children:[e.jsx(l,{label:s,color:"orange"}),e.jsx("span",{children:t})]},s))})]})]}),e.jsxs("section",{className:"space-y-4",children:[e.jsx("h2",{className:"text-xl font-bold",children:"Endpoints"}),e.jsxs(d,{method:"GET",path:"/api/v1/ai/health",title:"Health check",description:"Returns current model status, RAG document count, and active AI mode. No authentication required.",auth:"none",children:[e.jsx(i,{id:"health-req",lang:"bash",code:`curl ${a}/api/v1/ai/health`}),e.jsx(i,{id:"health-res",lang:"json",code:`{
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
}`})]}),e.jsxs(d,{method:"POST",path:"/api/v1/ai/chat",title:"Chat completion (RAG-powered)",description:"Send a conversation and receive an AI response enriched with knowledge-base context and live system data. Supports streaming (SSE) via stream: true.",auth:"Bearer (chat)",children:[e.jsxs("div",{className:"space-y-3",children:[e.jsx("p",{className:"text-xs font-semibold text-white/40 uppercase tracking-wider",children:"Request body"}),e.jsx("div",{className:"space-y-1.5 text-xs text-white/60",children:[{f:"messages",t:"array",req:!0,d:"Conversation history [{role, content}]. Roles: user | assistant | system"},{f:"stream",t:"boolean",req:!1,d:"Enable SSE streaming (default: false)"}].map(({f:s,t,req:r,d:n})=>e.jsxs("div",{className:"flex gap-3 items-start",children:[e.jsx("code",{className:"text-blue-300 w-24 shrink-0",children:s}),e.jsx(l,{label:t,color:"purple"}),r&&e.jsx(l,{label:"required",color:"orange"}),e.jsx("span",{className:"text-white/50",children:n})]},s))})]}),e.jsx(i,{id:"chat-req",lang:"bash",code:`curl -X POST ${a}/api/v1/ai/chat \\
  -H "Authorization: Bearer qai-..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      { "role": "user", "content": "ما هي خدمات QIROX؟" }
    ]
  }'`}),e.jsx(i,{id:"chat-res",lang:"json",code:`{
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
}`}),e.jsx("p",{className:"text-xs font-semibold text-white/40 uppercase tracking-wider",children:"Streaming (SSE)"}),e.jsx(i,{id:"chat-stream",lang:"javascript",code:`const res = await fetch('${a}/api/v1/ai/chat', {
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
}`})]}),e.jsxs(d,{method:"GET",path:"/api/v1/ai/search",title:"Knowledge base search",description:"Semantic + BM25 hybrid search over your knowledge base. Returns ranked documents with similarity scores.",auth:"Bearer (knowledge)",children:[e.jsx("div",{className:"space-y-1.5 text-xs text-white/60",children:[{f:"q",t:"string",req:!0,d:"Search query (Arabic or English)"},{f:"k",t:"number",req:!1,d:"Max results to return (default: 5, max: 20)"}].map(({f:s,t,req:r,d:n})=>e.jsxs("div",{className:"flex gap-3 items-start",children:[e.jsx("code",{className:"text-blue-300 w-8 shrink-0",children:s}),e.jsx(l,{label:t,color:"purple"}),r&&e.jsx(l,{label:"required",color:"orange"}),e.jsx("span",{className:"text-white/50",children:n})]},s))}),e.jsx(i,{id:"search-req",lang:"bash",code:`curl "${a}/api/v1/ai/search?q=باقة+Pro&k=3" \\
  -H "Authorization: Bearer qai-..."`}),e.jsx(i,{id:"search-res",lang:"json",code:`{
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
}`})]}),e.jsxs(d,{method:"POST",path:"/api/v1/ai/embed",title:"Text embeddings",description:"Generate 384-dimensional semantic embedding vectors using all-MiniLM-L6-v2 (multilingual). Format is OpenAI-compatible. Requires embedding model to be loaded from admin panel.",auth:"Bearer (embeddings)",children:[e.jsx(i,{id:"embed-req",lang:"bash",code:`curl -X POST ${a}/api/v1/ai/embed \\
  -H "Authorization: Bearer qai-..." \\
  -H "Content-Type: application/json" \\
  -d '{ "input": ["مرحبا بالعالم", "Hello world"] }'`}),e.jsx(i,{id:"embed-res",lang:"json",code:`{
  "object": "list",
  "data": [
    { "object": "embedding", "index": 0, "embedding": [0.023, -0.041, ...] },
    { "object": "embedding", "index": 1, "embedding": [0.019, -0.038, ...] }
  ],
  "model": "all-MiniLM-L6-v2",
  "dimensions": 384,
  "usage": { "prompt_tokens": 8 }
}`})]})]}),e.jsxs("section",{className:"space-y-4",children:[e.jsx("h2",{className:"text-xl font-bold",children:"Quick Start"}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx("p",{className:"text-xs font-semibold text-white/40 uppercase tracking-wider",children:"Python"}),e.jsx(i,{id:"py-sdk",lang:"python",code:`import requests

API_KEY = "qai-..."
BASE    = "${a}/api/v1/ai"

def chat(message: str) -> str:
    r = requests.post(f"{BASE}/chat", json={
        "messages": [{"role": "user", "content": message}]
    }, headers={"Authorization": f"Bearer {API_KEY}"})
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]

print(chat("ما هي خدمات QIROX؟"))`})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("p",{className:"text-xs font-semibold text-white/40 uppercase tracking-wider",children:"JavaScript / TypeScript"}),e.jsx(i,{id:"js-sdk",lang:"typescript",code:`const API_KEY = "qai-...";
const BASE    = "${a}/api/v1/ai";

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

console.log(await chat("ما هي خدمات QIROX؟"));`})]})]})]}),e.jsxs("section",{className:"space-y-3",children:[e.jsxs("h2",{className:"text-xl font-bold flex items-center gap-2",children:[e.jsx(f,{className:"w-4 h-4 text-white/40"})," Rate Limits"]}),e.jsx("div",{className:"rounded-xl border border-white/10 overflow-hidden",children:e.jsxs("table",{className:"w-full text-sm",children:[e.jsx("thead",{className:"bg-white/5",children:e.jsx("tr",{className:"text-left",children:["Limit type","Default","Configurable"].map(s=>e.jsx("th",{className:"px-4 py-2.5 text-xs font-semibold text-white/40 uppercase tracking-wider",children:s},s))})}),e.jsx("tbody",{className:"divide-y divide-white/5",children:[["Daily requests per key","1,000","Yes — per-key setting in admin"],["Batch embed inputs","100","Fixed"],["Max search results (k)","20","Fixed"],["Streaming connection","∞","—"]].map(([s,t,r])=>e.jsxs("tr",{className:"hover:bg-white/[0.02] transition",children:[e.jsx("td",{className:"px-4 py-2.5 text-white/70",children:s}),e.jsx("td",{className:"px-4 py-2.5",children:e.jsx(l,{label:t,color:"blue"})}),e.jsx("td",{className:"px-4 py-2.5 text-white/40 text-xs",children:r})]},s))})]})}),e.jsxs("p",{className:"text-xs text-white/40",children:["Exceeded rate limit returns ",e.jsx("code",{className:"text-red-400 bg-white/10 px-1 rounded",children:"401"})," with ",e.jsx("code",{className:"text-red-300 bg-white/10 px-1 rounded",children:'"تجاوز الحد اليومي"'}),". The counter resets every 24 hours."]})]}),e.jsxs("section",{className:"space-y-3",children:[e.jsx("h2",{className:"text-xl font-bold",children:"Error Codes"}),e.jsx("div",{className:"rounded-xl border border-white/10 overflow-hidden",children:e.jsxs("table",{className:"w-full text-sm",children:[e.jsx("thead",{className:"bg-white/5",children:e.jsx("tr",{className:"text-left",children:["Status","Code","Meaning"].map(s=>e.jsx("th",{className:"px-4 py-2.5 text-xs font-semibold text-white/40 uppercase tracking-wider",children:s},s))})}),e.jsx("tbody",{className:"divide-y divide-white/5",children:[["400","Bad Request","Missing required fields (messages, q, input)"],["401","Unauthorized","Missing, invalid, or rate-limited API key"],["403","Forbidden","Key lacks required permission for this endpoint"],["503","Service Unavail.","Embedding model not loaded (embed endpoint only)"],["500","Server Error","Unexpected error — check error.message in body"]].map(([s,t,r])=>e.jsxs("tr",{className:"hover:bg-white/[0.02] transition",children:[e.jsx("td",{className:"px-4 py-2.5",children:e.jsx(l,{label:s,color:s==="400"||s==="500"?"red":"orange"})}),e.jsx("td",{className:"px-4 py-2.5 font-mono text-xs text-white/60",children:t}),e.jsx("td",{className:"px-4 py-2.5 text-white/50 text-xs",children:r})]},s))})]})})]}),e.jsxs("div",{className:"border-t border-white/10 pt-8 pb-4 flex items-center justify-between text-xs text-white/30",children:[e.jsx("span",{children:"QIROX AI API v1.0 · Built by QIROX Systems Factory"}),e.jsx("a",{href:"/admin/qirox-ai",className:"hover:text-white/60 transition",children:"Admin Panel →"})]})]})]})}export{E as default};
