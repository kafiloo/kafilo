// =============================================================
// Script untuk generate PWA icons (PNG asli via base64)
// Jalankan: node scripts/generate-icons.js
// =============================================================

const fs = require("fs");
const path = require("path");

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const ICONS_DIR = path.join(__dirname, "..", "public", "icons");

// Minimal valid PNG 1x1 pixel (transparan) - base64 encoded
// Ini adalah PNG 1x1 pixel dengan warna solid navy (#1a1f36)
function createPngBase64(size) {
  // Buat PNG dari scratch menggunakan buffer minimal
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk (width, height, bit depth, color type)
  const width = Buffer.alloc(4);
  width.writeUInt32BE(size);
  const height = Buffer.alloc(4);
  height.writeUInt32BE(size);
  
  const ihdrData = Buffer.concat([width, height, Buffer.from([8, 2, 0, 0, 0])]); // 8-bit RGB
  const ihdrLength = Buffer.alloc(4);
  ihdrLength.writeUInt32BE(ihdrData.length);
  const ihdrType = Buffer.from("IHDR");
  
  const ihdrCrcData = Buffer.concat([ihdrType, ihdrData]);
  const ihdrCrc = Buffer.alloc(4);
  const crcTable = createCRCTable();
  ihdrCrc.writeUInt32BE(crc32(crcTable, ihdrCrcData));
  
  const ihdr = Buffer.concat([ihdrLength, ihdrType, ihdrData, ihdrCrc]);
  
  // IDAT chunk - compressed image data (minimal)
  // Filter byte (0 = None) + RGB for each pixel
  const rawData = Buffer.alloc(1 + size * 3); // filter byte + RGB
  rawData[0] = 0; // filter None
  // Fill with navy color #1a1f36
  for (let i = 0; i < size; i++) {
    rawData[1 + i * 3] = 0x1a;     // R
    rawData[2 + i * 3] = 0x1f;     // G
    rawData[3 + i * 3] = 0x36;     // B
  }
  
  // Simple zlib compress (deflate) - raw deflate without header
  const zlib = require("zlib");
  const compressed = zlib.deflateSync(rawData);
  
  const idatLength = Buffer.alloc(4);
  idatLength.writeUInt32BE(compressed.length);
  const idatType = Buffer.from("IDAT");
  const idatCrcData = Buffer.concat([idatType, compressed]);
  const idatCrc = Buffer.alloc(4);
  idatCrc.writeUInt32BE(crc32(crcTable, idatCrcData));
  
  const idat = Buffer.concat([idatLength, idatType, compressed, idatCrc]);
  
  // IEND chunk
  const iendType = Buffer.from("IEND");
  const iendCrc = Buffer.alloc(4);
  iendCrc.writeUInt32BE(crc32(crcTable, iendType));
  const iend = Buffer.concat([Buffer.from([0, 0, 0, 0]), iendType, iendCrc]);
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createCRCTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c >>>= 1;
    }
    table[n] = c;
  }
  return table;
}

function crc32(table, buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

console.log("╔══════════════════════════════════════╗");
console.log("║   PWA Icons Generator                ║");
console.log("╚══════════════════════════════════════╝");

// Buat folder icons jika belum ada
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Generate file PNG untuk setiap ukuran
SIZES.forEach((size) => {
  const pngData = createPngBase64(size);
  const fileName = `icon-${size}x${size}.png`;
  fs.writeFileSync(path.join(ICONS_DIR, fileName), pngData);
  const fileSize = (pngData.length / 1024).toFixed(1);
  console.log(`  ✓ Created: ${fileName} (${fileSize} KB)`);
});

console.log("\n✅ Done! Icons generated in public/icons/");