# Mail Domain

## Purpose

Encapsulates internal mail account management and inbox operations within a
clean, layered architecture. Handles per-user cPanel email accounts (SMTP/IMAP
credentials), inbox display, and internal messaging between platform users.

**Distinct from the Email domain:** The Email domain sends outbound transactional
emails. The Mail domain manages user-facing mail accounts and their inboxes.

## Responsibilities

- Mail account CRUD (cPanel SMTP/IMAP account records).
- Inbox cache reads (MailCacheModel).
- Internal message routing between platform users.
- Assignment of mail accounts to users.

**Out of scope:**
- Sending transactional emails (use the email domain).
- Email marketing campaigns (`server/email-marketing.ts`).
- Raw IMAP connection management (`server/mail-imap.ts`).

## Boundaries

| Allowed | Prohibited |
|---|---|
| Read/write `MailAccountModel`, `MailCacheModel` | Calling nodemailer directly |
| Import from `./types`, `./domain`, `./repository`, `./mapper` | Import from email domain internals |
| SMTP credential storage | Executing IMAP sessions |

## Layer Responsibilities

```
types.ts       — Shared interfaces. No logic.
domain.ts      — Pure functions: account defaults, access rules.
repository.ts  — DB queries: MailAccountModel, MailCacheModel.
service.ts     — Orchestration: domain + repository + mapper.
controller.ts  — HTTP boundary: req/res → service → res.json()
mapper.ts      — Response shaping.
validation.ts  — Zod schema stubs.
routes.ts      — Route registration.
index.ts       — Public barrel export.
```

## Dependencies

| Dependency | Reason |
|---|---|
| `server/models.ts` (MailAccountModel, MailCacheModel) | Account and cache storage |

## Public API

```typescript
import { registerMailDomainRoutes } from "../domains/mail";
```

## Future Planned Migrations

| Migration | Target |
|---|---|
| Migration 010 | Wire Zod validation schemas |
| Migration 012 | Fully document and verify HTTP route surface |

## Tech Debt Tracked

- **TECH-006** — No unit tests for domain layer
- **TECH-007** — Route surface not yet fully documented in this README
