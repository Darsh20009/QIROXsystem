// ── Mail Domain — Validation ───────────────────────────────────────────────────
// Placeholder — full Zod schema validation is deferred to Migration 009+.
//
// When implemented this layer will:
//   • Validate emailAddress format (RFC 5322).
//   • Validate port ranges (1–65535).
//   • Validate assignedUserIds as valid MongoDB ObjectId strings.
//   • Validate subject/body length limits.
//   • Validate attachment content-type allowlist.
//
// Technical debt: The absence of input validation means:
//   • Malformed ports are silently coerced to NaN by IMAP client constructors.
//   • Invalid ObjectId strings in assignedUserIds cause Mongoose CastErrors.
//   • No maximum body/attachment size enforcement — memory exhaustion risk.

export {};
