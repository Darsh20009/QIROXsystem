import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const PREFIX = "qirox-mail:v1:";
const SALT = "qirox-mail-account-passwords-v1";

function encryptionKey(): Buffer {
  const configuredKey = process.env.MAIL_ACCOUNT_ENCRYPTION_KEY || process.env.SESSION_SECRET;
  if (!configuredKey) throw new Error("Mailbox password encryption requires MAIL_ACCOUNT_ENCRYPTION_KEY or SESSION_SECRET");
  return scryptSync(configuredKey, SALT, 32);
}

export function isEncryptedMailPassword(value: unknown): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

export function encryptMailPassword(value: string): string {
  if (!value || isEncryptedMailPassword(value)) return value;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${Buffer.concat([iv, tag, ciphertext]).toString("base64")}`;
}

export function decryptMailPassword(value: string): string {
  if (!value || !isEncryptedMailPassword(value)) return value;
  const payload = Buffer.from(value.slice(PREFIX.length), "base64");
  if (payload.length < 29) throw new Error("Invalid encrypted mailbox password");
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
