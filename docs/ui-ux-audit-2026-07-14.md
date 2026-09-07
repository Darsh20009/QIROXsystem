# QIROX — Full UI/UX Audit
**Date:** 2026-07-14
**Scope:** Entire application (public site, customer/employee dashboards, CRM, QAdmin, SEO). Read-only audit — no code was changed to produce this report.

---

## 1. Executive summary

QIROX is **not** a generic AI-template SaaS clone. The public marketing pages and the employee/admin dashboards are both genuinely custom-built, well above average for a project this size — real Arabic-first content, real motion design, a real (if informal) visual identity, and a surprisingly disciplined admin app shell across 100+ pages.

The core problem is **fragmentation, not low quality**: the app has accumulated **three parallel design systems** built at different times, and no single page or section was ever forced to reconcile with the others. The result is a site that is polished in patches but does not read as *one* company end‑to‑end — exactly the "different button styles / different cards / different everything" problem you're describing.

There is also a small number of **fabricated statistics** that must be replaced with real numbers or removed — flagged explicitly below, not silently fixed.

| Area | Score (0–100) | One-line verdict |
|---|---|---|
| Design consistency (global) | **48** | Three token systems coexist; no page is required to use any specific one. |
| Public marketing pages | **83** | Genuinely strong, but each page was designed in isolation — no shared "About/Partners/Careers" template language. |
| Customer dashboard | **80** | Solid and modern, but visually disconnected from the marketing site (different shell, different card language). |
| Employee dashboard / CRM | **88** | The most mature, cohesive part of the app. |
| QAdmin (100+ pages) | **85** for consistency, but **"Fat Page"** architecture (files up to 2,300+ lines) is a real maintainability risk. |
| SEO | **35** sitewide (12/~150+ pages covered) | Excellent where it exists; absent almost everywhere else. |
| Team / Partners / Careers content | **Needs your input** | See §6 — real assets required before these can be rebuilt. |
| Events / Knowledge Base | **N/A — does not exist** | Not built yet; out of scope until you confirm you want it. |

---

## 2. The three parallel design systems

1. **shadcn/ui defaults** (`tailwind.config.ts`, `client/src/index.css` lines ~11–115) — HSL-based tokens (`--primary`, `--background`, etc.). This is the substrate ~90% of the app (especially QAdmin) is built on.
2. **The "brand" purple namespace** (`tailwind.config.ts` ~L78-83, `--brand`/`--brand-dark`) — used in the older landing page (`Home.tsx`, `HeroCinematic.tsx`, `PricingExperience.tsx`). This is the palette your brief explicitly wants retired.
3. **Design System V2 ("ds-*")** — the navy/blue/off-white token set I built in the previous phase (`client/src/styles/design-system-v2.css`), currently used *only* on the new pilot landing page behind `FEATURE_LANDING_DS_V2`. Not yet touched anywhere else.

On top of this, `index.css` (~L498-900) contains a large block of `!important` dark-mode overrides that force-restyle raw Tailwind gray/zinc/slate classes — a sign that dark mode was patched in after the fact rather than designed in from the start.

**Concrete inconsistencies found in page-level code** (not the shared `components/ui/` library, which is itself fine):
- Border radius: the documented system radius is `0.75rem`, but `rounded-[2rem]` (`EmployeeProfile.tsx:120`) and `rounded-[32px]` (`Jobs.tsx:45`) and `2.5rem` card radii on marketing pages all coexist as one-off magic numbers.
- Shadows: mostly `shadow-sm/md`, but hand-tuned one-offs like `shadow-[0_8px_30px_rgb(0,0,0,0.12)]` (`Home.tsx:240`) and `shadow-[0_20px_50px_rgba(8,112,184,0.7)]` (`Contact.tsx:88`) appear nowhere else.
- Buttons: shadcn `Button` variants, a separate `.premium-btn` class (`index.css:338`), `bg-brand` raw classes (`Home.tsx`), and `rounded-full` pill buttons on landing-v2 (`HeroCinematic.tsx:34`) vs `rounded-md` defaults in QAdmin — four different button languages in one app.
- Icons: Lucide is dominant, but `react-icons` still appears in older pages (e.g. `FaWhatsapp` in `ClientHelp.tsx`), plus scattered emoji use as icons on the live `/api/services` data (🧠, 🤖, 💻, etc. — see §6).
- Animation: three different systems in active use — `tailwindcss-animate` utilities, Framer Motion (marketing pages, some employee pages), and hand-written CSS keyframes (`equalizer`, `shine` in `index.css`) — with no shared timing/easing vocabulary between them.
- Component reuse: 158 pages import shared shadcn primitives, but 165 pages *also* hand-roll raw-Tailwind buttons/cards/layout — most pages do both inconsistently rather than picking one approach.

**Bottom line:** the shadcn primitives in `components/ui/` are fine and consistent. The problem is that page authors freely bypass them, and there are three competing "brand" palettes live in the codebase simultaneously with no rule forcing convergence.

---

## 3. Public marketing pages

| Page | Score | Notes |
|---|---|---|
| Home (legacy, purple `brand` system) | 92 | Most polished page technically (custom SVG sector illustrations, scroll-triggered graphics) but carries the retired purple palette. |
| **Landing DS V2 pilot** (new, this session) | — | Uses the new navy/blue system exclusively; only page in the app on the new palette. |
| Systems (services/sector explorer) | 88 | Real, specific per-sector content — not templated. |
| Jobs / Join Us (careers) | 85 | Strong application flow, but contains the flagged fake-looking stats (§6). |
| Contact | 82 | Clean, functional, has a one-off custom shadow. |
| Prices | 80 | Clear, SAR-first pricing. |
| Partners | 75 | Real logos and real URLs for most partners, but visually a plain grid — not the "interactive premium card" experience your brief asks for, and one partner (`Maestro`) has `url: null` (needs a real link or removal). |
| News | 70 | Backend-data-dependent; sparse content today. |
| About | Not separately scored above — **this is the page your brief cares about most, and it currently has no CEO/CTO story, no mission/vision/values section, no timeline, no culture section, no team section, no office gallery, no awards/certificates, no press/media kit.** It's a features/sectors page wearing an "About" label. |

**Team & Portfolio as dedicated pages: they don't exist.** "Team" content lives nowhere as a standalone concept — there is no team roster, no individual bios, anywhere in the app. "Portfolio" is implicitly the `Systems`/sector-template explorer plus two real product screenshots — there is no page structured as a project-by-project case-study gallery (desktop/mobile previews, business problem, solution, results) as your brief describes.

SEO on marketing pages is genuinely strong where it exists (`useSEO` hook + JSON-LD: Organization, JobPosting schemas), but only reaches ~12 of ~150+ total pages in the app — see §5.

---

## 4. Customer & employee dashboards, CRM

- **Employee dashboard / CRM (score 88):** the strongest, most cohesive part of the whole app. One shell (`EmployeeLayout.tsx`), role-based navigation, a "Daily Hub" AI widget, consistent i18n. Minor issues only: a couple of pages implement their own `EmptyState` instead of a shared one, and loading-spinner styles vary slightly page to page.
- **Customer dashboard (score 80):** solid and modern in isolation, but uses a different shell (`Layout.tsx`/`ClientDashboardSimple.tsx`) with a different card/spacing language than either the employee dashboard or the marketing site. A customer moving from the marketing site → checkout → their dashboard currently crosses three different visual languages.
- **CRM specifically:** mixes a Kanban board view and a hand-rolled `div`-based list view rather than one consistent list/table pattern (`EmployeeCRM.tsx:337`).

---

## 5. QAdmin (100+ pages)

- All admin pages funnel through one shell (`AppInner`/`AdminRouter` in `App.tsx`) — there is no separate `AdminLayout` component, but the shared shell does the job consistently. This is good: visual consistency here is real, not accidental.
- Score: **85/100** for consistency. The shadcn `Card`/`Button` + Lucide icon combination is used correctly almost everywhere, with a disciplined monochrome palette and semantic status colors (amber/emerald).
- **The real risk here is not visual — it's architectural.** Several admin pages are "fat pages" mixing business logic, complex types, and huge JSX trees in a single file: `AdminOrders.tsx` (2,304 lines), `AdminFinance.tsx` (1,727 lines). This isn't a "premium feel" problem, but it will make any future redesign of these pages slow and risky. Worth flagging even though it's outside strict UI/UX scope.
- Three visible "eras" of code quality coexist (older simple pages → complex tab-heavy pages → newer Framer-Motion-driven pages like `AdminKanban.tsx`), which is normal for an app this size but means a visual unification pass will touch code of very different ages and risk levels.

---

## 6. Content integrity — items that must not be silently touched

Per your rule ("never use fake statistics," "do not fabricate," "ask me"), here is everything found that looks fabricated, placeholder, or unverified. **I have not changed any of this — I need your confirmation or real data for each:**

1. **`Jobs.tsx` stats block** — "50+ Projects Done", "12 Team Members", "98% Client Satisfaction", "4 Years Experience". These read as plausible-but-unverified placeholders. **Please confirm these are real current figures (and give me the real current numbers), or tell me to remove the stats block entirely.**
2. **Partners data** (`Partners.tsx`) — most partners (e.g. جمعية طويق / Tuwaiq, Subway) have real logos and real URLs and look legitimate. One entry, **"Maestro," has `url: null`** — please provide its real website/case study link, or confirm it should be removed.
3. **No CEO/CTO bios or named messages exist anywhere in the codebase.** Your brief mentions محمد الدباني (CEO) and يوسف درويش (CTO) by name for SEO/Person schema purposes — I have zero source material for these (no bio text, no titles-confirmed-in-code, no photos). **I need you to provide, per person:** full name (Arabic + English), exact title, a short bio/story, a "message from the CEO/CTO" quote or paragraph, and a headshot photo.
4. **Team section** — confirmed: only one group photo exists in the current asset set per your note; I found no individual portrait files anywhere in `client/src/assets`. I will not invent individual photos or bios.
5. **Case studies / project results** — no page currently presents "business problem → solution → results" per project; the two real product screenshots (e-commerce, restaurant demo) have no accompanying real client outcomes/metrics in the codebase. Any performance numbers, client names, or results used in a future "Projects" section must come from you.
6. **Emoji-as-icon in live service data** — the real `/api/services` records store icons as raw emoji (🧠, 🤖, 💻, 📊, 🎯) rendered directly in at least one part of the app (outside the new DS V2 pilot, which already ignores this field and uses Lucide icons instead — see memory note). This should be normalized to Lucide icons everywhere for the "never AI-generated feel" goal, no new data needed.

---

## 7. SEO — sitewide state

- The `useSEO` hook (`client/src/hooks/use-seo.ts`) is well-built: dynamic titles, meta description, canonical URL, OG/Twitter tags, and JSON-LD injection support already exist.
- **Only ~12 of 150+ pages call it**: About, Alliances, Community, Contact, Home, Jobs, JoinUs, News, Partners, Posters, Prices, Systems (+ the new Landing DS V2 pilot).
- Schema types present: `Organization`, `JobPosting`. **Missing entirely:** `Person` (needed for the CEO/CTO Google Knowledge Graph goal in your brief), `SoftwareApplication`, `LocalBusiness`.
- `client/public/sitemap.xml` is a **static, hand-authored file** with 15 hardcoded URLs — it does not auto-update when new News articles, job postings, or pages are added.
- All transactional/account pages (Cart, Checkout, Dashboard, Login, DevPortal, OrderFlow) and the entire Admin/Employee app (~50+ pages, correctly, since they're not indexable) have no SEO — expected for the private pages, but the public-facing gaps (Team, Portfolio/Projects if built, individual News articles, individual Job postings) need it.

---

## 8. Events & Knowledge Base

Neither exists anywhere in the codebase today — no pages, no routes, no data model. Your brief lists them as areas to audit; there is nothing to audit because nothing has been built. Flagging so it's an explicit decision (build later / drop from scope) rather than an oversight.

---

## 9. What "world-class premium" is missing today, concretely

Distilled from the above, the honest gap between where QIROX is and Apple/Stripe/Linear/Framer/Notion-level execution:

1. **One brand, three palettes.** Nothing forces convergence — pick the winner (the brief implies Design System V2 navy/blue) and retire the rest deliberately, page by page.
2. **About page is a placeholder for the company's actual story.** No founders, no mission/vision/values, no timeline, no culture — this is the single highest-leverage page to rebuild per your brief, and needs the most real assets from you before it can be built.
3. **Partners is a logo grid, not a story.** Needs the interactive case-study-card treatment your brief describes, backed by real per-partner project/technology/results detail.
4. **No real "Projects" / case-study gallery exists.** Portfolio today is a template catalog, not client work with real outcomes.
5. **Marketing site, customer dashboard, and employee dashboard each speak a different visual dialect.** A user's journey from Google search → landing → order → dashboard currently crosses three different design languages, which undercuts the "premium, cohesive company" feeling your brief is after.
6. **SEO enterprise-readiness is real but narrow** — strong foundation, thin coverage, missing Person/SoftwareApplication/LocalBusiness schema entirely.

---

## Next document

See **`docs/design-unification-migration-plan.md`** for the proposed unification plan, page-by-page rollout order, and the consolidated list of real assets I need from you before implementation starts. **No implementation begins until you approve that plan.**
