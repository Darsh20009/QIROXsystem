# QIROX — Client Journey Blueprint
## Sprint 001 · Client Journey Rebuild

**Classification:** Blueprint — No code modified  
**Date:** July 2026  
**Standard:** Apple · Stripe · Linear · Notion · Vercel · Framer

---

## HOW TO READ THIS DOCUMENT

Each journey step is analysed across ten dimensions:

1. **Current Behaviour** — exactly what exists in the code today
2. **Problems** — specific friction points identified in the current implementation
3. **Psychological Impact** — what the client feels at this moment
4. **Business Impact** — what this costs QIROX in revenue, trust, or time
5. **Enterprise Recommendation** — the architectural decision
6. **UI Recommendation** — the visual and interaction design direction
7. **Backend Changes Required** — server-side work
8. **Database Impact** — schema additions (additive only)
9. **API Impact** — new or modified endpoints
10. **Zero-Downtime Migration Strategy** — how to ship without breaking production

---

## THE JOURNEY MAP

```
Visitor
  ↓
Service Discovery
  ↓
Pricing
  ↓
Request Service
  ↓
Quotation
  ↓
Contract
  ↓
Payment
  ↓
Project Dashboard
  ↓
Communication
  ↓
Project Completion
  ↓
Invoice
  ↓
Review
  ↓
Long-term Customer
```

---

## STEP 1 — VISITOR ARRIVES

### Current Behaviour
The visitor lands on the Home page (`Home.tsx`). They see a hero section with AI-driven marketing copy, a partner logo marquee, sector-switching tabs (E-commerce, Restaurant, Healthcare, etc.) with illustrative graphics, and a pricing teaser. Primary CTA is **"Start Now"** → `/start`. Secondary option is a WhatsApp button.

### Problems
1. **No clear value proposition in the first 3 seconds.** The hero leads with brand identity ("QIROX AI") rather than answering "what does this do and who is it for?"
2. **Two competing CTAs immediately** — "Start Now" (which begins a 6-screen lead form) and "WhatsApp" (which leaves the platform entirely). Neither is contextualised to where the visitor came from.
3. **Sector tabs require the visitor to self-identify their industry before understanding what they're buying.** The mental model is inverted — show value first, then ask who they are.
4. **No social proof above the fold.** Testimonials and logos are buried.
5. **"Start Now" goes directly to QuickStart, a 6-step form.** A visitor who arrived from a Google ad is asked for Name, Email, Phone, and project idea before they've seen a single feature or price. Cold-asking for personal data before building trust = high abandonment.
6. **Navigation offers too many paths:** systems, prices, about, contact, partners, segments, news, jobs — 10+ routes visible simultaneously. Decision paralysis.

### Psychological Impact
> *"I'm not sure what this company does. Everything looks impressive but I don't know if this is for me. I have to fill in a form just to learn more? I'll come back later."*

Confidence: **low**. Commitment: **zero**. The visitor has learned nothing concrete and been asked to commit personal data. Result: they leave.

### Business Impact
- High bounce rate on paid acquisition campaigns (you are paying for traffic that disappears before converting)
- QuickStart completion rate is likely <30% because commitment is asked before value is demonstrated
- WhatsApp redirects take clients off-platform permanently — no tracking, no continuity, no follow-up automation

### Enterprise Recommendation
The home page must do one job: convert a stranger into someone who believes QIROX can solve their specific problem. This means:
- **Problem-first hero** — lead with the client's pain, not the brand's name
- **Proof before ask** — show real outcomes (client results, numbers, logos) before any form
- **Single primary CTA** — one clear next step, contextualised to visitor type
- **Progressive commitment** — the path from visitor to registered client must feel like descending a gentle slope, not jumping off a cliff

### UI Recommendation
**Hero:**
- Full-width, dark background, typographically dominant
- Headline: client's outcome in 6–8 words (Arabic primary, English secondary)
- Subheadline: what QIROX is in one sentence
- Single CTA: **"See the Platform"** → interactive product tour (no form required)
- Floating social proof strip: 3 numbers (e.g., "500+ clients · 23 industries · 98% satisfaction") always visible

**Above the fold — NO forms, NO sector selection, NO WhatsApp button**

**Below fold progression:**
1. Problem statement (3 pain points, animated)
2. Platform overview (3–4 key capabilities with motion)
3. Social proof: logo wall + 2 featured testimonials with photos
4. Sector showcase (interactive — click a sector to see a 30-second demo GIF/video clip)
5. Pricing summary (not full pricing — just tier names and starting prices)
6. Final CTA: "Start Free Consultation" → `/consultation` (low commitment) or "View Plans" → `/prices`

**Navigation:** Collapse to 5 items max: Platform · Pricing · Clients · About · Login

### Backend Changes Required
- No changes to existing routes
- New `GET /api/stats/public` endpoint returning aggregate counts (clients, industries, satisfaction score) for the hero strip

### Database Impact
- No schema changes
- New: `SystemSettingsModel` document for public stats (additive field: `publicStats: { clientCount, industryCount, satisfactionScore }`)

### API Impact
- New: `GET /api/public/stats` → returns `{ clientCount, industryCount, satisfactionScore }` (cached, public)

### Zero-Downtime Migration Strategy
New Home.tsx replaces existing at the same route `/`. Old component preserved as `HomeLegacy.tsx` behind feature flag `FEATURE_HOME_V4`. Toggle at any time without deployment. Fallback instant.

---

## STEP 2 — SERVICE DISCOVERY

### Current Behaviour
Visitor navigates to `/systems` (Systems page) — a catalogue of available technical products/modules. Separately, `/segments` shows industry-specific breakdowns. The `service/:id` route provides a detail page per service. There is no guided journey from "I have a problem" to "this is the solution I need" — the visitor must browse and self-identify.

### Problems
1. **Discovery is passive.** The visitor browses a product catalogue rather than being guided by their needs. This is a feature list, not a solution story.
2. **Three separate entry points** (systems, segments, service detail) with no connective tissue — the visitor encounters each independently with no recommended path.
3. **Service detail pages (`/service/:id`) exist but it is unclear what the CTA is after reading a service page.** Does the visitor add to cart? Book a consultation? Start a trial? The conversion path after discovery is ambiguous.
4. **No comparison tool.** If a client is deciding between plans or service types, there is no side-by-side view at the service level.
5. **No "who is this for?" signal.** Every service is presented neutrally, making it harder for a visitor to see themselves in the product.

### Psychological Impact
> *"There are a lot of options. I'm not sure which one applies to me. The descriptions are technical. I think I need to call someone to understand this."*

Confidence: **medium**. Confusion: **high**. The visitor understands QIROX sells software, but cannot map any specific product to their specific situation without external help.

### Business Impact
- Sales team receives unqualified consultation requests from visitors who could have self-served if the discovery experience was clearer
- Longer sales cycle because client education is deferred to human interaction
- Higher cost of acquisition

### Enterprise Recommendation
Transform service discovery from a catalogue into a **guided solution finder**. The visitor answers 2–3 questions (business type, primary problem, scale) and is presented with the exact package or solution that matches — not the entire product catalogue.

This is the difference between walking into a store and being greeted by a knowledgeable assistant, versus walking into a warehouse and being handed a catalogue.

### UI Recommendation
**Solution Finder (replaces browse-first on Systems page):**
- Opens with: "What kind of business are you?"  → 6 illustrated tiles (Restaurant, Retail, E-commerce, Healthcare, Service, Other)
- "What is your biggest challenge right now?" → 4 options relevant to that sector
- "How many employees?" → 3 size ranges
- Result: "Based on your answers, the **QIROX Pro — Restaurant Plan** is built for you." with:
  - 5 highlighted features that solve their stated problems
  - Price (monthly / annual)
  - 2 real client logos from the same industry
  - CTA: **"Request a Demo"** (low commitment) or **"View Full Plan"** → scrolls to feature detail

**Service Detail Pages (`/service/:id`):**
- Hero: the client's outcome, not the product name
- "Built for:" section — 3 specific client profiles who benefit most
- Feature comparison table (this plan vs. one level up — encourage upgrade awareness)
- Live demo embed or interactive screen recording
- CTA hierarchy: Primary — "Get This Plan" → `/order?plan=X` · Secondary — "Ask a Question" → prefilled WhatsApp or chat
- Related case studies from same industry

### Backend Changes Required
- New `GET /api/solutions/recommend?sector=X&challenge=Y&size=Z` endpoint (reads existing service/plan data — no new storage needed)
- Existing `/api/system-features` already serves feature data — reuse it

### Database Impact
- No schema changes
- Additive: `ServicesModel` gets optional `targetProfiles: string[]` and `successStories: ObjectId[]` fields

### API Impact
- New: `GET /api/solutions/recommend` → query params → returns recommended plan + 3 relevant features + matching case studies (reads existing data)

### Zero-Downtime Migration Strategy
`/systems` page updated in place — Solution Finder added as the first section above the existing catalogue. Existing catalogue remains accessible below ("Browse all plans" link). Feature flag `FEATURE_SOLUTION_FINDER` controls visibility of the new finder section. No routes removed.

---

## STEP 3 — PRICING

### Current Behaviour
The `/prices` page fetches `GET /api/pricing` and renders a feature matrix across plan tiers (Lite, Pro, Infinite), filterable by sector and duration. It includes a duration selector and tier comparison. CTAs lead to the order flow.

### Problems
1. **Pricing page is a data table, not a decision aid.** Rows of features with checkmarks do not help a client understand which plan they need — they create analysis paralysis.
2. **No anchoring.** Without a "most popular" signal or a recommended plan, visitors default to the cheapest tier regardless of their actual needs.
3. **Duration selector appears before the client understands the product.** Annual vs. monthly is a commitment decision — asking for it before the client is convinced to buy at all is premature.
4. **No payment method preview at pricing stage.** The client doesn't know how they'll pay (bank transfer, card, wallet) until they're deep in the order flow — a trust gap.
5. **VAT not surfaced at pricing.** Clients are surprised by 15% VAT addition at checkout — a classic trust-destroying pattern.
6. **No free trial or freemium signal.** There is no low-commitment entry option mentioned at pricing.

### Psychological Impact
> *"This is a lot of information. Which plan do I need? Is VAT included? If I commit to annual, can I cancel? I need to think about this."*

Confidence: **low**. The visitor is close to a decision but the page creates doubt rather than resolving it. Decision deferred.

### Business Impact
- Prospects drop off at pricing rather than moving to order — a classic high-intent abandonment
- Clients who choose the wrong plan churn or require costly plan changes
- VAT surprise at checkout reduces payment completion rates

### Enterprise Recommendation
**Pricing as a conversion page, not a comparison spreadsheet.** Design for the three psychological states a prospect brings to a pricing page: (1) "I'm ready to buy" → make the path to checkout instant, (2) "I'm comparing" → make the right choice obvious through recommendations and social proof, (3) "I'm unsure" → give them a low-commitment next step.

Pricing should display **VAT-inclusive totals** by default with a toggle to show ex-VAT. This is standard enterprise practice in Saudi Arabia and eliminates checkout shock.

### UI Recommendation
**Page structure:**
- **Top:** 3-column plan cards (Lite / Pro / Infinite) — not a feature matrix. Each card: plan name, target client ("For growing restaurants"), monthly price VAT-inclusive, 5 key features in plain language, CTA button.
- **"Most Popular" badge** on Pro (data-driven — if Pro is the best-seller, show it).
- **"Right for you?" quiz strip** — one line: "Not sure which plan fits? → Answer 3 questions" → Solution Finder from Step 2.
- **Duration toggle** — positioned AFTER the plan cards, not before. Default: Monthly. Switching to Annual shows savings badge per plan.
- **Payment methods strip** — icons: Mada · STC Pay · Bank Transfer · Qirox Wallet · PayPal — "We accept these payment methods." No detail required — just shows the client they have options.
- **Full feature comparison** — collapsed accordion at the bottom. Available for those who want it; not the primary experience.
- **FAQ section** — 6 most common pricing questions: VAT, cancellation, contract length, what's included in support, data ownership, upgrade path.

**Pricing card CTA language:**  
Not "Choose Plan" → use **"Start with [Plan Name]"** — active, positive framing.

### Backend Changes Required
- `GET /api/pricing` should return prices both ex-VAT and VAT-inclusive (calculated server-side at 15%)
- Add `isPopular: boolean` flag to plan data

### Database Impact
- Additive: Plan documents gain `isPopular: boolean`, `targetClientDescription: string`

### API Impact
- Modify `GET /api/pricing` response: add `priceVatInclusive`, `priceVatInclusiveAnnual`, `isPopular`, `targetClientDescription` to each plan object (non-breaking addition)

### Zero-Downtime Migration Strategy
Existing Prices.tsx replaced with PricingV4.tsx under feature flag `FEATURE_PRICING_V4`. Route `/prices` controlled by flag. Old component stays at `/prices-legacy` for fallback. API additions are non-breaking (new fields added to response, existing fields unchanged).

---

## STEP 4 — REQUEST SERVICE / ORDER FLOW

### Current Behaviour
Two paths exist:
- **QuickStart** (`/start`): A 6-screen lead generation wizard. Sector → Idea (with AI enhancement) → Features → Budget → Contact Info (Name, Phone, Email) → Success screen → WhatsApp redirect. Submits to `POST /api/quickstart/lead`. Does not create an account. Ends with a reference number and a WhatsApp link.
- **OrderFlow** (`/order`): A 4-step purchase wizard for logged-in users. Package Selection → Add-ons → Devices → Payment & Summary (fields: Business Name, Phone, Notes, Meeting time). Submits to `POST /api/orders`. Ends with bank transfer payment instructions and a WhatsApp redirect.

For guests, OrderFlow blocks on email verification (`emailVerified === false`) before proceeding.

### Problems
1. **Two completely separate order paths with no consistent experience.** QuickStart creates a lead (no order, no account). OrderFlow creates an actual order but requires a logged-in user. A visitor cannot make a smooth transition from QuickStart to becoming an actual paying client without a jarring context switch.
2. **QuickStart ends in a WhatsApp redirect.** The client leaves the platform at the moment of highest intent. Every client who goes to WhatsApp is a lead that QIROX is manually tracking instead of the system tracking automatically.
3. **OrderFlow payment ends with bank transfer instructions.** This means: (a) client has to manually send money, (b) client has to inform QIROX, (c) finance has to manually verify, (d) order is activated after hours or days. This is a 2024 problem in 2026.
4. **The email verification gate (`emailVerified`) blocks the order flow without a smooth inline OTP resolution.** A motivated buyer is blocked by a bureaucratic wall.
5. **No progress indicator survives across sessions.** If a client starts QuickStart, closes their browser, and returns — they start over. No save state.
6. **Business Name, Phone, and Notes are asked AGAIN in OrderFlow step 4** even though the user is logged in and this data already exists in their profile.
7. **Add-on selection (step 2) and device selection (step 3) are presented as product catalogues**, not as contextual recommendations. The client must know what they want — no guidance on what is recommended for their plan.
8. **No estimated timeline at order submission.** The client submits and gets a reference number with no indication of what happens next or when.

### Psychological Impact
> *"I filled in the QuickStart form and got sent to WhatsApp. I was talking to someone there but now I'm back on the website and I have to start over? What happened to my information? Also why do I need to transfer money manually to a bank account? My bank does same-day transfers but this feels old-fashioned."*

Trust: **falling**. Frustration: **rising**. The client is oscillating between channels (web → WhatsApp → web) with no continuity. Each channel restart signals disorganisation.

### Business Impact
- **Every WhatsApp redirect is a conversion leak** — a lead that requires human labour to track and convert instead of being automatically captured
- **Manual bank transfer payment** creates a 24–72 hour delay between order submission and order activation — the highest-churn window
- **Duplicate data collection** wastes the client's time and signals internal disorganisation

### Enterprise Recommendation
**Unify the journey into one progressive flow** that:
1. Starts without requiring an account ("explore anonymously")
2. Captures account creation inline at the moment of commitment — not as a gate
3. Ends with instant payment (Mada / STC Pay / Wallet) — not bank transfer instructions
4. Never redirects to WhatsApp — instead, sends a WhatsApp confirmation message from within the platform after order placement

The mental model: every great SaaS product lets you **explore → configure → pay → start** in a single sitting. QIROX must achieve this.

### UI Recommendation
**Unified Order Flow — 5 stages with a persistent top progress bar:**

```
[1 Configure] → [2 Customise] → [3 Review] → [4 Pay] → [5 Confirm]
```

**Stage 1 — Configure (replaces Package Selection):**
- If arriving from Solution Finder or Pricing page → pre-selected, skip this stage or show it pre-filled
- Plan cards shown at a glance; selected plan highlighted; "Change plan" link
- Duration selector (Monthly / Annual) with savings badge
- Sector selector (auto-filled if coming from Solution Finder)

**Stage 2 — Customise (replaces Add-ons + Devices):**
- Recommended add-ons surfaced based on plan + sector (not a full catalogue)
- "Recommended for [their sector]" badge on 2–3 add-ons
- Device selection with visual product cards (photo, specs, price)
- Running total updates in real time in the right sidebar

**Stage 3 — Review:**
- Order summary: plan, add-ons, devices, duration, subtotal, VAT (itemised), total
- Business information fields (pre-filled from profile for logged-in users; inline registration for guests with just Name, Email, Phone — account created silently in background)
- Estimated delivery: "Your project typically begins within 1 business day of payment"
- "Is there anything specific you'd like us to know?" — optional text area (replaces Notes)

**Stage 4 — Pay:**
- Payment method tiles: Qirox Wallet (with balance shown) · Mada · STC Pay · Bank Transfer · PayPal
- Mada / STC Pay: integrated inline (not redirect)
- Wallet: one-tap if sufficient balance, else shows top-up inline option
- Bank Transfer: clearly labelled as "3–5 business day activation" — not the default; positioned last
- Coupon code field — collapsed by default ("Have a code?")
- No redirects. No new tabs. Payment happens on this page.

**Stage 5 — Confirm (new design):**
- Full-width success state — brief animation (Framer-style confetti or checkmark draw)
- "Order #QX-XXXXX placed" prominently displayed
- "What happens next?" — a 4-step mini timeline: ✓ Order received → ⏳ Team review (< 4 hours) → 📋 Contract sent → 🚀 Project starts
- WhatsApp confirmation: a WhatsApp Business message is sent automatically (not a redirect link — an API-triggered message) with order summary
- Email confirmation: auto-sent
- CTA: **"Go to my Dashboard"** → `/dashboard`

**Account creation for guests:**
- Fields: Name, Email, Phone, Password (optional — can use OTP login)
- Inline OTP verification on email or phone — no page redirect, no separate route
- Account creation happens at Stage 3 before payment — never blocks payment completion

### Backend Changes Required
- New `POST /api/orders/v2` endpoint that handles unified order creation with account auto-creation for guests
- `POST /api/auth/register-inline` — creates account silently during checkout without full redirect
- Payment gateway integrations: Mada and STC Pay via Moyasar (new integration)
- WhatsApp Business API trigger on order confirmation (instead of wa.me redirect)
- Order state machine: `pending_payment → payment_received → under_review → contract_sent → active`

### Database Impact
- Additive to `OrderModel`: `stage: string` (enum of state machine states), `estimatedStartDate: Date`, `paymentMethod: string`, `paymentReference: string`
- Additive to `UserModel`: `registeredViaCheckout: boolean`, `pendingCartSessionId: string`
- New: `CartSessionModel` — persists anonymous cart across sessions (server-side, not sessionStorage)

### API Impact
- New: `POST /api/orders/v2` — unified order creation (old `/api/orders` preserved, not removed)
- New: `POST /api/auth/register-inline` — guest-to-user conversion during checkout
- New: `GET /api/cart/session/:sessionId` — restore anonymous cart server-side
- Modify: `GET /api/pricing` — already documented in Step 3
- Moyasar webhook: `POST /api/payments/moyasar/webhook` — handles Mada/STC Pay callbacks

### Zero-Downtime Migration Strategy
- `/order` keeps the existing OrderFlow component (renamed `OrderFlowLegacy.tsx`)
- `/order/v2` launches the new unified flow
- `/start` and `/quick-start` are kept as-is (they still generate leads via `POST /api/quickstart/lead`)
- Feature flag `FEATURE_ORDER_V4` controls whether the Pricing page CTA and navbar "Order" links point to `/order` (old) or `/order/v2` (new)
- Old flow remains fully operational during rollout — no users are disrupted

---

## STEP 5 — QUOTATION

### Current Behaviour
After order submission, an employee creates a quotation in the admin panel. The client receives a notification (in-app) and can view it at `/client/quotations` (`ClientQuotations.tsx`). The page lists quotations with itemised pricing, VAT, subtotal, and notes. The client can **Accept**, **Reject**, or **Print** each quotation. Accepting a quotation calls `PUT /api/quotations/:id/status`. There is no explicit email or WhatsApp notification confirmed in the code — only in-app notification is confirmed.

### Problems
1. **The client is not notified the moment a quotation is ready** — in-app notifications require the client to be logged in and actively checking the portal. If they are not, they miss it.
2. **No deadline on quotation acceptance.** A quotation sits open indefinitely. This removes urgency and allows the client to deprioritise the decision.
3. **Rejecting a quotation is a dead end.** The client clicks Reject — and then what? There is no prompt to explain why, no automatic follow-up, no offer to revise. The rejection disappears without generating any action.
4. **Quotation → Contract → Payment is not a visible sequence.** The client sees the quotation but does not understand that accepting it triggers a contract, which triggers payment. The next steps are invisible.
5. **"Print" outputs exist but the visual design of the printed quotation is not confirmed as enterprise-grade.** For enterprise clients, the quotation PDF is a formal business document that may require board approval — its quality reflects on QIROX.

### Psychological Impact
> *"I got a notification about a quotation. I logged in and can see the price. It says Accept or Reject. I accepted it. Now what? Did something happen? I don't see anything change."*

Confusion: **high**. The client has committed (mentally) by accepting, but receives no immediate confirmation of what they've just set in motion.

### Business Impact
- Quotations that expire without response are manual follow-up work for the sales team
- Rejections without reason capture no data — the company cannot learn what clients object to (price, scope, timeline)
- Delayed quotation acceptance = delayed project start = delayed revenue recognition

### Enterprise Recommendation
Quotation acceptance must be a moment of momentum, not a bureaucratic step. The instant a quotation is accepted, the client should see the next step materialise in front of them — not wonder what happened.

Implement **quotation expiry** (configurable per quotation — default 7 days), **multi-channel notification** (in-app + email + WhatsApp), and a **rejection reason workflow** that auto-notifies the account manager with the captured reason.

### UI Recommendation
**Quotation Detail Page (new, replaces list-only view):**
- Dedicated page per quotation at `/client/quotations/:id`
- Header: quotation number, date issued, **expiry countdown** ("Expires in 5 days" — turns amber at 3 days, red at 1 day)
- Itemised breakdown: service name → description → quantity → unit price → line total
- VAT line, subtotal, total — all in SAR, clear and large
- "Questions about this quotation?" → inline message to account manager (no email required)
- **Accept CTA:** Full-width green button — "Accept Quotation & Proceed to Contract"
  - On click: confirmation modal — "By accepting, you agree to the pricing above. A contract will be sent within 2 hours."
  - On confirm: immediate visual change — quotation status changes to "Accepted ✓", a banner appears: "Your contract is being prepared. You'll be notified when it's ready."
- **Reject CTA:** Secondary button — "Request Changes"
  - Opens a modal: "What would you like to change?" with options: Price · Scope · Timeline · Payment terms · Other → free text field
  - Submitting this notifies the account manager with the reason captured
  - The quotation enters "Under Review" status — not "Rejected"
- **Share CTA:** "Share with your team" → generates a read-only shareable link (no login required) with a 48-hour expiry — for clients who need internal approval

**Notification sequence on quotation creation:**
1. In-app notification (immediate)
2. Email: "Your QIROX quotation is ready" with a summary and a deep link button (5 minutes after creation)
3. WhatsApp: "مرحباً [Name]، عرض أسعارك جاهز. يمكنك مراجعته هنا: [link]" (10 minutes after creation, via WhatsApp Business API)

### Backend Changes Required
- Add `expiresAt: Date` to quotation creation (calculated from configurable `quotationExpiryDays` system setting)
- New `POST /api/quotations/:id/request-revision` endpoint — captures rejection reason, notifies account manager
- New `POST /api/quotations/:id/share-link` — generates time-limited read-only token
- `GET /api/quotations/share/:token` — public endpoint for shared view
- Notification triggers: email + WhatsApp on quotation creation (server-side, not client-triggered)
- Cron job: daily check for expiring quotations → send reminder 3 days before expiry, 1 day before expiry

### Database Impact
- Additive to `QuotationModel`: `expiresAt: Date`, `revisionRequests: [{ reason: string, details: string, createdAt: Date }]`, `shareToken: string`, `shareTokenExpiresAt: Date`

### API Impact
- New: `POST /api/quotations/:id/request-revision`
- New: `POST /api/quotations/:id/share-link`
- New: `GET /api/quotations/share/:token` (public)
- Modify: `PUT /api/quotations/:id/status` — trigger email + WhatsApp notification on status change to "sent" (non-breaking)

### Zero-Downtime Migration Strategy
- New quotation detail route `/client/quotations/:id` added alongside existing list view — no routes removed
- Expiry fields are nullable — existing quotations without expiry continue to function as before
- Notification triggers added to existing `PUT /api/quotations/:id/status` handler — new side effect, no breaking change
- Share link endpoint is a new route — no conflicts

---

## STEP 6 — CONTRACT

### Current Behaviour
After quotation acceptance, an employee creates a contract in the admin panel. The client views it at `/client/contracts` (`ClientContracts.tsx`). The signing flow is multi-step: (1) Read full contract text, (2) Sign by drawing on a canvas or typing their legal name, (3) OTP verification via in-app notification code. After OTP entry, the contract is marked as "Acknowledged" with the signature data stored.

### Problems
1. **The same notification gap as quotations applies here** — the client is not proactively notified that their contract is ready, beyond in-app notification.
2. **OTP is delivered via in-app notification.** This requires the client to be in two browser tabs simultaneously (contract tab + notifications tab) or to remember their OTP after switching views — a clunky UX that is likely causing failures.
3. **The contract text is a raw block of text.** For a legally binding document in Saudi Arabia, it should be a properly formatted, branded PDF with sections, headers, clause numbers, and the company commercial registration.
4. **After signing, there is no clear next step.** The contract is "Acknowledged" — but the client does not understand what happens next (project start, payment request, etc.).
5. **There is no option to download the signed contract** — a client will naturally want a copy of what they signed, for their own records or internal approval.
6. **No witness or approval workflow for enterprise clients** — an enterprise client who needs their legal or finance team to review a contract cannot share it externally.

### Psychological Impact
> *"I need to sign this contract. I'm drawing my signature. Now I need a code from... where? The notification? Let me open another tab... I can't find it... Let me try again... OK I signed it. Can I download a copy? I'll ask the account manager."*

Frustration: **medium-high**. The signing itself works, but the OTP flow creates confusion. The absence of a download creates an immediate follow-up request that burdens the account manager.

### Business Impact
- OTP failures in the contract signing flow cause support tickets and delay project start
- Clients who cannot easily share the contract internally cause enterprise deal delays
- No signed-contract download creates an unnecessary support touchpoint

### Enterprise Recommendation
The contract signing experience must be as smooth and professional as DocuSign or PandaDoc. The OTP must be delivered to a channel the client is already watching (phone SMS or WhatsApp) — not an in-app notification in a separate tab.

Provide an immediate PDF download of the signed contract. For enterprise clients, allow external sharing of a read-only contract before signing.

### UI Recommendation
**Contract View — complete redesign:**

**Pre-signing:**
- Contract displayed as a **formatted document** with: QIROX letterhead, contract number, client name, date, section headings (Scope · Deliverables · Payment Terms · Timeline · IP Ownership · Dispute Resolution), clause numbers
- Right sidebar: "Contract Summary" — 4–5 bullet points of what this contract covers in plain language ("We deliver [plan name] within [X] weeks. Payment is due on [terms].")
- "Review with your team" — generates a read-only link (no signing possible)
- Sticky CTA bar at the bottom: "Ready to sign → Sign Contract"

**Signing modal (triggered by CTA):**
- Step 1: Confirm identity — "To sign, enter the OTP sent to your phone **+966 5xx xxx xx72**" — OTP sent via SMS or WhatsApp, not in-app notification
- Step 2: Sign — Draw or Type — with real-time preview of how the signature will appear on the document
- Step 3: Confirm — "By clicking Sign, you agree to the terms of Contract #[number] dated [date]. This constitutes a legally binding agreement."
- Submission: progress indicator, then success state

**Post-signing:**
- Full-screen success: "Contract signed ✓"
- Signed contract PDF available immediately — "Download your copy" (prominent button)
- Copy auto-sent to client's email
- "What's next?" — next step in their journey surfaced: "Payment request will be sent within [X] hours" or "Your project is now active — [Go to Project Dashboard]"

**Notification sequence on contract creation:**
1. In-app (immediate)
2. Email with read-only preview link (5 min)
3. WhatsApp (10 min)

### Backend Changes Required
- OTP delivery: change from in-app notification to SMS (SMSTO2GO) or WhatsApp Business API
- PDF generation: generate a properly formatted, legally-compliant signed contract PDF after signing; store in object storage; expose via `GET /api/client/contracts/:id/pdf`
- Auto-email the signed PDF to the client's email on signing completion
- Share link: `POST /api/client/contracts/:id/share-link` → read-only token (same pattern as quotations)

### Database Impact
- Additive to `ContractModel`: `signedPdfUrl: string`, `otpDeliveryMethod: 'sms'|'whatsapp'|'inapp'` (default 'inapp' for existing, new contracts default 'whatsapp')

### API Impact
- New: `GET /api/client/contracts/:id/pdf` — returns signed PDF download
- New: `POST /api/client/contracts/:id/share-link`
- Modify: `POST /api/client/contracts/:id/sign` — after signing, trigger PDF generation + email (non-breaking addition)
- Modify: OTP delivery in contract sign flow — additional delivery channels (additive)

### Zero-Downtime Migration Strategy
- PDF generation is a new post-signing side effect — old signed contracts without PDFs get a "PDF not available for contracts signed before [date]" message
- OTP delivery method defaults to existing in-app for all current users; new field `otpDeliveryMethod` allows per-contract override
- Share link endpoint is net-new — no conflicts

---

## STEP 7 — PAYMENT

### Current Behaviour
**After OrderFlow:** The order success screen shows bank transfer payment instructions (IBAN + bank name + account number in Egypt for Egyptian clients, or general instructions for Saudi clients) with a WhatsApp redirect to confirm payment manually.

**Via Cart/Checkout:** A full checkout flow (`Checkout.tsx`) with: optional auth step for guests, delivery/contact info, payment method selection, and a review step. Payment methods available: Qirox Wallet (internal), Bank Transfer (manual), and PayPal (for wallet top-up only — not direct order payment). No Mada or STC Pay integration exists currently.

**Wallet top-up:** Bank Transfer (manual, requires admin approval) or PayPal instant top-up with a fixed 3.75 SAR/USD conversion rate.

### Problems
1. **No direct card payment exists for orders.** Mada and STC Pay — the two dominant payment methods in Saudi Arabia — are absent. This is the single most damaging gap in the entire platform. Clients who expect to pay by card must instead:
   a. Top up their Qirox wallet via PayPal (requires a PayPal account), OR
   b. Transfer money to a bank account and wait for manual confirmation.
2. **PayPal is not a Saudi-native payment method.** Very few Saudi clients have or use PayPal for B2B transactions. It should be a fallback, not a primary option.
3. **Bank transfer requires a human in the loop** — finance must verify the payment, manually update the order status, and notify the team. This is a 24–72 hour delay at the point of highest client excitement. The period between "I want to start" and "my project is actually starting" is the highest churn risk in the entire journey.
4. **Fixed 3.75 SAR/USD exchange rate** in the PayPal top-up creates financial exposure.
5. **The cart persists in `sessionStorage`** — if a client clears their browser before logging in, their cart is gone with no recovery path.
6. **There is no payment confirmation screen or receipt page** beyond a success toast notification.

### Psychological Impact
> *"I accepted the contract. Now I need to pay. My options are... transfer money to a bank account and send proof via WhatsApp? Or PayPal? I don't use PayPal. I'll do the bank transfer. OK sent. Now I wait? How long? Should I message someone? I feel like this could go wrong."*

Anxiety: **peak**. The client has committed legally and financially but has no certainty that their payment was received, their project will start, or that anything is happening. This is the moment most likely to produce a negative impression that survives into the long-term relationship.

### Business Impact
- **Lost immediate revenue** from clients who choose not to do a bank transfer and don't have PayPal — they simply don't pay
- **Manual payment verification** is a labour cost that scales linearly with client count — unsustainable
- **24–72 hour delay** between payment and project start is a period of maximum churn risk — clients change their minds, call competitors, or begin questioning their decision
- **No card payment = no international clients** — QIROX cannot serve clients outside Saudi Arabia who expect card payment

### Enterprise Recommendation
**Immediate implementation of Moyasar** (Saudi-licensed payment gateway) for Mada and STC Pay. This is not a nice-to-have — it is the most commercially urgent change in the entire platform. Every day without Mada integration is direct revenue loss.

Payment must complete in the browser. No bank transfers as the primary path. No redirects. No WhatsApp confirmation required.

**Payment method hierarchy (in order of priority for Saudi clients):**
1. Mada (Saudi debit card — most common)
2. STC Pay (second most common)
3. Qirox Wallet (internal — for repeat clients)
4. PayPal (international clients)
5. Bank Transfer (enterprises with procurement requirements — clearly labelled as "3–5 business day activation")

### UI Recommendation
**Payment step — full redesign:**

**Method selection:**
- 4 large tiles with icons: Mada · STC Pay · Qirox Wallet · Other (PayPal / Bank Transfer)
- Mada tile: click → inline card input (PAN, expiry, CVV) rendered via Moyasar.js — no page redirect
- STC Pay tile: click → phone number input → OTP from STC Pay → payment confirmation inline
- Qirox Wallet tile: shows balance; if sufficient → one click to pay; if insufficient → shows shortfall + "Top up [amount] SAR" option inline
- PayPal and Bank Transfer: collapsed under "Other payment options" with clear labelling of implications

**Payment confirmation page (new `/payment/success/:orderId`):**
- Not a toast. A full dedicated page.
- "Payment received ✓" — large, green, immediate
- Payment summary: order #, amount paid, method used, timestamp
- Receipt: "Download receipt (PDF)" — auto-generated
- **"What happens next?"** — animated 4-step timeline:
  - ✓ Payment received — [timestamp]
  - ⏳ Team review — within 4 business hours
  - 📋 Project assigned — you'll be notified
  - 🚀 Project started — your dashboard will update
- CTA: "Track my order" → `/dashboard`
- Auto-email: payment confirmation with PDF receipt

**Payment failure state:**
- Clear inline error with specific reason (declined, insufficient funds, etc.)
- Suggested alternative payment method offered immediately below the error
- No page redirect on failure — stay on payment step

### Backend Changes Required
- **Moyasar integration:** `POST /api/payments/moyasar/create` (session creation), `POST /api/payments/moyasar/webhook` (async capture), Moyasar.js frontend embed
- Payment receipt PDF generation on successful payment
- Order status auto-update from webhook (no manual admin action required for card payments)
- Server-side cart persistence: `POST /api/cart/session` — creates server-side anonymous cart, returns `sessionId` stored in localStorage (survives browser data clears)
- Live SAR/USD exchange rate fetch for PayPal conversions (replace fixed 3.75 rate)

### Database Impact
- New: `PaymentModel` — `orderId`, `amount`, `currency`, `method`, `gatewayReference`, `status`, `receiptPdfUrl`, `createdAt` — separate from the order document for clean financial ledger
- Additive to `OrderModel`: `paymentId: ObjectId ref Payment`, `activatedAt: Date`

### API Impact
- New: `POST /api/payments/moyasar/create`
- New: `POST /api/payments/moyasar/webhook` (Moyasar callback — public endpoint, signature-verified)
- New: `GET /api/payments/:paymentId/receipt` → PDF download
- New: `GET /api/cart/session/:sessionId` and `POST /api/cart/session`
- Modify: `POST /api/wallet/topup-paypal/create` — fetch live exchange rate (non-breaking, improves existing)

### Zero-Downtime Migration Strategy
- Moyasar is a **new** payment path — does not replace or modify existing bank transfer or PayPal flows
- Old payment methods remain 100% operational — Moyasar is an additive option
- Feature flag `FEATURE_MOYASAR_PAYMENTS` enables Mada/STC Pay tiles in the payment UI
- Webhook endpoint is new — no conflicts
- PaymentModel is new — existing order payment data remains in OrderModel; PaymentModel is populated for new payments only

---

## STEP 8 — PROJECT DASHBOARD

### Current Behaviour
After order activation, the client accesses their projects via `/dashboard` and then `/projects/:id` (`ProjectDetails.tsx`) — a multi-tab interface covering:
- **Status Summary:** circular progress gauge, multi-phase bar (Intake → Study → Execute → Test → Deliver), overall progress %
- **Implementation Stages:** feature-level progress
- **Project Files:** file sharing
- **Tool Links:** access to purchased software tools
- **Team Chat:** client + team messaging (permanent record)
- **Invoices:** project-specific invoices
- **Payments:** payment history
- **Contracts:** signed contracts
- **Vault:** credentials storage
- **Add-ons:** additional purchased services

`/project/:id/workspace` (`ProjectWorkspace.tsx`) provides an interactive feature-level board: features with statuses (Pending / In Progress / Completed), reported issues (bugs), and meeting requests.

### Problems
1. **The client arrives at a dashboard with no onboarding.** First login after payment → a blank or near-empty dashboard with no guidance on what to do, what to expect, or how to track their project. Empty states say "No features added yet" — which is true but alarming for a client who just paid.
2. **The main dashboard (`Dashboard.tsx`) is not described in detail in the code exploration — it likely shows project cards but it is unclear if it communicates "what is happening right now" clearly.**
3. **11 tabs in ProjectDetails is overwhelming.** A client cannot quickly understand "where is my project at?" because they must navigate multiple tabs to build that picture. The most important information (current phase, what the team is working on this week, what requires client action) is not prioritised.
4. **"What requires my action?" is never surfaced.** The client must visit multiple tabs to discover if there is a deliverable to review, a contract to sign, a payment due, or a message to reply to. There is no unified action queue.
5. **Progress % is a single number** with no context — does 40% mean on-track, behind, or ahead? The client doesn't know.
6. **The Vault (credentials storage) requires client trust** — storing passwords in a QIROX-hosted vault requires explanation of security model.
7. **Team Chat is described as permanent and immutable** ("messages are permanent for quality assurance") — this is not communicated to the client, who may accidentally share sensitive information expecting a conversational channel.

### Psychological Impact
> *"I paid. I'm logged in. I see my project at 0% / 5%. There are 11 tabs. I don't know what to look at. There's a 'No features added yet' message. Did they receive my payment? Has anyone started working? Should I message someone? I'll open a support ticket."*

Anxiety: **high**. The client has paid for something and cannot verify that anything is happening. This generates unnecessary support tickets and account manager check-ins.

### Business Impact
- High volume of "what's the status?" support tickets and WhatsApp messages immediately after payment — all avoidable with better communication
- Support tickets generated by UX confusion are the highest-cost tickets (they require human time, create bad impressions, and don't improve the product)
- Clients who feel uncertain after payment are more likely to request refunds during the first week

### Enterprise Recommendation
The project dashboard is the client's primary reference for the entire engagement. Its job is to answer the client's 5 questions at a glance — without any clicking, without any cognitive work:

1. **Where am I?** — in the overall journey
2. **What is happening?** — what is the team doing right now
3. **What is the next step?** — what happens next
4. **How long will it take?** — expected completion or next milestone date
5. **Who is responsible?** — the named account manager and project lead

Everything else is secondary.

### UI Recommendation
**Project Dashboard — top section (above all tabs):**

A persistent **Project Status Card** at the top of every project page — visible at all times regardless of which tab is open:

```
┌─────────────────────────────────────────────────────────┐
│  Project: [Name]                    Status: ACTIVE       │
│  ───────────────────────────────────────────────────    │
│  Phase: [Execute] ████████░░░░░░ 60%  On track          │
│  Timeline: Week 3 of 8 · Expected completion: Aug 14     │
│  Your team: [Avatar] Ahmed (PM) · [Avatar] Sara (Dev)   │
│                                                          │
│  🔴 Action required from you: 1 deliverable to review   │
└─────────────────────────────────────────────────────────┘
```

**"Action Required" banner** — if the client has any pending action (deliverable to approve, payment due, contract to sign, message to reply to), a red/amber banner appears at the top of the dashboard. This is the highest-priority UI element. Clicking it takes them directly to the required action — no searching through tabs.

**Tab reorganisation** (reduce from 11 to 5):
1. **Overview** — status card + current week's work (what the team is doing) + activity feed
2. **Deliverables** — files and outputs ready for client review + approval/rejection workflow
3. **Messages** — team chat (clearly labelled: "This conversation is recorded for quality assurance")
4. **Documents** — contracts, invoices, quotations, payments in one place
5. **Settings** — Vault, tool links, add-ons, project info

**First login experience (new client onboarding):**
- Full-screen welcome overlay on first dashboard login after payment
- 4 cards: "Your team is reviewing your order · Your project starts within [X] hours · You'll get a WhatsApp when there's news · Here's how to track progress"
- "Show me around" → 4-step guided tour of the dashboard (highlighting each major section)
- "I'm good, take me to my project" → dismisses overlay

**Progress communication:**
- Phase bar: Intake → Study → Execute → Test → Deliver — with **estimated dates** shown under each phase (not just completion %)
- "On track" / "Ahead of schedule" / "Attention needed" badge next to the progress bar

### Backend Changes Required
- New `GET /api/projects/:id/summary` — single endpoint returning: current phase, % complete, on-track status, team members, pending client actions, next milestone with estimated date
- `pending client actions` aggregated from: unreviewed deliverables, unsigned contracts, unpaid invoices, unread messages
- New `POST /api/projects/:id/onboarding-seen` — marks the welcome overlay as seen (stored per user per project)

### Database Impact
- Additive to `ProjectModel`: `onboardingSeenBy: ObjectId[]` (users who have seen the welcome tour)
- Additive to `OrderModel`: `expectedMilestones: [{ name, estimatedDate, completedDate }]`

### API Impact
- New: `GET /api/projects/:id/summary`
- New: `POST /api/projects/:id/onboarding-seen`
- New: `GET /api/projects/:id/pending-actions` — list of items requiring client attention

### Zero-Downtime Migration Strategy
- New Summary API is additive — existing project endpoints untouched
- `ProjectDetails.tsx` gets a new top-level `ProjectStatusCard` component above the existing tab structure — the existing tabs are not removed, they are reorganised
- Feature flag `FEATURE_PROJECT_DASHBOARD_V4` controls the new layout

---

## STEP 9 — COMMUNICATION

### Current Behaviour
Communication exists in two places: the **Team Chat** within `ProjectDetails.tsx` (permanent record, team + client) and **Support Tickets** (`/support`) for issue reporting. The Inbox (`/inbox`) and Group Chat (`/groups`) routes exist but their detailed contents were not explored.

### Problems
1. **Communication is fragmented** across Team Chat (project-specific), Inbox (direct messages), Group Chat, and Support Tickets (formal issue tracking) — plus WhatsApp (external). Clients don't know which channel to use for which type of message.
2. **The permanent record policy** ("messages are permanent for quality assurance") is not communicated to clients at the point of entry into the chat. A client treating this like Slack or WhatsApp may be surprised to learn their messages are formally archived.
3. **No read receipts or typing indicators** confirmed — uncertainty about whether a message was seen.
4. **Response time expectations are not set.** The client doesn't know if they should expect a reply in 1 hour or 1 business day.
5. **Support tickets and project issues (`ProjectWorkspace.tsx` issue reporting) are separate systems.** A client who files a support ticket about their project is creating a record in a system separate from the project — meaning the project manager may not see it.

### Psychological Impact
> *"I want to ask a question about my project. Should I use the chat? Or open a support ticket? Or message them on WhatsApp? I'll use WhatsApp because I know they'll see it there."*

Result: the client defaults to WhatsApp, which is outside the platform and untracked. The project manager doesn't see it. The account manager sees it. Coordination breakdown.

### Business Impact
- WhatsApp becomes the de-facto communication channel — but it is unlogged, unassigned, and creates parallel conversations with different team members
- Support tickets and project issues being separate systems means important feedback is missed or duplicated
- No response time SLA = no client expectation = perception of slow response even when the team is fast

### Enterprise Recommendation
**One communication channel per project.** The client should have a single place to send any message, regardless of whether it is a question, a request, a complaint, or praise. The system routes it internally to the right person.

Display **response time commitments** prominently in the communication interface ("We typically respond within 2 hours during business hours").

### UI Recommendation
**Unified Project Inbox (replaces fragmented chat + tickets + support):**

Within the **Messages tab** of Project Details:
- Single threaded conversation per project — client and team together
- Threaded replies — click "Reply to this" to keep context attached to the original message
- **Message types:** the client can tag a message as: 💬 Question · 📋 Feedback · 🐛 Issue · ✅ Approval · 📎 File
- Tagged issues automatically generate a project issue record in the Workspace — no separate ticket
- **Response time indicator:** "Business hours: 9am–6pm AST · Typically responds in 2 hours" shown in chat header
- **Read receipts:** single tick (sent) → double tick (read by team) — sets expectations
- **Pinned messages:** team can pin important messages (e.g., "Project kickoff call: Monday 10am") — visible at the top of the thread
- **Notifications:** every new message triggers: in-app notification + email digest (batched, once every 2 hours during off-hours) + WhatsApp if unread for > 4 hours

**Support tickets** remain available from `/support` for non-project issues (billing, account, general). Their relationship to project issues is made clear: "Project-specific issues? Message your project team in your Dashboard."

### Backend Changes Required
- Add `messageType: 'question'|'feedback'|'issue'|'approval'|'file'|'general'` to chat message model
- Auto-create project issue record when a chat message of type `'issue'` is sent
- Read receipt tracking: update `readAt` timestamp per message per reader
- Response time SLA: `systemSettings.chatResponseSlaHours` — displayed in UI
- WhatsApp notification trigger: if message unread for > `chatUnreadWhatsappThresholdMinutes` → fire WhatsApp to client

### Database Impact
- Additive to `MessageModel` (or equivalent): `messageType`, `readAt`, `parentMessageId` (for threads)
- Additive to `IssueModel`: `sourceMessageId: ObjectId` (links to the chat message that created the issue)

### API Impact
- Modify: `POST /api/messages` (or equivalent chat send endpoint) — add `messageType` field; trigger issue creation if type is `'issue'` (non-breaking: field is optional, defaults to `'general'`)
- New: `PUT /api/messages/:id/read` — mark message as read, record reader + timestamp

### Zero-Downtime Migration Strategy
- `messageType` is additive and optional — existing messages have no type and display as `'general'`
- Issue auto-creation is a new side effect on message send — does not affect existing messages
- Read receipts: new field on existing messages — old messages have null `readAt` (displayed as "Sent")

---

## STEP 10 — PROJECT COMPLETION

### Current Behaviour
Project completion is managed via `ProjectWorkspace.tsx` — features have statuses (Completed), and a progress percentage exists. When all features reach 100%, the project is presumably complete. The multi-phase bar (Intake → Study → Execute → Test → Deliver) shows the lifecycle stage. There is no confirmed automated completion workflow — no documented trigger for what happens when the project is fully delivered (client notification, final invoice, handoff documentation).

### Problems
1. **Completion appears to be a percentage number reaching 100%.** There is no formal "Project Complete" milestone — no celebration, no formal handoff, no client sign-off requirement.
2. **No delivery acceptance step.** The client should formally accept that the project is complete and delivered to specification. Without this, completion is unilateral — the team declares it done, but the client has no say.
3. **No project retrospective or knowledge capture.** What worked, what could be improved, and what the client said — none of this is captured at completion.
4. **The handoff of credentials, access, and documentation at project end is stored in the Vault (ProjectDetails) but the client may not know everything is there.**
5. **No automatic trigger for the final invoice on project completion.**

### Psychological Impact
> *"I see the progress bar at 100%. I think it's done? No one told me. Should I check everything? Did I miss something? Where are my login credentials?"*

Uncertainty: **high**. A client who is not explicitly told "your project is complete" and "here is everything you need" will feel that the project ends with a whimper rather than a moment of achievement.

### Business Impact
- No formal sign-off means scope disputes can arise after delivery ("you said it was done but this feature doesn't work")
- Without a clear "project complete" trigger, final invoices may be sent late — delayed revenue recognition
- No retrospective = no learning = repeating the same project problems

### Enterprise Recommendation
Implement a formal **Project Delivery & Acceptance** workflow. When the team marks a project complete, the client receives a formal delivery notification and must explicitly accept delivery — this protects QIROX commercially and gives the client a satisfying conclusion.

### UI Recommendation
**Project Delivery Flow (new):**

**Team action:** Employee clicks "Mark as Delivered" — this triggers a client notification, not an immediate status change.

**Client notification:** "Your [Project Name] is ready for acceptance" — in-app + email + WhatsApp.

**Delivery Acceptance page (new `/projects/:id/delivery`):**
- Full project summary: what was built, all delivered features, all files
- Checklist: "Please confirm you have received and tested the following:" — items auto-generated from the project's feature list
- Credential handoff: Vault items displayed here with copy buttons — "Here are your access credentials"
- "I confirm delivery" button — large, primary — triggers formal completion
- "I have a concern" — opens a single final revision request (not a support ticket) — team notified immediately

**After acceptance:**
- Full-screen "🎉 Project complete" — brief animation, then:
- "You're now a QIROX client — here's what comes next:" — subscription management, support access, referral program
- Auto-trigger: final invoice generated (if applicable), sent to client
- Prompt: "How was your experience? Rate us" → NPS survey (Step 11: Review)

### Backend Changes Required
- New project status: `delivered_pending_acceptance` (between `active` and `completed`)
- New `PUT /api/projects/:id/submit-delivery` — team action; sends notifications to client
- New `PUT /api/projects/:id/accept-delivery` — client action; completes project, triggers final invoice
- New `PUT /api/projects/:id/delivery-concern` — client raises final concern; notifies team
- Auto-trigger: on delivery acceptance, generate final invoice if project billing is milestone-based

### Database Impact
- Additive to `ProjectModel`: `status` enum gains `'delivered_pending_acceptance'`; `deliveryAcceptedAt: Date`; `deliveryAcceptanceNotes: string`

### API Impact
- New: `PUT /api/projects/:id/submit-delivery`
- New: `PUT /api/projects/:id/accept-delivery`
- New: `PUT /api/projects/:id/delivery-concern`

### Zero-Downtime Migration Strategy
- New status is additive to the enum — existing projects with `completed` status are unaffected
- New routes are entirely additive — no existing routes modified
- Feature flag `FEATURE_DELIVERY_ACCEPTANCE` — when off, project completion works as before (team marks complete directly)

---

## STEP 11 — INVOICE

### Current Behaviour
Invoices are visible to clients at `/client/invoices` (`ClientInvoices.tsx`). The page lists invoices with SAR amounts, status (Paid/Unpaid), and a PDF download button. Invoices are also accessible within `ProjectDetails.tsx` under the Invoices tab. The `GET /api/invoices` endpoint serves the list, and `GET /api/client/invoice-print/:id` serves the PDF.

### Problems
1. **Invoice PDF quality is unknown** — the visual design and legal compliance (ZATCA e-invoice requirements) of the current PDF output are not confirmed.
2. **No invoice notification.** When a new invoice is generated, it is unclear whether the client receives a proactive notification (email or WhatsApp) or must discover it by logging in.
3. **Unpaid invoices have no payment CTA inline.** The client sees "Unpaid" status but must navigate elsewhere to pay — the invoice list and the payment flow are not connected.
4. **ZATCA Phase 2 compliance** (e-invoicing with QR code, XML, cryptographic signing) is not confirmed as implemented. This is a legal requirement in Saudi Arabia.

### Psychological Impact
> *"I see an invoice here. It says SAR 12,000 Unpaid. How do I pay it? There's no button. I'll go to my wallet... but I need to top up first... OK this is confusing."*

The invoice page identifies that money is owed but does not provide a path to resolve it. This is both a UX failure and a revenue delay.

### Business Impact
- Delayed payments due to unclear payment path
- Potential legal risk from ZATCA non-compliance
- Finance team receives "how do I pay my invoice?" support questions that should be self-service

### Enterprise Recommendation
Every invoice must be **self-service from creation to payment**. The client receives a notification the moment an invoice is issued, opens a beautifully formatted invoice page, clicks **"Pay Now"**, completes payment inline, receives a receipt, and the order status updates automatically.

ZATCA e-invoice compliance (QR code, sequential numbering, cryptographic signing) must be confirmed and built into the generation pipeline.

### UI Recommendation
**Invoice Detail Page (new `/client/invoices/:id`):**
- Invoice rendered as a **web page** (not just PDF) — clean, branded, Arabic RTL primary
- All required ZATCA fields visible: seller name, CRN, VAT number, buyer name, VAT number, invoice date, supply date, VAT amount, total
- **QR code** (ZATCA Phase 2 compliant) prominently displayed
- Line items, subtotal, VAT (15%), total
- **Payment status banner:**
  - Unpaid: amber banner → "Pay SAR [amount] now" → full-width Mada / STC Pay / Wallet buttons inline
  - Paid: green banner → "Paid on [date]" → receipt PDF download button
- "Download invoice (PDF)" — ZATCA-compliant PDF
- Share: "Send this invoice to your finance team" → shareable read-only link

**Invoice list page improvements:**
- Each invoice row has a **"Pay Now"** button for unpaid invoices (inline payment modal — no navigation away)
- Filter by: All / Unpaid / Paid / Overdue
- Running totals at top: "Total due: SAR X · Total paid this year: SAR Y"

**Notification on invoice creation:**
1. In-app (immediate)
2. Email: "New invoice from QIROX — SAR [amount] due [date]" with pay button (5 min)
3. WhatsApp: Arabic message with invoice summary and pay link (10 min)
4. Reminder: 3 days before due date — email + WhatsApp

### Backend Changes Required
- ZATCA Phase 2 compliance: XML generation (UBL 2.1), QR code (TLV-encoded), cryptographic signing, sequential invoice numbering — if not already implemented
- Invoice notification triggers: email + WhatsApp on invoice creation and 3 days before due date
- Payment gateway integration on invoice detail page (reuses Moyasar from Step 7)
- Shareable invoice link: `POST /api/client/invoices/:id/share-link`

### Database Impact
- Additive to `InvoiceModel`: `zatcaXmlUrl: string`, `zatcaQrCode: string`, `shareToken: string`, `dueDate: Date`, `reminderSentAt: Date`

### API Impact
- New: `GET /api/client/invoices/:id` — full invoice detail (existing may only serve list)
- New: `POST /api/client/invoices/:id/share-link`
- Modify: `GET /api/client/invoice-print/:id` — ensure ZATCA fields included in PDF output

### Zero-Downtime Migration Strategy
- ZATCA fields are additive — existing invoices without them display without QR code (legacy label)
- New invoice detail route `/client/invoices/:id` is net-new — existing list at `/client/invoices` unchanged
- Payment inline on invoice is a new feature — does not modify existing payment routes

---

## STEP 12 — REVIEW

### Current Behaviour
There is **no review or NPS collection workflow visible in the codebase.** After project completion and invoicing, there is no confirmed automated or manual prompt for the client to provide feedback, leave a review, or complete an NPS survey.

### Problems
1. **The single biggest gap in the entire journey.** QIROX has no systematic way of collecting client satisfaction data, testimonials, or reviews. Every satisfied client is a potential testimonial, case study, and referral source — none of this is captured.
2. **Without an NPS programme, the customer health score (Customer Success) has no satisfaction component.**
3. **Without reviews, QIROX has no public social proof generated from the actual client experience** — marketing must rely on manually solicited testimonials.

### Psychological Impact
The client who has had a good experience is ready to tell someone about it — if asked. If not asked at the right moment, that positive emotion fades. The right moment is in the 24–48 hours after delivery acceptance — not weeks later.

### Business Impact
- Lost testimonials = lost marketing assets
- No NPS data = no customer health intelligence
- No review requests = lower Google/Trustpilot ratings (unhappy clients review spontaneously; happy clients must be asked)
- Lost referral opportunities (a client who would happily refer someone has no prompt to do so)

### Enterprise Recommendation
Implement a **structured review collection workflow** that activates automatically upon delivery acceptance. The workflow is: NPS → written testimonial → referral invite — in that order, over 72 hours, not all at once.

### UI Recommendation
**Post-delivery review sequence:**

**Trigger:** Client clicks "I confirm delivery" (Step 10) →

**Immediate (on confirmation screen):**
- NPS question: "On a scale of 0–10, how likely are you to recommend QIROX to a colleague?"
- 11-button scale (0–10) — tap to answer
- Optional: "What's the main reason for your score?" — free text
- This takes 15 seconds. Always shown immediately after delivery acceptance.

**24 hours later (email + WhatsApp):**
- If NPS 9–10 (Promoter): "Would you like to share your experience? [Write a testimonial → 3 sentences max] [Share on Google] [Share on LinkedIn]"
- If NPS 7–8 (Passive): "Thank you for your feedback. Is there anything we could have done better?" → free text → routes to account manager
- If NPS 0–6 (Detractor): "We're sorry your experience wasn't perfect. Your account manager [Name] will contact you within 2 hours." → automatic escalation alert to account manager

**48 hours later (for 9–10 Promoters only):**
- "Know someone who could benefit from QIROX? Share your referral link and earn [X]% credit on their first payment." → referral programme prompt

**Testimonial page (internal, `/employee/testimonials`):**
- All submitted testimonials with NPS score, client name, and approval status
- One-click approve → published to the Clients/Testimonials public page
- Generate case study prompt for approved high-NPS testimonials

### Backend Changes Required
- New `NpsResponseModel`: `clientId`, `projectId`, `score`, `reason`, `createdAt`
- New `TestimonialModel`: `clientId`, `projectId`, `npsScore`, `text`, `approved`, `publishedAt`
- Cron / trigger: on delivery acceptance → create NPS task; 24h later → send review request; 48h later → send referral prompt
- New employee-facing API: `GET /api/employee/testimonials`, `PUT /api/employee/testimonials/:id/approve`

### Database Impact
- New: `NpsResponseModel`, `TestimonialModel`

### API Impact
- New: `POST /api/client/nps` — submit NPS score + reason
- New: `POST /api/client/testimonials` — submit written testimonial
- New: `GET /api/employee/testimonials` — employee view of all submissions
- New: `PUT /api/employee/testimonials/:id/approve` — publish to public page

### Zero-Downtime Migration Strategy
- Entirely new system — no existing system to migrate
- Feature flag `FEATURE_NPS_REVIEWS` — enables/disables the post-delivery trigger
- All endpoints are new — no conflicts

---

## STEP 13 — LONG-TERM CLIENT

### Current Behaviour
A referral programme exists at `/referral` (`ClientReferral.tsx`) — clients can generate referral links and view their referral dashboard. Subscriptions and add-ons are viewable. There is no visible loyalty programme, renewal notification, expansion suggestion, or relationship management programme beyond what the Customer Success team does manually.

### Problems
1. **The relationship between QIROX and its clients effectively ends at project delivery.** There is no proactive ongoing engagement programme.
2. **The referral programme exists but is not promoted at the right moment** (post-delivery, when client satisfaction is highest) and is not integrated into the post-delivery flow.
3. **No subscription renewal workflow.** Clients on recurring plans are not notified before renewal, do not see their renewal date prominently, and have no self-service option to upgrade, downgrade, or cancel — creating churn that could be prevented.
4. **No expansion suggestions.** A client using QIROX's Restaurant Plan is never automatically presented with "you could also add our Marketing Suite" — upsell is entirely manual.
5. **No loyalty recognition.** A client who has been with QIROX for 2 years and referred 3 clients receives no different experience from a client who signed up last week. Loyalty is invisible in the product.

### Psychological Impact
> *"My project is done. I have the system. I use it every day but I never really interact with QIROX anymore. I wouldn't even remember their name if someone asked me who built my system."*

This is brand forgetting. The client uses QIROX's product every day but has lost the emotional connection to QIROX as a company. They are vulnerable to switching if a competitor approaches them.

### Business Impact
- Churn that could be predicted and prevented is instead discovered after the client has already decided to leave
- Upsell opportunities are entirely dependent on account managers remembering to ask
- The referral programme is generating fewer referrals than it could because it is not surfaced at the right moments

### Enterprise Recommendation
Design the long-term client experience as a **continuous relationship**, not a series of one-off projects. Every client should feel that QIROX is actively invested in their growth — through proactive check-ins, expansion suggestions, and recognition of loyalty.

### UI Recommendation
**Client Home Dashboard (the `/dashboard` for returning clients, distinct from the empty dashboard on first login):**
- Personalised greeting: "Good morning, [Name]. Here's what's happening in your QIROX account:"
- **My Systems:** subscription status, renewal date, features in use vs. available (drives upgrade awareness)
- **Quick Actions:** most-used features surfaced as shortcuts
- **Recommended for you:** 1–2 contextual add-on or feature suggestions based on their plan and usage
- **News and Updates:** QIROX product updates relevant to their plan
- **Referral Status:** "You have [X] referrals — your next reward is [X] SAR in credit"
- **Loyalty Badge:** "QIROX Client since [year] · [tier] member" — Gold tier at 1 year, Platinum at 2+

**Renewal Flow (30 days before renewal):**
- Email + WhatsApp notification: "Your [Plan Name] renews on [date] for SAR [amount]. [Renew early for 10% discount] or [Review your plan]"
- In-app: renewal countdown banner on dashboard with "Manage renewal" CTA
- Self-service renewal page: confirm, upgrade, or downgrade — no human required

**Expansion Suggestions (Customer Success + AI):**
- AI analyses which features of the existing plan are unused → prompts: "Did you know your plan includes [feature]? Here's how to set it up"
- After 3 months: "Based on businesses like yours, many QIROX clients add [add-on] at this stage"
- CSM triggers expansion prompt manually from the Customer Success department dashboard

### Backend Changes Required
- Subscription renewal reminders: cron job, 30 days + 7 days + 1 day before renewal → email + WhatsApp
- Loyalty tier calculation: based on `createdAt` and subscription tenure → `loyaltyTier: 'standard'|'gold'|'platinum'`
- Feature usage tracking: log which plan features are actively used → drives expansion suggestions
- Referral programme: already exists — ensure it is triggered post-delivery (link to Step 12 flow)

### Database Impact
- Additive to `UserModel`: `loyaltyTier: string`, `loyaltyTierSince: Date`
- New: `FeatureUsageModel` — `userId`, `featureId`, `lastUsedAt`, `useCount` (for expansion suggestion logic)

### API Impact
- New: `GET /api/client/loyalty` — returns tier, since date, referral stats, next milestone
- New: `GET /api/client/recommendations` — returns 2–3 contextual expansion suggestions
- New: `POST /api/subscriptions/:id/renew` — self-service renewal

### Zero-Downtime Migration Strategy
- All additive — loyalty tier is computed, not migrated
- Feature usage logging is new — old usage data simply isn't available; suggestions improve over time as data accumulates
- Feature flag `FEATURE_LOYALTY_PROGRAMME` — controls display of loyalty tier and badge

---

## CONSOLIDATED FRICTION MAP

| Step | Severity | Primary Issue |
|---|---|---|
| 1. Visitor | 🔴 Critical | No clear value prop; early commitment ask; two competing CTAs |
| 2. Discovery | 🟠 High | Passive catalogue; no guided recommendation; ambiguous CTA after discovery |
| 3. Pricing | 🟠 High | Feature table = analysis paralysis; VAT surprise; no social proof |
| 4. Request | 🔴 Critical | Two disconnected paths; WhatsApp leak at highest intent; no Mada/STC Pay |
| 5. Quotation | 🟠 High | No proactive notification; rejection is a dead end; no expiry urgency |
| 6. Contract | 🟡 Medium | OTP via in-app (tab-switching); no downloadable signed copy; no share |
| 7. Payment | 🔴 Critical | No Mada/STC Pay; bank transfer as primary = 24–72h delay; manual process |
| 8. Project Dashboard | 🟠 High | No onboarding; 11 tabs; no "action required" surface; blank start state |
| 9. Communication | 🟡 Medium | Fragmented channels; no response SLA shown; WhatsApp becomes default |
| 10. Completion | 🟡 Medium | No formal acceptance; no celebration; no automated final invoice trigger |
| 11. Invoice | 🟡 Medium | No payment CTA on invoice; ZATCA compliance unconfirmed; no notifications |
| 12. Review | 🔴 Critical | **Entirely absent** — no NPS, no testimonials, no review programme |
| 13. Long-term | 🟠 High | No renewal flow; no expansion suggestions; no loyalty programme |

---

## THE NEW CLIENT JOURNEY — NORTH STAR DESIGN

### Governing Principles

**Every page reduces uncertainty.**  
The client always knows: Where am I? What is happening? What is the next step? How long? Who is responsible?

**Every interaction builds trust.**  
Consistency, speed, and competence communicated at every touchpoint — not just in the product, but in every notification, every email, every WhatsApp message, every PDF.

**Every action feels premium.**  
Apple for visual simplicity. Stripe for financial clarity. Linear for task execution. Notion for information density. Vercel for deployment confidence. Framer for motion and delight.

### The New Journey in One Sentence per Step

1. **Visit:** "I immediately understood what QIROX does and why it's right for me."
2. **Discovery:** "The platform told me exactly which solution fits my business."
3. **Pricing:** "The price was clear, fair, and inclusive of VAT — no surprises."
4. **Order:** "I configured, customised, and paid in one sitting — 12 minutes total."
5. **Quotation:** "I got a WhatsApp with my quotation. I read it, asked one question in the portal, and accepted — done."
6. **Contract:** "I signed digitally in under 2 minutes. My signed copy arrived in my email immediately."
7. **Payment:** "I paid with Mada. Done in 30 seconds. Got a receipt."
8. **Dashboard:** "I opened my dashboard and immediately knew my team had started. I could see exactly what was happening and what I needed to do."
9. **Communication:** "I had one place to talk to my team. They always replied within 2 hours."
10. **Completion:** "I confirmed delivery by reviewing a checklist. The moment I clicked Accept, I felt like something real had been accomplished."
11. **Invoice:** "My invoice was waiting in my email. I clicked Pay, used Mada, and it was settled in 30 seconds."
12. **Review:** "They asked me how it went right after delivery. I gave them 10/10 and wrote two sentences. It took 45 seconds."
13. **Long-term:** "Two years later, QIROX still feels like a partner, not just a vendor. They remind me before my renewal. They suggest features I hadn't tried. I've referred three people."

---

*No production code was modified. This Blueprint is submitted for CTO approval before any implementation begins.*
