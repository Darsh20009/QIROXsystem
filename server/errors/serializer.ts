// ── Error Serializer ──────────────────────────────────────────────────────────
// Converts AppError instances into a stable wire format for HTTP responses.
// Non-AppError values are wrapped into a generic InternalError response.
//
// Wire format (SerializedError) is the public API contract.
// Never change field names once the API is consumed by clients.

import { AppError, InternalError, isAppError } from "./AppError";
import { ErrorCode } from "./codes";
import { ErrorCategory } from "./categories";

// ── Wire format ───────────────────────────────────────────────────────────────

export interface SerializedError {
  /** Stable machine-readable code. Clients switch on this. */
  code: string;
  /** Human-readable description (may be shown to end-users). */
  message: string;
  /** Broad error family for client-side routing. */
  category: ErrorCategory;
  /** HTTP status repeated in body for clients that can't read headers. */
  httpStatus: number;
  /** Supplemental structured data (field names, limits, IDs, etc.). */
  details: Record<string, unknown>;
  /** ISO-8601 timestamp of when the error occurred. */
  timestamp: string;
  /** Optional correlation ID — populated by request-level middleware when set. */
  requestId?: string;
}

// ── Serialization ─────────────────────────────────────────────────────────────

/**
 * Serialize any thrown value into a SerializedError.
 *
 * @param err      The caught value (AppError, Error, string, unknown).
 * @param requestId Optional correlation ID from the request context.
 * @param exposeInternals When false (default, production), InternalError messages
 *                 are replaced with a generic safe message. Set true in development
 *                 to include the real message.
 */
export function serializeError(
  err: unknown,
  requestId?: string,
  exposeInternals = false,
): SerializedError {
  if (isAppError(err)) {
    const message =
      !err.isOperational && !exposeInternals
        ? "An unexpected error occurred. Please try again later."
        : err.message;

    return {
      code:        err.code,
      message,
      category:    err.category,
      httpStatus:  err.httpStatus,
      details:     err.details,
      timestamp:   err.timestamp.toISOString(),
      ...(requestId ? { requestId } : {}),
    };
  }

  // Unknown / non-AppError value — wrap it as a generic internal error.
  const wrapped = new InternalError(
    ErrorCode.INTERNAL_UNEXPECTED,
    exposeInternals && err instanceof Error ? err.message : undefined,
    {},
    err,
  );

  return {
    code:       wrapped.code,
    message:    exposeInternals
      ? (err instanceof Error ? err.message : String(err))
      : "An unexpected error occurred. Please try again later.",
    category:   wrapped.category,
    httpStatus: wrapped.httpStatus,
    details:    {},
    timestamp:  wrapped.timestamp.toISOString(),
    ...(requestId ? { requestId } : {}),
  };
}

/**
 * Determine the HTTP status code for any thrown value.
 * Useful when building middleware without full serialization.
 */
export function getHttpStatus(err: unknown): number {
  return isAppError(err) ? err.httpStatus : 500;
}

/**
 * Check whether a thrown value is safe to expose to clients
 * (i.e. it is an operational AppError, not a programming bug).
 */
export function isOperationalError(err: unknown): boolean {
  return isAppError(err) && err.isOperational;
}
