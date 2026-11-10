import assert from "node:assert/strict";
import test from "node:test";
import { isApprovedOrderForDraftPromotion } from "./routes";

test("draft promotion accepts only orders approved for payment or order status", () => {
  assert.equal(isApprovedOrderForDraftPromotion({ paymentStatus: "approved", status: "in_progress" }), true);
  assert.equal(isApprovedOrderForDraftPromotion({ paymentStatus: "pending", status: "approved" }), true);
  assert.equal(isApprovedOrderForDraftPromotion({ paymentStatus: "pending", status: "in_progress" }), false);
  assert.equal(isApprovedOrderForDraftPromotion(null), false);
});