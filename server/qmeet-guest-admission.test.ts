import assert from "node:assert/strict";
import test from "node:test";
import {
  hashQMeetGuestProof,
  isApprovedQMeetGuest,
  issueQMeetGuestTicket,
  verifyQMeetGuestTicket,
} from "./qmeet-guest-admission";

process.env.SESSION_SECRET = "unit-test-only-qmeet-guest-admission-secret";

const admission = {
  roomId: "room_abc-123",
  guestId: `qmeet_guest_${"a".repeat(48)}`,
  requestId: "0123456789abcdef01234567",
  name: "Guest",
};

test("QMeet guest ticket is signed, room-scoped, and expires", () => {
  const now = 1_800_000_000_000;
  const token = issueQMeetGuestTicket({ ...admission, now });

  assert.deepEqual(verifyQMeetGuestTicket(token, admission.roomId, now), {
    version: 1,
    roomId: admission.roomId,
    guestId: admission.guestId,
    requestId: admission.requestId,
    name: admission.name,
    issuedAt: Math.floor(now / 1000),
    expiresAt: Math.floor(now / 1000) + 2 * 60 * 60,
  });
  assert.equal(verifyQMeetGuestTicket(token, "another-room", now), null);
  assert.equal(verifyQMeetGuestTicket(token, admission.roomId, now + 2 * 60 * 60 * 1000 + 1000), null);

  const [payload, signature] = token.split(".");
  const tampered = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  tampered.guestId = `qmeet_guest_${"b".repeat(48)}`;
  const tamperedToken = `${Buffer.from(JSON.stringify(tampered)).toString("base64url")}.${signature}`;
  assert.equal(verifyQMeetGuestTicket(tamperedToken, admission.roomId, now), null);
});

test("QMeet guest ticket only matches an approved meeting participant", () => {
  const now = 1_800_000_000_000;
  const claims = verifyQMeetGuestTicket(
    issueQMeetGuestTicket({ ...admission, now }),
    admission.roomId,
    now,
  )!;
  const meeting = {
    roomName: admission.roomId,
    status: "live",
    participantIds: [admission.guestId],
    joinRequests: [{
      _id: admission.requestId,
      userId: admission.guestId,
      status: "approved",
    }],
  };
  assert.equal(isApprovedQMeetGuest(meeting, claims), true);
  assert.equal(isApprovedQMeetGuest({ ...meeting, participantIds: [] }, claims), false);
  assert.equal(isApprovedQMeetGuest({
    ...meeting,
    joinRequests: [{ ...meeting.joinRequests[0], status: "rejected" }],
  }, claims), false);
});

test("QMeet guest proof hashes only fixed-length random proofs", () => {
  const proof = "a".repeat(64);
  assert.match(hashQMeetGuestProof(proof) || "", /^[a-f0-9]{64}$/);
  assert.equal(hashQMeetGuestProof("too-short"), null);
});