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
- `server/models/whatsapp.ts` — three Mongoose models: `WAMessageModel`, `WAChatModel`, `WASettingsModel`
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
- Auth state saved to `.whatsapp-auth/` directory (persists across restarts via `useMultiFileAuthState`)
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

## Connection lifecycle
1. POST /connect → `waModule.connect()` starts Baileys
2. SSE streams QR → frontend shows QRCodeCanvas
3. Admin scans with phone → `connection === 'open'` → status = connected
4. Auto-reconnect on disconnect (except loggedOut/401)
5. POST /disconnect → `waModule.shutdown(true)` → clears `.whatsapp-auth/`
