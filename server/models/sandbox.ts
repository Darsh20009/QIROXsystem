import mongoose from "mongoose";

const sandboxProjectSchema = new mongoose.Schema({
  ownerId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name:        { type: String, required: true },
  nameAr:      { type: String, default: "" },
  description: { type: String, default: "" },
  template:    { type: String, default: "blank" },
  runtime:     { type: String, enum: ["node", "static", "python"], default: "node" },
  port:        { type: Number, default: null },
  status:      { type: String, enum: ["stopped", "running", "error", "building"], default: "stopped" },
  entryFile:   { type: String, default: "index.js" },
  installCmd:  { type: String, default: "npm install" },
  startCmd:    { type: String, default: "node index.js" },
  buildCmd:    { type: String, default: "" },
  githubRepo:  { type: String, default: "" },
  githubBranch:{ type: String, default: "main" },
  lastStartedAt: { type: Date, default: null },
  lastStoppedAt: { type: Date, default: null },
  diskUsageMB: { type: Number, default: 0 },
  maxDiskMB:   { type: Number, default: 100 },
  isPublic:    { type: Boolean, default: false },
  tags:        { type: [String], default: [] },
}, { timestamps: true });
sandboxProjectSchema.index({ ownerId: 1, createdAt: -1 });
export const SandboxProjectModel = mongoose.models.SandboxProject || mongoose.model("SandboxProject", sandboxProjectSchema);

const sandboxEnvVarSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "SandboxProject", required: true, index: true },
  key:       { type: String, required: true },
  value:     { type: String, required: true },
  iv:        { type: String, required: true },
}, { timestamps: true });
sandboxEnvVarSchema.index({ projectId: 1, key: 1 }, { unique: true });
export const SandboxEnvVarModel = mongoose.models.SandboxEnvVar || mongoose.model("SandboxEnvVar", sandboxEnvVarSchema);

const sandboxFileSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "SandboxProject", required: true, index: true },
  path:      { type: String, required: true },
  type:      { type: String, enum: ["file", "directory"], default: "file" },
  content:   { type: String, default: "" },
  size:      { type: Number, default: 0 },
  mimeType:  { type: String, default: "" },
  hash:      { type: String, default: "" },
  syncedAt:  { type: Date, default: null },
}, { timestamps: true });
sandboxFileSchema.index({ projectId: 1, path: 1 }, { unique: true });
export const SandboxFileModel = mongoose.models.SandboxFile || mongoose.model("SandboxFile", sandboxFileSchema);

const sandboxDeploymentSchema = new mongoose.Schema({
  projectId:  { type: mongoose.Schema.Types.ObjectId, ref: "SandboxProject", required: true, index: true },
  deployedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  version:    { type: String, default: "1.0.0" },
  status:     { type: String, enum: ["pending", "building", "live", "failed", "stopped"], default: "pending" },
  url:        { type: String, default: "" },
  port:       { type: Number, default: null },
  buildLog:   { type: String, default: "" },
  errorLog:   { type: String, default: "" },
  startedAt:  { type: Date, default: null },
  stoppedAt:  { type: Date, default: null },
}, { timestamps: true });
sandboxDeploymentSchema.index({ projectId: 1, createdAt: -1 });
export const SandboxDeploymentModel = mongoose.models.SandboxDeployment || mongoose.model("SandboxDeployment", sandboxDeploymentSchema);
