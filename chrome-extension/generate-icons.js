// Run with: node generate-icons.js
// Generates icons/icon16.png, icon48.png, icon128.png
// No external dependencies — uses only Node.js built-ins.

const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ── CRC32 ─────────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ── PNG Chunk builder ─────────────────────────────────────────────────────────
function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const lenBuf    = Buffer.alloc(4); lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf    = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

// ── Draw a rounded-rect icon (brand blue #0057FF with white shopping-bag glyph)
function buildPNG(size) {
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8]  = 8;  // bit depth
  ihdr[9]  = 2;  // colour type: RGB
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  // Brand colours
  const BG   = [0x00, 0x57, 0xFF]; // #0057FF
  const RING = [0xFF, 0xFF, 0xFF]; // white handle
  const BODY = [0xFF, 0xFF, 0xFF]; // white bag body

  // Helper: is pixel inside rounded rectangle?
  const radius = Math.round(size * 0.22);
  function inBg(x, y) {
    const cx = Math.min(Math.max(x, radius), size - 1 - radius);
    const cy = Math.min(Math.max(y, radius), size - 1 - radius);
    return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2 ||
           (x >= radius && x <= size - 1 - radius) ||
           (y >= radius && y <= size - 1 - radius);
  }

  // Simple shopping bag glyph (proportional to icon size)
  const bagTop    = Math.round(size * 0.35);
  const bagBot    = Math.round(size * 0.82);
  const bagLeft   = Math.round(size * 0.22);
  const bagRight  = Math.round(size * 0.78);
  const handleW   = Math.round(size * 0.14);
  const handleTop = Math.round(size * 0.18);
  const handleCx  = Math.round(size * 0.50);
  const handleRad = Math.round(size * 0.16);

  function inBag(x, y) {
    // Bag body
    if (x >= bagLeft && x <= bagRight && y >= bagTop && y <= bagBot) return BODY;
    // Rounded handle (arc at top)
    const dx = x - handleCx;
    const dy = y - (handleTop + handleRad);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist >= handleRad - handleW && dist <= handleRad + 1 && y <= handleTop + handleRad) return RING;
    return null;
  }

  // Build scanlines
  const scanlines = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3); // filter byte + RGB
    row[0] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      let rgb;
      if (!inBg(x, y)) {
        rgb = [0, 0, 0]; // transparent corners → render as white (extension shows on white bg)
        // actually make corners same as page background (white)
        rgb = [0xF6, 0xF8, 0xFC];
      } else {
        rgb = inBag(x, y) || BG;
      }
      row[1 + x * 3]     = rgb[0];
      row[1 + x * 3 + 1] = rgb[1];
      row[1 + x * 3 + 2] = rgb[2];
    }
    scanlines.push(row);
  }

  const raw        = Buffer.concat(scanlines);
  const compressed = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Generate ──────────────────────────────────────────────────────────────────
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

[16, 48, 128].forEach(size => {
  const buf  = buildPNG(size);
  const dest = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(dest, buf);
  console.log(`✓ icons/icon${size}.png  (${buf.length} bytes)`);
});

console.log('\nAll icons generated. Load the extension in Chrome:');
console.log('  chrome://extensions → Enable Developer Mode → Load Unpacked → select chrome-extension/');
