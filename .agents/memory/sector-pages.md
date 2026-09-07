---
name: Sector Pages
description: Individual sector detail pages at /sector/:slug — 6 sectors only, horizontal scroll cards on home, full page with features/pricing/partners.
---

# Sector Pages

## What was built
- 6 sector pages at `/sector/:slug`: ecommerce, restaurant, corporate, healthcare, realestate, beauty
- Home Systems section redesigned: horizontal scroll portrait cards (not grid), dark hero bg (`#f0f0ee`/`#0d0d0d`), links to `/sector/:slug`
- "لم تجد قطاعك؟" card at end of scroll → `/start`

## Files
- `client/src/pages/SectorPage.tsx` — full sector detail page (hero, features, whyQirox, guarantee, pricing, partners+iframes)
- `client/src/App.tsx` — route `/sector/:slug` added
- `client/public/sitemap.xml` — 6 sector URLs added with priority 0.95

## Partners iframe
Smart iframe: auto-scrolls after 2s via translateY, hover scrolls deeper. Uses `pointer-events-none` so iframe doesn't intercept click, overlay shows link with `ExternalLink`.

**Why:** Cross-origin iframes can't be JS-controlled, so we animate the iframe container's translateY to simulate scrolling.

## Sector data location
All sector content (features, whyQirox, guarantee, SEO) is in `SECTOR_DATA` constant inside `SectorPage.tsx`.

## Pricing
Fetched from `/api/segment-pricing?segmentKey=<slug>`. If empty, shows CTA to `/prices?segment=<slug>`.

## Partners per sector
Filtered from `/api/partners` by `relatedService === slug`.
