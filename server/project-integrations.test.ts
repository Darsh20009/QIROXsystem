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
import { dispatchNotification } from "./notifications/service";
import { NotificationDeliveryModel } from "./models/notification-delivery";
import { ProjectIntegrationModel } from "./models/project-integrations";

test("project integration secrets stay one-time and rate limits are isolated", async () => {
  const secret = createProjectIntegrationSecret("whatsapp");
  assert.match(secret.rawKey, /^qrx_project_whatsapp_[a-f0-9]{64}$/);
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
  assert.equal(projectIntegrationApiDocs.endpoints.length, 2);
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