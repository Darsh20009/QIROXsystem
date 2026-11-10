import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { rewriteSandboxPreviewPath } from "./sandbox-preview-path";

test("SaaS previews restore the Vite base path after Express mount stripping", () => {
  assert.equal(rewriteSandboxPreviewPath("/", "abc", true), "/sandbox/abc/preview/");
  assert.equal(rewriteSandboxPreviewPath("/assets/app.js?direct", "abc", true), "/sandbox/abc/preview/assets/app.js?direct");
  assert.equal(rewriteSandboxPreviewPath("/sandbox/abc/preview/src/main.tsx", "abc", true), "/sandbox/abc/preview/src/main.tsx");
});

test("standalone sandbox previews keep paths rooted at the project server", () => {
  assert.equal(rewriteSandboxPreviewPath("/", "abc", false), "/");
  assert.equal(rewriteSandboxPreviewPath("/assets/app.js?direct", "abc", false), "/assets/app.js?direct");
  assert.equal(rewriteSandboxPreviewPath("/sandbox/abc/preview/", "abc", false), "/");
});

test("Express-mounted SaaS preview forwards root and asset requests under Vite's base URL", async () => {
  const prefix = "/sandbox/abc/preview/";
  const upstream = express();
  upstream.use((req, res) => {
    if (req.path.startsWith(prefix)) {
      res.status(200).send(req.path);
      return;
    }
    if (req.path === "/" || req.path === "/index.html") {
      res.redirect(`${prefix}${req.url.slice(req.path.length)}`);
      return;
    }
    res.status(404).send("not found");
  });
  const upstreamServer = upstream.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => upstreamServer.once("listening", resolve));
  const upstreamPort = (upstreamServer.address() as { port: number }).port;

  const proxyApp = express();
  proxyApp.use("/sandbox/abc/preview", createProxyMiddleware({
    target: `http://127.0.0.1:${upstreamPort}`,
    pathRewrite: (requestPath) => rewriteSandboxPreviewPath(requestPath, "abc", true),
  }));
  const proxyServer = proxyApp.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => proxyServer.once("listening", resolve));
  const proxyPort = (proxyServer.address() as { port: number }).port;

  try {
    const page = await fetch(`http://127.0.0.1:${proxyPort}${prefix}?token=test`, { redirect: "manual" });
    assert.equal(page.status, 200);
    assert.equal(await page.text(), prefix);

    const asset = await fetch(`http://127.0.0.1:${proxyPort}${prefix}src/main.tsx`);
    assert.equal(asset.status, 200);
    assert.equal(await asset.text(), `${prefix}src/main.tsx`);
  } finally {
    await Promise.all([
      new Promise<void>((resolve, reject) => proxyServer.close((error) => error ? reject(error) : resolve())),
      new Promise<void>((resolve, reject) => upstreamServer.close((error) => error ? reject(error) : resolve())),
    ]);
  }
});