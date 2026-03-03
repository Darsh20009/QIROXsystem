import mongoose from "mongoose";
import { type Express } from "express";
import { type Server } from "http";
import { sendQMeetReminderEmail, sendQMeetInviteEmail } from "./email";

const QMEET_URI = process.env.QMEET_MONGODB_URI || "mongodb+srv://Qmeet:ASDqwe123@cluster0.ul0t5m5.mongodb.net/?appName=Cluster0";

let qmeetConn: mongoose.Connection | null = null;

export async function connectQMeetDB() {
  try {
    qmeetConn = mongoose.createConnection(QMEET_URI);
    await qmeetConn.asPromise();
    console.log("[QMeet] Connected to QMeet MongoDB");
    startReminderScheduler();
  } catch (err) {
    console.error("[QMeet] Failed to connect to QMeet MongoDB:", err);
  }
}

function getConn(): mongoose.Connection {
  if (!qmeetConn) throw new Error("QMeet DB not connected");
  return qmeetConn;
}

// ── Schemas ────────────────────────────────────────────────────────────
const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  hostId: { type: String, required: true },
  hostName: { type: String, required: true },
  scheduledAt: { type: Date, required: true },
  durationMinutes: { type: Number, default: 60 },
  roomName: { type: String, required: true, unique: true },
  meetingLink: { type: String, required: true },
  type: { type: String, enum: ["internal", "client_individual", "client_all", "consultation"], default: "client_individual" },
  participantIds: [String],
  participantEmails: [String],
  participantNames: [String],
  consultationBookingId: { type: String, default: null },
  status: { type: String, enum: ["scheduled", "live", "completed", "cancelled"], default: "scheduled" },
  reminderSent: { type: Boolean, default: false },
  notes: { type: String, default: "" },
}, { timestamps: true });

const feedbackSchema = new mongoose.Schema({
  meetingId: { type: String, required: true, index: true },
  fromUserId: { type: String, required: true },
  fromUserName: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: "" },
}, { timestamps: true });

const reportSchema = new mongoose.Schema({
  meetingId: { type: String, required: true, index: true },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  summary: { type: String, required: true },
  actionItems: [String],
  attendeesCount: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  content: { type: String, default: "" },
}, { timestamps: true });

function MeetingModel() {
  const conn = getConn();
  return conn.models.QMeeting || conn.model("QMeeting", meetingSchema);
}

function FeedbackModel() {
  const conn = getConn();
  return conn.models.QFeedback || conn.model("QFeedback", feedbackSchema);
}

function ReportModel() {
  const conn = getConn();
  return conn.models.QReport || conn.model("QReport", reportSchema);
}

// ── Room name generator ────────────────────────────────────────────────
function generateRoomName(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "qmeet-";
  for (let i = 0; i < 10; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

// ── 2-minute reminder scheduler ────────────────────────────────────────
function startReminderScheduler() {
  setInterval(async () => {
    try {
      const Meetings = MeetingModel();
      const now = new Date();
      const twoMinutesLater = new Date(now.getTime() + 2 * 60 * 1000);
      const threeMinutesLater = new Date(now.getTime() + 3 * 60 * 1000);

      const upcoming = await Meetings.find({
        status: "scheduled",
        reminderSent: false,
        scheduledAt: { $gte: twoMinutesLater, $lte: threeMinutesLater },
      });

      for (const meeting of upcoming) {
        const emails: string[] = meeting.participantEmails || [];
        const names: string[] = meeting.participantNames || [];
        for (let i = 0; i < emails.length; i++) {
          const name = names[i] || "مشارك";
          await sendQMeetReminderEmail(emails[i], name, {
            title: meeting.title,
            scheduledAt: meeting.scheduledAt,
            meetingLink: meeting.meetingLink,
            hostName: meeting.hostName,
          });
        }
        await Meetings.findByIdAndUpdate(meeting._id, { reminderSent: true });
        console.log(`[QMeet] Sent reminders for meeting: ${meeting.title}`);
      }
    } catch (err) {
      console.error("[QMeet] Reminder scheduler error:", err);
    }
  }, 60 * 1000);
}

// ── Auth middleware ────────────────────────────────────────────────────
function requireManagement(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "غير مصرح" });
  if (!["admin", "manager"].includes(req.user?.role)) return res.status(403).json({ message: "للإدارة فقط" });
  next();
}

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "غير مصرح" });
  next();
}

// ── Routes ─────────────────────────────────────────────────────────────
export function registerQMeetRoutes(app: Express) {

  // Get all meetings (management sees all, others see meetings they're in)
  app.get("/api/qmeet/meetings", requireAuth, async (req: any, res) => {
    try {
      const Meetings = MeetingModel();
      const isManagement = ["admin", "manager"].includes(req.user.role);
      const userId = String(req.user._id);
      const filter = isManagement ? {} : { participantIds: userId };
      const meetings = await Meetings.find(filter).sort({ scheduledAt: -1 }).limit(100);
      res.json(meetings);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Get single meeting
  app.get("/api/qmeet/meetings/:id", requireAuth, async (req: any, res) => {
    try {
      const Meetings = MeetingModel();
      const meeting = await Meetings.findById(req.params.id);
      if (!meeting) return res.status(404).json({ message: "الاجتماع غير موجود" });
      res.json(meeting);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Create meeting
  app.post("/api/qmeet/meetings", requireManagement, async (req: any, res) => {
    try {
      const Meetings = MeetingModel();
      const roomName = generateRoomName();
      const meetingLink = `https://meet.jit.si/${roomName}`;

      const {
        title, description, scheduledAt, durationMinutes,
        type, participantIds, participantEmails, participantNames,
        consultationBookingId, notes
      } = req.body;

      if (!title || !scheduledAt) return res.status(400).json({ message: "العنوان والتوقيت مطلوبان" });

      const meeting = await Meetings.create({
        title,
        description: description || "",
        hostId: String(req.user._id),
        hostName: req.user.fullName || req.user.username,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: durationMinutes || 60,
        roomName,
        meetingLink,
        type: type || "client_individual",
        participantIds: participantIds || [],
        participantEmails: participantEmails || [],
        participantNames: participantNames || [],
        consultationBookingId: consultationBookingId || null,
        notes: notes || "",
      });

      // Send invites immediately
      const emails: string[] = participantEmails || [];
      const names: string[] = participantNames || [];
      for (let i = 0; i < emails.length; i++) {
        const name = names[i] || "مشارك";
        await sendQMeetInviteEmail(emails[i], name, {
          title,
          scheduledAt: new Date(scheduledAt),
          meetingLink,
          hostName: req.user.fullName || req.user.username,
          durationMinutes: durationMinutes || 60,
        });
      }

      res.status(201).json(meeting);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Update meeting
  app.patch("/api/qmeet/meetings/:id", requireManagement, async (req: any, res) => {
    try {
      const Meetings = MeetingModel();
      const allowed = ["title", "description", "scheduledAt", "durationMinutes", "type", "participantIds", "participantEmails", "participantNames", "status", "notes", "reminderSent"];
      const update: Record<string, any> = {};
      for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];
      const meeting = await Meetings.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!meeting) return res.status(404).json({ message: "الاجتماع غير موجود" });
      res.json(meeting);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Delete meeting
  app.delete("/api/qmeet/meetings/:id", requireManagement, async (req: any, res) => {
    try {
      const Meetings = MeetingModel();
      await Meetings.findByIdAndDelete(req.params.id);
      const Feedback = FeedbackModel();
      const Reports = ReportModel();
      await Feedback.deleteMany({ meetingId: req.params.id });
      await Reports.deleteMany({ meetingId: req.params.id });
      res.json({ message: "تم الحذف" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Send invites for a meeting
  app.post("/api/qmeet/meetings/:id/send-invites", requireManagement, async (req: any, res) => {
    try {
      const Meetings = MeetingModel();
      const meeting = await Meetings.findById(req.params.id);
      if (!meeting) return res.status(404).json({ message: "الاجتماع غير موجود" });

      const emails: string[] = meeting.participantEmails || [];
      const names: string[] = meeting.participantNames || [];
      let sent = 0;
      for (let i = 0; i < emails.length; i++) {
        const ok = await sendQMeetInviteEmail(emails[i], names[i] || "مشارك", {
          title: meeting.title,
          scheduledAt: meeting.scheduledAt,
          meetingLink: meeting.meetingLink,
          hostName: meeting.hostName,
          durationMinutes: meeting.durationMinutes,
        });
        if (ok) sent++;
      }
      res.json({ sent, total: emails.length });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Feedback ────────────────────────────────────────────────────────
  app.get("/api/qmeet/meetings/:id/feedback", requireAuth, async (req, res) => {
    try {
      const Feedback = FeedbackModel();
      const items = await Feedback.find({ meetingId: req.params.id }).sort({ createdAt: -1 });
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/qmeet/meetings/:id/feedback", requireAuth, async (req: any, res) => {
    try {
      const Feedback = FeedbackModel();
      const { rating, comment } = req.body;
      if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: "التقييم مطلوب (1-5)" });
      const existing = await Feedback.findOne({ meetingId: req.params.id, fromUserId: String(req.user._id) });
      if (existing) return res.status(400).json({ message: "سبق تقديم تقييمك" });
      const fb = await Feedback.create({
        meetingId: req.params.id,
        fromUserId: String(req.user._id),
        fromUserName: req.user.fullName || req.user.username,
        rating,
        comment: comment || "",
      });
      res.status(201).json(fb);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Reports ─────────────────────────────────────────────────────────
  app.get("/api/qmeet/meetings/:id/reports", requireAuth, async (req, res) => {
    try {
      const Reports = ReportModel();
      const items = await Reports.find({ meetingId: req.params.id }).sort({ createdAt: -1 });
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/qmeet/meetings/:id/reports", requireAuth, async (req: any, res) => {
    try {
      const Reports = ReportModel();
      const { summary, actionItems, attendeesCount, duration, content } = req.body;
      if (!summary) return res.status(400).json({ message: "ملخص التقرير مطلوب" });
      const report = await Reports.create({
        meetingId: req.params.id,
        authorId: String(req.user._id),
        authorName: req.user.fullName || req.user.username,
        summary,
        actionItems: actionItems || [],
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
      const Reports = ReportModel();
      await Reports.findByIdAndDelete(req.params.id);
      res.json({ message: "تم حذف التقرير" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Stats ────────────────────────────────────────────────────────────
  app.get("/api/qmeet/stats", requireManagement, async (_req, res) => {
    try {
      const Meetings = MeetingModel();
      const Feedback = FeedbackModel();
      const Reports = ReportModel();

      const [total, scheduled, completed, cancelled, feedbackCount, reportCount] = await Promise.all([
        Meetings.countDocuments(),
        Meetings.countDocuments({ status: "scheduled" }),
        Meetings.countDocuments({ status: "completed" }),
        Meetings.countDocuments({ status: "cancelled" }),
        Feedback.countDocuments(),
        Reports.countDocuments(),
      ]);

      const feedbacks = await Feedback.find({}, { rating: 1 });
      const avgRating = feedbacks.length
        ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
        : "0";

      res.json({ total, scheduled, completed, cancelled, feedbackCount, reportCount, avgRating });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Get all clients for participant selection ───────────────────────
  app.get("/api/qmeet/clients", requireManagement, async (_req, res) => {
    try {
      const UserModel = mongoose.models.User || mongoose.model("User");
      const clients = await UserModel.find({ role: "client" }, { _id: 1, fullName: 1, email: 1, username: 1 }).limit(200);
      res.json(clients);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  console.log("[QMeet] Routes registered");
}
