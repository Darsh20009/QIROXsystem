---
name: Pixel Tracking system
description: Dynamic pixel tracking injection via PixelTracking component pulling IDs from DB
---

**Architecture:**
- `QiroxSystemSettingsModel` (server/models.ts) has fields: `metaPixelId`, `tiktokPixelId`, `snapPixelId`, `ga4Id`, `gtmId`
- `/api/public/settings` exposes these to the frontend (no auth required)
- `client/src/components/PixelTracking.tsx` — injected in App.tsx, reads from `/api/public/settings`, dynamically appends pixel scripts on mount
- `AdminQiroxSettings.tsx` has a "tracking" section (7th tab) where admins set these IDs

**Why:** Pixels need to load on every page for all visitors. Using DB-driven IDs allows live updates without code deploys.

**How to apply:** If adding new pixel types, add the field to `qiroxSystemSettingsSchema`, expose in the public settings route, inject script in `PixelTracking.tsx`, and add input field in the "tracking" section of AdminQiroxSettings.
