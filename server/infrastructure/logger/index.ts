// ── Logging Foundation — Public API ───────────────────────────────────────────
// Single import point for all logging infrastructure.
//
// Import guide:
//   import { ILogger, LogLevel, LogContext } from "./logger";
//   import { generateCorrelationId, contextFromRequest } from "./logger";
//   import { AuditLogEntry, SecurityLogEntry } from "./logger";
//   import { ILogTransport } from "./logger";

// Log levels
export {
  LogLevel,
  LOG_LEVEL_LABEL,
  parseLoglevel,
  shouldLog,
} from "./levels";
export type { LogLevel as LogLevelType } from "./levels";

// Context & Correlation ID
export {
  generateCorrelationId,
  isValidCorrelationId,
  mergeContext,
  contextFromRequest,
} from "./context";
export type { LogContext } from "./context";

// Log entry contracts
export type {
  BaseLogEntry,
  ApplicationLogEntry,
  AuditLogEntry,
  SecurityLogEntry,
  PerformanceLogEntry,
  AnyLogEntry,
  AuditOutcome,
  AuditAction,
  SecurityEvent,
} from "./contracts";

// Logger interface
export type {
  ILogger,
  ILogTimer,
  LogOptions,
  AuditInput,
  SecurityInput,
  PerfInput,
} from "./ILogger";

// Transport interface & strategy
export type {
  ILogTransport,
  ConsoleTransportConfig,
  FileTransportConfig,
  HttpTransportConfig,
  TransportConfig,
} from "./transports";
export { transportShouldProcess } from "./transports";
