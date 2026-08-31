import assert from "node:assert/strict";
import test from "node:test";
import {
  getProjectSubscriptionDurationDays,
  normalizeProjectSubscriptionPeriod,
  serializeProjectSubscription,
  startProjectSubscription,
} from "./project-subscriptions";
import { ProjectSubscriptionModel } from "./models/project-subscriptions";

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