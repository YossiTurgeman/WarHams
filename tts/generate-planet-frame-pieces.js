#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Planet Frame Piece Texture Generator
 *
 * Generates a single trapezoidal puzzle-piece texture used for ALL 6
 * Planet Frame pieces.  The pieces follow the hex-grid perimeter:
 *
 *   Hex cluster outer hexagon (pointy-top):
 *     – circumradius = 27.34 world  (cluster of radius-4 flat-top
 *       hexes, R = 3.5)
 *     – side length  = 27.34 world  (regular hexagon ⇒ side = R)
 *     – apothem      = 23.67 world  (= R·cos30°)
 *
 *   Frame trapezoid (one piece per side, 6 pieces total):
 *     – inner side (toward planet) = 27.34 world
 *     – outer side (away from planet) = 32 world
 *     – radial depth = 4 world
 *
 * The piece's two slanted radial edges have a jigsaw MUSHROOM TAB on
 * the LEFT and a matching NOTCH on the RIGHT — adjacent pieces
 * interlock as you'd expect from a real puzzle.
 *
 * Color is sky/atmosphere blue per user request.  Five LARGE letter
 * badges (a–e) sit along the inner edge as movement-wrap markers.
 *
 * Usage:   node generate-planet-frame-pieces.js
 * Outputs: tts/v<VERSION>/planet-frame-segment.png      (new filename
 *          to avoid TTS cache hit on the prior round version)
 */

const path = require("path");
const fs = require("fs");
const { Jimp, loadFont } = require("jimp");

const VERSION = "v65";
const outDir = path.join(__dirname, VERSION);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const FONT_DIR = path.join(__dirname, "..", "node_modules", "@jimp", "plugin-print", "dist", "fonts");

// ─── Geometry (100 px per world unit) ───────────────────────────────
const PX = 100;
const INNER_LEN_W = 27.34;       // world (cluster outer-hex side)
const OUTER_LEN_W = 32.00;       // world
const DEPTH_W     = 4.00;        // world (radial)
// Texture canvas: pad ~2 world on each side for jigsaw tab overhang.
const W = (OUTER_LEN_W + 4) * PX;        // 3600 px = 36 world
const H = (DEPTH_W + 1)     * PX;        //  500 px = 5  world
// Trapezoid corners in texture coords (y=0 is outer/away from planet,
// y=H is inner/toward planet).
const Y_OUTER = 50;   // 0.5 world top padding
const Y_INNER = H - 50;
const X_OUTER_L = (W - OUTER_LEN_W * PX) / 2;     // 200
const X_OUTER_R = W - X_OUTER_L;                  // 3400
const X_INNER_L = (W - INNER_LEN_W * PX) / 2;     // 433
const X_INNER_R = W - X_INNER_L;                  // 3167

// ─── Color palette ──────────────────────────────────────────────────
function rgba(r, g, b, a = 255) {
    return (((r & 0xff) << 24) | ((g & 0xff) << 16) | ((b & 0xff) << 8) | (a & 0xff)) >>> 0;
}
const TRANSPARENT = 0x00000000;
const ATMO        = rgba( 70, 130, 200);     // atmosphere blue
const ATMO_DARK   = rgba( 40,  90, 150);     // outline / shadow
const ATMO_LIGHT  = rgba(140, 190, 230);     // highlight
const WHITE       = rgba(245, 245, 248);
const BLACK       = rgba( 18,  22,  30);

// ─── Pixel helpers ──────────────────────────────────────────────────
function setPx(img, x, y, color) {
    x = x | 0; y = y | 0;
    if (x >= 0 && x < W && y >= 0 && y < H) img.setPixelColor(color, x, y);
}
function fillRect(img, x1, y1, x2, y2, color) {
    if (x1 > x2) [x1, x2] = [x2, x1];
    if (y1 > y2) [y1, y2] = [y2, y1];
    for (let y = y1 | 0; y <= (x2 - x2 + (y2 | 0)); y++) {
        for (let x = x1 | 0; x <= (x2 | 0); x++) setPx(img, x, y, color);
    }
}
function fillCircle(img, cx, cy, r, color) {
    const r2 = r * r;
    for (let y = -r; y <= r; y++)
        for (let x = -r; x <= r; x++)
            if (x * x + y * y <= r2) setPx(img, cx + x, cy + y, color);
}
function strokeCircle(img, cx, cy, r, t, color) {
    const ro2 = r * r, ri2 = (r - t) * (r - t);
    for (let y = -r; y <= r; y++)
        for (let x = -r; x <= r; x++) {
            const d = x * x + y * y;
            if (d <= ro2 && d >= ri2) setPx(img, cx + x, cy + y, color);
        }
}
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
function fillPoly(img, poly, color) {
    let minX = W, maxX = 0, minY = H, maxY = 0;
    for (const [x, y] of poly) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    minX = Math.max(0, Math.floor(minX));
    maxX = Math.min(W - 1, Math.ceil(maxX));
    minY = Math.max(0, Math.floor(minY));
    maxY = Math.min(H - 1, Math.ceil(maxY));
    for (let y = minY; y <= maxY; y++)
        for (let x = minX; x <= maxX; x++)
            if (pointInPoly(x + 0.5, y + 0.5, poly)) setPx(img, x, y, color);
}
function strokeLine(img, x1, y1, x2, y2, t, color) {
    const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
    let err = dx - dy, x = x1, y = y1;
    const half = Math.max(0, Math.floor(t / 2));
    while (true) {
        fillCircle(img, x, y, half, color);
        if (x === x2 && y === y2) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
    }
}

// ─── Build the piece ────────────────────────────────────────────────
async function build() {
    const img = new Jimp({ width: W, height: H, color: TRANSPARENT });

    // 1. Trapezoid body (atmosphere blue).
    const trap = [
        [X_OUTER_L, Y_OUTER],
        [X_OUTER_R, Y_OUTER],
        [X_INNER_R, Y_INNER],
        [X_INNER_L, Y_INNER],
    ];
    fillPoly(img, trap, ATMO);

    // 2. Jigsaw mushroom TAB on the LEFT slanted edge (extending OUT).
    //    Neck base sits ON the slanted edge midpoint; head sits OUTSIDE
    //    the trapezoid, in the transparent area.
    const leftMidX = (X_OUTER_L + X_INNER_L) / 2;
    const leftMidY = (Y_OUTER  + Y_INNER ) / 2;
    // Slant unit vector (along left edge from outer→inner)
    const dxL = X_INNER_L - X_OUTER_L;
    const dyL = Y_INNER  - Y_OUTER;
    const lenL = Math.hypot(dxL, dyL);
    const ux = dxL / lenL, uy = dyL / lenL;     // along edge
    const nx = -uy, ny = ux;                    // perpendicular (outward = LEFT)
    // Tab geometry
    const NECK_HALF = 60;     // px (= 0.6 world half-width)
    const NECK_LEN  = 90;     // px (out from edge before head)
    const HEAD_R    = 110;    // px head radius
    function pt(off_along, off_out) {
        return [leftMidX + off_along * ux + off_out * nx,
                leftMidY + off_along * uy + off_out * ny];
    }
    // Neck rectangle: from (-NECK_HALF, 0) inside to (+NECK_HALF, NECK_LEN) outside
    fillPoly(img, [
        pt(-NECK_HALF, -10), pt(NECK_HALF, -10),
        pt(NECK_HALF,  NECK_LEN), pt(-NECK_HALF, NECK_LEN),
    ], ATMO);
    // Head circle, centred NECK_LEN+HEAD_R*0.7 outside
    {
        const [hx, hy] = pt(0, NECK_LEN + HEAD_R * 0.7);
        fillCircle(img, hx, hy, HEAD_R, ATMO);
    }

    // 3. Jigsaw NOTCH on the RIGHT slanted edge (cut INTO the trapezoid).
    // Outward normal for RIGHT edge is (uy, -ux) (90° CCW rotation of
    // the u vector — flipped sign vs left edge because the body is on
    // the LEFT of the right edge instead of the right of the left edge).
    const rightMidX = (X_OUTER_R + X_INNER_R) / 2;
    const rightMidY = (Y_OUTER  + Y_INNER ) / 2;
    const dxR = X_INNER_R - X_OUTER_R;
    const dyR = Y_INNER  - Y_OUTER;
    const lenR = Math.hypot(dxR, dyR);
    const uxR = dxR / lenR, uyR = dyR / lenR;
    const nxR = uyR, nyR = -uxR;                 // perpendicular OUTWARD (right)
    function ptR(off_along, off_out) {
        return [rightMidX + off_along * uxR + off_out * nxR,
                rightMidY + off_along * uyR + off_out * nyR];
    }
    // Erase neck rectangle — go INWARD (negative off_out) to cut into body.
    fillPoly(img, [
        ptR(-NECK_HALF,  10), ptR(NECK_HALF,  10),
        ptR(NECK_HALF,  -NECK_LEN), ptR(-NECK_HALF, -NECK_LEN),
    ], TRANSPARENT);
    // Erase head circle inside the trapezoid (also INWARD).
    {
        const [hx, hy] = ptR(0, -(NECK_LEN + HEAD_R * 0.7));
        fillCircle(img, hx, hy, HEAD_R, TRANSPARENT);
    }

    // 4. Subtle outline along the trapezoid + tab/notch edges.
    function strokeOutline(color) {
        const t = 6;
        // Outer side
        strokeLine(img, X_OUTER_L, Y_OUTER, X_OUTER_R, Y_OUTER, t, color);
        // Inner side
        strokeLine(img, X_INNER_L, Y_INNER, X_INNER_R, Y_INNER, t, color);
        // Left slanted edge — split around the tab base
        // (segments above and below the neck)
        const tabBaseTop_x  = leftMidX - NECK_HALF * ux;
        const tabBaseTop_y  = leftMidY - NECK_HALF * uy;
        const tabBaseBot_x  = leftMidX + NECK_HALF * ux;
        const tabBaseBot_y  = leftMidY + NECK_HALF * uy;
        strokeLine(img, X_OUTER_L | 0, Y_OUTER | 0,
                       tabBaseTop_x | 0, tabBaseTop_y | 0, t, color);
        strokeLine(img, tabBaseBot_x | 0, tabBaseBot_y | 0,
                       X_INNER_L | 0, Y_INNER | 0, t, color);
        // Tab perimeter
        const [neckOutTop_x, neckOutTop_y] = pt(-NECK_HALF, NECK_LEN);
        const [neckOutBot_x, neckOutBot_y] = pt( NECK_HALF, NECK_LEN);
        strokeLine(img, tabBaseTop_x | 0, tabBaseTop_y | 0,
                       neckOutTop_x | 0, neckOutTop_y | 0, t, color);
        strokeLine(img, tabBaseBot_x | 0, tabBaseBot_y | 0,
                       neckOutBot_x | 0, neckOutBot_y | 0, t, color);
        const [headCx, headCy] = pt(0, NECK_LEN + HEAD_R * 0.7);
        strokeCircle(img, headCx | 0, headCy | 0, HEAD_R, t, color);

        // Right slanted edge — split around the notch
        const notchBaseTop_x = rightMidX - NECK_HALF * uxR;
        const notchBaseTop_y = rightMidY - NECK_HALF * uyR;
        const notchBaseBot_x = rightMidX + NECK_HALF * uxR;
        const notchBaseBot_y = rightMidY + NECK_HALF * uyR;
        strokeLine(img, X_OUTER_R | 0, Y_OUTER | 0,
                       notchBaseTop_x | 0, notchBaseTop_y | 0, t, color);
        strokeLine(img, notchBaseBot_x | 0, notchBaseBot_y | 0,
                       X_INNER_R | 0, Y_INNER | 0, t, color);
        // Notch perimeter (inside the trapezoid)
        const [nNeckInTop_x, nNeckInTop_y] = ptR(-NECK_HALF, -NECK_LEN);
        const [nNeckInBot_x, nNeckInBot_y] = ptR( NECK_HALF, -NECK_LEN);
        strokeLine(img, notchBaseTop_x | 0, notchBaseTop_y | 0,
                       nNeckInTop_x | 0, nNeckInTop_y | 0, t, color);
        strokeLine(img, notchBaseBot_x | 0, notchBaseBot_y | 0,
                       nNeckInBot_x | 0, nNeckInBot_y | 0, t, color);
        const [nHeadCx, nHeadCy] = ptR(0, -(NECK_LEN + HEAD_R * 0.7));
        strokeCircle(img, nHeadCx | 0, nHeadCy | 0, HEAD_R, t, color);
    }
    strokeOutline(ATMO_DARK);

    // 5. LARGE letter badges (a..e) along the inner edge.
    const titleFont = await loadFont(path.join(FONT_DIR, "open-sans/open-sans-64-black/open-sans-64-black.fnt"));
    const letters = ["a", "b", "c", "d", "e"];
    const innerLen = X_INNER_R - X_INNER_L;
    for (let i = 0; i < letters.length; i++) {
        const t = (i + 0.5) / letters.length;
        const cx = X_INNER_L + t * innerLen;
        const cy = Y_INNER - 70;          // 70 px above inner edge
        // White circular badge with dark outline
        fillCircle(img, cx, cy, 55, WHITE);
        strokeCircle(img, cx, cy, 55, 6, ATMO_DARK);
        img.print({ font: titleFont, x: cx - 18, y: cy - 38, text: letters[i] });
    }

    await img.write(path.join(outDir, "planet-frame-segment.png"));
    console.log(`✅ Planet Frame segment texture written to ${outDir}/planet-frame-segment.png (${VERSION})`);
}

build();
