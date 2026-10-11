import assert from "node:assert/strict";
import test from "node:test";
import {
  isPublicMediaAddress,
  normalizeWhatsAppAttachments,
  whatsAppMediaKind,
} from "./whatsapp-media";

test("WhatsApp attachment API accepts only public HTTPS URLs", () => {
  assert.deepEqual(
    normalizeWhatsAppAttachments([{ url: "https://cdn.example.com/file.pdf", filename: "invoice.pdf" }]),
    [{ url: "https://cdn.example.com/file.pdf", filename: "invoice.pdf" }],
  );
  for (const url of [
    "http://cdn.example.com/file.pdf",
    "https://localhost/file.pdf",
    "https://127.0.0.1/file.pdf",
    "https://192.168.1.1/file.pdf",
    "https://[::1]/file.pdf",
  ]) {
    assert.throws(() => normalizeWhatsAppAttachments([{ url }]));
  }
});

test("WhatsApp attachments are bounded and captions are limited", () => {
  assert.throws(() => normalizeWhatsAppAttachments(Array.from({ length: 6 }, () => ({ url: "https://cdn.example.com/a" }))));
  assert.throws(() => normalizeWhatsAppAttachments([{ url: "https://cdn.example.com/a", caption: "x".repeat(1001) }]));
});

test("media MIME types map to WhatsApp image, video, audio, or document sends", () => {
  assert.equal(whatsAppMediaKind("image/png"), "image");
  assert.equal(whatsAppMediaKind("video/mp4"), "video");
  assert.equal(whatsAppMediaKind("audio/ogg; codecs=opus"), "audio");
  assert.equal(whatsAppMediaKind("application/pdf"), "document");
});

test("public address filter rejects reserved and private IPv4/IPv6 addresses", () => {
  for (const address of ["0.0.0.0", "10.0.0.1", "127.0.0.1", "169.254.1.1", "172.16.0.1", "192.168.1.1", "::1", "fc00::1", "fe80::1", "::ffff:127.0.0.1"]) {
    assert.equal(isPublicMediaAddress(address), false, address);
  }
  assert.equal(isPublicMediaAddress("8.8.8.8"), true);
  assert.equal(isPublicMediaAddress("2606:4700:4700::1111"), true);
});
