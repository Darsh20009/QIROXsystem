import mongoose, { Schema } from "mongoose";

// ── WhatsApp Messages ─────────────────────────────────────────────────────────
const waMessageSchema = new Schema({
  chatId:       { type: String, required: true, index: true },
  messageId:    { type: String },
  fromMe:       { type: Boolean, default: false },
  senderName:   { type: String },
  body:         { type: String, default: "" },
  mediaType:    { type: String },   // image | document | audio | sticker
  mediaBase64:  { type: String },   // base64 for stored media
  caption:      { type: String },
  aiGenerated:  { type: Boolean, default: false },
  read:         { type: Boolean, default: false },
  timestamp:    { type: Date, default: Date.now },
}, { timestamps: false });

// ── WhatsApp Chats ────────────────────────────────────────────────────────────
const waChatSchema = new Schema({
  chatId:         { type: String, required: true, unique: true },
  name:           { type: String },
  phoneNumber:    { type: String },
  isGroup:        { type: Boolean, default: false },
  lastMessage:    { type: String, default: "" },
  lastMessageAt:  { type: Date, default: Date.now },
  unreadCount:    { type: Number, default: 0 },
  aiEnabled:      { type: Boolean, default: true },
  humanOverrideUntil: { type: Date },  // if set, AI paused until this time
}, { timestamps: true });

// ── WhatsApp Settings ─────────────────────────────────────────────────────────
const waSettingsSchema = new Schema({
  adminNumbers:      { type: [String], default: [] },  // phones that can send commands
  aiEnabled:         { type: Boolean, default: true },
  aiDelaySeconds:    { type: Number, default: 5 },
  systemPromptExtra: { type: String, default: "" },
  connectedPhone:    { type: String },
  savedMessages:     {
    type: [{
      text: { type: String, required: true, maxlength: 1000 },
      createdAt: { type: Date, default: Date.now },
    }],
    default: [],
  },
}, { timestamps: true });

export const WAMessageModel  = mongoose.models.WAMessage  || mongoose.model("WAMessage",  waMessageSchema);
export const WAChatModel     = mongoose.models.WAChat     || mongoose.model("WAChat",     waChatSchema);
export const WASettingsModel = mongoose.models.WASettings || mongoose.model("WASettings", waSettingsSchema);

// Baileys creates several auth files. Keep one encrypted snapshot in MongoDB so
// a new deployment can restore the session instead of requiring a new QR scan.
const waAuthStateSchema = new Schema({
  name: { type: String, required: true, unique: true, default: "default" },
  payload: { type: String, required: true },
}, { timestamps: true });

export const WAAuthStateModel =
  mongoose.models.WAAuthState || mongoose.model("WAAuthState", waAuthStateSchema);

// Store keys are intentionally separate from the general client API keys.
// A store key can only send WhatsApp messages for one store.
const storeWhatsAppApiKeySchema = new Schema({
  storeId:       { type: Schema.Types.ObjectId, ref: "ClientStore", required: true, index: true },
  clientId:      { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name:          { type: String, required: true, trim: true, maxlength: 120 },
  keyHash:       { type: String, required: true, unique: true, index: true, select: false },
  keyPrefix:     { type: String, required: true },
  scopes:        { type: [String], enum: ["messages:send", "templates:send"], default: ["messages:send"] },
  allowedOrigins:{ type: [String], default: [] },
  expiresAt:     { type: Date, default: null },
  isActive:      { type: Boolean, default: true, index: true },
  rateLimitPerMinute: { type: Number, default: 30, min: 1, max: 300 },
  quotaPeriod:   { type: String, enum: ["monthly", "bimonthly"], default: "monthly" },
  quotaLimit:    { type: Number, default: 1000, min: 1, max: 1000000 },
  lastUsedAt:    { type: Date, default: null },
  requestCount:  { type: Number, default: 0 },
  sentCount:     { type: Number, default: 0 },
  failedCount:   { type: Number, default: 0 },
  rotatedFrom:   { type: Schema.Types.ObjectId, ref: "StoreWhatsAppApiKey", default: null },
  revokedAt:    { type: Date, default: null },
}, { timestamps: true });

const storeWhatsAppQuotaSchema = new Schema({
  keyId:       { type: Schema.Types.ObjectId, ref: "StoreWhatsAppApiKey", required: true, index: true },
  storeId:     { type: Schema.Types.ObjectId, ref: "ClientStore", required: true, index: true },
  periodStart: { type: Date, required: true },
  periodEnd:   { type: Date, required: true },
  period:      { type: String, enum: ["monthly", "bimonthly"], required: true },
  limit:       { type: Number, required: true },
  used:        { type: Number, default: 0 },
}, { timestamps: true });
storeWhatsAppQuotaSchema.index({ keyId: 1, periodStart: 1 }, { unique: true });

// Mongo-backed minute window so a key cannot bypass its limit by hitting a
// different server process or waiting for an application restart.
const storeWhatsAppRateLimitSchema = new Schema({
  keyId:       { type: Schema.Types.ObjectId, ref: "StoreWhatsAppApiKey", required: true, index: true },
  windowStart: { type: Date, required: true },
  count:       { type: Number, default: 0 },
  expiresAt:   { type: Date, required: true },
}, { timestamps: true });
storeWhatsAppRateLimitSchema.index({ keyId: 1, windowStart: 1 }, { unique: true });
storeWhatsAppRateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Created before quota consumption so concurrent retries reserve one slot only.
const storeWhatsAppRequestSchema = new Schema({
  keyId:          { type: Schema.Types.ObjectId, ref: "StoreWhatsAppApiKey", required: true, index: true },
  storeId:        { type: Schema.Types.ObjectId, ref: "ClientStore", required: true, index: true },
  idempotencyKey: { type: String, required: true },
  payloadHash:    { type: String, required: true },
  status:         { type: String, enum: ["processing", "accepted", "rejected"], default: "processing" },
  deliveryId:     { type: Schema.Types.ObjectId, ref: "NotificationDelivery", default: null },
  quotaId:        { type: Schema.Types.ObjectId, ref: "StoreWhatsAppQuota", default: null },
  error:          { type: String, default: "" },
  expiresAt:      { type: Date, default: () => new Date(Date.now() + 60 * 60 * 24 * 90 * 1000) },
}, { timestamps: true });
storeWhatsAppRequestSchema.index({ keyId: 1, idempotencyKey: 1 }, { unique: true });
storeWhatsAppRequestSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
storeWhatsAppRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const StoreWhatsAppApiKeyModel =
  mongoose.models.StoreWhatsAppApiKey ||
  mongoose.model("StoreWhatsAppApiKey", storeWhatsAppApiKeySchema);
export const StoreWhatsAppQuotaModel =
  mongoose.models.StoreWhatsAppQuota ||
  mongoose.model("StoreWhatsAppQuota", storeWhatsAppQuotaSchema);
export const StoreWhatsAppRateLimitModel =
  mongoose.models.StoreWhatsAppRateLimit ||
  mongoose.model("StoreWhatsAppRateLimit", storeWhatsAppRateLimitSchema);
export const StoreWhatsAppRequestModel =
  mongoose.models.StoreWhatsAppRequest ||
  mongoose.model("StoreWhatsAppRequest", storeWhatsAppRequestSchema);
