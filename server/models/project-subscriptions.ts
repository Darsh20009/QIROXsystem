import mongoose from "mongoose";
import { transform } from "./utils";

const projectSubscriptionSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, unique: true, index: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  planTier: { type: String, default: "" },
  planSegment: { type: String, default: "" },
  period: { type: String, enum: ["monthly", "6months", "annual", "lifetime"], required: true },
  durationDays: { type: Number, default: null },
  startedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  status: { type: String, enum: ["active", "expired", "suspended"], default: "active" },
}, { timestamps: true });

projectSubscriptionSchema.set("toJSON", { transform });
projectSubscriptionSchema.set("toObject", { transform });

export const ProjectSubscriptionModel =
  mongoose.models.ProjectSubscription ||
  mongoose.model("ProjectSubscription", projectSubscriptionSchema);

const projectSubscriptionRenewalRequestSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "ProjectSubscription", required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date, default: null },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  adminNote: { type: String, default: "" },
  renewalPeriod: { type: String, enum: ["monthly", "6months", "annual", "lifetime"], default: null },
  renewalStartedAt: { type: Date, default: null },
  renewalExpiresAt: { type: Date, default: null },
}, { timestamps: true });

projectSubscriptionRenewalRequestSchema.set("toJSON", { transform });
projectSubscriptionRenewalRequestSchema.set("toObject", { transform });

export const ProjectSubscriptionRenewalRequestModel =
  mongoose.models.ProjectSubscriptionRenewalRequest ||
  mongoose.model("ProjectSubscriptionRenewalRequest", projectSubscriptionRenewalRequestSchema);