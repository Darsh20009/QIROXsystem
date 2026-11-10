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

const manualMarketingCampaignSchema = new Schema({
  normalizedPhone: { type: String, required: true },
  chatId: { type: String, required: true },
  sector: { type: String, required: true },
  countryCode: { type: String, default: "SA", match: /^[A-Z]{2}$/ },
  language: { type: String, enum: ["ar", "en"], default: "ar" },
  businessName: { type: String, default: "", maxlength: 80 },
  message: { type: String, required: true, maxlength: 2000 },
  status: { type: String, enum: ["sending", "active", "failed", "opted_out", "superseded"], default: "sending" },
  sendAttemptId: { type: String, required: true },
  sendStartedAt: { type: Date, required: true },
  sentAt: { type: Date },
  sentBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  recipientConsentConfirmed: { type: Boolean, required: true, default: false },
  forwardedMessageIds: { type: [String], default: [] },
}, { timestamps: true });

manualMarketingCampaignSchema.index(
  { normalizedPhone: 1, status: 1, sentAt: -1 },
  { name: "manual_marketing_reply_lookup" },
);
manualMarketingCampaignSchema.index(
  { sentBy: 1, status: 1, sentAt: 1 },
  { name: "manual_marketing_daily_quota_lookup" },
);

export const ManualMarketingCampaignModel =
  mongoose.models.ManualMarketingCampaign ||
  mongoose.model("ManualMarketingCampaign", manualMarketingCampaignSchema);

const manualMarketingQuotaNoticeSchema = new Schema({
  dayKey: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  type: { type: String, enum: ["completed", "incomplete_summary"], required: true },
  status: { type: String, enum: ["sending", "sent", "failed"], default: "sending" },
  sentAt: { type: Date, default: null },
  error: { type: String, default: "" },
}, { timestamps: true });
manualMarketingQuotaNoticeSchema.index(
  { dayKey: 1, userId: 1, type: 1 },
  { unique: true, name: "manual_marketing_quota_notice_daily_unique" },
);
export const ManualMarketingQuotaNoticeModel =
  mongoose.models.ManualMarketingQuotaNotice ||
  mongoose.model("ManualMarketingQuotaNotice", manualMarketingQuotaNoticeSchema);

const manualMarketingLeadSchema = new Schema({
  normalizedPhone: { type: String, required: true },
  chatId: { type: String, required: true },
  sector: { type: String, required: true },
  countryCode: { type: String, default: "SA", match: /^[A-Z]{2}$/ },
  language: { type: String, enum: ["ar", "en"], default: "ar" },
  businessName: { type: String, default: "", maxlength: 80 },
  leadStatus: { type: String, enum: ["sent", "excluded", "converted"], default: "sent", index: true },
  exclusionSource: { type: String, enum: ["manual", "recipient_opt_out"], default: null },
  latestCampaignId: { type: Schema.Types.ObjectId, ref: "ManualMarketingCampaign", default: null },
  sentAt: { type: Date, required: true },
  sentBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  recipientConsentConfirmed: { type: Boolean, default: true },
  lastReplyAt: { type: Date, default: null },
  lastReplyPreview: { type: String, default: "", maxlength: 500 },
  lastReplyContactName: { type: String, default: "", maxlength: 120 },
  excludedAt: { type: Date, default: null },
  statusUpdatedAt: { type: Date, default: Date.now },
  statusUpdatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  convertedClientId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  convertedAt: { type: Date, default: null },
  convertedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

manualMarketingLeadSchema.index(
  { normalizedPhone: 1 },
  { unique: true, name: "manual_marketing_lead_phone_unique" },
);
manualMarketingLeadSchema.index(
  { leadStatus: 1, sentAt: -1 },
  { name: "manual_marketing_lead_status_sent_at" },
);

export const ManualMarketingLeadModel =
  mongoose.models.ManualMarketingLead ||
  mongoose.model("ManualMarketingLead", manualMarketingLeadSchema);

let manualMarketingLeadStorePromise: Promise<void> | null = null;
export function ensureManualMarketingLeadStore() {
  if (!manualMarketingLeadStorePromise) {
    manualMarketingLeadStorePromise = (async () => {
      await ManualMarketingLeadModel.collection.createIndex(
        { normalizedPhone: 1 },
        { unique: true, name: "manual_marketing_lead_phone_unique" },
      );
      await ManualMarketingLeadModel.collection.createIndex(
        { leadStatus: 1, sentAt: -1 },
        { name: "manual_marketing_lead_status_sent_at" },
      );

      // Preserve campaigns sent before the lead list existed. "Sending" may
      // mean WhatsApp accepted the message but the final status write failed.
      // The upsert only initializes missing leads, so edited statuses survive.
      const historical = await ManualMarketingCampaignModel.aggregate([
        { $match: { status: { $in: ["active", "sending", "opted_out", "superseded"] } } },
        { $sort: { sentAt: -1, createdAt: -1 } },
        {
          $group: {
            _id: "$normalizedPhone",
            latest: { $first: "$$ROOT" },
            hasOptedOut: {
              $max: { $cond: [{ $eq: ["$status", "opted_out"] }, 1, 0] },
            },
            latestOptOutAt: {
              $max: {
                $cond: [
                  { $eq: ["$status", "opted_out"] },
                  { $ifNull: ["$sentAt", "$updatedAt"] },
                  null,
                ],
              },
            },
          },
        },
      ]);

      if (!historical.length) return;
      await ManualMarketingLeadModel.bulkWrite(
        historical.map(({ _id, latest, hasOptedOut, latestOptOutAt }: any) => ({
          updateOne: {
            filter: { normalizedPhone: _id },
            update: {
              $setOnInsert: {
                normalizedPhone: latest.normalizedPhone,
                chatId: latest.chatId,
                sector: latest.sector,
                countryCode: latest.countryCode || "SA",
                language: latest.language || "ar",
                businessName: latest.businessName || "",
                leadStatus: hasOptedOut ? "excluded" : "sent",
                ...(hasOptedOut ? {
                  exclusionSource: "recipient_opt_out",
                  excludedAt: latestOptOutAt || latest.sentAt || latest.createdAt,
                } : {}),
                latestCampaignId: latest._id,
                sentAt: latest.sentAt || latest.sendStartedAt || latest.createdAt,
                sentBy: latest.sentBy || null,
                recipientConsentConfirmed: latest.recipientConsentConfirmed === true,
                statusUpdatedAt: latest.sentAt || latest.createdAt || new Date(),
              },
            },
            upsert: true,
          },
        })),
        { ordered: false },
      ).catch((error: any) => {
        // Concurrent first reads can race on the unique phone index. Keep the
        // already-created lead and let the caller continue.
        if (error?.code === 11000) return;
        if (error?.writeErrors?.length && error.writeErrors.every((item: any) => item?.code === 11000)) return;
        throw error;
      });
    })().catch((error) => {
      manualMarketingLeadStorePromise = null;
      throw error;
    });
  }
  return manualMarketingLeadStorePromise;
}

let manualMarketingIndexPromise: Promise<string> | null = null;
export function ensureManualMarketingIndexes() {
  if (!manualMarketingIndexPromise) {
    manualMarketingIndexPromise = ManualMarketingCampaignModel.collection.createIndex(
      { normalizedPhone: 1, status: 1, sentAt: -1 },
      { name: "manual_marketing_reply_lookup" },
    ).catch((error) => {
      manualMarketingIndexPromise = null;
      throw error;
    });
  }
  return manualMarketingIndexPromise;
}

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
