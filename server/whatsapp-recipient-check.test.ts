import test from "node:test";
import assert from "node:assert/strict";
import { verifyWhatsAppRecipient } from "./whatsapp-module";

test("WhatsApp preflight accepts a number confirmed by a live lookup", async () => {
  let queried = "";
  await verifyWhatsAppRecipient({
    onWhatsApp: async (jid: string) => {
      queried = jid;
      return [{ jid, exists: true }];
    },
  }, "966501234567");

  assert.equal(queried, "966501234567@s.whatsapp.net");
});

test("WhatsApp preflight rejects a number absent from WhatsApp", async () => {
  await assert.rejects(
    verifyWhatsAppRecipient({ onWhatsApp: async () => [] }, "966501234567"),
    (error: any) => error.code === "WHATSAPP_NOT_REGISTERED"
      && error.message.includes("العميل لا يملك حساب واتساب"),
  );
});

test("WhatsApp preflight fails closed when the live lookup is unavailable", async () => {
  await assert.rejects(
    verifyWhatsAppRecipient({ onWhatsApp: async () => undefined }, "966501234567"),
    (error: any) => error.code === "WHATSAPP_CHECK_FAILED"
      && error.message.includes("لم تُرسل الرسالة"),
  );
  await assert.rejects(
    verifyWhatsAppRecipient({ onWhatsApp: async () => { throw new Error("offline"); } }, "966501234567"),
    (error: any) => error.code === "WHATSAPP_CHECK_FAILED",
  );
});
