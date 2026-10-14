import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { normalizeSplashSettings, splashMarkup, splashPreviewMarkup } from "../../../services/saas-templates/runtime/splash-screen.mjs";
import { normalizeBuilderConfig } from "./routes";

test("splash settings are opt-in, bounded and escape inline scripts", () => {
  assert.equal(splashMarkup({}), "");
  assert.equal(normalizeBuilderConfig({}).splashEnabled, false);
  assert.equal(normalizeSplashSettings({ splashDurationMs: 100000 }).splashDurationMs, 6000);
  assert.equal(normalizeSplashSettings({ splashDurationMs: -1 }).splashDurationMs, 0);
  assert.equal(normalizeSplashSettings({ splashImageFit: "injected-css", splashBackgroundColor: "red;display:none" }).splashBackgroundColor, "#ffffff");
  assert.equal(splashMarkup({ splashEnabled: true, splashImageUrl: "javascript:alert(1)" }), "");
  const html = splashMarkup({ splashEnabled: true, splashTitle: '</script><script>alert("x")</script>' });
  assert.equal((html.match(/<script>/g) || []).length, 1);
  assert.ok(html.includes("\\u003c/script"));
  const preview = splashPreviewMarkup({ splashEnabled: true, splashTitle: "<script>bad</script>", splashImageUrl: "/tenant-splash.png" });
  assert.ok(preview.includes("tenant-splash.png"));
  assert.ok(preview.includes("&lt;script&gt;"));
  assert.ok(!preview.includes("<script>"));
});

test("the generated startup overlay uses configured image/fit and clears on app-ready or timeout", () => {
  const timers: Function[] = [];
  const events = new Map<string, Function>();
  const elements: any[] = [];
  const document = {
    createElement(tag: string) {
      const element: any = { tag, style: {}, children: [], removed: false, setAttribute() {}, appendChild(child: any) { this.children.push(child); },
        append(...children: any[]) { this.children.push(...children); }, remove() { this.removed = true; } };
      elements.push(element); return element;
    },
    body: { appendChild() {} },
    addEventListener(name: string, fn: Function) { events.set(name, fn); },
    removeEventListener(name: string) { events.delete(name); },
  };
  const html = splashMarkup({ splashEnabled: true, splashImageUrl: "/tenant-splash.png", splashImageFit: "cover", splashDurationMs: 0, splashTitle: "أهلاً" });
  const script = html.match(/<script>([\s\S]*?)<\/script>/)![1];
  vm.runInNewContext(script, { document, Date, setTimeout: (fn: Function) => timers.push(fn) });
  const screen = elements.find(item => item.id === "qirox-startup-splash");
  assert.ok(screen);
  assert.equal(elements.find(item => item.tag === "img").src, "/tenant-splash.png");
  assert.equal(elements.find(item => item.tag === "img").style.objectFit, "cover");
  events.get("qirox:app-ready")!();
  while (timers.length) timers.shift()!();
  assert.equal(screen.removed, true);
  assert.equal(events.size, 0);
  elements.length = 0;
  vm.runInNewContext(script, { document, Date, setTimeout: (fn: Function) => timers.push(fn) });
  while (timers.length) timers.shift()!();
  assert.equal(elements.find(item => item.id === "qirox-startup-splash").removed, true);
});