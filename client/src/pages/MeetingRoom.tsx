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
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  PhoneOff, MessageSquare, X, Send, Users, Copy, Check,
  Loader2, AlertCircle, Pencil, Eraser, Trash2, Globe,
  Zap, FileText, Plus, Headphones, UserMinus,
  Layout, ExternalLink, CheckCircle2, XCircle, Bell, Smile, Hand,
  MoreHorizontal, NotebookPen, ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  return (
    <div className={`relative bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center ${spotlight ? "h-full w-full" : "aspect-video"} group`}>
      {!local && peer.stream && (
        <audio ref={audioRef} autoPlay playsInline style={{ display: "none" }} />
      )}
      {peer.stream && peer.videoOn ? (
        <video
          ref={videoCallbackRef}
          autoPlay
          playsInline
          muted={local}
          className={`w-full h-full ${objectFit} bg-gray-900`}
          data-testid={`video-tile-${peer.id}`}
        />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold text-white">
            {peer.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <span className="text-white/60 text-sm">{peer.name}</span>
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-1">
        <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
          {local ? `أنت (${peer.name})` : peer.name}
        </span>
        {!peer.audioOn && <span className="bg-red-500/80 text-white rounded-full p-0.5"><MicOff className="w-3 h-3" /></span>}
      </div>
      {canKick && onKick && !local && (
        <button
          onClick={onKick}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/90 text-white rounded-lg p-1.5 hover:bg-red-600"
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
  { label: "الطلبات", path: "/orders" },
  { label: "المشاريع", path: "/projects" },
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

  const [selectedPage, setSelectedPage] = useState(SYSTEM_PAGES[0].path);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);

  const [qaTicketTitle, setQaTicketTitle] = useState("");
  const [qaTicketDesc, setQaTicketDesc] = useState("");

  const [pendingJoinRequests, setPendingJoinRequests] = useState<any[]>([]);
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
        for (const peerId of data.peers) {
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
          if (!next.has(data.peerId)) next.set(data.peerId, { id: data.peerId, name: data.name || data.peerId, audioOn: true, videoOn: true });
          return next;
        });
        break;
      }
      case "webrtc_offer": {
        const pc = createPC(data.from);
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
        if (isHost) {
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
        toast({ title: "تمت الموافقة", description: "يمكنك الآن مشاركة شاشتك" });
        startScreenShare();
        break;
      }
      case "webrtc_screen_share_denied": {
        setScreenSharePending(false);
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
          ws.send(JSON.stringify({ type: "webrtc_join", roomId: rId, name: uName }));
          setJoined(true);
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
    if (!localStreamRef.current) return;
    const enabled = !videoOn;
    localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = enabled; });
    setVideoOn(enabled);
    sendWs({ type: "webrtc_media_state", roomId, audio: audioOn, video: enabled });
  }, [audioOn, videoOn, roomId, sendWs]);

  const stopScreenShare = useCallback(async () => {
    try {
      const cam = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const camTrack = cam.getVideoTracks()[0];
      pcsRef.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        if (sender) sender.replaceTrack(camTrack);
      });
      localStreamRef.current?.getVideoTracks().forEach(t => t.stop());
      const audio = localStreamRef.current?.getAudioTracks()[0];
      const newStream = new MediaStream([...(audio ? [audio] : []), camTrack]);
      localStreamRef.current = newStream;
      setLocalStream(newStream);
      setVideoOn(true);
    } catch {
      localStreamRef.current?.getVideoTracks().forEach(t => t.stop());
      const audio = localStreamRef.current?.getAudioTracks()[0];
      const newStream = new MediaStream(audio ? [audio] : []);
      localStreamRef.current = newStream;
      setLocalStream(newStream);
      setVideoOn(false);
    }
    setScreenSharing(false);
    setScreenSharerPeerId(null);
    setScreenSharerName(null);
    sendWs({ type: "webrtc_screen_share", roomId, active: false, name: userName });
  }, [sendWs, roomId, userName]);

  const startScreenShare = useCallback(async () => {
    try {
      const screen = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: false });
      const screenTrack = screen.getVideoTracks()[0];
      pcsRef.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      });
      localStreamRef.current?.getVideoTracks().forEach(t => t.stop());
      const audio = localStreamRef.current?.getAudioTracks()[0];
      const newStream = new MediaStream([...(audio ? [audio] : []), screenTrack]);
      localStreamRef.current = newStream;
      setLocalStream(newStream);
      setScreenSharing(true);
      setScreenSharerPeerId(userId || "local");
      setScreenSharerName(userName);
      sendWs({ type: "webrtc_screen_share", roomId, active: true, name: userName });
      screenTrack.onended = () => { if (screenSharingRef.current) stopScreenShare(); };
    } catch (err: any) {
      if (err?.name !== "NotAllowedError" && err?.name !== "AbortError") {
        toast({ title: "تعذّرت مشاركة الشاشة", description: "تأكد من منح الإذن", variant: "destructive" });
      }
    }
  }, [sendWs, roomId, userId, userName, toast, stopScreenShare]);

  const toggleScreenShare = useCallback(async () => {
    if (screenSharingRef.current) {
      await stopScreenShare();
      return;
    }
    // Host OR staff with no one else sharing → share directly without approval
    if (isHost || (isStaff && !screenSharerPeerId)) {
      await startScreenShare();
    } else {
      if (screenSharePending) {
        toast({ title: "في الانتظار", description: "طلبك قيد المراجعة من المضيف" });
        return;
      }
      setScreenSharePending(true);
      sendWs({ type: "webrtc_screen_share_request", roomId, name: userName });
      toast({ title: "تم الإرسال", description: "تم إرسال طلب مشاركة الشاشة للمضيف" });
    }
  }, [stopScreenShare, startScreenShare, isHost, isStaff, screenSharePending, screenSharerPeerId, sendWs, roomId, userName, toast]);

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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/30" />
      </div>
    );
  }

  if (meetingError || !meeting) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-center p-6" dir="rtl">
        <div className="space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-white text-xl font-bold">الاجتماع غير موجود</h2>
          <p className="text-white/50">رابط الاجتماع غير صحيح أو منتهي الصلاحية</p>
          <Button onClick={() => window.close() || navigate("/dashboard")} variant="outline" className="border-white/20 text-white hover:bg-white/10">
            إغلاق
          </Button>
        </div>
      </div>
    );
  }

  if (wasKicked) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-center p-6" dir="rtl">
        <div className="space-y-4">
          <UserMinus className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-white text-xl font-bold">تم إزالتك من الاجتماع</h2>
          <p className="text-white/50">قام المضيف بإزالتك من هذا الاجتماع</p>
          <Button onClick={() => window.close() || navigate("/dashboard")} variant="outline" className="border-white/20 text-white hover:bg-white/10">
            إغلاق
          </Button>
        </div>
      </div>
    );
  }

  const localPeer: Peer = { id: userId || "local", name: userName, stream: localStream || undefined, audioOn, videoOn };
  const allPeers = [localPeer, ...Array.from(peers.values())];
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6" dir="rtl">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto">
              <Video className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-white text-xl font-bold">{meeting.title}</h1>
            <p className="text-white/40 text-sm">{meeting.hostName}</p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
            <div>
              <label className="text-white/60 text-sm font-medium block mb-1.5">اسمك في الاجتماع <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={directGuestName}
                onChange={e => setDirectGuestName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && directGuestName.trim() && handleGuestSubmit()}
                placeholder="أدخل اسمك ليظهر للمشاركين"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                autoFocus
                data-testid="input-guest-name-room"
              />
            </div>
            <button
              onClick={handleGuestSubmit}
              disabled={!directGuestName.trim()}
              className="w-full h-11 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
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
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6" dir="rtl">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto">
              <Video className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-white text-2xl font-bold">{meeting.title}</h1>
            <p className="text-white/50 text-sm">{meeting.hostName} • {new Date(meeting.scheduledAt).toLocaleString("ar-SA")}</p>
          </div>

          <div className="bg-gray-900 rounded-2xl overflow-hidden aspect-video relative">
            {localStream && videoOn ? (
              <video ref={(el) => { if (el && localStream) { el.srcObject = localStream; el.play().catch(() => {}); } }} autoPlay muted playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-3xl font-bold text-white">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-white/60">{userName}</span>
              </div>
            )}
          </div>

          {mediaError && (
            <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
              <p className="text-yellow-300 text-sm">{mediaError}</p>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button onClick={toggleAudio} className={`p-3 rounded-full border transition-all ${audioOn ? "bg-white/10 border-white/20 text-white" : "bg-red-500 border-red-400 text-white"}`} data-testid="button-toggle-audio-lobby">
              {audioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button onClick={toggleVideo} className={`p-3 rounded-full border transition-all ${videoOn ? "bg-white/10 border-white/20 text-white" : "bg-red-500 border-red-400 text-white"}`} data-testid="button-toggle-video-lobby">
              {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex gap-3">
            <Button onClick={joinMeeting} className="flex-1 bg-green-600 hover:bg-green-500 text-white h-11" data-testid="button-join-meeting">
              انضم للاجتماع
            </Button>
            <Button onClick={() => window.close() || navigate("/dashboard")} variant="outline" className="border-white/20 text-white hover:bg-white/10 h-11" data-testid="button-cancel-join">
              إلغاء
            </Button>
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
    <div className="min-h-screen bg-gray-950 flex flex-col relative" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900/80 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">مباشر</Badge>
          <span className="text-white font-semibold truncate max-w-48">{meeting.title}</span>
          {!wsReady && <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">إعادة الاتصال...</span>}
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 text-white/40 text-xs mr-2">
            <Users className="w-3.5 h-3.5" />
            <span>{totalPeers}</span>
          </div>
          <button onClick={copyLink} className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors" title="نسخ الرابط" data-testid="button-copy-link">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

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
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 border-b border-blue-500/20 shrink-0">
                  <Monitor className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-blue-300 text-xs font-medium">
                    {sharerIsLocal ? "أنت تشارك شاشتك" : `${screenSharerName || "مشارك"} يشارك شاشته`}
                  </span>
                  {sharerIsLocal && (
                    <button onClick={toggleScreenShare} className="mr-auto text-blue-400 hover:text-red-400 text-xs underline transition-colors">إيقاف المشاركة</button>
                  )}
                </div>
                <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
                  {sharerPeer && (
                    <VideoTile
                      peer={sharerPeer}
                      local={sharerIsLocal}
                      spotlight={true}
                      canKick={false}
                    />
                  )}
                </div>
                {otherPeers.length > 0 && (
                  <div className="h-28 sm:h-32 shrink-0 flex gap-2 px-2 pb-2 overflow-x-auto scrollbar-none bg-gray-950">
                    {otherPeers.map(peer => (
                      <div key={peer.id} className="shrink-0 w-44 sm:w-48">
                        <VideoTile
                          peer={peer}
                          local={peer.id === (userId || "local")}
                          canKick={isAdmin}
                          onKick={() => kickPeer(peer.id)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })() : (
          <div className="flex-1 p-2 sm:p-3 overflow-hidden">
            <div className={`grid ${gridCols} gap-2.5 h-full max-h-[calc(100vh-140px)]`}>
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
          <div className="w-80 bg-gray-900 border-r border-white/[0.06] flex flex-col shrink-0">
            <div className="flex border-b border-white/[0.06] overflow-x-auto scrollbar-none shrink-0">
              {PANEL_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActivePanel(tab.id)}
                  className={`relative flex items-center gap-1 px-3 py-2.5 text-[11px] font-medium whitespace-nowrap transition-colors ${activePanel === tab.id ? "text-white border-b-2 border-white" : "text-white/40 hover:text-white/70"}`}
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
                  ) : pendingJoinRequests.map((req) => (
                    <div key={req._tempId || req.userId} className="bg-white/[0.06] rounded-xl p-3 space-y-2.5 border border-white/[0.08] mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-400 font-bold text-sm">
                          {(req.userName || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-bold truncate">{req.userName}</p>
                          {req.userEmail && <p className="text-white/30 text-[10px] truncate">{req.userEmail}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            try {
                              await apiRequest("PATCH", `/api/qmeet/meetings/${meeting._id || meeting.id}/join-requests/${req.userId}`, { action: "approve" });
                              setPendingJoinRequests(prev => prev.filter(r => r.userId !== req.userId));
                              toast({ title: "تمت الموافقة", description: `وافقت على انضمام ${req.userName}` });
                            } catch (e: any) {
                              toast({ title: "خطأ", description: e?.message || "فشل", variant: "destructive" });
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg py-1.5 text-xs font-bold transition-colors"
                          data-testid={`button-approve-${req.userId}`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          قبول
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await apiRequest("PATCH", `/api/qmeet/meetings/${meeting._id || meeting.id}/join-requests/${req.userId}`, { action: "reject" });
                              setPendingJoinRequests(prev => prev.filter(r => r.userId !== req.userId));
                              toast({ title: "تم الرفض" });
                            } catch (e: any) {
                              toast({ title: "خطأ", description: e?.message || "فشل", variant: "destructive" });
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg py-1.5 text-xs font-bold transition-colors"
                          data-testid={`button-reject-${req.userId}`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          رفض
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 bg-gray-800 border border-white/10 rounded-2xl p-3 shadow-2xl"
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
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-blue-900/90 border border-blue-500/30 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-xl backdrop-blur">
          <Loader2 className="w-3.5 h-3.5 text-blue-300 animate-spin" />
          <span className="text-blue-200 text-xs font-medium">في انتظار موافقة المضيف على مشاركة شاشتك...</span>
          <button onClick={() => setScreenSharePending(false)} className="text-blue-400 hover:text-white ml-1"><X className="w-3.5 h-3.5" /></button>
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
            className="absolute bottom-[72px] left-2 right-2 z-40 bg-gray-800/95 backdrop-blur border border-white/10 rounded-2xl p-3 shadow-2xl"
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
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-[11px] font-medium transition-all ${screenSharing ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : screenSharePending ? "bg-yellow-500/20 text-yellow-300" : "text-white/50 hover:text-white hover:bg-white/10"}`}
                data-testid="button-screen-share-more">
                {screenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                <span>{screenSharing ? "إيقاف الشاشة" : isHost || isStaff ? "مشاركة الشاشة" : "طلب مشاركة"}</span>
              </button>
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
      <div className="flex items-center justify-between px-3 py-3 bg-gray-900/95 border-t border-white/[0.06] shrink-0 gap-2 safe-area-bottom" style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}>

        {/* Left: panel tabs on desktop; "..." on mobile */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Desktop panel tabs */}
          <div className="hidden sm:flex items-center gap-0.5 overflow-x-auto scrollbar-none">
            {PANEL_TABS.map(tab => (
              <button key={tab.id} onClick={() => togglePanel(tab.id)}
                className={`relative flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-[11px] font-medium transition-all shrink-0 ${activePanel === tab.id ? "bg-white/20 text-white" : "text-white/40 hover:text-white hover:bg-white/10"}`}
                title={tab.label} data-testid={`button-panel-toggle-${tab.id}`}>
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.id === 'chat' && unreadChat > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">{unreadChat > 9 ? "9+" : unreadChat}</span>
                )}
              </button>
            ))}
          </div>
          {/* Mobile: "..." button */}
          <button onClick={() => setShowMoreMenu(p => !p)}
            className={`sm:hidden flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-[10px] font-medium transition-all ${showMoreMenu ? "bg-white/20 text-white" : "text-white/40 hover:text-white hover:bg-white/10"}`}
            data-testid="button-more-menu">
            <MoreHorizontal className="w-5 h-5" />
            <span>المزيد</span>
          </button>
        </div>

        {/* Center: essential media controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={toggleAudio} className={`p-3 rounded-full border transition-all ${audioOn ? "bg-white/10 border-white/20 text-white hover:bg-white/20" : "bg-red-500 border-red-400 text-white"}`} title={audioOn ? "كتم الميكروفون" : "تشغيل الميكروفون"} data-testid="button-toggle-audio">
            {audioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          <button onClick={toggleVideo} className={`p-3 rounded-full border transition-all ${videoOn ? "bg-white/10 border-white/20 text-white hover:bg-white/20" : "bg-red-500 border-red-400 text-white"}`} title={videoOn ? "إيقاف الكاميرا" : "تشغيل الكاميرا"} data-testid="button-toggle-video">
            {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
          {/* Screen share — visible on ALL devices */}
          <button onClick={toggleScreenShare}
            className={`p-3 rounded-full border transition-all ${screenSharing ? "bg-blue-500 border-blue-400 text-white" : screenSharePending ? "bg-yellow-500/30 border-yellow-500/50 text-yellow-300" : "bg-white/10 border-white/20 text-white hover:bg-white/20"}`}
            title={screenSharing ? "إيقاف مشاركة الشاشة" : isHost || isStaff ? "مشاركة الشاشة" : "طلب مشاركة الشاشة"}
            data-testid="button-screen-share">
            {screenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </button>
          <button onClick={leaveMeeting} className="p-3 rounded-full bg-red-500 border border-red-400 text-white hover:bg-red-600 transition-all" title="مغادرة الاجتماع" data-testid="button-leave-meeting">
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>

        {/* Right: hand + emoji (desktop only — on mobile they're in the "..." menu) */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <button onClick={toggleRaiseHand}
            className={`p-2.5 rounded-full border transition-all ${raisedHand ? "bg-amber-500 border-amber-400 text-white" : "bg-white/10 border-white/20 text-white/60 hover:text-white hover:bg-white/20"}`}
            title={raisedHand ? "إنزال اليد" : "رفع اليد"} data-testid="button-raise-hand">
            <Hand className="w-5 h-5" />
          </button>
          <button onClick={() => setShowEmojiPicker(p => !p)}
            className={`p-2.5 rounded-full border transition-all ${showEmojiPicker ? "bg-violet-500 border-violet-400 text-white" : "bg-white/10 border-white/20 text-white/60 hover:text-white hover:bg-white/20"}`}
            title="تفاعل بإيموجي" data-testid="button-emoji-reaction">
            <Smile className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
