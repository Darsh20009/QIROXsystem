// ── Shared Server Utilities ────────────────────────────────────────────────
// Pure, side-effect-free helper functions with no Express, database,
// authentication, or business-logic dependencies.
// All functions preserve exact pre-migration behavior.

// ── HTML Escaping ─────────────────────────────────────────────────────────
export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// ── MongoDB / Mongoose Error Translation (Arabic) ─────────────────────────
export function translateError(err: any): string {
  const msg: string = err?.message || err?.toString() || "";
  if (msg.includes("E11000") || msg.includes("duplicate key")) {
    if (msg.includes("email")) return "البريد الإلكتروني مستخدم من قبل، جرّب بريداً آخر";
    if (msg.includes("username")) return "اسم المستخدم مستخدم من قبل، جرّب اسماً آخر";
    return "هذه البيانات مستخدمة مسبقاً";
  }
  if (msg.includes("validation failed") || msg.includes("is required")) return "تأكد من تعبئة جميع الحقول المطلوبة";
  if (msg.includes("Cast to ObjectId") || msg.includes("ObjectId")) return "معرّف غير صالح";
  if (msg.includes("LIMIT_FILE_SIZE")) return "حجم الملف كبير جداً (الحد الأقصى 20 ميغابايت)";
  if (msg.includes("No file") || msg.includes("No files")) return "لم يتم اختيار أي ملف";
  if (msg.includes("ENOENT") || msg.includes("EACCES")) return "حدث خطأ في نظام الملفات";
  if (msg.includes("connect") || msg.includes("network") || msg.includes("ECONNREFUSED")) return "تعذّر الاتصال بقاعدة البيانات، حاول مجدداً";
  return "حدث خطأ غير متوقع، حاول مجدداً";
}

// ── Response Sanitization ────────────────────────────────────────────────
// Strips sensitive credential fields from user objects before sending to client.
export function sanitizeUser(user: any): any {
  if (!user) return user;
  if (Array.isArray(user)) return user.map(sanitizeUser);
  const obj = typeof user.toJSON === "function" ? user.toJSON() : { ...user };
  delete obj.password;
  delete obj.walletPin;
  delete obj.walletCardNumber;
  delete obj.totpSecret;
  delete obj.recoveryPassphrase;
  return obj;
}

// ── Name Formatting ──────────────────────────────────────────────────────
// Extracts a display-friendly name from a full name or email address.
export function cleanName(name: string): string {
  if (!name) return "عزيزي العميل";
  if (name.includes("@")) return name.split("@")[0];
  return name;
}
