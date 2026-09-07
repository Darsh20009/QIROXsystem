# QIROX PRODUCT BLUEPRINT
## V5 — Ideal Operating Model

**Version:** V5  
**Date:** 2026-07-10  
**Classification:** Product Design Document  
**Audience:** Product, Engineering, Design

---

## DESIGN PRINCIPLES

Before any feature specification, V5 is governed by four non-negotiable principles:

1. **Premium by default.** Every screen must feel like it belongs in a Tier-1 enterprise product. If you would not show it to an investor at Demo Day, redesign it.

2. **Arabic-first, not Arabic-translated.** RTL is not an afterthought. Typography, spacing, layout rhythm, and information hierarchy are designed for Arabic reading first.

3. **Everything effortless.** A client should never need to call support to understand a feature. An employee should never need to open three tabs to complete one task.

4. **Trust through transparency.** Clients always know the status of everything. Employees always know what to do next. Admins always know the health of the business.

---

## PLATFORM ARCHITECTURE — 17 ZONES

QIROX V5 is structured as 17 distinct zones, each with a clear owner, audience, and purpose.

```
┌─────────────────────────────────────────────┐
│  Zone 1: PUBLIC WEBSITE                     │  Visitors / Prospects
├─────────────────────────────────────────────┤
│  Zone 2: CLIENT WORKSPACE                   │  Paying Clients
├─────────────────────────────────────────────┤
│  Zone 3: EMPLOYEE WORKSPACE                 │  Internal Team
├─────────────────────────────────────────────┤
│  Zone 4: ADMINISTRATION                     │  Admin / Manager
├─────────────────────────────────────────────┤
│  Zone 5: QADMIN                             │  Tech Command Center
├─────────────────────────────────────────────┤
│  Zone 6: CRM                                │  Sales / Leads / Deals
├─────────────────────────────────────────────┤
│  Zone 7: PROJECTS                           │  Project Delivery
├─────────────────────────────────────────────┤
│  Zone 8: FINANCE                            │  Revenue / Payroll / Tax
├─────────────────────────────────────────────┤
│  Zone 9: MARKETING                          │  Brand / Campaigns / SEO
├─────────────────────────────────────────────┤
│  Zone 10: SUPPORT                           │  Tickets / SLA / Chat
├─────────────────────────────────────────────┤
│  Zone 11: EVENTS                            │  Corporate Event Platform
├─────────────────────────────────────────────┤
│  Zone 12: KNOWLEDGE BASE                    │  Help / Training / Wiki
├─────────────────────────────────────────────┤
│  Zone 13: PRESENTATION                      │  QIROX Apple-Keynote Pitch
├─────────────────────────────────────────────┤
│  Zone 14: AI PLATFORM                       │  Studio / Wizard / Analysis |
├─────────────────────────────────────────────┤
│  Zone 15: ANALYTICS                         │  Business Intelligence      |
├─────────────────────────────────────────────┤
│  Zone 16: AUTOMATION                        │  Workflows / Triggers       |
├─────────────────────────────────────────────┤
│  Zone 17: QIROX STORE                       │  Products / Devices         |
└─────────────────────────────────────────────┘
```

---

## ZONE 1: PUBLIC WEBSITE

### Purpose
Convert visitors into leads. Position QIROX as the premier enterprise technology company in the Arabic-speaking market.

### Pages

#### 1.1 Home
- Full-bleed hero: "نحوّل فكرتك إلى نظام يدير نفسه" — animated text reveal
- 10-sector showcase with real system previews (not static images)
- Social proof: client logos + measurable results ("نما مبيعات عميلنا بنسبة 300% في 6 أشهر")
- AI Wizard entry point — "اكتشف النظام المناسب لك"
- "اطلب عرضاً" CTA — not "اشترِ الآن"
- Technology strip: logos of tech stack used (shows sophistication)
- Featured case studies (3 sectors)

#### 1.2 Systems Catalog
- 10-sector grid, each with:
  - System name (Arabic + English)
  - 3-line description
  - Key modules list
  - Live demo button
  - Pricing tier indicator
  - Case study link

#### 1.3 Pricing
- Three tiers: Starter / Growth / Enterprise
- Toggle: Monthly / Annual
- Feature comparison matrix
- Custom enterprise CTA
- Arabic-native pricing display (SAR, not USD)

#### 1.4 Case Studies (NEW)
- Per-client stories (with permission)
- Before/after operational metrics
- Industry: sector, size, challenge, solution, result
- Downloadable PDF version (for sales meetings)

#### 1.5 QIROX Presentation (/presentation)
- See Zone 13 for full specification

#### 1.6 AI Wizard
- Conversational interface: "اخبرنا عن نشاطك التجاري"
- Multi-step recommendation engine
- Output: recommended system + estimated cost + suggested timeline
- Lead capture at end of wizard

#### 1.7 Consultation Booking
- Calendar-integrated booking (Calendly-style but native)
- Selects type: discovery call / technical demo / pricing review
- Confirms via email + WhatsApp
- Adds to employee QMeet calendar

#### 1.8 Blog / News
- Long-form Arabic articles
- Category: Technology / ERP / CRM / Digital Transformation / Case Studies
- Structured data for every article
- Author bio
- Related articles
- Social share with proper OG tags

#### 1.9 Jobs
- Active positions with full JD
- Application form (inline, not email)
- Auto-acknowledgement email
- HR receives notification

#### 1.10 Partners
- Partner tiers: Technology / Integration / Reseller
- Application form
- Partner portal login

---

## ZONE 2: CLIENT WORKSPACE

### Purpose
Give every client a premium, transparent window into their project and relationship with QIROX.

### Client Journey (11 Stages)

```
1. DISCOVER    → Public website + AI wizard
2. UNDERSTAND  → Case studies + demo access
3. TRUST       → Testimonials + consultation
4. REQUEST     → Order wizard + requirement form
5. MEET        → Kickoff meeting (QMeet scheduled)
6. APPROVE     → Digital contract + proposal approval
7. PAY         → Qirox Pay / installment / gateway
8. TRACK       → Real-time project dashboard
9. REVIEW      → Delivery review + approval
10. SUPPORT    → Ongoing support portal
11. EXPAND     → Upsell / renewal / referral
```

### Client Dashboard — V5 Design

**Header strip:**
- Client company name + logo
- Active project count
- Next milestone (with date)
- Unread messages count
- Account balance

**Main content (4 cards):**
1. **Project Status** — Visual timeline, current milestone, next action required from client
2. **Latest Invoice** — Amount, due date, one-click pay button
3. **Recent Message** — Preview + quick reply
4. **AI Assistant** — "كيف يمكنني مساعدتك؟"

### Client Project View
- Visual timeline (not just progress bar):
  ```
  ✅ الاتفاقية    ✅ التصميم    🔄 التطوير    ⏳ الاختبار    ⏳ التسليم
  ```
- Milestone cards with dates
- Deliverables per milestone
- File uploads (client provides assets)
- Comment thread (internal vs external visible)
- Change request button → formal workflow
- Meeting history

### Client Wallet (Qirox Pay V2)
- Balance card (visual card design)
- Transaction history with filters
- Top-up options: bank transfer (with upload) / gateway / installment
- Payment history
- Outstanding invoices with pay button
- Payment plan status

### Client Support Portal
- Create ticket with: category, priority, screenshot attachment
- Ticket thread view (email-like)
- SLA indicator ("نرد خلال 4 ساعات عمل")
- AI first-response (answers common questions automatically)
- Escalation to live chat (CsSession)

### Digital Contracts
- View pending contracts
- Section-by-section scroll with highlight
- Electronic signature (in-app, no third party)
- Download signed PDF
- Contract history

### Client Invoices
- Invoice list with status (paid/unpaid/overdue)
- ZATCA QR code on each invoice
- Download PDF
- Share link

### Referral Program
- Personal referral link
- Real-time referral tree
- Earned rewards tracker
- Redemption against wallet

---

## ZONE 3: EMPLOYEE WORKSPACE

### Purpose
A unified, premium workspace where every employee has everything they need in one place — no tab-switching, no guessing what to do next.

### Employee Dashboard — V5 Design

**Personal strip:**
- Employee photo + name + role badge
- Today's attendance status (check in/out button inline)
- Work hours today / this week
- Quick action buttons: New Task / New Lead / New Mail / QMeet

**Main content (role-dependent panels):**
- My Tasks (due today / this week)
- My Leads (CRM)
- My Projects
- Team Announcements

### Employee Digital Card

- Digital business card (accessible from profile)
- QR code linking to public profile
- Available as: Apple Wallet Pass / Google Wallet Object
- Contains: Name, Role, Company, Phone, Email, LinkedIn
- Secure QR for attendance scanning (rotates every 30 minutes)

**Apple Wallet Pass spec:**
```
Pass Type: Generic
Organization: QIROX Studio
Fields:
  Primary: employeeName
  Secondary: jobTitle
  Auxiliary: employeeCode, department
  Back: contact info, emergency contact
Barcode: QR, content = encrypted { userId, timestamp, sig }
```

**Google Wallet spec:**
```
Template: Generic
Header: QIROX Studio
CardTitle: employeeName
Subheader: jobTitle
Barcode: QR_CODE
```

### Attendance System
- Check-in/out with:
  - Option 1: QR code scan (mobile, via employee card)
  - Option 2: Face recognition (browser WebAuthn)
  - Option 3: Manual (manager override)
- Live team map: who is in, who is out
- Weekly summary
- Leave request workflow (calendar picker → manager approval → HR notified)

### Task Management (Personal)
- Today, This Week, Upcoming views
- Priority: urgent / high / normal / low
- Due date + time estimate
- Link to project or lead
- Comments per task
- Status: todo → in progress → blocked → done

### Knowledge Base Access
- See Zone 12

### Announcements Feed
- Company news from admin/HR
- Department-specific announcements
- Pinned announcements
- Read receipts (for important notices)

### Employee Training Center
- Onboarding checklist for new employees
- Training modules (video + quiz)
- Completion certificates
- Linked to employee profile

### Corporate Mail Integration
- Embedded in workspace (not a separate page)
- Folder list + inbox in sidebar
- Compose with branded template
- Threaded message view (V5 upgrade)

---

## ZONE 4: ADMINISTRATION

### Purpose
A command center for admins and managers — operational health, not configuration.

### Admin Command Center

**Real-time health bar:**
- Active projects count
- Open support tickets (SLA breach alerts)
- Today's revenue
- Team attendance rate
- Unassigned leads

**Operations panel:**
- Order pipeline (Kanban: New → Reviewing → Active → Completed)
- Project health (On Track / At Risk / Delayed)
- Employee workload heatmap

**Finance snapshot:**
- Monthly revenue vs target
- Outstanding invoices total
- Payroll due this month

**Alerts:**
- Overdue tasks (red)
- SLA breaches (red)
- Unread support tickets > 4 hours old (amber)
- Installment payments missed (amber)

### Order Management V2
- Pipeline view (not just table)
- Order cards with: client, value, service type, assigned team, status
- Quick assign employee
- Quick generate invoice
- Quick schedule kickoff meeting

### Finance Hub
- Income statement (MTD / YTD)
- Cash flow (collected vs invoiced)
- Payroll dashboard
- Expense tracking
- ZATCA e-invoice compliance status

### HR Command Center
- Employee roster with active/inactive status
- Attendance heatmap (team-wide)
- Leave calendar (who is off, when)
- Performance review cycle
- Payroll processing with approval workflow

### Analytics Dashboard
- Lead conversion funnel
- Revenue by service type / sector
- Project delivery metrics (on-time %, avg duration)
- Employee performance metrics
- Client satisfaction scores
- CRM pipeline velocity

---

## ZONE 5: QADMIN — TECHNOLOGY COMMAND CENTER

### Purpose
Full operational control of the technology infrastructure — primarily focused on WhatsApp device management, system health, and automation.

### 5.1 WhatsApp Device Manager

No SMS. No third-party APIs that require approval. QIROX operates its own WhatsApp session infrastructure.

**Architecture:**
- Each "device" is a WhatsApp Web session (like WhatsApp Web)
- Session maintained via QR scan pairing
- Multiple devices supported
- Sessions stored server-side with encrypted credentials

**UI Specification:**

```
/qadmin/whatsapp
├── /devices          — Connected device list
├── /pair             — QR scan new device
├── /sessions         — Active session monitor
├── /messages         — Message queue management
├── /templates        — Message template library
├── /automation       — Rule-based auto-responses
├── /delivery         — Delivery status monitor
└── /logs             — Full send/receive logs
```

**Device card fields:**
- Device name (e.g., "Sales Phone 1")
- Assigned phone number
- Connection status (Connected / Reconnecting / Disconnected)
- Last seen
- Messages sent today / this week
- Battery (if accessible)
- Actions: Reconnect / Pair New / Disconnect

**QR Pairing flow:**
1. Admin clicks "Add Device"
2. Server initializes WhatsApp Web session
3. QR code displayed (rotates every 20 seconds)
4. Admin scans with phone
5. Session established → device shows as Connected
6. Session encrypted and persisted

**Message Queue:**
- All outbound messages queued
- Status: queued → sent → delivered → read → failed
- Failed messages: auto-retry (3 attempts, exponential backoff)
- Manual retry option
- Filter by device / contact / date / status

**Templates:**
- Categorized: Welcome / Follow-up / Payment reminder / Support / Event
- Variables: {name}, {amount}, {date}, {orderId}, {link}
- Preview before saving
- Multi-language: Arabic / English per template

**Automation rules:**
```
Trigger: Lead created in CRM
Action: Send WhatsApp template "new_lead_welcome" to {lead.phone}
Delay: 5 minutes
Condition: lead.source IN ["website", "instagram"]
```

**Health status dashboard:**
- All devices: ping latency, message success rate
- System alerts: disconnected device, high failure rate, queue depth > 100

### 5.2 System Health Monitor

- API response time heatmap (24h)
- Database connection pool status
- SMTP delivery rate
- WebSocket active connections
- Cron job last-run status
- Error rate per route (top 10)

### 5.3 MongoDB Atlas Integration

- Cluster health (existing feature, keep)
- Slow queries (top 10)
- Index recommendations
- Collection sizes
- Backup status

### 5.4 Cron Job Manager

- Job list with schedule, last run, next run, status
- Run manually
- Enable/disable
- View last 10 run logs per job
- Alert on failure

---

## ZONE 6: CRM — COMPLETE REDESIGN

### Architecture

```
CRM V5
├── Companies      (B2B organizations)
├── People         (individual contacts)
├── Leads          (unqualified prospects)
├── Deals          (qualified opportunities)
├── Activities     (all interactions)
├── Pipeline       (visual deal stages)
├── Campaigns      (marketing outreach)
└── Reports        (analytics)
```

### 6.1 Companies

Fields: name, industry, size, country, city, website, phone, address, VAT number, status (prospect/active/churned), assigned account manager, logo, notes

Actions: add contact, create deal, log activity, send email, send WhatsApp, view timeline

### 6.2 People (Contacts)

Fields: fullName, role/title, company (linked), phone, email, WhatsApp, LinkedIn, preferred contact method, language (AR/EN), status, source

### 6.3 Leads

Fields: (existing CrmLead fields +) company link, contact link, budget range, timeline, decision-maker flag, competitor used

Stages: new → contacted → qualified → proposal sent → negotiation → won → lost

### 6.4 Deals (NEW)

A Deal is a qualified lead that has become a formal sales opportunity.

Fields: title, company, contact, value, currency, probability, expectedCloseDate, stage, assignedTo, products/services, notes

Pipeline stages:
```
Qualification → Discovery → Proposal → Negotiation → Contract → Closed Won / Closed Lost
```

Probability by stage (configurable):
- Qualification: 20%
- Discovery: 40%
- Proposal: 60%
- Negotiation: 80%
- Contract: 95%

### 6.5 Activities (Unified Timeline)

Every interaction logged: call, email, WhatsApp message, meeting, note, task, proposal sent, contract sent, payment received

Timeline view per Company / Person / Lead / Deal showing every touchpoint chronologically.

### 6.6 Lead Scoring

Automatic score (0–100) based on:
- Profile completeness (+10)
- Company size (+5–15)
- Budget indication (+0–20)
- Engagement frequency (+1 per activity)
- Response time to outreach (+5 for fast response)
- Source quality (website=10, referral=20, cold=5)

Score thresholds: Cold (0–30) / Warm (31–60) / Hot (61–80) / Burning (81–100)

### 6.7 Pipeline View

Kanban board with:
- Deal cards (title, value, probability, days in stage)
- Drag to move between stages
- Stage totals (count + weighted value)
- Color coding by probability
- Overdue deals highlighted
- Filter by assignee / date range / product

### 6.8 Forecasting

- Monthly/quarterly revenue forecast
- Based on: deal probability × deal value × expected close date
- Best case / most likely / worst case scenarios
- Comparison to target

### 6.9 CRM Reports

- Lead conversion rate (by source, by assignee)
- Deal win rate (by assignee, by sector)
- Average deal value
- Sales cycle duration
- Pipeline velocity
- Activity volume per rep
- Campaign ROI

### 6.10 WhatsApp Integration in CRM

- Send WhatsApp message directly from lead/deal/contact card
- Message logged in activity timeline
- Select from templates
- See delivery/read status

---

## ZONE 7: PROJECTS

### Project Lifecycle

```
Order Approved →
  → Kickoff Meeting Scheduled (QMeet)
  → Contract Signed (digital)
  → Project Created (internal)
  → Milestones defined
  → Team assigned
  → Work begins
  → Per-milestone client review
  → Client approves milestone
  → Next milestone unlocked
  → Final delivery + approval
  → Invoice generated
  → Project archived
```

### Project Board V2

- Timeline view (Gantt-style):
  ```
  Milestone 1: Design    [====]
  Milestone 2: Backend        [========]
  Milestone 3: Frontend              [======]
  Milestone 4: Testing                     [===]
  ```
- Kanban view: Per-milestone task board
- List view: All tasks sortable/filterable
- Calendar view: Deadlines and meetings

### Milestone-Gated Delivery

- Each milestone has:
  - Deliverables list
  - Review deadline
  - Client approval required (yes/no)
  - Internal acceptance criteria
- Client receives email + notification when milestone ready for review
- Client can: approve, request revision (with comment), escalate
- Approval unlocks next milestone

### Project Vault

- Secure file storage per project
- Categories: designs, specs, source code, contracts, reports
- Version history per file
- Access control: client sees only approved deliverables

### Change Request Workflow

1. Client submits change request (from project view)
2. Employee categorizes: bug / feature / scope change
3. Manager reviews and prices (if scope change)
4. Quote sent to client
5. Client approves/rejects
6. If approved: new task(s) created, linked to change request

---

## ZONE 8: FINANCE

### ZATCA Compliance (Saudi e-Invoicing)

Every invoice issued by QIROX must comply with Phase 2 ZATCA requirements:
- QR code encoded with: seller name, VAT number, invoice date, total, VAT amount
- XML format for B2B invoices
- Integration with ZATCA clearance API

### Finance Dashboard

- Profit & Loss (MTD / QTD / YTD)
- Revenue by service type
- Outstanding receivables aging (0–30 / 31–60 / 61–90 / 90+ days)
- Payroll summary (this month's liabilities)
- Cash flow projection (next 30 days)

### Invoice Lifecycle

```
Draft → Sent → Viewed → Partial Pay → Paid / Overdue
```

Automated actions:
- Sent: email + WhatsApp notification to client
- Viewed: logged (no action)
- 3 days before due: reminder email
- Due date: WhatsApp reminder
- 7 days overdue: escalation to manager
- 14 days overdue: automatic late fee applied (if enabled)

### Payroll V2

- Salary types: fixed / hourly / commission-based
- Attendance-based hours calculation
- Commission rules per employee
- Payroll approval workflow (manager → admin)
- Payslip generation (PDF)
- Bank transfer batch export

---

## ZONE 9: MARKETING

### Email Marketing V2

- Audience segments: all / active clients / prospects / churned
- Campaign types: newsletter / promotion / drip / triggered
- Drag-and-drop template builder (Arabic RTL)
- A/B testing (subject line / content)
- Scheduling with timezone awareness (Riyadh: AST +3)
- Open rate / click rate / unsubscribe tracking

### SEO Strategy (Engineering-First, Organic Only)

**Target keywords:**
- Primary: QIROX, QIROX Studio, Qirox Studio
- Arabic primary: شركة برمجيات سعودية، نظام ERP، CRM عربي، تحويل رقمي
- Sector-specific: نظام مطعم، نظام POS، نظام محاسبة
- Branded variants: AIROX Studio (typo tolerance)

**Technical SEO implementation:**
- Structured data (JSON-LD) for: Organization, WebApplication, Article, FAQPage, BreadcrumbList, Offer
- Hreflang: `ar-SA` / `en` per page
- Canonical tags on all pages
- Sitemap V2: cover all 50+ public pages including case studies, blog, systems
- robots.txt: block /admin, /employee, /api
- Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms
- Server-side rendering for all public pages (critical for SEO)

**Content strategy:**
- 2 blog posts per week (Arabic-first)
- One case study per completed project (with client approval)
- Sector guides (10 sectors × 3 long-form articles)
- FAQ pages per service type

### Loyalty & Referral Programs

- Points: earned on payment, usage milestones, referrals
- Redemption: against wallet balance, discounts, upgrades
- Referral: tiered rewards (Level 1 / Level 2 tracking)
- Gamification: badges, leaderboard (opt-in)

---

## ZONE 10: SUPPORT

### Support V2 Architecture

```
Client has issue
  ↓
AI Pre-Screen (answers if knowledge base can resolve)
  ↓ (if unresolved)
Ticket created with: category, priority, SLA timer started
  ↓
Auto-assigned to available support agent (round-robin)
  ↓
Agent responds within SLA window
  ↓ (if complex: escalate to manager)
Resolution logged
  ↓
Client satisfaction survey (1-click)
  ↓
Ticket closed + knowledge base article suggested
```

### SLA Tiers

| Ticket Priority | First Response SLA | Resolution SLA |
|---|---|---|
| Critical | 30 minutes | 4 hours |
| High | 2 hours | 24 hours |
| Normal | 8 hours | 72 hours |
| Low | 24 hours | 7 days |

### Support Analytics

- Average first response time
- Average resolution time
- SLA breach rate
- Top issue categories
- Agent performance
- Client satisfaction score (CSAT)

---

## ZONE 11: EVENTS — COMPLETE PLATFORM

### Purpose

A full corporate event management system enabling QIROX to manage client events, partner events, company events, and sell event management as a standalone service.

### Event Entity

```
Event
├── id, name, description
├── type: conference / workshop / ceremony / launch / networking
├── date, endDate, timezone
├── location: { venue, address, city, mapLink, onlineLink }
├── capacity, isPublic
├── branding: { logo, coverImage, primaryColor }
├── status: draft / published / live / ended / cancelled
├── organizerId (link to Company or User)
└── settings: { requireApproval, allowWalkIn, enableQR, enableWallet }
```

### Guest Management

```
Guest
├── id, eventId
├── type: individual / company
├── name, company, title
├── email, phone, whatsapp
├── category: attendee / speaker / sponsor / vip / media / staff
├── status: invited / confirmed / declined / waitlisted / attended / no_show
├── invitationSentAt, confirmedAt, checkedInAt
├── ticketCode (unique, encrypted QR payload)
└── customFields (event-specific)
```

### Invitation Flow

1. Admin creates guest list (bulk import CSV / manual)
2. System generates unique encrypted ticket per guest
3. Invitations sent via:
   - Email (branded HTML with QR code attachment)
   - WhatsApp (template with ticket link)
4. Guest confirms via landing page (optional form for dietary/session preferences)
5. Confirmation triggers:
   - Apple Wallet Pass delivery (if iOS)
   - Google Wallet Object delivery (if Android)
   - Calendar invite (.ics file)

### QR Ticket Specification

Encrypted payload:
```json
{
  "guestId": "...",
  "eventId": "...",
  "ticketCode": "QIROX-EVT-XXXXX",
  "issuedAt": "2026-07-10T10:00:00Z",
  "signature": "HMAC_SHA256"
}
```

QR displayed on:
- Email invitation
- Apple Wallet Pass
- Google Wallet Object
- Web ticket page (printable)

### Apple Wallet Event Pass

```
Pass Type: EventTicket
Event: eventName
Date: eventDate (localized Arabic + English)
Location: venueName
Address: venueAddress
Background: event cover color
Logo: QIROX logo
Strip Image: event cover image
Primary: guestName
Secondary: guestCategory, seatOrTable
Barcode: QR, content = encrypted ticket payload
Relevant Date: eventDate (triggers pass notification)
Relevant Location: { lat, lng, radius: 500m } (shows when near venue)
```

### Google Wallet Event Object

```
Generic Template:
  Header: QIROX Events
  CardTitle: eventName
  Subheader: guestName + category
  Body: date, venue
  Barcode: QR_CODE, encrypted payload
  Notification: triggered 1 day and 2 hours before event
```

### Check-in System

Scanner app (PWA on mobile — no App Store submission):
- Open camera
- Scan QR code
- Validate against server (online/offline mode)
- Display: guest name, category, VIP indicator, check-in status
- One-tap check-in confirmation
- Prevents duplicate check-in (server-side lock)
- Staff sees real-time attendance count

Offline mode:
- Encrypted guest list cached on device before event
- Check-ins queued and synced when connection restored

### Sessions

Each event can have multiple sessions:
```
Session
├── eventId, title, description
├── speaker: { name, title, company, photo, bio }
├── startTime, endTime, location (room/hall)
├── capacity (if different from event)
├── sessionPass: Apple/Google Wallet sub-pass
└── attendees (check-in per session)
```

### VIP Management

- VIP guests: separate entrance lane
- VIP flag shown in bold on scanner
- VIP lounge capacity tracking
- VIP-specific communication (different WhatsApp template, different email)

### Sponsors

```
Sponsor
├── eventId, companyId
├── tier: title / gold / silver / bronze
├── logo, website
├── boothLocation (if applicable)
├── benefits: { logo_on_materials, speaking_slot, attendee_list }
└── contactPerson
```

### Certificates

- Generated per attendee after event ends
- Template: event branding + guest name + session attended
- Signed with event organizer's name
- PDF download link sent via email
- Optional: Blockchain verification hash

### Reports

- Total invited / confirmed / attended / no-show
- Attendance by category (VIP / regular / speaker)
- Session attendance rates
- Geographic breakdown
- Company breakdown (which companies sent most attendees)
- Real-time check-in timeline (who arrived when)
- Post-event satisfaction survey results

### Event Calendar

- QIROX admin calendar showing all events
- Integration with employee calendars
- Client-facing calendar (upcoming events they're invited to)

---

## ZONE 12: KNOWLEDGE BASE

### Structure

```
Knowledge Base
├── Client Help Center (public, client-accessible)
│     ├── Getting Started
│     ├── Managing Your Project
│     ├── Payments & Wallet
│     ├── Support & Tickets
│     └── FAQ
├── Employee Wiki (internal)
│     ├── Company Handbook
│     ├── Process Documentation
│     ├── Technical Standards
│     ├── Sector Guides (10 sectors)
│     └── Tool How-Tos
└── Training Center
      ├── Onboarding Track (new employees)
      ├── Sales Track
      ├── Technical Track
      ├── Leadership Track
      └── Certification Tests
```

### Article Structure

```
Article
├── id, title (AR + EN), slug
├── category, subcategory
├── body (rich text, supports RTL)
├── audience: public / client / employee / admin
├── tags, relatedArticles
├── author, lastUpdatedAt
├── viewCount, helpfulCount, notHelpfulCount
└── attachments: [ video, PDF, image ]
```

### Search

- Full-text search in Arabic and English
- Search result highlights matching terms
- "Did this help?" feedback per article
- Most searched terms reported to admin

### Training Modules

```
Module
├── title, description, duration
├── track (onboarding / sales / technical / leadership)
├── sections: [ { title, type: video/text/quiz, content } ]
├── completionCriteria: { minScore: 80, allSections: true }
└── certificate: { template, issuedOnCompletion: true }
```

---

## ZONE 13: QIROX PRESENTATION

### Purpose

A standalone section of the website that functions as an Apple-keynote-style company pitch. Used in investor meetings, client presentations, and partner onboarding. Accessible at `/presentation`.

### Structure (Scroll-Animated)

```
Section 1: Opening — "QIROX"
  Full-screen, black background, logo animation, tagline reveal

Section 2: Who We Are
  Company story, founding year, team size, headquartered in KSA

Section 3: The Problem
  Arabic businesses deserve enterprise-grade software in Arabic

Section 4: The Solution
  QIROX — the systems factory for Arabic business

Section 5: Our Technology
  Stack visualization: React / Node.js / MongoDB / AI / WebRTC
  Infrastructure: hosted, secure, scalable

Section 6: Products & Services
  10-sector showcase with animated cards

Section 7: Platform Features
  CRM / Projects / Finance / Events / AI / Support

Section 8: By The Numbers
  Animated counters: clients, projects, sectors, uptime

Section 9: Client Stories
  3 case study spotlights

Section 10: Our Team
  Team grid (role + photo + brief)

Section 11: Technology Partners
  Partner logo grid

Section 12: Roadmap
  Timeline: V1 → V2 → V3 → V4 → V5 → V6 (vision)

Section 13: Investors
  Investment thesis, market size, traction metrics
  Contact CTA

Section 14: Contact / Next Step
  "نبدأ معاً" — Book a meeting CTA
```

---

## ZONE 14: AI PLATFORM

### AI Studio V2

- Chat interface (Arabic-first)
- Model: GPT-4o (primary) / Kimi fallback
- Vision: upload image, ask about it
- Image generation (Arabic prompt → English translation → Flux generation)
- Video generation (proxy)
- AI session history per user
- Anti-Chinese content enforcement in all system prompts

### AI-Powered Features (New)

**1. CRM Lead Intelligence**
- Analyze lead data → suggest optimal next action
- Predict close probability from activity pattern

**2. Project Estimate AI**
- Input: client requirements → output: timeline estimate + team composition
- Based on historical project data

**3. Support AI (First Responder)**
- Reviews incoming ticket → checks knowledge base → auto-responds if confident
- If not confident: drafts suggested response for agent review

**4. Content Generation**
- Generate case study draft from project data
- Generate social media posts (Arabic)
- Generate proposal/quotation content

**5. Analytics Insights**
- Weekly AI-generated business summary
- Anomaly detection: "مبيعات هذا الأسبوع أقل من المعدل بنسبة 30%"

---

## ZONE 15: ANALYTICS

### Business Intelligence Dashboard

**Executive View (admin/CEO):**
- Revenue vs target (gauge)
- New clients this month
- Active projects count
- Team utilization rate
- Customer satisfaction score
- Top performing sectors

**Sales View:**
- Lead funnel (visits → leads → demos → orders)
- Conversion rates per stage
- Revenue by sales rep
- Pipeline value

**Operations View:**
- Project delivery rate (on-time %)
- Average project duration by type
- Task completion rate per team
- Support ticket resolution time

**Finance View:**
- P&L by month
- Collections rate
- Outstanding AR by aging
- Payroll cost vs revenue ratio

---

## ZONE 16: AUTOMATION

### Automation Engine

A no-code rule builder for common business workflows.

**Trigger types:**
- Record created (lead, order, ticket, payment)
- Record updated (status changed)
- Date-based (7 days before deadline)
- Form submitted
- Webhook received

**Action types:**
- Send email
- Send WhatsApp (via device manager)
- Create notification (in-app)
- Create task
- Update record field
- Run cron job

**Example automations:**

```
[Lead Created] → Wait 5min → Send WhatsApp "lead_welcome"
[Order Approved] → Create Project → Assign Manager → Send Email "project_kickoff"
[Invoice Due in 3 days] → Send WhatsApp "payment_reminder"
[Support Ticket > 4hrs open] → Notify manager on Slack
[Employee Birthday] → Send WhatsApp "birthday_greeting"
[Project 100% Complete] → Send satisfaction survey → Generate invoice
```

---

## ZONE 17: QIROX STORE

### Product Catalog

- Devices: POS terminals, receipt printers, barcode scanners, attendance devices
- Software licenses: add-on modules, sector expansions
- Support packages: extended support hours

### Store Experience

- Product grid with: image, name, short description, price (SAR)
- Product page: full specs, compatibility, related products
- Cart + checkout (using existing Qirox Pay)
- Order fulfillment: manual (physical) or instant (digital license)

---

## APPLE COMPLIANCE PLAN

All of the following must be resolved before any iOS app submission:

| Issue | Resolution |
|---|---|
| External browser redirect for login | Implement ASWebAuthenticationSession or native sign-in |
| No account deletion | Add account deletion flow in profile settings |
| No native in-app payments | Add RevenueCat for subscription management |
| Privacy policy not clearly linked | Add persistent footer link |
| Right-click blocking in app | Remove entirely (detect iOS and disable) |
| Face recognition data | Add explicit consent screen + data stored locally |
| Data privacy disclosure | Add data practices declaration in App Store metadata |

---

## MOBILE STRATEGY

V5 targets progressive web app (PWA) excellence before native app development:

**PWA requirements:**
- Installable (Web App Manifest)
- Offline-capable (Service Worker for key routes)
- Push notifications (existing VAPID — keep)
- Add to home screen prompt
- Optimized for 390px viewport (iPhone 16)

**Native app (Phase 2):**
- React Native (Expo) for iOS + Android
- Client app only (not employee/admin)
- Features: dashboard, project tracking, wallet, support, notifications
- Apple Watch complication: project status + next action

---

*End of Product Blueprint. See QIROX_EXECUTION_PLAN.md for implementation roadmap.*
