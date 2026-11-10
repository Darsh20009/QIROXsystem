import fs from "node:fs";
import path from "node:path";
import type { BuilderConfig } from "../../../shared/saas-builder";

export function attachmentUrl(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(attachmentUrl).find(Boolean) || "";
  if (value && typeof value === "object") {
    const item = value as any;
    return attachmentUrl(item.url || item.fileUrl || item.path || item.href);
  }
  return "";
}

export function inheritedBuilderConfig(builder: any, order: any, project: any): Partial<BuilderConfig> {
  const saved = builder?.config || {};
  const wizard = order?.wizardData || {};
  const pick = (key: string, ...values: unknown[]) => typeof saved[key] === "string" && (saved[key].trim() || (builder?.prefillVersion >= 2 && !["businessName", "commercialRegNumber"].includes(key))) ? saved[key] : values.find(value => typeof value === "string" && value.trim()) || "";
  return {
    businessName: pick("businessName", wizard.businessName, order.businessName, project.name),
    businessNameEn: pick("businessNameEn", wizard.businessNameEn),
    commercialRegNumber: pick("commercialRegNumber", wizard.commercialReg, wizard.commercialRegNumber, order.commercialRegNumber),
    taxNumber: pick("taxNumber", wizard.taxNumber, order.taxNumber),
    commercialRegUrl: pick("commercialRegUrl", attachmentUrl(wizard.commercialRegFile), attachmentUrl(wizard.legalDocFile), order.commercialRegUrl),
    bankName: pick("bankName", wizard.bankName, order.bankName),
    bankAccountName: pick("bankAccountName", wizard.bankAccountName, order.bankAccountName),
    iban: pick("iban", wizard.iban, order.iban),
    logoUrl: pick("logoUrl", project.logoUrl, order.logoUrl, attachmentUrl(wizard.logoFile)),
    primaryColor: pick("primaryColor", wizard.brandColor, order.brandColor) || "#243b35",
    secondaryColor: pick("secondaryColor") || "#d9a878",
    phone: pick("phone", wizard.whatsapp, wizard.phone, order.phone, order.client?.phone),
    address: pick("address", wizard.address, wizard.businessAddress, order.address),
    websiteUrl: pick("websiteUrl", project.branding?.websiteUrl, project.deploymentUrl, order.websiteUrl),
    heroImageUrl: pick("heroImageUrl", attachmentUrl(wizard.heroImage), attachmentUrl(wizard.heroImageUrl)),
    splashEnabled: saved.splashEnabled === true,
    splashImageUrl: pick("splashImageUrl"),
    splashBackgroundColor: pick("splashBackgroundColor") || "#ffffff",
    splashImageFit: saved.splashImageFit === "cover" ? "cover" : "contain",
    splashDurationMs: typeof saved.splashDurationMs === "number" ? saved.splashDurationMs : 1500,
    splashTitle: pick("splashTitle"),
    splashSubtitle: pick("splashSubtitle"),
    extraFeatures: saved.extraFeatures || [],
    customerWhatsappRegistration: saved.customerWhatsappRegistration === true,
    notificationEmail: saved.notificationEmail === true,
  };
}

/** Resolve only image assets beneath this project's upload root; never arbitrary paths. */
export function localBuilderImage(value: unknown): string | undefined {
  const url = attachmentUrl(value);
  if (!/^\/uploads\/[a-zA-Z0-9_./% -]+\.(png|jpe?g|webp|gif)$/i.test(url)) return undefined;
  let decoded: string;
  try { decoded = decodeURIComponent(url); } catch { return undefined; }
  const root = path.resolve(process.cwd(), "uploads");
  const file = path.resolve(process.cwd(), decoded.replace(/^\/+/, ""));
  if (!file.startsWith(`${root}${path.sep}`)) return undefined;
  try {
    const real = fs.realpathSync(file);
    const stat = fs.lstatSync(file);
    if (!real.startsWith(`${fs.realpathSync(root)}${path.sep}`) || !stat.isFile() || stat.isSymbolicLink() || stat.size > 8 * 1024 * 1024) return undefined;
    return real;
  } catch { return undefined; }
}

export function safeLocalUploadUrl(value: string): boolean {
  try {
    const decoded = decodeURIComponent(value);
    return /^\/uploads\/[a-zA-Z0-9_./% -]+\.(png|jpe?g|webp|gif|pdf)$/i.test(value)
      && !decoded.split("/").some(part => part === ".." || part === ".")
      && !decoded.includes("\\");
  } catch { return false; }
}