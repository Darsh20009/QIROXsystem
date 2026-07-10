// ── Response Validation Strategy ──────────────────────────────────────────────
// Design-only module — no runtime validation wired to Express yet.
//
// Purpose:
//   Define the strategy and interface contracts for validating outgoing HTTP
//   response bodies in development and test environments.
//   Response validation is NOT run in production (performance + safety).
//
// Responsibilities:
//   - ResponseValidationConfig — per-route validation configuration.
//   - ResponseValidationPolicy — when and how to validate responses.
//   - IResponseValidator       — the interface production code depends on.
//   - Design notes for the intended Express integration pattern.
//
// Future migration role:
//   Migration 007+ implements IResponseValidator and wires it into a
//   development-only response-interceptor middleware.
//   This eliminates runtime type assertion bugs (as T casts on API responses).

import type { ISchema } from "./contracts";
import type { ValidationResult } from "./types";

// ── Policy ────────────────────────────────────────────────────────────────────

/**
 * When to apply response validation.
 *
 * "development" — validate only when NODE_ENV === "development".
 * "test"        — validate only when NODE_ENV === "test".
 * "always"      — validate in all environments (not recommended for production).
 * "never"       — skip validation entirely (opt-out).
 */
export type ResponseValidationPolicy = "development" | "test" | "always" | "never";

/**
 * What to do when the response body fails its schema.
 *
 * "log"  — log the error but send the response anyway (non-breaking).
 * "warn" — attach a warning header to the response.
 * "throw"— throw an error, causing a 500 response (useful in tests).
 */
export type ResponseValidationFailureBehavior = "log" | "warn" | "throw";

// ── Configuration ─────────────────────────────────────────────────────────────

/**
 * Per-route response validation configuration.
 *
 * Future migration role:
 *   Route handlers declare their expected response schema using this config.
 *   A development-mode interceptor reads it and validates `res.json()` payloads.
 *
 * Usage (Migration 007+):
 *   router.get(
 *     "/users/:id",
 *     respondsWith({ schema: userResponseSchema }),
 *     getUserHandler,
 *   );
 */
export interface ResponseValidationConfig {
  /** Schema the response body must conform to. */
  schema: ISchema<unknown, unknown>;

  /** HTTP status codes this schema applies to. Default: [200, 201]. */
  forStatus?: number[];

  /** When to run validation. Default: "development". */
  policy?: ResponseValidationPolicy;

  /** What to do on failure. Default: "log" in development, "throw" in tests. */
  onFailure?: ResponseValidationFailureBehavior;
}

// ── Interface ─────────────────────────────────────────────────────────────────

/**
 * Validates an outgoing response body against its declared schema.
 *
 * Purpose:
 *   Provides a contract that development tooling, API testing harnesses,
 *   and contract-test suites can all depend on without coupling to
 *   the underlying schema library.
 *
 * Future migration role:
 *   Implemented in Migration 007+ as ZodResponseValidator.
 *   Injected into a res.json() interceptor middleware that is only
 *   mounted when NODE_ENV !== "production".
 */
export interface IResponseValidator {
  /**
   * Validate an outgoing response body.
   *
   * @param body   The value about to be serialised and sent to the client.
   * @param config The response validation configuration for this route.
   * @param status The HTTP status code of the response.
   */
  validate(
    body:   unknown,
    config: ResponseValidationConfig,
    status: number,
  ): ValidationResult<unknown>;

  /**
   * Whether validation should run given the current NODE_ENV and policy.
   * Always returns false in production to ensure zero performance cost.
   */
  shouldRun(policy: ResponseValidationPolicy, nodeEnv?: string): boolean;
}

// ── Design: Express integration pattern ──────────────────────────────────────
//
// The following pseudocode documents the intended middleware implementation.
// It is NOT production code — it will be written in Migration 007+.
//
//   function createResponseValidationMiddleware(
//     config:    ResponseValidationConfig,
//     validator: IResponseValidator,
//   ): express.RequestHandler {
//
//     return function responseValidationMiddleware(req, res, next) {
//       const policy    = config.policy ?? "development";
//       const forStatus = config.forStatus ?? [200, 201];
//
//       if (!validator.shouldRun(policy, process.env.NODE_ENV)) return next();
//
//       const originalJson = res.json.bind(res);
//
//       res.json = function interceptedJson(body) {
//         if (forStatus.includes(res.statusCode)) {
//           const result = validator.validate(body, config, res.statusCode);
//
//           if (!result.success) {
//             const behavior = config.onFailure ?? "log";
//             if (behavior === "throw") throw new ResponseSchemaViolation(result.errors);
//             if (behavior === "warn")  res.setHeader("X-Response-Schema-Warning", "true");
//             if (behavior === "log")   console.warn("[ResponseValidator]", result.errors);
//           }
//         }
//         return originalJson(body);
//       };
//
//       next();
//     };
//   }

// ── Response schema violation error ──────────────────────────────────────────

/**
 * Thrown by the response validator when onFailure is "throw".
 * Only ever thrown in development/test environments.
 *
 * Future migration role:
 *   Caught by the global error handler (Migration 007+) and converted to
 *   a 500 Internal Server Error with a clear developer-facing message.
 */
export class ResponseSchemaViolation extends Error {
  readonly name = "ResponseSchemaViolation";
  readonly errors: import("./types").FieldError[];

  constructor(errors: import("./types").FieldError[]) {
    super(
      `Response body failed schema validation: ${errors.map(e => `${e.field} (${e.rule})`).join(", ")}`,
    );
    this.errors = errors;
    Object.setPrototypeOf(this, ResponseSchemaViolation.prototype);
  }
}
