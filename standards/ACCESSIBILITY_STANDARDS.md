# ACCESSIBILITY_STANDARDS.md — QIROX Accessibility Standards

> **Source of truth:** docs/UX_RULES.md, docs/UI_RULES.md, docs/DESIGN_SYSTEM.md, docs/BRAND_BLUEPRINT.md  
> **Scope:** client/src/ — all components, pages, forms, and interactive elements  
> **Status:** Enforcement-ready — no production code modified

---

## Purpose

Define the accessibility requirements for the QIROX platform. Arabic-first, RTL-first platform. WCAG 2.1 AA is the target compliance level. Derived from docs/UX_RULES.md, docs/DESIGN_SYSTEM.md, and docs/BRAND_BLUEPRINT.md.

---

## Rules

### R-A11Y-001 — RTL Must Be the Default Directionality
The HTML root element must have `dir="rtl"` and `lang="ar"` when Arabic is active. When switching to English, both attributes must update: `dir="ltr"` and `lang="en"`. Components must not hardcode physical layout directions. Per docs/DESIGN_SYSTEM.md DS-004.

### R-A11Y-002 — Color Contrast Must Meet WCAG 2.1 AA
All text on backgrounds must meet minimum contrast ratios:
- Normal text (< 18px): 4.5:1 minimum
- Large text (≥ 18px bold or ≥ 24px): 3:1 minimum
- UI components and state indicators: 3:1 minimum
Per docs/DESIGN_SYSTEM.md DS-002.

### R-A11Y-003 — Color Must Not Be the Only Indicator of Meaning
Status indicators, form error states, and alerts must use both color AND an icon or text label. "Green = active, Red = inactive" without any label is forbidden. Per docs/UX_RULES.md UX-006.

### R-A11Y-004 — All Form Inputs Must Have Visible Labels
Every `<input>`, `<select>`, `<textarea>` must have an associated `<label>` element linked via `htmlFor`. Placeholder text is not a substitute for a label. Per docs/UX_RULES.md UX-003.

### R-A11Y-005 — All Interactive Elements Must Be Keyboard Accessible
All buttons, links, form inputs, dropdowns, and dialogs must be reachable and operable via keyboard navigation (`Tab`, `Enter`, `Space`, `Escape`). Shadcn/ui components handle this for standard elements — custom components must replicate this behavior. Per docs/UX_RULES.md UX-001.

### R-A11Y-006 — Focus Indicators Must Be Visible
The browser's default focus ring must not be suppressed (`outline: none` on interactive elements is forbidden) without a custom visible focus indicator replacing it. Per docs/DESIGN_SYSTEM.md DS-003.

### R-A11Y-007 — Dialogs Must Trap Focus
All `<Dialog>` and `<AlertDialog>` components must trap focus within them when open. Focus must return to the triggering element when the dialog closes. Shadcn/ui Dialog handles this — do not override its focus management.

### R-A11Y-008 — Icon Buttons Must Have `aria-label`
Any button that contains only an icon (no visible text) must have an `aria-label` in Arabic:
```tsx
<Button variant="ghost" aria-label="حذف الطلب">
  <Trash2 className="h-4 w-4" />
</Button>
```
Per docs/UI_RULES.md UI-010.

### R-A11Y-009 — Images Must Have Appropriate `alt` Attributes
- Informative images: `alt` describing the image content in Arabic
- Decorative images: `alt=""` (empty string, not missing)
- Logo: `alt="شعار QIROX"`
Per docs/BRAND_IDENTITY.md Section 4.

### R-A11Y-010 — Animations Must Respect `prefers-reduced-motion`
All Framer Motion animations must use `useReducedMotion()`. When the user's OS has reduced motion enabled, skip or minimize animations. Per docs/BRAND_BLUEPRINT.md Section 5.

### R-A11Y-011 — Error Messages Must Be Programmatically Associated
Form validation errors must be linked to their input via `aria-describedby`. React Hook Form + Shadcn `FormMessage` handles this for standard forms — do not remove the `id` prop from FormMessage.

### R-A11Y-012 — Loading States Must Be Announced to Screen Readers
When data is loading, use `aria-live="polite"` or `aria-busy="true"` on the loading container. Loading spinners must have an `aria-label`. Per docs/UX_RULES.md UX-002.

### R-A11Y-013 — Toast Notifications Must Be Announced
The Sonner/toast notification system must use `role="status"` or `aria-live="polite"` so screen readers announce new notifications. Do not override the Shadcn toast ARIA roles.

### R-A11Y-014 — Navigation Landmarks Must Be Present
Each page must have appropriate ARIA landmark elements:
- `<header role="banner">` or semantic `<header>`
- `<nav role="navigation" aria-label="القائمة الرئيسية">`
- `<main>` for the primary content area
- `<footer role="contentinfo">` or semantic `<footer>`

---

## Allowed

- `outline: none` on interactive elements when replaced by a custom, clearly visible focus indicator
- `aria-hidden="true"` on decorative SVG icons within buttons that have text or `aria-label`
- Skip-to-content link at the top of the page for keyboard users
- High-contrast mode (`prefers-contrast: more`) CSS overrides

---

## Forbidden

- `outline: none` without a replacement focus indicator
- Form inputs without visible labels
- Icon buttons without `aria-label`
- Animations that ignore `prefers-reduced-motion`
- Color as the sole indicator of meaning (status, error, etc.)
- `<div role="button">` without `tabIndex={0}` and keyboard event handlers — use `<Button>` instead
- Missing `dir` attribute update when language switches

---

## Examples

### Accessible Status Badge
```tsx
// FORBIDDEN: color only
<span className="bg-green-500 rounded-full h-2 w-2" />

// ALLOWED: color + icon + aria-label
<Badge variant="outline" className="text-green-600 border-green-600">
  <CheckCircle className="h-3 w-3 me-1" aria-hidden="true" />
  <span>{t('status.active')}</span>
</Badge>
```

### Accessible Icon Button
```tsx
// FORBIDDEN
<Button variant="ghost" size="icon">
  <Trash2 className="h-4 w-4" />
</Button>

// ALLOWED
<Button variant="ghost" size="icon" aria-label={t('order.delete')}>
  <Trash2 className="h-4 w-4" aria-hidden="true" />
</Button>
```

### Loading State Announcement
```tsx
{isLoading && (
  <div role="status" aria-live="polite" aria-label={t('loading')}>
    <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
  </div>
)}
```

---

## Checklist

- [ ] `dir="rtl" lang="ar"` on HTML root (Arabic); updates on language switch
- [ ] All text meets WCAG 2.1 AA contrast ratios
- [ ] Status indicators use color + icon/text
- [ ] All form inputs have visible `<label>` elements
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators visible on all interactive elements
- [ ] Dialogs trap focus correctly
- [ ] Icon-only buttons have `aria-label` in Arabic
- [ ] All images have appropriate `alt` attributes
- [ ] Animations skip or minimize with `prefers-reduced-motion`
- [ ] Form errors linked via `aria-describedby`
- [ ] Loading states announced via `aria-live`
- [ ] ARIA landmark elements present on each page

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| `<Button><Trash2 /></Button>` — no label | Add `aria-label={t('delete')}` |
| `placeholder="الاسم"` as only label | Add `<Label htmlFor="name">{t('name')}</Label>` |
| Red/green status dot — no text | Add `<span className="sr-only">{status}</span>` |
| `motion.div` without reduced-motion check | `const reduce = useReducedMotion(); animate={reduce ? {} : animation}` |
| Tab focus disappears on modal trigger | Let Shadcn Dialog manage focus return |

---

## Future Scalability Considerations

- Introduce automated accessibility testing (axe-core or Lighthouse CI) in the CI pipeline to catch violations before merge
- Screen reader testing with VoiceOver (iOS/macOS) and TalkBack (Android) should be part of the QA checklist for the mobile app
- When the platform adds video content (recorded QMeet sessions), captions/subtitles will be required for WCAG compliance
- WCAG 2.2 introduces new criteria (focus appearance, dragging alternatives) — audit compliance when upgrading to 2.2 targets
- Government and enterprise clients in KSA may require WCAG 2.1 AA certification documentation — prepare an accessibility statement page
