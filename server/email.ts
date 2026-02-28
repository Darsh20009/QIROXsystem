const API_KEY = process.env.SMTP2GO_API_KEY || "";
const SENDER = process.env.SMTP2GO_SENDER || "noreply@qiroxstudio.online";
const SENDER_NAME = process.env.SMTP2GO_SENDER_NAME || "Qirox";
const BASE_URL = "https://api.smtp2go.com/v3/email/send";
const LOGO_URL = process.env.EMAIL_LOGO_URL || "https://raw.githubusercontent.com/Darsh20009/QIROXsystem/main/client/public/logo.png";
const SITE_URL = process.env.EMAIL_SITE_URL || "https://qiroxstudio.online";

function cleanName(name: string): string {
  if (!name) return "عزيزي العميل";
  if (name.includes("@")) return name.split("@")[0];
  return name;
}

async function sendEmail(to: string, toName: string, subject: string, htmlBody: string, textBody?: string): Promise<boolean> {
  try {
    const payload: Record<string, any> = {
      api_key: API_KEY,
      to: [`${toName} <${to}>`],
      sender: `${SENDER_NAME} <${SENDER}>`,
      subject,
      html_body: htmlBody,
      text_body: textBody || stripHtml(htmlBody),
    };
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, "\n")
    .trim();
}

/* ── Inline style helpers (email-safe, no class names needed) ── */
const S = {
  wrap:       'max-width:580px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e2e2;font-family:Arial,Helvetica,sans-serif;direction:rtl;',
  header:     'background:#000000;padding:24px 32px;text-align:center;',
  logo:       'color:#ffffff;font-size:26px;font-weight:900;letter-spacing:4px;text-decoration:none;',
  body:       'padding:36px 32px;background:#ffffff;',
  footer:     'background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #f0f0f0;',
  footerText: 'margin:0;font-size:11px;color:#9ca3af;',
  tag:        'display:inline-block;background:#f3f4f6;color:#6b7280;padding:4px 12px;border-radius:20px;font-size:11px;margin-bottom:14px;',
  title:      'margin:0 0 16px 0;font-size:20px;font-weight:800;color:#111111;',
  text:       'margin:0 0 14px 0;font-size:14px;color:#555555;line-height:1.8;',
  otpBox:     'background:#f3f4f6;border-radius:12px;padding:24px;text-align:center;margin:20px 0;',
  otpCode:    'margin:0;font-size:44px;font-weight:900;color:#111111;letter-spacing:14px;font-family:Courier New,Courier,monospace;',
  otpNote:    'margin:10px 0 0 0;font-size:12px;color:#9ca3af;',
  btn:        'display:inline-block;background:#000000;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;margin:14px 0;',
  divider:    'border:none;border-top:1px solid #f0f0f0;margin:22px 0;',
  highlight:  'background:#fafafa;border-right:3px solid #000000;padding:11px 14px;margin:10px 0;font-size:13px;color:#374151;',
  labelCell:  'padding:8px 12px;font-size:12px;color:#9ca3af;background:#f9fafb;border:1px solid #f0f0f0;font-weight:600;width:35%;text-align:right;',
  valueCell:  'padding:8px 12px;font-size:13px;color:#111111;border:1px solid #f0f0f0;font-weight:600;text-align:right;',
  badgeBlack: 'display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;background:#000000;color:#ffffff;',
  badgeGreen: 'display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;background:#d1fae5;color:#065f46;',
  badgeBlue:  'display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;background:#dbeafe;color:#1e40af;',
  badgeAmber: 'display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;background:#fef3c7;color:#92400e;',
  badgeRed:   'display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;background:#fee2e2;color:#991b1b;',
};

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;direction:rtl;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4;padding:24px 16px;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" border="0" style="${S.wrap}">
  <tr><td style="${S.header}">
    <span style="${S.logo}">QIROX</span>
  </td></tr>
  <tr><td style="${S.body}">${content}</td></tr>
  <tr><td style="${S.footer}">
    <p style="${S.footerText}">&#169; 2026 QIROX Studio &bull; <a href="${SITE_URL}" style="color:#9ca3af;text-decoration:none;">qiroxstudio.online</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function tag(text: string)                    { return `<p style="${S.tag}">${text}</p>`; }
function title(html: string)                  { return `<p style="${S.title}">${html}</p>`; }
function text(html: string, extra = '')        { return `<p style="${S.text}${extra}">${html}</p>`; }
function highlight(html: string, extra = '')   { return `<p style="${S.highlight}${extra}">${html}</p>`; }
function btn(url: string, label: string)       { return `<a href="${url}" style="${S.btn}">${label}</a>`; }
function divider()                             { return `<hr style="${S.divider}" />`; }
function badge(cls: keyof typeof S, lbl: string) { return `<span style="${S[cls]}">${lbl}</span>`; }
function infoTable(rows: [string, string][])  {
  const rowsHtml = rows.map(([l, v]) =>
    `<tr><td style="${S.labelCell}">${l}</td><td style="${S.valueCell}">${v}</td></tr>`
  ).join('');
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:16px 0;">${rowsHtml}</table>`;
}
function otpBox(code: string, note: string)   {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
<tr><td style="${S.otpBox}">
  <p style="${S.otpNote}">الرمز السري &mdash; OTP Code</p>
  <p style="${S.otpCode}">${code}</p>
  <p style="${S.otpNote}">${note}</p>
</td></tr></table>`;
}

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  const displayName = cleanName(name);
  const html = baseTemplate(
    tag("مرحباً بك") +
    title(`اهلاً بك في QIROX، ${displayName}!`) +
    text("تم انشاء حسابك بنجاح. انت الآن جزء من منظومة QIROX لبناء الانظمة الرقمية الاحترافية.") +
    highlight("لوحة التحكم الخاصة بك جاهزة &mdash; تصفح خدماتنا وابدأ مشروعك الأول") +
    btn(`${SITE_URL}/dashboard`, "الذهاب للوحة التحكم") +
    divider() +
    text("اذا لم تقم بانشاء هذا الحساب، تجاهل هذا البريد.", "font-size:12px;color:#9ca3af;")
  );
  return sendEmail(to, displayName, "مرحباً بك في QIROX", html);
}

export async function sendOtpEmail(to: string, name: string, otp: string): Promise<boolean> {
  const displayName = cleanName(name);
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;direction:rtl;text-align:right;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e2e2e2;overflow:hidden;max-width:560px;">
      <tr>
        <td style="background:#000000;padding:24px 32px;text-align:center;">
          <span style="color:#ffffff;font-size:24px;font-weight:900;letter-spacing:4px;">QIROX</span>
        </td>
      </tr>
      <tr>
        <td style="padding:36px 32px;">
          <p style="margin:0 0 8px 0;font-size:13px;color:#6b7280;">اعادة تعيين كلمة المرور</p>
          <h2 style="margin:0 0 20px 0;font-size:22px;font-weight:800;color:#111111;">رمز التحقق الخاص بك</h2>
          <p style="margin:0 0 24px 0;font-size:15px;color:#555555;line-height:1.7;">
            مرحبا ${displayName}، استخدم الرمز التالي لاعادة تعيين كلمة المرور:
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#f3f4f6;border-radius:12px;padding:28px;text-align:center;">
                <p style="margin:0 0 12px 0;font-size:13px;color:#9ca3af;">الرمز السري — OTP Code</p>
                <p style="margin:0;font-size:48px;font-weight:900;color:#111111;letter-spacing:14px;font-family:Courier,monospace;">${otp}</p>
                <p style="margin:12px 0 0 0;font-size:12px;color:#9ca3af;">صالح لمدة 10 دقائق فقط &bull; لا تشاركه مع احد</p>
              </td>
            </tr>
          </table>
          <p style="margin:24px 0 0 0;font-size:12px;color:#9ca3af;">
            اذا لم تطلب هذا، تجاهل البريد وسيبقى حسابك آمنا.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #f0f0f0;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">2026 QIROX Studio &bull; qiroxstudio.online</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
  const text = `QIROX Studio - رمز التحقق

مرحبا ${displayName}،

رمز اعادة تعيين كلمة المرور:

${otp}

صالح لمدة 10 دقائق فقط. لا تشاركه مع احد.

اذا لم تطلب هذا، تجاهل البريد.

QIROX Studio - qiroxstudio.online`;
  return sendEmail(to, displayName, `${otp} - رمز التحقق | QIROX`, html, text);
}

export async function sendEmailVerificationEmail(to: string, name: string, otp: string): Promise<boolean> {
  const displayName = cleanName(name);
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;direction:rtl;text-align:right;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e2e2e2;overflow:hidden;max-width:560px;">
      <!-- header -->
      <tr>
        <td style="background:#000000;padding:24px 32px;text-align:center;">
          <span style="color:#ffffff;font-size:24px;font-weight:900;letter-spacing:4px;">QIROX</span>
        </td>
      </tr>
      <!-- body -->
      <tr>
        <td style="padding:36px 32px;">
          <p style="margin:0 0 8px 0;font-size:13px;color:#6b7280;">رمز تفعيل الحساب</p>
          <h2 style="margin:0 0 20px 0;font-size:22px;font-weight:800;color:#111111;">مرحباً ${displayName}</h2>
          <p style="margin:0 0 24px 0;font-size:15px;color:#555555;line-height:1.7;">
            رمز التحقق الخاص بك لتفعيل حسابك في QIROX Studio:
          </p>
          <!-- OTP box -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#f3f4f6;border-radius:12px;padding:28px;text-align:center;">
                <p style="margin:0 0 12px 0;font-size:13px;color:#9ca3af;">الرمز السري — OTP Code</p>
                <p style="margin:0;font-size:48px;font-weight:900;color:#111111;letter-spacing:14px;font-family:Courier,monospace;">${otp}</p>
                <p style="margin:12px 0 0 0;font-size:12px;color:#9ca3af;">صالح لمدة 30 دقيقة فقط &bull; لا تشاركه مع احد</p>
              </td>
            </tr>
          </table>
          <p style="margin:24px 0 0 0;font-size:12px;color:#9ca3af;">
            اذا لم تقم بانشاء هذا الحساب، تجاهل هذا البريد.
          </p>
        </td>
      </tr>
      <!-- footer -->
      <tr>
        <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #f0f0f0;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">2026 QIROX Studio &bull; qiroxstudio.online</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
  const text = `QIROX Studio

مرحبا ${displayName}،

رمز التحقق الخاص بك:

${otp}

صالح لمدة 30 دقيقة فقط. لا تشاركه مع احد.

اذا لم تقم بانشاء هذا الحساب، تجاهل هذا البريد.

QIROX Studio - qiroxstudio.online`;
  return sendEmail(to, displayName, `${otp} - رمز تفعيل حسابك | QIROX`, html, text);
}

export async function sendOrderConfirmationEmail(to: string, name: string, orderId: string, items: string[]): Promise<boolean> {
  const displayName = cleanName(name);
  const itemsList = items.map(i => highlight(`&#8226; ${i}`)).join("");
  const html = baseTemplate(
    tag("تأكيد الطلب") +
    title("تم استلام طلبك!") +
    text(`شكراً ${displayName}، تم استلام طلبك بنجاح ورقم الطلب هو:`) +
    `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
      <tr><td style="background:#f3f4f6;border-radius:10px;padding:20px;text-align:center;">
        <p style="margin:0;font-size:20px;font-weight:900;color:#111111;letter-spacing:3px;font-family:Courier New,Courier,monospace;">#${orderId.slice(-8).toUpperCase()}</p>
      </td></tr>
    </table>` +
    text("محتويات الطلب:") +
    itemsList +
    text(`سيتواصل معك فريق QIROX خلال <strong>24 ساعة</strong> لإتمام الدفع والبدء في التنفيذ.`) +
    btn(`${SITE_URL}/dashboard`, "متابعة الطلب")
  );
  return sendEmail(to, displayName, `تأكيد طلبك #${orderId.slice(-8).toUpperCase()} | QIROX`, html);
}

export async function sendOrderStatusEmail(to: string, name: string, orderId: string, status: string): Promise<boolean> {
  const displayName = cleanName(name);
  const statusMap: Record<string, { label: string; icon: string; desc: string; badgeKey: keyof typeof S }> = {
    pending:     { label: "قيد المراجعة",  icon: "◌", desc: "طلبك قيد المراجعة من قبل فريقنا",           badgeKey: "badgeAmber" },
    approved:    { label: "تمت الموافقة",   icon: "✓", desc: "تمت الموافقة على طلبك وبدأ العمل عليه",      badgeKey: "badgeBlue" },
    in_progress: { label: "قيد التنفيذ",    icon: "⚙", desc: "يعمل فريقنا على تنفيذ مشروعك",             badgeKey: "badgeBlue" },
    review:      { label: "مراجعة العميل", icon: "◉", desc: "المشروع جاهز لمراجعتك",                     badgeKey: "badgeAmber" },
    completed:   { label: "مكتمل",          icon: "✓", desc: "تم تسليم مشروعك بنجاح",                     badgeKey: "badgeGreen" },
    rejected:    { label: "مرفوض",          icon: "✕", desc: "للأسف تم رفض الطلب. تواصل معنا للمزيد",    badgeKey: "badgeRed" },
  };
  const s = statusMap[status] || { label: status, icon: "•", desc: "تم تحديث حالة طلبك", badgeKey: "badgeBlack" as keyof typeof S };
  const html = baseTemplate(
    tag("تحديث حالة الطلب") +
    title(`${s.icon} ${s.label}`) +
    badge(s.badgeKey, s.label) +
    text(s.desc) +
    highlight(`رقم الطلب: #${orderId.slice(-8).toUpperCase()}`) +
    btn(`${SITE_URL}/dashboard`, "عرض الطلب")
  );
  return sendEmail(to, displayName, `تحديث طلبك: ${s.label} | QIROX`, html);
}

export async function sendMessageNotificationEmail(to: string, name: string, senderName: string, preview: string): Promise<boolean> {
  const html = baseTemplate(
    tag("رسالة جديدة") +
    title(`لديك رسالة جديدة من ${senderName}`) +
    highlight(`&ldquo;${preview.slice(0, 120)}${preview.length > 120 ? '...' : ''}&rdquo;`) +
    btn(`${SITE_URL}/dashboard`, "الرد على الرسالة")
  );
  return sendEmail(to, name, `رسالة من ${senderName} | QIROX`, html);
}

export async function sendProjectUpdateEmail(to: string, name: string, projectName: string, status: string, progress: number, note?: string): Promise<boolean> {
  const statusLabels: Record<string, { label: string; icon: string; badgeKey: keyof typeof S }> = {
    planning:    { label: "التخطيط",      icon: "◌", badgeKey: "badgeAmber" },
    in_progress: { label: "قيد التنفيذ",  icon: "⚙", badgeKey: "badgeBlue" },
    review:      { label: "المراجعة",     icon: "◉", badgeKey: "badgeAmber" },
    completed:   { label: "مكتمل",        icon: "✓", badgeKey: "badgeGreen" },
    on_hold:     { label: "متوقف مؤقتاً", icon: "⏸", badgeKey: "badgeRed" },
  };
  const s = statusLabels[status] || { label: status, icon: "•", badgeKey: "badgeBlack" as keyof typeof S };
  const progressBar = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0;">
      <tr><td style="background:#f3f4f6;border-radius:999px;height:10px;overflow:hidden;">
        <table height="10" cellpadding="0" cellspacing="0" border="0">
          <tr><td width="${Math.min(progress, 100)}%" style="background:#000000;height:10px;border-radius:999px;"></td></tr>
        </table>
      </td></tr>
    </table>
    <p style="font-size:12px;color:#6b7280;text-align:center;margin:4px 0;">${progress}% مكتمل</p>
  `;
  const html = baseTemplate(
    tag("تحديث المشروع") +
    title(`${s.icon} تحديث على مشروعك`) +
    text(`مرحباً ${cleanName(name)}، هناك تحديث جديد على مشروعك:`) +
    infoTable([
      ["اسم المشروع", projectName],
      ["الحالة الحالية", badge(s.badgeKey, s.label)],
      ["نسبة الإنجاز", `${progress}%`],
    ]) +
    progressBar +
    (note ? highlight(`ملاحظة: ${note}`) : "") +
    btn(`${SITE_URL}/dashboard`, "متابعة المشروع")
  );
  return sendEmail(to, name, `تحديث مشروع: ${projectName} | QIROX`, html);
}

export async function sendTaskAssignedEmail(to: string, name: string, taskTitle: string, projectName: string, priority: string, deadline?: string): Promise<boolean> {
  const priorityLabels: Record<string, { label: string; badgeKey: keyof typeof S }> = {
    low:    { label: "منخفض", badgeKey: "badgeBlack" },
    medium: { label: "متوسط", badgeKey: "badgeBlue" },
    high:   { label: "عالي",  badgeKey: "badgeAmber" },
    urgent: { label: "عاجل",  badgeKey: "badgeRed" },
  };
  const p = priorityLabels[priority] || { label: priority, badgeKey: "badgeBlack" as keyof typeof S };
  const rows: [string, string][] = [
    ["المهمة", taskTitle],
    ["المشروع", projectName],
    ["الأولوية", badge(p.badgeKey, p.label)],
  ];
  if (deadline) rows.push(["الموعد النهائي", new Date(deadline).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })]);
  const html = baseTemplate(
    tag("مهمة جديدة") +
    title("تم تكليفك بمهمة جديدة") +
    text(`مرحباً ${cleanName(name)}، تم اسناد مهمة جديدة اليك في مشروع <strong>${projectName}</strong>:`) +
    infoTable(rows) +
    btn(`${SITE_URL}/dashboard`, "عرض المهمة")
  );
  return sendEmail(to, name, `مهمة جديدة: ${taskTitle} | QIROX`, html);
}

export async function sendTaskCompletedEmail(to: string, name: string, taskTitle: string, projectName: string, completedBy: string): Promise<boolean> {
  const html = baseTemplate(
    tag("انجاز مهمة") +
    title("تم انجاز مهمة في مشروعك") +
    text(`مرحباً ${cleanName(name)}، تم الانتهاء من مهمة في مشروع <strong>${projectName}</strong>:`) +
    infoTable([
      ["المهمة", taskTitle],
      ["المشروع", projectName],
      ["انجزها", completedBy],
      ["التاريخ", new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })],
    ]) +
    btn(`${SITE_URL}/dashboard`, "متابعة المشروع")
  );
  return sendEmail(to, name, `انجاز مهمة: ${taskTitle} | QIROX`, html);
}

export async function sendDirectEmail(to: string, toName: string, subject: string, body: string): Promise<boolean> {
  const html = baseTemplate(
    tag("رسالة من فريق QIROX") +
    title(subject) +
    `<p style="margin:0 0 14px 0;font-size:14px;color:#555555;line-height:1.8;white-space:pre-line;">${body}</p>` +
    divider() +
    text("هذه الرسالة ارسلت اليك من فريق QIROX.", "font-size:12px;color:#9ca3af;")
  );
  return sendEmail(to, toName || to, subject, html);
}

export async function sendAdminNewClientEmail(adminEmail: string, clientName: string, clientEmail: string, clientPhone: string, registeredBy?: string): Promise<boolean> {
  const html = baseTemplate(
    tag("عميل جديد") +
    title("تم تسجيل عميل جديد") +
    text(`تم انشاء حساب عميل جديد على منصة QIROX${registeredBy ? ` عن طريق <strong>${registeredBy}</strong>` : ''}:`) +
    infoTable([
      ["الاسم", clientName],
      ["البريد الالكتروني", clientEmail],
      ["الهاتف", clientPhone || "—"],
      ["التاريخ", new Date().toLocaleString('ar-SA')],
    ]) +
    btn(`${SITE_URL}/admin/customers`, "عرض العميل")
  );
  return sendEmail(adminEmail, "فريق QIROX", `عميل جديد: ${clientName} | QIROX`, html);
}

export async function sendAdminNewOrderEmail(adminEmail: string, clientName: string, clientEmail: string, orderId: string, services: string[], totalAmount?: number): Promise<boolean> {
  const servicesList = services.map(s => highlight(`&#8226; ${s}`)).join("") || highlight("—");
  const rows: [string, string][] = [
    ["العميل", clientName],
    ["البريد", clientEmail],
    ["رقم الطلب", `#${orderId.slice(-8).toUpperCase()}`],
  ];
  if (totalAmount) rows.push(["المبلغ", `${totalAmount.toLocaleString('ar-SA')} ر.س`]);
  rows.push(["التاريخ", new Date().toLocaleString('ar-SA')]);
  const html = baseTemplate(
    tag("طلب جديد") +
    title("طلب جديد بانتظار المراجعة") +
    text(`ورد طلب جديد من العميل <strong>${clientName}</strong> ويحتاج الى مراجعة:`) +
    infoTable(rows) +
    `<p style="${S.text}font-weight:700;">الخدمات المطلوبة:</p>` +
    servicesList +
    btn(`${SITE_URL}/admin/orders`, "مراجعة الطلب الآن")
  );
  return sendEmail(adminEmail, "فريق QIROX", `طلب جديد من ${clientName} | QIROX`, html);
}

export async function sendWelcomeWithCredentialsEmail(to: string, name: string, username: string, password: string): Promise<boolean> {
  const displayName = cleanName(name);
  const html = baseTemplate(
    tag("مرحباً بك") +
    title(`اهلاً بك في QIROX، ${displayName}!`) +
    text("تم انشاء حسابك على منصة QIROX بنجاح. اليك بيانات الدخول الخاصة بك:") +
    infoTable([
      ["اسم المستخدم", `<span style="font-family:Courier New,Courier,monospace;font-weight:900;">${username}</span>`],
      ["كلمة المرور", `<span style="font-family:Courier New,Courier,monospace;font-weight:900;">${password}</span>`],
    ]) +
    `<p style="margin:0 0 14px 0;font-size:13px;color:#ef4444;">يُرجى تغيير كلمة المرور فور تسجيل الدخول لأول مرة.</p>` +
    btn(`${SITE_URL}/login`, "تسجيل الدخول الآن") +
    divider() +
    text("اذا لم تطلب انشاء هذا الحساب، تواصل معنا فوراً.", "font-size:12px;color:#9ca3af;")
  );
  return sendEmail(to, displayName, "بيانات حسابك في QIROX", html);
}

export async function sendInvoiceEmail(to: string, clientName: string, invoice: {
  invoiceNumber: string; amount: number; vatAmount: number; totalAmount: number;
  status: string; dueDate?: string; notes?: string; items?: { name: string; qty: number; unitPrice: number; total: number }[];
  orderId?: string; createdAt?: string;
}): Promise<boolean> {
  const itemsHtml = invoice.items && invoice.items.length > 0
    ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:16px 0;font-size:13px;">
        <tr style="background:#f9fafb;">
          <th style="padding:8px 12px;text-align:right;border-bottom:1px solid #e5e5e5;color:#555555;font-weight:600;">الوصف</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:1px solid #e5e5e5;color:#555555;font-weight:600;">الكمية</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:1px solid #e5e5e5;color:#555555;font-weight:600;">سعر الوحدة</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:1px solid #e5e5e5;color:#555555;font-weight:600;">الاجمالي</th>
        </tr>
        ${invoice.items.map(i => `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${i.name}</td>
          <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #f0f0f0;">${i.qty}</td>
          <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #f0f0f0;">${i.unitPrice.toLocaleString()} ر.س</td>
          <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #f0f0f0;">${i.total.toLocaleString()} ر.س</td>
        </tr>`).join("")}
      </table>`
    : "";
  const statusBadge = invoice.status === 'paid'
    ? badge("badgeGreen", "مدفوع")
    : badge("badgeAmber", "غير مدفوع");
  const invoiceRows: [string, string][] = [
    ["رقم الفاتورة", `<span style="font-family:Courier New,Courier,monospace;font-weight:900;">${invoice.invoiceNumber}</span>`],
    ["تاريخ الاصدار", invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('ar-SA') : new Date().toLocaleDateString('ar-SA')],
  ];
  if (invoice.dueDate) invoiceRows.push(["تاريخ الاستحقاق", new Date(invoice.dueDate).toLocaleDateString('ar-SA')]);
  invoiceRows.push(["الحالة", statusBadge]);
  const totalsRows: [string, string][] = [["المبلغ", `${invoice.amount.toLocaleString()} ر.س`]];
  if (invoice.vatAmount > 0) totalsRows.push(["ضريبة القيمة المضافة (15%)", `${invoice.vatAmount.toLocaleString()} ر.س`]);
  totalsRows.push(["الاجمالي", `<strong style="font-size:16px;">${invoice.totalAmount.toLocaleString()} ر.س</strong>`]);
  const html = baseTemplate(
    tag("فاتورة") +
    title(`فاتورة رقم ${invoice.invoiceNumber}`) +
    text(`عزيزي ${clientName}، يُرجى الاطلاع على تفاصيل الفاتورة ادناه:`) +
    infoTable(invoiceRows) +
    itemsHtml +
    infoTable(totalsRows) +
    (invoice.notes ? text(`<strong>ملاحظات:</strong> ${invoice.notes}`, "font-size:13px;margin-top:12px;") : "") +
    text("معلومات التحويل البنكي: IBAN: SA0380205098017222121010", "font-size:12px;color:#9ca3af;") +
    btn(`${SITE_URL}/dashboard`, "عرض الفاتورة في لوحة التحكم")
  );
  return sendEmail(to, clientName, `فاتورة رقم ${invoice.invoiceNumber} | QIROX`, html);
}

export async function sendReceiptEmail(to: string, clientName: string, receipt: {
  receiptNumber: string; amount: number; amountInWords?: string;
  paymentMethod: string; description?: string; createdAt?: string;
}): Promise<boolean> {
  const methodLabels: Record<string, string> = {
    bank_transfer: "تحويل بنكي", cash: "نقداً", paypal: "PayPal",
    stc_pay: "STC Pay", apple_pay: "Apple Pay", other: "أخرى"
  };
  const rows: [string, string][] = [
    ["رقم السند", `<span style="font-family:Courier New,Courier,monospace;font-weight:900;">${receipt.receiptNumber}</span>`],
    ["تاريخ الاستلام", receipt.createdAt ? new Date(receipt.createdAt).toLocaleDateString('ar-SA') : new Date().toLocaleDateString('ar-SA')],
    ["طريقة الدفع", methodLabels[receipt.paymentMethod] || receipt.paymentMethod],
  ];
  if (receipt.description) rows.push(["الوصف", receipt.description]);
  const html = baseTemplate(
    tag("سند قبض") +
    title(`سند قبض رقم ${receipt.receiptNumber}`) +
    text(`عزيزي ${clientName}، تم استلام مبلغك بنجاح. تفاصيل سند القبض:`) +
    `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
      <tr><td style="background:#f3f4f6;border-radius:10px;padding:24px;text-align:center;">
        <p style="margin:0 0 4px 0;font-size:32px;font-weight:900;color:#111111;">${receipt.amount.toLocaleString()} ر.س</p>
        ${receipt.amountInWords ? `<p style="margin:0;text-align:center;color:#555555;font-size:13px;">${receipt.amountInWords}</p>` : ""}
      </td></tr>
    </table>` +
    infoTable(rows) +
    `<p style="margin:14px 0;font-size:13px;font-weight:700;color:#16a34a;">تم استلام المبلغ بنجاح &mdash; شكراً لثقتك في QIROX</p>` +
    btn(`${SITE_URL}/dashboard`, "عرض لوحة التحكم")
  );
  return sendEmail(to, clientName, `سند قبض رقم ${receipt.receiptNumber} | QIROX`, html);
}

export async function sendTestEmail(to: string, name: string): Promise<boolean> {
  const html = baseTemplate(
    tag("بريد تجريبي") +
    title("اختبار نظام البريد الالكتروني") +
    text(`مرحباً ${name}، هذا بريد تجريبي للتأكد من ان نظام ارسال البريد الالكتروني في QIROX يعمل بشكل صحيح.`) +
    infoTable([
      ["النظام", "SMTP2GO"],
      ["المرسل", SENDER],
      ["التوقيت", new Date().toLocaleString('ar-SA')],
      ["الحالة", badge("badgeGreen", "يعمل")],
    ]) +
    text("جميع انواع البريد الالكتروني جاهزة: ترحيب، تأكيد طلب، تحديث حالة، اشعار مشروع، اسناد مهمة.") +
    btn(`${SITE_URL}/dashboard`, "الذهاب للوحة التحكم")
  );
  return sendEmail(to, name, "اختبار نظام البريد | QIROX", html);
}
