// ── Email Mapper ───────────────────────────────────────────────────────────────
// DTO ↔ Entity conversion for the email domain.
//
// Purpose:
//   Provide a single place where send results are translated into typed
//   API response shapes, and where request bodies are translated into
//   service inputs.
//
// Current state (Migration 009):
//   SendResult is a thin wrapper around { sent: boolean }. The mapper is a
//   pass-through that preserves the exact HTTP response shape that callers
//   currently expect (the legacy email functions return `boolean`).
//
// Future migration role:
//   When typed response schemas are introduced (Migration 010+), this mapper
//   will translate service results into explicit DTO objects,
//   removing the implicit reliance on raw booleans.

import type { SendResult } from "./types";

/**
 * Map a SendResult to the HTTP response body.
 * Current shape: { ok: boolean } — unchanged from legacy boolean return.
 */
export function toSendResponse(result: SendResult): { ok: boolean } {
  return { ok: result.sent };
}

/**
 * Map a raw boolean (from legacy callers) to a SendResult.
 * Enables gradual migration from boolean-returning helpers to typed results.
 */
export function fromBoolean(sent: boolean): SendResult {
  return { sent };
}
