# BRAND_IDENTITY.md — QIROX Brand Identity Audit

> **Mode:** Audit only. No fixes. Document every issue.
> **Date:** 2026-07-08

---

## 1. Brand Overview

**Brand Name:** QIROX (قيروكس)  
**Tagline:** مصنع الأنظمة الرقمية — Digital Systems Factory  
**Market Position:** Premium Arabic-language SaaS platform for SMEs in the Arab world / GCC  
**Primary Market:** Saudi Arabia (KSA flag shown in nav)  
**Language:** Arabic-first, bilingual (AR/EN)

---

## 2. Logo Assets (Current State)

From `.agents/memory/logo-migration.md`:

| Asset | Location | Status |
|---|---|---|
| Primary icon | `client/public/qirox-icon.png` | Active — transparent background |
| Icon copy | `client/public/qirox-icon-nobg.png` | Active — copy of above |
| Old @assets logo | Replaced system-wide | Migrated |
| Loader logo | `public/qirox-loader-logo.png` | In use |

**Notes:**
- Both `qirox-icon.png` and `qirox-icon-nobg.png` must exist in `client/public/`
- No invert filter needed for nav/sidebar/footer

---

## 3. Brand Issues (Audit)

### BRAND-001 — No Brand Guidelines Document
- **File:** N/A (does not exist)
- **Problem:** No formal brand guidelines exist in the codebase or documentation. Color palette, typography choices, logo usage rules, and icon system are undocumented.
- **Risk:** Developers make ad-hoc visual decisions. Inconsistency grows across 166 pages over time. New team members have no reference.
- **Recommendation:** This document should be populated with: primary/secondary colors (hex values from CSS variables), approved fonts (Arabic + Latin), logo minimum size, clear space rules, and forbidden modifications.
- **Priority:** MEDIUM

### BRAND-002 — Brand Name Casing Inconsistency
- **File:** Various (README, replit.md, page titles)
- **Problem:** The brand name appears as "QIROX", "Qirox", and "qirox" in different contexts.
- **Risk:** Inconsistent brand name presentation reduces professional credibility.
- **Recommendation:** Standardize: "QIROX" for the brand name in UI. "qirox" for technical identifiers (package names, URLs, CSS classes).
- **Priority:** LOW

### BRAND-003 — App Name in Capacitor Config Not Audited
- **File:** `capacitor.config.json`
- **Problem:** The app name displayed on the iOS/Android home screen (Capacitor `appName`) has not been verified to match the brand.
- **Risk:** App appears as the wrong name on user devices.
- **Recommendation:** Verify `appName` in `capacitor.config.json` is "QIROX" or "قيروكس" as appropriate for the target market.
- **Priority:** MEDIUM

### BRAND-004 — Favicon / App Icon Coverage
- **File:** `client/public/`, `ios/` assets
- **Problem:** Favicon coverage for all required sizes and contexts (browser tab, iOS home screen, Android home screen, PWA manifest) has not been fully audited.
- **Risk:** App icon may appear pixelated or default on certain devices. Missing favicon types reduce brand recognition.
- **Recommendation:** Audit `client/public/` for all required favicon sizes: 16x16, 32x32, 180x180 (Apple Touch Icon), 192x192 and 512x512 (PWA manifest). Verify iOS assets in `ios-assets/`.
- **Priority:** LOW

### BRAND-005 — Email Template Brand Consistency
- **File:** `server/email.ts`
- **Problem:** Email templates reference `EMAIL_LOGO_URL` and `EMAIL_SITE_URL` env vars (not set). Brand consistency in transactional emails has not been audited.
- **Risk:** Outgoing emails (invoices, password reset, subscription confirmation) may display without the logo or with incorrect brand colors.
- **Recommendation:** Set `EMAIL_LOGO_URL` and `EMAIL_SITE_URL`. Audit email templates for brand color accuracy, font usage, and Arabic RTL text alignment.
- **Priority:** MEDIUM

---

## 4. Brand Color Tokens (To Be Populated)

> The following table should be filled in once the Tailwind config and CSS variables are fully audited.

| Token | CSS Variable | Hex | Usage |
|---|---|---|---|
| Primary | `--primary` | TBD | CTA buttons, active states |
| Primary Foreground | `--primary-foreground` | TBD | Text on primary |
| Secondary | `--secondary` | TBD | Secondary actions |
| Background | `--background` | TBD | Page background |
| Foreground | `--foreground` | TBD | Body text |
| Muted | `--muted` | TBD | Subtle backgrounds |
| Accent | `--accent` | TBD | Highlights |
| Destructive | `--destructive` | TBD | Error/delete actions |
| Border | `--border` | TBD | Dividers, inputs |

---

## 5. Typography (To Be Populated)

> Fill in after auditing `tailwind.config.ts` and `client/src/index.css`.

| Use | Font Family | Weight | Notes |
|---|---|---|---|
| Arabic body | TBD | TBD | RTL |
| Arabic heading | TBD | TBD | RTL |
| Latin body | TBD | TBD | LTR |
| Code (Monaco) | Monospace | TBD | Sandbox IDE |
