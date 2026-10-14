// ── ILogger Interface ─────────────────────────────────────────────────────────
// The single interface every logger implementation must satisfy.
// Code depends on ILogger, never on a concrete implementation.
// This enables swapping transports (console → file → Datadog) without
// changing call sites.

import { type LogContext } from "./context";
import {
  type AuditLogEntry,
  type SecurityLogEntry,
  type PerformanceLogEntry,
  type AuditAction,
  type AuditOutcome,
  type SecurityEvent,
} from "./contracts";

// ── Shorthand input types ─────────────────────────────────────────────────────
// Callers don't construct full entry objects — they use these lean input shapes.

export interface LogOptions {
  context?: LogContext;
  data?:    Record<string, unknown>;
  error?:   unknown;
}

export interface AuditInput {
  message:     string;
  action:      AuditAction;
  resource:    string;
  resourceId?: string;
  actorId:     string;
  actorRole:   string;
  outcome:     AuditOutcome;
  before?:     Record<string, unknown>;
  after?:      Record<string, unknown>;
  reason?:     string;
  context?:    LogContext;
}

export interface SecurityInput {
  message:    string;
  event:      SecurityEvent;
  ip:         string;
  actorId?:   string;
  userAgent?: string;
  blocked:    boolean;
  threat?:    string;
  riskScore?: number;
  context?:   LogContext;
}

export interface PerfInput {
  message:      string;
  operation:    string;
  durationMs:   number;
  thresholdMs?: number;
  tags?:        Record<string, string>;
  context?:     LogContext;
}

// ── Core interface ────────────────────────────────────────────────────────────

export interface ILogger {

  // ── Standard levels ──────────────────────────────────────────────────────

  /** Very verbose detail — development only. */
  trace(message: string, options?: LogOptions): void;

  /** Diagnostic information useful during debugging. */
  debug(message: string, options?: LogOptions): void;

  /** Normal operational events (startup, request received, job run). */
  info(message: string, options?: LogOptions): void;

  /** Degraded but recoverable conditions (retry, fallback, slow query). */
  warn(message: string, options?: LogOptions): void;

  /** Operational errors that need attention but don't crash the process. */
  error(message: string, options?: LogOptions): void;

  /** Unrecoverable errors — process likely needs restart. */
  fatal(message: string, options?: LogOptions): void;

  // ── Specialized log types ─────────────────────────────────────────────────

  /** Compliance-grade audit trail entry — always persisted. */
  audit(input: AuditInput): void;

  /** Security event entry — used by intrusion detection. */
  security(input: SecurityInput): void;

  /** Performance measurement — used for SLA tracking and bottleneck detection. */
  perf(input: PerfInput): void;

  // ── Context binding ───────────────────────────────────────────────────────

  /**
   * Create a child logger that inherits the current context and merges
   * additional context fields. All log calls on the child carry both contexts.
   *
   * Typical use: create a child per request in middleware and pass it down.
   *
   *   const reqLogger = logger.child({ requestId, userId });
   *   reqLogger.info("Processing order");  // includes requestId + userId
   */
  child(context: Partial<LogContext>): ILogger;
}

// ── Timer helper interface ────────────────────────────────────────────────────
// Returned by ILogger implementations that expose `startTimer`.

export interface ILogTimer {
  /**
   * Stop the timer and emit a performance log entry.
   * @param tags Optional additional tags to attach.
   */
  done(tags?: Record<string, string>): void;
}
