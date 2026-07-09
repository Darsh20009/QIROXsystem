import mongoose from "mongoose";
import { transform } from "./utils";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
  type: { type: String, enum: ["email_verify", "forgot_password", "login_otp", "2fa_email"], default: "forgot_password" },
}, { timestamps: true });
otpSchema.set('toJSON', { transform });
otpSchema.set('toObject', { transform });
export const OtpModel = mongoose.models.Otp || mongoose.model("Otp", otpSchema);

const webAuthnCredentialSchema = new mongoose.Schema({
  userId:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  credentialId:        { type: String, required: true, unique: true },
  credentialPublicKey: { type: Buffer, required: true },
  counter:             { type: Number, required: true, default: 0 },
  transports:          { type: [String], default: [] },
  deviceName:          { type: String, default: "جهاز محفوظ" },
  userAgent:           { type: String, default: "" },
  lastUsed:            { type: Date },
}, { timestamps: true });
webAuthnCredentialSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); delete ret._id; delete ret.__v; delete ret.credentialPublicKey; return ret; } });
export const WebAuthnCredentialModel = mongoose.models.WebAuthnCredential || mongoose.model("WebAuthnCredential", webAuthnCredentialSchema);

const deviceTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, index: true },
  userAgent: { type: String, default: "" },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });
deviceTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
deviceTokenSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const DeviceTokenModel = mongoose.models.DeviceToken || mongoose.model("DeviceToken", deviceTokenSchema);

const pending2FASchema = new mongoose.Schema({
  tempToken:   { type: String, required: true, unique: true, index: true },
  userId:      { type: String, required: true },
  methods:     { type: [String], default: [] },
  pushApproved:{ type: Boolean, default: false },
  expiresAt:   { type: Date, required: true, index: { expires: 0 } },
});
export const Pending2FAModel = mongoose.models.Pending2FA || mongoose.model("Pending2FA", pending2FASchema);

const pushChallengeSchema = new mongoose.Schema({
  challengeId: { type: String, required: true, unique: true, index: true },
  userId:      { type: String, required: true },
  number:      { type: Number, required: true },
  status:      { type: String, enum: ["pending", "approved", "denied"], default: "pending" },
  tempToken:   { type: String, required: true },
  deviceInfo:  { type: String, default: "" },
  expiresAt:   { type: Date, required: true, index: { expires: 0 } },
});
export const PushChallengeModel = mongoose.models.PushChallenge || mongoose.model("PushChallenge", pushChallengeSchema);

const phoneVerifyOtpSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  phone:     { type: String, required: true, index: true },
  token:     { type: String, required: true, unique: true },
  otp:       { type: String },
  otpSent:   { type: Boolean, default: false },
  telegramChatId: { type: String },
  method:    { type: String, enum: ["telegram", "call", "whatsapp"], required: true },
  purpose:   { type: String, enum: ["verify", "login"], default: "verify" },
  verified:  { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
  callStatus: { type: String, enum: ["pending", "called", "resolved", "cancelled"], default: "pending" },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  resolvedAt: { type: Date },
}, { timestamps: true });
phoneVerifyOtpSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const PhoneVerifyOtpModel = mongoose.models.PhoneVerifyOtp || mongoose.model("PhoneVerifyOtp", phoneVerifyOtpSchema);

const preRegPhoneOtpSchema = new mongoose.Schema({
  phone:      { type: String, required: true, index: true },
  otp:        { type: String, required: true },
  phoneToken: { type: String, required: true, unique: true },
  verified:   { type: Boolean, default: false },
  expiresAt:  { type: Date, required: true },
}, { timestamps: true });
export const PreRegPhoneOtpModel = mongoose.models.PreRegPhoneOtp || mongoose.model("PreRegPhoneOtp", preRegPhoneOtpSchema);

const clientApiKeySchema = new mongoose.Schema({
  clientId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name:          { type: String, required: true },
  projectName:   { type: String, default: "" },
  keyHash:       { type: String, required: true, index: true },
  keyPrefix:     { type: String, required: true },
  scopes:        { type: [String], default: ["orders", "projects", "invoices", "stats"] },
  isActive:      { type: Boolean, default: true },
  expiresAt:     { type: Date, default: null },
  lastUsedAt:    { type: Date, default: null },
  requestCount:  { type: Number, default: 0 },
  allowedOrigins:{ type: [String], default: [] },
}, { timestamps: true });
clientApiKeySchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); delete ret.keyHash; return ret; } });
export const ClientApiKeyModel = mongoose.models.ClientApiKey || mongoose.model("ClientApiKey", clientApiKeySchema);

const authAppSchema = new mongoose.Schema({
  ownerId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name:          { type: String, required: true },
  description:   { type: String, default: "" },
  domain:        { type: String, default: "" },
  logoUrl:       { type: String, default: "" },
  clientId:      { type: String, required: true, unique: true, index: true },
  clientSecretHash: { type: String, required: true, select: false },
  isActive:      { type: Boolean, default: true },
  allowedOrigins:{ type: [String], default: [] },
  webhookUrl:    { type: String, default: "" },
  callCount:     { type: Number, default: 0 },
  lastUsedAt:    { type: Date, default: null },
}, { timestamps: true });
authAppSchema.set('toJSON', { transform: (_, ret: any) => { delete ret.clientSecretHash; ret.id = ret._id?.toString(); return ret; } });
export const AuthAppModel = mongoose.models.AuthApp || mongoose.model("AuthApp", authAppSchema);

const authAppEnrollmentSchema = new mongoose.Schema({
  appId:          { type: mongoose.Schema.Types.ObjectId, ref: "AuthApp", required: true, index: true },
  externalUserId: { type: String, required: true },
  totpSecret:     { type: String, required: true, select: false },
  confirmed:      { type: Boolean, default: false },
  confirmedAt:    { type: Date, default: null },
  lastVerifiedAt: { type: Date, default: null },
  failCount:      { type: Number, default: 0 },
  lockedUntil:    { type: Date, default: null },
}, { timestamps: true });
authAppEnrollmentSchema.index({ appId: 1, externalUserId: 1 }, { unique: true });
authAppEnrollmentSchema.set('toJSON', { transform: (_, ret: any) => { delete ret.totpSecret; ret.id = ret._id?.toString(); return ret; } });
export const AuthAppEnrollmentModel = mongoose.models.AuthAppEnrollment || mongoose.model("AuthAppEnrollment", authAppEnrollmentSchema);
