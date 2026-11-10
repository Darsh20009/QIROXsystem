import assert from "node:assert/strict";
import { test } from "node:test";
import { decryptMailPassword, encryptMailPassword, isEncryptedMailPassword } from "./mail-account-crypto";

test("encrypts mailbox passwords and round-trips without exposing the input", () => {
  const previousKey = process.env.MAIL_ACCOUNT_ENCRYPTION_KEY;
  const previousSessionSecret = process.env.SESSION_SECRET;
  process.env.MAIL_ACCOUNT_ENCRYPTION_KEY = "test-only-mail-encryption-key";

  try {
    const encrypted = encryptMailPassword("mailbox-password-test-only");
    assert.ok(isEncryptedMailPassword(encrypted));
    assert.notEqual(encrypted, "mailbox-password-test-only");
    assert.equal(decryptMailPassword(encrypted), "mailbox-password-test-only");
    assert.equal(encryptMailPassword(encrypted), encrypted);
  } finally {
    if (previousKey === undefined) delete process.env.MAIL_ACCOUNT_ENCRYPTION_KEY;
    else process.env.MAIL_ACCOUNT_ENCRYPTION_KEY = previousKey;
    if (previousSessionSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = previousSessionSecret;
  }
});
