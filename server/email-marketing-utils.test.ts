import test from "node:test";
import assert from "node:assert/strict";
import { getEmailMarketingBaseUrl } from "./email-marketing-utils";

test("marketing tracking prefers the configured public site URL over the Replit dev domain", () => {
  assert.equal(
    getEmailMarketingBaseUrl({
      EMAIL_SITE_URL: "https://qiroxstudio.online",
      REPLIT_DEV_DOMAIN: "dev-example.replit.dev",
    }),
    "https://qiroxstudio.online",
  );
});

test("marketing tracking adds HTTPS to a configured site hostname", () => {
  assert.equal(
    getEmailMarketingBaseUrl({ EMAIL_SITE_URL: "mail.example.com" }),
    "https://mail.example.com",
  );
});

test("marketing tracking falls back to the Replit domain only when no public URL is configured", () => {
  assert.equal(
    getEmailMarketingBaseUrl({ REPLIT_DEV_DOMAIN: "dev-example.replit.dev" }),
    "https://dev-example.replit.dev",
  );
});

test("marketing tracking uses the canonical site when no URL is configured", () => {
  assert.equal(
    getEmailMarketingBaseUrl({}),
    "https://qiroxstudio.online",
  );
});
