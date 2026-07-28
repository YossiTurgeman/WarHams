#!/usr/bin/env node
/**
 * W.A.R H.A.M.S -- Extra Actions Reference Board Generator
 *
 * Two-column layout with bigger 14px body text for readability.
 * Footer DP rules in their own panel. No empty space.
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

// Canvas — two columns, tight fit
const W = 1400;
const H = 870;
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
        name: "LOGISTICS: EQUIP & BUY",
        icon: "[]",
        lines: [
            "Unlock BAC: card in Equipment Display + flag on it.",
            "  Pay cost per soldier, attach module, add DP.",
            "Re-equip unlocked BAC: pay cost per soldier, no card.",
            "  Add card DP to counter for each soldier equipped.",
            "Buy BAC: 3 of same resource at/near Spaceport/City.",
            "Collect BACs: Squad on spaceport w/ container takes all.",
        ],
    },
    {
        name: "LOGISTICS: RECRUIT & TRADE",
        icon: "[]",
        lines: [
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

// Footer data
const footerLines = [
    "Territory DP: +1 when you claim a hex (not Landing Zones). -1 if you lose it, new owner +1.",
    "Battle DP: Net wounds inflicted (up to +3). DP are a tie-breaker. 50 DP triggers Final Round.",
];

(async () => {
    const img = new Jimp({ width: W, height: H, color: BLACK });

    // Outer amber border
    const margin = 16;
    strokeRect(img, margin, margin, W - 1 - margin, H - 1 - margin, BORDER, AMBER);

    // Title
    const titleFont = await loadFont(path.join(FONT_DIR, "open-sans/open-sans-32-white/open-sans-32-white.fnt"));
    await printCentered(img, titleFont, "SQUAD ACTIONS -- QUICK REFERENCE", 28, { r: AMBER_R, g: AMBER_G, b: AMBER_B });

    // Subtitle
    const subFont = await loadFont(path.join(FONT_DIR, "open-sans/open-sans-16-white/open-sans-16-white.fnt"));
    await printCentered(img, subFont, "Each Squad takes 2 actions per turn. Any action may be chosen twice.", 68, { r: 0xAA, g: 0xAA, b: 0xBB });

    // Fonts — 14px body for readability
    const bodyFont = await loadFont(path.join(FONT_DIR, "open-sans/open-sans-14-black/open-sans-14-black.fnt"));
    const nameFont = await loadFont(path.join(FONT_DIR, "open-sans/open-sans-16-white/open-sans-16-white.fnt"));

    const lineH = 26;
    const sectionGap = 18;
    const headerH = 42;
    const panelPad = 12;

    // Two columns
    const colW = 670;
    const col1X = 20;
    const col2X = 710;
    const startY = 100;

    // Left: MOVE, COMBAT, CONSPIRE
    // Right: LOGISTICS EQUIP, LOGISTICS RECRUIT, REST
    const colLayout = [
        { x: col1X, items: [actions[0], actions[1], actions[4]] },     // Move, Combat, Conspire
        { x: col2X, items: [actions[2], actions[3], actions[5]] },     // Logistics Equip, Logistics Recruit, Rest
    ];

    let colBottoms = [startY, startY];

    for (let col = 0; col < 2; col++) {
        const { x, items } = colLayout[col];
        let y = startY;

        for (const act of items) {
            const panelH = headerH + act.lines.length * lineH + panelPad;
            fillRect(img, x, y, x + colW, y + panelH, 0x141422FF);
            strokeRect(img, x, y, x + colW, y + panelH, 2, 0xFFB00044);

            await printText(img, nameFont, act.icon + "  " + act.name, x + 15, y + 10, { r: AMBER_R, g: AMBER_G, b: AMBER_B });
            let ty = y + headerH;

            for (const line of act.lines) {
                await printText(img, bodyFont, line, x + 20, ty, { r: 0xDD, g: 0xDD, b: 0xEE });
                ty += lineH;
            }

            y = ty + sectionGap;
        }

        colBottoms[col] = y - sectionGap;
    }

    // Footer panel — full width, below both columns
    const footY = Math.max(colBottoms[0], colBottoms[1]) + sectionGap;
    const footH = headerH + footerLines.length * lineH + panelPad;
    fillRect(img, col1X, footY, col2X + colW, footY + footH, 0x141422FF);
    strokeRect(img, col1X, footY, col2X + colW, footY + footH, 2, 0xFFB00044);

    await printText(img, nameFont, "DP RULES", col1X + 15, footY + 10, { r: AMBER_R, g: AMBER_G, b: AMBER_B });
    let fy = footY + headerH;
    for (const line of footerLines) {
        await printText(img, bodyFont, line, col1X + 20, fy, { r: 0xDD, g: 0xDD, b: 0xEE });
        fy += lineH;
    }

    const out = path.join(outDir, "extra-actions-board.png");
    await img.write(out);
    console.log("extra-actions-board.png (" + W + "x" + H + ")");
})();
