import fs from "fs";
import path from "path";
import crypto from "crypto";
import { githubFetch } from "../../github-repositories";

const STARTER_PATHS = new Set([
  ".gitignore", "README.md", "index.html", "docs/PROJECT_BRIEF.md",
  "docs/DELIVERY_CHECKLIST.md", "src/project-config.js", "public/qirox-icon.png",
]);
const INLINE_TEXT_FILE_LIMIT = 128 * 1024;
export const MAX_GITHUB_TREE_REQUEST_BYTES = 1024 * 1024;
const MAX_GITHUB_TREE_ENTRIES_PER_REQUEST = 1000;
export const GITHUB_BLOB_UPLOAD_INTERVAL_MS = 1100;

export type GeneratedFile = { path: string; content: Buffer; encoding: "utf-8" | "base64" };
export type GitHubTreeWriteEntry = {
  path: string;
  mode: string;
  type: "blob";
  sha?: string | null;
  content?: string;
};

export function classifyGeneratedFileEncoding(content: Buffer): "utf-8" | "base64" {
  if (content.includes(0)) return "base64";
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(content);
    return "utf-8";
  } catch {
    return "base64";
  }
}

export function planGitHubTreeWrites(
  currentFiles: Array<{ path?: unknown; mode?: unknown }>,
  files: GeneratedFile[],
): { entries: GitHubTreeWriteEntry[]; blobFiles: GeneratedFile[] } {
  const generatedPaths = new Set(files.map(file => file.path));
  const entries: GitHubTreeWriteEntry[] = currentFiles
    .filter(entry => !generatedPaths.has(String(entry.path || "")))
    .map(entry => ({
      path: String(entry.path),
      mode: String(entry.mode || "100644"),
      type: "blob" as const,
      sha: null,
    }));
  const blobFiles: GeneratedFile[] = [];

  for (const file of files) {
    if (file.encoding === "utf-8" && file.content.byteLength <= INLINE_TEXT_FILE_LIMIT) {
      entries.push({
        path: file.path,
        mode: "100644",
        type: "blob",
        content: file.content.toString("utf-8"),
      });
    } else {
      blobFiles.push(file);
    }
  }
  return { entries, blobFiles };
}

export function chunkGitHubTreeWrites(entries: GitHubTreeWriteEntry[]): GitHubTreeWriteEntry[][] {
  const baseTree = "0".repeat(40);
  const requestOverhead = Buffer.byteLength(JSON.stringify({ base_tree: baseTree, tree: [] }), "utf-8");
  const chunks: GitHubTreeWriteEntry[][] = [];
  let current: GitHubTreeWriteEntry[] = [];
  let currentBytes = requestOverhead;

  for (const entry of entries) {
    const entryBytes = Buffer.byteLength(JSON.stringify(entry), "utf-8");
    const commaBytes = current.length ? 1 : 0;
    const exceedsLimit = currentBytes + commaBytes + entryBytes > MAX_GITHUB_TREE_REQUEST_BYTES;
    const exceedsCount = current.length >= MAX_GITHUB_TREE_ENTRIES_PER_REQUEST;
    if (current.length && (exceedsLimit || exceedsCount)) {
      chunks.push(current);
      current = [];
      currentBytes = requestOverhead;
    }
    if (currentBytes + (current.length ? 1 : 0) + entryBytes > MAX_GITHUB_TREE_REQUEST_BYTES) {
      throw new Error("A generated GitHub tree entry exceeds the safe request size");
    }
    current.push(entry);
    currentBytes += (current.length > 1 ? 1 : 0) + entryBytes;
  }
  if (current.length) chunks.push(current);
  return chunks;
}

export async function createGitHubBlobTreeEntries(
  files: GeneratedFile[],
  assertLease: () => Promise<void>,
  createBlob: (file: GeneratedFile) => Promise<string>,
  pause: (milliseconds: number) => Promise<void> = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)),
): Promise<GitHubTreeWriteEntry[]> {
  const entries: GitHubTreeWriteEntry[] = [];
  for (let index = 0; index < files.length; index++) {
    await assertLease();
    const file = files[index];
    const sha = await createBlob(file);
    if (!sha) throw new Error("GitHub did not return a blob for a generated file");
    entries.push({ path: file.path, mode: "100644", type: "blob", sha });
    if (index < files.length - 1) await pause(GITHUB_BLOB_UPLOAD_INTERVAL_MS);
  }
  return entries;
}

export function parseCanonicalGitHubRepository(rawUrl: unknown): { owner: string; name: string } | null {
  const value = String(rawUrl || "").trim();
  const match = value.match(/^(?:https:\/\/github\.com\/|git@github\.com:)([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/i);
  if (!match || match[1].includes("..") || match[2].includes("..")) return null;
  return { owner: match[1], name: match[2].replace(/\.git$/i, "") };
}

function safeGeneratedPath(raw: string): string {
  const normalized = raw.replace(/\\/g, "/");
  if (!normalized || normalized.startsWith("/") || normalized.split("/").some((part) => !part || part === "." || part === ".." || part === ".git" || part === "node_modules")) {
    throw new Error("Generated template contains an unsafe file path");
  }
  if (/^\.env(?:\.|$)/i.test(normalized) || /(^|\/)(?:id_rsa|.*\.(?:pem|key|p12|pfx))$/i.test(normalized)) {
    throw new Error("Generated template contains a prohibited secret file");
  }
  return normalized;
}

export async function readGeneratedFiles(outputDir: string): Promise<GeneratedFile[]> {
  const root = path.resolve(outputDir);
  const files: GeneratedFile[] = [];
  const visit = async (directory: string) => {
    for (const entry of await fs.promises.readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      const relative = safeGeneratedPath(path.relative(root, absolute));
      if (entry.isSymbolicLink()) throw new Error("Generated template contains a symbolic link");
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile()) {
        const content = await fs.promises.readFile(absolute);
        const encoding = classifyGeneratedFileEncoding(content);
        const text = encoding === "utf-8" ? content.toString("utf8") : "";
        if (text && /mongodb(?:\+srv)?:\/\/[^/\s:@]+:[^@\s]+@/i.test(text)) {
          throw new Error("Generated template unexpectedly contains database credentials");
        }
        files.push({ path: relative, content, encoding });
      }
    }
  };
  await visit(root);
  if (!files.length) throw new Error("Generated template produced no files");
  if (files.length > 3000) throw new Error("Generated template produced too many files");
  return files;
}

export async function replaceRepositoryContents(input: {
  token: string;
  repositoryUrl: string;
  outputDir: string;
  replaceExisting: boolean;
  assertLease: () => Promise<void>;
}): Promise<{ branch: string; commitSha: string; backupRef: string; fileCount: number }> {
  const repository = parseCanonicalGitHubRepository(input.repositoryUrl);
  if (!repository) throw new Error("المستودع المرتبط بالمشروع غير صالح");
  const owner = encodeURIComponent(repository.owner);
  const name = encodeURIComponent(repository.name);
  const base = `/repos/${owner}/${name}`;
  const [remote, files] = await Promise.all([
    githubFetch(base, input.token),
    readGeneratedFiles(input.outputDir),
  ]);
  const branch = String(remote.default_branch || "");
  if (!branch) throw new Error("تعذر تحديد الفرع الافتراضي للمستودع");
  const ref = await githubFetch(`${base}/git/ref/heads/${encodeURIComponent(branch)}`, input.token);
  const parentSha = String(ref.object?.sha || "");
  if (!parentSha) throw new Error("لم يتم العثور على Commit صالح في المستودع");
  const parentCommit = await githubFetch(`${base}/git/commits/${encodeURIComponent(parentSha)}`, input.token);
  const baseTree = String(parentCommit.tree?.sha || "");
  if (!baseTree) throw new Error("تعذر قراءة شجرة ملفات المستودع");
  const currentTree = await githubFetch(`${base}/git/trees/${encodeURIComponent(baseTree)}?recursive=1`, input.token);
  if (currentTree.truncated) throw new Error("تعذر التحقق من كامل محتوى المستودع");
  const currentFiles = (currentTree.tree || []).filter((entry: any) => entry.type === "blob");
  const nonStarter = currentFiles.some((entry: any) => !STARTER_PATHS.has(String(entry.path || "")));
  if (nonStarter && !input.replaceExisting) {
    const error: any = new Error("المستودع يحتوي على أكواد سابقة؛ يلزم تأكيد الاستبدال");
    error.status = 409;
    error.code = "needsConfirmation";
    throw error;
  }

  await input.assertLease();
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const backupRef = `qirox-backups/saas-builder-${timestamp}-${parentSha.slice(0, 10)}-${crypto.randomBytes(3).toString("hex")}`;
  await githubFetch(`${base}/git/refs`, input.token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ref: `refs/heads/${backupRef}`, sha: parentSha }),
  });
  await input.assertLease();

  const { entries: treeEntries, blobFiles } = planGitHubTreeWrites(currentFiles, files);
  const blobEntries = await createGitHubBlobTreeEntries(blobFiles, input.assertLease, async file => {
    const blob = await githubFetch(`${base}/git/blobs`, input.token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: file.content.toString("base64"), encoding: "base64" }),
    });
    return String(blob.sha || "");
  });
  treeEntries.push(...blobEntries);
  let treeSha = baseTree;
  for (const treeBatch of chunkGitHubTreeWrites(treeEntries)) {
    await input.assertLease();
    const tree = await githubFetch(`${base}/git/trees`, input.token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base_tree: treeSha, tree: treeBatch }),
    });
    treeSha = String(tree.sha || "");
    if (!treeSha) throw new Error("GitHub did not return the updated project tree");
  }
  const commit = await githubFetch(`${base}/git/commits`, input.token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "feat: generate per-order SaaS project",
      tree: treeSha,
      parents: [parentSha],
    }),
  });
  await input.assertLease();
  const latestRef = await githubFetch(`${base}/git/ref/heads/${encodeURIComponent(branch)}`, input.token);
  if (String(latestRef.object?.sha || "") !== parentSha) {
    const error: any = new Error("Repository branch changed during project generation");
    error.status = 409;
    error.code = "concurrentRepositoryUpdate";
    throw error;
  }
  await input.assertLease();
  try {
    await githubFetch(`${base}/git/refs/heads/${encodeURIComponent(branch)}`, input.token, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sha: commit.sha, force: false }),
    });
  } catch (error: any) {
    if (error?.status === 409 || error?.status === 422) {
      const conflict: any = new Error("Repository branch changed during project generation");
      conflict.status = 409;
      conflict.code = "concurrentRepositoryUpdate";
      throw conflict;
    }
    throw error;
  }
  return { branch, commitSha: String(commit.sha), backupRef, fileCount: files.length };
}