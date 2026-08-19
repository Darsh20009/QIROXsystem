# QIROX Design System V2 — Token Foundation

**Status: PERMANENT DESIGN LANGUAGE — rollout in progress.** Approved as the permanent design language for the entire platform (Brand Experience redesign, not a visual reskin). Rollout follows a phased order; see `Migration phases` below for current progress.

## Migration phases

- **Phase 1 — Global Component Library / Navigation / Footer / Motion:** ✅ `Navigation` and `Footer` now render their ds-* restyled versions (`NavigationDSV2.tsx`, `FooterDSV2.tsx`) everywhere, gated by `FEATURE_DS_V2_NAV_FOOTER` (on by default). Legacy versions preserved untouched as `NavigationLegacy.tsx`/`FooterLegacy.tsx` for instant rollback. All existing functionality (cart, auth, country/currency, mobile menu, country switcher, app downloads, WhatsApp banner, socials) preserved exactly — visual tokens only.
- **Phase 2 — Landing / Services / Systems / Contact:** Landing page pilot (`FEATURE_LANDING_DS_V2`) is live. Services/Systems/Contact not yet migrated.
- **Phase 3 — Portfolio / Projects / Partners:** not started. Partners/Projects require real assets/screenshots per the asset policy — will need an explicit asset request before implementation.
- **Phase 4 — About / Team / Company Story:** blocked on real assets (CEO/CTO portraits, team photos, company story content). Do not build with placeholders.
- **Phase 5 — Customer Dashboard / Customer Journey:** not started.
- **Phase 6 — Employee Experience / CRM / HR / Finance / Projects:** not started.
- **Phase 7 — QAdmin:** not started.

Files:
- `client/src/styles/design-system-v2.css` — all CSS variables + reference `.ds-*` component recipes (unused elsewhere today).
- `tailwind.config.ts` — additive `ds.*` theme namespace (colors, font sizes, radius, shadows, z-index, container widths, transition durations/easings) alongside the existing `brand`/shadcn tokens, which remain untouched.

Everything is namespaced `ds-`/`--ds-` so it can never collide with or override the current design tokens while both coexist during migration.

## Why this exists

QIROX's official design language is being redefined: premium global-technology-company aesthetic — never a generic SaaS template, AI-generated site, Tailwind/Bootstrap/Framer demo look. Purple is retired as a primary brand color.

## 1. Color palette

| Role | Tokens |
|---|---|
| Primary | White (`ds-white`), Off-White (`ds-off-white`), Navy (`ds-navy-50…950`), Blue (`ds-blue-50…950`) |
| Secondary | Black (`ds-black`), full Gray scale (`ds-gray-50…950`) |
| Accent | Dark Green (`ds-green-500/600`) — use sparingly: success states, a single highlighted CTA per screen, small accent marks. Never a whole section background. |
| Restricted | Purple (`ds-purple-restricted`) — do not use by default. Only if the user explicitly approves a rare, specific placement. |

Semantic tokens built on top of the palette (light/dark aware): `ds-background`, `ds-foreground`, `ds-surface-0/1/2`, `ds-surface-inverse` (dark navy block for contrast sections on light pages), `ds-primary`, `ds-secondary`, `ds-muted`, `ds-accent`, `ds-border-hairline`, `ds-border-emphasis`, `ds-focus-ring`.

Shadows are navy-tinted, never flat black (`--ds-shadow-color`), for a premium, non-generic feel.

## 2. Typography

Reuses existing font stacks (`--font-heading` = Cairo, `--font-body` = IBM Plex Sans Arabic) — no new fonts introduced. New scale: `ds-text-xs` → `ds-text-6xl`, tracking tokens (`ds-tracking-tight/normal/wide`), and leading tokens (`ds-leading-tight/normal/relaxed`). Headings should default to `ds-tracking-tight` for a premium, editorial feel; body copy stays at `ds-tracking-normal`/`ds-leading-relaxed`.

## 3. Spacing & Grid

- Section rhythm tokens: `ds-space-section-sm/md/lg/xl` (3–10rem) — use consistently between major sections so every page has the same vertical breathing room.
- Container widths: `ds-container-sm/md/lg/xl` (40/56/72/88rem), gutter `ds-grid-gutter` (1.5rem).
- Existing Tailwind spacing scale (4px grid) stays as-is for micro-spacing.

## 4. Radius scale

`ds-radius-xs` (4px) → `ds-radius-2xl` (32px) → `ds-radius-full` (pill). Guideline: inputs/small controls use `xs`/`sm`; buttons/cards use `md`/`lg`; feature panels and hero cards use `xl`/`2xl`.

## 5. Shadow & elevation system

Five levels (`ds-shadow-xs` → `ds-shadow-xl`) plus a dedicated `ds-shadow-glass` for glassmorphism surfaces. Elevation (z-index) scale: `ds-z-base/dropdown/sticky/overlay/modal/toast/max` — use these instead of ad-hoc z-index numbers going forward.

## 6. Motion & animation tokens

- Durations: `ds-duration-fast` (150ms, hover/focus), `ds-duration-base` (280ms, standard transitions), `ds-duration-slow` (480ms, entrances), `ds-duration-slower` (800ms, hero/cinematic reveals).
- Easings: `ds-ease-standard`, `ds-ease-emphasized` (premium overshoot-free "settle"), `ds-ease-decel`, `ds-ease-accel`.
- Ready-made keyframe utilities: `.ds-anim-fade-in`, `.ds-anim-rise-in`, `.ds-anim-scale-in`, plus a `ds-glass-shimmer` keyframe for subtle glass highlight sweeps.
- Rule: animation must always communicate state or guide attention (entrance, hover feedback, success) — never decoration for its own sake.

## 7. Glass rules

`.ds-surface-glass` / `.ds-card-glass`: translucent surface (60% white / 55% dark-navy), hairline border, `20px` backdrop blur, soft navy-tinted shadow with a subtle inner top highlight. Use for floating panels, nav bars, and premium overlay cards — not for every card (glass should feel special, not default).

## 8. Border rules

Two levels only: `ds-border-hairline` (low-contrast, default dividers/cards) and `ds-border-emphasis` (higher-contrast, for outlined buttons/inputs and focus-adjacent emphasis). Avoid introducing more border weights than these two.

## 9. Icon rules

- Library stays Lucide React (no new icon set).
- Stroke width fixed at `1.75` (`--ds-icon-stroke-width`) everywhere for visual consistency — never mix stroke weights on the same screen.
- Size scale: `ds-icon-size-sm` (16px) / `md` (20px) / `lg` (24px) / `xl` (32px).
- Monotone by default (inherit `currentColor`); reserve the green accent color for an icon only when it represents success/active/selected state.
- Never mix filled and outline icon styles on the same screen.

## 10. 3D design rules

- Use sparingly — 3D should support emotion, never dominate the interface (carries over from the existing Mandatory Design Philosophy in `replit.md`).
- Prefer CSS depth (glass, layered shadows, subtle `perspective`/`rotateX/Y` on hover, max ~6° tilt) over literal 3D renders, unless the user supplies real branded 3D assets.
- No cartoon/floating generic "AI SaaS" 3D icon packs — if a 3D illustration is wanted, it must be commissioned/branded or explicitly requested from the user like any other asset.

## 11. Component variant recipes (reference only, not wired into the app)

Defined in `design-system-v2.css`, ready for the migration phase:
- **Buttons:** `.ds-btn-primary` (solid navy/white), `.ds-btn-secondary` (blue), `.ds-btn-outline` (hairline border), `.ds-btn-ghost` (transparent, hover fill).
- **Inputs:** `.ds-input` (hairline border, blue focus ring), `.ds-input-error` (red focus ring).
- **Cards:** `.ds-card-flat`, `.ds-card-elevated` (shadow-md, borderless), `.ds-card-glass` (glass surface).

## 12. Theming

Every semantic token has a light-mode default (`:root`) and a dark-mode override (`.dark`), matching the existing dark-mode convention in `client/src/index.css` (class-based, `darkMode: ["class"]` in `tailwind.config.ts`). Fully dark/light ready with no extra wiring needed.

## Migration plan (not started — next phase, needs explicit approval)

1. Approve this foundation (tokens only — this document).
2. Pick one low-traffic page as the first migration pilot.
3. Swap that page's classes from `brand`/shadcn tokens to `ds-*` tokens + component recipes.
4. Visually verify against the Mandatory Design Philosophy checklist in `replit.md`.
5. Roll out page by page (Landing → Dashboards → Employee Portal → Customer Portal → Admin Portal → POS), never all at once, never breaking zero-downtime.
