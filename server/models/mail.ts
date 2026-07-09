import mongoose from "mongoose";

const mailAccountSchema = new mongoose.Schema({
  emailAddress:   { type: String, required: true, unique: true },
  password:       { type: String, required: true },
  displayName:    { type: String, default: "" },
  jobTitle:       { type: String, default: "" },
  imapHost:       { type: String, default: "server222.web-hosting.com" },
  imapPort:       { type: Number, default: 993 },
  smtpHost:       { type: String, default: "server222.web-hosting.com" },
  smtpPort:       { type: Number, default: 465 },
  assignedUserId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  assignedUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isShared:        { type: Boolean, default: false },
  sharedWith:      [{ type: String }],
}, { timestamps: true });
mailAccountSchema.set('toJSON', { transform: (_, ret: any) => { delete ret.password; ret.id = ret._id?.toString(); return ret; } });
export const MailAccountModel = mongoose.models.MailAccount || mongoose.model("MailAccount", mailAccountSchema);

const mailCacheSchema = new mongoose.Schema({
  accountId:  { type: mongoose.Schema.Types.ObjectId, ref: "MailAccount", required: true, index: true },
  folder:     { type: String, default: "INBOX" },
  uid:        { type: Number, required: true },
  subject:    { type: String, default: "" },
  from:       { type: String, default: "" },
  to:         { type: String, default: "" },
  date:       { type: Date },
  seen:       { type: Boolean, default: false },
  html:       { type: String, default: "" },
  text:       { type: String, default: "" },
  snippet:    { type: String, default: "" },
}, { timestamps: true });
mailCacheSchema.index({ accountId: 1, folder: 1, uid: 1 }, { unique: true });
mailCacheSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const MailCacheModel = mongoose.models.MailCache || mongoose.model("MailCache", mailCacheSchema);

const marketingEmailSchema = new mongoose.Schema({
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  name:       { type: String, default: "" },
  source:     { type: String, default: "manual" },
  unsubscribed: { type: Boolean, default: false },
  bounced:    { type: Boolean, default: false },
  addedAt:    { type: Date, default: Date.now },
});
export const MarketingEmailModel = mongoose.models.MarketingEmail || mongoose.model("MarketingEmail", marketingEmailSchema);

const emailCampaignSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  subject:     { type: String, required: true },
  htmlBody:    { type: String, required: true },
  type:        { type: String, enum: ["daily_bulk", "manual", "weekly_interested"], default: "manual" },
  status:      { type: String, enum: ["draft", "running", "completed", "failed"], default: "draft" },
  totalTarget: { type: Number, default: 0 },
  totalSent:   { type: Number, default: 0 },
  totalOpened: { type: Number, default: 0 },
  totalClicked:{ type: Number, default: 0 },
  batchSize:   { type: Number, default: 1000 },
  createdAt:   { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  createdBy:   { type: String, default: "system" },
});
export const EmailCampaignModel = mongoose.models.EmailCampaign || mongoose.model("EmailCampaign", emailCampaignSchema);

const emailCampaignRecipientSchema = new mongoose.Schema({
  campaignId:  { type: mongoose.Schema.Types.ObjectId, ref: "EmailCampaign", required: true, index: true },
  email:       { type: String, required: true },
  name:        { type: String, default: "" },
  sentAt:      { type: Date, default: null },
  opened:      { type: Boolean, default: false },
  openedAt:    { type: Date, default: null },
  clicked:     { type: Boolean, default: false },
  clickedAt:   { type: Date, default: null },
  trackId:     { type: String, required: true, unique: true },
  status:      { type: String, enum: ["pending","sent","failed"], default: "pending" },
});
emailCampaignRecipientSchema.index({ email: 1 });
export const EmailCampaignRecipientModel = mongoose.models.EmailCampaignRecipient || mongoose.model("EmailCampaignRecipient", emailCampaignRecipientSchema);

const interestedLeadSchema = new mongoose.Schema({
  email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
  name:             { type: String, default: "" },
  firstEngagedAt:   { type: Date, default: Date.now },
  lastEngagedAt:    { type: Date, default: Date.now },
  engagementType:   { type: String, enum: ["opened","clicked"], default: "opened" },
  campaignIds:      { type: [mongoose.Schema.Types.ObjectId], default: [] },
  followUpSentAt:   { type: Date, default: null },
  followUpCount:    { type: Number, default: 0 },
});
export const InterestedLeadModel = mongoose.models.InterestedLead || mongoose.model("InterestedLead", interestedLeadSchema);

const globalSentEmailSchema = new mongoose.Schema({
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  firstSentAt: { type: Date, default: Date.now },
  lastSentAt:  { type: Date, default: Date.now },
  sendCount:   { type: Number, default: 1 },
});
export const GlobalSentEmailModel = mongoose.models.GlobalSentEmail || mongoose.model("GlobalSentEmail", globalSentEmailSchema);
