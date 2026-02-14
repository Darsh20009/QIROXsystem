import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roles = ["client", "admin", "manager", "accountant", "sales_manager", "sales", "developer", "designer", "support", "merchant", "customer"] as const;
export type UserRole = (typeof roles)[number];

// --- Users & Authentication ---
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role", { enum: roles }).default("client").notNull(),
  phone: text("phone"),
  country: text("country"),
  businessType: text("business_type"),
  whatsappNumber: text("whatsapp_number"),
  logoUrl: text("logo_url"),
  avatarUrl: text("avatar_url"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Attendance (Legacy Support) ---
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  checkIn: timestamp("check_in").notNull(),
  checkOut: timestamp("check_out"),
  ipAddress: text("ip_address"),
  location: jsonb("location"),
  workHours: decimal("work_hours", { precision: 10, scale: 2 }),
});

// --- Services (Legacy Support) ---
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  priceMin: integer("price_min"),
  priceMax: integer("price_max"),
  estimatedDuration: text("estimated_duration"),
  features: text("features").array(),
  icon: text("icon"),
});

// --- Stores (Multi-tenant) ---
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  description: text("description"),
  currency: text("currency").default("SAR").notNull(),
  isLive: boolean("is_live").default(false).notNull(),
  themeConfig: jsonb("theme_config").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Products ---
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  inventoryQuantity: integer("inventory_quantity").default(0).notNull(),
  imageUrl: text("image_url"),
  category: text("category"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Orders ---
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  serviceId: integer("service_id").references(() => services.id),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("pending").notNull(),
  paymentMethod: text("payment_method"),
  paymentProofUrl: text("payment_proof_url"),
  isDepositPaid: boolean("is_deposit_paid").default(false).notNull(),
  requirements: jsonb("requirements"),
  shippingAddress: jsonb("shipping_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Projects ---
export const projectStatuses = ["new", "under_study", "pending_payment", "in_progress", "testing", "review", "delivery", "closed"] as const;
export type ProjectStatus = (typeof projectStatuses)[number];

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  clientId: integer("client_id").references(() => users.id).notNull(),
  managerId: integer("manager_id").references(() => users.id),
  status: text("status", { enum: projectStatuses }).default("new").notNull(),
  progress: integer("progress").default(0).notNull(),
  repoUrl: text("repo_url"),
  stagingUrl: text("staging_url"),
  startDate: timestamp("start_date"),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Tasks ---
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  assignedTo: integer("assigned_to").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("pending").notNull(),
  priority: text("priority").default("medium").notNull(),
  dueDate: timestamp("due_date"),
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Messages ---
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  isInternal: boolean("is_internal").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Project Members ---
export const projectMembers = pgTable("project_members", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").notNull(),
});

// --- Project Vault ---
export const projectVault = pgTable("project_vault", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isSecret: boolean("is_secret").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Schemas & Types ---
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, emailVerified: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true });
export const insertStoreSchema = createInsertSchema(stores).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertProjectMemberSchema = createInsertSchema(projectMembers).omit({ id: true });
export const insertProjectVaultSchema = createInsertSchema(projectVault).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type ProjectVault = typeof projectVault.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertProjectMember = z.infer<typeof insertProjectMemberSchema>;
export type InsertProjectVault = z.infer<typeof insertProjectVaultSchema>;

