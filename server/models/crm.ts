import mongoose from "mongoose";
import { transform } from "./utils";

const crmActivitySchema = new mongoose.Schema({
  type:      { type: String, enum: ["call","email","whatsapp","meeting","note","task"], default: "note" },
  content:   { type: String, required: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const crmLeadSchema = new mongoose.Schema({
  name:            { type: String, required: true },
  phone:           { type: String, default: "" },
  email:           { type: String, default: "" },
  company:         { type: String, default: "" },
  source:          { type: String, enum: ["website","instagram","twitter","tiktok","referral","cold_call","exhibition","other"], default: "other" },
  stage:           { type: String, enum: ["new","contacted","qualified","proposal","won","lost"], default: "new" },
  value:           { type: Number, default: 0 },
  currency:        { type: String, default: "SAR" },
  assignedTo:      { type: String, default: "" },
  assignedToName:  { type: String, default: "" },
  notes:           { type: String, default: "" },
  lostReason:      { type: String, default: "" },
  tags:            { type: [String], default: [] },
  nextFollowUpAt:  { type: Date, default: null },
  lastContactedAt: { type: Date, default: null },
  activities:      { type: [crmActivitySchema], default: [] },
}, { timestamps: true });
crmLeadSchema.set("toJSON", { transform: (_: any, ret: any) => { ret.id = ret._id?.toString(); ret.activities = (ret.activities || []).map((a: any) => ({ ...a, id: a._id?.toString() })); return ret; } });
export const CrmLeadModel = mongoose.models.CrmLead || mongoose.model("CrmLead", crmLeadSchema);

const leadDataSchema = new mongoose.Schema({
  companyName:     { type: String, required: true },
  contactName:     { type: String, default: "" },
  phone:           { type: String, default: "" },
  email:           { type: String, default: "", lowercase: true, trim: true },
  sector:          { type: String, default: "" },
  source:          { type: String, default: "manual" },
  status:          { type: String, enum: ["new","contacted","interested","appointment_needed","reminder_needed","not_interested","needs_something","converted"], default: "new" },
  notes:           { type: String, default: "" },
  assignedTo:      { type: String, default: "" },
  assignedToName:  { type: String, default: "" },
  lastContactedAt: { type: Date, default: null },
  reminderAt:      { type: Date, default: null },
  addedToMarketing: { type: Boolean, default: false },
  convertedAt:     { type: Date, default: null },
  statusHistory: [{
    status:    { type: String },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: String, default: "" },
    note:      { type: String, default: "" },
  }],
  callRatingToken:     { type: String, default: null, index: true, sparse: true },
  callRatingScore:     { type: Number, default: null },
  callRatingComment:   { type: String, default: "" },
  callRatingSubmittedAt: { type: Date, default: null },
  callRatingSentAt:    { type: Date, default: null },
}, { timestamps: true });
leadDataSchema.index({ status: 1 });
leadDataSchema.index({ email: 1 });
leadDataSchema.set("toJSON", { transform: (_: any, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const LeadDataModel = mongoose.models.LeadData || mongoose.model("LeadData", leadDataSchema);

const switchReminderSchema = new mongoose.Schema({
  name:                { type: String, required: true },
  phone:               { type: String, required: true },
  email:               { type: String, default: "" },
  currentProvider:     { type: String, required: true },
  serviceType:         { type: String, default: "" },
  subscriptionEndDate: { type: Date, required: true },
  notes:               { type: String, default: "" },
  status:              { type: String, enum: ["pending", "contacted", "converted", "not_interested"], default: "pending" },
  adminNotes:          { type: String, default: "" },
  contactedAt:         { type: Date, default: null },
  userId:              { type: String, default: null },
}, { timestamps: true });
switchReminderSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const SwitchReminderModel = mongoose.models.SwitchReminder || mongoose.model("SwitchReminder", switchReminderSchema);

const phoneRequestSchema = new mongoose.Schema({
  clientId:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  clientName:      { type: String },
  clientPhone:     { type: String },
  requestedBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  requestedByName: { type: String },
  notes:           { type: String },
  status:          { type: String, enum: ["pending", "resolved", "cancelled"], default: "pending" },
  resolvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  resolvedByName:  { type: String },
  newPhone:        { type: String },
  resolvedAt:      { type: Date },
}, { timestamps: true });
phoneRequestSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const PhoneRequestModel = mongoose.models.PhoneRequest || mongoose.model("PhoneRequest", phoneRequestSchema);
