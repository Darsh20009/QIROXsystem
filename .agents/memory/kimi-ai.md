---
name: Kimi AI integration
description: All AI calls in the platform now route through Kimi (Moonshot AI) using the OpenAI-compatible SDK. OPENAI_API_KEY secret holds the Moonshot key.
---

# Kimi AI Integration

**Rule:** Every AI completion in the platform must use Kimi (Moonshot AI), not Groq or Pollinations.

**Config:**
- `apiKey`: `process.env.OPENAI_API_KEY`
- `baseURL`: `https://api.moonshot.ai/v1`
- `model`: `kimi-k2-0905-preview`

**Why:** User requested Kimi as the underlying AI provider, keeping the "AI" branding hidden from end users. OPENAI_API_KEY was already set as a Replit secret containing the Moonshot key.

**Files updated:**
- `server/ai.ts` — main AI engine (primary provider, all routes)
- `server/sandbox-routes.ts` — sandbox IDE AI helper (`getOpenAIClient()`)
- `server/qmeet.ts` — two AI summary endpoints for meetings
- `server/routes.ts` — price-request AI help, contract generation, document create/improve

**How to apply:** When adding any new AI feature, always use `new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: "https://api.moonshot.ai/v1" })` with model `kimi-k2-0905-preview`. Never import `groq-sdk` or use Pollinations.
