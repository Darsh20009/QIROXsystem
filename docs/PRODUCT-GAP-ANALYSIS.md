# QIROX Platform — Product Gap Analysis

**Date:** July 2026  
**Type:** Read-only product audit — no code modified  
**Scope:** Customer journey, employee workflow, admin workflow, CRM, project management, finance, payments, notifications, SEO, analytics, onboarding, UI/UX, enterprise features, internal tools

---

## Part 1 — What Currently Exists (Baseline)

### 1.1 Public / Marketing Site
- Landing page with CTAs (Start Your Idea, Order Service, Book Consultation)
- About, Prices, Customers, News, Jobs, Services, Contact, Privacy, Terms, Partners, Community, Alliances, Segments pages
- Developer portal with tiered package pricing
- Consultation booking form (name, email, phone, topic; pre-filled for logged-in users)
- Order tracking by reference number (`QS-XXXXXX`): Received → Under Review → Confirmed → Completed
- Arabic / English bilingual throughout
- SEO: `useSEO` hook (meta, OG, Twitter cards, canonical, JSON-LD), `sitemap.xml` (14 URLs), `robots.txt`
- Pixel tracking: Meta, TikTok, Snapchat, GA4, GTM — IDs configurable in admin settings

### 1.2 Client Portal
- Dashboard: active project count, wallet balance, support ticket count, recent activity
- Qirox Pay Wallet: virtual card, PIN, top-up (bank transfer + PayPal), OTP-authorised external payments, transaction history
- Project Workspace: feature roadmap, issue reporting, meeting schedule, progress %
- Invoices: list with status (Paid/Unpaid/Cancelled), PDF download/print
- Quotations: itemised view (qty, unit price, VAT, validity), Accept/Reject actions
- Help & Support: categorised FAQ, support ticket submission, CS chat link
- Loyalty: points balance, conversion to SAR, earning/redemption history
- Referral: personal referral code, total referrals, SAR earned
- Installments: payment schedule, apply for plans, pay via wallet + PIN
- My Tools: utility app launcher (PDF tools, barcode studio, etc.)
- QMeet: video meeting participation, lobby entry by code

### 1.3 Employee Workflow
- Employee Hub: personalised role-based dashboard
- Employee Profile: photo, bio, skills, portfolio, QR login, printable ID card, vacation balance, bank info
- New Order Wizard (3 steps): create/select client → define project (type, sector, plan, discount) → success + credential handoff
- CRM: Kanban pipeline (New → Contacted → Qualified → Proposal → Won → Lost), activity logging (Call, Email, WhatsApp, Meeting, Note, Task), follow-up dates, CSV import
- WhatsApp CRM: 6 editable message templates with `{name}` substitution → opens `wa.me` link
- Sales Marketing: Canva template links, poster studio uploads
- System Builder: sandbox IDE (React/Node/Express/Next.js templates), run/stop projects
- My Finance: monthly payroll view (base, deductions, net), commission/bonus tracking
- Changelog: version history, staff guide with step-by-step internal procedures

### 1.4 Admin Workflow
- System Map: master grid of all admin modules
- Analytics/BI: revenue, order volume, customer count by period (day/week/month/year); hourly distribution, top products, payment method breakdown
- User Management: employee CRUD + role assignment, customer CRUD
- Finance: profit reports, invoices, receipts management, payroll administration
- Orders: global order queue management
- Shipments: fulfillment tracking
- Support Tickets: queue and assignment
- Activity Log: audit trail
- Roles: role-based permission configuration
- DB Monitoring: Atlas connection management
- Cron Jobs: 27 scheduled task monitoring
- Studio: AI session management
- Email Marketing: campaign dashboard (open/click rates, subscriber count, automation status), broadcast center, template library
- Push Notifications: manual broadcast (in-app + push)
- Settings: SMTP, branding, pixel IDs, WhatsApp contact, system-wide config

### 1.5 CRM
- Pipeline stages: New, Contacted, Qualified, Proposal, Won, Lost
- Activity types: Call, Email, WhatsApp, Meeting, Note, Task
- Lead fields: name, email, phone, company, source, status, assignedTo, interestLevel, lastContacted
- Lead → Client conversion (links CrmLead to UserModel)
- Pipeline stats: count and value by stage
- CSV bulk import

### 1.6 Financial System
- Order creation with multi-plan pricing, discount (fixed/percent), VAT
- PayPal payment processing (order create + capture)
- Wallet: OTP-secured external payments, bank transfer or PayPal top-ups
- Auto-generated invoices from orders
- Manual receipt creation
- Quotation generation (itemised, VAT, validity, PDF attachment option)
- Installment plans: schedule, application, wallet payment
- Project addon subscriptions (recurring)
- Profit report: revenue vs. expenses vs. net profit
- Employee payroll with base + deductions + net

### 1.7 Notifications
- 3-layer delivery: DB persist → WebSocket (if online) → VAPID web push (if offline)
- Types: info, success, warning, error, message, order, status, project, task, auth, payment
- Admin manual broadcast (in-app + push, segmented by role)
- Unread count API for badge

### 1.8 AI
- GPT-4o (text + vision) when OPENAI_API_KEY present
- Moonshot/Kimi fallback
- Image generation (flux+enhance pipeline, Arabic→English prompt translation)
- Video proxy
- Studio: session management, model configuration

---

## Part 2 — Product Gap Analysis

---

### Gap Area 1 — Customer Journey

#### What the journey currently looks like
1. User visits marketing site → reads about services
2. Clicks "Book Consultation" or "Order Service"
3. Registers account (email + password)
4. Lands on client dashboard — no guided introduction
5. Browses projects (likely empty on first login)
6. Waits for employee to create order manually or places order via developer portal

#### Gaps

**G-CJ-01 — No guided onboarding tour after first login**
- Business value: First impressions determine long-term retention. New clients who don't understand the portal abandon it.
- Technical complexity: Low — animated step-by-step overlay using existing `ClientOnboarding.tsx` (already exists; needs triggering on first login flag)
- Dependencies: `UserModel` needs `hasCompletedOnboarding: Boolean` field (additive)
- User impact: HIGH — every new client affected
- Priority: **Critical**

**G-CJ-02 — No email verification on registration**
- Business value: Data quality, spam prevention, deliverability trust
- Technical complexity: Low — OTP/link email already exists in email domain
- Dependencies: `UserModel.emailVerified` flag
- User impact: MEDIUM — affects all new registrations
- Priority: **High**

**G-CJ-03 — No self-service package upgrade / service re-order**
- Business value: Removes friction for repeat business; employees currently must place all orders manually
- Technical complexity: Medium — re-use existing order form with pre-filled client data
- Dependencies: Existing order and pricing system
- User impact: HIGH — every returning client
- Priority: **High**

**G-CJ-04 — No client-facing project timeline / milestone view**
- Business value: Clients want to see when things will be delivered, not just a progress bar
- Technical complexity: Medium — Gantt or milestone list on ProjectWorkspace
- Dependencies: Milestone model (new, additive)
- User impact: HIGH
- Priority: **High**

**G-CJ-05 — No real-time client ↔ team chat on projects**
- Business value: Email/WhatsApp for project comms is untracked and creates blind spots for managers
- Technical complexity: Medium — WebSocket infrastructure already exists; need conversation thread per project
- Dependencies: `ProjectMessage` model (additive), ws.ts room extension
- User impact: HIGH
- Priority: **High**

**G-CJ-06 — No client satisfaction / NPS survey after project completion**
- Business value: Critical feedback loop; identifies churn risk; required for B2B credibility
- Technical complexity: Low — triggered email + rating form
- Dependencies: `ProjectRating` model (additive)
- User impact: MEDIUM
- Priority: **Medium**

**G-CJ-07 — No client-facing knowledge base / documentation**
- Business value: Reduces repetitive support tickets by 30–50%
- Technical complexity: Medium — article model + search
- Dependencies: None
- User impact: MEDIUM
- Priority: **Medium**

**G-CJ-08 — No digital contract / e-signature on quotation acceptance**
- Business value: Legal protection; enterprise clients require signed agreements
- Technical complexity: Medium — PDF generation + stored acceptance record with timestamp + IP
- Dependencies: `QuotationModel` (additive field: `acceptanceSignature`, `acceptedAt`, `acceptedIp`)
- User impact: HIGH (enterprise clients)
- Priority: **High**

**G-CJ-09 — No demo / sandbox mode for prospects**
- Business value: Converts evaluation to purchase without requiring a sales call
- Technical complexity: Medium — read-only demo account with seeded data
- Dependencies: Demo flag on UserModel
- User impact: MEDIUM
- Priority: **Medium**

**G-CJ-10 — No order cancellation or modification request (self-service)**
- Business value: Reduces support load; prevents dissatisfaction when clients feel locked in
- Technical complexity: Low — "Request Change / Cancel" form on order detail
- Dependencies: `OrderModificationRequest` model (additive)
- User impact: MEDIUM
- Priority: **Medium**

---

### Gap Area 2 — Employee Workflow

#### Gaps

**G-EMP-01 — No time tracking per task or project**
- Business value: Required for accurate billing, profitability analysis, and resource planning
- Technical complexity: Medium — start/stop timer per task; `TimeEntry` model
- Dependencies: `TaskModel` (additive `estimatedHours` exists; need `actualHours` tracked)
- User impact: HIGH (billing accuracy, capacity planning)
- Priority: **High**

**G-EMP-02 — No resource allocation / capacity view**
- Business value: Managers cannot see who is overloaded; leads to burnout and missed deadlines
- Technical complexity: Medium — calendar/grid showing employee workload across projects
- Dependencies: Time tracking (G-EMP-01) or task assignment data (already exists)
- User impact: HIGH
- Priority: **High**

**G-EMP-03 — No sprint / iteration planning**
- Business value: Software delivery requires sprint-based planning; current Kanban has no time boxing
- Technical complexity: Medium — Sprint model with start/end dates, task assignment to sprint
- Dependencies: `Sprint` model (additive), `TaskModel` sprint reference
- User impact: MEDIUM
- Priority: **Medium**

**G-EMP-04 — No dependency mapping between tasks**
- Business value: Teams cannot sequence work correctly without blocking/blocked-by relationships
- Technical complexity: Medium — `TaskDependency` model; UI shows blocked tasks
- Dependencies: `TaskModel` (additive `blockedBy` array)
- User impact: MEDIUM
- Priority: **Medium**

**G-EMP-05 — No automated project status report to client**
- Business value: Clients currently only see progress % and feature list; no narrative weekly update
- Technical complexity: Low — weekly cron + templated email (infrastructure already exists)
- Dependencies: `WeeklyReportEmail` already in email domain
- User impact: HIGH
- Priority: **High**

**G-EMP-06 — No internal knowledge base / wiki for employees**
- Business value: Tribal knowledge lives in the Changelog staff guide; not searchable or categorisable
- Technical complexity: Medium — Article/Wiki model with categories and search
- Dependencies: None
- User impact: MEDIUM
- Priority: **Medium**

**G-EMP-07 — No attendance / check-in system visible to employees**
- Business value: Employees cannot self-report attendance; admin has to manage it entirely
- Technical complexity: Low — face-api.js is already installed; biometric check-in exists in profile (limited)
- Dependencies: `AttendanceModel` (likely already exists in admin side)
- User impact: MEDIUM
- Priority: **Medium**

**G-EMP-08 — No expense report submission**
- Business value: Employees cannot submit business expenses; fully manual off-system process
- Technical complexity: Medium — `ExpenseReport` model with approval workflow
- Dependencies: None
- User impact: LOW
- Priority: **Low**

---

### Gap Area 3 — Admin Workflow

#### Gaps

**G-ADM-01 — No real-time operations dashboard (live order monitor)**
- Business value: Ops managers need to see orders in-flight, SLA breaches, and bottlenecks at a glance
- Technical complexity: Medium — WebSocket-fed live board; data already in OrderModel
- Dependencies: WebSocket infrastructure (exists)
- User impact: HIGH
- Priority: **High**

**G-ADM-02 — No SLA tracking or escalation system for support tickets**
- Business value: Enterprise clients expect response SLAs; breach visibility prevents churn
- Technical complexity: Medium — SLA config per ticket type, breach calculation, escalation trigger
- Dependencies: `SupportTicketModel` (additive `slaDeadline`, `escalatedAt` fields)
- User impact: HIGH
- Priority: **High**

**G-ADM-03 — No bulk operations on orders / clients**
- Business value: Admin cannot bulk-change status, bulk-assign, or bulk-email a filtered set
- Technical complexity: Low — checkbox multi-select + action dropdown
- Dependencies: Existing filter/query endpoints
- User impact: MEDIUM
- Priority: **Medium**

**G-ADM-04 — No configurable automation rules**
- Business value: "When order status changes to Completed → send rating email → create invoice" cannot be configured without code
- Technical complexity: High — rules engine with trigger/condition/action model
- Dependencies: None; complex build
- User impact: HIGH (long-term operational efficiency)
- Priority: **Medium** (complexity vs. value tradeoff)

**G-ADM-05 — No subscription / MRR analytics**
- Business value: SaaS platform needs MRR, churn rate, LTV, and subscription lifecycle metrics
- Technical complexity: Medium — aggregation queries on `ProjectAddonSubscriptionModel` + OrderModel
- Dependencies: None (data exists)
- User impact: HIGH (business intelligence)
- Priority: **High**

**G-ADM-06 — No customer health score**
- Business value: Identifies at-risk clients before they churn; enables proactive outreach
- Technical complexity: Medium — composite score (login frequency, ticket volume, payment history, project progress)
- Dependencies: Data already in various models; scoring computation needed
- User impact: HIGH
- Priority: **Medium**

**G-ADM-07 — No funnel / conversion analytics**
- Business value: Cannot see where leads drop off (site visit → consultation → order → repeat)
- Technical complexity: Medium — event model + funnel aggregation
- Dependencies: `AnalyticsEvent` model (additive); no behavioral data currently stored
- User impact: HIGH
- Priority: **High**

**G-ADM-08 — No scheduled / automated reports (PDF export)**
- Business value: Finance and management want reports emailed on a schedule, not only on-demand
- Technical complexity: Medium — cron + existing PDF library + report endpoints
- Dependencies: `ReportSchedule` model (additive)
- User impact: MEDIUM
- Priority: **Medium**

---

### Gap Area 4 — CRM

#### Gaps

**G-CRM-01 — No automated lead scoring**
- Business value: Sales teams cannot prioritise without scoring; leads decay when unranked
- Technical complexity: Medium — configurable scoring rules (source, company size, activity frequency, interest level)
- Dependencies: `CrmLeadModel` (additive `score` field)
- User impact: HIGH
- Priority: **High**

**G-CRM-02 — No automated email sequences from CRM**
- Business value: Manual follow-up at every stage is not scalable; sequences drive conversion
- Technical complexity: High — sequence model, step scheduling, email domain integration
- Dependencies: Email domain, cron system
- User impact: HIGH
- Priority: **Medium** (complexity)

**G-CRM-03 — No duplicate lead detection**
- Business value: Same lead from multiple sources creates confusion and wasted outreach
- Technical complexity: Low — fuzzy match on email + phone at creation time
- Dependencies: None
- User impact: MEDIUM
- Priority: **Medium**

**G-CRM-04 — No lead source attribution / UTM tracking**
- Business value: Cannot optimise marketing spend without knowing which channel produces leads
- Technical complexity: Medium — UTM capture on public forms, stored on PriceRequest/CrmLead
- Dependencies: `CrmLeadModel` (additive `utmSource`, `utmMedium`, `utmCampaign` fields)
- User impact: HIGH
- Priority: **High**

**G-CRM-05 — No unified contact timeline (all channels merged)**
- Business value: An email, WhatsApp message, meeting note, and invoice should appear in one chronological view per contact
- Technical complexity: Medium — aggregate activities + emails + invoices + orders by contactId
- Dependencies: Existing activity and order models
- User impact: HIGH
- Priority: **High**

**G-CRM-06 — No automated follow-up reminders / alerts**
- Business value: Follow-up dates are stored but no alert fires when one is due; leads go cold
- Technical complexity: Low — cron check on `CrmLeadModel.followUpDate`; push + in-app notification
- Dependencies: Notify system (exists), cron (exists)
- User impact: HIGH
- Priority: **Critical**

**G-CRM-07 — No deal value forecasting / pipeline revenue forecast**
- Business value: Sales managers need predicted revenue for the month based on pipeline stage + probability
- Technical complexity: Medium — probability % per stage × deal value aggregation
- Dependencies: `CrmLeadModel` (additive `probability` field)
- User impact: HIGH
- Priority: **High**

**G-CRM-08 — No CRM ↔ email campaign integration**
- Business value: Cannot send a targeted campaign to "all Qualified leads in the pipeline"; marketing and CRM are siloed
- Technical complexity: Medium — segment export from CRM → email marketing list
- Dependencies: Email marketing system (exists)
- User impact: HIGH
- Priority: **Medium**

---

### Gap Area 5 — Project Management

#### Gaps

**G-PM-01 — No milestone tracking with client approval gates**
- Business value: Clients need to formally approve deliverables; without gates, scope creep is uncontrolled
- Technical complexity: Medium — `Milestone` model with `requiresClientApproval` flag; approval email + UI
- Dependencies: `ProjectModel` (additive)
- User impact: HIGH
- Priority: **High**

**G-PM-02 — No Gantt / timeline view**
- Business value: Project managers cannot visualise task sequence, overlap, or critical path
- Technical complexity: Medium — timeline rendering (e.g., lightweight Gantt component)
- Dependencies: Task start/end dates (partially exists in TaskModel)
- User impact: HIGH
- Priority: **High**

**G-PM-03 — No project budget tracking vs. actual spend**
- Business value: Projects routinely go over budget without a tracked cost view
- Technical complexity: Medium — `ProjectBudget` model; link to invoices + time entries
- Dependencies: Time tracking (G-EMP-01)
- User impact: HIGH
- Priority: **Medium** (depends on G-EMP-01)

**G-PM-04 — No project template library**
- Business value: Starting every project from scratch wastes PM time; templates encode best practices
- Technical complexity: Low — `ProjectTemplate` model with pre-defined milestones and task sets
- Dependencies: None
- User impact: MEDIUM
- Priority: **Medium**

**G-PM-05 — No client deliverable approval workflow**
- Business value: "Here is the design mockup — please approve" needs a formal accept/reject flow with version history
- Technical complexity: Medium — `Deliverable` model with file attachment + client approve/reject
- Dependencies: None
- User impact: HIGH
- Priority: **High**

**G-PM-06 — No automated project status updates to clients**
Noted above as G-EMP-05 — covered.

---

### Gap Area 6 — Quotation Flow

#### Gaps

**G-QUO-01 — No quotation version control**
- Business value: "You sent us three versions" — without versioning, disputes arise
- Technical complexity: Low — `version` field + parent `quotationId` reference
- Dependencies: `QuotationModel` (additive)
- User impact: MEDIUM
- Priority: **Medium**

**G-QUO-02 — No e-signature on quotation acceptance**
Already captured as G-CJ-08. Priority: **High**

**G-QUO-03 — No quotation expiry notification**
- Business value: Quotations expire without the client knowing; recovery is manual
- Technical complexity: Low — cron check on `validUntil`; email + in-app notification
- Dependencies: Email domain (exists), cron (exists)
- User impact: MEDIUM
- Priority: **Medium**

**G-QUO-04 — No auto-conversion: quotation → invoice on acceptance**
- Business value: Employees manually create an invoice after a quotation is accepted; this should be automatic
- Technical complexity: Low — trigger invoice creation in the quotation acceptance handler
- Dependencies: Existing invoice creation logic
- User impact: MEDIUM
- Priority: **High**

**G-QUO-05 — No multi-option quotation (client chooses a tier)**
- Business value: Presenting Good/Better/Best options increases conversion
- Technical complexity: Medium — `QuotationOption` sub-model; client selects one on the accept action
- Dependencies: `QuotationModel` (additive)
- User impact: MEDIUM
- Priority: **Medium**

---

### Gap Area 7 — Order Lifecycle

#### Gaps

**G-ORD-01 — No SLA tracking per order type**
- Business value: "Website delivery in 14 days" must be tracked and alerted on breach
- Technical complexity: Medium — SLA config per service/plan; breach alert via notification system
- Dependencies: `OrderModel` (additive `slaDeadline`, `slaStatus`)
- User impact: HIGH
- Priority: **High**

**G-ORD-02 — No order completion satisfaction survey**
- Business value: Immediate post-delivery NPS captures honest sentiment
- Technical complexity: Low — triggered email on order status → Completed
- Dependencies: Email domain, rating model
- User impact: HIGH
- Priority: **High**

**G-ORD-03 — No order cloning for repeat purchases**
- Business value: Enterprise clients re-order the same service; cloning eliminates data re-entry
- Technical complexity: Low — "Clone Order" action copies order fields
- Dependencies: None
- User impact: LOW
- Priority: **Low**

**G-ORD-04 — No visible estimated delivery date for client**
- Business value: "When will my order be done?" is the #1 support question
- Technical complexity: Low — `estimatedDelivery` field on order + display in client portal
- Dependencies: `OrderModel` (additive)
- User impact: HIGH
- Priority: **High**

**G-ORD-05 — No automated order status update notifications**
- Business value: Clients learn about status changes only by checking the portal; should push automatically
- Technical complexity: Low — trigger `notify` on every order status change (hook already needed)
- Dependencies: Notification system (exists)
- User impact: HIGH
- Priority: **Critical**

---

### Gap Area 8 — Payment Lifecycle

#### Gaps

**G-PAY-01 — No ZATCA-compliant e-invoice (Saudi Arabia mandatory)**
- Business value: Legal requirement — Saudi ZATCA Phase 2 mandates QR-coded, structured e-invoices
- Technical complexity: High — XML invoice generation, QR encoding, integration with ZATCA API
- Dependencies: Tax registration data; ZATCA API credentials
- User impact: CRITICAL (legal compliance)
- Priority: **Critical**

**G-PAY-02 — No Mada / STC Pay / SADAD payment methods**
- Business value: Saudi B2C market predominantly uses local payment methods; PayPal is uncommon
- Technical complexity: High — Moyasar or HyperPay SDK integration
- Dependencies: Merchant account
- User impact: HIGH (conversion rate)
- Priority: **Critical**

**G-PAY-03 — No Stripe integration**
- Business value: International clients expect Stripe; required for card payments without PayPal account
- Technical complexity: Medium — Stripe SDK; similar to PayPal integration already done
- Dependencies: Stripe merchant account
- User impact: HIGH
- Priority: **High**

**G-PAY-04 — No automated recurring billing**
- Business value: Project addon subscriptions exist in the model but billing is not automated
- Technical complexity: High — subscription billing engine (charge on renewal date, handle failures)
- Dependencies: Payment gateway with recurring support (Stripe)
- User impact: HIGH
- Priority: **High**

**G-PAY-05 — No refund workflow**
- Business value: Refunds are manual and untracked; creates accounting and trust issues
- Technical complexity: Medium — `RefundRequest` model + admin approval + gateway refund API call
- Dependencies: Payment gateway APIs
- User impact: MEDIUM
- Priority: **High**

**G-PAY-06 — No payment failure recovery flow**
- Business value: Failed payments silently kill subscriptions and orders with no client recovery path
- Technical complexity: Medium — dunning emails (3-attempt sequence), link to re-pay
- Dependencies: Email domain (exists)
- User impact: HIGH
- Priority: **High**

**G-PAY-07 — No partial payment / payment plan on custom orders**
- Business value: Large custom orders (e.g., 50,000 SAR) need staged payments beyond the installment system
- Technical complexity: Medium — milestone-linked payment schedule
- Dependencies: `PaymentSchedule` model (additive)
- User impact: MEDIUM
- Priority: **Medium**

---

### Gap Area 9 — Notification System

#### Gaps

**G-NOT-01 — No user notification preferences**
- Business value: Clients receive every notification type; no way to opt out of low-priority ones
- Technical complexity: Low — `NotificationPreferences` model; checked before firing each type
- Dependencies: `UserModel` (additive preferences object)
- User impact: MEDIUM
- Priority: **Medium**

**G-NOT-02 — No SMS notifications**
- Business value: OTP and critical alerts via SMS are expected in Saudi market
- Technical complexity: Medium — Taqnyat / Unifonic / Twilio SMS API
- Dependencies: SMS provider account
- User impact: HIGH
- Priority: **High**

**G-NOT-03 — No WhatsApp Business API notifications**
- Business value: 95%+ of Saudi users prefer WhatsApp; wa.me links are manual; automated messages are expected
- Technical complexity: High — WhatsApp Business API (Meta) or provider (e.g., Twilio, Infobip)
- Dependencies: WhatsApp Business account approval
- User impact: HIGH (Saudi-critical)
- Priority: **Critical**

**G-NOT-04 — No notification digest / batching**
- Business value: Multiple rapid events flood the notification center; digest reduces noise
- Technical complexity: Medium — batch same-type notifications within a time window
- Dependencies: None; logic change in notify.ts
- User impact: LOW
- Priority: **Low**

**G-NOT-05 — No in-app notification filtering / categories**
- Business value: Notification center shows all types mixed; users cannot find relevant alerts
- Technical complexity: Low — filter tabs by notification type
- Dependencies: None (type field already exists)
- User impact: MEDIUM
- Priority: **Medium**

---

### Gap Area 10 — SEO

#### Gaps

**G-SEO-01 — Static sitemap doesn't include dynamic content**
- Business value: Service pages, news articles, job posts are not indexed by Google
- Technical complexity: Low — generate dynamic sitemap from DB at build time or via `/sitemap.xml` endpoint
- Dependencies: Express route returning sitemap XML
- User impact: MEDIUM (organic traffic)
- Priority: **High**

**G-SEO-02 — No blog / content marketing system**
- Business value: Content is the primary organic SEO driver for B2B services; currently zero blog content
- Technical complexity: Medium — `Article` model + public /blog route + admin editor
- Dependencies: None
- User impact: HIGH (long-term traffic)
- Priority: **High**

**G-SEO-03 — No review / testimonial schema markup**
- Business value: Star ratings in Google search results (rich snippets) dramatically increase CTR
- Technical complexity: Low — JSON-LD `AggregateRating` + `Review` schema on public pages
- Dependencies: Review data (currently testimonials are static)
- User impact: MEDIUM
- Priority: **Medium**

**G-SEO-04 — No schema markup for services/products**
- Business value: Service structured data enables Google to show service cards in search
- Technical complexity: Low — JSON-LD `Service` schema on service detail pages
- Dependencies: None
- User impact: MEDIUM
- Priority: **Medium**

---

### Gap Area 11 — Analytics

#### Gaps

**G-ANL-01 — No behavioral / product analytics (feature usage, drop-off)**
- Business value: Cannot improve what cannot be measured; product decisions are currently intuition-only
- Technical complexity: Medium — lightweight event tracking (page view, button click, feature used) + `AnalyticsEvent` model
- Dependencies: None
- User impact: HIGH (product intelligence)
- Priority: **High**

**G-ANL-02 — No conversion funnel tracking**
- Business value: Cannot see where the Visitor → Lead → Client → Repeat Client funnel breaks
- Technical complexity: Medium — funnel stages linked to user events
- Dependencies: G-ANL-01 (behavioral events)
- User impact: HIGH
- Priority: **High**

**G-ANL-03 — No retention / churn metrics**
- Business value: Revenue at risk is invisible without churn rate; cannot forecast growth
- Technical complexity: Medium — cohort analysis on order completion dates and repeat orders
- Dependencies: Existing order data
- User impact: HIGH
- Priority: **High**

**G-ANL-04 — No revenue forecasting**
- Business value: Management cannot plan capacity or hiring without projected revenue
- Technical complexity: Medium — weighted pipeline (CRM) + subscriptions + historical trends
- Dependencies: G-CRM-07, subscription data
- User impact: HIGH
- Priority: **Medium**

**G-ANL-05 — No employee productivity analytics**
- Business value: Cannot identify top performers or struggling team members without output metrics
- Technical complexity: Medium — tasks completed, time logged, tickets resolved per employee
- Dependencies: G-EMP-01 (time tracking)
- User impact: MEDIUM
- Priority: **Medium**

**G-ANL-06 — No custom report builder**
- Business value: Every management request for a non-standard report requires developer time
- Technical complexity: High — query builder UI over data models
- Dependencies: None; complex build
- User impact: MEDIUM
- Priority: **Low**

---

### Gap Area 12 — Onboarding Experience

#### Gaps

**G-ONB-01 — No triggered onboarding tour (first login)**
Already captured as G-CJ-01. Priority: **Critical**

**G-ONB-02 — No welcome email sequence (multi-step drip)**
- Business value: A single welcome email is insufficient; a 3–5 email sequence over 7 days drives activation
- Technical complexity: Low — cron-based sequence using email domain + `UserModel.createdAt`
- Dependencies: Email domain (exists), cron (exists)
- User impact: HIGH
- Priority: **High**

**G-ONB-03 — No progress checklist for new clients**
- Business value: "Complete your profile → Book a consultation → View your first project" gives clients clear next actions
- Technical complexity: Low — computed checklist based on `UserModel` fields
- Dependencies: None
- User impact: HIGH
- Priority: **High**

**G-ONB-04 — No employee onboarding checklist for new hires**
- Business value: New employees don't know what to set up; HR spends hours hand-holding
- Technical complexity: Low — role-based checklist on first employee login
- Dependencies: None
- User impact: MEDIUM
- Priority: **Medium**

---

### Gap Area 13 — UI/UX Weaknesses

**G-UX-01 — Inline ternary i18n does not scale**
- Current: `L ? "العربية" : "English"` spread across all components
- Problem: Adding a third language or changing a string requires finding every ternary across the codebase
- Priority: **High** (infrastructure)

**G-UX-02 — RTL/LTR conflict — Layout.tsx forces `dir="ltr"` on mount**
- Current: The main layout hardcodes LTR despite Arabic being the primary language for many users
- Problem: Arabic text in LTR containers renders poorly; affects typography, alignment, icon mirroring
- Priority: **Critical**

**G-UX-03 — No dark mode implementation**
- Current: `next-themes` is installed but dark mode may not be fully wired
- Problem: Saudi users frequently use dark mode; missing it is a UX gap on mobile
- Priority: **Medium**

**G-UX-04 — No loading skeletons on many pages**
- Current: Pages show blank/spinner while data loads
- Problem: Perceived performance is poor; users don't know if data is loading
- Priority: **Medium**

**G-UX-05 — No empty states on many pages**
- Current: Empty lists show nothing when a client has no orders/invoices/projects
- Problem: New users see blank pages with no call to action; increases confusion and drop-off
- Priority: **High**

**G-UX-06 — Large page files mixing logic and JSX**
- Current: `Dashboard.tsx` and others are excessively large
- Problem: Hard to maintain; performance risk from large component trees
- Priority: **Medium** (refactor)

**G-UX-07 — No breadcrumb navigation on deep pages**
- Current: No visual context trail on nested routes
- Problem: Users don't know where they are; back button behaviour is unpredictable
- Priority: **Medium**

**G-UX-08 — Mobile responsiveness limited on complex dashboards**
- Current: Complex data grids and charts are built for desktop
- Problem: Saudi market is mobile-first; Capacitor app exists but web dashboards may not be optimised
- Priority: **High**

**G-UX-09 — No global keyboard shortcut system**
- Current: No keyboard navigation or shortcuts
- Problem: Power users (employees, admins) lose significant productivity
- Priority: **Low**

**G-UX-10 — No in-app help / contextual tooltips**
- Current: FAQ is a separate page; no contextual help where users make decisions
- Problem: Users leave to find answers instead of getting help in context
- Priority: **Medium**

---

### Gap Area 14 — Missing Enterprise Features

**G-ENT-01 — No ZATCA e-invoicing**
Already captured as G-PAY-01. Priority: **Critical** (legal)

**G-ENT-02 — No SSO / SAML for enterprise clients**
- Business value: Enterprise clients require SSO; without it, large accounts cannot be onboarded
- Technical complexity: High — SAML 2.0 or OIDC federation
- Dependencies: Enterprise plan tier
- User impact: HIGH (enterprise segment)
- Priority: **Medium**

**G-ENT-03 — No multi-company / white-label support**
- Business value: Reseller and white-label revenue stream; single-tenant only currently
- Technical complexity: High — `Organization` model; tenant isolation
- Dependencies: Full architecture change
- User impact: HIGH (new revenue stream)
- Priority: **Low** (high complexity)

**G-ENT-04 — No contract management system**
- Business value: Contracts are exchanged off-platform (email PDF); no tracking of versions, expiry, or renewal
- Technical complexity: Medium — `Contract` model, PDF upload or generation, e-sign workflow
- Dependencies: E-sign (G-CJ-08)
- User impact: HIGH (enterprise clients)
- Priority: **High**

**G-ENT-05 — No data export / GDPR right-to-erasure tooling**
- Business value: Required by law for any EU clients; best practice for all; builds trust
- Technical complexity: Medium — export all user data as ZIP; erasure workflow with admin approval
- Dependencies: None
- User impact: MEDIUM (compliance)
- Priority: **Medium**

**G-ENT-06 — No IP allowlist / 2FA enforcement for admin accounts**
- Business value: Admin account compromise is the highest-risk event; 2FA should be mandatory for admin
- Technical complexity: Low — enforce `totpEnabled` for admin role on login; IP whitelist in settings
- Dependencies: TOTP (already exists in auth)
- User impact: HIGH (security)
- Priority: **High**

**G-ENT-07 — No audit log for financial transactions**
- Business value: Who changed an invoice amount? Immutable financial audit trail is a compliance requirement
- Technical complexity: Medium — append-only `FinancialAuditLog` model separate from general activity log
- Dependencies: None
- User impact: HIGH (compliance)
- Priority: **High**

---

### Gap Area 15 — Missing Internal Company Tools

**G-INT-01 — No internal announcement / bulletin board system**
- Business value: Company-wide announcements go to WhatsApp groups; no permanent, searchable record
- Technical complexity: Low — `Announcement` model + employee dashboard widget
- Dependencies: None
- User impact: MEDIUM
- Priority: **Medium**

**G-INT-02 — No internal knowledge base / wiki**
Already captured as G-EMP-06. Priority: **Medium**

**G-INT-03 — No leave / absence management self-service**
- Business value: Employees cannot apply for leave in-system; managers cannot approve digitally
- Technical complexity: Medium — `LeaveRequest` model with approval workflow + calendar view
- Dependencies: `UserModel.vacationBalance` (exists)
- User impact: MEDIUM
- Priority: **Medium**

**G-INT-04 — No performance review system**
- Business value: Annual reviews are off-system; no structured feedback, goals, or growth tracking
- Technical complexity: Medium — `PerformanceReview` model with period, scores, goals, comments
- Dependencies: None
- User impact: MEDIUM
- Priority: **Low**

**G-INT-05 — No meeting notes and action items tracker**
- Business value: QMeet meetings happen but outcomes (decisions, tasks) are not captured in-system
- Technical complexity: Low — `MeetingNote` model linked to QMeet meeting; action items linkable to tasks
- Dependencies: `QMeetModel` (additive)
- User impact: MEDIUM
- Priority: **Medium**

**G-INT-06 — No expense / reimbursement management**
Already captured as G-EMP-08. Priority: **Low**

**G-INT-07 — No vendor / supplier management**
- Business value: Contractors and suppliers are managed off-system; no tracking of deliverables or payments
- Technical complexity: Medium — `Vendor` model with contracts, invoices, contact info
- Dependencies: None
- User impact: LOW
- Priority: **Low**

---

## Part 3 — Prioritised Implementation Roadmap

### Tier 0 — Compliance & Legal (Cannot Ship Without)

| ID | Feature | Complexity | Effort |
|---|---|---|---|
| G-PAY-01 | ZATCA-compliant e-invoicing | High | 3–4 weeks |
| G-PAY-02 | Mada / STC Pay / SADAD payment methods | High | 2–3 weeks |
| G-UX-02 | Fix RTL/LTR direction conflict | Low | 3–5 days |

---

### Tier 1 — Critical (Immediate — Next 4–8 weeks)

| ID | Feature | Complexity | Business Value |
|---|---|---|---|
| G-ORD-05 | Automated order status push notifications | Low | Every client, every order |
| G-CRM-06 | Automated CRM follow-up reminders | Low | Revenue recovery |
| G-CJ-01 | Guided onboarding tour (first login) | Low | Activation rate |
| G-NOT-03 | WhatsApp Business API notifications | High | Saudi market critical |
| G-ENT-06 | Mandatory 2FA for admin accounts | Low | Security |
| G-CJ-02 | Email verification on registration | Low | Data quality |

---

### Tier 2 — High Priority (8–16 weeks)

| ID | Feature | Complexity | Business Value |
|---|---|---|---|
| G-CJ-05 | Client ↔ team real-time project chat | Medium | Retention, trust |
| G-CJ-04 | Client-facing project timeline / milestones | Medium | Transparency |
| G-PM-01 | Milestone tracking + client approval gates | Medium | Scope control |
| G-PM-05 | Client deliverable approval workflow | Medium | Enterprise readiness |
| G-CRM-01 | Automated lead scoring | Medium | Sales efficiency |
| G-CRM-04 | Lead source attribution / UTM tracking | Medium | Marketing ROI |
| G-CRM-05 | Unified contact timeline | Medium | CRM quality |
| G-CRM-07 | Pipeline revenue forecasting | Medium | Sales planning |
| G-EMP-01 | Time tracking per task / project | Medium | Billing accuracy |
| G-EMP-02 | Resource allocation / capacity view | Medium | Project planning |
| G-PAY-03 | Stripe integration | Medium | International clients |
| G-PAY-04 | Automated recurring billing | High | Revenue automation |
| G-PAY-05 | Refund workflow | Medium | Trust & compliance |
| G-PAY-06 | Payment failure recovery / dunning | Medium | Revenue recovery |
| G-QUO-04 | Auto-convert accepted quotation → invoice | Low | Workflow efficiency |
| G-ORD-01 | SLA tracking per order type | Medium | Enterprise expectation |
| G-ORD-04 | Estimated delivery date visible to client | Low | Reduces support volume |
| G-ADM-01 | Real-time operations dashboard | Medium | Ops visibility |
| G-ADM-02 | SLA tracking for support tickets | Medium | Enterprise SLA |
| G-ADM-05 | MRR / subscription analytics | Medium | Business intelligence |
| G-ADM-07 | Conversion funnel analytics | Medium | Product insight |
| G-ANL-01 | Behavioral / product analytics | Medium | Product decisions |
| G-ANL-02 | Conversion funnel tracking | Medium | Growth |
| G-ANL-03 | Retention / churn metrics | Medium | Revenue protection |
| G-NOT-02 | SMS notifications | Medium | Saudi market |
| G-SEO-01 | Dynamic sitemap from DB | Low | Organic SEO |
| G-SEO-02 | Blog / content marketing system | Medium | Long-term SEO |
| G-ONB-02 | Welcome email drip sequence | Low | Activation |
| G-ONB-03 | New client progress checklist | Low | Activation |
| G-CJ-08 | E-signature on quotation acceptance | Medium | Enterprise legal |
| G-ENT-04 | Contract management | Medium | Enterprise readiness |
| G-ENT-07 | Financial audit log | Medium | Compliance |
| G-UX-05 | Empty states across all pages | Medium | New user experience |
| G-UX-08 | Mobile dashboard responsiveness | High | Saudi mobile-first |

---

### Tier 3 — Medium Priority (16–32 weeks)

| ID | Feature | Complexity |
|---|---|---|
| G-EMP-03 | Sprint / iteration planning | Medium |
| G-EMP-04 | Task dependency mapping | Medium |
| G-EMP-05 | Automated weekly project report to client | Low |
| G-EMP-06 | Internal knowledge base / wiki | Medium |
| G-PM-02 | Gantt / timeline view | Medium |
| G-PM-03 | Project budget tracking | Medium |
| G-PM-04 | Project template library | Low |
| G-CRM-02 | Automated email sequences from CRM | High |
| G-CRM-03 | Duplicate lead detection | Low |
| G-CRM-08 | CRM ↔ email campaign integration | Medium |
| G-QUO-01 | Quotation version control | Low |
| G-QUO-03 | Quotation expiry notifications | Low |
| G-QUO-05 | Multi-option quotations | Medium |
| G-ADM-03 | Bulk operations on orders / clients | Low |
| G-ADM-06 | Customer health score | Medium |
| G-ADM-08 | Scheduled automated PDF reports | Medium |
| G-ANL-04 | Revenue forecasting | Medium |
| G-ANL-05 | Employee productivity analytics | Medium |
| G-NOT-01 | User notification preferences | Low |
| G-NOT-05 | In-app notification filtering | Low |
| G-SEO-03 | Review / testimonial schema markup | Low |
| G-SEO-04 | Service schema markup | Low |
| G-ORD-02 | Post-completion satisfaction survey | Low |
| G-CJ-06 | Client NPS survey | Low |
| G-CJ-07 | Client knowledge base | Medium |
| G-CJ-09 | Prospect demo / sandbox mode | Medium |
| G-CJ-10 | Self-service order modification requests | Low |
| G-PAY-07 | Milestone-linked payment schedules | Medium |
| G-ONB-04 | Employee onboarding checklist | Low |
| G-INT-01 | Internal announcement system | Low |
| G-INT-03 | Leave / absence management | Medium |
| G-INT-05 | Meeting notes + action items | Low |
| G-UX-03 | Dark mode | Medium |
| G-UX-04 | Loading skeletons | Medium |
| G-UX-07 | Breadcrumb navigation | Low |
| G-UX-10 | Contextual in-app help tooltips | Medium |
| G-ENT-05 | Data export / right-to-erasure | Medium |

---

### Tier 4 — Low Priority (32+ weeks or strategic decision)

| ID | Feature | Complexity |
|---|---|---|
| G-ADM-04 | Configurable automation rules engine | High |
| G-ANL-06 | Custom report builder | High |
| G-ENT-02 | SSO / SAML for enterprise | High |
| G-ENT-03 | Multi-company / white-label | High |
| G-EMP-07 | Employee attendance self-service | Low |
| G-EMP-08 | Expense report submission | Medium |
| G-INT-04 | Performance review system | Medium |
| G-INT-06 | Expense / reimbursement management | Medium |
| G-INT-07 | Vendor / supplier management | Medium |
| G-ORD-03 | Order cloning | Low |
| G-NOT-04 | Notification digest / batching | Medium |
| G-UX-01 | i18n externalization | High |
| G-UX-06 | Page component refactoring | Medium |
| G-UX-09 | Keyboard shortcut system | Low |

---

## Part 4 — Summary Scorecard

| Area | Current State | Biggest Gap | Priority |
|---|---|---|---|
| Customer Journey | Functional but passive | No onboarding tour, no proactive comms | Critical |
| Employee Workflow | Good core tools | No time tracking, no resource planning | High |
| Admin Workflow | Solid reporting | No live ops, no SLA tracking | High |
| CRM | Pipeline exists | No scoring, no automation, no attribution | Critical |
| Project Management | Basic tracking | No milestones, no Gantt, no client approvals | High |
| Quotation Flow | Functional | No e-sign, no auto-invoice, no versioning | High |
| Order Lifecycle | Core works | No SLA, no ETA display, no auto-notify | Critical |
| Payment | PayPal + Wallet | No local Saudi payment, no ZATCA | Critical |
| Notifications | Excellent 3-layer | No WhatsApp API, no SMS, no preferences | Critical |
| SEO | Good foundation | No dynamic sitemap, no blog, no schema | High |
| Analytics | Basic BI | No behavioral data, no funnel, no churn | High |
| Onboarding | Exists but not triggered | No drip, no checklist, no tour | Critical |
| UI/UX | Polished design | RTL bug, no empty states, mobile gaps | High |
| Enterprise Features | Minimal | No ZATCA, no e-sign, no 2FA enforcement | Critical |
| Internal Tools | Partial | No wiki, no leave management, no announcements | Medium |

---

*No production code was modified. This is a read-only audit.*
