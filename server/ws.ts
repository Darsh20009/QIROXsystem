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

// ── WebRTC Meet Room Management ───────────────────────────────────────────────
const meetRooms = new Map<string, Map<string, { name: string; userId: string; photoUrl?: string }>>();

// ── Room metadata (lock, host, bans, polls) ───────────────────────────────────
interface PollOption { text: string; votes: number }
interface ActivePoll {
  id: string;
  question: string;
  options: PollOption[];
  voted: Set<string>;
  hostId: string;
}
interface RoomMeta {
  hostId: string;
  locked: boolean;
  bannedUsers: Set<string>;
  activePoll: ActivePoll | null;
  attendanceLog: { userId: string; name: string; action: "join" | "leave"; time: string }[];
}

const meetRoomMeta = new Map<string, RoomMeta>();

function getRoomMeta(roomId: string): RoomMeta {
  if (!meetRoomMeta.has(roomId)) {
    meetRoomMeta.set(roomId, { hostId: "", locked: false, bannedUsers: new Set(), activePoll: null, attendanceLog: [] });
  }
  return meetRoomMeta.get(roomId)!;
}

export function setRoomHost(roomId: string, userId: string): void {
  const meta = getRoomMeta(roomId);
  if (!meta.hostId) meta.hostId = userId;
}

export function getRoomHost(roomId: string): string {
  return getRoomMeta(roomId).hostId;
}

export function isRoomLocked(roomId: string): boolean {
  return getRoomMeta(roomId).locked;
}

export function setRoomLocked(roomId: string, locked: boolean): void {
  getRoomMeta(roomId).locked = locked;
}

export function isBannedFromRoom(roomId: string, userId: string): boolean {
  return getRoomMeta(roomId).bannedUsers.has(userId);
}

export function banFromRoom(roomId: string, userId: string): void {
  getRoomMeta(roomId).bannedUsers.add(userId);
}

export function unbanFromRoom(roomId: string, userId: string): void {
  getRoomMeta(roomId).bannedUsers.delete(userId);
}

export function setActivePoll(roomId: string, poll: ActivePoll | null): void {
  getRoomMeta(roomId).activePoll = poll;
}

export function getActivePoll(roomId: string): ActivePoll | null {
  return getRoomMeta(roomId).activePoll;
}

export function addAttendanceLog(roomId: string, entry: { userId: string; name: string; action: "join" | "leave"; time: string }): void {
  getRoomMeta(roomId).attendanceLog.push(entry);
}

export function getAttendanceLog(roomId: string): RoomMeta["attendanceLog"] {
  return getRoomMeta(roomId).attendanceLog;
}

export function joinMeetRoom(roomId: string, userId: string, name: string, photoUrl?: string): string[] {
  if (!meetRooms.has(roomId)) meetRooms.set(roomId, new Map());
  const room = meetRooms.get(roomId)!;
  const existingPeers = [...room.keys()].filter(id => id !== userId);
  room.set(userId, { name, userId, photoUrl });
  // First joiner becomes host if no host set
  if (existingPeers.length === 0) setRoomHost(roomId, userId);
  // Log attendance
  addAttendanceLog(roomId, { userId, name, action: "join", time: new Date().toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" }) });
  return existingPeers;
}

export function leaveMeetRoom(roomId: string, userId: string): string[] {
  const room = meetRooms.get(roomId);
  if (!room) return [];
  const peerInfo = room.get(userId);
  room.delete(userId);
  if (room.size === 0) {
    meetRooms.delete(roomId);
    meetRoomMeta.delete(roomId);
  } else if (peerInfo) {
    addAttendanceLog(roomId, { userId, name: peerInfo.name, action: "leave", time: new Date().toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" }) });
  }
  return room ? [...room.keys()] : [];
}

export function getMeetRoomPeers(roomId: string): string[] {
  return [...(meetRooms.get(roomId)?.keys() || [])];
}

export function getMeetRoomPeerInfo(roomId: string): { userId: string; name: string; photoUrl?: string }[] {
  const room = meetRooms.get(roomId);
  if (!room) return [];
  return [...room.values()];
}

// ── Sandbox Log Channels ────────────────────────────────────────────────────
const sandboxSubscriptions = new Map<string, Set<string>>();

export function subscribeSandboxLogs(userId: string, projectId: string): void {
  const key = `sandbox-logs:${projectId}`;
  if (!sandboxSubscriptions.has(key)) sandboxSubscriptions.set(key, new Set());
  sandboxSubscriptions.get(key)!.add(userId);
}

export function unsubscribeSandboxLogs(userId: string, projectId: string): void {
  const key = `sandbox-logs:${projectId}`;
  const subs = sandboxSubscriptions.get(key);
  if (subs) {
    subs.delete(userId);
    if (subs.size === 0) sandboxSubscriptions.delete(key);
  }
}

export function broadcastSandboxLog(projectId: string, stream: "stdout" | "stderr", text: string): void {
  const key = `sandbox-logs:${projectId}`;
  const subs = sandboxSubscriptions.get(key);
  if (!subs) return;
  const payload = { type: "sandbox-log", projectId, stream, text, ts: Date.now() };
  for (const userId of subs) {
    sendToUser(userId, payload);
  }
}

export function leaveAllMeetRooms(userId: string): { roomId: string; remaining: string[] }[] {
  const left: { roomId: string; remaining: string[] }[] = [];
  for (const [roomId, room] of meetRooms.entries()) {
    if (room.has(userId)) {
      room.delete(userId);
      if (room.size === 0) meetRooms.delete(roomId);
      else left.push({ roomId, remaining: [...room.keys()] });
    }
  }
  return left;
}
