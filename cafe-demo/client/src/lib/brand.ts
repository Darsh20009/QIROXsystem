// ═══════════════════════════════════════════════════════════════════════════
//  ██████╗ ██████╗  █████╗ ███╗   ██╗██████╗      ██████╗ ██████╗ ███╗   ██╗███████╗██╗ ██████╗
//  ██╔══██╗██╔══██╗██╔══██╗████╗  ██║██╔══██╗    ██╔════╝██╔═══██╗████╗  ██║██╔════╝██║██╔════╝
//  ██████╔╝██████╔╝███████║██╔██╗ ██║██║  ██║    ██║     ██║   ██║██╔██╗ ██║█████╗  ██║██║  ███╗
//  ██╔══██╗██╔══██╗██╔══██║██║╚██╗██║██║  ██║    ██║     ██║   ██║██║╚██╗██║██╔══╝  ██║██║   ██║
//  ██████╔╝██║  ██║██║  ██║██║ ╚████║██████╔╝    ╚██████╗╚██████╔╝██║ ╚████║██║     ██║╚██████╔╝
//  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝      ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝     ╚═╝ ╚═════╝
//
//  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
//  │                        MASTER BRAND CONFIGURATION — SINGLE SOURCE OF TRUTH                  │
//  │                                                                                             │
//  │  This file controls EVERY branding detail across the entire QIROX system:                  │
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
  nameEn: "QIROX Cafe",

  /** Full system name in Arabic — shown in Arabic UI, receipts, notifications */
  nameAr: "كيروكس كافيه",

  /** Short display name used in tight spaces (PWA label, browser tab) */
  shortNameEn: "QIROX",

  /** Short display name in Arabic */
  shortNameAr: "كيروكس",

  /** Internal system/platform brand — shown in the admin/staff panel header */
  platformNameEn: "QIROX Systems",

  /** Internal platform name in Arabic */
  platformNameAr: "نظام كيروكس",

  /** Tagline shown under the logo in customer-facing screens */
  taglineEn: "Exceptional Coffee Experience",

  /** Tagline in Arabic */
  taglineAr: "تجربة قهوة استثنائية",

  /** One-line marketing description (used in meta tags, manifests) */
  descriptionEn: "Enjoy the finest coffee crafted with care. Order now from QIROX Cafe for an exceptional coffee experience.",

  /** Arabic marketing description */
  descriptionAr: "استمتع بأفضل قهوة محضرة بعناية فائقة من كيروكس كافيه - اطلب الآن واستمتع بتجربة قهوة استثنائية",

  /** Keywords for SEO meta tag */
  keywords: "قهوة, QIROX Cafe, coffee, cafe, كافيه, اسبريسو, لاتيه, كابتشينو, موكا, قهوة سعودية, طلب قهوة, توصيل قهوة",


  // ───────────────────────────────────────────────────────────────────────
  //  LOGO & VISUAL ASSETS
  //  Paths are relative to /public in the web app
  //  Use @assets/... for imported assets in components
  // ───────────────────────────────────────────────────────────────────────

  /** Main customer-facing logo (used in customer app, receipts, loyalty card, QR cards) */
  logoCustomer: "/logo.png",

  /** Staff/employee portal logo (used in sidebars, login screens, employee app) */
  logoStaff: "/employee-logo.png",

  /** Favicon (browser tab icon) */
  favicon: "/logo.png",

  /** Apple touch icon (iOS home screen) */
  appleTouchIcon: "/apple-touch-icon.png",

  /** Logo URL for imported asset (Vite @assets path) — used in TSX files with import */
  logoAssetCustomer: "qirox-logo-customer.png",

  /** Staff logo asset path */
  logoAssetStaff: "qirox-logo-staff.png",

  /** Logo URL for email templates (must be absolute/public URL) */
  logoEmailUrl: "https://raw.githubusercontent.com/Darsh20009/QIROXsystem/main/client/public/logo.png",

  /** Open Graph / social share image */
  ogImageUrl: "/logo.png",


  // ───────────────────────────────────────────────────────────────────────
  //  COLORS  — HSL format (H S% L%) for Tailwind CSS variable injection
  //  Change these to instantly rebrand the entire color scheme
  //  The applyBrandColors() function below injects these into CSS at runtime
  // ───────────────────────────────────────────────────────────────────────

  colors: {
    /** Primary brand color — used for buttons, highlights, accents */
    primary: {
      h: 155,
      s: 60,
      l: 38,
      /** Hex equivalent for use in non-CSS contexts (manifests, meta tags) */
      hex: "#2D9B6E",
    },

    /** Lighter primary variant (hover states, dark mode) */
    primaryLight: {
      h: 155,
      s: 60,
      l: 45,
      hex: "#34B87E",
    },

    /** App background — near-black for the dark theme */
    background: {
      h: 20,
      s: 14,
      l: 4,
      hex: "#0f0907",
    },

    /** Card/surface color */
    surface: {
      h: 20,
      s: 14,
      l: 8,
      hex: "#180e0a",
    },

    /** Text accent (headings, active items) */
    accent: {
      h: 155,
      s: 60,
      l: 55,
      hex: "#3DD68C",
    },
  },


  // ───────────────────────────────────────────────────────────────────────
  //  PWA / MANIFEST SETTINGS
  // ───────────────────────────────────────────────────────────────────────

  /** Theme color used by browser chrome (address bar, status bar on mobile) */
  themeColor: "#2D9B6E",

  /** Background color shown while PWA is loading */
  pwaBackgroundColor: "#1a1a1a",

  /** App display mode */
  pwaDisplay: "standalone" as const,


  // ───────────────────────────────────────────────────────────────────────
  //  CONTACT & SOCIAL
  // ───────────────────────────────────────────────────────────────────────

  website: "qiroxstudio.online",
  websiteUrl: "https://www.qiroxstudio.online",

  emailNoReply: "noreply@qiroxstudio.online",
  emailSupport: "support@qiroxstudio.online",

  social: {
    instagram: "@qiroxcafe",
    twitter: "@qiroxcafe",
    snapchat: "@qiroxcafe",
    tiktok: "@qiroxcafe",
  },


  // ───────────────────────────────────────────────────────────────────────
  //  LOYALTY / POINTS PROGRAM
  // ───────────────────────────────────────────────────────────────────────

  pointsBrandEn: "QIROX Points",
  pointsBrandAr: "نقاط كيروكس",

  cardBrandEn: "QIROX Card",
  cardBrandAr: "بطاقة كيروكس",

  loyaltyTaglineEn: "QIROX Cafe Loyalty",
  loyaltyTaglineAr: "برنامج ولاء كيروكس",


  // ───────────────────────────────────────────────────────────────────────
  //  AI ASSISTANT IDENTITY
  // ───────────────────────────────────────────────────────────────────────

  aiAssistantNameEn: "QIROX AI Assistant",
  aiAssistantNameAr: "مساعد كيروكس الذكي",


  // ───────────────────────────────────────────────────────────────────────
  //  COPYRIGHT
  // ───────────────────────────────────────────────────────────────────────

  copyrightEn: `© ${new Date().getFullYear()} QIROX Systems. All rights reserved.`,
  copyrightAr: `© ${new Date().getFullYear()} كيروكس سيستمز - جميع الحقوق محفوظة`,

} as const;


// ═══════════════════════════════════════════════════════════════════════════
//  HELPER UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/** Returns a color as a CSS HSL string, e.g. "155 60% 38%" */
export function hsl(color: { h: number; s: number; l: number }): string {
  return `${color.h} ${color.s}% ${color.l}%`;
}

/** Returns full hsl() call, e.g. "hsl(155, 60%, 38%)" */
export function hslFull(color: { h: number; s: number; l: number }): string {
  return `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
}

/**
 * Applies brand colors to CSS custom properties at runtime.
 * Call this once in your app entry point (main.tsx or App.tsx).
 * This allows changing colors in brand.ts to instantly affect the whole UI.
 */
export function applyBrandColors(): void {
  const root = document.documentElement;
  const { colors } = brand;

  root.style.setProperty("--primary", hsl(colors.primary));
  root.style.setProperty("--primary-light", hsl(colors.primaryLight));
  root.style.setProperty("--ring", hsl(colors.primary));
  root.style.setProperty("--success", hsl(colors.primary));

  // PWA theme color meta tag
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", brand.themeColor);
  }
}

/**
 * Updates the browser tab title with the brand name.
 * @param pageTitle Optional page title to prepend before the brand name.
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
