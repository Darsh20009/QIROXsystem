# PROJECT_STRUCTURE.md — QIROX V4 Master Folder Structure

> **Mode:** Blueprint only. No code modified.
> **Date:** 2026-07-08

---

## 1. Design Principles

- **Monorepo** — one repository, multiple logical packages sharing types and tooling
- **Domain-first** — folders named by business domain, not by file type
- **Colocate by feature** — route, service, schema, and test live together
- **No barrel-of-everything** — no single 16,000-line files; each file has one purpose
- **Shared package boundary** — `shared/` is the only cross-boundary import allowed

---

## 2. Target V4 Root Structure

```
qirox/
├── client/                          # React 18 frontend (Vite)
│   ├── public/                      # Static assets (favicons, og-cover, llms.txt, sitemap.xml)
│   │   ├── qirox-icon.png
│   │   ├── qirox-icon-nobg.png
│   │   ├── qirox-loader-logo.png
│   │   ├── og-cover.png
│   │   ├── sitemap.xml              # Static public URLs (dynamic sitemap via server)
│   │   ├── robots.txt
│   │   └── llms.txt
│   └── src/
│       ├── main.tsx                 # App entry point
│       ├── App.tsx                  # Router root
│       ├── index.css                # Tailwind directives + CSS variables
│       │
│       ├── design-system/           # Design tokens & component library
│       │   ├── tokens.css           # All CSS custom properties (colors, spacing, radius)
│       │   ├── fonts.css            # Font declarations
│       │   └── components/          # Shadcn/ui extended components
│       │       └── ui/              # Base primitives
│       │
│       ├── layout/                  # Layout shells (one per portal)
│       │   ├── PublicLayout.tsx
│       │   ├── AdminLayout.tsx
│       │   ├── EmployeeLayout.tsx
│       │   ├── ClientLayout.tsx
│       │   ├── MerchantLayout.tsx
│       │   ├── InvestorLayout.tsx
│       │   ├── SupplierLayout.tsx
│       │   └── CloudLayout.tsx      # DeploymentCloud standalone
│       │
│       ├── features/                # Feature modules (domain-first)
│       │   ├── auth/
│       │   │   ├── LoginPage.tsx
│       │   │   ├── RegisterPage.tsx
│       │   │   ├── ForgotPasswordPage.tsx
│       │   │   ├── TwoFactorSetupPage.tsx
│       │   │   ├── PhoneVerifyPage.tsx
│       │   │   ├── QiroxAuthenticator.tsx
│       │   │   └── hooks/
│       │   │       └── use-auth.ts
│       │   │
│       │   ├── admin/
│       │   │   ├── analytics/
│       │   │   ├── employees/
│       │   │   ├── finance/
│       │   │   ├── orders/
│       │   │   ├── products/
│       │   │   ├── settings/
│       │   │   ├── crm/
│       │   │   ├── marketing/
│       │   │   ├── content/          # News, partners, jobs
│       │   │   └── system/           # Cron, Atlas, connection settings
│       │   │
│       │   ├── client/
│       │   │   ├── dashboard/
│       │   │   ├── orders/
│       │   │   ├── invoices/
│       │   │   ├── installments/
│       │   │   ├── wallet/
│       │   │   ├── loyalty/
│       │   │   ├── referral/
│       │   │   ├── contracts/
│       │   │   ├── support/
│       │   │   ├── shipments/
│       │   │   └── profile/
│       │   │
│       │   ├── employee/
│       │   │   ├── dashboard/
│       │   │   ├── projects/
│       │   │   ├── crm/
│       │   │   ├── attendance/
│       │   │   ├── finance/
│       │   │   ├── mail/
│       │   │   ├── whatsapp-crm/
│       │   │   └── ai/
│       │   │
│       │   ├── ai/
│       │   │   ├── QiroxStudio.tsx
│       │   │   ├── DocumentComposer.tsx
│       │   │   └── hooks/
│       │   │       └── use-ai-stream.ts
│       │   │
│       │   ├── sandbox/
│       │   │   ├── SystemBuilderIDE.tsx
│       │   │   ├── SystemBuilder.tsx
│       │   │   └── BarcodeStudio.tsx
│       │   │
│       │   ├── qmeet/
│       │   │   ├── MeetingRoom.tsx
│       │   │   ├── ClientQMeet.tsx
│       │   │   └── QMeetJoinByCode.tsx
│       │   │
│       │   ├── deployment/
│       │   │   └── DeploymentCloud.tsx
│       │   │
│       │   ├── store/
│       │   │   ├── EcommerceStore.tsx
│       │   │   ├── Cart.tsx
│       │   │   ├── Checkout.tsx
│       │   │   └── CartWizardPage.tsx
│       │   │
│       │   └── public/               # Public-facing marketing pages
│       │       ├── Home.tsx
│       │       ├── About.tsx
│       │       ├── Prices.tsx
│       │       ├── Systems.tsx
│       │       ├── News.tsx
│       │       ├── Partners.tsx
│       │       ├── Jobs.tsx
│       │       ├── Contact.tsx
│       │       └── Terms.tsx
│       │
│       ├── components/              # Shared cross-feature components
│       │   ├── Navigation.tsx
│       │   ├── Footer.tsx
│       │   ├── NotificationBell.tsx
│       │   ├── UserAvatar.tsx
│       │   ├── ImageUpload.tsx
│       │   ├── PayPalButton.tsx
│       │   ├── PixelTracking.tsx
│       │   ├── RoleGuard.tsx
│       │   ├── MobileBottomNav.tsx
│       │   └── GlobalNotificationBanner.tsx
│       │
│       ├── hooks/                   # Shared React hooks
│       │   ├── use-auth.ts
│       │   ├── use-currency.ts
│       │   ├── use-seo.ts
│       │   ├── use-websocket.ts
│       │   ├── use-biometric.ts
│       │   └── use-push-notifications.ts
│       │
│       └── lib/                     # Utilities and config
│           ├── i18n.tsx
│           ├── query-client.ts
│           ├── api-client.ts
│           └── capacitor-init.ts
│
├── server/                          # Express 5 backend (TypeScript)
│   ├── index.ts                     # App bootstrap (middleware, server start)
│   ├── db.ts                        # MongoDB connection
│   ├── cache.ts                     # In-memory cache
│   ├── ws.ts                        # WebSocket hub
│   ├── push.ts                      # Web push sender
│   ├── cron.ts                      # Scheduled jobs registry
│   ├── logger.ts                    # Structured logger (to replace console.log)
│   │
│   ├── auth/
│   │   ├── index.ts                 # Passport setup, session config
│   │   ├── strategies/
│   │   │   ├── local.ts
│   │   │   ├── google.ts
│   │   │   ├── github.ts
│   │   │   └── apple.ts
│   │   ├── middleware.ts            # requireAuth, requireRole factories
│   │   └── webauthn.ts             # Passkey / biometric auth
│   │
│   ├── models/                      # One file per domain model
│   │   ├── user.model.ts
│   │   ├── order.model.ts
│   │   ├── project.model.ts
│   │   ├── task.model.ts
│   │   ├── invoice.model.ts
│   │   ├── installment.model.ts
│   │   ├── wallet.model.ts
│   │   ├── loyalty.model.ts
│   │   ├── attendance.model.ts
│   │   ├── employee-profile.model.ts
│   │   ├── payroll.model.ts
│   │   ├── notification.model.ts
│   │   ├── support-ticket.model.ts
│   │   ├── contract.model.ts
│   │   ├── lead.model.ts
│   │   ├── news.model.ts
│   │   ├── job.model.ts
│   │   ├── product.model.ts
│   │   ├── shipment.model.ts
│   │   ├── ai-session.model.ts
│   │   ├── sandbox-project.model.ts
│   │   ├── deployment.model.ts
│   │   ├── pixel-event.model.ts
│   │   ├── system-settings.model.ts
│   │   └── index.ts                 # Re-exports all models
│   │
│   ├── routes/                      # Split from 16,975-line monolith
│   │   ├── index.ts                 # Registers all route modules
│   │   ├── auth.routes.ts
│   │   ├── public.routes.ts
│   │   ├── admin/
│   │   │   ├── users.routes.ts
│   │   │   ├── finance.routes.ts
│   │   │   ├── orders.routes.ts
│   │   │   ├── analytics.routes.ts
│   │   │   ├── settings.routes.ts
│   │   │   ├── content.routes.ts
│   │   │   └── system.routes.ts
│   │   ├── client/
│   │   │   ├── orders.routes.ts
│   │   │   ├── wallet.routes.ts
│   │   │   ├── support.routes.ts
│   │   │   └── profile.routes.ts
│   │   ├── employee/
│   │   │   ├── projects.routes.ts
│   │   │   ├── crm.routes.ts
│   │   │   ├── attendance.routes.ts
│   │   │   └── finance.routes.ts
│   │   ├── ai.routes.ts
│   │   ├── sandbox.routes.ts
│   │   ├── payments.routes.ts
│   │   └── webhooks.routes.ts
│   │
│   ├── services/                    # Business logic (no HTTP concerns)
│   │   ├── email.service.ts
│   │   ├── email-marketing.service.ts
│   │   ├── pdf.service.ts
│   │   ├── paypal.service.ts
│   │   ├── push.service.ts
│   │   ├── ai.service.ts
│   │   ├── storage.service.ts       # IStorage interface
│   │   ├── connection-manager.ts
│   │   └── cpanel.service.ts
│   │
│   ├── middleware/                  # Express middleware
│   │   ├── rate-limit.ts
│   │   ├── validate.ts              # Zod validation factory
│   │   ├── error-handler.ts         # Centralized error handler
│   │   └── security.ts             # Helmet, CSRF, CORS config
│   │
│   ├── qmeet/
│   │   ├── qmeet.routes.ts
│   │   ├── qmeet.db.ts
│   │   └── qmeet.scheduler.ts
│   │
│   └── deployment-cloud/
│       ├── deployment.routes.ts
│       └── github-oauth.ts
│
├── shared/                          # Zero-dependency types shared by client + server
│   ├── schema.ts                    # Zod schemas + TypeScript types
│   ├── routes.ts                    # API route constants
│   └── constants.ts                 # Shared enums (roles, statuses, etc.)
│
├── docs/                            # This documentation system
│   ├── MASTER_BLUEPRINT.md
│   ├── PROJECT_STRUCTURE.md         ← this file
│   ├── SYSTEM_MAP.md
│   ├── FEATURE_INVENTORY.md
│   ├── PAGE_INVENTORY.md
│   ├── COMPONENT_INVENTORY.md
│   ├── DATABASE_BLUEPRINT.md
│   ├── API_BLUEPRINT.md
│   ├── RBAC_DESIGN.md
│   ├── MAIL_ARCHITECTURE.md
│   ├── QMEET_ARCHITECTURE.md
│   ├── SEO_ENGINEERING_PLAN.md
│   ├── MOBILE_ARCHITECTURE.md
│   ├── BRAND_BLUEPRINT.md
│   ├── EXECUTION_PLAN.md
│   ├── ARCHITECTURE.md
│   ├── SECURITY.md
│   ├── DATABASE.md
│   ├── API_STANDARDS.md
│   ├── PERMISSIONS.md
│   ├── DESIGN_SYSTEM.md
│   ├── UI_RULES.md
│   ├── UX_RULES.md
│   ├── SEO_ENGINEERING.md
│   ├── APPLE_REVIEW.md
│   ├── BRAND_IDENTITY.md
│   └── ROADMAP.md
│
├── tests/                           # All tests
│   ├── unit/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/
│   │   ├── auth/
│   │   ├── payments/
│   │   └── ai/
│   └── e2e/
│       ├── public/
│       ├── client-portal/
│       └── admin/
│
├── scripts/                         # Build and maintenance scripts
│   ├── build.ts
│   ├── migrate-routes.ts            # Route migration helper
│   ├── seed.ts
│   ├── audit-env.ts                 # Startup env validation
│   └── clean-git-history.sh
│
├── ios/                             # Capacitor iOS native project
├── android-twa/                     # Android TWA
├── public/                          # Server-served static (cafe-demo, etc.)
├── uploads/                         # User uploads (migrate to object storage)
├── sandbox-projects/                # Sandbox IDE projects
├── attached_assets/                 # Internal assets (not served)
│
├── capacitor.config.json
├── codemagic.yaml
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
├── render.yaml
└── replit.md
```

---

## 3. Migration Path from Current Structure

| Current | Target V4 | Action |
|---|---|---|
| `server/routes.ts` (16,975 lines) | `server/routes/` (20+ files) | Split by domain |
| `server/models.ts` (2,339 lines) | `server/models/` (25+ files) | Split by model |
| `server/auth.ts` | `server/auth/index.ts` + `strategies/` | Modularize |
| `server/ai.ts` (3,535 lines) | `server/services/ai.service.ts` | Extract service layer |
| `client/src/pages/` (166 files flat) | `client/src/features/` (domain folders) | Reorganize |
| `client/src/components/` (202 flat) | `components/` + `features/*/components/` | Colocate feature components |

---

## 4. File Size Targets

| File | Current | Target |
|---|---|---|
| Any single route file | 16,975 lines | < 400 lines |
| Any single model file | 2,339 lines | < 150 lines |
| Any single page component | Unaudited | < 500 lines |
| Any single feature component | Unaudited | < 300 lines |
| Any single service | 3,535 lines | < 600 lines |
