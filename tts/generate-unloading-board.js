#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Unloading Zone Board Texture Generator
 *
 * Generates a single PNG that becomes a movable Custom_Tile on the
 * table — the rectangular companion to the Planet Bound Area board.
 * Solid-black background with a NEON-GREEN outer border, an
 * "UNLOADING ZONE" title, and 6 card-shaped slot outlines arranged
 * in a 3-column × 2-row grid (Spaceports 1-6). Each slot is the
 * destination for the matching numbered cargo container; BAC cards
 * arriving at that spaceport stack face-up underneath it.
 *
 * Texture aspect ≈ 1000:870 (~1.15:1) — designed to match the
 * in-world tile scale so the slot outlines stay card-shaped.
 *
 * Usage:   node generate-unloading-board.js
 * Outputs: tts/v<VERSION>/unloading-zone-board.png
 */

const path = require("path");
const fs = require("fs");
const { Jimp, loadFont } = require("jimp");

const VERSION = "v58";
const outDir = path.join(__dirname, VERSION);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const FONT_DIR = path.join(__dirname, "..", "node_modules", "@jimp", "plugin-print", "dist", "fonts");

// ─── Canvas ─────────────────────────────────────────────────────────
// 3 columns × 2 rows of card-shaped slots. Texture width:height ratio
// is roughly 1.15:1 — see generate-save.js for the matching tile
// scaleX / scaleZ derivation.
const W = 1000;
const H = 950;
const BLACK = 0x000000FF;
// Bright neon green — high luminance, pure-green hue. The container
// boards' "neon" feel comes from the saturated green against pure
// black.
const NEON  = 0x39FF14FF;
const NEON_R = 0x39, NEON_G = 0xFF, NEON_B = 0x14;
const BORDER = 4;                // outer border thickness (px)
const SLOT_BORDER = 3;           // each slot's outline thickness

// ─── Helpers ────────────────────────────────────────────────────────
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
// green. (Jimp's bundled fonts only ship in white or black.)
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
    const titleFont = await loadFont(path.join(FONT_DIR, "open-sans/open-sans-32-white/open-sans-32-white.fnt"));
    const titleLayer = new Jimp({ width: W, height: 60, color: 0x00000000 });
    titleLayer.print({
        font: titleFont,
        x: 0,
        y: 0,
        text: { text: "UNLOADING ZONE", alignmentX: 2 /* CENTER */ },
        maxWidth: W,
    });
    tintNeon(titleLayer, W, 60);
    img.composite(titleLayer, 0, 38);

    // ─── 3 × 2 slot grid ──────────────────────────────────────────
    // Slot pixel size 250×320 — close to standard TTS card aspect
    // (5:7). Three columns + two gaps fit centered horizontally;
    // two rows + one gap leave room above for the title and below
    // for "1"-"6" labels.
    const SLOT_W = 250;
    const SLOT_H = 320;
    const COLS = 3;
    const ROWS = 2;
    const COL_GAP = 30;
    const ROW_GAP = 80;          // generous so the row labels read
    const gridW = COLS * SLOT_W + (COLS - 1) * COL_GAP;
    const gridH = ROWS * SLOT_H + (ROWS - 1) * ROW_GAP;
    const gridLeft = Math.floor((W - gridW) / 2);
    const gridTop = 120;          // below title
    // Stash slot rectangles for both stroke and label passes.
    const slotRects = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x1 = gridLeft + c * (SLOT_W + COL_GAP);
            const y1 = gridTop + r * (SLOT_H + ROW_GAP);
            const x2 = x1 + SLOT_W - 1;
            const y2 = y1 + SLOT_H - 1;
            slotRects.push({ x1, y1, x2, y2, num: r * COLS + c + 1 });
            strokeRect(img, x1, y1, x2, y2, SLOT_BORDER, NEON);
        }
    }

    // ─── Slot labels "1"-"6" beneath each slot ────────────────────
    const labelFont = await loadFont(path.join(FONT_DIR, "open-sans/open-sans-32-white/open-sans-32-white.fnt"));
    const labelLayer = new Jimp({ width: W, height: H, color: 0x00000000 });
    for (const s of slotRects) {
        labelLayer.print({
            font: labelFont,
            x: s.x1,
            y: s.y2 + 8,
            text: { text: String(s.num), alignmentX: 2 /* CENTER */ },
            maxWidth: SLOT_W,
        });
    }
    tintNeon(labelLayer, W, H);
    img.composite(labelLayer, 0, 0);

    const out = path.join(outDir, "unloading-zone-board.png");
    await img.write(out);
    console.log(`unloading-zone-board.png (${W}x${H})`);
})().catch(e => { console.error(e); process.exit(1); });
