// ── Validation Foundation — Public API ────────────────────────────────────────
// Single import point for all validation modules.
//
// Usage:
//   import { FieldError, ValidationResult, success, failure }  from "./validation";
//   import { IValidator, ISchema, IValidationEngine }          from "./validation";
//   import { ValidationErrorCode, toApiValidationError }       from "./validation";
//   import { isValidEmail, isValidSaudiPhone, isValidObjectId } from "./validation";
//   import { rules, RuleSet, FieldRuleMap }                    from "./validation";
//   import { RequestValidationConfig, DEFAULT_EXTRACTORS }     from "./validation";
//   import { ResponseValidationConfig, ResponseSchemaViolation } from "./validation";

// ── Core types ────────────────────────────────────────────────────────────────
export type {
  ValidationSeverity,
  FieldError,
  ValidationResult,
  ValidationSuccess,
  ValidationFailure,
  ValidationContext,
  RequestTarget,
} from "./types";
export { success, failure, fieldError } from "./types";

// ── Contracts ─────────────────────────────────────────────────────────────────
export type {
  ISchema,
  SchemaDescription,
  FieldDescription,
  IValidator,
  IValidationEngine,
  ISchemaProvider,
  IValidationMiddlewareFactory,
} from "./contracts";

// ── Errors ────────────────────────────────────────────────────────────────────
export {
  ValidationErrorCode,
  ValidationErrorCategory,
  VALIDATION_ERROR_CATEGORY_MAP,
  VALIDATION_HTTP_STATUS_MAP,
  validationHttpStatus,
  toApiValidationError,
} from "./errors";
export type {
  ApiValidationError,
  ApiFieldError,
} from "./errors";

// ── Helpers ───────────────────────────────────────────────────────────────────
export {
  isValidEmail,
  normaliseEmail,
  isValidUrl,
  isValidUuid,
  isValidObjectId,
  isValidE164Phone,
  isValidSaudiPhone,
  normaliseSaudiPhone,
  containsArabic,
  isArabicOnly,
  isFiniteNumber,
  isSafeInteger,
  isPositive,
  isNonNegative,
  clamp,
  isNonEmptyString,
  truncate,
  stripHtml,
  isValidIsoDate,
  isValidDate,
  isPlainObject,
  isNonEmptyArray,
  findDuplicates,
} from "./helpers";

// ── Rules ─────────────────────────────────────────────────────────────────────
export { rules } from "./rules";
export type {
  BaseRule,
  Rule,
  RuleSet,
  FieldRuleMap,
  RequiredRule,
  NotNullRule,
  NotEmptyRule,
  StringRule,
  MinLengthRule,
  MaxLengthRule,
  PatternRule,
  EmailRule,
  UrlRule,
  UuidRule,
  ObjectIdRule,
  PhoneRule,
  ArabicRule,
  NumberRule,
  MinRule,
  MaxRule,
  IntegerRule,
  PositiveRule,
  NonNegativeRule,
  ArrayRule,
  MinItemsRule,
  MaxItemsRule,
  UniqueItemsRule,
  EnumRule,
  DateRule,
  AfterDateRule,
  BeforeDateRule,
  MatchFieldRule,
} from "./rules";

// ── Request validation (design) ───────────────────────────────────────────────
export type {
  WarningPolicy,
  UnknownFieldPolicy,
  RequestValidationConfig,
  RequestValidationResult,
  PipelineStep,
  RequestExtractorMap,
} from "./request";
export { DEFAULT_EXTRACTORS } from "./request";

// ── Response validation (design) ──────────────────────────────────────────────
export type {
  ResponseValidationPolicy,
  ResponseValidationFailureBehavior,
  ResponseValidationConfig,
  IResponseValidator,
} from "./response";
export { ResponseSchemaViolation } from "./response";
