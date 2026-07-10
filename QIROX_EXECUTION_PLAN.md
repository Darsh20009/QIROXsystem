# QIROX EXECUTION PLAN
## V5 — Engineering Roadmap

**Version:** V5  
**Date:** 2026-07-10  
**Classification:** Engineering Roadmap  
**Audience:** Engineering Team, CTO, Product

---

## GUIDING RULES

1. **No big bang rewrites.** Each phase ships independently and the system remains operational throughout.
2. **Backward compatible.** Every API change is additive. Existing clients see no breakage.
3. **Data integrity first.** No data migrations without verified rollback scripts.
4. **Security before features.** All P0 security issues resolved before any new feature ships.
5. **Arabic before English.** Every new UI is designed and reviewed in Arabic before English translation is added.

---

## PHASE MAP

```
Phase 0: DISCOVERY            ← YOU ARE HERE (complete)
Phase 1: SECURITY & FOUNDATION
Phase 2: CRM REDESIGN
Phase 3: EMPLOYEE WORKSPACE
Phase 4: CLIENT EXPERIENCE
Phase 5: EVENTS PLATFORM
Phase 6: QADMIN / WHATSAPP
Phase 7: KNOWLEDGE BASE
Phase 8: PRESENTATION
Phase 9: AI PLATFORM V2
Phase 10: ANALYTICS & AUTOMATION
Phase 11: APPLE WALLET / GOOGLE WALLET
Phase 12: MOBILE PWA
Phase 13: NATIVE APP (iOS/Android)
```

**Each phase requires explicit approval before the next begins.**

---

## PHASE 1: SECURITY & FOUNDATION

**Goal:** Eliminate all P0/P1 security risks and build the architectural foundation for V5.  
**Duration:** 2–3 weeks  
**Prerequisite:** Migration series (001–008) approved

### 1.1 Security Remediation (P0 — Block Everything Else)

**1.1.1 Mail Account Password Encryption**

Current state: `MailAccountModel.password` stored plaintext in MongoDB.

Solution:
- Add encryption at rest using AES-256-GCM
- Use `SANDBOX_ENC_KEY` pattern already established in codebase
- Encrypt on write, decrypt on read in repository layer
- One-time migration: encrypt all existing passwords
- Rollback: decrypt migration (reversible)

Migration script required:
```
server/migrations/encrypt-mail-passwords.ts
  - Load all MailAccount documents
  - Encrypt each password field
  - Save back to MongoDB
  - Verify by test-decryption
  - Log result: { encrypted: N, failed: 0 }
```

**1.1.2 Remove Hardcoded Credentials from Source Code**

Current state: `seedDefaultAccounts()` in `server/mail-imap.ts` contains 4 accounts with literal passwords.

Solution:
- Move account seeding to environment variables:
  ```
  MAIL_SEED_ACCOUNT_1=m.adbani@qirox.online:password:host:imapPort:smtpPort
  MAIL_SEED_ACCOUNT_2=y.business@qirox.online:...
  ```
- Parse at runtime, never commit
- If env vars absent: skip seeding (no hardcoded fallback)
- Document in replit.md: "set MAIL_SEED_ACCOUNT_N to seed corporate accounts"

**1.1.3 Fix TLS Certificate Verification**

Current state: `tls: { rejectUnauthorized: false }` on all IMAP/SMTP connections.

Solution:
- Add environment variable: `MAIL_ALLOW_SELF_SIGNED=true` (development only)
- Production: default to `rejectUnauthorized: true`
- For cPanel hosting with valid Let's Encrypt cert: verification passes
- Fallback: if cert is self-signed/expired → log warning, reject by default
- Test with both cPanel IMAP and the test-connection endpoint

**1.1.4 SMTP Retry Queue**

Current state: send failures are permanent with no retry.

Solution:
- Simple in-memory retry queue (not Redis — keep it simple)
- Failed sends: retry after 5s, 30s, 5min (3 attempts)
- After 3 failures: log to `EmailFailureLog` collection (new model)
- Admin notification if failure rate > 10% in 5 minutes
- Model:
  ```
  EmailFailureLog { to, subject, attemptCount, lastAttemptAt, error, resolved }
  ```

### 1.2 Architecture Foundation

**1.2.1 Centralized Permission System**

Current state: per-route role string comparisons scattered across 15,000+ line routes.ts

Solution — `server/permissions/index.ts`:
```typescript
export const PERMISSIONS = {
  CRM_READ:          ["admin","manager","sales_manager","sales","support"],
  CRM_WRITE:         ["admin","manager","sales_manager","sales"],
  CRM_DELETE:        ["admin","manager","sales_manager"],
  MAIL_READ:         ["admin","manager","ceo","cto","developer"],
  MAIL_ADMIN:        ["admin"],
  FINANCE_READ:      ["admin","manager","accountant"],
  FINANCE_WRITE:     ["admin","accountant"],
  HR_READ:           ["admin","manager","hr"],
  HR_WRITE:          ["admin","hr"],
  PROJECTS_READ:     ["admin","manager","developer","designer","support"],
  PROJECTS_WRITE:    ["admin","manager","developer","designer"],
  SUPPORT_READ:      ["admin","manager","support"],
  SUPPORT_WRITE:     ["admin","manager","support"],
  ADMIN_SYSTEM:      ["admin"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function requirePermission(permission: Permission) {
  return (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const role = (req.user as any).role || "client";
    if (!PERMISSIONS[permission].includes(role)) return res.sendStatus(403);
    next();
  };
}
```

**1.2.2 ZATCA e-Invoice Compliance (Main Platform)**

Current state: ZATCA only in Cafe vertical.

Solution:
- Extract ZATCA QR generation to `server/utils/zatca.ts`
- Apply to all `Invoice` documents
- Fields required: seller name, VAT registration number, date/time, total, VAT amount
- QR = TLV-encoded Base64 per ZATCA spec
- Add to invoice PDF template

**1.2.3 Input Validation Layer (Migration 009)**

Wire Zod validation into the domain controllers that currently have placeholder validation files. Priority order:
1. Mail domain (passwords, ports, email format)
2. CRM domain (phone, email, value limits)
3. Order creation (required fields, value ranges)
4. User registration (email format, password strength)

---

## PHASE 2: CRM REDESIGN

**Goal:** Replace basic leads with a full B2B CRM matching the V5 blueprint.  
**Duration:** 3–4 weeks  
**Prerequisite:** Phase 1 complete

### 2.1 New Database Models

```typescript
// server/models/crm-v2.ts

Company {
  name, industry, size (enum: 1-10/11-50/51-200/200+),
  country, city, address, website, phone, vatNumber,
  status (prospect/active/churned/blocked),
  assignedTo (userId ref), logo, notes, tags,
  createdBy, createdAt, updatedAt
}

Contact {
  fullName, title, company (Company ref),
  phone, email, whatsapp, linkedin,
  preferredContact (enum: phone/email/whatsapp),
  language (ar/en), status (active/inactive),
  source, assignedTo, notes,
  createdBy, createdAt, updatedAt
}

Deal {
  title, company (Company ref), contact (Contact ref),
  value, currency (SAR/USD/AED default SAR),
  probability (0-100), expectedCloseDate,
  stage (qualification/discovery/proposal/negotiation/contract/won/lost),
  assignedTo (userId ref), description,
  lostReason, wonReason,
  products (array: { name, quantity, unitPrice }),
  activities (embedded array),
  linkedLeadId (CrmLead ref, optional),
  createdBy, createdAt, updatedAt
}

CrmActivity {
  type (call/email/whatsapp/meeting/note/task/proposal/contract),
  entity (Company/Contact/Lead/Deal),
  entityId, userId (who logged it),
  content, outcome, duration (minutes),
  scheduledAt, completedAt,
  createdAt
}

LeadScore {
  leadId (CrmLead ref),
  score (0-100),
  breakdown: { profileCompleteness, companySize, budget, engagement, responseTime, source },
  calculatedAt
}
```

### 2.2 Migration from CrmLead to Lead V2

- Existing `CrmLead` records preserved — no destructive migration
- Add `linkedCompanyId`, `linkedContactId` fields to `CrmLead`
- Build auto-link: find matching company by phone domain, find matching contact by phone
- New leads automatically create linked Contact if new phone
- CRM UI shows both old leads and new deals in unified pipeline

### 2.3 CRM Domain Files

Following the established domain architecture pattern:
```
server/domains/crm-v2/
├── types.ts        (Company, Contact, Deal, Activity, LeadScore)
├── domain.ts       (scoring algorithm, stage transitions, access rules)
├── repository.ts   (all Mongoose queries)
├── mapper.ts       (response shaping)
├── service.ts      (use cases)
├── controller.ts   (HTTP handlers)
├── validation.ts   (Zod schemas — full implementation)
├── routes.ts       (Express routing)
└── index.ts        (barrel)
```

### 2.4 API Surface (New Endpoints)

```
GET    /api/crm/companies              list companies (filter: status, assignee)
POST   /api/crm/companies              create company
GET    /api/crm/companies/:id          get company + contacts + deals + timeline
PUT    /api/crm/companies/:id          update company
DELETE /api/crm/companies/:id          delete company (admin only)

GET    /api/crm/contacts               list contacts
POST   /api/crm/contacts               create contact
GET    /api/crm/contacts/:id           get contact + timeline
PUT    /api/crm/contacts/:id           update contact
DELETE /api/crm/contacts/:id           delete contact

GET    /api/crm/deals                  list deals (filter: stage, assignee, dateRange)
POST   /api/crm/deals                  create deal
GET    /api/crm/deals/:id              get deal + timeline
PUT    /api/crm/deals/:id              update deal
PUT    /api/crm/deals/:id/stage        move to stage
DELETE /api/crm/deals/:id              delete deal

GET    /api/crm/activities             list activities (filter: entity, type, dateRange)
POST   /api/crm/activities             log activity

GET    /api/crm/pipeline               deal pipeline with stage totals
GET    /api/crm/forecast               revenue forecast (by month/quarter)
GET    /api/crm/reports                conversion rates, win rates, velocity
```

### 2.5 Frontend CRM V2

Pages:
```
/employee/crm                          → Pipeline view (deals kanban)
/employee/crm/companies                → Company list
/employee/crm/companies/:id            → Company detail + timeline
/employee/crm/contacts                 → Contact list
/employee/crm/contacts/:id             → Contact detail
/employee/crm/deals                    → Deal list + kanban
/employee/crm/deals/:id                → Deal detail + timeline
/employee/crm/leads                    → Legacy leads (existing, preserved)
/employee/crm/reports                  → CRM analytics
/employee/crm/forecast                 → Revenue forecast
```

Components:
- `<PipelineBoard>` — drag-and-drop Kanban
- `<DealCard>` — value, probability, days in stage
- `<Timeline>` — unified activity feed
- `<CompanyCard>` — with linked contacts + deals
- `<LeadScoreBadge>` — color-coded score indicator
- `<ForecastChart>` — best case / most likely / worst case bars

---

## PHASE 3: EMPLOYEE WORKSPACE

**Goal:** Unify the fragmented employee experience into a premium single workspace.  
**Duration:** 2–3 weeks  
**Prerequisite:** Phase 2 complete

### 3.1 Employee Hub V2

Single page at `/employee/hub` with tabbed/panel layout:

**Panel 1: My Day**
- Today's tasks (due today)
- Attendance status + check in/out
- Today's meetings (QMeet schedule)
- Unread mail count

**Panel 2: My Work**
- Active projects assigned to me
- My tasks (all statuses)
- Pending approvals (from my team)
- Kanban quick view

**Panel 3: My Team**
- Who's in/out today (live attendance)
- Recent announcements
- Team calendar

**Panel 4: My Tools**
- Quick access: CRM / Mail / Sandbox IDE / Deployment Cloud
- AI Studio shortcut
- Knowledge Base

### 3.2 Digital Employee Card

New model:
```typescript
EmployeeCard {
  userId (User ref, unique),
  employeeCode (auto-generated: QX-XXXX),
  department, directManager (userId ref),
  startDate, title (display title),
  qrTokenHash (rotates every 30 min),
  qrTokenExpiry,
  appleWalletPassUrl,
  googleWalletObjectUrl,
  isActive
}
```

API:
```
GET    /api/employee/card              get my card
POST   /api/employee/card/refresh-qr  generate new QR token (auto every 30min)
GET    /api/employee/card/apple-pass   download .pkpass
GET    /api/employee/card/google-pass  Google Wallet deeplink
```

### 3.3 Announcements System

New model:
```typescript
Announcement {
  title, body (rich text),
  audience (all/role/department/specific_users[]),
  priority (normal/important/urgent),
  publishAt, expiresAt,
  requireReadReceipt (boolean),
  readBy [{ userId, readAt }],
  createdBy, createdAt
}
```

API:
```
GET    /api/announcements              my announcements (filtered by role)
POST   /api/announcements/read/:id     mark as read
POST   /api/announcements              create (admin/manager only)
```

### 3.4 Leave Request Workflow

```typescript
LeaveRequest {
  userId, type (annual/sick/emergency/unpaid),
  startDate, endDate, days,
  reason, attachmentUrl,
  status (pending/approved/rejected/cancelled),
  reviewedBy, reviewedAt, reviewNote,
  createdAt
}
```

Flow:
1. Employee submits leave request
2. Manager receives notification
3. Manager approves/rejects with note
4. HR notified of approval
5. Attendance system automatically marks leave days
6. Employee notified of decision via email + in-app

---

## PHASE 4: CLIENT EXPERIENCE

**Goal:** Premium, effortless client journey from signup through ongoing relationship.  
**Duration:** 2–3 weeks  
**Prerequisite:** Phase 3 complete

### 4.1 Client Onboarding Wizard

Triggered after first login for new clients:

**Step 1: Welcome** — "مرحباً في QIROX، دعنا نتعرف عليك"
**Step 2: Company Profile** — Company name, industry, size, city
**Step 3: Goals** — What do they want to achieve (multi-select)
**Step 4: Meet Your Manager** — Assigned manager card + book intro call button
**Step 5: Project Overview** — What to expect in the first 2 weeks

### 4.2 Client Dashboard V2

See Zone 2 blueprint. Key additions:
- Visual milestone timeline (not just progress %)
- Direct message button to project manager
- Quick pay button for outstanding invoices
- "What's Next" card (next action required from client)

### 4.3 Milestone-Gated Delivery

New fields on `Project` model:
```typescript
milestones: [{
  title, description,
  dueDate, completedAt,
  deliverables: [{ title, fileUrl, approvedAt }],
  requiresClientApproval, clientApprovedAt, clientApprovedBy,
  status (pending/in_progress/review/approved/revision_requested)
}]
```

### 4.4 Client Satisfaction System

After each project milestone approval:
- One-question CSAT: ⭐ ⭐ ⭐ ⭐ ⭐ (1–5 stars)
- Optional comment
- Score stored per milestone
- Admin sees satisfaction trend per project and per client

After project completion:
- Full NPS survey (0–10 recommend + open comment)
- Thank you email with referral program invite

---

## PHASE 5: EVENTS PLATFORM

**Goal:** Build a complete corporate event management system.  
**Duration:** 4–5 weeks  
**Prerequisite:** Phase 4 complete

### 5.1 Database Models

```typescript
Event, Guest, Session, Sponsor, Certificate
(See Zone 11 in Blueprint for full field specifications)
```

### 5.2 API Surface

```
GET    /api/events                     list events
POST   /api/events                     create event
GET    /api/events/:id                 event detail
PUT    /api/events/:id                 update event
DELETE /api/events/:id                 delete event

GET    /api/events/:id/guests          guest list
POST   /api/events/:id/guests          add guest (single)
POST   /api/events/:id/guests/import   bulk import CSV
DELETE /api/events/:id/guests/:guestId remove guest

POST   /api/events/:id/invitations/send  send invitations (email + WhatsApp)
POST   /api/events/checkin              check in guest (QR scan)
GET    /api/events/:id/attendance      real-time attendance list
GET    /api/events/:id/report          full event report

GET    /api/events/:id/sessions        sessions list
POST   /api/events/:id/sessions        create session

GET    /api/events/guest-confirm/:token  guest confirmation landing page
POST   /api/events/guest-confirm/:token  guest confirms attendance
```

### 5.3 QR Encryption

```typescript
// server/utils/event-qr.ts
import crypto from "crypto";

const SECRET = process.env.EVENT_QR_SECRET || "change-in-production";

export function encryptTicket(payload: { guestId: string; eventId: string; ticketCode: string }): string {
  const data = JSON.stringify({ ...payload, issuedAt: Date.now() });
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(SECRET, "hex"), iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptTicket(token: string): { guestId: string; eventId: string; ticketCode: string; issuedAt: number } {
  const buf = Buffer.from(token, "base64url");
  const iv = buf.slice(0, 12);
  const tag = buf.slice(12, 28);
  const encrypted = buf.slice(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(SECRET, "hex"), iv);
  decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString());
}
```

### 5.4 Apple Wallet Pass Generation

Package: `passkit-generator` (npm)

```typescript
// server/services/apple-wallet.ts
import { PKPass } from "passkit-generator";

export async function generateEventPass(guest: Guest, event: Event): Promise<Buffer> {
  const pass = new PKPass({ ... certificates from env ... });
  pass.type = "eventTicket";
  pass.eventName = event.name;
  pass.setExpirationDate(event.endDate);
  pass.addField("primary", { key: "guestName", label: "الاسم", value: guest.name });
  pass.addField("secondary", { key: "category", label: "الفئة", value: guest.category });
  pass.barcodes = [{ format: "PKBarcodeFormatQR", message: encryptTicket({ guestId: guest.id, eventId: event.id, ticketCode: guest.ticketCode }) }];
  return pass.getAsBuffer();
}
```

Required environment variables:
```
APPLE_PASS_CERT=<base64 encoded .p12 certificate>
APPLE_PASS_CERT_PASSWORD=<certificate password>
APPLE_PASS_WWDR_CERT=<base64 encoded WWDR cert>
APPLE_PASS_TEAM_ID=<Apple Developer Team ID>
APPLE_PASS_PASS_TYPE_ID=pass.online.qiroxstudio.events
```

### 5.5 Google Wallet Integration

Google Wallet API (JWT-based):

```typescript
// server/services/google-wallet.ts
import jwt from "jsonwebtoken";

export function generateGoogleWalletUrl(guest: Guest, event: Event): string {
  const payload = {
    iss: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL,
    aud: "google",
    origins: ["https://qiroxstudio.online"],
    typ: "savetowallet",
    payload: {
      genericObjects: [{
        id: `${process.env.GOOGLE_WALLET_ISSUER_ID}.event-${guest.id}`,
        classId: `${process.env.GOOGLE_WALLET_ISSUER_ID}.qirox-events`,
        genericType: "GENERIC_TYPE_UNSPECIFIED",
        cardTitle: { defaultValue: { language: "ar", value: event.name } },
        subheader: { defaultValue: { language: "ar", value: guest.name } },
        header: { defaultValue: { language: "ar", value: guest.category } },
        barcode: { type: "QR_CODE", value: encryptTicket({ guestId: guest.id, eventId: event.id, ticketCode: guest.ticketCode }) },
      }]
    }
  };
  const token = jwt.sign(payload, process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY as string, { algorithm: "RS256" });
  return `https://pay.google.com/gp/v/save/${token}`;
}
```

### 5.6 Scanner PWA

Standalone PWA at `/events/scanner` (employee-only):
- Camera API for QR scanning (ZXing library)
- POST to `/api/events/checkin` with encrypted token
- Response: { valid, guest, checkedIn, isVIP }
- Offline mode: cached guest list + local check-in queue → sync when online

---

## PHASE 6: QADMIN — WHATSAPP DEVICE MANAGER

**Goal:** Build the WhatsApp Business infrastructure for QIROX.  
**Duration:** 4–5 weeks  
**Prerequisite:** Phase 5 complete

### 6.1 Technical Architecture

**Engine:** Baileys (open-source WhatsApp Web client for Node.js)

```
server/services/whatsapp/
├── engine.ts          (Baileys session management)
├── queue.ts           (message queue with retry)
├── templates.ts       (template rendering)
├── automation.ts      (rule engine)
└── logger.ts          (delivery log)
```

**Device Session Model:**
```typescript
WhatsAppDevice {
  name, phoneNumber, status (connecting/connected/disconnected),
  sessionData (encrypted blob), qrCode (temp, for pairing),
  lastSeen, messagesTotal, messagesToday,
  assignedTo (userId ref), createdBy, createdAt
}
```

**Message Model:**
```typescript
WhatsAppMessage {
  deviceId, to, messageType (text/template/media),
  content, templateId, variables (JSON),
  status (queued/sent/delivered/read/failed),
  wamId (WhatsApp message ID), errorMessage,
  attemptCount (max 3), nextRetryAt,
  createdAt, deliveredAt, readAt
}
```

### 6.2 Session Management

When admin creates a new device:
1. Server creates Baileys client instance
2. Baileys emits QR code → stored in `WhatsAppDevice.qrCode`
3. Frontend polls `/api/qadmin/whatsapp/devices/:id/qr` every 15s
4. Admin scans QR with phone (WhatsApp → Linked Devices → Add a device)
5. Session established → `WhatsAppDevice.status = "connected"`
6. Session state encrypted and persisted in `WhatsAppDevice.sessionData`

On server restart: reload all active sessions from DB, reconnect automatically.

### 6.3 API Surface

```
GET    /api/qadmin/whatsapp/devices              list devices
POST   /api/qadmin/whatsapp/devices              create device (initiates session)
GET    /api/qadmin/whatsapp/devices/:id/qr       get QR code (WebSocket push or polling)
DELETE /api/qadmin/whatsapp/devices/:id          disconnect device
POST   /api/qadmin/whatsapp/devices/:id/reconnect  reconnect

GET    /api/qadmin/whatsapp/messages             message queue
POST   /api/qadmin/whatsapp/send                 send message
POST   /api/qadmin/whatsapp/send-template        send template
POST   /api/qadmin/whatsapp/messages/:id/retry   manual retry

GET    /api/qadmin/whatsapp/templates            list templates
POST   /api/qadmin/whatsapp/templates            create template
PUT    /api/qadmin/whatsapp/templates/:id        update template
DELETE /api/qadmin/whatsapp/templates/:id        delete template

GET    /api/qadmin/whatsapp/automations          list automations
POST   /api/qadmin/whatsapp/automations          create automation
PUT    /api/qadmin/whatsapp/automations/:id      update automation
DELETE /api/qadmin/whatsapp/automations/:id      delete automation
```

### 6.4 Environment Variables Required

```
WA_SESSION_ENC_KEY=<32-byte hex key for session encryption>
```

---

## PHASE 7: KNOWLEDGE BASE

**Goal:** Client self-service + employee internal wiki + training system.  
**Duration:** 2–3 weeks  
**Prerequisite:** Phase 6 complete

### 7.1 Models

See Zone 12 blueprint for full Article and Module specifications.

### 7.2 API Surface

```
GET    /api/kb/articles                public + client articles
GET    /api/kb/articles/:slug          single article
GET    /api/kb/search?q=              full-text search
POST   /api/kb/articles/:id/helpful   mark helpful
POST   /api/kb/articles/:id/not-helpful  mark not helpful

GET    /api/kb/internal/articles       employee-only articles
POST   /api/kb/articles               create (admin/manager)
PUT    /api/kb/articles/:id           update
DELETE /api/kb/articles/:id           delete

GET    /api/kb/training/modules        training modules
GET    /api/kb/training/modules/:id/progress  my progress
POST   /api/kb/training/modules/:id/complete  mark section complete
POST   /api/kb/training/modules/:id/quiz      submit quiz answers
```

---

## PHASE 8: QIROX PRESENTATION

**Goal:** Apple-keynote-style company pitch section.  
**Duration:** 1–2 weeks  
**Prerequisite:** Phase 7 complete

### 8.1 Implementation

- Single-page scroll experience at `/presentation`
- Library: Framer Motion (already in stack) for section transitions
- Sections: see Zone 13 blueprint
- Mobile-optimized (presentations viewed on phones in meetings)
- Print-to-PDF support (CSS print media query)
- Password-protected investor section (optional toggle)

### 8.2 Performance

- All section content server-side rendered for SEO
- Images lazy-loaded with blur placeholder
- Video sections use `<video autoplay muted loop>` with fallback poster
- Lighthouse score target: 90+ for all metrics

---

## PHASE 9: AI PLATFORM V2

**Goal:** Upgrade AI capabilities and embed AI intelligence throughout the platform.  
**Duration:** 3–4 weeks  
**Prerequisite:** Phase 8 complete

### 9.1 Support AI (First Responder)

When a support ticket is created:
1. Extract ticket category + keywords
2. Search knowledge base for matching articles
3. If match confidence > 80%: send automated reply with article link
4. If confidence 50–80%: draft reply for agent to review (one-click send)
5. If < 50%: assign to agent normally
6. Log: AI resolution rate, confidence scores

### 9.2 CRM Lead Intelligence

New endpoint: `POST /api/ai/crm/analyze-lead`
- Input: leadId
- Output: { nextBestAction, winProbability, riskFactors, suggestedTemplate }

### 9.3 Project Estimate AI

New endpoint: `POST /api/ai/project/estimate`
- Input: requirements text (free form Arabic/English)
- Output: { estimatedDuration, recommendedTeam, riskAreas, similarProjects }

### 9.4 Weekly AI Business Summary

Cron: Every Sunday 8:00 AM AST
- Aggregate last 7 days: revenue, new leads, closed deals, project milestones, support tickets
- Generate Arabic summary via GPT-4o
- Deliver to admin via: in-app notification + email

---

## PHASE 10: ANALYTICS & AUTOMATION

**Goal:** Real-time business intelligence and no-code automation engine.  
**Duration:** 3–4 weeks  
**Prerequisite:** Phase 9 complete

### 10.1 Analytics Infrastructure

- All key business events stored in `AnalyticsEvent` collection:
  ```
  { type, userId, entityType, entityId, metadata, timestamp }
  ```
- Aggregation jobs run every hour (cron)
- Pre-computed dashboards served from `AnalyticsSummary` collection

### 10.2 Automation Engine

See Zone 16 blueprint for trigger/action specifications.

Implementation:
```typescript
Automation {
  name, isActive,
  trigger: { type, conditions: [{ field, operator, value }] },
  actions: [{ type, config, delay (ms) }],
  lastTriggeredAt, triggerCount, errorCount
}
```

Automation service:
- `evaluate(trigger, payload)` → determines if automation fires
- `execute(action, context)` → runs the action
- Action handlers: sendEmail, sendWhatsApp, createTask, createNotification, updateRecord

---

## PHASE 11: APPLE WALLET / GOOGLE WALLET

**Goal:** Digital passes for employees and event guests.  
**Duration:** 2 weeks  
**Prerequisite:** Phase 10 complete (events wallet done in Phase 5)

### 11.1 Employee Wallet Pass

See Phase 3 (employee card) — Apple/Google Wallet spec in Zone 3 blueprint.

### 11.2 Loyalty Card Wallet Pass

- Client loyalty program as digital wallet card
- Balance updates push to existing passes (Apple Wallet supports updates)
- QR code for redemption at point of service

---

## PHASE 12: MOBILE PWA

**Goal:** Excellent mobile web experience installable on iOS and Android.  
**Duration:** 2 weeks  
**Prerequisite:** Phase 11 complete

### 12.1 PWA Configuration

`client/public/manifest.json`:
```json
{
  "name": "QIROX Studio",
  "short_name": "QIROX",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "dir": "rtl",
  "lang": "ar",
  "icons": [...]
}
```

### 12.2 Service Worker

Cache strategy:
- Shell (HTML/CSS/JS): Cache First
- API responses: Network First with cache fallback
- Images: Cache First with expiry
- Offline page: Pre-cached

### 12.3 Viewport Optimization

- All pages tested at 390px (iPhone 16) and 428px (iPhone 16 Plus)
- Touch targets minimum 44×44 points
- No horizontal scroll on any page
- Bottom navigation for mobile (replaces sidebar on small screens)

---

## PHASE 13: NATIVE APP (iOS / ANDROID)

**Goal:** Native app for client persona.  
**Duration:** 6–8 weeks  
**Prerequisite:** Phase 12 complete + Apple compliance items resolved

### 13.1 Platform

React Native + Expo (managed workflow)

### 13.2 Features (Client App Only)

- Dashboard (project status, milestones)
- Project tracker (real-time)
- Wallet (Qirox Pay — native payments via RevenueCat)
- Invoices (view + pay)
- Support tickets
- Push notifications (APNs + FCM)
- Face ID / Touch ID for wallet PIN
- Document viewer

### 13.3 Apple Compliance Checklist

Before App Store submission:
- [ ] Sign in with Apple implemented (ASWebAuthenticationSession)
- [ ] Account deletion flow implemented and visible
- [ ] Privacy nutrition labels accurate
- [ ] No external browser redirects for authentication
- [ ] In-app purchase for subscriptions via App Store (RevenueCat)
- [ ] Privacy policy linked from settings screen
- [ ] Data deletion request endpoint operational
- [ ] No tracking without explicit consent

---

## ENVIRONMENT VARIABLES — V5 COMPLETE LIST

Variables to add (in addition to existing):

```bash
# Security
MAIL_ALLOW_SELF_SIGNED=false              # Set true only in development
EVENT_QR_SECRET=<64-char hex>            # For event ticket encryption

# Mail seeding (replaces hardcoded passwords)
MAIL_SEED_ACCOUNT_1=email:password:imapHost:imapPort:smtpHost:smtpPort
MAIL_SEED_ACCOUNT_2=email:password:...
MAIL_SEED_ACCOUNT_3=email:password:...
MAIL_SEED_ACCOUNT_4=email:password:...

# Apple Wallet
APPLE_PASS_CERT=<base64>
APPLE_PASS_CERT_PASSWORD=
APPLE_PASS_WWDR_CERT=<base64>
APPLE_PASS_TEAM_ID=
APPLE_PASS_PASS_TYPE_ID=pass.online.qiroxstudio.events
APPLE_PASS_EMPLOYEE_TYPE_ID=pass.online.qiroxstudio.employee

# Google Wallet
GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL=
GOOGLE_WALLET_SERVICE_ACCOUNT_KEY=<JSON key>
GOOGLE_WALLET_ISSUER_ID=

# WhatsApp
WA_SESSION_ENC_KEY=<32-byte hex>

# ZATCA
ZATCA_SELLER_NAME=QIROX Studio
ZATCA_VAT_NUMBER=<15-digit VAT registration number>
ZATCA_SELLER_ADDRESS=<full address>

# SEO
SITE_CANONICAL_URL=https://qiroxstudio.online
```

---

## DATABASE INDEX PLAN

Indexes to add in V5 (not currently present):

```javascript
// CRM
db.companies.createIndex({ status: 1, assignedTo: 1 })
db.contacts.createIndex({ company: 1 })
db.contacts.createIndex({ email: 1 }, { unique: true, sparse: true })
db.deals.createIndex({ stage: 1, assignedTo: 1 })
db.deals.createIndex({ expectedCloseDate: 1, status: 1 })
db.crmactivities.createIndex({ entityType: 1, entityId: 1, createdAt: -1 })

// Events
db.events.createIndex({ status: 1, date: 1 })
db.guests.createIndex({ eventId: 1, status: 1 })
db.guests.createIndex({ ticketCode: 1 }, { unique: true })
db.guests.createIndex({ email: 1, eventId: 1 })

// WhatsApp
db.whatsappmessages.createIndex({ deviceId: 1, status: 1 })
db.whatsappmessages.createIndex({ status: 1, nextRetryAt: 1 }) // for retry cron

// Analytics
db.analyticsevents.createIndex({ type: 1, timestamp: -1 })
db.analyticsevents.createIndex({ userId: 1, timestamp: -1 })

// Knowledge Base
db.kbarticles.createIndex({ slug: 1 }, { unique: true })
db.kbarticles.createIndex({ audience: 1, isPublished: 1 })
db.kbarticles.createIndex({ "$**": "text" }) // full-text search
```

---

## RISK REGISTER

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| WhatsApp session instability | HIGH | HIGH | Session persistence + auto-reconnect + admin alerts |
| Apple Wallet cert expiry | MEDIUM | HIGH | Certificate expiry monitoring + renewal reminder |
| ZATCA API breaking changes | MEDIUM | HIGH | Abstract behind ZATCA service layer, pin API version |
| MongoDB performance under event load | MEDIUM | MEDIUM | Pre-computed aggregations, proper indexes |
| Baileys breaking changes (WhatsApp) | HIGH | MEDIUM | Pin to tested version, monitor WhatsApp Web protocol changes |
| Google Wallet API deprecation | LOW | HIGH | Abstract behind service layer, monitor deprecations |
| Employee face data privacy | MEDIUM | HIGH | Store locally only, explicit consent, deletion flow |
| PDPL (Saudi data privacy law) non-compliance | MEDIUM | CRITICAL | Legal review before Phase 4 launch |

---

## DEFINITION OF DONE — PER PHASE

Each phase is complete when:
1. All API endpoints respond correctly to valid and invalid inputs
2. All frontend pages render without errors (all viewports: 390px / 768px / 1440px)
3. Arabic RTL layout is correct on all new screens
4. All new features have in-app notifications wired
5. All new models have proper indexes created
6. Security: no hardcoded credentials, no plaintext passwords, no self-signed TLS bypass in prod
7. SEO: all new public pages have title, description, OG tags, canonical
8. Migration report written (docs/progress/)
9. Application starts without errors
10. Approved by product owner before next phase begins

---

## IMMEDIATE NEXT ACTIONS

Before any code is written for V5:

1. **Get approval on this Phase 0 output** (the three documents you are reading)
2. **Resolve Apple compliance** (Phase 1, security block) — this is a legal/business risk, not just a tech issue
3. **Provision environment variables** for mail seeding (removes hardcoded credentials)
4. **Legal review** of PDPL compliance requirements
5. **Design review** — hire or assign a dedicated Arabic UI/UX designer for V5 redesigns before engineering begins
6. **Approve Phase 1** security plan explicitly — migration scripts are destructive (encrypted passwords cannot be recovered without the key)

---

*End of Execution Plan.*  
*QIROX V5 — Built to last. Arabic-first. Enterprise-grade.*
