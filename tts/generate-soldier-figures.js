#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Soldier Figurine Image Generator (v33)
 *
 * Generates 112 PNGs (4 player colors × 4 squads × 7 soldiers) representing
 * each H.A.M.S as a stand-up Custom_Token figurine. Each image contains:
 *   - Top portion: a stylized standing soldier silhouette in the player
 *     color (matches the magnetic-modular spec from the rulebook)
 *   - Bottom portion: a "40mm round base" disc showing the printed squad
 *     letter + soldier number (A1–A7, B1–B7, C1–C7, D1–D7) and three
 *     small red dots representing the blood-drop divots
 *
 * The PNG is shaped so TTS's Custom_Token "Stand=true" mode extrudes only
 * the opaque silhouette + base into a vertical figure — a digital twin of
 * a 3D mini on its numbered base.
 *
 * Usage: node generate-soldier-figures.js
 * Output: tts/cards/soldier_<color>_<id>.png   (e.g. soldier_red_A1.png)
 */

const { Jimp, loadFont } = require("jimp");
const path = require("path");
const fs = require("fs");

// Canvas: portrait, leaving room for tall figure + base
const W = 384;
const H = 640;

// Base disc (drawn at bottom — TTS Stand uses bottom of opaque pixels)
const BASE_CX = W / 2;
const BASE_CY = H - 80;
const BASE_RX = 150; // ellipse: wider than tall to imply a disc seen from above
const BASE_RY = 40;

// Figure geometry (above the base)
const FIG_BOTTOM = BASE_CY - BASE_RY;
const FIG_TOP = 40;
const HEAD_R = 48;
const HEAD_CY = FIG_TOP + HEAD_R + 20;
const NECK_TOP = HEAD_CY + HEAD_R - 8;
const TORSO_TOP = NECK_TOP + 12;
const TORSO_BOT = TORSO_TOP + 200;
const TORSO_HALF_W = 80;
const SHOULDER_W = 110;
const SHOULDER_H = 18;
const LEG_TOP = TORSO_BOT;
const LEG_BOT = FIG_BOTTOM;
const LEG_HALF_W = 32;
const LEG_GAP = 10;
const ARM_TOP = TORSO_TOP + 18;
const ARM_BOT = TORSO_TOP + 170;
const ARM_HALF_W = 24;

const colors = [
    { name: "red",    fill: { r: 0xCC, g: 0x33, b: 0x33 }, edge: { r: 0x55, g: 0x10, b: 0x10 }, label: { r: 0xFF, g: 0xFF, b: 0xFF } },
    { name: "blue",   fill: { r: 0x33, g: 0x55, b: 0xCC }, edge: { r: 0x10, g: 0x18, b: 0x55 }, label: { r: 0xFF, g: 0xFF, b: 0xFF } },
    { name: "green",  fill: { r: 0x33, g: 0x99, b: 0x33 }, edge: { r: 0x10, g: 0x40, b: 0x10 }, label: { r: 0xFF, g: 0xFF, b: 0xFF } },
    { name: "yellow", fill: { r: 0xE8, g: 0xC8, b: 0x33 }, edge: { r: 0x60, g: 0x50, b: 0x10 }, label: { r: 0x20, g: 0x20, b: 0x20 } },
];

const SQUAD_LETTERS = ["A", "B", "C", "D"];

const FONT_DIR = path.join(__dirname, "..", "node_modules", "@jimp", "plugin-print", "dist", "fonts");

function rgba(c, a = 255) {
    return (((c.r & 0xFF) << 24) | ((c.g & 0xFF) << 16) | ((c.b & 0xFF) << 8) | (a & 0xFF)) >>> 0;
}

function inEllipse(x, y, cx, cy, rx, ry) {
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    return dx * dx + dy * dy <= 1;
}

function inEllipseRing(x, y, cx, cy, rx, ry, thickness) {
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    const d = dx * dx + dy * dy;
    if (d > 1) return false;
    const inner = (rx - thickness) / rx;
    const dxi = (x - cx) / (rx - thickness);
    const dyi = (y - cy) / (ry - thickness);
    return (dxi * dxi + dyi * dyi) > 1;
}

function inRect(x, y, x1, y1, x2, y2) {
    return x >= x1 && x <= x2 && y >= y1 && y <= y2;
}

function inCircle(x, y, cx, cy, r) {
    const dx = x - cx, dy = y - cy;
    return dx * dx + dy * dy <= r * r;
}

function drawFilledEllipse(img, cx, cy, rx, ry, color) {
    const x0 = Math.max(0, Math.floor(cx - rx));
    const x1 = Math.min(img.bitmap.width - 1, Math.ceil(cx + rx));
    const y0 = Math.max(0, Math.floor(cy - ry));
    const y1 = Math.min(img.bitmap.height - 1, Math.ceil(cy + ry));
    for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
            if (inEllipse(x, y, cx, cy, rx, ry)) {
                img.setPixelColor(rgba(color), x, y);
            }
        }
    }
}

function drawEllipseRing(img, cx, cy, rx, ry, thickness, color) {
    const x0 = Math.max(0, Math.floor(cx - rx));
    const x1 = Math.min(img.bitmap.width - 1, Math.ceil(cx + rx));
    const y0 = Math.max(0, Math.floor(cy - ry));
    const y1 = Math.min(img.bitmap.height - 1, Math.ceil(cy + ry));
    for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
            if (inEllipseRing(x, y, cx, cy, rx, ry, thickness)) {
                img.setPixelColor(rgba(color), x, y);
            }
        }
    }
}

function drawFilledRect(img, x1, y1, x2, y2, color) {
    for (let y = Math.max(0, y1); y <= Math.min(img.bitmap.height - 1, y2); y++) {
        for (let x = Math.max(0, x1); x <= Math.min(img.bitmap.width - 1, x2); x++) {
            img.setPixelColor(rgba(color), x, y);
        }
    }
}

function drawFilledCircle(img, cx, cy, r, color) {
    const x0 = Math.max(0, Math.floor(cx - r));
    const x1 = Math.min(img.bitmap.width - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r));
    const y1 = Math.min(img.bitmap.height - 1, Math.ceil(cy + r));
    for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
            if (inCircle(x, y, cx, cy, r)) {
                img.setPixelColor(rgba(color), x, y);
            }
        }
    }
}

async function buildFigure(color, squadLetter, soldierNum) {
    const img = new Jimp({ width: W, height: H, color: 0x00000000 });

    // ── BASE DISC ──────────────────────────────────────────────
    // Outer ring (player color edge)
    drawFilledEllipse(img, BASE_CX, BASE_CY, BASE_RX, BASE_RY, color.edge);
    // Inner disc (player color fill, slightly inset)
    drawFilledEllipse(img, BASE_CX, BASE_CY, BASE_RX - 8, BASE_RY - 6, color.fill);
    // Top highlight band (lighter, gives the disc a 3D feel)
    drawFilledEllipse(img, BASE_CX, BASE_CY - 4, BASE_RX - 18, BASE_RY - 14, {
        r: Math.min(255, color.fill.r + 30),
        g: Math.min(255, color.fill.g + 30),
        b: Math.min(255, color.fill.b + 30)
    });

    // 3 blood-drop divots (small red dots arranged across the front of the disc)
    const divotR = 7;
    const divotY = BASE_CY + 18;
    const divotXs = [BASE_CX - 60, BASE_CX, BASE_CX + 60];
    for (const dx of divotXs) {
        // dark divot well
        drawFilledCircle(img, dx, divotY, divotR, { r: 0x40, g: 0x05, b: 0x05 });
        // glossy red drop inside
        drawFilledCircle(img, dx, divotY - 1, divotR - 2, { r: 0xC8, g: 0x10, b: 0x10 });
    }

    // ── SOLDIER FIGURE ────────────────────────────────────────
    // Helmet (head)
    drawFilledCircle(img, W / 2, HEAD_CY, HEAD_R, color.edge);
    drawFilledCircle(img, W / 2, HEAD_CY, HEAD_R - 4, color.fill);
    // Visor stripe
    drawFilledRect(img, W / 2 - 32, HEAD_CY - 4, W / 2 + 32, HEAD_CY + 6, { r: 0x20, g: 0x20, b: 0x20 });

    // Neck
    drawFilledRect(img, W / 2 - 16, NECK_TOP, W / 2 + 16, TORSO_TOP, color.edge);

    // Shoulders (wider band at top of torso)
    drawFilledRect(img, W / 2 - SHOULDER_W, TORSO_TOP, W / 2 + SHOULDER_W, TORSO_TOP + SHOULDER_H, color.edge);
    drawFilledRect(img, W / 2 - SHOULDER_W + 6, TORSO_TOP + 4, W / 2 + SHOULDER_W - 6, TORSO_TOP + SHOULDER_H - 2, color.fill);

    // Torso (chest plate)
    drawFilledRect(img, W / 2 - TORSO_HALF_W, TORSO_TOP + SHOULDER_H, W / 2 + TORSO_HALF_W, TORSO_BOT, color.edge);
    drawFilledRect(img, W / 2 - TORSO_HALF_W + 6, TORSO_TOP + SHOULDER_H + 4, W / 2 + TORSO_HALF_W - 6, TORSO_BOT - 4, color.fill);
    // Chest plate split line (visual nod to the magnet attachment slot)
    drawFilledRect(img, W / 2 - 2, TORSO_TOP + SHOULDER_H + 12, W / 2 + 2, TORSO_BOT - 12, color.edge);

    // Arms
    drawFilledRect(img, W / 2 - SHOULDER_W, ARM_TOP, W / 2 - SHOULDER_W + ARM_HALF_W * 2, ARM_BOT, color.edge);
    drawFilledRect(img, W / 2 + SHOULDER_W - ARM_HALF_W * 2, ARM_TOP, W / 2 + SHOULDER_W, ARM_BOT, color.edge);
    drawFilledRect(img, W / 2 - SHOULDER_W + 4, ARM_TOP + 4, W / 2 - SHOULDER_W + ARM_HALF_W * 2 - 4, ARM_BOT - 4, color.fill);
    drawFilledRect(img, W / 2 + SHOULDER_W - ARM_HALF_W * 2 + 4, ARM_TOP + 4, W / 2 + SHOULDER_W - 4, ARM_BOT - 4, color.fill);

    // Legs
    drawFilledRect(img, W / 2 - LEG_HALF_W - LEG_GAP, LEG_TOP, W / 2 - LEG_GAP, LEG_BOT, color.edge);
    drawFilledRect(img, W / 2 + LEG_GAP, LEG_TOP, W / 2 + LEG_HALF_W + LEG_GAP, LEG_BOT, color.edge);
    drawFilledRect(img, W / 2 - LEG_HALF_W - LEG_GAP + 4, LEG_TOP + 4, W / 2 - LEG_GAP - 4, LEG_BOT - 4, color.fill);
    drawFilledRect(img, W / 2 + LEG_GAP + 4, LEG_TOP + 4, W / 2 + LEG_HALF_W + LEG_GAP - 4, LEG_BOT - 4, color.fill);

    // ── ID LABEL ON BASE ──────────────────────────────────────
    const id = `${squadLetter}${soldierNum}`;
    // White font usually reads on dark/saturated colors; black for yellow
    const fontPath = (color.name === "yellow")
        ? path.join(FONT_DIR, "open-sans", "open-sans-64-black", "open-sans-64-black.fnt")
        : path.join(FONT_DIR, "open-sans", "open-sans-64-white", "open-sans-64-white.fnt");
    const font = await loadFont(fontPath);
    img.print({
        font,
        x: 0,
        y: BASE_CY - 38,
        text: { text: id, alignmentX: 1 /* center */ },
        maxWidth: W,
    });

    return img;
}

(async () => {
    const outDir = path.join(__dirname, "cards");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    let count = 0;
    for (const color of colors) {
        for (let s = 0; s < SQUAD_LETTERS.length; s++) {
            for (let n = 1; n <= 7; n++) {
                const img = await buildFigure(color, SQUAD_LETTERS[s], n);
                const fileName = `soldier_${color.name}_${SQUAD_LETTERS[s]}${n}.png`;
                await img.write(path.join(outDir, fileName));
                count++;
            }
        }
    }
    console.log(`Generated ${count} soldier figurine images in ${outDir}`);
})();
