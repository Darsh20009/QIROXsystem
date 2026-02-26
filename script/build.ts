import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, readdir } from "fs/promises";
import { execSync } from "child_process";
import { existsSync } from "fs";

async function cleanStaleTempDirs() {
  if (!existsSync("node_modules")) return;
  try {
    const entries = await readdir("node_modules");
    let cleaned = 0;
    for (const entry of entries) {
      if (entry.startsWith(".") && entry !== ".bin" && entry !== ".cache") {
        await rm(`node_modules/${entry}`, { recursive: true, force: true });
        cleaned++;
      }
    }
    if (cleaned > 0) console.log(`[build] Removed ${cleaned} stale npm temp dir(s)`);
  } catch {
    // ignore
  }
}

async function ensureDeps() {
  const viteFdir = "node_modules/vite/node_modules/fdir";
  const rootFdir = "node_modules/fdir";
  const jiti = "node_modules/jiti";

  const depsOk = (existsSync(viteFdir) || existsSync(rootFdir)) && existsSync(jiti);

  if (!depsOk) {
    console.log("[build] Incomplete dependencies detected — fixing npm install...");
    await cleanStaleTempDirs();
    execSync("npm install --prefer-offline=false", { stdio: "inherit" });
    console.log("[build] Dependencies restored successfully");
  }
}

const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
  "mongoose",
  "connect-mongo",
];

async function buildAll() {
  await ensureDeps();

  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
