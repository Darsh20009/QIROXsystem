import type { Request } from "express";
import fs from "fs";
import path from "path";

const GITHUB_API_URL = "https://api.github.com";

export type GitHubRepositoryVisibility = "public" | "private";

export type GitHubRepositoryMetadata = {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  htmlUrl: string;
  private: boolean;
  visibility: GitHubRepositoryVisibility;
};

export function githubRepositoryName(projectName: unknown, projectId?: unknown): string {
  const source = String(projectName || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  const base = (source || "qirox-project").slice(0, 62).replace(/-+$/g, "") || "qirox-project";
  const suffix = String(projectId || "").replace(/[^a-zA-Z0-9]/g, "").slice(-10).toLowerCase();
  return `${base}-${suffix || "workspace"}`.slice(0, 100);
}

export function githubRepositoryError(message: string, status?: number): Error & { status?: number } {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

export async function githubFetch(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<any> {
  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  let body: any = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { message: text }; }
  if (!response.ok) {
    throw githubRepositoryError(`GitHub API request failed (${response.status})`, response.status);
  }
  return body;
}

export async function resolveGitHubToken(req?: Request, preferManaged = false, userId?: string): Promise<string> {
  const request = req as any;
  const managedToken = String(process.env.GITHUB_PERSONAL_ACCESS_TOKEN || "");
  if (preferManaged && managedToken) return managedToken;
  const sessionToken = request?.session?.githubDeployToken;
  if (sessionToken && !userId) return String(sessionToken);

  const user = request?.user;
  const resolvedUserId = userId || user?._id || user?.id;
  if (resolvedUserId) {
    try {
      const { UserModel } = await import("./models");
      const stored = await UserModel.findById(resolvedUserId).select("+githubDeployToken").lean() as any;
      if (stored?.githubDeployToken) return String(stored.githubDeployToken);
    } catch {
      // The managed token remains a valid fallback when the user record is unavailable.
    }
  }
  return managedToken;
}

function repositoryMetadata(repository: any, ownerFallback: string): GitHubRepositoryMetadata {
  const owner = repository.owner?.login || ownerFallback;
  return {
    id: String(repository.id),
    name: String(repository.name),
    fullName: String(repository.full_name || `${owner}/${repository.name}`),
    owner,
    htmlUrl: String(repository.html_url || `https://github.com/${owner}/${repository.name}`),
    private: Boolean(repository.private),
    visibility: repository.private ? "private" : "public",
  };
}

export async function ensureGitHubRepository(input: {
  token: string;
  name: string;
  description?: string;
  visibility: GitHubRepositoryVisibility;
}): Promise<GitHubRepositoryMetadata> {
  if (!input.token) throw githubRepositoryError("GitHub connection is not configured");
  const account = await githubFetch("/user", input.token);
  const owner = String(account.login || "");
  if (!owner) throw githubRepositoryError("GitHub account could not be identified");

  try {
    const existing = await githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(input.name)}`, input.token);
    if (Boolean(existing.private) !== (input.visibility === "private")) {
      const updated = await githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(input.name)}`, input.token, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ private: input.visibility === "private" }),
      });
      return repositoryMetadata(updated, owner);
    }
    return repositoryMetadata(existing, owner);
  } catch (error: any) {
    if (error?.status !== 404) throw error;
  }

  try {
    const created = await githubFetch("/user/repos", input.token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name,
        description: input.description || "QIROX project repository",
        private: input.visibility === "private",
        auto_init: true,
      }),
    });
    return { ...repositoryMetadata(created, owner), created: true };
  } catch (error: any) {
    if (error?.status !== 422) throw error;
    const existing = await githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(input.name)}`, input.token);
    return repositoryMetadata(existing, owner);
  }
}

function normalizeList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  return String(value || "")
    .split(/\n|,|،/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function safeText(value: unknown, fallback = "غير محدد"): string {
  const text = String(value || "").trim();
  return text || fallback;
}

function escapeHtml(value: unknown): string {
  return safeText(value, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function readQiroxLogoBase64(): string {
  const candidates = [
    path.join(process.cwd(), "dist", "public", "qirox-icon-nobg.png"),
    path.join(process.cwd(), "client", "public", "qirox-icon-nobg.png"),
    path.join(process.cwd(), "client", "public", "qirox-icon.png"),
  ];
  for (const candidate of candidates) {
    try {
      return fs.readFileSync(candidate).toString("base64");
    } catch {
      // Try the next known workspace location.
    }
  }
  throw githubRepositoryError("QIROX logo asset is not available for repository seeding");
}

function createProjectDashboardHtml(input: {
  projectName: string;
  businessName: string;
  concept: string;
  audience: string;
  features: string[];
  techStack: string;
}) {
  const featureCards = input.features.length
    ? input.features.map((feature) => `<li><span class="check">✓</span>${escapeHtml(feature)}</li>`).join("")
    : "<li><span class=\"check\">✓</span>تفاصيل المشروع قيد الإعداد</li>";
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.projectName)} — QIROX Client Workspace</title>
  <style>
    :root { color-scheme: dark; --ink:#f6f7fb; --muted:#a8adbd; --line:#2b3040; --panel:#151923; --accent:#9de7d0; --accent-2:#8bb9ff; }
    * { box-sizing:border-box; } body { margin:0; min-height:100vh; background:#090b10; color:var(--ink); font:15px/1.8 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    .shell { max-width:1180px; margin:auto; padding:28px 22px 56px; } header { display:flex; justify-content:space-between; align-items:center; gap:20px; padding:8px 0 38px; }
    .brand { display:flex; align-items:center; gap:12px; font-weight:800; letter-spacing:.02em; } .brand img { width:38px; height:38px; object-fit:contain; }
    .pill { border:1px solid var(--line); border-radius:999px; padding:5px 12px; color:var(--muted); font-size:12px; }
    .hero { border:1px solid var(--line); border-radius:28px; padding:42px; background:linear-gradient(135deg,#151923,#0e1118 62%,#12221f); position:relative; overflow:hidden; }
    .hero:after { content:""; width:260px; height:260px; border:1px solid #9de7d033; border-radius:50%; position:absolute; left:-100px; bottom:-140px; }
    .eyebrow { color:var(--accent); font-size:12px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; } h1 { font-size:clamp(30px,5vw,58px); line-height:1.12; max-width:760px; margin:12px 0 14px; }
    .hero p { color:var(--muted); max-width:700px; font-size:17px; margin:0; } .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-top:16px; }
    .card { border:1px solid var(--line); border-radius:20px; background:var(--panel); padding:22px; } .card h2 { font-size:14px; margin:0 0 13px; color:var(--muted); } .value { font-size:21px; font-weight:800; }
    .layout { display:grid; grid-template-columns:1.25fr .75fr; gap:16px; margin-top:16px; } ul { list-style:none; padding:0; margin:0; } li { display:flex; gap:10px; align-items:flex-start; padding:10px 0; border-bottom:1px solid var(--line); } li:last-child { border-bottom:0; }
    .check { color:var(--accent); font-weight:900; } .steps { display:grid; gap:12px; } .step { display:flex; gap:12px; align-items:flex-start; } .number { width:26px; height:26px; display:grid; place-items:center; border-radius:50%; background:#8bb9ff22; color:var(--accent-2); font-weight:800; font-size:12px; flex:none; }
    footer { color:var(--muted); text-align:center; font-size:12px; padding:32px 0 0; } @media(max-width:760px) { .hero{padding:28px 22px}.grid,.layout{grid-template-columns:1fr} header{padding-bottom:24px} }
  </style>
</head>
<body>
  <main class="shell">
    <header><div class="brand"><img src="public/qirox-icon.png" alt="QIROX" /><span>QIROX Studio</span></div><span class="pill">Client Workspace</span></header>
    <section class="hero"><div class="eyebrow">Project workspace</div><h1>${escapeHtml(input.projectName)}</h1><p>${escapeHtml(input.concept)}</p></section>
    <section class="grid">
      <div class="card"><h2>العميل / Client</h2><div class="value">${escapeHtml(input.businessName)}</div></div>
      <div class="card"><h2>الجمهور / Audience</h2><div class="value">${escapeHtml(input.audience)}</div></div>
      <div class="card"><h2>التقنيات / Stack</h2><div class="value">${escapeHtml(input.techStack)}</div></div>
    </section>
    <section class="layout">
      <div class="card"><h2>نطاق المشروع / Project scope</h2><ul>${featureCards}</ul></div>
      <div class="card"><h2>مسار التنفيذ / Delivery path</h2><div class="steps">
        <div class="step"><span class="number">1</span><span>مراجعة الفكرة والمتطلبات</span></div>
        <div class="step"><span class="number">2</span><span>تصميم الواجهة وبناء النسخة الأولى</span></div>
        <div class="step"><span class="number">3</span><span>اختبار وتجهيز التسليم</span></div>
      </div></div>
    </section>
    <footer>Built with care by QIROX Studio · This workspace is the starting point for the project.</footer>
  </main>
</body>
</html>`;
}

export async function seedGitHubProjectRepository(input: {
  token: string;
  repository: GitHubRepositoryMetadata;
  projectName: unknown;
  businessName: unknown;
  concept: unknown;
  audience: unknown;
  features: unknown;
  techStack: unknown;
  framework: unknown;
  language: unknown;
  requiredFunctions: unknown;
  requiredSystems: unknown;
}) {
  if (!input.token) throw githubRepositoryError("GitHub connection is not configured");
  const owner = encodeURIComponent(input.repository.owner);
  const name = encodeURIComponent(input.repository.name);
  const repositoryPath = `/repos/${owner}/${name}`;
  const repository = await githubFetch(repositoryPath, input.token);
  const branch = String(repository.default_branch || "main");
  const ref = await githubFetch(`${repositoryPath}/git/ref/heads/${encodeURIComponent(branch)}`, input.token);
  const parentSha = String(ref.object?.sha || "");
  if (!parentSha) throw githubRepositoryError("GitHub repository has no writable default branch");
  const parentCommit = await githubFetch(`${repositoryPath}/git/commits/${encodeURIComponent(parentSha)}`, input.token);
  const baseTree = String(parentCommit.tree?.sha || "");
  if (!baseTree) throw githubRepositoryError("GitHub repository tree could not be read");
  const currentTree = await githubFetch(`${repositoryPath}/git/trees/${encodeURIComponent(baseTree)}?recursive=1`, input.token);
  const existingPaths = new Set((currentTree.tree || []).map((entry: any) => String(entry.path || "")));
  if (existingPaths.has("src/project-config.js") && existingPaths.has("public/qirox-icon.png")) {
    return { branch, commitSha: parentSha, files: [], alreadySeeded: true };
  }

  const projectName = safeText(input.projectName, "QIROX Project");
  const businessName = safeText(input.businessName, "QIROX Client");
  const concept = safeText(input.concept, "A focused digital experience designed and delivered by QIROX Studio.");
  const audience = safeText(input.audience, "Project customers and their teams");
  const features = normalizeList(input.features);
  const techStack = [input.techStack, input.framework, input.language].map((item) => String(item || "").trim()).filter(Boolean).join(" · ") || "To be confirmed";
  const requirements = [...normalizeList(input.requiredFunctions), ...normalizeList(input.requiredSystems)];
  const logoBase64 = readQiroxLogoBase64();
  const config = {
    name: projectName,
    client: businessName,
    concept,
    audience,
    techStack,
    features,
    requirements,
    brand: { name: "QIROX Studio", logo: "public/qirox-icon.png" },
  };
  const readme = `# ${projectName}

> A QIROX Studio project workspace for ${businessName}.

## Included

- QIROX-branded client workspace at \`index.html\`
- Project brief and delivery checklist under \`docs/\`
- Project configuration in \`src/project-config.js\`
- QIROX logo asset at \`public/qirox-icon.png\`

## Project direction

${concept}

## Quick start

This starter is intentionally dependency-free. Open \`index.html\` directly, or serve the folder with:

\`\`\`bash
npx serve .
\`\`\`

## Repository map

| Path | Purpose |
| --- | --- |
| \`index.html\` | Client-facing project workspace |
| \`src/project-config.js\` | Editable project metadata |
| \`docs/PROJECT_BRIEF.md\` | Product direction and requirements |
| \`docs/DELIVERY_CHECKLIST.md\` | Delivery readiness checklist |
| \`public/qirox-icon.png\` | QIROX brand logo |

---

Built by QIROX Studio.
`;
  const projectBrief = `# Project brief

## Overview

- **Project:** ${projectName}
- **Client:** ${businessName}
- **Audience:** ${audience}
- **Technology direction:** ${techStack}

## Concept

${concept}

## Main features

${(features.length ? features : ["Features will be confirmed during discovery."]).map((item) => `- ${item}`).join("\n")}

## Functional requirements

${(requirements.length ? requirements : ["Requirements will be confirmed during discovery."]).map((item) => `- ${item}`).join("\n")}
`;
  const checklist = `# Delivery checklist

- [ ] Confirm project concept and acceptance criteria
- [ ] Confirm visual direction and responsive states
- [ ] Complete the client-facing dashboard
- [ ] Connect project data and required integrations
- [ ] Test mobile, tablet, and desktop layouts
- [ ] Review content and brand assets with the client
- [ ] Prepare production delivery
`;
  const configJs = `export const projectConfig = ${JSON.stringify(config, null, 2)};\n`;
  const files = [
    { path: "README.md", content: readme, encoding: "utf-8" },
    { path: "docs/PROJECT_BRIEF.md", content: projectBrief, encoding: "utf-8" },
    { path: "docs/DELIVERY_CHECKLIST.md", content: checklist, encoding: "utf-8" },
    { path: "src/project-config.js", content: configJs, encoding: "utf-8" },
    { path: "public/qirox-icon.png", content: logoBase64, encoding: "base64" },
    { path: "index.html", content: createProjectDashboardHtml({ projectName, businessName, concept, audience, features, techStack }), encoding: "utf-8" },
    { path: ".gitignore", content: "node_modules/\n.env\n.DS_Store\n", encoding: "utf-8" },
  ];
  const tree = [];
  for (const file of files) {
    const blob = await githubFetch(`${repositoryPath}/git/blobs`, input.token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: file.content, encoding: file.encoding }),
    });
    tree.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
  }
  const createdTree = await githubFetch(`${repositoryPath}/git/trees`, input.token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base_tree: baseTree, tree }),
  });
  const commit = await githubFetch(`${repositoryPath}/git/commits`, input.token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "chore: initialize QIROX project workspace",
      tree: createdTree.sha,
      parents: [parentSha],
    }),
  });
  await githubFetch(`/repos/${owner}/${name}/git/refs/heads/${encodeURIComponent(branch)}`, input.token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });
  return { branch, commitSha: commit.sha, files: files.map((file) => file.path) };
}

export async function updateGitHubRepositoryVisibility(
  token: string,
  owner: string,
  name: string,
  visibility: GitHubRepositoryVisibility,
): Promise<GitHubRepositoryMetadata> {
  if (!token) throw githubRepositoryError("GitHub connection is not configured");
  const updated = await githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ private: visibility === "private" }),
  });
  return repositoryMetadata(updated, owner);
}
