# QIROX MASTER ANALYSIS
## Phase 0 — Complete Business Discovery

**Version:** V5 Pre-Build  
**Date:** 2026-07-10  
**Classification:** Strategic Planning Document  
**Audience:** Leadership, Product, Engineering

---

## 1. COMPANY OVERVIEW

QIROX (QIROX Studio) is an Arabic-first SaaS "Systems Factory" operating in the Saudi Arabian technology market. The company builds and delivers custom digital systems — websites, ERP platforms, POS systems, restaurant management systems, and CRM tools — for Arabic-speaking businesses across 10 industry sectors.

The business model is a hybrid:
- **Service business**: Custom system delivery to clients (the core revenue stream)
- **Platform business**: The QIROX platform itself serves as both the delivery vehicle and the product showcase
- **Vertical SaaS**: Embedded verticals (Cafe OS / restaurant system) are both demo environments and real deliverable products

The company operates with a small internal team (employees with specific roles), manages client relationships through the platform itself, and handles everything from initial lead capture to project delivery to post-delivery support inside a single web application.

---

## 2. PLATFORM INVENTORY — CURRENT STATE

### 2.1 Public Website (Unauthenticated)

| Route | Purpose | Quality |
|---|---|---|
| `/` | Main landing — 8-sector showcase | ✅ Exists, needs premium redesign |
| `/about` | Company story | ✅ Exists |
| `/prices` | Subscription/pricing tiers | ✅ Exists |
| `/customers` | Client showcase | ✅ Exists |
| `/news` | Blog/news | ✅ Exists |
| `/jobs` | Job listings | ✅ Exists |
| `/order` | Service ordering flow | ✅ Multi-step wizard |
| `/track` | Public order tracking | ✅ Exists |
| `/start`, `/quick-start` | Onboarding entry | ⚠️ Unclear differentiation |
| `/consultation` | Book a consultation | ✅ Exists |
| `/meet/join` | Join QMeet via code | ✅ Exists |
| `/login`, `/register` | Authentication | ✅ Exists |
| `/switch-reminder` | Switch CTA page | ⚠️ Unclear audience |
| `/ai-wizard` | AI system recommender | ✅ Exists |
| `/partners` | Partner portal | ⚠️ Minimal content |
| `/systems` | System catalog | ✅ Exists |

**Issues:** No dedicated systems portfolio/case studies page. No events page. No knowledge base or help center. No "Request a Demo" flow separate from ordering. No careers pipeline beyond a listing page.

---

### 2.2 Client Workspace (Authenticated: role=client)

| Route | Purpose | Quality |
|---|---|---|
| `/dashboard` | Project overview + stats | ⚠️ Generic, not premium |
| `/wallet` | Qirox Pay wallet | ✅ Wallet + top-up + PIN |
| `/profile` | Account settings | ✅ Avatar builder exists |
| `/inbox` | Messages with team | ✅ WebSocket real-time |
| `/support` | Support tickets | ✅ Exists |
| `/client/invoices` | Invoice history | ✅ Exists |
| `/cart` | Shopping cart | ✅ Exists |
| `/client/installments` | Installment tracking | ✅ Exists |
| `/my-requests` | Data requests from team | ✅ Exists |
| `/my-tools` | 50+ utility tools | ✅ Exists |
| `/my-orders` | Order history | ✅ Exists |
| `/referrals` | Referral program | ✅ Gamified |
| `/loyalty` | Loyalty points | ✅ Exists |
| `/contracts` | Digital contracts | ✅ Exists |
| `/track-order/:id` | Project tracker | ✅ 5-step progress |

**Issues:** Dashboard is not premium. No onboarding flow after first login. No guided journey. Client has no visibility into project milestones beyond a progress bar. No calendar of upcoming deliverables. No meeting scheduler with the team. No client satisfaction/NPS mechanism.

---

### 2.3 Employee Workspace (Authenticated: employee roles)

| Route | Purpose | Quality |
|---|---|---|
| `/employee/hub` | Main employee dashboard | ⚠️ Fragmented |
| `/employee/crm` | CRM leads management | ⚠️ Basic leads only |
| `/employee/mail` | Corporate IMAP inbox | ✅ With cache fallback |
| `/employee/whatsapp-crm` | WhatsApp message templates | ⚠️ wa.me links only, no real WA |
| `/employee/new-order` | Create order for client | ✅ Exists |
| `/employee/changelog` | System changelog | ✅ Exists |
| `/employee/sector-guide` | Technical guide (10 sectors) | ✅ Exists |
| `/employee/demos` | Demo system access | ✅ Exists |
| `/admin/kanban` | Task management board | ✅ Exists |
| `/admin/studio` | Cloud IDE / Sandbox | ✅ Exists |
| `/admin/deployment-cloud` | Deployment management | ✅ GitHub OAuth |
| `/employee/attendance` | Check-in/out with Face ID | ✅ Face recognition |

**Issues:** No unified employee hub. Each feature is an isolated page. No employee card/identity. No digital wallet or Apple/Google Wallet support. No internal announcements feed. No training center. No knowledge base. No approval workflows. Attendance is isolated from the rest of the workspace.

---

### 2.4 Admin Panel (Authenticated: admin/manager)

| Route | Purpose | Quality |
|---|---|---|
| `/admin` | System map overview | ✅ Exists |
| `/admin/dashboard` | Business metrics | ✅ Exists |
| `/admin/customers` | Client management | ✅ Exists |
| `/admin/orders` | Order pipeline | ✅ Exists |
| `/admin/finance` | Financial overview | ✅ Exists |
| `/admin/employees` | Staff management | ✅ Exists |
| `/admin/payroll` | Salary processing | ✅ Exists |
| `/admin/attendance` | Attendance tracking | ✅ Exists |
| `/admin/analytics` | Business intelligence | ✅ Exists |
| `/admin/services` | Service catalog | ✅ Exists |
| `/admin/projects` | Project management | ✅ Exists |
| `/admin/invoices` | Invoice management | ✅ Exists |
| `/admin/support-tickets` | Support queue | ✅ Exists |
| `/admin/atlas` | MongoDB monitoring | ✅ Live cluster stats |
| `/admin/cron-jobs` | Job scheduler | ✅ DB-driven UI |
| `/admin/installments` | Installment management | ✅ Exists |
| `/admin/push-notifications` | Push broadcast | ✅ VAPID-based |
| `/admin/email-marketing` | Email campaigns | ✅ Bulk + tracking |
| `/admin/quotations` | Quote management | ✅ Exists |
| `/admin/notifications` | Notification center | ✅ Exists |
| `/admin/publishing` | App publishing control | ✅ Exists |

**Issues:** No unified command center view. No real-time operational health dashboard. No event platform. No structured CRM pipeline beyond basic leads. Finance and payroll are separate but should be unified. No approval workflows for leave, expenses, or change requests.

---

## 3. DATABASE MODEL INVENTORY

### 3.1 Core Models

| Model | Collection | Key Business Purpose |
|---|---|---|
| `User` | users | All platform users — 13 roles |
| `Otp` | otps | One-time passwords for auth/2FA |
| `WebAuthnCredential` | webauthncredentials | Biometric/FIDO2 keys |
| `DeviceToken` | devicetokens | Persistent login sessions |
| `ClientApiKey` | clientapikeys | API access for external clients |
| `AuthApp` | authapps | OAuth2 registered applications |

### 3.2 Order & Finance Models

| Model | Collection | Key Business Purpose |
|---|---|---|
| `Order` | orders | Service/product orders |
| `OrderSpecs` | orderspecs | Technical specs attached to orders |
| `Invoice` | invoices | Billing documents |
| `ReceiptVoucher` | receiptvouchers | Payment receipts |
| `QiroxProduct` | qiroxproducts | Product catalog |
| `Cart` | carts | Shopping cart |
| `ModificationRequest` | modificationrequests | Change requests post-delivery |
| `InvestmentPayment` | investmentpayments | Investor transactions |
| `InstallmentApplication` | installmentapplications | Payment plan applications |

### 3.3 HR Models

| Model | Collection | Key Business Purpose |
|---|---|---|
| `Attendance` | attendances | Clock-in/out logs |
| `EmployeeProfile` | employeeprofiles | Extended employee data + salary |
| `PromotionLog` | promotionlogs | Role change history |
| `FaceDescriptor` | facedescriptors | Face recognition vectors |

### 3.4 Project Models

| Model | Collection | Key Business Purpose |
|---|---|---|
| `Project` | projects | Active delivery projects |
| `Task` | tasks | Project tasks |
| `ChecklistItem` | checklistitems | Personal/team to-dos |
| `ProjectComment` | projectcomments | Project communication log |

### 3.5 CRM & Communication Models

| Model | Collection | Key Business Purpose |
|---|---|---|
| `CrmLead` | crmleads | Sales leads pipeline |
| `LeadData` | leaddatas | Contact/prospect database |
| `Notification` | notifications | In-app alerts |
| `CsSession` | cssessions | Live support chat |

### 3.6 Mail Models

| Model | Collection | Key Business Purpose |
|---|---|---|
| `MailAccount` | mailaccounts | Corporate IMAP/SMTP credentials |
| `MailCache` | mailcaches | Cached email messages |
| `MarketingEmail` | marketingemails | Marketing subscriber list |
| `EmailCampaign` | emailcampaigns | Bulk email campaigns |
| `EmailCampaignRecipient` | emailcampaignrecipients | Per-recipient tracking |
| `InterestedLead` | interestedleads | Engaged campaign recipients |
| `GlobalSentEmail` | globalsentemails | Send deduplication registry |

### 3.7 Missing Models (Does Not Exist)

The following business entities have **no database model**:
- Events
- Event Guests
- Event Invitations
- Event Check-ins
- Knowledge Base Articles
- Apple Wallet Passes
- Google Wallet Objects
- Employee Cards
- WhatsApp Device Sessions
- WhatsApp Message Queue
- Contracts (digital — model unclear)
- Deals/Opportunities (CRM)
- Companies (CRM entity)
- People/Contacts (CRM entity)
- Campaign Automations
- SLA records
- Approval Workflows
- Announcements
- Training Modules

---

## 4. USER ROLES & PERMISSIONS

### 4.1 Role Hierarchy

```
admin
  ├── manager
  │     ├── developer
  │     ├── designer
  │     ├── sales_manager
  │     │     └── sales
  │     ├── accountant
  │     ├── support
  │     ├── hr
  │     └── marketing
  ├── merchant
  └── client
        └── customer
              └── investor
                    └── supplier
```

### 4.2 Permission Matrix (Current)

| Capability | admin | manager | developer | sales | accountant | support | client |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| System settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| User management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Order management | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | view |
| Finance | ✅ | view | ❌ | ❌ | ✅ | ❌ | own |
| CRM leads | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| Projects | ✅ | ✅ | assigned | ❌ | ❌ | ❌ | own |
| HR/Payroll | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Support tickets | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | own |
| Corporate mail | ✅ | shared | assigned | assigned | ❌ | ❌ | ❌ |
| Analytics | ✅ | ✅ | ❌ | own | ✅ | ❌ | ❌ |

**Issues:** Permission system is ad-hoc — enforced per-route with hardcoded role checks. No centralized permission registry. No granular permission toggles. The `hr` role is inconsistently defined. `marketing` role appears in sidebar logic but is not a formal enum value. No concept of "permission groups."

---

## 5. BUSINESS FLOWS — CURRENT STATE

### 5.1 Lead-to-Cash Flow

```
Prospect visits public site
  → Browses sectors/prices
  → Clicks "Order" or "Start"
  → Multi-step order wizard (/order)
    → Selects service type
    → Provides requirements
    → Submits
  → Order created (status: pending)
  → Admin reviews in /admin/orders
    → Approves → client notified
    → Assigns to employee team
  → Project created (/admin/projects)
    → Tasks assigned to team
    → Employee works on tasks
  → Client tracks via /track-order/:id
  → Project milestones updated
  → Invoice generated
  → Client pays via wallet / bank transfer / gateway
  → Order marked completed
  → Post-delivery support via tickets
```

**Gaps:**
- No formal discovery/consultation phase before ordering
- No proposal/quotation approval step (quotations exist but not integrated into flow)
- No contract signing step in the main flow
- No meeting scheduling integration with project kickoff
- No formal project review/approval step before delivery
- No client satisfaction collection after delivery

### 5.2 Payment Flow

```
Client wants to pay →
  [Option A] Qirox Pay wallet
    → Check balance
    → PIN verification (OTP email)
    → Atomic debit
  [Option B] Bank transfer
    → Upload proof image
    → Admin manual verification
    → Wallet credited
  [Option C] Payment gateway (Geidea/NeoLeap/Paymob)
    → Redirect to gateway
    → Webhook confirmation
    → Wallet credited
  [Option D] Installment plan
    → Apply for plan
    → Admin approval
    → Automatic monthly deductions (cron)
    → Late fees applied if missed
  [Option E] PayPal (optional, degrades gracefully)
```

**Gaps:**
- No unified payment dashboard showing all payment methods status
- Bank transfer verification is entirely manual — no automation
- Installment late check runs via cron but no employee alert system
- No ZATCA (Saudi e-invoicing) compliance in core flow (only in Cafe vertical)
- No multi-currency invoice generation
- No automated dunning/reminders for unpaid invoices

### 5.3 Employee Work Flow

```
Employee logs in →
  → Role-specific redirect (hub/dashboard)
  → Check in (attendance with optional Face ID)
  → Access Kanban board for assigned tasks
  → Work on project tasks
  → Use Sandbox IDE for development
  → Communicate via corporate mail
  → Log activities in CRM
  → Check out (end of day)
```

**Gaps:**
- Attendance and task management are completely separate — no unified view
- No daily/weekly work reports
- No internal announcements feed (no way for admin to broadcast to team)
- No approval workflows (leave requests go nowhere structured)
- No knowledge base or internal wiki
- No employee performance metrics
- No internal social/team building features

### 5.4 Support Flow

```
Client has issue →
  → Opens support ticket (/support)
    → Category, priority, description
  → Support agent sees ticket in /admin/support-tickets
  → Agent replies
  → Email notification sent to client
  → Client can reply in ticket thread
  → Ticket resolved/closed
```

**Gaps:**
- No SLA timer enforcement
- No ticket priority auto-routing
- No escalation workflows
- No canned responses
- No support analytics/resolution time reporting
- Live chat (CsSession) exists but unclear how it connects to ticket workflow

---

## 6. SYSTEMS AUDIT

### 6.1 Authentication System — Audit

| Feature | Status |
|---|---|
| Email + password login | ✅ |
| Google OAuth | ✅ |
| Apple OAuth | ✅ |
| GitHub OAuth | ✅ |
| Password reset via OTP email | ✅ |
| Email verification | ✅ |
| Device 2FA (email OTP on new device) | ✅ |
| TOTP (authenticator app) | ✅ |
| Passphrase 2FA | ✅ |
| Push notification approval 2FA | ✅ |
| WebAuthn/FIDO2 biometric | ✅ |
| Face recognition (attendance) | ✅ |
| QR login token | ✅ |
| Session management | ✅ Express sessions |
| Apple login compliance | ⚠️ External browser redirect issue (per document) |
| Native iOS login | ❌ No native app |
| Account deletion flow | ⚠️ Exists but needs Apple compliance |

### 6.2 Notification System — Audit

| Channel | Status | Coverage |
|---|---|---|
| In-app (WebSocket) | ✅ | Orders, projects, messages, system |
| Email (SMTP) | ✅ | 20+ template types |
| Web Push (VAPID) | ✅ | Browser push |
| SMS | ❌ | Intentionally excluded |
| WhatsApp (real) | ❌ | Only wa.me links — no API |
| Apple push (APNs) | ❌ | No native app |

### 6.3 CRM System — Audit

**Current capabilities:**
- Basic lead entity: name, phone, email, company, stage, source, value
- 6 pipeline stages: new → contacted → qualified → proposal → won → lost
- Activity log per lead: call, email, whatsapp, meeting, note, task
- Bulk import (CSV with Arabic column aliases)
- Deduplication by phone number
- Simple filter by stage/assignee/search

**Missing:**
- Companies entity (organizations separate from contacts)
- People entity (individuals separate from companies)
- Deals/Opportunities (separate from leads — post-qualification)
- Deal pipeline with probability and forecasting
- Email/WhatsApp integration in timeline
- Document management per lead/deal
- Contract generation from deal
- Invoice generation from deal
- Meeting scheduling and notes
- Call logging with duration/recording
- Lead scoring algorithm
- Campaign attribution
- CRM reporting (conversion rates, pipeline velocity, win rate)
- Mobile-optimized CRM interface

### 6.4 Communication System — Audit

| System | Status | Issues |
|---|---|---|
| Internal inbox/chat | ✅ WebSocket | No threading |
| Corporate email | ✅ IMAP/SMTP | Plaintext passwords, no pooling |
| QMeet (WebRTC) | ✅ | Lobby disabled by default |
| Email marketing | ✅ | Bulk + tracking |
| WhatsApp | ❌ | wa.me links only |
| SMS | ❌ | Intentionally excluded |

### 6.5 AI Platform — Audit

| Feature | Status |
|---|---|
| Chat (GPT-4o / Kimi fallback) | ✅ |
| Vision/image analysis | ✅ (GPT-4o only) |
| Image generation (Arabic→English translation + flux) | ✅ |
| Video generation (proxy) | ✅ |
| System Builder AI (code generation) | ✅ |
| Anti-Chinese content rules | ✅ |
| AI session management/history | ✅ |
| AI-powered CRM insights | ❌ |
| AI-powered project estimates | ❌ |
| AI-powered content generation for clients | ❌ |

### 6.6 SEO — Audit

| Area | Status |
|---|---|
| useSEO hook (meta + OG tags) | ✅ Exists |
| sitemap.xml (14 URLs) | ✅ Exists |
| robots.txt | ⚠️ Unknown |
| Structured data (JSON-LD) | ❌ |
| Arabic keyword targeting | ⚠️ Partial |
| Core Web Vitals | ⚠️ Unknown |
| Canonical tags | ⚠️ Unknown |
| Hreflang (AR/EN) | ⚠️ Unclear |
| Blog/content SEO | ⚠️ News page exists but sparse |
| Backlink strategy | ❌ |
| Local SEO (Saudi Arabia) | ❌ |

### 6.7 Security — Audit (Critical Findings)

| Issue | Severity | Location |
|---|---|---|
| Plaintext passwords in MongoDB (MailAccount) | CRITICAL | server/models/mail.ts |
| Hardcoded credentials in source code (seedDefaultAccounts) | CRITICAL | server/mail-imap.ts |
| `tls: { rejectUnauthorized: false }` on all IMAP/SMTP | HIGH | server/mail-imap.ts, server/email.ts |
| No SMTP queue/retry — silent delivery failures | HIGH | server/email.ts |
| No input validation on mail ports, attachment types | MEDIUM | server/domains/mail |
| DevTools detection and right-click blocking in production | INFO | Frontend |
| No rate limiting on auth endpoints (beyond global) | HIGH | server/routes.ts |
| Session secret from env — must be rotated regularly | INFO | server/index.ts |

---

## 7. UX AUDIT — WHAT WOULD NOT SURVIVE ACQUISITION

### 7.1 "Would Apple keep this?"

| Item | Verdict | Why |
|---|---|---|
| External browser redirect for Apple login | ❌ NO | Violates App Store guidelines |
| No account deletion flow | ❌ NO | Required by App Store |
| No native payments in app | ❌ NO | Required for in-app purchases |
| Privacy policy unclear | ❌ NO | GDPR/PDPL compliance |
| Right-click blocking | ❌ NO | Anti-user, breaks accessibility |
| Face ID for attendance via browser | ⚠️ MARGINAL | WebAuthn-based — acceptable but fragile |

### 7.2 "Would Stripe keep this?"

| Item | Verdict | Why |
|---|---|---|
| Manual bank transfer verification | ❌ NO | Not scalable, error-prone |
| No payment failure notifications | ❌ NO | Revenue leakage |
| No automated dunning | ❌ NO | Unpaid invoices lost |
| No receipt format standard | ❌ NO | ZATCA compliance risk |
| Wallet PIN via email OTP | ⚠️ WEAK | Adds friction without real security |
| Plaintext passwords in payment account DB | ❌ NO | PCI-DSS violation risk |

### 7.3 "Would Linear keep this?"

| Item | Verdict | Why |
|---|---|---|
| Kanban without sprint planning | ❌ NO | No velocity tracking |
| Tasks without time estimates | ❌ NO | No capacity planning |
| No project timeline/Gantt view | ❌ NO | Missing for client communication |
| No definition of "done" | ❌ NO | No acceptance criteria on tasks |
| No change request approval workflow | ❌ NO | Modification requests go nowhere |

### 7.4 "Would Notion keep this?"

| Item | Verdict | Why |
|---|---|---|
| No knowledge base | ❌ NO | Core missing capability |
| No internal wiki | ❌ NO | Team knowledge lost |
| No meeting notes system | ❌ NO | After every client call — nothing captured |
| No structured onboarding docs | ❌ NO | New clients lost after signup |

---

## 8. MISSING CAPABILITIES — COMPLETE LIST

### 8.1 Does Not Exist (Build from Zero)

| Capability | Business Impact |
|---|---|
| **Event Platform** | Corporate events, client events, partner events |
| **Knowledge Base** | Client self-service, employee training, reduce support |
| **WhatsApp Business API** | Core communication channel in KSA market |
| **Apple Wallet Passes** | Employee ID cards, event tickets, loyalty cards |
| **Google Wallet Objects** | Same as above for Android |
| **Employee Digital Card** | Professional identity, attendance QR |
| **CRM: Companies entity** | B2B relationship management |
| **CRM: Deals pipeline** | Post-lead opportunity tracking |
| **CRM: Forecasting** | Revenue prediction |
| **Approval Workflows** | Leave, expenses, change requests |
| **Internal Announcements** | Team broadcasts, company news |
| **Training Center** | Onboarding, skill development |
| **QIROX Presentation** | Apple-keynote style company pitch |
| **Lead Scoring** | Automatic lead quality ranking |
| **Structured Data / JSON-LD** | SEO for Arabic search |
| **Client NPS / Satisfaction** | Post-project feedback collection |
| **SLA Management** | Support ticket enforcement |
| **Meeting Scheduler** | Book meetings with team |
| **Project Timeline/Gantt** | Visual project calendar |
| **ZATCA e-Invoicing** | Legal compliance for KSA |

### 8.2 Partially Implemented (Complete or Replace)

| Capability | Current State | Gap |
|---|---|---|
| CRM | Basic leads | No companies, deals, forecasting |
| Employee workspace | Fragmented pages | No unified hub |
| Client onboarding | Minimal | No guided journey |
| Quotations | Exists | Not integrated into order flow |
| Contracts | Exists | No e-signature integration |
| Analytics | Exists | No real-time ops dashboard |
| Email system | IMAP/SMTP | No threading, no search, no sync |
| QAdmin | Partial | WhatsApp device manager missing |

### 8.3 Dead Weight (Consider Removing or Deferring)

| Item | Reason |
|---|---|
| `/switch-reminder` page | Purpose unclear, no clear CTA |
| GitHub OAuth | Low adoption, maintenance overhead |
| `customer` role | Ambiguous — nearly identical to `client` |
| `merchant` role | Undefined permissions, unused flows |
| Cafe vertical (from main app) | Should be a standalone tenant product |

---

## 9. TECHNICAL DEBT SUMMARY

| Category | Debt Items | Priority |
|---|---|---|
| Security | Plaintext passwords, no TLS verify, no SMTP retry | P0 |
| Architecture | Monolithic routes.ts (15,000+ lines) | P1 |
| Architecture | No centralized permission system | P1 |
| Architecture | N+1 queries in admin account list | P2 |
| Architecture | No connection pooling for IMAP | P2 |
| Data | Dual assignee fields (legacy + new) in MailAccount | P2 |
| Data | No pagination on inbox fetch | P2 |
| Data | HTML stored in mail cache (storage bloat) | P3 |
| Frontend | No proper error boundaries | P2 |
| Frontend | No loading skeleton standards | P3 |
| SEO | No structured data / JSON-LD | P1 |
| Compliance | No ZATCA for main platform (only Cafe) | P1 |
| Compliance | Apple App Store violations (login flow) | P0 |
| Compliance | No PDPL (Saudi data privacy law) compliance docs | P1 |

---

## 10. COMPETITIVE POSITION

QIROX competes in the Saudi custom software market against:
- Odoo (ERP generalist)
- Zoho (CRM + ERP)
- Local web agencies (fragmented, non-SaaS)
- Freelancer platforms

**QIROX's differentiators (current):**
- Arabic-first UI/UX
- End-to-end delivery (build + host + manage)
- Transparent client portal
- AI-integrated tooling
- Strong visual brand identity

**Where QIROX falls short:**
- No mobile app (web only)
- No WhatsApp integration (critical in KSA)
- No Apple/Google Wallet
- No events capability
- CRM is far behind Zoho/HubSpot
- Support system is far behind Zendesk/Freshdesk

---

*End of Master Analysis. See QIROX_PRODUCT_BLUEPRINT.md for V5 design.*
