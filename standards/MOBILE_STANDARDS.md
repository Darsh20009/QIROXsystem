# MOBILE_STANDARDS.md — QIROX Mobile Standards

> **Source of truth:** docs/MOBILE_ARCHITECTURE.md, docs/APPLE_REVIEW.md  
> **Scope:** Mobile app (Capacitor wrapper over the existing PWA)  
> **Status:** Enforcement-ready — no production code modified

---

## Purpose

Define the implementation rules for the QIROX mobile application. The mobile app is a Capacitor-wrapped PWA sharing the same React codebase. Derived from docs/MOBILE_ARCHITECTURE.md and docs/APPLE_REVIEW.md.

---

## Rules

### R-MOB-001 — Capacitor Wraps the Existing PWA — No Separate Codebase
The mobile app must use Capacitor to wrap the existing React/Vite PWA. Do not maintain a separate React Native or Expo codebase. Per docs/MOBILE_ARCHITECTURE.md Section 1.

### R-MOB-002 — Biometric Authentication Uses Capacitor Identity Vault
Biometric authentication (Face ID, fingerprint) must use the Capacitor Identity Vault plugin with proper iOS Keychain and Android Keystore integration. Per docs/MOBILE_ARCHITECTURE.md Section 3.

### R-MOB-003 — All API Calls Must Use HTTPS in Mobile Build
The mobile build must never make HTTP (non-TLS) API calls. `capacitor.config.ts` must set `server.androidScheme: 'https'`. Per docs/MOBILE_ARCHITECTURE.md Section 2.

### R-MOB-004 — Particle Animation Must Be Disabled on Mobile Devices
`ParticleCanvas.tsx` must detect mobile viewport (`window.innerWidth < 768`) and return `null`. Particle rendering on mobile causes visible FPS drops. Per docs/BRAND_BLUEPRINT.md Section 5 and docs/MOBILE_ARCHITECTURE.md Section 5.

### R-MOB-005 — Screen Sharing Is Restricted to Desktop Only
WebRTC screen sharing (in QMeet) must check device type and show an error message on mobile devices. Per server/routes.ts (QMeet section) and docs/QMEET_ARCHITECTURE.md.

### R-MOB-006 — App Store Compliance — No Alternate Payment Systems in iOS Build
The iOS build must not advertise or link to any external payment method. PayPal, bank transfer, and any non-Apple payment must be removed or hidden in the iOS build. Per docs/APPLE_REVIEW.md Apple Store Guidelines Section 3.1.1.

### R-MOB-007 — App Store Compliance — Wallet Must Not Process Real-Money In-App Purchases in iOS
The Qirox Pay (wallet) feature in the iOS build must only display balances. Wallet top-up via external payment is forbidden from the iOS build unless it uses Apple's IAP. Per docs/APPLE_REVIEW.md Section 3.1.

### R-MOB-008 — Deep Linking Must Be Configured for Both Platforms
Universal Links (iOS) and App Links (Android) must be configured for the following paths:
- `/order/track/:trackId`
- `/client/projects/:projectId`
- `/employee/tasks/:taskId`
Per docs/MOBILE_ARCHITECTURE.md Section 4.

### R-MOB-009 — Push Notifications Must Use Capacitor Push Notifications Plugin
The mobile app must receive push notifications via the `@capacitor/push-notifications` plugin, not via the Web Push API. The web push service worker handles browser notifications; the Capacitor plugin handles mobile. Per docs/MOBILE_ARCHITECTURE.md Section 6.

### R-MOB-010 — `prefers-reduced-motion` Must Be Checked for All Animations
All Framer Motion animations must use `useReducedMotion()` and skip or simplify when the user's OS accessibility setting requests reduced motion. Per docs/BRAND_BLUEPRINT.md Section 5.

### R-MOB-011 — iOS App Must Pass Apple Privacy Questionnaire
The app must provide accurate privacy nutrition labels for: usage of camera, microphone (QMeet), contacts (none), location (none). Per docs/APPLE_REVIEW.md Section 5.

### R-MOB-012 — Mobile Viewport Must Use Logical RTL CSS Properties
All layouts must use Tailwind logical properties (`ms-`, `me-`, `ps-`, `pe-`) to correctly flip for LTR/RTL based on the document direction attribute. Do not use physical `ml-`, `mr-`, `pl-`, `pr-` properties. Per docs/MOBILE_ARCHITECTURE.md Section 5.

---

## Allowed

- Feature flags to conditionally hide web-only features from the mobile build
- Capacitor plugins for native device capabilities (biometrics, push, camera, filesystem)
- `@capacitor/status-bar` and `@capacitor/navigation-bar` for native chrome customization
- Separate Capacitor config per platform (`capacitor.config.ios.ts`, `capacitor.config.android.ts`)

---

## Forbidden

- External payment links or UI in the iOS build (App Store guideline violation)
- HTTP (non-TLS) API calls from the mobile build
- Particle animation rendering on mobile viewports
- Screen sharing UI on mobile devices
- Separate React Native or Flutter codebase for the mobile app
- `window.open()` for navigation in Capacitor shell — use Router or deep links

---

## Examples

### Particle Animation Mobile Guard
```typescript
function ParticleCanvas() {
  const prefersReducedMotion = useReducedMotion();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (isMobile || prefersReducedMotion) return null;

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
}
```

### Platform-Specific Payment UI
```typescript
import { Capacitor } from '@capacitor/core';

function WalletTopUpButton() {
  const isNativeIOS = Capacitor.getPlatform() === 'ios';

  if (isNativeIOS) {
    // Apple requires IAP for in-app purchases — show Apple IAP flow or hide
    return null;
  }

  return (
    <Button onClick={() => openTopUpModal()}>
      {t('wallet.topUp')}
    </Button>
  );
}
```

---

## Checklist

- [ ] Capacitor wraps PWA — no separate native codebase
- [ ] Biometric auth via Capacitor Identity Vault
- [ ] `androidScheme: 'https'` in capacitor.config.ts
- [ ] Particle animation disabled on mobile (`< 768px`)
- [ ] Screen sharing blocked on mobile in QMeet
- [ ] No external payment links in iOS build
- [ ] Deep links configured for both platforms
- [ ] Push notifications via `@capacitor/push-notifications`
- [ ] `prefers-reduced-motion` respected in all animations
- [ ] RTL logical CSS properties used everywhere

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| Showing PayPal button in iOS build | Gate behind `Capacitor.getPlatform() !== 'ios'` |
| `ml-4` in layout component | Use `ms-4` (margin-start, RTL-aware) |
| Particle rendering on iPhone | Return `null` when `window.innerWidth < 768` |
| HTTP API calls in Capacitor | Set `androidScheme: 'https'`; use HTTPS only |
| WebRTC screen share on mobile | Show "Desktop only" message + disable button |

---

## Future Scalability Considerations

- When the iOS app is submitted, complete Apple's App Privacy Report for all Capacitor plugins used
- As Capacitor versions are updated, check breaking changes in the Identity Vault API — biometric auth integration is the highest-risk update
- Consider a dedicated mobile CI pipeline (Xcode Cloud or Bitrise) for automated TestFlight builds
- When the Android app is submitted, ensure `network_security_config.xml` explicitly disables cleartext traffic
- React Native migration should only be considered if the PWA approach proves insufficient for app performance goals — document the decision before starting
