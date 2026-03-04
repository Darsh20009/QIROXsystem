import { type Express } from "express";
import { QMeetingModel as _QM, QFeedbackModel as _QF, QReportModel as _QR } from "./qmeet-db";
import { sendQMeetReminderEmail, sendQMeetInviteEmail } from "./email";
import { pushToUser, broadcastToUsers } from "./ws";

function makeModelProxy<T>(factory: () => T): T {
  return new Proxy(function () {} as any, {
    get: (_t, p) => {
      const model = factory() as any;
      const val = model[p];
      return typeof val === "function" ? val.bind(model) : val;
    },
    construct: (_t, args) => {
      const model = factory() as any;
      return new model(...args);
    },
  }) as unknown as T;
}
const QMeetingModel = makeModelProxy(_QM);
const QFeedbackModel = makeModelProxy(_QF);
const QReportModel   = makeModelProxy(_QR);

const SITE_URL = process.env.EMAIL_SITE_URL || "https://qiroxstudio.online";
const fullMeetLink = (link: string) => link.startsWith("http") ? link : `${SITE_URL}${link}`;

// ── Room name generator ───────────────────────────────────────────────────────
function generateRoomName(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "qmeet-";
  for (let i = 0; i < 10; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

// ── Join code generator (6 alphanumeric uppercase) ───────────────────────────
function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── Smart scheduler: auto-status + reminders ──────────────────────────────────
export function startQMeetScheduler() {
  setInterval(async () => {
    try {
      const now = new Date();

      // 1. Auto-start: scheduled → live when scheduled time reached
      const toStart = await QMeetingModel.find({
        status: "scheduled",
        scheduledAt: { $lte: now },
      });
      for (const m of toStart) {
        await QMeetingModel.findByIdAndUpdate(m._id, { status: "live" });
        // Notify all participants via WebSocket
        const ids: string[] = (m.participantIds || []);
        if (ids.length) {
          broadcastToUsers(ids, {
            type: "qmeet_started",
            meetingId: String(m._id),
            title: m.title,
            meetingLink: m.meetingLink,
            message: `بدأ الاجتماع: ${m.title}`,
          });
        }
        console.log(`[QMeet] Auto-started meeting: ${m.title}`);
      }

      // 2. Auto-end: live → completed when duration exceeded
      const toEnd = await QMeetingModel.find({
        status: "live",
        endsAt: { $lte: now },
      });
      for (const m of toEnd) {
        await QMeetingModel.findByIdAndUpdate(m._id, { status: "completed" });
        const ids: string[] = (m.participantIds || []);
        if (ids.length) {
          broadcastToUsers(ids, {
            type: "qmeet_ended",
            meetingId: String(m._id),
            title: m.title,
            message: `انتهى الاجتماع: ${m.title}`,
          });
        }
        console.log(`[QMeet] Auto-ended meeting: ${m.title}`);
      }

      // 3. 2-min reminder emails
      const twoMin = new Date(now.getTime() + 2 * 60 * 1000);
      const threeMin = new Date(now.getTime() + 3 * 60 * 1000);
      const soonMeetings = await QMeetingModel.find({
        status: "scheduled",
        reminderSent: false,
        scheduledAt: { $gte: twoMin, $lte: threeMin },
      });
      for (const m of soonMeetings) {
        const emails: string[] = m.participantEmails || [];
        const names: string[] = m.participantNames || [];
        for (let i = 0; i < emails.length; i++) {
          await sendQMeetReminderEmail(emails[i], names[i] || "مشارك", {
            title: m.title,
            scheduledAt: m.scheduledAt,
            meetingLink: fullMeetLink(m.meetingLink),
            hostName: m.hostName,
          });
        }
        // Push WebSocket reminder
        const ids: string[] = (m.participantIds || []);
        if (ids.length) {
          broadcastToUsers(ids, {
            type: "qmeet_reminder",
            meetingId: String(m._id),
            title: m.title,
            meetingLink: m.meetingLink,
            message: `اجتماع "${m.title}" يبدأ بعد دقيقتين!`,
          });
        }
        await QMeetingModel.findByIdAndUpdate(m._id, { reminderSent: true });
        console.log(`[QMeet] Sent 2-min reminders for: ${m.title}`);
      }

      // 4. 24h reminder emails
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowPlus1h = new Date(now.getTime() + 25 * 60 * 60 * 1000);
      const tomorrowMeetings = await QMeetingModel.find({
        status: "scheduled",
        reminder24hSent: false,
        scheduledAt: { $gte: tomorrow, $lte: tomorrowPlus1h },
      });
      for (const m of tomorrowMeetings) {
        const emails: string[] = m.participantEmails || [];
        const names: string[] = m.participantNames || [];
        for (let i = 0; i < emails.length; i++) {
          await sendQMeetReminderEmail(emails[i], names[i] || "مشارك", {
            title: m.title,
            scheduledAt: m.scheduledAt,
            meetingLink: fullMeetLink(m.meetingLink),
            hostName: m.hostName,
          });
        }
        await QMeetingModel.findByIdAndUpdate(m._id, { reminder24hSent: true });
        console.log(`[QMeet] Sent 24h reminders for: ${m.title}`);
      }
    } catch (err) {
      console.error("[QMeet] Scheduler error:", err);
    }
  }, 60 * 1000); // Run every minute

  console.log("[QMeet] Smart scheduler started");
}

// ── Middleware ────────────────────────────────────────────────────────────────
const STAFF_ROLES = ["admin", "manager", "developer", "designer", "support", "sales_manager", "sales", "accountant", "merchant"];

function requireStaff(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "غير مصرح" });
  if (!STAFF_ROLES.includes(req.user?.role)) return res.status(403).json({ message: "للموظفين فقط" });
  next();
}

// Keep alias for backwards compat
const requireManagement = requireStaff;

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "غير مصرح" });
  next();
}

// ── Routes ────────────────────────────────────────────────────────────────────
export function registerQMeetRoutes(app: Express) {

  // GET /api/qmeet/meetings — list meetings
  app.get("/api/qmeet/meetings", requireAuth, async (req: any, res) => {
    try {
      const isManagement = ["admin", "manager"].includes(req.user.role);
      const userId = String(req.user._id || req.user.id);
      const { status, type } = req.query as any;
      const filter: any = isManagement ? {} : { participantIds: userId };
      if (status && status !== "all") filter.status = status;
      if (type && type !== "all") filter.type = type;
      const meetings = await QMeetingModel.find(filter).sort({ scheduledAt: -1 }).limit(200);
      res.json(meetings);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // GET /api/qmeet/room/:roomName — get meeting info by room name (for meeting room page)
  app.get("/api/qmeet/room/:roomName", requireAuth, async (req: any, res) => {
    try {
      const meeting = await QMeetingModel.findOne({ roomName: req.params.roomName });
      if (!meeting) return res.status(404).json({ message: "الاجتماع غير موجود" });
      res.json(meeting);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // GET /api/qmeet/meetings/:id
  app.get("/api/qmeet/meetings/:id", requireAuth, async (req: any, res) => {
    try {
      const meeting = await QMeetingModel.findById(req.params.id);
      if (!meeting) return res.status(404).json({ message: "الاجتماع غير موجود" });
      res.json(meeting);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // POST /api/qmeet/meetings — create meeting
  app.post("/api/qmeet/meetings", requireManagement, async (req: any, res) => {
    try {
      const {
        title, description, scheduledAt, durationMinutes,
        type, participantIds, participantEmails, participantNames,
        consultationBookingId, notes, agenda
      } = req.body;

      if (!title || !scheduledAt) return res.status(400).json({ message: "العنوان والتوقيت مطلوبان" });

      const roomName = generateRoomName();
      const meetingLink = `/meet/${roomName}`;
      const duration = parseInt(durationMinutes) || 60;
      const startTime = new Date(scheduledAt);
      const endsAt = new Date(startTime.getTime() + duration * 60 * 1000);

      const meeting = await QMeetingModel.create({
        title, description: description || "",
        hostId: String(req.user._id || req.user.id),
        hostName: req.user.fullName || req.user.username,
        scheduledAt: startTime,
        endsAt,
        durationMinutes: duration,
        roomName, meetingLink,
        type: type || "client_individual",
        participantIds: participantIds || [],
        participantEmails: participantEmails || [],
        participantNames: participantNames || [],
        consultationBookingId: consultationBookingId || null,
        notes: notes || "",
        agenda: agenda || [],
        joinCode: generateJoinCode(),
        joinRequests: [],
      });

      // Send invite emails (non-blocking)
      const emails: string[] = participantEmails || [];
      const names: string[] = participantNames || [];
      Promise.all(emails.map((email, i) =>
        sendQMeetInviteEmail(email, names[i] || "مشارك", {
          title, scheduledAt: startTime, meetingLink: fullMeetLink(meetingLink),
          hostName: req.user.fullName || req.user.username,
          durationMinutes: duration,
        })
      )).catch(e => console.error("[QMeet] Email error:", e));

      // Notify participants via WebSocket
      const ids: string[] = participantIds || [];
      if (ids.length) {
        broadcastToUsers(ids, {
          type: "qmeet_invited",
          meetingId: String(meeting._id),
          title,
          scheduledAt: startTime.toISOString(),
          meetingLink,
          message: `دعوة اجتماع: ${title}`,
        });
      }

      res.status(201).json(meeting);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // PATCH /api/qmeet/meetings/:id — update meeting
  app.patch("/api/qmeet/meetings/:id", requireManagement, async (req: any, res) => {
    try {
      const allowed = ["title", "description", "scheduledAt", "durationMinutes", "type",
        "participantIds", "participantEmails", "participantNames",
        "status", "notes", "reminderSent", "agenda", "recordingUrl"];
      const update: Record<string, any> = {};
      for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];

      // Recompute endsAt if scheduledAt or duration changes
      if (update.scheduledAt || update.durationMinutes) {
        const existing = await QMeetingModel.findById(req.params.id);
        if (existing) {
          const start = update.scheduledAt ? new Date(update.scheduledAt) : existing.scheduledAt;
          const dur = update.durationMinutes || existing.durationMinutes;
          update.endsAt = new Date(start.getTime() + dur * 60 * 1000);
        }
      }

      const meeting = await QMeetingModel.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!meeting) return res.status(404).json({ message: "الاجتماع غير موجود" });

      // Notify if status changed to live or completed
      if (update.status === "live") {
        const ids: string[] = (meeting.participantIds || []);
        if (ids.length) broadcastToUsers(ids, { type: "qmeet_started", meetingId: req.params.id, title: meeting.title, meetingLink: meeting.meetingLink, message: `بدأ الاجتماع: ${meeting.title}` });
      } else if (update.status === "completed") {
        const ids: string[] = (meeting.participantIds || []);
        if (ids.length) broadcastToUsers(ids, { type: "qmeet_ended", meetingId: req.params.id, title: meeting.title, message: `انتهى الاجتماع: ${meeting.title}` });
      } else if (update.status === "cancelled") {
        const ids: string[] = (meeting.participantIds || []);
        if (ids.length) broadcastToUsers(ids, { type: "qmeet_cancelled", meetingId: req.params.id, title: meeting.title, message: `تم إلغاء الاجتماع: ${meeting.title}` });
      }

      res.json(meeting);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // DELETE /api/qmeet/meetings/:id
  app.delete("/api/qmeet/meetings/:id", requireManagement, async (req, res) => {
    try {
      await QMeetingModel.findByIdAndDelete(req.params.id);
      await QFeedbackModel.deleteMany({ meetingId: req.params.id });
      await QReportModel.deleteMany({ meetingId: req.params.id });
      res.json({ message: "تم الحذف" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // POST /api/qmeet/meetings/:id/send-invites
  app.post("/api/qmeet/meetings/:id/send-invites", requireManagement, async (req: any, res) => {
    try {
      const meeting = await QMeetingModel.findById(req.params.id);
      if (!meeting) return res.status(404).json({ message: "الاجتماع غير موجود" });
      const emails: string[] = meeting.participantEmails || [];
      const names: string[] = meeting.participantNames || [];
      let sent = 0;
      for (let i = 0; i < emails.length; i++) {
        const ok = await sendQMeetInviteEmail(emails[i], names[i] || "مشارك", {
          title: meeting.title,
          scheduledAt: meeting.scheduledAt,
          meetingLink: fullMeetLink(meeting.meetingLink),
          hostName: meeting.hostName,
          durationMinutes: meeting.durationMinutes,
        });
        if (ok) sent++;
      }
      // WebSocket nudge
      const ids: string[] = (meeting.participantIds || []);
      if (ids.length) broadcastToUsers(ids, { type: "qmeet_invited", meetingId: req.params.id, title: meeting.title, scheduledAt: meeting.scheduledAt, meetingLink: meeting.meetingLink, message: `دعوة اجتماع: ${meeting.title}` });

      res.json({ sent, total: emails.length });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Feedback ──────────────────────────────────────────────────────────────

  app.get("/api/qmeet/meetings/:id/feedback", requireAuth, async (req, res) => {
    try {
      const items = await QFeedbackModel.find({ meetingId: req.params.id }).sort({ createdAt: -1 });
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/qmeet/meetings/:id/feedback", requireAuth, async (req: any, res) => {
    try {
      const { rating, comment } = req.body;
      if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: "التقييم مطلوب (1-5)" });
      const uid = String(req.user._id || req.user.id);
      const existing = await QFeedbackModel.findOne({ meetingId: req.params.id, fromUserId: uid });
      if (existing) return res.status(400).json({ message: "سبق تقديم تقييمك" });
      const fb = await QFeedbackModel.create({
        meetingId: req.params.id,
        fromUserId: uid,
        fromUserName: req.user.fullName || req.user.username,
        rating, comment: comment || "",
      });
      res.status(201).json(fb);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Reports ───────────────────────────────────────────────────────────────

  app.get("/api/qmeet/meetings/:id/reports", requireAuth, async (req, res) => {
    try {
      const items = await QReportModel.find({ meetingId: req.params.id }).sort({ createdAt: -1 });
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/qmeet/meetings/:id/reports", requireAuth, async (req: any, res) => {
    try {
      const { summary, actionItems, attendeesCount, duration, content } = req.body;
      if (!summary) return res.status(400).json({ message: "ملخص التقرير مطلوب" });
      const uid = String(req.user._id || req.user.id);
      const report = await QReportModel.create({
        meetingId: req.params.id,
        authorId: uid,
        authorName: req.user.fullName || req.user.username,
        summary, actionItems: actionItems || [],
        attendeesCount: attendeesCount || 0,
        duration: duration || 0,
        content: content || "",
      });
      res.status(201).json(report);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/qmeet/reports/:id", requireManagement, async (req, res) => {
    try {
      await QReportModel.findByIdAndDelete(req.params.id);
      res.json({ message: "تم حذف التقرير" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Join by code: find meeting ──────────────────────────────────────────────

  app.get("/api/qmeet/by-code/:code", requireAuth, async (req: any, res) => {
    try {
      const code = String(req.params.code).toUpperCase().trim();
      const meeting = await QMeetingModel.findOne({ joinCode: code });
      if (!meeting) return res.status(404).json({ message: "كود الاجتماع غير صحيح أو منتهي الصلاحية" });
      if (meeting.status === "completed" || meeting.status === "cancelled") {
        return res.status(410).json({ message: "الاجتماع منتهٍ أو ملغى" });
      }
      res.json({
        id: meeting._id,
        title: meeting.title,
        hostName: meeting.hostName,
        scheduledAt: meeting.scheduledAt,
        status: meeting.status,
        durationMinutes: meeting.durationMinutes,
        type: meeting.type,
        joinCode: meeting.joinCode,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Request to join by code ────────────────────────────────────────────────

  app.post("/api/qmeet/by-code/:code/request", requireAuth, async (req: any, res) => {
    try {
      const code = String(req.params.code).toUpperCase().trim();
      const meeting = await QMeetingModel.findOne({ joinCode: code });
      if (!meeting) return res.status(404).json({ message: "كود غير صحيح" });
      if (meeting.status === "completed" || meeting.status === "cancelled") {
        return res.status(410).json({ message: "الاجتماع منتهٍ" });
      }

      const userId = String(req.user._id || req.user.id);
      const userName = req.user.fullName || req.user.username || "مشارك";
      const userEmail = req.user.email || "";

      const joinRequests: any[] = meeting.joinRequests || [];

      // Check if already approved (participant)
      if ((meeting.participantIds || []).includes(userId)) {
        return res.json({ status: "approved", meetingLink: meeting.meetingLink });
      }

      // Check existing request
      const existing = joinRequests.find((r: any) => String(r.userId) === userId);
      if (existing) {
        if (existing.status === "approved") return res.json({ status: "approved", meetingLink: meeting.meetingLink });
        if (existing.status === "pending") return res.json({ status: "pending" });
        if (existing.status === "rejected") return res.status(403).json({ message: "تم رفض طلبك من قِبل المضيف" });
      }

      // Add new request
      await QMeetingModel.findByIdAndUpdate(meeting._id, {
        $push: { joinRequests: { userId, userName, userEmail, status: "pending", requestedAt: new Date() } }
      });

      // Notify host via WebSocket
      pushToUser(meeting.hostId, {
        type: "qmeet_join_request",
        meetingId: String(meeting._id),
        meetingTitle: meeting.title,
        userId,
        userName,
        userEmail,
        message: `${userName} يطلب الانضمام إلى الاجتماع: ${meeting.title}`,
      });

      res.json({ status: "pending" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Approve or reject a join request ──────────────────────────────────────

  app.patch("/api/qmeet/meetings/:id/join-requests/:reqId", requireAuth, async (req: any, res) => {
    try {
      const { action } = req.body; // "approve" | "reject"
      if (!["approve", "reject"].includes(action)) return res.status(400).json({ message: "إجراء غير صالح" });

      const meeting = await QMeetingModel.findById(req.params.id);
      if (!meeting) return res.status(404).json({ message: "الاجتماع غير موجود" });

      const hostId = meeting.hostId;
      const callerId = String(req.user._id || req.user.id);
      const isAdmin = ["admin", "manager"].includes(req.user?.role);
      if (callerId !== hostId && !isAdmin) return res.status(403).json({ message: "للمضيف فقط" });

      const joinRequests: any[] = meeting.joinRequests || [];
      const reqId = req.params.reqId;
      const reqIdx = joinRequests.findIndex((r: any) =>
        String(r._id) === reqId || String(r.userId) === reqId
      );
      if (reqIdx === -1) return res.status(404).json({ message: "الطلب غير موجود" });

      const joinReq = joinRequests[reqIdx];
      const newStatus = action === "approve" ? "approved" : "rejected";

      const update: any = { [`joinRequests.${reqIdx}.status`]: newStatus };

      if (action === "approve") {
        // Add user to participants
        update["$addToSet"] = { participantIds: joinReq.userId };
        if (joinReq.userEmail) update["$addToSet"].participantEmails = joinReq.userEmail;
        if (joinReq.userName) update["$addToSet"].participantNames = joinReq.userName;
      }

      await QMeetingModel.findByIdAndUpdate(meeting._id, {
        $set: { [`joinRequests.${reqIdx}.status`]: newStatus },
        ...(action === "approve" ? {
          $addToSet: {
            participantIds: joinReq.userId,
            participantEmails: joinReq.userEmail,
            participantNames: joinReq.userName,
          }
        } : {}),
      });

      // Notify the requester via WebSocket
      pushToUser(joinReq.userId, {
        type: "qmeet_join_response",
        approved: action === "approve",
        meetingId: String(meeting._id),
        meetingTitle: meeting.title,
        meetingLink: meeting.meetingLink,
        message: action === "approve"
          ? `تمت الموافقة على انضمامك لـ "${meeting.title}"`
          : `تم رفض طلب انضمامك لـ "${meeting.title}"`,
      });

      res.json({ success: true, status: newStatus });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Get join requests for a meeting (host only) ────────────────────────────

  app.get("/api/qmeet/meetings/:id/join-requests", requireAuth, async (req: any, res) => {
    try {
      const meeting = await QMeetingModel.findById(req.params.id);
      if (!meeting) return res.status(404).json({ message: "الاجتماع غير موجود" });
      const callerId = String(req.user._id || req.user.id);
      const isAdmin = ["admin", "manager"].includes(req.user?.role);
      if (callerId !== meeting.hostId && !isAdmin) return res.status(403).json({ message: "للمضيف فقط" });
      res.json(meeting.joinRequests || []);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Check my join request status ──────────────────────────────────────────

  app.get("/api/qmeet/by-code/:code/my-status", requireAuth, async (req: any, res) => {
    try {
      const code = String(req.params.code).toUpperCase().trim();
      const meeting = await QMeetingModel.findOne({ joinCode: code });
      if (!meeting) return res.status(404).json({ message: "كود غير صحيح" });
      const userId = String(req.user._id || req.user.id);
      if ((meeting.participantIds || []).includes(userId)) {
        return res.json({ status: "approved", meetingLink: meeting.meetingLink });
      }
      const joinRequests: any[] = meeting.joinRequests || [];
      const req_ = joinRequests.find((r: any) => String(r.userId) === userId);
      if (!req_) return res.json({ status: "none" });
      res.json({ status: req_.status, meetingLink: req_.status === "approved" ? meeting.meetingLink : null });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Stats ─────────────────────────────────────────────────────────────────

  app.get("/api/qmeet/stats", requireManagement, async (_req, res) => {
    try {
      const [total, scheduled, live, completed, cancelled, feedbackCount, reportCount, feedbacks] = await Promise.all([
        QMeetingModel.countDocuments(),
        QMeetingModel.countDocuments({ status: "scheduled" }),
        QMeetingModel.countDocuments({ status: "live" }),
        QMeetingModel.countDocuments({ status: "completed" }),
        QMeetingModel.countDocuments({ status: "cancelled" }),
        QFeedbackModel.countDocuments(),
        QReportModel.countDocuments(),
        QFeedbackModel.find({}, { rating: 1 }),
      ]);
      const avgRating = feedbacks.length
        ? (feedbacks.reduce((s: number, f: any) => s + f.rating, 0) / feedbacks.length).toFixed(1)
        : "0";
      res.json({ total, scheduled, live, completed, cancelled, feedbackCount, reportCount, avgRating });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Clients list for participant picker ───────────────────────────────────

  app.get("/api/qmeet/clients", requireManagement, async (_req, res) => {
    try {
      const { UserModel } = await import("./models");
      const clients = await UserModel.find(
        {},
        { _id: 1, fullName: 1, email: 1, username: 1, role: 1, avatarUrl: 1 }
      ).limit(500);
      res.json(clients);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Upcoming meetings for a user ──────────────────────────────────────────

  app.get("/api/qmeet/upcoming", requireAuth, async (req: any, res) => {
    try {
      const uid = String(req.user._id || req.user.id);
      const isManagement = ["admin", "manager"].includes(req.user.role);
      const filter: any = isManagement
        ? { status: { $in: ["scheduled", "live"] } }
        : { participantIds: uid, status: { $in: ["scheduled", "live"] } };
      const meetings = await QMeetingModel.find(filter).sort({ scheduledAt: 1 }).limit(5);
      res.json(meetings);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  console.log("[QMeet] Routes registered (main MongoDB)");
}
