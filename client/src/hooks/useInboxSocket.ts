import { useEffect, useRef, useCallback, useState } from "react";

export type InboxSocketEvent =
  | { type: "new_message"; message: any; csSessionId?: string }
  | { type: "typing"; fromUserId: string; isTyping: boolean }
  | { type: "voice_recording"; fromUserId: string; isRecording: boolean }
  | { type: "user_online"; userId: string }
  | { type: "user_offline"; userId: string }
  | { type: "online_users"; users: string[] }
  | { type: "notification"; [key: string]: any }
  | { type: "task_completed"; taskId: string; taskTitle: string; completedBy: string }
  | { type: "group_message"; message: any; groupId: string }
  | { type: "group_added"; groupId: string; groupName: string }
  | { type: "cs_session_update"; sessionId?: string }
  | { type: "cs_assigned"; sessionId?: string };

interface UseInboxSocketOptions {
  userId?: string;
  onEvent?: (event: InboxSocketEvent) => void;
}

const WS_URL = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`;

export function useInboxSocket({ userId, onEvent }: UseInboxSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (!userId) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: "auth", userId }));
      // Keepalive ping every 25s
      pingTimerRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 25000);
    };

    ws.onmessage = (evt) => {
      try {
        const data: InboxSocketEvent = JSON.parse(evt.data);
        if (data.type === "online_users") {
          setOnlineUsers(new Set((data as any).users));
        } else if (data.type === "user_online") {
          setOnlineUsers(prev => new Set([...prev, (data as any).userId]));
        } else if (data.type === "user_offline") {
          setOnlineUsers(prev => { const s = new Set(prev); s.delete((data as any).userId); return s; });
        }
        onEventRef.current?.(data);
      } catch {}
    };

    ws.onclose = () => {
      setConnected(false);
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      // Auto-reconnect after 3s
      reconnectTimerRef.current = setTimeout(() => connect(), 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [userId]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sendTyping = useCallback((toUserId: string, isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "typing", toUserId, isTyping }));
    }
  }, []);

  const sendVoiceRecording = useCallback((toUserId: string, isRecording: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "voice_recording", toUserId, isRecording }));
    }
  }, []);

  return { connected, onlineUsers, sendTyping, sendVoiceRecording };
}
