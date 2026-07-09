import mongoose from "mongoose";
import { transform } from "./utils";

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  forAdmins: { type: Boolean, default: false, index: true },
  type: { type: String, enum: ['order', 'message', 'status', 'payment', 'system', 'info', 'success', 'error', 'warning', 'task', 'project', 'subscription', 'ai_digest'], default: 'system' },
  title: { type: String, required: true },
  body: { type: String, default: '' },
  link: String,
  read: { type: Boolean, default: false, index: true },
  icon: String,
}, { timestamps: true });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ forAdmins: 1, read: 1 });
notificationSchema.set('toJSON', { transform });
notificationSchema.set('toObject', { transform });
export const NotificationModel = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

const inboxMessageSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
  csSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CsSession', index: true },
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  body: { type: String, default: "" },
  read: { type: Boolean, default: false, index: true },
  attachmentUrl: String,
  attachmentType: { type: String, enum: ["image", "file", "voice", null] },
  attachmentName: String,
  attachmentSize: Number,
  isAutoMessage: { type: Boolean, default: false },
  autoSender: { type: String, default: "" },
  deletedBy: [{ type: String }],
}, { timestamps: true });
inboxMessageSchema.index({ toUserId: 1, read: 1 });
inboxMessageSchema.index({ fromUserId: 1, toUserId: 1, createdAt: 1 });
inboxMessageSchema.set('toJSON', { transform });
inboxMessageSchema.set('toObject', { transform });
export const InboxMessageModel = mongoose.models.InboxMessage || mongoose.model("InboxMessage", inboxMessageSchema);

const csSessionSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  status: { type: String, enum: ['waiting', 'active', 'closed'], default: 'waiting', index: true },
  subject: { type: String, default: "" },
  transferNote: { type: String, default: "" },
  previousAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  closedAt: Date,
  closedReason: { type: String, default: "" },
  rating: { type: Number, min: 1, max: 5, default: null },
  ratingNote: { type: String, default: "" },
  lastMessageAt: { type: Date, default: Date.now },
  isUrgent: { type: Boolean, default: false },
  urgentNotifiedAt: { type: Date, default: null },
}, { timestamps: true });
csSessionSchema.index({ status: 1, lastMessageAt: -1 });
csSessionSchema.index({ clientId: 1, status: 1 });
csSessionSchema.index({ agentId: 1, status: 1 });
csSessionSchema.set('toJSON', { transform });
csSessionSchema.set('toObject', { transform });
export const CsSessionModel = mongoose.models.CsSession || mongoose.model("CsSession", csSessionSchema);

const supportTicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject: { type: String, required: true },
  category: { type: String, enum: ['technical', 'billing', 'general', 'complaint'], default: 'general' },
  body: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['open', 'in_review', 'resolved', 'closed'], default: 'open' },
  adminReply: String,
  repliedAt: Date,
  closedAt: Date,
}, { timestamps: true });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ userId: 1, status: 1 });
supportTicketSchema.set('toJSON', { transform });
supportTicketSchema.set('toObject', { transform });
export const SupportTicketModel = mongoose.models.SupportTicket || mongoose.model("SupportTicket", supportTicketSchema);

const pushSubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  userAgent: String,
}, { timestamps: true });
pushSubscriptionSchema.set('toJSON', { transform });
pushSubscriptionSchema.set('toObject', { transform });
export const PushSubscriptionModel = mongoose.models.PushSubscription || mongoose.model("PushSubscription", pushSubscriptionSchema);

const groupChatSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, default: "" },
  icon:        { type: String, default: "💬" },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  adminIds:    [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  memberIds:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isActive:    { type: Boolean, default: true },
  lastMessage: { type: String, default: "" },
  lastMessageAt: { type: Date, default: null },
}, { timestamps: true });
groupChatSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const GroupChatModel = mongoose.models.GroupChat || mongoose.model("GroupChat", groupChatSchema);

const groupMessageSchema = new mongoose.Schema({
  groupId:        { type: mongoose.Schema.Types.ObjectId, ref: "GroupChat", required: true, index: true },
  fromUserId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  body:           { type: String, default: "" },
  attachmentUrl:  { type: String, default: "" },
  attachmentType: { type: String, enum: ["image", "file", "voice", ""], default: "" },
  attachmentName: { type: String, default: "" },
  attachmentSize: { type: Number, default: 0 },
  deletedBy:      [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  readBy:         [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });
groupMessageSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const GroupMessageModel = mongoose.models.GroupMessage || mongoose.model("GroupMessage", groupMessageSchema);

const nativePushTokenSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  token:    { type: String, required: true, unique: true },
  platform: { type: String, enum: ["ios", "android"], required: true },
  bundleId: { type: String, default: "sa.qirox.studio" },
}, { timestamps: true });
nativePushTokenSchema.set("toJSON", { transform: (_: any, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const NativePushTokenModel = mongoose.models.NativePushToken || mongoose.model("NativePushToken", nativePushTokenSchema);
