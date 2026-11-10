import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMailWhatsAppSummary, recipientIds, whatsappAlertTargets } from "./mail-monitor";

test("employee mailbox alerts route only to explicitly assigned employees", () => {
  const account = {
    accountType: "employee",
    assignedUserId: "employee-1",
    assignedUserIds: ["employee-2", "employee-1"],
  };
  assert.deepEqual(
    recipientIds(account, new Map()),
    ["employee-1", "employee-2"],
  );
});

test("WhatsApp targets require an assigned user's explicit WhatsApp number", () => {
  const account = {
    accountType: "employee",
    assignedUserId: "employee-1",
    assignedUserIds: ["employee-2"],
  };
  const users = new Map<string, any>([
    ["employee-1", { _id: "employee-1", whatsappNumber: "00966551234567", phone: "0550000000" }],
    ["employee-2", { _id: "employee-2", whatsappNumber: "", phone: "0551111111" }],
  ]);
  assert.deepEqual(
    whatsappAlertTargets(account, users),
    [{ key: "user:employee-1", phone: "966551234567" }],
  );
});

test("WhatsApp email alerts include only metadata and a protected inbox link", () => {
  const summary = buildMailWhatsAppSummary(
    { emailAddress: "sohila@qirox.online" },
    { from: "sender@example.com", subject: "Project update", text: "private body", attachments: [{ filename: "private.pdf" }] },
  );
  assert.match(summary, /sender@example\.com/);
  assert.match(summary, /Project update/);
  assert.match(summary, /\/employee\/mail/);
  assert.doesNotMatch(summary, /private body|private\.pdf/);
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
