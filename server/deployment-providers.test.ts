import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRenderServiceResponse } from "./deployment-providers";

test("normalizes the current direct Render create-service response", () => {
  const result = normalizeRenderServiceResponse({
    id: "srv_direct",
    deployId: "dep_direct",
    serviceDetails: { url: "https://direct.onrender.com" },
  });
  assert.deepEqual(result, {
    providerServiceId: "srv_direct",
    providerDeploymentId: "dep_direct",
    domain: "direct.onrender.com",
  });
});

test("normalizes the legacy wrapped Render create-service response", () => {
  const result = normalizeRenderServiceResponse({
    deployId: "dep_wrapped",
    service: {
      id: "srv_wrapped",
      serviceDetails: { url: "https://wrapped.onrender.com" },
    },
  });
  assert.deepEqual(result, {
    providerServiceId: "srv_wrapped",
    providerDeploymentId: "dep_wrapped",
    domain: "wrapped.onrender.com",
  });
});

test("rejects a Render response without a resource identifier", () => {
  assert.throws(() => normalizeRenderServiceResponse({ serviceDetails: {} }), /معرف الخدمة/);
});