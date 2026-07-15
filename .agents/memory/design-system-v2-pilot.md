---
name: Design System V2 rollout
description: Status and pattern for the platform-wide Design System V2 (White/Off-White/Navy/Blue/Black/Gray) migration — the CTO-approved permanent design language, rolled out in phases.
---

Approved as the **permanent design language for the whole platform** (a full Brand Experience redesign, not a visual reskin) — see `docs/design-system-v2.md` for the phase order and current status per phase.

## Reskin pattern for shared, feature-rich components (Navigation/Footer)

When restyling an existing production component that has real behavior (auth, cart, data fetching, animations) to ds-* tokens, don't inline two style branches in one file and don't hand-edit large files with mechanical regex — both are error-prone at this size.

Instead: copy the original untouched to `<Name>Legacy.tsx`, delegate a **pure visual reskin** to a design subagent that writes a new `<Name>DSV2.tsx` (explicitly listing every behavior that must survive unchanged: data-testids, hooks, animations, dropdowns, modals), then replace the original file with a thin wrapper that picks Legacy vs DSV2 via a feature flag (`useFlag` from `client/src/features/customer-journey/hooks/use-feature-flags.ts`).

**Why:** keeps the risky, hard-to-review part (a 500+ line component with cart/auth/mobile-menu logic) as a single-purpose, reviewable diff (a new file), keeps the legacy path byte-identical for instant rollback, and avoids the design subagent inventing new UX during what should be a pure token swap.

**How to apply:** any future ds-v2 migration of a shared component with non-trivial behavior (not just markup) should follow this same Legacy/DSV2/flag-wrapper split — e.g. it's the model for globally unifying nav-like or footer-like components.
