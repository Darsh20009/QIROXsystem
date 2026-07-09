// ── Log Entry Contracts ───────────────────────────────────────────────────────
// All log entries share the BaseLogEntry shape.
// Specialized entries extend it with domain-specific fields.
//
// These are data contracts (plain interfaces) — no runtime behavior.

import { type LogLevel } from "./levels";
import { type LogContext } from "./context";

// ── Base entry ────────────────────────────────────────────────────────────────

export interface BaseLogEntry {
  /** Log severity level. */
  level: LogLevel;

  /** UTC timestamp of when the event occurred. */
  timestamp: Date;

  /** Human-readable description of the event. */
  message: string;

  /** Ambient request/user context. */
  context?: LogContext;

  /**
   * Arbitrary supplemental data.
   * Must be serializable (no circular refs, no class instances with methods).
   */
  data?: Record<string, unknown>;

  /**
   * Attached error — stored as a plain object so it survives serialization.
   * Use `serializeError` from the error system to populate this field.
   */
  error?: {
    name:    string;
    message: string;
    code?:   string;
    stack?:  string;
    details?: Record<string, unknown>;
  };
}

// ── Application log ───────────────────────────────────────────────────────────
// General-purpose entries: debug info, info events, warnings.

export interface ApplicationLogEntry extends BaseLogEntry {
  readonly type: "application";

  /** Module emitting the log (e.g. "auth", "cron", "ws"). */
  service?: string;

  /** Specific operation being performed (e.g. "login", "send-email"). */
  operation?: string;
}

// ── Audit log ─────────────────────────────────────────────────────────────────
// Compliance-grade trail of data mutations and access.
// Every field is required or explicitly optional for regulatory completeness.

export type AuditOutcome = "SUCCESS" | "FAILURE";

export type AuditAction =
  | "CREATE" | "READ" | "UPDATE" | "DELETE"
  | "LOGIN"  | "LOGOUT" | "EXPORT" | "IMPORT"
  | "APPROVE" | "REJECT" | "SUSPEND" | "RESTORE"
  | string; // Extensible for domain-specific actions.

export interface AuditLogEntry extends BaseLogEntry {
  readonly type: "audit";

  /** The domain action performed. */
  action: AuditAction;

  /** Resource type affected (e.g. "user", "order", "wallet"). */
  resource: string;

  /** Resource identifier. */
  resourceId?: string;

  /** ID of the user who performed the action. */
  actorId: string;

  /** Role of the actor at the time of the action. */
  actorRole: string;

  /** Outcome of the action. */
  outcome: AuditOutcome;

  /**
   * Snapshot of the resource state BEFORE the change.
   * Sensitive fields must be redacted before storing.
   */
  before?: Record<string, unknown>;

  /**
   * Snapshot of the resource state AFTER the change.
   * Sensitive fields must be redacted before storing.
   */
  after?: Record<string, unknown>;

  /** Human-readable reason (e.g. admin note for a suspension). */
  reason?: string;
}

// ── Security log ──────────────────────────────────────────────────────────────
// Tracks security-relevant events for threat detection and incident response.

export type SecurityEvent =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "LOGIN_LOCKED"
  | "LOGOUT"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET_REQUESTED"
  | "2FA_ENABLED"
  | "2FA_DISABLED"
  | "2FA_CHALLENGE_SUCCESS"
  | "2FA_CHALLENGE_FAILURE"
  | "DEVICE_TRUSTED"
  | "DEVICE_REMOVED"
  | "SESSION_HIJACK_DETECTED"
  | "RATE_LIMIT_HIT"
  | "SUSPICIOUS_REQUEST"
  | "PERMISSION_DENIED"
  | "TOKEN_REUSE_DETECTED"
  | string; // Extensible.

export interface SecurityLogEntry extends BaseLogEntry {
  readonly type: "security";

  /** The security event that occurred. */
  event: SecurityEvent;

  /** Client IP address (required for security logs). */
  ip: string;

  /** Actor who triggered the event (undefined for unauthenticated attempts). */
  actorId?: string;

  /** User-Agent string. */
  userAgent?: string;

  /** Whether the event was automatically blocked. */
  blocked: boolean;

  /** Threat description (e.g. "Repeated failed logins from same IP"). */
  threat?: string;

  /** Risk score 0–100 if computed. */
  riskScore?: number;
}

// ── Performance log ───────────────────────────────────────────────────────────
// Tracks operation latency for SLA monitoring and bottleneck detection.

export interface PerformanceLogEntry extends BaseLogEntry {
  readonly type: "performance";

  /** Name of the measured operation (e.g. "db.findUser", "email.send"). */
  operation: string;

  /** Duration in milliseconds. */
  durationMs: number;

  /**
   * Configured threshold in ms.
   * The logger will emit at WARN level if durationMs > threshold.
   */
  thresholdMs?: number;

  /** True when durationMs exceeded thresholdMs. */
  exceeded: boolean;

  /** Additional tags for grouping (e.g. { db: "main", collection: "users" }). */
  tags?: Record<string, string>;
}

// ── Union type ────────────────────────────────────────────────────────────────

export type AnyLogEntry =
  | ApplicationLogEntry
  | AuditLogEntry
  | SecurityLogEntry
  | PerformanceLogEntry;
