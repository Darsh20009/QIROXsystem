export interface QMeetCustomization {
  brandName: string;
  logoUrl: string;
  accentColor: string;
  allowedOrigins: string[];
  features: { chat: boolean; whiteboard: boolean; annotations: boolean; screenShare: boolean };
}
export function normalizeQMeetCustomization(value: any = {}): QMeetCustomization {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("إعدادات التخصيص غير صالحة");
  const logoUrl = String(value.logoUrl || "").trim();
  if (logoUrl && !/^https:\/\/[^\s]+$/i.test(logoUrl)) throw new Error("رابط الشعار يجب أن يستخدم HTTPS");
  if (logoUrl) new URL(logoUrl);
  const accentColor = value.accentColor || "#14b8a6";
  if (!/^#[a-f0-9]{6}$/i.test(accentColor)) throw new Error("لون الهوية يجب أن يكون بصيغة #RRGGBB");
  if (value.allowedOrigins !== undefined && (!Array.isArray(value.allowedOrigins) || value.allowedOrigins.length > 10)) throw new Error("أضف حتى عشرة نطاقات مسموحة");
  const allowedOrigins = [...new Set((value.allowedOrigins || []).map((origin: unknown) => {
    const text = String(origin);
    const url = new URL(text);
    if (url.protocol !== "https:" || url.username || url.password || url.origin !== text.replace(/\/$/, "")) throw new Error("النطاقات المسموحة يجب أن تكون أصول HTTPS كاملة بدون مسارات أو نجمة");
    return url.origin;
  }))] as string[];
  const features = value.features || {};
  const boolean = (key: string) => {
    if (features[key] !== undefined && typeof features[key] !== "boolean") throw new Error(`قيمة ${key} يجب أن تكون true أو false`);
    return features[key] !== false;
  };
  return { brandName: String(value.brandName || "QMeet").trim().slice(0, 80), logoUrl: logoUrl.slice(0, 2000),
    accentColor, allowedOrigins,
    features: { chat: boolean("chat"), whiteboard: boolean("whiteboard"), annotations: boolean("annotations"), screenShare: boolean("screenShare") } };
}