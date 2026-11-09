import assert from "node:assert/strict";
import { createServer, request as httpRequest, type Server } from "node:http";
import test from "node:test";
import express from "express";
import type { Express } from "express";
import {
  ClientApiKeyModel,
  KanbanTaskModel,
  UserModel,
} from "./models";
import { storage } from "./storage";
import { registerRoutes } from "./routes";
import {
  DATA_ENTRY_SENSITIVE_FIELDS,
  roleCanAccess,
} from "./data-entry-policy";

const DATA_ENTRY_ID = "data-entry-http-test-user";

type HttpResponse = {
  status: number;
  body: unknown;
  text: string;
};

const protectedResponseFields = new Set([
  ...DATA_ENTRY_SENSITIVE_FIELDS,
  "role",
  "allowedPages",
  "permissions",
  "walletBalance",
  "salary",
  "totalAmount",
  "paymentStatus",
  "paymentMethod",
  "paymentProofUrl",
  "databaseUri",
  "serverIp",
  "deploymentUsername",
  "deploymentPassword",
  "variables",
  "customVars",
  "deployToken",
  "githubRepo",
]);

function assertNoProtectedResponseFields(value: unknown, context: string): void {
  const visit = (current: unknown, path: string): void => {
    if (!current || typeof current !== "object") return;
    if (Array.isArray(current)) {
      current.forEach((entry, index) => visit(entry, `${path}[${index}]`));
      return;
    }
    for (const [key, nested] of Object.entries(current)) {
      assert.equal(
        protectedResponseFields.has(key),
        false,
        `${context} exposed protected response field ${path}.${key}`,
      );
      visit(nested, `${path}.${key}`);
    }
  };
  visit(value, "$");
}

function queryChain<T>(value: T) {
  const chain: any = {
    sort: () => chain,
    limit: () => chain,
    skip: () => chain,
    populate: () => chain,
    select: () => chain,
    lean: async () => value,
  };
  return chain;
}

function makeTask(overrides: Record<string, unknown> = {}) {
  return {
    _id: "task-1",
    title: "Prepare project handoff",
    status: "new",
    assignedTo: DATA_ENTRY_ID,
    createdBy: "manager-1",
    plan: {
      projectConcept: "A client website",
      serverIp: "10.0.0.9",
      githubRepo: "private-repository",
      deploymentPassword: "do-not-expose",
    },
    ...overrides,
  };
}

function request(
  server: Server,
  role: string | undefined,
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<HttpResponse> {
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server is not listening");
  const body = options.body === undefined ? undefined : JSON.stringify(options.body);
  return new Promise((resolve, reject) => {
    const req = httpRequest({
      port: address.port,
      method: options.method || "GET",
      path,
      headers: {
        ...(role ? { "x-test-role": role } : {}),
        ...(body
          ? {
              "content-type": "application/json",
              "content-length": Buffer.byteLength(body),
            }
          : {}),
      },
    }, (res) => {
      let text = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { text += chunk; });
      res.on("end", () => {
        let parsedBody: unknown = text;
        try { parsedBody = text ? JSON.parse(text) : undefined; } catch { /* text response */ }
        resolve({ status: res.statusCode || 0, body: parsedBody, text });
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function createHarness(): Promise<{ app: Express; server: Server }> {
  process.env.NODE_ENV = "test";
  process.env.MONGODB_URI = "";
  process.env.SESSION_SECRET = "data-entry-http-test-session";

  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    const role = String(req.headers["x-test-role"] || "");
    if (role) {
      req.user = {
        id: role === "data_entry" ? DATA_ENTRY_ID : `${role}-user`,
        _id: role === "data_entry" ? DATA_ENTRY_ID : `${role}-user`,
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
  return { app, server };
}

test("authenticated Data Entry requests enforce the route matrix and response boundary", async () => {
  const partner = {
    id: "partner-1",
    name: "Partner",
    logoUrl: "/uploads/partner.png",
    role: "admin",
    password: "secret",
    totalAmount: 1000,
    deployToken: "deploy-secret",
  };
  const employee = {
    id: "employee-1",
    username: "employee",
    fullName: "Employee",
    email: "employee@example.test",
    role: "developer",
    allowedPages: ["/admin/finance"],
    passwordHash: "hash",
    walletBalance: 1000,
    githubDeployToken: "deploy-secret",
  };
  const key = {
    _id: "key-1",
    clientId: "client-1",
    name: "Reporting",
    keyPrefix: "qrx_live_abc...",
    keyHash: "hash-secret",
    rawKey: "qrx_live_raw-secret",
    role: "admin",
    totalAmount: 500,
  };

  const originals = {
    getAllPartners: storage.getAllPartners,
    createPartner: storage.createPartner,
    updatePartner: storage.updatePartner,
    getUsers: storage.getUsers,
    getUser: storage.getUser,
    updateUser: storage.updateUser,
    apiFind: (ClientApiKeyModel as any).find,
    userFind: (UserModel as any).find,
    taskFind: (KanbanTaskModel as any).find,
    taskFindById: (KanbanTaskModel as any).findById,
    taskFindByIdAndUpdate: (KanbanTaskModel as any).findByIdAndUpdate,
  };

  (storage as any).getAllPartners = async () => [partner];
  (storage as any).createPartner = async () => partner;
  (storage as any).updatePartner = async () => partner;
  (storage as any).getUsers = async () => [employee];
  (storage as any).getUser = async (id: string) =>
    id === "admin-target" ? { ...employee, id, role: "admin" } : employee;
  (storage as any).updateUser = async () => employee;
  (ClientApiKeyModel as any).find = () => queryChain([key]);
  (UserModel as any).find = () => queryChain([{
    _id: "client-1",
    fullName: "Client",
    username: "client",
    email: "client@example.test",
    password: "secret",
    role: "client",
  }]);

  let currentTask = makeTask();
  let taskFindFilter: unknown;
  (KanbanTaskModel as any).find = (filter: unknown) => {
    taskFindFilter = filter;
    return queryChain([currentTask]);
  };
  (KanbanTaskModel as any).findById = () => queryChain(currentTask);
  (KanbanTaskModel as any).findByIdAndUpdate = () => queryChain(currentTask);

  let server: Server | undefined;
  try {
    const harness = await createHarness();
    server = harness.server;

    // The policy itself is the source of truth for each expected assertion.
    assert.equal(roleCanAccess("data_entry", "partners", "read"), true);
    assert.equal(roleCanAccess("data_entry", "partners", "delete"), false);
    assert.equal(roleCanAccess("data_entry", "apiKeys", "read"), true);
    assert.equal(roleCanAccess("data_entry", "apiKeys", "update"), false);
    assert.equal(roleCanAccess("data_entry", "tasks", "read"), true);
    assert.equal(roleCanAccess("data_entry", "tasks", "statusUpdate"), true);
    assert.equal(roleCanAccess("data_entry", "tasks", "update"), false);

    const allowedRequests: Array<[
      string,
      string,
      string,
      number,
      { method?: string; body?: unknown }?,
    ]> = [
      ["partners read", "data_entry", "/api/admin/partners", 200],
      ["partners create", "data_entry", "/api/admin/partners", 201, { method: "POST", body: { name: "Partner", logoUrl: "/logo.png" } }],
      ["partners update", "data_entry", "/api/admin/partners/partner-1", 200, { method: "PATCH", body: { name: "Updated" } }],
      ["api keys read", "data_entry", "/api/admin/api-keys", 200],
      ["client API key list", "data_entry", "/api/my-api-keys", 403],
      ["admin users read", "data_entry", "/api/admin/users", 200],
      ["admin employees read", "data_entry", "/api/admin/employees", 200],
      ["employee directory read", "data_entry", "/api/employees", 200],
      ["employee profile update", "data_entry", "/api/admin/users/employee-1", 200, { method: "PATCH", body: { fullName: "Updated Employee" } }],
      ["kanban tasks read", "data_entry", "/api/admin/kanban/tasks", 200],
      ["assigned task status update", "data_entry", "/api/admin/kanban/tasks/task-1/status", 200, { method: "PATCH", body: { status: "in_progress" } }],
    ];

    for (const [label, role, path, expectedStatus, options] of allowedRequests) {
      const response = await request(server, role, path, options);
      assert.equal(response.status, expectedStatus, `${label} should return ${expectedStatus}`);
      assertNoProtectedResponseFields(response.body, label);
    }
    assert.deepEqual(taskFindFilter, { assignedTo: DATA_ENTRY_ID });

    const forbiddenRequests: Array<[string, string, string, { method?: string; body?: unknown }?]> = [
      ["partner delete", "data_entry", "/api/admin/partners/partner-1", { method: "DELETE" }],
      ["client API key create", "data_entry", "/api/my-api-keys", { method: "POST", body: { name: "Nope" } }],
      ["api key update", "data_entry", "/api/admin/api-keys/key-1", { method: "PATCH", body: { name: "Nope" } }],
      ["api key delete", "data_entry", "/api/admin/api-keys/key-1", { method: "DELETE" }],
      ["employee create", "data_entry", "/api/admin/users", { method: "POST", body: { username: "nope" } }],
      ["management employee update", "data_entry", "/api/admin/users/admin-target", { method: "PATCH", body: { fullName: "Nope" } }],
      ["employee delete", "data_entry", "/api/admin/users/employee-1", { method: "DELETE" }],
      ["password reset", "data_entry", "/api/admin/users/employee-1/reset-password", { method: "POST" }],
      ["task create", "data_entry", "/api/admin/kanban/tasks", { method: "POST", body: { title: "Nope" } }],
      ["task update", "data_entry", "/api/admin/kanban/tasks/task-1", { method: "PATCH", body: { title: "Nope" } }],
      ["task delete", "data_entry", "/api/admin/kanban/tasks/task-1", { method: "DELETE" }],
      ["project kanban status", "data_entry", "/api/admin/kanban/project-1/status", { method: "PATCH", body: { status: "in_progress" } }],
    ];

    for (const [label, role, path, options] of forbiddenRequests) {
      const response = await request(server, role, path, options);
      assert.equal(response.status, 403, `${label} should return 403`);
    }

    currentTask = makeTask({ assignedTo: "another-employee" });
    const unassignedStatus = await request(
      server,
      "data_entry",
      "/api/admin/kanban/tasks/task-1/status",
      { method: "PATCH", body: { status: "in_progress" } },
    );
    assert.equal(unassignedStatus.status, 403, "Data Entry cannot update an unassigned task");

    const unauthenticated = await request(server, undefined, "/api/admin/partners");
    assert.equal(unauthenticated.status, 403);
  } finally {
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
    (storage as any).getAllPartners = originals.getAllPartners;
    (storage as any).createPartner = originals.createPartner;
    (storage as any).updatePartner = originals.updatePartner;
    (storage as any).getUsers = originals.getUsers;
    (storage as any).getUser = originals.getUser;
    (storage as any).updateUser = originals.updateUser;
    (ClientApiKeyModel as any).find = originals.apiFind;
    (UserModel as any).find = originals.userFind;
    (KanbanTaskModel as any).find = originals.taskFind;
    (KanbanTaskModel as any).findById = originals.taskFindById;
    (KanbanTaskModel as any).findByIdAndUpdate = originals.taskFindByIdAndUpdate;
  }
});