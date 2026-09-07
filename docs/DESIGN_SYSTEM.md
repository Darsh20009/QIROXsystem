# DESIGN_SYSTEM.md — QIROX Design System Audit

> **Mode:** Audit only. No fixes. Document every issue.
> **Date:** 2026-07-08

---

## 1. Current Design Foundation

### Component Library
- **Base:** Shadcn/ui (Radix UI primitives)
- **Styling:** Tailwind CSS v3
- **Animation:** Framer Motion
- **Icons:** Lucide React + react-icons

### Configuration Files
- `tailwind.config.ts` — Tailwind configuration
- `components.json` — Shadcn/ui component registry
- `client/src/index.css` — Global styles, Tailwind directives, CSS variables

### Component Location
- `client/src/components/` — All shared components
- Shadcn/ui components live in `client/src/components/ui/`

---

## 2. Installed Shadcn/ui Components (from `components.json`)

The following Radix-based components are installed:

Accordion, AlertDialog, AspectRatio, Avatar, Badge, Button, Calendar, Card, Carousel, Chart, Checkbox, Collapsible, Command, ContextMenu, Dialog, DropdownMenu, Form, HoverCard, Input, InputOTP, Label, Menubar, NavigationMenu, Pagination, Popover, Progress, RadioGroup, ResizablePanel, ScrollArea, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Switch, Table, Tabs, Textarea, Toast, Toaster, Toggle, ToggleGroup, Tooltip

---

## 3. Design Tokens (Estimated from Tailwind + CSS Variables)

> Full token audit requires reading `tailwind.config.ts` and `client/src/index.css`. Below is the structural audit.

### Colors
- CSS custom properties defined in `client/src/index.css` (Shadcn/ui convention: `--background`, `--foreground`, `--primary`, `--secondary`, etc.)
- Both light and dark mode variants expected (`:root` and `.dark` selectors)

### Typography
- Arabic-first: RTL layout, Arabic font(s) configured
- Font configuration is in Tailwind config or index.css — exact fonts not yet audited

### Spacing
- Tailwind default spacing scale
- Custom spacing extensions may exist in `tailwind.config.ts`

### Border Radius
- Shadcn/ui uses `--radius` CSS variable
- Applied via Tailwind `rounded-*` utilities

---

## 4. Design System Issues (Audit)

### DS-001 — No Design Tokens Documentation
- **File:** `tailwind.config.ts`, `client/src/index.css`
- **Problem:** No documentation of color tokens, typography scales, spacing system, or component variants exists in the codebase.
- **Risk:** Developers use ad-hoc Tailwind classes instead of design tokens, creating visual inconsistency across 166 pages.
- **Recommendation:** Document all CSS custom properties and Tailwind theme extensions in this file after full token audit.
- **Priority:** MEDIUM

### DS-002 — Custom Components vs Shadcn/ui Divergence Not Audited
- **File:** `client/src/components/`
- **Problem:** The degree of customization applied to Shadcn/ui components (via `cn()` overrides, direct style props) has not been audited.
- **Risk:** Upgrading Shadcn/ui components may break customized variants. Inconsistent styling between customized and stock components.
- **Recommendation:** Audit each component in `components/ui/` for inline customizations. Document variants in this design system.
- **Priority:** MEDIUM

### DS-003 — Dark Mode Implementation Not Audited
- **File:** `client/src/index.css`, component files
- **Problem:** Dark mode support (via Tailwind `dark:` prefix or CSS variables) has not been fully audited.
- **Risk:** Some pages or components may not have proper dark mode styles, causing white-on-white or black-on-black text.
- **Recommendation:** Audit all 166 pages for dark mode rendering. Test with `class="dark"` on root element.
- **Priority:** MEDIUM

### DS-004 — RTL Layout Coverage Not Verified
- **File:** `client/src/` (all pages)
- **Problem:** While the platform is Arabic-first and uses RTL layout, the completeness of RTL support across all 166 pages has not been audited.
- **Risk:** Some pages (especially newer additions) may have hardcoded `left`/`right` positioning that breaks RTL layout.
- **Recommendation:** Audit all pages for RTL-incompatible CSS: `left-*`, `right-*`, `ml-*`, `mr-*` (prefer `ms-*`/`me-*` for logical properties), `text-left`/`text-right`.
- **Priority:** MEDIUM

### DS-005 — Icon Consistency
- **File:** Various component files
- **Problem:** Both `lucide-react` and `react-icons` are used. `SiLinkedin` was removed in react-icons v5 (known issue per `.agents/memory`).
- **Risk:** Mixed icon sets create visual inconsistency. react-icons v5 named-export failures.
- **Recommendation:** Standardize on Lucide React for all UI icons. Use react-icons only for brand/social icons not in Lucide. Audit all react-icons imports for v5 compatibility.
- **Priority:** LOW

### DS-006 — Animation Library Usage Not Standardized
- **File:** `client/src/` (various pages)
- **Problem:** Framer Motion is installed but the extent of usage and whether it follows consistent patterns (shared variants, animation presets) is unknown.
- **Risk:** Inconsistent animation timing, easing, and behavior across pages. Performance impact of unnecessary animations on low-end mobile devices.
- **Recommendation:** Document Framer Motion animation variants used. Respect `prefers-reduced-motion` media query.
- **Priority:** LOW
