import assert from "node:assert/strict";
import { test } from "node:test";
import { connManager } from "./connection-manager";
import { connectToDatabase } from "./db";

test("database bootstrap rejects a missing MongoDB URI before connecting", async () => {
  const previousUri = process.env.MONGODB_URI;
  const originalInit = connManager.initFromEnv;
  let connectionAttempted = false;

  try {
    delete process.env.MONGODB_URI;
    (connManager as any).initFromEnv = async () => {
      connectionAttempted = true;
    };

    await assert.rejects(
      connectToDatabase(),
      /MONGODB_URI must be set/,
    );
    assert.equal(connectionAttempted, false);
  } finally {
    (connManager as any).initFromEnv = originalInit;
    if (previousUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previousUri;
  }
});
