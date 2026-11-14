import assert from "node:assert/strict";
import { test } from "node:test";
import { decryptMailAccount, decryptMailPassword, encryptMailPassword, isEncryptedMailPassword, isMailPasswordUsable } from "./mail-account-crypto";

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

test("mailbox credential status detects missing or unreadable passwords without exposing them", () => {
  const previousKey = process.env.MAIL_ACCOUNT_ENCRYPTION_KEY;
  const previousSessionSecret = process.env.SESSION_SECRET;
  process.env.MAIL_ACCOUNT_ENCRYPTION_KEY = "stable-test-key";

  try {
    const encrypted = encryptMailPassword("mailbox-password-test-only");
    assert.equal(isMailPasswordUsable(encrypted), true);
    assert.equal(isMailPasswordUsable("legacy-plaintext-password"), true);
    assert.equal(isMailPasswordUsable(""), false);
    assert.deepEqual(
      decryptMailAccount({ emailAddress: "mailbox@example.test", password: encrypted }),
      { emailAddress: "mailbox@example.test", password: "mailbox-password-test-only" },
    );

    process.env.MAIL_ACCOUNT_ENCRYPTION_KEY = "different-test-key";
    assert.equal(isMailPasswordUsable(encrypted), false);
    assert.throws(() => decryptMailAccount({ password: encrypted }));
  } finally {
    if (previousKey === undefined) delete process.env.MAIL_ACCOUNT_ENCRYPTION_KEY;
    else process.env.MAIL_ACCOUNT_ENCRYPTION_KEY = previousKey;
    if (previousSessionSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = previousSessionSecret;
  }
});
