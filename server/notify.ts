// ──────────────────────────────────────────────────────────────────
// Universal Notification Hub
// Single entry point for every notification across the app.
//
//                       fireNotify()
//                       /    |    \
//                      DB    WS    Push
//
//   Layer 1 — MongoDB           : persists in NotificationModel (always)
//   Layer 2 — WebSocket         : delivers in-app instantly if user online
//   Layer 3 — Web Push (VAPID)  : wakes the device even when app is closed
// ──────────────────────────────────────────────────────────────────

import { pushToUser } from "./ws";
import { sendPushToUser } from "./push";

export type NotifyType = "info" | "success" | "warning" | "error" | "message" | "order" | "status" | "project" | "task" | "auth" | "payment";

export interface NotifyOptions {
  type?: NotifyType;
  link?: string;
  icon?: string;
  tag?: string;
  image?: string;
  /** Force device wake. Defaults to true for messaging/auth/payment categories. */
  highPriority?: boolean;
  /** Notification stays on screen until user interacts. Default true for auth/payment. */
  requireInteraction?: boolean;
}

const HIGH_PRIORITY_TYPES = new Set<NotifyType>(["message", "auth", "payment", "error"]);
const STICKY_TYPES = new Set<NotifyType>(["auth", "payment"]);

function pickIcon(type: NotifyType, fallback?: string): string {
  if (fallback) return fallback;
  switch (type) {
    case "success": return "✅";
    case "warning": return "⚠️";
    case "error":   return "❌";
    case "message": return "💬";
    case "order":   return "📦";
    case "status":  return "📋";
    case "project": return "🗂️";
    case "task":    return "✔️";
    case "auth":    return "🔐";
    case "payment": return "💳";
    default:        return "🔔";
  }
}

/**
 * Fire a notification to a single user across all 3 layers.
 * Never throws — failures in any layer are swallowed and logged.
 */
export async function fireNotify(
  userId: string,
  title: string,
  body: string,
  opts: NotifyOptions = {}
): Promise<void> {
  if (!userId || userId === "undefined" || userId === "null") return;

  const type = opts.type || "info";
  const link = opts.link || "/dashboard";
  const icon = pickIcon(type, opts.icon);
  const tag  = opts.tag || `notif-${type}-${Date.now()}`;
  const high = opts.highPriority ?? HIGH_PRIORITY_TYPES.has(type);
  const sticky = opts.requireInteraction ?? STICKY_TYPES.has(type);

  // ── Layer 1: persist in DB ────────────────────────────────────
  try {
    const { NotificationModel } = await import("./models");
    await NotificationModel.create({
      userId,
      type,
      title,
      body,
      link,
      icon,
    });
  } catch (err) {
    console.error("[Notify] DB persist failed:", (err as any)?.message);
  }

  // ── Layer 2: real-time WebSocket (if app is open) ─────────────
  try {
    pushToUser(userId, { type: "notification", title, body, link, icon });
  } catch (err) {
    console.error("[Notify] WS push failed:", (err as any)?.message);
  }

  // ── Layer 3: Web Push (works even if app/device is sleeping) ──
  try {
    await sendPushToUser(
      userId,
      {
        title,
        body,
        icon: "/icon-192.png",
        badge: "/favicon-32.png",
        tag,
        requireInteraction: sticky,
        ...(opts.image ? { image: opts.image } : {}),
        data: { url: link },
      },
      {
        urgency: high ? "high" : "normal",
        ttl: high ? 60 * 60 * 24 * 3 : 60 * 60 * 24, // sticky 3 days for high priority
      }
    );
  } catch (err) {
    console.error("[Notify] Web Push failed:", (err as any)?.message);
  }
}

/**
 * Fire a notification to every admin & manager.
 */
export async function fireNotifyAdmins(
  title: string,
  body: string,
  opts: NotifyOptions = {}
): Promise<void> {
  try {
    const { UserModel } = await import("./models");
    const admins = await UserModel.find(
      { role: { $in: ["admin", "manager"] } },
      { _id: 1 }
    ).lean();
    await Promise.all(
      (admins as any[]).map((a) =>
        fireNotify(String(a._id), title, body, {
          link: opts.link || "/admin",
          ...opts,
        })
      )
    );
  } catch (err) {
    console.error("[Notify] fireNotifyAdmins failed:", (err as any)?.message);
  }
}

/**
 * Fire the same notification to a list of users (e.g. all members of a group).
 */
export async function fireNotifyMany(
  userIds: string[],
  title: string,
  body: string,
  opts: NotifyOptions = {}
): Promise<void> {
  await Promise.all(
    [...new Set(userIds.filter(Boolean))].map((uid) =>
      fireNotify(uid, title, body, opts)
    )
  );
}
