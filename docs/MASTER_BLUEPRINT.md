# QIROX Platform — Master Blueprint

> **Status:** V4 Foundation Audit (Read-Only — Do Not Modify Production Code)
> **Last Updated:** 2026-07-08
> **Scope:** Entire repository snapshot

---

## 1. Platform Identity

**Name:** QIROX Systems  
**Tagline:** مصنع الأنظمة الرقمية (Digital Systems Factory)  
**Market:** Arabic-speaking markets (KSA primary, GCC secondary)  
**Model:** SaaS — website/system templates + managed subscriptions  
**Language Priority:** Arabic-first, bilingual (AR/EN), RTL layout

---

## 2. Platform Scale (Current Audit)

| Metric | Value |
|---|---|
| Total server lines | 33,796 |
| Largest file | `server/routes.ts` — 16,975 lines |
| Frontend pages | 166 |
| API endpoints (estimated) | 632+ |
| User roles | 11 (Admin, Manager, Accountant, Sales, Developer, Designer, Support, Merchant, Client, Supplier, Investor) |
| Database | MongoDB (primary), PostgreSQL (Drizzle config present) |
| Mobile | Capacitor (iOS + Android TWA) |
| CI/CD | Codemagic |

---

## 3. Core Product Areas

### 3.1 Public-Facing
- Landing page (Arabic RTL, animated)
- Pricing page
- Systems showcase (template catalog)
- About, Contact, News, Partners, Jobs, JoinUs pages
- Cafe demo static site (`/public/cafe-demo/`)

### 3.2 Client Portal
- Subscription management
- Installment plans
- Wallet / loyalty points
- Invoice viewing
- Support tickets / SLA
- Contract signing
- Referral system
- Order tracking / shipments

### 3.3 Employee Portal
- Project management (Kanban)
- Attendance tracking
- Payroll / salaries
- CRM (contacts, leads, pipeline)
- WhatsApp CRM templates
- Mail IMAP integration
- Group messaging
- DeploymentCloud (standalone GitHub-OAuth)
- QMeet (WebRTC video conferencing)
- AI Studio (GPT-4o / Kimi)

### 3.4 Admin Panel
- 40+ admin pages
- System settings (live DB/SMTP switching)
- Pixel tracking (Meta, TikTok, Snap, GA4, GTM)
- Cron job management
- API key management
- Gamification / rewards
- Analytics dashboard
- Email marketing campaigns
- Changelog management

### 3.5 Developer / Sandbox
- Monaco Editor (in-browser IDE)
- Sandbox runner (spawn/exec processes)
- System builder

---

## 4. Technology Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Express 5 |
| Language | TypeScript (tsx in dev, esbuild in prod) |
| ORM / DB Client | Mongoose (MongoDB), Drizzle (PostgreSQL — limited use) |
| Auth | Passport.js + express-session + connect-mongo |
| Password | bcrypt / scrypt |
| 2FA | speakeasy (TOTP) |
| WebAuthn | @simplewebauthn |
| Real-time | WebSocket (ws), SSE |
| Video | WebRTC via QMeet (server/qmeet.ts) |
| Email | SMTP2GO API + Nodemailer + IMAP |
| Push | web-push (VAPID) |
| PDF | pdf-lib + fontkit |
| Compression | compression (gzip/brotli) |
| File upload | multer |
| Scheduling | node-cron |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build | Vite |
| Routing | Wouter |
| State | TanStack React Query v5 |
| UI Library | Shadcn/ui (Radix UI primitives) |
| Styling | Tailwind CSS v3 |
| Animation | Framer Motion |
| Forms | React Hook Form + Zod |
| Icons | Lucide React, react-icons |
| RTL | CSS `dir="rtl"` + Tailwind RTL config |
| Code Editor | Monaco Editor |
| i18n | Custom i18n hook (`client/src/lib/i18n.tsx`) |

### Mobile
| Platform | Technology |
|---|---|
| iOS | Capacitor 7 + native iOS project |
| Android | TWA (Trusted Web Activity) via android-twa/ |
| CI/CD | Codemagic (codemagic.yaml) |

---

## 5. Infrastructure

- **Primary host (dev):** Replit
- **Primary host (prod):** Render (render.yaml present)
- **MongoDB:** Atlas (connection via `MONGODB_URI`)
- **Static files:** `client/public/` (Vite root), `public/` (server static)
- **Uploads:** `uploads/` directory (local disk — not CDN)
- **Sandbox projects:** `sandbox-projects/` directory

---

## 6. Environment Variables Required

| Variable | Purpose | Required |
|---|---|---|
| `MONGODB_URI` | Primary database | YES |
| `SESSION_SECRET` | Session signing | YES |
| `SMTP2GO_API_KEY` | Outbound email | YES |
| `SMTP2GO_SENDER` | Sender address | YES |
| `SMTP2GO_SENDER_NAME` | Sender display name | YES |
| `EMAIL_LOGO_URL` | Email template logo | MEDIUM |
| `EMAIL_SITE_URL` | Email template links | MEDIUM |
| `PAYPAL_CLIENT_ID` | PayPal payments | OPTIONAL |
| `PAYPAL_CLIENT_SECRET` | PayPal payments | OPTIONAL |
| `OPENAI_API_KEY` | GPT-4o AI features | OPTIONAL |
| `MOONSHOT_API_KEY` | Kimi AI fallback | OPTIONAL |
| `VAPID_PUBLIC_KEY` | Web push | OPTIONAL |
| `VAPID_PRIVATE_KEY` | Web push | OPTIONAL |
| `SANDBOX_ENC_KEY` | Sandbox env encryption | OPTIONAL |
| `GOOGLE_CLIENT_ID` | Google OAuth | OPTIONAL |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | OPTIONAL |
| `GITHUB_CLIENT_ID` | GitHub OAuth | OPTIONAL |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth | OPTIONAL |
| `DATABASE_URL` | PostgreSQL (Drizzle) | OPTIONAL |

---

## 7. Document Index

| Document | Purpose |
|---|---|
| `ARCHITECTURE.md` | System architecture, data flow, module map |
| `DESIGN_SYSTEM.md` | Current design tokens and component inventory |
| `UI_RULES.md` | UI implementation rules |
| `UX_RULES.md` | User experience rules |
| `SEO_ENGINEERING.md` | SEO implementation audit |
| `SECURITY.md` | Security audit findings |
| `APPLE_REVIEW.md` | iOS App Store compliance audit |
| `ROADMAP.md` | Development roadmap |
| `BRAND_IDENTITY.md` | Brand identity audit |
| `PERMISSIONS.md` | Role-based access control map |
| `API_STANDARDS.md` | API contract standards |
| `DATABASE.md` | Database schema and model audit |

---

## 8. Audit Completion Status

- [x] Repository structure mapped
- [x] Stack identified
- [x] Security issues catalogued
- [x] Architecture issues catalogued
- [x] All docs created
- [ ] Awaiting next instruction
