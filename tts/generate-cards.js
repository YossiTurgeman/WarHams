#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Card Image Generator
 * Generates PNG card face images for BAC and Conspire decks.
 *
 * Usage: node generate-cards.js
 * Output: tts/cards/bac_*.png, tts/cards/conspire_*.png
 */

const { Jimp, loadFont } = require("jimp");
const path = require("path");
const fs = require("fs");

const FONT_DIR = path.join(__dirname, "..", "node_modules", "@jimp", "plugin-print", "dist", "fonts", "open-sans");

const CARD_W = 1024;
const CARD_H = 1420;

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

async function main() {
    const fontHuge  = await loadFont(path.join(FONT_DIR, "open-sans-128-white", "open-sans-128-white.fnt"));
    const fontTitle = await loadFont(path.join(FONT_DIR, "open-sans-64-white", "open-sans-64-white.fnt"));
    const fontBody  = await loadFont(path.join(FONT_DIR, "open-sans-64-white", "open-sans-64-white.fnt"));

    const bacBg     = { r: 0x66, g: 0x44, b: 0x00 };
    const bacHeader = { r: 0xCC, g: 0x99, b: 0x33 };
    const conBg     = { r: 0x1A, g: 0x1A, b: 0x44 };
    const conHeader = { r: 0x55, g: 0x33, b: 0xAA };

    const pad = 40;
    const textW = CARD_W - pad * 2;

    // ── BAC FACES ──
    console.log("Generating BAC card images...");
    for (const bac of gameData.basic_armament_cards) {
        const slug = bac.abbr.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
        const img = new Jimp({ width: CARD_W, height: CARD_H, color: rgbaToInt(bacBg.r, bacBg.g, bacBg.b, 255) });

        fillRect(img, 0, 0, CARD_W, 290, bacHeader);
        drawBorder(img, 6, { r: 0xDD, g: 0xBB, b: 0x55 });

        // Title (abbreviation) - huge
        img.print({ font: fontHuge, x: pad, y: 15, text: bac.abbr, maxWidth: textW });
        // Full name
        img.print({ font: fontTitle, x: pad, y: 145, text: bac.name, maxWidth: textW, maxHeight: 140 });

        // Category / Slot / DP
        let y = 310;
        img.print({ font: fontBody, x: pad, y, text: `[${bac.category}]  Slot: ${bac.slot}`, maxWidth: textW });
        y += 80;
        img.print({ font: fontBody, x: pad, y, text: `DP: ${bac.dp}`, maxWidth: textW });
        y += 80;

        // Cost
        const costStr = typeof bac.cost === "string" ? bac.cost : Object.entries(bac.cost).map(([k, v]) => `${v} ${k}`).join(", ");
        img.print({ font: fontBody, x: pad, y, text: `Cost: ${costStr}`, maxWidth: textW });
        y += 90;

        // Divider
        fillRect(img, pad, y, textW, 4, { r: 0xDD, g: 0xBB, b: 0x55 });
        y += 25;

        // Body text
        img.print({ font: fontBody, x: pad, y, text: bac.text, maxWidth: textW, maxHeight: 600 });

        // Special text at bottom if present
        if (bac.special) {
            const specY = CARD_H - 180;
            fillRect(img, pad, specY - 10, textW, 4, { r: 0xDD, g: 0xBB, b: 0x55 });
            img.print({ font: fontBody, x: pad, y: specY + 10, text: `Special: ${bac.special}`, maxWidth: textW, maxHeight: 150 });
        }

        await img.write(path.join(outDir, `bac_${slug}.png`));
        process.stdout.write(".");
    }
    console.log(` ${gameData.basic_armament_cards.length} BAC faces done.`);

    // ── BAC BACK ──
    const bacBack = new Jimp({ width: CARD_W, height: CARD_H, color: rgbaToInt(bacBg.r, bacBg.g, bacBg.b, 255) });
    drawBorder(bacBack, 6, { r: 0xDD, g: 0xBB, b: 0x55 });
    drawBorder2(bacBack, 25, 6, { r: 0xCC, g: 0x99, b: 0x33 });
    fillRect(bacBack, 60, 480, CARD_W - 120, 380, bacHeader);
    bacBack.print({ font: fontHuge, x: pad, y: 500, text: { text: "B.A.C", alignmentX: 2 }, maxWidth: CARD_W - pad * 2 });
    bacBack.print({ font: fontTitle, x: pad, y: 660, text: { text: "Basic Armament", alignmentX: 2 }, maxWidth: CARD_W - pad * 2 });
    bacBack.print({ font: fontTitle, x: pad, y: 740, text: { text: "Card", alignmentX: 2 }, maxWidth: CARD_W - pad * 2 });
    bacBack.print({ font: fontHuge, x: pad, y: 100, text: { text: "W.A.R", alignmentX: 2 }, maxWidth: CARD_W - pad * 2 });
    bacBack.print({ font: fontHuge, x: pad, y: 230, text: { text: "H.A.M.S", alignmentX: 2 }, maxWidth: CARD_W - pad * 2 });
    bacBack.print({ font: fontTitle, x: pad, y: CARD_H - 120, text: { text: "The Battle for Planet X", alignmentX: 2 }, maxWidth: CARD_W - pad * 2 });
    await bacBack.write(path.join(outDir, "bac_back.png"));
    console.log("BAC back done.");

    // ── CONSPIRE FACES ──
    console.log("Generating Conspire card images...");
    for (const cc of gameData.conspire_cards) {
        const slug = cc.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
        const img = new Jimp({ width: CARD_W, height: CARD_H, color: rgbaToInt(conBg.r, conBg.g, conBg.b, 255) });

        fillRect(img, 0, 0, CARD_W, 420, conHeader);
        drawBorder(img, 6, { r: 0x88, g: 0x66, b: 0xDD });

        // Title
        img.print({ font: fontHuge, x: pad, y: 10, text: cc.name, maxWidth: textW, maxHeight: 400 });

        let y = 440;
        // Timing
        img.print({ font: fontBody, x: pad, y, text: `[${cc.timing}]`, maxWidth: textW });
        y += 80;

        // Cost
        const costStr = typeof cc.cost === "string" ? cc.cost : Object.entries(cc.cost).map(([k, v]) => `${v} ${k}`).join(", ");
        img.print({ font: fontBody, x: pad, y, text: `Cost: ${costStr}`, maxWidth: textW });
        y += 90;

        // Divider
        fillRect(img, pad, y, textW, 4, { r: 0x88, g: 0x66, b: 0xDD });
        y += 25;

        // Body text
        img.print({ font: fontBody, x: pad, y, text: cc.text, maxWidth: textW, maxHeight: 600 });

        // Condition at bottom
        if (cc.condition) {
            const condY = CARD_H - 150;
            fillRect(img, pad, condY - 10, textW, 4, { r: 0x88, g: 0x66, b: 0xDD });
            img.print({ font: fontBody, x: pad, y: condY + 10, text: `Req: ${cc.condition}`, maxWidth: textW, maxHeight: 120 });
        }

        await img.write(path.join(outDir, `conspire_${slug}.png`));
        process.stdout.write(".");
    }
    console.log(` ${gameData.conspire_cards.length} Conspire faces done.`);

    // ── CONSPIRE BACK ──
    const conBack = new Jimp({ width: CARD_W, height: CARD_H, color: rgbaToInt(conBg.r, conBg.g, conBg.b, 255) });
    drawBorder(conBack, 6, { r: 0x88, g: 0x66, b: 0xDD });
    drawBorder2(conBack, 25, 6, { r: 0x55, g: 0x33, b: 0xAA });
    fillRect(conBack, 60, 480, CARD_W - 120, 380, conHeader);
    conBack.print({ font: fontHuge, x: pad, y: 500, text: { text: "CONSPIRE", alignmentX: 2 }, maxWidth: CARD_W - pad * 2 });
    conBack.print({ font: fontTitle, x: pad, y: 680, text: { text: "Conspire Card", alignmentX: 2 }, maxWidth: CARD_W - pad * 2 });
    conBack.print({ font: fontHuge, x: pad, y: 100, text: { text: "W.A.R", alignmentX: 2 }, maxWidth: CARD_W - pad * 2 });
    conBack.print({ font: fontHuge, x: pad, y: 230, text: { text: "H.A.M.S", alignmentX: 2 }, maxWidth: CARD_W - pad * 2 });
    conBack.print({ font: fontTitle, x: pad, y: CARD_H - 120, text: { text: "The Battle for Planet X", alignmentX: 2 }, maxWidth: CARD_W - pad * 2 });
    await conBack.write(path.join(outDir, "conspire_back.png"));
    console.log("Conspire back done.");

    console.log("All card images generated in tts/cards/");
}

main().catch(err => { console.error(err); process.exit(1); });
