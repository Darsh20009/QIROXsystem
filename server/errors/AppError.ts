// ── AppError Hierarchy ────────────────────────────────────────────────────────
// All application errors extend AppError.
// AppError is never thrown directly — use a specific subclass.
//
// Design rules:
//   • Every error carries: code, category, httpStatus, message, optional details.
//   • `isOperational` distinguishes expected errors (true) from bugs (false).
//   • Subclasses set sensible defaults; callers can override message/details.
//   • No Express, DB, or business-logic imports here.

import { type ErrorCode } from "./codes";
import {
  ErrorCategory,
  CATEGORY_HTTP_STATUS,
  CATEGORY_DEFAULT_MESSAGE,
} from "./categories";

// ── Base class ────────────────────────────────────────────────────────────────

export interface AppErrorOptions {
  /** Stable machine-readable code. */
  code: ErrorCode;
  /** Broad error family — drives HTTP status. */
  category: ErrorCategory;
  /** Human-readable message (shown to API consumers). */
  message?: string;
  /** Structured supplemental data (field names, limits, IDs, etc.). */
  details?: Record<string, unknown>;
  /** Original caught error — kept internal, never serialized. */
  cause?: unknown;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly category: ErrorCategory;
  readonly httpStatus: number;
  readonly details: Record<string, unknown>;
  readonly cause: unknown;
  /** True = expected operational error; false = programming bug. */
  readonly isOperational: boolean;
  readonly timestamp: Date;

  constructor(options: AppErrorOptions, isOperational = true) {
    const message =
      options.message ?? CATEGORY_DEFAULT_MESSAGE[options.category];
    super(message);

    // Maintain proper prototype chain for `instanceof` checks.
    Object.setPrototypeOf(this, new.target.prototype);

    this.name        = new.target.name;
    this.code        = options.code;
    this.category    = options.category;
    this.httpStatus  = CATEGORY_HTTP_STATUS[options.category];
    this.details     = options.details ?? {};
    this.cause       = options.cause;
    this.isOperational = isOperational;
    this.timestamp   = new Date();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target);
    }
  }
}

// ── Subclasses ────────────────────────────────────────────────────────────────

export class AuthenticationError extends AppError {
  constructor(
    code: ErrorCode,
    message?: string,
    details?: Record<string, unknown>,
    cause?: unknown,
  ) {
    super({ code, category: ErrorCategory.AUTHENTICATION, message, details, cause });
  }
}

export class AuthorizationError extends AppError {
  constructor(
    code: ErrorCode,
    message?: string,
    details?: Record<string, unknown>,
    cause?: unknown,
  ) {
    super({ code, category: ErrorCategory.AUTHORIZATION, message, details, cause });
  }
}

export class ValidationError extends AppError {
  constructor(
    code: ErrorCode,
    message?: string,
    details?: Record<string, unknown>,
    cause?: unknown,
  ) {
    super({ code, category: ErrorCategory.VALIDATION, message, details, cause });
  }
}

export class NotFoundError extends AppError {
  constructor(
    code: ErrorCode,
    message?: string,
    details?: Record<string, unknown>,
    cause?: unknown,
  ) {
    super({ code, category: ErrorCategory.NOT_FOUND, message, details, cause });
  }
}

export class ConflictError extends AppError {
  constructor(
    code: ErrorCode,
    message?: string,
    details?: Record<string, unknown>,
    cause?: unknown,
  ) {
    super({ code, category: ErrorCategory.CONFLICT, message, details, cause });
  }
}

export class BusinessError extends AppError {
  constructor(
    code: ErrorCode,
    message?: string,
    details?: Record<string, unknown>,
    cause?: unknown,
  ) {
    super({ code, category: ErrorCategory.BUSINESS, message, details, cause });
  }
}

export class RateLimitError extends AppError {
  constructor(
    code: ErrorCode,
    message?: string,
    details?: Record<string, unknown>,
    cause?: unknown,
  ) {
    super({ code, category: ErrorCategory.RATE_LIMIT, message, details, cause });
  }
}

export class ExternalServiceError extends AppError {
  constructor(
    code: ErrorCode,
    message?: string,
    details?: Record<string, unknown>,
    cause?: unknown,
  ) {
    // External service failures are operational — the third-party is at fault.
    super({ code, category: ErrorCategory.EXTERNAL, message, details, cause }, true);
  }
}

export class InternalError extends AppError {
  constructor(
    code: ErrorCode,
    message?: string,
    details?: Record<string, unknown>,
    cause?: unknown,
  ) {
    // Unexpected internal errors are non-operational — they indicate bugs.
    super({ code, category: ErrorCategory.INTERNAL, message, details, cause }, false);
  }
}

// ── Type guard ────────────────────────────────────────────────────────────────

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
