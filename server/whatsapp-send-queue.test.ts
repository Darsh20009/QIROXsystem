import assert from "node:assert/strict";
import { test } from "node:test";
import { SerializedSendQueue } from "./whatsapp-send-queue";

test("serializes sends and enforces the minimum gap after completion", async () => {
  const queue = new SerializedSendQueue(25);
  let active = 0;
  let maxActive = 0;
  let firstCompletedAt = 0;
  let secondStartedAt = 0;

  await Promise.all([
    queue.enqueue(async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise(resolve => setTimeout(resolve, 10));
      firstCompletedAt = Date.now();
      active--;
    }),
    queue.enqueue(async () => {
      secondStartedAt = Date.now();
      active++;
      maxActive = Math.max(maxActive, active);
      active--;
    }),
  ]);

  assert.equal(maxActive, 1);
  assert.ok(secondStartedAt - firstCompletedAt >= 20);
});

test("continues processing after a failed send", async () => {
  const queue = new SerializedSendQueue(0);
  await assert.rejects(queue.enqueue(async () => {
    throw new Error("send failed");
  }), /send failed/);

  assert.equal(await queue.enqueue(async () => "sent"), "sent");
});
