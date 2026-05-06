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

// Published under the versioned soldier path so each VERSION bump
// bypasses TTS's URL-path cache (TTS strips ?query strings before
// looking up cached assets, so path-based busting is the only thing
// that reliably works). Must match SOLDIER_BASE in generate-save.js.
const VERSION = "v59";
const OUT = path.join(__dirname, VERSION);
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const SIZE = 256;                     // square texture; TTS crops to circle.
                                      // 256 px keeps the 128 px glyph
                                      // visually large (~50% disc dia).
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

function fillRect(img, x1, y1, x2, y2, color) {
    for (let y = Math.max(0, y1); y <= Math.min(img.bitmap.height - 1, y2); y++)
        for (let x = Math.max(0, x1); x <= Math.min(img.bitmap.width - 1, x2); x++)
            img.setPixelColor(rgba(color), x, y);
}

async function buildToken(n, font) {
    // RGBA transparent canvas — disc is the only opaque region so the
    // Custom_Tile circular crop reads cleanly.
    const img = new Jimp({ width: SIZE, height: SIZE, color: rgba({ r: 0, g: 0, b: 0 }, 0) });
    const cx = SIZE / 2, cy = SIZE / 2;
    const rOuter = SIZE / 2 - 4;       // thin outer rim
    const rRing  = rOuter - 8;         // cream interior

    // Cream disc with darker cream rim
    fillCircle(img, cx, cy, rOuter, CREAM_DARK);
    fillCircle(img, cx, cy, rRing, CREAM);

    // Big bold black number centered. jimp's print only supports
    // horizontal alignment; vertical positioning is manual. We push
    // the glyph slightly above center so there's room beneath it for
    // the orientation bar without crowding the rim.
    const txt = String(n);
    img.print({
        font,
        x: 0,
        y: 50,
        text: { text: txt, alignmentX: 2 /* HorizontalAlign.CENTER */ },
        maxWidth: SIZE,
    });

    // Orientation bar: a short bold underline directly beneath the
    // digit so players can tell which way is "down" on the chit
    // (and so a 6 never reads as a 9 across the table).
    const barW = 70;
    const barH = 8;
    const barX1 = cx - barW / 2;
    const barX2 = cx + barW / 2;
    const barY1 = cy + 50;
    const barY2 = barY1 + barH;
    fillRect(img, barX1, barY1, barX2, barY2, INK);

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

    // Blank back face — same disc shape, no number/underline. Used as
    // ImageSecondaryURL on the chits so the BACK is unprinted while
    // only the FRONT carries the digit.
    const back = new Jimp({ width: SIZE, height: SIZE, color: rgba({ r: 0, g: 0, b: 0 }, 0) });
    const cx = SIZE / 2, cy = SIZE / 2;
    const rOuter = SIZE / 2 - 4;
    const rRing  = rOuter - 8;
    fillCircle(back, cx, cy, rOuter, CREAM_DARK);
    fillCircle(back, cx, cy, rRing, CREAM);
    const backOut = path.join(OUT, "number_back.png");
    await back.write(backOut);
    console.log(`wrote ${backOut}`);
})().catch(e => { console.error(e); process.exit(1); });
