#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Number Token Texture Generator
 *
 * Produces 6 PNG textures (one per number 1–6) used by the resource-
 * production Number Tokens. They render as flat circular Custom_Tile
 * discs in TTS — Catan-style chits with a big bold black number on a
 * cream background and a thin border ring.
 *
 * The disc is drawn into a square texture; TTS Custom_Tile with
 * Type: 2 (Circular) crops it to a round outline.
 *
 * Usage:  node generate-number-tokens.js
 * Output: tts/cards/number_<n>.png  (n = 1..6)
 */

const { Jimp, loadFont } = require("jimp");
const path = require("path");
const fs = require("fs");

const OUT = path.join(__dirname, "cards");
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const SIZE = 512;                     // square texture; TTS crops to circle
const CREAM      = { r: 0xF2, g: 0xE8, b: 0xC8 };
const CREAM_DARK = { r: 0xCB, g: 0xB8, b: 0x88 };
const INK        = { r: 0x14, g: 0x12, b: 0x10 };

const FONT_DIR = path.join(__dirname, "..", "node_modules", "@jimp", "plugin-print", "dist", "fonts");

function rgba(c, a = 255) {
    return (((c.r & 0xFF) << 24) | ((c.g & 0xFF) << 16) | ((c.b & 0xFF) << 8) | (a & 0xFF)) >>> 0;
}

function fillCircle(img, cx, cy, r, color) {
    const r2 = r * r;
    for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(img.bitmap.height - 1, Math.ceil(cy + r)); y++) {
        for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(img.bitmap.width - 1, Math.ceil(cx + r)); x++) {
            const dx = x - cx, dy = y - cy;
            if (dx * dx + dy * dy <= r2) img.setPixelColor(rgba(color), x, y);
        }
    }
}
function fillRing(img, cx, cy, rOuter, rInner, color) {
    const ro2 = rOuter * rOuter, ri2 = rInner * rInner;
    for (let y = Math.max(0, Math.floor(cy - rOuter)); y <= Math.min(img.bitmap.height - 1, Math.ceil(cy + rOuter)); y++) {
        for (let x = Math.max(0, Math.floor(cx - rOuter)); x <= Math.min(img.bitmap.width - 1, Math.ceil(cx + rOuter)); x++) {
            const dx = x - cx, dy = y - cy;
            const d2 = dx * dx + dy * dy;
            if (d2 <= ro2 && d2 >= ri2) img.setPixelColor(rgba(color), x, y);
        }
    }
}

async function buildToken(n, font) {
    // RGBA transparent canvas — disc is the only opaque region so the
    // Custom_Tile circular crop reads cleanly.
    const img = new Jimp({ width: SIZE, height: SIZE, color: rgba({ r: 0, g: 0, b: 0 }, 0) });
    const cx = SIZE / 2, cy = SIZE / 2;
    const rOuter = SIZE / 2 - 8;
    const rRing  = rOuter - 18;

    // Cream disc with darker cream rim
    fillCircle(img, cx, cy, rOuter, CREAM_DARK);
    fillCircle(img, cx, cy, rRing, CREAM);

    // Big bold black number centered. jimp's print accepts alignmentX
    // for horizontal centering; vertical centering is done by setting
    // y so the 128 px glyph sits roughly mid-disc (cap-line at ~180).
    const txt = String(n);
    img.print({
        font,
        x: 0,
        y: 180,
        text: { text: txt, alignmentX: 2 /* HorizontalAlign.CENTER */ },
        maxWidth: SIZE,
    });

    return img;
}

(async () => {
    // Big bold black font — open-sans 128 is the largest bundled.
    const font = await loadFont(path.join(FONT_DIR, "open-sans/open-sans-128-black/open-sans-128-black.fnt"));
    for (let n = 1; n <= 6; n++) {
        const img = await buildToken(n, font);
        const out = path.join(OUT, `number_${n}.png`);
        await img.write(out);
        console.log(`wrote ${out}`);
    }
})().catch(e => { console.error(e); process.exit(1); });
