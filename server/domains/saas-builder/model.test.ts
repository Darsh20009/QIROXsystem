import assert from "node:assert/strict";
import test from "node:test";
import {
  fingerprintSaasBuilderConfig,
  databaseForSaasBuild,
  inspectProjectDatabaseUri,
  mongoDatabaseLinkFailure,
  prepareProjectDatabaseUri,
  safeSaasBuilderBuild,
  saasFeaturesForTier,
  templatePreviewTheme,
} from "./model";

test("builder configuration fingerprint is stable and template-sensitive", () => {
  const config = { businessName: "Cafe", commercialRegNumber: "123" };
  assert.equal(fingerprintSaasBuilderConfig("template-a", "lite", config), fingerprintSaasBuilderConfig("template-a", "lite", config));
  assert.notEqual(fingerprintSaasBuilderConfig("template-a", "lite", config), fingerprintSaasBuilderConfig("template-b", "lite", config));
  assert.notEqual(fingerprintSaasBuilderConfig("template-a", "lite", config), fingerprintSaasBuilderConfig("template-a", "pro", config));
});

test("public build summary omits generated environment values", () => {
  assert.equal(safeSaasBuilderBuild({}), null, "an empty draft is not a generated build");
  assert.equal(safeSaasBuilderBuild(undefined), null);
  const summary = safeSaasBuilderBuild({
    fileCount: 3,
    envRequirements: [{ key: "API_KEY", required: true, value: "never expose this", description: "key" }],
  });
  assert.ok(summary);
  assert.equal((summary.envRequirements[0] as any).value, undefined);
  assert.equal(summary.fileCount, 3);
});

test("partner listing features never exceed the persisted plan tier", () => {
  const features = [
    { id: "orders", minTier: "lite" },
    { id: "analytics", minTier: "pro" },
    { id: "multi-location", minTier: "infinity" },
  ];
  assert.deepEqual(saasFeaturesForTier(features, "pro").map((item) => item.id), ["orders", "analytics"]);
});

test("database URI validation requires a named isolated Mongo database", () => {
  assert.deepEqual(inspectProjectDatabaseUri("https://example.com/db", "mongodb://localhost/platform"), {
    valid: false,
    sameAsPlatform: false,
    platformUriValid: true,
  });
  assert.deepEqual(inspectProjectDatabaseUri("mongodb://user:pass@db.example/cafe", "mongodb://platform/db"), {
    valid: true,
    sameAsPlatform: false,
    platformUriValid: true,
  });
  assert.deepEqual(inspectProjectDatabaseUri("mongodb://user:pass@db.example/platform", "mongodb://other:secret@db.example/platform"), {
    valid: true,
    sameAsPlatform: true,
    platformUriValid: true,
  });
  assert.equal(inspectProjectDatabaseUri("mongodb://db.example/customer", "").platformUriValid, false);
  assert.equal(inspectProjectDatabaseUri("mongodb://db.example/foo/bar", "mongodb://platform/db").valid, false);
  assert.equal(inspectProjectDatabaseUri("mongodb://db.example/customer", "mongodb://db.example/").sameAsPlatform, false);
  assert.equal(inspectProjectDatabaseUri("mongodb://db.example/test", "mongodb://db.example/").sameAsPlatform, true);
  assert.equal(inspectProjectDatabaseUri("mongodb://db.example/customer", "mongodb://db.example/", "platform_live").sameAsPlatform, false);
  assert.equal(inspectProjectDatabaseUri("mongodb://db.example/platform_live", "mongodb://db.example/", "platform_live").sameAsPlatform, true);
  assert.deepEqual(inspectProjectDatabaseUri(
    "mongodb://user:pass@db.example/",
    "mongodb://platform:secret@db.example/",
    "platform_live",
  ), { valid: false, sameAsPlatform: true, platformUriValid: true });
});

test("SaaS files can be prepared without a database, but platform and invalid URIs are never copied", () => {
  const platformUri = "mongodb://platform.example/qirox";
  assert.deepEqual(databaseForSaasBuild("", platformUri, "qirox"), {
    databaseUri: "", databaseReady: false, reason: "missing",
  });
  assert.deepEqual(databaseForSaasBuild("not-a-mongodb-url", platformUri, "qirox"), {
    databaseUri: "", databaseReady: false, reason: "invalid",
  });
  assert.deepEqual(databaseForSaasBuild(platformUri, platformUri, "qirox"), {
    databaseUri: "", databaseReady: false, reason: "platform",
  });
  assert.deepEqual(databaseForSaasBuild("mongodb://customer.example/cafe", platformUri, "qirox"), {
    databaseUri: "mongodb://customer.example/cafe", databaseReady: true, reason: "ready",
  });
});

test("pathless Atlas URIs get a unique database name without losing options or credentials", () => {
  const prepared = prepareProjectDatabaseUri(
    "mongodb+srv://cluster-user:p%40ss%3Aword@cluster.customer.example/?retryWrites=true&w=majority&appName=Test",
    "0123456789abcdef01234567",
    "mongodb+srv://platform-user@platform.example/",
    "qirox",
  );
  assert.equal(prepared.valid, true);
  assert.equal(prepared.autoAssignedDatabaseName, true);
  const url = new URL(prepared.databaseUri);
  assert.equal(url.pathname, "/qirox_project_0123456789abcdef01234567");
  assert.equal(url.username, "cluster-user");
  assert.equal(url.password, "p%40ss%3Aword");
  assert.equal(url.searchParams.get("appName"), "Test");
});

test("a pathless URI for the platform's Mongo endpoint is still rejected", () => {
  const prepared = prepareProjectDatabaseUri(
    "mongodb+srv://customer:password@same.example/",
    "0123456789abcdef01234567",
    "mongodb+srv://platform:secret@same.example/",
    "qirox",
  );
  assert.equal(prepared.valid, false);
  assert.equal(prepared.sameAsPlatform, true);
  assert.equal(prepared.databaseUri, "");
});

test("MongoDB link errors are actionable without exposing connection strings", () => {
  const auth = Object.assign(new Error("authentication failed: mongodb://user:secret@private.example/db"), { code: 18 });
  const authResult = mongoDatabaseLinkFailure(auth);
  assert.equal(authResult.code, "MONGODB_AUTH_FAILED");
  assert.doesNotMatch(JSON.stringify(authResult), /secret|private\.example/);
  assert.equal(mongoDatabaseLinkFailure(new Error("querySrv ENOTFOUND private-cluster.example")).code, "MONGODB_DNS_FAILED");
  assert.equal(mongoDatabaseLinkFailure(new Error("MongoServerSelectionError: Server selection timed out")).code, "MONGODB_NETWORK_UNREACHABLE");
  assert.equal(mongoDatabaseLinkFailure(new Error("certificate verify failed")).code, "MONGODB_TLS_FAILED");
  assert.equal(mongoDatabaseLinkFailure(new Error("unknown error")).code, "MONGODB_CONNECTION_FAILED");
  assert.equal(mongoDatabaseLinkFailure(new Error("write failed"), "save").code, "DATABASE_LINK_SAVE_FAILED");
});

test("catalog preview theme distinguishes template variants without generating a project", () => {
  assert.notEqual(templatePreviewTheme({ id: "cluny" }, 0), templatePreviewTheme({ id: "blackrose" }, 1));
  assert.notEqual(templatePreviewTheme({ id: "tasali" }, 2), templatePreviewTheme({ id: "chef-palace" }, 3));
});