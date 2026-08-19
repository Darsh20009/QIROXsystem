// ── Health Endpoints ──────────────────────────────────────────────────────────
// Provides three health check routes as an Express Router.
// Mount this router AFTER the existing /api/health route — it is additive.
//
// Endpoints:
//   GET /health/live     Liveness — is the process alive?          → 200 always
//   GET /health/ready    Readiness — is the DB connected?          → 200 | 503
//   GET /health/detailed Full diagnostic (auth-gated in prod)      → 200 | 503
//
// The existing GET /api/health is NOT modified.
// These routes are at /health/* (no /api prefix) to match Kubernetes/Render
// conventions for load balancer health probes.

import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import process from "process";
import type { FeatureFlagEngine } from "./feature-flags";
import { FeatureFlag } from "./feature-flags";

// ── DB state helper ───────────────────────────────────────────────────────────

type DbStatus = "connected" | "disconnected" | "connecting" | "disconnecting";

function getDbStatus(): DbStatus {
  switch (mongoose.connection.readyState) {
    case 1: return "connected";
    case 2: return "connecting";
    case 3: return "disconnecting";
    default: return "disconnected";
  }
}

// ── Memory helper ─────────────────────────────────────────────────────────────

function getMemoryMb(): { rss: number; heapUsed: number; heapTotal: number; external: number } {
  const m = process.memoryUsage();
  const toMb = (b: number) => Math.round(b / 1_048_576 * 10) / 10;
  return {
    rss:       toMb(m.rss),
    heapUsed:  toMb(m.heapUsed),
    heapTotal: toMb(m.heapTotal),
    external:  toMb(m.external),
  };
}

// ── Router factory ────────────────────────────────────────────────────────────

export interface HealthRouterOptions {
  /** Build identifier (git SHA, semver, timestamp). */
  buildId?: string;

  /** Feature flag engine — used to expose flag snapshot in /health/detailed. */
  flags?: FeatureFlagEngine;

  /**
   * When true, /health/detailed is publicly accessible.
   * When false (default), /health/detailed returns 404 unless the request
   * includes an internal secret header (X-Health-Secret).
   * Controlled by the FEATURE_HEALTH_DETAILED_PUBLIC flag.
   */
  detailedPublic?: boolean;

  /** Secret expected in X-Health-Secret header for /health/detailed. */
  detailedSecret?: string;
}

// ── Singleton startup time ────────────────────────────────────────────────────

const PROCESS_START = new Date();

// ── Factory ───────────────────────────────────────────────────────────────────

export function createHealthRouter(options: HealthRouterOptions = {}): Router {
  const router = Router();

  // ── GET /health/live ───────────────────────────────────────────────────────
  // Liveness: the process is running.
  // Returns 200 always — if this fails, the process itself is dead.
  router.get("/live", (_req: Request, res: Response) => {
    res.status(200).json({
      status:    "alive",
      timestamp: new Date().toISOString(),
    });
  });

  // ── GET /health/ready ──────────────────────────────────────────────────────
  // Readiness: the process can serve traffic (DB connected).
  // Returns 503 when DB is not connected so the load balancer stops routing.
  router.get("/ready", (_req: Request, res: Response) => {
    const db      = getDbStatus();
    const isReady = db === "connected";

    res.status(isReady ? 200 : 503).json({
      status:    isReady ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: db,
          ok:     isReady,
        },
      },
    });
  });

  // ── GET /health/detailed ───────────────────────────────────────────────────
  // Full diagnostic: memory, uptime, DB, Node version, build, feature flags.
  // Access-controlled unless FEATURE_HEALTH_DETAILED_PUBLIC is enabled.
  router.get("/detailed", (req: Request, res: Response) => {
    // Access control
    const isPublic = options.flags?.isEnabled(FeatureFlag.HEALTH_DETAILED_PUBLIC) ??
                     options.detailedPublic ??
                     false;

    if (!isPublic) {
      const secret = options.detailedSecret ?? process.env.INTERNAL_HEALTH_SECRET;
      if (secret) {
        const provided = req.headers["x-health-secret"];
        if (provided !== secret) {
          res.status(404).json({ status: "not_found" });
          return;
        }
      }
      // If no secret is configured, allow in development only
      if (process.env.NODE_ENV === "production" && !secret) {
        res.status(404).json({ status: "not_found" });
        return;
      }
    }

    const db      = getDbStatus();
    const isReady = db === "connected";
    const uptimeSec = Math.floor(process.uptime());
    const memory  = getMemoryMb();

    const response: Record<string, unknown> = {
      status:    isReady ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      startedAt: PROCESS_START.toISOString(),
      uptimeSec,
      service:   "qirox-server",
      buildId:   options.buildId ?? process.env.BUILD_ID ?? "unknown",
      node:      process.version,
      env:       process.env.NODE_ENV ?? "development",
      memory,
      checks: {
        database: {
          status: db,
          ok:     isReady,
          host:   mongoose.connection.host ?? "unknown",
          name:   mongoose.connection.name ?? "unknown",
        },
        process: {
          pid:    process.pid,
          uptime: uptimeSec,
          ok:     true,
        },
      },
    };

    // Include feature flag snapshot when flags engine is available
    if (options.flags) {
      response.featureFlags = options.flags.snapshot();
    }

    res.status(isReady ? 200 : 503).json(response);
  });

  return router;
}
