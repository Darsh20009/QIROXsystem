// ── Error Categories & HTTP Status Mapping ────────────────────────────────────
// Each category maps to one canonical HTTP status code.
// The serializer uses this mapping so individual errors never need to hardcode
// HTTP status codes — the category owns that contract.

export const ErrorCategory = {
  AUTHENTICATION:    "AUTHENTICATION",
  AUTHORIZATION:     "AUTHORIZATION",
  VALIDATION:        "VALIDATION",
  NOT_FOUND:         "NOT_FOUND",
  CONFLICT:          "CONFLICT",
  BUSINESS:          "BUSINESS",
  RATE_LIMIT:        "RATE_LIMIT",
  EXTERNAL:          "EXTERNAL",
  INTERNAL:          "INTERNAL",
} as const;

export type ErrorCategory = typeof ErrorCategory[keyof typeof ErrorCategory];

/** Canonical HTTP status for each error category. */
export const CATEGORY_HTTP_STATUS: Record<ErrorCategory, number> = {
  [ErrorCategory.AUTHENTICATION]: 401,
  [ErrorCategory.AUTHORIZATION]:  403,
  [ErrorCategory.VALIDATION]:     400,
  [ErrorCategory.NOT_FOUND]:      404,
  [ErrorCategory.CONFLICT]:       409,
  [ErrorCategory.BUSINESS]:       422,
  [ErrorCategory.RATE_LIMIT]:     429,
  [ErrorCategory.EXTERNAL]:       502,
  [ErrorCategory.INTERNAL]:       500,
};

/** Human-readable default message per category (used as fallback). */
export const CATEGORY_DEFAULT_MESSAGE: Record<ErrorCategory, string> = {
  [ErrorCategory.AUTHENTICATION]: "Authentication required",
  [ErrorCategory.AUTHORIZATION]:  "Insufficient permissions",
  [ErrorCategory.VALIDATION]:     "Invalid input",
  [ErrorCategory.NOT_FOUND]:      "Resource not found",
  [ErrorCategory.CONFLICT]:       "Resource conflict",
  [ErrorCategory.BUSINESS]:       "Business rule violation",
  [ErrorCategory.RATE_LIMIT]:     "Too many requests",
  [ErrorCategory.EXTERNAL]:       "External service error",
  [ErrorCategory.INTERNAL]:       "Internal server error",
};
