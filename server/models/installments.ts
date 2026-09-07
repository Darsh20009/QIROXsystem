import mongoose from "mongoose";
import { transform } from "./utils";

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

const loyaltyAccountSchema = new mongoose.Schema({
  clientId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  points:        { type: Number, default: 0 },
  totalEarned:   { type: Number, default: 0 },
  totalRedeemed: { type: Number, default: 0 },
}, { timestamps: true });
loyaltyAccountSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const LoyaltyAccountModel = mongoose.models.LoyaltyAccount || mongoose.model("LoyaltyAccount", loyaltyAccountSchema);

const loyaltyTransactionSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type:     { type: String, enum: ["earned", "redeemed", "adjusted", "expired"], required: true },
  points:   { type: Number, required: true },
  reason:   { type: String, default: "" },
  orderId:  { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
}, { timestamps: true });
loyaltyTransactionSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const LoyaltyTransactionModel = mongoose.models.LoyaltyTransaction || mongoose.model("LoyaltyTransaction", loyaltyTransactionSchema);

const loyaltyConfigSchema = new mongoose.Schema({
  pointsPerSAR:      { type: Number, default: 1 },
  minRedeemPoints:   { type: Number, default: 100 },
  sarPerPoint:       { type: Number, default: 0.1 },
  isEnabled:         { type: Boolean, default: true },
  expiryDays:        { type: Number, default: 365 },
}, { timestamps: true });
loyaltyConfigSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const LoyaltyConfigModel = mongoose.models.LoyaltyConfig || mongoose.model("LoyaltyConfig", loyaltyConfigSchema);

const slaConfigSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  responseHours:{ type: Number, default: 24 },
  resolutionHours:{ type: Number, default: 72 },
  isDefault:    { type: Boolean, default: false },
  priority:     { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
}, { timestamps: true });
slaConfigSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const SlaConfigModel = mongoose.models.SlaConfig || mongoose.model("SlaConfig", slaConfigSchema);

const supplierOfferSchema = new mongoose.Schema({
  supplierId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  supplierName: { type: String, default: "" },
  title:        { type: String, required: true },
  description:  { type: String, default: "" },
  price:        { type: Number, default: 0 },
  currency:     { type: String, default: "SAR" },
  orderId:      { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  projectId:    { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
  category:     { type: String, default: "" },
  attachmentUrl:{ type: String, default: "" },
  status:       { type: String, enum: ["pending", "reviewing", "accepted", "rejected"], default: "pending" },
  adminNote:    { type: String, default: "" },
  respondedAt:  { type: Date, default: null },
}, { timestamps: true });
supplierOfferSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const SupplierOfferModel = mongoose.models.SupplierOffer || mongoose.model("SupplierOffer", supplierOfferSchema);
