// ── /api/v2/customer namespace ────────────────────────────────────────────────
// Sprint B — Customer Journey V2 production APIs.
// Additive only: this is a brand-new router mounted at /api/v2/customer in
// server/routes.ts. No existing route, model, or response shape is touched.
//
// Gating: every endpoint here requires authentication (same convention as the
// existing /api/v2/client/dashboard endpoint) AND is gated behind the
// FEATURE_CUSTOMER_JOURNEY_V2 flag (server/infrastructure/feature-flags.ts),
// which already exists and defaults to false. When the flag is off, these
// routes behave as if they don't exist (404) — zero production impact until
// explicitly enabled.
//
// Data contract: responses are intentionally plain, versioned JSON (not tied
// to any client-only shape) so they can be consumed by the customer-journey
// frontend feature, an admin/CRM view, or a future mobile client without
// another breaking change.

import type { Express, Request, Response, NextFunction } from "express";
import {
  buildCustomerJourneyState,
  buildCustomerSummary,
  buildCustomerTimeline,
  buildJourneyEvents,
  buildNextRecommendedAction,
  buildCustomerHealthScore,
  buildDashboardKpis,
} from "../services/customer-journey-service";

// Roles other than "client" that may look up another customer's journey
// (e.g. CRM/support/admin staff assisting a customer). Kept narrow and
// additive — mirrors the ad-hoc `user.role === 'admin'` checks already used
// throughout server/routes.ts, just consolidated here for this namespace.
const STAFF_ROLES = new Set(["admin", "manager", "sales_manager", "sales", "support"]);

async function isCustomerJourneyV2Enabled(): Promise<boolean> {
  try {
    const { container, TOKENS, FeatureFlag } = await import("../infrastructure");
    const flags = container.tryResolve<{ isEnabled(flag: string): boolean }>(TOKENS.FeatureFlags);
    if (flags?.isEnabled) return flags.isEnabled(FeatureFlag.CUSTOMER_JOURNEY_V2);
  } catch {
    // Container not initialised yet — fall through to env fallback below.
  }
  const raw = (process.env.FEATURE_CUSTOMER_JOURNEY_V2 ?? "").toLowerCase().trim();
  return ["true", "1", "yes", "on"].includes(raw);
}

/** Feature-flag gate — returns 404 (route "does not exist") when disabled. */
function requireFlag(handler: (req: Request, res: Response) => Promise<void>) {
  return async (req: Request, res: Response, _next: NextFunction) => {
    if (!(await isCustomerJourneyV2Enabled())) {
      return res.status(404).json({ error: "Not found" });
    }
    try {
      await handler(req, res);
    } catch (err: any) {
      console.error("[CustomerV2] error:", err?.message);
      res.status(500).json({ error: "Failed to load customer data" });
    }
  };
}

/**
 * Resolve which user's data this request is allowed to see:
 *  - a "client"-role caller may only see their own data.
 *  - staff roles may pass ?userId=<id> to look up any customer.
 * Returns null (and writes the error response) if the request is not authorized.
 */
function resolveTargetUserId(req: Request, res: Response): string | null {
  const user = req.user as any;
  const requestedId = typeof req.query.userId === "string" ? req.query.userId : undefined;

  if (!requestedId || String(user.id) === requestedId) {
    return String(user.id);
  }
  if (STAFF_ROLES.has(user.role)) {
    return requestedId;
  }
  res.status(403).json({ error: "Not authorized to view this customer" });
  return null;
}

export function registerCustomerV2Routes(app: Express): void {
  // GET /api/v2/customer/journey
  // Real, database-backed Customer Journey V2 state for a customer.
  app.get("/api/v2/customer/journey", (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    return requireFlag(async (req, res) => {
      const uid = resolveTargetUserId(req, res);
      if (!uid) return;
      const journey = await buildCustomerJourneyState(uid);
      if (!journey) return res.status(404).json({ error: "Customer not found" });
      res.json({ ok: true, journey });
    })(req, res, next);
  });

  // GET /api/v2/customer/summary
  // Profile + lifecycle KPIs, real data (Orders/Projects/Invoices/Quotations/CRM).
  app.get("/api/v2/customer/summary", (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    return requireFlag(async (req, res) => {
      const uid = resolveTargetUserId(req, res);
      if (!uid) return;
      const summary = await buildCustomerSummary(uid);
      if (!summary) return res.status(404).json({ error: "Customer not found" });
      res.json({ ok: true, summary });
    })(req, res, next);
  });

  // GET /api/v2/customer/timeline
  // Chronological list of real lifecycle events (orders, quotations, invoices, projects).
  app.get("/api/v2/customer/timeline", (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    return requireFlag(async (req, res) => {
      const uid = resolveTargetUserId(req, res);
      if (!uid) return;
      const timeline = await buildCustomerTimeline(uid);
      if (!timeline) return res.status(404).json({ error: "Customer not found" });
      res.json({ ok: true, timeline });
    })(req, res, next);
  });

  // ── Sprint C additions — additive only, same auth/flag conventions above ──

  // GET /api/v2/customer/events
  // Unified narrative feed: real lifecycle records + derived journey-step
  // completion events, merged and sorted. Superset of /timeline.
  app.get("/api/v2/customer/events", (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    return requireFlag(async (req, res) => {
      const uid = resolveTargetUserId(req, res);
      if (!uid) return;
      const events = await buildJourneyEvents(uid);
      if (!events) return res.status(404).json({ error: "Customer not found" });
      res.json({ ok: true, events });
    })(req, res, next);
  });

  // GET /api/v2/customer/next-action
  // Single highest-priority recommended next step, derived from real journey state.
  app.get("/api/v2/customer/next-action", (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    return requireFlag(async (req, res) => {
      const uid = resolveTargetUserId(req, res);
      if (!uid) return;
      const action = await buildNextRecommendedAction(uid);
      res.json({ ok: true, action }); // action is null when the journey is complete
    })(req, res, next);
  });

  // GET /api/v2/customer/health
  // Composite 0-100 customer health score. Staff-only — not customer-facing
  // (a low score is an internal signal, not something to surface to the
  // customer themselves).
  app.get("/api/v2/customer/health", (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    return requireFlag(async (req, res) => {
      const user = req.user as any;
      if (!STAFF_ROLES.has(user.role)) {
        return res.status(403).json({ error: "Staff access only" });
      }
      const uid = resolveTargetUserId(req, res);
      if (!uid) return;
      const health = await buildCustomerHealthScore(uid);
      if (!health) return res.status(404).json({ error: "Customer not found" });
      res.json({ ok: true, health });
    })(req, res, next);
  });

  // GET /api/v2/customer/dashboard-kpis
  // Portfolio-wide KPIs (real MongoDB aggregation, not per-customer looping).
  // Staff-only.
  app.get("/api/v2/customer/dashboard-kpis", (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    return requireFlag(async (req, res) => {
      const user = req.user as any;
      if (!STAFF_ROLES.has(user.role)) {
        return res.status(403).json({ error: "Staff access only" });
      }
      const kpis = await buildDashboardKpis();
      res.json({ ok: true, kpis });
    })(req, res, next);
  });

  // POST /api/v2/customer/notify-next-action
  // Sends the customer's current next-recommended-action to them through the
  // existing notification hub (server/notify.ts — DB + WebSocket + Web Push).
  // A customer may trigger this for themselves (e.g. "remind me" button);
  // staff may trigger it on behalf of any customer via ?userId=.
  // No-op (200, notified:false) when there is nothing left to recommend.
  app.post("/api/v2/customer/notify-next-action", (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    return requireFlag(async (req, res) => {
      const uid = resolveTargetUserId(req, res);
      if (!uid) return;
      const action = await buildNextRecommendedAction(uid);
      if (!action) return res.json({ ok: true, notified: false });

      const { fireNotify } = await import("../notify");
      await fireNotify(uid, action.titleAr, action.descriptionAr, {
        type: "info",
        link: action.href,
      });

      res.json({ ok: true, notified: true, action });
    })(req, res, next);
  });
}
