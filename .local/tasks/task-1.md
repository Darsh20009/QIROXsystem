---
title: Employee system full redesign
---
# Employee System — Full Redesign

## What & Why
The current employee system is cluttered and shows all employees sensitive data (profits, payroll, employee management) regardless of their role. Regular employees see pages that don't apply to them, causing confusion. This task redesigns the entire employee area to be clean, smart, and role-aware — each employee sees only what's relevant to their role, with a beautiful new UI featuring visual graphics, shortcuts, and data widgets.

## Done looks like
- Regular employees (sales, developer, designer, support, content, marketing, merchant) cannot access profit reports, payroll, employee management, or financial admin — even by typing the URL directly
- Each role has a redesigned dashboard with relevant data widgets, shortcuts, and visual stats
- The sidebar is clean, grouped, and only shows items the current employee's role can access
- Marketing manager sees customer data; sales sees their pipeline; developer sees projects and mod requests; accountant sees finance/invoices only; HR sees attendance and payroll
- No existing feature is broken — all pages still exist and work, they're just hidden from roles that shouldn't see them
- The employee welcome page feels personalized with the employee's name, role badge, and today's quick stats
- A floating AI assistant button appears in the employee area for quick help

## Out of scope
- Cafe-demo employee system (separate sub-project, not touched)
- Admin panel pages themselves (only access control and navigation is changed)
- Client-facing pages

## Steps
1. **Role guard component** — Create a `RoleGuard` wrapper component that redirects to `/employee/role-dashboard` if the logged-in user's role doesn't have permission for the current admin page. Define the allowed-roles map for each sensitive route.
2. **App.tsx route protection** — Wrap sensitive admin routes (employees, profit-report, finance, payroll, attendance, activity-log, analytics, wallet) with `RoleGuard`, specifying which roles are permitted for each.
3. **Sidebar redesign** — Redesign `EmployeeLayout.tsx`: add gradient role badge at top, visual group separators with Arabic/English labels, smooth active-pill nav, notification count badges on relevant items, and a role-colored accent. Refine the existing role-to-items map to ensure no role sees items they shouldn't.
4. **Role dashboard enhancement** — Rewrite all 10 role dashboards in `EmployeeRoleDashboard.tsx` with: a hero stat strip (3-4 key animated numbers), quick-action cards grid, role-specific data widgets, and a "My Projects/Orders" list filtered to the logged-in employee. Remove financial totals and headcount from non-admin roles.
5. **Employee welcome page** — Redesign `EmployeeWelcome.tsx` to show a personalized, animated landing with the employee's name, role color badge, today's quick stats, and role-specific CTA shortcuts.
6. **Floating AI assistant** — Add a floating AI chat button in `EmployeeLayout` that opens a role-aware slide panel using the existing Moonshot AI endpoint, with the employee's role and name injected into the system prompt.

## Relevant files
- `client/src/App.tsx:236-325`
- `client/src/components/EmployeeLayout.tsx`
- `client/src/pages/EmployeeRoleDashboard.tsx`
- `client/src/pages/EmployeeHub.tsx`
- `client/src/pages/EmployeeWelcome.tsx`
- `shared/src/schema.ts`