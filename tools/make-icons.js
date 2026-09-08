'use strict';

/**
 * Gera os PNGs de icons/ sem dependência externa.
 * Desenho: quadrado azul com cantos arredondados e três barras brancas,
 * que lembram as linhas de uma tabela.
 *
 * Uso: node tools/make-icons.js
 */

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const BLUE = [21, 101, 192];
const WHITE = [255, 255, 255];
const SIZES = [16, 48, 128];

function crc32(buffer) {
    let crc = 0xffffffff;

    for (const byte of buffer) {
        crc ^= byte;

        for (let bit = 0; bit < 8; bit += 1) {
            crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
        }
    }

    return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);

    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));

    return Buffer.concat([length, body, crc]);
}

/** pixels: função (x, y) => [r, g, b, a] */
function encodePng(size, pixels) {
    const raw = Buffer.alloc(size * (size * 4 + 1));
    let offset = 0;

    for (let y = 0; y < size; y += 1) {
        raw[offset] = 0; // filtro "none"
        offset += 1;

        for (let x = 0; x < size; x += 1) {
            const [r, g, b, a] = pixels(x, y);
            raw[offset] = r;
            raw[offset + 1] = g;
            raw[offset + 2] = b;
            raw[offset + 3] = a;
            offset += 4;
        }
    }

    const header = Buffer.alloc(13);
    header.writeUInt32BE(size, 0);
    header.writeUInt32BE(size, 4);
    header[8] = 8;  // 8 bits por canal
    header[9] = 6;  // RGBA

    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', header),
        chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
        chunk('IEND', Buffer.alloc(0)),
    ]);
}

/** Está dentro do quadrado de cantos arredondados? */
function insideRoundedSquare(x, y, size, radius) {
    const nearLeft = x < radius;
    const nearRight = x > size - 1 - radius;
    const nearTop = y < radius;
    const nearBottom = y > size - 1 - radius;

    if (!((nearLeft || nearRight) && (nearTop || nearBottom))) {
        return true;
    }

    const cx = nearLeft ? radius : size - 1 - radius;
    const cy = nearTop ? radius : size - 1 - radius;

    return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

function draw(size) {
    const radius = Math.max(2, Math.round(size * 0.2));
    const barHeight = Math.max(1, Math.round(size * 0.09));
    const barLeft = Math.round(size * 0.22);
    const barRight = size - barLeft;
    const barTops = [0.28, 0.46, 0.64].map(ratio => Math.round(size * ratio));

    return (x, y) => {
        if (!insideRoundedSquare(x, y, size, radius)) {
            return [0, 0, 0, 0];
        }

        const onBar = barTops.some(top => y >= top && y < top + barHeight)
            && x >= barLeft && x < barRight;

        return onBar ? [...WHITE, 255] : [...BLUE, 255];
    };
}

const outputDir = path.join(__dirname, '..', 'icons');
fs.mkdirSync(outputDir, { recursive: true });

for (const size of SIZES) {
    const file = path.join(outputDir, `icon${size}.png`);
    fs.writeFileSync(file, encodePng(size, draw(size)));
    console.log(`icons/icon${size}.png`);
}
