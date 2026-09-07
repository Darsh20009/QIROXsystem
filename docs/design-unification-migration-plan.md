# QIROX — Design Unification Migration Plan
**Status: PROPOSAL — NOT STARTED.** Nothing in this document is implemented. Companion to `docs/ui-ux-audit-2026-07-14.md`. Requires your explicit approval before any code changes begin.

---

## 1. Decision this plan assumes (confirm or correct)

The plan below assumes you want to **standardize on Design System V2 (navy/blue/off-white/black/gray, dark-green accent, purple retired)** — the token foundation already built in `client/src/styles/design-system-v2.css` / `tailwind.config.ts` `ds.*` namespace, and already proven on the Landing DS V2 pilot. If you want a different palette direction, tell me before step 1 starts.

## 2. Ground rules for every step (per your brief + the project's existing zero-downtime policy)

- Every page migration ships behind its own feature flag, additive only — never a breaking rewrite of a live page in place.
- No fabricated content, ever. If a page needs a real asset (photo, bio, logo, number, case study), implementation **stops** and I ask you for it by name — see the consolidated asset request in §5.
- One design language only, going forward: all new/migrated pages use `ds-*` tokens and the documented component recipes (buttons, cards, inputs, shadows, radius, motion timing) from `docs/design-system-v2.md` — no new one-off classes, no new libraries.
- Icons: Lucide only, stroke-width 1.75, monotone by default. Emoji-as-icon (found in live service data) gets normalized to Lucide at the display layer, no data change needed.
- Motion: standardize on Framer Motion + the `ds-duration-*`/`ds-ease-*` tokens; retire ad hoc CSS keyframes and mixed `tailwindcss-animate` usage on migrated pages.
- Each migrated page gets full SEO: `useSEO` + appropriate JSON-LD (Organization/Person/Service/SoftwareApplication/LocalBusiness/FAQ/Breadcrumb as relevant), and is added to a **dynamic** sitemap (see §6).

## 3. Rollout order (page by page, never all at once)

Sequenced by leverage (highest brand impact first) and by dependency (pages that need real assets from you are sequenced so asset-gathering can happen in parallel with lower-risk work).

| Step | Page/Area | Depends on | Why this order |
|---|---|---|---|
| 1 | **Global design system finalization** — no visible change yet | none | Lock the `ds-*` component recipes (buttons/cards/inputs/tables/empty-states/modals) as real reusable React components, not just CSS classes, so every subsequent step reuses the same components instead of re-implementing them. |
| 2 | **Home / Landing** (retire the old purple `Home.tsx`, promote DS V2 pilot to default) | Step 1 | Already built; just needs your sign-off to become the default instead of the flagged pilot. |
| 3 | **Systems / Services page** | Step 1 | High traffic, already strong content — lower risk restyle. |
| 4 | **Partners** (interactive case-study cards per your brief) | Step 1, real per-partner project/tech/results detail from you | Visual rebuild can start with placeholder *structure* using only the currently-real fields (logo, sector, URL); the "Technologies used / Case Study / Results" fields stay empty with a clear internal TODO marker until you supply them — never fabricated. |
| 5 | **Contact / Prices / News** | Step 1 | Lower complexity, good momentum pages. |
| 6 | **About page — full rebuild** | Step 1, **all CEO/CTO/company-story assets from you (§5)** | This is the centerpiece of your brief but is fully blocked on real content. I will build the page structure/sections in parallel (Mission/Vision/Values/Timeline/Culture skeleton) but every content slot stays visibly empty/flagged internally until real material arrives — no placeholder text or AI-generated "filler" bios. |
| 7 | **Team presentation** | The one real group photo (already have it) | Build the "elegant single-group-photo" treatment now; architect it so individual portraits slot in later without a redesign, per your instruction. |
| 8 | **Careers / Jobs** | Real current stats (§5) or your go-ahead to remove the stats block | Otherwise ready — strong existing flow, just needs the fabricated-looking stats resolved and a visual pass to match the new system. |
| 9 | **Projects / Portfolio case-study pages** | Real case study material per project (§5) | New page type — needs a data model for case studies plus your real content per project before it can go beyond a structural shell. |
| 10 | **Customer dashboard** | Step 1 | Bring onto the same design language as the marketing site to close the "three visual dialects" gap. |
| 11 | **Employee dashboard / CRM** | Step 1 | Already the most mature area — mainly a token/color swap plus component consolidation (shared `EmptyState`, shared spinner), lower risk. |
| 12 | **QAdmin** (100+ pages) | Step 1, and ideally an incremental "fat page" cleanup for `AdminOrders.tsx`/`AdminFinance.tsx` | Largest surface area, done last and in visual-only batches (grouped by domain: Finance, HR, CRM, Orders, etc.) — never a single big-bang pass. Architectural cleanup of the biggest files is called out as an optional follow-up, not required for the visual unification itself. |
| 13 | **Sitewide SEO completion** | Runs alongside every step above | Add `useSEO` + relevant JSON-LD to every newly migrated public page as it ships, add `Person` schema for CEO/CTO once bios exist (step 6), migrate the static sitemap to a dynamic one generated from actual routes/News/Jobs data. |

Events and Knowledge Base are **not included** in this plan — they don't exist today. If you want them, they should be scoped as a separate, later initiative once the core unification is done.

## 4. What "Create ONE global design language" means concretely (Step 1 deliverables)

Before any visible page changes:
- Promote the reference-only `.ds-btn-*`, `.ds-card-*`, `.ds-input*` CSS recipes into real, typed React components (`<Button variant="ds-primary">`, `<Card variant="ds-elevated">`, etc.) so pages consume components, not raw classnames — this is what actually prevents future drift, not just a style guide document.
- Define and componentize: one `EmptyState`, one loading/skeleton pattern, one table pattern, one modal pattern, one toast/notification pattern — replacing the several variants found in the audit.
- Formalize the motion vocabulary (entrance, hover, success feedback) as a small set of shared Framer Motion variants, replacing the mixed `tailwindcss-animate`/keyframes/Framer approach.
- Write down the one rule for icons (Lucide, 1.75 stroke, monotone) as a lint-checkable convention, not just documentation.

This step has no user-visible output but is what makes every later step actually consistent instead of "restyled by hand, page by page, hoping they match."

## 5. Consolidated asset request — everything I need from you before the blocked steps can proceed

Nothing below will be invented, generated with AI, or filled with stock/placeholder content. Please provide what you can; anything you skip stays out of scope until you have it.

**For the About page (Step 6):**
- CEO — full name (Arabic + English), exact title, headshot photo, short personal story/bio, a "message from the CEO" quote or paragraph.
- CTO — same five items.
- Company mission statement, vision statement, and 3–5 core values (if different from the "values" already in `Jobs.tsx` — confirm or replace).
- A real founding/milestone timeline (dates + what happened).
- 2–4 sentences on "how we work" / engineering philosophy / culture, in your own words or from existing internal material.
- Office photos, if you want an office gallery.
- Any awards, certificates, or press mentions you want featured (with proof/links).

**For Team (Step 7):**
- Confirm the one group photo you mentioned is the correct one to use (or send it if it's not already in the repo).
- When available later: individual portraits + name/title per person, to upgrade the layout as promised in your brief.

**For Partners (Step 4):**
- Per partner you want featured as a full case-study card: technologies used, a one-line project description, and (if permitted by the client) a results/outcome line and a live-demo or case-study link.
- Resolve the `Maestro` entry — real URL or remove.

**For Careers stats (Step 8):**
- Confirm or correct: "50+ Projects Done", "12 Team Members", "98% Client Satisfaction", "4 Years Experience" — or say "remove the stats block."

**For Projects/Portfolio (Step 9):**
- Per project you want to feature as a case study: business problem, solution summary, real performance/results data (if any), a gallery of real screenshots, and whether a live demo can be linked.

**For SEO Person schema:**
- Confirmation that the CEO/CTO names, titles, and any social/LinkedIn profile URLs above are accurate and approved for public structured data (this is what makes Google understand "محمد الدباني — CEO of QIROX Studio").

## 6. What ships without waiting on you

Steps 1, 2, 3, 5, 10, 11, 12, and the SEO infrastructure work in §3/§13 can proceed using only real data that already exists in the app (live services/templates/settings APIs, existing real screenshots, existing real payment integrations) — no new assets required. These can start immediately upon your approval of this plan.

## 7. Approval checklist

Please confirm:
1. Design System V2 (navy/blue) is the one true direction — yes/no or amend.
2. The rollout order in §3 is acceptable, or you want a different sequence.
3. Green light to start on Step 1 (global component library) and Steps 2/3/5/10/11/12 (the asset-independent pages), while Steps 4/6/7/8/9 wait on the asset list in §5.

**No implementation starts until you respond to this checklist.**
