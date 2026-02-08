import mongoose from "mongoose";
import { roles } from "@shared/schema";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: roles, default: "client", required: true },
  fullName: { type: String, required: true },
  phone: String,
  country: String,
  businessType: String,
  emailVerified: { type: Boolean, default: false },
  whatsappNumber: String,
}, { timestamps: true });

const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  priceMin: Number,
  priceMax: Number,
  estimatedDuration: String,
  features: [String],
  icon: String,
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  status: { type: String, default: "pending", required: true },
  requirements: { type: Map, of: mongoose.Schema.Types.Mixed, required: true },
  paymentMethod: String,
  paymentProofUrl: String,
  totalAmount: Number,
  isDepositPaid: { type: Boolean, default: false },
}, { timestamps: true });

const projectSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: "new", required: true },
  progress: { type: Number, default: 0 },
  repoUrl: String,
  stagingUrl: String,
  startDate: Date,
  deadline: Date,
}, { timestamps: true });

const taskSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: String,
  status: { type: String, default: "pending", required: true },
  priority: { type: String, default: "medium" },
  dueDate: Date,
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  isInternal: { type: Boolean, default: false },
}, { timestamps: true });

const transform = (doc: any, ret: any) => {
  ret.id = ret._id ? ret._id.toString() : ret.id;
  delete ret._id;
  delete ret.__v;
};

[userSchema, serviceSchema, orderSchema, projectSchema, taskSchema, messageSchema].forEach(s => {
  s.set('toJSON', { transform });
  s.set('toObject', { transform });
});

export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
export const ServiceModel = mongoose.models.Service || mongoose.model("Service", serviceSchema);
export const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);
export const ProjectModel = mongoose.models.Project || mongoose.model("Project", projectSchema);
export const TaskModel = mongoose.models.Task || mongoose.model("Task", taskSchema);
export const MessageModel = mongoose.models.Message || mongoose.model("Message", messageSchema);
