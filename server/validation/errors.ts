// ── Validation Error Types ────────────────────────────────────────────────────
// Typed error codes, HTTP status mapping, and wire-format serialisation.
//
// Purpose:
//   Provide machine-readable error codes for validation failures so clients
//   can show localised messages without parsing server strings.
//   Map validation failures to the correct HTTP status codes.
//   Serialise FieldError[] into a consistent wire format.
//
// Responsibilities:
//   - ValidationErrorCode enum — every possible rule name as a string constant.
//   - ValidationErrorCategory — logical groupings (type, constraint, custom…).
//   - toApiValidationError() — converts FieldError[] to a wire-format object.
//   - fromFieldErrors()     — adapts FieldError[] to AppError (from Migration 003).
//
// Future migration role:
//   The Express validation middleware (Migration 007+) calls toApiValidationError()
//   to build the response body when req.body fails schema validation.
//   The client reads errorCode to drive i18n without string matching.

import type { FieldError } from "./types";

// ── Error codes ───────────────────────────────────────────────────────────────

/**
 * Machine-readable validation rule names.
 * Mirror react-hook-form rule names where applicable so frontend and backend
 * share a common vocabulary.
 */
export const ValidationErrorCode = {
  // ── Presence ──────────────────────────────────────────────────────────────
  /** Value is absent or undefined. */
  REQUIRED:           "required",
  /** Value is null. */
  NOT_NULL:           "notNull",
  /** Value is empty string, array, or object. */
  NOT_EMPTY:          "notEmpty",

  // ── Type ──────────────────────────────────────────────────────────────────
  /** Value is not a string. */
  INVALID_STRING:     "invalidString",
  /** Value is not a number. */
  INVALID_NUMBER:     "invalidNumber",
  /** Value is not a boolean. */
  INVALID_BOOLEAN:    "invalidBoolean",
  /** Value is not an array. */
  INVALID_ARRAY:      "invalidArray",
  /** Value is not an object. */
  INVALID_OBJECT:     "invalidObject",
  /** Value is not a valid date or date string. */
  INVALID_DATE:       "invalidDate",

  // ── String constraints ────────────────────────────────────────────────────
  /** String shorter than minimum length. */
  MIN_LENGTH:         "minLength",
  /** String longer than maximum length. */
  MAX_LENGTH:         "maxLength",
  /** String does not match required regex pattern. */
  PATTERN:            "pattern",
  /** Value is not a valid email address. */
  INVALID_EMAIL:      "invalidEmail",
  /** Value is not a valid URL. */
  INVALID_URL:        "invalidUrl",
  /** Value is not a valid UUID. */
  INVALID_UUID:       "invalidUuid",
  /** Value is not a valid MongoDB ObjectId. */
  INVALID_OBJECT_ID:  "invalidObjectId",
  /** Value is not a valid phone number. */
  INVALID_PHONE:      "invalidPhone",

  // ── Numeric constraints ───────────────────────────────────────────────────
  /** Number less than minimum. */
  MIN:                "min",
  /** Number greater than maximum. */
  MAX:                "max",
  /** Number is not an integer. */
  INTEGER:            "integer",
  /** Number is not positive. */
  POSITIVE:           "positive",
  /** Number is not non-negative. */
  NON_NEGATIVE:       "nonNegative",

  // ── Array constraints ─────────────────────────────────────────────────────
  /** Array has fewer elements than minimum. */
  MIN_ITEMS:          "minItems",
  /** Array has more elements than maximum. */
  MAX_ITEMS:          "maxItems",
  /** Array has duplicate items when unique is required. */
  UNIQUE_ITEMS:       "uniqueItems",

  // ── Enum / membership ─────────────────────────────────────────────────────
  /** Value is not one of the allowed enum members. */
  INVALID_ENUM:       "invalidEnum",
  /** Value is not in an allowed set. */
  NOT_ALLOWED:        "notAllowed",

  // ── Structure ─────────────────────────────────────────────────────────────
  /** Object has extra fields that are not allowed (strict mode). */
  UNKNOWN_FIELD:      "unknownField",
  /** Schema mismatch — none of the union branches matched. */
  UNION_MISMATCH:     "unionMismatch",

  // ── Cross-field ───────────────────────────────────────────────────────────
  /** Two fields that should match do not (e.g. password + confirm). */
  FIELDS_MISMATCH:    "fieldsMismatch",
  /** A field is required only when another field has a specific value. */
  CONDITIONAL_REQUIRED: "conditionalRequired",

  // ── Business rules ────────────────────────────────────────────────────────
  /** Value already exists in the database (uniqueness violation). */
  ALREADY_EXISTS:     "alreadyExists",
  /** Referenced resource was not found. */
  NOT_FOUND:          "notFound",
  /** Value was accepted but has been normalised (informational). */
  NORMALISED:         "normalised",

  // ── Catch-all ─────────────────────────────────────────────────────────────
  /** None of the specific codes apply. */
  CUSTOM:             "custom",
} as const;

export type ValidationErrorCode = typeof ValidationErrorCode[keyof typeof ValidationErrorCode];

// ── Error categories ──────────────────────────────────────────────────────────

/**
 * Logical groupings for validation error codes.
 * Clients can group errors by category in the UI.
 */
export const ValidationErrorCategory = {
  /** Value was absent. */
  PRESENCE:    "presence",
  /** Value has the wrong type. */
  TYPE:        "type",
  /** Value violated a size/length/range constraint. */
  CONSTRAINT:  "constraint",
  /** Value failed a format check (email, UUID, phone). */
  FORMAT:      "format",
  /** Value was not in an allowed set. */
  MEMBERSHIP:  "membership",
  /** Object structure was invalid. */
  STRUCTURE:   "structure",
  /** Two or more fields are inconsistent with each other. */
  CROSS_FIELD: "crossField",
  /** Violates a business rule (uniqueness, existence). */
  BUSINESS:    "business",
  /** Custom rule not covered by the above. */
  CUSTOM:      "custom",
} as const;

export type ValidationErrorCategory = typeof ValidationErrorCategory[keyof typeof ValidationErrorCategory];

/** Maps each error code to its category (used for grouping in API responses). */
export const VALIDATION_ERROR_CATEGORY_MAP: Readonly<Record<ValidationErrorCode, ValidationErrorCategory>> = {
  required:            "presence",
  notNull:             "presence",
  notEmpty:            "presence",
  invalidString:       "type",
  invalidNumber:       "type",
  invalidBoolean:      "type",
  invalidArray:        "type",
  invalidObject:       "type",
  invalidDate:         "type",
  minLength:           "constraint",
  maxLength:           "constraint",
  pattern:             "format",
  invalidEmail:        "format",
  invalidUrl:          "format",
  invalidUuid:         "format",
  invalidObjectId:     "format",
  invalidPhone:        "format",
  min:                 "constraint",
  max:                 "constraint",
  integer:             "constraint",
  positive:            "constraint",
  nonNegative:         "constraint",
  minItems:            "constraint",
  maxItems:            "constraint",
  uniqueItems:         "constraint",
  invalidEnum:         "membership",
  notAllowed:          "membership",
  unknownField:        "structure",
  unionMismatch:       "structure",
  fieldsMismatch:      "crossField",
  conditionalRequired: "crossField",
  alreadyExists:       "business",
  notFound:            "business",
  normalised:          "business",
  custom:              "custom",
};

// ── HTTP status mapping ───────────────────────────────────────────────────────

/**
 * HTTP status code to return when a validation error occurs.
 * Business-rule violations (alreadyExists, notFound) may warrant 409/404;
 * all other validation failures use 422.
 */
export const VALIDATION_HTTP_STATUS_MAP: Partial<Record<ValidationErrorCode, number>> = {
  alreadyExists: 409,
  notFound:      404,
  notAllowed:    403,
};

/** Returns the appropriate HTTP status code for a set of field errors. */
export function validationHttpStatus(errors: FieldError[]): number {
  for (const err of errors) {
    const code   = err.rule as ValidationErrorCode;
    const mapped = VALIDATION_HTTP_STATUS_MAP[code];
    if (mapped) return mapped;
  }
  return 422;
}

// ── Wire format ───────────────────────────────────────────────────────────────

/**
 * The canonical API response body for validation failures.
 * Clients parse this shape to show form errors and summary messages.
 *
 * Future migration role:
 *   The validation middleware (Migration 007+) returns this shape as JSON
 *   with the status code from validationHttpStatus().
 */
export interface ApiValidationError {
  /** Always "validation_error" — lets clients branch without status code. */
  type: "validation_error";

  /** Human-readable summary (e.g. "3 fields failed validation"). */
  message: string;

  /** HTTP status code that will be set on the response. */
  status: number;

  /** Individual field errors. */
  errors: ApiFieldError[];
}

/** A field error in wire format (safe to send to clients). */
export interface ApiFieldError {
  field:    string;
  rule:     string;
  message:  string;
  category: ValidationErrorCategory;
  severity: "error" | "warning";
}

/**
 * Convert FieldError[] to the canonical API wire format.
 * Filters out received/expected values for security before serialisation.
 */
export function toApiValidationError(errors: FieldError[]): ApiValidationError {
  const status = validationHttpStatus(errors);
  const count  = errors.filter(e => (e.severity ?? "error") === "error").length;
  return {
    type:    "validation_error",
    message: count === 1 ? "1 field failed validation" : `${count} fields failed validation`,
    status,
    errors:  errors.map(e => ({
      field:    e.field,
      rule:     e.rule,
      message:  e.message,
      category: VALIDATION_ERROR_CATEGORY_MAP[e.rule as ValidationErrorCode] ?? "custom",
      severity: e.severity ?? "error",
    })),
  };
}
