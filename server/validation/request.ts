// ── Request Validation Strategy ───────────────────────────────────────────────
// Design-only module — no runtime validation wired to Express yet.
//
// Purpose:
//   Define the complete strategy and interface contracts for validating
//   incoming HTTP requests. This module is the specification document that
//   Migration 007+ will implement.
//
// Responsibilities:
//   - RequestValidationConfig — per-route validation configuration.
//   - IRequestValidationResult — what the middleware produces.
//   - RequestValidationPolicy — how failures are handled (abort vs. warn).
//   - Design notes documenting the intended Express integration pattern.
//
// Future migration role:
//   Migration 007+ implements IValidationMiddlewareFactory using these types.
//   Routes declare RequestValidationConfig; middleware reads it and validates
//   the correct req parts automatically, calling next() or next(error).

import type { ISchema, IValidationEngine } from "./contracts";
import type { ValidationResult, ValidationContext, RequestTarget } from "./types";

// ── Policy ────────────────────────────────────────────────────────────────────

/**
 * Controls what happens when a validation rule produces a warning (not error).
 *
 * "abort"  — treat warnings as errors and reject the request.
 * "pass"   — allow the request but attach warnings to req.validationWarnings.
 * "ignore" — silently discard warnings.
 */
export type WarningPolicy = "abort" | "pass" | "ignore";

/**
 * Controls what happens when an unexpected field is present in the body.
 *
 * "strip"  — remove the unknown field before passing to the handler (default).
 * "reject" — return a 422 UNKNOWN_FIELD error.
 * "allow"  — pass unknown fields through unchanged.
 */
export type UnknownFieldPolicy = "strip" | "reject" | "allow";

// ── Per-route configuration ───────────────────────────────────────────────────

/**
 * The complete validation configuration for one route.
 *
 * Future migration role:
 *   Route factories receive RequestValidationConfig and pass it to
 *   IValidationMiddlewareFactory.forRoute(config).
 *
 * Usage (Migration 007+):
 *   router.post(
 *     "/users",
 *     validate.forRoute({
 *       body:   createUserSchema,
 *       query:  paginationSchema,
 *       params: userIdParamsSchema,
 *     }),
 *     createUserHandler,
 *   );
 */
export interface RequestValidationConfig {
  /** Schema to validate `req.body` against. */
  body?: ISchema<unknown, unknown>;

  /** Schema to validate `req.query` against. */
  query?: ISchema<unknown, unknown>;

  /** Schema to validate `req.params` against. */
  params?: ISchema<unknown, unknown>;

  /** Schema to validate `req.headers` against. */
  headers?: ISchema<unknown, unknown>;

  /** How to handle warning-level findings. Default: "pass". */
  warningPolicy?: WarningPolicy;

  /** How to handle unknown fields in the body. Default: "strip". */
  unknownFieldPolicy?: UnknownFieldPolicy;

  /**
   * Whether to abort early (return on first error) or collect all errors.
   * Default: false (collect all).
   */
  abortEarly?: boolean;
}

// ── Result produced by the middleware ────────────────────────────────────────

/**
 * Typed validation results attached to `req.validated` by the middleware.
 * Handlers read from this object instead of casting `req.body` directly.
 *
 * Future migration role:
 *   Express Request is extended with `validated` in Migration 007+:
 *     declare module "express" {
 *       interface Request { validated?: RequestValidationResult; }
 *     }
 */
export interface RequestValidationResult {
  /** Parsed, type-safe body (present when body schema was provided and passed). */
  body?: unknown;

  /** Parsed, type-safe query (present when query schema was provided and passed). */
  query?: unknown;

  /** Parsed, type-safe params (present when params schema was provided and passed). */
  params?: unknown;

  /** Parsed, type-safe headers (present when headers schema was provided and passed). */
  headers?: unknown;

  /** Non-blocking warnings from all validated parts (when warningPolicy is "pass"). */
  warnings?: import("./types").FieldError[];
}

// ── Validation pipeline step ──────────────────────────────────────────────────

/**
 * One step in the request validation pipeline — validates one RequestTarget.
 *
 * Future migration role:
 *   The middleware factory builds a pipeline of PipelineSteps, one per
 *   configured target, and runs them in order, collecting errors.
 */
export interface PipelineStep {
  /** Which part of the request this step validates. */
  target: RequestTarget;

  /** The schema to validate against. */
  schema: ISchema<unknown, unknown>;

  /** Compiled validator (produced by IValidationEngine.compile). */
  run(input: unknown, context: ValidationContext): ValidationResult<unknown>;
}

// ── Design: Express integration pattern ──────────────────────────────────────
//
// The following pseudocode documents the intended middleware implementation.
// It is NOT production code — it will be written in Migration 007+.
//
//   function createValidationMiddleware(
//     config: RequestValidationConfig,
//     engine: IValidationEngine,
//   ): express.RequestHandler {
//
//     const steps: PipelineStep[] = [];
//     if (config.body)    steps.push(compilePipelineStep("body",    config.body,    engine));
//     if (config.query)   steps.push(compilePipelineStep("query",   config.query,   engine));
//     if (config.params)  steps.push(compilePipelineStep("params",  config.params,  engine));
//     if (config.headers) steps.push(compilePipelineStep("headers", config.headers, engine));
//
//     return function validationMiddleware(req, res, next) {
//       const ctx: ValidationContext = {
//         method:   req.method,
//         path:     req.path,
//         userId:   req.user?.id,
//         userRole: req.user?.role,
//         locale:   req.headers["accept-language"]?.split(",")[0],
//       };
//
//       const allErrors: FieldError[] = [];
//       const validated: RequestValidationResult = {};
//
//       for (const step of steps) {
//         const input  = extractTarget(req, step.target);
//         const result = step.run(input, ctx);
//
//         if (result.success) {
//           validated[step.target] = result.data;
//           if (result.warnings?.length) {
//             if (config.warningPolicy === "abort") allErrors.push(...result.warnings);
//             else if (config.warningPolicy !== "ignore") (validated.warnings ??= []).push(...result.warnings);
//           }
//         } else {
//           allErrors.push(...result.errors);
//           if (config.abortEarly) break;
//         }
//       }
//
//       if (allErrors.length) {
//         const apiError = toApiValidationError(allErrors);
//         return res.status(apiError.status).json(apiError);
//       }
//
//       req.validated = validated;
//       next();
//     };
//   }

// ── Exported strategy types (used by future implementation) ──────────────────

/**
 * Describes how one request part (body / query / params) is extracted
 * from an Express Request object.
 *
 * Future migration role:
 *   The middleware factory uses this map to index into `req` without
 *   using string indexing, preserving type safety.
 */
export type RequestExtractorMap = {
  readonly [K in RequestTarget]: (req: Record<string, unknown>) => unknown;
};

/**
 * The default extraction strategy for each request target.
 * Exported so tests can verify extraction behaviour independently.
 */
export const DEFAULT_EXTRACTORS: RequestExtractorMap = {
  body:    req => req["body"],
  query:   req => req["query"],
  params:  req => req["params"],
  headers: req => req["headers"],
};
