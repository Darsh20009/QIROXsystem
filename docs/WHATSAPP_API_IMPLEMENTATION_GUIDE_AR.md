# دليل عام لربط أي نظام بواتساب وإرسال الرسائل عبر API

هذا الدليل محايد عن أي شركة أو مشروع. يمكن تسليمه لمطوّر لربط نظام حجوزات أو متجر أو تطبيق خدمة عملاء بواتساب.

## 1. اختر طريقة الربط المناسبة

### الخيار الموصى به: WhatsApp Business Platform / Cloud API

هذا هو الخيار الرسمي للأنظمة التجارية، خصوصًا إذا كان لكل شركة رقمها الخاص أو كان الإرسال جزءًا أساسيًا من المنتج.

المتطلبات العامة:

1. إنشاء حساب WhatsApp Business وتهيئة النشاط التجاري لدى Meta.
2. تسجيل رقم الهاتف وربطه بحساب WhatsApp Business.
3. الحصول على `Phone Number ID` ورمز وصول مناسب من Meta.
4. إعداد Webhook لاستقبال الرسائل الواردة وإشعارات التسليم والقراءة والفشل.
5. حفظ رموز الوصول في مدير أسرار الخادم، وتجديدها وفق دورة الاعتماد المعتمدة.
6. إنشاء قوالب الرسائل المطلوبة واعتمادها لدى Meta عند الحاجة.

### خيار بديل: ربط جهاز عبر QR

يمكن لخدمة خادم استخدام جلسة WhatsApp Web مرتبطة بهاتف عبر **الأجهزة المرتبطة** ومسح QR. مكتبات مثل Baileys تعتمد هذا الأسلوب.

- في الهاتف: WhatsApp ← الأجهزة المرتبطة ← ربط جهاز، ثم مسح QR الذي تعرضه لوحة النظام.
- يجب حفظ بيانات الجلسة مشفّرة، مع قصر إظهار QR وإدارة الاتصال على مدير مخوّل.
- هذه ليست WhatsApp Cloud API الرسمية؛ قد تتغير أو تتوقف الجلسة، ولا ينبغي افتراض أنها مناسبة لإرسال الشركات بكميات كبيرة أو لربط أرقام عملاء متعددين.
- لا ترسل QR أو ملفات الجلسة للمطوّر، ولا تشارك جلسة رقم واحد بين شركات مستقلة.

**الاختيار العملي:** استخدم Cloud API إذا كان المطلوب خدمة مستقرة ورقمًا مستقلًا لكل شركة. استخدم QR فقط إذا كان هناك سبب واضح لقبول قيود جلسة جهاز واحد ومخاطر الاعتماد على WhatsApp Web.

## 2. تصميم الربط بين النظام الخارجي وواجهة الإرسال

لا تجعل تطبيق المتصفح يتصل مباشرة بمزود واتساب أو يحمل رمز المزود. اجعل المسار كالتالي:

```text
المتصفح أو النظام العميل
        ↓
خادم النظام العميل — مصادقة المستخدم والتحقق من الموافقة
        ↓ HTTPS + مفتاح API خاص
واجهة الإرسال
        ↓
عامل إرسال / قائمة مهام
        ↓
WhatsApp Cloud API أو موفر الربط المختار
        ↓
Webhook لتحديث حالة التسليم
```

أنشئ واجهة خادم-إلى-خادم، مثل:

```text
POST /api/v1/whatsapp/messages
```

لكل نظام أو عميل مفتاح مستقل، محدود الصلاحيات، قابل للإيقاف والتدوير، ومربوط بحد إرسال واضح. احفظ بصمة المفتاح في قاعدة البيانات بدل تخزين قيمته الخام.

## 3. شكل طلب الإرسال

الرؤوس:

```text
Authorization: Bearer <API_KEY>
Content-Type: application/json
Idempotency-Key: <معرّف فريد للعملية>
```

جسم رسالة نصية:

```json
{
  "recipient": {
    "phone": "+966501234567",
    "name": "اسم المستلم"
  },
  "message": "تم تأكيد موعدك يوم الأحد الساعة 10 صباحًا."
}
```

استخدم رقمًا دوليًا بصيغة E.164. لا ترسل رقمًا محليًا ملتبسًا مثل `050...`. عند استخدام Cloud API، يطبّع الخادم الرقم إلى الشكل الذي يتطلبه إصدار API المعتمد.

مثال طلب من أي خادم باستخدام `curl`:

```bash
curl --fail-with-body --request POST \
  "https://api.example.com/api/v1/whatsapp/messages" \
  --header "Authorization: Bearer ${WHATSAPP_INTEGRATION_KEY}" \
  --header "Content-Type: application/json" \
  --header "Idempotency-Key: booking-2026-000184" \
  --data '{
    "recipient": {
      "phone": "+966501234567",
      "name": "اسم المستلم"
    },
    "message": "تم تأكيد موعدك يوم الأحد الساعة 10 صباحًا."
  }'
```

استبدل `api.example.com` بنطاق الخادم المنفذ. أنشئ قيمة Idempotency مختلفة لكل عملية إرسال، واستخدم القيمة نفسها فقط عند إعادة محاولة العملية ذاتها بعد خطأ شبكة.

## 4. مثال Node.js للإرسال من نظام العميل

يشغَّل هذا المثال في خادم النظام العميل، وليس في كود المتصفح:

```js
import { randomUUID } from "node:crypto";

const endpoint = process.env.WHATSAPP_SEND_ENDPOINT;
const integrationKey = process.env.WHATSAPP_INTEGRATION_KEY;

if (!endpoint || !integrationKey) {
  throw new Error("WhatsApp integration is not configured");
}

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${integrationKey}`,
    "Content-Type": "application/json",
    "Idempotency-Key": randomUUID(),
  },
  body: JSON.stringify({
    recipient: {
      phone: "+966501234567",
      name: "اسم المستلم",
    },
    message: "تم تأكيد موعدك يوم الأحد الساعة 10 صباحًا.",
  }),
});

const result = await response.json();
if (!response.ok) {
  throw new Error(`WhatsApp API returned HTTP ${response.status}`);
}

// القبول يعني أن الطلب دخل مسار المعالجة، وليس إثبات وصوله إلى الهاتف.
console.log({
  deliveryId: result.delivery?.id,
  status: result.delivery?.status,
});
```

خزّن `WHATSAPP_SEND_ENDPOINT` و`WHATSAPP_INTEGRATION_KEY` في Secrets/Secret Manager. لا تضعهما في Git أو ملف JavaScript يرسل إلى المتصفح.

## 5. مثال Node.js لخادم يرسل عبر WhatsApp Cloud API

هذا مثال مبسّط لطبقة مزود Cloud API. يجب أن تأتي قيم الأسرار من بيئة الخادم، وأن تتحقق طبقة API من المستلم والموافقة والصلاحية قبل استدعائه.

```js
function normalizeMetaRecipient(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) {
    throw new Error("Invalid international phone number");
  }
  return digits;
}

export async function sendWhatsAppText({ phone, message }) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_GRAPH_API_VERSION;

  if (!token || !phoneNumberId || !apiVersion) {
    throw new Error("WhatsApp Cloud API is not configured");
  }

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: normalizeMetaRecipient(phone),
        type: "text",
        text: {
          preview_url: false,
          body: String(message).slice(0, 4000),
        },
      }),
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    // لا تسجل Authorization header أو رمز الوصول في السجلات.
    throw new Error(payload?.error?.message || `WhatsApp provider returned HTTP ${response.status}`);
  }

  return {
    providerMessageId: payload?.messages?.[0]?.id || null,
    status: "accepted",
  };
}
```

استخدم إصدار Graph API المدعوم وقت التنفيذ، ولا تثبّت رقم إصدار قديم من دون مراجعة وثائق Meta الحالية. لا تعِد المحاولة على أخطاء المصادقة أو الطلب غير الصحيح؛ أعد المحاولة بتأخير محدود لأخطاء الشبكة أو الانشغال فقط.

## 6. الرسائل النصية والقوالب

- أرسل رسالة نصية حرة فقط عندما تسمح قواعد WhatsApp وحالة المحادثة بذلك.
- للرسائل التي تبدأها الشركة أو التي تتطلب قالبًا، استخدم اسم قالب معتمدًا ولغته ومعاملاته الصحيحة.
- لا تعتبر أي قالب داخلي أو نص عادي قالبًا معتمدًا لدى Meta.
- احتفظ بمعرّف القالب واللغة والمعاملات في إعدادات موثوقة، لا تقبل اسم قالب اعتباطيًا من مستخدم نهائي.
- لا ترسل كلمات مرور، رموز استرداد، بيانات دفع، أو معلومات سرية في الرسائل أو السجلات.

## 7. نموذج API آمن للمطور المنفذ

قبل إرسال أي رسالة، يجب أن يتحقق الخادم من:

1. صحة مفتاح التكامل، وحالته، ونطاقه، وتاريخ انتهائه.
2. أن المفتاح مخوّل لقناة WhatsApp وللشركة أو المشروع الصحيح.
3. أن المستخدم أو الشركة يملكون حق تنفيذ هذا الإجراء.
4. وجود موافقة موثقة من المستلم على نوع الرسائل المقصود.
5. أن الرقم غير موجود في قائمة منع الإرسال، ولم يطلب صاحبه الإلغاء.
6. صحة الرقم وحد الرسالة وحدود الاستخدام في الدقيقة واليوم والشهر.
7. عدم تكرار العملية نفسها عند إعادة المحاولة، باستخدام Idempotency.

متطلبات تنفيذ إضافية:

- احفظ المفتاح الخام مرة واحدة فقط عند إصداره، واحفظ بصمته في قاعدة البيانات.
- سجّل من أنشأ المفتاح، ونطاقه، وآخر استخدام له، والطلبات المرفوضة، من دون تسجيل الرمز أو نصوص حساسة.
- اجعل إبطال المفتاح فوريًا، ووفّر تدويره عند التسرب أو تغيير المطوّر.
- ضع الإرسال في قائمة مهام، وأعد الاستجابة بعد قبول المهمة مع `deliveryId`.
- عالج `429` بتأخير واحترام `Retry-After`. لا تكرر الطلبات بلا حد.
- استخدم Webhook موقّعًا لتحديث حالة `sent`, `delivered`, `read`, أو `failed`.
- تحقّق من توقيع Webhook على جسم الطلب الخام، ثم عالج كل حدث مرة واحدة فقط.
- اجعل سجلات الإرسال قصيرة الاحتفاظ ومقيدة الصلاحية، خصوصًا إذا تضمنت بيانات العملاء.

استجابة مقترحة من واجهة النظام:

```json
{
  "ok": true,
  "delivery": {
    "id": "delivery-id",
    "status": "accepted"
  }
}
```

لا تعنِ `accepted` أن المستلم قرأ الرسالة؛ حالة التسليم النهائية تأتي من Webhook أو من مسار حالة محمي.

## 8. رموز HTTP المقترحة

- `202`: تم قبول الرسالة في قائمة الإرسال.
- `400`: رقم أو نص أو قالب غير صالح.
- `401`: مفتاح API مفقود أو غير صحيح.
- `403`: المفتاح معطل أو لا يملك الصلاحية المطلوبة.
- `409`: تعارض في مفتاح Idempotency مع طلب مختلف.
- `429`: تجاوز حد الاستخدام؛ أرسل `Retry-After`.
- `502` أو `503`: مزود واتساب غير متاح مؤقتًا.

لا تُرجع مفتاح المزود أو تفاصيل داخلية أو نصوص أخطاء قد تحتوي بيانات اعتماد.

## 9. قائمة تسليم للمبرمج

- [ ] تحديد هل المطلوب رقم شركة واحد أم رقم مستقل لكل عميل.
- [ ] اختيار Cloud API الرسمي أو QR مع توثيق سبب الاختيار ومخاطره.
- [ ] إعداد أسرار الخادم خارج المستودع.
- [ ] إنشاء API key مستقل ومحدود لكل عميل أو نظام.
- [ ] إضافة موافقة المستلمين وقائمة الإلغاء قبل تشغيل الإرسال.
- [ ] تطبيق الحد اليومي/الدقيق، Idempotency، وقائمة مهام.
- [ ] تهيئة Webhook والتحقق من التوقيع وتحديث حالات التسليم.
- [ ] اختبار رقم يملكه فريق التطوير أولًا، ثم إطلاق تدريجي لمستلمين وافقوا.
- [ ] توثيق إبطال المفاتيح وخطة التعامل مع انقطاع الجلسة أو المزود.

لا تستخدم API لإرسال رسائل عشوائية أو إلى قوائم مشتراة أو إلى أشخاص لم يوافقوا على استقبالها. راجع سياسة WhatsApp وMeta والقوانين المحلية قبل الإطلاق.
