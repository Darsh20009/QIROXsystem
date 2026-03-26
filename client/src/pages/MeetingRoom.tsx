import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Mic, MicOff, Video, VideoOff, Monitor, PhoneOff,
  MessageSquare, Users, Copy, Check, Loader2, Send,
  Hand, Grid3X3, Maximize2, Smile, X,
  Lock, LockOpen, UserX, VolumeX, BarChart2, Subtitles,
  CircleDot, Download, QrCode, Sparkles,
} from "lucide-react";

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

const STUN: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];
async function getIce(): Promise<RTCIceServer[]> {
  try {
    const r = await fetch("/api/ice-servers");
    if (r.ok) return await r.json();
  } catch {}
  return STUN;
}

// ── types ────────────────────────────────────────────────────────────────────

interface PeerState {
  id: string;
  name: string;
  stream: MediaStream | null;
  audioOn: boolean;
  videoOn: boolean;
  photoUrl?: string;
  raisedHand?: boolean;
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

// ── VideoTile ────────────────────────────────────────────────────────────────

function VideoTile({
  peer, isSelf, speaking, small,
}: {
  peer: PeerState; isSelf: boolean; speaking: boolean; small?: boolean;
}) {
  const vidRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = vidRef.current;
    if (!el) return;
    if (peer.stream) {
      el.srcObject = peer.stream;
      el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
  }, [peer.stream]);

  const showVideo = !!(peer.stream && peer.videoOn);
  const bg = avatarColor(peer.name);
  const label = isSelf ? "أنت" : peer.name;

  return (
    <div className={`relative w-full h-full bg-[#3c4043] rounded-xl overflow-hidden flex items-center justify-center
      ${speaking && peer.audioOn ? "ring-2 ring-green-400" : ""}`}>
      {showVideo
        ? <video ref={vidRef} autoPlay playsInline muted={isSelf}
            className="w-full h-full object-cover"
            style={{ transform: isSelf ? "scaleX(-1)" : undefined }} />
        : <div className="flex flex-col items-center gap-1">
            <div className="rounded-full flex items-center justify-center font-bold text-white"
              style={{ background: bg, width: small ? 44 : 80, height: small ? 44 : 80, fontSize: small ? 18 : 30 }}>
              {peer.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          </div>
      }
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/70 to-transparent flex items-center gap-1">
        {!peer.audioOn && <MicOff className={`${small ? "w-3 h-3" : "w-3.5 h-3.5"} text-red-400 shrink-0`} />}
        {peer.raisedHand && <span className={small ? "text-xs" : "text-sm"}>✋</span>}
        {speaking && peer.audioOn && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />}
        <span className={`text-white font-medium truncate ${small ? "text-[10px]" : "text-xs"}`}>{label}</span>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function MeetingRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const [, navigate] = useLocation();
  const { data: user } = useUser();
  const { toast } = useToast();

  // identity
  const userId = (user as any)?._id || (user as any)?.id || "";
  const defaultName = (user as any)?.fullName || (user as any)?.username || "";
  const [guestName, setGuestName] = useState("");
  const userName = defaultName || guestName || "مشارك";
  const isHost = !!(user && userId);

  // meeting data
  const { data: meeting } = useQuery<any>({
    queryKey: ["/api/qmeet/room", roomId],
    queryFn: () => fetch(`/api/qmeet/room/${roomId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!roomId,
    retry: 2,
  });

  // ── core state ─────────────────────────────────────────────────────────────
  const [joined, setJoined] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, PeerState>>(new Map());
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
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
  const [copied, setCopied] = useState(false);
  const [floatReactions, setFloatReactions] = useState<{ id: string; emoji: string }[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

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

  // ── refs ───────────────────────────────────────────────────────────────────
  const myIdRef = useRef<string>("");          // effective user ID (logged-in or guest-xxx)
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
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
  // Recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  // Captions
  const speechRef = useRef<any>(null);
  const captionsEndRef = useRef<HTMLDivElement>(null);
  // Chat/captions for AI summary
  const captionsLogRef = useRef<CaptionEntry[]>([]);

  // Keep refs in sync with state
  useEffect(() => { audioOnRef.current = audioOn; }, [audioOn]);
  useEffect(() => { videoOnRef.current = videoOn; }, [videoOn]);

  // resize
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
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
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
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
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const addStreamToPc = (pc: RTCPeerConnection, stream: MediaStream) => {
    stream.getTracks().forEach(track => {
      const existing = pc.getSenders().find(s => s.track?.kind === track.kind);
      if (existing) existing.replaceTrack(track).catch(() => {});
      else pc.addTrack(track, stream);
    });
  };

  const createPc = useCallback(async (peerId: string, isInitiator: boolean): Promise<RTCPeerConnection> => {
    // Close any existing connection
    pcsRef.current.get(peerId)?.close();
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
    pcsRef.current.set(peerId, pc);

    // Add local tracks
    if (localStreamRef.current) addStreamToPc(pc, localStreamRef.current);

    // ICE candidates
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) sendWs({ type: "webrtc_ice", to: peerId, candidate: candidate.toJSON() });
    };

    // Remote stream
    pc.ontrack = (evt) => {
      const stream = evt.streams[0] || new MediaStream([evt.track]);
      setPeers(prev => {
        const m = new Map(prev);
        const existing = m.get(peerId);
        if (existing) {
          m.set(peerId, { ...existing, stream });
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

    // Connection state
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        pcsRef.current.delete(peerId);
        setPeers(prev => { const m = new Map(prev); m.delete(peerId); return m; });
      }
    };

    // Flush pending ICE
    pc.onsignalingstatechange = () => {
      if (pc.signalingState === "stable") {
        const candidates = pendingIce.current.get(peerId) || [];
        pendingIce.current.delete(peerId);
        candidates.forEach(c => pc.addIceCandidate(c).catch(() => {}));
      }
    };

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendWs({ type: "webrtc_offer", to: peerId, offer: pc.localDescription });
    }

    return pc;
  }, [sendWs]);

  // ── WebSocket message handler ──────────────────────────────────────────────

  const handleMessage = useCallback(async (raw: string) => {
    let msg: any;
    try { msg = JSON.parse(raw); } catch { return; }

    const myId = myIdRef.current;

    // ── Lobby ────────────────────────────────────────────────────────────────
    if (msg.type === "webrtc_lobby_waiting") {
      setLobbyWaiting(true);
      return;
    }
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
    if (msg.type === "webrtc_banned") {
      toast({ title: "تم حظرك من هذا الاجتماع", variant: "destructive" });
      navigate("/qmeet");
      return;
    }
    if (msg.type === "webrtc_room_locked") {
      toast({ title: "الاجتماع مقفل", description: "لا يمكن الانضمام حاليًا — انتظر أن يفتح المضيف الاجتماع", variant: "destructive" });
      navigate("/qmeet");
      return;
    }
    if (msg.type === "webrtc_room_lock_changed") {
      setMeetingLocked(!!msg.locked);
      toast({ title: msg.locked ? "🔒 الاجتماع مقفل" : "🔓 الاجتماع مفتوح" });
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
              if (!m.has(p.userId)) {
                m.set(p.userId, { id: p.userId, name: p.name, stream: null, audioOn: true, videoOn: true, photoUrl: p.photoUrl });
              }
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
      for (const peerId of existingIds) {
        if (peerId !== myId) await createPc(peerId, true);
      }
      return;
    }

    // ── Someone new joined (we are existing = NOT initiator) ─────────────────
    if (msg.type === "webrtc_peer_joined") {
      const peerId: string = msg.peerId;
      if (peerId === myId) return;
      peerNamesRef.current.set(peerId, msg.name || peerId);
      setPeers(prev => {
        const m = new Map(prev);
        if (!m.has(peerId)) {
          m.set(peerId, { id: peerId, name: msg.name || peerId, stream: null, audioOn: true, videoOn: true, photoUrl: msg.photoUrl });
        }
        return m;
      });
      // Create PC but DO NOT initiate — wait for their offer
      const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
      pcsRef.current.get(peerId)?.close();
      pcsRef.current.set(peerId, pc);
      if (localStreamRef.current) addStreamToPc(pc, localStreamRef.current);
      pc.onicecandidate = ({ candidate }) => {
        if (candidate) sendWs({ type: "webrtc_ice", to: peerId, candidate: candidate.toJSON() });
      };
      pc.ontrack = (evt) => {
        const stream = evt.streams[0] || new MediaStream([evt.track]);
        setPeers(prev => {
          const m = new Map(prev);
          const ex = m.get(peerId);
          m.set(peerId, { ...(ex || { id: peerId, name: msg.name || peerId, audioOn: true, videoOn: true }), stream });
          return m;
        });
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          pcsRef.current.delete(peerId);
          setPeers(prev => { const m = new Map(prev); m.delete(peerId); return m; });
        }
      };
      pc.onsignalingstatechange = () => {
        if (pc.signalingState === "stable") {
          const cands = pendingIce.current.get(peerId) || [];
          pendingIce.current.delete(peerId);
          cands.forEach(c => pc.addIceCandidate(c).catch(() => {}));
        }
      };
      return;
    }

    // ── Peer left ─────────────────────────────────────────────────────────────
    if (msg.type === "webrtc_peer_left") {
      const peerId: string = msg.peerId;
      pcsRef.current.get(peerId)?.close();
      pcsRef.current.delete(peerId);
      pendingIce.current.delete(peerId);
      peerNamesRef.current.delete(peerId);
      setPeers(prev => { const m = new Map(prev); m.delete(peerId); return m; });
      return;
    }

    // ── Offer received (we are existing peer, newcomer sent this) ─────────────
    if (msg.type === "webrtc_offer") {
      const peerId: string = msg.from;
      let pc = pcsRef.current.get(peerId);
      if (!pc) {
        // Shouldn't happen but create a receiving PC just in case
        pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
        pcsRef.current.set(peerId, pc);
        if (localStreamRef.current) addStreamToPc(pc, localStreamRef.current);
        pc.onicecandidate = ({ candidate }) => {
          if (candidate) sendWs({ type: "webrtc_ice", to: peerId, candidate: candidate.toJSON() });
        };
        pc.ontrack = (evt) => {
          const stream = evt.streams[0] || new MediaStream([evt.track]);
          setPeers(prev => {
            const m = new Map(prev);
            const ex = m.get(peerId);
            m.set(peerId, { ...(ex || { id: peerId, name: peerNamesRef.current.get(peerId) || peerId, audioOn: true, videoOn: true }), stream });
            return m;
          });
        };
        pc.onconnectionstatechange = () => {
          if (pc!.connectionState === "failed" || pc!.connectionState === "closed") {
            pcsRef.current.delete(peerId);
            setPeers(prev => { const m = new Map(prev); m.delete(peerId); return m; });
          }
        };
      }
      await pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
      // Flush buffered ICE candidates
      const cands = pendingIce.current.get(peerId) || [];
      pendingIce.current.delete(peerId);
      for (const c of cands) await pc.addIceCandidate(c).catch(() => {});
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendWs({ type: "webrtc_answer", to: peerId, answer: pc.localDescription });
      return;
    }

    // ── Answer received ────────────────────────────────────────────────────────
    if (msg.type === "webrtc_answer") {
      const pc = pcsRef.current.get(msg.from);
      if (pc && pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
        // Flush buffered ICE
        const cands = pendingIce.current.get(msg.from) || [];
        pendingIce.current.delete(msg.from);
        for (const c of cands) await pc.addIceCandidate(c).catch(() => {});
      }
      return;
    }

    // ── ICE candidate ──────────────────────────────────────────────────────────
    if (msg.type === "webrtc_ice") {
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
      if (panel !== "chat") setUnread(n => n + 1);
      return;
    }

    // ── Media state ────────────────────────────────────────────────────────────
    if (msg.type === "webrtc_media_state") {
      setPeers(prev => {
        const m = new Map(prev);
        const p = m.get(msg.from);
        if (p) m.set(msg.from, { ...p, audioOn: !!msg.audio, videoOn: !!msg.video });
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
      setFloatReactions(prev => [...prev, { id, emoji: msg.emoji }]);
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
  }, [createPc, navigate, sendWs, toast, roomId]);

  // ── Join meeting ───────────────────────────────────────────────────────────

  const joinMeeting = useCallback(async () => {
    if (!roomId) return;

    // Determine effective ID
    const effectiveId = userId || `guest-${Date.now()}`;
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

    // Load ICE servers
    iceServersRef.current = await getIce();

    // Connect WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "auth", userId: effectiveId }));
      ws.send(JSON.stringify({
        type: "webrtc_join",
        roomId,
        name: userName,
        photoUrl: (user as any)?.photoUrl || "",
      }));
    };
    ws.onmessage = (e) => handleMessage(e.data);
    ws.onclose = () => {};
    ws.onerror = () => {};

    setJoined(true);
  }, [roomId, userId, userName, user, getMedia, handleMessage]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      pcsRef.current.forEach(pc => pc.close());
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close().catch(() => {});
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
    // Force React to re-render local video
    setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
  }, []);

  const toggleAudio = useCallback(async () => {
    const on = !audioOnRef.current;

    if (on) {
      // Turning ON — check if existing audio tracks are live
      const existingAudio = localStreamRef.current?.getAudioTracks() ?? [];
      const liveTrack = existingAudio.find(t => t.readyState === "live");
      if (liveTrack) {
        liveTrack.enabled = true;
      } else {
        // Track ended or missing — request a fresh audio track
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          const newAudio = newStream.getAudioTracks()[0];
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
  }, [roomId, sendWs, toast, replaceTrackInPcs]);

  const toggleVideo = useCallback(async () => {
    if (screenSharing) return;
    const on = !videoOnRef.current;

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
  }, [screenSharing, roomId, sendWs, toast, replaceTrackInPcs]);

  const toggleScreen = useCallback(async () => {
    if (screenSharing) {
      // Stop screen share, revert to camera
      // Only request a new camera video track — keep existing audio tracks
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const camTrack = camStream.getVideoTracks()[0];
        camTrack.enabled = videoOnRef.current;

        if (localStreamRef.current) {
          // Stop old screen track(s)
          localStreamRef.current.getVideoTracks().forEach(t => t.stop());
          // Swap video track in stream
          localStreamRef.current.getVideoTracks().forEach(t => localStreamRef.current!.removeTrack(t));
          localStreamRef.current.addTrack(camTrack);
        } else {
          localStreamRef.current = camStream;
        }
        // Replace in PCs
        pcsRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === "video");
          if (sender) sender.replaceTrack(camTrack).catch(() => {});
        });
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      } catch {
        toast({ title: "تعذّر العودة للكاميرا", variant: "destructive" });
      }
      setScreenSharing(false);
      sendWs({ type: "webrtc_screen_share", roomId, active: false, name: userName });
    } else {
      const isMob = /Android|iPhone|iPad/i.test(navigator.userAgent);
      if (isMob) {
        toast({ title: "مشاركة الشاشة متاحة على الكمبيوتر فقط" });
        return;
      }
      try {
        const screen = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
        const screenTrack = screen.getVideoTracks()[0];
        // Stop existing camera video tracks
        if (localStreamRef.current) {
          localStreamRef.current.getVideoTracks().forEach(t => t.stop());
          localStreamRef.current.getVideoTracks().forEach(t => localStreamRef.current!.removeTrack(t));
          localStreamRef.current.addTrack(screenTrack);
        }
        // Replace video track in all PCs
        pcsRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === "video");
          if (sender) sender.replaceTrack(screenTrack).catch(() => {});
        });
        if (localStreamRef.current) setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        // When the user stops sharing from the browser UI
        screenTrack.onended = () => {
          setScreenSharing(false);
          sendWs({ type: "webrtc_screen_share", roomId, active: false, name: userName });
        };
        setScreenSharing(true);
        sendWs({ type: "webrtc_screen_share", roomId, active: true, name: userName });
      } catch (e: any) {
        if (e?.name !== "NotAllowedError") toast({ title: "تعذّر مشاركة الشاشة", variant: "destructive" });
      }
    }
  }, [screenSharing, roomId, sendWs, toast, userName]);

  const toggleHand = useCallback(() => {
    const on = !raisedHand;
    setRaisedHand(on);
    sendWs({ type: "webrtc_raise_hand", roomId, raised: on, name: userName, userId: myIdRef.current });
  }, [raisedHand, roomId, userName, sendWs]);

  const sendReaction = useCallback((emoji: string) => {
    const id = `${Date.now()}-local`;
    setFloatReactions(prev => [...prev, { id, emoji }]);
    setTimeout(() => setFloatReactions(prev => prev.filter(r => r.id !== id)), 3000);
    sendWs({ type: "webrtc_reaction", roomId, emoji, name: userName, userId: myIdRef.current });
    setShowEmojiPicker(false);
  }, [roomId, userName, sendWs]);

  const muteAll = useCallback(() => {
    sendWs({ type: "webrtc_mute_all", roomId });
    toast({ title: "تم كتم جميع المشاركين" });
  }, [roomId, sendWs, toast]);

  const sendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    const time = new Date().toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" });
    const msg: ChatMsg = { id: `${Date.now()}-self`, fromId: myIdRef.current, name: userName, text: chatInput.trim(), time, isSelf: true };
    setChat(prev => [...prev, msg]);
    sendWs({ type: "webrtc_chat", roomId, text: chatInput.trim(), name: userName });
    setChatInput("");
  }, [chatInput, userName, roomId, sendWs]);

  const leave = useCallback(() => {
    sendWs({ type: "webrtc_leave", roomId });
    wsRef.current?.close();
    pcsRef.current.forEach(pc => pc.close());
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    navigate("/qmeet");
  }, [roomId, sendWs, navigate]);

  const copyLink = useCallback(() => {
    const url = `${window.location.origin}/meet/${roomId}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [roomId]);

  const approveLobby = useCallback((reqUserId: string) => {
    sendWs({ type: "webrtc_approve_lobby", roomId, targetId: reqUserId });
    fetch(`/api/qmeet/room/${roomId}/approve-join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId: reqUserId }),
    }).catch(() => {});
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

  // ── Recording (MediaRecorder) ────────────────────────────────────────────
  const toggleRecording = useCallback(async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    if (!localStreamRef.current) {
      toast({ title: "لا يوجد stream للتسجيل", variant: "destructive" });
      return;
    }
    try {
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(localStreamRef.current, { mimeType: "video/webm;codecs=vp8,opus" });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        setRecordingBlob(blob);
        setRecording(false);
        toast({ title: "✅ التسجيل جاهز للتنزيل" });
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordingBlob(null);
      toast({ title: "⏺ بدأ التسجيل" });
    } catch {
      toast({ title: "تعذّر بدء التسجيل", variant: "destructive" });
    }
  }, [recording, toast]);

  const downloadRecording = useCallback(() => {
    if (!recordingBlob) return;
    const url = URL.createObjectURL(recordingBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meeting-${roomId}-${Date.now()}.webm`;
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

  const myId = myIdRef.current || "local";
  const localPeer: PeerState = {
    id: myId, name: userName,
    stream: localStream, audioOn, videoOn, raisedHand,
  };
  const allPeers: PeerState[] = [localPeer, ...[...peers.values()]];
  const total = allPeers.length;

  const isSpotlight = layout === "spotlight" || pinnedId !== null;
  const spotPeer = pinnedId ? (allPeers.find(p => p.id === pinnedId) ?? allPeers[0]) : (allPeers.find(p => speakingIds.has(p.id)) ?? allPeers[0]);
  const thumbPeers = allPeers.filter(p => p.id !== spotPeer?.id);

  const gridCols = isMobile ? 1 : (total <= 1 ? 1 : total === 2 ? 2 : total <= 4 ? 2 : total <= 6 ? 3 : 4);

  // ── PRE-JOIN SCREEN ────────────────────────────────────────────────────────
  if (!joined) {
    return (
      <div className="min-h-screen bg-[#202124] flex flex-col items-center justify-center px-4" dir="rtl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-white text-2xl font-bold">{meeting?.title || "اجتماع"}</h1>
          <p className="text-[#9aa0a6] text-sm mt-1">تحقق من إعداداتك قبل الانضمام</p>
        </div>

        <div className="w-full max-w-3xl flex flex-col lg:flex-row gap-6 items-center">
          {/* Camera preview */}
          <div className="w-full lg:flex-1 bg-[#3c4043] rounded-2xl overflow-hidden relative"
            style={{ aspectRatio: "16/9", maxHeight: "42vh" }}>
            {localStream && videoOn
              ? <video ref={el => { if (el && localStream) { el.srcObject = localStream; el.play().catch(() => {}); }}}
                  autoPlay muted playsInline className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
              : <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl font-bold text-white"
                    style={{ background: avatarColor(userName) }}>
                    {userName?.charAt(0)?.toUpperCase() || "م"}
                  </div>
                  <span className="text-[#9aa0a6] text-sm">{mediaError || "الكاميرا مغلقة"}</span>
                </div>
            }
            {/* Controls overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
              <button onClick={toggleAudio}
                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition ${audioOn ? "bg-black/50 hover:bg-black/70 backdrop-blur-sm" : "bg-red-600 hover:bg-red-700"}`}>
                {audioOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
              </button>
              <button onClick={toggleVideo}
                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition ${videoOn ? "bg-black/50 hover:bg-black/70 backdrop-blur-sm" : "bg-red-600 hover:bg-red-700"}`}>
                {videoOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
              </button>
            </div>
          </div>

          {/* Join card */}
          <div className="w-full lg:w-72 flex flex-col gap-3">

            {/* Media error / permission warning */}
            {mediaError && (
              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 space-y-2">
                <p className="text-yellow-300 text-xs leading-relaxed">{mediaError}</p>
                <button onClick={() => getMedia()}
                  className="w-full py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 text-xs font-medium transition">
                  أعد المحاولة
                </button>
              </div>
            )}

            {/* HTTPS warning */}
            {window.location.protocol !== "https:" && window.location.hostname !== "localhost" && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs leading-relaxed">
                ⚠️ يجب فتح الاجتماع عبر HTTPS (الرابط المنشور) لاستخدام الكاميرا والميكروفون
              </div>
            )}

            {/* Name input for guests */}
            {!defaultName && (
              <div>
                <label className="text-[#9aa0a6] text-xs mb-1.5 block">اسمك</label>
                <input
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (guestName.trim() || defaultName) && joinMeeting()}
                  placeholder="أدخل اسمك"
                  maxLength={40}
                  className="w-full px-4 py-3 rounded-xl bg-[#3c4043] text-white placeholder:text-[#9aa0a6] outline-none border border-transparent focus:border-blue-500 transition"
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

            {/* Join button */}
            <button
              onClick={joinMeeting}
              disabled={!defaultName && !guestName.trim()}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-base transition"
              data-testid="button-join-meeting"
            >
              انضمام الآن
            </button>

            {/* Browser compatibility note */}
            <p className="text-[#9aa0a6] text-xs text-center leading-relaxed">
              يعمل على Chrome · Firefox · Safari · Edge
            </p>

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
      <div className="min-h-screen flex items-center justify-center bg-[#202124]" dir="rtl">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto" />
          <h2 className="text-white text-xl font-semibold">في انتظار الموافقة</h2>
          <p className="text-[#9aa0a6]">سيتم قبولك قريباً من قِبل المضيف</p>
          <button onClick={leave} className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition">
            إلغاء
          </button>
        </div>
      </div>
    );
  }

  // ── MEETING ROOM ───────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-[#202124] overflow-hidden relative select-none" dir="rtl">

      {/* Floating emoji reactions */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {floatReactions.map(r => (
          <div key={r.id} className="absolute bottom-32 left-1/2 text-4xl animate-bounce" style={{ animationDuration: "0.6s", left: `${20 + Math.random() * 60}%` }}>
            {r.emoji}
          </div>
        ))}
      </div>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0 bg-[#202124]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-white font-medium text-sm truncate max-w-[120px] sm:max-w-none">{meeting?.title || "اجتماع"}</span>
          <span className="text-[#9aa0a6] text-xs tabular-nums shrink-0">{timer}</span>
          {meetingLocked && <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          {recording && <span className="flex items-center gap-1 text-red-400 text-xs animate-pulse shrink-0"><CircleDot className="w-3 h-3" />تسجيل</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#3c4043] text-[#9aa0a6] text-xs">
            <Users className="w-3.5 h-3.5" /><span>{total}</span>
          </div>
          {lobbyRequests.length > 0 && (
            <button onClick={() => setPanel(p => p === "participants" ? "none" : "participants")}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-medium animate-pulse">
              {lobbyRequests.length} ينتظر
            </button>
          )}
          <button onClick={() => setShowQR(true)} title="رمز QR"
            className="p-2 rounded-lg bg-[#3c4043] hover:bg-[#4a4d51] text-[#9aa0a6] transition">
            <QrCode className="w-3.5 h-3.5" />
          </button>
          <button onClick={copyLink} title="نسخ الرابط"
            className="p-2 rounded-lg bg-[#3c4043] hover:bg-[#4a4d51] text-[#9aa0a6] transition">
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
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
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition flex items-center justify-center gap-2">
              {copied ? <><Check className="w-4 h-4" /> تم النسخ</> : <><Copy className="w-4 h-4" /> نسخ الرابط</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex flex-1 gap-2 px-2 pb-2 overflow-hidden min-h-0">

        {/* Video area */}
        {isSpotlight && spotPeer ? (
          <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-hidden">
            <div className="flex-1 rounded-xl overflow-hidden relative min-h-0">
              <VideoTile peer={spotPeer} isSelf={spotPeer.id === myId} speaking={speakingIds.has(spotPeer.id)} />
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
                    className="rounded-lg overflow-hidden relative shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-400 transition"
                    style={{ aspectRatio: "16/9", height: "100%" }}>
                    <VideoTile peer={p} isSelf={p.id === myId} speaking={speakingIds.has(p.id)} small />
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
                <VideoTile peer={p} isSelf={p.id === myId} speaking={speakingIds.has(p.id)} />
              </div>
            ))}
          </div>
        )}

        {/* ── Live Captions Overlay ── */}
        {captionsOn && captions.length > 0 && (
          <div className="pointer-events-none absolute bottom-28 left-0 right-0 px-4 z-30 flex flex-col gap-1" style={{ direction: "rtl" }}>
            {captions.slice(-3).map(cap => (
              <div key={cap.id}
                className={`self-center max-w-[80%] px-4 py-2 rounded-xl text-sm text-white shadow-lg backdrop-blur-sm ${cap.isSelf ? "bg-blue-700/80" : "bg-black/70"}`}>
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
              <span className="text-blue-300 text-xs font-semibold flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5" /> استطلاع</span>
              {isRoomHost && <button onClick={endPoll} className="text-[#9aa0a6] hover:text-red-400 text-xs transition">إنهاء</button>}
            </div>
            <p className="text-white text-sm font-medium mb-3 leading-snug">{activePoll.question}</p>
            <div className="space-y-2">
              {activePoll.options.map((opt: PollOption, i: number) => {
                const total = activePoll.options.reduce((sum: number, o: PollOption) => sum + (o.votes ?? 0), 0);
                const pct = total > 0 ? Math.round(((opt.votes ?? 0) / total) * 100) : 0;
                return (
                  <button key={i} onClick={() => votePoll(i)} disabled={myPollVote !== null}
                    className={`w-full text-right px-3 py-2 rounded-xl text-sm transition relative overflow-hidden ${myPollVote === i ? "ring-2 ring-blue-500" : ""} ${myPollVote !== null ? "cursor-default" : "hover:bg-white/10"} bg-white/5`}>
                    <div className="absolute inset-0 bg-blue-600/20 transition-all" style={{ width: `${pct}%` }} />
                    <div className="relative flex justify-between">
                      <span className="text-white">{opt.text}</span>
                      {myPollVote !== null && <span className="text-blue-300 text-xs">{pct}%</span>}
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
            <div className="bg-[#292b2f] rounded-2xl p-5 shadow-2xl w-80 space-y-3" onClick={e => e.stopPropagation()} dir="rtl">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold flex items-center gap-2"><BarChart2 className="w-4 h-4 text-blue-400" /> إنشاء استطلاع</span>
                <button onClick={() => setShowPollCreator(false)} className="text-[#9aa0a6] hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <input value={pollQuestion} onChange={e => setPollQuestion(e.target.value)}
                placeholder="السؤال..."
                className="w-full px-3 py-2 rounded-xl bg-[#3c4043] text-white text-sm placeholder:text-[#9aa0a6] outline-none border border-transparent focus:border-blue-500 transition" />
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input value={opt} onChange={e => { const a = [...pollOptions]; a[i] = e.target.value; setPollOptions(a); }}
                    placeholder={`خيار ${i + 1}`}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#3c4043] text-white text-sm placeholder:text-[#9aa0a6] outline-none border border-transparent focus:border-blue-500 transition" />
                  {pollOptions.length > 2 && (
                    <button onClick={() => setPollOptions(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300">
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
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition">
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
              className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition flex items-center gap-1.5">
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
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${panel === "chat" ? "bg-blue-600 text-white" : "text-[#9aa0a6] hover:text-white"}`}>
                  الدردشة {unread > 0 && panel !== "chat" && <span className="mr-1 w-4 h-4 rounded-full bg-red-500 text-[10px] inline-flex items-center justify-center">{unread}</span>}
                </button>
                <button onClick={() => setPanel("participants")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${panel === "participants" ? "bg-blue-600 text-white" : "text-[#9aa0a6] hover:text-white"}`}>
                  المشاركون
                </button>
                <button onClick={showAttendancePanel}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${panel === "attendance" ? "bg-blue-600 text-white" : "text-[#9aa0a6] hover:text-white"}`}>
                  الحضور
                </button>
                <button onClick={() => { setPanel("ai"); if (!aiSummary) getAiSummary(); }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${panel === "ai" ? "bg-purple-600 text-white" : "text-[#9aa0a6] hover:text-white"}`}>
                  AI
                </button>
              </div>
              <button onClick={() => setPanel("none")} className="text-[#9aa0a6] hover:text-white transition shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat */}
            {panel === "chat" && (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {chat.length === 0 && <div className="text-center text-[#9aa0a6] text-sm mt-8">لا توجد رسائل بعد</div>}
                  {chat.map(msg => (
                    <div key={msg.id} className={`flex flex-col gap-0.5 ${msg.isSelf ? "items-end" : "items-start"}`}>
                      <span className="text-[#9aa0a6] text-xs">{msg.isSelf ? "أنت" : msg.name} · {msg.time}</span>
                      <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm text-white leading-relaxed ${msg.isSelf ? "bg-blue-600" : "bg-[#3c4043]"}`}>
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
                    <button onClick={sendChat} className="text-blue-400 hover:text-blue-300 transition" data-testid="button-send-chat">
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
                  <div className="mb-3 p-3 rounded-xl bg-blue-600/10 border border-blue-500/20 space-y-2">
                    <p className="text-blue-300 text-xs font-semibold">🎛 أدوات المضيف</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={muteAll}
                        className="flex-1 py-1.5 rounded-lg bg-[#3c4043] hover:bg-[#4a4d51] text-[#9aa0a6] text-xs font-medium transition flex items-center justify-center gap-1">
                        <VolumeX className="w-3.5 h-3.5" /> كتم الجميع
                      </button>
                      <button onClick={toggleLock}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 ${meetingLocked ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30" : "bg-[#3c4043] hover:bg-[#4a4d51] text-[#9aa0a6]"}`}>
                        {meetingLocked ? <><Lock className="w-3.5 h-3.5" /> مقفل</> : <><LockOpen className="w-3.5 h-3.5" /> قفل</>}
                      </button>
                    </div>
                  </div>
                )}
                {lobbyRequests.length > 0 && (
                  <div className="mb-3 space-y-2">
                    <p className="text-amber-300 text-xs font-medium px-1">في الانتظار</p>
                    {lobbyRequests.map(r => (
                      <div key={r.userId} className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                        <p className="text-white text-sm font-medium mb-2">{r.userName}</p>
                        <div className="flex gap-2">
                          <button onClick={() => approveLobby(r.userId)}
                            className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition">قبول</button>
                          <button onClick={() => denyLobby(r.userId)}
                            className="flex-1 py-1.5 rounded-lg bg-[#3c4043] hover:bg-red-600 text-white text-xs font-medium transition">رفض</button>
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
                      {!p.audioOn && <MicOff className="w-3.5 h-3.5 text-red-400" />}
                      {!p.videoOn && <VideoOff className="w-3.5 h-3.5 text-[#9aa0a6]" />}
                      {p.raisedHand && <span className="text-sm">✋</span>}
                      {/* Host controls per peer */}
                      {isRoomHost && p.id !== myId && (
                        <>
                          <button onClick={() => mutePeer(p.id)} title="كتم"
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-[#9aa0a6] hover:text-white transition">
                            <VolumeX className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => kickPeer(p.id, p.name)} title="إخراج"
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-[#9aa0a6] hover:text-red-400 transition">
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
                    <div className={`w-2 h-2 rounded-full shrink-0 ${entry.action === "join" ? "bg-green-400" : "bg-red-400"}`} />
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
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    <p className="text-[#9aa0a6] text-sm">يُحلّل الاجتماع...</p>
                  </div>
                ) : aiSummary ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300 text-xs font-semibold flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> ملخص الذكاء الاصطناعي</span>
                      <button onClick={getAiSummary} className="text-[#9aa0a6] hover:text-white text-xs transition">تحديث</button>
                    </div>
                    <div className="text-white text-sm leading-relaxed whitespace-pre-wrap bg-[#3c4043]/50 rounded-xl p-3">
                      {aiSummary}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <Sparkles className="w-8 h-8 text-purple-400" />
                    <p className="text-[#9aa0a6] text-sm text-center">اضغط لتوليد ملخص ذكي للاجتماع</p>
                    <button onClick={getAiSummary}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition">
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
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${panel === "chat" ? "bg-blue-600 text-white" : "text-[#9aa0a6]"}`}>
                  الدردشة
                </button>
                <button onClick={() => setPanel("participants")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${panel === "participants" ? "bg-blue-600 text-white" : "text-[#9aa0a6]"}`}>
                  المشاركون
                </button>
                <button onClick={showAttendancePanel}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${panel === "attendance" ? "bg-blue-600 text-white" : "text-[#9aa0a6]"}`}>
                  الحضور
                </button>
                <button onClick={() => { setPanel("ai"); if (!aiSummary) getAiSummary(); }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${panel === "ai" ? "bg-purple-600 text-white" : "text-[#9aa0a6]"}`}>
                  AI
                </button>
              </div>
              <button onClick={() => setPanel("none")} className="text-[#9aa0a6]"><X className="w-4 h-4" /></button>
            </div>

            {panel === "chat" && (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {chat.length === 0 && <div className="text-center text-[#9aa0a6] text-sm mt-6">لا توجد رسائل بعد</div>}
                  {chat.map(msg => (
                    <div key={msg.id} className={`flex flex-col gap-0.5 ${msg.isSelf ? "items-end" : "items-start"}`}>
                      <span className="text-[#9aa0a6] text-xs">{msg.isSelf ? "أنت" : msg.name} · {msg.time}</span>
                      <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm text-white ${msg.isSelf ? "bg-blue-600" : "bg-[#3c4043]"}`}>{msg.text}</div>
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
                    <button onClick={sendChat} className="text-blue-400"><Send className="w-4 h-4" /></button>
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
                      className={`flex-1 py-2 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1 ${meetingLocked ? "bg-amber-500/20 text-amber-300" : "bg-[#3c4043] text-[#9aa0a6]"}`}>
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
                      {!p.audioOn && <MicOff className="w-3.5 h-3.5 text-red-400" />}
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
                    <div className={`w-2 h-2 rounded-full shrink-0 ${entry.action === "join" ? "bg-green-400" : "bg-red-400"}`} />
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
                    <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
                    <p className="text-[#9aa0a6] text-sm">يُحلّل الاجتماع...</p>
                  </div>
                ) : aiSummary ? (
                  <div className="space-y-2">
                    <span className="text-purple-300 text-xs font-semibold flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> ملخص AI</span>
                    <div className="text-white text-sm leading-relaxed whitespace-pre-wrap">{aiSummary}</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 mt-4">
                    <button onClick={getAiSummary}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition">
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
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#3c4043] rounded-2xl p-3 shadow-2xl">
          <div className="flex gap-2 flex-wrap justify-center max-w-[220px]">
            {["👍","❤️","😂","😮","😢","🎉","🔥","👏","💯","🙏"].map(e => (
              <button key={e} onClick={() => sendReaction(e)}
                className="text-2xl hover:scale-125 transition-transform p-1">{e}</button>
            ))}
          </div>
        </div>
      )}

      {/* ── Control bar ── */}
      <div className="shrink-0 bg-[#202124] pb-safe">
        {/* Mobile: secondary row */}
        <div className="flex md:hidden items-center justify-center gap-3 py-2 px-4">
          <button onClick={toggleScreen}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition ${screenSharing ? "bg-blue-600" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}
            data-testid="button-toggle-screen">
            <Monitor className={`w-4 h-4 ${screenSharing ? "text-white" : "text-[#9aa0a6]"}`} />
          </button>
          <button onClick={toggleHand}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition ${raisedHand ? "bg-yellow-500" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}>
            <Hand className={`w-4 h-4 ${raisedHand ? "text-white" : "text-[#9aa0a6]"}`} />
          </button>
          <button onClick={() => setShowEmojiPicker(s => !s)}
            className="w-10 h-10 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center transition">
            <Smile className="w-4 h-4 text-[#9aa0a6]" />
          </button>
          {isHost && (
            <button onClick={muteAll}
              className="w-10 h-10 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center transition">
              <MicOff className="w-4 h-4 text-[#9aa0a6]" />
            </button>
          )}
          <button onClick={() => { setLayout(l => l === "grid" ? "spotlight" : "grid"); setPinnedId(null); }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition ${isSpotlight ? "bg-blue-600" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}>
            {isSpotlight ? <Grid3X3 className="w-4 h-4 text-white" /> : <Maximize2 className="w-4 h-4 text-[#9aa0a6]" />}
          </button>
        </div>

        {/* Main control row */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left / Desktop secondary */}
          <div className="hidden md:flex items-center gap-2 w-44">
            <button onClick={toggleScreen}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition ${screenSharing ? "bg-blue-600" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}
              data-testid="button-toggle-screen">
              <Monitor className={`w-4 h-4 ${screenSharing ? "text-white" : "text-[#9aa0a6]"}`} />
            </button>
            <button onClick={toggleHand}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition ${raisedHand ? "bg-yellow-500" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}>
              <Hand className={`w-4 h-4 ${raisedHand ? "text-white" : "text-[#9aa0a6]"}`} />
            </button>
            <button onClick={() => setShowEmojiPicker(s => !s)}
              className="w-10 h-10 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center transition">
              <Smile className="w-4 h-4 text-[#9aa0a6]" />
            </button>
            {isHost && (
              <button onClick={muteAll}
                className="w-10 h-10 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center transition" title="كتم الجميع">
                <MicOff className="w-4 h-4 text-[#9aa0a6]" />
              </button>
            )}
          </div>

          {/* Center: primary controls */}
          <div className="flex items-center gap-3">
            <button onClick={toggleAudio}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg ${audioOn ? "bg-[#3c4043] hover:bg-[#4a4d51]" : "bg-red-600 hover:bg-red-700"}`}
              data-testid="button-toggle-audio">
              {audioOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
            </button>
            <button onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg ${videoOn ? "bg-[#3c4043] hover:bg-[#4a4d51]" : "bg-red-600 hover:bg-red-700"}`}
              data-testid="button-toggle-video">
              {videoOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
            </button>
            <button onClick={leave}
              className="w-14 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition shadow-lg"
              data-testid="button-leave">
              <PhoneOff className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center gap-2 justify-end">
            <button onClick={toggleCaptions} title="تعليقات مباشرة"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition ${captionsOn ? "bg-green-600" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}>
              <Subtitles className={`w-4 h-4 ${captionsOn ? "text-white" : "text-[#9aa0a6]"}`} />
            </button>
            <button onClick={toggleRecording} title={recording ? "إيقاف التسجيل" : "بدء التسجيل"}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition ${recording ? "bg-red-600 animate-pulse" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}>
              <CircleDot className={`w-4 h-4 ${recording ? "text-white" : "text-[#9aa0a6]"}`} />
            </button>
            {isRoomHost && (
              <button onClick={() => setShowPollCreator(true)} title="استطلاع"
                className="w-10 h-10 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center transition">
                <BarChart2 className="w-4 h-4 text-[#9aa0a6]" />
              </button>
            )}
            <button onClick={() => { setLayout(l => l === "grid" ? "spotlight" : "grid"); setPinnedId(null); }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition ${isSpotlight ? "bg-blue-600" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}
              title={isSpotlight ? "وضع الشبكة" : "وضع التركيز"}>
              {isSpotlight ? <Grid3X3 className="w-4 h-4 text-white" /> : <Maximize2 className="w-4 h-4 text-[#9aa0a6]" />}
            </button>
            <button onClick={() => { setPanel(p => p === "chat" ? "none" : "chat"); setUnread(0); }}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition relative ${panel === "chat" ? "bg-blue-600" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}
              data-testid="button-toggle-chat">
              <MessageSquare className="w-5 h-5 text-white" />
              {unread > 0 && <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">{unread}</span>}
            </button>
            <button onClick={() => setPanel(p => p === "participants" ? "none" : "participants")}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition ${panel === "participants" ? "bg-blue-600" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}
              data-testid="button-toggle-participants">
              <Users className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Mobile: chat + participants */}
          <div className="flex md:hidden items-center gap-2">
            <button onClick={() => { setPanel(p => p === "chat" ? "none" : "chat"); setUnread(0); }}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition relative ${panel === "chat" ? "bg-blue-600" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}>
              <MessageSquare className="w-5 h-5 text-white" />
              {unread > 0 && <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] flex items-center justify-center font-bold text-white">{unread}</span>}
            </button>
            <button onClick={() => setPanel(p => p === "participants" ? "none" : "participants")}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition ${panel === "participants" ? "bg-blue-600" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}>
              <Users className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
