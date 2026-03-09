import mongoose from "mongoose";
import { connManager } from "./connection-manager";

export function getQMeetConnection(): mongoose.Connection {
  const conn = connManager.qmeetConn;
  if (conn) return conn;
  throw new Error("[QMeet-DB] Connection not initialized. Call connectToDatabase() first.");
}

function getModel<T>(name: string, schema: mongoose.Schema) {
  const conn = getQMeetConnection();
  return (conn.models[name] as mongoose.Model<T>) || conn.model<T>(name, schema);
}

// ── QMeeting ────────────────────────────────────────────────────────────────
const qMeetingSchema = new mongoose.Schema({
  title:          { type: String, required: true },
  description:    { type: String, default: "" },
  hostId:         { type: String, required: true },
  hostName:       { type: String, default: "" },
  scheduledAt:    { type: Date, required: true },
  endsAt:         Date,
  durationMinutes:{ type: Number, default: 60 },
  roomName:       { type: String, required: true, unique: true },
  meetingLink:    { type: String, required: true },
  type:           { type: String, enum: ["internal", "client_individual", "client_all", "consultation"], default: "client_individual" },
  participantIds: [String],
  participantEmails: [String],
  participantNames: [String],
  status:         { type: String, enum: ["scheduled", "live", "completed", "cancelled"], default: "scheduled" },
  consultationBookingId: { type: String, default: null },
  notes:          { type: String, default: "" },
  agenda:         [String],
  recordingUrl:   { type: String, default: "" },
  reminderSent:   { type: Boolean, default: false },
  reminder24hSent:{ type: Boolean, default: false },
  guestToken:     { type: String, default: null },
  joinCode:       { type: String, default: null },
  instantJoin:    { type: Boolean, default: false },
  joinRequests:   [{
    userId:      { type: String, required: true },
    userName:    { type: String, default: "" },
    userEmail:   { type: String, default: "" },
    status:      { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    requestedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });
qMeetingSchema.set("toJSON", { transform: (_, ret: any) => { ret.id = ret._id.toString(); return ret; } });

// ── QFeedback ────────────────────────────────────────────────────────────────
const qFeedbackSchema = new mongoose.Schema({
  meetingId:    { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  fromUserId:   { type: String, required: true },
  fromUserName: { type: String, default: "" },
  rating:       { type: Number, min: 1, max: 5, required: true },
  comment:      { type: String, default: "" },
}, { timestamps: true });
qFeedbackSchema.set("toJSON", { transform: (_, ret: any) => { ret.id = ret._id.toString(); return ret; } });

// ── QReport ──────────────────────────────────────────────────────────────────
const qReportSchema = new mongoose.Schema({
  meetingId:      { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  authorId:       { type: String, required: true },
  authorName:     { type: String, default: "" },
  summary:        { type: String, required: true },
  actionItems:    [String],
  attendeesCount: { type: Number, default: 0 },
  duration:       { type: Number, default: 0 },
  content:        { type: String, default: "" },
}, { timestamps: true });
qReportSchema.set("toJSON", { transform: (_, ret: any) => { ret.id = ret._id.toString(); return ret; } });

export const QMeetingModel = () => getModel("QMeeting", qMeetingSchema);
export const QFeedbackModel = () => getModel("QFeedback", qFeedbackSchema);
export const QReportModel = () => getModel("QReport", qReportSchema);
