import mongoose from "mongoose";
import { roles } from "@shared/schema";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: roles, default: "client", required: true },
  fullName: { type: String, required: true },
  phone: String,
  country: String,
  businessType: String,
  emailVerified: { type: Boolean, default: false },
  whatsappNumber: String,
  logoUrl: String,
}, { timestamps: true });

const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  priceMin: Number,
  priceMax: Number,
  estimatedDuration: String,
  features: [String],
  icon: String,
  portfolioImages: [String],
  portfolioUrl: String,
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  status: { type: String, default: "pending", required: true },
  // Smart Questionnaire Fields
  projectType: String,
  sector: String,
  competitors: String,
  visualStyle: String,
  favoriteExamples: String,
  requiredFunctions: String,
  requiredSystems: String,
  siteLanguage: String,
  whatsappIntegration: { type: Boolean, default: false },
  socialIntegration: { type: Boolean, default: false },
  hasLogo: { type: Boolean, default: false },
  needsLogoDesign: { type: Boolean, default: false },
  hasHosting: { type: Boolean, default: false },
  hasDomain: { type: Boolean, default: false },
  // Uploads (stored as arrays of file URLs)
  logoUrl: String,
  brandIdentityUrl: String,
  filesUrl: String,
  contentUrl: String,
  imagesUrl: String,
  videoUrl: String,
  accessCredentials: String,
  files: { type: mongoose.Schema.Types.Mixed },
  // Payment
  paymentMethod: { type: String, enum: ["bank_transfer", "paypal"] },
  paymentProofUrl: String,
  totalAmount: Number,
  isDepositPaid: { type: Boolean, default: false },
  requirements: { type: Map, of: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

const projectSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ["new", "under_study", "pending_payment", "in_progress", "testing", "review", "delivery", "closed"], default: "new", required: true },
  progress: { type: Number, default: 0 },
  repoUrl: String,
  stagingUrl: String,
  startDate: Date,
  deadline: Date,
}, { timestamps: true });

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

const projectMemberSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: String,
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  isInternal: { type: Boolean, default: false },
}, { timestamps: true });

const projectVaultSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  category: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  isSecret: { type: Boolean, default: false },
}, { timestamps: true });

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  checkIn: { type: Date, required: true },
  checkOut: Date,
  ipAddress: String,
  location: {
    lat: Number,
    lng: Number
  },
  workHours: Number,
}, { timestamps: true });

const transform = (doc: any, ret: any) => {
  ret.id = ret._id ? ret._id.toString() : ret.id;
  delete ret._id;
  delete ret.__v;
};

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  excerpt: String,
  imageUrl: String,
  authorId: { type: Number, required: true },
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  publishedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  requirements: [String],
  location: String,
  type: { type: String, default: "full-time" },
  salaryRange: String,
  status: { type: String, enum: ["open", "closed"], default: "open" },
}, { timestamps: true });

const applicationSchema = new mongoose.Schema({
  jobId: { type: Number, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  resumeUrl: String,
  technicalScore: Number,
  internalEvaluation: String,
  status: { type: String, default: "new" },
  appliedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const sectorTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameAr: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  descriptionAr: { type: String, required: true },
  category: { type: String, required: true },
  icon: String,
  features: [String],
  featuresAr: [String],
  tags: [String],
  priceMin: Number,
  priceMax: Number,
  currency: { type: String, default: "SAR" },
  estimatedDuration: String,
  status: { type: String, enum: ["active", "coming_soon", "archived"], default: "active" },
  sortOrder: { type: Number, default: 0 },
  demoUrl: String,
  heroColor: String,
}, { timestamps: true });

const pricingPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameAr: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  descriptionAr: String,
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  offerLabel: { type: String },
  currency: { type: String, default: "SAR" },
  billingCycle: { type: String, enum: ["monthly", "yearly", "one_time"], default: "one_time" },
  features: [String],
  featuresAr: [String],
  addonsAr: [String],
  maxProjects: Number,
  isPopular: { type: Boolean, default: false },
  isCustom: { type: Boolean, default: false },
  status: { type: String, enum: ["active", "archived"], default: "active" },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

const partnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameAr: String,
  logoUrl: { type: String, required: true },
  websiteUrl: String,
  category: String,
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const modificationRequestSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  projectId: String,
  orderId: String,
  title: { type: String, required: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['pending', 'in_review', 'in_progress', 'completed', 'rejected'], default: 'pending' },
  adminNotes: String,
  attachments: [String],
}, { timestamps: true });

[userSchema, attendanceSchema, serviceSchema, orderSchema, projectSchema, taskSchema, messageSchema, projectVaultSchema, projectMemberSchema, newsSchema, jobSchema, applicationSchema, sectorTemplateSchema, pricingPlanSchema, partnerSchema, modificationRequestSchema].forEach(s => {
  s.set('toJSON', { transform });
  s.set('toObject', { transform });
});

export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
export const AttendanceModel = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
export const ServiceModel = mongoose.models.Service || mongoose.model("Service", serviceSchema);
export const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);
export const ProjectModel = mongoose.models.Project || mongoose.model("Project", projectSchema);
export const TaskModel = mongoose.models.Task || mongoose.model("Task", taskSchema);
export const MessageModel = mongoose.models.Message || mongoose.model("Message", messageSchema);
export const ProjectVaultModel = mongoose.models.ProjectVault || mongoose.model("ProjectVault", projectVaultSchema);
export const ProjectMemberModel = mongoose.models.ProjectMember || mongoose.model("ProjectMember", projectMemberSchema);
export const NewsModel = mongoose.models.News || mongoose.model("News", newsSchema);
export const JobModel = mongoose.models.Job || mongoose.model("Job", jobSchema);
export const ApplicationModel = mongoose.models.Application || mongoose.model("Application", applicationSchema);
export const SectorTemplateModel = mongoose.models.SectorTemplate || mongoose.model("SectorTemplate", sectorTemplateSchema);
export const PricingPlanModel = mongoose.models.PricingPlan || mongoose.model("PricingPlan", pricingPlanSchema);
export const PartnerModel = mongoose.models.Partner || mongoose.model("Partner", partnerSchema);
export const ModificationRequestModel = mongoose.models.ModificationRequest || mongoose.model("ModificationRequest", modificationRequestSchema);
