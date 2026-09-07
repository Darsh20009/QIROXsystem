import { rm } from "fs/promises";
import { execSync } from "child_process";
import { existsSync } from "fs";
import { build } from "esbuild";

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
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  const viteBin = existsSync("node_modules/.bin/vite") ? "./node_modules/.bin/vite" : "vite";

  console.log("building client...");
  execSync(`${viteBin} build`, { stdio: "inherit" });

  console.log("building server (fully bundled — no external deps)...");

  // import.meta shim: esbuild replaces import.meta with {} in CJS output, making
  // import.meta.url / import.meta.dirname undefined. This banner injects a proper
  // shim so any code (ours or bundled deps) that uses import.meta.url gets a real value.
  // Using esbuild JS API avoids all shell quoting issues with the banner string.
  const importMetaBanner = `var __importMeta={url:require('url').pathToFileURL(__filename).href,dirname:__dirname,filename:__filename};`;

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
