import { useState, useEffect } from "react";

export type CurrencyCode =
  | "SAR" | "AED" | "KWD" | "QAR" | "BHD" | "OMR"
  | "EGP" | "JOD" | "IQD" | "LYD" | "TND" | "DZD" | "MAD" | "SDG"
  | "ILS" | "LBP"
  | "USD" | "EUR" | "GBP" | "CHF" | "SEK" | "NOK" | "DKK"
  | "PLN" | "CZK" | "HUF" | "RON" | "RUB" | "UAH"
  | "TRY" | "PKR" | "INR" | "BDT" | "LKR" | "NPR"
  | "JPY" | "CNY" | "KRW" | "SGD" | "MYR" | "THB" | "PHP" | "IDR" | "VND" | "MMK"
  | "CAD" | "AUD" | "NZD"
  | "BRL" | "MXN" | "ARS" | "CLP" | "COP" | "PEN"
  | "ZAR" | "NGN" | "KES" | "GHS" | "ETB" | "TZS" | "UGX" | "XOF";

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
  /* ── الخليج العربي ── */
  SA: { code: "SAR", symbol: "ريال",        symbolShort: "ر.س",  locale: "ar-SA", rate: 1 },
  AE: { code: "AED", symbol: "درهم",        symbolShort: "د.إ",  locale: "ar-AE", rate: 0.98 },
  KW: { code: "KWD", symbol: "دينار",       symbolShort: "د.ك",  locale: "ar-KW", rate: 0.082 },
  QA: { code: "QAR", symbol: "ريال",        symbolShort: "ر.ق",  locale: "ar-QA", rate: 1.03 },
  BH: { code: "BHD", symbol: "دينار",       symbolShort: "د.ب",  locale: "ar-BH", rate: 0.099 },
  OM: { code: "OMR", symbol: "ريال",        symbolShort: "ر.ع",  locale: "ar-OM", rate: 0.102 },
  /* ── المشرق العربي ── */
  EG: { code: "EGP", symbol: "جنيه",        symbolShort: "ج.م",  locale: "ar-EG", rate: 7.0 },
  JO: { code: "JOD", symbol: "دينار",       symbolShort: "د.أ",  locale: "ar-JO", rate: 0.19 },
  IQ: { code: "IQD", symbol: "دينار",       symbolShort: "د.ع",  locale: "ar-IQ", rate: 350 },
  IL: { code: "ILS", symbol: "شيكل",        symbolShort: "₪",    locale: "he-IL", rate: 0.98 },
  LB: { code: "LBP", symbol: "ليرة",        symbolShort: "ل.ل",  locale: "ar-LB", rate: 24000 },
  SY: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "ar-SY", rate: 0.267 },
  PS: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "ar-PS", rate: 0.267 },
  YE: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "ar-YE", rate: 0.267 },
  /* ── شمال أفريقيا ── */
  LY: { code: "LYD", symbol: "دينار",       symbolShort: "د.ل",  locale: "ar-LY", rate: 1.28 },
  TN: { code: "TND", symbol: "دينار",       symbolShort: "د.ت",  locale: "ar-TN", rate: 0.83 },
  DZ: { code: "DZD", symbol: "دينار",       symbolShort: "د.ج",  locale: "ar-DZ", rate: 36 },
  MA: { code: "MAD", symbol: "درهم",        symbolShort: "د.م",  locale: "ar-MA", rate: 2.67 },
  SD: { code: "SDG", symbol: "جنيه",        symbolShort: "ج.س",  locale: "ar-SD", rate: 163 },
  /* ── أوروبا الغربية ── */
  US: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "en-US", rate: 0.267 },
  CA: { code: "CAD", symbol: "دولار كندي",  symbolShort: "C$",   locale: "en-CA", rate: 0.37 },
  GB: { code: "GBP", symbol: "جنيه إسترليني", symbolShort: "£",  locale: "en-GB", rate: 0.21 },
  IE: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "en-IE", rate: 0.245 },
  DE: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "de-DE", rate: 0.245 },
  FR: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "fr-FR", rate: 0.245 },
  IT: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "it-IT", rate: 0.245 },
  ES: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "es-ES", rate: 0.245 },
  PT: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "pt-PT", rate: 0.245 },
  NL: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "nl-NL", rate: 0.245 },
  BE: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "fr-BE", rate: 0.245 },
  AT: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "de-AT", rate: 0.245 },
  GR: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "el-GR", rate: 0.245 },
  FI: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "fi-FI", rate: 0.245 },
  LU: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "fr-LU", rate: 0.245 },
  MT: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "mt-MT", rate: 0.245 },
  CY: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "el-CY", rate: 0.245 },
  SI: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "sl-SI", rate: 0.245 },
  HR: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "hr-HR", rate: 0.245 },
  SK: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "sk-SK", rate: 0.245 },
  EE: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "et-EE", rate: 0.245 },
  LV: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "lv-LV", rate: 0.245 },
  LT: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "lt-LT", rate: 0.245 },
  /* ── أوروبا — عملات مستقلة ── */
  CH: { code: "CHF", symbol: "فرنك سويسري", symbolShort: "CHF",  locale: "de-CH", rate: 0.24 },
  SE: { code: "SEK", symbol: "كرونة سويدية",symbolShort: "kr",   locale: "sv-SE", rate: 2.76 },
  NO: { code: "NOK", symbol: "كرونة نرويجية",symbolShort: "kr",  locale: "nb-NO", rate: 2.83 },
  DK: { code: "DKK", symbol: "كرونة دنماركية",symbolShort: "kr", locale: "da-DK", rate: 1.84 },
  PL: { code: "PLN", symbol: "زلوتي",       symbolShort: "zł",   locale: "pl-PL", rate: 1.09 },
  CZ: { code: "CZK", symbol: "كرونة تشيكية",symbolShort: "Kč",  locale: "cs-CZ", rate: 6.2 },
  HU: { code: "HUF", symbol: "فورنت",       symbolShort: "Ft",   locale: "hu-HU", rate: 98 },
  RO: { code: "RON", symbol: "ليو",         symbolShort: "lei",  locale: "ro-RO", rate: 1.22 },
  BG: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "bg-BG", rate: 0.245 },
  RS: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "sr-RS", rate: 0.245 },
  BA: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "bs-BA", rate: 0.245 },
  MK: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "mk-MK", rate: 0.245 },
  AL: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "sq-AL", rate: 0.245 },
  /* ── أوروبا الشرقية ── */
  RU: { code: "RUB", symbol: "روبل",        symbolShort: "₽",    locale: "ru-RU", rate: 24 },
  UA: { code: "UAH", symbol: "هريفنيا",     symbolShort: "₴",    locale: "uk-UA", rate: 10.5 },
  BY: { code: "EUR", symbol: "يورو",        symbolShort: "€",    locale: "be-BY", rate: 0.245 },
  /* ── تركيا وآسيا الوسطى ── */
  TR: { code: "TRY", symbol: "ليرة",        symbolShort: "₺",    locale: "tr-TR", rate: 9.0 },
  GE: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "ka-GE", rate: 0.267 },
  AZ: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "az-AZ", rate: 0.267 },
  AM: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "hy-AM", rate: 0.267 },
  KZ: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "kk-KZ", rate: 0.267 },
  UZ: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "uz-UZ", rate: 0.267 },
  /* ── جنوب آسيا ── */
  PK: { code: "PKR", symbol: "روبية",       symbolShort: "₨",    locale: "ur-PK", rate: 75 },
  IN: { code: "INR", symbol: "روبية",       symbolShort: "₹",    locale: "hi-IN", rate: 22 },
  BD: { code: "BDT", symbol: "تاكا",        symbolShort: "৳",    locale: "bn-BD", rate: 31 },
  LK: { code: "LKR", symbol: "روبية سريلانكية", symbolShort: "Rs", locale: "si-LK", rate: 85 },
  NP: { code: "NPR", symbol: "روبية نيبالية",   symbolShort: "Rs", locale: "ne-NP", rate: 35 },
  AF: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "fa-AF", rate: 0.267 },
  IR: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "fa-IR", rate: 0.267 },
  /* ── شرق آسيا ── */
  JP: { code: "JPY", symbol: "ين",          symbolShort: "¥",    locale: "ja-JP", rate: 40.5 },
  CN: { code: "CNY", symbol: "يوان",        symbolShort: "¥",    locale: "zh-CN", rate: 1.93 },
  KR: { code: "KRW", symbol: "وون",         symbolShort: "₩",    locale: "ko-KR", rate: 370 },
  TW: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "zh-TW", rate: 0.267 },
  HK: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "zh-HK", rate: 2.08 },
  MO: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "zh-MO", rate: 2.15 },
  MN: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "mn-MN", rate: 0.267 },
  /* ── جنوب شرق آسيا ── */
  SG: { code: "SGD", symbol: "دولار سنغافوري", symbolShort: "S$", locale: "en-SG", rate: 0.36 },
  MY: { code: "MYR", symbol: "رنغيت",       symbolShort: "RM",   locale: "ms-MY", rate: 1.24 },
  TH: { code: "THB", symbol: "بات",         symbolShort: "฿",    locale: "th-TH", rate: 9.8 },
  PH: { code: "PHP", symbol: "بيسو",        symbolShort: "₱",    locale: "fil-PH", rate: 15.5 },
  ID: { code: "IDR", symbol: "روبية",       symbolShort: "Rp",   locale: "id-ID", rate: 4350 },
  VN: { code: "VND", symbol: "دونغ",        symbolShort: "₫",    locale: "vi-VN", rate: 6900 },
  MM: { code: "MMK", symbol: "كيات",        symbolShort: "K",    locale: "my-MM", rate: 560 },
  KH: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "km-KH", rate: 0.267 },
  LA: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "lo-LA", rate: 0.267 },
  BN: { code: "SGD", symbol: "دولار",       symbolShort: "S$",   locale: "ms-BN", rate: 0.36 },
  TL: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "pt-TL", rate: 0.267 },
  /* ── أوقيانوسيا ── */
  AU: { code: "AUD", symbol: "دولار أسترالي", symbolShort: "A$", locale: "en-AU", rate: 0.41 },
  NZ: { code: "NZD", symbol: "دولار نيوزيلندي", symbolShort: "NZ$", locale: "en-NZ", rate: 0.45 },
  FJ: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "en-FJ", rate: 0.6 },
  PG: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "en-PG", rate: 1.0 },
  /* ── أمريكا الشمالية والوسطى ── */
  MX: { code: "MXN", symbol: "بيسو مكسيكي", symbolShort: "MX$", locale: "es-MX", rate: 5.3 },
  GT: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "es-GT", rate: 0.267 },
  BZ: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "en-BZ", rate: 0.535 },
  HN: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "es-HN", rate: 6.6 },
  SV: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "es-SV", rate: 0.267 },
  NI: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "es-NI", rate: 9.7 },
  CR: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "es-CR", rate: 138 },
  PA: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "es-PA", rate: 0.267 },
  CU: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "es-CU", rate: 0.267 },
  DO: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "es-DO", rate: 16 },
  JM: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "en-JM", rate: 41 },
  HT: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "fr-HT", rate: 36 },
  TT: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "en-TT", rate: 1.81 },
  BB: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "en-BB", rate: 0.535 },
  BS: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "en-BS", rate: 0.267 },
  /* ── أمريكا الجنوبية ── */
  BR: { code: "BRL", symbol: "ريال برازيلي", symbolShort: "R$",  locale: "pt-BR", rate: 1.57 },
  AR: { code: "ARS", symbol: "بيسو أرجنتيني", symbolShort: "AR$", locale: "es-AR", rate: 250 },
  CL: { code: "CLP", symbol: "بيسو تشيلي",  symbolShort: "CL$",  locale: "es-CL", rate: 252 },
  CO: { code: "COP", symbol: "بيسو كولومبي", symbolShort: "CO$", locale: "es-CO", rate: 1100 },
  PE: { code: "PEN", symbol: "سول",         symbolShort: "S/",   locale: "es-PE", rate: 1.0 },
  VE: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "es-VE", rate: 0.267 },
  BO: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "es-BO", rate: 1.84 },
  UY: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "es-UY", rate: 10.5 },
  PY: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "es-PY", rate: 1970 },
  EC: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "es-EC", rate: 0.267 },
  GY: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "en-GY", rate: 56 },
  SR: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "nl-SR", rate: 9.5 },
  /* ── أفريقيا ── */
  ZA: { code: "ZAR", symbol: "راند",        symbolShort: "R",    locale: "en-ZA", rate: 5.0 },
  NG: { code: "NGN", symbol: "نيرة",        symbolShort: "₦",    locale: "en-NG", rate: 430 },
  KE: { code: "KES", symbol: "شلن كيني",    symbolShort: "KSh",  locale: "sw-KE", rate: 35 },
  GH: { code: "GHS", symbol: "سيدي",        symbolShort: "GH₵",  locale: "ak-GH", rate: 4.0 },
  ET: { code: "ETB", symbol: "بر",          symbolShort: "Br",   locale: "am-ET", rate: 32 },
  TZ: { code: "TZS", symbol: "شلن تنزاني",  symbolShort: "TSh",  locale: "sw-TZ", rate: 700 },
  UG: { code: "UGX", symbol: "شلن أوغندي",  symbolShort: "USh",  locale: "sw-UG", rate: 1000 },
  SN: { code: "XOF", symbol: "فرنك أفريقي", symbolShort: "CFA",  locale: "fr-SN", rate: 161 },
  CI: { code: "XOF", symbol: "فرنك أفريقي", symbolShort: "CFA",  locale: "fr-CI", rate: 161 },
  ML: { code: "XOF", symbol: "فرنك أفريقي", symbolShort: "CFA",  locale: "fr-ML", rate: 161 },
  BF: { code: "XOF", symbol: "فرنك أفريقي", symbolShort: "CFA",  locale: "fr-BF", rate: 161 },
  NE: { code: "XOF", symbol: "فرنك أفريقي", symbolShort: "CFA",  locale: "fr-NE", rate: 161 },
  TD: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "fr-TD", rate: 0.267 },
  CM: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "fr-CM", rate: 0.267 },
  GA: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "fr-GA", rate: 0.267 },
  CG: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "fr-CG", rate: 0.267 },
  CD: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "fr-CD", rate: 0.267 },
  AO: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "pt-AO", rate: 250 },
  MZ: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "pt-MZ", rate: 17 },
  ZM: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "en-ZM", rate: 7.5 },
  ZW: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "en-ZW", rate: 0.267 },
  SO: { code: "USD", symbol: "دولار",       symbolShort: "$",    locale: "so-SO", rate: 150 },
};

const FALLBACK: CurrencyDef = { code: "SAR", symbol: "ريال", symbolShort: "ر.س", locale: "ar-SA", rate: 1 };

const TIMEZONE_COUNTRY: Record<string, string> = {
  /* ── الخليج العربي ── */
  "Asia/Riyadh":          "SA",
  "Asia/Kuwait":          "KW",
  "Asia/Qatar":           "QA",
  "Asia/Bahrain":         "BH",
  "Asia/Muscat":          "OM",
  "Asia/Dubai":           "AE",
  /* ── المشرق العربي ── */
  "Africa/Cairo":         "EG",
  "Asia/Amman":           "JO",
  "Asia/Baghdad":         "IQ",
  "Asia/Jerusalem":       "IL",
  "Asia/Tel_Aviv":        "IL",
  "Asia/Beirut":          "LB",
  "Asia/Damascus":        "SY",
  "Asia/Gaza":            "PS",
  "Asia/Hebron":          "PS",
  "Asia/Aden":            "YE",
  /* ── شمال أفريقيا ── */
  "Africa/Tripoli":       "LY",
  "Africa/Tunis":         "TN",
  "Africa/Algiers":       "DZ",
  "Africa/Casablanca":    "MA",
  "Africa/El_Aaiun":      "MA",
  "Africa/Khartoum":      "SD",
  /* ── أوروبا الغربية ── */
  "Europe/London":        "GB",
  "Europe/Dublin":        "IE",
  "Europe/Berlin":        "DE",
  "Europe/Paris":         "FR",
  "Europe/Rome":          "IT",
  "Europe/Madrid":        "ES",
  "Europe/Lisbon":        "PT",
  "Atlantic/Azores":      "PT",
  "Atlantic/Madeira":     "PT",
  "Europe/Amsterdam":     "NL",
  "Europe/Brussels":      "BE",
  "Europe/Vienna":        "AT",
  "Europe/Athens":        "GR",
  "Europe/Helsinki":      "FI",
  "Europe/Luxembourg":    "LU",
  "Europe/Malta":         "MT",
  "Europe/Nicosia":       "CY",
  "Europe/Ljubljana":     "SI",
  "Europe/Zagreb":        "HR",
  "Europe/Bratislava":    "SK",
  "Europe/Tallinn":       "EE",
  "Europe/Riga":          "LV",
  "Europe/Vilnius":       "LT",
  /* ── أوروبا — عملات مستقلة ── */
  "Europe/Zurich":        "CH",
  "Europe/Stockholm":     "SE",
  "Europe/Oslo":          "NO",
  "Europe/Copenhagen":    "DK",
  "Europe/Warsaw":        "PL",
  "Europe/Prague":        "CZ",
  "Europe/Budapest":      "HU",
  "Europe/Bucharest":     "RO",
  "Europe/Sofia":         "BG",
  "Europe/Belgrade":      "RS",
  "Europe/Sarajevo":      "BA",
  "Europe/Skopje":        "MK",
  "Europe/Tirane":        "AL",
  "Europe/Podgorica":     "RS",
  /* ── أوروبا الشرقية ── */
  "Europe/Moscow":        "RU",
  "Europe/Samara":        "RU",
  "Europe/Saratov":       "RU",
  "Europe/Ulyanovsk":     "RU",
  "Europe/Volgograd":     "RU",
  "Europe/Astrakhan":     "RU",
  "Europe/Kirov":         "RU",
  "Europe/Kaliningrad":   "RU",
  "Asia/Yekaterinburg":   "RU",
  "Asia/Omsk":            "RU",
  "Asia/Novosibirsk":     "RU",
  "Asia/Barnaul":         "RU",
  "Asia/Tomsk":           "RU",
  "Asia/Novokuznetsk":    "RU",
  "Asia/Krasnoyarsk":     "RU",
  "Asia/Irkutsk":         "RU",
  "Asia/Chita":           "RU",
  "Asia/Yakutsk":         "RU",
  "Asia/Khandyga":        "RU",
  "Asia/Vladivostok":     "RU",
  "Asia/Ust-Nera":        "RU",
  "Asia/Magadan":         "RU",
  "Asia/Sakhalin":        "RU",
  "Asia/Srednekolymsk":   "RU",
  "Asia/Kamchatka":       "RU",
  "Asia/Anadyr":          "RU",
  "Europe/Kiev":          "UA",
  "Europe/Kyiv":          "UA",
  "Europe/Uzhgorod":      "UA",
  "Europe/Zaporozhye":    "UA",
  "Europe/Minsk":         "BY",
  /* ── تركيا وآسيا الوسطى ── */
  "Europe/Istanbul":      "TR",
  "Asia/Tbilisi":         "GE",
  "Asia/Baku":            "AZ",
  "Asia/Yerevan":         "AM",
  "Asia/Almaty":          "KZ",
  "Asia/Qostanay":        "KZ",
  "Asia/Aqtau":           "KZ",
  "Asia/Aqtobe":          "KZ",
  "Asia/Atyrau":          "KZ",
  "Asia/Oral":            "KZ",
  "Asia/Tashkent":        "UZ",
  "Asia/Samarkand":       "UZ",
  "Asia/Ashgabat":        "UZ",
  "Asia/Dushanbe":        "UZ",
  "Asia/Bishkek":         "UZ",
  "Asia/Kabul":           "AF",
  "Asia/Tehran":          "IR",
  /* ── جنوب آسيا ── */
  "Asia/Karachi":         "PK",
  "Asia/Kolkata":         "IN",
  "Asia/Calcutta":        "IN",
  "Asia/Dhaka":           "BD",
  "Asia/Colombo":         "LK",
  "Asia/Kathmandu":       "NP",
  "Asia/Katmandu":        "NP",
  /* ── شرق آسيا ── */
  "Asia/Tokyo":           "JP",
  "Asia/Shanghai":        "CN",
  "Asia/Beijing":         "CN",
  "Asia/Chongqing":       "CN",
  "Asia/Chungking":       "CN",
  "Asia/Harbin":          "CN",
  "Asia/Kashgar":         "CN",
  "Asia/Urumqi":          "CN",
  "Asia/Seoul":           "KR",
  "Asia/Taipei":          "TW",
  "Asia/Hong_Kong":       "HK",
  "Asia/Macau":           "MO",
  "Asia/Macao":           "MO",
  "Asia/Ulaanbaatar":     "MN",
  "Asia/Ulan_Bator":      "MN",
  /* ── جنوب شرق آسيا ── */
  "Asia/Singapore":       "SG",
  "Asia/Kuala_Lumpur":    "MY",
  "Asia/Kuching":         "MY",
  "Asia/Bangkok":         "TH",
  "Asia/Phnom_Penh":      "KH",
  "Asia/Vientiane":       "LA",
  "Asia/Manila":          "PH",
  "Asia/Jakarta":         "ID",
  "Asia/Makassar":        "ID",
  "Asia/Pontianak":       "ID",
  "Asia/Jayapura":        "ID",
  "Asia/Ho_Chi_Minh":     "VN",
  "Asia/Saigon":          "VN",
  "Asia/Hanoi":           "VN",
  "Asia/Rangoon":         "MM",
  "Asia/Yangon":          "MM",
  "Asia/Dili":            "TL",
  "Asia/Brunei":          "BN",
  /* ── أوقيانوسيا ── */
  "Australia/Sydney":     "AU",
  "Australia/Melbourne":  "AU",
  "Australia/Brisbane":   "AU",
  "Australia/Perth":      "AU",
  "Australia/Adelaide":   "AU",
  "Australia/Darwin":     "AU",
  "Australia/Hobart":     "AU",
  "Australia/Lord_Howe":  "AU",
  "Pacific/Auckland":     "NZ",
  "Pacific/Chatham":      "NZ",
  "Pacific/Fiji":         "FJ",
  "Pacific/Port_Moresby": "PG",
  "Pacific/Honolulu":     "US",
  "Pacific/Guam":         "US",
  /* ── أمريكا الشمالية ── */
  "America/New_York":     "US",
  "America/Chicago":      "US",
  "America/Denver":       "US",
  "America/Phoenix":      "US",
  "America/Los_Angeles":  "US",
  "America/Anchorage":    "US",
  "America/Adak":         "US",
  "America/Indiana/Indianapolis": "US",
  "America/Indiana/Knox":        "US",
  "America/Indiana/Marengo":     "US",
  "America/Indiana/Petersburg":  "US",
  "America/Indiana/Tell_City":   "US",
  "America/Indiana/Vevay":       "US",
  "America/Indiana/Vincennes":   "US",
  "America/Indiana/Winamac":     "US",
  "America/Kentucky/Louisville":  "US",
  "America/Kentucky/Monticello":  "US",
  "America/North_Dakota/Beulah":  "US",
  "America/North_Dakota/Center":  "US",
  "America/North_Dakota/New_Salem": "US",
  "America/Toronto":      "CA",
  "America/Vancouver":    "CA",
  "America/Edmonton":     "CA",
  "America/Winnipeg":     "CA",
  "America/Halifax":      "CA",
  "America/St_Johns":     "CA",
  "America/Regina":       "CA",
  "America/Whitehorse":   "CA",
  "America/Yellowknife":  "CA",
  "America/Iqaluit":      "CA",
  "America/Moncton":      "CA",
  /* ── أمريكا الوسطى والكاريبي ── */
  "America/Mexico_City":  "MX",
  "America/Monterrey":    "MX",
  "America/Merida":       "MX",
  "America/Mazatlan":     "MX",
  "America/Chihuahua":    "MX",
  "America/Hermosillo":   "MX",
  "America/Cancun":       "MX",
  "America/Matamoros":    "MX",
  "America/Ojinaga":      "MX",
  "America/Bahia_Banderas": "MX",
  "America/Tijuana":      "MX",
  "America/Guatemala":    "GT",
  "America/Belize":       "BZ",
  "America/Tegucigalpa":  "HN",
  "America/El_Salvador":  "SV",
  "America/Managua":      "NI",
  "America/Costa_Rica":   "CR",
  "America/Panama":       "PA",
  "America/Havana":       "CU",
  "America/Santo_Domingo": "DO",
  "America/Jamaica":      "JM",
  "America/Port-au-Prince": "HT",
  "America/Port_of_Spain": "TT",
  "America/Barbados":     "BB",
  "America/Nassau":       "BS",
  /* ── أمريكا الجنوبية ── */
  "America/Sao_Paulo":    "BR",
  "America/Bahia":        "BR",
  "America/Belem":        "BR",
  "America/Fortaleza":    "BR",
  "America/Recife":       "BR",
  "America/Maceio":       "BR",
  "America/Araguaina":    "BR",
  "America/Santarem":     "BR",
  "America/Cuiaba":       "BR",
  "America/Campo_Grande": "BR",
  "America/Porto_Velho":  "BR",
  "America/Manaus":       "BR",
  "America/Boa_Vista":    "BR",
  "America/Rio_Branco":   "BR",
  "America/Noronha":      "BR",
  "America/Buenos_Aires": "AR",
  "America/Argentina/Buenos_Aires": "AR",
  "America/Argentina/Cordoba":     "AR",
  "America/Argentina/Salta":       "AR",
  "America/Argentina/Jujuy":       "AR",
  "America/Argentina/Tucuman":     "AR",
  "America/Argentina/Catamarca":   "AR",
  "America/Argentina/La_Rioja":    "AR",
  "America/Argentina/San_Juan":    "AR",
  "America/Argentina/Mendoza":     "AR",
  "America/Argentina/San_Luis":    "AR",
  "America/Argentina/Rio_Gallegos": "AR",
  "America/Argentina/Ushuaia":     "AR",
  "America/Santiago":     "CL",
  "Pacific/Easter":       "CL",
  "America/Bogota":       "CO",
  "America/Lima":         "PE",
  "America/Caracas":      "VE",
  "America/La_Paz":       "BO",
  "America/Montevideo":   "UY",
  "America/Asuncion":     "PY",
  "America/Guayaquil":    "EC",
  "America/Guyana":       "GY",
  "America/Paramaribo":   "SR",
  /* ── أفريقيا ── */
  "Africa/Lagos":         "NG",
  "Africa/Nairobi":       "KE",
  "Africa/Accra":         "GH",
  "Africa/Abidjan":       "CI",
  "Africa/Dakar":         "SN",
  "Africa/Bamako":        "ML",
  "Africa/Ouagadougou":   "BF",
  "Africa/Niamey":        "NE",
  "Africa/Ndjamena":      "TD",
  "Africa/Douala":        "CM",
  "Africa/Libreville":    "GA",
  "Africa/Brazzaville":   "CG",
  "Africa/Kinshasa":      "CD",
  "Africa/Lubumbashi":    "CD",
  "Africa/Bangui":        "CF",
  "Africa/Malabo":        "CI",
  "Africa/Johannesburg":  "ZA",
  "Africa/Addis_Ababa":   "ET",
  "Africa/Dar_es_Salaam": "TZ",
  "Africa/Kampala":       "UG",
  "Africa/Kigali":        "UG",
  "Africa/Bujumbura":     "UG",
  "Africa/Lusaka":        "ZM",
  "Africa/Harare":        "ZW",
  "Africa/Mogadishu":     "SO",
  "Africa/Djibouti":      "SO",
  "Africa/Asmara":        "ET",
  "Africa/Asmera":        "ET",
  "Africa/Luanda":        "AO",
  "Africa/Maputo":        "MZ",
  "Africa/Blantyre":      "ZM",
  "Africa/Windhoek":      "ZA",
  "Africa/Gaborone":      "ZA",
  "Africa/Maseru":        "ZA",
  "Africa/Mbabane":       "ZA",
  "Africa/Antananarivo":  "ET",
  "Africa/Moroni":        "ET",
  "Africa/Conakry":       "SN",
  "Africa/Bissau":        "SN",
  "Africa/Freetown":      "SN",
  "Africa/Monrovia":      "SN",
  "Africa/Lome":          "SN",
  "Africa/Porto-Novo":    "SN",
  "Africa/Sao_Tome":      "SN",
  "Africa/Banjul":        "SN",
  "Africa/Nouakchott":    "MA",
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
  if (code === "KWD" || code === "BHD" || code === "OMR") {
    return parseFloat(n.toFixed(3)).toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 3 });
  }
  if (code === "JPY" || code === "KRW" || code === "IDR" || code === "VND" || code === "MMK"
    || code === "CLP" || code === "COP" || code === "IQD" || code === "UGX" || code === "TZS"
    || code === "HUF" || code === "LBP" || code === "SDG" || code === "IRR") {
    return Math.round(n).toLocaleString(locale);
  }
  return Math.round(n).toLocaleString(locale);
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

export function getSupportedCountryCodes(): string[] {
  return Object.keys(CURRENCY_MAP);
}
