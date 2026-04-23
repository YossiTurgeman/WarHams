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

// Column width sized to fit "Backpack" label + small padding (4x res for sharp text)
const COL_W = 400;
const COLS = 7;
const COL_GAP = 16;
const PAD = 24;
const TITLE_H = 80;
const HEADER_H = 70;
const SLOT_H = 80;
const SLOT_PAD = 8;
const DMG_LABEL_H = 60;
const DMG_BOX_H = 60;
const DMG_BOX_PAD = 8;

const equipSlots = ["Head", "Chest", "Chest", "Backpack", "Legs", "Hands"];

// Calculate exact dimensions
const BOARD_W = PAD + COLS * COL_W + (COLS - 1) * COL_GAP + PAD;
const COL_START_Y = PAD + TITLE_H + 4;
const COL_CONTENT_H = HEADER_H + 2 + equipSlots.length * (SLOT_H + SLOT_PAD) + DMG_LABEL_H + DMG_BOX_H + DMG_BOX_PAD;
const BOARD_H = COL_START_Y + COL_CONTENT_H + PAD;

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

async function main() {
    const fontLabel = await loadFont(path.join(FONT_DIR, "open-sans-64-white", "open-sans-64-white.fnt"));
    const fontSmall = await loadFont(path.join(FONT_DIR, "open-sans-32-white", "open-sans-32-white.fnt"));

    console.log(`Board dimensions: ${BOARD_W} x ${BOARD_H}`);

    for (const pc of colors) {
        const img = new Jimp({ width: BOARD_W, height: BOARD_H, color: rgbaToInt(pc.bg.r, pc.bg.g, pc.bg.b, 255) });

        // Title bar
        fillRect(img, 0, 0, BOARD_W, PAD + TITLE_H, pc.accent);
        img.print({ font: fontLabel, x: PAD, y: PAD + 6, text: `SQUAD BOARD`, maxWidth: BOARD_W - PAD * 2 });

        // Outer border
        drawRectOutline(img, 0, 0, BOARD_W, BOARD_H, 6, pc.light);

        for (let s = 0; s < COLS; s++) {
            const cx = PAD + s * (COL_W + COL_GAP);
            const colH = COL_CONTENT_H;

            // Column outline
            drawRectOutline(img, cx, COL_START_Y, COL_W, colH, 4, pc.accent);

            // Soldier header
            fillRect(img, cx + 4, COL_START_Y + 4, COL_W - 8, HEADER_H, pc.accent);
            img.print({ font: fontSmall, x: cx + 12, y: COL_START_Y + 20, text: `Soldier ${s + 1}`, maxWidth: COL_W - 24 });

            // Equipment slots
            let sy = COL_START_Y + HEADER_H + 4;
            for (let e = 0; e < equipSlots.length; e++) {
                drawRectOutline(img, cx + 12, sy, COL_W - 24, SLOT_H, 3, pc.light);
                img.print({ font: fontSmall, x: cx + 20, y: sy + 22, text: equipSlots[e], maxWidth: COL_W - 40 });
                sy += SLOT_H + SLOT_PAD;
            }

            // Damage track
            img.print({ font: fontSmall, x: cx + 12, y: sy + 10, text: "DMG", maxWidth: COL_W - 24 });
            sy += DMG_LABEL_H;
            const dmgBoxW = Math.floor((COL_W - 40) / 3);
            for (let d = 0; d < 3; d++) {
                drawRectOutline(img, cx + 12 + d * (dmgBoxW + 6), sy, dmgBoxW, DMG_BOX_H, 3, pc.light);
            }
        }

        await img.write(path.join(outDir, `squad_board_${pc.name}.png`));
        console.log(`Squad board: ${pc.name}`);
    }

    console.log("All squad board images generated.");
}

main().catch(err => { console.error(err); process.exit(1); });
