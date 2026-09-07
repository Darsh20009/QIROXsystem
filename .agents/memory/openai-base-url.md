---
name: OpenAI base URL — BazaarLink support
description: All AI calls go through a single shared singleton; OPENAI_BASE_URL env var redirects to any OpenAI-compatible provider.
---

# OpenAI Base URL — BazaarLink / Custom Provider

## Singleton
`server/lib/openai-client.ts` exports `getOpenAIClient()` and `resetOpenAIClient()`.
- `getOpenAIClient()` creates ONE client on first call, reuses on subsequent calls
- Reads `OPENAI_API_KEY` (key) and `OPENAI_BASE_URL` (base URL) from env at startup

## BazaarLink setup
Set two env vars:
- `OPENAI_API_KEY` = the API key from https://bazaarlink.ai/keys
- `OPENAI_BASE_URL` = the API endpoint (e.g. `https://bazaarlink.ai/v1`)

If `OPENAI_BASE_URL` is not set, defaults to OpenAI's standard endpoint.

## Files updated to use shared client
All 13 previous `new OpenAI({apiKey:...})` calls replaced:
- `server/ai.ts` — `getOpenAIClient()` in `getOpenAIClient()` function
- `server/whatsapp-module.ts` — both AI generation + admin command handler
- `server/deployment-cloud.ts` — `getAIClient()`
- `server/routes.ts` — enhance-idea, kimi, price-request, contract, document-assistant
- `server/qmeet.ts` — meeting summary (2 endpoints)
- `server/sandbox-routes.ts` — `getOpenAIClient()` wrapper

**Why:**
Single env var change redirects ALL AI calls to BazaarLink or any OpenAI-compatible provider. No code changes needed per-provider.

**How to apply:**
Never write `new OpenAI({...})` directly. Always import and call `getOpenAIClient()` from `./lib/openai-client`.
