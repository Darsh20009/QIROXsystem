import { useState, useEffect } from "react";

export type CurrencyInfo = {
  isEgypt: boolean;
  code: "SAR" | "EGP";
  symbol: string;      // "ريال" | "جنيه"
  symbolShort: string; // "ر.س" | "ج.م"
  convert: (sar: number) => number;
  format: (sar: number) => string;
  formatRaw: (amount: number) => string;
};

const SAR_TO_EGP = 7; // × 14 ÷ 2

function detectEgyptByTimezone(): boolean {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz === "Africa/Cairo";
  } catch {
    return false;
  }
}

function fmtAr(n: number, locale: string): string {
  return Math.round(n).toLocaleString(locale);
}

let cachedCountry: string | null = null;
let fetchPromise: Promise<string> | null = null;

async function fetchCountry(): Promise<string> {
  if (cachedCountry !== null) return cachedCountry;
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) })
    .then(r => r.json())
    .then(d => { cachedCountry = d.country_code || ""; return cachedCountry as string; })
    .catch(() => { cachedCountry = ""; return ""; });
  return fetchPromise;
}

export function useCurrency(): CurrencyInfo {
  const [isEgypt, setIsEgypt] = useState<boolean>(() => detectEgyptByTimezone());

  useEffect(() => {
    if (isEgypt) return;
    fetchCountry().then(code => {
      if (code === "EG") setIsEgypt(true);
    });
  }, []);

  if (isEgypt) {
    return {
      isEgypt: true,
      code: "EGP",
      symbol: "جنيه",
      symbolShort: "ج.م",
      convert: (sar) => Math.round(sar * SAR_TO_EGP),
      format: (sar) => fmtAr(sar * SAR_TO_EGP, "ar-EG"),
      formatRaw: (amt) => fmtAr(amt, "ar-EG"),
    };
  }

  return {
    isEgypt: false,
    code: "SAR",
    symbol: "ريال",
    symbolShort: "ر.س",
    convert: (sar) => sar,
    format: (sar) => fmtAr(sar, "ar-SA"),
    formatRaw: (amt) => fmtAr(amt, "ar-SA"),
  };
}
