import { createHash, createHmac, timingSafeEqual } from "crypto";

const GUEST_TICKET_TTL_SECONDS = 2 * 60 * 60;
const GUEST_ID_PATTERN = /^qmeet_guest_[a-f0-9]{48}$/i;
const ROOM_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9:_-]{0,127}$/;

export type QMeetGuestAdmission = {
  version: 1;
  roomId: string;
  guestId: string;
  requestId: string;
  name: string;
  issuedAt: number;
  expiresAt: number;
};

function signingKey(): Buffer {
  const secret = String(process.env.SESSION_SECRET || "");
  if (!secret) throw new Error("Session secret is required for QMeet guest admission");
  return createHmac("sha256", secret).update("qmeet-guest-admission-v1").digest();
}

export function hashQMeetGuestProof(proof: string): string | null {
  if (!/^[a-f0-9]{64}$/i.test(proof)) return null;
  return createHash("sha256").update(proof.toLowerCase()).digest("hex");
}

export function issueQMeetGuestTicket(input: {
  roomId: string;
  guestId: string;
  requestId: string;
  name: string;
  now?: number;
}): string {
  if (!ROOM_ID_PATTERN.test(input.roomId) || !GUEST_ID_PATTERN.test(input.guestId)) {
    throw new Error("Invalid QMeet guest admission identity");
  }
  const issuedAt = Math.floor((input.now ?? Date.now()) / 1000);
  const claims: QMeetGuestAdmission = {
    version: 1,
    roomId: input.roomId,
    guestId: input.guestId,
    requestId: input.requestId,
    name: String(input.name || "ضيف").trim().slice(0, 80) || "ضيف",
    issuedAt,
    expiresAt: issuedAt + GUEST_TICKET_TTL_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = createHmac("sha256", signingKey()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyQMeetGuestTicket(
  token: unknown,
  expectedRoomId?: string,
  now = Date.now(),
): QMeetGuestAdmission | null {
  if (typeof token !== "string" || token.length > 4096) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;

  try {
    const expected = createHmac("sha256", signingKey()).update(payload).digest();
    const provided = Buffer.from(signature, "base64url");
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;

    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as QMeetGuestAdmission;
    const currentSeconds = Math.floor(now / 1000);
    if (
      claims?.version !== 1 ||
      !ROOM_ID_PATTERN.test(claims.roomId) ||
      !GUEST_ID_PATTERN.test(claims.guestId) ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(claims.requestId) ||
      typeof claims.name !== "string" ||
      claims.name.length > 80 ||
      !Number.isInteger(claims.issuedAt) ||
      !Number.isInteger(claims.expiresAt) ||
      claims.issuedAt > currentSeconds + 30 ||
      claims.expiresAt <= currentSeconds ||
      claims.expiresAt <= claims.issuedAt ||
      claims.expiresAt - claims.issuedAt > GUEST_TICKET_TTL_SECONDS ||
      (expectedRoomId && claims.roomId !== expectedRoomId)
    ) {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
}

export function isApprovedQMeetGuest(
  meeting: any,
  claims: QMeetGuestAdmission,
): boolean {
  if (
    !meeting ||
    String(meeting.roomName || "") !== claims.roomId ||
    meeting.status === "completed" ||
    meeting.status === "cancelled"
  ) {
    return false;
  }
  const isParticipant = (meeting.participantIds || []).some(
    (id: unknown) => String(id) === claims.guestId,
  );
  if (!isParticipant) return false;
  return (meeting.joinRequests || []).some((request: any) =>
    String(request._id || "") === claims.requestId &&
    String(request.userId || "") === claims.guestId &&
    request.status === "approved"
  );
}