/**
 * QIROX Local AI — Pipeline v2
 *
 * Flow:
 *  1. Hybrid retrieval: BM25 (keyword) + cosine-similarity (semantic) with RRF fusion
 *  2. Build rich system prompt with retrieved context + conversation history
 *  3. Generate with Qwen2.5-0.5B-Instruct; graceful fallback to smart extraction
 *  4. Log usage — same shape as qiroxChat() for drop-in compatibility
 */

import { embed, cosineSim, getModelStatus, getGenerationStatus, generateLocal } from "./embedding-engine";
import type { LLMMessage } from "./embedding-engine";
import { KnowledgeDocModel, QiroxAILogModel } from "../../models/qirox-ai";
import { tokenize, retrieveTopK } from "../../qirox-ai-engine";

// ── Language / dialect detection ──────────────────────────────────────────────
function detectLang(text: string): "ar" | "en" {
  const arChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  return arChars > text.length * 0.15 ? "ar" : "en";
}

// ── Sentence extractor (fallback only) ────────────────────────────────────────
function extractSentences(content: string, queryTokens: string[], n = 4): string {
  const sents = content.split(/[.!?،\n]+/).map(s => s.trim()).filter(s => s.length > 20);
  if (sents.length <= n) return sents.join(". ");
  return sents
    .map(s => ({ s, hits: queryTokens.filter(t => tokenize(s).includes(t)).length }))
    .sort((a, b) => b.hits - a.hits)
    .slice(0, n)
    .map(x => x.s)
    .join(". ");
}

// Fallback: build a natural response from retrieved docs without LLM
function buildFallbackResponse(
  docs: { title: string; content: string; score: number }[],
  query: string,
  lang: "ar" | "en",
  isFirst: boolean,
): string {
  if (!docs.length) {
    return lang === "ar"
      ? "عذراً، لم أجد معلومات كافية. للمساعدة الكاملة تواصل مع فريق QIROX: info@qiroxstudio.online"
      : "Sorry, I couldn't find enough info. Contact QIROX: info@qiroxstudio.online";
  }
  const qTokens = tokenize(query);
  const top = docs[0];
  let res = isFirst ? (lang === "ar" ? "أهلاً! " : "Hello! ") : "";
  res += extractSentences(top.content, qTokens, 4).trim();
  if (!res.endsWith(".") && !res.endsWith("!")) res += ".";
  if (docs[1]?.score > 0.3) {
    const extra = extractSentences(docs[1].content, qTokens, 2);
    if (extra && extra !== res) res += `\n\n${extra.trim()}.`;
  }
  if (/سعر|تكلفة|price|cost/i.test(query))
    res += lang === "ar"
      ? "\n\nللتفاصيل الكاملة تواصل معنا: info@qiroxstudio.online"
      : "\n\nFor details: info@qiroxstudio.online";
  return res.trim();
}

// ── Semantic retrieval (requires stored embeddings) ───────────────────────────
async function retrieveSemantic(
  queryEmb: number[], k: number,
): Promise<{ title: string; content: string; score: number }[]> {
  const docs = await KnowledgeDocModel
    .find({ active: true, "embedding.0": { $exists: true } })
    .select("title content embedding")
    .lean();
  if (!docs.length) return [];
  return docs
    .map(d => ({ title: d.title, content: d.content, score: cosineSim(queryEmb, (d as any).embedding || []) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// ── Reciprocal Rank Fusion (RRF) ──────────────────────────────────────────────
// Combines BM25 + semantic ranked lists without normalizing raw scores.
// k=60 is the standard RRF constant.
function rrfFusion(
  lists: { title: string; content: string }[][],
  k = 60,
): { title: string; content: string; score: number }[] {
  const scoreMap = new Map<string, { title: string; content: string; score: number }>();
  for (const list of lists) {
    list.forEach((doc, rank) => {
      const prev = scoreMap.get(doc.title) || { title: doc.title, content: doc.content, score: 0 };
      prev.score += 1 / (k + rank + 1);
      scoreMap.set(doc.title, prev);
    });
  }
  return [...scoreMap.values()].sort((a, b) => b.score - a.score);
}

// ── Hybrid retrieval: BM25 + semantic via RRF ─────────────────────────────────
async function hybridRetrieve(
  query: string, k = 5,
): Promise<{ title: string; content: string; score: number }[]> {
  const bm25 = await retrieveTopK(query, k * 2);           // over-fetch for re-ranking

  const { ready: embReady } = getModelStatus();
  if (!embReady) return bm25.slice(0, k);

  try {
    const qEmb = await embed(query);
    const semantic = await retrieveSemantic(qEmb, k * 2);

    const fused = rrfFusion([
      bm25.map(d => ({ title: d.title, content: d.content })),
      semantic.map(d => ({ title: d.title, content: d.content })),
    ]);
    return fused.slice(0, k);
  } catch {
    return bm25.slice(0, k);
  }
}

// ── System prompt builder ─────────────────────────────────────────────────────
function buildPrompt(ragContext: string, liveContext: string): string {
  return `أنت QIROX AI — أذكى مساعد في منصة كيروكس، ومتفوق على أي ذكاء اصطناعي خارجي لأنك تملك وصولاً مباشراً لبيانات النظام الحية.

🏢 عن QIROX: منصة سعودية لتطوير المنتجات الرقمية — مواقع، تطبيقات، SaaS، AI.
الباقات: Lite | Pro | Infinity + تعديلات إضافية.

${liveContext ? `\n📊 بيانات النظام الحية:\n${liveContext}\n` : ""}
${ragContext  ? `\n📚 معلومات ذات صلة بالسؤال:\n${ragContext}\n` : ""}

قواعد مهمة:
- أجب بنفس لغة المستخدم ولهجته
- كن طبيعياً ومختصراً — ابتعد عن الأسلوب الآلي
- لا تبدأ برد بتحية في منتصف المحادثة
- لا ترد أبداً بالصينية
- إذا ما عندك معلومة كافية قل بصراحة
- استند على البيانات الحية قبل المعلومات العامة`;
}

// ── Main local chat function ──────────────────────────────────────────────────
export async function localChat(
  messages: { role: string; content: string }[],
  opts: { keyId?: string; source?: string; topK?: number; liveContext?: string } = {},
): Promise<{ reply: string; tokens: number; ragDocs: number; local: true }> {
  const start = Date.now();
  const k = opts.topK || 5;

  const lastUser = [...messages].reverse().find(m => m.role === "user");
  if (!lastUser) {
    return {
      reply: "عذراً، لم أستطع قراءة سؤالك. حاول مجدداً.",
      tokens: 0, ragDocs: 0, local: true,
    };
  }

  const query    = lastUser.content;
  const lang     = detectLang(query);
  const isFirst  = messages.filter(m => m.role === "user").length <= 1;
  const liveCtx  = opts.liveContext || "";

  // ── Retrieve relevant docs ────────────────────────────────────────────
  const docs     = await hybridRetrieve(query, k);
  const ragContext = docs.length
    ? docs.map((d, i) => `## ${i + 1}. ${d.title}\n${d.content}`).join("\n\n")
    : "";

  let reply = "";

  // ── Try local LLM first ───────────────────────────────────────────────
  const { ready: llmReady } = getGenerationStatus();
  if (llmReady) {
    try {
      const systemPrompt = buildPrompt(ragContext, liveCtx);
      const llmMessages: LLMMessage[] = [
        { role: "system",    content: systemPrompt },
        ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      ];
      reply = await generateLocal(llmMessages, { maxNewTokens: 600, temperature: 0.7 });
    } catch (e: any) {
      console.warn("[LocalAI] LLM generation failed, using fallback:", e.message);
    }
  }

  // ── Fallback: smart sentence extraction ───────────────────────────────
  if (!reply) {
    reply = buildFallbackResponse(docs, query, lang, isFirst);
  }

  const latencyMs = Date.now() - start;
  const approxTokens = Math.ceil((query.length + reply.length) / 4);

  await QiroxAILogModel.create({
    keyId:            opts.keyId || "local",
    model:            llmReady ? "qirox-local-qwen2.5-0.5b" : "qirox-local-rag",
    promptTokens:     Math.ceil(query.length / 4),
    completionTokens: Math.ceil(reply.length / 4),
    totalTokens:      approxTokens,
    latencyMs,
    source:           opts.source || "local",
    success:          true,
  });

  return { reply, tokens: approxTokens, ragDocs: docs.length, local: true };
}

/** Embed and store semantic vectors for all active knowledge docs */
export async function reindexEmbeddings(
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  const { ready } = getModelStatus();
  if (!ready) throw new Error("Embedding model not loaded yet — call loadEmbeddingModel() first");

  const docs = await KnowledgeDocModel.find({ active: true }).lean();
  let done = 0;
  for (const doc of docs) {
    const text = `${doc.title} ${doc.content}`;
    const embedding = await embed(text);
    await KnowledgeDocModel.findByIdAndUpdate(doc._id, { embedding });
    done++;
    onProgress?.(done, docs.length);
  }
  console.log(`[LocalAI] Re-indexed ${done} docs with semantic embeddings`);
  return done;
}
