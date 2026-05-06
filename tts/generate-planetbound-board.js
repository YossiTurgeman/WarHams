#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Planet Bound Area Board Texture Generator
 *
 * Generates a single PNG that becomes a movable Custom_Tile on the
 * table. The board is solid black with 6 thin-gold card-shaped slot
 * outlines inside it (one per face-up BAC) and a gold outer border.
 * A "PLANET BOUND AREA" title is printed above the slots in gold.
 *
 * The texture aspect (3:1 wide) matches the on-table tile scale
 * (scaleX 9, scaleZ 3 → 18 x 6 TTS units) so the slot outlines stay
 * card-shaped without geometric stretching.
 *
 * Usage:   node generate-planetbound-board.js
 * Outputs: tts/v<VERSION>/planetbound-board.png
 */

const path = require("path");
const fs = require("fs");
const { Jimp, loadFont } = require("jimp");

const VERSION = "v57";
const outDir = path.join(__dirname, VERSION);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const FONT_DIR = path.join(__dirname, "..", "node_modules", "@jimp", "plugin-print", "dist", "fonts");

// ─── Canvas ─────────────────────────────────────────────────────────
// 7 card-shaped slots: 1 'DECK' slot on the left (where the
// Spaceport Deck sits) + 6 numbered slots for the face-up Planet
// Bound BACs. Texture aspect 1900:500 = 3.8:1 matches the in-world
// board aspect (see generate-save.js).
const W = 1900;
const H = 500;
const BLACK = 0x000000FF;
const GOLD  = 0xC9A24EFF;        // muted antique gold
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
// Hollow rectangle outline (4 strips).
function strokeRect(img, x1, y1, x2, y2, thickness, color) {
    fillRect(img, x1, y1, x2, y1 + thickness - 1, color);                  // top
    fillRect(img, x1, y2 - thickness + 1, x2, y2, color);                  // bottom
    fillRect(img, x1, y1, x1 + thickness - 1, y2, color);                  // left
    fillRect(img, x2 - thickness + 1, y1, x2, y2, color);                  // right
}

// ─── Build texture ──────────────────────────────────────────────────
(async () => {
    const img = new Jimp({ width: W, height: H, color: BLACK });

    // Outer gold border framing the whole board, inset slightly.
    const margin = 14;
    strokeRect(img, margin, margin, W - 1 - margin, H - 1 - margin, BORDER, GOLD);

    // Title bar — "PLANET BOUND AREA" in gold near the top.
    const titleFont = await loadFont(path.join(FONT_DIR, "open-sans/open-sans-32-white/open-sans-32-white.fnt"));
    // open-sans-32-white renders white glyphs; we'll print to a
    // transparent overlay then tint by replacing white pixels with
    // gold. (Jimp's bundled fonts only ship in white or black; gold
    // isn't available out of the box.)
    const titleLayer = new Jimp({ width: W, height: 60, color: 0x00000000 });
    titleLayer.print({
        font: titleFont,
        x: 0,
        y: 0,
        text: { text: "PLANET BOUND AREA", alignmentX: 2 /* CENTER */ },
        maxWidth: W,
    });
    // Recolour every non-transparent pixel from white to gold.
    titleLayer.scan(0, 0, W, 60, function (x, y, idx) {
        const a = this.bitmap.data[idx + 3];
        if (a > 0) {
            this.bitmap.data[idx]     = 0xC9;
            this.bitmap.data[idx + 1] = 0xA2;
            this.bitmap.data[idx + 2] = 0x4E;
        }
    });
    img.composite(titleLayer, 0, 38);

    // 7 card-shaped slot outlines (DECK + 6 numbered), evenly spaced
    // beneath the title. Slot pixel dimensions chosen so each slot
    // maps to EXACTLY a standard TTS card footprint (2.5 × 3.5) on
    // the in-world board (~19 × 5 units):
    //   slot_w_world = (250 / 1900) × 19 = 2.5 ✓
    //   slot_h_world = (350 / 500)  × 5  = 3.5 ✓
    // Seven 250-px slots + 6×4-px gaps = 1774 px row, leaving 63 px
    // margin on each side for the gold border to read cleanly.
    const SLOT_W = 250;
    const SLOT_H = 350;
    const SLOT_TOP = 80;
    const SLOT_GAP = 4;
    const N_SLOTS = 7;
    const slotsTotalW = N_SLOTS * SLOT_W + (N_SLOTS - 1) * SLOT_GAP;
    const slotsLeft = Math.floor((W - slotsTotalW) / 2);
    for (let i = 0; i < N_SLOTS; i++) {
        const x1 = slotsLeft + i * (SLOT_W + SLOT_GAP);
        const y1 = SLOT_TOP;
        const x2 = x1 + SLOT_W - 1;
        const y2 = y1 + SLOT_H - 1;
        strokeRect(img, x1, y1, x2, y2, SLOT_BORDER, GOLD);
    }

    // Slot labels — leftmost slot says "DECK", remaining 6 are "1"-"6".
    const labelFont = await loadFont(path.join(FONT_DIR, "open-sans/open-sans-32-white/open-sans-32-white.fnt"));
    const labelLayer = new Jimp({ width: W, height: 60, color: 0x00000000 });
    const slotLabels = ["DECK", "1", "2", "3", "4", "5", "6"];
    for (let i = 0; i < N_SLOTS; i++) {
        const x1 = slotsLeft + i * (SLOT_W + SLOT_GAP);
        labelLayer.print({
            font: labelFont,
            x: x1,
            y: 0,
            text: { text: slotLabels[i], alignmentX: 2 },
            maxWidth: SLOT_W,
        });
    }
    labelLayer.scan(0, 0, W, 60, function (x, y, idx) {
        const a = this.bitmap.data[idx + 3];
        if (a > 0) {
            this.bitmap.data[idx]     = 0xC9;
            this.bitmap.data[idx + 1] = 0xA2;
            this.bitmap.data[idx + 2] = 0x4E;
        }
    });
    img.composite(labelLayer, 0, SLOT_TOP + SLOT_H + 8);

    const out = path.join(outDir, "planetbound-board.png");
    await img.write(out);
    console.log(`planetbound-board.png (${W}x${H})`);
})().catch(e => { console.error(e); process.exit(1); });
