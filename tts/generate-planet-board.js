#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Planet Board Texture Generator
 *
 * Replaces the 5-piece "Planet Frame" with a single rectangular
 * board that has 61 hex-shaped slot outlines printed onto its top
 * surface. Players drop their hex tiles INTO the slots — the board
 * tells them exactly where each tile goes.
 *
 * The board is sized to JUST fit between the existing peripheral
 * boards (Planet Bound, Equipment Display, Unloading Zone) without
 * overlapping any of them. See generate-save.js Section 17e0 for
 * placement & sizing constants — they must stay in sync with the
 * values in this file.
 *
 *   World size:  50 wide × 55 long  (PB south edge at z=31, ED north
 *                                    edge at z=-26 → board fits
 *                                    centered at z=2.5 with 1-unit
 *                                    margins on N/S; UZ west edge at
 *                                    x=29 → 4-unit margin on E side).
 *   Pixel size:  2500 × 2750 px  (50 px / world unit, isotropic so
 *                                  hex slots stay regular hexagons
 *                                  when the texture is stretched onto
 *                                  the rectangular Custom_Tile).
 *
 * Hex slot geometry MUST match generate-save.js HEX_R_WORLD/PITCH.
 *
 * Usage:   node generate-planet-board.js
 * Outputs: tts/v<VERSION>/planet-board.png
 */

const path = require("path");
const fs = require("fs");
const { Jimp, loadFont } = require("jimp");

const FONT_DIR = path.join(__dirname, "..", "node_modules", "@jimp", "plugin-print", "dist", "fonts", "open-sans");

const VERSION = "v72";
const outDir = path.join(__dirname, VERSION);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// World <-> pixel mapping. v69: enlarged to 60×60 world units after
// surrounding boards (PB/ED/UZ) were pushed outward to free the room.
// Cluster (49 × 54.5) now sits with ~5u of "atmosphere" margin to
// the gold frame on the long axes.
const WORLD_W = 72;
const WORLD_H = 72;
const PX_PER_WORLD = 50;
const W = WORLD_W * PX_PER_WORLD;   // 3000
const H = WORLD_H * PX_PER_WORLD;   // 3000

// Hex cluster geometry (must match generate-save.js Section 17e).
const HEX_R_WORLD = 3.96;
const PITCH_X = 1.5 * HEX_R_WORLD;
const PITCH_Z = Math.sqrt(3) * HEX_R_WORLD;

// Palette
const SPACE_BG     = 0x0A0E1AFF;
const ATMOS_RING   = 0x1B2840FF;   // (no longer drawn — see v114)
const SLOT_FILL    = 0x141A2BFF;
const SLOT_OUTLINE = 0x6E84B8FF;
const FRAME_GOLD   = 0x44AAFFFF;   // v114: changed from gold → table-accent blue
const FRAME_DARK   = 0x402F18FF;

const FRAME_THICK    = 22;
const FRAME_INNER    = 6;
const SLOT_OUT_THICK = 6;

function pixel(img, x, y, color) {
    x = Math.round(x); y = Math.round(y);
    if (x >= 0 && x < W && y >= 0 && y < H) img.setPixelColor(color, x, y);
}
function fillRect(img, x1, y1, x2, y2, color) {
    x1 = Math.max(0, Math.floor(x1));
    y1 = Math.max(0, Math.floor(y1));
    x2 = Math.min(W - 1, Math.floor(x2));
    y2 = Math.min(H - 1, Math.floor(y2));
    for (let y = y1; y <= y2; y++)
        for (let x = x1; x <= x2; x++)
            img.setPixelColor(color, x, y);
}
function strokeRect(img, x1, y1, x2, y2, t, color) {
    fillRect(img, x1, y1, x2, y1 + t - 1, color);
    fillRect(img, x1, y2 - t + 1, x2, y2, color);
    fillRect(img, x1, y1, x1 + t - 1, y2, color);
    fillRect(img, x2 - t + 1, y1, x2, y2, color);
}
function thickLine(img, x0, y0, x1, y1, t, color) {
    x0 = Math.round(x0); y0 = Math.round(y0);
    x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = x0, y = y0;
    const r = Math.floor(t / 2);
    while (true) {
        for (let dyB = -r; dyB <= r; dyB++)
            for (let dxB = -r; dxB <= r; dxB++)
                if (dxB * dxB + dyB * dyB <= r * r) pixel(img, x + dxB, y + dyB, color);
        if (x === x1 && y === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx)  { err += dx; y += sy; }
    }
}
function hexVerts(cx, cy, r) {
    const v = [];
    for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        v.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return v;
}
function fillHex(img, cx, cy, r, color) {
    const v = hexVerts(cx, cy, r);
    const yMin = Math.floor(Math.min(...v.map((p) => p[1])));
    const yMax = Math.ceil(Math.max(...v.map((p) => p[1])));
    for (let y = yMin; y <= yMax; y++) {
        const xs = [];
        for (let i = 0; i < 6; i++) {
            const [x1, y1] = v[i];
            const [x2, y2] = v[(i + 1) % 6];
            if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
                xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
            }
        }
        xs.sort((a, b) => a - b);
        for (let i = 0; i + 1 < xs.length; i += 2) {
            fillRect(img, xs[i], y, xs[i + 1], y, color);
        }
    }
}
function strokeHex(img, cx, cy, r, t, color) {
    const v = hexVerts(cx, cy, r).map((p) => [Math.round(p[0]), Math.round(p[1])]);
    for (let i = 0; i < 6; i++) {
        const [x1, y1] = v[i];
        const [x2, y2] = v[(i + 1) % 6];
        thickLine(img, x1, y1, x2, y2, t, color);
    }
}

(async () => {
    const img = new Jimp({ width: W, height: H, color: SPACE_BG });
    const cx = W / 2, cy = H / 2;

    // v114: atmosphere ring removed per user request (was the inner
    // blue band; only the outer frame ring remains, recolored blue).

    // 61 hex slots at exact axial coords.
    const HEX_R_PX = HEX_R_WORLD * PX_PER_WORLD;   // 175
    const SLOT_R   = HEX_R_PX * 0.97;
    let slotCount = 0;
    for (let q = -4; q <= 4; q++) {
        for (let r = -4; r <= 4; r++) {
            if (Math.abs(q + r) > 4) continue;
            const wx = q * PITCH_X;
            const wz = (r + q / 2) * PITCH_Z;
            const px = cx + wx * PX_PER_WORLD;
            const pz = cy + wz * PX_PER_WORLD;
            fillHex(img, px, pz, SLOT_R, SLOT_FILL);
            strokeHex(img, px, pz, SLOT_R, SLOT_OUT_THICK, SLOT_OUTLINE);
            slotCount++;
        }
    }
    if (slotCount !== 61) throw new Error("slot count: " + slotCount);

    // Circular planet boundary — board is square so the ring stays
    // round on the tile (no aspect distortion).
    const planetOuter = (W / 2) * 0.985;
    const planetInner = planetOuter - FRAME_THICK;
    const innerEdge   = planetInner - FRAME_INNER;
    for (let dy = -planetOuter; dy <= planetOuter; dy++) {
        for (let dx = -planetOuter; dx <= planetOuter; dx++) {
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d > planetInner && d < planetOuter) {
                pixel(img, cx + dx, cy + dy, FRAME_GOLD);
            } else if (d > innerEdge && d <= planetInner) {
                pixel(img, cx + dx, cy + dy, FRAME_DARK);
            }
        }
    }

    // v117: wrap-around connection labels.
    // The planet wraps around — opposite edge hexes are adjacent
    // (rulebook §Setup / §Board Wrapping). We label each of the 24
    // perimeter hexes with a letter a–l; antipodal pairs share the
    // same letter so players can read where they emerge on the far
    // side of the planet.
    const edgePairs = [
        [[ 4,  0], [-4,  0]], // a
        [[ 4, -1], [-4,  1]], // b
        [[ 4, -2], [-4,  2]], // c
        [[ 4, -3], [-4,  3]], // d
        [[ 4, -4], [-4,  4]], // e
        [[ 3, -4], [-3,  4]], // f
        [[ 2, -4], [-2,  4]], // g
        [[ 1, -4], [-1,  4]], // h
        [[ 0, -4], [ 0,  4]], // i
        [[-1, -3], [ 1,  3]], // j
        [[-2, -2], [ 2,  2]], // k
        [[-3, -1], [ 3,  1]], // l
    ];
    const labelMap = new Map();
    edgePairs.forEach(([a, b], idx) => {
        const letter = String.fromCharCode("a".charCodeAt(0) + idx);
        labelMap.set(`${a[0]},${a[1]}`, letter);
        labelMap.set(`${b[0]},${b[1]}`, letter);
    });

    const fontLabel = await loadFont(path.join(FONT_DIR, "open-sans-64-white", "open-sans-64-white.fnt"));
    const LABEL_BOX = 80;
    // Push label outward from board center toward the planet rim,
    // far enough to clear the hex outline but inside the gold ring.
    const LABEL_RADIAL_OFFSET = HEX_R_PX * 0.85;
    for (const [key, letter] of labelMap.entries()) {
        const [q, r] = key.split(",").map(Number);
        const wx = q * PITCH_X;
        const wz = (r + q / 2) * PITCH_Z;
        const hx = cx + wx * PX_PER_WORLD;
        const hz = cy + wz * PX_PER_WORLD;
        // Direction from board center to hex center → push label
        // a bit further outward, toward the planet rim.
        const dx = hx - cx, dy = hz - cy;
        const d  = Math.sqrt(dx * dx + dy * dy) || 1;
        const lx = hx + (dx / d) * LABEL_RADIAL_OFFSET;
        const ly = hz + (dy / d) * LABEL_RADIAL_OFFSET;
        // open-sans-64 glyphs are ~36 px wide / ~64 px tall — center
        // the printed letter on (lx, ly) by simple offsets.
        img.print({
            font: fontLabel,
            x: Math.round(lx - 18),
            y: Math.round(ly - 32),
            text: letter,
        });
    }

    const outPath = path.join(outDir, "planet-board.png");
    await img.write(outPath);
    console.log(`Wrote ${outPath} (${W}x${H}, ${slotCount} hex slots, ${labelMap.size} wrap labels)`);
})();
