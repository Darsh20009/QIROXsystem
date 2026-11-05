import assert from "node:assert/strict";
import test from "node:test";
import {
  DATA_ENTRY_ORDER_HIDDEN_FIELDS,
  DATA_ENTRY_ROUTE_MATRIX,
  DATA_ENTRY_SENSITIVE_FIELDS,
  DATA_ENTRY_SPEC_HIDDEN_FIELDS,
  DATA_ENTRY_USER_FIELDS,
  isAllowedPartnerLogoMimeType,
  preserveOriginalLogoUrl,
  projectDataEntryUser,
  redactFields,
  redactSensitiveFields,
  roleCanAccess,
} from "./data-entry-policy";

test("Data Entry route matrix protects partner, API key, and task operations", () => {
  const roles = ["admin", "manager", "data_entry", "accountant", "developer", "client"];

  const expected: Record<string, Record<string, Record<string, boolean>>> = {
    partners: {
      read: { admin: true, manager: true, data_entry: true, accountant: false, developer: false, client: false },
      create: { admin: true, manager: true, data_entry: true, accountant: false, developer: false, client: false },
      update: { admin: true, manager: true, data_entry: true, accountant: false, developer: false, client: false },
      delete: { admin: true, manager: true, data_entry: false, accountant: false, developer: false, client: false },
    },
    apiKeys: {
      read: { admin: true, manager: true, data_entry: true, accountant: false, developer: false, client: false },
      create: { admin: true, manager: true, data_entry: false, accountant: false, developer: false, client: false },
      update: { admin: true, manager: true, data_entry: false, accountant: false, developer: false, client: false },
      delete: { admin: true, manager: true, data_entry: false, accountant: false, developer: false, client: false },
    },
    tasks: {
      read: { admin: true, manager: true, data_entry: true, accountant: true, developer: true, client: false },
      create: { admin: true, manager: true, data_entry: false, accountant: true, developer: true, client: false },
      update: { admin: true, manager: true, data_entry: false, accountant: true, developer: true, client: false },
      statusUpdate: { admin: true, manager: true, data_entry: true, accountant: true, developer: true, client: false },
      delete: { admin: true, manager: true, data_entry: false, accountant: true, developer: true, client: false },
    },
  };

  for (const [resource, actions] of Object.entries(expected)) {
    for (const [action, roleExpectations] of Object.entries(actions)) {
      for (const role of roles) {
        assert.equal(
          roleCanAccess(role, resource as keyof typeof DATA_ENTRY_ROUTE_MATRIX, action as any),
          roleExpectations[role],
          `${role} ${action} access for ${resource}`,
        );
      }
    }
  }

  assert.equal(roleCanAccess("data_entry", "partnerLogo", "create"), true);
  assert.equal(roleCanAccess("client", "partnerLogo", "create"), false);
  assert.equal(roleCanAccess(undefined, "partners", "read"), false);
});

test("Data Entry allowlists and redaction exclude credentials and protected data", () => {
  assert.equal(DATA_ENTRY_USER_FIELDS.includes("role" as never), false);
  assert.equal(DATA_ENTRY_USER_FIELDS.includes("password" as never), false);
  assert.equal(DATA_ENTRY_USER_FIELDS.includes("allowedPages" as never), false);

  const projectedEmployee = projectDataEntryUser({
    _id: { toString: () => "employee-1" },
    username: "employee",
    fullName: "Data Entry",
    email: "employee@example.test",
    phone: "+966500000000",
    role: "admin",
    allowedPages: ["/admin/finance"],
    password: "password",
    walletBalance: 9999,
  });
  assert.deepEqual(projectedEmployee, {
    id: "employee-1",
    username: "employee",
    fullName: "Data Entry",
    email: "employee@example.test",
    phone: "+966500000000",
  });

  const record = {
    keyHash: "hash",
    rawKey: "raw",
    secret: "secret",
    token: "token",
    password: "password",
    accessToken: "access",
    refreshToken: "refresh",
    privateKey: "private",
    fullName: "Data Entry",
    email: "employee@example.test",
  };
  const safe = redactSensitiveFields(record);
  for (const field of DATA_ENTRY_SENSITIVE_FIELDS) {
    assert.equal(field in safe, false, `${field} must not be exposed`);
  }
  assert.equal(safe.fullName, record.fullName);
  assert.equal(safe.email, record.email);

  const order = {
    businessName: "Example",
    accessCredentials: "user:password",
    paymentMethod: "card",
    totalAmount: 1000,
    walletAmountUsed: 50,
    shippingFee: 25,
    scheduledMeeting: "private",
  };
  const safeOrder = redactFields(order, DATA_ENTRY_ORDER_HIDDEN_FIELDS);
  assert.deepEqual(safeOrder, { businessName: "Example" });

  const specs = {
    projectName: "Example",
    databaseUri: "mongodb://secret",
    deploymentUsername: "deploy",
    deploymentPassword: "password",
    variables: { SECRET: "value" },
    totalBudget: 1000,
  };
  const safeSpecs = redactFields(specs, DATA_ENTRY_SPEC_HIDDEN_FIELDS);
  assert.deepEqual(safeSpecs, { projectName: "Example" });
});

test("partner logo upload accepts PNG/JPEG/WebP and rejects unrelated types", () => {
  for (const mimetype of ["image/png", "image/jpeg", "image/webp"]) {
    assert.equal(isAllowedPartnerLogoMimeType(mimetype), true, mimetype);
  }
  for (const mimetype of ["application/pdf", "image/bmp", "text/plain", "application/javascript"]) {
    assert.equal(isAllowedPartnerLogoMimeType(mimetype), false, mimetype);
  }
});

test("partner logo processing keeps originalUrl when Sharp conversion fails", () => {
  const originalUrl = "/uploads/logo-original.jpg";
  const processed = preserveOriginalLogoUrl(originalUrl, "/uploads/logo.png");
  assert.deepEqual(processed, {
    logoUrl: "/uploads/logo.png",
    logoOriginalUrl: originalUrl,
    processed: true,
  });

  const fallback = preserveOriginalLogoUrl(originalUrl, null);
  assert.deepEqual(fallback, {
    logoUrl: originalUrl,
    logoOriginalUrl: originalUrl,
    processed: false,
  });
});

test("valid PNG/JPEG/WebP logo buffers convert to PNG", async () => {
  const sharpModule: any = await import("sharp");
  const sharp = sharpModule.default || sharpModule.sharp || sharpModule;

  for (const format of ["png", "jpeg", "webp"] as const) {
    const input = await sharp({
      create: {
        width: 2,
        height: 2,
        channels: 4,
        background: { r: 34, g: 68, b: 102, alpha: 1 },
      },
    })[format]().toBuffer();
    const output = await sharp(input).ensureAlpha().png({ compressionLevel: 9 }).toBuffer();
    const metadata = await sharp(output).metadata();
    assert.equal(metadata.format, "png", `${format} should produce PNG output`);
    assert.equal(metadata.width, 2);
    assert.equal(metadata.height, 2);
  }
});

test("invalid logo data follows the original-file fallback contract", async () => {
  const sharpModule: any = await import("sharp");
  const sharp = sharpModule.default || sharpModule.sharp || sharpModule;
  await assert.rejects(
    () => sharp(Buffer.from("not-an-image")).ensureAlpha().png().toBuffer(),
    /Input|image|corrupt|unsupported/i,
  );
  assert.equal(
    preserveOriginalLogoUrl("/uploads/broken-original.webp", null).logoUrl,
    "/uploads/broken-original.webp",
  );
});