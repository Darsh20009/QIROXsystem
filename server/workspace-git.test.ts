import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { simpleGit } from "simple-git";
import { attachWorkspaceGitHistory } from "./workspace-git";

test("workspace attachment preserves edits and new files, then pushes with a working backup", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "qirox-workspace-git-"));
  try {
    const remote = path.join(root, "remote.git");
    const seed = path.join(root, "seed");
    const workspace = path.join(root, "workspace");
    await fs.mkdir(remote);
    await fs.mkdir(seed);
    await fs.mkdir(workspace);
    await simpleGit(remote).init(true);
    const initial = simpleGit(seed);
    await initial.init(["--initial-branch", "main"]);
    await initial.addConfig("user.name", "Test Workspace");
    await initial.addConfig("user.email", "test@example.invalid");
    await fs.writeFile(path.join(seed, "app.js"), "original\n");
    await initial.add(".");
    await initial.commit("initial");
    await initial.push(remote, "main");
    const originalSha = (await initial.revparse(["HEAD"])).trim();
    await fs.writeFile(path.join(workspace, "app.js"), "edited\n");
    await fs.writeFile(path.join(workspace, "new.js"), "new file\n");
    const git = await attachWorkspaceGitHistory(workspace, remote, remote, "main");
    assert.equal(await fs.readFile(path.join(workspace, "app.js"), "utf8"), "edited\n");
    const status = await git.status();
    assert.equal(status.isClean(), false);
    assert.ok(status.not_added.includes("new.js"));
    assert.equal((await git.revparse(["HEAD"])).trim(), originalSha);
    await git.addConfig("user.name", "Test Workspace");
    await git.addConfig("user.email", "test@example.invalid");
    await git.push(remote, `${originalSha}:refs/heads/qirox-backups/test`);
    await git.add(["-A"]);
    await git.commit("saved editor changes");
    await git.push(remote, "main");
    const remoteGit = simpleGit(remote);
    assert.equal((await remoteGit.show(["main:app.js"])), "edited\n");
    assert.equal((await remoteGit.show(["main:new.js"])), "new file\n");
    assert.equal((await remoteGit.show(["qirox-backups/test:app.js"])), "original\n");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});