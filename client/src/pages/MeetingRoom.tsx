import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Mic, MicOff, Video, VideoOff, Monitor, PhoneOff,
  MessageSquare, Users, Copy, Check, Loader2, Send,
  Hand, Grid3X3, Maximize2, ChevronRight, Smile, X,
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
  const [panel, setPanel] = useState<"none" | "chat" | "participants">("none");
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

  // Keep refs in sync with state
  useEffect(() => { audioOnRef.current = audioOn; }, [audioOn]);
  useEffect(() => { videoOnRef.current = videoOn; }, [videoOn]);

  // resize
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  // scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  // ── media helpers ──────────────────────────────────────────────────────────

  const getMedia = useCallback(async (video = true, audio = true): Promise<MediaStream | null> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError("متصفحك لا يدعم الكاميرا/الميك — استخدم Chrome أو Firefox");
      return null;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video, audio });
      localStreamRef.current = s;
      setLocalStream(s);
      setMediaError(null);
      return s;
    } catch (e1: any) {
      // fallback: audio only
      if (video) {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          localStreamRef.current = s;
          setLocalStream(s);
          setVideoOn(false);
          setMediaError("الكاميرا غير متاحة — انضممت بالصوت فقط");
          return s;
        } catch {}
      }
      const name = (e1 as any)?.name || "";
      if (name === "NotAllowedError") setMediaError("يجب منح إذن الكاميرا/الميك من شريط العنوان");
      else setMediaError("تعذّر الوصول للكاميرا/الميك");
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

    // ── Join: list of existing peers ─────────────────────────────────────────
    if (msg.type === "webrtc_peers") {
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

    // Get media first
    const stream = await getMedia();
    // stream may be null if no permission — still let them join

    // Apply initial track states
    if (stream) {
      stream.getAudioTracks().forEach(t => { t.enabled = audioOn; });
      stream.getVideoTracks().forEach(t => { t.enabled = videoOn; });
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
  }, [roomId, userId, userName, user, audioOn, videoOn, getMedia, handleMessage]);

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

  const toggleAudio = useCallback(async () => {
    if (!localStreamRef.current) {
      const s = await getMedia();
      if (!s) return;
    }
    const on = !audioOnRef.current;
    audioOnRef.current = on;
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = on; });
    setAudioOn(on);
    sendWs({ type: "webrtc_media_state", roomId, audio: on, video: videoOnRef.current });
  }, [roomId, sendWs, getMedia]);

  const toggleVideo = useCallback(async () => {
    if (screenSharing) return;
    if (!localStreamRef.current) {
      const s = await getMedia();
      if (!s) return;
    }
    const on = !videoOnRef.current;
    videoOnRef.current = on;
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = on; });
    setVideoOn(on);
    sendWs({ type: "webrtc_media_state", roomId, audio: audioOnRef.current, video: on });
  }, [screenSharing, roomId, sendWs, getMedia]);

  const toggleScreen = useCallback(async () => {
    if (screenSharing) {
      // Stop screen, revert to camera
      const cam = await getMedia();
      if (cam) {
        pcsRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === "video");
          const track = cam.getVideoTracks()[0];
          if (sender && track) sender.replaceTrack(track).catch(() => {});
        });
      }
      setScreenSharing(false);
    } else {
      const isMob = /Android|iPhone|iPad/i.test(navigator.userAgent);
      if (isMob) {
        toast({ title: "مشاركة الشاشة متاحة على الكمبيوتر فقط" });
        return;
      }
      try {
        const screen = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
        const screenTrack = screen.getVideoTracks()[0];
        // Replace video track in all PCs
        pcsRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === "video");
          if (sender) sender.replaceTrack(screenTrack).catch(() => {});
        });
        // Update local stream for preview
        if (localStreamRef.current) {
          localStreamRef.current.getVideoTracks().forEach(t => t.stop());
          const newStream = new MediaStream([screenTrack, ...localStreamRef.current.getAudioTracks()]);
          localStreamRef.current = newStream;
          setLocalStream(newStream);
        }
        screenTrack.onended = () => toggleScreen();
        setScreenSharing(true);
        sendWs({ type: "webrtc_screen_share", roomId, active: true, name: userName });
      } catch (e: any) {
        if (e?.name !== "NotAllowedError") toast({ title: "تعذّر مشاركة الشاشة", variant: "destructive" });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenSharing, getMedia, roomId, sendWs, toast, userName]);

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
          <div className="w-full lg:w-72 flex flex-col gap-4">
            {mediaError && (
              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm">{mediaError}</div>
            )}
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
            {defaultName && (
              <div className="px-4 py-3 rounded-xl bg-[#3c4043] text-white text-sm flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: avatarColor(defaultName) }}>
                  {defaultName.charAt(0).toUpperCase()}
                </div>
                <span>{defaultName}</span>
              </div>
            )}
            <button
              onClick={joinMeeting}
              disabled={!defaultName && !guestName.trim()}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-base transition"
              data-testid="button-join-meeting"
            >
              انضمام الآن
            </button>
            <button onClick={() => navigate("/qmeet")}
              className="w-full py-3 rounded-xl bg-[#3c4043] hover:bg-[#4a4d51] text-[#9aa0a6] text-sm transition">
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
          <button onClick={copyLink} title="نسخ الرابط"
            className="p-2 rounded-lg bg-[#3c4043] hover:bg-[#4a4d51] text-[#9aa0a6] transition">
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

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

        {/* Side panel (desktop) */}
        {panel !== "none" && (
          <div className="hidden md:flex w-72 lg:w-80 bg-[#292b2f] rounded-2xl flex-col overflow-hidden shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] shrink-0">
              <div className="flex gap-1">
                <button onClick={() => { setPanel("chat"); setUnread(0); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${panel === "chat" ? "bg-blue-600 text-white" : "text-[#9aa0a6] hover:text-white"}`}>
                  المحادثة {unread > 0 && panel !== "chat" && <span className="ml-1 w-4 h-4 rounded-full bg-red-500 text-[10px] inline-flex items-center justify-center">{unread}</span>}
                </button>
                <button onClick={() => setPanel("participants")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${panel === "participants" ? "bg-blue-600 text-white" : "text-[#9aa0a6] hover:text-white"}`}>
                  المشاركون ({total})
                </button>
              </div>
              <button onClick={() => setPanel("none")} className="text-[#9aa0a6] hover:text-white transition">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

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

            {panel === "participants" && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: avatarColor(p.name) }}>
                      {p.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{p.id === myId ? `${p.name} (أنت)` : p.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!p.audioOn && <MicOff className="w-3.5 h-3.5 text-red-400" />}
                      {!p.videoOn && <VideoOff className="w-3.5 h-3.5 text-[#9aa0a6]" />}
                      {p.raisedHand && <span className="text-sm">✋</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile panel overlay */}
      {panel !== "none" && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 flex flex-col justify-end" onClick={() => setPanel("none")}>
          <div className="bg-[#292b2f] rounded-t-2xl max-h-[65vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
              <div className="flex gap-1">
                <button onClick={() => { setPanel("chat"); setUnread(0); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${panel === "chat" ? "bg-blue-600 text-white" : "text-[#9aa0a6]"}`}>
                  المحادثة
                </button>
                <button onClick={() => setPanel("participants")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${panel === "participants" ? "bg-blue-600 text-white" : "text-[#9aa0a6]"}`}>
                  المشاركون ({total})
                </button>
              </div>
              <button onClick={() => setPanel("none")} className="text-[#9aa0a6]"><X className="w-5 h-5" /></button>
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
          <div className="hidden md:flex items-center gap-2 w-44 justify-end">
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
