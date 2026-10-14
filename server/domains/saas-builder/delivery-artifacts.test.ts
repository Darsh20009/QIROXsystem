import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createPreparedArtifact, getPreparedArtifact, removePreparedArtifact } from "./delivery-artifacts";

async function createSourceTree() {
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "saas-delivery-test-"));
  await fs.mkdir(path.join(outputDir, "client"), { recursive: true });
  await fs.writeFile(path.join(outputDir, "package.json"), '{"name":"safe-template"}');
  await fs.writeFile(path.join(outputDir, "client", "index.html"), "<main>ready</main>");
  return outputDir;
}

test("prepared ZIPs are safe, scoped to their order, and replace the previous project artifact", async () => {
  const outputDir = await createSourceTree();
  let firstId = "";
  let secondId = "";
  try {
    const common = {
      orderId: "order-1",
      projectId: "project-1",
      templateId: "cluny",
      tier: "lite",
      configFingerprint: "fingerprint-1",
      generated: {
        buildCommand: "npm run build",
        startCommand: "npm start",
        envVars: [],
        warnings: [],
        fileCount: 2,
      },
    };
    const first = await createPreparedArtifact({ ...common, outputDir });
    firstId = first.artifactId;
    const firstRecord = await getPreparedArtifact(firstId, "project-1", "order-1");
    assert.ok(firstRecord);
    assert.equal(firstRecord.generated.fileCount, 2);
    assert.equal(await getPreparedArtifact(firstId, "another-project", "order-1"), null);
    const firstZip = await fs.readFile(firstRecord.zipPath);
    assert.equal(firstZip.readUInt32LE(0), 0x04034b50);
    assert.ok(firstZip.includes(Buffer.from("client/index.html")));

    const secondSource = await createSourceTree();
    const second = await createPreparedArtifact({ ...common, outputDir: secondSource, configFingerprint: "fingerprint-2" });
    secondId = second.artifactId;

    assert.equal(await getPreparedArtifact(firstId, "project-1", "order-1"), null);
    assert.ok(await getPreparedArtifact(secondId, "project-1", "order-1"));
  } finally {
    if (firstId) await removePreparedArtifact(firstId);
    if (secondId) await removePreparedArtifact(secondId);
    await fs.rm(outputDir, { recursive: true, force: true });
  }
});

test("prepared ZIP creation rejects environment files", async () => {
  const outputDir = await createSourceTree();
  await fs.writeFile(path.join(outputDir, ".env"), "SESSION_SECRET=not-for-source");
  try {
    await assert.rejects(
      createPreparedArtifact({
        orderId: "order-2",
        projectId: "project-2",
        outputDir,
        templateId: "cluny",
        tier: "lite",
        configFingerprint: "fingerprint",
        generated: { buildCommand: "", startCommand: "", envVars: [], warnings: [], fileCount: 3 },
      }),
      /prohibited secret file/i,
    );
  } finally {
    await fs.rm(outputDir, { recursive: true, force: true });
  }
});