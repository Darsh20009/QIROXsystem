# Email Domain

## Purpose

Encapsulates all transactional email sending for the Qirox platform within a
clean, layered architecture. Provides a single, typed public API that any other
domain or route handler can import instead of calling the legacy `server/email.ts`
monolith directly.

## Responsibilities

- Resolve SMTP configuration from `connManager` and environment variables.
- Build HTML email bodies from pure template builder functions.
- Dispatch transactional emails via nodemailer (SMTP).
- Look up per-sender MailAccount credentials from MongoDB for `sendEmailAs`.
- Expose a drop-in replacement API matching every function in `server/email.ts`.

**Out of scope:**
- Email campaigns and bulk marketing (`server/email-marketing.ts`).
- IMAP inbox reading (`server/mail-imap.ts`).
- Mail account management CUD operations.
- SMTP infrastructure provisioning or cPanel management.

## Boundaries

| Allowed | Prohibited |
|---|---|
| Import from `connection-manager`, `utils` | Direct route/controller logic |
| Import from `./infrastructure/*` (adapters) | `import("../../email")` dynamic imports inside service/domain |
| MongoDB reads from `MailAccount` collection | MongoDB writes of any kind |
| Call nodemailer inside `service.ts` only | Calling nodemailer from `domain.ts` or `repository.ts` |

## Layer Responsibilities

```
types.ts          — Shared interfaces. No logic.
domain.ts         — Pure functions: config resolution, HTML template builders.
repository.ts     — DB reads only: MailAccountModel.findOne()
service.ts        — Orchestration: config → template → dispatch. Imports nodemailer.
controller.ts     — HTTP boundary: req/res → service → res.json()
mapper.ts         — Response shaping: SendResult → HTTP JSON
validation.ts     — Zod schema stubs (wired in Migration 010+)
routes.ts         — Route registration (no-op in Migration 009)
infrastructure/   — Adapters for external systems (legacy email, future providers)
index.ts          — Public barrel export
```

## Dependencies

| Dependency | Reason |
|---|---|
| `server/connection-manager.ts` | Live SMTP config (senderName, siteUrl, logoUrl) |
| `server/utils.ts` | `cleanName()` for display name sanitisation |
| `server/models.ts` (MailAccountModel) | SMTP credential lookup for sendEmailAs |
| `server/email.ts` (via adapter only) | 14 complex templates not yet migrated (TECH-001) |
| `nodemailer` | SMTP transport (service.ts only) |

## Public API

All functions are exported from `index.ts`. Import:

```typescript
import { sendWelcomeEmail, sendOtpEmail } from "../domains/email";
```

### Core primitives
| Function | Description |
|---|---|
| `sendEmail(to, toName, subject, html, text?, attachments?)` | Default SMTP sender |
| `sendEmailAs(fromEmail, to, toName, subject, html, text?)` | Per-account SMTP sender |

### Auth / OTP
`sendWelcomeEmail` · `sendOtpEmail` · `sendEmailVerificationEmail` · `sendLoginOtpEmail`

### Orders & Finance
`sendOrderConfirmationEmail` · `sendOrderStatusEmail` · `sendInvoiceEmail` · `sendReceiptEmail` · `sendQuotationEmail`

### Project & Task
`sendProjectUpdateEmail` · `sendTaskAssignedEmail` · `sendTaskCompletedEmail` · `sendTaskStatusEmail` · `sendFeaturesEmail` · `sendMessageNotificationEmail`

### Admin
`sendAdminNewClientEmail` · `sendAdminNewOrderEmail` · `sendOwnerWAEmail` · `sendAdminNewTicketEmail`

### Meetings & Consultations
`sendQMeetInviteEmail` · `sendQMeetReminderEmail` · `sendConsultationConfirmationEmail` · `sendConsultationNotificationEmail`

### Support & Communication
`sendSupportTicketCreatedEmail` · `sendSupportTicketReplyEmail` · `sendIncomingCallEmail` · `sendCallRatingEmail`

### Finance / Wallet
`sendWalletPayOtpEmail` · `sendWalletTopupStatusEmail`

### Other
`sendDirectEmail` · `sendShipmentUpdateEmail` · `sendDataRequestEmail` · `sendWeeklyReportEmail` · `sendTestEmail` · `sendWelcomeWithCredentialsEmail`

## How to switch a consumer from legacy to this domain

```typescript
// Before
import { sendWelcomeEmail } from "../../email";

// After
import { sendWelcomeEmail } from "../domains/email";
```

Signatures are identical. Rollback is one line per file. Switch only after QA
approval per the Zero Downtime Policy.

## Future Planned Migrations

| Migration | Target |
|---|---|
| Migration 010 | Wire Zod validation schemas (`validation.ts`) into request pipeline |
| Migration 011 | Migrate 14 remaining templates from adapter into `domain.ts` builders; delete `infrastructure/legacy-email-adapter.ts` (resolves TECH-001, TECH-002) |
| Migration 012 | Register admin email routes from `routes.ts`; migrate from `server/routes.ts` |
| Migration 013 | Add typed mapper DTOs; remove pass-through mapper (resolves TECH-003 for email) |

## Tech Debt Tracked

- **TECH-001** — 14 templates still delegate to legacy via Infrastructure Adapter
- **TECH-002** — `baseTemplate`/`emailBanner` duplicated in `domain.ts` and `server/email.ts`
- **TECH-004** — Zod validation stubs not wired
- **TECH-005** — Admin email routes still in `server/routes.ts`
