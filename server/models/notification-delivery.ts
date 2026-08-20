import mongoose, { Schema } from "mongoose";

/**
 * Delivery records are intentionally separate from in-app notifications.
 * They describe an outbound attempt (email or WhatsApp), including retries,
 * without changing the existing NotificationModel contract.
 */
const notificationDeliverySchema = new Schema({
  event: { type: String, required: true, index: true },
  idempotencyKey: { type: String, required: true, index: true },
  channel: { type: String, enum: ["email", "whatsapp"], required: true, index: true },
  status: {
    type: String,
    enum: ["pending", "sending", "sent", "retrying", "failed", "skipped"],
    default: "pending",
    index: true,
  },
  recipient: {
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    normalizedPhone: { type: String, default: "" },
  },
  provider: { type: String, default: "" },
  providerMessageId: { type: String, default: "" },
  subject: { type: String, default: "" },
  body: { type: String, default: "" },
  textBody: { type: String, default: "" },
  // Sensitive deliveries (such as one-time login codes) remain available to
  // the worker for a retry, but their body is never returned by operator APIs.
  sensitive: { type: Boolean, default: false },
  template: { type: String, default: "" },
  metadata: { type: Schema.Types.Mixed, default: {} },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 3 },
  nextAttemptAt: { type: Date, default: Date.now, index: true },
  // A lease makes an in-flight claim recoverable after a process crash or a
  // provider call that never returns.
  leaseExpiresAt: { type: Date, default: null, index: true },
  claimToken: { type: String, default: "" },
  sentAt: { type: Date, default: null },
  lastAttemptAt: { type: Date, default: null },
  lastError: { type: String, default: "" },
}, { timestamps: true });

notificationDeliverySchema.index({ idempotencyKey: 1, channel: 1 }, { unique: true });
notificationDeliverySchema.index({ status: 1, nextAttemptAt: 1 });

const notificationTemplateSchema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  channels: { type: [String], default: ["email", "whatsapp"] },
  subject: { type: String, default: "" },
  body: { type: String, required: true },
  variables: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

export const NotificationDeliveryModel =
  mongoose.models.NotificationDelivery ||
  mongoose.model("NotificationDelivery", notificationDeliverySchema);

export const NotificationTemplateModel =
  mongoose.models.NotificationTemplate ||
  mongoose.model("NotificationTemplate", notificationTemplateSchema);