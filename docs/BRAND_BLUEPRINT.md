# BRAND_BLUEPRINT.md — QIROX Brand Blueprint

> **Mode:** Blueprint only. No code modified. No colors chosen. No fonts chosen.
> **Date:** 2026-07-08

---

## 1. Brand Foundation

**Brand Name:** QIROX (English) | كيروكس (Arabic)
**Category:** Enterprise SaaS — Digital Systems Factory
**Positioning:** The most trusted Arabic-first technology partner for SMEs in the Gulf
**Target Audience:** Founders, business owners, and operators of small-to-medium businesses in KSA and GCC

---

## 2. Brand Personality

### Core Traits
| Trait | What It Means | What It Is NOT |
|---|---|---|
| **Trustworthy** | Clients can build their business on QIROX | Cold, corporate, distant |
| **Intelligent** | AI-native, smart recommendations, proactive | Overwhelming, show-off |
| **Ambitious** | Matches the growth mindset of Arab entrepreneurs | Arrogant, dismissive |
| **Local** | Deeply understands the KSA/GCC market, speaks Arabic naturally | Generic global SaaS |
| **Reliable** | Always available, fast, predictable | Fragile, experimental |
| **Modern** | Contemporary, clean, forward-looking | Trendy for its own sake |

### Brand Archetype
**The Expert / The Guide** — QIROX is the experienced partner who guides entrepreneurs through the complexity of building digital systems. It doesn't oversell; it delivers.

---

## 3. Brand Voice

### Principles
1. **Arabic-first** — Arabic is the primary voice, not a translation
2. **Human, not corporate** — Speak like a knowledgeable friend, not a brochure
3. **Confident, not arrogant** — State facts without boasting
4. **Clear, not dumbed-down** — Respect the user's intelligence
5. **Action-oriented** — Every message moves the user forward

### Voice Attributes
| Attribute | Example (Arabic) | Example (English) |
|---|---|---|
| Direct | "ابدأ فكرتك الآن" | "Start your project today" |
| Empowering | "أنت تمتلك الفكرة، نحن نبنيها" | "You have the idea. We build it." |
| Precise | "تسليم خلال 3 أيام عمل" | "Delivered in 3 business days" |
| Local | "معك في السعودية" | "With you in Saudi Arabia" |
| Not preachy | — | Avoid long explanations of why the product is great |

---

## 4. Brand Tone

The tone shifts based on context — the personality stays consistent, but register adapts:

| Context | Tone | Example |
|---|---|---|
| Landing page | Inspiring, energetic, confident | "نحوّل فكرتك إلى نظام يعمل" |
| Onboarding | Warm, guiding, clear | "مرحباً، لنبدأ خطوة بخطوة" |
| Error messages | Honest, calm, actionable | "حدث خطأ في الاتصال. حاول مجدداً" |
| Admin panel | Professional, functional, efficient | Use labels, not sentences |
| Notifications | Brief, relevant, respectful | "فاتورة جديدة بانتظارك" |
| Marketing emails | Warm but purposeful | No clickbait, clear value |
| Support | Patient, empathetic, solution-focused | "فهمت المشكلة، دعنا نحلها" |

### Tone Anti-Patterns (Do Not Use)
- Over-promising: "الأفضل في العالم العربي" (unverified claims)
- Urgency manipulation: "عرض ينتهي خلال ساعة!"
- Excessive formality: "يسعدنا إحاطتكم علماً بأن..."
- Tech jargon in user-facing copy: "تحسين معدلات تحويل CTA"
- Emojis in professional contexts (admin, invoices, contracts)

---

## 5. Motion & Animation

### Motion Principles
1. **Purpose over decoration** — every animation communicates something (loading, transition, confirmation)
2. **Fast** — durations under 300ms for micro-interactions; 400-600ms for page transitions
3. **Respect user preferences** — all animations respond to `prefers-reduced-motion: reduce`
4. **RTL-aware** — slide-in animations should go right-to-left in Arabic context
5. **Consistent** — use the same easing curve throughout the product

### Motion Types
| Type | Use Case | Duration | Easing |
|---|---|---|---|
| Micro-interaction | Button press, toggle, checkbox | 100-150ms | ease-out |
| Component entrance | Card, modal, drawer | 200-300ms | ease-out |
| Page transition | Route change | 300-400ms | ease-in-out |
| Loading indicator | Data fetching | Continuous | linear |
| Success feedback | Form submit, payment | 400-500ms | spring |
| Error shake | Form validation | 300ms | ease-in-out |
| Scroll-triggered | Landing page reveals | 400-600ms | ease-out |

### Animations to Remove
- `ParticleCanvas.tsx` — on mobile devices (performance impact)
- Any animation on critical-path (prevents interaction)
- Animations in print views (invoice, contract)

---

## 6. Photography Style

> This section documents the photographic style to seek when selecting imagery.

### Principles
1. **People** — Show real professionals in modern Arabic business environments
2. **Authentic** — Avoid generic stock photos; prefer images that feel specific to KSA/Gulf
3. **Gender representation** — Reflect the actual diversity of the Arab business world
4. **Lighting** — Clean, professional, well-lit; avoid heavy filters
5. **Color harmony** — Images should work with the brand palette (to be defined in DESIGN_SYSTEM.md)

### Photography Contexts
| Context | Style | Avoid |
|---|---|---|
| Hero sections | Wide, aspirational, people-first | Generic laptop photos |
| Feature illustrations | Clean product-in-context | Abstract clipart |
| Team/about | Candid, professional, authentic | Over-staged poses |
| Case studies | Before/after, results-focused | Generic graphs |
| Blog/news | Relevant, current | Random stock imagery |

### Arabic-Specific Photography
- Architecture: Saudi modern architecture (Riyadh skyline, NEOM aesthetic)
- Culture: Appropriate representation of Arabic business culture
- Text in images: Any text must be in Arabic first; bilingual if needed
- Avoid: imagery that could be culturally insensitive to KSA norms

---

## 7. Illustration Style

### When to Use Illustration
- Empty states (no data yet)
- Onboarding steps
- Feature explanations
- 404 / error pages
- Marketing sections where photography is not practical

### Illustration Principles
1. **Consistent style** — one illustration system, not a mix
2. **Minimal** — flat or semi-flat; avoid highly detailed illustrations
3. **Character-based** — if characters are used, use diverse, stylized figures
4. **RTL-friendly** — characters face right (toward content) in RTL context
5. **Brandable** — uses brand colors exclusively

### Illustration Don'ts
- Western-context characters in Arabic-market illustrations
- Mixing 3D and 2D illustration styles
- Photo-realistic illustration that conflicts with flat UI
- Illustrations heavier than 100KB (SVG preferred)

---

## 8. Iconography

### Current State
- Lucide React (primary icon set)
- react-icons (brand/social icons only — known v5 issues per `.agents/memory`)

### Iconography Principles
1. **Consistent weight** — all icons same stroke weight (1.5px for Lucide)
2. **Consistent size** — use size scale: 16px, 20px, 24px, 32px
3. **Meaningful** — icon + label together; icon alone only for universally understood actions
4. **RTL mirroring** — directional icons (arrows, chevrons) mirror in RTL automatically
5. **Accessible** — aria-label on interactive icon buttons; aria-hidden on decorative

### Icon Usage Rules
| Context | Size | With Label? |
|---|---|---|
| Navigation items | 20px | Always |
| Table actions | 16px | Tooltip |
| Button prefix | 16px | Always |
| Status indicators | 16px | Color + icon |
| Hero/feature | 32px+ | Yes |
| Empty state | 48px+ | Yes |

### Icons That Require Special Handling
- Saudi Riyal (SAR): `SARIcon.tsx` custom component — use consistently for all currency
- Linkedin: Use Lucide `Linkedin` (not `SiLinkedin` from react-icons v5 — known issue)
- Brand icons: Source from official SVG where available

---

## 9. Color Usage Rules

> Colors are NOT chosen here — that is DESIGN_SYSTEM.md's responsibility.
> These are rules for how colors are used, regardless of their specific values.

### Color Roles
| Role | Purpose | Rule |
|---|---|---|
| Primary | CTAs, active states, brand elements | One per action; no competing primaries |
| Secondary | Supporting actions | Lower visual weight than primary |
| Destructive | Delete, cancel, danger | Red family — never use for non-destructive |
| Success | Confirmation, completed | Green family |
| Warning | Attention needed, not critical | Amber/yellow family |
| Muted | Inactive, disabled, placeholder text | 40% opacity max from foreground |
| Background | Page and component backgrounds | Light/dark mode variants required |
| Border | Dividers, input outlines | Subtle — not competing with content |

### Color Rules
1. Never use color as the only differentiator (colorblindness accessibility)
2. All color combinations must meet WCAG AA contrast (4.5:1 for text, 3:1 for UI)
3. Dark mode must be built in — not an afterthought
4. Brand accent color appears maximum once per screen section
5. Destructive red must NEVER appear on success flows

---

## 10. Typography Placeholders

> Font families are NOT chosen here. These are structural rules only.

### Type Scale (Relative — Exact Values in DESIGN_SYSTEM.md)
| Scale Name | Role | Weight Range |
|---|---|---|
| Display | Hero headlines, major stats | Bold / ExtraBold |
| Heading 1 | Page titles | Bold |
| Heading 2 | Section titles | SemiBold |
| Heading 3 | Subsection titles | SemiBold |
| Heading 4 | Card titles, labels | Medium |
| Body Large | Lead paragraphs | Regular |
| Body | Default body text | Regular |
| Body Small | Secondary text, captions | Regular |
| Label | Form labels, tags | Medium |
| Code | Sandbox IDE, code display | Monospace Regular |

### Typography Rules
1. **Two typefaces maximum** — one Arabic + one Latin (or one typeface that covers both scripts)
2. **Arabic baseline** — Arabic text must sit on the correct baseline (not shifted)
3. **Line height** — Arabic text requires more line-height than Latin (1.6-1.8 for body)
4. **Right-to-left** — Arabic text: text-align right, dir=rtl
5. **Number formatting** — Use Arabic-Indic numerals (٠١٢٣) in Arabic UI context; Western (0123) in technical contexts (invoices, API responses)
6. **Mixing scripts** — when Arabic and Latin appear on the same line, test character baseline alignment
7. **Font loading** — font-display: swap; preload critical weights

---

## 11. Layout Philosophy

### Grid System
- **Fluid grid** — responsive, not fixed breakpoints for everything
- **4-point base unit** — all spacing in multiples of 4px (4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96)
- **Max content width** — 1280px on desktop; full-width on tablet/mobile
- **Sidebar + content** — employee/admin layout; 240-280px sidebar
- **Card-based** — information organized in cards with consistent padding

### RTL-First Principles
1. **Start = Right** in Arabic — "start" and "end" logical properties over "left"/"right"
2. **Reading direction** — content flows right-to-left; code editors (Monaco) stay LTR
3. **Icon mirroring** — directional icons auto-mirror; symmetric icons do not
4. **Number/date position** — dates and numbers in lists may stay left-aligned for readability
5. **Shadows** — in RTL, shadows may need horizontal-flip for realism
6. **Tailwind logical properties** — use `ms-` (margin-start) not `ml-` (margin-left)

### Density
| Context | Density | Reasoning |
|---|---|---|
| Admin tables | Compact | Data-heavy, users are power users |
| Client portal | Comfortable | Occasional users, readability first |
| Public pages | Spacious | Marketing, breathing room, visual impact |
| Mobile | Touch-friendly | 44px minimum touch targets |
| Print views | Print-optimized | No hover states, page breaks |
