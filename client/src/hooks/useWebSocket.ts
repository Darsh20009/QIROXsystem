import { createElement, useEffect, useRef, useCallback } from "react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

function playQiroxSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [440, 554.37, 659.25];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.11;
      const end = start + 0.13;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, end);
      osc.start(start);
      osc.stop(end);
    });
    setTimeout(() => ctx.close(), 600);
  } catch {}
}

const MAX_RETRIES = 10;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

export function useWebSocket(userId: string | undefined) {
  const wsRef = useRef<WebSocket | null>(null);
  const retryCount = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const destroyed = useRef(false);
  const { toast } = useToast();

  const connect = useCallback(() => {
    if (!userId || destroyed.current) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      retryCount.current = 0;
      ws.send(JSON.stringify({ type: "auth", userId }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "notification") {
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
          queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
          if (data.title) {
            playQiroxSound();
            const toastOpts: any = {
              title: data.title,
              description: data.body || "",
              duration: 6000,
            };
            if (data.link && data.link !== "/") {
              toastOpts.action = createElement(
                ToastAction,
                {
                  altText: "فتح",
                  onClick: () => { window.location.href = data.link; },
                },
                "فتح"
              );
            }
            toast(toastOpts);
          }
        }

        if (data.type === "promotional_push") {
          if (data.title) {
            playQiroxSound();
            const toastOpts: any = {
              title: data.title,
              description: data.body || "",
              duration: 8000,
            };
            if (data.url && data.url !== "/") {
              toastOpts.action = createElement(
                ToastAction,
                {
                  altText: "عرض",
                  onClick: () => { window.location.href = data.url; },
                },
                "عرض"
              );
            }
            toast(toastOpts);
          }
        }

        if (data.type === "push_auth_challenge" && data.challengeId) {
          playQiroxSound();
          const challengeUrl = `/auth/push-approve?id=${data.challengeId}`;
          toast({
            title: "🔐 محاولة تسجيل دخول جديدة",
            description: `رقم التأكيد: ${data.number} · ${data.deviceInfo || "جهاز غير معروف"}`,
            duration: 30000,
            action: createElement(
              ToastAction,
              {
                altText: "موافقة / رفض",
                onClick: () => { window.location.href = challengeUrl; },
              },
              "موافقة / رفض"
            ),
          });
        }
      } catch {}
    };

    ws.onerror = () => {};

    ws.onclose = () => {
      wsRef.current = null;
      if (destroyed.current) return;
      if (retryCount.current >= MAX_RETRIES) return;

      const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCount.current), MAX_DELAY_MS);
      retryCount.current++;
      retryTimer.current = setTimeout(() => {
        if (!destroyed.current) connect();
      }, delay);
    };
  }, [userId, toast]);

  useEffect(() => {
    if (!userId) return;
    destroyed.current = false;
    retryCount.current = 0;
    connect();

    return () => {
      destroyed.current = true;
      if (retryTimer.current) clearTimeout(retryTimer.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [userId, connect]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_RECEIVED") {
        const { title, body } = event.data.payload || {};
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
        if (title) {
          playQiroxSound();
          toast({ title, description: body || "", duration: 5000 });
        }
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  return wsRef;
}
