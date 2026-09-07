// ── QIROX Event Bus ───────────────────────────────────────────────────────────
// In-process typed publish/subscribe event bus.
//
// Design:
//   - Wraps Node.js EventEmitter for reliability and memory management.
//   - All events are typed via the QiroxEvents map — no stringly-typed publish.
//   - Handlers receive a typed payload; the bus adds envelope metadata.
//   - Async handlers are supported — errors are caught and logged to console.
//   - Max listener default raised to 50 to avoid Node.js memory leak warnings.
//
// Usage:
//   import { eventBus, QiroxEventName } from "./infrastructure";
//
//   // Subscribe
//   eventBus.on("order.created", ({ payload }) => {
//     console.log("New order", payload.orderId);
//   });
//
//   // Publish
//   eventBus.emit("order.created", { orderId: "ORD-001", planId: "pro" });
//
//   // One-time handler
//   eventBus.once("system.ready", () => console.log("System ready"));

import { EventEmitter } from "events";

// ── Event catalogue ───────────────────────────────────────────────────────────
// Add new events here — never as magic strings in call sites.

export interface QiroxEvents {
  // ── System lifecycle ───────────────────────────────────────────────────────
  "system.ready":           { startedAt: Date; buildId?: string };
  "system.shutting_down":   { signal: string; gracefulMs: number };
  "system.db_connected":    { host: string; name: string };
  "system.db_disconnected": { reason?: string };

  // ── Order lifecycle ────────────────────────────────────────────────────────
  "order.created":          { orderId: string; clientId: string; planId: string };
  "order.payment_received": { orderId: string; method: string; amountSar: number };
  "order.activated":        { orderId: string; activatedAt: Date };
  "order.completed":        { orderId: string; completedAt: Date };
  "order.cancelled":        { orderId: string; reason: string };

  // ── Project lifecycle ──────────────────────────────────────────────────────
  "project.created":        { projectId: string; orderId: string; clientId: string };
  "project.stage_changed":  { projectId: string; from: string; to: string };
  "project.delivered":      { projectId: string; deliveredAt: Date };
  "project.accepted":       { projectId: string; acceptedAt: Date };

  // ── Client lifecycle ───────────────────────────────────────────────────────
  "client.registered":      { clientId: string; email: string; source?: string };
  "client.first_login":     { clientId: string; loginAt: Date };

  // ── Communication ─────────────────────────────────────────────────────────
  "notification.send":      { userId: string; channel: "inapp" | "email" | "whatsapp" | "push"; templateId: string; data: Record<string, unknown> };

  // ── Feature flags ─────────────────────────────────────────────────────────
  "flag.override_set":      { flag: string; enabled: boolean; setBy?: string };
  "flag.override_cleared":  { flag: string };
}

export type QiroxEventName = keyof QiroxEvents;

// ── Envelope ──────────────────────────────────────────────────────────────────
// Every handler receives an envelope with the payload plus metadata.

export interface EventEnvelope<T> {
  /** The event name. */
  readonly event: string;
  /** The typed event payload. */
  readonly payload: T;
  /** UTC timestamp when the event was emitted. */
  readonly emittedAt: Date;
  /** Unique event instance ID for deduplication / tracing. */
  readonly eventId: string;
}

export type EventHandler<T> = (envelope: EventEnvelope<T>) => void | Promise<void>;

// ── Bus implementation ────────────────────────────────────────────────────────

let _idCounter = 0;
function nextEventId(): string {
  return `evt_${Date.now()}_${(++_idCounter).toString(36)}`;
}

export class QiroxEventBus {
  private readonly emitter = new EventEmitter();
  private _debug = false;

  constructor() {
    // Raise the limit to avoid spurious "possible memory leak" warnings.
    this.emitter.setMaxListeners(50);
  }

  // ── Publish ───────────────────────────────────────────────────────────────

  /**
   * Publish an event. All registered handlers run asynchronously;
   * errors are caught so one failing handler cannot block others.
   */
  emit<K extends QiroxEventName>(
    event: K,
    payload: QiroxEvents[K],
  ): void {
    const envelope: EventEnvelope<QiroxEvents[K]> = {
      event,
      payload,
      emittedAt: new Date(),
      eventId:   nextEventId(),
    };

    if (this._debug) {
      console.debug(`[EventBus] emit ${event}`, { eventId: envelope.eventId });
    }

    this.emitter.emit(event, envelope);
  }

  // ── Subscribe ─────────────────────────────────────────────────────────────

  /**
   * Subscribe to an event. Handler is called for every emission.
   * Returns an unsubscribe function.
   */
  on<K extends QiroxEventName>(
    event: K,
    handler: EventHandler<QiroxEvents[K]>,
  ): () => void {
    const wrapped = this._wrap(event, handler);
    this.emitter.on(event, wrapped);
    return () => this.emitter.off(event, wrapped);
  }

  /**
   * Subscribe to an event for a single emission only.
   * Automatically unsubscribes after the first call.
   */
  once<K extends QiroxEventName>(
    event: K,
    handler: EventHandler<QiroxEvents[K]>,
  ): () => void {
    const wrapped = this._wrap(event, handler);
    this.emitter.once(event, wrapped);
    return () => this.emitter.off(event, wrapped);
  }

  /**
   * Remove a specific handler from an event.
   * Note: only works if you kept a reference to the same function.
   * Prefer using the unsubscribe function returned by on().
   */
  off<K extends QiroxEventName>(
    event: K,
    handler: EventHandler<QiroxEvents[K]>,
  ): void {
    this.emitter.off(event, handler as (...args: unknown[]) => void);
  }

  // ── Introspection ─────────────────────────────────────────────────────────

  /** Number of handlers registered for a given event. */
  listenerCount(event: QiroxEventName): number {
    return this.emitter.listenerCount(event);
  }

  /** All event names that have at least one registered handler. */
  activeEvents(): string[] {
    return this.emitter.eventNames() as string[];
  }

  /** Enable verbose debug logging of every emit call. */
  setDebug(enabled: boolean): void {
    this._debug = enabled;
  }

  // ── Internal ─────────────────────────────────────────────────────────────

  private _wrap<T>(
    event: string,
    handler: EventHandler<T>,
  ): (envelope: EventEnvelope<T>) => void {
    return (envelope: EventEnvelope<T>) => {
      try {
        const result = handler(envelope);
        if (result instanceof Promise) {
          result.catch((err: unknown) => {
            console.error(`[EventBus] Async handler error on event "${event}":`, err);
          });
        }
      } catch (err: unknown) {
        console.error(`[EventBus] Sync handler error on event "${event}":`, err);
      }
    };
  }
}
