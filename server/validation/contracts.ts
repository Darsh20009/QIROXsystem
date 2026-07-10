// ── Validation Contracts ──────────────────────────────────────────────────────
// Provider-agnostic interfaces for validators, schemas, and engines.
//
// Purpose:
//   Define the pluggable validation abstraction that production code
//   depends on, so the underlying schema library (Zod, Joi, manual) can
//   be swapped or composed without changing call sites.
//
// Responsibilities:
//   - ISchema<TInput, TOutput>  — a parsed schema definition.
//   - IValidator<TInput, TOutput> — an executable validation unit.
//   - IValidationEngine          — a factory that produces validators from schemas.
//   - ISchemaProvider            — a registry of named schemas.
//
// Future migration role:
//   Migration 007+ will implement these contracts for Zod schemas and
//   wire them into the Express request validation middleware.
//   The ZodValidationEngine will implement IValidationEngine.
//   All production code imports IValidator, never ZodValidator directly.

import type { ValidationResult, ValidationContext, RequestTarget } from "./types";

// ── ISchema ───────────────────────────────────────────────────────────────────

/**
 * A schema definition that knows its own input and output shapes.
 *
 * TInput  — the raw (unvalidated) input type, typically `unknown`.
 * TOutput — the parsed, type-safe output type.
 *
 * Purpose:
 *   Wraps any schema library's native schema object behind a stable interface.
 *   Callers depend on ISchema<TInput, TOutput>, not ZodSchema or JoiSchema.
 *
 * Future migration role:
 *   ZodSchema<T> → ISchema<unknown, T> adapter built in Migration 007+.
 */
export interface ISchema<TInput = unknown, TOutput = TInput> {
  /** Human-readable schema name for diagnostics and logging. */
  readonly schemaName: string;

  /**
   * Which request target this schema validates.
   * When absent, the caller decides which target to extract.
   */
  readonly target?: RequestTarget;

  /**
   * Whether unknown fields are rejected (true) or stripped (false).
   * Defaults to true (strict).
   */
  readonly strict: boolean;

  /**
   * Describe the schema in a human-readable format for documentation
   * (e.g. OpenAPI property descriptions).
   */
  describe(): SchemaDescription;
}

/** A human-readable description of a schema used for documentation generation. */
export interface SchemaDescription {
  /** Schema identifier. */
  name: string;

  /** Free-text description of what this schema validates. */
  description?: string;

  /** List of field names (top-level) with their constraints. */
  fields?: FieldDescription[];
}

/** Description of one field within a schema. */
export interface FieldDescription {
  /** Field name. */
  name: string;

  /** Type description (e.g. "string", "number", "ISO 8601 date"). */
  type: string;

  /** Whether the field is mandatory. */
  required: boolean;

  /** Free-text description. */
  description?: string;

  /** Example value (serialisable). */
  example?: unknown;
}

// ── IValidator ────────────────────────────────────────────────────────────────

/**
 * The primary validation unit — takes raw input and returns a typed result.
 *
 * TInput  — the raw input type (usually `unknown` for request bodies).
 * TOutput — the parsed, type-safe output type.
 *
 * Purpose:
 *   Decouples production code from the schema library.
 *   A validator can be composed, mocked, or replaced without affecting callers.
 *
 * Future migration role:
 *   The request-validation middleware accepts IValidator, not ZodSchema.
 *   Tests inject a PassthroughValidator (always succeeds) or a FailValidator.
 *
 * Usage:
 *   const validator: IValidator<unknown, CreateUserDto> = engine.compile(schema);
 *   const result = validator.validate(req.body, context);
 *   if (!result.success) { return next(toValidationError(result.errors)); }
 */
export interface IValidator<TInput = unknown, TOutput = TInput> {
  /** The schema this validator was compiled from. */
  readonly schema: ISchema<TInput, TOutput>;

  /**
   * Validate `input` and return a typed result.
   * Pure function — no side effects, no global state mutation.
   *
   * @param input   Raw unvalidated value.
   * @param context Optional runtime context for conditional rules.
   */
  validate(input: TInput, context?: ValidationContext): ValidationResult<TOutput>;

  /**
   * Validate asynchronously (for validators that need DB lookups, etc.).
   * Default implementation wraps the synchronous validate() in a Promise.
   */
  validateAsync(input: TInput, context?: ValidationContext): Promise<ValidationResult<TOutput>>;
}

// ── IValidationEngine ─────────────────────────────────────────────────────────

/**
 * A factory that compiles ISchema objects into IValidator instances.
 *
 * Purpose:
 *   Hides which schema library is in use. The engine encapsulates all
 *   library-specific logic (parsing, coercion, error mapping) in one place.
 *
 * Future migration role:
 *   ZodValidationEngine (Migration 007+) implements this interface.
 *   Injected into route factories so routes never import Zod directly.
 *
 * Usage:
 *   const engine: IValidationEngine = new ZodValidationEngine();
 *   const validator = engine.compile(createUserSchema);
 */
export interface IValidationEngine {
  /** Compile a schema into a reusable validator. */
  compile<TInput, TOutput>(schema: ISchema<TInput, TOutput>): IValidator<TInput, TOutput>;

  /**
   * Compile and immediately validate in one call (convenience).
   * Equivalent to engine.compile(schema).validate(input, context).
   */
  validate<TInput, TOutput>(
    schema: ISchema<TInput, TOutput>,
    input: TInput,
    context?: ValidationContext,
  ): ValidationResult<TOutput>;
}

// ── ISchemaProvider ───────────────────────────────────────────────────────────

/**
 * A registry of named schemas.
 *
 * Purpose:
 *   Provides schema lookup by name, enabling schema sharing across routes
 *   without passing schema objects through function signatures.
 *
 * Future migration role:
 *   A SchemaRegistry built in Migration 007+ will implement this interface.
 *   Route definitions will call provider.get("CreateUserSchema") to retrieve
 *   the compiled validator without knowing how or where schemas are stored.
 *
 * Usage:
 *   const schema = provider.get<unknown, CreateUserDto>("CreateUserSchema");
 *   const validator = engine.compile(schema);
 */
export interface ISchemaProvider {
  /** Register a schema under a unique name. */
  register<TInput, TOutput>(name: string, schema: ISchema<TInput, TOutput>): void;

  /**
   * Retrieve a previously registered schema by name.
   * Throws when the name is not found.
   */
  get<TInput, TOutput>(name: string): ISchema<TInput, TOutput>;

  /** Whether a schema with this name has been registered. */
  has(name: string): boolean;

  /** All registered schema names. */
  names(): string[];
}

// ── IValidationMiddlewareFactory ──────────────────────────────────────────────

/**
 * Produces Express middleware that validates a specific request target.
 *
 * Purpose:
 *   Keeps Express-specific logic confined to one factory so the validator
 *   contracts remain framework-agnostic.
 *
 * Future migration role:
 *   Implemented in Migration 007+ as part of the Express integration layer.
 *   Routes call:
 *     router.post("/users", factory.body(createUserSchema), createUserHandler);
 */
export interface IValidationMiddlewareFactory {
  /**
   * Returns middleware that validates `req.body` against `schema`.
   * On failure, calls `next(HttpValidationError)`.
   */
  body<TInput, TOutput>(schema: ISchema<TInput, TOutput>): unknown;

  /**
   * Returns middleware that validates `req.query` against `schema`.
   */
  query<TInput, TOutput>(schema: ISchema<TInput, TOutput>): unknown;

  /**
   * Returns middleware that validates `req.params` against `schema`.
   */
  params<TInput, TOutput>(schema: ISchema<TInput, TOutput>): unknown;
}
