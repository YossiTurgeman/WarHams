#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Planet Frame Bar Texture Generator
 *
 * One shared texture (planet-frame-flat.png) used for ALL 4 Planet
 * Frame bars.  The 4 bars cross in an "X" pinwheel forming a diamond
 * cavity around the 61-hex planet cluster.
 *
 * Each bar is a long blue capsule with:
 *   - a bulbous, rounded HANDLE on the left  (wider than the body)
 *   - a slightly tapered, rounded TAIL on the right
 *   - 4 large white circle markers labelled a, b, c, d along the body
 *     (a closest to handle, d closest to tail)
 *
 * The TTS Custom_Tile is rectangular and TTS renders transparent
 * pixels as opaque BLACK.  We embrace that: the corners outside the
 * painted capsule shape are filled with deep "space black" so the
 * tile reads as a free-floating bar against the table.
 *
 *   Texture:  7500 × 400 px  (= 75 × 4 world @ 100 px/world)
 *
 * Usage:   node generate-planet-frame-pieces.js
 * Outputs: tts/v<VERSION>/planet-frame-flat.png
 */

const path = require("path");
const fs = require("fs");
const { Jimp, loadFont } = require("jimp");

const VERSION = "v66";
const outDir = path.join(__dirname, VERSION);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const FONT_DIR = path.join(__dirname, "..", "node_modules", "@jimp", "plugin-print", "dist", "fonts");

// ─── Canvas (100 px per world unit) ─────────────────────────────────
const W = 7500;   // 75 world long
const H = 400;    //  4 world wide

// ─── Color palette ──────────────────────────────────────────────────
function rgba(r, g, b, a = 255) {
    return (((r & 0xff) << 24) | ((g & 0xff) << 16) | ((b & 0xff) << 8) | (a & 0xff)) >>> 0;
}
const SPACE       = rgba(  6,  10,  20);   // background "space" (reads as near-black)
const ATMO        = rgba( 70, 130, 200);   // bar body blue
const ATMO_DARK   = rgba( 25,  55, 100);   // outline / shadow
const ATMO_LIGHT  = rgba(140, 190, 230);   // highlight
const WHITE       = rgba(245, 248, 252);

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

// ─── Build the bar ──────────────────────────────────────────────────
async function build() {
    // Background = "space"
    const img = new Jimp({ width: W, height: H, color: SPACE });

    const cy = H / 2;                          // 200

    // Geometry of the painted capsule
    const HANDLE_CX     = 280;                 // centre of handle bulge
    const HANDLE_R      = 190;                 // bulbous radius (wider than body)
    const BODY_HALF_H   = 130;                 // half-thickness of straight body
    const BODY_LEFT     = HANDLE_CX;           // body starts under handle centre
    const TAIL_TAPER_PX = 1300;                // length over which the tail tapers
    const BODY_RIGHT    = W - 100 - TAIL_TAPER_PX;  // body straight-section end
    const TAIL_END      = W - 100;             // tip of tail
    const TAIL_HALF_H   = 60;                  // half-thickness at tail tip

    // 1) Body rectangle (blue)
    fillRect(img, BODY_LEFT, cy - BODY_HALF_H, BODY_RIGHT, cy + BODY_HALF_H, ATMO);

    // 2) Handle bulge (blue circle, wider than body)
    fillCircle(img, HANDLE_CX, cy, HANDLE_R, ATMO);

    // 3) Tapered tail — linearly shrink half-height from BODY_HALF_H to TAIL_HALF_H
    for (let x = BODY_RIGHT; x <= TAIL_END; x++) {
        const t = (x - BODY_RIGHT) / (TAIL_END - BODY_RIGHT);
        const halfH = BODY_HALF_H * (1 - t) + TAIL_HALF_H * t;
        fillRect(img, x, cy - halfH, x, cy + halfH, ATMO);
    }
    // Rounded tail cap
    fillCircle(img, TAIL_END, cy, TAIL_HALF_H, ATMO);

    // 4) Highlight band along the upper edge of the body (subtle 3D look)
    fillRect(img, BODY_LEFT, cy - BODY_HALF_H, BODY_RIGHT, cy - BODY_HALF_H + 25, ATMO_LIGHT);
    // Shadow band along lower edge
    fillRect(img, BODY_LEFT, cy + BODY_HALF_H - 25, BODY_RIGHT, cy + BODY_HALF_H, ATMO_DARK);

    // 5) Dark outline strokes
    //    - top & bottom of body
    fillRect(img, BODY_LEFT, cy - BODY_HALF_H - 4, BODY_RIGHT, cy - BODY_HALF_H, ATMO_DARK);
    fillRect(img, BODY_LEFT, cy + BODY_HALF_H, BODY_RIGHT, cy + BODY_HALF_H + 4, ATMO_DARK);
    //    - handle outline
    strokeCircle(img, HANDLE_CX, cy, HANDLE_R, 5, ATMO_DARK);
    //    - tail tip outline
    strokeCircle(img, TAIL_END, cy, TAIL_HALF_H, 4, ATMO_DARK);

    // 6) 4 LARGE white markers (a, b, c, d) along the body
    const titleFont = await loadFont(path.join(FONT_DIR, "open-sans/open-sans-64-black/open-sans-64-black.fnt"));
    const letters = ["a", "b", "c", "d"];
    const FIRST_X  = HANDLE_CX + HANDLE_R + 250;     // first marker just past handle
    const LAST_X   = BODY_RIGHT - 200;                // last marker just before tail taper
    for (let i = 0; i < letters.length; i++) {
        const t  = letters.length === 1 ? 0.5 : i / (letters.length - 1);
        const mx = FIRST_X + t * (LAST_X - FIRST_X);
        const my = cy;
        fillCircle(img, mx, my, 80, WHITE);
        strokeCircle(img, mx, my, 80, 7, ATMO_DARK);
        // Letter (open-sans-64-black is ~36 px wide / ~64 px tall).
        img.print({ font: titleFont, x: mx - 18, y: my - 38, text: letters[i] });
    }

    await img.write(path.join(outDir, "planet-frame-flat.png"));
    console.log(`✅ Planet Frame bar texture written to ${outDir}/planet-frame-flat.png (${VERSION})`);
}

build();
