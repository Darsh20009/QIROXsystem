import mongoose from "mongoose";

const htmlPublishSchema = new mongoose.Schema({
  ownerId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title:    { type: String, default: "صفحتي" },
  content:  { type: String, required: true },
  views:    { type: Number, default: 0 },
  isPublic: { type: Boolean, default: true },
}, { timestamps: true });
htmlPublishSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id.toString(); return ret; } });
export const HtmlPublishModel = mongoose.models.HtmlPublish || mongoose.model("HtmlPublish", htmlPublishSchema);

const shortUrlSchema = new mongoose.Schema({
  ownerId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  originalUrl: { type: String, required: true },
  shortCode:   { type: String, required: true, unique: true, index: true },
  title:       { type: String, default: "" },
  clicks:      { type: Number, default: 0 },
}, { timestamps: true });
shortUrlSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id.toString(); return ret; } });
export const ShortUrlModel = mongoose.models.ShortUrl || mongoose.model("ShortUrl", shortUrlSchema);

const referralSchema = new mongoose.Schema({
  referrerId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  referredId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  code:         { type: String, required: true },
  status:       { type: String, enum: ["pending", "rewarded", "expired"], default: "pending" },
  creditAmount: { type: Number, default: 50 },
  rewardedAt:   { type: Date, default: null },
}, { timestamps: true });
referralSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const ReferralModel = mongoose.models.Referral || mongoose.model("Referral", referralSchema);

const webhookSchema = new mongoose.Schema({
  clientId:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  label:           { type: String, required: true },
  url:             { type: String, required: true },
  events:          { type: [String], default: ["order.created"] },
  secret:          { type: String, default: "" },
  isActive:        { type: Boolean, default: true },
  lastDeliveredAt: { type: Date, default: null },
  lastError:       { type: String, default: null },
  deliveryCount:   { type: Number, default: 0 },
  failCount:       { type: Number, default: 0 },
}, { timestamps: true });
webhookSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const ClientWebhookModel = mongoose.models.ClientWebhook || mongoose.model("ClientWebhook", webhookSchema);

const embedTokenSchema = new mongoose.Schema({
  clientId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  label:          { type: String, default: "لوحة التضمين الرئيسية" },
  tokenHash:      { type: String, required: true, index: true },
  tokenPrefix:    { type: String, required: true },
  allowedOrigins: { type: [String], default: [] },
  isActive:       { type: Boolean, default: true },
  lastUsedAt:     { type: Date, default: null },
  useCount:       { type: Number, default: 0 },
  expiresAt:      { type: Date, default: null },
}, { timestamps: true });
embedTokenSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); delete ret.tokenHash; return ret; } });
export const EmbedTokenModel = mongoose.models.EmbedToken || mongoose.model("EmbedToken", embedTokenSchema);
