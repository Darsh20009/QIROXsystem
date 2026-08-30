import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
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

test("a failed project WhatsApp delivery is replay-safe and never falls back to Baileys", {
  skip: !process.env.MONGODB_URI,
  concurrency: false,
}, async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const marker = `project-provider-outage-${new mongoose.Types.ObjectId()}`;
  const originalFetch = globalThis.fetch;
  const originalProvider = process.env.WHATSAPP_PROVIDER;
  const originalToken = process.env.WHATSAPP_META_ACCESS_TOKEN;
  const originalPhoneId = process.env.WHATSAPP_META_PHONE_NUMBER_ID;
  const smtpEnvKeys = [
    "CPANEL_SMTP_HOST", "CPANEL_SMTP_USER", "CPANEL_SMTP_PASS",
    "SMTP_HOST", "SMTP_USER", "SMTP_PASS",
  ];
  const originalSmtpEnv = Object.fromEntries(smtpEnvKeys.map(key => [key, process.env[key]]));
  let providerCalls = 0;

  try {
    process.env.WHATSAPP_PROVIDER = "meta";
    process.env.WHATSAPP_META_ACCESS_TOKEN = "meta-test-secret";
    process.env.WHATSAPP_META_PHONE_NUMBER_ID = "test-phone-number";
    globalThis.fetch = (async () => {
      providerCalls += 1;
      throw new Error("temporary Meta outage access_token=meta-test-secret");
    }) as typeof fetch;

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
    assert.equal(delivery.lastError.includes("meta-test-secret"), false, "provider secrets must not be persisted");
    assert.match(delivery.lastError, /temporary Meta outage/);

    // Project WhatsApp traffic must stay on Meta even when the global
    // preference is set to the internal Baileys provider.
    process.env.WHATSAPP_PROVIDER = "baileys";
    globalThis.fetch = (async () => {
      providerCalls += 1;
      return new Response(JSON.stringify({ messages: [{ id: "meta-message-id" }] }), { status: 200 });
    }) as typeof fetch;
    const projectOnlyMeta = await dispatchNotification({
      ...request,
      idempotencyKey: `${marker}-no-baileys`,
    });
    assert.equal(projectOnlyMeta[0]?.status, "sent", "project traffic must use Meta, not Baileys");
    assert.equal(projectOnlyMeta[0]?.channel, "whatsapp");
    assert.equal(providerCalls, 2, "project traffic must invoke Meta even when Baileys is the global preference");

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
      { $set: { nextAttemptAt: new Date(Date.now() - 1_000) } },
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
    globalThis.fetch = originalFetch;
    if (originalProvider === undefined) delete process.env.WHATSAPP_PROVIDER;
    else process.env.WHATSAPP_PROVIDER = originalProvider;
    if (originalToken === undefined) delete process.env.WHATSAPP_META_ACCESS_TOKEN;
    else process.env.WHATSAPP_META_ACCESS_TOKEN = originalToken;
    if (originalPhoneId === undefined) delete process.env.WHATSAPP_META_PHONE_NUMBER_ID;
    else process.env.WHATSAPP_META_PHONE_NUMBER_ID = originalPhoneId;
    for (const key of smtpEnvKeys) {
      if (originalSmtpEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalSmtpEnv[key];
    }
    await NotificationDeliveryModel.deleteMany({ idempotencyKey: { $in: [marker, `${marker}-no-baileys`, `${marker}-smtp`] } });
    await mongoose.disconnect();
  }
});

test("an expired project WhatsApp lease recovers through Meta with durable sanitized error context", {
  skip: !process.env.MONGODB_URI,
  concurrency: false,
}, async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const marker = `project-provider-crash-recovery-${new mongoose.Types.ObjectId()}`;
  const originalFetch = globalThis.fetch;
  const originalProvider = process.env.WHATSAPP_PROVIDER;
  const originalToken = process.env.WHATSAPP_META_ACCESS_TOKEN;
  const originalPhoneId = process.env.WHATSAPP_META_PHONE_NUMBER_ID;
  let providerCalls = 0;

  try {
    // Recovery must honor the project delivery boundary, not the global
    // provider preference used by the internal WhatsApp session.
    process.env.WHATSAPP_PROVIDER = "baileys";
    process.env.WHATSAPP_META_ACCESS_TOKEN = "meta-recovery-secret";
    process.env.WHATSAPP_META_PHONE_NUMBER_ID = "recovery-phone-number";
    globalThis.fetch = (async () => {
      providerCalls += 1;
      throw new Error("Meta recovery failed after provider accepted request access_token=meta-recovery-secret");
    }) as typeof fetch;

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
    assert.equal(providerCalls, 1, "recovery should make one Meta attempt");
    assert.ok(recovered);
    assert.equal(recovered.status, "retrying", "a recoverable provider failure must remain durable");
    assert.equal(recovered.attempts, 2, "the recovery claim must count as a new attempt");
    assert.match(recovered.lastError, /Meta recovery failed after provider accepted request/);
    assert.equal(recovered.lastError.includes("meta-recovery-secret"), false, "provider credentials must not be persisted");
    assert.match(recovered.lastError, /access_token=\[redacted\]/, "credential fields must be redacted");
    assert.equal(JSON.stringify(recovered).includes("meta-recovery-secret"), false, "provider credentials must not leak through the durable record");
    assert.equal(recovered.leaseExpiresAt, null, "the recovered attempt must release its lease");
    assert.notEqual(recovered.claimToken, "crashed-worker-claim", "recovery must replace the crashed worker claim");
    assert.equal(recovered.metadata?.projectWhatsApp, true);
    assert.equal(recovered.provider, "", "a failed recovery must not claim a provider message id");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalProvider === undefined) delete process.env.WHATSAPP_PROVIDER;
    else process.env.WHATSAPP_PROVIDER = originalProvider;
    if (originalToken === undefined) delete process.env.WHATSAPP_META_ACCESS_TOKEN;
    else process.env.WHATSAPP_META_ACCESS_TOKEN = originalToken;
    if (originalPhoneId === undefined) delete process.env.WHATSAPP_META_PHONE_NUMBER_ID;
    else process.env.WHATSAPP_META_PHONE_NUMBER_ID = originalPhoneId;
    await NotificationDeliveryModel.deleteMany({ idempotencyKey: marker });
    await mongoose.disconnect();
  }
});
