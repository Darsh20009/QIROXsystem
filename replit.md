# Qirox Platform

## 🛑 MASTER DIRECTIVE — No Assumptions, Execute Only (Non-Negotiable, Supersedes Conflicts Below)

Issued 2026-07-14. This is the strictest, highest-priority rule set for QIROX. It governs every future content/asset decision on the platform.

1. **Never invent real-world content.** No fake people, fake companies, fake statistics, fake offices, fake testimonials, fake projects, fake awards, fake numbers, fake timelines, fake partners, fake case studies, fake company history/milestones.
2. **Never use stock photos, AI-generated humans, placeholder images, Unsplash/Pexels/Pixabay, or fake offices/developers/meetings.** If an image or video is required and doesn't already exist as real data in this project, STOP and ask the user for the exact asset (describe requirements: purpose, dimensions, style, format) — then wait for it before continuing that piece of work.
3. **Brand colors (target, not yet applied):** Primary = White, Off-white, Black, Dark Navy, Blue, professional Grays. Accent = Dark Green (sparingly). Purple is allowed **only** as a very small accent — it must never dominate the UI. The current UI (`--brand` token, tailwind.config.ts / index.css) is purple-heavy and has **not** been migrated yet — treat any purple-dominant page as non-compliant and flag it, but do not mass-repaint the whole app without explicit user go-ahead (large visual change).
4. **Design language reference only:** Apple, Stripe, Linear, Arc, Raycast, Notion, Vercel are quality bars, never to be copied/imitated — QIROX must keep its own unique identity.
5. **No repeated layouts/cards/sections/hero designs/icon grids across pages** — every page needs its own identity while staying visually consistent (same radius/shadow/spacing system platform-wide).
6. **Do not touch backend/business logic/APIs/auth/routes/DB schema/existing features** as a side effect of design work, unless explicitly approved for that specific change.
7. **Before building any section that needs real-world content** (About, CEO/CTO profiles, Team, Office, Projects/case studies, Testimonials, employee digital ID cards, etc.), produce an explicit asset checklist and get the user to supply or explicitly skip each item — never guess or fill gaps with generated content.
8. **Entity/Person SEO intent:** the eventual goal is for CEO/CTO/employee/project pages to become the authoritative Google result for their names — only real, user-provided bios/history, never invented.
9. **Events system is a core, working feature — fix bugs, never remove or redesign around it.**

**Why:** the user issued this as a strict "execute only, no creative invention on real-world facts" directive after prior work (e.g. Landing V2) shipped with illustrative placeholder stats and a purple-dominant palette — both of which violate rules 1–3 above and are pending a user decision on remediation.

### Status as of 2026-07-14 — HOLD, no implementation until further instruction

The user explicitly confirmed: **do not implement, redesign, recolor, or code anything yet.** Only save these standards and wait for explicit next instructions. Treat everything below as approved *specification*, not a go-ahead to build.

**Approved target color system (spec only, not yet applied anywhere):**
- Primary: White, Off-White, Black, Dark Navy, Professional Blue, full Gray scale.
- Accent: Dark Green (only when meaningful). Purple is no longer a primary brand color — subtle accent only, never dominant.
- When this is eventually built: create one unified Design System (tokens, shadows, borders, cards, buttons, inputs, nav, type scale, icons, backgrounds, gradients, hover/focus states, animations, glass effects, elevation, spacing) shared by Landing, Dashboards, Employee Portal, Customer Portal, Admin Portal, POS — build the foundation first, then migrate pages one by one. Never just swap purple for blue 1:1.

**Real assets received so far (use only these, never invent more):**
- CEO — محمد الدباني (Mohammed Aldabani), Chief Executive Officer, Executive Management. Photo saved at `client/public/team/ceo-mohammed-aldabani.png`.
- CTO — يوسف درويش (Yousef Darwish), Chief Technology Officer, Technology. Photo saved at `client/public/team/cto-yousef-darwish.png`.
- No other CEO/CTO fields provided yet (bio, vision, timeline, awards, LinkedIn/GitHub, quote, signature, video) — must be requested individually when that page is actually built.

**Confirmed real-world constraints (do not contradict these later):**
- **Office:** QIROX has no physical office currently. Never build an office gallery/reception/meeting-room section. Remove any such placeholder content if found.
- **Team:** Only one real group photo exists (not yet uploaded). Workflow when it arrives: ask the user to identify every person left-to-right, place interactive hotspots only after identification, never crop/guess/auto-identify faces, never invent employees. Each identified person gets a profile (name, position, department, bio, skills, social links, projects).
- **Partners/Projects:** the strongest section — each partner needs a dedicated showcase (logo, brand colors, website, story, services delivered, tech used, results, screenshots incl. mobile, gallery, testimonial, live preview). Prefer a real iframe embed of the partner site; if blocked by X-Frame-Options/CSP, use a premium browser-mockup frame around real screenshots instead — never leave an empty iframe.
- **Missing-asset protocol:** whenever any image/logo/screenshot/video is needed and doesn't already exist as real data, stop and describe exactly what's needed, then wait — never substitute stock photos, generated people, or invented stats.

## 🎨 Mandatory Design Philosophy — Definition of Done for Every UI Task (Non-Negotiable)

**This applies to the entire QIROX platform, not any single page.** It overrides generic UI/dashboard patterns and is mandatory, not optional inspiration. Every future page, component, dashboard, workflow, feature, illustration, animation, and customer interaction must follow it.

**QIROX must NEVER look like an AI-generated dashboard.** It must feel handcrafted by a world-class product design team. The goal is emotional design, not template design.

1. **Human First** — The platform should feel alive, not like software, not like an admin panel, not like an AI template. The user should feel there are real people behind QIROX.
2. **Premium Visual Identity** — Avoid generic cards, repetitive layouts, repeated gradients, copied dashboard patterns. Every section should have its own personality.
3. **Human Illustrations** — Use original premium 3D illustrations where appropriate (people collaborating, designers reviewing work, developers building products, customer success specialists, project managers, meetings, creative studios, business growth). Not robots, not futuristic AI people, not generic stock art. Warm, premium, human.
4. **Human Language** — Never communicate like a machine. Instead of "Order #392 is Processing" use "Our design team has started working on your project." Instead of "Status Updated" use "Great news! Your project has moved to the next stage." Everything conversational.
5. **Micro Interactions** — Smooth transitions, small animations, hover effects, progress animations, loading skeletons, meaningful empty states, celebration moments, confetti only when appropriate, subtle delight everywhere.
6. **Storytelling** — Every screen tells a story. Instead of displaying data, explain what is happening. Instead of numbers, show progress. Instead of technical logs, show customer-friendly messages.
7. **Real Company Feeling** — The customer should feel they entered the headquarters of QIROX: departments, real team names, current activity, who is working now, next milestone, estimated completion, company updates, upcoming events, announcements. Everything authentic.
8. **Premium 3D Assets** — Use carefully crafted 3D elements where they add emotion: 3D folders, files, project boards, calendars, wallets, payment cards, meeting rooms, notifications, achievements, trophies, identity cards, employee badges, QR cards.
9. **Never Overuse 3D** — 3D supports the experience, never dominates it. Use it only where it adds emotion; keep the interface elegant.
10. **Every Page Needs Emotion** — Landing Page → Inspiration. Services → Confidence. Quotation → Trust. Payment → Security. Dashboard → Progress. Projects → Excitement. Delivery → Celebration. Support → Care. Events → Community. Presentation → Pride.
11. **Build a Signature Style** — QIROX must have its own visual language; if the logo is removed, people should still recognize the product as QIROX. Do not imitate Stripe, Linear, Notion, or Apple — learn from them, but create a unique visual identity. The final experience should feel like a premium creative company, not a software template.

**Definition of Done check for every UI task** — before considering it complete, ask:
- Does this feel handcrafted by a premium creative company?
- Does it feel human?
- Does it tell a story?
- Does it create emotion?
- Does it strengthen the QIROX identity?
- Does it avoid looking like a generic AI-generated dashboard?

If the answer to any of these is "no", redesign it before considering the task complete.

## 🏢 Permanent Product Rule — QIROX Is a Premium Digital Company Experience, Not a Management System

**QIROX is NOT a management system. QIROX is a premium digital company experience.**

Every feature must answer "How does this make the customer feel?" — not only "What does this feature do?"

### Design priorities (in order)
1. Emotion before information.
2. Clarity before complexity.
3. Story before statistics.
4. Human before technology.
5. Experience before functionality.
6. Beauty without sacrificing usability.

### Structural rules
- Every screen must have a clear purpose.
- Every page must have one primary action.
- Every action must reduce customer effort.
- Never overwhelm the user with too much information — use progressive disclosure throughout the platform.
- The interface must always guide the customer naturally.
- No dead pages. No empty pages. No generic placeholders. No generic icons. No random illustrations. Everything reinforces the QIROX brand.

### State & feedback rules
- Animations communicate state, not decoration.
- Every loading state reassures the user that work is happening.
- Every success state celebrates appropriately.
- Every error explains the solution.

### Customer-facing language rule
Never expose internal technical terminology to customers. Customers must never see words like: MongoDB, API, Queue, Task ID, Sprint, Issue, Bug, Internal Status. Translate everything into customer language. The customer should always feel that QIROX is actively working on their project.

### Final check
If any future UI looks similar to a generic admin template or an AI-generated dashboard, redesign it before considering the task complete. **This is a permanent product rule.**

## ⚠️ CTO Directive — Zero Downtime Policy (Non-Negotiable)

**Production MUST NEVER stop. The system is live and in use.**

### Rules — all work must follow these without exception

1. **Never delete existing code.**
2. **Never rename existing APIs.** New behavior goes behind V2 endpoints or Feature Flags.
3. **Never remove existing pages.**
4. **Never modify MongoDB collections in a breaking way.** Only additive fields. No renames, no removals, no destructive migrations.
5. **Never break existing frontend behavior.**
6. **Never stop the production website.**
7. **Every migration must be additive.**

### Feature Flag naming convention
Every major new feature ships behind a flag until QA-approved for production:
`CRM_V2`, `EMPLOYEE_DASHBOARD_V2`, `CLIENT_DASHBOARD_V2`, `EVENTS_V2`, `APPLE_WALLET_V2`, `AI_PLATFORM_V2`, `SEO_PLATFORM_V2`

The old implementation stays active until the new one reaches production quality and is approved.

### API policy
- Never alter an existing endpoint's contract.
- New behavior → new `/v2/` endpoint **or** Feature Flag gate.

### Database policy
- No destructive migrations.
- No collection renames.
- No field removals.
- Additive fields only.
- Backward-compatible schemas only.

### Frontend policy
- Existing UI remains fully operational at all times.
- New dashboards (Client Dashboard V2, Employee Dashboard V2, CRM V2, Events V2, Apple Wallet V2, Presentation Center) are developed independently and coexist with the current system.
- Switch to new implementation only after QA approval.

### Every migration must document
| Field | Required value |
|---|---|
| Purpose | What and why |
| Risk | What could go wrong |
| Rollback Strategy | How to revert safely |
| Verification Checklist | How to confirm success |
| Expected Downtime | **ZERO** |

---

Qirox is a SaaS "Systems Factory" platform that showcases industry-specific website templates and provides admin management for templates and pricing, targeting Arabic-speaking markets.

## Run & Operate

- **Run Dev Server**: `npm run dev`
- **Build**: `npm run build` (client with Vite, server with esbuild)
- **Typecheck**: `npm run typecheck`
- **Codegen**: `npm run codegen`
- **DB Push**: `npm run db:push` (for Drizzle, if used)
- **Env Vars**:
  - `MONGODB_URI`: MongoDB Atlas connection string (required)
  - `SMTP2GO_API_KEY`, `SMTP2GO_SENDER`, `SMTP2GO_SENDER_NAME`, `EMAIL_LOGO_URL`, `EMAIL_SITE_URL`: For email notifications
  - `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`: For PayPal integration (optional)
  - `SESSION_SECRET`: Long random string for Express sessions
  - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`: For Web Push Notifications
  - `OPENAI_API_KEY`: For AI features
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`: For OAuth (if implemented)
  - `SANDBOX_ENC_KEY`: For sandbox environment variable encryption

## Stack

- **Frontend**: React 18 (TypeScript), Vite, Wouter, TanStack React Query, Shadcn/ui, Tailwind CSS, Framer Motion, React Hook Form (Zod), Lucide React
- **Backend**: Express 5 (Node.js, TypeScript), Mongoose, Passport.js, express-session, scrypt
- **Shared**: TypeScript interfaces & Zod schemas
- **Database**: MongoDB
- **Runtime**: Node.js

## Where things live

- **`client/src/`**: Frontend source code
- **`server/src/`**: Backend source code
- **`shared/src/`**: Shared types and schemas (source of truth for API contracts: `shared/src/schema.ts`, `shared/src/routes.ts`)
- **`server/src/models.ts`**: Mongoose models (server-only DB schema definitions)
- **`client/src/index.css`**: Global styles and Tailwind configuration
- **`client/src/lib/i18n.tsx`**: i18n configuration and translation keys
- **`/public`**: Static assets (e.g., `qirox-loader-logo.png`)
- **`uploads/`**: Uploaded files (e.g., bank transfer proofs)
- **`sandbox-projects/`**: Sandbox IDE project files

## Architecture decisions

- **Monorepo with Shared Types**: Enforces type safety across frontend and backend using a `shared/` directory for interfaces and Zod schemas.
- **Arabic-First UI**: Prioritizes RTL layout, Arabic fonts, and localized content, with full bilingual support.
- **Repository Pattern**: Abstracts database operations via an `IStorage` interface for better maintainability and potential future database changes.
- **Session-Based Authentication**: Leverages server-side session management with `express-session` for user authentication.
- **Modular Architecture**: Core + Modules pattern for templates and features to ensure extensibility.
- **Dynamic Connection Settings**: Allows live switching of primary/secondary databases and email services from the admin panel without redeployment.

## Product

- **Public Pages**: Home (8 sectors showcase), Portfolio, Pricing, About, Contact, Switch Reminder, Qirox AI Wizard, Order Tracking.
- **Admin Features**: Templates/Pricing/Services/Orders/Finance/Employees management, Sales Reports, AI Sessions, Cron Jobs, MongoDB Atlas integration, App Publishing, Modification Quota, Push Notifications, Quotations, Installments, Lead Auto-Assignment.
- **Client Features**: Dashboard, Project tracking, Order flow (5-step), Wallet (Qirox Pay), Loyalty program, Digital Contracts, Client Data Requests, My Tools (50+ utilities), Profile management (avatar builder), Client Group announcements.
- **Employee Features**: QMeet (WebRTC video conferencing), Employee Mail, System Builder (Cloud IDE), Role-specific dashboards, Changelog/Employee Guide, **Sector Technical Guide** (`/employee/sector-guide` — 10 sectors with modules, unique features, tech specs, comparison matrix).
- **Customer Journey V2 (`/api/v2/customer/*`, behind `FEATURE_CUSTOMER_JOURNEY_V2`, default OFF)**: Real DB-backed journey state, timeline/events, next-recommended-action engine, staff-only health score, staff-only portfolio KPIs, and a notification trigger — see `docs/sprint-c-report.md`.
- **Core Systems**: Full i18n (Arabic/English, RTL/LTR), Dark/Light mode, Comprehensive notification system (in-app, email, push, WS), Device 2FA, Multiple 2FA methods (TOTP, email OTP, passphrase, push approval).
- **E-commerce Store**: Embedded Qirox Store module with product management and API proxies.

## User preferences

Preferred communication style: Simple, everyday language.

## Gotchas

- **DevTools in Production**: DevTools detection and right-click blocking are active only in production environments.
- **QMeet Lobby**: `lobbyEnabled` defaults to `false` for new meetings; hosts can manually enable it.
- **PayPal Integration**: If PayPal secrets are not set, PayPal routes will gracefully degrade to 503 errors.
- **Wallet PIN**: Always required for wallet payments.
- **IMAP Connection Timeout**: Corporate mail IMAP connections have timeouts to prevent hangs.
- **Chat Guest Messages**: Guests' chat messages (`msg.userId`) now correctly use `myIdRef.current` to avoid stale closures.
- **Mobile Screen Sharing**: Screen sharing is restricted to laptop/desktop devices.

## Pointers

- **UI Components**: [Shadcn/ui Documentation](https://ui.shadcn.com/)
- **State Management**: [TanStack Query Documentation](https://tanstack.com/query/latest)
- **Form Handling**: [React Hook Form Documentation](https://react-hook-form.com/)
- **Animations**: [Framer Motion Documentation](https://www.framer.com/motion/)
- **Routing**: [Wouter Documentation](https://www.npmjs.com/package/wouter)
- **Icons**: [Lucide React Icons](https://lucide.dev/icons/)
- **Date Formatting**: [date-fns Documentation](https://date-fns.org/)
- **Backend Framework**: [Express.js Documentation](https://expressjs.com/)
- **Database ODM**: [Mongoose Documentation](https://mongoosejs.com/)
- **Authentication**: [Passport.js Documentation](http://www.passportjs.org/)
- **Email Service**: [SMTP2GO Documentation](https://www.smtp2go.com/)
- **WebSocket Library**: [ws Documentation](https://github.com/websockets/ws)
- **Monaco Editor**: [Monaco React Documentation](https://github.com/suren-atoyan/monaco-react)
- **QR Code Generation**: [qrcode.react Documentation](https://www.npmjs.com/package/qrcode.react)