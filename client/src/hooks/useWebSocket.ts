import { useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";

export function useWebSocket(userId: string | undefined) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "auth", userId }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "notification") {
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
          queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
        }
      } catch {}
    };

    ws.onerror = () => {};
    ws.onclose = () => {};

    return () => {
      ws.close();
    };
  }, [userId]);

  return wsRef;
}
