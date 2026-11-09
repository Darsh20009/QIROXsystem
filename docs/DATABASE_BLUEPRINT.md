# DATABASE_BLUEPRINT.md — QIROX Complete Database Blueprint

> **Mode:** Blueprint only. No code modified.
> **Date:** 2026-07-08

---

## 1. Database Overview

| Database | Driver | Purpose | Status |
|---|---|---|---|
| MongoDB Atlas (primary) | Mongoose | All application data | Active |
| MongoDB (sessions) | connect-mongo | Express session storage | Active (same cluster) |
| MongoDB (QMeet) | Mongoose (qmeet-db.ts) | Video meeting data | Active (separate connection or DB) |
| PostgreSQL | Drizzle ORM | Unknown / schema.ts | Config only — DATABASE_URL not set |

---

## 2. Complete Collection Inventory

### 2.1 Core User & Auth

```
users
├── _id: ObjectId
├── username: String (unique)
├── email: String
├── password: String (bcrypt hash)
├── role: String (enum: admin|manager|accountant|sales|developer|designer|support|merchant|client|supplier|investor)
├── fullName: String
├── phone: String
├── isActive: Boolean
├── githubDeployToken: String          ← GitHub OAuth token (encrypted?)
├── webAuthnCredentials: [embedded]
├── twoFactorSecret: String
├── profilePhoto: String (local path)
├── createdAt: Date
└── updatedAt: Date

sessions (managed by connect-mongo)
├── _id: String (session ID)
├── session: Object (passport user)
├── expires: Date
└── lastModified: Date

otps
├── _id: ObjectId
├── target: String (phone/email)
├── code: String
├── type: String
├── expiresAt: Date                    ← Index needed
└── createdAt: Date
```

### 2.2 Orders & Commerce

```
orders
├── _id: ObjectId
├── clientId: ObjectId → users
├── serviceId: ObjectId → services
├── status: String (enum)
├── paymentMethod: String (bank_transfer|paypal|wallet|mixed)
├── paymentProofUrl: String (local path)
├── totalAmount: Number
├── walletAmountUsed: Number
├── depositAmount: Number
├── isDepositPaid: Boolean
├── createdAt: Date
└── updatedAt: Date

services
├── _id: ObjectId
├── name: String
├── nameAr: String
├── description: String
├── price: Number
├── category: String
└── isActive: Boolean

order_specs
├── _id: ObjectId
├── orderId: ObjectId → orders
└── specs: Mixed (form data)

order_expenses
├── _id: ObjectId
├── orderId: ObjectId → orders
├── amount: Number
├── description: String
└── createdAt: Date

carts
├── _id: ObjectId
├── userId: ObjectId → users
├── items: [{ productId, quantity, price }]
└── updatedAt: Date

qirox_products
├── _id: ObjectId
├── name: String
├── nameAr: String
├── price: Number
├── category: String
├── images: [String] (local paths)
├── stock: Number
└── isActive: Boolean
```

### 2.3 Finance

```
invoices
├── _id: ObjectId
├── orderId: ObjectId → orders
├── clientId: ObjectId → users
├── amount: Number
├── status: String (draft|sent|paid|cancelled)
├── pdfPath: String (local)
├── dueDate: Date
├── paidAt: Date
└── createdAt: Date

receipt_vouchers
├── _id: ObjectId
├── clientId: ObjectId → users
├── amount: Number
├── type: String
└── createdAt: Date

wallets (implied from wallet routes)
├── _id: ObjectId
├── userId: ObjectId → users (unique)
├── balance: Number
└── updatedAt: Date

wallet_transactions (implied)
├── _id: ObjectId
├── walletId: ObjectId → wallets
├── amount: Number
├── type: String (credit|debit)
├── note: String
└── createdAt: Date

installments
├── _id: ObjectId
├── clientId: ObjectId → users
├── orderId: ObjectId → orders
├── payments: [{ amount, dueDate, paidAt, status, penalty }]
├── totalAmount: Number
└── createdAt: Date

payroll_records
├── _id: ObjectId
├── employeeId: ObjectId → users
├── month: String
├── baseSalary: Number
├── bonuses: Number
├── deductions: Number
├── netSalary: Number
└── createdAt: Date

employee_payments
├── _id: ObjectId
├── employeeId: ObjectId → users
├── amount: Number
├── type: String
└── createdAt: Date
```

### 2.4 Projects & Tasks

```
projects
├── _id: ObjectId
├── orderId: ObjectId → orders (optional)
├── clientId: ObjectId → users
├── title: String
├── status: String
├── budget: Number
├── deadline: Date
├── members: [ObjectId → users]
├── createdAt: Date
└── updatedAt: Date

tasks
├── _id: ObjectId
├── projectId: ObjectId → projects
├── title: String
├── status: String (todo|inprogress|review|done)
├── assignedTo: ObjectId → users
├── priority: String
├── dueDate: Date
└── createdAt: Date

project_members
├── _id: ObjectId
├── projectId: ObjectId → projects
├── userId: ObjectId → users
└── role: String

project_vaults
├── _id: ObjectId
├── projectId: ObjectId → projects
├── key: String
└── value: String (encrypted?)

messages (project chat)
├── _id: ObjectId
├── projectId: ObjectId → projects
├── senderId: ObjectId → users
├── content: String
└── createdAt: Date
```

### 2.5 HR & Attendance

```
attendances
├── _id: ObjectId
├── employeeId: ObjectId → users
├── date: Date
├── checkIn: Date
├── checkOut: Date
├── ipAddress: String
├── gpsCoords: { lat, lng }
└── status: String

employee_profiles
├── _id: ObjectId
├── userId: ObjectId → users (unique)
├── position: String
├── department: String
├── hireDate: Date
├── salary: Number
└── skills: [String]

checklist_items
├── _id: ObjectId
├── userId: ObjectId → users
├── title: String
├── isCompleted: Boolean
└── createdAt: Date
```

### 2.6 CRM & Communication

```
leads_data (implied from routes)
├── _id: ObjectId
├── name: String
├── phone: String
├── email: String
├── status: String
├── assignedTo: ObjectId → users
└── createdAt: Date

inbox_messages
├── _id: ObjectId
├── fromId: ObjectId → users
├── toId: ObjectId → users
├── content: String
├── isRead: Boolean
└── createdAt: Date

cs_sessions (customer support chat)
├── _id: ObjectId
├── clientId: ObjectId → users
├── agentId: ObjectId → users
├── status: String
└── messages: [embedded]

support_tickets
├── _id: ObjectId
├── clientId: ObjectId → users
├── subject: String
├── status: String
├── priority: String
├── messages: [embedded]
└── createdAt: Date

groups
├── _id: ObjectId
├── name: String
├── members: [ObjectId → users]
└── createdAt: Date

group_messages (implied)
├── _id: ObjectId
├── groupId: ObjectId → groups
├── senderId: ObjectId → users
├── content: String
└── createdAt: Date
```

### 2.7 Content & Marketing

```
news
├── _id: ObjectId
├── title: String
├── titleAr: String
├── content: String
├── slug: String (for SEO)
├── publishedAt: Date
└── isPublished: Boolean

partners
├── _id: ObjectId
├── name: String
├── logo: String (local path)
├── website: String
└── isActive: Boolean

jobs
├── _id: ObjectId
├── title: String
├── titleAr: String
├── description: String
├── type: String
└── isActive: Boolean

applications
├── _id: ObjectId
├── jobId: ObjectId → jobs
├── name: String
├── email: String
├── resumeUrl: String
└── createdAt: Date

email_campaigns (implied)
├── _id: ObjectId
├── subject: String
├── htmlBody: String
├── sentTo: [String] (email list)
└── sentAt: Date

notifications
├── _id: ObjectId
├── userId: ObjectId → users
├── title: String
├── body: String
├── type: String
├── link: String
├── isRead: Boolean
└── createdAt: Date

push_subscriptions
├── _id: ObjectId
├── userId: ObjectId → users
├── endpoint: String
├── keys: { p256dh, auth }
└── createdAt: Date
```

### 2.8 System & Config

```
qirox_system_settings
├── _id: ObjectId (singleton)
├── metaPixelId: String
├── tiktokPixelId: String
├── snapPixelId: String
├── ga4MeasurementId: String
├── gtmContainerId: String
└── [other platform settings]

bank_settings
├── _id: ObjectId
├── bankName: String
├── accountName: String
├── iban: String
└── isActive: Boolean

activity_logs
├── _id: ObjectId
├── userId: ObjectId → users
├── action: String
├── target: String
├── createdAt: Date
└── ipAddress: String

cron_jobs (implied from AdminCronJobs)
├── _id: ObjectId
├── name: String
├── schedule: String (cron expression)
├── isActive: Boolean
└── lastRunAt: Date
```

### 2.9 Sandbox & Dev Tools

```
sandbox_projects
├── _id: ObjectId
├── ownerId: ObjectId → users
├── name: String
├── template: String
├── runtime: String (node|static|python)
├── startCmd: String
├── installCmd: String
├── buildCmd: String              ← exec() injection risk
├── port: Number
├── status: String
└── createdAt: Date

sandbox_env_vars
├── _id: ObjectId
├── projectId: ObjectId → sandbox_projects
├── key: String
├── value: String (encrypted)
└── iv: String (encryption IV)

sandbox_files (implied)
├── _id: ObjectId
├── projectId: ObjectId → sandbox_projects
├── path: String
└── content: String

sandbox_deployments (implied)
├── _id: ObjectId
├── projectId: ObjectId → sandbox_projects
└── deployedAt: Date
```

### 2.10 QMeet (qmeet-db.ts — separate models)

```
qmeetings
├── _id: ObjectId
├── title: String
├── roomName: String (unique)
├── joinCode: String (6-char uppercase)
├── hostId: ObjectId → users
├── participantIds: [ObjectId]
├── status: String (scheduled|live|completed|cancelled)
├── scheduledAt: Date
├── duration: Number (minutes)
├── meetingLink: String
└── createdAt: Date

qfeedbacks
├── _id: ObjectId
├── meetingId: ObjectId → qmeetings
├── userId: ObjectId → users
├── rating: Number
└── comment: String

qreports
├── _id: ObjectId
├── meetingId: ObjectId → qmeetings
└── transcript: String (AI-generated)

qmeet_api_keys
├── _id: ObjectId
├── userId: ObjectId → users
└── key: String (qmeet_xxxxx)
```

---

## 3. Entity Relationship Diagram (Text Format)

```
users ─────────────────────────────────────────────────────────────
  │                                                                │
  ├── [1:many] orders                                             │
  │       └── [1:1] order_specs                                   │
  │       └── [1:many] order_expenses                             │
  │       └── [1:1] invoices                                      │
  │       └── [1:1] projects                                      │
  │                                                               │
  ├── [1:many] attendances                                        │
  ├── [1:1] employee_profiles                                     │
  ├── [1:many] payroll_records                                    │
  ├── [1:1] wallets                                               │
  │       └── [1:many] wallet_transactions                        │
  │                                                               │
  ├── [1:many] notifications                                      │
  ├── [1:many] push_subscriptions                                 │
  ├── [1:many] support_tickets                                    │
  ├── [1:many] inbox_messages (as sender)                         │
  ├── [1:many] inbox_messages (as receiver)                       │
  ├── [1:many] checklist_items                                    │
  ├── [1:many] leads_data (as assignee)                          │
  ├── [1:many] ai_sessions                                        │
  ├── [1:many] sandbox_projects                                   │
  ├── [1:1] qmeet_api_keys                                       │
  └── [many:many] groups (via members array)                     │
                                                                  │
projects                                                          │
  ├── [1:many] tasks                                              │
  ├── [1:many] project_members ──────────────────────── users    │
  ├── [1:many] messages                                           │
  └── [1:many] project_vaults                                     │

sector_templates ─── [1:many] pricing_plans                       │
                  └─ [1:many] feature_details                     │
```

---

## 4. Missing Indexes (Critical)

| Collection | Field(s) | Index Type | Reason |
|---|---|---|---|
| users | email | Unique | Login lookup, invitation check |
| users | username | Unique | Already exists — verify |
| orders | clientId + createdAt | Compound | Client order history |
| orders | status + createdAt | Compound | Admin order list filtering |
| invoices | clientId + status | Compound | Client invoice portal |
| tasks | projectId + status + assignedTo | Compound | Kanban board |
| attendances | employeeId + date | Compound | Attendance reports |
| notifications | userId + isRead + createdAt | Compound | Notification inbox |
| notifications | createdAt | TTL (30 days) | Auto-cleanup old notifications |
| inbox_messages | toId + isRead | Compound | Unread count |
| group_messages | groupId + createdAt | Compound | Chat pagination |
| ai_sessions | userId + createdAt | Compound | AI history pagination |
| otps | expiresAt | TTL | Auto-expire OTPs |
| sandbox_projects | ownerId + createdAt | Compound | My projects list |
| sandbox_env_vars | projectId | Single | Per-project env lookup |
| leads_data | assignedTo + status | Compound | CRM pipeline |
| activity_logs | userId + createdAt | Compound | Audit trail queries |
| activity_logs | createdAt | TTL (90 days) | Log rotation |

---

## 5. Query Optimization Plan

| Issue | Location | Problem | Solution |
|---|---|---|---|
| Unbounded list queries | Many admin routes | `Model.find()` with no limit | Add default `limit: 50, skip: page * 50` |
| No aggregation caching | AdminAnalytics, ProfitReport | Heavy `$group` on every request | Cache 15 minutes in Redis/memory |
| PDF regen on every request | Invoice, Quotation, Receipt | PDF generated fresh each call | Cache to disk or object storage |
| N+1 in project members | ProjectWorkspace | User lookup per member | Use `$lookup` aggregation or `.populate()` |
| AI session history | QiroxStudio | All sessions loaded | Paginate: latest 20 by default |
| Notification unread count | NotificationBell | Count query on every poll | Cache count in WS push updates |

---

## 6. Data Integrity Issues

| Issue | Risk | Recommendation |
|---|---|---|
| No soft delete on financial records | Invoices/payroll permanently deletable | Add `deletedAt` to Invoice, PayrollRecord, ReceiptVoucher |
| Wallet balance not atomic | Race condition → negative balance possible | Use MongoDB sessions (`session.withTransaction`) |
| No referential integrity | MongoDB has no FK constraints | Add application-level cascade logic or use embedded docs |
| OTP no expiry index | Expired OTPs remain in DB | Add TTL index on `expiresAt` |
| Notification accumulation | DB grows unbounded | Add TTL index (30-day auto-delete) |
| Activity log accumulation | DB grows unbounded | Add TTL index (90-day) or archive strategy |
| Uploads not tracked in DB | Orphaned files, no cleanup | Create UploadModel with metadata |

---

## 7. PostgreSQL Schema Status

`shared/schema.ts` defines a PostgreSQL schema managed by Drizzle ORM. `DATABASE_URL` is not currently set. Until the PostgreSQL schema's purpose is clarified and the database is provisioned, Drizzle should not be used in production.

**Action required:** Document which features (if any) depend on PostgreSQL tables. Either provision PostgreSQL + run `db:push`, or remove Drizzle from the project.
