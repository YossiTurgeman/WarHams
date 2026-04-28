#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Custom Table Surface Generator
 * Outputs a large sci-fi metallic grid floor PNG used as the playing surface
 * (placed in the save as a locked Custom_Tile at y=0 with Table_None).
 *
 * Usage: node generate-table.js
 * Output: tts/cards/table_surface.png
 */
const { Jimp } = require("jimp");
const path = require("path");
const fs = require("fs");

const W = 2048;
const H = 1536;     // 2048:1536 ≈ 4:3 matches the 108:76 table aspect
const outDir = path.join(__dirname, "cards");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

function rgba(r, g, b, a = 255) {
    return (((r & 0xFF) << 24) | ((g & 0xFF) << 16) | ((b & 0xFF) << 8) | (a & 0xFF)) >>> 0;
}

const BG       = { r: 0x18, g: 0x1c, b: 0x22 };
const PANEL    = { r: 0x22, g: 0x28, b: 0x30 };
const GRID     = { r: 0x35, g: 0x42, b: 0x52 };
const ACCENT   = { r: 0x44, g: 0xaa, b: 0xff };
const RIVET    = { r: 0x55, g: 0x60, b: 0x70 };

function setPx(img, x, y, c, a = 255) {
    if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
    img.setPixelColor(rgba(c.r, c.g, c.b, a), x, y);
}
function fillRect(img, x, y, w, h, c) {
    for (let py = y; py < y + h; py++)
        for (let px = x; px < x + w; px++)
            setPx(img, px, py, c);
}
function drawHLine(img, x, y, w, c) {
    for (let px = x; px < x + w; px++) setPx(img, px, y, c);
}
function drawVLine(img, x, y, h, c) {
    for (let py = y; py < y + h; py++) setPx(img, x, py, c);
}
function fillCircle(img, cx, cy, r, c) {
    for (let py = cy - r; py <= cy + r; py++)
        for (let px = cx - r; px <= cx + r; px++) {
            const dx = px - cx, dy = py - cy;
            if (dx * dx + dy * dy <= r * r) setPx(img, px, py, c);
        }
}

async function main() {
    const img = new Jimp({ width: W, height: H, color: rgba(BG.r, BG.g, BG.b, 255) });

    // Outer panel border (slightly lighter than bg)
    const PAD = 24;
    fillRect(img, PAD, PAD, W - 2 * PAD, H - 2 * PAD, PANEL);

    // Grid lines (every 64 px)
    const STEP = 64;
    for (let x = PAD; x <= W - PAD; x += STEP) drawVLine(img, x, PAD, H - 2 * PAD, GRID);
    for (let y = PAD; y <= H - PAD; y += STEP) drawHLine(img, PAD, y, W - 2 * PAD, GRID);

    // Major grid lines (every 256 px) in accent
    for (let x = PAD; x <= W - PAD; x += STEP * 4) {
        for (let t = -1; t <= 1; t++) drawVLine(img, x + t, PAD, H - 2 * PAD, ACCENT);
    }
    for (let y = PAD; y <= H - PAD; y += STEP * 4) {
        for (let t = -1; t <= 1; t++) drawHLine(img, PAD, y + t, W - 2 * PAD, ACCENT);
    }

    // Decorative rivets at the corners of major grid cells
    for (let x = PAD; x <= W - PAD; x += STEP * 4) {
        for (let y = PAD; y <= H - PAD; y += STEP * 4) {
            fillCircle(img, x, y, 5, RIVET);
        }
    }

    // Outer trim
    const TRIM = 12;
    for (let t = 0; t < TRIM; t++) {
        drawHLine(img, t, t, W - 2 * t, ACCENT);
        drawHLine(img, t, H - 1 - t, W - 2 * t, ACCENT);
        drawVLine(img, t, t, H - 2 * t, ACCENT);
        drawVLine(img, W - 1 - t, t, H - 2 * t, ACCENT);
    }

    await img.write(path.join(outDir, "table_surface.png"));
    console.log(`Wrote table_surface.png (${W}x${H})`);
}

main().catch(err => { console.error(err); process.exit(1); });
