// ── AI Configuration ──────────────────────────────────────────────────────────
// OpenAI GPT-4o provider settings.
//
// Purpose:
//   Centralizes AI provider credentials and model selection.
//   Provider: OpenAI when OPENAI_API_KEY is set, disabled otherwise.
//
// Usage:
//   import { buildAiConfig } from "./config/ai";
//   const config = buildAiConfig(process.env);

import {
  type EnvBag,
  type ConfigModule,
  type ConfigValidationResult,
  envInt,
  validResult,
  invalidResult,
} from "./types";

// ── Interface ─────────────────────────────────────────────────────────────────

export type AiProvider = "openai" | "disabled";

export interface OpenAiConfig {
  /** OpenAI API key. Maps to: OPENAI_API_KEY */
  apiKey: string;

  /**
   * Chat completion model ID.
   * Maps to: OPENAI_MODEL. Default: "gpt-4o"
   */
  model: string;

  /**
   * Vision model ID (for image analysis).
   * Maps to: OPENAI_VISION_MODEL. Default: same as model.
   */
  visionModel: string;

  /** Max completion tokens. Maps to: OPENAI_MAX_TOKENS. Default: 4096 */
  maxTokens: number;

  /** Temperature (0–2). Maps to: OPENAI_TEMPERATURE. Default: 0.7 */
  temperature: number;
}

export interface AiConfig {
  /**
   * Active provider.
   * "openai" when OPENAI_API_KEY is set.
   * "disabled" when not set.
   */
  provider: AiProvider;

  openai: OpenAiConfig;

  /**
   * Whether AI features are functionally enabled.
   * True when provider !== "disabled".
   */
  enabled: boolean;

  /**
   * Video generation proxy URL. Maps to: AI_VIDEO_PROXY_URL
   * Used by /api/ai/video-proxy.
   */
  videoProxyUrl?: string;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export const AI_DEFAULTS: Readonly<Partial<AiConfig>> = {
  openai: {
    apiKey:      "",
    model:       "gpt-4o",
    visionModel: "gpt-4o",
    maxTokens:   4096,
    temperature: 0.7,
  },
  provider: "disabled",
  enabled:  false,
};

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildAiConfig(env: EnvBag = process.env): AiConfig {
  const openaiKey = env.OPENAI_API_KEY ?? "";
  const provider: AiProvider = openaiKey ? "openai" : "disabled";

  return {
    provider,
    enabled: provider !== "disabled",

    openai: {
      apiKey:      openaiKey,
      model:       env.OPENAI_MODEL ?? "gpt-4o",
      visionModel: env.OPENAI_VISION_MODEL ?? env.OPENAI_MODEL ?? "gpt-4o",
      maxTokens:   envInt(env.OPENAI_MAX_TOKENS, 4096),
      temperature: parseFloat(env.OPENAI_TEMPERATURE ?? "0.7"),
    },

    ...(env.AI_VIDEO_PROXY_URL ? { videoProxyUrl: env.AI_VIDEO_PROXY_URL } : {}),
  };
}

// ── Validator ─────────────────────────────────────────────────────────────────

export function validateAiConfig(config: AiConfig): ConfigValidationResult {
  const issues = [];
  if (!config.enabled) {
    issues.push({ field: "ai.provider", message: "No AI provider configured — AI features will be disabled", severity: "warning" as const });
  }
  if (config.openai.temperature < 0 || config.openai.temperature > 2) {
    issues.push({ field: "ai.openai.temperature", message: "Temperature must be between 0 and 2", severity: "warning" as const });
  }
  return issues.length ? invalidResult("ai", issues) : validResult("ai");
}

// ── Module ────────────────────────────────────────────────────────────────────

export const aiConfigModule: ConfigModule<AiConfig> = {
  moduleName: "ai",
  defaults:   AI_DEFAULTS,
  build:      buildAiConfig,
  validate:   validateAiConfig,
};
