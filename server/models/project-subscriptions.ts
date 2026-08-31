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