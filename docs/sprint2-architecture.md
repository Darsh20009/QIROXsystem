# Sprint 2 — Enterprise Backend Architecture Design

**Status:** Phase 1 — Design Only. No code has been modified.  
**Date:** 2026-07-09  
**Scope:** server/ directory only. UI, shared/, and client/ are unchanged.

---

## 1. Current State Assessment

### File inventory (server/)

| File | Lines | Current role | Problem |
|---|---|---|---|
| `routes.ts` | 16,406 | Monolith — all business logic, all routes, all validation | Too large; everything mixed |
| `ai.ts` | 3,545 | AI routes + logic | Already separate; needs layering |
| `sandbox-routes.ts` | 1,316 | Sandbox IDE routes | Already separate; needs layering |
| `email.ts` | 1,314 | SMTP helpers + email templates | Logic and transport mixed |
| `qmeet.ts` | 1,193 | QMeet video conferencing | Already separate; needs layering |
| `index.ts` | 1,066 | App bootstrap + middleware | Too fat; should be thin |
| `deployment-cloud.ts` | 1,018 | Cloud deployment routes | Already separate; needs layering |
| `email-marketing.ts` | 618 | Bulk email campaign routes | Already separate; needs layering |
| `storage.ts` | 615 | Partial repository layer | Covers only ~20% of DB access |
| `pdf.ts` | 486 | PDF generation helpers | Utility; fine as-is |
| `mail-imap.ts` | 455 | IMAP client wrapper | Utility; fine as-is |
| `changelog.ts` | 367 | Changelog data | Static; fine as-is |
| `routes-pwa.ts` | 327 | PWA/push subscription routes | Already separate |
| `ws.ts` | 275 | WebSocket hub | Infrastructure; fine as-is |
| `routes-mail.ts` | 264 | Corporate mail routes | Already separate |
| `crm.ts` | 162 | CRM routes | Already separate; very thin |
| `auth.ts` | 156 | Passport config | Infrastructure; fine as-is |
| `notify.ts` | 157 | Notification dispatch helpers | Utility; fine as-is |
| `atlas.ts` | 150 | MongoDB Atlas API client | Utility; fine as-is |
| `push.ts` | 101 | Web push helpers | Utility; fine as-is |
| `paypal.ts` | 188 | PayPal SDK wrapper | Utility; fine as-is |

### Models inventory (server/models/) — already domain-split, keep as-is

| File | Models | Domain |
|---|---|---|
| `user.ts` | UserModel | Identity |
| `auth.ts` | OtpModel, WebAuthnCredentialModel, DeviceTokenModel, Pending2FAModel, PushChallengeModel, PhoneVerifyOtpModel, ClientApiKeyModel, AuthAppModel, AuthAppEnrollmentModel | Identity/Auth |
| `hr.ts` | AttendanceModel, EmployeeProfileModel, PromotionLogModel, FaceDescriptorModel | HR |
| `orders.ts` | OrderModel, CartModel, OrderSpecsModel, ModificationRequestModel, ModPlanConfigModel, ModTypePriceModel, ModQuotaAddonModel, SubServiceRequestModel, OrderExpenseModel, PriceRequestModel, ReviewModel, ContractModel, PaymobOnboardingModel | Orders |
| `finance.ts` | InvoiceModel, ReceiptVoucherModel, ActivityLogModel, PayrollRecordModel, BankSettingsModel, EmployeePaymentModel, WalletTransactionModel, WalletTopupModel, WalletPayOtpModel, InvestorProfileModel, InvestmentPaymentModel, OperationalExpenseModel, JournalEntryModel, QuotationModel | Finance |
| `projects.ts` | ProjectModel, TaskModel, ProjectMemberModel, MessageModel, ProjectVaultModel, ChecklistItemModel, ProjectFeatureModel, ProjectIssueModel, MeetingRequestModel, TimeLogModel, ProjectCommentModel, ClientDataRequestModel, KanbanTaskModel | Projects |
| `crm.ts` | CrmLeadModel, CrmLeadNoteModel, CrmDealModel, CrmContactModel, LeadDataModel, SwitchReminderModel, PhoneRequestModel | CRM |
| `comms.ts` | NotificationModel, InboxMessageModel, CsSessionModel, SupportTicketModel, PushSubscriptionModel, GroupChatModel, GroupMessageModel, NativePushTokenModel | Communications |
| `services.ts` | ServiceModel, SectorTemplateModel, PricingPlanModel, SegmentPricingModel, SystemFeatureModel, ExtraAddonModel, ProjectAddonSubscriptionModel | Products/Services |
| `content.ts` | NewsModel, JobModel, ApplicationModel, PartnerModel, ContactMessageModel, MarketingPostModel | Content |
| `ecommerce.ts` | QiroxProductModel, DiscountCodeModel, DeviceShipmentModel, ShippingCompanyModel, CountryModel | E-commerce |
| `system.ts` | CronJobModel, AtlasConfigModel, AtlasDbUserModel, AppPublishConfigModel, QiroxSystemSettingsModel, StorePublishConfigModel | System |
| `meetings.ts` | ConsultationSlotModel, ConsultationBookingModel, QMeetingModel, QFeedbackModel, QReportModel | QMeet |
| `installments.ts` | InstallmentOfferModel, InstallmentApplicationModel, InstallmentPaymentModel, LoyaltyAccountModel, LoyaltyTransactionModel | Finance/Loyalty |
| `mail.ts` | MailAccountModel, MailMessageModel, MailFolderModel | Corporate Mail |
| `sandbox.ts` | SandboxProjectModel, SandboxEnvVarModel, SandboxFileModel, SandboxDeploymentModel | Sandbox |
| `deployment.ts` | DeploymentProjectModel, DeploymentRunModel | Deployment |
| `client-tools.ts` | HtmlPublishModel, ShortUrlModel, ReferralModel, ClientWebhookModel, EmbedTokenModel | Client Tools |

---

## 2. Target Folder Structure

```
server/
│
├── index.ts                        ← slim orchestrator (keep, reduce size)
├── db.ts                           ← database bootstrap (keep as-is)
├── connection-manager.ts           ← MongoDB connection handling (keep as-is)
├── ws.ts                           ← WebSocket hub (keep as-is)
├── cache.ts                        ← in-memory cache (keep as-is)
├── cron.ts                         ← cron job runner (keep as-is)
├── static.ts                       ← static file serving (keep as-is)
├── auth.ts                         ← Passport config (keep as-is)
│
├── models/                         ← Mongoose models (keep as-is — already split)
│   ├── user.ts
│   ├── auth.ts
│   ├── hr.ts
│   ├── orders.ts
│   ├── finance.ts
│   ├── projects.ts
│   ├── crm.ts
│   ├── comms.ts
│   ├── services.ts
│   ├── content.ts
│   ├── ecommerce.ts
│   ├── system.ts
│   ├── meetings.ts
│   ├── installments.ts
│   ├── mail.ts
│   ├── sandbox.ts
│   ├── deployment.ts
│   └── client-tools.ts
│
├── shared/                         ← NEW — cross-cutting infrastructure
│   ├── middleware/
│   │   ├── authenticate.ts         ← isAuthenticated guard (from auth.ts + routes.ts)
│   │   ├── staffOnly.ts            ← role guard (from routes.ts inline)
│   │   ├── rateLimiter.ts          ← loginLimiter, otpLimiter, etc. (from routes.ts)
│   │   └── upload.ts               ← multer config (from routes.ts)
│   ├── errors/
│   │   ├── AppError.ts             ← typed error base class
│   │   └── errorHandler.ts         ← global Express error middleware
│   └── utils/
│       ├── sanitize.ts             ← sanitizeUser and similar (from routes.ts)
│       ├── translate.ts            ← translateError Arabic helper (from routes.ts)
│       ├── crypto.ts               ← scrypt, hashing helpers (from routes.ts)
│       └── response.ts             ← standard API response shapes
│
└── modules/                        ← NEW — one folder per business domain
    │
    ├── auth/                       ← Authentication & identity
    │   ├── auth.routes.ts
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── auth.repository.ts
    │   ├── auth.validation.ts
    │   └── auth.types.ts
    │
    ├── users/                      ← User profile management
    │   ├── users.routes.ts
    │   ├── users.controller.ts
    │   ├── users.service.ts
    │   ├── users.repository.ts
    │   ├── users.validation.ts
    │   └── users.types.ts
    │
    ├── employees/                  ← HR: attendance, profiles, payroll
    │   ├── employees.routes.ts
    │   ├── employees.controller.ts
    │   ├── employees.service.ts
    │   ├── employees.repository.ts
    │   ├── employees.validation.ts
    │   └── employees.types.ts
    │
    ├── customers/                  ← Client portal: loyalty, tools, wallet
    │   ├── customers.routes.ts
    │   ├── customers.controller.ts
    │   ├── customers.service.ts
    │   ├── customers.repository.ts
    │   ├── customers.validation.ts
    │   └── customers.types.ts
    │
    ├── products/                   ← Services, pricing plans, sector templates
    │   ├── products.routes.ts
    │   ├── products.controller.ts
    │   ├── products.service.ts
    │   ├── products.repository.ts
    │   ├── products.validation.ts
    │   └── products.types.ts
    │
    ├── orders/                     ← Order lifecycle, specs, modifications
    │   ├── orders.routes.ts
    │   ├── orders.controller.ts
    │   ├── orders.service.ts
    │   ├── orders.repository.ts
    │   ├── orders.validation.ts
    │   └── orders.types.ts
    │
    ├── projects/                   ← Project tracking, tasks, kanban, vault
    │   ├── projects.routes.ts
    │   ├── projects.controller.ts
    │   ├── projects.service.ts
    │   ├── projects.repository.ts
    │   ├── projects.validation.ts
    │   └── projects.types.ts
    │
    ├── payments/                   ← PayPal, invoices, receipts, journal entries
    │   ├── payments.routes.ts
    │   ├── payments.controller.ts
    │   ├── payments.service.ts
    │   ├── payments.repository.ts
    │   ├── payments.validation.ts
    │   └── payments.types.ts
    │
    ├── wallet/                     ← Wallet balance, top-up, PIN, transactions
    │   ├── wallet.routes.ts
    │   ├── wallet.controller.ts
    │   ├── wallet.service.ts
    │   ├── wallet.repository.ts
    │   ├── wallet.validation.ts
    │   └── wallet.types.ts
    │
    ├── installments/               ← Installment offers, applications, payments
    │   ├── installments.routes.ts
    │   ├── installments.controller.ts
    │   ├── installments.service.ts
    │   ├── installments.repository.ts
    │   ├── installments.validation.ts
    │   └── installments.types.ts
    │
    ├── crm/                        ← Leads, deals, contacts, switch reminders
    │   ├── crm.routes.ts           ← from crm.ts
    │   ├── crm.controller.ts
    │   ├── crm.service.ts
    │   ├── crm.repository.ts
    │   ├── crm.validation.ts
    │   └── crm.types.ts
    │
    ├── mail/                       ← Corporate mail (IMAP + compose)
    │   ├── mail.routes.ts          ← from routes-mail.ts
    │   ├── mail.controller.ts
    │   ├── mail.service.ts         ← absorbs mail-imap.ts logic
    │   ├── mail.repository.ts
    │   ├── mail.validation.ts
    │   └── mail.types.ts
    │
    ├── notifications/              ← In-app, push, email, WebSocket dispatch
    │   ├── notifications.routes.ts
    │   ├── notifications.controller.ts
    │   ├── notifications.service.ts ← absorbs notify.ts + push.ts logic
    │   ├── notifications.repository.ts
    │   ├── notifications.validation.ts
    │   └── notifications.types.ts
    │
    ├── ai/                         ← AI sessions, image gen, video gen
    │   ├── ai.routes.ts            ← from ai.ts
    │   ├── ai.controller.ts
    │   ├── ai.service.ts
    │   ├── ai.repository.ts
    │   ├── ai.validation.ts
    │   └── ai.types.ts
    │
    ├── qmeet/                      ← Video conferencing, rooms, feedback
    │   ├── qmeet.routes.ts         ← from qmeet.ts
    │   ├── qmeet.controller.ts
    │   ├── qmeet.service.ts
    │   ├── qmeet.repository.ts     ← absorbs qmeet-db.ts
    │   ├── qmeet.validation.ts
    │   └── qmeet.types.ts
    │
    ├── reports/                    ← Financial reports, attendance, payroll
    │   ├── reports.routes.ts
    │   ├── reports.controller.ts
    │   ├── reports.service.ts
    │   ├── reports.repository.ts
    │   ├── reports.validation.ts
    │   └── reports.types.ts
    │
    ├── analytics/                  ← Visitor stats, conversions, funnels
    │   ├── analytics.routes.ts
    │   ├── analytics.controller.ts
    │   ├── analytics.service.ts
    │   ├── analytics.repository.ts
    │   └── analytics.types.ts
    │
    ├── files/                      ← File upload, download, media, PDF export
    │   ├── files.routes.ts
    │   ├── files.controller.ts
    │   ├── files.service.ts        ← absorbs pdf.ts logic
    │   ├── files.validation.ts
    │   └── files.types.ts
    │
    ├── content/                    ← News, jobs, partners, contact messages
    │   ├── content.routes.ts
    │   ├── content.controller.ts
    │   ├── content.service.ts
    │   ├── content.repository.ts
    │   ├── content.validation.ts
    │   └── content.types.ts
    │
    ├── store/                      ← E-commerce: products, cart, discount codes
    │   ├── store.routes.ts
    │   ├── store.controller.ts
    │   ├── store.service.ts
    │   ├── store.repository.ts
    │   ├── store.validation.ts
    │   └── store.types.ts
    │
    ├── system/                     ← Admin settings, cron jobs, Atlas, changelog
    │   ├── system.routes.ts
    │   ├── system.controller.ts
    │   ├── system.service.ts
    │   ├── system.repository.ts    ← absorbs atlas.ts + changelog.ts
    │   ├── system.validation.ts
    │   └── system.types.ts
    │
    ├── sandbox/                    ← Cloud IDE, project runner, file system
    │   ├── sandbox.routes.ts       ← from sandbox-routes.ts
    │   ├── sandbox.controller.ts
    │   ├── sandbox.service.ts      ← absorbs sandbox-runner.ts + sandbox-fs.ts
    │   ├── sandbox.repository.ts
    │   ├── sandbox.validation.ts
    │   └── sandbox.types.ts
    │
    ├── deployment/                 ← Cloud deployment, GitHub OAuth, subdomains
    │   ├── deployment.routes.ts    ← from deployment-cloud.ts
    │   ├── deployment.controller.ts
    │   ├── deployment.service.ts
    │   ├── deployment.repository.ts
    │   ├── deployment.validation.ts
    │   └── deployment.types.ts
    │
    ├── email-marketing/            ← Bulk campaigns, lead collection
    │   ├── email-marketing.routes.ts  ← from email-marketing.ts
    │   ├── email-marketing.controller.ts
    │   ├── email-marketing.service.ts
    │   ├── email-marketing.repository.ts
    │   └── email-marketing.types.ts
    │
    └── pwa/                        ← Push subscriptions, service worker support
        ├── pwa.routes.ts           ← from routes-pwa.ts
        ├── pwa.controller.ts
        ├── pwa.service.ts
        └── pwa.types.ts
```

---

## 3. Layered Architecture — Contract Per Layer

Every module follows this contract. Business logic never lives in routes.

```
Request
  └─▶ routes.ts          Mounts Express router. Applies middleware (auth guard,
  │                       rate limiter, multer). Calls controller method. No logic.
  │
  └─▶ controller.ts      Reads req, calls service, writes res. No DB access.
  │                       Catches service errors and maps to HTTP responses.
  │
  └─▶ service.ts         All business rules. Orchestrates across repositories.
  │                       Calls notify, email, ws. No req/res references.
  │
  └─▶ repository.ts      All Mongoose queries. Returns plain objects or
  │                       typed documents. No business logic. No HTTP.
  │
  └─▶ validation.ts      Zod schemas for request body/params/query.
  │                       Re-exports shared schema fragments from shared/schema.ts.
  │
  └─▶ types.ts           DTOs (plain interfaces). Input types, output types,
                          service params. No Mongoose document types leaked upward.
```

### Shared infrastructure (`server/shared/`)

| File | What it replaces |
|---|---|
| `middleware/authenticate.ts` | `req.isAuthenticated()` guard pattern scattered in routes.ts |
| `middleware/staffOnly.ts` | `staffOnly` middleware defined inline in routes.ts |
| `middleware/rateLimiter.ts` | `loginLimiter`, `otpLimiter`, `registerLimiter`, `contactLimiter` defined in routes.ts |
| `middleware/upload.ts` | `upload` (20 MB) and `uploadLarge` (500 MB) multer instances in routes.ts |
| `errors/AppError.ts` | New — typed error class with statusCode, code, isOperational |
| `errors/errorHandler.ts` | Replaces 200+ scattered `catch (err) { res.status(500) }` blocks |
| `utils/sanitize.ts` | `sanitizeUser` and similar helpers in routes.ts |
| `utils/translate.ts` | `translateError` Arabic helper in routes.ts |
| `utils/crypto.ts` | `scryptHash`, `scryptVerify`, OTP generators scattered in routes.ts |
| `utils/response.ts` | Standard `{ ok, data, error }` envelope (new but backward-compatible) |

---

## 4. Existing File → New Location Mapping

| Existing file | What happens to it |
|---|---|
| `server/routes.ts` | **Dissolved** across 20+ modules. This is the primary extraction target. |
| `server/ai.ts` | → `server/modules/ai/` (re-layered) |
| `server/sandbox-routes.ts` | → `server/modules/sandbox/` (re-layered) |
| `server/email.ts` | → `server/modules/notifications/` (SMTP logic into service) |
| `server/qmeet.ts` | → `server/modules/qmeet/` (re-layered) |
| `server/deployment-cloud.ts` | → `server/modules/deployment/` (re-layered) |
| `server/email-marketing.ts` | → `server/modules/email-marketing/` (re-layered) |
| `server/storage.ts` | **Dissolved** into per-module repositories |
| `server/crm.ts` | → `server/modules/crm/` (re-layered; already thin) |
| `server/routes-mail.ts` | → `server/modules/mail/` routes file |
| `server/routes-pwa.ts` | → `server/modules/pwa/` routes file |
| `server/mail-imap.ts` | → absorbed into `server/modules/mail/mail.service.ts` |
| `server/sandbox-runner.ts` | → absorbed into `server/modules/sandbox/sandbox.service.ts` |
| `server/sandbox-fs.ts` | → absorbed into `server/modules/sandbox/sandbox.service.ts` |
| `server/notify.ts` | → absorbed into `server/modules/notifications/notifications.service.ts` |
| `server/push.ts` | → absorbed into `server/modules/notifications/notifications.service.ts` |
| `server/pdf.ts` | → absorbed into `server/modules/files/files.service.ts` |
| `server/atlas.ts` | → absorbed into `server/modules/system/system.repository.ts` |
| `server/changelog.ts` | → absorbed into `server/modules/system/system.service.ts` |
| `server/paypal.ts` | → absorbed into `server/modules/payments/payments.service.ts` |
| `server/qmeet-db.ts` | → absorbed into `server/modules/qmeet/qmeet.repository.ts` |
| `server/cpanel.ts` | → absorbed into `server/modules/system/system.service.ts` |
| `server/auth.ts` | Stays — Passport config; referenced by shared middleware |
| `server/index.ts` | Stays — slimmed to only bootstrap + route registration |
| `server/db.ts` | Stays as-is |
| `server/connection-manager.ts` | Stays as-is |
| `server/ws.ts` | Stays as-is |
| `server/cache.ts` | Stays as-is |
| `server/cron.ts` | Stays as-is |
| `server/static.ts` | Stays as-is |
| `server/models/` | Stays as-is — no changes to Mongoose models |

---

## 5. Extraction Sequence, Risk, and Rationale

Modules are extracted in three waves based on isolation level and risk.

---

### Wave 1 — Infrastructure First (no routes.ts dependency)

These create the shared foundation every other module depends on. Must be done first.

| Step | Module | Size estimate | Risk | Rationale |
|---|---|---|---|---|
| 1 | `server/shared/errors/` | ~80 lines total | 🟢 Zero | New files only. Nothing is deleted. |
| 2 | `server/shared/middleware/` | ~120 lines total | 🟢 Zero | New files only. Existing inline middleware stays until cutover. |
| 3 | `server/shared/utils/` | ~150 lines total | 🟢 Zero | Copies existing inline helpers. Originals deleted only after all callsites updated. |

---

### Wave 2 — Already-Isolated Modules (re-layering only)

These files are already separate from routes.ts. We add the controller/service/repository layers without touching anything else.

| Step | Module | Source files | Lines to re-layer | Risk | Can extract independently? |
|---|---|---|---|---|---|
| 4 | `crm` | `crm.ts` (162 lines) | ~162 | 🟢 Low | ✅ Yes |
| 5 | `qmeet` | `qmeet.ts` (1,193), `qmeet-db.ts` (98) | ~1,291 | 🟡 Medium | ✅ Yes |
| 6 | `ai` | `ai.ts` (3,545) | ~3,545 | 🟡 Medium | ✅ Yes |
| 7 | `sandbox` | `sandbox-routes.ts` (1,316), `sandbox-runner.ts` (212), `sandbox-fs.ts` (152) | ~1,680 | 🟡 Medium | ✅ Yes |
| 8 | `deployment` | `deployment-cloud.ts` (1,018) | ~1,018 | 🟡 Medium | ✅ Yes |
| 9 | `mail` | `routes-mail.ts` (264), `mail-imap.ts` (455) | ~719 | 🟡 Medium | ✅ Yes |
| 10 | `email-marketing` | `email-marketing.ts` (618) | ~618 | 🟢 Low | ✅ Yes |
| 11 | `pwa` | `routes-pwa.ts` (327) | ~327 | 🟢 Low | ✅ Yes |
| 12 | `notifications` | `notify.ts` (157), `push.ts` (101), `email.ts` (1,314) | ~1,572 | 🟡 Medium | ✅ Yes |

---

### Wave 3 — Extraction from routes.ts monolith

These are embedded in routes.ts and require careful line-by-line extraction. Each module is extracted one at a time with approval between each.

| Step | Module | Approx. lines in routes.ts | Risk | Dependencies |
|---|---|---|---|---|
| 13 | `content` | ~800 | 🟢 Low | notifications |
| 14 | `system` | ~1,200 | 🟡 Medium | notifications, files |
| 15 | `files` | ~400 | 🟢 Low | shared/middleware/upload |
| 16 | `products` | ~600 | 🟢 Low | none |
| 17 | `store` | ~500 | 🟡 Medium | payments |
| 18 | `reports` | ~700 | 🟡 Medium | finance, hr, orders |
| 19 | `analytics` | ~300 | 🟢 Low | system |
| 20 | `employees` | ~1,500 | 🟡 Medium | users, notifications |
| 21 | `customers` | ~1,800 | 🟡 Medium | users, wallet, notifications |
| 22 | `wallet` | ~1,000 | 🔴 High | payments, notifications (financial) |
| 23 | `installments` | ~600 | 🔴 High | wallet, payments |
| 24 | `payments` | ~800 | 🔴 High | wallet, orders |
| 25 | `projects` | ~2,000 | 🔴 High | orders, notifications, files |
| 26 | `orders` | ~2,500 | 🔴 High | products, payments, projects |
| 27 | `users` | ~1,200 | 🔴 High | auth, notifications |
| 28 | `auth` | ~3,000 | 🔴 High | users, notifications, all 2FA paths |

---

## 6. Dependency Graph

```
shared/errors ◄────────────────── everything
shared/middleware ◄─────────────── all routes
shared/utils ◄──────────────────── all services

notifications ◄─────────────────── users, orders, wallet, auth, employees, customers
files ◄──────────────────────────── orders, projects, system
products ◄──────────────────────── orders, store

content ──────────────────────────► notifications
system ───────────────────────────► notifications, files
analytics ────────────────────────► system
reports ──────────────────────────► finance, hr, orders

employees ────────────────────────► users, notifications
customers ────────────────────────► users, wallet, notifications
wallet ───────────────────────────► payments, notifications    ← financial critical
installments ────────────────────► wallet, payments           ← financial critical
payments ─────────────────────────► wallet, orders            ← financial critical
projects ─────────────────────────► orders, notifications, files
orders ───────────────────────────► products, payments, projects
users ────────────────────────────► auth, notifications
auth ─────────────────────────────► users, notifications      ← most complex

crm ──────────── independent
qmeet ────────── independent
ai ───────────── independent
sandbox ──────── independent
deployment ───── independent
mail ─────────── independent
email-marketing ─ independent
pwa ──────────── independent
```

---

## 7. Global Error Handling Strategy

### Current state
Error handling is scattered. Every route handler repeats:
```ts
} catch (err: any) {
  res.status(500).json({ error: err.message });
}
```
Some routes return Arabic messages via `translateError()`, others return raw English errors.
There is no consistent envelope format.

### Target state

**`server/shared/errors/AppError.ts`**
```ts
// Typed operational error — not a bug, a known failure case
class AppError extends Error {
  statusCode: number;
  code: string;         // machine-readable: "AUTH_INVALID_OTP"
  isOperational: true;
}
```

**`server/shared/errors/errorHandler.ts`**  
Global Express error middleware registered last in index.ts.
- Catches all errors forwarded via `next(err)`
- Maps `AppError` → structured response
- Maps unknown errors → 500 with safe message (no stack in production)
- Logs non-operational errors for monitoring

**Response envelope (backward-compatible)**  
All existing responses remain unchanged during extraction. The envelope is adopted in new code, not retrofitted into existing routes during Sprint 2.

```ts
// Success
{ ok: true, data: T }

// Error
{ ok: false, error: { code: string, message: string } }
```

---

## 8. Modules Safe to Extract Without Affecting Production

The following modules are fully isolated — they register their own router, have their own files, and do not share logic with routes.ts. They can be re-layered without touching any production route:

| Module | Reason it is safe |
|---|---|
| `crm` | `crm.ts` is self-contained, only 162 lines, minimal imports |
| `email-marketing` | `email-marketing.ts` self-contained, no overlap with routes.ts |
| `pwa` | `routes-pwa.ts` self-contained, push subscription only |
| `deployment` | `deployment-cloud.ts` self-contained, own CloudLayout |
| `ai` | `ai.ts` self-contained, own registerAiRoutes |
| `qmeet` | `qmeet.ts` self-contained, own registerQMeetRoutes |
| `sandbox` | `sandbox-routes.ts` self-contained |
| `mail` | `routes-mail.ts` self-contained |

**Recommended first extraction: `crm`**  
It is the smallest (162 lines), lowest risk, has no financial logic, and serves as the template for all subsequent extractions. Completing it proves the pattern before applying it to larger modules.

---

## 9. What Is Not Changing in Sprint 2

- No UI changes
- No API path changes
- No business logic changes
- No database schema changes
- No Mongoose model changes
- No shared/ schema changes
- No client/ changes
- No new features

All changes are structural reorganization only. Every extracted module must behave identically to the code it replaces, verified by manual API testing after each extraction.

---

## 10. Deliverable Template (per module)

After each extraction, report:

| Field | Value |
|---|---|
| Module | e.g., `crm` |
| Files created | list |
| Files modified | list |
| Files deleted | list |
| Routes preserved | list all API paths |
| Behavior preserved | manual test results |
| Risks remaining | known gaps |

---

*End of Sprint 2 Phase 1 — Architecture Design*  
*Awaiting approval before any implementation begins.*
