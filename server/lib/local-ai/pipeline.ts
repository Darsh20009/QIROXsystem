/**
 * QIROX Local AI — Main Pipeline
 * 
 * Flow:
 *  1. Embed the user query (semantic vector)
 *  2. Hybrid retrieval: BM25 (keyword) + cosine similarity (semantic)
 *  3. Smart response construction from retrieved context
 *  4. Returns same shape as qiroxChat() — drop-in compatible
 */

import { embed, cosineSim, getModelStatus } from "./embedding-engine";
import { KnowledgeDocModel, QiroxAILogModel } from "../../models/qirox-ai";
import { tokenize, retrieveTopK } from "../../qirox-ai-engine";

// ── Response Templates ───────────────────────────────────────────────────────
const GREETING_AR = [
  "أهلاً! ", "هلا! ", "مرحباً! ", "يسعدني مساعدتك! ",
];
const SORRY_AR = "عذراً، لم أجد معلومات كافية للإجابة على سؤالك. للمزيد، تواصل مع فريق QIROX مباشرة.";

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function detectLanguage(text: string): "ar" | "en" {
  const arChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  return arChars > text.length * 0.2 ? "ar" : "en";
}

function detectIntent(text: string): "pricing" | "services" | "contact" | "faq" | "general" {
  const lower = text.toLowerCase();
  const t = text;

  if (/سعر|أسعار|تكلفة|باقة|اشتراك|price|pricing|cost|plan|subscription/i.test(t)) return "pricing";
  if (/خدمة|خدمات|تصميم|تطوير|تطبيق|موقع|service|design|develop|app|website/i.test(t)) return "services";
  if (/تواصل|اتصال|ايميل|هاتف|contact|email|phone|reach|call/i.test(t)) return "contact";
  if (/كيف|ما هو|ما هي|شرح|وضح|how|what is|explain|tell me/i.test(t)) return "faq";
  return "general";
}

/** Extract the N most relevant sentences from a doc given query tokens */
function extractRelevantSentences(content: string, queryTokens: string[], n = 3): string {
  const sentences = content
    .split(/[.!?،\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);

  if (sentences.length <= n) return sentences.join(". ");

  const scored = sentences.map(s => {
    const sTokens = tokenize(s);
    const hits = queryTokens.filter(t => sTokens.includes(t)).length;
    return { s, hits };
  });

  return scored
    .sort((a, b) => b.hits - a.hits)
    .slice(0, n)
    .map(x => x.s)
    .join(". ");
}

/** Build a natural response from retrieved docs */
function buildResponse(
  docs: { title: string; content: string; score: number }[],
  query: string,
  lang: "ar" | "en",
  intent: string,
  isFirstMessage: boolean,
): string {
  if (docs.length === 0) {
    return lang === "ar" ? SORRY_AR : "Sorry, I couldn't find enough information. Please contact the QIROX team directly.";
  }

  const queryTokens = tokenize(query);
  const topDoc = docs[0];
  const extracted = extractRelevantSentences(topDoc.content, queryTokens, 4);

  let response = "";

  // Greeting only on first message
  if (isFirstMessage) {
    response += lang === "ar" ? pickRandom(GREETING_AR) : "Hello! ";
  }

  // Main answer from extracted sentences
  if (extracted.trim()) {
    response += extracted.trim();
    if (!response.endsWith(".") && !response.endsWith("!")) response += ".";
  }

  // Supplement from second doc if relevant
  if (docs.length > 1 && docs[1].score > 0.3) {
    const extra = extractRelevantSentences(docs[1].content, queryTokens, 2);
    if (extra && extra !== extracted) {
      response += `\n\n${extra.trim()}.`;
    }
  }

  // Contact footer for pricing / contact intents
  if (intent === "pricing" || intent === "contact") {
    response += lang === "ar"
      ? "\n\nللمزيد من التفاصيل، تواصل معنا عبر واتساب أو البريد: info@qiroxstudio.online"
      : "\n\nFor more details, contact us via WhatsApp or email: info@qiroxstudio.online";
  }

  return response.trim() || (lang === "ar" ? SORRY_AR : "Please contact QIROX team for more details.");
}

// ── Semantic retrieval using stored embeddings ────────────────────────────────
async function retrieveSemantic(
  queryEmbedding: number[],
  k: number,
): Promise<{ title: string; content: string; semanticScore: number }[]> {
  const docs = await KnowledgeDocModel
    .find({ active: true, "embedding.0": { $exists: true } })
    .select("title content embedding")
    .lean();

  if (!docs.length) return [];

  return docs
    .map(d => ({
      title: d.title,
      content: d.content,
      semanticScore: cosineSim(queryEmbedding, (d as any).embedding || []),
    }))
    .sort((a, b) => b.semanticScore - a.semanticScore)
    .slice(0, k);
}

// ── Hybrid retrieval: BM25 + semantic ─────────────────────────────────────────
async function hybridRetrieve(
  query: string,
  k = 5,
): Promise<{ title: string; content: string; score: number }[]> {
  // Always get BM25 results
  const bm25Results = await retrieveTopK(query, k);

  // Try semantic if model is ready
  const { ready } = getModelStatus();
  if (!ready) return bm25Results;

  try {
    const queryEmb = await embed(query);
    const semanticResults = await retrieveSemantic(queryEmb, k);

    // Merge: normalize scores and combine
    const bm25Max = bm25Results[0]?.score || 1;
    const combined: Map<string, { title: string; content: string; score: number }> = new Map();

    for (const d of bm25Results) {
      combined.set(d.title, { ...d, score: (d.score / bm25Max) * 0.4 });
    }
    for (const d of semanticResults) {
      const existing = combined.get(d.title);
      if (existing) {
        existing.score += d.semanticScore * 0.6;
      } else {
        combined.set(d.title, { title: d.title, content: d.content, score: d.semanticScore * 0.6 });
      }
    }

    return [...combined.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  } catch {
    return bm25Results;
  }
}

// ── Local chat function (drop-in for qiroxChat) ───────────────────────────────
export async function localChat(
  messages: { role: string; content: string }[],
  opts: { keyId?: string; source?: string; topK?: number } = {},
): Promise<{ reply: string; tokens: number; ragDocs: number; local: true }> {
  const start = Date.now();
  const k = opts.topK || 5;

  const lastUser = [...messages].reverse().find(m => m.role === "user");
  if (!lastUser) return { reply: SORRY_AR, tokens: 0, ragDocs: 0, local: true };

  const query = lastUser.content;
  const lang = detectLanguage(query);
  const intent = detectIntent(query);
  const isFirstMessage = messages.filter(m => m.role === "user").length <= 1;

  // Retrieve relevant docs
  const docs = await hybridRetrieve(query, k);

  // Build response
  const reply = buildResponse(docs, query, lang, intent, isFirstMessage);
  const latencyMs = Date.now() - start;

  // Log usage
  await QiroxAILogModel.create({
    keyId: opts.keyId || "local",
    model: "qirox-local-v1",
    promptTokens: Math.ceil(query.length / 4),
    completionTokens: Math.ceil(reply.length / 4),
    totalTokens: Math.ceil((query.length + reply.length) / 4),
    latencyMs,
    source: opts.source || "local",
    success: true,
  });

  return {
    reply,
    tokens: Math.ceil((query.length + reply.length) / 4),
    ragDocs: docs.length,
    local: true,
  };
}

/** Embed and store vectors for all active knowledge docs */
export async function reindexEmbeddings(onProgress?: (done: number, total: number) => void): Promise<number> {
  const { ready } = getModelStatus();
  if (!ready) throw new Error("Embedding model not loaded yet");

  const docs = await KnowledgeDocModel.find({ active: true }).lean();
  let done = 0;

  for (const doc of docs) {
    const text = `${doc.title} ${doc.content}`;
    const embedding = await embed(text);
    await KnowledgeDocModel.findByIdAndUpdate(doc._id, { embedding });
    done++;
    onProgress?.(done, docs.length);
  }

  console.log(`[LocalAI] Reindexed ${done} docs with semantic embeddings`);
  return done;
}
