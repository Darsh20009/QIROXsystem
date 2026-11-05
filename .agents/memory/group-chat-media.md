---
name: Group chat audio/image media fixes
description: Root causes and fixes for voice messages not playing and images loading slowly in the employee group chat.
---

# Group Chat — Audio & Image Media

## Audio (voice messages)

**Root cause:** `express.static` resolves `.webm` → `video/webm` by default. Browsers refuse `<audio>` elements with a video MIME type and fail silently.

**Fix applied (`server/routes.ts` `/uploads` static middleware):**
- `.webm` → `audio/webm; codecs=opus`
- `.ogg`  → `audio/ogg; codecs=opus`
- All upload files get `Cache-Control: public, max-age=604800, immutable`

**GroupVoicePlayer (`client/src/pages/GroupChat.tsx`):**
- `audio.play()` is async — must `await` and `catch` (autoplay policy, unsupported codec)
- `preload="metadata"` loads duration without downloading the full file
- Progress bar is now seekable (click to seek)
- Shows error state for Safari (Safari doesn't support .webm audio — user sees "تنسيق الصوت غير مدعوم")
- Time display: MM:SS format for both current and total duration

## Images

- Added `loading="lazy"` and `decoding="async"` to `<img>` tags in GroupChat
- `onError` hides broken image elements instead of showing broken-image icon

## Notifications

- Notification link was hardcoded `/groups`; changed to `/groups/:id` so clicking opens the specific chat
