import test from "node:test";
import assert from "node:assert/strict";
import { qmeetEmbedCommand } from "./qmeet-embed";
test("embed commands require joined state, exact parent origin/source and matching room", () => {
  const parent = {} as any;
  const event = { source: parent, origin: "https://school.example", data: { type: "qmeet:command", roomName: "room", command: "toggleCamera" } };
  const run = (value: any, joined = true) => qmeetEmbedCommand(value, parent, ["https://school.example"], "room", joined);
  assert.equal(run(event), "toggleCamera");
  assert.equal(run(event, false), null);
  assert.equal(run({ ...event, source: {} }), null);
  assert.equal(run({ ...event, origin: "https://school.example.evil.test" }), null);
  assert.equal(run({ ...event, data: { ...event.data, roomName: "other" } }), null);
  assert.equal(run({ ...event, data: { ...event.data, command: "makeHost" } }), null);
});