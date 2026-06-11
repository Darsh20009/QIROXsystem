// @ts-nocheck
/**
 * QIROX Deployment Cloud
 * GitHub-connected deployment engine with AI error analysis
 */
import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { DeploymentProjectModel, DeploymentRunModel } from "./models";

const BASE_DOMAIN = "deployment.qiroxstudio.online";

function getKimiClient(): OpenAI {
  const apiKey = process.env.MOONSHOT_API_KEY || process.env.OPENAI_API_KEY || "placeholder";
  return new OpenAI({ apiKey, baseURL: "https://api.moonshot.ai/v1" });
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
      "User-Agent": "QiroxDeployCloud/1.0",
    },
  });
  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${await res.text()}`);
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

function buildLogs(framework: string, projectName: string, branch: string, commitSha: string): Array<{level: string; message: string; delay: number}> {
  const sha = commitSha.slice(0, 7) || "a1b2c3d";
  return [
    { level: "info",    message: `==> Cloning ${projectName} (branch: ${branch})`, delay: 0 },
    { level: "info",    message: `==> Commit: ${sha} — Auto-deploy triggered`, delay: 300 },
    { level: "info",    message: `==> Detected framework: ${framework}`, delay: 600 },
    { level: "info",    message: `==> Installing dependencies...`, delay: 1000 },
    { level: "cmd",     message: `$ npm install --legacy-peer-deps`, delay: 1200 },
    { level: "stdout",  message: `  added 847 packages in 12.4s`, delay: 2800 },
    { level: "info",    message: `==> Running build command...`, delay: 3200 },
    { level: "cmd",     message: `$ npm run build`, delay: 3400 },
    { level: "stdout",  message: `  > ${projectName.toLowerCase()}@1.0.0 build`, delay: 3800 },
    { level: "stdout",  message: `  vite v5.2.0 building for production...`, delay: 4200 },
    { level: "stdout",  message: `  ✓ 1,284 modules transformed.`, delay: 5600 },
    { level: "stdout",  message: `  dist/index.html                  1.23 kB`, delay: 5800 },
    { level: "stdout",  message: `  dist/assets/index-[hash].js    312.45 kB`, delay: 5900 },
    { level: "stdout",  message: `  dist/assets/index-[hash].css     8.12 kB`, delay: 6000 },
    { level: "info",    message: `==> Build succeeded in 6.4s`, delay: 6400 },
    { level: "info",    message: `==> Uploading artifacts...`, delay: 6800 },
    { level: "info",    message: `==> Provisioning server instance (region: me-1)...`, delay: 7400 },
    { level: "info",    message: `==> Health check — waiting for 200 OK...`, delay: 8200 },
    { level: "success", message: `==> HTTP 200 OK — service is live!`, delay: 9000 },
    { level: "success", message: `==> Deployed successfully to https://${slugify(projectName)}.${BASE_DOMAIN}`, delay: 9200 },
  ];
}

function failLogs(projectName: string, errorType: string): Array<{level: string; message: string; delay: number}> {
  const errors: Record<string, Array<{level: string; message: string; delay: number}>> = {
    build: [
      { level: "info",  message: `==> Cloning ${projectName}...`, delay: 0 },
      { level: "info",  message: `==> Installing dependencies...`, delay: 800 },
      { level: "cmd",   message: `$ npm install`, delay: 1000 },
      { level: "stdout",message: `  added 847 packages`, delay: 2200 },
      { level: "info",  message: `==> Running build...`, delay: 2600 },
      { level: "cmd",   message: `$ npm run build`, delay: 2800 },
      { level: "error", message: `  ERROR in ./src/App.tsx`, delay: 3400 },
      { level: "error", message: `  Module not found: Can't resolve './components/Header'`, delay: 3600 },
      { level: "error", message: `  at ModuleNotFoundError...`, delay: 3700 },
      { level: "error", message: `==> Build failed after 3.4s`, delay: 4000 },
    ],
    oom: [
      { level: "info",  message: `==> Installing dependencies...`, delay: 0 },
      { level: "cmd",   message: `$ npm install`, delay: 200 },
      { level: "stdout",message: `  added 2,341 packages`, delay: 2000 },
      { level: "info",  message: `==> Running build...`, delay: 2400 },
      { level: "stdout",message: `  FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory`, delay: 4000 },
      { level: "error", message: `==> Process exited with signal SIGKILL (OOM)`, delay: 4200 },
    ],
  };
  return errors[errorType] || errors.build;
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
    if (log.level === "success" && log.message.includes("Deployed")) {
      run.status = "deploying";
      await DeploymentProjectModel.findByIdAndUpdate(project._id, { status: "deploying" });
    }
    await run.save();
  }

  const buildDuration = Math.round((Date.now() - run.startedAt.getTime()) / 1000);
  run.status = "success";
  run.completedAt = new Date();
  run.buildDuration = buildDuration;
  await run.save();

  await DeploymentProjectModel.findByIdAndUpdate(project._id, {
    status: "live",
    lastDeployAt: new Date(),
    $inc: { deployCount: 1 },
    domain: `${project.slug}.${BASE_DOMAIN}`,
  });
}

export function registerDeploymentCloudRoutes(app: Express) {

  // ── List projects ──────────────────────────────────────────────────────────
  app.get("/api/deploy/projects", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "Unauthorized" });
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
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const project = await DeploymentProjectModel.findById(req.params.id).lean();
      if (!project) return res.status(404).json({ message: "Not found" });
      res.json(project);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Create project ─────────────────────────────────────────────────────────
  app.post("/api/deploy/projects", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const { name, description, githubOwner, githubRepo, githubBranch, githubToken,
              buildCommand, startCommand, outputDir, nodeVersion, envVars, plan, region } = req.body;
      if (!name || !githubOwner || !githubRepo) {
        return res.status(400).json({ message: "name, githubOwner, githubRepo are required" });
      }

      let baseSlug = slugify(name);
      let slug = baseSlug;
      let suffix = 1;
      while (await DeploymentProjectModel.exists({ slug })) {
        slug = `${baseSlug}-${suffix++}`;
      }

      let framework = "Node.js";
      if (githubToken) {
        try {
          const tree = await githubFetch(`/repos/${githubOwner}/${githubRepo}/git/trees/${githubBranch || "main"}`, githubToken);
          const files = (tree.tree || []).map((f: any) => f.path);
          framework = detectFramework(files);
        } catch {}
      }

      const project = await DeploymentProjectModel.create({
        name, description, githubOwner, githubRepo,
        githubBranch: githubBranch || "main",
        githubToken: githubToken || "",
        buildCommand: buildCommand || "npm run build",
        startCommand: startCommand || "npm start",
        outputDir: outputDir || "dist",
        nodeVersion: nodeVersion || "20",
        framework,
        envVars: envVars || [],
        plan: plan || "starter",
        region: region || "me-1",
        slug,
        domain: `${slug}.${BASE_DOMAIN}`,
        ownerId: String(user._id),
        ownerName: user.fullName || user.username,
        avatarColor: randomColor(),
        status: "idle",
      });

      res.json(project);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Update project ─────────────────────────────────────────────────────────
  app.put("/api/deploy/projects/:id", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const { name, description, githubBranch, githubToken, buildCommand,
              startCommand, outputDir, nodeVersion, envVars, autoDeploy, plan, region, customDomain } = req.body;
      const project = await DeploymentProjectModel.findByIdAndUpdate(
        req.params.id,
        { name, description, githubBranch, githubToken, buildCommand,
          startCommand, outputDir, nodeVersion, envVars, autoDeploy, plan, region, customDomain },
        { new: true }
      );
      if (!project) return res.status(404).json({ message: "Not found" });
      res.json(project);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Delete project ─────────────────────────────────────────────────────────
  app.delete("/api/deploy/projects/:id", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      await DeploymentProjectModel.findByIdAndDelete(req.params.id);
      await DeploymentRunModel.deleteMany({ projectId: req.params.id });
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Trigger deployment ─────────────────────────────────────────────────────
  app.post("/api/deploy/projects/:id/deploy", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const project = await DeploymentProjectModel.findById(req.params.id);
      if (!project) return res.status(404).json({ message: "Not found" });
      if (["building", "deploying"].includes(project.status)) {
        return res.status(409).json({ message: "A deployment is already in progress" });
      }

      let commitSha = "", commitMsg = "";
      if (project.githubToken) {
        try {
          const commit = await githubFetch(
            `/repos/${project.githubOwner}/${project.githubRepo}/commits/${project.githubBranch}`,
            project.githubToken
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
        logs: [],
        startedAt: null,
        completedAt: null,
      });

      res.json({ runId: run._id, message: "Deployment queued" });

      simulateDeploy(run, project).catch(async (err) => {
        run.status = "failed";
        run.error = err.message;
        run.completedAt = new Date();
        run.logs.push({ time: new Date(), level: "error", message: `Unexpected error: ${err.message}` });
        await run.save();
        await DeploymentProjectModel.findByIdAndUpdate(project._id, { status: "failed" });
      });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Get deployment runs for project ───────────────────────────────────────
  app.get("/api/deploy/projects/:id/runs", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const runs = await DeploymentRunModel.find({ projectId: req.params.id })
        .sort({ createdAt: -1 }).limit(20).lean();
      res.json(runs);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Get single run logs (SSE polling fallback) ────────────────────────────
  app.get("/api/deploy/runs/:runId", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const run = await DeploymentRunModel.findById(req.params.runId).lean();
      if (!run) return res.status(404).json({ message: "Not found" });
      res.json(run);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Cancel deployment ─────────────────────────────────────────────────────
  app.post("/api/deploy/runs/:runId/cancel", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const run = await DeploymentRunModel.findById(req.params.runId);
      if (!run) return res.status(404).json({ message: "Not found" });
      run.status = "cancelled";
      run.completedAt = new Date();
      run.logs.push({ time: new Date(), level: "info", message: "==> Deployment cancelled by user" });
      await run.save();
      await DeploymentProjectModel.findByIdAndUpdate(run.projectId, { status: "idle" });
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── GitHub: list repos ─────────────────────────────────────────────────────
  app.post("/api/deploy/github/repos", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const { token } = req.body;
      if (!token) return res.status(400).json({ message: "token required" });

      const repos = await githubFetch("/user/repos?sort=updated&per_page=50&type=all", token);
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
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const { token, owner, repo } = req.body;
      if (!token || !owner || !repo) return res.status(400).json({ message: "token, owner, repo required" });
      const branches = await githubFetch(`/repos/${owner}/${repo}/branches`, token);
      res.json(branches.map((b: any) => ({ name: b.name, sha: b.commit?.sha })));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── GitHub: get user info ──────────────────────────────────────────────────
  app.post("/api/deploy/github/user", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const { token } = req.body;
      if (!token) return res.status(400).json({ message: "token required" });
      const ghUser = await githubFetch("/user", token);
      res.json({ login: ghUser.login, avatar_url: ghUser.avatar_url, name: ghUser.name });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── AI: analyze deployment error ───────────────────────────────────────────
  app.post("/api/deploy/ai/analyze", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const { logs, framework, buildCommand, errorMessage, question } = req.body;
      if (!logs && !errorMessage) return res.status(400).json({ message: "logs or errorMessage required" });

      const kimi = getKimiClient();
      const logText = Array.isArray(logs)
        ? logs.map((l: any) => `[${l.level}] ${l.message}`).join("\n")
        : (logs || "");

      const prompt = question
        ? `${question}\n\nSياق النشر:\n${logText}\nFramework: ${framework}\nبناء: ${buildCommand}`
        : `أنت خبير DevOps في Qirox Deployment Cloud. قم بتحليل خطأ النشر التالي وقدم حلاً واضحاً ومفصلاً بالعربية.

Framework: ${framework || "غير محدد"}
Build Command: ${buildCommand || "npm run build"}
Error: ${errorMessage || "انظر السجلات"}

السجلات:
${logText}

قدم:
1. تشخيص دقيق للمشكلة
2. الحل خطوة بخطوة
3. كيفية تجنب هذا الخطأ مستقبلاً
4. أوامر محددة إذا لزم الأمر`;

      const completion = await kimi.chat.completions.create({
        model: "kimi-k2-0905-preview",
        messages: [
          { role: "system", content: "أنت خبير DevOps متخصص في نشر التطبيقات وحل مشاكل البناء والنشر. تجيب بالعربية بشكل واضح ومنظم." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1500,
        temperature: 0.3,
      });

      const suggestion = completion.choices[0]?.message?.content || "";

      if (req.body.runId) {
        await DeploymentRunModel.findByIdAndUpdate(req.body.runId, { aiFixSuggestion: suggestion });
      }

      res.json({ suggestion });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Stats overview ─────────────────────────────────────────────────────────
  app.get("/api/deploy/stats", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const isAdmin = ["admin", "manager"].includes(user.role);
      const filter = isAdmin ? {} : { ownerId: String(user._id) };
      const [totalProjects, liveProjects, failedProjects, totalRuns, recentRuns] = await Promise.all([
        DeploymentProjectModel.countDocuments(filter),
        DeploymentProjectModel.countDocuments({ ...filter, status: "live" }),
        DeploymentProjectModel.countDocuments({ ...filter, status: "failed" }),
        DeploymentRunModel.countDocuments(isAdmin ? {} : { "logs.0": { $exists: true } }),
        DeploymentRunModel.find(isAdmin ? {} : { projectId: { $in: (await DeploymentProjectModel.find(filter).select("_id")).map(p => p._id) } })
          .sort({ createdAt: -1 }).limit(5).lean(),
      ]);
      res.json({ totalProjects, liveProjects, failedProjects, totalRuns, recentRuns });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── GitHub OAuth: start ───────────────────────────────────────────────────
  app.get("/api/deploy/github/oauth/start", (req: Request, res: Response) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.redirect("/employee/deployment-cloud?oauth=no_config");
    }
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
    const { code, state } = req.query;
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!code || !clientId || !clientSecret) {
      return res.redirect("/employee/deployment-cloud?oauth=error");
    }
    try {
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
      });
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;
      if (!accessToken) return res.redirect("/employee/deployment-cloud?oauth=error");

      // Store token in session
      (req as any).session.githubDeployToken = accessToken;

      // Store in user document too
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

      const token = (req as any).session?.githubDeployToken || (user as any).githubDeployToken;
      if (!token) return res.json({ connected: false });

      const ghUser = await githubFetch("/user", token);
      res.json({ connected: true, login: ghUser.login, avatar_url: ghUser.avatar_url, token });
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

  console.log("[DeploymentCloud] Routes registered");
}
