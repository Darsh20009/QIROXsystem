import assert from "node:assert/strict";
import test from "node:test";
import {
  getProjectSubscriptionDurationDays,
  getEffectiveProjectSubscription,
  getRenewalSubscriptionDates,
  normalizeProjectSubscriptionPeriod,
  serializeProjectSubscription,
  backfillLegacyProjectSubscriptions,
  startProjectSubscription,
} from "./project-subscriptions";
import { ProjectSubscriptionModel } from "./models/project-subscriptions";
import { ActivityLogModel, OrderModel, ProjectModel, UserModel } from "./models";

test("project subscription periods normalize to the expected duration", () => {
  assert.equal(normalizeProjectSubscriptionPeriod("monthly"), "monthly");
  assert.equal(normalizeProjectSubscriptionPeriod("sixmonth"), "6months");
  assert.equal(normalizeProjectSubscriptionPeriod("unknown"), null);
  assert.equal(getProjectSubscriptionDurationDays("monthly"), 30);
  assert.equal(getProjectSubscriptionDurationDays("6months"), 180);
  assert.equal(getProjectSubscriptionDurationDays("annual"), 365);
  assert.equal(normalizeProjectSubscriptionPeriod("lifetime"), "lifetime");
  assert.equal(getProjectSubscriptionDurationDays("lifetime"), null);
});

test("subscription serialization calculates expiry and remaining days without mutating data", () => {
  const now = new Date("2026-08-31T00:00:00.000Z");
  const subscription = serializeProjectSubscription({
    _id: "sub-1",
    projectId: "project-1",
    orderId: "order-1",
    clientId: "client-1",
    period: "monthly",
    durationDays: 30,
    startedAt: "2026-08-01T00:00:00.000Z",
    expiresAt: "2026-08-31T00:00:00.000Z",
    status: "active",
  }, now);

  assert.equal(subscription?.status, "expired");
  assert.equal(subscription?.remainingDays, 0);
  assert.equal(subscription?.percentRemaining, 0);
});

test("approved renewal becomes the displayed subscription without changing the original", () => {
  const now = new Date("2026-08-31T00:00:00.000Z");
  const original = serializeProjectSubscription({
    _id: "sub-1",
    projectId: "project-1",
    orderId: "order-1",
    clientId: "client-1",
    period: "monthly",
    durationDays: 30,
    startedAt: "2026-07-01T00:00:00.000Z",
    expiresAt: "2026-07-31T00:00:00.000Z",
    status: "active",
  }, now);
  const renewal = getRenewalSubscriptionDates("annual", new Date("2026-08-31T00:00:00.000Z"));
  const effective = getEffectiveProjectSubscription(original, {
    status: "approved",
    renewalPeriod: renewal?.period,
    renewalStartedAt: renewal?.startedAt,
    renewalExpiresAt: renewal?.expiresAt,
  }, now);

  assert.equal(original?.period, "monthly");
  assert.equal(original?.expiresAt, "2026-07-31T00:00:00.000Z");
  assert.equal(effective?.period, "annual");
  assert.equal(effective?.status, "active");
  assert.equal(effective?.remainingDays, 365);
});

test("project subscription activation uses set-on-insert and does not restart an existing record", async () => {
  const originalUpdateOne = ProjectSubscriptionModel.updateOne;
  const originalFindOne = ProjectSubscriptionModel.findOne;
  const writes: any[] = [];
  let existing: any = null;

  (ProjectSubscriptionModel as any).updateOne = async (_filter: any, update: any) => {
    writes.push(update);
    if (existing) return { upsertedCount: 0 };
    existing = {
      _id: "sub-1",
      ...update.$setOnInsert,
    };
    return { upsertedCount: 1 };
  };
  (ProjectSubscriptionModel as any).findOne = async () => existing;

  try {
    const startedAt = new Date("2026-08-31T00:00:00.000Z");
    const first = await startProjectSubscription({
      projectId: "project-1",
      order: { _id: "order-1", userId: "client-1", planPeriod: "monthly", planTier: "pro" },
      client: { _id: "client-1", subscriptionPeriod: "annual" },
      startedAt,
    });
    const second = await startProjectSubscription({
      projectId: "project-1",
      order: { _id: "order-1", userId: "client-1", planPeriod: "annual", planTier: "infinite" },
      client: { _id: "client-1", subscriptionPeriod: "annual" },
      startedAt: new Date("2027-01-01T00:00:00.000Z"),
    });

    assert.equal(first.created, true);
    assert.equal(second.created, false);
    assert.equal(writes.length, 2);
    assert.equal(writes[0].$setOnInsert.period, "monthly");
    assert.equal(existing.period, "monthly");
    assert.equal(existing.expiresAt.toISOString(), "2026-09-30T00:00:00.000Z");
  } finally {
    (ProjectSubscriptionModel as any).updateOne = originalUpdateOne;
    (ProjectSubscriptionModel as any).findOne = originalFindOne;
  }
});

test("project subscription activation treats a concurrent duplicate-key upsert as existing", async () => {
  const originalUpdateOne = ProjectSubscriptionModel.updateOne;
  const originalFindOne = ProjectSubscriptionModel.findOne;
  const existing = {
    _id: "sub-1",
    projectId: "project-1",
    period: "monthly",
  };
  (ProjectSubscriptionModel as any).updateOne = async () => {
    const error: any = new Error("duplicate projectId");
    error.code = 11000;
    throw error;
  };
  (ProjectSubscriptionModel as any).findOne = async () => existing;

  try {
    const result = await startProjectSubscription({
      projectId: "project-1",
      order: { _id: "order-1", userId: "client-1", planPeriod: "monthly" },
      client: { _id: "client-1" },
      startedAt: new Date("2026-08-31T00:00:00.000Z"),
    });
    assert.equal(result.created, false);
    assert.equal(result.subscription, existing);
  } finally {
    (ProjectSubscriptionModel as any).updateOne = originalUpdateOne;
    (ProjectSubscriptionModel as any).findOne = originalFindOne;
  }
});

test("legacy backfill previews eligible closed projects without writing or changing user subscriptions", async () => {
  const originalProjectFind = ProjectModel.find;
  const originalSubscriptionFind = ProjectSubscriptionModel.find;
  const originalOrderFindById = OrderModel.findById;
  const originalUserFindById = UserModel.findById;
  const originalAuditCreate = ActivityLogModel.create;
  const projects = [{
    _id: "project-legacy",
    orderId: "order-legacy",
    clientId: "client-legacy",
    status: "closed",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }];
  const auditEntries: any[] = [];
  let writes = 0;
  let clientSubscriptionPeriod = "annual";

  const query = (value: any) => ({
    select() { return this; },
    sort() { return this; },
    lean: async () => value,
  });
  (ProjectModel as any).find = () => query(projects);
  (ProjectSubscriptionModel as any).find = () => query([]);
  (OrderModel as any).findById = () => query({
    _id: "order-legacy",
    userId: "client-legacy",
    planPeriod: "monthly",
    planTier: "pro",
    planSegment: "segment-a",
  });
  (UserModel as any).findById = () => query({
    _id: "client-legacy",
    get subscriptionPeriod() { return clientSubscriptionPeriod; },
    subscriptionSegmentId: "segment-client",
  });
  (ProjectSubscriptionModel as any).updateOne = async () => {
    writes++;
    return { upsertedCount: 1 };
  };
  (ProjectSubscriptionModel as any).findOne = async () => null;
  (ActivityLogModel as any).create = async (entry: any) => {
    auditEntries.push(entry);
    return entry;
  };

  try {
    const result = await backfillLegacyProjectSubscriptions({
      actorId: "admin-1",
      dryRun: true,
      now: new Date("2026-09-01T00:00:00.000Z"),
    });

    assert.equal(result.scanned, 1);
    assert.equal(result.eligible, 1);
    assert.equal(result.created, 0);
    assert.equal(writes, 0);
    assert.equal(result.candidates[0].period, "monthly");
    assert.equal(result.candidates[0].startedAt.toISOString(), "2026-01-01T00:00:00.000Z");
    assert.equal(result.candidates[0].startedAtSource, "updatedAt");
    assert.equal(clientSubscriptionPeriod, "annual");
    assert.equal(auditEntries.length, 1);
    assert.equal(auditEntries[0].action, "backfill_project_subscriptions");
    assert.equal(auditEntries[0].details.dryRun, true);
  } finally {
    (ProjectModel as any).find = originalProjectFind;
    (ProjectSubscriptionModel as any).find = originalSubscriptionFind;
    (OrderModel as any).findById = originalOrderFindById;
    (UserModel as any).findById = originalUserFindById;
    (ActivityLogModel as any).create = originalAuditCreate;
  }
});

test("legacy backfill creates once and treats a repeated run as already present", async () => {
  const originalProjectFind = ProjectModel.find;
  const originalSubscriptionFind = ProjectSubscriptionModel.find;
  const originalOrderFindById = OrderModel.findById;
  const originalUserFindById = UserModel.findById;
  const originalSubscriptionUpdateOne = ProjectSubscriptionModel.updateOne;
  const originalSubscriptionFindOne = ProjectSubscriptionModel.findOne;
  const originalAuditCreate = ActivityLogModel.create;
  const projects = [{
    _id: "project-legacy",
    orderId: "order-legacy",
    clientId: "client-legacy",
    status: "closed",
    deliveredAt: "2026-02-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
  }];
  const subscriptions: any[] = [];
  const auditEntries: any[] = [];
  let upsertAttempts = 0;

  const query = (value: any) => ({
    select() { return this; },
    sort() { return this; },
    lean: async () => value,
  });
  (ProjectModel as any).find = () => query(projects);
  (OrderModel as any).findById = () => query({
    _id: "order-legacy",
    userId: "client-legacy",
    planPeriod: "annual",
    planTier: "infinite",
  });
  (UserModel as any).findById = () => query({
    _id: "client-legacy",
    subscriptionPeriod: "monthly",
  });
  (ProjectSubscriptionModel as any).find = () => query(subscriptions);
  (ProjectSubscriptionModel as any).updateOne = async (_filter: any, update: any) => {
    upsertAttempts++;
    subscriptions.push({ _id: "sub-legacy", ...update.$setOnInsert });
    return { upsertedCount: 1 };
  };
  (ProjectSubscriptionModel as any).findOne = async () => subscriptions[0] || null;
  (ActivityLogModel as any).create = async (entry: any) => {
    auditEntries.push(entry);
    return entry;
  };

  try {
    const first = await backfillLegacyProjectSubscriptions({
      actorId: "admin-1",
      now: new Date("2026-09-01T00:00:00.000Z"),
    });
    const second = await backfillLegacyProjectSubscriptions({
      actorId: "admin-1",
      now: new Date("2026-09-02T00:00:00.000Z"),
    });

    assert.equal(first.created, 1);
    assert.equal(first.alreadyPresent, 0);
    assert.equal(second.created, 0);
    assert.equal(second.alreadyPresent, 1);
    assert.equal(upsertAttempts, 1);
    assert.equal(subscriptions.length, 1);
    assert.equal(subscriptions[0].period, "annual");
    assert.equal(subscriptions[0].startedAt.toISOString(), "2026-02-01T00:00:00.000Z");
    assert.equal(auditEntries.filter(entry => entry.action === "backfill_project_subscription").length, 1);
    assert.equal(auditEntries.filter(entry => entry.action === "backfill_project_subscriptions").length, 2);
  } finally {
    (ProjectModel as any).find = originalProjectFind;
    (ProjectSubscriptionModel as any).find = originalSubscriptionFind;
    (OrderModel as any).findById = originalOrderFindById;
    (UserModel as any).findById = originalUserFindById;
    (ProjectSubscriptionModel as any).updateOne = originalSubscriptionUpdateOne;
    (ProjectSubscriptionModel as any).findOne = originalSubscriptionFindOne;
    (ActivityLogModel as any).create = originalAuditCreate;
  }
});