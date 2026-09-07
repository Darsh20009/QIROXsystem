---
name: Push banner persistence
description: PushPermissionBanner dismissal behavior and TTL logic.
---

## Rule
`PushPermissionBanner` stores its dismissal timestamp in `localStorage` (key `qirox_push_banner_dismissed_v3`) with a 7-day TTL.
- On each mount, it reads the stored timestamp and only suppresses the banner if `Date.now() - ts < 7 days`.
- After 7 days, the entry is deleted and the banner shows again.

Previously it used `sessionStorage` which caused the banner to show at most once per session (gone on refresh). This meant users who dismissed it never got another chance to enable push.

**Why:** Push notification opt-in requires user gesture. If the banner is suppressed forever, users on new devices or after clearing storage never subscribe, so they never receive push notifications.

**How to apply:** Do not revert to sessionStorage. If TTL needs changing, update `DISMISS_TTL_MS` in `PushPermissionBanner.tsx`.
