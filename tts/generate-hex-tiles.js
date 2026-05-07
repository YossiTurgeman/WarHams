#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Hex Tile Texture Generator
 *
 * Generates the unique hex face textures used to build the planet
 * surface (61 hex tiles total, made up of 15 unique designs).
 *
 *   Hex Type             Border Color   Count    Texture(s)
 *   Oil Rig              Black           3       hex_oil.png
 *   Power Plant          Yellow          3       hex_power.png
 *   Factory              Red             3       hex_factory.png
 *   Radar Dish           Blue            3       hex_radar.png
 *   City / Village       Green           3       hex_city.png
 *   Separatist Base      Grey            3       hex_separatist_{2,4,6}.png
 *   Spaceport Drop Zone  Purple          6       hex_spaceport_{1..6}.png
 *   Terrain              –              37       hex_terrain.png
 *
 * Each texture is a 512×512 PNG drawn with a pointy-top hex
 * inscribed in the square (TTS Custom_Tile Type=1 masks to the hex).
 *
 * Usage:   node generate-hex-tiles.js
 * Outputs: tts/v<VERSION>/hex_<name>.png
 */

const path = require("path");
const fs = require("fs");
const { Jimp, loadFont } = require("jimp");

const VERSION = "v64";
const outDir = path.join(__dirname, VERSION);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const FONT_DIR = path.join(__dirname, "..", "node_modules", "@jimp", "plugin-print", "dist", "fonts");

// ─── Canvas ─────────────────────────────────────────────────────────
const SIZE = 512;
const CX = SIZE / 2;
const CY = SIZE / 2;
const HEX_R = SIZE / 2 - 4; // pointy-top hex circumradius (inscribed square)
const BORDER_PX = 18;

// ─── Color palette ──────────────────────────────────────────────────
function rgba(r, g, b, a = 255) { return (((r & 0xff) << 24) | ((g & 0xff) << 16) | ((b & 0xff) << 8) | (a & 0xff)) >>> 0; }
const TRANSPARENT = 0x00000000;
const BLACK    = rgba(20, 20, 20);
const WHITE    = rgba(245, 245, 245);
const YELLOW   = rgba(240, 200, 40);
const RED      = rgba(190, 40, 40);
const BLUE     = rgba(50, 110, 200);
const GREEN    = rgba(60, 150, 70);
const GREY     = rgba(140, 140, 145);
const PURPLE   = rgba(135, 70, 180);
const TERRAIN_BG = rgba(120, 145, 95);   // grass/olive
const RESOURCE_BG = rgba(70, 70, 75);    // dark slate for resource tiles
const SEP_BG    = rgba(85, 80, 85);
const SPACEPORT_BG = rgba(60, 50, 80);
const ICON_GOLD = rgba(220, 180, 70);

// ─── Hex geometry ───────────────────────────────────────────────────
// FLAT-TOP hex centered at (CX,CY) with circumradius HEX_R, matching
// TTS Custom_Tile Type=1 (which cuts a flat-top hexagon — flat edge
// at top/bottom, point at left/right). Vertex angles: 0, 60, 120,
// 180, 240, 300 deg (i.e. 60·k).
function hexVertices(r) {
    const verts = [];
    for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 180) * (60 * i);
        verts.push([CX + r * Math.cos(a), CY - r * Math.sin(a)]);
    }
    return verts;
}

// Point-in-polygon (ray cast).
function pointInPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i], [xj, yj] = poly[j];
        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi + 1e-9) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function fillHex(img, color, r) {
    const verts = hexVertices(r);
    // bounding box
    let minX = SIZE, maxX = 0, minY = SIZE, maxY = 0;
    for (const [vx, vy] of verts) {
        if (vx < minX) minX = vx; if (vx > maxX) maxX = vx;
        if (vy < minY) minY = vy; if (vy > maxY) maxY = vy;
    }
    minX = Math.max(0, Math.floor(minX));
    maxX = Math.min(SIZE - 1, Math.ceil(maxX));
    minY = Math.max(0, Math.floor(minY));
    maxY = Math.min(SIZE - 1, Math.ceil(maxY));
    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            if (pointInPoly(x + 0.5, y + 0.5, verts)) img.setPixelColor(color, x, y);
        }
    }
}

// Stroke hex border by filling outer hex then the inner hex with bg.
function drawHexBorder(img, borderColor, fillColor) {
    fillHex(img, borderColor, HEX_R);
    fillHex(img, fillColor, HEX_R - BORDER_PX);
}

// ─── Pixel helpers ──────────────────────────────────────────────────
function setPx(img, x, y, color) {
    x = x | 0; y = y | 0;
    if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) img.setPixelColor(color, x, y);
}
function fillRect(img, x1, y1, x2, y2, color) {
    for (let y = y1; y <= y2; y++)
        for (let x = x1; x <= x2; x++) setPx(img, x, y, color);
}
function fillCircle(img, cx, cy, r, color) {
    const r2 = r * r;
    for (let y = -r; y <= r; y++)
        for (let x = -r; x <= r; x++)
            if (x * x + y * y <= r2) setPx(img, cx + x, cy + y, color);
}
function strokeCircle(img, cx, cy, r, t, color) {
    const ro2 = r * r;
    const ri2 = (r - t) * (r - t);
    for (let y = -r; y <= r; y++)
        for (let x = -r; x <= r; x++) {
            const d = x * x + y * y;
            if (d <= ro2 && d >= ri2) setPx(img, cx + x, cy + y, color);
        }
}
function strokeLine(img, x1, y1, x2, y2, t, color) {
    // simple thick line via Bresenham + circle stamp
    const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
    let err = dx - dy, x = x1, y = y1;
    while (true) {
        fillCircle(img, x, y, Math.floor(t / 2), color);
        if (x === x2 && y === y2) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
    }
}

// ─── Icons (drawn centered on the hex) ──────────────────────────────
function drawOilDrum(img) {
    // Black drum with two horizontal bands and a small Ω-style top
    const w = 130, h = 180;
    const x = CX - w / 2, y = CY - h / 2;
    fillRect(img, x, y + 10, x + w, y + h, BLACK);
    fillRect(img, x - 6, y, x + w + 6, y + 14, BLACK);
    fillRect(img, x - 6, y + h - 6, x + w + 6, y + h, BLACK);
    fillRect(img, x, y + 60, x + w, y + 70, ICON_GOLD);
    fillRect(img, x, y + 110, x + w, y + 120, ICON_GOLD);
}

function drawLightning(img) {
    // Bold lightning bolt in yellow with black outline
    const pts = [
        [CX - 30, CY - 110], [CX + 50, CY - 110], [CX + 5, CY - 10],
        [CX + 60, CY - 10], [CX - 40, CY + 130], [CX - 5, CY + 30],
        [CX - 60, CY + 30],
    ];
    // outline (slightly larger black bolt)
    drawPolygon(img, pts, BLACK, 14);
    drawPolygon(img, pts, YELLOW, 0);
}

function drawPolygon(img, poly, color, expand = 0) {
    let pts = poly;
    if (expand !== 0) {
        // rough expand: scale around centroid
        let cx = 0, cy = 0;
        for (const [x, y] of poly) { cx += x; cy += y; }
        cx /= poly.length; cy /= poly.length;
        pts = poly.map(([x, y]) => {
            const dx = x - cx, dy = y - cy;
            const len = Math.hypot(dx, dy) + 1e-9;
            return [x + (dx / len) * expand, y + (dy / len) * expand];
        });
    }
    let minX = SIZE, maxX = 0, minY = SIZE, maxY = 0;
    for (const [vx, vy] of pts) {
        if (vx < minX) minX = vx; if (vx > maxX) maxX = vx;
        if (vy < minY) minY = vy; if (vy > maxY) maxY = vy;
    }
    minX = Math.max(0, Math.floor(minX));
    maxX = Math.min(SIZE - 1, Math.ceil(maxX));
    minY = Math.max(0, Math.floor(minY));
    maxY = Math.min(SIZE - 1, Math.ceil(maxY));
    for (let y = minY; y <= maxY; y++)
        for (let x = minX; x <= maxX; x++)
            if (pointInPoly(x + 0.5, y + 0.5, pts)) setPx(img, x, y, color);
}

function drawHammer(img) {
    // Hammer head (red) with grey handle running diagonally
    // Handle
    strokeLine(img, CX - 90, CY + 90, CX + 70, CY - 70, 22, rgba(110, 70, 40));
    // Head (rotated rectangle approximation: just a rectangle)
    fillRect(img, CX + 30, CY - 110, CX + 110, CY - 30, RED);
    fillRect(img, CX + 30, CY - 110, CX + 110, CY - 100, BLACK);
    fillRect(img, CX + 30, CY - 40, CX + 110, CY - 30, BLACK);
}

function drawRadar(img) {
    // Concentric arcs (transmission waves) above a small dish
    // Dish base
    fillRect(img, CX - 80, CY + 60, CX + 80, CY + 80, BLUE);
    fillRect(img, CX - 12, CY + 20, CX + 12, CY + 60, BLUE);
    // Dish parabola
    for (let a = 200; a <= 340; a += 1) {
        const r = 90;
        const x = CX + r * Math.cos((a * Math.PI) / 180);
        const y = CY + 30 + r * Math.sin((a * Math.PI) / 180);
        fillCircle(img, x, y, 6, BLUE);
    }
    // Waves
    for (let i = 0; i < 3; i++) {
        const r = 50 + i * 35;
        // top half arc only
        for (let a = 200; a <= 340; a += 1) {
            const x = CX + r * Math.cos((a * Math.PI) / 180);
            const y = CY - 30 + r * Math.sin((a * Math.PI) / 180);
            fillCircle(img, x, y, 5, BLUE);
        }
    }
}

function drawRecruit(img) {
    // Simple soldier silhouette (head + body) in green
    fillCircle(img, CX, CY - 50, 30, GREEN);
    fillRect(img, CX - 50, CY - 20, CX + 50, CY + 80, GREEN);
    // Helmet brim
    fillRect(img, CX - 35, CY - 80, CX + 35, CY - 70, BLACK);
}

function drawTerrain(img) {
    // Simple stylized terrain: a few darker patches and a tree-like blob
    fillCircle(img, CX - 80, CY + 60, 36, rgba(95, 120, 70));
    fillCircle(img, CX + 60, CY - 40, 28, rgba(95, 120, 70));
    fillCircle(img, CX + 80, CY + 80, 24, rgba(95, 120, 70));
    // Tree
    fillRect(img, CX - 8, CY + 5, CX + 8, CY + 60, rgba(90, 60, 30));
    fillCircle(img, CX, CY - 10, 50, rgba(50, 100, 50));
    fillCircle(img, CX - 30, CY + 5, 35, rgba(60, 110, 55));
    fillCircle(img, CX + 30, CY + 5, 35, rgba(60, 110, 55));
}

function drawSpaceport(img) {
    // Stylized rocket / landing pad triangle
    // Landing pad (purple ring)
    strokeCircle(img, CX, CY + 80, 90, 12, PURPLE);
    // Rocket body
    const tip = [CX, CY - 110];
    const left = [CX - 40, CY + 30];
    const right = [CX + 40, CY + 30];
    drawPolygon(img, [tip, left, right], WHITE);
    fillRect(img, CX - 40, CY + 30, CX + 40, CY + 70, WHITE);
    // Window
    fillCircle(img, CX, CY - 30, 14, BLUE);
    // Fins
    drawPolygon(img, [[CX - 40, CY + 30], [CX - 80, CY + 90], [CX - 40, CY + 70]], RED);
    drawPolygon(img, [[CX + 40, CY + 30], [CX + 80, CY + 90], [CX + 40, CY + 70]], RED);
}

function drawSeparatistFlag(img) {
    // Dark flag with skull-ish cross
    strokeLine(img, CX - 60, CY - 100, CX - 60, CY + 110, 12, rgba(90, 90, 95));
    fillRect(img, CX - 60, CY - 100, CX + 70, CY + 10, BLACK);
    // X mark
    strokeLine(img, CX - 40, CY - 80, CX + 50, CY - 10, 14, rgba(220, 60, 60));
    strokeLine(img, CX + 50, CY - 80, CX - 40, CY - 10, 14, rgba(220, 60, 60));
}

// ─── Number printing (top-right) ────────────────────────────────────
async function printNumber(img, n) {
    const font = await loadFont(path.join(FONT_DIR, "open-sans/open-sans-64-black/open-sans-64-black.fnt"));
    // Draw on a small badge top-right
    const badgeX = CX + 70, badgeY = CY - 150;
    fillCircle(img, badgeX + 30, badgeY + 30, 44, WHITE);
    strokeCircle(img, badgeX + 30, badgeY + 30, 44, 6, BLACK);
    img.print({ font, x: badgeX + 5, y: badgeY - 5, text: String(n) });
}

// ─── Per-tile factories ─────────────────────────────────────────────
async function makeTerrain() {
    const img = new Jimp({ width: SIZE, height: SIZE, color: TRANSPARENT });
    drawHexBorder(img, rgba(70, 95, 50), TERRAIN_BG);
    drawTerrain(img);
    await img.write(path.join(outDir, "hex_terrain.png"));
}

async function makeOil() {
    const img = new Jimp({ width: SIZE, height: SIZE, color: TRANSPARENT });
    drawHexBorder(img, BLACK, RESOURCE_BG);
    drawOilDrum(img);
    await img.write(path.join(outDir, "hex_oil.png"));
}

async function makePower() {
    const img = new Jimp({ width: SIZE, height: SIZE, color: TRANSPARENT });
    drawHexBorder(img, YELLOW, RESOURCE_BG);
    drawLightning(img);
    await img.write(path.join(outDir, "hex_power.png"));
}

async function makeFactory() {
    const img = new Jimp({ width: SIZE, height: SIZE, color: TRANSPARENT });
    drawHexBorder(img, RED, RESOURCE_BG);
    drawHammer(img);
    await img.write(path.join(outDir, "hex_factory.png"));
}

async function makeRadar() {
    const img = new Jimp({ width: SIZE, height: SIZE, color: TRANSPARENT });
    drawHexBorder(img, BLUE, RESOURCE_BG);
    drawRadar(img);
    await img.write(path.join(outDir, "hex_radar.png"));
}

async function makeCity() {
    const img = new Jimp({ width: SIZE, height: SIZE, color: TRANSPARENT });
    drawHexBorder(img, GREEN, RESOURCE_BG);
    drawRecruit(img);
    await img.write(path.join(outDir, "hex_city.png"));
}

async function makeSeparatist(n) {
    const img = new Jimp({ width: SIZE, height: SIZE, color: TRANSPARENT });
    drawHexBorder(img, GREY, SEP_BG);
    drawSeparatistFlag(img);
    await printNumber(img, n);
    await img.write(path.join(outDir, `hex_separatist_${n}.png`));
}

async function makeSpaceport(n) {
    const img = new Jimp({ width: SIZE, height: SIZE, color: TRANSPARENT });
    drawHexBorder(img, PURPLE, SPACEPORT_BG);
    drawSpaceport(img);
    await printNumber(img, n);
    await img.write(path.join(outDir, `hex_spaceport_${n}.png`));
}

(async () => {
    await makeTerrain();
    await makeOil();
    await makePower();
    await makeFactory();
    await makeRadar();
    await makeCity();
    for (const n of [2, 4, 6]) await makeSeparatist(n);
    for (const n of [1, 2, 3, 4, 5, 6]) await makeSpaceport(n);
    console.log(`✅ Hex tile textures written to ${outDir}/hex_*.png (${VERSION})`);
})();
