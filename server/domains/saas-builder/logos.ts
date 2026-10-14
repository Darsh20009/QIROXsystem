import crypto from "crypto";
import fs from "fs";
import path from "path";

const uploadRoot = path.join(process.cwd(), "uploads", "saas-logos");
const MAX_IMAGE_PIXELS = 16_000_000;

export type LogoResult = {
  logoUrl: string;
  logoOriginalUrl: string;
  processingStatus: "processed" | "fallback" | "unknown";
  warning?: string;
};

export async function extractLogoPalette(buffer: Buffer) {
  const sharpModule: any = await import("sharp");
  const sharp = sharpModule.default || sharpModule;
  const { data, info } = await sharp(buffer, { limitInputPixels: MAX_IMAGE_PIXELS })
    .rotate().resize(64, 64, { fit: "inside" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const buckets = new Map<string, { count: number; sum: number[] }>();
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i + 3] < 180) continue;
    const rgb = [data[i], data[i + 1], data[i + 2]];
    if (Math.min(...rgb) > 240) continue; // ignore the usual white logo background
    const key = rgb.map(value => Math.floor(value / 24)).join(":");
    const bucket = buckets.get(key) || { count: 0, sum: [0, 0, 0] };
    bucket.count++;
    rgb.forEach((value, index) => bucket.sum[index] += value);
    buckets.set(key, bucket);
  }
  const ranked = [...buckets.values()].sort((a, b) => b.count - a.count)
    .map(bucket => bucket.sum.map(value => Math.round(value / bucket.count)));
  const distinct: number[][] = [];
  for (const rgb of ranked) {
    if (distinct.every(other => Math.hypot(...rgb.map((v, i) => v - other[i])) > 65)) distinct.push(rgb);
    if (distinct.length === 5) break;
  }
  if (!distinct.length) throw invalidLogo("الصورة لا تحتوي ألوانًا واضحة؛ اختر ألوان الهوية يدويًا");
  const hex = (rgb: number[]) => `#${rgb.map(value => value.toString(16).padStart(2, "0")).join("")}`;
  const colors = distinct.map(hex);
  const primaryColor = colors[0];
  const secondaryColor = colors[1] || hex(distinct[0].map(value => Math.round(value * 0.5 + 128)));
  return { primaryColor, secondaryColor, colors };
}

function invalidLogo(message: string) {
  const error: any = new Error(message);
  error.status = 400;
  return error;
}

function detectImage(buffer: Buffer): { mime: string; extension: string } | null {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { mime: "image/png", extension: ".png" };
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", extension: ".jpg" };
  }
  if (buffer.length >= 6 && ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"))) {
    return { mime: "image/gif", extension: ".gif" };
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return { mime: "image/webp", extension: ".webp" };
  }
  return null;
}

function closeToBackground(data: Buffer, offset: number, color: [number, number, number], tolerance: number) {
  return Math.abs(data[offset] - color[0]) <= tolerance
    && Math.abs(data[offset + 1] - color[1]) <= tolerance
    && Math.abs(data[offset + 2] - color[2]) <= tolerance;
}

function dominantEdgeColor(data: Buffer, width: number, height: number): [number, number, number] {
  const counts = new Map<string, { count: number; color: [number, number, number] }>();
  const step = Math.max(1, Math.floor(Math.max(width, height) / 300));
  const sample = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    const color: [number, number, number] = [data[i], data[i + 1], data[i + 2]];
    const key = color.map((part) => Math.round(part / 24)).join(":");
    const entry = counts.get(key) || { count: 0, color, };
    entry.count += 1;
    counts.set(key, entry);
  };
  for (let x = 0; x < width; x += step) { sample(x, 0); if (height > 1) sample(x, height - 1); }
  for (let y = step; y < height - 1; y += step) { sample(0, y); if (width > 1) sample(width - 1, y); }
  return [...counts.values()].sort((a, b) => b.count - a.count)[0]?.color || [255, 255, 255];
}

async function removeConnectedFlatBackground(buffer: Buffer): Promise<Buffer> {
  const sharpModule: any = await import("sharp");
  const sharp = sharpModule.default || sharpModule;
  const { data, info } = await sharp(buffer, { limitInputPixels: MAX_IMAGE_PIXELS })
    .rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  if (!width || !height || width * height > MAX_IMAGE_PIXELS || channels !== 4) throw new Error("Unsupported image dimensions");
  const background = dominantEdgeColor(data, width, height);
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let read = 0;
  let write = 0;
  const enqueue = (pixel: number) => {
    if (!visited[pixel]) {
      const offset = pixel * 4;
      if (closeToBackground(data, offset, background, 34)) {
        visited[pixel] = 1;
        queue[write++] = pixel;
      }
    }
  };
  for (let x = 0; x < width; x++) { enqueue(x); enqueue((height - 1) * width + x); }
  for (let y = 1; y < height - 1; y++) { enqueue(y * width); enqueue(y * width + width - 1); }
  while (read < write) {
    const pixel = queue[read++];
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    data[pixel * 4 + 3] = 0;
    if (x) enqueue(pixel - 1);
    if (x + 1 < width) enqueue(pixel + 1);
    if (y) enqueue(pixel - width);
    if (y + 1 < height) enqueue(pixel + width);
  }
  return sharp(data, { raw: info }).png({ compressionLevel: 9 }).toBuffer();
}

export async function persistSaasLogo(buffer: Buffer, mimeType: string, removeBackground: boolean): Promise<LogoResult> {
  const detected = detectImage(buffer);
  if (!detected || detected.mime !== String(mimeType || "").toLowerCase()) {
    throw invalidLogo("صيغة الصورة غير مدعومة أو لا تطابق محتواها");
  }
  if (!buffer.length || buffer.length > 8 * 1024 * 1024) throw invalidLogo("حجم الشعار يتجاوز 8MB");
  const sharpModule: any = await import("sharp");
  const sharp = sharpModule.default || sharpModule;
  let metadata: any;
  try {
    metadata = await sharp(buffer, { limitInputPixels: MAX_IMAGE_PIXELS }).metadata();
  } catch {
    throw invalidLogo("تعذر قراءة صورة الشعار");
  }
  if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
    throw invalidLogo("أبعاد الشعار تتجاوز الحد المسموح");
  }

  await fs.promises.mkdir(uploadRoot, { recursive: true });
  const id = crypto.randomUUID();
  const originalUrl = `/uploads/saas-logos/${id}-original${detected.extension}`;
  const originalPath = path.join(uploadRoot, `${id}-original${detected.extension}`);
  await fs.promises.writeFile(originalPath, buffer, { flag: "wx" });
  if (!removeBackground) {
    return { logoUrl: originalUrl, logoOriginalUrl: originalUrl, processingStatus: "unknown" };
  }

  try {
    const processed = await removeConnectedFlatBackground(buffer);
    const processedName = `${id}.png`;
    await fs.promises.writeFile(path.join(uploadRoot, processedName), processed, { flag: "wx" });
    return {
      logoUrl: `/uploads/saas-logos/${processedName}`,
      logoOriginalUrl: originalUrl,
      processingStatus: "processed",
    };
  } catch {
    console.warn("[SaasBuilder] logo background removal failed; original retained");
    return {
      logoUrl: originalUrl,
      logoOriginalUrl: originalUrl,
      processingStatus: "fallback",
      warning: "تعذرت إزالة الخلفية بشكل آمن؛ تم استخدام الشعار الأصلي دون معالجة.",
    };
  }
}