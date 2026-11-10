import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readGeneratedFiles, type GeneratedFile } from "./deployment";

const ARTIFACT_TTL_MS = 60 * 60 * 1000;
const ARTIFACT_ROOT = path.join(os.tmpdir(), "qirox-saas-builder-delivery");

export type GeneratedBuildInfo = {
  buildCommand: string;
  startCommand: string;
  envVars: Array<{ key: string; required: boolean; description: string }>;
  warnings: string[];
  fileCount: number;
};

export type PreparedArtifact = {
  artifactId: string;
  orderId: string;
  projectId: string;
  outputDir: string;
  zipPath: string;
  templateId: string;
  tier: string;
  configFingerprint: string;
  expiresAt: number;
  generated: GeneratedBuildInfo;
};

const artifacts = new Map<string, PreparedArtifact>();
const projectArtifacts = new Map<string, string>();
const expiryTimers = new Map<string, ReturnType<typeof setTimeout>>();

function publicArtifact(artifact: PreparedArtifact) {
  return {
    artifactId: artifact.artifactId,
    fileCount: artifact.generated.fileCount,
    expiresAt: new Date(artifact.expiresAt).toISOString(),
  };
}

function scheduleExpiry(artifact: PreparedArtifact) {
  const timer = setTimeout(() => {
    void removePreparedArtifact(artifact.artifactId);
  }, Math.max(0, artifact.expiresAt - Date.now()));
  timer.unref?.();
  expiryTimers.set(artifact.artifactId, timer);
}

async function writeZip(files: GeneratedFile[], zipPath: string) {
  const archiver = (await import("archiver")).default("zip", { zlib: { level: 6 } });
  const output = fs.createWriteStream(zipPath, { flags: "wx" });

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      archive.abort();
      output.destroy();
      reject(error instanceof Error ? error : new Error(String(error)));
    };
    output.once("close", () => {
      if (settled) return;
      settled = true;
      resolve();
    });
    output.once("error", fail);
    archiver.once("error", fail);
    archiver.on("warning", fail);
    archiver.pipe(output);
    for (const file of files) archiver.append(file.content, { name: file.path });
    void archiver.finalize().catch(fail);
  });
}

export async function createPreparedArtifact(input: {
  orderId: string;
  projectId: string;
  outputDir: string;
  templateId: string;
  tier: string;
  configFingerprint: string;
  generated: GeneratedBuildInfo;
}) {
  await fs.promises.mkdir(ARTIFACT_ROOT, { recursive: true });
  const artifactId = crypto.randomBytes(32).toString("base64url");
  const outputDir = path.join(ARTIFACT_ROOT, `${artifactId}.source`);
  const zipPath = path.join(ARTIFACT_ROOT, `${artifactId}.zip`);

  await fs.promises.rename(input.outputDir, outputDir);
  let files: GeneratedFile[] = [];
  try {
    files = await readGeneratedFiles(outputDir);
    await writeZip(files, zipPath);
  } catch (error) {
    await Promise.all([
      fs.promises.rm(outputDir, { recursive: true, force: true }),
      fs.promises.rm(zipPath, { force: true }),
    ]);
    throw error;
  }

  const previousId = projectArtifacts.get(input.projectId);
  if (previousId) await removePreparedArtifact(previousId);

  const artifact: PreparedArtifact = {
    artifactId,
    orderId: input.orderId,
    projectId: input.projectId,
    outputDir,
    zipPath,
    templateId: input.templateId,
    tier: input.tier,
    configFingerprint: input.configFingerprint,
    expiresAt: Date.now() + ARTIFACT_TTL_MS,
    generated: { ...input.generated, fileCount: files.length },
  };
  artifacts.set(artifactId, artifact);
  projectArtifacts.set(input.projectId, artifactId);
  scheduleExpiry(artifact);
  return publicArtifact(artifact);
}

export async function getPreparedArtifact(artifactId: string, projectId: string, orderId: string) {
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(artifactId)) return null;
  const artifact = artifacts.get(artifactId);
  if (!artifact) return null;
  if (artifact.expiresAt <= Date.now()) {
    await removePreparedArtifact(artifactId);
    return null;
  }
  if (artifact.projectId !== projectId || artifact.orderId !== orderId) return null;
  return artifact;
}

export async function getLatestPreparedArtifact(projectId: string, orderId: string) {
  const artifactId = projectArtifacts.get(projectId);
  if (!artifactId) return null;
  const artifact = await getPreparedArtifact(artifactId, projectId, orderId);
  return artifact ? publicArtifact(artifact) : null;
}

export async function removeLatestPreparedArtifact(projectId: string, orderId: string) {
  const artifactId = projectArtifacts.get(projectId);
  if (!artifactId) return;
  const artifact = await getPreparedArtifact(artifactId, projectId, orderId);
  if (artifact) await removePreparedArtifact(artifactId);
}

export async function removePreparedArtifact(artifactId: string) {
  const artifact = artifacts.get(artifactId);
  if (!artifact) return;
  artifacts.delete(artifactId);
  if (projectArtifacts.get(artifact.projectId) === artifactId) projectArtifacts.delete(artifact.projectId);
  const timer = expiryTimers.get(artifactId);
  if (timer) clearTimeout(timer);
  expiryTimers.delete(artifactId);
  await Promise.all([
    fs.promises.rm(artifact.outputDir, { recursive: true, force: true }),
    fs.promises.rm(artifact.zipPath, { force: true }),
  ]);
}