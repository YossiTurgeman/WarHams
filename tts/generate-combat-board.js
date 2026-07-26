#!/usr/bin/env node
/**
 * Generates the shared texture used by the north and south combat boards.
 * The image's lower row is H.A.M.S 1-7 and its upper row is Dice 1-7;
 * rotating the south board 180 degrees keeps both sides facing the tray.
 */

const path = require("path");
const { Jimp, loadFont } = require("jimp");

const W = 1800;
const H = 540;
const BG = 0x11141FFF;
const RED = 0xD32F2FFF;
const MUTED = 0xAEB7C6FF;

const FONT_DIR = path.join(__dirname, "..", "node_modules", "@jimp", "plugin-print", "dist", "fonts", "open-sans");

function fillRect(img, x, y, width, height, color) {
    img.scan(x, y, width, height, function (_px, _py, idx) {
        this.bitmap.data.writeUInt32BE(color >>> 0, idx);
    });
}

function strokeRect(img, x, y, width, height, thickness, color) {
    fillRect(img, x, y, width, thickness, color);
    fillRect(img, x, y + height - thickness, width, thickness, color);
    fillRect(img, x, y, thickness, height, color);
    fillRect(img, x + width - thickness, y, thickness, height, color);
}

function strokeCircle(img, cx, cy, radius, thickness, color) {
    const inner = radius - thickness;
    img.scan(cx - radius, cy - radius, radius * 2 + 1, radius * 2 + 1, function (x, y, idx) {
        const distance = Math.hypot(x - cx, y - cy);
        if (distance <= radius && distance >= inner) this.bitmap.data.writeUInt32BE(color >>> 0, idx);
    });
}

(async () => {
    const img = new Jimp({ width: W, height: H, color: BG });
    const font32 = await loadFont(path.join(FONT_DIR, "open-sans-32-white", "open-sans-32-white.fnt"));
    const font16 = await loadFont(path.join(FONT_DIR, "open-sans-16-white", "open-sans-16-white.fnt"));

    strokeRect(img, 12, 12, W - 24, H - 24, 8, RED);
    fillRect(img, 45, 82, W - 90, 3, RED);
    fillRect(img, 45, 300, W - 90, 3, RED);

    img.print({
        font: font32,
        x: 0,
        y: 28,
        text: { text: "COMBAT ZONE", alignmentX: 2 },
        maxWidth: W,
    });

    img.print({ font: font16, x: 34, y: 176, text: "DICE", maxWidth: 100 });
    img.print({ font: font16, x: 34, y: 405, text: "H.A.M.S", maxWidth: 120 });

    const firstX = 255;
    const pitch = 215;
    for (let i = 0; i < 7; i++) {
        const number = i + 1;
        const x = firstX + i * pitch;

        strokeRect(img, x - 66, 125, 132, 132, 6, RED);
        strokeCircle(img, x, 410, 67, 6, MUTED);

        img.print({
            font: font32,
            x: x - 66,
            y: 166,
            text: { text: String(number), alignmentX: 2 },
            maxWidth: 132,
        });
        img.print({
            font: font32,
            x: x - 66,
            y: 387,
            text: { text: String(number), alignmentX: 2 },
            maxWidth: 132,
        });
    }

    const output = path.join(__dirname, "combat-zone-board.png");
    await img.write(output);
    console.log(`Generated ${output} (${W}x${H})`);
})().catch(error => {
    console.error(error);
    process.exit(1);
});
