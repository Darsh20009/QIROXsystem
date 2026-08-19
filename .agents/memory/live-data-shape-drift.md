---
name: Live data shape drift
description: /api/services (and similar Mongo-backed public routes) return a payload shape that does not match the TS type declared for them in shared/schema.ts.
---

`shared/routes.ts` types `/api/services` as `z.custom<Service>()` where `Service` is inferred from the Drizzle `services` pgTable (title/description/priceMin/priceMax/estimatedDuration/features: string[]). The route is actually Mongo-backed at runtime and returns a different bilingual shape: `{ title, titleAr, description, descriptionAr, price: string (preformatted, e.g. "يبدأ من 1,875 ر.س / جلسة"), icon: emoji, featured, order }`.

`SectorTemplate` (from `/api/templates`) is accurate in schema.ts: `name`/`nameAr`, `description`/`descriptionAr`, `features: string[]`, `featuresAr: string[]` — there is no `nameEn`/`descriptionEn`.

**Why:** Trusting the schema.ts type for this route produced a build that referenced nonexistent fields (`titleEn`, `startingPrice`, `estimatedDuration`) and rendered blank service cards. The mismatch is invisible to `tsc` because the route response is typed with `z.custom<T>()`, which does no runtime validation.

**How to apply:** Before building any UI against a "read-only" API endpoint (services, templates, pricing, etc.), `curl` the live endpoint and inspect the actual JSON — don't assume the shared/schema.ts type reflects the runtime shape, especially for Mongo-backed collections layered under a Drizzle-typed route.
