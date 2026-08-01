/**
 * QIROX Local AI — Embedding + Generation Engine v2
 *
 * Embedding:   Xenova/all-MiniLM-L6-v2 (23 MB) — multilingual semantic search
 * Generation:  onnx-community/Qwen2.5-0.5B-Instruct (q4 ~300 MB) — Arabic/English LLM
 */

import path from "path";

const CACHE_DIR = path.join(process.cwd(), ".model-cache");

// ══════════════════════════════════════════════════════════════════════════════
// EMBEDDING MODEL — semantic vector search
// ══════════════════════════════════════════════════════════════════════════════

const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";
let embedder: any        = null;
let embLoading: Promise<void> | null = null;
let embReady   = false;
let embError: string | null = null;

export function getModelStatus() {
  return { ready: embReady, loading: embLoading !== null && !embReady, error: embError, modelId: EMBEDDING_MODEL };
}

export async function loadEmbeddingModel(): Promise<void> {
  if (embReady)    return;
  if (embLoading)  { await embLoading; return; }
  embLoading = (async () => {
    try {
      console.log("[LocalAI] Loading embedding model:", EMBEDDING_MODEL);
      // new Function prevents esbuild CJS bundler from rewriting import() → require()
      const _dyn = new Function("m", "return import(m)");
      const { pipeline, env } = await _dyn("@huggingface/transformers");
      env.cacheDir = CACHE_DIR;
      env.allowRemoteModels = true;
      embedder = await pipeline("feature-extraction", EMBEDDING_MODEL, { device: "cpu", dtype: "fp32" });
      embReady = true; embError = null;
      console.log("[LocalAI] ✅ Embedding model ready");
    } catch (e: any) {
      embError = e.message; embReady = false;
      console.error("[LocalAI] Embedding model failed:", e.message);
      throw e;
    }
  })();
  await embLoading;
}

export async function embed(text: string): Promise<number[]> {
  if (!embReady) await loadEmbeddingModel();
  if (!embedder) throw new Error("Embedding model not loaded");
  const out = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(out.data as Float32Array);
}

export function cosineSim(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export function warmupEmbeddingModel() { loadEmbeddingModel().catch(() => {}); }

// ══════════════════════════════════════════════════════════════════════════════
// GENERATION MODEL — local LLM (Qwen2.5-0.5B-Instruct via ONNX)
// ══════════════════════════════════════════════════════════════════════════════

const LLM_MODEL = "onnx-community/Qwen2.5-0.5B-Instruct";
let generator: any = null;
let llmLoading: Promise<void> | null = null;
let llmReady   = false;
let llmError: string | null = null;

export function getGenerationStatus() {
  return { ready: llmReady, loading: llmLoading !== null && !llmReady, error: llmError, modelId: LLM_MODEL };
}

export async function loadGenerationModel(): Promise<void> {
  if (llmReady)   return;
  if (llmLoading) { await llmLoading; return; }
  llmLoading = (async () => {
    try {
      console.log("[LocalAI] Loading generation model:", LLM_MODEL, "(first run downloads ~300 MB)");
      const _dyn = new Function("m", "return import(m)");
      const { pipeline, env } = await _dyn("@huggingface/transformers");
      env.cacheDir = CACHE_DIR;
      env.allowRemoteModels = true;
      generator = await pipeline("text-generation", LLM_MODEL, {
        device: "cpu",
        dtype: "q4",   // 4-bit quantization: speed vs quality tradeoff
      });
      llmReady = true; llmError = null;
      console.log("[LocalAI] ✅ Generation model ready (Qwen2.5-0.5B)");
    } catch (e: any) {
      llmError = e.message; llmReady = false;
      console.error("[LocalAI] Generation model failed:", e.message);
      throw e;
    }
  })();
  await llmLoading;
}

export interface LLMMessage { role: "system" | "user" | "assistant"; content: string; }

/**
 * Generate a response using the local Qwen2.5 model.
 * Falls back with an error if model not loaded.
 */
export async function generateLocal(
  messages: LLMMessage[],
  opts: { maxNewTokens?: number; temperature?: number } = {},
): Promise<string> {
  if (!llmReady) await loadGenerationModel();
  if (!generator) throw new Error("Generation model not loaded");

  const { maxNewTokens = 600, temperature = 0.7 } = opts;

  const out = await generator(messages, {
    max_new_tokens:  maxNewTokens,
    temperature,
    do_sample:       temperature > 0,
    return_full_text: false,
  });

  // transformers.js v3 returns [{generated_text: [...messages, {role, content}]}]
  const raw = out?.[0]?.generated_text;
  if (Array.isArray(raw)) return (raw.at(-1) as any)?.content?.trim() || "";
  if (typeof raw === "string") return raw.trim();
  return "";
}

/** Kick off model loading in the background — call at server startup */
export function warmupGenerationModel() {
  loadGenerationModel().catch(e => console.warn("[LocalAI] LLM warmup deferred:", e.message));
}
