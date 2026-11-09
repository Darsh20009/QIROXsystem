// ── Common Validation Helpers ─────────────────────────────────────────────────
// Pure predicate and formatting functions for common data types.
//
// Purpose:
//   Provide a library of tested, reusable validators for the most common
//   field types encountered in the QIROX platform (email, phone, MongoId,
//   Arabic text, Saudi phone numbers, etc.).
//
// Responsibilities:
//   - Predicates (is*) — return boolean, never throw.
//   - Normalisers (normalise*) — return the cleaned value or undefined.
//   - Used directly in manual validators and in custom Zod refinements.
//
// Future migration role:
//   Zod schemas (Migration 007+) call these helpers in `.refine()` clauses,
//   ensuring the same logic runs whether validation is manual or schema-driven.
//   E.g. z.string().refine(isValidEmail, { message: "Invalid email" })

// ── Email ─────────────────────────────────────────────────────────────────────

/** RFC 5322-inspired email regex (practical subset, not exhaustive). */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Returns true if `value` looks like a valid email address.
 * Trims and lowercases before testing.
 */
export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim().toLowerCase());
}

/**
 * Normalises an email to trimmed lowercase.
 * Returns undefined if the value is not a valid email.
 */
export function normaliseEmail(value: string): string | undefined {
  const v = value.trim().toLowerCase();
  return EMAIL_REGEX.test(v) ? v : undefined;
}

// ── URL ───────────────────────────────────────────────────────────────────────

/**
 * Returns true if `value` is an absolute HTTP or HTTPS URL.
 * Uses the URL constructor for parsing (works in all modern Node versions).
 */
export function isValidUrl(value: string, allowedProtocols = ["http:", "https:"]): boolean {
  try {
    const url = new URL(value);
    return allowedProtocols.includes(url.protocol);
  } catch {
    return false;
  }
}

// ── UUID ──────────────────────────────────────────────────────────────────────

/** UUID v1–v5 regex. */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Returns true if `value` is a valid UUID (v1–v5). */
export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

// ── MongoDB ObjectId ──────────────────────────────────────────────────────────

/** MongoDB ObjectId hex regex (24 lowercase hex chars). */
const OBJECT_ID_REGEX = /^[0-9a-f]{24}$/i;

/** Returns true if `value` is a valid 24-character MongoDB ObjectId hex string. */
export function isValidObjectId(value: string): boolean {
  return OBJECT_ID_REGEX.test(value);
}

// ── Phone numbers ─────────────────────────────────────────────────────────────

/**
 * International E.164 phone regex (+ followed by 7–15 digits).
 * Example valid: +966512345678, +1-800-555-0199 (after stripping dashes).
 */
const E164_REGEX = /^\+[1-9]\d{6,14}$/;

/** Returns true if `value` is an E.164 international phone number. */
export function isValidE164Phone(value: string): boolean {
  const stripped = value.replace(/[\s\-().]/g, "");
  return E164_REGEX.test(stripped);
}

/**
 * Saudi Arabia phone number patterns:
 *   - Local: 05XXXXXXXX (10 digits, starts with 05)
 *   - International: +9665XXXXXXXX or 009665XXXXXXXX
 */
const SA_PHONE_LOCAL_REGEX       = /^05[0-9]{8}$/;
const SA_PHONE_INTERNATIONAL_REGEX = /^(\+9665|009665)[0-9]{8}$/;

/** Returns true if `value` is a valid Saudi Arabia phone number. */
export function isValidSaudiPhone(value: string): boolean {
  const stripped = value.replace(/[\s\-]/g, "");
  return SA_PHONE_LOCAL_REGEX.test(stripped) || SA_PHONE_INTERNATIONAL_REGEX.test(stripped);
}

/**
 * Normalises a Saudi phone number to E.164 format (+966XXXXXXXXX).
 * Returns undefined if the value is not a recognisable Saudi number.
 */
export function normaliseSaudiPhone(value: string): string | undefined {
  const s = value.replace(/[\s\-]/g, "");
  if (SA_PHONE_LOCAL_REGEX.test(s)) {
    return "+966" + s.slice(1); // 05XXXXXXXX → +9665XXXXXXXX
  }
  if (/^\+9665[0-9]{8}$/.test(s)) return s;
  if (/^009665[0-9]{8}$/.test(s)) return "+" + s.slice(2);
  return undefined;
}

// ── Arabic text ───────────────────────────────────────────────────────────────

/**
 * Arabic Unicode block (U+0600–U+06FF) plus common punctuation and spaces.
 * Returns true if the string contains at least one Arabic character.
 */
const ARABIC_CHAR_REGEX = /[\u0600-\u06FF]/;

/** Returns true if `value` contains at least one Arabic character. */
export function containsArabic(value: string): boolean {
  return ARABIC_CHAR_REGEX.test(value);
}

/**
 * Returns true if `value` consists entirely of Arabic characters,
 * Arabic numerals, spaces, and common punctuation.
 */
const ARABIC_ONLY_REGEX = /^[\u0600-\u06FF0-9\s\p{P}]+$/u;
export function isArabicOnly(value: string): boolean {
  return ARABIC_ONLY_REGEX.test(value);
}

// ── Numeric ───────────────────────────────────────────────────────────────────

/** Returns true if `value` is a finite, non-NaN number. */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Returns true if `value` is a safe integer. */
export function isSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

/** Returns true if `value` is strictly positive (> 0). */
export function isPositive(value: number): boolean {
  return value > 0;
}

/** Returns true if `value` is non-negative (>= 0). */
export function isNonNegative(value: number): boolean {
  return value >= 0;
}

/** Clamps `value` to the [min, max] range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ── String utilities ──────────────────────────────────────────────────────────

/**
 * Returns true if `value` is a non-empty string after trimming.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Truncates `value` to `maxLength` characters, appending `suffix` if truncated.
 */
export function truncate(value: string, maxLength: number, suffix = "…"): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Strips HTML tags from a string (basic — for plain-text safety, not XSS).
 * Use a proper sanitiser (DOMPurify, sanitize-html) for untrusted HTML.
 */
export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}

// ── Date ──────────────────────────────────────────────────────────────────────

/** Returns true if `value` is a valid ISO 8601 date string. */
export function isValidIsoDate(value: string): boolean {
  const d = new Date(value);
  return !isNaN(d.getTime()) && value.includes("T") || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Returns true if `value` is a Date instance that is not Invalid Date. */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

// ── Object / Array ────────────────────────────────────────────────────────────

/** Returns true if `value` is a plain object (not array, null, or class instance). */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

/** Returns true if `value` is an array with at least one element. */
export function isNonEmptyArray(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Returns the duplicate values in `array`.
 * Empty array means all items are unique.
 */
export function findDuplicates<T>(array: T[]): T[] {
  const seen = new Set<T>();
  const dupes = new Set<T>();
  for (const item of array) {
    if (seen.has(item)) dupes.add(item);
    else seen.add(item);
  }
  return Array.from(dupes);
}
