import { lookup } from "node:dns/promises";
import type { IncomingHttpHeaders } from "node:http";
import { isIP } from "node:net";
import https from "node:https";

export const MAX_WHATSAPP_ATTACHMENTS = 5;
export const MAX_WHATSAPP_MEDIA_BYTES = 20 * 1024 * 1024;
export const MAX_WHATSAPP_INLINE_MEDIA_BYTES = 16 * 1024 * 1024;

export interface WhatsAppMediaAttachment {
  url: string;
  filename?: string;
  caption?: string;
}

export interface DownloadedWhatsAppMedia {
  buffer: Buffer;
  mimeType: string;
  filename: string;
  kind: "image" | "video" | "audio" | "document";
  finalUrl: string;
}

function ipv4IsPrivate(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b, c] = parts;
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 192 && b === 88 && c === 99) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0 && c === 113);
}

export function isPublicMediaAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return !ipv4IsPrivate(address);
  if (version !== 6) return false;

  const normalized = address.toLowerCase();
  if (normalized.startsWith("::ffff:")) return false;
  if (normalized.startsWith("2001:db8:")) return false;
  return normalized !== "::" && normalized !== "::1" &&
    !normalized.startsWith("fc") && !normalized.startsWith("fd") &&
    !/^fe[89ab]/.test(normalized) && !normalized.startsWith("ff");
}

function validatePublicHttpsUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("رابط المرفق غير صالح");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443") ||
    !url.hostname ||
    url.hostname.endsWith(".") ||
    /(^|\.)((localhost|local|internal|test|invalid))$/i.test(url.hostname)
  ) {
    throw new Error("يجب أن يكون رابط المرفق HTTPS عاماً");
  }

  const host = url.hostname.replace(/^\[|\]$/g, "");
  const ipVersion = isIP(host);
  if (ipVersion && !isPublicMediaAddress(host)) {
    throw new Error("رابط المرفق لا يمكن أن يشير إلى شبكة داخلية");
  }
  url.hash = "";
  return url;
}

function cleanFilename(value: string): string {
  const leaf = value.replace(/\\/g, "/").split("/").pop() || "";
  return leaf.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 180);
}

export function normalizeWhatsAppAttachments(input: unknown): WhatsAppMediaAttachment[] {
  if (input === undefined || input === null) return [];
  const items = Array.isArray(input) ? input : [input];
  if (items.length > MAX_WHATSAPP_ATTACHMENTS) {
    throw new Error(`يسمح بإرسال ${MAX_WHATSAPP_ATTACHMENTS} مرفقات كحد أقصى في الطلب الواحد`);
  }

  return items.map((item: any) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("صيغة المرفق غير صحيحة");
    }
    const rawUrl = typeof item.url === "string" ? item.url.trim() : "";
    if (!rawUrl || rawUrl.length > 2048) throw new Error("رابط المرفق مطلوب ويجب ألا يتجاوز 2048 حرفاً");
    const url = validatePublicHttpsUrl(rawUrl);
    const filename = typeof item.filename === "string" ? cleanFilename(item.filename) : "";
    const caption = typeof item.caption === "string" ? item.caption.trim() : "";
    if (caption.length > 1000) throw new Error("يجب ألا يتجاوز وصف المرفق 1000 حرف");
    return {
      url: url.toString(),
      ...(filename ? { filename } : {}),
      ...(caption ? { caption } : {}),
    };
  });
}

export function whatsAppMediaKind(mimeType: string): DownloadedWhatsAppMedia["kind"] {
  const mime = mimeType.split(";")[0].trim().toLowerCase();
  if (["image/jpeg", "image/png", "image/webp"].includes(mime)) return "image";
  if (["video/mp4", "video/3gpp"].includes(mime)) return "video";
  if ([
    "audio/aac", "audio/mp4", "audio/mpeg", "audio/ogg", "audio/opus",
    "audio/wav", "audio/x-wav", "audio/webm",
  ].includes(mime)) return "audio";
  return "document";
}

function filenameFromResponse(url: URL, contentDisposition: string | undefined, hint?: string): string {
  if (hint) return cleanFilename(hint) || "attachment";
  const encoded = contentDisposition?.match(/filename\*=(?:UTF-8'')?([^;]+)/i)?.[1]?.trim();
  if (encoded) {
    try {
      const name = decodeURIComponent(encoded.replace(/^["']|["']$/g, ""));
      if (cleanFilename(name)) return cleanFilename(name);
    } catch {}
  }
  const plain = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
  if (plain && cleanFilename(plain)) return cleanFilename(plain);
  try {
    const name = cleanFilename(decodeURIComponent(url.pathname.split("/").pop() || ""));
    if (name) return name;
  } catch {}
  return "attachment";
}

async function requestPublicMedia(url: URL): Promise<{
  statusCode: number;
  headers: IncomingHttpHeaders;
  chunks: Buffer[];
  finalUrl: URL;
}> {
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const ipVersion = isIP(hostname);
  const records = ipVersion
    ? [{ address: hostname, family: ipVersion }]
    : await lookup(hostname, { all: true, verbatim: true });
  if (!records.length || records.some(record => !isPublicMediaAddress(record.address))) {
    throw new Error("رابط المرفق يشير إلى عنوان شبكة غير مسموح");
  }

  return await new Promise((resolve, reject) => {
    let settled = false;
    const finishError = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    const request = https.request(url, {
      method: "GET",
      headers: { Accept: "*/*", "User-Agent": "QIROX-WhatsApp-Media/1.0" },
      timeout: 15_000,
      lookup: ((_hostname: string, options: any, callback: any) => {
        if (options?.all) callback(null, records);
        else callback(null, records[0].address, records[0].family);
      }) as any,
    }, response => {
      const statusCode = response.statusCode || 0;
      const location = response.headers.location;
      if ([301, 302, 303, 307, 308].includes(statusCode) && location) {
        response.resume();
        if (!settled) {
          settled = true;
          resolve({ statusCode, headers: { location }, chunks: [], finalUrl: url });
        }
        return;
      }
      if (statusCode !== 200) {
        response.resume();
        finishError(new Error(`تعذر تحميل المرفق من المصدر (HTTP ${statusCode || "غير معروف"})`));
        return;
      }

      const contentLength = Number(response.headers["content-length"] || 0);
      const responseMimeType = String(response.headers["content-type"] || "application/octet-stream").split(";")[0].trim().toLowerCase();
      const inlineMedia = whatsAppMediaKind(responseMimeType) !== "document";
      const maxBytes = inlineMedia ? MAX_WHATSAPP_INLINE_MEDIA_BYTES : MAX_WHATSAPP_MEDIA_BYTES;
      if (contentLength > maxBytes) {
        response.destroy();
        finishError(new Error(`حجم المرفق يتجاوز الحد المسموح وهو ${inlineMedia ? "16" : "20"} ميجابايت`));
        return;
      }
      const chunks: Buffer[] = [];
      let bytes = 0;
      response.on("data", (chunk: Buffer | string) => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        bytes += buffer.length;
        if (bytes > maxBytes) {
          response.destroy(new Error(`حجم المرفق يتجاوز الحد المسموح وهو ${inlineMedia ? "16" : "20"} ميجابايت`));
          return;
        }
        chunks.push(buffer);
      });
      response.on("end", () => {
        if (settled) return;
        settled = true;
        resolve({ statusCode, headers: response.headers, chunks, finalUrl: url });
      });
      response.on("error", finishError);
    });
    request.on("timeout", () => request.destroy(new Error("انتهت مهلة تحميل المرفق")));
    request.on("error", finishError);
    request.end();
  });
}

export async function downloadWhatsAppMedia(
  attachment: WhatsAppMediaAttachment,
): Promise<DownloadedWhatsAppMedia> {
  let url = validatePublicHttpsUrl(attachment.url);
  let result: Awaited<ReturnType<typeof requestPublicMedia>> | undefined;

  for (let redirects = 0; redirects <= 3; redirects += 1) {
    result = await requestPublicMedia(url);
    const location = result.headers.location;
    if (!location) break;
    if (redirects === 3) throw new Error("مصدر المرفق أعاد تحويلات كثيرة");
    url = validatePublicHttpsUrl(new URL(location, url).toString());
  }
  if (!result || result.statusCode !== 200) throw new Error("تعذر تحميل المرفق من المصدر");

  const mimeType = String(result.headers["content-type"] || "application/octet-stream")
    .split(";")[0].trim().toLowerCase();
  const filename = filenameFromResponse(
    result.finalUrl,
    String(result.headers["content-disposition"] || ""),
    attachment.filename,
  );
  return {
    buffer: Buffer.concat(result.chunks),
    mimeType,
    filename,
    kind: whatsAppMediaKind(mimeType),
    finalUrl: result.finalUrl.toString(),
  };
}
