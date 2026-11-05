# QIROX Notification API

تعمل رسائل QIROX من خلال قائمة تسليم موحّدة تحفظ حالة كل محاولة للبريد وواتساب. لا تعيد الواجهة أو هذه المسارات أي مفاتيح أو رموز وصول.

## القنوات

- **البريد:** يستخدم إعدادات SMTP الموجودة مسبقاً، مع ثلاث محاولات محدودة لكل إرسال.
- **WhatsApp Web عبر Baileys (القناة التشغيلية الأساسية):** لا يحتاج إلى Meta أو رموز وصول؛ يجب ربط جلسة WhatsApp من لوحة إدارة WhatsApp، ويستخدمها QIROX تلقائياً لإرسال الإشعارات.
- **WhatsApp Business Cloud API (اختياري فقط):** لا يُستخدم إلا عند ضبط `WHATSAPP_PROVIDER=meta` صراحةً ثم إضافة هذه القيم في Secrets/Environment فقط:
  - `WHATSAPP_META_ACCESS_TOKEN`
  - `WHATSAPP_META_PHONE_NUMBER_ID`
  - `WHATSAPP_META_API_VERSION` (اختياري؛ الافتراضي `v22.0`)
  - `WHATSAPP_META_TEMPLATE_LANGUAGE` (اختياري؛ الافتراضي `ar`)
- **قوالب Meta المعتمدة:** لا يكفي وجود قالب داخل QIROX. عند اعتماد قالب داخل Meta، اربط اسمه بمتغير مثل `WHATSAPP_META_TEMPLATE_ORDER_STATUS`. المفاتيح الحالية هي: `WELCOME_EMPLOYEE` و`ORDER_STATUS` و`PROJECT_UPDATE` و`INVOICE_READY` و`QUOTATION_READY`.
- **الصحة:** تظهر حالة جلسة Baileys في `/api/notifications/health`. إذا لم تكن الجلسة مربوطة، يجب مسح QR من لوحة إدارة WhatsApp قبل الإرسال.

تنبيه: Meta تقبل النص الحر فقط داخل نافذة خدمة العميل الخاصة بها. أما الرسائل الاستباقية فتحتاج قالباً معتمداً في Meta؛ أي رفض من Meta يبقى مسجلاً في سجل التسليم ويمكن إعادة محاولته بعد تصحيح الإعداد.

## المسارات الموثقة

كل هذه المسارات تتطلب جلسة QIROX. الموظفون غير العملاء يستطيعون القراءة والإرسال اليدوي، والمديرون يمكنهم رؤية كامل السجل وإعادة المحاولة.

| الطريقة | المسار | الغرض |
| --- | --- | --- |
| `GET` | `/api/notifications/docs` | تعريف المسارات والصلاحيات |
| `GET` | `/api/notifications/health` | حالة القنوات وعدد الرسائل المعلّقة/الفاشلة |
| `GET` | `/api/notifications/templates` | قوالب QIROX الفعالة |
| `GET` | `/api/notifications/deliveries?limit=50` | سجل الإرسال؛ المدير يرى الكل |
| `POST` | `/api/notifications/send` | رسالة يدوية موحّدة |
| `POST` | `/api/admin/notifications/deliveries/:id/retry` | إعادة محاولة رسالة (مدير فقط) |

### إرسال يدوي

```json
{
  "recipient": {
    "userId": "اختياري",
    "name": "اسم المستلم",
    "email": "client@example.com",
    "phone": "+966501234567"
  },
  "subject": "رسالة من QIROX",
  "message": "مرحباً، هذه رسالة متابعة.",
  "channels": ["email", "whatsapp"],
  "idempotencyKey": "a-new-unique-key-per-user-action"
}
```

تستجيب الخدمة بحالة كل قناة (`sent`, `retrying`, `failed`, أو `skipped`). الأرقام تُطبّع بصيغة E.164؛ الرقم السعودي المحلي `05xxxxxxxx` يُحفظ كـ `+9665xxxxxxxx`.