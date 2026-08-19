import mongoose from "mongoose";

const deploymentProjectSchema = new mongoose.Schema({
  name:                { type: String, required: true },
  slug:                { type: String, required: true, unique: true, index: true },
  description:         { type: String, default: "" },
  githubOwner:         { type: String, required: true },
  githubRepo:          { type: String, required: true },
  githubBranch:        { type: String, default: "main" },
  githubRepoId:        { type: String, default: "" },
  buildCommand:        { type: String, default: "npm run build" },
  startCommand:        { type: String, default: "npm start" },
  outputDir:           { type: String, default: "dist" },
  nodeVersion:         { type: String, default: "20" },
  framework:           { type: String, default: "auto" },
  serviceType:         { type: String, default: "web" },
  envVars:             [{ key: String, value: String, isSecret: { type: Boolean, default: false } }],
  domain:              { type: String, default: "" },
  customDomain:        { type: String, default: "" },
  status:              { type: String, enum: ["idle", "building", "deploying", "live", "failed", "suspended"], default: "idle" },
  githubToken:         { type: String, default: "" },
  autoDeploy:          { type: Boolean, default: true },
  region:              { type: String, default: "me-1" },
  plan:                { type: String, enum: ["free", "starter", "pro", "enterprise"], default: "starter" },
  ownerId:             { type: String, required: true },
  ownerName:           { type: String, default: "" },
  lastDeployAt:        { type: Date, default: null },
  deployCount:         { type: Number, default: 0 },
  avatarColor:         { type: String, default: "" },
  logoUrl:             { type: String, default: "" },
  documentation:       { type: String, default: "" },
  isSimulated:         { type: Boolean, default: false },
  vercelProjectId:     { type: String, default: "" },
  vercelDeploymentId:  { type: String, default: "" },
}, { timestamps: true });
deploymentProjectSchema.set("toJSON", { transform: (_: any, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const DeploymentProjectModel = mongoose.models.DeploymentProject || mongoose.model("DeploymentProject", deploymentProjectSchema);

const deploymentRunSchema = new mongoose.Schema({
  projectId:    { type: mongoose.Schema.Types.ObjectId, ref: "DeploymentProject", required: true, index: true },
  projectSlug:  { type: String, required: true },
  projectName:  { type: String, required: true },
  status:       { type: String, enum: ["queued", "building", "deploying", "success", "failed", "cancelled"], default: "queued" },
  triggeredBy:  { type: String, default: "manual" },
  commitSha:    { type: String, default: "" },
  commitMsg:    { type: String, default: "" },
  branch:       { type: String, default: "main" },
  logs:         [{ time: Date, level: String, message: String }],
  buildDuration: { type: Number, default: 0 },
  error:         { type: String, default: "" },
  aiFixSuggestion: { type: String, default: "" },
  startedAt:    { type: Date, default: null },
  completedAt:  { type: Date, default: null },
}, { timestamps: true });
deploymentRunSchema.set("toJSON", { transform: (_: any, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const DeploymentRunModel = mongoose.models.DeploymentRun || mongoose.model("DeploymentRun", deploymentRunSchema);
