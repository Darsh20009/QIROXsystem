import { ProjectSubscriptionModel } from "./models/project-subscriptions";
import crypto from "node:crypto";

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

export function serializeProjectSubscriptionRenewalRequest(source: any) {
  if (!source) return null;
  const value = source.toObject ? source.toObject() : source;
  const idOf = (ref: any) => ref?._id || ref?.id || ref;
  return {
    id: String(idOf(value._id || value.id)),
    projectId: String(idOf(value.projectId)),
    subscriptionId: String(idOf(value.subscriptionId)),
    clientId: String(idOf(value.clientId)),
    status: value.status,
    requestedAt: value.requestedAt || null,
    processedAt: value.processedAt || null,
    processedBy: value.processedBy ? String(idOf(value.processedBy)) : null,
    adminNote: value.adminNote || "",
    renewalPeriod: value.renewalPeriod || null,
    renewalStartedAt: value.renewalStartedAt || null,
    renewalExpiresAt: value.renewalExpiresAt || null,
  };
}

export function getRenewalSubscriptionDates(period: unknown, startedAt = new Date()) {
  const normalized = normalizeProjectSubscriptionPeriod(period);
  if (!normalized) return null;
  const durationDays = getProjectSubscriptionDurationDays(normalized);
  return {
    period: normalized,
    durationDays,
    startedAt,
    expiresAt: durationDays ? new Date(startedAt.getTime() + durationDays * 86400000) : null,
  };
}

export function getEffectiveProjectSubscription(subscription: any, renewalRequest: any, now = new Date()) {
  if (!subscription || renewalRequest?.status !== "approved" || !renewalRequest.renewalStartedAt || !renewalRequest.renewalPeriod) {
    return subscription;
  }

  return serializeProjectSubscription({
    ...subscription,
    period: renewalRequest.renewalPeriod,
    durationDays: getProjectSubscriptionDurationDays(renewalRequest.renewalPeriod),
    startedAt: renewalRequest.renewalStartedAt,
    expiresAt: renewalRequest.renewalExpiresAt,
    status: "active",
  }, now);
}

export type LegacyProjectSubscriptionBackfillResult = {
  runId: string;
  dryRun: boolean;
  startedAt: Date;
  completedAt: Date;
  scanned: number;
  eligible: number;
  created: number;
  alreadyPresent: number;
  skipped: number;
  errors: Array<{ projectId: string; reason: string }>;
  candidates: Array<{
    projectId: string;
    orderId: string;
    clientId: string;
    period: "monthly" | "6months" | "annual" | "lifetime";
    startedAt: Date;
    startedAtSource: "updatedAt" | "deliveredAt" | "createdAt" | "runAt";
  }>;
  skippedProjects: Array<{ projectId: string; reason: string }>;
};

function referenceId(value: any): string {
  return String(value?._id || value?.id || value || "");
}

function historicalProjectStart(project: any, fallback: Date) {
  for (const [field, source] of [
    ["updatedAt", "updatedAt"],
    ["deliveredAt", "deliveredAt"],
    ["createdAt", "createdAt"],
  ] as const) {
    if (!project?.[field]) continue;
    const date = new Date(project[field]);
    if (!Number.isNaN(date.getTime())) return { date, source };
  }
  return { date: fallback, source: "runAt" as const };
}

/**
 * Backfill project subscriptions for projects that were already closed before
 * subscription activation was wired to the closed-status transition.
 *
 * This is deliberately an admin-invoked operation. It never updates User
 * subscription fields and is safe to repeat because startProjectSubscription
 * only inserts a record when the project has no subscription.
 */
export async function backfillLegacyProjectSubscriptions({
  actorId,
  dryRun = false,
  now = new Date(),
}: {
  actorId?: string;
  dryRun?: boolean;
  now?: Date;
} = {}): Promise<LegacyProjectSubscriptionBackfillResult> {
  const runId = `project-subscription-backfill:${crypto.randomUUID()}`;
  const startedAt = new Date(now);
  const result: LegacyProjectSubscriptionBackfillResult = {
    runId,
    dryRun,
    startedAt,
    completedAt: startedAt,
    scanned: 0,
    eligible: 0,
    created: 0,
    alreadyPresent: 0,
    skipped: 0,
    errors: [],
    candidates: [],
    skippedProjects: [],
  };

  const { ProjectModel, OrderModel, UserModel, ActivityLogModel } = await import("./models");
  const audit = async (action: string, entity: string, entityId: string, details: any) => {
    try {
      await ActivityLogModel.create({
        userId: actorId || null,
        action,
        entity,
        entityId,
        details: { runId, ...details },
      });
    } catch (error: any) {
      // Audit failure must be visible in the response without preventing the
      // subscription write from completing.
      result.errors.push({
        projectId: entity === "project_subscription" ? entityId : "",
        reason: `audit: ${error?.message || "تعذر تسجيل العملية"}`,
      });
    }
  };

  const projects = await ProjectModel.find({ status: "closed" })
    .select("_id orderId clientId updatedAt deliveredAt createdAt")
    .sort({ updatedAt: 1, _id: 1 })
    .lean();
  result.scanned = projects.length;

  const projectIds = projects.map((project: any) => project._id).filter(Boolean);
  const existingSubscriptions = await ProjectSubscriptionModel.find({
    projectId: { $in: projectIds },
  }).select("projectId").lean();
  const existingProjectIds = new Set(existingSubscriptions.map((subscription: any) => referenceId(subscription.projectId)));

  for (const project of projects as any[]) {
    const projectId = referenceId(project._id);
    if (!projectId) {
      result.skipped++;
      result.skippedProjects.push({ projectId: "", reason: "missing_project_id" });
      continue;
    }
    if (existingProjectIds.has(projectId)) {
      result.alreadyPresent++;
      continue;
    }

    try {
      const orderId = referenceId(project.orderId);
      const order = orderId
        ? await OrderModel.findById(orderId).select("userId planTier planPeriod planSegment businessName serviceType").lean()
        : null;
      const clientId = referenceId(project.clientId || order?.userId);
      const client = clientId
        ? await UserModel.findById(clientId).select("_id subscriptionPeriod subscriptionSegmentId").lean()
        : null;
      const period = normalizeProjectSubscriptionPeriod(order?.planPeriod || client?.subscriptionPeriod);

      let reason = "";
      if (!order) reason = "missing_order";
      else if (!client) reason = "missing_client";
      else if (!period) reason = "missing_or_unsupported_plan_period";
      if (reason) {
        result.skipped++;
        result.skippedProjects.push({ projectId, reason });
        continue;
      }

      const historicalStart = historicalProjectStart(project, startedAt);
      const candidate = {
        projectId,
        orderId,
        clientId,
        period,
        startedAt: historicalStart.date,
        startedAtSource: historicalStart.source,
      };
      result.eligible++;
      result.candidates.push(candidate);

      if (dryRun) continue;

      const activation = await startProjectSubscription({
        projectId,
        order,
        client,
        startedAt: historicalStart.date,
      });
      if (activation.created) {
        result.created++;
        existingProjectIds.add(projectId);
        await audit("backfill_project_subscription", "project_subscription", projectId, {
          outcome: "created",
          source: "legacy_closed_project",
          orderId,
          clientId,
          period,
          startedAt: historicalStart.date,
          startedAtSource: historicalStart.source,
        });
      } else {
        // Another backfill or a close transition won the atomic upsert.
        result.alreadyPresent++;
      }
    } catch (error: any) {
      result.errors.push({ projectId, reason: error?.message || "تعذر تجهيز الاشتراك" });
    }
  }

  result.completedAt = new Date();
  await audit("backfill_project_subscriptions", "project_subscription_migration", runId, {
    outcome: result.errors.length > 0 ? "completed_with_errors" : "completed",
    dryRun,
    scanned: result.scanned,
    eligible: result.eligible,
    created: result.created,
    alreadyPresent: result.alreadyPresent,
    skipped: result.skipped,
    errorCount: result.errors.length,
    candidateProjectIds: result.candidates.map(candidate => candidate.projectId),
    skippedProjects: result.skippedProjects,
    errors: result.errors,
  });
  return result;
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
  const orderId = order?._id || order?.id;
  const clientId = order?.userId || client?._id || client?.id;
  if (!orderId || !clientId) {
    return { subscription: null, created: false };
  }

  let result: any;
  try {
    result = await ProjectSubscriptionModel.updateOne(
      { projectId },
      {
        $setOnInsert: {
          projectId,
          orderId,
          clientId,
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
  } catch (error: any) {
    // A unique projectId index turns a concurrent upsert into a duplicate-key
    // error for the loser. Treat that exactly like an existing subscription.
    if (error?.code !== 11000) throw error;
    result = { upsertedCount: 0 };
  }
  const subscription = await ProjectSubscriptionModel.findOne({ projectId });
  return {
    subscription,
    created: Number(result?.upsertedCount || 0) === 1 || !!result?.upsertedId,
  };
}