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
  // Lifetime subscriptions intentionally have no expiry date.
  expiresAt: {
    type: Date,
    required: function (this: any) { return this.period !== "lifetime"; },
    default: null,
  },
  status: { type: String, enum: ["active", "expired", "suspended"], default: "active" },
  lastActionId: { type: String, default: null, index: true },
}, { timestamps: true });

projectSubscriptionSchema.set("toJSON", { transform });
projectSubscriptionSchema.set("toObject", { transform });

export const ProjectSubscriptionModel =
  mongoose.models.ProjectSubscription ||
  mongoose.model("ProjectSubscription", projectSubscriptionSchema);

const PENDING_RENEWAL_REQUEST_INDEX = "one_pending_renewal_request_per_project";

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

// A project may have historical rejected/approved requests, but only one
// request waiting for review at a time. The unique partial index makes the
// create operation safe when a client submits the request concurrently.
projectSubscriptionRenewalRequestSchema.index(
  { projectId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
    name: PENDING_RENEWAL_REQUEST_INDEX,
  },
);

projectSubscriptionRenewalRequestSchema.set("toJSON", { transform });
projectSubscriptionRenewalRequestSchema.set("toObject", { transform });

export const ProjectSubscriptionRenewalRequestModel =
  mongoose.models.ProjectSubscriptionRenewalRequest ||
  mongoose.model("ProjectSubscriptionRenewalRequest", projectSubscriptionRenewalRequestSchema);

/**
 * Production disables Mongoose autoIndex, so this constraint is established
 * explicitly during database startup as well as declared on the schema.
 */
export async function ensurePendingProjectSubscriptionRenewalIndex(): Promise<void> {
  const duplicateProjects = await ProjectSubscriptionRenewalRequestModel.aggregate([
    { $match: { status: "pending" } },
    { $group: { _id: "$projectId", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 1 },
  ]);
  if (duplicateProjects.length) {
    throw new Error(`تعذر تفعيل تجديد اشتراكات المشاريع: توجد طلبات معلقة مكررة للمشروع ${duplicateProjects[0]._id}`);
  }

  await ProjectSubscriptionRenewalRequestModel.collection.createIndex(
    { projectId: 1 },
    {
      unique: true,
      partialFilterExpression: { status: "pending" },
      name: PENDING_RENEWAL_REQUEST_INDEX,
    },
  );
}