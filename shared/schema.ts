import mongoose from "mongoose";
import { z } from "zod";

// Shared Types & Schemas
export const roles = ["client", "admin", "employee_manager", "employee_sales", "employee_dev", "employee_design", "employee_support"] as const;

// Zod Schemas for validation
export const insertUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  email: z.string().email(),
  role: z.enum(roles).default("client"),
  fullName: z.string().min(1),
  phone: z.string().optional(),
  country: z.string().optional(),
  businessType: z.string().optional(),
  whatsappNumber: z.string().optional(),
});

export const insertServiceSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  estimatedDuration: z.string().optional(),
  features: z.array(z.string()).optional(),
  icon: z.string().optional(),
});

export const insertOrderSchema = z.object({
  serviceId: z.string().optional(),
  requirements: z.record(z.any()),
  paymentMethod: z.string().optional(),
  paymentProofUrl: z.string().optional(),
  totalAmount: z.number().optional(),
  isDepositPaid: z.boolean().default(false),
});

export const insertProjectSchema = z.object({
  orderId: z.string(),
  clientId: z.string(),
  managerId: z.string().optional(),
  status: z.string().default("new"),
  progress: z.number().default(0),
  repoUrl: z.string().optional(),
  stagingUrl: z.string().optional(),
  startDate: z.date().optional(),
  deadline: z.date().optional(),
});

export const insertTaskSchema = z.object({
  projectId: z.string(),
  assignedTo: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.string().default("pending"),
  priority: z.string().default("medium"),
  dueDate: z.date().optional(),
});

export const insertMessageSchema = z.object({
  projectId: z.string(),
  content: z.string().min(1),
  isInternal: z.boolean().default(false),
});

// Types
export type User = z.infer<typeof insertUserSchema> & { id: string; createdAt: Date; emailVerified: boolean };
export type Service = z.infer<typeof insertServiceSchema> & { id: string };
export type Order = z.infer<typeof insertOrderSchema> & { id: string; userId: string; status: string; createdAt: Date };
export type Project = z.infer<typeof insertProjectSchema> & { id: string; createdAt: Date };
export type Task = z.infer<typeof insertTaskSchema> & { id: string; createdAt: Date };
export type Message = z.infer<typeof insertMessageSchema> & { id: string; senderId: string; createdAt: Date };

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema> & { userId: string };
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema> & { senderId: string };

// Mongoose Models
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

// Convert Mongoose _id to id for compatibility
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
