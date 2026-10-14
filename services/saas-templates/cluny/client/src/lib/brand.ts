export const brand = {
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

  logoCustomer: "/tenant-logo.svg",
  logoStaff: "/tenant-logo.svg",
  heroImageUrl: "",
  splashImageUrl: "",
  favicon: "/tenant-mark.svg",
  appleTouchIcon: "/tenant-mark.svg",
  logoAssetCustomer: "/tenant-logo.svg",
  logoAssetStaff: "/tenant-logo.svg",
  logoEmailUrl: "",
  ogImageUrl: "",

  colors: {
    primary: { h: 155, s: 55, l: 39, hex: "#2D9B6E" },
    primaryLight: { h: 155, s: 50, l: 50, hex: "#3EB882" },
    background: { h: 0, s: 0, l: 100, hex: "#FFFFFF" },
    surface: { h: 0, s: 0, l: 98, hex: "#FAFAFA" },
    accent: { h: 207, s: 90, l: 54, hex: "#2196F3" },
  },

  themeColor: "#24433e",
  pwaBackgroundColor: "#ffffff",
  pwaDisplay: "standalone" as const,

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

  commercialRegister: "",
  taxNumber: "",
  registrationNumber: "",
  saudiBusinessUrl: "",

  pointsBrandEn: "Points",
  pointsBrandAr: "نقاط",
  cardBrandEn: "Rewards",
  cardBrandAr: "مكافآت",
  loyaltyTaglineEn: "",
  loyaltyTaglineAr: "",

  aiAssistantNameEn: "Assistant",
  aiAssistantNameAr: "مساعد",

  copyrightEn: "",
  copyrightAr: "",
} as const;

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
  root.style.setProperty("--accent", hsl(colors.accent));
  root.style.setProperty("--accent-foreground", "0 0% 100%");
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) themeColorMeta.setAttribute("content", brand.themeColor);
}

export function setPageTitle(pageTitle?: string): void {
  document.title = pageTitle ? `${pageTitle} | ${brand.nameEn}` : `${brand.nameEn} | ${brand.taglineEn}`;
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
