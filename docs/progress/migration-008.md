# Migration 008 — Mail Domain Migration

**Status:** Complete  
**Date:** 2026-07-10  
**Type:** Domain extraction — 1 existing file modified (import only)  
**Risk:** Minimal — legacy file preserved, rollback is one line

---

## Objective

Extract the Mail module from three legacy files into a fully-layered domain
under `server/domains/mail/` following the enterprise architecture:
routes → controller → service → domain → repository → mapper.

The mail subsystem covers two distinct concerns:
1. **Corporate IMAP/SMTP mail** — employee inbox management (`server/routes-mail.ts`, `server/mail-imap.ts`)
2. **Transactional email** — system-triggered notification emails (`server/email.ts`)

**Migration 008 covers concern #1 only.** Transactional email (`server/email.ts`) is
excluded from this migration — it is referenced by many other modules and requires
its own dedicated migration.

---

## Files Created (9)

| File | Layer | Responsibility |
|---|---|---|
| `server/domains/mail/types.ts` | Contracts | All entity shapes, input/output types, enums |
| `server/domains/mail/domain.ts` | Business rules | Access control, defaults, update resolution |
| `server/domains/mail/repository.ts` | Data access | All Mongoose operations — 10 queries |
| `server/domains/mail/mapper.ts` | Translation | Password stripping, id mapping, response shaping |
| `server/domains/mail/service.ts` | Orchestration | 11 use cases — typed ServiceResult union |
| `server/domains/mail/controller.ts` | HTTP | req → service → res, error → status code |
| `server/domains/mail/validation.ts` | Placeholder | Stub — full Zod validation deferred to Migration 009+ |
| `server/domains/mail/routes.ts` | Routing | Express mount, auth guards, seedDefaultAccounts on startup |
| `server/domains/mail/index.ts` | Barrel | Public API — exports `registerMailRoutes` |

## Files Modified (1)

| File | Change |
|---|---|
| `server/routes.ts` | Line 18: `import { registerMailRoutes } from "./routes-mail"` → `"./domains/mail"` |

---

## Technical Audit

### SMTP

| Aspect | Finding | Severity |
|---|---|---|
| Transport creation | New `nodemailer.createTransport()` per request — no connection pooling | MEDIUM |
| TLS verification | `tls: { rejectUnauthorized: false }` on all SMTP connections | HIGH |
| Error handling | `sendMail` throws on failure — controller catches and returns 500. Calling code may silently continue on false return value | MEDIUM |
| Queue/retry | No queue. No retry. Send failures are permanent and unlogged in most call sites | HIGH |
| Authentication | Username + password only. No OAuth2/XOAUTH2 | MEDIUM |
| Port logic | `secure: port === 465` — correct. STARTTLS on 587 requires `secure: false` | OK |
| Attachments | Base64-decoded from `content` field. No size limit, no content-type allowlist | MEDIUM |
| HTML rendering | `buildBrandedHtml()` inlines all CSS — email-client safe | OK |
| SPF | No configuration enforced. Delivery depends on cPanel DNS setup | INFO |
| DKIM | No DKIM signing in code. Must be configured at cPanel/DNS level | INFO |
| DMARC | No DMARC enforcement. Depends on external DNS policy | INFO |
| cPanel compatibility | Default host `server222.web-hosting.com`, IMAP 993, SMTP 465 — correct cPanel standard | OK |

### IMAP

| Aspect | Finding | Severity |
|---|---|---|
| TLS verification | `tls: { rejectUnauthorized: false }` on all IMAP connections | HIGH |
| Connection pooling | New `ImapFlow` client per request — no connection reuse | MEDIUM |
| Timeout strategy | Double timeout: `connectionTimeout: 8000`, `socketTimeout: 8000` + outer `Promise.race` 9000ms | OK |
| Fetch strategy | `source: true` fetches full RFC 822 source per message — memory intensive on large mailboxes | MEDIUM |
| Message limit | 40 messages per inbox fetch (hardcoded in routes, passed to fetchInbox) | INFO |
| Range strategy | `start:total` — fetches N most-recent by sequence number. Not UID-based range | INFO |
| Cache-aside | All fetched messages upserted to `MailCacheModel`. Fallback to cache on IMAP failure | OK |
| Attachment extraction | `simpleParser` parses full source but attachments are not extracted/returned | INFO |
| Threading | No thread grouping. Messages returned flat | INFO |
| Search | No server-side IMAP SEARCH — filtering must be done client-side | INFO |
| Push sync | No IMAP IDLE / push notifications for new mail | INFO |
| Logout | `client.logout()` called in finally blocks. Error on logout is silently swallowed | OK |
| Folder fallback | `fetchFolders` returns hardcoded `["INBOX","Sent","Drafts","Trash","Junk"]` on failure | OK |

### Authentication & Access Control

| Aspect | Finding | Severity |
|---|---|---|
| Session auth | `req.isAuthenticated()` — Passport.js session-based. Correct | OK |
| Role check — client | `role === "client"` blocks all mail endpoints | OK |
| Role check — admin | `role === "admin"` enforces admin-only create/update/delete/test | OK |
| `canAccessAccount()` | Function duplicated: defined in `routes-mail.ts` AND re-implemented inline in `GET /api/mail/accounts` list filter | BUG |
| Account isolation | Non-admin employees can only see accounts explicitly assigned to them or shared with their role | OK |
| CEO/CTO/Manager visibility | `["ceo","cto","manager"]` all see shared inboxes — hardcoded role list | INFO |

### Password Handling

| Aspect | Finding | Severity |
|---|---|---|
| Storage | Passwords stored **plaintext** in MongoDB. No encryption at rest | CRITICAL |
| Response stripping | `toJSON` transform on `MailAccountModel` strips password. However `.lean()` bypasses toJSON — routes manually strip via destructuring `{ password, ...rest }` | OK (manual) |
| Seed accounts | `seedDefaultAccounts()` hardcodes 4 account passwords in source code | CRITICAL |
| Password in update | `PUT /api/mail/accounts/:id` accepts `password` field and stores plaintext | HIGH |

### Email Sending (Corporate SMTP — `sendMail`)

| Aspect | Finding | Severity |
|---|---|---|
| Branded HTML | `buildBrandedHtml()` wraps body in RTL Arabic signature template | OK |
| CC support | `cc` field forwarded to nodemailer | OK |
| Attachments | Base64 content decoded to Buffer — no virus scanning, no size limit | MEDIUM |
| From header | `"DisplayName" <emailAddress>` — correct format | OK |
| Text fallback | `text: opts.body` — plain text same as HTML body text. HTML-stripped text would be better | LOW |

### Cache Strategy

| Aspect | Finding | Severity |
|---|---|---|
| Write strategy | Cache-aside: IMAP fetch → upsert each message to `MailCacheModel` | OK |
| Read fallback | On IMAP failure, stale cache served with no staleness indicator | INFO |
| Cache growth | HTML bodies stored in cache. No TTL, no size limit, no eviction policy | MEDIUM |
| Seen flag sync | `markSeen` updates cache immediately + async IMAP. Cache is authoritative for seen state | OK |
| Delete sync | `deleteMessage` removes from cache immediately then sends IMAP `\Deleted` + EXPUNGE | OK |
| Index | `{ accountId, folder, uid }` compound unique index — correct | OK |

### Seed Accounts

| Aspect | Finding | Severity |
|---|---|---|
| Hardcoded passwords | 4 default account passwords (`ASDqwe@12345678`) in source code | CRITICAL |
| Auto-assignment | Matches users by regex patterns on `username`, `email`, `fullName` — fragile | MEDIUM |
| Domain cleanup | Deletes accounts from old `qiroxstudio.online` domain — migration artifact | INFO |
| Idempotency | `$setOnInsert` + `$set` for password ensures re-runs don't overwrite custom data | OK |
| JobTitle sync | Updates `User.jobTitle` and `User.workEmail` for known users | INFO |

### Deliverability (SPF / DKIM / DMARC)

| Aspect | Finding |
|---|---|
| SPF | Must be configured at DNS level for `qirox.online`. Not enforced in code. |
| DKIM | Must be configured at cPanel level. No signing in application code. |
| DMARC | Must be configured at DNS level. No enforcement in code. |
| Recommendation | Verify cPanel DNS records include SPF and DKIM selectors for all sending domains. |

---

## Business Rules Extracted

All rules live exclusively in `server/domains/mail/domain.ts`:

| # | Rule | Function |
|---|---|---|
| BR-01 | Access control: admin always allowed; single-assignee match; multi-assignee match; shared-with role match; CEO/CTO/manager see all shared | `canAccessAccount()` |
| BR-02 | Client role blocked from all mail endpoints | `hasMailAccess()` |
| BR-03 | Create account defaults: `displayName→""`, `jobTitle→""`, `imapHost→server222.web-hosting.com`, `imapPort→993`, `smtpHost→server222.web-hosting.com`, `smtpPort→465`, `isShared→false`, `sharedWith→[]`, `assignedUserIds→[]` | `resolveCreateAccountInput()` |
| BR-04 | Update: selective field mutation — only defined fields updated. When `assignedUserIds` set, `assignedUserId` cleared (migration strategy) | `buildUpdateObject()` |
| BR-05 | Test-connection: caller overrides merged onto stored account credentials | `resolveTestCreds()` |
| BR-06 | Test-connection without accountId: direct credentials with cPanel defaults | `buildDirectTestCreds()` |

---

## Repository Operations Extracted

All database operations live exclusively in `server/domains/mail/repository.ts`:

| # | Function | Mongoose Operation |
|---|---|---|
| Q-01 | `findAllAccounts()` | `MailAccountModel.find().lean()` |
| Q-02 | `findAccountById(id)` | `MailAccountModel.findById(id).lean()` |
| Q-03 | `createAccount(input)` | `MailAccountModel.create(input)` |
| Q-04 | `updateAccountById(id, update)` | `MailAccountModel.findByIdAndUpdate(id, {$set}, {new:true}).lean()` |
| Q-05 | `deleteAccountById(id)` | `MailAccountModel.findByIdAndDelete(id)` |
| Q-06 | `findUsersByIds(ids)` | `UserModel.find({_id:{$in:ids}}).select("fullName username role").lean()` |
| Q-07 | `deleteCacheByAccountId(accountId)` | `MailCacheModel.deleteMany({accountId})` |
| Q-08 | `deleteCachedMessage(accountId,folder,uid)` | `MailCacheModel.deleteOne({accountId,folder,uid})` |
| Q-09 | `findCachedMessages(accountId,folder,limit)` | `MailCacheModel.find({accountId,folder}).sort({date:-1}).limit(n).lean()` |
| Q-10 | `markCachedMessageSeen(accountId,folder,uid)` | `MailCacheModel.findOneAndUpdate({...},{$set:{seen:true}})` |

---

## Endpoints Migrated (11)

| Method | Path | Handler | Auth | Status |
|---|---|---|---|---|
| GET | `/api/mail/accounts` | `controller.listAccounts` | 401+403(client) | ✅ Migrated |
| GET | `/api/mail/accounts/all` | `controller.listAllAccounts` | 403(non-admin) | ✅ Migrated |
| POST | `/api/mail/accounts` | `controller.createAccount` | 403(non-admin) | ✅ Migrated |
| PUT | `/api/mail/accounts/:id` | `controller.updateAccount` | 403(non-admin) | ✅ Migrated |
| DELETE | `/api/mail/accounts/:id` | `controller.deleteAccount` | 403(non-admin) | ✅ Migrated |
| GET | `/api/mail/inbox/:accountId` | `controller.getInbox` | 401+403(client) | ✅ Migrated |
| GET | `/api/mail/folders/:accountId` | `controller.getFolders` | 401 | ✅ Migrated |
| POST | `/api/mail/seen/:accountId` | `controller.markSeen` | 401 | ✅ Migrated |
| DELETE | `/api/mail/message/:accountId/:uid` | `controller.deleteMessage` | 401 | ✅ Migrated |
| POST | `/api/mail/test-connection` | `controller.testConnection` | 403(non-admin) | ✅ Migrated |
| POST | `/api/mail/send` | `controller.sendMail` | 401+403(client) | ✅ Migrated |

---

## Use Cases (Service Layer)

| # | Use Case | Service Function | IMAP Delegation |
|---|---|---|---|
| UC-01 | List accessible accounts | `listAccounts(user)` | — |
| UC-02 | List all accounts with users (admin) | `listAllAccounts()` | — |
| UC-03 | Create account | `createAccount(body)` | — |
| UC-04 | Update account | `updateAccount(id, body)` | — |
| UC-05 | Delete account + cascade cache | `deleteAccount(id)` | — |
| UC-06 | Fetch inbox (IMAP + cache fallback) | `getInbox(accountId, folder, user)` | `fetchInbox()` |
| UC-07 | Fetch folders (IMAP + fallback) | `getFolders(accountId, user)` | `fetchFolders()` |
| UC-08 | Mark message seen (fire-and-forget) | `markMessageSeen(accountId,folder,uid,user)` | `markSeen()` |
| UC-09 | Delete message | `deleteMailMessage(accountId,folder,uid,user)` | `deleteMessage()` |
| UC-10 | Test IMAP+SMTP connection | `testConnection(body)` | `testMailConnection()` |
| UC-11 | Send branded email | `sendAccountMail(input, user)` | `sendMail()` |

---

## Risks Found

| # | Risk | Severity | Status |
|---|---|---|---|
| R-01 | Plaintext passwords in MongoDB (`MailAccountModel.password`) | CRITICAL | Documented — deferred to dedicated security migration |
| R-02 | Hardcoded passwords in `seedDefaultAccounts()` source code | CRITICAL | Documented — deferred; changing passwords would break existing accounts |
| R-03 | `tls: { rejectUnauthorized: false }` on all IMAP/SMTP — MitM vulnerability | HIGH | Documented — deferred; enabling would require valid certs on cPanel server |
| R-04 | No SMTP queue or retry — send failures are permanently lost | HIGH | Documented — deferred to queue migration |
| R-05 | No input validation on ports, email addresses, attachment types | MEDIUM | Documented — deferred to Migration 009 (validation) |
| R-06 | No connection pooling — new ImapFlow per request | MEDIUM | Documented — performance risk under load |
| R-07 | No cache eviction policy — MailCacheModel grows unbounded | MEDIUM | Documented — operational risk |
| R-08 | `canAccessAccount()` duplicated — inline filter in GET /accounts vs function | BUG | Resolved in domain layer — single `domain.canAccessAccount()` function |
| R-09 | No attachment size limit on send | MEDIUM | Documented — memory exhaustion risk |
| R-10 | `source: true` fetches full RFC 822 per message — memory pressure on large mailboxes | MEDIUM | Documented — deferred |

---

## Technical Debt Found

| # | Debt | Location |
|---|---|---|
| TD-01 | `markSeen` IMAP fires and forgets — no confirmation that the server-side flag was set | `mail-imap.ts: markSeen()` |
| TD-02 | Stale cache served without staleness indicator when IMAP fails | `service.ts: getInbox()` |
| TD-03 | `buildBrandedHtml()` uses `<style>` block — some email clients strip head styles | `mail-imap.ts: buildBrandedHtml()` |
| TD-04 | `GET /api/mail/accounts/all` makes N+1 queries (one UserModel.find per account) | `service.ts: listAllAccounts()` |
| TD-05 | `seedDefaultAccounts()` runs on every server restart — slow cold start if MongoDB is slow | `routes.ts: registerMailRoutes()` |
| TD-06 | Auto-assignment regex matching is fragile — name changes break re-assignment | `mail-imap.ts: seedDefaultAccounts()` |
| TD-07 | `assignedUserId` (legacy) and `assignedUserIds` (new) coexist — dual-field confusion | `repository.ts: updateAccountById()` |
| TD-08 | No pagination on inbox — always fetches latest 40. No offset/page support | `mail-imap.ts: fetchInbox()` |
| TD-09 | HTML bodies stored in MailCacheModel — significant storage overhead | `mail-imap.ts: fetchInbox()` |
| TD-10 | No OAuth2 support — password-only IMAP/SMTP | Architecture-level |

---

## Infrastructure Delegation

The IMAP/SMTP infrastructure layer (`server/mail-imap.ts`) is **not part of this
migration**. It is treated as an external infrastructure dependency — the service
layer delegates to it the same way it was called from routes before.

Functions delegated to `server/mail-imap.ts`:
- `fetchInbox(accountId, folder, maxMessages)`
- `fetchFolders(accountId)`
- `markSeen(accountId, folder, uid)` — also updates cache internally
- `deleteMessage(accountId, folder, uid)` — also removes from cache internally
- `sendMail(opts)`
- `testMailConnection(creds)`
- `seedDefaultAccounts()` — called on startup from domain routes

This preserves 100% behavioral identity including the IMAP race/timeout strategy,
cache-aside write pattern, and fire-and-forget markSeen behaviour.

---

## Compatibility Report

| Check | Result |
|---|---|
| API surface unchanged | ✅ All 11 endpoints preserved with identical paths, methods, auth guards |
| Response shapes identical | ✅ Password stripping, id addition, nested user objects all preserved |
| seedDefaultAccounts on startup | ✅ Called from new domain routes.ts, same async fire-and-forget |
| IMAP timeout/race strategy | ✅ Delegated unchanged to mail-imap.ts |
| Cache fallback on IMAP failure | ✅ Preserved in service.getInbox() |
| Fire-and-forget markSeen | ✅ Preserved in service.markMessageSeen() |
| Admin cascade delete (account + cache) | ✅ Preserved in service.deleteAccount() |
| canAccessAccount bug (duplication) | Fixed — single function in domain.ts now used everywhere |
| Legacy files on disk | ✅ `server/routes-mail.ts` and `server/mail-imap.ts` untouched |

---

## Rollback Report

**Required change:** One line in `server/routes.ts`.

```diff
- import { registerMailRoutes } from "./domains/mail";
+ import { registerMailRoutes } from "./routes-mail";
```

- No database changes required
- No client changes required
- No environment variable changes required
- `server/routes-mail.ts` is untouched and ready to serve immediately
- `server/mail-imap.ts` is untouched
- `server/domains/mail/` directory can be deleted at any time after rollback

---

## Verification

### Application health

| Check | Result |
|---|---|
| Application starts successfully | ✅ Port 5000, all services connected |
| Mail domain seeding executes | ✅ `[Mail] Auto-assigned y.business@qirox.online → يوسف...` |
| Mail domain seeding completes | ✅ `[Mail] Default accounts seeded` |
| No runtime errors | ✅ Clean startup log |
| Legacy implementation preserved | ✅ `server/routes-mail.ts` untouched |
| No regressions detected | ✅ All other routes/cron/QMeet unaffected |

### Behavioral identity checks

| Check | Result |
|---|---|
| `GET /api/mail/accounts` — role filter, no password | ✅ Identical |
| `GET /api/mail/accounts/all` — admin, with users, no password | ✅ Identical |
| `POST /api/mail/accounts` — defaults applied, no password in response | ✅ Identical |
| `PUT /api/mail/accounts/:id` — selective update, no password in response | ✅ Identical |
| `DELETE /api/mail/accounts/:id` — cascades to cache | ✅ Identical |
| `GET /api/mail/inbox/:accountId` — IMAP + cache fallback | ✅ Identical |
| `GET /api/mail/folders/:accountId` — IMAP + hardcoded fallback | ✅ Identical |
| `POST /api/mail/seen/:accountId` — fire-and-forget, immediate 200 | ✅ Identical |
| `DELETE /api/mail/message/:accountId/:uid` — cache + IMAP | ✅ Identical |
| `POST /api/mail/test-connection` — IMAP + SMTP dual test | ✅ Identical |
| `POST /api/mail/send` — branded HTML, access check | ✅ Identical |

---

## Domain Dependency Diagram

```
server/routes.ts
    └── server/domains/mail/index.ts          (barrel)
            └── routes.ts                     (Express routing + auth guards)
                    │── seedDefaultAccounts() → ../../mail-imap (infrastructure)
                    └── controller.ts          (req → service → res)
                            └── service.ts     (orchestration)
                                ├── domain.ts            (business rules — pure)
                                ├── repository.ts        (Mongoose queries)
                                ├── mapper.ts            (response shaping)
                                └── ../../mail-imap.ts   (IMAP/SMTP infrastructure)

server/models/mail.ts                          (unchanged — MailAccountModel, MailCacheModel)
server/routes-mail.ts                          (preserved — rollback target)
server/mail-imap.ts                            (preserved — infrastructure, not migrated)
server/email.ts                                (excluded — transactional email, future migration)
```

---

## Infrastructure Built So Far

| Migration | Layer | Status |
|---|---|---|
| 002 | Shared Utilities (`server/utils.ts`) | ✅ Complete |
| 003 | Error System (`server/errors/`) | ✅ Complete |
| 004 | Logging Foundation (`server/logger/`) | ✅ Complete |
| 005 | Configuration Foundation (`server/config/`) | ✅ Complete |
| 006 | Validation Foundation (`server/validation/`) | ✅ Complete |
| 007 | CRM Domain (`server/domains/crm/`) | ✅ Complete |
| 008 | Mail Domain (`server/domains/mail/`) | ✅ Complete |
