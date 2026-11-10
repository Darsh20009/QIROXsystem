# QMeet Native Media Capacity Testing

## 1. Rule

Do not claim that QMeet supports 50 participants because a configuration
contains `50` or because two browsers connect. The result must come from real
clients or a reproducible media load harness.

Current status:

```text
3 participants: pending
10 participants: pending
25 participants: pending
50 participants: pending
```

## 2. Staged acceptance

| Stage | Participants | Required result |
|---|---:|---|
| A | 3 | all join, publish, subscribe, leave, and reconnect |
| B | 10 | stable audio, adaptive thumbnails, no duplicate presence |
| C | 25 | stable room state, bounded CPU/bandwidth, no meeting-wide disconnect |
| D | 50 | target acceptance only after full metrics and failure checks |

Run each stage with:

- desktop Chrome and Edge;
- at least one Android device;
- at least one physical iPhone;
- a normal Wi-Fi network;
- a cellular or restrictive network;
- host and non-host users;
- lobby/approved and open-room paths where applicable.

## 3. Metrics

Capture:

- join success rate;
- join latency;
- time to first audio/video;
- active participant count;
- reconnect count and recovery time;
- ICE failure and TURN usage;
- packet loss and RTT;
- audio interruptions;
- video layer changes;
- SFU CPU/RAM;
- inbound/outbound bandwidth;
- WebSocket errors;
- browser console errors;
- participant leave/rejoin behavior.

Never record tokens, cookies, SDP bodies, or private meeting content in the
test artifacts.

## 4. Failure scenarios

For every stage verify:

1. one participant refreshes;
2. one participant changes Wi-Fi/mobile network;
3. one participant loses camera permission;
4. one participant leaves unexpectedly;
5. host disconnects;
6. signaling reconnects;
7. SFU is drained/restarted in a test room;
8. participant 51 is rejected without affecting participants 1–50;
9. malformed or unauthorized signaling is rejected;
10. Room A cannot subscribe to Room B tracks.

## 5. Test record

Use this table only with measured evidence:

| Participants | Tested | Result | CPU | RAM | Bandwidth | Notes |
|---:|---|---|---:|---:|---:|---|
| 3 | No | Pending | — | — | — | |
| 10 | No | Pending | — | — | — | |
| 25 | No | Pending | — | — | — | |
| 50 | No | Pending | — | — | — | |

## 6. Load harness direction

If 50 physical devices are not available, build a reproducible browser/media
harness that uses real WebRTC publishers and subscribers. Do not replace
media with HTTP or fake WebSocket events and call that a capacity test.

The harness must identify its participant count and preserve the same auth,
room admission, ICE, and SFU paths as production. Any synthetic result must
be labelled synthetic and cannot replace the 50-real-client acceptance test.