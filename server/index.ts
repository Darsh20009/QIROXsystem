import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes, registerInstallmentRoutes, runInstallmentLateCheck } from "./routes";
import { registerAiRoutes } from "./ai";
import { serveStatic } from "./static";
import { createServer } from "http";
import { connectToDatabase } from "./db";
import { WebSocketServer } from "ws";
import { registerSocket, unregisterSocket, pushToUser, getOnlineUsers, joinMeetRoom, leaveMeetRoom, getMeetRoomPeers, getMeetRoomPeerInfo, leaveAllMeetRooms, subscribeSandboxLogs, unsubscribeSandboxLogs } from "./ws";
import { initCronJobs } from "./cron";
import { startQMeetScheduler, registerQMeetRoutes } from "./qmeet";
import { registerSandboxRoutes } from "./sandbox-routes";
import mongoose from "mongoose";
import { cache } from "./cache";
import { connManager } from "./connection-manager";

const app = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

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
          // ── Lobby enforcement ─────────────────────────────────────────────
          try {
            const { QMeetingModel: QMF } = await import("./qmeet-db");
            const meeting = await QMF().findOne({ roomName: rId });
            if (meeting && meeting.lobbyEnabled) {
              const inParticipants = (meeting.participantIds || []).some((id: any) => String(id) === uid);
              const isHostUser = String(meeting.hostId) === uid;
              if (!inParticipants && !isHostUser) {
                // Save join request if not already pending
                const existing = (meeting.joinRequests || []).find((r: any) => String(r.userId) === uid && r.status === "pending");
                if (!existing) {
                  await QMF().findByIdAndUpdate(meeting._id, {
                    $push: { joinRequests: { userId: uid, userName: msg.name || uid, userEmail: "", userPhone: "", status: "pending", requestedAt: new Date() } }
                  });
                }
                // Tell user they're in the lobby
                ws.send(JSON.stringify({ type: "webrtc_lobby_waiting", roomId: rId, meetingId: String(meeting._id), meetingTitle: meeting.title }));
                // Notify host
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
            const remaining = leaveMeetRoom(currentRoomId, uid);
            for (const peerId of remaining) {
              pushToUser(peerId, { type: "webrtc_peer_left", peerId: uid, roomId: currentRoomId });
            }
          }
          currentRoomId = rId;
          const existingPeers = joinMeetRoom(currentRoomId, uid, msg.name || uid, msg.photoUrl || "");
          const peerInfoList = getMeetRoomPeerInfo(currentRoomId).filter(p => p.userId !== uid);
          ws.send(JSON.stringify({ type: "webrtc_peers", peers: existingPeers, peerInfoList, roomId: currentRoomId }));
          for (const peerId of existingPeers) {
            pushToUser(peerId, { type: "webrtc_peer_joined", peerId: uid, name: msg.name || uid, photoUrl: msg.photoUrl || "", roomId: currentRoomId });
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
        const remaining = leaveMeetRoom(String(msg.roomId), userId);
        for (const peerId of remaining) {
          pushToUser(peerId, { type: "webrtc_peer_left", peerId: userId, roomId: msg.roomId });
        }
        currentRoomId = null;
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
            pushToUser(peerId, { type: "webrtc_media_state", from: userId, audio: msg.audio, video: msg.video });
          }
        }
        return;
      }

      if (msg.type === "webrtc_kick" && msg.roomId && msg.targetId) {
        pushToUser(String(msg.targetId), { type: "webrtc_kicked", roomId: msg.roomId, by: userId });
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
    } catch {}
  });

  ws.on("close", () => {
    if (userId) {
      unregisterSocket(userId, ws);
      if (currentRoomId) {
        const remaining = leaveMeetRoom(currentRoomId, userId);
        for (const peerId of remaining) {
          pushToUser(peerId, { type: "webrtc_peer_left", peerId: userId, roomId: currentRoomId });
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

(async () => {
  await connectToDatabase();
  await registerRoutes(httpServer, app);
  registerQMeetRoutes(app);
  startQMeetScheduler();
  await registerInstallmentRoutes(app);
  registerAiRoutes(app);
  registerSandboxRoutes(app, httpServer);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Daily installment late-payment check at 8 AM
  const nodeCron = await import("node-cron");
  nodeCron.default.schedule("0 8 * * *", async () => {
    try {
      const result = await runInstallmentLateCheck();
      console.log(`[Installment] Late check: locked=${result.locked}, penalized=${result.penalized}`);
    } catch (e: any) { console.error("[Installment] Late check error:", e.message); }
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen({ port, host: "0.0.0.0" }, () => {
    log(`serving on port ${port}`);
    initCronJobs().catch(err => console.error("Cron init error:", err));
  });

  function gracefulShutdown(signal: string) {
    console.log(`\n[Shutdown] ${signal} received — shutting down gracefully...`);
    import("./sandbox-runner").then(({ stopAllProcesses }) => stopAllProcesses()).catch(() => {});
    httpServer.close(() => {
      console.log("[Shutdown] HTTP server closed");
      mongoose.connection.close().then(() => {
        console.log("[Shutdown] MongoDB connections closed");
        cache.destroy();
        process.exit(0);
      }).catch(() => {
        process.exit(1);
      });
    });

    setTimeout(() => {
      console.error("[Shutdown] Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  }

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
})();
