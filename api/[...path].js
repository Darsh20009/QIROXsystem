/**
 * Vercel's same-origin bridge to the long-running Render service.
 *
 * The React application always calls /api/*.  This function keeps those calls
 * on the Vercel hostname while forwarding them to Render, including session
 * cookies, OAuth redirects, Apple POST callbacks, and multipart uploads.
 *
 * Configure RENDER_BACKEND_URL in Vercel to the HTTPS URL of the Render web
 * service (without a trailing slash). It is deliberately an environment
 * variable so no deployment URL is hard-coded in source control.
 */

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 60,
};

function getBackendUrl(req) {
  const baseUrl = process.env.RENDER_BACKEND_URL;
  if (!baseUrl) {
    return null;
  }

  const normalizedBase = baseUrl.replace(/\/+$/, "");
  return new URL(req.url || "/api", `${normalizedBase}/`).toString();
}

async function readRequestBody(req) {
  if (req.method === "GET" || req.method === "HEAD") {
    return undefined;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  const upstreamUrl = getBackendUrl(req);
  if (!upstreamUrl) {
    res.status(503).json({
      error: "Backend is not configured",
      code: "RENDER_BACKEND_URL_MISSING",
    });
    return;
  }

  try {
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
      const normalizedName = name.toLowerCase();
      if (
        typeof value === "undefined" ||
        normalizedName === "host" ||
        normalizedName === "content-length" ||
        HOP_BY_HOP_HEADERS.has(normalizedName)
      ) {
        continue;
      }
      headers.set(name, Array.isArray(value) ? value.join(", ") : value);
    }

    // Avoid ambiguity caused by fetch transparently decompressing an upstream
    // response while preserving its original Content-Encoding header.
    headers.set("accept-encoding", "identity");
    headers.set("x-forwarded-host", req.headers.host || "");
    headers.set("x-forwarded-proto", "https");

    const clientIp = req.headers["x-forwarded-for"];
    if (clientIp) {
      headers.set("x-forwarded-for", Array.isArray(clientIp) ? clientIp.join(", ") : clientIp);
    }

    const response = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body: await readRequestBody(req),
      redirect: "manual",
    });

    for (const [name, value] of response.headers.entries()) {
      const normalizedName = name.toLowerCase();
      if (
        normalizedName === "set-cookie" ||
        normalizedName === "content-length" ||
        HOP_BY_HOP_HEADERS.has(normalizedName)
      ) {
        continue;
      }
      res.setHeader(name, value);
    }

    const cookies = typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];
    if (cookies.length > 0) {
      res.setHeader("set-cookie", cookies);
    }

    const responseBody = Buffer.from(await response.arrayBuffer());
    res.status(response.status).send(responseBody);
  } catch (error) {
    console.error("Render backend proxy failed", error);
    res.status(502).json({
      error: "Backend service is unavailable",
      code: "RENDER_BACKEND_UNAVAILABLE",
    });
  }
}