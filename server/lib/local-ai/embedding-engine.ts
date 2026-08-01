/**
 * QIROX Local AI — Embedding Engine
 * Uses @huggingface/transformers (ONNX runtime, no external API)
 * Model: Xenova/all-MiniLM-L6-v2 (~23MB) — multilingual semantic embeddings
 */

import path from "path";

let embedder: any = null;
let loadingPromise: Promise<any> | null = null;
let modelReady = false;
let modelError: string | null = null;

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";
const CACHE_DIR = path.join(process.cwd(), ".model-cache");

export function getModelStatus(): { ready: boolean; loading: boolean; error: string | null; modelId: string } {
  return {
    ready: modelReady,
    loading: loadingPromise !== null && !modelReady,
    error: modelError,
    modelId: MODEL_ID,
  };
}

export async function loadEmbeddingModel(): Promise<void> {
  if (modelReady) return;
  if (loadingPromise) { await loadingPromise; return; }

  loadingPromise = (async () => {
    try {
      console.log("[LocalAI] Loading embedding model:", MODEL_ID);
      const { pipeline, env } = await import("@huggingface/transformers" as any);

      // Set cache dir — persist models across restarts
      env.cacheDir = CACHE_DIR;
      env.allowRemoteModels = true;

      embedder = await pipeline("feature-extraction", MODEL_ID, {
        device: "cpu",
        dtype: "fp32",
      });

      modelReady = true;
      modelError = null;
      console.log("[LocalAI] Embedding model ready ✅");
    } catch (err: any) {
      modelError = err.message;
      modelReady = false;
      console.error("[LocalAI] Failed to load embedding model:", err.message);
      throw err;
    }
  })();

  await loadingPromise;
}

/** Convert text to a normalized embedding vector */
export async function embed(text: string): Promise<number[]> {
  if (!modelReady) await loadEmbeddingModel();
  if (!embedder) throw new Error("Embedding model not loaded");

  const output = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

/** Cosine similarity between two vectors */
export function cosineSim(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na  += a[i] * a[i];
    nb  += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/** Start loading model in background (call at server startup) */
export function warmupEmbeddingModel(): void {
  loadEmbeddingModel().catch(() => {});
}
