const API_KEY = process.env.SMTP2GO_API_KEY || "";
const SENDER = process.env.SMTP2GO_SENDER || "noreply@qiroxstudio.online";
const SENDER_NAME = process.env.SMTP2GO_SENDER_NAME || "Qirox";
const BASE_URL = "https://api.smtp2go.com/v3/email/send";
const LOGO_URL = process.env.EMAIL_LOGO_URL || "https://raw.githubusercontent.com/Darsh20009/QIROXsystem/main/client/public/logo.png";
const SITE_URL = process.env.EMAIL_SITE_URL || "https://qiroxstudio.online";

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
  body{margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;direction:rtl;}
  .wrap{max-width:580px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e2e2;box-shadow:0 2px 16px rgba(0,0,0,0.07);}
  .header{background:#ffffff;padding:28px 32px;text-align:center;border-bottom:3px solid #000;}
  .header img{max-width:220px;width:100%;height:auto;display:block;margin:0 auto;}
  .header-fallback{color:#000;font-size:28px;font-weight:900;letter-spacing:3px;}
  .body{padding:36px 32px;}
  .title{font-size:20px;font-weight:800;color:#111;margin-bottom:12px;}
  .text{font-size:14px;color:#555;line-height:1.8;margin-bottom:16px;}
  .otp-box{background:#f3f4f6;border-radius:12px;padding:20px;text-align:center;margin:20px 0;}
  .otp{font-size:36px;font-weight:900;color:#111;letter-spacing:12px;font-family:monospace;}
  .otp-note{font-size:12px;color:#9ca3af;margin-top:8px;}
  .btn{display:inline-block;background:#000;color:#fff !important;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;margin:16px 0;}
  .divider{border:none;border-top:1px solid #f0f0f0;margin:24px 0;}
  .footer{background:#f9fafb;padding:20px 32px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #f0f0f0;}
  .footer a{color:#9ca3af;text-decoration:none;}
  .tag{display:inline-block;background:#f3f4f6;color:#6b7280;padding:4px 12px;border-radius:20px;font-size:11px;margin-bottom:16px;}
  .highlight{background:#fafafa;border-right:3px solid #000;padding:12px 16px;border-radius:0 8px 8px 0;margin:12px 0;font-size:13px;color:#374151;}
  .badge{display:inline-block;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;margin:8px 0;}
  .badge-black{background:#000;color:#fff;}
  .badge-green{background:#d1fae5;color:#065f46;}
  .badge-blue{background:#dbeafe;color:#1e40af;}
  .badge-amber{background:#fef3c7;color:#92400e;}
  .badge-red{background:#fee2e2;color:#991b1b;}
  .info-grid{display:table;width:100%;border-collapse:collapse;margin:16px 0;}
  .info-row{display:table-row;}
  .info-label{display:table-cell;padding:8px 12px;font-size:12px;color:#9ca3af;background:#f9fafb;border:1px solid #f0f0f0;font-weight:600;width:35%;}
  .info-value{display:table-cell;padding:8px 12px;font-size:13px;color:#111;border:1px solid #f0f0f0;font-weight:600;}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <img src="${LOGO_URL}" alt="QIROX" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" />
    <div class="header-fallback" style="display:none;">QIROX</div>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    © 2026 Qirox — مصنع الأنظمة الرقمية<br/>
    <a href="${SITE_URL}">qirox.tech</a>
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
    <a href="${SITE_URL}/dashboard" class="btn">الذهاب للوحة التحكم</a>
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

export async function sendEmailVerificationEmail(to: string, name: string, otp: string): Promise<boolean> {
  const html = baseTemplate(`
    <div class="tag">تأكيد البريد الإلكتروني</div>
    <div class="title">أهلاً ${name}،<br/>رمز التفعيل الخاص بك 🔐</div>
    <p class="text">
      شكراً لانضمامك إلى <strong>QIROX Studio</strong> — منصتك الرقمية المتكاملة لبناء الأنظمة الاحترافية.
      <br/>لإتمام تسجيل حسابك، استخدم رمز التحقق التالي:
    </p>
    <div class="otp-box">
      <p style="font-size:12px;color:#9ca3af;margin:0 0 8px 0;">رمز التحقق — OTP Code</p>
      <div class="otp" style="letter-spacing:16px;">${otp}</div>
      <div class="otp-note">⏱ صالح لمدة <strong>30 دقيقة</strong> فقط &nbsp;•&nbsp; 🔒 لا تشاركه مع أحد</div>
    </div>
    <div class="highlight" style="background:#fff8e7;border-right-color:#f59e0b;color:#92400e;">
      📌 إذا لم يظهر هذا البريد في صندوق الوارد، تحقق من مجلد <strong>الإسبام / Spam</strong> أو البريد غير المرغوب فيه.
    </div>
    <p class="text" style="margin-top:20px;">بعد التحقق ستتمكن من:</p>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
      <div class="highlight">📦 تقديم طلبك الأول ومتابعة مراحل التنفيذ</div>
      <div class="highlight">💬 التواصل المباشر مع فريق QIROX</div>
      <div class="highlight">📊 متابعة مشاريعك ونسبة إتمامها</div>
    </div>
    <hr class="divider"/>
    <p class="text" style="font-size:12px;color:#9ca3af;">إذا لم تقم بإنشاء حساب في QIROX Studio، تجاهل هذا البريد بأمان — لن يتم اتخاذ أي إجراء.</p>
  `);
  return sendEmail(to, name, "🔐 رمز تفعيل حسابك في QIROX Studio", html);
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
    <a href="${SITE_URL}/dashboard" class="btn">متابعة الطلب</a>
  `);
  return sendEmail(to, name, `تأكيد طلبك — Qirox #${orderId.slice(-8).toUpperCase()}`, html);
}

export async function sendOrderStatusEmail(to: string, name: string, orderId: string, status: string): Promise<boolean> {
  const statusMap: Record<string, { label: string; icon: string; desc: string; badge: string }> = {
    pending:     { label: "قيد المراجعة",  icon: "🔄", desc: "طلبك قيد المراجعة من قِبَل فريقنا",            badge: "badge-amber" },
    approved:    { label: "تمت الموافقة",   icon: "✅", desc: "تمت الموافقة على طلبك وبدأ العمل عليه",         badge: "badge-blue" },
    in_progress: { label: "قيد التنفيذ",    icon: "⚙️", desc: "يعمل فريقنا على تنفيذ مشروعك",                badge: "badge-blue" },
    review:      { label: "مراجعة العميل", icon: "👁️", desc: "المشروع جاهز لمراجعتك",                        badge: "badge-amber" },
    completed:   { label: "مكتمل",          icon: "🎉", desc: "تم تسليم مشروعك بنجاح",                        badge: "badge-green" },
    rejected:    { label: "مرفوض",          icon: "❌", desc: "للأسف تم رفض الطلب. تواصل معنا للمزيد",        badge: "badge-red" },
  };
  const s = statusMap[status] || { label: status, icon: "📌", desc: "تم تحديث حالة طلبك", badge: "badge-black" };
  const html = baseTemplate(`
    <div class="tag">تحديث حالة الطلب</div>
    <div class="title">${s.icon} ${s.label}</div>
    <span class="badge ${s.badge}">${s.label}</span>
    <p class="text">${s.desc}</p>
    <div class="highlight">رقم الطلب: #${orderId.slice(-8).toUpperCase()}</div>
    <a href="${SITE_URL}/dashboard" class="btn">عرض الطلب</a>
  `);
  return sendEmail(to, name, `تحديث طلبك: ${s.label} — Qirox`, html);
}

export async function sendMessageNotificationEmail(to: string, name: string, senderName: string, preview: string): Promise<boolean> {
  const html = baseTemplate(`
    <div class="tag">رسالة جديدة</div>
    <div class="title">لديك رسالة جديدة من ${senderName}</div>
    <div class="highlight">"${preview.slice(0, 120)}${preview.length > 120 ? '...' : ''}"</div>
    <a href="${SITE_URL}/dashboard" class="btn">الرد على الرسالة</a>
  `);
  return sendEmail(to, name, `رسالة من ${senderName} — Qirox`, html);
}

export async function sendProjectUpdateEmail(to: string, name: string, projectName: string, status: string, progress: number, note?: string): Promise<boolean> {
  const statusLabels: Record<string, { label: string; icon: string; badge: string }> = {
    planning:    { label: "التخطيط",      icon: "📋", badge: "badge-amber" },
    in_progress: { label: "قيد التنفيذ",  icon: "⚙️", badge: "badge-blue" },
    review:      { label: "المراجعة",     icon: "👁️", badge: "badge-amber" },
    completed:   { label: "مكتمل",        icon: "🎉", badge: "badge-green" },
    on_hold:     { label: "متوقف مؤقتاً", icon: "⏸️", badge: "badge-red" },
  };
  const s = statusLabels[status] || { label: status, icon: "📌", badge: "badge-black" };
  const progressBar = `
    <div style="background:#f3f4f6;border-radius:999px;height:10px;margin:12px 0;overflow:hidden;">
      <div style="background:#000;height:100%;width:${Math.min(progress, 100)}%;border-radius:999px;"></div>
    </div>
    <p style="font-size:12px;color:#6b7280;text-align:center;margin:4px 0;">${progress}% مكتمل</p>
  `;
  const noteSection = note ? `<div class="highlight">📝 ${note}</div>` : "";
  const html = baseTemplate(`
    <div class="tag">تحديث المشروع</div>
    <div class="title">${s.icon} تحديث على مشروعك</div>
    <p class="text">مرحباً ${name}، هناك تحديث جديد على مشروعك:</p>
    <div class="info-grid">
      <div class="info-row"><div class="info-label">اسم المشروع</div><div class="info-value">${projectName}</div></div>
      <div class="info-row"><div class="info-label">الحالة الحالية</div><div class="info-value"><span class="badge ${s.badge}">${s.label}</span></div></div>
      <div class="info-row"><div class="info-label">نسبة الإنجاز</div><div class="info-value">${progress}%</div></div>
    </div>
    ${progressBar}
    ${noteSection}
    <a href="${SITE_URL}/dashboard" class="btn">متابعة المشروع</a>
  `);
  return sendEmail(to, name, `تحديث مشروع: ${projectName} — Qirox`, html);
}

export async function sendTaskAssignedEmail(to: string, name: string, taskTitle: string, projectName: string, priority: string, deadline?: string): Promise<boolean> {
  const priorityLabels: Record<string, { label: string; badge: string }> = {
    low:    { label: "منخفض", badge: "badge-black" },
    medium: { label: "متوسط", badge: "badge-blue" },
    high:   { label: "عالي",  badge: "badge-amber" },
    urgent: { label: "عاجل",  badge: "badge-red" },
  };
  const p = priorityLabels[priority] || { label: priority, badge: "badge-black" };
  const deadlineRow = deadline ? `<div class="info-row"><div class="info-label">الموعد النهائي</div><div class="info-value">${new Date(deadline).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</div></div>` : "";
  const html = baseTemplate(`
    <div class="tag">مهمة جديدة</div>
    <div class="title">🎯 تم تكليفك بمهمة جديدة</div>
    <p class="text">مرحباً ${name}، تم إسناد مهمة جديدة إليك في مشروع <strong>${projectName}</strong>:</p>
    <div class="info-grid">
      <div class="info-row"><div class="info-label">المهمة</div><div class="info-value">${taskTitle}</div></div>
      <div class="info-row"><div class="info-label">المشروع</div><div class="info-value">${projectName}</div></div>
      <div class="info-row"><div class="info-label">الأولوية</div><div class="info-value"><span class="badge ${p.badge}">${p.label}</span></div></div>
      ${deadlineRow}
    </div>
    <a href="${SITE_URL}/dashboard" class="btn">عرض المهمة</a>
  `);
  return sendEmail(to, name, `مهمة جديدة: ${taskTitle} — Qirox`, html);
}

export async function sendTaskCompletedEmail(to: string, name: string, taskTitle: string, projectName: string, completedBy: string): Promise<boolean> {
  const html = baseTemplate(`
    <div class="tag">إنجاز مهمة</div>
    <div class="title">✅ تم إنجاز مهمة في مشروعك</div>
    <p class="text">مرحباً ${name}، تم الانتهاء من مهمة في مشروع <strong>${projectName}</strong>:</p>
    <div class="info-grid">
      <div class="info-row"><div class="info-label">المهمة</div><div class="info-value">${taskTitle}</div></div>
      <div class="info-row"><div class="info-label">المشروع</div><div class="info-value">${projectName}</div></div>
      <div class="info-row"><div class="info-label">أنجزها</div><div class="info-value">${completedBy}</div></div>
      <div class="info-row"><div class="info-label">التاريخ</div><div class="info-value">${new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</div></div>
    </div>
    <a href="${SITE_URL}/dashboard" class="btn">متابعة المشروع</a>
  `);
  return sendEmail(to, name, `إنجاز مهمة: ${taskTitle} — Qirox`, html);
}

export async function sendDirectEmail(to: string, toName: string, subject: string, body: string): Promise<boolean> {
  const html = baseTemplate(`
    <div class="tag">رسالة من فريق Qirox</div>
    <div class="title">${subject}</div>
    <div class="text" style="white-space:pre-line;">${body}</div>
    <hr class="divider"/>
    <p class="text" style="font-size:12px;color:#9ca3af;">هذه الرسالة أُرسلت إليك من فريق Qirox.</p>
  `);
  return sendEmail(to, toName || to, subject, html);
}

export async function sendAdminNewClientEmail(adminEmail: string, clientName: string, clientEmail: string, clientPhone: string, registeredBy?: string): Promise<boolean> {
  const html = baseTemplate(`
    <div class="tag">عميل جديد</div>
    <div class="title">🎉 تم تسجيل عميل جديد</div>
    <p class="text">تم إنشاء حساب عميل جديد على منصة Qirox${registeredBy ? ` عن طريق <strong>${registeredBy}</strong>` : ''}:</p>
    <div class="info-grid">
      <div class="info-row"><div class="info-label">الاسم</div><div class="info-value">${clientName}</div></div>
      <div class="info-row"><div class="info-label">البريد الإلكتروني</div><div class="info-value">${clientEmail}</div></div>
      <div class="info-row"><div class="info-label">الهاتف</div><div class="info-value">${clientPhone || '—'}</div></div>
      <div class="info-row"><div class="info-label">التاريخ</div><div class="info-value">${new Date().toLocaleString('ar-SA')}</div></div>
    </div>
    <a href="${SITE_URL}/admin/customers" class="btn">عرض العميل</a>
  `);
  return sendEmail(adminEmail, "فريق Qirox", "عميل جديد — Qirox 🎉", html);
}

export async function sendAdminNewOrderEmail(adminEmail: string, clientName: string, clientEmail: string, orderId: string, services: string[], totalAmount?: number): Promise<boolean> {
  const servicesList = services.map(s => `<div class="highlight">• ${s}</div>`).join("") || '<div class="highlight">—</div>';
  const html = baseTemplate(`
    <div class="tag">طلب جديد</div>
    <div class="title">📦 طلب جديد بانتظار المراجعة</div>
    <p class="text">وردَ طلب جديد من العميل <strong>${clientName}</strong> ويحتاج إلى مراجعة:</p>
    <div class="info-grid">
      <div class="info-row"><div class="info-label">العميل</div><div class="info-value">${clientName}</div></div>
      <div class="info-row"><div class="info-label">البريد</div><div class="info-value">${clientEmail}</div></div>
      <div class="info-row"><div class="info-label">رقم الطلب</div><div class="info-value">#${orderId.slice(-8).toUpperCase()}</div></div>
      ${totalAmount ? `<div class="info-row"><div class="info-label">المبلغ</div><div class="info-value">${totalAmount.toLocaleString('ar-SA')} ر.س</div></div>` : ''}
      <div class="info-row"><div class="info-label">التاريخ</div><div class="info-value">${new Date().toLocaleString('ar-SA')}</div></div>
    </div>
    <p class="text" style="font-weight:700;">الخدمات المطلوبة:</p>
    ${servicesList}
    <a href="${SITE_URL}/admin/orders" class="btn">مراجعة الطلب الآن</a>
  `);
  return sendEmail(adminEmail, "فريق Qirox", `طلب جديد من ${clientName} — Qirox 📦`, html);
}

export async function sendWelcomeWithCredentialsEmail(to: string, name: string, username: string, password: string): Promise<boolean> {
  const html = baseTemplate(`
    <div class="tag">مرحباً بك</div>
    <div class="title">أهلاً بك في Qirox، ${name}! 🎉</div>
    <p class="text">تم إنشاء حسابك على منصة Qirox بنجاح. إليك بيانات الدخول الخاصة بك:</p>
    <div class="otp-box">
      <div style="font-size:15px;font-weight:700;color:#111;margin-bottom:8px;">بيانات تسجيل الدخول</div>
      <div class="info-grid" style="margin:0;">
        <div class="info-row"><div class="info-label">اسم المستخدم</div><div class="info-value" style="font-family:monospace;font-weight:900;">${username}</div></div>
        <div class="info-row"><div class="info-label">كلمة المرور</div><div class="info-value" style="font-family:monospace;font-weight:900;">${password}</div></div>
      </div>
    </div>
    <p class="text" style="color:#ef4444;font-size:12px;">⚠️ يُرجى تغيير كلمة المرور فور تسجيل الدخول لأول مرة.</p>
    <a href="${SITE_URL}/login" class="btn">تسجيل الدخول الآن</a>
    <hr style="border:none;border-top:1px solid #f0f0f0;margin:20px 0;"/>
    <p class="text" style="font-size:12px;color:#9ca3af;">إذا لم تطلب إنشاء هذا الحساب، تواصل معنا فوراً.</p>
  `);
  return sendEmail(to, name, "بيانات حسابك في Qirox 🚀", html);
}

export async function sendInvoiceEmail(to: string, clientName: string, invoice: {
  invoiceNumber: string; amount: number; vatAmount: number; totalAmount: number;
  status: string; dueDate?: string; notes?: string; items?: { name: string; qty: number; unitPrice: number; total: number }[];
  orderId?: string; createdAt?: string;
}): Promise<boolean> {
  const itemsHtml = invoice.items && invoice.items.length > 0
    ? `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;">
        <thead><tr style="background:#f9f9f9;">
          <th style="padding:8px 12px;text-align:right;border-bottom:1px solid #eee;color:#555;">الوصف</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:1px solid #eee;color:#555;">الكمية</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:1px solid #eee;color:#555;">سعر الوحدة</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:1px solid #eee;color:#555;">الإجمالي</th>
        </tr></thead>
        <tbody>${invoice.items.map(i => `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${i.name}</td>
          <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #f0f0f0;">${i.qty}</td>
          <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #f0f0f0;">${i.unitPrice.toLocaleString()} ر.س</td>
          <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #f0f0f0;">${i.total.toLocaleString()} ر.س</td>
        </tr>`).join("")}</tbody>
      </table>`
    : "";
  const statusBadge = invoice.status === 'paid'
    ? `<span class="badge badge-green">مدفوع ✅</span>`
    : `<span class="badge" style="background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;">غير مدفوع ⏳</span>`;
  const html = baseTemplate(`
    <div class="tag">فاتورة</div>
    <div class="title">فاتورة رقم ${invoice.invoiceNumber}</div>
    <p class="text">عزيزي ${clientName}، يُرجى الاطلاع على تفاصيل الفاتورة أدناه:</p>
    <div class="info-grid">
      <div class="info-row"><div class="info-label">رقم الفاتورة</div><div class="info-value" style="font-family:monospace;font-weight:900;">${invoice.invoiceNumber}</div></div>
      <div class="info-row"><div class="info-label">تاريخ الإصدار</div><div class="info-value">${invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('ar-SA') : new Date().toLocaleDateString('ar-SA')}</div></div>
      ${invoice.dueDate ? `<div class="info-row"><div class="info-label">تاريخ الاستحقاق</div><div class="info-value">${new Date(invoice.dueDate).toLocaleDateString('ar-SA')}</div></div>` : ""}
      <div class="info-row"><div class="info-label">الحالة</div><div class="info-value">${statusBadge}</div></div>
    </div>
    ${itemsHtml}
    <div class="otp-box" style="margin-top:16px;">
      <div class="info-grid" style="margin:0;">
        <div class="info-row"><div class="info-label">المبلغ</div><div class="info-value">${invoice.amount.toLocaleString()} ر.س</div></div>
        ${invoice.vatAmount > 0 ? `<div class="info-row"><div class="info-label">ضريبة القيمة المضافة (15%)</div><div class="info-value">${invoice.vatAmount.toLocaleString()} ر.س</div></div>` : ""}
        <div class="info-row"><div class="info-label" style="font-weight:900;color:#111;">الإجمالي</div><div class="info-value" style="font-weight:900;color:#111;font-size:16px;">${invoice.totalAmount.toLocaleString()} ر.س</div></div>
      </div>
    </div>
    ${invoice.notes ? `<p class="text" style="margin-top:12px;font-size:13px;"><strong>ملاحظات:</strong> ${invoice.notes}</p>` : ""}
    <p class="text" style="font-size:12px;color:#9ca3af;">معلومات التحويل البنكي: IBAN: SA0380205098017222121010</p>
    <a href="${SITE_URL}/dashboard" class="btn">عرض الفاتورة في لوحة التحكم</a>
  `);
  return sendEmail(to, clientName, `فاتورة رقم ${invoice.invoiceNumber} — QIROX`, html);
}

export async function sendReceiptEmail(to: string, clientName: string, receipt: {
  receiptNumber: string; amount: number; amountInWords?: string;
  paymentMethod: string; description?: string; createdAt?: string;
}): Promise<boolean> {
  const methodLabels: Record<string, string> = {
    bank_transfer: "تحويل بنكي", cash: "نقداً", paypal: "PayPal",
    stc_pay: "STC Pay", apple_pay: "Apple Pay", other: "أخرى"
  };
  const html = baseTemplate(`
    <div class="tag">سند قبض</div>
    <div class="title">سند قبض رقم ${receipt.receiptNumber}</div>
    <p class="text">عزيزي ${clientName}، تم استلام مبلغك بنجاح. تفاصيل سند القبض:</p>
    <div class="otp-box">
      <div style="font-size:28px;font-weight:900;color:#111;text-align:center;margin-bottom:4px;">${receipt.amount.toLocaleString()} ر.س</div>
      ${receipt.amountInWords ? `<div style="text-align:center;color:#555;font-size:13px;margin-bottom:8px;">${receipt.amountInWords}</div>` : ""}
    </div>
    <div class="info-grid">
      <div class="info-row"><div class="info-label">رقم السند</div><div class="info-value" style="font-family:monospace;font-weight:900;">${receipt.receiptNumber}</div></div>
      <div class="info-row"><div class="info-label">تاريخ الاستلام</div><div class="info-value">${receipt.createdAt ? new Date(receipt.createdAt).toLocaleDateString('ar-SA') : new Date().toLocaleDateString('ar-SA')}</div></div>
      <div class="info-row"><div class="info-label">طريقة الدفع</div><div class="info-value">${methodLabels[receipt.paymentMethod] || receipt.paymentMethod}</div></div>
      ${receipt.description ? `<div class="info-row"><div class="info-label">الوصف</div><div class="info-value">${receipt.description}</div></div>` : ""}
    </div>
    <p class="text" style="color:#16a34a;font-size:13px;font-weight:700;">✅ تم استلام المبلغ بنجاح — شكراً لثقتك في QIROX</p>
    <a href="${SITE_URL}/dashboard" class="btn">عرض لوحة التحكم</a>
  `);
  return sendEmail(to, clientName, `سند قبض رقم ${receipt.receiptNumber} — QIROX`, html);
}

export async function sendTestEmail(to: string, name: string): Promise<boolean> {
  const html = baseTemplate(`
    <div class="tag">بريد تجريبي</div>
    <div class="title">🧪 اختبار نظام البريد الإلكتروني</div>
    <p class="text">مرحباً ${name}، هذا بريد تجريبي للتأكد من أن نظام إرسال البريد الإلكتروني في Qirox يعمل بشكل صحيح.</p>
    <div class="info-grid">
      <div class="info-row"><div class="info-label">النظام</div><div class="info-value">SMTP2GO</div></div>
      <div class="info-row"><div class="info-label">المرسل</div><div class="info-value">${SENDER}</div></div>
      <div class="info-row"><div class="info-label">التوقيت</div><div class="info-value">${new Date().toLocaleString('ar-SA')}</div></div>
      <div class="info-row"><div class="info-label">الحالة</div><div class="info-value"><span class="badge badge-green">يعمل ✅</span></div></div>
    </div>
    <p class="text">جميع أنواع البريد الإلكتروني جاهزة: ترحيب، تأكيد طلب، تحديث حالة، إشعار مشروع، إسناد مهمة.</p>
    <a href="${SITE_URL}/dashboard" class="btn">الذهاب للوحة التحكم</a>
  `);
  return sendEmail(to, name, "🧪 اختبار نظام البريد — Qirox", html);
}
