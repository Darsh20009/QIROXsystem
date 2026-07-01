// @ts-nocheck
/**
 * QIROX Deployment Cloud
 * Real deployments via Vercel API (when VERCEL_TOKEN set) with simulation fallback
 * AI error analysis via OpenAI GPT-4o
 * Subdomain routing: [slug].qiroxstudio.online → served from this server
 */
import type { Express, Request, Response, NextFunction } from "express";
import OpenAI from "openai";
import { DeploymentProjectModel, DeploymentRunModel } from "./models";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import os from "os";

const BASE_DOMAIN = process.env.QIROX_CLOUD_DOMAIN || "deployment.qiroxstudio.online";
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN || "";

function getAIClient(): { client: OpenAI; model: string } {
  const openaiKey = process.env.OPENAI_API_KEY || "";
  const moonshotKey = process.env.MOONSHOT_API_KEY || "";
  if (openaiKey) {
    return { client: new OpenAI({ apiKey: openaiKey }), model: "gpt-4o" };
  }
  if (moonshotKey) {
    return {
      client: new OpenAI({ apiKey: moonshotKey, baseURL: "https://api.moonshot.ai/v1" }),
      model: "moonshot-v1-8k",
    };
  }
  throw new Error("لا يوجد مفتاح AI مُعدَّ (OPENAI_API_KEY أو MOONSHOT_API_KEY)");
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

function randomColor(): string {
  const colors = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6"];
  return colors[Math.floor(Math.random() * colors.length)];
}

async function githubFetch(url: string, token: string) {
  const res = await fetch(`https://api.github.com${url}`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "QiroxDeployCloud/2.0",
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  return res.json();
}

function detectFramework(files: string[]): string {
  if (files.includes("next.config.js") || files.includes("next.config.ts")) return "Next.js";
  if (files.includes("vite.config.ts") || files.includes("vite.config.js")) return "Vite";
  if (files.includes("nuxt.config.ts") || files.includes("nuxt.config.js")) return "Nuxt.js";
  if (files.includes("astro.config.mjs")) return "Astro";
  if (files.includes("remix.config.js")) return "Remix";
  if (files.includes("svelte.config.js")) return "SvelteKit";
  if (files.includes("angular.json")) return "Angular";
  if (files.includes("gatsby-config.js")) return "Gatsby";
  if (files.includes("package.json")) return "Node.js";
  if (files.includes("requirements.txt") || files.includes("pyproject.toml")) return "Python";
  return "Static";
}

/* ══════════════════════════════════════════════════════════════
   VERCEL INTEGRATION — Real deployments
══════════════════════════════════════════════════════════════ */

async function vercelFetch(path: string, method = "GET", body?: any) {
  if (!VERCEL_TOKEN) throw new Error("VERCEL_TOKEN غير مُعدَّ");
  const res = await fetch(`https://api.vercel.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Vercel API ${res.status}: ${errText}`);
  }
  return res.json();
}

async function deployViaVercel(run: any, project: any): Promise<void> {
  try {
    run.logs.push({ time: new Date(), level: "info", message: "==> QIROX Cloud: نشر عبر Vercel" });
    run.logs.push({ time: new Date(), level: "info", message: `==> المستودع: ${project.githubOwner}/${project.githubRepo} (${project.githubBranch})` });
    run.status = "building";
    run.startedAt = new Date();
    await run.save();
    await DeploymentProjectModel.findByIdAndUpdate(project._id, { status: "building" });

    // Create Vercel project (or get existing)
    let vercelProjectId = project.vercelProjectId;
    if (!vercelProjectId) {
      run.logs.push({ time: new Date(), level: "info", message: "==> إنشاء مشروع Vercel..." });
      await run.save();
      try {
        const vProject = await vercelFetch("/v10/projects", "POST", {
          name: project.slug,
          framework: getVercelFramework(project.framework),
          gitRepository: {
            type: "github",
            repo: `${project.githubOwner}/${project.githubRepo}`,
          },
          buildCommand: project.buildCommand !== "npm run build" ? project.buildCommand : undefined,
          outputDirectory: project.outputDir !== "dist" ? project.outputDir : undefined,
          installCommand: "npm install",
        });
        vercelProjectId = vProject.id;
        await DeploymentProjectModel.findByIdAndUpdate(project._id, { vercelProjectId });
        run.logs.push({ time: new Date(), level: "success", message: `==> مشروع Vercel: ${vProject.name} (${vProject.id})` });
      } catch (e: any) {
        // Project might already exist
        run.logs.push({ time: new Date(), level: "warn", message: `==> تحذير: ${e.message}` });
      }
      await run.save();
    }

    // Create deployment
    run.logs.push({ time: new Date(), level: "info", message: "==> بدء عملية النشر على Vercel..." });
    await run.save();

    const deployPayload: any = {
      name: project.slug,
      gitSource: {
        type: "github",
        repoId: project.githubRepoId,
        ref: project.githubBranch,
        sha: run.commitSha || undefined,
      },
      target: "production",
      env: (project.envVars || []).reduce((acc: any, ev: any) => {
        if (!ev.isSecret) acc[ev.key] = ev.value;
        return acc;
      }, {}),
    };

    if (vercelProjectId) deployPayload.projectId = vercelProjectId;

    const deployment = await vercelFetch("/v13/deployments", "POST", deployPayload);
    const deploymentId = deployment.id || deployment.uid;

    run.logs.push({ time: new Date(), level: "info", message: `==> معرف النشر: ${deploymentId}` });
    run.logs.push({ time: new Date(), level: "info", message: "==> جاري بناء المشروع على Vercel..." });
    await run.save();

    // Poll for completion (up to 5 minutes)
    const maxWait = 300000;
    const pollInterval = 4000;
    const startTime = Date.now();
    let finalUrl = "";

    while (Date.now() - startTime < maxWait) {
      await new Promise(r => setTimeout(r, pollInterval));
      try {
        const status = await vercelFetch(`/v13/deployments/${deploymentId}`);
        const state = status.readyState || status.status;

        if (state === "READY" || state === "ready") {
          finalUrl = status.url ? `https://${status.url}` : `https://${project.slug}.vercel.app`;
          run.logs.push({ time: new Date(), level: "success", message: `==> ✅ النشر نجح!` });
          run.logs.push({ time: new Date(), level: "success", message: `==> الرابط: ${finalUrl}` });
          run.status = "success";
          run.completedAt = new Date();
          run.buildDuration = Math.round((Date.now() - run.startedAt.getTime()) / 1000);
          await run.save();

          await DeploymentProjectModel.findByIdAndUpdate(project._id, {
            status: "live",
            lastDeployAt: new Date(),
            $inc: { deployCount: 1 },
            domain: finalUrl.replace("https://", ""),
            vercelDeploymentId: deploymentId,
            vercelProjectId,
          });
          return;
        }

        if (state === "ERROR" || state === "error" || state === "CANCELED") {
          throw new Error(`فشل النشر على Vercel: ${state}`);
        }

        if (state === "BUILDING" || state === "building") {
          run.logs.push({ time: new Date(), level: "cmd", message: `  » Vercel: بناء... (${Math.round((Date.now() - startTime) / 1000)}ث)` });
        }
        await run.save();
      } catch (pollErr: any) {
        if (pollErr.message.includes("فشل")) throw pollErr;
      }
    }
    throw new Error("انتهت مهلة الانتظار (5 دقائق)");
  } catch (err: any) {
    run.status = "failed";
    run.error = err.message;
    run.completedAt = new Date();
    run.buildDuration = Math.round((Date.now() - (run.startedAt?.getTime() || Date.now())) / 1000);
    run.logs.push({ time: new Date(), level: "error", message: `==> ❌ فشل النشر: ${err.message}` });
    await run.save();
    await DeploymentProjectModel.findByIdAndUpdate(project._id, { status: "failed" });
  }
}

function getVercelFramework(framework: string): string | undefined {
  const map: Record<string, string> = {
    "Next.js": "nextjs",
    "Vite": "vite",
    "Nuxt.js": "nuxtjs",
    "Astro": "astro",
    "SvelteKit": "sveltekit",
    "Angular": "angular",
    "Gatsby": "gatsby",
    "Static": "html",
  };
  return map[framework];
}

/* ══════════════════════════════════════════════════════════════
   SIMULATION fallback (when no VERCEL_TOKEN)
══════════════════════════════════════════════════════════════ */

function buildLogs(framework: string, projectName: string, branch: string, commitSha: string) {
  const sha = (commitSha || "a1b2c3d").slice(0, 7);
  return [
    { level: "info",    message: `==> [محاكاة] النشر الحقيقي يتطلب VERCEL_TOKEN`, delay: 0 },
    { level: "info",    message: `==> الاستنساخ: ${projectName} (${branch})`, delay: 300 },
    { level: "info",    message: `==> commit: ${sha}`, delay: 600 },
    { level: "info",    message: `==> الإطار المكتشف: ${framework}`, delay: 1000 },
    { level: "cmd",     message: `$ npm install --legacy-peer-deps`, delay: 1200 },
    { level: "stdout",  message: `  added 847 packages in 12.4s`, delay: 2800 },
    { level: "cmd",     message: `$ npm run build`, delay: 3200 },
    { level: "stdout",  message: `  vite v5.2.0 building for production...`, delay: 3600 },
    { level: "stdout",  message: `  ✓ 1,284 modules transformed.`, delay: 5200 },
    { level: "stdout",  message: `  dist/index.html                  1.23 kB`, delay: 5400 },
    { level: "stdout",  message: `  dist/assets/index.js          312.45 kB`, delay: 5500 },
    { level: "info",    message: `==> البناء نجح في 5.8ث`, delay: 5800 },
    { level: "info",    message: `==> رفع الملفات...`, delay: 6200 },
    { level: "info",    message: `==> التحقق من الصحة... HTTP 200 OK`, delay: 7800 },
    { level: "success", message: `==> ✅ [محاكاة] تم النشر بنجاح`, delay: 8400 },
    { level: "success", message: `==> الرابط: https://${slugify(projectName)}.${BASE_DOMAIN}`, delay: 8600 },
  ];
}

async function simulateDeploy(run: any, project: any): Promise<void> {
  const logs = buildLogs(project.framework || "Vite", project.name, project.githubBranch, run.commitSha || "");
  run.status = "building";
  run.startedAt = new Date();
  await run.save();
  await DeploymentProjectModel.findByIdAndUpdate(project._id, { status: "building" });

  let elapsed = 0;
  for (const log of logs) {
    const wait = log.delay - elapsed;
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    elapsed = log.delay;
    run.logs.push({ time: new Date(), level: log.level, message: log.message });
    if (log.level === "success" && log.message.includes("تم النشر")) {
      run.status = "deploying";
      await DeploymentProjectModel.findByIdAndUpdate(project._id, { status: "deploying" });
    }
    await run.save();
  }

  run.status = "success";
  run.completedAt = new Date();
  run.buildDuration = Math.round((Date.now() - run.startedAt.getTime()) / 1000);
  await run.save();

  const updatedProject = await DeploymentProjectModel.findByIdAndUpdate(project._id, {
    status: "live",
    lastDeployAt: new Date(),
    $inc: { deployCount: 1 },
    domain: `${project.slug}.${BASE_DOMAIN}`,
    isSimulated: true,
  }, { new: true }).lean();

  if (updatedProject) {
    const html = generateDeployPage(updatedProject);
    saveDeployPage(project.slug, html);
  }
}

/* ══════════════════════════════════════════════════════════════
   ROUTES
══════════════════════════════════════════════════════════════ */
export function registerDeploymentCloudRoutes(app: Express) {

  // ── Config info (tells frontend whether Vercel is available) ───────────────
  app.get("/api/deploy/config", (req: Request, res: Response) => {
    res.json({
      hasVercel: !!VERCEL_TOKEN,
      baseDomain: BASE_DOMAIN,
      mode: VERCEL_TOKEN ? "vercel" : "simulation",
    });
  });

  // ── List projects ──────────────────────────────────────────────────────────
  app.get("/api/deploy/projects", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "يجب تسجيل الدخول" });
      const isAdmin = ["admin", "manager", "developer"].includes(user.role);
      const filter = isAdmin ? {} : { ownerId: String(user._id) };
      const projects = await DeploymentProjectModel.find(filter).sort({ createdAt: -1 }).lean();
      res.json(projects);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Get single project ─────────────────────────────────────────────────────
  app.get("/api/deploy/projects/:id", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "يجب تسجيل الدخول" });
      const project = await DeploymentProjectModel.findById(req.params.id).lean();
      if (!project) return res.status(404).json({ message: "المشروع غير موجود" });
      res.json(project);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Create project ─────────────────────────────────────────────────────────
  app.post("/api/deploy/projects", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "يجب تسجيل الدخول" });
      const {
        name, description, githubOwner, githubRepo, githubBranch, githubToken,
        githubRepoId, buildCommand, startCommand, outputDir, nodeVersion,
        envVars, plan, region, serviceType,
      } = req.body;

      if (!name || !githubOwner || !githubRepo) {
        return res.status(400).json({ message: "name, githubOwner, githubRepo مطلوبة" });
      }

      let baseSlug = slugify(name);
      let slug = baseSlug;
      let suffix = 1;
      while (await DeploymentProjectModel.exists({ slug })) {
        slug = `${baseSlug}-${suffix++}`;
      }

      let framework = "Node.js";
      const activeToken = githubToken || (user as any).githubDeployToken || "";
      if (activeToken) {
        try {
          const tree = await githubFetch(
            `/repos/${githubOwner}/${githubRepo}/git/trees/${githubBranch || "main"}`,
            activeToken
          );
          const files = (tree.tree || []).map((f: any) => f.path);
          framework = detectFramework(files);
        } catch {}
      }

      const domain = VERCEL_TOKEN
        ? `${slug}.vercel.app`
        : `${slug}.${BASE_DOMAIN}`;

      const project = await DeploymentProjectModel.create({
        name, description, githubOwner, githubRepo,
        githubBranch: githubBranch || "main",
        githubToken: activeToken,
        githubRepoId: githubRepoId || "",
        buildCommand: buildCommand || "npm run build",
        startCommand: startCommand || "npm start",
        outputDir: outputDir || "dist",
        nodeVersion: nodeVersion || "20",
        framework,
        envVars: envVars || [],
        plan: plan || "starter",
        region: region || "me-1",
        serviceType: serviceType || "web",
        slug,
        domain,
        ownerId: String(user._id),
        ownerName: user.fullName || user.username,
        avatarColor: randomColor(),
        status: "idle",
        isSimulated: !VERCEL_TOKEN,
      });

      res.json(project);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Update project ─────────────────────────────────────────────────────────
  app.put("/api/deploy/projects/:id", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "يجب تسجيل الدخول" });
      const { name, description, githubBranch, githubToken, buildCommand,
              startCommand, outputDir, nodeVersion, envVars, autoDeploy, plan, region, customDomain, logoUrl, documentation } = req.body;
      const project = await DeploymentProjectModel.findByIdAndUpdate(
        req.params.id,
        { name, description, githubBranch, githubToken, buildCommand,
          startCommand, outputDir, nodeVersion, envVars, autoDeploy, plan, region, customDomain, logoUrl, documentation },
        { new: true }
      );
      if (!project) return res.status(404).json({ message: "المشروع غير موجود" });
      res.json(project);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Delete project ─────────────────────────────────────────────────────────
  app.delete("/api/deploy/projects/:id", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "يجب تسجيل الدخول" });
      const project = await DeploymentProjectModel.findById(req.params.id).lean() as any;

      // Delete from Vercel too if applicable
      if (project?.vercelProjectId && VERCEL_TOKEN) {
        try {
          await vercelFetch(`/v9/projects/${project.vercelProjectId}`, "DELETE");
        } catch {}
      }

      await DeploymentProjectModel.findByIdAndDelete(req.params.id);
      await DeploymentRunModel.deleteMany({ projectId: req.params.id });
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Trigger deployment ─────────────────────────────────────────────────────
  app.post("/api/deploy/projects/:id/deploy", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "يجب تسجيل الدخول" });

      const project = await DeploymentProjectModel.findById(req.params.id);
      if (!project) return res.status(404).json({ message: "المشروع غير موجود" });
      if (["building", "deploying"].includes(project.status)) {
        return res.status(409).json({ message: "يوجد نشر جارٍ بالفعل" });
      }

      let commitSha = "", commitMsg = "";
      const activeToken = project.githubToken || (user as any).githubDeployToken || "";
      if (activeToken) {
        try {
          const commit = await githubFetch(
            `/repos/${project.githubOwner}/${project.githubRepo}/commits/${project.githubBranch}`,
            activeToken
          );
          commitSha = commit.sha || "";
          commitMsg = commit.commit?.message?.split("\n")[0] || "";
        } catch {}
      }

      const run = await DeploymentRunModel.create({
        projectId: project._id,
        projectSlug: project.slug,
        projectName: project.name,
        status: "queued",
        triggeredBy: user.username || "employee",
        commitSha,
        commitMsg,
        branch: project.githubBranch,
        logs: [{ time: new Date(), level: "info", message: "==> في الطابور..." }],
        startedAt: null,
        completedAt: null,
        isSimulated: !VERCEL_TOKEN,
      });

      res.json({ runId: run._id, message: "بدأ النشر", mode: VERCEL_TOKEN ? "vercel" : "simulation" });

      // Choose deployment method
      const deployFn = VERCEL_TOKEN ? deployViaVercel : simulateDeploy;
      deployFn(run, project).catch(async (err) => {
        run.status = "failed";
        run.error = err.message;
        run.completedAt = new Date();
        run.logs.push({ time: new Date(), level: "error", message: `خطأ غير متوقع: ${err.message}` });
        await run.save();
        await DeploymentProjectModel.findByIdAndUpdate(project._id, { status: "failed" });
      });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Get deployment runs for project ───────────────────────────────────────
  app.get("/api/deploy/projects/:id/runs", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "يجب تسجيل الدخول" });
      const runs = await DeploymentRunModel.find({ projectId: req.params.id })
        .sort({ createdAt: -1 }).limit(20).lean();
      res.json(runs);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Get single run logs ────────────────────────────────────────────────────
  app.get("/api/deploy/runs/:runId", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "يجب تسجيل الدخول" });
      const run = await DeploymentRunModel.findById(req.params.runId).lean();
      if (!run) return res.status(404).json({ message: "النشر غير موجود" });
      res.json(run);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Cancel deployment ─────────────────────────────────────────────────────
  app.post("/api/deploy/runs/:runId/cancel", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "يجب تسجيل الدخول" });
      const run = await DeploymentRunModel.findById(req.params.runId);
      if (!run) return res.status(404).json({ message: "النشر غير موجود" });
      run.status = "cancelled";
      run.completedAt = new Date();
      run.logs.push({ time: new Date(), level: "info", message: "==> تم الإلغاء من قِبل المستخدم" });
      await run.save();
      await DeploymentProjectModel.findByIdAndUpdate(run.projectId, { status: "idle" });
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── GitHub: list repos ─────────────────────────────────────────────────────
  app.post("/api/deploy/github/repos", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "يجب تسجيل الدخول" });
      const token = req.body.token || (user as any).githubDeployToken || "";
      if (!token) return res.status(400).json({ message: "token مطلوب" });
      const repos = await githubFetch("/user/repos?sort=updated&per_page=100&type=all", token);
      res.json(repos.map((r: any) => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        private: r.private,
        description: r.description,
        language: r.language,
        default_branch: r.default_branch,
        updated_at: r.updated_at,
        html_url: r.html_url,
        stargazers_count: r.stargazers_count,
      })));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── GitHub: list branches ──────────────────────────────────────────────────
  app.post("/api/deploy/github/branches", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "يجب تسجيل الدخول" });
      const { owner, repo } = req.body;
      const token = req.body.token || (user as any).githubDeployToken || "";
      if (!token || !owner || !repo) return res.status(400).json({ message: "token, owner, repo مطلوبة" });
      const branches = await githubFetch(`/repos/${owner}/${repo}/branches`, token);
      res.json(branches.map((b: any) => ({ name: b.name, sha: b.commit?.sha })));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── GitHub: get user info ──────────────────────────────────────────────────
  app.post("/api/deploy/github/user", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "يجب تسجيل الدخول" });
      const token = req.body.token || (user as any).githubDeployToken || "";
      if (!token) return res.status(400).json({ message: "token مطلوب" });
      const ghUser = await githubFetch("/user", token);
      res.json({ login: ghUser.login, avatar_url: ghUser.avatar_url, name: ghUser.name });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── AI: analyze deployment error ───────────────────────────────────────────
  app.post("/api/deploy/ai/analyze", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "يجب تسجيل الدخول" });
      const { logs, framework, buildCommand, errorMessage, question } = req.body;
      if (!logs && !errorMessage) return res.status(400).json({ message: "logs أو errorMessage مطلوب" });

      const { client: ai, model } = getAIClient();
      const logText = Array.isArray(logs)
        ? logs.map((l: any) => `[${l.level?.toUpperCase()}] ${l.message}`).join("\n")
        : (logs || "");

      const prompt = question
        ? `${question}\n\nسياق النشر:\nFramework: ${framework || "غير محدد"}\nبناء: ${buildCommand || "npm run build"}\nسجلات:\n${logText}`
        : `أنت خبير DevOps في QIROX Deployment Cloud. حلّل خطأ النشر التالي وقدم الحل بالعربية بوضوح ودقة.

Framework: ${framework || "غير محدد"}
Build Command: ${buildCommand || "npm run build"}
الخطأ: ${errorMessage || "انظر السجلات"}

السجلات:
${logText}

اذكر:
1. تشخيص دقيق للمشكلة
2. الحل خطوة بخطوة مع أوامر محددة
3. كيفية تجنب هذا الخطأ مستقبلاً`;

      const completion = await ai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: "أنت خبير DevOps ومهندس نشر متخصص في تحليل مشاكل البناء والنشر. تجيب بالعربية بشكل منظم وعملي. لا تكتب أي جملة بالصينية أو اليابانية." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1500,
        temperature: 0.3,
      });

      const suggestion = completion.choices[0]?.message?.content || "تعذّر التحليل";
      if (req.body.runId) {
        await DeploymentRunModel.findByIdAndUpdate(req.body.runId, { aiFixSuggestion: suggestion });
      }
      res.json({ suggestion });
    } catch (e: any) {
      console.error("[DeployCloud AI]", e.message);
      res.status(500).json({ message: e.message });
    }
  });

  // ── AI: generate project documentation ─────────────────────────────────────
  app.post("/api/deploy/projects/:id/generate-docs", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "يجب تسجيل الدخول" });
      const project = await DeploymentProjectModel.findById(req.params.id).lean() as any;
      if (!project) return res.status(404).json({ message: "المشروع غير موجود" });

      const { client: ai, model } = getAIClient();

      const prompt = `أنت خبير توثيق برمجي. اكتب توثيقاً احترافياً شاملاً لمشروع ${project.name} بالعربية.

معلومات المشروع:
- الاسم: ${project.name}
- الوصف: ${project.description || "مشروع ويب"}
- الإطار: ${project.framework || "Node.js"}
- نوع الخدمة: ${project.serviceType || "web"}
- أمر البناء: ${project.buildCommand || "npm run build"}
- أمر التشغيل: ${project.startCommand || "npm start"}
- مجلد الإخراج: ${project.outputDir || "dist"}
- إصدار Node.js: ${project.nodeVersion || "20"}
- المستودع: ${project.githubOwner}/${project.githubRepo}
- الفرع: ${project.githubBranch || "main"}

اكتب التوثيق بتنسيق Markdown يشمل:
# نظرة عامة
## متطلبات التشغيل
## التثبيت والإعداد
## أوامر مهمة
## هيكل المشروع
## النشر والاستضافة
## ملاحظات للمطورين

اجعله مفيداً وعملياً ومحدداً لهذا المشروع. لا تكتب أي جملة بالصينية أو اليابانية.`;

      const completion = await ai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: "أنت خبير توثيق برمجي متخصص. تكتب توثيقاً احترافياً واضحاً بالعربية. لا تكتب أي جملة بالصينية أو اليابانية." },
          { role: "user", content: prompt },
        ],
        max_tokens: 2000,
        temperature: 0.4,
      });

      const documentation = completion.choices[0]?.message?.content || "";
      await DeploymentProjectModel.findByIdAndUpdate(project._id, { documentation });
      res.json({ documentation });
    } catch (e: any) {
      console.error("[DeployCloud Docs]", e.message);
      res.status(500).json({ message: e.message });
    }
  });

  // ── Update project logo ─────────────────────────────────────────────────────
  app.patch("/api/deploy/projects/:id/logo", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "يجب تسجيل الدخول" });
      const { logoUrl } = req.body;
      const project = await DeploymentProjectModel.findByIdAndUpdate(
        req.params.id, { logoUrl }, { new: true }
      );
      if (!project) return res.status(404).json({ message: "المشروع غير موجود" });
      // Regenerate deploy page with new logo
      if ((project as any).isSimulated) {
        const html = generateDeployPage(project.toObject());
        saveDeployPage((project as any).slug, html);
      }
      res.json({ ok: true, logoUrl });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Stats ──────────────────────────────────────────────────────────────────
  app.get("/api/deploy/stats", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "يجب تسجيل الدخول" });
      const isAdmin = ["admin", "manager"].includes(user.role);
      const filter = isAdmin ? {} : { ownerId: String(user._id) };
      const [totalProjects, liveProjects, failedProjects, totalRuns, recentRuns] = await Promise.all([
        DeploymentProjectModel.countDocuments(filter),
        DeploymentProjectModel.countDocuments({ ...filter, status: "live" }),
        DeploymentProjectModel.countDocuments({ ...filter, status: "failed" }),
        DeploymentRunModel.countDocuments({}),
        DeploymentRunModel.find(isAdmin ? {} : {
          projectId: { $in: (await DeploymentProjectModel.find(filter).select("_id")).map(p => p._id) }
        }).sort({ createdAt: -1 }).limit(5).lean(),
      ]);
      res.json({ totalProjects, liveProjects, failedProjects, totalRuns, recentRuns, mode: VERCEL_TOKEN ? "vercel" : "simulation" });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── GitHub OAuth: availability check ──────────────────────────────────────
  app.get("/api/deploy/github/oauth/available", (req: Request, res: Response) => {
    const hasOAuth = !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
    const hasSystemToken = !!(process.env.QIROX_CLOUD_GITHUB_TOKEN);
    res.json({ available: hasOAuth, hasSystemToken });
  });

  // ── GitHub OAuth: start ────────────────────────────────────────────────────
  app.get("/api/deploy/github/oauth/start", (req: Request, res: Response) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) return res.redirect("/employee/deployment-cloud?oauth=no_config");
    const siteUrl = process.env.EMAIL_SITE_URL || `https://${req.hostname}`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${siteUrl}/api/deploy/github/oauth/callback`,
      scope: "repo user:email",
      state: "qirox_deploy",
    });
    res.redirect(`https://github.com/login/oauth/authorize?${params}`);
  });

  // ── GitHub OAuth: callback ─────────────────────────────────────────────────
  app.get("/api/deploy/github/oauth/callback", async (req: Request, res: Response) => {
    const { code } = req.query;
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    if (!code || !clientId || !clientSecret) return res.redirect("/employee/deployment-cloud?oauth=error");
    try {
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
      });
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;
      if (!accessToken) return res.redirect("/employee/deployment-cloud?oauth=error");
      (req as any).session.githubDeployToken = accessToken;
      const user = (req as any).user;
      if (user) {
        try {
          const { UserModel } = await import("./models");
          await UserModel.findByIdAndUpdate(user._id, { githubDeployToken: accessToken });
        } catch {}
      }
      res.redirect("/employee/deployment-cloud?oauth=success");
    } catch {
      res.redirect("/employee/deployment-cloud?oauth=error");
    }
  });

  // ── GitHub OAuth: connection status ───────────────────────────────────────
  app.get("/api/deploy/github/oauth/status", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ connected: false });
      const token =
        (req as any).session?.githubDeployToken ||
        (user as any).githubDeployToken ||
        process.env.QIROX_CLOUD_GITHUB_TOKEN;
      if (!token) return res.json({ connected: false });
      const ghUser = await githubFetch("/user", token);
      res.json({ connected: true, login: ghUser.login, avatar_url: ghUser.avatar_url, name: ghUser.name, token });
    } catch {
      res.json({ connected: false });
    }
  });

  // ── GitHub OAuth: disconnect ───────────────────────────────────────────────
  app.post("/api/deploy/github/oauth/disconnect", async (req: Request, res: Response) => {
    try {
      if ((req as any).session) (req as any).session.githubDeployToken = undefined;
      const user = (req as any).user;
      if (user) {
        try {
          const { UserModel } = await import("./models");
          await UserModel.findByIdAndUpdate(user._id, { $unset: { githubDeployToken: 1 } });
        } catch {}
      }
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── DNS setup guide ─────────────────────────────────────────────────────────
  app.get("/api/deploy/dns-guide", (_req: Request, res: Response) => {
    const domain = BASE_DOMAIN;
    res.json({
      domain,
      steps: [
        {
          step: 1,
          title: "افتح cPanel → Zone Editor",
          detail: `سجّل دخولك على cPanel ثم افتح Zone Editor أو DNS Zone Editor`
        },
        {
          step: 2,
          title: "أضف سجل Wildcard CNAME",
          detail: `اضغط Add Record ثم اختر CNAME`,
          record: {
            type: "CNAME",
            name: `*.${domain.split(".").slice(1).join(".")}`,
            value: "qiroxstudio.online",
            ttl: "14400"
          }
        },
        {
          step: 3,
          title: "أو استخدم A Record إن لم يعمل CNAME",
          detail: `إذا كان مزوّد DNS لا يدعم wildcard CNAME، أضف A record`,
          record: {
            type: "A",
            name: `*.${domain.split(".").slice(1).join(".")}`,
            value: "سيظهر هنا IP الخادم بعد الانتهاء من إعداد Render",
            ttl: "14400"
          }
        },
        {
          step: 4,
          title: "أضف الدومين في Render Dashboard",
          detail: `اذهب إلى Render → Service → Settings → Custom Domains → أضف *.${domain.split(".").slice(1).join(".")}`
        },
        {
          step: 5,
          title: "انتظر الانتشار",
          detail: "قد يستغرق من 10 دقائق إلى 48 ساعة حسب مزوّد DNS"
        }
      ]
    });
  });

  console.log(`[DeploymentCloud] Routes registered | Mode: ${VERCEL_TOKEN ? "Vercel (real)" : "Simulation"}`);
}

/* ══════════════════════════════════════════════════════════════
   SUBDOMAIN MIDDLEWARE
   Intercepts [slug].qiroxstudio.online (or BASE_DOMAIN) requests
   and serves the deployed project page
══════════════════════════════════════════════════════════════ */

function generateDeployPage(project: any): string {
  const isLive = project.status === "live";
  const isFailed = project.status === "failed";
  const isBuilding = project.status === "building";
  const statusColor = isLive ? "#10b981" : isFailed ? "#ef4444" : isBuilding ? "#3b82f6" : "#6b7280";
  const statusLabel = isLive ? "مباشر الآن" : isFailed ? "فشل النشر" : isBuilding ? "يُبنى الآن..." : "في الانتظار";
  const deployedAt = project.lastDeployAt
    ? new Date(project.lastDeployAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";
  const accentColor = project.avatarColor || "#6366f1";
  const logoHtml = project.logoUrl
    ? `<img src="${project.logoUrl}" alt="${project.name}" style="width:72px;height:72px;border-radius:18px;object-fit:cover;margin:0 auto 20px;display:block;box-shadow:0 8px 32px ${accentColor}44;" />`
    : `<div class="logo-icon" style="background:linear-gradient(135deg,${accentColor},${accentColor}99);">${(project.name || "Q").charAt(0).toUpperCase()}</div>`;

  const frameworkEmoji: Record<string,string> = {
    "Next.js":"⬛","Vite":"⚡","Nuxt.js":"💚","Astro":"🚀","Remix":"💿",
    "SvelteKit":"🧡","Angular":"🔴","Gatsby":"💜","Node.js":"🟢","Python":"🐍","Static":"📄",
  };
  const fwEmoji = frameworkEmoji[project.framework] || "🌐";

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name} — Qirox Cloud</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{--bg:#06060f;--card:#0e0e1a;--card2:#13131f;--border:rgba(255,255,255,.07);--text:#f0f4ff;--muted:rgba(255,255,255,.38);--accent:${accentColor}}
    body{background:var(--bg);color:var(--text);font-family:'Cairo',system-ui,sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;position:relative;overflow:hidden}
    body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 80% 60% at 50% -10%,${accentColor}18,transparent 70%);pointer-events:none}
    body::after{content:'';position:fixed;bottom:-20%;left:50%;transform:translateX(-50%);width:600px;height:400px;background:radial-gradient(ellipse,${accentColor}0c,transparent 70%);pointer-events:none}
    .grid-bg{position:fixed;inset:0;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:40px 40px;pointer-events:none}
    .card{background:var(--card);border:1px solid var(--border);border-radius:28px;padding:44px 40px;max-width:540px;width:100%;text-align:center;box-shadow:0 40px 120px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.04);position:relative;overflow:hidden}
    .card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,${accentColor}60,transparent)}
    .logo-icon{width:72px;height:72px;border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:900;color:#fff;margin:0 auto 20px;box-shadow:0 8px 32px ${accentColor}44}
    .badge{display:inline-flex;align-items:center;gap:8px;padding:7px 16px;border-radius:99px;font-size:12px;font-weight:700;background:${statusColor}18;color:${statusColor};border:1px solid ${statusColor}35;margin-bottom:22px}
    .dot{width:8px;height:8px;border-radius:50%;background:${statusColor};${isLive?"animation:pulse 2s infinite;":""}}
    @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}
    h1{font-size:30px;font-weight:900;margin-bottom:8px;letter-spacing:-.5px;line-height:1.2}
    .desc{color:var(--muted);font-size:14px;line-height:1.75;margin-bottom:32px;max-width:380px;margin-inline:auto}
    .meta{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:28px}
    .meta-item{background:rgba(255,255,255,.035);border:1px solid var(--border);border-radius:14px;padding:14px 16px;text-align:right;transition:background .2s}
    .meta-item:hover{background:rgba(255,255,255,.055)}
    .meta-label{font-size:10px;color:var(--muted);font-weight:700;letter-spacing:.8px;text-transform:uppercase;margin-bottom:5px}
    .meta-value{font-size:13px;font-weight:700;color:var(--text)}
    .actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:28px}
    .btn{display:inline-flex;align-items:center;gap:8px;color:#fff;text-decoration:none;padding:13px 24px;border-radius:14px;font-weight:800;font-size:13px;transition:all .2s}
    .btn-primary{background:linear-gradient(135deg,${accentColor},${accentColor}cc);box-shadow:0 4px 20px ${accentColor}44}
    .btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 28px ${accentColor}66}
    .btn-ghost{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}
    .btn-ghost:hover{background:rgba(255,255,255,.1)}
    .footer{padding-top:22px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:center;gap:10px;color:var(--muted);font-size:12px}
    .footer a{color:${accentColor};text-decoration:none;font-weight:700}
    .fw-tag{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--muted);background:rgba(255,255,255,.04);border:1px solid var(--border);padding:3px 10px;border-radius:99px;margin-bottom:16px}
    ${isLive ? `.live-glow{position:absolute;top:-40px;right:-40px;width:200px;height:200px;background:radial-gradient(circle,${accentColor}15,transparent 70%);pointer-events:none}` : ""}
  </style>
</head>
<body>
  <div class="grid-bg"></div>
  <div class="card">
    ${isLive ? '<div class="live-glow"></div>' : ""}
    ${logoHtml}
    <div class="fw-tag">${fwEmoji} ${project.framework || "Node.js"}</div>
    <div class="badge">
      <span class="dot"></span>
      <span>${statusLabel}</span>
    </div>
    <h1>${project.name}</h1>
    <p class="desc">${project.description || "مشروع منشور عبر Qirox Cloud"}</p>
    <div class="meta">
      <div class="meta-item">
        <div class="meta-label">الفرع</div>
        <div class="meta-value">🌿 ${project.githubBranch || "main"}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">المستودع</div>
        <div class="meta-value" style="font-size:11px">📦 ${project.githubOwner}/${project.githubRepo}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">نوع الخدمة</div>
        <div class="meta-value">🔧 ${project.serviceType === "static" ? "موقع ثابت" : project.serviceType === "cron" ? "مهمة مجدولة" : project.serviceType === "worker" ? "خلفية" : "خدمة ويب"}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">آخر نشر</div>
        <div class="meta-value" style="font-size:11px">🕐 ${deployedAt || "—"}</div>
      </div>
    </div>
    <div class="actions">
      <a class="btn btn-primary" href="https://github.com/${project.githubOwner}/${project.githubRepo}" target="_blank" rel="noopener">
        <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.2 11.4.6.1.83-.26.83-.58v-2.04c-3.34.72-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 016 0C17 4.48 18 4.8 18 4.8c.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.3c0 .32.22.69.83.57C20.56 22.3 24 17.8 24 12.5 24 5.87 18.63.5 12 .5z"/></svg>
        عرض المستودع
      </a>
      <a class="btn btn-ghost" href="https://qiroxstudio.online" target="_blank">☁️ Qirox Cloud</a>
    </div>
    <div class="footer">
      <span>نُشر بواسطة</span>
      <a href="https://qiroxstudio.online" target="_blank">Qirox Cloud</a>
      <span>·</span>
      <span>${project.ownerName || "Qirox"}</span>
    </div>
  </div>
</body>
</html>`;
}

function saveDeployPage(slug: string, html: string): void {
  try {
    const dir = path.join(os.tmpdir(), "qirox-deployments", slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "index.html"), html, "utf-8");
  } catch (e) {
    console.error("[DeployCloud] Failed to save deploy page:", e);
  }
}

export function registerSubdomainMiddleware(app: Express): void {
  // BASE_DOMAIN e.g. "deployment.qiroxstudio.online"
  // We intercept requests like:  slug.deployment.qiroxstudio.online
  const deploymentDomain = BASE_DOMAIN; // e.g. deployment.qiroxstudio.online
  const mainDomain = deploymentDomain.split(".").slice(-2).join("."); // qiroxstudio.online

  app.use(async (req: Request, res: Response, next: NextFunction) => {
    const host = (req.headers.host || "").split(":")[0].toLowerCase();

    if (!host) return next();

    // Skip main domain and www
    if (host === mainDomain || host === `www.${mainDomain}`) return next();

    // Check if this is a subdomain of deploymentDomain: slug.deployment.qiroxstudio.online
    let slug: string | null = null;
    if (host.endsWith(`.${deploymentDomain}`)) {
      slug = host.slice(0, host.length - deploymentDomain.length - 1);
    } else if (host.endsWith(`.${mainDomain}`)) {
      // fallback: slug could be "slug.deployment" — skip non-cloud subdomains
      const prefix = host.slice(0, host.length - mainDomain.length - 1);
      if (!prefix.includes(".")) slug = prefix; // only bare subdomains
    }

    if (!slug || slug === "www" || slug === "api" || slug === "mail" || slug === "smtp") return next();

    try {
      const project = await DeploymentProjectModel.findOne({ slug }).lean() as any;
      if (!project) {
        return res.status(404).send(`
          <html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>غير موجود — Qirox Cloud</title>
          <style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0a0f;color:#fff;font-family:system-ui;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center}h1{font-size:48px;font-weight:900;margin-bottom:12px;opacity:.2}p{color:rgba(255,255,255,.4);margin-bottom:32px}a{color:#6366f1;text-decoration:none;font-weight:700}</style>
          </head><body><div><h1>404</h1><p>المشروع "${slug}" غير موجود على Qirox Cloud</p><a href="https://qiroxstudio.online">العودة للرئيسية</a></div></body></html>`);
      }

      const deployDir = path.join(os.tmpdir(), "qirox-deployments", slug);
      const indexFile = path.join(deployDir, "index.html");
      if (existsSync(indexFile)) {
        return res.sendFile(indexFile);
      }

      const html = generateDeployPage(project);
      saveDeployPage(slug, html);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (e) {
      next(e);
    }
  });
}
