import { useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useWebSocket(userId: string | undefined) {
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

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
          if (data.title) {
            toast({
              title: data.title,
              description: data.body || "",
              duration: 5000,
            });
          }
        }
      } catch {}
    };

    ws.onerror = () => {};

    ws.onclose = () => {
      setTimeout(() => {
        if (wsRef.current === ws) wsRef.current = null;
      }, 1000);
    };

    return () => {
      ws.close();
    };
  }, [userId]);

  return wsRef;
}
