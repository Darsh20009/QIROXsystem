# Sprint 004 — Order Journey V2
## Architecture & Design Document

**Sprint:** 004  
**Type:** Documentation & Architecture Only  
**Status:** No production code was modified. Expected downtime: ZERO.  
**Date:** 2026-07-11  
**Basis:** Full audit of `client/src/pages/`, `server/routes.ts`, and all related feature files.

---

## 1. Current Journey

The current customer journey spans nine distinct systems with no unified orchestration layer.

### 1.1 Discovery → Service Selection

| Step | Page / Component | What Happens |
|---|---|---|
| Lands on homepage | `/` → `Home.tsx` | Marketing copy, CTA buttons ("ابدأ فكرتك", "تواصل واتساب") |
| Browses services | `/prices` → `Prices.tsx` | Static tier cards: Lite / Pro / Infinite. No personalisation. |
| Starts wizard | `/quickstart` → `QuickStart.tsx` | 5-step AI wizard: sector → idea text → features → budget → contact preference |
| Wizard completes | `sessionStorage: qiroxWizardData` | JSON blob stored in browser session, redirects to `/checkout` |

### 1.2 Order Configuration → Checkout

| Step | Page / Component | What Happens |
|---|---|---|
| Checkout Step 1 | `Checkout.tsx` | Collects: `recipientName`, `recipientPhone`, city, district, street, `nationalAddressId` |
| Checkout Step 2 | `Checkout.tsx` | Payment method: wallet \| card \| bank transfer \| PayPal |
| Checkout Step 3 | `Checkout.tsx` | Confirmation screen. Bank transfers: upload proof via `PATCH /api/orders/:id/proof` |
| Order submitted | `POST /api/orders` | Order record created. Cart cleared. `sessionStorage` deleted. |
| Additional specs | `OrderFlow.tsx` | Post-order: client can add detailed specs, upload files via `PATCH /api/orders/:id/details` |

### 1.3 Internal Processing (Employee Portal — invisible to client)

| Step | Tool | What Happens |
|---|---|---|
| Order received | `AdminOrders.tsx` | Employee sees new order in list view |
| Kanban movement | `AdminKanban.tsx` | Order moved through status columns |
| Quotation created | `AdminQuotations.tsx` | Employee manually creates quotation: line items, VAT, discount |
| Quotation sent | `POST /api/quotations/:id/send-email` | Email sent to client |

### 1.4 Quotation → Payment

| Step | Page / Component | What Happens |
|---|---|---|
| Client views quotation | `ClientQuotations.tsx` | List view of quotations. No context, no explanation. |
| Quotation detail / print | `QuotationPrint.tsx` | PDF-style view |
| Accept or reject | `POST /api/quotations/:id/status` | Two-button action |
| Invoice generated | `ClientInvoices.tsx` | Invoice appears in separate invoices tab |
| Payment | `PayPalButton.tsx`, `ClientWallet.tsx`, bank transfer | Multiple disjointed payment paths |
| Installments | `ClientInstallments.tsx` | Separate page if installment plan is active |

### 1.5 Project Creation → Delivery

| Step | Page / Component | What Happens |
|---|---|---|
| Project created | Employee portal (`AdminProjects`) | Employee creates project record after payment confirmation |
| Client sees project | `Dashboard.tsx` tabs: `details`, `specs`, `manage` | Project context switcher if multiple projects |
| Project workspace | `/project/:id/workspace` → `ProjectWorkspace.tsx` | Tabs: tasks, bugs, meetings, files, comments |
| Communication | `CSChat.tsx` (WebSocket) + `ProjectComments.tsx` | Two separate communication channels |
| Delivery | Files uploaded by employee to workspace | No dedicated delivery moment |
| Review | `POST /api/orders/:orderId/review` | Triggered from workspace or admin prompt |

### 1.6 Post-Delivery

| Step | Page / Component | What Happens |
|---|---|---|
| Support tickets | `SupportTickets.tsx` | Separate page, no project context |
| Loyalty points | `ClientLoyalty.tsx` | Isolated page, not surfaced naturally |
| Referral | `ClientReferral.tsx` | Isolated page |
| Onboarding | `ClientOnboarding.tsx` | Exists but not systematically triggered |
| Order tracking | `TrackOrder.tsx` | Tracks consultation leads, not orders |

---

## 2. Problems

### P-01 — Fragmented Discovery
**What:** The homepage, `/prices`, and `/quickstart` are three disconnected experiences. A client who visits `/prices` sees static tiers with no wizard. A client who visits `/quickstart` goes through 5 steps but gets dropped into a generic checkout with no confirmation of what they configured.  
**Evidence:** `QuickStart.tsx` stores data in `sessionStorage` key `qiroxWizardData` and navigates to `/checkout`. Checkout reads `sessionStorage` — if the tab is closed or refreshed mid-flow, all data is lost.

### P-02 — sessionStorage Data Handoff Is Fragile
**What:** The entire wizard configuration (sector, features, budget, contact preference, addons) is serialised into `sessionStorage` and read back in `Checkout.tsx`. There is no server persistence of draft orders. Tab close = lost work.  
**Evidence:** `Checkout.tsx` line 191 — `sessionStorage.getItem("qiroxWizardData")`, deleted at line 481 on success.

### P-03 — No Live Price Estimation
**What:** Clients select a tier (Lite/Pro/Infinite) and addons but do not see a live running total during the wizard. The price is only revealed at checkout.  
**Evidence:** `QuickStart.tsx` has `BUDGETS_AR_SAR` ranges (under 15k / 15k–50k / 50k+) but no dynamic price computation tied to feature selection.

### P-04 — No Timeline Preview Before Committing
**What:** Clients pay before knowing how long their project will take. There is no estimated delivery timeline shown during the order flow.  
**Evidence:** No timeline component exists in `QuickStart.tsx`, `Checkout.tsx`, or `OrderFlow.tsx`.

### P-05 — Black Hole Between Order and Quotation
**What:** After the client submits an order, they are sent to the dashboard with no indication of what happens next or when to expect a response. The quotation is created manually by an employee with no SLA shown to the client.  
**Evidence:** `Checkout.tsx` Step 3 is a static confirmation. The quotation creation lives entirely in `AdminQuotations.tsx` — the client has no visibility until an email arrives.

### P-06 — Quotation Experience Is Cold and Functional
**What:** `ClientQuotations.tsx` presents a list of quotation records. There is no narrative — no explanation of line items, no comparison with what was requested, no guided "accept" moment.  
**Evidence:** `QuotationPrint.tsx` is a PDF renderer. `ClientQuotations.tsx` is a table with Accept/Reject buttons.

### P-07 — No Digital Agreement Layer
**What:** Accepting a quotation is a two-button action with no formal agreement flow, no terms presented, no acknowledgement stored. For projects costing SAR 5,000–100,000+, this is a legal and trust gap.  
**Evidence:** `POST /api/quotations/:id/status` is the only acceptance mechanism. No signature, no agreement record.

### P-08 — Payment Experience Has No Context
**What:** `ClientInvoices.tsx` and the payment components (PayPalButton, wallet) are functional but sterile. The client pays an invoice number with no reminder of what the project is, what milestone is being paid, or what comes next after payment.  
**Evidence:** `ClientInvoices.tsx` is a table. `PayPalButton.tsx` is a standalone payment widget.

### P-09 — Post-Payment Void
**What:** After a successful payment, the client lands on the dashboard with no celebration, no "what happens next" guidance, and no indication of when the project kickoff will occur.  
**Evidence:** `Checkout.tsx` Step 3 shows a generic "order placed" confirmation. No kickoff scheduling, no team introduction.

### P-10 — Project Workspace Is Employee-Oriented
**What:** `ProjectWorkspace.tsx` exposes tasks, bugs, meetings, and files — all of which are meaningful to employees. For a client, seeing bug statuses and internal task states is noise. There is no client-specific view of "my project's progress."  
**Evidence:** `ProjectWorkspace.tsx` imports all status types including `ISSUE_STATUSES` (open/in_progress/resolved/closed) and `PRIORITIES` (low/medium/high/critical) — none of which are client-facing concepts.

### P-11 — Delivery Has No Moment
**What:** When a project is completed, files are uploaded by employees to the workspace. The client discovers this incidentally — there is no dedicated delivery experience, no handover narrative, no prompt to confirm acceptance.  
**Evidence:** Delivery is handled via `PATCH /api/admin/projects/:id/delivery` — an admin action. There is no corresponding client-side delivery confirmation screen.

### P-12 — Review Is Buried
**What:** The review prompt (`POST /api/orders/:orderId/review`) is triggered from the workspace with no celebratory context. It is an afterthought, not a designed moment.  
**Evidence:** `AdminReviews.tsx` is for admin management. Client review submission is a low-prominence action.

### P-13 — Support Is Disconnected From Project Context
**What:** `SupportTickets.tsx` is a standalone page. A client opening a ticket must manually explain which project they are referencing. There is no automatic linking.  
**Evidence:** `SupportTickets.tsx` has no project selector or project context passed to `POST /api/support-tickets`.

### P-14 — Loyalty and Referral Are Islands
**What:** `ClientLoyalty.tsx` and `ClientReferral.tsx` exist but are never surfaced at the natural moments where they would convert best: post-delivery, post-review, or at account registration.  
**Evidence:** No loyalty/referral prompt in `Checkout.tsx`, `ClientOnboarding.tsx`, or any delivery flow.

### P-15 — No Single "Where Is My Project?" Answer
**What:** A client who wants to know their project status must navigate: Dashboard → project switcher → tabs → workspace. The answer is fragmented across 4 UI layers.  
**Evidence:** Dashboard.tsx uses `Tabs` with `details`, `specs`, and `manage` — none explicitly labelled "current status."

---

## 3. Root Causes

| Root Cause | Problems It Drives |
|---|---|
| **No journey state machine on the client** — each page is independent, no shared context | P-01, P-05, P-09, P-15 |
| **No server-side draft order** — wizard data lives only in `sessionStorage` | P-02, P-03 |
| **Missing orchestration layer** — no component that says "you are on step N of M, here is what is next" | P-01, P-05, P-09, P-10, P-15 |
| **Employee portal and client portal share the same data model without filtering** | P-10, P-13 |
| **Features built independently, not as a journey** — quotations, invoices, delivery, support all have their own isolated UX | P-06, P-07, P-08, P-11, P-12, P-13, P-14 |
| **No designed handover moments** — transitions between phases (order→quotation, payment→kickoff, production→delivery) have no ceremony | P-05, P-08, P-09, P-11, P-12 |

---

## 4. New Journey

### 4.1 Design Principles

1. **One screen, one decision.** Every screen has exactly one primary action.
2. **Always answer three questions:** Where am I? What is happening? What is next?
3. **Progress is always visible.** A persistent status bar shows phase + step.
4. **Transitions are celebrated.** Every phase change has a moment — not a redirect.
5. **Client language only.** No technical statuses (bug, sprint, backlog) visible to clients.
6. **Smart defaults everywhere.** Pre-fill from wizard data. Never ask twice.
7. **Context-aware actions.** Every action is in the context of the current project.

### 4.2 Journey Map — New Flow

```
PHASE 0: Discovery
  ├── Smart Service Wizard         (/start)
  │     └── Sector → Idea → Features → Budget → Contact
  │           └── Live Price Estimation (real-time as features are selected)
  │                 └── Timeline Preview (estimated delivery range)
  └── Draft Order Created (server-persisted, not sessionStorage)

PHASE 1: Proposal
  ├── Proposal Generation          (internal — employee portal, async)
  ├── Proposal Review Experience   (/proposal/:id)
  │     └── Line items explained → Timeline → Team introduction
  └── Digital Agreement            (/proposal/:id/sign)
        └── One-click acceptance with audit trail

PHASE 2: Payment
  ├── Payment Experience           (/invoice/:id/pay)
  │     └── What you're paying for → Milestone context → Payment method
  └── Payment Confirmation         (/invoice/:id/success)
        └── Celebration → Next steps → Kickoff scheduling

PHASE 3: Kickoff
  ├── Kickoff Experience           (/project/:id/kickoff)
  │     └── Team introduction → Timeline confirmed → First task for client
  └── Project opens in Client Progress Center

PHASE 4: Production
  └── Client Progress Center       (/project/:id)
        ├── Single status bar (phase + % complete)
        ├── Client tasks (only tasks that require client action)
        ├── Updates feed (milestones, not internal tasks)
        ├── Files shared with client
        └── Project chat (single communication channel)

PHASE 5: Delivery
  ├── Delivery Experience          (/project/:id/delivery)
  │     └── Files presented → Acceptance prompt → "Your project is ready" moment
  └── Delivery Confirmation        (PATCH /api/projects/:id/delivery-accepted)

PHASE 6: Review
  └── Review Experience            (/project/:id/review)
        └── Celebration → Star rating → Written review → Referral prompt

PHASE 7: Post-Delivery
  ├── Referral Experience          (surfaced inline in Review Experience)
  ├── Loyalty                      (surfaced inline post-review)
  └── Support                      (/project/:id/support)
        └── Always in project context — no "which project?" question
```

### 4.3 Phase-by-Phase Detail

#### Phase 0 — Discovery

**Entry points:** Homepage CTA, `/prices`, direct `/start` link.

**Smart Service Wizard** (`/start`) — replaces the disconnected `QuickStart` + `Prices` split:
- Step 1: Sector selection (8 options, visual cards)
- Step 2: Business name + idea description (2 fields, AI-assisted suggestion)
- Step 3: Feature selection (multi-select, 10 options)
- Step 4: Budget awareness (4 ranges)
- Step 5: Contact preference + availability
- **Live Price Estimation** — runs on every feature toggle. Shows a range (e.g. SAR 18,000–25,000) based on selected tier + addons. Not a binding quote.
- **Timeline Preview** — shows estimated delivery range (e.g. 6–10 weeks) based on scope.
- On completion: `POST /api/v2/draft-orders` persists the wizard state server-side. Returns a `draftOrderId`. Browser stores only the ID.

**Smart Project Builder** (embedded in Step 3) — when features are selected, a right-panel summary updates showing:
- Recommended tier (auto-selected based on feature combination)
- Estimated price range
- Estimated timeline

#### Phase 1 — Proposal

**Proposal Review Experience** (`/proposal/:id`):
- Full-screen, single-focus layout
- Sections: What you get → Pricing breakdown (line items with plain-Arabic descriptions) → Delivery timeline (Gantt-style visual) → Team introduction (employee card)
- Single primary action: "Review and Sign"

**Digital Agreement** (`/proposal/:id/sign`):
- Inline agreement text (project scope, payment terms, revision policy)
- Digital acceptance: typed name or checkbox acknowledgement
- Stored as `agreementSignedAt` + `agreementText` snapshot on the quotation record
- Single primary action: "I agree — start my project"
- On acceptance: `POST /api/quotations/:id/accept` (new endpoint — does not modify existing `/status`)

#### Phase 2 — Payment

**Payment Experience** (`/invoice/:id/pay`):
- Hero: project name + "You're paying for: [milestone name]"
- Payment breakdown: what this milestone covers
- Payment methods: wallet (balance shown) \| PayPal \| bank transfer
- Single primary action: "Pay SAR X,XXX"
- Progress indicator: "Payment 1 of 2" if milestone-based

**Payment Confirmation** (`/invoice/:id/success`):
- Celebration animation (Framer Motion)
- "What happens next" timeline: 3 steps shown (Kickoff scheduled → Team starts → First update in X days)
- CTA: "View my project" → goes to Client Progress Center

#### Phase 3 — Kickoff

**Kickoff Experience** (`/project/:id/kickoff`):
- Triggered when employee sets project to `in_progress`
- Client sees: "Your project has started!" + team card + confirmed timeline
- First client task surfaced: "Upload your brand assets" or "Confirm requirements"
- Single primary action: "Let's go" → enters Client Progress Center

#### Phase 4 — Production (Client Progress Center)

**Client Progress Center** (`/project/:id`):
- Replaces `ProjectWorkspace.tsx` for client role — employees still see the full workspace
- **Status bar:** Phase name (e.g. "Design Phase") + progress % + estimated completion date
- **Updates Feed:** Employee-published milestones only (not raw task changes). E.g. "Wireframes complete ✓", "Backend connected ✓"
- **Client Tasks:** Only tasks tagged `clientVisible: true` + `assigned: client`. No internal tasks.
- **Shared Files:** Only files tagged for client delivery. No internal uploads.
- **Project Chat:** Single channel — replaces the split between `CSChat` and `ProjectComments`. One conversation, one CTA.
- **No bugs tab, no sprint tab, no internal status labels.**

#### Phase 5 — Delivery

**Delivery Experience** (`/project/:id/delivery`):
- Triggered when employee marks project as delivered
- Push notification + in-app notification sent to client
- Client sees: "Your project is ready" → File showcase (previews of deliverables) → Acceptance prompt
- Single primary action: "Accept delivery"
- On acceptance: `PATCH /api/projects/:id/delivery-accepted` (new endpoint)
- Confetti animation on acceptance

#### Phase 6 — Review

**Review Experience** (`/project/:id/review`):
- Triggered immediately after delivery acceptance
- Full-screen, celebratory design
- Step 1: Star rating (1–5)
- Step 2: What did you like most? (optional text)
- Step 3: Would you recommend us? → surfaces referral code inline
- CTA: "Share your experience" → pre-filled WhatsApp/social share

#### Phase 7 — Post-Delivery

**Support** (`/project/:id/support`):
- Support ticket creation is always in project context — `projectId` auto-filled
- Shows previous tickets for the same project
- No more standalone `SupportTickets.tsx` for existing projects (new projects still use general support)

**Referral Experience** (inline in Review, also available in `/account/referrals`):
- Post-review: "Earn SAR 500 for every client you refer"
- Share link auto-generated, WhatsApp share pre-filled

**Loyalty** (inline post-review, also `/account/loyalty`):
- "You earned X points on this project"
- Points redemption CTA for next order

---

## 5. UX Rules

| # | Rule | Rationale |
|---|---|---|
| R-01 | Every page has exactly **one primary CTA**. Secondary CTAs use `variant="outline"` or `variant="ghost"`. | Eliminates decision paralysis |
| R-02 | A **persistent phase indicator** is visible on every journey page (not the main nav). | Answers "where am I?" at all times |
| R-03 | **Client-facing status labels** are business-language only: "In Progress", "Under Review", "Ready for Review", "Delivered". Never: "open", "in_progress", "bug", "sprint". | Reduces anxiety, builds trust |
| R-04 | **Loading states** are never blank — always show a skeleton or a progress animation. | Prevents "did it work?" uncertainty |
| R-05 | **Every transition** between phases has a dedicated screen (not a redirect). Duration: 1.5–3 seconds. Can be skipped with a tap. | Makes progress feel real |
| R-06 | **Smart defaults**: wizard data pre-fills checkout fields. Profile name pre-fills agreement. No field should be filled twice. | Reduces friction |
| R-07 | **Mobile-first layout**: max-width 640px, bottom-anchored primary CTA on mobile. | Arabic-speaking market is >70% mobile |
| R-08 | **RTL-first**: all layouts, animations (slide-in directions), and arrow icons must be RTL by default. LTR is a config flag. | Core language is Arabic |
| R-09 | **Error states** always offer a next action: never a dead-end error message. | Prevents abandonment |
| R-10 | **Notifications** are proactive: the client should never need to "check" — they should receive pushes at every phase transition. | Eliminates "has anything happened?" anxiety |

---

## 6. Required Components

All new components live in `client/src/features/customer-journey/`. No existing components are modified.

### 6.1 Wizard Components

| Component | Path | Purpose |
|---|---|---|
| `ServiceWizard` | `wizard/ServiceWizard.tsx` | Root wizard orchestrator — replaces `QuickStart.tsx` navigation |
| `WizardStep` | `wizard/WizardStep.tsx` | Single step wrapper with progress bar and back/next controls |
| `SectorPicker` | `wizard/steps/SectorPicker.tsx` | Sector selection grid (Step 1) |
| `IdeaForm` | `wizard/steps/IdeaForm.tsx` | Business name + description (Step 2) |
| `FeaturePicker` | `wizard/steps/FeaturePicker.tsx` | Feature multi-select (Step 3) |
| `BudgetPicker` | `wizard/steps/BudgetPicker.tsx` | Budget range selection (Step 4) |
| `ContactForm` | `wizard/steps/ContactForm.tsx` | Contact preferences + availability (Step 5) |
| `LivePricePanel` | `wizard/LivePricePanel.tsx` | Real-time price estimation sidebar |
| `TimelinePreview` | `wizard/TimelinePreview.tsx` | Estimated delivery range visualisation |
| `SmartProjectBuilder` | `wizard/SmartProjectBuilder.tsx` | Right-panel summary: recommended tier + addons |

### 6.2 Proposal Components

| Component | Path | Purpose |
|---|---|---|
| `ProposalViewer` | `proposal/ProposalViewer.tsx` | Full proposal layout with sections |
| `ProposalLineItems` | `proposal/ProposalLineItems.tsx` | Client-language line item table |
| `ProposalTimeline` | `proposal/ProposalTimeline.tsx` | Gantt-style delivery timeline |
| `TeamIntroCard` | `proposal/TeamIntroCard.tsx` | Employee introduction card |
| `DigitalAgreement` | `proposal/DigitalAgreement.tsx` | Agreement text + acceptance mechanism |
| `AgreementSignature` | `proposal/AgreementSignature.tsx` | Typed-name or checkbox acceptance |

### 6.3 Payment Components

| Component | Path | Purpose |
|---|---|---|
| `PaymentExperience` | `payment/PaymentExperience.tsx` | Milestone-aware payment screen |
| `MilestonePaymentCard` | `payment/MilestonePaymentCard.tsx` | "You are paying for:" context card |
| `PaymentConfirmation` | `payment/PaymentConfirmation.tsx` | Post-payment celebration + next steps |
| `NextStepsTimeline` | `payment/NextStepsTimeline.tsx` | 3-step "what happens next" timeline |

### 6.4 Kickoff Components

| Component | Path | Purpose |
|---|---|---|
| `KickoffExperience` | `kickoff/KickoffExperience.tsx` | "Your project has started!" screen |
| `TeamCard` | `kickoff/TeamCard.tsx` | Assigned employee introduction |
| `ConfirmedTimeline` | `kickoff/ConfirmedTimeline.tsx` | Final agreed delivery timeline |
| `FirstClientTask` | `kickoff/FirstClientTask.tsx` | First action required from client |

### 6.5 Client Progress Center Components

| Component | Path | Purpose |
|---|---|---|
| `ClientProgressCenter` | `progress/ClientProgressCenter.tsx` | Root shell — replaces ProjectWorkspace for clients |
| `ProjectStatusBar` | `progress/ProjectStatusBar.tsx` | Persistent phase + % + ETA bar |
| `UpdatesFeed` | `progress/UpdatesFeed.tsx` | Employee-published milestones only |
| `ClientTaskList` | `progress/ClientTaskList.tsx` | Client-visible tasks only |
| `SharedFilesSection` | `progress/SharedFilesSection.tsx` | Client delivery files only |
| `ProjectChatWidget` | `progress/ProjectChatWidget.tsx` | Unified single chat channel |

### 6.6 Delivery Components

| Component | Path | Purpose |
|---|---|---|
| `DeliveryExperience` | `delivery/DeliveryExperience.tsx` | "Your project is ready" screen |
| `DeliverableShowcase` | `delivery/DeliverableShowcase.tsx` | File/preview carousel |
| `DeliveryAcceptance` | `delivery/DeliveryAcceptance.tsx` | Acceptance prompt + confirmation |

### 6.7 Review Components

| Component | Path | Purpose |
|---|---|---|
| `ReviewExperience` | `review/ReviewExperience.tsx` | Full-screen review flow |
| `StarRating` | `review/StarRating.tsx` | Animated star picker |
| `ReviewWriteForm` | `review/ReviewWriteForm.tsx` | Optional written review |
| `ReferralInline` | `review/ReferralInline.tsx` | Inline referral CTA with share link |

### 6.8 Shared / Utility

| Component | Path | Purpose |
|---|---|---|
| `PhaseTransition` | `shared/PhaseTransition.tsx` | Animated transition screen between phases |
| `JourneyStatusBar` | `shared/JourneyStatusBar.tsx` | Persistent phase indicator strip |
| `ClientStatusBadge` | `shared/ClientStatusBadge.tsx` | Maps internal statuses to client language |
| `ActionCard` | `shared/ActionCard.tsx` | Unified "here is your next action" card |

---

## 7. Required APIs (Future — Do Not Implement Now)

All new endpoints are additive. No existing endpoints are modified.

### 7.1 Draft Order API

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v2/draft-orders` | Create server-persisted wizard session |
| `GET` | `/api/v2/draft-orders/:id` | Resume wizard from any device |
| `PATCH` | `/api/v2/draft-orders/:id` | Update wizard state incrementally |
| `POST` | `/api/v2/draft-orders/:id/submit` | Convert draft → formal order |

**Payload for POST /api/v2/draft-orders:**
```json
{
  "sector": "restaurant",
  "businessName": "My Café",
  "ideaDescription": "...",
  "selectedFeatures": ["website", "booking", "payment"],
  "budgetRange": "medium",
  "contactPreference": "whatsapp",
  "recommendedTier": "pro",
  "estimatedPriceMin": 18000,
  "estimatedPriceMax": 25000,
  "estimatedWeeksMin": 6,
  "estimatedWeeksMax": 10
}
```

### 7.2 Price Estimation API

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v2/estimate-price` | Live price range from features + tier selection |

**Payload:**
```json
{
  "tier": "pro",
  "features": ["website", "mobile", "booking"],
  "sector": "restaurant"
}
```

**Response:**
```json
{
  "priceMin": 18000,
  "priceMax": 25000,
  "currency": "SAR",
  "timelineWeeksMin": 6,
  "timelineWeeksMax": 10,
  "recommendedTier": "pro"
}
```

### 7.3 Digital Agreement API

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v2/quotations/:id/accept` | Accept quotation + record agreement |
| `GET` | `/api/v2/quotations/:id/agreement` | Retrieve agreement record |

**Payload for POST /api/v2/quotations/:id/accept:**
```json
{
  "agreementText": "...",
  "clientSignature": "Mohammed Al-Ahmadi",
  "acceptedAt": "2026-07-11T10:00:00Z",
  "ipAddress": "x.x.x.x"
}
```

### 7.4 Delivery Acceptance API

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v2/projects/:id/delivery-accept` | Client formally accepts delivery |
| `GET` | `/api/v2/projects/:id/delivery-status` | Client-facing delivery status |

### 7.5 Client Progress API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v2/projects/:id/client-view` | Client-filtered project view (no internal data) |
| `GET` | `/api/v2/projects/:id/updates` | Employee-published milestone updates only |
| `GET` | `/api/v2/projects/:id/client-tasks` | Tasks assigned to client only |
| `GET` | `/api/v2/projects/:id/shared-files` | Files tagged for client delivery |

### 7.6 Journey State Persistence API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v2/journey/state` | Fetch current journey state for logged-in client |
| `PATCH` | `/api/v2/journey/state` | Update journey step status from server event |

---

## 8. Risks

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| **Scope creep into existing flows** — V2 components accidentally imported into current pages | Critical | Medium | All V2 code stays in `client/src/features/customer-journey/`. Barrel import enforced. Code review gate. |
| **Draft order API introduces a new data model** — MongoDB collection `draft_orders` needs careful expiry design | High | High | Add TTL index (7 days). Implement cleanup cron. Design before implementing. |
| **Price estimation is advisory, not contractual** — client may anchor to estimated range | High | High | UI copy must clearly state "estimated range — final price confirmed in proposal." Legal review required. |
| **Digital agreement has legal weight** — if `agreementSignedAt` is used as evidence in disputes | High | Medium | Store IP, timestamp, full text snapshot, user agent. Get legal review of agreement template. |
| **Client Progress Center filters vs. employee workspace** — risk of accidentally hiding critical information from clients | Medium | Medium | Use explicit `clientVisible` flags on tasks/files. Default is `false` (not visible). Audit in Sprint 005. |
| **Two parallel journeys running simultaneously** — V1 (current) and V2 (new) both active | Medium | High | Feature flags `FEATURE_CUSTOMER_JOURNEY_V2` and `FEATURE_DASHBOARD_V2` control exposure. Both default `false`. Same flags from Sprint 003. |
| **Employee portal changes required** — employees need to publish "milestone updates" and tag client-visible tasks | Medium | High | Employee portal changes are out of scope for Sprint 004. Plan as Sprint 006. V2 launch blocked until employee portal is ready. |
| **Payment milestone model does not exist yet** — current invoices are flat, not milestone-linked | Medium | Medium | `MilestonePaymentCard` can degrade gracefully to show "Project Payment" when milestone data is absent. |
| **Push notifications unreliable without VAPID secrets** — phase transitions rely on notifications | Low | High (VAPID not yet configured) | In-app notification bell is fallback. Configure VAPID in environment before V2 launch. |

---

## 9. Migration Strategy

### Phase A — Infrastructure (Sprint 004 prerequisite, no user impact)
1. Design MongoDB schema for `draft_orders` collection (TTL: 7 days)
2. Define `clientVisible` flag on Project Task and File models (additive field, default `false`)
3. Define `agreementSignedAt` + `agreementText` fields on Quotation model (additive, nullable)
4. Define `deliveryAcceptedAt` field on Project model (additive, nullable)
5. All schema changes: additive only, no existing field modifications

### Phase B — API Layer (Sprint 005)
1. Implement `/api/v2/draft-orders` CRUD
2. Implement `/api/v2/estimate-price`
3. Implement `/api/v2/quotations/:id/accept`
4. Implement `/api/v2/projects/:id/client-view`, `/updates`, `/client-tasks`, `/shared-files`
5. Implement `/api/v2/projects/:id/delivery-accept`
6. All V2 routes namespaced under `/api/v2/` — zero conflict with existing `/api/` routes

### Phase C — Component Build (Sprint 006)
1. Build wizard components (ServiceWizard → LivePricePanel → TimelinePreview)
2. Build proposal components (ProposalViewer → DigitalAgreement)
3. Build payment components (PaymentExperience → PaymentConfirmation)
4. Build progress center (ClientProgressCenter → UpdatesFeed → ClientTaskList)
5. Build delivery + review experiences

### Phase D — Employee Portal Updates (Sprint 006, parallel)
1. Add "Publish milestone update" action to AdminKanban
2. Add `clientVisible` toggle to task creation in AdminOrders / AdminKanban
3. Add "Mark as client file" toggle to file upload in project management
4. No changes to existing employee workflows — additions only

### Phase E — Activation (Sprint 007)
1. Enable `FEATURE_CUSTOMER_JOURNEY_V2=true` for internal accounts only
2. QA full journey end-to-end with test accounts
3. Enable for 10% of new client accounts (canary)
4. Monitor drop-off, support ticket volume, review submission rate
5. Full rollout at 100%
6. V1 journey retained for 90 days, then deprecated

### Rollback at Any Phase
- Set `FEATURE_CUSTOMER_JOURNEY_V2=false` → all clients revert to V1 immediately
- No data migration required — V2 adds new fields/collections, V1 reads none of them
- Draft orders expire automatically via TTL index

---

## 10. Verification Checklist

### Documentation Completeness
- [x] Current journey fully mapped (Sections 1.1–1.6)
- [x] All friction points identified and explained (Section 2, P-01 through P-15)
- [x] Root causes documented (Section 3)
- [x] New journey designed phase by phase (Section 4)
- [x] UX rules defined (Section 5, R-01 through R-10)
- [x] All required components listed with paths and purpose (Section 6)
- [x] Future APIs specified with payloads (Section 7)
- [x] Risks identified with mitigations (Section 8)
- [x] Migration strategy defined in phases (Section 9)

### Production Safety
- [x] Zero code changes made to production files
- [x] Zero API routes modified
- [x] Zero database changes
- [x] Zero routing changes in `App.tsx`
- [x] Zero modifications to existing pages (`QuickStart.tsx`, `Checkout.tsx`, `Dashboard.tsx`, `ProjectWorkspace.tsx`, etc.)
- [x] Expected downtime: ZERO

### Architecture Compliance
- [x] New components designed for `client/src/features/customer-journey/` only
- [x] Feature flags `FEATURE_CUSTOMER_JOURNEY_V2` and `FEATURE_DASHBOARD_V2` remain `false`
- [x] No business logic designed for UI layer — all computation in engine/ or server
- [x] Client portal, Employee portal, and QAdmin remain strictly separated
- [x] QIROX is not SaaS — all designs are for an internal studio operating system serving one client portal

---

*Sprint 004 complete. Awaiting approval before Sprint 005 (API Layer).*
