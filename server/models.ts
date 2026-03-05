import mongoose from "mongoose";
import { roles } from "@shared/schema";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, default: "" },
  email: { type: String, required: true, unique: true },
  googleId: { type: String, sparse: true, index: true },
  googleAvatarUrl: String,
  role: { type: String, enum: [...roles], default: "client", required: true },
  fullName: { type: String, required: true },
  phone: String,
  country: String,
  businessType: String,
  emailVerified: { type: Boolean, default: false },
  whatsappNumber: String,
  logoUrl: String,
  avatarUrl: String,
  subscriptionSegmentId: String,
  subscriptionSegmentNameAr: String,
  subscriptionPeriod: { type: String, enum: ["monthly", "6months", "annual", "renewal"], default: null },
  subscriptionStartDate: Date,
  subscriptionExpiresAt: Date,
  subscriptionStatus: { type: String, enum: ["active", "expired", "none", "suspended"], default: "none" },
  walletCardNumber: { type: String, unique: true, sparse: true },
  walletPin: { type: String },
  walletCardActive: { type: Boolean, default: false },
  // ── Enhanced Profile Fields ──
  jobTitle: { type: String, default: "" },
  bio: { type: String, default: "" },
  profilePhotoUrl: { type: String, default: "" },
  additionalRoles: { type: [String], default: [] },
  trustedIp: String,
  trustedUntil: Date,
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
  // Plan info (from order flow)
  serviceType: String,
  planTier: { type: String, enum: ['lite', 'pro', 'infinite', 'lifetime'] },
  planPeriod: { type: String, enum: ['monthly', 'sixmonth', 'annual', 'lifetime'] },
  planSegment: String,
  businessName: String,
  phone: String,
  notes: String,
  items: { type: mongoose.Schema.Types.Mixed },
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
  paymentMethod: { type: String, enum: ["bank_transfer", "paypal", "wallet", "mixed", "stc_pay", "apple_pay", "cash", "other"] },
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
  location: { lat: Number, lng: Number },
  locationHistory: [{ lat: Number, lng: Number, timestamp: Date }],
  workHours: Number,
  checkInNotes: { type: String, default: "" },
  checkOutNotes: { type: String, default: "" },
  achievements: { type: String, default: "" },
  activeMinutes: { type: Number, default: 0 },
  lastActivityAt: Date,
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

const jobQuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, enum: ["text", "textarea", "select", "radio", "checkbox"], default: "text" },
  required: { type: Boolean, default: false },
  options: [String],
}, { _id: false });

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  requirements: [String],
  location: String,
  type: { type: String, default: "full-time" },
  salaryRange: String,
  status: { type: String, enum: ["open", "closed", "paused"], default: "open" },
  questions: { type: [jobQuestionSchema], default: [] },
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
  price: { type: Number, default: 0 },
  originalPrice: { type: Number },
  offerLabel: { type: String },
  currency: { type: String, default: "SAR" },
  billingCycle: { type: String, enum: ["monthly", "sixmonth", "yearly", "lifetime", "one_time"], default: "lifetime" },
  tier: { type: String, enum: ["lite", "pro", "infinite", "custom"], default: "pro" },
  segment: { type: String, enum: ["restaurant", "ecommerce", "education", "corporate", "realestate", "healthcare", "general"], default: "general" },
  monthlyPrice: { type: Number, default: 0 },
  sixMonthPrice: { type: Number, default: 0 },
  annualPrice: { type: Number, default: 0 },
  lifetimePrice: { type: Number, default: 0 },
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
  features: { type: [String], default: [] },
  featuresAr: { type: [String], default: [] },
  relatedService: { type: String, default: "" },
  description: { type: String, default: "" },
  descriptionAr: { type: String, default: "" },
}, { timestamps: true });

const modificationRequestSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  projectId: String,
  orderId: String,
  title: { type: String, required: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['pending', 'in_review', 'in_progress', 'completed', 'rejected', 'cancelled'], default: 'pending' },
  adminNotes: String,
  attachments: [String],
  modificationTypeId: String,
  modificationPrice: Number,
}, { timestamps: true });

const modPlanConfigSchema = new mongoose.Schema({
  planTier: { type: String, enum: ['lite', 'pro', 'infinite'], required: true },
  planPeriod: { type: String, enum: ['monthly', 'sixmonth', 'annual'], required: true },
  modificationsPerPeriod: { type: Number, required: true, default: 5 },
  quotaMonths: { type: Number, required: true, default: 1 },
  isActive: { type: Boolean, default: true },
  notes: { type: String, default: "" },
}, { timestamps: true });

const modTypePriceSchema = new mongoose.Schema({
  nameAr: { type: String, required: true },
  name: { type: String, default: "" },
  description: { type: String, default: "" },
  price: { type: Number, required: true, max: 50 },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

const modQuotaAddonSchema = new mongoose.Schema({
  clientId: { type: String, required: true },
  orderId: { type: String, required: true },
  validFrom: Date,
  validUntil: Date,
  price: { type: Number, default: 1000 },
  status: { type: String, enum: ['pending', 'active', 'expired', 'rejected'], default: 'pending' },
  paymentProofUrl: { type: String, default: "" },
  adminNotes: { type: String, default: "" },
}, { timestamps: true });

const qiroxProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameAr: { type: String, required: true },
  description: String,
  descriptionAr: String,
  category: { type: String, enum: ['device', 'domain', 'email', 'hosting', 'gift', 'software', 'other'], required: true },
  price: { type: Number, required: true },
  comparePrice: { type: Number },
  discount: { type: Number, default: 0 },
  currency: { type: String, default: 'SAR' },
  images: [String],
  serviceSlug: String,
  badge: String,
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  specs: { type: mongoose.Schema.Types.Mixed },
  stock: { type: Number, default: -1 },
  displayOrder: { type: Number, default: 0 },
  weight: { type: Number },
  dimensions: String,
  brand: String,
  model: String,
  warrantyMonths: { type: Number, default: 0 },
  linkedPlanSlug: String,
  requiresShipping: { type: Boolean, default: false },
  shippingProviders: [{
    companyId:   { type: String, required: true },
    nameAr:      String,
    customPrice: Number,
    customOutsideCityPrice: Number,
    isActive:    { type: Boolean, default: true },
  }],
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
  type: { type: String, enum: ["email_verify", "forgot_password", "login_otp"], default: "forgot_password" },
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  forAdmins: { type: Boolean, default: false },
  type: { type: String, enum: ['order', 'message', 'status', 'payment', 'system', 'info', 'success', 'error', 'warning', 'task', 'project'], default: 'system' },
  title: { type: String, required: true },
  body: { type: String, default: '' },
  link: String,
  read: { type: Boolean, default: false },
  icon: String,
}, { timestamps: true });

const inboxMessageSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
  csSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CsSession', index: true },
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  body: { type: String, default: "" },
  read: { type: Boolean, default: false },
  attachmentUrl: String,
  attachmentType: { type: String, enum: ["image", "file", "voice", null] },
  attachmentName: String,
  attachmentSize: Number,
  isAutoMessage: { type: Boolean, default: false },
  autoSender: { type: String, default: "" },
  deletedBy: [{ type: String }],
}, { timestamps: true });

const csSessionSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['waiting', 'active', 'closed'], default: 'waiting' },
  subject: { type: String, default: "" },
  transferNote: { type: String, default: "" },
  previousAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  closedAt: Date,
  rating: { type: Number, min: 1, max: 5, default: null },
  ratingNote: { type: String, default: "" },
  lastMessageAt: { type: Date, default: Date.now },
  isUrgent: { type: Boolean, default: false },
  urgentNotifiedAt: { type: Date, default: null },
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
  salaryType: { type: String, enum: ['fixed', 'hourly', 'commission'], default: 'hourly' },
  fixedSalary: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 0 },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
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
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignNote: { type: String, default: "" },
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

const orderExpenseSchema = new mongoose.Schema({
  orderId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  category:    { type: String, enum: ['hosting', 'domain', 'freelancer', 'license', 'ads', 'design', 'salary', 'commission', 'other'], default: 'other' },
  description: { type: String, required: true },
  amount:      { type: Number, required: true },
  currency:    { type: String, default: 'SAR' },
  addedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

[userSchema, attendanceSchema, serviceSchema, orderSchema, projectSchema, taskSchema, messageSchema, projectVaultSchema, projectMemberSchema, newsSchema, jobSchema, applicationSchema, sectorTemplateSchema, pricingPlanSchema, partnerSchema, modificationRequestSchema, modPlanConfigSchema, modTypePriceSchema, modQuotaAddonSchema, qiroxProductSchema, cartSchema, orderSpecsSchema, otpSchema, notificationSchema, inboxMessageSchema, csSessionSchema, invoiceSchema, activityLogSchema, supportTicketSchema, employeeProfileSchema, payrollRecordSchema, receiptVoucherSchema, pushSubscriptionSchema, checklistItemSchema, bankSettingsSchema, segmentPricingSchema, subServiceRequestSchema, orderExpenseSchema].forEach(s => {
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
export const ModPlanConfigModel = mongoose.models.ModPlanConfig || mongoose.model("ModPlanConfig", modPlanConfigSchema);
export const ModTypePriceModel = mongoose.models.ModTypePrice || mongoose.model("ModTypePrice", modTypePriceSchema);
export const ModQuotaAddonModel = mongoose.models.ModQuotaAddon || mongoose.model("ModQuotaAddon", modQuotaAddonSchema);
export const QiroxProductModel = mongoose.models.QiroxProduct || mongoose.model("QiroxProduct", qiroxProductSchema);
export const CartModel = mongoose.models.Cart || mongoose.model("Cart", cartSchema);
export const OrderSpecsModel = mongoose.models.OrderSpecs || mongoose.model("OrderSpecs", orderSpecsSchema);
export const OtpModel = mongoose.models.Otp || mongoose.model("Otp", otpSchema);
export const NotificationModel = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
export const InboxMessageModel = mongoose.models.InboxMessage || mongoose.model("InboxMessage", inboxMessageSchema);
export const CsSessionModel = mongoose.models.CsSession || mongoose.model("CsSession", csSessionSchema);
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
export const OrderExpenseModel = mongoose.models.OrderExpense || mongoose.model("OrderExpense", orderExpenseSchema);

const marketingPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  imageUrl: { type: String, required: true },
  platform: { type: String, default: "instagram" },
  status: { type: String, default: "published" },
  uploadedBy: String,
  createdAt: { type: Date, default: Date.now },
});
export const MarketingPostModel = mongoose.models.MarketingPost || mongoose.model("MarketingPost", marketingPostSchema);

const consultationSlotSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employeeName: { type: String, required: true },
  title: { type: String, required: true },
  titleAr: { type: String, required: true },
  description: String,
  daysOfWeek: [{ type: Number }],
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  slotDurationMinutes: { type: Number, default: 30 },
  maxBookingsPerSlot: { type: Number, default: 1 },
  price: { type: Number, default: 0 },
  currency: { type: String, default: 'SAR' },
  isActive: { type: Boolean, default: true },
  consultationType: { type: String, enum: ['video', 'phone', 'in_person', 'any'], default: 'any' },
  color: { type: String, default: '#000000' },
  validFrom: Date,
  validUntil: Date,
}, { timestamps: true });

const consultationBookingSchema = new mongoose.Schema({
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'ConsultationSlot' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  clientName: { type: String, required: true },
  clientEmail: { type: String, required: true },
  clientPhone: String,
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  employeeName: String,
  date: Date,
  startTime: String,
  endTime: String,
  status: { type: String, enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'], default: 'pending' },
  consultationType: { type: String, enum: ['video', 'phone', 'in_person', 'any'], default: 'phone' },
  topic: String,
  notes: String,
  meetingLink: String,
  adminNotes: String,
  price: { type: Number, default: 0 },
  isPaid: { type: Boolean, default: false },
}, { timestamps: true });

const discountCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  description: String,
  descriptionAr: String,
  type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  value: { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscountAmount: { type: Number },
  usageLimit: { type: Number },
  usageCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isGlobal: { type: Boolean, default: false },
  showOnHome: { type: Boolean, default: false },
  appliesTo: { type: String, enum: ['all', 'products', 'packages', 'devices'], default: 'all' },
  expiresAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bannerText: String,
  bannerTextAr: String,
  bannerColor: { type: String, default: '#000000' },
}, { timestamps: true });

const deviceShipmentSchema = new mongoose.Schema({
  cartOrderId: String,
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientName: String,
  clientEmail: String,
  clientPhone: String,
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'QiroxProduct', required: true },
  productName: String,
  quantity: { type: Number, default: 1 },
  totalPrice: Number,
  shippingAddress: {
    name: String,
    phone: String,
    city: String,
    district: String,
    street: String,
    postalCode: String,
    country: { type: String, default: 'SA' },
  },
  status: { type: String, enum: ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'], default: 'pending' },
  trackingNumber: String,
  courierName: String,
  courierUrl: String,
  estimatedDelivery: Date,
  deliveredAt: Date,
  adminNotes: String,
  statusHistory: [{ status: String, note: String, timestamp: { type: Date, default: Date.now } }],
}, { timestamps: true });

const shippingCompanySchema = new mongoose.Schema({
  name:              { type: String, required: true },
  nameAr:            { type: String, required: true },
  logo:              { type: String, default: "🚚" },
  color:             { type: String, default: "#000000" },
  basePrice:         { type: Number, default: 0 },
  outsideCityPrice:  { type: Number, default: 0 },
  estimatedDays:     { type: String, default: "2-3 أيام" },
  outsideCityDays:   { type: String, default: "3-5 أيام" },
  trackingUrlTemplate: { type: String, default: "" },
  regions: { type: [String], default: ["riyadh"] },
  notes:   { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

const countrySchema = new mongoose.Schema({
  nameAr:       { type: String, required: true },
  nameEn:       { type: String, required: true },
  code:         { type: String, required: true, unique: true, uppercase: true },
  flag:         { type: String, default: "🌍" },
  phoneCode:    { type: String, default: "" },
  currency:     { type: String, default: "" },
  currencyAr:   { type: String, default: "" },
  continent:    { type: String, default: "آسيا" },
  isActive:     { type: Boolean, default: true },
  sortOrder:    { type: Number, default: 0 },
}, { timestamps: true });

[consultationSlotSchema, consultationBookingSchema, discountCodeSchema, deviceShipmentSchema, shippingCompanySchema, countrySchema].forEach(s => {
  s.set('toJSON', { transform });
  s.set('toObject', { transform });
});

export const ConsultationSlotModel = mongoose.models.ConsultationSlot || mongoose.model("ConsultationSlot", consultationSlotSchema);
export const ConsultationBookingModel = mongoose.models.ConsultationBooking || mongoose.model("ConsultationBooking", consultationBookingSchema);
export const DiscountCodeModel = mongoose.models.DiscountCode || mongoose.model("DiscountCode", discountCodeSchema);
export const DeviceShipmentModel = mongoose.models.DeviceShipment || mongoose.model("DeviceShipment", deviceShipmentSchema);
export const ShippingCompanyModel = mongoose.models.ShippingCompany || mongoose.model("ShippingCompany", shippingCompanySchema);
export const CountryModel = mongoose.models.Country || mongoose.model("Country", countrySchema);

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

const systemFeatureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameAr: { type: String, default: "" },
  description: { type: String, default: "" },
  icon: { type: String, default: "Star" },
  isInLite: { type: Boolean, default: false },
  isInPro: { type: Boolean, default: true },
  isInInfinite: { type: Boolean, default: true },
  category: { type: String, default: "general" },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const extraAddonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameAr: { type: String, required: true },
  description: { type: String, default: "" },
  descriptionAr: { type: String, default: "" },
  icon: { type: String, default: "Plus" },
  price: { type: Number, required: true },
  currency: { type: String, default: "SAR" },
  category: { type: String, default: "feature" },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

[cronJobSchema, atlasConfigSchema, atlasDbUserSchema, appPublishConfigSchema, systemFeatureSchema, extraAddonSchema].forEach(s => {
  s.set('toJSON', { transform });
  s.set('toObject', { transform });
});

export const CronJobModel = mongoose.models.CronJob || mongoose.model("CronJob", cronJobSchema);
export const AtlasConfigModel = mongoose.models.AtlasConfig || mongoose.model("AtlasConfig", atlasConfigSchema);
export const AtlasDbUserModel = mongoose.models.AtlasDbUser || mongoose.model("AtlasDbUser", atlasDbUserSchema);
export const AppPublishConfigModel = mongoose.models.AppPublishConfig || mongoose.model("AppPublishConfig", appPublishConfigSchema);
export const SystemFeatureModel = mongoose.models.SystemFeature || mongoose.model("SystemFeature", systemFeatureSchema);
export const ExtraAddonModel = mongoose.models.ExtraAddon || mongoose.model("ExtraAddon", extraAddonSchema);

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

[projectFeatureSchema, projectIssueSchema, meetingRequestSchema].forEach(s => {
  s.set('toJSON', { transform });
  s.set('toObject', { transform });
});

export const ProjectFeatureModel = mongoose.models.ProjectFeature || mongoose.model("ProjectFeature", projectFeatureSchema);
export const ProjectIssueModel = mongoose.models.ProjectIssue || mongoose.model("ProjectIssue", projectIssueSchema);
export const MeetingRequestModel = mongoose.models.MeetingRequest || mongoose.model("MeetingRequest", meetingRequestSchema);

const walletTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['debit', 'credit'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note: { type: String, default: '' },
}, { timestamps: true });

walletTransactionSchema.set('toJSON', { transform });
walletTransactionSchema.set('toObject', { transform });

export const WalletTransactionModel = mongoose.models.WalletTransaction || mongoose.model("WalletTransaction", walletTransactionSchema);

const walletTopupSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  bankName: { type: String },
  bankRef: { type: String },
  note: { type: String },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
}, { timestamps: true });

walletTopupSchema.set('toJSON', { transform });
walletTopupSchema.set('toObject', { transform });

export const WalletTopupModel = mongoose.models.WalletTopup || mongoose.model("WalletTopup", walletTopupSchema);

const walletPayOtpSchema = new mongoose.Schema({
  cardOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
}, { timestamps: true });

walletPayOtpSchema.set('toJSON', { transform });
walletPayOtpSchema.set('toObject', { transform });

export const WalletPayOtpModel = mongoose.models.WalletPayOtp || mongoose.model("WalletPayOtp", walletPayOtpSchema);

/* ─── Client Data Request ─────────────────────────────────────────────── */
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

// ── HTML Publisher ──────────────────────────────────────────────────────────
const htmlPublishSchema = new mongoose.Schema({
  ownerId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title:    { type: String, default: "صفحتي" },
  content:  { type: String, required: true },
  views:    { type: Number, default: 0 },
  isPublic: { type: Boolean, default: true },
}, { timestamps: true });
htmlPublishSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id.toString(); return ret; } });
export const HtmlPublishModel = mongoose.models.HtmlPublish || mongoose.model("HtmlPublish", htmlPublishSchema);

// ── URL Shortener ───────────────────────────────────────────────────────────
const shortUrlSchema = new mongoose.Schema({
  ownerId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  originalUrl: { type: String, required: true },
  shortCode:   { type: String, required: true, unique: true, index: true },
  title:       { type: String, default: "" },
  clicks:      { type: Number, default: 0 },
}, { timestamps: true });
shortUrlSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id.toString(); return ret; } });
export const ShortUrlModel = mongoose.models.ShortUrl || mongoose.model("ShortUrl", shortUrlSchema);

// ── Qirox System Settings ────────────────────────────────────────────────────
const qiroxSystemSettingsSchema = new mongoose.Schema({
  key: { type: String, default: "main", unique: true },
  // Company Info
  companyName:        { type: String, default: "QIROX Studio" },
  companyNameAr:      { type: String, default: "كيروكس ستوديو" },
  domain:             { type: String, default: "qiroxstudio.online" },
  tagline:            { type: String, default: "مصنع الأنظمة" },
  taglineAr:          { type: String, default: "مصنع الأنظمة الرقمية" },
  description:        { type: String, default: "" },
  logoUrl:            { type: String, default: "" },
  faviconUrl:         { type: String, default: "" },
  // Contacts
  contactEmail:       { type: String, default: "info@qiroxstudio.online" },
  contactPhone:       { type: String, default: "" },
  whatsapp:           { type: String, default: "" },
  address:            { type: String, default: "" },
  city:               { type: String, default: "" },
  country:            { type: String, default: "المملكة العربية السعودية" },
  // Social Links
  instagram:          { type: String, default: "" },
  twitter:            { type: String, default: "" },
  linkedin:           { type: String, default: "" },
  snapchat:           { type: String, default: "" },
  youtube:            { type: String, default: "" },
  tiktok:             { type: String, default: "" },
  // Business
  taxNumber:          { type: String, default: "" },
  commercialReg:      { type: String, default: "" },
  foundedYear:        { type: Number, default: 2024 },
  teamSize:           { type: Number, default: 1 },
  // Financial Settings
  systemValuation:    { type: Number, default: 0 },   // Total company value in SAR
  currency:           { type: String, default: "SAR" },
  profitDistribution: { type: [{ roleType: String, percentage: Number, label: String }], default: [] },
  // Modification Tracking
  lastModifiedBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
qiroxSystemSettingsSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id.toString(); return ret; } });
export const QiroxSystemSettingsModel = mongoose.models.QiroxSystemSettings || mongoose.model("QiroxSystemSettings", qiroxSystemSettingsSchema);

// ── Investor Profile ─────────────────────────────────────────────────────────
const investorProfileSchema = new mongoose.Schema({
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  stakePercentage:  { type: Number, default: 0, min: 0, max: 100 },  // Admin sets this
  totalInvested:    { type: Number, default: 0 },
  isVerified:       { type: Boolean, default: false },
  isActive:         { type: Boolean, default: true },
  notes:            { type: String, default: "" },  // Admin notes
  joinedAt:         { type: Date, default: Date.now },
}, { timestamps: true });
investorProfileSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id.toString(); return ret; } });
export const InvestorProfileModel = mongoose.models.InvestorProfile || mongoose.model("InvestorProfile", investorProfileSchema);

// ── Investment Payment ────────────────────────────────────────────────────────
const investmentPaymentSchema = new mongoose.Schema({
  investorId:      { type: mongoose.Schema.Types.ObjectId, ref: "InvestorProfile", required: true, index: true },
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  amount:          { type: Number, required: true },
  currency:        { type: String, default: "SAR" },
  paymentMethod:   { type: String, default: "bank_transfer" },
  proofUrl:        { type: String, default: "" },   // Uploaded payment proof
  signatureData:   { type: String, default: "" },   // Base64 canvas signature
  signatureText:   { type: String, default: "" },   // Typed name as backup
  description:     { type: String, default: "" },
  status:          { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  adminNote:       { type: String, default: "" },
  approvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvedAt:      { type: Date },
}, { timestamps: true });
investmentPaymentSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id.toString(); return ret; } });
export const InvestmentPaymentModel = mongoose.models.InvestmentPayment || mongoose.model("InvestmentPayment", investmentPaymentSchema);

// ── Promotion Log ─────────────────────────────────────────────────────────────
const promotionLogSchema = new mongoose.Schema({
  targetUserId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  promotedById:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fromRole:       { type: String, required: true },
  toRole:         { type: String, required: true },
  fromAdditional: { type: [String], default: [] },
  toAdditional:   { type: [String], default: [] },
  reason:         { type: String, default: "" },
  type:           { type: String, enum: ["promote", "demote", "role_add", "role_remove"], default: "promote" },
}, { timestamps: true });
promotionLogSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id.toString(); return ret; } });
export const PromotionLogModel = mongoose.models.PromotionLog || mongoose.model("PromotionLog", promotionLogSchema);

// ── QMeet: Meeting Management System (uses main MongoDB) ──────────────────────
const qMeetingSchema = new mongoose.Schema({
  title:          { type: String, required: true },
  description:    { type: String, default: "" },
  hostId:         { type: String, required: true },
  hostName:       { type: String, required: true },
  scheduledAt:    { type: Date, required: true },
  endsAt:         { type: Date },  // Computed on create
  durationMinutes:{ type: Number, default: 60 },
  roomName:       { type: String, required: true, unique: true },
  meetingLink:    { type: String, required: true },
  type:           { type: String, enum: ["internal", "client_individual", "client_all", "consultation"], default: "client_individual" },
  participantIds:    { type: [String], default: [] },
  participantEmails: { type: [String], default: [] },
  participantNames:  { type: [String], default: [] },
  consultationBookingId: { type: String, default: null },
  status:         { type: String, enum: ["scheduled", "live", "completed", "cancelled"], default: "scheduled" },
  reminderSent:   { type: Boolean, default: false },
  reminder24hSent:{ type: Boolean, default: false },
  notes:          { type: String, default: "" },
  agenda:         { type: [String], default: [] },
  recordingUrl:   { type: String, default: "" },
}, { timestamps: true });
qMeetingSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id.toString(); return ret; } });
export const QMeetingModel = mongoose.models.QMeeting || mongoose.model("QMeeting", qMeetingSchema);

const qFeedbackSchema = new mongoose.Schema({
  meetingId:    { type: mongoose.Schema.Types.ObjectId, ref: "QMeeting", required: true, index: true },
  fromUserId:   { type: String, required: true },
  fromUserName: { type: String, required: true },
  rating:       { type: Number, min: 1, max: 5, required: true },
  comment:      { type: String, default: "" },
}, { timestamps: true });
qFeedbackSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id.toString(); return ret; } });
export const QFeedbackModel = mongoose.models.QFeedback || mongoose.model("QFeedback", qFeedbackSchema);

const qReportSchema = new mongoose.Schema({
  meetingId:    { type: mongoose.Schema.Types.ObjectId, ref: "QMeeting", required: true, index: true },
  authorId:     { type: String, required: true },
  authorName:   { type: String, required: true },
  summary:      { type: String, required: true },
  actionItems:  { type: [String], default: [] },
  attendeesCount: { type: Number, default: 0 },
  duration:     { type: Number, default: 0 },
  content:      { type: String, default: "" },
}, { timestamps: true });
qReportSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id.toString(); return ret; } });
export const QReportModel = mongoose.models.QReport || mongoose.model("QReport", qReportSchema);

/* ─── Installment System (قسط عبر كيروكس) ────────────────────────────── */
const installmentOfferSchema = new mongoose.Schema({
  title:           { type: String, required: true },
  titleAr:         { type: String, required: true },
  description:     { type: String, default: '' },
  descriptionAr:   { type: String, default: '' },
  planTier:        { type: String, enum: ['lite', 'pro', 'infinite', 'lifetime', 'any'], default: 'any' },
  planPeriod:      { type: String, enum: ['monthly', 'sixmonth', 'annual', 'lifetime', 'any'], default: 'any' },
  planSegment:     { type: String, default: '' },
  installmentCount:{ type: Number, min: 2, max: 8, required: true },
  serviceFee:      { type: Number, default: 0 },
  penaltyAmount:   { type: Number, default: 50 },
  gracePeriodDays: { type: Number, default: 7 },
  isActive:        { type: Boolean, default: false },
  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
installmentOfferSchema.set('toJSON', { transform });
installmentOfferSchema.set('toObject', { transform });
export const InstallmentOfferModel = mongoose.models.InstallmentOffer || mongoose.model('InstallmentOffer', installmentOfferSchema);

const installmentApplicationSchema = new mongoose.Schema({
  clientId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  offerId:             { type: mongoose.Schema.Types.ObjectId, ref: 'InstallmentOffer', required: true },
  planTier:            { type: String, required: true },
  planPeriod:          { type: String, required: true },
  planSegment:         { type: String, default: '' },
  planSegmentNameAr:   { type: String, default: '' },
  totalAmount:         { type: Number, required: true },
  serviceFee:          { type: Number, required: true },
  grandTotal:          { type: Number, required: true },
  installmentCount:    { type: Number, required: true },
  installmentAmount:   { type: Number, required: true },
  paidInstallments:    { type: Number, default: 0 },
  status:              { type: String, enum: ['pending', 'approved', 'rejected', 'active', 'completed', 'suspended', 'cancelled'], default: 'pending' },
  adminNotes:          { type: String, default: '' },
  clientNotes:         { type: String, default: '' },
  approvedBy:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:          { type: Date },
  rejectedAt:          { type: Date },
  rejectionReason:     { type: String, default: '' },
  lockedAt:            { type: Date },
  nextDueDate:         { type: Date },
  completedAt:         { type: Date },
}, { timestamps: true });
installmentApplicationSchema.set('toJSON', { transform });
installmentApplicationSchema.set('toObject', { transform });
export const InstallmentApplicationModel = mongoose.models.InstallmentApplication || mongoose.model('InstallmentApplication', installmentApplicationSchema);

const installmentPaymentSchema = new mongoose.Schema({
  applicationId:       { type: mongoose.Schema.Types.ObjectId, ref: 'InstallmentApplication', required: true },
  clientId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  installmentNumber:   { type: Number, required: true },
  amount:              { type: Number, required: true },
  penalty:             { type: Number, default: 0 },
  totalDue:            { type: Number, required: true },
  dueDate:             { type: Date, required: true },
  paidAt:              { type: Date },
  status:              { type: String, enum: ['pending', 'paid', 'late', 'penalized', 'waived'], default: 'pending' },
  walletTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletTransaction' },
  note:                { type: String, default: '' },
}, { timestamps: true });
installmentPaymentSchema.set('toJSON', { transform });
installmentPaymentSchema.set('toObject', { transform });
export const InstallmentPaymentModel = mongoose.models.InstallmentPayment || mongoose.model('InstallmentPayment', installmentPaymentSchema);

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
}, { timestamps: true });
storePublishConfigSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const StorePublishConfigModel = mongoose.models.StorePublishConfig || mongoose.model("StorePublishConfig", storePublishConfigSchema);

// ── Device Trust Tokens ──
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
