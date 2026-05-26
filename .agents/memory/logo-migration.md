---
name: Logo migration
description: Old @assets logo imports replaced system-wide with /qirox-icon.png public path
---

All `import qiroxLogoPath from "@assets/QIROX_LOGO_1770391223929.png"` and similar old logo imports across the codebase have been replaced with `const qiroxLogoPath = "/qirox-icon.png"`.

**Why:** The new transparent-background Q icon at `/public/qirox-icon.png` is the canonical brand icon. It doesn't need `dark:invert` in nav/sidebar/footer (it's visible in both modes). On dark backgrounds (login hero, CTA sections), use `invert dark:invert-0` pattern.

**How to apply:** When adding new components that need the brand logo, use `const logoPath = "/qirox-icon.png"` directly (no import needed, it's a public asset). Never use the old @assets imports again.
