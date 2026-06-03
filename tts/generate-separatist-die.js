#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Separatist Die Texture Generator
 *
 * Produces a single 2048×2048 PNG containing all 6 faces of the
 * Separatist Die (grey d6). Pip colours encode the rulebook:
 *
 *   • Faces 1, 3, 5  → BLACK pips (no Separatist spawn)
 *   • Faces 2, 4, 6  → RED   pips (matches a base's printed number,
 *                              triggers Separatist spawn per Phase 1)
 *
 * Used as a TTS Custom_Dice (Type 1 = D6) — generate-save.js wires
 * the texture in via CustomImage.ImageURL.
 *
 * Layout — matches the TTS d6 dice template (verified via nanDECK
 * community examples). On the 2048×2048 canvas, 6 face cells live
 * in the lower 65% of the image, arranged 3 columns × 2 rows:
 *
 *   ╭──────────────────────────────────────╮
 *   │            (unused top band)         │  ~712 px tall
 *   │                                      │
 *   ├──────────────────────────────────────┤
 *   │   FACE 2  │   FACE 4  │   FACE 5     │  row 0  (y≈712)
 *   ├───────────┼───────────┼──────────────┤
 *   │   FACE 1  │   FACE 3  │   FACE 6     │  row 1  (y≈1403, rot180)
 *   │  (rot180) │  (rot180) │  (rot180)    │
 *   ╰──────────────────────────────────────╯
 *
 * Pip patterns are symmetric so the 180° rotation of the bottom
 * row faces is visually identical — we can draw the pips at the
 * same local coords for every face and let the cube UV unwrap
 * handle the rest.
 *
 * Usage:  node generate-separatist-die.js
 * Output: tts/v72/separatist_die_rev<N>.png
 *
 * Bump SEP_DIE_REV whenever the pixel content changes — TTS strips
 * ?query=… cache busters and only refreshes on a brand-new path,
 * so the rev suffix is the only reliable way to force a refetch.
 * Must be kept in sync with SEP_DIE_REV in generate-save.js.
 */

const { Jimp } = require("jimp");
const path = require("path");

const VERSION = "v72";
const SEP_DIE_REV = 1;
const OUT_DIR = path.join(__dirname, VERSION);
const OUT = path.join(OUT_DIR, `separatist_die_rev${SEP_DIE_REV}.png`);

const CANVAS = 2048;

// Grey background — matches the Die_6 ColorDiffuse {0.5, 0.5, 0.5}
// used for the Separatist Die in generate-save.js. Pure mid-grey
// reads as "neutral / NPC" against the white resource dice and the
// player-coloured combat dice.
const GREY      = { r: 0x80, g: 0x80, b: 0x80 };
// Slightly darker grey for the cell border so individual faces are
// visually distinct on the rolled die.
const EDGE_GREY = { r: 0x55, g: 0x55, b: 0x55 };
// Standard pip colours.
const PIP_BLACK = { r: 0x10, g: 0x10, b: 0x10 };
const PIP_RED   = { r: 0xCC, g: 0x18, b: 0x18 };

// Face cell layout in pixels (derived from nanDECK 17.34u → 2048px
// scale, with each face 5.27u → 622px). The bottom-row faces are
// rotated 180° in the TTS template; pip patterns are symmetric so
// we don't need to physically rotate the cell content.
const FACE_PX = 622;
const ROW0_Y  = 712;
const ROW1_Y  = 1403;
const COL_X   = [24, 714, 1403];

// Mapping: face value → (column, row). nanDECK confirmed.
//   row 0: 2 | 4 | 5
//   row 1: 1 | 3 | 6
const FACE_POS = {
    1: { col: 0, row: 1 },
    2: { col: 0, row: 0 },
    3: { col: 1, row: 1 },
    4: { col: 1, row: 0 },
    5: { col: 2, row: 0 },
    6: { col: 2, row: 1 },
};

// Standard d6 pip patterns, expressed as (col, row) coords in a
// 3×3 pip grid. Symmetric for every face so 180° face rotation
// produces an identical visual.
const PIP_PATTERNS = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [2, 0], [0, 2], [2, 2]],
    5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
    6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};

function rgba(c, a = 255) {
    return (((c.r & 0xFF) << 24) | ((c.g & 0xFF) << 16) | ((c.b & 0xFF) << 8) | (a & 0xFF)) >>> 0;
}
function fillRect(img, x1, y1, x2, y2, color) {
    const w = img.bitmap.width, h = img.bitmap.height;
    for (let y = Math.max(0, y1); y <= Math.min(h - 1, y2); y++)
        for (let x = Math.max(0, x1); x <= Math.min(w - 1, x2); x++)
            img.setPixelColor(rgba(color), x, y);
}
function strokeRect(img, x1, y1, x2, y2, thickness, color) {
    fillRect(img, x1, y1, x2, y1 + thickness - 1, color);                  // top
    fillRect(img, x1, y2 - thickness + 1, x2, y2, color);                  // bottom
    fillRect(img, x1, y1, x1 + thickness - 1, y2, color);                  // left
    fillRect(img, x2 - thickness + 1, y1, x2, y2, color);                  // right
}
function fillCircle(img, cx, cy, r, color) {
    const r2 = r * r;
    const w = img.bitmap.width, h = img.bitmap.height;
    for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(h - 1, Math.ceil(cy + r)); y++) {
        for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(w - 1, Math.ceil(cx + r)); x++) {
            const dx = x - cx, dy = y - cy;
            if (dx * dx + dy * dy <= r2) img.setPixelColor(rgba(color), x, y);
        }
    }
}

function drawFace(img, faceValue) {
    const { col, row } = FACE_POS[faceValue];
    const ox = COL_X[col];
    const oy = row === 0 ? ROW0_Y : ROW1_Y;

    // Cell background — slightly distinct so the cube edges are
    // visible against the surrounding grey canvas.
    fillRect(img, ox, oy, ox + FACE_PX - 1, oy + FACE_PX - 1, GREY);
    // Thin dark border around the face cell.
    strokeRect(img, ox, oy, ox + FACE_PX - 1, oy + FACE_PX - 1, 4, EDGE_GREY);

    // Pip layout — divide cell into 3×3, place pips on grid intersections.
    const margin = Math.round(FACE_PX * 0.20);              // ~124 px
    const stride = Math.round((FACE_PX - 2 * margin) / 2);  // ~187 px
    const pipR   = Math.round(FACE_PX * 0.085);             // ~53 px

    const color = (faceValue % 2 === 0) ? PIP_RED : PIP_BLACK;

    for (const [pc, pr] of PIP_PATTERNS[faceValue]) {
        const cx = ox + margin + pc * stride;
        const cy = oy + margin + pr * stride;
        fillCircle(img, cx, cy, pipR, color);
    }
}

(async () => {
    const img = new Jimp({ width: CANVAS, height: CANVAS, color: rgba(GREY) });
    for (let n = 1; n <= 6; n++) drawFace(img, n);
    await img.write(OUT);
    console.log(`wrote ${OUT}`);
})();
