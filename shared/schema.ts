import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").default("client").notNull(), // client, admin, employee_manager, employee_sales, employee_dev, employee_design, employee_support
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  country: text("country"),
  businessType: text("business_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // restaurants, stores, education, institutions
  priceMin: integer("price_min"),
  priceMax: integer("price_max"),
  estimatedDuration: text("estimated_duration"),
  features: jsonb("features").$type<string[]>(),
  icon: text("icon"), // lucide icon name
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  serviceId: integer("service_id").references(() => services.id),
  status: text("status").default("pending").notNull(), // pending, paid, in_progress, completed, cancelled
  requirements: jsonb("requirements").notNull(), // Form answers
  paymentMethod: text("payment_method"), // bank_transfer, cash, paypal
  paymentProofUrl: text("payment_proof_url"),
  totalAmount: integer("total_amount"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  clientId: integer("client_id").references(() => users.id).notNull(),
  managerId: integer("manager_id").references(() => users.id),
  status: text("status").default("new").notNull(), // new, planning, development, testing, review, delivered
  progress: integer("progress").default(0),
  repoUrl: text("repo_url"),
  stagingUrl: text("staging_url"),
  startDate: timestamp("start_date"),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  assignedTo: integer("assigned_to").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("pending").notNull(), // pending, in_progress, completed
  priority: text("priority").default("medium"), // low, medium, high
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  isInternal: boolean("is_internal").default(false), // If true, hidden from client
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  projectsAsClient: many(projects, { relationName: "clientProjects" }),
  projectsAsManager: many(projects, { relationName: "managerProjects" }),
  tasks: many(tasks),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  service: one(services, { fields: [orders.serviceId], references: [services.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  order: one(orders, { fields: [projects.orderId], references: [orders.id] }),
  client: one(users, { fields: [projects.clientId], references: [users.id], relationName: "clientProjects" }),
  manager: one(users, { fields: [projects.managerId], references: [users.id], relationName: "managerProjects" }),
  tasks: many(tasks),
  messages: many(messages),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  assignee: one(users, { fields: [tasks.assignedTo], references: [users.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  project: one(projects, { fields: [messages.projectId], references: [projects.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

// === SCHEMA EXPORTS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, status: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Message = typeof messages.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
