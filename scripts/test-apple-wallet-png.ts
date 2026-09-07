import assert from "node:assert/strict";
import { inflateSync } from "node:zlib";
import { createSolidPng } from "../server/lib/apple-wallet-png";

function readChunks(png: Buffer) {
  assert.deepEqual(png.subarray(0, 8), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const chunks: Array<{ type: string; data: Buffer }> = [];
  let offset = 8;
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.subarray(offset + 4, offset + 8).toString("ascii");
    const data = png.subarray(offset + 8, offset + 8 + length);
    chunks.push({ type, data });
    offset += 12 + length;
  }
  return chunks;
}

// A large opaque image drives Adler-32's top bit high. The prior signed bitwise
// calculation threw before a Wallet pass could be created.
const width = 256;
const height = 256;
const png = createSolidPng(width, height, 255, 255, 255, 255);
const chunks = readChunks(png);
assert.equal(chunks[0].type, "IHDR");
assert.equal(chunks.at(-1)?.type, "IEND");
const raw = inflateSync(Buffer.concat(chunks.filter((chunk) => chunk.type === "IDAT").map((chunk) => chunk.data)));
assert.equal(raw.length, height * (1 + width * 4));
assert.equal(raw[0], 0);
assert.equal(raw[1], 255);
console.log("PASS: Apple Wallet PNG fallback is valid with an unsigned Adler-32 checksum.");