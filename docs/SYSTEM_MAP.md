# SYSTEM_MAP.md — QIROX Complete System Architecture Map

> **Mode:** Blueprint only. No code modified.
> **Date:** 2026-07-08

---

## 1. Top-Level System Diagram

```
┌───────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                   │
│                                                                        │
│  Browser (React SPA)          iOS App (Capacitor)  Android (TWA)      │
│  ├── Public Portal            ├── Native Wrapper     └── Chrome TWA   │
│  ├── Client Portal            └── → qiroxstudio.online                │
│  ├── Employee Portal                                                   │
│  ├── Admin Panel                                                       │
│  ├── DeploymentCloud                                                   │
│  └── QMeet (WebRTC)                                                    │
└────────────────────┬──────────────────────────────────────────────────┘
                     │  HTTPS + WSS (WebSocket) + SSE
                     │  Port 5000 (dev) / Render (prod)
┌────────────────────▼──────────────────────────────────────────────────┐
│                       EXPRESS 5 SERVER                                 │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                     MIDDLEWARE CHAIN                             │  │
│  │  compression → trust proxy → CORS → session → passport →        │  │
│  │  body-parser(50MB) → multer → rate-limit → routes               │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  Auth    │ │  Routes  │ │ Sandbox  │ │  QMeet   │ │ Deploy   │   │
│  │ (Passport│ │ (16,975  │ │  Routes  │ │  Routes  │ │  Cloud   │   │
│  │ + Session│ │  lines)  │ │ (1,296L) │ │ (1,193L) │ │ (1,018L) │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  AI Svc  │ │  Email   │ │   PDF    │ │  PayPal  │ │  cPanel  │   │
│  │(3,535L)  │ │ (1,314L) │ │  (486L)  │ │  (188L)  │ │  (224L)  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└───────┬───────────────┬──────────────────┬────────────────┬───────────┘
        │               │                  │                │
┌───────▼──────┐ ┌──────▼───────┐ ┌───────▼──────┐ ┌──────▼───────────┐
│   MongoDB    │ │  PostgreSQL  │ │  File System │ │  External APIs   │
│   (Atlas)    │ │  (Drizzle)   │ │  uploads/    │ │                  │
│              │ │  [limited]   │ │  sandbox-    │ │  OpenAI / Kimi   │
│  Primary DB  │ │              │ │  projects/   │ │  PayPal          │
│  Sessions    │ │              │ │              │ │  SMTP (cPanel)   │
│  (connect-   │ │              │ │              │ │  Atlas Admin API │
│   mongo)     │ │              │ │              │ │  GitHub OAuth    │
│              │ │              │ │              │ │  Google OAuth    │
│  QMeet DB    │ │              │ │              │ │  Apple OAuth     │
│  (separate   │ │              │ │              │ │  Serper (search) │
│   or same)   │ │              │ │              │ │  VAPID (push)    │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘
```

---

## 2. Request Lifecycle

```
User Action (click / form submit)
    │
    ▼
React Component
    │ TanStack Query (useQuery / useMutation)
    ▼
HTTP Request → /api/[endpoint]
    │
    ▼
Express Middleware Stack:
    1. compression()            — gzip/brotli response
    2. trust proxy              — correct IP behind Render/Replit
    3. express.json({ 50MB })   — parse body
    4. session()                — load session from MongoDB
    5. passport.initialize()    — attach passport to req
    6. passport.session()       — deserialize user from session
    7. Rate limiter (if present)
    8. Route handler
    │
    ▼
Route Handler (server/routes.ts)
    │ req.isAuthenticated() check
    │ Role check (req.user.role)
    │ Manual body validation
    │
    ▼
Mongoose Model Operation (MongoDB Atlas)
    │
    ▼
JSON Response → TanStack Query cache
    │
    ▼
React re-render
```

---

## 3. WebSocket Connection Map

```
Client (browser / Capacitor)
    │ WebSocket upgrade at /ws
    ▼
server/ws.ts — WebSocket Hub
    ├── pushToUser(userId, payload)        — targeted push
    ├── broadcastToUsers(ids[], payload)   — multi-user broadcast
    └── broadcastSandboxLog(pid, ...)      — sandbox IDE log streaming

Events emitted:
    qmeet_started / qmeet_ended           → QMeet room lifecycle
    notification                          → in-app notification badge
    sandbox_log                           → IDE terminal output
    inbox_message                         → new internal message
    order_update                          → order status change
    wallet_update                         → wallet balance change
```

---

## 4. AI System Map

```
Client → POST /api/ai/chat (SSE stream)
    │
    ▼
server/ai.ts — Smart Provider Router
    │
    ├── OPENAI_API_KEY present?
    │       └── GPT-4o (vision on, no Chinese)
    │
    └── MOONSHOT_API_KEY present?
            └── Kimi (vision off)

AI Tool Executor:
    POST /api/ai/chat → LLM tool call response
        └── AI tool name → Mongoose model operation
            ├── createInvoice → InvoiceModel.create()
            ├── getOrders → OrderModel.find()
            ├── createTask → TaskModel.create()
            └── ... (many more tool bindings)

Image Generation:
    POST /api/ai/image → Arabic prompt → English translation → Flux API

Video Generation:
    POST /api/ai/video-proxy → External video generation API
```

---

## 5. Payment Flow Map

```
Client selects payment method
    │
    ├── Bank Transfer
    │       Client uploads proof → /api/orders (paymentProofUrl)
    │       Admin reviews → POST /api/admin/orders/:id/approve-transfer
    │       → Invoice created → Notification sent
    │
    ├── PayPal
    │       POST /api/paypal/create-order → PayPal SDK → orderId
    │       Client completes PayPal flow (JS)
    │       POST /api/paypal/capture-order → PayPal capture → verify
    │       → Order marked paid → Invoice created
    │
    ├── Internal Wallet
    │       POST /api/wallet/pay
    │       → Atomic balance deduction (MongoDB transaction)
    │       → Invoice auto-created
    │
    └── Mixed (Wallet + PayPal)
            Both flows triggered, combined
```

---

## 6. Mail System Map

```
server/email.ts — Primary email sender
    │
    ├── getEmailCfg() — reads from:
    │       connManager.emailSettings (live DB config)
    │       OR process.env.CPANEL_SMTP_HOST / SMTP_HOST
    │
    ├── sendEmail(to, toName, subject, html)
    │       → nodemailer.createTransport({ cPanel SMTP })
    │       → sendMail()
    │
    ├── sendEmailAs(fromEmail, ...) — role-specific sender
    │       → looks up MailAccountModel in MongoDB
    │       → sends from hr@, marketing@, etc.
    │
    └── Triggered by:
            Order created / approved
            Invoice generated
            Password reset
            Employee invitation
            QMeet invitation / reminder
            Subscription confirmation
            Support ticket update

server/email-marketing.ts — Campaign sender
    → EmailCampaignModel records
    → Batch sends to subscriber lists
    → Tracks open/delivery (estimated)
```

---

## 7. Notification System Map

```
Trigger (server-side event)
    │
    ├── In-App Notification
    │       NotificationModel.create()
    │       → pushToUser() via WebSocket
    │       → Client NotificationBell updates count
    │
    ├── Push Notification (VAPID)
    │       PushSubscriptionModel.find({ userId })
    │       → web-push.sendNotification()
    │       → Browser/OS notification
    │
    └── Capacitor Push (iOS/Android)
            @capacitor/push-notifications
            → APN (iOS) / FCM (Android)
            → Device notification tray
```

---

## 8. QMeet (Video) System Map

```
Client → POST /api/qmeet/meetings (create room)
    → QMeetingModel.create({ roomName, joinCode, ... })
    → Email invites sent to participants

Client → GET /api/qmeet/meetings/:id/join
    → Returns room credentials
    → Client opens WebRTC session (via third-party or native WebRTC)

QMeet Scheduler (setInterval):
    → Auto-start: scheduledAt reached → status: live → WS broadcast
    → Auto-end: duration exceeded → status: completed → cleanup
    → Reminder emails: 15min before

Room lifecycle:
    scheduled → live → completed → archived

AI Summary:
    POST /api/qmeet/meetings/:id/ai-summary
    → Transcript text sent to OpenAI/Kimi
    → Arabic structured summary returned
```

---

## 9. Storage System Map

```
Current (LOCAL DISK — not scalable):
    multer → disk storage → uploads/{hash}.{ext}
    Served at /uploads/{filename}

Required Future (OBJECT STORAGE):
    multer → memory storage → object storage SDK
    CDN URL stored in DB → served from CDN edge

Upload types:
    Profile photos         → uploads/profile_{userId}.{ext}
    Bank transfer proofs   → uploads/{hash}.{jpg/png/pdf}
    Contract documents     → uploads/{hash}.{pdf/docx}
    Product images         → uploads/{hash}.{jpg/png/webp}
    Marketing assets       → uploads/{hash}.{*}
```

---

## 10. Deployment Architecture

```
Code Push (GitHub)
    │
    ├── Replit (Development)
    │       npm run dev → tsx server/index.ts → port 5000
    │       Vite HMR for client
    │
    ├── Render (Production — render.yaml)
    │       npm run build → vite + esbuild
    │       npm run start → node dist/index.cjs
    │       keepAliveTimeout: 120s
    │
    └── Codemagic (Mobile CI/CD)
            iOS: xcodebuild → .ipa → TestFlight / App Store
            Android: gradle → .aab → Google Play
```

---

## 11. Connection Health Map

```
MongoDB Atlas
    ├── Primary connection (MONGODB_URI)
    ├── Session store (connect-mongo)
    ├── QMeet database (separate collection/db)
    └── Live switching via AdminConnectionSettings → connection-manager.ts

SMTP / cPanel
    ├── Primary: CPANEL_SMTP_HOST (port 465, SSL)
    ├── Fallback: SMTP2GO_API_KEY (if cPanel unavailable)
    └── Per-account: MailAccountModel (hr@, marketing@, etc.)

All connections:
    No startup validation — missing vars discovered at runtime
    No circuit breaker — single failure cascades
    No health check endpoint confirmed
```
