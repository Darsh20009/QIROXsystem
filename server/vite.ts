import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

// Subdomain → frontend route mapping
const SUBDOMAIN_ROUTES: Record<string, string> = {
  qmeet: "/qmeet",
  ai: "/ai-studio",
  barcode: "/barcode-studio",
  tools: "/our-tools",
};

export async function setupVite(server: Server, app: Express) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("/{*path}", async (req, res, next) => {
    // Let Express handle API routes — don't serve SPA HTML for them
    if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/auth")) return next();
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );

      // Detect subdomain and inject global for React to pick up
      const hostname = (req.hostname || req.headers.host || "").split(":")[0];
      const parts = hostname.split(".");
      if (parts.length >= 3) {
        const sub = parts[0].toLowerCase();
        const toolRoute = SUBDOMAIN_ROUTES[sub];
        if (toolRoute) {
          const injectScript = `<script>window.__QIROX_SUBDOMAIN__="${sub}";window.__QIROX_TOOL_ROUTE__="${toolRoute}";</script>`;
          template = template.replace("</head>", `${injectScript}</head>`);
        }
      }

      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
