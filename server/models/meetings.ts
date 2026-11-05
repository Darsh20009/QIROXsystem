import mongoose from "mongoose";
import { transform } from "./utils";

const consultationSlotSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employeeName: { type: String, required: true },
  title: { type: String, required: true },
  titleAr: { type: String, required: true },
  description: String,
  daysOfWeek: [{ type: Number }],
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  slotDurationMinutes: { type: Number, default: 30 },
  maxBookingsPerSlot: { type: Number, default: 1 },
  price: { type: Number, default: 0 },
  currency: { type: String, default: 'SAR' },
  isActive: { type: Boolean, default: true },
  consultationType: { type: String, enum: ['video', 'phone', 'in_person', 'any'], default: 'any' },
  color: { type: String, default: '#000000' },
  validFrom: Date,
  validUntil: Date,
}, { timestamps: true });
consultationSlotSchema.set('toJSON', { transform });
consultationSlotSchema.set('toObject', { transform });
export const ConsultationSlotModel = mongoose.models.ConsultationSlot || mongoose.model("ConsultationSlot", consultationSlotSchema);

const consultationBookingSchema = new mongoose.Schema({
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'ConsultationSlot' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  clientName: { type: String, required: true },
  clientEmail: { type: String, default: "" },
  clientPhone: String,
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  employeeName: String,
  date: Date,
  startTime: String,
  endTime: String,
  status: { type: String, enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'], default: 'pending' },
  consultationType: { type: String, enum: ['video', 'phone', 'in_person', 'any'], default: 'phone' },
  topic: String,
  notes: String,
  meetingLink: String,
  adminNotes: String,
  price: { type: Number, default: 0 },
  isPaid: { type: Boolean, default: false },
}, { timestamps: true });
consultationBookingSchema.set('toJSON', { transform });
consultationBookingSchema.set('toObject', { transform });
export const ConsultationBookingModel = mongoose.models.ConsultationBooking || mongoose.model("ConsultationBooking", consultationBookingSchema);

const qMeetingSchema = new mongoose.Schema({
  title:          { type: String, required: true },
  description:    { type: String, default: "" },
  hostId:         { type: String, required: true },
  hostName:       { type: String, required: true },
  scheduledAt:    { type: Date, required: true },
  endsAt:         { type: Date },
  durationMinutes:{ type: Number, default: 60 },
  roomName:       { type: String, required: true, unique: true },
  meetingLink:    { type: String, required: true },
  type:           { type: String, enum: ["internal", "client_individual", "client_all", "consultation"], default: "client_individual" },
  participantIds:    { type: [String], default: [] },
  participantEmails: { type: [String], default: [] },
  participantNames:  { type: [String], default: [] },
  consultationBookingId: { type: String, default: null },
  status:         { type: String, enum: ["scheduled", "live", "completed", "cancelled"], default: "scheduled" },
  reminderSent:   { type: Boolean, default: false },
  reminder24hSent:{ type: Boolean, default: false },
  notes:          { type: String, default: "" },
  agenda:         { type: [String], default: [] },
  recordingUrl:   { type: String, default: "" },
  lobbyEnabled:   { type: Boolean, default: false },
}, { timestamps: true });
qMeetingSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id.toString(); return ret; } });
export const QMeetingModel = mongoose.models.QMeeting || mongoose.model("QMeeting", qMeetingSchema);

const qFeedbackSchema = new mongoose.Schema({
  meetingId:    { type: mongoose.Schema.Types.ObjectId, ref: "QMeeting", required: true, index: true },
  fromUserId:   { type: String, required: true },
  fromUserName: { type: String, required: true },
  rating:       { type: Number, min: 1, max: 5, required: true },
  comment:      { type: String, default: "" },
}, { timestamps: true });
qFeedbackSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id.toString(); return ret; } });
export const QFeedbackModel = mongoose.models.QFeedback || mongoose.model("QFeedback", qFeedbackSchema);

const qReportSchema = new mongoose.Schema({
  meetingId:    { type: mongoose.Schema.Types.ObjectId, ref: "QMeeting", required: true, index: true },
  authorId:     { type: String, required: true },
  authorName:   { type: String, required: true },
  summary:      { type: String, required: true },
  actionItems:  { type: [String], default: [] },
  attendeesCount: { type: Number, default: 0 },
  duration:     { type: Number, default: 0 },
  content:      { type: String, default: "" },
}, { timestamps: true });
qReportSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id.toString(); return ret; } });
export const QReportModel = mongoose.models.QReport || mongoose.model("QReport", qReportSchema);
