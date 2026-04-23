#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Squad Board Image Generator
 * Generates PNG squad board images for each player color.
 *
 * Usage: node generate-boards.js
 * Output: tts/cards/squad_board_<color>.png
 */

const { Jimp, loadFont } = require("jimp");
const path = require("path");
const fs = require("fs");

const FONT_DIR = path.join(__dirname, "..", "node_modules", "@jimp", "plugin-print", "dist", "fonts", "open-sans");

// Board dimensions — wide landscape for 7 soldier columns
const BOARD_W = 2800;
const BOARD_H = 340;

const outDir = path.join(__dirname, "cards");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

function rgbaToInt(r, g, b, a) {
    return (((r & 0xFF) << 24) | ((g & 0xFF) << 16) | ((b & 0xFF) << 8) | (a & 0xFF)) >>> 0;
}

function fillRect(img, x, y, w, h, color) {
    const c = rgbaToInt(color.r, color.g, color.b, 255);
    for (let py = y; py < y + h && py < img.height; py++) {
        for (let px = x; px < x + w && px < img.width; px++) {
            img.setPixelColor(c, px, py);
        }
    }
}

function drawRectOutline(img, x, y, w, h, thickness, color) {
    const c = rgbaToInt(color.r, color.g, color.b, 255);
    for (let t = 0; t < thickness; t++) {
        for (let px = x; px < x + w; px++) {
            if (y + t < img.height) img.setPixelColor(c, px, y + t);
            if (y + h - 1 - t >= 0) img.setPixelColor(c, px, y + h - 1 - t);
        }
        for (let py = y; py < y + h; py++) {
            if (x + t < img.width) img.setPixelColor(c, x + t, py);
            if (x + w - 1 - t >= 0) img.setPixelColor(c, x + w - 1 - t, py);
        }
    }
}

const colors = [
    { name: "red",    bg: { r: 0x44, g: 0x11, b: 0x11 }, accent: { r: 0xCC, g: 0x33, b: 0x33 }, light: { r: 0xFF, g: 0x66, b: 0x66 } },
    { name: "blue",   bg: { r: 0x11, g: 0x11, b: 0x44 }, accent: { r: 0x33, g: 0x55, b: 0xCC }, light: { r: 0x66, g: 0x88, b: 0xFF } },
    { name: "green",  bg: { r: 0x11, g: 0x33, b: 0x11 }, accent: { r: 0x33, g: 0x99, b: 0x33 }, light: { r: 0x66, g: 0xCC, b: 0x66 } },
    { name: "yellow", bg: { r: 0x33, g: 0x33, b: 0x11 }, accent: { r: 0xCC, g: 0xAA, b: 0x33 }, light: { r: 0xFF, g: 0xDD, b: 0x66 } },
];

const equipSlots = ["Head", "Chest", "Chest", "Backpack", "Legs", "Hands"];

async function main() {
    const fontTitle = await loadFont(path.join(FONT_DIR, "open-sans-64-white", "open-sans-64-white.fnt"));
    const fontSmall = await loadFont(path.join(FONT_DIR, "open-sans-32-white", "open-sans-32-white.fnt"));
    const fontLabel = await loadFont(path.join(FONT_DIR, "open-sans-16-white", "open-sans-16-white.fnt"));

    for (const pc of colors) {
        const img = new Jimp({ width: BOARD_W, height: BOARD_H, color: rgbaToInt(pc.bg.r, pc.bg.g, pc.bg.b, 255) });

        // Title bar
        fillRect(img, 0, 0, BOARD_W, 50, pc.accent);
        img.print({ font: fontSmall, x: 20, y: 8, text: `SQUAD BOARD`, maxWidth: BOARD_W - 40 });

        // Outer border
        drawRectOutline(img, 0, 0, BOARD_W, BOARD_H, 4, pc.light);

        // 7 soldier columns
        const cols = 7;
        const colPad = 10;
        const startX = colPad;
        const startY = 58;
        const colW = Math.floor((BOARD_W - colPad * 2) / cols);
        const colH = BOARD_H - startY - colPad;

        for (let s = 0; s < cols; s++) {
            const cx = startX + s * colW;

            // Column outline
            drawRectOutline(img, cx, startY, colW - 4, colH, 3, pc.accent);

            // Soldier header
            fillRect(img, cx + 3, startY + 3, colW - 10, 24, pc.accent);
            img.print({ font: fontLabel, x: cx + 8, y: startY + 6, text: `Soldier ${s + 1}`, maxWidth: colW - 20 });

            // Equipment slots (6 slots per soldier)
            const slotStartY = startY + 30;
            const slotH = 28;
            const slotPad = 3;
            for (let e = 0; e < equipSlots.length; e++) {
                const sy = slotStartY + e * (slotH + slotPad);
                // Slot box
                drawRectOutline(img, cx + 6, sy, colW - 16, slotH, 2, pc.light);
                // Slot label
                img.print({ font: fontLabel, x: cx + 10, y: sy + 6, text: equipSlots[e], maxWidth: colW - 24 });
            }
        }

        await img.write(path.join(outDir, `squad_board_${pc.name}.png`));
        console.log(`Squad board: ${pc.name}`);
    }

    console.log("All squad board images generated.");
}

main().catch(err => { console.error(err); process.exit(1); });
