#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Resource Ready Board Texture Generator (rev4)
 *
 * Generates a single PNG that becomes a locked Custom_Tile on the
 * table — the TTS companion to the rulebook's "Resource Ready Board"
 * component. Solid-black background with a NEON-GREEN outer border
 * (matching the Unloading Zone board style), a title, and 6 numbered
 * empty boxes stacked in a VERTICAL column — number 1 at the top,
 * 6 at the bottom.
 *
 * After the RANDOMIZE NUMBER TOKENS button deals the number chits,
 * players place one resource token of each number's produced type
 * into that number's box — an at-a-glance lookup of what any
 * production roll yields. Pure reference: no game state.
 *
 * Texture aspect 8:20 (400×1000) — matches the in-world tile scale
 * (8 × 20 world units). See generate-save.js §17d-bis.
 *
 * Usage:   node generate-resource-ready-board.js
 * Output:  tts/v72/resource-ready-board-rev4.png  (new filename = cache-safe)
 */

const path = require("path");
const fs = require("fs");
const { Jimp, loadFont } = require("jimp");

const outDir = path.join(__dirname, "v72");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const FONT_DIR = path.join(__dirname, "..", "node_modules", "@jimp", "plugin-print", "dist", "fonts");

// ─── Canvas ─────────────────────────────────────────────────────────
const W = 400;
const H = 1000;
const BLACK = 0x000000FF;
// Same neon green as the Unloading Zone board.
const NEON = 0x39FF14FF;
const NEON_R = 0x39, NEON_G = 0xFF, NEON_B = 0x14;
const BORDER = 4;
const BOX_BORDER = 3;

function pixel(img, x, y, color) {
    if (x >= 0 && x < W && y >= 0 && y < H) img.setPixelColor(color, x, y);
}
function fillRect(img, x1, y1, x2, y2, color) {
    for (let y = y1; y <= y2; y++)
        for (let x = x1; x <= x2; x++)
            pixel(img, x, y, color);
}
function strokeRect(img, x1, y1, x2, y2, thickness, color) {
    fillRect(img, x1, y1, x2, y1 + thickness - 1, color);                  // top
    fillRect(img, x1, y2 - thickness + 1, x2, y2, color);                  // bottom
    fillRect(img, x1, y1, x1 + thickness - 1, y2, color);                  // left
    fillRect(img, x2 - thickness + 1, y1, x2, y2, color);                  // right
}
// Recolour every non-transparent pixel in a layer from white to neon
// (Jimp's bundled fonts only ship in white or black.)
function tintNeon(layer, w, h) {
    layer.scan(0, 0, w, h, function (x, y, idx) {
        const a = this.bitmap.data[idx + 3];
        if (a > 0) {
            this.bitmap.data[idx]     = NEON_R;
            this.bitmap.data[idx + 1] = NEON_G;
            this.bitmap.data[idx + 2] = NEON_B;
        }
    });
}

(async () => {
    const img = new Jimp({ width: W, height: H, color: BLACK });

    // Outer neon-green border framing the whole board.
    const margin = 14;
    strokeRect(img, margin, margin, W - 1 - margin, H - 1 - margin, BORDER, NEON);

    // ─── Title ─────────────────────────────────────────────────────
    const font = await loadFont(path.join(FONT_DIR, "open-sans/open-sans-32-white/open-sans-32-white.fnt"));
    const titleLayer = new Jimp({ width: W, height: 45, color: 0x00000000 });
    titleLayer.print({
        font,
        x: 0,
        y: 0,
        text: { text: "RESOURCE READY", alignmentX: 2 /* CENTER */ },
        maxWidth: W,
    });
    tintNeon(titleLayer, W, 45);
    img.composite(titleLayer, 0, 30);

    // ─── 6 numbered boxes in a vertical column ─────────────────────
    // Number 1 at the TOP (texture top = board north with rotY:180).
    // After setup, each box holds one resource token of the type that
    // number currently produces. Number label sits LEFT of its box.
    const BOX_W = 300;
    const BOX_H = 125;
    const COUNT = 6;
    const GAP = 18;
    const top = 95;                        // below title
    const boxX1 = 90, boxX2 = boxX1 + BOX_W - 1;
    const colH = COUNT * BOX_H + (COUNT - 1) * GAP;   // 840
    if (top + colH + 45 > H - margin) throw new Error("boxes overflow canvas");
    const labelLayer = new Jimp({ width: W, height: H, color: 0x00000000 });
    for (let i = 0; i < COUNT; i++) {
        const y1 = top + i * (BOX_H + GAP);
        const y2 = y1 + BOX_H - 1;
        strokeRect(img, boxX1, y1, boxX2, y2, BOX_BORDER, NEON);
        labelLayer.print({
            font,
            x: 6,
            y: Math.floor((y1 + y2) / 2) - 16,
            text: { text: String(i + 1), alignmentX: 2 /* CENTER */ },
            maxWidth: 80,                  // number column left of the box
        });
    }
    tintNeon(labelLayer, W, H);
    img.composite(labelLayer, 0, 0);

    // ─── Usage hint along the bottom ───────────────────────────────
    const hintLayer = new Jimp({ width: W, height: 40, color: 0x00000000 });
    hintLayer.print({
        font,
        x: 0,
        y: 0,
        text: { text: "1 token per number", alignmentX: 2 /* CENTER */ },
        maxWidth: W,
    });
    tintNeon(hintLayer, W, 40);
    img.composite(hintLayer, 0, H - 50);

    const out = path.join(outDir, "resource-ready-board-rev4.png");
    await img.write(out);
    console.log(`resource-ready-board-rev4.png (${W}x${H})`);
})().catch(e => { console.error(e); process.exit(1); });
