import assert from "node:assert/strict";
import { createServer, request as httpRequest, type Server } from "node:http";
import test from "node:test";
import express, { type Express } from "express";
import {
  getProjectSubscriptionDurationDays,
  getEffectiveProjectSubscription,
  getRenewalSubscriptionDates,
  normalizeProjectSubscriptionPeriod,
  serializeProjectSubscription,
  backfillLegacyProjectSubscriptions,
  startProjectSubscription,
} from "./project-subscriptions";
import { ActivityLogModel, NotificationModel, OrderModel, ProjectModel, ProjectSubscriptionRenewalRequestModel, PushSubscriptionModel, UserModel } from "./models";
import { ProjectSubscriptionModel } from "./models/project-subscriptions";
import { NotificationDeliveryModel } from "./models/notification-delivery";
import { registerRoutes } from "./routes";
import { storage } from "./storage";

type HttpResponse = {
  status: number;
  body: any;
};

function queryChain<T>(value: T) {
  const chain: any = {
    populate: () => chain,
    select: () => chain,
    sort: () => chain,
    lean: async () => value,
    then: (resolve: (value: T) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(value).then(resolve, reject),
  };
  return chain;
}

function request(
  server: Server,
  role: string,
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<HttpResponse> {
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server is not listening");
  const body = options.body === undefined ? undefined : JSON.stringify(options.body);
  return new Promise((resolve, reject) => {
    const req = httpRequest({
      host: "127.0.0.1",
      port: address.port,
      method: options.method || "GET",
      path,
      headers: {
        "x-test-role": role,
        ...(body ? {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(body),
        } : {}),
      },
    }, (res) => {
      let text = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { text += chunk; });
      res.on("end", () => {
        let bodyValue: unknown = text;
        try { bodyValue = text ? JSON.parse(text) : undefined; } catch { /* text response */ }
        resolve({ status: res.statusCode || 0, body: bodyValue });
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function createRouteHarness(): Promise<Server> {
  process.env.NODE_ENV = "test";
  process.env.MONGODB_URI = "";
  process.env.SESSION_SECRET = "project-subscription-http-test-session";

  const app: Express = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    const role = String(req.headers["x-test-role"] || "");
    if (role) {
      req.user = {
        id: `${role}-user`,
        _id: `${role}-user`,
        role,
        username: `${role}-user`,
        fullName: `${role} user`,
      };
    }
    next();
  });

  const server = createServer(app);
  await registerRoutes(server, app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  return server;
}

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

test("closing a project over HTTP creates its subscription and exposes it to the client", async () => {
  const projectId = "project-http-1";
  const orderId = "order-http-1";
  const clientId = "client-http-1";
  const repositoryUrl = "https://github.com/qirox/http-project";
  let projectStatus = "in_progress";
  let subscription: any = null;
  let subscriptionUpserts = 0;
  const project = {
    _id: projectId,
    id: projectId,
    orderId,
    clientId,
    name: "HTTP project",
    status: projectStatus,
    repoUrl: repositoryUrl,
    githubRepoName: "http-project",
    githubRepoOwner: "qirox",
    githubProvisioningStatus: "ready",
    githubDeployToken: "must-not-be-exposed",
    toObject() {
      return {
        ...this,
        status: projectStatus,
        toObject: undefined,
      };
    },
  };
  const order = {
    _id: orderId,
    userId: clientId,
    planPeriod: "annual",
    planTier: "pro",
    planSegment: "segment-http",
    businessName: "HTTP project",
  };
  const client = {
    _id: clientId,
    fullName: "HTTP client",
    username: "http-client",
    subscriptionPeriod: "monthly",
  };

  const originals = {
    projectFindById: ProjectModel.findById,
    projectFindByIdAndUpdate: ProjectModel.findByIdAndUpdate,
    orderFindById: OrderModel.findById,
    userFindById: UserModel.findById,
    userFind: UserModel.find,
    subscriptionFindOne: ProjectSubscriptionModel.findOne,
    subscriptionUpdateOne: ProjectSubscriptionModel.updateOne,
    renewalFindOne: ProjectSubscriptionRenewalRequestModel.findOne,
    notificationCreate: NotificationModel.create,
    notificationDeliveryFindOne: NotificationDeliveryModel.findOne,
    notificationDeliveryCreate: NotificationDeliveryModel.create,
    pushSubscriptionFind: PushSubscriptionModel.find,
  };

  (ProjectModel as any).findById = () => queryChain(project);
  (ProjectModel as any).findByIdAndUpdate = async (_id: string, updates: any) => {
    projectStatus = updates.status;
    return project;
  };
  (OrderModel as any).findById = async () => order;
  (UserModel as any).findById = () => queryChain(client);
  (UserModel as any).find = () => queryChain([]);
  (ProjectSubscriptionModel as any).updateOne = async (_filter: any, update: any) => {
    subscriptionUpserts++;
    subscription = { _id: "subscription-http-1", ...update.$setOnInsert };
    return { upsertedCount: 1 };
  };
  (ProjectSubscriptionModel as any).findOne = () => queryChain(subscription);
  (ProjectSubscriptionRenewalRequestModel as any).findOne = () => queryChain(null);
  (NotificationModel as any).create = async (entry: any) => entry;
  (NotificationDeliveryModel as any).findOne = async () => null;
  (NotificationDeliveryModel as any).create = async (entry: any) => ({
    _id: `delivery-${entry.channel}`,
    ...entry,
  });
  (PushSubscriptionModel as any).find = () => queryChain([]);

  let server: Server | undefined;
  try {
    server = await createRouteHarness();

    const updateResponse = await request(server, "admin", `/api/projects/${projectId}`, {
      method: "PATCH",
      body: { status: "closed" },
    });
    assert.equal(updateResponse.status, 200, JSON.stringify(updateResponse.body));
    assert.equal(updateResponse.body.status, "closed");
    assert.equal(subscriptionUpserts, 1);
    assert.equal(subscription.period, "annual");
    assert.equal(subscription.durationDays, 365);
    assert.equal(subscription.orderId, orderId);
    assert.equal(subscription.clientId, clientId);

    const clientResponse = await request(server, "client", `/api/projects/${projectId}`);
    assert.equal(clientResponse.status, 200);
    assert.equal(clientResponse.body.status, "closed");
    assert.equal(clientResponse.body.repoUrl, repositoryUrl);
    assert.equal(clientResponse.body.githubRepoName, "http-project");
    assert.equal(clientResponse.body.subscription.period, "annual");
    assert.equal(typeof clientResponse.body.subscription.remainingDays, "number");
    assert.ok(clientResponse.body.subscription.remainingDays > 0);
    assert.equal("githubDeployToken" in clientResponse.body, false);
    assert.equal(JSON.stringify(clientResponse.body).includes("must-not-be-exposed"), false);
  } finally {
    if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
    (ProjectModel as any).findById = originals.projectFindById;
    (ProjectModel as any).findByIdAndUpdate = originals.projectFindByIdAndUpdate;
    (OrderModel as any).findById = originals.orderFindById;
    (UserModel as any).findById = originals.userFindById;
    (UserModel as any).find = originals.userFind;
    (ProjectSubscriptionModel as any).findOne = originals.subscriptionFindOne;
    (ProjectSubscriptionModel as any).updateOne = originals.subscriptionUpdateOne;
    (ProjectSubscriptionRenewalRequestModel as any).findOne = originals.renewalFindOne;
    (NotificationModel as any).create = originals.notificationCreate;
    (NotificationDeliveryModel as any).findOne = originals.notificationDeliveryFindOne;
    (NotificationDeliveryModel as any).create = originals.notificationDeliveryCreate;
    (PushSubscriptionModel as any).find = originals.pushSubscriptionFind;
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