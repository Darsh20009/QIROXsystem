import crypto from "crypto";
import {
  StoreWhatsAppApiKeyModel,
  StoreWhatsAppQuotaModel,
  StoreWhatsAppRateLimitModel,
  StoreWhatsAppRequestModel,
} from "../models/whatsapp";

export const STORE_WHATSAPP_SCOPES = ["messages:send", "templates:send"] as const;

export function hashStoreWhatsAppKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

export function createStoreWhatsAppSecret(): { rawKey: string; keyHash: string; keyPrefix: string } {
  const rawKey = `qrx_wa_live_${crypto.randomBytes(32).toString("hex")}`;
  return {
    rawKey,
    keyHash: hashStoreWhatsAppKey(rawKey),
    keyPrefix: `${rawKey.slice(0, 20)}...`,
  };
}

export function getQuotaPeriod(
  cadence: "monthly" | "bimonthly",
  now = new Date(),
): { periodStart: Date; periodEnd: Date } {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const startMonth = cadence === "bimonthly" ? Math.floor(month / 2) * 2 : month;
  const periodStart = new Date(Date.UTC(year, startMonth, 1));
  const periodEnd = new Date(Date.UTC(year, startMonth + (cadence === "bimonthly" ? 2 : 1), 1));
  return { periodStart, periodEnd };
}

export async function reserveStoreWhatsAppQuota(key: any, now = new Date()) {
  const cadence = key.quotaPeriod === "bimonthly" ? "bimonthly" : "monthly";
  const { periodStart, periodEnd } = getQuotaPeriod(cadence, now);
  const quota = await StoreWhatsAppQuotaModel.findOneAndUpdate(
    { keyId: key._id, periodStart },
    {
      $set: {
        storeId: key.storeId,
        periodEnd,
        period: cadence,
        limit: Math.max(1, Number(key.quotaLimit) || 1),
      },
      $setOnInsert: { keyId: key._id, periodStart, used: 0 },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  const limit = Math.max(1, Number(key.quotaLimit) || 1);
  // The conditional update is the quota gate. MongoDB serializes competing
  // updates to this document, so two requests cannot pass the same slot.
  const reserved = await StoreWhatsAppQuotaModel.findOneAndUpdate(
    { _id: quota._id, used: { $lt: limit } },
    { $inc: { used: 1 } },
    { returnDocument: "after" },
  ).lean();
  if (!reserved) {
    return {
      allowed: false,
      quotaId: String(quota._id),
      periodStart,
      periodEnd,
      limit,
      used: Number(quota.used || 0),
      remaining: 0,
    };
  }
  return {
    allowed: true,
    quotaId: String(reserved._id),
    periodStart,
    periodEnd,
    limit: Number(reserved.limit),
    used: Number(reserved.used),
    remaining: Math.max(0, Number(reserved.limit) - Number(reserved.used)),
  };
}

export async function reserveStoreWhatsAppRateLimit(key: any, now = new Date()) {
  const limit = Math.min(Math.max(Math.floor(Number(key.rateLimitPerMinute) || 30), 1), 300);
  const windowStart = new Date(Math.floor(now.getTime() / 60_000) * 60_000);
  const resetAt = new Date(windowStart.getTime() + 60_000);
  const query = { keyId: key._id, windowStart, count: { $lt: limit } };
  const update = {
    $inc: { count: 1 },
    $setOnInsert: { keyId: key._id, windowStart, expiresAt: new Date(resetAt.getTime() + 60_000) },
  };

  let window: any;
  try {
    window = await StoreWhatsAppRateLimitModel.findOneAndUpdate(query, update, {
      upsert: true, returnDocument: "after", setDefaultsOnInsert: true,
    }).lean();
  } catch (error: any) {
    if (error?.code !== 11000) throw error;
    // Another process inserted this window at the same time. Retry without an
    // upsert so the unique index stays the cross-process coordination point.
    window = await StoreWhatsAppRateLimitModel.findOneAndUpdate(query, update, {
      returnDocument: "after",
    }).lean();
  }
  if (!window) {
    const existing = await StoreWhatsAppRateLimitModel.findOne({ keyId: key._id, windowStart }).lean();
    return { allowed: false, limit, remaining: 0, resetAt, count: Number(existing?.count || limit) };
  }
  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - Number(window.count)),
    resetAt,
    count: Number(window.count),
  };
}

export async function claimStoreWhatsAppRequest(
  keyId: string,
  storeId: string,
  idempotencyKey: string,
  payloadHash: string,
) {
  try {
    return {
      owner: true,
      request: await StoreWhatsAppRequestModel.create({ keyId, storeId, idempotencyKey, payloadHash }),
    };
  } catch (error: any) {
    if (error?.code !== 11000) throw error;
    const request = await StoreWhatsAppRequestModel.findOne({ keyId, idempotencyKey });
    // The unique insert can race the TTL monitor: if the old temporary
    // rejection disappears between the duplicate-key error and this read,
    // immediately attempt the claim again instead of returning a null replay.
    if (!request) {
      return claimStoreWhatsAppRequest(keyId, storeId, idempotencyKey, payloadHash);
    }
    // Mongo TTL cleanup is deliberately asynchronous. A rate rejection must
    // become claimable at the next window even if its expired document has not
    // yet been removed by the TTL monitor.
    if (
      request?.status === "rejected" &&
      request?.error === "RATE_LIMITED" &&
      request?.expiresAt &&
      new Date(request.expiresAt) <= new Date() &&
      request.payloadHash === payloadHash
    ) {
      const reclaimed = await StoreWhatsAppRequestModel.deleteOne({
        _id: request._id,
        status: "rejected",
        error: "RATE_LIMITED",
        expiresAt: { $lte: new Date() },
      });
      if (reclaimed.deletedCount) {
        return claimStoreWhatsAppRequest(keyId, storeId, idempotencyKey, payloadHash);
      }
    }
    return { owner: false, request };
  }
}

export { StoreWhatsAppApiKeyModel, StoreWhatsAppQuotaModel, StoreWhatsAppRateLimitModel, StoreWhatsAppRequestModel };