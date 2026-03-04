import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes, registerInstallmentRoutes, runInstallmentLateCheck } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { connectToDatabase } from "./db";
import { WebSocketServer } from "ws";
import { registerSocket, unregisterSocket, pushToUser, getOnlineUsers, joinMeetRoom, leaveMeetRoom, getMeetRoomPeers, getMeetRoomPeerInfo, leaveAllMeetRooms } from "./ws";
import { initCronJobs } from "./cron";
import { startQMeetScheduler, registerQMeetRoutes } from "./qmeet";

const app = express();
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

      // ── WebRTC Meet Signaling ───────────────────────────────────────────────
      if (msg.type === "webrtc_join" && msg.roomId) {
        if (currentRoomId && currentRoomId !== msg.roomId) {
          const remaining = leaveMeetRoom(currentRoomId, userId);
          for (const peerId of remaining) {
            pushToUser(peerId, { type: "webrtc_peer_left", peerId: userId, roomId: currentRoomId });
          }
        }
        currentRoomId = String(msg.roomId);
        const existingPeers = joinMeetRoom(currentRoomId, userId, msg.name || userId);
        ws.send(JSON.stringify({ type: "webrtc_peers", peers: existingPeers, roomId: currentRoomId }));
        for (const peerId of existingPeers) {
          pushToUser(peerId, { type: "webrtc_peer_joined", peerId: userId, name: msg.name || userId, roomId: currentRoomId });
        }
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
})();
