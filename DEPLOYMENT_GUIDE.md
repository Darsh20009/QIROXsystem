# 🚀 QIROX Studio — دليل النشر الشامل

> **ملاحظة مهمة:** التطبيق مبني على **Capacitor** (وليس Flutter) — وهو إطار عمل يحوّل تطبيق الويب إلى تطبيق iOS/Android أصلي.  
> الكود موجود بالفعل ✅ — كل ما تحتاجه هو إدخال المفاتيح والبيانات في المكان الصحيح.

---

## 🔴 المشكلة التي تم إصلاحها

**السبب:** في `codemagic.yaml` كان اسم المتغير `APP_STORE_CONNECT_PUBLISHER_PRIVATE_KEY` خطأ.  
**الإصلاح:** تم تغييره إلى `APP_STORE_CONNECT_PRIVATE_KEY` وإضافة `app_store_connect` block صحيح.  
**إضافة جديدة:** workflow كامل لـ Android / Google Play.

---

## 📋 ملخص كل المتغيرات المطلوبة

| المتغير | من أين تحصل عليه | أين تضيفه |
|---------|-----------------|-----------|
| `APP_STORE_CONNECT_KEY_IDENTIFIER` | Apple Developer → Keys | Codemagic Dashboard |
| `APP_STORE_CONNECT_ISSUER_ID` | App Store Connect → Users & Access → Keys | Codemagic Dashboard |
| `APP_STORE_CONNECT_PRIVATE_KEY` | ملف `.p8` المحمّل من Apple | Codemagic Dashboard (Multiline) |
| `APPLE_TEAM_ID` | developer.apple.com → Membership | Codemagic Dashboard |
| `APPLE_CLIENT_ID` | Apple Developer → Services IDs | Replit Secrets |
| `APPLE_KEY_ID` | Apple Developer → Keys | Replit Secrets |
| `APPLE_PRIVATE_KEY` | ملف `.p8` لـ Sign in with Apple | Replit Secrets (Multiline) |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → OAuth 2.0 | Replit Secrets |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → OAuth 2.0 | Replit Secrets |
| `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` | Google Play Console → Service Account | Codemagic Dashboard (Multiline) |
| `KEYSTORE_BASE64` | ملف `.keystore` الموجود في `android-twa/` | Codemagic Dashboard |
| `KEYSTORE_PASSWORD` | الكلمة التي أنشأت بها الـ keystore | Codemagic Dashboard |
| `KEY_ALIAS` | `qirox` | Codemagic Dashboard |
| `KEY_PASSWORD` | كلمة مرور المفتاح | Codemagic Dashboard |
| `PAYPAL_CLIENT_ID` | PayPal Developer Dashboard | Replit Secrets |
| `PAYPAL_CLIENT_SECRET` | PayPal Developer Dashboard | Replit Secrets |
| `MONGODB_URI` | MongoDB Atlas | Replit Secrets |

---

## 🍎 SECTION 1 — Apple (أهم قسم)

### 1.1 App Store Connect API Key — للـ Build والنشر على TestFlight

**الهدف:** يسمح لـ CodeMagic بالنشر على TestFlight/App Store تلقائياً.

**خطوات الحصول عليه:**
1. اذهب إلى [App Store Connect](https://appstoreconnect.apple.com)
2. افتح: **Users and Access** → تبويب **Integrations** → **App Store Connect API**
3. اضغط **Generate API Key** (+)
4. الاسم: `Codemagic` | الصلاحية: **App Manager**
5. حمّل ملف `.p8` (يُحمَّل مرة واحدة فقط — احتفظ به!)
6. انسخ **Key ID** (مثال: `LQ28JB5CK7`)
7. انسخ **Issuer ID** من أعلى الصفحة (مثال: `1f96495e-ca18-401c-8f57-eedb187ebf64`)

**أضف في Codemagic Dashboard** (Settings → Environment variables):
```
APP_STORE_CONNECT_KEY_IDENTIFIER  = LQ28JB5CK7          (النص كما هو)
APP_STORE_CONNECT_ISSUER_ID       = 1f96495e-ca18-...    (النص كما هو)
APP_STORE_CONNECT_PRIVATE_KEY     = -----BEGIN PRIVATE KEY-----\n...  (Multiline ✅)
APPLE_TEAM_ID                     = XXXXXXXXXX           (10 أحرف من developer.apple.com → Membership)
```

---

### 1.2 Sign in with Apple — تسجيل الدخول بـ Apple (موجود في الكود ✅)

**الكود موجود بالكامل في `server/routes.ts`** — يحتاج فقط المتغيرات.

**خطوات الإعداد:**
1. اذهب إلى [developer.apple.com](https://developer.apple.com)
2. **Certificates, IDs & Profiles** → **Identifiers** → سجّل **Services ID**:
   - Identifier: `online.qiroxstudio.auth`
   - فعّل **Sign In with Apple**
   - أضف Domain: `qiroxstudio.online`
   - Return URL: `https://qiroxstudio.online/api/auth/apple/callback`
3. **Keys** → أضف مفتاح جديد:
   - فعّل **Sign In with Apple**
   - حمّل `.p8` واحتفظ بـ **Key ID**

**أضف في Replit Secrets:**
```
APPLE_CLIENT_ID   = online.qiroxstudio.auth      (Services ID)
APPLE_TEAM_ID     = XXXXXXXXXX                   (Team ID من Membership)
APPLE_KEY_ID      = YYYYYYYYYY                   (Key ID من Keys)
APPLE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----  (محتوى ملف .p8 كاملاً)
```

---

### 1.3 Apple Push Notifications (APNs) — الإشعارات (موجود في الكود ✅)

**الكود موجود في `server/push.ts`**

**خطوات الإعداد:**
1. **developer.apple.com** → **Keys** → أنشئ مفتاح:
   - فعّل **Apple Push Notifications service (APNs)**
   - حمّل `.p8` واحتفظ بـ **Key ID**
2. من **Membership** انسخ **Team ID**
3. من **Identifiers** اختر تطبيقك → انسخ **Bundle ID**: `qiroxstudio.online`

**أضف في Replit Secrets:**
```
APNS_KEY_ID       = ZZZZZZZZZZ       (Key ID للـ APNs)
APNS_TEAM_ID      = XXXXXXXXXX       (Team ID)
APNS_PRIVATE_KEY  = -----BEGIN ...   (محتوى .p8)
APNS_BUNDLE_ID    = qiroxstudio.online
```

---

### 1.4 Apple-App-Site-Association (Universal Links) — موجود ✅

**الملف موجود في السيرفر** تلقائياً على:
```
https://qiroxstudio.online/.well-known/apple-app-site-association
```
لا تحتاج إضافة أي شيء — فقط تأكد أن `APPLE_TEAM_ID` موجود في Replit Secrets.

---

## 🤖 SECTION 2 — Google

### 2.1 Google OAuth — تسجيل الدخول بـ Google (موجود في الكود ✅)

**خطوات الإعداد:**
1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com)
2. أنشئ مشروعاً أو استخدم موجوداً
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Authorized redirect URIs:
   ```
   https://qiroxstudio.online/api/auth/google/callback
   ```
6. انسخ **Client ID** و **Client Secret**

**أضف في Replit Secrets:**
```
GOOGLE_CLIENT_ID     = XXXXXXXXXX.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = GOCSPX-...
```

---

### 2.2 Google Play — نشر على Android

**خطوات الإعداد:**
1. اذهب إلى [Google Play Console](https://play.google.com/console)
2. أنشئ تطبيقاً جديداً بـ Package: `online.qiroxstudio.twa`
3. **Setup** → **API access** → ربط مشروع Google Cloud
4. **Service accounts** → **Create new service account**:
   - في Google Cloud Console → **IAM & Admin** → **Service Accounts**
   - أنشئ Service Account → امنحه دور **Editor**
   - أنشئ **JSON Key** وحمّله
5. عد إلى Google Play Console → امنح Service Account صلاحية **Release manager**

**أضف في Codemagic Dashboard:**
```
GCLOUD_SERVICE_ACCOUNT_CREDENTIALS = { محتوى ملف JSON كاملاً } (Multiline ✅)
```

**Keystore (موجود في `android-twa/qirox-android.keystore`):**
```bash
# لتحويل الـ keystore إلى base64 (شغّل هذا الأمر محلياً):
base64 -i android-twa/qirox-android.keystore | pbcopy
```
**أضف في Codemagic Dashboard:**
```
KEYSTORE_BASE64    = (الناتج من الأمر أعلاه)
KEYSTORE_PASSWORD  = (كلمة المرور التي أنشأت بها الـ keystore)
KEY_ALIAS          = qirox
KEY_PASSWORD       = (كلمة مرور المفتاح)
```

---

## 🔧 SECTION 3 — CodeMagic Setup

### 3.1 ربط الـ Repository

1. اذهب إلى [codemagic.io](https://codemagic.io)
2. **Add application** → اختر **GitHub**
3. اختر repository: `Darsh20009/QIROXsystem`
4. Codemagic يقرأ `codemagic.yaml` تلقائياً

### 3.2 إضافة Environment Variables

1. في Codemagic → اختر تطبيقك → **Settings** → **Environment variables**
2. أضف كل متغير من الجدول في القسم الأول
3. للمتغيرات الطويلة (المفاتيح `.p8` وملفات JSON) → فعّل **Multiline**
4. للمتغيرات الحساسة → فعّل **Secure** (لن تظهر في اللوق)

### 3.3 تشغيل الـ Build

| Workflow | الاستخدام |
|---------|-----------|
| `ios-build` | اختبار بدون signing — للتأكد أن الكود يبني |
| `ios-release` | بناء IPA + رفع لـ TestFlight تلقائياً |
| `android-release` | بناء AAB + رفع لـ Google Play (Internal Track) |
| `web-build` | بناء الموقع + السيرفر |

---

## 💳 SECTION 4 — الدفع

### 4.1 PayPal (موجود في الكود ✅)

**أضف في Replit Secrets:**
```
PAYPAL_CLIENT_ID     = (من PayPal Developer Dashboard)
PAYPAL_CLIENT_SECRET = (من PayPal Developer Dashboard)
PAYPAL_ENV           = live  (أو sandbox للاختبار)
```

**Webhook للـ Callback:**
في PayPal Developer Dashboard → **Webhooks** → أضف:
```
https://qiroxstudio.online/api/paypal/webhook
```
الأحداث: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`

---

## 🏗️ SECTION 5 — ترتيب الإعداد (من الأهم للأقل)

```
المرحلة 1 — الضروري للبناء:
  ✅ APP_STORE_CONNECT_KEY_IDENTIFIER  → Codemagic
  ✅ APP_STORE_CONNECT_ISSUER_ID       → Codemagic
  ✅ APP_STORE_CONNECT_PRIVATE_KEY     → Codemagic (Multiline)
  ✅ APPLE_TEAM_ID                     → Codemagic

المرحلة 2 — للتطبيق يعمل بشكل كامل:
  ✅ MONGODB_URI         → Replit Secrets
  ✅ PAYPAL_CLIENT_ID    → Replit Secrets
  ✅ PAYPAL_CLIENT_SECRET → Replit Secrets

المرحلة 3 — تسجيل الدخول الاجتماعي:
  ✅ GOOGLE_CLIENT_ID     → Replit Secrets
  ✅ GOOGLE_CLIENT_SECRET → Replit Secrets
  ✅ APPLE_CLIENT_ID      → Replit Secrets
  ✅ APPLE_KEY_ID         → Replit Secrets
  ✅ APPLE_PRIVATE_KEY    → Replit Secrets

المرحلة 4 — Google Play:
  ✅ GCLOUD_SERVICE_ACCOUNT_CREDENTIALS → Codemagic (Multiline)
  ✅ KEYSTORE_BASE64                    → Codemagic
  ✅ KEYSTORE_PASSWORD                  → Codemagic
```

---

## ⚡ ما تم إصلاحه في هذه الجلسة

| المشكلة | الإصلاح |
|---------|---------|
| `APP_STORE_CONNECT_PUBLISHER_PRIVATE_KEY` (اسم خاطئ) | ✅ تم تغييره إلى `APP_STORE_CONNECT_PRIVATE_KEY` |
| Key ID و Issuer ID كانوا hardcoded | ✅ تم تحويلهم إلى متغيرات `$APP_STORE_CONNECT_KEY_IDENTIFIER` و `$APP_STORE_CONNECT_ISSUER_ID` |
| لا يوجد `app_store_connect` block | ✅ تم إضافته في environment |
| لا يوجد workflow لـ Android | ✅ تم إضافة `android-release` workflow كامل |
