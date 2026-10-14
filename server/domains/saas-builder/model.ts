import crypto from "crypto";

export function fingerprintSaasBuilderConfig(templateId: string, tier: string, config: unknown): string {
  return crypto.createHash("sha256")
    .update(JSON.stringify({ templateId, tier, config }))
    .digest("hex");
}

export function safeSaasBuilderBuild(build: any) {
  if (!build || (!build.commitSha && !(Number(build.fileCount) > 0))) return null;
  return {
    branch: String(build.branch || ""),
    commitSha: String(build.commitSha || ""),
    backupRef: String(build.backupRef || ""),
    fileCount: Number(build.fileCount || 0),
    databaseReady: build.databaseReady !== false,
    buildCommand: String(build.buildCommand || ""),
    startCommand: String(build.startCommand || ""),
    envRequirements: (build.envRequirements || []).map((item: any) => ({
      key: String(item.key || ""),
      required: Boolean(item.required),
      description: String(item.description || ""),
    })),
    warnings: Array.isArray(build.warnings) ? build.warnings.map((warning: unknown) => String(warning)) : [],
    completedAt: build.completedAt || null,
  };
}

export function saasFeaturesForTier<T extends { id?: string; minTier?: string }>(features: T[], tier: string, extras: string[] = []): T[] {
  const ranks: Record<string, number> = { lite: 1, pro: 2, infinity: 3, infinite: 3 };
  const rank = ranks[String(tier || "").toLowerCase()] || 0;
  return features.filter((feature) => rank >= (ranks[String(feature.minTier || "lite").toLowerCase()] || Number.MAX_SAFE_INTEGER) || Boolean(rank && feature.id && extras.includes(feature.id)));
}

export function inspectProjectDatabaseUri(raw: unknown, platformUri: unknown, platformDatabaseName?: string): {
  valid: boolean;
  sameAsPlatform: boolean;
  platformUriValid: boolean;
} {
  const parse = (value: unknown, requireDatabase: boolean) => {
    const uri = String(value || "").trim();
    const parsed = new URL(uri);
    if (!["mongodb:", "mongodb+srv:"].includes(parsed.protocol) || !parsed.hostname) return null;
    if (parsed.hash || parsed.pathname && (!parsed.pathname.startsWith("/") || parsed.pathname.startsWith("//"))) return null;
    const pathSegments = parsed.pathname ? parsed.pathname.slice(1).split("/") : [];
    if (pathSegments.length > 1 || requireDatabase && !pathSegments[0]) return null;
    let databaseName = "";
    if (pathSegments[0]) {
      databaseName = decodeURIComponent(pathSegments[0]);
      if (!databaseName || databaseName === "." || databaseName === ".." || /[\\/$*:<>?|"#\s]/.test(databaseName)) return null;
      if (requireDatabase && ["admin", "local", "config"].includes(databaseName.toLowerCase())) return null;
    }
    const endpoint = `${parsed.hostname.toLowerCase()}:${parsed.port || "27017"}`;
    return { endpoint, databaseName, identity: `${endpoint}/${databaseName}` };
  };
  try {
    const identity = parse(raw, true);
    let platformIdentity: ReturnType<typeof parse> = null;
    try { platformIdentity = parse(platformUri, false); } catch { platformIdentity = null; }
    if (!identity) {
      // Mongoose accepts the platform URI without a database path and selects
      // OrderModel.db.name separately. Still identify that exact URI as the
      // platform database rather than presenting it as a malformed project URI.
      let rawIdentity: ReturnType<typeof parse> = null;
      try { rawIdentity = parse(raw, false); } catch { rawIdentity = null; }
      const platformDatabase = String(platformDatabaseName || platformIdentity?.databaseName || "test").toLowerCase();
      const sameAsPlatform = Boolean(rawIdentity && platformIdentity)
        && rawIdentity!.endpoint === platformIdentity!.endpoint
        && String(rawIdentity!.databaseName || platformDatabase).toLowerCase() === platformDatabase;
      return { valid: false, sameAsPlatform, platformUriValid: Boolean(platformIdentity) };
    }
    const sameAsPlatform = platformIdentity
      ? crypto.timingSafeEqual(
        crypto.createHash("sha256").update(identity.endpoint).digest(),
        crypto.createHash("sha256").update(platformIdentity.endpoint).digest(),
      ) && crypto.timingSafeEqual(
        crypto.createHash("sha256").update(identity.databaseName.toLowerCase()).digest(),
        crypto.createHash("sha256").update(String(platformDatabaseName || platformIdentity.databaseName || "test").toLowerCase()).digest(),
      )
      : false;
    return { valid: true, sameAsPlatform, platformUriValid: Boolean(platformIdentity) };
  } catch {
    let platformUriValid = false;
    try { platformUriValid = Boolean(parse(platformUri, false)); } catch { platformUriValid = false; }
    return { valid: false, sameAsPlatform: false, platformUriValid };
  }
}

export function prepareProjectDatabaseUri(
  raw: unknown,
  projectId: string,
  platformUri: unknown,
  platformDatabaseName?: string,
) {
  const uri = String(raw || "").trim();
  const original = inspectProjectDatabaseUri(uri, platformUri, platformDatabaseName);
  if (original.sameAsPlatform) {
    return { databaseUri: "", valid: false, sameAsPlatform: true, platformUriValid: original.platformUriValid, autoAssignedDatabaseName: false };
  }
  if (original.valid) {
    return { databaseUri: uri, valid: true, sameAsPlatform: false, platformUriValid: original.platformUriValid, autoAssignedDatabaseName: false };
  }
  const id = String(projectId || "").trim().toLowerCase();
  if (!/^[a-f\d]{24}$/.test(id)) {
    return { databaseUri: "", valid: false, sameAsPlatform: false, platformUriValid: original.platformUriValid, autoAssignedDatabaseName: false };
  }
  try {
    const parsed = new URL(uri);
    const pathSegments = parsed.pathname ? parsed.pathname.slice(1).split("/") : [];
    const hasNoDatabasePath = pathSegments.length === 0 || (pathSegments.length === 1 && !pathSegments[0]);
    if (!["mongodb:", "mongodb+srv:"].includes(parsed.protocol) || !parsed.hostname || parsed.hash || !hasNoDatabasePath) {
      return { databaseUri: "", valid: false, sameAsPlatform: false, platformUriValid: original.platformUriValid, autoAssignedDatabaseName: false };
    }
    parsed.pathname = `/qirox_project_${id}`;
    const databaseUri = parsed.toString();
    const assigned = inspectProjectDatabaseUri(databaseUri, platformUri, platformDatabaseName);
    if (!assigned.valid || assigned.sameAsPlatform) {
      return { databaseUri: "", valid: false, sameAsPlatform: assigned.sameAsPlatform, platformUriValid: assigned.platformUriValid, autoAssignedDatabaseName: false };
    }
    return { databaseUri, valid: true, sameAsPlatform: false, platformUriValid: assigned.platformUriValid, autoAssignedDatabaseName: true };
  } catch {
    return { databaseUri: "", valid: false, sameAsPlatform: false, platformUriValid: original.platformUriValid, autoAssignedDatabaseName: false };
  }
}

export function databaseForSaasBuild(raw: unknown, platformUri: unknown, platformDatabaseName?: string) {
  if (!String(raw || "").trim()) return { databaseUri: "", databaseReady: false, reason: "missing" as const };
  const status = inspectProjectDatabaseUri(raw, platformUri, platformDatabaseName);
  if (!status.valid) return { databaseUri: "", databaseReady: false, reason: "invalid" as const };
  if (!status.platformUriValid || status.sameAsPlatform) return { databaseUri: "", databaseReady: false, reason: "platform" as const };
  return { databaseUri: String(raw).trim(), databaseReady: true, reason: "ready" as const };
}

/** Turn Mongo driver errors into safe diagnostics; never return or log the URI. */
export function mongoDatabaseLinkFailure(error: any, phase: "connect" | "save" = "connect") {
  if (phase === "save") return {
    code: "DATABASE_LINK_SAVE_FAILED",
    message: "تم الوصول إلى MongoDB، لكن تعذر حفظ إعداد الربط. أعد المحاولة؛ لم يتم تأكيد تطبيق الاتصال على النظام.",
  };
  const causes = [error, error?.cause, error?.reason, error?.cause?.cause];
  const clues = causes.flatMap(item => [item?.name, item?.code, item?.codeName, item?.message])
    .filter(value => typeof value === "string" || typeof value === "number")
    .join(" ").slice(0, 4000);
  if (Number(error?.code) === 18 || /authentication failed|authenticationfailure|authenticationfailed|bad auth|code[: ]+18\b/i.test(clues)) return {
    code: "MONGODB_AUTH_FAILED",
    message: "رفض MongoDB بيانات الدخول. تحقق من مستخدم قاعدة البيانات وكلمة مروره، وشفّر الرموز الخاصة في رابط الاتصال بصيغة URL.",
  };
  if (/querysrv|enotfound|eai_again|eservfail|enodata|dns lookup|name or service not known/i.test(clues)) return {
    code: "MONGODB_DNS_FAILED",
    message: "تعذر العثور على خادم MongoDB. تحقق من اسم المضيف ورابط الاتصال؛ وفي رابط mongodb+srv تأكد من عمل سجلات DNS الخاصة بالمجموعة.",
  };
  if (/tls|ssl|certificate|self.signed|cert_altname/i.test(clues)) return {
    code: "MONGODB_TLS_FAILED",
    message: "تعذر إنشاء اتصال TLS آمن مع MongoDB. تحقق من إعدادات TLS والرابط الذي زودك به مزود قاعدة البيانات.",
  };
  if (/serverselection|timeout|timed out|etimedout|econnrefused|econnreset|enetunreach|ehostunreach|network|socket/i.test(clues)) return {
    code: "MONGODB_NETWORK_UNREACHABLE",
    message: "تعذر الوصول إلى خادم MongoDB. اسمح باتصالات خادم التطبيق في إعدادات شبكة مزود قاعدة البيانات، وتأكد من السماح بمنفذ MongoDB؛ لا تفتح القاعدة للجميع.",
  };
  return {
    code: "MONGODB_CONNECTION_FAILED",
    message: "تعذر الاتصال بـ MongoDB. تحقق من إعداد الاتصال والصلاحيات، ثم أعد المحاولة.",
  };
}

export function templatePreviewTheme(template: any, index: number): string {
  const explicit = String(template?.previewTheme || template?.theme || template?.style || "").toLowerCase();
  const id = String(template?.id || "").toLowerCase();
  const knownTemplates: Record<string, string> = {
    cluny: "warm",
    blackrose: "dark",
    tasali: "warm",
    "chef-palace": "classic",
  };
  if (!explicit && knownTemplates[id]) return knownTemplates[id];
  const identity = `${id} ${template?.nameEn || ""} ${template?.name || ""}`.toLowerCase();
  const candidate = explicit || identity;
  if (/dark|night/.test(candidate)) return "dark";
  if (/warm|cafe|coffee|restaurant|food/.test(candidate)) return "warm";
  if (/classic|elegant|heritage/.test(candidate)) return "classic";
  if (/minimal|clean|simple/.test(candidate)) return "minimal";
  return ["modern", "warm", "dark", "classic", "minimal"][Math.abs(index) % 5];
}