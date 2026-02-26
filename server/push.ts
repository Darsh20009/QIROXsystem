import webpush from "web-push";

const VAPID_PUBLIC = "BLRtNQGf06MwAy3q0FwWjWpRuxSRWS2VFQhO-ur-dl9koLyw92Evq1C3E_qCCcJR3seVMuL_df58h7NcvyA5ra4";
const VAPID_PRIVATE = "eFqX9qfBVzFTErtXbAEl-WqN1sBqoQfwHbafUGtXeGk";
const VAPID_EMAIL = "mailto:support@qiroxstudio.online";

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

export { VAPID_PUBLIC };

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: { url?: string; [key: string]: any };
}

export async function sendWebPush(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: PushPayload): Promise<boolean> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || "/logo.png",
        badge: payload.badge || "/favicon.png",
        tag: payload.tag || "qirox",
        data: payload.data || { url: "/dashboard" },
      })
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
  try {
    const { PushSubscriptionModel } = await import("./models");
    const subs = await PushSubscriptionModel.find({ userId });
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
}
