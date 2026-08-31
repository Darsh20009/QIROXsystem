import { ProjectSubscriptionModel } from "./models/project-subscriptions";

export const PROJECT_SUBSCRIPTION_PERIOD_DAYS: Record<string, number> = {
  monthly: 30,
  "6months": 180,
  sixmonth: 180,
  annual: 365,
};

export function normalizeProjectSubscriptionPeriod(period: unknown): "monthly" | "6months" | "annual" | "lifetime" | null {
  if (period === "lifetime") return "lifetime";
  if (period === "monthly") return "monthly";
  if (period === "6months" || period === "sixmonth") return "6months";
  if (period === "annual") return "annual";
  return null;
}

export function getProjectSubscriptionDurationDays(period: unknown): number | null {
  const normalized = normalizeProjectSubscriptionPeriod(period);
  return normalized === "lifetime" ? null : normalized ? PROJECT_SUBSCRIPTION_PERIOD_DAYS[normalized] : null;
}

export function serializeProjectSubscription(source: any, now = new Date()) {
  if (!source) return null;
  const value = source.toObject ? source.toObject() : source;
  const startedAt = value.startedAt ? new Date(value.startedAt) : null;
  const expiresAt = value.expiresAt ? new Date(value.expiresAt) : null;
  const isLifetime = value.period === "lifetime";
  const isExpired = !isLifetime && !!expiresAt && expiresAt.getTime() <= now.getTime();
  const remainingMs = expiresAt ? Math.max(0, expiresAt.getTime() - now.getTime()) : 0;
  const remainingDays = isLifetime ? null : expiresAt ? Math.ceil(remainingMs / 86400000) : 0;
  const totalMs = startedAt && expiresAt ? Math.max(1, expiresAt.getTime() - startedAt.getTime()) : null;

  return {
    id: String(value._id || value.id),
    projectId: String(value.projectId),
    orderId: String(value.orderId),
    clientId: String(value.clientId),
    planTier: value.planTier || "",
    planSegment: value.planSegment || "",
    period: value.period,
    durationDays: value.durationDays,
    startedAt: value.startedAt || null,
    expiresAt: value.expiresAt || null,
    status: isExpired ? "expired" : value.status,
    remainingDays,
    percentRemaining: isLifetime ? 100 : totalMs && expiresAt
      ? Math.max(0, Math.min(100, Math.round((remainingMs / totalMs) * 100)))
      : 0,
  };
}

export async function startProjectSubscription({
  projectId,
  order,
  client,
  startedAt = new Date(),
}: {
  projectId: string;
  order: any;
  client: any;
  startedAt?: Date;
}) {
  const period = normalizeProjectSubscriptionPeriod(order?.planPeriod || client?.subscriptionPeriod);
  const durationDays = getProjectSubscriptionDurationDays(period);
  if (!period || (period !== "lifetime" && !durationDays)) {
    return { subscription: null, created: false };
  }

  const expiresAt = durationDays ? new Date(startedAt.getTime() + durationDays * 86400000) : null;
  const result: any = await ProjectSubscriptionModel.updateOne(
    { projectId },
    {
      $setOnInsert: {
        projectId,
        orderId: order?._id || order?.id,
        clientId: order?.userId || client?._id || client?.id,
        planTier: order?.planTier || "",
        planSegment: order?.planSegment || client?.subscriptionSegmentId || "",
        period,
        durationDays,
        startedAt,
        expiresAt,
        status: "active",
      },
    },
    { upsert: true },
  );
  const subscription = await ProjectSubscriptionModel.findOne({ projectId });
  return {
    subscription,
    created: Number(result?.upsertedCount || 0) === 1 || !!result?.upsertedId,
  };
}