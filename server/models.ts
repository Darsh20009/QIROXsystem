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
  subscriptionSegmentId: String,
  subscriptionSegmentNameAr: String,
  subscriptionPeriod: { type: String, enum: ["monthly", "6months", "annual", "renewal"], default: null },
  subscriptionStartDate: Date,
  subscriptionExpiresAt: Date,
  subscriptionStatus: { type: String, enum: ["active", "expired", "none"], default: "none" },
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
  // Assignment
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminNotes: String,
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

const qiroxProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameAr: { type: String, required: true },
  description: String,
  descriptionAr: String,
  category: { type: String, enum: ['device', 'domain', 'email', 'hosting', 'gift', 'software', 'other'], required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'SAR' },
  images: [String],
  serviceSlug: String,
  badge: String,
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  specs: { type: mongoose.Schema.Types.Mixed },
  stock: { type: Number, default: -1 },
  displayOrder: { type: Number, default: 0 },
}, { timestamps: true });

const cartItemSchema = new mongoose.Schema({
  type: { type: String, enum: ['service', 'product', 'domain', 'email', 'hosting', 'gift'], required: true },
  refId: String,
  name: { type: String, required: true },
  nameAr: String,
  price: { type: Number, required: true },
  qty: { type: Number, default: 1 },
  config: { type: mongoose.Schema.Types.Mixed },
  imageUrl: String,
}, { _id: true });

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
  couponCode: String,
  discountAmount: { type: Number, default: 0 },
}, { timestamps: true });

const orderSpecsSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },

  // === PROJECT INFO ===
  projectName: String,
  clientEmail: String,
  totalBudget: Number,
  paidAmount: Number,
  projectStatus: { type: String, default: "planning" }, // planning, in_dev, testing, delivery, closed

  // === TECH STACK ===
  techStack: String,
  database: String,
  hosting: String,
  framework: String,
  language: String,

  // === INFRASTRUCTURE / DEVOPS ===
  githubRepoUrl: String,
  databaseUri: String,
  serverIp: String,
  deploymentUsername: String,
  deploymentPassword: String,
  customDomain: String,
  stagingUrl: String,
  productionUrl: String,
  sslEnabled: { type: Boolean, default: false },
  cdnEnabled: { type: Boolean, default: false },

  // === ENVIRONMENT VARIABLES ===
  variables: String,

  // === PROJECT CONCEPT ===
  projectConcept: String,
  targetAudience: String,
  mainFeatures: String,
  referenceLinks: String,
  colorPalette: String,

  // === TIMELINE ===
  estimatedHours: Number,
  deadline: Date,
  startDate: Date,

  // === NOTES ===
  notes: String,
  teamNotes: String,

  // === LEGACY COMPAT ===
  technologies: [String],
  features: [String],
  clientBrief: String,
  projectIdeas: String,
  customVars: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
  type: { type: String, enum: ["email_verify", "forgot_password"], default: "forgot_password" },
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['order', 'message', 'status', 'payment', 'system'], default: 'system' },
  title: { type: String, required: true },
  body: { type: String, required: true },
  link: String,
  read: { type: Boolean, default: false },
  icon: String,
}, { timestamps: true });

const inboxMessageSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  read: { type: Boolean, default: false },
  attachmentUrl: String,
}, { timestamps: true });

const invoiceSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  vatAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['unpaid', 'paid', 'cancelled'], default: 'unpaid' },
  dueDate: Date,
  paidAt: Date,
  notes: String,
  items: [{ name: String, qty: Number, unitPrice: Number, total: Number }],
}, { timestamps: true });

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: String,
  details: { type: mongoose.Schema.Types.Mixed },
  ip: String,
}, { timestamps: true });

const supportTicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  category: { type: String, enum: ['technical', 'billing', 'general', 'complaint'], default: 'general' },
  body: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['open', 'in_review', 'resolved', 'closed'], default: 'open' },
  adminReply: String,
  repliedAt: Date,
  closedAt: Date,
}, { timestamps: true });

const employeeProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bio: String,
  skills: [String],
  hourlyRate: { type: Number, default: 0 },
  vacationDays: { type: Number, default: 21 },
  vacationUsed: { type: Number, default: 0 },
  bankName: String,
  bankAccount: String,
  bankIBAN: String,
  nationalId: String,
  hireDate: Date,
  jobTitle: String,
}, { timestamps: true });

const payrollRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  workHours: { type: Number, default: 0 },
  hourlyRate: { type: Number, default: 0 },
  baseSalary: { type: Number, default: 0 },
  bonuses: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  netSalary: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'paid'], default: 'pending' },
  paidAt: Date,
  notes: String,
}, { timestamps: true });

const receiptVoucherSchema = new mongoose.Schema({
  receiptNumber: { type: String, required: true, unique: true },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  amountInWords: { type: String },
  paymentMethod: { type: String, enum: ['bank_transfer', 'cash', 'paypal', 'stc_pay', 'apple_pay', 'other'], default: 'bank_transfer' },
  paymentRef: { type: String },
  description: { type: String },
  receivedBy: { type: String },
  notes: { type: String },
  status: { type: String, enum: ['issued', 'cancelled'], default: 'issued' },
}, { timestamps: true });

const pushSubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  userAgent: String,
}, { timestamps: true });

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
}, { timestamps: true });

const bankSettingsSchema = new mongoose.Schema({
  key: { type: String, default: "main", unique: true },
  bankName: { type: String, default: "بنك الراجحي" },
  beneficiaryName: { type: String, default: "QIROX Studio" },
  iban: { type: String, default: "SA0380205098017222121010" },
  accountNumber: { type: String, default: "" },
  swiftCode: { type: String, default: "" },
  currency: { type: String, default: "SAR" },
  notes: { type: String, default: "" },
}, { timestamps: true });

const segmentPricingSchema = new mongoose.Schema({
  segmentKey: { type: String, required: true, unique: true },
  segmentNameAr: { type: String, required: true },
  monthlyPrice: { type: Number, default: 0 },
  sixMonthPrice: { type: Number, default: 0 },
  annualPrice: { type: Number, default: 0 },
  renewalPrice: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  notes: { type: String, default: "" },
}, { timestamps: true });

const subServiceRequestSchema = new mongoose.Schema({
  clientId: { type: String, required: true },
  projectId: { type: String },
  projectLabel: { type: String },
  serviceType: { type: String, required: true },
  notes: { type: String, default: "" },
  status: { type: String, enum: ["pending", "reviewing", "approved", "rejected"], default: "pending" },
  adminNotes: { type: String, default: "" },
}, { timestamps: true });

[userSchema, attendanceSchema, serviceSchema, orderSchema, projectSchema, taskSchema, messageSchema, projectVaultSchema, projectMemberSchema, newsSchema, jobSchema, applicationSchema, sectorTemplateSchema, pricingPlanSchema, partnerSchema, modificationRequestSchema, qiroxProductSchema, cartSchema, orderSpecsSchema, otpSchema, notificationSchema, inboxMessageSchema, invoiceSchema, activityLogSchema, supportTicketSchema, employeeProfileSchema, payrollRecordSchema, receiptVoucherSchema, pushSubscriptionSchema, checklistItemSchema, bankSettingsSchema, segmentPricingSchema, subServiceRequestSchema].forEach(s => {
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
export const QiroxProductModel = mongoose.models.QiroxProduct || mongoose.model("QiroxProduct", qiroxProductSchema);
export const CartModel = mongoose.models.Cart || mongoose.model("Cart", cartSchema);
export const OrderSpecsModel = mongoose.models.OrderSpecs || mongoose.model("OrderSpecs", orderSpecsSchema);
export const OtpModel = mongoose.models.Otp || mongoose.model("Otp", otpSchema);
export const NotificationModel = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
export const InboxMessageModel = mongoose.models.InboxMessage || mongoose.model("InboxMessage", inboxMessageSchema);
export const InvoiceModel = mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);
export const ActivityLogModel = mongoose.models.ActivityLog || mongoose.model("ActivityLog", activityLogSchema);
export const SupportTicketModel = mongoose.models.SupportTicket || mongoose.model("SupportTicket", supportTicketSchema);
export const EmployeeProfileModel = mongoose.models.EmployeeProfile || mongoose.model("EmployeeProfile", employeeProfileSchema);
export const PayrollRecordModel = mongoose.models.PayrollRecord || mongoose.model("PayrollRecord", payrollRecordSchema);
export const ReceiptVoucherModel = mongoose.models.ReceiptVoucher || mongoose.model("ReceiptVoucher", receiptVoucherSchema);
export const PushSubscriptionModel = mongoose.models.PushSubscription || mongoose.model("PushSubscription", pushSubscriptionSchema);
export const ChecklistItemModel = mongoose.models.ChecklistItem || mongoose.model("ChecklistItem", checklistItemSchema);
export const BankSettingsModel = mongoose.models.BankSettings || mongoose.model("BankSettings", bankSettingsSchema);
export const SegmentPricingModel = mongoose.models.SegmentPricing || mongoose.model("SegmentPricing", segmentPricingSchema);
export const SubServiceRequestModel = mongoose.models.SubServiceRequest || mongoose.model("SubServiceRequest", subServiceRequestSchema);
