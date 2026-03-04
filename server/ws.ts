import { WebSocket } from "ws";

const userSockets = new Map<string, Set<WebSocket>>();

function sendTo(ws: WebSocket, payload: object) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function sendToUser(userId: string, payload: object) {
  const sockets = userSockets.get(String(userId));
  if (!sockets) return;
  for (const ws of sockets) {
    sendTo(ws, payload);
  }
}

export function registerSocket(userId: string, ws: WebSocket) {
  const uid = String(userId);
  if (!userSockets.has(uid)) {
    userSockets.set(uid, new Set());
    broadcastToAll({ type: "user_online", userId: uid }, uid);
  }
  userSockets.get(uid)!.add(ws);
}

export function unregisterSocket(userId: string, ws: WebSocket) {
  const uid = String(userId);
  const sockets = userSockets.get(uid);
  if (!sockets) return;
  sockets.delete(ws);
  if (sockets.size === 0) {
    userSockets.delete(uid);
    broadcastToAll({ type: "user_offline", userId: uid }, uid);
  }
}

export function getOnlineUsers(): string[] {
  return [...userSockets.keys()];
}

export function isUserOnline(userId: string): boolean {
  const sockets = userSockets.get(String(userId));
  return !!(sockets && sockets.size > 0);
}

export function pushNotification(userId: string, payload: object) {
  sendToUser(userId, { type: "notification", ...payload });
}

export function pushToUser(userId: string, payload: object) {
  sendToUser(userId, payload);
}

export function broadcastNotification(payload: object) {
  for (const sockets of userSockets.values()) {
    for (const ws of sockets) {
      sendTo(ws, { type: "notification", ...payload });
    }
  }
}

export function broadcastToAll(payload: object, excludeUserId?: string) {
  for (const [uid, sockets] of userSockets.entries()) {
    if (excludeUserId && uid === excludeUserId) continue;
    for (const ws of sockets) {
      sendTo(ws, payload);
    }
  }
}

export function broadcastToUsers(userIds: string[], payload: object) {
  for (const uid of userIds) {
    sendToUser(uid, payload);
  }
}
