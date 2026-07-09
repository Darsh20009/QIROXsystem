# Sprint 2 — Enterprise Backend Architecture Design (Revised)

**Status:** Phase 1 — Design Only. No code has been modified.  
**Date:** 2026-07-09  
**Revision:** v2 — Raised to enterprise standard per approval feedback.  
**Scope:** server/ directory only. UI, shared/, and client/ are unchanged.

---

## 1. Current State Assessment

### File inventory (server/)

| File | Lines | Current role | Problem |
|---|---|---|---|
| `routes.ts` | 16,406 | Monolith — all business logic, all routes, all validation | Everything mixed in one file |
| `ai.ts` | 3,545 | AI routes + logic | Already separate; needs layering |
| `sandbox-routes.ts` | 1,316 | Sandbox IDE routes | Already separate; needs layering |
| `email.ts` | 1,314 | SMTP helpers + templates | Logic and transport mixed |
| `qmeet.ts` | 1,193 | QMeet video conferencing | Already separate; needs layering |
| `index.ts` | 1,066 | App bootstrap + middleware | Too fat; should be thin |
| `deployment-cloud.ts` | 1,018 | Cloud deployment routes | Already separate; needs layering |
| `email-marketing.ts` | 618 | Bulk email campaign routes | Already separate; needs layering |
| `storage.ts` | 615 | Partial repository layer | Covers ~20% of DB access; partial |
| `pdf.ts` | 486 | PDF generation | Utility; needs home in infrastructure |
| `mail-imap.ts` | 455 | IMAP client wrapper | External integration; belongs in infrastructure |
| `changelog.ts` | 367 | Changelog data | Belongs in system domain |
| `routes-pwa.ts` | 327 | PWA/push subscription routes | Already separate |
| `crm.ts` | 162 | CRM routes | Already separate; very thin |
| `auth.ts` | 156 | Passport config | Infrastructure; fine as-is |
| `notify.ts` | 157 | Notification dispatch helpers | Belongs in notifications domain |
| `atlas.ts` | 150 | MongoDB Atlas API client | External integration; belongs in infrastructure |
| `push.ts` | 101 | Web push helpers | External integration; belongs in infrastructure |
| `paypal.ts` | 188 | PayPal SDK wrapper | External integration; belongs in infrastructure |
| `ws.ts` | 275 | WebSocket hub | Infrastructure; fine as-is |

### Models inventory (server/models/) — already domain-split, keep as-is

| File | Domain | Models |
|---|---|---|
| `user.ts` | Identity | UserModel |
| `auth.ts` | Identity | OtpModel, WebAuthnCredentialModel, DeviceTokenModel, Pending2FAModel, PushChallengeModel, PhoneVerifyOtpModel, ClientApiKeyModel, AuthAppModel, AuthAppEnrollmentModel |
| `hr.ts` | Employees | AttendanceModel, EmployeeProfileModel, PromotionLogModel, FaceDescriptorModel |
| `orders.ts` | Orders | OrderModel, CartModel, OrderSpecsModel, ModificationRequestModel, ModPlanConfigModel, ModTypePriceModel, SubServiceRequestModel, OrderExpenseModel, PriceRequestModel, ReviewModel, ContractModel |
| `finance.ts` | Payments | InvoiceModel, ReceiptVoucherModel, ActivityLogModel, PayrollRecordModel, WalletTransactionModel, WalletTopupModel, JournalEntryModel, QuotationModel |
| `projects.ts` | Projects | ProjectModel, TaskModel, ProjectMemberModel, MessageModel, ProjectVaultModel, TimeLogModel, ProjectCommentModel, ClientDataRequestModel, KanbanTaskModel |
| `crm.ts` | CRM | CrmLeadModel, CrmLeadNoteModel, CrmDealModel, CrmContactModel, LeadDataModel, SwitchReminderModel |
| `comms.ts` | Notifications | NotificationModel, InboxMessageModel, CsSessionModel, SupportTicketModel, PushSubscriptionModel, GroupChatModel, GroupMessageModel |
| `services.ts` | Products | ServiceModel, SectorTemplateModel, PricingPlanModel, SegmentPricingModel, ExtraAddonModel, ProjectAddonSubscriptionModel |
| `content.ts` | Content | NewsModel, JobModel, ApplicationModel, PartnerModel, ContactMessageModel |
| `ecommerce.ts` | Store | QiroxProductModel, DiscountCodeModel, DeviceShipmentModel, ShippingCompanyModel, CountryModel |
| `system.ts` | System | CronJobModel, AtlasConfigModel, QiroxSystemSettingsModel, AppPublishConfigModel |
| `meetings.ts` | QMeet | ConsultationSlotModel, ConsultationBookingModel, QMeetingModel, QFeedbackModel, QReportModel |
| `installments.ts` | Finance | InstallmentOfferModel, InstallmentApplicationModel, InstallmentPaymentModel, LoyaltyAccountModel, LoyaltyTransactionModel |
| `mail.ts` | Mail | MailAccountModel, MailMessageModel, MailFolderModel |
| `sandbox.ts` | Sandbox | SandboxProjectModel, SandboxEnvVarModel, SandboxFileModel, SandboxDeploymentModel |
| `deployment.ts` | Deployment | DeploymentProjectModel, DeploymentRunModel |
| `client-tools.ts` | Customers | HtmlPublishModel, ShortUrlModel, ReferralModel, ClientWebhookModel, EmbedTokenModel |

---

## 2. Architectural Layers

The target architecture separates the backend into five distinct layers. Each layer has a single responsibility and a defined boundary.

```
┌────────────────────────────────────────────────────────────┐
│                        CONFIGURATION                        │
│  Centralized, validated, typed config for all subsystems   │
└────────────────────────────────────────────────────────────┘
           ↓ consumed by all layers below
┌────────────────────────────────────────────────────────────┐
│                           CORE                              │
│  Errors · Logger · Events · Constants · Types · Flags       │
└────────────────────────────────────────────────────────────┘
           ↓ consumed by all layers below
┌────────────────────────────────────────────────────────────┐
│                       INFRASTRUCTURE                        │
│  Database · SMTP · Push · AI Providers · OAuth · Storage   │
│  PayPal · IMAP · Atlas · Firebase · PDF · WebSocket        │
└────────────────────────────────────────────────────────────┘
           ↓ consumed by domain layer
┌────────────────────────────────────────────────────────────┐
│                          DOMAINS                            │
│  auth · users · employees · orders · payments · projects   │
│  crm · notifications · ai · qmeet · system · content ...   │
│                                                             │
│  Each domain:  routes → controller → service → domain      │
│                              ↓                             │
│                         repository → infrastructure         │
└────────────────────────────────────────────────────────────┘
           ↓ entry point
┌────────────────────────────────────────────────────────────┐
│                          SHARED                             │
│  Middleware · Guards · Rate limiters · Upload · Response    │
└────────────────────────────────────────────────────────────┘
```

---

## 3. Target Folder Structure

```
server/
│
├── index.ts                          ← slim orchestrator (keep; reduce to ~100 lines)
│
├── config/                           ← CONFIGURATION LAYER
│   ├── index.ts                      ← exports unified AppConfig object
│   ├── app.config.ts                 ← port, environment, trust proxy, CORS
│   ├── database.config.ts            ← MongoDB URIs, pool sizes, timeouts
│   ├── mail.config.ts                ← SMTP host, sender, logo URL
│   ├── storage.config.ts             ← upload path, max sizes, allowed MIME types
│   ├── security.config.ts            ← session secret, bcrypt rounds, JWT TTL, CORS origins
│   ├── seo.config.ts                 ← default meta, sitemap base URL, OG defaults
│   ├── payments.config.ts            ← PayPal client ID, mode (sandbox/live)
│   ├── ai.config.ts                  ← provider selection, model names, timeouts, rate limits
│   ├── apple.config.ts               ← Apple OAuth, Sign-in-with-Apple keys
│   └── google.config.ts              ← Google OAuth, client ID/secret
│
├── core/                             ← CORE LAYER — no external dependencies
│   ├── errors/
│   │   ├── AppError.ts               ← base operational error class
│   │   ├── DomainError.ts            ← business rule violation
│   │   ├── InfrastructureError.ts    ← external service failure
│   │   ├── ValidationError.ts        ← input validation failure
│   │   └── errorCodes.ts             ← machine-readable error code registry
│   │
│   ├── logger/
│   │   ├── index.ts                  ← exports logger instance
│   │   ├── logger.ts                 ← structured logger (Winston or Pino)
│   │   ├── transports/
│   │   │   ├── console.transport.ts  ← structured console output
│   │   │   ├── file.transport.ts     ← rotating file logs
│   │   │   └── audit.transport.ts    ← audit log persistence (DB or file)
│   │   └── context.ts                ← request correlation ID (AsyncLocalStorage)
│   │
│   ├── events/
│   │   ├── EventBus.ts               ← typed in-process event bus
│   │   ├── EventEmitter.ts           ← pub/sub core
│   │   └── events.ts                 ← all domain event type definitions (see §8)
│   │
│   ├── constants/
│   │   ├── roles.ts                  ← USER_ROLES enum
│   │   ├── orderStatus.ts            ← ORDER_STATUS enum
│   │   ├── paymentStatus.ts          ← PAYMENT_STATUS enum
│   │   └── httpStatus.ts             ← HTTP status code constants
│   │
│   ├── types/
│   │   ├── common.types.ts           ← Pagination, SortOrder, ApiResponse<T>
│   │   ├── auth.types.ts             ← AuthUser, Session, TokenPayload
│   │   └── express.d.ts              ← Express Request augmentation (user, session)
│   │
│   └── feature-flags/
│       ├── flags.ts                  ← flag definitions
│       └── FeatureFlag.ts            ← flag evaluation logic
│
├── infrastructure/                   ← INFRASTRUCTURE LAYER — external adapters
│   ├── database/
│   │   ├── connection-manager.ts     ← from server/connection-manager.ts (moved)
│   │   ├── db.ts                     ← from server/db.ts (moved)
│   │   └── cache.ts                  ← from server/cache.ts (moved)
│   │
│   ├── smtp/
│   │   ├── SmtpClient.ts             ← nodemailer wrapper (from email.ts)
│   │   └── templates/                ← HTML email templates (from email.ts)
│   │
│   ├── push/
│   │   └── WebPushClient.ts          ← web-push wrapper (from push.ts)
│   │
│   ├── imap/
│   │   └── ImapClient.ts             ← imapflow wrapper (from mail-imap.ts)
│   │
│   ├── ai/
│   │   ├── AiProvider.ts             ← provider interface
│   │   ├── OpenAiAdapter.ts          ← OpenAI implementation
│   │   ├── KimiAdapter.ts            ← Moonshot/Kimi implementation
│   │   └── VideoProxyAdapter.ts      ← video generation proxy (from ai.ts)
│   │
│   ├── oauth/
│   │   ├── GoogleOAuthAdapter.ts     ← passport-google-oauth20 (from auth.ts + routes.ts)
│   │   ├── GithubOAuthAdapter.ts     ← passport-github2 (from auth.ts + routes.ts)
│   │   └── AppleOAuthAdapter.ts      ← passport-apple (from routes.ts)
│   │
│   ├── storage/
│   │   ├── LocalStorageAdapter.ts    ← disk storage via multer (from routes.ts)
│   │   └── StorageAdapter.ts         ← interface for future S3/R2 swap
│   │
│   ├── payments/
│   │   └── PayPalAdapter.ts          ← PayPal SDK wrapper (from paypal.ts)
│   │
│   ├── pdf/
│   │   └── PdfGenerator.ts           ← pdf-lib wrapper (from pdf.ts)
│   │
│   ├── atlas/
│   │   └── AtlasApiClient.ts         ← MongoDB Atlas admin API (from atlas.ts)
│   │
│   ├── websocket/
│   │   └── ws.ts                     ← from server/ws.ts (moved)
│   │
│   └── search/
│       └── SearchAdapter.ts          ← interface placeholder for future search
│
├── shared/                           ← SHARED LAYER — HTTP-level cross-cutting
│   ├── middleware/
│   │   ├── authenticate.ts           ← isAuthenticated guard
│   │   ├── staffOnly.ts              ← role guard
│   │   ├── rateLimiter.ts            ← loginLimiter, otpLimiter, etc.
│   │   └── upload.ts                 ← multer config (20 MB / 500 MB)
│   └── utils/
│       ├── sanitize.ts               ← sanitizeUser (from routes.ts)
│       ├── translate.ts              ← translateError Arabic helper
│       ├── crypto.ts                 ← scrypt, hashing, OTP generation
│       └── response.ts               ← standard { ok, data, error } envelope builder
│
├── models/                           ← Mongoose models (keep as-is — no changes)
│   └── [all existing files unchanged]
│
└── domains/                          ← DOMAIN LAYER — all business modules
    │
    ├── auth/
    ├── users/
    ├── employees/
    ├── customers/
    ├── products/
    ├── orders/
    ├── projects/
    ├── payments/
    ├── wallet/
    ├── installments/
    ├── crm/
    ├── mail/
    ├── notifications/
    ├── ai/                           ← AI Platform (see §9)
    ├── qmeet/
    ├── reports/
    ├── analytics/
    ├── files/
    ├── content/
    ├── store/
    ├── system/
    ├── sandbox/
    ├── deployment/
    ├── email-marketing/
    ├── seo/                          ← SEO Platform (see §10)
    └── pwa/
```

---

## 4. Layered Architecture — Flow Per Domain

Every domain follows this five-layer contract. No exceptions.

```
HTTP Request
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  routes.ts                                               │
│  • Mounts Express Router                                 │
│  • Applies middleware (auth guard, rate limiter, upload) │
│  • Validates request shape with Zod (validation.ts)      │
│  • Calls controller method                               │
│  • No business logic. No DB access.                      │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  controller.ts                                           │
│  • Reads req (body, params, query, user)                 │
│  • Maps request to service input DTO                     │
│  • Calls service                                         │
│  • Maps service result to HTTP response                  │
│  • Forwards errors to next(err)                          │
│  • No business logic. No DB access.                      │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  service.ts                                              │
│  • Orchestration logic (multi-step workflows)            │
│  • Calls domain for business rule evaluation             │
│  • Calls repository for data                             │
│  • Emits domain events (EventBus)                        │
│  • Calls infrastructure adapters (SMTP, push, AI)        │
│  • No req/res references.                                │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  domain.ts                                               │
│  • Pure business rules — no I/O, no HTTP, no DB          │
│  • Validates invariants (e.g., wallet cannot go negative)│
│  • Enforces domain constraints                           │
│  • Returns domain objects or throws DomainError          │
│  • 100% unit-testable without mocking                    │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  repository.ts                                           │
│  • All Mongoose queries                                  │
│  • Accepts and returns plain typed objects (DTOs)        │
│  • No business logic                                     │
│  • No HTTP references                                    │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  Database (MongoDB via infrastructure/database/)         │
└─────────────────────────────────────────────────────────┘
```

### Files per domain

```
server/domains/<name>/
  <name>.routes.ts       Express router
  <name>.controller.ts   HTTP adapter
  <name>.service.ts      Orchestration
  <name>.domain.ts       Business rules (pure)
  <name>.repository.ts   DB access
  <name>.validation.ts   Zod schemas
  <name>.types.ts        DTOs, interfaces
```

---

## 5. Core Layer — Detailed Design

### 5.1 Error Hierarchy

```
Error (built-in)
└── AppError                   isOperational: true, statusCode, code
    ├── DomainError            business rule violation (400/422)
    │   └── ValidationError    input shape failure (400)
    └── InfrastructureError    external service failure (502/503)
```

**Error code format:** `DOMAIN_NOUN_VERB`  
Examples: `AUTH_OTP_EXPIRED`, `WALLET_BALANCE_INSUFFICIENT`, `AI_PROVIDER_UNAVAILABLE`

**Global error handler** registered last in `index.ts`:
- `AppError` → structured response with code and Arabic-friendly message
- Unknown errors → 500 with safe message (no stack in production)
- All errors logged via core logger with correlation ID
- Financial errors (`PAYMENT_*`, `WALLET_*`) → security log channel

### 5.2 Logger — Dedicated Platform

Logging is not a utility function. It is a platform with four separate channels.

| Channel | Purpose | Examples | Retention |
|---|---|---|---|
| **Application** | Normal runtime events | Server start, route registration, DB connected | 7 days |
| **Audit** | User-driven state changes | Login, order created, payment made, admin action | 1 year |
| **Security** | Auth and access events | Failed login, OTP failure, suspicious IP, 2FA bypass attempt | 1 year |
| **Performance** | Latency and resource usage | Slow queries (>200ms), memory peaks, WS connections | 30 days |

```
core/logger/
  logger.ts                ← structured logger (correlation ID per request)
  context.ts               ← AsyncLocalStorage for request-scoped log context
  transports/
    console.transport.ts   ← development: colorized, human-readable
    file.transport.ts      ← production: JSON, rotating by date + size
    audit.transport.ts     ← writes to MongoDB audit collection
```

Every log entry includes:
- `timestamp` (ISO 8601)
- `level` (info / warn / error / debug)
- `channel` (app / audit / security / performance)
- `correlationId` (request-scoped UUID)
- `userId` (if authenticated)
- `ip`
- `message`
- `meta` (structured context object)

### 5.3 Feature Flags

```ts
// core/feature-flags/flags.ts
export const FLAGS = {
  WALLET_ENABLED:           "wallet.enabled",
  AI_VIDEO_ENABLED:         "ai.video.enabled",
  QMEET_LOBBY_ENABLED:      "qmeet.lobby.enabled",
  INSTALLMENTS_ENABLED:     "installments.enabled",
  ECOMMERCE_ENABLED:        "store.enabled",
  NEW_AUTH_FLOW:            "auth.new_flow",
} as const;
```

Flags are evaluated at runtime from `QiroxSystemSettingsModel`, allowing live toggle without redeployment. Sprint 2 defines the flag system; activation of specific flags is a future operation.

### 5.4 Domain Events Catalog

See §8 for full event-driven architecture design.

---

## 6. Infrastructure Layer — Adapter Inventory

Every external dependency is wrapped behind an interface. Domain code never imports an SDK directly.

| Adapter | Interface | Replaces | SDK |
|---|---|---|---|
| `DatabaseAdapter` | `connect()`, `disconnect()`, `status()` | `connection-manager.ts` | mongoose |
| `SmtpClient` | `send(options)` | `email.ts` | nodemailer |
| `WebPushClient` | `send(subscription, payload)` | `push.ts` | web-push |
| `ImapClient` | `connect()`, `fetchMessages()`, `sendMessage()` | `mail-imap.ts` | imapflow |
| `AiProvider` | `complete(prompt)`, `vision(image, prompt)` | `ai.ts` | openai / moonshot |
| `GoogleOAuthAdapter` | `getAuthUrl()`, `handleCallback()` | inline in `routes.ts` | passport-google-oauth20 |
| `GithubOAuthAdapter` | `getAuthUrl()`, `handleCallback()` | inline in `routes.ts` | passport-github2 |
| `AppleOAuthAdapter` | `getAuthUrl()`, `handleCallback()` | inline in `routes.ts` | passport-apple |
| `StorageAdapter` | `save(file)`, `delete(path)`, `url(path)` | multer disk in `routes.ts` | multer |
| `PayPalAdapter` | `createOrder()`, `captureOrder()` | `paypal.ts` | @paypal/paypal-server-sdk |
| `PdfGenerator` | `generate(template, data)` | `pdf.ts` | pdf-lib |
| `AtlasApiClient` | `listClusters()`, `createUser()` | `atlas.ts` | fetch (direct Atlas API) |
| `WebSocketHub` | `push()`, `broadcast()`, `subscribe()` | `ws.ts` | ws |
| `SearchAdapter` | `index()`, `query()` | — (placeholder) | Future: Meilisearch / Typesense |

**Rule:** Infrastructure adapters accept and return plain objects. They never return Mongoose documents. Domain code never knows which provider is active.

---

## 7. Configuration Layer — Centralized Design

All environment variables are validated at startup in a single place. If a required variable is missing, the server refuses to start.

```ts
// config/index.ts — assembled and frozen at startup
export const AppConfig = Object.freeze({
  app:       AppConfig,       // port, env, corsOrigins, trustProxy
  database:  DatabaseConfig,  // primaryUri, qmeetUri, poolSize, timeouts
  mail:      MailConfig,      // smtpHost, sender, senderName, logoUrl, siteUrl
  storage:   StorageConfig,   // uploadPath, maxSizeMb, allowedMimeTypes
  security:  SecurityConfig,  // sessionSecret, bcryptRounds, otpTtlMs, deviceTokenTtlDays
  seo:       SeoConfig,       // siteUrl, defaultTitle, defaultDescription, ogImage
  payments:  PaymentsConfig,  // paypalClientId, paypalMode, paymobApiKey
  ai:        AiConfig,        // provider, openaiApiKey, moonshotApiKey, maxTokens
  apple:     AppleConfig,     // clientId, teamId, keyId, privateKey
  google:    GoogleConfig,    // clientId, clientSecret, callbackUrl
});
```

**Validation strategy:** Each config file uses Zod to validate its section of `process.env` at import time. Missing required values throw a startup error with a clear message naming the missing variable.

---

## 8. Event-Driven Architecture — Design (Implementation Deferred)

An internal event bus decouples side effects from business logic. When an order is created, the Orders domain emits `OrderCreated` and stops. The notification system, wallet, and analytics each subscribe independently — the orders domain does not call them directly.

### 8.1 EventBus interface

```ts
// core/events/EventBus.ts
interface IEventBus {
  emit<T extends DomainEvent>(event: T): void;
  on<T extends DomainEvent>(eventType: T['type'], handler: (event: T) => void | Promise<void>): void;
  off(eventType: string, handler: Function): void;
}
```

### 8.2 Domain Event catalog

| Event | Emitted by | Consumed by |
|---|---|---|
| `UserCreated` | auth domain | notifications, crm |
| `UserActivated` | auth domain | notifications |
| `PasswordChanged` | auth domain | notifications (security alert) |
| `LoginFailed` | auth domain | logger (security channel) |
| `OrderCreated` | orders domain | notifications, analytics, loyalty |
| `OrderStatusChanged` | orders domain | notifications, projects |
| `OrderCancelled` | orders domain | payments, notifications, analytics |
| `InvoiceCreated` | payments domain | notifications |
| `InvoicePaid` | payments domain | wallet, loyalty, notifications |
| `WalletCredited` | wallet domain | notifications |
| `WalletDebited` | wallet domain | notifications, audit log |
| `PaymentFailed` | payments domain | notifications, logger (security channel) |
| `ProjectCreated` | projects domain | notifications, employees |
| `ProjectCompleted` | projects domain | notifications, analytics |
| `MeetingStarted` | qmeet domain | notifications |
| `MeetingEnded` | qmeet domain | analytics, reports |
| `EmployeeInvited` | employees domain | notifications (welcome email) |
| `AttendanceCheckedIn` | employees domain | analytics |
| `AttendanceCheckedOut` | employees domain | reports |
| `SupportTicketOpened` | notifications domain | crm, employees |
| `LeadCreated` | crm domain | notifications, analytics |
| `AiSessionStarted` | ai domain | analytics |
| `SandboxDeployed` | sandbox domain | notifications |
| `InstallmentLate` | installments domain | notifications (automated reminder) |

### 8.3 Event shape contract

```ts
// core/events/events.ts
interface DomainEvent {
  type: string;           // e.g., "order.created"
  occurredAt: Date;
  correlationId: string;  // links to the originating HTTP request
  payload: Record<string, unknown>;
}

// Example
interface OrderCreated extends DomainEvent {
  type: "order.created";
  payload: {
    orderId: string;
    userId: string;
    serviceId: string;
    totalAmount: number;
    currency: "SAR";
  };
}
```

**Implementation note:** Sprint 2 defines the interfaces and event catalog only. The EventBus is not wired. Event emission calls are added during domain extraction as no-ops (`eventBus.emit(event)` compiles but handlers are registered in a later sprint).

---

## 9. AI Platform — Design

AI is not a single module. It is a platform designed for independent expansion across multiple capability tracks.

### 9.1 Platform structure

```
server/domains/ai/
  ai.routes.ts
  ai.controller.ts
  ai.service.ts                  ← orchestrates across capabilities
  ai.domain.ts                   ← prompt budgeting, rate limiting rules
  ai.repository.ts               ← session persistence
  ai.validation.ts
  ai.types.ts
  capabilities/
    chat/
      chat.service.ts            ← multi-turn conversation
      chat.types.ts
    vision/
      vision.service.ts          ← image understanding, face analysis
      vision.types.ts
    voice/
      voice.service.ts           ← placeholder: TTS / STT
      voice.types.ts
    automation/
      automation.service.ts      ← workflow triggers, scheduled AI tasks
      automation.types.ts
    knowledge-base/
      kb.service.ts              ← document ingestion and retrieval
      kb.types.ts
    rag/
      rag.service.ts             ← retrieval-augmented generation
      rag.types.ts
    agents/
      agent.service.ts           ← multi-step autonomous task execution
      agent.types.ts
    prompt-library/
      PromptLibrary.ts           ← versioned, named prompt templates
      prompts/
        system-prompts.ts        ← base system prompts (Arabic-first rule enforced)
        task-prompts.ts          ← per-capability prompt definitions
```

### 9.2 Provider abstraction

```
infrastructure/ai/
  AiProvider.ts              ← interface: complete(), vision(), embed()
  OpenAiAdapter.ts           ← GPT-4o (vision on, Arabic-first enforced)
  KimiAdapter.ts             ← Moonshot/Kimi (vision off)
  VideoProxyAdapter.ts       ← video generation proxy
  ProviderSelector.ts        ← selects provider based on config + capability
```

**Provider selection rule:** `OPENAI_API_KEY` present → OpenAI (vision capable). `MOONSHOT_API_KEY` present → Kimi (no vision). Both present → OpenAI for vision, Kimi for long-context text. All adapters enforce the anti-Chinese system prompt rule from day one.

### 9.3 Expansion path

| Capability | Current state | Sprint 2 target | Future |
|---|---|---|---|
| Chat | Inline in ai.ts | Extracted to `capabilities/chat/` | RAG, Agents |
| Vision | Inline in ai.ts | Extracted to `capabilities/vision/` | Voice |
| Video | Proxy in ai.ts | Extracted to `VideoProxyAdapter` | — |
| Voice | Not present | Placeholder folder only | TTS/STT providers |
| Automation | Not present | Placeholder folder only | n8n / custom |
| Knowledge Base | Not present | Placeholder folder only | pgvector / Pinecone |
| RAG | Not present | Placeholder folder only | depends on KB |
| Agents | Not present | Placeholder folder only | depends on RAG |
| Prompt Library | Scattered strings | `PromptLibrary.ts` | Versioned, UI-editable |

---

## 10. SEO Platform — Design

SEO is not a route or a utility function. It is a reusable platform that serves all current and future products.

```
server/domains/seo/
  seo.routes.ts              ← /sitemap.xml, /robots.txt, /api/seo/meta
  seo.controller.ts
  seo.service.ts             ← meta resolution, sitemap generation
  seo.domain.ts              ← SEO rule enforcement (canonical, noindex rules)
  seo.repository.ts          ← persists SEO overrides per page/product
  seo.validation.ts
  seo.types.ts
  platforms/
    web/
      WebSeoService.ts       ← Qirox main site SEO
    store/
      StoreSeoService.ts     ← E-commerce product SEO
    blog/
      BlogSeoService.ts      ← placeholder for future content platform
  sitemap/
    SitemapBuilder.ts        ← generates sitemap.xml from registered pages
    SitemapEntry.ts          ← typed entry model
  meta/
    MetaResolver.ts          ← resolves title, description, og:image per route
    MetaDefaults.ts          ← global defaults from seo.config.ts
  schema/
    JsonLdBuilder.ts         ← builds JSON-LD structured data blocks
```

**Platform capabilities:**
- Sitemap generation from registered page registry (not hardcoded XML)
- Per-page meta override stored in DB, editable from admin panel
- JSON-LD structured data blocks (Organization, Product, FAQ, BreadcrumbList)
- Robots.txt served dynamically from config
- Open Graph and Twitter Card meta via MetaResolver
- Multi-product: each product registers its own URL space with the SEO platform

---

## 11. Existing File → Target Location Mapping

| Existing file | Fate in Sprint 2 |
|---|---|
| `server/routes.ts` | **Dissolved** across 20+ domains. Primary extraction target. |
| `server/ai.ts` | → `server/domains/ai/` (re-layered; capabilities split out) |
| `server/sandbox-routes.ts` | → `server/domains/sandbox/` (re-layered) |
| `server/email.ts` | → `server/infrastructure/smtp/SmtpClient.ts` (transport) + domain services (callers) |
| `server/qmeet.ts` | → `server/domains/qmeet/` (re-layered) |
| `server/deployment-cloud.ts` | → `server/domains/deployment/` (re-layered) |
| `server/email-marketing.ts` | → `server/domains/email-marketing/` (re-layered) |
| `server/storage.ts` | **Dissolved** into per-domain repositories |
| `server/crm.ts` | → `server/domains/crm/` (re-layered; already thin) |
| `server/routes-mail.ts` | → `server/domains/mail/mail.routes.ts` |
| `server/routes-pwa.ts` | → `server/domains/pwa/pwa.routes.ts` |
| `server/mail-imap.ts` | → `server/infrastructure/imap/ImapClient.ts` |
| `server/sandbox-runner.ts` | → `server/domains/sandbox/sandbox.service.ts` |
| `server/sandbox-fs.ts` | → `server/domains/sandbox/sandbox.service.ts` |
| `server/notify.ts` | → `server/domains/notifications/notifications.service.ts` |
| `server/push.ts` | → `server/infrastructure/push/WebPushClient.ts` |
| `server/pdf.ts` | → `server/infrastructure/pdf/PdfGenerator.ts` |
| `server/atlas.ts` | → `server/infrastructure/atlas/AtlasApiClient.ts` |
| `server/changelog.ts` | → `server/domains/system/system.service.ts` |
| `server/paypal.ts` | → `server/infrastructure/payments/PayPalAdapter.ts` |
| `server/qmeet-db.ts` | → `server/domains/qmeet/qmeet.repository.ts` |
| `server/cpanel.ts` | → `server/domains/system/system.service.ts` |
| `server/auth.ts` | Stays — Passport config; referenced by shared middleware |
| `server/index.ts` | Stays — slimmed to bootstrap + import domains |
| `server/db.ts` | → `server/infrastructure/database/db.ts` |
| `server/connection-manager.ts` | → `server/infrastructure/database/connection-manager.ts` |
| `server/ws.ts` | → `server/infrastructure/websocket/ws.ts` |
| `server/cache.ts` | → `server/infrastructure/database/cache.ts` |
| `server/cron.ts` | Stays — cron runner (wires into system domain) |
| `server/static.ts` | Stays as-is |
| `server/models/` | **Stays as-is** — no changes to Mongoose models |

---

## 12. Dependency Graph

```
config ◄──────────────────────────── everything reads config at startup

core/errors ◄─────────────────────── all layers
core/logger ◄─────────────────────── all layers
core/events ◄─────────────────────── services, infrastructure
core/constants ◄──────────────────── all layers
core/types ◄──────────────────────── all layers

infrastructure/database ◄──────────── domain repositories
infrastructure/smtp ◄───────────────── notifications service
infrastructure/push ◄───────────────── notifications service
infrastructure/imap ◄───────────────── mail service
infrastructure/ai ◄─────────────────── ai service
infrastructure/oauth ◄──────────────── auth service
infrastructure/storage ◄────────────── files service
infrastructure/payments ◄───────────── payments service
infrastructure/pdf ◄────────────────── files service
infrastructure/atlas ◄──────────────── system service
infrastructure/websocket ◄──────────── notifications service

shared/middleware ◄────────────────── all domain routes
shared/utils ◄────────────────────── all domain services

notifications ◄─── users, orders, wallet, auth, employees, customers, crm, qmeet
files ◄──────────── orders, projects, system
products ◄──────── orders, store

content ──────────────────────────────► notifications
system ───────────────────────────────► notifications, files
analytics ────────────────────────────► system, events
reports ──────────────────────────────► employees, finance, orders

employees ────────────────────────────► users, notifications
customers ────────────────────────────► users, wallet, notifications
wallet ───────────────────────────────► payments, notifications    ← financial
installments ────────────────────────► wallet, payments            ← financial
payments ─────────────────────────────► wallet, orders             ← financial
projects ─────────────────────────────► orders, notifications, files
orders ───────────────────────────────► products, payments, projects
users ────────────────────────────────► auth, notifications
auth ─────────────────────────────────► users, notifications        ← most complex

crm ──────────── independent
qmeet ────────── independent
ai ───────────── independent (platform)
seo ──────────── independent (platform)
sandbox ──────── independent
deployment ───── independent
mail ─────────── independent
email-marketing ─ independent
pwa ──────────── independent
```

---

## 13. Migration Plans

"Waves" replaced by named migration plans. Each plan is a discrete, approvable unit of work.

---

### Migration Plan 1 — Core Infrastructure

**Purpose:** Establish the foundational packages that all subsequent migrations depend on. Pure additions — nothing deleted.

**Dependencies:** None.

**Risk:** 🟢 Zero — new files only. Existing code is untouched.

**Rollback Strategy:** Delete the new files. Zero impact.

**Estimated Time:** 2–3 hours.

**Verification Checklist:**
- [ ] `core/errors/AppError.ts` compiles without errors
- [ ] `core/logger/logger.ts` emits structured JSON in test run
- [ ] `core/events/EventBus.ts` compiles; emit/on/off work in unit test
- [ ] `core/constants/` exports all enums correctly
- [ ] `core/feature-flags/` evaluates flags correctly
- [ ] `config/index.ts` validates `.env` and throws on missing required keys
- [ ] `shared/middleware/` exports all guards and limiters
- [ ] `shared/utils/` exports sanitize, translate, crypto, response helpers
- [ ] TypeScript compilation (`npm run check`) passes with zero errors

---

### Migration Plan 2 — Infrastructure Adapters

**Purpose:** Wrap all external integrations behind interfaces. Existing code that calls these helpers directly is not changed yet — adapters are built alongside originals.

**Dependencies:** Migration Plan 1 (core/errors, core/logger).

**Risk:** 🟢 Low — new files only. Originals remain active.

**Rollback Strategy:** Delete `infrastructure/` folder. Zero impact on running code.

**Estimated Time:** 4–6 hours.

**Verification Checklist:**
- [ ] `SmtpClient.send()` sends a test email matching current behavior
- [ ] `WebPushClient.send()` delivers a push notification matching current behavior
- [ ] `ImapClient.connect()` establishes IMAP session
- [ ] `OpenAiAdapter.complete()` returns valid response
- [ ] `KimiAdapter.complete()` returns valid response
- [ ] `PayPalAdapter.createOrder()` returns valid PayPal order ID
- [ ] `PdfGenerator.generate()` produces binary-identical output to pdf.ts
- [ ] All adapters implement their respective interfaces (TypeScript enforced)
- [ ] TypeScript compilation passes with zero errors

---

### Migration Plan 3 — CRM Domain (Pilot)

**Purpose:** Extract the first domain to prove the full five-layer pattern (routes → controller → service → domain → repository) before applying it to larger, riskier modules.

**Dependencies:** Migration Plans 1 and 2.

**Risk:** 🟢 Low — `crm.ts` is 162 lines, no financial logic, minimal coupling.

**Rollback Strategy:** Re-register the original `crm.ts` router in `index.ts`. One-line revert.

**Estimated Time:** 2–3 hours.

**Verification Checklist:**
- [ ] All CRM API routes return identical responses to current behavior
- [ ] GET /api/crm/leads returns same shape
- [ ] POST /api/crm/leads creates a lead correctly
- [ ] Auth guards enforce same rules as before
- [ ] Original `crm.ts` removed and not imported anywhere
- [ ] No TypeScript errors
- [ ] Server starts cleanly

---

### Migration Plan 4 — Independent Domains (Re-layering)

**Purpose:** Re-layer the eight already-isolated route files. No logic from routes.ts is touched.

**Dependencies:** Migration Plans 1, 2, 3.

**Risk:** 🟡 Medium — larger files; each has external dependencies (AI providers, IMAP, WebRTC).

**Rollback Strategy:** Per-domain — re-register the original route file in `index.ts`. One-line revert per domain.

**Estimated Time:** 12–18 hours total.

| Domain | Source | Lines | Risk | Independent? |
|---|---|---|---|---|
| `pwa` | routes-pwa.ts | 327 | 🟢 Low | ✅ Yes |
| `email-marketing` | email-marketing.ts | 618 | 🟢 Low | ✅ Yes |
| `mail` | routes-mail.ts + mail-imap.ts | 719 | 🟡 Medium | ✅ Yes |
| `deployment` | deployment-cloud.ts | 1,018 | 🟡 Medium | ✅ Yes |
| `notifications` | notify.ts + push.ts + email.ts | 1,572 | 🟡 Medium | ✅ Yes |
| `qmeet` | qmeet.ts + qmeet-db.ts | 1,291 | 🟡 Medium | ✅ Yes |
| `sandbox` | sandbox-routes.ts + runner + fs | 1,680 | 🟡 Medium | ✅ Yes |
| `ai` | ai.ts (full AI platform) | 3,545 | 🟡 Medium | ✅ Yes |

**Verification Checklist (per domain):**
- [ ] All API paths return identical responses
- [ ] Auth guards apply correctly
- [ ] Infrastructure adapters used (not direct SDK calls)
- [ ] Domain events emitted (no-op handlers registered)
- [ ] Original file removed
- [ ] TypeScript compilation passes
- [ ] Server starts cleanly
- [ ] Manual smoke test of primary user flow

---

### Migration Plan 5 — routes.ts Extraction (Low-Coupling Domains)

**Purpose:** Begin extracting from the 16,406-line monolith. Start with domains that have no financial logic.

**Dependencies:** Migration Plans 1–4. Especially: notifications domain must be complete before this plan.

**Risk:** 🟡 Medium — extracting from a monolith requires precise line identification.

**Rollback Strategy:** Revert modified `routes.ts` to its pre-extraction state via Git. Domain folder deleted.

**Estimated Time:** 2–3 hours per domain.

| Domain | ~Lines in routes.ts | Risk |
|---|---|---|
| `content` | ~800 | 🟢 Low |
| `system` | ~1,200 | 🟡 Medium |
| `files` | ~400 | 🟢 Low |
| `products` | ~600 | 🟢 Low |
| `store` | ~500 | 🟡 Medium |
| `reports` | ~700 | 🟡 Medium |
| `analytics` | ~300 | 🟢 Low |
| `seo` | ~200 | 🟢 Low |

**Verification Checklist (per domain):**
- [ ] Extracted routes respond identically (status code, body shape, headers)
- [ ] Lines removed from routes.ts compile and leave no dangling imports
- [ ] Git diff shows only deletions from routes.ts and new domain folder
- [ ] TypeScript compilation passes
- [ ] Server starts cleanly

---

### Migration Plan 6 — routes.ts Extraction (Medium-Coupling Domains)

**Purpose:** Extract domains that couple to users, notifications, and each other.

**Dependencies:** Migration Plans 1–5.

**Risk:** 🔴 High — these domains call each other. Extraction order within this plan matters.

**Rollback Strategy:** Git revert of routes.ts changes. Domain folders deleted.

**Estimated Time:** 4–6 hours per domain.

| Domain | ~Lines in routes.ts | Dependencies |
|---|---|---|
| `employees` | ~1,500 | users, notifications |
| `customers` | ~1,800 | users, wallet, notifications |

**Verification Checklist (per domain):**
- [ ] All employee/customer-facing routes return identical responses
- [ ] Attendance check-in/out flows work end-to-end
- [ ] Client portal features (loyalty, tools, wallet view) unchanged
- [ ] TypeScript compilation passes
- [ ] Server starts cleanly

---

### Migration Plan 7 — Financial Domains (Highest Risk)

**Purpose:** Extract wallet, payments, and installments — the financially critical paths.

**Dependencies:** All previous migration plans.

**Risk:** 🔴 Critical — financial correctness is non-negotiable. One missed edge case causes real money errors.

**Rollback Strategy:** Git revert. These domains are extracted last specifically so a rollback is a clean, isolated revert.

**Estimated Time:** 6–10 hours per domain.

| Domain | ~Lines in routes.ts | Risk level |
|---|---|---|
| `wallet` | ~1,000 | 🔴 Critical |
| `installments` | ~600 | 🔴 Critical |
| `payments` | ~800 | 🔴 Critical |

**Verification Checklist (per domain):**
- [ ] Wallet top-up creates correct WalletTransaction record
- [ ] Wallet debit never produces negative balance
- [ ] Wallet PIN enforcement unchanged
- [ ] PayPal order creation and capture flow unchanged
- [ ] Invoice creation and payment status transitions unchanged
- [ ] Installment payment scheduling unchanged
- [ ] Journal entries correct (debit = credit)
- [ ] TypeScript compilation passes
- [ ] Server starts cleanly

---

### Migration Plan 8 — Core Domains (Most Complex)

**Purpose:** Extract projects, orders, users, and auth — the highest-coupling, highest-complexity domains.

**Dependencies:** All previous migration plans.

**Risk:** 🔴 Critical — auth failure locks out all users; order/project bugs affect active clients.

**Rollback Strategy:** Git revert. By this point, routes.ts contains only these domains, making the revert small and targeted.

**Estimated Time:** 8–16 hours per domain.

| Domain | ~Lines in routes.ts | Risk |
|---|---|---|
| `projects` | ~2,000 | 🔴 High |
| `orders` | ~2,500 | 🔴 High |
| `users` | ~1,200 | 🔴 Critical |
| `auth` | ~3,000 | 🔴 Critical |

**Verification Checklist (per domain):**
- [ ] Full auth flow: registration, login, 2FA, OAuth (Google, GitHub, Apple), WebAuthn, Face, PIN
- [ ] Session persistence unchanged
- [ ] All 2FA methods functional (email OTP, TOTP, push approval, passphrase)
- [ ] Order creation, status transitions, specs, and modification requests unchanged
- [ ] Project creation, task assignment, kanban, vault, time logging unchanged
- [ ] User profile update, avatar, password change unchanged
- [ ] Admin user management unchanged
- [ ] TypeScript compilation passes
- [ ] Server starts cleanly

---

## 14. What Does Not Change in Sprint 2

- No API path changes
- No HTTP response shape changes (existing shapes preserved; new envelope adopted only in new code)
- No UI changes
- No business logic changes
- No Mongoose model changes
- No database schema changes
- No shared/ schema changes
- No client/ changes
- No new features

All changes are structural reorganization only. Every extracted domain must be verified against the original behavior before the next migration plan begins.

---

## 15. Deliverable Template (per migration plan)

| Field | Value |
|---|---|
| Migration Plan | e.g., Migration Plan 3 — CRM Domain |
| Files created | list with purpose |
| Files modified | list with description of change |
| Files deleted | list |
| Routes preserved | all API paths + HTTP methods |
| Behavior verified | manual test results per endpoint |
| Events emitted | list of domain events added |
| Risks remaining | known gaps or deferred items |
| Next plan unblocked | which migration plan can now start |

---

*End of Sprint 2 Phase 1 — Architecture Design (Revised v2)*  
*Awaiting approval before any implementation begins.*
