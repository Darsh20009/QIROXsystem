# Sprint 2 — Enterprise Backend Architecture Design

**Status:** Phase 1 — Design Only. No production code has been modified.
**Date:** 2026-07-09
**Revision:** v3 — Raised to enterprise standard (multi-tenant, API governance, background jobs, observability, testing strategy).
**Scope:** server/ directory only. UI, shared/, and client/ are unchanged.

---

## General Principles

The QIROX platform must be:

| Principle | Meaning |
|---|---|
| **Enterprise-grade** | Handles production load, failures, and team-scale development |
| **API-first** | Every capability is exposed via a versioned, documented, governed API |
| **Domain-driven** | Business logic lives inside domain boundaries, not in routes |
| **Event-ready** | Side effects are decoupled via an internal event bus |
| **Multi-tenant ready** | Architecture supports organization isolation without a rewrite |
| **Cloud-ready** | Stateless application layer; infrastructure is replaceable |
| **Testable** | Every layer is independently testable without standing up the full server |
| **Secure by default** | Auth, rate limiting, and input validation are applied at the framework level |
| **Observable** | Metrics, health checks, structured logs, and correlation IDs in all paths |
| **Modular** | Domains are independently deployable units |
| **Scalable** | Horizontal scaling requires no application-layer changes |
| **Maintainable** | A new engineer can locate and change any feature within one domain folder |

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
| `storage.ts` | 615 | Partial repository layer | Covers ~20% of DB access |
| `pdf.ts` | 486 | PDF generation | Belongs in infrastructure |
| `mail-imap.ts` | 455 | IMAP client wrapper | External integration; belongs in infrastructure |
| `changelog.ts` | 367 | Changelog data | Belongs in system domain |
| `routes-pwa.ts` | 327 | PWA/push subscription routes | Already separate |
| `crm.ts` | 162 | CRM routes | Already separate; very thin |
| `auth.ts` | 156 | Passport config | Infrastructure; fine as-is |
| `notify.ts` | 157 | Notification dispatch helpers | Belongs in notifications domain |
| `atlas.ts` | 150 | MongoDB Atlas API client | External integration; belongs in infrastructure |
| `push.ts` | 101 | Web push helpers | External integration; belongs in infrastructure |
| `paypal.ts` | 188 | PayPal SDK wrapper | External integration; belongs in infrastructure |
| `ws.ts` | 275 | WebSocket hub | Infrastructure |

### Models inventory (server/models/) — already domain-split, keep as-is

| File | Domain | Key models |
|---|---|---|
| `user.ts` | Identity | UserModel |
| `auth.ts` | Identity | OtpModel, WebAuthnCredentialModel, DeviceTokenModel, Pending2FAModel, PushChallengeModel, PhoneVerifyOtpModel, ClientApiKeyModel, AuthAppModel, AuthAppEnrollmentModel |
| `hr.ts` | Employees | AttendanceModel, EmployeeProfileModel, PromotionLogModel, FaceDescriptorModel |
| `orders.ts` | Orders | OrderModel, CartModel, OrderSpecsModel, ModificationRequestModel, ContractModel, ReviewModel |
| `finance.ts` | Payments | InvoiceModel, ReceiptVoucherModel, WalletTransactionModel, WalletTopupModel, JournalEntryModel, QuotationModel, PayrollRecordModel |
| `projects.ts` | Projects | ProjectModel, TaskModel, ProjectMemberModel, MessageModel, TimeLogModel, KanbanTaskModel |
| `crm.ts` | CRM | CrmLeadModel, CrmLeadNoteModel, CrmDealModel, CrmContactModel, LeadDataModel, SwitchReminderModel |
| `comms.ts` | Notifications | NotificationModel, InboxMessageModel, CsSessionModel, SupportTicketModel, PushSubscriptionModel, GroupChatModel |
| `services.ts` | Products | ServiceModel, SectorTemplateModel, PricingPlanModel, ExtraAddonModel |
| `content.ts` | Content | NewsModel, JobModel, ApplicationModel, PartnerModel, ContactMessageModel |
| `ecommerce.ts` | Store | QiroxProductModel, DiscountCodeModel, DeviceShipmentModel |
| `system.ts` | System | CronJobModel, AtlasConfigModel, QiroxSystemSettingsModel, AppPublishConfigModel |
| `meetings.ts` | QMeet | ConsultationSlotModel, QMeetingModel, QFeedbackModel |
| `installments.ts` | Finance | InstallmentOfferModel, InstallmentApplicationModel, LoyaltyAccountModel |
| `mail.ts` | Mail | MailAccountModel, MailMessageModel, MailFolderModel |
| `sandbox.ts` | Sandbox | SandboxProjectModel, SandboxEnvVarModel, SandboxFileModel, SandboxDeploymentModel |
| `deployment.ts` | Deployment | DeploymentProjectModel, DeploymentRunModel |
| `client-tools.ts` | Customers | HtmlPublishModel, ShortUrlModel, ReferralModel, ClientWebhookModel |

---

## 2. Architectural Layers

The target architecture separates the backend into **six distinct layers**. Each layer has a single responsibility and a defined boundary. Dependencies flow downward only.

```
┌──────────────────────────────────────────────────────────────────┐
│                         CONFIGURATION                             │
│  Centralized, validated, typed config — validated at startup      │
│  App · Database · Mail · Storage · Security · SEO · Payments      │
│  AI · Apple · Google · Feature Flags · Monitoring                │
└──────────────────────────────────────────────────────────────────┘
            ↓ consumed by all layers below
┌──────────────────────────────────────────────────────────────────┐
│                            CORE                                   │
│  Errors · Logger interfaces · Events · Constants · Types          │
│  Result pattern · Base exceptions · Feature flags                │
│  (zero external dependencies — pure TypeScript)                   │
└──────────────────────────────────────────────────────────────────┘
            ↓ consumed by all layers below
┌──────────────────────────────────────────────────────────────────┐
│                       INFRASTRUCTURE                              │
│  Database · SMTP · Push · AI Providers · OAuth · Storage         │
│  PayPal · IMAP · Atlas · PDF · WebSocket · Search                │
│  Analytics · Monitoring · Background Queue                        │
│  (every external SDK wrapped behind an interface)                 │
└──────────────────────────────────────────────────────────────────┘
            ↓ consumed by platform services and domains
┌──────────────────────────────────────────────────────────────────┐
│                       PLATFORM SERVICES                           │
│  AI Platform · SEO Platform · Logging Platform                   │
│  Background Job Engine · Observability · Notification Engine      │
│  (cross-domain reusable capabilities)                             │
└──────────────────────────────────────────────────────────────────┘
            ↓ consumed by domain layer
┌──────────────────────────────────────────────────────────────────┐
│                           DOMAINS                                 │
│  auth · users · employees · orders · payments · projects          │
│  crm · notifications · qmeet · system · content · store …        │
│                                                                   │
│  Each domain:  routes → controller → service → domain             │
│                                          ↓                        │
│                                      repository → infrastructure  │
└──────────────────────────────────────────────────────────────────┘
            ↓ HTTP entry point wiring
┌──────────────────────────────────────────────────────────────────┐
│                           SHARED                                  │
│  Middleware · Guards · Rate limiters · Upload · Response builder  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Target Folder Structure

```
server/
│
├── index.ts                             ← slim orchestrator (~100 lines)
│
├── config/                              ← CONFIGURATION LAYER
│   ├── index.ts                         ← exports frozen AppConfig object
│   ├── app.config.ts                    ← port, environment, trustProxy, CORS
│   ├── database.config.ts               ← MongoDB URIs, pool sizes, timeouts
│   ├── mail.config.ts                   ← SMTP host, sender, logo URL, site URL
│   ├── storage.config.ts                ← upload path, max sizes, allowed MIME types
│   ├── security.config.ts               ← sessionSecret, bcryptRounds, OTP TTL
│   ├── seo.config.ts                    ← defaultTitle, siteUrl, OG defaults
│   ├── payments.config.ts               ← PayPal mode, client ID
│   ├── ai.config.ts                     ← provider, model names, rate limits
│   ├── apple.config.ts                  ← Sign-in-with-Apple keys
│   ├── google.config.ts                 ← OAuth client ID/secret
│   ├── feature-flags.config.ts          ← flag definitions and defaults
│   └── monitoring.config.ts             ← metrics endpoint, health check paths
│
├── core/                                ← CORE LAYER (zero external deps)
│   ├── errors/
│   │   ├── AppError.ts                  ← base operational error
│   │   ├── DomainError.ts               ← business rule violation (422)
│   │   ├── InfrastructureError.ts       ← external service failure (502/503)
│   │   ├── ValidationError.ts           ← input shape failure (400)
│   │   ├── AuthorizationError.ts        ← access denied (403)
│   │   ├── NotFoundError.ts             ← resource not found (404)
│   │   └── errorCodes.ts                ← machine-readable error code registry
│   │
│   ├── result/
│   │   ├── Result.ts                    ← Result<T, E> monad (Ok | Err)
│   │   └── index.ts                     ← ok(), err() factory helpers
│   │
│   ├── logger/
│   │   ├── ILogger.ts                   ← logger interface (no implementation here)
│   │   └── LogLevel.ts                  ← enum: DEBUG, INFO, WARN, ERROR
│   │
│   ├── events/
│   │   ├── IEventBus.ts                 ← emit/on/off interface
│   │   ├── DomainEvent.ts               ← base event shape
│   │   └── events.ts                    ← full domain event catalog (see §8)
│   │
│   ├── constants/
│   │   ├── roles.ts                     ← USER_ROLES enum
│   │   ├── orderStatus.ts               ← ORDER_STATUS enum
│   │   ├── paymentStatus.ts             ← PAYMENT_STATUS enum
│   │   ├── notificationTypes.ts         ← NOTIFICATION_TYPE enum
│   │   └── httpStatus.ts                ← HTTP status code constants
│   │
│   ├── types/
│   │   ├── common.types.ts              ← Pagination, SortOrder, ApiResponse<T>
│   │   ├── auth.types.ts                ← AuthUser, Session, TokenPayload
│   │   ├── tenant.types.ts              ← TenantContext (multi-tenant ready)
│   │   └── express.d.ts                 ← Request augmentation (user, tenant, correlationId)
│   │
│   └── feature-flags/
│       ├── IFeatureFlag.ts              ← flag interface
│       ├── flags.ts                     ← flag name registry
│       └── FeatureFlagService.ts        ← evaluation logic (reads QiroxSystemSettings)
│
├── infrastructure/                      ← INFRASTRUCTURE LAYER (external adapters)
│   ├── database/
│   │   ├── connection-manager.ts        ← moved from server/connection-manager.ts
│   │   ├── db.ts                        ← moved from server/db.ts
│   │   └── cache.ts                     ← moved from server/cache.ts
│   │
│   ├── smtp/
│   │   ├── ISmtpClient.ts               ← interface: send(options)
│   │   ├── SmtpClient.ts                ← nodemailer implementation
│   │   └── templates/                   ← HTML email templates
│   │
│   ├── push/
│   │   ├── IWebPushClient.ts            ← interface: send(subscription, payload)
│   │   └── WebPushClient.ts             ← web-push implementation
│   │
│   ├── imap/
│   │   ├── IImapClient.ts               ← interface: connect, fetch, send
│   │   └── ImapClient.ts                ← imapflow implementation
│   │
│   ├── ai/
│   │   ├── IAiProvider.ts               ← interface: complete, vision, embed, ocr
│   │   ├── OpenAiAdapter.ts             ← GPT-4o (vision, OCR capable)
│   │   ├── KimiAdapter.ts               ← Moonshot/Kimi (long-context text)
│   │   ├── VideoProxyAdapter.ts         ← video generation proxy
│   │   └── ProviderSelector.ts          ← runtime provider selection by capability
│   │
│   ├── oauth/
│   │   ├── IGoogleOAuthAdapter.ts
│   │   ├── GoogleOAuthAdapter.ts        ← passport-google-oauth20
│   │   ├── IGithubOAuthAdapter.ts
│   │   ├── GithubOAuthAdapter.ts        ← passport-github2
│   │   ├── IAppleOAuthAdapter.ts
│   │   └── AppleOAuthAdapter.ts         ← passport-apple
│   │
│   ├── storage/
│   │   ├── IStorageAdapter.ts           ← interface: save, delete, url
│   │   └── LocalStorageAdapter.ts       ← disk storage via multer
│   │
│   ├── payments/
│   │   ├── IPaymentGateway.ts           ← interface: createOrder, capture, refund
│   │   └── PayPalAdapter.ts             ← PayPal SDK implementation
│   │
│   ├── pdf/
│   │   ├── IPdfGenerator.ts             ← interface: generate(template, data)
│   │   └── PdfGenerator.ts              ← pdf-lib implementation
│   │
│   ├── atlas/
│   │   ├── IAtlasApiClient.ts
│   │   └── AtlasApiClient.ts            ← MongoDB Atlas Admin API
│   │
│   ├── websocket/
│   │   ├── IWebSocketHub.ts             ← interface: push, broadcast, subscribe
│   │   └── ws.ts                        ← moved from server/ws.ts
│   │
│   ├── queue/
│   │   ├── IJobQueue.ts                 ← interface: enqueue, schedule, cancel
│   │   └── InMemoryQueue.ts             ← current: in-process queue (BullMQ-ready)
│   │
│   ├── analytics/
│   │   ├── IAnalyticsProvider.ts        ← interface: track, identify, pageview
│   │   └── InternalAnalyticsAdapter.ts  ← writes to internal analytics collection
│   │
│   ├── monitoring/
│   │   ├── IMetricsCollector.ts         ← interface: increment, gauge, histogram
│   │   └── PrometheusAdapter.ts         ← Prometheus-compatible metrics
│   │
│   └── search/
│       ├── ISearchAdapter.ts            ← interface: index, query, delete
│       └── SearchAdapter.ts             ← placeholder (future: Meilisearch/Typesense)
│
├── platform/                            ← PLATFORM SERVICES LAYER
│   ├── logging/                         ← Logging Platform (see §7)
│   │   ├── Logger.ts                    ← structured logger implementation
│   │   ├── LogContext.ts                ← AsyncLocalStorage correlation ID
│   │   ├── channels/
│   │   │   ├── ApplicationLogger.ts     ← runtime events
│   │   │   ├── AuditLogger.ts           ← user-driven state changes
│   │   │   ├── SecurityLogger.ts        ← auth, access, suspicious events
│   │   │   ├── PerformanceLogger.ts     ← latency, memory, slow queries
│   │   │   ├── ApiLogger.ts             ← HTTP request/response pairs
│   │   │   └── JobLogger.ts             ← background job lifecycle
│   │   └── transports/
│   │       ├── ConsoleTransport.ts      ← dev: colorized human-readable
│   │       ├── FileTransport.ts         ← prod: rotating JSON files
│   │       └── AuditTransport.ts        ← MongoDB audit collection
│   │
│   ├── ai/                              ← AI Platform (see §10)
│   │   ├── AiPlatform.ts                ← entry point; routes requests to capabilities
│   │   ├── PromptLibrary.ts             ← versioned, named prompt templates
│   │   ├── prompts/
│   │   │   ├── system-prompts.ts        ← Arabic-first, anti-Chinese rule enforced
│   │   │   └── task-prompts.ts
│   │   └── capabilities/
│   │       ├── chat/
│   │       ├── vision/
│   │       ├── ocr/
│   │       ├── voice/
│   │       ├── automation/
│   │       ├── knowledge-base/
│   │       ├── rag/
│   │       ├── agents/
│   │       └── tool-calling/
│   │
│   ├── seo/                             ← SEO Platform (see §9)
│   │   ├── SeoService.ts                ← meta resolution entry point
│   │   ├── SitemapBuilder.ts
│   │   ├── MetaResolver.ts
│   │   ├── JsonLdBuilder.ts
│   │   ├── RobotsBuilder.ts
│   │   ├── i18n/
│   │   │   ├── ArabicSeoHelper.ts       ← RTL meta, Arabic OG, hreflang ar
│   │   │   └── MultilingualSeoHelper.ts ← hreflang for future locales
│   │   └── platforms/
│   │       ├── WebSeoService.ts         ← Qirox main site
│   │       └── StoreSeoService.ts       ← E-commerce product pages
│   │
│   ├── jobs/                            ← Background Job Engine (see §14)
│   │   ├── JobScheduler.ts              ← cron + one-off job scheduler
│   │   ├── JobRegistry.ts               ← named job definitions
│   │   ├── RetryPolicy.ts               ← exponential backoff config
│   │   └── DeadLetterHandler.ts         ← failed job persistence
│   │
│   └── observability/                   ← Observability Platform (see §15)
│       ├── HealthCheck.ts               ← /health endpoint
│       ├── ReadinessCheck.ts            ← /ready endpoint
│       ├── MetricsEndpoint.ts           ← /metrics endpoint (Prometheus format)
│       └── TraceContext.ts              ← distributed trace ID propagation
│
├── shared/                              ← SHARED LAYER (HTTP cross-cutting)
│   ├── middleware/
│   │   ├── authenticate.ts              ← isAuthenticated guard
│   │   ├── staffOnly.ts                 ← role guard
│   │   ├── rateLimiter.ts               ← loginLimiter, otpLimiter, etc.
│   │   ├── upload.ts                    ← multer config (20 MB / 500 MB)
│   │   ├── correlationId.ts             ← injects X-Correlation-ID per request
│   │   ├── requestLogger.ts             ← logs method, path, status, duration
│   │   └── errorHandler.ts              ← global Express error middleware
│   └── utils/
│       ├── sanitize.ts                  ← sanitizeUser
│       ├── translate.ts                 ← translateError (Arabic i18n)
│       ├── crypto.ts                    ← scrypt, hashing, OTP generation
│       └── response.ts                  ← standard { ok, data, error } builder
│
├── models/                              ← Mongoose models (unchanged)
│   └── [all existing files as-is]
│
└── domains/                             ← DOMAIN LAYER
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
    └── pwa/
```

---

## 4. Layered Architecture — Execution Flow Per Domain

```
HTTP Request
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  routes.ts                                                   │
│  • Mounts Express Router                                     │
│  • Applies shared middleware (auth, rate limiter, upload)    │
│  • Validates request shape via validation.ts (Zod)           │
│  • Calls controller method                                   │
│  • NO business logic. NO DB access.                          │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  controller.ts                                               │
│  • Maps req → service input DTO                              │
│  • Calls application service                                 │
│  • Maps Result<T> → HTTP response                            │
│  • Forwards errors to next(err)                              │
│  • NO business logic. NO DB access.                          │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  service.ts  (Application Service)                           │
│  • Orchestrates multi-step operations                        │
│  • Calls domain for business rule evaluation                 │
│  • Calls repository for data access                          │
│  • Emits domain events via IEventBus                         │
│  • Calls platform services (notifications, AI, SEO, jobs)   │
│  • Returns Result<T, AppError>                               │
│  • NO req/res references.                                    │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  domain.ts  (Domain Model)                                   │
│  • Pure business rules — no I/O, no HTTP, no DB              │
│  • Validates invariants (wallet cannot go negative)          │
│  • Enforces domain constraints and state transitions         │
│  • Returns Result<T, DomainError>                            │
│  • 100% unit-testable without mocking                        │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  repository.ts                                               │
│  • All Mongoose queries                                      │
│  • Accepts plain DTOs, returns plain DTOs                    │
│  • No business logic. No HTTP references.                    │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  Database (infrastructure/database/)                         │
└─────────────────────────────────────────────────────────────┘
```

### Files per domain

```
server/domains/<name>/
  <name>.routes.ts       Express router — middleware + controller calls
  <name>.controller.ts   HTTP adapter — req/res mapping
  <name>.service.ts      Application service — orchestration
  <name>.domain.ts       Domain model — pure business rules
  <name>.repository.ts   Data access — Mongoose queries only
  <name>.validation.ts   Zod schemas for request validation
  <name>.types.ts        DTOs and interfaces (input, output, internal)
```

---

## 5. Core Layer — Detailed Design

### 5.1 Error Hierarchy

```
Error (built-in)
└── AppError                    isOperational: true, statusCode, code
    ├── ValidationError         input failure (400)
    ├── AuthorizationError      access denied (403)
    ├── NotFoundError           resource missing (404)
    ├── DomainError             business rule violation (422)
    └── InfrastructureError     external service failure (502/503)
```

**Error code format:** `DOMAIN_NOUN_VERB`
Examples: `AUTH_OTP_EXPIRED` · `WALLET_BALANCE_INSUFFICIENT` · `AI_PROVIDER_UNAVAILABLE` · `ORDER_STATUS_INVALID_TRANSITION`

### 5.2 Result Pattern

Services and domain methods return `Result<T, E>` instead of throwing. Throwing is reserved for truly unexpected errors.

```ts
// core/result/Result.ts
type Result<T, E extends AppError = AppError> =
  | { ok: true;  value: T }
  | { ok: false; error: E };

// Factories
const ok  = <T>(value: T): Result<T, never>        => ({ ok: true, value });
const err = <E extends AppError>(e: E): Result<never, E> => ({ ok: false, error: e });
```

Controllers unwrap `Result` and map to HTTP responses. Domain errors never leak raw stack traces.

### 5.3 Feature Flags

```ts
// core/feature-flags/flags.ts
export const FLAGS = {
  WALLET_ENABLED:        "wallet.enabled",
  AI_VIDEO_ENABLED:      "ai.video.enabled",
  QMEET_LOBBY_ENABLED:   "qmeet.lobby.enabled",
  INSTALLMENTS_ENABLED:  "installments.enabled",
  ECOMMERCE_ENABLED:     "store.enabled",
  NEW_AUTH_FLOW:         "auth.new_flow",
  MULTI_TENANT:          "platform.multi_tenant",
  RAG_ENABLED:           "ai.rag.enabled",
} as const;
```

Flags are evaluated at runtime from `QiroxSystemSettings`, allowing live toggle without redeployment.

---

## 6. Infrastructure Layer — Adapter Inventory

Every external SDK is wrapped behind an interface. Domain code never imports an SDK directly. Replacing a provider means swapping one adapter class.

| Adapter | Interface | Replaces current | SDK |
|---|---|---|---|
| `DatabaseAdapter` | connect, disconnect, status | `connection-manager.ts` | mongoose |
| `SmtpClient` | send(options) | `email.ts` | nodemailer |
| `WebPushClient` | send(subscription, payload) | `push.ts` | web-push |
| `ImapClient` | connect, fetch, send | `mail-imap.ts` | imapflow |
| `AiProvider` | complete, vision, embed, ocr | `ai.ts` | openai / moonshot |
| `GoogleOAuthAdapter` | getAuthUrl, handleCallback | inline in `routes.ts` | passport-google-oauth20 |
| `GithubOAuthAdapter` | getAuthUrl, handleCallback | inline in `routes.ts` | passport-github2 |
| `AppleOAuthAdapter` | getAuthUrl, handleCallback | inline in `routes.ts` | passport-apple |
| `StorageAdapter` | save, delete, url | multer in `routes.ts` | multer (local), S3 (future) |
| `PaymentGateway` | createOrder, capture, refund | `paypal.ts` | @paypal/paypal-server-sdk |
| `PdfGenerator` | generate(template, data) | `pdf.ts` | pdf-lib |
| `AtlasApiClient` | listClusters, createUser | `atlas.ts` | fetch (Atlas Admin API) |
| `WebSocketHub` | push, broadcast, subscribe | `ws.ts` | ws |
| `JobQueue` | enqueue, schedule, cancel | `cron.ts` (partial) | in-memory → BullMQ (future) |
| `AnalyticsProvider` | track, identify, pageview | — | internal collection |
| `MetricsCollector` | increment, gauge, histogram | — | Prometheus-compatible |
| `SearchAdapter` | index, query, delete | — | placeholder → Meilisearch (future) |

---

## 7. Configuration Layer

All environment variables are validated at startup via Zod. Missing required values abort startup with a descriptive error — the server never starts in a misconfigured state.

```ts
// config/index.ts — assembled once, frozen, exported
export const AppConfig = Object.freeze({
  app:          AppConfig,          // port, env, corsOrigins, trustProxy
  database:     DatabaseConfig,     // primaryUri, qmeetUri, poolSize, timeouts
  mail:         MailConfig,         // smtpHost, sender, senderName, logoUrl, siteUrl
  storage:      StorageConfig,      // uploadPath, maxSizeMb, allowedMimeTypes
  security:     SecurityConfig,     // sessionSecret, bcryptRounds, otpTtlMs, deviceTokenTtlDays
  seo:          SeoConfig,          // siteUrl, defaultTitle, defaultDescription, ogImage
  payments:     PaymentsConfig,     // paypalClientId, paypalMode
  ai:           AiConfig,           // provider, openaiApiKey, moonshotApiKey, maxTokens
  apple:        AppleConfig,        // clientId, teamId, keyId, privateKey
  google:       GoogleConfig,       // clientId, clientSecret, callbackUrl
  featureFlags: FeatureFlagsConfig, // default flag values
  monitoring:   MonitoringConfig,   // metricsPort, healthPath, readyPath
});
```

**Rule:** No domain or service imports `process.env` directly. All config access goes through `AppConfig`.

---

## 8. Event-Driven Architecture — Design (Implementation Deferred)

An internal typed event bus decouples side effects from business logic. Services emit events; listeners react. The Orders domain does not call the notifications domain — it emits `OrderCreated` and stops.

### 8.1 EventBus Interface

```ts
// core/events/IEventBus.ts
interface IEventBus {
  emit<T extends DomainEvent>(event: T): void;
  on<T extends DomainEvent>(type: T['type'], handler: (event: T) => void | Promise<void>): void;
  off(type: string, handler: Function): void;
}

// core/events/DomainEvent.ts
interface DomainEvent {
  type: string;
  occurredAt: Date;
  correlationId: string;
  tenantId?: string;          // multi-tenant ready
  payload: Record<string, unknown>;
}
```

### 8.2 Domain Event Catalog

| Event | Emitted by | Consumed by |
|---|---|---|
| `UserCreated` | auth | notifications, crm |
| `UserActivated` | auth | notifications |
| `PasswordResetRequested` | auth | notifications |
| `PasswordChanged` | auth | notifications (security alert), logger (security) |
| `LoginFailed` | auth | logger (security channel) |
| `EmployeeInvited` | employees | notifications (welcome email) |
| `AttendanceCheckedIn` | employees | analytics |
| `AttendanceCheckedOut` | employees | reports |
| `OrderCreated` | orders | notifications, analytics, loyalty |
| `OrderStatusChanged` | orders | notifications, projects |
| `OrderCancelled` | orders | payments, notifications, analytics |
| `InvoiceCreated` | payments | notifications |
| `InvoicePaid` | payments | wallet, loyalty, notifications |
| `PaymentFailed` | payments | notifications, logger (security) |
| `WalletCredited` | wallet | notifications |
| `WalletDebited` | wallet | notifications, logger (audit) |
| `ProjectCreated` | projects | notifications, employees |
| `ProjectCompleted` | projects | notifications, analytics |
| `TicketClosed` | notifications | crm, analytics |
| `MeetingStarted` | qmeet | notifications |
| `MeetingEnded` | qmeet | analytics, reports |
| `NotificationCreated` | notifications | ws (real-time delivery) |
| `LeadCreated` | crm | notifications, analytics |
| `SandboxDeployed` | sandbox | notifications |
| `InstallmentLate` | installments | notifications (automated reminder) |
| `AiSessionStarted` | ai | analytics |
| `BackgroundJobFailed` | jobs | logger (job channel), monitoring |

### 8.3 Implementation note

Sprint 2 defines interfaces and the event catalog. The `EventBus` is instantiated in `index.ts` but all `on()` handlers are registered as no-ops. `emit()` calls are added to services during domain extraction. Handlers are wired in a dedicated sprint after extraction is complete.

---

## 9. SEO Platform — Design

SEO is a reusable platform that serves all current and future QIROX products, with first-class Arabic and multilingual support.

```
server/platform/seo/
  SeoService.ts              ← entry point; delegates to capability services
  SitemapBuilder.ts          ← generates sitemap.xml from registered page registry
  MetaResolver.ts            ← resolves title, description, og:image per route
  JsonLdBuilder.ts           ← JSON-LD structured data (Organization, Product, FAQ, Breadcrumb)
  RobotsBuilder.ts           ← serves robots.txt dynamically from config
  CanonicalResolver.ts       ← canonical URL computation
  BreadcrumbBuilder.ts       ← structured breadcrumb trail
  i18n/
    ArabicSeoHelper.ts       ← RTL meta tags, Arabic OG, hreflang ar-SA
    MultilingualSeoHelper.ts ← hreflang link generation for future locales
    OpenGraphHelper.ts       ← og:locale, og:locale:alternate
    TwitterCardHelper.ts     ← summary_large_image card builder
  platforms/
    WebSeoService.ts         ← Qirox main site page registry
    StoreSeoService.ts       ← E-commerce product page SEO
    BlogSeoService.ts        ← placeholder: future content platform
```

**Capabilities:**

| Capability | Description |
|---|---|
| Metadata engine | Per-page title, description, keywords resolved from DB overrides → domain defaults → global defaults |
| Schema generation | JSON-LD blocks: Organization, WebSite, Product, BreadcrumbList, FAQPage, JobPosting |
| OpenGraph | og:title, og:description, og:image, og:locale, og:type per route |
| Twitter Cards | summary_large_image with Arabic-aware fallbacks |
| Breadcrumbs | Structured trail from page registry |
| Canonical URLs | Computed per route, enforcing HTTPS and www preference |
| Dynamic Sitemap | Generated from page registry — not hardcoded XML |
| Robots.txt | Served dynamically; environment-aware (no indexing in staging) |
| Arabic SEO | RTL meta, hreflang ar-SA, Arabic keyword support, direction-aware truncation |
| English SEO | Full en-SA / en-US support |
| Multilingual | hreflang alternate links for future locale expansion |

**Platform rule:** No SEO meta is hardcoded in HTML templates. All values flow through the SEO platform. Future products register their URL space with `SeoService.registerPlatform()`.

---

## 10. AI Platform — Design

AI is a platform, not a module. It is designed for independent capability expansion without cross-domain entanglement.

```
server/platform/ai/
  AiPlatform.ts                 ← entry point; routes to capability
  PromptLibrary.ts              ← versioned, named, DB-editable prompt templates
  prompts/
    system-prompts.ts           ← base prompts (Arabic-first; anti-Chinese rule enforced at adapter level)
    task-prompts.ts             ← per-capability prompt definitions
  capabilities/
    chat/
      ChatService.ts            ← multi-turn conversation management
      ChatSession.ts            ← session state (history, context window)
    vision/
      VisionService.ts          ← image understanding; delegates to OpenAiAdapter
    ocr/
      OcrService.ts             ← document text extraction
    voice/
      VoiceService.ts           ← placeholder: TTS / STT providers
    automation/
      AutomationService.ts      ← workflow trigger execution
      AutomationRule.ts         ← rule evaluation (condition → action)
    knowledge-base/
      KbService.ts              ← document ingestion, chunking, embedding
      KbRepository.ts           ← vector store access
    rag/
      RagService.ts             ← retrieval + augmented generation
      RagPipeline.ts            ← query → retrieve → augment → complete
    agents/
      AgentService.ts           ← multi-step autonomous task execution
      AgentLoop.ts              ← plan → execute → observe → iterate
    tool-calling/
      ToolRegistry.ts           ← named tool definitions
      ToolExecutor.ts           ← validates arguments, runs tools, returns results
      tools/
        WebSearchTool.ts
        DatabaseQueryTool.ts
        NotificationTool.ts
        CalendarTool.ts
```

**Provider selection rule:**
- `OPENAI_API_KEY` present → OpenAI (vision, OCR, tool calling capable)
- `MOONSHOT_API_KEY` present → Kimi (long-context text, no vision)
- Both present → OpenAI for vision/OCR/tools, Kimi for long-context text
- All adapters enforce Arabic-first, anti-Chinese system prompt rule

**Capability expansion path:**

| Capability | Current state | Sprint 2 | Future |
|---|---|---|---|
| Chat | Inline in ai.ts | Extracted to `capabilities/chat/` | RAG, Agents |
| Vision | Inline in ai.ts | Extracted to `capabilities/vision/` | — |
| OCR | Partial in ai.ts | Extracted to `capabilities/ocr/` | — |
| Video | Proxy in ai.ts | VideoProxyAdapter in infrastructure | — |
| Voice | None | Placeholder folder | TTS/STT providers |
| Automation | None | Placeholder folder | Trigger system |
| Knowledge Base | None | Placeholder folder | pgvector / Pinecone |
| RAG | None | Placeholder folder | Depends on KB |
| Agents | None | Placeholder folder | Depends on RAG |
| Tool Calling | None | ToolRegistry + ToolExecutor stubs | Active tools wired per sprint |
| Prompt Library | Scattered strings | `PromptLibrary.ts` | DB-editable via admin UI |

---

## 11. Multi-Tenant Readiness — Design

QIROX does not have multiple tenants today. However, the architecture must support it without a rewrite when the time comes.

### 11.1 Tenant isolation model

**Strategy: Shared database, tenant-scoped data**
All data lives in one MongoDB cluster. Every tenant-owned document carries a `tenantId` field. Repositories enforce tenant scope automatically.

```ts
// core/types/tenant.types.ts
interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  plan: "starter" | "professional" | "enterprise";
  features: string[];         // active feature flags for this tenant
}
```

### 11.2 Tenant context propagation

```
Request arrives with tenant identifier (subdomain, header, or JWT claim)
    ↓
TenantMiddleware resolves TenantContext from identifier
    ↓
TenantContext stored in AsyncLocalStorage (no req threading needed)
    ↓
Repositories read TenantContext from AsyncLocalStorage
    ↓
All queries automatically scoped: { ...query, tenantId: ctx.tenantId }
```

### 11.3 Data ownership

| Resource | Scope | Notes |
|---|---|---|
| Users | Tenant-scoped | `userId` always paired with `tenantId` |
| Orders, Projects, Finance | Tenant-scoped | All financial data isolated |
| System settings | Tenant-scoped | Each org has its own `QiroxSystemSettings` |
| Services / Products | Shared or tenant-scoped | Configurable per tenant |
| AI models / prompts | Shared (global) | Tenants cannot alter base prompts |
| Infrastructure | Shared | MongoDB cluster, SMTP provider, storage |

### 11.4 Shared resources

- MongoDB cluster (shared; isolated by `tenantId` field + indexes)
- SMTP provider (shared; sender address may be per-tenant)
- File storage (shared bucket; isolated by path prefix `/tenants/{tenantId}/`)
- WebSocket hub (shared; messages scoped by `tenantId` on delivery)

### 11.5 Current state

Today QIROX operates as a single tenant. All `tenantId` fields default to `"qirox"`. The `TenantMiddleware` resolves to the default tenant. When multi-tenancy is activated, only the middleware and repository base class change — no domain logic changes.

### 11.6 Organization context (future)

When org management is implemented:
- `OrganizationModel` added to `models/system.ts`
- Admin console for tenant provisioning added to `system` domain
- Billing tracked per tenant
- Per-tenant feature flag overrides via `FeatureFlagService`

---

## 12. API Governance

All APIs across every domain follow this contract. No exceptions.

### 12.1 Versioning

```
/api/v1/<domain>/<resource>
```

- Version prefix `v1` in all routes from Sprint 2 forward
- Existing unversioned routes remain active during transition
- Breaking changes → new version (`v2`); old version deprecated with sunset header
- Non-breaking additions (new fields, new endpoints) → same version

### 12.2 Response envelope

All responses use this shape regardless of domain:

```ts
// Success
{ ok: true,  data: T,           meta?: PaginationMeta }

// Error
{ ok: false, error: { code: string, message: string, details?: unknown } }
```

HTTP status codes align with error classes:
- `200` — success
- `201` — created
- `400` — ValidationError
- `401` — not authenticated
- `403` — AuthorizationError
- `404` — NotFoundError
- `409` — conflict (duplicate)
- `422` — DomainError (business rule violation)
- `429` — rate limit exceeded
- `502/503` — InfrastructureError

### 12.3 Pagination

```ts
// Request (query params)
?page=1&limit=20&sort=createdAt&order=desc

// Response meta
{
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

### 12.4 Filtering and sorting

```
?filter[status]=active&filter[role]=admin
?sort=createdAt&order=desc
?search=<term>         (full-text when index exists)
```

Repositories expose a `buildQuery(filters, sort, pagination)` helper. Controllers map query params to this input. No raw query strings reach domain code.

### 12.5 Input validation

Every route registers a Zod schema in `<domain>.validation.ts`. The validation middleware runs before the controller. Invalid input returns `400` before reaching any business logic.

### 12.6 Authentication

All protected routes use `shared/middleware/authenticate.ts`. Unauthenticated requests → `401`. The auth check is applied at the router level, not inside controller logic.

### 12.7 Authorization

Role and permission checks use `shared/middleware/staffOnly.ts` or domain-level guards. Controllers never check roles directly.

### 12.8 Rate limiting

Rate limiters are defined in `shared/middleware/rateLimiter.ts` and applied at the router level.

| Limiter | Limit | Window | Applied to |
|---|---|---|---|
| `loginLimiter` | 10 req | 15 min | POST /api/v1/auth/login |
| `otpLimiter` | 5 req | 10 min | OTP verification endpoints |
| `registerLimiter` | 5 req | 1 hour | POST /api/v1/auth/register |
| `contactLimiter` | 3 req | 1 hour | POST /api/v1/content/contact |
| `aiLimiter` | 20 req | 1 min | All AI endpoints |
| `uploadLimiter` | 10 req | 1 min | File upload endpoints |

### 12.9 Idempotency

Endpoints with financial side effects (order creation, payment capture, wallet top-up) accept an optional `Idempotency-Key` header. The service layer checks for a prior result with the same key before processing. Duplicate requests within 24 hours return the original response.

### 12.10 Correlation IDs

Every request receives a `X-Correlation-ID` header (generated if not provided). The ID is attached to all log entries and included in error responses for traceability.

---

## 13. Background Processing — Design (Implementation Deferred)

Background jobs are currently handled via `node-cron` in `cron.ts`. The target architecture separates scheduled jobs from queued jobs and adds observability to both.

### 13.1 Job types

| Type | Description | Example |
|---|---|---|
| **Scheduled** | Run at a fixed time or interval (cron) | Daily payroll calculation, weekly report |
| **Queued** | Triggered by an event; processed async | Send welcome email on UserCreated |
| **Deferred** | Triggered immediately; starts after a delay | Reminder 24h before a meeting |
| **Recurring** | Queued jobs with a fixed retry schedule | Installment late payment check |

### 13.2 Job architecture

```
server/platform/jobs/
  JobScheduler.ts         ← cron + deferred scheduling (wraps node-cron today)
  JobQueue.ts             ← in-memory queue now; BullMQ-compatible interface
  JobRegistry.ts          ← all named job definitions registered here
  RetryPolicy.ts          ← exponential backoff: 1s → 2s → 4s → 8s → give up
  DeadLetterHandler.ts    ← persists permanently failed jobs to MongoDB
  JobContext.ts           ← injects logger, config, correlationId into job
```

### 13.3 Retry policy

```
Attempt 1 → immediately
Attempt 2 → 1 second
Attempt 3 → 2 seconds
Attempt 4 → 4 seconds
Attempt 5 → 8 seconds
→ Dead letter queue (persisted)
```

### 13.4 Dead-letter handling

Failed jobs are written to a `FailedJobModel` collection with:
- Job name, arguments, error message, stack trace
- Number of attempts
- Last attempt timestamp
- `status: "dead" | "retrying" | "resolved"`

Admin panel shows dead-letter queue; jobs can be manually retried or dismissed.

### 13.5 Monitoring

- Every job start/complete/fail logged to `platform/logging/channels/JobLogger.ts`
- Job duration tracked via `MetricsCollector.histogram("job.duration", ms, { job })`
- Failed job count exposed on `/metrics` endpoint
- `BackgroundJobFailed` domain event emitted on dead-letter entry

### 13.6 Job registry (current cron jobs → named jobs)

| Current cron | Named job | Schedule |
|---|---|---|
| Installment late check | `installments.checkLate` | Daily 8 AM Riyadh |
| Email marketing daily | `email.dailyCampaign` | Daily 9 AM Riyadh |
| Email marketing weekly | `email.weeklyCollection` | Sunday 10 AM Riyadh |
| QMeet scheduler | `qmeet.scheduleReminders` | Every 5 minutes |

---

## 14. Observability — Design

### 14.1 Health and readiness

```
GET /health    → liveness check — server is running
GET /ready     → readiness check — DB connected, dependencies responsive
```

Liveness (`/health`) returns `200` as long as the Node process is running.
Readiness (`/ready`) checks: MongoDB primary connected, no critical infrastructure error in last 60s.
Both return JSON:

```json
{ "status": "ok" | "degraded" | "down", "checks": { "db": "ok", "smtp": "ok" } }
```

### 14.2 Metrics endpoint

```
GET /metrics   → Prometheus-compatible text format
```

Exposed metrics (initial set):

| Metric | Type | Labels |
|---|---|---|
| `http_requests_total` | Counter | method, route, status |
| `http_request_duration_ms` | Histogram | method, route |
| `db_query_duration_ms` | Histogram | collection, operation |
| `job_duration_ms` | Histogram | job_name |
| `job_failures_total` | Counter | job_name |
| `ws_connections_active` | Gauge | — |
| `ai_requests_total` | Counter | provider, capability |
| `ai_request_duration_ms` | Histogram | provider, capability |
| `wallet_transactions_total` | Counter | type (credit/debit) |

### 14.3 Logging platform — six channels

| Channel | Purpose | Retention |
|---|---|---|
| **Application** | Server start, route registration, DB events | 7 days |
| **Audit** | User-driven state changes (login, order, payment, admin action) | 1 year |
| **Security** | Failed logins, 2FA failures, suspicious IPs, access denials | 1 year |
| **Performance** | Slow queries (>200ms), memory peaks, WS fan-out latency | 30 days |
| **API** | Every HTTP request: method, path, status, duration, correlationId, userId | 7 days |
| **Background Jobs** | Job start, complete, fail, dead-letter events | 30 days |

Every log entry includes: `timestamp` · `level` · `channel` · `correlationId` · `userId` · `ip` · `message` · `meta`

### 14.4 Distributed tracing (future-ready)

The `TraceContext` in `platform/observability/` propagates `X-Trace-ID` across async boundaries using `AsyncLocalStorage`. When an external tracing system (Jaeger, Tempo) is added, the trace ID injection point already exists — no domain code changes needed.

### 14.5 Alerting strategy

| Trigger | Severity | Channel |
|---|---|---|
| `/ready` returns `down` for >60s | Critical | SMS + email |
| `job_failures_total` > 10 in 5 min | High | Email |
| MongoDB connection lost | Critical | SMS + email |
| `http_request_duration_ms` p99 > 3s | Medium | Email |
| Login failures > 50 in 1 min | High | Security email |
| Dead-letter queue depth > 100 | Medium | Email |

Alerting configuration is defined in `config/monitoring.config.ts`. No alerting provider is wired in Sprint 2 — the metric and log infrastructure is built; alerting hooks are added in a subsequent sprint.

---

## 15. Testing Strategy — Design (No Implementation in Sprint 2)

### 15.1 Testing pyramid

```
        ┌──────────────┐
        │   E2E Tests  │  ← few, slow, full stack
        ├──────────────┤
        │   API Tests  │  ← per domain, supertest
        ├──────────────┤
        │  Integration │  ← service + real DB (test container)
        ├──────────────┤
        │  Unit Tests  │  ← domain + service, mocked deps
        └──────────────┘
             many, fast
```

### 15.2 Unit tests

**Target:** domain.ts files.
Domain models are pure functions with no I/O. No mocking required.

```
tests/unit/domains/
  wallet/wallet.domain.test.ts        ← balance invariants
  orders/orders.domain.test.ts        ← status transition rules
  auth/auth.domain.test.ts            ← 2FA state machine
  installments/installments.domain.test.ts
```

Coverage target: **100%** for domain.ts files (pure functions — achievable).

### 15.3 Integration tests

**Target:** service.ts + repository.ts against a real MongoDB test database.
Uses an in-memory MongoDB instance (mongodb-memory-server) or a test Atlas cluster.

```
tests/integration/
  auth/auth.service.test.ts
  orders/orders.service.test.ts
  payments/payments.service.test.ts
  wallet/wallet.service.test.ts
```

Coverage target: **80%** for service.ts files.

### 15.4 API tests

**Target:** full HTTP request → response via supertest, no browser.
Tests every route at the HTTP boundary — validates status code, response shape, headers.

```
tests/api/
  v1/auth/
    login.test.ts             ← POST /api/v1/auth/login
    register.test.ts
    otp.test.ts
  v1/orders/
    create-order.test.ts
    update-status.test.ts
  v1/wallet/
    topup.test.ts
    debit.test.ts
```

### 15.5 Performance tests

**Target:** key financial and AI endpoints under concurrent load.
Tool: k6 (scripts in `tests/performance/`).

| Scenario | Target | Pass criteria |
|---|---|---|
| Login (100 concurrent) | p99 < 500ms | No 5xx errors |
| Order creation (50 concurrent) | p99 < 1s | Zero double-debit |
| Wallet debit (50 concurrent) | p99 < 1s | Balance never negative |
| AI completion (20 concurrent) | p99 < 5s | No provider timeout |

### 15.6 Test tooling

| Layer | Tool |
|---|---|
| Unit | Vitest |
| Integration | Vitest + mongodb-memory-server |
| API | Vitest + supertest |
| Performance | k6 |
| Coverage | Vitest `--coverage` (v8 provider) |

---

## 16. Existing File → Target Location Mapping

| Existing file | Fate in Sprint 2 |
|---|---|
| `server/routes.ts` | **Dissolved** across 20+ domains |
| `server/ai.ts` | → `server/platform/ai/` + `server/domains/ai/` |
| `server/sandbox-routes.ts` | → `server/domains/sandbox/` |
| `server/email.ts` | → `server/infrastructure/smtp/SmtpClient.ts` |
| `server/qmeet.ts` | → `server/domains/qmeet/` |
| `server/deployment-cloud.ts` | → `server/domains/deployment/` |
| `server/email-marketing.ts` | → `server/domains/email-marketing/` |
| `server/storage.ts` | **Dissolved** into per-domain repositories |
| `server/crm.ts` | → `server/domains/crm/` |
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
| `server/auth.ts` | Stays — Passport config |
| `server/index.ts` | Stays — slimmed to bootstrap |
| `server/db.ts` | → `server/infrastructure/database/db.ts` |
| `server/connection-manager.ts` | → `server/infrastructure/database/connection-manager.ts` |
| `server/ws.ts` | → `server/infrastructure/websocket/ws.ts` |
| `server/cache.ts` | → `server/infrastructure/database/cache.ts` |
| `server/cron.ts` | → `server/platform/jobs/JobScheduler.ts` |
| `server/static.ts` | Stays as-is |
| `server/models/` | **Unchanged** — no Mongoose model changes |

---

## 17. Dependency Graph

```
config ◄──────────────────────────────── everything reads config

core/errors ◄─────────────────────────── all layers
core/result ◄─────────────────────────── service, domain layers
core/logger (interface) ◄─────────────── all layers
core/events ◄─────────────────────────── service layer, infrastructure
core/constants ◄──────────────────────── all layers
core/types ◄──────────────────────────── all layers

platform/logging ◄────────────────────── all layers (via interface)
platform/ai ◄─────────────────────────── ai domain, other domains (tool calling)
platform/seo ◄────────────────────────── seo domain, index.ts
platform/jobs ◄───────────────────────── cron, notifications, installments
platform/observability ◄──────────────── index.ts (health/metrics endpoints)

infrastructure/* ◄────────────────────── domain repositories and services

shared/middleware ◄────────────────────── all domain routes
shared/utils ◄────────────────────────── all domain services

notifications ◄──── users, orders, wallet, auth, employees, customers, crm, qmeet
files ◄──────────── orders, projects, system
products ◄──────── orders, store

content ──────────────────────────────► notifications
system ───────────────────────────────► notifications, files
analytics ────────────────────────────► events bus (consumer)
reports ──────────────────────────────► employees, finance, orders

employees ────────────────────────────► users, notifications
customers ────────────────────────────► users, wallet, notifications
wallet ───────────────────────────────► payments, notifications    ← financial critical
installments ────────────────────────► wallet, payments            ← financial critical
payments ─────────────────────────────► wallet, orders             ← financial critical
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

## 18. Migration Plans

Each migration plan is a discrete, approvable unit of work. One plan completes before the next begins.

---

### Migration Plan 1 — Core and Shared Infrastructure

**Purpose:** Establish the foundational packages that all subsequent plans depend on. Pure additions — no existing file is modified or deleted.

**Scope:**
- `server/core/` — all sub-packages (errors, result, logger interface, events, constants, types, feature flags)
- `server/shared/middleware/` — authenticate, staffOnly, rateLimiter, upload, correlationId, requestLogger, errorHandler
- `server/shared/utils/` — sanitize, translate, crypto, response
- `server/config/` — all twelve config files

**Dependencies:** None.

**Risk:** 🟢 Zero — new files only. No existing file touched.

**Rollback Strategy:** Delete the `core/`, `shared/`, and `config/` folders. Zero impact on running server.

**Estimated Time:** 3–4 hours.

**Verification Checklist:**
- [ ] `core/errors/AppError.ts` and hierarchy compile cleanly
- [ ] `core/result/Result.ts` — ok() and err() factories type-check correctly
- [ ] `core/events/IEventBus.ts` interface compiles
- [ ] `core/feature-flags/FeatureFlagService.ts` evaluates flags against mock settings
- [ ] `config/index.ts` — Zod throws on missing required env var
- [ ] `config/index.ts` — all twelve config sections load correctly from test .env
- [ ] `shared/middleware/authenticate.ts` — unauthenticated request returns 401
- [ ] `shared/middleware/rateLimiter.ts` — all limiters construct without error
- [ ] `shared/middleware/correlationId.ts` — injects X-Correlation-ID header
- [ ] TypeScript compilation (`npm run check`) passes with zero errors

**Success Criteria:** `npm run check` passes. Server starts. No behavior change in production.

---

### Migration Plan 2 — Infrastructure Adapters

**Purpose:** Wrap all external integrations behind typed interfaces. Originals remain active during this plan — adapters are built alongside, not replacing.

**Scope:**
- `server/infrastructure/` — all adapter sub-packages (database, smtp, push, imap, ai, oauth, storage, payments, pdf, atlas, websocket, queue, analytics, monitoring, search)

**Dependencies:** Migration Plan 1.

**Risk:** 🟢 Low — new files only. Originals remain active.

**Rollback Strategy:** Delete `infrastructure/` folder. Zero impact.

**Estimated Time:** 5–7 hours.

**Verification Checklist:**
- [ ] `SmtpClient.send()` sends a test email with identical content to current `email.ts`
- [ ] `WebPushClient.send()` delivers a push notification matching current behavior
- [ ] `ImapClient.connect()` establishes IMAP session matching `mail-imap.ts`
- [ ] `OpenAiAdapter.complete()` returns valid response with Arabic-first prompt
- [ ] `KimiAdapter.complete()` returns valid response
- [ ] `PayPalAdapter.createOrder()` returns valid order ID
- [ ] `PdfGenerator.generate()` produces output matching `pdf.ts`
- [ ] All adapters implement their respective interfaces (TypeScript enforced)
- [ ] `npm run check` passes with zero errors

**Success Criteria:** All adapters compile and pass smoke tests. Server behavior unchanged.

---

### Migration Plan 3 — Platform Services

**Purpose:** Build the logging platform, SEO platform, AI platform structure, job engine, and observability endpoints.

**Scope:**
- `server/platform/logging/` — all six channels + transports
- `server/platform/seo/` — SitemapBuilder, MetaResolver, JsonLdBuilder, i18n helpers
- `server/platform/ai/` — AiPlatform + capability stubs
- `server/platform/jobs/` — JobScheduler, JobRegistry, RetryPolicy, DeadLetterHandler
- `server/platform/observability/` — HealthCheck, ReadinessCheck, MetricsEndpoint

**Dependencies:** Migration Plans 1, 2.

**Risk:** 🟡 Medium — logging transport connects to MongoDB (audit log); health/metrics endpoints added to index.ts.

**Rollback Strategy:** Remove platform imports from index.ts. Delete `platform/` folder.

**Estimated Time:** 6–8 hours.

**Verification Checklist:**
- [ ] `GET /health` returns `{ status: "ok" }` with 200
- [ ] `GET /ready` returns DB connection status accurately
- [ ] `GET /metrics` returns Prometheus-format text with expected metric names
- [ ] Audit log writes to MongoDB on test action
- [ ] Security log entry created on failed login
- [ ] API log entry created on every request with correlationId
- [ ] SEO platform generates valid sitemap.xml for test page registry
- [ ] SEO platform resolves Arabic meta correctly
- [ ] AI platform routes to correct provider based on capability
- [ ] Job scheduler fires test job on schedule
- [ ] Dead-letter handler persists failed job to MongoDB
- [ ] `npm run check` passes

**Success Criteria:** All platform endpoints respond. Logs appear in correct channels. No domain behavior changed.

---

### Migration Plan 4 — CRM Domain (Pilot)

**Purpose:** Extract the first domain end-to-end to validate the five-layer pattern (routes → controller → service → domain → repository) before applying it to larger modules.

**Scope:** `server/domains/crm/` — all six files. `server/crm.ts` deleted.

**Dependencies:** Migration Plans 1–3.

**Risk:** 🟢 Low — `crm.ts` is 162 lines, no financial logic, completely self-contained.

**Rollback Strategy:** Restore original `crm.ts` import in `index.ts`. One-line change. Delete `domains/crm/`.

**Estimated Time:** 2–3 hours.

**Verification Checklist:**
- [ ] All CRM API paths return identical responses (status, body shape)
- [ ] GET /api/v1/crm/leads returns same records as before
- [ ] POST /api/v1/crm/leads creates a lead correctly
- [ ] Auth guards apply with same rules
- [ ] Domain event `LeadCreated` emitted (no-op handler)
- [ ] Original `crm.ts` removed and not imported anywhere
- [ ] `npm run check` passes
- [ ] Server starts cleanly

**Success Criteria:** CRM API behavior identical. Pattern validated for reuse.

---

### Migration Plan 5 — Independent Domain Re-layering

**Purpose:** Re-layer the eight already-isolated route files. Routes.ts is not touched.

**Scope:**

| Domain | Source files | ~Lines |
|---|---|---|
| `pwa` | routes-pwa.ts | 327 |
| `email-marketing` | email-marketing.ts | 618 |
| `mail` | routes-mail.ts + mail-imap.ts | 719 |
| `deployment` | deployment-cloud.ts | 1,018 |
| `notifications` | notify.ts + push.ts + email.ts | 1,572 |
| `qmeet` | qmeet.ts + qmeet-db.ts | 1,291 |
| `sandbox` | sandbox-routes.ts + runner + fs | 1,680 |
| `ai` | ai.ts (full AI platform wiring) | 3,545 |

**Dependencies:** Migration Plans 1–4.

**Risk:** 🟡 Medium per domain — each domain extracted one at a time, approval between each.

**Rollback Strategy:** Per domain — re-register original file in `index.ts`. One-line revert. Delete domain folder.

**Estimated Time:** 2–4 hours per domain (16–32 hours total).

**Verification Checklist (per domain):**
- [ ] All API paths return identical responses
- [ ] Auth guards apply with same rules
- [ ] Infrastructure adapters used (no direct SDK calls in domain code)
- [ ] Domain events emitted (no-op)
- [ ] Original source file removed
- [ ] `npm run check` passes
- [ ] Server starts cleanly
- [ ] Manual smoke test of primary user flow

**Success Criteria:** All eight domains operational. routes.ts untouched throughout.

---

### Migration Plan 6 — Low-Coupling Extractions from routes.ts

**Purpose:** Begin dissolving the routes.ts monolith with the safest domains first.

**Scope:**

| Domain | ~Lines in routes.ts | Risk |
|---|---|---|
| `content` | ~800 | 🟢 Low |
| `files` | ~400 | 🟢 Low |
| `products` | ~600 | 🟢 Low |
| `analytics` | ~300 | 🟢 Low |
| `seo` | ~200 | 🟢 Low |
| `system` | ~1,200 | 🟡 Medium |
| `store` | ~500 | 🟡 Medium |
| `reports` | ~700 | 🟡 Medium |

**Dependencies:** Migration Plans 1–5.

**Risk:** 🟡 Medium — extracting from a monolith requires precise line identification. One domain at a time.

**Rollback Strategy:** `git revert` of routes.ts changes for the extracted domain. Delete domain folder.

**Estimated Time:** 2–3 hours per domain.

**Verification Checklist (per domain):**
- [ ] Extracted routes respond identically (status, body shape, headers)
- [ ] Lines removed from routes.ts leave no dangling imports
- [ ] Git diff: only deletions from routes.ts + new domain folder
- [ ] `npm run check` passes
- [ ] Server starts cleanly

**Success Criteria:** routes.ts reduced by ~4,500 lines. Eight new domains operational.

---

### Migration Plan 7 — Medium-Coupling Extractions

**Purpose:** Extract domains that couple to users, notifications, and loyalty.

**Scope:**

| Domain | ~Lines in routes.ts | Dependencies |
|---|---|---|
| `employees` | ~1,500 | users, notifications |
| `customers` | ~1,800 | users, wallet, notifications |

**Dependencies:** Migration Plans 1–6.

**Risk:** 🔴 High — these domains call users and notifications which are not yet extracted. Careful interface design required.

**Rollback Strategy:** `git revert` routes.ts changes. Delete domain folders.

**Estimated Time:** 4–6 hours per domain.

**Verification Checklist:**
- [ ] Attendance check-in/out flow works end-to-end
- [ ] Employee profile, face recognition, GPS check-in unchanged
- [ ] Client portal features (loyalty, tools, wallet view) unchanged
- [ ] Digital contracts unchanged
- [ ] `npm run check` passes
- [ ] Server starts cleanly

**Success Criteria:** routes.ts reduced by ~3,300 more lines. Employee and customer portals fully operational.

---

### Migration Plan 8 — Financial Domains (Critical)

**Purpose:** Extract wallet, payments, and installments — financially critical paths requiring the highest confidence.

**Scope:**

| Domain | ~Lines in routes.ts | Risk |
|---|---|---|
| `wallet` | ~1,000 | 🔴 Critical |
| `installments` | ~600 | 🔴 Critical |
| `payments` | ~800 | 🔴 Critical |

**Dependencies:** Migration Plans 1–7.

**Risk:** 🔴 Critical — financial correctness is non-negotiable. One missed edge case causes real money errors.

**Rollback Strategy:** `git revert`. These domains are extracted last so the revert is a clean, isolated change.

**Estimated Time:** 6–10 hours per domain.

**Verification Checklist:**
- [ ] Wallet top-up creates correct WalletTransaction record
- [ ] Wallet debit never produces negative balance (domain invariant)
- [ ] Wallet PIN enforcement identical
- [ ] PayPal order creation and capture flow identical
- [ ] Invoice creation and payment status transitions identical
- [ ] Installment payment scheduling identical
- [ ] Journal entries balance (debit = credit)
- [ ] Idempotency key prevents double-charge on retry
- [ ] `npm run check` passes
- [ ] Server starts cleanly

**Success Criteria:** All financial flows verified correct. Zero regression in money movement.

---

### Migration Plan 9 — Core Domains (Most Complex)

**Purpose:** Extract projects, orders, users, and auth — the highest-coupling, most complex domains.

**Scope:**

| Domain | ~Lines in routes.ts | Risk |
|---|---|---|
| `projects` | ~2,000 | 🔴 High |
| `orders` | ~2,500 | 🔴 High |
| `users` | ~1,200 | 🔴 Critical |
| `auth` | ~3,000 | 🔴 Critical |

**Dependencies:** All previous migration plans.

**Risk:** 🔴 Critical — auth failure locks out all users. Orders and projects are the core product.

**Rollback Strategy:** `git revert`. By this point routes.ts contains only these domains; the revert is small and targeted.

**Estimated Time:** 8–16 hours per domain.

**Verification Checklist:**
- [ ] Full auth flow: registration, login, logout
- [ ] All 2FA methods: email OTP, TOTP, push approval, passphrase, WebAuthn, Face, PIN
- [ ] OAuth: Google, GitHub, Apple
- [ ] Session persistence across restart
- [ ] Order creation, all status transitions, specs, modification requests
- [ ] Project creation, task assignment, kanban, vault, time logging
- [ ] User profile update, avatar, password change
- [ ] Admin user management
- [ ] `npm run check` passes
- [ ] Server starts cleanly
- [ ] routes.ts is empty (or deleted)

**Success Criteria:** routes.ts fully dissolved. All API behavior identical. Complete five-layer architecture in place across all domains.

---

## 19. What Does Not Change in Sprint 2

- No API path changes
- No HTTP response shape changes (existing shapes preserved; new envelope adopted only in new code)
- No UI changes
- No business logic changes
- No Mongoose model changes
- No database schema changes
- No `shared/` schema changes (`shared/schema.ts`, `shared/routes.ts` untouched)
- No `client/` changes
- No new features

All changes are structural reorganization only. Every domain is verified against original behavior before the next migration plan begins.

---

## 20. Deliverable Template (per migration plan)

| Field | Detail |
|---|---|
| Migration Plan | e.g., Migration Plan 4 — CRM Domain |
| Purpose | Why this plan was executed |
| Scope | Files created, modified, deleted |
| Files created | list with purpose |
| Files modified | list with description of change |
| Files deleted | list |
| Routes preserved | all API paths + HTTP methods |
| Behavior verified | manual test results per endpoint |
| Events emitted | domain events added |
| Risks remaining | known gaps or deferred items |
| Next plan unblocked | which migration plan can now start |

---

*End of Sprint 2 Phase 1 — Architecture Design (v3)*
*Awaiting approval before any implementation begins.*
