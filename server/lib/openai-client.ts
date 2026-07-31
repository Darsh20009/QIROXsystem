/**
 * Shared OpenAI client factory — supports BazaarLink or any OpenAI-compatible endpoint.
 * Set OPENAI_BASE_URL env var to redirect all AI calls (e.g. https://bazaarlink.ai/v1).
 * Set OPENAI_API_KEY for the API key.
 */
import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    const apiKey  = process.env.OPENAI_API_KEY || "placeholder";
    const baseURL = process.env.OPENAI_BASE_URL || undefined;       // undefined → default OpenAI URL
    _client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
    console.log(`[OpenAI] Provider: ${baseURL ? baseURL : "openai.com"} | key:${apiKey !== "placeholder" ? "✓" : "✗"}`);
  }
  return _client;
}

/** Call this when env vars change at runtime (rare). */
export function resetOpenAIClient() {
  _client = null;
}
