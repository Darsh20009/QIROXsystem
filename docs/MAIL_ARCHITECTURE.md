# MAIL_ARCHITECTURE.md — QIROX Mail Infrastructure Blueprint

> **Mode:** Blueprint only. No code modified.
> **Date:** 2026-07-08

---

## 1. Current Mail Infrastructure

### Transport
- **Primary:** cPanel SMTP via Nodemailer (`server/email.ts`)
- **Env vars:** `CPANEL_SMTP_HOST`, `CPANEL_SMTP_PORT` (465), `CPANEL_SMTP_USER`, `CPANEL_SMTP_PASS`
- **Fallback:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- **Secondary fallback mentioned in docs:** SMTP2GO (API key not set)
- **Per-role sending:** `sendEmailAs(fromEmail, ...)` — looks up `MailAccountModel` in MongoDB

### Email Accounts Pattern
```
info@qiroxstudio.online         → General inquiries
hr@qiroxstudio.online           → Employee communications
marketing@qiroxstudio.online    → Campaigns
support@qiroxstudio.online      → Support tickets
noreply@qiroxstudio.online      → Transactional (system emails)
```

---

## 2. DNS Requirements

For reliable email delivery from a cPanel-hosted domain, the following DNS records are required:

### SPF Record (Sender Policy Framework)
```dns
Type: TXT
Host: qiroxstudio.online
Value: v=spf1 include:cpanel-server-ip +a +mx ~all

Purpose: Tells receiving servers which IPs are authorized to send email
         for qiroxstudio.online. Without this, emails land in spam.
```

### DKIM (DomainKeys Identified Mail)
```dns
Type: TXT
Host: default._domainkey.qiroxstudio.online
Value: v=DKIM1; k=rsa; p=<public-key-from-cpanel>

Purpose: Cryptographic signature proving the email was not tampered with
         in transit. cPanel generates the key pair automatically.
         Must enable in cPanel: Email → Authentication → DKIM → Enable.
```

### DMARC (Domain-based Message Authentication)
```dns
Type: TXT
Host: _dmarc.qiroxstudio.online
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@qiroxstudio.online; ruf=mailto:dmarc-reports@qiroxstudio.online; fo=1; adkim=r; aspf=r; pct=100

Purpose: Policy telling receiving servers what to do with mail that fails
         SPF/DKIM. Start with p=none (monitor), then quarantine, then reject.
         rua: Aggregate reports destination.
         ruf: Forensic reports destination.

Phase 1 (monitoring): p=none
Phase 2 (quarantine): p=quarantine; pct=25 (then 50, then 100)
Phase 3 (enforce):    p=reject
```

### MX Records (for receiving)
```dns
Type: MX
Host: qiroxstudio.online
Priority: 10  Value: mail.qiroxstudio.online
```

### Reverse DNS (PTR)
Request PTR record setup from the cPanel hosting provider:
```
Server IP → mail.qiroxstudio.online
```
Without PTR, many servers (Gmail, Outlook) treat email as spam.

---

## 3. Email Account Provisioning Architecture

### Current Flow
```
Admin → AdminMailAccounts → POST /api/admin/mail-accounts
    → MailAccountModel.create({ email, smtpUser, smtpPass, ... })
    → Credentials stored in MongoDB (encryption status unknown)
```

### Required Flow (V4)
```
Admin → AdminMailAccounts → POST /api/admin/mail-accounts
    → Validate: email must be @qiroxstudio.online (domain whitelist)
    → Encrypt credentials using AES-256-GCM before storing
    → MailAccountModel.create({ email, encryptedCredentials, iv })
    → Test connection before saving
    → Log to ActivityLog
```

### Employee Email Provisioning
```
Admin creates employee → POST /api/admin/users
    → Auto-provision: username@qiroxstudio.online via cPanel API
    → Set initial password → send welcome email
    → Add to MailAccountModel for in-app IMAP access

Endpoint: POST /api/admin/provision-employee-emails (already exists)
```

---

## 4. Transactional Email Flows

### 4.1 Password Reset
```
User → POST /api/auth/forgot-password { email }
    → Generate secure token (crypto.randomBytes(32).toString('hex'))
    → Store in OtpModel { target: email, code: token, type: 'reset', expiresAt: +1hr }
    → sendEmail(email, name, "إعادة تعيين كلمة المرور", resetTemplate(token))
    → Return: { success: true } (never reveal if email exists)

Reset link: https://qiroxstudio.online/reset-password?token=<token>

User → POST /api/auth/reset-password { token, newPassword }
    → OtpModel.findOne({ code: token, type: 'reset', expiresAt: { $gt: now } })
    → If not found: { error: "رمز غير صالح أو منتهي الصلاحية" }
    → hashPassword(newPassword) → UserModel.update
    → OtpModel.deleteOne (single-use token)
    → sendEmail(email, name, "تم تغيير كلمة المرور", confirmationTemplate)
    → Invalidate all active sessions for this user
```

### 4.2 Email Verification
```
User registers → POST /api/auth/register
    → Generate 6-digit OTP
    → OtpModel.create({ target: email, code: otp, type: 'email_verify', expiresAt: +24hr })
    → sendEmail(email, name, "تفعيل حسابك", verifyTemplate(otp))

User → POST /api/auth/verify-email { otp }
    → OtpModel.findOne and validate
    → UserModel.update({ isEmailVerified: true })
    → OtpModel.deleteOne
```

### 4.3 Employee Invitation
```
Admin creates employee account
    → Generate temporary password (crypto.randomBytes(8).toString('hex'))
    → hashPassword(tempPassword) → UserModel.create
    → sendEmail(email, name, "مرحباً في فريق Qirox", inviteTemplate({
        loginUrl, tempPassword, role
      }))
    → Flag: requirePasswordChange: true on first login
```

### 4.4 QMeet Invitation
```
Meeting created with participants
    → For each participantId:
        → UserModel.findById(participantId)
        → sendQMeetInviteEmail(user.email, {
            meetingTitle, scheduledAt, joinCode, meetingLink
          })

15 minutes before meeting:
    → QMeet scheduler → sendQMeetReminderEmail(user.email, { ... })
```

### 4.5 Order / Payment Notifications
```
Order created:
    → sendEmail(client, "استلمنا طلبك", orderConfirmTemplate)
    → sendEmail(admin, "طلب جديد", adminNewOrderTemplate)

Bank transfer uploaded:
    → sendEmail(admin, "إثبات تحويل جديد", proofTemplate)

Order approved:
    → sendEmail(client, "تمت الموافقة على طلبك", approvalTemplate)
    → Invoice PDF attached

Invoice sent:
    → sendEmail(client, "فاتورة جديدة", invoiceTemplate, [{ pdf attachment }])

Installment due reminder (cron):
    → 3 days before due: sendEmail(client, "تذكير بموعد القسط", reminderTemplate)
    → On late: sendEmail(client, "القسط متأخر", lateTemplate)
```

### 4.6 Support Ticket Updates
```
New ticket:
    → sendEmail(support_team, "تذكرة دعم جديدة", newTicketTemplate)

Reply added:
    → sendEmail(client, "رد على تذكرة الدعم", replyTemplate)

Ticket resolved:
    → sendEmail(client, "تم حل تذكرتك", resolvedTemplate)
```

---

## 5. Delivery Flow Architecture

```
Email trigger (anywhere in server)
    │
    ▼
sendEmail(to, name, subject, html, text?, attachments?)
    │
    ▼
getEmailCfg()
    ├── connManager.emailSettings (live DB config — admin panel)
    └── process.env.CPANEL_SMTP_HOST (fallback)
    │
    ▼
nodemailer.createTransport({ host, port, secure, auth })
    │
    ▼
transporter.sendMail({ from, to, subject, html, text, attachments })
    │
    ├── Success → return true → log sent
    │
    └── Failure → return false → log error
              → NO retry currently
              → NO bounce handling currently
```

---

## 6. Failure Recovery Plan

### Current State
- No retry on failure
- No bounce/complaint handling
- No delivery confirmation
- Silent `false` return on failure

### V4 Target Architecture

```
sendEmail() → success?
    │
    ├── Yes → EmailLogModel.create({ status: 'sent', ... })
    │
    └── No → EmailLogModel.create({ status: 'failed', error })
           → Queue retry (attempt 2 after 5min, attempt 3 after 30min)
           → After 3 failures → AlertModel / notify admin
           → Use SMTP2GO as backup if primary fails 3 times
```

**Email log model (design):**
```typescript
interface EmailLog {
  to: string;
  subject: string;
  type: string;           // password_reset | order_confirm | etc.
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  attempts: number;
  lastAttemptAt: Date;
  error?: string;
  provider: 'cpanel' | 'smtp2go';
}
```

---

## 7. Email Marketing Architecture

```
Campaign Creation (AdminEmailMarketing)
    → EmailCampaignModel.create({ subject, html, recipientFilter })

Campaign Send (AdminEmailMarketing → POST /api/admin/email-campaigns/:id/send)
    → Fetch recipients from UserModel (filtered by role, subscription status)
    → Chunk into batches of 50
    → Send each batch with 1-second delay (rate limit compliance)
    → Track: sentCount, failedCount
    → Update campaign status

Missing (V4 target):
    → Open tracking (1x1 pixel with unique URL per recipient)
    → Click tracking (redirect URLs)
    → Unsubscribe link (required by law: CAN-SPAM, Saudi regulations)
    → Unsubscribe preference stored in UserModel
```

---

## 8. Monitoring Plan

| Check | Method | Frequency |
|---|---|---|
| SMTP connection health | Test connection on server start | On startup |
| Daily send count | EmailLogModel.count({ date: today }) | Dashboard widget |
| Failed email rate | EmailLogModel.count({ status: 'failed' }) / total | Alert if > 5% |
| Bounce rate | SMTP2GO webhook or cPanel bounce log | Daily check |
| DMARC reports | Parse rua report emails weekly | Weekly |
| SPF/DKIM validity | External tool check (mxtoolbox.com) | Monthly |
