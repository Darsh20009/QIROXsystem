import type { Express, Request, Response } from "express";
import type { Server as HttpServer } from "http";
import crypto from "crypto";
import { createProxyMiddleware } from "http-proxy-middleware";

const ENC_KEY_RAW = process.env.SANDBOX_ENC_KEY;
if (!ENC_KEY_RAW && process.env.NODE_ENV === "production") {
  throw new Error("[Sandbox] SANDBOX_ENC_KEY is required in production! Set this environment variable before starting.");
} else if (!ENC_KEY_RAW) {
  console.warn("[Sandbox] SANDBOX_ENC_KEY not set — using default key (dev only)");
}
const ENC_KEY = (ENC_KEY_RAW || "qirox-sandbox-default-key-32ch").padEnd(32, "0").slice(0, 32);
const ENC_ALGO = "aes-256-cbc" as const;

const PREVIEW_TOKEN_TTL = 15 * 60 * 1000;

function generatePreviewToken(userId: string, projectId: string): string {
  const payload = JSON.stringify({ userId, projectId, exp: Date.now() + PREVIEW_TOKEN_TTL });
  const hmac = crypto.createHmac("sha256", ENC_KEY).update(payload).digest("hex");
  return Buffer.from(payload).toString("base64url") + "." + hmac;
}

function verifyPreviewToken(token: string): { userId: string; projectId: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  try {
    const payload = Buffer.from(parts[0], "base64url").toString("utf8");
    const hmac = crypto.createHmac("sha256", ENC_KEY).update(payload).digest("hex");
    if (hmac !== parts[1]) return null;
    const data = JSON.parse(payload);
    if (data.exp < Date.now()) return null;
    return { userId: data.userId, projectId: data.projectId };
  } catch {
    return null;
  }
}

function encrypt(text: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENC_ALGO, Buffer.from(ENC_KEY), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return { encrypted, iv: iv.toString("hex") };
}

function decrypt(encrypted: string, ivHex: string): string {
  const decipher = crypto.createDecipheriv(ENC_ALGO, Buffer.from(ENC_KEY), Buffer.from(ivHex, "hex"));
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

const SANDBOX_ALLOWED_ROLES = ["admin", "manager", "employee"];

function requireAuth(req: Request, res: Response): any {
  if (!req.isAuthenticated?.() || !(req as any).user) {
    res.status(401).json({ error: "يجب تسجيل الدخول" });
    return null;
  }
  const user = (req as any).user;
  if (!SANDBOX_ALLOWED_ROLES.includes(user.role)) {
    res.status(403).json({ error: "صانع الأنظمة متاح للموظفين والمدراء فقط" });
    return null;
  }
  return user;
}

function requireAdmin(req: Request, res: Response): any {
  const user = requireAuth(req, res);
  if (!user) return null;
  if (!["admin", "manager"].includes(user.role)) {
    res.status(403).json({ error: "غير مصرّح" });
    return null;
  }
  return user;
}

async function requireProjectAccess(req: Request, res: Response): Promise<{ user: any; project: any } | null> {
  const user = requireAuth(req, res);
  if (!user) return null;
  const { SandboxProjectModel } = await import("./models");
  const projectId = req.params.projectId || req.params.id;
  if (!projectId) { res.status(400).json({ error: "معرّف المشروع مطلوب" }); return null; }
  const project = await SandboxProjectModel.findById(projectId);
  if (!project) { res.status(404).json({ error: "المشروع غير موجود" }); return null; }
  const isAdmin = ["admin", "manager"].includes(user.role);
  if (String(project.ownerId) !== String(user._id) && !isAdmin) {
    res.status(403).json({ error: "غير مصرّح بالوصول لهذا المشروع" });
    return null;
  }
  return { user, project };
}

async function syncDiskToDb(projectId: string, objectId: any): Promise<number> {
  const { SandboxFileModel } = await import("./models");
  const { listTree, readFile } = await import("./sandbox-fs");
  const tree = listTree(projectId, "", 10);

  interface FlatEntry { path: string; type: string; size: number }
  function flatten(entries: any[], result: FlatEntry[] = []): FlatEntry[] {
    for (const e of entries) {
      result.push({ path: e.path, type: e.type, size: e.size || 0 });
      if (e.children) flatten(e.children, result);
    }
    return result;
  }

  const files = flatten(tree);
  await SandboxFileModel.deleteMany({ projectId: objectId });
  if (files.length > 0) {
    const docs = files.map((f) => {
      let content = "";
      if (f.type === "file" && f.size < 512 * 1024) {
        try { content = readFile(projectId, f.path); } catch { content = ""; }
      }
      return {
        projectId: objectId,
        path: f.path,
        type: f.type,
        content,
        size: f.size,
        hash: content ? crypto.createHash("md5").update(content).digest("hex") : "",
        syncedAt: new Date(),
      };
    });
    await SandboxFileModel.insertMany(docs, { ordered: false });
  }
  return files.length;
}

async function syncDbToDisk(projectId: string, objectId: any): Promise<number> {
  const { SandboxFileModel } = await import("./models");
  const { writeFile, createFolder, ensureProjectDir } = await import("./sandbox-fs");
  ensureProjectDir(projectId);
  const files = await SandboxFileModel.find({ projectId: objectId }).lean();
  let count = 0;
  const dirs = (files as any[]).filter((f) => f.type === "directory");
  const regularFiles = (files as any[]).filter((f) => f.type === "file");
  for (const d of dirs) {
    createFolder(projectId, d.path);
  }
  for (const f of regularFiles) {
    writeFile(projectId, f.path, f.content ?? "");
    count++;
  }
  return count;
}

const TEMPLATES: Record<string, { files: Record<string, string>; entryFile: string; startCmd: string; installCmd: string }> = {
  blank: {
    files: { "index.js": 'const http = require("http");\nconst PORT = process.env.PORT || 3000;\nhttp.createServer((req, res) => {\n  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });\n  res.end("<h1>مرحباً من QIROX Sandbox!</h1>");\n}).listen(PORT, () => console.log(`Server running on port ${PORT}`));\n' },
    entryFile: "index.js",
    startCmd: "node index.js",
    installCmd: "",
  },
  express: {
    files: {
      "package.json": '{\n  "name": "qirox-sandbox",\n  "version": "1.0.0",\n  "main": "index.js",\n  "dependencies": {\n    "express": "^4.18.2"\n  }\n}',
      "index.js": 'const express = require("express");\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.use(express.json());\n\napp.get("/", (req, res) => {\n  res.json({ message: "مرحباً من QIROX Sandbox!", status: "ok" });\n});\n\napp.listen(PORT, () => console.log(`Server running on port ${PORT}`));\n',
    },
    entryFile: "index.js",
    startCmd: "node index.js",
    installCmd: "npm install",
  },
  static: {
    files: {
      "index.html": '<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>QIROX Sandbox</title>\n  <style>\n    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #1a1a2e; color: #eee; }\n    h1 { font-size: 2rem; }\n  </style>\n</head>\n<body>\n  <h1>مرحباً من QIROX Sandbox! 🚀</h1>\n</body>\n</html>',
    },
    entryFile: "index.html",
    startCmd: "npx serve -l $PORT",
    installCmd: "",
  },
  react: {
    files: {
      "package.json": '{\n  "name": "qirox-react-sandbox",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  },\n  "devDependencies": {\n    "vite": "^5.0.0",\n    "@vitejs/plugin-react": "^4.0.0"\n  },\n  "scripts": {\n    "dev": "vite --host 0.0.0.0 --port $PORT"\n  }\n}',
      "index.html": '<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>QIROX React</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="/src/main.jsx"></script>\n</body>\n</html>',
      "src/main.jsx": 'import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\n\nReactDOM.createRoot(document.getElementById("root")).render(<App />);\n',
      "src/App.jsx": 'export default function App() {\n  return (\n    <div style={{ fontFamily: "sans-serif", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#1a1a2e", color: "#eee" }}>\n      <h1>مرحباً من QIROX React! ⚛️</h1>\n    </div>\n  );\n}\n',
      "vite.config.js": 'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig({\n  plugins: [react()],\n  server: { host: "0.0.0.0", allowedHosts: true },\n});\n',
    },
    entryFile: "src/App.jsx",
    startCmd: "npx vite --host 0.0.0.0 --port $PORT",
    installCmd: "npm install",
  },
};

async function getOpenAIClient() {
  const OpenAI = (await import("openai")).default;
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "sk-placeholder",
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://qiroxstudio.online",
      "X-Title": "QIROX Sandbox AI",
    },
  });
}

const proxyCache = new Map<number, ReturnType<typeof createProxyMiddleware>>();

function getOrCreateProxy(port: number, projectId: string) {
  if (proxyCache.has(port)) return proxyCache.get(port)!;
  const proxy = createProxyMiddleware({
    target: `http://127.0.0.1:${port}`,
    changeOrigin: true,
    pathRewrite: (_path: string) => _path.replace(new RegExp(`^/sandbox/${projectId}/preview`), ""),
    ws: true,
    on: {
      error: (_err: any, _req: any, res: any) => {
        if (res && typeof res.status === "function") {
          res.status(502).send("الخادم غير متاح حالياً");
        }
      },
    },
  });
  proxyCache.set(port, proxy);
  return proxy;
}

export function registerSandboxRoutes(app: Express, httpServer?: HttpServer): void {

  // ── Project CRUD ──────────────────────────────────────────────────────────

  app.get("/api/sandbox/projects", async (req: Request, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) return;
    try {
      const { SandboxProjectModel } = await import("./models");
      const { isRunning } = await import("./sandbox-runner");
      const isAdmin = ["admin", "manager"].includes(user.role);
      const query: any = isAdmin ? {} : { ownerId: user._id };
      const projects = await SandboxProjectModel.find(query).sort({ updatedAt: -1 }).lean();
      const result = projects.map((p: any) => ({
        ...p,
        id: String(p._id),
        _id: undefined,
        __v: undefined,
        isRunning: isRunning(String(p._id)),
      }));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sandbox/projects", async (req: Request, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) return;
    try {
      const { SandboxProjectModel } = await import("./models");
      const { ensureProjectDir } = await import("./sandbox-fs");
      const { name, nameAr, description, template, runtime, tags } = req.body;
      if (!name) return res.status(400).json({ error: "اسم المشروع مطلوب" });

      const tmpl = TEMPLATES[template || "blank"] || TEMPLATES.blank;
      const project = await SandboxProjectModel.create({
        ownerId: user._id,
        name,
        nameAr: nameAr || "",
        description: description || "",
        template: template || "blank",
        runtime: runtime || "node",
        entryFile: tmpl.entryFile,
        startCmd: tmpl.startCmd,
        installCmd: tmpl.installCmd,
        tags: tags || [],
      });

      const projectId = String(project._id);
      ensureProjectDir(projectId);

      const { writeFile: fsWrite } = await import("./sandbox-fs");
      for (const [filePath, content] of Object.entries(tmpl.files)) {
        fsWrite(projectId, filePath, content);
      }

      await syncDiskToDb(projectId, project._id);

      res.status(201).json({ id: projectId, ...project.toJSON() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/sandbox/projects/:id", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { isRunning, getProcessInfo } = await import("./sandbox-runner");
      const { getDiskUsage, ensureProjectDir } = await import("./sandbox-fs");
      const { SandboxFileModel } = await import("./models");
      const pid = String(ctx.project._id);
      const proc = getProcessInfo(pid);

      const fs = await import("fs");
      const dir = (await import("./sandbox-fs")).getProjectDir(pid);
      const dirExists = fs.existsSync(dir);
      if (!dirExists) {
        const dbFileCount = await SandboxFileModel.countDocuments({ projectId: ctx.project._id });
        if (dbFileCount > 0) {
          ensureProjectDir(pid);
          await syncDbToDisk(pid, ctx.project._id);
        }
      }

      res.json({
        ...ctx.project.toJSON(),
        id: pid,
        isRunning: isRunning(pid),
        processInfo: proc,
        diskUsageMB: getDiskUsage(pid),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/sandbox/projects/:id", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const isAdmin = ["admin", "manager"].includes(ctx.user.role);
      const allowed = isAdmin
        ? ["name", "nameAr", "description", "entryFile", "startCmd", "installCmd", "buildCmd", "runtime", "githubRepo", "githubBranch", "isPublic", "tags"]
        : ["name", "nameAr", "description", "entryFile", "runtime", "isPublic", "tags"];
      const updates: Record<string, any> = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      const { SandboxProjectModel } = await import("./models");
      const updated = await SandboxProjectModel.findByIdAndUpdate(ctx.project._id, updates, { new: true });
      res.json({ ...updated?.toJSON(), id: String(updated?._id) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/sandbox/projects/:id", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { stopProcess } = await import("./sandbox-runner");
      const { deleteProjectDir } = await import("./sandbox-fs");
      const { SandboxProjectModel, SandboxEnvVarModel, SandboxFileModel, SandboxDeploymentModel } = await import("./models");
      const pid = String(ctx.project._id);
      await stopProcess(pid);
      deleteProjectDir(pid);
      await SandboxEnvVarModel.deleteMany({ projectId: ctx.project._id });
      await SandboxFileModel.deleteMany({ projectId: ctx.project._id });
      await SandboxDeploymentModel.deleteMany({ projectId: ctx.project._id });
      await SandboxProjectModel.findByIdAndDelete(ctx.project._id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── File Operations ───────────────────────────────────────────────────────

  app.get("/api/sandbox/projects/:id/files", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { listTree } = await import("./sandbox-fs");
      const subPath = (req.query.path as string) || "";
      const depth = parseInt(req.query.depth as string) || 3;
      res.json(listTree(String(ctx.project._id), subPath, depth));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/sandbox/projects/:id/file", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const filePath = req.query.path as string;
      if (!filePath) return res.status(400).json({ error: "مسار الملف مطلوب" });
      const { readFile } = await import("./sandbox-fs");
      const content = readFile(String(ctx.project._id), filePath);
      res.json({ path: filePath, content });
    } catch (err: any) {
      res.status(err.message === "File not found" ? 404 : 500).json({ error: err.message });
    }
  });

  app.put("/api/sandbox/projects/:id/file", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { path: filePath, content } = req.body;
      if (!filePath) return res.status(400).json({ error: "مسار الملف مطلوب" });
      const { writeFile } = await import("./sandbox-fs");
      const fileContent = content || "";
      writeFile(String(ctx.project._id), filePath, fileContent);
      const { SandboxFileModel } = await import("./models");
      await SandboxFileModel.findOneAndUpdate(
        { projectId: ctx.project._id, path: filePath },
        {
          type: "file",
          content: fileContent,
          size: Buffer.byteLength(fileContent),
          hash: crypto.createHash("md5").update(fileContent).digest("hex"),
          syncedAt: new Date(),
        },
        { upsert: true }
      );
      res.json({ success: true, path: filePath });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/sandbox/projects/:id/file", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const filePath = (req.query.path as string) || req.body.path;
      if (!filePath) return res.status(400).json({ error: "مسار الملف مطلوب" });
      const { deleteFile } = await import("./sandbox-fs");
      deleteFile(String(ctx.project._id), filePath);
      const { SandboxFileModel } = await import("./models");
      await SandboxFileModel.deleteMany({ projectId: ctx.project._id, path: { $regex: `^${filePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}` } });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sandbox/projects/:id/rename", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { oldPath, newPath } = req.body;
      if (!oldPath || !newPath) return res.status(400).json({ error: "المسار القديم والجديد مطلوبان" });
      const { renameFile } = await import("./sandbox-fs");
      renameFile(String(ctx.project._id), oldPath, newPath);
      const { SandboxFileModel } = await import("./models");
      await SandboxFileModel.updateMany(
        { projectId: ctx.project._id, path: { $regex: `^${oldPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}` } },
        [{ $set: { path: { $replaceOne: { input: "$path", find: oldPath, replacement: newPath } } } }]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sandbox/projects/:id/folder", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { path: folderPath } = req.body;
      if (!folderPath) return res.status(400).json({ error: "مسار المجلد مطلوب" });
      const { createFolder } = await import("./sandbox-fs");
      createFolder(String(ctx.project._id), folderPath);
      const { SandboxFileModel } = await import("./models");
      await SandboxFileModel.findOneAndUpdate(
        { projectId: ctx.project._id, path: folderPath },
        { type: "directory", syncedAt: new Date() },
        { upsert: true }
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sandbox/projects/:id/sync", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const count = await syncDiskToDb(String(ctx.project._id), ctx.project._id);
      res.json({ success: true, filesSynced: count });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sandbox/projects/:id/sync-from-db", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const count = await syncDbToDisk(String(ctx.project._id), ctx.project._id);
      res.json({ success: true, filesRestored: count });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Process Control ───────────────────────────────────────────────────────

  app.post("/api/sandbox/projects/:id/start", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { startProcess } = await import("./sandbox-runner");
      const { SandboxProjectModel, SandboxEnvVarModel } = await import("./models");
      const pid = String(ctx.project._id);

      const envDocs = await SandboxEnvVarModel.find({ projectId: ctx.project._id }).lean();
      const env: Record<string, string> = {};
      for (const doc of envDocs as any[]) {
        try { env[doc.key] = decrypt(doc.value, doc.iv); } catch {}
      }

      const shouldInstall = req.body.install !== false && ctx.project.installCmd;
      const result = await startProcess(pid, String(ctx.user._id), {
        startCmd: ctx.project.startCmd,
        installCmd: shouldInstall ? ctx.project.installCmd : undefined,
        env,
        runtime: ctx.project.runtime,
      });

      await SandboxProjectModel.findByIdAndUpdate(ctx.project._id, {
        status: "running",
        port: result.port,
        lastStartedAt: new Date(),
      });

      res.json({ success: true, port: result.port, pid: result.pid });
    } catch (err: any) {
      const { SandboxProjectModel } = await import("./models");
      await SandboxProjectModel.findByIdAndUpdate(ctx.project._id, { status: "error" });
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sandbox/projects/:id/stop", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { stopProcess } = await import("./sandbox-runner");
      const { SandboxProjectModel } = await import("./models");
      await stopProcess(String(ctx.project._id));
      await SandboxProjectModel.findByIdAndUpdate(ctx.project._id, {
        status: "stopped",
        port: null,
        lastStoppedAt: new Date(),
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sandbox/projects/:id/restart", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { stopProcess, startProcess } = await import("./sandbox-runner");
      const { SandboxProjectModel, SandboxEnvVarModel } = await import("./models");
      const pid = String(ctx.project._id);
      await stopProcess(pid);

      const envDocs = await SandboxEnvVarModel.find({ projectId: ctx.project._id }).lean();
      const env: Record<string, string> = {};
      for (const doc of envDocs as any[]) {
        try { env[doc.key] = decrypt(doc.value, doc.iv); } catch {}
      }

      const result = await startProcess(pid, String(ctx.user._id), {
        startCmd: ctx.project.startCmd,
        env,
        runtime: ctx.project.runtime,
      });

      await SandboxProjectModel.findByIdAndUpdate(ctx.project._id, {
        status: "running",
        port: result.port,
        lastStartedAt: new Date(),
      });

      res.json({ success: true, port: result.port, pid: result.pid });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Running Status & Logs ────────────────────────────────────────────────

  app.get("/api/sandbox/projects/:id/status", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { isRunning, getProcessInfo } = await import("./sandbox-runner");
      const pid = String(ctx.project._id);
      const running = isRunning(pid);
      const proc = getProcessInfo(pid);
      res.json({
        projectId: pid,
        isRunning: running,
        port: running ? ctx.project.port : null,
        pid: proc?.pid || null,
        uptime: proc ? Date.now() - proc.startedAt : 0,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/sandbox/projects/:id/logs", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { getProcessInfo } = await import("./sandbox-runner");
      const proc = getProcessInfo(String(ctx.project._id));
      if (!proc) return res.json({ logs: [], message: "لا توجد عملية قيد التشغيل" });
      res.json({
        logs: proc.logs || [],
        pid: proc.pid,
        startedAt: proc.startedAt,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Env Vars ──────────────────────────────────────────────────────────────

  app.get("/api/sandbox/projects/:id/env", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { SandboxEnvVarModel } = await import("./models");
      const vars = await SandboxEnvVarModel.find({ projectId: ctx.project._id }).lean();
      const result = (vars as any[]).map((v) => ({
        id: String(v._id),
        key: v.key,
        value: (() => { try { return decrypt(v.value, v.iv); } catch { return "***"; } })(),
      }));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sandbox/projects/:id/env", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { key, value } = req.body;
      if (!key) return res.status(400).json({ error: "اسم المتغير مطلوب" });
      const { SandboxEnvVarModel } = await import("./models");
      const { encrypted, iv } = encrypt(value || "");
      await SandboxEnvVarModel.findOneAndUpdate(
        { projectId: ctx.project._id, key },
        { value: encrypted, iv },
        { upsert: true, new: true }
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/sandbox/projects/:id/env/:key", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { SandboxEnvVarModel } = await import("./models");
      await SandboxEnvVarModel.deleteOne({ projectId: ctx.project._id, key: req.params.key });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── AI Code Generation ────────────────────────────────────────────────────

  app.post("/api/sandbox/:id/ai/generate", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { prompt, targetFile, mode } = req.body;
      if (!prompt) return res.status(400).json({ error: "الأمر مطلوب" });

      const validModes = ["create", "edit", "explain", "full-project"];
      const activeMode = validModes.includes(mode) ? mode : "create";

      const openai = await getOpenAIClient();
      const { listTree, readFile, writeFile } = await import("./sandbox-fs");
      const pid = String(ctx.project._id);

      const tree = listTree(pid, "", 2);
      const treeStr = JSON.stringify(tree.map((e: any) => e.path), null, 2);

      let existingCode = "";
      if (targetFile && (activeMode === "edit" || activeMode === "explain")) {
        try { existingCode = readFile(pid, targetFile); } catch {}
      }

      if (activeMode === "full-project") {
        const completion = await openai.chat.completions.create({
          model: "openai/gpt-4o",
          messages: [
            {
              role: "system",
              content: `أنت مساعد QIROX Studio لتوليد هيكل مشاريع كاملة.
الملفات الحالية: ${treeStr}
أرجع JSON فقط بهذا الشكل:
{
  "files": { "path/file.ext": "محتوى الملف" },
  "startCmd": "أمر التشغيل",
  "installCmd": "أمر التثبيت",
  "entryFile": "الملف الرئيسي"
}
لا تضف أي شرح خارج JSON.`,
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 8000,
        });

        let raw = completion.choices[0]?.message?.content?.trim() || "{}";
        raw = raw.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
        const scaffold = JSON.parse(raw);

        const { SandboxProjectModel } = await import("./models");
        let filesCreated = 0;

        if (scaffold.files && typeof scaffold.files === "object") {
          for (const [fp, content] of Object.entries(scaffold.files)) {
            writeFile(pid, fp, String(content));
            filesCreated++;
          }
        }

        const updates: Record<string, any> = {};
        if (scaffold.startCmd) updates.startCmd = scaffold.startCmd;
        if (scaffold.installCmd) updates.installCmd = scaffold.installCmd;
        if (scaffold.entryFile) updates.entryFile = scaffold.entryFile;
        if (Object.keys(updates).length > 0) {
          await SandboxProjectModel.findByIdAndUpdate(ctx.project._id, updates);
        }

        await syncDiskToDb(pid, ctx.project._id);

        return res.json({ success: true, mode: "full-project", filesCreated, tokens: completion.usage?.total_tokens || 0 });
      }

      if (activeMode === "explain") {
        const completion = await openai.chat.completions.create({
          model: "openai/gpt-4o",
          messages: [
            {
              role: "system",
              content: "أنت مساعد برمجي خبير. اشرح الكود التالي بالعربية بشكل واضح ومختصر.",
            },
            { role: "user", content: `اشرح هذا الكود${targetFile ? ` (${targetFile})` : ""}:\n\`\`\`\n${existingCode || prompt}\n\`\`\`\n\n${prompt}` },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        });

        return res.json({
          explanation: completion.choices[0]?.message?.content?.trim() || "",
          mode: "explain",
          tokens: completion.usage?.total_tokens || 0,
        });
      }

      const systemPrompt = `أنت مساعد برمجي خبير في QIROX Studio. أنشئ كود نظيف وجاهز للتشغيل.
الملفات الحالية في المشروع: ${treeStr}
${activeMode === "edit" ? "المطلوب تعديل الكود الموجود وإرجاع النسخة المعدّلة بالكامل." : "أنشئ كود جديد."}
أرجع الكود فقط بدون أي شرح أو تعليقات إضافية.
لا تستخدم markdown code fences.`;

      const userMsg = existingCode
        ? `الكود الحالي في ${targetFile || "الملف"}:\n\`\`\`\n${existingCode}\n\`\`\`\n\nالمطلوب: ${prompt}`
        : `أنشئ كود ${targetFile ? `للملف ${targetFile}` : ""}: ${prompt}`;

      const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      });

      let code = completion.choices[0]?.message?.content?.trim() || "";
      code = code.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");

      if (targetFile) {
        writeFile(pid, targetFile, code);
        const { SandboxFileModel } = await import("./models");
        await SandboxFileModel.findOneAndUpdate(
          { projectId: ctx.project._id, path: targetFile },
          {
            type: "file",
            content: code,
            size: Buffer.byteLength(code),
            hash: crypto.createHash("md5").update(code).digest("hex"),
            syncedAt: new Date(),
          },
          { upsert: true }
        );
      }

      res.json({ code, targetFile, mode: activeMode, tokens: completion.usage?.total_tokens || 0 });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── ZIP Download / Import ─────────────────────────────────────────────────

  app.get("/api/sandbox/projects/:id/download", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const archiver = (await import("archiver")).default;
      const { getProjectDir } = await import("./sandbox-fs");
      const dir = getProjectDir(String(ctx.project._id));

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${ctx.project.name}.zip"`);

      const archive = archiver("zip", { zlib: { level: 6 } });
      archive.pipe(res);
      archive.directory(dir, false, (entry: any) => {
        if (entry.name.startsWith("node_modules/") || entry.name.startsWith(".git/")) return false;
        return entry;
      });
      archive.finalize();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sandbox/projects/:id/import-zip", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const multer = (await import("multer")).default;
      const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 }, storage: multer.memoryStorage() }).single("file");

      upload(req as any, res as any, async (err: any) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!(req as any).file) return res.status(400).json({ error: "ملف ZIP مطلوب" });

        const { Readable } = await import("stream");
        const unzipper = await import("unzipper");
        const { writeFile } = await import("./sandbox-fs");
        const pid = String(ctx.project._id);

        let count = 0;
        let totalSize = 0;
        const MAX_FILES = 500;
        const MAX_TOTAL_SIZE = 100 * 1024 * 1024;
        const stream = Readable.from((req as any).file.buffer);
        const zip = stream.pipe(unzipper.Parse());

        for await (const entry of zip) {
          const filePath = (entry as any).path;
          if (count >= MAX_FILES) { (entry as any).autodrain(); continue; }
          if ((entry as any).type === "File" && !filePath.includes("node_modules/") && !filePath.includes(".git/")) {
            const buf = await (entry as any).buffer();
            totalSize += buf.length;
            if (totalSize > MAX_TOTAL_SIZE) break;
            writeFile(pid, filePath, buf.toString("utf-8"));
            count++;
          } else {
            (entry as any).autodrain();
          }
        }

        await syncDiskToDb(pid, ctx.project._id);

        res.json({ success: true, filesImported: count });
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── GitHub Integration ────────────────────────────────────────────────────

  app.post("/api/sandbox/projects/:id/github/clone", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { repoUrl, branch } = req.body;
      if (!repoUrl) return res.status(400).json({ error: "رابط المستودع مطلوب" });

      const simpleGit = (await import("simple-git")).default;
      const { ensureProjectDir, deleteProjectDir } = await import("./sandbox-fs");
      const { SandboxProjectModel } = await import("./models");
      const pid = String(ctx.project._id);

      deleteProjectDir(pid);
      const dir = ensureProjectDir(pid);

      const git = simpleGit();
      await git.clone(repoUrl, dir, ["--branch", branch || "main", "--depth", "1"]);

      await SandboxProjectModel.findByIdAndUpdate(ctx.project._id, {
        githubRepo: repoUrl,
        githubBranch: branch || "main",
      });

      await syncDiskToDb(pid, ctx.project._id);

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sandbox/projects/:id/github/import", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { repoUrl, branch, pat } = req.body;
      if (!repoUrl) return res.status(400).json({ error: "رابط المستودع مطلوب" });

      const simpleGit = (await import("simple-git")).default;
      const { ensureProjectDir, deleteProjectDir } = await import("./sandbox-fs");
      const { SandboxProjectModel } = await import("./models");
      const pid = String(ctx.project._id);

      let cloneUrl = repoUrl;
      if (pat) {
        try {
          const url = new URL(repoUrl);
          url.username = pat;
          url.password = "x-oauth-basic";
          cloneUrl = url.toString();
        } catch {
          return res.status(400).json({ error: "رابط المستودع غير صالح" });
        }
      }

      deleteProjectDir(pid);
      const dir = ensureProjectDir(pid);

      const git = simpleGit();
      await git.clone(cloneUrl, dir, ["--branch", branch || "main", "--depth", "1"]);

      if (pat) {
        const localGit = simpleGit(dir);
        await localGit.remote(["set-url", "origin", repoUrl]);
      }

      await SandboxProjectModel.findByIdAndUpdate(ctx.project._id, {
        githubRepo: repoUrl,
        githubBranch: branch || "main",
      });

      await syncDiskToDb(pid, ctx.project._id);

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sandbox/projects/:id/github/pull", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const simpleGit = (await import("simple-git")).default;
      const { getProjectDir } = await import("./sandbox-fs");
      const dir = getProjectDir(String(ctx.project._id));
      const git = simpleGit(dir);
      const result = await git.pull();
      await syncDiskToDb(String(ctx.project._id), ctx.project._id);
      res.json({ success: true, summary: result.summary });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sandbox/projects/:id/github/push", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    let git: any = null;
    let patApplied = false;
    try {
      const { message, commitMessage, pat, repoUrl, branch } = req.body;
      const msg = commitMessage || message;
      const targetRepo = repoUrl || ctx.project.githubRepo;
      const targetBranch = branch || ctx.project.githubBranch || "main";
      if (!targetRepo) return res.status(400).json({ error: "رابط المستودع مطلوب" });

      const simpleGit = (await import("simple-git")).default;
      const { getProjectDir } = await import("./sandbox-fs");
      const dir = getProjectDir(String(ctx.project._id));
      git = simpleGit(dir);

      let pushUrl = targetRepo;
      if (pat) {
        const url = new URL(targetRepo);
        url.username = pat;
        url.password = "x-oauth-basic";
        pushUrl = url.toString();
      }

      await git.remote(["set-url", "origin", pushUrl]);
      patApplied = !!pat;

      await git.add(".");
      await git.commit(msg || "Update from QIROX Sandbox");
      await git.push("origin", targetBranch);

      res.json({ success: true, pushed: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    } finally {
      if (git) {
        const safeUrl = (req.body.repoUrl || ctx.project.githubRepo || "");
        if (safeUrl) {
          try { await git.remote(["set-url", "origin", safeUrl]); } catch { /* ensure PAT removed */ }
        }
      }
    }
  });

  app.get("/api/sandbox/projects/:id/github/status", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const simpleGit = (await import("simple-git")).default;
      const { getProjectDir } = await import("./sandbox-fs");
      const dir = getProjectDir(String(ctx.project._id));
      const git = simpleGit(dir);

      const [statusResult, logResult, branchResult] = await Promise.all([
        git.status(),
        git.log({ maxCount: 5 }).catch(() => ({ all: [] })),
        git.branch().catch(() => ({ current: "unknown", all: [] })),
      ]);

      res.json({
        branch: branchResult.current,
        branches: branchResult.all,
        modified: statusResult.modified,
        created: statusResult.created,
        deleted: statusResult.deleted,
        staged: statusResult.staged,
        notAdded: statusResult.not_added,
        isClean: statusResult.isClean(),
        lastCommits: (logResult as any).all?.slice(0, 5).map((c: any) => ({
          hash: c.hash?.slice(0, 8),
          message: c.message,
          date: c.date,
          author: c.author_name,
        })) || [],
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Preview Proxy ─────────────────────────────────────────────────────────

  app.use("/sandbox/:id/preview", async (req: Request, res: Response, next: any) => {
    try {
      const { SandboxProjectModel } = await import("./models");
      const project = await SandboxProjectModel.findById(req.params.id);
      if (!project || !project.port) return res.status(404).send("المشروع غير متاح");

      const isOwner = req.isAuthenticated?.() && String((req as any).user?._id) === String(project.ownerId);
      const isAdmin = req.isAuthenticated?.() && ["admin", "manager"].includes((req as any).user?.role);
      if (!project.isPublic && !isOwner && !isAdmin) {
        return res.status(403).send("غير مصرّح");
      }

      const proxy = getOrCreateProxy(project.port, String(project._id));
      proxy(req, res, next);
    } catch {
      res.status(500).send("خطأ في البروكسي");
    }
  });

  // ── Deployments ───────────────────────────────────────────────────────────

  app.get("/api/sandbox/projects/:id/deployments", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { SandboxDeploymentModel } = await import("./models");
      const deployments = await SandboxDeploymentModel.find({ projectId: ctx.project._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      res.json(deployments.map((d: any) => ({ ...d, id: String(d._id), _id: undefined, __v: undefined })));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sandbox/projects/:id/deploy", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { SandboxDeploymentModel } = await import("./models");
      const deployment = await SandboxDeploymentModel.create({
        projectId: ctx.project._id,
        deployedBy: ctx.user._id,
        version: req.body.version || "1.0.0",
        status: "pending",
      });
      res.status(201).json({ id: String(deployment._id), status: "pending" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Admin ─────────────────────────────────────────────────────────────────

  app.get("/api/sandbox/admin/running", async (req: Request, res: Response) => {
    const user = requireAdmin(req, res);
    if (!user) return;
    try {
      const { getAllRunning } = await import("./sandbox-runner");
      res.json(getAllRunning());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sandbox/admin/stop-all", async (req: Request, res: Response) => {
    const user = requireAdmin(req, res);
    if (!user) return;
    try {
      const { stopAllProcesses } = await import("./sandbox-runner");
      await stopAllProcesses();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Templates ─────────────────────────────────────────────────────────────

  app.get("/api/sandbox/templates", (_req: Request, res: Response) => {
    const list = Object.entries(TEMPLATES).map(([key, tmpl]) => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      entryFile: tmpl.entryFile,
      files: Object.keys(tmpl.files),
    }));
    res.json(list);
  });

  // ── Preview Token ──────────────────────────────────────────────────────────

  app.post("/api/sandbox/projects/:id/preview-token", async (req: Request, res: Response) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    const token = generatePreviewToken(String(ctx.user._id), String(ctx.project._id));
    res.json({ token, expiresIn: PREVIEW_TOKEN_TTL });
  });

  // ── Route Aliases (/api/sandbox/:id/... → same handler as /api/sandbox/projects/:id/...) ──
  const aliasEndpoints = [
    "file", "folder", "rename", "tree", "sync", "sync-from-db",
    "start", "stop", "restart", "status", "logs",
    "env", "env/:key", "download", "import-zip",
    "github/clone", "github/import", "github/pull", "github/push", "github/status",
    "deployments", "preview-token",
  ];
  for (const ep of aliasEndpoints) {
    app.all(`/api/sandbox/:id/${ep}`, (req: Request, res: Response, next: any) => {
      req.url = `/api/sandbox/projects/${req.params.id}/${ep.replace(":key", req.params.key || "")}`;
      req.originalUrl = req.url;
      (app as any)._router.handle(req, res, next);
    });
  }

  // ── WebSocket upgrade for sandbox preview ─────────────────────────────────
  if (httpServer) {
    httpServer.on("upgrade", async (req: any, socket: any, head: any) => {
      if (req.url?.startsWith("/sandbox/") && req.url?.includes("/preview")) {
        try {
          const match = req.url.match(/^\/sandbox\/([^/]+)\/preview/);
          if (!match) { socket.destroy(); return; }
          const projectId = match[1];
          const { SandboxProjectModel } = await import("./models");
          const project = await SandboxProjectModel.findById(projectId);
          if (!project || !project.port) { socket.destroy(); return; }

          if (!project.isPublic) {
            const token = new URL(req.url, "http://localhost").searchParams.get("token");
            if (!token) { socket.destroy(); return; }

            const decoded = verifyPreviewToken(token);
            if (!decoded || decoded.projectId !== projectId) { socket.destroy(); return; }

            const { UserModel } = await import("./models");
            const user = await UserModel.findById(decoded.userId);
            if (!user) { socket.destroy(); return; }
            const uid = String(user._id);
            const ownerId = String(project.ownerId);
            const isOwner = uid === ownerId;
            const isAdmin = user.role === "admin" || user.role === "manager";
            if (!isOwner && !isAdmin) { socket.destroy(); return; }
          }

          const proxy = getOrCreateProxy(project.port, String(project._id));
          (proxy as any).upgrade(req, socket, head);
        } catch {
          socket.destroy();
        }
      }
    });
  }
}
