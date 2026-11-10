import test from "node:test";
import assert from "node:assert/strict";
import { connManager } from "./connection-manager";
import { baseTemplate } from "./email";

test("transactional email branding uses the current QIROX icon and wordmark", () => {
  const previous = connManager.emailSettings;

  try {
    connManager.setEmailSettings({
      siteUrl: "https://qiroxstudio.online/",
      logoUrl: "https://raw.githubusercontent.com/QIROXsystem/main/logo.png",
    });

    const html = baseTemplate("<p>Test message</p>");

    assert.match(html, /https:\/\/qiroxstudio\.online\/qirox-icon-nobg\.png/);
    assert.match(html, /QIROX/);
    assert.match(html, /STUDIO&nbsp;&nbsp;\|&nbsp;&nbsp;DIGITAL SYSTEMS/);
    assert.doesNotMatch(html, /raw\.githubusercontent\.com\/QIROXsystem\/main\/logo\.png/);
  } finally {
    connManager.setEmailSettings(previous);
  }
});
