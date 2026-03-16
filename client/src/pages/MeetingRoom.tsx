import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, MonitorUp,
  PhoneOff, MessageSquare, X, Send, Users, Copy, Check,
  Loader2, AlertCircle, Pencil, Eraser, Trash2, Globe,
  Zap, FileText, Plus, Headphones, UserMinus, UserPlus,
  Layout, ExternalLink, CheckCircle2, XCircle, Bell, Smile, Hand,
  MoreHorizontal, NotebookPen, ChevronUp, SwitchCamera, Clock,
  Lock, LockOpen, Mail, AtSign, Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function getAvatarColor(name: string): [string, string] {
  const palette: [string, string][] = [
    ["#1d4ed8", "#6366f1"],
    ["#0891b2", "#0284c7"],
    ["#059669", "#0d9488"],
    ["#7c3aed", "#a855f7"],
    ["#dc2626", "#e11d48"],
    ["#d97706", "#ea580c"],
  ];
  const i = ((name?.charCodeAt(0) || 65) + (name?.charCodeAt(1) || 65)) % palette.length;
  return palette[i];
}

function useMeetingTimer() {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    {
      urls: [
        "turn:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:443",
        "turn:openrelay.metered.ca:443?transport=tcp",
      ],
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: [
        "turn:relay.metered.ca:80",
        "turn:relay.metered.ca:443",
        "turn:relay.metered.ca:443?transport=tcp",
      ],
      username: "e7b7c7d7c5e1c0c2a2dff7d5",
      credential: "6JqHH7XvZWLMUvFF",
    },
  ],
  iceCandidatePoolSize: 10,
};

const CANVAS_W = 1600;
const CANVAS_H = 1000;

interface Peer {
  id: string;
  name: string;
  stream?: MediaStream;
  audioOn: boolean;
  videoOn: boolean;
  photoUrl?: string;
  speaking?: boolean;
}

interface ChatMessage {
  from: string;
  name: string;
  text: string;
  ts: number;
  self?: boolean;
}

interface DrawStroke {
  x1: number; y1: number; x2: number; y2: number;
  color: string; size: number; eraser: boolean;
}

function VideoTile({ peer, local = false, spotlight = false, onKick, canKick }: {
  peer: Peer; local?: boolean; spotlight?: boolean; onKick?: () => void; canKick?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [from, to] = getAvatarColor(peer.name || "A");

  const videoCallbackRef = useCallback((el: HTMLVideoElement | null) => {
    if (el && peer.stream) {
      el.srcObject = peer.stream;
      el.play().catch(() => {});
    }
  }, [peer.stream]);

  useEffect(() => {
    if (audioRef.current && peer.stream && !local) {
      audioRef.current.srcObject = peer.stream;
      audioRef.current.play().catch(() => {});
    }
  }, [peer.stream, local]);

  const objectFit = spotlight ? "object-contain" : "object-cover";
  const showVideo = peer.stream && peer.videoOn;
  const avatarSize = spotlight ? "w-28 h-28 text-5xl" : "w-16 h-16 text-2xl";

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center group transition-all duration-300
        ${spotlight ? "h-full w-full rounded-none" : "aspect-video rounded-2xl"}
        ${peer.speaking
          ? "ring-2 ring-green-400/90 shadow-[0_0_0_2px_rgba(74,222,128,0.35),0_0_24px_rgba(74,222,128,0.2)]"
          : "ring-1 ring-white/[0.07]"
        }`}
      style={{ background: showVideo ? "#000" : `linear-gradient(135deg, #131b2e 0%, #1a2540 100%)` }}
    >
      {!local && peer.stream && (
        <audio ref={audioRef} autoPlay playsInline style={{ display: "none" }} />
      )}

      {showVideo ? (
        <video
          ref={videoCallbackRef}
          autoPlay playsInline muted={local}
          className={`w-full h-full ${objectFit}`}
          data-testid={`video-tile-${peer.id}`}
        />
      ) : (
        <div className="flex flex-col items-center gap-3 select-none">
          <div
            className={`${avatarSize} rounded-full flex items-center justify-center font-bold text-white shadow-lg transition-all duration-300
              ${peer.speaking ? "ring-4 ring-green-400/60 shadow-[0_0_20px_rgba(74,222,128,0.35)]" : ""}`}
            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
          >
            {peer.photoUrl
              ? <img src={peer.photoUrl} alt={peer.name} className="w-full h-full object-cover rounded-full" />
              : (peer.name?.charAt(0)?.toUpperCase() || "?")}
          </div>
          {spotlight && <span className="text-white/60 text-sm font-medium mt-1">{peer.name}</span>}
        </div>
      )}

      {/* Gradient overlay at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/75 to-transparent pointer-events-none" />

      {/* Name + audio bar */}
      <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium backdrop-blur-sm transition-all max-w-[80%]
          ${peer.speaking ? "bg-green-500/80 text-white" : "bg-black/55 text-white/90"}`}>
          {peer.speaking && (
            <span className="flex gap-[2px] items-end h-3 shrink-0">
              <span className="w-[3px] bg-white rounded-full animate-[equalizer_0.5s_ease-in-out_infinite]" style={{ height: "60%", animationDelay: "0ms" }} />
              <span className="w-[3px] bg-white rounded-full animate-[equalizer_0.5s_ease-in-out_infinite]" style={{ height: "100%", animationDelay: "100ms" }} />
              <span className="w-[3px] bg-white rounded-full animate-[equalizer_0.5s_ease-in-out_infinite]" style={{ height: "40%", animationDelay: "200ms" }} />
            </span>
          )}
          <span className="truncate">{local ? `أنت` : peer.name}</span>
        </div>
        {!peer.audioOn && (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/80 backdrop-blur-sm shrink-0">
            <MicOff className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Kick button */}
      {canKick && onKick && !local && (
        <button
          onClick={onKick}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-red-500/90 backdrop-blur-sm text-white rounded-lg p-1.5 hover:bg-red-600 hover:scale-105"
          title="طرد المشارك"
          data-testid={`button-kick-${peer.id}`}
        >
          <UserMinus className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

type PanelTab = 'chat' | 'participants' | 'whiteboard' | 'page' | 'actions' | 'requests' | 'notes';

const SYSTEM_PAGES = [
  { label: "لوحة التحكم", path: "/dashboard" },
  { label: "الطلبات", path: "/admin/orders" },
  { label: "لوحة المشاريع", path: "/admin/kanban" },
  { label: "الدعم الفني", path: "/support" },
  { label: "الاستشارات", path: "/consultation" },
  { label: "الخدمات والأسعار", path: "/prices" },
  { label: "إدارة الاجتماعات", path: "/admin/qmeet" },
];

export default function MeetingRoom() {
  const { roomId } = useParams() as { roomId: string };
  const [, navigate] = useLocation();
  const { data: user } = useUser();
  const { toast } = useToast();

  const { data: meeting, isLoading: meetingLoading, error: meetingError } = useQuery<any>({
    queryKey: ["/api/qmeet/room", roomId],
    queryFn: async () => {
      const r = await fetch(`/api/qmeet/room/${roomId}`);
      if (!r.ok) throw new Error("الاجتماع غير موجود");
      return r.json();
    },
    enabled: !!roomId,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidates = useRef<Map<string, RTCIceCandidate[]>>(new Map());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const screenSharingRef = useRef(false);
  const activePanelRef = useRef<PanelTab | null>(null);
  const wasKickedRef = useRef(false);
  const allStrokesRef = useRef<DrawStroke[]>([]);
  const rafPendingRef = useRef<DrawStroke | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Platform detection (computed once — UA doesn't change during session)
  const _ua = navigator.userAgent;
  const isIOSDevice = /iPad|iPhone|iPod/.test(_ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroidDevice = /Android/.test(_ua);
  const isAndroidWebViewDevice = isAndroidDevice && /; wv\)/.test(_ua);

  const [joined, setJoined] = useState(false);
  const [wasKicked, setWasKicked] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [screenSharerPeerId, setScreenSharerPeerId] = useState<string | null>(null);
  const [screenSharerName, setScreenSharerName] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<PanelTab | null>(null);
  const [chatMsg, setChatMsg] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadChat, setUnreadChat] = useState(0);
  const [copied, setCopied] = useState(false);
  const [wsReady, setWsReady] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const meetingTimer = useMeetingTimer();

  const [drawColor, setDrawColor] = useState("#ffffff");
  const [drawSize, setDrawSize] = useState(3);
  const [drawMode, setDrawMode] = useState<"pen" | "eraser">("pen");
  const [isDrawing, setIsDrawing] = useState(false);

  type FloatingReaction = { id: string; emoji: string; name: string; x: number; };
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [raisedHand, setRaisedHand] = useState(false);
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const REACTION_EMOJIS = ["👍","❤️","😂","🎉","👏","🔥","🚀","😮"];
  const reactionTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [pendingScreenShareRequests, setPendingScreenShareRequests] = useState<{ userId: string; name: string }[]>([]);
  const [screenSharePending, setScreenSharePending] = useState(false);
  const [screenShareApproved, setScreenShareApproved] = useState(false);
  const [lobbyEnabled, setLobbyEnabled] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteTab, setInviteTab] = useState<"internal" | "external">("internal");
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteSearchResults, setInviteSearchResults] = useState<any[]>([]);
  const [inviteSelected, setInviteSelected] = useState<any[]>([]);
  const [extEmail, setExtEmail] = useState("");
  const [extName, setExtName] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [lobbyToggling, setLobbyToggling] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [speakingPeers, setSpeakingPeers] = useState<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserNodesRef = useRef<Map<string, { analyser: AnalyserNode; source: MediaStreamAudioSourceNode }>>(new Map());

  const [selectedPage, setSelectedPage] = useState(SYSTEM_PAGES[0].path);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);

  const [qaTicketTitle, setQaTicketTitle] = useState("");
  const [qaTicketDesc, setQaTicketDesc] = useState("");

  const [pendingJoinRequests, setPendingJoinRequests] = useState<any[]>([]);
  const [lobbyWaiting, setLobbyWaiting] = useState(false);
  const [meetingNotes, setMeetingNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const guestIdFromStorage = typeof window !== "undefined" ? sessionStorage.getItem("qmeet_guest_id") : null;
  const guestNameFromStorage = typeof window !== "undefined" ? sessionStorage.getItem("qmeet_guest_name") : null;

  const [directGuestName, setDirectGuestName] = useState(guestNameFromStorage || "");
  const [directGuestId, setDirectGuestId] = useState<string | null>(guestIdFromStorage);
  const [showGuestNameInput, setShowGuestNameInput] = useState(!user && !guestIdFromStorage);

  const userId = user?._id || user?.id || directGuestId || undefined;
  const userName = user?.fullName || user?.username || directGuestName || "ضيف";
  const isAdmin = ["admin", "manager"].includes((user as any)?.role);
  const isStaff = !!(user && !["client"].includes((user as any)?.role || ""));
  const isHost = meeting && (String(meeting.hostId) === String(userId) || isAdmin);

  useEffect(() => { screenSharingRef.current = screenSharing; }, [screenSharing]);
  useEffect(() => { activePanelRef.current = activePanel; }, [activePanel]);
  // Sync lobbyEnabled from meeting data
  useEffect(() => { if (meeting) setLobbyEnabled(!!(meeting as any).lobbyEnabled); }, [meeting]);

  // Invite search: debounced fetch
  useEffect(() => {
    if (!showInviteModal || inviteTab !== "internal") return;
    const term = inviteSearch.trim();
    if (!term) { setInviteSearchResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/admin/users?page=1&limit=20&search=${encodeURIComponent(term)}`);
        if (r.ok) { const d = await r.json(); setInviteSearchResults(d.data || []); }
      } catch {}
    }, 320);
    return () => clearTimeout(t);
  }, [inviteSearch, inviteTab, showInviteModal]);

  // ── Speaking detection via Web Audio API ─────────────────────────────────────
  useEffect(() => {
    if (!joined) return;

    const getCtx = () => {
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume().catch(() => {});
      return audioCtxRef.current;
    };

    const attachStream = (peerId: string, stream: MediaStream) => {
      if (analyserNodesRef.current.has(peerId)) return;
      try {
        const ctx = getCtx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.5;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyserNodesRef.current.set(peerId, { analyser, source });
      } catch {}
    };

    const localId = userId || "local";
    if (localStream) {
      const existing = analyserNodesRef.current.get(localId);
      if (existing) {
        try { existing.source.disconnect(); } catch {}
        analyserNodesRef.current.delete(localId);
      }
      attachStream(localId, localStream);
    }

    peers.forEach((peer, peerId) => {
      if (peer.stream) attachStream(peerId, peer.stream);
    });

    const interval = setInterval(() => {
      const newSpeaking = new Set<string>();
      analyserNodesRef.current.forEach(({ analyser }, peerId) => {
        const isLocal = peerId === (userId || "local");
        if (isLocal && !audioOn) return;
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.slice(0, data.length / 2).reduce((a, b) => a + b, 0) / (data.length / 2);
        if (avg > 8) newSpeaking.add(peerId);
      });
      setSpeakingPeers(prev => {
        const same = prev.size === newSpeaking.size && [...prev].every(id => newSpeaking.has(id));
        return same ? prev : newSpeaking;
      });
    }, 120);

    return () => {
      clearInterval(interval);
    };
  }, [joined, localStream, peers, audioOn, userId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendWs = useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const addFloating = useCallback((emoji: string, name: string) => {
    const id = Math.random().toString(36).slice(2);
    const x = 20 + Math.random() * 60;
    setFloatingReactions(prev => [...prev, { id, emoji, name, x }]);
    const t = setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== id)), 3000);
    reactionTimersRef.current.push(t);
  }, []);

  const sendReaction = (emoji: string) => {
    setShowEmojiPicker(false);
    addFloating(emoji, "أنت");
    sendWs({ type: "webrtc_reaction", roomId, emoji, name: userName });
  };

  const toggleRaiseHand = () => {
    const newVal = !raisedHand;
    setRaisedHand(newVal);
    sendWs({ type: "webrtc_raise_hand", roomId, raised: newVal, name: userName, userId });
    if (newVal) addFloating("🙋", "أنت");
  };

  const createPC = useCallback((peerId: string) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));
    }
    pc.onicecandidate = (e) => {
      if (e.candidate) sendWs({ type: "webrtc_ice", to: peerId, candidate: e.candidate });
    };
    pc.ontrack = (e) => {
      const stream = e.streams[0];
      setPeers(prev => {
        const next = new Map(prev);
        const existing = next.get(peerId) || { id: peerId, name: peerId, audioOn: true, videoOn: true };
        next.set(peerId, { ...existing, stream });
        return next;
      });
    };
    pc.onconnectionstatechange = () => {
      if (["failed", "disconnected", "closed"].includes(pc.connectionState)) removePeer(peerId);
    };
    pcsRef.current.set(peerId, pc);
    return pc;
  }, [sendWs]);

  const removePeer = useCallback((peerId: string) => {
    const pc = pcsRef.current.get(peerId);
    if (pc) { pc.close(); pcsRef.current.delete(peerId); }
    pendingCandidates.current.delete(peerId);
    const node = analyserNodesRef.current.get(peerId);
    if (node) { try { node.source.disconnect(); } catch {} analyserNodesRef.current.delete(peerId); }
    setPeers(prev => { const next = new Map(prev); next.delete(peerId); return next; });
  }, []);

  const addIceCandidate = useCallback(async (peerId: string, candidate: RTCIceCandidateInit | null) => {
    if (!candidate) return;
    const pc = pcsRef.current.get(peerId);
    if (!pc) return;
    if (pc.remoteDescription) {
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
    } else {
      if (!pendingCandidates.current.has(peerId)) pendingCandidates.current.set(peerId, []);
      pendingCandidates.current.get(peerId)!.push(new RTCIceCandidate(candidate));
    }
  }, []);

  const flushPendingCandidates = useCallback(async (peerId: string) => {
    const pc = pcsRef.current.get(peerId);
    if (!pc) return;
    for (const c of pendingCandidates.current.get(peerId) || []) {
      try { await pc.addIceCandidate(c); } catch {}
    }
    pendingCandidates.current.delete(peerId);
  }, []);

  const drawStrokeOnCanvas = useCallback((stroke: DrawStroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(stroke.x1, stroke.y1);
    ctx.lineTo(stroke.x2, stroke.y2);
    if (stroke.eraser) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = stroke.size * 3;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.restore();
  }, []);

  const replayStrokesOnCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    for (const stroke of allStrokesRef.current) {
      drawStrokeOnCanvas(stroke);
    }
  }, [drawStrokeOnCanvas]);

  useEffect(() => {
    if (activePanel === 'whiteboard') {
      setTimeout(() => replayStrokesOnCanvas(), 50);
    }
  }, [activePanel, replayStrokesOnCanvas]);

  const handleWsMessage = useCallback(async (data: any) => {
    switch (data.type) {
      case "webrtc_peers": {
        const infoMap: Record<string, { name: string; photoUrl?: string }> = {};
        if (Array.isArray(data.peerInfoList)) {
          for (const p of data.peerInfoList) infoMap[p.userId] = { name: p.name, photoUrl: p.photoUrl || "" };
        }
        for (const peerId of data.peers) {
          const info = infoMap[peerId] || { name: peerId, photoUrl: "" };
          setPeers(prev => {
            const next = new Map(prev);
            if (!next.has(peerId)) next.set(peerId, { id: peerId, name: info.name, audioOn: true, videoOn: true, photoUrl: info.photoUrl });
            return next;
          });
          const pc = createPC(peerId);
          const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
          await pc.setLocalDescription(offer);
          sendWs({ type: "webrtc_offer", to: peerId, offer: pc.localDescription });
        }
        break;
      }
      case "webrtc_peer_joined": {
        setPeers(prev => {
          const next = new Map(prev);
          if (!next.has(data.peerId)) next.set(data.peerId, { id: data.peerId, name: data.name || data.peerId, audioOn: true, videoOn: true, photoUrl: data.photoUrl || "" });
          return next;
        });
        break;
      }
      case "webrtc_offer": {
        // Use existing PC for renegotiation, create new one for new peers
        const existingPc = pcsRef.current.get(data.from);
        const pc = existingPc || createPC(data.from);
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        await flushPendingCandidates(data.from);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendWs({ type: "webrtc_answer", to: data.from, answer: pc.localDescription });
        break;
      }
      case "webrtc_answer": {
        const pc = pcsRef.current.get(data.from);
        if (pc) { await pc.setRemoteDescription(new RTCSessionDescription(data.answer)); await flushPendingCandidates(data.from); }
        break;
      }
      case "webrtc_ice": {
        await addIceCandidate(data.from, data.candidate);
        break;
      }
      case "webrtc_chat": {
        setChatMessages(prev => [...prev, { from: data.from, name: data.name, text: data.text, ts: data.ts }]);
        if (activePanelRef.current !== 'chat') {
          setUnreadChat(prev => prev + 1);
        }
        break;
      }
      case "webrtc_media_state": {
        setPeers(prev => {
          const next = new Map(prev);
          const peer = next.get(data.from);
          if (peer) next.set(data.from, { ...peer, audioOn: data.audio, videoOn: data.video });
          return next;
        });
        break;
      }
      case "webrtc_kicked": {
        wasKickedRef.current = true;
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        pcsRef.current.forEach(pc => pc.close());
        pcsRef.current.clear();
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        wsRef.current?.close();
        setWasKicked(true);
        setJoined(false);
        break;
      }
      case "webrtc_draw": {
        const stroke: DrawStroke = data.stroke;
        allStrokesRef.current.push(stroke);
        drawStrokeOnCanvas(stroke);
        break;
      }
      case "webrtc_whiteboard_clear": {
        allStrokesRef.current = [];
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          ctx?.clearRect(0, 0, CANVAS_W, CANVAS_H);
        }
        break;
      }
      case "webrtc_screen_share": {
        if (data.active) {
          setScreenSharerPeerId(data.from);
          setScreenSharerName(data.name || data.from);
        } else {
          setScreenSharerPeerId(prev => prev === data.from ? null : prev);
          setScreenSharerName(prev => prev === (data.name || data.from) ? null : prev);
        }
        break;
      }
      case "webrtc_peer_left": {
        removePeer(data.peerId);
        setScreenSharerPeerId(prev => prev === data.peerId ? null : prev);
        break;
      }
      case "webrtc_lobby_waiting": {
        setLobbyWaiting(true);
        break;
      }
      case "qmeet_join_response": {
        if (data.approved) {
          setLobbyWaiting(false);
          const myPhoto = (user as any)?.profilePhotoUrl || (user as any)?.avatarUrl || "";
          sendWs({ type: "webrtc_join", roomId, name: userName, photoUrl: myPhoto });
          toast({ title: "✅ تمت الموافقة!", description: "أنت الآن في الاجتماع" });
        } else {
          toast({ title: "تم رفض الطلب", description: data.message || "رفض المضيف انضمامك للاجتماع", variant: "destructive" });
          setTimeout(() => window.location.href = "/dashboard", 2500);
        }
        break;
      }
      case "qmeet_join_request": {
        setPendingJoinRequests(prev => {
          const exists = prev.find(r => r.userId === data.userId);
          if (exists) return prev;
          return [...prev, { ...data, _tempId: data.userId + Date.now() }];
        });
        toast({ title: "طلب انضمام جديد", description: `${data.userName} يطلب الدخول للاجتماع` });
        setActivePanel("requests");
        break;
      }
      case "qmeet_lobby_changed": {
        setLobbyEnabled(data.lobbyEnabled);
        toast({
          title: data.lobbyEnabled ? "🔒 تم تفعيل صالة الانتظار" : "🔓 تم فتح الاجتماع",
          description: data.lobbyEnabled ? "سيحتاج القادمون الجدد لموافقتك" : "يمكن للجميع الانضمام مباشرة",
        });
        break;
      }
      case "webrtc_reaction": {
        addFloating(data.emoji, data.name || "مشارك");
        break;
      }
      case "webrtc_raise_hand": {
        setRaisedHands(prev => {
          const next = new Set(prev);
          if (data.raised) { next.add(data.userId || data.name); addFloating("🙋", data.name || "مشارك"); }
          else next.delete(data.userId || data.name);
          return next;
        });
        break;
      }
      case "webrtc_screen_share_request": {
        if (isHost || isStaff) {
          setPendingScreenShareRequests(prev => {
            const exists = prev.find(r => r.userId === data.from);
            if (exists) return prev;
            return [...prev, { userId: data.from, name: data.name || data.from }];
          });
          toast({ title: "طلب مشاركة شاشة", description: `${data.name || "مشارك"} يطلب مشاركة شاشته` });
          setActivePanel("requests");
        }
        break;
      }
      case "webrtc_screen_share_approved": {
        setScreenSharePending(false);
        setScreenShareApproved(true);
        toast({ title: "✅ تمت الموافقة!", description: "اضغط على زر مشاركة الشاشة للبدء" });
        break;
      }
      case "webrtc_screen_share_denied": {
        setScreenSharePending(false);
        setScreenShareApproved(false);
        toast({ title: "تم الرفض", description: "لم يوافق المضيف على مشاركة الشاشة", variant: "destructive" });
        break;
      }
    }
  }, [createPC, sendWs, addIceCandidate, flushPendingCandidates, removePeer, drawStrokeOnCanvas, toast, addFloating, isHost]);

  const getMedia = useCallback(async () => {
    const audioConstraints = { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 48000 };
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: audioConstraints,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setMediaError(null);
      return stream;
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: audioConstraints });
        localStreamRef.current = stream;
        setLocalStream(stream);
        setVideoOn(false);
        setMediaError("الكاميرا غير متاحة، يمكنك الانضمام بالصوت فقط");
        return stream;
      } catch {
        setMediaError("لا يمكن الوصول للكاميرا أو الميكروفون. تأكد من منح الإذن.");
        return null;
      }
    }
  }, []);

  useEffect(() => {
    getMedia();
    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      reactionTimersRef.current.forEach(clearTimeout);
      reactionTimersRef.current = [];
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [getMedia]);

  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connectWs = useCallback((uid: string, rId: string, uName: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "auth", userId: uid }));
      setWsReady(true);
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "online_users") {
          const myPhoto = (user as any)?.profilePhotoUrl || (user as any)?.avatarUrl || "";
          ws.send(JSON.stringify({ type: "webrtc_join", roomId: rId, name: uName, photoUrl: myPhoto }));
          // Don't set joined yet — wait for server response (peers list or lobby)
        } else if (data.type === "webrtc_peers") {
          setJoined(true);
          setLobbyWaiting(false);
          await handleWsMessage(data);
        } else if (data.type === "webrtc_lobby_waiting") {
          setJoined(true);
          setLobbyWaiting(true);
        } else {
          await handleWsMessage(data);
        }
      } catch {}
    };

    ws.onclose = () => {
      setWsReady(false);
      if (!wasKickedRef.current) {
        reconnectTimerRef.current = setTimeout(() => {
          if (wsRef.current?.readyState !== WebSocket.OPEN) {
            connectWs(uid, rId, uName);
          }
        }, 3000);
      }
    };
    ws.onerror = () => { ws.close(); };
  }, [handleWsMessage]);

  const joinMeeting = useCallback(async () => {
    if (!userId || !roomId) return;
    const stream = localStream || await getMedia();
    if (!stream && !mediaError) return;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    connectWs(userId, roomId, userName);
  }, [userId, roomId, userName, localStream, mediaError, getMedia, connectWs]);

  const leaveMeeting = useCallback(() => {
    wasKickedRef.current = true;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    sendWs({ type: "webrtc_leave", roomId });
    pcsRef.current.forEach(pc => pc.close());
    pcsRef.current.clear();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    analyserNodesRef.current.forEach(({ source }) => { try { source.disconnect(); } catch {} });
    analyserNodesRef.current.clear();
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    wsRef.current?.close();
    navigate("/dashboard");
  }, [sendWs, roomId, navigate]);

  const toggleAudio = useCallback(() => {
    if (!localStreamRef.current) return;
    const enabled = !audioOn;
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = enabled; });
    setAudioOn(enabled);
    sendWs({ type: "webrtc_media_state", roomId, audio: enabled, video: videoOn });
  }, [audioOn, videoOn, roomId, sendWs]);

  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current || screenSharing) return;
    const enabled = !videoOn;
    localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = enabled; });
    setVideoOn(enabled);
    sendWs({ type: "webrtc_media_state", roomId, audio: audioOn, video: enabled });
  }, [audioOn, videoOn, roomId, sendWs, screenSharing]);

  const flipCamera = useCallback(async () => {
    if (!videoOn || screenSharing) return;
    const newFacing = cameraFacing === "user" ? "environment" : "user";
    let camStream: MediaStream | null = null;
    // Try exact first (preferred — guarantees the correct lens)
    // Fall back to non-exact (wider compatibility for devices that don't honour exact)
    for (const constraints of [
      { facingMode: { exact: newFacing } },
      { facingMode: newFacing },
    ] as MediaTrackConstraints[]) {
      try {
        camStream = await navigator.mediaDevices.getUserMedia({ video: constraints, audio: false });
        break;
      } catch {
        // try next constraints set
      }
    }
    if (!camStream) {
      toast({ title: "تعذّر قلب الكاميرا", description: "تأكد من وجود كاميرا أمامية وخلفية", variant: "destructive" });
      return;
    }
    const camTrack = camStream.getVideoTracks()[0];
    pcsRef.current.forEach(pc => {
      const sender = pc.getSenders().find(s => s.track?.kind === "video");
      if (sender) sender.replaceTrack(camTrack);
    });
    localStreamRef.current?.getVideoTracks().forEach(t => t.stop());
    const audio = localStreamRef.current?.getAudioTracks()[0];
    const newStream = new MediaStream([...(audio ? [audio] : []), camTrack]);
    localStreamRef.current = newStream;
    setLocalStream(newStream);
    setCameraFacing(newFacing);
  }, [videoOn, screenSharing, cameraFacing, toast]);

  const stopScreenShare = useCallback(async () => {
    const _ua2 = navigator.userAgent;
    const _isMobile = /iPad|iPhone|iPod|Android/.test(_ua2) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    try {
      const cam = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      const camTrack = cam.getVideoTracks()[0];
      const peersNeedingRenegotiation: string[] = [];
      pcsRef.current.forEach((pc, peerId) => {
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        if (_isMobile) {
          // Mobile: remove+addTrack+renegotiate — replaceTrack unreliable when switching
          // from screen back to camera
          if (sender) { try { pc.removeTrack(sender); } catch {} }
          try { pc.addTrack(camTrack, new MediaStream([camTrack])); } catch {}
          peersNeedingRenegotiation.push(peerId);
        } else {
          if (sender) { sender.replaceTrack(camTrack).catch(() => {}); }
        }
      });
      localStreamRef.current?.getVideoTracks().forEach(t => t.stop());
      const audio = localStreamRef.current?.getAudioTracks()[0];
      const newStream = new MediaStream([...(audio ? [audio] : []), camTrack]);
      localStreamRef.current = newStream;
      setLocalStream(newStream);
      setVideoOn(true);
      sendWs({ type: "webrtc_media_state", roomId, audio: audioOn, video: true });
      if (_isMobile) {
        for (const peerId of peersNeedingRenegotiation) {
          const pc = pcsRef.current.get(peerId);
          if (!pc) continue;
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendWs({ type: "webrtc_offer", to: peerId, offer: pc.localDescription });
          } catch {}
        }
      }
    } catch {
      // Camera unavailable — remove video senders and renegotiate
      const peersNeedingRenegotiation: string[] = [];
      pcsRef.current.forEach((pc, peerId) => {
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        if (sender) {
          try { pc.removeTrack(sender); } catch {}
          peersNeedingRenegotiation.push(peerId);
        }
      });
      localStreamRef.current?.getVideoTracks().forEach(t => t.stop());
      const audio = localStreamRef.current?.getAudioTracks()[0];
      const newStream = new MediaStream(audio ? [audio] : []);
      localStreamRef.current = newStream;
      setLocalStream(newStream);
      setVideoOn(false);
      sendWs({ type: "webrtc_media_state", roomId, audio: audioOn, video: false });
      for (const peerId of peersNeedingRenegotiation) {
        const pc = pcsRef.current.get(peerId);
        if (!pc) continue;
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendWs({ type: "webrtc_offer", to: peerId, offer: pc.localDescription });
        } catch {}
      }
    }
    setScreenSharing(false);
    setScreenSharerPeerId(null);
    setScreenSharerName(null);
    sendWs({ type: "webrtc_screen_share", roomId, active: false, name: userName });
  }, [sendWs, roomId, userName, audioOn, cameraFacing]);

  const toggleScreenShare = useCallback(async () => {
    // ── Stop ───────────────────────────────────────────────────────────────
    if (screenSharingRef.current) {
      stopScreenShare();
      return;
    }

    // ── Platform detection ─────────────────────────────────────────────────
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    // Detect Android WebView: native app wrapper (has "; wv)" marker in UA)
    // TWA (Trusted Web Activity) opens real Chrome — does NOT have "; wv)"
    const isAndroidWebView = isAndroid && /; wv\)/.test(ua);
    // iOS Safari (not Chrome/CriOS/Firefox on iOS)
    const isSafariIOS = isIOS && /WebKit/.test(ua) && !/CriOS\//.test(ua) && !/FxiOS\//.test(ua) && !/EdgiOS\//.test(ua);
    const iosMatch = ua.match(/OS (\d+)[_.](\d+)/);
    const iosMajor = iosMatch ? parseInt(iosMatch[1]) : 0;

    // ── Support check ──────────────────────────────────────────────────────
    const hasDisplayMedia = typeof navigator?.mediaDevices?.getDisplayMedia === "function";
    if (!hasDisplayMedia) {
      if (isIOS) {
        if (!isSafariIOS) {
          toast({
            title: "استخدم Safari",
            description: "مشاركة الشاشة على iPhone/iPad تعمل فقط مع Safari iOS 18+ — ليس Chrome أو أي متصفح آخر",
            variant: "destructive",
          });
        } else if (iosMajor < 18) {
          toast({
            title: `يلزم iOS 18 أو أحدث`,
            description: `إصدارك الحالي iOS ${iosMajor}. حدّث جهازك من الإعدادات ثم أعد المحاولة`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "مشاركة الشاشة غير متاحة",
            description: "أغلق Safari وأعد فتحه، ثم حاول مرة أخرى",
            variant: "destructive",
          });
        }
      } else if (isAndroidWebView) {
        toast({
          title: "افتح في Chrome مباشرة",
          description: "مشاركة الشاشة لا تعمل داخل التطبيق. انسخ الرابط وافتحه في تطبيق Chrome الرسمي",
          variant: "destructive",
        });
      } else if (isAndroid) {
        toast({
          title: "غير مدعوم",
          description: "تأكد من استخدام Chrome آخر إصدار على الأندرويد، وأن الموقع يعمل عبر HTTPS",
          variant: "destructive",
        });
      } else {
        toast({
          title: "غير مدعوم",
          description: "استخدم Chrome أو Edge على الكمبيوتر، أو Safari iOS 18+ على الجوال",
          variant: "destructive",
        });
      }
      return;
    }

    // ── Non-host: request approval first (no getDisplayMedia yet) ──────────
    if (!isHost && !(isStaff && !screenSharerPeerId) && !screenShareApproved) {
      if (screenSharePending) {
        toast({ title: "في الانتظار", description: "طلبك قيد المراجعة من المضيف" });
        return;
      }
      setScreenSharePending(true);
      sendWs({ type: "webrtc_screen_share_request", roomId, name: userName });
      toast({ title: "تم الإرسال", description: "تم إرسال طلب مشاركة الشاشة للمضيف" });
      return;
    }

    // ── CRITICAL: getDisplayMedia MUST be the first await after user gesture ─
    // On Android Chrome and iOS Safari, any async call before this breaks the
    // security gesture check and causes NotAllowedError silently.
    //
    // Constraint strategy:
    //  • iOS Safari 18+: displaySurface:"browser" captures current tab (only option on iOS)
    //  • Android Chrome: standard video:true works; audio not requestable on Android
    //  • Desktop: full resolution preferred
    let screen: MediaStream | null = null;
    let captureError: any = null;

    // Build ordered constraint list — try best first, fallback second
    // iOS Safari 18+: captures current tab only; displaySurface constraint is NOT supported
    // Android Chrome: video:true works; audio is not capturable
    const constraintList: DisplayMediaStreamOptions[] = isIOS
      ? [
          { video: true, audio: false },
        ]
      : isAndroid
      ? [
          { video: true, audio: false },
        ]
      : [
          { video: { width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false },
          { video: true, audio: false },
        ];

    for (const constraints of constraintList) {
      try {
        screen = await navigator.mediaDevices.getDisplayMedia(constraints);
        captureError = null;
        break;
      } catch (err: any) {
        captureError = err;
        // NotAllowedError / AbortError = user cancelled — stop immediately, no retry
        if (err?.name === "NotAllowedError" || err?.name === "AbortError") {
          return;
        }
        // Otherwise try next constraint set
      }
    }

    if (!screen || captureError) {
      const n = captureError?.name;
      if (isIOS) {
        if (!isSafariIOS) {
          toast({ title: "استخدم Safari", description: "مشاركة الشاشة على iOS تعمل فقط مع Safari، ليس Chrome", variant: "destructive" });
        } else if (n === "NotSupportedError" || n === "InvalidStateError") {
          toast({ title: "غير مدعوم على هذا الإصدار", description: `تأكد من iOS 18+ وأن Safari مُحدَّث — إصدارك ${iosMajor}`, variant: "destructive" });
        } else {
          toast({ title: "تعذّرت مشاركة الشاشة", description: "اقبل طلب إذن مشاركة التبويب عند ظهوره في Safari", variant: "destructive" });
        }
      } else if (isAndroidWebView) {
        toast({ title: "افتح في Chrome", description: "انسخ رابط الاجتماع وافتحه في تطبيق Chrome الرسمي", variant: "destructive" });
      } else if (isAndroid) {
        toast({ title: "تعذّرت مشاركة الشاشة", description: "اقبل إذن مشاركة الشاشة عند ظهور نافذة النظام", variant: "destructive" });
      } else {
        toast({ title: "تعذّرت مشاركة الشاشة", description: "اقبل طلب الإذن عند ظهوره على الشاشة", variant: "destructive" });
      }
      return;
    }

    // After getDisplayMedia — state updates are safe now
    setScreenShareApproved(false);

    if (!screen.getVideoTracks().length) {
      screen.getTracks().forEach(t => t.stop());
      toast({ title: "لم يتم اختيار شاشة", description: "اختر شاشة أو نافذة للمشاركة", variant: "destructive" });
      return;
    }

    const screenTrack = screen.getVideoTracks()[0];
    localStreamRef.current?.getVideoTracks().forEach(t => t.stop());
    const audio = localStreamRef.current?.getAudioTracks()[0];
    const newStream = new MediaStream([...(audio ? [audio] : []), screenTrack]);

    const peersNeedingRenegotiation: string[] = [];
    for (const [peerId, pc] of pcsRef.current) {
      const sender = pc.getSenders().find(s => s.track?.kind === "video");
      if (sender) {
        // iOS/Android: replaceTrack often silently fails for screen tracks due to codec
        // mismatch — always remove+addTrack+renegotiate on mobile for reliability
        if (isIOSDevice || isAndroidDevice) {
          try { pc.removeTrack(sender); } catch {}
          try { pc.addTrack(screenTrack, newStream); } catch {}
          peersNeedingRenegotiation.push(peerId);
        } else {
          await sender.replaceTrack(screenTrack).catch(() => {
            pc.addTrack(screenTrack, newStream);
          });
          peersNeedingRenegotiation.push(peerId);
        }
      } else {
        pc.addTrack(screenTrack, newStream);
        peersNeedingRenegotiation.push(peerId);
      }
    }

    localStreamRef.current = newStream;
    setLocalStream(newStream);
    setVideoOn(true);
    setScreenSharing(true);
    setScreenSharerPeerId(userId || "local");
    setScreenSharerName(userName);
    sendWs({ type: "webrtc_media_state", roomId, audio: audioOn, video: true });
    sendWs({ type: "webrtc_screen_share", roomId, active: true, name: userName });
    screenTrack.onended = () => { if (screenSharingRef.current) stopScreenShare(); };

    for (const peerId of peersNeedingRenegotiation) {
      const pc = pcsRef.current.get(peerId);
      if (!pc) continue;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendWs({ type: "webrtc_offer", to: peerId, offer: pc.localDescription });
      } catch {}
    }
  }, [stopScreenShare, isHost, isStaff, screenSharePending, screenShareApproved, screenSharerPeerId, sendWs, roomId, userName, audioOn, userId, toast]);

  const approveScreenShare = useCallback((targetUserId: string) => {
    sendWs({ type: "webrtc_screen_share_approve", roomId, targetId: targetUserId });
    setPendingScreenShareRequests(prev => prev.filter(r => r.userId !== targetUserId));
    toast({ title: "تمت الموافقة", description: "أبلغنا المشارك بالموافقة" });
  }, [sendWs, roomId, toast]);

  const denyScreenShare = useCallback((targetUserId: string) => {
    sendWs({ type: "webrtc_screen_share_deny", roomId, targetId: targetUserId });
    setPendingScreenShareRequests(prev => prev.filter(r => r.userId !== targetUserId));
    toast({ title: "تم الرفض" });
  }, [sendWs, roomId, toast]);

  const sendChat = useCallback(() => {
    const text = chatMsg.trim();
    if (!text || !roomId) return;
    sendWs({ type: "webrtc_chat", roomId, text, name: userName });
    setChatMessages(prev => [...prev, { from: userId || "", name: userName, text, ts: Date.now(), self: true }]);
    setChatMsg("");
  }, [chatMsg, roomId, userId, userName, sendWs]);

  const kickPeer = useCallback((peerId: string) => {
    sendWs({ type: "webrtc_kick", roomId, targetId: peerId });
  }, [sendWs, roomId]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePanel = (panel: PanelTab) => {
    setActivePanel(prev => prev === panel ? null : panel);
    if (panel === 'chat') setUnreadChat(0);
  };

  const getCanvasPos = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const sendStrokeThrottled = useCallback((stroke: DrawStroke) => {
    rafPendingRef.current = stroke;
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      if (rafPendingRef.current) {
        sendWs({ type: "webrtc_draw", roomId, stroke: rafPendingRef.current });
        allStrokesRef.current.push(rafPendingRef.current);
        rafPendingRef.current = null;
      }
      rafIdRef.current = null;
    });
  }, [sendWs, roomId]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e.clientX, e.clientY);
    if (!pos) return;
    setIsDrawing(true);
    lastPos.current = pos;
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPos.current) return;
    const pos = getCanvasPos(e.clientX, e.clientY);
    if (!pos) return;
    const stroke: DrawStroke = {
      x1: lastPos.current.x, y1: lastPos.current.y,
      x2: pos.x, y2: pos.y,
      color: drawColor, size: drawSize, eraser: drawMode === "eraser",
    };
    drawStrokeOnCanvas(stroke);
    sendStrokeThrottled(stroke);
    lastPos.current = pos;
  };

  const handleCanvasMouseUp = () => { setIsDrawing(false); lastPos.current = null; };

  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const pos = getCanvasPos(touch.clientX, touch.clientY);
    if (!pos) return;
    setIsDrawing(true);
    lastPos.current = pos;
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing || !lastPos.current) return;
    const touch = e.touches[0];
    const pos = getCanvasPos(touch.clientX, touch.clientY);
    if (!pos) return;
    const stroke: DrawStroke = {
      x1: lastPos.current.x, y1: lastPos.current.y,
      x2: pos.x, y2: pos.y,
      color: drawColor, size: drawSize, eraser: drawMode === "eraser",
    };
    drawStrokeOnCanvas(stroke);
    sendStrokeThrottled(stroke);
    lastPos.current = pos;
  };

  const handleCanvasTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clearWhiteboard = () => {
    allStrokesRef.current = [];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, CANVAS_W, CANVAS_H);
    sendWs({ type: "webrtc_whiteboard_clear", roomId });
  };

  const qaTicketMutation = useMutation({
    mutationFn: async (data: { title: string; description: string }) => {
      const res = await apiRequest("POST", "/api/support-tickets", { ...data, priority: "medium" });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "تم إنشاء التذكرة", description: "تم إرسال طلب الدعم الفني بنجاح" });
      setQaTicketTitle("");
      setQaTicketDesc("");
    },
    onError: () => toast({ title: "خطأ", description: "تعذّر إنشاء التذكرة", variant: "destructive" }),
  });

  if (meetingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #080e1a 0%, #0d1630 100%)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
          <p className="text-white/30 text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (meetingError || !meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-6" dir="rtl" style={{ background: "linear-gradient(135deg, #080e1a 0%, #0d1630 100%)" }}>
        <div className="space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-white text-xl font-bold">الاجتماع غير موجود</h2>
          <p className="text-white/40">رابط الاجتماع غير صحيح أو منتهي الصلاحية</p>
          <Button onClick={() => window.close() || navigate("/dashboard")} variant="outline" className="border-white/15 text-white/70 hover:bg-white/10">
            إغلاق
          </Button>
        </div>
      </div>
    );
  }

  if (wasKicked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-6" dir="rtl" style={{ background: "linear-gradient(135deg, #080e1a 0%, #0d1630 100%)" }}>
        <div className="space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto">
            <UserMinus className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-white text-xl font-bold">تم إزالتك من الاجتماع</h2>
          <p className="text-white/40">قام المضيف بإزالتك من هذا الاجتماع</p>
          <Button onClick={() => window.close() || navigate("/dashboard")} variant="outline" className="border-white/15 text-white/70 hover:bg-white/10">
            إغلاق
          </Button>
        </div>
      </div>
    );
  }

  if (lobbyWaiting) {
    const [lFrom, lTo] = getAvatarColor(userName);
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-6" dir="rtl" style={{ background: "linear-gradient(135deg, #080e1a 0%, #0d1630 100%)" }}>
        <div className="space-y-6 max-w-sm w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/25">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-amber-300 text-xs font-medium">صالة الانتظار</span>
          </div>
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-xl mx-auto animate-pulse"
            style={{ background: `linear-gradient(135deg, ${lFrom}, ${lTo})` }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-2">
            <h2 className="text-white text-xl font-bold">{meeting?.title || "الاجتماع"}</h2>
            <p className="text-white/50 text-sm">طلبك قيد المراجعة من المضيف</p>
            <p className="text-white/30 text-xs">سيتم إشعارك فور الموافقة…</p>
          </div>
          <div className="flex justify-center gap-1.5 mt-2">
            {[0,1,2].map(i => (
              <span key={i} className="w-2 h-2 rounded-full bg-amber-400/70 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
          <Button onClick={() => navigate("/dashboard")} variant="outline" className="border-white/15 text-white/60 hover:bg-white/10 text-sm">
            إلغاء والعودة
          </Button>
        </div>
      </div>
    );
  }

  const myPhotoUrl = (user as any)?.profilePhotoUrl || (user as any)?.avatarUrl || "";
  const localPeer: Peer = { id: userId || "local", name: userName, stream: localStream || undefined, audioOn, videoOn, photoUrl: myPhotoUrl, speaking: speakingPeers.has(userId || "local") };
  const allPeers = [localPeer, ...Array.from(peers.values()).map(p => ({ ...p, speaking: speakingPeers.has(p.id) }))];
  const totalPeers = allPeers.length;
  const gridCols = totalPeers === 1 ? "grid-cols-1" : totalPeers === 2 ? "grid-cols-2" : totalPeers <= 4 ? "grid-cols-2" : "grid-cols-3";

  const totalRequestsBadge = pendingJoinRequests.length + pendingScreenShareRequests.length;

  if (showGuestNameInput) {
    const handleGuestSubmit = () => {
      const name = directGuestName.trim();
      if (!name) return;
      const id = "guest_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("qmeet_guest_id", id);
      sessionStorage.setItem("qmeet_guest_name", name);
      setDirectGuestId(id);
      setShowGuestNameInput(false);
    };
    return (
      <div className="min-h-screen flex items-center justify-center p-6" dir="rtl" style={{ background: "linear-gradient(135deg, #080e1a 0%, #0d1630 100%)" }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/25 mb-5">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-blue-300 text-xs font-medium">QMeet</span>
            </div>
            <h1 className="text-white text-xl font-bold mb-1">{meeting.title}</h1>
            <p className="text-white/35 text-sm">{meeting.hostName}</p>
          </div>
          <div className="rounded-2xl p-6 space-y-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
            <div>
              <label className="text-white/55 text-xs font-semibold uppercase tracking-wide block mb-2">اسمك في الاجتماع</label>
              <input
                type="text"
                value={directGuestName}
                onChange={e => setDirectGuestName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && directGuestName.trim() && handleGuestSubmit()}
                placeholder="أدخل اسمك..."
                className="w-full rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                autoFocus
                data-testid="input-guest-name-room"
              />
            </div>
            <button
              onClick={handleGuestSubmit}
              disabled={!directGuestName.trim()}
              className="w-full h-11 rounded-xl text-white font-semibold transition-all disabled:opacity-40 hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5)" }}
              data-testid="button-submit-guest-name"
            >
              متابعة للاجتماع
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!joined) {
    const [lobbyFrom, lobbyTo] = getAvatarColor(userName);
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl" style={{ background: "linear-gradient(135deg, #080e1a 0%, #0d1630 100%)" }}>
        <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-6 items-center lg:items-stretch">

          {/* Camera preview */}
          <div className="w-full lg:flex-1 rounded-2xl overflow-hidden relative shadow-2xl" style={{ aspectRatio: "16/9", background: "#0d1420" }}>
            {localStream && videoOn ? (
              <video
                ref={(el) => { if (el && localStream) { el.srcObject = localStream; el.play().catch(() => {}); } }}
                autoPlay muted playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl"
                  style={{ background: `linear-gradient(135deg, ${lobbyFrom}, ${lobbyTo})` }}
                >
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-white/50 text-sm">{userName}</span>
              </div>
            )}
            {/* Media controls overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-full border backdrop-blur-sm transition-all hover:scale-105 ${audioOn ? "bg-white/15 border-white/20 text-white" : "bg-red-500/90 border-red-400/50 text-white"}`}
                data-testid="button-toggle-audio-lobby"
                title={audioOn ? "كتم الميكروفون" : "تشغيل الميكروفون"}
              >
                {audioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full border backdrop-blur-sm transition-all hover:scale-105 ${videoOn ? "bg-white/15 border-white/20 text-white" : "bg-red-500/90 border-red-400/50 text-white"}`}
                data-testid="button-toggle-video-lobby"
                title={videoOn ? "إيقاف الكاميرا" : "تشغيل الكاميرا"}
              >
                {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Join card */}
          <div className="w-full lg:w-80 flex flex-col justify-center gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/25 mb-4">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                <span className="text-blue-300 text-xs font-medium">QMeet</span>
              </div>
              <h1 className="text-white text-2xl font-bold leading-tight mb-1">{meeting.title}</h1>
              <p className="text-white/35 text-sm">{meeting.hostName}</p>
            </div>

            {mediaError && (
              <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
                <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                <p className="text-yellow-300/80 text-xs leading-relaxed">{mediaError}</p>
              </div>
            )}

            <div className="space-y-2.5">
              <button
                onClick={joinMeeting}
                className="w-full h-12 rounded-xl text-white font-semibold transition-all hover:opacity-90 hover:scale-[1.01] shadow-lg"
                style={{ background: "linear-gradient(135deg, #16a34a, #059669)" }}
                data-testid="button-join-meeting"
              >
                انضم الآن
              </button>
              <button
                onClick={() => window.close() || navigate("/dashboard")}
                className="w-full h-11 rounded-xl font-medium text-white/50 hover:text-white/70 transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                data-testid="button-cancel-join"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const PANEL_TABS: { id: PanelTab; label: string; icon: any; badge?: number }[] = [
    { id: 'chat', label: 'الدردشة', icon: MessageSquare },
    { id: 'participants', label: 'المشاركون', icon: Users },
    { id: 'notes', label: 'ملاحظاتي', icon: NotebookPen },
    { id: 'whiteboard', label: 'السبورة', icon: Pencil },
    { id: 'page', label: 'عرض صفحة', icon: Layout },
    { id: 'actions', label: 'إجراءات', icon: Zap },
    ...(isHost ? [{ id: 'requests' as PanelTab, label: 'الطلبات', icon: Bell, badge: totalRequestsBadge }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col relative" dir="rtl" style={{ background: "linear-gradient(160deg, #080e1a 0%, #0a1020 50%, #080e1a 100%)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 shrink-0" style={{ background: "rgba(8,14,26,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}>
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-300 text-[10px] font-semibold">مباشر</span>
          </div>
          <span className="text-white font-semibold text-sm truncate max-w-48">{meeting.title}</span>
          {lobbyEnabled && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
              <Lock className="w-2.5 h-2.5" />محمي
            </span>
          )}
          {!wsReady && (
            <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-500/20">إعادة الاتصال...</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white/40 text-xs" style={{ background: "rgba(255,255,255,0.05)" }}>
            <Clock className="w-3 h-3" />
            <span className="font-mono">{meetingTimer}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white/40 text-xs" style={{ background: "rgba(255,255,255,0.05)" }}>
            <Users className="w-3 h-3" />
            <span>{totalPeers}</span>
          </div>
          <button
            onClick={copyLink}
            className="p-2 rounded-xl text-white/40 hover:text-white transition-all hover:bg-white/10"
            title="نسخ الرابط"
            data-testid="button-copy-link"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Join Request Alert Banner (host only) ─────────────────────────── */}
      {isHost && pendingJoinRequests.length > 0 && (
        <div className="shrink-0 z-50 px-3 py-2" style={{ background: "rgba(245,158,11,0.12)", borderBottom: "1px solid rgba(245,158,11,0.25)" }}>
          <div className="flex items-center gap-3 max-w-3xl mx-auto">
            <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 animate-bounce" style={{ background: "rgba(245,158,11,0.2)" }}>
              <Bell className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-amber-200 text-xs font-bold leading-tight">
                {pendingJoinRequests.length === 1
                  ? `${pendingJoinRequests[0].userName} يطلب الانضمام للاجتماع`
                  : `${pendingJoinRequests.length} أشخاص ينتظرون الموافقة`}
              </p>
              {pendingJoinRequests.length === 1 && pendingJoinRequests[0].userPhone && (
                <p className="text-amber-400/60 text-[10px]">{pendingJoinRequests[0].userPhone}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={async () => {
                  const req = pendingJoinRequests[0];
                  try {
                    await apiRequest("PATCH", `/api/qmeet/meetings/${(meeting as any)._id || (meeting as any).id}/join-requests/${req.userId}`, { action: "approve" });
                    setPendingJoinRequests(prev => prev.filter(r => r.userId !== req.userId));
                    toast({ title: "✅ تمت الموافقة", description: `وافقت على انضمام ${req.userName}` });
                  } catch { toast({ title: "خطأ في الموافقة", variant: "destructive" }); }
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-green-300 transition-all"
                style={{ background: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.3)" }}
                data-testid="button-banner-approve"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                قبول
              </button>
              <button
                onClick={async () => {
                  const req = pendingJoinRequests[0];
                  try {
                    await apiRequest("PATCH", `/api/qmeet/meetings/${(meeting as any)._id || (meeting as any).id}/join-requests/${req.userId}`, { action: "reject" });
                    setPendingJoinRequests(prev => prev.filter(r => r.userId !== req.userId));
                  } catch { toast({ title: "خطأ في الرفض", variant: "destructive" }); }
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-red-300 transition-all"
                style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)" }}
                data-testid="button-banner-reject"
              >
                <XCircle className="w-3.5 h-3.5" />
                رفض
              </button>
              {pendingJoinRequests.length > 1 && (
                <button
                  onClick={() => setActivePanel("requests")}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-300 transition-all"
                  style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)" }}
                  data-testid="button-banner-view-all"
                >
                  عرض الكل ({pendingJoinRequests.length})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {screenSharerPeerId ? (() => {
            const sharerIsLocal = screenSharerPeerId === (userId || "local");
            const sharerPeer = sharerIsLocal ? localPeer : peers.get(screenSharerPeerId);
            const otherPeers = allPeers.filter(p => p.id !== screenSharerPeerId);
            return (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-2 shrink-0" style={{ background: "rgba(37,99,235,0.12)", borderBottom: "1px solid rgba(37,99,235,0.2)" }}>
                  <Monitor className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="text-blue-200/90 text-xs font-medium">
                    {sharerIsLocal ? "أنت تشارك شاشتك" : `${screenSharerName || "مشارك"} يشارك شاشته`}
                  </span>
                  {sharerIsLocal && (
                    <button onClick={toggleScreenShare} className="mr-auto px-3 py-1 rounded-full text-xs font-medium transition-all" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                      إيقاف المشاركة
                    </button>
                  )}
                </div>
                <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
                  {sharerPeer && <VideoTile peer={sharerPeer} local={sharerIsLocal} spotlight={true} canKick={false} />}
                </div>
                {otherPeers.length > 0 && (
                  <div className="h-28 sm:h-32 shrink-0 flex gap-2 px-2 py-2 overflow-x-auto scrollbar-none" style={{ background: "rgba(8,14,26,0.8)" }}>
                    {otherPeers.map(peer => (
                      <div key={peer.id} className="shrink-0 w-44 sm:w-48">
                        <VideoTile peer={peer} local={peer.id === (userId || "local")} canKick={isAdmin} onKick={() => kickPeer(peer.id)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })() : (
          <div className="flex-1 p-2.5 sm:p-4 overflow-hidden">
            <div className={`grid ${gridCols} gap-2.5 h-full`} style={{ maxHeight: "calc(100vh - 140px)" }}>
              {allPeers.map(peer => (
                <VideoTile
                  key={peer.id}
                  peer={peer}
                  local={peer.id === (userId || "local")}
                  canKick={isAdmin}
                  onKick={() => kickPeer(peer.id)}
                />
              ))}
            </div>
          </div>
          )}
        </div>

        {/* Side panel */}
        {activePanel && (
          <AnimatePresence>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-80 flex flex-col shrink-0"
              style={{ background: "rgba(10,16,30,0.97)", borderRight: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}
            >
            <div className="flex items-center border-b overflow-x-auto scrollbar-none shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {PANEL_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActivePanel(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-3 text-[11px] font-medium whitespace-nowrap transition-all ${activePanel === tab.id ? "text-white" : "text-white/35 hover:text-white/60"}`}
                  style={activePanel === tab.id ? { borderBottom: "2px solid #3b82f6" } : {}}
                  data-testid={`button-panel-${tab.id}`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
              <button onClick={() => setActivePanel(null)} className="ml-auto p-2 text-white/30 hover:text-white shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Chat panel ── */}
            {activePanel === 'chat' && (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {chatMessages.length === 0 && <p className="text-white/30 text-xs text-center py-8">لا توجد رسائل بعد</p>}
                  {chatMessages.map((msg, i) => (
                    <div key={`${msg.ts}-${i}`} className={`flex flex-col gap-0.5 ${msg.self ? "items-end" : "items-start"}`}>
                      <span className="text-white/40 text-[10px]">{msg.self ? "أنت" : msg.name}</span>
                      <div className={`px-3 py-1.5 rounded-xl text-sm max-w-[90%] break-words ${msg.self ? "bg-white text-black" : "bg-white/10 text-white"}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t border-white/[0.06] flex gap-2 shrink-0">
                  <Input
                    value={chatMsg}
                    onChange={e => setChatMsg(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()}
                    placeholder="اكتب رسالة..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm h-8"
                    data-testid="input-chat-message"
                  />
                  <button onClick={sendChat} disabled={!chatMsg.trim()} className="p-2 bg-white text-black rounded-lg hover:bg-white/90 disabled:opacity-40 transition-colors shrink-0" data-testid="button-send-chat">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}

            {/* ── Participants panel ── */}
            {activePanel === 'participants' && (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Host controls row */}
                {isHost && (
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] shrink-0">
                    <button
                      onClick={async () => {
                        if (!meeting) return;
                        setLobbyToggling(true);
                        try {
                          const r = await fetch(`/api/qmeet/meetings/${meeting._id || meeting.id}/toggle-lobby`, { method: "PATCH", credentials: "include" });
                          if (r.ok) { const d = await r.json(); setLobbyEnabled(d.lobbyEnabled); }
                        } catch {} finally { setLobbyToggling(false); }
                      }}
                      disabled={lobbyToggling}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${lobbyEnabled ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-white/[0.06] text-white/50 hover:bg-white/10 hover:text-white/80"}`}
                      data-testid="button-toggle-lobby"
                      title={lobbyEnabled ? "إيقاف صالة الانتظار" : "تفعيل صالة الانتظار"}
                    >
                      {lobbyEnabled ? <Lock className="w-3 h-3" /> : <LockOpen className="w-3 h-3" />}
                      {lobbyEnabled ? "مقفل" : "مفتوح"}
                    </button>
                    <button
                      onClick={() => { setShowInviteModal(true); setInviteTab("internal"); setInviteSearch(""); setInviteSelected([]); setExtEmail(""); setExtName(""); }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors mr-auto"
                      data-testid="button-open-invite"
                      title="دعوة مشاركين"
                    >
                      <UserPlus className="w-3 h-3" />
                      دعوة
                    </button>
                  </div>
                )}
                {/* Participants list */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {allPeers.map(peer => {
                    const isLocal = peer.id === (userId || "local");
                    return (
                      <div key={peer.id} className="flex items-center gap-2.5 bg-white/[0.05] rounded-xl px-3 py-2.5" data-testid={`participant-${peer.id}`}>
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
                          {peer.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">{peer.name}{isLocal ? " (أنت)" : ""}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {peer.audioOn ? <Mic className="w-3 h-3 text-green-400" /> : <MicOff className="w-3 h-3 text-red-400" />}
                            {peer.videoOn ? <Video className="w-3 h-3 text-green-400" /> : <VideoOff className="w-3 h-3 text-red-400" />}
                          </div>
                        </div>
                        {isAdmin && !isLocal && (
                          <button onClick={() => kickPeer(peer.id)} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors" title="طرد" data-testid={`button-kick-panel-${peer.id}`}>
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Whiteboard panel ── */}
            {activePanel === 'whiteboard' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] shrink-0 flex-wrap">
                  <button onClick={() => setDrawMode("pen")} className={`p-1.5 rounded-lg transition-colors ${drawMode === "pen" ? "bg-white/20 text-white" : "text-white/40 hover:text-white"}`} title="قلم">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDrawMode("eraser")} className={`p-1.5 rounded-lg transition-colors ${drawMode === "eraser" ? "bg-white/20 text-white" : "text-white/40 hover:text-white"}`} title="ممحاة">
                    <Eraser className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center gap-1">
                    {["#ffffff", "#ef4444", "#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6"].map(c => (
                      <button key={c} onClick={() => { setDrawColor(c); setDrawMode("pen"); }} className={`w-4 h-4 rounded-full transition-all ${drawColor === c ? "ring-2 ring-white ring-offset-1 ring-offset-gray-900" : ""}`} style={{ backgroundColor: c }} />
                    ))}
                    <input type="color" value={drawColor} onChange={e => { setDrawColor(e.target.value); setDrawMode("pen"); }} className="w-4 h-4 rounded cursor-pointer bg-transparent border-0 p-0" title="لون مخصص" />
                  </div>
                  <select value={drawSize} onChange={e => setDrawSize(Number(e.target.value))} className="text-[10px] bg-white/10 text-white border-0 rounded px-1 py-0.5 outline-none">
                    <option value={2}>رفيع</option>
                    <option value={5}>متوسط</option>
                    <option value={12}>سميك</option>
                  </select>
                  <button onClick={clearWhiteboard} className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/20 transition-colors mr-auto" title="مسح الكل" data-testid="button-clear-whiteboard">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto bg-gray-950">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_W}
                    height={CANVAS_H}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    onTouchStart={handleCanvasTouchStart}
                    onTouchMove={handleCanvasTouchMove}
                    onTouchEnd={handleCanvasTouchEnd}
                    style={{
                      cursor: drawMode === "eraser" ? "cell" : "crosshair",
                      touchAction: "none",
                      display: "block",
                      minWidth: "100%",
                      backgroundColor: "#030712",
                    }}
                    data-testid="canvas-whiteboard"
                  />
                </div>
              </div>
            )}

            {/* ── Page viewer panel ── */}
            {activePanel === 'page' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-3 border-b border-white/[0.06] flex gap-2 items-center shrink-0">
                  <select
                    value={selectedPage}
                    onChange={e => setSelectedPage(e.target.value)}
                    className="flex-1 text-xs bg-white/10 text-white border border-white/20 rounded-lg px-2 py-1.5 outline-none"
                    data-testid="select-system-page"
                  >
                    {SYSTEM_PAGES.map(p => (
                      <option key={p.path} value={p.path}>{p.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setIframeSrc(selectedPage)}
                    className="shrink-0 px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-white/90 transition-colors"
                    data-testid="button-load-page"
                  >
                    عرض
                  </button>
                  <button onClick={() => window.open(selectedPage, '_blank')} className="shrink-0 p-1.5 text-white/40 hover:text-white transition-colors" title="فتح في تاب جديد">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  {iframeSrc ? (
                    <iframe src={iframeSrc} className="w-full h-full border-0" title="عارض الصفحة" data-testid="iframe-page-viewer" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white/30 gap-3">
                      <Globe className="w-10 h-10 opacity-30" />
                      <p className="text-sm">اختر صفحة واضغط "عرض"</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Quick actions panel ── */}
            {activePanel === 'actions' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <div>
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2">روابط سريعة</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "طلب جديد", icon: Plus, path: "/order" },
                      { label: "متابعة المشاريع", icon: FileText, path: "/projects" },
                      { label: "الدعم الفني", icon: Headphones, path: "/support" },
                      { label: "استشارة", icon: Video, path: "/consultation" },
                    ].map(item => (
                      <button
                        key={item.path}
                        onClick={() => window.open(item.path, '_blank')}
                        className="flex flex-col items-center gap-1.5 bg-white/[0.05] hover:bg-white/[0.1] rounded-xl p-3 transition-colors"
                        data-testid={`button-qa-${item.path.replace('/', '')}`}
                      >
                        <item.icon className="w-5 h-5 text-white/60" />
                        <span className="text-white/70 text-[11px] font-medium text-center">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2">رفع شكوى / دعم سريع</p>
                  <div className="space-y-2">
                    <Input
                      value={qaTicketTitle}
                      onChange={e => setQaTicketTitle(e.target.value)}
                      placeholder="عنوان الشكوى..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-xs h-8"
                      data-testid="input-qa-ticket-title"
                    />
                    <Textarea
                      value={qaTicketDesc}
                      onChange={e => setQaTicketDesc(e.target.value)}
                      placeholder="وصف المشكلة..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-xs resize-none"
                      rows={3}
                      data-testid="input-qa-ticket-desc"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!qaTicketTitle.trim()) return;
                        qaTicketMutation.mutate({ title: qaTicketTitle, description: qaTicketDesc });
                      }}
                      disabled={qaTicketMutation.isPending || !qaTicketTitle.trim()}
                      className="w-full h-8 text-xs bg-white text-black hover:bg-white/90"
                      data-testid="button-qa-submit-ticket"
                    >
                      {qaTicketMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "إرسال الشكوى"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Notes panel ── */}
            {activePanel === 'notes' && (
              <div className="flex flex-col flex-1 overflow-hidden p-3 gap-3">
                <div className="flex items-center gap-2">
                  <NotebookPen className="w-4 h-4 text-violet-400" />
                  <p className="text-white/60 text-xs font-semibold">ملاحظاتك الشخصية — تحفظ مع الاجتماع</p>
                </div>
                <Textarea
                  value={meetingNotes}
                  onChange={e => { setMeetingNotes(e.target.value); setNotesSaved(false); }}
                  placeholder="اكتب ملاحظاتك هنا... (تسجيل نقاط مهمة، إجراءات مطلوبة، ...)"
                  className="flex-1 resize-none bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/25 text-sm focus:border-violet-500/50 min-h-[200px]"
                  dir="rtl"
                  data-testid="textarea-meeting-notes"
                />
                <button
                  onClick={async () => {
                    if (!meetingNotes.trim()) return;
                    try {
                      await fetch(`/api/qmeet/meetings-notes/${roomId}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ notes: meetingNotes, userName }),
                      });
                      setNotesSaved(true);
                      toast({ title: "✅ تم حفظ الملاحظات" });
                    } catch { toast({ title: "فشل الحفظ", variant: "destructive" }); }
                  }}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${notesSaved ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-violet-600 hover:bg-violet-500 text-white"}`}
                  data-testid="button-save-notes"
                >
                  {notesSaved ? <><Check className="w-4 h-4" /> تم الحفظ</> : <><NotebookPen className="w-4 h-4" /> حفظ الملاحظات</>}
                </button>
              </div>
            )}

            {/* ── Requests panel (host only) ── */}
            {activePanel === 'requests' && isHost && (
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* Screen share requests */}
                {pendingScreenShareRequests.length > 0 && (
                  <div>
                    <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2">طلبات مشاركة الشاشة</p>
                    <div className="space-y-2">
                      {pendingScreenShareRequests.map((req) => (
                        <div key={req.userId} className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 space-y-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
                              {req.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-xs font-bold truncate">{req.name}</p>
                              <p className="text-blue-300/60 text-[10px]">يريد مشاركة شاشته</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => approveScreenShare(req.userId)} className="flex-1 flex items-center justify-center gap-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg py-1.5 text-xs font-bold transition-colors" data-testid={`button-approve-screen-${req.userId}`}>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              موافقة
                            </button>
                            <button onClick={() => denyScreenShare(req.userId)} className="flex-1 flex items-center justify-center gap-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg py-1.5 text-xs font-bold transition-colors" data-testid={`button-deny-screen-${req.userId}`}>
                              <XCircle className="w-3.5 h-3.5" />
                              رفض
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Join requests */}
                <div>
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2">طلبات الانضمام بالكود</p>
                  {pendingJoinRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3 text-white/20">
                      <Bell className="w-8 h-8" />
                      <p className="text-xs">لا توجد طلبات انضمام</p>
                    </div>
                  ) : pendingJoinRequests.map((req) => {
                    const meetingId = (meeting as any)._id || (meeting as any).id;
                    const reqTime = req.requestedAt
                      ? new Date(req.requestedAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })
                      : "";
                    return (
                      <div key={req._tempId || req.userId} className="rounded-xl p-3 space-y-2.5 mb-2" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)" }}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm" style={{ background: "rgba(245,158,11,0.2)", color: "#fbbf24" }}>
                            {(req.userName || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-bold truncate">{req.userName}</p>
                            {req.userEmail && <p className="text-white/30 text-[10px] truncate">{req.userEmail}</p>}
                            {req.userPhone && (
                              <p className="text-amber-400/70 text-[10px] font-mono">{req.userPhone}</p>
                            )}
                            {reqTime && (
                              <p className="text-white/20 text-[10px]">طلب الدخول: {reqTime}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                await apiRequest("PATCH", `/api/qmeet/meetings/${meetingId}/join-requests/${req.userId}`, { action: "approve" });
                                setPendingJoinRequests(prev => prev.filter(r => r.userId !== req.userId));
                                toast({ title: "✅ تمت الموافقة", description: `وافقت على انضمام ${req.userName}` });
                              } catch (e: any) {
                                toast({ title: "خطأ", description: e?.message || "فشل", variant: "destructive" });
                              }
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-colors"
                            style={{ background: "rgba(34,197,94,0.18)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)" }}
                            data-testid={`button-approve-${req.userId}`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            قبول
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await apiRequest("PATCH", `/api/qmeet/meetings/${meetingId}/join-requests/${req.userId}`, { action: "reject" });
                                setPendingJoinRequests(prev => prev.filter(r => r.userId !== req.userId));
                                toast({ title: "تم الرفض" });
                              } catch (e: any) {
                                toast({ title: "خطأ", description: e?.message || "فشل", variant: "destructive" });
                              }
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-colors"
                            style={{ background: "rgba(239,68,68,0.18)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}
                            data-testid={`button-reject-${req.userId}`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            رفض
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Floating reactions overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        <AnimatePresence>
          {floatingReactions.map(r => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -220, scale: 1.2 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 2.8, ease: "easeOut" }}
              className="absolute bottom-20 flex flex-col items-center gap-1"
              style={{ left: `${r.x}%` }}
            >
              <span className="text-4xl filter drop-shadow-lg">{r.emoji}</span>
              <span className="text-white/60 text-[10px] bg-black/40 rounded-full px-2 py-0.5 backdrop-blur-sm">{r.name}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Emoji Picker popup */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 rounded-2xl p-3 shadow-2xl backdrop-blur-xl"
            style={{ background: "rgba(12,18,32,0.97)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex gap-2 flex-wrap justify-center max-w-[200px]">
              {REACTION_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="text-2xl hover:scale-125 transition-transform p-1 rounded-xl hover:bg-white/10"
                  data-testid={`btn-reaction-${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen share pending notification */}
      {screenSharePending && !isHost && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl whitespace-nowrap" style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(59,130,246,0.3)" }}>
          <Loader2 className="w-3.5 h-3.5 text-blue-300 animate-spin shrink-0" />
          <span className="text-blue-200 text-xs font-medium">في انتظار موافقة المضيف على مشاركة شاشتك...</span>
          <button onClick={() => setScreenSharePending(false)} className="text-blue-400/60 hover:text-blue-200 transition-colors"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ── Invite Participants Modal ── */}
      {showInviteModal && (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ background: "rgba(12,18,32,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.07]">
              <UserPlus className="w-5 h-5 text-blue-400" />
              <span className="text-white font-bold text-base">دعوة مشاركين</span>
              <button onClick={() => setShowInviteModal(false)} className="mr-auto text-white/40 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/[0.07]">
              {([["internal", "من النظام", Users], ["external", "بريد خارجي", Mail]] as const).map(([t, label, Icon]) => (
                <button key={t} onClick={() => { setInviteTab(t); setInviteSearch(""); setInviteSearchResults([]); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-colors ${inviteTab === t ? "text-blue-300 border-b-2 border-blue-400" : "text-white/40 hover:text-white/70"}`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4">
              {inviteTab === "internal" ? (
                <>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input value={inviteSearch} onChange={e => setInviteSearch(e.target.value)}
                      placeholder="ابحث باسم المستخدم أو البريد..."
                      className="pr-9 text-sm placeholder:text-white/30"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                      data-testid="input-invite-search" autoFocus />
                  </div>

                  {/* Search results */}
                  {inviteSearchResults.length > 0 && (
                    <div className="rounded-xl overflow-hidden max-h-44 overflow-y-auto" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                      {inviteSearchResults.map((u: any) => {
                        const sel = inviteSelected.some((s: any) => s.id === u.id);
                        return (
                          <button key={u.id} onClick={() => setInviteSelected(prev => sel ? prev.filter((s: any) => s.id !== u.id) : [...prev, u])}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-right transition-colors ${sel ? "bg-blue-500/20" : "hover:bg-white/[0.04]"}`}
                            data-testid={`invite-user-${u.id}`}>
                            <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                              {(u.fullName || u.username || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0 text-right">
                              <p className="text-white text-xs font-medium truncate">{u.fullName || u.username}</p>
                              <p className="text-white/40 text-[10px] truncate">{u.email}</p>
                            </div>
                            {sel && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Selected chips */}
                  {inviteSelected.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {inviteSelected.map((u: any) => (
                        <span key={u.id} className="flex items-center gap-1 bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full border border-blue-500/30">
                          {u.fullName || u.username}
                          <button onClick={() => setInviteSelected(prev => prev.filter((s: any) => s.id !== u.id))}><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}

                  {inviteSearch && inviteSearchResults.length === 0 && (
                    <p className="text-white/30 text-xs text-center py-2">لا توجد نتائج</p>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="text-white/60 text-xs font-medium block mb-1.5">البريد الإلكتروني <span className="text-red-400">*</span></label>
                    <Input value={extEmail} onChange={e => setExtEmail(e.target.value)}
                      placeholder="example@email.com"
                      type="email"
                      className="text-sm placeholder:text-white/30 text-left"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", direction: "ltr" }}
                      data-testid="input-invite-email" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs font-medium block mb-1.5">الاسم (اختياري)</label>
                    <Input value={extName} onChange={e => setExtName(e.target.value)}
                      placeholder="اسم المدعو"
                      className="text-sm placeholder:text-white/30"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                      data-testid="input-invite-name" />
                  </div>
                </>
              )}

              <button
                disabled={inviteLoading || (inviteTab === "internal" ? inviteSelected.length === 0 : !extEmail.trim())}
                onClick={async () => {
                  if (!meeting) return;
                  setInviteLoading(true);
                  try {
                    const body = inviteTab === "internal"
                      ? { userIds: inviteSelected.map((u: any) => u.id || u._id), names: inviteSelected.map((u: any) => u.fullName || u.username) }
                      : { emails: [extEmail.trim()], names: [extName.trim() || "مشارك"] };
                    const r = await fetch(`/api/qmeet/meetings/${meeting._id || meeting.id}/invite`, {
                      method: "POST", credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(body),
                    });
                    if (r.ok) {
                      toast({ title: "تم الإرسال!", description: inviteTab === "internal" ? `تمت دعوة ${inviteSelected.length} مستخدم` : `تم إرسال الدعوة لـ ${extEmail}` });
                      setShowInviteModal(false);
                    } else {
                      const d = await r.json().catch(() => ({}));
                      toast({ title: "خطأ", description: d.message || "فشل الإرسال", variant: "destructive" });
                    }
                  } catch { toast({ title: "خطأ في الاتصال", variant: "destructive" }); }
                  finally { setInviteLoading(false); }
                }}
                className="w-full h-11 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
                data-testid="button-send-invite"
              >
                {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" />{inviteTab === "internal" ? "إرسال الدعوة للمختارين" : "إرسال الدعوة بالبريد"}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Android WebView: screen share not supported — show copy-link banner */}
      {isAndroidWebViewDevice && (
        <div className="absolute top-14 left-2 right-2 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl" style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)" }}>
          <Monitor className="w-4 h-4 text-yellow-300 shrink-0" />
          <span className="text-yellow-200 text-xs leading-snug flex-1">مشاركة الشاشة تتطلب فتح الاجتماع في Chrome مباشرة</span>
          <button
            onClick={() => { navigator.clipboard?.writeText(window.location.href).then(() => toast({ title: "تم النسخ!", description: "افتح Chrome والصق الرابط" })); }}
            className="shrink-0 text-yellow-300 hover:text-yellow-100 underline text-xs font-semibold transition-colors"
            data-testid="button-copy-link-webview"
          >نسخ الرابط</button>
        </div>
      )}

      {/* Screen share approved notification */}
      {screenShareApproved && !screenSharing && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-3 py-2 rounded-2xl shadow-2xl backdrop-blur-xl whitespace-nowrap" style={{ background: "rgba(22,163,74,0.15)", border: "1px solid rgba(74,222,128,0.3)" }}>
          <MonitorUp className="w-4 h-4 text-green-300 shrink-0" />
          <span className="text-green-200 text-sm font-semibold hidden sm:inline">تمت الموافقة!</span>
          {/* Direct "Start Now" tap — critical for mobile user gesture */}
          <button
            onClick={toggleScreenShare}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
            style={{ background: "rgba(22,163,74,0.85)", border: "1px solid rgba(74,222,128,0.5)" }}
            data-testid="button-screen-share-start-now"
          >
            <MonitorUp className="w-3.5 h-3.5" />
            <span>ابدأ الآن</span>
          </button>
          <button onClick={() => setScreenShareApproved(false)} className="text-green-400/60 hover:text-green-200 transition-colors"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ── More menu popup (mobile) ── */}
      <AnimatePresence>
        {showMoreMenu && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-[72px] left-2 right-2 z-40 rounded-2xl p-3 shadow-2xl backdrop-blur-xl"
            style={{ background: "rgba(12,18,32,0.95)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PANEL_TABS.map(tab => (
                <button key={tab.id} onClick={() => { togglePanel(tab.id); setShowMoreMenu(false); }}
                  className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-[11px] font-medium transition-all ${activePanel === tab.id ? "bg-white/20 text-white" : "text-white/50 hover:text-white hover:bg-white/10"}`}>
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {tab.id === 'chat' && unreadChat > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadChat > 9 ? "9+" : unreadChat}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
              <button onClick={() => { toggleScreenShare(); setShowMoreMenu(false); }}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-[11px] font-medium transition-all ${screenSharing ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : screenShareApproved ? "bg-green-500/20 text-green-300 border border-green-500/30 animate-pulse" : screenSharePending ? "bg-yellow-500/20 text-yellow-300" : "text-white/50 hover:text-white hover:bg-white/10"}`}
                data-testid="button-screen-share-more">
                {screenSharing ? <MonitorOff className="w-5 h-5" /> : screenShareApproved ? <MonitorUp className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                <span>{screenSharing ? "إيقاف الشاشة" : screenShareApproved ? "ابدأ المشاركة!" : isHost || isStaff ? "مشاركة الشاشة" : "طلب مشاركة"}</span>
              </button>
              {videoOn && !screenSharing && (
                <button onClick={() => { flipCamera(); setShowMoreMenu(false); }}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-[11px] font-medium text-white/50 hover:text-white hover:bg-white/10 transition-all"
                  data-testid="button-flip-camera-more">
                  <SwitchCamera className="w-5 h-5" />
                  <span>قلب الكاميرا</span>
                </button>
              )}
              <button onClick={() => { toggleRaiseHand(); setShowMoreMenu(false); }}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-[11px] font-medium transition-all ${raisedHand ? "bg-amber-500/20 text-amber-300" : "text-white/50 hover:text-white hover:bg-white/10"}`}>
                <Hand className="w-5 h-5" />
                <span>{raisedHand ? "إنزال اليد" : "رفع اليد"}</span>
              </button>
              <button onClick={() => { setShowEmojiPicker(p => !p); setShowMoreMenu(false); }}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-[11px] font-medium transition-all ${showEmojiPicker ? "bg-violet-500/20 text-violet-300" : "text-white/50 hover:text-white hover:bg-white/10"}`}>
                <Smile className="w-5 h-5" />
                <span>تفاعل</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control bar */}
      <div
        className="flex items-center justify-between px-3 shrink-0 gap-2"
        style={{
          background: "rgba(6,10,20,0.92)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: "10px",
          paddingBottom: "max(10px, env(safe-area-inset-bottom))",
        }}
      >
        {/* Left: panel tabs on desktop; "..." on mobile */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="hidden sm:flex items-center gap-0.5 overflow-x-auto scrollbar-none">
            {PANEL_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => togglePanel(tab.id)}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-[10px] font-medium transition-all shrink-0 ${
                  activePanel === tab.id
                    ? "text-blue-300"
                    : "text-white/35 hover:text-white/60"
                }`}
                style={activePanel === tab.id ? { background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.2)" } : {}}
                title={tab.label}
                data-testid={`button-panel-toggle-${tab.id}`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === 'chat' && unreadChat > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {unreadChat > 9 ? "9+" : unreadChat}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowMoreMenu(p => !p)}
            className={`sm:hidden flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-[10px] font-medium transition-all ${showMoreMenu ? "text-blue-300" : "text-white/35 hover:text-white/60"}`}
            style={showMoreMenu ? { background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.2)" } : {}}
            data-testid="button-more-menu"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span>المزيد</span>
          </button>
        </div>

        {/* Center: core controls pill */}
        <div className="flex items-center gap-2 shrink-0 px-3 py-2 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full transition-all hover:scale-105 ${audioOn ? "text-white" : "text-white"}`}
            style={audioOn
              ? { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }
              : { background: "rgba(239,68,68,0.85)", border: "1px solid rgba(239,68,68,0.6)" }}
            title={audioOn ? "كتم الميكروفون" : "تشغيل الميكروفون"}
            data-testid="button-toggle-audio"
          >
            {audioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-all hover:scale-105 text-white`}
            style={videoOn
              ? { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }
              : { background: "rgba(239,68,68,0.85)", border: "1px solid rgba(239,68,68,0.6)" }}
            title={videoOn ? "إيقاف الكاميرا" : "تشغيل الكاميرا"}
            data-testid="button-toggle-video"
          >
            {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
          {videoOn && !screenSharing && (
            <button
              onClick={flipCamera}
              className="p-3 rounded-full text-white/70 hover:text-white transition-all hover:scale-105"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
              title={`قلب الكاميرا (${cameraFacing === "user" ? "أمامية" : "خلفية"})`}
              data-testid="button-flip-camera"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={toggleScreenShare}
            className="p-3 rounded-full text-white transition-all hover:scale-105"
            style={screenSharing
              ? { background: "rgba(37,99,235,0.9)", border: "1px solid rgba(59,130,246,0.5)" }
              : screenShareApproved
              ? { background: "rgba(22,163,74,0.9)", border: "1px solid rgba(74,222,128,0.5)", animation: "pulse 1.5s infinite" }
              : screenSharePending
              ? { background: "rgba(234,179,8,0.2)", border: "1px solid rgba(234,179,8,0.35)" }
              : { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
            title={screenSharing ? "إيقاف مشاركة الشاشة" : screenShareApproved ? "تمت الموافقة — اضغط لبدء المشاركة" : isHost || isStaff ? "مشاركة الشاشة" : "طلب مشاركة الشاشة"}
            data-testid="button-screen-share"
          >
            {screenSharing ? <MonitorOff className="w-5 h-5" /> : screenShareApproved ? <MonitorUp className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </button>
          <button
            onClick={leaveMeeting}
            className="p-3 rounded-full text-white transition-all hover:scale-105 hover:brightness-110"
            style={{ background: "rgba(220,38,38,0.9)", border: "1px solid rgba(239,68,68,0.5)" }}
            title="مغادرة الاجتماع"
            data-testid="button-leave-meeting"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>

        {/* Right: raise hand + emoji (desktop only) */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <button
            onClick={toggleRaiseHand}
            className={`p-2.5 rounded-xl transition-all hover:scale-105 ${raisedHand ? "text-amber-300" : "text-white/40 hover:text-white/70"}`}
            style={raisedHand ? { background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.3)" } : {}}
            title={raisedHand ? "إنزال اليد" : "رفع اليد"}
            data-testid="button-raise-hand"
          >
            <Hand className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowEmojiPicker(p => !p)}
            className={`p-2.5 rounded-xl transition-all hover:scale-105 ${showEmojiPicker ? "text-violet-300" : "text-white/40 hover:text-white/70"}`}
            style={showEmojiPicker ? { background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.3)" } : {}}
            title="تفاعل بإيموجي"
            data-testid="button-emoji-reaction"
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
