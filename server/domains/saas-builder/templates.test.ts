import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { generateProject, listTemplates, validateBuilderConfig } from "./templates";
import { readGeneratedFiles } from "./deployment";
import {
  isDemoApiPath,
  isFeatureAvailable,
  isPlanManagementMutation,
} from "../../../services/saas-templates/blackrose/server/saas-policy";

const config = {
  businessName: "مطعم الاختبار",
  businessNameEn: "Test Restaurant",
  commercialRegNumber: "1010000000",
  taxNumber: "",
  commercialRegUrl: "",
  bankName: "",
  bankAccountName: "",
  iban: "",
  logoUrl: "",
  primaryColor: "#316a57",
  phone: "",
  address: "",
  websiteUrl: "",
};

test("all original restaurant systems are selectable and carry their full source tree", () => {
  const templates = listTemplates();
  assert.deepEqual(templates.map(({ id }) => id), ["cluny", "blackrose", "tasali", "chef-palace"]);
  assert.ok(templates.every((template) => template.available));
  assert.equal(templates[0].kind, "cafe");
  assert.equal(templates[2].kind, "restaurant");
});

test("every selectable template generates with the shared tenant build and secure owner setup", async () => {
  const libraryReadme = await fs.promises.readFile(path.resolve(process.cwd(), "services/saas-templates/README.md"), "utf8");
  assert.match(libraryReadme, /BOOTSTRAP_ADMIN_PASSWORD_HASH/);
  assert.match(libraryReadme, /optional 16-character fallback/);
  const temporary = await fs.promises.mkdtemp(path.join(os.tmpdir(), "saas-all-templates-"));
  try {
    for (const templateId of ["cluny", "blackrose", "tasali", "chef-palace"]) {
      const outputDir = path.join(temporary, templateId);
      const result = await generateProject({ templateId, config, tier: "pro", outputDir });
      assert.ok(result.fileCount > 100, `${templateId} source tree is complete`);
      execFileSync(process.execPath, [path.join(outputDir, "scripts/customize-tenant.mjs")], {
        env: { ...process.env, BUSINESS_CONFIG_JSON: JSON.stringify(config), PROJECT_PLAN_TIER: "pro" },
        cwd: outputDir,
        stdio: "pipe",
      });
      const packageJson = JSON.parse(await fs.promises.readFile(path.join(outputDir, "package.json"), "utf8"));
      const packageLock = JSON.parse(await fs.promises.readFile(path.join(outputDir, "package-lock.json"), "utf8"));
      assert.match(packageJson.scripts.dev, /customize-tenant\.mjs/, `${templateId} customizes dev startup`);
      assert.match(packageJson.scripts.build, /customize-tenant\.mjs/, `${templateId} customizes production build`);
      assert.match(await fs.promises.readFile(path.join(outputDir, "client/src/lib/brand.ts"), "utf8"), /nameEn: "Test Restaurant"/);
      if (templateId === "chef-palace") {
        assert.equal(packageJson.dependencies["@capacitor/cli"], "^7.6.9");
        assert.equal(packageLock.packages["node_modules/@capacitor/cli"].version, "7.6.9");
        assert.equal(packageLock.packages["node_modules/@capacitor/cli"].resolved, "https://registry.npmjs.org/@capacitor/cli/-/cli-7.6.9.tgz");
        assert.equal(packageLock.packages["node_modules/tar"].version, "7.5.22");
        assert.equal(packageLock.packages["node_modules/tar"].resolved, "https://registry.npmjs.org/tar/-/tar-7.5.22.tgz");
      }
      const setup = await fs.promises.readFile(path.join(outputDir, "docs", "SAAS-SETUP.md"), "utf8");
      assert.match(setup, /BOOTSTRAP_ADMIN_PASSWORD_HASH/, `${templateId} documents hash-based owner setup`);
      assert.match(setup, /preserving existing owner credentials/, `${templateId} documents existing-owner behavior`);
    }
  } finally {
    await fs.promises.rm(temporary, { recursive: true, force: true });
  }
});

test("builder validates customer config instead of accepting unsafe URLs", () => {
  assert.deepEqual(validateBuilderConfig(config, "pro"), []);
  assert.ok(validateBuilderConfig({ ...config, websiteUrl: "http://localhost:8000" }, "pro").length);
  assert.ok(validateBuilderConfig({ ...config, primaryColor: "red" }, "pro").length);
  assert.ok(validateBuilderConfig(config, "unknown").length);
});

test("tier middleware rejects direct URLs to features outside the paid plan", () => {
  const proPaths = [
    "/api/payments/init",
    "/api/payment-gateway/test",
    "/api/loyalty/cards",
    "/api/accounting/daily-summary",
    "/api/reports/sales",
  ];
  const infinityPaths = [
    "/api/inventory/stock",
    "/api/recipes/product/coffee-item",
    "/api/attendance/check-in",
    "/api/reports/unified",
    "/api/payroll/report",
  ];
  const litePaths = [
    "/api/menu",
    "/api/tables",
    "/api/pos/toggle",
    "/api/orders/live",
    "/api/kitchen/orders",
    "/api/print/discover",
  ];
  for (const endpoint of proPaths) {
    assert.equal(isFeatureAvailable(endpoint, "lite"), false, endpoint);
    assert.equal(isFeatureAvailable(endpoint, "pro"), true, endpoint);
  }
  for (const endpoint of infinityPaths) {
    assert.equal(isFeatureAvailable(endpoint, "lite"), false, endpoint);
    assert.equal(isFeatureAvailable(endpoint, "pro"), false, endpoint);
    assert.equal(isFeatureAvailable(endpoint, "infinity"), true, endpoint);
  }
  for (const endpoint of litePaths) {
    assert.equal(isFeatureAvailable(endpoint, "lite"), true, endpoint);
    assert.equal(isFeatureAvailable(endpoint, "pro"), true, endpoint);
  }
});

test("plan mutations cannot grant entitlements and demo API routes are not exposed", () => {
  assert.equal(isPlanManagementMutation("POST", "/api/admin/plan-features"), true);
  assert.equal(isPlanManagementMutation("PATCH", "/api/admin/settings/subscription"), true);
  assert.equal(isPlanManagementMutation("GET", "/api/plans"), false);
  assert.equal(isDemoApiPath("/api/admin/demo-orders"), true);
  assert.equal(isDemoApiPath("/api/admin/demo/seed"), true);
  assert.equal(isDemoApiPath("/api/orders/live"), false);
});

test("generation uses original React and Express source, with no seed credentials or archived assets", async () => {
  const temporary = await fs.promises.mkdtemp(path.join(os.tmpdir(), "saas-template-test-"));
  const outputDir = path.join(temporary, "generated");
  try {
    const result = await generateProject({ templateId: "blackrose", config, tier: "pro", outputDir });
    assert.equal(result.buildCommand, "npm ci --include=dev && npm run build");
    assert.equal(result.startCommand, "npm start");
    assert.ok(result.fileCount > 100);
    const uploadableFiles = await readGeneratedFiles(outputDir);
    assert.equal(uploadableFiles.length, result.fileCount, "all generated source files pass the GitHub upload safety checks");
    assert.ok(result.envVars.some((item) => item.key === "BOOTSTRAP_ADMIN_PASSWORD" && !item.required));
    assert.ok(result.envVars.some((item) => item.key === "BOOTSTRAP_ADMIN_PASSWORD_HASH" && item.required));
    assert.ok(result.envVars.some((item) => item.key === "MONGODB_URI" && item.required));

    const packageJson = JSON.parse(await fs.promises.readFile(path.join(outputDir, "package.json"), "utf8"));
    assert.ok(packageJson.dependencies.react);
    assert.ok(packageJson.dependencies.express);
    assert.match(packageJson.scripts.build, /--packages=external/);
    assert.match(packageJson.scripts.dev, /customize-tenant\.mjs/);
    const routeSource = await fs.promises.readFile(path.join(outputDir, "server/routes.ts"), "utf8");
    assert.ok(routeSource.length > 500_000, "the full original API route implementation is included");
    const indexSource = await fs.promises.readFile(path.join(outputDir, "server/index.ts"), "utf8");
    assert.match(indexSource, /bootstrapSaasTenant/);
    assert.match(indexSource, /saasFeatureGate/);
    assert.doesNotMatch(indexSource, /demo-tenant|BRCAFE10|TECH10|123456|dev-secret/);
    assert.match(indexSource, /SESSION_SECRET must contain at least 32 characters/);
    assert.match(indexSource, /MONGODB_URI must target this customer's own database/);
    assert.ok(!/(?<![\w.])TENANT_ID!/.test(routeSource), "bare tenant identifiers are bound to deployment configuration");
    assert.ok(/process\.env\.TENANT_ID!/.test(routeSource), "tenant lookup uses deployment configuration");
    assert.ok(!/process\.env\.process\.env\./.test(routeSource), "tenant binding must not double-prefix existing environment lookups");

    const relativePaths: string[] = [];
    const visit = async (directory: string) => {
      for (const entry of await fs.promises.readdir(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isSymbolicLink()) assert.fail(`unexpected symlink: ${fullPath}`);
        if (entry.isDirectory()) await visit(fullPath);
        else relativePaths.push(path.relative(outputDir, fullPath).split(path.sep).join("/"));
      }
    };
    await visit(outputDir);
    assert.ok(relativePaths.some((file) => file.endsWith("manifest.webmanifest")));
    assert.ok(relativePaths.some((file) => file.endsWith("tenant-mark.svg")));
    assert.ok(relativePaths.every((file) => !/(^|\/)(?:node_modules|dist|uploads|attached_assets|\.env(?:\.|$)|.*\.(?:pem|key|p12|pfx|db|sqlite|zip|tar|gz|mov|mp4))$/i.test(file)));
    const placeholders = relativePaths.filter((file) => /template-placeholders/.test(file));
    for (const file of placeholders) assert.ok((await fs.promises.stat(path.join(outputDir, file))).size < 2048);
    const bootstrap = await fs.promises.readFile(path.join(outputDir, "server/saas-bootstrap.ts"), "utf8");
    assert.match(bootstrap, /BOOTSTRAP_ADMIN_PASSWORD/);
    assert.match(bootstrap, /\$setOnInsert/);
    assert.doesNotMatch(bootstrap, /QIROX|demo-tenant|123456/);
    assert.doesNotMatch(await fs.promises.readFile(path.join(outputDir, "shared/schema.ts"), "utf8"), /demo-tenant/);
    assert.doesNotMatch(await fs.promises.readFile(path.join(outputDir, "client/src/pages/manager-tables.tsx"), "utf8"), /demo-tenant/);
    assert.equal(await fs.promises.access(path.join(outputDir, "server/vercel-entry.ts")).then(() => true, () => false), false);
  } finally {
    await fs.promises.rm(temporary, { recursive: true, force: true });
  }
});