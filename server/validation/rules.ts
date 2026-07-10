// ── Validation Rule Descriptors ───────────────────────────────────────────────
// Declarative data structures describing validation constraints.
//
// Purpose:
//   Define rules as plain data objects (not functions) so they can be
//   serialised, introspected, and translated into OpenAPI documentation
//   without running the validation engine.
//
// Responsibilities:
//   - Rule descriptor types for every constraint category.
//   - RuleSet — a named, ordered collection of rules for one field.
//   - FieldRuleMap — a map of field names to their rule sets (schema descriptor).
//
// Future migration role:
//   Migration 007+ builds a RuleSet→ZodSchema compiler that reads these
//   descriptors and produces the equivalent Zod schema automatically,
//   enabling code-generated schemas from declarative rule definitions.

// ── Base rule ─────────────────────────────────────────────────────────────────

/**
 * The discriminated-union base that every rule descriptor extends.
 * The `kind` field is the discriminant used in switch statements.
 */
export interface BaseRule {
  /** Machine-readable rule identifier (matches ValidationErrorCode). */
  kind: string;

  /**
   * Custom human-readable error message.
   * When absent, the validation engine generates a default message.
   */
  message?: string;

  /** Whether this rule emits a warning instead of an error. Default: false. */
  warnOnly?: boolean;
}

// ── Presence rules ────────────────────────────────────────────────────────────

/** The field must be present and not undefined. */
export interface RequiredRule    extends BaseRule { kind: "required" }
/** The field must not be null. */
export interface NotNullRule     extends BaseRule { kind: "notNull" }
/** The field must not be empty (empty string / empty array / empty object). */
export interface NotEmptyRule    extends BaseRule { kind: "notEmpty" }

// ── String rules ──────────────────────────────────────────────────────────────

/** The field must be a string. */
export interface StringRule      extends BaseRule { kind: "string" }
/** Minimum string length. */
export interface MinLengthRule   extends BaseRule { kind: "minLength"; min: number }
/** Maximum string length. */
export interface MaxLengthRule   extends BaseRule { kind: "maxLength"; max: number }
/** Must match the given regular expression. */
export interface PatternRule     extends BaseRule { kind: "pattern"; regex: RegExp; hint?: string }
/** Must be a valid email address. */
export interface EmailRule       extends BaseRule { kind: "email" }
/** Must be a valid absolute URL. */
export interface UrlRule         extends BaseRule { kind: "url"; protocols?: string[] }
/** Must be a valid UUID (v1–v5). */
export interface UuidRule        extends BaseRule { kind: "uuid" }
/** Must be a valid 24-char MongoDB ObjectId hex string. */
export interface ObjectIdRule    extends BaseRule { kind: "objectId" }
/** Must be a valid phone number (E.164 or Saudi local). */
export interface PhoneRule       extends BaseRule { kind: "phone"; region?: "SA" | "E164" }
/** Must contain Arabic text. */
export interface ArabicRule      extends BaseRule { kind: "arabic" }

// ── Number rules ──────────────────────────────────────────────────────────────

/** The field must be a number. */
export interface NumberRule      extends BaseRule { kind: "number" }
/** Minimum numeric value (inclusive). */
export interface MinRule         extends BaseRule { kind: "min"; min: number }
/** Maximum numeric value (inclusive). */
export interface MaxRule         extends BaseRule { kind: "max"; max: number }
/** Must be a safe integer. */
export interface IntegerRule     extends BaseRule { kind: "integer" }
/** Must be strictly positive (> 0). */
export interface PositiveRule    extends BaseRule { kind: "positive" }
/** Must be non-negative (>= 0). */
export interface NonNegativeRule extends BaseRule { kind: "nonNegative" }

// ── Array rules ───────────────────────────────────────────────────────────────

/** The field must be an array. */
export interface ArrayRule       extends BaseRule { kind: "array" }
/** Minimum number of array items. */
export interface MinItemsRule    extends BaseRule { kind: "minItems"; min: number }
/** Maximum number of array items. */
export interface MaxItemsRule    extends BaseRule { kind: "maxItems"; max: number }
/** All array items must be unique. */
export interface UniqueItemsRule extends BaseRule { kind: "uniqueItems" }

// ── Enum rules ────────────────────────────────────────────────────────────────

/** Value must be one of the listed options. */
export interface EnumRule<T extends string | number = string> extends BaseRule {
  kind: "enum";
  values: readonly T[];
}

// ── Date rules ────────────────────────────────────────────────────────────────

/** The field must be a valid date or ISO 8601 date string. */
export interface DateRule        extends BaseRule { kind: "date" }
/** Date must be after the given lower bound. */
export interface AfterDateRule   extends BaseRule { kind: "afterDate"; after: Date | string }
/** Date must be before the given upper bound. */
export interface BeforeDateRule  extends BaseRule { kind: "beforeDate"; before: Date | string }

// ── Cross-field rules ─────────────────────────────────────────────────────────

/** Two fields must have equal values. */
export interface MatchFieldRule extends BaseRule {
  kind: "matchField";
  /** Dot-path to the other field (e.g. "confirmPassword"). */
  otherField: string;
}

// ── Union type ────────────────────────────────────────────────────────────────

/**
 * The discriminated union of all rule descriptor types.
 * Extend this union when adding new rule types.
 */
export type Rule =
  | RequiredRule | NotNullRule | NotEmptyRule
  | StringRule | MinLengthRule | MaxLengthRule | PatternRule
  | EmailRule | UrlRule | UuidRule | ObjectIdRule | PhoneRule | ArabicRule
  | NumberRule | MinRule | MaxRule | IntegerRule | PositiveRule | NonNegativeRule
  | ArrayRule | MinItemsRule | MaxItemsRule | UniqueItemsRule
  | EnumRule
  | DateRule | AfterDateRule | BeforeDateRule
  | MatchFieldRule;

// ── RuleSet — one field's complete rule list ──────────────────────────────────

/**
 * An ordered list of validation rules for a single field.
 *
 * Future migration role:
 *   The ZodSchemaCompiler (Migration 007+) iterates `rules` and chains the
 *   equivalent Zod methods (z.string().min(n).email()…).
 */
export interface RuleSet {
  /** Dot-path field name (e.g. "user.email", "items[0].qty"). */
  field: string;

  /**
   * Whether this field is optional at the top level.
   * When true, all rules are skipped if the field is absent.
   */
  optional?: boolean;

  /** Ordered list of validation rules applied left-to-right. */
  rules: Rule[];

  /** Optional field description for documentation generation. */
  description?: string;
}

// ── FieldRuleMap — full schema descriptor ────────────────────────────────────

/**
 * A map of field names to their rule sets, forming a complete schema descriptor.
 *
 * Future migration role:
 *   The schema registry (Migration 007+) stores FieldRuleMaps and uses
 *   them to compile Zod schemas, generate OpenAPI properties, and produce
 *   client-side validation rule objects for react-hook-form.
 *
 * Usage:
 *   const createUserRules: FieldRuleMap = {
 *     "email":    { field: "email",    rules: [{ kind: "required" }, { kind: "email" }] },
 *     "password": { field: "password", rules: [{ kind: "required" }, { kind: "minLength", min: 8 }] },
 *   };
 */
export type FieldRuleMap = Record<string, RuleSet>;

// ── Rule builder helpers ──────────────────────────────────────────────────────

/** Convenience builders to construct rule descriptors without repeating the `kind` key. */
export const rules = {
  required:    (message?: string): RequiredRule    => ({ kind: "required",    message }),
  notNull:     (message?: string): NotNullRule     => ({ kind: "notNull",     message }),
  notEmpty:    (message?: string): NotEmptyRule    => ({ kind: "notEmpty",    message }),
  string:      (message?: string): StringRule      => ({ kind: "string",      message }),
  minLength:   (min: number, message?: string): MinLengthRule   => ({ kind: "minLength",   min,    message }),
  maxLength:   (max: number, message?: string): MaxLengthRule   => ({ kind: "maxLength",   max,    message }),
  pattern:     (regex: RegExp, hint?: string, message?: string): PatternRule => ({ kind: "pattern", regex, hint, message }),
  email:       (message?: string): EmailRule       => ({ kind: "email",       message }),
  url:         (protocols?: string[], message?: string): UrlRule => ({ kind: "url", protocols, message }),
  uuid:        (message?: string): UuidRule        => ({ kind: "uuid",        message }),
  objectId:    (message?: string): ObjectIdRule    => ({ kind: "objectId",    message }),
  phone:       (region?: "SA" | "E164", message?: string): PhoneRule => ({ kind: "phone", region, message }),
  arabic:      (message?: string): ArabicRule      => ({ kind: "arabic",      message }),
  number:      (message?: string): NumberRule      => ({ kind: "number",      message }),
  min:         (min: number, message?: string): MinRule         => ({ kind: "min",         min,    message }),
  max:         (max: number, message?: string): MaxRule         => ({ kind: "max",         max,    message }),
  integer:     (message?: string): IntegerRule     => ({ kind: "integer",     message }),
  positive:    (message?: string): PositiveRule    => ({ kind: "positive",    message }),
  nonNegative: (message?: string): NonNegativeRule => ({ kind: "nonNegative", message }),
  array:       (message?: string): ArrayRule       => ({ kind: "array",       message }),
  minItems:    (min: number, message?: string): MinItemsRule    => ({ kind: "minItems",    min,    message }),
  maxItems:    (max: number, message?: string): MaxItemsRule    => ({ kind: "maxItems",    max,    message }),
  uniqueItems: (message?: string): UniqueItemsRule => ({ kind: "uniqueItems", message }),
  enum:        <T extends string | number>(values: readonly T[], message?: string): EnumRule<T> => ({ kind: "enum", values, message }),
  date:        (message?: string): DateRule        => ({ kind: "date",        message }),
  afterDate:   (after: Date | string, message?: string): AfterDateRule => ({ kind: "afterDate", after, message }),
  beforeDate:  (before: Date | string, message?: string): BeforeDateRule => ({ kind: "beforeDate", before, message }),
  matchField:  (otherField: string, message?: string): MatchFieldRule => ({ kind: "matchField", otherField, message }),
} as const;
