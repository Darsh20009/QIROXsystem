# APPLE_REVIEW.md — QIROX iOS App Store Compliance Audit

> **Mode:** Audit only. No fixes. Document every issue.
> **Date:** 2026-07-08

---

## 1. iOS App Overview

- **Framework:** Capacitor 7 + native iOS project
- **Config:** `capacitor.config.json`
- **iOS project:** `ios/` directory
- **CI/CD:** Codemagic (`codemagic.yaml`)
- **Distribution:** Apple Developer Program (certificate files present in repo root)

---

## 2. Capacitor Configuration

From `capacitor.config.json`:

Key settings require full audit of the config file. The following areas must be verified:

| Setting | Required Value | Status |
|---|---|---|
| `appId` | Reverse domain (e.g., `sa.qirox.app`) | Not audited |
| `appName` | Display name | Not audited |
| `webDir` | Build output directory | Not audited |
| `server.url` | Dev server URL (must be removed for production) | Not audited |
| `plugins.PushNotifications` | Permission configuration | Not audited |

---

## 3. Apple Review Issues (Audit)

### APPLE-001 — Private Key Files Committed to Repository
- **File:** `/distribution_key.pem`, `/QIROX_Distribution.p12`
- **Problem:** Apple Distribution private key and P12 certificate are in the repository root.
- **Risk:** These files must never be in source control. Apple can revoke the certificate if it detects public exposure. Any team member (or anyone with repo access) can sign apps.
- **Recommendation:** Revoke and regenerate the Distribution certificate. Store only in Codemagic encrypted environment variables.
- **Priority:** CRITICAL

### APPLE-002 — Camera / Microphone Privacy Descriptions (QMeet)
- **File:** `ios/App/App/Info.plist`
- **Problem:** The app uses WebRTC (QMeet) which requires camera and microphone access. `NSCameraUsageDescription` and `NSMicrophoneUsageDescription` must be present in `Info.plist`.
- **Risk:** App will crash immediately when requesting camera/mic if these strings are missing. Apple will reject the app in review.
- **Recommendation:** Verify `Info.plist` contains both keys with clear Arabic and English descriptions explaining why the camera/microphone is needed.
- **Priority:** CRITICAL

### APPLE-003 — Push Notification Capability
- **File:** `ios/App/App/App.entitlements` or Xcode capabilities
- **Problem:** Web push (VAPID) is implemented on the web. For iOS native push notifications via Capacitor, `@capacitor/push-notifications` must be configured and the APS environment entitlement must be set.
- **Risk:** Push notifications won't work on iOS if the entitlement is missing. Apple will reject the app if push is declared but not properly entitlement-configured.
- **Recommendation:** Verify `aps-environment` entitlement is set to `production` in the App's entitlements file for App Store builds.
- **Priority:** HIGH

### APPLE-004 — App Privacy Nutrition Label
- **File:** App Store Connect (not in codebase)
- **Problem:** Apple requires a Privacy Nutrition Label declaring all data collected. The QIROX platform collects: name, email, phone, location data (if any), payment info, messages, health/biometric data (if any).
- **Risk:** App Store rejection if Privacy Nutrition Label is incomplete or inaccurate.
- **Recommendation:** Inventory all data types collected by the app. Fill in the Privacy Nutrition Label in App Store Connect accurately. Particular attention to: Contact Info, Financial Info, User Content, Identifiers.
- **Priority:** HIGH

### APPLE-005 — In-App Purchases Compliance
- **File:** `server/paypal.ts`, `server/routes.ts` (payment flows)
- **Problem:** The app accepts payments for subscriptions and products. Apple requires that all in-app digital purchases go through Apple's In-App Purchase system (with 30% commission). External payment links (PayPal, bank transfer) are not permitted for digital goods sold within a Capacitor iOS app.
- **Risk:** App Store rejection under Guideline 3.1.1 (In-App Purchase). Possible removal of existing app.
- **Recommendation:** Assess which purchases qualify as "digital goods" under Apple's guidelines. Physical goods/services (consulting, custom websites) are exempt. SaaS subscriptions payable only in-browser (not in the native app) may also be exempt. Obtain legal/compliance review.
- **Priority:** CRITICAL

### APPLE-006 — App Review Login Credentials
- **File:** App Store Connect submission
- **Problem:** Apple reviewers require a demo account to log in and test the app.
- **Risk:** Apple rejects the app if they cannot log in and access all major features.
- **Recommendation:** Create a dedicated App Review account with pre-populated demo data. Document the credentials in App Store Connect's "Review Information" section. Never commit these to the repository.
- **Priority:** HIGH

### APPLE-007 — WebRTC (QMeet) in WKWebView
- **File:** `ios/` (Capacitor iOS project), `client/src/pages/` (QMeet)
- **Problem:** Capacitor uses WKWebView. WebRTC in WKWebView has historically had limitations on iOS, particularly with getUserMedia and multi-party connections.
- **Risk:** QMeet may not work correctly on iOS, or may work differently than on Android. This could cause App Store rejection if the core feature is broken.
- **Recommendation:** Test QMeet end-to-end on a physical iPhone (iOS 16+, 17+). Document any WebRTC limitations and implement workarounds or fallbacks.
- **Priority:** HIGH

### APPLE-008 — Minimum iOS Version
- **File:** `ios/` (Xcode project settings)
- **Problem:** The minimum supported iOS version has not been audited.
- **Risk:** Setting the minimum too low means supporting APIs that Capacitor 7 or WKWebView features may not support. Setting it too high excludes users.
- **Recommendation:** Capacitor 7 supports iOS 14+. Set deployment target to iOS 16 as a reasonable minimum for WKWebView capabilities and modern JS features.
- **Priority:** MEDIUM

### APPLE-009 — Sandbox / IDE Feature in App Store App
- **File:** `server/sandbox-routes.ts`, `client/src/pages/` (sandbox pages)
- **Problem:** The app includes a code execution sandbox (Monaco Editor + server-side exec). Apple guideline 2.5.2 prohibits apps from downloading and executing code.
- **Risk:** App Store rejection if the sandbox can download and execute arbitrary code on the device or via the server in a way that changes app behavior.
- **Recommendation:** Review Guideline 2.5.2 carefully. The sandbox runs server-side (not on the device), which may be acceptable. Consult with Apple or use the App Review Information section to explain the feature.
- **Priority:** HIGH

### APPLE-010 — App Binary Size
- **File:** Codemagic build output
- **Problem:** The iOS binary size has not been audited. Large binaries increase download time and may fail OTA size limits (200MB for cellular download).
- **Risk:** Users on cellular cannot download the app without Wi-Fi. App Store may flag excessively large binaries.
- **Recommendation:** Review Codemagic build output for IPA size. Enable bitcode and app thinning (Xcode). Remove unused assets.
- **Priority:** LOW

---

## 4. Required `Info.plist` Keys (Checklist)

| Key | Purpose | Status |
|---|---|---|
| `NSCameraUsageDescription` | QMeet camera | ❓ Not audited |
| `NSMicrophoneUsageDescription` | QMeet microphone | ❓ Not audited |
| `NSPhotoLibraryUsageDescription` | File uploads | ❓ Not audited |
| `NSPhotoLibraryAddUsageDescription` | Saving files | ❓ Not audited |
| `NSContactsUsageDescription` | If contacts accessed | ❓ Not audited |
| `NSLocalNetworkUsageDescription` | WebRTC local network | ❓ Not audited |

---

## 5. Codemagic CI/CD Audit

| Item | Status |
|---|---|
| `codemagic.yaml` present | ✅ |
| Keystore/P12 via encrypted env vars | ❓ Not verified |
| Android signing key in logs risk | ⚠️ (see SEC-MED-006) |
| Distribution cert in repo | ❌ CRITICAL |
| Provisioning profile management | ❓ Not audited |
