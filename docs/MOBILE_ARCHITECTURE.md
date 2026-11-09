# MOBILE_ARCHITECTURE.md — QIROX Mobile Strategy Blueprint

> **Mode:** Blueprint only. No code modified.
> **Date:** 2026-07-08

---

## 1. Current Mobile State

| Platform | Technology | Status |
|---|---|---|
| iOS | Capacitor 7 + Native iOS project | Built, not fully tested |
| Android | TWA (Trusted Web Activity) | Built |
| Web (PWA) | Service Worker + manifest | Active |
| CI/CD | Codemagic (codemagic.yaml) | Active |

### Capacitor Configuration Summary
```json
{
  "appId": "qiroxstudio.online",
  "appName": "QIROX Studio",
  "webDir": "dist/public",
  "server": {
    "url": "https://qiroxstudio.online",   // Points to live server
    "cleartext": false,
    "androidScheme": "https"
  },
  "ios": {
    "minVersion": "16.0",
    "backgroundColor": "#111111"
  }
}
```

### Critical Current Issues
| Issue | Severity | Reference |
|---|---|---|
| Distribution private key in repo | CRITICAL | APPLE_REVIEW.md APPLE-001 |
| Apple IAP compliance (PayPal in native) | CRITICAL | APPLE_REVIEW.md APPLE-005 |
| Camera/mic permissions not confirmed | HIGH | APPLE_REVIEW.md APPLE-002 |
| iOS WebRTC (QMeet) not tested | HIGH | APPLE_REVIEW.md APPLE-007 |
| Push notification entitlement | HIGH | APPLE_REVIEW.md APPLE-003 |
| Privacy Nutrition Label | HIGH | APPLE_REVIEW.md APPLE-004 |

---

## 2. iOS Architecture

### App Structure
```
QIROX Studio (iOS)
    └── WKWebView (Capacitor wrapper)
            └── https://qiroxstudio.online (live server)
                    └── React SPA (full web app)
```

### Capacitor Plugins in Use
| Plugin | Purpose | Config Status |
|---|---|---|
| @capacitor/push-notifications | Push via APN | Configured but VAPID keys missing |
| @capacitor/status-bar | Dark status bar | ✅ Configured |
| @capacitor/keyboard | Keyboard resize | ✅ Configured |
| @capacitor/haptics | Vibration feedback | ✅ Configured |
| @capacitor/browser | External browser | ✅ Configured |
| @capacitor/app | App lifecycle | ✅ Configured |

### iOS Info.plist Requirements (Must Verify)
```xml
<!-- Camera — required for QMeet and profile photo -->
<key>NSCameraUsageDescription</key>
<string>يستخدم تطبيق كيروكس الكاميرا لاجتماعات QMeet وصورة الملف الشخصي</string>

<!-- Microphone — required for QMeet -->
<key>NSMicrophoneUsageDescription</key>
<string>يستخدم تطبيق كيروكس الميكروفون لاجتماعات QMeet الصوتية والمرئية</string>

<!-- Photo Library — required for file uploads -->
<key>NSPhotoLibraryUsageDescription</key>
<string>يستخدم تطبيق كيروكس مكتبة الصور لرفع الملفات والمستندات</string>

<!-- Photo Library Add — required for saving files -->
<key>NSPhotoLibraryAddUsageDescription</key>
<string>يسمح تطبيق كيروكس بحفظ الملفات إلى مكتبة الصور</string>

<!-- Local Network — required for WebRTC -->
<key>NSLocalNetworkUsageDescription</key>
<string>يستخدم تطبيق كيروكس الشبكة المحلية لتحسين جودة اتصالات QMeet</string>
```

### iOS Entitlements Required
```xml
<!-- APS Environment — required for push notifications -->
<key>aps-environment</key>
<string>production</string>  <!-- for App Store builds -->

<!-- Associated Domains — for deep links and universal links -->
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:qiroxstudio.online</string>
    <string>webcredentials:qiroxstudio.online</string>  <!-- for passkeys -->
</array>
```

---

## 3. Android Architecture

### TWA (Trusted Web Activity)
```
QIROX Studio (Android)
    └── Chrome Custom Tab / TWA
            └── https://qiroxstudio.online (live server)
                    └── Same web app as browser
```

**TWA Requirements:**
- Digital Asset Links file: `/.well-known/assetlinks.json`
- App signing certificate SHA-256 in assetlinks.json
- Fingerprint must match Play Store signing key

```json
// client/public/.well-known/assetlinks.json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "qiroxstudio.online.twa",
    "sha256_cert_fingerprints": ["<SHA256 of Play signing cert>"]
  }
}]
```

### Android Manifest Requirements
```xml
<!-- Camera — QMeet -->
<uses-permission android:name="android.permission.CAMERA"/>

<!-- Microphone — QMeet -->
<uses-permission android:name="android.permission.RECORD_AUDIO"/>

<!-- Push notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>

<!-- Internet -->
<uses-permission android:name="android.permission.INTERNET"/>

<!-- File access -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
```

---

## 4. Authentication on Mobile

### Current Web Auth (Session Cookie)
```
Browser/WebView → POST /api/auth/login
    → Session cookie set (httpOnly, secure, sameSite: lax)
    → Capacitor WKWebView handles cookies automatically
    → No special mobile handling needed
```

### Biometric Authentication (Mobile-specific)
```
capacitor-init.ts → BiometricButton component
    → Detects: Face ID (iOS) / Fingerprint (Android)
    → Flow:
        1. User logs in normally (username/password)
        2. Option: "تفعيل بصمة الوجه/الإصبع"
        3. Store session token encrypted in Keychain (iOS) / Keystore (Android)
        4. On next open: Biometric prompt → decrypt token → restore session

Security note: Biometric auth security not fully audited
```

### Apple Sign-In (iOS requirement)
```
If Google/GitHub OAuth is offered, Apple Sign-In is REQUIRED by App Store guidelines.
Current status: Apple callback endpoint exists (/api/auth/apple/callback)
Verification needed: Is Sign in with Apple fully implemented end-to-end?

Flow:
    User taps "تسجيل الدخول بـ Apple"
    → @capacitor/sign-in-with-apple (if installed) OR
    → ASWebAuthenticationSession via browser
    → Apple returns: identityToken, user (first login only: email, name)
    → POST /api/auth/apple/callback { identityToken, user }
    → Verify JWT signature against Apple's public keys
    → Create/update UserModel
    → Return session
```

---

## 5. Push Notifications

### VAPID Web Push (Current — Browser/PWA)
```
Client → POST /api/push/subscribe { endpoint, keys }
    → PushSubscriptionModel.create
    → Stored per user

Server trigger → web-push.sendNotification(subscription, payload)
    → Browser/OS delivers notification

iOS PWA limitation: Web push on iOS requires iOS 16.4+ and PWA installed from Safari
```

### Capacitor Push Notifications (Native iOS/Android)
```
iOS (APN):
    app.addListener('registration', (token) => {
        POST /api/push/native-token { token, platform: 'ios' }
    });
    → Stored in PushSubscriptionModel.deviceToken

Android (FCM):
    Same flow with FCM token

Server → native push:
    → iOS: apple-apn library → APN → iPhone
    → Android: firebase-admin → FCM → Android device

Missing: firebase-admin + APN library integration
Required: APNS auth key or certificate, FCM server key
```

### Notification Payload Design
```typescript
interface PushNotification {
  title: string;          // Arabic primary
  body: string;           // Arabic
  icon?: string;          // App icon URL
  image?: string;         // Rich notification image
  badge?: string;         // Badge icon
  data?: {
    link: string;         // Deep link path
    type: string;         // notification type
    id: string;           // resource ID
  };
  actions?: {             // iOS: requires notification category setup
    action: string;
    title: string;
  }[];
}
```

---

## 6. Offline Support

### Current State
Service worker clears caches in dev mode (per `.agents/memory`). PWA cache strategy not fully audited.

### V4 Offline Strategy

```
Cache Strategy by Content Type:

Static assets (JS, CSS, fonts):
    Strategy: Cache First
    Update: Background revalidation

App shell (index.html):
    Strategy: Stale While Revalidate
    Fallback: Cached version

API responses:
    Strategy: Network First with cache fallback
    Cache duration: 5 minutes for non-sensitive data
    Never cache: auth, payments, wallet balance

Offline fallback:
    → Show OfflineBanner component ✅ (already exists)
    → Cache last-loaded dashboard data for read-only view
    → Queue: form submissions that fail offline → retry on reconnect

Tools: Workbox (recommended for Vite PWA)
```

---

## 7. Deep Links

### iOS Universal Links
```
File: client/public/.well-known/apple-app-site-association
{
  "applinks": {
    "details": [{
      "appIDs": ["<TeamID>.qiroxstudio.online"],
      "components": [
        { "/": "/orders/*", "comment": "Order details" },
        { "/": "/invoice/*", "comment": "Invoice view" },
        { "/": "/qmeet/*", "comment": "Meeting join" },
        { "/": "/reset-password", "comment": "Password reset" }
      ]
    }]
  },
  "webcredentials": {
    "apps": ["<TeamID>.qiroxstudio.online"]
  }
}
```

### Android App Links
```
File: client/public/.well-known/assetlinks.json
(As described in Android section above)
```

### Deep Link Paths
| Path | Purpose | Auth Required |
|---|---|---|
| `/orders/:id` | Open order detail | Yes |
| `/invoice/:id` | Open invoice | Yes |
| `/qmeet/:id` | Join meeting | Optional |
| `/qmeet/code/:code` | Join by code | Optional |
| `/reset-password?token=` | Password reset | No |
| `/verify-email?token=` | Email verify | No |

---

## 8. Apple App Store Compliance Checklist

> Full details in APPLE_REVIEW.md

| Item | Status | Action |
|---|---|---|
| Distribution cert in repo | ❌ CRITICAL | Revoke + regenerate |
| Camera usage string | ❓ | Verify in Info.plist |
| Microphone usage string | ❓ | Verify in Info.plist |
| Apple Sign-In offered | ❓ | Verify full implementation |
| In-App Purchase compliance | ⚠️ | Audit payment flows |
| Privacy Nutrition Label | ❌ | Fill in App Store Connect |
| App Review account | ❌ | Create demo account |
| Age rating | ❓ | Set appropriately (4+) |
| Sandbox feature review | ⚠️ | Guideline 2.5.2 audit |
| Binary size | ❓ | Measure from Codemagic |

---

## 9. Android Google Play Compliance

| Item | Status | Action |
|---|---|---|
| Data safety section | ❌ | Fill in Play Console |
| Target API level (35+) | ❓ | Verify in build.gradle |
| 64-bit support | ✅ (TWA is Chrome) | N/A |
| Permissions declaration | ❓ | Audit AndroidManifest |
| Financial features disclosure | ⚠️ | Wallet/payments declaration |
| Content rating | ❓ | Set in Play Console |
