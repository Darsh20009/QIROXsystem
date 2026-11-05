# SEO_ENGINEERING.md — QIROX SEO Engineering Audit

> **Mode:** Audit only. No fixes. Document every issue.
> **Date:** 2026-07-08

---

## 1. SEO Implementation Status

From `.agents/memory/seo-coverage.md`:

**Pages WITH useSEO hook:**
- Home, About, Prices, Contact, Jobs, JoinUs, Systems, News, Partners

**sitemap.xml:** Present in `client/public/` — covers 14 public URLs.

**Pages WITHOUT SEO coverage (likely):**
- All 40+ admin pages (expected — not public)
- All employee portal pages (expected — not public)
- Client portal pages (expected — not public)
- Café demo (`/public/cafe-demo/`)
- Any public-facing page not in the list above

---

## 2. SEO Architecture

- **Type:** SPA (Single Page Application) — React with Wouter routing
- **Rendering:** Client-side only (no SSR/SSG)
- **SEO Hook:** Custom `useSEO` hook (per `.agents/memory`)
- **Implementation:** `JSON.stringify(config)` as dependency key — updates on navigation

---

## 3. SEO Issues (Audit)

### SEO-001 — SPA with No Server-Side Rendering
- **File:** Entire frontend
- **Problem:** The platform is a pure client-side React SPA. All HTML is rendered in the browser. The initial HTML response from the server is an empty `<div id="root"></div>`.
- **Risk:** Search engines (including Googlebot) may not execute JavaScript or may index empty pages. Arabic content — which is the primary target — may not be indexed.
- **Recommendation:** Implement SSR (Next.js migration) or pre-rendering (react-snap, vite-plugin-ssr) for all public-facing pages. At minimum, add static HTML fallbacks for core pages.
- **Priority:** CRITICAL

### SEO-002 — No Open Graph / Twitter Card Meta Tags Audited
- **File:** `client/src/lib/` (useSEO hook), public pages
- **Problem:** Open Graph (`og:title`, `og:description`, `og:image`) and Twitter Card tags have not been audited for completeness.
- **Risk:** Links shared on WhatsApp, Twitter/X, LinkedIn, and other platforms show blank previews instead of rich cards.
- **Recommendation:** Audit `useSEO` hook to ensure `og:*` and `twitter:*` tags are set. Add `og:image` pointing to a platform logo. Verify with Open Graph debugger.
- **Priority:** HIGH

### SEO-003 — Arabic Language Meta Tags
- **File:** `client/src/` (HTML template, useSEO hook)
- **Problem:** It is unclear whether `<html lang="ar" dir="rtl">` is correctly set in the root HTML, and whether `hreflang` alternate links are present for the bilingual content.
- **Risk:** Google may not rank the Arabic content appropriately. Missing `lang` attribute causes screen readers to mispronounce Arabic text.
- **Recommendation:** Verify `lang="ar"` is set on the `<html>` element. For bilingual pages, add `<link rel="alternate" hreflang="ar" ...>` and `<link rel="alternate" hreflang="en" ...>`.
- **Priority:** HIGH

### SEO-004 — Sitemap Coverage Incomplete
- **File:** `client/public/sitemap.xml`
- **Problem:** Sitemap covers 14 public URLs. This may miss dynamic content pages (individual news articles, system/template detail pages).
- **Risk:** New content (blog posts, system pages) is not submitted to search engines automatically.
- **Recommendation:** Generate a dynamic sitemap from MongoDB (news articles, systems/templates) via a server endpoint (`/sitemap.xml`) that reads from the DB.
- **Priority:** HIGH

### SEO-005 — No robots.txt Audit
- **File:** `client/public/robots.txt` (assumed — not verified)
- **Problem:** The presence and correctness of `robots.txt` has not been verified.
- **Risk:** Without `robots.txt`, search engines may crawl authenticated pages (`/admin`, `/employee`) and waste crawl budget. If `robots.txt` is misconfigured, public pages may be blocked.
- **Recommendation:** Verify `robots.txt` exists. Ensure: `Disallow: /admin`, `Disallow: /employee`, `Disallow: /client`, `Allow: /` for public pages. Include `Sitemap:` directive.
- **Priority:** HIGH

### SEO-006 — No Structured Data (Schema.org)
- **File:** `client/src/pages/` (public pages)
- **Problem:** No JSON-LD structured data found on any page.
- **Risk:** Missing rich snippets for: Organization, Product/Service, FAQ, BreadcrumbList. Competitors with structured data rank higher in SERPs.
- **Recommendation:** Add JSON-LD structured data to: Home (Organization), Systems (SoftwareApplication), Prices (Offer), News (Article), Jobs (JobPosting).
- **Priority:** MEDIUM

### SEO-007 — Page Speed / Core Web Vitals Not Measured
- **File:** Frontend build output
- **Problem:** No Lighthouse or Core Web Vitals baseline exists.
- **Risk:** Poor LCP (Largest Contentful Paint) and CLS (Cumulative Layout Shift) scores reduce search rankings. SPA with heavy JS bundle is a known Core Web Vitals risk.
- **Recommendation:** Run Lighthouse audit on the production URL. Target LCP < 2.5s, CLS < 0.1, FID < 100ms.
- **Priority:** MEDIUM

### SEO-008 — Canonical URLs Not Audited
- **File:** `client/src/` (useSEO hook)
- **Problem:** Whether canonical `<link rel="canonical">` tags are set correctly for all public pages has not been verified.
- **Risk:** Duplicate content issues if pages are accessible at multiple URLs (e.g., trailing slash variants).
- **Recommendation:** Ensure `useSEO` sets `<link rel="canonical" href="https://qirox.sa/page-path">` for every public page.
- **Priority:** MEDIUM

---

## 4. Sitemap Coverage Matrix

| URL | In Sitemap | Has useSEO | Notes |
|---|---|---|---|
| `/` (Home) | ✅ | ✅ | |
| `/about` | ✅ | ✅ | |
| `/prices` | ✅ | ✅ | |
| `/contact` | ✅ | ✅ | |
| `/jobs` | ✅ | ✅ | |
| `/join-us` | ✅ | ✅ | |
| `/systems` | ✅ | ✅ | |
| `/news` | ✅ | ✅ | |
| `/partners` | ✅ | ✅ | |
| `/news/:id` | ❓ | ❓ | Dynamic — needs audit |
| `/systems/:id` | ❓ | ❓ | Dynamic — needs audit |
| `/admin/*` | ❌ | N/A | Must be blocked |
| `/employee/*` | ❌ | N/A | Must be blocked |
| `/client/*` | ❌ | N/A | Must be blocked |
