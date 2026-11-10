import webpush from "web-push";
import http2 from "node:http2";
import { createSign } from "node:crypto";

const VAPID_PUBLIC_FALLBACK = "BLRtNQGf06MwAy3q0FwWjWpRuxSRWS2VFQhO-ur-dl9koLyw92Evq1C3E_qCCcJR3seVMuL_df58h7NcvyA5ra4";
const VAPID_PRIVATE_FALLBACK = "eFqX9qfBVzFTErtXbAEl-WqN1sBqoQfwHbafUGtXeGk";

function resolveVapidKey(envKey: string, fallback: string): string {
  const val = process.env[envKey];
  if (!val) return fallback;
  try {
    const decoded = Buffer.from(val.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    if (envKey === "VAPID_PUBLIC_KEY" && decoded.length !== 65) return fallback;
    if (envKey === "VAPID_PRIVATE_KEY" && decoded.length !== 32) return fallback;
    return val;
  } catch {
    return fallback;
  }
}

const VAPID_PUBLIC = resolveVapidKey("VAPID_PUBLIC_KEY", VAPID_PUBLIC_FALLBACK);
const VAPID_PRIVATE = resolveVapidKey("VAPID_PRIVATE_KEY", VAPID_PRIVATE_FALLBACK);
const VAPID_EMAIL = "mailto:info@qiroxstudio.online";

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

export { VAPID_PUBLIC };

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: { url?: string; [key: string]: any };
}

export async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushPayload,
  options?: { urgency?: "very-low" | "low" | "normal" | "high" | "very-high"; ttl?: number }
): Promise<boolean> {
  const isAuthChallenge = payload.tag?.startsWith("push-auth-");
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || "/icon-192.png",
        badge: payload.badge || "/favicon-32.png",
        ...(payload.image ? { image: payload.image } : {}),
        tag: payload.tag || "qirox",
        requireInteraction: payload.requireInteraction ?? false,
        data: payload.data || { url: "/dashboard" },
      }),
      {
        TTL: options?.ttl ?? 86400,
        urgency: (options?.urgency ?? (isAuthChallenge ? "high" : "normal")) as any,
      }
    );
    return true;
  } catch (err: any) {
    if (err?.statusCode === 410 || err?.statusCode === 404) {
      return false;
    }
    console.error("[PUSH] Error sending push:", err?.message);
    return false;
  }
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!userId || userId === "undefined" || userId === "null") {
    console.error("[PUSH] sendPushToUser called with invalid userId:", userId);
    return;
  }
  try {
    const { PushSubscriptionModel } = await import("./models");
    const mongoose = await import("mongoose");
    let queryId: any = userId;
    if (mongoose.default.Types.ObjectId.isValid(userId)) {
      queryId = new mongoose.default.Types.ObjectId(userId);
    }
    const subs = await PushSubscriptionModel.find({ userId: queryId });
    const expired: string[] = [];
    await Promise.all(
      subs.map(async (sub: any) => {
        const ok = await sendWebPush({ endpoint: sub.endpoint, keys: sub.keys }, payload);
        if (!ok) expired.push(String(sub._id));
      })
    );
    if (expired.length > 0) {
      await PushSubscriptionModel.deleteMany({ _id: { $in: expired } });
    }
  } catch (err) {
    console.error("[PUSH] sendPushToUser error:", err);
  }

  // Native iOS delivery is additive. It activates only when APNs credentials
  // are configured, while the existing PWA delivery remains unchanged.
  await sendNativePushToUser(userId, payload).catch((err) => {
    console.error("[APNS] sendNativePushToUser error:", err?.message || err);
  });
}

function base64Url(value: Buffer | string): string {
  return Buffer.from(value).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function apnsJwt(): string | null {
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  const privateKey = process.env.APNS_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!keyId || !teamId || !privateKey) return null;

  const header = base64Url(JSON.stringify({ alg: "ES256", kid: keyId }));
  const claims = base64Url(JSON.stringify({ iss: teamId, iat: Math.floor(Date.now() / 1000) }));
  const unsigned = `${header}.${claims}`;
  const signer = createSign("SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign({ key: privateKey, dsaEncoding: "ieee-p1363" });
  return `${unsigned}.${base64Url(signature)}`;
}

async function sendApnsToken(token: string, payload: PushPayload): Promise<number> {
  const jwt = apnsJwt();
  if (!jwt) return 0;
  const host = process.env.APNS_HOST || "https://api.push.apple.com";
  const client = http2.connect(host);
  const body = JSON.stringify({
    aps: {
      alert: { title: payload.title, body: payload.body },
      sound: "default",
      badge: 1,
    },
    ...(payload.data || {}),
  });

  return await new Promise<number>((resolve, reject) => {
    const request = client.request({
      ":method": "POST",
      ":path": `/3/device/${encodeURIComponent(token)}`,
      authorization: `bearer ${jwt}`,
      "apns-topic": process.env.APNS_BUNDLE_ID || "qiroxstudio.online",
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
      "content-length": Buffer.byteLength(body),
    });
    let status = 0;
    request.on("response", (headers) => { status = Number(headers[":status"] || 0); });
    request.on("error", reject);
    request.on("end", () => { client.close(); resolve(status); });
    request.setEncoding("utf8");
    request.resume();
    request.end(body);
  });
}

export async function sendNativePushToUser(userId: string, payload: PushPayload): Promise<void> {
  const jwt = apnsJwt();
  if (!jwt) return;
  const { NativePushTokenModel } = await import("./models");
  const tokens = await NativePushTokenModel.find({ userId }, { token: 1 }).lean() as any[];
  const stale: string[] = [];
  await Promise.all(tokens.map(async (record) => {
    const status = await sendApnsToken(String(record.token), payload);
    if (status === 410 || status === 400) stale.push(String(record._id));
  }));
  if (stale.length) await NativePushTokenModel.deleteMany({ _id: { $in: stale } });
}
