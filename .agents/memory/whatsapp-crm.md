---
name: WhatsApp CRM Integration
description: Free WhatsApp Web integration via @whiskeysockets/baileys — AI auto-responder, admin commands, SSE real-time, conversation UI.
---

# WhatsApp CRM Integration

## Package
- `@whiskeysockets/baileys` — free, no Chrome/Puppeteer needed; uses WhatsApp WebSocket directly
- Installed at root `node_modules/`, 47 packages total

## Architecture

### Server files
- `server/whatsapp-module.ts` — singleton `waModule` (EventEmitter). Manages connection, SSE clients, message persistence, AI timer, admin commands.
- `server/models/whatsapp.ts` — Mongoose models for messages, chats, settings, and the encrypted durable auth snapshot.
- Routes added to end of `server/routes.ts` (before `registerPwaRoutes`):
  - `GET /api/admin/whatsapp/events` — SSE stream (status + message + chat_update events)
  - `GET /api/admin/whatsapp/status`
  - `POST /api/admin/whatsapp/connect` / `disconnect`
  - `GET /api/admin/whatsapp/chats`
  - `GET /api/admin/whatsapp/chats/:chatId/messages`
  - `POST /api/admin/whatsapp/chats/:chatId/send`
  - `POST /api/admin/whatsapp/chats/:chatId/ai-toggle`
  - `GET/PATCH /api/admin/whatsapp/settings`

### Frontend
- `client/src/pages/AdminWhatsApp.tsx` — full WhatsApp-style UI (chat list + messages + composer + settings)
- Route: `/admin/whatsapp` (ADMIN_ONLY guard)
- Nav entry: "واتساب CRM" in employee group

## Key behaviors
- Auth state is used locally through `.whatsapp-auth/`, and an encrypted snapshot is stored in MongoDB using `WA_AUTH_ENCRYPTION_KEY` or `SESSION_SECRET`; a fresh deployment restores it before auto-connect.
- QR code streamed via SSE; frontend renders it with `QRCodeCanvas` from `qrcode.react` (already installed)
- After any incoming message: wait `aiDelaySeconds` (default 60s), then AI replies unless human replied first
- Manual reply from admin panel sets human override for 30 min (suppresses AI)
- Per-chat AI toggle: stored in `WAChatModel.aiEnabled`
- Admin commands: phone numbers in `WASettings.adminNumbers` get elevated access — AI parses their commands as JSON actions

## AI behavior
- System prompt: QIROX identity + services + dialect/language rules
- "Respond in same dialect as user (Saudi, Egyptian, Gulf, English...)"
- "Never respond in Chinese"
- "Warm, casual, friendly — like a colleague"
- Model: gpt-4o, max_tokens=400, temp=0.85

## Admin commands (via WhatsApp from registered admin numbers)
- Natural language → OpenAI parses to JSON action
- Actions: send_link, send_report, create_promo, send_email, toggle_ai, help
- `create_promo` creates a DiscountCodeModel entry

## **Why baileys over whatsapp-web.js**
- No Chrome/Puppeteer needed — works in Replit's Nix environment
- Significantly lighter on resources
- Same QR-based auth flow as WhatsApp Web

## Delivery provider decision
- QIROX uses the persistent QR-connected Baileys/WhatsApp Web session for
  operational, project, and store/system notifications.
- Meta WhatsApp Business is not part of the QIROX operating model. It remains
  an explicit opt-in compatibility path only when `WHATSAPP_PROVIDER=meta` is
  deliberately configured.

**Why:** The QIROX WhatsApp system is the existing always-on WhatsApp Web
connection. Requiring Meta credentials caused normal QIROX notifications to
fail with an irrelevant configuration error.

**How to apply:** Keep Baileys as the default in provider selection and
deployment configuration. Only use Meta when an administrator intentionally
selects it; never infer Meta from the presence of environment variables.

## Project integration verification
- Project-integration delivery tests should stub the shared `waModule.sendNotification`
  method and assert the Arabic structured payload, rather than mocking a Meta HTTP
  request. This keeps tests aligned with the real QR-connected delivery path.

## Connection lifecycle
1. POST /connect → `waModule.connect()` starts Baileys
2. SSE streams QR → frontend shows QRCodeCanvas
3. Admin scans with phone → `connection === 'open'` → status = connected
4. Auto-reconnect on disconnect (except loggedOut/401)
5. SIGTERM/SIGINT → `waModule.shutdown(false)` → closes the socket and keeps encrypted auth for the next deployment
6. POST /disconnect → `waModule.shutdown(true)` → clears local and encrypted auth intentionally

**Why:** Deployment restarts must not look like a manual logout, and local deployment files are not a reliable long-term session store.

**How to apply:** Keep the auth encryption secret stable across deployments. Never clear the persisted snapshot during graceful shutdown; only the explicit disconnect route may clear it.
