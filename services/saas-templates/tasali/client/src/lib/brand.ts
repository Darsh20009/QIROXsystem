// ═══════════════════════════════════════════════════════════════════════════
//  TASALI QURUMSH — MASTER BRAND CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const brand = {

  // ───────────────────────────────────────────────────────────────────────
  //  SYSTEM IDENTITY
  // ───────────────────────────────────────────────────────────────────────

  nameEn: "Restaurant",
  nameAr: "المطعم",
  shortNameEn: "Restaurant",
  shortNameAr: "المطعم",
  platformNameEn: "Restaurant",
  platformNameAr: "المطعم",
  taglineEn: "",
  taglineAr: "",
  descriptionEn: "",
  descriptionAr: "",
  keywords: "restaurant, cafe, menu",


  // ───────────────────────────────────────────────────────────────────────
  //  LOGO & VISUAL ASSETS
  // ───────────────────────────────────────────────────────────────────────

  logoCustomer: "/tenant-logo.svg",
  logoStaff: "/tenant-logo.svg",
  favicon: "/tenant-mark.svg",
  appleTouchIcon: "/tenant-mark.svg",
  logoAssetCustomer: "/tenant-logo.svg",
  logoAssetStaff: "/tenant-logo.svg",
  logoEmailUrl: "",
  ogImageUrl: "",


  // ───────────────────────────────────────────────────────────────────────
  //  COLORS — Tasali Qurumsh warm brown & golden palette
  // ───────────────────────────────────────────────────────────────────────

  colors: {
    primary: {
      h: 28,
      s: 65,
      l: 30,
      hex: "#24433e",
    },
    primaryLight: {
      h: 35,
      s: 70,
      l: 45,
      hex: "#24433e",
    },
    background: {
      h: 30,
      s: 10,
      l: 96,
      hex: "#24433e",
    },
    surface: {
      h: 30,
      s: 15,
      l: 92,
      hex: "#24433e",
    },
    accent: {
      h: 38,
      s: 80,
      l: 55,
      hex: "#24433e",
    },
  },


  // ───────────────────────────────────────────────────────────────────────
  //  PWA / MANIFEST SETTINGS
  // ───────────────────────────────────────────────────────────────────────

  themeColor: "#24433e",
  pwaBackgroundColor: "#ffffff",
  pwaDisplay: "standalone" as const,


  // ───────────────────────────────────────────────────────────────────────
  //  CONTACT & SOCIAL
  // ───────────────────────────────────────────────────────────────────────

  phone: "0537050013",
  phoneHref: "tel:0537050013",
  mapsUrl: "https://maps.app.goo.gl/AR47rGKS5QpWpRjv8",

  website: "",
  websiteUrl: "",
  emailNoReply: "",
  emailSupport: "",

  social: {
    instagram: "",
    twitter: "",
    snapchat: "",
    tiktok: "",
  },

  // ───────────────────────────────────────────────────────────────────────
  //  BUSINESS INFO
  // ───────────────────────────────────────────────────────────────────────

  commercialRegister: "",
  taxNumber: "",
  registrationNumber: "",
  saudiBusinessUrl: "",


  // ───────────────────────────────────────────────────────────────────────
  //  LOYALTY / POINTS PROGRAM
  // ───────────────────────────────────────────────────────────────────────

  pointsBrandEn: "Points",
  pointsBrandAr: "نقاط",

  cardBrandEn: "Rewards",
  cardBrandAr: "مكافآت",

  loyaltyTaglineEn: "",
  loyaltyTaglineAr: "",


  // ───────────────────────────────────────────────────────────────────────
  //  AI ASSISTANT IDENTITY
  // ───────────────────────────────────────────────────────────────────────

  aiAssistantNameEn: "Assistant",
  aiAssistantNameAr: "مساعد",


  // ───────────────────────────────────────────────────────────────────────
  //  COPYRIGHT
  // ───────────────────────────────────────────────────────────────────────

  copyrightEn: "",
  copyrightAr: "",

} as const;


// ═══════════════════════════════════════════════════════════════════════════
//  HELPER UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export function hsl(color: { h: number; s: number; l: number }): string {
  return `${color.h} ${color.s}% ${color.l}%`;
}

export function hslFull(color: { h: number; s: number; l: number }): string {
  return `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
}

export function applyBrandColors(): void {
  const root = document.documentElement;
  const { colors } = brand;

  root.style.setProperty("--primary", hsl(colors.primary));
  root.style.setProperty("--primary-light", hsl(colors.primaryLight));
  root.style.setProperty("--ring", hsl(colors.primary));
  root.style.setProperty("--success", hsl(colors.primary));

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", brand.themeColor);
  }
}

export function setPageTitle(pageTitle?: string): void {
  document.title = pageTitle
    ? `${pageTitle} | ${brand.nameEn}`
    : `${brand.nameEn} | ${brand.taglineEn}`;
}

export function getBrandName(lang: "ar" | "en" = "ar"): string {
  return lang === "ar" ? brand.nameAr : brand.nameEn;
}

export function getPlatformName(lang: "ar" | "en" = "ar"): string {
  return lang === "ar" ? brand.platformNameAr : brand.platformNameEn;
}

export function getTagline(lang: "ar" | "en" = "ar"): string {
  return lang === "ar" ? brand.taglineAr : brand.taglineEn;
}

export function getCopyright(lang: "ar" | "en" = "ar"): string {
  return lang === "ar" ? brand.copyrightAr : brand.copyrightEn;
}

export default brand;
