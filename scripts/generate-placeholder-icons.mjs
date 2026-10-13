/**
 * Genera los iconos provisionales del sitio a partir de la marca de
 * `public/favicon.svg`:
 *
 *   - public/apple-touch-icon.png  (180x180)
 *   - public/favicon.ico          (32x32, PNG embebido)
 *
 * Se ejecuta a mano; no es parte del build ni una dependencia.
 *
 *   node scripts/generate-placeholder-icons.mjs
 *
 * Son marcadores de posición. Cuando Midsummer entregue la identidad visual,
 * este archivo se elimina y los oficiales ocupan su lugar.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const BG = [0x2a, 0x4e, 0x37];
const FG = [0xff, 0xff, 0xff];

/** Distancia de un punto al segmento a-b. */
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  const t =
    lengthSq === 0
      ? 0
      : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function buildPng(size, strokeWidth) {
  const scale = size / 128;
  const half = strokeWidth / 2;

  // La "M" del favicon, escalada de 128 a `size`.
  const segments = [
    [40, 94, 40, 36],
    [40, 36, 64, 66],
    [64, 66, 88, 36],
    [88, 36, 88, 94],
  ].map(([ax, ay, bx, by]) => [ax * scale, ay * scale, bx * scale, by * scale]);

  const raw = Buffer.alloc(size * (size * 3 + 1));
  let offset = 0;

  for (let y = 0; y < size; y++) {
    raw[offset++] = 0; // filtro "None"
    for (let x = 0; x < size; x++) {
      const onGlyph = segments.some(
        ([ax, ay, bx, by]) => distToSegment(x + 0.5, y + 0.5, ax, ay, bx, by) <= half,
      );
      const [r, g, b] = onGlyph ? FG : BG;
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolor
  ihdr[12] = 0; // sin entrelazado

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Contenedor ICO con una sola entrada PNG (soportado por todos los navegadores). */
function buildIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reservado
  header.writeUInt16LE(1, 2); // tipo 1 = icono
  header.writeUInt16LE(1, 4); // una entrada

  const entry = Buffer.alloc(16);
  entry[0] = size === 256 ? 0 : size;
  entry[1] = size === 256 ? 0 : size;
  entry[2] = 0; // paleta
  entry[3] = 0; // reservado
  entry.writeUInt16LE(1, 4); // planos
  entry.writeUInt16LE(32, 6); // bits por píxel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12); // inicio de los datos

  return Buffer.concat([header, entry, png]);
}

const publicDir = new URL('../public/', import.meta.url);

const touch = buildPng(180, 13);
writeFileSync(new URL('apple-touch-icon.png', publicDir), touch);

const ico = buildIco(buildPng(32, 6), 32);
writeFileSync(new URL('favicon.ico', publicDir), ico);

console.log(`apple-touch-icon.png  180x180  ${touch.length} bytes`);
console.log(`favicon.ico           32x32    ${ico.length} bytes`);
