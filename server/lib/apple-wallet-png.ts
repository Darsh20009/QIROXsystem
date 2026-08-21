import { deflateRawSync } from "zlib";

/**
 * Creates a minimal valid RGBA PNG without native image dependencies.
 * This is used only as an Apple Wallet asset fallback when sharp is unavailable.
 */
export function createSolidPng(
  width: number,
  height: number,
  red = 10,
  green = 10,
  blue = 22,
  alpha = 255,
): Buffer {
  const row = Buffer.alloc(1 + width * 4);
  row[0] = 0;
  for (let x = 0; x < width; x++) {
    row[1 + x * 4] = red;
    row[2 + x * 4] = green;
    row[3 + x * 4] = blue;
    row[4 + x * 4] = alpha;
  }

  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  const compressed = deflateRawSync(raw);
  let s1 = 1;
  let s2 = 0;
  for (const byte of raw) {
    s1 = (s1 + byte) % 65521;
    s2 = (s2 + s1) % 65521;
  }

  // Do not use a signed JavaScript bitwise result here. writeUInt32BE requires
  // an unsigned value and images with a high Adler-32 bit previously crashed.
  const adler32 = s2 * 0x10000 + s1;
  const zlibData = Buffer.alloc(2 + compressed.length + 4);
  zlibData[0] = 0x78;
  zlibData[1] = 0x9c;
  compressed.copy(zlibData, 2);
  zlibData.writeUInt32BE(adler32, 2 + compressed.length);

  const crc32 = (buffer: Buffer): number => {
    let crc = 0xffffffff;
    const table: number[] = [];
    for (let n = 0; n < 256; n++) {
      let value = n;
      for (let bit = 0; bit < 8; bit++) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
      table[n] = value;
    }
    for (const byte of buffer) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  };

  const chunk = (type: string, data: Buffer): Buffer => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const typeBuffer = Buffer.from(type, "ascii");
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
    return Buffer.concat([length, typeBuffer, data, checksum]);
  };

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", zlibData),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}