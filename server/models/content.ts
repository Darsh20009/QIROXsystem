import mongoose from "mongoose";
import { transform } from "./utils";

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  excerpt: String,
  imageUrl: String,
  authorId: { type: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
  publishedAt: { type: Date, default: Date.now },
}, { timestamps: true });
newsSchema.set('toJSON', { transform });
newsSchema.set('toObject', { transform });
export const NewsModel = mongoose.models.News || mongoose.model("News", newsSchema);

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
jobSchema.set('toJSON', { transform });
jobSchema.set('toObject', { transform });
export const JobModel = mongoose.models.Job || mongoose.model("Job", jobSchema);

const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.Mixed },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  resumeUrl: String,
  coverLetter: String,
  answers: { type: mongoose.Schema.Types.Mixed, default: {} },
  technicalScore: Number,
  internalEvaluation: String,
  status: { type: String, default: "new" },
  appliedAt: { type: Date, default: Date.now },
}, { timestamps: true });
applicationSchema.set('toJSON', { transform });
applicationSchema.set('toObject', { transform });
export const ApplicationModel = mongoose.models.Application || mongoose.model("Application", applicationSchema);

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
partnerSchema.set('toJSON', { transform });
partnerSchema.set('toObject', { transform });
export const PartnerModel = mongoose.models.Partner || mongoose.model("Partner", partnerSchema);

const contactMessageSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  email:       { type: String, required: true },
  phone:       { type: String, required: true },
  subject:     { type: String, default: "" },
  message:     { type: String, required: true },
  read:        { type: Boolean, default: false },
  adminReply:  { type: String, default: "" },
  repliedAt:   { type: Date, default: null },
  status:      { type: String, enum: ["new", "read", "replied", "archived"], default: "new" },
}, { timestamps: true });
contactMessageSchema.set('toJSON', { transform: (_, ret: any) => { ret.id = ret._id?.toString(); return ret; } });
export const ContactMessageModel = mongoose.models.ContactMessage || mongoose.model("ContactMessage", contactMessageSchema);

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
