// ── Log Context & Correlation ID ──────────────────────────────────────────────
// LogContext travels with every log entry to enable request tracing.
// Correlation IDs link log entries across services / async boundaries.

import { randomBytes } from "crypto";

// ── Correlation ID ────────────────────────────────────────────────────────────

/**
 * Generate a new correlation ID.
 * Format: 16 hex bytes = 32-char lowercase string.
 * Compatible with distributed tracing systems (W3C Trace Context, OpenTelemetry).
 */
export function generateCorrelationId(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Validate that a string looks like a well-formed correlation ID.
 * Accepts our own format and standard UUIDs.
 */
export function isValidCorrelationId(id: string): boolean {
  return /^[0-9a-f]{32}$/.test(id) || // our 32-char hex format
         /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id); // UUID
}

// ── Log Context ───────────────────────────────────────────────────────────────

/** Ambient context available at log-call time. All fields are optional. */
export interface LogContext {
  /** Request correlation ID — links all log entries for a single HTTP request. */
  requestId?: string;

  /** Authenticated user ID. */
  userId?: string;

  /** Authenticated user's role. */
  userRole?: string;

  /** Session identifier. */
  sessionId?: string;

  /** Client IP address. */
  ip?: string;

  /** HTTP method (GET, POST, …). */
  method?: string;

  /** API route pattern (e.g. /api/users/:id — never the raw URL with IDs). */
  route?: string;

  /** Module / service that generated the log (e.g. "auth", "wallet", "email"). */
  service?: string;

  /** Application component (e.g. "route-handler", "cron-job", "ws-handler"). */
  component?: string;

  /** Deployment environment. */
  env?: "development" | "production" | "test";

  /** Arbitrary additional key-value pairs. */
  [key: string]: unknown;
}

// ── Child context ─────────────────────────────────────────────────────────────

/**
 * Merge a parent context with additional fields.
 * Child fields override parent fields on conflict.
 */
export function mergeContext(
  parent: LogContext,
  child: Partial<LogContext>,
): LogContext {
  return { ...parent, ...child };
}

/**
 * Build a minimal context from an Express-like request shape.
 * Import type only — no runtime Express dependency.
 */
export function contextFromRequest(req: {
  method?: string;
  path?: string;
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
  user?: { id?: string; role?: string };
  session?: { id?: string };
}): LogContext {
  const requestId =
    (req.headers?.["x-request-id"] as string | undefined) ??
    (req.headers?.["x-correlation-id"] as string | undefined) ??
    generateCorrelationId();

  return {
    requestId,
    method:    req.method,
    route:     req.path,
    ip:        req.ip,
    userId:    req.user?.id,
    userRole:  req.user?.role,
    sessionId: req.session?.id,
    env:       (process.env.NODE_ENV ?? "development") as LogContext["env"],
  };
}
