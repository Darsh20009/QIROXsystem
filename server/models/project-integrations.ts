import mongoose, { Schema } from "mongoose";
import { transform } from "./utils";

const projectIntegrationSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null, index: true },
  orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
  type: { type: String, enum: ["whatsapp", "email", "api"], required: true, index: true },
  environment: { type: String, enum: ["development", "staging", "production"], default: "development" },
  label: { type: String, default: "تكامل المشروع", trim: true, maxlength: 120 },
  status: { type: String, enum: ["active", "disabled", "expired"], default: "active", index: true },
  keyHash: { type: String, required: true, unique: true, index: true, select: false },
  keyPrefix: { type: String, required: true },
  publicIdentifier: { type: String, required: true },
  apiBasePath: { type: String, required: true },
  documentationPath: { type: String, required: true },
  allowedOrigins: { type: [String], default: [] },
  rateLimitPerMinute: { type: Number, default: 30, min: 1, max: 300 },
  maxMessageLength: { type: Number, default: 4000, min: 100, max: 100000 },
  expiresAt: { type: Date, default: null },
  lastUsedAt: { type: Date, default: null },
  requestCount: { type: Number, default: 0 },
  rotatedFrom: { type: Schema.Types.ObjectId, ref: "ProjectIntegration", default: null },
  revokedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

projectIntegrationSchema.set("toJSON", { transform });
projectIntegrationSchema.set("toObject", { transform });

export const ProjectIntegrationModel =
  mongoose.models.ProjectIntegration ||
  mongoose.model("ProjectIntegration", projectIntegrationSchema);