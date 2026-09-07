# UX_RULES.md — QIROX User Experience Audit

> **Mode:** Audit only. No fixes. Document every issue.
> **Date:** 2026-07-08

---

## 1. UX Scope

The platform serves 11 distinct user roles across 166 pages. This audit focuses on cross-cutting UX issues that affect all roles.

---

## 2. UX Issues (Audit)

### UX-001 — No Onboarding Flow for New Users
- **File:** `client/src/pages/` (post-login pages)
- **Problem:** No onboarding wizard, progress indicator, or "getting started" guide was found.
- **Risk:** New clients and merchants land on a full dashboard without guidance. Activation rate drops. Support tickets increase.
- **Recommendation:** Implement a role-specific onboarding checklist (e.g., for clients: "Subscribe → Upload logo → Submit first request"). Track completion in the user model.
- **Priority:** HIGH

### UX-002 — Notification System Not Audited for Delivery Reliability
- **File:** `server/notify.ts`, `client/src/` (notification pages)
- **Problem:** Web push notifications (VAPID) are implemented but delivery reliability has not been audited. Push requires `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` which are not currently set.
- **Risk:** Users miss important events (new invoice, ticket reply, payment confirmation) if push delivery fails silently.
- **Recommendation:** Implement delivery tracking. Fall back to in-app notifications if push is not granted. Show unread count badge in nav.
- **Priority:** MEDIUM

### UX-003 — Bilingual UI Consistency Not Audited
- **File:** `client/src/lib/i18n.tsx`, all pages
- **Problem:** The platform is bilingual (AR/EN). Completeness of translation keys has not been audited — some keys may be missing their EN or AR equivalent.
- **Risk:** Users switching to English see Arabic strings (or vice versa). Mixed-language UI looks broken.
- **Recommendation:** Run a translation key audit: find all i18n keys used in components, verify both `ar` and `en` translations exist.
- **Priority:** MEDIUM

### UX-004 — Session Timeout UX
- **File:** `server/auth.ts`, `client/src/` (auth pages)
- **Problem:** When a user session expires, the UX behavior (redirect to login vs. in-page prompt) has not been audited.
- **Risk:** A user filling out a long form loses all input when the session expires mid-session and they are silently redirected to login.
- **Recommendation:** Implement a session expiry warning modal 5 minutes before expiry with "Stay logged in" option. On 401 responses, show a login modal without losing the current page state.
- **Priority:** MEDIUM

### UX-005 — Destructive Actions Without Confirmation
- **File:** `client/src/pages/` (admin and employee pages)
- **Problem:** Not all destructive actions (delete employee, cancel subscription, clear wallet, remove API key) have been audited for confirmation dialogs.
- **Risk:** Users accidentally delete critical data with no recovery path.
- **Recommendation:** Audit all "Delete", "Cancel", "Remove", "Reset" actions. Every irreversible action must require explicit confirmation via AlertDialog.
- **Priority:** MEDIUM

### UX-006 — File Upload Feedback
- **File:** `client/src/` (upload components)
- **Problem:** File upload progress, success, and error feedback has not been audited across all upload points (bank transfer proof, profile photo, contract docs).
- **Risk:** Users re-submit files because they don't know if the first upload succeeded.
- **Recommendation:** Show upload progress bar, success state (filename + preview), and error state with retry for every upload input.
- **Priority:** MEDIUM

### UX-007 — Mobile Navigation Pattern
- **File:** `client/src/components/` (layout components)
- **Problem:** The navigation pattern on mobile (hamburger menu, bottom nav, or drawer) has not been audited for consistency across all portal types (admin, employee, client).
- **Risk:** Different portals use different mobile nav patterns, creating confusion for users who switch between roles.
- **Recommendation:** Standardize on a single mobile navigation pattern (bottom nav for client-facing, drawer for admin/employee). Audit all layout components.
- **Priority:** MEDIUM

### UX-008 — QMeet (Video Conferencing) Room Entry UX
- **File:** `client/src/pages/` (QMeet pages), `server/qmeet.ts`
- **Problem:** Pre-call camera/mic preview, room waiting state, and reconnection UX have not been audited.
- **Risk:** Users join meetings with incorrect audio/video settings. No feedback when they are disconnected.
- **Recommendation:** Add pre-call device check screen. Show reconnecting spinner on connection loss. Test on mobile.
- **Priority:** MEDIUM

### UX-009 — AI Studio Response Streaming UX
- **File:** `client/src/pages/` (AI pages), `server/ai.ts`
- **Problem:** AI responses arrive via SSE streaming. The streaming render behavior (token-by-token display, scroll behavior, stop button) has not been audited.
- **Risk:** Long responses cause the page to jump. Users cannot interrupt a slow/wrong response.
- **Recommendation:** Auto-scroll to bottom during streaming. Show "Stop" button that aborts the SSE connection. Handle `req.on('close')` on server to cancel the LLM request.
- **Priority:** MEDIUM

### UX-010 — Accessibility (a11y) Not Audited
- **File:** `client/src/` (all components and pages)
- **Problem:** No accessibility audit has been performed. Shadcn/ui provides ARIA attributes on its primitives, but custom components and page layouts may not.
- **Risk:** Platform is inaccessible to users with visual impairments or who rely on screen readers. Required for App Store accessibility compliance.
- **Recommendation:** Run an axe-core audit on key pages. Fix missing `aria-label`, `alt` text, focus management, and keyboard navigation.
- **Priority:** MEDIUM
