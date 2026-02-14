import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// --- Users & Authentication ---
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role", { enum: ["admin", "merchant", "customer", "support"] }).default("customer").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Stores (Multi-tenant) ---
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // e.g., mystore.q-platform.com
  logoUrl: text("logo_url"),
  description: text("description"),
  currency: text("currency").default("SAR").notNull(),
  isLive: boolean("is_live").default(false).notNull(),
  themeConfig: jsonb("theme_config").default({}), // Colors, fonts, layouts
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
  customerId: integer("customer_id").references(() => users.id),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status", { enum: ["pending", "paid", "shipped", "delivered", "cancelled"] }).default("pending").notNull(),
  shippingAddress: jsonb("shipping_address"),
  paymentStatus: text("payment_status").default("unpaid").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Order Items ---
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

// --- Schemas & Types ---
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertStoreSchema = createInsertSchema(stores).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
