import { readFile, access } from "fs/promises";
import { execSync } from "child_process";
import { existsSync } from "fs";

// dist/public (client) is pre-built in Replit and committed to the repo.
// Render only needs to bundle the server with esbuild.

const allowlist = [
  "@google/generative-ai", "axios", "connect-pg-simple", "cors", "date-fns",
  "drizzle-orm", "drizzle-zod", "express", "express-rate-limit", "express-session",
  "jsonwebtoken", "memorystore", "multer", "nanoid", "nodemailer", "openai",
  "passport", "passport-local", "pg", "stripe", "uuid", "ws", "xlsx", "zod",
  "zod-validation-error", "mongoose", "connect-mongo", "passport-google-oauth20",
  "web-push", "node-cron", "input-otp", "jsbarcode", "jspdf", "pdf-lib",
  "exceljs", "mammoth", "file-saver", "fabric", "qrcode.react", "recharts",
  "digest-fetch", "@paypal/paypal-server-sdk", "bcrypt",
];

function run(cmd, opts = {}) {
  console.log(`[build] $ ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
}

async function ensureEsbuild() {
  if (existsSync("node_modules/.bin/esbuild")) {
    console.log("[build] esbuild found in cache ✓");
    return "./node_modules/.bin/esbuild";
  }

  // esbuild is a single self-contained binary — install into /tmp to avoid
  // touching the read-only cached node_modules (ENOTEMPTY errors).
  const TOOLS = "/tmp/qirox-build-tools";
  if (existsSync(`${TOOLS}/node_modules/.bin/esbuild`)) {
    console.log("[build] esbuild found in /tmp ✓");
    return `${TOOLS}/node_modules/.bin/esbuild`;
  }

  console.log("[build] Installing esbuild into /tmp...");
  run(`npm install esbuild --prefix ${TOOLS} --no-save --ignore-scripts`, {
    env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=400" },
  });
  return `${TOOLS}/node_modules/.bin/esbuild`;
}

async function ensureNodeModules() {
  // If side-channel (a transitive dep of qs→express) is missing, the cached
  // node_modules is incomplete. Run npm ci to get a clean, complete install.
  if (!existsSync("node_modules/side-channel")) {
    console.log("[build] node_modules incomplete (side-channel missing) — running npm ci...");
    run("npm ci --ignore-scripts", {
      env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=400" },
    });
    console.log("[build] npm ci complete ✓");
  } else {
    console.log("[build] node_modules complete ✓");
  }
}

async function buildAll() {
  // Ensure all runtime dependencies are installed
  await ensureNodeModules();

  // Client is pre-built — just verify dist/public exists
  if (existsSync("dist/public/index.html")) {
    console.log("[build] dist/public already built (pre-built in repo) ✓");
  } else {
    console.error("[build] ERROR: dist/public/index.html not found!");
    console.error("[build] Run 'npm run build' locally and commit dist/public.");
    process.exit(1);
  }

  const esbuildBin = await ensureEsbuild();

  console.log("[build] Bundling server...");
  // --packages=external: bundle only project source code, leave ALL npm packages
  // as runtime requires from node_modules. This avoids transitive dep resolution
  // issues (e.g. qs → side-channel not found in Render's cached node_modules).
  run(
    `${esbuildBin} server/index.ts --platform=node --bundle --format=cjs --outfile=dist/index.cjs --define:process.env.NODE_ENV=\\"production\\" --minify --packages=external`
  );

  console.log("[build] ✅ Done! (client was pre-built, server bundled)");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
