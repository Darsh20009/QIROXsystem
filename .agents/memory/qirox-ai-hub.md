---
name: QIROX AI Hub
description: Custom AI platform built from scratch — BM25 RAG, knowledge base, API keys, admin UI, public endpoint.
---

# QIROX AI Hub

## Core concept
"From scratch" means: retrieval (BM25 pure math, zero deps) + knowledge base (MongoDB) + API layer. Generation still uses OpenAI-compatible backend (BazaarLink), but ALL intelligence routing is custom-built.

## Files
- `server/qirox-ai-engine.ts` — BM25 scorer, tokenizer (Arabic+English), RAG pipeline, API key validator, usage logger
- `server/models/qirox-ai.ts` — 4 models: KnowledgeDocModel, QiroxAIKeyModel, QiroxAILogModel, QiroxAISettingsModel
- `client/src/pages/AdminQiroxAI.tsx` — 5-tab admin panel (Chat test, Knowledge, API Keys, Stats, Settings)

## Routes
- `POST /api/qirox-ai/chat` — public OpenAI-compatible endpoint; Bearer token from QiroxAIKey required
- `POST /api/admin/qirox-ai/chat` — admin internal test (session auth)
- `GET/POST/PATCH/DELETE /api/admin/qirox-ai/knowledge` — knowledge base CRUD
- `GET/POST/DELETE /api/admin/qirox-ai/keys` — API key management
- `GET/PATCH /api/admin/qirox-ai/settings` — model config (model, temperature, maxTokens, topK, systemPrompt, ragEnabled)
- `GET /api/admin/qirox-ai/stats` — usage stats (7d default)

## Navigation
- Admin sidebar: "QIROX AI Hub" → /admin/qirox-ai (ADMIN_ONLY)

## BM25 algorithm
- Tokenizer strips Arabic stop words + English stop words; handles Arabic Unicode ranges
- Per-document: tokens[] array + termFreqJson (JSON string) + docLength stored in MongoDB
- At query time: compute IDF from all active docs → BM25 score per doc → top-K returned
- Re-index on doc create/update; `POST /api/admin/qirox-ai/reindex` for bulk re-index

## API key format
- Pattern: `qai-` + 24 random bytes (hex) = `qai-` + 48 chars
- Rate limit: usedToday resets every 24h from `usedDayReset`
- Header: `Authorization: Bearer qai-xxxxx`

## Settings collection
- Singleton pattern: `{ singleton: "main" }` — upsert on every save
- Default model: gpt-4o; temperature: 0.8; maxTokens: 700; topK: 5

**Why BM25 over cosine/embeddings:**
Embeddings require @xenova/transformers which is blocked by Replit's package firewall (protobufjs dependency). BM25 is pure math, works excellent for Arabic/English bilingual retrieval, and has no external dependencies.

**How to apply:**
When adding new "intelligent" features to QIROX AI, extend `qirox-ai-engine.ts`. Do NOT add new OpenAI client instantiations — always use `getOpenAIClient()` from `server/lib/openai-client.ts`.
