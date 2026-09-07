/**
 * cPanel UAPI helper — creates/deletes/lists email accounts via cPanel API Token.
 * Docs: https://api.docs.cpanel.net/openapi/cpanel/operation/Email-add_pop/
 */

const CPANEL_HOST = process.env.CPANEL_HOST || "server222.web-hosting.com";
const CPANEL_PORT = process.env.CPANEL_PORT || "2083";

function getAuth() {
  const token = process.env.CPANEL_API_TOKEN || "";
  const user  = process.env.CPANEL_USERNAME  || "";
  return { token, user, ok: !!(token && user) };
}

function baseUrl() {
  return `https://${CPANEL_HOST}:${CPANEL_PORT}`;
}

async function cpanelRequest(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const { token, user, ok } = getAuth();
  if (!ok) throw new Error("cPanel credentials not configured (CPANEL_API_TOKEN / CPANEL_USERNAME)");

  const url = new URL(`${baseUrl()}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `cpanel ${user}:${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`cPanel HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json() as any;
  return data;
}

/**
 * List all email accounts on this cPanel account.
 */
export async function cpanelListEmailAccounts(): Promise<{ email: string; domain: string; user: string }[]> {
  const data = await cpanelRequest("/execute/Email/list_pops");
  if (data.status !== 1) throw new Error(data.errors?.join(", ") || "cPanel list_pops failed");
  return (data.data || []).map((a: any) => ({
    email: `${a.user}@${a.domain}`,
    domain: a.domain,
    user: a.user,
  }));
}

/**
 * Create an email account on cPanel.
 * @param email  full email address e.g. john@qirox.online
 * @param password  plain-text password (min 5 chars)
 * @param quota  MB quota (0 = unlimited)
 */
export async function cpanelCreateEmail(email: string, password: string, quota = 0): Promise<{ ok: boolean; alreadyExists?: boolean }> {
  const [localPart, domain] = email.toLowerCase().split("@");
  if (!localPart || !domain) throw new Error(`Invalid email: ${email}`);

  try {
    const data = await cpanelRequest("/execute/Email/add_pop", {
      email: localPart,
      domain,
      password,
      quota: String(quota),
    });

    if (data.status === 1) return { ok: true };

    const errMsg = (data.errors || []).join(" ");
    if (errMsg.toLowerCase().includes("already exists") || errMsg.includes("exist")) {
      return { ok: true, alreadyExists: true };
    }
    throw new Error(errMsg || "add_pop failed");
  } catch (err: any) {
    if (err.message?.toLowerCase().includes("already exist")) return { ok: true, alreadyExists: true };
    throw err;
  }
}

/**
 * Delete an email account from cPanel.
 */
export async function cpanelDeleteEmail(email: string): Promise<void> {
  const [localPart, domain] = email.toLowerCase().split("@");
  if (!localPart || !domain) throw new Error(`Invalid email: ${email}`);

  const data = await cpanelRequest("/execute/Email/delete_pop", {
    email: localPart,
    domain,
  });

  if (data.status !== 1) {
    throw new Error((data.errors || []).join(", ") || "delete_pop failed");
  }
}

/**
 * Update (change) password of an existing email account.
 */
export async function cpanelChangeEmailPassword(email: string, newPassword: string): Promise<void> {
  const [localPart, domain] = email.toLowerCase().split("@");
  const data = await cpanelRequest("/execute/Email/passwd_pop", {
    email: localPart,
    domain,
    password: newPassword,
  });
  if (data.status !== 1) throw new Error((data.errors || []).join(", ") || "passwd_pop failed");
}

const EMPLOYEE_ROLES = ["admin", "manager", "accountant", "sales_manager", "sales", "developer", "designer", "support"];
const DEFAULT_DOMAIN = "qirox.online";

function generatePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "@#!$";
  const all = upper + lower + digits + special;
  const rand = (s: string) => s[Math.floor(Math.random() * s.length)];
  let p = rand(upper) + rand(lower) + rand(digits) + rand(special);
  for (let i = 0; i < 8; i++) p += rand(all);
  return p.split("").sort(() => Math.random() - 0.5).join("");
}

function toEmailLocal(fullName: string, username: string): string {
  const cleaned = (fullName || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z\s]/g, "").trim().toLowerCase();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]}.${parts[1]}`;
  if (parts.length === 1 && parts[0].length >= 3) return parts[0];
  return username.toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

export interface ProvisionResult {
  created: { userId: string; name: string; email: string; password: string }[];
  skipped: { userId: string; name: string; reason: string }[];
  errors:  { userId: string; name: string; error: string }[];
}

/**
 * Find all employees created in the last `days` days and provision cPanel email accounts for them.
 */
export async function provisionEmployeeEmails(days = 30): Promise<ProvisionResult> {
  const { UserModel, MailAccountModel } = await import("./models");

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const employees = await UserModel.find({
    role: { $in: EMPLOYEE_ROLES },
    createdAt: { $gte: since },
  }).lean() as any[];

  const result: ProvisionResult = { created: [], skipped: [], errors: [] };

  for (const emp of employees) {
    const uid   = String(emp._id);
    const name  = emp.fullName || emp.username;

    // Already has a work email
    if (emp.workEmail && emp.workEmail.includes("@")) {
      result.skipped.push({ userId: uid, name, reason: `لديه بريد عمل: ${emp.workEmail}` });
      continue;
    }

    const local        = toEmailLocal(emp.fullName || "", emp.username);
    const emailAddress = `${local}@${DEFAULT_DOMAIN}`;
    const password     = generatePassword();

    // Try to create in cPanel
    let cpResult: { ok: boolean; alreadyExists?: boolean };
    try {
      cpResult = await cpanelCreateEmail(emailAddress, password);
    } catch (err: any) {
      result.errors.push({ userId: uid, name, error: err.message });
      continue;
    }

    // Save / upsert in MailAccountModel
    const existing = await MailAccountModel.findOne({ emailAddress }).lean() as any;
    if (!existing) {
      await MailAccountModel.create({
        emailAddress,
        password,
        displayName: name,
        jobTitle: emp.jobTitle || "",
        assignedUserId:  emp._id,
        assignedUserIds: [emp._id],
      });
    }

    // Update workEmail on user
    await UserModel.findByIdAndUpdate(uid, { workEmail: emailAddress });

    if (cpResult.alreadyExists) {
      result.skipped.push({ userId: uid, name, reason: `موجود في cPanel بالفعل — تمت المزامنة: ${emailAddress}` });
    } else {
      result.created.push({ userId: uid, name, email: emailAddress, password });
    }
  }

  return result;
}

/**
 * Check whether cPanel credentials are configured and reachable.
 */
export async function cpanelPing(): Promise<{ ok: boolean; user?: string; error?: string }> {
  const { token, user, ok } = getAuth();
  if (!ok) return { ok: false, error: "CPANEL_API_TOKEN or CPANEL_USERNAME not set" };
  try {
    const data = await cpanelRequest("/execute/Email/list_pops");
    if (data.status === 1) return { ok: true, user };
    return { ok: false, error: (data.errors || []).join(", ") };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
