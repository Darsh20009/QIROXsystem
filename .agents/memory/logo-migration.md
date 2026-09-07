---
name: Logo migration
description: Logo color is DARK (nearly black, R≈0-10) on transparent background — invert logic must be reversed from the old pattern
---

Both `/qirox-icon.png` and `/qirox-logo-full.png` are DARK logos (R≈0-10, G≈0-10, B≈0-10) on transparent RGBA backgrounds. They are NOT white.

**Why this matters:** The old incorrect pattern `invert dark:invert-0` would invert dark→white in light mode, making the logo invisible on light/white backgrounds.

**Correct CSS patterns by context:**

| Context | Tailwind class | Reason |
|---|---|---|
| Nav / sidebar / footer / page headers (light bg in light mode, dark bg in dark mode) | `dark:invert` | Dark logo visible on light bg; inverted (white) on dark bg in dark mode |
| Always-dark panels (Login, VerifyEmail, ForgotPassword left black panels with `bg-black`) | `invert` | Always need to invert dark→white to be visible on black bg |
| Inverted CTA sections (dark bg in light mode, light bg in dark mode — e.g. `bg-black dark:bg-white`) | `invert dark:invert-0` | Need invert in light mode (dark section), no invert in dark mode (light section) |
| Always-dark rails (EmployeeMail left rail `bg-[#0f1117]`) | `brightness-0 invert` | First crush to pure black, then invert to white |

**WRONG pattern (do not use):** `invert dark:invert-0` on nav/sidebar/footer — this inverts in light mode making dark logo white = invisible on white backgrounds.

**File paths:**
- Icon: `/qirox-icon.png` — the Q mark only (231KB, RGBA)
- Full logo: `/qirox-logo-full.png` — QIROX wordmark + icon (1.4MB, RGBA, 1746×1088)
- Use as public static paths (no import needed)
