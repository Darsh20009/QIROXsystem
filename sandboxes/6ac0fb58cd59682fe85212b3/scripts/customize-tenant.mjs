import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { splashMarkup } from "./splash-screen.mjs";

const root = process.cwd();
const required = ["businessName", "commercialRegNumber", "primaryColor"];
let config;
try {
  config = JSON.parse(process.env.BUSINESS_CONFIG_JSON || "");
} catch {
  throw new Error("BUSINESS_CONFIG_JSON must contain valid JSON");
}
if (!config || typeof config !== "object" || required.some((key) => !String(config[key] || "").trim())) {
  throw new Error("BUSINESS_CONFIG_JSON must include businessName, commercialRegNumber and primaryColor");
}
const tier = String(process.env.PROJECT_PLAN_TIER || "").toLowerCase();
if (!["lite", "pro", "infinity"].includes(tier)) throw new Error("PROJECT_PLAN_TIER must be lite, pro, or infinity");
if (!/^#[0-9a-f]{6}$/i.test(config.primaryColor)) throw new Error("BUSINESS_CONFIG_JSON.primaryColor must be a six-digit hex color");
for (const key of ["websiteUrl", "commercialRegUrl", "logoUrl", "heroImageUrl"]) {
  if (config[key] && !/^\/(?:tenant-(?:logo|hero)\.|uploads\/)/.test(String(config[key]))) {
    let url;
    try { url = new URL(config[key]); } catch { throw new Error(`BUSINESS_CONFIG_JSON.${key} must be an HTTPS URL`); }
    if (url.protocol !== "https:" || url.username || url.password) throw new Error(`BUSINESS_CONFIG_JSON.${key} must be an HTTPS URL`);
  }
}

const color = config.primaryColor.toLowerCase();
const rgb = [1, 3, 5].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16) / 255);
const max = Math.max(...rgb);
const min = Math.min(...rgb);
const delta = max - min;
let hue = 0;
if (delta) {
  if (max === rgb[0]) hue = ((rgb[1] - rgb[2]) / delta) % 6;
  else if (max === rgb[1]) hue = (rgb[2] - rgb[0]) / delta + 2;
  else hue = (rgb[0] - rgb[1]) / delta + 4;
}
hue = Math.round((hue * 60 + 360) % 360);
const lightness = (max + min) / 2;
const saturation = delta ? delta / (1 - Math.abs(2 * lightness - 1)) : 0;
const hsl = { h: hue, s: Math.round(saturation * 100), l: Math.round(lightness * 100) };

const brandPath = resolve(root, "client/src/lib/brand.ts");
let brand = await readFile(brandPath, "utf8");
const values = {
  nameEn: config.businessNameEn || config.businessName,
  nameAr: config.businessName,
  shortNameEn: config.businessNameEn || config.businessName,
  shortNameAr: config.businessName,
  platformNameEn: config.businessNameEn || config.businessName,
  platformNameAr: config.businessName,
  descriptionEn: config.businessNameEn || config.businessName,
  descriptionAr: config.businessName,
  taglineEn: config.businessNameEn || config.businessName,
  taglineAr: config.businessName,
  logoCustomer: config.logoUrl || "/tenant-mark.svg",
  logoStaff: config.logoUrl || "/tenant-mark.svg",
  favicon: config.logoUrl || "/tenant-mark.svg",
  appleTouchIcon: config.logoUrl || "/tenant-mark.svg",
  logoAssetCustomer: config.logoUrl || "/tenant-mark.svg",
  logoAssetStaff: config.logoUrl || "/tenant-mark.svg",
  logoEmailUrl: config.logoUrl || "",
  ogImageUrl: config.logoUrl || "",
  themeColor: color,
  website: config.websiteUrl || "",
  websiteUrl: config.websiteUrl || "",
  commercialRegister: config.commercialRegNumber,
  registrationNumber: config.commercialRegNumber,
  taxNumber: config.taxNumber || "",
  saudiBusinessUrl: config.commercialRegUrl || "",
};
for (const [key, value] of Object.entries(values)) {
  const pattern = new RegExp(`(^\\s*${key}\\s*:\\s*)([\"'\`])(?:\\\\.|(?!\\2).)*?\\2`, "m");
  if (!pattern.test(brand)) continue;
  brand = brand.replace(pattern, (_match, prefix) => `${prefix}${JSON.stringify(String(value))}`);
}

const colorsStart = brand.indexOf("colors: {");
if (colorsStart >= 0) {
  const open = brand.indexOf("{", colorsStart);
  let depth = 0;
  let close = -1;
  for (let i = open; i < brand.length; i++) {
    if (brand[i] === "{") depth++;
    else if (brand[i] === "}" && --depth === 0) { close = i; break; }
  }
  if (close > open) {
    let colors = brand.slice(open, close + 1);
    const replacements = {
      primary: { ...hsl, hex: color },
      primaryLight: { h: hsl.h, s: Math.max(0, hsl.s - 5), l: Math.min(96, hsl.l + 30), hex: color },
      background: { h: 0, s: 0, l: 100, hex: "#ffffff" },
      surface: { h: 0, s: 0, l: 100, hex: "#ffffff" },
      accent: { ...hsl, hex: config.secondaryColor || color },
    };
    for (const [name, values] of Object.entries(replacements)) {
      const start = colors.search(new RegExp(`\\b${name}\\s*:\\s*\\{`));
      if (start < 0) continue;
      const objectOpen = colors.indexOf("{", start);
      let objectDepth = 0;
      let objectClose = -1;
      for (let i = objectOpen; i < colors.length; i++) {
        if (colors[i] === "{") objectDepth++;
        else if (colors[i] === "}" && --objectDepth === 0) { objectClose = i; break; }
      }
      if (objectClose < 0) continue;
      let item = colors.slice(start, objectClose + 1);
      for (const [key, value] of Object.entries(values)) {
        const pattern = new RegExp(`(^\\s*${key}\\s*:\\s*)(?:[^,\\n]+)`, "m");
        item = item.replace(pattern, `$1${JSON.stringify(value)}`);
      }
      colors = colors.slice(0, start) + item + colors.slice(objectClose + 1);
    }
    brand = brand.slice(0, open) + colors + brand.slice(close + 1);
  }
}
await writeFile(brandPath, brand);

const featuresPath = resolve(root, "client/src/lib/plan-features.ts");
let plans = await readFile(featuresPath, "utf8");
const featureMinimumTiers = {
  website: "lite", menu: "lite", menuManagement: "lite", tableManagement: "lite",
  reservations: "lite", qrMenu: "lite", mapLocation: "lite", socialLinks: "lite",
  orderManagement: "lite", orderTracking: "lite", deliveryManagement: "lite",
  kitchenDisplay: "lite", posSystem: "lite", invoicePrinting: "lite", printSystem: "lite",
  customBranding: "lite",
  accounting: "pro", accountingModule: "pro", basicReports: "pro", salesReports: "pro",
  customerManagement: "pro", customerApp: "pro", crm: "pro", reviews: "pro",
  appleWallet: "pro", wallet: "pro", integrations: "pro", erpIntegration: "pro",
  pwa: "pro", push: "pro", pushNotifications: "pro", email: "pro",
  paymentGateway: "pro", onlinePayments: "pro", loyalty: "pro", loyaltyProgram: "pro",
  loyaltyPoints: "pro", giftCards: "pro", promotionsManagement: "pro", zatcaCompliance: "pro",
  inventory: "infinity", inventoryManagement: "infinity", rawItems: "infinity",
  recipeManagement: "infinity", supplierManagement: "infinity", warehouseManagement: "infinity",
  advancedReports: "infinity", advancedAnalytics: "infinity", biAnalytics: "infinity",
  attendance: "infinity", payrollManagement: "infinity", employeeManagement: "infinity",
  enterpriseAdministration: "infinity", multiBranch: "infinity", unlimitedBranches: "infinity",
  offlineMode: "infinity", apiAccess: "infinity", dedicatedSupport: "infinity",
  whiteLabel: "infinity",
};
const aliases = {
  accounting: ["accounting", "accountingModule", "basicReports"],
  "customer-management": ["customerManagement", "customerApp", "crm"],
  reviews: ["reviews"], "apple-wallet": ["appleWallet", "wallet"],
  integrations: ["integrations", "erpIntegration"], pwa: ["pwa"],
  push: ["push", "pushNotifications"], "sales-reports": ["salesReports"],
  inventory: ["inventory", "inventoryManagement", "rawItems", "recipeManagement", "supplierManagement", "warehouseManagement"],
  payments: ["paymentGateway", "onlinePayments"],
  loyalty: ["loyalty", "loyaltyProgram", "loyaltyPoints", "giftCards"],
  "advanced-reports": ["advancedReports", "advancedAnalytics", "biAnalytics"],
  attendance: ["attendance", "payrollManagement", "employeeManagement", "enterpriseAdministration"],
};
const extraAliases = new Set((Array.isArray(config.extraFeatures) ? config.extraFeatures : []).flatMap(id => aliases[id] || []));
const minimumTier = (key) => extraAliases.has(key) ? "lite" : featureMinimumTiers[key] || "infinity";
plans = plans.replace(/(key:\s*['\"]([^'\"]+)['\"][\s\S]*?plan:\s*['\"])[^'\"]+(['\"])/g, (_match, prefix, key, suffix) => `${prefix}${minimumTier(key)}${suffix}`);
await writeFile(featuresPath, plans);

// Bind every old template-logo import and receipt's fixed /logo.png to this
// customer's public asset, not an archived placeholder.
async function bindVisualAssets(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = resolve(directory, entry.name);
    if (entry.isDirectory()) await bindVisualAssets(file);
    else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      let source = await readFile(file, "utf8");
      source = source.replace(/import\s+(\w+)\s+from\s+["']@assets\/[^"']*logo[^"']*["'];?/gi,
        (_match, name) => `const ${name} = ${JSON.stringify(config.logoUrl || "/tenant-mark.svg")};`);
      source = source.replace(/import\s+(\w+)\s+from\s+["']@assets\/([^"']+)["'];?/g, (match, name, asset) => {
        const replacements = {
          cardFrame: "/tenant-card.svg",
          stcLogoPath: "/payment-label-stc.svg",
          visaMadaLogoPath: "/payment-label-card.svg",
        };
        const url = /^banner(?:Image)?[12]$/.test(name)
          ? config.heroImageUrl || "/tenant-hero-brand.svg" : replacements[name];
        if (!url) throw new Error(`Unsupported archived asset reference: ${asset}`);
        return `const ${name} = ${JSON.stringify(url)};`;
      });
      if (config.logoUrl) source = source.replace(/(["'])\/logo\.(?:png|svg|webp)\1/g, JSON.stringify(config.logoUrl));
      if (entry.name === "order-receipt.tsx" && config.logoUrl) {
        source = source.replace('<h1 className="text-2xl font-black leading-tight">', '<img src={brand.logoCustomer} alt="" className="h-14 w-14 object-contain rounded-lg bg-white mb-2" /><h1 className="text-2xl font-black leading-tight">');
      }
      if (config.heroImageUrl && entry.name === "menu.tsx") {
        source = source.replace(/import\s+(banner[12])\s+from\s+["'][^"']+["'];?/g,
          (_match, name) => `const ${name} = ${JSON.stringify(config.heroImageUrl)};`);
      }
      await writeFile(file, source);
    }
  }
}
// Create app-owned artwork instead of copying old customer screenshots.
const publicDir = resolve(root, "client/public");
await mkdir(publicDir, { recursive: true });
const secondaryColor = /^#[0-9a-f]{6}$/i.test(config.secondaryColor || "") ? config.secondaryColor : color;
const brandVector = (width, height) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="brand"><stop stop-color="${color}"/><stop offset="1" stop-color="${secondaryColor}"/></linearGradient></defs><rect width="100%" height="100%" rx="24" fill="url(#brand)"/><circle cx="${width * .85}" cy="${height * .15}" r="${height * .6}" fill="white" opacity=".1"/></svg>`;
const paymentLabel = label => `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="44" viewBox="0 0 180 44"><text x="90" y="30" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#334155">${label}</text></svg>`;
for (const [file, svg] of Object.entries({
  "tenant-card.svg": brandVector(900, 570),
  "tenant-hero-brand.svg": brandVector(1600, 900),
  "payment-label-stc.svg": paymentLabel("STC Pay"),
  "payment-label-card.svg": paymentLabel("Visa / mada"),
})) await writeFile(resolve(publicDir, file), svg);
await bindVisualAssets(resolve(root, "client/src"));
if (config.customerWhatsappRegistration === true) {
  await writeFile(resolve(root, "client/src/pages/customer-login.tsx"),
    'export { default } from "@/components/qirox-customer-access";\n');
  await writeFile(resolve(root, "client/src/pages/CustomerAuth.tsx"),
    'export { default } from "@/components/qirox-customer-access";\n');
  const modalPath = resolve(root, "client/src/components/customer-auth-modal.tsx");
  let modal = await readFile(modalPath, "utf8");
  if (!modal.includes("/* QIROX CUSTOMER OTP MODAL */")) {
    const anchor = '  return (\n    <Dialog open={state.open}';
    if (!modal.includes(anchor)) throw new Error("Customer authentication modal is incompatible with OTP customization");
    modal = 'import QiroxCustomerAccess from "@/components/qirox-customer-access";\n' + modal.replace(anchor, `
  /* QIROX CUSTOMER OTP MODAL */
  if (state.open && mode !== "guest") return (
    <Dialog open={state.open} onOpenChange={open => { if (!open) closeAuthModal(); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only"><DialogTitle>تأكيد حساب العميل</DialogTitle></DialogHeader>
        <QiroxCustomerAccess compact initialMode={mode} onAuthenticated={triggerSuccess} />
      </DialogContent>
    </Dialog>
  );
${anchor}`);
    await writeFile(modalPath, modal);
  }
}
const cssPath = resolve(root, "client/src/index.css");
let css = await readFile(cssPath, "utf8");
css = css.replace(/\/\* QIROX CUSTOMER COLORS \*\/[\s\S]*?\/\* END QIROX CUSTOMER COLORS \*\//g, "");
const luminance = rgb.reduce((sum, v, i) => sum + (v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4) * [.2126, .7152, .0722][i], 0);
const foreground = luminance > .179 ? "0 0% 9%" : "0 0% 100%";
css += `\n/* QIROX CUSTOMER COLORS */\n:root { --primary: ${hsl.h} ${hsl.s}% ${hsl.l}%; --primary-foreground: ${foreground}; --ring: ${hsl.h} ${hsl.s}% ${hsl.l}%; --brand-primary: ${color}; --brand-secondary: ${config.secondaryColor || color}; }\n/* END QIROX CUSTOMER COLORS */\n`;
await writeFile(cssPath, css);

const deliveryEntitlements = {
  tier,
  monthlyEmailLimit: tier === "infinity" ? 10000 : tier === "pro" ? 1000 : 0,
  businessMailboxes: tier === "infinity" ? 5 : 0,
  postDeliveryRevisions: tier === "lite" ? 0 : 5,
  postDeliveryFeatures: tier === "infinity" ? 20 : 0,
  prioritySupport: tier === "infinity",
  operationalStatus: "provisioning-required",
  requiresExternalEmailProvider: tier !== "lite",
  requiresManualMailboxProvisioning: tier === "infinity",
  requiresManualSupportProvisioning: tier === "infinity",
};
await writeFile(resolve(root, "client/public", "delivery-entitlements.json"), JSON.stringify(deliveryEntitlements, null, 2));

const htmlPath = resolve(root, "client/index.html");
let html = await readFile(htmlPath, "utf8");
html = html.replace(/<!-- qirox-splash:start -->[\s\S]*?<!-- qirox-splash:end -->/g, "");
html = html.replace(/<body(?:\s[^>]*)?>/i, match => match + splashMarkup(config));
html = html.replace(/(<title[^>]*>)[\s\S]*?(<\/title>)/i, `$1${String(config.businessName).replace(/[<>&\"']/g, "")}$2`);
html = html.replace(/(<meta[^>]+(?:name|property)=['\"](?:description|og:title|og:description|twitter:title|twitter:description)['\"][^>]*content=['\"])[^'\"]*(['\"])/gi, `$1${String(config.businessName).replace(/[<>&\"']/g, "")}$2`);
await writeFile(htmlPath, html);
const mainPath = resolve(root, "client/src/main.tsx");
let main = await readFile(mainPath, "utf8");
main = main.replace(/\/\/ qirox-splash-ready:start[\s\S]*?\/\/ qirox-splash-ready:end/g, "");
main += '\n// qirox-splash-ready:start\nrequestAnimationFrame(() => requestAnimationFrame(() => document.dispatchEvent(new Event("qirox:app-ready"))));\n// qirox-splash-ready:end\n';
await writeFile(mainPath, main);
