import { rm, readFile, readdir } from "fs/promises";
import { execSync } from "child_process";
import { existsSync } from "fs";

async function cleanStaleTempDirs() {
  if (!existsSync("node_modules")) return;
  try {
    const entries = await readdir("node_modules");
    for (const entry of entries) {
      if (entry.startsWith(".") && entry !== ".bin" && entry !== ".cache" && entry !== ".package-lock.json") {
        await rm(`node_modules/${entry}`, { recursive: true, force: true });
      }
    }
    console.log("[build] Cleaned stale npm temp dirs");
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
  // Fix broken deps BEFORE importing vite (dynamic import below)
  await ensureDeps();

  await rm("dist", { recursive: true, force: true });

  // Dynamic import so vite loads AFTER deps are fixed
  console.log("building client...");
  const { build: viteBuild } = await import("vite");
  await viteBuild();

  console.log("building server...");
  const { build: esbuild } = await import("esbuild");
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
