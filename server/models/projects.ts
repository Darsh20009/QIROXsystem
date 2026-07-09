import mongoose from "mongoose";
import { transform } from "./utils";

const projectSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ["new", "under_study", "pending_payment", "in_progress", "testing", "review", "delivery", "closed"], default: "new", required: true },
  progress: { type: Number, default: 0 },
  repoUrl: String,
  stagingUrl: String,
  productionUrl: String,
  deliveredAt: Date,
  startDate: Date,
  deadline: Date,
  usageGuide: {
    title: { type: String, default: "شرح استخدام النظام" },
    description: { type: String },
    files: [{ type: String }],
    updatedAt: { type: Date },
  },
  deliveryVideoUrl: String,
  deliveryFiles: [{ nameAr: String, url: String, icon: String }],
  projectFiles: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    fileType: { type: String, enum: ['identity', 'logo', 'commercial_reg', 'tax_reg', 'iban', 'contract', 'payment_proof', 'custom'], default: 'custom' },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });
projectSchema.set('toJSON', { transform });
projectSchema.set('toObject', { transform });
export const ProjectModel = mongoose.models.Project || mongoose.model("Project", projectSchema);

const taskSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: String,
  status: { type: String, default: "pending", required: true },
  priority: { type: String, default: "medium" },
  dueDate: Date,
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
}, { timestamps: true });
taskSchema.set('toJSON', { transform });
taskSchema.set('toObject', { transform });
export const TaskModel = mongoose.models.Task || mongoose.model("Task", taskSchema);

const projectMemberSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: String,
}, { timestamps: true });
projectMemberSchema.set('toJSON', { transform });
projectMemberSchema.set('toObject', { transform });
export const ProjectMemberModel = mongoose.models.ProjectMember || mongoose.model("ProjectMember", projectMemberSchema);

const messageSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  isInternal: { type: Boolean, default: false },
}, { timestamps: true });
messageSchema.set('toJSON', { transform });
messageSchema.set('toObject', { transform });
export const MessageModel = mongoose.models.Message || mongoose.model("Message", messageSchema);

const projectVaultSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  category: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  isSecret: { type: Boolean, default: false },
}, { timestamps: true });
projectVaultSchema.set('toJSON', { transform });
projectVaultSchema.set('toObject', { transform });
export const ProjectVaultModel = mongoose.models.ProjectVault || mongoose.model("ProjectVault", projectVaultSchema);

const checklistItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: String,
  done: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  category: { type: String, default: 'عام' },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  dueDate: Date,
  order: { type: Number, default: 0 },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignNote: { type: String, default: "" },
  personalGroup: { type: String, default: "" },
  tags: [{ type: String }],
  estimatedHours: { type: Number, default: 0 },
  attachments: [{ type: String }],
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  subTasks: [{ title: String, done: { type: Boolean, default: false } }],
  link: { type: String, default: "" },
}, { timestamps: true });
checklistItemSchema.set('toJSON', { transform });
checklistItemSchema.set('toObject', { transform });
export const ChecklistItemModel = mongoose.models.ChecklistItem || mongoose.model("ChecklistItem", checklistItemSchema);

const projectFeatureSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'feature' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'cancelled'], default: 'pending' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  order: { type: Number, default: 0 },
  startedAt: { type: Date },
  completedAt: { type: Date },
  startedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
projectFeatureSchema.set('toJSON', { transform });
projectFeatureSchema.set('toObject', { transform });
export const ProjectFeatureModel = mongoose.models.ProjectFeature || mongoose.model("ProjectFeature", projectFeatureSchema);

const projectIssueSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  resolvedAt: { type: Date },
  resolvedNote: { type: String, default: '' },
}, { timestamps: true });
projectIssueSchema.set('toJSON', { transform });
projectIssueSchema.set('toObject', { transform });
export const ProjectIssueModel = mongoose.models.ProjectIssue || mongoose.model("ProjectIssue", projectIssueSchema);

const meetingRequestSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String, default: '' },
  scheduledAt: { type: Date },
  meetingLink: { type: String, default: '' },
  duration: { type: Number, default: 60 },
  status: { type: String, enum: ['pending', 'scheduled', 'cancelled', 'completed'], default: 'pending' },
}, { timestamps: true });
meetingRequestSchema.set('toJSON', { transform });
meetingRequestSchema.set('toObject', { transform });
export const MeetingRequestModel = mongoose.models.MeetingRequest || mongoose.model("MeetingRequest", meetingRequestSchema);

const timeLogSchema = new mongoose.Schema({
  taskId:          { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true, index: true },
  projectId:       { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  description:     { type: String, default: "" },
  startedAt:       { type: Date, required: true },
  endedAt:         { type: Date, default: null },
  durationMinutes: { type: Number, default: 0 },
}, { timestamps: true });
timeLogSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const TimeLogModel = mongoose.models.TimeLog || mongoose.model("TimeLog", timeLogSchema);

const projectCommentSchema = new mongoose.Schema({
  projectId:    { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  body:         { type: String, required: true },
  isInternal:   { type: Boolean, default: false },
  pinned:       { type: Boolean, default: false },
  attachmentUrl: { type: String, default: "" },
}, { timestamps: true });
projectCommentSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const ProjectCommentModel = mongoose.models.ProjectComment || mongoose.model("ProjectComment", projectCommentSchema);

const clientDataRequestSchema = new mongoose.Schema({
  orderId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  projectId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  clientId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true },
  description: { type: String },
  priority:    { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  dueDate:     { type: Date },
  status:      { type: String, enum: ['pending', 'submitted', 'approved', 'revision_needed'], default: 'pending' },
  requestItems: [{
    label:    String,
    type:     { type: String, enum: ['file', 'image', 'text', 'link'], default: 'file' },
    required: { type: Boolean, default: false },
    hint:     String,
    accept:   String,
  }],
  response: {
    items:       { type: mongoose.Schema.Types.Mixed },
    notes:       String,
    submittedAt: Date,
  },
  adminNote: String,
}, { timestamps: true });
clientDataRequestSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id.toString(); return ret; } });
export const ClientDataRequestModel = mongoose.models.ClientDataRequest || mongoose.model("ClientDataRequest", clientDataRequestSchema);

const kanbanTaskSchema = new mongoose.Schema({
  title:          { type: String, required: true },
  description:    { type: String, default: "" },
  status:         { type: String, enum: ["new","under_study","pending_payment","in_progress","testing","review","delivery","closed"], default: "new" },
  priority:       { type: String, enum: ["low","medium","high","urgent"], default: "medium" },
  assignedTo:     { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  deadline:       { type: Date, default: null },
  templateType:   { type: String, enum: ["custom","website_plan"], default: "custom" },
  plan: {
    projectConcept:       { type: String, default: "" },
    techStack:            { type: String, default: "" },
    framework:            { type: String, default: "" },
    language:             { type: String, default: "" },
    database:             { type: String, default: "" },
    databaseDesign:       { type: String, default: "" },
    hosting:              { type: String, default: "" },
    deploymentStrategy:   { type: String, default: "" },
    domain:               { type: String, default: "" },
    serverIp:             { type: String, default: "" },
    githubRepo:           { type: String, default: "" },
    stagingUrl:           { type: String, default: "" },
    productionUrl:        { type: String, default: "" },
    sslEnabled:           { type: Boolean, default: false },
    mainFeatures:         { type: String, default: "" },
    targetAudience:       { type: String, default: "" },
    estimatedHours:       { type: String, default: "" },
    notes:                { type: String, default: "" },
  },
}, { timestamps: true });
kanbanTaskSchema.set("toJSON", { transform: (_: any, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const KanbanTaskModel = mongoose.models.KanbanTask || mongoose.model("KanbanTask", kanbanTaskSchema);
