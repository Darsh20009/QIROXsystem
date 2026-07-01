---
name: QIROX Studio AI
description: Replaced Kimi/Moonshot AI and QI Agent with new OpenAI GPT-4o powered Studio AI page.
---

## What changed
- **Removed**: `AdminKimiAI.tsx`, `QiAgentPage.tsx`, `/api/qi-agent/chat` route, Kimi/Moonshot client in `server/ai.ts`
- **Added**: `QiroxStudio.tsx` page, `/api/studio/chat` backend route

## AI Provider
- Provider: OpenAI standard via `OPENAI_API_KEY`
- Model: `gpt-4o` (vision capable)
- Image generation: Pollinations AI (free, no key needed)

## Routes
- `/employee/studio` → QiroxStudio (full-bleed, no layout)
- `/admin/studio` → QiroxStudio (full-bleed)
- `/employee/qi-agent` → also redirects to QiroxStudio (legacy compat)
- `/admin/kimi-ai` → also redirects to QiroxStudio (legacy compat)

## Features
- Image upload: base64 via FileReader, sent in `images[]` array to backend
- Task attachment: picks from `/api/admin/kanban-tasks`, sent in `tasks[]` array
- Image generation: dedicated panel with 8 style presets via Pollinations
- Vision: images sent as `image_url` content parts to GPT-4o

**Why:** Kimi returned 401 auth errors because `MOONSHOT_API_KEY` was not set and `OPENAI_API_KEY` pointing to a non-Moonshot key caused failures. Switching to standard OpenAI fixes the auth issue.

## Moonshot/Kimi tool schema gotcha
- The EmployeeAIAssistant sidebar (`/api/ai/stream` → `handleStreamChat`) sends the full `QIROX_TOOLS` array; QiroxStudio (`/api/studio/chat`) does NOT, which is why Studio kept working while the sidebar broke.
- **Moonshot's tokenizer rejects JSON-schema union types** (e.g. `type: ["number", "string"]`) inside tool parameters with `400 Invalid request: tokenization failed`. ONE bad tool poisons the whole request, so the entire stream endpoint 500s.
- **Rule:** every property `type` in `QIROX_TOOLS` must be a single JSON-schema type string, never an array. Also never have duplicate function names in the array (also causes tokenization failure).
- Debug method that works: temporarily `export const QIROX_TOOLS`, then a `tsx` script loops each tool one-by-one against Moonshot to isolate the offender (binary-search style).
