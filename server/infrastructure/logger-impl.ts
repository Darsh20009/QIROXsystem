// ── ConsoleLogger — ILogger Implementation ────────────────────────────────────
// Concrete implementation of the ILogger interface defined in server/logger/.
//
// Output modes:
//   development  →  human-readable, coloured, timestamped text lines
//   production   →  newline-delimited JSON (suitable for log aggregators)
//
// Design rules:
//   - Never throws — all errors are caught internally.
//   - AUDIT entries always emit regardless of minLevel.
//   - child() returns a new ConsoleLogger that merges context downward.
//
// Future: swap ConsoleLogger for a FileLogger or HttpLogger by changing
//         what is registered in the DI container — call sites are unchanged.

import {
  type ILogger,
  type LogOptions,
  type AuditInput,
  type SecurityInput,
  type PerfInput,
} from "../logger/ILogger";
import {
  type LogContext,
  mergeContext,
  generateCorrelationId,
} from "../logger/context";
import {
  LogLevel,
  LOG_LEVEL_LABEL,
  shouldLog,
  type LogLevel as LogLevelType,
} from "../logger/levels";
import type {
  ApplicationLogEntry,
  AuditLogEntry,
  SecurityLogEntry,
  PerformanceLogEntry,
} from "../logger/contracts";

// ── ANSI colour codes (development only) ─────────────────────────────────────

const NO_COLOR = process.env.NO_COLOR !== undefined;
const IS_TTY   = process.stdout.isTTY;
const USE_COLOR = IS_TTY && !NO_COLOR;

const RESET  = USE_COLOR ? "\x1b[0m"  : "";
const BOLD   = USE_COLOR ? "\x1b[1m"  : "";
const DIM    = USE_COLOR ? "\x1b[2m"  : "";
const CYAN   = USE_COLOR ? "\x1b[36m" : "";
const GREEN  = USE_COLOR ? "\x1b[32m" : "";
const YELLOW = USE_COLOR ? "\x1b[33m" : "";
const RED    = USE_COLOR ? "\x1b[31m" : "";
const MAGENTA= USE_COLOR ? "\x1b[35m" : "";
const BLUE   = USE_COLOR ? "\x1b[34m" : "";

const LEVEL_COLOR: Record<LogLevelType, string> = {
  [LogLevel.TRACE]: DIM,
  [LogLevel.DEBUG]: CYAN,
  [LogLevel.INFO]:  GREEN,
  [LogLevel.WARN]:  YELLOW,
  [LogLevel.ERROR]: RED,
  [LogLevel.FATAL]: `${BOLD}${RED}`,
  [LogLevel.AUDIT]: MAGENTA,
};

// ── Helper: serialize an unknown error ───────────────────────────────────────

function serializeError(err: unknown): ApplicationLogEntry["error"] {
  if (err instanceof Error) {
    return {
      name:    err.name,
      message: err.message,
      stack:   err.stack,
    };
  }
  return {
    name:    "UnknownError",
    message: String(err),
  };
}

// ── ConsoleLogger ─────────────────────────────────────────────────────────────

export class ConsoleLogger implements ILogger {
  private readonly isJson: boolean;
  private readonly minLevel: LogLevelType;
  private readonly boundContext: LogContext;

  constructor(options: {
    minLevel?: LogLevelType;
    json?: boolean;
    context?: LogContext;
  } = {}) {
    this.minLevel      = options.minLevel ?? LogLevel.INFO;
    this.isJson        = options.json ?? (process.env.NODE_ENV === "production");
    this.boundContext  = options.context ?? {};
  }

  // ── Standard levels ─────────────────────────────────────────────────────

  trace(message: string, options?: LogOptions): void {
    this._emit(LogLevel.TRACE, message, options);
  }

  debug(message: string, options?: LogOptions): void {
    this._emit(LogLevel.DEBUG, message, options);
  }

  info(message: string, options?: LogOptions): void {
    this._emit(LogLevel.INFO, message, options);
  }

  warn(message: string, options?: LogOptions): void {
    this._emit(LogLevel.WARN, message, options);
  }

  error(message: string, options?: LogOptions): void {
    this._emit(LogLevel.ERROR, message, options);
  }

  fatal(message: string, options?: LogOptions): void {
    this._emit(LogLevel.FATAL, message, options);
  }

  // ── Specialised log types ────────────────────────────────────────────────

  audit(input: AuditInput): void {
    // AUDIT always emits — bypasses minLevel.
    const entry: AuditLogEntry = {
      type:       "audit",
      level:      LogLevel.AUDIT,
      timestamp:  new Date(),
      message:    input.message,
      action:     input.action,
      resource:   input.resource,
      resourceId: input.resourceId,
      actorId:    input.actorId,
      actorRole:  input.actorRole,
      outcome:    input.outcome,
      before:     input.before,
      after:      input.after,
      reason:     input.reason,
      context:    mergeContext(this.boundContext, input.context ?? {}),
    };
    this._write(entry);
  }

  security(input: SecurityInput): void {
    const entry: SecurityLogEntry = {
      type:      "security",
      level:     LogLevel.ERROR,   // security events are always at least ERROR
      timestamp: new Date(),
      message:   input.message,
      event:     input.event,
      ip:        input.ip,
      actorId:   input.actorId,
      userAgent: input.userAgent,
      blocked:   input.blocked,
      threat:    input.threat,
      riskScore: input.riskScore,
      context:   mergeContext(this.boundContext, input.context ?? {}),
    };
    this._write(entry);
  }

  perf(input: PerfInput): void {
    const exceeded = input.thresholdMs !== undefined
      ? input.durationMs > input.thresholdMs
      : false;

    const level = exceeded ? LogLevel.WARN : LogLevel.DEBUG;
    if (!shouldLog(level, this.minLevel)) return;

    const entry: PerformanceLogEntry = {
      type:        "performance",
      level,
      timestamp:   new Date(),
      message:     input.message,
      operation:   input.operation,
      durationMs:  input.durationMs,
      thresholdMs: input.thresholdMs,
      exceeded,
      tags:        input.tags,
      context:     mergeContext(this.boundContext, input.context ?? {}),
    };
    this._write(entry);
  }

  // ── Context binding ──────────────────────────────────────────────────────

  child(context: Partial<LogContext>): ILogger {
    return new ConsoleLogger({
      minLevel: this.minLevel,
      json:     this.isJson,
      context:  mergeContext(this.boundContext, context),
    });
  }

  // ── Internal ─────────────────────────────────────────────────────────────

  private _emit(level: LogLevelType, message: string, options?: LogOptions): void {
    if (!shouldLog(level, this.minLevel)) return;

    const context = options?.context
      ? mergeContext(this.boundContext, options.context)
      : this.boundContext;

    const entry: ApplicationLogEntry = {
      type:      "application",
      level,
      timestamp: new Date(),
      message,
      context,
      data:      options?.data,
      error:     options?.error !== undefined ? serializeError(options.error) : undefined,
    };

    this._write(entry);
  }

  private _write(entry: { level: LogLevelType; timestamp: Date; message: string; [k: string]: unknown }): void {
    try {
      if (this.isJson) {
        this._writeJson(entry);
      } else {
        this._writeText(entry);
      }
    } catch {
      // Never throw from the logger.
    }
  }

  private _writeJson(entry: Record<string, unknown>): void {
    const line = JSON.stringify({
      ...entry,
      timestamp: (entry.timestamp as Date).toISOString(),
      level:     LOG_LEVEL_LABEL[entry.level as LogLevelType],
    });
    if ((entry.level as LogLevelType) >= LogLevel.ERROR) {
      process.stderr.write(line + "\n");
    } else {
      process.stdout.write(line + "\n");
    }
  }

  private _writeText(entry: { level: LogLevelType; timestamp: Date; message: string; context?: LogContext; [k: string]: unknown }): void {
    const level   = entry.level as LogLevelType;
    const color   = LEVEL_COLOR[level];
    const label   = LOG_LEVEL_LABEL[level].padEnd(5);
    const ts      = (entry.timestamp as Date).toISOString().replace("T", " ").slice(0, 23);
    const service = (entry.context?.service as string | undefined) ?? "";
    const reqId   = (entry.context?.requestId as string | undefined)?.slice(0, 8) ?? "";

    const prefix = [
      `${DIM}${ts}${RESET}`,
      `${color}${BOLD}${label}${RESET}`,
      service ? `${BLUE}[${service}]${RESET}` : "",
      reqId   ? `${DIM}(${reqId})${RESET}` : "",
    ].filter(Boolean).join(" ");

    const line = `${prefix} ${entry.message}`;

    if (level >= LogLevel.ERROR) {
      console.error(line);
    } else if (level === LogLevel.WARN) {
      console.warn(line);
    } else {
      console.log(line);
    }

    // Print data/error on separate indented lines in dev mode
    if (entry.data && Object.keys(entry.data as object).length > 0) {
      console.log(`  ${DIM}data${RESET}`, entry.data);
    }
    if (entry.error) {
      console.log(`  ${RED}error${RESET}`, entry.error);
    }
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Create the root application logger.
 * Called once during bootstrap; result stored in DI container.
 */
export function createLogger(options: {
  minLevel?: LogLevelType;
  json?: boolean;
  service?: string;
} = {}): ConsoleLogger {
  return new ConsoleLogger({
    minLevel: options.minLevel ?? LogLevel.INFO,
    json:     options.json,
    context:  {
      service: options.service ?? "qirox-server",
      env:     (process.env.NODE_ENV ?? "development") as LogContext["env"],
      requestId: generateCorrelationId(), // process-level trace ID
    },
  });
}
