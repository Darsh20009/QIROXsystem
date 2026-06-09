---
name: react-icons v5 breaking change
description: SiLinkedin was removed in react-icons v5; Vite pre-bundling breaks named exports from react-icons submodules.
---

## Rule
`SiLinkedin` does not exist in `react-icons` v5.6.0. Replace it with `Linkedin` from `lucide-react` everywhere.

## Vite pre-bundling
Without `optimizeDeps: { exclude: ["react-icons"] }` in `vite.config.ts`, Vite pre-bundles `react-icons/si` into a single chunk but misses some named exports, causing a runtime `SyntaxError: does not provide an export named 'SiLinkedin'` that crashes React before it mounts (blank white screen).

**Why:** `react-icons` uses per-icon ESM files. Vite's dep optimizer flattens them but the v5 bundle sometimes drops exports that weren't tree-shaken in. Excluding from optimization forces Vite to serve individual icon ESM files — works correctly.

**How to apply:** Keep `optimizeDeps: { exclude: ["react-icons"] }` in `vite.config.ts`. Never import `SiLinkedin`; always use `Linkedin` from `lucide-react` instead.

## Icons confirmed present in react-icons v5 si module
SiWhatsapp, SiInstagram, SiX, SiSnapchat, SiYoutube, SiTiktok, SiLinktree, SiGoogleplay, SiApple, SiGoogle, SiGithub, SiTelegram — all work fine.
