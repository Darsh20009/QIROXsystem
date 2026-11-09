/**
 * Optional external AI client.
 *
 * QIROX's default AI path is local (see server/lib/local-ai). This client is
 * intentionally kept for optional OpenAI-compatible integrations such as
 * BazaarLink or Moonshot. Never make a request through this module unless an
 * external key is configured explicitly.
 */
import OpenAI from "openai";

let _client: OpenAI | null = null;

export function hasExternalAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.MOONSHOT_API_KEY);
}

export function getExternalAIModel(): string {
  return process.env.OPENAI_MODEL
    || (process.env.MOONSHOT_API_KEY && !process.env.OPENAI_API_KEY ? "moonshot-v1-8k" : "gpt-4o");
}

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    const isMoonshot = Boolean(process.env.MOONSHOT_API_KEY && !process.env.OPENAI_API_KEY);
    const apiKey  = process.env.OPENAI_API_KEY || process.env.MOONSHOT_API_KEY;
    if (!apiKey) {
      // Compatibility adapter for older routes that still use the
      // OpenAI-shaped interface. It remains local and has no daily quota.
      const localClient: any = {
        chat: {
          completions: {
            create: async (params: any) => {
              const { localChat } = await import("./local-ai/index");
              const messages = (params.messages || [])
                .filter((m: any) => ["system", "user", "assistant"].includes(m.role))
                .map((m: any) => ({
                  role: m.role,
                  content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
                }));
              const result = await localChat(messages, { source: "local-compat" });
              if (params.stream) {
                async function* stream() {
                  for (const part of result.reply.split(/(\s+)/)) {
                    if (part) yield { choices: [{ delta: { content: part } }] };
                  }
                }
                return stream();
              }
              return {
                choices: [{ message: { role: "assistant", content: result.reply } }],
                usage: { total_tokens: result.tokens },
                model: "qirox-local-qwen2.5-0.5b",
              };
            },
          },
        },
      };
      _client = localClient as OpenAI;
      console.log("[ExternalAI] No external key — local compatibility adapter enabled");
      return _client;
    }
    const baseURL = process.env.OPENAI_BASE_URL || (isMoonshot ? "https://api.moonshot.cn/v1" : undefined);
    _client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
    console.log(`[ExternalAI] Provider: ${baseURL ? baseURL : "openai.com"} | model:${getExternalAIModel()}`);
  }
  return _client;
}

/** Call this when env vars change at runtime (rare). */
export function resetOpenAIClient() {
  _client = null;
}
