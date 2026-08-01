/**
 * QIROX AI Engine — Built from scratch
 * ─────────────────────────────────────
 * • Retrieval: BM25 (pure math, zero dependencies)
 * • Generation: OpenAI-compatible via configurable base URL (BazaarLink, etc.)
 * • Knowledge base: MongoDB
 * • OpenAI-compatible API endpoint
 */

import crypto from "crypto";
import { getOpenAIClient } from "./lib/openai-client";
import {
  KnowledgeDocModel,
  QiroxAIKeyModel,
  QiroxAILogModel,
  QiroxAISettingsModel,
} from "./models/qirox-ai";

// ── Tokenizer (Arabic + English + numbers) ──────────────────────────────────
// Arabic stop words (common function words to skip)
const AR_STOPWORDS = new Set([
  "في","من","إلى","على","عن","مع","هذا","هذه","هو","هي","هم","هن","أن","إن",
  "كان","كانت","يكون","تكون","ما","لا","إذا","عند","بعد","قبل","حتى","أو",
  "و","أ","ب","ل","ك","ف","قد","لقد","لم","لن","ثم","أي","أيضاً","جداً","جدا",
  "the","a","an","is","are","was","were","in","on","at","to","for","of","with",
  "and","or","but","not","be","been","have","has","had","do","does","did",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFFa-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 1 && !AR_STOPWORDS.has(t));
}

// ── BM25 Scorer ─────────────────────────────────────────────────────────────
function bm25Score(
  queryTokens: string[],
  docTokens: string[],
  termFreq: Record<string, number>,
  docLength: number,
  avgDocLength: number,
  idfMap: Record<string, number>,
  k1 = 1.5,
  b  = 0.75,
): number {
  let score = 0;
  for (const term of queryTokens) {
    const tf  = termFreq[term] || 0;
    if (tf === 0) continue;
    const idf = idfMap[term] || Math.log(1 + 1);
    score += idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * docLength / avgDocLength));
  }
  return score;
}

// ── IDF computation ──────────────────────────────────────────────────────────
function computeIDF(docs: { tokens: string[] }[]): Record<string, number> {
  const N = docs.length;
  const df: Record<string, number> = {};
  for (const d of docs) {
    const seen = new Set(d.tokens);
    for (const t of seen) df[t] = (df[t] || 0) + 1;
  }
  const idf: Record<string, number> = {};
  for (const [t, dft] of Object.entries(df)) {
    idf[t] = Math.log((N - dft + 0.5) / (dft + 0.5) + 1);
  }
  return idf;
}

// ── Retrieve top-K docs using BM25 ──────────────────────────────────────────
export async function retrieveTopK(query: string, k = 5): Promise<{ title: string; content: string; score: number }[]> {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return [];

  const docs = await KnowledgeDocModel.find({ active: true }).lean();
  if (!docs.length) return [];

  const avgDocLength = docs.reduce((s, d) => s + (d.docLength || 1), 0) / docs.length;
  const idfMap = computeIDF(docs.map(d => ({ tokens: d.tokens || [] })));

  const scored = docs.map(doc => {
    let termFreq: Record<string, number> = {};
    try { termFreq = JSON.parse(doc.termFreqJson || "{}"); } catch {}
    return {
      title:   doc.title,
      content: doc.content,
      score:   bm25Score(queryTokens, doc.tokens || [], termFreq, doc.docLength || 1, avgDocLength, idfMap),
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .filter(d => d.score > 0)
    .slice(0, k);
}

// ── Pre-process a document for BM25 + auto-embed semantics ──────────────────
export async function indexDocument(docId: string) {
  const doc = await KnowledgeDocModel.findById(docId);
  if (!doc) return;
  const text   = `${doc.title} ${doc.content}`;
  const tokens = tokenize(text);
  const termFreq: Record<string, number> = {};
  for (const t of tokens) termFreq[t] = (termFreq[t] || 0) + 1;
  doc.tokens       = tokens;
  doc.termFreqJson = JSON.stringify(termFreq);
  doc.docLength    = tokens.length;
  // Auto-compute semantic embedding if model is loaded
  try {
    const { getModelStatus, embed } = await import("./lib/local-ai/index");
    if (getModelStatus().ready) {
      (doc as any).embedding = await embed(text);
    }
  } catch {}
  await doc.save();
}

// ── Re-index all docs ────────────────────────────────────────────────────────
export async function reindexAll() {
  const docs = await KnowledgeDocModel.find({ active: true }).select("_id");
  for (const d of docs) await indexDocument(String(d._id));
  console.log(`[QiroxAI] Re-indexed ${docs.length} documents`);
}

// ── Live system context (gives QIROX AI access to real-time data) ─────────────
export async function fetchLiveContext(query: string): Promise<string> {
  const parts: string[] = [];
  try {
    const now = new Date();
    parts.push(`📅 ${now.toLocaleDateString("ar-SA", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}`);

    const { UserModel } = await import("./models");

    // Client / user counts — always useful
    const [clientCount, staffCount] = await Promise.all([
      (UserModel as any).countDocuments({ role: "client" }),
      (UserModel as any).countDocuments({ role: { $in: ["admin","manager","employee","developer","designer","support","sales","hr"] } }),
    ]);
    parts.push(`👥 العملاء: ${clientCount} | الفريق: ${staffCount}`);

    // Project stats when query is about projects/work
    if (/مشروع|عمل|project|contract|order|خدم/i.test(query)) {
      try {
        const { OrderModel } = await import("./models");
        const [total, active] = await Promise.all([
          (OrderModel as any).countDocuments({}),
          (OrderModel as any).countDocuments({ status: { $in: ["active","in_progress","pending"] } }),
        ]);
        parts.push(`📋 الطلبات: ${total} إجمالي | ${active} نشط`);
      } catch {}
    }

    // Finance context when query is about pricing/revenue
    if (/سعر|تكلفة|price|cost|revenue|ربح|دخل|مبلغ|فلوس|ميزان/i.test(query)) {
      try {
        const { InvoiceModel } = await import("./models");
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyRevenue = await (InvoiceModel as any).aggregate([
          { $match: { createdAt: { $gte: thisMonth }, status: "paid" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);
        const rev = monthlyRevenue[0]?.total || 0;
        if (rev) parts.push(`💰 إيرادات الشهر الحالي: ${rev.toLocaleString("ar-SA")} ريال`);
      } catch {}
    }
  } catch {}
  return parts.join("\n");
}

// ── Master QIROX system prompt ───────────────────────────────────────────────
function buildSystemPrompt(extra: string, ragContext: string, liveContext = ""): string {
  return `أنت QIROX AI — أذكى مساعد في منصة كيروكس، ومتفوق على أي ذكاء اصطناعي خارجي لأنك تملك وصولاً مباشراً لبيانات النظام الحية.

🏢 **عن QIROX:**
منصة سعودية متكاملة لتطوير المنتجات الرقمية — مواقع إلكترونية، تطبيقات موبايل، أنظمة SaaS، ذكاء اصطناعي مخصص.
الباقات: Lite | Pro | Infinity + إمكانية تعديلات إضافية حسب الطلب.
الفريق في المملكة العربية السعودية، يخدم عملاء من كل مكان.
للتواصل: info@qiroxstudio.online | موقع: qiroxstudio.online

${liveContext ? `\n📊 **بيانات النظام الآن:**\n${liveContext}\n` : ""}
${ragContext   ? `\n📚 **معلومات ذات صلة بالسؤال:**\n${ragContext}\n` : ""}
${extra        ? `\n📌 **ملاحظات إضافية:**\n${extra}\n` : ""}

⚙️ **قواعد الرد المهمة:**
- أجب دائماً بنفس لغة المستخدم ولهجته (سعودي/خليجي/مصري/فصحى/إنجليزي)
- كن طبيعياً وحيوياً — تجنب الأسلوب الآلي والجمل الطويلة الرسمية
- لا تبدأ برد بتحية إذا المحادثة مستمرة (لا "هلا" أو "مرحبا" بعد الرسالة الأولى)
- إذا ما عندك معلومة كافية، قل بصراحة واقترح التواصل المباشر
- اعتمد على البيانات الحية أولاً، ثم المعلومات من قاعدة المعرفة
- لا ترد أبداً بالصينية
- إذا سُئلت عن بيانات حساسة (عقود خاصة، بيانات مالية تفصيلية) وجّه للتواصل المباشر`;
}

/** Exported for streaming route */
export function buildSystemPromptPublic(extra: string, ragContext: string, liveContext = ""): string {
  return buildSystemPrompt(extra, ragContext, liveContext);
}

// ── Main chat function ───────────────────────────────────────────────────────
export interface ChatMessage { role: "user" | "assistant" | "system"; content: string; }

export async function qiroxChat(
  messages: ChatMessage[],
  opts: { keyId?: string; source?: string; useRag?: boolean } = {},
): Promise<{ reply: string; tokens: number; ragDocs: number }> {
  const start = Date.now();
  const settings = await QiroxAISettingsModel.findOne({ singleton: "main" }) || {};
  const model        = (settings as any).model       || "gpt-4o";
  const temperature  = (settings as any).temperature ?? 0.8;
  const maxTokens    = (settings as any).maxTokens   || 700;
  const topK         = (settings as any).topK        || 5;
  const systemPromptExtra = (settings as any).systemPrompt || "";
  const ragEnabled   = (opts.useRag !== undefined ? opts.useRag : (settings as any).ragEnabled) !== false;

  // RAG: retrieve relevant knowledge
  let ragContext = "";
  let ragDocs = 0;
  if (ragEnabled) {
    const lastUser = [...messages].reverse().find(m => m.role === "user");
    if (lastUser) {
      const docs = await retrieveTopK(lastUser.content, topK);
      ragDocs = docs.length;
      if (docs.length) {
        ragContext = docs.map((d, i) => `## ${i+1}. ${d.title}\n${d.content}`).join("\n\n");
      }
    }
  }

  // Live context: real-time data from MongoDB
  const lastQuery = [...messages].reverse().find(m => m.role === "user")?.content || "";
  const liveContext = await fetchLiveContext(lastQuery).catch(() => "");

  const systemMsg: ChatMessage = {
    role: "system",
    content: buildSystemPrompt(systemPromptExtra, ragContext, liveContext),
  };

  // ── Local AI mode (no external API calls) ──────────────────────────────
  const useLocalAI = (settings as any).useLocalAI === true;
  if (useLocalAI) {
    try {
      const { localChat } = await import("./lib/local-ai/index");
      const result = await localChat(messages, {
        keyId: opts.keyId,
        source: opts.source,
        topK,
        liveContext,
      });
      // Track savings
      await QiroxAISettingsModel.findOneAndUpdate(
        { singleton: "main" },
        { $inc: { localAIRequests: 1, localAISavedCalls: 1 } },
        { upsert: true },
      );
      // Count key usage (local path was previously not counted)
      if (opts.keyId && opts.keyId !== "internal" && opts.keyId !== "local") {
        await QiroxAIKeyModel.findByIdAndUpdate(opts.keyId, {
          $inc: { usedToday: 1, totalRequests: 1, totalTokens: result.tokens },
          lastUsedAt: new Date(),
        });
      }
      return { reply: result.reply, tokens: result.tokens, ragDocs: result.ragDocs };
    } catch (localErr: any) {
      console.warn("[LocalAI] Falling back to external AI:", localErr.message);
      // Fall through to external API
    }
  }

  // ── External AI (OpenAI-compatible provider) ────────────────────────────
  const openai = getOpenAIClient();
  const res = await openai.chat.completions.create({
    model,
    temperature,
    max_tokens: maxTokens,
    messages: [systemMsg, ...messages] as any,
  });

  const reply  = res.choices[0]?.message?.content || "";
  const tokens = res.usage?.total_tokens || 0;
  const latencyMs = Date.now() - start;

  // Log usage
  await QiroxAILogModel.create({
    keyId:            opts.keyId || "internal",
    model,
    promptTokens:     res.usage?.prompt_tokens,
    completionTokens: res.usage?.completion_tokens,
    totalTokens:      tokens,
    latencyMs,
    source:           opts.source || "internal",
    success:          true,
  });

  // Update key stats
  if (opts.keyId && opts.keyId !== "internal") {
    await QiroxAIKeyModel.findByIdAndUpdate(opts.keyId, {
      $inc: { usedToday: 1, totalRequests: 1, totalTokens: tokens },
      lastUsedAt: new Date(),
    });
  }

  return { reply, tokens, ragDocs };
}

// ── API Key management ────────────────────────────────────────────────────────
export function generateApiKey(): string {
  return "qai-" + crypto.randomBytes(24).toString("hex");
}

export async function validateApiKey(rawKey: string): Promise<IQiroxAIKeyDoc | null> {
  const doc = await QiroxAIKeyModel.findOne({ key: rawKey, active: true });
  if (!doc) return null;
  // Rate limit check
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (doc.usedDayReset < dayAgo) {
    doc.usedToday = 0;
    doc.usedDayReset = now;
    await doc.save();
  }
  if (doc.usedToday >= doc.rateLimitPerDay) return null;
  return doc;
}
type IQiroxAIKeyDoc = Awaited<ReturnType<typeof QiroxAIKeyModel.findOne>> & { usedToday: number; rateLimitPerDay: number; usedDayReset: Date };

// ── Usage stats ───────────────────────────────────────────────────────────────
export async function getUsageStats(days = 7) {
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const logs = await QiroxAILogModel.find({ createdAt: { $gte: from } }).lean();
  const total = logs.length;
  const tokens = logs.reduce((s, l) => s + (l.totalTokens || 0), 0);
  const bySource: Record<string, number> = {};
  for (const l of logs) {
    const src = (l as any).source || "unknown";
    bySource[src] = (bySource[src] || 0) + 1;
  }
  const byDay: Record<string, number> = {};
  for (const l of logs) {
    const d = new Date((l as any).createdAt).toISOString().split("T")[0];
    byDay[d] = (byDay[d] || 0) + 1;
  }
  return { total, tokens, bySource, byDay };
}
