// ── Log Levels ────────────────────────────────────────────────────────────────
// Ordered numerically so comparisons work: level >= LogLevel.WARN.
// AUDIT is special — it bypasses minimum-level filters (compliance requirement).

export const LogLevel = {
  TRACE:  0,
  DEBUG:  1,
  INFO:   2,
  WARN:   3,
  ERROR:  4,
  FATAL:  5,
  AUDIT:  6, // Always logged regardless of configured minimum level.
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

/** Human-readable label for each level. */
export const LOG_LEVEL_LABEL: Record<LogLevel, string> = {
  [LogLevel.TRACE]: "TRACE",
  [LogLevel.DEBUG]: "DEBUG",
  [LogLevel.INFO]:  "INFO",
  [LogLevel.WARN]:  "WARN",
  [LogLevel.ERROR]: "ERROR",
  [LogLevel.FATAL]: "FATAL",
  [LogLevel.AUDIT]: "AUDIT",
};

/**
 * Resolve a log level from an environment string (e.g. process.env.LOG_LEVEL).
 * Falls back to INFO when the string is unrecognised.
 */
export function parseLoglevel(raw: string | undefined): LogLevel {
  switch ((raw ?? "").toUpperCase()) {
    case "TRACE": return LogLevel.TRACE;
    case "DEBUG": return LogLevel.DEBUG;
    case "INFO":  return LogLevel.INFO;
    case "WARN":  return LogLevel.WARN;
    case "ERROR": return LogLevel.ERROR;
    case "FATAL": return LogLevel.FATAL;
    default:      return LogLevel.INFO;
  }
}

/** Returns true when `candidate` should be emitted given `minimum`. */
export function shouldLog(candidate: LogLevel, minimum: LogLevel): boolean {
  if (candidate === LogLevel.AUDIT) return true; // AUDIT bypasses all filters.
  return candidate >= minimum;
}
