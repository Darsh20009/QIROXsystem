// ═══════════════════════════════════════════════════════════════════════════
//  ██████╗ ██╗      █████╗  ██████╗██╗  ██╗    ██████╗  ██████╗ ███████╗███████╗
//  ██╔══██╗██║     ██╔══██╗██╔════╝██║ ██╔╝    ██╔══██╗██╔═══██╗██╔════╝██╔════╝
//  ██████╔╝██║     ███████║██║     █████╔╝     ██████╔╝██║   ██║███████╗█████╗
//  ██╔══██╗██║     ██╔══██║██║     ██╔═██╗     ██╔══██╗██║   ██║╚════██║██╔══╝
//  ██████╔╝███████╗██║  ██║╚██████╗██║  ██╗    ██║  ██║╚██████╔╝███████║███████╗
//  ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚══════╝
//
//  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
//  │                        MASTER BRAND CONFIGURATION — SINGLE SOURCE OF TRUTH                  │
//  │                                                                                             │
//  │  This file controls EVERY branding detail across the entire BLACK ROSE system:             │
//  │  • System name (Arabic + English)                                                           │
//  │  • Logo paths (customer app, staff app, admin panel)                                        │
//  │  • Primary & accent colors (HSL format for Tailwind + CSS variables)                        │
//  │  • App metadata (title, description, keywords, Open Graph)                                  │
//  │  • PWA manifest settings (theme color, background color, display name)                      │
//  │  • Contact / social info (email, phone, website, social handles)                            │
//  │  • Loyalty / points program name                                                            │
//  │  • Email template branding                                                                  │
//  │                                                                                             │
//  │  HOW TO REBRAND:                                                                            │
//  │  1. Change the values below                                                                 │
//  │  2. Run: npm run dev — the entire system reflects the new brand instantly                   │
//  └─────────────────────────────────────────────────────────────────────────────────────────────┘
// ═══════════════════════════════════════════════════════════════════════════

export const brand = {

  // ───────────────────────────────────────────────────────────────────────
  //  SYSTEM IDENTITY
  // ───────────────────────────────────────────────────────────────────────

  /** Full system name in English — shown in headers, titles, receipts, emails */
  nameEn: "Restaurant",

  /** Full system name in Arabic — shown in Arabic UI, receipts, notifications */
  nameAr: "المطعم",

  /** Short display name used in tight spaces (PWA label, browser tab) */
  shortNameEn: "Restaurant",

  /** Short display name in Arabic */
  shortNameAr: "المطعم",

  /** Internal system/platform brand — shown in the admin/staff panel header */
  platformNameEn: "Restaurant",

  /** Internal platform name in Arabic */
  platformNameAr: "المطعم",

  /** Tagline shown under the logo in customer-facing screens */
  taglineEn: "",

  /** Tagline in Arabic */
  taglineAr: "",

  /** One-line marketing description (used in meta tags, manifests) */
  descriptionEn: "",

  /** Arabic marketing description */
  descriptionAr: "",

  /** Keywords for SEO meta tag */
  keywords: "restaurant, cafe, menu",


  // ───────────────────────────────────────────────────────────────────────
  //  LOGO & VISUAL ASSETS
  //  Paths are relative to /public in the web app
  //  Use @assets/... for imported assets in components
  // ───────────────────────────────────────────────────────────────────────

  /** Main customer-facing logo (used in customer app, receipts, loyalty card, QR cards) */
  logoCustomer: "/tenant-logo.svg",

  /** Staff/employee portal logo (used in sidebars, login screens, employee app) */
  logoStaff: "/tenant-logo.svg",

  /** Favicon (browser tab icon) */
  favicon: "/tenant-mark.svg",

  /** Apple touch icon (iOS home screen) */
  appleTouchIcon: "/tenant-mark.svg",

  /** Logo URL for imported asset (Vite @assets path) — used in TSX files with import */
  logoAssetCustomer: "/tenant-logo.svg",

  /** Staff logo asset path */
  logoAssetStaff: "/tenant-logo.svg",

  /** Logo URL for email templates (must be absolute/public URL) */
  logoEmailUrl: "",

  /** Open Graph / social share image */
  ogImageUrl: "",


  // ───────────────────────────────────────────────────────────────────────
  //  COLORS  — HSL format (H S% L%) for Tailwind CSS variable injection
  //  BLACK ROSE — deep black with crimson rose accent
  // ───────────────────────────────────────────────────────────────────────

  colors: {
    /** Primary brand color — QIROX Purple (Foodics-style) */
    primary: {
      h: 262,
      s: 83,
      l: 58,
      hex: "#24433e",
    },

    /** Lighter primary variant (hover states) */
    primaryLight: {
      h: 262,
      s: 78,
      l: 68,
      hex: "#24433e",
    },

    /** App background — pure white */
    background: {
      h: 0,
      s: 0,
      l: 100,
      hex: "#24433e",
    },

    /** Card/surface color */
    surface: {
      h: 0,
      s: 0,
      l: 7,
      hex: "#24433e",
    },

    /** Text accent (headings, active items) */
    accent: {
      h: 345,
      s: 75,
      l: 65,
      hex: "#24433e",
    },
  },


  // ───────────────────────────────────────────────────────────────────────
  //  PWA / MANIFEST SETTINGS
  // ───────────────────────────────────────────────────────────────────────

  /** Theme color used by browser chrome */
  themeColor: "#24433e",

  /** Background color shown while PWA is loading */
  pwaBackgroundColor: "#ffffff",

  /** App display mode */
  pwaDisplay: "standalone" as const,


  // ───────────────────────────────────────────────────────────────────────
  //  CONTACT & SOCIAL
  // ───────────────────────────────────────────────────────────────────────

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

/** Returns a color as a CSS HSL string, e.g. "345 70% 42%" */
export function hsl(color: { h: number; s: number; l: number }): string {
  return `${color.h} ${color.s}% ${color.l}%`;
}

/** Returns full hsl() call, e.g. "hsl(345, 70%, 42%)" */
export function hslFull(color: { h: number; s: number; l: number }): string {
  return `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
}

/**
 * Applies brand colors to CSS custom properties at runtime.
 * Call this once in your app entry point (main.tsx or App.tsx).
 */
export function applyBrandColors(): void {
  const root = document.documentElement;
  const { colors } = brand;

  root.style.setProperty("--primary", hsl(colors.primary));
  root.style.setProperty("--primary-light", hsl(colors.primaryLight));
  root.style.setProperty("--ring", hsl(colors.primary));
  root.style.setProperty("--accent", hsl(colors.accent));
  root.style.setProperty("--accent-foreground", "0 0% 100%");

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", brand.themeColor);
  }
}

/**
 * Updates the browser tab title with the brand name.
 */
export function setPageTitle(pageTitle?: string): void {
  document.title = pageTitle
    ? `${pageTitle} | ${brand.nameEn}`
    : `${brand.nameEn} | ${brand.taglineEn}`;
}

/** Returns the full display name based on language preference */
export function getBrandName(lang: "ar" | "en" = "ar"): string {
  return lang === "ar" ? brand.nameAr : brand.nameEn;
}

/** Returns the platform name (used in staff/admin portals) */
export function getPlatformName(lang: "ar" | "en" = "ar"): string {
  return lang === "ar" ? brand.platformNameAr : brand.platformNameEn;
}

/** Returns the tagline */
export function getTagline(lang: "ar" | "en" = "ar"): string {
  return lang === "ar" ? brand.taglineAr : brand.taglineEn;
}

/** Returns copyright text */
export function getCopyright(lang: "ar" | "en" = "ar"): string {
  return lang === "ar" ? brand.copyrightAr : brand.copyrightEn;
}

export default brand;
