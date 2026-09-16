// ── Transport Interface & Strategy ────────────────────────────────────────────
// A transport is responsible for writing a single log entry to one destination.
// Multiple transports can be composed for fan-out (e.g. console + file + remote).
//
// Built-in transport stubs are defined here so future migrations can activate
// them by simply implementing the `write` method.
// No transport is instantiated or activated in this file.

import { type AnyLogEntry } from "./contracts";
import { type LogLevel, shouldLog } from "./levels";

// ── Core interface ────────────────────────────────────────────────────────────

export interface ILogTransport {
  /** Human-readable name (used in diagnostics). */
  readonly name: string;

  /** Minimum log level this transport will process. */
  readonly minLevel: LogLevel;

  /**
   * Write a single log entry to the transport's destination.
   * Implementations must never throw — catch and swallow/report internally.
   */
  write(entry: AnyLogEntry): void | Promise<void>;
}

// ── Filtering helper ──────────────────────────────────────────────────────────

/**
 * Returns true when a transport should process the given entry.
 * Delegates to `shouldLog` so AUDIT bypass rules are respected.
 */
export function transportShouldProcess(
  transport: ILogTransport,
  entry: AnyLogEntry,
): boolean {
  return shouldLog(entry.level, transport.minLevel);
}

// ── Transport stubs ───────────────────────────────────────────────────────────
// These describe the intended transports.
// Implementations will be added in a future migration (Migration 005+).

/**
 * ConsoleTransport — writes coloured, human-readable output to stdout/stderr.
 * Suitable for development and container environments with log aggregation.
 *
 * Future implementation notes:
 *   - Use chalk/kleur for colour in development; plain JSON in production.
 *   - Write ERROR/FATAL to stderr; everything else to stdout.
 *   - Respect NO_COLOR env var.
 */
export interface ConsoleTransportConfig {
  readonly name: "console";
  minLevel: LogLevel;
  /** Output structured JSON instead of human-readable text. */
  json?: boolean;
  /** Include colour codes (development only). */
  color?: boolean;
}

/**
 * FileTransport — appends newline-delimited JSON to a rotating log file.
 * Suitable for on-premise deployments or audit log archival.
 *
 * Future implementation notes:
 *   - Use `fs.appendFile` with async queue to avoid blocking.
 *   - Rotate by size (e.g. 50 MB) or by day.
 *   - Separate file per entry type: app.log, audit.log, security.log.
 */
export interface FileTransportConfig {
  readonly name: "file";
  minLevel: LogLevel;
  /** Absolute path to the log directory. */
  directory: string;
  /** Max file size in bytes before rotation (default 50 MB). */
  maxBytes?: number;
  /** Number of rotated files to keep (default 7). */
  maxFiles?: number;
}

/**
 * HttpTransport — POSTs JSON log batches to a remote endpoint.
 * Suitable for Datadog, Logtail, Grafana Loki, Elastic, or a custom collector.
 *
 * Future implementation notes:
 *   - Buffer entries and flush on interval (e.g. every 5 s) or batch size.
 *   - Retry with exponential back-off on 5xx responses.
 *   - Drop oldest entries when buffer overflows (circuit-breaker pattern).
 *   - Redact sensitive fields before transmission.
 */
export interface HttpTransportConfig {
  readonly name: "http";
  minLevel: LogLevel;
  /** Full URL of the log ingestion endpoint. */
  endpoint: string;
  /** Authorization header value (e.g. "Bearer <token>"). */
  authHeader?: string;
  /** Batch size before flushing (default 100). */
  batchSize?: number;
  /** Flush interval in ms (default 5000). */
  flushIntervalMs?: number;
}

export type TransportConfig =
  | ConsoleTransportConfig
  | FileTransportConfig
  | HttpTransportConfig;
