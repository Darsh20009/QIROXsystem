(function () {
  "use strict";
  const source = document.currentScript && document.currentScript.src;
  const defaultServer = source ? new URL(source).origin : location.origin;
  window.QMeet = {
    version: "1.0.0",
    mount: function (container, options) {
      options = options || {};
      const root = typeof container === "string" ? document.querySelector(container) : container;
      if (!root) throw new Error("QMeet container not found");
      if (!/^[a-zA-Z0-9_-]{1,100}$/.test(options.roomName || "")) throw new Error("Valid roomName required");
      const server = new URL(options.serverUrl || defaultServer);
      if (server.protocol !== "https:") throw new Error("QMeet requires HTTPS");
      const wrapper = document.createElement("div");
      wrapper.style.cssText = "display:flex;flex-direction:column;height:100%;min-height:500px";
      const frame = document.createElement("iframe");
      frame.src = server.origin + "/meet/" + encodeURIComponent(options.roomName) + "?embed=1";
      frame.title = options.title || "QMeet";
      frame.allow = "camera; microphone; display-capture; fullscreen; picture-in-picture";
      frame.style.cssText = "width:100%;flex:1;min-height:450px;border:0";
      wrapper.appendChild(frame); root.appendChild(wrapper);
      const handlers = new Map();
      const commands = new Set(["toggleCamera", "toggleMicrophone", "toggleScreenShare", "openAnnotations", "leave"]);
      const instance = {
        iframe: frame,
        command: function (name) {
          if (!commands.has(name)) throw new Error("Unsupported QMeet command");
          frame.contentWindow.postMessage({ type: "qmeet:command", roomName: options.roomName, command: name }, server.origin);
        },
        on: function (event, handler) {
          if (typeof handler !== "function") throw new Error("Event handler required");
          if (!handlers.has(event)) handlers.set(event, new Set());
          handlers.get(event).add(handler);
          return function () { handlers.get(event)?.delete(handler); };
        },
        addPlugin: function (plugin) {
          if (!plugin || typeof plugin.onClick !== "function") throw new Error("Plugin needs an onClick function");
          let bar = wrapper.querySelector("[data-qmeet-plugins]");
          if (!bar) {
            bar = document.createElement("div"); bar.setAttribute("data-qmeet-plugins", "");
            bar.style.cssText = "display:flex;gap:8px;padding:10px;background:#202124";
            wrapper.appendChild(bar);
          }
          const button = document.createElement("button");
          button.type = "button"; button.textContent = String(plugin.label || plugin.id || "Plugin").slice(0, 80);
          button.style.cssText = "padding:8px 14px;border:0;border-radius:8px;background:#14b8a6;color:#062c2a;cursor:pointer";
          button.onclick = function () { plugin.onClick(instance); };
          bar.appendChild(button);
          return function () { button.remove(); };
        },
        destroy: function () { window.removeEventListener("message", receive); handlers.clear(); wrapper.remove(); },
      };
      function receive(event) {
        if (event.origin !== server.origin || event.source !== frame.contentWindow) return;
        const message = event.data;
        if (!message || message.type !== "qmeet:event" || message.roomName !== options.roomName) return;
        handlers.get(message.event)?.forEach(function (handler) { handler(message.data || {}); });
      }
      window.addEventListener("message", receive);
      (options.plugins || []).forEach(instance.addPlugin);
      return instance;
    },
  };
})();