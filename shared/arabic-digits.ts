/**
 * Convert Arabic-Indic and Persian digits to Western digits.
 * Text surrounding the digits is preserved.
 */
export function normalizeArabicDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x06f0));
}
