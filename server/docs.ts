// ── OpenAPI / Swagger Documentation (Beta Readiness) ─────────────────────────
// Additive-only: mounts a read-only, unauthenticated documentation UI at
// /api-docs and the raw spec at /api-docs.json / /api-docs.yaml. Does not
// touch, wrap, or change behaviour of any existing route.
//
// Scope: docs/openapi.yaml is a curated reference covering the highest-
// traffic and highest-risk endpoint groups (health, auth, AI, mail, and the
// additive V2 domains). It is not an exhaustive spec of every route in this
// large platform — it can be extended incrementally without touching this
// file or any existing endpoint.

import type { Express } from "express";
import fs from "fs";
import path from "path";
import * as yaml from "js-yaml";
import swaggerUi from "swagger-ui-express";

let _cachedSpec: Record<string, unknown> | null = null;

function loadSpec(): Record<string, unknown> {
  if (_cachedSpec) return _cachedSpec;
  const specPath = path.resolve(process.cwd(), "docs/openapi.yaml");
  const raw = fs.readFileSync(specPath, "utf8");
  _cachedSpec = yaml.load(raw) as Record<string, unknown>;
  return _cachedSpec;
}

export function registerApiDocsRoutes(app: Express): void {
  try {
    const spec = loadSpec();

    app.get("/api-docs.json", (_req, res) => res.json(spec));
    app.get("/api-docs.yaml", (_req, res) => {
      res.type("text/yaml").send(fs.readFileSync(path.resolve(process.cwd(), "docs/openapi.yaml"), "utf8"));
    });
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(spec, {
      customSiteTitle: "QIROX Studio API Docs",
    }));

    console.log("[Docs] OpenAPI documentation mounted at /api-docs (read-only, additive)");
  } catch (err: any) {
    console.error("[Docs] Failed to mount OpenAPI documentation:", err.message);
    // Non-fatal — documentation is a dev/ops convenience, never block boot on it.
  }
}
