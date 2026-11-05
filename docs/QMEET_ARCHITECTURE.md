# QMEET_ARCHITECTURE.md — QMeet Video Conferencing Architecture Blueprint

> **Mode:** Blueprint only. No code modified.
> **Date:** 2026-07-08

---

## 1. Current QMeet Overview

| Component | Technology | Status |
|---|---|---|
| Signaling server | Express routes (server/qmeet.ts — 1,193 lines) | Active |
| Database | Separate MongoDB models (qmeet-db.ts) | Active |
| Room naming | `qmeet-` + 10 random alphanumeric chars | Active |
| Join code | 6-char uppercase alphanumeric | Active |
| Scheduling | setInterval auto-start/end/reminder | Active |
| AI summary | OpenAI/Kimi — Arabic structured output | Active |
| Push notifications | WS broadcast + push on room events | Active |
| WebRTC media | Client-side (third-party or native WebRTC) | Active |
| Recording | Not implemented | Missing |
| iOS WebRTC | Not tested in Capacitor WKWebView | Unknown |

---

## 2. Room Lifecycle

```
State Machine:
    draft
      │ (POST /api/qmeet/meetings)
      ▼
  scheduled ──────────────────────── cancelled
      │                                  ▲
      │ scheduledAt reached              │ (DELETE endpoint)
      │ (auto via scheduler)             │
      ▼                                  │
    live ──────────────────── cancelled ──┘
      │
      │ duration exceeded (auto)
      │ OR host ends manually
      ▼
  completed
      │
      │ AI summary generated (optional)
      ▼
  archived
```

### State Transitions

| From | To | Trigger | Action |
|---|---|---|---|
| draft | scheduled | POST creates with scheduledAt | Email invites sent |
| scheduled | live | scheduledAt <= now (scheduler) | WS broadcast to all participants |
| scheduled | cancelled | DELETE endpoint | Email cancellation sent |
| live | completed | Duration exceeded (scheduler) | Media cleanup, feedback prompt |
| live | completed | Host ends manually | Same |
| live | cancelled | Emergency cancel | Email sent |
| completed | archived | Admin action | Move to cold storage |

---

## 3. Connection Lifecycle

```
Client opens MeetingRoom page
    │
    ├── GET /api/qmeet/meetings/:id/join
    │       → Return: { roomName, jitsiToken OR webRTCConfig, joinCode }
    │
    ├── Initialize WebRTC connection
    │       → getUserMedia({ video: true, audio: true })
    │       → Create RTCPeerConnection
    │       → Exchange SDP via signaling (WebSocket or REST)
    │
    ├── Connected
    │       → QMeetingModel.update({ status: 'live', participantCount++ })
    │       → WS: broadcast presence to other participants
    │
    └── Disconnected / Page close
            → RTCPeerConnection.close()
            → QMeetingModel.update({ participantCount-- })
            → If participantCount === 0 AND host left → auto-end
```

---

## 4. Reconnection Logic

### Current State
No explicit reconnection logic documented in the codebase.

### V4 Target Design

```
Client WebRTC connection drops
    │
    ├── connection.iceConnectionState === 'disconnected'
    │       → Wait 3 seconds
    │       → Attempt ICE restart
    │
    ├── connection.iceConnectionState === 'failed'
    │       → Show "جاري إعادة الاتصال..." UI
    │       → createOffer({ iceRestart: true })
    │       → Wait up to 30 seconds
    │
    ├── Reconnected within 30s
    │       → Hide reconnecting UI
    │       → Resume media streams
    │
    └── Failed after 30s
            → Show "انقطع الاتصال" with "إعادة الانضمام" button
            → Client re-calls /api/qmeet/meetings/:id/join
            → Start fresh connection
```

---

## 5. Media Handling

### Camera & Microphone
```
Pre-call check:
    1. navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    2. Show device preview
    3. Allow device selection (camera, microphone, speaker)
    4. Test microphone level
    5. "انضم الآن" button enables

During call:
    - Mute/unmute audio: track.enabled = false/true
    - Enable/disable video: track.enabled = false/true
    - Switch camera (mobile): getSupportedConstraints().facingMode

On call end:
    - ALL tracks stopped: track.stop()
    - RTCPeerConnection closed: pc.close()
    - LocalStream released: stream.getTracks().forEach(t => t.stop())
```

### Screen Sharing
```
getDisplayMedia({ video: true })
    → Replace video track in peer connection
    → Signal to other participants: "screen_share_started"
    → On stop: revert to camera track
```

### Media Cleanup (Critical)
```
Component unmount / page navigation:
    useEffect(() => {
        return () => {
            localStream?.getTracks().forEach(t => t.stop());
            peerConnections.forEach(pc => pc.close());
            ws.send({ type: 'leave', meetingId });
        };
    }, []);
```

---

## 6. Scaling Strategy

### Current Scale
- Single Express server handles all QMeet signaling
- MongoDB stores all meeting state
- WebSocket connections are in-memory (server/ws.ts)
- Not horizontally scalable (WebSocket state is per-instance)

### V4 Scaling Plan

#### Phase 1: Current (Single Server)
```
All clients → Single Express + WS server
             → Works up to ~100 concurrent meetings
             → QMeet data in MongoDB Atlas (scalable)
```

#### Phase 2: WebRTC SFU (Selective Forwarding Unit)
```
For large meetings (>10 participants):
    Client → QIROX Server (signaling only)
           → Third-party SFU (e.g., Livekit, Mediasoup)
           → SFU handles media routing (not the app server)

Benefits:
    - App server only handles signaling (lightweight)
    - SFU handles all media bandwidth
    - Scales to 100+ participants per room
```

#### Phase 3: Horizontal Scaling
```
Multiple QIROX Express instances behind load balancer
    → WebSocket sessions via Redis pub/sub
    → All instances subscribe to same Redis channel
    → WS message to user on any instance broadcasts correctly

Requires: Sticky sessions OR Redis adapter for Socket.IO/ws
```

---

## 7. Recording Architecture

### Current State
Recording is NOT implemented.

### V4 Target Design

```
Option A: Server-side Recording (MediaRecorder API in headless browser)
    → Puppeteer/Playwright joins the meeting
    → Records video/audio stream
    → Saves to object storage
    → Generates download link

Option B: Client-side Recording (host only)
    → Host clicks "تسجيل"
    → MediaRecorder captures local + remote streams
    → Blob saved to object storage via signed upload URL
    → Link stored in QMeetingModel.recordingUrl

Option B is recommended for V4 (simpler, no extra infrastructure)

Recording Model:
    QMeetingModel.recordings: [{
        url: String,          // Object storage URL
        duration: Number,     // seconds
        size: Number,         // bytes
        recordedBy: ObjectId, // userId
        createdAt: Date
    }]

Retention policy: 30 days (auto-delete from object storage)
```

---

## 8. Permissions in QMeet

| Permission | Default | Configurable? |
|---|---|---|
| Create meeting | All authenticated users | Yes (admin setting) |
| Join by link | All authenticated users | Per-meeting setting |
| Join by code | Anyone (even unauthenticated) | Per-meeting setting |
| Share screen | All participants | Per-meeting (host-only option) |
| Record | Host only | Per-meeting setting |
| Mute others | Host only | Always |
| Remove participant | Host only | Always |
| View AI summary | Host + admin | Always |
| Delete meeting | Host + admin | Always |

### Host Controls
```
Meeting settings per room:
    - allowJoinByCode: Boolean (join without account)
    - isLocked: Boolean (no new joins)
    - allowScreenShare: Boolean
    - allowRecording: Boolean
    - muteOnEntry: Boolean
    - requireApproval: Boolean (waiting room)
```

---

## 9. iOS WebRTC Compliance

Capacitor uses WKWebView. WebRTC in WKWebView on iOS requires:

```
Info.plist requirements:
    NSCameraUsageDescription: "تستخدم كيروكس الكاميرا لاجتماعات QMeet"
    NSMicrophoneUsageDescription: "تستخدم كيروكس الميكروفون لاجتماعات QMeet"
    NSLocalNetworkUsageDescription: "تستخدم كيروكس الشبكة المحلية لـ WebRTC"

Known WKWebView WebRTC limitations:
    - getUserMedia works on iOS 14.3+ (WKWebView)
    - Screen sharing NOT available in WKWebView (iOS limitation)
    - Background audio: requires VoIP entitlement for continuous audio
    - Push-to-talk is affected by iOS audio session management

Capacitor config additions needed:
    - Add "NSBonjourServices" for local mDNS (peer discovery)
    - Audio session category: AVAudioSessionCategoryPlayAndRecord

Testing required:
    - Physical iPhone (not simulator — camera unavailable in simulator)
    - Test: join meeting, camera on, microphone on, switch to background
    - Test: reconnect after iOS kills background connection
```

---

## 10. QMeet Scheduler (Current Implementation)

```javascript
setInterval(async () => {
    // 1. Auto-start: scheduled → live
    const toStart = await QMeetingModel.find({
        status: "scheduled",
        scheduledAt: { $lte: now }
    });
    // WS broadcast to all participants

    // 2. Auto-end: live → completed (when duration exceeded)

    // 3. Reminder emails: 15min before scheduled start
}, 60_000); // runs every 60 seconds
```

**Issue:** `setInterval` runs on every server instance in a multi-server deployment. In a scaled environment, this causes duplicate emails and duplicate state transitions.

**V4 Fix:** Use a distributed cron lock (e.g., MongoDB `findOneAndUpdate` with a `lockedUntil` field) to ensure only one instance processes each event.
