export interface QMeetNativePublication {
  participantId: string;
  kind: string;
}

export const QMEET_SCREEN_PARTICIPANT_SUFFIX = ":qmeet-screen";

export function getQMeetParticipantOwnerId(participantId: string): string {
  return participantId.endsWith(QMEET_SCREEN_PARTICIPANT_SUFFIX)
    ? participantId.slice(0, -QMEET_SCREEN_PARTICIPANT_SUFFIX.length)
    : participantId;
}

export function isQMeetScreenParticipant(participantId: string): boolean {
  return getQMeetParticipantOwnerId(participantId) !== participantId;
}

/** Control roster refreshes must not discard a still-active media transport. */
export function getQMeetRosterStream(
  existing: MediaStream | null | undefined,
  participantId: string,
  nativeStreams: Map<string, MediaStream>,
): MediaStream | null {
  return existing
    || nativeStreams.get(participantId)
    || nativeStreams.get(getQMeetParticipantOwnerId(participantId))
    || null;
}

/** SFU MSID carries the signed identity; it does not depend on roster timing. */
export function getQMeetNativeTrackBinding(
  event: Pick<RTCTrackEvent, "track" | "streams">,
  publications: Map<string, QMeetNativePublication>,
  participants: Map<string, string>,
) {
  const participantId = event.streams[0]?.id || participants.get(event.track.id) || "";
  const exact = publications.get(event.track.id);
  const publicationId = exact?.participantId === participantId
    ? event.track.id
    : [...publications].reverse().find(([, metadata]) =>
        metadata.participantId === participantId && metadata.kind === event.track.kind
      )?.[0] || event.track.id;
  return { participantId, publicationId };
}

/** Wait for an application-level acknowledgement, not just a TCP/WebSocket open. */
export function waitForQMeetMessage(
  socket: WebSocket,
  accept: (message: any) => boolean,
  timeoutMs = 15000,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      socket.removeEventListener("message", onMessage);
      socket.removeEventListener("close", onClose);
      socket.removeEventListener("error", onError);
    };
    const fail = (error: Error) => { cleanup(); reject(error); };
    const onMessage = (event: MessageEvent) => {
      let message: any;
      try { message = JSON.parse(String(event.data)); } catch { return; }
      try {
        if (accept(message)) { cleanup(); resolve(message); }
      } catch (error) {
        fail(error instanceof Error ? error : new Error("Meeting admission failed"));
      }
    };
    const onClose = () => fail(new Error("انقطع اتصال الاجتماع قبل تأكيد الانضمام."));
    const onError = () => fail(new Error("تعذر الاتصال بخادم الاجتماع."));
    const timer = setTimeout(() => fail(new Error("لم يؤكد خادم الاجتماع الانضمام. أعد المحاولة.")), timeoutMs);
    socket.addEventListener("message", onMessage);
    socket.addEventListener("close", onClose);
    socket.addEventListener("error", onError);
  });
}