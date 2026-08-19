import { useEffect } from "react";

interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  jsonLd?: object | object[];
}

const BASE_URL = "https://qiroxstudio.online";
const DEFAULT_TITLE = "كيروكس | Qirox Studio — شركة برمجة مواقع وأنظمة في الرياض";
const DEFAULT_DESC = "كيروكس استوديو — شركة برمجة سعودية في الرياض. نبني مواقع إلكترونية احترافية، تطبيقات جوال، وأنظمة إدارة مخصصة للمطاعم والمتاجر والشركات. أسعار تنافسية وتسليم سريع.";
const DEFAULT_KEYWORDS = "كيروكس, كيروكس استوديو, Qirox, Qirox Studio, شركة برمجة الرياض, بناء مواقع الكترونية, تطوير مواقع السعودية";

function setMeta(selector: string, attr: string, value: string) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

function ensureMeta(property: string, isProperty = false) {
  const attr = isProperty ? "property" : "name";
  const selector = `meta[${attr}="${property}"]`;
  if (!document.querySelector(selector)) {
    const meta = document.createElement("meta");
    meta.setAttribute(attr, property);
    document.head.appendChild(meta);
  }
}

export function useSEO(config: SEOConfig) {
  const configKey = JSON.stringify(config);

  useEffect(() => {
    const prevTitle = document.title;
    const prevDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") || DEFAULT_DESC;
    const prevKeywords = document.querySelector('meta[name="keywords"]')?.getAttribute("content") || DEFAULT_KEYWORDS;

    document.title = config.title;

    ensureMeta("description");
    setMeta('meta[name="description"]', "content", config.description);

    if (config.keywords) {
      ensureMeta("keywords");
      setMeta('meta[name="keywords"]', "content", config.keywords);
    }

    if (config.canonical) {
      const canonicalEl = document.querySelector('link[rel="canonical"]');
      if (canonicalEl) canonicalEl.setAttribute("href", BASE_URL + config.canonical);
      ensureMeta("og:url", true);
      setMeta('meta[property="og:url"]', "content", BASE_URL + config.canonical);
    }

    if (config.ogType) {
      ensureMeta("og:type", true);
      setMeta('meta[property="og:type"]', "content", config.ogType);
    }

    ensureMeta("og:title", true);
    ensureMeta("og:description", true);
    ensureMeta("twitter:title");
    ensureMeta("twitter:description");

    setMeta('meta[property="og:title"]', "content", config.ogTitle || config.title);
    setMeta('meta[property="og:description"]', "content", config.ogDescription || config.description);
    setMeta('meta[name="twitter:title"]', "content", config.ogTitle || config.title);
    setMeta('meta[name="twitter:description"]', "content", config.ogDescription || config.description);

    if (config.ogImage) {
      ensureMeta("og:image", true);
      ensureMeta("twitter:image");
      setMeta('meta[property="og:image"]', "content", config.ogImage);
      setMeta('meta[name="twitter:image"]', "content", config.ogImage);
    }

    const injectedIds: string[] = [];
    const schemas = config.jsonLd
      ? Array.isArray(config.jsonLd) ? config.jsonLd : [config.jsonLd]
      : [];

    schemas.forEach((schema, i) => {
      const id = `seo-dynamic-schema-${i}`;
      const existing = document.getElementById(id);
      if (existing) existing.remove();
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = id;
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
      injectedIds.push(id);
    });

    return () => {
      document.title = prevTitle || DEFAULT_TITLE;
      const descEl = document.querySelector('meta[name="description"]');
      if (descEl) descEl.setAttribute("content", prevDesc);
      const kwEl = document.querySelector('meta[name="keywords"]');
      if (kwEl) kwEl.setAttribute("content", prevKeywords);
      injectedIds.forEach(id => document.getElementById(id)?.remove());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey]);
}
