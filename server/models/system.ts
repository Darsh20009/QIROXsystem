import mongoose from "mongoose";
import { transform } from "./utils";

const cronRunLogSchema = new mongoose.Schema({
  runAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["success", "error"], required: true },
  duration: { type: Number, default: 0 },
  response: { type: String, default: "" },
  triggeredBy: { type: String, enum: ["schedule", "manual"], default: "schedule" },
}, { _id: false });

const cronJobSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameAr: { type: String, default: "" },
  description: { type: String, default: "" },
  url: { type: String, required: true },
  method: { type: String, enum: ["GET", "POST", "PUT", "PATCH", "DELETE"], default: "GET" },
  headers: { type: Map, of: String, default: {} },
  body: { type: String, default: "" },
  schedule: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  lastRunAt: Date,
  lastRunStatus: { type: String, enum: ["success", "error", "pending", "never"], default: "never" },
  lastRunResponse: { type: String, default: "" },
  lastRunDuration: { type: Number, default: 0 },
  successCount: { type: Number, default: 0 },
  errorCount: { type: Number, default: 0 },
  runLogs: { type: [cronRunLogSchema], default: [] },
  createdBy: String,
  projectId: String,
}, { timestamps: true });
cronJobSchema.set('toJSON', { transform });
cronJobSchema.set('toObject', { transform });
export const CronJobModel = mongoose.models.CronJob || mongoose.model("CronJob", cronJobSchema);

const atlasConfigSchema = new mongoose.Schema({
  label: { type: String, required: true },
  publicKey: { type: String, required: true },
  privateKey: { type: String, required: true },
  orgId: { type: String, default: "" },
  projectId: { type: String, default: "" },
  projectName: { type: String, default: "" },
  clusterName: { type: String, default: "" },
  isDefault: { type: Boolean, default: false },
  createdBy: String,
}, { timestamps: true });
atlasConfigSchema.set('toJSON', { transform });
atlasConfigSchema.set('toObject', { transform });
export const AtlasConfigModel = mongoose.models.AtlasConfig || mongoose.model("AtlasConfig", atlasConfigSchema);

const atlasDbUserSchema = new mongoose.Schema({
  configId: { type: mongoose.Schema.Types.ObjectId, ref: 'AtlasConfig', required: true },
  clientId: String,
  clientName: String,
  username: { type: String, required: true },
  password: { type: String, required: true },
  databaseName: { type: String, required: true },
  roles: [{ type: String }],
  connectionString: { type: String, default: "" },
  notes: { type: String, default: "" },
  createdBy: String,
}, { timestamps: true });
atlasDbUserSchema.set('toJSON', { transform });
atlasDbUserSchema.set('toObject', { transform });
export const AtlasDbUserModel = mongoose.models.AtlasDbUser || mongoose.model("AtlasDbUser", atlasDbUserSchema);

const appPublishConfigSchema = new mongoose.Schema({
  clientId: String,
  clientName: String,
  projectId: String,
  appName: { type: String, required: true },
  appNameAr: { type: String, default: "" },
  appVersion: { type: String, default: "1.0.0" },
  buildNumber: { type: String, default: "1" },
  framework: { type: String, enum: ["react-native", "expo", "flutter", "ionic", "capacitor", "pwa", "other"], default: "expo" },
  androidPackageName: { type: String, default: "" },
  iosBundleId: { type: String, default: "" },
  googlePlayListingUrl: { type: String, default: "" },
  appStoreListingUrl: { type: String, default: "" },
  logoUrl: { type: String, default: "" },
  splashColor: { type: String, default: "#000000" },
  primaryColor: { type: String, default: "#000000" },
  siteUrl: { type: String, default: "" },
  apiBaseUrl: { type: String, default: "" },
  firebaseConfigAndroid: { type: String, default: "" },
  firebaseConfigIos: { type: String, default: "" },
  signingKeyAlias: { type: String, default: "" },
  signingKeyPassword: { type: String, default: "" },
  description: { type: String, default: "" },
  descriptionAr: { type: String, default: "" },
  keywords: { type: String, default: "" },
  createdBy: String,
}, { timestamps: true });
appPublishConfigSchema.set('toJSON', { transform });
appPublishConfigSchema.set('toObject', { transform });
export const AppPublishConfigModel = mongoose.models.AppPublishConfig || mongoose.model("AppPublishConfig", appPublishConfigSchema);

const qiroxSystemSettingsSchema = new mongoose.Schema({
  key: { type: String, default: "main", unique: true },
  companyName:        { type: String, default: "QIROX Studio" },
  companyNameAr:      { type: String, default: "كيروكس ستوديو" },
  domain:             { type: String, default: "qiroxstudio.online" },
  tagline:            { type: String, default: "مصنع الأنظمة" },
  taglineAr:          { type: String, default: "مصنع الأنظمة الرقمية" },
  description:        { type: String, default: "" },
  logoUrl:            { type: String, default: "" },
  faviconUrl:         { type: String, default: "" },
  contactEmail:       { type: String, default: "info@qiroxstudio.online" },
  contactPhone:       { type: String, default: "" },
  whatsapp:           { type: String, default: "" },
  address:            { type: String, default: "" },
  city:               { type: String, default: "" },
  country:            { type: String, default: "المملكة العربية السعودية" },
  instagram:          { type: String, default: "" },
  twitter:            { type: String, default: "" },
  linkedin:           { type: String, default: "" },
  snapchat:           { type: String, default: "" },
  youtube:            { type: String, default: "" },
  tiktok:             { type: String, default: "" },
  linktree:           { type: String, default: "" },
  taxNumber:          { type: String, default: "" },
  commercialReg:      { type: String, default: "" },
  foundedYear:        { type: Number, default: 2024 },
  teamSize:           { type: Number, default: 1 },
  systemValuation:    { type: Number, default: 0 },
  currency:           { type: String, default: "SAR" },
  profitDistribution: { type: [{ roleType: String, percentage: Number, label: String }], default: [] },
  turnEnabled:        { type: Boolean, default: false },
  turnServers:        { type: [{ url: String, username: String, credential: String }], default: [] },
  metaPixelId:        { type: String, default: "" },
  tiktokPixelId:      { type: String, default: "" },
  snapPixelId:        { type: String, default: "" },
  ga4Id:              { type: String, default: "" },
  gtmId:              { type: String, default: "" },
  welcomeVideoUrl:    { type: String, default: "" },
  lastModifiedBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
qiroxSystemSettingsSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id.toString(); return ret; } });
export const QiroxSystemSettingsModel = mongoose.models.QiroxSystemSettings || mongoose.model("QiroxSystemSettings", qiroxSystemSettingsSchema);

const storePublishConfigSchema = new mongoose.Schema({
  siteUrl:            { type: String, default: "https://qiroxstudio.online" },
  appName:            { type: String, default: "QIROX Studio" },
  appNameAr:          { type: String, default: "كيروكس ستوديو" },
  appVersion:         { type: String, default: "1.0.0" },
  androidPackage:     { type: String, default: "" },
  androidFingerprint: { type: String, default: "" },
  huaweiPackage:      { type: String, default: "" },
  huaweiFingerprint:  { type: String, default: "" },
  appleTeamId:        { type: String, default: "" },
  appleBundleId:      { type: String, default: "" },
  msAppId:            { type: String, default: "" },
  playStoreUrl:       { type: String, default: "" },
  appStoreUrl:        { type: String, default: "" },
  huaweiStoreUrl:     { type: String, default: "" },
  msStoreUrl:         { type: String, default: "" },
  playStoreEnabled:   { type: Boolean, default: false },
  appStoreEnabled:    { type: Boolean, default: false },
  msStoreEnabled:     { type: Boolean, default: false },
  huaweiStoreEnabled: { type: Boolean, default: false },
}, { timestamps: true });
storePublishConfigSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const StorePublishConfigModel = mongoose.models.StorePublishConfig || mongoose.model("StorePublishConfig", storePublishConfigSchema);
