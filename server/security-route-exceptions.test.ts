import test from "node:test";
import assert from "node:assert/strict";
import { isBuilderDatabaseSetupRoute } from "./security-route-exceptions";
test("only the authenticated builder database POST route bypasses probe filtering", () => {
  const path = "/api/admin/orders/123456789012345678901234/saas-builder/database";
  assert.equal(isBuilderDatabaseSetupRoute("POST", path), true);
  for (const method of ["GET", "DELETE", "PATCH"]) assert.equal(isBuilderDatabaseSetupRoute(method, path), false);
  for (const other of ["/database", "/api/database", `${path}/dump`, path.replace("123456789012345678901234", "invalid"), `${path}/../backup`]) {
    assert.equal(isBuilderDatabaseSetupRoute("POST", other), false);
  }
});