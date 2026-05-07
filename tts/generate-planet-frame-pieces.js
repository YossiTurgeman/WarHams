#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Planet Frame Piece Texture Generator
 *
 * Generates a single wedge texture used for all 5 interlocking
 * puzzle pieces of the Planet Frame. Each piece spans 72° of arc
 * around the hex cluster.
 *
 *   Hex cluster: radius-4 flat-top hex grid, R=3.5 world
 *     → outermost extent ≈ 27.75 world from center.
 *   Frame ring: inner radius 28 world, outer 32 world (width = 4).
 *   Each piece bounding tile: ~30 wide × 10 deep world.
 *
 * Texture: 3000 × 1000 px (= 30 × 10 world @ 100 px/world, matching
 * the PB px/world ratio).  Rendered with the wedge drawn at the
 * texture's "south" side (closer to planet center) and transparent
 * everywhere else.
 *
 * Each piece tile is placed at (planet_center + 30·dir, ...) with
 * rotY = 180 + i·72° so its texture-south faces the planet center.
 *
 * The two radial edges have a circular tab on the LEFT and a
 * matching notch on the RIGHT — adjacent pieces interlock, jigsaw-
 * style.
 *
 * Usage:   node generate-planet-frame-pieces.js
 * Outputs: tts/v<VERSION>/planet-frame-piece.png
 */

const path = require("path");
const fs = require("fs");
const { Jimp, loadFont } = require("jimp");

const VERSION = "v65";          // adding new file under existing dir
const outDir = path.join(__dirname, VERSION);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ─── Geometry (in texture pixels, 100 px/world) ─────────────────────
// Wedge bounding box (chord at outer radius × bbox depth):
//   width  = 2 · R_OUTER · sin(36°) ≈ 37.6 world
//   depth  = R_OUTER − R_INNER · cos(36°) ≈ 9.35 world
// Pick texture 4000×1000 px (= 40×10 world @ 100 px/world) for
// padding, and place planet-center off-canvas so the bbox centre
// sits exactly at the texture centre.
const W = 4000;
const H = 1000;
const PX_PER_WORLD = 100;
const R_INNER = 28 * PX_PER_WORLD;        // 2800
const R_OUTER = 32 * PX_PER_WORLD;        // 3200
const R_MID   = (R_INNER + R_OUTER) / 2;  // 3000
const HALF_ANGLE_DEG = 36;                // 72° wedge / 2
const COS_HA = Math.cos(HALF_ANGLE_DEG * Math.PI / 180);
const PC_X = W / 2;
// Place planet centre below canvas so the wedge bbox (between
// y = PC_Y − R_OUTER and y = PC_Y − R_INNER·cos(36°)) is vertically
// centred on the texture.
const PC_Y = H / 2 + (R_OUTER + R_INNER * COS_HA) / 2;

// ─── Color palette ──────────────────────────────────────────────────
function rgba(r, g, b, a = 255) {
    return (((r & 0xff) << 24) | ((g & 0xff) << 16) | ((b & 0xff) << 8) | (a & 0xff)) >>> 0;
}
const TRANSPARENT = 0x00000000;
const TAN_LIGHT = rgba(217, 184, 130);
const TAN_MID   = rgba(190, 155, 100);
const TAN_DARK  = rgba(120,  90,  55);

// ─── Pixel helpers ──────────────────────────────────────────────────
function setPx(img, x, y, color) {
    x = x | 0; y = y | 0;
    if (x >= 0 && x < W && y >= 0 && y < H) img.setPixelColor(color, x, y);
}
function fillCircle(img, cx, cy, r, color) {
    const r2 = r * r;
    const lox = Math.max(0, Math.floor(cx - r));
    const hix = Math.min(W - 1, Math.ceil(cx + r));
    const loy = Math.max(0, Math.floor(cy - r));
    const hiy = Math.min(H - 1, Math.ceil(cy + r));
    for (let y = loy; y <= hiy; y++)
        for (let x = lox; x <= hix; x++) {
            const dx = x - cx, dy = y - cy;
            if (dx * dx + dy * dy <= r2) setPx(img, x, y, color);
        }
}

// ─── Build the wedge ────────────────────────────────────────────────
//
// Tab / notch geometry (jigsaw):
//   On the LEFT radial edge (theta = -HALF_ANGLE_DEG): add a
//     circular TAB (extra cardboard outside the wedge boundary).
//   On the RIGHT radial edge (theta = +HALF_ANGLE_DEG): cut a
//     circular NOTCH (subtract a disk straddling the boundary).
//   Both centered at the mid-radius and same diameter, so adjacent
//   pieces interlock cleanly.
const TAB_R = 90;    // px (= 0.9 world units)

async function build() {
    const img = new Jimp({ width: W, height: H, color: TRANSPARENT });

    // Mid-radius angles for the tab/notch centers.
    const halfA = HALF_ANGLE_DEG * Math.PI / 180;
    const tabAng = -halfA;
    const notchAng = halfA;
    // Position of tab center: on the LEFT radial edge at midradius,
    // shifted slightly OUTWARD along the boundary normal so that
    // half the tab is outside the wedge.
    function polar(r, theta) {
        // theta measured from "up" (toward planet center direction).
        // up = -y direction in texture (planet center is at +y).
        return [PC_X + r * Math.sin(theta), PC_Y - r * Math.cos(theta)];
    }
    const [tabCx, tabCy] = polar(R_MID, tabAng);
    const [notchCx, notchCy] = polar(R_MID, notchAng);

    // Pass over the wedge area (annulus + tab − notch).
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const dx = x - PC_X, dy = y - PC_Y;
            const r = Math.hypot(dx, dy);
            // Angle from "up" (negative y direction). theta=0 straight up,
            // positive = clockwise when viewed from camera (texture +x).
            const theta = Math.atan2(dx, -dy); // radians

            const inAnnulus = (r >= R_INNER && r <= R_OUTER);
            const inWedge   = (theta >= -halfA && theta <= halfA);
            let inside = inAnnulus && inWedge;

            // Tab: circle on the LEFT radial edge.
            const dt = Math.hypot(x - tabCx, y - tabCy);
            if (!inside && dt <= TAB_R && r >= R_INNER && r <= R_OUTER) inside = true;

            // Notch: cut from the wedge near the RIGHT radial edge.
            const dn = Math.hypot(x - notchCx, y - notchCy);
            if (inside && dn <= TAB_R) inside = false;

            if (inside) setPx(img, x, y, TAN_LIGHT);
        }
    }

    // Subtle wood-grain noise inside the wedge.
    for (let i = 0; i < 6000; i++) {
        const r = R_INNER + Math.random() * (R_OUTER - R_INNER);
        const theta = (Math.random() * 2 - 1) * halfA;
        const [x, y] = polar(r, theta);
        setPx(img, x, y, TAN_MID);
    }

    // Dark outline along inner & outer arcs and the two radial edges.
    function paintIfInWedge(img, x, y, color) {
        const dx = x - PC_X, dy = y - PC_Y;
        const r = Math.hypot(dx, dy);
        const theta = Math.atan2(dx, -dy);
        const inAnnulus = r >= R_INNER && r <= R_OUTER;
        const inWedge   = theta >= -halfA && theta <= halfA;
        const inside = inAnnulus && inWedge;
        const dt = Math.hypot(x - tabCx, y - tabCy);
        const dn = Math.hypot(x - notchCx, y - notchCy);
        const okTab = dt <= TAB_R && r >= R_INNER && r <= R_OUTER;
        const okNotch = dn <= TAB_R;
        const finalInside = (inside && !okNotch) || (!inside && okTab);
        if (finalInside) setPx(img, x, y, color);
    }

    // Inner & outer arc outlines (4 px thick).
    for (let a = -halfA - 0.3; a <= halfA + 0.3; a += 0.0005) {
        for (let dr = -2; dr <= 2; dr++) {
            const [xi, yi] = polar(R_INNER + dr, a);
            const [xo, yo] = polar(R_OUTER + dr, a);
            paintIfInWedge(img, xi, yi, TAN_DARK);
            paintIfInWedge(img, xo, yo, TAN_DARK);
        }
    }
    // Radial edge outlines (left & right, including around tab/notch).
    for (let r = R_INNER - 5; r <= R_OUTER + 5; r += 1) {
        for (let dt = -2; dt <= 2; dt++) {
            const tL = -halfA + dt * 0.0008;
            const tR =  halfA + dt * 0.0008;
            const [xL, yL] = polar(r, tL);
            const [xR, yR] = polar(r, tR);
            paintIfInWedge(img, xL, yL, TAN_DARK);
            paintIfInWedge(img, xR, yR, TAN_DARK);
        }
    }

    await img.write(path.join(outDir, "planet-frame-piece.png"));
    console.log(`✅ Planet Frame piece texture written to ${outDir}/planet-frame-piece.png (${VERSION})`);
}

build();
