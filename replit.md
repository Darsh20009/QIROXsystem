# Qirox Platform

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