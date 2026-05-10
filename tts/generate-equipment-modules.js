#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Equipment Module Token Texture Generator
 *
 * Produces 5 small disc PNGs used as the physical "module" pieces
 * that magnetize to a soldier's 5 equipment slots (Head, Chest,
 * Hands, Legs, Backpack). Each is a CardCustom-style chit with a
 * slot icon/label on a colored field with a rim.
 *
 * On the table, players draw a token from the matching slot bag and
 * drop it on/under a soldier mini to show that the corresponding
 * BAC card is currently installed in that slot. The chit is small
 * enough to sit in front of the standee without obscuring it.
 *
 * Usage:  node generate-equipment-modules.js
 * Outputs: tts/v<VERSION>/module_<slot>_rev<REV>.png
 */

const { Jimp, loadFont } = require("jimp");
const path = require("path");
const fs = require("fs");

const VERSION = "v72";
// Bump MODULE_REV any time the texture content changes — the
// generated file name carries the rev (module_<slot>_rev<N>.png),
// which forces TTS to fetch a brand-new asset. Must match the rev
// embedded in EQUIPMENT_MODULE_URL inside generate-save.js.
const MODULE_REV = 132;
const OUT = path.join(__dirname, VERSION);
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const FONT_DIR = path.join(__dirname, "..", "node_modules", "@jimp", "plugin-print", "dist", "fonts", "open-sans");

const SIZE = 256;          // square texture; Custom_Token cylinder crops naturally to a disc

// One color per slot so a glance at the mini tells you which gear
// is installed. Pulled from a muted military / techwear palette so
// they read as "gear" rather than party chips.
const slots = [
    { id: "head",     label: "HEAD",  bg: { r: 0x6E, g: 0x90, b: 0xC2 } }, // visor blue
    { id: "chest",    label: "CHEST", bg: { r: 0x82, g: 0x6B, b: 0x4F } }, // olive armour
    { id: "hands",    label: "HANDS", bg: { r: 0xAA, g: 0x6E, b: 0x42 } }, // glove tan
    { id: "legs",     label: "LEGS",  bg: { r: 0x4F, g: 0x6E, b: 0x4A } }, // boot green
    { id: "backpack", label: "PACK",  bg: { r: 0x55, g: 0x55, b: 0x60 } }, // gunmetal
];
const RIM_DARK = { r: 0x14, g: 0x12, b: 0x10 };
const INK      = { r: 0xF4, g: 0xF1, b: 0xE6 };           // off-white text

function rgba(c, a = 255) {
    return (((c.r & 0xFF) << 24) | ((c.g & 0xFF) << 16) | ((c.b & 0xFF) << 8) | (a & 0xFF)) >>> 0;
}
function fillCircle(img, cx, cy, r, color) {
    const r2 = r * r;
    for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(img.bitmap.height - 1, Math.ceil(cy + r)); y++) {
        for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(img.bitmap.width - 1, Math.ceil(cx + r)); x++) {
            const dx = x - cx, dy = y - cy;
            if (dx * dx + dy * dy <= r2) img.setPixelColor(rgba(color), x, y);
        }
    }
}

(async () => {
    // Use the white 64-pt font and tint by drawing it onto a stamp,
    // then blending. Simpler: just print white text directly — slot
    // backgrounds are dark enough that white reads cleanly.
    const font = await loadFont(path.join(FONT_DIR, "open-sans-64-white", "open-sans-64-white.fnt"));

    for (const slot of slots) {
        const img = new Jimp({ width: SIZE, height: SIZE, color: rgba({ r: 0, g: 0, b: 0 }, 0) });
        const cx = SIZE / 2, cy = SIZE / 2;
        const rOuter = SIZE / 2 - 4;
        const rInner = rOuter - 6;

        // Dark rim → coloured disc
        fillCircle(img, cx, cy, rOuter, RIM_DARK);
        fillCircle(img, cx, cy, rInner, slot.bg);

        // Slot label, centered. The same texture is used face-up
        // and face-down because Custom_Token is single-sided; we
        // print the label oriented so a south-side viewer reads it
        // right-side up after the standard 180° image-y → world -z
        // flip applied to all our table textures (see v123).
        const label = slot.label;
        img.print({
            font,
            x: 0,
            y: SIZE / 2 - 32,
            text: { text: label, alignmentX: 2 /* CENTER */ },
            maxWidth: SIZE,
        });
        img.rotate({ deg: 180 });

        const out = path.join(OUT, `module_${slot.id}_rev${MODULE_REV}.png`);
        await img.write(out);
        console.log(`wrote ${out}`);
    }
})().catch(e => { console.error(e); process.exit(1); });
