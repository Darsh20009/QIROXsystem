# COMPONENT_INVENTORY.md — QIROX React Component Inventory

> **Mode:** Blueprint only. No code modified.
> **Date:** 2026-07-08
> **Total components:** 202 files in `client/src/components/`

---

## 1. Layout Components

| Component | File | Purpose | Type | Issues | Recommendation |
|---|---|---|---|---|---|
| Layout | `Layout.tsx` | Base layout wrapper | Layout | Unknown wrapper scope | Audit which pages use it |
| EmployeeLayout | `EmployeeLayout.tsx` | Employee portal shell (nav + sidebar) | Layout | Sole layout for all employee pages | Keep — well-established |
| app-sidebar | `app-sidebar.tsx` | Sidebar navigation (Shadcn Sidebar) | Layout | Unknown if role-aware | Audit role-based visibility |
| Navigation | `Navigation.tsx` | Public navigation bar | Layout | Arabic RTL — verify LTR fallback | Audit RTL |
| Footer | `Footer.tsx` | Public footer | Layout | Unknown | Audit |
| MobileBottomNav | `MobileBottomNav.tsx` | Bottom nav for mobile | Layout | Which portals use it? | Audit scope |

---

## 2. UI Primitive Components (Shadcn/ui — `components/ui/`)

> Shadcn/ui components installed and customized. These are the base design system primitives. 30+ files confirmed. Key ones:

| Component | Notes |
|---|---|
| `button.tsx` | Core CTA — likely customized with brand variants |
| `card.tsx` | Used extensively across dashboards |
| `dialog.tsx` | Modal pattern — audit for focus trap |
| `table.tsx` | Used in all admin list pages — audit for mobile |
| `form.tsx` | React Hook Form integration |
| `input.tsx` / `textarea.tsx` | Form inputs |
| `select.tsx` | Dropdown select |
| `toast.tsx` / `toaster.tsx` | Notification toasts |
| `skeleton.tsx` | Loading states — coverage not confirmed |
| `sheet.tsx` | Slide-over panels |
| `badge.tsx` | Status labels |
| `tabs.tsx` | Tab navigation |
| `alert-dialog.tsx` | Destructive action confirmation |
| `popover.tsx` | Contextual menus |
| `scroll-area.tsx` | Custom scroll containers |
| `sidebar.tsx` | Sidebar primitive (Shadcn) |

---

## 3. Feature Components (Shared Cross-Feature)

| Component | File | Purpose | Type | Issues | Recommendation |
|---|---|---|---|---|---|
| NotificationBell | `NotificationBell.tsx` | Notification count + dropdown | Feature | WS connection lifecycle? | Audit WS cleanup |
| UserAvatar | `UserAvatar.tsx` | User photo with fallback | UI | Photo from local uploads | Migrate to CDN |
| ImageUpload | `ImageUpload.tsx` | File upload input | Feature | MIME validation? | Audit validation |
| RoleGuard | `RoleGuard.tsx` | Client-side role protection | Auth | SSR not applicable, client-only | Document client-only scope |
| PayPalButton | `PayPalButton.tsx` | PayPal SDK JS button | Payment | IAP risk on iOS | Add platform check |
| PayPalCardForm | `PayPalCardForm.tsx` | PayPal card input | Payment | PCI scope? | Audit PCI |
| PayPalCheckoutButton | `PayPalCheckoutButton.tsx` | Checkout PayPal | Payment | Duplicate of PayPalButton? | Audit duplication |
| PixelTracking | `PixelTracking.tsx` | Meta/TikTok/GA4 pixel inject | Analytics | Works correctly per memory | Keep |
| GlobalNotificationBanner | `GlobalNotificationBanner.tsx` | System-wide alert | UI | Dismissal persistence? | Audit |
| OfflineBanner | `OfflineBanner.tsx` | No network indicator | UI | Unknown | Keep |
| InstallPrompt | `InstallPrompt.tsx` | PWA install prompt | PWA | Unknown | Keep |
| PushPermissionBanner | `PushPermissionBanner.tsx` | Push opt-in | Push | VAPID not set | Conditionally show |
| PageHintCard | `PageHintCard.tsx` | Contextual help tooltip | UX | Uses 531-line hints registry | Keep — valuable |
| QiroxCompanion | `QiroxCompanion.tsx` | AI assistant widget | AI | Unknown | Audit |
| GlobalMusicPlayer | `GlobalMusicPlayer.tsx` | Background music | UX | Autoplay policy? | Add user trigger |

---

## 4. Authentication Components

| Component | File | Purpose | Issues | Recommendation |
|---|---|---|---|---|
| BiometricButton | `BiometricButton.tsx` | Face/fingerprint trigger | Security not audited | Audit |
| BiometricManager | `BiometricManager.tsx` | Biometric state manager | Security not audited | Audit |
| FaceRecognitionModal | `FaceRecognitionModal.tsx` | Camera-based face auth | Privacy implications | Audit + privacy notice |
| QrLoginScanner | `QrLoginScanner.tsx` | QR code login | Security not audited | Audit |
| QuickPinButton | `QuickPinButton.tsx` | 4-6 digit PIN auth | PIN brute-force? | Add attempt limit |
| RegisterModal | `RegisterModal.tsx` | Registration form | Validation not audited | Audit |
| CountryPhoneInput | `CountryPhoneInput.tsx` | Phone + country code | Unknown | Keep |
| CountrySelect | `CountrySelect.tsx` | Country dropdown | Duplicates CountryPhoneInput? | Audit duplication |

---

## 5. Dashboard Components

| Component | File | Purpose | Issues | Recommendation |
|---|---|---|---|---|
| DashboardWidgets | `DashboardWidgets.tsx` | Metric cards/widgets | Unknown | Keep |
| ClientDashboardSimple | `ClientDashboardSimple.tsx` | Client portal summary | "fat component" | Split into sub-components |
| ClientHeroVisual | `ClientHeroVisual.tsx` | Client portal hero | Unknown | Audit |
| TimeTracker | `TimeTracker.tsx` | Work time logging | No conflict detection | Add overlap validation |
| ProjectComments | `ProjectComments.tsx` | Comment thread | Real-time not audited | Audit WS |

---

## 6. Visual / Animation Components

| Component | File | Purpose | Issues | Recommendation |
|---|---|---|---|---|
| AnimatedPageGraphics | `AnimatedPageGraphics.tsx` | Decorative animations | prefers-reduced-motion? | Add motion media query |
| ParticleCanvas | `ParticleCanvas.tsx` | Canvas particle effect | Performance on mobile | Disable on low-end devices |
| FloatingBrandPulse | `FloatingBrandPulse.tsx` | Animated brand element | prefers-reduced-motion? | Add motion media query |
| MarketingVisual | `MarketingVisual.tsx` | Marketing graphics | Unknown | Audit |
| AvatarBuilder | `AvatarBuilder.tsx` | Custom avatar creator | Unknown | Audit |

---

## 7. Sandbox / IDE Components (in `components/sandbox/`)

| Component | File | Purpose | Issues | Recommendation |
|---|---|---|---|---|
| Sandbox components | `sandbox/*.tsx` | Monaco editor + IDE UI | exec() injection | Audit security |

---

## 8. Utility Components

| Component | File | Purpose | Issues | Recommendation |
|---|---|---|---|---|
| AntiDevTools | `AntiDevTools.tsx` | Blocks browser DevTools | Security theater | Remove — not effective |
| SARIcon | `SARIcon.tsx` | Saudi Riyal currency icon | Unknown | Keep |
| logo | `logo.tsx` | Logo component | Old @assets — migrated per memory | Keep |
| qirox-brand | `qirox-brand.tsx` | Brand component | Unknown | Audit |
| DocumentAiComposer | `DocumentAiComposer.tsx` | AI document generator | SSE cleanup | Audit |
| EmployeeAIAssistant | `EmployeeAIAssistant.tsx` | Employee AI chat | Unknown | Audit |
| PackageFinderModal | `PackageFinderModal.tsx` | Pricing/plan finder | Unknown | Audit |

---

## 9. Duplicate Component Analysis

| Duplication | Components | Risk | Recommendation |
|---|---|---|---|
| PayPal buttons | `PayPalButton`, `PayPalCardForm`, `PayPalCheckoutButton` | 3 similar PayPal components | Audit — may be intentional (different modes) |
| Country input | `CountryPhoneInput`, `CountrySelect` | May overlap | Audit which is used where |
| Logo | `logo.tsx`, `qirox-brand.tsx` | Two brand components | Audit — merge if possible |
| AI chat | `QiroxCompanion`, `EmployeeAIAssistant`, `DocumentAiComposer` | 3 AI UI components | Audit — may target different use cases |
| Dashboard | `DashboardWidgets`, `ClientDashboardSimple` | Overlap unclear | Audit scope |

---

## 10. Large Components (Estimated > 500 lines)

| Component | Concern | Recommendation |
|---|---|---|
| `EmployeeLayout.tsx` | Layout + navigation + state management | May need splitting |
| `ClientDashboardSimple.tsx` | "fat component" per explorer report | Split into feature components |
| `DocumentAiComposer.tsx` | AI streaming + form + preview | Split into composer + preview |
| `FaceRecognitionModal.tsx` | Camera + recognition + auth flow | Split modal + camera hook |
| `AvatarBuilder.tsx` | Canvas + customization | May be acceptable |
| `app-sidebar.tsx` | Full sidebar with all nav items | Acceptable for sidebar |

---

## 11. Missing Components (Recommended for V4)

| Component | Purpose | Priority |
|---|---|---|
| `ErrorBoundary.tsx` | Global error catching with retry UI | P0 |
| `QueryErrorFallback.tsx` | TanStack Query error display | P0 |
| `EmptyState.tsx` | Empty list/data state UI | P1 |
| `LoadingPage.tsx` | Full-page loading skeleton | P1 |
| `ConfirmDialog.tsx` | Reusable destructive action confirmation | P1 |
| `DataTable.tsx` | Unified table with pagination + sort | P1 |
| `FileUploadZone.tsx` | Drag-and-drop upload with progress | P1 |
| `SessionExpiredModal.tsx` | Session timeout warning + extend | P1 |
| `PlatformPaymentButton.tsx` | IAP-aware payment button (iOS vs web) | P1 |
| `RTLWrapper.tsx` | Enforces RTL direction per locale | P2 |
| `StructuredDataHead.tsx` | JSON-LD injection for SEO | P2 |

---

## 12. Hooks Inventory (`client/src/hooks/`)

| Hook | File | Purpose | Issues |
|---|---|---|---|
| use-auth | `use-auth.ts` (130 LOC) | Auth state + user context | Core hook — audit well |
| use-currency | `use-currency.ts` (703 LOC) | Currency formatting + conversion | 703 lines is very large for a hook |
| use-biometric | `use-biometric.ts` (103 LOC) | Biometric auth trigger | Security not audited |
| useWebSocket | `useWebSocket.ts` | WS connection + events | Reconnect logic? |
| useInboxSocket | `useInboxSocket.ts` | Inbox-specific WS | Separate from main WS |
| use-seo | `use-seo.ts` (implied) | useSEO meta tag setter | JSON.stringify dep key works |
| use-push-notifications | (implied) | Push subscription | VAPID not set |

**Note:** `use-currency.ts` at 703 lines is a candidate for splitting into formatting, conversion, and display utilities.
