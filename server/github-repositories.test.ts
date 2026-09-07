import assert from "node:assert/strict";
import test from "node:test";
import {
  ensureGitHubRepository,
  githubRepositoryName,
  resolveGitHubToken,
  updateGitHubRepositoryVisibility,
} from "./github-repositories";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("repository names are stable, ASCII-only, bounded, and use an Arabic fallback", () => {
  const id = "66d0ff001122334455667788";
  assert.equal(githubRepositoryName("Client Portal", id), "client-portal-4455667788");
  assert.equal(githubRepositoryName("بوابة العميل", id), "qirox-project-4455667788");
  assert.equal(githubRepositoryName("Client Portal", id), githubRepositoryName("Client Portal", id));
  assert.match(githubRepositoryName("A".repeat(180), id), /^[a-z0-9-]{1,100}$/);
});

test("existing repositories are reused without a duplicate create request", async () => {
  const calls: Array<{ url: string; method: string }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    calls.push({ url, method: init?.method || "GET" });
    if (url.endsWith("/user")) return jsonResponse({ login: "qirox" });
    return jsonResponse({
      id: 123,
      name: "client-portal-4455667788",
      full_name: "qirox/client-portal-4455667788",
      html_url: "https://github.com/qirox/client-portal-4455667788",
      private: true,
      owner: { login: "qirox" },
    });
  };
  try {
    const repository = await ensureGitHubRepository({
      token: "test-token",
      name: "client-portal-4455667788",
      visibility: "private",
    });
    assert.equal(repository.id, "123");
    assert.equal(repository.htmlUrl, "https://github.com/qirox/client-portal-4455667788");
    assert.equal(repository.visibility, "private");
    assert.equal(calls.some(call => call.method === "POST"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("new repositories preserve the requested visibility and return persistence metadata", async () => {
  const originalFetch = globalThis.fetch;
  let createBody: any;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith("/user")) return jsonResponse({ login: "qirox" });
    if (init?.method === "POST") {
      createBody = JSON.parse(String(init.body));
      return jsonResponse({
        id: 456,
        name: createBody.name,
        full_name: `qirox/${createBody.name}`,
        html_url: `https://github.com/qirox/${createBody.name}`,
        private: createBody.private,
        owner: { login: "qirox" },
      }, 201);
    }
    return jsonResponse({ message: "Not Found" }, 404);
  };
  try {
    const repository = await ensureGitHubRepository({
      token: "test-token",
      name: "new-project-4455667788",
      description: "Project",
      visibility: "public",
    });
    assert.equal(createBody.private, false);
    assert.equal(createBody.auto_init, true);
    assert.deepEqual(
      {
        id: repository.id,
        name: repository.name,
        owner: repository.owner,
        url: repository.htmlUrl,
        visibility: repository.visibility,
      },
      {
        id: "456",
        name: "new-project-4455667788",
        owner: "qirox",
        url: "https://github.com/qirox/new-project-4455667788",
        visibility: "public",
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("visibility updates use GitHub PATCH and return the actual visibility", async () => {
  const originalFetch = globalThis.fetch;
  let requestBody: any;
  globalThis.fetch = async (_input, init) => {
    assert.equal(init?.method, "PATCH");
    requestBody = JSON.parse(String(init?.body));
    return jsonResponse({
      id: 789,
      name: "project",
      full_name: "qirox/project",
      html_url: "https://github.com/qirox/project",
      private: true,
      owner: { login: "qirox" },
    });
  };
  try {
    const repository = await updateGitHubRepositoryVisibility("test-token", "qirox", "project", "private");
    assert.equal(requestBody.private, true);
    assert.equal(repository.visibility, "private");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("ensure updates an existing repository when its visibility differs", async () => {
  const originalFetch = globalThis.fetch;
  const methods: string[] = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    methods.push(init?.method || "GET");
    if (url.endsWith("/user")) return jsonResponse({ login: "qirox" });
    if (init?.method === "PATCH") {
      return jsonResponse({
        id: 100,
        name: "project",
        full_name: "qirox/project",
        html_url: "https://github.com/qirox/project",
        private: true,
        owner: { login: "qirox" },
      });
    }
    return jsonResponse({
      id: 100,
      name: "project",
      full_name: "qirox/project",
      html_url: "https://github.com/qirox/project",
      private: false,
      owner: { login: "qirox" },
    });
  };
  try {
    const repository = await ensureGitHubRepository({ token: "test-token", name: "project", visibility: "private" });
    assert.deepEqual(methods, ["GET", "GET", "PATCH"]);
    assert.equal(repository.visibility, "private");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a concurrent create conflict adopts the repository created by the other worker", async () => {
  const originalFetch = globalThis.fetch;
  let repositoryReads = 0;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith("/user")) return jsonResponse({ login: "qirox" });
    if (init?.method === "POST") return jsonResponse({ message: "name already exists" }, 422);
    repositoryReads += 1;
    if (repositoryReads === 1) return jsonResponse({ message: "Not Found" }, 404);
    return jsonResponse({
      id: 101,
      name: "project",
      full_name: "qirox/project",
      html_url: "https://github.com/qirox/project",
      private: true,
      owner: { login: "qirox" },
    });
  };
  try {
    const repository = await ensureGitHubRepository({ token: "test-token", name: "project", visibility: "private" });
    assert.equal(repository.id, "101");
    assert.equal(repositoryReads, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("permission failures are retryable without leaking the credential", async () => {
  const originalFetch = globalThis.fetch;
  const token = "credential-that-must-not-leak";
  globalThis.fetch = async () => jsonResponse({ message: "Resource not accessible" }, 403);
  try {
    await assert.rejects(
      ensureGitHubRepository({ token, name: "project", visibility: "private" }),
      (error: any) => {
        assert.equal(error.status, 403);
        assert.equal(String(error.message).includes(token), false);
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("managed provisioning prefers the service token over an admin session token", async () => {
  const previous = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  process.env.GITHUB_PERSONAL_ACCESS_TOKEN = "managed-service-token";
  try {
    const token = await resolveGitHubToken({
      session: { githubDeployToken: "admin-session-token" },
    } as any, true);
    assert.equal(token, "managed-service-token");
  } finally {
    if (previous === undefined) delete process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    else process.env.GITHUB_PERSONAL_ACCESS_TOKEN = previous;
  }
});
