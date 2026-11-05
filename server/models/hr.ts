import mongoose from "mongoose";
import { transform } from "./utils";

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  checkIn: { type: Date, required: true },
  checkOut: Date,
  ipAddress: String,
  location: { lat: Number, lng: Number },
  locationHistory: [{ lat: Number, lng: Number, timestamp: Date }],
  workHours: Number,
  checkInNotes: { type: String, default: "" },
  checkOutNotes: { type: String, default: "" },
  achievements: { type: String, default: "" },
  activeMinutes: { type: Number, default: 0 },
  lastActivityAt: Date,
}, { timestamps: true });
attendanceSchema.index({ userId: 1, checkIn: -1 });
attendanceSchema.index({ userId: 1, checkOut: 1 });
attendanceSchema.set('toJSON', { transform });
attendanceSchema.set('toObject', { transform });
export const AttendanceModel = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);

const employeeProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bio: String,
  skills: [String],
  hourlyRate: { type: Number, default: 0 },
  salaryType: { type: String, enum: ['fixed', 'hourly', 'commission'], default: 'hourly' },
  fixedSalary: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 0 },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  vacationDays: { type: Number, default: 21 },
  vacationUsed: { type: Number, default: 0 },
  bankName: String,
  bankAccount: String,
  bankIBAN: String,
  nationalId: String,
  hireDate: Date,
  jobTitle: String,
  portfolioItems: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
    type: { type: String, enum: ['template', 'file', 'video'], default: 'template' },
    url: { type: String, required: true },
    description: { type: String, default: '' },
  }],
}, { timestamps: true });
employeeProfileSchema.set('toJSON', { transform });
employeeProfileSchema.set('toObject', { transform });
export const EmployeeProfileModel = mongoose.models.EmployeeProfile || mongoose.model("EmployeeProfile", employeeProfileSchema);

const promotionLogSchema = new mongoose.Schema({
  targetUserId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  promotedById:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fromRole:       { type: String, required: true },
  toRole:         { type: String, required: true },
  fromAdditional: { type: [String], default: [] },
  toAdditional:   { type: [String], default: [] },
  reason:         { type: String, default: "" },
  type:           { type: String, enum: ["promote", "demote", "role_add", "role_remove"], default: "promote" },
}, { timestamps: true });
promotionLogSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const PromotionLogModel = mongoose.models.PromotionLog || mongoose.model("PromotionLog", promotionLogSchema);

const faceDescriptorSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  descriptors: { type: [[Number]], required: true },
  angles: { type: [String], default: ["front", "left", "right"] },
}, { timestamps: true });
faceDescriptorSchema.set("toJSON", { transform: (_: any, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const FaceDescriptorModel = mongoose.models.FaceDescriptor || mongoose.model("FaceDescriptor", faceDescriptorSchema);
