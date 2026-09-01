const NON_EMPLOYEE_ROLES = new Set(["client", "customer", "supplier", "guest"]);

// These mailboxes are team-wide by policy. The server still excludes client
// and external/vendor roles so a shared mailbox never becomes public.
export const TEAM_WIDE_MAILBOXES = new Set([
  "support@qirox.online",
  "info@qirox.online",
  "hr@qirox.online",
]);

export const ALL_EMPLOYEE_MAIL_ROLES = [
  "admin",
  "manager",
  "ceo",
  "cto",
  "employee",
  "developer",
  "designer",
  "support",
  "sales",
  "sales_manager",
  "marketing",
  "accountant",
  "data_entry",
  "hr",
  "merchant",
  "content",
  "investor",
];

export function isTeamWideMailAccount(userRole: unknown, account: any): boolean {
  const role = String(userRole || "").toLowerCase();
  const email = String(account?.emailAddress || "").toLowerCase().trim();
  return TEAM_WIDE_MAILBOXES.has(email) && !!role && !NON_EMPLOYEE_ROLES.has(role);
}