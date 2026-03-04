import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { connectToDatabase } from "./db";
import { WebSocketServer } from "ws";
import { registerSocket, unregisterSocket, pushToUser, getOnlineUsers } from "./ws";
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

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === "auth" && msg.userId) {
        userId = String(msg.userId);
        registerSocket(userId, ws);
        // Send current online users to the newly connected client
        ws.send(JSON.stringify({ type: "online_users", users: getOnlineUsers() }));
        return;
      }

      if (!userId) return;

      // Typing indicator: forward to the recipient
      if (msg.type === "typing" && msg.toUserId) {
        pushToUser(String(msg.toUserId), {
          type: "typing",
          fromUserId: userId,
          isTyping: msg.isTyping,
        });
        return;
      }

      // Voice recording indicator: forward to recipient
      if (msg.type === "voice_recording" && msg.toUserId) {
        pushToUser(String(msg.toUserId), {
          type: "voice_recording",
          fromUserId: userId,
          isRecording: msg.isRecording,
        });
        return;
      }

      // Ping/pong for keepalive
      if (msg.type === "ping") {
        ws.send(JSON.stringify({ type: "pong" }));
        return;
      }
    } catch {}
  });

  ws.on("close", () => {
    if (userId) unregisterSocket(userId, ws);
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

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`serving on port ${port}`);
    initCronJobs().catch(err => console.error("Cron init error:", err));
  });
})();
