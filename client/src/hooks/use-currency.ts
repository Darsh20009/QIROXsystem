import { useState, useEffect } from "react";

export type CurrencyCode =
  | "SAR" | "AED" | "KWD" | "QAR" | "BHD" | "OMR"
  | "EGP" | "JOD" | "IQD" | "LYD" | "TND" | "DZD" | "MAD" | "SDG"
  | "USD" | "EUR" | "GBP" | "TRY" | "PKR" | "INR";

export type CurrencyInfo = {
  countryCode: string;
  code: CurrencyCode;
  symbol: string;
  symbolShort: string;
  locale: string;
  convert: (sar: number) => number;
  format: (sar: number) => string;
  formatRaw: (amount: number) => string;
  isEgypt: boolean;
  isSaudi: boolean;
};

type CurrencyDef = {
  code: CurrencyCode;
  symbol: string;
  symbolShort: string;
  locale: string;
  rate: number;
};

const CURRENCY_MAP: Record<string, CurrencyDef> = {
  SA: { code: "SAR", symbol: "ريال",    symbolShort: "ر.س",  locale: "ar-SA", rate: 1 },
  AE: { code: "AED", symbol: "درهم",    symbolShort: "د.إ",  locale: "ar-AE", rate: 0.98 },
  KW: { code: "KWD", symbol: "دينار",   symbolShort: "د.ك",  locale: "ar-KW", rate: 0.082 },
  QA: { code: "QAR", symbol: "ريال",    symbolShort: "ر.ق",  locale: "ar-QA", rate: 1.03 },
  BH: { code: "BHD", symbol: "دينار",   symbolShort: "د.ب",  locale: "ar-BH", rate: 0.099 },
  OM: { code: "OMR", symbol: "ريال",    symbolShort: "ر.ع",  locale: "ar-OM", rate: 0.102 },
  EG: { code: "EGP", symbol: "جنيه",    symbolShort: "ج.م",  locale: "ar-EG", rate: 7.0 },
  JO: { code: "JOD", symbol: "دينار",   symbolShort: "د.أ",  locale: "ar-JO", rate: 0.19 },
  IQ: { code: "IQD", symbol: "دينار",   symbolShort: "د.ع",  locale: "ar-IQ", rate: 350 },
  LY: { code: "LYD", symbol: "دينار",   symbolShort: "د.ل",  locale: "ar-LY", rate: 1.28 },
  TN: { code: "TND", symbol: "دينار",   symbolShort: "د.ت",  locale: "ar-TN", rate: 0.83 },
  DZ: { code: "DZD", symbol: "دينار",   symbolShort: "د.ج",  locale: "ar-DZ", rate: 36 },
  MA: { code: "MAD", symbol: "درهم",    symbolShort: "د.م",  locale: "ar-MA", rate: 2.67 },
  SD: { code: "SDG", symbol: "جنيه",    symbolShort: "ج.س",  locale: "ar-SD", rate: 163 },
  US: { code: "USD", symbol: "دولار",   symbolShort: "$",    locale: "en-US", rate: 0.267 },
  CA: { code: "USD", symbol: "دولار",   symbolShort: "$",    locale: "en-US", rate: 0.267 },
  GB: { code: "GBP", symbol: "جنيه إ.", symbolShort: "£",    locale: "en-GB", rate: 0.21 },
  DE: { code: "EUR", symbol: "يورو",    symbolShort: "€",    locale: "de-DE", rate: 0.245 },
  FR: { code: "EUR", symbol: "يورو",    symbolShort: "€",    locale: "fr-FR", rate: 0.245 },
  IT: { code: "EUR", symbol: "يورو",    symbolShort: "€",    locale: "it-IT", rate: 0.245 },
  ES: { code: "EUR", symbol: "يورو",    symbolShort: "€",    locale: "es-ES", rate: 0.245 },
  NL: { code: "EUR", symbol: "يورو",    symbolShort: "€",    locale: "nl-NL", rate: 0.245 },
  BE: { code: "EUR", symbol: "يورو",    symbolShort: "€",    locale: "fr-BE", rate: 0.245 },
  AT: { code: "EUR", symbol: "يورو",    symbolShort: "€",    locale: "de-AT", rate: 0.245 },
  SE: { code: "EUR", symbol: "يورو",    symbolShort: "€",    locale: "sv-SE", rate: 0.245 },
  NO: { code: "EUR", symbol: "يورو",    symbolShort: "€",    locale: "nb-NO", rate: 0.245 },
  TR: { code: "TRY", symbol: "ليرة",    symbolShort: "₺",    locale: "tr-TR", rate: 9.0 },
  PK: { code: "PKR", symbol: "روبية",   symbolShort: "₨",    locale: "ur-PK", rate: 75 },
  IN: { code: "INR", symbol: "روبية",   symbolShort: "₹",    locale: "hi-IN", rate: 22 },
  AU: { code: "USD", symbol: "دولار",   symbolShort: "$",    locale: "en-AU", rate: 0.41 },
};

const FALLBACK: CurrencyDef = { code: "SAR", symbol: "ريال", symbolShort: "ر.س", locale: "ar-SA", rate: 1 };

const TIMEZONE_COUNTRY: Record<string, string> = {
  "Africa/Cairo": "EG",
  "Asia/Dubai": "AE",
  "Asia/Muscat": "OM",
  "Asia/Kuwait": "KW",
  "Asia/Qatar": "QA",
  "Asia/Bahrain": "BH",
  "Asia/Riyadh": "SA",
  "Asia/Amman": "JO",
  "Asia/Baghdad": "IQ",
  "Europe/Istanbul": "TR",
  "Africa/Tripoli": "LY",
  "Africa/Tunis": "TN",
  "Africa/Algiers": "DZ",
  "Africa/Casablanca": "MA",
  "Africa/Khartoum": "SD",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Los_Angeles": "US",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "Europe/London": "GB",
  "Europe/Berlin": "DE",
  "Europe/Paris": "FR",
  "Europe/Rome": "IT",
  "Europe/Madrid": "ES",
  "Europe/Amsterdam": "NL",
  "Europe/Stockholm": "SE",
  "Europe/Oslo": "NO",
  "Asia/Karachi": "PK",
  "Asia/Kolkata": "IN",
  "Australia/Sydney": "AU",
};

function detectCountryByTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_COUNTRY[tz] || "";
  } catch {
    return "";
  }
}

function fmtNum(n: number, locale: string, code: CurrencyCode): string {
  const rounded = Math.round(n);
  if (code === "KWD" || code === "BHD" || code === "OMR") {
    return parseFloat(n.toFixed(3)).toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 3 });
  }
  return rounded.toLocaleString(locale);
}

function buildCurrencyInfo(countryCode: string, def: CurrencyDef): CurrencyInfo {
  const isSaudi = countryCode === "SA" || countryCode === "";
  const isEgypt = countryCode === "EG";
  return {
    countryCode,
    code: def.code,
    symbol: def.symbol,
    symbolShort: def.symbolShort,
    locale: def.locale,
    isEgypt,
    isSaudi,
    convert: (sar) => {
      if (def.code === "KWD" || def.code === "BHD" || def.code === "OMR") return parseFloat((sar * def.rate).toFixed(3));
      return Math.round(sar * def.rate);
    },
    format: (sar) => fmtNum(sar * def.rate, def.locale, def.code),
    formatRaw: (amt) => fmtNum(amt, def.locale, def.code),
  };
}

let cachedCountryCode: string | null = null;
let fetchPromise: Promise<string> | null = null;

async function fetchCountryCode(): Promise<string> {
  if (cachedCountryCode !== null) return cachedCountryCode;
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) })
    .then(r => r.json())
    .then(d => {
      cachedCountryCode = d.country_code || "";
      return cachedCountryCode as string;
    })
    .catch(() => { cachedCountryCode = ""; return ""; });
  return fetchPromise;
}

export async function getCountryCode(): Promise<string> {
  const byTz = detectCountryByTimezone();
  if (byTz) return byTz;
  return fetchCountryCode();
}

export function useCurrency(forceSAR = false): CurrencyInfo {
  const [countryCode, setCountryCode] = useState<string>(() => {
    if (forceSAR) return "SA";
    return detectCountryByTimezone();
  });

  useEffect(() => {
    if (forceSAR) return;
    if (countryCode) return;
    fetchCountryCode().then(code => {
      if (code) setCountryCode(code);
    });
  }, [forceSAR]);

  if (forceSAR) {
    return buildCurrencyInfo("SA", FALLBACK);
  }

  const def = CURRENCY_MAP[countryCode] || FALLBACK;
  return buildCurrencyInfo(countryCode || "SA", def);
}

export function useSARCurrency(): CurrencyInfo {
  return buildCurrencyInfo("SA", FALLBACK);
}

export function getCurrencyForCountry(countryCode: string): CurrencyDef {
  return CURRENCY_MAP[countryCode] || FALLBACK;
}
