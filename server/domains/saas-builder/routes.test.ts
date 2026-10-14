import assert from "node:assert/strict";
import test from "node:test";
import {
  isSaasBuilderOrder,
  buildOneTimeDeploymentEnvelope,
  normalizeBuilderConfig,
  formatSaasBuilderError,
  saasBuilderPrincipal,
  saasTierFromOrder,
  validateBuilderConfigLocally,
} from "./routes";

test("SaaS builder access accepts authenticated administrators, CTOs, and owners", () => {
  assert.equal(saasBuilderPrincipal({ isAuthenticated: () => false, user: { role: "admin", id: "a" } }), null);
  assert.equal(saasBuilderPrincipal({ isAuthenticated: () => true, user: { role: "manager", id: "m" } }), null);
  assert.deepEqual(saasBuilderPrincipal({ isAuthenticated: () => true, user: { role: "cto", _id: "c" } }), { id: "c", role: "cto" });
  assert.deepEqual(saasBuilderPrincipal({ isAuthenticated: () => true, user: { role: "owner", _id: "o" } }), { id: "o", role: "owner" });
});

test("tier comes only from the persisted order plan and infinite maps to infinity", () => {
  assert.equal(saasTierFromOrder({ planTier: "infinite" }), "infinity");
  assert.equal(saasTierFromOrder({ planTier: "infinity" }), "infinity");
  assert.equal(saasTierFromOrder({ planTier: "lite" }), "lite");
  assert.equal(saasTierFromOrder({ planTier: "pro" }), "pro");
  assert.equal(saasTierFromOrder({}), null);
  assert.equal(saasTierFromOrder({ planTier: "lifetime" }), null);
});

test("empty MongoDB stays optional in the one-time deployment setup envelope", () => {
  const config = normalizeBuilderConfig({ businessName: "Cafe", commercialRegNumber: "1010000000", primaryColor: "#243b35" });
  const vars = buildOneTimeDeploymentEnvelope({
    envRequirements: [{ key: "MONGODB_URI", required: true, description: "Template database" }],
    projectId: "isolated-cafe", tier: "lite", config, databaseUri: "",
  });
  const mongo = vars.find(item => item.key === "MONGODB_URI");
  assert.ok(mongo);
  assert.equal(mongo.required, false);
  assert.equal(mongo.value, undefined);
  assert.match(mongo.description, /optional|اختياري/i);
});

test("builder is limited to restaurant and cafe orders", () => {
  assert.equal(isSaasBuilderOrder({ sector: "restaurant" }), true);
  assert.equal(isSaasBuilderOrder({ sector: "مقهى" }), true);
  assert.equal(isSaasBuilderOrder({ planSegment: "restaurant", sector: "services" }), true);
  assert.equal(isSaasBuilderOrder({ sector: "healthcare" }), false);
});

test("replacement conflicts expose the confirmation flag required by clients", () => {
  const result = formatSaasBuilderError({ status: 409, code: "needsConfirmation", message: "sensitive repository detail" });
  assert.equal(result.status, 409);
  assert.equal(result.body.needsConfirmation, true);
  assert.equal(result.body.error, "المستودع يحتوي على أكواد سابقة؛ يلزم تأكيد الاستبدال");
  assert.notEqual(result.body.error, "sensitive repository detail");
});

test("GitHub write errors tell administrators which permission or repository rule to check", () => {
  const scope = formatSaasBuilderError({
    status: 403,
    code: "github_token_scope",
    operation: "branch_update",
  });
  assert.equal(scope.status, 503);
  assert.match(String(scope.body.error), /Contents: Read and write/);
  assert.equal(scope.body.operation, "branch_update");

  const rules = formatSaasBuilderError({
    status: 403,
    code: "github_repository_rules",
    operation: "branch_update",
  });
  assert.match(String(rules.body.error), /قواعد المستودع/);
  assert.doesNotMatch(String(rules.body.error), /secret|token/i);

  const limited = formatSaasBuilderError({
    status: 403,
    code: "github_rate_limit",
    operation: "blob_create",
    retryAfterSeconds: 37,
  });
  assert.match(String(limited.body.error), /37 ثانية/);
});

test("one-time deployment envelope supplies all template values without persisting them", () => {
  const envRequirements = [
    "MONGODB_URI", "TENANT_ID", "PROJECT_PLAN_TIER", "SESSION_SECRET",
    "BOOTSTRAP_ADMIN_PASSWORD", "BUSINESS_CONFIG_JSON",
  ].map(key => ({ key, required: true, description: key }));
  const envVars = buildOneTimeDeploymentEnvelope({
    envRequirements,
    projectId: "65ab12ef34cd56ab78ef9012",
    tier: "pro",
    databaseUri: "mongodb://deployment-user:example-only@mongo.example/cafe",
    config: {
      businessName: "Cafe",
      businessNameEn: "Cafe",
      commercialRegNumber: "12345",
      taxNumber: "",
      commercialRegUrl: "",
      bankName: "",
      bankAccountName: "",
      iban: "",
      logoUrl: "/uploads/saas-logos/65ab12ef-34cd-56ab-78ef-901234567890-original.jpg",
      primaryColor: "#315548",
      phone: "",
      address: "",
      websiteUrl: "https://cafe.example",
    },
  });
  const values = Object.fromEntries(envVars.map(item => [item.key, item.value]));
  assert.equal(values.MONGODB_URI, "mongodb://deployment-user:example-only@mongo.example/cafe");
  assert.equal(values.TENANT_ID, "65ab12ef34cd56ab78ef9012");
  assert.equal(values.PROJECT_PLAN_TIER, "pro");
  assert.match(values.SESSION_SECRET!, /^[A-Za-z0-9_-]{60,}$/);
  assert.match(values.BOOTSTRAP_ADMIN_PASSWORD!, /^[A-Za-z0-9_-]{40,}$/);
  assert.equal(JSON.parse(values.BUSINESS_CONFIG_JSON!).logoUrl, "/tenant-logo.jpg");
  assert.equal(JSON.parse(values.BUSINESS_CONFIG_JSON!).commercialRegNumber, "12345");
  assert.ok(envVars.every(item => item.persisted === false));
});

test("configuration strips unknown secret properties and validates required identity fields", () => {
  const config = normalizeBuilderConfig({
    businessName: "Example Cafe",
    commercialRegNumber: "",
    accessToken: "must-not-be-kept",
    databaseUri: "mongodb://secret",
  });
  assert.equal((config as any).accessToken, undefined);
  assert.equal((config as any).databaseUri, undefined);
  assert.ok(validateBuilderConfigLocally(config).includes("رقم السجل التجاري مطلوب"));
  assert.ok(validateBuilderConfigLocally({
    ...config,
    commercialRegNumber: "123",
    websiteUrl: "http://example.com",
  }).includes("رابط الموقع يجب أن يكون HTTPS"));
});