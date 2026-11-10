import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

test("SDK plugin callbacks, event filtering, commands and cleanup work without exposing an API key", () => {
  class Element {
    children: Element[] = []; parent: Element | null = null;
    style: any = {}; attrs: any = {}; onclick?: () => void;
    contentWindow: any = { postMessage: (...args: any[]) => messages.push(args) };
    setAttribute(key: string, value: string) { this.attrs[key] = value; }
    appendChild(child: Element) { child.parent = this; this.children.push(child); }
    querySelector() { return this.children.find(child => "data-qmeet-plugins" in child.attrs) || null; }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); }
  }
  const messages: any[] = [];
  const listeners = new Map<string, Function>();
  const root = new Element();
  const window: any = { addEventListener: (name: string, handler: Function) => listeners.set(name, handler),
    removeEventListener: (name: string) => listeners.delete(name) };
  const document = { currentScript: { src: "https://qmeet.example/qmeet-sdk.js" },
    createElement: () => new Element(), querySelector: () => root };
  vm.runInNewContext(readFileSync("client/public/qmeet-sdk.js", "utf8"), { window, document, URL, location: { origin: "https://school.example" } });
  const meeting = window.QMeet.mount("#meeting", { roomName: "qa-room" });
  let pluginClicks = 0;
  const remove = meeting.addPlugin({ label: "Notes", onClick: () => pluginClicks++ });
  const wrapper = root.children[0];
  wrapper.querySelector()!.children[0].onclick!();
  assert.equal(pluginClicks, 1);
  let updates = 0;
  meeting.on("state", () => updates++);
  const data = { type: "qmeet:event", roomName: "qa-room", event: "state", data: { joined: true } };
  listeners.get("message")!({ data, origin: "https://evil.example", source: meeting.iframe.contentWindow });
  listeners.get("message")!({ data, origin: "https://qmeet.example", source: {} });
  assert.equal(updates, 0);
  listeners.get("message")!({ data, origin: "https://qmeet.example", source: meeting.iframe.contentWindow });
  assert.equal(updates, 1);
  meeting.command("toggleCamera");
  assert.equal(messages[0][1], "https://qmeet.example");
  assert.equal(messages[0][0].command, "toggleCamera");
  assert.throws(() => meeting.command("makeHost"));
  remove(); assert.equal(wrapper.querySelector()!.children.length, 0);
  meeting.destroy(); assert.equal(root.children.length, 0); assert.equal(listeners.size, 0);
});