const MAILBOX_PASSWORD_ENV: Record<string, string> = {
  "hr@qirox.online": "QIROX_MAIL_PASSWORD_HR",
  "m.adbani@qirox.online": "QIROX_MAIL_PASSWORD_M_ADBANI",
  "marketing@qirox.online": "QIROX_MAIL_PASSWORD_MARKETING",
  "mohmmed.aldbani@qirox.online": "QIROX_MAIL_PASSWORD_MOHMMED_ALDBANI",
  "noreply@qirox.online": "QIROX_MAIL_PASSWORD_NOREPLY",
  "noreplyu@qirox.online": "QIROX_MAIL_PASSWORD_NOREPLYU",
  "sohila@qirox.online": "QIROX_MAIL_PASSWORD_SOHILA",
  "support@qirox.online": "QIROX_MAIL_PASSWORD_SUPPORT",
  "y.business@qirox.online": "QIROX_MAIL_PASSWORD_Y_BUSINESS",
  "info@qirox.online": "QIROX_MAIL_PASSWORD_INFO",
};

export function mailboxPasswordEnvKey(emailAddress: string): string | undefined {
  return MAILBOX_PASSWORD_ENV[emailAddress.trim().toLowerCase()];
}

export function getMailboxPassword(emailAddress: string, storedPassword?: string): string {
  const envKey = mailboxPasswordEnvKey(emailAddress);
  const mailboxPassword = envKey ? process.env[envKey] : undefined;
  return mailboxPassword || storedPassword || process.env.CPANEL_SMTP_PASS || process.env.SMTP_PASS || "";
}
