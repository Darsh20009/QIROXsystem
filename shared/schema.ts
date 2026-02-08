import { z } from "zod";

export const roles = ["client", "admin", "employee_manager", "employee_sales", "employee_dev", "employee_design", "employee_support"] as const;

export const insertUserSchema = z.object({
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  role: z.enum(roles).default("client"),
  fullName: z.string().min(1, "الاسم الكامل مطلوب"),
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
  // Smart Questionnaire Fields
  projectType: z.string().optional(),
  sector: z.string().optional(),
  competitors: z.string().optional(),
  visualStyle: z.string().optional(),
  favoriteExamples: z.string().optional(),
  requiredFunctions: z.string().optional(),
  requiredSystems: z.string().optional(),
  siteLanguage: z.string().optional(),
  whatsappIntegration: z.boolean().default(false),
  socialIntegration: z.boolean().default(false),
  hasLogo: z.boolean().default(false),
  needsLogoDesign: z.boolean().default(false),
  hasHosting: z.boolean().default(false),
  hasDomain: z.boolean().default(false),
  // Uploads (URLs)
  logoUrl: z.string().optional(),
  brandIdentityUrl: z.string().optional(),
  filesUrl: z.string().optional(),
  contentUrl: z.string().optional(),
  imagesUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  accessCredentials: z.string().optional(),
  // Payment
  paymentMethod: z.enum(["bank_transfer", "paypal"]).optional(),
  paymentProofUrl: z.string().optional(),
  totalAmount: z.number().optional(),
  isDepositPaid: z.boolean().default(false),
  status: z.string().default("pending"),
  requirements: z.record(z.any()).optional(),
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

export type User = z.infer<typeof insertUserSchema> & { id: string; createdAt: Date; emailVerified: boolean };
export type Service = z.infer<typeof insertServiceSchema> & { id: string };
export type Order = z.infer<typeof insertOrderSchema> & { id: string; userId: string; createdAt: Date };
export type Project = z.infer<typeof insertProjectSchema> & { id: string; createdAt: Date };
export type Task = z.infer<typeof insertTaskSchema> & { id: string; createdAt: Date };
export type Message = z.infer<typeof insertMessageSchema> & { id: string; senderId: string; createdAt: Date };

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema> & { userId: string };
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema> & { senderId: string };
