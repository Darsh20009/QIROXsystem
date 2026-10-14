export interface QMeetIOSBroadcastBridge {
  prepareBroadcast(options: {
    url: string;
    credential: string;
    roomId: string;
    participantId: string;
    iceServers: RTCIceServer[];
  }): Promise<void>;
  showBroadcastPicker(): Promise<void>;
  getBroadcastState(): Promise<{ state: string }>;
  requestStop(): Promise<void>;
}

let bridgePromise: Promise<QMeetIOSBroadcastBridge | null> | null = null;

export function isQMeetIOSApp(): boolean {
  const capacitor = (window as any).Capacitor;
  return Boolean(
    capacitor?.isNativePlatform?.()
      && capacitor?.getPlatform?.() === "ios",
  );
}

export async function getQMeetIOSBroadcastBridge(): Promise<QMeetIOSBroadcastBridge | null> {
  if (!bridgePromise) {
    bridgePromise = (async () => {
      const { Capacitor, registerPlugin } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") return null;
      return registerPlugin<QMeetIOSBroadcastBridge>("QMeetBroadcast");
    })().catch(error => {
      bridgePromise = null;
      throw error;
    });
  }
  return bridgePromise;
}