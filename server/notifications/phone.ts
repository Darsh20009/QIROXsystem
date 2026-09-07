export type NormalizedPhone = {
  raw: string;
  digits: string;
  e164: string;
  valid: boolean;
  reason?: string;
};

/**
 * Conservative E.164 normalisation for QIROX contact data.
 *
 * A country is only inferred for local numbers and defaults to Saudi Arabia.
 * International numbers must contain a valid country code. The raw value should
 * remain available in the calling record for audit and user correction.
 */
export function normalizePhone(rawValue: unknown, defaultCountryCode = process.env.PHONE_DEFAULT_COUNTRY_CODE || "966"): NormalizedPhone {
  const raw = String(rawValue ?? "").trim();
  if (!raw) return { raw, digits: "", e164: "", valid: false, reason: "رقم الجوال مطلوب" };

  let value = raw
    .replace(/^(?:tel:|whatsapp:)/i, "")
    .replace(/[^\d+]/g, "");

  if (value.startsWith("00")) value = `+${value.slice(2)}`;
  const hadInternationalPrefix = value.startsWith("+");
  let digits = value.replace(/\D/g, "");

  if (!digits) return { raw, digits: "", e164: "", valid: false, reason: "رقم الجوال غير صالح" };
  if (hadInternationalPrefix && digits.startsWith("0")) {
    return { raw, digits, e164: "", valid: false, reason: "لا تضع صفر الرقم المحلي بعد علامة +؛ استخدم +966501234567" };
  }

  const country = String(defaultCountryCode).replace(/\D/g, "");
  if (!hadInternationalPrefix) {
    // Saudi local numbers: 05xxxxxxxx or 5xxxxxxxx.
    if (country === "966" && (/^05\d{8}$/.test(digits) || /^5\d{8}$/.test(digits))) {
      digits = `966${digits.replace(/^0/, "")}`;
    // Egypt local numbers: 01xxxxxxxxx.
    } else if (country === "20" && /^01\d{9}$/.test(digits)) {
      digits = `20${digits.slice(1)}`;
    } else if (digits.startsWith("0") && country) {
      digits = `${country}${digits.replace(/^0+/, "")}`;
    }
  }

  // Common malformed local prefixes after an explicit Saudi/Egypt country code.
  if (digits.startsWith("9660")) digits = `966${digits.slice(4)}`;
  if (digits.startsWith("200")) digits = `20${digits.slice(3)}`;

  if (!/^[1-9]\d{7,14}$/.test(digits)) {
    return { raw, digits, e164: "", valid: false, reason: "استخدم رقماً دولياً صحيحاً مثل +966501234567" };
  }

  return { raw, digits, e164: `+${digits}`, valid: true };
}