export type DataEntryResource = "partners" | "apiKeys" | "tasks" | "partnerLogo";
export type DataEntryAction =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "statusUpdate";

export const PARTNER_LOGO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
] as const;

export function isAllowedPartnerLogoMimeType(mimetype: string): boolean {
  return (PARTNER_LOGO_MIME_TYPES as readonly string[]).includes(mimetype);
}

type RoleRule =
  | readonly string[]
  | "nonClient"
  | { except: readonly string[] };

/**
 * The route-level access contract for the Data Entry role.
 *
 * Keep this in one place so route guards and regression tests cannot drift
 * independently. The task status route still performs its existing
 * assigned-task check after this role check.
 */
export const DATA_ENTRY_ROUTE_MATRIX = {
  partners: {
    read: ["admin", "manager", "data_entry"],
    create: ["admin", "manager", "data_entry"],
    update: ["admin", "manager", "data_entry"],
    delete: ["admin", "manager"],
  },
  apiKeys: {
    read: ["admin", "manager", "data_entry"],
    create: ["admin", "manager"],
    update: ["admin", "manager"],
    delete: ["admin", "manager"],
  },
  tasks: {
    read: "nonClient",
    create: { except: ["client", "data_entry"] },
    update: { except: ["client", "data_entry"] },
    statusUpdate: "nonClient",
    delete: { except: ["client", "data_entry"] },
  },
  partnerLogo: {
    create: ["admin", "manager", "data_entry"],
  },
} as const satisfies Record<DataEntryResource, Partial<Record<DataEntryAction, RoleRule>>>;

export function roleCanAccess(
  role: string | undefined,
  resource: DataEntryResource,
  action: DataEntryAction,
): boolean {
  if (!role) return false;
  const rule = DATA_ENTRY_ROUTE_MATRIX[resource][action];
  if (!rule) return false;
  if (rule === "nonClient") return role !== "client";
  if (typeof rule === "object" && "except" in rule) return !rule.except.includes(role);
  return rule.includes(role);
}

/**
 * Fields that must never be exposed to Data Entry, even if a model gains one
 * of these properties later or a route receives a lean plain object.
 */
export const DATA_ENTRY_SENSITIVE_FIELDS = [
  "keyHash",
  "rawKey",
  "secret",
  "token",
  "accessToken",
  "refreshToken",
  "clientSecret",
  "privateKey",
  "password",
  "passwordHash",
  "twoFactorSecret",
  "githubDeployToken",
  "googleClientSecret",
] as const;

export function redactSensitiveFields<T extends Record<string, unknown>>(value: T): Partial<T> {
  const safe = { ...value } as Partial<T>;
  for (const field of DATA_ENTRY_SENSITIVE_FIELDS) {
    delete safe[field as keyof T];
  }
  return safe;
}

export const DATA_ENTRY_USER_FIELDS = [
  "email", "fullName", "phone", "avatarUrl", "instagram", "twitter",
  "linkedin", "snapchat", "tiktok", "youtube", "linktree", "jobTitle",
  "workEmail", "bio", "address", "city", "taxNumber", "organizationName",
  "commercialRegistration", "nationalAddress",
] as const;

export function projectDataEntryUser(value: Record<string, unknown>): Record<string, unknown> {
  const source = value && typeof (value as any).toObject === "function"
    ? (value as any).toObject()
    : value;
  const projected: Record<string, unknown> = {};
  const id = source?.id ?? source?._id?.toString?.();
  if (id !== undefined) projected.id = id;
  if (source?.username !== undefined) projected.username = source.username;
  for (const field of DATA_ENTRY_USER_FIELDS) {
    if (source?.[field] !== undefined) projected[field] = source[field];
  }
  return projected;
}

export function projectDataEntryUsers(value: unknown): unknown {
  return Array.isArray(value)
    ? value.map((entry) => projectDataEntryUser(entry as Record<string, unknown>))
    : projectDataEntryUser(value as Record<string, unknown>);
}

export const DATA_ENTRY_ORDER_HIDDEN_FIELDS = [
  "accessCredentials", "paymentMethod", "paymentProofUrl", "paymentStatus",
  "paymentRejectionReason", "totalAmount", "walletAmountUsed", "marginPct",
  "isDepositPaid", "shippingFee", "ibanCertUrl", "items", "scheduledMeeting",
] as const;

export const DATA_ENTRY_SPEC_HIDDEN_FIELDS = [
  "totalBudget", "paidAmount", "databaseUri", "serverIp",
  "deploymentUsername", "deploymentPassword", "variables", "customVars",
] as const;

export const DATA_ENTRY_RESPONSE_HIDDEN_FIELDS = [
  ...DATA_ENTRY_SENSITIVE_FIELDS,
  "role",
  "allowedPages",
  "permissions",
  "walletBalance",
  "salary",
  "totalAmount",
  "paymentStatus",
  "paymentMethod",
  "paymentProofUrl",
  "deployToken",
] as const;

export function redactDataEntryRecord(value: unknown): unknown {
  const source = value && typeof (value as any).toObject === "function"
    ? (value as any).toObject()
    : value;
  if (!source || typeof source !== "object" || Array.isArray(source)) return value;
  return redactFields(
    redactSensitiveFields(source as Record<string, unknown>),
    DATA_ENTRY_RESPONSE_HIDDEN_FIELDS,
  );
}

/**
 * Kanban tasks contain a mixed `plan` object. Keep the same deployment and
 * credential boundary as project specs, plus fields that can appear on the
 * task itself or in populated user references.
 */
export const DATA_ENTRY_TASK_HIDDEN_FIELDS = [
  ...DATA_ENTRY_SENSITIVE_FIELDS,
  ...DATA_ENTRY_SPEC_HIDDEN_FIELDS,
  "deployToken",
  "githubDeployToken",
  "githubRepo",
  "role",
  "allowedPages",
  "permissions",
] as const;

export function redactFields<T extends Record<string, unknown>>(
  value: T,
  fields: readonly string[],
): Partial<T> {
  const safe = { ...value } as Partial<T>;
  for (const field of fields) delete safe[field as keyof T];
  return safe;
}

export function redactDataEntryTask(value: unknown): unknown {
  const source = value && typeof (value as any).toObject === "function"
    ? (value as any).toObject()
    : value;
  if (!source || typeof source !== "object" || Array.isArray(source)) return value;

  const redactRecord = (record: Record<string, unknown>): Record<string, unknown> =>
    redactFields(
      redactSensitiveFields(record),
      DATA_ENTRY_TASK_HIDDEN_FIELDS,
    ) as Record<string, unknown>;

  const safe = redactRecord(source as Record<string, unknown>);
  for (const field of ["plan", "devPlan", "assignedTo", "createdBy"]) {
    const nested = safe[field];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      safe[field] = redactRecord(nested as Record<string, unknown>);
    }
  }
  return safe;
}

export function preserveOriginalLogoUrl(
  originalUrl: string,
  processedUrl: string | null | undefined,
): { logoUrl: string; logoOriginalUrl: string; processed: boolean } {
  const processed = Boolean(processedUrl);
  return {
    logoUrl: processed ? String(processedUrl) : originalUrl,
    logoOriginalUrl: originalUrl,
    processed,
  };
}