import fs from "node:fs";
import path from "node:path";
import type { BuilderConfig } from "../../../shared/saas-builder";
import { SAAS_DELIVERY_ENTITLEMENTS, SAAS_FEATURES, type BuilderTier } from "../../../shared/saas-builder";
import { safeLocalUploadUrl } from "./config";

// Runtime lookup is intentionally rooted in the checked-in, sanitized source
// trees. Uploaded archives are never opened while serving a build request.
const DATA_ROOT = path.resolve(process.cwd(), "services", "saas-templates");
const TEMPLATES = [
  { id: "cluny", name: "Cluny Café", nameAr: "كلوني — مقهى", kind: "cafe" as const, description: "نظام مقهى متكامل مع هوية وتصميم كلوني.", previewColors: ["#6d4934", "#f5f0e8"] },
  { id: "blackrose", name: "Black Rose Café", nameAr: "بلاك روز — مقهى", kind: "cafe" as const, description: "نظام مقهى متكامل مع هوية وتصميم بلاك روز.", previewColors: ["#1c1a1b", "#a27b56"] },
  { id: "tasali", name: "Tasali Restaurant", nameAr: "تسالي — مطعم", kind: "restaurant" as const, description: "نظام مطعم متكامل مع هوية وتصميم تسالي.", previewColors: ["#a44b32", "#e8d5b8"] },
  { id: "chef-palace", name: "Chef Palace", nameAr: "قصر الشيف — مطعم", kind: "restaurant" as const, description: "نظام مطعم متكامل مع هوية وتصميم قصر الشيف.", previewColors: ["#24433e", "#bd9461"] },
];
const MINIMUM_FILES = ["package.json", "package-lock.json", "client/index.html", "server/index.ts", "server/routes.ts", "server/saas-policy.ts", "shared/schema.ts"];
const FORBIDDEN_PATH = /(?:^|\/)(?:(?:\.git|node_modules|dist|uploads|attached_assets|backups|certs|certificates|android|ios|build)(?:\/|$)|\.env(?:\.|$)|[^/]*\.(?:pem|key|p12|pfx|crt|cer|sqlite|db|dump|bak|zip|tar|gz|mov|mp4|pdf)$|\._)|^(?:data|database)(?:\/|$)/i;

type GeneratedResult = {
  buildCommand: string;
  startCommand: string;
  envVars: Array<{ key: string; required: boolean; description: string }>;
  warnings: string[];
  fileCount: number;
};

async function optionalEnvironmentRequirements(outputDir: string, tier: string) {
  const names = new Set<string>();
  const visit = async (directory: string) => {
    for (const entry of await fs.promises.readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile() && /\.(?:ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
        const text = await fs.promises.readFile(absolute, "utf8");
        for (const match of text.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) names.add(match[1]);
      }
    }
  };
  await visit(outputDir);
  // Google's SDK reads this itself, so it is not visible in the source scan.
  if (names.has("PRIVATE_OBJECT_DIR") || names.has("PUBLIC_OBJECT_SEARCH_PATHS")) {
    names.add("GOOGLE_APPLICATION_CREDENTIALS");
  }
  const rank = tierRank(tier);
  const groups: Array<{ pattern: RegExp; minimum: number; description: string }> = [
    { pattern: /^(?:APP_URL|SITE_URL)$/, minimum: 1, description: "رابط النشر العام لهذا العميل؛ يضبط بعد تخصيص النطاق." },
    { pattern: /^(?:MAPKIT_|VITE_MAPKIT_)/, minimum: 1, description: "إعداد اختياري للخرائط؛ يحصل عليه العميل من مزود الخدمة عند تفعيلها." },
    { pattern: /^(?:ZATCA_|VAT_RATE$)/, minimum: 1, description: "إعداد اختياري للفوترة الضريبية؛ لا تُفعل مزامنة الهيئة قبل اعتماد بيانات العميل." },
    { pattern: /^(?:PUBLIC_OBJECT_SEARCH_PATHS|PRIVATE_OBJECT_DIR|GOOGLE_APPLICATION_CREDENTIALS)$/, minimum: 1, description: "تخزين ملفات خارجي اختياري؛ يلزم إعداد مزود متوافق مع بيئة النشر." },
    { pattern: /^(?:SMTP(?:_|2GO_)|CPANEL_SMTP_|MAILEROO_|ADMIN_EMAIL$|NOTIFICATION_EMAIL$)/, minimum: 2, description: "إعداد بريد خاص بالعميل عند تفعيل الإرسال؛ لا تنسخ بيانات بريد المنصة." },
    { pattern: /^(?:VAPID_|APNS_)/, minimum: 2, description: "مفاتيح إشعارات خاصة بتطبيق العميل؛ إعدادها مطلوب فقط عند تفعيل هذه القناة." },
    { pattern: /^APPLE_/, minimum: 2, description: "هوية وشهادات Apple Wallet الخاصة بالعميل؛ لا تتوفر شهادات افتراضية." },
    { pattern: /^(?:PAYMOB_|STCPAY_|MOYASAR_|PAYTABS_|TAP_|STRIPE_)/, minimum: 2, description: "بيانات حساب دفع العميل عند تفعيل المزود؛ لا تُولد مفاتيح مزود دفع." },
    { pattern: /^(?:KIMI_API_KEY|QIROX_STUDIO_API_KEY|OPENAI_API_KEY)$/, minimum: 3, description: "تكامل ذكاء اصطناعي اختياري يحتاج مفتاحاً يخص العميل؛ ليس مفعلاً تلقائياً." },
  ];
  return [...names].sort().flatMap(key => {
    const group = groups.find(candidate => rank >= candidate.minimum && candidate.pattern.test(key));
    return group ? [{ key, required: false, description: group.description }] : [];
  });
}

function tierRank(tier: unknown): number {
  const normalized = String(tier || "").toLowerCase();
  return ({ lite: 1, pro: 2, infinity: 3, infinite: 3 } as Record<string, number>)[normalized] || 0;
}

function normalizedTier(tier: string): string {
  const normalized = tier.toLowerCase();
  return normalized === "infinite" ? "infinity" : normalized;
}

export function listTemplates() {
  return TEMPLATES.map((template) => {
    const directory = path.join(DATA_ROOT, template.id);
    const available = MINIMUM_FILES.every((file) => {
      try { return fs.statSync(path.join(directory, file)).isFile(); } catch { return false; }
    });
    return { ...template, minTier: "lite", available };
  });
}

function isSafeHttpsUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return false;
    if (/^(?:0|10|127|169\.254|192\.168)\./.test(host) || /^172\.(?:1[6-9]|2\d|3[01])\./.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

export function validateBuilderConfig(config: BuilderConfig, tier = "lite"): string[] {
  if (!config || typeof config !== "object") return ["بيانات النشاط غير صالحة"];
  const errors: string[] = [];
  if (!String(config.businessName || "").trim()) errors.push("اسم النشاط مطلوب");
  if (!String(config.commercialRegNumber || "").trim()) errors.push("رقم السجل التجاري مطلوب");
  if (config.primaryColor && !/^#[0-9a-f]{6}$/i.test(config.primaryColor)) errors.push("لون الهوية غير صالح");
  if (config.websiteUrl && !isSafeHttpsUrl(config.websiteUrl)) errors.push("رابط الموقع يجب أن يكون HTTPS عاماً");
  if (config.commercialRegUrl && !safeLocalUploadUrl(config.commercialRegUrl) && !isSafeHttpsUrl(config.commercialRegUrl)) errors.push("رابط السجل التجاري يجب أن يكون HTTPS عاماً");
  if (config.logoUrl && !(safeLocalUploadUrl(config.logoUrl) && !/\.pdf$/i.test(config.logoUrl)) && !isSafeHttpsUrl(config.logoUrl)) errors.push("رابط الشعار غير صالح");
  if (config.secondaryColor && !/^#[0-9a-f]{6}$/i.test(config.secondaryColor)) errors.push("اللون الثانوي غير صالح");
  if (config.heroImageUrl && !(safeLocalUploadUrl(config.heroImageUrl) && !/\.pdf$/i.test(config.heroImageUrl)) && !isSafeHttpsUrl(config.heroImageUrl)) errors.push("رابط صورة الهيرو غير صالح");
  if (config.splashImageUrl && !(safeLocalUploadUrl(config.splashImageUrl) && !/\.pdf$/i.test(config.splashImageUrl)) && !isSafeHttpsUrl(config.splashImageUrl)) errors.push("رابط صورة شاشة البداية غير صالح");
  if (config.iban && !/^[A-Za-z0-9 -]{8,64}$/.test(config.iban)) errors.push("رقم IBAN غير صالح");
  const limits: Partial<Record<keyof BuilderConfig, number>> = {
    businessName: 180,
    businessNameEn: 180,
    commercialRegNumber: 80,
    taxNumber: 80,
    commercialRegUrl: 1000,
    bankName: 120,
    bankAccountName: 180,
    iban: 64,
    logoUrl: 1000,
    primaryColor: 7,
    phone: 40,
    address: 400,
    websiteUrl: 1000,
  };
  for (const [key, limit] of Object.entries(limits) as Array<[keyof BuilderConfig, number]>) {
    const value = config[key];
    if (typeof value !== "string" || value.length > limit) errors.push(`قيمة الحقل ${key} غير صالحة`);
  }
  if (!tierRank(tier)) errors.push("الباقة غير صالحة");
  return [...new Set(errors)];
}

function safeRelativePath(root: string, current: string): string {
  const relative = path.relative(root, current).split(path.sep).join("/");
  if (!relative || path.isAbsolute(relative) || relative.split("/").some((part) => part === ".." || !part) || FORBIDDEN_PATH.test(relative)) {
    throw new Error("قالب المشروع يحتوي على مسار أو ملف غير مسموح");
  }
  return relative;
}

async function copyTree(sourceRoot: string, outputRoot: string): Promise<number> {
  let copied = 0;
  const visit = async (sourceDirectory: string) => {
    for (const entry of await fs.promises.readdir(sourceDirectory, { withFileTypes: true })) {
      const source = path.join(sourceDirectory, entry.name);
      const relative = safeRelativePath(sourceRoot, source);
      const info = await fs.promises.lstat(source);
      if (info.isSymbolicLink()) throw new Error("قالب المشروع يحتوي على رابط رمزي");
      if (info.isDirectory()) {
        await fs.promises.mkdir(path.join(outputRoot, relative), { recursive: true });
        await visit(source);
      } else if (info.isFile()) {
        if (info.size > 12 * 1024 * 1024) throw new Error("ملف مصدر القالب يتجاوز الحجم المسموح");
        const target = path.join(outputRoot, relative);
        await fs.promises.mkdir(path.dirname(target), { recursive: true });
        await fs.promises.copyFile(source, target);
        copied++;
      } else {
        throw new Error("قالب المشروع يحتوي على نوع ملف غير مسموح");
      }
    }
  };
  await visit(sourceRoot);
  return copied;
}

async function bindCustomerTenant(outputDir: string) {
  const serverRoot = path.join(outputDir, "server");
  const visit = async (directory: string) => {
    for (const entry of await fs.promises.readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile() && /\.(?:ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
        const source = await fs.promises.readFile(absolute, "utf8");
        const isolated = source.replace(/(?<![\w.])TENANT_ID!/g, "process.env.TENANT_ID!");
        if (isolated !== source) await fs.promises.writeFile(absolute, isolated);
      }
    }
  };
  await visit(serverRoot);
}

async function writeGeneratedMetadata(outputDir: string, input: {
  templateId: string;
  config: BuilderConfig;
  tier: string;
  logoPath?: string;
  heroPath?: string;
  splashPath?: string;
}) {
  const packagePath = path.join(outputDir, "package.json");
  const lockPath = path.join(outputDir, "package-lock.json");
  const projectPackage = JSON.parse(await fs.promises.readFile(packagePath, "utf8"));
  const packageLock = JSON.parse(await fs.promises.readFile(lockPath, "utf8"));
  const packageSlug = String(input.config.businessNameEn || input.config.businessName)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "tenant";
  projectPackage.name = `restaurant-${packageSlug}`;
  projectPackage.version = "1.0.0";
  projectPackage.private = true;
  projectPackage.type = "module";
  projectPackage.description = `${input.config.businessNameEn || input.config.businessName} restaurant management system`;
  projectPackage.engines = { ...(projectPackage.engines || {}), node: ">=20.19.0" };
  // Strip archive-specific hooks, preserve original dependency graph, and use
  // an ESM server bundle with all package imports external (including natives).
  projectPackage.scripts = {
    dev: "node scripts/customize-tenant.mjs && NODE_ENV=development node_modules/.bin/tsx server/index.ts",
    build: "node scripts/customize-tenant.mjs && vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js",
    start: "NODE_ENV=production node dist/index.js",
    check: "tsc",
  };
  packageLock.name = projectPackage.name;
  packageLock.version = "1.0.0";
  if (packageLock.packages?.[""]) {
    packageLock.packages[""].name = projectPackage.name;
    packageLock.packages[""].version = "1.0.0";
  }
  await Promise.all([
    fs.promises.writeFile(packagePath, JSON.stringify(projectPackage, null, 2)),
    fs.promises.writeFile(lockPath, JSON.stringify(packageLock)),
    fs.promises.copyFile(path.join(DATA_ROOT, "runtime", "customize-tenant.mjs"), path.join(outputDir, "scripts", "customize-tenant.mjs")).catch(async (error: any) => {
      if (error?.code !== "ENOENT") throw error;
      await fs.promises.mkdir(path.join(outputDir, "scripts"), { recursive: true });
      await fs.promises.copyFile(path.join(DATA_ROOT, "runtime", "customize-tenant.mjs"), path.join(outputDir, "scripts", "customize-tenant.mjs"));
    }),
    fs.promises.copyFile(path.join(DATA_ROOT, "runtime", "saas-bootstrap.ts"), path.join(outputDir, "server", "saas-bootstrap.ts")),
    fs.promises.copyFile(path.join(DATA_ROOT, "runtime", "saas-services.ts"), path.join(outputDir, "server", "saas-services.ts")),
    fs.promises.copyFile(path.join(DATA_ROOT, "runtime", "saas-extra-features.ts"), path.join(outputDir, "server", "saas-extra-features.ts")),
    fs.promises.copyFile(path.join(DATA_ROOT, "runtime", "qirox-customer-access.tsx"), path.join(outputDir, "client", "src", "components", "qirox-customer-access.tsx")),
  ]);
  await fs.promises.mkdir(path.join(outputDir, "client", "public"), { recursive: true });
  await fs.promises.mkdir(path.join(outputDir, "docs"), { recursive: true });
  const logoUrl = input.config.logoUrl || "";
  let generatedLogoUrl = logoUrl;
  if (input.logoPath) {
    const logoPath = path.resolve(input.logoPath);
    const stat = await fs.promises.lstat(logoPath);
    const extension = path.extname(logoPath).toLowerCase();
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 8 * 1024 * 1024 || ![".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(extension)) {
      throw new Error("ملف الشعار غير صالح");
    }
    generatedLogoUrl = `/tenant-logo${extension}`;
    await fs.promises.copyFile(logoPath, path.join(outputDir, "client", "public", path.basename(generatedLogoUrl)));
    const sharpModule: any = await import("sharp");
    const sharp = sharpModule.default || sharpModule;
    await sharp(logoPath).rotate().png().toFile(path.join(outputDir, "client", "public", "logo.png"));
  } else if (logoUrl.startsWith("/uploads/")) {
    throw new Error("تعذر العثور على ملف الشعار المرفوع");
  }
  if (input.heroPath) {
    const file = path.resolve(input.heroPath);
    const stat = await fs.promises.lstat(file);
    const extension = path.extname(file).toLowerCase();
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 8 * 1024 * 1024 || ![".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(extension)) throw new Error("صورة الهيرو غير صالحة");
    await fs.promises.copyFile(file, path.join(outputDir, "client", "public", `tenant-hero${extension}`));
  } else if (input.config.heroImageUrl?.startsWith("/uploads/")) throw new Error("تعذر العثور على صورة الهيرو المرفوعة");
  if (input.splashPath) {
    const file = path.resolve(input.splashPath);
    const stat = await fs.promises.lstat(file);
    const extension = path.extname(file).toLowerCase();
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 8 * 1024 * 1024 || ![".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(extension)) throw new Error("صورة شاشة البداية غير صالحة");
    await fs.promises.copyFile(file, path.join(outputDir, "client", "public", `tenant-splash${extension}`));
  } else if (input.config.splashImageUrl?.startsWith("/uploads/")) throw new Error("تعذر العثور على صورة شاشة البداية المرفوعة");
  await fs.promises.copyFile(path.join(DATA_ROOT, "runtime", "splash-screen.mjs"), path.join(outputDir, "scripts", "splash-screen.mjs"));
  const serverIndexPath = path.join(outputDir, "server", "index.ts");
  let serverIndex = await fs.promises.readFile(serverIndexPath, "utf8");
  serverIndex = `import { registerSaasServices } from "./saas-services";\n${serverIndex}`;
  serverIndex = serverIndex.replace("app.use(saasFeatureGate);", "app.use(saasFeatureGate);\n  registerSaasServices(app);");
  await fs.promises.writeFile(serverIndexPath, serverIndex);
  const policyPath = path.join(outputDir, "server", "saas-policy.ts");
  let policy = await fs.promises.readFile(policyPath, "utf8");
  policy = `import { hasSaasExtraFeature } from "./saas-extra-features";\n${policy}`;
  policy = policy.replace('if (!isFeatureAvailable(req.path, process.env.PROJECT_PLAN_TIER || ""))', 'if (!isFeatureAvailable(req.path, process.env.PROJECT_PLAN_TIER || "") && !hasSaasExtraFeature(req.path))');
  await fs.promises.writeFile(policyPath, policy);
  const mailPath = path.join(outputDir, "server", "mail-service.ts");
  if (fs.existsSync(mailPath)) {
    let mail = await fs.promises.readFile(mailPath, "utf8");
    mail = `import { sendSaasEmail } from "./saas-services";\n${mail}`;
    mail = mail.replace("  const { smtpFrom } = loadSmtpConfig();", `  if (process.env.QIROX_EMAIL_API_KEY) {
    try { return await sendSaasEmail(options); }
    catch { console.error("[MAIL] QIROX email delivery failed"); return false; }
  }
  const { smtpFrom } = loadSmtpConfig();`);
    await fs.promises.writeFile(mailPath, mail);
  }

  const normalized = normalizedTier(input.tier);
  const entitlements = {
    tier: normalized,
    features: SAAS_FEATURES.filter((feature) => tierRank(input.tier) >= tierRank(feature.minTier) || input.config.extraFeatures?.includes(feature.id)),
    customizations: input.config.extraFeatures || [],
    delivery: SAAS_DELIVERY_ENTITLEMENTS[normalized as BuilderTier],
    externalServices: { provisioned: false, requiresProviderConfiguration: true },
  };
  const setupGuide = `# Customer restaurant system\n\nThis is the original full ${input.templateId} React/Express/Mongoose application with its independent MongoDB schema, route handlers, and source UI. Template source is sanitized and does not include archived customer data, customer logos/product media, uploads, certificates, or seed records.\n\n## Required deployment environment\n\nSet these values as deployment secrets/environment variables; do not commit a populated .env file:\n\n- MONGODB_URI — a MongoDB URI with a dedicated database name for this customer. A database named QIROX is rejected.\n- TENANT_ID — a new tenant identifier unique within this database.\n- PROJECT_PLAN_TIER — the purchased tier: lite, pro, or infinity. The API checks this server-side for direct API calls.\n- SESSION_SECRET — random secret with at least 32 characters.\n- BOOTSTRAP_ADMIN_PASSWORD — the initial owner password, at least 16 characters. It is hashed and only used to create the first owner account; it never resets an existing account.\n- BUSINESS_CONFIG_JSON — JSON object using the BuilderConfig fields: businessName, businessNameEn, commercialRegNumber, taxNumber, commercialRegUrl, bankName, bankAccountName, iban, logoUrl, primaryColor, phone, address, websiteUrl.\n\nBuild with npm ci && npm run build; start with npm start. Vite builds the original React customer/employee/admin system and esbuild keeps native/server packages external. Configure public business identity and banking/legal details through environment configuration, not source code.\n\nThe fresh database bootstrap creates the requested tenant, applies only the purchased tier, stores the supplied business identity, and creates one owner account only when that tenant has no employees. It does not import an archive database or any source-customer record.\n`;
  await Promise.all([
    fs.promises.writeFile(path.join(outputDir, "entitlements.json"), JSON.stringify(entitlements, null, 2)),
    fs.promises.writeFile(path.join(outputDir, "docs", "SAAS-SETUP.md"), setupGuide
      .replace("npm ci && npm run build", "npm ci --include=dev && npm run build")
      .replaceAll(input.templateId, String(input.config.businessNameEn || input.config.businessName))
      .replace("- BOOTSTRAP_ADMIN_PASSWORD — the initial owner password, at least 16 characters. It is hashed and only used to create the first owner account; it never resets an existing account.",
        "- BOOTSTRAP_ADMIN_PASSWORD_HASH — the bcrypt hash generated from the secure owner password supplied through the builder. BOOTSTRAP_ADMIN_PASSWORD is an optional 16-character fallback for first startup only.")
      .replace("logoUrl, primaryColor, phone", "logoUrl, heroImageUrl, splashImageUrl, primaryColor, phone")
      .replace("creates one owner account only when that tenant has no employees.", "creates the `owner` account only if one does not already exist, preserving existing owner credentials.")),
    fs.promises.writeFile(path.join(outputDir, "client", "public", "tenant-mark.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${input.config.primaryColor || "#24433e"}"/><text x="32" y="43" text-anchor="middle" font-family="sans-serif" font-size="30" fill="#fff">${String(input.config.businessName.trim()[0] || "R").replace(/[<>&"']/g, "")}</text></svg>`),
    fs.promises.writeFile(path.join(outputDir, "client", "public", "manifest.webmanifest"), JSON.stringify({ name: input.config.businessName, short_name: Array.from(input.config.businessName).slice(0, 12).join(""), start_url: "/", display: "standalone", background_color: "#ffffff", theme_color: input.config.primaryColor || "#24433e", icons: [{ src: "/tenant-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }] }, null, 2)),
  ]);
}

export async function generateProject(input: {
  templateId: string;
  config: BuilderConfig;
  tier: string;
  outputDir: string;
  projectId?: string;
  logoPath?: string;
  heroPath?: string;
  splashPath?: string;
}): Promise<GeneratedResult> {
  if (!TEMPLATES.some((template) => template.id === input.templateId)) throw new Error("قالب المشروع غير موجود");
  if (!tierRank(input.tier)) throw new Error("باقة المشروع غير صالحة");
  const errors = validateBuilderConfig(input.config, input.tier);
  if (errors.length) throw new Error(errors[0]);
  const templateDirectory = path.join(DATA_ROOT, input.templateId);
  if (listTemplates().find((template) => template.id === input.templateId)?.available !== true) {
    throw new Error("مصدر القالب الأصلي غير مكتمل؛ لا يمكن إنشاء بديل مبسط");
  }
  const outputDir = path.resolve(input.outputDir);
  if (!outputDir || outputDir === path.parse(outputDir).root || outputDir === path.resolve(process.cwd())) {
    throw new Error("مسار إخراج المشروع غير صالح");
  }
  await fs.promises.mkdir(outputDir, { recursive: true });
  if ((await fs.promises.readdir(outputDir)).length) throw new Error("مجلد إخراج المشروع يجب أن يكون فارغاً");

  await copyTree(templateDirectory, outputDir);
  await bindCustomerTenant(outputDir);
  await writeGeneratedMetadata(outputDir, input);
  if (input.projectId) await writeGeneratedSiteControl(outputDir, input.projectId);
  let fileCount = 0;
  const countFiles = async (directory: string) => {
    for (const entry of await fs.promises.readdir(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw new Error("قالب المشروع يحتوي على رابط رمزي");
      if (entry.isDirectory()) await countFiles(path.join(directory, entry.name));
      else if (entry.isFile()) fileCount++;
    }
  };
  await countFiles(outputDir);
  const buildEnv = [
    { key: "MONGODB_URI", required: true, description: "قاعدة MongoDB جديدة ومخصصة لهذا المشروع فقط؛ تُرفض قواعد المنصة." },
    { key: "TENANT_ID", required: true, description: "معرّف مستأجر جديد ومخصص لقاعدة العميل." },
    { key: "PROJECT_PLAN_TIER", required: true, description: "الباقة المشتراة lite أو pro أو infinity؛ يتحقق الخادم منها في كل طلب API." },
    { key: "SESSION_SECRET", required: true, description: "سر جلسات عشوائي بطول 32 محرفاً على الأقل." },
    { key: "BOOTSTRAP_ADMIN_PASSWORD", required: false, description: "بديل آمن لإنشاء المالك لأول مرة فقط، بطول 16 محرفاً على الأقل؛ لا تضع كلمة مرور ضعيفة." },
    { key: "BUSINESS_CONFIG_JSON", required: true, description: "إعدادات BuilderConfig للهوية والبيانات القانونية/البنكية؛ تحفظ كسر نشر ولا تودع في المستودع." },
    ...(input.projectId ? [
      { key: "QIROX_PLATFORM_URL", required: true, description: "رابط QIROX المنشور للتحقق من إتاحة الموقع." },
      { key: "QIROX_PROJECT_ID", required: true, description: "معرف المشروع المخصص، يضاف آليًا عند التوليد." },
    ] : []),
    { key: "BOOTSTRAP_ADMIN_PASSWORD_HASH", required: true, description: "قيمة bcrypt السرية التي ينشئها الصانع لكلمة مرور المالك؛ لا تودعها في المستودع." },
    { key: "BOOTSTRAP_STAFF_PASSWORD_HASH", required: false, description: "قيمة تحقق حساب staff بصلاحيات كاشير فقط؛ ليست كلمة مرور نصية." },
    ...((input.config.customerWhatsappRegistration || input.config.notificationEmail)
      ? [{ key: "QIROX_PLATFORM_URL", required: true, description: "رابط منصة QIROX المنشورة التي تخدم API المشروع، HTTPS؛ لا تستخدم رابط المعاينة المؤقت للإنتاج." }]
      : []),
    ...(input.config.customerWhatsappRegistration ? [
      { key: "QIROX_WHATSAPP_API_KEY", required: true, description: "مفتاح واتساب الخاص بالمشروع، يظهر مرة واحدة ولا يُحفظ في المصدر." },
      { key: "QIROX_WHATSAPP_API_PATH", required: true, description: "مسار API واتساب المقيّد بهذا المشروع." },
    ] : []),
    ...(input.config.notificationEmail ? [
      { key: "QIROX_EMAIL_API_KEY", required: true, description: "مفتاح البريد الخاص بالمشروع، يظهر مرة واحدة ولا يُحفظ في المصدر." },
      { key: "QIROX_EMAIL_API_PATH", required: true, description: "مسار API البريد المقيّد بهذا المشروع." },
    ] : []),
  ];
  return {
    buildCommand: "npm ci --include=dev && npm run build",
    startCommand: "npm start",
    envVars: [...buildEnv, ...await optionalEnvironmentRequirements(outputDir, input.tier)],
    warnings: [
      "المصدر الأصلي الكامل للتطبيق محفوظ؛ وسائط المنتجات وشعارات العملاء القديمة والبيانات والبذور أزيلت وتستبدل بهوية العميل.",
      "إعدادات التطبيق وقاعدة البيانات وبيانات المالك تُهيأ من أسرار النشر عند التشغيل، ولا تُستخدم قاعدة بيانات المنصة.",
      "اعتماديات القوالب الأصلية بها تنبيهات أمنية معروفة؛ يلزم معالجتها ومراجعة إعدادات الخدمات قبل الاستخدام الإنتاجي.",
    ],
    fileCount,
  };
}

export async function writeGeneratedSiteControl(outputDir: string, projectId: string) {
  const serverIndex = path.join(outputDir, "server", "index.ts");
  const source = await fs.promises.readFile(serverIndex, "utf8");
  const importLine = 'import { qiroxSiteControl } from "./qirox-site-control";\n';
  const patched = source.includes(importLine)
    ? source
    : source.replace(/(import .*?;\n)(?!import)/s, match => `${match}${importLine}`);
  if (!patched.includes("app.use(qiroxSiteControl);")) {
    if (!patched.includes("app.use(saasFeatureGate);")) throw new Error("قالب المشروع لا يحتوي نقطة تركيب سياسة الاشتراك");
  }
  const withMiddleware = patched.includes("app.use(qiroxSiteControl);")
    ? patched
    : patched.replace("app.use(saasFeatureGate);", "app.use(qiroxSiteControl);\n  app.use(saasFeatureGate);");
  const dataImport = 'import { registerQiroxDataApi } from "./qirox-data-api";\n';
  let finalIndex = withMiddleware.includes(dataImport)
    ? withMiddleware
    : withMiddleware.replace(/(import .*?;\n)(?!import)/s, match => `${match}${dataImport}`);
  if (!finalIndex.includes("registerQiroxDataApi(app);")) {
    if (!finalIndex.includes("const server = await registerRoutes(app);")) throw new Error("قالب المشروع لا يحتوي نقطة تركيب API البيانات");
    finalIndex = finalIndex.replace("const server = await registerRoutes(app);", "const server = await registerRoutes(app);\n  registerQiroxDataApi(app);");
  }
  await fs.promises.writeFile(serverIndex, finalIndex);
  const ecosystemPath = path.join(outputDir, "server", "ecosystem.ts");
  let ecosystem = await fs.promises.readFile(ecosystemPath, "utf8");
  if (!ecosystem.includes('{ key: "invoices:read"')) {
    ecosystem = ecosystem.replace(
      '{ key: "inventory:read", nameAr: "قراءة المخزون" },',
      '{ key: "inventory:read", nameAr: "قراءة المخزون" },\n  { key: "invoices:read", nameAr: "قراءة الفواتير" },\n  { key: "subscription:read", nameAr: "قراءة باقة النظام" },',
    );
    await fs.promises.writeFile(ecosystemPath, ecosystem);
  }
  const routesPath = path.join(outputDir, "server", "routes.ts");
  let routes = await fs.promises.readFile(routesPath, "utf8");
  routes = routes.replace(
    '"GET /api/v1/inventory", "PATCH /api/v1/inventory/:id",',
    '"GET /api/v1/inventory", "PATCH /api/v1/inventory/:id",\n        "GET /api/v1/invoices", "GET /api/v1/subscription",',
  );
  await fs.promises.writeFile(routesPath, routes);
  await fs.promises.writeFile(path.join(outputDir, "server", "qirox-data-api.ts"), `import { requireApiKey } from "./ecosystem";

export function registerQiroxDataApi(app: any) {
  app.get("/api/v1/invoices", requireApiKey("invoices:read"), async (req: any, res: any) => {
    try {
      const { TaxInvoiceModel, BranchModel } = await import("@shared/schema");
      const tenantId = String(req.tenantId || "");
      if (!tenantId) return res.status(403).json({ error: "API key has no tenant scope" });
      const branches = await BranchModel.find({ tenantId }).select("id").lean();
      const branchIds = branches.map((branch: any) => String(branch.id));
      if (!branchIds.length) return res.json({ data: [], count: 0, page: 1, limit: 50 });
      const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
      const page = Math.max(Number(req.query.page) || 1, 1);
      const filter: any = { branchId: { $in: branchIds } };
      if (req.query.status) filter.zatcaStatus = String(req.query.status);
      if (req.query.from || req.query.to) {
        filter.invoiceDate = {};
        if (req.query.from && !Number.isNaN(Date.parse(String(req.query.from)))) filter.invoiceDate.$gte = new Date(String(req.query.from));
        if (req.query.to && !Number.isNaN(Date.parse(String(req.query.to)))) filter.invoiceDate.$lte = new Date(String(req.query.to));
      }
      const [data, count] = await Promise.all([
        TaxInvoiceModel.find(filter).select("-xmlContent -zatcaResponse -qrCode -invoiceHash -previousInvoiceHash")
          .sort({ invoiceDate: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        TaxInvoiceModel.countDocuments(filter),
      ]);
      res.json({ data, count, page, limit });
    } catch {
      res.status(500).json({ error: "Unable to read invoices" });
    }
  });

  app.get("/api/v1/subscription", requireApiKey("subscription:read"), async (req: any, res: any) => {
    try {
      const { BusinessConfigModel } = await import("@shared/schema");
      const tenantId = String(req.tenantId || "");
      if (!tenantId) return res.status(403).json({ error: "API key has no tenant scope" });
      const config: any = await BusinessConfigModel.findOne({ tenantId }).select("subscriptionPlan").lean();
      res.json({ data: { planTier: process.env.PROJECT_PLAN_TIER || null, subscriptionPlan: config?.subscriptionPlan || null } });
    } catch {
      res.status(500).json({ error: "Unable to read subscription plan" });
    }
  });
}
`);
  await fs.promises.mkdir(path.join(outputDir, "docs"), { recursive: true });
  await fs.promises.writeFile(path.join(outputDir, "docs", "EXTERNAL-API.md"), `# External API

All requests use a generated API key in the header:

\`Authorization: Bearer qrx_live_...\`

Create or revoke keys from the system's Ecosystem/API Keys page. Grant only the read scopes required by the integration. These endpoints are read-only.

## Read endpoints

| Method | Endpoint | Scope | Notes |
| --- | --- | --- | --- |
| GET | \`/api/v1/menu\` | \`menu:read\` | Catalog items |
| GET | \`/api/v1/orders?limit=50&status=paid&since=2026-01-01\` | \`orders:read\` | Orders with customer/order details |
| GET | \`/api/v1/customers?limit=50&phone=...\` | \`customers:read\` | Password and wallet PIN fields are excluded |
| GET | \`/api/v1/inventory?limit=50\` | \`inventory:read\` | Stock records |
| GET | \`/api/v1/invoices?page=1&limit=50&from=2026-01-01&to=2026-12-31&status=accepted\` | \`invoices:read\` | Tax invoices; XML, QR payload, hashes, and ZATCA response text are excluded |
| GET | \`/api/v1/subscription\` | \`subscription:read\` | System plan entitlement only; QIROX project expiry is available from the platform integration API |

List responses use \`{ data, count }\`; invoices additionally return \`page\` and \`limit\`. The maximum page size is 200. Invoice filtering is scoped to branches assigned to the API key's tenant.

## Project subscription

The QIROX project subscription is read separately from the generated system's plan entitlement:

\`GET /api/v1/projects/:projectId/subscription\`

Use a QIROX Project Integration API key in the Bearer header. It returns \`planTier\`, \`planSegment\`, \`period\`, \`startedAt\`, \`expiresAt\`, and \`status\`. It does not expose payment information or credentials.

Discovery for the generated system's own endpoints: \`GET /api/v1\`.
`);
  await fs.promises.writeFile(path.join(outputDir, "server", "qirox-site-control.ts"), `import type { Request, Response, NextFunction } from "express";

type SiteStatus = { suspended: boolean; message?: string | null; contactUrl?: string };
let cached: { value: SiteStatus; expiresAt: number } | null = null;
const CACHE_MS = 30_000;

async function readStatus(): Promise<SiteStatus> {
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const platform = String(process.env.QIROX_PLATFORM_URL || "").replace(/\\\\/+$/, "");
  const projectId = String(process.env.QIROX_PROJECT_ID || "");
  if (!platform || !projectId) return { suspended: false };
  try {
    const response = await fetch(\`\${platform}/api/public/projects/\${encodeURIComponent(projectId)}/site-status\`, {
      signal: AbortSignal.timeout(2500),
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error("QIROX site status unavailable");
    const value = await response.json() as SiteStatus;
    cached = { value, expiresAt: Date.now() + CACHE_MS };
    return value;
  } catch {
    // Fail open on platform connectivity loss to avoid taking customer sites
    // offline because the control plane is temporarily unreachable.
    return cached?.value || { suspended: false };
  }
}

export async function qiroxSiteControl(req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith("/api/") || req.path === "/api/health") return next();
  const status = await readStatus();
  if (!status.suspended) return next();
  res.status(503).json({
    error: "SITE_SUBSCRIPTION_SUSPENDED",
    message: status.message || "الموقع متوقف مؤقتًا. تواصل مع QIROX لمزيد من المعلومات.",
    contactUrl: status.contactUrl || "https://qiroxstudio.online/contact",
  });
}
`);
  const statusScript = `(()=>{const id=${JSON.stringify(projectId)};const url="https://qiroxstudio.online/api/public/projects/"+encodeURIComponent(id)+"/site-status";fetch(url,{cache:"no-store"}).then(r=>r.ok?r.json():null).then(s=>{if(!s||!s.suspended)return;document.documentElement.innerHTML="";const d=document.createElement("div");d.dir="rtl";d.style="min-height:100vh;display:grid;place-items:center;background:#f7f7f5;padding:24px;font-family:Arial,sans-serif";const c=document.createElement("main");c.style="max-width:560px;text-align:center;background:white;padding:40px;border:1px solid #e5e7eb;border-radius:20px;box-shadow:0 10px 35px #0001";const h=document.createElement("h1");h.textContent="الموقع متوقف مؤقتًا";h.style="font-size:24px";const p=document.createElement("p");p.textContent=s.message||"تواصل مع QIROX لمزيد من المعلومات.";p.style="line-height:1.9;color:#4b5563";const a=document.createElement("a");a.href=s.contactUrl||"https://qiroxstudio.online/contact";a.textContent="تواصل مع QIROX";a.style="display:inline-block;margin-top:16px;padding:12px 22px;background:#111;color:white;border-radius:10px;text-decoration:none";c.append(h,p,a);d.append(c);document.documentElement.append(d)}).catch(()=>{})})();`;
  const htmlPath = path.join(outputDir, "client", "index.html");
  let html = await fs.promises.readFile(htmlPath, "utf8");
  if (!html.includes("qirox-site-control.js")) {
    html = html.replace("</body>", '  <script src="/qirox-site-control.js" defer></script>\n  </body>');
  }
  await fs.promises.writeFile(htmlPath, html);
  await fs.promises.writeFile(path.join(outputDir, "public", "qirox-site-control.js"), statusScript);
}