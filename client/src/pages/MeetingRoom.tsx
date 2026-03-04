import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  PhoneOff, MessageSquare, X, Send, Users, Copy, Check,
  Loader2, AlertCircle, RefreshCw
} from "lucide-react";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

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

function VideoTile({ peer, local = false }: { peer: Peer; local?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  return (
    <div className="relative bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center aspect-video">
      {peer.stream && peer.videoOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={local}
          className="w-full h-full object-cover"
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
        {!peer.audioOn && (
          <span className="bg-red-500/80 text-white rounded-full p-0.5">
            <MicOff className="w-3 h-3" />
          </span>
        )}
      </div>
    </div>
  );
}

export default function MeetingRoom() {
  const { roomId } = useParams() as { roomId: string };
  const [, navigate] = useLocation();
  const { data: user } = useUser();

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

  const [joined, setJoined] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [copied, setCopied] = useState(false);
  const [wsReady, setWsReady] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const userId = user?._id || user?.id;
  const userName = user?.fullName || user?.username || "مشارك";

  const sendWs = useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const createPC = useCallback((peerId: string) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendWs({ type: "webrtc_ice", to: peerId, candidate: e.candidate });
      }
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
      if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
        removePeer(peerId);
      }
    };

    pcsRef.current.set(peerId, pc);
    return pc;
  }, [sendWs]);

  const removePeer = useCallback((peerId: string) => {
    const pc = pcsRef.current.get(peerId);
    if (pc) { pc.close(); pcsRef.current.delete(peerId); }
    pendingCandidates.current.delete(peerId);
    setPeers(prev => {
      const next = new Map(prev);
      next.delete(peerId);
      return next;
    });
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
    const pending = pendingCandidates.current.get(peerId) || [];
    for (const c of pending) {
      try { await pc.addIceCandidate(c); } catch {}
    }
    pendingCandidates.current.delete(peerId);
  }, []);

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
          if (!next.has(data.peerId)) {
            next.set(data.peerId, { id: data.peerId, name: data.name || data.peerId, audioOn: true, videoOn: true });
          }
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
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          await flushPendingCandidates(data.from);
        }
        break;
      }
      case "webrtc_ice": {
        await addIceCandidate(data.from, data.candidate);
        break;
      }
      case "webrtc_peer_left": {
        removePeer(data.peerId);
        break;
      }
      case "webrtc_chat": {
        setChatMessages(prev => [...prev, {
          from: data.from, name: data.name, text: data.text, ts: data.ts,
        }]);
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
    }
  }, [createPC, sendWs, addIceCandidate, flushPendingCandidates, removePeer]);

  const getMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setMediaError(null);
      return stream;
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
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
    };
  }, [getMedia]);

  const joinMeeting = useCallback(async () => {
    if (!userId || !roomId) return;

    const stream = localStream || await getMedia();
    if (!stream && !mediaError) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "auth", userId }));
      setWsReady(true);
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "online_users") {
          ws.send(JSON.stringify({ type: "webrtc_join", roomId, name: userName }));
          setJoined(true);
        } else {
          await handleWsMessage(data);
        }
      } catch {}
    };

    ws.onclose = () => setWsReady(false);
    ws.onerror = () => setWsReady(false);
  }, [userId, roomId, userName, localStream, mediaError, getMedia, handleWsMessage]);

  const leaveMeeting = useCallback(() => {
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

  const toggleScreenShare = useCallback(async () => {
    if (screenSharing) {
      const cam = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const track = cam.getVideoTracks()[0];
      pcsRef.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        if (sender) sender.replaceTrack(track);
      });
      localStreamRef.current?.getVideoTracks().forEach(t => t.stop());
      const audio = localStreamRef.current?.getAudioTracks()[0];
      const newStream = new MediaStream([...(audio ? [audio] : []), track]);
      localStreamRef.current = newStream;
      setLocalStream(newStream);
      setScreenSharing(false);
    } else {
      try {
        const screen = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
        const track = screen.getVideoTracks()[0];
        pcsRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === "video");
          if (sender) sender.replaceTrack(track);
        });
        const audio = localStreamRef.current?.getAudioTracks()[0];
        const newStream = new MediaStream([...(audio ? [audio] : []), track]);
        localStreamRef.current = newStream;
        setLocalStream(newStream);
        setScreenSharing(true);
        track.onended = () => toggleScreenShare();
      } catch {}
    }
  }, [screenSharing]);

  const sendChat = useCallback(() => {
    const text = chatMsg.trim();
    if (!text || !roomId) return;
    sendWs({ type: "webrtc_chat", roomId, text, name: userName });
    setChatMessages(prev => [...prev, { from: userId || "", name: userName, text, ts: Date.now(), self: true }]);
    setChatMsg("");
  }, [chatMsg, roomId, userId, userName, sendWs]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          <Button onClick={() => navigate("/dashboard")} variant="outline" className="border-white/20 text-white hover:bg-white/10">
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  const localPeer: Peer = { id: userId || "local", name: userName, stream: localStream || undefined, audioOn, videoOn };
  const allPeers = [localPeer, ...Array.from(peers.values())];
  const totalPeers = allPeers.length;
  const gridCols = totalPeers === 1 ? "grid-cols-1" : totalPeers === 2 ? "grid-cols-2" : totalPeers <= 4 ? "grid-cols-2" : "grid-cols-3";

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
              <video
                ref={(el) => { if (el && localStream) el.srcObject = localStream; }}
                autoPlay muted playsInline
                className="w-full h-full object-cover"
              />
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
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full border transition-all ${audioOn ? "bg-white/10 border-white/20 text-white" : "bg-red-500 border-red-400 text-white"}`}
              data-testid="button-toggle-audio-lobby"
            >
              {audioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full border transition-all ${videoOn ? "bg-white/10 border-white/20 text-white" : "bg-red-500 border-red-400 text-white"}`}
              data-testid="button-toggle-video-lobby"
            >
              {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={joinMeeting}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white h-11"
              data-testid="button-join-meeting"
            >
              انضم للاجتماع
            </Button>
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 h-11"
              data-testid="button-cancel-join"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col" dir="rtl">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900/80 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">مباشر</Badge>
          <span className="text-white font-semibold truncate max-w-48">{meeting.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-white/50 text-sm">
            <Users className="w-4 h-4" />
            <span>{totalPeers}</span>
          </div>
          <button
            onClick={copyLink}
            className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="نسخ الرابط"
            data-testid="button-copy-link"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setChatOpen(v => !v)}
            className={`p-2 rounded-lg transition-colors ${chatOpen ? "bg-white/20 text-white" : "text-white/50 hover:text-white hover:bg-white/10"}`}
            data-testid="button-toggle-chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-4">
          <div className={`grid ${gridCols} gap-3 h-full max-h-[calc(100vh-140px)]`}>
            {allPeers.map(peer => (
              <VideoTile
                key={peer.id}
                peer={peer}
                local={peer.id === (userId || "local")}
              />
            ))}
          </div>
        </div>

        {chatOpen && (
          <div className="w-72 bg-gray-900 border-r border-white/[0.06] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <span className="text-white font-medium text-sm">الدردشة</span>
              <button onClick={() => setChatOpen(false)} className="text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.length === 0 && (
                <p className="text-white/30 text-xs text-center py-4">لا توجد رسائل بعد</p>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex flex-col gap-0.5 ${msg.self ? "items-end" : "items-start"}`}>
                  <span className="text-white/40 text-[10px]">{msg.self ? "أنت" : msg.name}</span>
                  <div className={`px-3 py-1.5 rounded-xl text-sm max-w-[90%] ${msg.self ? "bg-white text-black" : "bg-white/10 text-white"}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-white/[0.06] flex gap-2">
              <Input
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChat()}
                placeholder="اكتب رسالة..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm h-8"
                data-testid="input-chat-message"
              />
              <button
                onClick={sendChat}
                className="p-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
                data-testid="button-send-chat"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 py-4 bg-gray-900/80 border-t border-white/[0.06]">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full border transition-all ${audioOn ? "bg-white/10 border-white/20 text-white hover:bg-white/20" : "bg-red-500 border-red-400 text-white"}`}
          title={audioOn ? "كتم الميكروفون" : "تشغيل الميكروفون"}
          data-testid="button-toggle-audio"
        >
          {audioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full border transition-all ${videoOn ? "bg-white/10 border-white/20 text-white hover:bg-white/20" : "bg-red-500 border-red-400 text-white"}`}
          title={videoOn ? "إيقاف الكاميرا" : "تشغيل الكاميرا"}
          data-testid="button-toggle-video"
        >
          {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full border transition-all ${screenSharing ? "bg-blue-500 border-blue-400 text-white" : "bg-white/10 border-white/20 text-white hover:bg-white/20"}`}
          title={screenSharing ? "إيقاف مشاركة الشاشة" : "مشاركة الشاشة"}
          data-testid="button-screen-share"
        >
          {screenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </button>

        <button
          onClick={leaveMeeting}
          className="p-3 rounded-full bg-red-500 border border-red-400 text-white hover:bg-red-600 transition-all"
          title="مغادرة الاجتماع"
          data-testid="button-leave-meeting"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
