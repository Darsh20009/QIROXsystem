// ── Core Validation Types ─────────────────────────────────────────────────────
// Foundation types used by every validation module.
//
// Purpose:
//   Provides the canonical shapes for validation results, errors, and context
//   objects. All other validation modules build on these types.
//
// Responsibilities:
//   - Define what a successful vs. failed validation looks like.
//   - Define the granular field-level error shape used in API responses.
//   - Define the execution context that flows through validation pipelines.
//
// Future migration role:
//   These types become the wire-format contract for all validation errors
//   returned to clients (Migration 007+). All schema providers (Zod, Joi,
//   manual) translate their native errors into these shapes.

// ── Severity ──────────────────────────────────────────────────────────────────

/**
 * How severe a validation finding is.
 * - "error"   — the value must be rejected.
 * - "warning" — the value may pass but the caller is informed.
 */
export type ValidationSeverity = "error" | "warning";

// ── Field-level error ─────────────────────────────────────────────────────────

/**
 * A single validation finding for one field.
 * Mirrors the shape used by react-hook-form on the client so the API and
 * the form library speak the same language.
 */
export interface FieldError {
  /** Dot-path to the offending field (e.g. "user.email", "items[0].qty"). */
  field: string;

  /**
   * Machine-readable rule that failed (e.g. "required", "minLength", "pattern").
   * Used by clients to show localised messages without parsing the message string.
   */
  rule: string;

  /** Human-readable English description of what is wrong. */
  message: string;

  /** How severe this finding is. Defaults to "error" when absent. */
  severity?: ValidationSeverity;

  /**
   * The actual value that was rejected (serialisable).
   * Omit for security-sensitive fields (passwords, tokens).
   */
  received?: unknown;

  /**
   * The expected shape or constraint as a hint string
   * (e.g. "ISO 8601 date", "1–120 characters", "positive integer").
   */
  expected?: string;
}

// ── Validation result ─────────────────────────────────────────────────────────

/**
 * The outcome of running a validator against an input value.
 *
 * Usage:
 *   const result = validator.validate(input);
 *   if (result.success) {
 *     use(result.data);  // typed and safe
 *   } else {
 *     respond(result.errors);
 *   }
 *
 * Future migration role:
 *   The express request-validation middleware unwraps this type and either
 *   calls next() (success) or calls next(validationError) (failure).
 */
export type ValidationResult<T> =
  | ValidationSuccess<T>
  | ValidationFailure;

/** A passing validation — carries the parsed, coerced output value. */
export interface ValidationSuccess<T> {
  readonly success: true;
  /** The parsed, coerced, and sanitised output value. */
  readonly data: T;
  /** Non-blocking warnings raised during validation (if any). */
  readonly warnings?: FieldError[];
}

/** A failing validation — carries field-level errors, no output value. */
export interface ValidationFailure {
  readonly success: false;
  /**
   * All field-level errors found. There will always be at least one.
   * The client renders each one as a form field error or summary item.
   */
  readonly errors: FieldError[];
}

// ── Validation context ────────────────────────────────────────────────────────

/**
 * Execution context provided to validators at runtime.
 * Validators may use this for conditional rules, locale-aware messages,
 * or cross-field checks that need request metadata.
 *
 * Future migration role:
 *   Populated by the request-validation middleware from the Express Request
 *   object and passed into IValidator.validate(input, context).
 */
export interface ValidationContext {
  /** The HTTP method of the originating request (e.g. "POST", "PATCH"). */
  method?: string;

  /** The route path of the originating request (e.g. "/api/users/:id"). */
  path?: string;

  /** The authenticated user's ID, if present. */
  userId?: string;

  /** The authenticated user's role, if present. */
  userRole?: string;

  /** BCP-47 locale from the Accept-Language header (e.g. "ar-SA", "en-US"). */
  locale?: string;

  /** Whether the request came from a trusted internal caller. */
  internal?: boolean;

  /**
   * Whether to run in "strict" mode (reject unknown fields).
   * Defaults to true.
   */
  strict?: boolean;
}

// ── Parsed input target ───────────────────────────────────────────────────────

/**
 * Which part of an HTTP request a schema targets.
 *
 * Future migration role:
 *   The request-validation middleware uses this to extract the correct
 *   part of `req` before passing it to the schema's validator.
 */
export type RequestTarget = "body" | "query" | "params" | "headers";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Construct a passing ValidationResult. */
export function success<T>(data: T, warnings?: FieldError[]): ValidationSuccess<T> {
  return warnings?.length
    ? { success: true, data, warnings }
    : { success: true, data };
}

/** Construct a failing ValidationResult from one or more FieldErrors. */
export function failure(errors: FieldError[]): ValidationFailure {
  return { success: false, errors };
}

/** Construct a single FieldError (convenience). */
export function fieldError(
  field: string,
  rule:  string,
  message: string,
  opts?: Pick<FieldError, "received" | "expected" | "severity">,
): FieldError {
  return { field, rule, message, ...opts };
}
