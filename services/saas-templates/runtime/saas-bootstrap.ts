import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { BusinessConfigModel, EmployeeModel } from "../shared/schema";
import { TenantModel } from "../shared/tenant-schema";

const tierRanks: Record<string, number> = { lite: 1, pro: 2, infinity: 3 };

export async function bootstrapSaasTenant() {
  const tenantId = process.env.TENANT_ID;
  const tier = String(process.env.PROJECT_PLAN_TIER || "").toLowerCase();
  const input = JSON.parse(process.env.BUSINESS_CONFIG_JSON || "{}");
  if (!tenantId || !tierRanks[tier] || !String(input.businessName || "").trim()) {
    throw new Error("Tenant identity, purchased plan, and business configuration are required");
  }
  const ownerHash = process.env.BOOTSTRAP_ADMIN_PASSWORD_HASH;
  const staffHash = process.env.BOOTSTRAP_STAFF_PASSWORD_HASH;
  const rank = tierRanks[tier];
  const features = {
    website: true, menu: true, menuManagement: true, tableManagement: true,
    reservations: true, qrMenu: true, socialLinks: true,
    orderManagement: true, orderTracking: true, kitchenDisplay: true,
    invoicePrinting: true, posSystem: true,
    accounting: rank >= 2, accountingModule: rank >= 2, basicReports: rank >= 2,
    salesReports: rank >= 2, customerManagement: rank >= 2, reviews: rank >= 2,
    appleWallet: rank >= 2, integrations: rank >= 2, paymentGateway: rank >= 2,
    onlinePayments: rank >= 2, loyaltyProgram: rank >= 2, loyaltyPoints: rank >= 2,
    giftCards: rank >= 2, erpIntegration: rank >= 2, customerApp: rank >= 2,
    pwa: rank >= 2, pushNotifications: rank >= 2, email: rank >= 2,
    inventoryManagement: rank >= 3, advancedReports: rank >= 3,
    attendance: rank >= 3, payrollManagement: rank >= 3, employeeManagement: rank >= 3,
    warehouseManagement: rank >= 3, enterpriseAdministration: rank >= 3,
  };
  const aliases: Record<string, string[]> = {
    accounting: ["accounting", "accountingModule", "basicReports"],
    "customer-management": ["customerManagement", "customerApp", "crm"],
    reviews: ["reviews"], "apple-wallet": ["appleWallet", "wallet"],
    integrations: ["integrations", "erpIntegration"], pwa: ["pwa"],
    push: ["push", "pushNotifications"], "sales-reports": ["salesReports"],
    inventory: ["inventory", "inventoryManagement", "rawItems", "recipeManagement", "supplierManagement", "warehouseManagement"],
    payments: ["paymentGateway", "onlinePayments"],
    loyalty: ["loyalty", "loyaltyProgram", "loyaltyPoints", "giftCards"],
    "advanced-reports": ["advancedReports", "advancedAnalytics", "biAnalytics"],
    attendance: ["attendance", "payrollManagement", "employeeManagement", "enterpriseAdministration"],
  };
  for (const feature of Array.isArray(input.extraFeatures) ? input.extraFeatures : []) {
    for (const alias of aliases[feature] || []) (features as any)[alias] = true;
  }
  const deliveryEntitlements = {
    monthlyEmailLimit: rank >= 3 ? 10000 : rank >= 2 ? 1000 : 0,
    businessMailboxes: rank >= 3 ? 5 : 0,
    postDeliveryRevisions: rank >= 2 ? 5 : 0,
    postDeliveryFeatures: rank >= 3 ? 20 : 0,
    prioritySupport: rank >= 3,
    provisioning: {
      emailProvider: rank >= 2 ? "required" : "not-included",
      businessMailboxes: rank >= 3 ? "manual-provisioning-required" : "not-included",
      prioritySupport: rank >= 3 ? "manual-provisioning-required" : "not-included",
      postDeliveryServices: rank >= 2 ? "service-delivery-required" : "not-included",
    },
  };
  const now = new Date();
  const employee = EmployeeModel.collection;
  const owner = await employee.findOne({ tenantId, username: { $regex: "^owner$", $options: "i" } });
  const staff = await employee.findOne({ tenantId, username: "staff" });
  if (!owner) {
    if (ownerHash && !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(ownerHash)) {
      throw new Error("Invalid owner password hash");
    }
    if (!ownerHash && (!process.env.BOOTSTRAP_ADMIN_PASSWORD || process.env.BOOTSTRAP_ADMIN_PASSWORD.length < 16)) {
      throw new Error("Set a secure 16-character BOOTSTRAP_ADMIN_PASSWORD or BOOTSTRAP_ADMIN_PASSWORD_HASH before first startup");
    }
  }
  if (staffHash && !staff && !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(staffHash)) {
    throw new Error("Invalid staff password hash");
  }

  await TenantModel.collection.updateOne(
    { id: tenantId },
    {
      $setOnInsert: {
        id: tenantId,
        nameAr: String(input.businessName).slice(0, 180),
        nameEn: String(input.businessNameEn || input.businessName).slice(0, 180),
        type: "restaurant",
        status: "active",
        createdAt: now,
      },
      $set: { subscriptionPlan: tier, features, deliveryEntitlements, updatedAt: now },
    },
    { upsert: true },
  );
  await BusinessConfigModel.db!.collection("subscriptionconfigs").updateOne(
    { tenantId },
    { $setOnInsert: {
      tenantId,
      createdAt: now,
    }, $set: {
      plan: tier,
      isActive: true,
      maxBranches: rank >= 3 ? 999 : rank >= 2 ? 5 : 1,
      maxEmployees: rank >= 3 ? 9999 : rank >= 2 ? 100 : 10,
      maxProducts: rank >= 3 ? 999999 : rank >= 2 ? 10000 : 250,
      maxOrders: rank >= 3 ? 999999 : rank >= 2 ? 100000 : 5000,
      ...features,
      deliveryEntitlements,
      monthlyEmailLimit: deliveryEntitlements.monthlyEmailLimit,
      businessMailboxes: deliveryEntitlements.businessMailboxes,
      postDeliveryRevisions: deliveryEntitlements.postDeliveryRevisions,
      postDeliveryFeatures: deliveryEntitlements.postDeliveryFeatures,
      prioritySupport: deliveryEntitlements.prioritySupport,
      updatedAt: now,
    } },
    { upsert: true },
  );
  await BusinessConfigModel.collection.updateOne(
    { tenantId },
    { $set: {
      tenantId,
      tradeNameAr: String(input.businessName).slice(0, 180),
      tradeNameEn: String(input.businessNameEn || input.businessName).slice(0, 180),
      activityType: "restaurant",
      vatNumber: String(input.taxNumber || "").slice(0, 80),
      commercialRegNumber: String(input.commercialRegNumber || "").slice(0, 80),
      commercialRegUrl: String(input.commercialRegUrl || "").slice(0, 1000),
      bankName: String(input.bankName || "").slice(0, 120),
      bankAccountName: String(input.bankAccountName || "").slice(0, 180),
      iban: String(input.iban || "").slice(0, 64),
      logoUrl: String(input.logoUrl || "").slice(0, 1000),
      primaryColor: String(input.primaryColor || "#24433e").slice(0, 7),
      secondaryColor: String(input.secondaryColor || input.primaryColor || "#24433e").slice(0, 7),
      heroImageUrl: String(input.heroImageUrl || "").slice(0, 1000),
      splashImageUrl: String(input.splashImageUrl || "").slice(0, 1000),
      customerWhatsappRegistration: input.customerWhatsappRegistration === true,
      notificationEmail: input.notificationEmail === true,
      phone: String(input.phone || "").slice(0, 40),
      address: String(input.address || "").slice(0, 400),
      websiteUrl: String(input.websiteUrl || "").slice(0, 1000),
      updatedAt: now,
    }, $setOnInsert: { createdAt: now, paymentGateway: { enabled: false, paymentTestMode: true } } },
    { upsert: true },
  );

  if (!owner) {
    const password = ownerHash || await bcrypt.hash(process.env.BOOTSTRAP_ADMIN_PASSWORD!, 12);
    await employee.insertOne({
      id: randomUUID(),
      tenantId,
      username: "owner",
      password,
      fullName: String(input.businessName).slice(0, 180),
      role: "admin",
      title: "Owner",
      jobTitle: "Owner",
      isActivated: 1,
      isActive: 1,
      permissions: ["admin"],
      allowedPages: ["*"],
      createdAt: now,
      updatedAt: now,
    });
  }
  if (staffHash && !staff) {
    await employee.insertOne({
      id: randomUUID(), tenantId, username: "staff", password: staffHash,
      fullName: "Staff", role: "cashier", title: "Cashier", jobTitle: "Cashier",
      isActivated: 1, isActive: 1,
      permissions: ["pos", "orders"], allowedPages: ["pos", "cashier", "orders", "/pos", "/cashier", "/orders"],
      createdAt: now, updatedAt: now,
    });
  }
}