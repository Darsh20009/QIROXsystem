import mongoose from "mongoose";

let qmeetConn: mongoose.Connection | null = null;

export function getQMeetConnection(): mongoose.Connection {
  if (qmeetConn) return qmeetConn;
  const uri = process.env.MONGODB_URI!;
  const qmeetUri = uri.replace(/\/([^/?]+)(\?|$)/, "/qmeet_db$2");
  qmeetConn = mongoose.createConnection(qmeetUri);
  qmeetConn.on("connected", () => console.log("[QMeet-DB] Connected to qmeet_db"));
  qmeetConn.on("error", (e) => console.error("[QMeet-DB] Error:", e.message));
  return qmeetConn;
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
