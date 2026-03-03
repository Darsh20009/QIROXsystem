import { WebSocket } from "ws";

interface UserInfo {
  ws: WebSocket;
  userId: string;
  lastSeen: Date;
}

const userSockets = new Map<string, UserInfo>();

export function registerSocket(userId: string, ws: WebSocket) {
  userSockets.set(userId, { ws, userId, lastSeen: new Date() });
  // Broadcast online status to all
  broadcastToAll({ type: "user_online", userId }, userId);
}

export function unregisterSocket(userId: string) {
  userSockets.delete(userId);
  // Broadcast offline status
  broadcastToAll({ type: "user_offline", userId }, userId);
}

export function getOnlineUsers(): string[] {
  return [...userSockets.keys()];
}

export function isUserOnline(userId: string): boolean {
  return userSockets.has(String(userId));
}

export function pushNotification(userId: string, payload: object) {
  const info = userSockets.get(String(userId));
  if (info && info.ws.readyState === WebSocket.OPEN) {
    info.ws.send(JSON.stringify({ type: "notification", ...payload }));
  }
}

export function pushToUser(userId: string, payload: object) {
  const info = userSockets.get(String(userId));
  if (info && info.ws.readyState === WebSocket.OPEN) {
    info.ws.send(JSON.stringify(payload));
  }
}

export function broadcastNotification(payload: object) {
  for (const info of userSockets.values()) {
    if (info.ws.readyState === WebSocket.OPEN) {
      info.ws.send(JSON.stringify({ type: "notification", ...payload }));
    }
  }
}

export function broadcastToAll(payload: object, excludeUserId?: string) {
  for (const [uid, info] of userSockets.entries()) {
    if (excludeUserId && uid === excludeUserId) continue;
    if (info.ws.readyState === WebSocket.OPEN) {
      info.ws.send(JSON.stringify(payload));
    }
  }
}

export function broadcastToUsers(userIds: string[], payload: object) {
  for (const uid of userIds) {
    pushToUser(uid, payload);
  }
}
