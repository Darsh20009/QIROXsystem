import assert from "node:assert/strict";
import test from "node:test";
import {
  getQMeetNativeTrackBinding,
  getQMeetParticipantOwnerId,
  getQMeetRosterStream,
  isQMeetScreenParticipant,
  waitForQMeetMessage,
} from "./qmeet-signaling";

function socketFixture() {
  const socket = new EventTarget();
  return {
    socket: socket as unknown as WebSocket,
    message: (payload: unknown) => socket.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(payload) })),
    close: () => socket.dispatchEvent(new Event("close")),
  };
}

test("QMeet only enters after the expected room acknowledgement", async () => {
  const fixture = socketFixture();
  const accepted = waitForQMeetMessage(fixture.socket, message => message.type === "webrtc_peers" && message.roomId === "shared-room");
  fixture.message({ type: "webrtc_peers", roomId: "different-room" });
  fixture.message({ type: "webrtc_peers", roomId: "shared-room", peers: ["host"] });
  assert.deepEqual((await accepted).peers, ["host"]);
});

test("a closed signaling connection cannot look like a joined meeting", async () => {
  const fixture = socketFixture();
  const accepted = waitForQMeetMessage(fixture.socket, message => message.type === "media.ready");
  fixture.close();
  await assert.rejects(accepted, /قبل تأكيد الانضمام/);
});

test("a socket without admission times out rather than showing an empty meeting", async () => {
  const fixture = socketFixture();
  await assert.rejects(waitForQMeetMessage(fixture.socket, () => false, 5), /لم يؤكد/);
});

test("SFU admission errors reject the media handshake", async () => {
  const fixture = socketFixture();
  const accepted = waitForQMeetMessage(fixture.socket, message => {
    if (message.type === "media.error") throw new Error("admission rejected");
    return message.type === "media.ready";
  });
  fixture.message({ type: "media.error" });
  await assert.rejects(accepted, /admission rejected/);
});

test("media arriving before the control roster retains its SFU participant identity", () => {
  const event = { track: { id: "browser-receiver", kind: "video" }, streams: [{ id: "guest-approved" }] } as unknown as RTCTrackEvent;
  assert.deepEqual(getQMeetNativeTrackBinding(event, new Map(), new Map()), {
    participantId: "guest-approved", publicationId: "browser-receiver",
  });
});

test("browser receiver IDs are associated with the SFU publication IDs", () => {
  const event = { track: { id: "browser-receiver", kind: "audio" }, streams: [{ id: "host" }] } as unknown as RTCTrackEvent;
  const publications = new Map([
    ["sfu-session:audio", { participantId: "host", kind: "audio" }],
    ["sfu-session:video", { participantId: "host", kind: "video" }],
  ]);
  assert.deepEqual(getQMeetNativeTrackBinding(event, publications, new Map()), {
    participantId: "host", publicationId: "sfu-session:audio",
  });
});

test("authoritative SFU stream identity wins over a stale receiver association", () => {
  const event = { track: { id: "reused-receiver", kind: "video" }, streams: [{ id: "new-participant" }] } as unknown as RTCTrackEvent;
  const previous = new Map([["reused-receiver", "old-participant"]]);
  assert.equal(getQMeetNativeTrackBinding(event, new Map(), previous).participantId, "new-participant");
});

test("a fresh control roster reattaches the live native stream after reconnect", () => {
  const stream = { id: "still-live-media" } as MediaStream;
  const cache = new Map([["other-participant", stream]]);
  assert.equal(getQMeetRosterStream(null, "other-participant", cache), stream);
  assert.equal(getQMeetRosterStream(undefined, "other-participant", cache), stream);
  assert.equal(getQMeetRosterStream(null, "departed-participant", cache), null);
});

test("an existing playing stream is preserved during metadata refresh", () => {
  const playing = { id: "playing" } as MediaStream;
  const cache = new Map([["other-participant", { id: "cached" } as MediaStream]]);
  assert.equal(getQMeetRosterStream(playing, "other-participant", cache), playing);
});

test("screen publisher identities map back to the admitted meeting participant", () => {
  const screenId = "guest-approved:qmeet-screen";
  assert.equal(isQMeetScreenParticipant(screenId), true);
  assert.equal(getQMeetParticipantOwnerId(screenId), "guest-approved");
  assert.equal(getQMeetParticipantOwnerId("guest-approved"), "guest-approved");
});

test("screen publisher media can be found from its owner roster identity", () => {
  const stream = { id: "screen-stream" } as MediaStream;
  const cache = new Map([["guest-approved:qmeet-screen", stream]]);
  assert.equal(getQMeetRosterStream(null, "guest-approved:qmeet-screen", cache), stream);
});