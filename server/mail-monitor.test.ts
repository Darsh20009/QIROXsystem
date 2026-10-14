import assert from "node:assert/strict";
import { test } from "node:test";
import { mailboxAlertRoles, recipientIds } from "./mail-monitor";

test("inbound system mailbox alerts never include the CTO", () => {
  for (const localPart of ["y.business", "info", "support", "hr", "marketing", "ceo"]) {
    const roles = mailboxAlertRoles({
      accountType: "system",
      emailAddress: `${localPart}@qirox.online`,
    });
    assert.equal(roles.includes("cto"), false, `${localPart} must not route to CTO`);
  }

  assert.deepEqual(
    mailboxAlertRoles({ accountType: "system", emailAddress: "support@qirox.online" }),
    ["ceo"],
  );
});

test("customer mailbox notifications are suppressed when the owner is the CTO", () => {
  const usersByRole = new Map<string, any[]>([
    ["cto", [{ _id: "cto-1" }]],
    ["ceo", [{ _id: "ceo-1" }]],
  ]);

  assert.deepEqual(
    recipientIds({ accountType: "customer", ownerUserId: "cto-1" }, usersByRole),
    [],
  );
  assert.deepEqual(
    recipientIds({ accountType: "customer", ownerUserId: "client-1" }, usersByRole),
    ["client-1"],
  );
});
