import { WebSocket } from "ws";

const userSockets = new Map<string, WebSocket>();

export function registerSocket(userId: string, ws: WebSocket) {
  userSockets.set(userId, ws);
}

export function unregisterSocket(userId: string) {
  userSockets.delete(userId);
}

export function pushNotification(userId: string, payload: object) {
  const ws = userSockets.get(String(userId));
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "notification", ...payload }));
  }
}

export function broadcastNotification(payload: object) {
  for (const ws of userSockets.values()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "notification", ...payload }));
    }
  }
}
