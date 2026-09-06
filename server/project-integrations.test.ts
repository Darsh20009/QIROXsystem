import assert from "node:assert/strict";
import { createServer, request as httpRequest, type Server } from "node:http";
import test from "node:test";
import mongoose from "mongoose";
import express, { type Express } from "express";
import { registerRoutes } from "./routes";
import {
  createProjectIntegrationSecret,
  hashProjectIntegrationKey,
  projectIntegrationApiDocs,
  projectIntegrationApiPath,
  reserveProjectIntegrationRateLimit,
  serializeProjectIntegration,
} from "./project-integrations";
import { dispatchNotification, processDueNotificationDeliveries } from "./notifications/service";
import { NotificationDeliveryModel } from "./models/notification-delivery";
import { ProjectIntegrationModel } from "./models/project-integrations";

type HttpResponse = {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: any;
};

function requestProjectApi(
  server: Server,
  path: string,
  options: { authorization?: string; idempotencyKey?: string; body?: unknown } = {},
): Promise<HttpResponse> {
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server is not listening");
  const body = options.body === undefined ? undefined : JSON.stringify(options.body);
  return new Promise((resolve, reject) => {
    const req = httpRequest({
      port: address.port,
      host: "127.0.0.1",
      method: "POST",
      path,
      headers: {
        ...(options.authorization ? { authorization: options.authorization } : {}),
        ...(options.idempotencyKey ? { "idempotency-key": options.idempotencyKey } : {}),
        ...(body ? {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(body),
        } : {}),
      },
    }, (res) => {
      let text = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { text += chunk; });
      res.on("end", () => {
        let bodyValue: unknown = text;
        try { bodyValue = text ? JSON.parse(text) : undefined; } catch { /* text response */ }
        resolve({
          status: res.statusCode || 0,
          headers: res.headers as Record<string, string | string[] | undefined>,
          body: bodyValue,
        });
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function createProjectApiHarness(): Promise<Server> {
  process.env.NODE_ENV = "test";
  process.env.SESSION_SECRET = "project-integration-http-test-session";
  const app = express();
  app.use(express.json());
  const server = createServer(app);
  const mongoUri = process.env.MONGODB_URI;
  process.env.MONGODB_URI = "";
  try {
    await registerRoutes(server, app);
  } finally {
    if (mongoUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = mongoUri;
  }
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  return server;
}

test("project integration secrets stay one-time and rate limits are isolated", async () => {
  const secret = createProjectIntegrationSecret("whatsapp");
  assert.match(secret.rawKey, /^qrx_project_whatsapp_[a-f0-9]{64}$/);
  const apiSecret = createProjectIntegrationSecret("api");
  assert.match(apiSecret.rawKey, /^qrx_project_api_[a-f0-9]{64}$/);
  assert.equal(projectIntegrationApiPath("project-1", "api"), "/api/v1/projects/project-1/api");
  assert.equal(hashProjectIntegrationKey(secret.rawKey), secret.keyHash);
  assert.notEqual(secret.rawKey, secret.keyHash);
  assert.equal(secret.keyPrefix, `${secret.rawKey.slice(0, 24)}...`);
  assert.equal(projectIntegrationApiPath("project-1", "whatsapp"), "/api/v1/projects/project-1/whatsapp");

  const serialized = serializeProjectIntegration({
    _id: new mongoose.Types.ObjectId(),
    type: "whatsapp",
    environment: "production",
    status: "active",
    keyPrefix: secret.keyPrefix,
    keyHash: secret.keyHash,
    rawKey: secret.rawKey,
    apiBasePath: "/api/v1/projects/project-1/whatsapp",
    documentationPath: "/api/v1/projects/integrations/docs",
  }, {
    protocol: "https",
    get: (name: string) => name === "host" ? "example.test" : "",
  });
  const serializedText = JSON.stringify(serialized);
  assert.ok(serialized);
  assert.equal(serializedText.includes(secret.rawKey), false, "raw key must never be serialized");
  assert.equal(serializedText.includes(secret.keyHash), false, "key hash must never be serialized");
  assert.equal(serialized?.keyPrefix, secret.keyPrefix);
  assert.equal(projectIntegrationApiDocs.endpoints.length, 3);
  assert.deepEqual(projectIntegrationApiDocs.limits.api.channels, ["email", "whatsapp"]);
  assert.equal(JSON.stringify(projectIntegrationApiDocs).includes("WHATSAPP_META_ACCESS_TOKEN"), false);

  const rateKey = `unit-${new mongoose.Types.ObjectId()}`;
  const results = await Promise.all(
    Array.from({ length: 5 }, () => reserveProjectIntegrationRateLimit(rateKey, 2)),
  );
  assert.equal(results.filter(result => result.allowed).length, 2);
  assert.equal(reserveProjectIntegrationRateLimit(`unit-${new mongoose.Types.ObjectId()}`, 2).allowed, true);
});

test("the public project API key works over HTTP for both channels without leaking or duplicating delivery", {
  skip: !process.env.MONGODB_URI,
  concurrency: false,
}, async () => {
  await mongoose.connect(process.env.MONGODB_URI!);

  const orderA = new mongoose.Types.ObjectId();
  const orderB = new mongoose.Types.ObjectId();
  const projectA = new mongoose.Types.ObjectId();
  const projectB = new mongoose.Types.ObjectId();
  const apiSecret = createProjectIntegrationSecret("api");
  const emailOnlySecret = createProjectIntegrationSecret("email");
  const whatsappOnlySecret = createProjectIntegrationSecret("whatsapp");
  const expiredSecret = createProjectIntegrationSecret("api");
  const marker = `project-api-http-test-${new mongoose.Types.ObjectId()}`;
  const emailIdempotencyKey = `${marker}-email`;
  const whatsappIdempotencyKey = `${marker}-whatsapp`;
  const originalFetch = globalThis.fetch;
  const originalEnv = {
    nodeEnv: process.env.NODE_ENV,
    sessionSecret: process.env.SESSION_SECRET,
    whatsappProvider: process.env.WHATSAPP_PROVIDER,
    whatsappToken: process.env.WHATSAPP_META_ACCESS_TOKEN,
    whatsappPhoneId: process.env.WHATSAPP_META_PHONE_NUMBER_ID,
  };
  const smtpKeys = [
    "CPANEL_SMTP_HOST", "CPANEL_SMTP_USER", "CPANEL_SMTP_PASS",
    "SMTP_HOST", "SMTP_USER", "SMTP_PASS",
  ];
  const originalSmtpEnv = Object.fromEntries(smtpKeys.map(key => [key, process.env[key]]));
  let server: Server | undefined;
  let apiIntegrationId: mongoose.Types.ObjectId | undefined;
  let emailDeliveryId = "";
  let whatsappDeliveryId = "";
  let whatsappProviderCalls = 0;
  let whatsappMessage = "";
  const { waModule } = await import("./whatsapp-module");
  const originalSendNotification = waModule.sendNotification;

  const assertNoSecret = (response: HttpResponse, secret: string) => {
    assert.equal(JSON.stringify(response.body).includes(secret), false, "HTTP response must not expose raw key material");
  };

  try {
    process.env.NODE_ENV = "test";
    process.env.SESSION_SECRET = "project-integration-http-test-session";
    process.env.WHATSAPP_PROVIDER = "baileys";
    waModule.sendNotification = (async (_phone: string, message: string) => {
      whatsappProviderCalls += 1;
      whatsappMessage = message;
    }) as typeof waModule.sendNotification;
    for (const key of smtpKeys) delete process.env[key];

    const apiIntegration = await ProjectIntegrationModel.create({
      projectId: projectA,
      orderId: orderA,
      type: "api",
      environment: "production",
      keyHash: apiSecret.keyHash,
      keyPrefix: apiSecret.keyPrefix,
      publicIdentifier: `qrx_api_http_${new mongoose.Types.ObjectId()}`,
      apiBasePath: `/api/v1/projects/${projectA}/api`,
      documentationPath: "/api/v1/projects/integrations/docs",
      rateLimitPerMinute: 5,
      maxMessageLength: 100000,
    });
    apiIntegrationId = apiIntegration._id;

    const emailOnlyIntegration = await ProjectIntegrationModel.create({
      projectId: projectA,
      orderId: orderA,
      type: "email",
      environment: "production",
      keyHash: emailOnlySecret.keyHash,
      keyPrefix: emailOnlySecret.keyPrefix,
      publicIdentifier: `qrx_email_http_${new mongoose.Types.ObjectId()}`,
      apiBasePath: `/api/v1/projects/${projectA}/email`,
      documentationPath: "/api/v1/projects/integrations/docs",
    });

    await ProjectIntegrationModel.create({
      projectId: projectA,
      orderId: orderA,
      type: "whatsapp",
      environment: "production",
      keyHash: whatsappOnlySecret.keyHash,
      keyPrefix: whatsappOnlySecret.keyPrefix,
      publicIdentifier: `qrx_whatsapp_http_${new mongoose.Types.ObjectId()}`,
      apiBasePath: `/api/v1/projects/${projectA}/whatsapp`,
      documentationPath: "/api/v1/projects/integrations/docs",
    });

    await ProjectIntegrationModel.create({
      projectId: projectA,
      orderId: orderA,
      type: "api",
      environment: "staging",
      status: "expired",
      expiresAt: new Date(Date.now() - 1_000),
      keyHash: expiredSecret.keyHash,
      keyPrefix: expiredSecret.keyPrefix,
      publicIdentifier: `qrx_api_expired_${new mongoose.Types.ObjectId()}`,
      apiBasePath: `/api/v1/projects/${projectA}/api`,
      documentationPath: "/api/v1/projects/integrations/docs",
    });

    server = await createProjectApiHarness();

    const endpoint = `/api/v1/projects/${projectA}/api`;
    const missingKey = await requestProjectApi(server, endpoint, {
      idempotencyKey: `${marker}-missing`,
      body: { channel: "email", recipient: { email: "client@example.test" }, subject: "Test", message: "Test" },
    });
    assert.equal(missingKey.status, 401);

    const malformedKey = await requestProjectApi(server, endpoint, {
      authorization: "Bearer qrx_project_api_not-a-valid-key",
      idempotencyKey: `${marker}-malformed`,
      body: { channel: "email", recipient: { email: "client@example.test" }, subject: "Test", message: "Test" },
    });
    assert.equal(malformedKey.status, 401);
    assertNoSecret(malformedKey, apiSecret.rawKey);

    const emailKeyOnApiRoute = await requestProjectApi(server, endpoint, {
      authorization: `Bearer ${emailOnlySecret.rawKey}`,
      idempotencyKey: `${marker}-wrong-type`,
      body: { channel: "email", recipient: { email: "client@example.test" }, subject: "Test", message: "Test" },
    });
    assert.equal(emailKeyOnApiRoute.status, 403);
    assertNoSecret(emailKeyOnApiRoute, emailOnlySecret.rawKey);

    const whatsappKeyOnApiRoute = await requestProjectApi(server, endpoint, {
      authorization: `Bearer ${whatsappOnlySecret.rawKey}`,
      idempotencyKey: `${marker}-wrong-whatsapp-type`,
      body: { channel: "whatsapp", recipient: { phone: "+966501234567" }, message: "Test" },
    });
    assert.equal(whatsappKeyOnApiRoute.status, 403);
    assertNoSecret(whatsappKeyOnApiRoute, whatsappOnlySecret.rawKey);

    const invalidChannel = await requestProjectApi(server, endpoint, {
      authorization: `Bearer ${apiSecret.rawKey}`,
      idempotencyKey: `${marker}-invalid-channel`,
      body: { channel: "sms", recipient: { phone: "+966501234567" }, message: "Test" },
    });
    assert.equal(invalidChannel.status, 400);
    assertNoSecret(invalidChannel, apiSecret.rawKey);

    const crossProject = await requestProjectApi(server, `/api/v1/projects/${projectB}/api`, {
      authorization: `Bearer ${apiSecret.rawKey}`,
      idempotencyKey: `${marker}-cross-project`,
      body: { channel: "email", recipient: { email: "client@example.test" }, subject: "Test", message: "Test" },
    });
    assert.equal(crossProject.status, 401);
    assertNoSecret(crossProject, apiSecret.rawKey);

    const emailResponse = await requestProjectApi(server, endpoint, {
      authorization: `Bearer ${apiSecret.rawKey}`,
      idempotencyKey: emailIdempotencyKey,
      body: {
        channel: "email",
        recipient: { name: "HTTP Test", email: "client@example.test" },
        subject: "Project API email",
        message: "Email channel through the public API",
      },
    });
    assert.equal(emailResponse.status, 202);
    assert.ok(Number(emailResponse.headers["x-ratelimit-limit"]) >= 1);
    assert.ok(Number(emailResponse.headers["x-ratelimit-remaining"]) >= 0);
    assertNoSecret(emailResponse, apiSecret.rawKey);
    emailDeliveryId = String(emailResponse.body?.delivery?.id || "");
    assert.match(emailDeliveryId, /^[a-f0-9]{24}$/);
    const emailDelivery = await NotificationDeliveryModel.findById(emailDeliveryId).lean();
    assert.ok(emailDelivery);
    assert.equal(emailDelivery?.channel, "email");
    assert.equal(emailDelivery?.metadata?.projectIntegrationApi, true);

    const whatsappResponse = await requestProjectApi(server, endpoint, {
      authorization: `Bearer ${apiSecret.rawKey}`,
      idempotencyKey: whatsappIdempotencyKey,
      body: {
        channel: "whatsapp",
        recipient: { name: "HTTP Test", phone: "+966501234567" },
        platformName: "نظام الاختبار",
        clientName: "عميل الاختبار",
        code: "123456",
      },
    });
    assert.equal(whatsappResponse.status, 202);
    assert.equal(whatsappResponse.body?.delivery?.status, "sent");
    assert.equal(whatsappProviderCalls, 1);
    assert.equal(whatsappMessage, "المنصة: نظام الاختبار\nالعميل: عميل الاختبار\nرمز التحقق: 123456");
    assertNoSecret(whatsappResponse, apiSecret.rawKey);
    whatsappDeliveryId = String(whatsappResponse.body?.delivery?.id || "");

    const replayResponse = await requestProjectApi(server, endpoint, {
      authorization: `Bearer ${apiSecret.rawKey}`,
      idempotencyKey: whatsappIdempotencyKey,
      body: {
        channel: "whatsapp",
        recipient: { name: "HTTP Test", phone: "+966501234567" },
        platformName: "نظام الاختبار",
        clientName: "عميل الاختبار",
        code: "123456",
      },
    });
    assert.equal(replayResponse.status, 202);
    assert.equal(replayResponse.body?.delivery?.id, whatsappDeliveryId);
    assert.equal(whatsappProviderCalls, 1, "idempotent replay must not call Baileys twice");
    assert.equal(await NotificationDeliveryModel.countDocuments({
      idempotencyKey: `project-integration:${apiIntegrationId}:${whatsappIdempotencyKey}`,
      channel: "whatsapp",
    }), 1);

    const disabledApi = await ProjectIntegrationModel.findByIdAndUpdate(
      apiIntegrationId,
      { $set: { status: "disabled" } },
      { new: true },
    ).lean();
    assert.equal(disabledApi?.status, "disabled");
    const disabledResponse = await requestProjectApi(server, endpoint, {
      authorization: `Bearer ${apiSecret.rawKey}`,
      idempotencyKey: `${marker}-disabled`,
      body: { channel: "email", recipient: { email: "client@example.test" }, subject: "Test", message: "Test" },
    });
    assert.equal(disabledResponse.status, 403);
    assertNoSecret(disabledResponse, apiSecret.rawKey);

    const expiredResponse = await requestProjectApi(server, endpoint, {
      authorization: `Bearer ${expiredSecret.rawKey}`,
      idempotencyKey: `${marker}-expired`,
      body: { channel: "email", recipient: { email: "client@example.test" }, subject: "Test", message: "Test" },
    });
    assert.equal(expiredResponse.status, 403);
    assertNoSecret(expiredResponse, expiredSecret.rawKey);
    assert.equal(await NotificationDeliveryModel.countDocuments({ _id: { $in: [emailDeliveryId, whatsappDeliveryId] } }), 2);
    assert.ok(await ProjectIntegrationModel.exists({ _id: emailOnlyIntegration._id }));
  } finally {
    globalThis.fetch = originalFetch;
    waModule.sendNotification = originalSendNotification;
    if (originalEnv.nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnv.nodeEnv;
    if (originalEnv.sessionSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = originalEnv.sessionSecret;
    if (originalEnv.whatsappProvider === undefined) delete process.env.WHATSAPP_PROVIDER;
    else process.env.WHATSAPP_PROVIDER = originalEnv.whatsappProvider;
    if (originalEnv.whatsappToken === undefined) delete process.env.WHATSAPP_META_ACCESS_TOKEN;
    else process.env.WHATSAPP_META_ACCESS_TOKEN = originalEnv.whatsappToken;
    if (originalEnv.whatsappPhoneId === undefined) delete process.env.WHATSAPP_META_PHONE_NUMBER_ID;
    else process.env.WHATSAPP_META_PHONE_NUMBER_ID = originalEnv.whatsappPhoneId;
    for (const key of smtpKeys) {
      if (originalSmtpEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalSmtpEnv[key];
    }
    if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
    await NotificationDeliveryModel.deleteMany({ idempotencyKey: { $regex: `^project-integration:.*:${marker}` } });
    await ProjectIntegrationModel.deleteMany({ orderId: { $in: [orderA, orderB] } });
    await mongoose.disconnect();
  }
});


test("project integration keys are scoped, revocable, expirable, and idempotent", {
  skip: !process.env.MONGODB_URI,
}, async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const orderA = new mongoose.Types.ObjectId();
  const orderB = new mongoose.Types.ObjectId();
  const projectA = new mongoose.Types.ObjectId();
  const projectB = new mongoose.Types.ObjectId();
  const secret = createProjectIntegrationSecret("email");
  const marker = `project-integration-test-${new mongoose.Types.ObjectId()}`;
  let integrationId: mongoose.Types.ObjectId | null = null;

  const findByKey = async (reference: mongoose.Types.ObjectId, type: string, rawKey: string) =>
    ProjectIntegrationModel.findOne({
      $or: [{ orderId: reference }, { projectId: reference }],
      type,
      keyHash: hashProjectIntegrationKey(rawKey),
    }).lean();

  const activeByKey = async (reference: mongoose.Types.ObjectId, type: string, rawKey: string) => {
    const integration = await findByKey(reference, type, rawKey);
    if (!integration || integration.status !== "active") return null;
    if (integration.expiresAt && integration.expiresAt <= new Date()) return null;
    return integration;
  };

  try {
    const integration = await ProjectIntegrationModel.create({
      projectId: projectA,
      orderId: orderA,
      type: "email",
      environment: "production",
      keyHash: secret.keyHash,
      keyPrefix: secret.keyPrefix,
      publicIdentifier: `qrx_email_test_${new mongoose.Types.ObjectId().toString()}`,
      apiBasePath: "/api/v1/projects/project-a/email",
      documentationPath: "/api/v1/projects/integrations/docs",
      rateLimitPerMinute: 2,
    });
    integrationId = integration._id;

    assert.ok(await activeByKey(projectA, "email", secret.rawKey));
    assert.equal(await activeByKey(projectB, "email", secret.rawKey), null, "a key cannot cross projects");
    assert.equal(await activeByKey(projectA, "whatsapp", secret.rawKey), null, "an email key cannot call WhatsApp");

    await ProjectIntegrationModel.updateOne({ _id: integrationId }, { $set: { status: "disabled" } });
    assert.equal(await activeByKey(projectA, "email", secret.rawKey), null, "disabled keys must stop immediately");
    await ProjectIntegrationModel.updateOne({ _id: integrationId }, { $set: { status: "active", expiresAt: new Date(Date.now() - 1_000) } });
    assert.equal(await activeByKey(projectA, "email", secret.rawKey), null, "expired keys must stop immediately");

    await NotificationDeliveryModel.init();
    const first = await dispatchNotification({
      event: "project_integration_test",
      idempotencyKey: marker,
      recipient: {},
      subject: "test",
      message: "test",
      channels: ["email"],
      metadata: { source: "project_integration_test", projectIntegrationId: String(integrationId) },
    });
    const second = await dispatchNotification({
      event: "project_integration_test",
      idempotencyKey: marker,
      recipient: {},
      subject: "test",
      message: "test",
      channels: ["email"],
      metadata: { source: "project_integration_test", projectIntegrationId: String(integrationId) },
    });
    assert.equal(first[0]?.id, second[0]?.id, "repeating an idempotency key must reuse the delivery");
    assert.equal(await NotificationDeliveryModel.countDocuments({ idempotencyKey: marker, channel: "email" }), 1);

    const safeRecord = await ProjectIntegrationModel.findById(integrationId).lean();
    assert.ok(safeRecord);
    assert.equal("keyHash" in safeRecord, false, "normal reads must not expose the key hash");
    assert.equal(JSON.stringify(safeRecord).includes(secret.rawKey), false);
  } finally {
    await NotificationDeliveryModel.deleteMany({ idempotencyKey: marker });
    if (integrationId) await ProjectIntegrationModel.deleteOne({ _id: integrationId });
    await mongoose.disconnect();
  }
});

test("a failed project WhatsApp delivery is replay-safe and stays on Baileys", {
  skip: !process.env.MONGODB_URI,
  concurrency: false,
}, async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const marker = `project-provider-outage-${new mongoose.Types.ObjectId()}`;
  const originalProvider = process.env.WHATSAPP_PROVIDER;
  const smtpEnvKeys = [
    "CPANEL_SMTP_HOST", "CPANEL_SMTP_USER", "CPANEL_SMTP_PASS",
    "SMTP_HOST", "SMTP_USER", "SMTP_PASS",
  ];
  const originalSmtpEnv = Object.fromEntries(smtpEnvKeys.map(key => [key, process.env[key]]));
  let providerCalls = 0;
  const { waModule } = await import("./whatsapp-module");
  const originalSendNotification = waModule.sendNotification;

  try {
    process.env.WHATSAPP_PROVIDER = "baileys";
    waModule.sendNotification = (async () => {
      providerCalls += 1;
      throw new Error("temporary internal WhatsApp outage");
    }) as typeof waModule.sendNotification;

    const request = {
      event: "project_whatsapp_provider_outage",
      idempotencyKey: marker,
      recipient: { name: "Test", phone: "+966501234567" },
      subject: "test",
      message: "test",
      channels: ["whatsapp" as const],
      metadata: { source: "project_integration_api", projectWhatsApp: true },
    };
    const first = await dispatchNotification(request);
    await NotificationDeliveryModel.updateOne(
      { _id: first[0]?.id },
      { $set: { nextAttemptAt: new Date(Date.now() - 1_000) } },
    );
    const second = await dispatchNotification(request);
    const delivery = await NotificationDeliveryModel.findOne({ idempotencyKey: marker, channel: "whatsapp" }).lean();

    assert.equal(first[0]?.id, second[0]?.id, "a replay must return the original delivery");
    assert.equal(providerCalls, 1, "a replay must not call the provider again");
    assert.equal(await NotificationDeliveryModel.countDocuments({ idempotencyKey: marker, channel: "whatsapp" }), 1);
    assert.ok(delivery);
    assert.ok(["retrying", "failed"].includes(delivery.status));
    assert.ok(delivery.lastError);
    assert.match(delivery.lastError, /temporary internal WhatsApp outage/);

    // An empty provider setting must still use the internal Baileys session.
    process.env.WHATSAPP_PROVIDER = "";
    waModule.sendNotification = (async () => {
      providerCalls += 1;
    }) as typeof waModule.sendNotification;
    const projectBaileys = await dispatchNotification({
      ...request,
      idempotencyKey: `${marker}-baileys-default`,
    });
    assert.equal(projectBaileys[0]?.status, "sent", "project traffic must use the internal Baileys session");
    assert.equal(projectBaileys[0]?.channel, "whatsapp");
    assert.equal(providerCalls, 2, "project traffic must invoke Baileys once per new delivery");

    for (const key of smtpEnvKeys) delete process.env[key];
    const smtpRequest = {
      event: "project_email_provider_outage",
      idempotencyKey: `${marker}-smtp`,
      recipient: { name: "Test", email: "test@example.com" },
      subject: "test",
      message: "test",
      channels: ["email" as const],
      metadata: { source: "project_integration_api" },
    };
    const smtpFirst = await dispatchNotification(smtpRequest);
    await NotificationDeliveryModel.updateOne(
      { _id: smtpFirst[0]?.id },
      // Keep the record out of the worker's due window while verifying that
      // replaying the same idempotency key is read-only.
      { $set: { nextAttemptAt: new Date(Date.now() + 60_000) } },
    );
    const smtpSecond = await dispatchNotification(smtpRequest);
    const smtpDelivery = await NotificationDeliveryModel.findOne({
      idempotencyKey: smtpRequest.idempotencyKey,
      channel: "email",
    }).lean();
    assert.equal(smtpFirst[0]?.id, smtpSecond[0]?.id, "an SMTP replay must return the original delivery");
    assert.equal(smtpFirst[0]?.status, "retrying");
    assert.equal(smtpSecond[0]?.status, "retrying");
    assert.equal(smtpSecond[0]?.error, "تعذر تسليم البريد عبر SMTP");
    assert.equal(smtpDelivery?.attempts, 1, "an SMTP replay must not create a second attempt");
    assert.equal(smtpDelivery?.lastError, "تعذر تسليم البريد عبر SMTP");
  } finally {
    waModule.sendNotification = originalSendNotification;
    if (originalProvider === undefined) delete process.env.WHATSAPP_PROVIDER;
    else process.env.WHATSAPP_PROVIDER = originalProvider;
    for (const key of smtpEnvKeys) {
      if (originalSmtpEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalSmtpEnv[key];
    }
    await NotificationDeliveryModel.deleteMany({ idempotencyKey: { $in: [marker, `${marker}-baileys-default`, `${marker}-smtp`] } });
    await mongoose.disconnect();
  }
});

test("an expired project WhatsApp lease recovers through Baileys with durable error context", {
  skip: !process.env.MONGODB_URI,
  concurrency: false,
}, async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const marker = `project-provider-crash-recovery-${new mongoose.Types.ObjectId()}`;
  const originalProvider = process.env.WHATSAPP_PROVIDER;
  let providerCalls = 0;
  const { waModule } = await import("./whatsapp-module");
  const originalSendNotification = waModule.sendNotification;

  try {
    // Recovery must use the same QR-connected internal WhatsApp session.
    process.env.WHATSAPP_PROVIDER = "baileys";
    waModule.sendNotification = (async () => {
      providerCalls += 1;
      throw new Error("Baileys recovery failed while WhatsApp is disconnected");
    }) as typeof waModule.sendNotification;

    const delivery = await NotificationDeliveryModel.create({
      event: "project_whatsapp_worker_crash",
      idempotencyKey: marker,
      channel: "whatsapp",
      status: "sending",
      recipient: {
        name: "Recovery Test",
        phone: "+966501234567",
        normalizedPhone: "+966501234567",
      },
      subject: "test",
      body: "test",
      textBody: "test",
      metadata: { source: "project_integration_api", projectWhatsApp: true },
      attempts: 1,
      maxAttempts: 3,
      lastError: "worker crashed after claiming the delivery",
      claimToken: "crashed-worker-claim",
      leaseExpiresAt: new Date(Date.now() - 1_000),
    });

    const recoveredCount = await processDueNotificationDeliveries();
    const recovered = await NotificationDeliveryModel.findById(delivery._id).lean();

    assert.equal(recoveredCount, 1, "the worker should discover the expired sending lease");
    assert.equal(providerCalls, 1, "recovery should make one Baileys attempt");
    assert.ok(recovered);
    assert.equal(recovered.status, "retrying", "a recoverable provider failure must remain durable");
    assert.equal(recovered.attempts, 2, "the recovery claim must count as a new attempt");
    assert.match(recovered.lastError, /Baileys recovery failed while WhatsApp is disconnected/);
    assert.equal(recovered.leaseExpiresAt, null, "the recovered attempt must release its lease");
    assert.notEqual(recovered.claimToken, "crashed-worker-claim", "recovery must replace the crashed worker claim");
    assert.equal(recovered.metadata?.projectWhatsApp, true);
    assert.equal(recovered.provider, "", "a failed recovery must not claim a provider message id");
  } finally {
    waModule.sendNotification = originalSendNotification;
    if (originalProvider === undefined) delete process.env.WHATSAPP_PROVIDER;
    else process.env.WHATSAPP_PROVIDER = originalProvider;
    await NotificationDeliveryModel.deleteMany({ idempotencyKey: marker });
    await mongoose.disconnect();
  }
});
