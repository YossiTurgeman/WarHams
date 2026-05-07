#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Equipment Display Board Texture Generator
 *
 * Big shared reference board placed between the Blue and Red player
 * corners (south edge of the table). Holds up to 20 face-up BAC
 * cards in a 10-col × 2-row LANDSCAPE strip (one slot for every BAC
 * type). Players drop their Control Flags onto the matching slot
 * when they unlock that BAC type.
 *
 * Solid-black background, CYAN outer border, "EQUIPMENT DISPLAY"
 * title in cyan near the top, 20 card-shaped slot outlines (250×350
 * px — IDENTICAL to the Planet Bound and Unloading Zone slot pixel
 * dimensions so all three boards render cards at the same size).
 *
 * Texture: 2900×900 px (aspect ≈ 3.22:1, wide landscape). The
 * matching Custom_Tile scale in generate-save.js is sized so the
 * in-world board is ~29 × 9 units and each slot maps to ~2.5 × 3.5
 * world units (matches PB and UZ card-slot footprint exactly).
 *
 * Usage:   node generate-equipment-board.js
 * Outputs: tts/v<VERSION>/equipment-display-board.png
 */

const path = require("path");
const fs = require("fs");
const { Jimp, loadFont } = require("jimp");

const VERSION = "v65";
const outDir = path.join(__dirname, VERSION);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const FONT_DIR = path.join(__dirname, "..", "node_modules", "@jimp", "plugin-print", "dist", "fonts");

// ─── Canvas ─────────────────────────────────────────────────────────
const W = 2900;
const H = 1000;
const BLACK = 0x000000FF;
// Bright pure cyan — high contrast against pure black, distinct from
// the gold (PB) and neon-green (UZ) board palettes.
const CYAN  = 0x00E5FFFF;
const CYAN_R = 0x00, CYAN_G = 0xE5, CYAN_B = 0xFF;
const BORDER = 5;                // outer border thickness (px) — a bit
                                 // thicker than the smaller boards so
                                 // the larger surface still reads.
const SLOT_BORDER = 3;

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
    fillRect(img, x1, y1, x2, y1 + thickness - 1, color);
    fillRect(img, x1, y2 - thickness + 1, x2, y2, color);
    fillRect(img, x1, y1, x1 + thickness - 1, y2, color);
    fillRect(img, x2 - thickness + 1, y1, x2, y2, color);
}
function tintCyan(layer, w, h) {
    layer.scan(0, 0, w, h, function (x, y, idx) {
        const a = this.bitmap.data[idx + 3];
        if (a > 0) {
            this.bitmap.data[idx]     = CYAN_R;
            this.bitmap.data[idx + 1] = CYAN_G;
            this.bitmap.data[idx + 2] = CYAN_B;
        }
    });
}

(async () => {
    const img = new Jimp({ width: W, height: H, color: BLACK });

    // Outer cyan border framing the whole board.
    const margin = 18;
    strokeRect(img, margin, margin, W - 1 - margin, H - 1 - margin, BORDER, CYAN);

    // ─── Title ─────────────────────────────────────────────────────
    const titleFont = await loadFont(path.join(FONT_DIR, "open-sans/open-sans-32-white/open-sans-32-white.fnt"));
    const titleLayer = new Jimp({ width: W, height: 60, color: 0x00000000 });
    titleLayer.print({
        font: titleFont,
        x: 0,
        y: 0,
        text: { text: "EQUIPMENT DISPLAY", alignmentX: 2 },
        maxWidth: W,
    });
    tintCyan(titleLayer, W, 60);
    img.composite(titleLayer, 0, 50);

    // ─── 10 × 2 slot grid ─────────────────────────────────────────
    // Slot pixel size 250×350 — IDENTICAL to PB and UZ slot pixels
    // so all three boards render cards at the same in-world size.
    // 10 columns × 2 rows = 20 slots (one per BAC type).
    const SLOT_W = 250;
    const SLOT_H = 350;
    const COLS = 10;
    const ROWS = 2;
    const COL_GAP = 30;
    const ROW_GAP = 80;          // generous gap between the two rows
    const gridW = COLS * SLOT_W + (COLS - 1) * COL_GAP;
    const gridH = ROWS * SLOT_H + (ROWS - 1) * ROW_GAP;
    const gridLeft = Math.floor((W - gridW) / 2);
    const gridTop = 130;          // below the title
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x1 = gridLeft + c * (SLOT_W + COL_GAP);
            const y1 = gridTop + r * (SLOT_H + ROW_GAP);
            const x2 = x1 + SLOT_W - 1;
            const y2 = y1 + SLOT_H - 1;
            strokeRect(img, x1, y1, x2, y2, SLOT_BORDER, CYAN);
        }
    }

    const out = path.join(outDir, "equipment-display-board.png");
    await img.write(out);
    console.log(`equipment-display-board.png (${W}x${H})`);
})().catch(e => { console.error(e); process.exit(1); });
