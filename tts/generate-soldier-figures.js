#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Soldier Diffuse Texture Generator (v33)
 *
 * Generates 112 diffuse textures (4 player colors × 4 squads × 7 soldiers)
 * for the shared procedural soldier mesh `tts/models/hams-soldier.obj`.
 *
 * UV layout — must match generate-soldier-obj.js:
 *   • Top half  (v: 0.5–1.0) → base disc viewed from above. Carries the
 *     squad letter + soldier number label (A1–A7, B1–B7, C1–C7, D1–D7)
 *     and 3 blood-drop divots.
 *   • Bottom half (v: 0.0–0.5) → solid player color. Used by every body,
 *     head, arm, and base-rim/bottom face.
 *
 * Each texture is 512×512 PNG, RGBA. Player colors match the rulebook.
 *
 * Usage:  node generate-soldier-figures.js
 * Output: tts/cards/soldier_<color>_<id>.png
 */

const { Jimp, loadFont } = require("jimp");
const path = require("path");
const fs = require("fs");

const W = 512;
const H = 512;
const HALF = H / 2;

// Base-top region lives in the TOP half of the texture.
// In the OBJ, top-half UVs are (u: 0..1, v: 0.5..1.0) → image y: 0..256.
// The base disc UV is centered at u=0.5, v=0.75 with radius 0.5×0.5 = 0.25
// in u and 0.25 in v → image radius 128 in x and 64 in y (an ellipse-shaped
// patch). We draw the disc as a circle (256 px) so it tiles cleanly even
// though the UV is squashed; the rendered base will appear circular from
// above because the OBJ vertices are placed on a true circle.
const BASE_CX = W / 2;
const BASE_CY = HALF / 2;          // y=128 (centered in top half)
const BASE_R  = HALF / 2 - 8;      // 120 — fits in top half with margin

// ── Player palette ─────────────────────────────────────────────
const colors = [
    { name: "red",    fill: { r: 0xCC, g: 0x33, b: 0x33 }, edge: { r: 0x55, g: 0x10, b: 0x10 }, dark: false },
    { name: "blue",   fill: { r: 0x33, g: 0x55, b: 0xCC }, edge: { r: 0x10, g: 0x18, b: 0x55 }, dark: false },
    { name: "green",  fill: { r: 0x33, g: 0x99, b: 0x33 }, edge: { r: 0x10, g: 0x40, b: 0x10 }, dark: false },
    { name: "yellow", fill: { r: 0xE8, g: 0xC8, b: 0x33 }, edge: { r: 0x60, g: 0x50, b: 0x10 }, dark: true },
];
const SQUAD_LETTERS = ["A", "B", "C", "D"];
const FONT_DIR = path.join(__dirname, "..", "node_modules", "@jimp", "plugin-print", "dist", "fonts");

// ── Pixel helpers ─────────────────────────────────────────────
function rgba(c, a = 255) {
    return (((c.r & 0xFF) << 24) | ((c.g & 0xFF) << 16) | ((c.b & 0xFF) << 8) | (a & 0xFF)) >>> 0;
}
function setPx(img, x, y, color, a = 255) {
    if (x < 0 || y < 0 || x >= img.bitmap.width || y >= img.bitmap.height) return;
    img.setPixelColor(rgba(color, a), x, y);
}
function fillRect(img, x1, y1, x2, y2, color) {
    for (let y = Math.max(0, y1); y <= Math.min(img.bitmap.height - 1, y2); y++)
        for (let x = Math.max(0, x1); x <= Math.min(img.bitmap.width - 1, x2); x++)
            img.setPixelColor(rgba(color), x, y);
}
function fillCircle(img, cx, cy, r, color) {
    for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(img.bitmap.height - 1, Math.ceil(cy + r)); y++) {
        for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(img.bitmap.width - 1, Math.ceil(cx + r)); x++) {
            const dx = x - cx, dy = y - cy;
            if (dx * dx + dy * dy <= r * r) img.setPixelColor(rgba(color), x, y);
        }
    }
}
function fillRing(img, cx, cy, rOuter, rInner, color) {
    for (let y = Math.max(0, Math.floor(cy - rOuter)); y <= Math.min(img.bitmap.height - 1, Math.ceil(cy + rOuter)); y++) {
        for (let x = Math.max(0, Math.floor(cx - rOuter)); x <= Math.min(img.bitmap.width - 1, Math.ceil(cx + rOuter)); x++) {
            const dx = x - cx, dy = y - cy;
            const d2 = dx * dx + dy * dy;
            if (d2 <= rOuter * rOuter && d2 >= rInner * rInner) img.setPixelColor(rgba(color), x, y);
        }
    }
}

// ── Build a single soldier texture ────────────────────────────
async function buildTexture(color, squadLetter, soldierNum) {
    const img = new Jimp({ width: W, height: H, color: rgba({ r: 0, g: 0, b: 0 }, 0) });

    // ── Bottom half: SOLID PLAYER COLOR ─────────────────────────
    // This region is sampled by every body / head / arm / base-rim face.
    fillRect(img, 0, HALF, W - 1, H - 1, color.fill);
    // Subtle horizontal shading band for visual depth
    for (let y = HALF; y < H; y++) {
        const t = (y - HALF) / HALF; // 0..1 from middle to bottom
        const shade = {
            r: Math.max(0, Math.round(color.fill.r * (1 - 0.18 * t))),
            g: Math.max(0, Math.round(color.fill.g * (1 - 0.18 * t))),
            b: Math.max(0, Math.round(color.fill.b * (1 - 0.18 * t))),
        };
        fillRect(img, 0, y, W - 1, y, shade);
    }

    // ── Top half: BASE DISC TOP VIEW ────────────────────────────
    // v37: solid player color only — no painted rim ring or highlight
    // ellipse. (The disc UV is squashed vertically, so circles drawn
    // in image space appeared as vertical ellipses on the rendered
    // base. The 3D divot wells provide the only base detail.)
    fillRect(img, 0, 0, W - 1, HALF - 1, color.fill);

    // Red swatch sampled by the divot well INTERIORS so the 3D sockets
    // on the OBJ read as blood-filled. Image x∈[0,32], y∈[260,290].
    fillRect(img, 0, HALF + 4, 32, HALF + 34, { r: 0xC8, g: 0x10, b: 0x10 });

    // ── Squad letter + soldier number label ─────────────────────
    // v39: 64px font, centered on the BACK half of the base disc
    // (opposite the 3 divots which sit on the +Z front edge). In
    // image space this is BASE_CY + ~50 — UV t ≈ 0.59 → world z
    // around -0.4, well into the rear of the disc.
    const id = `${squadLetter}${soldierNum}`;
    const fontFile = color.dark
        ? "open-sans/open-sans-64-black/open-sans-64-black.fnt"
        : "open-sans/open-sans-64-white/open-sans-64-white.fnt";
    const font = await loadFont(path.join(FONT_DIR, fontFile));
    img.print({
        font,
        x: 0,
        y: 168,                     // glyph cap-line; center near image y≈200 — sits in the empty back half of the disc behind the legs
        text: { text: id, alignmentX: 2 /* HorizontalAlign.CENTER (1=LEFT, 2=CENTER) */ },
        maxWidth: W,
    });

    return img;
}

// Versioned output dir matches SOLDIER_BASE in generate-save.js.
// Bumping VERSION forces TTS to fetch from a brand-new URL path
// (TTS strips ?query strings, so the older cache-bust technique
// no longer works for these assets).
const VERSION = "v46";
(async () => {
    const outDir = path.join(__dirname, VERSION);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    let count = 0;
    for (const color of colors) {
        for (const squadLetter of SQUAD_LETTERS) {
            for (let n = 1; n <= 7; n++) {
                const img = await buildTexture(color, squadLetter, n);
                const fileName = `soldier_${color.name}_${squadLetter}${n}.png`;
                await img.write(path.join(outDir, fileName));
                count++;
            }
        }
    }
    console.log(`Generated ${count} soldier diffuse textures (512×512) in ${outDir}`);
})();
