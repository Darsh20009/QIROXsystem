import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import {
  StoreWhatsAppApiKeyModel,
  StoreWhatsAppQuotaModel,
  StoreWhatsAppRateLimitModel,
  StoreWhatsAppRequestModel,
} from "./models/whatsapp";
import { NotificationDeliveryModel } from "./models/notification-delivery";
import { claimStoreWhatsAppRequest, reserveStoreWhatsAppQuota, reserveStoreWhatsAppRateLimit } from "./notifications/store-whatsapp";
import { dispatchNotification } from "./notifications/service";

test("store WhatsApp quota, idempotency, and internal Baileys delivery behavior", async () => {
  assert.ok(process.env.MONGODB_URI, "MONGODB_URI is required for this integration check");
  await mongoose.connect(process.env.MONGODB_URI!);
  const keyId = new mongoose.Types.ObjectId();
  const storeId = new mongoose.Types.ObjectId();
  const clientId = new mongoose.Types.ObjectId();
  const marker = `store-wa-test-${Date.now()}`;
  let deliveryId = "";
  const originalToken = process.env.WHATSAPP_META_ACCESS_TOKEN;
  const originalPhoneId = process.env.WHATSAPP_META_PHONE_NUMBER_ID;
  const originalProvider = process.env.WHATSAPP_PROVIDER;

  try {
    const key = await StoreWhatsAppApiKeyModel.create({
      _id: keyId, storeId, clientId, name: marker, keyHash: marker, keyPrefix: marker,
      scopes: ["messages:send", "templates:send"], quotaPeriod: "monthly", quotaLimit: 2,
    });

    const quotaResults = await Promise.all(Array.from({ length: 6 }, () => reserveStoreWhatsAppQuota(key)));
    assert.equal(quotaResults.filter(result => result.allowed).length, 2, "only two concurrent requests reserve the two-slot quota");

    const claims = await Promise.all(Array.from(
      { length: 5 },
      () => claimStoreWhatsAppRequest(String(keyId), String(storeId), "order-12345678", "payload-hash"),
    ));
    assert.equal(claims.filter(claim => claim.owner).length, 1, "only one concurrent retry owns an idempotency key");
    await StoreWhatsAppRequestModel.create({
      keyId, storeId, idempotencyKey: "rate-reset-12345678", payloadHash: "old-payload",
      status: "rejected", error: "RATE_LIMITED", expiresAt: new Date(Date.now() - 1_000),
    });
    const reclaimed = await claimStoreWhatsAppRequest(String(keyId), String(storeId), "rate-reset-12345678", "old-payload");
    assert.equal(reclaimed.owner, true, "an expired rate-limit rejection is reclaimed without waiting for Mongo TTL cleanup");
    await StoreWhatsAppRequestModel.updateOne(
      { _id: reclaimed.request._id },
      { $set: { status: "rejected", error: "RATE_LIMITED", expiresAt: new Date(Date.now() - 1_000) } },
    );
    const conflict = await claimStoreWhatsAppRequest(String(keyId), String(storeId), "rate-reset-12345678", "different-payload");
    assert.equal(conflict.owner, false, "an expired rate-limit rejection cannot be reclaimed with a different payload");
    assert.equal(conflict.request?.payloadHash, "old-payload");
    const rateResults = await Promise.all(Array.from({ length: 6 }, () => reserveStoreWhatsAppRateLimit({ ...key.toObject(), rateLimitPerMinute: 2 })));
    assert.equal(rateResults.filter(result => result.allowed).length, 2, "only two concurrent requests reserve a shared rate-limit window");

    delete process.env.WHATSAPP_META_ACCESS_TOKEN;
    delete process.env.WHATSAPP_META_PHONE_NUMBER_ID;
    process.env.WHATSAPP_PROVIDER = "baileys";
    const failedDelivery = (await dispatchNotification({
      event: "store_whatsapp_test",
      idempotencyKey: `${marker}-delivery`,
      storeId: String(storeId),
      recipient: { phone: "+966501234567" },
      subject: "test",
      message: "test",
      channels: ["whatsapp"],
      metadata: { storeWhatsApp: true, storeWhatsAppKeyId: String(keyId) },
    }))[0];
    deliveryId = failedDelivery.id;
    assert.ok(["retrying", "failed"].includes(failedDelivery.status), "a disconnected Baileys session is recorded as a failed/retrying delivery");
    assert.equal(failedDelivery.error?.includes("Meta WhatsApp Business غير مهيأ"), false, "internal WhatsApp must not require Meta configuration");
  } finally {
    if (originalToken === undefined) delete process.env.WHATSAPP_META_ACCESS_TOKEN;
    else process.env.WHATSAPP_META_ACCESS_TOKEN = originalToken;
    if (originalPhoneId === undefined) delete process.env.WHATSAPP_META_PHONE_NUMBER_ID;
    else process.env.WHATSAPP_META_PHONE_NUMBER_ID = originalPhoneId;
    if (originalProvider === undefined) delete process.env.WHATSAPP_PROVIDER;
    else process.env.WHATSAPP_PROVIDER = originalProvider;
    if (deliveryId) await NotificationDeliveryModel.deleteOne({ _id: deliveryId });
    await StoreWhatsAppRequestModel.deleteMany({ keyId });
    await StoreWhatsAppQuotaModel.deleteMany({ keyId });
    await StoreWhatsAppRateLimitModel.deleteMany({ keyId });
    await StoreWhatsAppApiKeyModel.deleteOne({ _id: keyId });
    await mongoose.disconnect();
  }
});