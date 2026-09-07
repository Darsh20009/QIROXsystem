# SEO_ENGINEERING_PLAN.md — QIROX Technical SEO Architecture

> **Mode:** Blueprint only. No code modified.
> **Date:** 2026-07-08
> **Note:** Do not promise search rankings. This document focuses on technical excellence and best practices only.

---

## 1. Current SEO State Assessment

| Factor | Current | Gap |
|---|---|---|
| HTML lang attribute | ✅ `lang="ar" dir="rtl"` in index.html | None |
| Static meta tags (homepage) | ✅ Comprehensive in index.html `<head>` | None for homepage |
| Open Graph tags | ✅ Present in static HTML | ❌ Dynamic pages missing |
| Twitter/X Cards | ✅ Present in static HTML | ❌ Dynamic pages missing |
| JSON-LD Structured Data | ✅ 10 blocks in index.html | ❌ Page-specific schemas missing |
| hreflang (bilingual) | ✅ ar-SA + en-US in index.html | ❌ Dynamic pages missing |
| Canonical URLs | ✅ Present | ❌ Dynamic pages missing |
| Sitemap.xml | ✅ Static (14 URLs) | ❌ Dynamic content not included |
| robots.txt | ✅ Present (assumed) | ❌ Content not audited |
| SSR / Prerendering | ❌ None — pure SPA | Body content delayed indexing |
| Dynamic page meta | ❌ JS-only (useSEO hook) | All dynamic pages |
| Core Web Vitals | ❌ Not measured | Unknown |
| Image optimization | ❌ Not audited | Unknown |
| Arabic content indexing | ⚠️ Via Google JS rendering | Delayed (2nd wave) |

---

## 2. Rendering Strategy

### Current Architecture
```
HTTP Request → Express → Static index.html
                              │
                              └── <div id="root"></div> (empty)
                                  ↕ React hydrates (client JS)
                                  └── Content visible after ~2-3s
```

### V4 Target Architecture — Server-Side Prerendering for Public Pages

**Selected approach: Vite SSR for public pages + SPA for authenticated pages**

```
HTTP Request for /           → SSR handler → HTML with content → hydrate
HTTP Request for /news/123   → SSR handler → HTML with content → hydrate
HTTP Request for /systems    → SSR handler → HTML with content → hydrate

HTTP Request for /admin      → SPA (index.html) — no SSR needed (not indexed)
HTTP Request for /employee   → SPA (index.html) — no SSR needed
HTTP Request for /client     → SPA (index.html) — no SSR needed
```

**Implementation plan (not yet implemented):**
```typescript
// server/ssr.ts (design)
import { renderToString } from 'react-dom/server';

const PUBLIC_ROUTES = ['/', '/about', '/prices', '/systems', '/systems/:id',
                       '/news', '/news/:id', '/partners', '/jobs', '/contact'];

// For each public route: render React component server-side,
// inject HTML into index.html template, return full HTML response
```

### Quick Win Alternative (Lower effort): Build-time Prerendering
Use `vite-plugin-prerender` to generate static HTML for all known public routes at build time. Dynamic routes (news/:id, systems/:id) require SSR.

---

## 3. Metadata Engine Design

### Static Meta Layer (Already Implemented)
`client/index.html` — default meta tags for all pages:
- `<title>` — global brand title
- `<meta name="description">`
- `<meta name="keywords">`
- Open Graph tags
- Twitter Card tags
- 10 JSON-LD structured data blocks

### Dynamic Meta Layer (V4 Target)

The `useSEO` hook already exists and uses `JSON.stringify(config)` as the dependency key. The design is sound — extend it:

```typescript
// hooks/use-seo.ts (extended design — not implemented)
interface SEOConfig {
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  keywords?: string;
  image?: string;           // Absolute URL for OG image
  imageAlt?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  canonicalPath: string;    // e.g., '/news/my-article-slug'
  publishedAt?: Date;       // For Article schema
  modifiedAt?: Date;
  author?: string;
  noIndex?: boolean;        // For authenticated pages
  jsonLd?: object;          // Page-specific JSON-LD
  breadcrumbs?: { name: string; url: string }[];
  hreflang?: { lang: string; href: string }[];
}
```

**Each page that currently uses `useSEO` should add:**
- `image` — page-specific OG image
- `canonicalPath` — exact path for canonical
- `jsonLd` — page-specific structured data
- `breadcrumbs` — for internal pages

---

## 4. Structured Data Plan (JSON-LD)

### Already Implemented (in index.html)
- Organization schema
- LocalBusiness schema
- WebSite schema + SearchAction
- SoftwareApplication schema
- FAQPage schema
- BreadcrumbList schema
- Product/Offer schemas
- ItemList (partners)
- Speakable schema

### Missing — Page-Level Schemas

| Page | Required Schema | Priority |
|---|---|---|
| `/news/:id` (article) | Article + BreadcrumbList + Person (author) | P1 |
| `/systems/:id` (template) | SoftwareApplication + Offer + BreadcrumbList | P1 |
| `/prices` | Offer + PriceSpecification (per plan) | P1 |
| `/jobs` (list) | ItemList of JobPosting | P1 |
| `/jobs/:id` (detail) | JobPosting (full schema) | P1 |
| `/partners` | ItemList of Organization | P2 |
| `/about` | AboutPage + Person (team members) | P2 |
| `/contact` | ContactPage + PostalAddress | P2 |
| All pages | BreadcrumbList | P2 |

---

## 5. Dynamic Open Graph Images

### Current
Static `og-cover.png` used for all pages.

### V4 Target
Generate page-specific OG images at request time or build time:

```
/api/og-image?title=اسم المقالة&type=news
    → Returns 1200x630 PNG with branded template + Arabic title

Built with: @vercel/og, Satori, or canvas

Cache: Generated image cached at CDN / on disk for 24 hours
```

---

## 6. Canonical URL Strategy

```
All public pages:
    <link rel="canonical" href="https://qiroxstudio.online{path}">

Rules:
    - No trailing slash: /news not /news/
    - Lowercase only: /systems not /Systems
    - No query parameters in canonical (use ?ref= for tracking, not in canonical)

Implemented via useSEO hook (canonicalPath prop):
    useSEO({ canonicalPath: '/news/my-article-slug' })
```

---

## 7. Sitemap Architecture

### Static Sitemap (Current)
`client/public/sitemap.xml` — 14 static URLs

### V4 Dynamic Sitemap

```
GET /sitemap.xml
    → Express route handler
    → Query: NewsModel.find({ isPublished: true }).select('slug publishedAt')
    → Query: SectorTemplateModel.find({ isActive: true }).select('slug updatedAt')
    → Query: JobModel.find({ isActive: true }).select('slug createdAt')
    → Build XML:

<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

  <!-- Static pages -->
  <url>
    <loc>https://qiroxstudio.online/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="https://qiroxstudio.online/"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://qiroxstudio.online/?lang=en"/>
  </url>

  <!-- Dynamic news articles -->
  <url>
    <loc>https://qiroxstudio.online/news/{slug}</loc>
    <lastmod>{publishedAt.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Dynamic system templates -->
  <url>
    <loc>https://qiroxstudio.online/systems/{slug}</loc>
    <lastmod>{updatedAt.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

</urlset>

Cache: 1 hour in-memory. Regenerate on news/system publish.
Ping Google on publish: GET https://www.google.com/ping?sitemap=https://qiroxstudio.online/sitemap.xml
```

### Sitemap Index (For Scale)
```
/sitemap.xml         → sitemap index
/sitemap-pages.xml   → static pages
/sitemap-news.xml    → news articles
/sitemap-systems.xml → system templates
/sitemap-jobs.xml    → job listings
```

---

## 8. robots.txt Design

```
User-agent: *

# Allow public pages
Allow: /
Allow: /about
Allow: /prices
Allow: /systems
Allow: /news
Allow: /partners
Allow: /jobs
Allow: /contact
Allow: /terms
Allow: /privacy
Allow: /alliances

# Block authenticated portals
Disallow: /admin
Disallow: /employee
Disallow: /client
Disallow: /investor
Disallow: /supplier
Disallow: /merchant
Disallow: /login
Disallow: /register
Disallow: /forgot-password
Disallow: /reset-password

# Block API endpoints
Disallow: /api/

# Block file paths
Disallow: /uploads/

# Block utility pages
Disallow: /print
Disallow: /embed

# AI crawlers
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

# Sitemap location
Sitemap: https://qiroxstudio.online/sitemap.xml
```

---

## 9. Arabic SEO Strategy

### Language Implementation
```html
<!-- Already implemented in index.html -->
<html lang="ar" dir="rtl">
<meta name="language" content="Arabic">
<meta name="content-language" content="ar-SA">

<!-- hreflang for bilingual -->
<link rel="alternate" hreflang="ar-SA" href="https://qiroxstudio.online/">
<link rel="alternate" hreflang="en-US" href="https://qiroxstudio.online/?lang=en">
<link rel="alternate" hreflang="x-default" href="https://qiroxstudio.online/">
```

### Arabic Keyword Architecture
- Primary: فيروكس, كيروكس استوديو, شركة برمجة الرياض, تطوير مواقع السعودية
- Secondary: نظام إدارة, تطبيقات جوال, SaaS عربي, حلول تقنية
- Long-tail: نظام إدارة مطعم الرياض, برمجة موقع متجر إلكتروني السعودية
- Brand: Qirox, QIROX, قيروكس (multiple spellings — cover all)

### Arabic Content Structure
```
Each Arabic page should have:
1. Arabic title in <title> tag (primary)
2. Arabic meta description (under 160 characters)
3. Arabic H1 tag (one per page)
4. Arabic body text (not just titles)
5. Arabic alt text on all images
6. Arabic JSON-LD (name, description, offers in Arabic)
```

---

## 10. Local SEO (KSA Market)

```
Business Profile:
    Google Business Profile: قيروكس استوديو | Qirox Studio
    Address: الرياض، المملكة العربية السعودية
    Phone: +966 xxx xxxx
    Category: Software Company / شركة برمجة

Geographic Meta Tags (Already in index.html):
    <meta name="geo.region" content="SA-01">
    <meta name="geo.placename" content="Riyadh, Saudi Arabia">
    <meta name="geo.position" content="24.7136;46.6753">

LocalBusiness Schema (Already in index.html):
    "@type": "LocalBusiness"
    "address": { Riyadh }
    "areaServed": ["SA", "AE", "KW", "BH", "QA", "OM"]

Local citations needed:
    - Yelo (Saudi business directory)
    - Foursquare
    - Yelp Arabia
    - LinkedIn Company page
```

---

## 11. Core Web Vitals Targets

| Metric | Target | Current (Estimated) | Risk |
|---|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | Unknown (SPA, likely 3-5s) | High |
| CLS (Cumulative Layout Shift) | < 0.1 | Unknown | Medium |
| FID/INP (Interaction to Next Paint) | < 200ms | Unknown | Low |

### Optimization Plan
```
LCP Improvements:
    - Preload hero image: <link rel="preload" as="image" href="/og-cover.png">
    - Preconnect to MongoDB Atlas: not applicable (server-side)
    - Preconnect to external fonts: <link rel="preconnect" href="https://fonts.googleapis.com">
    - Reduce JS bundle: Vite code splitting + dynamic imports

CLS Improvements:
    - Add explicit width/height to all images
    - Reserve space for dynamic content (skeleton loaders)
    - Avoid layout shifts from late-loading fonts (font-display: swap)

INP Improvements:
    - Defer non-critical JS: import('./heavy-component') on interaction
    - Remove ParticleCanvas on mobile
    - Reduce Framer Motion complexity on mobile
```

---

## 12. Image Optimization Plan

```
Current: Images served as-is from uploads/ or client/public/
No WebP conversion, no lazy loading audit, no srcset

V4 Target:

1. Format: Serve WebP with JPEG fallback
   <picture>
     <source srcset="image.webp" type="image/webp">
     <img src="image.jpg" alt="..." loading="lazy" width="800" height="600">
   </picture>

2. Responsive images: srcset for different screen sizes
   srcset="image-400.webp 400w, image-800.webp 800w, image-1200.webp 1200w"
   sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"

3. Priority: Hero images get loading="eager" + fetchpriority="high"
   All below-fold images: loading="lazy"

4. Alt text: All images must have meaningful Arabic alt text
   Decorative images: alt=""

5. Implementation: Use sharp on upload to generate WebP + multiple sizes
   Store variants in object storage
```

---

## 13. Performance Budget

| Resource | Current (Estimated) | Target |
|---|---|---|
| Total JS bundle | Unknown | < 500KB gzipped |
| Largest chunk | Unknown | < 150KB |
| Total CSS | Unknown | < 50KB gzipped |
| Total images (above fold) | Unknown | < 200KB |
| Time to First Byte | Unknown | < 300ms |
| First Contentful Paint | Unknown | < 1.5s |

---

## 14. International SEO (Arabic Market Expansion)

```
Phase 1 (Current): Saudi Arabia primary
Phase 2 (V4):      GCC coverage
Phase 3 (Future):  Arab world

hreflang matrix for GCC:
    ar-SA  → Saudi Arabia (primary)
    ar-AE  → UAE (Arabic)
    ar-KW  → Kuwait
    ar-BH  → Bahrain
    ar-QA  → Qatar
    ar-OM  → Oman
    en-US  → English fallback
    x-default → Arabic default

URL structure options:
    Option A: Subdomain: en.qiroxstudio.online (separate crawl budget)
    Option B: Subdirectory: qiroxstudio.online/en/ (shared crawl budget — recommended)
    Option C: Query param: ?lang=en (not recommended for SEO)

Recommendation: Option B (subdirectory) when English content is added.
```
