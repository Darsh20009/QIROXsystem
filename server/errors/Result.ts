// ── Result Pattern ────────────────────────────────────────────────────────────
// A discriminated union for explicit error propagation without throwing.
// Inspired by Rust's Result<T, E> and fp-ts Either.
//
// Usage:
//   function divide(a: number, b: number): Result<number> {
//     if (b === 0) return err(new ValidationError(ErrorCode.VALIDATION_INVALID_FORMAT, "Cannot divide by zero"));
//     return ok(a / b);
//   }
//
//   const result = divide(10, 0);
//   if (!result.ok) {
//     console.error(result.error.message);
//   } else {
//     console.log(result.value);
//   }

import { AppError } from "./AppError";

// ── Core types ────────────────────────────────────────────────────────────────

export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

export interface Err<E extends AppError = AppError> {
  readonly ok: false;
  readonly error: E;
}

export type Result<T, E extends AppError = AppError> = Ok<T> | Err<E>;

// ── Constructors ──────────────────────────────────────────────────────────────

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err<E extends AppError>(error: E): Err<E> {
  return { ok: false, error };
}

// ── Type guards ───────────────────────────────────────────────────────────────

export function isOk<T, E extends AppError>(result: Result<T, E>): result is Ok<T> {
  return result.ok === true;
}

export function isErr<T, E extends AppError>(result: Result<T, E>): result is Err<E> {
  return result.ok === false;
}

// ── Combinators ───────────────────────────────────────────────────────────────

/**
 * Transform the value inside an Ok result.
 * Passes Err results through unchanged.
 */
export function map<T, U, E extends AppError>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  if (result.ok) return ok(fn(result.value));
  return result;
}

/**
 * Chain operations that themselves return a Result.
 * Short-circuits on the first Err.
 */
export function flatMap<T, U, E extends AppError>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  if (result.ok) return fn(result.value);
  return result;
}

/**
 * Extract the value or return a fallback.
 */
export function unwrapOr<T, E extends AppError>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

/**
 * Wrap a promise that may throw into a Result.
 * Catches thrown AppErrors directly; wraps unknown errors using the provided factory.
 */
export async function tryAsync<T>(
  fn: () => Promise<T>,
  onUnknown?: (e: unknown) => AppError,
): Promise<Result<T>> {
  try {
    return ok(await fn());
  } catch (e) {
    if (e instanceof AppError) return err(e);
    if (onUnknown) return err(onUnknown(e));
    // Re-throw unknown errors that have no handler — they are bugs, not results.
    throw e;
  }
}

/**
 * Wrap a synchronous function that may throw into a Result.
 */
export function trySync<T>(
  fn: () => T,
  onUnknown?: (e: unknown) => AppError,
): Result<T> {
  try {
    return ok(fn());
  } catch (e) {
    if (e instanceof AppError) return err(e);
    if (onUnknown) return err(onUnknown(e));
    throw e;
  }
}
