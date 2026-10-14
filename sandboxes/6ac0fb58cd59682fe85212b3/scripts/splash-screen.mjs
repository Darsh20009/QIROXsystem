export function normalizeSplashSettings(config = {}) {
  return {
    splashEnabled: config.splashEnabled === true,
    splashImageUrl: typeof config.splashImageUrl === "string" ? config.splashImageUrl.trim().slice(0, 1000) : "",
    splashBackgroundColor: /^#[0-9a-f]{6}$/i.test(config.splashBackgroundColor || "") ? config.splashBackgroundColor : "#ffffff",
    splashImageFit: config.splashImageFit === "cover" ? "cover" : "contain",
    splashDurationMs: typeof config.splashDurationMs === "number" && Number.isFinite(config.splashDurationMs) ? Math.max(0, Math.min(6000, Math.round(config.splashDurationMs))) : 1500,
    splashTitle: typeof config.splashTitle === "string" ? config.splashTitle.trim().slice(0, 180) : "",
    splashSubtitle: typeof config.splashSubtitle === "string" ? config.splashSubtitle.trim().slice(0, 300) : "",
  };
}

/** The builder's illustrative iframe intentionally disallows scripts. */
export function splashPreviewMarkup(config = {}) {
  const settings = normalizeSplashSettings(config);
  if (!settings.splashEnabled) return "";
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const image = settings.splashImageUrl && (/^https:\/\//i.test(settings.splashImageUrl) || /^\/(?!\/)/.test(settings.splashImageUrl))
    ? `<img src="${escape(settings.splashImageUrl)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:${settings.splashImageFit}">` : "";
  return `<section aria-label="معاينة شاشة البداية" style="max-width:900px;margin:24px auto;padding:16px;border-radius:16px;background:white;color:#111827;font-family:system-ui">
  <p>شاشة البداية — معاينة ثابتة · ${settings.splashDurationMs / 1000} ثانية</p>
  <div style="position:relative;height:260px;border-radius:12px;overflow:hidden;background:${settings.splashBackgroundColor}">${image}
  ${settings.splashTitle || settings.splashSubtitle ? `<div style="position:absolute;bottom:16px;left:16px;right:16px;background:rgba(255,255,255,.88);padding:12px;border-radius:12px;text-align:center"><strong>${escape(settings.splashTitle)}</strong><p>${escape(settings.splashSubtitle)}</p></div>` : ""}
  </div></section>`;
}

/** Trusted script, untrusted text only enters textContent/src, never innerHTML. */
export function splashMarkup(config = {}) {
  const settings = normalizeSplashSettings(config);
  if (!settings.splashEnabled) return "";
  if (settings.splashImageUrl && !/^https:\/\//i.test(settings.splashImageUrl) && !/^\/(?!\/)/.test(settings.splashImageUrl)) return "";
  const json = JSON.stringify(settings).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  return `<!-- qirox-splash:start --><script>
(() => {
 const config = ${json};
 const screen = document.createElement("div");
 screen.id = "qirox-startup-splash";
 screen.setAttribute("role", "status"); screen.setAttribute("aria-label", "جاري فتح التطبيق");
 Object.assign(screen.style, {position:"fixed",inset:"0",zIndex:"2147483647",background:config.splashBackgroundColor,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif",color:"#111827",overflow:"hidden",transition:"opacity 180ms"});
 if(config.splashImageUrl) {
  const image = document.createElement("img"); image.src = config.splashImageUrl; image.alt = "";
  Object.assign(image.style, {position:"absolute",inset:"0",width:"100%",height:"100%",objectFit:config.splashImageFit});
  image.onerror = () => image.remove(); screen.appendChild(image);
 }
 if(config.splashTitle || config.splashSubtitle) {
  const text = document.createElement("div"); text.dir = "rtl";
  Object.assign(text.style,{position:"relative",padding:"20px",borderRadius:"16px",background:"rgba(255,255,255,.88)",textAlign:"center",maxWidth:"85%",marginTop:config.splashImageUrl?"auto":"0",marginBottom:"24px"});
  const title = document.createElement("strong"); title.textContent = config.splashTitle; title.style.fontSize = "24px";
  const subtitle = document.createElement("p"); subtitle.textContent = config.splashSubtitle;
  text.append(title,subtitle); screen.appendChild(text);
 }
 document.body.appendChild(screen);
 const started = Date.now(); let closed = false;
 const close = () => {
  if(closed) return; closed = true;
  document.removeEventListener("qirox:app-ready", close);
  setTimeout(() => { screen.style.opacity = "0"; setTimeout(() => screen.remove(),180); }, Math.max(0,config.splashDurationMs-(Date.now()-started)));
 };
 document.addEventListener("qirox:app-ready",close,{once:true});
 setTimeout(close,Math.max(8000,config.splashDurationMs));
})();
</script><!-- qirox-splash:end -->`;
}