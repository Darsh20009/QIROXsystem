# QIROX Enterprise OS — Master Implementation Blueprint
## Sprint 005

**Classification:** Master Architecture Document  
**Type:** Documentation Only — Zero production changes  
**Date:** 2026-07-11  
**Status:** Authoritative implementation plan for all remaining sprints  
**Basis:** Full audit of 166 pages, 632+ API endpoints, 19 MongoDB model files, 3 domain modules, all existing docs

---

## Platform Identity

**QIROX is not SaaS.** It is the complete internal operating system of QIROX Studio — a digital systems factory serving Arabic-speaking markets. The platform is the company's digital headquarters: every employee action, every client interaction, every financial transaction, and every strategic decision flows through it and is measured by it.

**Three constituencies served simultaneously:**
- **Internal teams** — complete digital workplace for every department
- **Clients** — a transparent, premium client experience
- **Leadership** — real-time visibility into the entire organisation

**Current scale (audited 2026-07-11):**
- 166 frontend pages · 632+ API endpoints · 19 MongoDB model files
- 11 roles · 3 server domain modules · 65+ QAdmin pages
- Stack: React 18 + Vite + Express 5 + MongoDB + Capacitor (iOS/Android)

---

## Audit Summary — What Exists

| System | Status | Key Files |
|---|---|---|
| Client Portal | ✅ Implemented | Dashboard.tsx, ProjectWorkspace.tsx, ClientInvoices.tsx, ClientWallet.tsx, SupportTickets.tsx, ClientContracts.tsx, ClientLoyalty.tsx, ClientReferral.tsx, ClientQMeet.tsx |
| Employee Portal | ✅ Implemented | EmployeeHub.tsx, EmployeeRoleDashboard.tsx, EmployeeCRM.tsx, EmployeeWhatsappCRM.tsx, EmployeeMail.tsx, EmployeeMyFinance.tsx |
| QAdmin | ✅ Implemented | ~65 Admin*.tsx pages, full CRUD for all entities |
| CRM V1 | ✅ Implemented | server/domains/crm/, EmployeeCRM.tsx, EmployeeLeadsData.tsx |
| Finance | ✅ Implemented | AdminFinance.tsx, AdminInvoices.tsx, AdminWallet.tsx, AdminInstallments.tsx, AdminPayroll.tsx |
| Orders | ✅ Implemented | AdminOrders.tsx, AdminKanban.tsx, Checkout.tsx, OrderFlow.tsx |
| Projects | ✅ Implemented | AdminProjects.tsx, ProjectWorkspace.tsx, ProjectDetails.tsx |
| Notifications | ✅ Implemented | server/push.ts, NotificationBell.tsx, WebSocket events |
| Mail | ✅ Implemented | server/domains/mail/, EmployeeMail.tsx, AdminMailAccounts.tsx |
| AI Platform | ✅ Implemented | server/ai.ts, QiroxStudio.tsx, AdminAISessions.tsx, AdminKimiAI.tsx |
| QMeet (Video) | ✅ Implemented | server/qmeet.ts, AdminQMeet.tsx, MeetingRoom.tsx, ClientQMeet.tsx |
| Email Marketing | ✅ Implemented | server/email-marketing.ts, AdminEmailMarketing.tsx |
| Attendance | ✅ Partial | AdminAttendance.tsx (manual, no QR) |
| Contracts | ✅ Partial | AdminContracts.tsx, ClientContracts.tsx (manual creation, no builder) |
| Investors | ✅ Partial | AdminInvestors.tsx, InvestorPortal.tsx (basic) |
| SEO | ✅ Implemented | server/config/seo.ts, use-seo.ts, sitemap.xml |
| Pixel Tracking | ✅ Implemented | PixelTracking.tsx (Meta, TikTok, Snap, GA4, GTM) |
| Deployment Cloud | ✅ Implemented | server/deployment-cloud.ts, DeploymentCloud.tsx |
| Sandbox IDE | ✅ Implemented | server/sandbox-routes.ts, SystemBuilder.tsx |
| Customer Journey V2 | 🔒 Flagged Off | client/src/features/customer-journey/ (Sprint 003) |
| Dashboard V2 | 🔒 Flagged Off | client/src/features/customer-journey/dashboard/ (Sprint 003) |

## What Is Missing

| System | Gap |
|---|---|
| Executive Dashboard | No unified leadership view; KPIs scattered across 65+ admin pages |
| Company KPIs / OKRs | No framework; exists only in docs/ENTERPRISE-OS-VISION.md |
| Brand Identity Center | Documented in docs/BRAND_IDENTITY.md but no UI |
| Company Wiki | No wiki system |
| Knowledge Base / SOP | No structured knowledge management |
| Internal Announcements | No broadcast/announcement system for employees |
| Company Calendar | No shared calendar; QMeet meetings are isolated |
| Asset & Equipment Tracking | No physical asset management |
| Internal Chat | CSChat is client-support only; no employee-to-employee chat |
| Meeting Center | QMeet is video only; no meeting notes, agendas, action items |
| Document Center | Uploads exist but no organised document management |
| QR Employee Identity | No QR cards |
| QR Attendance | AdminAttendance.tsx is manual |
| QR Event Check-in | No event ticketing or check-in system |
| Apple Wallet Cards | No Wallet pass generation |
| WhatsApp Web Gateway | wa.me links only; no gateway or automation engine |
| Proposal Builder | AdminQuotations.tsx is functional but not a visual builder |
| Contract Builder | AdminContracts.tsx is manual; no template engine |
| Investor Presentation Center | InvestorPortal.tsx is basic; no formatted presentation layer |
| CRM V2 | CRM V1 exists; V2 with Customer Timeline is missing |
| Media Library | Uploads stored in /uploads but no organised library UI |
| HR Module (complete) | Payroll + Attendance exist; performance, onboarding, org chart missing |
| Sales Manager Dashboard | AdminSalesReports.tsx exists but no pipeline-centric view |

---

## Department Specifications

---

### Department 01 — Executive Management

**Purpose:** Strategic command centre. Provides leadership with a single real-time view of the entire company without requiring them to visit multiple dashboards.

**Users:** CEO, CTO, CFO, COO, board observers (read-only)

**Main Features:**
- Executive Command Centre — live KPIs from all 22 departments on one screen
- OKR Tracker — company → department → individual cascading objectives
- Board Report Generator — monthly/quarterly PDF auto-compiled from live data
- Risk Register — live risk log with severity, owner, mitigation status, auto-escalation
- Decision Log — major decisions with rationale and outcome tracking
- Company Scorecard — weighted health score: Financials, Delivery, People, Clients, Growth
- Approval Gateway — centralized cross-departmental approval queue
- Executive Calendar — board meetings, client QBRs, department reviews

**Pages:**
- `/admin/executive` — Executive Command Centre (new)
- `/admin/executive/okr` — OKR management (new)
- `/admin/executive/board-report` — Board report generator (new)
- `/admin/executive/risk-register` — Risk register (new)
- `/admin/executive/decisions` — Decision log (new)
- `/admin/executive/approvals` — Approval gateway (new)

**Database Impact:**
- New MongoDB collection: `executive_okrs` (objectives, key results, owners, progress)
- New MongoDB collection: `risk_register` (risks, severity, owner, mitigation, status)
- New MongoDB collection: `decision_log` (title, context, decision, owner, outcome)
- No changes to existing collections

**Dependencies:** All 22 other departments (read aggregation); Finance (P&L); HR (headcount)

**Future APIs:**
- `GET /api/executive/kpi-snapshot` — real-time KPI aggregation across all departments
- `GET /api/executive/okr` — OKR tree
- `PATCH /api/executive/okr/:id` — update OKR progress
- `GET /api/executive/board-report/:period` — generate board pack PDF
- `POST /api/executive/risk-register` — log new risk
- `GET /api/executive/approvals` — pending approvals queue

**Security:** Role: `admin` only. All endpoints behind `requireAdmin` middleware.

**Permissions:** Read-only for board observers (`investor` role with `executive_view` flag). Write for `admin` only.

**Feature Flag:** `FEATURE_EXECUTIVE_DASHBOARD=false`

**Migration Strategy:** Additive only. Aggregates from existing collections. No schema changes to existing data.

**Estimated Complexity:** High (aggregation engine, real-time KPI computation)

**Priority:** P1 — Needed for leadership visibility before scale

---

### Department 02 — Operations

**Purpose:** Day-to-day workflow management. The engine room — orders, projects, Kanban, SLA, and delivery pipeline.

**Users:** Manager, Developer, Designer, Support, Admin

**Main Features (existing):**
- Order lifecycle management — AdminOrders.tsx (✅ exists)
- Kanban project board — AdminKanban.tsx (✅ exists) — stages: New → Under Study → Pending Payment → In Progress → Testing → Review → Delivery → Closed
- SLA management — AdminSLA.tsx (✅ exists)
- Shipments — AdminShipments.tsx, AdminShipping.tsx (✅ exists)
- System map — AdminSystemMap.tsx (✅ exists)
- Modification requests — AdminModRequests.tsx (✅ exists)
- Promotions — AdminPromotions.tsx (✅ exists)

**Main Features (missing):**
- Meeting Center — agendas, notes, action items attached to projects
- Document Center — structured file management per project
- Internal Announcements — broadcast to all/specific teams
- Company Calendar — shared calendar with all team events

**Pages (new):**
- `/admin/operations/calendar` — Company Calendar (new)
- `/admin/operations/announcements` — Internal Announcements (new)
- `/admin/operations/documents` — Document Center (new)
- `/admin/operations/meetings` — Meeting Center (agendas + notes, separate from QMeet rooms)

**Database Impact:**
- New collection: `internal_announcements` (title, body, audience, publishedAt, readBy[])
- New collection: `company_calendar_events` (title, type, start, end, attendees, linkedProjectId)
- New collection: `meeting_records` (agenda, notes, actionItems, linkedQMeetId)
- New collection: `document_library` (name, category, fileUrl, projectId, access, version)

**Dependencies:** Projects, QMeet, HR, Notifications

**Future APIs:**
- `POST /api/operations/announcements` — publish announcement
- `GET /api/operations/announcements` — list (filtered by role/team)
- `POST /api/operations/calendar` — create calendar event
- `GET /api/operations/calendar?from=&to=` — calendar range query
- `POST /api/operations/meetings` — create meeting record
- `GET /api/operations/documents` — list documents with filtering

**Security:** Announcements write: `admin`, `manager`. Read: all internal roles.

**Feature Flag:** `FEATURE_MEETING_CENTER=false`, `FEATURE_DOCUMENT_CENTER=false`, `FEATURE_COMPANY_CALENDAR=false`

**Estimated Complexity:** Medium

**Priority:** P2

---

### Department 03 — Sales

**Purpose:** Pipeline management from first contact to signed contract. Connects CRM to Finance to close deals faster.

**Users:** Sales, Sales Manager, Manager, Admin

**Main Features (existing):**
- Sales reports — AdminSalesReports.tsx (✅ exists)
- Subscriptions — AdminSubscriptionPlans.tsx, AdminAddonSubscriptions.tsx (✅ exists)
- Consultation tracking — AdminConsultation.tsx (✅ exists)
- Abandoned carts — AdminAbandonedCarts.tsx (✅ exists)
- Switch reminders — AdminSwitchReminders.tsx, SwitchReminder.tsx (✅ exists)

**Main Features (missing):**
- Sales Pipeline Dashboard — visual funnel from lead → qualified → proposal → negotiation → won/lost
- Proposal Builder — visual, branded proposal creation tool (currently AdminQuotations is functional but not a builder)
- Contract Builder — template-based contract creation with variable substitution
- Win/Loss analysis — why deals are won or lost, by sector/tier/sales rep
- Commission tracking — per-rep commission calculation linked to payroll

**Pages (new):**
- `/admin/sales/pipeline` — Sales pipeline dashboard (new)
- `/admin/sales/proposal-builder` — Visual proposal builder (new)
- `/admin/sales/contract-builder` — Contract template builder (new)
- `/admin/sales/win-loss` — Win/loss analysis (new)
- `/admin/sales/commissions` — Commission tracker (new)

**Database Impact:**
- New collection: `proposal_templates` (sections[], variables[], branding, createdBy)
- New collection: `contract_templates` (clauses[], variables[], signatureFields[])
- Extend `QuotationModel`: add `proposalBuilderData` field (nullable, additive)
- Extend `OrderModel`: add `winLossReason`, `lostToCompetitor` (nullable, additive)

**Dependencies:** CRM, Finance, HR (for commissions), Notifications

**Future APIs:**
- `GET /api/sales/pipeline` — funnel metrics by stage
- `POST /api/sales/proposals/build` — generate proposal from template + data
- `GET /api/sales/proposals/:id/preview` — rendered HTML/PDF preview
- `POST /api/sales/contracts/build` — generate contract from template
- `GET /api/sales/win-loss?period=` — analysis data
- `GET /api/sales/commissions/:employeeId` — commission earned

**Feature Flag:** `FEATURE_PROPOSAL_BUILDER=false`, `FEATURE_CONTRACT_BUILDER=false`

**Estimated Complexity:** High (Proposal Builder is a rich-text + variable editor; Contract Builder requires PDF generation)

**Priority:** P1 — Direct revenue impact

---

### Department 04 — CRM

**Purpose:** Complete client relationship management. From cold lead to loyal client. V1 exists; V2 adds Customer Timeline and enhanced automation.

**Users:** Sales, Sales Manager, Support, Manager, Admin

**Main Features (existing — CRM V1):**
- Lead pipeline — `/api/crm/leads` CRUD (✅ exists in server/domains/crm/)
- Lead activity log — `/api/crm/leads/:id/activity` (✅ exists)
- CRM stats — `/api/crm/stats` (✅ exists)
- Lead import — `/api/crm/leads/import` (✅ exists)
- Employee CRM view — EmployeeCRM.tsx, EmployeeLeadsData.tsx (✅ exists)
- WhatsApp CRM templates — EmployeeWhatsappCRM.tsx (✅ exists, 6 templates with {name} substitution)

**Main Features (missing — CRM V2):**
- Customer Timeline — chronological history of every interaction: leads, orders, quotations, invoices, meetings, support tickets, reviews — all in one view per client
- WhatsApp Web Gateway — QR-code login to employee WhatsApp Web, message routing and logging (not automation; manual with logging)
- Manual WhatsApp Automation — trigger pre-approved message templates from CRM actions (not a bot; employee-initiated)
- Internal CRM V2 — custom pipeline stages per deal type, multi-contact companies, deal value tracking
- Segment Manager — group clients by sector, tier, spend, lifecycle stage for targeted campaigns
- Client Health Score — computed score based on payment history, NPS, last interaction, open tickets

**Pages (new):**
- `/employee/crm/v2` — CRM V2 pipeline view (new)
- `/employee/crm/v2/customer/:id/timeline` — Customer Timeline (new)
- `/employee/crm/v2/companies` — Company/account management (new)
- `/employee/crm/v2/segments` — Segment manager (new)
- `/employee/whatsapp-gateway` — WhatsApp Web Gateway (new)
- `/admin/crm/health-scores` — Client health score dashboard (new)

**Database Impact:**
- New collection: `customer_timeline_events` (clientId, type, title, data, timestamp, linkedId, linkedModel)
- New collection: `crm_companies` (name, sector, contacts[], dealValue, assignedTo)
- New collection: `crm_segments` (name, criteria[], clientIds[], lastComputedAt)
- Extend `CRMLeadModel`: add `companyId`, `dealValue`, `pipeline_v2_stage` (nullable, additive)

**Dependencies:** Orders, Projects, Finance (invoices), QMeet, Support, Reviews, Notifications

**Future APIs:**
- `GET /api/crm/v2/timeline/:clientId` — full customer timeline
- `POST /api/crm/v2/timeline/:clientId/event` — manually log interaction
- `GET /api/crm/v2/companies` — company list
- `POST /api/crm/v2/companies` — create company
- `GET /api/crm/v2/segments` — segment list
- `POST /api/crm/v2/segments/compute` — recompute segment memberships
- `GET /api/crm/v2/health-score/:clientId` — computed health score
- `POST /api/crm/whatsapp/send` — send pre-approved template (employee-initiated)

**Security:** CRM V2 write: `sales`, `sales_manager`, `manager`, `admin`. Health scores: read-only for `sales`. WhatsApp gateway: `sales`, `support` roles.

**Feature Flag:** `FEATURE_CRM_V2=false`, `FEATURE_WHATSAPP_GATEWAY=false`

**Estimated Complexity:** High (Customer Timeline aggregates across 8 models; WhatsApp Gateway requires browser session or API)

**Priority:** P1 — Core sales infrastructure

---

### Department 05 — Customer Success

**Purpose:** Ensure every client succeeds after purchase. Proactive management of project health, satisfaction, and retention.

**Users:** Support, Manager, Admin

**Main Features (existing):**
- Support tickets — SupportTickets.tsx, AdminSupportTickets.tsx (✅ exists)
- SLA management — AdminSLA.tsx (✅ exists)
- Client communication — CSChat.tsx + ProjectComments.tsx (✅ exists)
- Reviews / NPS — AdminReviews.tsx, `/api/orders/:orderId/review` (✅ exists)
- Loyalty — AdminLoyalty.tsx, ClientLoyalty.tsx (✅ exists)
- Referral — AdminReferrals.tsx, ClientReferral.tsx (✅ exists)
- Client onboarding — ClientOnboarding.tsx (✅ exists, not systematically triggered)
- Customer Journey V2 — Sprint 003 architecture (🔒 flagged off)

**Main Features (missing):**
- Customer Dashboard V2 — Sprint 003 built the architecture; needs production wiring
- Client Progress Center — designed in Sprint 004; needs implementation
- Proactive health alerts — auto-flag clients with declining health scores, overdue invoices, no recent login
- Churn risk model — identify clients likely to not renew or reorder
- QBR (Quarterly Business Review) generator — auto-compiled review of client's year with QIROX

**Pages (new/extending):**
- `/dashboard-v2` — Customer Dashboard V2 (🔒 flagged off, exists in Sprint 003)
- `/project/:id/client-view` — Client Progress Center (Sprint 004 design)
- `/admin/customer-success/health` — Customer health dashboard (new)
- `/admin/customer-success/churn-risk` — Churn risk alerts (new)
- `/admin/customer-success/qbr/:clientId` — QBR generator (new)

**Database Impact:**
- New collection: `client_health_scores` (clientId, score, components{}, computedAt, trend)
- New collection: `churn_risk_flags` (clientId, riskLevel, reasons[], flaggedAt, resolvedAt)
- Extend `UserModel`: add `lastLoginAt` tracking (additive)

**Feature Flag:** `FEATURE_CUSTOMER_JOURNEY_V2=false` (Sprint 003), `FEATURE_DASHBOARD_V2=false` (Sprint 003), `FEATURE_CUSTOMER_SUCCESS_V2=false`

**Estimated Complexity:** Medium (health score is a formula; V2 dashboard is Sprint 003 + Sprint 004 wiring)

**Priority:** P1 — Direct client retention impact

---

### Department 06 — Project Management

**Purpose:** Complete project lifecycle from kickoff to delivery. Internal view for employees; filtered view for clients.

**Users:** Developer, Designer, Manager, Admin (internal). Client (filtered view).

**Main Features (existing):**
- Kanban board — AdminKanban.tsx (✅ exists)
- Project details — AdminProjectData.tsx, AdminProjectFeatures.tsx (✅ exists)
- Project workspace — ProjectWorkspace.tsx (✅ exists, employee + client mixed)
- Modification requests — AdminModRequests.tsx, AdminModConfig.tsx (✅ exists)
- Sandbox IDE — SystemBuilder.tsx, server/sandbox-routes.ts (✅ exists)
- Deployment Cloud — DeploymentCloud.tsx, server/deployment-cloud.ts (✅ exists)
- QMeet integration — meetings linked to projects (✅ exists)

**Main Features (missing):**
- Meeting Center — structured meeting records with agendas, notes, and action items linked to projects
- Document Center — version-controlled project document library
- Client Progress Center — client-facing filtered view (Sprint 004 design)
- Project templates — pre-defined task lists and milestone structures per system type
- Time tracking — hours logged per task per employee (links to payroll)

**Pages (new):**
- `/admin/projects/:id/meetings` — meeting records for project (new)
- `/admin/projects/:id/documents` — document library for project (new)
- `/admin/projects/templates` — project templates (new)
- `/admin/projects/:id/time-log` — time tracking (new)
- `/project/:id` — Client Progress Center (Sprint 004 design)

**Database Impact:**
- New collection: `project_time_logs` (projectId, employeeId, taskId, hours, date, notes)
- New collection: `project_templates` (name, sector, tasks[], milestones[], estimatedWeeks)
- Extend `ProjectModel`: add `templateId`, `clientProgressEnabled` (additive, nullable)

**Future APIs:**
- `GET /api/projects/:id/time-logs` — time tracking data
- `POST /api/projects/:id/time-logs` — log hours
- `GET /api/v2/projects/:id/client-view` — client-filtered view (Sprint 004 API)
- `GET /api/v2/projects/:id/updates` — client-visible milestone updates
- `POST /api/projects/templates` — create project template

**Feature Flag:** `FEATURE_TIME_TRACKING=false`, `FEATURE_PROJECT_TEMPLATES=false`

**Estimated Complexity:** Medium

**Priority:** P2

---

### Department 07 — Finance

**Purpose:** Complete financial management. Revenue tracking, expense control, payroll, wallet, invoicing, and profitability.

**Users:** Accountant, Manager, Admin (full). Client (own invoices/wallet only).

**Main Features (existing):**
- Finance dashboard — AdminFinance.tsx (✅ exists)
- Invoice management — AdminInvoices.tsx, ClientInvoices.tsx (✅ exists)
- Wallet / Qirox Pay — AdminWallet.tsx, ClientWallet.tsx (✅ exists)
- Installment plans — AdminInstallments.tsx, ClientInstallments.tsx (✅ exists)
- PayPal integration — server/paypal.ts (✅ exists, SAR→USD at 3.75 rate)
- Bank settings — AdminBankSettings.tsx (✅ exists)
- Discount codes — AdminDiscountCodes.tsx (✅ exists)
- Loyalty system — AdminLoyalty.tsx (✅ exists)
- Referral system — AdminReferrals.tsx (✅ exists)
- Payroll — AdminPayroll.tsx (✅ exists)
- Profit report — AdminProfitReport.tsx (✅ exists)
- Receipts — AdminReceipts.tsx (✅ exists)

**Main Features (missing):**
- Company KPIs — revenue run rate, MRR, ARR, CAC, LTV, churn, gross margin, cash runway
- Milestone-based payment model — invoice linked to project milestone, not flat order (Sprint 004 requirement)
- Multi-currency proper support — SAR→USD 3.75 hardcode needs to be configurable
- Expense tracking — employee expenses, vendor payments, operational costs
- Cash flow forecast — 30/60/90-day forward projection
- Tax / VAT automation — 15% KSA VAT auto-application with ZATCA-ready invoice format

**Pages (new):**
- `/admin/finance/kpis` — Company financial KPIs (new)
- `/admin/finance/expenses` — Expense tracking (new)
- `/admin/finance/cash-flow` — Cash flow forecast (new)
- `/admin/finance/tax` — VAT and tax management (new)

**Database Impact:**
- New collection: `company_expenses` (category, amount, currency, vendor, date, approvedBy)
- Extend `InvoiceModel`: add `milestoneId`, `vatAmount`, `zatcaRef` (additive, nullable)
- Extend system settings: add `exchangeRates` map (configurable, replaces hardcode)

**Future APIs:**
- `GET /api/finance/kpis` — MRR, ARR, CAC, LTV, churn
- `POST /api/finance/expenses` — log expense
- `GET /api/finance/cash-flow?days=90` — forecast
- `GET /api/finance/tax-report?period=` — VAT summary

**Feature Flag:** `FEATURE_EXPENSE_TRACKING=false`, `FEATURE_MILESTONE_PAYMENTS=false`

**Estimated Complexity:** Medium-High

**Priority:** P1 (KPIs), P2 (expense/tax)

---

### Department 08 — Human Resources

**Purpose:** Complete employee lifecycle — hiring, onboarding, performance, payroll, attendance, offboarding.

**Users:** Admin, Manager (full). Employee (own data only).

**Main Features (existing):**
- Attendance tracking — AdminAttendance.tsx (✅ exists, manual)
- Payroll — AdminPayroll.tsx (✅ exists)
- Employee management — AdminEmployees.tsx (✅ exists)
- Employee roles — AdminRoles.tsx (✅ exists)
- Phone verifications — AdminPhoneVerifications.tsx (✅ exists)
- Employee finance view — EmployeeMyFinance.tsx (✅ exists)
- Data requests — AdminDataRequests.tsx (✅ exists)

**Main Features (missing):**
- QR Attendance — employee scans QR code at office entrance; auto-logs clock-in/out with location
- QR Employee Identity Card — digital identity card with QR code linking to employee profile; Apple Wallet / Google Wallet pass
- Apple Wallet Employee Cards — PKPass generation with employee name, photo, role, and QR code
- Performance reviews — structured quarterly review with 360-degree feedback
- Org chart — visual company hierarchy
- Employee onboarding workflow — checklist-based onboarding tasks per role
- Leave management — annual leave, sick leave, public holiday tracking
- Employee handbook / policies — linked to Knowledge Base

**Pages (new):**
- `/admin/hr/attendance-qr` — QR attendance management (new)
- `/admin/hr/performance` — Performance review management (new)
- `/admin/hr/org-chart` — Visual org chart (new)
- `/admin/hr/onboarding` — Employee onboarding workflows (new)
- `/admin/hr/leaves` — Leave management (new)
- `/employee/my-id` — Digital employee ID with QR (new)
- `/employee/my-attendance` — Personal attendance view (new)

**Database Impact:**
- New collection: `attendance_logs_qr` (employeeId, clockIn, clockOut, locationLat, locationLng, qrSessionId)
- New collection: `performance_reviews` (employeeId, reviewerId, period, scores{}, comments, status)
- New collection: `leave_requests` (employeeId, type, startDate, endDate, status, approvedBy)
- New collection: `onboarding_checklists` (employeeId, role, tasks[], completedAt)
- Extend `UserModel` (employee): add `appleWalletPassUrl`, `qrIdentityCode` (additive, nullable)

**Future APIs:**
- `POST /api/hr/attendance/qr-checkin` — process QR attendance scan
- `GET /api/hr/attendance/qr-session` — generate daily QR session code
- `GET /api/hr/employee/:id/wallet-pass` — generate Apple Wallet PKPass
- `POST /api/hr/performance-reviews` — create review
- `GET /api/hr/org-chart` — hierarchy data
- `POST /api/hr/leaves` — submit leave request
- `GET /api/hr/leaves/:employeeId` — leave balance and history

**Security:** Attendance QR codes are time-limited (valid 60 seconds, regenerated every 30 seconds). PKPass signed with Apple certificate. Performance reviews: visible to employee + reviewer + manager + admin only.

**Feature Flag:** `FEATURE_QR_ATTENDANCE=false`, `FEATURE_EMPLOYEE_WALLET_CARDS=false`, `FEATURE_PERFORMANCE_REVIEWS=false`

**Estimated Complexity:** High (Apple Wallet PKPass requires Apple Developer certificate + p12 signing)

**Priority:** P2 (QR attendance P1 for operational efficiency)

---

### Department 09 — Marketing

**Purpose:** Demand generation — content, campaigns, SEO, ads, and lead capture.

**Users:** Admin, Manager (full). Sales (lead access).

**Main Features (existing):**
- Email marketing — server/email-marketing.ts, AdminEmailMarketing.tsx (✅ exists)
- Pixel tracking — Meta, TikTok, Snap, GA4, GTM via PixelTracking.tsx (✅ exists)
- News/blog — AdminNews.tsx (✅ exists)
- Partners — AdminPartners.tsx (✅ exists)
- Jobs/careers — AdminJobs.tsx, JoinUs.tsx (✅ exists)
- Abandoned cart recovery — AdminAbandonedCarts.tsx (✅ exists)
- Consultation tracking — AdminConsultation.tsx (✅ exists)
- SEO — use-seo hook, server/config/seo.ts, sitemap.xml (✅ exists)

**Main Features (missing):**
- Marketing campaign tracker — link ad spend to lead acquisition to revenue (CAC per channel)
- Social media post composer — write + schedule posts from the OS (using WhatsApp gateway for WhatsApp broadcasts)
- UTM link builder — generate tracked links for campaigns
- Landing page builder — quick landing pages for campaigns without dev involvement
- Lead scoring — auto-score inbound leads based on sector, budget, engagement

**Pages (new):**
- `/admin/marketing/campaigns` — Campaign tracker (new)
- `/admin/marketing/social` — Social post composer (new)
- `/admin/marketing/utm` — UTM link builder (new)
- `/admin/marketing/lead-scoring` — Lead scoring config (new)

**Database Impact:**
- New collection: `marketing_campaigns` (name, channel, budget, startDate, endDate, utmParams, leadsGenerated, revenue)
- New collection: `utm_links` (campaign, source, medium, content, shortCode, clicks)
- Extend `CRMLeadModel`: add `utmSource`, `utmMedium`, `leadScore`, `leadSource` (additive, nullable)

**Feature Flag:** `FEATURE_CAMPAIGN_TRACKER=false`, `FEATURE_LEAD_SCORING=false`

**Estimated Complexity:** Medium

**Priority:** P2

---

### Department 10 — Brand Center

**Purpose:** Single source of truth for all brand assets, guidelines, and identity materials. Every employee and contractor uses approved assets.

**Users:** Admin, Designer, Manager (full). All internal roles (read-only).

**Main Features (existing):**
- Brand documentation — docs/BRAND_IDENTITY.md, docs/BRAND_BLUEPRINT.md, docs/DESIGN_SYSTEM.md (✅ exists in docs/, no UI)

**Main Features (missing — entirely):**
- Brand Identity Center UI — accessible in-platform version of brand guidelines
- Logo library — official logos in all variants and formats (SVG, PNG, dark, light, monochrome)
- Color palette tool — brand colors with HEX/RGB/CMYK + accessibility checker
- Typography system — approved fonts, sizes, usage rules
- Asset download portal — employees download approved assets without asking design
- Brand usage checker — flag off-brand usage in designs uploaded to the platform
- Presentation templates — approved slide deck templates linked to Company Presentation department

**Pages (new):**
- `/admin/brand` — Brand Center dashboard (new)
- `/admin/brand/logos` — Logo library (new)
- `/admin/brand/colors` — Color palette (new)
- `/admin/brand/typography` — Typography system (new)
- `/admin/brand/assets` — Asset download portal (new)
- `/admin/brand/templates` — Presentation templates (new)

**Database Impact:**
- New collection: `brand_assets` (type, name, fileUrl, variants[], tags[], uploadedBy, version)
- New collection: `brand_guidelines` (section, content, lastUpdatedBy)

**Future APIs:**
- `GET /api/brand/assets` — list assets with filtering
- `POST /api/brand/assets` — upload asset
- `GET /api/brand/guidelines` — get all guideline sections
- `PUT /api/brand/guidelines/:section` — update section

**Feature Flag:** `FEATURE_BRAND_CENTER=false`

**Estimated Complexity:** Medium

**Priority:** P2

---

### Department 11 — Company Presentation

**Purpose:** Professional materials for pitching, proposals, and representing QIROX to external audiences — clients, partners, investors.

**Users:** Admin, Manager, Sales (full). Designer (create/edit).

**Main Features (existing):**
- Basic investor portal — InvestorPortal.tsx (✅ exists, basic)
- Demos page — EmployeeDemos.tsx (✅ exists)

**Main Features (missing):**
- Investor Presentation Center — structured, branded investor decks with live financial data embedded
- Client Pitch Builder — auto-generate tailored pitch decks using client's sector + budget data
- Case Studies — published success stories per project type/sector
- Portfolio showcase — curated project portfolio with screenshots, tech stack, outcomes
- Awards & credentials display — certifications, accolades, press mentions

**Pages (new):**
- `/admin/presentation/investor` — Investor presentation builder (new)
- `/admin/presentation/pitch-builder` — Client pitch builder (new)
- `/admin/presentation/case-studies` — Case studies manager (new)
- `/admin/presentation/portfolio` — Portfolio manager (new)
- `/investor` — Investor portal V2 (extends existing InvestorPortal.tsx)

**Database Impact:**
- New collection: `investor_presentations` (title, slides[], liveDataConfig{}, sharedWith[], accessCode)
- New collection: `case_studies` (title, sector, challenge, solution, outcome, metrics{}, images[])
- New collection: `portfolio_items` (title, sector, techStack[], screenshots[], liveUrl, completedAt)

**Feature Flag:** `FEATURE_INVESTOR_CENTER=false`, `FEATURE_PITCH_BUILDER=false`

**Estimated Complexity:** High (live data embeds in presentations; PDF generation)

**Priority:** P3

---

### Department 12 — Events Platform

**Purpose:** Manage physical and virtual events — client conferences, partner meetups, internal team days, product launches.

**Users:** Admin, Manager (organiser). All roles (attendee). Client (invited attendee).

**Main Features (existing):**
- QMeet video conferencing — server/qmeet.ts (✅ exists, virtual meetings)
- Meeting room — MeetingRoom.tsx (✅ exists)
- QMeet admin — AdminQMeet.tsx (✅ exists)
- Client QMeet — ClientQMeet.tsx (✅ exists)

**Main Features (missing):**
- Physical event management — create events with venue, capacity, schedule
- QR Event Check-in — attendee scans QR code at event entrance; auto-logs attendance
- Secure Event Tickets — unique QR-code tickets generated per attendee, one-time use
- Customer Event Invitations — branded invitation emails/WhatsApp messages with personalised ticket
- Event analytics — attendance rate, no-shows, engagement scores
- Event feedback collection — post-event survey
- Waitlist management — for capacity-limited events

**Pages (new):**
- `/admin/events` — Events dashboard (new)
- `/admin/events/create` — Event creation wizard (new)
- `/admin/events/:id/check-in` — QR check-in station (new, designed for tablet/kiosk)
- `/admin/events/:id/tickets` — Ticket management (new)
- `/admin/events/:id/analytics` — Event analytics (new)
- `/events/:id` — Public event page with registration (new)
- `/events/:id/ticket/:code` — Digital ticket view (new)

**Database Impact:**
- New collection: `events` (title, type, venue, capacity, startAt, endAt, organiser, status)
- New collection: `event_tickets` (eventId, attendeeId, code, qrHash, issuedAt, usedAt, isUsed)
- New collection: `event_registrations` (eventId, clientId, name, email, phone, status, registeredAt)

**Future APIs:**
- `POST /api/events` — create event
- `GET /api/events/:id/tickets/generate` — generate tickets for all registered attendees
- `POST /api/events/:id/check-in` — process QR check-in scan
- `GET /api/events/:id/analytics` — attendance data
- `POST /api/events/:id/invite` — send invitations (email + WhatsApp)

**Security:** QR ticket codes are single-use SHA-256 hashes. Check-in endpoint verifies hash, marks as used, rejects reuse. Rate-limited to prevent brute-force.

**Feature Flag:** `FEATURE_EVENTS_PLATFORM=false`, `FEATURE_EVENT_CHECKIN_QR=false`

**Estimated Complexity:** High

**Priority:** P2

---

### Department 13 — Internal WhatsApp Platform

**Purpose:** Structured, logged WhatsApp communication for client and internal use. Not a bot — human-operated with templates and logging.

**Users:** Sales, Support, Manager, Admin

**Main Features (existing):**
- WhatsApp CRM templates — EmployeeWhatsappCRM.tsx (✅ exists, 6 templates, {name} substitution, wa.me links)

**Main Features (missing):**
- WhatsApp Web Gateway — QR-login bridge to WhatsApp Web session, with message routing to client records and CRM timeline logging
- Template Library — expanded library of approved templates (onboarding, payment reminder, delivery notification, review request, referral invitation) per trigger event
- Broadcast Manager — send approved templates to client segments
- Message logging — every outbound WhatsApp message logged to Customer Timeline
- Opt-out management — client opt-out tracking and compliance
- Two-way message threading — capture inbound replies linked to client record

**Pages (new):**
- `/employee/whatsapp-gateway` — WhatsApp Web Gateway (QR login + session) (new)
- `/admin/whatsapp/templates` — Template library management (new)
- `/admin/whatsapp/broadcasts` — Broadcast manager (new)
- `/admin/whatsapp/opt-outs` — Opt-out management (new)

**Database Impact:**
- New collection: `whatsapp_templates` (name, category, body, variables[], approvedBy)
- New collection: `whatsapp_messages` (clientId, employeeId, direction, templateName, body, sentAt, status)
- New collection: `whatsapp_opt_outs` (clientId, optedOutAt, reason)
- New collection: `whatsapp_broadcasts` (templateId, segmentId, sentCount, status, scheduledAt)

**Future APIs:**
- `GET /api/whatsapp/templates` — list approved templates
- `POST /api/whatsapp/send` — send template to client (employee-initiated)
- `POST /api/whatsapp/broadcast` — schedule broadcast to segment
- `GET /api/whatsapp/messages/:clientId` — message history

**Security:** Gateway uses employee's own WhatsApp credentials — no shared account. All sent messages logged with employeeId and timestamp. No automation without employee trigger.

**Feature Flag:** `FEATURE_WHATSAPP_GATEWAY=false`, `FEATURE_WHATSAPP_BROADCASTS=false`

**Estimated Complexity:** Very High (WhatsApp Web gateway requires session management, browser automation or API access)

**Priority:** P2 (templates exist today; gateway is P3)

---

### Department 14 — Employee Experience

**Purpose:** Make QIROX a great place to work — tools for productivity, recognition, communication, and growth.

**Users:** All internal roles

**Main Features (existing):**
- Gamification / leaderboard — AdminGamification.tsx (✅ exists)
- Employee changelog — EmployeeChangelog.tsx (✅ exists)
- Employee welcome / onboarding — EmployeeWelcome.tsx (✅ exists)
- Employee profile — EmployeeProfile.tsx (✅ exists)
- Employee subscriptions — EmployeeSubscriptions.tsx (✅ exists)
- Role dashboard — EmployeeRoleDashboard.tsx (✅ exists)
- Employee Hub — EmployeeHub.tsx (✅ exists)

**Main Features (missing):**
- Employee Dashboard V2 — redesigned hub with personal KPIs, team performance, today's tasks, upcoming meetings, and announcements
- Internal Chat — employee-to-employee messaging (currently CSChat is client-support only)
- Recognition system — peer recognition, kudos, achievement badges linked to gamification
- Personal development plan — goals, skills, learning resources per employee
- Internal announcements feed — company-wide and team-specific broadcasts
- Company Calendar in employee view — personal + team + company events in one calendar

**Pages (new):**
- `/employee/dashboard-v2` — Employee Dashboard V2 (new)
- `/employee/chat` — Internal employee chat (new)
- `/employee/recognition` — Recognition and kudos (new)
- `/employee/development` — Personal development plan (new)
- `/employee/calendar` — Unified calendar view (new)
- `/employee/announcements` — Announcement feed (new)

**Database Impact:**
- New collection: `employee_chat_messages` (senderId, recipientId, roomId, body, sentAt, readAt)
- New collection: `employee_chat_rooms` (type, participants[], lastMessageAt)
- New collection: `peer_recognition` (fromEmployeeId, toEmployeeId, message, badge, createdAt)
- New collection: `development_plans` (employeeId, goals[], skills[], resources[], updatedAt)

**Feature Flag:** `FEATURE_EMPLOYEE_CHAT=false`, `FEATURE_EMPLOYEE_DASHBOARD_V2=false`

**Estimated Complexity:** Medium (chat is real-time WebSocket — extends existing ws.ts)

**Priority:** P2

---

### Department 15 — Investor Relations

**Purpose:** Transparent, professional relationship with current and prospective investors. Real-time company health, financial reporting, and strategic updates.

**Users:** Admin (full). Investor (read-only, scoped to shared data).

**Main Features (existing):**
- Investor management — AdminInvestors.tsx (✅ exists)
- Investor portal — InvestorPortal.tsx (✅ exists, basic)

**Main Features (missing):**
- Investor Presentation Center — executive-grade, branded presentations with live financial data, growth metrics, and strategic roadmap embedded
- Investor data room — secure document sharing (term sheets, cap table, financials, board minutes)
- Investor update cadence — monthly/quarterly automated update emails with KPI snapshots
- Cap table management — equity distribution, rounds, dilution modelling
- Investor Q&A — structured Q&A log with management responses

**Pages (new):**
- `/admin/investors/data-room` — Secure document data room (new)
- `/admin/investors/cap-table` — Cap table management (new)
- `/admin/investors/updates` — Investor update composer (new)
- `/investor/presentations` — Investor-facing presentation viewer (new)
- `/investor/data-room` — Investor-facing data room (new)

**Database Impact:**
- New collection: `investor_data_room` (name, fileUrl, category, sharedWith[], accessLevel, uploadedAt)
- New collection: `cap_table_entries` (investorId, round, shares, percentage, investedAmount, date)
- New collection: `investor_updates` (period, summary, kpis{}, sentAt, sentTo[])

**Feature Flag:** `FEATURE_INVESTOR_CENTER=false`

**Estimated Complexity:** High (data room requires signed URLs, access logging)

**Priority:** P3

---

### Department 16 — Knowledge Base

**Purpose:** Centralised institutional knowledge. Every process, decision, and lesson is documented and searchable.

**Users:** All internal roles (read). Admin, Manager (write).

**Main Features (missing — entirely):**
- Company Wiki — structured, editable pages (Notion-style) for company knowledge
- Article categories — Processes, How-Tos, Policies, FAQs, Technical references
- Version history — every edit tracked with author and timestamp
- Search — full-text search across all articles
- Article suggestions — employees can suggest corrections or additions
- Linked to SOP department

**Pages (new):**
- `/admin/knowledge` — Knowledge base admin (new)
- `/admin/knowledge/articles/new` — Article editor (new)
- `/employee/knowledge` — Employee knowledge base viewer (new)
- `/employee/knowledge/:slug` — Article view (new)

**Database Impact:**
- New collection: `knowledge_articles` (title, slug, body, category, tags[], author, version, publishedAt, updatedAt, revisions[])
- New collection: `knowledge_categories` (name, slug, parent, order)

**Future APIs:**
- `GET /api/knowledge/articles` — list with filtering/search
- `GET /api/knowledge/articles/:slug` — single article
- `POST /api/knowledge/articles` — create article
- `PUT /api/knowledge/articles/:slug` — update (saves revision)
- `GET /api/knowledge/search?q=` — full-text search

**Feature Flag:** `FEATURE_KNOWLEDGE_BASE=false`

**Estimated Complexity:** Medium

**Priority:** P2

---

### Department 17 — SOP Management

**Purpose:** Standardised Operating Procedures — every repeatable process in the company is documented, versioned, and auditable.

**Users:** Admin, Manager (full). All internal roles (read-only per role).

**Main Features (missing — entirely):**
- SOP library — categorised SOPs per department and role
- Process builder — step-by-step procedure editor with decision branches
- Compliance tracking — employees confirm they have read and understood each SOP
- SOP version control — major versions require re-acknowledgement
- Linked to HR onboarding — new employees auto-assigned relevant SOPs on joining
- SOP effectiveness rating — employees rate SOPs after following them

**Pages (new):**
- `/admin/sop` — SOP library admin (new)
- `/admin/sop/create` — SOP builder (new)
- `/employee/sop` — Employee SOP library (new)
- `/employee/sop/:id` — SOP detail + acknowledgement (new)

**Database Impact:**
- New collection: `sops` (title, department, role[], steps[], version, status, createdBy, updatedAt)
- New collection: `sop_acknowledgements` (sopId, employeeId, version, acknowledgedAt)

**Feature Flag:** `FEATURE_SOP_MANAGEMENT=false`

**Estimated Complexity:** Medium

**Priority:** P2

---

### Department 18 — Company Assets

**Purpose:** Track, manage, and maintain all physical and digital company assets — hardware, software, furniture, vehicles, licenses.

**Users:** Admin, Manager (full). Employee (own assigned assets).

**Main Features (missing — entirely):**
- Asset registry — all company assets catalogued with ID, category, value, condition
- Asset assignment — assign assets to employees; track custody
- Asset tracking — QR code on physical assets; scan to update location/condition
- Maintenance schedules — planned maintenance dates and history
- Depreciation tracking — auto-calculated asset depreciation
- Equipment requests — employees request equipment; manager approves
- Software license management — track SaaS subscriptions, renewal dates, seat counts

**Pages (new):**
- `/admin/assets` — Asset registry (new)
- `/admin/assets/assign` — Asset assignment (new)
- `/admin/assets/maintenance` — Maintenance schedule (new)
- `/admin/assets/licenses` — Software license manager (new)
- `/employee/my-assets` — Employee's assigned assets (new)

**Database Impact:**
- New collection: `company_assets` (name, category, serialNumber, qrCode, assignedTo, value, condition, purchasedAt, warrantyUntil)
- New collection: `asset_maintenance_logs` (assetId, type, date, notes, cost, performedBy)
- New collection: `software_licenses` (name, vendor, seats, renewalDate, cost, assignedTo[])
- New collection: `equipment_requests` (employeeId, assetType, reason, status, requestedAt)

**Feature Flag:** `FEATURE_ASSET_TRACKING=false`

**Estimated Complexity:** Medium

**Priority:** P3

---

### Department 19 — Media Library

**Purpose:** Centralised, organised library of all media assets — images, videos, documents, brand assets — used across the platform.

**Users:** All internal roles (read). Designer, Admin (write).

**Main Features (existing):**
- File uploads — `/uploads/` directory, basic upload endpoints (✅ exists, unorganised)

**Main Features (missing):**
- Organised library UI — browse by category, project, date, file type, tags
- Image optimisation — auto-resize on upload, WebP conversion
- Usage tracking — which pages/projects use which media file
- Duplicate detection — flag identical or visually similar uploads
- Rights management — mark assets as licensed, royalty-free, or proprietary
- Direct use in content — insert from library into news articles, proposals, presentations

**Pages (new):**
- `/admin/media` — Media library (new)
- `/admin/media/upload` — Upload with metadata (new)
- `/admin/media/:id` — Asset detail + usage (new)

**Database Impact:**
- New collection: `media_library` (filename, fileUrl, mimeType, size, category, tags[], projectId, usedIn[], rights, uploadedBy, createdAt)

**Future APIs:**
- `GET /api/media` — list with pagination, filtering
- `POST /api/media/upload` — upload with metadata
- `DELETE /api/media/:id` — delete (checks usedIn before allowing)
- `GET /api/media/:id/usage` — where is this file used

**Feature Flag:** `FEATURE_MEDIA_LIBRARY=false`

**Estimated Complexity:** Medium

**Priority:** P2

---

### Department 20 — Analytics

**Purpose:** Business intelligence across the entire platform. Every department's data visualised, trended, and actionable.

**Users:** Admin (full). Manager (own department). Accountant (financial analytics only).

**Main Features (existing):**
- Admin analytics — AdminAnalytics.tsx (✅ exists, QMeet + employee + contract analytics)
- Sales reports — AdminSalesReports.tsx (✅ exists)
- Profit report — AdminProfitReport.tsx (✅ exists)
- AI sessions — AdminAISessions.tsx (✅ exists)
- Activity log — AdminActivityLog.tsx (✅ exists)

**Main Features (missing):**
- Company KPI dashboard — MRR, ARR, CAC, LTV, NPS, churn, headcount, delivery rate, SLA compliance
- OKR progress tracking — links to Executive Management department
- Department-level analytics — each department's own KPI page
- Funnel analytics — lead → qualified → proposal → won conversion rates
- Cohort analysis — client behaviour by acquisition month
- Real-time platform health — server performance, API response times, error rates

**Pages (new):**
- `/admin/analytics/kpis` — Company KPI dashboard (new)
- `/admin/analytics/funnel` — Sales funnel analytics (new)
- `/admin/analytics/cohorts` — Cohort analysis (new)
- `/admin/analytics/platform` — Platform health metrics (new)

**Future APIs:**
- `GET /api/analytics/kpis?period=` — all company KPIs
- `GET /api/analytics/funnel?period=` — conversion funnel
- `GET /api/analytics/cohorts` — cohort data
- `GET /api/analytics/platform/health` — server/API metrics

**Feature Flag:** `FEATURE_ANALYTICS_V2=false`

**Estimated Complexity:** Medium-High (aggregation queries on large collections need indexing strategy)

**Priority:** P1

---

### Department 21 — AI Platform

**Purpose:** AI capabilities embedded throughout the OS — generation, analysis, automation, and the QIROX Studio AI creation engine.

**Users:** All roles (scoped access per feature). Developer, Designer (full AI Studio access).

**Main Features (existing):**
- Chat / stream / analyse — `/api/ai/message`, `/api/ai/stream`, `/api/ai/analyse` (✅ exists)
- Image generation — `/api/ai/generate-image` via Pollinations.ai Flux model (✅ exists)
- Video generation — `/api/ai/video-proxy` via Pollinations.ai (✅ exists)
- QIROX Studio AI — QiroxStudio.tsx + SystemBuilder.tsx (✅ exists)
- Kimi AI interface — AdminKimiAI.tsx (✅ exists)
- AI sessions log — AdminAISessions.tsx (✅ exists)
- Smart provider routing — OPENAI_API_KEY → GPT-4o (vision); MOONSHOT_API_KEY → Kimi (no vision) (✅ documented in memory)
- AI companion — QiroxCompanion.tsx (✅ exists in AppInner)

**Main Features (missing):**
- AI-powered proposal generation — generate proposal text from order/wizard data
- AI meeting summariser — auto-summarise QMeet transcripts
- AI client health predictor — score clients based on interaction patterns
- AI content writer — blog posts, social media copy, email campaigns from brief
- AI document analyser — extract key info from uploaded contracts, receipts, CVs
- Prompt management — admin-controlled system prompts per use case (avoid re-engineering prompts in code)

**Pages (new):**
- `/admin/ai/prompts` — Prompt management (new)
- `/admin/ai/document-analyser` — Upload + analyse documents (new)
- `/admin/ai/content-writer` — Guided content generation (new)

**Database Impact:**
- New collection: `ai_prompt_templates` (name, useCase, systemPrompt, userPromptTemplate, model, createdBy)
- Extend `QMeetModel`: add `aiSummary`, `aiTranscript` (additive, nullable)

**Future APIs:**
- `GET /api/ai/prompt-templates` — list prompt templates
- `POST /api/ai/prompt-templates` — create template
- `POST /api/ai/analyse-document` — upload + analyse
- `POST /api/ai/generate-proposal` — proposal text from order data
- `POST /api/ai/summarise-meeting` — summarise QMeet session

**Security:** All AI endpoints rate-limited per user. Vision endpoints (image analysis) require explicit opt-in flag. Anti-Chinese language rule enforced in all system prompts (documented in memory).

**Feature Flag:** `FEATURE_AI_PROPOSAL_GEN=false`, `FEATURE_AI_MEETING_SUMMARY=false`, `FEATURE_AI_CONTENT_WRITER=false`

**Estimated Complexity:** Medium (prompt templates are simple; meeting summariser requires transcript capture from QMeet)

**Priority:** P2

---

### Department 22 — SEO Platform

**Purpose:** Own QIROX's organic search presence. Technical SEO, content SEO, and performance monitoring.

**Users:** Admin, Manager (full). Sales (read-only).

**Main Features (existing):**
- Per-page meta tags — use-seo hook across all public pages (✅ exists)
- OG / Twitter card config — server/config/seo.ts (✅ exists)
- Sitemap — client/public/sitemap.xml (14 URLs) (✅ exists)
- Robots.txt — (assumed, needs verification)
- SEO documentation — docs/SEO_ENGINEERING.md, docs/SEO_ENGINEERING_PLAN.md (✅ exists)

**Main Features (missing):**
- SEO dashboard — keyword rankings, organic traffic, Core Web Vitals, crawl errors
- Keyword research tool — target keyword management per page
- Internal link suggestions — identify pages that should link to each other
- Schema markup management — per-page structured data (Organization, Service, FAQPage, etc.)
- Performance monitoring — Lighthouse scores automated per deploy
- Sitemap auto-generation — dynamic sitemap reflecting all published content (news, systems, jobs, partners)
- Multilingual SEO — hreflang tags for AR/EN content
- Backlink tracking — monitor inbound links

**Pages (new):**
- `/admin/seo` — SEO dashboard (new)
- `/admin/seo/keywords` — Keyword management (new)
- `/admin/seo/schema` — Schema markup manager (new)
- `/admin/seo/performance` — Performance scores (new)

**Database Impact:**
- New collection: `seo_keywords` (keyword, targetPage, volume, difficulty, currentRank, trackingSince)
- New collection: `seo_schema_overrides` (path, schemaType, schemaJson)
- New collection: `seo_performance_snapshots` (url, lighthouseScore, lcp, cls, fid, capturedAt)

**Future APIs:**
- `GET /api/seo/keywords` — keyword list
- `POST /api/seo/keywords` — add keyword to track
- `GET /api/seo/performance?url=` — latest Lighthouse score
- `GET /api/sitemap-dynamic.xml` — dynamic sitemap (replaces static file)

**Feature Flag:** `FEATURE_SEO_DASHBOARD=false`

**Estimated Complexity:** Medium (dashboard can use Google Search Console API; Lighthouse CI is external)

**Priority:** P2

---

### Department 23 — QAdmin (System Administration)

**Purpose:** The operating layer for the entire platform. Configuration, infrastructure health, user management, permissions, and platform stability.

**Users:** Admin only

**Main Features (existing):**
- System features / feature flags — AdminSystemFeatures.tsx (✅ exists, but UI for existing flags only)
- System settings — AdminQiroxSettings.tsx (✅ exists)
- System dashboards — AdminSystemDashboards.tsx (✅ exists)
- System map — AdminSystemMap.tsx (✅ exists)
- MongoDB Atlas — AdminMongoAtlas.tsx (✅ exists)
- Connection settings — AdminConnectionSettings.tsx (✅ exists)
- API keys — AdminApiKeys.tsx (✅ exists)
- Cron jobs — AdminCronJobs.tsx (✅ exists)
- App publish — AdminAppPublish.tsx (✅ exists)
- Roles — AdminRoles.tsx (✅ exists)
- Countries — AdminCountries.tsx (✅ exists)
- Push notifications — AdminPushNotifications.tsx (✅ exists)
- Phone verifications — AdminPhoneVerifications.tsx (✅ exists)
- Activity log — AdminActivityLog.tsx (✅ exists)
- Health endpoints — `/health/live`, `/health/ready`, `/health/detailed` (✅ exists)

**Main Features (missing):**
- Feature flag UI for Sprint 003+ flags — AdminSystemFeatures.tsx needs to expose `FEATURE_CUSTOMER_JOURNEY_V2`, `FEATURE_DASHBOARD_V2`, and all new Sprint 005 flags
- Full RBAC editor — AdminRoles.tsx exists but RBAC V2 (docs/RBAC_DESIGN.md) is designed, not implemented
- Audit log V2 — current ActivityLog is basic; needs actor, resource, action, scope, result per RBAC_DESIGN.md spec
- Platform health dashboard — combines health endpoints, feature flags, DB connection status, and cron job health in one screen
- Rate limit management — configure per-endpoint rate limits without code changes
- Webhook management — outbound webhooks for external integrations (Zapier, Make, etc.)

**Pages (new/extending):**
- `/admin/system/feature-flags` — Feature flag manager V2 (extends AdminSystemFeatures.tsx)
- `/admin/system/rbac` — RBAC V2 editor (new, implements docs/RBAC_DESIGN.md)
- `/admin/system/audit-log-v2` — Audit log V2 (new)
- `/admin/system/health` — Platform health dashboard (new)
- `/admin/system/webhooks` — Webhook manager (new)

**Database Impact:**
- New collection: `audit_log_v2` (actor, actorRole, resource, resourceId, action, scope, result, metadata{}, timestamp)
- New collection: `rbac_permissions` (role, resource, action, scope, conditions{})
- New collection: `webhooks` (url, events[], secret, enabled, lastTriggeredAt)

**Future APIs:**
- `GET /api/admin/feature-flags` — list all flags with current state
- `POST /api/admin/feature-flags/:name/override` — set runtime override
- `GET /api/admin/audit-log-v2` — paginated audit trail
- `POST /api/admin/rbac/permissions` — create permission rule
- `POST /api/admin/webhooks` — register webhook

**Feature Flag:** `FEATURE_RBAC_V2=false`, `FEATURE_AUDIT_LOG_V2=false`

**Estimated Complexity:** High (RBAC V2 touches all 710+ route handlers)

**Priority:** P1 (feature flag UI), P2 (RBAC V2)

---

## New Requirements — Implementation Map

| Requirement | Department | Sprint |
|---|---|---|
| Apple Wallet employee cards | HR (Dept 08) | Sprint 010 |
| QR secure employee identity | HR (Dept 08) | Sprint 009 |
| QR attendance | HR (Dept 08) | Sprint 009 |
| QR event check-in | Events (Dept 12) | Sprint 011 |
| Secure event tickets | Events (Dept 12) | Sprint 011 |
| Customer event invitations | Events (Dept 12) | Sprint 011 |
| WhatsApp Web gateway | WhatsApp (Dept 13) | Sprint 012 |
| Manual WhatsApp automation | WhatsApp (Dept 13) | Sprint 008 |
| Internal CRM V2 | CRM (Dept 04) | Sprint 008 |
| Customer Timeline | CRM (Dept 04) | Sprint 008 |
| Proposal Builder | Sales (Dept 03) | Sprint 007 |
| Contract Builder | Sales (Dept 03) | Sprint 007 |
| Investor Presentation Center | Investor Relations (Dept 15) | Sprint 012 |
| Brand Identity Center | Brand Center (Dept 10) | Sprint 009 |
| Executive Dashboard | Executive Mgmt (Dept 01) | Sprint 007 |
| Employee Dashboard V2 | Employee Exp (Dept 14) | Sprint 009 |
| Customer Dashboard V2 | Customer Success (Dept 05) | Sprint 006 (wires Sprint 003) |
| Company KPIs | Analytics (Dept 20) | Sprint 007 |
| Company OKRs | Executive Mgmt (Dept 01) | Sprint 007 |
| Company Wiki | Knowledge Base (Dept 16) | Sprint 009 |
| Internal Announcements | Operations (Dept 02) | Sprint 008 |
| Company Calendar | Operations (Dept 02) | Sprint 008 |
| Asset Tracking | Company Assets (Dept 18) | Sprint 011 |
| Equipment Management | Company Assets (Dept 18) | Sprint 011 |
| Internal Chat | Employee Exp (Dept 14) | Sprint 009 |
| Meeting Center | Operations (Dept 02) | Sprint 009 |
| Document Center | Operations (Dept 02) | Sprint 009 |

---

## Sprint Roadmap

| Sprint | Focus | Departments |
|---|---|---|
| Sprint 006 | Customer Journey V2 activation — wire Dashboard V2 sections to real APIs | Customer Success (05), Project Management (06) |
| Sprint 007 | Revenue acceleration — Proposal Builder, Contract Builder, Executive Dashboard, Company KPIs | Sales (03), Executive Mgmt (01), Analytics (20) |
| Sprint 008 | Client Intelligence — CRM V2, Customer Timeline, WhatsApp templates, Internal Announcements, Company Calendar | CRM (04), WhatsApp (13), Operations (02) |
| Sprint 009 | People & Knowledge — Employee Dashboard V2, Internal Chat, HR QR Attendance, Knowledge Base, Wiki, Brand Center | HR (08), Employee Exp (14), Knowledge Base (16), Brand Center (10) |
| Sprint 010 | Apple Wallet & Identity — Employee Apple Wallet cards, QR identity, Asset Tracking | HR (08), Company Assets (18) |
| Sprint 011 | Events Platform — physical events, QR check-in, tickets, customer invitations | Events (12) |
| Sprint 012 | Partner Systems — WhatsApp Web Gateway, Investor Presentation Center, Media Library | WhatsApp (13), Investor Relations (15), Media Library (19) |
| Sprint 013 | Intelligence Layer — Analytics V2, SEO Dashboard, AI enhancements | Analytics (20), SEO (22), AI Platform (21) |
| Sprint 014 | Foundation hardening — RBAC V2, Audit Log V2, SOP Management, Expense Tracking | QAdmin (23), Finance (07), SOP (17) |

---

## Feature Flag Registry

Complete list of all feature flags — current (Sprint 001–003) and planned (Sprint 005+):

| Flag | Default | Status | Sprint |
|---|---|---|---|
| `FEATURE_HOME_V4` | false | Planned | Sprint 001 |
| `FEATURE_PRICING_V4` | false | Planned | Sprint 001 |
| `FEATURE_SOLUTION_FINDER` | false | Planned | Sprint 001 |
| `FEATURE_ORDER_V4` | false | Planned | Sprint 001 |
| `FEATURE_MOYASAR_PAYMENTS` | false | Planned | Sprint 001 |
| `FEATURE_PROJECT_DASHBOARD_V4` | false | Planned | Sprint 001 |
| `FEATURE_DELIVERY_ACCEPTANCE` | false | Planned | Sprint 001 |
| `FEATURE_NPS_REVIEWS` | false | Planned | Sprint 001 |
| `FEATURE_LOYALTY_PROGRAMME` | false | Planned | Sprint 001 |
| `FEATURE_CUSTOMER_JOURNEY_V2` | false | **Architecture complete** | Sprint 003 |
| `FEATURE_DASHBOARD_V2` | false | **Architecture complete** | Sprint 003 |
| `FEATURE_EXECUTIVE_DASHBOARD` | false | Planned | Sprint 007 |
| `FEATURE_PROPOSAL_BUILDER` | false | Planned | Sprint 007 |
| `FEATURE_CONTRACT_BUILDER` | false | Planned | Sprint 007 |
| `FEATURE_ANALYTICS_V2` | false | Planned | Sprint 007 |
| `FEATURE_CRM_V2` | false | Planned | Sprint 008 |
| `FEATURE_WHATSAPP_GATEWAY` | false | Planned | Sprint 008 |
| `FEATURE_WHATSAPP_BROADCASTS` | false | Planned | Sprint 008 |
| `FEATURE_MEETING_CENTER` | false | Planned | Sprint 008 |
| `FEATURE_DOCUMENT_CENTER` | false | Planned | Sprint 009 |
| `FEATURE_COMPANY_CALENDAR` | false | Planned | Sprint 008 |
| `FEATURE_EMPLOYEE_CHAT` | false | Planned | Sprint 009 |
| `FEATURE_EMPLOYEE_DASHBOARD_V2` | false | Planned | Sprint 009 |
| `FEATURE_KNOWLEDGE_BASE` | false | Planned | Sprint 009 |
| `FEATURE_BRAND_CENTER` | false | Planned | Sprint 009 |
| `FEATURE_QR_ATTENDANCE` | false | Planned | Sprint 009 |
| `FEATURE_PERFORMANCE_REVIEWS` | false | Planned | Sprint 009 |
| `FEATURE_EMPLOYEE_WALLET_CARDS` | false | Planned | Sprint 010 |
| `FEATURE_ASSET_TRACKING` | false | Planned | Sprint 011 |
| `FEATURE_EVENTS_PLATFORM` | false | Planned | Sprint 011 |
| `FEATURE_EVENT_CHECKIN_QR` | false | Planned | Sprint 011 |
| `FEATURE_INVESTOR_CENTER` | false | Planned | Sprint 012 |
| `FEATURE_MEDIA_LIBRARY` | false | Planned | Sprint 012 |
| `FEATURE_SEO_DASHBOARD` | false | Planned | Sprint 013 |
| `FEATURE_AI_PROPOSAL_GEN` | false | Planned | Sprint 013 |
| `FEATURE_AI_MEETING_SUMMARY` | false | Planned | Sprint 013 |
| `FEATURE_CAMPAIGN_TRACKER` | false | Planned | Sprint 013 |
| `FEATURE_SOP_MANAGEMENT` | false | Planned | Sprint 014 |
| `FEATURE_EXPENSE_TRACKING` | false | Planned | Sprint 014 |
| `FEATURE_MILESTONE_PAYMENTS` | false | Planned | Sprint 014 |
| `FEATURE_RBAC_V2` | false | Planned | Sprint 014 |
| `FEATURE_AUDIT_LOG_V2` | false | Planned | Sprint 014 |

---

## Global Architecture Rules

These rules apply to every sprint and every department:

1. **Zero Downtime Policy** — all changes are additive. No existing collection renames, no field deletions, no API modifications. Feature flags gate all new surfaces.
2. **Portal separation** — Client portal (`/dashboard`), Employee portal (`/employee/*`), QAdmin (`/admin/*`) never share pages. Components may be shared but are always role-guarded.
3. **Role enforcement** — every new API endpoint explicitly declares required roles in its middleware declaration. No implicit access.
4. **Feature flag first** — every new department/feature starts with its flag set to `false` in `FeatureFlag` constant map (`server/infrastructure/feature-flags.ts`) before any UI is built.
5. **Arabic-first** — all new UI components carry `labelAr` + `labelEn`. Default render language is Arabic. RTL layout is the baseline.
6. **Barrel exports** — all new feature modules export from a single `index.ts`. Import paths never reach into sub-directories from outside the feature.
7. **Pure engine layer** — business logic (computations, state machines, validators) lives in `engine/` or server services, never in React components.
8. **Additive DB schema** — new fields on existing models are always optional (nullable) with no default that changes existing document behaviour.
9. **QR code security** — all QR codes are time-limited (60-second validity for attendance/events), single-use for tickets, signed with HMAC for identity cards.
10. **API versioning** — new APIs for new features use `/api/v2/` namespace. Existing `/api/` routes are never modified.

---

## Production Safety Checklist

- [x] Zero files modified in production
- [x] Zero APIs modified
- [x] Zero database changes
- [x] Zero routing changes
- [x] All new feature flags default to `false`
- [x] Expected downtime: ZERO

---

*Sprint 005 complete. This document is the master implementation plan for Sprints 006–014. Awaiting approval before Sprint 006.*
