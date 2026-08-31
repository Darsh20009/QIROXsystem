import assert from "node:assert/strict";
import test from "node:test";
import {
  canSaveGitHubVisibility,
  resetGitHubVisibilitySelection,
} from "./github-visibility-state";

test("switching from a public order cannot save before the private order loads", () => {
  const publicOrderState = {
    visibility: "public" as const,
    loadedOrderId: "public-order",
  };
  assert.equal(
    canSaveGitHubVisibility("public-order", publicOrderState.loadedOrderId, true, false),
    true,
  );

  const nextOrderState = resetGitHubVisibilitySelection();
  assert.equal(nextOrderState.visibility, "private");
  assert.equal(
    canSaveGitHubVisibility("private-order", nextOrderState.loadedOrderId, false, true),
    false,
  );
});