#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Flag Token Image Generator
 * Generates PNG flag images (transparent bg) for Custom_Token flag pieces.
 * The pole + flag silhouette is the only opaque region; TTS extrudes that
 * shape into a 3D flag-shaped token via Custom_Token.
 *
 * Usage: node generate-flags.js
 * Output: tts/cards/flag_<color>.png
 */

const { Jimp } = require("jimp");
const path = require("path");
const fs = require("fs");

const W = 512;
const H = 512;

// Pole geometry (thin vertical bar on the left)
const POLE_X = 60;
const POLE_W = 18;
const POLE_TOP = 30;
const POLE_BOTTOM = 470;

// Flag geometry (rectangle attached to top of pole, with V-cut tail)
const FLAG_LEFT = POLE_X + POLE_W;
const FLAG_TOP = 50;
const FLAG_RIGHT = 360;
const FLAG_BOTTOM = 230;
const FLAG_TAIL_X = 320;     // V-cut starts here on the right
const FLAG_TAIL_DEPTH = 30;  // how deep the notch cuts in

const POLE_COLOR = { r: 0x88, g: 0x88, b: 0x90 };
const POLE_OUTLINE = { r: 0x33, g: 0x33, b: 0x38 };
const POLE_TIP_COLOR = { r: 0xDD, g: 0xCC, b: 0x44 }; // gold ball at top

const colors = [
    { name: "red",    fill: { r: 0xCC, g: 0x33, b: 0x33 }, edge: { r: 0x55, g: 0x10, b: 0x10 } },
    { name: "blue",   fill: { r: 0x33, g: 0x55, b: 0xCC }, edge: { r: 0x10, g: 0x18, b: 0x55 } },
    { name: "green",  fill: { r: 0x33, g: 0x99, b: 0x33 }, edge: { r: 0x10, g: 0x40, b: 0x10 } },
    { name: "yellow", fill: { r: 0xE8, g: 0xC8, b: 0x33 }, edge: { r: 0x60, g: 0x50, b: 0x10 } },
];

const outDir = path.join(__dirname, "cards");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

function rgbaToInt(r, g, b, a) {
    return (((r & 0xFF) << 24) | ((g & 0xFF) << 16) | ((b & 0xFF) << 8) | (a & 0xFF)) >>> 0;
}

function setPx(img, x, y, color, a = 255) {
    if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
    img.setPixelColor(rgbaToInt(color.r, color.g, color.b, a), x, y);
}

function fillRect(img, x, y, w, h, color) {
    for (let py = y; py < y + h; py++)
        for (let px = x; px < x + w; px++)
            setPx(img, px, py, color);
}

function drawRectOutline(img, x, y, w, h, thickness, color) {
    for (let t = 0; t < thickness; t++) {
        for (let px = x; px < x + w; px++) {
            setPx(img, px, y + t, color);
            setPx(img, px, y + h - 1 - t, color);
        }
        for (let py = y; py < y + h; py++) {
            setPx(img, x + t, py, color);
            setPx(img, x + w - 1 - t, py, color);
        }
    }
}

function fillCircle(img, cx, cy, r, color) {
    for (let py = cy - r; py <= cy + r; py++) {
        for (let px = cx - r; px <= cx + r; px++) {
            const dx = px - cx, dy = py - cy;
            if (dx * dx + dy * dy <= r * r) setPx(img, px, py, color);
        }
    }
}

// Fill flag with V-notch tail on the right edge
function fillFlagShape(img, color) {
    const flagH = FLAG_BOTTOM - FLAG_TOP;
    const midY = FLAG_TOP + flagH / 2;
    for (let py = FLAG_TOP; py < FLAG_BOTTOM; py++) {
        // For each row, the right edge moves inward from FLAG_RIGHT toward
        // FLAG_RIGHT - FLAG_TAIL_DEPTH at the vertical middle (V-cut).
        let rightEdge = FLAG_RIGHT;
        if (py >= FLAG_TOP && py < FLAG_BOTTOM) {
            const distFromMid = Math.abs(py - midY);
            const halfH = flagH / 2;
            // Tail cut only past FLAG_TAIL_X
            const cutFraction = 1 - distFromMid / halfH; // 1 at mid, 0 at edges
            const cut = FLAG_TAIL_DEPTH * cutFraction;
            rightEdge = FLAG_RIGHT - cut;
        }
        for (let px = FLAG_LEFT; px < rightEdge; px++) {
            setPx(img, px, py, color);
        }
    }
}

// Outline the flag silhouette (V-notch right edge)
function outlineFlagShape(img, color, thickness) {
    const flagH = FLAG_BOTTOM - FLAG_TOP;
    const midY = FLAG_TOP + flagH / 2;
    // Top and bottom edges
    for (let t = 0; t < thickness; t++) {
        for (let px = FLAG_LEFT; px < FLAG_RIGHT; px++) {
            setPx(img, px, FLAG_TOP + t, color);
            setPx(img, px, FLAG_BOTTOM - 1 - t, color);
        }
    }
    // Left edge (against pole) — short vertical line
    for (let t = 0; t < thickness; t++) {
        for (let py = FLAG_TOP; py < FLAG_BOTTOM; py++) {
            setPx(img, FLAG_LEFT + t, py, color);
        }
    }
    // Right V-notch edge
    for (let py = FLAG_TOP; py < FLAG_BOTTOM; py++) {
        const distFromMid = Math.abs(py - midY);
        const halfH = flagH / 2;
        const cutFraction = 1 - distFromMid / halfH;
        const cut = FLAG_TAIL_DEPTH * cutFraction;
        const edgeX = Math.round(FLAG_RIGHT - cut);
        for (let t = 0; t < thickness; t++) {
            setPx(img, edgeX - t, py, color);
        }
    }
}

async function main() {
    for (const pc of colors) {
        // Fully transparent canvas
        const img = new Jimp({ width: W, height: H, color: 0x00000000 });

        // Flag fill
        fillFlagShape(img, pc.fill);
        // Flag outline (dark)
        outlineFlagShape(img, pc.edge, 4);

        // Pole body
        fillRect(img, POLE_X, POLE_TOP, POLE_W, POLE_BOTTOM - POLE_TOP, POLE_COLOR);
        // Pole outline
        drawRectOutline(img, POLE_X, POLE_TOP, POLE_W, POLE_BOTTOM - POLE_TOP, 2, POLE_OUTLINE);
        // Gold ball at pole tip
        fillCircle(img, POLE_X + Math.floor(POLE_W / 2), POLE_TOP, 14, POLE_TIP_COLOR);
        fillCircle(img, POLE_X + Math.floor(POLE_W / 2), POLE_TOP, 14, POLE_OUTLINE);
        // (refill interior so we keep a solid ball with thin outline)
        fillCircle(img, POLE_X + Math.floor(POLE_W / 2), POLE_TOP, 11, POLE_TIP_COLOR);

        // Pole base — small flared foot so it stands nicely
        fillRect(img, POLE_X - 8, POLE_BOTTOM - 6, POLE_W + 16, 12, POLE_COLOR);
        drawRectOutline(img, POLE_X - 8, POLE_BOTTOM - 6, POLE_W + 16, 12, 2, POLE_OUTLINE);

        await img.write(path.join(outDir, `flag_${pc.name}.png`));
        console.log(`Flag: ${pc.name}`);
    }
    console.log("All flag images generated.");
}

main().catch(err => { console.error(err); process.exit(1); });
