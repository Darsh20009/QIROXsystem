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
  aiDelaySeconds:    { type: Number, default: 60 },
  systemPromptExtra: { type: String, default: "" },
  connectedPhone:    { type: String },
}, { timestamps: true });

export const WAMessageModel  = mongoose.models.WAMessage  || mongoose.model("WAMessage",  waMessageSchema);
export const WAChatModel     = mongoose.models.WAChat     || mongoose.model("WAChat",     waChatSchema);
export const WASettingsModel = mongoose.models.WASettings || mongoose.model("WASettings", waSettingsSchema);
