## Overview

QIROX Cafe is a comprehensive digital management system for coffee shops. It has two portals:

## ⚡ Master Brand Configuration

**File:** `client/src/lib/brand.ts`

This is the **single source of truth** for ALL branding across the entire system. To rebrand the system, only this one file needs to be changed:

- `brand.nameEn` / `brand.nameAr` — System name (English + Arabic)
- `brand.shortNameEn` / `brand.shortNameAr` — Short name for tight spaces
- `brand.platformNameEn` / `brand.platformNameAr` — Staff/admin portal name
- `brand.taglineEn` / `brand.taglineAr` — Tagline shown under logo
- `brand.logoCustomer` — Customer-facing logo path (`/logo.png`)
- `brand.logoStaff` — Staff/employee portal logo path (`/employee-logo.png`)
- `brand.colors.primary` — Primary brand color (HSL values, auto-applied to CSS at startup)
- `brand.colors.accent` / `brand.colors.background` — Accent & background colors
- `brand.themeColor` — PWA/browser theme color (hex)
- `brand.website` / `brand.social` — Contact & social links
- `brand.pointsBrandEn` / `brand.pointsBrandAr` — Loyalty points program name
- `brand.cardBrandEn` / `brand.cardBrandAr` — Loyalty card name
- `brand.aiAssistantNameAr` — AI assistant name shown in the AI modal

**How it works:** `applyBrandColors()` is called in `main.tsx` and injects CSS custom properties from `brand.colors` at runtime, ensuring color changes in `brand.ts` instantly affect the entire UI without touching CSS files.

**Files connected to brand.ts:** admin-sidebar, employee-sidebar, customer-footer, receipt-print, tax-invoice-print, loyalty-card, global-prompts, CardCarousel, receipt-invoice, payment-methods, simulated-card-payment, table-qr-card, AIMenuAssistant, export-utils.

**Note for server-side branding** (email templates in `server/mail-service.ts`): These contain hardcoded brand strings that should be manually kept in sync with `brand.ts` values.

## New Features (Session T001–T006)

### Foodics-Parity Additions
- **T001 – POS Keyboard Shortcuts**: `/` focuses search, `F2` clears search, `Escape` clears cart, `Ctrl+F` focuses search, `Ctrl+P` prints receipt
- **T002 – Gift Card in Checkout**: `/kiosk`-capable public endpoint `POST /api/gift-cards/:code/redeem-customer`; checkout.tsx has full gift card section: validate → show balance → deduct from total → redeem after order → display in summary and confirm dialog
- **T003 – Kiosk Mode** (`/kiosk`): Full-screen self-order terminal with category filter, item grid, cart sidebar, checkout modal, auto-reset idle timer (2 min), success screen with order number; no auth required
- **T004 – Promo Offers Management** (`/manager/promotions`): Full CRUD for bundle/discount/BOGO promo offers; uses existing `/api/admin/promo-offers` endpoints; toggle active; date range; discount % display
- **T005 – Offline POS Mode**: IndexedDB queue in `client/src/lib/offline-queue.ts`; when offline orders are queued locally; when back online they sync automatically with toast; service worker enhanced with `sync-offline-orders` background sync tag; offline indicator in POS cart panel
- **T006 – API Management** (`/admin/api`): API key generator (stored in localStorage for demo); public + authenticated endpoint documentation browser; copy endpoint URLs; code examples

### New Files
- `client/src/pages/kiosk.tsx` — Self-order kiosk
- `client/src/pages/promotions-management.tsx` — Promo offers CRUD
- `client/src/pages/api-management.tsx` — API key & docs management
- `client/src/lib/offline-queue.ts` — IndexedDB offline order queue

### New API Endpoints
- `POST /api/gift-cards/:code/redeem-customer` — Public gift card redemption for customer checkout

## Recent Fixes (March 2026)

- **Payment "Coming Soon" Removed**: `comingSoon={false}` in `checkout.tsx` and `checkout-modal.tsx` — payment methods are now fully active
- **Product Add-ons Auto-confirm**: Products with no sizes, variants, or add-ons are added directly to cart without showing the customization dialog (`drink-customization-dialog.tsx`)
- **Design System Color Migration**: All pages migrated from old amber/golden brand colors to the new monochrome green design system (`hsl(155, 60%, 38%)`). 50+ pages fixed across the entire codebase.
- **`bg-background0` Bug Fixed**: Removed invalid CSS class `bg-background0` (typo) across 15+ files — replaced with `bg-primary`, `bg-primary/10`, `bg-primary/20`, etc. as appropriate.
- **Cart Addon CastError Fixed**: `ProductAddonModel.findOne({ id: addonId })` instead of `findById(addonId)` since `selectedAddons` stores nanoid strings, not MongoDB ObjectIds.
- **ForgotPassword Two-Path Flow**: Added email+phone path and phone+account-name path for users without email. Backend endpoints: `POST /api/customers/verify-phone-name` and `POST /api/customers/reset-password-by-phone-name`.
- **Fallback Image Fix**: Broken fallback `/placeholder-coffee.png` → `/images/default-coffee.png` in `table-menu.tsx`, `menu.tsx`, `menu-layouts.tsx`.
- **Missing Route Added**: `/manager/inventory/transfers` route added to App.tsx with lazy import for `InventoryTransfersPage`.
- **Green Color Fixes (Latest Session)**:
  - `order-card.tsx`: "Start Preparing" (بدء التحضير) buttons changed from `bg-amber-500` to `bg-primary`
  - `current-order-banner.tsx`: Coffee icon and heading text changed from amber to primary/foreground
  - `receipt-invoice.tsx`: Download PDF button amber styling removed (now uses standard outline)
  - `menu-layouts.tsx`: Best seller badges (الأكثر طلباً) changed from `bg-amber-500` to `bg-primary`
  - `pos-system.tsx`: Open bills count badge changed from `bg-orange-500` to `bg-primary`
- **PRESERVED intentional amber/orange**: Star rating stars, loyalty tier gold colors, payment gateway test mode banners, ZATCA warning text, order status "in transit" (orange), urgent order pulse badges, maintenance mode warning, promo notification type colors, low-stock warning indicators, "coming soon" payment method badges, kitchen delivery status indicators

## Quick Start

- **Build**: `npx vite build` (builds frontend to dist/public/)
- **Production**: `NODE_ENV=production npx tsx server/index.ts` (serves pre-built assets)
- **Workflow**: Build first, then run production server on port 5000
- **Port**: 5000
- **Note**: Vite dev server has a known Radix UI/React hook incompatibility in this environment; use production build workflow instead

## Branding

- **Brand Name**: QIROX / QIROX Cafe / QIROX Systems
- **Tagline**: Build systems. Stay human.
- **Color Scheme**: White background, gray accents, black text, green (#2D9B6E) primary
- **Logo**: attached_assets/QIROX_LOGO_1773902267966.png
- **Customer Logo**: `@assets/qirox-logo-customer.png` (attached_assets/qirox-logo-customer.png)
- **Staff Logo**: `@assets/qirox-logo-staff.png` (attached_assets/qirox-logo-staff.png)
- **Receipt Logo**: `client/src/assets/qirox-logo.png`
- **Banner 1**: attached_assets/image_1773902463502.png
- **Banner 2**: attached_assets/image_1773902748715.png
- **Email Logo**: https://raw.githubusercontent.com/Darsh20009/QIROXsystem/main/client/public/logo.png
- **Service Worker Cache**: `qirox-cache-v9`

## Environment Variables

- `MONGODB_URI` - MongoDB Atlas connection string
- `SESSION_SECRET` - Express session secret
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` - Web Push
- `SMTP2GO_API_KEY` - Email API key
- `SMTP_FROM` - `cafe@qiroxstudio.online`
- `SMTP_USER` - `Qirox`
- `NOTIFICATION_EMAIL` - `cafe@qiroxstudio.online`

## Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS + Radix UI + TanStack Query + Framer Motion
- **Backend**: Express.js + TypeScript (tsx)
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Auth**: Express Session (cookie: qirox.sid)
- **Realtime**: WebSockets
- **Notifications**: Web Push (VAPID) + WebSocket + MongoDB
- **Security**: Helmet.js, rate limiting, HPP, mongo-sanitize
- **Payments**: Geidea (card/Apple Pay), Cash, QIROX Card (loyalty)
- **i18n**: Arabic (RTL) + English via react-i18next

## QIROX Super Admin Panel

- **URL**: `/qirox` (hidden, password-protected)
- **Password**: Configured in `server/qirox-admin.ts`
- **Features**: Full system control, tenant management, subscription management, analytics, system health, logs
- **API Routes**: `/api/qirox/*` (login, dashboard, tenants, subscriptions, analytics, system-health, logs)
- **Models**: QiroxAdmin, SubscriptionConfig, SystemLog (in `server/qirox-admin.ts`)

## Subscription Tiers

- **Lite** (لايت): POS, Kitchen Display, Customer App, Multi-Language, 1 branch, 5 employees
- **Pro** (برو): Everything in Lite + Inventory, Recipes, Accounting, Delivery, Loyalty, Gift Cards, Tables, Payroll, ZATCA, Analytics, 5 branches, 30 employees
- **Infinity** (إنفينيتي): Everything in Pro + Unlimited everything, API Access, ERP, Warehouse, Dedicated Support

## Project Structure

- `client/` - React frontend (Vite)
  - `client/src/pages/` - All page components
  - `client/src/pages/qirox-login.tsx` - Super admin login
  - `client/src/pages/qirox-dashboard.tsx` - Super admin dashboard
  - `client/src/components/` - Shared components + UI kit
  - `client/src/components/global-prompts.tsx` - Global notification + PWA install prompts (mounted in App.tsx)
  - `client/src/lib/` - Utilities, stores, hooks
  - `client/src/contexts/` - React contexts (Customer, Cart)
- `server/` - Express backend (TypeScript)
  - `server/index.ts` - Server entry point
  - `server/routes.ts` - All API routes (~15k lines)
  - `server/qirox-admin.ts` - Super admin routes, models, subscription system
  - `server/mail-service.ts` - Email templates
  - `server/smart-scheduler.ts` - Automated notifications
  - `client/src/pages/shift-management.tsx` - Cashier shift management & Z-Report UI
- `shared/` - Shared types and Mongoose schemas (includes CashierShiftModel)
- `public/` - Static assets, PWA manifests, service workers

## Design System

CSS Variables defined in `client/src/index.css`:
- Light mode: White bg (#fdfdfd), Black text (#171717), Green primary (#2D9B6E)
- Dark mode: Black bg (#0d0d0d), Light text (#f2f2f2), Green primary (#2D9B6E)
- Sidebar: Black (#141414)
- Font: IBM Plex Sans Arabic + Tajawal

## Payment Methods (Simplified)

- **نقدي** (Cash) - Default, always enabled
- **شبكة** (Card/Network) - Geidea مدى/فيزا/ماستر
- **بطاقة كيروكس** (QIROX Card) - Loyalty card balance

## Employee Permissions System

- **Permission Engine**: `server/permissions-engine.ts` — 42+ granular permissions, 14 page IDs, 6 roles
- **Roles**: cashier, barista, supervisor, branch_manager, owner, admin
- **Auth Middleware**: `server/middleware/auth.ts` — `requirePermission()` checks role defaults + employee-level overrides
- **Page Access**: `allowedPages` array on employee controls sidebar visibility; empty = role defaults
- **Permission Overrides**: `permissions` array on employee adds extra permissions on top of role defaults
- **Role Escalation Protection**: PATCH/DELETE enforce role hierarchy — managers cannot edit/delete same-or-higher roles
- **Admin UI**: `client/src/pages/admin-employees.tsx` — grouped permission checkboxes by category
- **Sidebar**: `client/src/components/employee-sidebar.tsx` — dynamically filters pages based on role + allowedPages

## Delivery Service Integration

- **Delivery Dashboard**: `client/src/pages/manager-delivery.tsx` — real stats, active orders, webhook URLs, driver status
- **Service Engine**: `server/delivery-service.ts` — zones, drivers, auto-assign, webhook processing, stats aggregation
- **Webhook Endpoint**: `POST /api/webhooks/delivery/:provider` — receives orders from HungerStation, Jahez, ToYou, Mrsool, etc.
- **Auto-Assign**: Nearest available driver is auto-assigned when integration has `autoAcceptOrders` or `autoAssignDriver` enabled
- **Stats API**: `GET /api/delivery/stats?period=today|week|month` — real-time delivery analytics
- **Providers**: noon_food, hunger_station, keeta, jahez, toyou, mrsool, careem, custom

## Multi-Branch Unified Reports

- **Unified Reports Page**: `client/src/pages/unified-reports.tsx` — 4 tabs: Overview, Branches, Trends, Export
- **API**: `GET /api/reports/unified?period=today|week|month|year` — aggregates all branches
- **Branch Comparison**: Side-by-side revenue, orders, avg order, customers per branch
- **Payment Breakdown**: Cash/Card/QIROX card split across branches
- **Daily Revenue Trend**: Line chart of revenue over period

## Accounting Export (قيود/دفترة)

- **Export API**: `GET /api/accounting/export?period=month&format=csv|json` — journal entries ready for import
- **Chart of Accounts**: 1101 (Cash), 1102 (Card/Mada), 1103 (QIROX Card), 4101 (Sales Revenue), 2201 (VAT)
- **VAT Calculation**: Automatic 15% VAT extraction from inclusive prices
- **Formats**: CSV (UTF-8 BOM for Excel/Arabic), JSON (for API integrations)
- **Compatible With**: قيود (Qoyod), دفترة (Daftra), زوهو (Zoho)

## BI Analytics

- **BI Analytics Page**: `client/src/pages/bi-analytics.tsx` — 4 tabs: Insights, Performance, Products, Patterns
- **Smart Insights**: Automatic analysis (revenue changes, peak hours, dead hours, low avg order)
- **Day Part Analysis**: Morning/Afternoon/Evening/Night breakdown
- **Product Mix**: Pie chart + ranked list with visual bars
- **Scatter Analysis**: Orders vs Revenue correlation by hour
- **Radar Chart**: Multi-branch comparison across 4 dimensions

---

## ALL FEATURES

### Customer Portal
1. Browse coffee menu with categories, search, and filters
2. Smart banner carousel with promotions
3. Add items to cart with size/addon customization
4. Multiple delivery modes: Branch Pickup, Home Delivery, Car Pickup (curbside)
5. Order tracking in real-time
6. Loyalty card with points, tiers, and free drinks
7. Referral program
8. Table QR ordering (scan QR → order from table)
9. Table reservations
10. Customer profile with order history
11. Favorites system
12. PWA install (installable app) with iOS guide + Android native prompt
13. Push notifications for order status (mandatory full-screen prompt on first visit via GlobalPrompts)
14. Multi-language (Arabic RTL / English)
15. Guest checkout (no registration required)

### Employee/Cashier Portal
1. POS system with product grid and cart
2. Kitchen Display System (KDS) for order preparation
3. Table management (assign, occupy, free)
4. Customer lookup by phone number
5. Loyalty point management (add/verify/redeem)
6. Order management and status updates
7. Attendance clock-in/clock-out with GPS verification
8. Leave request system
9. Menu item availability toggle
10. Reservation management
11. QR code login
12. Cash drawer control

### Manager Portal
1. Dashboard with KPIs (sales, orders, revenue)
2. Advanced analytics and reports
3. Employee management (add, edit, roles, permissions)
4. Inventory management (raw items, stock, alerts)
5. Recipe management (ingredients per menu item)
6. Supplier management
7. Purchase orders
8. Stock movements tracking
9. Accounting dashboard (sales, expenses, profit)
10. ERP with double-entry bookkeeping
11. ZATCA-compliant e-invoicing (Saudi VAT 15%)
12. Payroll management
13. Customer reviews and replies
14. Gift cards management
15. Loyalty program configuration
16. Delivery services management
17. Branch management (multi-location)
18. Table setup and QR codes
19. Warehouse management
20. External integrations

### Admin Portal
1. System-wide dashboard
2. All-branch management
3. Employee management across branches
4. Email marketing and templates
5. Business configuration (name, VAT, currency, hours)
6. Notification management
7. Role-based access control (Owner, Admin, Manager, Cashier, Kitchen, Driver)
8. Data management tools

### Driver Portal
1. Driver-specific login
2. Order assignment and pickup
3. Real-time GPS location updates
4. Delivery tracking
5. Delivery fee calculation based on distance/zone

---

## ALL CUSTOMER ROUTES

| Path | Page |
|------|------|
| `/` | Welcome/Landing page |
| `/welcome` | Welcome page |
| `/menu` | Coffee menu with categories |
| `/menu-view` | Alternative menu view |
| `/product/:id` | Product detail page |
| `/auth` | Customer login/register |
| `/customer-login` | Customer login |
| `/forgot-password` | Password reset request |
| `/reset-password` | Password reset form |
| `/profile` | Customer profile |
| `/my-orders` | Order history |
| `/my-card` | Loyalty card |
| `/copy-card` | Card sharing |
| `/card-customization` | Card design |
| `/my-offers` | Available offers |
| `/referrals` | Referral program |
| `/cart` | Shopping cart |
| `/delivery` | Delivery mode selection |
| `/delivery/map` | Delivery map |
| `/checkout` | Checkout & payment |
| `/tracking` | Order tracking |
| `/delivery/track/:orderId` | Live delivery tracking |
| `/notifications` | Notifications list |
| `/payment-return` | Payment callback |
| `/table-menu/:qrToken` | Table QR menu |
| `/table-checkout/:tableId/:tableNumber` | Table checkout |
| `/table-reservation` | Book a table |
| `/my-reservations` | Customer reservations |
| `/table-order-tracking/:orderId` | Table order tracking |
| `/order-status` | Order status display |
| `/customer-display` | Customer-facing screen |

## ALL EMPLOYEE ROUTES

| Path | Page |
|------|------|
| `/employee` | Employee splash |
| `/0` | Employee splash (shortcut) |
| `/employee/gateway` | Employee gateway |
| `/employee/login` | Employee login |
| `/employee/forgot-password` | Password reset |
| `/employee/activate` | Account activation |
| `/employee/home` | Employee home |
| `/employee/dashboard` | Employee dashboard |
| `/employee/cashier` | Cashier interface |
| `/employee/pos` | POS system |
| `/employee/kitchen` | Kitchen display (KDS) |
| `/employee/tables` | Table management |
| `/employee/table-orders` | Table orders |
| `/employee/orders` | Order management |
| `/employee/orders-display` | Orders display board |
| `/employee/loyalty` | Loyalty management |
| `/employee/menu-management` | Menu editor (Manager+) |
| `/employee/ingredients` | Ingredients (Manager+) |
| `/employee/availability` | Item availability |
| `/employee/attendance` | Clock in/out |
| `/employee/leave-request` | Leave requests |
| `/employee/reservations` | Reservation management |

## ALL MANAGER ROUTES

| Path | Page |
|------|------|
| `/manager` | Manager login |
| `/manager/login` | Manager login |
| `/manager/forgot-password` | Password reset |
| `/manager/dashboard` | Manager dashboard |
| `/manager/employees` | Employee management |
| `/manager/drivers` | Driver management |
| `/manager/tables` | Table setup |
| `/manager/attendance` | Attendance reports |
| `/manager/inventory` | Inventory overview |
| `/manager/inventory/raw-items` | Raw materials |
| `/manager/inventory/suppliers` | Suppliers |
| `/manager/inventory/purchases` | Purchase orders |
| `/manager/inventory/recipes` | Recipes |
| `/manager/inventory/stock` | Stock levels |
| `/manager/inventory/alerts` | Low stock alerts |
| `/manager/inventory/movements` | Stock movements |
| `/manager/inventory/smart` | Smart inventory |
| `/manager/inventory/stock-organization` | Stock org |
| `/manager/accounting` | Accounting dashboard |
| `/manager/accounting/smart` | Smart accounting |
| `/manager/ingredients-recipes` | Ingredients & recipes |
| `/manager/os-inventory` | OS inventory |
| `/manager/unified-inventory` | Unified inventory |
| `/manager/zatca` | ZATCA invoices |
| `/manager/analytics` | Advanced analytics |
| `/manager/gift-cards` | Gift cards |
| `/manager/payroll` | Payroll |
| `/manager/reviews` | Customer reviews |
| `/manager/suppliers` | Supplier management |
| `/manager/loyalty` | Loyalty program |
| `/manager/integrations` | External integrations |
| `/manager/warehouse` | Warehouse management |
| `/manager/support` | Support system |
| `/manager/delivery-services` | Delivery services |
| `/manager/os-recipes` | OS recipes |
| `/manager/os-accounting` | OS accounting |
| `/manager/os-stock` | OS stock |
| `/manager/os-roles` | OS roles (Admin+) |
| `/manager/guide` | User guide |

## ALL ADMIN ROUTES

| Path | Page |
|------|------|
| `/admin/dashboard` | Admin dashboard |
| `/admin/employees` | Admin employees |
| `/admin/reports` | Admin reports |
| `/admin/settings` | Admin settings |
| `/admin/branches` | Branch management |
| `/admin/email` | Email management |
| `/admin/notifications` | Notification management |
| `/owner/dashboard` | Owner dashboard |
| `/executive` | Executive dashboard |

## ALL DRIVER ROUTES

| Path | Page |
|------|------|
| `/driver/login` | Driver login |
| `/driver/portal` | Driver portal |

## OTHER ROUTES

| Path | Page |
|------|------|
| `/guide` | User guide |
| `/unauthorized` | Unauthorized page |
| `/tenant/signup` | Tenant signup |
| `/recipes/management` | Recipe management |
| `/inventory/dashboard` | Inventory dashboard |
| `/accounting/dashboard` | Accounting dashboard |
| `/reports` | Reports page |
| `/stock-movements` | Stock movements |
| `/erp/accounting` | ERP accounting |

---

## KEY API ENDPOINTS

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/live` - Live orders
- `PATCH /api/orders/:id/status` - Update order status
- `GET /api/orders/kitchen` - Kitchen orders
- `GET /api/orders/active-display` - Customer display orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders/:id/car-pickup` - Car pickup details
- `DELETE /api/orders/bulk` - Bulk delete

### Menu & Products
- `GET /api/coffee-items` - Full menu
- `POST /api/coffee-items` - Add menu item
- `PATCH /api/coffee-items/:id/availability` - Toggle availability
- `GET /api/categories` - Menu categories

### Customers & Loyalty
- `POST /api/customers/register` - Register
- `POST /api/customers/login` - Login
- `GET /api/loyalty/cards/phone/:phone` - Lookup card
- `POST /api/loyalty/employee/add-points` - Add points
- `POST /api/loyalty/claim-free-drink` - Redeem reward
- `GET /api/customers/:id/orders` - Order history
- `POST /api/customers/favorites/:itemId` - Add favorite

### Employees & Attendance
- `POST /api/employees/login` - Login
- `POST /api/employees/login-qr` - QR login
- `POST /api/attendance/check-in` - Clock in
- `POST /api/attendance/check-out` - Clock out
- `GET /api/attendance/my-status` - Status

### Inventory & Recipes
- `GET /api/inventory/raw-items` - Raw items list
- `POST /api/inventory/raw-items` - Create raw item
- `GET /api/recipes/coffee-item/:coffeeItemId` - Get recipe
- `POST /api/recipes` - Create/update recipe
- `POST /api/inventory/movements` - Stock movements
- `GET /api/inventory/alerts` - Low stock alerts

### Accounting & ZATCA
- `GET /api/accounting/dashboard` - Financial overview
- `POST /api/accounting/expenses` - Record expense
- `GET /api/accounting/daily-summary` - Daily summary
- `POST /api/zatca/invoices` - Generate e-invoice

### Branches & Tables
- `GET /api/branches` - List branches
- `GET /api/tables` - List tables
- `POST /api/tables/book` - Reserve table
- `PATCH /api/tables/:id/occupancy` - Update occupancy
- `GET /api/tables/:id/qr-code` - Table QR code

### Delivery & Drivers
- `POST /api/delivery/drivers/login` - Driver login
- `PATCH /api/delivery/drivers/:id/location` - Update GPS
- `POST /api/delivery/calculate-fee` - Calculate fee
- `PATCH /api/orders/:id/assign-driver` - Assign driver

### System & Admin
- `GET /api/business-config` - Store settings
- `PATCH /api/business-config` - Update settings
- `POST /api/push/subscribe` - Push notification subscribe
- `POST /api/admin/send-email` - Send email
- `DELETE /api/admin/clear-all-data` - Clear database

### Notifications & Reviews
- `GET /api/notifications` - User notifications
- `POST /api/reviews/order/:orderId` - Submit review
- `PATCH /api/reviews/:id/reply` - Manager reply

### POS
- `GET /api/pos/status` - POS status
- `POST /api/pos/print-receipt` - Print receipt
- `POST /api/pos/cash-drawer/open` - Open cash drawer

## Deployment

Configured for autoscale deployment:
- Build: `npm run build`
- Run: `node dist/index.js`
