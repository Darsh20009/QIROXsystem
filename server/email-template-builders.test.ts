import test from "node:test";
import assert from "node:assert/strict";
import type { EmailConfig } from "./domains/email/types";
import { connManager } from "./connection-manager";
import { buildMailConfig } from "./config/mail";
import {
  buildWelcomeEmail,
  buildOtpEmail,
  buildEmailVerificationEmail,
  buildLoginOtpEmail,
  buildOrderConfirmationEmail,
  buildOrderStatusEmail,
  buildMessageNotificationEmail,
  buildProjectUpdateEmail,
  buildTaskAssignedEmail,
  buildTaskCompletedEmail,
  buildDirectEmail,
  buildAdminNewClientEmail,
  buildAdminNewOrderEmail,
  buildWelcomeWithCredentialsEmail,
  buildTestEmail,
  buildSupportTicketCreatedEmail,
  buildSupportTicketReplyEmail,
  buildAdminNewTicketEmail,
  buildTaskStatusEmail,
  buildIncomingCallEmail,
  resolveEmailConfig,
} from "./domains/email/domain";

const cfg: EmailConfig = {
  senderName: "QIROX QA",
  siteUrl: "https://qiroxstudio.online",
  logoUrl: "https://qiroxstudio.online/logo.png",
  smtpHost: "smtp.example.test",
  smtpPort: 465,
  smtpUser: "qa@example.test",
  smtpPass: "not-used-by-template-tests",
  smtpSecure: true,
};

const cases: Array<{ name: string; expected: string; build: () => { subject: string; html: string } }> = [
  { name: "welcome", expected: "QA User", build: () => buildWelcomeEmail("QA User", cfg) },
  { name: "password OTP", expected: "987654", build: () => buildOtpEmail("QA User", "987654", cfg) },
  { name: "email verification", expected: "987654", build: () => buildEmailVerificationEmail("QA User", "987654", cfg) },
  { name: "login OTP", expected: "987654", build: () => buildLoginOtpEmail("QA User", "987654", cfg, "QA Browser") },
  { name: "order confirmation", expected: "12345678", build: () => buildOrderConfirmationEmail("QA User", "ORDER-12345678", ["QA Service"], cfg) },
  { name: "order status", expected: "12345678", build: () => buildOrderStatusEmail("QA User", "ORDER-12345678", "approved", cfg) },
  { name: "message notification", expected: "QA Sender", build: () => buildMessageNotificationEmail("QA User", "QA Sender", "QA message preview", cfg) },
  { name: "project update", expected: "QA Project", build: () => buildProjectUpdateEmail("QA User", "QA Project", "in_progress", 50, cfg, "QA note") },
  { name: "task assignment", expected: "QA Task", build: () => buildTaskAssignedEmail("QA User", "QA Task", "QA Project", "high", cfg) },
  { name: "task completion", expected: "QA Task", build: () => buildTaskCompletedEmail("QA User", "QA Task", "QA Project", "QA Staff", cfg) },
  { name: "direct message", expected: "QA subject", build: () => buildDirectEmail("QA User", "QA subject", "QA body", cfg) },
  { name: "admin new client", expected: "QA Client", build: () => buildAdminNewClientEmail("QA Client", "client@example.test", "0500000000", cfg, "QA Admin") },
  { name: "admin new order", expected: "QA Client", build: () => buildAdminNewOrderEmail("QA Client", "client@example.test", "ORDER-12345678", ["QA Service"], cfg, 100) },
  { name: "welcome credentials", expected: "QA User", build: () => buildWelcomeWithCredentialsEmail("QA User", "qa-user", "qa-placeholder", cfg) },
  { name: "test email", expected: "QA SMTP", build: () => buildTestEmail("QA User", "QA SMTP", cfg) },
  { name: "support ticket created", expected: "QA ticket", build: () => buildSupportTicketCreatedEmail("QA User", "QA ticket", "technical", "high", "TICKET-12345678", cfg) },
  { name: "support ticket reply", expected: "QA reply", build: () => buildSupportTicketReplyEmail("QA User", "QA subject", "QA reply", "open", "TICKET-12345678", cfg) },
  { name: "admin new ticket", expected: "QA body", build: () => buildAdminNewTicketEmail("QA Admin", "QA Client", "QA subject", "QA body", "medium", "TICKET-12345678", cfg) },
  { name: "task status", expected: "QA Task", build: () => buildTaskStatusEmail("QA User", "QA Task", "QA Project", "new", "in_progress", cfg) },
  { name: "incoming call", expected: "QA Caller", build: () => buildIncomingCallEmail("QA User", "QA Caller", cfg) },
];

for (const emailCase of cases) {
  test(`email template renders: ${emailCase.name}`, () => {
    const result = emailCase.build();
    assert.ok(result.subject.trim(), "subject should not be empty");
    assert.match(result.html, /<!DOCTYPE html>/i, "HTML should include a document wrapper");
    assert.match(result.html, /<body\b/i, "HTML should include a body");
    assert.ok(result.html.includes(emailCase.expected), `HTML should include its ${emailCase.name} data`);
    assert.ok(result.html.includes(cfg.siteUrl), "template links should use the configured public site");
  });
}

test("system email branding ignores logo environment overrides", () => {
  const previousSettings = connManager.emailSettings;
  const previousLogoEnv = process.env.EMAIL_LOGO_URL;
  try {
    connManager.setEmailSettings({
      siteUrl: "https://qiroxstudio.online",
    });
    process.env.EMAIL_LOGO_URL = "https://example.invalid/another-legacy-logo.png";

    const resolved = resolveEmailConfig();
    assert.equal(resolved.senderName, "QIROX");
    assert.equal(resolved.logoUrl, "https://qiroxstudio.online/qirox-icon-nobg.png");
  } finally {
    connManager.setEmailSettings(previousSettings);
    if (previousLogoEnv === undefined) delete process.env.EMAIL_LOGO_URL;
    else process.env.EMAIL_LOGO_URL = previousLogoEnv;
  }
});

test("mail config keeps QIROX branding regardless of logo environment overrides", () => {
  const config = buildMailConfig({
    EMAIL_LOGO_URL: "https://example.invalid/legacy-brand-logo.png",
    SMTP2GO_SENDER_NAME: "Legacy Brand",
    SMTP2GO_SENDER: "legacy@example.invalid",
  });
  assert.equal(config.branding.senderName, "QIROX");
  assert.equal(config.branding.senderEmail, "noreply@qirox.online");
  assert.equal(config.branding.logoUrl, "https://qiroxstudio.online/qirox-icon-nobg.png");
});
