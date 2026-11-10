import mongoose from "mongoose";

const draftProjectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  summary: { type: String, default: "", maxlength: 3000 },
  projectType: { type: String, default: "", maxlength: 120 },
  sector: { type: String, default: "", maxlength: 120 },
  status: { type: String, enum: ["draft", "planning", "ready"], default: "draft", required: true },
  projectConcept: { type: String, default: "", maxlength: 10000 },
  targetAudience: { type: String, default: "", maxlength: 4000 },
  mainFeatures: { type: String, default: "", maxlength: 10000 },
  techStack: { type: String, default: "", maxlength: 2000 },
  framework: { type: String, default: "", maxlength: 500 },
  language: { type: String, default: "", maxlength: 500 },
  database: { type: String, default: "", maxlength: 1000 },
  databaseDesign: { type: String, default: "", maxlength: 5000 },
  hosting: { type: String, default: "", maxlength: 1000 },
  deploymentStrategy: { type: String, default: "", maxlength: 3000 },
  domain: { type: String, default: "", maxlength: 500 },
  githubRepo: { type: String, default: "", maxlength: 1000 },
  stagingUrl: { type: String, default: "", maxlength: 1000 },
  productionUrl: { type: String, default: "", maxlength: 1000 },
  notes: { type: String, default: "", maxlength: 10000 },
  visibleTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  promotedOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  promotedProjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
  promotedAt: { type: Date, default: null },
  promotedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

draftProjectSchema.index({ visibleTo: 1, updatedAt: -1 });
draftProjectSchema.set("toJSON", {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id?.toString();
    ret.visibleTo = (ret.visibleTo || []).map((id: any) => id?.toString?.() || String(id));
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const DraftProjectModel = mongoose.models.DraftProject
  || mongoose.model("DraftProject", draftProjectSchema);