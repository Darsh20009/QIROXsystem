import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { build } from "esbuild";
import { inheritedBuilderConfig, safeLocalUploadUrl } from "./config";
import { extractLogoPalette } from "./logos";
import { generateProject } from "./templates";
import { buildOneTimeDeploymentEnvelope, normalizeBuilderConfig } from "./routes";
import { hasSaasExtraFeature } from "../../../services/saas-templates/runtime/saas-extra-features";
import { SaasBuilderModel } from "../../models";
import { checkNativeCustomerAuth } from "./native-auth-check";

test("registration data is inherited; explicit saved overrides including cleared fields win", () => {
  const result = inheritedBuilderConfig({ prefillVersion: 2, config: { taxNumber: "", businessName: "Saved" } }, {
    wizardData: { businessName: "Original", commercialReg: "1010000000", taxNumber: "Old", logoFile: { url: "/uploads/logo.png" }, whatsapp: "0500000000" },
  }, {});
  assert.equal(result.businessName, "Saved");
  assert.equal(result.taxNumber, "");
  assert.equal(result.commercialRegNumber, "1010000000");
  assert.equal(result.logoUrl, "/uploads/logo.png");
  assert.equal(safeLocalUploadUrl("/uploads/../private.png"), false);
  assert.equal(safeLocalUploadUrl("/uploads/%2e%2e/private.png"), false);
  assert.equal(inheritedBuilderConfig({ config: { taxNumber: "" } }, { wizardData: { taxNumber: "Inherited" } }, {}).taxNumber, "Inherited");
  const splash = normalizeBuilderConfig({
    splashEnabled: true, splashImageUrl: "/uploads/splash.png", splashBackgroundColor: "#345678",
    splashImageFit: "cover", splashDurationMs: 2000, splashTitle: "QA splash title", splashSubtitle: "Welcome",
  });
  const reread = normalizeBuilderConfig(inheritedBuilderConfig({ prefillVersion: 2, config: splash }, {}, {}));
  for (const key of ["splashEnabled", "splashImageUrl", "splashBackgroundColor", "splashImageFit", "splashDurationMs", "splashTitle", "splashSubtitle"] as const) assert.equal(reread[key], splash[key]);
  const disabled = normalizeBuilderConfig(inheritedBuilderConfig({ prefillVersion: 2, config: { ...splash, splashEnabled: false, splashImageUrl: "", splashTitle: "", splashDurationMs: 0 } }, {}, {}));
  assert.equal(disabled.splashEnabled, false);
  assert.equal(disabled.splashImageUrl, "");
  assert.equal(disabled.splashTitle, "");
  assert.equal(disabled.splashDurationMs, 0);
});

test("palette extraction uses the real logo pixels", async () => {
  const image = await sharp({ create: { width: 32, height: 32, channels: 4, background: "#237747" } }).png().toBuffer();
  const palette = await extractLogoPalette(image);
  assert.match(palette.primaryColor, /^#[0-9a-f]{6}$/i);
  assert.notEqual(palette.primaryColor, "#2563eb");
});

test("free extras are catalog-limited and never open plan-management routes", () => {
  const config = normalizeBuilderConfig({ extraFeatures: ["inventory", "inventory", "arbitrary-admin"] });
  assert.deepEqual(config.extraFeatures, ["inventory"]);
  assert.equal(hasSaasExtraFeature("/api/inventory", config), true);
  assert.equal(hasSaasExtraFeature("/api/accounting", config), false);
  assert.equal(hasSaasExtraFeature("/api/subscription/upgrade", config), false);
  assert.equal(SaasBuilderModel.schema.path("credentials").options.select, false);
});

test("generated customization reaches brand, hero, receipts, OTP page and server gates without changing the tier", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "saas-enhancement-"));
  try {
    const output = path.join(directory, "project");
    const image = path.join(directory, "image.png");
    await sharp({ create: { width: 32, height: 32, channels: 4, background: "#237747" } }).png().toFile(image);
    const config = normalizeBuilderConfig({
      businessName: "Test Business", businessNameEn: "Test Business", commercialRegNumber: "1010000000",
      logoUrl: "/uploads/image.png", heroImageUrl: "/uploads/image.png", primaryColor: "#237747", secondaryColor: "#c9a060",
      splashEnabled: true, splashImageUrl: "/uploads/image.png", splashBackgroundColor: "#123456",
      splashTitle: "أهلاً", splashSubtitle: "مرحباً بك", splashImageFit: "cover", splashDurationMs: 2000,
      extraFeatures: ["inventory"], customerWhatsappRegistration: true, notificationEmail: true,
    });
    const generated = await generateProject({ templateId: "cluny", tier: "lite", config, outputDir: output, logoPath: image, heroPath: image, splashPath: image });
    assert.equal(generated.envVars.find(item => item.key === "BOOTSTRAP_ADMIN_PASSWORD")?.required, false);
    assert.equal(generated.envVars.find(item => item.key === "BOOTSTRAP_ADMIN_PASSWORD_HASH")?.required, true);
    const generatedPackage = JSON.parse(await fs.readFile(path.join(output, "package.json"), "utf8"));
    assert.equal(generatedPackage.name, "restaurant-test-business");
    assert.match(generatedPackage.scripts.dev, /customize-tenant\.mjs/);
    const envelope = buildOneTimeDeploymentEnvelope({
      envRequirements: generated.envVars, config, projectId: "test-tenant", tier: "lite",
      databaseUri: "mongodb://example.invalid/test_tenant",
      access: { adminPasswordHash: "test-hash", staffPasswordHash: "test-staff-hash" },
    });
    assert.equal(envelope.find(item => item.key === "BOOTSTRAP_ADMIN_PASSWORD")?.value, undefined);
    const deploymentConfig = envelope.find(item => item.key === "BUSINESS_CONFIG_JSON")!.value!;
    execFileSync(process.execPath, [path.join(output, "scripts/customize-tenant.mjs")], {
      env: { ...process.env, BUSINESS_CONFIG_JSON: deploymentConfig, PROJECT_PLAN_TIER: "lite" }, cwd: output, stdio: "pipe",
    });
    assert.equal(JSON.parse(await fs.readFile(path.join(output, "entitlements.json"), "utf8")).tier, "lite");
    assert.match(await fs.readFile(path.join(output, "client/src/lib/brand.ts"), "utf8"), /tenant-logo\.png/);
    const html = await fs.readFile(path.join(output, "client/index.html"), "utf8");
    assert.match(html, /tenant-splash\.png/);
    assert.match(html, /qirox-startup-splash/);
    assert.match(html, /#123456/);
    assert.match(await fs.readFile(path.join(output, "client/src/main.tsx"), "utf8"), /qirox:app-ready/);
    assert.ok((await fs.stat(path.join(output, "client/public/tenant-splash.png"))).size > 0);
    execFileSync(process.execPath, [path.join(output, "scripts/customize-tenant.mjs")], {
      env: { ...process.env, BUSINESS_CONFIG_JSON: deploymentConfig, PROJECT_PLAN_TIER: "lite" }, cwd: output, stdio: "pipe",
    });
    assert.equal((await fs.readFile(path.join(output, "client/index.html"), "utf8")).match(/qirox-splash:start/g)?.length, 1);
    assert.equal((await fs.readFile(path.join(output, "client/src/main.tsx"), "utf8")).match(/qirox-splash-ready:start/g)?.length, 1);
    assert.match(await fs.readFile(path.join(output, "client/src/pages/menu.tsx"), "utf8"), /tenant-hero\.png/);
    assert.match(await fs.readFile(path.join(output, "client/src/pages/order-receipt.tsx"), "utf8"), /src=\{brand.logoCustomer\}/);
    assert.match(await fs.readFile(path.join(output, "client/src/pages/customer-login.tsx"), "utf8"), /qirox-customer-access/);
    assert.match(await fs.readFile(path.join(output, "client/src/pages/CustomerAuth.tsx"), "utf8"), /qirox-customer-access/);
    assert.match(await fs.readFile(path.join(output, "client/src/components/customer-auth-modal.tsx"), "utf8"), /mode !== "guest"/);
    assert.match(await fs.readFile(path.join(output, "server/index.ts"), "utf8"), /registerSaasServices\(app\)/);
    assert.match(await fs.readFile(path.join(output, "server/saas-policy.ts"), "utf8"), /!hasSaasExtraFeature/);
    const bootstrap = await fs.readFile(path.join(output, "server/saas-bootstrap.ts"), "utf8");
    assert.match(bootstrap, /findOne\(\{ tenantId, username: \{ \$regex: "\^owner\$"/);
    assert.match(bootstrap, /if \(!owner\)/);
    assert.doesNotMatch(bootstrap, /countDocuments\(\{ tenantId \}\)/);
    assert.doesNotMatch(await fs.readFile(path.join(output, "server/index.ts"), "utf8"), /BOOTSTRAP_ADMIN_PASSWORD must contain at least 16 characters/);
    const brandedFiles = [
      "client/index.html",
      "client/src/pages/employee-login.tsx",
      "client/src/pages/employee-forgot-password.tsx",
      "client/src/pages/welcome.tsx",
      "client/src/pages/user-guide.tsx",
      "client/public/manifest.webmanifest",
      "server/mail-service.ts",
      "docs/SAAS-SETUP.md",
    ];
    for (const file of brandedFiles) {
      const text = await fs.readFile(path.join(output, file), "utf8");
      assert.doesNotMatch(text, /\b(?:CLUNY|Cluny|Restaurant)\b|كلوني/, `${file} retains source-template branding`);
    }
    await assert.rejects(fs.stat(path.join(output, "client/src/assets/template-placeholders/cluny-logo-customer.png")), { code: "ENOENT" });
    assert.ok(generated.envVars.some(item => item.key === "QIROX_WHATSAPP_API_KEY"));
    await build({ entryPoints: [path.join(output, "client/src/components/qirox-customer-access.tsx")], bundle: true, write: false, platform: "browser", packages: "external", alias: { "@": path.join(output, "client/src") }, logLevel: "silent" });
    await build({ entryPoints: [path.join(output, "client/src/components/customer-auth-modal.tsx")], bundle: true, write: false, platform: "browser", packages: "external", alias: { "@": path.join(output, "client/src") }, logLevel: "silent" });
    await build({ entryPoints: [path.join(output, "client/src/App.tsx")], bundle: true, write: false, platform: "browser", packages: "external", alias: { "@": path.join(output, "client/src"), "@shared": path.join(output, "shared"), "@assets": path.join(output, "attached_assets") }, loader: { ".png": "dataurl", ".jpg": "dataurl", ".jpeg": "dataurl", ".webp": "dataurl", ".gif": "dataurl", ".svg": "dataurl", ".mp3": "dataurl", ".woff": "dataurl", ".woff2": "dataurl", ".ttf": "dataurl" }, logLevel: "silent" });
    await build({ entryPoints: [path.join(output, "server/saas-services.ts")], bundle: true, write: false, platform: "node", packages: "external", logLevel: "silent" });
    await checkNativeCustomerAuth(output);
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});