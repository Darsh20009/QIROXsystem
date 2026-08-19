import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface PublicSettings {
  metaPixelId?: string;
  tiktokPixelId?: string;
  snapPixelId?: string;
  ga4Id?: string;
  gtmId?: string;
}

export default function PixelTracking() {
  const { data } = useQuery<PublicSettings>({ queryKey: ["/api/public/settings"] });

  useEffect(() => {
    if (!data) return;

    const { metaPixelId, tiktokPixelId, snapPixelId, ga4Id, gtmId } = data;

    // ── Meta (Facebook) Pixel ────────────────────────────────────────
    if (metaPixelId && !(window as any).fbq) {
      const s = document.createElement("script");
      s.innerHTML = `
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${metaPixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(s);
      const noscript = document.createElement("noscript");
      noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1"/>`;
      document.body?.appendChild(noscript);
    }

    // ── TikTok Pixel ──────────────────────────────────────────────────
    if (tiktokPixelId && !(window as any).ttq) {
      const s = document.createElement("script");
      s.innerHTML = `
        !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};ttq.load('${tiktokPixelId}');ttq.page();}(window,document,'ttq');
      `;
      document.head.appendChild(s);
    }

    // ── Snapchat Pixel ───────────────────────────────────────────────
    if (snapPixelId && !(window as any).snaptr) {
      const s = document.createElement("script");
      s.innerHTML = `
        (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';n=t.createElement(s);n.async=!0;n.src='https://sc-static.net/scevent.min.js';var r=t.getElementsByTagName(s)[0];r.parentNode.insertBefore(n,r);})(window,document);
        snaptr('init', '${snapPixelId}', {'user_email': ''});
        snaptr('track', 'PAGE_VIEW');
      `;
      document.head.appendChild(s);
    }

    // ── Google Analytics 4 (GA4) ─────────────────────────────────────
    if (ga4Id && !document.querySelector(`script[src*="${ga4Id}"]`)) {
      const s1 = document.createElement("script");
      s1.async = true;
      s1.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
      document.head.appendChild(s1);
      const s2 = document.createElement("script");
      s2.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}');`;
      document.head.appendChild(s2);
    }

    // ── Google Tag Manager (GTM) ─────────────────────────────────────
    if (gtmId && !document.querySelector(`script[src*="${gtmId}"]`)) {
      const s = document.createElement("script");
      s.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`;
      document.head.appendChild(s);
      const ns = document.createElement("noscript");
      ns.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
      document.body?.prepend(ns);
    }
  }, [data]);

  return null;
}
