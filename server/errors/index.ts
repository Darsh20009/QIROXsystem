// ── Core Error System — Public API ────────────────────────────────────────────
// Single import point for all error infrastructure.
//
// Import guide:
//   import { AppError, NotFoundError, ValidationError } from "./errors";
//   import { ErrorCode }    from "./errors";
//   import { ErrorCategory } from "./errors";
//   import { ok, err, Result, tryAsync } from "./errors";
//   import { serializeError } from "./errors";

// Error hierarchy
export {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  BusinessError,
  RateLimitError,
  ExternalServiceError,
  InternalError,
  isAppError,
} from "./AppError";
export type { AppErrorOptions } from "./AppError";

// Error codes
export { ErrorCode } from "./codes";
export type { ErrorCode as ErrorCodeType } from "./codes";

// Error categories
export { ErrorCategory, CATEGORY_HTTP_STATUS, CATEGORY_DEFAULT_MESSAGE } from "./categories";
export type { ErrorCategory as ErrorCategoryType } from "./categories";

// Result pattern
export {
  ok,
  err,
  isOk,
  isErr,
  map,
  flatMap,
  unwrapOr,
  tryAsync,
  trySync,
} from "./Result";
export type { Ok, Err, Result } from "./Result";

// Serialization
export {
  serializeError,
  getHttpStatus,
  isOperationalError,
} from "./serializer";
export type { SerializedError } from "./serializer";
