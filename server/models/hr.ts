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

/**
 * Separate, additive employment-contract records. Client/order contracts stay
 * in their existing collection and are not affected by this workflow.
 */
const employeeWorkContractSchema = new mongoose.Schema({
  contractNumber: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  status: { type: String, enum: ["draft", "sent", "terminated"], default: "draft", index: true },
  jurisdiction: { type: String, default: "المملكة العربية السعودية" },
  employerName: { type: String, required: true },
  employerLegalName: { type: String, default: "" },
  employerCommercialReg: { type: String, default: "" },
  employeeSnapshot: {
    fullName: { type: String, required: true },
    nationalId: { type: String, default: "" },
    role: { type: String, default: "" },
    jobTitle: { type: String, required: true },
  },
  salarySnapshot: {
    salaryType: { type: String, enum: ["fixed", "hourly", "commission"], required: true },
    amount: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 0 },
  },
  terms: {
    contractType: { type: String, enum: ["fixed", "indefinite"], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    workLocation: { type: String, required: true },
    weeklyHours: { type: Number, required: true },
    probationDays: { type: Number, required: true },
  },
  clauses: {
    workProductOwnership: { type: Boolean, default: true },
    confidentiality: { type: Boolean, default: true },
    handover: { type: Boolean, default: true },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sentAt: { type: Date, default: null },
  terminatedAt: { type: Date, default: null },
  terminationReason: { type: String, default: "" },
  terminationNotice: { type: String, default: "" },
}, { timestamps: true });
employeeWorkContractSchema.set("toJSON", { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
employeeWorkContractSchema.set("toObject", { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const EmployeeWorkContractModel =
  mongoose.models.EmployeeWorkContract ||
  mongoose.model("EmployeeWorkContract", employeeWorkContractSchema);

/**
 * Durable audit trail for role notices, contract delivery, terminations and
 * project-subscription reminders sent through the existing Baileys session.
 */
const employeeOperationMessageSchema = new mongoose.Schema({
  kind: { type: String, enum: ["role_notice", "contract", "termination_notice", "subscription_reminder"], required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null, index: true },
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: "EmployeeWorkContract", default: null },
  recipientName: { type: String, required: true },
  recipientPhone: { type: String, required: true, select: false },
  message: { type: String, required: true },
  internalNote: { type: String, default: "" },
  status: { type: String, enum: ["draft", "sending", "sent", "failed"], default: "draft", index: true },
  error: { type: String, default: "" },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sentAt: { type: Date, default: null },
}, { timestamps: true });
employeeOperationMessageSchema.set("toJSON", { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
employeeOperationMessageSchema.set("toObject", { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const EmployeeOperationMessageModel =
  mongoose.models.EmployeeOperationMessage ||
  mongoose.model("EmployeeOperationMessage", employeeOperationMessageSchema);
