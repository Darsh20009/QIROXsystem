import fs from "node:fs/promises";
import path from "node:path";
import { simpleGit } from "simple-git";

/** Attach remote history without checking out or deleting local edited files. */
export async function attachWorkspaceGitHistory(directory: string, remoteUrl: string, safeUrl: string, branch: string) {
  const git = simpleGit(directory);
  const hasGit = await fs.stat(path.join(directory, ".git")).then(() => true, () => false);
  if (hasGit) {
    const hasHead = await git.revparse(["--verify", "HEAD"]).then(() => true, () => false);
    if (hasHead) return git;
    await git.remote(["set-url", "origin", safeUrl]).catch(() => git.addRemote("origin", safeUrl));
  } else {
    await git.init(["--initial-branch", branch]);
    await git.addRemote("origin", safeUrl);
  }
  try {
    const refs = await git.listRemote([remoteUrl, `refs/heads/${branch}`]);
    if (refs.trim()) {
      await git.fetch(remoteUrl, branch, ["--depth", "1"]);
      await git.reset(["--mixed", "FETCH_HEAD"]);
    }
    return git;
  } catch {
    throw new Error("تعذر ربط سجل GitHub؛ ملفات مساحة العمل لم تُحذف");
  } finally {
    // git's fetch metadata can retain the credential-bearing transport URL.
    const fetchHead = path.join(directory, ".git", "FETCH_HEAD");
    const content = await fs.readFile(fetchHead, "utf8").catch(() => null);
    if (content !== null) await fs.writeFile(fetchHead, content.replaceAll(remoteUrl, safeUrl));
    await git.remote(["set-url", "origin", safeUrl]);
  }
}