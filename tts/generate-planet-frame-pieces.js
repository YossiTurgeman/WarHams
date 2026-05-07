#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Planet Frame Piece Texture Generator
 *
 * One shared texture (planet-frame-flat.png) used for ALL 6 Planet
 * Frame pieces.  Atmosphere-blue solid rectangle (no PNG alpha — TTS
 * Custom_Tile renders transparent pixels as opaque BLACK, so we
 * avoid alpha entirely and PAINT the puzzle look instead).
 *
 *   Dimensions: 3000 × 400 px  (= 30 × 4 world @ 100 px/world,
 *               using PB px/world ratio for scale calibration)
 *
 * Decorations (all opaque):
 *   - Solid atmosphere-blue body fill
 *   - Decorative jigsaw "cut" line painted on LEFT edge (mushroom
 *     tab outline) and RIGHT edge (matching notch outline)
 *   - 5 LARGE white letter badges (a–e) along the long INNER edge
 *     for movement-wrap markers
 *   - Dark border outline
 *
 * Each piece is placed tangent to one side of the hex cluster's
 * outer hexagon (cluster has 6 sides, R=3.5 flat-top hexes radius-4
 * → outer-hex side = 27.34 world).
 *
 * Usage:   node generate-planet-frame-pieces.js
 * Outputs: tts/v<VERSION>/planet-frame-flat.png
 */

const path = require("path");
const fs = require("fs");
const { Jimp, loadFont } = require("jimp");

const VERSION = "v65";
const outDir = path.join(__dirname, VERSION);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const FONT_DIR = path.join(__dirname, "..", "node_modules", "@jimp", "plugin-print", "dist", "fonts");

// ─── Canvas (100 px per world unit) ─────────────────────────────────
const W = 3000;   // 30 world (slightly wider than hex side 27.34)
const H = 400;    //  4 world (frame width)

// ─── Color palette ──────────────────────────────────────────────────
function rgba(r, g, b, a = 255) {
    return (((r & 0xff) << 24) | ((g & 0xff) << 16) | ((b & 0xff) << 8) | (a & 0xff)) >>> 0;
}
const ATMO        = rgba( 70, 130, 200);
const ATMO_DARK   = rgba( 30,  60, 110);
const ATMO_LIGHT  = rgba(140, 190, 230);
const WHITE       = rgba(245, 248, 252);
const BLACK       = rgba( 18,  22,  30);

// ─── Pixel helpers ──────────────────────────────────────────────────
function setPx(img, x, y, color) {
    x = x | 0; y = y | 0;
    if (x >= 0 && x < W && y >= 0 && y < H) img.setPixelColor(color, x, y);
}
function fillRect(img, x1, y1, x2, y2, color) {
    if (x1 > x2) [x1, x2] = [x2, x1];
    if (y1 > y2) [y1, y2] = [y2, y1];
    for (let y = y1 | 0; y <= (y2 | 0); y++)
        for (let x = x1 | 0; x <= (x2 | 0); x++) setPx(img, x, y, color);
}
function fillCircle(img, cx, cy, r, color) {
    const r2 = r * r;
    for (let y = -r; y <= r; y++)
        for (let x = -r; x <= r; x++)
            if (x * x + y * y <= r2) setPx(img, cx + x, cy + y, color);
}
function strokeCircle(img, cx, cy, r, t, color) {
    const ro2 = r * r, ri2 = (r - t) * (r - t);
    for (let y = -r; y <= r; y++)
        for (let x = -r; x <= r; x++) {
            const d = x * x + y * y;
            if (d <= ro2 && d >= ri2) setPx(img, cx + x, cy + y, color);
        }
}

// ─── Build the piece ────────────────────────────────────────────────
async function build() {
    const img = new Jimp({ width: W, height: H, color: ATMO });

    // Inner-edge highlight band (lighter blue strip along bottom = inner edge).
    fillRect(img, 0, H - 70, W, H, rgba(95, 155, 215));
    // Outer-edge shadow (darker blue strip along top = outer edge).
    fillRect(img, 0, 0, W, 30, ATMO_DARK);
    // Border outline (dark)
    const BORDER = 6;
    fillRect(img, 0, 0, W, BORDER, ATMO_DARK);                 // top
    fillRect(img, 0, H - BORDER, W, H - 1, ATMO_DARK);         // bottom
    fillRect(img, 0, 0, BORDER, H, ATMO_DARK);                 // left
    fillRect(img, W - BORDER, 0, W - 1, H, ATMO_DARK);         // right

    // ── Decorative jigsaw "TAB" painted on LEFT edge ────────────────
    // Mushroom shape painted in slightly lighter blue (suggests a
    // protruding tab without actually changing tile geometry).
    const tabCx = 100;             // tab head centre x
    const tabCy = H / 2;
    const TAB_HEAD_R = 90;
    const NECK_HALF = 50;
    const NECK_LEN  = 70;
    // Neck (light blue) + head (light blue) drawn ON the body.
    fillRect(img, tabCx + NECK_LEN, tabCy - NECK_HALF, tabCx + NECK_LEN + 100, tabCy + NECK_HALF, ATMO_LIGHT);
    fillCircle(img, tabCx, tabCy, TAB_HEAD_R, ATMO_LIGHT);
    // Outline the tab shape with a dark line
    strokeCircle(img, tabCx, tabCy, TAB_HEAD_R, 4, ATMO_DARK);
    // Tab base outline
    fillRect(img, tabCx + NECK_LEN - 2, tabCy - NECK_HALF, tabCx + NECK_LEN + 2, tabCy + NECK_HALF, ATMO_DARK);

    // ── Decorative jigsaw "NOTCH" painted on RIGHT edge ─────────────
    const notchCx = W - 100;
    const notchCy = H / 2;
    // Notch shown as a darker inset (suggests material removed).
    fillCircle(img, notchCx, notchCy, TAB_HEAD_R, ATMO_DARK);
    fillRect(img, notchCx - NECK_LEN - 100, notchCy - NECK_HALF, notchCx - NECK_LEN, notchCy + NECK_HALF, ATMO_DARK);
    // Inner of notch slightly lighter to read as recessed
    fillCircle(img, notchCx, notchCy, TAB_HEAD_R - 8, rgba(50, 90, 140));

    // ── 5 LARGE letter badges along the INNER edge (bottom) ─────────
    const titleFont = await loadFont(path.join(FONT_DIR, "open-sans/open-sans-64-black/open-sans-64-black.fnt"));
    const letters = ["a", "b", "c", "d", "e"];
    // Distribute across the central body region (inside the tab/notch)
    const startX = 350;
    const endX   = W - 350;
    const span   = endX - startX;
    for (let i = 0; i < letters.length; i++) {
        const t = (i + 0.5) / letters.length;
        const cx = startX + t * span;
        const cy = H - 130;          // 130 px above inner edge
        // Big white circle with thick dark outline
        fillCircle(img, cx, cy, 75, WHITE);
        strokeCircle(img, cx, cy, 75, 8, ATMO_DARK);
        // Print the letter centred (letter ~36 px wide for 64 pt)
        img.print({ font: titleFont, x: cx - 22, y: cy - 42, text: letters[i] });
    }

    await img.write(path.join(outDir, "planet-frame-flat.png"));
    console.log(`✅ Planet Frame piece texture written to ${outDir}/planet-frame-flat.png (${VERSION})`);
}

build();
