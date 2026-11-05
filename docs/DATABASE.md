# DATABASE.md — QIROX Database Audit

> **Mode:** Audit only. No fixes. Document every issue.
> **Date:** 2026-07-08

---

## 1. Database Overview

| Database | Driver | Status | Use |
|---|---|---|---|
| MongoDB Atlas | Mongoose | Active (primary) | All application data |
| PostgreSQL | Drizzle ORM | Config present, usage unclear | Unknown / schema.ts |
| connect-mongo | Session store | Active | Express sessions |

---

## 2. MongoDB Models (from `server/models.ts` — 2,339 lines)

All models are in a single file. The following models were identified:

| Model | Collection (estimated) | Notes |
|---|---|---|
| UserModel | users | Core auth model |
| SessionModel | sessions (via connect-mongo) | Managed automatically |
| SystemModel / QiroxSystemSettingsModel | system_settings | Pixel IDs, global config |
| SubscriptionModel | subscriptions | Client subscriptions |
| TemplateModel | templates | System/website templates |
| InvoiceModel | invoices | Client invoices |
| ProjectModel | projects | Internal project mgmt |
| TaskModel | tasks | Kanban tasks |
| AttendanceModel | attendance | Employee check-in/out |
| SalaryModel | salaries | Payroll records |
| LeadModel | leads | CRM leads |
| ContactModel | contacts | CRM contacts |
| ContractModel | contracts | Client contracts |
| SupportTicketModel | support_tickets | Client support |
| InstallmentModel | installments | Payment plans |
| WalletModel / TransactionModel | wallets / transactions | Internal wallet |
| LoyaltyModel | loyalty | Points & rewards |
| ReferralModel | referrals | Referral program |
| ShipmentModel | shipments | Order tracking |
| OrderModel | orders | E-commerce orders |
| ProductModel | products | Store products |
| DiscountCodeModel | discount_codes | Promo codes |
| CronJobModel | cron_jobs | Admin cron management |
| ClientApiKeyModel | client_api_keys | External API keys |
| NotificationModel | notifications | Push/in-app alerts |
| GroupModel / MessageModel | groups / messages | Team messaging |
| NewsModel | news | Public blog/news |
| PartnerModel | partners | Partners page |
| JobModel | jobs | Job listings |
| EmailCampaignModel | email_campaigns | Marketing campaigns |
| PixelEventModel | pixel_events | Analytics tracking |
| InvestorModel | investors | Investor portal |
| SupplierModel | suppliers | Supplier mgmt |
| ChangelogModel | changelogs | Release notes |
| SandboxProjectModel | sandbox_projects | IDE projects |
| DeploymentModel | deployments | DeploymentCloud |
| AISessionModel | ai_sessions | AI conversation history |
| QMeetRoomModel | qmeet_rooms | Video conference rooms |
| WebAuthnCredentialModel | webauthn_credentials | Passkey credentials |

---

## 3. Database Issues (Audit)

### DB-001 — All Models in Single File
- **File:** `server/models.ts`
- **Problem:** 40+ Mongoose models, 2,339 lines, all in one file.
- **Risk:** High conflict risk on concurrent edits. Hard to audit index coverage. Slow TypeScript compilation for model changes.
- **Recommendation:** Split into `models/` directory with one file per domain (e.g., `models/user.model.ts`).
- **Priority:** HIGH

### DB-002 — No Startup Index Validation
- **File:** `server/models.ts` / `server/index.ts`
- **Problem:** No programmatic check that required indexes exist on startup.
- **Risk:** Missing indexes on high-cardinality fields (e.g., `userId`, `createdAt`, `status`) cause full collection scans. With 632+ endpoints and Arabic-market scale, this will degrade to seconds per query under load.
- **Recommendation:** Audit each model for missing indexes. At minimum, index: `userId`, `status`, `createdAt` on all time-series collections. Add `{ background: true }` to avoid blocking.
- **Priority:** HIGH

### DB-003 — Mongoose `any` Types in AI Tool Executor
- **File:** `server/ai.ts`
- **Problem:** AI tool arguments are typed as `any` before being used in Mongoose queries. No runtime schema validation.
- **Risk:** NoSQL injection (see SEC-HIGH-001). Also, malformed arguments cause cryptic runtime errors rather than typed validation errors.
- **Recommendation:** Define Zod schemas for every AI tool's argument shape. Validate before any DB operation.
- **Priority:** HIGH

### DB-004 — Dual Database Ambiguity (MongoDB + PostgreSQL)
- **File:** `drizzle.config.ts`, `shared/schema.ts`
- **Problem:** Drizzle (PostgreSQL) is configured alongside Mongoose (MongoDB). It is unclear which features use which database.
- **Risk:** Developers may write features against the wrong database. PostgreSQL schema may be out of sync with production. `npm run db:push` fails without `DATABASE_URL`.
- **Recommendation:** Document explicitly which features use MongoDB and which (if any) use PostgreSQL. If PostgreSQL is unused, remove Drizzle to eliminate confusion. If used, enforce `DATABASE_URL` in startup validation.
- **Priority:** MEDIUM

### DB-005 — No Soft-Delete Pattern
- **File:** `server/models.ts`
- **Problem:** No consistent `deletedAt` or `isDeleted` field pattern observed across models.
- **Risk:** Hard deletes remove records permanently. For financial records (invoices, transactions, salaries), this creates an audit trail gap and may violate accounting requirements.
- **Recommendation:** Implement soft-delete (`deletedAt: Date`, `isDeleted: Boolean`) on all financial and compliance-related models.
- **Priority:** MEDIUM

### DB-006 — No Pagination Defaults on List Queries
- **File:** `server/routes.ts`
- **Problem:** Many list endpoints may return unbounded results without default pagination.
- **Risk:** A single request for all invoices or all transactions on a large account could return millions of records, causing memory exhaustion and timeout.
- **Recommendation:** Enforce default pagination (`limit: 50, skip: 0`) on all list-type queries. Document max page size.
- **Priority:** MEDIUM

### DB-007 — No Connection Pool Configuration
- **File:** `server/db.ts` or `server/index.ts`
- **Problem:** Mongoose connection is opened with default pool settings. No explicit `maxPoolSize`, `minPoolSize`, or `serverSelectionTimeoutMS` configured.
- **Risk:** Under load, connection pool exhaustion causes requests to queue indefinitely. Default pool size (5) is too low for 632+ endpoints.
- **Recommendation:** Configure `maxPoolSize: 20` (or higher based on Atlas tier), `serverSelectionTimeoutMS: 5000`, `socketTimeoutMS: 45000`.
- **Priority:** MEDIUM

### DB-008 — Uploads Stored on Local Disk (Not DB or Object Storage)
- **File:** `uploads/` directory
- **Problem:** User uploads saved to local filesystem, not tracked in a DB collection with metadata.
- **Risk:** No way to query "all files uploaded by user X". No cleanup mechanism for orphaned files. Files lost on redeploy.
- **Recommendation:** Create an `UploadModel` that stores file metadata (originalName, hash, mimeType, size, uploadedBy, uploadedAt). Use object storage for the files themselves.
- **Priority:** HIGH (see ARCH-006)

### DB-009 — Session Store Uses Same Atlas Cluster
- **File:** `server/auth.ts` (connect-mongo configuration)
- **Problem:** Express sessions are stored in the same MongoDB Atlas cluster as application data.
- **Risk:** If the Atlas cluster is slow or unavailable, all user sessions become invalid simultaneously, causing a full platform outage even if all other services are healthy.
- **Recommendation:** Consider a dedicated Redis session store for higher availability. At minimum, configure connect-mongo with `touchAfter: 24 * 3600` (rolling session updates once per day) to reduce write load.
- **Priority:** LOW

---

## 4. PostgreSQL Schema (Drizzle — `shared/schema.ts`)

A PostgreSQL schema exists in `shared/schema.ts`. Based on the Drizzle config, this is meant to be pushed to a PostgreSQL database via `npm run db:push`.

**Status:** Unknown whether this schema is deployed or in use. `DATABASE_URL` env var is not currently set on Replit.

**Risk:** If any feature depends on PostgreSQL tables that don't exist, it will fail silently or with a cryptic error at runtime.

**Recommendation:** Audit `shared/schema.ts` to identify which features depend on it. Either provision PostgreSQL and run `db:push`, or document that PostgreSQL is reserved for future use.

---

## 5. Recommended Index Additions (Not Yet Applied)

> Document only — do not apply.

| Collection | Field(s) | Reason |
|---|---|---|
| users | `email` (unique) | Login lookup |
| subscriptions | `userId`, `status` | Dashboard queries |
| invoices | `userId`, `createdAt` | Finance reports |
| tasks | `projectId`, `assignedTo`, `status` | Kanban board |
| attendance | `employeeId`, `date` | Attendance reports |
| notifications | `userId`, `isRead`, `createdAt` | Inbox queries |
| ai_sessions | `userId`, `createdAt` | AI history |
| client_api_keys | `key` (unique) | API auth lookup |
| messages | `groupId`, `createdAt` | Chat pagination |
