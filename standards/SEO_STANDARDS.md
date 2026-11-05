# SEO_STANDARDS.md — QIROX SEO Standards

> **Source of truth:** docs/SEO_ENGINEERING.md, docs/SEO_ENGINEERING_PLAN.md, docs/BRAND_IDENTITY.md  
> **Scope:** client/src/pages/ (all public-facing pages), client/public/sitemap.xml  
> **Status:** Enforcement-ready — no production code modified

---

## Purpose

Define the SEO implementation rules for all public-facing QIROX pages. Derived from docs/SEO_ENGINEERING.md. QIROX targets Arabic-speaking markets (KSA, GCC) — Arabic SEO requirements are primary.

---

## Rules

### R-SEO-001 — Every Page Must Use the `useSEO` Hook
Every public page must call the `useSEO()` hook from `client/src/hooks/useSEO.ts` with a complete configuration object. Per docs/SEO_ENGINEERING.md and memory (SEO coverage):
```typescript
useSEO({
  title: 'صانع الأنظمة الرقمية للسوق العربي | QIROX',
  description: 'أوصاف حقيقية ودقيقة للصفحة...',
  keywords: [...],
  canonicalUrl: `${BASE_URL}/`,
  ogTitle: '...',
  ogDescription: '...',
  ogImage: '...',
  structuredData: { ... }
});
```

### R-SEO-002 — Title Format
All page titles must follow the format:
```
{Page Description in Arabic} | QIROX
```
Maximum length: 60 characters. Every title must be unique across pages. Per docs/SEO_ENGINEERING.md Section 2.

### R-SEO-003 — Meta Description Requirements
- Must be 150–160 characters
- Must be in Arabic for Arabic pages
- Must include target keywords naturally
- Must not be duplicated across pages
Per docs/SEO_ENGINEERING.md Section 2.

### R-SEO-004 — Canonical URLs Are Required on All Pages
Every page must set a canonical URL via the `useSEO` hook. Format: `https://qirox.sa/{path}`. Per docs/SEO_ENGINEERING.md Section 3.

### R-SEO-005 — Open Graph Tags Are Required
Every public page must have complete OG tags:
- `og:title`
- `og:description`
- `og:image` (min 1200×630px, WebP or JPEG)
- `og:url` (same as canonical)
- `og:type: "website"` (or `"article"` for blog posts)
- `og:locale: "ar_SA"`
Per docs/SEO_ENGINEERING.md Section 4.

### R-SEO-006 — Structured Data Is Required on Specific Pages
| Page | Schema Type |
|---|---|
| Home | `Organization`, `WebSite` |
| Services / Portfolio | `Service`, `ItemList` |
| Pricing | `PriceSpecification`, `Product` |
| Contact | `ContactPoint` |
| Blog/News | `Article`, `BreadcrumbList` |
Per docs/SEO_ENGINEERING_PLAN.md Section 3.

### R-SEO-007 — All Images Must Have Descriptive Arabic `alt` Attributes
Images on public pages must have `alt` attributes in Arabic. Empty `alt=""` is only valid for purely decorative images. Per docs/SEO_ENGINEERING.md Section 6.

### R-SEO-008 — Heading Hierarchy Must Be Respected
Each page must have exactly one `<h1>` containing the primary Arabic keyword. `<h2>` to `<h6>` must form a logical nested hierarchy. Do not skip levels. Per docs/SEO_ENGINEERING.md Section 5.

### R-SEO-009 — `sitemap.xml` Must Be Updated When Pages Are Added
`client/public/sitemap.xml` must include all new public pages within one sprint of their creation. The sitemap currently covers 14 URLs. Per memory (SEO coverage).

### R-SEO-010 — `robots.txt` Must Block Protected Routes
`client/public/robots.txt` must explicitly block:
- `/admin/*`
- `/client/*`
- `/employee/*`
- `/merchant/*`
- `/supplier/*`
- `/investor/*`
- `/api/*`
Per docs/SEO_ENGINEERING.md Section 7.

### R-SEO-011 — Arabic Language Tag Must Be Set
The document root must have `lang="ar"` and `dir="rtl"` for Arabic pages. When switching to English, both must update to `lang="en"` and `dir="ltr"`. Per docs/BRAND_IDENTITY.md Section 3 and docs/DESIGN_SYSTEM.md DS-004.

### R-SEO-012 — `hreflang` Tags Must Be Set for Bilingual Pages
Public pages with both Arabic and English versions must include:
```html
<link rel="alternate" hreflang="ar-SA" href="https://qirox.sa/{path}" />
<link rel="alternate" hreflang="en" href="https://qirox.sa/en/{path}" />
<link rel="alternate" hreflang="x-default" href="https://qirox.sa/{path}" />
```
Per docs/SEO_ENGINEERING_PLAN.md Section 2.

### R-SEO-013 — Core Web Vitals Must Meet Targets on Public Pages
Per docs/EXECUTION_PLAN.md Phase 5:
- LCP < 2.5s
- CLS < 0.1
- INP < 200ms
- Lighthouse Performance: > 80
- Lighthouse SEO: > 95

### R-SEO-014 — No JavaScript-Only Navigation for Public Page Links
Public page links must be standard `<a href>` or Wouter `<Link>` — not `onClick` navigations — so crawlers can follow them. Per docs/SEO_ENGINEERING.md Section 8.

---

## Allowed

- `useSEO` hook updating `document.title` and meta tags dynamically (already implemented)
- Arabic-Indic numerals (٠١٢٣) in Arabic content
- JSON-LD for structured data (preferred over Microdata)
- Static `sitemap.xml` updated manually until an SSG or SSR pipeline is added

---

## Forbidden

- Missing `useSEO` call on any public page
- Duplicate titles or descriptions across pages
- Missing canonical URL
- Empty `alt` attributes on non-decorative images
- Multiple `<h1>` tags on a single page
- Protected route URLs in `sitemap.xml`
- JavaScript-only navigation for public page links

---

## Examples

### Complete `useSEO` Call
```typescript
useSEO({
  title: 'أنظمة المطاعم والكافيهات | QIROX',
  description: 'احصل على نظام متكامل لإدارة مطعمك أو كافيهك — حجوزات، طلبات، نقاط بيع، وولاء. جاهز خلال 7 أيام.',
  keywords: ['نظام مطاعم', 'نظام كافيه', 'نقاط بيع', 'إدارة طلبات'],
  canonicalUrl: 'https://qirox.sa/systems/restaurant',
  ogTitle: 'نظام المطاعم المتكامل | QIROX',
  ogDescription: 'نظام شامل لإدارة المطاعم والكافيهات في السوق السعودي.',
  ogImage: 'https://qirox.sa/og/restaurant-system.jpg',
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'نظام إدارة المطاعم',
    provider: { '@type': 'Organization', name: 'QIROX' },
    areaServed: { '@type': 'Country', name: 'Saudi Arabia' }
  }
});
```

---

## Checklist

- [ ] `useSEO()` called with complete config on every public page
- [ ] Title unique, Arabic, < 60 chars, format: `{Description} | QIROX`
- [ ] Meta description 150–160 chars, unique, Arabic
- [ ] Canonical URL set
- [ ] All 5 OG tags present
- [ ] Structured data for relevant page type
- [ ] All images have Arabic `alt` attributes
- [ ] Single `<h1>` with primary keyword
- [ ] New page added to `sitemap.xml`
- [ ] Protected routes in `robots.txt` Disallow
- [ ] `lang="ar" dir="rtl"` on document root
- [ ] `hreflang` tags on bilingual pages

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| Missing `useSEO()` call on new public page | Add useSEO hook call at top of page component |
| English description on Arabic page | Write description in Arabic |
| Same OG image used across all pages | Create page-specific OG images (1200×630px) |
| No `<h1>` on marketing section page | Add visually prominent `<h1>` with primary keyword |
| New page missing from sitemap.xml | Add `<url>` entry to `client/public/sitemap.xml` |

---

## Future Scalability Considerations

- When blog/news section launches (docs/ROADMAP.md Phase 3), implement dynamic sitemap generation to avoid manual updates
- Consider Next.js or Astro for SSR/SSG on public pages to move from client-side meta updates to server-rendered HTML — critical for Arab market Google indexing
- When the platform expands to UAE/Egypt markets, add locale-specific `hreflang` variants for `ar-AE`, `ar-EG`
- Integrate Google Search Console programmatically to track Core Web Vitals and index coverage in CI reporting
