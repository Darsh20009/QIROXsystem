// ── Error Codes ───────────────────────────────────────────────────────────────
// Stable, namespaced string codes. Format: DOMAIN_SUBJECT_CONDITION
// Codes are the contract — never rename or remove a code once published.
// Add new codes; deprecate old ones with a comment.

export const ErrorCode = {

  // ── Authentication ─────────────────────────────────────────────────────────
  AUTH_NOT_AUTHENTICATED:        "AUTH_NOT_AUTHENTICATED",
  AUTH_INVALID_CREDENTIALS:      "AUTH_INVALID_CREDENTIALS",
  AUTH_SESSION_EXPIRED:          "AUTH_SESSION_EXPIRED",
  AUTH_TOKEN_INVALID:            "AUTH_TOKEN_INVALID",
  AUTH_TOKEN_EXPIRED:            "AUTH_TOKEN_EXPIRED",
  AUTH_2FA_REQUIRED:             "AUTH_2FA_REQUIRED",
  AUTH_2FA_INVALID:              "AUTH_2FA_INVALID",
  AUTH_ACCOUNT_LOCKED:           "AUTH_ACCOUNT_LOCKED",
  AUTH_ACCOUNT_UNVERIFIED:       "AUTH_ACCOUNT_UNVERIFIED",
  AUTH_DEVICE_NOT_TRUSTED:       "AUTH_DEVICE_NOT_TRUSTED",

  // ── Authorization ──────────────────────────────────────────────────────────
  AUTHZ_FORBIDDEN:               "AUTHZ_FORBIDDEN",
  AUTHZ_INSUFFICIENT_ROLE:       "AUTHZ_INSUFFICIENT_ROLE",
  AUTHZ_RESOURCE_OWNERSHIP:      "AUTHZ_RESOURCE_OWNERSHIP",
  AUTHZ_FEATURE_DISABLED:        "AUTHZ_FEATURE_DISABLED",
  AUTHZ_QUOTA_EXCEEDED:          "AUTHZ_QUOTA_EXCEEDED",
  AUTHZ_PLAN_REQUIRED:           "AUTHZ_PLAN_REQUIRED",

  // ── Validation ────────────────────────────────────────────────────────────
  VALIDATION_REQUIRED_FIELD:     "VALIDATION_REQUIRED_FIELD",
  VALIDATION_INVALID_FORMAT:     "VALIDATION_INVALID_FORMAT",
  VALIDATION_INVALID_TYPE:       "VALIDATION_INVALID_TYPE",
  VALIDATION_OUT_OF_RANGE:       "VALIDATION_OUT_OF_RANGE",
  VALIDATION_TOO_LONG:           "VALIDATION_TOO_LONG",
  VALIDATION_TOO_SHORT:          "VALIDATION_TOO_SHORT",
  VALIDATION_INVALID_ENUM:       "VALIDATION_INVALID_ENUM",
  VALIDATION_PAYLOAD_TOO_LARGE:  "VALIDATION_PAYLOAD_TOO_LARGE",

  // ── Resource ──────────────────────────────────────────────────────────────
  RESOURCE_NOT_FOUND:            "RESOURCE_NOT_FOUND",
  RESOURCE_ALREADY_EXISTS:       "RESOURCE_ALREADY_EXISTS",
  RESOURCE_CONFLICT:             "RESOURCE_CONFLICT",
  RESOURCE_DELETED:              "RESOURCE_DELETED",
  RESOURCE_LOCKED:               "RESOURCE_LOCKED",

  // ── User domain ───────────────────────────────────────────────────────────
  USER_NOT_FOUND:                "USER_NOT_FOUND",
  USER_EMAIL_TAKEN:              "USER_EMAIL_TAKEN",
  USER_USERNAME_TAKEN:           "USER_USERNAME_TAKEN",
  USER_PROFILE_INCOMPLETE:       "USER_PROFILE_INCOMPLETE",

  // ── Order domain ──────────────────────────────────────────────────────────
  ORDER_NOT_FOUND:               "ORDER_NOT_FOUND",
  ORDER_INVALID_STATUS:          "ORDER_INVALID_STATUS",
  ORDER_ALREADY_COMPLETED:       "ORDER_ALREADY_COMPLETED",
  ORDER_PAYMENT_REQUIRED:        "ORDER_PAYMENT_REQUIRED",

  // ── Wallet domain ─────────────────────────────────────────────────────────
  WALLET_INSUFFICIENT_BALANCE:   "WALLET_INSUFFICIENT_BALANCE",
  WALLET_INVALID_PIN:            "WALLET_INVALID_PIN",
  WALLET_TRANSACTION_FAILED:     "WALLET_TRANSACTION_FAILED",
  WALLET_LOCKED:                 "WALLET_LOCKED",

  // ── File / Upload ─────────────────────────────────────────────────────────
  FILE_NOT_FOUND:                "FILE_NOT_FOUND",
  FILE_TYPE_NOT_ALLOWED:         "FILE_TYPE_NOT_ALLOWED",
  FILE_TOO_LARGE:                "FILE_TOO_LARGE",
  FILE_READ_ERROR:               "FILE_READ_ERROR",

  // ── External Services ─────────────────────────────────────────────────────
  EXTERNAL_EMAIL_FAILED:         "EXTERNAL_EMAIL_FAILED",
  EXTERNAL_PUSH_FAILED:          "EXTERNAL_PUSH_FAILED",
  EXTERNAL_PAYMENT_FAILED:       "EXTERNAL_PAYMENT_FAILED",
  EXTERNAL_AI_FAILED:            "EXTERNAL_AI_FAILED",
  EXTERNAL_STORAGE_FAILED:       "EXTERNAL_STORAGE_FAILED",
  EXTERNAL_SERVICE_UNAVAILABLE:  "EXTERNAL_SERVICE_UNAVAILABLE",

  // ── Database ──────────────────────────────────────────────────────────────
  DB_CONNECTION_FAILED:          "DB_CONNECTION_FAILED",
  DB_QUERY_FAILED:               "DB_QUERY_FAILED",
  DB_DUPLICATE_KEY:              "DB_DUPLICATE_KEY",
  DB_TRANSACTION_FAILED:         "DB_TRANSACTION_FAILED",

  // ── Rate Limiting ─────────────────────────────────────────────────────────
  RATE_LIMIT_EXCEEDED:           "RATE_LIMIT_EXCEEDED",
  RATE_LIMIT_IP_BLOCKED:         "RATE_LIMIT_IP_BLOCKED",

  // ── Internal ──────────────────────────────────────────────────────────────
  INTERNAL_UNEXPECTED:           "INTERNAL_UNEXPECTED",
  INTERNAL_NOT_IMPLEMENTED:      "INTERNAL_NOT_IMPLEMENTED",
  INTERNAL_CONFIGURATION:        "INTERNAL_CONFIGURATION",

} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];
