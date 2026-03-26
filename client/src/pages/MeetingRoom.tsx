import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Mic, MicOff, Video, VideoOff, Monitor, PhoneOff,
  MessageSquare, Users, MoreVertical, Copy, Check,
  Loader2, AlertCircle, Send, UserCircle2, Hand,
  Grid3X3, Maximize2, ChevronRight, Info, Settings,
  Smile, MicIcon
} from "lucide-react";

// ─── helpers ─────────────────────────────────────────────────────────────────

function getAvatarColor(name: string): string {
  const colors = ["#1d4ed8","#0891b2","#059669","#7c3aed","#dc2626","#d97706","#0284c7","#a855f7"];
  const i = ((name?.charCodeAt(0) || 65) + (name?.charCodeAt(1) || 65)) % colors.length;
  return colors[i];
}

function useTimer() {
  const [sec, setSec] = useState(0);
  const start = useRef(Date.now());
  useEffect(() => {
    const id = setInterval(() => setSec(Math.floor((Date.now() - start.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
    : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

const FALLBACK_ICE: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];
let _iceCache: RTCIceServer[] | null = null;
async function getIceServers() {
  if (_iceCache) return _iceCache;
  try {
    const r = await fetch("/api/ice-servers");
    if (r.ok) { _iceCache = await r.json(); return _iceCache!; }
  } catch {}
  return FALLBACK_ICE;
}

// ─── types ───────────────────────────────────────────────────────────────────

interface Peer {
  id: string;
  name: string;
  stream?: MediaStream;
  audioOn: boolean;
  videoOn: boolean;
  photoUrl?: string;
  raisedHand?: boolean;
  speaking?: boolean;
}

interface ChatMsg { id: string; userId: string; name: string; text: string; time: string; }

// ─── Video Tile ───────────────────────────────────────────────────────────────

function VideoTile({ peer, isSelf, size }: { peer: Peer; isSelf?: boolean; size: "large" | "small" }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
      videoRef.current.play().catch(() => {});
    }
  }, [peer.stream]);

  const bg = getAvatarColor(peer.name);
  const initial = peer.name?.charAt(0)?.toUpperCase() || "?";
  const showVideo = peer.stream && peer.videoOn;

  return (
    <div className={`relative rounded-xl overflow-hidden bg-[#3c4043] flex items-center justify-center ${size === "large" ? "w-full h-full" : "w-full h-full"}`}>
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay playsInline muted={isSelf}
          className="w-full h-full object-cover"
          style={{ transform: isSelf ? "scaleX(-1)" : undefined }}
        />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div
            className="rounded-full flex items-center justify-center font-bold text-white shadow-xl"
            style={{
              background: bg,
              width: size === "large" ? 96 : 56,
              height: size === "large" ? 96 : 56,
              fontSize: size === "large" ? 40 : 22,
            }}
          >
            {initial}
          </div>
        </div>
      )}
      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-t from-black/70 to-transparent">
        {!peer.audioOn && <MicOff className="w-3.5 h-3.5 text-red-400 shrink-0" />}
        {peer.raisedHand && <span className="text-sm">✋</span>}
        {peer.speaking && peer.audioOn && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />}
        <span className="text-white text-xs font-medium truncate">{isSelf ? "أنت" : peer.name}</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MeetingRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const [, navigate] = useLocation();
  const { data: user } = useUser();
  const { toast } = useToast();

  // ── meeting data ──────────────────────────────────────────────────────────
  const { data: meeting } = useQuery<any>({
    queryKey: ["/api/qmeet/room", roomId],
    queryFn: () => fetch(`/api/qmeet/room/${roomId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!roomId,
  });

  // ── identity ──────────────────────────────────────────────────────────────
  const userId = (user as any)?._id || (user as any)?.id || "";
  const userName = (user as any)?.fullName || (user as any)?.username || "مشارك";
  const isHost = meeting && (meeting.hostId === userId || meeting.hostEmail === (user as any)?.email);

  // ── media state ───────────────────────────────────────────────────────────
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [screenSharing, setScreenSharing] = useState(false);

  // ── room state ────────────────────────────────────────────────────────────
  const [joined, setJoined] = useState(false);
  const [lobbyWaiting, setLobbyWaiting] = useState(false);
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  // ── ws ────────────────────────────────────────────────────────────────────
  const wsRef = useRef<WebSocket | null>(null);
  const [wsReady, setWsReady] = useState(false);
  const wasKickedRef = useRef(false);

  // ── ui state ──────────────────────────────────────────────────────────────
  const [panel, setPanel] = useState<"none" | "chat" | "participants">("none");
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [unread, setUnread] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [raisedHand, setRaisedHand] = useState(false);
  const [speakingPeers, setSpeakingPeers] = useState<Set<string>>(new Set());
  const analyserNodes = useRef<Map<string, { analyser: AnalyserNode; source: MediaStreamAudioSourceNode }>>(new Map());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timer = useTimer();

  // ── speaking detection ───────────────────────────────────────────────────
  useEffect(() => {
    if (!joined) return;
    const getCtx = () => {
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioContext();
      }
      return audioCtxRef.current;
    };
    const attach = (id: string, stream: MediaStream) => {
      if (analyserNodes.current.has(id)) {
        try { analyserNodes.current.get(id)!.source.disconnect(); } catch {}
        analyserNodes.current.delete(id);
      }
      try {
        const ctx = getCtx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512; analyser.smoothingTimeConstant = 0.5;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyserNodes.current.set(id, { analyser, source });
      } catch {}
    };
    if (localStream) attach(userId || "local", localStream);
    peers.forEach((p, id) => { if (p.stream) attach(id, p.stream); });
    const interval = setInterval(() => {
      const speaking = new Set<string>();
      analyserNodes.current.forEach(({ analyser }, id) => {
        if (id === (userId || "local") && !audioOn) return;
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.slice(0, data.length / 2).reduce((a, b) => a + b, 0) / (data.length / 2);
        if (avg > 8) speaking.add(id);
      });
      setSpeakingPeers(prev => {
        const same = prev.size === speaking.size && [...prev].every(id => speaking.has(id));
        return same ? prev : speaking;
      });
    }, 120);
    return () => clearInterval(interval);
  }, [joined, localStream, peers, audioOn, userId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // ── getMedia ──────────────────────────────────────────────────────────────
  const getMedia = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError("متصفحك لا يدعم الكاميرا/الميك، جرب Chrome أو Firefox");
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setMediaError(null);
      return stream;
    } catch (e1: any) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        localStreamRef.current = stream;
        setLocalStream(stream);
        setVideoOn(false);
        setMediaError("الكاميرا غير متاحة — يمكنك الانضمام بالصوت فقط");
        return stream;
      } catch (e2: any) {
        const name = e1?.name || e2?.name || "";
        if (name === "NotAllowedError") setMediaError("رُفض الإذن — اضغط أيقونة القفل في شريط العنوان وامنح الإذن");
        else if (name === "NotFoundError") setMediaError("لا توجد كاميرا أو ميكروفون متصل");
        else if (name === "NotReadableError") setMediaError("الكاميرا/الميك مستخدم من برنامج آخر");
        else setMediaError(`تعذّر الوصول للكاميرا/الميك (${name || "خطأ غير معروف"})`);
        return null;
      }
    }
  }, []);

  useEffect(() => {
    getMedia();
    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [getMedia]);

  // ── WebRTC helpers ────────────────────────────────────────────────────────
  const sendWs = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const flushCandidates = useCallback(async (peerId: string, pc: RTCPeerConnection) => {
    const q = pendingCandidates.current.get(peerId) || [];
    for (const c of q) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
    }
    pendingCandidates.current.delete(peerId);
  }, []);

  const removePeer = useCallback((peerId: string) => {
    const pc = pcsRef.current.get(peerId);
    if (pc) { pc.close(); pcsRef.current.delete(peerId); }
    pendingCandidates.current.delete(peerId);
    const node = analyserNodes.current.get(peerId);
    if (node) { try { node.source.disconnect(); } catch {} analyserNodes.current.delete(peerId); }
    setPeers(prev => { const next = new Map(prev); next.delete(peerId); return next; });
  }, []);

  const createPC = useCallback(async (peerId: string) => {
    const iceServers = await getIceServers();
    const pc = new RTCPeerConnection({ iceServers, iceCandidatePoolSize: 10 });
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));
    }
    pc.onicecandidate = (e) => {
      if (e.candidate) sendWs({ type: "webrtc_ice", to: peerId, candidate: e.candidate });
    };
    const remoteStream: { current: MediaStream | null } = { current: null };
    pc.ontrack = (e) => {
      let stream = e.streams?.[0];
      if (!stream) {
        if (!remoteStream.current) remoteStream.current = new MediaStream();
        remoteStream.current.addTrack(e.track);
        stream = remoteStream.current;
      }
      setPeers(prev => {
        const next = new Map(prev);
        const ex = next.get(peerId) || { id: peerId, name: peerId, audioOn: true, videoOn: true };
        next.set(peerId, { ...ex, stream });
        return next;
      });
    };
    pc.onconnectionstatechange = () => {
      if (["failed", "closed"].includes(pc.connectionState)) removePeer(peerId);
    };
    pcsRef.current.set(peerId, pc);
    return pc;
  }, [sendWs, removePeer]);

  // ── ws message handler ───────────────────────────────────────────────────
  const handleWsMessage = useCallback(async (data: any) => {
    if (data.type === "webrtc_peers") {
      for (const p of (data.peers || [])) {
        if (p.userId === userId) continue;
        setPeers(prev => {
          const next = new Map(prev);
          if (!next.has(p.userId)) next.set(p.userId, { id: p.userId, name: p.name, audioOn: true, videoOn: true, photoUrl: p.photoUrl });
          return next;
        });
        const pc = await createPC(p.userId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendWs({ type: "webrtc_offer", to: p.userId, offer });
      }
    } else if (data.type === "webrtc_offer") {
      const pc = await createPC(data.from);
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      await flushCandidates(data.from, pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendWs({ type: "webrtc_answer", to: data.from, answer });
    } else if (data.type === "webrtc_answer") {
      const pc = pcsRef.current.get(data.from);
      if (pc?.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        await flushCandidates(data.from, pc);
      }
    } else if (data.type === "webrtc_ice") {
      const pc = pcsRef.current.get(data.from);
      if (pc?.remoteDescription) {
        try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch {}
      } else {
        const q = pendingCandidates.current.get(data.from) || [];
        q.push(data.candidate);
        pendingCandidates.current.set(data.from, q);
      }
    } else if (data.type === "webrtc_user_joined") {
      if (data.userId !== userId) {
        setPeers(prev => {
          const next = new Map(prev);
          if (!next.has(data.userId)) next.set(data.userId, { id: data.userId, name: data.name || data.userId, audioOn: true, videoOn: true });
          return next;
        });
        toast({ title: `${data.name || "مشارك"} انضم` });
      }
    } else if (data.type === "webrtc_user_left") {
      removePeer(data.userId);
      toast({ title: `${data.name || "مشارك"} غادر` });
    } else if (data.type === "webrtc_media_state") {
      setPeers(prev => {
        const next = new Map(prev);
        const peer = next.get(data.userId);
        if (peer) next.set(data.userId, { ...peer, audioOn: data.audio, videoOn: data.video });
        return next;
      });
    } else if (data.type === "webrtc_chat") {
      const msg: ChatMsg = { id: Date.now() + data.userId, userId: data.userId, name: data.name || "مشارك", text: data.text, time: new Date().toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" }) };
      setChat(prev => [...prev, msg]);
      if (panel !== "chat") setUnread(u => u + 1);
    } else if (data.type === "webrtc_raise_hand") {
      setPeers(prev => {
        const next = new Map(prev);
        const peer = next.get(data.userId);
        if (peer) next.set(data.userId, { ...peer, raisedHand: data.raised });
        return next;
      });
      if (data.raised && data.userId !== userId) toast({ title: `${data.name} رفع يده ✋` });
    } else if (data.type === "webrtc_kicked") {
      wasKickedRef.current = true;
      toast({ title: "تم إخراجك من الاجتماع", variant: "destructive" });
      navigate("/dashboard");
    } else if (data.type === "webrtc_lobby_joined") {
      if (data.userId !== userId) {
        toast({ title: `${data.name || "شخص"} ينتظر في الردهة`, description: "راجع تبويب المشاركين للقبول أو الرفض" });
      }
    }
  }, [userId, panel, createPC, flushCandidates, removePeer, sendWs, toast, navigate]);

  // ── lobby join request approval ──────────────────────────────────────────
  const [lobbyRequests, setLobbyRequests] = useState<any[]>([]);
  const [lobbyEnabled, setLobbyEnabled] = useState(false);

  useEffect(() => {
    if (meeting) setLobbyEnabled(meeting.lobbyEnabled ?? false);
  }, [meeting]);

  // ── connectWs ────────────────────────────────────────────────────────────
  const connectWs = useCallback((uid: string, rId: string, uName: string) => {
    if (wsRef.current && [WebSocket.OPEN, WebSocket.CONNECTING].includes(wsRef.current.readyState as any)) return;
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${location.host}/ws`);
    wsRef.current = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "auth", userId: uid }));
      setWsReady(true);
    };
    ws.onmessage = async (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === "online_users") {
          const photo = (user as any)?.profilePhotoUrl || "";
          ws.send(JSON.stringify({ type: "webrtc_join", roomId: rId, name: uName, photoUrl: photo }));
        } else if (data.type === "webrtc_peers") {
          setJoined(true); setLobbyWaiting(false);
          await handleWsMessage(data);
        } else if (data.type === "webrtc_lobby_waiting") {
          setJoined(true); setLobbyWaiting(true);
        } else if (data.type === "webrtc_lobby_requests") {
          setLobbyRequests(data.requests || []);
        } else {
          await handleWsMessage(data);
        }
      } catch {}
    };
    ws.onclose = () => {
      setWsReady(false);
      if (!wasKickedRef.current) {
        setTimeout(() => { if (wsRef.current?.readyState !== WebSocket.OPEN) connectWs(uid, rId, uName); }, 3000);
      }
    };
    ws.onerror = () => ws.close();
  }, [handleWsMessage, user]);

  // ── join meeting ─────────────────────────────────────────────────────────
  const joinMeeting = useCallback(async () => {
    if (!userId || !roomId) return;
    const stream = localStream || await getMedia();
    if (!stream && !mediaError) return;
    try { if (!audioCtxRef.current) audioCtxRef.current = new AudioContext(); audioCtxRef.current.resume(); } catch {}
    connectWs(userId, roomId, userName);
  }, [userId, roomId, localStream, mediaError, getMedia, connectWs, userName]);

  // ── cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      pcsRef.current.forEach(pc => pc.close());
    };
  }, []);

  // ── media toggles ─────────────────────────────────────────────────────────
  const toggleAudio = useCallback(async () => {
    if (!localStreamRef.current) {
      const s = await getMedia();
      if (!s) { toast({ title: "تعذّر الوصول للميكروفون", variant: "destructive" }); return; }
    }
    const on = !audioOn;
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = on; });
    setAudioOn(on);
    sendWs({ type: "webrtc_media_state", roomId, audio: on, video: videoOn });
  }, [audioOn, videoOn, roomId, sendWs, getMedia, toast]);

  const toggleVideo = useCallback(async () => {
    if (screenSharing) return;
    if (!localStreamRef.current) {
      const s = await getMedia();
      if (!s) { toast({ title: "تعذّر الوصول للكاميرا", variant: "destructive" }); return; }
    }
    const on = !videoOn;
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = on; });
    setVideoOn(on);
    sendWs({ type: "webrtc_media_state", roomId, audio: audioOn, video: on });
  }, [videoOn, audioOn, roomId, sendWs, screenSharing, getMedia, toast]);

  const toggleScreen = useCallback(async () => {
    if (screenSharing) {
      localStreamRef.current?.getVideoTracks().forEach(t => t.stop());
      const s = await getMedia();
      if (s) {
        pcsRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === "video");
          const track = s.getVideoTracks()[0];
          if (sender && track) sender.replaceTrack(track);
        });
      }
      setScreenSharing(false);
    } else {
      try {
        const screen = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
        screen.getVideoTracks()[0].onended = () => toggleScreen();
        localStreamRef.current?.getVideoTracks().forEach(t => t.stop());
        const newStream = new MediaStream([screen.getVideoTracks()[0], ...(localStreamRef.current?.getAudioTracks() || [])]);
        localStreamRef.current = newStream;
        setLocalStream(newStream);
        pcsRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === "video");
          if (sender) sender.replaceTrack(screen.getVideoTracks()[0]);
        });
        setScreenSharing(true);
      } catch {}
    }
  }, [screenSharing, getMedia]);

  const toggleHand = useCallback(() => {
    const on = !raisedHand;
    setRaisedHand(on);
    sendWs({ type: "webrtc_raise_hand", roomId, raised: on, name: userName, userId });
  }, [raisedHand, roomId, userName, userId, sendWs]);

  // ── send chat ─────────────────────────────────────────────────────────────
  const sendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    const msg: ChatMsg = { id: Date.now() + userId, userId, name: "أنت", text: chatInput.trim(), time: new Date().toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" }) };
    setChat(prev => [...prev, msg]);
    sendWs({ type: "webrtc_chat", roomId, text: chatInput.trim(), name: userName });
    setChatInput("");
  }, [chatInput, userId, userName, roomId, sendWs]);

  const leave = useCallback(() => {
    sendWs({ type: "webrtc_leave", roomId });
    wsRef.current?.close();
    navigate("/dashboard");
  }, [sendWs, roomId, navigate]);

  const copyLink = () => {
    navigator.clipboard.writeText(`${location.origin}/meet/${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const approveRequest = async (reqUserId: string) => {
    if (!meeting) return;
    await fetch(`/api/qmeet/meetings/${meeting._id || meeting.id}/approve`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: reqUserId }),
    });
    setLobbyRequests(prev => prev.filter(r => r.userId !== reqUserId));
  };

  const rejectRequest = async (reqUserId: string) => {
    if (!meeting) return;
    await fetch(`/api/qmeet/meetings/${meeting._id || meeting.id}/reject`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: reqUserId }),
    });
    setLobbyRequests(prev => prev.filter(r => r.userId !== reqUserId));
  };

  // ── all peers for rendering ────────────────────────────────────────────────
  const localPeer: Peer = {
    id: userId || "local",
    name: userName,
    stream: localStream || undefined,
    audioOn, videoOn,
    raisedHand,
    speaking: speakingPeers.has(userId || "local"),
  };
  const allPeers = [localPeer, ...[...peers.values()].map(p => ({ ...p, speaking: speakingPeers.has(p.id) }))];
  const total = allPeers.length;

  // ─── Pre-join screen ──────────────────────────────────────────────────────
  if (!joined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#202124]" dir="rtl">
        <div className="w-full max-w-5xl mx-4 flex flex-col lg:flex-row gap-8 items-center">

          {/* Camera preview */}
          <div className="w-full lg:flex-1 rounded-2xl overflow-hidden relative bg-[#3c4043]" style={{ aspectRatio: "16/9" }}>
            {localStream && videoOn ? (
              <video
                ref={el => { if (el && localStream) { el.srcObject = localStream; el.play().catch(() => {}); } }}
                autoPlay muted playsInline
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                <div
                  className="w-28 h-28 rounded-full flex items-center justify-center text-5xl font-bold text-white"
                  style={{ background: getAvatarColor(userName) }}
                >
                  {userName.charAt(0).toUpperCase()}
                </div>
                {mediaError && (
                  <button
                    onClick={async () => { const s = await getMedia(); if (!s) window.open(location.href, "_blank"); }}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition"
                  >
                    تفعيل الكاميرا
                  </button>
                )}
              </div>
            )}
            {/* Controls overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
              <button
                onClick={toggleAudio}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition ${audioOn ? "bg-[#5f6368] hover:bg-[#6f7379]" : "bg-red-600 hover:bg-red-700"}`}
                data-testid="button-toggle-audio-prejoin"
              >
                {audioOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
              </button>
              <button
                onClick={toggleVideo}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition ${videoOn ? "bg-[#5f6368] hover:bg-[#6f7379]" : "bg-red-600 hover:bg-red-700"}`}
                data-testid="button-toggle-video-prejoin"
              >
                {videoOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
              </button>
            </div>
          </div>

          {/* Join card */}
          <div className="w-full lg:w-80 flex flex-col gap-5">
            <div>
              <h1 className="text-white text-2xl font-semibold mb-1">{meeting?.title || "الاجتماع"}</h1>
              <p className="text-[#9aa0a6] text-sm">{meeting?.hostName || ""}</p>
            </div>

            {mediaError && (
              <div className="rounded-xl p-3 flex flex-col gap-2.5 bg-[#3c4043] border border-red-500/30">
                <div className="flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-red-300 text-sm leading-relaxed">{mediaError}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={async () => await getMedia()} className="flex-1 py-2 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition">حاول مجدداً</button>
                  <button onClick={() => window.open(location.href, "_blank")} className="flex-1 py-2 rounded-lg text-xs font-medium text-white bg-[#5f6368] hover:bg-[#6f7379] transition">تبويب جديد</button>
                </div>
              </div>
            )}

            <button
              onClick={joinMeeting}
              className="w-full h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all text-base"
              data-testid="button-join-meeting"
            >
              انضم الآن
            </button>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#3c4043] cursor-pointer hover:bg-[#4a4d51] transition" onClick={copyLink}>
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[#9aa0a6]" />}
              <span className="text-[#9aa0a6] text-sm truncate">{location.origin}/meet/{roomId}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Lobby waiting screen ─────────────────────────────────────────────────
  if (lobbyWaiting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#202124]" dir="rtl">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto" />
          <h2 className="text-white text-xl font-semibold">في انتظار الموافقة</h2>
          <p className="text-[#9aa0a6]">سيتم قبولك قريباً من قِبل المضيف</p>
          <button onClick={leave} className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition">إلغاء</button>
        </div>
      </div>
    );
  }

  // ─── Meeting room ─────────────────────────────────────────────────────────
  const gridCols = total === 1 ? 1 : total === 2 ? 2 : total <= 4 ? 2 : total <= 6 ? 3 : 4;

  return (
    <div className="h-screen flex flex-col bg-[#202124] overflow-hidden" dir="rtl">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-white font-medium text-sm">{meeting?.title || "اجتماع"}</span>
          <span className="text-[#9aa0a6] text-sm">{timer}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Lobby requests badge */}
          {isHost && lobbyRequests.length > 0 && (
            <button
              onClick={() => setPanel(p => p === "participants" ? "none" : "participants")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-medium hover:bg-amber-500/30 transition"
            >
              <Users className="w-3.5 h-3.5" />
              {lobbyRequests.length} ينتظر
            </button>
          )}
          <button onClick={copyLink} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3c4043] hover:bg-[#4a4d51] text-[#9aa0a6] text-xs transition">
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            نسخ الرابط
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 gap-2 px-2 pb-2 overflow-hidden">

        {/* Video grid */}
        <div className={`flex-1 grid gap-2 content-center ${panel !== "none" ? "lg:flex-1" : ""}`}
          style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
        >
          {allPeers.map((peer, i) => (
            <div
              key={peer.id}
              className={`rounded-xl overflow-hidden relative ${total === 1 ? "aspect-video" : "aspect-video"}`}
            >
              <VideoTile peer={peer} isSelf={peer.id === (userId || "local")} size="large" />
            </div>
          ))}
        </div>

        {/* Side panel */}
        {panel !== "none" && (
          <div className="w-80 bg-[#292b2f] rounded-2xl flex flex-col overflow-hidden shrink-0">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] shrink-0">
              <div className="flex gap-1">
                <button
                  onClick={() => setPanel("chat")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${panel === "chat" ? "bg-blue-600 text-white" : "text-[#9aa0a6] hover:text-white"}`}
                >
                  المحادثة
                </button>
                <button
                  onClick={() => { setPanel("participants"); setUnread(0); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${panel === "participants" ? "bg-blue-600 text-white" : "text-[#9aa0a6] hover:text-white"}`}
                >
                  المشاركون ({total})
                </button>
              </div>
              <button onClick={() => setPanel("none")} className="text-[#9aa0a6] hover:text-white transition">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Chat panel */}
            {panel === "chat" && (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {chat.length === 0 && (
                    <div className="text-center text-[#9aa0a6] text-sm mt-8">لا توجد رسائل بعد</div>
                  )}
                  {chat.map(msg => (
                    <div key={msg.id} className={`flex flex-col gap-0.5 ${msg.userId === userId ? "items-end" : "items-start"}`}>
                      <span className="text-[#9aa0a6] text-xs">{msg.userId === userId ? "أنت" : msg.name} · {msg.time}</span>
                      <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm text-white leading-relaxed ${msg.userId === userId ? "bg-blue-600" : "bg-[#3c4043]"}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t border-white/[0.08] shrink-0">
                  <div className="flex gap-2 items-center bg-[#3c4043] rounded-full px-4 py-2">
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendChat()}
                      placeholder="اكتب رسالة..."
                      className="flex-1 bg-transparent text-white text-sm placeholder:text-[#9aa0a6] outline-none"
                      data-testid="input-chat-message"
                    />
                    <button onClick={sendChat} className="text-blue-400 hover:text-blue-300 transition" data-testid="button-send-chat">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Participants panel */}
            {panel === "participants" && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {/* Lobby requests (host only) */}
                {isHost && lobbyRequests.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[#9aa0a6] text-xs font-medium mb-2 px-1">ينتظر في الردهة</p>
                    {lobbyRequests.map(req => (
                      <div key={req.userId} className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: getAvatarColor(req.name || "") }}>
                          {(req.name || "م").charAt(0)}
                        </div>
                        <span className="text-white text-sm flex-1 truncate">{req.name || "مشارك"}</span>
                        <button onClick={() => approveRequest(req.userId)} className="px-2.5 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition">قبول</button>
                        <button onClick={() => rejectRequest(req.userId)} className="px-2.5 py-1 rounded-lg bg-red-600/70 hover:bg-red-700 text-white text-xs font-medium transition">رفض</button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[#9aa0a6] text-xs font-medium mb-2 px-1">في الاجتماع ({total})</p>
                {allPeers.map(peer => (
                  <div key={peer.id} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-[#3c4043] transition">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shrink-0 text-sm" style={{ background: getAvatarColor(peer.name) }}>
                      {peer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{peer.id === (userId || "local") ? `${peer.name} (أنت)` : peer.name}</p>
                      {peer.raisedHand && <p className="text-amber-400 text-xs">✋ رفع يده</p>}
                    </div>
                    <div className="flex gap-1.5">
                      {!peer.audioOn && <MicOff className="w-3.5 h-3.5 text-red-400" />}
                      {!peer.videoOn && <VideoOff className="w-3.5 h-3.5 text-red-400" />}
                    </div>
                    {isHost && peer.id !== (userId || "local") && (
                      <button
                        onClick={async () => {
                          await fetch(`/api/qmeet/meetings/${meeting._id || meeting.id}/kick`, {
                            method: "POST", credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId: peer.id }),
                          });
                        }}
                        className="text-[#9aa0a6] hover:text-red-400 transition text-xs px-2 py-1 rounded-lg hover:bg-red-500/10"
                      >
                        إخراج
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom controls bar */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0">
        {/* Left: time / info */}
        <div className="flex items-center gap-3 w-48">
          <span className="text-[#9aa0a6] text-sm hidden sm:block">{new Date().toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}</span>
          <span className="text-[#9aa0a6] text-xs hidden sm:block">|</span>
          <span className="text-[#9aa0a6] text-xs truncate hidden sm:block">{roomId}</span>
        </div>

        {/* Center: core controls */}
        <div className="flex items-center gap-3">
          {/* Mic */}
          <button
            onClick={toggleAudio}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105 ${audioOn ? "bg-[#3c4043] hover:bg-[#4a4d51]" : "bg-red-600 hover:bg-red-700"}`}
            title={audioOn ? "كتم الميكروفون" : "تشغيل الميكروفون"}
            data-testid="button-toggle-audio"
          >
            {audioOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
          </button>

          {/* Camera */}
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105 ${videoOn ? "bg-[#3c4043] hover:bg-[#4a4d51]" : "bg-red-600 hover:bg-red-700"}`}
            title={videoOn ? "إيقاف الكاميرا" : "تشغيل الكاميرا"}
            data-testid="button-toggle-video"
          >
            {videoOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
          </button>

          {/* Screen share */}
          <button
            onClick={toggleScreen}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105 ${screenSharing ? "bg-blue-600 hover:bg-blue-700" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}
            title={screenSharing ? "إيقاف مشاركة الشاشة" : "مشاركة الشاشة"}
            data-testid="button-toggle-screen"
          >
            <Monitor className="w-5 h-5 text-white" />
          </button>

          {/* Raise hand */}
          <button
            onClick={toggleHand}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105 ${raisedHand ? "bg-amber-500 hover:bg-amber-600" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}
            title={raisedHand ? "إنزال اليد" : "رفع اليد"}
            data-testid="button-raise-hand"
          >
            <Hand className="w-5 h-5 text-white" />
          </button>

          {/* Leave */}
          <button
            onClick={leave}
            className="h-12 px-6 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-all hover:scale-105 flex items-center gap-2"
            data-testid="button-leave"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">مغادرة</span>
          </button>
        </div>

        {/* Right: chat / participants */}
        <div className="flex items-center gap-2 w-48 justify-end">
          <button
            onClick={() => { setPanel(p => p === "chat" ? "none" : "chat"); setUnread(0); }}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition relative ${panel === "chat" ? "bg-blue-600" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}
            data-testid="button-toggle-chat"
          >
            <MessageSquare className="w-5 h-5 text-white" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">{unread}</span>
            )}
          </button>
          <button
            onClick={() => setPanel(p => p === "participants" ? "none" : "participants")}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition relative ${panel === "participants" ? "bg-blue-600" : "bg-[#3c4043] hover:bg-[#4a4d51]"}`}
            data-testid="button-toggle-participants"
          >
            <Users className="w-5 h-5 text-white" />
            {isHost && lobbyRequests.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">{lobbyRequests.length}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
