import fs from "fs";
import path from "path";

const SANDBOXES_ROOT = path.join(process.cwd(), "sandboxes");

if (!fs.existsSync(SANDBOXES_ROOT)) fs.mkdirSync(SANDBOXES_ROOT, { recursive: true });

function projectDir(projectId: string): string {
  const safe = projectId.replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(SANDBOXES_ROOT, safe);
}

export function safePath(projectId: string, relativePath: string): string {
  const base = projectDir(projectId);
  const resolved = path.resolve(base, relativePath);
  if (!resolved.startsWith(base + path.sep) && resolved !== base) {
    throw new Error("Path traversal detected");
  }
  try {
    if (fs.existsSync(resolved)) {
      const real = fs.realpathSync(resolved);
      if (!real.startsWith(base + path.sep) && real !== base) {
        throw new Error("Symlink escape detected");
      }
    }
  } catch (e: any) {
    if (e.message === "Symlink escape detected") throw e;
  }
  return resolved;
}

export function ensureProjectDir(projectId: string): string {
  const dir = projectDir(projectId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function deleteProjectDir(projectId: string): void {
  const dir = projectDir(projectId);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

export function readFile(projectId: string, filePath: string): string {
  const abs = safePath(projectId, filePath);
  if (!fs.existsSync(abs)) throw new Error("File not found");
  return fs.readFileSync(abs, "utf-8");
}

export function writeFile(projectId: string, filePath: string, content: string): void {
  const abs = safePath(projectId, filePath);
  const dir = path.dirname(abs);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(abs, content, "utf-8");
}

export function deleteFile(projectId: string, filePath: string): void {
  const abs = safePath(projectId, filePath);
  if (fs.existsSync(abs)) {
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      fs.rmSync(abs, { recursive: true, force: true });
    } else {
      fs.unlinkSync(abs);
    }
  }
}

export function renameFile(projectId: string, oldPath: string, newPath: string): void {
  const absOld = safePath(projectId, oldPath);
  const absNew = safePath(projectId, newPath);
  if (!fs.existsSync(absOld)) throw new Error("Source not found");
  const dir = path.dirname(absNew);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.renameSync(absOld, absNew);
}

export function createFolder(projectId: string, folderPath: string): void {
  const abs = safePath(projectId, folderPath);
  if (!fs.existsSync(abs)) fs.mkdirSync(abs, { recursive: true });
}

export interface FileTreeEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: FileTreeEntry[];
}

export function listTree(projectId: string, subPath: string = "", depth: number = 3): FileTreeEntry[] {
  const base = projectDir(projectId);
  const abs = subPath ? safePath(projectId, subPath) : base;
  if (!fs.existsSync(abs)) return [];
  return buildTree(abs, base, depth);
}

function buildTree(dir: string, root: string, depth: number): FileTreeEntry[] {
  if (depth <= 0) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const result: FileTreeEntry[] = [];
  const IGNORE = new Set(["node_modules", ".git", "__pycache__", ".venv", "dist", ".next"]);

  for (const entry of entries) {
    if (IGNORE.has(entry.name) || entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(root, fullPath);
    if (entry.isDirectory()) {
      result.push({
        name: entry.name,
        path: relPath,
        type: "directory",
        children: buildTree(fullPath, root, depth - 1),
      });
    } else {
      const stat = fs.statSync(fullPath);
      result.push({ name: entry.name, path: relPath, type: "file", size: stat.size });
    }
  }
  return result.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function getDiskUsage(projectId: string): number {
  const dir = projectDir(projectId);
  if (!fs.existsSync(dir)) return 0;
  return getDirSize(dir) / (1024 * 1024);
}

function getDirSize(dirPath: string): number {
  let total = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        total += getDirSize(full);
      } else {
        total += fs.statSync(full).size;
      }
    }
  } catch {}
  return total;
}

export function getProjectDir(projectId: string): string {
  return projectDir(projectId);
}

export { SANDBOXES_ROOT };
