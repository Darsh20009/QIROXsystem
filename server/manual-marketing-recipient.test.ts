import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { waModule } from "./whatsapp-module";

const state = waModule as any;
const originalSocket = state.sock;
const originalStatus = state.status;

afterEach(() => {
  state.sock = originalSocket;
  state.status = originalStatus;
});

test("manual-marketing recipient check accepts registered WhatsApp numbers", async () => {
  let checkedPhone = "";
  state.status = "connected";
  state.sock = {
    onWhatsApp: async (phone: string) => {
      checkedPhone = phone;
      return [{ jid: `${phone}@s.whatsapp.net`, exists: true }];
    },
  };

  assert.equal(await waModule.hasWhatsAppAccount("+966 50 123 4567"), true);
  assert.equal(checkedPhone, "966501234567");
});

test("manual-marketing recipient check rejects numbers without WhatsApp", async () => {
  state.status = "connected";
  state.sock = { onWhatsApp: async () => [] };

  assert.equal(await waModule.hasWhatsAppAccount("966501234567"), false);
});

test("manual-marketing recipient check fails closed when WhatsApp cannot verify", async () => {
  state.status = "connected";
  state.sock = { onWhatsApp: async () => undefined };

  await assert.rejects(
    waModule.hasWhatsAppAccount("966501234567"),
    /تعذر التحقق/,
  );
});
