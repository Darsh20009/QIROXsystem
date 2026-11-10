import fs from "node:fs";

const lockPath = "package-lock.json";
const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
const privateRegistryHosts = new Set([
  "package-firewall.replit.internal",
  "package-firewall.replit.local",
]);
let changed = 0;

for (const entry of Object.values(lock.packages ?? {})) {
  if (typeof entry.resolved !== "string") continue;

  const resolved = new URL(entry.resolved);
  if (!privateRegistryHosts.has(resolved.hostname) || !resolved.pathname.startsWith("/npm/")) {
    continue;
  }

  resolved.protocol = "https:";
  resolved.hostname = "registry.npmjs.org";
  resolved.port = "";
  resolved.pathname = resolved.pathname.slice("/npm".length);
  entry.resolved = resolved.href;
  changed++;
}

if (changed > 0) {
  fs.writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
}

console.log(`Normalized ${changed} Replit package-proxy URLs for Render.`);
