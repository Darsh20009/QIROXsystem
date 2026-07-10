// ── Email Validation ───────────────────────────────────────────────────────────
// Placeholder — no runtime validation wired yet.
//
// Purpose:
//   Reserve this file for Zod schema definitions for each email endpoint
//   and service input.
//
// Responsibilities (future):
//   - sendTestEmailSchema      — validates POST /api/admin/email/test body.
//   - broadcastEmailSchema     — validates POST /api/admin/email/broadcast body.
//   - Per-template input schemas (WelcomeEmailInput, OtpEmailInput, etc.)
//     used by consuming domains that call the email service directly.
//
// Current state (Migration 009):
//   All schemas are stubs. The service layer accepts untyped inputs and casts
//   them internally until Migration 010+ wires the Zod engine into the
//   request pipeline.
//
// Future migration role:
//   Migration 010+ imports these schemas and passes them to the
//   IValidationMiddlewareFactory to produce Express middleware for each route.

// ── Stub schemas ──────────────────────────────────────────────────────────────

/** @placeholder Validates POST /api/admin/email/test body */
export const sendTestEmailSchema = null;

/** @placeholder Validates POST /api/admin/email/broadcast body */
export const broadcastEmailSchema = null;

/** @placeholder Validates WelcomeEmailInput across consuming domains */
export const welcomeEmailSchema = null;

/** @placeholder Validates OtpEmailInput across consuming domains */
export const otpEmailSchema = null;

/** @placeholder Validates EmailVerificationInput across consuming domains */
export const emailVerificationSchema = null;

/** @placeholder Validates LoginOtpEmailInput across consuming domains */
export const loginOtpEmailSchema = null;
