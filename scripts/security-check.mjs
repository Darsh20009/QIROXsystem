import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const trackedFiles = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);

const highConfidenceRules = [
  {
    name: "private-key-material",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----[\s\S]{80,}?-----END /,
  },
  {
    name: "mongodb-credential-uri",
    pattern: /mongodb(?:\+srv)?:\/\/(?!user:pass@)[^<>{}\s"'`]+:[^<>{}\s"'`]+@/i,
  },
  {
    name: "github-token",
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{30,}\b/,
  },
  {
    name: "provider-secret",
    pattern: /\b(?:sk_live|sk_test|rk_live|rk_test)_[A-Za-z0-9]{20,}\b|\bAKIA[0-9A-Z]{16}\b/,
  },
];

const findings = [];
for (const file of trackedFiles) {
  if (file.startsWith("node_modules/") || file.startsWith("dist/")) continue;
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const rule of highConfidenceRules) {
    if (rule.pattern.test(content)) findings.push(`${file}: ${rule.name}`);
  }
}

if (findings.length) {
  console.error("High-confidence secret material detected in tracked files:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(`Secret guard passed: scanned ${trackedFiles.length} tracked files.`);