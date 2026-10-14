import test from "node:test";
import assert from "node:assert/strict";
import { sandboxPreviewCookie } from "./sandbox-preview-cookie";

test("preview grant is read from raw headers without cookie-parser", () => {
  assert.equal(sandboxPreviewCookie("session=other; qirox_preview_abc=signed%3Agrant; x=1", "abc"), "signed:grant");
  assert.equal(sandboxPreviewCookie("qirox_preview_other=foreign", "abc"), "");
  assert.equal(sandboxPreviewCookie(undefined, "abc"), "");
  assert.equal(sandboxPreviewCookie("qirox_preview_abc=%malformed", "abc"), "");
});