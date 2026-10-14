import assert from "node:assert/strict";
import test from "node:test";
import {
  chunkGitHubTreeWrites,
  classifyGeneratedFileEncoding,
  createGitHubBlobTreeEntries,
  GITHUB_BLOB_UPLOAD_INTERVAL_MS,
  MAX_GITHUB_TREE_REQUEST_BYTES,
  parseCanonicalGitHubRepository,
  planGitHubTreeWrites,
} from "./deployment";
import { classifyGitHubApiError, classifyGitHubApiOperation, githubRateLimitRetryDelayMs } from "../../github-repositories";

test("repository resolver only accepts canonical GitHub URLs", () => {
  assert.deepEqual(parseCanonicalGitHubRepository("https://github.com/example/cafe-app.git"), {
    owner: "example",
    name: "cafe-app",
  });
  assert.deepEqual(parseCanonicalGitHubRepository("git@github.com:example/cafe-app"), {
    owner: "example",
    name: "cafe-app",
  });
  assert.equal(parseCanonicalGitHubRepository("https://example.com/cafe-app"), null);
  assert.equal(parseCanonicalGitHubRepository("https://github.com/example/repo/tree/main"), null);
});

test("GitHub failures are classified without retaining provider error text", () => {
  assert.equal(classifyGitHubApiError(403, "Resource not accessible by personal access token"), "github_token_scope");
  assert.equal(classifyGitHubApiError(403, "GH013: Repository rule violations found"), "github_repository_rules");
  assert.equal(classifyGitHubApiError(403, "API rate limit exceeded"), "github_rate_limit");
  assert.equal(classifyGitHubApiError(429, "Too many requests"), "github_rate_limit");
  assert.equal(classifyGitHubApiError(403, "forbidden"), "github_forbidden");
});

test("GitHub API operation labels identify backup and target-branch writes", () => {
  assert.equal(classifyGitHubApiOperation("/repos/owner/repo/git/refs", "POST"), "backup_ref_create");
  assert.equal(classifyGitHubApiOperation("/repos/owner/repo/git/refs/heads/main", "PATCH"), "branch_update");
  assert.equal(classifyGitHubApiOperation("/repos/owner/repo/git/blobs", "POST"), "blob_create");
});

test("GitHub rate-limit retries respect server delay and reset headers", () => {
  assert.equal(githubRateLimitRetryDelayMs({ get: name => name === "retry-after" ? "7" : null }, 1000), 7000);
  assert.equal(githubRateLimitRetryDelayMs({
    get: name => name === "x-ratelimit-remaining" ? "0" : name === "x-ratelimit-reset" ? "12" : null,
  }, 10_000), 3_000);
  assert.equal(githubRateLimitRetryDelayMs({ get: () => null }, 0), 60_000);
});

test("GitHub tree uploads inline small UTF-8 files but keep binaries and large text as blobs", () => {
  assert.equal(classifyGeneratedFileEncoding(Buffer.from("plain text")), "utf-8");
  assert.equal(classifyGeneratedFileEncoding(Buffer.from([0, 1, 2])), "base64");

  const { entries, blobFiles } = planGitHubTreeWrites(
    [{ path: "old.txt", mode: "100644" }],
    [
      { path: "new.txt", content: Buffer.from("hello"), encoding: "utf-8" },
      { path: "large.txt", content: Buffer.alloc(128 * 1024 + 1, 65), encoding: "utf-8" },
      { path: "logo.png", content: Buffer.from([0, 1, 2]), encoding: "base64" },
    ],
  );
  assert.deepEqual(entries.map(entry => entry.path), ["old.txt", "new.txt"]);
  assert.equal(entries[0].sha, null);
  assert.equal(entries[1].content, "hello");
  assert.deepEqual(blobFiles.map(file => file.path), ["large.txt", "logo.png"]);
});

test("GitHub blob uploads are serialized and paced between writes", async () => {
  const files = ["one.bin", "two.bin", "three.bin"].map(path => ({
    path,
    content: Buffer.from([0, 1, 2]),
    encoding: "base64" as const,
  }));
  const calls: string[] = [];
  const waits: number[] = [];
  let leaseChecks = 0;
  let activeUploads = 0;
  let peakUploads = 0;
  const entries = await createGitHubBlobTreeEntries(
    files,
    async () => { leaseChecks++; },
    async file => {
      activeUploads++;
      peakUploads = Math.max(peakUploads, activeUploads);
      calls.push(file.path);
      activeUploads--;
      return `sha-${file.path}`;
    },
    async milliseconds => { waits.push(milliseconds); },
  );
  assert.deepEqual(calls, files.map(file => file.path));
  assert.equal(leaseChecks, files.length);
  assert.equal(peakUploads, 1);
  assert.deepEqual(waits, [GITHUB_BLOB_UPLOAD_INTERVAL_MS, GITHUB_BLOB_UPLOAD_INTERVAL_MS]);
  assert.deepEqual(entries.map(entry => entry.sha), files.map(file => `sha-${file.path}`));
});

test("large GitHub tree updates are split below the request-size limit", () => {
  const entries = Array.from({ length: 25 }, (_, index) => ({
    path: `src/${index}.txt`,
    mode: "100644",
    type: "blob" as const,
    content: "x".repeat(60_000),
  }));
  const chunks = chunkGitHubTreeWrites(entries);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every(chunk =>
    Buffer.byteLength(JSON.stringify({ base_tree: "0".repeat(40), tree: chunk }), "utf-8") <= MAX_GITHUB_TREE_REQUEST_BYTES
  ));
});