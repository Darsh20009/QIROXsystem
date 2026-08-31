import type { Request } from "express";

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
    return repositoryMetadata(created, owner);
  } catch (error: any) {
    if (error?.status !== 422) throw error;
    const existing = await githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(input.name)}`, input.token);
    return repositoryMetadata(existing, owner);
  }
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
