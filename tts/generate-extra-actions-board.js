#!/usr/bin/env node
/**
 * W.A.R H.A.M.S -- Extra Actions Reference Board Generator
 *
 * A visible reference board listing every Squad Action with key rules.
 * Replaces the old Quick Reference PDF book on the TTS table.
 *
 * Usage:   node generate-extra-actions-board.js
 * Outputs: tts/v72/extra-actions-board.png
 */

const path = require("path");
const fs = require("fs");
const { Jimp, loadFont } = require("jimp");

const VERSION = "v72";
const outDir = path.join(__dirname, VERSION);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const FONT_DIR = path.join(__dirname, "..", "node_modules", "@jimp", "plugin-print", "dist", "fonts");

// Canvas
const W = 1600;
const H = 1200;
const BLACK = 0x0A0A12FF;
const AMBER = 0xFFB000FF;
const AMBER_R = 0xFF, AMBER_G = 0xB0, AMBER_B = 0x00;
const BORDER = 6;

// Helpers
function pixel(img, x, y, color) {
    if (x >= 0 && x < W && y >= 0 && y < H) img.setPixelColor(color, x, y);
}
function fillRect(img, x1, y1, x2, y2, color) {
    for (let y = y1; y <= y2; y++)
        for (let x = x1; x <= x2; x++)
            pixel(img, x, y, color);
}
function strokeRect(img, x1, y1, x2, y2, thickness, color) {
    fillRect(img, x1, y1, x2, y1 + thickness - 1, color);
    fillRect(img, x1, y2 - thickness + 1, x2, y2, color);
    fillRect(img, x1, y1, x1 + thickness - 1, y2, color);
    fillRect(img, x2 - thickness + 1, y1, x2, y2, color);
}
function tintArea(layer, w, h, r, g, b) {
    layer.scan(0, 0, w, h, function (x, y, idx) {
        const a = this.bitmap.data[idx + 3];
        if (a > 0) {
            this.bitmap.data[idx]     = r;
            this.bitmap.data[idx + 1] = g;
            this.bitmap.data[idx + 2] = b;
        }
    });
}

async function printText(img, font, text, x, y, color) {
    const layer = new Jimp({ width: W, height: 80, color: 0x00000000 });
    layer.print({ font, x: 0, y: 0, text, maxWidth: W });
    if (color) tintArea(layer, W, 80, color.r, color.g, color.b);
    img.composite(layer, x, y);
}

async function printCentered(img, font, text, y, color) {
    const layer = new Jimp({ width: W, height: 80, color: 0x00000000 });
    layer.print({
        font, x: 0, y: 0,
        text: { text, alignmentX: 2 },
        maxWidth: W,
    });
    if (color) tintArea(layer, W, 80, color.r, color.g, color.b);
    img.composite(layer, 0, y);
}

// Action data
const actions = [
    {
        name: "MOVE",
        icon: ">>",
        lines: [
            "Move each soldier in the Squad up to 1 hex.",
            "Jump Jets (J.J): move up to 2 hexes, may break coherency.",
            "Squad coherency: stay within 2 hexes of a squadmate.",
            "Cannot move through Separatist-occupied hexes.",
            "Board wraps at edges (a-a, b-b, etc.).",
            "After moving: Claim Hexes (place flags where you have",
            "soldiers and no enemy is present).",
        ],
    },
    {
        name: "COMBAT",
        icon: "X",
        lines: [
            "Optional. Squad with enemy in combat range may attack.",
            "Place Combat Marker at the board location.",
            "Stage engaged soldiers on Combat Boards (1-7).",
            "Only engaged soldiers (enemy in range) participate.",
            "Resolve per Combat rules, then return survivors to hexes.",
            "After combat: Claim Hexes (as above).",
            "Defender may withdraw survivors 1 hex after combat.",
        ],
    },
    {
        name: "LOGISTICS",
        icon: "[]",
        lines: [
            "Unlock BAC: place card in Equipment Display + flag on it.",
            "  Pay resource cost per soldier, attach module, add DP.",
            "Re-equip unlocked BAC: pay cost per soldier, no card needed.",
            "  Add card DP to counter for each soldier equipped.",
            "Buy BAC: 3 of same resource at/near Spaceport or City.",
            "Collect BACs: Squad on spaceport w/ container takes all.",
            "Recruit Soldier: 1 Local Favor + 1 Oil + 1 Industry +",
            "  1 Electricity at/near City. Max 7 per Squad.",
            "Create Squad: recruitment cost x 5+ soldiers at City.",
            "  Max 4 Squads. New Squad placed at that City.",
            "Trade: player-to-player (both give 1+) or Bank 3:1.",
            "  Resources only -- no cards or equipment.",
        ],
    },
    {
        name: "CONSPIRE",
        icon: "??",
        lines: [
            "Draw 3 from Conspire Deck, keep 1, discard 2 face-down.",
            "Follow card text if it says otherwise (e.g. keep 2).",
            "May Conspire twice (spend both Squad actions).",
        ],
    },
    {
        name: "REST",
        icon: "+",
        lines: [
            "Roll 1d3 (1d6 / 2, round up: 1-2=1, 3-4=2, 5-6=3).",
            "Remove that many damage pegs from the activating Squad.",
            "Player chooses which soldiers to heal.",
            "Damage persists between turns. Rest = basic recovery.",
        ],
    },
];

(async () => {
    const img = new Jimp({ width: W, height: H, color: BLACK });

    // Outer amber border
    const margin = 20;
    strokeRect(img, margin, margin, W - 1 - margin, H - 1 - margin, BORDER, AMBER);

    // Title
    const titleFont = await loadFont(path.join(FONT_DIR, "open-sans/open-sans-32-white/open-sans-32-white.fnt"));
    await printCentered(img, titleFont, "SQUAD ACTIONS -- QUICK REFERENCE", 45, { r: AMBER_R, g: AMBER_G, b: AMBER_B });

    // Subtitle
    const subFont = await loadFont(path.join(FONT_DIR, "open-sans/open-sans-16-white/open-sans-16-white.fnt"));
    await printCentered(img, subFont, "Each Squad takes 2 actions per turn. Any action may be chosen twice.", 90, { r: 0xAA, g: 0xAA, b: 0xBB });

    // Action sections -- 2 columns
    const bodyFont = await loadFont(path.join(FONT_DIR, "open-sans/open-sans-12-black/open-sans-12-black.fnt"));
    const nameFont = await loadFont(path.join(FONT_DIR, "open-sans/open-sans-16-white/open-sans-16-white.fnt"));

    const colW = 760;
    const col1X = 50;
    const col2X = 820;
    const startY = 130;
    const lineH = 22;
    const sectionGap = 30;

    const layout = [
        { col: 0, action: actions[0] }, // Move
        { col: 0, action: actions[1] }, // Combat
        { col: 1, action: actions[2] }, // Logistics
        { col: 1, action: actions[3] }, // Conspire
        { col: 1, action: actions[4] }, // Rest
    ];

    let yCol0 = startY;
    let yCol1 = startY;

    for (const item of layout) {
        const x = item.col === 0 ? col1X : col2X;
        let y = item.col === 0 ? yCol0 : yCol1;
        const act = item.action;

        // Section background panel
        const panelH = 50 + act.lines.length * lineH + 15;
        fillRect(img, x, y, x + colW - 20, y + panelH, 0x141422FF);
        strokeRect(img, x, y, x + colW - 20, y + panelH, 2, 0xFFB00044);

        // Action name
        await printText(img, nameFont, act.icon + "  " + act.name, x + 15, y + 12, { r: AMBER_R, g: AMBER_G, b: AMBER_B });
        y += 45;

        // Body lines
        for (const line of act.lines) {
            await printText(img, bodyFont, line, x + 20, y, { r: 0xDD, g: 0xDD, b: 0xEE });
            y += lineH;
        }

        if (item.col === 0) yCol0 = y + sectionGap;
        else yCol1 = y + sectionGap;
    }

    // Footer
    await printCentered(img, subFont, "Territory DP: +1 when you claim a hex (not Landing Zones). -1 if you lose it, new owner +1.", H - 70, { r: 0x88, g: 0x88, b: 0x99 });
    await printCentered(img, subFont, "Battle DP: Net wounds inflicted (up to +3). DP are a tie-breaker. 50 DP triggers Final Round.", H - 50, { r: 0x88, g: 0x88, b: 0x99 });

    const out = path.join(outDir, "extra-actions-board.png");
    await img.write(out);
    console.log("extra-actions-board.png (" + W + "x" + H + ")");
})();
