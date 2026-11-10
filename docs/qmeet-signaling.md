# QMeet Native Signaling

## 1. Scope

QMeet signaling coordinates authenticated room state and WebRTC negotiation.
It does not carry audio/video media and is not an SFU.

The existing QMeet `/ws` remains the control/event socket for chat, lobby,
polls, whiteboard, reactions, captions, and host controls. Phase 2 adds a
separate `/ws` endpoint on the native SFU for media negotiation; RTP never
travels through either WebSocket.

## 2. Authentication

At the SFU WebSocket upgrade:

1. Authenticate the existing Qirox session/device token.
2. Resolve the server-side user identity.
3. Bind the connection to a server-generated connection identity.
4. Reject unauthenticated or malformed upgrades.
5. Do not trust `userId`, `workspaceId`, `role`, or `roomOwner` from the
   browser.

Guest join-by-code must receive a server-created guest identity and a bounded
guest capability. It must not be able to impersonate an existing user.

## 3. Room admission

The signaling layer asks the QMeet API/control service to authorize a join.
Admission checks:

- room exists and is joinable;
- meeting status and expiration;
- membership or approved join request;
- lobby/lock/ban rules;
- participant count below 50;
- host/moderator capability;
- media capability requested by the client.

The count check must be atomic at the authoritative control layer. The client
UI is not a capacity boundary.

## 4. Room state

The current process-local `meetRooms` map is retained only as a single-node
compatibility implementation. The native multi-instance design uses:

- MongoDB for durable meeting and authorization state;
- Redis for presence leases, room events, and cross-instance control;
- a participant lease with heartbeat and expiry;
- an idempotent join/leave operation keyed by participant/session.

Media packets and RTP state remain inside the SFU process and are not written
to MongoDB or Redis.

## 5. Message validation

Every message must:

- be valid JSON within the existing payload size limit;
- match a known schema and message type;
- include a bounded request ID where required;
- be scoped to the authenticated room;
- be rate-limited by connection and participant;
- reject unknown privileged fields rather than silently accepting them.

SDP and ICE payloads are passed only to the current authorized SFU session.
They are never logged.

## 6. Native media events

The existing events remain available during migration:

```text
webrtc_join
webrtc_leave
webrtc_media_state
webrtc_offer / webrtc_answer / webrtc_ice   (legacy P2P only)
webrtc_draw / webrtc_whiteboard_clear
webrtc_chat
webrtc_reaction
webrtc_poll_*
webrtc_host_*
webrtc_lobby_*
webrtc_screen_*
```

The SFU `/ws` negotiation uses:

```text
media.hello
media.ready
media.offer
media.answer
media.ice
media.track-published
media.track-removed
media.subscribe
media.unsubscribe
media.restart
media.error
```

The legacy offer/answer relay in the QMeet application socket is not used by
the native SFU path.

The SFU sends `media.track-published` and `media.track-removed` with bounded
`trackId`, `participantId`, and `kind` metadata. It sends server-generated
`media.offer` messages when a subscriber needs renegotiation.

## 7. Reconnect and cleanup

Every connection has a heartbeat and bounded stale-session timeout. On
disconnect:

1. mark the session reconnecting;
2. retain participant state for the grace period;
3. remove the old SFU session;
4. broadcast only if the grace period expires;
5. transfer host deterministically if the host does not return;
6. clean an empty room after its normal expiry policy.

The same participant must not appear twice after refresh or network switching.

## 8. Abuse controls

- limit upgrades and join attempts per IP/account;
- limit rooms and tracks per authenticated account;
- limit SDP/ICE renegotiations;
- reject cross-room IDs;
- expire media credentials quickly;
- close sockets that fail heartbeat or send malformed messages;
- emit safe metrics without secrets or private content.