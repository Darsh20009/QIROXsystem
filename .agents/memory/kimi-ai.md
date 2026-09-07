---
name: Kimi AI integration
description: All AI calls in the platform now route through Kimi (Moonshot AI) using the OpenAI-compatible SDK. OPENAI_API_KEY secret holds the Moonshot key. Streaming SSE endpoint added.
---

# Kimi AI Integration

**Rule:** Every AI completion in the platform must use Kimi (Moonshot AI), not Groq or Pollinations.

**Config:**
- `apiKey`: `process.env.OPENAI_API_KEY`
- `baseURL`: `https://api.moonshot.ai/v1`
- `model`: Auto-detected at startup — tries `kimi-k2-0905-preview` first, falls back to `moonshot-v1-32k` if 404/401. Current key works with `moonshot-v1-32k`.
- `max_tokens`: 4096 (was 2000)

**Why:** User requested Kimi as the underlying AI provider, keeping the "AI" branding hidden from end users. OPENAI_API_KEY was already set as a Replit env var containing the Moonshot key.

**Streaming:**
- New endpoint `/api/ai/stream` (POST) — SSE-based streaming via `handleStreamChat`.
- Frontend `EmployeeAIAssistant.tsx` uses `fetch` + `ReadableStream` to consume SSE events.
- Event types: `tool_start`, `tool_result`, `stream_start`, `delta`, `done`, `error`.

**Tools (31 total):**
- Original 25 tools (get_orders, get_clients, get_analytics, get_employees, get_wallet_info, get_projects, update_order_status, send_notification, cancel_my_order, create_task, send_support_ticket, search_web, send_email, submit_consultation_request, create_quotation, create_invoice, create_order, navigate_to, show_page_preview, list_navigable_pages, generate_qr_code, generate_image, get_face_biometrics, delete_face_biometric, get_biometric_stats, escalate_to_human)
- **New tools added:** `get_finance_report`, `get_kanban_board`, `get_attendance_summary`, `generate_ai_insight`, `get_user_profile`, `send_bulk_message`

**Files updated:**
- `server/ai.ts` — main AI engine (primary provider, all routes, streaming endpoint, new tools)
- `server/sandbox-routes.ts` — sandbox IDE AI helper (`getOpenAIClient()`)
- `server/qmeet.ts` — two AI summary endpoints for meetings
- `server/routes.ts` — price-request AI help, contract generation, document create/improve
- `client/src/components/EmployeeAIAssistant.tsx` — full streaming UI rewrite

**How to apply:** When adding any new AI feature, always use `new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: "https://api.moonshot.ai/v1" })` with model `moonshot-v1-32k`. Never use `kimi-k2-0905-preview` directly (404 on standard keys — use `detectBestModel()` pattern). Never import `groq-sdk` or use Pollinations.
