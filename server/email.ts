const API_KEY = process.env.SMTP2GO_API_KEY || "";
const SENDER = process.env.SMTP2GO_SENDER || "noreply@qirox.tech";
const SENDER_NAME = process.env.SMTP2GO_SENDER_NAME || "Qirox";
const BASE_URL = "https://api.smtp2go.com/v3/email/send";

async function sendEmail(to: string, toName: string, subject: string, htmlBody: string): Promise<boolean> {
  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: API_KEY,
        to: [`${toName} <${to}>`],
        sender: `${SENDER_NAME} <${SENDER}>`,
        subject,
        html_body: htmlBody,
      }),
    });
    const data = await res.json() as any;
    if (data.data?.succeeded === 1) return true;
    console.error("[Email] SMTP2GO error:", JSON.stringify(data));
    return false;
  } catch (err) {
    console.error("[Email] send error:", err);
    return false;
  }
}

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body{margin:0;padding:0;background:#f8f8f8;font-family:'Segoe UI',Arial,sans-serif;direction:rtl;}
  .wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;}
  .header{background:#000;padding:28px 32px;text-align:center;}
  .header img{height:36px;}
  .logo-text{color:#fff;font-size:22px;font-weight:900;letter-spacing:2px;}
  .body{padding:32px;}
  .title{font-size:20px;font-weight:800;color:#111;margin-bottom:12px;}
  .text{font-size:14px;color:#555;line-height:1.7;margin-bottom:16px;}
  .otp-box{background:#f3f4f6;border-radius:12px;padding:20px;text-align:center;margin:20px 0;}
  .otp{font-size:36px;font-weight:900;color:#111;letter-spacing:12px;font-family:monospace;}
  .otp-note{font-size:12px;color:#9ca3af;margin-top:8px;}
  .btn{display:inline-block;background:#000;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;margin:16px 0;}
  .divider{border:none;border-top:1px solid #f3f4f6;margin:24px 0;}
  .footer{background:#f9fafb;padding:20px 32px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #f3f4f6;}
  .tag{display:inline-block;background:#f3f4f6;color:#6b7280;padding:3px 10px;border-radius:20px;font-size:11px;margin-bottom:16px;}
  .highlight{background:#fafafa;border-right:3px solid #000;padding:12px 16px;border-radius:0 8px 8px 0;margin:12px 0;font-size:13px;color:#374151;}
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><div class="logo-text">QIROX</div></div>
  <div class="body">${content}</div>
  <div class="footer">
    © 2026 Qirox — مصنع الأنظمة الرقمية<br/>
    <a href="https://qirox.tech" style="color:#9ca3af;">qirox.tech</a>
  </div>
</div>
</body>
</html>`;
}

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  const html = baseTemplate(`
    <div class="tag">مرحباً بك</div>
    <div class="title">أهلاً بك في Qirox، ${name}! 🎉</div>
    <p class="text">تم إنشاء حسابك بنجاح. أنت الآن جزء من منظومة Qirox لبناء الأنظمة الرقمية الاحترافية.</p>
    <div class="highlight">لوحة التحكم الخاصة بك جاهزة — تصفح خدماتنا وابدأ مشروعك الأول</div>
    <a href="https://qirox.tech/dashboard" class="btn">الذهاب للوحة التحكم</a>
    <hr class="divider"/>
    <p class="text" style="font-size:12px;color:#9ca3af;">إذا لم تقم بإنشاء هذا الحساب، تجاهل هذا البريد.</p>
  `);
  return sendEmail(to, name, "مرحباً بك في Qirox 🚀", html);
}

export async function sendOtpEmail(to: string, name: string, otp: string): Promise<boolean> {
  const html = baseTemplate(`
    <div class="tag">إعادة تعيين كلمة المرور</div>
    <div class="title">رمز التحقق الخاص بك</div>
    <p class="text">طلبت إعادة تعيين كلمة المرور لحسابك في Qirox. استخدم الرمز التالي:</p>
    <div class="otp-box">
      <div class="otp">${otp}</div>
      <div class="otp-note">صالح لمدة 10 دقائق فقط — لا تشاركه مع أحد</div>
    </div>
    <p class="text">إذا لم تطلب إعادة تعيين كلمة المرور، تجاهل هذا البريد وسيبقى حسابك آمناً.</p>
  `);
  return sendEmail(to, name, "رمز التحقق — Qirox", html);
}

export async function sendOrderConfirmationEmail(to: string, name: string, orderId: string, items: string[]): Promise<boolean> {
  const itemsList = items.map(i => `<div class="highlight">• ${i}</div>`).join("");
  const html = baseTemplate(`
    <div class="tag">تأكيد الطلب</div>
    <div class="title">تم استلام طلبك! ✅</div>
    <p class="text">شكراً ${name}، تم استلام طلبك بنجاح ورقم الطلب هو:</p>
    <div class="otp-box"><div style="font-size:18px;font-weight:900;color:#111;letter-spacing:3px;font-family:monospace;">#${orderId.slice(-8).toUpperCase()}</div></div>
    <p class="text">محتويات الطلب:</p>
    ${itemsList}
    <p class="text">سيتواصل معك فريق Qirox خلال <strong>24 ساعة</strong> لإتمام الدفع والبدء في التنفيذ.</p>
    <a href="https://qirox.tech/dashboard" class="btn">متابعة الطلب</a>
  `);
  return sendEmail(to, name, `تأكيد طلبك — Qirox #${orderId.slice(-8).toUpperCase()}`, html);
}

export async function sendOrderStatusEmail(to: string, name: string, orderId: string, status: string): Promise<boolean> {
  const statusMap: Record<string, { label: string; icon: string; desc: string }> = {
    pending: { label: "قيد المراجعة", icon: "🔄", desc: "طلبك قيد المراجعة من قِبَل فريقنا" },
    approved: { label: "تمت الموافقة", icon: "✅", desc: "تمت الموافقة على طلبك وبدأ العمل عليه" },
    in_progress: { label: "قيد التنفيذ", icon: "⚙️", desc: "يعمل فريقنا على تنفيذ مشروعك" },
    review: { label: "مراجعة العميل", icon: "👁️", desc: "المشروع جاهز لمراجعتك" },
    completed: { label: "مكتمل", icon: "🎉", desc: "تم تسليم مشروعك بنجاح" },
    rejected: { label: "مرفوض", icon: "❌", desc: "للأسف تم رفض الطلب. تواصل معنا للمزيد" },
  };
  const s = statusMap[status] || { label: status, icon: "📌", desc: "تم تحديث حالة طلبك" };
  const html = baseTemplate(`
    <div class="tag">تحديث الطلب</div>
    <div class="title">${s.icon} ${s.label}</div>
    <p class="text">${s.desc}</p>
    <div class="highlight">رقم الطلب: #${orderId.slice(-8).toUpperCase()}</div>
    <a href="https://qirox.tech/dashboard" class="btn">عرض الطلب</a>
  `);
  return sendEmail(to, name, `تحديث طلبك: ${s.label} — Qirox`, html);
}

export async function sendMessageNotificationEmail(to: string, name: string, senderName: string, preview: string): Promise<boolean> {
  const html = baseTemplate(`
    <div class="tag">رسالة جديدة</div>
    <div class="title">لديك رسالة جديدة من ${senderName}</div>
    <div class="highlight">"${preview.slice(0, 120)}${preview.length > 120 ? '...' : ''}"</div>
    <a href="https://qirox.tech/dashboard" class="btn">الرد على الرسالة</a>
  `);
  return sendEmail(to, name, `رسالة من ${senderName} — Qirox`, html);
}
