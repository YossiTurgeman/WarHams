#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Card Image Generator
 * Generates PNG card face images for BAC and Conspire decks.
 * Uses jimp with built-in bitmap fonts.
 *
 * Usage: node generate-cards.js
 * Output: tts/cards/bac_*.png, tts/cards/conspire_*.png
 */

const { Jimp, loadFont } = require("jimp");
const path = require("path");
const fs = require("fs");

const FONT_DIR = path.join(__dirname, "..", "node_modules", "@jimp", "plugin-print", "dist", "fonts", "open-sans");

const CARD_W = 750;
const CARD_H = 1050;

const gameData = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "design", "game-data.json"), "utf8"));
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

function drawBorder(img, thickness, color) {
    const c = rgbaToInt(color.r, color.g, color.b, 255);
    for (let t = 0; t < thickness; t++) {
        for (let x = 0; x < img.width; x++) {
            img.setPixelColor(c, x, t);
            img.setPixelColor(c, x, img.height - 1 - t);
        }
        for (let y = 0; y < img.height; y++) {
            img.setPixelColor(c, t, y);
            img.setPixelColor(c, img.width - 1 - t, y);
        }
    }
}

async function main() {
    const fontHuge   = await loadFont(path.join(FONT_DIR, "open-sans-128-white", "open-sans-128-white.fnt"));
    const fontTitle  = await loadFont(path.join(FONT_DIR, "open-sans-64-white", "open-sans-64-white.fnt"));
    const fontBody   = await loadFont(path.join(FONT_DIR, "open-sans-32-white", "open-sans-32-white.fnt"));

    const bacBg     = { r: 0x66, g: 0x44, b: 0x00 };
    const bacHeader = { r: 0xCC, g: 0x99, b: 0x33 };
    const conBg     = { r: 0x1A, g: 0x1A, b: 0x44 };
    const conHeader = { r: 0x55, g: 0x33, b: 0xAA };

    const pad = 30;
    const textW = CARD_W - pad * 2;

    // ── BAC FACES ──
    console.log("Generating BAC card images...");
    for (const bac of gameData.basic_armament_cards) {
        const slug = bac.abbr.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
        const img = new Jimp({ width: CARD_W, height: CARD_H, color: rgbaToInt(bacBg.r, bacBg.g, bacBg.b, 255) });

        fillRect(img, 0, 0, CARD_W, 140, bacHeader);
        drawBorder(img, 5, { r: 0xDD, g: 0xBB, b: 0x55 });

        // Title (abbreviation)
        img.print({ font: fontTitle, x: pad, y: 15, text: bac.abbr, maxWidth: textW });
        // Subtitle (full name)
        img.print({ font: fontBody, x: pad, y: 85, text: bac.name, maxWidth: textW });

        // Category / Slot / DP
        let y = 160;
        img.print({ font: fontBody, x: pad, y, text: `[${bac.category}]  Slot: ${bac.slot}  DP: ${bac.dp}`, maxWidth: textW });
        y += 45;

        // Cost
        const costStr = typeof bac.cost === "string" ? bac.cost : Object.entries(bac.cost).map(([k, v]) => `${v} ${k}`).join(", ");
        img.print({ font: fontBody, x: pad, y, text: `Cost: ${costStr}`, maxWidth: textW });
        y += 50;

        // Divider
        fillRect(img, pad, y, textW, 3, { r: 0xDD, g: 0xBB, b: 0x55 });
        y += 20;

        // Body text (auto-wraps via maxWidth)
        img.print({ font: fontBody, x: pad, y, text: bac.text, maxWidth: textW, maxHeight: 400 });
        y += Math.ceil(bac.text.length / 28) * 40 + 20;

        // Special text
        if (bac.special) {
            fillRect(img, pad, y, textW, 3, { r: 0xDD, g: 0xBB, b: 0x55 });
            y += 15;
            img.print({ font: fontBody, x: pad, y, text: `Special: ${bac.special}`, maxWidth: textW, maxHeight: 150 });
        }

        await img.write(path.join(outDir, `bac_${slug}.png`));
        process.stdout.write(".");
    }
    console.log(` ${gameData.basic_armament_cards.length} BAC faces done.`);

    // ── BAC BACK ──
    const bacBack = new Jimp({ width: CARD_W, height: CARD_H, color: rgbaToInt(bacBg.r, bacBg.g, bacBg.b, 255) });
    drawBorder(bacBack, 5, { r: 0xDD, g: 0xBB, b: 0x55 });
    drawBorder2(bacBack, 20, 5, { r: 0xCC, g: 0x99, b: 0x33 });
    fillRect(bacBack, 50, 350, CARD_W - 100, 280, bacHeader);
    bacBack.print({ font: fontHuge, x: pad, y: 370, text: { text: "B.A.C", alignmentX: 2 }, maxWidth: CARD_W - pad * 2 });
    bacBack.print({ font: fontTitle, x: pad, y: 510, text: { text: "Basic Armament", alignmentX: 2 }, maxWidth: CARD_W - pad * 2 });
    bacBack.print({ font: fontBody, x: pad, y: 580, text: { text: "Card", alignmentX: 2 }, maxWidth: CARD_W - pad * 2 });
    bacBack.print({ font: fontTitle, x: pad, y: 80, text: { text: "W.A.R H.A.M.S", alignmentX: 2 }, maxWidth: CARD_W - pad * 2 });
    bacBack.print({ font: fontBody, x: pad, y: CARD_H - 90, text: { text: "The Battle for Planet X", alignmentX: 2 }, maxWidth: CARD_W - pad * 2 });
    await bacBack.write(path.join(outDir, "bac_back.png"));
    console.log("BAC back done.");

    // ── CONSPIRE FACES ──
    console.log("Generating Conspire card images...");
    for (const cc of gameData.conspire_cards) {
        const slug = cc.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
        const img = new Jimp({ width: CARD_W, height: CARD_H, color: rgbaToInt(conBg.r, conBg.g, conBg.b, 255) });

        fillRect(img, 0, 0, CARD_W, 120, conHeader);
        drawBorder(img, 5, { r: 0x88, g: 0x66, b: 0xDD });

        // Title
        img.print({ font: fontTitle, x: pad, y: 15, text: cc.name, maxWidth: textW, maxHeight: 100 });

        let y = 140;
        // Timing
        img.print({ font: fontBody, x: pad, y, text: `[${cc.timing}]`, maxWidth: textW });
        y += 45;

        // Cost
        const costStr = typeof cc.cost === "string" ? cc.cost : Object.entries(cc.cost).map(([k, v]) => `${v} ${k}`).join(", ");
        img.print({ font: fontBody, x: pad, y, text: `Cost: ${costStr}`, maxWidth: textW });
        y += 50;

        // Divider
        fillRect(img, pad, y, textW, 3, { r: 0x88, g: 0x66, b: 0xDD });
        y += 20;

        // Body text
        img.print({ font: fontBody, x: pad, y, text: cc.text, maxWidth: textW, maxHeight: 500 });
        y += Math.ceil(cc.text.length / 28) * 40 + 20;

        // Condition
        if (cc.condition) {
            fillRect(img, pad, y, textW, 3, { r: 0x88, g: 0x66, b: 0xDD });
            y += 15;
            img.print({ font: fontBody, x: pad, y, text: `Req: ${cc.condition}`, maxWidth: textW, maxHeight: 100 });
        }

        await img.write(path.join(outDir, `conspire_${slug}.png`));
        process.stdout.write(".");
    }
    console.log(` ${gameData.conspire_cards.length} Conspire faces done.`);

    // ── CONSPIRE BACK ──
    const conBack = new Jimp({ width: CARD_W, height: CARD_H, color: rgbaToInt(conBg.r, conBg.g, conBg.b, 255) });
    drawBorder(conBack, 5, { r: 0x88, g: 0x66, b: 0xDD });
    drawBorder2(conBack, 20, 5, { r: 0x55, g: 0x33, b: 0xAA });
    fillRect(conBack, 50, 350, CARD_W - 100, 280, conHeader);
    conBack.print({ font: fontTitle, x: pad, y: 390, text: { text: "CONSPIRE", alignmentX: 2 }, maxWidth: CARD_W - pad * 2 });
    conBack.print({ font: fontBody, x: pad, y: 480, text: { text: "Conspire Card", alignmentX: 2 }, maxWidth: CARD_W - pad * 2 });
    conBack.print({ font: fontTitle, x: pad, y: 80, text: { text: "W.A.R H.A.M.S", alignmentX: 2 }, maxWidth: CARD_W - pad * 2 });
    conBack.print({ font: fontBody, x: pad, y: CARD_H - 90, text: { text: "The Battle for Planet X", alignmentX: 2 }, maxWidth: CARD_W - pad * 2 });
    await conBack.write(path.join(outDir, "conspire_back.png"));
    console.log("Conspire back done.");

    console.log("All card images generated in tts/cards/");
}

// Inner border offset from edge
function drawBorder2(img, offset, thickness, color) {
    const c = rgbaToInt(color.r, color.g, color.b, 255);
    for (let t = 0; t < thickness; t++) {
        const o = offset + t;
        for (let x = o; x < img.width - o; x++) {
            img.setPixelColor(c, x, o);
            img.setPixelColor(c, x, img.height - 1 - o);
        }
        for (let y = o; y < img.height - o; y++) {
            img.setPixelColor(c, o, y);
            img.setPixelColor(c, img.width - 1 - o, y);
        }
    }
}

main().catch(err => { console.error(err); process.exit(1); });
