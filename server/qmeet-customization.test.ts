import assert from "node:assert/strict";
import test from "node:test";
import { normalizeQMeetCustomization } from "./qmeet-customization";
test("QMeet customization is bounded and exact-origin scoped", () => {
  const config = normalizeQMeetCustomization({ brandName: "School", accentColor: "#123456", allowedOrigins: ["https://school.example/"], features: { chat: false } });
  assert.equal(config.brandName, "School");
  assert.deepEqual(config.allowedOrigins, ["https://school.example"]);
  assert.equal(config.features.chat, false);
  assert.equal(config.features.annotations, true);
  for (const origin of ["*", "https://school.example/other", "https://user:password@school.example", "javascript:alert(1)", "http://school.example"]) {
    assert.throws(() => normalizeQMeetCustomization({ allowedOrigins: [origin] }));
  }
  assert.throws(() => normalizeQMeetCustomization({ logoUrl: "javascript:alert(1)" }));
  assert.throws(() => normalizeQMeetCustomization({ accentColor: "red;background:url(x)" }));
  assert.throws(() => normalizeQMeetCustomization({ features: { chat: "false" } }));
});