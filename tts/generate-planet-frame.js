#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Planet Frame Texture Generator
 *
 * Generates the circular Planet Frame texture — a cardboard-tan ring
 * around the 61-hex playing surface, divided into 5 interlocking
 * puzzle pieces (per rulebook).
 *
 *   Inner radius ≈ 1230 px (just outside the 24-unit-wide hex cluster)
 *   Outer radius ≈ 1480 px (frame width 250 px ≈ 2.5 world units)
 *
 * Texture is a square PNG with a transparent center (so the hex
 * tiles show through) and a transparent area outside the ring.
 *
 * Usage:   node generate-planet-frame.js
 * Outputs: tts/v<VERSION>/planet-frame.png
 */

const path = require("path");
const fs = require("fs");
const { Jimp, loadFont } = require("jimp");

const VERSION = "v65";
const outDir = path.join(__dirname, VERSION);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const FONT_DIR = path.join(__dirname, "..", "node_modules", "@jimp", "plugin-print", "dist", "fonts");

// ─── Canvas ─────────────────────────────────────────────────────────
// 3000x3000 → at PB px/world ratio (~100 px per world unit) gives a
// 30-world-unit-wide tile, which fits the ~24-unit hex cluster with
// ~3 units of frame margin on each side.
const SIZE = 3000;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUTER = 1480;
const R_INNER = 1230;
const R_OUTER_DARK = 1500;   // 20 px dark outline on outer edge
const R_INNER_DARK = 1210;   // 20 px dark outline on inner edge

// ─── Color palette ──────────────────────────────────────────────────
function rgba(r, g, b, a = 255) {
    return (((r & 0xff) << 24) | ((g & 0xff) << 16) | ((b & 0xff) << 8) | (a & 0xff)) >>> 0;
}
const TRANSPARENT = 0x00000000;
const TAN_LIGHT = rgba(217, 184, 130);   // main cardboard color
const TAN_MID   = rgba(190, 155, 100);   // grain / shading
const TAN_DARK  = rgba(120,  90,  55);   // edges, text
const GOLD      = rgba(220, 180,  70);
const BLACK     = rgba( 30,  25,  20);

// ─── Pixel helpers ──────────────────────────────────────────────────
function setPx(img, x, y, color) {
    x = x | 0; y = y | 0;
    if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) img.setPixelColor(color, x, y);
}
function fillCircle(img, cx, cy, r, color) {
    const r2 = r * r;
    const lo = Math.max(0, Math.floor(cx - r));
    const hi = Math.min(SIZE - 1, Math.ceil(cx + r));
    const lo2 = Math.max(0, Math.floor(cy - r));
    const hi2 = Math.min(SIZE - 1, Math.ceil(cy + r));
    for (let y = lo2; y <= hi2; y++)
        for (let x = lo; x <= hi; x++) {
            const dx = x - cx, dy = y - cy;
            if (dx * dx + dy * dy <= r2) setPx(img, x, y, color);
        }
}
function fillRing(img, cx, cy, rOuter, rInner, color) {
    const ro2 = rOuter * rOuter;
    const ri2 = rInner * rInner;
    const lo = Math.max(0, Math.floor(cx - rOuter));
    const hi = Math.min(SIZE - 1, Math.ceil(cx + rOuter));
    const lo2 = Math.max(0, Math.floor(cy - rOuter));
    const hi2 = Math.min(SIZE - 1, Math.ceil(cy + rOuter));
    for (let y = lo2; y <= hi2; y++)
        for (let x = lo; x <= hi; x++) {
            const dx = x - cx, dy = y - cy;
            const d2 = dx * dx + dy * dy;
            if (d2 <= ro2 && d2 >= ri2) setPx(img, x, y, color);
        }
}

// ─── Build the frame ────────────────────────────────────────────────
async function buildFrame() {
    const img = new Jimp({ width: SIZE, height: SIZE, color: TRANSPARENT });

    // Main ring (tan)
    fillRing(img, CX, CY, R_OUTER, R_INNER, TAN_LIGHT);

    // Subtle wood-grain noise across the ring
    const grainCount = 9000;
    for (let i = 0; i < grainCount; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = R_INNER + Math.random() * (R_OUTER - R_INNER);
        const x = CX + r * Math.cos(a);
        const y = CY + r * Math.sin(a);
        setPx(img, x, y, TAN_MID);
    }

    // Outer dark outline
    fillRing(img, CX, CY, R_OUTER_DARK, R_OUTER, TAN_DARK);
    // Inner dark outline
    fillRing(img, CX, CY, R_INNER, R_INNER_DARK, TAN_DARK);

    // 5 puzzle-piece division indicators (radial lines at every 72°)
    const TAB_HALF_PX = 28;       // half-thickness of the divider notch
    const TAB_DEPTH_PX = 60;      // how far the tab/notch extrudes
    for (let i = 0; i < 5; i++) {
        const angle = (i * 72 - 90) * Math.PI / 180;   // start at top, go CW
        const cosA = Math.cos(angle), sinA = Math.sin(angle);
        // Radial divider line
        for (let r = R_INNER_DARK; r <= R_OUTER_DARK; r++) {
            for (let t = -3; t <= 3; t++) {
                const x = CX + r * cosA + t * (-sinA);
                const y = CY + r * sinA + t * cosA;
                setPx(img, x, y, TAN_DARK);
            }
        }
        // Decorative tab (small dark circle outside the line midpoint)
        const midR = (R_INNER + R_OUTER) / 2;
        const tx = CX + midR * cosA;
        const ty = CY + midR * sinA;
        fillCircle(img, tx, ty, 22, TAN_DARK);
        fillCircle(img, tx, ty, 14, TAN_LIGHT);
    }

    // Title text along top of ring (use 64-black font on white-ish stroke)
    const titleFont = await loadFont(path.join(FONT_DIR, "open-sans/open-sans-64-black/open-sans-64-black.fnt"));
    // "PLANET FRAME" centered along the top arc — print flat at top.
    const text = "W . A . R    H . A . M . S    —    PLANET";
    img.print({ font: titleFont, x: CX - 700, y: 80, text });

    // Connection-point letters around inner edge (a..l = 12 markers)
    // Place at every 30° starting from top.
    const letterFont = await loadFont(path.join(FONT_DIR, "open-sans/open-sans-32-white/open-sans-32-white.fnt"));
    const letters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
    const letterR = R_INNER + 50;
    for (let i = 0; i < letters.length; i++) {
        const a = (i * 30 - 90) * Math.PI / 180;
        const lx = CX + letterR * Math.cos(a) - 12;
        const ly = CY + letterR * Math.sin(a) - 18;
        // Draw small dark badge then letter
        fillCircle(img, lx + 12, ly + 18, 28, TAN_DARK);
        img.print({ font: letterFont, x: lx - 4, y: ly - 6, text: letters[i] });
    }

    await img.write(path.join(outDir, "planet-frame.png"));
    console.log(`✅ Planet Frame texture written to ${outDir}/planet-frame.png (${VERSION})`);
}

buildFrame();
