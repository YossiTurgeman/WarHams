#!/usr/bin/env node
/**
 * Generates the +1 bonus marker textures used to mark a soldier or Squad
 * currently receiving an existing +1 attack or +1 defense bonus (bunker,
 * Guerrilla Warfare, etc.). Pure markers — they add no new bonus.
 * Output: tts/bonus-marker-atk.png, tts/bonus-marker-def.png
 * Note: Jimp's bundled Open Sans has no em-dash or middle-dot glyphs,
 * so keep baked-in text to plain ASCII.
 */

const path = require("path");
const { Jimp, loadFont } = require("jimp");

const SIZE = 512;
const FONT_DIR = path.join(__dirname, "..", "node_modules", "@jimp", "plugin-print", "dist", "fonts", "open-sans");

const MARKERS = [
    { file: "bonus-marker-atk.png", ring: 0xD32F2FFF, fill: 0x3A0D0DFF, label: "ATK" },
    { file: "bonus-marker-def.png", ring: 0x1E88E5FF, fill: 0x0D1B3AFF, label: "DEF" },
];

(async () => {
    for (const { file, ring, fill, label } of MARKERS) {
        const img = new Jimp({ width: SIZE, height: SIZE, color: fill });

        // Thick colored ring around the edge.
        const cx = SIZE / 2, cy = SIZE / 2, R = 236, t = 26;
        img.scan(0, 0, SIZE, SIZE, function (x, y, idx) {
            const d = Math.hypot(x - cx, y - cy);
            if (d <= R && d >= R - t) this.bitmap.data.writeUInt32BE(ring, idx);
        });

        const big = await loadFont(path.join(FONT_DIR, "open-sans-128-white", "open-sans-128-white.fnt"));
        const small = await loadFont(path.join(FONT_DIR, "open-sans-64-white", "open-sans-64-white.fnt"));

        img.print({
            font: big, x: 0, y: 130,
            text: { text: "+1", alignmentX: 2 }, maxWidth: SIZE,
        });
        img.print({
            font: small, x: 0, y: 300,
            text: { text: label, alignmentX: 2 }, maxWidth: SIZE,
        });

        await img.write(path.join(__dirname, file));
        console.log(`Generated ${path.join(__dirname, file)} (${SIZE}x${SIZE})`);
    }
})();
