import mongoose from "mongoose";
import { transform } from "./utils";

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
  planBundles: [{
    linkedPlanId: String,
    planNameAr: { type: String, required: true },
    planDescAr: String,
    planTier: { type: String, enum: ['lite', 'pro', 'infinite', 'custom'], default: 'custom' },
    planSegment: String,
    customPrice: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false },
    features: [String],
  }],
  requiresShipping: { type: Boolean, default: false },
  shippingProviders: [{
    companyId:   { type: String, required: true },
    nameAr:      String,
    customPrice: Number,
    customOutsideCityPrice: Number,
    isActive:    { type: Boolean, default: true },
  }],
}, { timestamps: true });
qiroxProductSchema.set('toJSON', { transform });
qiroxProductSchema.set('toObject', { transform });
export const QiroxProductModel = mongoose.models.QiroxProduct || mongoose.model("QiroxProduct", qiroxProductSchema);

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
discountCodeSchema.set('toJSON', { transform });
discountCodeSchema.set('toObject', { transform });
export const DiscountCodeModel = mongoose.models.DiscountCode || mongoose.model("DiscountCode", discountCodeSchema);

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
deviceShipmentSchema.set('toJSON', { transform });
deviceShipmentSchema.set('toObject', { transform });
export const DeviceShipmentModel = mongoose.models.DeviceShipment || mongoose.model("DeviceShipment", deviceShipmentSchema);

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
shippingCompanySchema.set('toJSON', { transform });
shippingCompanySchema.set('toObject', { transform });
export const ShippingCompanyModel = mongoose.models.ShippingCompany || mongoose.model("ShippingCompany", shippingCompanySchema);

// ── Client Store (per-client deployed store instance) ──────────────────────
const clientStoreSchema = new mongoose.Schema({
  clientId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  templateSlug: { type: String, required: true, default: 'ecommerce' },
  status:       { type: String, enum: ['draft', 'active', 'suspended', 'cancelled'], default: 'draft', index: true },
  subdomain:    { type: String, default: '', index: true },  // e.g. "myshop" → myshop.stores.qiroxstudio.online
  customDomain: { type: String, default: '' },              // e.g. "shop.mybrand.com"
  storeNameAr:  { type: String, default: '' },
  storeNameEn:  { type: String, default: '' },
  description:  { type: String, default: '' },
  logoUrl:      { type: String, default: '' },
  primaryColor: { type: String, default: '#000000' },
  planSlug:     { type: String, enum: ['lite', 'pro', 'infinite'], default: 'lite' },
  adminEmail:   { type: String, default: '' },
  adminPhone:   { type: String, default: '' },
  publishedAt:  { type: Date, default: null },
  expiresAt:    { type: Date, default: null },
  adminNotes:   { type: String, default: '' },
  storeSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
clientStoreSchema.index({ clientId: 1, status: 1 });
clientStoreSchema.set('toJSON', { transform });
clientStoreSchema.set('toObject', { transform });
export const ClientStoreModel = mongoose.models.ClientStore || mongoose.model("ClientStore", clientStoreSchema);

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
countrySchema.set('toJSON', { transform });
countrySchema.set('toObject', { transform });
export const CountryModel = mongoose.models.Country || mongoose.model("Country", countrySchema);
