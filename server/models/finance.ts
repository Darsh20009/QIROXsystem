import mongoose from "mongoose";
import { transform } from "./utils";

const invoiceSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  invoiceNumber: { type: String, required: true, unique: true },
  title: { type: String, default: "" },
  amount: { type: Number, required: true },
  vatRate: { type: Number, default: 15 },
  vatAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['unpaid', 'paid', 'cancelled'], default: 'unpaid' },
  dueDate: Date,
  paidAt: Date,
  notes: String,
  items: [{ name: String, qty: Number, unitPrice: Number, total: Number }],
  externalName: { type: String, default: "" },
  externalEmail: { type: String, default: "" },
  externalCompany: { type: String, default: "" },
  clientSnapshot: {
    fullName: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    taxNumber: { type: String, default: "" },
    organizationName: { type: String, default: "" },
    commercialRegistration: { type: String, default: "" },
    nationalAddress: { type: String, default: "" },
  },
}, { timestamps: true });
invoiceSchema.set('toJSON', { transform });
invoiceSchema.set('toObject', { transform });
export const InvoiceModel = mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);

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
receiptVoucherSchema.set('toJSON', { transform });
receiptVoucherSchema.set('toObject', { transform });
export const ReceiptVoucherModel = mongoose.models.ReceiptVoucher || mongoose.model("ReceiptVoucher", receiptVoucherSchema);

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: String,
  details: { type: mongoose.Schema.Types.Mixed },
  ip: String,
}, { timestamps: true });
activityLogSchema.set('toJSON', { transform });
activityLogSchema.set('toObject', { transform });
export const ActivityLogModel = mongoose.models.ActivityLog || mongoose.model("ActivityLog", activityLogSchema);

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
payrollRecordSchema.set('toJSON', { transform });
payrollRecordSchema.set('toObject', { transform });
export const PayrollRecordModel = mongoose.models.PayrollRecord || mongoose.model("PayrollRecord", payrollRecordSchema);

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
bankSettingsSchema.set('toJSON', { transform });
bankSettingsSchema.set('toObject', { transform });
export const BankSettingsModel = mongoose.models.BankSettings || mongoose.model("BankSettings", bankSettingsSchema);

const employeePaymentSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  addedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  projectId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  projectName: { type: String, default: '' },
  amount:      { type: Number, required: true },
  type:        { type: String, enum: ['salary','bonus','commission','allowance','other'], default: 'salary' },
  description: { type: String, default: '' },
  status:      { type: String, enum: ['pending','approved','paid'], default: 'pending' },
  dueDate:     { type: Date },
  paidAt:      { type: Date },
  notes:       { type: String, default: '' },
}, { timestamps: true });
employeePaymentSchema.set('toJSON', { transform });
employeePaymentSchema.set('toObject', { transform });
export const EmployeePaymentModel = mongoose.models.EmployeePayment || mongoose.model("EmployeePayment", employeePaymentSchema);

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

const investorProfileSchema = new mongoose.Schema({
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  stakePercentage:  { type: Number, default: 0, min: 0, max: 100 },
  totalInvested:    { type: Number, default: 0 },
  isVerified:       { type: Boolean, default: false },
  isActive:         { type: Boolean, default: true },
  notes:            { type: String, default: "" },
  joinedAt:         { type: Date, default: Date.now },
}, { timestamps: true });
investorProfileSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id.toString(); return ret; } });
export const InvestorProfileModel = mongoose.models.InvestorProfile || mongoose.model("InvestorProfile", investorProfileSchema);

const investmentPaymentSchema = new mongoose.Schema({
  investorId:      { type: mongoose.Schema.Types.ObjectId, ref: "InvestorProfile", required: true, index: true },
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  amount:          { type: Number, required: true },
  currency:        { type: String, default: "SAR" },
  paymentMethod:   { type: String, default: "bank_transfer" },
  proofUrl:        { type: String, default: "" },
  signatureData:   { type: String, default: "" },
  signatureText:   { type: String, default: "" },
  description:     { type: String, default: "" },
  status:          { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  adminNote:       { type: String, default: "" },
  approvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvedAt:      { type: Date },
}, { timestamps: true });
investmentPaymentSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id.toString(); return ret; } });
export const InvestmentPaymentModel = mongoose.models.InvestmentPayment || mongoose.model("InvestmentPayment", investmentPaymentSchema);

const operationalExpenseSchema = new mongoose.Schema({
  category: { type: String, enum: ["operational", "marketing", "admin", "product", "other"], default: "operational" },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  month: { type: String },
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
operationalExpenseSchema.set("toJSON", { transform: (_: any, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const OperationalExpenseModel = mongoose.models.OperationalExpense || mongoose.model("OperationalExpense", operationalExpenseSchema);

const journalEntrySchema = new mongoose.Schema({
  date:        { type: String, required: true },
  refNumber:   { type: String },
  description: { type: String, required: true },
  entries: [{
    account:     { type: String, required: true },
    accountCode: { type: String },
    debit:       { type: Number, default: 0 },
    credit:      { type: Number, default: 0 },
    notes:       { type: String },
  }],
  category:    { type: String, enum: ["revenue", "expense", "asset", "liability", "equity", "transfer", "payroll", "other"], default: "other" },
  status:      { type: String, enum: ["draft", "posted", "voided"], default: "posted" },
  attachmentUrl: { type: String },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
journalEntrySchema.set("toJSON", { transform: (_: any, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const JournalEntryModel = mongoose.models.JournalEntry || mongoose.model("JournalEntry", journalEntrySchema);

const quotationSchema = new mongoose.Schema({
  quotationNumber:  { type: String, required: true, unique: true },
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  externalName:     { type: String, default: "" },
  externalEmail:    { type: String, default: "" },
  externalCompany:  { type: String, default: "" },
  title:            { type: String, default: "" },
  items:          [{ name: String, description: String, qty: Number, unitPrice: Number, total: Number }],
  amount:         { type: Number, default: 0 },
  vatRate:        { type: Number, default: 15 },
  vatAmount:      { type: Number, default: 0 },
  totalAmount:    { type: Number, default: 0 },
  validUntil:     { type: Date },
  status:         { type: String, enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'], default: 'draft' },
  notes:          { type: String, default: "" },
  termsAndConditions: { type: String, default: "" },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orderId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
}, { timestamps: true });
quotationSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const QuotationModel = mongoose.models.Quotation || mongoose.model("Quotation", quotationSchema);
