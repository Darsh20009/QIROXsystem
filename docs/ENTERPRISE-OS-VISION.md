# QIROX Enterprise Operating System — Product Architecture

**Version:** 1.0  
**Classification:** Strategic Vision — No code modified  
**Date:** July 2026

---

## Vision Statement

QIROX is not a client portal. QIROX is the complete operating system of QIROX Studio — a fully integrated digital headquarters that runs every department of the company from a single platform. Every team member, every workflow, every client interaction, every financial transaction, every piece of content, and every business decision flows through and is measured by the QIROX OS.

The platform serves three constituencies simultaneously:
- **Internal teams** — the complete digital workplace for every department
- **Clients** — a transparent, world-class client experience
- **Leadership** — real-time visibility into the entire organisation

---

## Platform Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    QIROX ENTERPRISE OS                       │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  LEADERSHIP  │   DELIVERY   │   BUSINESS   │  INTELLIGENCE  │
│              │              │              │                │
│  Executive   │  Operations  │  Sales       │  Analytics     │
│  Management  │  Project Mgmt│  CRM         │  AI Platform   │
│  Investor    │  Customer    │  Finance     │  SEO Platform  │
│  Relations   │  Success     │  Marketing   │                │
├──────────────┴──────────────┴──────────────┴────────────────┤
│                      PEOPLE & CULTURE                        │
│  Human Resources  │  Employee Experience  │  Knowledge Base  │
│  SOP Management   │  Internal WhatsApp    │                  │
├──────────────────────────────────────────────────────────────┤
│                    BRAND & PRESENCE                          │
│  Brand Center  │  Company Presentation  │  Events Platform   │
│  Media Library │  Company Assets        │                    │
├──────────────────────────────────────────────────────────────┤
│                    PLATFORM FOUNDATION                       │
│              QAdmin — System Administration                  │
└──────────────────────────────────────────────────────────────┘
```

---

## Department 1 — Executive Management

### Purpose
The strategic nerve centre of QIROX. Provides leadership with a live, unified view of the entire company — financial health, team performance, client satisfaction, growth metrics, risks, and opportunities — without requiring them to visit multiple dashboards.

### Users
- CEO
- CTO
- CFO
- COO
- Board observers (read-only)

### Features
- **Executive Command Centre:** Single-screen real-time overview of all KPIs across every department
- **Strategic Goal Tracker:** OKR management (Objectives and Key Results) with cascading from company → department → individual
- **Board Report Generator:** Auto-compiled monthly/quarterly PDF reports from live data (revenue, headcount, pipeline, NPS, churn)
- **Risk Register:** Live risk log with severity, owner, mitigation status — auto-escalates unresolved risks
- **Decision Log:** Record of major decisions made, rationale, outcome tracking
- **Company Scorecard:** Weighted health score across Financials, Delivery, People, Clients, and Growth
- **Competitor Intelligence Feed:** Curated external signals (news, pricing changes, new entrants)
- **Executive Calendar:** Integrated view of all board meetings, client QBRs, and department reviews
- **Approval Gateway:** Centralized approval queue for cross-departmental decisions (large contracts, budget overruns, headcount requests)

### Dashboards
- **Live Company Health Dashboard** — revenue run rate, cash runway, headcount, active projects, open risks
- **OKR Progress Dashboard** — all objectives with red/amber/green status
- **Department Scorecard** — each department's KPIs in one comparative view
- **Monthly Board Pack** — auto-generated, formatted for presentation

### Required Integrations
- All 22 other departments (data aggregation)
- Finance department (P&L, cash flow)
- HR department (headcount, attrition)
- CRM (pipeline value)
- Analytics & Intelligence

### KPIs
- Monthly Recurring Revenue (MRR)
- Revenue growth rate (MoM, YoY)
- EBITDA margin
- Client Net Promoter Score (NPS)
- Employee Net Promoter Score (eNPS)
- OKR completion rate
- Cash runway (months)
- Active client count
- Risk items unresolved > 30 days

### Dependencies
- Finance (revenue, costs)
- HR (headcount)
- CRM (pipeline)
- Customer Success (NPS, churn)
- Analytics & Intelligence (aggregated metrics)

---

## Department 2 — Operations

### Purpose
The operational backbone of QIROX Studio. Manages all active work in flight — every order, every project, every delivery, every SLA commitment — ensuring the company delivers on its promises. Operations is the team that turns sales into satisfaction.

### Users
- Operations Manager
- Project Coordinators
- Delivery Managers
- Admin / Office Manager

### Features
- **Operations Command Centre:** Live board of all active orders and projects — status, SLA countdown, assigned team, blockers
- **Order Queue Management:** Intake, triage, assignment, and routing of new orders to the right team
- **SLA Engine:** Configurable SLA rules per service type and plan tier; automatic breach alerts and escalations
- **Capacity Dashboard:** Real-time view of team load across all active projects (integrated with HR and PM)
- **Delivery Checklist System:** Standardised per-project checklists that must be completed before status advances
- **Vendor / Subcontractor Management:** Track external partners, their deliverables, payments, and performance
- **Shipment & Fulfillment Tracking:** For physical deliverables (hardware, branded materials, printed assets)
- **Quality Control Workflow:** Pre-delivery QA approval stage with inspector assignment
- **Operations Playbook:** Linked to SOP Management department — every operational process has a documented SOP
- **Incident Management:** When something goes wrong — log, categorise, assign, resolve, and post-mortem
- **Escalation Matrix:** Defines who to notify at each severity level automatically

### Dashboards
- **Live Operations Board** — all active work in one Kanban/swimlane view
- **SLA Health Dashboard** — % of orders within SLA, at risk, breached
- **Capacity Heatmap** — resource load by team member
- **Incident Tracker** — open incidents, severity, time-to-resolution

### Required Integrations
- Project Management (project status)
- HR (resource availability)
- Finance (cost tracking per order)
- Customer Success (client satisfaction signals)
- Notifications (automated SLA alerts)
- WhatsApp Platform (operational comms)

### KPIs
- On-time delivery rate (%)
- SLA breach rate (%)
- Average time from order to delivery
- Re-open rate (delivered then rejected)
- Active projects per coordinator
- Incident resolution time
- Subcontractor on-time rate

### Dependencies
- Project Management (project data)
- HR (team capacity)
- Finance (cost data)
- SOP Management (process documentation)

---

## Department 3 — Sales

### Purpose
The revenue engine. Manages the full commercial journey from qualified lead to signed contract — quotations, proposals, pricing approvals, deal negotiations, contract execution, and handoff to Customer Success. Distinct from CRM which manages the relationship pipeline; Sales manages the commercial conversion mechanics.

### Users
- Sales Manager
- Sales Representatives
- Sales Coordinator
- Commercial Director

### Features
- **Sales Pipeline Board:** Opportunity-level Kanban with deal value, close probability, and next action
- **Quotation Studio:** Rich quotation builder — itemised pricing, multi-tier options (Good/Better/Best), VAT, custom line items, Arabic/English bilingual output
- **Proposal Builder:** Branded proposal generation with cover page, case studies, team bios, pricing, and terms — one-click PDF or shareable link
- **Deal Room:** Per-deal collaboration space where internal team works on an opportunity (comments, files, tasks)
- **Pricing Approval Workflow:** Discounts beyond threshold require manager approval before quotation is sent
- **E-Signature:** Quotation and contract digital acceptance with timestamp, IP, audit trail — legally binding
- **Contract Management:** Version-controlled contracts; expiry alerts; renewal workflow
- **Commission Calculator:** Auto-calculates commission per deal per sales rep based on configurable rules
- **Sales Forecast:** Weighted pipeline forecast (deal value × close probability by stage)
- **Win/Loss Analysis:** Auto-prompts closure reason on every deal — builds a database of why QIROX wins and loses
- **Competitor Tracking:** Per-deal field to log which competitors were in the deal
- **Product Catalogue:** Internal pricing book with plans, addons, and custom service definitions
- **Sales Playbook:** Linked to SOP — scripts, objection handling, discovery questions per product

### Dashboards
- **Sales Performance Dashboard** — individual and team quota attainment, pipeline coverage ratio
- **Revenue Forecast Dashboard** — this month, this quarter, this year (weighted + committed)
- **Deal Velocity Dashboard** — average time per stage, conversion rates stage-to-stage
- **Commission Report** — per-rep earnings, YTD totals

### Required Integrations
- CRM (lead handoff from Qualified stage)
- Finance (invoice trigger on deal close, commission payment)
- Customer Success (deal handoff on contract signature)
- Email Domain (proposal/quotation emails)
- WhatsApp Platform (deal communications)
- E-Signature system
- Brand Center (proposal templates)

### KPIs
- Monthly revenue closed (SAR)
- Quota attainment (%)
- Pipeline coverage ratio (pipeline ÷ quota)
- Average deal size
- Sales cycle length (days)
- Win rate (%)
- Average discount granted (%)
- Proposals sent → contracts signed conversion rate

### Dependencies
- CRM (qualified leads)
- Finance (pricing, invoicing)
- Brand Center (proposal design assets)
- SOP Management (sales process)

---

## Department 4 — CRM

### Purpose
The relationship intelligence layer. Tracks every person and company that has ever interacted with QIROX — from first website visit to long-term client to lapsed contact — and ensures no relationship is neglected. CRM feeds Sales with qualified opportunities and feeds Customer Success with client context.

### Users
- Sales Representatives
- Sales Manager
- Customer Success Managers
- Marketing Team (for segmentation)
- Business Development

### Features
- **Contact Database:** Every lead, client, partner, and prospect with full profile (company, role, LinkedIn, WhatsApp, source, tags)
- **Company Database:** Organisation-level records linking multiple contacts; industry, size, revenue, tech stack
- **Lead Pipeline:** Kanban stages — New → Contacted → Qualified → Proposal Sent → Negotiation → Won → Lost → Dormant
- **Lead Scoring Engine:** Configurable scoring rules (source value + engagement + company fit + activity frequency) → auto-score displayed on every lead
- **UTM / Source Attribution:** Every lead tagged with source, medium, campaign, content from first touch
- **Activity Timeline:** Every interaction (call, email, WhatsApp, meeting, note, LinkedIn message) in one chronological feed per contact
- **Automated Follow-up Alerts:** Fires in-app + WhatsApp + push notification when a follow-up date arrives or a lead goes cold
- **Sequence Engine:** Multi-step automated outreach sequences (email + WhatsApp + task reminder) assigned per stage or trigger
- **Duplicate Detection:** Fuzzy-match on email, phone, and name at entry time; merge tool for duplicates
- **Lead Import / Enrichment:** CSV import, manual entry, public form capture, LinkedIn scrape (manual paste)
- **Lead → Client Conversion:** One-click conversion creates client account; preserves full CRM history
- **Segmentation Builder:** Dynamic segments (Qualified leads in Riyadh, company size > 50, source = referral)
- **WhatsApp CRM:** Template-based one-click WhatsApp outreach per lead with response tracking
- **Referral Tracking:** Links referral source contacts to converted clients

### Dashboards
- **Pipeline Dashboard** — stage-by-stage counts and values, conversion rates
- **Lead Source Dashboard** — which channels produce the most and highest-value leads
- **Activity Dashboard** — calls made, emails sent, WhatsApps sent per rep per day/week
- **Scoring Leaderboard** — highest-scored unworked leads surfaced daily

### Required Integrations
- Sales (Qualified → Opportunity handoff)
- Marketing (campaign-sourced leads; segmentation for campaigns)
- WhatsApp Platform (outreach)
- Email Domain (sequences)
- Analytics & Intelligence (attribution reporting)
- Customer Success (post-conversion context)

### KPIs
- Total leads in pipeline
- Lead-to-opportunity conversion rate
- Opportunity-to-close conversion rate
- Average lead score at conversion
- Follow-up compliance rate (% of due follow-ups actioned same day)
- Leads by source (%)
- Pipeline value (SAR)
- Lead response time (minutes from inbound to first contact)

### Dependencies
- Marketing (lead generation)
- Sales (opportunity conversion)
- WhatsApp Platform (communication)
- Email Domain (sequences and follow-ups)

---

## Department 5 — Customer Success

### Purpose
The department that ensures every client who buys from QIROX gets value, stays, and grows. Customer Success is the bridge between Sales (who close the deal) and Operations (who deliver the work) — managing the relationship post-signature to drive retention, expansion, and referrals.

### Users
- Customer Success Managers (CSMs)
- Account Managers
- Support Team
- Client Onboarding Specialists

### Features
- **Client Health Score:** Composite real-time score per client (login frequency, project progress, ticket volume, payment health, NPS response, last CSM contact) — Red/Amber/Green
- **Client Portfolio View:** Every CSM's assigned clients in one view with health scores, contract values, and renewal dates
- **Onboarding Programme:** Structured multi-step onboarding plan per client (welcome call → portal tour → first project milestone → 30-day check-in) with task assignments and due dates
- **Renewal Management:** Contract renewal pipeline — approaching renewals, renewal probability, CSM action tasks
- **Expansion Tracking:** Upsell and cross-sell opportunities per client; logs CSM-identified expansion triggers
- **Churn Risk Register:** Clients with declining health score auto-enter a churn risk list with intervention templates
- **QBR (Quarterly Business Review) Builder:** Auto-populates QBR presentation with client's usage data, project outcomes, ROI summary, and next-quarter plan
- **Support Ticket Management:** Client-raised tickets with priority, SLA, assignment, and resolution tracking
- **NPS & CSAT Surveys:** Automated post-project NPS, post-support CSAT, and quarterly relationship NPS — results linked to client health score
- **Client Knowledge Base:** Per-client documentation space (their processes, preferences, past decisions)
- **Escalation Management:** Formal escalation workflow when a client is at risk — CSM → Manager → Executive
- **Voice of Customer Log:** Structured capture of client feedback, feature requests, and complaints; fed into product roadmap
- **Client Success Stories:** Internal library of client outcomes used by Marketing and Sales

### Dashboards
- **Client Health Dashboard** — all clients by health colour, trend, and at-risk alerts
- **Renewal Dashboard** — upcoming renewals, value at risk, renewal probability
- **NPS Dashboard** — score trend, promoters vs. detractors, verbatim themes
- **Ticket SLA Dashboard** — open tickets, breaches, average resolution time
- **Expansion Pipeline** — identified upsell opportunities by client

### Required Integrations
- CRM (client context from pre-sale)
- Project Management (project health signals)
- Finance (contract value, payment health)
- Operations (delivery performance)
- Email Domain (automated surveys, QBR sharing)
- WhatsApp Platform (client communication)
- Analytics (product usage per client)

### KPIs
- Net Revenue Retention (NRR)
- Gross Revenue Retention (GRR)
- Client NPS (by segment)
- Time-to-value (days from contract to first milestone)
- Churn rate (%)
- Ticket resolution SLA compliance (%)
- QBR coverage (% of enterprise clients with QBR in last 90 days)
- CSM-to-client ratio

### Dependencies
- Sales (deal handoff)
- Operations (delivery quality)
- Finance (contract and payment data)
- Project Management (project health)

---

## Department 6 — Project Management

### Purpose
The delivery engine at the task level. While Operations manages the high-level fulfilment queue, Project Management handles the granular execution — every sprint, every task, every milestone, every deliverable — ensuring work is planned, tracked, and completed to specification.

### Users
- Project Managers
- Team Leads (Development, Design, Content)
- Individual Contributors (Developers, Designers, Copywriters)
- Clients (read-only access to their project workspace)

### Features
- **Project Workspace:** Per-project hub with overview, progress %, phases, team roster, and linked client portal view
- **Milestone Planner:** High-level project phases with target dates, owner, and client approval gate
- **Task Management:** Full task CRUD with assignee, priority, status, due date, estimated hours, dependencies (blocked-by / blocks), checklist sub-tasks
- **Sprint / Iteration Planning:** Sprint board with capacity allocation, velocity tracking, and burndown chart
- **Kanban Board:** Per-project visual task flow (To Do → In Progress → Review → Done)
- **Gantt / Timeline View:** Horizontal timeline showing tasks, milestones, and critical path
- **Time Tracking:** Per-task start/stop timer + manual entry; links to billing and payroll
- **Deliverable Management:** Upload/share a deliverable → client notified → client approves or rejects with comments
- **Issue Tracker:** Client or team-raised issues with severity, owner, and resolution workflow
- **Project Budget Tracker:** Budget vs. actual spend (time + direct costs)
- **Resource Allocation View:** Who is working on what, when, and at what capacity across all projects
- **Project Templates:** Pre-built project structures for Website, Mobile App, Brand Identity, Marketing Campaign, etc.
- **Meeting Management:** Schedule, agenda, notes, and action items linked to the project; integrated with QMeet
- **Risk Log:** Per-project risks with likelihood, impact, and mitigation
- **Project Archive:** Completed projects preserved with all assets, decisions, and learnings
- **Client Update Posts:** CSM or PM posts a structured weekly update visible to the client in their portal

### Dashboards
- **Portfolio Dashboard** — all active projects: health, progress %, SLA status, budget vs. actuals
- **Sprint Dashboard** — current sprint: velocity, burndown, blocking issues
- **Resource Heatmap** — team capacity across next 4 weeks
- **Delivery Quality Dashboard** — re-open rates, client rejection rates, issue frequency

### Required Integrations
- Operations (project intake from order)
- HR (team capacity, leave calendar)
- Finance (time entries → billing; budget tracking)
- Customer Success (project health → client health score)
- AI Platform (task estimation, risk prediction)
- QMeet (meeting scheduling)

### KPIs
- On-time milestone delivery rate (%)
- Client deliverable acceptance rate (first submission)
- Average sprint velocity
- Budget variance (%)
- Issue resolution time
- Team utilisation rate (%)
- Overdue task rate (%)

### Dependencies
- Operations (order-to-project intake)
- HR (team availability)
- Finance (billing against time logged)
- Customer Success (client satisfaction linkage)

---

## Department 7 — Finance

### Purpose
The financial operating system of QIROX. Covers every monetary flow — client invoicing, payment processing, payroll, expense management, tax compliance (including ZATCA), financial reporting, and cash flow forecasting. Finance ensures the company is paid, compliant, and financially visible.

### Users
- CFO / Finance Director
- Accountant
- Payroll Administrator
- Finance Analyst

### Features
- **Invoice Management:** Auto-generate invoices from orders and accepted quotations; manual invoice creation; line-item detail; VAT calculation; status tracking (Draft → Sent → Paid → Void)
- **ZATCA E-Invoicing:** Phase 2 compliant XML invoice generation with QR code; integration with ZATCA Fatoora portal; UBL 2.1 format; sequential invoice numbering; cryptographic signing
- **Payment Processing:** Mada, STC Pay, SADAD (via Moyasar or HyperPay), PayPal, bank transfer, wallet deduction — all in one payment gateway layer
- **Qirox Pay Wallet:** Client virtual wallet — top-up (bank transfer, card, PayPal), OTP-secured payments, cashback crediting
- **Subscription Billing Engine:** Recurring charges for addon subscriptions with automated retry on failure (dunning)
- **Refund Management:** Refund request workflow — client initiates → finance reviews → gateway refund executed → audit record
- **Expense Management:** Employee expense submission with receipt upload → manager approval → payment via payroll or direct
- **Payroll Engine:** Monthly payroll calculation (base + allowances + commissions + deductions + overtime); bulk payment export (bank file); payslip generation per employee
- **Commission Management:** Configurable commission rules per plan/product/sales rep; auto-calculate at deal close; included in payroll
- **Financial Statements:** Auto-generated P&L, Balance Sheet, Cash Flow statement from transaction data
- **Revenue Recognition:** Recognise revenue at delivery milestones, not invoice date
- **Tax Management:** VAT registration tracking; VAT return preparation; input vs. output VAT reconciliation
- **Bank Reconciliation:** Match bank statement transactions to system invoices and expenses
- **Budget Management:** Department budgets set by CFO; actual spend tracked in real time; variance alerts
- **Cash Flow Forecast:** 13-week rolling cash flow projection (receivables in, payables out)
- **Financial Audit Log:** Immutable ledger of every financial event — who created/modified/deleted any financial record, with original values

### Dashboards
- **Finance Command Centre** — live cash position, overdue receivables, MTD revenue vs. target
- **Revenue Dashboard** — MRR, ARR, new business revenue, expansion revenue, churn revenue
- **Payroll Dashboard** — upcoming payroll, total cost, cost per department
- **ZATCA Compliance Dashboard** — e-invoice generation rate, submission status, errors
- **Expense Dashboard** — submitted, pending approval, approved this month

### Required Integrations
- Sales (quotation → invoice trigger)
- Operations (order completion → invoice)
- HR (payroll data, expense approvals)
- Project Management (time entries → billing)
- Payment gateways: Moyasar/HyperPay (Mada, STC Pay, SADAD), PayPal, Stripe
- ZATCA Fatoora API
- Bank APIs (for reconciliation)
- Executive Management (financial reporting)

### KPIs
- Accounts receivable days (DSO)
- Revenue collected vs. invoiced (%)
- Payroll accuracy rate (%)
- ZATCA compliance rate (% of invoices submitted successfully)
- Expense approval cycle time
- Budget variance by department
- Cash runway (months)
- Overdue invoices (count + value)

### Dependencies
- Sales (deal close triggers invoice)
- Operations (delivery triggers revenue recognition)
- HR (payroll inputs)
- Payment gateway providers (external)
- ZATCA (regulatory)

---

## Department 8 — Human Resources

### Purpose
The people infrastructure of QIROX. Manages the entire employee lifecycle — from job posting to offboarding — including recruitment, onboarding, attendance, leave, performance, training, culture, and compliance. HR ensures QIROX attracts, develops, and retains top talent.

### Users
- HR Manager
- HR Coordinator
- Department Managers (for approvals)
- All Employees (self-service)

### Features
- **Employee Directory:** Full profile per employee — photo, role, department, manager, hire date, contact info, emergency contacts, bank info, national ID, skills, certifications
- **Recruitment Pipeline:** Job requisition → job posting (linked to public /jobs page) → application tracking → interview scheduling → offer management → acceptance → onboarding
- **Onboarding Programme:** Per-role checklist triggered on hire date — IT setup, contract signing, system access, buddy assignment, first-week schedule
- **Attendance Management:** Daily check-in/out (biometric via face-api.js or QR code); late/absent detection; attendance reports by employee and department
- **Leave Management:** Leave types (annual, sick, emergency, unpaid, maternity/paternity); application → manager approval → calendar update; balance tracking; carryover rules
- **Performance Management:** Goal setting (linked to OKRs), mid-year check-in, annual review cycle; 360° feedback collection; performance rating; PIP workflow for underperformers
- **Payroll Data:** Feeds Finance with salary structures, deductions, allowances, and changes
- **Training & Development:** Training plan per employee; course tracking; certification expiry reminders; skills gap analysis
- **Document Management:** Employment contracts, NDAs, policies — stored per employee; expiry alerts for visas/iqamas/licences
- **Offboarding:** Resignation → notice period → exit interview → asset return checklist → system access revocation → final settlement
- **HR Policies Library:** All company policies (annual leave, code of conduct, expense policy) — versioned, acknowledged by employees
- **Organisation Chart:** Live org chart generated from reporting relationships
- **Headcount Planning:** Budget vs. actual headcount by department; open position tracking

### Dashboards
- **HR Command Centre** — headcount, attrition, open positions, upcoming leave, expiring documents
- **Attendance Dashboard** — daily attendance rate, late arrivals, absent employees
- **Performance Dashboard** — review cycle completion rate, average scores, top performers
- **Recruitment Dashboard** — open positions, applications in pipeline, time-to-hire

### Required Integrations
- Finance (payroll data export)
- Employee Experience (internal comms, announcements)
- Project Management (availability calendar)
- Executive Management (headcount reporting)
- Marketing / Brand Center (job posting design)
- Public site /jobs page (live job listings)

### KPIs
- Employee attrition rate (%)
- Time-to-hire (days)
- Offer acceptance rate (%)
- Attendance rate (%)
- Training hours per employee per quarter
- Performance review completion rate (%)
- eNPS (Employee Net Promoter Score)
- Open position fill time

### Dependencies
- Finance (salary, payroll)
- Executive Management (OKRs, headcount budget)
- Employee Experience (culture, engagement)

---

## Department 9 — Marketing

### Purpose
The demand generation engine. Attracts, engages, and nurtures prospects through every channel — content, social, email, paid, events, and partnerships — and hands qualified leads to CRM. Marketing also manages the company's public brand story, campaign calendar, and market presence.

### Users
- Marketing Manager
- Content Creator / Copywriter
- Social Media Specialist
- Growth / Performance Marketer
- Graphic Designer (linked to Brand Center)

### Features
- **Campaign Manager:** Create, schedule, and track multi-channel campaigns (email + social + paid + WhatsApp) from a single calendar
- **Lead Generation Forms:** Configurable landing page forms with UTM auto-capture → direct push to CRM
- **Email Marketing Engine:** Campaign list management, HTML template editor, send scheduling, open/click tracking, unsubscribe handling, A/B subject line testing
- **Social Media Calendar:** Content calendar with platform-specific scheduling (Instagram, LinkedIn, Twitter/X, Snapchat, TikTok); asset linking from Media Library
- **Paid Advertising Dashboard:** UTM-tagged campaign tracking; ROI per ad spend (integrated with GA4 and Meta Pixel)
- **Blog / Content Platform:** Article creation with SEO metadata, category/tags, author profiles, bilingual (AR/EN), publish scheduling — feeds public /blog route
- **SEO Tools:** Linked to SEO Platform department — content brief creation, keyword targeting per article
- **Event Promotion:** Linked to Events Platform — promotional materials, registration landing pages, post-event follow-up sequences
- **Marketing Automation:** Trigger-based workflows (lead fills form → add to CRM → start email sequence → assign to sales rep after 3 days if no response)
- **Influencer / Partnership Tracker:** Track partnership agreements, deliverables, and ROI per partner
- **Brand Voice Guide:** Linked to Brand Center — approved copy styles, tone guidelines, translated phrases
- **Marketing Budget Tracker:** Campaign spend vs. budget vs. pipeline generated
- **Testimonial & Case Study Manager:** Collect, approve, and publish client success stories → feeds Sales proposals

### Dashboards
- **Marketing Performance Dashboard** — leads generated by channel, CPL (cost per lead), MQLs this month
- **Campaign Dashboard** — active campaigns, send stats, conversion rates
- **Content Calendar** — published vs. scheduled vs. draft content across all channels
- **SEO Traffic Dashboard** — linked from SEO Platform

### Required Integrations
- CRM (lead handoff, UTM attribution)
- Email Domain (campaign sends)
- WhatsApp Platform (WhatsApp broadcast campaigns)
- Analytics & Intelligence (attribution, funnel)
- Brand Center (assets, templates)
- Media Library (images, videos)
- Events Platform (event promotion)
- SEO Platform (content SEO)
- Meta Pixel, TikTok Pixel, GA4, GTM (tracking)

### KPIs
- Marketing Qualified Leads (MQLs) per month
- Cost Per Lead (CPL) by channel
- Email open rate / click rate / unsubscribe rate
- Social engagement rate
- Organic traffic growth (MoM)
- Marketing-sourced pipeline value (SAR)
- Campaign ROI
- Content pieces published per month

### Dependencies
- CRM (lead intake)
- Brand Center (visual identity)
- Media Library (content assets)
- SEO Platform (organic strategy)
- Analytics & Intelligence (attribution data)

---

## Department 10 — Brand Center

### Purpose
The single source of truth for the QIROX brand. Every team member, in every department, uses the Brand Center to access approved logos, colour palettes, typography, templates, tone guidelines, and design assets — ensuring brand consistency across every touchpoint without depending on the design team for every request.

### Users
- All Employees (asset access)
- Graphic Designers (asset management)
- Brand Manager
- Marketing Team (template usage)
- Sales (proposal templates)

### Features
- **Brand Guidelines Hub:** Complete brand standards document — logo usage rules, colour codes (HEX/CMYK/Pantone/RGB), typography stack, spacing rules, do's and don'ts, Arabic calligraphy guidelines
- **Logo Library:** All logo variants (primary, white, dark, icon-only, Arabic, English, horizontal, stacked) in all formats (SVG, PNG, EPS, PDF) — version-controlled, deprecated versions archived
- **Colour Palette Manager:** Named colours with all format codes; usage context (primary, secondary, accent, background, text)
- **Typography Library:** Approved typefaces with licensing info, download links, usage rules per context (heading, body, Arabic body)
- **Template Library:** Ready-to-use branded templates — proposal covers, presentation decks, social media posts (Instagram square/story/reel, LinkedIn, Twitter/X, Snapchat), email newsletter, letterhead, invoice, business card, ID card, event banner, outdoor advertising
- **Canva Integration:** Templates published directly to Canva workspace so any team member can customise without design skills
- **Design Asset Library:** Illustrations, icons, photography, pattern library — all cleared for use, tagged and searchable
- **Brand Approval Workflow:** Anything produced for external use can be submitted for Brand Manager approval before publishing
- **Brand Usage Tracker:** Log of where brand assets have been used (campaigns, proposals, event materials) — ensures consistency and version control
- **Campaign Asset Tracker:** Per-campaign collection of all produced assets with usage rights and expiry

### Dashboards
- **Brand Asset Usage Dashboard** — most downloaded assets, frequently used templates, stale/deprecated assets flagged
- **Brand Review Queue** — assets pending Brand Manager approval

### Required Integrations
- Marketing (campaign assets)
- Sales (proposal templates)
- Media Library (shared asset storage)
- Events Platform (event materials)
- Company Presentation (deck templates)
- Canva API (template sync)

### KPIs
- Brand standard compliance rate (% of reviewed materials passing without edits)
- Template usage rate (% of materials created using approved templates vs. ad-hoc)
- Asset download volume
- Brand approval turnaround time

### Dependencies
- Media Library (file storage and retrieval)
- Marketing (primary consumer)
- Sales (proposal materials)

---

## Department 11 — Company Presentation

### Purpose
The company's formal face to the world — investors, partners, enterprise clients, media, and strategic prospects. Manages the company profile, pitch decks, capability statements, awards, credentials, and all materials used in formal business development and media relations contexts.

### Users
- CEO / Executive Team
- Sales (enterprise-tier proposals)
- Marketing (PR and media)
- Business Development
- Investor Relations

### Features
- **Company Profile Builder:** The official QIROX company profile — mission, vision, history, team, products, clients, credentials — bilingual (AR/EN) — output as PDF or web page
- **Pitch Deck Library:** All versions of investor, partner, client, and media pitch decks — version-controlled with change log; access-controlled by audience type
- **Capability Statement Generator:** One-page capability documents auto-populated from product catalogue and client success stories
- **Awards & Certifications Tracker:** All industry awards, ISO certifications, regulatory licences — with expiry dates and renewal reminders
- **Media Kit:** Press release templates, company fact sheet, leadership bios, official photography — packaged for media requests
- **Case Study Library:** Client success stories formatted for different audiences (investor, enterprise buyer, SMB prospect) — pulled from Customer Success
- **Partnership Deck Builder:** Customisable partnership proposal deck per potential partner type
- **Corporate Video Library:** Linked to Media Library — official company reels, product demos, testimonial videos
- **Presentation Approval Workflow:** Any presentation going to external audiences requires Executive review before use
- **NDR (Non-Disclosure Register):** Track which companies have signed NDAs; document storage and expiry alert

### Dashboards
- **Asset Availability Dashboard** — which presentation assets are current vs. outdated
- **Media Request Tracker** — inbound media/press enquiries and their status

### Required Integrations
- Brand Center (design standards)
- Media Library (video and image assets)
- Customer Success (case studies)
- Investor Relations (financial data for investor decks)
- Sales (client-facing capability statements)

### KPIs
- Presentation hit rate in enterprise deals (% of enterprise deals where capability statement was sent)
- Media kit response rate
- Certification expiry compliance (0 lapsed certifications)
- Deck version freshness (no deck older than 6 months without review)

### Dependencies
- Brand Center (visual identity)
- Customer Success (success stories)
- Investor Relations (financial narrative)

---

## Department 12 — Events Platform

### Purpose
Manages the full lifecycle of every QIROX event — online and offline — from ideation to execution to post-event follow-up. Events are a primary lead generation and brand awareness vehicle. The platform handles registration, attendance, recordings, and CRM integration.

### Users
- Events Manager
- Marketing Team
- Sales (lead capture)
- CRM (attendee import)
- All Employees (as speakers / participants)

### Features
- **Event Builder:** Create events with type (webinar, workshop, networking, conference, product launch), date/time, capacity, speakers, agenda, registration page
- **Registration Management:** Custom registration forms; auto-confirmation email; calendar invite (.ics) dispatch; waiting list management
- **QMeet Integration:** Online events run natively on QIROX QMeet — no external tool needed; lobby, breakout rooms, recording
- **Ticket & Pricing:** Free, paid (Mada/PayPal), or gated (client-only, invite-only) event types
- **Attendee Management:** Check-in (QR code scan), attendance tracking, no-show logging
- **Live Event Tools:** Polls, Q&A, live chat, presenter notes (within QMeet integration)
- **Recording Library:** Post-event recordings stored in Media Library with access controls; linked to events for on-demand replay
- **Post-Event Automation:** Auto-send thank-you + recording + survey to attendees; auto-send missed-you + recording to no-shows; auto-import attendees as CRM leads
- **Speaker Management:** Speaker profiles, bio, photo, session slots, confirmation workflow, green room access
- **Event Analytics:** Registration rate, attendance rate, engagement score (questions asked, polls answered), post-event NPS
- **Sponsorship Management:** Sponsor packages, deliverables, logo placement tracking, invoice generation
- **Event Calendar:** Public-facing /events page; internal all-events calendar view

### Dashboards
- **Event Pipeline Dashboard** — upcoming events, registration counts, vs. capacity targets
- **Post-Event Report** — attendee stats, NPS, leads generated, recording views

### Required Integrations
- QMeet (video delivery)
- CRM (attendee → lead import)
- Email Domain (invitations, reminders, follow-ups)
- WhatsApp Platform (event reminders)
- Marketing (event promotion)
- Finance (paid ticket revenue)
- Media Library (recording storage)
- Brand Center (event design assets)

### KPIs
- Events run per quarter
- Average registration-to-attendance rate (%)
- Leads generated per event
- Event NPS
- Recording views (30-day post-event)
- Sponsor conversion rate

### Dependencies
- QMeet (online event delivery)
- CRM (lead import)
- Marketing (promotion)
- Finance (paid tickets)

---

## Department 13 — Internal WhatsApp Platform

### Purpose
WhatsApp is the primary communication channel in Saudi Arabia. This department is the company's official WhatsApp Business infrastructure — enabling every team to communicate with clients, leads, and colleagues via WhatsApp in a tracked, templated, and compliant way. Not wa.me links — a fully managed WhatsApp Business API integration.

### Users
- Sales (lead outreach, deal follow-ups)
- CRM (lead nurturing)
- Operations (delivery notifications)
- Customer Success (client communications)
- Marketing (broadcast campaigns)
- Finance (payment reminders)
- HR (employee communications)
- All client-facing employees

### Features
- **WhatsApp Business API Integration:** Official Meta-approved Business API connected to the QIROX business number; no third-party wa.me redirects
- **Shared Team Inbox:** All WhatsApp conversations in one inbox, assigned to team members; conversation history preserved
- **Template Library:** Pre-approved WhatsApp message templates (greeting, payment reminder, quotation sent, order update, meeting reminder, follow-up, event invite, support resolved) — bilingual AR/EN
- **Template Builder:** Create and submit new templates for Meta approval from within the platform; approval status tracking
- **Broadcast Campaigns:** Send approved templates to segmented contact lists; schedule delivery; track delivery/read rates
- **Automated Triggers:** System-generated WhatsApp messages on defined triggers (order status change → WhatsApp to client; SLA breach → WhatsApp to manager; follow-up date → WhatsApp to rep)
- **Conversation Assignment:** Route incoming conversations to the right team member based on contact type (lead → sales, client → CSM, support → support team)
- **Contact Sync:** WhatsApp conversations linked to CRM contact records; every message logged in activity timeline
- **Reply Templates:** Quick-reply shortcuts for common responses — reduces response time
- **Message Analytics:** Delivery rate, read rate, response rate per template and per campaign
- **Compliance Log:** Every WhatsApp message sent from the platform is logged with sender, recipient, template used, timestamp — for audit purposes
- **Opt-out Management:** Automatic opt-out processing; contacts who block are removed from future broadcasts

### Dashboards
- **WhatsApp Inbox Dashboard** — unread conversations, response time by team member
- **Broadcast Analytics** — delivery rate, read rate, reply rate per campaign
- **Template Performance** — which templates generate the highest engagement

### Required Integrations
- Meta WhatsApp Business API
- CRM (contact sync, activity logging)
- Operations (delivery trigger notifications)
- Finance (payment reminder triggers)
- Customer Success (client communication)
- Marketing (broadcast campaigns)
- Events Platform (event reminders)

### KPIs
- WhatsApp message open/read rate (%)
- Average response time
- Broadcast delivery rate (%)
- Conversations handled per agent per day
- Opt-out rate (%)
- Template approval rate and time

### Dependencies
- Meta WhatsApp Business API (regulatory approval required)
- CRM (contact data)
- All triggering departments

---

## Department 14 — Employee Experience

### Purpose
The department that makes QIROX a company people want to work for. Employee Experience owns everything that happens between the payslip and the org chart — internal communications, culture building, recognition, wellbeing, peer connection, and the daily digital workplace environment.

### Users
- All Employees
- HR (content management)
- Department Managers (team announcements)
- CEO (company-wide communications)

### Features
- **Company Newsfeed:** Internal social feed — company announcements, team wins, project completions, birthdays, work anniversaries, new joiners; like and comment
- **Announcement System:** Targeted announcements by department, role, or all-staff; pinned notices; priority levels (FYI / Action Required / Urgent)
- **Employee Recognition Wall:** Peer-to-peer recognition ("shoutout" with points); manager awards; monthly highlights published to newsfeed
- **Team Directory:** Searchable people directory with roles, skills, interests, projects, and direct message button
- **Internal Messaging:** Direct messages and group channels between employees (not WhatsApp — internal and logged)
- **Pulse Surveys:** Short weekly/monthly anonymous sentiment surveys; results shared with HR and leadership; trends tracked over time
- **Wellbeing Hub:** Resources, programmes, and links managed by HR — mental health support, gym partnership, and company benefits summary
- **Company Events Feed:** Internal events (team lunches, training, off-sites) — RSVP and calendar add; linked to Events Platform
- **Birthday & Anniversary Celebrations:** Auto-triggered congratulatory posts on the newsfeed; manager prompted for personal message
- **Employee Onboarding Journey:** First-week experience — automated welcome message, buddy introduction, day-by-day schedule, access to all systems, checklist of setup tasks
- **Polls & Feedback:** Quick polls ("Which date works for the team offsite?"); suggestion box
- **Employee Benefits Portal:** Clear summary of all company benefits — health insurance details, leave entitlements, perks

### Dashboards
- **Engagement Dashboard** — pulse survey scores, recognition activity, newsfeed engagement
- **Onboarding Tracker** — new joiners' progress through onboarding checklist

### Required Integrations
- HR (employee data, new joiners, anniversaries, leave)
- Internal WhatsApp Platform (urgent announcements via WhatsApp)
- Events Platform (internal events)
- Knowledge Base (linked resources)

### KPIs
- eNPS (Employee Net Promoter Score)
- Pulse survey participation rate (%)
- Recognition posts per month
- Internal messaging active users (%)
- Onboarding checklist completion rate
- Announcement open rate (%)

### Dependencies
- HR (employee lifecycle data)
- Leadership (communication content)

---

## Department 15 — Investor Relations

### Purpose
Manages the company's relationship with current and prospective investors. Provides a secure, professional environment for financial reporting, cap table management, investor communications, and fundraising materials — building investor confidence through transparency and organisation.

### Users
- CEO
- CFO
- Legal Counsel
- Investors (external, read-only access to their data room)

### Features
- **Investor Data Room:** Secure, access-controlled document repository — financial statements, cap table, pitch deck, due diligence materials — with granular per-document permissions; access logging; link expiry
- **Cap Table Manager:** Ownership structure with all shareholders, share classes, option pools, convertible notes, SAFE agreements; dilution modelling for new rounds; equity calculator
- **Financial Reporting Package:** Auto-compiled monthly/quarterly investor report — P&L, cash flow, KPIs vs. targets, narrative update — generated from Finance department data; PDF export
- **Investor Update Newsletter:** Templated investor update email dispatched monthly from CFO/CEO; linked to company metrics
- **Fundraising Pipeline:** Track potential investors through stages (Identified → Introductory Meeting → Deep Dive → Due Diligence → Committed → Closed); materials sent, next steps
- **Investment Documents:** Store and version-control all investment agreements, shareholder agreements, board resolutions — with signature tracking
- **Board Meeting Manager:** Agenda builder, minutes recorder, resolution tracker, materials distributed before meeting
- **KPI Dashboard for Investors:** A dedicated, auto-updated view investors can access — select metrics only, no operational detail
- **Regulatory Compliance:** Track Saudi commercial registration, MISA licence, RCJY permits, and renewal dates
- **NDA Tracker:** All investor NDAs — company, expiry, signatory

### Dashboards
- **Investor KPI Dashboard** (investor-facing) — revenue, growth rate, client count, team size, runway
- **Fundraising Pipeline Dashboard** — active investors, stage distribution, pipeline value
- **Cap Table Dashboard** — current ownership breakdown, option pool remaining

### Required Integrations
- Finance (auto-pull P&L and KPIs)
- Executive Management (board reporting)
- Legal document storage
- E-signature system

### KPIs
- Investor update delivery rate (% of months with update sent on time)
- Data room document freshness (% of docs updated in last 30 days)
- Board meeting minutes published within 5 days
- Cap table accuracy (verified quarterly)

### Dependencies
- Finance (financial data)
- Executive Management (strategic narrative)
- Legal (document management)

---

## Department 16 — Knowledge Base

### Purpose
The company's collective brain. Every process, policy, how-to guide, product FAQ, troubleshooting article, and client-facing help document lives here — searchable, version-controlled, and accessible to the right audience. Reduces support tickets, onboarding time, and tribal knowledge.

### Users
- All Employees (internal knowledge)
- Clients (client-facing knowledge)
- HR (policy documents)
- Customer Success (support articles)

### Features
- **Article Editor:** Rich text editor with headings, images, code blocks, callouts, tables, video embeds — bilingual (AR/EN)
- **Category & Tag System:** Multi-level category tree (e.g., Product → Client Portal → Wallet) with tags for cross-category discovery
- **Audience Controls:** Per-article visibility — Public (client-facing), Internal (all employees), Role-restricted (HR-only, Finance-only)
- **Version History:** Every edit is tracked; previous versions restorable; change log per article
- **Search:** Full-text search across all accessible articles with instant results and relevance ranking
- **Article Rating:** Thumbs up/down on every article; low-rated articles flagged for review
- **Related Articles:** Auto-suggested related content at the bottom of every article
- **Article Expiry:** Set a review date; authors notified when their article is approaching expiry to verify accuracy
- **Analytics:** Most viewed articles, search terms with no results (signals missing content), articles with high "didn't help" rate
- **Client Help Centre:** Branded public-facing help portal at help.qirox.online (or /help); embedded search; categorised topics; contact support button if article didn't help
- **Internal Wiki:** Separate section for internal process documentation, team norms, and institutional knowledge
- **Import Tool:** Paste or upload existing documentation to bulk-seed the knowledge base

### Dashboards
- **Knowledge Base Health Dashboard** — total articles, articles due for review, low-rated articles, search gaps
- **Usage Dashboard** — top articles, search volume, deflection rate (users who found answer vs. raised ticket)

### Required Integrations
- Customer Success (support ticket deflection; link articles to tickets)
- HR (policy documents)
- SOP Management (SOPs linked or embedded)
- Employee Experience (new hire resources)
- AI Platform (AI-assisted search and article suggestions)

### KPIs
- Article deflection rate (% of help searches that didn't result in a ticket)
- Articles reviewed on time (%)
- Search-to-result rate (% of searches that return a result)
- Average article rating
- Knowledge base coverage score (% of product features documented)

### Dependencies
- Customer Success (help article demand signals from tickets)
- SOP Management (process documentation overlap)
- AI Platform (smart search)

---

## Department 17 — SOP Management

### Purpose
Standard Operating Procedures are the backbone of a scalable organisation. Every repeatable process at QIROX has a documented, approved, versioned, and trained-on SOP. This department ensures that the company operates consistently regardless of who is on duty.

### Users
- Department Managers (SOP owners)
- All Employees (SOP readers / doers)
- HR (compliance and training)
- Operations (operational SOPs)
- QAdmin (system administration SOPs)

### Features
- **SOP Builder:** Structured template for every SOP — Purpose, Scope, Responsible Role, Trigger, Step-by-step procedure, Exceptions, Related SOPs, Version history
- **SOP Library:** Searchable library of all SOPs organised by department; status (Draft / Under Review / Approved / Deprecated)
- **Approval Workflow:** SOP draft → department manager review → HR compliance check → Approved; major changes require re-approval
- **Version Control:** Every version stored with author, date, change summary, and approval record
- **SOP Acknowledgement:** Employees required to confirm they have read and understood SOPs relevant to their role; compliance tracked
- **Checklist Generation:** Any SOP can generate a checklist that employees tick through when executing the process — linked to the SOP version
- **SOP Training:** Video or presentation attached to SOPs for training new staff; linked from Employee Onboarding
- **SOP Map:** Visual diagram linking related SOPs (e.g., Order Receipt SOP → Project Initiation SOP → Delivery SOP → Invoice SOP)
- **SOP Analytics:** Which SOPs are most viewed, which have the lowest acknowledgement rates, which are most linked from support tickets
- **Regulatory SOPs:** Flag SOPs that relate to regulatory compliance (ZATCA, data protection, labour law); separate compliance review

### Dashboards
- **SOP Compliance Dashboard** — acknowledgement rates by department, overdue reviews
- **SOP Coverage Dashboard** — % of departments with SOPs for all core processes

### Required Integrations
- Knowledge Base (SOPs embedded or linked)
- HR (training compliance tracking; onboarding)
- Operations (operational checklists)
- QAdmin (system SOPs)

### KPIs
- SOP acknowledgement rate (% of required staff who have confirmed reading)
- SOP review compliance (% reviewed within scheduled cycle)
- SOPs per department (coverage metric)
- Process consistency incidents (production incidents attributable to missing or followed-wrong SOP)

### Dependencies
- HR (training and compliance)
- All departments (SOP ownership)

---

## Department 18 — Company Assets

### Purpose
Tracks every physical and digital asset owned by QIROX — laptops, phones, licences, office equipment, software subscriptions, domain names, servers — ensuring nothing is lost, expires unnoticed, or goes unaccounted for.

### Users
- Office Manager / Admin
- IT Manager
- Finance (asset depreciation)
- HR (asset assignment on hire/departure)

### Features
- **Asset Registry:** Every asset with: category (hardware, software, licence, domain, vehicle, furniture), name, serial/licence number, purchase date, cost, current value, assigned to, location
- **Assignment Management:** Asset checked out to an employee on hire; checked in on departure; offboarding checklist includes asset return
- **Licence Tracker:** Software licences — vendor, number of seats, cost, expiry date, auto-renewal setting; utilisation (assigned vs. total seats)
- **Domain & Certificate Tracker:** All domain names and SSL certificates — registrar, expiry date, auto-renewal status; 30-day expiry alerts
- **Subscription Tracker:** All SaaS subscriptions — service name, cost per month, billing date, card on file, owner, usage status (active, redundant)
- **Asset Depreciation:** Calculate book value of hardware assets over time; linked to Finance for balance sheet
- **Maintenance Schedule:** Recurring maintenance tasks per asset (server patching, hardware servicing, licence audit)
- **Asset Request Workflow:** Employee requests new equipment → manager approves → procurement → finance records → assigned to employee
- **Disposal Log:** Retired assets recorded with disposal method (sold, donated, recycled) and residual value
- **Total Cost of Ownership Report:** All asset costs aggregated by department for budget planning

### Dashboards
- **Asset Dashboard** — total assets by category, value, assets due for review/expiry
- **Licence & Subscription Dashboard** — upcoming renewals, redundant licences, seat utilisation

### Required Integrations
- HR (employee assignment on hire/departure)
- Finance (asset cost and depreciation)
- IT (hardware and domain management)

### KPIs
- Licence utilisation rate (% of seats actively used)
- Asset return rate on departure (%)
- Domain/certificate expiry incidents (target: 0)
- Subscription cost per employee
- Unassigned hardware count

### Dependencies
- HR (employee status triggers assignment/return)
- Finance (cost tracking)

---

## Department 19 — Media Library

### Purpose
The centralised digital asset management (DAM) system for all media produced by or for QIROX — images, videos, audio files, raw design files, presentations, and documents. Every asset is tagged, searchable, and accessible to the right people with version control and usage rights tracking.

### Users
- All Employees (access to relevant media)
- Designers (upload and manage)
- Marketing (campaign assets)
- Brand Center (brand assets)
- Content Creators

### Features
- **Asset Upload & Ingestion:** Drag-and-drop upload; bulk import; auto-thumbnail generation; metadata extraction
- **Smart Tagging:** Auto-tag by file type, dimensions, colour palette, detected content (AI-powered); manual tags by uploader
- **Collection / Folder Structure:** Organised by department, project, campaign, year; collections can be shared with specific teams
- **Search:** Full-text search on filename, tags, description, and project; filter by type, date, size, colour
- **Asset Preview:** In-browser preview for images (all formats), videos (MP4, MOV), PDFs, presentations — no download needed to review
- **Version Control:** Upload new version of an asset while preserving previous versions; current version always served by default
- **Usage Rights & Expiry:** Each asset tagged with licence type (royalty-free, commissioned, licensed with expiry, client-owned); expiry alerts
- **Usage Tracking:** Which campaigns and pages is this asset used on? Prevents use of expired assets
- **Sharing:** Generate expiring share links for external partners (agencies, printers); watermarked preview mode
- **Format Conversion:** Download in multiple formats from one source (e.g., logo: SVG/PNG/EPS from one upload)
- **Approval Workflow:** Newly uploaded client deliverables or campaign assets enter a review queue before public availability
- **Storage Quota Dashboard:** Usage by department; growth projections; archive suggestions for old assets

### Dashboards
- **Library Overview Dashboard** — total assets, storage used, recent uploads, most accessed assets
- **Expiry Dashboard** — licensed assets expiring in next 30/60/90 days

### Required Integrations
- Brand Center (logo and brand asset storage)
- Marketing (campaign asset access)
- Events Platform (event recording storage)
- Company Presentation (corporate media)
- AI Platform (auto-tagging)

### KPIs
- Asset retrieval time (search-to-download speed)
- % of assets with complete metadata
- Licensed asset compliance (0 expired licences in use)
- Storage utilisation (by department)
- Asset re-use rate (campaigns using library assets vs. creating new)

### Dependencies
- Brand Center (brand asset management)
- Marketing (primary consumer)
- AI Platform (auto-tagging intelligence)

---

## Department 20 — Analytics & Intelligence

### Purpose
The data brain of QIROX. Aggregates data from every department, surfaces actionable insights, and provides every team with the metrics they need to make better decisions. This is not just reporting — it is predictive intelligence, anomaly detection, and strategic guidance built on top of the company's own data.

### Users
- All Departments (their metrics)
- Executive Team (company-level intelligence)
- Marketing (campaign analytics)
- Finance (revenue intelligence)
- Customer Success (health and churn analytics)

### Features
- **Unified Data Layer:** Aggregates data from all 22 departments into a single queryable analytics store
- **Funnel Analytics:** Full acquisition-to-retention funnel — Visitor → Lead → MQL → Opportunity → Client → Retained Client — with drop-off rates at each stage
- **Cohort Analysis:** Group clients by signup month, plan type, or source; track retention and revenue expansion over time
- **Revenue Analytics:** MRR, ARR, new MRR, expansion MRR, churn MRR, net MRR change; all segmented by plan, team, and source
- **Churn Intelligence:** Predictive churn risk model using client health score, activity, payment health, and NPS trends; risk surfaced 60 days before renewal
- **Behavioural Analytics:** Track feature usage per user — which parts of the client portal are used vs. ignored; drop-off points in onboarding; most-used tools
- **Attribution Reporting:** Multi-touch attribution — first touch, last touch, linear — per deal; marketing ROI per channel
- **Custom Report Builder:** Drag-and-drop report builder with filters, groupings, and visualisations; save as personal or shared report
- **Automated Scheduled Reports:** Run any report on a schedule; email PDF to specified recipients
- **Anomaly Detection:** AI-powered alerts when a metric moves unexpectedly (e.g., conversion rate drops 20% week-on-week)
- **Benchmark Tracking:** Compare current period to same period last year, last month, and company-defined targets
- **Real-Time Dashboard Engine:** Live updating dashboards (< 30 second lag) for operational metrics
- **Data Export:** Any report exportable as CSV, Excel, or PDF
- **A/B Test Manager:** Register experiments (e.g., landing page variant, email subject); track statistical significance; declare winner

### Dashboards
- **Company Command Centre** — all top-level KPIs, 12-month trends
- **Growth Dashboard** — new revenue, pipeline, CAC, LTV
- **Retention Dashboard** — NRR, GRR, churn cohorts
- **Marketing Attribution Dashboard** — lead source ROI, channel comparison
- **Product Usage Dashboard** — feature adoption rates, active users by feature

### Required Integrations
- All 22 departments (data aggregation)
- GA4, Meta Pixel, TikTok Pixel (web analytics)
- Finance (revenue data source of truth)
- CRM (pipeline and lead data)
- Customer Success (NPS, health scores)

### KPIs
- Data freshness (< 30 minutes for operational, < 24 hours for strategic)
- Report adoption rate (% of managers using dashboard weekly)
- Anomaly detection accuracy (true positives vs. false alerts)
- Custom reports created per month
- Decision speed (qualitative — time from question to data-backed answer)

### Dependencies
- All departments (data sources)
- AI Platform (predictive models)
- Finance (revenue source of truth)

---

## Department 21 — AI Platform

### Purpose
The intelligence infrastructure that powers every AI-driven feature across the entire QIROX OS. Manages AI providers, models, usage, costs, and capability development — and surfaces AI tools directly to every team to amplify their productivity without requiring technical knowledge.

### Users
- All Employees (AI tools)
- CTO / AI Lead (platform management)
- Marketing (AI content generation)
- Customer Success (AI-powered insights)
- Project Management (AI estimation)

### Features
- **AI Studio:** Central console for managing AI sessions, model configuration, system prompts, and provider settings (OpenAI GPT-4o, Moonshot/Kimi, and future providers)
- **Model Router:** Smart routing logic — selects the optimal model for each request based on task type (vision vs. text), language (Arabic vs. English), cost, and latency; automatic fallback
- **Image Generation Engine:** Text-to-image with Arabic → English prompt translation; style selection; brand palette injection; resolution options; result library
- **Video Generation:** AI video clip generation for marketing and social content; proxy-based provider integration
- **AI Copywriter:** Generate marketing copy, email campaigns, proposal text, social captions, blog articles — in Arabic and English — in QIROX brand voice
- **AI Meeting Notes:** Automatic transcription and summary of QMeet meetings; action items extracted and linked to tasks
- **AI Document Reader:** Upload any document (contract, PDF, report) → ask questions → AI answers from document context
- **AI Lead Scoring:** Continuously retrains on closed-won and closed-lost data to score new CRM leads
- **AI Project Estimation:** Given a project brief → AI suggests task breakdown, estimated hours, recommended team size, and risk flags
- **AI Email Responder (draft):** Suggests draft replies to client messages based on context and previous interactions
- **AI Knowledge Base Search:** Semantic search on the knowledge base — understands intent, not just keywords
- **AI Anomaly Alerts:** Integrated with Analytics — detects unusual patterns and explains them in plain language
- **Usage Dashboard:** Tokens consumed, cost per department, model usage breakdown; budget alerts
- **Prompt Library:** Curated, approved prompts for common tasks — searchable by team members to avoid rewriting from scratch
- **Anti-Chinese Language Rule:** Enforced globally — all AI outputs in Arabic or English only; system-level prompt guard

### Dashboards
- **AI Usage Dashboard** — queries per day, cost per department, model distribution
- **AI Output Library** — all generated images, videos, and documents; searchable and reusable
- **Model Performance Dashboard** — response quality ratings, latency per model

### Required Integrations
- OpenAI API (GPT-4o)
- Moonshot/Kimi API
- Image generation provider (flux+enhance pipeline)
- Video generation provider
- QMeet (meeting transcription)
- Analytics (anomaly detection)
- Knowledge Base (semantic search)
- CRM (lead scoring)
- Project Management (estimation)

### KPIs
- AI feature adoption rate (% of employees using at least one AI tool weekly)
- AI-generated content acceptance rate (% of drafts used without major edit)
- AI cost per employee per month
- Model routing accuracy (% routed to optimal model)
- Lead scoring accuracy (lift over manual scoring)
- Meeting summary accuracy rating

### Dependencies
- OpenAI / Moonshot providers (external)
- All departments (AI capability consumption)

---

## Department 22 — SEO Platform

### Purpose
The organic growth engine. Manages QIROX's entire search engine presence — technical SEO infrastructure, keyword strategy, content planning, link building, local SEO (Saudi market), and performance tracking. Every piece of content published by Marketing goes through the SEO Platform's strategy first.

### Users
- SEO Manager / Specialist
- Marketing Team (content SEO)
- CTO (technical SEO)
- Executive Team (traffic and ranking reports)

### Features
- **Keyword Research & Strategy:** Keyword universe by market (Saudi Arabic, Gulf Arabic, English); search volume, difficulty, intent classification; priority keyword map per service
- **Content Brief Generator:** Per-article content briefs — target keyword, supporting keywords, search intent, suggested structure, competitor content gaps, minimum word count, internal links to include
- **Technical SEO Audit Engine:** Automated crawl of all platform pages; flagged issues — broken links, missing meta tags, duplicate content, slow pages, missing schema, non-canonical URLs
- **Dynamic Sitemap:** Real-time XML sitemap including all service pages, blog articles, news posts, job listings, case studies — submitted to Google Search Console automatically
- **Schema Markup Manager:** Configure and inject structured data (JSON-LD) per page type — Service, Article, Review, FAQ, BreadcrumbList, LocalBusiness, Organization — preview rich snippet output
- **Internal Linking Manager:** Analyse internal link distribution; surface orphan pages; suggest optimal anchor text for new articles
- **Backlink Monitor:** Track referring domains, domain authority of inbound links, new and lost links; disavow tool
- **Local SEO Manager:** Saudi-specific — Google Business Profile management, NAP consistency checker, local keyword rankings, review monitoring (Google, Trustpilot)
- **Rank Tracker:** Daily position tracking for priority keywords across Saudi Arabia, UAE, and other target markets; mobile vs. desktop; featured snippet tracking
- **Core Web Vitals Monitor:** LCP, CLS, INP tracking per page; alerts on regressions; linked to CTO for technical fixes
- **SEO Content Calendar:** Linked to Marketing — planned content with keyword targets, publish dates, assigned writers, and brief status
- **Competitor SEO Analysis:** Track competitor keyword rankings, new content published, backlink acquisitions
- **Search Console Integration:** Import impressions, clicks, CTR, position data directly from Google Search Console
- **SEO Performance Report:** Monthly automated report — traffic change, ranking improvements, new keywords ranking, top-performing content

### Dashboards
- **SEO Command Centre** — organic traffic (MoM), ranking keywords, top pages, top opportunities
- **Technical Health Dashboard** — crawl errors, Core Web Vitals scores, sitemap status
- **Content Performance Dashboard** — traffic and ranking per article; articles needing refresh

### Required Integrations
- Google Search Console API
- Google Analytics 4
- Marketing (content calendar)
- AI Platform (content brief generation, article drafting)
- CMS / Blog system
- Technical infrastructure (Core Web Vitals monitoring)

### KPIs
- Organic traffic (sessions/month)
- Keywords ranking on page 1 (count)
- Average keyword position
- Click-through rate (CTR) from search
- Core Web Vitals scores (LCP < 2.5s, CLS < 0.1, INP < 200ms)
- Indexed pages (vs. total published)
- Domain Rating / Authority
- Organic lead conversion rate

### Dependencies
- Marketing (content production)
- AI Platform (content acceleration)
- CTO (technical SEO fixes)
- Brand Center (on-page visual standards)

---

## Department 23 — QAdmin

### Purpose
The super-administrative layer of the entire QIROX OS. QAdmin controls system configuration, user access, security, compliance, infrastructure, integration management, feature flags, and platform health — ensuring the OS is secure, stable, and correctly configured at all times.

### Users
- CTO
- System Administrator
- Senior Developer
- Security Officer

### Features
- **System Configuration Centre:** All global platform settings — SMTP, branding (logo, colours, siteUrl), pixel tracking IDs, WhatsApp number, support email, timezone, default currency, VAT rate, ZATCA credentials
- **User & Role Management:** Create, suspend, restore, and delete all platform accounts; configure roles with granular permission sets; role inheritance; permission audit
- **Feature Flag Manager:** Enable/disable any feature globally or per-user/role/plan without code deployment; A/B assignment via flags; rollout percentage control
- **Integration Hub:** Connect and configure all external integrations — payment gateways, WhatsApp Business API, OpenAI, Google APIs, ZATCA, Meta Pixel, GA4, GTM, Twilio SMS — API key management, connection health monitoring, webhook logs
- **Security Centre:**
  - 2FA enforcement rules (mandatory for admin/finance roles)
  - IP allowlist / blocklist management
  - Failed login attempt monitoring and account lockout rules
  - Active session viewer (who is logged in, from where)
  - API key management for external integrations
  - Rate limiting configuration
  - Security audit log
- **Database Administration:** MongoDB connection management (primary, QMeet, SystemSettings); collection size monitoring; index management; backup schedule and restore trigger
- **Cron Job Manager:** View, enable, disable, and trigger all 27 scheduled jobs; execution history; failure alerts
- **Deployment Manager:** Production release management — build trigger, rollback checkpoint, environment variable management, zero-downtime deployment checklist
- **API Key Management:** Generate and revoke API keys for developer portal; rate limit per key; usage analytics per key
- **Audit Log Centre:** Immutable full-platform audit log — every user action, admin change, financial transaction, and system event with actor, timestamp, before/after values
- **Platform Health Dashboard:** Real-time server health — CPU, memory, request rate, error rate, response time, database connection pool, queue depth
- **Notification Templates Manager:** All system notification templates (email + WhatsApp + push + in-app) — edit content, preview, test-send, version control
- **Data Privacy & Compliance Tools:** GDPR/PDPA right-to-erasure workflow; data export per user; data retention policy configuration; consent log
- **Environment Manager:** Manage development, staging, and production environment variables and secrets — never exposes values; audit trail of all changes
- **Multi-Tenant Preparation:** Tenant configuration architecture for future white-label or multi-organisation deployment

### Dashboards
- **Platform Health Dashboard** — live server metrics, error rate, response time, active users
- **Security Dashboard** — failed logins, active sessions, rate limit triggers, security alerts
- **Integration Health Dashboard** — all external integrations: connected, error, last ping
- **Audit Log Dashboard** — recent high-risk actions, admin changes, financial modifications

### Required Integrations
- All 22 departments (configuration and control)
- All external APIs (connection management)
- Monitoring infrastructure (server health)

### KPIs
- Platform uptime (target: 99.9%)
- Mean time to detect (MTTD) security incidents
- Mean time to resolve (MTTR) platform incidents
- Failed login attempt rate
- Integration health (% of integrations with 0 errors in 24 hours)
- Feature flag deployment frequency (velocity metric)
- Audit log completeness (% of high-risk actions logged)
- Zero data loss events

### Dependencies
- All departments (administers all)
- External API providers (integration management)
- Finance (ZATCA and payment gateway credentials)

---

## Roadmap Summary — Enterprise OS Phases

### Phase 0 — Foundation (Current)
Governance, domain architecture, product audit complete.  
Status: ✅ Done

### Phase 1 — Legal & Critical Gaps (Months 1–2)
- ZATCA e-invoicing
- Saudi payment methods (Mada, STC Pay)
- RTL direction fix
- Automated order notifications
- CRM follow-up alerts
- First-login onboarding tour

### Phase 2 — Core OS Departments (Months 2–6)
Build out the departments not yet implemented as distinct modules:
- Operations command centre + SLA engine
- Sales (quotation studio, e-sign, contract management, commission engine)
- Customer Success (health scores, onboarding programme, NPS)
- HR (attendance, leave, performance, recruitment)
- Employee Experience (newsfeed, recognition, announcements)
- Finance (ZATCA, Stripe, recurring billing, refund workflow)

### Phase 3 — Intelligence & Platform (Months 6–12)
- Analytics & Intelligence (full behavioural tracking, funnels, cohorts)
- AI Platform (expanded tools, meeting transcription, AI estimation)
- SEO Platform (content strategy, schema, rank tracking)
- WhatsApp Business API platform
- Events Platform
- Knowledge Base + SOP Management

### Phase 4 — Brand & Presence (Months 12–18)
- Brand Center (full DAM integration)
- Media Library
- Company Presentation tools
- Investor Relations module
- Company Assets tracker

### Phase 5 — Enterprise Expansion (Months 18–24)
- QAdmin enterprise features (multi-tenant, SSO/SAML)
- Advanced automation rules engine
- White-label capability
- API platform for external integrations

---

*No production code was modified. This is a strategic planning document.*
