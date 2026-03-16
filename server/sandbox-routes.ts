// @ts-nocheck
import type { Express, Request, Response } from "express";
import crypto from "crypto";
import { createProxyMiddleware } from "http-proxy-middleware";

const ENC_KEY_RAW = process.env.SANDBOX_ENC_KEY;
if (!ENC_KEY_RAW) console.warn("[Sandbox] ⚠ SANDBOX_ENC_KEY not set — using default key (NOT safe for production)");
const ENC_KEY = (ENC_KEY_RAW || "qirox-sandbox-default-key-32ch").padEnd(32, "0").slice(0, 32);
const ENC_ALGO = "aes-256-cbc";

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

function requireAuth(req: Request, res: Response): any {
  if (!req.isAuthenticated?.() || !req.user) {
    res.status(401).json({ error: "يجب تسجيل الدخول" });
    return null;
  }
  return req.user;
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

async function requireProjectAccess(req: Request, res: Response): Promise<any> {
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

export function registerSandboxRoutes(app: Express): void {
  // ── Project CRUD ──────────────────────────────────────────────────────────

  app.get("/api/sandbox/projects", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    try {
      const { SandboxProjectModel } = await import("./models");
      const { isRunning } = await import("./sandbox-runner");
      const isAdmin = ["admin", "manager"].includes(user.role);
      const query = isAdmin ? {} : { ownerId: user._id };
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

  app.post("/api/sandbox/projects", async (req, res) => {
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

      res.status(201).json({ id: projectId, ...project.toJSON() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/sandbox/projects/:id", async (req, res) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { isRunning, getProcessInfo } = await import("./sandbox-runner");
      const { getDiskUsage } = await import("./sandbox-fs");
      const pid = String(ctx.project._id);
      const proc = getProcessInfo(pid);
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

  app.patch("/api/sandbox/projects/:id", async (req, res) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const isAdmin = ["admin", "manager"].includes(ctx.user.role);
      const allowed = isAdmin
        ? ["name", "nameAr", "description", "entryFile", "startCmd", "installCmd", "buildCmd", "runtime", "githubRepo", "githubBranch", "isPublic", "tags"]
        : ["name", "nameAr", "description", "entryFile", "runtime", "isPublic", "tags"];
      const updates: any = {};
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

  app.delete("/api/sandbox/projects/:id", async (req, res) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { stopProcess } = await import("./sandbox-runner");
      const { deleteProjectDir } = await import("./sandbox-fs");
      const { SandboxProjectModel, SandboxEnvVarModel } = await import("./models");
      const pid = String(ctx.project._id);
      await stopProcess(pid);
      deleteProjectDir(pid);
      await SandboxEnvVarModel.deleteMany({ projectId: ctx.project._id });
      await SandboxProjectModel.findByIdAndDelete(ctx.project._id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── File Operations ───────────────────────────────────────────────────────

  app.get("/api/sandbox/projects/:id/files", async (req, res) => {
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

  app.get("/api/sandbox/projects/:id/file", async (req, res) => {
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

  app.put("/api/sandbox/projects/:id/file", async (req, res) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { path: filePath, content } = req.body;
      if (!filePath) return res.status(400).json({ error: "مسار الملف مطلوب" });
      const { writeFile } = await import("./sandbox-fs");
      writeFile(String(ctx.project._id), filePath, content || "");
      res.json({ success: true, path: filePath });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/sandbox/projects/:id/file", async (req, res) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const filePath = req.query.path as string || req.body.path;
      if (!filePath) return res.status(400).json({ error: "مسار الملف مطلوب" });
      const { deleteFile } = await import("./sandbox-fs");
      deleteFile(String(ctx.project._id), filePath);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sandbox/projects/:id/rename", async (req, res) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { oldPath, newPath } = req.body;
      if (!oldPath || !newPath) return res.status(400).json({ error: "المسار القديم والجديد مطلوبان" });
      const { renameFile } = await import("./sandbox-fs");
      renameFile(String(ctx.project._id), oldPath, newPath);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sandbox/projects/:id/folder", async (req, res) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { path: folderPath } = req.body;
      if (!folderPath) return res.status(400).json({ error: "مسار المجلد مطلوب" });
      const { createFolder } = await import("./sandbox-fs");
      createFolder(String(ctx.project._id), folderPath);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Process Control ───────────────────────────────────────────────────────

  app.post("/api/sandbox/projects/:id/start", async (req, res) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { startProcess } = await import("./sandbox-runner");
      const { SandboxProjectModel, SandboxEnvVarModel } = await import("./models");
      const pid = String(ctx.project._id);

      const envDocs = await SandboxEnvVarModel.find({ projectId: ctx.project._id }).lean();
      const env: Record<string, string> = {};
      for (const doc of envDocs) {
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

  app.post("/api/sandbox/projects/:id/stop", async (req, res) => {
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

  app.post("/api/sandbox/projects/:id/restart", async (req, res) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { stopProcess, startProcess } = await import("./sandbox-runner");
      const { SandboxProjectModel, SandboxEnvVarModel } = await import("./models");
      const pid = String(ctx.project._id);
      await stopProcess(pid);

      const envDocs = await SandboxEnvVarModel.find({ projectId: ctx.project._id }).lean();
      const env: Record<string, string> = {};
      for (const doc of envDocs) {
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

  // ── Env Vars ──────────────────────────────────────────────────────────────

  app.get("/api/sandbox/projects/:id/env", async (req, res) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { SandboxEnvVarModel } = await import("./models");
      const vars = await SandboxEnvVarModel.find({ projectId: ctx.project._id }).lean();
      const result = vars.map((v: any) => ({
        id: String(v._id),
        key: v.key,
        value: (() => { try { return decrypt(v.value, v.iv); } catch { return "***"; } })(),
      }));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sandbox/projects/:id/env", async (req, res) => {
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

  app.delete("/api/sandbox/projects/:id/env/:key", async (req, res) => {
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

  app.post("/api/sandbox/projects/:id/ai/generate", async (req, res) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { prompt, filePath, existingCode } = req.body;
      if (!prompt) return res.status(400).json({ error: "الأمر مطلوب" });

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || "sk-placeholder",
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "https://qiroxstudio.online",
          "X-Title": "QIROX Sandbox AI",
        },
      });

      const systemPrompt = `أنت مساعد برمجي خبير في QIROX Studio. أنشئ كود نظيف وجاهز للتشغيل.
إذا طلب المستخدم تعديل كود موجود، أرجع الكود المعدّل بالكامل.
أرجع الكود فقط بدون أي شرح أو تعليقات إضافية.
لا تستخدم markdown code fences.`;

      const userMsg = existingCode
        ? `الكود الحالي في ${filePath || "الملف"}:\n\`\`\`\n${existingCode}\n\`\`\`\n\nالمطلوب: ${prompt}`
        : `أنشئ كود ${filePath ? `للملف ${filePath}` : ""}: ${prompt}`;

      const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      });

      let code = completion.choices[0]?.message?.content?.trim() || "";
      code = code.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");

      if (filePath) {
        const { writeFile } = await import("./sandbox-fs");
        writeFile(String(ctx.project._id), filePath, code);
      }

      res.json({ code, filePath, tokens: completion.usage?.total_tokens || 0 });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sandbox/projects/:id/ai/scaffold", async (req, res) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: "وصف المشروع مطلوب" });

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || "sk-placeholder",
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "https://qiroxstudio.online",
          "X-Title": "QIROX Sandbox AI",
        },
      });

      const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `أنت مساعد QIROX Studio لتوليد هيكل مشاريع كاملة.
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

      const { writeFile } = await import("./sandbox-fs");
      const { SandboxProjectModel } = await import("./models");
      const pid = String(ctx.project._id);
      let filesCreated = 0;

      if (scaffold.files && typeof scaffold.files === "object") {
        for (const [fp, content] of Object.entries(scaffold.files)) {
          writeFile(pid, fp, String(content));
          filesCreated++;
        }
      }

      const updates: any = {};
      if (scaffold.startCmd) updates.startCmd = scaffold.startCmd;
      if (scaffold.installCmd) updates.installCmd = scaffold.installCmd;
      if (scaffold.entryFile) updates.entryFile = scaffold.entryFile;
      if (Object.keys(updates).length > 0) {
        await SandboxProjectModel.findByIdAndUpdate(ctx.project._id, updates);
      }

      res.json({ success: true, filesCreated, tokens: completion.usage?.total_tokens || 0 });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── ZIP Export / Import ────────────────────────────────────────────────────

  app.get("/api/sandbox/projects/:id/export", async (req, res) => {
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
      archive.directory(dir, false, (entry) => {
        if (entry.name.startsWith("node_modules/") || entry.name.startsWith(".git/")) return false;
        return entry;
      });
      archive.finalize();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sandbox/projects/:id/import", async (req, res) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const multer = (await import("multer")).default;
      const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }).single("file");

      upload(req, res, async (err: any) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!req.file) return res.status(400).json({ error: "ملف ZIP مطلوب" });

        const { Readable } = await import("stream");
        const unzipper = await import("unzipper");
        const { writeFile } = await import("./sandbox-fs");
        const pid = String(ctx.project._id);

        let count = 0;
        let totalSize = 0;
        const MAX_FILES = 500;
        const MAX_TOTAL_SIZE = 100 * 1024 * 1024;
        const stream = Readable.from(req.file.buffer);
        const zip = stream.pipe(unzipper.Parse());

        for await (const entry of zip) {
          const filePath = entry.path;
          if (count >= MAX_FILES) { entry.autodrain(); continue; }
          if (entry.type === "File" && !filePath.includes("node_modules/") && !filePath.includes(".git/")) {
            const buf = await entry.buffer();
            totalSize += buf.length;
            if (totalSize > MAX_TOTAL_SIZE) { break; }
            writeFile(pid, filePath, buf.toString("utf-8"));
            count++;
          } else {
            entry.autodrain();
          }
        }

        res.json({ success: true, filesImported: count });
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── GitHub Integration ────────────────────────────────────────────────────

  app.post("/api/sandbox/projects/:id/github/clone", async (req, res) => {
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

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sandbox/projects/:id/github/pull", async (req, res) => {
    const ctx = await requireProjectAccess(req, res);
    if (!ctx) return;
    try {
      const simpleGit = (await import("simple-git")).default;
      const { getProjectDir } = await import("./sandbox-fs");
      const dir = getProjectDir(String(ctx.project._id));
      const git = simpleGit(dir);
      const result = await git.pull();
      res.json({ success: true, summary: result.summary });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Preview Proxy ─────────────────────────────────────────────────────────

  app.use("/sandbox/:id/preview", async (req, res, next) => {
    try {
      const { SandboxProjectModel } = await import("./models");
      const project = await SandboxProjectModel.findById(req.params.id);
      if (!project || !project.port) return res.status(404).send("المشروع غير متاح");

      const isOwner = req.isAuthenticated?.() && String((req.user as any)?._id) === String(project.ownerId);
      const isAdmin = req.isAuthenticated?.() && ["admin", "manager"].includes((req.user as any)?.role);
      if (!project.isPublic && !isOwner && !isAdmin) {
        return res.status(403).send("غير مصرّح");
      }

      const proxy = createProxyMiddleware({
        target: `http://127.0.0.1:${project.port}`,
        changeOrigin: true,
        pathRewrite: { [`^/sandbox/${req.params.id}/preview`]: "" },
        ws: true,
        on: {
          error: (_err, _req, res) => {
            if (res && typeof (res as any).status === "function") {
              (res as any).status(502).send("الخادم غير متاح حالياً");
            }
          },
        },
      });

      proxy(req, res, next);
    } catch (err: any) {
      res.status(500).send("خطأ في البروكسي");
    }
  });

  // ── Admin: list all running sandboxes ──────────────────────────────────────

  app.get("/api/sandbox/admin/running", async (req, res) => {
    const user = requireAdmin(req, res);
    if (!user) return;
    try {
      const { getAllRunning } = await import("./sandbox-runner");
      res.json(getAllRunning());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sandbox/admin/stop-all", async (req, res) => {
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

  // ── Templates list ────────────────────────────────────────────────────────

  app.get("/api/sandbox/templates", (_req, res) => {
    const list = Object.entries(TEMPLATES).map(([key, tmpl]) => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      entryFile: tmpl.entryFile,
      files: Object.keys(tmpl.files),
    }));
    res.json(list);
  });
}
