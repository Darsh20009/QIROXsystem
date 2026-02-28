# Qirox Platform

## Overview

Qirox is a SaaS "Systems Factory" platform (qirox.tech) that showcases 8 industry-specific website templates and provides admin management for templates and pricing. The platform targets Arabic-speaking markets (Saudi Arabia, Egypt) with RTL UI, positioning itself as a "Website Infrastructure Automation Platform" for investors and clients.

The application is a full-stack TypeScript project with a React frontend and Express backend. It includes:
- **Public Pages**: Home (8 sectors showcase), Portfolio (filtering by category), Pricing (3 tiers), About (investor-focused company profile), Contact
- **Admin Pages**: Templates CRUD management, Pricing management, Services, Orders, Finance, Employees
- **Client Pages**: Dashboard, Project tracking, Order flow
- **Authentication**: Session-based with role-based access control

## Latest Changes (Feb 28, 2026 - Session 12)

### Employee Hiring System + Role-Based Dashboards
- **AdminJobs.tsx** — Fully rewritten with hire-as-employee dialog. Shows applicant email + phone prominently. Accepted applicants get "تعيين كموظف" button that opens dialog with username + role selection. Auto-generates password and emails credentials.
- **Backend: `POST /api/admin/applications/:id/hire`** — Creates user account, hashes password, sends `sendWelcomeWithCredentialsEmail`, marks application as accepted.
- **EmployeeRoleDashboard.tsx** (NEW) — Role-specific dashboards:
  - `merchant`: Delivery task pipeline (pending → in_progress → completed) with action buttons
  - `developer`/`designer`: Modification requests queue + checklist link
  - `accountant`: ERP view (revenue, pending invoices, paid/unpaid counts, receipts)
  - `sales`/`sales_manager`: Marketing tools hub + customers + new order links
- **SalesMarketing.tsx** (NEW) — Marketing tools page: Canva template links (6 sizes), QIROX gradient templates (4), poster upload/manage gallery (with preview, download, delete), platform filtering.
- **Backend Marketing API**: `GET/POST/DELETE /api/marketing/posts` using MongoDB `MarketingPostModel`. Accessible to admin/manager/sales roles.
- **App.tsx** — Added routes: `/employee/role-dashboard`, `/sales/marketing`
- **app-sidebar.tsx** — Added "لوحتي المتخصصة" (role-specific nav, visible to merchant/developer/designer/accountant/sales roles), "أدوات التسويق" (visible to sales roles). Added `Palette` icon import.

## Latest Changes (Feb 26, 2026 - Session 11)

### New Features & Bug Fixes
- **Contact Form**: Fully connected to backend — `POST /api/contact` sends email to `info@qirox.tech` via SMTP2GO with sender details. Success/error states with animated feedback.
- **Cart Checkout**: Now creates a real order via `POST /api/orders` (instead of just UI simulation). Cart is cleared after successful order. Loading state on button.
- **Join Us Page (JoinUs.tsx)**: Completely rebuilt from stub — hero section, 4 perks cards, list of open jobs from API, job application dialog with form (name, email, phone, resume URL, cover letter), open application banner. `POST /api/apply` creates application in DB and emails HR team.
- **Backend: Missing Routes Added**:
  - `POST /api/contact` — Public contact form email sender
  - `POST /api/apply` — Public job application submission
  - `DELETE /api/projects/:projectId/tasks/:taskId` — Delete a task
  - `DELETE /api/projects/:projectId/vault/:vaultId` — Delete a vault item
  - `DELETE /api/projects/:projectId/members/:memberId` — Remove project member
  - `POST /api/admin/projects` — Admin creates project from scratch
- **ProjectDetails**: Added delete buttons (Trash2) for tasks and vault items (only visible to non-client roles). Hover-to-show on task rows.
- **Dark Mode CSS**: Added `.dark` variants for all component classes (`.glass`, `.glass-strong`, `.glass-card`, `.section-dark`, `.section-darker`, etc.) in `index.css`.
- **Home.tsx**: Full dark mode pass — all sections (hero, stats, pathfinder, carousel, services, why) now have `dark:` Tailwind variants.

## Latest Changes (Feb 26, 2026 - Session 10)

- **Dark Mode**: Added `.dark` CSS variable block in `index.css` with full sidebar/card/border theming. `tailwind.config.ts` already had `darkMode: ["class"]`. `ThemeProvider` in `lib/theme.tsx` manages localStorage + `document.documentElement.classList`.
- **Header Upgraded**: `App.tsx` now has a sticky header with dark mode toggle (🌙/☀️), language toggle (AR/EN), and a global search bar for orders/projects (shows results dropdown, min 2 chars).
- **New Pages Wired in App.tsx**: AdminAnalytics `/admin/analytics`, AdminActivityLog `/admin/activity-log`, AdminSupportTickets `/admin/support-tickets`, AdminPayroll `/admin/payroll`, SupportTickets `/support`, EmployeeProfile `/employee/profile`, PaymentHistory `/payment-history`.
- **Sidebar Updated**: New links added — Analytics, ActivityLog, SupportTickets, Payroll (admin), Payroll (finance role), EmployeeProfile (employee), SupportTickets + PaymentHistory (client).
- **Architecture Fix**: `QueryClientProvider` moved to top-level `App()` function so `useUser()` and `useWebSocket()` can be called inside `AppInner` without provider errors.
- **WebSocket**: `useWebSocket(user?.id)` hooked into `AppInner` — auto-connects to `/ws` and sends `{ type: "auth", userId }`.

## Latest Changes (Feb 26, 2026 - Session 9)

- **Email System Overhaul**: Full automatic email notifications via SMTP2GO (`noreply@qiroxstudio.online`).
  - Logo URL: GitHub raw (`https://raw.githubusercontent.com/Darsh20009/QIROXsystem/main/client/public/logo.png`) — works in all email clients
  - Auto emails triggered: welcome (new user), OTP (password reset), order confirmed, order status change, project status/progress update (→ client), task assigned (→ employee), task completed (→ client)
  - Admin direct email panel in Dashboard with form and test buttons for all 7 email types
  - New APIs: `POST /api/admin/send-email` (direct), `GET /api/admin/email-recipients`, `POST /api/admin/test-email`
  - Env vars: `SMTP2GO_API_KEY`, `SMTP2GO_SENDER` (noreply@qiroxstudio.online), `SMTP2GO_SENDER_NAME`, `EMAIL_LOGO_URL`, `EMAIL_SITE_URL`
- **Render Deployment Fix**: Changed build command to `npm ci && npm run build` (fixes ENOTEMPTY npm cache bug). Added `render.yaml` with all required env vars. Added `.npmrc` with `prefer-offline=false`.

## Render Deployment Requirements

Set these env vars manually in Render dashboard (they are marked `sync: false` in render.yaml):
- `MONGODB_URI` — MongoDB Atlas connection string
- `SMTP2GO_API_KEY` — `api-5CC7EFCFDA564ABAA365F3C7660DD332`
- `SESSION_SECRET` — any long random string

These are pre-set in render.yaml and don't need manual entry:
- `NODE_ENV=production`
- `SMTP2GO_SENDER=noreply@qiroxstudio.online`
- `SMTP2GO_SENDER_NAME=Qirox`
- `EMAIL_LOGO_URL=https://raw.githubusercontent.com/Darsh20009/QIROXsystem/main/client/public/logo.png`
- `EMAIL_SITE_URL=https://qiroxstudio.online`

## Latest Changes (Feb 25, 2026 - Session 8)

- **OTP / Forgot Password Flow**: Full 3-step recovery page (`/forgot-password`): email → 6-digit OTP verification → new password reset → done. Backend routes: `POST /api/auth/forgot-password` (sends OTP via SMTP2GO), `POST /api/auth/verify-otp`, `POST /api/auth/reset-password`. OTPs expire in 10 minutes, invalidated on use.
- **Login Page**: Added "نسيت كلمة المرور؟" link next to password label, linking to `/forgot-password`.
- **Notifications System**: `NotificationBell` component in sidebar header — shows unread badge count, dropdown with list, mark-as-read per item and "قراءة الكل". Backend: `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`. Notifications auto-created when: order placed (client), order status changes (client).
- **Inbox Messaging**: Full `Inbox` page (`/inbox`) with contacts sidebar + real-time chat thread. Auto-refreshes every 5s. Backend: `GET /api/inbox`, `GET /api/inbox/unread-count`, `GET /api/inbox/thread/:userId`, `POST /api/inbox`. Sends email notification + in-app notification to recipient.
- **Invoices & Finance API**: `GET /api/invoices`, `POST /api/invoices`, `PATCH /api/invoices/:id`, `GET /api/admin/finance/summary` (totalRevenue, monthRevenue, unpaidTotal, totalOrders, activeClients).
- **Email Triggers**: Order confirmation email fires on new order; order status update email fires when admin changes status. Both also create in-app notifications.
- **Sidebar**: Added "الرسائل" link for client and employee sections; `NotificationBell` shown in header when user is logged in.
- **Auth security**: Exported `hashPassword` from `auth.ts` for clean reuse in reset-password route (instead of reinvoking setupAuth).

## Latest Changes (Feb 25, 2026 - Session 7)

- **Employee Specs Sheet Expanded**: `specsForm` now has 30+ fields in 6 organized sections: 1) معلومات المشروع (name, email, budget, paid, dates, hours, status) — black card, 2) البنية التقنية (stack, framework, language, DB, hosting), 3) Infrastructure (GitHub, DB URI, server IP, credentials, staging/production URLs, SSL/CDN checkboxes), 4) Env Variables (monospace textarea), 5) Project Concept (idea, audience, features, references, color palette), 6) Notes (public + internal team notes). Sheet widened to `max-w-3xl`. Save button is sticky at bottom.
- **Client Project File Sheet**: Client "المواصفات" now opens a `Sheet` (max-w-2xl) instead of a Dialog. Shows organized sections: black card (name, status, budget, dates), tech tags, clickable URLs (GitHub/staging/production/domain), project concept, notes. Hides sensitive fields (passwords, team notes, server IP, DB URI).
- **Cart Page Redesign**: Full redesign of `/cart`. New layout: 2-col (items + right summary). Cart items: cleaner row design with icon, type badge, qty control (hidden for services), price, remove. Add-ons section: shows starting price upfront. Right summary panel: black header with total, line-by-line breakdown, coupon, checkout button. Checkout replaces toast with full success screen showing order confirmation, items, and "سيتواصل فريقنا" message. All add-on dialogs redesigned with selected=black style.

## Latest Changes (Feb 25, 2026 - Session 6)

- **Services Page - Full Flow**: Rebuilt to 3-step flow (1. pick service → 2. add products → 3. checkout). Services displayed as card grid (not expandable rows). Clicking a service opens a full detail panel below with: features/customization section, linked admin products, gifts, MongoDB Atlas tiers (M0→M30), AWS EC2 tiers (t3.micro→c5.xlarge), domain products from admin, email products from admin (with fallback email plans). All items have "أضف للسلة" buttons.
- **Client Dashboard - Creative Redesign**: New avatar-based top bar with greeting, date, role. Animated stats cards with gradient icons. Investment banner (black, shows total spent + active services). Projects with 4-phase progress indicator (التصميم/التطوير/الاختبار/التسليم). Quick actions grid (تصفح الخدمات/الأجهزة/طلب تعديل). Orders as timeline. Mod requests as compact cards. Final CTA band.
- **Employee Specs Form Enhanced**: Added "فكرة المشروع" (project concept textarea) and "المتغيرات والإعدادات" (variables in KEY=VALUE format) to existing specs dialog. All 7 fields: techStack, database, hosting, domain, projectConcept, variables, notes.
- **Cart Route Added**: `/cart` now properly serves the full cart page for logged-in users.
- **Devices Page**: Beautiful product grid with category pills, search, featured section, and add-to-cart. Products come from admin (`/api/products`).

## Latest Changes (Feb 25, 2026 - Session 5)

- **Admin Credentials Updated**: `admin_qirox`/`admin13579` → `qadmin`/`qadmin`. Auto-migration on server start updates existing DB records. AdminCredentialsCard updated to match.
- **Services Seeding Fixed**: Changed from destructive reseed (deleting all services) to safe seed only when `existingServices.length === 0` — preserves user-added services.
- **New Routes in App.tsx**: Added `/devices` (public), `/cart` (authenticated), `/admin/products` (admin-only).
- **Sidebar Updated**: Clients now see "الأجهزة والإضافات" and "سلة التسوق" links. Management sees "المنتجات والأجهزة" admin link.
- **Services Page Rebuilt**: New expandable card design with category filter pills, hero, features list by category (stores get storeFeatures, restaurants get restaurantFeatures, customizable categories show "custom" message), add-to-cart for logged-in users, related products display.
- **Employee Specs Form**: Added "مواصفات" button on each order row in EmployeeDashboard. Opens a dialog with fields: techStack, database (select), hosting (select), domain, notes. Saves to `/api/admin/orders/:id/specs`.

## Recent Changes (Feb 2026)

- **AUTH UI LUXURY REDESIGN + PHONE/COUNTRY INPUTS**:
  - `Login.tsx`: Full luxury redesign — split screen (black decorative panel with stats + white form). Added eye toggle for password, icons in inputs, business type dropdown, show/hide confirm password
  - `Register.tsx` (same file): Phone input with country dial code + emoji flag selector (`CountryPhoneInput.tsx`). Country dropdown with search (`CountrySelect.tsx`). Business type now dropdown (not text). Shows `منصتك الرقمية تبدأ من هنا` on black panel
  - `ForgotPassword.tsx`: Full luxury redesign — split screen, 3-step OTP flow with animated boxes (filled = black/white). Password strength indicator. Paste OTP from clipboard. Better error messages on wrong OTP. Dev-only fetch-OTP button for testing
  - New components: `client/src/components/CountryPhoneInput.tsx` (28 countries with flags + dial codes, searchable), `client/src/components/CountrySelect.tsx` (searchable country list)
  - **Email/OTP status**: SMTP2GO is configured and sending correctly — OTP codes are logged in server console. If emails go to spam, user should whitelist the domain. Dev mode has "عرض الرمز (وضع التطوير فقط)" button

- **PACKAGES & OFFERS SYSTEM (Professional)**: Full redesign of pricing and offers:
  - `Prices.tsx`: Rebuilt with trust badges, billing-cycle filter toggle (all/one-time/monthly/yearly), animated plan cards with discount %, offer badges, "what's included" section, domain pricing with savings display, and a black CTA footer
  - `AdminTemplates.tsx`: Added full `PlanForm` component with: offer label, original price + auto-calculated discount %, per-line features editor, isPopular/isCustom toggles (Switch), billing cycle selector, sortOrder; plan cards now show discount badge; edit button on each plan now works
  - `Dashboard.tsx` (client view): Added "الباقات والعروض المتاحة" section showing up to 3 plans with offer banners, popular badge, discount %, features preview, and "اختر الباقة" CTA; enterprise plan shown separately with contact button

- **COMPLETE UI/UX REDESIGN**: Converted entire frontend from dark theme (bg-[#0A0A0F], cyan accents) to light theme (white background, black/gray color scheme). Affected: index.css, all components (Navigation, Footer, Sidebar, Splash), and all pages (Home, Services, Portfolio, Prices, Login, About, Contact, OrderFlow, Admin pages).
  - Design tokens: bg-white, text-black, borders: black/[0.06], accents: gray-400, premium buttons: bg-black text-white
  - Navigation: transparent → glass-strong on scroll, active indicator with layoutId animation
  - Splash screen: typewriter effect with black/gray on white, minimal animations
  - Cards: white bg with subtle borders and hover shadows instead of dark glass
  - CTA sections: bg-black with white text (inverted from main)
- **DASHBOARD REDESIGN**: Creative client dashboard with animated stat cards, progress bars, order timeline with status icons, investment summary, and CTA section
- **EMPLOYEE MANAGEMENT**: Full CRUD AdminEmployees page with add/edit/delete, role selection, search, role filtering. Backend: POST/PATCH/DELETE /api/admin/users with input validation, role whitelisting, admin protection
- **SEO**: Comprehensive meta tags, OG tags, Twitter cards, JSON-LD structured data, canonical URL qiroxstudio.online
- **PWA**: Updated manifest.json with orientation "any" (portrait+landscape), proper theme colors for light theme
- **DEPLOYMENT**: Configured autoscale deployment with build + run commands, fixed session cookies for production
- Added SectorTemplate and PricingPlan MongoDB models with 8 seeded industry templates
- Built Portfolio page with category filtering and sector cards
- Built Pricing page with 3 plans (Starter 5K, Business 15K, Enterprise 40K SAR)
- Built Admin Templates page with CRUD operations and pricing management tabs
- Enhanced Home page with dynamic 8-sector showcase from database + 4 main service paths section (restaurants, stores, education, institutions)
- Updated Navigation with Portfolio, Prices, About links
- Built AdminServices page with full CRUD (create/edit/delete) using simple state management
- Built AdminOrders page with order management, quick approve/reject, status updates, and detail view
- Integrated PayPal payment (server/paypal.ts with lazy SDK initialization, client/src/components/PayPalButton.tsx)
- PayPal routes: GET /paypal/setup, POST /paypal/order, POST /paypal/order/:orderID/capture
- Replaced splash screen and system icons with actual QIROX logo (attached_assets/QIROX_LOGO_1771674917456.png)
- Updated Sidebar with admin templates management link
- Enhanced About page with investor-focused content (tech stack, business model, sectors)
- **SECURITY**: Removed all GitHub repository URLs from seed data, schema, models, and frontend (8 template references stripped)
- **i18n**: Created full bilingual (Arabic/English) translation system (`client/src/lib/i18n.tsx`) with 100+ keys
- **i18n**: Integrated i18n across Navigation, Services, OrderFlow, Login, Footer, Portfolio, Sidebar pages
- **i18n**: Language toggle button in navigation and admin header with localStorage persistence
- **Fix**: Changed order creation route from Drizzle-validated path to direct `/api/orders` for MongoDB string ObjectID compatibility
- **Fix**: MongoDB migration to strip repoUrl from existing template documents
- **Upload**: Added file upload system (multer) with POST /api/upload and /api/upload/multiple endpoints
- **Upload**: OrderFlow Step 3 now uses real file uploads (logo, brand identity, content, images, video) instead of URL text fields
- **Upload**: Bank transfer receipt (Step 4) also uses file upload; uploaded files stored in `uploads/` directory
- **Upload**: Files payload saved as `files` field in order documents (Mixed type in Mongoose)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack React Query for server state; no global client state library
- **UI Components**: Shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS with CSS custom properties for theming, PostCSS with autoprefixer
- **Animations**: Framer Motion
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Icons**: Lucide React
- **Fonts**: Cairo (headings) and IBM Plex Sans Arabic (body text) — Arabic-first typography
- **RTL Support**: HTML dir="rtl", CSS direction: rtl on body, space-x-reverse utilities
- **PWA**: Basic manifest.json and install prompt component for add-to-homescreen

### Backend Architecture
- **Framework**: Express 5 on Node.js with TypeScript (run via tsx in dev, esbuild bundle for production)
- **API Pattern**: REST API under `/api/*` prefix, with typed route definitions in `shared/routes.ts`
- **Authentication**: Passport.js with Local Strategy, express-session with memorystore, scrypt password hashing
- **Storage Layer**: Repository pattern via `IStorage` interface in `server/storage.ts`, implemented as `MongoStorage` using Mongoose
- **Build**: Custom build script (`script/build.ts`) that uses Vite for client and esbuild for server, outputting to `dist/`

### Shared Code (`shared/` directory)
- **Schema** (`shared/schema.ts`): TypeScript interfaces for MongoDB types (SectorTemplate, PricingPlan) + Drizzle/Zod schemas for legacy PostgreSQL types. Browser-safe.
- **Routes** (`shared/routes.ts`): Typed API route definitions with paths, methods, input schemas, and response schemas.

### Server-Only Code
- **Models** (`server/models.ts`): Mongoose model definitions. These must NOT be imported by frontend code.

### Database
- **Primary Database**: MongoDB via Mongoose
- **Connection**: Configured via `MONGODB_URI` environment variable
- **Collections**: users, services, orders, projects, tasks, messages, sectortemplates, pricingplans
- **Key Models**:
  - SectorTemplate: 8 industry templates (quran-academy, education-platform, exam-system, fitness-platform, resume-cv, charity-ngo, ecommerce-store, cafe-restaurant)
  - PricingPlan: 3 tiers (starter, business, enterprise)
- **Key Relationships**: Users have orders -> orders create projects -> projects have tasks and messages. Users have roles (client, admin, employee types).

### API Endpoints
- **Templates**: GET `/api/templates`, GET `/api/templates/:id`
- **Pricing**: GET `/api/pricing`
- **Admin Templates**: POST/PATCH/DELETE `/api/admin/templates/:id`
- **Admin Pricing**: POST/PATCH/DELETE `/api/admin/pricing/:id`
- **Auth**: POST `/api/register`, POST `/api/login`, POST `/api/logout`, GET `/api/user`

### Authentication & Authorization
- Session-based auth with express-session and memorystore
- Role-based access: roles defined on the user model (client, admin, various employee types)
- Admin routes require authentication and non-client role

### Development Setup
- **Dev server**: Vite dev server proxied through Express with HMR via WebSocket at `/vite-hmr`
- **Production**: Static files served from `dist/public`, server bundle at `dist/index.cjs`
- **Path aliases**: `@/` -> `client/src/`, `@shared/` -> `shared/`, `@assets/` -> `attached_assets/`
- **Environment variables needed**: `MONGODB_URI` (required for database)

### Key Design Decisions

1. **Monorepo with shared types**: The `shared/` directory contains TypeScript interfaces and Zod schemas, ensuring type safety across the full stack.

2. **Mongoose models separated from shared types**: Mongoose models live in `server/models.ts` (server-only) while types/interfaces live in `shared/schema.ts` (browser-safe).

3. **Repository pattern**: The `IStorage` interface abstracts database operations.

4. **Arabic-first UI**: RTL layout is the default. Fonts, colors, and copy are designed for Arabic-speaking markets. Brand colors: Deep Blue (#0f172a) and Electric Cyan (#06b6d4).

5. **Session-based auth**: Server-side session management with memorystore.

6. **Modular architecture concept**: Each template is built on Core + Modules pattern for extensibility.

## External Dependencies

### Required Services
- **MongoDB**: Primary database. Must be provisioned and `MONGODB_URI` env var set.
- **PayPal**: Optional. Requires `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` secrets. Server gracefully degrades if not set (returns 503 on PayPal routes).

### Key npm Packages
- **mongoose**: ODM for MongoDB
- **express** (v5): HTTP server framework
- **passport** + **passport-local**: Authentication
- **memorystore**: Session store
- **@tanstack/react-query**: Server state management on the client
- **react-hook-form** + **zod**: Form handling and validation
- **framer-motion**: Animations
- **recharts**: Dashboard analytics charts
- **wouter**: Client-side routing
- **shadcn/ui components**: Full suite of Radix-based UI components
- **tailwindcss**: Utility-first CSS framework
- **date-fns**: Date formatting (Arabic locale support)

### Replit-Specific Plugins
- `@replit/vite-plugin-runtime-error-modal`: Error overlay in development
- `@replit/vite-plugin-cartographer`: Dev tooling (dev only)
- `@replit/vite-plugin-dev-banner`: Dev banner (dev only)
