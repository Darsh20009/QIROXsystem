import { cpanelCreateEmail } from "./cpanel";
import { MailAccountModel, OrderModel, UserModel } from "./models";

const DOMAIN = "qirox.online";
const MAX_NAME_LENGTH = 64;

export type CustomerMailboxResult =
  | { ok: true; data: { account: Record<string, any>; email: string; remaining: number } }
  | { ok: false; status: number; error: string; meta?: Record<string, any> };

function safeLocalPart(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, ".")
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "")
    .replace(/[._-]{2,}/g, ".")
    .slice(0, MAX_NAME_LENGTH);
}

function serialiseAccount(account: any): Record<string, any> {
  const object = account?.toObject ? account.toObject() : account;
  const { password: _password, ...safe } = object || {};
  return { ...safe, id: String(object?._id || object?.id || "") };
}

/**
 * A paid email cart item is the only legacy entitlement we can verify today.
 * Orders have no expiry field yet, so this deliberately reports a paid
 * entitlement rather than pretending it has a current renewal date.
 */
async function getEmailEntitlement(userId: string): Promise<{ order: any; limit: number } | null> {
  const order = await OrderModel.findOne({
    userId,
    items: { $elemMatch: { type: "email" } },
    status: { $nin: ["rejected", "cancelled"] },
    $or: [{ paymentStatus: "approved" }, { isDepositPaid: true }],
  }).sort({ createdAt: -1 }).lean() as any;
  if (!order) return null;

  const item = Array.isArray(order.items)
    ? order.items.find((candidate: any) => candidate?.type === "email")
    : null;
  const configuredLimit = Number(item?.config?.users);
  return { order, limit: Number.isFinite(configuredLimit) && configuredLimit > 0 ? Math.min(configuredLimit, 50) : 1 };
}

export async function provisionCustomerMailbox(input: {
  userId: string;
  name?: unknown;
  password?: unknown;
}): Promise<CustomerMailboxResult> {
  const userId = String(input.userId || "");
  const name = String(input.name || "").trim();
  const password = String(input.password || "");
  if (!userId || !name || !password) {
    return { ok: false, status: 400, error: "اسم البريد وكلمة المرور مطلوبان" };
  }
  if (password.length < 8) {
    return { ok: false, status: 400, error: "كلمة مرور البريد يجب أن تكون 8 أحرف على الأقل" };
  }

  const user = await UserModel.findById(userId).select("fullName username role").lean() as any;
  if (!user || user.role !== "client") return { ok: false, status: 403, error: "الحساب غير مؤهل" };

  const entitlement = await getEmailEntitlement(userId);
  if (!entitlement) {
    return {
      ok: false,
      status: 403,
      error: "إنشاء البريد المؤسسي متاح للعملاء المشتركين في خدمة البريد فقط",
    };
  }

  const currentCount = await MailAccountModel.countDocuments({ ownerUserId: userId, accountType: "customer" });
  if (currentCount >= entitlement.limit) {
    return {
      ok: false,
      status: 409,
      error: `وصلت إلى الحد المسموح به (${entitlement.limit} بريد)`,
      meta: { limit: entitlement.limit, remaining: 0 },
    };
  }

  const base = safeLocalPart(name) || safeLocalPart(user.username || "") || "qiroxuser";
  let selectedEmail = "";
  let cpResult: { ok: boolean; alreadyExists?: boolean } | null = null;

  // Never adopt an existing cPanel mailbox whose password we do not know.
  // If a local-part is occupied, move to a deterministic numeric suffix.
  for (let suffix = 0; suffix <= 50; suffix++) {
    const local = suffix === 0 ? base : `${base}.${suffix}`;
    const email = `${local}@${DOMAIN}`;
    const inMongo = await MailAccountModel.exists({ emailAddress: email });
    if (inMongo) continue;
    const created = await cpanelCreateEmail(email, password);
    if (created.alreadyExists) continue;
    selectedEmail = email;
    cpResult = created;
    break;
  }
  if (!selectedEmail || !cpResult) {
    return { ok: false, status: 409, error: "تعذر العثور على اسم بريد متاح، جرّب اسماً مختلفاً" };
  }

  const account = await MailAccountModel.create({
    emailAddress: selectedEmail,
    password,
    accountType: "customer",
    ownerUserId: userId,
    sourceOrderId: entitlement.order._id,
    displayName: name,
    jobTitle: "بريد مؤسسي",
    assignedUserId: userId,
    assignedUserIds: [userId],
    isShared: false,
    sharedWith: [],
  });
  return {
    ok: true,
    data: {
      account: serialiseAccount(account),
      email: selectedEmail,
      remaining: Math.max(0, entitlement.limit - currentCount - 1),
    },
  };
}

/**
 * Employees can provision their own first mailbox from the employee mail
 * screen. This intentionally does not use customer entitlements.
 */
export async function provisionEmployeeMailbox(input: {
  userId: string;
  name?: unknown;
  password?: unknown;
}): Promise<CustomerMailboxResult> {
  const userId = String(input.userId || "");
  const name = String(input.name || "").trim();
  const password = String(input.password || "");
  if (!userId || !name || !password) {
    return { ok: false, status: 400, error: "اسم البريد وكلمة المرور مطلوبان" };
  }
  if (password.length < 8) {
    return { ok: false, status: 400, error: "كلمة مرور البريد يجب أن تكون 8 أحرف على الأقل" };
  }

  const user = await UserModel.findById(userId).select("username role").lean() as any;
  if (!user || ["client", "supplier", "data_entry", "investor"].includes(user.role)) {
    return { ok: false, status: 403, error: "الحساب غير مؤهل" };
  }

  const existing = await MailAccountModel.findOne({
    $or: [
      { ownerUserId: userId, accountType: "employee" },
      { assignedUserId: userId },
      { assignedUserIds: userId },
    ],
  }).lean() as any;
  if (existing) {
    return { ok: false, status: 409, error: "لديك حساب بريد مرتبط بالفعل", meta: { account: serialiseAccount(existing) } };
  }

  const base = safeLocalPart(name) || safeLocalPart(user.username || "") || "qiroxuser";
  let selectedEmail = "";
  let cpResult: { ok: boolean; alreadyExists?: boolean } | null = null;
  for (let suffix = 0; suffix <= 50; suffix++) {
    const local = suffix === 0 ? base : `${base}.${suffix}`;
    const email = `${local}@${DOMAIN}`;
    if (await MailAccountModel.exists({ emailAddress: email })) continue;
    const created = await cpanelCreateEmail(email, password);
    if (created.alreadyExists) continue;
    selectedEmail = email;
    cpResult = created;
    break;
  }
  if (!selectedEmail || !cpResult) {
    return { ok: false, status: 409, error: "تعذر العثور على اسم بريد متاح، جرّب اسماً مختلفاً" };
  }

  const account = await MailAccountModel.create({
    emailAddress: selectedEmail,
    password,
    accountType: "employee",
    ownerUserId: userId,
    displayName: name,
    jobTitle: "موظف QIROX",
    assignedUserId: userId,
    assignedUserIds: [userId],
    isShared: false,
    sharedWith: [],
  });
  return {
    ok: true,
    data: { account: serialiseAccount(account), email: selectedEmail, remaining: 0 },
  };
}