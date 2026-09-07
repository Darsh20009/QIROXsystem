// ── Dependency Injection Container ────────────────────────────────────────────
// Lightweight, zero-dependency DI container for QIROX infrastructure services.
//
// Design decisions:
//   - Symbol tokens prevent string-key typo collisions.
//   - Factory registration supports lazy instantiation for heavy services.
//   - The singleton module-level container is the only instance in the process.
//   - Calling register() twice for the same token overwrites silently — caller
//     is responsible for not double-registering in production code.
//
// Usage:
//   container.register(TOKENS.Logger, myLogger);
//   const logger = container.resolve<ILogger>(TOKENS.Logger);
//   const safeLog = container.tryResolve<ILogger>(TOKENS.Logger);

export class QiroxContainer {
  private readonly registry = new Map<symbol, unknown>();
  private readonly factories = new Map<symbol, () => unknown>();

  // ── Registration ──────────────────────────────────────────────────────────

  /**
   * Register a pre-built value.
   * Overwrites any existing registration for this token.
   */
  register<T>(token: symbol, value: T): this {
    this.registry.set(token, value);
    return this;
  }

  /**
   * Register a lazy factory — called once on first resolve(), result cached.
   * Use when instantiation has side effects that should be deferred.
   */
  registerFactory<T>(token: symbol, factory: () => T): this {
    this.factories.set(token, factory);
    return this;
  }

  // ── Resolution ────────────────────────────────────────────────────────────

  /**
   * Resolve a registered service.
   * Throws if the token has never been registered.
   */
  resolve<T>(token: symbol): T {
    // Check eager registry first
    if (this.registry.has(token)) {
      return this.registry.get(token) as T;
    }

    // Fall back to factory — instantiate and cache as eager value
    if (this.factories.has(token)) {
      const factory = this.factories.get(token)!;
      const value = factory();
      this.registry.set(token, value);
      this.factories.delete(token);
      return value as T;
    }

    throw new Error(
      `[Container] No registration found for token: ${token.toString()}. ` +
      "Ensure bootstrap() has been called before resolving services."
    );
  }

  /**
   * Resolve a service without throwing.
   * Returns undefined when the token is not registered.
   */
  tryResolve<T>(token: symbol): T | undefined {
    try {
      return this.resolve<T>(token);
    } catch {
      return undefined;
    }
  }

  /**
   * Check whether a token has been registered (eager or factory).
   */
  has(token: symbol): boolean {
    return this.registry.has(token) || this.factories.has(token);
  }

  /**
   * Return the count of all registered services (eager + pending factories).
   */
  get size(): number {
    return this.registry.size + this.factories.size;
  }

  /**
   * Clear all registrations — intended for testing only.
   * Do NOT call in production code.
   */
  _resetForTesting(): void {
    this.registry.clear();
    this.factories.clear();
  }
}

// ── Module-level singleton ────────────────────────────────────────────────────
// One container for the entire server process.
// Import this directly; do not construct additional QiroxContainer instances.

export const container = new QiroxContainer();
