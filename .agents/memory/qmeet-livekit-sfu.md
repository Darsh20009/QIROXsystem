---
name: QMeet LiveKit SFU integration
description: QMeet was upgraded from P2P mesh to LiveKit SFU to support 100+ participants. How the hybrid architecture works.
---

# QMeet LiveKit SFU Integration

## Architecture

**Before:** Pure P2P mesh — at 100 participants = 4,950 RTCPeerConnections, browsers crash.

**After:** Hybrid SFU + WS:
- **LiveKit** handles all media (audio, video, screen share)
- **QIROX WebSocket** handles non-media features (chat, reactions, polls, host controls, lobby)

## Activation

Controlled by three env vars:
- `LIVEKIT_URL` — e.g. `wss://my-cloud.livekit.cloud`
- `LIVEKIT_API_KEY` — from livekit.io dashboard
- `LIVEKIT_API_SECRET` — from livekit.io dashboard

If any is missing → `LIVEKIT_ENABLED = false` → transparent fallback to P2P mesh.

## Server endpoint

`GET /api/qmeet/livekit-token/:roomId` in `server/qmeet.ts`:
- Returns `{ enabled: false }` if unconfigured
- Returns `{ enabled: true, token: "JWT", url: "wss://..." }` if configured
- JWT built manually with Node.js `crypto` (no `@livekit/server-sdk` dep — not available in this registry)
- Function: `makeLiveKitJWT(identity, name, room)` — HS256, 4-hour TTL

## Client integration (`client/src/pages/MeetingRoom.tsx`)

**New state/refs:**
- `lkRoomRef: useRef<any>(null)` — LiveKit Room instance
- `livekitModeRef: useRef(false)` — checked in callbacks (avoids stale closure)
- `livekitMode: boolean` — React state for UI badge

**`updateLKPeers(room)`** — rebuilds `peers` Map from `room.remoteParticipants`:
- Uses `participant.identity` as key (= userId)
- Builds `MediaStream` from camera/microphone/screen_share/screen_share_audio tracks
- Sets `videoOn = tracks.some(t => t.kind === "video")`, `audioOn = !participant.isMicrophoneMuted`

**`joinMeeting()`** (after `getIce()`):
1. Fetches LiveKit token
2. If `enabled: true`: creates `Room`, binds events, `room.connect()`, publishes local tracks
3. Falls back to P2P if token fetch fails or returns `enabled: false`
4. WS connection always made (for chat/reactions/polls)

**Message handler guards** (`if (livekitModeRef.current) return`):
- `webrtc_offer`, `webrtc_answer`, `webrtc_ice` — skip entirely in SFU mode
- `webrtc_peers` — skips P2P loop, stores names only
- `webrtc_peer_joined` — skips `createPc`, stores name only
- `webrtc_peer_left` — skips PC cleanup (LiveKit handles via ParticipantDisconnected)

**Controls in SFU mode:**
- `toggleAudio`: `localTrack.enabled = on` + `setMicrophoneEnabled(on)`
- `toggleVideo`: `localTrack.enabled = on` + `setCameraEnabled(on)`
- `toggleScreen`: `setScreenShareEnabled(true/false)`

**Cleanup:** `lkRoomRef.current?.disconnect()` in `leave()`, cleanup `useEffect`, and `webrtc_meeting_ended` handler.

## UI

SFU badge in top bar: `"SFU · 100↑"` (emerald green), shown only when `livekitMode === true`.

## Why: @livekit/server-sdk not available

The `@livekit/server-sdk` npm package is not in the Replit npm registry. JWT is built manually using Node.js `crypto` module (`createHmac("sha256", secret)`). Same token format LiveKit expects (HS256, `video` grant object).

**How to apply:** When user wants LiveKit, set the 3 env vars. Free cloud at livekit.io (50k min/month).
