# UI_RULES.md — QIROX UI Implementation Rules Audit

> **Mode:** Audit only. No fixes. Document every issue.
> **Date:** 2026-07-08

---

## 1. Current UI Stack

| Layer | Technology | Version |
|---|---|---|
| Component base | Shadcn/ui + Radix UI | Latest |
| Styling | Tailwind CSS | v3 |
| Language direction | RTL (Arabic-first) | `dir="rtl"` |
| Animation | Framer Motion | Latest |
| Form handling | React Hook Form + Zod | v7 + v3 |
| Routing | Wouter | Latest |
| State | TanStack React Query v5 | v5 |

---

## 2. UI Issues (Audit)

### UI-001 — 166 Pages, No Shared Layout Audit
- **File:** `client/src/pages/` (166 files)
- **Problem:** 166 page components exist. No audit has been done to verify they all use the correct layout wrapper (EmployeeLayout, AdminLayout, ClientLayout, etc.).
- **Risk:** Pages may render without navigation, breadcrumbs, or sidebars. Mobile pages may overflow or break layout.
- **Recommendation:** Create a layout matrix documenting which layout each page uses. Verify against the 11 user roles.
- **Priority:** HIGH

### UI-002 — Loading States Not Audited Across All Pages
- **File:** `client/src/pages/` (all pages)
- **Problem:** It is unknown whether all 166 pages implement loading skeletons or spinners while TanStack Query fetches data.
- **Risk:** Pages that show blank/empty state during initial load appear broken to users. Especially critical for dashboard pages with multiple queries.
- **Recommendation:** Audit every page for `isLoading` handling. Add Skeleton components where missing.
- **Priority:** MEDIUM

### UI-003 — Error States Not Audited
- **File:** `client/src/pages/` (all pages)
- **Problem:** It is unknown whether all pages handle query errors (network failure, 401, 500) gracefully.
- **Risk:** A failed API call shows a blank page or an unhandled JavaScript error instead of a user-friendly error message with a retry option.
- **Recommendation:** Implement a `<QueryErrorBoundary>` or global error state UI for all TanStack Query hooks. At minimum, show an error card with a "Try again" button.
- **Priority:** MEDIUM

### UI-004 — Empty State Not Audited
- **File:** `client/src/pages/` (list pages)
- **Problem:** Pages with lists or tables (invoices, projects, leads, etc.) may not show an empty state when there is no data.
- **Risk:** New users or users with no data see a blank list, which looks broken rather than guiding them to create their first item.
- **Recommendation:** Audit all list pages for empty state UI. Add an illustrated empty state with a call to action.
- **Priority:** MEDIUM

### UI-005 — Mobile Responsiveness Not Fully Audited
- **File:** `client/src/pages/` (all pages)
- **Problem:** The platform runs on iOS and Android via Capacitor. Not all 166 pages have been verified for mobile layout correctness.
- **Risk:** Pages with complex tables, multi-column layouts, or fixed widths will overflow or become unusable on small screens.
- **Recommendation:** Audit all pages at 375px (iPhone SE) and 414px (iPhone XR) viewport widths. Prioritize employee and client portal pages.
- **Priority:** HIGH

### UI-006 — Monaco Editor in Mobile Context
- **File:** `client/src/pages/` (sandbox/IDE pages)
- **Problem:** Monaco Editor is a desktop-class code editor. It does not work well on mobile (no virtual keyboard integration, no touch selection).
- **Risk:** Developer-role users on mobile cannot use the sandbox IDE effectively.
- **Recommendation:** Detect mobile/tablet viewport and either show a warning or substitute a simpler editor (CodeMirror) on small screens.
- **Priority:** MEDIUM

### UI-007 — console.log Calls in Production Frontend
- **File:** `client/src/` (29 instances)
- **Problem:** 29 `console.*` calls found in frontend source code.
- **Risk:** Leaks internal data to browser DevTools. Exposes API response shapes, user data, and debugging info to end users.
- **Recommendation:** Remove all console.log from production client code. Use a conditional logger for development-only output.
- **Priority:** MEDIUM

### UI-008 — Form Validation Feedback Language
- **File:** `client/src/` (form components)
- **Problem:** Zod validation error messages are defined in English by default. The platform is Arabic-first.
- **Risk:** Arabic-speaking users see English validation errors (e.g., "String must contain at least 8 character(s)").
- **Recommendation:** Audit all Zod schemas used in client forms. Use `zod`'s `setErrorMap` to provide Arabic error messages.
- **Priority:** MEDIUM

### UI-009 — Hardcoded Arabic Text Mixed with i18n
- **File:** `client/src/` (various)
- **Problem:** Some components may mix hardcoded Arabic strings with i18n keys, creating an inconsistent translation pattern.
- **Risk:** If/when English-only mode is needed, hardcoded Arabic strings will not translate.
- **Recommendation:** Audit all JSX for hardcoded string literals in Arabic. Move to i18n keys.
- **Priority:** LOW

### UI-010 — QMeet Video UI on Mobile
- **File:** `client/src/pages/` (QMeet pages)
- **Problem:** WebRTC video conference UI has not been audited for mobile layout. Camera/mic permission flows differ on iOS vs Android.
- **Risk:** QMeet may be unusable on mobile due to layout issues or WebRTC constraints in Capacitor's WebView.
- **Recommendation:** Test QMeet on iOS simulator and Android emulator. Verify camera/microphone permissions are declared in `Info.plist` and `AndroidManifest.xml`.
- **Priority:** HIGH
