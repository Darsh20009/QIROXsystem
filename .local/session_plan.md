# Objective
Add animated SVG chart graphics (PageGraphics component) to ALL pages in the application. Each page gets an appropriate variant matching its theme (light/dark) and context.

# Component Reference
`client/src/components/AnimatedPageGraphics.tsx` — exports `PageGraphics` with variants:
- `hero-light` — Light bg, dark chart elements (public hero sections)
- `full-light` — Full set of charts on light bg
- `hero-dark` — Dark bg, white chart elements
- `full-dark` — Full set on dark bg
- `bars-corners` — Bar charts in corners only
- `line-top` — Line chart across top
- `rings-sides` — Ring donuts on sides
- `dashboard` — Subtle line on top (admin/dashboard)
- `auth` — Dark bg subtle charts
- `minimal` — Just dots + glow

# Implementation Pattern
For each page:
1. Add `import { PageGraphics } from "@/components/AnimatedPageGraphics";`
2. Find the FIRST section/div with hero content (usually `<section className="pt-...">`)
3. Ensure that container has `relative overflow-hidden` classes
4. Insert `<PageGraphics variant="..." />` as the FIRST child inside that container

# Tasks

### T001: Public Pages Batch 1
- **Blocked By**: []
- **Details**:
  - Files: Home.tsx, About.tsx, Portfolio.tsx, Customers.tsx, Contact.tsx, Partners.tsx
  - Variants: Home→hero-light, About→full-light, Portfolio→bars-corners, Customers→rings-sides, Contact→minimal, Partners→rings-sides
  - Find each page's hero `<section>`, ensure `relative overflow-hidden`, add `<PageGraphics variant="..." />`
  - Add import at top of each file
  - Acceptance: Each page has the import and component placed correctly

### T002: Public Pages Batch 2
- **Blocked By**: []
- **Details**:
  - Files: News.tsx, Jobs.tsx, JoinUs.tsx, Segments.tsx, DevPortal.tsx, Privacy.tsx, Terms.tsx
  - Variants: News→line-top, Jobs→bars-corners, JoinUs→hero-light, Segments→hero-light, DevPortal→full-dark, Privacy→minimal, Terms→minimal
  - Same pattern: import + find hero section + add PageGraphics
  - Acceptance: Each page has the import and component placed correctly

### T003: Cart, OrderFlow, Dashboard, User Pages
- **Blocked By**: []
- **Details**:
  - Files: Cart.tsx, Devices.tsx, not-found.tsx, Dashboard.tsx, ProjectDetails.tsx, SupportTickets.tsx, PaymentHistory.tsx, Inbox.tsx
  - Variants: Cart→minimal, Devices→minimal, not-found→minimal, Dashboard→dashboard, ProjectDetails→minimal, SupportTickets→dashboard, PaymentHistory→dashboard, Inbox→dashboard
  - For dashboard pages: find the main content wrapper div, ensure relative overflow-hidden, add PageGraphics
  - Acceptance: Each page has the import and component placed correctly

### T004: Admin Pages Part 1
- **Blocked By**: []
- **Details**:
  - Files: AdminOrders.tsx, AdminEmployees.tsx, AdminFinance.tsx, AdminServices.tsx, AdminTemplates.tsx, AdminPartners.tsx, AdminNews.tsx, AdminJobs.tsx
  - ALL use variant: dashboard
  - For admin pages: the main content area is typically a `<div>` inside the sidebar layout. Find the outermost content wrapper and add PageGraphics there
  - Acceptance: Each page has the import and component placed correctly

### T005: Admin Pages Part 2
- **Blocked By**: []
- **Details**:
  - Files: AdminBankSettings.tsx, AdminSubscriptionPlans.tsx, AdminModRequests.tsx, AdminCustomers.tsx, AdminProducts.tsx, AdminAnalytics.tsx, AdminActivityLog.tsx, AdminInvoices.tsx
  - ALL use variant: dashboard
  - Same pattern as T004
  - Acceptance: Each page has the import and component placed correctly

### T006: Remaining Pages
- **Blocked By**: []
- **Details**:
  - Files: AdminReceipts.tsx, AdminPayroll.tsx, AdminSupportTickets.tsx, EmployeeNewOrder.tsx, EmployeeProfile.tsx, EmployeeRoleDashboard.tsx, SalesMarketing.tsx, DevChecklist.tsx, InternalGate.tsx, ForgotPassword.tsx
  - Variants: All admin/employee pages→dashboard, InternalGate→auth, ForgotPassword→auth
  - Same pattern
  - Acceptance: Each page has the import and component placed correctly

### SKIP: InvoicePrint.tsx, ReceiptPrint.tsx, VerifyEmail.tsx, Login.tsx (already have their own specialized graphics)
