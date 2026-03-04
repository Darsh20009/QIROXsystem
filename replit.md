# Qirox Platform

## Overview

Qirox is a SaaS "Systems Factory" platform (qirox.tech) that showcases 8 industry-specific website templates and provides admin management for templates and pricing. The platform targets Arabic-speaking markets (Saudi Arabia, Egypt) with RTL UI, positioning itself as a "Website Infrastructure Automation Platform" for investors and clients.

The application is a full-stack TypeScript project with a React frontend and Express backend. It includes:
- **Public Pages**: Home (8 sectors showcase), Portfolio (filtering by category), Pricing (3 tiers), About (investor-focused company profile), Contact
- **Admin Pages**: Templates CRUD management, Pricing management, Services, Orders, Finance, Employees
- **Client Pages**: Dashboard, Project tracking, Order flow
- **Authentication**: Session-based with role-based access control

## Latest Changes (Mar 4, 2026 - Session 37)

### نظام توثيق الجهاز (Device 2FA) عند تسجيل الدخول

تسجيل دخول آمن بـ OTP لكل المستخدمين مع تذكّر الجهاز 14 يوماً.

**الموديل الجديد (`DeviceTokenModel` في `server/models.ts`):**
- `userId`, `tokenHash` (SHA-256), `userAgent`, `expiresAt` (14 يوماً)
- TTL index تلقائي — يُحذف بعد الانتهاء

**دالة البريد الجديدة (`sendLoginOtpEmail` في `server/email.ts`):**
- بريد تنبيه أمني بتصميم داكن + اسم الجهاز + تحذير

**المسارات الجديدة (`server/routes.ts`):**
- `POST /api/auth/verify-login-otp` — التحقق من OTP وإعادة device token
- `POST /api/auth/resend-login-otp` — إعادة إرسال OTP
- `POST /api/auth/generate-device-token` — توليد token للمستخدمين المصادق عليهم

**تعديل login route:**
- يقبل `x-device-token` header
- يبحث عن tokenHash في DeviceTokenModel
- إن كان صحيحاً → دخول مباشر | إن لم يكن → `pendingLoginUserId` في session + إرسال OTP

**الواجهة (`client/src/hooks/use-auth.ts`):**
- `getStoredDeviceToken()`, `saveDeviceToken()`, `clearDeviceToken()` — localStorage
- `useLogin` يضيف `x-device-token` header تلقائياً

**الواجهة (`client/src/pages/Login.tsx`):**
- `verifyMode: "email" | "device"` — يميز بين توثيق الحساب وتوثيق الجهاز
- OTP UI يُعدّل عنوانه وألوانه حسب النوع
- يحفظ device token في localStorage بعد النجاح

## Latest Changes (Mar 4, 2026 - Session 36)

### نظام التقسيط "قسط عبر كيروكس" — Installment System

نظام تقسيط كامل للباقات فقط، حتى 8 أقساط شهرية بضمان ربط موقع العميل.

**الموديلات الجديدة (`server/models.ts`):**
- `InstallmentOfferModel` — عروض التقسيط التي ينشئها الأدمن (غير مفعلة بالإفتراض)
- `InstallmentApplicationModel` — طلبات التقسيط من العملاء
- `InstallmentPaymentModel` — جدول الأقساط الفردية لكل طلب

**المسارات الجديدة (`server/routes.ts` + `registerInstallmentRoutes`):**
- `GET /api/admin/installment/offers` — قائمة العروض (أدمن/مدير)
- `POST /api/admin/installment/offers` — إنشاء عرض جديد
- `PATCH /api/admin/installment/offers/:id/toggle` — تفعيل/تعطيل عرض
- `GET /api/admin/installment/applications` — كل الطلبات (جميع الموظفين)
- `PATCH /api/admin/installment/applications/:id/approve` — موافقة + إنشاء جدول أقساط
- `PATCH /api/admin/installment/applications/:id/reject` — رفض مع سبب
- `PATCH /api/admin/installment/applications/:id/lock` — قفل موقع العميل (suspend)
- `PATCH /api/admin/installment/applications/:id/unlock` — رفع القفل
- `GET /api/installment/offers` — العروض النشطة (للعملاء)
- `POST /api/installment/apply` — تقديم طلب تقسيط
- `GET /api/installment/my` — طلباتي (للعملاء)
- `POST /api/installment/pay/:paymentId` — دفع قسط من المحفظة (مع PIN)

**Cron Job يومي الساعة 8ص:**
- فحص التأخيرات → قفل المواقع فوراً عند أي تأخر
- بعد مهلة السماح (افتراضي 7 أيام) → إضافة غرامة تأخير

**رسوم الخدمة حسب الفترة:**
- شهرية: 25 ريال | نصف سنوية: 50 ريال | سنوية/مدى الحياة: 100 ريال

**الصفحات الجديدة:**
- `client/src/pages/AdminInstallments.tsx` — لوحة إدارة التقسيط (admin)
- `client/src/pages/ClientInstallments.tsx` — متابعة الأقساط (client)

**التنقل:**
- `/admin/installments` — لجميع الموظفين
- `/installments` — للعملاء في sidebar القسم المالي

## Latest Changes (Mar 4, 2026 - Session 35)

### تحسينات شاملة للجوال (Mobile Responsiveness)

**1. `client/src/App.tsx` — إصلاح padding الجوال:**
- الـ `<main>` يستخدم الآن `padding-bottom: calc(96px + env(safe-area-inset-bottom))` لمنع المحتوى من الاختفاء خلف شريط التنقل السفلي على iOS
- `id="main-content"` لتطبيق CSS مستهدف

**2. `client/src/index.css` — CSS شامل للجوال:**
- `#main-content` يحصل على `calc(88px + env(safe-area-inset-bottom))` من الأسفل
- جميع `<dialog>` عروضها `calc(100vw - 2rem)` بدلاً من التجاوز
- حفظ أداء الـ backdrop-blur على الجوال
- حماية من horizontal overflow

**3. `client/src/pages/Cart.tsx` — تحسينات الجوال:**
- شريط دفع ثابت (sticky bar) يظهر فقط على الجوال (`lg:hidden`) فوق شريط التنقل السفلي مباشرة — يعرض الإجمالي وزر "أكمل الطلب"
- نافذة الـ checkout: `w-[95vw] max-w-lg max-h-[92dvh]` لتتكيف مع أي حجم شاشة
- `ScrollArea` تستخدم `max-h-[50dvh]` (dynamic viewport height) بدلاً من `vh` العادية
- نوافذ Add-on: `w-[95vw] max-w-md max-h-[88dvh]`

**4. `client/src/pages/Prices.tsx` — جدول المقارنة:**
- الـ wrapper تغير إلى `overflow-x-auto` مع `min-w-[480px]` داخله
- الجدول يمكن التمرير أفقياً بدلاً من الاقتصاص

**5. `client/src/pages/Dashboard.tsx` — padding:**
- تغيير `px-6 py-6` → `px-4 md:px-6 py-4 md:py-6`
- تغيير `px-6 py-8` → `px-4 md:px-6 py-5 md:py-8`

## Latest Changes (Mar 4, 2026 - Session 34)

### إصلاح كيروكس باي + بحث الخدمات

**1. server/routes.ts — إصلاح ذري (atomic) لدفع المحفظة:**
- عند `POST /api/orders` إذا أُرسل `walletAmountUsed > 0`:
  - يتحقق من الرصيد أولاً **قبل** إنشاء الطلب
  - يُنشئ الطلب، ثم يخصم المحفظة في نفس الطلب
  - إذا فشل الخصم (حالة نادرة)، يُعلّم الطلب لمراجعة الأدمن
  - يُعيد خطأ 400 واضح إذا الرصيد غير كافٍ قبل إنشاء الطلب

**2. client/src/pages/Cart.tsx — إصلاح حسابات المحفظة:**
- إزالة استدعاء `POST /api/wallet/pay` المنفصل (البديل: يُعالَج داخل `POST /api/orders`)
- إضافة `useEffect` لمزامنة `walletAmount` تلقائياً عندما يتغير الإجمالي
- إصلاح الدقة العشرية: `parseFloat(x.toFixed(2))` بدلاً من `Math.round()`
- إضافة `r.ok` check مع رسالة خطأ واضحة من الـ backend

**3. client/src/pages/AdminServices.tsx — بحث وتصفية:**
- إضافة `searchQuery` state لبحث الخدمات بالاسم أو الوصف
- إضافة `filterCategory` state مع قائمة اختيار الفئات
- `filteredServices` مع `useMemo` للأداء
- زر مسح البحث (X)، عداد "X نتيجة" عند تفعيل الفلتر

## Latest Changes (Mar 4, 2026 - Session 33)

### قسم الأجهزة والمتجر — إعادة تصميم كاملة بواجهة متجر احترافية

**1. Devices.tsx — إعادة كتابة كاملة:**
- واجهة متجر احترافية شبه Noon (بطاقات منتج حديثة، شبكة 2-5 عمود)
- **كاروسيل صور** على بطاقة المنتج مع نقاط التنقل للصور المتعددة
- **ورقة تفاصيل المنتج** (Sheet slide-in) تفتح عند النقر على المنتج تشمل:
  - `ImageCarousel` كامل مع مصغّرات وأسهم تنقل
  - المواصفات في شبكة، وصف كامل، شارة الباقة المرتبطة
- **نموذج الشحن مُحسَّن:** قائمة اختيار المدن السعودية (22 مدينة) + حقل الحي
- **تعبئة تلقائية:** بيانات اسم المستلم ورقم الهاتف من ملف المستخدم المسجّل
- **الشراء الآن:** زر "اشتر الآن" مع إمكانية إضافة للسلة مباشرة من الورقة

**2. AdminProducts.tsx:**
- إضافة `linkedPlanSlug` — ربط المنتج بباقة نظام من `/api/pricing`
- عرض شارة "باقة" سيانية على بطاقات المنتج المرتبطة

**3. server/routes.ts — إنشاء شحنة تلقائي:**
- عند إتمام الطلب (POST /api/orders)، يُفحص كل عنصر في الطلب
- المنتجات الفيزيائية (type: product, gift) تُنشئ `DeviceShipment` تلقائياً
- يُرسل إشعار داخل التطبيق للعميل عن طلب الشحن

**4. shared/schema.ts + server/models.ts:**
- إضافة `linkedPlanSlug?: string` لـ QiroxProduct و InsertQiroxProduct

## Latest Changes (Mar 4, 2026 - Session 34)

### QMeet — مميزات متقدمة للاجتماعات

**التغييرات:**
- `server/index.ts`: إضافة 3 event handlers جديدة:
  - `webrtc_kick` → طرد مشارك (يرسل `webrtc_kicked` للمستهدف)
  - `webrtc_draw` → مزامنة رسمة السبورة بين المشاركين
  - `webrtc_whiteboard_clear` → مسح السبورة لجميع المشاركين
- `client/src/pages/MeetingRoom.tsx` — إعادة كتابة شاملة:
  - Panel جانبي متعدد التبويبات (Chat / المشاركون / السبورة / عارض الصفحة / إجراءات)
  - **السبورة**: canvas تفاعلية مع أدوات (قلم، ممحاة، ألوان، سُمك)، مزامنة عبر WebSocket
  - **عارض الصفحة**: iframe لعرض أي صفحة من النظام داخل الاجتماع
  - **الإجراءات السريعة**: روابط سريعة + نموذج رفع شكوى مباشرة من الاجتماع
  - **طرد المشاركين**: زر kick في بطاقة الفيديو وفي قائمة المشاركين (للإدارة فقط)
  - شاشة "تم إزالتك من الاجتماع" عند الطرد
- الاجتماع يفتح في تاب جديد من: AdminQMeet, AdminQMeetDetail, Consultation, Dashboard
- `client/src/pages/AdminQMeetDetail.tsx`: إضافة زر "حذف الاجتماع"

## Latest Changes (Mar 4, 2026 - Session 33)

### QMeet — نظام اجتماعات WebRTC مدمج (بدون Jitsi)

**تم إزالة:** الاعتماد على خدمة `meet.jit.si` الخارجية نهائياً.

**ما تم بناؤه:**
- `server/ws.ts`: إضافة إدارة غرف WebRTC (`joinMeetRoom`, `leaveMeetRoom`, `getMeetRoomPeers`, `leaveAllMeetRooms`)
- `server/index.ts`: إضافة WebRTC signaling عبر WebSocket (`webrtc_join`, `webrtc_offer`, `webrtc_answer`, `webrtc_ice`, `webrtc_leave`, `webrtc_chat`, `webrtc_media_state`)
- `server/qmeet.ts`: تغيير رابط الاجتماع من `https://meet.jit.si/${roomName}` إلى `/meet/${roomName}` + endpoint جديد `GET /api/qmeet/room/:roomName`
- `client/src/pages/MeetingRoom.tsx`: صفحة اجتماع كاملة بـ WebRTC (كاميرا، ميكروفون، مشاركة شاشة، دردشة)
- `client/src/App.tsx`: مسار `/meet/:roomId` جديد
- `client/src/pages/AdminQMeet.tsx`: تحديث زر "انضم" للتنقل الداخلي
- `client/src/pages/AdminQMeetDetail.tsx`: تحديث زر "انضم للاجتماع"
- `client/src/pages/Consultation.tsx`: تحديث رابط الاجتماع

**بنية WebRTC:**
- Mesh topology (peer-to-peer مباشر بين المشاركين)
- STUN servers: Google free STUN (لا خادم TURN خارجي)
- Signaling عبر WebSocket الموجود في النظام

## Latest Changes (Mar 3, 2026 - Session 32)

### QMeet — ترحيل كامل إلى MongoDB الرئيسي + تحسينات شاملة

**المشكلة المُصلحة:** كانت QMeet تستخدم اتصال MongoDB منفصل (`cluster0.ul0t5m5`) فاشل. تم الترحيل الكامل.

**التغييرات في `server/models.ts`:**
- أضيفت 3 موديلات QMeet مباشرةً: `QMeetingModel`, `QFeedbackModel`, `QReportModel`
- تستخدم الآن اتصال Mongoose الرئيسي (`qiroxsystem.ekvjdkj`)
- حقل `agenda[]` + `endsAt` + `reminder24hSent` مدمجة في المخطط

**إعادة كتابة كاملة لـ `server/qmeet.ts`:**
- حذف `connectQMeetDB()` نهائياً، استبدله `startQMeetScheduler()`
- Smart Scheduler (كل 60 ثانية) يعمل تلقائياً:
  - `scheduled → live` عند الموعد تلقائياً
  - `live → completed` عند انتهاء المدة تلقائياً
  - إشعارات WebSocket للمشاركين عند كل تغيير حالة
  - تذكير بالبريد بعد دقيقتين + تذكير 24 ساعة مسبقاً
- نقطة نهاية `/api/qmeet/upcoming` للاجتماعات القادمة

**تحديث `server/index.ts`:**
- السطر 9: `connectQMeetDB` → `startQMeetScheduler`
- السطر 130: حذف `await connectQMeetDB()` + إضافة `startQMeetScheduler()`

**إعادة تصميم `client/src/pages/AdminQMeet.tsx`:**
- واجهة احترافية كاملة مع Header بـ gradient + إحصاءات
- بطاقات الاجتماعات مع شريط أخضر متحرك للمباشر
- حوار إنشاء متكامل: جدول أعمال + بحث عملاء + إضافة يدوية
- فلترة بالحالة + بحث نصي
- أزرار: بدء البث / إنهاء / إلغاء / حذف / إرسال دعوة

## Latest Changes (Mar 3, 2026 - Session 31)

### نظام الترقية + المستثمرين + إعدادات النظام (4 أنظمة جديدة)

**Models جديدة في `server/models.ts`:**
- `QiroxSystemSettingsModel` — إعدادات الشركة (معلومات، تواصل، سوشيال، تقييم مالي، توزيع أرباح)
- `InvestorProfileModel` — ملفات المستثمرين (حصة %, إجمالي مستثمر, verified/active)
- `InvestmentPaymentModel` — دفعات الاستثمار (مبلغ, إيصال, توقيع إلكتروني canvas + نصي, حالة pending/approved/rejected)
- `PromotionLogModel` — سجل تغييرات الأدوار مع نوع promote/demote/role_add/role_remove

**تحسين `UserModel`:** إضافة `jobTitle`, `bio`, `profilePhotoUrl`, `additionalRoles[]`

**Routes السيرفر الجديدة:**
- `GET/PUT /api/admin/qirox-settings` — إعدادات كيروكس
- `PATCH /api/users/extended-profile` — تحديث ملف المستخدم الموسّع
- `GET /api/admin/all-users` — كل المستخدمين مع بحث وفلترة
- `PATCH /api/admin/users/:id/role` — تغيير دور (هرمي: manager 4, admin 5)
- `PATCH /api/admin/users/:id/additional-roles` — أدوار إضافية
- `GET /api/admin/promotion-log` — سجل الترقيات مع populate
- `GET /api/admin/investors` — قائمة المستثمرين
- `POST /api/admin/investors` — إنشاء ملف مستثمر (يضبط الدور تلقائياً)
- `PATCH /api/admin/investors/:id` — تعديل حصة/توثيق/نشاط
- `GET/PATCH /api/admin/investment-payments` — مراجعة وموافقة/رفض الدفعات
- `GET /api/investor/profile` — ملفي كمستثمر + إحصائيات (myValue, allInvestors, totalStake)
- `GET /api/investor/payments` — دفعاتي
- `POST /api/investor/payments` — إرسال دفعة جديدة (multipart: proof + signatureData + signatureText)

**صفحات Frontend الجديدة:**
- `AdminQiroxSettings.tsx` (/admin/qirox-settings) — 5 أقسام: معلومات, تواصل, سوشيال, تقييم, توزيع أرباح مرئي
- `AdminPromotions.tsx` (/admin/promotions) — قائمة مستخدمين + تغيير أدوار + أدوار إضافية + سجل الترقيات
- `AdminInvestors.tsx` (/admin/investors) — إدارة المستثمرين + مراجعة الدفعات + إضافة مستثمر
- `InvestorPortal.tsx` (/investor/portal) — لوحة المستثمر: حصة, قيمة, توزيع بصري, بوابة دفع مع توقيع canvas

**Sidebar إضافات:**
- "إعدادات النظام" (admin) — /admin/qirox-settings
- "الترقيات والأدوار" (admin) — /admin/promotions
- "المستثمرون" (admin only) — /admin/investors
- "بوابة المستثمر" (investor/admin/manager) — /investor/portal

**دور جديد:** `investor` مضاف للـ roles array في shared/schema.ts

---

## Latest Changes (Mar 3, 2026 - Session 30)

### نظام طلبات البيانات + تحسين تجربة الشراء
- **نموذج `ClientDataRequestModel`**: موظف/أدمن يرسل طلب بيانات للعميل (عنوان، وصف، أولوية، تاريخ نهائي، عناصر محددة بأنواع file/image/text/link)
- **Routes الجديدة**:
  - `POST /api/data-requests` — إنشاء طلب (موظف/أدمن)
  - `GET /api/data-requests/mine` — العميل يرى طلباته
  - `GET /api/admin/data-requests` — الموظف يرى كل الطلبات (مع فلترة)
  - `POST /api/data-requests/:id/submit` — العميل يرفع الرد مع الملفات
  - `PATCH /api/admin/data-requests/:id` — تحديث الحالة (approved/revision_needed)
  - `DELETE /api/admin/data-requests/:id` — حذف الطلب
  - `GET /api/users/clients` — قائمة العملاء للـ dropdown
- **Email الجديد**: `sendDataRequestEmail` — إيميل ببريدي للعميل عند وصول طلب جديد
- **صفحة `ClientDataRequests.tsx`**: العميل يرى طلباته مع tabs (بانتظارك / تم الإرسال / الكل)، يفتح أي طلب ويرفع الملفات أو يكتب النصوص مباشرة
- **صفحة `AdminDataRequests.tsx`**: الموظف ينشئ طلبات، يبحث، يفلتر، يرى ردود العملاء، يعتمد أو يطلب مراجعة
- **Sidebar**: إضافة "طلبات البيانات" للعميل (/my-requests) وللموظف (/admin/data-requests)
- **تحسين Cart.tsx**:
  - Header Pre-Checkout: gradient داكن مع dot pattern + step indicators بدوائر ملونة (Cyan عند الاكتمال)
  - Upload Zone: تصميم جديد مع hover animation ولون Cyan
  - زر التأكيد النهائي: gradient من cyan→blue مع shadow + أيقونة Sparkles
  - Order Summary Panel: header gradient داكن مع dot pattern + cyan glow
  - Trust Indicators: دفع آمن / 24 ساعة / ضمان الجودة في أسفل الـ dialog

## Latest Changes (Mar 3, 2026 - Session 29)

### نظام Qirox Pay — محفظة العميل الإلكترونية الكاملة
- **بطاقة Qirox Pay الافتراضية**: تصميم كبطاقة Visa حقيقية بألوان العلامة التجارية (Deep Blue + Electric Cyan)
- **إنشاء البطاقة**: رقم 16 خانة فريد يبدأ بـ `4747XXXXXXXXXXXX`
- **رقم سري (PIN)**: 4 أرقام مشفر بـ bcrypt — يُعيَّن/يُغيَّر من واجهة المستخدم
- **شحن الرصيد**: العميل يُرسل طلب تحويل بنكي (اسم البنك + رقم المرجع) → الأدمن يراجعه ويعتمده → يُضاف الرصيد تلقائياً + إيميل للعميل
- **الدفع الخارجي بالبطاقة**: شخص آخر يُدخل رقم البطاقة + المبلغ → يُرسل OTP لبريد صاحب البطاقة → صاحبها يُشاركه مع الدافع → يُنقص من الرصيد تلقائياً
- **نماذج قاعدة البيانات الجديدة**: `walletCardNumber`, `walletPin`, `walletCardActive` في userSchema + `WalletTopupModel` + `WalletPayOtpModel`
- **Routes الجديدة**:
  - `GET /api/wallet/card` — معلومات البطاقة والرصيد
  - `POST /api/wallet/card/init` — إنشاء البطاقة
  - `POST /api/wallet/card/set-pin` — تعيين/تغيير PIN
  - `POST /api/wallet/card/pay` — دفع بالبطاقة الخاصة (PIN مطلوب)
  - `POST /api/wallet/card/request-otp` — طلب OTP للدفع الخارجي
  - `POST /api/wallet/card/verify-otp` — تحقق OTP وتنفيذ الدفع الخارجي
  - `POST /api/wallet/topup-request` — طلب شحن رصيد
  - `GET /api/wallet/topup-requests` — سجل طلبات الشحن
  - `GET /api/admin/wallet/topup-requests` — كل طلبات الشحن للأدمن
  - `POST /api/admin/wallet/topup-approve/:id` — اعتماد طلب + إضافة رصيد + إيميل
  - `POST /api/admin/wallet/topup-reject/:id` — رفض طلب + إيميل
- **Emails الجديدة**: `sendWalletPayOtpEmail` + `sendWalletTopupStatusEmail`
- **واجهة ClientWallet**: ثلاث تبويبات (بطاقتي / المعاملات / طلبات الشحن) + modal لكل إجراء
- **واجهة AdminWallet**: تبويب جديد لطلبات الشحن مع أزرار اعتماد/رفض

## Latest Changes (Mar 3, 2026 - Session 28)

### نظام الجرافيكس الإبداعي — جميع الصفحات
- أُضيف `PageGraphics` من `AnimatedPageGraphics` لـ **22 صفحة** لم تكن تملكه:
  - **Admin**: AdminAppPublish, AdminConsultation, AdminCronJobs, AdminDiscountCodes, AdminExtraAddons, AdminModConfig, AdminMongoAtlas, AdminProjectFeatures, AdminShipments, AdminSystemFeatures, AdminWallet
  - **Public**: Consultation, Jobs, Prices, ClientsGroup, ClientWallet
  - **Auth**: Login, VerifyEmail
  - **Client/Feature**: BarcodeStudio (full-dark), CSChat, OrderFlow, ProjectWorkspace
- Variants مُستخدمة حسب نوع الصفحة: `dashboard` للأدمن، `hero-light` للعامة، `auth` للتسجيل، `full-dark` للداكنة، `minimal` للوظيفية

## Latest Changes (Mar 3, 2026 - Session 27)

### FloatingClientChat — زر تواصل عائم لجميع الصفحات
- **FloatingClientChat** (`client/src/components/FloatingClientChat.tsx`): زر عائم في الركن السفلي الأيسر
- يظهر فقط للعملاء المسجلين (role === "client")
- **الزر**: دائري 56px، أيقونة سماعات، حدود بيضاء شفافة، تأثير توهج عند الضغط
- **Badge**: عداد رسائل غير مقروءة بأحمر متحرك، ينبض عند وصول رسالة جديدة
- **Panel مفتوح**: 380px عرض، 420px ارتفاع، خلفية #0d0d0d
  - Header أسود مع أيقونة سماعات وحالة الاتصال (أخضر/برتقالي/رمادي) + مؤشر WebSocket
  - **بدون جلسة**: شاشة ترحيب مع 3 أزرار سريعة + زر "ابدأ المحادثة"
  - **مع جلسة نشطة**: فقاعات رسائل مع read receipts (✓/✓✓)، تواريخ مجمعة، وقت نسبي
  - **في الانتظار**: مؤشر نقاط متحركة + رسالة "جارٍ البحث عن موظف"
  - **Input**: يدعم Enter للإرسال، زر إرسال يتغير لونه حسب النص
- صوت تنبيه عند وصول رسالة جديدة في الخلفية
- حركة نطر للزر عند وصول رسالة
- مُضاف في App.tsx على: PublicRouter و AdminRouter معاً

## Latest Changes (Mar 3, 2026 - Session 26)

### Barcode Studio — Developer Tool + Cleanup

**BarcodeStudio (client/src/pages/BarcodeStudio.tsx):**
- New public page at `/barcode-studio` — lifetime barcode/QR generator
- **Barcode tab**: Code128, Code39, EAN-13, EAN-8, UPC-A, ITF-14, MSI, Pharmacode
- Full design customization: foreground color, background color, width, height, margin, font size, text display/position/alignment
- Quick color presets (6 preset themes per tool)
- Download as PNG
- **QR Code tab**: Custom fg/bg colors, size (128–512px), margin, error correction level (L/M/Q/H)
- 8 quick color presets, 6 template shortcuts (URL, WhatsApp, email, phone, text, geo)
- Download as PNG or SVG
- **Gallery tab**: Save any generated barcode/QR, view all saved items, download from gallery, delete individual or clear all
- Packages used: `jsbarcode`, `qrcode.react`
- Added link to DevChecklist DEV_TOOLS list

**Cleanup:**
- `AdminOrders.tsx` line 703: `Replit Deployments` → `QIROX Cloud`
- `vite.config.ts`: Removed all `@replit/*` dev plugins (runtime-error-modal, cartographer, dev-banner)

## Latest Changes (Mar 3, 2026 - Session 25)

### Navigation, Jobs Page, Devices in Nav, QIROX Clients Group

**Navigation Changes:**
- Removed "الأنظمة" (/systems) from main navigation
- Added "الأجهزة" (/devices) to main navigation
- Fixed Footer wrong translation keys for /jobs ("التوظيف") and /news ("الأخبار")
- Added "مجموعة العملاء" link to footer (for logged-in users only)

**Jobs Page (client/src/pages/Jobs.tsx):**
- Full rebuild from stub — now shows real job listings from API
- Filterable by status (only open jobs shown)
- Job detail modal with full description and requirements
- Apply modal with full form (name, email, phone, CV link, cover letter)
- Uses `/api/apply` endpoint correctly

**QIROX Clients Group (client/src/pages/ClientsGroup.tsx):**
- New page at `/clients-group`
- WhatsApp-like group announcement feed
- Shows all news items as group messages from QIROX avatar
- Admin-only posting — admin can publish announcements from within the page
- Announcements auto-appear in both this group AND the News page (shared data source)
- Non-authenticated users see a locked access message
- Added to app-sidebar under client section
- Route registered in App.tsx, added to publicRoutes

## Latest Changes (Mar 3, 2026 - Session 20)

### MongoDB Atlas, Cron Jobs, and App Publishing

**New npm packages:** `node-cron`, `@types/node-cron`, `digest-fetch`

**Backend:**
- **server/models.ts** — 4 new schemas: `cronJobSchema`, `atlasConfigSchema`, `atlasDbUserSchema`, `appPublishConfigSchema`
- **server/cron.ts** — New cron scheduler service: `scheduleCronJob`, `stopCronJob`, `runJobNow`, `testJobConnection`, `initCronJobs`; uses `node-cron` with Asia/Riyadh timezone; auto-loads active jobs on startup
- **server/atlas.ts** — MongoDB Atlas Admin API client using HTTP Digest Auth (`digest-fetch`): list projects, list clusters, create DB users, get connection strings, delete DB users, test connection
- **server/index.ts** — Calls `initCronJobs()` after startup to restore scheduled tasks from DB
- **server/routes.ts** — 18 new API endpoints:
  - `GET/POST/PATCH/DELETE /api/admin/cron-jobs` — CRUD for cron jobs
  - `POST /api/admin/cron-jobs/:id/run` — Run job immediately
  - `POST /api/admin/cron-jobs/test` — Test URL connectivity
  - `GET/POST/PUT/DELETE /api/admin/atlas/configs` — Atlas API key configs
  - `POST /api/admin/atlas/test` — Test Atlas credentials
  - `GET /api/admin/atlas/projects` — List Atlas projects
  - `GET /api/admin/atlas/clusters` — List Atlas clusters
  - `GET/POST/DELETE /api/admin/atlas/db-users` — Manage DB users
  - `GET/POST/PUT/DELETE /api/admin/app-configs` — App publish configurations
  - `GET /api/admin/app-configs/:id/export` — Export config as JSON or .env
  - `GET /api/my-app-config` — Client's app config

**Frontend:**
- `client/src/pages/AdminCronJobs.tsx` — Cron job management page:
  - List with live status (success/error/never/pending)
  - Enable/disable toggle per job
  - Preset schedules dropdown (every minute to weekly) + custom cron expression
  - Test connection button with response preview
  - Run immediately button with timer display
  - Success/error counters per job
- `client/src/pages/AdminMongoAtlas.tsx` — Atlas database management:
  - Tab 1: Created databases with masked connection strings (show/hide + copy)
  - Tab 2: Atlas API configs management
  - Test Atlas credentials (auto-fills project list)
  - Create DB user dialog → creates user on Atlas + generates connection string
- `client/src/pages/AdminAppPublish.tsx` — App publishing & package generator:
  - **مولّد الحزم (Package Builder)**: generates real downloadable ZIP project packages for all 4 platforms
  - Android APK: Full Android Studio (TWA) project with AndroidManifest + Gradle + CI/CD
  - Windows EXE: Full Electron project with NSIS installer + system tray + auto-updater
  - iOS IPA: Full Capacitor project with Info.plist + Podfile + AppDelegate.swift
  - HarmonyOS HAP: Full DevEco Studio project with EntryAbility.ets + WebView
  - Permissions configurator: 8 permission types selectable per build
  - Build history stored in localStorage
  - Uses jszip (already in node_modules) for client-side ZIP generation
  - Tabs: مولّد الحزم, حالة الجاهزية, Google Play, App Store, Huawei, Microsoft, ملفات الربط
- **app-sidebar.tsx** — 3 new admin menu items: MongoDB Atlas, Cron Jobs, نشر التطبيقات
- **App.tsx** — 3 new admin routes: `/admin/cron-jobs`, `/admin/atlas`, `/admin/app-publish`

## Latest Changes (Mar 3, 2026 - Session 22)

### Modification Quota System

#### Backend
- **server/models.ts** — Added 3 new schemas:
  - `ModPlanConfigModel` — admin-configurable quotas per (planTier × planPeriod)
  - `ModTypePriceModel` — lifetime plan: modification type prices (max 50 SAR each, admin-defined)
  - `ModQuotaAddonModel` — unlimited modification addon purchase (1000 SAR/month, for sixmonth/annual only)
  - `modificationRequestSchema` — added `cancelled` to status enum, added `modificationTypeId` and `modificationPrice` fields
- **server/routes.ts**:
  - `seedModPlanConfigs()` — auto-seeds 9 default configs on first run (lite/pro/infinite × monthly/sixmonth/annual)
  - `POST /api/modification-requests/:id/cancel` — client can cancel pending/in_review requests
  - `GET /api/mod-quota` — returns client's current quota status per active order
  - `POST /api/mod-quota/addon` — client purchases unlimited addon (pending admin approval)
  - `GET/POST/PATCH/DELETE /api/admin/mod-plan-configs` — admin CRUD for quota configs
  - `GET/POST/PATCH/DELETE /api/admin/mod-type-prices` — admin CRUD for lifetime mod type prices
  - `GET /api/admin/mod-quota-addons` — admin views all addon requests
  - `PATCH /api/admin/mod-quota-addons/:id` — admin approves/rejects addon (sets validFrom/validUntil)
  - `POST /api/modification-requests` — now checks quota before creating (blocks if quota exceeded, skips for admins/employees, lifetime plans use type pricing)

#### Quota Logic
- **Monthly**: quota window = current month
- **Sixmonth**: quota window = 3 months from order creation (or 3 months ago if older)
- **Annual**: quota window = 6 months from order creation (or 6 months ago if older)
- **Lifetime**: no monthly quota — each modification has a price (max 50 SAR) set by admin
- **Cancelled mods don't count** toward quota (status=cancelled excluded from count)
- **Active unlimited addon** bypasses quota check for that order

#### Frontend
- **client/src/pages/AdminModConfig.tsx** — new admin page with 3 tabs:
  - Tab 1 "حصص الخطط": table of 9 quota configs (inline edit, enable/disable toggle)
  - Tab 2 "مدى الحياة": modification type prices for lifetime plans (max 50 SAR each)
  - Tab 3 "طلبات الإضافة": addon purchase requests with approve/reject flow
- **client/src/App.tsx** — added `/admin/mod-config` route
- **client/src/components/app-sidebar.tsx** — added "حصص التعديل" under admin section
- **client/src/pages/Dashboard.tsx**:
  - Quota bar in mod request dialog (shows used/remaining, progress bar, red when exhausted)
  - Lifetime plan badge with modification type selector + price display
  - Unlimited addon purchase button (for eligible sixmonth/annual plans)
  - Cancel button on pending/in_review modification requests
  - Proper 429 error handling with descriptive Arabic message

#### Notes
- **Google Sheets Integration**: User dismissed OAuth authorization twice. Placeholder route exists at `/api/admin/export/google-sheets`. Do NOT call proposeIntegration again. If user wants to proceed, ask for manual service account JSON key to store as secret.

## Previous Changes (Mar 3, 2026 - Session 21)

### New 5-Step Order Flow + Admin Feature Management

#### Backend
- **server/models.ts** — Added `SystemFeatureModel` (isInLite/Pro/Infinite, icon, category, sortOrder) and `ExtraAddonModel` (price, currency, category, sortOrder)
- **server/routes.ts**:
  - `/api/system-features` — public GET for active features
  - `/api/admin/system-features` — admin CRUD
  - `/api/extra-addons` — public GET for active addons
  - `/api/admin/extra-addons` — admin CRUD
  - Order creation now notifies BOTH `info@qiroxstudio.online` AND `qiroxsystem@gmail.com`

#### Frontend
- **client/src/pages/AdminSystemFeatures.tsx** — Admin page to manage plan features with per-plan toggles (Lite/Pro/Infinite)
- **client/src/pages/AdminExtraAddons.tsx** — Admin page for optional paid add-ons with price/category management
- **client/src/pages/OrderFlow.tsx** — Complete rewrite with 5-step flow:
  1. Package Selection — shows SystemFeatures per tier from DB
  2. Extra Add-ons — priced optional features from DB
  3. Website Details — sector, visual style, language, toggles, file uploads
  4. Devices/Products — qty selector from product catalog
  5. Payment — bank transfer details + receipt upload
- **client/src/App.tsx** — New routes: `/admin/system-features`, `/admin/extra-addons`
- **client/src/components/app-sidebar.tsx** — New sidebar items: مميزات الباقات, المميزات الإضافية

## Latest Changes (Mar 3, 2026 - Session 19)

### Inbox System Major Upgrade
- **server/models.ts** — Added `attachmentType` (image/file/voice), `attachmentName`, `attachmentSize` to inboxMessageSchema; body is now optional (can send attachment-only)
- **server/ws.ts** — Full rewrite: tracks online users with timestamps, broadcasts `user_online`/`user_offline` events, supports `pushToUser`, `broadcastToAll`, `broadcastToUsers`, `getOnlineUsers`
- **server/index.ts** — WebSocket handler now processes: `auth` (register + send online_users list), `typing` (forward to recipient), `voice_recording` (forward to recipient), `ping`/`pong` (keepalive)
- **server/routes.ts**:
  - Inbox POST: now supports attachments, sends email only to CLIENTS (not between employees), pushes `new_message` via WebSocket for real-time delivery
  - Added `/api/badges` — unified unread counts for messages, tickets, orders
- **client/src/hooks/useInboxSocket.ts** — New WebSocket hook: auto-connects/reconnects, tracks online users, exposes `sendTyping()`, `sendVoiceRecording()`
- **client/src/pages/Inbox.tsx** — Complete rewrite:
  - Removed email compose button (employee-to-employee only)
  - File/image upload via paperclip button
  - Voice recording via MediaRecorder API with send/cancel UI
  - VoicePlayer component with progress bar for audio messages
  - MessageBubble component supporting text, image, voice, file attachments
  - Sound notification (Web Audio API) on new message
  - Browser push notification (`Notification` API)
  - Typing indicator animation (3 bouncing dots)
  - Voice recording indicator
  - Online status dot on avatars + contact list
  - Real-time WebSocket delivery (no more polling for new messages)
  - Connection status indicator in header
- **client/src/components/app-sidebar.tsx**:
  - Added `/api/badges` query (refreshes every 30s)
  - Badge counts (red dot + number) shown on: Inbox, Support Tickets, Orders — in both employee and admin sections

## Previous Changes (Mar 3, 2026 - Session 18)

### New Features: Consultation Booking, Discount Codes, Shipment Tracking

**Backend (server/routes.ts)**
- Added full API routes for consultation slots/bookings (`/api/consultation/*`, `/api/admin/consultation/*`)
- Added discount codes CRUD + `/api/discount-codes/public` + `/api/discount-codes/validate` endpoints
- Added shipment tracking CRUD (`/api/admin/shipments`, `/api/shipments/my`)
- All routes include email notifications (SMTP2GO) to clients and staff on key events

**New Pages (client/src/pages/)**
- `Consultation.tsx` — Public consultation booking page (slot browser + booking dialog + success state)
- `AdminConsultation.tsx` — Employee/admin slot management + booking approval with meeting link
- `AdminDiscountCodes.tsx` — Admin CRUD for discount codes with homepage banner controls
- `AdminShipments.tsx` — Shipment tracking with status history timeline + client email on update

**Updated Files**
- `App.tsx` — Added lazy imports + routes for all 4 new pages; `/consultation` added to publicRoutes
- `Navigation.tsx` — Added "احجز استشارة" link
- `app-sidebar.tsx` — Added Consultations, Discount Codes, Shipments to admin sidebar with icons
- `Home.tsx` — Added discount codes banner strip (fetches `/api/discount-codes/public`, shows custom color/text)
- `Devices.tsx` — Added "My Shipments" section for logged-in users (`/api/shipments/my`)

## Previous Changes (Mar 1, 2026 - Session 17)

### Partners Page Restored
- **App.tsx** — Re-added `/partners` public route with lazy import
- **Navigation.tsx** — Added "الشركاء" (Partners) link between About and Contact in nav bar

### Dashboard Dark Mode Fix
- **Dashboard.tsx** — Added 280+ `dark:` class variants across all 3 dashboard views (Admin, Employee, Client). Covers: backgrounds (`dark:bg-gray-950`, `dark:bg-gray-900`), text colors, borders, dividers, hover states (`dark:hover:`, `dark:group-hover:`), and subtle opacity backgrounds

## Previous Changes (Mar 1, 2026 - Session 16)

### Performance: Code Splitting (React.lazy)
- **App.tsx** — All 50+ page imports converted to `React.lazy()` with `Suspense` fallback (`PageLoader` spinner). Initial bundle drastically reduced — pages load on demand
- **PageLoader** component shows centered spinner during lazy load

### Partners Page → Home Marquee
- Partners marquee added to Home.tsx with CSS animation. Admin `/admin/partners` management kept
- **Home.tsx** — Added `PartnersMarquee` component: auto-scrolling CSS logo strip with gradient edge fades, grayscale-to-color on hover, merges API partners (from admin) with static fallback logos
- **index.css** — Added `@keyframes marquee` CSS animation (30s loop, respects `prefers-reduced-motion`)

## Previous Changes (Mar 1, 2026 - Session 15)

### Security Fix: Password Hash Leak
- **server/routes.ts** — Added `sanitizeUser()` helper that strips `password` field from all user-related API responses
- Applied to: `POST /api/login`, `GET /api/user`, `GET /api/admin/users`, `GET /api/admin/customers`, `POST /api/admin/users`, `PATCH /api/admin/users/:id`, register endpoints, subscription endpoint

### Mobile/Safari Performance Optimization (Comprehensive)
- **index.css** — Added `100dvh` fallback for `.min-h-screen`/`.h-screen` (iOS Safari address bar fix). Disabled all `backdrop-blur-*` classes on mobile via CSS `@media (max-width: 768px)`
- **AnimatedPageGraphics.tsx** — On mobile: `AnimatedLine` renders static SVG (no `pathLength` animation). `GlowOrb` disabled on Safari. `AnimatedBars`/`AnimatedRing` hidden on mobile. `FloatingMetrics` hidden via `md:block`
- **Navigation.tsx** — Solid `bg-white` on mobile, `backdrop-blur-xl` only on `md:` breakpoint
- **MobileBottomNav.tsx** — Removed `backdrop-blur-xl`, uses solid `bg-white dark:bg-gray-950`
- **App.tsx** — Sidebar header uses solid bg on mobile, removed `overflow-hidden` from main content wrapper (was breaking `sticky` on Safari)
- **Dashboard.tsx, Cart.tsx, OrderFlow.tsx, Inbox.tsx, Portfolio.tsx** — Fixed `overflow-hidden` + `sticky` conflict: moved `overflow-hidden` to an absolute wrapper around `PageGraphics` only, so `sticky` elements work correctly on Safari
- **Home.tsx** — `fadeUp`/`stagger` animation variants made instant on mobile (0 duration, no stagger delay). Reduces 78 simultaneous animations to static renders on mobile devices
- **Layout.tsx, Portfolio.tsx, Segments.tsx, News.tsx** — Removed `backdrop-blur` from footer, sticky headers, cards, and modal overlays
- **qirox-brand.tsx** — `MobileSplash` component: lightweight 3-second splash for mobile. SVG filters removed

## Latest Changes (Mar 03, 2026 - Session 15)

### QiroxEdit — Creative UI Redesign + Back Button
- Added "العودة" (Home) button in top bar navigating to `/my-tools` via wouter
- Redesigned top bar: deep dark background with blur, cyan→purple gradient logo glow, animated shimmer accent line at very top
- Export button: cyan→purple gradient with glow shadow
- Left panel: active tab highlighted with gradient glow + cyan border
- Right panel tab: cyan indicator instead of blue
- Canvas area: radial gradient dark background + subtle grid pattern overlay
- Canvas shadow: cyan glow ring (`rgba(6,182,212,0.15)`)
- Added `@keyframes shimmer` to `index.css`

### AdminJobs — Custom Questions Builder
- Added `JobQuestion` interface (text, type, required, options)
- Added `questions[]` field to `JobFormData` and `emptyForm`
- Questions builder UI in job form dialog: add/remove questions, select type (text/textarea/select/radio/checkbox), toggle required/optional
- Options editor for select/radio/checkbox type questions
- `handleEdit` loads existing questions when editing a job
- Mutations send `questions` array to backend
- **server/models.ts**: Added `jobQuestionSchema` subschema + `questions` field to `jobSchema`; also added "paused" to status enum
- **shared/schema.ts**: Added `questions: jsonb("questions").default([])` to `jobs` table

## Latest Changes (Feb 28, 2026 - Session 14)

### Dark Mode (النظام الليلي) — Comprehensive Fix
- **`client/src/index.css`** — Rewrote the entire dark mode global overrides section (from ~15 rules to 97 `!important` rules) covering:
  - **Backgrounds**: `bg-white`, `bg-[#fafafa]`, `bg-gray-50/100/200/300`, `bg-zinc-*`, `bg-slate-*`, `bg-neutral-*`, `bg-black/*` opacity variants
  - **Text colors**: `text-black`, `text-gray-500` through `text-gray-950`, `text-zinc/slate/neutral-700/800/900`, `text-black/*` opacity variants
  - **Borders**: `border-gray-100/200/300`, `divide-gray-100/200`, `border-black/*` opacity variants
  - **Custom classes**: `section-dark`, `section-darker`, `section-card`, all glass/gradient classes
  - **Shadcn Table**: `thead`, `tbody tr`, `td`, `th` hover and border overrides
  - **Shadcn components**: Tabs, Separator, Alert, Badge, Card, Toaster, Tooltip, HoverCard, Dropdown
  - **Form inputs**: Full coverage including `select:focus`, `outline-color`
  - **Hover states**: `hover:bg-gray-*`, `hover:bg-zinc-*`, `hover:bg-slate-*` overrides
  - **Scrollbar**: Track, thumb, hover colors for dark mode

## Latest Changes (Feb 28, 2026 - Session 13)

### Credentials Display + Deployment
- **Backend: `POST /api/admin/applications/:id/hire`** — Now returns `rawPassword` + `email` in response for admin display
- **Backend: `POST /api/admin/users/:id/reset-password`** — Auto-generates new password, hashes & saves, sends via email, returns `rawPassword` + `username` + `email` to admin
- **Backend: `GET /api/health`** — Health check endpoint for Render deployment monitoring
- **AdminJobs.tsx** — Hire success screen now shows: email, username, password (with individual copy buttons per field). Password displayed in black card with high contrast.
- **AdminEmployees.tsx** — Added `KeyRound` reset-password button per employee row. Credential dialog shows email + username + password (with show/hide toggle + copy buttons). Added `merchant` role to employeeRoles list and roleLabels/roleColors.
- **render.yaml** — Updated with all required env vars including `DATABASE_URL`, `PORT`, `VAPID_PUBLIC_KEY/PRIVATE_KEY`. Service renamed to `qirox-studio`. Health check path set to `/api/health`.
- **QIROX Studio Deployment** — Configured with `npm run build` + `npm start`

## Latest Changes (Feb 28, 2026 - Session 12)

### Employee Hiring System + Role-Based Dashboards
- **AdminJobs.tsx** — Fully rewritten with hire-as-employee dialog. Shows applicant email + phone prominently. Accepted applicants get "تعيين كموظف" button that opens dialog with username + role selection. Auto-generates password and emails credentials.
- **Backend: `POST /api/admin/applications/:id/hire`** — Creates user account, hashes password, sends `sendWelcomeWithCredentialsEmail`, marks application as accepted.
- **EmployeeRoleDashboard.tsx** (NEW) — Role-specific dashboards:
  - `merchant`: Delivery task pipeline (pending → in_progress → completed) with action buttons
  - `developer`/`designer`: Modification requests queue + checklist link
  - `accountant`: ERP view (revenue, pending invoices, paid/unpaid counts, receipts)
  - `sales`/`sales_manager`: Marketing tools hub + customers + new order links
- **SalesMarketing.tsx** (NEW) — Marketing tools page: Canva template links (6 sizes), QIROX gradient templates (4), poster upload/manage gallery (with preview, download, delete), platform filtering.
- **Backend Marketing API**: `GET/POST/DELETE /api/marketing/posts` using MongoDB `MarketingPostModel`. Accessible to admin/manager/sales roles.
- **App.tsx** — Added routes: `/employee/role-dashboard`, `/sales/marketing`
- **app-sidebar.tsx** — Added "لوحتي المتخصصة" (role-specific nav, visible to merchant/developer/designer/accountant/sales roles), "أدوات التسويق" (visible to sales roles). Added `Palette` icon import.

## Latest Changes (Feb 26, 2026 - Session 11)

### New Features & Bug Fixes
- **Contact Form**: Fully connected to backend — `POST /api/contact` sends email to `info@qirox.tech` via SMTP2GO with sender details. Success/error states with animated feedback.
- **Cart Checkout**: Now creates a real order via `POST /api/orders` (instead of just UI simulation). Cart is cleared after successful order. Loading state on button.
- **Join Us Page (JoinUs.tsx)**: Completely rebuilt from stub — hero section, 4 perks cards, list of open jobs from API, job application dialog with form (name, email, phone, resume URL, cover letter), open application banner. `POST /api/apply` creates application in DB and emails HR team.
- **Backend: Missing Routes Added**:
  - `POST /api/contact` — Public contact form email sender
  - `POST /api/apply` — Public job application submission
  - `DELETE /api/projects/:projectId/tasks/:taskId` — Delete a task
  - `DELETE /api/projects/:projectId/vault/:vaultId` — Delete a vault item
  - `DELETE /api/projects/:projectId/members/:memberId` — Remove project member
  - `POST /api/admin/projects` — Admin creates project from scratch
- **ProjectDetails**: Added delete buttons (Trash2) for tasks and vault items (only visible to non-client roles). Hover-to-show on task rows.
- **Dark Mode CSS**: Added `.dark` variants for all component classes (`.glass`, `.glass-strong`, `.glass-card`, `.section-dark`, `.section-darker`, etc.) in `index.css`.
- **Home.tsx**: Full dark mode pass — all sections (hero, stats, pathfinder, carousel, services, why) now have `dark:` Tailwind variants.

## Latest Changes (Feb 26, 2026 - Session 10)

- **Dark Mode**: Added `.dark` CSS variable block in `index.css` with full sidebar/card/border theming. `tailwind.config.ts` already had `darkMode: ["class"]`. `ThemeProvider` in `lib/theme.tsx` manages localStorage + `document.documentElement.classList`.
- **Header Upgraded**: `App.tsx` now has a sticky header with dark mode toggle (🌙/☀️), language toggle (AR/EN), and a global search bar for orders/projects (shows results dropdown, min 2 chars).
- **New Pages Wired in App.tsx**: AdminAnalytics `/admin/analytics`, AdminActivityLog `/admin/activity-log`, AdminSupportTickets `/admin/support-tickets`, AdminPayroll `/admin/payroll`, SupportTickets `/support`, EmployeeProfile `/employee/profile`, PaymentHistory `/payment-history`.
- **Sidebar Updated**: New links added — Analytics, ActivityLog, SupportTickets, Payroll (admin), Payroll (finance role), EmployeeProfile (employee), SupportTickets + PaymentHistory (client).
- **Architecture Fix**: `QueryClientProvider` moved to top-level `App()` function so `useUser()` and `useWebSocket()` can be called inside `AppInner` without provider errors.
- **WebSocket**: `useWebSocket(user?.id)` hooked into `AppInner` — auto-connects to `/ws` and sends `{ type: "auth", userId }`.

## Latest Changes (Feb 26, 2026 - Session 9)

- **Email System Overhaul**: Full automatic email notifications via SMTP2GO (`noreply@qiroxstudio.online`).
  - Logo URL: GitHub raw (`https://raw.githubusercontent.com/Darsh20009/QIROXsystem/main/client/public/logo.png`) — works in all email clients
  - Auto emails triggered: welcome (new user), OTP (password reset), order confirmed, order status change, project status/progress update (→ client), task assigned (→ employee), task completed (→ client)
  - Admin direct email panel in Dashboard with form and test buttons for all 7 email types
  - New APIs: `POST /api/admin/send-email` (direct), `GET /api/admin/email-recipients`, `POST /api/admin/test-email`
  - Env vars: `SMTP2GO_API_KEY`, `SMTP2GO_SENDER` (noreply@qiroxstudio.online), `SMTP2GO_SENDER_NAME`, `EMAIL_LOGO_URL`, `EMAIL_SITE_URL`
- **Render Deployment Fix**: Changed build command to `npm ci && npm run build` (fixes ENOTEMPTY npm cache bug). Added `render.yaml` with all required env vars. Added `.npmrc` with `prefer-offline=false`.

## Render Deployment Requirements

Set these env vars manually in Render dashboard (they are marked `sync: false` in render.yaml):
- `MONGODB_URI` — MongoDB Atlas connection string
- `SMTP2GO_API_KEY` — `api-5CC7EFCFDA564ABAA365F3C7660DD332`
- `SESSION_SECRET` — any long random string

These are pre-set in render.yaml and don't need manual entry:
- `NODE_ENV=production`
- `SMTP2GO_SENDER=noreply@qiroxstudio.online`
- `SMTP2GO_SENDER_NAME=Qirox`
- `EMAIL_LOGO_URL=https://raw.githubusercontent.com/Darsh20009/QIROXsystem/main/client/public/logo.png`
- `EMAIL_SITE_URL=https://qiroxstudio.online`

## Latest Changes (Feb 25, 2026 - Session 8)

- **OTP / Forgot Password Flow**: Full 3-step recovery page (`/forgot-password`): email → 6-digit OTP verification → new password reset → done. Backend routes: `POST /api/auth/forgot-password` (sends OTP via SMTP2GO), `POST /api/auth/verify-otp`, `POST /api/auth/reset-password`. OTPs expire in 10 minutes, invalidated on use.
- **Login Page**: Added "نسيت كلمة المرور؟" link next to password label, linking to `/forgot-password`.
- **Notifications System**: `NotificationBell` component in sidebar header — shows unread badge count, dropdown with list, mark-as-read per item and "قراءة الكل". Backend: `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`. Notifications auto-created when: order placed (client), order status changes (client).
- **Inbox Messaging**: Full `Inbox` page (`/inbox`) with contacts sidebar + real-time chat thread. Auto-refreshes every 5s. Backend: `GET /api/inbox`, `GET /api/inbox/unread-count`, `GET /api/inbox/thread/:userId`, `POST /api/inbox`. Sends email notification + in-app notification to recipient.
- **Invoices & Finance API**: `GET /api/invoices`, `POST /api/invoices`, `PATCH /api/invoices/:id`, `GET /api/admin/finance/summary` (totalRevenue, monthRevenue, unpaidTotal, totalOrders, activeClients).
- **Email Triggers**: Order confirmation email fires on new order; order status update email fires when admin changes status. Both also create in-app notifications.
- **Sidebar**: Added "الرسائل" link for client and employee sections; `NotificationBell` shown in header when user is logged in.
- **Auth security**: Exported `hashPassword` from `auth.ts` for clean reuse in reset-password route (instead of reinvoking setupAuth).

## Latest Changes (Feb 25, 2026 - Session 7)

- **Employee Specs Sheet Expanded**: `specsForm` now has 30+ fields in 6 organized sections: 1) معلومات المشروع (name, email, budget, paid, dates, hours, status) — black card, 2) البنية التقنية (stack, framework, language, DB, hosting), 3) Infrastructure (GitHub, DB URI, server IP, credentials, staging/production URLs, SSL/CDN checkboxes), 4) Env Variables (monospace textarea), 5) Project Concept (idea, audience, features, references, color palette), 6) Notes (public + internal team notes). Sheet widened to `max-w-3xl`. Save button is sticky at bottom.
- **Client Project File Sheet**: Client "المواصفات" now opens a `Sheet` (max-w-2xl) instead of a Dialog. Shows organized sections: black card (name, status, budget, dates), tech tags, clickable URLs (GitHub/staging/production/domain), project concept, notes. Hides sensitive fields (passwords, team notes, server IP, DB URI).
- **Cart Page Redesign**: Full redesign of `/cart`. New layout: 2-col (items + right summary). Cart items: cleaner row design with icon, type badge, qty control (hidden for services), price, remove. Add-ons section: shows starting price upfront. Right summary panel: black header with total, line-by-line breakdown, coupon, checkout button. Checkout replaces toast with full success screen showing order confirmation, items, and "سيتواصل فريقنا" message. All add-on dialogs redesigned with selected=black style.

## Latest Changes (Feb 25, 2026 - Session 6)

- **Services Page - Full Flow**: Rebuilt to 3-step flow (1. pick service → 2. add products → 3. checkout). Services displayed as card grid (not expandable rows). Clicking a service opens a full detail panel below with: features/customization section, linked admin products, gifts, MongoDB Atlas tiers (M0→M30), AWS EC2 tiers (t3.micro→c5.xlarge), domain products from admin, email products from admin (with fallback email plans). All items have "أضف للسلة" buttons.
- **Client Dashboard - Creative Redesign**: New avatar-based top bar with greeting, date, role. Animated stats cards with gradient icons. Investment banner (black, shows total spent + active services). Projects with 4-phase progress indicator (التصميم/التطوير/الاختبار/التسليم). Quick actions grid (تصفح الخدمات/الأجهزة/طلب تعديل). Orders as timeline. Mod requests as compact cards. Final CTA band.
- **Employee Specs Form Enhanced**: Added "فكرة المشروع" (project concept textarea) and "المتغيرات والإعدادات" (variables in KEY=VALUE format) to existing specs dialog. All 7 fields: techStack, database, hosting, domain, projectConcept, variables, notes.
- **Cart Route Added**: `/cart` now properly serves the full cart page for logged-in users.
- **Devices Page**: Beautiful product grid with category pills, search, featured section, and add-to-cart. Products come from admin (`/api/products`).

## Latest Changes (Feb 25, 2026 - Session 5)

- **Admin Credentials Updated**: `admin_qirox`/`admin13579` → `qadmin`/`qadmin`. Auto-migration on server start updates existing DB records. AdminCredentialsCard updated to match.
- **Services Seeding Fixed**: Changed from destructive reseed (deleting all services) to safe seed only when `existingServices.length === 0` — preserves user-added services.
- **New Routes in App.tsx**: Added `/devices` (public), `/cart` (authenticated), `/admin/products` (admin-only).
- **Sidebar Updated**: Clients now see "الأجهزة والإضافات" and "سلة التسوق" links. Management sees "المنتجات والأجهزة" admin link.
- **Services Page Rebuilt**: New expandable card design with category filter pills, hero, features list by category (stores get storeFeatures, restaurants get restaurantFeatures, customizable categories show "custom" message), add-to-cart for logged-in users, related products display.
- **Employee Specs Form**: Added "مواصفات" button on each order row in EmployeeDashboard. Opens a dialog with fields: techStack, database (select), hosting (select), domain, notes. Saves to `/api/admin/orders/:id/specs`.

## Recent Changes (Feb 2026)

- **AUTH UI LUXURY REDESIGN + PHONE/COUNTRY INPUTS**:
  - `Login.tsx`: Full luxury redesign — split screen (black decorative panel with stats + white form). Added eye toggle for password, icons in inputs, business type dropdown, show/hide confirm password
  - `Register.tsx` (same file): Phone input with country dial code + emoji flag selector (`CountryPhoneInput.tsx`). Country dropdown with search (`CountrySelect.tsx`). Business type now dropdown (not text). Shows `منصتك الرقمية تبدأ من هنا` on black panel
  - `ForgotPassword.tsx`: Full luxury redesign — split screen, 3-step OTP flow with animated boxes (filled = black/white). Password strength indicator. Paste OTP from clipboard. Better error messages on wrong OTP. Dev-only fetch-OTP button for testing
  - New components: `client/src/components/CountryPhoneInput.tsx` (28 countries with flags + dial codes, searchable), `client/src/components/CountrySelect.tsx` (searchable country list)
  - **Email/OTP status**: SMTP2GO is configured and sending correctly — OTP codes are logged in server console. If emails go to spam, user should whitelist the domain. Dev mode has "عرض الرمز (وضع التطوير فقط)" button

- **PACKAGES & OFFERS SYSTEM (Professional)**: Full redesign of pricing and offers:
  - `Prices.tsx`: Rebuilt with trust badges, billing-cycle filter toggle (all/one-time/monthly/yearly), animated plan cards with discount %, offer badges, "what's included" section, domain pricing with savings display, and a black CTA footer
  - `AdminTemplates.tsx`: Added full `PlanForm` component with: offer label, original price + auto-calculated discount %, per-line features editor, isPopular/isCustom toggles (Switch), billing cycle selector, sortOrder; plan cards now show discount badge; edit button on each plan now works
  - `Dashboard.tsx` (client view): Added "الباقات والعروض المتاحة" section showing up to 3 plans with offer banners, popular badge, discount %, features preview, and "اختر الباقة" CTA; enterprise plan shown separately with contact button

- **COMPLETE UI/UX REDESIGN**: Converted entire frontend from dark theme (bg-[#0A0A0F], cyan accents) to light theme (white background, black/gray color scheme). Affected: index.css, all components (Navigation, Footer, Sidebar, Splash), and all pages (Home, Services, Portfolio, Prices, Login, About, Contact, OrderFlow, Admin pages).
  - Design tokens: bg-white, text-black, borders: black/[0.06], accents: gray-400, premium buttons: bg-black text-white
  - Navigation: transparent → glass-strong on scroll, active indicator with layoutId animation
  - Splash screen: typewriter effect with black/gray on white, minimal animations
  - Cards: white bg with subtle borders and hover shadows instead of dark glass
  - CTA sections: bg-black with white text (inverted from main)
- **DASHBOARD REDESIGN**: Creative client dashboard with animated stat cards, progress bars, order timeline with status icons, investment summary, and CTA section
- **EMPLOYEE MANAGEMENT**: Full CRUD AdminEmployees page with add/edit/delete, role selection, search, role filtering. Backend: POST/PATCH/DELETE /api/admin/users with input validation, role whitelisting, admin protection
- **SEO**: Comprehensive meta tags, OG tags, Twitter cards, JSON-LD structured data, canonical URL qiroxstudio.online
- **PWA**: Updated manifest.json with orientation "any" (portrait+landscape), proper theme colors for light theme
- **DEPLOYMENT**: Configured autoscale deployment with build + run commands, fixed session cookies for production
- Added SectorTemplate and PricingPlan MongoDB models with 8 seeded industry templates
- Built Portfolio page with category filtering and sector cards
- Built Pricing page with 3 plans (Starter 5K, Business 15K, Enterprise 40K SAR)
- Built Admin Templates page with CRUD operations and pricing management tabs
- Enhanced Home page with dynamic 8-sector showcase from database + 4 main service paths section (restaurants, stores, education, institutions)
- Updated Navigation with Portfolio, Prices, About links
- Built AdminServices page with full CRUD (create/edit/delete) using simple state management
- Built AdminOrders page with order management, quick approve/reject, status updates, and detail view
- Integrated PayPal payment (server/paypal.ts with lazy SDK initialization, client/src/components/PayPalButton.tsx)
- PayPal routes: GET /paypal/setup, POST /paypal/order, POST /paypal/order/:orderID/capture
- Replaced splash screen and system icons with actual QIROX logo (attached_assets/QIROX_LOGO_1771674917456.png)
- Updated Sidebar with admin templates management link
- Enhanced About page with investor-focused content (tech stack, business model, sectors)
- **SECURITY**: Removed all GitHub repository URLs from seed data, schema, models, and frontend (8 template references stripped)
- **i18n**: Created full bilingual (Arabic/English) translation system (`client/src/lib/i18n.tsx`) with 100+ keys
- **i18n**: Integrated i18n across Navigation, Services, OrderFlow, Login, Footer, Portfolio, Sidebar pages
- **i18n**: Language toggle button in navigation and admin header with localStorage persistence
- **Fix**: Changed order creation route from Drizzle-validated path to direct `/api/orders` for MongoDB string ObjectID compatibility
- **Fix**: MongoDB migration to strip repoUrl from existing template documents
- **Upload**: Added file upload system (multer) with POST /api/upload and /api/upload/multiple endpoints
- **Upload**: OrderFlow Step 3 now uses real file uploads (logo, brand identity, content, images, video) instead of URL text fields
- **Upload**: Bank transfer receipt (Step 4) also uses file upload; uploaded files stored in `uploads/` directory
- **Upload**: Files payload saved as `files` field in order documents (Mixed type in Mongoose)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack React Query for server state; no global client state library
- **UI Components**: Shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS with CSS custom properties for theming, PostCSS with autoprefixer
- **Animations**: Framer Motion
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Icons**: Lucide React
- **Fonts**: Cairo (headings) and IBM Plex Sans Arabic (body text) — Arabic-first typography
- **RTL Support**: HTML dir="rtl", CSS direction: rtl on body, space-x-reverse utilities
- **PWA**: Basic manifest.json and install prompt component for add-to-homescreen

### Backend Architecture
- **Framework**: Express 5 on Node.js with TypeScript (run via tsx in dev, esbuild bundle for production)
- **API Pattern**: REST API under `/api/*` prefix, with typed route definitions in `shared/routes.ts`
- **Authentication**: Passport.js with Local Strategy, express-session with memorystore, scrypt password hashing
- **Storage Layer**: Repository pattern via `IStorage` interface in `server/storage.ts`, implemented as `MongoStorage` using Mongoose
- **Build**: Custom build script (`script/build.ts`) that uses Vite for client and esbuild for server, outputting to `dist/`

### Shared Code (`shared/` directory)
- **Schema** (`shared/schema.ts`): TypeScript interfaces for MongoDB types (SectorTemplate, PricingPlan) + Drizzle/Zod schemas for legacy PostgreSQL types. Browser-safe.
- **Routes** (`shared/routes.ts`): Typed API route definitions with paths, methods, input schemas, and response schemas.

### Server-Only Code
- **Models** (`server/models.ts`): Mongoose model definitions. These must NOT be imported by frontend code.

### Database
- **Primary Database**: MongoDB via Mongoose
- **Connection**: Configured via `MONGODB_URI` environment variable
- **Collections**: users, services, orders, projects, tasks, messages, sectortemplates, pricingplans
- **Key Models**:
  - SectorTemplate: 8 industry templates (quran-academy, education-platform, exam-system, fitness-platform, resume-cv, charity-ngo, ecommerce-store, cafe-restaurant)
  - PricingPlan: 3 tiers (starter, business, enterprise)
- **Key Relationships**: Users have orders -> orders create projects -> projects have tasks and messages. Users have roles (client, admin, employee types).

### API Endpoints
- **Templates**: GET `/api/templates`, GET `/api/templates/:id`
- **Pricing**: GET `/api/pricing`
- **Admin Templates**: POST/PATCH/DELETE `/api/admin/templates/:id`
- **Admin Pricing**: POST/PATCH/DELETE `/api/admin/pricing/:id`
- **Auth**: POST `/api/register`, POST `/api/login`, POST `/api/logout`, GET `/api/user`

### Authentication & Authorization
- Session-based auth with express-session and memorystore
- Role-based access: roles defined on the user model (client, admin, various employee types)
- Admin routes require authentication and non-client role

### Development Setup
- **Dev server**: Vite dev server proxied through Express with HMR via WebSocket at `/vite-hmr`
- **Production**: Static files served from `dist/public`, server bundle at `dist/index.cjs`
- **Path aliases**: `@/` -> `client/src/`, `@shared/` -> `shared/`, `@assets/` -> `attached_assets/`
- **Environment variables needed**: `MONGODB_URI` (required for database)

### Key Design Decisions

1. **Monorepo with shared types**: The `shared/` directory contains TypeScript interfaces and Zod schemas, ensuring type safety across the full stack.

2. **Mongoose models separated from shared types**: Mongoose models live in `server/models.ts` (server-only) while types/interfaces live in `shared/schema.ts` (browser-safe).

3. **Repository pattern**: The `IStorage` interface abstracts database operations.

4. **Arabic-first UI**: RTL layout is the default. Fonts, colors, and copy are designed for Arabic-speaking markets. Brand colors: Deep Blue (#0f172a) and Electric Cyan (#06b6d4).

5. **Session-based auth**: Server-side session management with memorystore.

6. **Modular architecture concept**: Each template is built on Core + Modules pattern for extensibility.

## External Dependencies

### Required Services
- **MongoDB**: Primary database. Must be provisioned and `MONGODB_URI` env var set.
- **PayPal**: Optional. Requires `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` secrets. Server gracefully degrades if not set (returns 503 on PayPal routes).

### Key npm Packages
- **mongoose**: ODM for MongoDB
- **express** (v5): HTTP server framework
- **passport** + **passport-local**: Authentication
- **memorystore**: Session store
- **@tanstack/react-query**: Server state management on the client
- **react-hook-form** + **zod**: Form handling and validation
- **framer-motion**: Animations
- **recharts**: Dashboard analytics charts
- **wouter**: Client-side routing
- **shadcn/ui components**: Full suite of Radix-based UI components
- **tailwindcss**: Utility-first CSS framework
- **date-fns**: Date formatting (Arabic locale support)

### Dev Plugins (removed)
- ~~`@replit/vite-plugin-runtime-error-modal`~~ (removed)
- ~~`@replit/vite-plugin-cartographer`~~ (removed)
- ~~`@replit/vite-plugin-dev-banner`~~ (removed)
