import { rm } from "fs/promises";
import { execSync } from "child_process";
import { existsSync } from "fs";

// Only truly un-bundleable packages stay external:
// - bufferutil / utf-8-validate: optional native bindings for ws (safe to skip)
// - fsevents: macOS-only native module
// Everything else (mongoose, express, openai, etc.) gets bundled INTO dist/index.cjs
// so Render needs ZERO npm install at runtime.
const ALWAYS_EXTERNAL = [
  "bufferutil",
  "utf-8-validate",
  "fsevents",
  "@aws-sdk/client-s3",
  "onnxruntime-node",
  "passkit-generator",          // ESM-only — must stay external in CJS bundle
  "@whiskeysockets/baileys",    // ESM-only — WhatsApp client
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  // ── esbuild binary check ──────────────────────────────────────────────────
  // When npm runs with --ignore-scripts (needed to prevent the npm v10
  // "Exit handler never called!" crash on Render), esbuild's postinstall
  // doesn't execute and its platform-specific binary is never downloaded.
  // We detect this and run the install script manually before importing esbuild.
  const esbuildBin = "./node_modules/.bin/esbuild";
  if (!existsSync(esbuildBin)) {
    console.log("⚙️  esbuild binary missing (--ignore-scripts was used) — installing now...");
    execSync("node node_modules/esbuild/install.js", { stdio: "inherit" });
  }

  // ── vite binary check ─────────────────────────────────────────────────────
  const viteBin = "./node_modules/.bin/vite";
  if (!existsSync(viteBin)) {
    throw new Error("vite not found in node_modules/.bin — run npm install first");
  }

  console.log("building client...");
  execSync(`${viteBin} build`, { stdio: "inherit" });

  console.log("building server (fully bundled — no external deps)...");

  // import.meta shim: esbuild replaces import.meta with {} in CJS output, making
  // import.meta.url / import.meta.dirname undefined. This banner injects a proper
  // shim so any code (ours or bundled deps) that uses import.meta.url gets a real value.
  const importMetaBanner = `var __importMeta={url:require('url').pathToFileURL(__filename).href,dirname:__dirname,filename:__filename};`;

  // Dynamic import so the module resolves AFTER the binary is confirmed present.
  const { build } = await import("esbuild");

  await build({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
      "import.meta": "__importMeta",
    },
    banner: {
      js: importMetaBanner,
    },
    minify: true,
    external: ALWAYS_EXTERNAL,
    logLevel: "info",
  });

  console.log("✅ Build complete — dist/index.cjs is fully self-contained.");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
