import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { createRequire } from "module";
import { existsSync, mkdirSync, cpSync } from "fs";

// ── Capacitor Cloud Fix ───────────────────────────────────────────────────────
// npm install crashes at ~138 packages on Capacitor Cloud, leaving
// @capacitor/ios missing from node_modules. We ship it in capacitor-ios-vendor/
// and restore it here so `cap sync` (Step 5) finds it in node_modules.
const vendorIos = path.resolve(import.meta.dirname, "capacitor-ios-vendor");
const destIos   = path.resolve(import.meta.dirname, "node_modules/@capacitor/ios");
if (existsSync(vendorIos) && !existsSync(path.join(destIos, "package.json"))) {
  try {
    mkdirSync(path.dirname(destIos), { recursive: true });
    cpSync(vendorIos, destIos, { recursive: true });
    console.log("[CapacitorFix] Restored @capacitor/ios from vendor → node_modules");
  } catch (e: any) {
    console.warn("[CapacitorFix] Could not restore @capacitor/ios:", e.message);
  }
}

// ── react-dom detection ───────────────────────────────────────────────────────
// existsSync on the directory is unreliable — npm creates an empty folder
// before crashing. Use Node's own module resolver for a definitive check.
const _require = createRequire(import.meta.url);
let hasReactDom = false;
try {
  _require.resolve("react-dom");
  hasReactDom = true;
} catch {
  hasReactDom = false;
}

const stubRoot   = path.resolve(import.meta.dirname, "capacitor-stub");
const clientRoot = path.resolve(import.meta.dirname, "client");

export default defineConfig({
  plugins: hasReactDom ? [react()] : [],
  optimizeDeps: {
    exclude: ["react-icons"],
  },
  resolve: hasReactDom
    ? {
        alias: {
          "@": path.resolve(import.meta.dirname, "client", "src"),
          "@shared": path.resolve(import.meta.dirname, "shared"),
          "@assets": path.resolve(import.meta.dirname, "attached_assets"),
        },
      }
    : {},
  root: hasReactDom ? clientRoot : stubRoot,
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    rollupOptions: {
      external: hasReactDom
        ? (id: string) => id.startsWith("@capacitor/")
        : (id: string) => id.startsWith("@capacitor/") || ["react", "react-dom", "react-dom/client"].includes(id),
      onwarn(warning, defaultHandler) {
        if (
          warning.code === "UNRESOLVED_IMPORT" &&
          (warning.exporter?.includes("react-dom") ||
            (warning as any).source?.includes("react-dom"))
        ) {
          return;
        }
        defaultHandler(warning);
      },
      output: hasReactDom
        ? {
            manualChunks: (id: string) => {
              if (id.includes("react-dom") || (id.includes("node_modules/react/") && !id.includes("react-dom"))) return "vendor-react";
              if (id.includes("@tanstack/react-query")) return "vendor-query";
              if (id.includes("lucide-react") || id.includes("framer-motion")) return "vendor-ui";
              if (id.includes("react-hook-form") || id.includes("@hookform/resolvers")) return "vendor-form";
            },
          }
        : {},
    },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
