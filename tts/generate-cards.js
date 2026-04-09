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

const CARD_W = 500;
const CARD_H = 700;

const gameData = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "design", "game-data.json"), "utf8"));
const outDir = path.join(__dirname, "cards");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

function wrapText(text, maxChars) {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (const w of words) {
        if (line.length + w.length + 1 > maxChars) {
            lines.push(line);
            line = w;
        } else {
            line = line ? line + " " + w : w;
        }
    }
    if (line) lines.push(line);
    return lines;
}

async function main() {
    const fontTitle = await loadFont(path.join(FONT_DIR, "open-sans-32-white", "open-sans-32-white.fnt"));
    const fontBody = await loadFont(path.join(FONT_DIR, "open-sans-16-white", "open-sans-16-white.fnt"));
    const fontSmall = await loadFont(path.join(FONT_DIR, "open-sans-12-black", "open-sans-12-black.fnt"));

    // BAC card colors
    const bacBg = { r: 0x66, g: 0x44, b: 0x00 };     // dark gold
    const bacHeader = { r: 0xCC, g: 0x99, b: 0x33 };  // gold header
    const conBg = { r: 0x1A, g: 0x1A, b: 0x44 };      // dark purple
    const conHeader = { r: 0x55, g: 0x33, b: 0xAA };   // purple header

    console.log("Generating BAC card images...");
    for (const bac of gameData.basic_armament_cards) {
        const slug = bac.abbr.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
        const img = new Jimp({ width: CARD_W, height: CARD_H, color: rgbaToInt(bacBg.r, bacBg.g, bacBg.b, 255) });

        // Header bar
        fillRect(img, 0, 0, CARD_W, 90, bacHeader);
        // Border
        drawBorder(img, 3, { r: 0xDD, g: 0xBB, b: 0x55 });

        // Title
        img.print({ font: fontTitle, x: 15, y: 10, text: { text: bac.abbr, alignmentX: 2 /* LEFT */ }, maxWidth: CARD_W - 30 });

        // Subtitle
        img.print({ font: fontBody, x: 15, y: 50, text: bac.name, maxWidth: CARD_W - 30 });

        // Category & Slot line
        const catLine = `[${bac.category}]  Slot: ${bac.slot}  DP: ${bac.dp}`;
        img.print({ font: fontBody, x: 15, y: 100, text: catLine, maxWidth: CARD_W - 30 });

        // Cost
        const costStr = typeof bac.cost === "string" ? bac.cost : Object.entries(bac.cost).map(([k, v]) => `${v} ${k}`).join(", ");
        img.print({ font: fontBody, x: 15, y: 130, text: `Cost: ${costStr}`, maxWidth: CARD_W - 30 });

        // Divider
        fillRect(img, 15, 165, CARD_W - 30, 2, { r: 0xDD, g: 0xBB, b: 0x55 });

        // Body text
        const bodyLines = wrapText(bac.text, 40);
        let y = 180;
        for (const line of bodyLines) {
            img.print({ font: fontBody, x: 15, y, text: line, maxWidth: CARD_W - 30 });
            y += 22;
        }

        // Special text if present
        if (bac.special) {
            y += 10;
            fillRect(img, 15, y, CARD_W - 30, 2, { r: 0xDD, g: 0xBB, b: 0x55 });
            y += 10;
            const specLines = wrapText("Special: " + bac.special, 40);
            for (const line of specLines) {
                img.print({ font: fontBody, x: 15, y, text: line, maxWidth: CARD_W - 30 });
                y += 22;
            }
        }

        const outPath = path.join(outDir, `bac_${slug}.png`);
        await img.write(outPath);
        process.stdout.write(".");
    }
    console.log(` ${gameData.basic_armament_cards.length} BAC faces done.`);

    // BAC back
    const bacBack = new Jimp({ width: CARD_W, height: CARD_H, color: rgbaToInt(bacBg.r, bacBg.g, bacBg.b, 255) });
    drawBorder(bacBack, 3, { r: 0xDD, g: 0xBB, b: 0x55 });
    fillRect(bacBack, 50, 250, CARD_W - 100, 80, bacHeader);
    bacBack.print({ font: fontTitle, x: 15, y: 265, text: { text: "B.A.C", alignmentX: 1 /* CENTER */ }, maxWidth: CARD_W - 30 });
    bacBack.print({ font: fontBody, x: 15, y: 310, text: { text: "Basic Armament Card", alignmentX: 1 }, maxWidth: CARD_W - 30 });
    await bacBack.write(path.join(outDir, "bac_back.png"));

    console.log("Generating Conspire card images...");
    for (const cc of gameData.conspire_cards) {
        const slug = cc.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
        const img = new Jimp({ width: CARD_W, height: CARD_H, color: rgbaToInt(conBg.r, conBg.g, conBg.b, 255) });

        // Header bar
        fillRect(img, 0, 0, CARD_W, 70, conHeader);
        drawBorder(img, 3, { r: 0x88, g: 0x66, b: 0xDD });

        // Title
        img.print({ font: fontTitle, x: 15, y: 10, text: { text: cc.name, alignmentX: 2 }, maxWidth: CARD_W - 30 });

        // Timing
        img.print({ font: fontBody, x: 15, y: 80, text: `[${cc.timing}]`, maxWidth: CARD_W - 30 });

        // Cost
        const costStr = typeof cc.cost === "string" ? cc.cost : Object.entries(cc.cost).map(([k, v]) => `${v} ${k}`).join(", ");
        img.print({ font: fontBody, x: 15, y: 110, text: `Cost: ${costStr}`, maxWidth: CARD_W - 30 });

        // Divider
        fillRect(img, 15, 145, CARD_W - 30, 2, { r: 0x88, g: 0x66, b: 0xDD });

        // Body text
        const bodyLines = wrapText(cc.text, 40);
        let y = 160;
        for (const line of bodyLines) {
            img.print({ font: fontBody, x: 15, y, text: line, maxWidth: CARD_W - 30 });
            y += 22;
        }

        // Condition if present
        if (cc.condition) {
            y += 10;
            fillRect(img, 15, y, CARD_W - 30, 2, { r: 0x88, g: 0x66, b: 0xDD });
            y += 10;
            img.print({ font: fontBody, x: 15, y, text: `Condition: ${cc.condition}`, maxWidth: CARD_W - 30 });
        }

        const outPath = path.join(outDir, `conspire_${slug}.png`);
        await img.write(outPath);
        process.stdout.write(".");
    }
    console.log(` ${gameData.conspire_cards.length} Conspire faces done.`);

    // Conspire back
    const conBack = new Jimp({ width: CARD_W, height: CARD_H, color: rgbaToInt(conBg.r, conBg.g, conBg.b, 255) });
    drawBorder(conBack, 3, { r: 0x88, g: 0x66, b: 0xDD });
    fillRect(conBack, 50, 250, CARD_W - 100, 80, conHeader);
    conBack.print({ font: fontTitle, x: 15, y: 260, text: { text: "CONSPIRE", alignmentX: 1 }, maxWidth: CARD_W - 30 });
    conBack.print({ font: fontBody, x: 15, y: 305, text: { text: "Conspire Card", alignmentX: 1 }, maxWidth: CARD_W - 30 });
    await conBack.write(path.join(outDir, "conspire_back.png"));

    console.log("All card images generated in tts/cards/");
}

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

main().catch(err => { console.error(err); process.exit(1); });
