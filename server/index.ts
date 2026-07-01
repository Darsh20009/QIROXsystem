import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { createProxyMiddleware, responseInterceptor } from "http-proxy-middleware";
import { registerRoutes, registerInstallmentRoutes, runInstallmentLateCheck } from "./routes";
import { registerAiRoutes } from "./ai";
import { serveStatic } from "./static";
import { createServer } from "http";
import { connectToDatabase } from "./db";
import { WebSocketServer } from "ws";
import { registerSocket, unregisterSocket, pushToUser, getOnlineUsers, joinMeetRoom, leaveMeetRoom, getMeetRoomPeers, getMeetRoomPeerInfo, leaveAllMeetRooms, subscribeSandboxLogs, unsubscribeSandboxLogs, isRoomLocked, setRoomLocked, isBannedFromRoom, banFromRoom, getRoomHost, forceSetRoomHost, setActivePoll, getActivePoll, getAttendanceLog, addLockPending, removeLockPending, getLockPending } from "./ws";
import { initCronJobs } from "./cron";
import { startQMeetScheduler, registerQMeetRoutes } from "./qmeet";
import { registerSandboxRoutes } from "./sandbox-routes";
import { registerDeploymentCloudRoutes, registerSubdomainMiddleware } from "./deployment-cloud";
import { registerCrmRoutes } from "./crm";
import { registerEmailMarketingRoutes, runDailyBulkCampaign, runWeeklyInterestedCollection } from "./email-marketing";
import mongoose from "mongoose";
import { cache } from "./cache";
import { connManager } from "./connection-manager";
import { mkdirSync, existsSync } from "fs";
import path from "path";

// Global error handlers to prevent server crashes
process.on("unhandledRejection", (reason: any, promise) => {
  console.error("[UnhandledRejection] Unhandled promise rejection:", reason?.message || reason, "at:", promise);
});
process.on("uncaughtException", (err: Error) => {
  console.error("[UncaughtException] Uncaught exception:", err.message, err.stack);
});

// Ensure required directories exist on startup
try { mkdirSync("uploads", { recursive: true }); } catch {}
try { mkdirSync("sandbox-projects", { recursive: true }); } catch {}

const app = express();
app.set("trust proxy", 1);

// Gzip/Brotli compression — reduces response size by 60-80%, dramatically speeds up all API and static responses
app.use(compression({
  level: 6,             // balanced speed vs compression (1=fastest, 9=smallest)
  threshold: 1024,      // only compress responses > 1KB
  filter: (req, res) => {
    // Never compress SSE streams (WebSocket upgrades handled separately)
    if (req.headers["accept"] === "text/event-stream") return false;
    return compression.filter(req, res);
  },
}));

const httpServer = createServer(app);
// Render recommends >= 120s to avoid intermittent connection resets
httpServer.keepAliveTimeout = 120000;
httpServer.headersTimeout = 125000; // slightly above keepAliveTimeout

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// ── Security Headers ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Allow iframe embedding (e.g., Replit canvas preview)
  res.removeHeader("X-Frame-Options");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Allow camera, microphone, and screen capture globally (required for WebRTC meeting rooms)
  // The app is a SPA — client-side routing means the initial document policy applies everywhere
  res.setHeader("Permissions-Policy", "camera=*, microphone=*, display-capture=*, geolocation=(), interest-cohort=()");

  res.setHeader("X-Download-Options", "noopen");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  // Only set HSTS in production to avoid dev issues
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

// ── Cafe Site Proxy (strips X-Frame-Options so pages can be embedded) ─────────
const CAFE_BASE = "https://cafe.qiroxstudio.online";
app.use(
  "/cafe-proxy",
  createProxyMiddleware({
    target: CAFE_BASE,
    changeOrigin: true,
    selfHandleResponse: true,
    pathRewrite: { "^/cafe-proxy": "" },
    on: {
      proxyRes: responseInterceptor(async (responseBuffer, proxyRes, _req, res) => {
        // Strip frame-blocking headers from both proxyRes and res
        delete proxyRes.headers["x-frame-options"];
        delete proxyRes.headers["content-security-policy"];
        delete proxyRes.headers["content-security-policy-report-only"];
        res.removeHeader("x-frame-options");
        res.removeHeader("X-Frame-Options");
        res.removeHeader("content-security-policy");
        res.removeHeader("Content-Security-Policy");
        res.removeHeader("content-security-policy-report-only");

        const contentType = proxyRes.headers["content-type"] || "";
        if (contentType.includes("text/html")) {
          let html = responseBuffer.toString("utf8");
          // Inject <base> so relative URLs resolve to the cafe domain
          if (!html.includes("<base ")) {
            html = html.replace("<head>", `<head><base href="${CAFE_BASE}/">`);
          }
          return html;
        }
        return responseBuffer;
      }),
    },
  })
);

// ── E-Commerce Site Proxy (strips X-Frame-Options so pages can be embedded) ───
const ECOMMERCE_BASE = "https://e-commerce.qiroxstudio.online";
app.use(
  "/ecommerce-proxy",
  createProxyMiddleware({
    target: ECOMMERCE_BASE,
    changeOrigin: true,
    selfHandleResponse: true,
    pathRewrite: { "^/ecommerce-proxy": "" },
    on: {
      proxyRes: responseInterceptor(async (responseBuffer, proxyRes, _req, res) => {
        delete proxyRes.headers["x-frame-options"];
        delete proxyRes.headers["content-security-policy"];
        delete proxyRes.headers["content-security-policy-report-only"];
        res.removeHeader("x-frame-options");
        res.removeHeader("X-Frame-Options");
        res.removeHeader("content-security-policy");
        res.removeHeader("Content-Security-Policy");
        res.removeHeader("content-security-policy-report-only");
        const contentType = proxyRes.headers["content-type"] || "";
        if (contentType.includes("text/html")) {
          let html = responseBuffer.toString("utf8");
          if (!html.includes("<base ")) {
            html = html.replace("<head>", `<head><base href="${ECOMMERCE_BASE}/">`);
          }
          return html;
        }
        return responseBuffer;
      }),
    },
  })
);

// ── E-Commerce API Proxy ──────────────────────────────────────────────────────
app.use(
  "/ecommerce-api",
  createProxyMiddleware({
    target: ECOMMERCE_BASE,
    changeOrigin: true,
    pathRewrite: { "^/ecommerce-api": "" },
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.headers.cookie) {
          proxyReq.setHeader("Cookie", req.headers.cookie);
        }
      },
      proxyRes: (proxyRes, _req, res) => {
        const setCookie = proxyRes.headers["set-cookie"];
        if (setCookie) {
          const rewritten = setCookie.map((c) =>
            c.replace(/;\s*Domain=[^;]+/i, "")
          );
          res.setHeader("set-cookie", rewritten);
        }
      },
    },
  })
);

// ── Cafe API Proxy (same-origin bridge for the embedded cafe demo SPA) ────────
// The cafe-demo SPA sends API requests to /cafe-api/* — we forward them
// server-side so the browser never sees a CORS error.
app.use(
  "/cafe-api",
  createProxyMiddleware({
    target: CAFE_BASE,
    changeOrigin: true,
    pathRewrite: { "^/cafe-api": "" },
    on: {
      proxyReq: (proxyReq, req) => {
        // Forward the original host cookie so sessions work
        if (req.headers.cookie) {
          proxyReq.setHeader("Cookie", req.headers.cookie);
        }
      },
      proxyRes: (proxyRes, _req, res) => {
        // Rewrite Set-Cookie domain so the browser stores it under our domain
        const setCookie = proxyRes.headers["set-cookie"];
        if (setCookie) {
          const rewritten = setCookie.map((c) =>
            c.replace(/;\s*Domain=[^;]+/i, "")
          );
          res.setHeader("set-cookie", rewritten);
        }
      },
    },
  })
);

// ── Anti-scraping / bot detection ─────────────────────────────────────────────
const suspiciousPatterns = [
  /sqlmap/i, /nikto/i, /nmap/i, /masscan/i, /havij/i,
  /acunetix/i, /burpsuite/i, /<script/i, /javascript:/i,
  /union.*select/i, /drop.*table/i, /insert.*into/i,
  /exec\s*\(/i, /eval\s*\(/i,
];
app.use((req, res, next) => {
  const ua = req.headers["user-agent"] || "";
  const isSuspicious = suspiciousPatterns.some(p => p.test(ua));
  if (isSuspicious) {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
});

let reconnecting = false;
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();

  if (req.method === "GET" && req.path.startsWith("/api/")) {
    if (!reconnecting) {
      reconnecting = true;
      console.warn("[MongoDB] Disconnected — attempting reconnection...");
      try {
        const uri = connManager.primaryUri || process.env.MONGODB_URI;
        if (uri) {
          await mongoose.connect(uri.replace(/\s+/g, ""), {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 10000,
            connectTimeoutMS: 5000,
          });
          console.log("[MongoDB] Reconnected successfully");
        }
      } catch (err: any) {
        console.error("[MongoDB] Reconnection failed:", err.message);
      } finally {
        reconnecting = false;
      }
    }
  }

  next();
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws) => {
  let userId: string | null = null;
  let currentRoomId: string | null = null;

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === "auth" && msg.userId) {
        userId = String(msg.userId);
        registerSocket(userId, ws);
        ws.send(JSON.stringify({ type: "online_users", users: getOnlineUsers() }));
        return;
      }

      if (!userId) return;

      if (msg.type === "typing" && msg.toUserId) {
        pushToUser(String(msg.toUserId), { type: "typing", fromUserId: userId, isTyping: msg.isTyping });
        return;
      }

      if (msg.type === "voice_recording" && msg.toUserId) {
        pushToUser(String(msg.toUserId), { type: "voice_recording", fromUserId: userId, isRecording: msg.isRecording });
        return;
      }

      if (msg.type === "ping") {
        ws.send(JSON.stringify({ type: "pong" }));
        return;
      }

      // ── Sandbox Log Subscription ──────────────────────────────────────────
      if (msg.type === "sandbox_subscribe" && msg.projectId) {
        (async () => {
          try {
            const { SandboxProjectModel } = await import("./models");
            const { UserModel } = await import("./models");
            const project = await SandboxProjectModel.findById(msg.projectId);
            if (!project) { ws.send(JSON.stringify({ type: "sandbox_error", error: "المشروع غير موجود" })); return; }
            const ownerId = String(project.ownerId);
            if (ownerId !== userId) {
              const user = await UserModel.findById(userId);
              if (!user || (user.role !== "admin" && user.role !== "manager")) {
                ws.send(JSON.stringify({ type: "sandbox_error", error: "غير مصرح" }));
                return;
              }
            }
            subscribeSandboxLogs(userId, String(msg.projectId));
            ws.send(JSON.stringify({ type: "sandbox_subscribed", projectId: msg.projectId }));
          } catch {
            ws.send(JSON.stringify({ type: "sandbox_error", error: "خطأ في الاشتراك" }));
          }
        })();
        return;
      }
      if (msg.type === "sandbox_unsubscribe" && msg.projectId) {
        unsubscribeSandboxLogs(userId, String(msg.projectId));
        return;
      }

      // ── WebRTC Meet Signaling ───────────────────────────────────────────────
      if (msg.type === "webrtc_join" && msg.roomId) {
        (async () => {
          const rId = String(msg.roomId);
          const uid = String(userId);

          // ── Ban check ─────────────────────────────────────────────────────
          if (isBannedFromRoom(rId, uid)) {
            ws.send(JSON.stringify({ type: "webrtc_banned", roomId: rId }));
            return;
          }

          // ── Lock check → send to lock-lobby instead of blocking ────────────
          if (isRoomLocked(rId)) {
            const hostId = getRoomHost(rId);
            if (uid !== hostId) {
              // Add to lock-pending list and notify host
              addLockPending(rId, uid, msg.name || uid);
              ws.send(JSON.stringify({ type: "webrtc_lobby_waiting", roomId: rId, reason: "locked" }));
              // Notify host to approve/deny
              if (hostId) {
                pushToUser(hostId, {
                  type: "webrtc_lock_join_request",
                  roomId: rId,
                  userId: uid,
                  userName: msg.name || uid,
                });
              }
              return;
            }
          }

          // ── Lobby enforcement ─────────────────────────────────────────────
          try {
            const { QMeetingModel: QMF } = await import("./qmeet-db");
            const meeting = await QMF().findOne({ roomName: rId });
            if (meeting && meeting.lobbyEnabled) {
              const inParticipants = (meeting.participantIds || []).some((id: any) => String(id) === uid);
              const isHostUser = String(meeting.hostId) === uid;
              if (!inParticipants && !isHostUser) {
                const existing = (meeting.joinRequests || []).find((r: any) => String(r.userId) === uid && r.status === "pending");
                if (!existing) {
                  await QMF().findByIdAndUpdate(meeting._id, {
                    $push: { joinRequests: { userId: uid, userName: msg.name || uid, userEmail: "", userPhone: "", status: "pending", requestedAt: new Date() } }
                  });
                }
                ws.send(JSON.stringify({ type: "webrtc_lobby_waiting", roomId: rId, meetingId: String(meeting._id), meetingTitle: meeting.title }));
                pushToUser(String(meeting.hostId), {
                  type: "qmeet_join_request",
                  meetingId: String(meeting._id),
                  meetingTitle: meeting.title,
                  userId: uid,
                  userName: msg.name || uid,
                  userEmail: "", userPhone: "",
                  requestedAt: new Date().toISOString(),
                  message: `${msg.name || uid} يطلب الانضمام إلى الاجتماع: ${meeting.title}`,
                });
                return;
              }
            }
          } catch { /* on error, allow entry */ }

          // ── Normal join ───────────────────────────────────────────────────
          if (currentRoomId && currentRoomId !== rId) {
            const prevRoomId = currentRoomId;
            const wasHostPrev = getRoomHost(prevRoomId) === uid;
            const remaining = leaveMeetRoom(prevRoomId, uid);
            for (const peerId of remaining) {
              pushToUser(peerId, { type: "webrtc_peer_left", peerId: uid, roomId: prevRoomId });
            }
            if (wasHostPrev && remaining.length > 0) {
              const newHostId = remaining[0];
              forceSetRoomHost(prevRoomId, newHostId);
              for (const peerId of remaining) {
                pushToUser(peerId, { type: "webrtc_host_changed", newHostId, roomId: prevRoomId });
              }
            }
          }
          currentRoomId = rId;
          const existingPeers = joinMeetRoom(currentRoomId, uid, msg.name || uid, msg.photoUrl || "", msg.facingMode || "user");
          const hostId = getRoomHost(currentRoomId);
          const peerInfoList = getMeetRoomPeerInfo(currentRoomId).filter(p => p.userId !== uid);
          ws.send(JSON.stringify({
            type: "webrtc_peers",
            peers: existingPeers,
            peerInfoList,
            roomId: currentRoomId,
            hostId,
            isLocked: isRoomLocked(currentRoomId),
            activePoll: (() => { const p = getActivePoll(currentRoomId!); return p ? { id: p.id, question: p.question, options: p.options, hostId: p.hostId } : null; })(),
          }));
          for (const peerId of existingPeers) {
            pushToUser(peerId, { type: "webrtc_peer_joined", peerId: uid, name: msg.name || uid, photoUrl: msg.photoUrl || "", facingMode: msg.facingMode || "user", roomId: currentRoomId });
          }
        })();
        return;
      }

      if (msg.type === "webrtc_offer" && msg.to && msg.offer) {
        pushToUser(String(msg.to), { type: "webrtc_offer", from: userId, offer: msg.offer });
        return;
      }

      if (msg.type === "webrtc_answer" && msg.to && msg.answer) {
        pushToUser(String(msg.to), { type: "webrtc_answer", from: userId, answer: msg.answer });
        return;
      }

      if (msg.type === "webrtc_ice" && msg.to && msg.candidate !== undefined) {
        pushToUser(String(msg.to), { type: "webrtc_ice", from: userId, candidate: msg.candidate });
        return;
      }

      if (msg.type === "webrtc_leave" && msg.roomId) {
        const rId = String(msg.roomId);
        const wasHost = getRoomHost(rId) === userId;
        const remaining = leaveMeetRoom(rId, userId);
        for (const peerId of remaining) {
          pushToUser(peerId, { type: "webrtc_peer_left", peerId: userId, roomId: rId });
        }
        if (wasHost && remaining.length > 0) {
          const newHostId = remaining[0];
          forceSetRoomHost(rId, newHostId);
          for (const peerId of remaining) {
            pushToUser(peerId, { type: "webrtc_host_changed", newHostId, roomId: rId });
          }
        }
        currentRoomId = null;
        return;
      }

      // Manual host transfer (current host → chosen participant)
      if (msg.type === "webrtc_transfer_host" && msg.roomId && msg.targetId) {
        const rId = String(msg.roomId);
        if (getRoomHost(rId) !== userId) return; // only host can transfer
        const targetId = String(msg.targetId);
        forceSetRoomHost(rId, targetId);
        const peers = getMeetRoomPeers(rId);
        for (const peerId of peers) {
          pushToUser(peerId, { type: "webrtc_host_changed", newHostId: targetId, roomId: rId });
        }
        return;
      }

      if (msg.type === "webrtc_chat" && msg.roomId && msg.text) {
        const peers = getMeetRoomPeers(String(msg.roomId));
        for (const peerId of peers) {
          if (peerId !== userId) {
            pushToUser(peerId, { type: "webrtc_chat", from: userId, name: msg.name || userId, text: msg.text, ts: Date.now() });
          }
        }
        return;
      }

      if (msg.type === "webrtc_media_state" && msg.roomId) {
        const peers = getMeetRoomPeers(String(msg.roomId));
        for (const peerId of peers) {
          if (peerId !== userId) {
            pushToUser(peerId, { type: "webrtc_media_state", from: userId, audio: msg.audio, video: msg.video, ...(msg.facingMode ? { facingMode: msg.facingMode } : {}) });
          }
        }
        return;
      }

      if (msg.type === "webrtc_kick" && msg.roomId && msg.targetId) {
        const rId = String(msg.roomId);
        const targetId = String(msg.targetId);
        // Ban the user from rejoining
        if (msg.ban !== false) banFromRoom(rId, targetId);
        // Remove from room
        leaveMeetRoom(rId, targetId);
        // Notify target
        pushToUser(targetId, { type: "webrtc_kicked", roomId: rId, by: userId, ban: msg.ban !== false });
        // Notify remaining peers
        const peers = getMeetRoomPeers(rId);
        for (const peerId of peers) {
          pushToUser(peerId, { type: "webrtc_peer_left", peerId: targetId, roomId: rId });
        }
        return;
      }

      // ── Lock / Unlock room ──────────────────────────────────────────────────
      if (msg.type === "webrtc_lock_room" && msg.roomId) {
        const rId = String(msg.roomId);
        const hostId = getRoomHost(rId);
        if (String(userId) !== hostId) return; // only host can lock
        const locked = !!msg.locked;
        setRoomLocked(rId, locked);
        const peers = getMeetRoomPeers(rId);
        for (const peerId of peers) {
          pushToUser(peerId, { type: "webrtc_room_lock_changed", locked, by: userId });
        }
        // If unlocking: auto-approve all lock-pending users
        if (!locked) {
          const pending = getLockPending(rId);
          for (const entry of [...pending]) {
            removeLockPending(rId, entry.userId);
            const existingPeers = joinMeetRoom(rId, entry.userId, entry.name, "");
            const currentHostId = getRoomHost(rId);
            const peerInfoList = getMeetRoomPeerInfo(rId).filter((p: any) => p.userId !== entry.userId);
            pushToUser(entry.userId, {
              type: "webrtc_peers",
              peers: existingPeers,
              peerInfoList,
              roomId: rId,
              hostId: currentHostId,
              isLocked: false,
              activePoll: (() => { const p = getActivePoll(rId); return p ? { id: p.id, question: p.question, options: p.options, hostId: p.hostId } : null; })(),
            });
            const entryInfo = getMeetRoomPeerInfo(rId).find((p: any) => p.userId === entry.userId);
            for (const peerId of existingPeers) {
              pushToUser(peerId, { type: "webrtc_peer_joined", peerId: entry.userId, name: entry.name, photoUrl: "", facingMode: entryInfo?.facingMode || "user", roomId: rId });
            }
            pushToUser(entry.userId, { type: "webrtc_lobby_approved", roomId: rId });
          }
        }
        return;
      }

      // ── Approve lobby (DB lobby or lock-pending) ──────────────────────────
      if (msg.type === "webrtc_approve_lobby" && msg.roomId && msg.targetId) {
        const rId = String(msg.roomId);
        const targetId = String(msg.targetId);

        // Handle lock-pending approval (in-memory)
        const pending = getLockPending(rId).find(e => e.userId === targetId);
        if (pending) {
          removeLockPending(rId, targetId);
          const existingPeers = joinMeetRoom(rId, targetId, pending.name, "");
          const hostId = getRoomHost(rId);
          const peerInfoList = getMeetRoomPeerInfo(rId).filter((p: any) => p.userId !== targetId);
          // Send peers list to approved user (triggers WebRTC setup)
          pushToUser(targetId, {
            type: "webrtc_peers",
            peers: existingPeers,
            peerInfoList,
            roomId: rId,
            hostId,
            isLocked: isRoomLocked(rId),
            activePoll: (() => { const p = getActivePoll(rId); return p ? { id: p.id, question: p.question, options: p.options, hostId: p.hostId } : null; })(),
          });
          // Notify existing peers of the new joiner
          const pendingInfo = getMeetRoomPeerInfo(rId).find((p: any) => p.userId === targetId);
          for (const peerId of existingPeers) {
            pushToUser(peerId, { type: "webrtc_peer_joined", peerId: targetId, name: pending.name, photoUrl: "", facingMode: pendingInfo?.facingMode || "user", roomId: rId });
          }
          // Dismiss lobby screen on the approved user
          pushToUser(targetId, { type: "webrtc_lobby_approved", roomId: rId });
          return;
        }

        // Handle DB lobby approval — join the user to the room and send peer list
        (async () => {
          try {
            const { QMeetingModel: QMF } = await import("./qmeet-db");
            const meeting = await (QMF() as any).findOne({ roomName: rId });
            const joinReq = (meeting?.joinRequests || []).find((r: any) => String(r.userId) === targetId);
            const pName = joinReq?.userName || targetId;
            const existingPeers = joinMeetRoom(rId, targetId, pName, "");
            const currentHostId = getRoomHost(rId);
            const peerInfoList = getMeetRoomPeerInfo(rId).filter((p: any) => p.userId !== targetId);
            pushToUser(targetId, {
              type: "webrtc_peers",
              peers: existingPeers,
              peerInfoList,
              roomId: rId,
              hostId: currentHostId,
              isLocked: isRoomLocked(rId),
              activePoll: null,
            });
            const dbApprovedInfo = getMeetRoomPeerInfo(rId).find((p: any) => p.userId === targetId);
            for (const peerId of existingPeers) {
              pushToUser(peerId, { type: "webrtc_peer_joined", peerId: targetId, name: pName, photoUrl: "", facingMode: dbApprovedInfo?.facingMode || "user", roomId: rId });
            }
          } catch { /* on error, still approve */ }
          pushToUser(targetId, { type: "webrtc_lobby_approved", roomId: rId });
        })();
        return;
      }

      // ── Deny lobby (DB lobby or lock-pending) ────────────────────────────
      if (msg.type === "webrtc_deny_lobby" && msg.roomId && msg.targetId) {
        const rId = String(msg.roomId);
        const targetId = String(msg.targetId);
        removeLockPending(rId, targetId);
        pushToUser(targetId, { type: "webrtc_lobby_denied", roomId: rId });
        return;
      }

      // ── Mute individual peer ──────────────────────────────────────────────
      if (msg.type === "webrtc_mute_peer" && msg.roomId && msg.targetId) {
        pushToUser(String(msg.targetId), { type: "webrtc_mute_me", by: userId, roomId: msg.roomId });
        return;
      }

      // ── Poll create ───────────────────────────────────────────────────────
      if (msg.type === "webrtc_poll_create" && msg.roomId && msg.question && msg.options) {
        const rId = String(msg.roomId);
        const poll = {
          id: `poll-${Date.now()}`,
          question: String(msg.question),
          options: (msg.options as string[]).map((text: string) => ({ text, votes: 0 })),
          voted: new Set<string>(),
          hostId: String(userId),
        };
        setActivePoll(rId, poll);
        const peers = getMeetRoomPeers(rId);
        const pollPayload = { id: poll.id, question: poll.question, options: poll.options, hostId: poll.hostId };
        for (const peerId of peers) {
          pushToUser(peerId, { type: "webrtc_poll_started", poll: pollPayload, roomId: rId });
        }
        ws.send(JSON.stringify({ type: "webrtc_poll_started", poll: pollPayload, roomId: rId }));
        return;
      }

      // ── Poll vote ──────────────────────────────────────────────────────────
      if (msg.type === "webrtc_poll_vote" && msg.roomId && msg.pollId !== undefined && msg.optionIndex !== undefined) {
        const rId = String(msg.roomId);
        const poll = getActivePoll(rId);
        if (!poll || poll.id !== msg.pollId) return;
        const uid = String(userId);
        if (poll.voted.has(uid)) return; // already voted
        poll.voted.add(uid);
        const idx = Number(msg.optionIndex);
        if (idx >= 0 && idx < poll.options.length) poll.options[idx].votes++;
        const pollPayload = { id: poll.id, question: poll.question, options: poll.options, hostId: poll.hostId, totalVotes: poll.voted.size };
        const peers = getMeetRoomPeers(rId);
        for (const peerId of peers) {
          pushToUser(peerId, { type: "webrtc_poll_updated", poll: pollPayload, roomId: rId });
        }
        ws.send(JSON.stringify({ type: "webrtc_poll_updated", poll: pollPayload, roomId: rId, myVote: idx }));
        return;
      }

      // ── Poll end ──────────────────────────────────────────────────────────
      if (msg.type === "webrtc_poll_end" && msg.roomId) {
        const rId = String(msg.roomId);
        const poll = getActivePoll(rId);
        if (!poll || String(poll.hostId) !== String(userId)) return;
        const pollPayload = { id: poll.id, question: poll.question, options: poll.options, hostId: poll.hostId, totalVotes: poll.voted.size };
        setActivePoll(rId, null);
        const peers = getMeetRoomPeers(rId);
        for (const peerId of peers) {
          pushToUser(peerId, { type: "webrtc_poll_ended", poll: pollPayload, roomId: rId });
        }
        ws.send(JSON.stringify({ type: "webrtc_poll_ended", poll: pollPayload, roomId: rId }));
        return;
      }

      // ── Live caption relay ────────────────────────────────────────────────
      if (msg.type === "webrtc_caption" && msg.roomId && msg.text) {
        const peers = getMeetRoomPeers(String(msg.roomId));
        for (const peerId of peers) {
          if (peerId !== userId) {
            pushToUser(peerId, { type: "webrtc_caption", from: userId, name: msg.name || userId, text: msg.text, ts: Date.now() });
          }
        }
        return;
      }

      // ── Attendance log request ─────────────────────────────────────────────
      if (msg.type === "webrtc_get_attendance" && msg.roomId) {
        const log = getAttendanceLog(String(msg.roomId));
        ws.send(JSON.stringify({ type: "webrtc_attendance_log", log, roomId: msg.roomId }));
        return;
      }

      if (msg.type === "webrtc_draw" && msg.roomId) {
        const peers = getMeetRoomPeers(String(msg.roomId));
        for (const peerId of peers) {
          if (peerId !== userId) {
            pushToUser(peerId, { type: "webrtc_draw", from: userId, stroke: msg.stroke });
          }
        }
        return;
      }

      if (msg.type === "webrtc_whiteboard_clear" && msg.roomId) {
        const peers = getMeetRoomPeers(String(msg.roomId));
        for (const peerId of peers) {
          if (peerId !== userId) {
            pushToUser(peerId, { type: "webrtc_whiteboard_clear", from: userId });
          }
        }
        return;
      }

      // ── End meeting for all (host only) ──────────────────────────────────
      if (msg.type === "webrtc_end_meeting" && msg.roomId) {
        const rId = String(msg.roomId);
        const hostId = getRoomHost(rId);
        if (String(userId) !== hostId) return; // only host can end for all
        const peers = getMeetRoomPeers(rId);
        // Notify all participants that the meeting has ended
        for (const peerId of peers) {
          pushToUser(peerId, { type: "webrtc_meeting_ended", roomId: rId, by: userId });
          leaveMeetRoom(rId, peerId);
        }
        // Also update the meeting status in DB if possible (non-blocking)
        (async () => {
          try {
            const { QMeetingModel: QM } = await import("./qmeet-db");
            await QM().findOneAndUpdate({ roomName: rId }, { status: "completed", endedAt: new Date() });
          } catch { /* non-critical */ }
        })();
        return;
      }

      if (msg.type === "webrtc_screen_share" && msg.roomId) {
        const peers = getMeetRoomPeers(String(msg.roomId));
        for (const peerId of peers) {
          if (peerId !== userId) {
            pushToUser(peerId, { type: "webrtc_screen_share", from: userId, active: !!msg.active, name: msg.name || userId });
          }
        }
        return;
      }

      if (msg.type === "webrtc_screen_share_request" && msg.roomId) {
        const peers = getMeetRoomPeers(String(msg.roomId));
        for (const peerId of peers) {
          if (peerId !== userId) {
            pushToUser(peerId, { type: "webrtc_screen_share_request", from: userId, name: msg.name || userId, roomId: msg.roomId });
          }
        }
        return;
      }

      if (msg.type === "webrtc_screen_share_approve" && msg.roomId && msg.targetId) {
        pushToUser(String(msg.targetId), { type: "webrtc_screen_share_approved", by: userId, roomId: msg.roomId });
        return;
      }

      if (msg.type === "webrtc_screen_share_deny" && msg.roomId && msg.targetId) {
        pushToUser(String(msg.targetId), { type: "webrtc_screen_share_denied", by: userId, roomId: msg.roomId });
        return;
      }

      if (msg.type === "webrtc_reaction" && msg.roomId) {
        const peers = getMeetRoomPeers(String(msg.roomId));
        for (const peerId of peers) {
          if (peerId !== userId) {
            pushToUser(peerId, { type: "webrtc_reaction", from: userId, emoji: msg.emoji, name: msg.name || userId });
          }
        }
        return;
      }

      if (msg.type === "webrtc_raise_hand" && msg.roomId) {
        const peers = getMeetRoomPeers(String(msg.roomId));
        for (const peerId of peers) {
          if (peerId !== userId) {
            pushToUser(peerId, { type: "webrtc_raise_hand", from: userId, raised: msg.raised, name: msg.name || userId, userId: msg.userId || userId });
          }
        }
        return;
      }

      if (msg.type === "webrtc_mute_all" && msg.roomId) {
        // Only broadcast if sender is in the room (host check on client)
        const peers = getMeetRoomPeers(String(msg.roomId));
        for (const peerId of peers) {
          if (peerId !== userId) {
            pushToUser(peerId, { type: "webrtc_mute_all", from: userId });
          }
        }
        return;
      }
    } catch {}
  });

  ws.on("close", () => {
    if (userId) {
      unregisterSocket(userId, ws);
      if (currentRoomId) {
        const closedRoomId = currentRoomId;
        const wasHost = getRoomHost(closedRoomId) === userId;
        const remaining = leaveMeetRoom(closedRoomId, userId);
        for (const peerId of remaining) {
          pushToUser(peerId, { type: "webrtc_peer_left", peerId: userId, roomId: closedRoomId });
        }
        if (wasHost && remaining.length > 0) {
          const newHostId = remaining[0];
          forceSetRoomHost(closedRoomId, newHostId);
          for (const peerId of remaining) {
            pushToUser(peerId, { type: "webrtc_host_changed", newHostId, roomId: closedRoomId });
          }
        }
        currentRoomId = null;
      }
    }
  });
});

httpServer.on("upgrade", (req, socket, head) => {
  if (req.url === "/ws") {
    wss.handleUpgrade(req, socket as any, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  }
  // /vite-hmr is handled by Vite middleware, do not destroy
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 200) logLine = logLine.slice(0, 200) + "…";
      log(logLine);
    }
  });

  next();
});

// ── Graceful Shutdown ────────────────────────────────────────────────────────
function gracefulShutdown(signal: string) {
  console.log(`\n[Shutdown] ${signal} received — shutting down gracefully...`);
  import("./sandbox-runner").then(({ stopAllProcesses }) => stopAllProcesses()).catch(() => {});
  httpServer.close(() => {
    console.log("[Shutdown] HTTP server closed");
    mongoose.connection.close().then(() => {
      console.log("[Shutdown] MongoDB connections closed");
      cache.destroy();
      process.exit(0);
    }).catch(() => process.exit(1));
  });
  setTimeout(() => {
    console.error("[Shutdown] Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ── Early health check — responds BEFORE DB connects ────────────────────────
// This prevents Render from killing the app while MongoDB is still connecting
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), service: "QIROX Studio" });
});

// ── Start HTTP server immediately (Render needs it responding fast) ──────────
const port = parseInt(process.env.PORT || "5000", 10);
httpServer.listen({ port, host: "0.0.0.0" }, () => {
  log(`serving on port ${port}`);
});

// ── Full startup: DB → routes → Vite SPA catch-all ───────────────────────────
// IMPORTANT: Vite must come LAST so it never intercepts /api/* requests
(async () => {
  // 1. Cafe demo static files (no async work needed)
  const cafeDemoDir = path.resolve(process.cwd(), "public/cafe-demo");
  if (existsSync(cafeDemoDir)) {
    app.use("/cafe-demo", express.static(cafeDemoDir, { index: false }));
    app.get("/cafe-demo", (_req, res) => res.sendFile(path.join(cafeDemoDir, "index.html")));
    app.get("/cafe-demo/*path", (_req, res) => res.sendFile(path.join(cafeDemoDir, "index.html")));
    console.log("[CafeDemo] Serving from", cafeDemoDir);
  }

  // 2. Connect to DB (health check already works via /api/health above)
  try {
    await connectToDatabase();
  } catch (err: any) {
    console.error("[Startup] ❌ MongoDB connection failed:", err.message);
    console.error("[Startup] ⚠️  Server running without DB — check MongoDB Atlas Network Access");
    console.error("[Startup]    → Atlas → Network Access → Add IP → 0.0.0.0/0 (Allow All)");
    // Don't crash — let the server stay up so health check keeps responding
    // Render will restart the service, giving MongoDB time to become accessible
  }

  // 3. Register ALL API routes BEFORE setting up Vite
  //    This ensures Vite's SPA catch-all never intercepts /api/* requests
  // Subdomain middleware FIRST — handles [slug].qiroxstudio.online requests
  registerSubdomainMiddleware(app);
  await registerRoutes(httpServer, app);
  registerQMeetRoutes(app);
  startQMeetScheduler();
  await registerInstallmentRoutes(app);
  registerAiRoutes(app);
  registerSandboxRoutes(app, httpServer);
  registerDeploymentCloudRoutes(app);
  registerCrmRoutes(app);
  registerEmailMarketingRoutes(app);

  // ── Email Marketing Cron Jobs ────────────────────────────────────────────────
  // Daily bulk: every day at 9 AM
  import("node-cron").then(({ default: cron }) => {
    cron.schedule("0 9 * * *", async () => {
      console.log("[EmailMarketing] Running daily bulk campaign...");
      try {
        const result = await runDailyBulkCampaign();
        console.log(`[EmailMarketing] Daily bulk done: sent=${result.sent} skipped=${result.skipped}`);
      } catch (err) {
        console.error("[EmailMarketing] Daily bulk failed:", err);
      }
    }, { timezone: "Asia/Riyadh" });

    // Weekly interested collection: every Sunday at 10 AM
    cron.schedule("0 10 * * 0", async () => {
      console.log("[EmailMarketing] Running weekly interested collection...");
      try {
        const result = await runWeeklyInterestedCollection();
        console.log(`[EmailMarketing] Weekly done: newLeads=${result.newLeads} followUpSent=${result.followUpSent}`);
      } catch (err) {
        console.error("[EmailMarketing] Weekly collection failed:", err);
      }
    }, { timezone: "Asia/Riyadh" });

    console.log("[EmailMarketing] Cron jobs scheduled (daily 9AM + weekly Sunday 10AM, Riyadh time)");
  }).catch(() => {});

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  // 4. Vite / static LAST — so it only catches non-API requests (SPA fallback)
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Cron jobs
  const nodeCron = await import("node-cron");

  nodeCron.default.schedule("*/2 * * * *", async () => {
    try {
      const { QMeetingModel: QMF } = await import("./qmeet-db");
      const QMeetingModel = QMF();
      const { pushNotification } = await import("./ws");
      const now = new Date();
      const in5  = new Date(now.getTime() + 5  * 60 * 1000);
      const in15 = new Date(now.getTime() + 15 * 60 * 1000);
      const upcoming = await (QMeetingModel as any).find({
        status: "scheduled",
        reminderSent: { $ne: true },
        scheduledAt: { $gt: in5, $lte: in15 },
      });
      for (const meeting of upcoming) {
        const minutesLeft = Math.round((new Date(meeting.scheduledAt).getTime() - now.getTime()) / 60000);
        const payload = {
          title: `اجتماع قادم: ${meeting.title}`,
          body: `يبدأ خلال ${minutesLeft} دقيقة`,
          type: "meeting_reminder",
          link: `/meeting/${meeting.roomName}`,
          icon: "🎥",
        };
        if (meeting.hostId) pushNotification(String(meeting.hostId), payload);
        for (const pid of (meeting.participantIds || [])) {
          pushNotification(String(pid), payload);
        }
        await (QMeetingModel as any).findByIdAndUpdate(meeting._id, { reminderSent: true });
      }
    } catch (e: any) { console.error("[MeetingReminder] error:", e.message); }
  });

  nodeCron.default.schedule("0 8 * * *", async () => {
    try {
      const result = await runInstallmentLateCheck();
      console.log(`[Installment] Late check: locked=${result.locked}, penalized=${result.penalized}`);
    } catch (e: any) { console.error("[Installment] Late check error:", e.message); }
  });

  nodeCron.default.schedule("0 8 * * 0", async () => {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/api/internal/weekly-report`, { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await r.json() as any;
      console.log(`[WeeklyReport] Sent to ${data.sent} admins — ${data.weekLabel}`);
    } catch (e: any) { console.error("[WeeklyReport] error:", e.message); }
  });

  initCronJobs().catch(err => console.error("Cron init error:", err));
})();
