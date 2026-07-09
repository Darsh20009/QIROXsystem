import mongoose from "mongoose";
import { transform } from "./utils";

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  status: { type: String, default: "pending", required: true, index: true },
  serviceType: String,
  planTier: { type: String, enum: ['lite', 'pro', 'infinite', 'lifetime'] },
  planPeriod: { type: String, enum: ['monthly', 'sixmonth', 'annual', 'lifetime'] },
  planSegment: String,
  businessName: String,
  phone: String,
  notes: String,
  items: { type: mongoose.Schema.Types.Mixed },
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
  logoUrl: String,
  brandIdentityUrl: String,
  filesUrl: String,
  contentUrl: String,
  imagesUrl: String,
  videoUrl: String,
  accessCredentials: String,
  commercialRegUrl: String,
  taxRegUrl: String,
  nationalIdUrl: String,
  ibanCertUrl: String,
  files: { type: mongoose.Schema.Types.Mixed },
  shippingCompanyId: String,
  shippingCompanyName: String,
  shippingFee: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ["bank_transfer", "paypal", "paypal_card", "wallet", "mixed", "stc_pay", "apple_pay", "cash", "other"] },
  paymentProofUrl: String,
  paymentStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  paymentRejectionReason: { type: String, default: "" },
  totalAmount: Number,
  walletAmountUsed: { type: Number, default: 0 },
  isDepositPaid: { type: Boolean, default: false },
  requirements: { type: Map, of: mongoose.Schema.Types.Mixed },
  wizardData: { type: mongoose.Schema.Types.Mixed },
  scheduledMeeting: {
    date: String,
    time: String,
    meetingLink: String,
    confirmedAt: Date,
    confirmedBy: String,
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminNotes: String,
  orderNumber: { type: String, sparse: true },
}, { timestamps: true });
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.set('toJSON', { transform });
orderSchema.set('toObject', { transform });
export const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);

const cartItemSchema = new mongoose.Schema({
  type: { type: String, enum: ['service', 'product', 'domain', 'email', 'hosting', 'gift', 'plan'], required: true },
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
cartSchema.set('toJSON', { transform });
cartSchema.set('toObject', { transform });
export const CartModel = mongoose.models.Cart || mongoose.model("Cart", cartSchema);

const orderSpecsSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  projectName: String,
  clientEmail: String,
  totalBudget: Number,
  paidAmount: Number,
  projectStatus: { type: String, default: "planning" },
  techStack: String,
  database: String,
  hosting: String,
  framework: String,
  language: String,
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
  variables: String,
  projectConcept: String,
  targetAudience: String,
  mainFeatures: String,
  referenceLinks: String,
  colorPalette: String,
  estimatedHours: Number,
  deadline: Date,
  startDate: Date,
  notes: String,
  teamNotes: String,
  technologies: [String],
  features: [String],
  clientBrief: String,
  projectIdeas: String,
  customVars: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });
orderSpecsSchema.set('toJSON', { transform });
orderSpecsSchema.set('toObject', { transform });
export const OrderSpecsModel = mongoose.models.OrderSpecs || mongoose.model("OrderSpecs", orderSpecsSchema);

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
modificationRequestSchema.set('toJSON', { transform });
modificationRequestSchema.set('toObject', { transform });
export const ModificationRequestModel = mongoose.models.ModificationRequest || mongoose.model("ModificationRequest", modificationRequestSchema);

const modPlanConfigSchema = new mongoose.Schema({
  planTier: { type: String, enum: ['lite', 'pro', 'infinite'], required: true },
  planPeriod: { type: String, enum: ['monthly', 'sixmonth', 'annual'], required: true },
  modificationsPerPeriod: { type: Number, required: true, default: 5 },
  quotaMonths: { type: Number, required: true, default: 1 },
  isActive: { type: Boolean, default: true },
  notes: { type: String, default: "" },
}, { timestamps: true });
modPlanConfigSchema.set('toJSON', { transform });
modPlanConfigSchema.set('toObject', { transform });
export const ModPlanConfigModel = mongoose.models.ModPlanConfig || mongoose.model("ModPlanConfig", modPlanConfigSchema);

const modTypePriceSchema = new mongoose.Schema({
  nameAr: { type: String, required: true },
  name: { type: String, default: "" },
  description: { type: String, default: "" },
  price: { type: Number, required: true, max: 50 },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });
modTypePriceSchema.set('toJSON', { transform });
modTypePriceSchema.set('toObject', { transform });
export const ModTypePriceModel = mongoose.models.ModTypePrice || mongoose.model("ModTypePrice", modTypePriceSchema);

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
modQuotaAddonSchema.set('toJSON', { transform });
modQuotaAddonSchema.set('toObject', { transform });
export const ModQuotaAddonModel = mongoose.models.ModQuotaAddon || mongoose.model("ModQuotaAddon", modQuotaAddonSchema);

const subServiceRequestSchema = new mongoose.Schema({
  clientId: { type: String, required: true },
  projectId: { type: String },
  projectLabel: { type: String },
  serviceType: { type: String, required: true },
  notes: { type: String, default: "" },
  status: { type: String, enum: ["pending", "reviewing", "approved", "rejected"], default: "pending" },
  adminNotes: { type: String, default: "" },
}, { timestamps: true });
subServiceRequestSchema.set('toJSON', { transform });
subServiceRequestSchema.set('toObject', { transform });
export const SubServiceRequestModel = mongoose.models.SubServiceRequest || mongoose.model("SubServiceRequest", subServiceRequestSchema);

const orderExpenseSchema = new mongoose.Schema({
  orderId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  category:    { type: String, enum: ['hosting', 'domain', 'freelancer', 'license', 'ads', 'design', 'salary', 'commission', 'other'], default: 'other' },
  description: { type: String, required: true },
  amount:      { type: Number, required: true },
  currency:    { type: String, default: 'SAR' },
  addedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
orderExpenseSchema.set('toJSON', { transform });
orderExpenseSchema.set('toObject', { transform });
export const OrderExpenseModel = mongoose.models.OrderExpense || mongoose.model("OrderExpense", orderExpenseSchema);

const priceRequestSchema = new mongoose.Schema({
  ticketNumber:   { type: String, unique: true, required: true, index: true },
  sector:         { type: String, required: true },
  sectorLabel:    { type: String, default: '' },
  duration:       { type: String, default: '' },
  requirements:   { type: String, required: true },
  contactName:    { type: String, required: true },
  contactPhone:   { type: String, required: true },
  contactEmail:   { type: String, default: '' },
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status:         { type: String, enum: ['pending', 'reviewing', 'quoted', 'accepted', 'rejected'], default: 'pending' },
  quotedPrice:    { type: Number, default: null },
  quotedCurrency: { type: String, default: 'SAR' },
  quotedAt:       { type: Date, default: null },
  adminNotes:     { type: String, default: '' },
}, { timestamps: true });
priceRequestSchema.set('toJSON', { transform });
priceRequestSchema.set('toObject', { transform });
export const PriceRequestModel = mongoose.models.PriceRequest || mongoose.model("PriceRequest", priceRequestSchema);

const reviewSchema = new mongoose.Schema({
  orderId:    { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
  clientId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  rating:     { type: Number, min: 1, max: 5, required: true },
  comment:    { type: String, default: "" },
  isPublic:   { type: Boolean, default: true },
  serviceTitle: { type: String, default: "" },
  adminReply: { type: String, default: "" },
  repliedAt:  { type: Date, default: null },
}, { timestamps: true });
reviewSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const ReviewModel = mongoose.models.Review || mongoose.model("Review", reviewSchema);

const contractSchema = new mongoose.Schema({
  orderId:         { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  projectId:       { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  clientId:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  terms:           { type: String, required: true },
  totalAmount:     { type: Number, default: 0 },
  status:          { type: String, enum: ["pending", "acknowledged", "rejected"], default: "pending" },
  acknowledgedAt:  { type: Date, default: null },
  rejectedAt:      { type: Date, default: null },
  notes:           { type: String, default: "" },
  signatureData:   { type: String, default: "" },
  signatureText:   { type: String, default: "" },
  signedOtpVerified: { type: Boolean, default: false },
  signerIp:        { type: String, default: "" },
  signerUserAgent: { type: String, default: "" },
  signOtp:         { type: String, default: "" },
  signOtpExpiresAt:{ type: Date, default: null },
  contractNumber:  { type: String, default: "" },
}, { timestamps: true });
contractSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const ContractModel = mongoose.models.Contract || mongoose.model("Contract", contractSchema);

const paymobOnboardingSchema = new mongoose.Schema({
  userId:           { type: String },
  orderId:          { type: String },
  docType:          { type: String, enum: ['freelance', 'commercial'], required: true },
  docNumber:        { type: String, required: true },
  docFileUrl:       { type: String },
  ibanCertUrl:      { type: String },
  vatNumber:        { type: String },
  nationalId:       { type: String, required: true },
  nationalIdFront:  { type: String, required: true },
  nationalIdBack:   { type: String },
  paymobRegistered: { type: Boolean, default: false },
  policyAccepted:   { type: Boolean, default: false },
  signatureName:    { type: String },
  acceptedAt:       { type: Date },
  status:           { type: String, enum: ['pending', 'reviewing', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });
paymobOnboardingSchema.set('toJSON', { transform });
paymobOnboardingSchema.set('toObject', { transform });
export const PaymobOnboardingModel = mongoose.models.PaymobOnboarding || mongoose.model("PaymobOnboarding", paymobOnboardingSchema);
