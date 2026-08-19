import mongoose from "mongoose";
import { transform } from "./utils";

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
  platformUrl: String,
  usageInstructions: String,
  portfolioFiles: [{
    url: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["pdf", "video", "document", "other"], default: "other" },
  }],
});
serviceSchema.set('toJSON', { transform });
serviceSchema.set('toObject', { transform });
export const ServiceModel = mongoose.models.Service || mongoose.model("Service", serviceSchema);

const featureDetailSchema = new mongoose.Schema({
  titleAr: { type: String, default: "" },
  title:   { type: String, default: "" },
  descAr:  { type: String, default: "" },
  icon:    { type: String, default: "✨" },
  tiers:   { type: [String], default: ["lite", "pro", "infinite"] },
}, { _id: false });

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
  featuresDetails: { type: [featureDetailSchema], default: [] },
  tags: [String],
  priceMin: Number,
  priceMax: Number,
  currency: { type: String, default: "SAR" },
  estimatedDuration: String,
  status: { type: String, enum: ["active", "coming_soon", "archived"], default: "active" },
  sortOrder: { type: Number, default: 0 },
  demoUrl: String,
  heroColor: String,
  howToUseAr: String,
  howToUseVideoUrl: String,
  templateFiles: [{ nameAr: String, url: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });
sectorTemplateSchema.set('toJSON', { transform });
sectorTemplateSchema.set('toObject', { transform });
export const SectorTemplateModel = mongoose.models.SectorTemplate || mongoose.model("SectorTemplate", sectorTemplateSchema);

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
  segment: { type: String, default: "general" },
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
pricingPlanSchema.set('toJSON', { transform });
pricingPlanSchema.set('toObject', { transform });
export const PricingPlanModel = mongoose.models.PricingPlan || mongoose.model("PricingPlan", pricingPlanSchema);

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
segmentPricingSchema.set('toJSON', { transform });
segmentPricingSchema.set('toObject', { transform });
export const SegmentPricingModel = mongoose.models.SegmentPricing || mongoose.model("SegmentPricing", segmentPricingSchema);

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
systemFeatureSchema.set('toJSON', { transform });
systemFeatureSchema.set('toObject', { transform });
export const SystemFeatureModel = mongoose.models.SystemFeature || mongoose.model("SystemFeature", systemFeatureSchema);

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
  segments: { type: [String], default: [] },
  plans: { type: [String], default: [] },
  billingType: { type: String, enum: ["one_time","monthly","annual","lifetime"], default: "one_time" },
  compatiblePeriods: { type: [String], default: [] },
  quotaCount: { type: Number, default: 0 },
  quotaLabel: { type: String, default: "" },
  includedInPlans: { type: [String], default: [] },
  freeQuotaForIncluded: { type: Number, default: 0 },
  imageUrl: { type: String, default: "" },
  cost: { type: Number, default: 0 },
  isCustom: { type: Boolean, default: false },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  promotedToStandardAt: { type: Date, default: null },
  createdByEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });
extraAddonSchema.set('toJSON', { transform });
extraAddonSchema.set('toObject', { transform });
export const ExtraAddonModel = mongoose.models.ExtraAddon || mongoose.model("ExtraAddon", extraAddonSchema);

const projectAddonSubscriptionSchema = new mongoose.Schema({
  projectId:    { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  orderId:      { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  clientId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  addonId:      { type: mongoose.Schema.Types.ObjectId, ref: "ExtraAddon", required: true },
  addonNameAr:  { type: String, default: "" },
  billingType:  { type: String, default: "one_time" },
  status:       { type: String, enum: ["active","expired","exhausted","cancelled"], default: "active" },
  quotaTotal:   { type: Number, default: 0 },
  quotaUsed:    { type: Number, default: 0 },
  expiresAt:    { type: Date, default: null },
  startedAt:    { type: Date, default: Date.now },
  lastNotifiedAt: { type: Date, default: null },
  renewalRequestedAt: { type: Date, default: null },
}, { timestamps: true });
projectAddonSubscriptionSchema.set('toJSON', { transform });
projectAddonSubscriptionSchema.set('toObject', { transform });
export const ProjectAddonSubscriptionModel = mongoose.models.ProjectAddonSubscription || mongoose.model("ProjectAddonSubscription", projectAddonSubscriptionSchema);
