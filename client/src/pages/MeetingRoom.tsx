import { useState, useEffect, useRef, useCallback, type PointerEvent as ReactPointerEvent } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { FLAG_NATIVE_SFU } from "@/features/customer-journey/constants";
import { useFlag } from "@/features/customer-journey/hooks/use-feature-flags";
import {
  Mic, MicOff, Video, VideoOff, Monitor, PhoneOff,
  MessageSquare, Users, Copy, Check, Loader2, Send,
  Hand, Grid3X3, Maximize2, Smile, X, XCircle,
  Lock, LockOpen, UserX, VolumeX, BarChart2, Subtitles,
  CircleDot, Download, QrCode, Sparkles, FlipHorizontal2, Crown,
  Volume2, VolumeOff, AlertTriangle, Wifi, ShieldAlert, Camera,
  PenTool, Trash2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  getQMeetNativeTrackBinding,
  getQMeetParticipantOwnerId,
  getQMeetRosterStream,
  QMEET_SCREEN_PARTICIPANT_SUFFIX,
  isQMeetScreenParticipant,
  waitForQMeetMessage,
} from "@/lib/qmeet-signaling";
import { getQMeetIOSBroadcastBridge, isQMeetIOSApp } from "@/lib/qmeet-ios-broadcast";
import PresentationTools from "@/components/qmeet/PresentationTools";
import { createPresentation, createPresentationModel } from "@/lib/qmeet-presentation";
import { qmeetEmbedCommand } from "@/lib/qmeet-embed";

// ── helpers ──────────────────────────────────────────────────────────────────

function avatarColor(name: string) {
  const palette = ["#1d4ed8","#0891b2","#059669","#7c3aed","#dc2626","#d97706","#0284c7","#a855f7"];
  return palette[((name?.charCodeAt(0) || 65) + (name?.charCodeAt(1) || 65)) % palette.length];
}

function useElapsedTimer(active: boolean) {
  const [sec, setSec] = useState(0);
  const t0 = useRef(Date.now());
  useEffect(() => {
    if (!active) return;
    t0.current = Date.now();
    setSec(0);
    const id = setInterval(() => setSec(Math.floor((Date.now() - t0.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [active]);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
    : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

// Default ICE servers: STUN + free open TURN relays for NAT traversal
const STUN: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  // Free TURN relay servers (Open Relay Project) — fallback when STUN fails
  { urls: "turn:openrelay.metered.ca:80",   username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443",  username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turns:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
];
async function getIce(): Promise<RTCIceServer[]> {
  try {
    const r = await fetch("/api/ice-servers");
    if (r.ok) {
      const servers = await r.json();
      // Always include free TURN as last-resort fallback
      const hasTurn = servers.some((s: any) => String(s.urls).startsWith("turn:") || (Array.isArray(s.urls) && s.urls.some((u: string) => u.startsWith("turn:"))));
      if (!hasTurn) return [...servers, ...STUN.filter(s => String(s.urls).startsWith("turn:"))];
      return servers;
    }
  } catch {}
  return STUN;
}

function getQMeetGuestTicket(roomId: string): string {
  try {
    return sessionStorage.getItem(`qmeet_guest_ticket:${roomId}`) || "";
  } catch {
    return "";
  }
}

function getQMeetWebSocketProtocols(roomId: string): string[] {
  const protocols = ["qirox-auth"];
  try {
    const deviceToken = localStorage.getItem("qirox_device_token");
    if (deviceToken) protocols.push(deviceToken);
  } catch {}
  const guestTicket = getQMeetGuestTicket(roomId);
  if (guestTicket) protocols.push(`qmeet-guest.${guestTicket}`);
  return protocols;
}

function getStoredGuestValue(key: string, roomId: string): string {
  try {
    return sessionStorage.getItem(`${key}:${roomId}`) || sessionStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function getMergedNativePeerStream(ownerId: string, streams: Map<string, MediaStream>): MediaStream | null {
  const camera = streams.get(ownerId);
  const audio = camera?.getAudioTracks().find(track => track.readyState === "live");
  const video = camera?.getVideoTracks().find(track => track.readyState === "live");
  const tracks = [audio, video].filter((track): track is MediaStreamTrack => Boolean(track));
  return tracks.length ? new MediaStream(tracks) : null;
}

function getNativePeerScreenStream(ownerId: string, streams: Map<string, MediaStream>): MediaStream | null {
  const stream = streams.get(`${ownerId}${QMEET_SCREEN_PARTICIPANT_SUFFIX}`);
  const tracks = stream?.getVideoTracks().filter(track => track.readyState === "live") || [];
  return tracks.length ? new MediaStream(tracks) : null;
}

// ── types ────────────────────────────────────────────────────────────────────

interface PeerState {
  id: string;
  name: string;
  stream: MediaStream | null;
  screenStream?: MediaStream | null;
  audioOn: boolean;
  videoOn: boolean;
  screenSharing?: boolean;
  photoUrl?: string;
  raisedHand?: boolean;
  facingMode?: "user" | "environment";
  connectionState?: "connecting" | "connected" | "failed" | "disconnected";
}

interface ChatMsg {
  id: string;
  fromId: string;
  name: string;
  text: string;
  time: string;
  isSelf: boolean;
}

interface PollOption { text: string; votes: number }
interface MeetingPoll {
  id: string;
  question: string;
  options: PollOption[];
  hostId: string;
  totalVotes?: number;
}

interface CaptionEntry { id: string; name: string; text: string; isSelf: boolean }
interface AttendanceEntry { userId: string; name: string; action: "join" | "leave"; time: string }
interface FloatReaction { id: string; emoji: string; left: number }
interface WhiteboardPoint { x: number; y: number }
interface WhiteboardStroke { points: WhiteboardPoint[]; color: string; width: number }

// ── VideoTile ────────────────────────────────────────────────────────────────

function VideoTile({
  peer, isSelf, speaking, small, mirrored,
}: {
  peer: PeerState; isSelf: boolean; speaking: boolean; small?: boolean; mirrored?: boolean;
}) {
  const vidRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);

  useEffect(() => {
    const unlockAllRemoteAudio = () => {
      document.querySelectorAll<HTMLAudioElement>("audio[data-qmeet-remote-audio]").forEach(audio => {
        void audio.play().catch(() => {});
      });
    };
    window.addEventListener("pointerdown", unlockAllRemoteAudio, true);
    window.addEventListener("touchend", unlockAllRemoteAudio, true);
    return () => {
      window.removeEventListener("pointerdown", unlockAllRemoteAudio, true);
      window.removeEventListener("touchend", unlockAllRemoteAudio, true);
    };
  }, []);

  useEffect(() => {
    const el = vidRef.current;
    if (!el) return;
    const audioEl = audioRef.current;
    const onAudioPlaying = () => setAudioBlocked(false);
    audioEl?.addEventListener("playing", onAudioPlaying);
    const pipVideo = el as any;
    setPipSupported(
      typeof pipVideo.requestPictureInPicture === "function"
        || typeof pipVideo.webkitSetPresentationMode === "function",
    );
    if (peer.stream) {
      const videoStream = new MediaStream(peer.stream.getVideoTracks());
      const audioStream = new MediaStream(peer.stream.getAudioTracks());
      el.srcObject = videoStream;
      if (audioEl) {
        if (audioStream.getAudioTracks().length && !isSelf) {
          audioEl.srcObject = audioStream;
          audioEl.play().then(() => setAudioBlocked(false)).catch((err) => {
            if (err?.name === "NotAllowedError" || err?.name === "AbortError") setAudioBlocked(true);
          });
        } else {
          audioEl.srcObject = null;
          setAudioBlocked(false);
        }
      }
      el.play().catch((err) => {
        if (err?.name !== "NotAllowedError" && err?.name !== "AbortError") {
          console.warn("[QMeet] Remote video could not start", err);
        }
      });
    } else {
      el.srcObject = null;
      if (audioEl) audioEl.srcObject = null;
    }
    return () => audioEl?.removeEventListener("playing", onAudioPlaying);
  }, [peer.stream, peer.videoOn, isSelf]);

  const unlockAudio = (event?: { stopPropagation: () => void }) => {
    event?.stopPropagation();
    const el = audioRef.current;
    if (!el) return;
    el.play().then(() => setAudioBlocked(false)).catch(() => {});
  };

  const enterPictureInPicture = async (event: any) => {
    event.stopPropagation();
    const video = vidRef.current as any;
    try {
      if (typeof video?.requestPictureInPicture === "function") {
        await video.requestPictureInPicture();
      } else if (typeof video?.webkitSetPresentationMode === "function") {
        video.webkitSetPresentationMode("picture-in-picture");
      }
    } catch (error) {
      console.warn("[QMeet] Picture-in-Picture could not start", error);
    }
  };

  const showVideo = !!(peer.stream && peer.videoOn);
  const bg = avatarColor(peer.name);
  const label = isSelf ? "أنت" : peer.name;

  return (
    <div className={`relative w-full h-full bg-[#3c4043] rounded-xl overflow-hidden flex items-center justify-center
      ${speaking && peer.audioOn ? "ring-2 ring-black/15 dark:ring-white/15" : ""}`}>
      <video ref={vidRef} autoPlay playsInline muted
        className={showVideo ? `w-full h-full ${peer.screenSharing ? "object-contain" : "object-cover"}` : "hidden"}
        style={{ transform: (isSelf && !peer.screenSharing && mirrored !== false) ? "scaleX(-1)" : undefined }} />
      <audio ref={audioRef} autoPlay playsInline muted={isSelf} data-qmeet-remote-audio={!isSelf ? "" : undefined} className="hidden" />
      {!isSelf && showVideo && pipSupported && (
        <button
          type="button"
          onClick={enterPictureInPicture}
          className="absolute top-2 right-2 z-20 rounded-md bg-black/65 px-2 py-1 text-[10px] font-semibold text-white"
          aria-label="عرض فيديو المشارك في نافذة صورة داخل صورة"
          title="عرض الفيديو في صورة داخل صورة">
          PiP
        </button>
      )}
      {!showVideo && <>
            <div className="flex flex-col items-center gap-1">
              <div className="rounded-full flex items-center justify-center font-bold text-white"
                style={{ background: bg, width: small ? 44 : 80, height: small ? 44 : 80, fontSize: small ? 18 : 30 }}>
                {peer.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            </div>
          </>}
      {/* Connecting overlay — shown while WebRTC is establishing */}
      {!isSelf && !peer.stream && peer.connectionState !== "failed" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#3c4043]/80 gap-2 z-10">
          <Loader2 className="w-5 h-5 text-black/70 dark:text-white/70 animate-spin" />
          <span className="text-[#9aa0a6] text-xs">جارٍ الاتصال...</span>
        </div>
      )}
      {/* Failed connection overlay */}
      {!isSelf && peer.connectionState === "failed" && !peer.stream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black dark:bg-white gap-2 z-10">
          <Wifi className="w-5 h-5 text-black/70 dark:text-white/70" />
          <span className="text-black/70 dark:text-white/70 text-xs">فشل الاتصال</span>
        </div>
      )}
      {/* Audio unlock overlay — appears when browser blocks autoplay */}
      {audioBlocked && !isSelf && (
        <button
          onClick={unlockAudio}
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-2 z-10 cursor-pointer"
          title="اضغط لتفعيل الصوت">
          <VolumeOff className="w-6 h-6 text-black/70 dark:text-white/70" />
          <span className="text-black/70 dark:text-white/70 text-xs font-medium">اضغط لتشغيل الصوت</span>
        </button>
      )}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/70 to-transparent flex items-center gap-1">
        {!peer.audioOn && <MicOff className={`${small ? "w-3 h-3" : "w-3.5 h-3.5"} text-black/70 dark:text-white/70 shrink-0`} />}
        {peer.raisedHand && <span className={small ? "text-xs" : "text-sm"}>✋</span>}
        {speaking && peer.audioOn && <span className="w-1.5 h-1.5 rounded-full bg-black/[0.08] dark:bg-white/[0.1] animate-pulse shrink-0" />}
        <span className={`text-white font-medium truncate ${small ? "text-[10px]" : "text-xs"}`}>{label}</span>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function MeetingRoom() {
  const { dir } = useI18n();
  const { roomId } = useParams<{ roomId: string }>();
  const [, navigate] = useLocation();
  const { data: user } = useUser();
  const { toast } = useToast();

  // identity
  const userId = String((user as any)?._id || (user as any)?.id || "");
  const defaultName = (user as any)?.fullName || (user as any)?.username || "";
  const [guestName, setGuestName] = useState(() => getStoredGuestValue("qmeet_guest_name", roomId || ""));
  const userName = defaultName || guestName || "مشارك";
  const isHost = !!(user && userId);

  // meeting data
  const {
    data: meeting,
    isLoading: meetingLoading,
    isError: meetingIsError,
    error: meetingError,
    refetch: refetchMeeting,
  } = useQuery<any>({
    queryKey: ["/api/qmeet/room", roomId],
    queryFn: async () => {
      const res = await fetch(`/api/qmeet/room/${roomId}`, { credentials: "include" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "تعذر العثور على الاجتماع");
      return body;
    },
    enabled: !!roomId,
    retry: 2,
  });

  // ── core state ─────────────────────────────────────────────────────────────
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const joinInFlightRef = useRef(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, PeerState>>(new Map());
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [nativeScreenShareState, setNativeScreenShareState] = useState("idle");
  const [launchedForNativeScreenShare] = useState(
    () => new URLSearchParams(window.location.search).get("screenShare") === "1",
  );
  const [raisedHand, setRaisedHand] = useState(false);

  // ui state
  const [panel, setPanel] = useState<"none" | "chat" | "participants" | "attendance" | "ai">("none");
  const [unread, setUnread] = useState(0);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [layout, setLayout] = useState<"grid" | "spotlight">("grid");
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [speakingIds, setSpeakingIds] = useState<Set<string>>(new Set());
  const [lobbyWaiting, setLobbyWaiting] = useState(false);
  const [lobbyRequests, setLobbyRequests] = useState<any[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [transportError, setTransportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [floatReactions, setFloatReactions] = useState<FloatReaction[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);
  const [whiteboardStrokes, setWhiteboardStrokes] = useState<WhiteboardStroke[]>([]);
  const [whiteboardColor, setWhiteboardColor] = useState("#111827");
  const [whiteboardWidth, setWhiteboardWidth] = useState(3);
  const nativeSfuEnabled = useFlag(FLAG_NATIVE_SFU);

  // ── Advanced features state ───────────────────────────────────────────────
  const [isRoomHost, setIsRoomHost] = useState(false);
  const [meetingLocked, setMeetingLocked] = useState(false);
  // Polls
  const [activePoll, setActivePoll] = useState<MeetingPoll | null>(null);
  const [myPollVote, setMyPollVote] = useState<number | null>(null);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  // Captions
  const [captionsOn, setCaptionsOn] = useState(false);
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);
  // Recording
  const [recording, setRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  // QR
  const [showQR, setShowQR] = useState(false);
  // Attendance
  const [attendanceLog, setAttendanceLog] = useState<AttendanceEntry[]>([]);
  // AI
  const [aiSummary, setAiSummary] = useState("");
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

  const timer = useElapsedTimer(joined);

  useEffect(() => {
    if (!joined || !isQMeetIOSApp()) return;
    let disposed = false;
    let lastState = "";
    const syncBroadcastState = async () => {
      try {
        const bridge = await getQMeetIOSBroadcastBridge();
        if (!bridge || disposed) return;
        const { state } = await bridge.getBroadcastState();
        if (disposed || state === lastState) return;
        const wasBroadcasting = lastState === "broadcasting";
        lastState = state;
        setNativeScreenShareState(state || "idle");
        const controlSocket = wsRef.current;
        const announceShareState = (active: boolean) => {
          if (controlSocket?.readyState === WebSocket.OPEN) {
            controlSocket.send(JSON.stringify({
              type: "webrtc_screen_share",
              roomId,
              active,
              name: userName,
            }));
          }
        };
        if (state === "broadcasting") {
          setScreenSharing(true);
          announceShareState(true);
        } else if (state === "idle" || state === "error") {
          setScreenSharing(false);
          setPresentationStream(null);
          setPresentationToolsOpen(false);
          setPinnedId(current => current?.endsWith(":screen") ? null : current);
          if (wasBroadcasting) announceShareState(false);
        }
      } catch (error) {
        console.warn("[QMeet] Could not read ReplayKit broadcast state", error);
      }
    };
    void syncBroadcastState();
    const timerId = window.setInterval(() => void syncBroadcastState(), 1200);
    return () => {
      disposed = true;
      window.clearInterval(timerId);
    };
  }, [joined, roomId, userName]);

  useEffect(() => {
    if (joined && launchedForNativeScreenShare) {
      toast({
        title: "تم فتح الاجتماع في تطبيق QIROX",
        description: "اضغط زر مشاركة الشاشة ثم اختر QIROX Broadcast من نافذة iOS.",
      });
    }
  }, [joined, launchedForNativeScreenShare, toast]);

  // ── refs ───────────────────────────────────────────────────────────────────
  const myIdRef = useRef<string>("");          // effective user ID (logged-in or guest-xxx)
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const presentationRef = useRef<Awaited<ReturnType<typeof createPresentation>> | null>(null);
  const sharingBusyRef = useRef(false);
  const [presentationStream, setPresentationStream] = useState<MediaStream | null>(null);
  const [presentationToolsOpen, setPresentationToolsOpen] = useState(false);
  const presentationModelRef = useRef(createPresentationModel());
  const presentationV2 = useFlag("FEATURE_QMEET_PRESENTATION_V2");
  useEffect(() => () => {
    presentationRef.current?.stop();
    cameraStreamRef.current?.getTracks().forEach(track => track.stop());
  }, []);
  useEffect(() => () => {
    if (isQMeetIOSApp()) {
      void getQMeetIOSBroadcastBridge()
        .then(bridge => bridge?.requestStop())
        .catch(() => {});
    }
  }, []);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingIce = useRef<Map<string, RTCIceCandidate[]>>(new Map());
  const iceServersRef = useRef<RTCIceServer[]>(STUN);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const analyserRef = useRef<Map<string, { analyser: AnalyserNode; source: MediaStreamAudioSourceNode }>>(new Map());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const peerNamesRef = useRef<Map<string, string>>(new Map()); // id → name
  const audioOnRef = useRef(true);
  const videoOnRef = useRef(true);
  const isRoomHostRef = useRef(false);
  // Camera
  const facingModeRef = useRef<"user" | "environment">("user");
  const [flippingCamera, setFlippingCamera] = useState(false);

  // ── LiveKit SFU (scales to 100+ participants) ─────────────────────────────
  const lkRoomRef       = useRef<any>(null);
  const livekitModeRef  = useRef(false);
  const [livekitMode, setLivekitMode] = useState(false);
  const nativeSfuWsRef = useRef<WebSocket | null>(null);
  const nativeSfuPcRef = useRef<RTCPeerConnection | null>(null);
  const nativeSfuModeRef = useRef(false);
  const [nativeSfuMode, setNativeSfuMode] = useState(false);
  const nativeSfuGenerationRef = useRef(0);
  const nativeSfuReadyRef = useRef(false);
  const nativeSfuRemoteNegotiatedRef = useRef(false);
  const nativeSfuPendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const nativeSfuLocalPendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const nativeSfuTrackParticipantsRef = useRef<Map<string, string>>(new Map());
  const nativeSfuPublishedTracksRef = useRef<Map<string, { participantId: string; kind: string }>>(new Map());
  const nativeSfuTrackObjectsRef = useRef<Map<string, MediaStreamTrack>>(new Map());
  const nativeSfuPendingTracksRef = useRef<Map<string, MediaStreamTrack>>(new Map());
  const nativeSfuStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const nativeSfuReconnectTimerRef = useRef<number | null>(null);
  const nativeSfuRestartAttemptsRef = useRef(0);
  const nativeSfuNegotiationRef = useRef<Promise<void>>(Promise.resolve());
  const [mediaCapabilities, setMediaCapabilities] = useState<{
    mode: "sfu" | "native-sfu" | "limited-p2p";
    enabled: boolean;
    maxParticipants: number;
    reason?: string | null;
    nativeSfu?: { enabled: boolean; configured: boolean; maxParticipants: number };
  } | null>(null);

  // Recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const keepaliveRef = useRef<number | null>(null);
  const joinedRef = useRef(false);
  const leavingRef = useRef(false);
  // Captions
  const speechRef = useRef<any>(null);
  const captionsEndRef = useRef<HTMLDivElement>(null);
  const whiteboardCanvasRef = useRef<HTMLCanvasElement>(null);
  const whiteboardDrawingRef = useRef<WhiteboardStroke | null>(null);
  // Chat/captions for AI summary
  const captionsLogRef = useRef<CaptionEntry[]>([]);

  // Keep refs in sync with state
  useEffect(() => { audioOnRef.current = audioOn; }, [audioOn]);
  useEffect(() => { videoOnRef.current = videoOn; }, [videoOn]);
  const panelRef = useRef<typeof panel>("none");
  useEffect(() => { panelRef.current = panel; }, [panel]);

  // resize
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  useEffect(() => {
    fetch("/api/qmeet/media-capabilities", { credentials: "include", cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (data) setMediaCapabilities(data); })
      .catch(() => {});
  }, []);

  // Auto-request media on pre-join screen
  useEffect(() => {
    if (!joined) {
      getMedia().catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  // ── media helpers ──────────────────────────────────────────────────────────

  const getMedia = useCallback(async (video = true, audio = true): Promise<MediaStream | null> => {
    // Check HTTPS (required for getUserMedia in Chrome/Firefox)
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      setMediaError("يجب فتح الاجتماع عبر HTTPS لاستخدام الكاميرا/الميك");
      return null;
    }
    // Check API availability
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError("متصفحك لا يدعم الكاميرا/الميك — استخدم Chrome أو Firefox أو Safari");
      return null;
    }
    // Try with video + audio
    if (video) {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
            channelCount: 1,
            latency: { ideal: 0.01 },
          },
        });
        localStreamRef.current = s; setLocalStream(s); setMediaError(null);
        return s;
      } catch {
        // Try with simpler constraints
        try {
          const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          localStreamRef.current = s; setLocalStream(s); setMediaError(null);
          return s;
        } catch {}
      }
    }
    // Fallback: audio only
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      localStreamRef.current = s; setLocalStream(s);
      setVideoOn(false); videoOnRef.current = false;
      setMediaError("الكاميرا غير متاحة — انضممت بالصوت فقط");
      return s;
    } catch (e: any) {
      const name = e?.name || "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        const browser = /Firefox/.test(navigator.userAgent) ? "Firefox: افتح القائمة > الخصوصية > الأذونات"
          : /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) ? "Safari: افتح الإعدادات > Safari > الكاميرا والميكروفون"
          : "Chrome/Edge: اضغط أيقونة القفل أو الكاميرا في شريط العنوان وامنح الإذن";
        setMediaError(`رُفض الإذن — ${browser}`);
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        setMediaError("الكاميرا/الميك مستخدمة في تطبيق آخر — أغلقها وحاول مجدداً");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setMediaError("لا توجد كاميرا أو ميكروفون متصلة بجهازك");
      } else if (name === "OverconstrainedError") {
        setMediaError("الكاميرا المتصلة لا تدعم الدقة المطلوبة");
      } else {
        setMediaError("تعذّر الوصول للكاميرا/الميك. تأكد من منح الإذن.");
      }
      return null;
    }
  }, []);

  // ── WebRTC helpers ─────────────────────────────────────────────────────────

  const sendWs = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = (msg as any).type === "webrtc_media_state" && presentationRef.current
        ? { ...msg, video: true } : msg;
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const drawWhiteboardStroke = useCallback((stroke: WhiteboardStroke, canvas = whiteboardCanvasRef.current) => {
    if (!canvas || stroke.points.length < 1) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    stroke.points.forEach((point, index) => {
      const x = point.x * rect.width;
      const y = point.y * rect.height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    if (stroke.points.length === 1) {
      const point = stroke.points[0];
      ctx.arc(point.x * rect.width, point.y * rect.height, Math.max(1, stroke.width / 2), 0, Math.PI * 2);
      ctx.fillStyle = stroke.color;
      ctx.fill();
    } else {
      ctx.stroke();
    }
    ctx.restore();
  }, []);

  useEffect(() => {
    if (!whiteboardOpen) return;
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      whiteboardStrokes.forEach(stroke => drawWhiteboardStroke(stroke, canvas));
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [whiteboardOpen, whiteboardStrokes, drawWhiteboardStroke]);

  const getWhiteboardPoint = useCallback((event: ReactPointerEvent<HTMLCanvasElement>): WhiteboardPoint | null => {
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    };
  }, []);

  const startWhiteboardStroke = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0 && event.pointerType !== "touch") return;
    const point = getWhiteboardPoint(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    whiteboardDrawingRef.current = { points: [point], color: whiteboardColor, width: whiteboardWidth };
    drawWhiteboardStroke(whiteboardDrawingRef.current);
  }, [drawWhiteboardStroke, getWhiteboardPoint, whiteboardColor, whiteboardWidth]);

  const moveWhiteboardStroke = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const drawing = whiteboardDrawingRef.current;
    if (!drawing) return;
    const point = getWhiteboardPoint(event);
    if (!point) return;
    const previous = drawing.points[drawing.points.length - 1];
    drawing.points.push(point);
    const canvas = whiteboardCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    const rect = canvas?.getBoundingClientRect();
    if (!ctx || !rect || !previous) return;
    ctx.save();
    ctx.strokeStyle = drawing.color;
    ctx.lineWidth = drawing.width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(previous.x * rect.width, previous.y * rect.height);
    ctx.lineTo(point.x * rect.width, point.y * rect.height);
    ctx.stroke();
    ctx.restore();
  }, [getWhiteboardPoint]);

  const finishWhiteboardStroke = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const drawing = whiteboardDrawingRef.current;
    if (!drawing) return;
    whiteboardDrawingRef.current = null;
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch {}
    if (drawing.points.length === 0) return;
    setWhiteboardStrokes(prev => [...prev, drawing].slice(-2000));
    sendWs({ type: "webrtc_draw", roomId, stroke: drawing });
  }, [roomId, sendWs]);

  const clearWhiteboard = useCallback(() => {
    setWhiteboardStrokes([]);
    sendWs({ type: "webrtc_whiteboard_clear", roomId });
  }, [roomId, sendWs]);

  const closePeerConnection = useCallback((pc: RTCPeerConnection | undefined) => {
    if (!pc) return;
    pc.ontrack = null;
    pc.onicecandidate = null;
    pc.onconnectionstatechange = null;
    pc.onsignalingstatechange = null;
    pc.onicegatheringstatechange = null;
    try { pc.close(); } catch {}
  }, []);

  // ── LiveKit: rebuild peers Map from room participants ─────────────────────
  const updateLKPeers = useCallback((room: any) => {
    setPeers(prev => {
      const next = new Map<string, PeerState>(prev);
      const seen = new Set<string>();

      for (const participant of (room.remoteParticipants as Map<string, any>).values()) {
        const id: string = participant.identity;
        seen.add(id);

        // LiveKit exposes publications as a Map. Iterating the Map directly
        // returns [sid, publication] tuples, which used to make every remote
        // track disappear from the rendered MediaStream.
        const publications = participant.trackPublications instanceof Map
          ? [...participant.trackPublications.values()]
          : (typeof participant.getTrackPublications === "function"
            ? Array.from(participant.getTrackPublications() || [])
            : []);
        const mediaTracks: MediaStreamTrack[] = [];
        let cameraTrack: MediaStreamTrack | null = null;
        let screenTrack: MediaStreamTrack | null = null;
        let microphoneTrack: MediaStreamTrack | null = null;
        for (const pub of publications as any[]) {
          const mst = pub.track?.mediaStreamTrack;
          if (!mst) continue;
          const src: string = pub.source || "";
          if (mst.kind === "audio" && (src === "microphone" || src === "unknown" || !src)) microphoneTrack = mst;
          if (mst.kind === "video" && src === "screen_share") screenTrack = mst;
          else if (mst.kind === "video" && (src === "camera" || src === "unknown" || !src)) cameraTrack = mst;
        }

        if (microphoneTrack) mediaTracks.push(microphoneTrack);
        if (cameraTrack) mediaTracks.push(cameraTrack);
        const stream      = mediaTracks.length > 0 ? new MediaStream(mediaTracks) : null;
        const screenStream = screenTrack ? new MediaStream([screenTrack]) : null;
        const microphonePublication = publications.find((pub: any) =>
          pub.source === "microphone" || pub.track?.kind === "audio"
        );
        const existing    = next.get(id);
        next.set(id, {
          id, stream,
          name:            participant.name || id,
          audioOn:         microphonePublication ? !microphonePublication.isMuted : Boolean(microphoneTrack),
          videoOn:         Boolean(cameraTrack),
          screenStream,
          screenSharing:   Boolean(screenStream),
          connectionState: "connected",
          raisedHand:      existing?.raisedHand,
          photoUrl:        existing?.photoUrl,
        });
      }

      // Remove participants who left
      for (const [id] of next) { if (!seen.has(id)) next.delete(id); }
      return next;
    });
  }, []);

  const sendNativeSfu = useCallback((message: object) => {
    const socket = nativeSfuWsRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ v: 1, ...message }));
    }
  }, []);

  const closeNativeSfu = useCallback((resetMode = true) => {
    if (nativeSfuReconnectTimerRef.current) {
      window.clearTimeout(nativeSfuReconnectTimerRef.current);
      nativeSfuReconnectTimerRef.current = null;
    }
    nativeSfuGenerationRef.current++;
    nativeSfuReadyRef.current = false;
    nativeSfuRemoteNegotiatedRef.current = false;
    nativeSfuPendingIceRef.current = [];
    nativeSfuLocalPendingIceRef.current = [];
    nativeSfuTrackParticipantsRef.current.clear();
    nativeSfuPublishedTracksRef.current.clear();
    nativeSfuTrackObjectsRef.current.clear();
    nativeSfuPendingTracksRef.current.clear();
    nativeSfuStreamsRef.current.clear();

    const socket = nativeSfuWsRef.current;
    nativeSfuWsRef.current = null;
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      try { socket.close(); } catch {}
    }

    const pc = nativeSfuPcRef.current;
    nativeSfuPcRef.current = null;
    if (pc) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.oniceconnectionstatechange = null;
      try { pc.close(); } catch {}
    }
    if (resetMode) {
      nativeSfuModeRef.current = false;
      setNativeSfuMode(false);
    }
    setPeers(prev => {
      const next = new Map(prev);
      for (const [id, peer] of next) {
        next.set(id, { ...peer, stream: null, connectionState: "connecting" });
      }
      return next;
    });
  }, []);

  const setNativePeerPlaceholder = useCallback((participantId: string, name?: string) => {
    if (!participantId) return;
    const ownerId = getQMeetParticipantOwnerId(participantId);
    const isScreen = isQMeetScreenParticipant(participantId);
    if (ownerId === myIdRef.current) return;
    setPeers(prev => {
      const next = new Map(prev);
      const existing = next.get(ownerId);
      const stream = getMergedNativePeerStream(ownerId, nativeSfuStreamsRef.current)
        || getQMeetRosterStream(existing?.stream, ownerId, nativeSfuStreamsRef.current);
      const screenStream = getNativePeerScreenStream(ownerId, nativeSfuStreamsRef.current);
      next.set(ownerId, {
        id: ownerId,
        name: name || existing?.name || peerNamesRef.current.get(ownerId) || ownerId,
        stream,
        screenStream,
        audioOn: existing?.audioOn ?? true,
        videoOn: isScreen
          ? Boolean(stream?.getVideoTracks().some(track => track.readyState === "live"))
          : (existing?.videoOn ?? true),
        screenSharing: isScreen || Boolean(screenStream),
        photoUrl: existing?.photoUrl,
        facingMode: existing?.facingMode,
        connectionState: stream?.getTracks().some(track => track.readyState === "live") ? "connected" : "connecting",
        raisedHand: existing?.raisedHand,
      });
      return next;
    });
  }, []);

  const attachNativeTrack = useCallback((trackId: string, participantId: string, track?: MediaStreamTrack) => {
    if (!participantId) return;
    const ownerId = getQMeetParticipantOwnerId(participantId);
    const isScreen = isQMeetScreenParticipant(participantId);
    if (track) {
      nativeSfuTrackObjectsRef.current.set(trackId, track);
      nativeSfuTrackParticipantsRef.current.set(track.id, participantId);
    }
    if (track) nativeSfuPendingTracksRef.current.delete(track.id);
    const current = nativeSfuStreamsRef.current.get(participantId)
      || new MediaStream();
    const actualTrack = track || [...current.getTracks()].find(item => item.id === trackId);
    if (actualTrack && !current.getTracks().some(item => item.id === actualTrack.id)) {
      current.addTrack(actualTrack);
    }
    nativeSfuStreamsRef.current.set(participantId, current);
    if (ownerId === myIdRef.current && isScreen) {
      if (!cameraStreamRef.current) {
        cameraStreamRef.current = new MediaStream(localStreamRef.current?.getVideoTracks() || []);
      }
      setPresentationStream(new MediaStream(current.getTracks()));
      setPresentationToolsOpen(false);
      setScreenSharing(true);
      setPinnedId(`${ownerId}:screen`);
      return;
    }
    if (ownerId === myIdRef.current) return;
    setNativePeerPlaceholder(participantId);
    setPeers(prev => {
      const next = new Map(prev);
      const existing = next.get(ownerId);
      const mergedStream = getMergedNativePeerStream(ownerId, nativeSfuStreamsRef.current);
      const screenStream = getNativePeerScreenStream(ownerId, nativeSfuStreamsRef.current);
      next.set(ownerId, {
        id: ownerId,
        name: existing?.name || peerNamesRef.current.get(ownerId) || ownerId,
        stream: mergedStream,
        screenStream,
        audioOn: existing?.audioOn ?? true,
        videoOn: Boolean(nativeSfuStreamsRef.current.get(ownerId)?.getVideoTracks().length),
        screenSharing: Boolean(screenStream),
        photoUrl: existing?.photoUrl,
        facingMode: existing?.facingMode,
        connectionState: "connected",
        raisedHand: existing?.raisedHand,
      });
      return next;
    });
  }, [setNativePeerPlaceholder]);

  const removeNativeTrack = useCallback((trackId: string, participantId?: string) => {
    const owner = participantId || nativeSfuTrackParticipantsRef.current.get(trackId);
    if (!owner) return;
    const stream = nativeSfuStreamsRef.current.get(owner);
    if (!stream) return;
    const track = nativeSfuTrackObjectsRef.current.get(trackId)
      || stream.getTracks().find(item => item.id === trackId);
    if (track) stream.removeTrack(track);
    if (track) nativeSfuTrackParticipantsRef.current.delete(track.id);
    for (const [id, object] of nativeSfuTrackObjectsRef.current) {
      if (object === track && nativeSfuTrackParticipantsRef.current.get(id) === owner) {
        nativeSfuTrackObjectsRef.current.delete(id);
        nativeSfuTrackParticipantsRef.current.delete(id);
      }
    }
    nativeSfuPublishedTracksRef.current.delete(trackId);
    if (stream.getTracks().length === 0) nativeSfuStreamsRef.current.delete(owner);
    const ownerId = getQMeetParticipantOwnerId(owner);
    const isScreen = isQMeetScreenParticipant(owner);
    if (ownerId === myIdRef.current && isScreen) {
      if (!nativeSfuStreamsRef.current.has(owner)) {
        setPresentationStream(null);
        setPresentationToolsOpen(false);
        setScreenSharing(false);
        setPinnedId(current => current === `${ownerId}:screen` ? null : current);
      } else {
        setPresentationStream(new MediaStream(nativeSfuStreamsRef.current.get(owner)!.getTracks()));
      }
      return;
    }
    setPeers(prev => {
      const next = new Map(prev);
      const existing = next.get(ownerId);
      if (!existing) return next;
      const mergedStream = getMergedNativePeerStream(ownerId, nativeSfuStreamsRef.current);
      const screenStream = nativeSfuStreamsRef.current.get(`${ownerId}${QMEET_SCREEN_PARTICIPANT_SUFFIX}`);
      next.set(ownerId, {
        ...existing,
        stream: mergedStream,
        screenStream: getNativePeerScreenStream(ownerId, nativeSfuStreamsRef.current),
        videoOn: Boolean(nativeSfuStreamsRef.current.get(ownerId)?.getVideoTracks().length),
        screenSharing: Boolean(screenStream?.getVideoTracks().length),
        connectionState: mergedStream ? "connected" : "connecting",
      });
      return next;
    });
  }, []);

  const flushNativeIce = useCallback(async (pc: RTCPeerConnection) => {
    if (!pc.remoteDescription) return;
    const pending = nativeSfuPendingIceRef.current.splice(0);
    for (const candidate of pending) {
      await pc.addIceCandidate(candidate).catch(() => {});
    }
  }, []);

  const flushNativeLocalIce = useCallback(() => {
    if (!nativeSfuRemoteNegotiatedRef.current) return;
    const pending = nativeSfuLocalPendingIceRef.current.splice(0);
    for (const candidate of pending) sendNativeSfu({ type: "media.ice", candidate });
  }, [sendNativeSfu]);

  const queueNativeNegotiation = useCallback((operation: () => Promise<void>) => {
    const next = nativeSfuNegotiationRef.current.then(operation, operation);
    nativeSfuNegotiationRef.current = next.catch(() => {});
    return next;
  }, []);

  const createNativeOffer = useCallback(async () => {
    const pc = nativeSfuPcRef.current;
    if (!pc || !nativeSfuReadyRef.current || pc.signalingState !== "stable") return;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    if (pc.localDescription?.sdp) {
      sendNativeSfu({
        type: "media.offer",
        sdpType: "offer",
        sdp: pc.localDescription.sdp,
      });
    }
  }, [sendNativeSfu]);

  const startNativeSfu = useCallback(async (stream: MediaStream) => {
    const guestTicket = getQMeetGuestTicket(roomId || "");
    const response = await fetch(`/api/qmeet/native-media/${encodeURIComponent(roomId || "")}`, {
      credentials: "include",
      cache: "no-store",
      headers: guestTicket ? { "x-qmeet-guest-ticket": guestTicket } : {},
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.enabled || !data.url || !data.credential) {
      throw new Error(data.error || "Native SFU is unavailable");
    }
    if (data.participantId) myIdRef.current = String(data.participantId);

    closeNativeSfu(false);
    const generation = nativeSfuGenerationRef.current;
    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current,
      iceCandidatePoolSize: 10,
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
    });
    nativeSfuPcRef.current = pc;
    nativeSfuRestartAttemptsRef.current = 0;
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = ({ candidate }) => {
      if (generation !== nativeSfuGenerationRef.current || !candidate) return;
      const serialized = candidate.toJSON();
      if (nativeSfuRemoteNegotiatedRef.current) {
        sendNativeSfu({ type: "media.ice", candidate: serialized });
      } else {
        nativeSfuLocalPendingIceRef.current.push(serialized);
      }
    };
    pc.ontrack = event => {
      if (generation !== nativeSfuGenerationRef.current) return;
      const track = event.track;
      // The SFU sets MSID to the signed participant identity. Media can arrive
      // before the control roster, and a browser receiver ID may differ from
      // the SFU publication ID; neither is a reason to discard a live track.
      const { participantId, publicationId } = getQMeetNativeTrackBinding(
        event, nativeSfuPublishedTracksRef.current, nativeSfuTrackParticipantsRef.current,
      );
      if (participantId) {
        attachNativeTrack(publicationId, participantId, track);
      } else {
        nativeSfuPendingTracksRef.current.set(track.id, track);
      }
    };
    pc.onconnectionstatechange = () => {
      if (generation !== nativeSfuGenerationRef.current) return;
      if (pc.connectionState === "connected") {
        nativeSfuRestartAttemptsRef.current = 0;
        setTransportError(null);
      } else if (pc.connectionState === "failed") {
        if (nativeSfuRestartAttemptsRef.current < 3) {
          nativeSfuRestartAttemptsRef.current++;
          sendNativeSfu({ type: "media.restart" });
        }
      }
    };
    pc.oniceconnectionstatechange = () => {
      if (generation !== nativeSfuGenerationRef.current) return;
      if (pc.iceConnectionState === "failed" && nativeSfuRestartAttemptsRef.current < 3) {
        nativeSfuRestartAttemptsRef.current++;
        sendNativeSfu({ type: "media.restart" });
      }
    };

    const socket = new WebSocket(data.url);
    nativeSfuWsRef.current = socket;
    const ready = waitForQMeetMessage(socket, message => {
      if (message.type === "media.error") throw new Error(message.error || "تعذر اعتماد اتصال الوسائط.");
      return message.type === "media.ready";
    });
    const reconnect = () => {
      if (generation !== nativeSfuGenerationRef.current || leavingRef.current || !nativeSfuModeRef.current) return;
      setTransportError("انقطع اتصال الوسائط — جارٍ استعادته...");
      if (nativeSfuReconnectTimerRef.current) window.clearTimeout(nativeSfuReconnectTimerRef.current);
      nativeSfuReconnectTimerRef.current = window.setTimeout(() => {
        nativeSfuReconnectTimerRef.current = null;
        const currentStream = localStreamRef.current;
        if (currentStream && !leavingRef.current) {
          startNativeSfu(currentStream).catch(() => {
            setTransportError("تعذر استعادة اتصال الوسائط.");
          });
        }
      }, 1500);
    };
    socket.onopen = () => {
      if (generation !== nativeSfuGenerationRef.current) return;
      socket.send(JSON.stringify({ v: 1, type: "media.hello", credential: data.credential }));
    };
    socket.onmessage = event => {
      if (generation !== nativeSfuGenerationRef.current) return;
      let message: any;
      try { message = JSON.parse(event.data); } catch { return; }
      if (message.type === "media.ready") {
        nativeSfuReadyRef.current = true;
        queueNativeNegotiation(createNativeOffer).catch(() => {});
        return;
      }
      if (message.type === "media.answer") {
        queueNativeNegotiation(async () => {
          const currentPc = nativeSfuPcRef.current;
          if (!currentPc || message.sdpType !== "answer") return;
          await currentPc.setRemoteDescription({ type: "answer", sdp: message.sdp });
          nativeSfuRemoteNegotiatedRef.current = true;
          await flushNativeIce(currentPc);
          flushNativeLocalIce();
        }).catch(() => {});
        return;
      }
      if (message.type === "media.offer") {
        queueNativeNegotiation(async () => {
          const currentPc = nativeSfuPcRef.current;
          if (!currentPc || message.sdpType !== "offer") return;
          if (currentPc.signalingState === "have-local-offer") {
            await currentPc.setLocalDescription({ type: "rollback" });
          }
          await currentPc.setRemoteDescription({ type: "offer", sdp: message.sdp });
          await flushNativeIce(currentPc);
          const answer = await currentPc.createAnswer();
          await currentPc.setLocalDescription(answer);
          if (currentPc.localDescription?.sdp) {
            sendNativeSfu({
              type: "media.answer",
              sdpType: "answer",
              sdp: currentPc.localDescription.sdp,
            });
            nativeSfuRemoteNegotiatedRef.current = true;
            flushNativeLocalIce();
          }
        }).catch(() => {});
        return;
      }
      if (message.type === "media.ice" && message.candidate?.candidate) {
        const candidate = message.candidate as RTCIceCandidateInit;
        const currentPc = nativeSfuPcRef.current;
        if (currentPc?.remoteDescription) {
          currentPc.addIceCandidate(candidate).catch(() => {});
        } else {
          nativeSfuPendingIceRef.current.push(candidate);
        }
        return;
      }
      if (message.type === "media.track-published") {
        const trackId = String(message.trackId || "");
        const participantId = String(message.participantId || "");
        if (!trackId || !participantId) return;
        nativeSfuTrackParticipantsRef.current.set(trackId, participantId);
        nativeSfuPublishedTracksRef.current.set(trackId, { participantId, kind: String(message.kind || "") });
        setNativePeerPlaceholder(participantId);
        const pending = nativeSfuPendingTracksRef.current.get(trackId)
          || nativeSfuStreamsRef.current.get(participantId)?.getTracks().find(track => track.kind === message.kind);
        if (pending) attachNativeTrack(trackId, participantId, pending);
        return;
      }
      if (message.type === "media.track-removed") {
        const trackId = String(message.trackId || "");
        removeNativeTrack(trackId, String(message.participantId || ""));
        nativeSfuTrackParticipantsRef.current.delete(trackId);
        return;
      }
      if (message.type === "media.error") {
        console.error("[QMeet] Native SFU:", message.error || "media error");
        setTransportError(message.error || "Native SFU media error");
      }
    };
    socket.onerror = () => {};
    socket.onclose = reconnect;
    await ready;
    if (generation !== nativeSfuGenerationRef.current) throw new Error("انتهت محاولة الاتصال السابقة.");
    nativeSfuModeRef.current = true;
    setNativeSfuMode(true);
  }, [
    roomId, closeNativeSfu, sendNativeSfu, attachNativeTrack,
    setNativePeerPlaceholder, removeNativeTrack, flushNativeIce,
    flushNativeLocalIce, queueNativeNegotiation, createNativeOffer,
  ]);

  const addStreamToPc = (pc: RTCPeerConnection, stream: MediaStream) => {
    stream.getTracks().forEach(track => {
      const existing = pc.getSenders().find(s => s.track?.kind === track.kind);
      if (existing) existing.replaceTrack(track).catch(() => {});
      else pc.addTrack(track, stream);
    });
  };

  const createPc = useCallback(async (peerId: string, isInitiator: boolean): Promise<RTCPeerConnection> => {
    // ── Safely discard the old connection ──────────────────────────────────────
    // Null out ALL event handlers BEFORE close() so that the old PC's events
    // never fire after it has been replaced (the "zombie PC" race condition).
    const old = pcsRef.current.get(peerId);
    if (old) {
      old.ontrack = null;
      old.onicecandidate = null;
      old.onconnectionstatechange = null;
      old.onsignalingstatechange = null;
      old.onicegatheringstatechange = null;
      try { old.close(); } catch {}
    }

    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current,
      iceCandidatePoolSize: 10,
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
    });
    pcsRef.current.set(peerId, pc);

    // Guard: if this PC has been superseded by the time an async handler fires,
    // ignore the event entirely to prevent stale state updates.
    const isCurrent = () => pcsRef.current.get(peerId) === pc;

    // Add local tracks
    if (localStreamRef.current) addStreamToPc(pc, localStreamRef.current);

    // ICE candidates
    pc.onicecandidate = ({ candidate }) => {
      if (!isCurrent()) return;
      if (candidate) sendWs({ type: "webrtc_ice", to: peerId, candidate: candidate.toJSON() });
    };

    // Remote stream — handle tracks arriving one-by-one or in a bundle
    pc.ontrack = (evt) => {
      if (!isCurrent()) return;
      setPeers(prev => {
        const m = new Map(prev);
        const existing = m.get(peerId);

        let stream: MediaStream;
        if (evt.streams && evt.streams[0]) {
          // Tracks are bundled in a stream — use it directly
          stream = evt.streams[0];
        } else if (existing?.stream) {
          // Track arrives without stream — add to existing stream
          const s = existing.stream;
          if (!s.getTracks().find(t => t.id === evt.track.id)) {
            s.addTrack(evt.track);
          }
          // Create new object reference so React re-renders
          stream = new MediaStream(s.getTracks());
        } else {
          stream = new MediaStream([evt.track]);
        }

        if (existing) {
          if (existing.screenSharing && stream.getVideoTracks().length) {
            const audioTracks = [
              ...(existing.stream?.getAudioTracks() || []),
              ...stream.getAudioTracks(),
            ];
            m.set(peerId, {
              ...existing,
              stream: audioTracks.length ? new MediaStream([...new Map(audioTracks.map(track => [track.id, track])).values()]) : null,
              screenStream: new MediaStream(stream.getVideoTracks()),
              videoOn: false,
            });
          } else {
            m.set(peerId, { ...existing, stream, screenStream: null });
          }
        } else {
          m.set(peerId, {
            id: peerId,
            name: peerNamesRef.current.get(peerId) || peerId,
            stream,
            audioOn: true,
            videoOn: true,
          });
        }
        return m;
      });
    };

    // Connection state — update UI + try ICE restart before giving up
    let iceRestartAttempts = 0;
    pc.onconnectionstatechange = () => {
      if (!isCurrent()) return;
      const state = pc.connectionState;

      // Update peer connection state in UI
      if (state === "connected" || state === "connecting" || state === "failed" || state === "disconnected") {
        setPeers(prev => {
          const m = new Map(prev);
          const p = m.get(peerId);
          if (p) m.set(peerId, { ...p, connectionState: state as any });
          return m;
        });
      }

      if (state === "failed") {
        if (isInitiator && iceRestartAttempts < 3 && pc.signalingState === "stable") {
          iceRestartAttempts++;
          pc.createOffer({ iceRestart: true })
            .then(o => pc.setLocalDescription(o))
            .then(() => { if (isCurrent()) sendWs({ type: "webrtc_offer", to: peerId, offer: pc.localDescription }); })
            .catch(() => {
              if (isCurrent()) {
                pcsRef.current.delete(peerId);
                setPeers(prev => { const m = new Map(prev); m.delete(peerId); return m; });
              }
            });
        } else {
          if (isCurrent()) {
            pcsRef.current.delete(peerId);
            setPeers(prev => { const m = new Map(prev); m.delete(peerId); return m; });
          }
        }
      }
      if (state === "closed") {
        if (isCurrent()) {
          pcsRef.current.delete(peerId);
          setPeers(prev => { const m = new Map(prev); m.delete(peerId); return m; });
        }
      }
    };

    // Flush pending ICE
    pc.onsignalingstatechange = () => {
      if (!isCurrent()) return;
      if (pc.signalingState === "stable") {
        const candidates = pendingIce.current.get(peerId) || [];
        pendingIce.current.delete(peerId);
        candidates.forEach(c => pc.addIceCandidate(c).catch(() => {}));
      }
    };

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (isCurrent()) sendWs({ type: "webrtc_offer", to: peerId, offer: pc.localDescription });
    }

    return pc;
  }, [sendWs]);

  // ── WebSocket message handler ──────────────────────────────────────────────

  const handleMessage = useCallback(async (raw: string) => {
    let msg: any;
    try { msg = JSON.parse(raw); } catch { return; }
    // A user can have several sockets/tabs. Never apply another room's events.
    if (msg.roomId && String(msg.roomId) !== String(roomId)) return;

    const myId = myIdRef.current;

    // ── DB lobby join request (from qmeet API) ───────────────────────────────
    if (msg.type === "qmeet_join_request") {
      setLobbyRequests(prev => {
        if (prev.find(r => r.userId === msg.userId)) return prev;
        return [...prev, msg];
      });
      return;
    }
    if (msg.type === "webrtc_kicked") {
      toast({ title: "تم إخراجك من الاجتماع", variant: "destructive" });
      navigate("/qmeet");
      return;
    }
    if (msg.type === "webrtc_capacity_limit") {
      const message = msg.reason || "لا يمكن دخول مشارك إضافي قبل تفعيل خادم الاجتماعات";
      leavingRef.current = true;
      joinedRef.current = false;
      setTransportError(message);
      setJoined(false);
      setLivekitMode(false);
      livekitModeRef.current = false;
      lkRoomRef.current?.disconnect().catch(() => {});
      closeNativeSfu();
      wsRef.current?.close();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      toast({
        title: "الاجتماع يحتاج خادم SFU",
        description: `${message} الحد الحالي: ${msg.maxParticipants} مشاركين.`,
        variant: "destructive",
      });
      return;
    }
    if (msg.type === "webrtc_banned") {
      toast({ title: "تم حظرك من هذا الاجتماع", variant: "destructive" });
      navigate("/qmeet");
      return;
    }
    if (msg.type === "webrtc_meeting_ended") {
      toast({ title: "انتهى الاجتماع", description: "أنهى المضيف الاجتماع للجميع" });
      leavingRef.current = true;
      joinedRef.current = false;
      lkRoomRef.current?.disconnect().catch(() => {});
      closeNativeSfu();
      wsRef.current?.close();
      pcsRef.current.forEach(pc => closePeerConnection(pc));
      pcsRef.current.clear();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      navigate("/qmeet");
      return;
    }
    if (msg.type === "webrtc_room_locked") {
      // Legacy fallback — now redirected to lobby_waiting instead
      toast({ title: "الاجتماع مقفل", description: "لا يمكن الانضمام حاليًا", variant: "destructive" });
      navigate("/qmeet");
      return;
    }
    if (msg.type === "webrtc_room_lock_changed") {
      setMeetingLocked(!!msg.locked);
      toast({ title: msg.locked ? "🔒 الاجتماع مقفل" : "🔓 الاجتماع مفتوح" });
      return;
    }

    // ── Screen share notifications from other peers ───────────────────────────
    if (msg.type === "webrtc_screen_share") {
      setPeers(prev => {
        const next = new Map(prev);
        const peer = next.get(msg.from);
        if (peer) {
          if (msg.active) {
            const screenTrack = peer.stream?.getVideoTracks()[0];
            const audioTracks = peer.stream?.getAudioTracks() || [];
            next.set(msg.from, {
              ...peer,
              stream: audioTracks.length ? new MediaStream(audioTracks) : null,
              screenStream: peer.screenStream || (screenTrack ? new MediaStream([screenTrack]) : null),
              screenSharing: true,
              videoOn: false,
            });
          } else {
            next.set(msg.from, { ...peer, screenStream: null, screenSharing: false, videoOn: peer.videoOn && Boolean(peer.stream?.getVideoTracks().length) });
          }
        }
        return next;
      });
      if (msg.active) {
        toast({ title: `🖥️ ${msg.name || "مشارك"} بدأ مشاركة شاشته` });
      } else {
        toast({ title: `🖥️ ${msg.name || "مشارك"} أوقف مشاركة الشاشة` });
      }
      return;
    }

    // ── Screen share request/approval/denial ─────────────────────────────────
    if (msg.type === "webrtc_screen_share_request") {
      toast({ title: `${msg.name || "مشارك"} يطلب مشاركة شاشته`, description: "اعتمد الطلب من لوحة المشاركين" });
      return;
    }
    if (msg.type === "webrtc_screen_share_approved") {
      toast({ title: "✅ تمت الموافقة على مشاركة شاشتك" });
      return;
    }
    if (msg.type === "webrtc_screen_share_denied") {
      toast({ title: "❌ رُفض طلب مشاركة الشاشة", variant: "destructive" });
      return;
    }

    // ── Host receives a lock-lobby join request ───────────────────────────────
    if (msg.type === "webrtc_lock_join_request") {
      setLobbyRequests(prev => {
        if (prev.find(r => r.userId === msg.userId)) return prev;
        return [...prev, { userId: msg.userId, userName: msg.userName }];
      });
      // Open participants panel so host sees the request
      setPanel(p => p === "none" ? "participants" : p);
      toast({ title: "🔔 طلب انضمام جديد", description: `${msg.userName} يطلب الدخول` });
      return;
    }

    // ── Lobby waiting: room is locked ─────────────────────────────────────────
    if (msg.type === "webrtc_lobby_waiting") {
      setLobbyWaiting(true);
      return;
    }

    // ── Lobby denied ─────────────────────────────────────────────────────────
    if (msg.type === "webrtc_lobby_denied") {
      setLobbyWaiting(false);
      toast({ title: "تم رفض طلبك", description: "لم يوافق المضيف على انضمامك", variant: "destructive" });
      navigate("/qmeet");
      return;
    }

    // ── Join: list of existing peers ─────────────────────────────────────────
    if (msg.type === "webrtc_peers") {
      // Set host status
      if (msg.hostId) {
        const amHost = msg.hostId === myId;
        setIsRoomHost(amHost);
        isRoomHostRef.current = amHost;
      }
      // Set lock state
      if (msg.isLocked !== undefined) setMeetingLocked(!!msg.isLocked);
      // Set active poll
      if (msg.activePoll) setActivePoll(msg.activePoll);
      // Build peer info map
      if (msg.peerInfoList) {
        msg.peerInfoList.forEach((p: any) => {
          peerNamesRef.current.set(p.userId, p.name);
          if (p.userId !== myId) {
            setPeers(prev => {
              const m = new Map(prev);
               const existing = m.get(p.userId);
               const stream = getQMeetRosterStream(existing?.stream, p.userId, nativeSfuStreamsRef.current);
               m.set(p.userId, {
                 id: p.userId,
                 name: p.name || existing?.name || p.userId,
                 stream,
                 audioOn: existing?.audioOn ?? true,
                 videoOn: existing?.videoOn ?? true,
                 photoUrl: p.photoUrl || existing?.photoUrl,
                 facingMode: p.facingMode || existing?.facingMode || "user",
                 connectionState: stream?.getTracks().some(track => track.readyState === "live") ? "connected" : existing?.connectionState,
                 raisedHand: existing?.raisedHand,
               });
              return m;
            });
          }
        });
      }
      // Initiate connection to each existing peer (we are the newcomer = initiator)
      const existingIds: string[] = msg.peers || [];
      // If no existing peers, we are the first → we are the host
      if (existingIds.length === 0 && !msg.hostId) {
        setIsRoomHost(true);
        isRoomHostRef.current = true;
      }
      if (livekitModeRef.current || nativeSfuModeRef.current) {
        // SFU modes handle media on their dedicated transport. The control WS
        // still supplies authoritative participant names and permissions.
        if (msg.peerInfoList) {
          msg.peerInfoList.forEach((p: any) => peerNamesRef.current.set(p.userId, p.name));
        }
      } else {
        // P2P mesh: connect to each existing peer
        for (const peerId of existingIds) {
          if (peerId === myId) continue;
          try {
            await createPc(peerId, true);
          } catch (err) {
            // Don't let one failed connection block the rest of the mesh —
            // otherwise later peers in the loop never get connected at all,
            // causing partial-mesh audio ("some hear each other, some don't").
            console.error("[QMeet] Failed to connect to peer", peerId, err);
            pcsRef.current.delete(peerId);
          }
        }
      }
      return;
    }

    // ── Someone new joined (we are existing = NOT initiator) ─────────────────
    if (msg.type === "webrtc_peer_joined") {
      const peerId: string = msg.peerId;
      if (peerId === myId) return;
      peerNamesRef.current.set(peerId, msg.name || peerId);
      if (nativeSfuModeRef.current) {
        setNativePeerPlaceholder(peerId, msg.name || peerId);
      } else if (!livekitModeRef.current) {
        // P2P mesh: set up placeholder and create receiver PC
        setPeers(prev => {
          const m = new Map(prev);
          if (!m.has(peerId)) {
            m.set(peerId, { id: peerId, name: msg.name || peerId, stream: null, audioOn: true, videoOn: true, photoUrl: msg.photoUrl, facingMode: msg.facingMode || "user" });
          }
          return m;
        });
        // Create a receiver PC with full handlers (isInitiator=false → no offer sent)
        createPc(peerId, false).catch(() => {});
      }
      // In LiveKit mode: participant appearance is handled by RoomEvent.ParticipantConnected
      return;
    }

    // ── Host transferred (automatic or manual) ────────────────────────────────
    if (msg.type === "webrtc_host_changed") {
      const amNowHost = String(msg.newHostId) === myId;
      setIsRoomHost(amNowHost);
      isRoomHostRef.current = amNowHost;
      if (amNowHost) {
        toast({ title: "👑 أنت الآن مضيف الاجتماع", description: "تمت إحالة إدارة الغرفة إليك" });
      }
      return;
    }

    // ── Peer left ─────────────────────────────────────────────────────────────
    if (msg.type === "webrtc_peer_left") {
      const peerId: string = msg.peerId;
      peerNamesRef.current.delete(peerId);
      if (nativeSfuModeRef.current) {
        // Control can reconnect independently of media. SFU track-removal
        // events own cache cleanup; retain live media until then.
        setPeers(prev => { const m = new Map(prev); m.delete(peerId); return m; });
      } else if (!livekitModeRef.current) {
        // P2P mesh: close peer connection and remove from state
        pcsRef.current.get(peerId)?.close();
        pcsRef.current.delete(peerId);
        pendingIce.current.delete(peerId);
        setPeers(prev => { const m = new Map(prev); m.delete(peerId); return m; });
      }
      // In LiveKit mode: removal handled by RoomEvent.ParticipantDisconnected
      return;
    }

    // ── Offer received (we are existing peer, newcomer sent this) ─────────────
    if (msg.type === "webrtc_offer") {
      if (livekitModeRef.current || nativeSfuModeRef.current) return; // SFU modes use dedicated signaling
      const peerId: string = msg.from;
      try {
        let pc = pcsRef.current.get(peerId);
        if (!pc) {
          // Peer joined but webrtc_peer_joined wasn't processed yet — create full PC via createPc
          pc = await createPc(peerId, false);
        }
        // If PC is in wrong state (e.g. after ICE restart), close and recreate
        if (pc.signalingState !== "stable" && pc.signalingState !== "have-remote-offer") {
          pc = await createPc(peerId, false);
        }
        await pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
        // Flush buffered ICE candidates after remote description is set
        const cands = pendingIce.current.get(peerId) || [];
        pendingIce.current.delete(peerId);
        for (const c of cands) await pc.addIceCandidate(c).catch(() => {});
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendWs({ type: "webrtc_answer", to: peerId, answer: pc.localDescription });
      } catch (err) {
        // Isolate failure to this one peer so other peer connections in the
        // mesh are unaffected (root cause of "some hear each other, some don't").
        console.error("[QMeet] Failed to handle offer from", peerId, err);
      }
      return;
    }

    // ── Answer received ────────────────────────────────────────────────────────
    if (msg.type === "webrtc_answer") {
      if (livekitModeRef.current || nativeSfuModeRef.current) return; // SFU modes use dedicated signaling
      try {
        const pc = pcsRef.current.get(msg.from);
        if (pc && pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
          // Flush buffered ICE
          const cands = pendingIce.current.get(msg.from) || [];
          pendingIce.current.delete(msg.from);
          for (const c of cands) await pc.addIceCandidate(c).catch(() => {});
        } else if (pc) {
          // Signaling state mismatch (e.g. glare/race during renegotiation) —
          // log it instead of silently dropping the answer forever, which used
          // to leave that one peer permanently unconnected in the mesh.
          console.warn("[QMeet] Dropped answer from", msg.from, "unexpected signalingState:", pc.signalingState);
        }
      } catch (err) {
        console.error("[QMeet] Failed to handle answer from", msg.from, err);
      }
      return;
    }

    // ── ICE candidate ──────────────────────────────────────────────────────────
    if (msg.type === "webrtc_ice") {
      if (livekitModeRef.current || nativeSfuModeRef.current) return; // SFU modes use dedicated signaling
      const peerId: string = msg.from;
      const pc = pcsRef.current.get(peerId);
      if (!msg.candidate) return;
      const candidate = new RTCIceCandidate(msg.candidate);
      if (pc && pc.remoteDescription) {
        pc.addIceCandidate(candidate).catch(() => {});
      } else {
        const arr = pendingIce.current.get(peerId) || [];
        arr.push(candidate);
        pendingIce.current.set(peerId, arr);
      }
      return;
    }

    // ── Chat ───────────────────────────────────────────────────────────────────
    if (msg.type === "webrtc_chat") {
      const time = new Date().toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" });
      const chatMsg: ChatMsg = { id: `${Date.now()}-${msg.from}`, fromId: msg.from, name: msg.name || msg.from, text: msg.text, time, isSelf: false };
      setChat(prev => [...prev, chatMsg]);
      if (panelRef.current !== "chat") setUnread(n => n + 1);
      return;
    }

    // ── Media state ────────────────────────────────────────────────────────────
    if (msg.type === "webrtc_media_state") {
      setPeers(prev => {
        const m = new Map(prev);
        const p = m.get(msg.from);
        if (p) m.set(msg.from, { ...p, audioOn: !!msg.audio, videoOn: !!msg.video, ...(msg.facingMode ? { facingMode: msg.facingMode } : {}) });
        return m;
      });
      return;
    }

    // ── Raise hand ────────────────────────────────────────────────────────────
    if (msg.type === "webrtc_raise_hand") {
      setPeers(prev => {
        const m = new Map(prev);
        const p = m.get(msg.userId || msg.from);
        if (p) m.set(p.id, { ...p, raisedHand: !!msg.raised });
        return m;
      });
      return;
    }

    // ── Reactions ─────────────────────────────────────────────────────────────
    if (msg.type === "webrtc_reaction") {
      const id = `${Date.now()}-${Math.random()}`;
      const left = 20 + Math.random() * 60;
      setFloatReactions(prev => [...prev, { id, emoji: msg.emoji, left }]);
      setTimeout(() => setFloatReactions(prev => prev.filter(r => r.id !== id)), 3000);
      return;
    }

    // ── Mute all (host command) ────────────────────────────────────────────────
    if (msg.type === "webrtc_mute_all") {
      localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = false; });
      audioOnRef.current = false;
      setAudioOn(false);
      sendWs({ type: "webrtc_media_state", roomId, audio: false, video: videoOnRef.current });
      toast({ title: "🔇 تم كتم صوتك من المضيف" });
      return;
    }

    // ── Mute individual (host command) ────────────────────────────────────────
    if (msg.type === "webrtc_mute_me") {
      localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = false; });
      audioOnRef.current = false;
      setAudioOn(false);
      sendWs({ type: "webrtc_media_state", roomId, audio: false, video: videoOnRef.current });
      toast({ title: "🔇 تم كتم صوتك من المضيف" });
      return;
    }

    // ── Polls ─────────────────────────────────────────────────────────────────
    if (msg.type === "webrtc_poll_started") {
      setActivePoll(msg.poll);
      setMyPollVote(null);
      toast({ title: "📊 استطلاع جديد!", description: msg.poll.question });
      return;
    }
    if (msg.type === "webrtc_poll_updated") {
      setActivePoll(msg.poll);
      if (msg.myVote !== undefined) setMyPollVote(msg.myVote);
      return;
    }
    if (msg.type === "webrtc_poll_ended") {
      setActivePoll(msg.poll);
      setTimeout(() => setActivePoll(null), 8000); // show final results for 8s
      return;
    }

    // ── Live captions ─────────────────────────────────────────────────────────
    if (msg.type === "webrtc_caption") {
      const cap: CaptionEntry = { id: `${Date.now()}-${msg.from}`, name: msg.name || msg.from, text: msg.text, isSelf: false };
      captionsLogRef.current = [...captionsLogRef.current, cap];
      setCaptions(prev => {
        const next = [...prev.slice(-9), cap]; // keep last 10
        return next;
      });
      captionsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (msg.type === "webrtc_draw" && msg.stroke?.points?.length) {
      setWhiteboardStrokes(prev => [...prev, msg.stroke as WhiteboardStroke].slice(-2000));
      return;
    }
    if (msg.type === "webrtc_whiteboard_clear") {
      setWhiteboardStrokes([]);
      return;
    }

    // ── Attendance log ────────────────────────────────────────────────────────
    if (msg.type === "webrtc_attendance_log") {
      setAttendanceLog(msg.log || []);
      return;
    }

    // ── Lobby approval ────────────────────────────────────────────────────────
    if (msg.type === "webrtc_lobby_approved") {
      setLobbyWaiting(false);
      return;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeNativeSfu, closePeerConnection, createPc, navigate, sendWs, setNativePeerPlaceholder, toast, roomId]);

  // ── Join meeting ───────────────────────────────────────────────────────────

  const joinMeeting = useCallback(async () => {
    if (!roomId || joinedRef.current || joinInFlightRef.current) return;
    joinInFlightRef.current = true;
    setJoining(true);
    try {
    leavingRef.current = false;
    setTransportError(null);
    if (!userId && !getQMeetGuestTicket(roomId)) {
      // Shared room links use the same admission flow as join codes.
      if (guestName.trim()) sessionStorage.setItem("qmeet_guest_name", guestName.trim());
      if (meeting?.joinCode) {
        navigate(`/meet/join?code=${encodeURIComponent(meeting.joinCode)}`);
      } else {
        setTransportError("يلزم تسجيل الدخول أو الحصول على موافقة المضيف قبل الانضمام.");
      }
      return;
    }

    // Determine effective ID
    const effectiveId = userId || getStoredGuestValue("qmeet_guest_id", roomId) || `guest-${Date.now()}`;
    myIdRef.current = effectiveId;

    // Reuse existing stream if already obtained from pre-join screen
    // Only call getMedia if we don't have a stream yet — avoids duplicate streams
    let stream = localStreamRef.current;
    const hasLiveTracks = stream && stream.getTracks().some(t => t.readyState === "live");
    if (!hasLiveTracks) {
      stream = await getMedia();
    }

    // Apply initial track states (respect what user set on pre-join screen)
    if (stream) {
      stream.getAudioTracks().forEach(t => { t.enabled = audioOnRef.current; });
      stream.getVideoTracks().forEach(t => { t.enabled = videoOnRef.current; });
    }

    let latestCapabilities = mediaCapabilities;
    try {
      const capabilitiesResponse = await fetch("/api/qmeet/media-capabilities", {
        credentials: "include",
        cache: "no-store",
      });
      if (capabilitiesResponse.ok) {
        latestCapabilities = await capabilitiesResponse.json();
        setMediaCapabilities(latestCapabilities);
      }
    } catch {
      // The transport is still negotiated below; a temporary capabilities
      // failure must not prevent a one-to-one call from starting.
    }

    // Load ICE servers
    iceServersRef.current = await getIce();

    const useNativeSfu = Boolean(
      latestCapabilities?.nativeSfu?.enabled
      && (nativeSfuEnabled || latestCapabilities.nativeSfu.enabled)
    );

    // ── Native Pion SFU (explicitly enabled; LiveKit/P2P remain fallback) ─────
    if (useNativeSfu) {
      if (!stream) {
        setTransportError("يتطلب Native SFU ميكروفوناً أو كاميرا فعّالة.");
        return;
      }
      try {
        await startNativeSfu(stream);
        livekitModeRef.current = false;
        setLivekitMode(false);
      } catch (nativeErr: any) {
        console.error("[QMeet] Native SFU connection failed:", nativeErr);
        closeNativeSfu();
        setTransportError("تعذر الاتصال بخادم Native SFU. أعد المحاولة بعد قليل.");
        stream.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
        setLocalStream(null);
        toast({
          title: "تعذر الاتصال بخادم الاجتماع",
          description: "لم يتم تشغيل مسار P2P بديل أثناء تفعيل Native SFU.",
          variant: "destructive",
        });
        return;
      }
    }

    // ── Try LiveKit SFU (100+ participants; falls back to P2P if not configured) ─
    let livekitRequired = latestCapabilities?.mode === "sfu";
    if (!useNativeSfu) try {
      const lkResp = await fetch(
        `/api/qmeet/livekit-token/${roomId}?name=${encodeURIComponent(userName)}`,
        {
          credentials: "include",
          cache: "no-store",
          headers: getQMeetGuestTicket(roomId) ? { "x-qmeet-guest-ticket": getQMeetGuestTicket(roomId) } : {},
        }
      );
      if (!lkResp.ok) livekitRequired = true;
      const lkData = await lkResp.json();
      if (!lkResp.ok) throw new Error(lkData.error || "تعذر اعتماد الدخول إلى الاجتماع.");
      livekitRequired = livekitRequired || Boolean(lkData.enabled);
      if (livekitRequired && !lkData.enabled) throw new Error("خادم الوسائط المطلوب غير متاح.");
      if (lkData.enabled && !lkData.token) {
        throw new Error("LiveKit token was not issued");
      }
      if (lkData.enabled && lkData.token) {
        // Dynamic import keeps livekit-client out of the initial bundle
        const { Room, RoomEvent, ConnectionState, Track } = await import("livekit-client") as any;
        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
          publishDefaults: { simulcast: true, videoCodec: "vp8" },
          audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          videoCaptureDefaults: { resolution: { width: 1280, height: 720, frameRate: 30 } },
        });
        lkRoomRef.current = room;
        livekitModeRef.current = true;
        setLivekitMode(true);

        // Bind participant/track events → update peers state
        const upd = () => updateLKPeers(room);
        room.on(RoomEvent.ParticipantConnected,    upd);
        room.on(RoomEvent.ParticipantDisconnected, upd);
        room.on(RoomEvent.TrackSubscribed,         upd);
        room.on(RoomEvent.TrackUnsubscribed,       upd);
        room.on(RoomEvent.TrackMuted,              upd);
        room.on(RoomEvent.TrackUnmuted,            upd);
        room.on(RoomEvent.ConnectionStateChanged,  (state: any) => {
          if (state === (ConnectionState as any).Reconnecting)
            toast({ title: "⚠️ جارٍ إعادة الاتصال بخادم الاجتماع..." });
          else if (state === (ConnectionState as any).Connected)
            toast({ title: "✅ تم إعادة الاتصال" });
        });

        await room.connect(lkData.url, lkData.token, { autoSubscribe: true });

        // Publish the local tracks we already acquired (avoids a second camera
        // permission prompt). Always publish both tracks and control their
        // enabled state locally so turning a device back on does not create a
        // second LiveKit publication.
        if (stream) {
          const aTrack = stream.getAudioTracks()[0];
          const vTrack = stream.getVideoTracks()[0];
           if (aTrack) {
             aTrack.enabled = audioOnRef.current;
             await room.localParticipant.publishTrack(aTrack, { source: Track.Source.Microphone });
           }
           if (vTrack) {
             vTrack.enabled = videoOnRef.current;
             await room.localParticipant.publishTrack(vTrack, { source: Track.Source.Camera });
           }
        }
        updateLKPeers(room);
      }
    } catch (lkErr: any) {
      if (livekitRequired) {
        console.error("[QMeet] LiveKit connection failed:", lkErr);
        livekitModeRef.current = false;
        setLivekitMode(false);
        lkRoomRef.current?.disconnect().catch(() => {});
        setTransportError("تعذر الاتصال بخادم الاجتماع الآمن. أعد المحاولة بعد قليل.");
        stream?.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
        setLocalStream(null);
        toast({
          title: "تعذر الاتصال بخادم الاجتماع",
          description: "لم يتم تشغيل مسار اتصال غير مستقر كبديل.",
          variant: "destructive",
        });
        return;
      }
      console.warn("[QMeet] LiveKit is not configured — one-to-one P2P only:", lkErr?.message || lkErr);
      livekitModeRef.current = false;
      setLivekitMode(false);
    }

    // Connect WebSocket (needed for chat / reactions / polls / host controls regardless of SFU mode)
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`, getQMeetWebSocketProtocols(roomId));
    wsRef.current = ws;
    const admission = waitForQMeetMessage(ws, message => {
      if (message.roomId && String(message.roomId) !== String(roomId)) return false;
      if (["webrtc_capacity_limit", "webrtc_banned", "webrtc_kicked", "webrtc_meeting_ended"].includes(message.type)) {
        throw new Error(message.reason || "لا يمكن الانضمام إلى هذا الاجتماع.");
      }
      return message.type === "webrtc_peers" || message.type === "webrtc_lobby_waiting";
    });

    const doJoin = (socket: WebSocket, eId: string) => {
      // The server already established identity from the session/admission ticket.
      socket.send(JSON.stringify({ type: "auth" }));
      socket.send(JSON.stringify({
        type: "webrtc_join",
        roomId,
        name: userName,
        photoUrl: (user as any)?.photoUrl || "",
        facingMode: facingModeRef.current,
      }));
    };

    const attachWsHandlers = (socket: WebSocket) => {
      socket.onopen = () => {
        // Only P2P owns media on this control socket. SFU media remains live
        // across a chat/control reconnect and must retain its attached players.
        if (!nativeSfuModeRef.current && !livekitModeRef.current) {
          pcsRef.current.forEach(pc => closePeerConnection(pc));
          pcsRef.current.clear();
          pendingIce.current.clear();
          setPeers(new Map());
        }
        doJoin(socket, effectiveId);
      };
      socket.onmessage = (e) => handleMessage(e.data);
      socket.onerror = () => {};
      socket.onclose = () => {
        if (wsRef.current !== socket) return; // already replaced
        if (leavingRef.current) return;
        setTimeout(() => {
          if (wsRef.current !== socket || leavingRef.current) return;
          const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
          const next = new WebSocket(`${proto}//${window.location.host}/ws`, getQMeetWebSocketProtocols(roomId));
          wsRef.current = next;
          attachWsHandlers(next);
        }, 2500);
      };
    };

    // First connection: don't clean up PCs (they don't exist yet)
    ws.onopen = () => doJoin(ws, effectiveId);
    ws.onmessage = (e) => handleMessage(e.data);
    ws.onerror = () => {};
    ws.onclose = () => {
      if (wsRef.current !== ws) return;
      if (leavingRef.current) return;
      setTimeout(() => {
        if (wsRef.current !== ws || leavingRef.current) return;
        const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
        const next = new WebSocket(`${proto}//${window.location.host}/ws`, getQMeetWebSocketProtocols(roomId));
        wsRef.current = next;
        attachWsHandlers(next);
      }, 2500);
    };

    // ── Keepalive: send ping every 25s to prevent idle WS disconnect ───────
    if (keepaliveRef.current) clearInterval(keepaliveRef.current);
    keepaliveRef.current = window.setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 25000);

    try {
      const confirmed = await admission;
      if (confirmed.selfId) myIdRef.current = String(confirmed.selfId);
      if (leavingRef.current || wsRef.current !== ws) return;
      joinedRef.current = true;
      setJoined(true);
    } catch (error: any) {
      leavingRef.current = true;
      wsRef.current = null;
      ws.close();
      if (keepaliveRef.current) clearInterval(keepaliveRef.current);
      closeNativeSfu();
      lkRoomRef.current?.disconnect().catch(() => {});
      livekitModeRef.current = false;
      setLivekitMode(false);
      joinedRef.current = false;
      setJoined(false);
      leavingRef.current = false;
      setTransportError(error?.message || "تعذر تأكيد الانضمام إلى الاجتماع.");
    }
    } finally {
      joinInFlightRef.current = false;
      setJoining(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    roomId, userId, userName, user, guestName, meeting, navigate, getMedia, handleMessage, updateLKPeers, closePeerConnection,
    toast, mediaCapabilities, nativeSfuEnabled, startNativeSfu, closeNativeSfu,
  ]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (keepaliveRef.current) clearInterval(keepaliveRef.current);
      leavingRef.current = true;
      joinedRef.current = false;
      lkRoomRef.current?.disconnect().catch(() => {});
      closeNativeSfu();
      wsRef.current?.close();
      pcsRef.current.forEach(pc => closePeerConnection(pc));
      pcsRef.current.clear();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close().catch(() => {});
    };
  }, [closePeerConnection, closeNativeSfu]);

  // ── Resume AudioContext on first user gesture (fixes Chrome audio policy) ──
  useEffect(() => {
    const resume = () => {
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }
    };
    document.addEventListener("click", resume);
    document.addEventListener("touchstart", resume);
    return () => {
      document.removeEventListener("click", resume);
      document.removeEventListener("touchstart", resume);
    };
  }, []);

  // ── Speaking detection ────────────────────────────────────────────────────
  useEffect(() => {
    if (!joined) return;
    const getCtx = () => {
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioContext();
      }
      return audioCtxRef.current;
    };
    const attach = (id: string, stream: MediaStream) => {
      if (analyserRef.current.has(id)) {
        try { analyserRef.current.get(id)!.source.disconnect(); } catch {}
        analyserRef.current.delete(id);
      }
      try {
        const ctx = getCtx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512; analyser.smoothingTimeConstant = 0.5;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyserRef.current.set(id, { analyser, source });
      } catch {}
    };

    const selfId = myIdRef.current;
    if (localStream) attach(selfId, localStream);
    peers.forEach((p) => { if (p.stream) attach(p.id, p.stream); });

    const interval = setInterval(() => {
      const speaking = new Set<string>();
      analyserRef.current.forEach(({ analyser }, id) => {
        if (id === selfId && !audioOn) return;
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.slice(0, Math.floor(data.length / 2)).reduce((a, b) => a + b, 0) / (data.length / 2);
        if (avg > 8) speaking.add(id);
      });
      setSpeakingIds(prev => {
        if (prev.size === speaking.size && [...prev].every(id => speaking.has(id))) return prev;
        return speaking;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [joined, localStream, peers, audioOn]);

  // ── Controls ──────────────────────────────────────────────────────────────

  const getLiveKitPublication = useCallback((source: string) => {
    const publications = lkRoomRef.current?.localParticipant?.trackPublications;
    if (!publications) return null;
    for (const publication of publications.values()) {
      if (publication.source === source) return publication;
    }
    return null;
  }, []);

  // Replace a track in all PCs and in the local stream ref
  const replaceTrackInPcs = useCallback((newTrack: MediaStreamTrack, kind: "audio" | "video") => {
    if (!localStreamRef.current) return;
    // Remove old tracks of this kind from stream
    localStreamRef.current.getTracks()
      .filter(t => t.kind === kind && t.id !== newTrack.id)
      .forEach(t => { t.stop(); localStreamRef.current!.removeTrack(t); });
    // Add new track to stream
    if (!localStreamRef.current.getTracks().find(t => t.id === newTrack.id)) {
      localStreamRef.current.addTrack(newTrack);
    }
    // Replace in each PC
    pcsRef.current.forEach(pc => {
      const sender = pc.getSenders().find(s => s.track?.kind === kind);
      if (sender) {
        sender.replaceTrack(newTrack).catch(() => {});
      } else {
        pc.addTrack(newTrack, localStreamRef.current!);
      }
    });
    const nativePc = nativeSfuPcRef.current;
    if (nativePc) {
      const sender = nativePc.getSenders().find(s => s.track?.kind === kind);
      if (sender) sender.replaceTrack(newTrack).catch(() => {});
      else nativePc.addTrack(newTrack, localStreamRef.current);
    }
    // Force React to re-render local video
    setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
  }, []);

  const toggleAudio = useCallback(async () => {
    const on = !audioOnRef.current;

    // Let LiveKit own the microphone lifecycle so re-enabling after an
    // interruption can recreate a stopped capture track.
    if (livekitModeRef.current && lkRoomRef.current) {
      try {
        await lkRoomRef.current.localParticipant.setMicrophoneEnabled(on);
        const track = getLiveKitPublication("microphone")?.track?.mediaStreamTrack;
        if (track && track.readyState === "live") track.enabled = on;
      } catch {
        toast({ title: on ? "تعذّر تشغيل الميكروفون" : "تعذّر إيقاف الميكروفون", variant: "destructive" });
        return;
      }
      audioOnRef.current = on;
      setAudioOn(on);
      sendWs({ type: "webrtc_media_state", roomId, audio: on, video: videoOnRef.current });
      return;
    }

    if (on) {
      // Reacquire instead of merely flipping `enabled` when the OS/browser
      // ended or interrupted the old capture (e.g. an incoming phone call).
      const existingAudio = localStreamRef.current?.getAudioTracks() ?? [];
      const liveTrack = existingAudio.find(t => t.readyState === "live" && !t.muted);
      if (liveTrack) {
        liveTrack.enabled = true;
      } else {
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          const newAudio = newStream.getAudioTracks()[0];
          if (!newAudio) throw new Error("No audio track returned");
          newAudio.enabled = true;
          if (!localStreamRef.current) {
            localStreamRef.current = newStream;
            setLocalStream(newStream);
          } else {
            replaceTrackInPcs(newAudio, "audio");
          }
        } catch {
          toast({ title: "تعذّر تشغيل الميكروفون", variant: "destructive" });
          return;
        }
      }
    } else {
      // Turning OFF — just disable, don't stop (so re-enable works instantly)
      localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = false; });
    }

    audioOnRef.current = on;
    setAudioOn(on);
    sendWs({ type: "webrtc_media_state", roomId, audio: on, video: videoOnRef.current });
  }, [roomId, sendWs, toast, replaceTrackInPcs, getLiveKitPublication]);

  useEffect(() => {
    if (!joined) return;
    let resumeTimer = 0;
    const resumeMedia = () => {
      if (document.visibilityState === "hidden") return;
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        if (audioCtxRef.current?.state === "suspended") {
          void audioCtxRef.current.resume().catch(() => {});
        }
        document.querySelectorAll<HTMLAudioElement>("audio[data-qmeet-remote-audio]").forEach(audio => {
          void audio.play().catch(() => {});
        });
        if (!audioOnRef.current) return;
        if (livekitModeRef.current && lkRoomRef.current) {
          void lkRoomRef.current.localParticipant.setMicrophoneEnabled(true).catch(() => {});
          return;
        }
        const liveTrack = localStreamRef.current?.getAudioTracks()
          .find(track => track.readyState === "live" && !track.muted);
        if (liveTrack) {
          liveTrack.enabled = true;
          return;
        }
        void navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(stream => {
          const track = stream.getAudioTracks()[0];
          if (!track || !audioOnRef.current) {
            stream.getTracks().forEach(item => item.stop());
            return;
          }
          track.enabled = true;
          if (!localStreamRef.current) {
            localStreamRef.current = stream;
            setLocalStream(stream);
          } else {
            replaceTrackInPcs(track, "audio");
          }
        }).catch(() => {
          toast({ title: "تعذّر استعادة صوت الاجتماع", description: "تحقق من إذن الميكروفون ثم أعد تشغيله.", variant: "destructive" });
        });
      }, 500);
    };
    document.addEventListener("visibilitychange", resumeMedia);
    window.addEventListener("focus", resumeMedia);
    window.addEventListener("pageshow", resumeMedia);
    return () => {
      window.clearTimeout(resumeTimer);
      document.removeEventListener("visibilitychange", resumeMedia);
      window.removeEventListener("focus", resumeMedia);
      window.removeEventListener("pageshow", resumeMedia);
    };
  }, [joined, replaceTrackInPcs, toast]);

  const toggleVideo = useCallback(async () => {
    if (screenSharing && !presentationRef.current) return;
    const on = !videoOnRef.current;
    if (presentationRef.current && !livekitModeRef.current) {
      try {
        let camera = cameraStreamRef.current;
        if (on && !camera?.getVideoTracks().some(track => track.readyState === "live")) {
          camera = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          cameraStreamRef.current = camera;
        }
        camera?.getVideoTracks().forEach(track => { track.enabled = on; });
        videoOnRef.current = on; setVideoOn(on);
        setLocalStream(new MediaStream(localStreamRef.current?.getTracks() || []));
        // The outgoing presentation is still video, even when the camera inset is off.
        sendWs({ type: "webrtc_media_state", roomId, audio: audioOnRef.current, video: true });
      } catch { toast({ title: "تعذّر تشغيل الكاميرا", variant: "destructive" }); }
      return;
    }

    // LiveKit SFU mode: control camera through the SFU
    if (livekitModeRef.current && lkRoomRef.current) {
      const publication = getLiveKitPublication("camera");
      const track = publication?.track?.mediaStreamTrack || localStreamRef.current?.getVideoTracks()[0];
      if (track && track.readyState === "live") {
        track.enabled = on;
        if (publication?.track) {
          if (on) await publication.track.unmute().catch(() => {});
          else await publication.track.mute().catch(() => {});
        }
      } else if (on) {
        try {
          await lkRoomRef.current.localParticipant.setCameraEnabled(true);
          const cameraTrack = getLiveKitPublication("camera")?.track?.mediaStreamTrack;
          if (cameraTrack) {
            if (!localStreamRef.current) localStreamRef.current = new MediaStream();
            localStreamRef.current.getVideoTracks().forEach(old => localStreamRef.current!.removeTrack(old));
            localStreamRef.current.addTrack(cameraTrack);
            setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
          }
        } catch {
          toast({ title: "تعذّر تشغيل الكاميرا", variant: "destructive" });
          return;
        }
      }
      videoOnRef.current = on;
      setVideoOn(on);
      sendWs({ type: "webrtc_media_state", roomId, audio: audioOnRef.current, video: presentationRef.current ? true : on });
      return;
    }

    if (on) {
      // Turning ON — check if existing video tracks are live
      const existingVideo = localStreamRef.current?.getVideoTracks() ?? [];
      const liveTrack = existingVideo.find(t => t.readyState === "live");
      if (liveTrack) {
        liveTrack.enabled = true;
      } else {
        // Track ended or missing — request a fresh video track
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          const newVideo = newStream.getVideoTracks()[0];
          if (!localStreamRef.current) {
            localStreamRef.current = newStream;
            setLocalStream(newStream);
          } else {
            replaceTrackInPcs(newVideo, "video");
          }
        } catch {
          toast({ title: "تعذّر تشغيل الكاميرا", variant: "destructive" });
          return;
        }
      }
    } else {
      // Turning OFF — just disable, don't stop
      localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = false; });
    }

    videoOnRef.current = on;
    setVideoOn(on);
    sendWs({ type: "webrtc_media_state", roomId, audio: audioOnRef.current, video: on });
  }, [screenSharing, roomId, sendWs, toast, replaceTrackInPcs, getLiveKitPublication]);

  const flipCamera = useCallback(async () => {
    if (screenSharing || flippingCamera || !videoOnRef.current) return;
    const next = facingModeRef.current === "user" ? "environment" : "user";
    setFlippingCamera(true);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: next } },
        audio: false,
      }).catch(async () => {
        // Some devices don't support "exact" — try without exact
        return await navigator.mediaDevices.getUserMedia({
          video: { facingMode: next },
          audio: false,
        });
      });
      const newTrack = newStream.getVideoTracks()[0];
      if (!newTrack) throw new Error("no video track");
      if (livekitModeRef.current && lkRoomRef.current) {
        const publication = getLiveKitPublication("camera");
        if (publication?.track) {
          await publication.track.replaceTrack(newTrack);
        } else {
          await lkRoomRef.current.localParticipant.publishTrack(newTrack, { source: "camera" });
        }
      } else {
        replaceTrackInPcs(newTrack, "video");
      }
      facingModeRef.current = next;
      sendWs({ type: "webrtc_media_state", roomId, audio: audioOnRef.current, video: videoOnRef.current, facingMode: next });
    } catch {
      toast({ title: "تعذّر قلب الكاميرا — جهازك قد لا يدعم كاميرا خلفية", variant: "destructive" });
    } finally {
      setFlippingCamera(false);
    }
  }, [screenSharing, flippingCamera, replaceTrackInPcs, toast, getLiveKitPublication]);

  const revertToCamera = useCallback(async () => {
    const presentation = presentationRef.current;
    if (presentation) {
      presentationRef.current = null;
      if (livekitModeRef.current && lkRoomRef.current) {
        await lkRoomRef.current.localParticipant.unpublishTrack(presentation.stream.getVideoTracks()[0]).catch(() => {});
      } else {
        const camera = cameraStreamRef.current?.getVideoTracks().find(track => track.readyState === "live");
        if (camera) replaceTrackInPcs(camera, "video");
        else {
          const connections = [...pcsRef.current.values(), ...(nativeSfuPcRef.current ? [nativeSfuPcRef.current] : [])];
          await Promise.all(connections.map(pc => pc.getSenders().find(sender => sender.track?.kind === "video")?.replaceTrack(null).catch(() => {})));
          localStreamRef.current?.getVideoTracks().forEach(track => localStreamRef.current?.removeTrack(track));
          setLocalStream(new MediaStream(localStreamRef.current?.getTracks() || []));
        }
      }
      presentation.stop();
      cameraStreamRef.current = null;
      setPresentationStream(null); setPresentationToolsOpen(false); setScreenSharing(false);
      setPinnedId(previous => previous?.endsWith(":screen") ? null : previous);
      sendWs({ type: "webrtc_screen_share", roomId, active: false, name: userName });
      sendWs({ type: "webrtc_media_state", roomId, audio: audioOnRef.current, video: videoOnRef.current });
      return;
    }
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const camTrack = camStream.getVideoTracks()[0];
      if (camTrack) {
        camTrack.enabled = videoOnRef.current;
        if (localStreamRef.current) {
          localStreamRef.current.getVideoTracks().forEach(t => { t.stop(); localStreamRef.current!.removeTrack(t); });
          localStreamRef.current.addTrack(camTrack);
          pcsRef.current.forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === "video");
            if (sender) sender.replaceTrack(camTrack).catch(() => {});
          });
          const nativePc = nativeSfuPcRef.current;
          const nativeSender = nativePc?.getSenders().find(s => s.track?.kind === "video");
          if (nativeSender) nativeSender.replaceTrack(camTrack).catch(() => {});
          setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        }
      }
    } catch { /* camera unavailable — continue without video */ }
    setScreenSharing(false);
    sendWs({ type: "webrtc_screen_share", roomId, active: false, name: userName });
  }, [roomId, sendWs, userName, replaceTrackInPcs]);

  const toggleScreen = useCallback(async () => {
    if (meeting?.customization?.features?.screenShare === false) {
      toast({ title: "مشاركة الشاشة معطّلة في إعدادات هذا التكامل" }); return;
    }
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isIOSDevice && !isQMeetIOSApp()) {
      const appUrl = new URL("qirox://qmeet");
      appUrl.searchParams.set("roomId", roomId || "");
      appUrl.searchParams.set("screenShare", "1");
      window.location.assign(appUrl.toString());
      return;
    }
    if (isIOSDevice && isQMeetIOSApp()) {
      if (!nativeSfuModeRef.current) {
        toast({
          title: "مشاركة شاشة الآيفون غير متاحة لهذا الاجتماع",
          description: "يتطلب هذا الاجتماع اتصال QMeet Native SFU.",
          variant: "destructive",
        });
        return;
      }
      try {
        const bridge = await getQMeetIOSBroadcastBridge();
        if (!bridge) throw new Error("تعذّر تحميل جسر مشاركة الشاشة في تطبيق iOS");
        const current = await bridge.getBroadcastState();
        if (
          screenSharing
          || ["starting", "broadcasting", "stopping"].includes(current.state)
          || ["starting", "broadcasting", "stopping"].includes(nativeScreenShareState)
        ) {
          await bridge.requestStop();
          setNativeScreenShareState("stopping");
          return;
        }

        const guestTicket = getQMeetGuestTicket(roomId || "");
        const response = await fetch(
          `/api/qmeet/native-media/${encodeURIComponent(roomId || "")}?source=screen`,
          {
            credentials: "include",
            cache: "no-store",
            headers: guestTicket ? { "x-qmeet-guest-ticket": guestTicket } : {},
          },
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.enabled || !data.url || !data.credential || !data.participantId) {
          throw new Error(data.error || "مشاركة شاشة الآيفون غير مفعّلة");
        }
        await bridge.prepareBroadcast({
          url: data.url,
          credential: data.credential,
          roomId: roomId || "",
          participantId: data.participantId,
          iceServers: await getIce(),
        });
        await bridge.showBroadcastPicker();
        setNativeScreenShareState("waiting");
      } catch (error: any) {
        toast({
          title: "تعذّر بدء مشاركة الشاشة",
          description: error?.message || "تحقق من اتصال الاجتماع ثم حاول مجدداً.",
          variant: "destructive",
        });
      }
      return;
    }
    if (typeof navigator.mediaDevices?.getDisplayMedia !== "function") {
      const isAndroidTwa = /Android/i.test(navigator.userAgent)
        && document.referrer.startsWith("android-app://");
      toast({
        title: "مشاركة الشاشة غير متاحة على هذا الجهاز",
        description: isAndroidTwa
          ? "نسخة Android الحالية تعمل كتطبيق TWA ولا توفر التقاط الشاشة الأصلي. استخدم جهازًا أو متصفحًا يدعم مشاركة الشاشة."
          : "المتصفح الحالي لا يوفر التقاط الشاشة؛ جرّب متصفحًا أو جهازًا يدعم مشاركة الشاشة.",
        variant: "destructive",
      });
      return;
    }
    if (presentationV2) {
      if (sharingBusyRef.current) return;
      if (presentationRef.current) { await revertToCamera(); return; }
      sharingBusyRef.current = true;
      let display: MediaStream | null = null;
      let prepared: Awaited<ReturnType<typeof createPresentation>> | null = null;
      try {
        display = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 25 }, audio: false });
        if (!display.getVideoTracks()[0]) throw new Error("لم يتم اختيار شاشة");
        presentationModelRef.current = createPresentationModel();
        cameraStreamRef.current = new MediaStream(localStreamRef.current?.getVideoTracks() || []);
        prepared = await createPresentation(display,
          () => livekitModeRef.current ? localStreamRef.current : cameraStreamRef.current,
          presentationModelRef.current);
        if (livekitModeRef.current && lkRoomRef.current) {
          const { Track } = await import("livekit-client");
          await lkRoomRef.current.localParticipant.publishTrack(prepared.stream.getVideoTracks()[0], { source: Track.Source.ScreenShare });
        } else {
          // Remove, but never stop, the camera before replacing the outgoing video.
          localStreamRef.current?.getVideoTracks().forEach(track => localStreamRef.current!.removeTrack(track));
          if (!localStreamRef.current) localStreamRef.current = new MediaStream();
          replaceTrackInPcs(prepared.stream.getVideoTracks()[0], "video");
        }
        presentationRef.current = prepared;
        display.getVideoTracks()[0].onended = () => { void revertToCamera(); };
        setPresentationStream(prepared.stream); setPresentationToolsOpen(meeting?.customization?.features?.annotations !== false);
        setScreenSharing(true); setPinnedId(`${myIdRef.current || "local"}:screen`);
        sendWs({ type: "webrtc_media_state", roomId, audio: audioOnRef.current, video: true });
        sendWs({ type: "webrtc_screen_share", roomId, active: true, name: userName });
      } catch (error: any) {
        prepared?.stop(); display?.getTracks().forEach(track => track.stop());
        if (error?.name !== "NotAllowedError") toast({ title: "تعذّر مشاركة الشاشة", description: error?.message, variant: "destructive" });
      } finally { sharingBusyRef.current = false; }
      return;
    }
    // LiveKit SFU mode: screen share via SFU
    if (livekitModeRef.current && lkRoomRef.current) {
      if (screenSharing) {
        lkRoomRef.current.localParticipant.setScreenShareEnabled(false).catch(() => {});
        setScreenSharing(false);
        sendWs({ type: "webrtc_screen_share", roomId, active: false, name: userName });
      } else {
        lkRoomRef.current.localParticipant.setScreenShareEnabled(true)
          .then(() => {
            setScreenSharing(true);
            sendWs({ type: "webrtc_screen_share", roomId, active: true, name: userName });
            toast({ title: "🖥️ بدأت مشاركة الشاشة", description: "المشاركون الآخرون يرون شاشتك الآن" });
          })
          .catch((e: any) => {
            if (e?.name !== "NotAllowedError")
              toast({ title: "تعذّر مشاركة الشاشة", variant: "destructive" });
          });
      }
      return;
    }
    if (screenSharing) {
      await revertToCamera();
      return;
    }
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30, max: 60 }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: { echoCancellation: false, noiseSuppression: false, sampleRate: 44100 },
      });
      const screenTrack = screen.getVideoTracks()[0];
      if (!screenTrack) return;
      // Swap into local stream
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(t => { t.stop(); localStreamRef.current!.removeTrack(t); });
        localStreamRef.current.addTrack(screenTrack);
      } else {
        localStreamRef.current = screen;
      }
      // Replace video track in all PCs
      pcsRef.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        if (sender) sender.replaceTrack(screenTrack).catch(() => {});
        else pc.addTrack(screenTrack, localStreamRef.current!);
      });
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      // When user stops sharing from browser UI
      screenTrack.onended = () => revertToCamera();
      setScreenSharing(true);
      sendWs({ type: "webrtc_screen_share", roomId, active: true, name: userName });
      toast({ title: "🖥️ بدأت مشاركة الشاشة", description: "المشاركون الآخرون يرون شاشتك الآن" });
    } catch (e: any) {
      if (e?.name !== "NotAllowedError") {
        toast({ title: "تعذّر مشاركة الشاشة", description: "تأكد من منح الإذن لمشاركة الشاشة", variant: "destructive" });
      }
    }
  }, [screenSharing, nativeScreenShareState, roomId, sendWs, toast, userName, revertToCamera, isMobile, presentationV2, replaceTrackInPcs, meeting?.customization]);

  const toggleHand = useCallback(() => {
    const on = !raisedHand;
    setRaisedHand(on);
    sendWs({ type: "webrtc_raise_hand", roomId, raised: on, name: userName, userId: myIdRef.current });
  }, [raisedHand, roomId, userName, sendWs]);

  const sendReaction = useCallback((emoji: string) => {
    const id = `${Date.now()}-local`;
    const left = 20 + Math.random() * 60;
    setFloatReactions(prev => [...prev, { id, emoji, left }]);
    setTimeout(() => setFloatReactions(prev => prev.filter(r => r.id !== id)), 3000);
    sendWs({ type: "webrtc_reaction", roomId, emoji, name: userName, userId: myIdRef.current });
    setShowEmojiPicker(false);
  }, [roomId, userName, sendWs]);

  const muteAll = useCallback(() => {
    sendWs({ type: "webrtc_mute_all", roomId });
    toast({ title: "تم كتم جميع المشاركين" });
  }, [roomId, sendWs, toast]);

  const sendChat = useCallback(() => {
    if (meeting?.customization?.features?.chat === false) return;
    if (!chatInput.trim()) return;
    const time = new Date().toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" });
    const msg: ChatMsg = { id: `${Date.now()}-self`, fromId: myIdRef.current, name: userName, text: chatInput.trim(), time, isSelf: true };
    setChat(prev => [...prev, msg]);
    sendWs({ type: "webrtc_chat", roomId, text: chatInput.trim(), name: userName });
    setChatInput("");
  }, [chatInput, userName, roomId, sendWs, meeting?.customization?.features?.chat]);

  const leave = useCallback(() => {
    presentationRef.current?.stop(); presentationRef.current = null;
    cameraStreamRef.current?.getTracks().forEach(track => track.stop());
    cameraStreamRef.current = null;
    leavingRef.current = true;
    joinedRef.current = false;
    sendWs({ type: "webrtc_leave", roomId });
    lkRoomRef.current?.disconnect().catch(() => {});
    closeNativeSfu();
    wsRef.current?.close();
    pcsRef.current.forEach(pc => closePeerConnection(pc));
    pcsRef.current.clear();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    navigate("/qmeet");
  }, [roomId, sendWs, navigate, closePeerConnection, closeNativeSfu]);

  const copyLink = useCallback(() => {
    const url = `${window.location.origin}/meet/${roomId}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [roomId]);

  const approveLobby = useCallback((reqUserId: string) => {
    sendWs({ type: "webrtc_approve_lobby", roomId, targetId: reqUserId });
    setLobbyRequests(prev => prev.filter(r => r.userId !== reqUserId));
  }, [roomId, sendWs]);

  const denyLobby = useCallback((reqUserId: string) => {
    sendWs({ type: "webrtc_deny_lobby", roomId, targetId: reqUserId });
    setLobbyRequests(prev => prev.filter(r => r.userId !== reqUserId));
  }, [roomId, sendWs]);

  // ── Host: Lock/Unlock room ────────────────────────────────────────────────
  const toggleLock = useCallback(() => {
    const newLocked = !meetingLocked;
    sendWs({ type: "webrtc_lock_room", roomId, locked: newLocked });
    setMeetingLocked(newLocked);
    toast({ title: newLocked ? "🔒 الاجتماع مقفل" : "🔓 الاجتماع مفتوح" });
  }, [meetingLocked, roomId, sendWs, toast]);

  // ── Host: Kick participant ─────────────────────────────────────────────────
  const kickPeer = useCallback((targetId: string, targetName: string) => {
    if (!confirm(`هل تريد إخراج ${targetName} وحظره من إعادة الانضمام؟`)) return;
    sendWs({ type: "webrtc_kick", roomId, targetId, ban: true });
    toast({ title: `تم إخراج ${targetName}` });
  }, [roomId, sendWs, toast]);

  // ── Host: Mute individual peer ────────────────────────────────────────────
  const mutePeer = useCallback((targetId: string) => {
    sendWs({ type: "webrtc_mute_peer", roomId, targetId });
    toast({ title: "تم كتم المشارك" });
  }, [roomId, sendWs, toast]);

  // ── Live Captions (Web Speech API) ───────────────────────────────────────
  const toggleCaptions = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "التعليقات المباشرة غير متاحة", description: "استخدم Chrome أو Edge لهذه الميزة", variant: "destructive" });
      return;
    }
    if (captionsOn) {
      speechRef.current?.stop();
      speechRef.current = null;
      setCaptionsOn(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "ar-SA";
    recognition.onresult = (e: any) => {
      const latest = e.results[e.results.length - 1];
      if (latest.isFinal) {
        const text = latest[0].transcript.trim();
        if (!text) return;
        const cap: CaptionEntry = { id: `${Date.now()}-self`, name: userName, text, isSelf: true };
        captionsLogRef.current = [...captionsLogRef.current, cap];
        setCaptions(prev => [...prev.slice(-9), cap]);
        captionsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        // Relay to peers
        sendWs({ type: "webrtc_caption", roomId, text, name: userName });
      }
    };
    recognition.onerror = () => {};
    recognition.onend = () => {
      // Auto-restart if still enabled
      if (speechRef.current) {
        try { speechRef.current.start(); } catch {}
      }
    };
    recognition.start();
    speechRef.current = recognition;
    setCaptionsOn(true);
    toast({ title: "✏️ التعليقات المباشرة تعمل" });
  }, [captionsOn, roomId, userName, sendWs, toast]);

  // ── Recording (MediaRecorder + getDisplayMedia for full-room capture) ────
  const captureStreamRef = useRef<MediaStream | null>(null);

  const toggleRecording = useCallback(async () => {
    if (isMobile || window.matchMedia("(max-width: 767px)").matches) {
      toast({
        title: "التسجيل من الجوال غير مدعوم حالياً",
        description: "ابدأ التسجيل من جهاز كمبيوتر لضمان تسجيل الصوت والصورة بشكل صحيح.",
        variant: "destructive",
      });
      return;
    }
    if (recording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    try {
      recordedChunksRef.current = [];
      let recordStream: MediaStream;

      // Try screen/tab capture first — this records ALL participants on screen
      try {
        const displayStream = await (navigator.mediaDevices as any).getDisplayMedia({
          video: { displaySurface: "browser", frameRate: 30 } as MediaTrackConstraints,
          audio: { echoCancellation: false, noiseSuppression: false } as MediaTrackConstraints,
        });
        captureStreamRef.current = displayStream;

        // Mix display audio + local mic for full audio
        if (localStreamRef.current?.getAudioTracks().length) {
          try {
            const audioCtx = new AudioContext();
            const dest = audioCtx.createMediaStreamDestination();
            audioCtx.createMediaStreamSource(localStreamRef.current).connect(dest);
            if (displayStream.getAudioTracks().length > 0) {
              audioCtx.createMediaStreamSource(displayStream).connect(dest);
            }
            recordStream = new MediaStream([
              ...displayStream.getVideoTracks(),
              ...dest.stream.getAudioTracks(),
            ]);
          } catch {
            recordStream = displayStream;
          }
        } else {
          recordStream = displayStream;
        }

        // Auto-stop when user ends screen sharing
        displayStream.getVideoTracks()[0]?.addEventListener("ended", () => {
          if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
          }
        });
      } catch (displayErr: any) {
        if (displayErr?.name === "NotAllowedError") {
          toast({ title: "تم إلغاء التسجيل", variant: "destructive" });
          return;
        }
        // Fallback: record local stream only
        if (!localStreamRef.current) {
          toast({ title: "لا يوجد stream للتسجيل", variant: "destructive" });
          return;
        }
        recordStream = localStreamRef.current;
        toast({ title: "⚠️ تسجيل الكاميرا فقط", description: "لم يتم السماح بتسجيل الشاشة" });
      }

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";

      const recorder = new MediaRecorder(recordStream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        setRecordingBlob(blob);
        setRecording(false);
        captureStreamRef.current?.getTracks().forEach(t => t.stop());
        captureStreamRef.current = null;
        toast({ title: "✅ التسجيل جاهز للتنزيل" });
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordingBlob(null);
      toast({ title: "⏺ بدأ تسجيل الاجتماع", description: "اختر التبويب الحالي لتسجيل جميع المشاركين" });
    } catch {
      toast({ title: "تعذّر بدء التسجيل", variant: "destructive" });
    }
  }, [recording, toast, isMobile]);

  const downloadRecording = useCallback(() => {
    if (!recordingBlob) return;
    const url = URL.createObjectURL(recordingBlob);
    const a = document.createElement("a");
    a.href = url;
    const safeTitle = (meeting?.title || roomId).replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, "_").slice(0, 40);
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `qmeet-${safeTitle}-${dateStr}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  }, [recordingBlob, roomId]);

  // ── Poll controls ─────────────────────────────────────────────────────────
  const createPoll = useCallback(() => {
    const validOptions = pollOptions.filter(o => o.trim());
    if (!pollQuestion.trim() || validOptions.length < 2) {
      toast({ title: "أدخل سؤالاً وخيارين على الأقل", variant: "destructive" });
      return;
    }
    sendWs({ type: "webrtc_poll_create", roomId, question: pollQuestion.trim(), options: validOptions });
    setPollQuestion("");
    setPollOptions(["", ""]);
    setShowPollCreator(false);
  }, [pollQuestion, pollOptions, roomId, sendWs, toast]);

  const votePoll = useCallback((optionIndex: number) => {
    if (!activePoll || myPollVote !== null) return;
    sendWs({ type: "webrtc_poll_vote", roomId, pollId: activePoll.id, optionIndex });
    setMyPollVote(optionIndex);
  }, [activePoll, myPollVote, roomId, sendWs]);

  const endPoll = useCallback(() => {
    if (!activePoll) return;
    sendWs({ type: "webrtc_poll_end", roomId, pollId: activePoll.id });
  }, [activePoll, roomId, sendWs]);

  // ── AI Summary ────────────────────────────────────────────────────────────
  const getAiSummary = useCallback(async () => {
    setAiSummaryLoading(true);
    setPanel("ai");
    try {
      const res = await fetch(`/api/qmeet/room/${roomId}/ai-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          chat: chat.map(m => ({ name: m.name, text: m.text })),
          captions: captionsLogRef.current.map(c => ({ name: c.name, text: c.text })),
          title: meeting?.title || "اجتماع",
        }),
      });
      const data = await res.json();
      setAiSummary(data.summary || "تعذّر إنشاء الملخص");
    } catch {
      setAiSummary("خطأ في الاتصال بخدمة الذكاء الاصطناعي");
    } finally {
      setAiSummaryLoading(false);
    }
  }, [roomId, chat, meeting]);

  // ── Attendance ────────────────────────────────────────────────────────────
  const showAttendancePanel = useCallback(() => {
    sendWs({ type: "webrtc_get_attendance", roomId });
    setPanel("attendance");
  }, [roomId, sendWs]);

  // ── Render helpers ────────────────────────────────────────────────────────
  useEffect(() => {
    if (window.parent === window || !new URLSearchParams(window.location.search).has("embed")) return;
    const allowedOrigins: string[] = meeting?.customization?.allowedOrigins || [];
    const receive = (event: MessageEvent) => {
      const command = qmeetEmbedCommand(event, window.parent, allowedOrigins, roomId, joined);
      if (!command) return;
      const message = { command };
      if (message.command === "toggleCamera") void toggleVideo();
      if (message.command === "toggleMicrophone") void toggleAudio();
      // Browser display-capture needs a gesture inside the iframe: explain rather than fake success.
      if (message.command === "toggleScreenShare") {
        toast({ title: "اضغط زر مشاركة الشاشة داخل الاجتماع لمنح الإذن" });
      }
      if (message.command === "openAnnotations" && presentationStream && meeting?.customization?.features?.annotations !== false) setPresentationToolsOpen(true);
      if (message.command === "leave") leave();
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [joined, meeting?.customization, roomId, toggleVideo, toggleAudio, leave, presentationStream, toast]);
  useEffect(() => {
    if (window.parent === window || !new URLSearchParams(window.location.search).has("embed")) return;
    for (const origin of (meeting?.customization?.allowedOrigins || [])) {
      window.parent.postMessage({ type: "qmeet:event", roomName: roomId, event: joined ? "state" : "ready",
        data: { joined, camera: videoOn, microphone: audioOn, screenSharing } }, origin);
    }
  }, [joined, audioOn, videoOn, screenSharing, roomId, meeting?.customization]);

  const myId = myIdRef.current || "local";
  const localPeer: PeerState = {
    id: myId, name: userName,
    stream: screenSharing && presentationStream && !livekitModeRef.current ? cameraStreamRef.current : localStream,
    audioOn, videoOn, raisedHand,
  };
  const presentationPeer: PeerState | null = presentationStream ? {
    id: `${myId}:screen`, name: "شاشتك", stream: presentationStream,
    audioOn: false, videoOn: true, screenSharing: true,
  } : null;
  const participantPeers = [localPeer, ...peers.values()];
  const screenPeers: PeerState[] = participantPeers.flatMap(peer => peer.screenStream ? [{
    id: `${peer.id}:screen`,
    name: `${peer.name} — مشاركة الشاشة`,
    stream: peer.screenStream,
    audioOn: false,
    videoOn: true,
    screenSharing: true,
    photoUrl: peer.photoUrl,
  }] : []);
  const allPeers: PeerState[] = [...participantPeers, ...screenPeers, ...(presentationPeer ? [presentationPeer] : [])];
  const total = allPeers.length;

  const isSpotlight = layout === "spotlight" || pinnedId !== null;
  const spotPeer = pinnedId === presentationPeer?.id ? presentationPeer : pinnedId ? (allPeers.find(p => p.id === pinnedId) ?? allPeers[0]) : (allPeers.find(p => speakingIds.has(p.id)) ?? allPeers[0]);
  const thumbPeers = allPeers.filter(p => p.id !== spotPeer?.id);

  const gridCols = isMobile ? 1 : (total <= 1 ? 1 : total === 2 ? 2 : total <= 4 ? 2 : total <= 6 ? 3 : 4);

  // ── PRE-JOIN SCREEN ────────────────────────────────────────────────────────
  if (!joined) {
    if (meetingLoading) {
      return (
        <div className="min-h-screen bg-[#202124] flex items-center justify-center" dir={dir}>
          <Loader2 className="w-7 h-7 text-white/50 animate-spin" />
        </div>
      );
    }

    if (meetingIsError || !meeting) {
      return (
        <div className="min-h-screen bg-[#202124] flex items-center justify-center px-4" dir={dir}>
          <div className="w-full max-w-md rounded-2xl bg-[#2b2c2f] border border-white/10 p-7 text-center space-y-5">
            <XCircle className="w-12 h-12 text-red-400 mx-auto" />
            <div>
              <h1 className="text-white text-xl font-bold">تعذر فتح الاجتماع</h1>
              <p className="text-white/55 text-sm mt-2">
                {(meetingError as Error)?.message || "رابط الاجتماع غير صحيح أو انتهت صلاحيته"}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => refetchMeeting()}
                className="flex-1 rounded-xl bg-white/10 hover:bg-white/15 text-white py-3 text-sm font-medium"
              >
                إعادة المحاولة
              </button>
              <button
                onClick={() => navigate("/meet/join")}
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white py-3 text-sm font-medium"
              >
                الانضمام بكود
              </button>
            </div>
          </div>
        </div>
      );
    }

    const permissionDenied = mediaError?.includes("رُفض") || mediaError?.includes("غير مصرح");
    const noDevice = mediaError?.includes("لا توجد");
    const inUse = mediaError?.includes("مستخدمة");
    return (
      <div className="min-h-screen bg-[#202124] flex flex-col items-center justify-center px-4 py-6" dir={dir}>
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-white text-2xl font-bold">{meeting?.title || "اجتماع QMeet"}</h1>
          <p className="text-[#9aa0a6] text-sm mt-1">جهّز الكاميرا والميكروفون قبل الدخول</p>
        </div>

        <div className="w-full max-w-3xl flex flex-col lg:flex-row gap-5 items-start justify-center">
          {/* Camera preview */}
          <div className="w-full lg:flex-1 flex flex-col gap-3">
            <div className="bg-[#3c4043] rounded-2xl overflow-hidden relative" style={{ aspectRatio: "16/9" }}>
              {localStream && videoOn
                ? <video ref={el => { if (el && localStream) { el.srcObject = localStream; el.play().catch(() => {}); }}}
                    autoPlay muted playsInline className="w-full h-full object-cover"
                    style={{ transform: facingModeRef.current === "user" ? "scaleX(-1)" : undefined }} />
                : <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl font-bold text-white"
                      style={{ background: avatarColor(userName) }}>
                      {userName?.charAt(0)?.toUpperCase() || "م"}
                    </div>
                    <span className="text-[#9aa0a6] text-sm">
                      {mediaError ? "الكاميرا غير متاحة" : "الكاميرا مغلقة"}
                    </span>
                  </div>
              }
              {/* Controls overlay */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                <button onClick={toggleAudio}
                  className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition ${audioOn ? "bg-black/50 hover:bg-black/70 backdrop-blur-sm" : "bg-black dark:bg-white hover:bg-black dark:bg-white"}`}
                  title={audioOn ? "إيقاف الميكروفون" : "تشغيل الميكروفون"}>
                  {audioOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
                </button>
                <button onClick={toggleVideo}
                  className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition ${videoOn ? "bg-black/50 hover:bg-black/70 backdrop-blur-sm" : "bg-black dark:bg-white hover:bg-black dark:bg-white"}`}
                  title={videoOn ? "إيقاف الكاميرا" : "تشغيل الكاميرا"}>
                  {videoOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
                </button>
                {videoOn && (
                  <button onClick={flipCamera} disabled={flippingCamera}
                    className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition bg-black/50 hover:bg-black/70 backdrop-blur-sm disabled:opacity-50"
                    title="قلب الكاميرا">
                    {flippingCamera ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <FlipHorizontal2 className="w-5 h-5 text-white" />}
                  </button>
                )}
              </div>
            </div>

            {/* Device status indicators */}
            <div className="flex gap-2">
              <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
                audioOn && localStream?.getAudioTracks()[0]?.readyState === "live"
                  ? "bg-black dark:bg-white border border-black dark:border-white text-black/70 dark:text-white/70"
                  : mediaError ? "bg-black dark:bg-white border border-black dark:border-white text-black/70 dark:text-white/70"
                  : "bg-[#3c4043] text-[#9aa0a6]"
              }`}>
                <Mic className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{
                  localStream?.getAudioTracks()[0]?.readyState === "live" ? "الميكروفون يعمل ✓"
                  : mediaError ? "لا يوجد ميكروفون" : "في الانتظار..."
                }</span>
              </div>
              <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
                videoOn && localStream?.getVideoTracks()[0]?.readyState === "live"
                  ? "bg-black dark:bg-white border border-black dark:border-white text-black/70 dark:text-white/70"
                  : "bg-[#3c4043] text-[#9aa0a6]"
              }`}>
                <Camera className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{
                  localStream?.getVideoTracks()[0]?.readyState === "live" ? "الكاميرا تعمل ✓"
                  : videoOn ? "مغلقة" : "معطّلة"
                }</span>
              </div>
            </div>
          </div>

          {/* Join card */}
          <div className="w-full lg:w-72 flex flex-col gap-3">

            {/* Permission error with fix guide */}
            {transportError && (
              <div className="p-4 rounded-xl bg-red-950/60 border border-red-400/30 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-300" />
                  <div>
                    <p className="text-red-200 text-xs font-semibold mb-1">مشكلة في خادم الاجتماع</p>
                    <p className="text-red-100/80 text-xs leading-relaxed">{transportError}</p>
                  </div>
                </div>
                <button onClick={() => { setTransportError(null); joinMeeting(); }}
                  className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition">
                  إعادة المحاولة
                </button>
              </div>
            )}
            {mediaError && (
              <div className={`p-4 rounded-xl space-y-3 ${permissionDenied ? "bg-black dark:bg-white border border-black dark:border-white" : "bg-black dark:bg-white border border-black dark:border-white"}`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${permissionDenied ? "text-black/70 dark:text-white/70" : "text-black/70 dark:text-white/70"}`} />
                  <div>
                    <p className={`text-xs font-semibold mb-1 ${permissionDenied ? "text-black/70 dark:text-white/70" : "text-black/70 dark:text-white/70"}`}>
                      {permissionDenied ? "لم يتم منح الإذن" : noDevice ? "لا يوجد جهاز" : inUse ? "الجهاز مستخدم" : "مشكلة في الوصول"}
                    </p>
                    <p className={`text-xs leading-relaxed ${permissionDenied ? "text-black/70 dark:text-white/70" : "text-black/70 dark:text-white/70"}`}>
                      {permissionDenied
                        ? "اضغط على أيقونة القفل 🔒 في شريط العنوان واختر «السماح» للكاميرا والميكروفون"
                        : noDevice
                        ? "تأكد من توصيل كاميرا وميكروفون بجهازك ثم حاول مجدداً"
                        : inUse
                        ? "أغلق أي تطبيقات أخرى تستخدم الكاميرا أو الميكروفون (Zoom، Teams...) ثم حاول مجدداً"
                        : mediaError}
                    </p>
                  </div>
                </div>
                <button onClick={() => getMedia()}
                  className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition flex items-center justify-center gap-2">
                  <Camera className="w-3.5 h-3.5" /> أعد المحاولة
                </button>
              </div>
            )}

            {/* HTTPS warning */}
            {window.location.protocol !== "https:" && window.location.hostname !== "localhost" && (
              <div className="p-3 rounded-xl bg-black dark:bg-white border border-black dark:border-white text-black/70 dark:text-white/70 text-xs leading-relaxed flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>يجب فتح الاجتماع عبر رابط آمن (HTTPS) لاستخدام الكاميرا والميكروفون</span>
              </div>
            )}

            {/* Name input for guests */}
            {!defaultName && (
              <div>
                <label className="text-[#9aa0a6] text-xs mb-1.5 block">اسمك في الاجتماع</label>
                <input
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (guestName.trim() || defaultName) && joinMeeting()}
                  placeholder="أدخل اسمك..."
                  maxLength={40}
                  className="w-full px-4 py-3 rounded-xl bg-[#3c4043] text-white placeholder:text-[#9aa0a6] outline-none border border-transparent focus:border-black dark:border-white transition"
                  data-testid="input-guest-name"
                  autoFocus
                />
              </div>
            )}

            {/* Logged-in user display */}
            {defaultName && (
              <div className="px-4 py-3 rounded-xl bg-[#3c4043] text-white text-sm flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: avatarColor(defaultName) }}>
                  {defaultName.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{defaultName}</span>
              </div>
            )}

            {/* Permission request if no media yet */}
            {!localStream && !mediaError && (
              <button onClick={() => getMedia()}
                className="w-full py-3 rounded-xl bg-[#3c4043] hover:bg-[#4a4d51] text-white text-sm font-medium transition flex items-center justify-center gap-2 border border-white/10">
                <Camera className="w-4 h-4" /> تفعيل الكاميرا والميكروفون
              </button>
            )}

            {/* Join button */}
            <button
              onClick={joinMeeting}
              disabled={joining || (!defaultName && !guestName.trim())}
              className="w-full py-3.5 rounded-xl bg-black dark:bg-white hover:bg-black dark:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base transition shadow-lg"
              data-testid="button-join-meeting"
            >
              {joining ? "جارٍ تأكيد الانضمام..." : "انضمام الآن"}
            </button>

            {/* Tips */}
            <div className="p-3 rounded-xl bg-white/[0.04] space-y-1.5">
              <p className="text-[#9aa0a6] text-[11px] font-medium">نصائح للحصول على أفضل تجربة:</p>
              <p className="text-[#9aa0a6] text-[11px] leading-relaxed">• استخدم Chrome أو Edge للحصول على أفضل أداء</p>
              <p className="text-[#9aa0a6] text-[11px] leading-relaxed">• اضغط «السماح» عند طلب إذن الكاميرا/الميك</p>
              <p className="text-[#9aa0a6] text-[11px] leading-relaxed">• في بيئة مكتبية: تأكد من السماح بـ WebRTC</p>
            </div>

            <button onClick={() => navigate("/qmeet")}
              className="w-full py-2.5 rounded-xl bg-[#3c4043] hover:bg-[#4a4d51] text-[#9aa0a6] text-sm transition">
              رجوع
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LOBBY WAITING ──────────────────────────────────────────────────────────
  if (lobbyWaiting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#202124] px-4" dir={dir}>
        <div className="w-full max-w-sm bg-[#292b2f] rounded-2xl p-8 flex flex-col items-center gap-5 shadow-2xl text-center">
          {/* Animated waiting icon */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-[#3c4043] flex items-center justify-center">
              <Lock className="w-8 h-8 text-black/70 dark:text-white/70" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-black dark:bg-white flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
          </div>

          <div>
            <h2 className="text-white text-xl font-bold mb-2">في انتظار الموافقة</h2>
            <p className="text-[#9aa0a6] text-sm leading-relaxed">
              هذا الاجتماع مقفل حاليًا.<br />
              تم إرسال طلب انضمامك إلى المضيف.<br />
              انتظر حتى يوافق على طلبك.
            </p>
          </div>

          {/* Pulsing dots animation */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-black dark:bg-white animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>

          {/* Wait timer */}
          <div className="px-4 py-2 rounded-xl bg-[#3c4043] text-[#9aa0a6] text-sm flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>في انتظار الموافقة · {timer}</span>
          </div>

          <div className="w-full pt-2 border-t border-white/[0.08] space-y-2">
            <p className="text-[#9aa0a6] text-xs">
              {meeting?.title ? `«${meeting.title}»` : "الاجتماع"} · {userName}
            </p>
            <button
              onClick={() => sendWs({ type: "webrtc_lobby_request", roomId, name: userName, userId: myIdRef.current })}
              className="w-full py-2.5 rounded-xl bg-black dark:bg-white hover:bg-black dark:bg-white text-black/70 dark:text-white/70 text-sm font-medium transition border border-black dark:border-white">
              إعادة إرسال الطلب
            </button>
            <button onClick={leave}
              className="w-full py-2.5 rounded-xl bg-black dark:bg-white hover:bg-black dark:bg-white text-black/70 dark:text-white/70 text-sm font-medium transition border border-black dark:border-white">
              إلغاء الطلب والخروج
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── MEETING ROOM ───────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-[#202124] overflow-hidden relative select-none" dir={dir}
      style={{ borderTop: meeting?.customization ? `3px solid ${meeting.customization.accentColor || "#14b8a6"}` : undefined }}>
      {meeting?.customization && (
        <div className="flex items-center justify-center gap-2 py-1 text-xs text-white bg-[#292b2f]">
          {meeting.customization.logoUrl && <img src={meeting.customization.logoUrl} alt="" className="h-6 max-w-24 object-contain" />}
          <span>{meeting.customization.brandName || "QMeet"}</span>
        </div>
      )}
      {transportError && (
        <div role="alert" className="shrink-0 bg-red-950 border-b border-red-400/30 px-4 py-2 text-sm text-red-100 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{transportError}</span>
        </div>
      )}

      {/* Floating emoji reactions */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {floatReactions.map(r => (
          <div key={r.id} className="absolute bottom-32 text-4xl animate-bounce" style={{ animationDuration: "0.6s", left: `${r.left}%` }}>
            {r.emoji}
          </div>
        ))}
      </div>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0 bg-[#202124]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-white font-medium text-sm truncate max-w-[120px] sm:max-w-none">{meeting?.title || "اجتماع"}</span>
          <span className="text-[#9aa0a6] text-xs tabular-nums shrink-0">{timer}</span>
          {livekitMode && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 shrink-0">
              SFU · 100↑
            </span>
          )}
          {nativeSfuMode && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-600/20 text-blue-300 border border-blue-600/30 shrink-0">
              Native SFU · Pion
            </span>
          )}
          {meetingLocked && <Lock className="w-3.5 h-3.5 text-black/70 dark:text-white/70 shrink-0" />}
          {recording && <span className="flex items-center gap-1 text-black/70 dark:text-white/70 text-xs animate-pulse shrink-0"><CircleDot className="w-3 h-3" />تسجيل</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#3c4043] text-[#9aa0a6] text-xs">
            <Users className="w-3.5 h-3.5" /><span>{total}</span>
          </div>
          {lobbyRequests.length > 0 && (
            <button onClick={() => setPanel(p => p === "participants" ? "none" : "participants")}
              className="px-2.5 py-1 rounded-lg bg-black dark:bg-white border border-black dark:border-white text-black/70 dark:text-white/70 text-xs font-medium animate-pulse">
              {lobbyRequests.length} ينتظر
            </button>
          )}
          <button onClick={() => setShowQR(true)} title="رمز QR"
            className="p-2 rounded-lg bg-[#3c4043] hover:bg-[#4a4d51] text-[#9aa0a6] transition">
            <QrCode className="w-3.5 h-3.5" />
          </button>
          <button onClick={copyLink} title="نسخ الرابط"
            className="p-2 rounded-lg bg-[#3c4043] hover:bg-[#4a4d51] text-[#9aa0a6] transition">
            {copied ? <Check className="w-3.5 h-3.5 text-black/70 dark:text-white/70" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── QR Code Modal ── */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowQR(false)}>
          <div className="bg-[#292b2f] rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between w-full">
              <span className="text-white font-semibold">رمز QR للانضمام</span>
              <button onClick={() => setShowQR(false)} className="text-[#9aa0a6] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`${window.location.origin}/meet/${roomId}`)}&color=ffffff&bgcolor=292b2f`}
              alt="QR" className="rounded-xl"
              width={220} height={220}
            />
            <div className="text-[#9aa0a6] text-xs text-center break-all max-w-[220px]">
              {`${window.location.origin}/meet/${roomId}`}
            </div>
            <button onClick={copyLink}
              className="w-full py-2 rounded-xl bg-black dark:bg-white hover:bg-black dark:bg-white text-white text-sm font-medium transition flex items-center justify-center gap-2">
              {copied ? <><Check className="w-4 h-4" /> تم النسخ</> : <><Copy className="w-4 h-4" /> نسخ الرابط</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Shared whiteboard ── */}
      {presentationStream && presentationToolsOpen && (
        <PresentationTools stream={presentationStream} model={presentationModelRef.current}
          onClose={() => setPresentationToolsOpen(false)} onStop={() => { void revertToCamera(); }} />
      )}
      {presentationStream && !presentationToolsOpen && meeting?.customization?.features?.annotations !== false && (
        <button className="fixed top-20 left-4 z-40 rounded-xl bg-teal-600 text-white px-4 py-2 shadow-lg"
          onClick={() => setPresentationToolsOpen(true)}>أدوات الشرح على الشاشة</button>
      )}
      {whiteboardOpen && meeting?.customization?.features?.whiteboard !== false && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5"
          onPointerDown={event => { if (event.target === event.currentTarget) setWhiteboardOpen(false); }}>
          <div className="w-full h-full max-w-6xl max-h-[92vh] rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col"
            dir="rtl">
            <div className="shrink-0 px-3 sm:px-4 py-3 border-b border-slate-200 flex items-center gap-2">
              <PenTool className="w-4 h-4 text-slate-700" />
              <span className="font-bold text-sm text-slate-800 flex-1">اللوحة البيضاء</span>
              <div className="flex items-center gap-1.5">
                {["#111827", "#dc2626", "#2563eb", "#16a34a", "#f59e0b"].map(color => (
                  <button key={color} onClick={() => setWhiteboardColor(color)}
                    className={`w-6 h-6 rounded-full border-2 ${whiteboardColor === color ? "border-slate-900 scale-110" : "border-white"}`}
                    style={{ backgroundColor: color }} aria-label={`لون ${color}`} />
                ))}
                <select value={whiteboardWidth} onChange={event => setWhiteboardWidth(Number(event.target.value))}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700">
                  <option value={2}>رفيع</option>
                  <option value={3}>متوسط</option>
                  <option value={6}>عريض</option>
                  <option value={10}>قلم عريض</option>
                </select>
                <button onClick={clearWhiteboard} className="h-8 px-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> مسح
                </button>
                <button onClick={() => setWhiteboardOpen(false)} className="h-8 px-2.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs">
                  إغلاق
                </button>
              </div>
            </div>
            <div className="relative flex-1 min-h-0 bg-white">
              <canvas ref={whiteboardCanvasRef}
                className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
                onPointerDown={startWhiteboardStroke}
                onPointerMove={moveWhiteboardStroke}
                onPointerUp={finishWhiteboardStroke}
                onPointerCancel={finishWhiteboardStroke}
                onPointerLeave={finishWhiteboardStroke} />
              {whiteboardStrokes.length === 0 && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-slate-300 text-sm">
                  ابدأ الرسم أو الشرح هنا — يظهر مباشرة للمشاركين
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex flex-1 gap-2 px-2 pb-2 overflow-hidden min-h-0">

        {/* Video area */}
        {isSpotlight && spotPeer ? (
          <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-hidden">
            <div className="flex-1 rounded-xl overflow-hidden relative min-h-0">
              <VideoTile peer={spotPeer} isSelf={spotPeer.id === myId || spotPeer.id === `${myId}:screen`} speaking={speakingIds.has(spotPeer.id)} mirrored={facingModeRef.current === "user"} />
              {pinnedId && (
                <button onClick={() => setPinnedId(null)}
                  className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs hover:bg-black/80 transition backdrop-blur-sm">
                  إلغاء التثبيت
                </button>
              )}
            </div>
            {thumbPeers.length > 0 && (
              <div className="flex gap-2 shrink-0 overflow-x-auto pb-1" style={{ height: isMobile ? "80px" : "110px" }}>
                {thumbPeers.map(p => (
                  <div key={p.id} onClick={() => setPinnedId(p.id)}
                    className="rounded-lg overflow-hidden relative shrink-0 cursor-pointer hover:ring-2 hover:ring-black/15 dark:ring-white/15 transition"
                    style={{ aspectRatio: "16/9", height: "100%" }}>
                    <VideoTile peer={p} isSelf={p.id === myId || p.id === `${myId}:screen`} speaking={speakingIds.has(p.id)} small mirrored={facingModeRef.current === "user"} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 grid gap-1.5 sm:gap-2 content-center min-h-0"
            style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
            {allPeers.map(p => (
              <div key={p.id}
                onClick={() => { if (total > 1) setPinnedId(p.id); }}
                className={`rounded-xl overflow-hidden relative aspect-video ${total > 1 ? "cursor-pointer" : ""}`}>
                <VideoTile peer={p} isSelf={p.id === myId || p.id === `${myId}:screen`} speaking={speakingIds.has(p.id)} mirrored={facingModeRef.current === "user"} />
              </div>
            ))}
          </div>
        )}

        {/* ── Live Captions Overlay ── */}
        {captionsOn && captions.length > 0 && (
          <div className="pointer-events-none absolute bottom-28 left-0 right-0 px-4 z-30 flex flex-col gap-1" style={{ direction: "rtl" }}>
            {captions.slice(-3).map(cap => (
              <div key={cap.id}
                className={`self-center max-w-[80%] px-4 py-2 rounded-xl text-sm text-white shadow-lg backdrop-blur-sm ${cap.isSelf ? "bg-black dark:bg-white" : "bg-black/70"}`}>
                <span className="font-semibold ml-2 text-xs opacity-70">{cap.name}:</span>{cap.text}
              </div>
            ))}
            <div ref={captionsEndRef} />
          </div>
        )}

        {/* ── Active Poll Widget ── */}
        {activePoll && (
          <div className="absolute top-3 left-3 z-30 bg-[#292b2f]/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-white/10 w-64" style={{ direction: "rtl" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-black/70 dark:text-white/70 text-xs font-semibold flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5" /> استطلاع</span>
              {isRoomHost && <button onClick={endPoll} className="text-[#9aa0a6] hover:text-black/70 dark:text-white/70 text-xs transition">إنهاء</button>}
            </div>
            <p className="text-white text-sm font-medium mb-3 leading-snug">{activePoll.question}</p>
            <div className="space-y-2">
              {activePoll.options.map((opt: PollOption, i: number) => {
                const total = activePoll.options.reduce((sum: number, o: PollOption) => sum + (o.votes ?? 0), 0);
                const pct = total > 0 ? Math.round(((opt.votes ?? 0) / total) * 100) : 0;
                return (
                  <button key={i} onClick={() => votePoll(i)} disabled={myPollVote !== null}
                    className={`w-full text-right px-3 py-2 rounded-xl text-sm transition relative overflow-hidden ${myPollVote === i ? "ring-2 ring-black dark:ring-white" : ""} ${myPollVote !== null ? "cursor-default" : "hover:bg-white/10"} bg-white/5`}>
                    <div className="absolute inset-0 bg-black dark:bg-white transition-all" style={{ width: `${pct}%` }} />
                    <div className="relative flex justify-between">
                      <span className="text-white">{opt.text}</span>
                      {myPollVote !== null && <span className="text-black/70 dark:text-white/70 text-xs">{pct}%</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            {myPollVote !== null && (
              <p className="text-[#9aa0a6] text-xs mt-2 text-center">
                صوّت {activePoll.options.reduce((sum: number, o: PollOption) => sum + (o.votes ?? 0), 0)} مشارك
              </p>
            )}
          </div>
        )}

        {/* ── Poll Creator Modal ── */}
        {showPollCreator && isRoomHost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowPollCreator(false)}>
            <div className="bg-[#292b2f] rounded-2xl p-5 shadow-2xl w-80 space-y-3" onClick={e => e.stopPropagation()} dir={dir}>
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold flex items-center gap-2"><BarChart2 className="w-4 h-4 text-black/70 dark:text-white/70" /> إنشاء استطلاع</span>
                <button onClick={() => setShowPollCreator(false)} className="text-[#9aa0a6] hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <input value={pollQuestion} onChange={e => setPollQuestion(e.target.value)}
                placeholder="السؤال..."
                className="w-full px-3 py-2 rounded-xl bg-[#3c4043] text-white text-sm placeholder:text-[#9aa0a6] outline-none border border-transparent focus:border-black dark:border-white transition" />
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input value={opt} onChange={e => { const a = [...pollOptions]; a[i] = e.target.value; setPollOptions(a); }}
                    placeholder={`خيار ${i + 1}`}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#3c4043] text-white text-sm placeholder:text-[#9aa0a6] outline-none border border-transparent focus:border-black dark:border-white transition" />
                  {pollOptions.length > 2 && (
                    <button onClick={() => setPollOptions(prev => prev.filter((_, j) => j !== i))} className="text-black/70 dark:text-white/70 hover:text-black/70 dark:text-white/70">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 6 && (
                <button onClick={() => setPollOptions(prev => [...prev, ""])}
                  className="w-full py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#9aa0a6] text-sm transition">
                  + إضافة خيار
                </button>
              )}
              <button onClick={createPoll}
                className="w-full py-2.5 rounded-xl bg-black dark:bg-white hover:bg-black dark:bg-white text-white font-medium text-sm transition">
                بدء الاستطلاع
              </button>
            </div>
          </div>
        )}

        {/* ── Recording Download Banner ── */}
        {recordingBlob && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 bg-[#292b2f] rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl border border-white/10">
            <span className="text-white text-sm">التسجيل جاهز</span>
            <button onClick={downloadRecording}
              className="px-3 py-1.5 rounded-lg bg-black dark:bg-white hover:bg-black dark:bg-white text-white text-xs font-medium transition flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> تنزيل
            </button>
            <button onClick={() => setRecordingBlob(null)} className="text-[#9aa0a6] hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Side panel (desktop) */}
        {panel !== "none" && (
          <div className="hidden md:flex w-72 lg:w-80 bg-[#292b2f] rounded-2xl flex-col overflow-hidden shrink-0">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.08] shrink-0">
              <div className="flex gap-0.5 flex-wrap">
                <button onClick={() => { setPanel("chat"); setUnread(0); }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${panel === "chat" ? "bg-black dark:bg-white text-white" : "text-[#9aa0a6] hover:text-white"}`}>
                  الدردشة {unread > 0 && panel !== "chat" && <span className="mr-1 w-4 h-4 rounded-full bg-black dark:bg-white text-[10px] inline-flex items-center justify-center">{unread}</span>}
                </button>
                <button onClick={() => setPanel("participants")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${panel === "participants" ? "bg-black dark:bg-white text-white" : "text-[#9aa0a6] hover:text-white"}`}>
                  المشاركون
                </button>
                <button onClick={showAttendancePanel}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${panel === "attendance" ? "bg-black dark:bg-white text-white" : "text-[#9aa0a6] hover:text-white"}`}>
                  الحضور
                </button>
                <button onClick={() => { setPanel("ai"); if (!aiSummary) getAiSummary(); }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${panel === "ai" ? "bg-black dark:bg-white text-white" : "text-[#9aa0a6] hover:text-white"}`}>
                  AI
                </button>
              </div>
              <button onClick={() => setPanel("none")} className="text-[#9aa0a6] hover:text-white transition shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat */}
            {panel === "chat" && meeting?.customization?.features?.chat !== false && (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {chat.length === 0 && <div className="text-center text-[#9aa0a6] text-sm mt-8">لا توجد رسائل بعد</div>}
                  {chat.map(msg => (
                    <div key={msg.id} className={`flex flex-col gap-0.5 ${msg.isSelf ? "items-end" : "items-start"}`}>
                      <span className="text-[#9aa0a6] text-xs">{msg.isSelf ? "أنت" : msg.name} · {msg.time}</span>
                      <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm text-white leading-relaxed ${msg.isSelf ? "bg-black dark:bg-white" : "bg-[#3c4043]"}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t border-white/[0.08] shrink-0">
                  <div className="flex gap-2 items-center bg-[#3c4043] rounded-full px-4 py-2">
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendChat()}
                      placeholder="اكتب رسالة..." maxLength={500}
                      className="flex-1 bg-transparent text-white text-sm placeholder:text-[#9aa0a6] outline-none"
                      data-testid="input-chat-message" />
                    <button onClick={sendChat} className="text-black/70 dark:text-white/70 hover:text-black/70 dark:text-white/70 transition" data-testid="button-send-chat">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Participants */}
            {panel === "participants" && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {/* Host controls */}
                {isRoomHost && (
                  <div className="mb-3 p-3 rounded-xl bg-black dark:bg-white border border-black dark:border-white space-y-2">
                    <p className="text-black/70 dark:text-white/70 text-xs font-semibold">🎛 أدوات المضيف</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={muteAll}
                        className="flex-1 py-1.5 rounded-lg bg-[#3c4043] hover:bg-[#4a4d51] text-[#9aa0a6] text-xs font-medium transition flex items-center justify-center gap-1">
                        <VolumeX className="w-3.5 h-3.5" /> كتم الجميع
                      </button>
                      <button onClick={toggleLock}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 ${meetingLocked ? "bg-black dark:bg-white text-black/70 dark:text-white/70 hover:bg-black dark:bg-white" : "bg-[#3c4043] hover:bg-[#4a4d51] text-[#9aa0a6]"}`}>
                        {meetingLocked ? <><Lock className="w-3.5 h-3.5" /> مقفل</> : <><LockOpen className="w-3.5 h-3.5" /> قفل</>}
                      </button>
                    </div>
                  </div>
                )}
                {lobbyRequests.length > 0 && (
                  <div className="mb-3 space-y-2">
                    <p className="text-black/70 dark:text-white/70 text-xs font-medium px-1">في الانتظار</p>
                    {lobbyRequests.map(r => (
                      <div key={r.userId} className="bg-black dark:bg-white border border-black dark:border-white rounded-xl p-3">
                        <p className="text-white text-sm font-medium mb-2">{r.userName}</p>
                        <div className="flex gap-2">
                          <button onClick={() => approveLobby(r.userId)}
                            className="flex-1 py-1.5 rounded-lg bg-black dark:bg-white hover:bg-black dark:bg-white text-white text-xs font-medium transition">قبول</button>
                          <button onClick={() => denyLobby(r.userId)}
                            className="flex-1 py-1.5 rounded-lg bg-[#3c4043] hover:bg-black dark:bg-white text-white text-xs font-medium transition">رفض</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {allPeers.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition group">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: avatarColor(p.name) }}>
                      {p.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{p.id === myId ? `${p.name} (أنت)` : p.name}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!p.audioOn && <MicOff className="w-3.5 h-3.5 text-black/70 dark:text-white/70" />}
                      {!p.videoOn && <VideoOff className="w-3.5 h-3.5 text-[#9aa0a6]" />}
                      {p.raisedHand && <span className="text-sm">✋</span>}
                      {/* Host controls per peer */}
                      {isRoomHost && p.id !== myId && (
                        <>
                          <button onClick={() => {
                              if (!confirm(`نقل صلاحية المضيف إلى ${p.name}؟`)) return;
                              sendWs({ type: "webrtc_transfer_host", roomId, targetId: p.id });
                            }} title="نقل المضيف"
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black dark:bg-white text-[#9aa0a6] hover:text-black/70 dark:text-white/70 transition">
                            <Crown className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => mutePeer(p.id)} title="كتم"
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-[#9aa0a6] hover:text-white transition">
                            <VolumeX className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => kickPeer(p.id, p.name)} title="إخراج"
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black dark:bg-white text-[#9aa0a6] hover:text-black/70 dark:text-white/70 transition">
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Attendance */}
            {panel === "attendance" && (
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                <p className="text-[#9aa0a6] text-xs mb-3">سجل حضور الاجتماع</p>
                {attendanceLog.length === 0 ? (
                  <div className="text-center text-[#9aa0a6] text-sm mt-8">لا يوجد سجل بعد</div>
                ) : attendanceLog.map((entry, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${entry.action === "join" ? "bg-black/[0.08] dark:bg-white/[0.1]" : "bg-black/[0.08] dark:bg-white/[0.1]"}`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-white text-sm truncate">{entry.name}</span>
                    </div>
                    <div className="text-[#9aa0a6] text-xs shrink-0">
                      {entry.action === "join" ? "انضم" : "غادر"} · {entry.time}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AI Notes */}
            {panel === "ai" && (
              <div className="flex-1 overflow-y-auto p-3">
                {aiSummaryLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <Loader2 className="w-8 h-8 text-black/70 dark:text-white/70 animate-spin" />
                    <p className="text-[#9aa0a6] text-sm">يُحلّل الاجتماع...</p>
                  </div>
                ) : aiSummary ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-black/70 dark:text-white/70 text-xs font-semibold flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> ملخص الذكاء الاصطناعي</span>
                      <button onClick={getAiSummary} className="text-[#9aa0a6] hover:text-white text-xs transition">تحديث</button>
                    </div>
                    <div className="text-white text-sm leading-relaxed whitespace-pre-wrap bg-[#3c4043]/50 rounded-xl p-3">
                      {aiSummary}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <Sparkles className="w-8 h-8 text-black/70 dark:text-white/70" />
                    <p className="text-[#9aa0a6] text-sm text-center">اضغط لتوليد ملخص ذكي للاجتماع</p>
                    <button onClick={getAiSummary}
                      className="px-4 py-2 rounded-xl bg-black dark:bg-white hover:bg-black dark:bg-white text-white text-sm font-medium transition">
                      توليد الملخص
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile panel overlay */}
      {panel !== "none" && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 flex flex-col justify-end" onClick={() => setPanel("none")}>
          <div className="bg-[#292b2f] rounded-t-2xl max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.08]">
              <div className="flex gap-0.5 flex-wrap">
                <button onClick={() => { setPanel("chat"); setUnread(0); }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${panel === "chat" ? "bg-black dark:bg-white text-white" : "text-[#9aa0a6]"}`}>
                  الدردشة
                </button>
                <button onClick={() => setPanel("participants")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${panel === "participants" ? "bg-black dark:bg-white text-white" : "text-[#9aa0a6]"}`}>
                  المشاركون
                </button>
                <button onClick={showAttendancePanel}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${panel === "attendance" ? "bg-black dark:bg-white text-white" : "text-[#9aa0a6]"}`}>
                  الحضور
                </button>
                <button onClick={() => { setPanel("ai"); if (!aiSummary) getAiSummary(); }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${panel === "ai" ? "bg-black dark:bg-white text-white" : "text-[#9aa0a6]"}`}>
                  AI
                </button>
              </div>
              <button onClick={() => setPanel("none")} className="text-[#9aa0a6]"><X className="w-4 h-4" /></button>
            </div>

            {panel === "chat" && meeting?.customization?.features?.chat !== false && (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {chat.length === 0 && <div className="text-center text-[#9aa0a6] text-sm mt-6">لا توجد رسائل بعد</div>}
                  {chat.map(msg => (
                    <div key={msg.id} className={`flex flex-col gap-0.5 ${msg.isSelf ? "items-end" : "items-start"}`}>
                      <span className="text-[#9aa0a6] text-xs">{msg.isSelf ? "أنت" : msg.name} · {msg.time}</span>
                      <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm text-white ${msg.isSelf ? "bg-black dark:bg-white" : "bg-[#3c4043]"}`}>{msg.text}</div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t border-white/[0.08]">
                  <div className="flex gap-2 items-center bg-[#3c4043] rounded-full px-4 py-2">
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendChat()}
                      placeholder="اكتب رسالة..." maxLength={500}
                      className="flex-1 bg-transparent text-white text-sm placeholder:text-[#9aa0a6] outline-none" />
                    <button onClick={sendChat} className="text-black/70 dark:text-white/70"><Send className="w-4 h-4" /></button>
                  </div>
                </div>
              </>
            )}

            {panel === "participants" && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {isRoomHost && (
                  <div className="mb-3 flex gap-2">
                    <button onClick={muteAll}
                      className="flex-1 py-2 rounded-xl bg-[#3c4043] hover:bg-[#4a4d51] text-[#9aa0a6] text-xs font-medium transition flex items-center justify-center gap-1">
                      <VolumeX className="w-3.5 h-3.5" /> كتم الجميع
                    </button>
                    <button onClick={toggleLock}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1 ${meetingLocked ? "bg-black dark:bg-white text-black/70 dark:text-white/70" : "bg-[#3c4043] text-[#9aa0a6]"}`}>
                      {meetingLocked ? <><Lock className="w-3.5 h-3.5" /> مقفل</> : <><LockOpen className="w-3.5 h-3.5" /> قفل</>}
                    </button>
                  </div>
                )}
                {allPeers.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: avatarColor(p.name) }}>
                      {p.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <p className="flex-1 text-white text-sm truncate">{p.id === myId ? `${p.name} (أنت)` : p.name}</p>
                    <div className="flex items-center gap-1.5">
                      {!p.audioOn && <MicOff className="w-3.5 h-3.5 text-black/70 dark:text-white/70" />}
                      {!p.videoOn && <VideoOff className="w-3.5 h-3.5 text-[#9aa0a6]" />}
                      {p.raisedHand && <span>✋</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {panel === "attendance" && (
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                <p className="text-[#9aa0a6] text-xs mb-2">سجل الحضور</p>
                {attendanceLog.length === 0 ? (
                  <div className="text-center text-[#9aa0a6] text-sm mt-6">لا يوجد سجل بعد</div>
                ) : attendanceLog.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${entry.action === "join" ? "bg-black/[0.08] dark:bg-white/[0.1]" : "bg-black/[0.08] dark:bg-white/[0.1]"}`} />
                    <span className="text-white text-xs flex-1 truncate">{entry.name}</span>
                    <span className="text-[#9aa0a6] text-xs">{entry.action === "join" ? "انضم" : "غادر"} · {entry.time}</span>
                  </div>
                ))}
              </div>
            )}

            {panel === "ai" && (
              <div className="flex-1 overflow-y-auto p-3">
                {aiSummaryLoading ? (
                  <div className="flex flex-col items-center justify-center h-32 gap-3">
                    <Loader2 className="w-7 h-7 text-black/70 dark:text-white/70 animate-spin" />
                    <p className="text-[#9aa0a6] text-sm">يُحلّل الاجتماع...</p>
                  </div>
                ) : aiSummary ? (
                  <div className="space-y-2">
                    <span className="text-black/70 dark:text-white/70 text-xs font-semibold flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> ملخص AI</span>
                    <div className="text-white text-sm leading-relaxed whitespace-pre-wrap">{aiSummary}</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 mt-4">
                    <button onClick={getAiSummary}
                      className="px-4 py-2 rounded-xl bg-black dark:bg-white hover:bg-black dark:bg-white text-white text-sm font-medium transition">
                      توليد الملخص
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#3c4043] rounded-2xl p-3 shadow-2xl">
            <div className="flex gap-2 flex-wrap justify-center max-w-[220px]">
              {["👍","❤️","😂","😮","😢","🎉","🔥","👏","💯","🙏"].map(e => (
                <button key={e} onClick={() => sendReaction(e)}
                  className="text-2xl hover:scale-125 transition-transform p-1">{e}</button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Control bar ── */}
      <div className="shrink-0 bg-[#202124] pb-safe">
        {/* Mobile: secondary row */}
        <div className="flex md:hidden items-center justify-center gap-3 py-2 px-4">
          <button disabled={meeting?.customization?.features?.whiteboard === false} onClick={() => setWhiteboardOpen(true)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition ${whiteboardOpen ? "bg-black dark:bg-white" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}
            title="اللوحة البيضاء">
            <PenTool className="w-4 h-4 text-[#9aa0a6]" />
          </button>
          <button onClick={toggleScreen}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition ${screenSharing || ["waiting", "starting", "broadcasting", "stopping"].includes(nativeScreenShareState) ? "bg-black dark:bg-white" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}
            data-testid="button-toggle-screen">
            <Monitor className={`w-4 h-4 ${screenSharing || ["waiting", "starting", "broadcasting", "stopping"].includes(nativeScreenShareState) ? "text-white" : "text-[#9aa0a6]"}`} />
          </button>
          <button onClick={toggleHand}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition ${raisedHand ? "bg-black dark:bg-white" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}>
            <Hand className={`w-4 h-4 ${raisedHand ? "text-white" : "text-[#9aa0a6]"}`} />
          </button>
          <button onClick={() => setShowEmojiPicker(s => !s)}
            className="w-10 h-10 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center transition">
            <Smile className="w-4 h-4 text-[#9aa0a6]" />
          </button>
          {isRoomHost && (
            <button onClick={muteAll}
              className="w-10 h-10 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center transition">
              <MicOff className="w-4 h-4 text-[#9aa0a6]" />
            </button>
          )}
          {isRoomHost && (
            <button
              onClick={() => {
                if (confirm("هل تريد إنهاء الاجتماع للجميع المشاركين؟")) {
                  sendWs({ type: "webrtc_end_meeting", roomId });
                  wsRef.current?.close();
                  pcsRef.current.forEach(pc => pc.close());
                  localStreamRef.current?.getTracks().forEach(t => t.stop());
                  navigate("/qmeet");
                }
              }}
              className="w-10 h-10 rounded-full bg-black dark:bg-white hover:bg-black dark:bg-white flex items-center justify-center transition"
              title="إنهاء للجميع"
              data-testid="button-end-for-all-mobile">
              <XCircle className="w-4 h-4 text-black/70 dark:text-white/70" />
            </button>
          )}
          <button onClick={() => { setLayout(l => l === "grid" ? "spotlight" : "grid"); setPinnedId(null); }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition ${isSpotlight ? "bg-black dark:bg-white" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}>
            {isSpotlight ? <Grid3X3 className="w-4 h-4 text-white" /> : <Maximize2 className="w-4 h-4 text-[#9aa0a6]" />}
          </button>
        </div>

        {/* Main control row */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left / Desktop secondary */}
          <div className="hidden md:flex items-center gap-2 w-44">
            <button disabled={meeting?.customization?.features?.whiteboard === false} onClick={() => setWhiteboardOpen(true)} title="اللوحة البيضاء"
              className="w-10 h-10 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center transition">
              <PenTool className="w-4 h-4 text-[#9aa0a6]" />
            </button>
            <button onClick={toggleScreen}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition ${screenSharing || ["waiting", "starting", "broadcasting", "stopping"].includes(nativeScreenShareState) ? "bg-black dark:bg-white" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}
              data-testid="button-toggle-screen">
              <Monitor className={`w-4 h-4 ${screenSharing || ["waiting", "starting", "broadcasting", "stopping"].includes(nativeScreenShareState) ? "text-white" : "text-[#9aa0a6]"}`} />
            </button>
            <button onClick={toggleHand}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition ${raisedHand ? "bg-black dark:bg-white" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}>
              <Hand className={`w-4 h-4 ${raisedHand ? "text-white" : "text-[#9aa0a6]"}`} />
            </button>
            <button onClick={() => setShowEmojiPicker(s => !s)}
              className="w-10 h-10 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center transition">
              <Smile className="w-4 h-4 text-[#9aa0a6]" />
            </button>
            {isRoomHost && (
              <button onClick={muteAll}
                className="w-10 h-10 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center transition" title="كتم الجميع">
                <MicOff className="w-4 h-4 text-[#9aa0a6]" />
              </button>
            )}
          </div>

          {/* Center: primary controls */}
          <div className="flex items-center gap-3">
            <button onClick={toggleAudio}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg ${audioOn ? "bg-[#3c4043] hover:bg-[#4a4d51]" : "bg-black dark:bg-white hover:bg-black dark:bg-white"}`}
              data-testid="button-toggle-audio">
              {audioOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
            </button>
            <button onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg ${videoOn ? "bg-[#3c4043] hover:bg-[#4a4d51]" : "bg-black dark:bg-white hover:bg-black dark:bg-white"}`}
              data-testid="button-toggle-video">
              {videoOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
            </button>
            {/* Flip camera — visible when video is on and not screen sharing */}
            {videoOn && !screenSharing && (
              <button onClick={flipCamera} disabled={flippingCamera}
                className="w-10 h-10 rounded-full flex items-center justify-center transition shadow-lg bg-[#3c4043] hover:bg-[#4a4d51] disabled:opacity-40"
                title="قلب الكاميرا"
                data-testid="button-flip-camera">
                {flippingCamera
                  ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                  : <FlipHorizontal2 className="w-4 h-4 text-[#9aa0a6]" />}
              </button>
            )}
            <button onClick={leave}
              className="w-14 h-12 rounded-full bg-black dark:bg-white hover:bg-black dark:bg-white flex items-center justify-center transition shadow-lg"
              title="مغادرة الاجتماع"
              data-testid="button-leave">
              <PhoneOff className="w-5 h-5 text-white" />
            </button>
            {isRoomHost && (
              <button
                onClick={() => {
                  if (confirm("هل تريد إنهاء الاجتماع للجميع المشاركين؟")) {
                    sendWs({ type: "webrtc_end_meeting", roomId });
                    wsRef.current?.close();
                    pcsRef.current.forEach(pc => pc.close());
                    localStreamRef.current?.getTracks().forEach(t => t.stop());
                    navigate("/qmeet");
                  }
                }}
                className="px-3 h-12 rounded-full bg-black dark:bg-white hover:bg-black dark:bg-white flex items-center justify-center gap-1.5 transition shadow-lg text-white text-xs font-semibold"
                title="إنهاء الاجتماع للجميع"
                data-testid="button-end-for-all">
                <XCircle className="w-4 h-4" />
                <span className="hidden sm:block">إنهاء للجميع</span>
              </button>
            )}
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center gap-2 justify-end">
            <button onClick={() => setWhiteboardOpen(true)} title="اللوحة البيضاء"
              className="w-10 h-10 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center transition">
              <PenTool className="w-4 h-4 text-[#9aa0a6]" />
            </button>
            <button onClick={toggleCaptions} title="تعليقات مباشرة"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition ${captionsOn ? "bg-black dark:bg-white" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}>
              <Subtitles className={`w-4 h-4 ${captionsOn ? "text-white" : "text-[#9aa0a6]"}`} />
            </button>
            <button onClick={toggleRecording} title={recording ? "إيقاف التسجيل" : "بدء التسجيل"}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition ${recording ? "bg-black dark:bg-white animate-pulse" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}>
              <CircleDot className={`w-4 h-4 ${recording ? "text-white" : "text-[#9aa0a6]"}`} />
            </button>
            {isRoomHost && (
              <button onClick={() => setShowPollCreator(true)} title="استطلاع"
                className="w-10 h-10 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center transition">
                <BarChart2 className="w-4 h-4 text-[#9aa0a6]" />
              </button>
            )}
            <button onClick={() => { setLayout(l => l === "grid" ? "spotlight" : "grid"); setPinnedId(null); }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition ${isSpotlight ? "bg-black dark:bg-white" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}
              title={isSpotlight ? "وضع الشبكة" : "وضع التركيز"}>
              {isSpotlight ? <Grid3X3 className="w-4 h-4 text-white" /> : <Maximize2 className="w-4 h-4 text-[#9aa0a6]" />}
            </button>
            <button onClick={() => { setPanel(p => p === "chat" ? "none" : "chat"); setUnread(0); }}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition relative ${panel === "chat" ? "bg-black dark:bg-white" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}
              data-testid="button-toggle-chat">
              <MessageSquare className="w-5 h-5 text-white" />
              {unread > 0 && <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black dark:bg-white text-white text-[10px] flex items-center justify-center font-bold">{unread}</span>}
            </button>
            <button onClick={() => setPanel(p => p === "participants" ? "none" : "participants")}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition ${panel === "participants" ? "bg-black dark:bg-white" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}
              data-testid="button-toggle-participants">
              <Users className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Mobile: chat + participants + recording */}
          <div className="flex md:hidden items-center gap-2">
            <button onClick={toggleRecording} title={recording ? "إيقاف التسجيل" : "تسجيل"}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition ${recording ? "bg-black dark:bg-white animate-pulse" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}>
              <CircleDot className={`w-4 h-4 ${recording ? "text-white" : "text-[#9aa0a6]"}`} />
            </button>
            <button onClick={() => { setPanel(p => p === "chat" ? "none" : "chat"); setUnread(0); }}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition relative ${panel === "chat" ? "bg-black dark:bg-white" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}>
              <MessageSquare className="w-5 h-5 text-white" />
              {unread > 0 && <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black dark:bg-white text-[10px] flex items-center justify-center font-bold text-white">{unread}</span>}
            </button>
            <button onClick={() => setPanel(p => p === "participants" ? "none" : "participants")}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition ${panel === "participants" ? "bg-black dark:bg-white" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}>
              <Users className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
