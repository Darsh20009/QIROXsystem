import fs from "node:fs/promises";
import path from "node:path";
import { OrderSpecsModel, SaasBuilderModel, SandboxProjectModel, ProjectIntegrationModel } from "../../models";
import { inspectProjectDatabaseUri } from "./model";
import { createProjectIntegrationSecret, projectIntegrationApiPath, projectIntegrationDocsPath } from "../../project-integrations";
import crypto from "node:crypto";

/** Import only missing private values; never return credentials to the browser. */
const environmentSyncs = new Map<string, Promise<number>>();
export function synchronizeSaasWorkspace(workspace: any): Promise<number> {
  const key = String(workspace._id);
  if (environmentSyncs.has(key)) return environmentSyncs.get(key)!;
  const operation = importSaasEnvironment(workspace).finally(() => environmentSyncs.delete(key));
  environmentSyncs.set(key, operation);
  return operation;
}
async function importSaasEnvironment(workspace: any): Promise<number> {
  if (!workspace.sourceProjectId || !workspace.sourceOrderId) return 0;
  const builder: any = await SaasBuilderModel.findOne({ projectId: workspace.sourceProjectId }).select("+credentials").lean();
  if (!builder?.templateId) return 0;
  const specs: any = await OrderSpecsModel.findOne({ orderId: workspace.sourceOrderId }).select("+databaseUri").lean();
  const database = inspectProjectDatabaseUri(specs?.databaseUri, process.env.MONGODB_URI, OrderSpecsModel.db.name);
  if (!database.valid || database.sameAsPlatform) {
    throw new Error("اربط قاعدة بيانات مخصصة وصالحة في منشئ النظام قبل تشغيله");
  }
  const { buildOneTimeDeploymentEnvelope } = await import("./routes");
  const { persistMissingSandboxEnvironment } = await import("../../sandbox-routes");
  const { SandboxEnvVarModel } = await import("../../models");
  const docs = await SandboxEnvVarModel.find({ projectId: workspace._id }).select("key").lean();
  const existing = new Set(docs.map((doc: any) => doc.key));
  const integrationEnv: Record<string, string> = {};
  for (const [enabled, channel] of [[builder.config?.customerWhatsappRegistration, "whatsapp"], [builder.config?.notificationEmail, "email"]] as const) {
    const key = `QIROX_${channel.toUpperCase()}_API_KEY`;
    if (!enabled || existing.has(key)) continue;
    const secret = createProjectIntegrationSecret(channel);
    const apiPath = projectIntegrationApiPath(String(workspace.sourceOrderId), channel);
    await ProjectIntegrationModel.create({
      orderId: workspace.sourceOrderId, projectId: workspace.sourceProjectId,
      type: channel, environment: "development", label: "SaaS workspace",
      keyHash: secret.keyHash, keyPrefix: secret.keyPrefix,
      publicIdentifier: `qrx_${channel}_${crypto.randomUUID()}`,
      apiBasePath: apiPath, documentationPath: projectIntegrationDocsPath(),
      createdBy: workspace.ownerId,
    });
    integrationEnv[key] = secret.rawKey;
    integrationEnv[`QIROX_${channel.toUpperCase()}_API_PATH`] = apiPath;
  }
  if (process.env.QIROX_PLATFORM_URL) integrationEnv.QIROX_PLATFORM_URL = process.env.QIROX_PLATFORM_URL;
  const items = buildOneTimeDeploymentEnvelope({
    envRequirements: builder.build?.envRequirements?.length ? builder.build.envRequirements : [
      { key: "SESSION_SECRET", required: true, description: "Session" },
      { key: "BOOTSTRAP_ADMIN_PASSWORD", required: true, description: "Owner" },
    ],
    projectId: String(workspace.sourceProjectId), tier: builder.tier,
    config: builder.config, databaseUri: specs.databaseUri,
    access: builder.credentials, integrationEnv,
  });
  const base = `/sandbox/${workspace._id}/preview`;
  const values = Object.fromEntries(items.filter(item => item.value !== undefined).map(item => [item.key, item.value!]));
  const config = JSON.parse(values.BUSINESS_CONFIG_JSON);
  for (const field of ["logoUrl", "heroImageUrl", "splashImageUrl"]) if (config[field]?.startsWith("/")) config[field] = base + config[field];
  values.BUSINESS_CONFIG_JSON = JSON.stringify(config);
  values.SANDBOX_PREVIEW_BASE = base;
  values.VITE_SANDBOX_PREVIEW_BASE = base;
  await ensurePreviewCompatibility(String(workspace._id));
  return persistMissingSandboxEnvironment(workspace._id, values, ["BUSINESS_CONFIG_JSON"]);
}

async function ensurePreviewCompatibility(projectId: string) {
  const { getProjectDir } = await import("../../sandbox-fs");
  const directory = getProjectDir(projectId);
  const mainPath = path.join(directory, "client/src/main.tsx");
  const main = await fs.readFile(mainPath, "utf8").catch(() => null);
  if (!main || main.includes("QiroxPreviewRouter")) return;
  // Only migrate the known generated native template; do not transform arbitrary repositories.
  const generated = await fs.stat(path.join(directory, "scripts/customize-tenant.mjs")).then(() => true, () => false);
  if (!generated || !main.includes("maybeWipeClientStorage") || !main.includes("<App />")) return;
  const canonical = await fs.readFile(path.resolve("services/saas-templates/cluny/client/src/main.tsx"), "utf8");
  const support = canonical.slice(canonical.indexOf("const previewBase ="), canonical.indexOf("// ── One-time"));
  const patchedMain = `import { Router as QiroxPreviewRouter } from "wouter";\n${support}\n` + main
    .replace("<App />", "<QiroxPreviewRouter base={previewBase}><App /></QiroxPreviewRouter>")
    .replace("(function maybeWipeClientStorage() {", "(function maybeWipeClientStorage() {\n  if (previewBase) return;")
    .replace("if (import.meta.env.DEV &&", "if (!previewBase && import.meta.env.DEV &&")
    .replace("if (import.meta.env.PROD &&", "if (!previewBase && import.meta.env.PROD &&");
  const vitePath = path.join(directory, "vite.config.ts");
  const vite = await fs.readFile(vitePath, "utf8");
  const patchedVite = vite.includes("SANDBOX_PREVIEW_BASE") ? vite : vite.replace("defineConfig({", 'defineConfig({\n  base: process.env.SANDBOX_PREVIEW_BASE ? `${process.env.SANDBOX_PREVIEW_BASE}/` : "/",');
  const backup = path.join(path.dirname(directory), ".preview-support-backups", `${projectId}-${Date.now()}`);
  await fs.mkdir(backup, { recursive: true });
  await fs.writeFile(path.join(backup, "main.tsx"), main);
  await fs.writeFile(path.join(backup, "vite.config.ts"), vite);
  const { SandboxFileModel } = await import("../../models");
  for (const [relative, content] of [["client/src/main.tsx", patchedMain], ["vite.config.ts", patchedVite]]) {
    await fs.writeFile(path.join(directory, relative), content);
    await SandboxFileModel.updateOne({ projectId, path: relative }, { $set: { type: "file", content, size: Buffer.byteLength(content), syncedAt: new Date() } }, { upsert: true });
  }
}

export async function prepareSaasRuntimeWorkspace(input: { order: any; project: any; builder: any; ownerId: any }) {
  const { getProjectDir } = await import("../../sandbox-fs");
  const { syncDiskToDb } = await import("../../sandbox-routes");
  const { generateProject } = await import("./templates");
  const { localBuilderImage } = await import("./config");
  const workspace: any = await SandboxProjectModel.findOneAndUpdate(
    { sourceProjectId: input.project._id },
    { $set: { sourceOrderId: input.order._id }, $setOnInsert: {
      sourceProjectId: input.project._id,
      ownerId: input.ownerId, name: input.builder.config.businessName,
      template: "blank", runtime: "node", entryFile: "server/index.ts",
      installCmd: "npm install", startCmd: "npm run dev", buildCmd: "npm run build", status: "stopped",
      githubRepo: input.project.repoUrl || "",
    } }, { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  const directory = getProjectDir(String(workspace._id));
  // Never overwrite an existing edited workspace just to open a preview.
  const hasCode = await fs.stat(path.join(directory, "package.json")).then(() => true, () => false);
  if (!hasCode) {
    const entries = await fs.readdir(directory).catch(() => []);
    if (entries.some(entry => entry !== ".git")) throw new Error("مساحة العمل تحتوي على ملفات؛ لن يتم استبدال تعديلاتك تلقائيًا");
    await generateProject({
      templateId: input.builder.templateId, tier: input.builder.tier,
      config: input.builder.config, outputDir: directory,
      logoPath: localBuilderImage(input.builder.config.logoUrl),
      heroPath: localBuilderImage(input.builder.config.heroImageUrl),
      splashPath: localBuilderImage(input.builder.config.splashImageUrl),
    });
  }
  await synchronizeSaasWorkspace(workspace);
  await syncDiskToDb(String(workspace._id), workspace._id);
  return { workspaceId: String(workspace._id), workspaceUrl: `/employee/system-builder/${workspace._id}?orderId=${input.order._id}&run=1`, existingCodePreserved: hasCode };
}